import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { db } from '@/lib/db/db';
import { newId } from '@/lib/id';
import { AiError, describeAiError } from '@/lib/ai/errors';
import type { MealAnalysis } from '@/lib/ai/schemas';
import type { MealSlot, Source } from '@/lib/db/types';
import { useSessionStore, toast } from '@/stores/useSessionStore';
import { suggestSlot } from '@/lib/db/repos/meals';

interface RunArgs {
  source: Source;
  slot?: MealSlot;
  rawInput?: string;
  imageBase64?: string;
  thumb?: Blob;
  call: (signal: AbortSignal) => Promise<MealAnalysis>;
}

/**
 * Shared "call Claude, handle every failure mode, land on the review screen" flow.
 * Offline or transient failures save a draft so nothing typed or photographed is lost.
 */
export function useAnalyse() {
  const nav = useNavigate();
  const setDraft = useSessionStore((s) => s.setDraft);
  const setAiBusy = useSessionStore((s) => s.setAiBusy);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryIn, setRetryIn] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (retryIn === null || retryIn <= 0) return;
    const t = setTimeout(() => setRetryIn((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [retryIn]);

  const run = useCallback(
    async (args: RunArgs) => {
      setError(null);
      setBusy(true);
      setAiBusy(true);
      const ac = new AbortController();
      abortRef.current = ac;
      const slot = args.slot ?? suggestSlot(Date.now());
      try {
        const settings = await db.settings.get('me');
        if (!settings?.apiKey) throw new AiError('no_key', 'no key');
        if (!navigator.onLine) throw new AiError('offline', 'offline');
        const analysis = await args.call(ac.signal);
        const model = args.source === 'photo' ? settings.visionModel : settings.textModel;
        setDraft({ analysis, source: args.source, slot, rawInput: args.rawInput, imageBase64: args.imageBase64, thumb: args.thumb, model });
        nav('/log/review');
      } catch (e) {
        const err = e instanceof AiError ? e : new AiError('unknown', String(e));
        if (err.kind === 'aborted') return;
        if (err.kind === 'offline' || err.kind === 'server' || err.kind === 'rate_limited') {
          await db.drafts.put({
            id: newId(),
            createdAt: Date.now(),
            kind: args.source === 'photo' ? 'photo' : 'text',
            text: args.rawInput,
            imageBase64: args.imageBase64,
            thumb: args.thumb,
            slot,
          });
          if (err.kind === 'rate_limited') setRetryIn(Math.ceil((err.retryAfterMs ?? 15000) / 1000));
        }
        if (err.kind === 'no_key') {
          toast(describeAiError(err), 'error');
          nav('/settings/key');
          return;
        }
        setError(describeAiError(err));
      } finally {
        setBusy(false);
        setAiBusy(false);
      }
    },
    [nav, setAiBusy, setDraft],
  );

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  return { run, cancel, busy, error, retryIn };
}
