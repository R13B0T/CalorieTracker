import type { ReactNode } from 'react';
import { ErrorBoundary } from './layout/ErrorBoundary';
import { ToastHost } from '@/components/ui/Toast';
import { UpdatePrompt } from '@/lib/pwa/UpdatePrompt';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <ToastHost />
      <UpdatePrompt />
    </ErrorBoundary>
  );
}
