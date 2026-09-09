import { useEffect, type ReactNode } from 'react';

export function Sheet({
  open,
  onClose,
  title,
  children,
  tall,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  tall?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close" className="absolute inset-0 bg-bark-900/40" onClick={onClose} />
      <div
        className={`relative w-full max-w-lg rounded-t-3xl bg-sand-50 shadow-soft safe-bottom animate-pop ${
          tall ? 'max-h-[92vh]' : 'max-h-[80vh]'
        } flex flex-col`}
      >
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-sand-300" />
        {title && <h2 className="px-5 pt-3 text-lg font-extrabold">{title}</h2>}
        <div className="overflow-y-auto px-5 pb-6 pt-3">{children}</div>
      </div>
    </div>
  );
}
