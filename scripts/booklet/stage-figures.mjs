// Copies the PNGs a bank's cards and blocks actually reference out of the gitignored
// pandoc extraction directory (`booklets/**/media/**`) and into the bank's own
// `figures/` folder, which IS tracked.
//
//   node scripts/booklet/stage-figures.mjs --bank s5-trig-c-2 \
//     --from ".agywork/booklet/s5-trig-c-2/parsed"        # stage what the parser found
//   node scripts/booklet/stage-figures.mjs --bank s5-trig-c-2   # stage what the bank uses
//
// Staging only the referenced files keeps the repo free of the ~40% of extracted images a
// booklet never actually shows, and makes the bank self-contained: a renderer needs the
// bank directory and nothing else.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, basename } from 'node:path';
import { rejectStrayPositionals } from '../lib/argv.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function arg(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : fallback;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''));
}

/** Every `figure.png` basename anywhere in a parsed skeleton or a bank section file. */
export function referencedPngs(value, found = new Set()) {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    for (const v of value) referencedPngs(v, found);
    return found;
  }
  if (typeof value.png === 'string') found.add(basename(value.png));
  for (const v of Object.values(value)) referencedPngs(v, found);
  return found;
}

function main() {
  const argv = process.argv.slice(2);
  rejectStrayPositionals(argv, { valueFlags: ['--bank', '--from', '--media'], boolFlags: ['--dry-run'] });
  const bank = arg(argv, '--bank');
  if (!bank) {
    console.error('usage: node scripts/booklet/stage-figures.mjs --bank <slug> [--from <parsed dir>] [--media <dir>] [--dry-run]');
    process.exit(2);
  }
  const bankDir = join(ROOT, 'booklets', 'bank', bank);
  const headerPath = join(bankDir, 'bank.json');
  if (!existsSync(headerPath)) {
    console.error(`✗ no bank at booklets/bank/${bank}/bank.json`);
    process.exit(1);
  }
  const header = readJson(headerPath);

  // Where to read the referenced names from: a parsed skeleton dir, or the bank itself.
  const sources = [];
  const fromArg = arg(argv, '--from');
  if (fromArg) {
    const fromDir = resolve(ROOT, fromArg);
    for (const name of readdirSync(fromDir)) {
      if (name.endsWith('.json') && name !== 'index.json' && name !== 'cover.json') sources.push(join(fromDir, name));
    }
  } else {
    for (const sub of ['cards', 'blocks']) {
      const dir = join(bankDir, sub);
      if (!existsSync(dir)) continue;
      for (const name of readdirSync(dir)) if (name.endsWith('.json')) sources.push(join(dir, name));
    }
  }
  if (!sources.length) {
    console.error('✗ nothing to read figure references from — pass --from <parsed dir> or populate the bank first');
    process.exit(1);
  }

  const wanted = new Set();
  for (const file of sources) referencedPngs(readJson(file), wanted);

  const mediaDir = resolve(ROOT, arg(argv, '--media', header.sourceMediaDir || ''));
  if (!header.sourceMediaDir && !arg(argv, '--media')) {
    console.error('✗ bank.json has no "sourceMediaDir" and no --media was given');
    process.exit(1);
  }
  if (!existsSync(mediaDir)) {
    console.error(`✗ media directory not found: ${mediaDir}`);
    console.error('  Regenerate it with: pandoc --extract-media …  (booklets/**/media/ is gitignored)');
    process.exit(1);
  }

  const figuresDir = join(bankDir, 'figures');
  const dryRun = argv.includes('--dry-run');
  if (!dryRun) mkdirSync(figuresDir, { recursive: true });

  let copied = 0;
  let skipped = 0;
  let bytes = 0;
  const missing = [];
  for (const png of [...wanted].sort()) {
    const from = join(mediaDir, png);
    if (!existsSync(from)) {
      missing.push(png);
      continue;
    }
    const to = join(figuresDir, png);
    if (existsSync(to) && statSync(to).size === statSync(from).size) {
      skipped++;
      continue;
    }
    bytes += statSync(from).size;
    if (!dryRun) copyFileSync(from, to);
    copied++;
  }

  console.log(`${dryRun ? '[dry run] ' : ''}Staged figures for ${bank}: ${copied} copied, ${skipped} already present, ${wanted.size} referenced (${(bytes / 1024).toFixed(0)} KB)`);
  if (missing.length) {
    console.error(`\n✗ ${missing.length} referenced image(s) missing from ${header.sourceMediaDir}:`);
    for (const png of missing.slice(0, 15)) console.error(`  ✗ ${png}`);
    if (missing.length > 15) console.error(`  … and ${missing.length - 15} more`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
