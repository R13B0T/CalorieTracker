import { createBrowserRouter, Navigate } from 'react-router';
import { lazy, Suspense } from 'react';
import { AppShell } from './layout/AppShell';
import { RequireOnboarded } from './layout/RequireOnboarded';
import { PageSpinner } from '@/components/ui/PageSpinner';

const TodayPage = lazy(() => import('@/features/diary/TodayPage'));
const LogHub = lazy(() => import('@/features/log/LogHub'));
const PetPage = lazy(() => import('@/features/pet/PetPage'));
const BodyPage = lazy(() => import('@/features/body/BodyPage'));
const StatsPage = lazy(() => import('@/features/stats/StatsPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const OnboardingWizard = lazy(() => import('@/features/onboarding/OnboardingWizard'));

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

const wrap = (el: React.ReactNode) => <Suspense fallback={<PageSpinner />}>{el}</Suspense>;

export const router = createBrowserRouter(
  [
    { path: '/onboarding', element: wrap(<OnboardingWizard />) },
    {
      path: '/',
      element: (
        <RequireOnboarded>
          <AppShell />
        </RequireOnboarded>
      ),
      children: [
        { index: true, element: wrap(<TodayPage />) },
        { path: 'log/*', element: wrap(<LogHub />) },
        { path: 'pet/*', element: wrap(<PetPage />) },
        { path: 'body/*', element: wrap(<BodyPage />) },
        { path: 'stats', element: wrap(<StatsPage />) },
        { path: 'settings/*', element: wrap(<SettingsPage />) },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename },
);
