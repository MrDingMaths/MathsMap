// Tooling to migrate the ad-hoc maths notation in data/*.json to KaTeX-ready
// inline LaTeX. The actual conversion is done by an LLM subagent (high quality,
// syllabus-informed); this script only does the safe mechanical parts:
//
//   node scripts/convert-latex.mjs --extract
//     Collect every maths-bearing field into scripts/_mathfields.json as
//     [{ file, id, field, before }]. The agent adds an "after" to each.
//
//   node scripts/convert-latex.mjs --apply
//     Read scripts/_mathfields.out.json and write each `after` back into the
//     matching data file by (file, id, field). Validates 1:1 coverage first.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['skills.json', 'dotpoints.json', 'topics.json', 'courses.json'];
const FIELDS = ['title', 'blurb', 'text', 'stream', 'strand'];
const WORK = join(root, 'scripts', '_mathfields.json');
const OUT = join(root, 'scripts', '_mathfields.out.json');

// A field "might contain maths" if it has any of these signals. Over-inclusive
// on purpose: the agent simply leaves a non-maths field's text unchanged.
const SIGNAL =
  /[=^_√÷×·−±≤≥≠≈⇔→∞∝∪∩∫∑ΣΔμσπθ°′½⅓∈≡≅⁰¹²³⁴⁵⁶⁷⁸⁹ⁿˣᵃᵇᶜᵈᵐⁱʳᵏᵗ⁺⁻₀₁₂₃₄₅ₐₑₙₓ]|[A-Za-z0-9]\/[A-Za-z0-9]|\d[A-Za-z]|[A-Za-z]\d|=/;

function dataPath(file) { return join(root, 'data', file); }
function loadData(file) { return JSON.parse(readFileSync(dataPath(file), 'utf8')); }

function extract() {
  const items = [];
  for (const file of FILES) {
    for (const obj of loadData(file)) {
      for (const field of FIELDS) {
        const before = obj[field];
        if (typeof before === 'string' && SIGNAL.test(before)) {
          items.push({ file, id: obj.id, field, before });
        }
      }
    }
  }
  writeFileSync(WORK, JSON.stringify(items, null, 2) + '\n');
  console.log(`Extracted ${items.length} field(s) → scripts/_mathfields.json`);
}

function apply() {
  if (!existsSync(OUT)) throw new Error(`Missing ${OUT} — run the agent first.`);
  const out = JSON.parse(readFileSync(OUT, 'utf8'));
  const work = JSON.parse(readFileSync(WORK, 'utf8'));

  // Validate coverage: every extracted field present once, with an `after`.
  const key = (x) => `${x.file}|${x.id}|${x.field}`;
  const byKey = new Map();
  for (const o of out) {
    if (typeof o.after !== 'string') throw new Error(`No "after" for ${key(o)}`);
    if (byKey.has(key(o))) throw new Error(`Duplicate entry ${key(o)}`);
    byKey.set(key(o), o);
  }
  const missing = work.filter((w) => !byKey.has(key(w)));
  if (missing.length) {
    throw new Error(`Output missing ${missing.length} field(s), e.g. ${key(missing[0])}`);
  }
  // Sanity: `before` must match what's still in the work file (agent didn't drift).
  for (const w of work) {
    const o = byKey.get(key(w));
    if (o.before !== w.before) throw new Error(`"before" drift for ${key(w)}`);
  }

  // Surgical, formatting-preserving replacement: the data files keep one object
  // per line, so for each change we find that object's line (by id) and swap the
  // exact `"field": "<before>"` substring for `"field": "<after>"`.
  let changed = 0;
  for (const file of FILES) {
    const path = dataPath(file);
    const lines = readFileSync(path, 'utf8').split('\n');
    for (const o of out.filter((x) => x.file === file)) {
      if (o.after === o.before) continue;
      const search = `"${o.field}": ${JSON.stringify(o.before)}`;
      const replace = `"${o.field}": ${JSON.stringify(o.after)}`;
      const idTag = `"id": ${JSON.stringify(o.id)}`;
      const li = lines.findIndex((l) => l.includes(idTag) && l.includes(search));
      if (li === -1) throw new Error(`Could not locate ${o.id} .${o.field} in ${file}`);
      if (lines[li].split(search).length > 2) {
        throw new Error(`Ambiguous match for ${o.id} .${o.field} in ${file}`);
      }
      lines[li] = lines[li].replace(search, replace);
      changed++;
    }
    writeFileSync(path, lines.join('\n'));
  }
  console.log(`Applied conversions; ${changed} field(s) changed.`);
}

const mode = process.argv[2];
if (mode === '--extract') extract();
else if (mode === '--apply') apply();
else console.error('Usage: convert-latex.mjs --extract | --apply');
