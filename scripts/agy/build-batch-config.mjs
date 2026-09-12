import {currentBookletSourcePath} from '../booklet/source-paths.mjs';
// Generate a Wave-3 batch config skeleton from the taxonomy + booklets/QUEUE.md, instead of
// transcribing skill ids and booklet paths by hand.
//
//   node scripts/agy/build-batch-config.mjs --batch W3-2 \
//     --topics t-s6st11-measurement,t-s6st11-time,t-s6st11-networks \
//     --out .agywork/W3-2/batch.json
//
// WHY. W3-1's config was hand-written from QUEUE rows — the kind of transcription that
// silently drops a skill or mistypes a booklet path, with no gate to catch either. This
// derives both from the source of truth: net-new skills are read from data/skills.json
// (tagged to the topic's dot points, with no public/content file yet, so the ALREADY-COMPLETE
// rule is applied automatically), and booklet paths are parsed out of the QUEUE row whose
// "Target topic" column names the topic.
//
// Sections are seeded one per booklet, with skills assigned to the booklet whose stem best
// matches, then small sections are merged up to the packing floor (a section under ~3 skills
// wastes most of an agy call's ~200k-token fixed overhead).
//
// The emitted config is a SKELETON, not a finished config: `hazards` is empty and
// `tikzSections` is a guess from the skill blurbs. Read it, write the hazards for the batch
// (Y11-vs-Y12 dot-point conflicts, anchor:none skills, booklet quirks), then run
// build-gen-tasks.mjs against it.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIN_SKILLS_PER_SECTION = 3;

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const batch = arg('--batch', '');
const topicIds = arg('--topics', '').split(',').map(s => s.trim()).filter(Boolean);
const outFile = arg('--out', '');
if (!batch || !topicIds.length || !outFile) {
  console.error('usage: node scripts/agy/build-batch-config.mjs --batch W3-n --topics t-a,t-b --out <batch.json>');
  process.exit(2);
}

const read = f => fs.readFileSync(f, 'utf8').replace(/^﻿/, '');
const skills = JSON.parse(read(path.join(rootDir, 'data', 'skills.json')));
const skillList = Array.isArray(skills) ? skills : skills.skills;
const dotpoints = JSON.parse(read(path.join(rootDir, 'data', 'topics.json'))) && JSON.parse(read(path.join(rootDir, 'data', 'dotpoints.json')));

const dpByTopic = new Map();
for (const d of dotpoints) {
  if (!dpByTopic.has(d.topicId)) dpByTopic.set(d.topicId, []);
  dpByTopic.get(d.topicId).push(d);
}
for (const list of dpByTopic.values()) list.sort((a, b) => a.order - b.order);

// Booklet paths for a topic: the QUEUE row whose target column names the topic id.
function bookletsForTopic(topicId) {
  const queue = read(path.join(rootDir, 'booklets', 'QUEUE.md'));
  const row = queue.split('\n').find(line => line.startsWith('|') && new RegExp(`\\b${topicId}\\b`).test(line));
  if (!row) return [];
  const cells = row.split('|');
  const bookletCell = cells[3] || '';
  return [...bookletCell.matchAll(/`([^`]+\.md)`/g)]
    .map(m => currentBookletSourcePath(`booklets/${m[1]}`))
    .filter(p => {
      if (fs.existsSync(path.join(rootDir, p))) return true;
      console.error(`  ! booklet listed in QUEUE.md does not exist: ${p}`);
      return false;
    });
}

// Guess the tikz playbook sections a set of skills needs, from their blurbs/titles.
const SECTION_HINTS = {
  curve: /graph|sketch|curve|parabola|gradient|intercept|asymptot|exponential|logarithm|function/i,
  'data-displays': /histogram|box plot|stem|dot plot|frequency|ogive|cumulative|column graph|distribution/i,
  tables: /table|spreadsheet|bill|budget|repayment|rate table|two-way/i,
  angles: /angle|parallel|transversal|bearing|elevation|depression/i,
  // Latitude/longitude work is drawn as a globe with great circles and arcs, so it needs the
  // circle playbook even though no skill title says "circle".
  circle: /circle|chord|tangent|sector|arc|radius|radian|latitude|longitude|great circle|earth/i,
  'solids-3d': /prism|cylinder|cone|sphere|pyramid|volume|surface area|cross-section/i,
  polygons: /polygon|quadrilateral|triangle|rectangle|trapezium|parallelogram/i,
  bearings: /bearing|compass|due north|survey/i,
  carryover: /network|tree diagram|number line|inequalit|venn|time zone|utc|daylight saving/i,
  // Irregular-area work (offset surveys, the trapezoidal rule) is drawn with the survey
  // conventions that live in the bearings playbook.
  bearings2: /irregular|offset survey|trapezoidal|field ?book/i,
};
// Some hints are aliases onto a real playbook section — a survey sketch is drawn with the
// bearings conventions — so map them back before emitting, and de-duplicate.
const HINT_ALIASES = { bearings2: 'bearings' };
function guessTikzSections(cards) {
  const blob = cards.map(c => `${c.title} ${c.blurb}`).join('\n');
  const hit = Object.entries(SECTION_HINTS)
    .filter(([, re]) => re.test(blob))
    .map(([k]) => HINT_ALIASES[k] || k);
  return [...new Set(hit)];
}

// Net-new skills for these topics, in curriculum order, skipping any that already have content.
const seen = new Set();
const netNew = [];
const already = [];
for (const topicId of topicIds) {
  for (const dp of dpByTopic.get(topicId) || []) {
    for (const s of skillList) {
      if (!(s.dotPointIds || []).includes(dp.id) || seen.has(s.id)) continue;
      seen.add(s.id);
      if (fs.existsSync(path.join(rootDir, 'public', 'content', `${s.id}.json`))) { already.push(s.id); continue; }
      netNew.push({ ...s, seedDotPoint: dp.id, seedTopic: topicId });
    }
  }
}

if (!netNew.length) {
  console.error('✗ no net-new skills for those topics — every tagged skill already has content');
  process.exit(1);
}

// Seed one section per booklet, assigning each skill to the booklet whose filename stem shares
// the most words with the skill's dot point text; fall back to the topic's first booklet.
const words = s => new Set(String(s).toLowerCase().match(/[a-z]{4,}/g) || []);
const dpById = new Map(dotpoints.map(d => [d.id, d]));
const sections = new Map();
for (const skill of netNew) {
  const booklets = bookletsForTopic(skill.seedTopic);
  const dpText = dpById.get(skill.seedDotPoint)?.text || '';
  const target = words(`${dpText} ${skill.title}`);
  let best = booklets[0] || null;
  let bestScore = -1;
  for (const b of booklets) {
    const stem = path.basename(b, '.md');
    const score = [...words(stem)].filter(w => target.has(w)).length;
    if (score > bestScore) { bestScore = score; best = b; }
  }
  const key = best || `${skill.seedTopic}-anchor-none`;
  if (!sections.has(key)) sections.set(key, { booklet: best, topicId: skill.seedTopic, skills: [] });
  sections.get(key).skills.push(skill);
}

// Merge sections under the packing floor into the largest section of the same topic.
const ordered = [...sections.values()];
for (const section of ordered) {
  if (section.skills.length >= MIN_SKILLS_PER_SECTION || section.merged) continue;
  const host = ordered
    .filter(o => o !== section && !o.merged && o.topicId === section.topicId)
    .sort((a, b) => b.skills.length - a.skills.length)[0];
  if (!host) continue;
  host.skills.push(...section.skills);
  host.extraBooklets = [...(host.extraBooklets || []), section.booklet].filter(Boolean);
  section.merged = true;
}

const out = {
  batch,
  model: 'gemini-3.7-flash-high',
  sections: ordered.filter(s => !s.merged).map(section => ({
    name: section.booklet ? path.basename(section.booklet, '.md').toLowerCase().replace(/[^a-z0-9]+/g, '-') : `${section.topicId}-anchor-none`,
    skillIds: section.skills.map(s => s.id),
    bookletPaths: [section.booklet, ...(section.extraBooklets || [])].filter(Boolean),
    model: 'gemini-3.7-flash-high',
    tikzSections: guessTikzSections(section.skills),
    hazards: [],
  })),
};

fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n');

console.log(`${batch}: ${netNew.length} net-new skill(s) across ${out.sections.length} section(s) → ${outFile}`);
if (already.length) console.log(`  skipped ${already.length} already-complete skill(s): ${already.join(', ')}`);
for (const s of out.sections) {
  console.log(`  ${s.name}: ${s.skillIds.length} skill(s), tikz [${s.tikzSections.join(', ') || 'none'}]`);
  if (!s.bookletPaths.length) console.log('    ! no booklet — these skills are anchor: none, say so in hazards');
  if (s.skillIds.length < MIN_SKILLS_PER_SECTION) console.log(`    ! under the ${MIN_SKILLS_PER_SECTION}-skill packing floor and could not be merged`);
}
console.log('\nSKELETON ONLY: write the hazards for each section (Y12 dot-point conflicts, anchor:none,');
console.log('booklet quirks) and check tikzSections before running build-gen-tasks.mjs.');
