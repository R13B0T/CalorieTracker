import { useEffect } from 'react';
import { runRollover } from './engine';

/** Runs the day-rollover job on mount, when the tab becomes visible, and every minute. */
export function useRollover() {
  useEffect(() => {
    const tick = () => {
      runRollover().catch((e) => console.error('rollover failed', e));
    };
    tick();
    const interval = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
}
