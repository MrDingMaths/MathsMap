// Builds booklets/bank/index.json — a generated index of what each booklet bank holds,
// so recipe resolution and reporting can answer "which cards exist, per section, per tier,
// per skill" without reading every section file. Mirrors scripts/build-manifest.mjs.
//
//   node scripts/booklet/build-bank-index.mjs            # npm run bank:index
//   node scripts/booklet/build-bank-index.mjs --check    # exit 1 if the file is stale
//
// See docs/booklet-bank-schema.md for the bank layout.
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

async function listJsonFiles(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return entries.filter((e) => e.isFile() && e.name.endsWith('.json')).map((e) => e.name).sort();
}

async function listDirs(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

async function readJson(file) {
  return JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
}

const TIERS = ['foundation', 'development', 'mastery'];

export async function buildBankIndex(options = {}) {
  const buildRootDir = options.rootDir || rootDir;
  const bankRoot = options.bankRoot || path.join(buildRootDir, 'booklets', 'bank');
  const indexPath = options.indexPath || path.join(bankRoot, 'index.json');
  const banks = {};

  for (const bankName of await listDirs(bankRoot)) {
    const bankDir = path.join(bankRoot, bankName);
    let header;
    try {
      header = await readJson(path.join(bankDir, 'bank.json'));
    } catch (err) {
      if (err.code !== 'ENOENT') console.warn(`[bank-index] skipping ${bankName}: ${err.message}`);
      continue;
    }
    const sections = {};
    const skills = {};
    let cardTotal = 0;
    let blockTotal = 0;

    for (const slug of header.sections || []) {
      const entry = { cards: [0, 0, 0], blocks: 0 };
      try {
        const doc = await readJson(path.join(bankDir, 'cards', `${slug}.json`));
        for (const card of doc.cards || []) {
          const tierIndex = TIERS.indexOf(card.tier);
          if (tierIndex >= 0) entry.cards[tierIndex]++;
          cardTotal++;
          for (const skill of card.skills || []) skills[skill] = (skills[skill] || 0) + 1;
        }
      } catch (err) {
        if (err.code !== 'ENOENT') console.warn(`[bank-index] ${bankName}/cards/${slug}.json: ${err.message}`);
      }
      try {
        const doc = await readJson(path.join(bankDir, 'blocks', `${slug}.json`));
        entry.blocks = (doc.blocks || []).length;
        blockTotal += entry.blocks;
      } catch (err) {
        if (err.code !== 'ENOENT') console.warn(`[bank-index] ${bankName}/blocks/${slug}.json: ${err.message}`);
      }
      sections[slug] = entry;
    }

    banks[header.bank || bankName] = {
      title: header.title,
      course: header.course,
      totals: { cards: cardTotal, blocks: blockTotal },
      sections,
      skills: Object.fromEntries(Object.entries(skills).sort(([a], [b]) => a.localeCompare(b))),
    };
  }

  const index = { generated: new Date().toISOString(), banks };
  const json = `${JSON.stringify(index, null, 2)}\n`;

  if (options.check) {
    let existing = null;
    try {
      existing = await fs.readFile(indexPath, 'utf8');
    } catch { /* missing counts as stale */ }
    // `generated` always differs, so compare everything else.
    const strip = (text) => {
      try {
        const { generated, ...rest } = JSON.parse(text);
        return JSON.stringify(rest);
      } catch {
        return null;
      }
    };
    const stale = existing === null || strip(existing) !== strip(json);
    return { index, stale, indexPath };
  }

  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  await fs.writeFile(indexPath, json, 'utf8');
  return { index, indexPath, banks: Object.keys(banks).length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const check = process.argv.includes('--check');
  const result = await buildBankIndex({ check });
  if (check) {
    if (result.stale) {
      console.error('✗ booklets/bank/index.json is stale — run `npm run bank:index`');
      process.exit(1);
    }
    console.log('✓ booklets/bank/index.json is up to date.');
  } else {
    const counts = Object.entries(result.index.banks)
      .map(([name, b]) => `${name}: ${b.totals.cards} card(s), ${b.totals.blocks} block(s)`)
      .join('; ');
    console.log(`✓ Wrote ${path.relative(rootDir, result.indexPath).split('\\').join('/')} — ${result.banks} bank(s)${counts ? ` (${counts})` : ''}.`);
  }
}
