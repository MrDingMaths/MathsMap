import {currentBookletSourcePath} from '../booklet/source-paths.mjs';
// Wave 3: build fully self-contained agy generation task files for one batch.
//
//   node scripts/agy/build-gen-tasks.mjs --config .agywork/W3-1/batch.json --out .agywork/W3-1/gen
//
// Batch→section mapping is CONFIG-DRIVEN: the orchestrator authors batch.json per batch
// (the Wave-3 queue in docs/content-queue.md carries the same facts in prose; this file is
// the machine-readable form). Shape:
//
//   {
//     "batch": "W3-1",
//     "sections": [ {
//       "name": "managing-money-1",
//       "skillIds": ["…", "…"],                       // 2–4 skills per section/task
//       "bookletPaths": ["booklets/mathsmap-sources/Stage 6 Standard/….md"],  // repo-relative; [] = anchor:none
//       "model": "gemini-3.7-flash-high",              // optional note, recorded in ids.json
//       "tikzSections": ["curve"],                    // playbook sections; [] = figure-free
//       "hazards": ["free text stated verbatim in the task"]
//     } ]
//   }
//
// Each task-NNN.md inlines: content-schema.md; the three principle docs; each skill's card
// (prereqs + dependents expanded from data/skills.json); prereq content voice samples;
// governing dot point text; the booklet markdown; absolute media PNG paths for agy to Read;
// only the matching prompts/tikz sections (via the sibling tikz-sections.mjs, override root
// with MATHSDATABASE_ROOT); the house-rules block; and the output contract
// (out/{id}.content.json + out/{id}.quiz.json + out/{id}.report.json). Emits
// task-NNN.ids.json for reconciliation by the runner.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { standingHazardsBlock } from './lib/hazards.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MATHSDATABASE_ROOT = process.env.MATHSDATABASE_ROOT
  || path.resolve(rootDir, '..', 'MathsDatabase');

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const configFile = arg('--config', '');
const outDir = arg('--out', '');
if (!configFile || !outDir) {
  console.error('usage: node scripts/agy/build-gen-tasks.mjs --config <batch.json> --out <tasks-dir>');
  process.exit(2);
}

const read = f => fs.readFileSync(f, 'utf8').replace(/^﻿/, '');
const config = JSON.parse(read(configFile));

const skills = JSON.parse(read(path.join(rootDir, 'data', 'skills.json')));
const skillList = Array.isArray(skills) ? skills : skills.skills;
const byId = new Map(skillList.map(s => [s.id, s]));
const dotpoints = JSON.parse(read(path.join(rootDir, 'data', 'dotpoints.json')));
const dpById = new Map(dotpoints.map(d => [d.id, d]));

// Skill card mirrors run-luna-check.mjs loadSkillCard (prereqs + dependents expanded).
function skillCard(skillId) {
  const skill = byId.get(skillId);
  if (!skill) throw new Error(`${skillId}: not found in data/skills.json`);
  const expand = ids => (ids || []).map(id => byId.get(id)).filter(Boolean)
    .map(s => ({ id: s.id, title: s.title, blurb: s.blurb }));
  const dependents = skillList.filter(s => (s.prereqs || []).includes(skillId)).map(s => s.id);
  return {
    id: skill.id, title: skill.title, blurb: skill.blurb, stage: skill.stage,
    difficulty: skill.difficulty, dotPointIds: skill.dotPointIds || [],
    prereqs: expand(skill.prereqs), dependents: expand(dependents),
  };
}

// One prereq content sample per skill for voice: theory + one worked solution.
function prereqVoiceSample(skillId) {
  const skill = byId.get(skillId);
  for (const pid of skill.prereqs || []) {
    const f = path.join(rootDir, 'public', 'content', `${pid}.json`);
    if (!fs.existsSync(f)) continue;
    try {
      const c = JSON.parse(read(f));
      const item = (c.practice?.development || c.practice?.foundation || [])[0];
      return { prereqId: pid, theory: c.theory, sampleItem: item || null };
    } catch { /* try the next prereq */ }
  }
  return null;
}

// tikz playbook sections via the sibling single-source splitter.
const { assembleTikzRules } = await import(
  new URL(`file:///${path.join(MATHSDATABASE_ROOT, 'tools', 'qgen', 'lib', 'tikz-sections.mjs').replace(/\\/g, '/')}`)
);
function tikzRules(sections) {
  if (!sections || !sections.length) return null;
  return assembleTikzRules(sections.filter(s => s !== 'core')); // core is always included
}

const HOUSE_RULES = `## House rules (non-negotiable)

- **Question count and variety**: cover every structural type the booklet section teaches;
  practice tiers foundation/development/mastery; no two items may share a value signature
  (same numbers, same answer) with each other or with the quiz.
- **Quiz independence**: quiz questions must be solvable without the teaching content and
  must not reuse practice values or contexts.
- **Distractors**: every wrong option encodes a specific, nameable misconception — record it
  in the report. No throwaway options.
- **Mastery omission**: mastery-tier practice items omit scaffolding; support scaffolds are
  never pre-marked in figures.
- **Scope**: teach ONLY this skill; prerequisite technique may be used but not re-taught.
  Advanced-course skills must not lean on Standard-only prerequisite content.
- **Scenario/display exclusivity**: each real-world scenario and each display type appears in
  at most one item per skill, dealt across the skill's items.
- **Theory voice — booklet English, and a hard word budget.** A student meeting this idea for
  the first time cannot hold a paragraph of technical vocabulary in working memory, and the
  booklet states its definition in a sentence. \`theory.intro\` is **≤ 45 words and ≤ 3
  sentences**; **each fact is ONE sentence of ≤ 25 words carrying ONE idea** (a \`$...$\` span
  counts as one word). Write the everyday word unless the technical word is the thing being
  taught — "how far apart", not "the magnitude of the displacement". Technical vocabulary that
  IS the content stays, **bolded on first use** and defined in the sentence it appears in.
  Say what a thing IS before what follows from it; cut hedges, restatement, and any sentence
  whose only job is to introduce the next one. The validator warns on every breach.
- **Theory figures**: \`theory.intro\`, \`theory.facts[]\` and \`theory.steps[]\` render inline
  \`[tikz]\` too. When the theory is SPATIAL — its central object is a shape, a display or a
  positional convention words can only gesture at (a box plot, a spanning tree, a transversal,
  opposite-vs-adjacent, an interval on a number line), or its steps work ON a diagram — end
  ONE of those strings with a single generic, labelled reference figure. A theory figure
  carries labels, not the numbers of a problem: if it carries a problem's values it is a
  practice card, not theory. Skip it for numeric/algebraic/procedural theory, and never draw
  one that pre-marks anything a practice or quiz item asks for.
- **Tables vs figures**: tabular data (rate tables, bills, budgets, frequency tables, two-way
  tables, spreadsheets) is a **KaTeX \`array\` inside \`$...$\`** per content-schema.md — NOT a
  \`[tikz]\` block, and never hand-drawn with raw \`\\draw\` lines. Use \`[tikz]\` only for genuine
  figures: diagrams, graphs, geometric shapes, networks, number lines. When a question requires
  the student to READ a value out of a reference table, the table must actually appear in the
  item — do not hand the looked-up value over in the stem, and do not pre-convert its units.
- **TikZ**: degree symbol \`^{\\circ}\`; Venn/region shading \`fill=gray!35\` never \`pattern=\`;
  question figures must not pre-mark the answer; solution figures add construction rather
  than duplicating the question figure; never put \`^\` inside a plotted expression — write
  \`exp(k*ln(b))\` (caret-exponent rule); restrict every \`plot\` \`domain\` to the axis window
  (plot-out-of-axis rule).
- **JSON hygiene**: no raw tab or control characters inside JSON strings; escape everything.`;

function bookletBlock(paths) {
  if (!paths.length) {
    return ['## Booklet', '', '**No booklet anchor exists for these skills** (`anchor: none`).',
      'Generate from the dot point text and skill card alone, conservatively — routine,',
      'syllabus-central questions only. These skills get extra human review.'].join('\n');
  }
  const parts = ['## Booklet section(s)', ''];
  for (const rel of paths) {
    const abs = path.join(rootDir, currentBookletSourcePath(rel));
    if (!fs.existsSync(abs)) throw new Error(`booklet not found: ${rel}`);
    const stem = path.basename(rel, '.md');
    const mediaDir = path.join(path.dirname(abs), 'media', stem, 'media');
    const pngs = fs.existsSync(mediaDir)
      ? fs.readdirSync(mediaDir).filter(f => /\.(png|jpe?g)$/i.test(f)).map(f => path.join(mediaDir, f))
      : [];
    parts.push(`### ${stem}`, '');
    if (pngs.length) {
      parts.push('Figures referenced by this booklet — Read these image files to see them:', '');
      for (const p of pngs) parts.push(`- ${p}`);
      parts.push('');
    }
    parts.push('```markdown', read(abs), '```', '');
  }
  return parts.join('\n');
}

// Every agy call carries ~200k input tokens of fixed overhead regardless of payload (W3-1
// measured: a 1-skill section still cost 276k input). A section below this size wastes most
// of a call, so small sections should be merged into a neighbouring one sharing a booklet.
// Pass --allow-small when a section genuinely cannot be merged (e.g. a lone `anchor: none`
// skill, or the remainder of a topic).
const MIN_SKILLS_PER_SECTION = 3;
const allowSmall = process.argv.includes('--allow-small');
const small = config.sections.filter(s => (s.skillIds || []).length < MIN_SKILLS_PER_SECTION);
if (small.length) {
  const lines = small.map(s => `  ${s.name}: ${s.skillIds.length} skill(s)`);
  if (allowSmall) {
    console.log(`note: ${small.length} section(s) below ${MIN_SKILLS_PER_SECTION} skills (--allow-small):\n${lines.join('\n')}`);
  } else {
    console.error(`✗ ${small.length} section(s) below the ${MIN_SKILLS_PER_SECTION}-skill packing floor:\n${lines.join('\n')}`);
    console.error('  Merge them into a section sharing the same booklet, or pass --allow-small if they genuinely cannot be merged.');
    process.exit(2);
  }
}

fs.mkdirSync(outDir, { recursive: true });
const schemaDoc = read(path.join(rootDir, 'docs', 'content-schema.md'));
const principleDocs = ['atomisation-teaching.md', 'guided-practice-principles.md', 'worked-example-principles.md']
  .map(f => `### docs/${f}\n\n${read(path.join(rootDir, 'docs', f))}`).join('\n\n');

let n = 0;
for (const section of config.sections) {
  n++;
  const num = String(n).padStart(3, '0');
  const cards = section.skillIds.map(id => skillCard(id));
  const dpTexts = [...new Set(cards.flatMap(c => c.dotPointIds))]
    .map(id => dpById.get(id)).filter(Boolean)
    .map(d => `- ${d.id} (${d.code}): ${d.text}`);
  const voices = section.skillIds.map(id => ({ id, sample: prereqVoiceSample(id) }))
    .filter(v => v.sample);
  const rules = tikzRules(section.tikzSections);

  const task = [
    `# Generation task ${num} — batch ${config.batch}, section ${section.name}`,
    '',
    'You are authoring teaching content and a quiz for each skill listed below, for a NSW',
    'Stage 6 maths skill map. Work skill by skill. The schema below is the contract.',
    '',
    '## Skills',
    '',
    ...cards.map(c => `### ${c.id}\n\`\`\`json\n${JSON.stringify(c, null, 2)}\n\`\`\``),
    '',
    '## Governing dot points',
    '',
    ...dpTexts,
    '',
    standingHazardsBlock('gen'),
    '',
    ...(section.hazards?.length ? ['## Batch-specific hazards', '', ...section.hazards.map(h => `- ${h}`), ''] : []),
    '## Content schema (docs/content-schema.md)',
    '',
    schemaDoc,
    '',
    '## Teaching principles',
    '',
    principleDocs,
    '',
    HOUSE_RULES,
    '',
    ...(voices.length ? [
      '## Voice samples (prerequisite content — match this register)',
      '',
      ...voices.map(v => `### prereq of ${v.id}: ${v.sample.prereqId}\n\`\`\`json\n${JSON.stringify(v.sample, null, 2).slice(0, 4000)}\n\`\`\``),
      '',
    ] : []),
    ...(rules ? ['## TikZ rules (only sections relevant to this task)', '', rules, ''] : [
      '## Figures', '', 'These skills are figure-free: do NOT emit any [tikz] blocks.', '',
    ]),
    bookletBlock(section.bookletPaths || []),
    '## Output Contract',
    '',
    'For EACH skill, write three files into the `out/` subdirectory of the current directory:',
    '',
    '- `out/{skillId}.content.json` — the content file per the schema',
    '- `out/{skillId}.quiz.json` — the quiz file per the schema',
    '- `out/{skillId}.report.json` — `{"id": "{skillId}", "structuralTypes": […named types',
    '  the booklet teaches and which items cover each…], "cases": […case analysis…],',
    '  "bookletErrata": […any errors you found in the booklet itself…]}`',
    '',
    `Finally write \`task-${num}.result.json\` in the current directory:`,
    `\`{"ids": ${JSON.stringify(section.skillIds)}, "done": true}\``,
    '',
    'Write files directly; do not ask for confirmation.',
  ].join('\n');

  fs.writeFileSync(path.join(outDir, `task-${num}.md`), task);
  fs.writeFileSync(path.join(outDir, `task-${num}.ids.json`), JSON.stringify({ ids: section.skillIds, section: section.name, model: section.model || null }) + '\n');
  console.log(`task-${num}.md: ${section.name} — ${section.skillIds.length} skill(s), ${(task.length / 1024).toFixed(0)}KB`);
}
fs.mkdirSync(path.join(outDir, 'out'), { recursive: true });
console.log(`\n${n} task(s) in ${outDir}`);
