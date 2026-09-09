export interface PreparedImage {
  base64: string;
  mediaType: 'image/jpeg';
  thumb: Blob;
  width: number;
  height: number;
  bytes: number;
}

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawTo(src: ImageBitmap | HTMLImageElement, maxEdge: number): HTMLCanvasElement {
  const sw = 'naturalWidth' in src ? src.naturalWidth : src.width;
  const sh = 'naturalHeight' in src ? src.naturalHeight : src.height;
  const ratio = Math.min(1, maxEdge / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * ratio));
  const h = Math.max(1, Math.round(sh * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(src, 0, 0, w, h);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality);
  });
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

/**
 * Downscale and re-encode a photo as JPEG for the API (strips EXIF, fixes rotation),
 * and produce a small thumbnail for the diary.
 */
export async function prepareImage(
  file: Blob,
  maxEdge = 1024,
  quality = 0.82,
  maxBytes = 1_200_000,
): Promise<PreparedImage> {
  const src = await decode(file);
  const canvas = drawTo(src, maxEdge);
  let blob = await toBlob(canvas, quality);
  if (blob.size > maxBytes) blob = await toBlob(canvas, 0.7);
  if (blob.size > maxBytes) {
    const smaller = drawTo(src, Math.round(maxEdge * 0.75));
    blob = await toBlob(smaller, 0.7);
  }
  const thumbCanvas = drawTo(src, 256);
  const thumb = await toBlob(thumbCanvas, 0.75);
  if ('close' in src) src.close();
  return {
    base64: await blobToBase64(blob),
    mediaType: 'image/jpeg',
    thumb,
    width: canvas.width,
    height: canvas.height,
    bytes: blob.size,
  };
}

export function base64ToBlob(base64: string, type = 'image/jpeg'): Blob {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}
