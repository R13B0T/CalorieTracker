export function StreakChip({ streak, freezes }: { streak: number; freezes: number }) {
  return (
    <span
      className={`chip ${streak > 0 ? 'bg-sun-300 text-bark-900' : 'bg-sand-200 text-bark-500'}`}
      title={`${freezes} streak freeze${freezes === 1 ? '' : 's'} held`}
    >
      🔥 {streak}
      {freezes > 0 && <span className="ml-1 opacity-70">🧊{freezes}</span>}
    </span>
  );
}
