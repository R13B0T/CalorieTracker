import { useToastStore } from '@/stores/useSessionStore';

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-24 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto animate-pop max-w-sm w-full text-left rounded-xl px-4 py-3 shadow-soft font-semibold text-sm ${
            t.tone === 'reward'
              ? 'bg-sun-300 text-bark-900'
              : t.tone === 'error'
                ? 'bg-berry-100 text-berry-500'
                : 'bg-bark-900 text-sand-50'
          }`}
        >
          {t.icon && <span className="mr-2">{t.icon}</span>}
          {t.message}
        </button>
      ))}
    </div>
  );
}
