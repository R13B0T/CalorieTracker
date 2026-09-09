import type { CSSProperties } from 'react';
import type { Mood, PetStage } from '@/lib/db/types';

export interface QuokkaSpriteProps {
  stage: PetStage;
  mood: Mood;
  outfitId?: string | null;
  size?: number;
  className?: string;
  animate?: boolean;
}

const ART_ROOT = `${import.meta.env.BASE_URL}art`;

const OUTFIT_ASSETS = new Set([
  'bow',
  'sunnies',
  'bucket_hat',
  'scarf',
  'flower_crown',
  'bandana',
  'explorer_hat',
  'raincoat',
  'headphones',
  'cape',
  'crown',
]);

const STAGE_SCALE: Record<PetStage, number> = {
  joey: 0.88,
  adult: 0.96,
  legend: 1,
};

/**
 * The mascot is rendered from the generated 3D art set. Outfit images are
 * complete character renders so fabric, fur and lighting stay coherent instead
 * of looking like flat stickers placed over the quokka.
 */
export function QuokkaSprite({
  stage,
  mood,
  outfitId,
  size = 160,
  className = '',
  animate,
}: QuokkaSpriteProps) {
  const equippedOutfit = outfitId && OUTFIT_ASSETS.has(outfitId) ? outfitId : null;
  const defaultLegendCrown = stage === 'legend' && !equippedOutfit;
  const asset = equippedOutfit ?? (defaultLegendCrown ? 'crown' : mood);
  const folder = equippedOutfit || defaultLegendCrown ? 'outfits' : 'quokka';
  const style = {
    '--quokka-size': `${size}px`,
    '--quokka-scale': STAGE_SCALE[stage],
  } as CSSProperties;

  return (
    <span
      className={`quokka-render ${animate ? 'animate-bob' : ''} ${stage === 'legend' ? 'quokka-legend' : ''} ${className}`}
      style={style}
      role="img"
      aria-label={`A ${mood} ${stage} quokka${equippedOutfit ? ` wearing ${equippedOutfit.replaceAll('_', ' ')}` : ''}`}
    >
      <img
        src={`${ART_ROOT}/${folder}/${asset}.webp`}
        alt=""
        width={size}
        height={size}
        draggable={false}
        decoding="async"
      />
    </span>
  );
}
