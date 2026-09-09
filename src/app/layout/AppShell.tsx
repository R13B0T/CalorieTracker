import { Outlet } from 'react-router';
import { BottomNav } from './BottomNav';
import { useRollover } from '@/lib/game/useRollover';

export function AppShell() {
  useRollover();
  return (
    <div className="min-h-full flex flex-col">
      <main className="flex-1 pb-28 safe-top">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
