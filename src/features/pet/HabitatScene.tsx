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
  meadow: {
    sky: 'linear-gradient(#bfe5f4 0%, #f7efd2 68%)',
    ground: '#8fba6a',
    deco: (
      <>
        <div className="absolute right-7 top-5 h-9 w-9 rounded-full bg-sun-300 shadow-[0_0_24px_#f7cf68]" />
        <div className="absolute left-5 bottom-14 text-3xl" aria-hidden>
          🌼
        </div>
        <div className="absolute right-8 bottom-12 text-2xl" aria-hidden>
          🌸
        </div>
      </>
    ),
  },
  bush: {
    sky: 'linear-gradient(#f7e6c0, #fbf3df)',
    ground: '#8fa86b',
    deco: (
      <>
        <div className="absolute right-6 top-6 text-5xl" aria-hidden>
          🌳
        </div>
        <div className="absolute left-6 top-12 text-4xl" aria-hidden>
          🌿
        </div>
      </>
    ),
  },
  night: {
    sky: 'linear-gradient(#1f2a44, #3b4a6b)',
    ground: '#2f3a52',
    deco: (
      <>
        <div className="absolute left-6 top-6 text-3xl" aria-hidden>
          🌙
        </div>
        <div className="absolute right-10 top-10 text-lg" aria-hidden>
          ✨
        </div>
        <div className="absolute right-24 top-4 text-sm" aria-hidden>
          ✨
        </div>
      </>
    ),
  },
  picnic: {
    sky: 'linear-gradient(#b9dff2, #f8edd0)',
    ground: '#75a85f',
    deco: (
      <>
        <div className="absolute left-5 top-7 text-4xl" aria-hidden>
          🧺
        </div>
        <div className="absolute right-7 top-8 text-4xl" aria-hidden>
          ☁️
        </div>
        <div className="absolute left-1/2 bottom-5 h-12 w-28 -translate-x-1/2 rotate-2 rounded-md bg-berry-100/80 [background-image:linear-gradient(90deg,transparent_45%,#fff8_45%,#fff8_55%,transparent_55%),linear-gradient(transparent_45%,#fff8_45%,#fff8_55%,transparent_55%)] [background-size:24px_24px]" />
      </>
    ),
  },
  sunset: {
    sky: 'linear-gradient(#7f79a8 0%, #ee9a7d 46%, #f6ce83 74%)',
    ground: '#88654d',
    deco: (
      <>
        <div className="absolute left-7 top-8 h-11 w-11 rounded-full bg-sun-300 shadow-[0_0_28px_#ffd37f]" />
        <div className="absolute inset-x-0 bottom-16 h-8 rounded-t-[50%] bg-sky-500/35" />
        <div className="absolute right-8 top-9 text-xl text-white/80" aria-hidden>
          〰︎
        </div>
      </>
    ),
  },
  rainforest: {
    sky: 'linear-gradient(#486e62, #9fc0a0)',
    ground: '#365944',
    deco: (
      <>
        <div className="absolute -left-3 top-2 text-6xl" aria-hidden>
          🌿
        </div>
        <div className="absolute -right-2 top-5 text-6xl -scale-x-100" aria-hidden>
          🌿
        </div>
        <div className="absolute left-1/2 top-8 -translate-x-1/2 text-2xl" aria-hidden>
          💧
        </div>
      </>
    ),
  },
  cafe: {
    sky: 'linear-gradient(#f3e3d3, #f8efe6)',
    ground: '#b98a68',
    deco: (
      <>
        <div className="absolute left-6 top-8 text-4xl" aria-hidden>
          ☕
        </div>
        <div className="absolute right-6 top-6 text-3xl" aria-hidden>
          🪴
        </div>
      </>
    ),
  },
  lighthouse: {
    sky: 'linear-gradient(#9fd7ed, #eaf7fa)',
    ground: '#78936b',
    deco: (
      <>
        <div className="absolute left-7 top-5 flex flex-col items-center" aria-hidden>
          <div className="h-0 w-0 border-x-[16px] border-x-transparent border-b-[12px] border-b-bark-700" />
          <div className="h-4 w-8 rounded-t bg-sun-300 ring-2 ring-bark-700" />
          <div className="h-12 w-7 bg-[repeating-linear-gradient(to_bottom,#fffaf2_0_11px,#c95750_11px_22px)] [clip-path:polygon(16%_0,84%_0,100%_100%,0_100%)]" />
        </div>
        <div className="absolute inset-x-0 bottom-14 h-10 rounded-t-[45%] bg-sky-500/55" />
        <div className="absolute right-8 top-8 text-3xl" aria-hidden>
          🕊️
        </div>
      </>
    ),
  },
};

export function HabitatScene({
  habitatId,
  children,
  compact = false,
}: {
  habitatId: string;
  children: ReactNode;
  compact?: boolean;
}) {
  const s = SCENES[habitatId] ?? SCENES.beach;
  const minHeight = compact ? 210 : 260;
  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-soft"
      style={{ background: s.sky, minHeight }}
    >
      {s.deco}
      <div
        className="absolute inset-x-0 bottom-0 h-20 rounded-t-[40%]"
        style={{ background: s.ground }}
      />
      <div className="relative flex items-end justify-center pt-6 pb-2" style={{ minHeight }}>
        {children}
      </div>
    </div>
  );
}
