import { Buffer } from 'node:buffer';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'src/assets/images/auth-sheet-curve.png');

/**
 * White card top edge from Figma (subtract rotated 180°):
 * shoulders high at left/right, deep scoop in the center so teal dips in.
 */
const width = 716;
const height = 140;
const w = width;
const h = height;

// y=0 top, y=h bottom. White fills under the curve.
const path = [
  `M 0 ${h}`,
  `L 0 ${h * 0.06}`,
  `C ${w * 0.18} ${h * 0.06} ${w * 0.32} ${h * 0.98} ${w * 0.5} ${h * 0.98}`,
  `C ${w * 0.68} ${h * 0.98} ${w * 0.82} ${h * 0.06} ${w} ${h * 0.06}`,
  `L ${w} ${h}`,
  'Z',
].join(' ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${path}" fill="#FFFFFF"/></svg>`;

await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log(`Wrote ${outPath}`);
