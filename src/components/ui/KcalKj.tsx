import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { kcalToKj } from '@/lib/nutrition/units';

export function KcalKj({
  kcal,
  size = 'md',
  className = '',
}: {
  kcal: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const showKj = useLiveQuery(() => db.settings.get('me').then((s) => s?.showKj ?? true), [], true);
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
      <span className={main}>{Math.round(kcal).toLocaleString('en-AU')}</span>
      <span
        className={
          size === 'sm' ? 'text-[10px] text-bark-500' : 'text-xs text-bark-500 font-semibold'
        }
      >
        kcal{showKj ? ` · ${Math.round(kcalToKj(kcal)).toLocaleString('en-AU')} kJ` : ''}
      </span>
    </span>
  );
}
