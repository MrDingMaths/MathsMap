import {currentBookletSourcePath, MATHSMAP_SOURCE_ROOT} from '../booklet/source-paths.mjs';
// Theory pass, Stage 4/5: build the batch config the theory lane needs for skills that ALREADY
// have content.
//
//   node scripts/agy/build-theory-config.mjs --batch T4-1 \
//     --topics t-s4-frc,t-s4-int --out scripts/agy/batches/T4-1.json
//
// WHY A SECOND BUILDER. build-batch-config.mjs exists for the GENERATION lane, so it selects
// net-new skills — every skill that already has a public/content file is skipped, which is
// exactly the set the theory pass rewrites. It also reads booklet paths out of booklets/QUEUE.md,
// and the 20 already-audited Stage 4 topics (fractions, algebra, indices, equations, linear,
// angles, area, integers, Pythagoras) predate the queue and have no row there at all. This
// builder inverts the selection and finds the booklet by matching filenames under the stage's
// booklet directories, with the QUEUE row used first when one exists.
//
// Sections are one per booklet, small ones merged up, which is the shape build-theory-tasks.mjs
// turns into one task file per section. The emitted config is a SKELETON: read the printed
// booklet mapping before running the lane — a mis-assigned booklet feeds the wrong figures to
// the model.

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
const topicIds = arg('--topics', '').split(',').map((s) => s.trim()).filter(Boolean);
const outFile = arg('--out', '');
if (!batch || !topicIds.length || !outFile) {
  console.error('usage: node scripts/agy/build-theory-config.mjs --batch T4-1 --topics t-a,t-b --out <config.json>');
  process.exit(2);
}

const read = (f) => fs.readFileSync(f, 'utf8').replace(/^﻿/, '');
const readJson = (f) => JSON.parse(read(f));
const skillsRaw = readJson(path.join(rootDir, 'data', 'skills.json'));
const skillList = Array.isArray(skillsRaw) ? skillsRaw : skillsRaw.skills;
const dotpoints = readJson(path.join(rootDir, 'data', 'dotpoints.json'));
const topics = readJson(path.join(rootDir, 'data', 'topics.json'));
const topicById = new Map(topics.map((t) => [t.id, t]));
const dpById = new Map(dotpoints.map((d) => [d.id, d]));

const dpByTopic = new Map();
for (const d of dotpoints) {
  if (!dpByTopic.has(d.topicId)) dpByTopic.set(d.topicId, []);
  dpByTopic.get(d.topicId).push(d);
}
for (const list of dpByTopic.values()) list.sort((a, b) => a.order - b.order);

// Booklet directories a topic may draw from, narrowed by its id: a Core topic is taught by the
// Core booklets plus the shared Stage 5 folder, never by the Path folder.
function bookletDirs(topicId) {
  // No Stage 3 booklets exist (booklets/ starts at Stage 4), so a t-s3- topic must anchor on
  // nothing rather than fall through to the Stage 4/5 scan, which would hand a Stage 3 fraction
  // skill a Stage 5 booklet's figures.
  if (/^t-s3-/.test(topicId)) return [];
  if (/^t-s4-/.test(topicId)) return ['Stage 4'];
  if (/^t-s5c-/.test(topicId)) return ['Stage 5 Core', 'Stage 5'];
  if (/^t-s5p-/.test(topicId)) return ['Stage 5 Path', 'Stage 5'];
  return ['Stage 4', 'Stage 5', 'Stage 5 Core', 'Stage 5 Path'];
}

function bookletsIn(dirs) {
  const out = [];
  for (const dir of dirs) {
    const abs = path.join(rootDir, MATHSMAP_SOURCE_ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      if (f.endsWith('.md')) out.push(`${MATHSMAP_SOURCE_ROOT}/${dir}/${f}`);
    }
  }
  return out;
}

// The QUEUE row for a topic, when it has one — an owner-curated list beats any filename match.
const queueLines = read(path.join(rootDir, 'booklets', 'QUEUE.md')).split('\n').filter((l) => l.startsWith('|'));
function queueBooklets(topicId) {
  const row = queueLines.find((l) => new RegExp(`(^|[^\\w-])${topicId}([^\\w-]|$)`).test(l));
  if (!row) return null;
  const cells = row.split('|');
  const paths = [...(cells[3] || '').matchAll(/`([^`]+\.md)`/g)].map((m) => currentBookletSourcePath(`booklets/${m[1]}`))
    .filter((p) => {
      if (fs.existsSync(path.join(rootDir, p))) return true;
      console.error(`  ! QUEUE.md lists a booklet that does not exist: ${p}`);
      return false;
    });
  return paths.length ? paths : null;
}

const STOP = new Set(['solve', 'problems', 'involving', 'apply', 'using', 'their', 'with', 'from',
  'that', 'this', 'each', 'various', 'appropriate', 'simple', 'find', 'describe', 'determine',
  'develop', 'formula', 'stage', 'path', 'core']);
const words = (s) => new Set((String(s).toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => !STOP.has(w)));

// A booklet stem names its FAMILY before the first number or underscore: "Linear Relationships
// C 2_General and Point Gradient Form" belongs to "linear relationships c". Word overlap alone
// mis-assigns across families (it put Pythagoras' theorem under Area 1, which shares "triangles"),
// so the family is matched first and the overlap only ever picks WITHIN a topic's own family.
// Filler differs between a title and a filename for the same family ("Fractions, decimals and
// percentages" vs "Fractions Decimals Percentages 1_…"), so it is dropped from both sides.
const FILLER = /\b(and|of|the|for|with|to|in)\b/g;
const norm = (s) => String(s).toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 ]+/g, ' ')
  .replace(FILLER, ' ').replace(/\s+/g, ' ').trim();
const family = (bookletPath) => norm(path.basename(bookletPath, '.md').split('_')[0]).replace(/ \d+$/, '');
// The topic title carries the same family, plus its A/B/C band: "Linear relationships C".
const topicFamily = (topicId) => norm(topicById.get(topicId)?.title || '');

function familyPool(topicId, candidates) {
  const want = topicFamily(topicId);
  const hit = candidates.filter((c) => {
    const f = family(c);
    return f === want || f.startsWith(`${want} `) || want.startsWith(`${f} `);
  });
  return hit;
}

// Best booklet for one skill: the stem sharing the most content words with the skill's title,
// blurb and dot-point text. Ties keep the earlier (lower-numbered) booklet.
function bestBooklet(skill, candidates) {
  const dpText = (skill.dotPointIds || []).map((id) => dpById.get(id)?.text || '').join(' ');
  const target = words(`${skill.title} ${skill.blurb || ''} ${dpText}`);
  let best = null;
  let bestScore = -1;
  for (const b of candidates) {
    const stem = path.basename(b, '.md');
    const score = [...words(stem)].filter((w) => target.has(w)).length;
    if (score > bestScore) { bestScore = score; best = b; }
  }
  return { booklet: best, score: Math.max(bestScore, 0) };
}

// TikZ playbook hints — same table as build-batch-config.mjs, kept here because that file
// parses argv at import time and cannot be imported.
const SECTION_HINTS = {
  curve: /graph|sketch|curve|parabola|gradient|intercept|asymptot|exponential|logarithm|function|parabolic/i,
  'data-displays': /histogram|box plot|stem|dot plot|frequency|ogive|cumulative|column graph|distribution|standard deviation|quartile/i,
  tables: /table|spreadsheet|bill|budget|repayment|rate table|two-way|payslip|wage/i,
  angles: /angle|parallel|transversal|bearing|elevation|depression|co-?interior|alternate/i,
  circle: /circle|chord|tangent|sector|arc|radius|radian|semicircle/i,
  'solids-3d': /prism|cylinder|cone|sphere|pyramid|volume|surface area|cross-section|net of|solid/i,
  polygons: /polygon|quadrilateral|triangle|rectangle|trapezium|parallelogram|similar|congruen|kite|rhombus/i,
  bearings: /bearing|compass|due north|survey|offset|field ?book/i,
  carryover: /network|tree diagram|number line|inequalit|venn|scale drawing|translation|reflection|rotation/i,
};
function guessTikzSections(skills) {
  const blob = skills.map((s) => `${s.title} ${s.blurb || ''}`).join('\n');
  return [...new Set(Object.entries(SECTION_HINTS).filter(([, re]) => re.test(blob)).map(([k]) => k))];
}

// Skills with content, in curriculum order (topic order, then dot-point order).
const seen = new Set();
const chosen = [];
const noContent = [];
for (const topicId of topicIds) {
  if (!topicById.has(topicId)) { console.error(`✗ unknown topic ${topicId}`); process.exit(1); }
  for (const dp of dpByTopic.get(topicId) || []) {
    for (const s of skillList) {
      if (!(s.dotPointIds || []).includes(dp.id) || seen.has(s.id)) continue;
      seen.add(s.id);
      if (!fs.existsSync(path.join(rootDir, 'public', 'content', `${s.id}.json`))) { noContent.push(s.id); continue; }
      chosen.push({ ...s, seedTopic: topicId });
    }
  }
}
if (!chosen.length) {
  console.error('✗ no skills with authored content for those topics — nothing for the theory pass');
  process.exit(1);
}

const sections = new Map();
const mapping = [];
for (const skill of chosen) {
  const all = bookletsIn(bookletDirs(skill.seedTopic));
  const queued = queueBooklets(skill.seedTopic);
  const pool = familyPool(skill.seedTopic, all);
  // A QUEUE row is owner-curated, so it wins; otherwise the topic's own booklet family; only
  // when neither exists does the match range over every booklet of the stage.
  const source = queued ? 'queue' : pool.length ? 'family' : 'scan';
  const candidates = queued || (pool.length ? pool : all);
  const { booklet, score } = bestBooklet(skill, candidates);
  // A topic with no booklet family of its own (Data analysis C) matches something across the
  // whole stage on one incidental word — Logarithms for a sampling skill. A wrong anchor is
  // worse than none: it feeds the model the wrong booklet's figures, so weak scans go
  // anchor: none and the task says so.
  const chosenBooklet = source === 'scan' && score <= 1 ? null : (booklet || candidates[0] || null);
  mapping.push({ skillId: skill.id, topic: skill.seedTopic, booklet: chosenBooklet, score, source });
  const key = chosenBooklet || `${skill.seedTopic}-anchor-none`;
  if (!sections.has(key)) sections.set(key, { booklet: chosenBooklet, topicId: skill.seedTopic, skills: [] });
  sections.get(key).skills.push(skill);
}

const ordered = [...sections.values()];
for (const section of ordered) {
  if (section.skills.length >= MIN_SKILLS_PER_SECTION || section.merged) continue;
  const host = ordered
    .filter((o) => o !== section && !o.merged && o.topicId === section.topicId)
    .sort((a, b) => b.skills.length - a.skills.length)[0];
  if (!host) continue;
  host.skills.push(...section.skills);
  host.extraBooklets = [...(host.extraBooklets || []), section.booklet].filter(Boolean);
  section.merged = true;
}

// One section becomes one task file and one agent, so a section is capped: a 23-skill task
// asks one agent to hold 23 theory blocks, their stems and the booklet at once, which is where
// rewrites start drifting. Oversized sections split in curriculum order.
const MAX_SKILLS_PER_SECTION = 8;
const emitted = [];
for (const section of ordered.filter((s) => !s.merged)) {
  const base = section.booklet
    ? path.basename(section.booklet, '.md').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
    : `${section.topicId}-anchor-none`;
  const chunks = [];
  for (let i = 0; i < section.skills.length; i += MAX_SKILLS_PER_SECTION) {
    chunks.push(section.skills.slice(i, i + MAX_SKILLS_PER_SECTION));
  }
  chunks.forEach((skills, i) => {
    emitted.push({
      name: chunks.length > 1 ? `${base}-${String.fromCharCode(97 + i)}` : base,
      skillIds: skills.map((s) => s.id),
      bookletPaths: [section.booklet, ...(section.extraBooklets || [])].filter(Boolean),
      tikzSections: guessTikzSections(skills),
      hazards: [],
    });
  });
}

const out = { batch, lane: 'theory', model: 'opus-subagent', sections: emitted };

fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(path.resolve(outFile), JSON.stringify(out, null, 2) + '\n');

console.log(`${batch}: ${chosen.length} skill(s) with content across ${out.sections.length} section(s) → ${outFile}`);
if (noContent.length) console.log(`  skipped ${noContent.length} skill(s) with no content: ${noContent.join(', ')}`);
for (const s of out.sections) {
  console.log(`  ${s.name}: ${s.skillIds.length} skill(s), tikz [${s.tikzSections.join(', ') || 'none'}]`);
  if (!s.bookletPaths.length) console.log('    ! no booklet — anchor: none, say so in hazards');
}
const weak = mapping.filter((m) => m.score <= 1);
if (weak.length) {
  console.log(`\n${weak.length} skill(s) matched their booklet on ${'≤'}1 shared word — check these by eye:`);
  for (const m of weak) console.log(`  ${m.skillId.padEnd(42)} → ${m.booklet || 'NONE'} (${m.source}, score ${m.score})`);
}
