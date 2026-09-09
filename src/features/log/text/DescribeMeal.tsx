import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { parseMealText } from '@/lib/ai/claudeClient';
import { useAnalyse } from '../useAnalyse';
import { Thinking } from '../Thinking';
import { db } from '@/lib/db/db';

const EXAMPLES = [
  '2 eggs on toast with butter',
  'Chicken schnitzel with chips and salad from the pub',
  'Large flat white, full cream',
  'Bowl of Weet-Bix with milk and a banana',
  'Half a Domino\'s pepperoni pizza',
];

export default function DescribeMeal() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const draftId = params.get('draft');
  const [text, setText] = useState('');
  const { run, cancel, busy, error, retryIn } = useAnalyse();

  useEffect(() => {
    if (!draftId) return;
    db.drafts.get(draftId).then((d) => {
      if (d?.text) setText(d.text);
    });
  }, [draftId]);

  async function go() {
    const t = text.trim();
    if (!t) return;
    await run({ source: 'text', rawInput: t, call: (signal) => parseMealText(t, { signal }) });
    if (draftId) await db.drafts.delete(draftId);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button className="btn-ghost -ml-3 px-3" onClick={() => nav(-1)} aria-label="Back">←</button>
        <h1 className="text-xl font-black">Describe your meal</h1>
      </div>
      <textarea
        className="input min-h-32 text-lg"
        placeholder="What did you eat? Brands and sizes help."
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        disabled={busy}
      />
      {!text && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="chip bg-sand-200 text-bark-700" onClick={() => setText(ex)}>
              {ex}
            </button>
          ))}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-berry-100 text-berry-500 px-4 py-3 text-sm font-semibold">
          {error}
          {retryIn && retryIn > 0 ? ` (${retryIn}s)` : ''}
        </div>
      )}
      {busy ? (
        <Thinking onCancel={cancel} />
      ) : (
        <button className="btn-primary text-lg" disabled={!text.trim() || (retryIn ?? 0) > 0} onClick={go}>
          Work it out
        </button>
      )}
      <p className="text-xs text-bark-500 text-center">
        Uses your Claude key. Roughly half a cent per description.
      </p>
    </div>
  );
}
