import type { Mood, PetStage } from '@/lib/db/types';

export interface QuokkaSpriteProps {
  stage: PetStage;
  mood: Mood;
  outfitId?: string | null;
  size?: number;
  className?: string;
  animate?: boolean;
}

const FUR = '#a3815f';
const FUR_DARK = '#8b6a4e';
const BELLY = '#c9ab88';
const EAR_INNER = '#d9a88a';
const INK = '#2f2118';

function Eyes({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'ecstatic':
      return (
        <g fill={INK}>
          <path
            d="M70 92 q10 -12 20 0"
            stroke={INK}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M110 92 q10 -12 20 0"
            stroke={INK}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    case 'sleepy':
      return (
        <g stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round">
          <path d="M70 96 q10 6 20 0" />
          <path d="M110 96 q10 6 20 0" />
        </g>
      );
    case 'worried':
      return (
        <g>
          <circle cx="80" cy="96" r="9" fill={INK} />
          <circle cx="120" cy="96" r="9" fill={INK} />
          <circle cx="83" cy="93" r="3" fill="#fff" />
          <circle cx="123" cy="93" r="3" fill="#fff" />
          <path
            d="M66 80 l20 6 M134 80 l-20 6"
            stroke={INK}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      );
    case 'peckish':
      return (
        <g>
          <ellipse cx="80" cy="96" rx="9" ry="10" fill={INK} />
          <ellipse cx="120" cy="96" rx="9" ry="10" fill={INK} />
          <circle cx="83" cy="92" r="3.5" fill="#fff" />
          <circle cx="123" cy="92" r="3.5" fill="#fff" />
          <path
            d="M60 116 q6 -4 12 0"
            stroke="#7fb3d5"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    default:
      return (
        <g className="animate-blink">
          <circle cx="80" cy="96" r="10" fill={INK} />
          <circle cx="120" cy="96" r="10" fill={INK} />
          <circle cx="84" cy="92" r="3.5" fill="#fff" />
          <circle cx="124" cy="92" r="3.5" fill="#fff" />
        </g>
      );
  }
}

function Mouth({ mood }: { mood: Mood }) {
  const stroke = { stroke: INK, strokeWidth: 6, fill: 'none', strokeLinecap: 'round' as const };
  switch (mood) {
    case 'ecstatic':
      return (
        <g>
          <path d="M76 126 Q100 156 124 126 Z" fill={INK} />
          <path d="M86 138 Q100 148 114 138 Z" fill="#e57373" />
        </g>
      );
    case 'happy':
      return <path d="M78 126 Q100 150 122 126" {...stroke} />;
    case 'content':
      return <path d="M82 128 Q100 142 118 128" {...stroke} />;
    case 'sleepy':
      return <path d="M88 132 Q100 138 112 132" {...stroke} />;
    case 'peckish':
      return <ellipse cx="100" cy="132" rx="8" ry="6" fill={INK} />;
    case 'worried':
      return <path d="M84 136 Q100 126 116 136" {...stroke} />;
  }
}

function Outfit({ id }: { id: string | null | undefined }) {
  switch (id) {
    case 'bucket_hat':
      return (
        <g>
          <path d="M52 62 L148 62 L138 40 Q100 28 62 40 Z" fill="#5f8a6b" />
          <rect x="46" y="60" width="108" height="8" rx="4" fill="#3f6b4d" />
        </g>
      );
    case 'sunnies':
      return (
        <g>
          <rect x="62" y="84" width="36" height="22" rx="8" fill={INK} opacity="0.9" />
          <rect x="102" y="84" width="36" height="22" rx="8" fill={INK} opacity="0.9" />
          <path d="M98 94 h4" stroke={INK} strokeWidth="4" />
        </g>
      );
    case 'bow':
      return (
        <g fill="#c85a54">
          <path d="M120 54 l18 -10 v20 z" />
          <path d="M120 54 l-18 -10 v20 z" />
          <circle cx="120" cy="54" r="5" fill="#a8423d" />
        </g>
      );
    case 'crown':
      return (
        <g>
          <path d="M66 58 L74 36 L88 52 L100 30 L112 52 L126 36 L134 58 Z" fill="#f2b544" />
          <rect x="66" y="56" width="68" height="8" rx="3" fill="#d99a2b" />
          <circle cx="100" cy="46" r="4" fill="#c85a54" />
        </g>
      );
    case 'scarf':
      return (
        <g>
          <path d="M62 150 Q100 168 138 150 L138 162 Q100 180 62 162 Z" fill="#5b9bd5" />
          <path d="M120 158 l10 26 l12 -6 l-8 -22 z" fill="#4a86bd" />
        </g>
      );
    case 'leaf_crown':
      return (
        <g fill="#5f8a6b">
          <path d="M60 56 q14 -22 30 -6 q-16 4 -30 6z" />
          <path d="M140 56 q-14 -22 -30 -6 q16 4 30 6z" />
          <path d="M84 48 q16 -18 32 0 q-16 6 -32 0z" />
        </g>
      );
    default:
      return null;
  }
}

/**
 * Layered SVG quokka. Stage tweaks proportions and adds flair; mood drives the face.
 */
export function QuokkaSprite({
  stage,
  mood,
  outfitId,
  size = 160,
  className = '',
  animate,
}: QuokkaSpriteProps) {
  const headScale = stage === 'joey' ? 1.08 : stage === 'legend' ? 0.96 : 1;
  const bodyY = stage === 'joey' ? 8 : 0;
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`${animate ? 'animate-bob' : ''} ${className}`}
      role="img"
      aria-label={`A ${mood} ${stage} quokka`}
    >
      {stage === 'legend' && <circle cx="100" cy="104" r="92" fill="url(#aura)" opacity="0.5" />}
      <defs>
        <radialGradient id="aura">
          <stop offset="60%" stopColor="#f2b544" stopOpacity="0" />
          <stop offset="100%" stopColor="#f2b544" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      {/* body */}
      <g transform={`translate(0 ${bodyY})`}>
        <ellipse
          cx="100"
          cy="160"
          rx={stage === 'joey' ? 46 : 54}
          ry={stage === 'joey' ? 30 : 36}
          fill={FUR}
        />
        <ellipse
          cx="100"
          cy="166"
          rx={stage === 'joey' ? 28 : 34}
          ry={stage === 'joey' ? 20 : 24}
          fill={BELLY}
        />
        {/* feet */}
        <ellipse cx="72" cy="186" rx="16" ry="8" fill={FUR_DARK} />
        <ellipse cx="128" cy="186" rx="16" ry="8" fill={FUR_DARK} />
        {/* paws */}
        <ellipse cx="66" cy="152" rx="10" ry="8" fill={FUR_DARK} />
        <ellipse cx="134" cy="152" rx="10" ry="8" fill={FUR_DARK} />
      </g>
      {/* head */}
      <g transform={`translate(100 100) scale(${headScale}) translate(-100 -100)`}>
        <ellipse cx="58" cy="58" rx="22" ry="26" fill={FUR_DARK} />
        <ellipse cx="142" cy="58" rx="22" ry="26" fill={FUR_DARK} />
        <ellipse cx="58" cy="60" rx="12" ry="16" fill={EAR_INNER} />
        <ellipse cx="142" cy="60" rx="12" ry="16" fill={EAR_INNER} />
        <ellipse cx="100" cy="104" rx="62" ry="56" fill={FUR} />
        <ellipse cx="100" cy="120" rx="44" ry="34" fill={BELLY} />
        <Eyes mood={mood} />
        <ellipse cx="100" cy="116" rx="11" ry="8" fill="#3b2a1f" />
        <Mouth mood={mood} />
        {/* cheeks */}
        {(mood === 'happy' || mood === 'ecstatic') && (
          <g fill="#e9a0a0" opacity="0.6">
            <circle cx="62" cy="118" r="7" />
            <circle cx="138" cy="118" r="7" />
          </g>
        )}
        <Outfit id={outfitId} />
      </g>
      {stage !== 'joey' && !outfitId && stage === 'legend' && <Outfit id="leaf_crown" />}
    </svg>
  );
}
