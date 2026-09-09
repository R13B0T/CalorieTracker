import type { Confidence } from '@/lib/db/types';

const STYLE: Record<Confidence, { cls: string; label: string; hint: string }> = {
  high: {
    cls: 'bg-euc-100 text-euc-700',
    label: 'Sure',
    hint: 'Clearly visible with an obvious portion',
  },
  medium: {
    cls: 'bg-sun-300 text-bark-900',
    label: 'Fairly sure',
    hint: 'Visible, but the portion or recipe is a guess',
  },
  low: {
    cls: 'bg-berry-100 text-berry-500',
    label: 'Guessing',
    hint: 'Hidden, mixed or sauced. Worth a check.',
  },
};

export function ConfidenceBadge({ level, compact }: { level: Confidence; compact?: boolean }) {
  const s = STYLE[level];
  return (
    <span
      className={`chip ${s.cls}`}
      title={s.hint}
      aria-label={`Confidence: ${s.label}. ${s.hint}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {!compact && s.label}
    </span>
  );
}
