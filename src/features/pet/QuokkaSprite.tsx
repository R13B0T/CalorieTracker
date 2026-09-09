import { useId } from 'react';
import type { Mood, PetStage } from '@/lib/db/types';

export interface QuokkaSpriteProps {
  stage: PetStage;
  mood: Mood;
  outfitId?: string | null;
  size?: number;
  className?: string;
  animate?: boolean;
}

const FUR = '#9b7657';
const FUR_LIGHT = '#c7a17c';
const FUR_DARK = '#6f503b';
const MUZZLE = '#ead2b7';
const EAR_INNER = '#dba38f';
const INK = '#2e211a';
const CREAM = '#fffaf2';

function OpenEyes({ peckish = false }: { peckish?: boolean }) {
  const cy = peckish ? 94 : 92;
  return (
    <g>
      <ellipse cx="86" cy={cy} rx="9" ry="10.5" fill={INK} />
      <ellipse cx="134" cy={cy} rx="9" ry="10.5" fill={INK} />
      <circle cx="89" cy={cy - 3} r="3.2" fill={CREAM} />
      <circle cx="137" cy={cy - 3} r="3.2" fill={CREAM} />
      <circle cx="83" cy={cy + 4} r="1.3" fill="#b88461" />
      <circle cx="131" cy={cy + 4} r="1.3" fill="#b88461" />
    </g>
  );
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'ecstatic') {
    return (
      <g stroke={INK} strokeWidth="5.5" fill="none" strokeLinecap="round">
        <path d="M77 94 Q86 82 95 94" />
        <path d="M125 94 Q134 82 143 94" />
      </g>
    );
  }
  if (mood === 'sleepy') {
    return (
      <g stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round">
        <path d="M77 94 Q86 100 95 94" />
        <path d="M125 94 Q134 100 143 94" />
      </g>
    );
  }
  if (mood === 'worried') {
    return (
      <g>
        <OpenEyes />
        <path
          d="M75 76 Q85 70 96 77 M124 77 Q135 70 145 76"
          stroke={INK}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }
  return <OpenEyes peckish={mood === 'peckish'} />;
}

function Mouth({ mood }: { mood: Mood }) {
  const line = { stroke: INK, strokeWidth: 4.5, fill: 'none', strokeLinecap: 'round' as const };
  if (mood === 'ecstatic') {
    return (
      <g>
        <path d="M91 120 Q110 145 129 120 Q126 150 110 152 Q94 150 91 120Z" fill={INK} />
        <path d="M99 140 Q110 146 121 140 Q118 149 110 150 Q102 149 99 140Z" fill="#ef8c8c" />
      </g>
    );
  }
  if (mood === 'happy') return <path d="M91 122 Q110 143 129 122" {...line} />;
  if (mood === 'content') return <path d="M95 124 Q110 136 125 124" {...line} />;
  if (mood === 'sleepy') return <path d="M100 128 Q110 133 120 128" {...line} />;
  if (mood === 'peckish') return <ellipse cx="110" cy="129" rx="7" ry="5.5" fill={INK} />;
  return <path d="M96 134 Q110 123 124 134" {...line} />;
}

function BackOutfit({ id }: { id: string | null | undefined }) {
  if (id !== 'cape') return null;
  return (
    <g>
      <path d="M78 137 Q110 126 142 137 L158 198 Q112 211 65 195Z" fill="#c95750" />
      <path d="M78 137 Q110 146 142 137" stroke="#8f3738" strokeWidth="5" fill="none" />
    </g>
  );
}

function BodyOutfit({ id }: { id: string | null | undefined }) {
  switch (id) {
    case 'scarf':
      return (
        <g>
          <path d="M67 137 Q110 154 153 137 L151 153 Q110 169 69 153Z" fill="#4f93c4" />
          <path d="M133 149 L145 190 L157 183 L146 146Z" fill="#3979aa" />
          <path d="M143 179 l4 4 m2 -10 l4 4" stroke="#d9edf8" strokeWidth="2" />
        </g>
      );
    case 'bandana':
      return (
        <g>
          <path d="M72 138 Q110 151 148 138 L139 157 Q110 169 81 157Z" fill="#d66750" />
          <path d="M136 151 l19 24 l-17 2 l-10 -21z" fill="#b84a40" />
          <circle cx="105" cy="151" r="2" fill="#f3c1a8" />
          <circle cx="119" cy="153" r="2" fill="#f3c1a8" />
        </g>
      );
    case 'raincoat':
      return (
        <g>
          <path d="M72 143 Q110 130 148 143 L158 194 Q110 211 62 194Z" fill="#f2bd3d" />
          <path d="M110 140 V201" stroke="#d69424" strokeWidth="4" />
          <circle cx="118" cy="158" r="2.6" fill="#fff3b8" />
          <circle cx="118" cy="174" r="2.6" fill="#fff3b8" />
          <path
            d="M68 150 Q55 160 59 180"
            stroke="#e3a52c"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M152 150 Q165 160 161 180"
            stroke="#e3a52c"
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    case 'cape':
      return (
        <g>
          <circle cx="91" cy="143" r="5" fill="#f1c85c" />
          <circle cx="129" cy="143" r="5" fill="#f1c85c" />
          <path d="M96 143 H124" stroke="#f1c85c" strokeWidth="4" />
        </g>
      );
    default:
      return null;
  }
}

function HeadOutfit({ id }: { id: string | null | undefined }) {
  switch (id) {
    case 'bucket_hat':
      return (
        <g>
          <path d="M69 57 L151 57 L141 36 Q110 23 79 36Z" fill="#5f8a6b" />
          <path
            d="M58 58 Q110 70 162 58"
            stroke="#3f6b4d"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M82 40 Q110 48 138 40" stroke="#8bb291" strokeWidth="3" fill="none" />
        </g>
      );
    case 'explorer_hat':
      return (
        <g>
          <path d="M77 53 L86 28 Q110 20 134 28 L143 53Z" fill="#c79a55" />
          <path
            d="M66 50 Q110 63 154 50"
            stroke="#9b713c"
            strokeWidth="11"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M81 42 H139" stroke="#5f8a6b" strokeWidth="7" />
        </g>
      );
    case 'sunnies':
      return (
        <g>
          <rect x="70" y="82" width="34" height="23" rx="9" fill="#273440" opacity="0.95" />
          <rect x="116" y="82" width="34" height="23" rx="9" fill="#273440" opacity="0.95" />
          <path
            d="M104 92 Q110 88 116 92 M70 88 L59 84 M150 88 L161 84"
            stroke={INK}
            strokeWidth="4"
            fill="none"
          />
          <path d="M76 86 l10 15 M122 86 l10 15" stroke="#87cce8" strokeWidth="3" opacity="0.75" />
        </g>
      );
    case 'bow':
      return (
        <g fill="#cb5c58">
          <path d="M143 50 Q165 36 166 58 Q164 73 143 59Z" />
          <path d="M142 51 Q124 37 123 58 Q126 70 143 59Z" />
          <circle cx="143" cy="55" r="7" fill="#a8423d" />
        </g>
      );
    case 'crown':
      return (
        <g>
          <path d="M74 54 L80 29 L95 44 L110 20 L125 44 L140 29 L146 54Z" fill="#f2bd3d" />
          <path d="M75 52 H145 V61 Q110 67 75 61Z" fill="#d99a2b" />
          <circle cx="110" cy="45" r="4" fill="#c95750" />
          <circle cx="91" cy="49" r="3" fill="#72a6c7" />
          <circle cx="129" cy="49" r="3" fill="#72a6c7" />
        </g>
      );
    case 'flower_crown':
      return (
        <g>
          <path d="M73 55 Q110 42 147 55" stroke="#56815d" strokeWidth="6" fill="none" />
          {[
            [80, 51, '#f2bd3d'],
            [95, 47, '#f7f0dc'],
            [110, 46, '#e98f8f'],
            [125, 47, '#f7f0dc'],
            [140, 51, '#f2bd3d'],
          ].map(([cx, cy, fill]) => (
            <g key={String(cx)} transform={`translate(${cx} ${cy})`}>
              <circle cy="-5" r="5" fill={String(fill)} />
              <circle cx="5" r="5" fill={String(fill)} />
              <circle cy="5" r="5" fill={String(fill)} />
              <circle cx="-5" r="5" fill={String(fill)} />
              <circle r="3" fill="#8a623c" />
            </g>
          ))}
        </g>
      );
    case 'headphones':
      return (
        <g>
          <path
            d="M67 92 Q67 48 110 45 Q153 48 153 92"
            stroke="#36465b"
            strokeWidth="8"
            fill="none"
          />
          <rect x="57" y="82" width="19" height="38" rx="9" fill="#5d8fb2" />
          <rect x="144" y="82" width="19" height="38" rx="9" fill="#5d8fb2" />
          <rect x="62" y="89" width="9" height="24" rx="4" fill="#9fd4e8" />
          <rect x="149" y="89" width="9" height="24" rx="4" fill="#9fd4e8" />
        </g>
      );
    case 'leaf_crown':
      return (
        <g fill="#5f8a6b">
          <path d="M70 55 Q76 33 94 45 Q84 55 70 55Z" />
          <path d="M150 55 Q144 33 126 45 Q136 55 150 55Z" />
          <path d="M91 48 Q110 25 129 48 Q110 58 91 48Z" />
          <circle cx="110" cy="49" r="4" fill="#f2bd3d" />
        </g>
      );
    default:
      return null;
  }
}

/**
 * A friendly, layered SVG quokka. The silhouette and face stay recognisable at
 * navigation-chip size, while larger views retain paws, whiskers and fur detail.
 */
export function QuokkaSprite({
  stage,
  mood,
  outfitId,
  size = 160,
  className = '',
  animate,
}: QuokkaSpriteProps) {
  const auraId = `quokka-aura-${useId().replace(/:/g, '')}`;
  const headScale = stage === 'joey' ? 1.08 : stage === 'legend' ? 0.98 : 1;
  const bodyScale = stage === 'joey' ? 0.9 : stage === 'legend' ? 1.04 : 1;
  const defaultCrown = stage === 'legend' && !outfitId ? 'leaf_crown' : outfitId;

  return (
    <svg
      viewBox="0 0 220 220"
      width={size}
      height={size}
      className={`${animate ? 'animate-bob' : ''} ${className}`}
      role="img"
      aria-label={`A ${mood} ${stage} quokka`}
    >
      <defs>
        <radialGradient id={auraId}>
          <stop offset="58%" stopColor="#f7cf68" stopOpacity="0" />
          <stop offset="100%" stopColor="#f2b544" stopOpacity="0.78" />
        </radialGradient>
      </defs>
      {stage === 'legend' && <circle cx="110" cy="112" r="103" fill={`url(#${auraId})`} />}
      <ellipse cx="110" cy="205" rx="62" ry="9" fill="#493626" opacity="0.16" />

      <path d="M69 174 Q38 176 28 195 Q51 192 79 187Z" fill={FUR_DARK} />
      <BackOutfit id={outfitId} />

      <g transform={`translate(110 169) scale(${bodyScale}) translate(-110 -169)`}>
        <ellipse cx="110" cy="165" rx="53" ry="48" fill={FUR} />
        <ellipse cx="110" cy="174" rx="34" ry="34" fill={FUR_LIGHT} />
        <ellipse cx="78" cy="202" rx="22" ry="10" fill={FUR_DARK} />
        <ellipse cx="142" cy="202" rx="22" ry="10" fill={FUR_DARK} />
        <path
          d="M64 151 Q48 165 60 181"
          stroke={FUR_DARK}
          strokeWidth="13"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M156 151 Q172 165 160 181"
          stroke={FUR_DARK}
          strokeWidth="13"
          fill="none"
          strokeLinecap="round"
        />
        <BodyOutfit id={outfitId} />
        <g stroke="#493626" strokeWidth="2" opacity="0.55" strokeLinecap="round">
          <path d="M67 202 l-3 5 M76 202 l-1 6 M145 202 l1 6 M154 202 l3 5" />
        </g>
      </g>

      <g transform={`translate(110 103) scale(${headScale}) translate(-110 -103)`}>
        <ellipse cx="70" cy="51" rx="20" ry="29" fill={FUR_DARK} transform="rotate(-18 70 51)" />
        <ellipse cx="150" cy="51" rx="20" ry="29" fill={FUR_DARK} transform="rotate(18 150 51)" />
        <ellipse cx="70" cy="52" rx="10" ry="18" fill={EAR_INNER} transform="rotate(-18 70 52)" />
        <ellipse cx="150" cy="52" rx="10" ry="18" fill={EAR_INNER} transform="rotate(18 150 52)" />
        <path
          d="M55 103 Q56 61 86 48 Q110 37 134 48 Q164 61 165 103 Q166 143 140 158 Q110 174 80 158 Q54 143 55 103Z"
          fill={FUR}
        />
        <path d="M92 48 Q101 36 110 48 Q119 35 128 50" fill={FUR_DARK} opacity="0.7" />
        <ellipse cx="110" cy="121" rx="43" ry="34" fill={MUZZLE} />
        <Eyes mood={mood} />
        <path d="M100 110 Q110 103 120 110 Q119 120 110 122 Q101 120 100 110Z" fill={INK} />
        <circle cx="106" cy="109" r="2.2" fill={CREAM} opacity="0.72" />
        <Mouth mood={mood} />
        <g fill={FUR_DARK} opacity="0.6">
          <circle cx="76" cy="118" r="1.5" />
          <circle cx="72" cy="124" r="1.3" />
          <circle cx="144" cy="118" r="1.5" />
          <circle cx="148" cy="124" r="1.3" />
        </g>
        <g stroke={FUR_DARK} strokeWidth="1.4" opacity="0.48" strokeLinecap="round">
          <path d="M73 124 L51 120 M75 129 L52 132 M147 124 L169 120 M145 129 L168 132" />
        </g>
        {(mood === 'happy' || mood === 'ecstatic') && (
          <g fill="#e98f8f" opacity="0.52">
            <ellipse cx="72" cy="119" rx="8" ry="5" />
            <ellipse cx="148" cy="119" rx="8" ry="5" />
          </g>
        )}
        {mood === 'peckish' && (
          <path d="M69 126 Q63 132 69 139 Q75 132 69 126Z" fill="#70b6d8" opacity="0.9" />
        )}
        <HeadOutfit id={defaultCrown} />
      </g>
    </svg>
  );
}
