#!/usr/bin/env node
// Audits the per-skill FIGURE QUOTA: a skill whose own title or blurb promises a
// picture (graph, sketch, plot, curve, number line, diagram, reflection) must carry
// at least one inline [tikz] figure in its authored content.
//
// Why this exists: "figures must be drawn" was being satisfied vacuously. The
// generator is free to choose the item mix, so on a graphing topic it can pick an
// all-algebraic set — no stem then *needs* a picture, every rule is obeyed, and the
// skill ships with zero figures. W3-8 drew 58 blocks across three "read this graph"
// skills and nothing at all for its four algebraic ones under an identical config;
// W3-9 shipped 11 curve-bearing skills with no figures; W3-10 shipped a reflection
// skill and a domain-restriction skill with none. Three batches is a pattern, and a
// hazard cannot catch it because the omission is invisible in the prose.
//
// This is the figure analogue of validate.mjs's practice<->quiz parity check: a
// structural promise checked structurally, not a judgement about any one item.
//
// Scope: content only. Quiz figures are a bonus, never the requirement — a skill
// that teaches with pictures and assesses algebraically is a legitimate design.
//
// Exemptions live in scripts/lib/figure-quota-exempt.json, `{ id: reason }`. Use one
// when a skill's title reads visual but the skill genuinely is not (e.g. naming the
// equation of a graph without ever drawing it). A reason is required.
//
// Usage:
//   node scripts/audit-figure-quota.mjs                  # all skills
//   node scripts/audit-figure-quota.mjs --only id1,id2   # ids or prefix
//   node scripts/audit-figure-quota.mjs --strict         # exit 1 on defects
//   node scripts/audit-figure-quota.mjs --dir <root>     # test override
//
// See docs/content-generation.md (deterministic gate).
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { rejectStrayPositionals } from './lib/argv.mjs';
import { extractTikz } from './lib/tikz-blocks.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseValueArg(argv, flag) {
  const idx = argv.indexOf(flag);
  if (idx === -1 || idx === argv.length - 1) return null;
  return argv[idx + 1];
}

const argv = process.argv.slice(2);
rejectStrayPositionals(argv, { valueFlags: ['--only', '--dir'], boolFlags: ['--strict'] });
const strict = argv.includes('--strict');
const dirArg = parseValueArg(argv, '--dir');
const onlyRaw = parseValueArg(argv, '--only');
const onlyIds = onlyRaw ? onlyRaw.split(',').map((s) => s.trim()).filter(Boolean) : null;
const baseDir = dirArg ? join(rootDir, dirArg) : join(rootDir, 'public');
const inScope = (id) => !onlyIds || onlyIds.some((w) => id === w || id.startsWith(w));

// A skill promises a picture when its title/blurb names the drawing itself. Verbs
// only — "graph" as a noun in "read the equation of the graph" is caught too, which
// is intended: reading one still requires one to be shown.
const VISUAL = /\b(graph|graphs|graphed|graphing|sketch|sketches|sketching|plot|plots|plotted|plotting|curve|curves|number line|reflect|reflects|reflecting|reflection|diagram|asymptote|asymptotes)\b/i;

const exemptPath = join(rootDir, 'scripts', 'lib', 'figure-quota-exempt.json');
const exempt = existsSync(exemptPath) ? JSON.parse(readFileSync(exemptPath, 'utf8')) : {};

const skillsRaw = JSON.parse(readFileSync(join(rootDir, 'data', 'skills.json'), 'utf8'));
const skills = Array.isArray(skillsRaw) ? skillsRaw : (skillsRaw.skills || Object.values(skillsRaw));

function figureCount(skillId) {
  const file = join(baseDir, 'content', `${skillId}.json`);
  if (!existsSync(file)) return null;
  let doc;
  try {
    doc = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
  let n = 0;
  const practice = doc.practice || {};
  for (const tier of ['foundation', 'development', 'mastery']) {
    for (const card of practice[tier] || []) {
      n += extractTikz(card.question_text).length + extractTikz(card.solution_text).length;
    }
  }
  for (const key of ['theory', 'iDo', 'weDo']) {
    n += extractTikz(JSON.stringify(doc[key] ?? '')).length;
  }
  for (const atom of doc.atomSequence || []) n += extractTikz(JSON.stringify(atom)).length;
  return n;
}

const defects = [];
let checked = 0;
for (const skill of skills) {
  const id = skill?.id;
  if (!id || !inScope(id)) continue;
  const text = `${skill.title || ''} ${skill.blurb || ''}`;
  if (!VISUAL.test(text)) continue;
  if (exempt[id]) continue;
  const n = figureCount(id);
  if (n === null) continue; // no authored content yet — not this audit's business
  checked++;
  if (n === 0) {
    defects.push({ id, title: skill.title, matched: (VISUAL.exec(text) || [])[0] });
  }
}

for (const d of defects) {
  console.log(`✗ FIGURE-QUOTA | ${d.id} | 0 [tikz] block(s) in authored content`);
  console.log(`    title: ${d.title}`);
  console.log(`    promises a figure via "${d.matched}" — draw one, or add an exemption with a reason to scripts/lib/figure-quota-exempt.json`);
}

console.log(
  defects.length
    ? `✗ ${defects.length} figure-quota defect(s) across ${checked} visual skill(s).`
    : `✓ figure quota: ${checked} visual skill(s), all carry at least one figure.`,
);

if (strict && defects.length) process.exit(1);
