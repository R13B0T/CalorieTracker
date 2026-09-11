/**
 * Thin wrapper over the native BarcodeDetector when available, with zxing-wasm as a fallback.
 * Kept behind one interface so the engine can be swapped.
 */
export type BarcodeFormat = 'ean_13' | 'ean_8' | 'upc_a' | 'upc_e';
const FORMATS: BarcodeFormat[] = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

type Detector = {
  detect: (src: ImageBitmapSource) => Promise<{ rawValue: string; format: string }[]>;
};

type DetectorConstructor = new (options: { formats: BarcodeFormat[] }) => Detector;

let detectorPromise: Promise<Detector> | null = null;

async function getDetector(): Promise<Detector> {
  if (!detectorPromise) {
    const next = (async () => {
      const NativeDetector = (
        globalThis as typeof globalThis & {
          BarcodeDetector?: DetectorConstructor;
        }
      ).BarcodeDetector;
      if (NativeDetector) {
        try {
          return new NativeDetector({ formats: FORMATS });
        } catch {
          // Some browsers expose an incomplete implementation. Fall back to ZXing.
        }
      }
      const mod = await import('barcode-detector/ponyfill');
      // Serve the wasm from our own origin so it is precached and works offline.
      mod.prepareZXingModule({
        overrides: {
          locateFile: (path: string, prefix: string) =>
            path.endsWith('.wasm') ? `${import.meta.env.BASE_URL}zxing/${path}` : prefix + path,
        },
      });
      return new mod.BarcodeDetector({ formats: FORMATS }) as unknown as Detector;
    })();
    detectorPromise = next;
    next.catch(() => {
      // A failed WASM download must not poison every later Restart/Photo attempt.
      if (detectorPromise === next) detectorPromise = null;
    });
  }
  return detectorPromise;
}

function hasGtinChecksum(value: string): boolean {
  const digits = [...value].map(Number);
  const check = digits.pop();
  if (check === undefined || digits.some((n) => !Number.isInteger(n))) return false;
  let sum = 0;
  for (let i = digits.length - 1, position = 0; i >= 0; i--, position++) {
    sum += digits[i] * (position % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === check;
}

function expandUpcE(value: string): string | null {
  if (!/^\d{8}$/.test(value)) return null;
  const [numberSystem, a, b, c, d, e, mode, check] = value;
  let body: string;
  if (mode === '0' || mode === '1' || mode === '2')
    body = `${numberSystem}${a}${b}${mode}0000${c}${d}${e}`;
  else if (mode === '3') body = `${numberSystem}${a}${b}${c}00000${d}${e}`;
  else if (mode === '4') body = `${numberSystem}${a}${b}${c}${d}00000${e}`;
  else body = `${numberSystem}${a}${b}${c}${d}${e}0000${mode}`;
  return body + check;
}

export function isValidBarcode(value: string, format?: string): boolean {
  const code = value.trim();
  if (!looksLikeBarcode(code)) return false;
  if (code.length !== 8) return hasGtinChecksum(code);
  if (format?.toLowerCase() === 'upc_e') {
    const expanded = expandUpcE(code);
    return !!expanded && hasGtinChecksum(expanded);
  }
  const expanded = expandUpcE(code);
  return hasGtinChecksum(code) || (!!expanded && hasGtinChecksum(expanded));
}

function bestResult(results: { rawValue: string; format: string }[]): string | null {
  const plausible = results.find((r) => isValidBarcode(r.rawValue, r.format));
  return plausible?.rawValue ?? null;
}

export async function scanImage(src: ImageBitmapSource): Promise<string | null> {
  const d = await getDetector();
  const results = await d.detect(src);
  return bestResult(results);
}

/**
 * Poll a playing <video> at ~5 fps until a checksum-valid retail barcode is found or aborted.
 * A valid checksum lets us accept a single clear frame instead of demanding consecutive frames,
 * which was unreliable with hand-held cameras.
 */
export async function scanVideo(
  video: HTMLVideoElement,
  signal: AbortSignal,
): Promise<string | null> {
  const d = await getDetector();
  while (!signal.aborted) {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      try {
        const results = await d.detect(video);
        const value = bestResult(results);
        if (value) return value;
      } catch {
        /* frame not ready */
      }
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

export function looksLikeBarcode(s: string): boolean {
  return /^\d{8}$|^\d{12,14}$/.test(s.trim());
}
