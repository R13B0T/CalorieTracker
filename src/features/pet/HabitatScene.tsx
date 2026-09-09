import type { ReactNode } from 'react';

const SCENES: Record<string, { sky: string; ground: string; deco: ReactNode }> = {
  beach: {
    sky: 'linear-gradient(#bfe3f7, #e9f4fb)',
    ground: '#efd9a8',
    deco: (
      <>
        <div className="absolute left-4 top-4 h-10 w-10 rounded-full bg-sun-500 shadow-[0_0_30px_#f2b544]" />
        <div className="absolute inset-x-0 bottom-20 h-8 bg-sky-500/40 rounded-t-[50%]" />
      </>
    ),
  },
  bush: {
    sky: 'linear-gradient(#f7e6c0, #fbf3df)',
    ground: '#8fa86b',
    deco: (
      <>
        <div className="absolute right-6 top-6 text-5xl" aria-hidden>🌳</div>
        <div className="absolute left-6 top-12 text-4xl" aria-hidden>🌿</div>
      </>
    ),
  },
  night: {
    sky: 'linear-gradient(#1f2a44, #3b4a6b)',
    ground: '#2f3a52',
    deco: (
      <>
        <div className="absolute left-6 top-6 text-3xl" aria-hidden>🌙</div>
        <div className="absolute right-10 top-10 text-lg" aria-hidden>✨</div>
        <div className="absolute right-24 top-4 text-sm" aria-hidden>✨</div>
      </>
    ),
  },
  cafe: {
    sky: 'linear-gradient(#f3e3d3, #f8efe6)',
    ground: '#b98a68',
    deco: (
      <>
        <div className="absolute left-6 top-8 text-4xl" aria-hidden>☕</div>
        <div className="absolute right-6 top-6 text-3xl" aria-hidden>🪴</div>
      </>
    ),
  },
};

export function HabitatScene({ habitatId, children }: { habitatId: string; children: ReactNode }) {
  const s = SCENES[habitatId] ?? SCENES.beach;
  return (
    <div className="relative overflow-hidden rounded-3xl shadow-soft" style={{ background: s.sky, minHeight: 260 }}>
      {s.deco}
      <div className="absolute inset-x-0 bottom-0 h-20 rounded-t-[40%]" style={{ background: s.ground }} />
      <div className="relative flex items-end justify-center pt-6 pb-2" style={{ minHeight: 260 }}>{children}</div>
    </div>
  );
}
