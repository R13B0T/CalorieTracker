import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { scanImage, scanVideo, looksLikeBarcode } from '@/lib/food/barcode';
import { lookupBarcode, OffError, saveUserProduct } from '@/lib/food/openFoodFacts';
import { productToItem } from '@/lib/food/mapping';
import type { CachedProduct } from '@/lib/db/types';
import { PortionPicker } from '../search/PortionPicker';
import { useSessionStore, toast } from '@/stores/useSessionStore';
import { suggestSlot } from '@/lib/db/repos/meals';
import { NumberField } from '@/components/ui/NumberField';
import { Sheet } from '@/components/ui/Sheet';

type Phase = 'idle' | 'scanning' | 'looking' | 'found' | 'notfound' | 'error';

export default function BarcodeScanner() {
  const nav = useNavigate();
  const setDraft = useSessionStore((s) => s.setDraft);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [code, setCode] = useState('');
  const [manual, setManual] = useState('');
  const [product, setProduct] = useState<CachedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraSupported] = useState(() => !!navigator.mediaDevices?.getUserMedia);
  const [custom, setCustom] = useState(false);

  useEffect(() => {
    if (cameraSupported) startCamera();
    return stopCamera;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    abortRef.current?.abort();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      setPhase('scanning');
      const ac = new AbortController();
      abortRef.current = ac;
      const found = await scanVideo(v, ac.signal);
      if (found) await onCode(found);
    } catch (e) {
      console.warn('camera unavailable', e);
      setPhase('idle');
      setError('Camera not available. Take a photo of the barcode or type the number instead.');
    }
  }

  async function onFile(file?: File) {
    if (!file) return;
    setPhase('looking');
    try {
      const bmp = await createImageBitmap(file);
      const v = await scanImage(bmp);
      bmp.close();
      if (v) await onCode(v);
      else {
        setPhase('idle');
        setError('No barcode found in that photo. Try closer and flatter, or type it in.');
      }
    } catch {
      setPhase('idle');
      setError('Could not read that image.');
    }
  }

  async function onCode(value: string) {
    stopCamera();
    setCode(value);
    setPhase('looking');
    if (navigator.vibrate) navigator.vibrate(30);
    try {
      const p = await lookupBarcode(value);
      if (p) {
        setProduct(p);
        setPhase('found');
      } else {
        setPhase('notfound');
      }
    } catch (e) {
      setPhase('error');
      setError(
        e instanceof OffError && e.kind === 'rate_limited'
          ? 'Open Food Facts is rate limiting us. Wait a minute.'
          : 'Could not reach Open Food Facts. Check your connection.',
      );
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
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        {phase === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-24 border-2 border-sun-500 rounded-xl" />
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

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
          📷 Photo of barcode
        </button>
        {phase !== 'scanning' && cameraSupported && (
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
          disabled={!looksLikeBarcode(manual)}
          onClick={() => onCode(manual.trim())}
        >
          Go
        </button>
      </div>

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
  async function save() {
    if (!name.trim() || typeof kj !== 'number') return;
    const p: CachedProduct = {
      barcode,
      name: name.trim(),
      brand: brand.trim() || undefined,
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
