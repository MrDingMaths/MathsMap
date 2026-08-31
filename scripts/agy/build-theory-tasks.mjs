// Theory pass: make a skill's TEACHING section read like the booklet — plain English, tight
// definitions, and the diagram the booklet draws beside the fact it teaches.
//
//   node scripts/agy/build-theory-tasks.mjs --plan --config .agywork/W3-2/batch.json \
//        --out .agywork/W3-2/theory.json
//   node scripts/agy/build-theory-tasks.mjs --in .agywork/W3-2/theory.json \
//        --config .agywork/W3-2/batch.json --out .agywork/W3-2/theory
//
// Two defects the authored corpus shipped, fixed in one pass because they are the same block:
//   - THEORY PROSE IS JARGON-HEAVY AND LONG. Detailed explanation overwhelms working memory
//     early in a topic; the booklets state a definition in a sentence. intro and facts are
//     rewritten to booklet-tight plain English (word caps enforced by scripts/check-theory.mjs).
//   - THEORY CARRIES NO FIGURE. All 818 files shipped theory as prose only, while the booklets
//     put the teaching diagram beside the fact (the cylinder net under "a cylinder's net has
//     two circles and one rectangle"). Figures are added where the theory is spatial — as
//     many as the teaching needs, with no cap (owner, 2026-08-30): an example SET from
//     docs/atomisation-teaching.md (NPPPN, PPNN) is only legible when every example and
//     non-example is drawn beside the others.
//
// `theory.steps` is FROZEN: a worked solution's step headers are validated against those exact
// strings (scripts/lib/procedure-labels + validate.mjs), so rewording one breaks every solution
// that cites it. Only intro and facts may change.
//
// Selection is deterministic and only ever OFFERS a skill: every skill with authored content is
// offered for the prose rewrite, and `signals` records why a figure might belong. Whether the
// theory is genuinely spatial is the model's call, and skipping the figure is the common answer.
//
// Output contract matches the repair lane, so scripts/agy/apply-repairs.mjs consumes it
// unchanged (via its `field: "theory"` branch); scripts/check-theory.mjs gates the results
// before they are applied.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { standingHazardsBlock } from './lib/hazards.mjs';
import { extractTikz } from '../lib/tikz-blocks.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MATHSDATABASE_ROOT = process.env.MATHSDATABASE_ROOT
  || path.resolve(rootDir, '..', 'MathsDatabase');

const read = (f) => fs.readFileSync(f, 'utf8').replace(/^﻿/, '');
const readJson = (f) => JSON.parse(read(f));
const contentPath = (id) => path.join(rootDir, 'public', 'content', `${id}.json`);
const quizPath = (id) => path.join(rootDir, 'public', 'quizzes', `${id}.json`);

const skillsRaw = readJson(path.join(rootDir, 'data', 'skills.json'));
const skillList = Array.isArray(skillsRaw) ? skillsRaw : skillsRaw.skills;
const byId = new Map(skillList.map((s) => [s.id, s]));
const dpById = new Map(readJson(path.join(rootDir, 'data', 'dotpoints.json')).map((d) => [d.id, d]));

const exemptPath = path.join(rootDir, 'scripts', 'lib', 'figure-quota-exempt.json');
const exempt = fs.existsSync(exemptPath) ? readJson(exemptPath) : {};

// Source of truth for this regex is scripts/audit-figure-quota.mjs (kept in sync by hand —
// that file is a top-level script with side effects and cannot be imported).
const VISUAL = /\b(graph|graphs|graphed|graphing|sketch|sketches|sketching|plot|plots|plotted|plotting|curve|curves|number line|reflect|reflects|reflecting|reflection|diagram|asymptote|asymptotes)\b/i;

// A skill whose TITLE is algebraic can still teach a picture — "solve trigonometric equations"
// is taught off the unit circle. These nouns, in the theory itself, name the drawing.
const THEORY_VISUAL = /\b(number line|unit circle|network|spanning tree|tree diagram|box plot|box-and-whisker|histogram|stem[- ]and[- ]leaf|venn|scatter|dot plot|transversal|co-?interior|alternate angles|bearing|cross[- ]?section|quadrant|axes|shade[ds]?|shading|region|net of|scale drawing|similar triangles|right[- ]angled triangle|circle)\b/i;

const theoryText = (theory) => [theory?.intro || '', ...(theory?.facts || []), ...(theory?.steps || [])].join('\n');

export function practiceFigures(content) {
  const out = [];
  for (const tier of ['foundation', 'development', 'mastery']) {
    for (const card of content.practice?.[tier] || []) {
      out.push(...extractTikz(card.question_text), ...extractTikz(card.solution_text));
    }
  }
  return out;
}

// Every skill with authored content is offered — the prose rewrite applies corpus-wide.
// `signals` records why a FIGURE might belong; whether one does is the model's call.
// `--figures-only` narrows the offer to skills carrying a visual signal.
export function classify(skillId) {
  const skill = byId.get(skillId);
  if (!skill) return { status: 'unknown-skill' };
  if (!fs.existsSync(contentPath(skillId))) return { status: 'no-content' };
  const content = readJson(contentPath(skillId));
  const text = theoryText(content.theory);
  const figures = practiceFigures(content);
  const signals = [];
  if (VISUAL.test(`${skill.title || ''} ${skill.blurb || ''}`)) signals.push('title');
  if (figures.length) signals.push('practice-figures');
  if (THEORY_VISUAL.test(text)) signals.push('theory-nouns');

  return {
    status: 'offered',
    signals,
    hasFigure: /\[tikz\]/.test(text),
    figureExempt: Boolean(exempt[skillId]),
    theory: content.theory,
    exemplars: figures.slice(0, 3),
    shape: { facts: content.theory?.facts?.length || 0, steps: content.theory?.steps?.length ?? null },
  };
}

export function buildPlan(config, { only = null, figuresOnly = false } = {}) {
  const inScope = (id) => !only || only.some((w) => id === w || id.startsWith(w));
  const plan = [];
  const tally = [];
  for (const section of config.sections) {
    const counts = {};
    for (const skillId of section.skillIds || []) {
      if (!inScope(skillId)) continue;
      const c = classify(skillId);
      const status = c.status !== 'offered' ? c.status
        : figuresOnly && !c.signals.length ? 'no-visual-signal'
          : 'offered';
      counts[status] = (counts[status] || 0) + 1;
      if (status !== 'offered') continue;
      plan.push({
        skillId,
        section: section.name,
        signals: c.signals,
        // A skill already carrying a theory figure gets the prose rewrite only; the existing
        // figure must survive it untouched.
        keepFigure: c.hasFigure,
        figureExempt: c.figureExempt,
        shape: c.shape,
      });
    }
    tally.push({ section: section.name, counts, total: (section.skillIds || []).filter(inScope).length });
  }
  return { plan, tally };
}

// ---------------------------------------------------------------------------

const BRIEF = String.raw`## What to do

Each skill below gets TWO jobs on its theory block. Job 1 applies to every skill. Job 2
applies only where the theory is spatial, which is the minority.

---

## Job 1 — rewrite intro and facts into booklet English (EVERY skill)

The authored theory is too long and too jargon-heavy. A student meeting this idea for the
first time cannot hold a 90-word paragraph of technical vocabulary in working memory; the
booklet states the definition in a sentence and moves on. Rewrite it to that register.

**Hard limits — checked mechanically, a breach is rejected:**

- intro: at most 45 words and at most 3 sentences.
- each fact: ONE sentence, at most 25 words, ONE idea.
- the fact COUNT is not capped, but growth is reported for human review, so it must be
  earned: merging two facts that say the same thing is good, splitting one into three to
  pad is not. The one thing that does earn extra facts is an EXAMPLE SET (Job 2) — an
  example and its near-miss non-example are separate facts, each with its own figure.
- a maths span, $...$, counts as one word.

**Voice:**

- Plain English. Use the everyday word unless the technical word is the thing being taught.
  "How far apart" beats "the magnitude of the displacement". "Add the weights" beats
  "compute the cardinality of the edge set".
- Technical vocabulary that IS the content stays, **bolded on first use**, and is defined in
  the same sentence it appears in: "A **tree** is a network with no closed loops."
- Say what a thing IS before saying what follows from it. Cut hedges, cut restatement, cut
  "it is important to note that", cut sentences that only introduce the next sentence.
- Keep every teachable fact. This is a rewrite for LENGTH and CLARITY, not a cull of
  content: if a fact states something a student needs, it survives — shorter.
- Keep the maths exactly as it is. Same symbols, same formulas, same numbers, same $...$.
- Do not add anything the original theory did not teach.

**theory.steps is FROZEN.** Return the steps array byte-identical, in the same order, with
the same wording. Worked solutions cite these strings as step headers and are validated
against them, so a reworded step breaks every solution that names it.

---

## Job 2 — add the teaching figure, where the theory is spatial

**Is this theory SPATIAL — does it state facts whose content is a shape, a position, or a
relationship between parts, such that the prose is describing a picture the student cannot
see?**

**Draw when one of these holds:**

- the theory names a display or structure as its central object and then makes claims about
  its parts: the five-number summary drawn as a box plot, a spanning tree of a network, the
  transversal cutting a pair of parallel lines, an interval on a number line;
- a fact asserts a POSITIONAL convention that words can only gesture at: which side is
  opposite and which adjacent, the direction a bearing is measured from, which region a
  shading covers, which quadrant a ratio is positive in;
- theory.steps performs a procedure ON a diagram (drop the perpendicular, mark the midpoint,
  read the value off the axis) and one labelled reference figure lets every step name a part
  of it.

**No figure — the common answer — when:**

- the theory is numeric, algebraic or procedural with no spatial content (substituting into a
  formula, converting a rate, applying an index law). A picture of a formula is decoration;
- the only figure you can think of is a worked instance: a particular network with particular
  weights, a particular parabola with particular intercepts. **A theory figure is a generic
  labelled reference, not a solved example.** If it carries the numbers of a problem it is a
  practice card, not theory;
- any practice or quiz stem listed for that skill becomes easier or answerable because the
  figure is on the page. The theory figure must never pre-mark, pre-shade or pre-label
  anything a student is asked to produce;
- the content is tabular. Rate tables, bills, frequency tables and two-way tables are a KaTeX
  array inside $...$, never [tikz];
- the skill's practice figures already carry the idea and the theory adds nothing new. Do not
  draw to hit a quota.

**When you draw:**

- **Draw as many figures as the teaching genuinely needs — there is no cap.** One reference
  figure at the END of theory.intro is still the common shape, and the facts then refer to
  it. But a fact may carry several: \`docs/atomisation-teaching.md\` prescribes example SETS
  (NPPPN, PPNN — a non-example, then positives that differ from it by one feature, then a
  non-example at the boundary), and a set is only legible when every member is DRAWN beside
  the others. Spanning trees want a spanning tree AND the two ways to fail to be one; the
  trapezoidal rule wants more than one application. An example and its near-miss non-example
  must differ in **exactly one feature**, and the fact's wording must say which.
- **Required check before you answer \`kept\` or \`none\`.** Read your own facts back. If two or
  more of them state PARALLEL CASES of the same idea — one application and two applications,
  an example and a non-example, the positive quadrant and the negative one — then those facts
  are an example set, and each of them carries its OWN figure showing that case, placed after
  that fact. A single reference figure in \`intro\` does not serve a set: the reader cannot see
  which case is which. Answering \`kept\` while the facts spell out cases you did not draw is
  the specific failure this instruction exists to stop. If you still judge no set is wanted,
  say so in \`reason\` and name the facts you considered.
- Do not draw a set where a single reference figure carries the idea. Extra figures that
  restate the same picture are padding, and the "no figure" tests above still bind: nothing
  may pre-mark what a practice stem asks the student to produce, and none of them may be a
  worked instance.
- Every figure goes on its OWN LINE, AFTER the prose it illustrates — never spliced
  mid-sentence (the renderer block-splits a string at each figure, so a mid-sentence figure
  fractures the sentence) and never ahead of the text it belongs to. A figure may not go in
  a step: steps are frozen.
- \`placement\` names the field your figures landed in (\`intro\`, or \`facts[i]\`); when a set
  spans several fields, name the field carrying the FIRST one.
- Generic labels (` + "$A$, $b$, $\\theta$, $r$" + `), not the numbers of a problem. A theory figure
  that carries a specific answer is a defect.
- Read the booklet PNGs listed below before drawing: match the booklet's own figure for this
  topic in what it labels and how it is set out.
- If a skill is marked KEEP EXISTING FIGURE below, its theory already carries one: return it
  unchanged, in the same field, while you rewrite the prose around it. That is a FLOOR, not a
  ceiling — an existing figure does not mean the skill is finished. If the teaching wants an
  example set, ADD the further figures beside the one you kept and set \`figure\` to \`drawn\`.

**Every $...$ span must survive intact.** A maths span is opened by \`$\` and closed by \`$\`,
and every symbol between them — digits, single letters, \`^\`, \`\text{}\`, backslash commands —
stays inside. \`$0^{\circ}$\` must not come back as \`^{\circ}$\`, and \`$n - 1$\` must not come
back as \`- 1$\`. TeX outside a \`$...$\` span does not render and is rejected.

**Money is the trap here.** A dollar amount is written \`$\$1000$\` — a maths span whose first
character is an ESCAPED dollar sign. Writing \`$1000\` in prose opens a maths span that never
closes and swallows the sentence after it into the maths. Every currency amount, every time.

NEVER resolve this by deleting the dollar sign. \`$\$45\,000$\` rewritten as \`$45\,000$\` says a
vehicle is worth 45 000 of nothing — the delimiters balance and the maths is now wrong. Keep
every currency amount the original theory taught, and keep its \`\\$\`.`;

function siblingStems(skillId) {
  const rows = [];
  const content = readJson(contentPath(skillId));
  for (const tier of ['foundation', 'development', 'mastery']) {
    for (const card of content.practice?.[tier] || []) {
      rows.push(`- (${tier}) ${String(card.question_text).replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, '[figure]').replace(/\s+/g, ' ').slice(0, 140)}`);
    }
  }
  if (fs.existsSync(quizPath(skillId))) {
    for (const q of readJson(quizPath(skillId)).questions || []) {
      rows.push(`- (quiz ${q.id}) ${String(q.question_text).replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, '[figure]').replace(/\s+/g, ' ').slice(0, 140)}`);
    }
  }
  return rows;
}

// Skill card mirrors build-gen-tasks.mjs skillCard (prereqs + dependents expanded).
function skillCard(skillId) {
  const skill = byId.get(skillId);
  if (!skill) throw new Error(`${skillId}: not found in data/skills.json`);
  const expand = (ids) => (ids || []).map((id) => byId.get(id)).filter(Boolean)
    .map((s) => ({ id: s.id, title: s.title, blurb: s.blurb }));
  return {
    id: skill.id, title: skill.title, blurb: skill.blurb, stage: skill.stage,
    dotPointIds: skill.dotPointIds || [], prereqs: expand(skill.prereqs),
  };
}

// Copied from build-gen-tasks.mjs:125 — that file parses argv at import time, so it cannot
// be imported. Absolute PNG paths are how agy actually sees the booklet's figures.
function bookletBlock(paths) {
  if (!paths.length) {
    return ['## Booklet', '', '**No booklet anchor exists for these skills** (`anchor: none`).',
      'Draw only what the theory itself states; when in doubt, skip.'].join('\n');
  }
  const parts = ['## Booklet section(s)', ''];
  for (const rel of paths) {
    const abs = path.join(rootDir, rel);
    if (!fs.existsSync(abs)) throw new Error(`booklet not found: ${rel}`);
    const stem = path.basename(rel, '.md');
    const mediaDir = path.join(path.dirname(abs), 'media', stem, 'media');
    const pngs = fs.existsSync(mediaDir)
      ? fs.readdirSync(mediaDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).map((f) => path.join(mediaDir, f))
      : [];
    parts.push(`### ${stem}`, '');
    if (pngs.length) {
      parts.push('Figures this booklet draws — Read these image files before you draw anything:', '');
      for (const p of pngs) parts.push(`- ${p}`);
      parts.push('');
    }
    parts.push('```markdown', read(abs), '```', '');
  }
  return parts.join('\n');
}

export function taskFor({ section, rows, num, tikzRules }) {
  const blocks = rows.map((row, i) => {
    const c = classify(row.skillId);
    const flags = [
      row.signals.length ? `figure signals: ${row.signals.join(', ')}` : 'no figure signal — prose rewrite is probably the whole job',
      ...(row.keepFigure ? ['**KEEP EXISTING FIGURE**'] : []),
    ];
    // The fact COUNT is not capped (owner, 2026-08-30) — an example set has nowhere to live
    // but `facts`. The per-fact word budget is what keeps theory tight; growth is reported
    // for human review, not rejected.
    const caps = `Word budget: intro ≤ 45 words / 3 sentences; each fact ≤ 25 words, one sentence.`
      + ` This theory has ${c.shape.facts} fact(s); tighten rather than pad, but an example set`
      + ` (one member per fact, each with its own figure) may legitimately add more.`;
    const parts = [
      `### Skill ${i + 1} — \`${row.skillId}\` (${flags.join('; ')})`,
      '',
      '```json',
      JSON.stringify(skillCard(row.skillId), null, 2),
      '```',
      '',
      `Current \`theory\`. Rewrite \`intro\` and \`facts\`; return \`steps\` byte-identical. ${caps}`,
      '```json',
      JSON.stringify(c.theory, null, 2),
      '```',
      '',
    ];
    if (c.exemplars?.length) {
      parts.push(
        'This skill already draws these figures in its practice items — match their style:',
        '```latex',
        c.exemplars.join('\n\n'),
        '```',
        '',
      );
    }
    const stems = siblingStems(row.skillId);
    if (stems.length) {
      parts.push('What the student will be asked — your figure must not answer any of these:', '', ...stems, '');
    }
    return parts.join('\n');
  });

  const dpTexts = [...new Set(rows.flatMap((r) => byId.get(r.skillId)?.dotPointIds || []))]
    .map((id) => dpById.get(id)).filter(Boolean).map((d) => `- ${d.id} (${d.code}): ${d.text}`);

  return [
    `# Theory pass ${num} — section ${section.name}`,
    '',
    'Each skill below teaches its concept in a `theory` block that is longer and more technical',
    'than the booklet it came from, and carries no diagram. Tighten the prose to booklet English',
    'for every skill, and add the teaching figure where the theory is genuinely spatial.',
    '',
    BRIEF,
    '',
    ...(dpTexts.length ? ['## Governing dot points', '', ...dpTexts, ''] : []),
    // The drawing-only subset: this lane authors no questions, so the item-level
    // hazards (value signatures, mastery scope, structure slugs) do not apply.
    standingHazardsBlock('figure'),
    '',
    ...(tikzRules ? ['## TikZ rules (only the sections relevant here)', '', tikzRules, ''] : []),
    bookletBlock(section.bookletPaths || []),
    '## Skills',
    '',
    ...blocks,
    '## Output Contract',
    '',
    `Write your result to \`task-${num}.result.json\` in the current directory (nowhere else):`,
    '```json',
    JSON.stringify({
      ids: rows.map((r) => r.skillId),
      repairs: rows.map((r) => ({
        skillId: r.skillId,
        target: { file: 'content', field: 'theory' },
        decision: 'rewrite | skip',
        figure: 'drawn | kept | none',
        placement: 'intro | facts[i] — where the figure sits, only when figure is drawn/kept',
        reason: 'one line — required when you skip, or when figure is "none"',
        replacement: { '…': 'the complete theory object, required for decision "rewrite"' },
      })),
    }, null, 2),
    '```',
    'Every skill gets a row. `decision: "rewrite"` is the normal outcome — the prose rewrite',
    'applies to every skill, so `skip` is only for a theory already at booklet length and',
    'register, and it needs a reason. `figure` is the separate call, and `"none"` is the common',
    'answer there. Copy each `target` verbatim. Omit `replacement` entirely when you skip. Write',
    'the file directly; do not ask for confirmation.',
  ].join('\n');
}

// ---------------------------------------------------------------------------

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const out = arg('--out', '');
  const configFile = arg('--config', '');
  if (!out || !configFile) {
    console.error('usage: build-theory-tasks.mjs --plan --config <batch.json> --out <plan.json> [--only ids] [--figures-only]');
    console.error('       build-theory-tasks.mjs --in <plan.json> --config <batch.json> --out <tasks-dir>');
    process.exit(2);
  }
  const config = readJson(path.resolve(configFile));
  const onlyRaw = arg('--only', '');
  const only = onlyRaw ? onlyRaw.split(',').map((s) => s.trim()).filter(Boolean) : null;

  if (process.argv.includes('--plan')) {
    const { plan, tally } = buildPlan(config, { only, figuresOnly: process.argv.includes('--figures-only') });
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(path.resolve(out), JSON.stringify({ batch: config.batch, plan }, null, 2) + '\n');
    for (const t of tally) {
      const rest = Object.entries(t.counts).filter(([k]) => k !== 'offered')
        .map(([k, v]) => `${k}=${v}`).join(', ');
      console.log(`${t.section.padEnd(34)} offered=${String(t.counts.offered || 0).padStart(2)} of ${t.total}${rest ? `  (${rest})` : ''}`);
    }
    const withSignal = plan.filter((p) => p.signals.length).length;
    console.log(`\n${plan.length} skill(s) for the prose rewrite; ${withSignal} carry a figure signal — an upper bound, the model decides per skill whether the theory is spatial.`);
    console.log(`plan written to ${out}`);
    return;
  }

  const inFile = arg('--in', '');
  if (!inFile) { console.error('need --plan or --in <plan.json>'); process.exit(2); }
  const { plan } = readJson(path.resolve(inFile));

  const { assembleTikzRules, detectTikzSections } = await import(
    new URL(`file:///${path.join(MATHSDATABASE_ROOT, 'tools', 'qgen', 'lib', 'tikz-sections.mjs').replace(/\\/g, '/')}`)
  );

  const outDir = path.resolve(out);
  fs.mkdirSync(outDir, { recursive: true });
  let n = 0;
  for (const section of config.sections) {
    const rows = plan.filter((p) => p.section === section.name);
    if (!rows.length) continue;
    n++;
    const num = String(n).padStart(3, '0');

    // Playbook sections: what the batch declared, widened by what the skills themselves look
    // like — a batch configured before this lane existed may declare none at all.
    const texts = rows.flatMap((r) => {
      const c = classify(r.skillId);
      return [theoryText(c.theory), ...(c.exemplars || [])];
    });
    const detected = detectTikzSections(texts, { fallback: [] }).sections;
    const sections = [...new Set([...(section.tikzSections || []), ...detected])].filter((s) => s !== 'core');
    const tikzRules = assembleTikzRules(sections);

    fs.writeFileSync(path.join(outDir, `task-${num}.md`), taskFor({ section, rows, num, tikzRules }));
    fs.writeFileSync(path.join(outDir, `task-${num}.ids.json`), JSON.stringify({ ids: rows.map((r) => r.skillId), section: section.name }) + '\n');
    const task = read(path.join(outDir, `task-${num}.md`));
    console.log(`task-${num}.md: ${section.name} — ${rows.length} skill(s), ${(task.length / 1024).toFixed(0)}KB`);
  }
  console.log(`\n${n} task(s) in ${outDir}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) await main();
