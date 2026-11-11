import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'src', 'assets', 'dashboard', 'icons');
const outDir = path.join(root, 'src', 'assets', 'dashboard', 'png');

fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.svg'));

for (const file of files) {
  const svgPath = path.join(sourceDir, file);
  let svg = fs.readFileSync(svgPath, 'utf8');
  svg = svg.replaceAll('currentColor', '#000000');

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
