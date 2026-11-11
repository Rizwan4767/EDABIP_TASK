import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(mobileRoot, '..');
const fe = path.join(repoRoot, 'edabip-frontend', 'src', 'assets', 'dashboard');
const iconDir = path.join(mobileRoot, 'src', 'assets', 'tableau', 'icons');
const pngDir = path.join(mobileRoot, 'src', 'assets', 'tableau', 'png');
const sidebarIconDir = path.join(mobileRoot, 'src', 'assets', 'dashboard', 'icons');
const sidebarPngDir = path.join(mobileRoot, 'src', 'assets', 'dashboard', 'png');

const screenCopies = [
  ['tableau/kpi-revenue.svg', 'kpi-revenue.svg'],
  ['tableau/kpi-profit.svg', 'kpi-profit.svg'],
  ['tableau/kpi-customers.svg', 'kpi-customers.svg'],
  ['tableau/kpi-active-projects.svg', 'kpi-active-projects.svg'],
  ['tableau/kpi-incidents-1.svg', 'kpi-incidents.svg'],
  ['tableau/kpi-profit-2.svg', 'kpi-uptime.svg'],
  ['tableau/kpi-sales-performance.svg', 'kpi-sales-performance.svg'],
  ['tableau/kpi-folder.svg', 'kpi-folder.svg'],
  ['tableau/activity-share.svg', 'activity-share.svg'],
  ['tableau/kpi-customer-insights.svg', 'kpi-customer-insights.svg'],
  ['tableau/donut-chart.svg', 'donut-chart.svg'],
  ['tableau/sparkline-up.svg', 'sparkline-up.svg'],
  ['tableau/sparkline-down.svg', 'sparkline-down.svg'],
  ['tableau/trend-up-green.svg', 'trend-up.svg'],
  ['tableau/trend-down.svg', 'trend-down.svg'],
  ['tableau/arrow-up.svg', 'arrow-up.svg'],
  ['tableau/arrow-down.svg', 'arrow-down.svg'],
  ['tableau/chevron-down.svg', 'chevron-down.svg'],
];

const sidebarCopies = [['Sidebar/tableau.svg', 'sidebar-tableau.svg']];

function sanitize(svg) {
  return svg
    .replace(/\sstyle="[^"]*"/g, '')
    .replace(/\spreserveAspectRatio="[^"]*"/g, '')
    .replace(/\soverflow="[^"]*"/g, '')
    .replaceAll('currentColor', '#000000');
}

async function rasterize(srcRel, destName, destIconDir, destPngDir) {
  const src = path.join(fe, srcRel);
  const dest = path.join(destIconDir, destName);
  const svg = sanitize(fs.readFileSync(src, 'utf8'));
  fs.writeFileSync(dest, svg);

  const widthMatch = svg.match(/width="([\d.]+)"/);
  const heightMatch = svg.match(/height="([\d.]+)"/);
  const width = Math.max(1, Math.round(Number(widthMatch?.[1] ?? 24) * 3));
  const height = Math.max(1, Math.round(Number(heightMatch?.[1] ?? 24) * 3));
  const outPath = path.join(destPngDir, destName.replace(/\.svg$/u, '.png'));

  await sharp(Buffer.from(svg), { density: 288 })
    .resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outPath);

  console.log(`wrote ${path.relative(mobileRoot, outPath)} (${width}x${height})`);
}

fs.mkdirSync(iconDir, { recursive: true });
fs.mkdirSync(pngDir, { recursive: true });
fs.mkdirSync(sidebarIconDir, { recursive: true });
fs.mkdirSync(sidebarPngDir, { recursive: true });

for (const [fromRel, toName] of screenCopies) {
  await rasterize(fromRel, toName, iconDir, pngDir);
}

for (const [fromRel, toName] of sidebarCopies) {
  await rasterize(fromRel, toName, sidebarIconDir, sidebarPngDir);
}
