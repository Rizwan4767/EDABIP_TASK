import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = join(root, 'src/assets/images/auth-robotic-hand.svg');
const pngPath = join(root, 'src/assets/images/auth-robotic-hand.png');

const svg = readFileSync(svgPath, 'utf8');
const match = svg.match(/xlink:href="data:image\/png;base64,([^"]+)"/);

if (!match?.[1]) {
  throw new Error('Could not find embedded PNG in auth-robotic-hand.svg');
}

writeFileSync(pngPath, Buffer.from(match[1], 'base64'));
console.log(`Wrote ${pngPath}`);
