import { useMemo } from 'react';
import type { FodmapDisplay, FoodItem } from '@/lib/db/types';
import {
  assessFodmap,
  FODMAP_GROUPS,
  MONASH_FODMAP_APP_URL,
  type FodmapRating,
} from '@/lib/nutrition/fodmap';

const RATING: Record<FodmapRating, { label: string; dot: string; badge: string; text: string }> = {
  low: {
    label: 'Low potential',
    dot: 'bg-euc-500',
    badge: 'bg-euc-100 text-euc-700',
    text: 'No common high-FODMAP sources found.',
  },
  moderate: {
    label: 'Moderate potential',
    dot: 'bg-sun-500',
    badge: 'bg-sun-300 text-bark-900',
    text: 'One or more foods may be portion-dependent.',
  },
  high: {
    label: 'High potential',
    dot: 'bg-berry-500',
    badge: 'bg-berry-100 text-berry-500',
    text: 'One or more common high-FODMAP sources were found.',
  },
  unknown: {
    label: 'Not enough info',
    dot: 'bg-bark-300',
    badge: 'bg-sand-200 text-bark-700',
    text: 'The food name or ingredients are not detailed enough to rate.',
  },
};

export function FodmapSummary({ items, display }: { items: FoodItem[]; display: FodmapDisplay }) {
  const result = useMemo(() => assessFodmap(items), [items]);
  const rating = RATING[result.overall];
  const flagged = result.flaggedItems.slice(0, 3).join(', ');

  return (
    <div className="border-t border-sand-200 pt-3 w-full" role="status" aria-label="FODMAP check">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-wide text-bark-500">
            FODMAP check
          </div>
          <div className="text-xs text-bark-500 mt-0.5">
            {rating.text}
            {flagged ? ` Check ${flagged}.` : ''}
          </div>
        </div>
        <span className={`chip shrink-0 ${rating.badge}`}>
          <span className={`h-2 w-2 rounded-full ${rating.dot}`} aria-hidden />
          {rating.label}
        </span>
      </div>

      {display === 'groups' && (
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {FODMAP_GROUPS.map(({ key, label }) => {
            const groupRating = RATING[result.groups[key]];
            return (
              <div key={key} className="rounded-lg bg-sand-100 px-2 py-1.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-black">
                  <span className={`h-1.5 w-1.5 rounded-full ${groupRating.dot}`} aria-hidden />
                  {groupRating.label
                    .replace(' potential', '')
                    .replace('Not enough info', 'Unclear')}
                </div>
                <div className="text-[10px] text-bark-500 font-semibold mt-0.5">{label}</div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-bark-500 mt-2">
        Indicative only—recipes, brands, serving sizes and personal tolerance vary. For tested foods
        and exact serves,{' '}
        <a
          className="font-bold underline underline-offset-2"
          href={MONASH_FODMAP_APP_URL}
          target="_blank"
          rel="noreferrer"
        >
          check the Monash FODMAP app
        </a>
        .
      </p>
    </div>
  );
}
