/**
 * Thin wrapper over the `barcode-detector` ponyfill (native BarcodeDetector on Android
 * Chrome, zxing-wasm elsewhere). Kept behind one interface so the engine can be swapped.
 */
export type BarcodeFormat = 'ean_13' | 'ean_8' | 'upc_a' | 'upc_e';
const FORMATS: BarcodeFormat[] = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

type Detector = {
  detect: (src: ImageBitmapSource) => Promise<{ rawValue: string; format: string }[]>;
};

let detectorPromise: Promise<Detector> | null = null;

async function getDetector(): Promise<Detector> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
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
  }
  return detectorPromise;
}

export async function scanImage(src: ImageBitmapSource): Promise<string | null> {
  const d = await getDetector();
  const results = await d.detect(src);
  return results[0]?.rawValue ?? null;
}

/**
 * Poll a playing <video> at ~5 fps until a barcode is found or the signal aborts.
 * Requires two consecutive identical reads to avoid one-frame misreads.
 */
export async function scanVideo(
  video: HTMLVideoElement,
  signal: AbortSignal,
): Promise<string | null> {
  const d = await getDetector();
  let last: string | null = null;
  while (!signal.aborted) {
    if (video.readyState >= 2 && video.videoWidth > 0) {
      try {
        const results = await d.detect(video);
        const v = results[0]?.rawValue ?? null;
        if (v && v === last) return v;
        last = v;
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
