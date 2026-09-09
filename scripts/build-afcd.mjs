/**
 * Converts the FSANZ Australian Food Composition Database (Release 3) "Nutrient profiles"
 * workbook into a compact JSON bundle.
 *
 * Usage: download "AFCD Release 3 - Nutrient profiles.xlsx" from
 * https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/data-files
 * into data-src/ (gitignored), then `npm run afcd`.
 *
 * Output row: [key, name, kJ, protein, fat, carbs, fibre, sugars, sodiumMg] per 100 g.
 */
import XLSX from 'xlsx';
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'data-src';
const file = readdirSync(dir).find((f) => /nutrient.?profiles/i.test(f) && f.endsWith('.xlsx'));
if (!file) {
  console.error('No AFCD nutrient profiles workbook found in data-src/.');
  process.exit(1);
}
const wb = XLSX.readFile(join(dir, file));
const ws = wb.Sheets['All solids & liquids per 100 g'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
const hdrIdx = rows.findIndex((r) => r && r.some((c) => String(c).includes('Public Food Key')));
const hdr = rows[hdrIdx].map((c) =>
  String(c ?? '')
    .replace(/\s+/g, ' ')
    .trim(),
);
const col = (re) => {
  const i = hdr.findIndex((h) => re.test(h));
  if (i < 0) throw new Error(`column not found: ${re}`);
  return i;
};
const C = {
  key: col(/^Public Food Key$/i),
  cls: col(/^Classification$/i),
  name: col(/^Food Name$/i),
  kj: col(/^Energy with dietary fibre/i),
  protein: col(/^Protein \(g\)/i),
  fat: col(/^Fat, total \(g\)/i),
  fibre: col(/^Total dietary fibre \(g\)/i),
  sugars: col(/^Total sugars \(g\)/i),
  carbs: col(/^Available carbohydrate, with sugar alcohols/i),
  sodium: col(/^Sodium \(Na\) \(mg\)/i),
};
const n = (v) => {
  const x = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(x) ? Math.round(x * 10) / 10 : 0;
};
// Skip a handful of groups that make no sense to log as food.
const SKIP_CLASS_PREFIX = ['33']; // infant formulae and foods
const out = [];
for (const r of rows.slice(hdrIdx + 1)) {
  if (!r || !r[C.key] || !r[C.name]) continue;
  const cls = String(r[C.cls] ?? '');
  if (SKIP_CLASS_PREFIX.some((p) => cls.startsWith(p))) continue;
  const kj = n(r[C.kj]);
  out.push([
    String(r[C.key]),
    String(r[C.name]).trim(),
    Math.round(kj),
    n(r[C.protein]),
    n(r[C.fat]),
    n(r[C.carbs]),
    n(r[C.fibre]),
    n(r[C.sugars]),
    Math.round(n(r[C.sodium])),
  ]);
}
out.sort((a, b) => a[1].localeCompare(b[1]));
mkdirSync('src/data', { recursive: true });
writeFileSync(
  'src/data/afcd.json',
  JSON.stringify({
    source: `FSANZ AFCD Release 3, ${file}`,
    generatedAt: new Date().toISOString().slice(0, 10),
    rows: out,
  }),
);
console.log(`wrote src/data/afcd.json with ${out.length} foods`);
