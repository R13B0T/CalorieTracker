export const DEFAULT_VISION_MODEL = 'claude-sonnet-5';
export const DEFAULT_TEXT_MODEL = 'claude-haiku-4-5';

export interface ModelOption {
  id: string;
  label: string;
  hint: string;
}

/** Curated list shown in Settings; anything returned by models.list() is added too. */
export const KNOWN_MODELS: ModelOption[] = [
  {
    id: 'claude-haiku-4-5',
    label: 'Haiku 4.5',
    hint: 'Cheapest and fastest. Great for text, weaker on photos.',
  },
  { id: 'claude-sonnet-5', label: 'Sonnet 5', hint: 'Best value for photos. Recommended.' },
  {
    id: 'claude-opus-5',
    label: 'Opus 5',
    hint: 'Sharper on tricky plates. Roughly 2.5x the cost of Sonnet.',
  },
  {
    id: 'claude-fable-5-1',
    label: 'Fable 5.1',
    hint: 'Top of the range. Overkill for lunch, but your call.',
  },
];

/** Haiku 4.5 still uses the older thinking API and rejects `effort`. */
export function supportsAdaptiveThinking(modelId: string): boolean {
  return !/haiku-4-5|sonnet-4-5|opus-4-5|claude-3/.test(modelId);
}
