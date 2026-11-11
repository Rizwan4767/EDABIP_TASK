import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'src', 'assets', 'landing', 'icons');
const outDir = path.join(root, 'src', 'assets', 'landing', 'png');
const imageDir = path.join(root, 'src', 'assets', 'landing', 'images');

fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.svg'));

for (const file of files) {
  const svgPath = path.join(sourceDir, file);
  const svg = fs.readFileSync(svgPath, 'utf8');

  const widthMatch = svg.match(/width="([\d.]+)"/);
  const heightMatch = svg.match(/height="([\d.]+)"/);
  const width = Math.max(1, Math.round(Number(widthMatch?.[1] ?? 24) * 3));
  const height = Math.max(1, Math.round(Number(heightMatch?.[1] ?? 24) * 3));

  const outPath = path.join(outDir, file.replace(/\.svg$/u, '.png'));
  await sharp(Buffer.from(svg), { density: 288 })
    .resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outPath);

  console.log(`wrote ${path.relative(root, outPath)} (${width}x${height})`);
}

const sovereigntySource = path.join(imageDir, 'data-sovereignty.png');
const sovereigntyMeta = await sharp(sovereigntySource).metadata();
if (sovereigntyMeta.width !== 396 || sovereigntyMeta.height !== 243) {
  const sovereigntyOut = path.join(imageDir, 'data-sovereignty.png');
  const tmpOut = path.join(imageDir, 'data-sovereignty.tmp.png');
  await sharp(sovereigntySource)
    .resize(396, 243, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(tmpOut);
  fs.renameSync(tmpOut, sovereigntyOut);
  console.log(
    `wrote ${path.relative(root, sovereigntyOut)} (396x243) from ${sovereigntyMeta.width}x${sovereigntyMeta.height}`,
  );
}
