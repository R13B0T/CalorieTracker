import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { scanImage, scanVideo, isValidBarcode } from '@/lib/food/barcode';
import { lookupBarcode, OffError, saveUserProduct } from '@/lib/food/openFoodFacts';
import { productToItem } from '@/lib/food/mapping';
import type { CachedProduct } from '@/lib/db/types';
import { PortionPicker } from '../search/PortionPicker';
import { useSessionStore, toast } from '@/stores/useSessionStore';
import { suggestSlot } from '@/lib/db/repos/meals';
import { NumberField } from '@/components/ui/NumberField';
import { Sheet } from '@/components/ui/Sheet';

type Phase = 'idle' | 'starting' | 'scanning' | 'looking' | 'found' | 'notfound' | 'error';

export default function BarcodeScanner() {
  const nav = useNavigate();
  const setDraft = useSessionStore((s) => s.setDraft);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lookupAbortRef = useRef<AbortController | null>(null);
  const cameraAttemptRef = useRef(0);
  const mountedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [code, setCode] = useState('');
  const [manual, setManual] = useState('');
  const [product, setProduct] = useState<CachedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraSupported] = useState(() => !!navigator.mediaDevices?.getUserMedia);
  const [custom, setCustom] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    // Deferring avoids React StrictMode issuing two simultaneous camera requests in development.
    const timer = cameraSupported ? window.setTimeout(() => void startCamera(), 0) : undefined;
    return () => {
      mountedRef.current = false;
      if (timer !== undefined) window.clearTimeout(timer);
      stopCamera();
      lookupAbortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    cameraAttemptRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function startCamera() {
    stopCamera();
    const attempt = cameraAttemptRef.current;
    setError(null);
    setNeedsTap(false);
    setPhase('starting');
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (e) {
        // A few older browsers reject otherwise valid facing/size hints.
        if (!(e instanceof DOMException) || e.name !== 'OverconstrainedError') throw e;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      if (!mountedRef.current || attempt !== cameraAttemptRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const v = videoRef.current;
      if (!v) throw new Error('Camera preview is unavailable');
      v.srcObject = stream;
      try {
        await v.play();
        setNeedsTap(false);
      } catch {
        // iOS can refuse autoplay without a gesture; offer a tap to start.
        setNeedsTap(true);
      }
      setPhase('scanning');
      const ac = new AbortController();
      abortRef.current = ac;
      let found: string | null;
      try {
        found = await scanVideo(v, ac.signal);
      } catch (e) {
        if (!ac.signal.aborted) {
          console.warn('barcode reader unavailable', e);
          stopCamera();
          setPhase('idle');
          setError(
            'The barcode reader could not load. Check your connection once, then tap Restart camera.',
          );
        }
        return;
      }
      if (found && mountedRef.current && attempt === cameraAttemptRef.current) await onCode(found);
    } catch (e) {
      if (!mountedRef.current || attempt !== cameraAttemptRef.current) return;
      console.warn('camera unavailable', e);
      stopCamera();
      setPhase('idle');
      setError(cameraErrorMessage(e));
    }
  }

  async function onFile(file?: File) {
    if (!file) return;
    setPhase('looking');
    let decoded: Awaited<ReturnType<typeof decodeImage>> | null = null;
    try {
      decoded = await decodeImage(file);
      const v = await scanImage(decoded.source);
      if (v) await onCode(v);
      else {
        setPhase('idle');
        setError('No barcode found in that photo. Try closer and flatter, or type it in.');
      }
    } catch (e) {
      console.warn('barcode image unavailable', e);
      setPhase('idle');
      setError('Could not read that image. Try a brighter, closer photo or type the number.');
    } finally {
      decoded?.close();
    }
  }

  async function onCode(value: string) {
    stopCamera();
    lookupAbortRef.current?.abort();
    const ac = new AbortController();
    lookupAbortRef.current = ac;
    setError(null);
    setCode(value);
    setPhase('looking');
    if (navigator.vibrate) navigator.vibrate(30);
    try {
      const p = await lookupBarcode(value, ac.signal);
      if (p) {
        setProduct(p);
        setPhase('found');
      } else {
        setPhase('notfound');
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setPhase('error');
      setError(
        e instanceof OffError && e.kind === 'rate_limited'
          ? 'Open Food Facts is rate limiting us. Wait a minute.'
          : 'Could not reach Open Food Facts. Check your connection.',
      );
    } finally {
      if (lookupAbortRef.current === ac) lookupAbortRef.current = null;
    }
  }

  function add(grams: number) {
    if (!product) return;
    const item = productToItem(product, grams);
    setDraft({
      analysis: {
        title: item.name,
        items: [
          {
            name: item.name,
            grams,
            nutrients: item.per,
            confidence: item.confidence,
            assumptions: item.assumptions ?? [],
          },
        ],
        notes: 'From the product label via Open Food Facts.',
        overall_confidence: item.confidence,
        needs_clarification: null,
      },
      preparedItems: [item],
      source: 'barcode',
      slot: suggestSlot(Date.now()),
    });
    nav('/log/review');
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          className="btn-ghost -ml-3 px-3"
          onClick={() => {
            stopCamera();
            nav(-1);
          }}
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-xl font-black">Scan a barcode</h1>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-bark-900 aspect-[4/3]">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
        {needsTap && (
          <button
            className="absolute inset-0 flex items-center justify-center bg-bark-900/60 text-sand-50 font-bold"
            onClick={() =>
              videoRef.current
                ?.play()
                .then(() => setNeedsTap(false))
                .catch(() => undefined)
            }
          >
            Tap to start camera
          </button>
        )}
        {phase === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-24 border-2 border-sun-500 rounded-xl" />
          </div>
        )}
        {phase === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-bark-900/60 text-sand-50 font-bold">
            Connecting to camera…
          </div>
        )}
        {phase === 'looking' && (
          <div className="absolute inset-0 flex items-center justify-center bg-bark-900/60 text-sand-50 font-bold">
            Looking up {code || 'barcode'}…
          </div>
        )}
        {phase === 'idle' && !cameraSupported && (
          <div className="absolute inset-0 flex items-center justify-center text-sand-50 text-sm px-6 text-center">
            No camera access in this browser. Use the photo or number options below.
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-berry-100 text-berry-500 px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}
      {phase === 'error' && code && (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-secondary" onClick={() => onCode(code)}>
            Retry lookup
          </button>
          <button className="btn-secondary" onClick={() => setCustom(true)}>
            Enter label instead
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.currentTarget.value = '';
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
          📷 Photo of barcode
        </button>
        {phase !== 'scanning' && phase !== 'starting' && cameraSupported && (
          <button className="btn-secondary" onClick={startCamera}>
            Restart camera
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="input"
          inputMode="numeric"
          placeholder="Or type the number"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
        />
        <button
          className="btn-secondary px-4"
          disabled={!isValidBarcode(manual)}
          onClick={() => onCode(manual.trim())}
        >
          Go
        </button>
      </div>
      {manual.trim().length >= 8 && !isValidBarcode(manual) && (
        <p className="text-xs text-bark-500 px-1">
          Check the digits—this barcode number does not have a valid check digit yet.
        </p>
      )}

      {phase === 'notfound' && (
        <div className="card flex flex-col gap-2">
          <div className="font-bold">Not in Open Food Facts ({code})</div>
          <p className="text-sm text-bark-700">
            Australian supermarket own-brands are often missing. You can enter the label once and
            Quokkal remembers it, or describe the food and let Claude estimate.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary" onClick={() => setCustom(true)}>
              Enter label
            </button>
            <button className="btn-secondary" onClick={() => nav('/log/text')}>
              Describe it
            </button>
          </div>
        </div>
      )}

      {product && (
        <PortionPicker
          open={phase === 'found'}
          name={`${product.brand ? product.brand + ' ' : ''}${product.name}`}
          kcal100={product.per100.kcal}
          servingG={product.servingG}
          onClose={() => {
            setPhase('idle');
            setProduct(null);
          }}
          onPick={add}
        />
      )}

      <CustomProductSheet
        open={custom}
        barcode={code}
        onClose={() => setCustom(false)}
        onSaved={(p) => {
          setProduct(p);
          setCustom(false);
          setPhase('found');
          toast('Saved to your foods', 'info', '💾');
        }}
      />
    </div>
  );
}

function CustomProductSheet({
  open,
  barcode,
  onClose,
  onSaved,
}: {
  open: boolean;
  barcode: string;
  onClose: () => void;
  onSaved: (p: CachedProduct) => void;
}) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [serving, setServing] = useState<number | ''>('');
  const [kj, setKj] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fibre, setFibre] = useState<number | ''>('');
  const [ingredients, setIngredients] = useState('');
  async function save() {
    if (!name.trim() || typeof kj !== 'number') return;
    const p: CachedProduct = {
      barcode,
      name: name.trim(),
      brand: brand.trim() || undefined,
      ingredients: ingredients.trim() || undefined,
      servingG: typeof serving === 'number' ? serving : undefined,
      per100: {
        kcal: kj / 4.184,
        protein: Number(protein) || 0,
        fat: Number(fat) || 0,
        carbs: Number(carbs) || 0,
        fibre: Number(fibre) || 0,
      },
      fibreUnknown: fibre === '',
    };
    await saveUserProduct(p);
    onSaved(p);
  }
  return (
    <Sheet open={open} onClose={onClose} title="Enter the label (per 100 g)">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-bark-500">
          Australian labels list energy in kJ per 100 g. Copy the "per 100 g" column.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Product</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Greek yoghurt"
            />
          </div>
          <div>
            <label className="label">Brand</label>
            <input
              className="input"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Coles"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Energy" value={kj} onChange={setKj} unit="kJ" min={0} />
          <NumberField
            label="Serving size"
            value={serving}
            onChange={setServing}
            unit="g"
            min={1}
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <NumberField label="Protein" value={protein} onChange={setProtein} unit="g" min={0} />
          <NumberField label="Fat" value={fat} onChange={setFat} unit="g" min={0} />
          <NumberField label="Carbs" value={carbs} onChange={setCarbs} unit="g" min={0} />
          <NumberField label="Fibre" value={fibre} onChange={setFibre} unit="g" min={0} />
        </div>
        <div>
          <label className="label">Ingredients (optional)</label>
          <textarea
            className="input min-h-20 resize-y"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Paste the ingredient list for a better FODMAP check"
          />
        </div>
        <button
          className="btn-primary"
          disabled={!name.trim() || typeof kj !== 'number'}
          onClick={save}
        >
          Save product
        </button>
      </div>
    </Sheet>
  );
}

function cameraErrorMessage(error: unknown): string {
  if (!window.isSecureContext) {
    return 'Camera access needs a secure HTTPS connection. Use the photo or number option here.';
  }
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera permission is blocked. Allow camera access for Quokkal in your browser settings, then tap Restart camera.';
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return 'The camera is busy in another app or tab. Close it there, then tap Restart camera.';
  }
  if (name === 'NotFoundError') {
    return 'No camera was found. Use a photo of the barcode or type its number instead.';
  }
  return 'The camera could not start. Tap Restart camera, or use a photo or barcode number.';
}

async function decodeImage(file: File): Promise<{ source: ImageBitmapSource; close: () => void }> {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, close: () => bitmap.close() };
    } catch {
      // Safari can display some photos that createImageBitmap cannot decode.
    }
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image decode failed'));
      image.src = url;
    });
    return { source: image, close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}
