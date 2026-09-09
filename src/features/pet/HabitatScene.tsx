import type { ReactNode } from 'react';

const ART_ROOT = `${import.meta.env.BASE_URL}art/habitats`;
const HABITATS = new Set([
  'beach',
  'meadow',
  'bush',
  'picnic',
  'sunset',
  'night',
  'rainforest',
  'cafe',
  'lighthouse',
]);

export function HabitatScene({
  habitatId,
  children,
  compact = false,
}: {
  habitatId: string;
  children: ReactNode;
  compact?: boolean;
}) {
  const scene = HABITATS.has(habitatId) ? habitatId : 'beach';
  const minHeight = compact ? 210 : 260;

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-sand-200 bg-cover bg-center shadow-soft ring-1 ring-white/60"
      style={{ backgroundImage: `url(${ART_ROOT}/${scene}.webp)`, minHeight }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-bark-900/20" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/15 to-transparent" />
      <div className="relative flex items-end justify-center pt-6 pb-1" style={{ minHeight }}>
        {children}
      </div>
    </div>
  );
}
