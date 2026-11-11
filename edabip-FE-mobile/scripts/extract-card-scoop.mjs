import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'src/assets/images/card-curve-sheet.png');
const outPath = join(root, 'src/assets/images/auth-sheet-curve.png');

/**
 * Extract the top U-scoop strip from the Figma card silhouette,
 * cropped tight to the white card bounds (no transparent side gutters).
 */
const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({
  resolveWithObject: true,
});

const w = info.width;
const h = info.height;
const channels = info.channels;

const isWhite = (x, y) => {
  const i = (y * w + x) * channels;
  return data[i + 3] > 200 && data[i] > 200;
};

let minX = w;
let maxX = 0;
let minY = h;

for (let y = 0; y < h; y += 1) {
  for (let x = 0; x < w; x += 1) {
    if (!isWhite(x, y)) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
  }
}

const cx = Math.floor((minX + maxX) / 2);
let scoopY = minY;
for (let y = minY; y < h; y += 1) {
  if (isWhite(cx, y)) {
    scoopY = y;
    break;
  }
}

const cropHeight = scoopY - minY + 24;

await sharp(sourcePath)
  .extract({
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: cropHeight,
  })
  .png()
  .toFile(outPath);

console.log(`Cropped scoop ${maxX - minX + 1}x${cropHeight} (depth≈${scoopY - minY}) → ${outPath}`);
