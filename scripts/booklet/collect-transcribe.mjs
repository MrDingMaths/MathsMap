// Collects the transcription lane's output into the bank, refusing anything that departs
// from the skeleton the deterministic parser produced.
//
//   node scripts/booklet/collect-transcribe.mjs --bank s5-trig-c-2 \
//     --tasks-dir .agywork/booklet/s5-trig-c-2/transcribe \
//     --parsed .agywork/booklet/s5-trig-c-2/parsed
//
// The whole point of the skeleton is that a transcription can be PROVEN faithful in the
// mechanical respects: every card and part present exactly once, no invented ids, no
// renumbering, and `id`, `tier`, `origin`, `figure.png`, `figure.crop` and part labels
// unchanged. Wording and tagging still need the fidelity check (run-fidelity-check.mjs) and
// a human, but nothing can silently go missing.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { rejectStrayPositionals } from '../lib/argv.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function arg(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : fallback;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''));
}

/** Raw control characters are the fingerprint of a LaTeX backslash lost to JSON.parse. */
function findRawControlChars(raw) {
  const m = raw.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/);
  return m ? `raw control character 0x${m[0].charCodeAt(0).toString(16).padStart(2, '0')} at offset ${m.index}` : null;
}

const IMMUTABLE_CARD = ['id', 'tier'];
const IMMUTABLE_FIGURE = ['png', 'crop', 'widthCm'];

function sameFigure(expected, actual) {
  if (!expected) return true; // the model may add a figure the parser did not place
  if (!actual) return false;
  for (const key of IMMUTABLE_FIGURE) {
    if (JSON.stringify(expected[key] ?? null) !== JSON.stringify(actual[key] ?? null)) return false;
  }
  return true;
}

// The extra diagrams a cell shows are as much a fact of the source as the first one, so
// they may not be dropped either — that was how a second diagram used to go missing.
function sameFigureList(expected, actual) {
  const want = expected || [];
  const got = actual || [];
  if (want.length !== got.length) return false;
  return want.every((figure, i) => sameFigure(figure, got[i]));
}

/**
 * Compare the model's cards against the skeleton's.
 * @returns {string[]} problems; empty means the transcription is structurally faithful
 */
export function checkCards(skeletonCards, actualCards, where) {
  const problems = [];
  if (!Array.isArray(actualCards)) return [`${where}: "cards" must be an array`];

  const expected = new Map(skeletonCards.map((c) => [c.id, c]));
  const seen = new Set();
  for (const card of actualCards) {
    const id = card && card.id;
    if (!expected.has(id)) {
      problems.push(`${where}: card "${id}" is not in the skeleton — the transcription may not invent cards`);
      continue;
    }
    if (seen.has(id)) {
      problems.push(`${where}: card "${id}" appears more than once`);
      continue;
    }
    seen.add(id);
    const skel = expected.get(id);

    for (const key of IMMUTABLE_CARD) {
      if (card[key] !== skel[key]) {
        problems.push(`${where} ${id}: "${key}" changed from ${JSON.stringify(skel[key])} to ${JSON.stringify(card[key])}`);
      }
    }
    if (JSON.stringify(card.origin) !== JSON.stringify(skel.origin)) {
      problems.push(`${where} ${id}: "origin" was modified — it records where the question came from and is fixed`);
    }
    if (card._source !== undefined) {
      problems.push(`${where} ${id}: "_source" is scaffolding and must be removed from the output`);
    }
    if (!sameFigure(skel.figure, card.figure)) {
      problems.push(`${where} ${id}: "figure" changed — png, crop and widthCm come from the docx and are fixed`);
    }
    if (!sameFigureList(skel.figures, card.figures)) {
      problems.push(`${where} ${id}: "figures" changed — the extra diagrams this item shows are fixed`);
    }

    const skelParts = skel.parts || [];
    const cardParts = card.parts || [];
    if (skelParts.length !== cardParts.length) {
      problems.push(`${where} ${id}: has ${cardParts.length} part(s), the skeleton has ${skelParts.length} — parts may not be added or dropped`);
    } else {
      skelParts.forEach((skelPart, i) => {
        const part = cardParts[i] || {};
        if (part.label !== skelPart.label) {
          problems.push(`${where} ${id}.parts[${i}]: label changed from "${skelPart.label}" to "${part.label}"`);
        }
        if (part._source !== undefined) {
          problems.push(`${where} ${id}.parts[${i}]: "_source" must be removed from the output`);
        }
        if (!sameFigure(skelPart.figure, part.figure)) {
          problems.push(`${where} ${id}.parts[${i}]: "figure" changed — png, crop and widthCm are fixed`);
        }
        if (!sameFigureList(skelPart.figures, part.figures)) {
          problems.push(`${where} ${id}.parts[${i}]: "figures" changed — the extra diagrams are fixed`);
        }
      });
    }
  }

  for (const id of expected.keys()) {
    if (!seen.has(id)) problems.push(`${where}: card "${id}" is missing from the transcription`);
  }
  return problems;
}

/** Every drill cell a block holds, in reading order — `cells` directly, or inside `groups`. */
function blockCells(block) {
  if (!block || typeof block !== 'object') return [];
  const out = [...(block.cells || [])];
  for (const group of block.groups || []) out.push(...(group.cells || []));
  return out;
}

export function checkBlocks(skeletonBlocks, actualBlocks, where) {
  const problems = [];
  if (!Array.isArray(actualBlocks)) return [`${where}: "blocks" must be an array`];
  const expected = new Map(skeletonBlocks.map((b) => [b.id, b]));
  const seen = new Set();

  for (const block of actualBlocks) {
    const id = block && block.id;
    if (!expected.has(id)) {
      problems.push(`${where}: block "${id}" is not in the skeleton`);
      continue;
    }
    if (seen.has(id)) {
      problems.push(`${where}: block "${id}" appears more than once`);
      continue;
    }
    seen.add(id);
    const skel = expected.get(id);
    if (block.type !== skel.type) {
      problems.push(`${where} ${id}: "type" changed from "${skel.type}" to "${block.type}"`);
    }
    if (JSON.stringify(block.origin) !== JSON.stringify(skel.origin)) {
      problems.push(`${where} ${id}: "origin" was modified`);
    }
    const stray = JSON.stringify(block).includes('"_source"');
    if (stray) problems.push(`${where} ${id}: "_source" must be removed from the output`);

    // A block's drill cells are questions too. Comparing only the block list let a whole
    // cell disappear from a Review or Identify box unnoticed — the transcription simply
    // did not emit it — which is exactly the class of loss the skeleton exists to prevent.
    const skelCells = blockCells(skel);
    const gotCells = blockCells(block);
    if (skelCells.length !== gotCells.length) {
      problems.push(`${where} ${id}: has ${gotCells.length} cell(s), the skeleton has ${skelCells.length} — drill cells may not be added or dropped`);
    } else {
      skelCells.forEach((skelCell, i) => {
        const cell = gotCells[i] || {};
        if (skelCell.label && cell.label !== skelCell.label) {
          problems.push(`${where} ${id}: cell ${i} label changed from "${skelCell.label}" to "${cell.label}"`);
        }
        if (!sameFigure(skelCell.figure, cell.figure)) {
          problems.push(`${where} ${id}: cell "${skelCell.label || i}" figure changed — png, crop and widthCm are fixed`);
        }
        if (!sameFigureList(skelCell.figures, cell.figures)) {
          problems.push(`${where} ${id}: cell "${skelCell.label || i}" extra figures changed`);
        }
      });
    }
  }
  for (const id of expected.keys()) {
    if (!seen.has(id)) problems.push(`${where}: block "${id}" is missing from the transcription`);
  }
  return problems;
}

function main() {
  const argv = process.argv.slice(2);
  rejectStrayPositionals(argv, { valueFlags: ['--bank', '--tasks-dir', '--parsed', '--only'], boolFlags: ['--dry-run', '--no-validate'] });
  const bank = arg(argv, '--bank');
  const tasksArg = arg(argv, '--tasks-dir');
  const parsedArg = arg(argv, '--parsed');
  if (!bank || !tasksArg || !parsedArg) {
    console.error('usage: node scripts/booklet/collect-transcribe.mjs --bank <slug> --tasks-dir <dir> --parsed <dir> [--only sec,sec] [--dry-run]');
    process.exit(2);
  }
  const outDir = join(resolve(ROOT, tasksArg), 'out');
  const parsedDir = resolve(ROOT, parsedArg);
  const bankDir = join(ROOT, 'booklets', 'bank', bank);
  const onlyRaw = arg(argv, '--only');
  const only = onlyRaw ? new Set(onlyRaw.split(',').map((s) => s.trim()).filter(Boolean)) : null;
  const dryRun = argv.includes('--dry-run');

  const index = readJson(join(parsedDir, 'index.json'));
  const problems = [];
  const collected = [];
  const missing = [];
  const reports = [];

  for (const entry of index.sections) {
    if (only && !only.has(entry.slug)) continue;
    const skeleton = readJson(join(parsedDir, `${entry.slug}.json`));
    const cardsPath = join(outDir, `${entry.slug}.cards.json`);
    const blocksPath = join(outDir, `${entry.slug}.blocks.json`);
    const reportPath = join(outDir, `${entry.slug}.report.json`);

    // A section the task builder skipped (no questions) is written straight from the
    // skeleton: the parser already produced its final shape.
    const modelRan = existsSync(cardsPath) || existsSync(blocksPath);
    if (!modelRan) {
      const hasCards = skeleton.cards.length > 0;
      if (hasCards) {
        missing.push(entry.slug);
        continue;
      }
      collected.push({
        slug: entry.slug,
        cards: { bank, section: entry.slug, cards: [] },
        blocks: { bank, section: entry.slug, blocks: skeleton.blocks.map(stripSource) },
        fromSkeleton: true,
      });
      continue;
    }

    const load = (path, key) => {
      if (!existsSync(path)) return null;
      const raw = readFileSync(path, 'utf8').replace(/^﻿/, '');
      const bad = findRawControlChars(raw);
      if (bad) {
        problems.push(`${entry.slug}: ${path} contains a ${bad} — a LaTeX backslash was not doubled in the JSON`);
        return null;
      }
      try {
        const doc = JSON.parse(raw);
        if (doc.bank !== bank) problems.push(`${entry.slug}: "bank" is ${JSON.stringify(doc.bank)}, expected "${bank}"`);
        if (doc.section !== entry.slug) problems.push(`${entry.slug}: "section" is ${JSON.stringify(doc.section)}`);
        return doc[key] || [];
      } catch (e) {
        problems.push(`${entry.slug}: ${path}: ${e.message}`);
        return null;
      }
    };

    const cards = load(cardsPath, 'cards') || [];
    const blocks = load(blocksPath, 'blocks') || [];
    problems.push(...checkCards(skeleton.cards, cards, entry.slug));
    problems.push(...checkBlocks(skeleton.blocks, blocks, entry.slug));

    if (existsSync(reportPath)) {
      try {
        reports.push(readJson(reportPath));
      } catch (e) {
        problems.push(`${entry.slug}: report is not valid JSON: ${e.message}`);
      }
    }

    collected.push({
      slug: entry.slug,
      cards: { bank, section: entry.slug, cards },
      blocks: { bank, section: entry.slug, blocks },
    });
  }

  if (missing.length) {
    console.error(`✗ ${missing.length} section(s) have no transcription output yet: ${missing.join(', ')}`);
    console.error(`  Run: node scripts/agy/run-gen.mjs --tasks-dir ${tasksArg}`);
  }
  if (problems.length) {
    console.error(`\n✗ ${problems.length} skeleton-fidelity problem(s) — nothing was written:`);
    for (const p of problems.slice(0, 40)) console.error(`  ✗ ${p}`);
    if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
    process.exit(1);
  }
  if (missing.length) process.exit(1);

  if (!dryRun) {
    mkdirSync(join(bankDir, 'cards'), { recursive: true });
    mkdirSync(join(bankDir, 'blocks'), { recursive: true });
    for (const section of collected) {
      writeFileSync(join(bankDir, 'cards', `${section.slug}.json`), `${JSON.stringify(section.cards, null, 2)}\n`, 'utf8');
      writeFileSync(join(bankDir, 'blocks', `${section.slug}.json`), `${JSON.stringify(section.blocks, null, 2)}\n`, 'utf8');
    }
  }

  const cardTotal = collected.reduce((n, s) => n + s.cards.cards.length, 0);
  const blockTotal = collected.reduce((n, s) => n + s.blocks.blocks.length, 0);
  console.log(`${dryRun ? '[dry run] ' : ''}Collected ${collected.length} section(s) into booklets/bank/${bank}: ${cardTotal} card(s), ${blockTotal} block(s).`);

  const errata = reports.flatMap((r) => (r.bookletErrata || []).map((e) => `${r.id}: ${typeof e === 'string' ? e : JSON.stringify(e)}`));
  const uncertain = reports.flatMap((r) => (r.uncertain || []).map((u) => `${r.id}: ${typeof u === 'string' ? u : `${u.id} — ${u.note}`}`));
  if (errata.length) {
    console.log(`\n  ${errata.length} booklet erratum/errata reported (transcribed verbatim by design):`);
    for (const e of errata) console.log(`    • ${e}`);
  }
  if (uncertain.length) {
    console.log(`\n  ${uncertain.length} item(s) the transcription was unsure about:`);
    for (const u of uncertain) console.log(`    • ${u}`);
  }

  if (!dryRun && !argv.includes('--no-validate')) {
    const args = ['scripts/booklet/validate-bank.mjs', '--bank', bank, '--no-recipes'];
    if (only) args.push('--only', [...only].join(','));
    console.log('');
    const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
  }
}

function stripSource(value) {
  if (Array.isArray(value)) return value.map(stripSource);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([k]) => k !== '_source').map(([k, v]) => [k, stripSource(v)]));
  }
  return value;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
