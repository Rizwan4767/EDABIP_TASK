import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(mobileRoot, '..');
const fe = path.join(repoRoot, 'edabip-frontend', 'src', 'assets', 'dashboard');
const iconDir = path.join(mobileRoot, 'src', 'assets', 'dashboard', 'icons');
const pngDir = path.join(mobileRoot, 'src', 'assets', 'dashboard', 'png');

const copies = [
  ['Sidebar/dashboard-icon.svg', 'sidebar-dashboard.svg'],
  ['Sidebar/powerbi.svg', 'sidebar-powerbi.svg'],
  ['Sidebar/analytics.svg', 'sidebar-analytics.svg'],
  ['Sidebar/report.svg', 'sidebar-report.svg'],
  ['Sidebar/billing.svg', 'sidebar-billing.svg'],
  ['Sidebar/users.svg', 'sidebar-users.svg'],
  ['Sidebar/settings.svg', 'sidebar-settings.svg'],
  ['Sidebar/logout.svg', 'sidebar-logout.svg'],
  ['Sidebar/ai-chatbot.svg', 'sidebar-ai.svg'],
  ['powerbi/card-assests/Sales.svg', 'pbi-sales.svg'],
  ['powerbi/card-assests/finance.svg', 'pbi-finance.svg'],
  ['powerbi/card-assests/customer.svg', 'pbi-customer.svg'],
  ['powerbi/card-assests/HR.svg', 'pbi-hr.svg'],
  ['powerbi/card-assests/ops-icon.svg', 'pbi-ops.svg'],
  ['powerbi/last-refreshed.svg', 'pbi-clock.svg'],
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

for (const [fromRel, toName] of copies) {
  const src = path.join(fe, fromRel);
  const dest = path.join(iconDir, toName);
  const svg = sanitize(fs.readFileSync(src, 'utf8'));
  fs.writeFileSync(dest, svg);

  const widthMatch = svg.match(/width="([\d.]+)"/);
  const heightMatch = svg.match(/height="([\d.]+)"/);
  const width = Math.max(1, Math.round(Number(widthMatch?.[1] ?? 24) * 3));
  const height = Math.max(1, Math.round(Number(heightMatch?.[1] ?? 24) * 3));
  const outPath = path.join(pngDir, toName.replace(/\.svg$/u, '.png'));

  await sharp(Buffer.from(svg), { density: 288 })
    .resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outPath);

  console.log(`wrote ${path.relative(mobileRoot, outPath)} (${width}x${height})`);
}
