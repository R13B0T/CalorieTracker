import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { z } from 'zod';
import { db } from '../db/db';
import type { Persona } from '../db/types';
import { AiError } from './errors';
import { supportsAdaptiveThinking } from './models';
import {
  ExerciseEstimateSchema,
  MealAnalysisSchema,
  type ExerciseEstimate,
  type MealAnalysis,
} from './schemas';
import { MEAL_SYSTEM_PROMPT, PHOTO_USER_DEFAULT, TEXT_USER_PREFIX, refinePrompt } from './prompts/meal';
import { EXERCISE_SYSTEM_PROMPT } from './prompts/exercise';
import { COACH_RULES } from './prompts/coach';
import { PERSONAS } from './personas';

export interface CallOptions {
  model?: string;
  signal?: AbortSignal;
}

let cached: { key: string; client: Anthropic } | null = null;

function makeClient(apiKey: string): Anthropic {
  if (cached && cached.key === apiKey) return cached.client;
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
    maxRetries: 2,
    timeout: 60_000,
  });
  cached = { key: apiKey, client };
  return client;
}

async function getSettings() {
  const s = await db.settings.get('me');
  if (!s?.apiKey) throw new AiError('no_key', 'No API key');
  return { client: makeClient(s.apiKey), settings: s };
}

export function toAiError(e: unknown): AiError {
  if (e instanceof AiError) return e;
  if (e instanceof DOMException && e.name === 'AbortError') return new AiError('aborted', 'Aborted');
  if (e instanceof Anthropic.AuthenticationError) return new AiError('bad_key', e.message);
  if (e instanceof Anthropic.PermissionDeniedError) return new AiError('bad_key', e.message);
  if (e instanceof Anthropic.RateLimitError) {
    const ra = Number(e.headers?.get?.('retry-after'));
    return new AiError('rate_limited', e.message, Number.isFinite(ra) && ra > 0 ? ra * 1000 : 15_000);
  }
  if (e instanceof Anthropic.BadRequestError) {
    if (/too large|exceeds|image/i.test(e.message)) return new AiError('too_large', e.message);
    return new AiError('unknown', e.message);
  }
  if (e instanceof Anthropic.InternalServerError) return new AiError('server', e.message);
  if (e instanceof Anthropic.APIConnectionError) return new AiError('offline', e.message);
  if (e instanceof Anthropic.APIError) return new AiError('server', e.message);
  if (typeof navigator !== 'undefined' && !navigator.onLine) return new AiError('offline', 'Offline');
  return new AiError('unknown', e instanceof Error ? e.message : String(e));
}

/** Validates a key with a token-free call and returns the model ids it can see. */
export async function testKey(
  apiKey: string,
): Promise<{ ok: true; models: string[] } | { ok: false; error: AiError }> {
  try {
    const client = makeClient(apiKey);
    const page = await client.models.list({ limit: 50 });
    return { ok: true, models: page.data.map((m) => m.id) };
  } catch (e) {
    return { ok: false, error: toAiError(e) };
  }
}

type ContentBlocks = Anthropic.MessageCreateParams['messages'][number]['content'];

async function structured<S extends z.ZodType>(
  schema: S,
  system: string,
  content: ContentBlocks,
  model: string,
  maxTokens: number,
  signal?: AbortSignal,
  retryOnSchema = true,
): Promise<z.infer<S>> {
  const { client } = await getSettings();
  const adaptive = supportsAdaptiveThinking(model);
  try {
    const res = await client.messages.parse(
      {
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content }],
        ...(adaptive
          ? {
              thinking: { type: 'adaptive' as const },
              output_config: { effort: 'low' as const, format: zodOutputFormat(schema) },
            }
          : { output_config: { format: zodOutputFormat(schema) } }),
      },
      { signal },
    );
    if (res.stop_reason === 'refusal') throw new AiError('refused', 'Refused');
    if (res.stop_reason === 'max_tokens') throw new AiError('schema', 'Truncated');
    if (!res.parsed_output) {
      if (retryOnSchema) {
        const retryContent: ContentBlocks = Array.isArray(content)
          ? [
              ...content,
              {
                type: 'text',
                text: 'Your previous answer did not match the required JSON schema. Answer again, strictly following the schema.',
              },
            ]
          : content;
        return structured(schema, system, retryContent, model, maxTokens, signal, false);
      }
      throw new AiError('schema', 'Unparseable');
    }
    return res.parsed_output;
  } catch (e) {
    throw toAiError(e);
  }
}

export async function analyseMealPhoto(
  imageBase64Jpeg: string,
  hint?: string,
  opts: CallOptions = {},
): Promise<MealAnalysis> {
  const { settings } = await getSettings();
  const model = opts.model ?? settings.visionModel;
  const content: ContentBlocks = [
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64Jpeg } },
    {
      type: 'text',
      text: hint?.trim()
        ? `${PHOTO_USER_DEFAULT} Extra context from the user: ${hint.trim()}`
        : PHOTO_USER_DEFAULT,
    },
  ];
  return structured(MealAnalysisSchema, MEAL_SYSTEM_PROMPT, content, model, 4096, opts.signal);
}

export async function parseMealText(text: string, opts: CallOptions = {}): Promise<MealAnalysis> {
  const { settings } = await getSettings();
  const model = opts.model ?? settings.textModel;
  return structured(
    MealAnalysisSchema,
    MEAL_SYSTEM_PROMPT,
    [{ type: 'text', text: TEXT_USER_PREFIX + text.trim() }],
    model,
    2048,
    opts.signal,
  );
}

export async function refineMeal(
  prev: MealAnalysis,
  correction: string,
  opts: CallOptions & { imageBase64?: string } = {},
): Promise<MealAnalysis> {
  const { settings } = await getSettings();
  const model = opts.model ?? (opts.imageBase64 ? settings.visionModel : settings.textModel);
  const content: Exclude<ContentBlocks, string> = [];
  if (opts.imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: opts.imageBase64 },
    });
  }
  content.push({ type: 'text', text: refinePrompt(JSON.stringify(prev), correction.trim()) });
  return structured(MealAnalysisSchema, MEAL_SYSTEM_PROMPT, content, model, 4096, opts.signal);
}

export async function estimateExercise(
  text: string,
  body: { weightKg: number; sex: string },
  opts: CallOptions = {},
): Promise<ExerciseEstimate> {
  const { settings } = await getSettings();
  const model = opts.model ?? settings.textModel;
  return structured(
    ExerciseEstimateSchema,
    EXERCISE_SYSTEM_PROMPT,
    [{ type: 'text', text: `Body mass: ${body.weightKg} kg (${body.sex}).\nActivity: ${text.trim()}` }],
    model,
    1024,
    opts.signal,
  );
}

export interface CoachContext {
  petName: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  kcalEaten: number;
  kcalTarget: number;
  proteinEaten: number;
  proteinTarget: number;
  streak: number;
  mood: string;
  lastMealTitle?: string;
  hoursSinceLastLog?: number;
  questsDone: number;
  questsTotal: number;
}

const SHAME_BLOCKLIST =
  /\b(bad|cheat|guilty|guilt|naughty|should have|shouldn't have|fat|lazy|disgusting|junk)\b/i;

export async function coachMessage(
  ctx: CoachContext,
  persona: Persona,
  opts: CallOptions = {},
): Promise<string> {
  const { client, settings } = await getSettings();
  const model = opts.model ?? settings.textModel;
  const card = PERSONAS[persona];
  try {
    const res = await client.messages.create(
      {
        model,
        max_tokens: 200,
        system: `${COACH_RULES}\n\nPersona: ${card.voice}`,
        messages: [
          {
            role: 'user',
            content: `Context (JSON): ${JSON.stringify(ctx)}\n\nSay one thing to me right now.`,
          },
        ],
      },
      { signal: opts.signal },
    );
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join(' ')
      .trim();
    if (!text || SHAME_BLOCKLIST.test(text)) return card.lines.greeting[0];
    return text;
  } catch (e) {
    throw toAiError(e);
  }
}
