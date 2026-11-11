import fs from 'fs';
import path from 'path';

const src = path.resolve('src/assets/dashboard/charts/active-users-bars.svg');
const outDir = path.resolve('src/assets/dashboard/charts/bars');
fs.mkdirSync(outDir, { recursive: true });

const svg = fs.readFileSync(src, 'utf8');
const pathRe = /<path id="(Vector(?:_\d+)?)"([^>]*) d="([^"]+)" fill="([^"]+)"/g;
const paths = [];
let m;
while ((m = pathRe.exec(svg))) {
  paths.push({
    id: m[1],
    opacity: (m[2].match(/opacity="([^"]+)"/) || [])[1],
    d: m[3],
    fill: m[4],
  });
}

// Crop boxes from Figma orange-dot centers + spray extents (viewBox y starts at bar top).
const bars = [
  { day: 'sun', id: 'Vector', cx: 24, top: 61, bottom: 250 },
  { day: 'mon', id: 'Vector_2', cx: 102, top: 151, bottom: 250 },
  { day: 'tues', id: 'Vector_3', cx: 189, top: 89, bottom: 250 },
  { day: 'wed', id: 'Vector_5', cx: 270, top: 14, bottom: 250 },
  { day: 'thu', id: 'Vector_6', cx: 343, top: 61, bottom: 250 },
  { day: 'fri', id: 'Vector_7', cx: 413, top: 125, bottom: 250 },
];

const halfW = 10;

for (const bar of bars) {
  const p = paths.find((x) => x.id === bar.id);
  if (!p) {
    console.error('Missing', bar.id);
    continue;
  }
  const x = bar.cx - halfW;
  const y = bar.top;
  const w = halfW * 2;
  const h = bar.bottom - bar.top;
  const opacityAttr = p.opacity ? ` opacity="${p.opacity}"` : '';
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" fill="none" preserveAspectRatio="none">
<path${opacityAttr} d="${p.d}" fill="${p.fill}"/>
</svg>
`;
  fs.writeFileSync(path.join(outDir, `${bar.day}.svg`), out);
  console.log(bar.day, `${w}x${h}`);
}

// Sat not in export — reuse Sun spray (similar mid height) shifted via same crop pattern from Fri width
const sun = paths.find((x) => x.id === 'Vector');
const satSrc = sun; // closer height to 47590
const sat = { cx: 24, top: 61, bottom: 250 };
const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${sat.cx - halfW} ${sat.top} ${halfW * 2} ${sat.bottom - sat.top}" fill="none" preserveAspectRatio="none">
<path d="${satSrc.d}" fill="${satSrc.fill}"/>
</svg>
`;
fs.writeFileSync(path.join(outDir, 'sat.svg'), out);
console.log('sat (from sun)');
