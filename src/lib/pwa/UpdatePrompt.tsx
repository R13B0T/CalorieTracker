import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

let registrationRef: ServiceWorkerRegistration | undefined;

/** Ask the browser to look for a new build now. Safe to call any time. */
export async function checkForUpdates(): Promise<boolean> {
  if (!registrationRef) return false;
  try {
    await registrationRef.update();
    return true;
  } catch {
    return false;
  }
}

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      registrationRef = registration;
      if (!registration) return;
      const tick = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          registration.update().catch(() => undefined);
        }
      };
      const interval = setInterval(tick, CHECK_INTERVAL_MS);
      document.addEventListener('visibilitychange', tick);
      window.addEventListener('beforeunload', () => clearInterval(interval), { once: true });
    },
  });

  useEffect(() => {
    if (needRefresh) console.info('Quokkal: new version ready');
  }, [needRefresh]);

  if (!needRefresh) return null;
  return (
    <div className="fixed bottom-24 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto animate-pop flex items-center gap-3 rounded-full bg-bark-900 text-sand-50 pl-5 pr-2 py-2 shadow-soft">
        <span className="text-sm font-semibold">New version ready</span>
        <button
          className="rounded-full bg-euc-500 px-4 py-1.5 text-sm font-bold text-white active:scale-95"
          onClick={() => updateServiceWorker(true)}
        >
          Update
        </button>
        <button
          aria-label="Later"
          className="rounded-full px-2 py-1 text-sm text-sand-300"
          onClick={() => setNeedRefresh(false)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export const APP_VERSION = __APP_VERSION__;
export const BUILD_DATE = __BUILD_DATE__;
