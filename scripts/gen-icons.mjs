import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';

const svg = readFileSync(new URL('../public/icons/favicon.svg', import.meta.url));
mkdirSync('public/icons', { recursive: true });

const targets = [
  ['public/icons/pwa-192.png', 192, false],
  ['public/icons/pwa-512.png', 512, false],
  ['public/icons/pwa-maskable-512.png', 512, true],
  ['public/icons/apple-touch-icon-180.png', 180, true],
];

for (const [out, size, padded] of targets) {
  let img = sharp(svg).resize(size, size);
  if (padded) {
    // Maskable icons need ~10% safe zone: shrink art and paint background.
    const inner = Math.round(size * 0.8);
    const art = await sharp(svg).resize(inner, inner).png().toBuffer();
    img = sharp({
      create: { width: size, height: size, channels: 4, background: '#f4ead8' },
    }).composite([{ input: art, gravity: 'centre' }]);
  }
  await img.png().toFile(out);
  console.log('wrote', out);
}
