// Wave 3 diagram lane, step 3: build agy vision-audit task packets from a render run.
//
//   node scripts/diagram-audit/build-audit-packets.mjs --captures <render-out> \
//     --lint <lint.json> --out <tasks-dir> [--packet-size 9] [--tier 2 --verdicts verdicts.json]
//
// One ITEM per card/quiz item (a question figure and its solution figure judged together);
// packets of ~8–10 items; one task-NNN.md per packet, driven by scripts/agy/run-gen.mjs.
// Tier 1 (default): PNGs only, triage rubric (ported from MathsDatabase
// vision-sample-audit.mjs, MathsMap-specific checks added). Tier 2 (--tier 2): only items
// whose Tier-1 verdict was "flag" (from --verdicts), TikZ source included, re-derive rubric.
// Both tiers run gemini-3.7-flash-high (owner decision 2026-08-26: flash only, no pro) —
// Tier 2's extra rigour comes from the source-inclusive packet and the re-derive rubric.
// PNGs are COPIED into the tasks dir so agy (cwd-scoped) can Read them.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ROOT, substituteTikz } from './lib/audit-lib.mjs';

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const capturesDir = path.resolve(arg('--captures', ''));
const lintFile = arg('--lint', '');
const outDir = arg('--out', '');
const packetSize = Number(arg('--packet-size', '9'));
const tier = arg('--tier', '1');
const verdictsFile = arg('--verdicts', '');
if (!arg('--captures', '') || !outDir) {
  console.error('usage: node scripts/diagram-audit/build-audit-packets.mjs --captures <dir> --out <dir> [--lint lint.json] [--packet-size N] [--tier 2 --verdicts verdicts.json]');
  process.exit(2);
}
if (tier === '2' && !verdictsFile) {
  console.error('✗ --tier 2 requires --verdicts (the merged Tier-1 verdicts.json)');
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(path.join(capturesDir, 'manifest.json'), 'utf8'));
const lint = lintFile ? JSON.parse(fs.readFileSync(lintFile, 'utf8')) : { findings: [] };
const tier1Flags = verdictsFile
  ? new Set(JSON.parse(fs.readFileSync(verdictsFile, 'utf8')).verdicts.filter(v => v.verdict === 'flag').map(v => v.id))
  : null;
const tier1ById = verdictsFile
  ? new Map(JSON.parse(fs.readFileSync(verdictsFile, 'utf8')).verdicts.map(v => [v.id, v]))
  : new Map();

// Item address = everything before the final ".field" — a question figure and its solution
// figure share the address and are judged together for mutual consistency.
function itemAddress(m) {
  const field = String(m.field || '');
  const cut = field.lastIndexOf('.');
  return `${m.skillId}::${cut > 0 ? field.slice(0, cut) : field}`;
}

const items = new Map();
for (const m of manifest) {
  if (m.status === 'fail' || m.status === 'pending') continue; // compile failures route to redraw directly
  const addr = itemAddress(m);
  if (!items.has(addr)) items.set(addr, { id: addr, skillId: m.skillId, q: m.q, a: m.a, diagrams: [] });
  const it = items.get(addr);
  const lintHits = lint.findings.filter(f => f.skillId === m.skillId && `${f.skillId}::${f.where.slice(0, f.where.lastIndexOf('.'))}` === addr);
  it.diagrams.push({ png: m.png, field: m.field, status: m.status, lintFindings: lintHits.flatMap(h => h.findings) });
}

let selected = [...items.values()];
if (tier === '2') selected = selected.filter(it => tier1Flags.has(it.id));
if (!selected.length) {
  console.log('no items to audit — nothing to build');
  process.exit(0);
}

// Attach substituted text (each [tikz] → numbered placeholder) and, for Tier 2, the source.
for (const it of selected) {
  const q = substituteTikz(it.q);
  const a = substituteTikz(it.a);
  it.questionText = q.substituted;
  it.solutionText = a.substituted;
  if (tier === '2') it.tikzSource = [...q.blocks, ...a.blocks];
  if (tier === '2') it.tier1 = tier1ById.get(it.id) || null;
  delete it.q; delete it.a;
}

const RULES_NOTE = `MathsMap card rules to check per item:
- A QUESTION figure must not pre-mark the answer (no answer angle/length pre-labelled, no
  support scaffold pre-marked).
- A SOLUTION figure must ADD construction (auxiliary lines, marked results), not merely
  duplicate the question figure.
- MathsMap-specific defect checks: label collision/overlap, legibility at rendered size,
  clipped or overflowing elements, the WRONG region shaded/marked, figure values vs stated
  text values, question-figure vs solution-figure consistency.`;

const TIER1_RUBRIC = `You are Tier-1 triage in a semantic-correctness audit of TikZ diagrams in a maths
teaching app (MathsMap). This task file lists items; each item has rendered diagram PNGs in the
current directory, and questionText/solutionText where each [tikz] block was replaced by a numbered
"[diagram N: see attached PNG]" placeholder (placeholder order matches the diagrams list).

For EACH item: Read every listed PNG. Judge the figures against the prose and against each other.
Note existingLintFindings (do not re-flag those). Decide: does EVERY rendered figure agree with what
the text claims, and are the question figure and solution figure of one item mutually consistent?

Hunt the SEMANTIC family — compiles fine, looks tidy, factually wrong vs the text. Categories:
curve-vs-point; tangency-constraint; bearing-angle; shape-family; value-label; not-to-scale-anchor;
layout (collision/clipped/illegible); other. Most items should be "agrees". Purely illustrative
items with no verifiable claim are "not_applicable". Only "flag" when you can state a SPECIFIC
checkable claim that looks violated, citing exactly what you see. loadBearing=true only if the
numeric answer depends on the flawed geometry. No heavy re-derivation here.

${RULES_NOTE}

CONSERVATIVE FALSE-POSITIVE RULE: surface only a clear contradiction or a materially misleading
figure. Do not flag omitted side conditions, and do not flag not-to-scale sketches unless labels,
proportions or orientation genuinely mislead. Borderline → "agrees" with the doubt in reasoning.`;

const TIER2_RUBRIC = `You are Tier-2 in this diagram audit. Tier-1 flagged each item below. Independently
RE-DERIVE the correct figure from the question/solution text — the TikZ source is included this
time, so use exact coordinates. Do the maths yourself; the stated solution is authoritative for
what the diagram must show unless you find it self-contradictory.

Verdicts: "confirmed" (figure is wrong; redraw), "false_positive" (figure is fine),
"content_defect" (the QUESTION/ANSWER text itself is wrong, not the figure — route to content
repair with a human ruling, do not redraw). Verify your own conclusion by recomputing the
constraint from first principles.

${RULES_NOTE}

CONSERVATIVE CONFIRMATION RULE: confirm only a clear contradiction or genuinely misleading
ambiguity; borderline or tolerance-level concerns are false_positive.`;

fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (let i = 0; i < selected.length; i += packetSize) {
  n++;
  const num = String(n).padStart(3, '0');
  const packet = selected.slice(i, i + packetSize);
  for (const it of packet) {
    for (const d of it.diagrams) {
      fs.copyFileSync(path.join(capturesDir, d.png), path.join(outDir, d.png));
    }
  }
  const resultShape = tier === '2'
    ? '{"id": "<item id verbatim>", "verdict": "confirmed"|"false_positive"|"content_defect", "rederivation": "the maths, with final numbers", "selfCheck": "how you verified", "confidence": "high"|"medium"|"low"}'
    : '{"id": "<item id verbatim>", "verdict": "agrees"|"flag"|"not_applicable", "defectType": "curve-vs-point"|"tangency-constraint"|"bearing-angle"|"shape-family"|"value-label"|"not-to-scale-anchor"|"layout"|"other"|null, "loadBearing": true|false|null, "claim": "…or null", "reasoning": "1-3 sentences"}';
  const task = [
    `# Diagram audit task ${num} — Tier ${tier}`,
    '',
    tier === '2' ? TIER2_RUBRIC : TIER1_RUBRIC,
    '',
    '## Items',
    '',
    '```json',
    JSON.stringify(packet, null, 2),
    '```',
    '',
    '## Output Contract',
    '',
    `Write \`task-${num}.result.json\` in the current directory: a JSON array, one element per`,
    'item above, in the same order, each shaped:',
    '```',
    resultShape,
    '```',
    'Write the file directly; do not ask for confirmation. Final reply: a short count summary.',
  ].join('\n');
  fs.writeFileSync(path.join(outDir, `task-${num}.md`), task);
  fs.writeFileSync(path.join(outDir, `task-${num}.ids.json`), JSON.stringify({ ids: packet.map(p => p.id) }) + '\n');
}
console.log(`${n} packet task(s) (${selected.length} item(s), tier ${tier}) in ${outDir}`);
console.log(`run: node scripts/agy/run-gen.mjs --tasks-dir ${outDir} --model gemini-3.7-flash-high`);
