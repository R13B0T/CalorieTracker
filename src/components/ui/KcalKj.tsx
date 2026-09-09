import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { energyFromKcal } from '@/lib/nutrition/units';
import type { EnergyUnit } from '@/lib/db/types';

export function useEnergyUnit(): EnergyUnit {
  return useLiveQuery(() => db.settings.get('me').then((s) => s?.energyUnit ?? 'kcal'), [], 'kcal');
}

export function KcalKj({
  kcal,
  size = 'md',
  className = '',
}: {
  kcal: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const unit = useEnergyUnit();
  const value = energyFromKcal(kcal, unit);
  const main =
    size === 'xl'
      ? 'text-4xl font-black'
      : size === 'lg'
        ? 'text-2xl font-black'
        : size === 'sm'
          ? 'text-sm font-bold'
          : 'text-base font-bold';
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className={main}>{Math.round(value).toLocaleString('en-AU')}</span>
      <span
        className={
          size === 'sm' ? 'text-[10px] text-bark-500' : 'text-xs text-bark-500 font-semibold'
        }
      >
        {unit}
      </span>
    </span>
  );
}
