import { useEffect, useState } from 'react';
import type { Source } from '@/lib/db/types';

const ICON: Record<Source, string> = { photo: '📸', text: '✍️', voice: '🎙️', barcode: '🏷️', search: '🔍', manual: '✋', quick_repeat: '🔁' };

export function Thumb({ blob, source, size = 48 }: { blob?: Blob; source: Source; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (url) return <img src={url} alt="" width={size} height={size} className="rounded-lg object-cover shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-lg bg-sand-200 flex items-center justify-center shrink-0 text-xl" style={{ width: size, height: size }} aria-hidden>
      {ICON[source]}
    </div>
  );
}
