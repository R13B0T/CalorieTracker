export type AiErrorKind =
  | 'no_key'
  | 'bad_key'
  | 'rate_limited'
  | 'offline'
  | 'server'
  | 'refused'
  | 'schema'
  | 'too_large'
  | 'aborted'
  | 'unknown';

export class AiError extends Error {
  constructor(
    public kind: AiErrorKind,
    message: string,
    public retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

export const AI_ERROR_COPY: Record<AiErrorKind, string> = {
  no_key: 'Add your Claude API key in Settings before using AI features.',
  bad_key: 'Claude rejected that API key. Check it in Settings.',
  rate_limited: 'Claude is a bit busy. Give it a moment and try again.',
  offline: "You're offline. Your draft is saved, tap Analyse when you're back.",
  server: 'Claude had a hiccup on its end. Try again in a moment.',
  refused: "Claude wouldn't analyse that one. Try describing it in words instead.",
  schema: "Claude's answer came back garbled. Try again or log it manually.",
  too_large: 'That photo is too big even after squashing it. Try a closer shot.',
  aborted: 'Cancelled.',
  unknown: 'Something odd happened talking to Claude. Try again.',
};

export function describeAiError(e: unknown): string {
  if (e instanceof AiError) return AI_ERROR_COPY[e.kind];
  return AI_ERROR_COPY.unknown;
}
