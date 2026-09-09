import { z } from 'zod';
import { db, ALL_TABLES, type TableName } from '../db/db';

export const EXPORT_SCHEMA_VERSION = 1;

interface ExportFile {
  app: 'quokkal';
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  tables: Record<string, unknown[]>;
}

async function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(b);
  });
}

async function dataUrlToBlob(u: string): Promise<Blob> {
  const res = await fetch(u);
  return res.blob();
}

/** Serialise every table. Blobs become data URLs. The API key is excluded unless asked. */
export async function exportAll(
  opts: { includeKey?: boolean; includeThumbs?: boolean } = {},
): Promise<Blob> {
  const tables: Record<string, unknown[]> = {};
  for (const t of ALL_TABLES) {
    const rows = await db.table(t).toArray();
    tables[t] = await Promise.all(
      rows.map(async (row: Record<string, unknown>) => {
        const r = { ...row };
        if (t === 'settings' && !opts.includeKey) delete r.apiKey;
        if (r.photoThumb instanceof Blob)
          r.photoThumb =
            opts.includeThumbs === false ? undefined : await blobToDataUrl(r.photoThumb);
        if (r.thumb instanceof Blob) r.thumb = await blobToDataUrl(r.thumb);
        return r;
      }),
    );
  }
  const file: ExportFile = {
    app: 'quokkal',
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: __APP_VERSION__,
    tables,
  };
  await db.settings.update('me', { lastExportAt: Date.now() });
  return new Blob([JSON.stringify(file)], { type: 'application/json' });
}

const FileSchema = z.object({
  app: z.literal('quokkal'),
  schemaVersion: z.number().int().min(1).max(EXPORT_SCHEMA_VERSION),
  exportedAt: z.string(),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});

export async function parseExport(
  text: string,
): Promise<
  | { ok: true; file: z.infer<typeof FileSchema>; counts: Record<string, number> }
  | { ok: false; error: string }
> {
  try {
    const json = JSON.parse(text);
    const parsed = FileSchema.safeParse(json);
    if (!parsed.success) return { ok: false, error: 'That file is not a Quokkal export.' };
    const counts: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed.data.tables)) counts[k] = v.length;
    return { ok: true, file: parsed.data, counts };
  } catch {
    return { ok: false, error: 'Could not read that file as JSON.' };
  }
}

/**
 * Import. `replace` wipes first; `merge` upserts by primary key and keeps the current
 * device's API key and settings unless the file carries a key.
 */
export async function importAll(
  file: z.infer<typeof FileSchema>,
  mode: 'replace' | 'merge',
): Promise<void> {
  const currentSettings = await db.settings.get('me');
  await db.transaction(
    'rw',
    ALL_TABLES.map((t) => db.table(t)),
    async () => {
      if (mode === 'replace') for (const t of ALL_TABLES) await db.table(t).clear();
      for (const t of ALL_TABLES) {
        const rows = file.tables[t as TableName];
        if (!rows) continue;
        for (const raw of rows) {
          const r: Record<string, unknown> = { ...raw };
          if (typeof r.photoThumb === 'string') r.photoThumb = await dataUrlToBlob(r.photoThumb);
          if (typeof r.thumb === 'string') r.thumb = await dataUrlToBlob(r.thumb);
          if (t === 'settings') {
            if (!r.apiKey && currentSettings?.apiKey) r.apiKey = currentSettings.apiKey;
            r.onboarded = true;
          }
          await db.table(t).put(r);
        }
      }
    },
  );
}

export async function wipeAll(): Promise<void> {
  await db.transaction(
    'rw',
    ALL_TABLES.map((t) => db.table(t)),
    async () => {
      for (const t of ALL_TABLES) await db.table(t).clear();
    },
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function shareOrDownload(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Quokkal backup' });
      return;
    } catch {
      /* user cancelled or unsupported; fall back */
    }
  }
  downloadBlob(blob, filename);
}
