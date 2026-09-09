import type { ReactNode } from 'react';
import { ErrorBoundary } from './layout/ErrorBoundary';
import { ToastHost } from '@/components/ui/Toast';
import { UpdatePrompt } from '@/lib/pwa/UpdatePrompt';
import { LevelUpModal } from '@/features/game/LevelUpModal';
import { InstallHint } from '@/lib/pwa/InstallHint';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <ToastHost />
      <UpdatePrompt />
      <LevelUpModal />
      <InstallHint />
    </ErrorBoundary>
  );
}
