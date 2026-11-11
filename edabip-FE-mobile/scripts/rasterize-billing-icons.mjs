import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'src', 'assets', 'billing', 'icons');
const outDir = path.join(root, 'src', 'assets', 'billing', 'png');

fs.mkdirSync(outDir, { recursive: true });

function sanitize(svg) {
  return svg
    .replace(/\sstyle="[^"]*"/g, '')
    .replace(/\spreserveAspectRatio="[^"]*"/g, '')
    .replace(/\soverflow="[^"]*"/g, '')
    .replaceAll('currentColor', '#000000');
}

const files = fs.readdirSync(sourceDir).filter((file) => file.endsWith('.svg'));

for (const file of files) {
  const svgPath = path.join(sourceDir, file);
  const svg = sanitize(fs.readFileSync(svgPath, 'utf8'));
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

for (const file of ['radio-selected.png', 'radio-idle.png']) {
  const src = path.join(outDir, file);
  if (!fs.existsSync(src)) continue;
  const buffer = fs.readFileSync(src);
  const image = sharp(buffer);
  const meta = await image.metadata();
  const width = Math.max(48, (meta.width ?? 16) * 3);
  const height = Math.max(48, (meta.height ?? 16) * 3);
  await image
    .resize(width, height, {
      kernel: 'lanczos3',
      fit: 'fill',
    })
    .png()
    .toFile(src);
  console.log(`upscaled ${path.relative(root, src)} (${width}x${height})`);
}
