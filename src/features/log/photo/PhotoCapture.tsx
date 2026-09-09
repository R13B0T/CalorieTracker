import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { analyseMealPhoto } from '@/lib/ai/claudeClient';
import { prepareImage, base64ToBlob } from '@/lib/ai/image';
import { db } from '@/lib/db/db';
import { useAnalyse } from '../useAnalyse';
import { Thinking } from '../Thinking';

export default function PhotoCapture() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const draftId = params.get('draft');
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<{
    base64: string;
    thumb: Blob;
    bytes: number;
    width?: number;
    height?: number;
  } | null>(null);
  const [hint, setHint] = useState('');
  const [preparing, setPreparing] = useState(false);
  const { run, cancel, busy, error, retryIn } = useAnalyse();

  useEffect(() => {
    if (!draftId) return;
    db.drafts.get(draftId).then((d) => {
      if (d?.imageBase64) {
        const thumb = d.thumb ?? base64ToBlob(d.imageBase64);
        setPrepared({ base64: d.imageBase64, thumb, bytes: d.imageBase64.length * 0.75 });
        // The diary thumbnail is intentionally tiny. Use the analysis image for
        // this full-width preview so restored drafts remain crisp.
        setPreview(URL.createObjectURL(base64ToBlob(d.imageBase64)));
      }
    });
  }, [draftId]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPreparing(true);
    try {
      const p = await prepareImage(file);
      setPrepared({
        base64: p.base64,
        thumb: p.thumb,
        bytes: p.bytes,
        width: p.width,
        height: p.height,
      });
      // Keep the 256px thumbnail for diary rows, but preview the same clean,
      // larger image that will actually be sent for analysis.
      setPreview(URL.createObjectURL(base64ToBlob(p.base64)));
    } catch (e) {
      console.error(e);
    } finally {
      setPreparing(false);
    }
  }

  async function go() {
    if (!prepared) return;
    await run({
      source: 'photo',
      imageBase64: prepared.base64,
      thumb: prepared.thumb,
      rawInput: hint || undefined,
      call: (signal) => analyseMealPhoto(prepared.base64, hint, { signal }),
    });
    if (draftId) await db.drafts.delete(draftId);
  }

  function clearPhoto() {
    setPreview(null);
    setPrepared(null);
    // Selecting the same photo again must still fire an input change event.
    if (cameraRef.current) cameraRef.current.value = '';
    if (galleryRef.current) galleryRef.current.value = '';
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button className="btn-ghost -ml-3 px-3" onClick={() => nav(-1)} aria-label="Back">
          ←
        </button>
        <h1 className="text-xl font-black">Snap your meal</h1>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-xl bg-bark-900">
          <img src={preview} alt="Your meal" className="block w-full max-h-[60vh] object-contain" />
          <button
            className="absolute top-2 right-2 chip bg-bark-900/70 text-white"
            onClick={clearPhoto}
          >
            Retake
          </button>
          {prepared?.width && prepared.height && (
            <span className="absolute bottom-2 left-2 chip bg-bark-900/70 text-white text-[11px]">
              Upload preview · {prepared.width}×{prepared.height}
            </span>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            className="card flex flex-col items-center gap-2 py-8 bg-euc-500 text-white"
            onClick={() => cameraRef.current?.click()}
            disabled={preparing}
          >
            <span className="text-4xl">📸</span>
            <span className="font-black">Camera</span>
          </button>
          <button
            className="card flex flex-col items-center gap-2 py-8"
            onClick={() => galleryRef.current?.click()}
            disabled={preparing}
          >
            <span className="text-4xl">🖼️</span>
            <span className="font-black">Gallery</span>
          </button>
        </div>
      )}
      {preparing && <div className="text-sm text-bark-500 text-center">Squashing the photo…</div>}

      <div className="card flex flex-col gap-2 text-sm text-bark-700">
        <div className="font-bold text-bark-900">Tips for a better estimate</div>
        <ul className="list-disc pl-4 flex flex-col gap-1">
          <li>Shoot from about 45 degrees so depth is visible, not straight down.</li>
          <li>Get the whole plate in frame, with a fork or your hand for scale.</li>
          <li>
            For bowls, curries or anything layered, add a hint below. Those are where every app
            guesses.
          </li>
        </ul>
      </div>

      <input
        className="input"
        placeholder="Optional hint: large bowl, cooked in butter, half eaten…"
        value={hint}
        onChange={(e) => setHint(e.target.value)}
        disabled={busy}
      />

      {error && (
        <div className="rounded-xl bg-berry-100 text-berry-500 px-4 py-3 text-sm font-semibold">
          {error}
          {retryIn && retryIn > 0 ? ` (${retryIn}s)` : ''}
        </div>
      )}

      {busy ? (
        <Thinking onCancel={cancel} />
      ) : (
        <button
          className="btn-primary text-lg"
          disabled={!prepared || (retryIn ?? 0) > 0}
          onClick={go}
        >
          Analyse photo
        </button>
      )}
      <p className="text-xs text-bark-500 text-center">
        The clean preview above is the image sent to Claude, optimised to about{' '}
        {prepared ? `${Math.round(prepared.bytes / 1024)} KB` : '1 MB'}. Roughly 1 to 2 cents each.
      </p>
    </div>
  );
}
