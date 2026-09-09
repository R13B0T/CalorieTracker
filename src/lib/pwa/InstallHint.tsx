import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/db';
import { Sheet } from '@/components/ui/Sheet';

type BIP = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
let deferredPrompt: BIP | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BIP;
  });
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome;
}

/** Shown once after the first successful log if the app isn't installed. */
export function InstallHint() {
  const settings = useLiveQuery(() => db.settings.get('me'), []);
  const mealCount = useLiveQuery(() => db.entries.count(), [], 0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!settings || settings.installBannerDismissedAt || isStandalone() || mealCount < 1) return;
    const t = setTimeout(() => setOpen(true), 5000);
    return () => clearTimeout(t);
  }, [settings, mealCount]);
  if (!open) return null;
  const dismiss = async () => {
    setOpen(false);
    await db.settings.update('me', { installBannerDismissedAt: Date.now() });
  };
  return (
    <Sheet open={open} onClose={dismiss} title="Put Quokkal on your home screen">
      <div className="flex flex-col gap-3 text-sm text-bark-700">
        <p>
          Installed apps open full-screen, work offline, and iOS is far less likely to clear their
          data.
        </p>
        {isIos() ? (
          <ol className="list-decimal pl-5 flex flex-col gap-1">
            <li>
              Tap the <b>Share</b> button (the square with an arrow) in Safari.
            </li>
            <li>
              Scroll and tap <b>Add to Home Screen</b>.
            </li>
            <li>
              Tap <b>Add</b>. Done.
            </li>
          </ol>
        ) : deferredPrompt ? (
          <button
            className="btn-primary"
            onClick={async () => {
              await promptInstall();
              dismiss();
            }}
          >
            Install Quokkal
          </button>
        ) : (
          <p>
            In your browser menu, choose <b>Install app</b> or <b>Add to Home screen</b>.
          </p>
        )}
        <button className="btn-ghost" onClick={dismiss}>
          Maybe later
        </button>
      </div>
    </Sheet>
  );
}
