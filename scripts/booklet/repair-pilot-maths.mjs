#!/usr/bin/env node
import fs from 'node:fs';
const file = process.argv[2] ?? '.booklet-work/pilot-transcription.json';
const payload = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
function repair(value) {
  if (typeof value === 'string') return value.replace(/(?<!\\)\bsqrt(?=\s*\{|\s*\[)/g, '\\sqrt');
  if (Array.isArray(value)) return value.map(repair);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, repair(item)]));
  return value;
}
const fixed = repair(payload);
fs.writeFileSync(file, JSON.stringify(fixed, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ file, repaired: true }, null, 2));
