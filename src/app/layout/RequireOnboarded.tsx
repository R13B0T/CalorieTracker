import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { PageSpinner } from '@/components/ui/PageSpinner';

export function RequireOnboarded({ children }: { children: ReactNode }) {
  const settings = useLiveQuery(() => db.settings.get('me'), [], undefined);
  if (settings === undefined) return <PageSpinner />;
  if (!settings || !settings.onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
