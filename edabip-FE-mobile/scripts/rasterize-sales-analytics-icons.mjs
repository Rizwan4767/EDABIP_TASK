import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const iconDir = path.join(mobileRoot, 'src', 'assets', 'powerbi', 'icons');
const pngDir = path.join(mobileRoot, 'src', 'assets', 'powerbi', 'png');

const copies = [
  'kpi-revenue.svg',
  'kpi-growth.svg',
  'kpi-customers.svg',
  'kpi-profit.svg',
  'kpi-total-revenue.svg',
  'kpi-net-profit.svg',
  'kpi-operating-expenses.svg',
  'kpi-cash-flow.svg',
  'kpi-total-customers.svg',
  'kpi-churn-rate.svg',
  'kpi-avg-order.svg',
  'kpi-est-clv.svg',
  'kpi-total-headcount.svg',
  'kpi-turnover-rate.svg',
  'kpi-enps-score.svg',
  'kpi-time-to-hire.svg',
  'kpi-system-uptime.svg',
  'kpi-active-incidents.svg',
  'kpi-avg-response.svg',
  'kpi-security-compliance.svg',
  'health-status.svg',
  'arrow-up.svg',
  'arrow-down.svg',
  'arrow-up-green.svg',
  'arrow-up-red.svg',
  'arrow-down-red.svg',
  'arrow-down-green.svg',
  'chevron-down.svg',
  'kebab.svg',
  'world-map.svg',
  'calender-icon.svg',
];

function sanitize(svg) {
  return svg
    .replace(/\sstyle="[^"]*"/g, '')
    .replace(/\spreserveAspectRatio="[^"]*"/g, '')
    .replace(/\soverflow="[^"]*"/g, '')
    .replaceAll('currentColor', '#000000');
}

fs.mkdirSync(iconDir, { recursive: true });
fs.mkdirSync(pngDir, { recursive: true });

for (const name of copies) {
  const src = path.join(iconDir, name);
  const svg = sanitize(fs.readFileSync(src, 'utf8'));
  fs.writeFileSync(src, svg);

  const widthMatch = svg.match(/width="([\d.]+)"/);
  const heightMatch = svg.match(/height="([\d.]+)"/);
  const scale = name === 'world-map.svg' ? 2 : 3;
  const width = Math.max(1, Math.round(Number(widthMatch?.[1] ?? 24) * scale));
  const height = Math.max(1, Math.round(Number(heightMatch?.[1] ?? 24) * scale));
  const outPath = path.join(pngDir, name.replace(/\.svg$/u, '.png'));

  await sharp(Buffer.from(svg), { density: 288 })
    .resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outPath);

  console.log(`wrote ${path.relative(mobileRoot, outPath)} (${width}x${height})`);
}
