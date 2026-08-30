// Builds one agy task per booklet section: fill in the skeleton the deterministic parser
// produced (scripts/booklet/parse-booklet.mjs) to make schema-conformant bank JSON.
//
//   node scripts/booklet/build-transcribe-tasks.mjs --bank s5-trig-c-2 \
//     --parsed .agywork/booklet/s5-trig-c-2/parsed \
//     --out .agywork/booklet/s5-trig-c-2/transcribe
//   node scripts/agy/run-gen.mjs --tasks-dir .agywork/booklet/s5-trig-c-2/transcribe
//   node scripts/booklet/collect-transcribe.mjs --tasks-dir .agywork/booklet/s5-trig-c-2/transcribe
//
// This is SKELETON FILL, not free transcription. The model receives ids, tiers, origins,
// figures, part labels and the exact source text already extracted, and may only replace
// the `null` fields. Everything structural is fixed, which is what lets the collector prove
// no question was invented, dropped or renumbered.
//
// The task file follows the same contract as scripts/agy/build-gen-tasks.mjs so
// scripts/agy/run-gen.mjs drives it unchanged: `task-NNN.md`, a sibling `task-NNN.ids.json`,
// and a `task-NNN.result.json` whose ids reconcile against it.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { rejectStrayPositionals } from '../lib/argv.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function arg(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : fallback;
}

function read(path) {
  return readFileSync(path, 'utf8').replace(/^﻿/, '');
}

function readJson(path) {
  return JSON.parse(read(path));
}

const skills = readJson(join(ROOT, 'data', 'skills.json'));
const skillById = new Map(skills.map((s) => [s.id, s]));

/** The skill cards a section's questions could plausibly be tagged with. */
function skillCard(skillId) {
  const skill = skillById.get(skillId);
  if (!skill) throw new Error(`${skillId}: not in data/skills.json`);
  return {
    id: skill.id,
    title: skill.title,
    blurb: skill.blurb,
    stage: skill.stage,
    difficulty: skill.difficulty,
    prereqs: skill.prereqs || [],
  };
}

/** The `structure` vocabulary a skill's existing practice and quiz already use. */
function structureVocab(skillId) {
  const vocab = new Set();
  for (const [dir, pick] of [['content', (d) => Object.values(d.practice || {}).flat()], ['quizzes', (d) => d.questions || []]]) {
    const file = join(ROOT, 'public', dir, `${skillId}.json`);
    if (!existsSync(file)) continue;
    try {
      for (const item of pick(readJson(file))) if (item && item.structure) vocab.add(item.structure);
    } catch { /* the content validator reports malformed files */ }
  }
  return [...vocab].sort();
}

const RULES = `## Transcription rules

You are transcribing an existing, published booklet. **Fidelity beats improvement.**

1. **Never change the mathematics.** Numbers, units, rounding instructions ("to 1 d.p.",
   "to the nearest minute"), angle values, labels and part ordering are reproduced exactly.
   If the booklet is wrong, transcribe it as written and record it under \`bookletErrata\`
   in the report — do not silently correct it.
2. **The printed answer is authoritative.** \`_source.answerRaw\` is the answer the booklet
   prints. Put it in \`answer\`, tidied into the text format below, even if you would have
   computed something else. If you believe it is wrong, still transcribe it and list it in
   \`bookletErrata\`.
3. **Do not write \`solution_text\`.** Full worked solutions are a later pass. The only
   exception is an \`example\` block, whose worked solution is printed in the booklet and
   belongs in its \`solution_text\`, and a \`proof\` block's \`steps[].working\`.
4. **Fill nulls only.** \`id\`, \`tier\`, \`origin\`, \`figure.png\`, \`figure.crop\`,
   \`figure.widthCm\` and every part/cell \`label\` are already correct. Do not add, remove,
   reorder or renumber cards, parts or cells. The collector rejects the task if you do.
5. **Remove every \`_source\` key from your output.** It is scaffolding: the raw text the
   parser extracted, plus \`figures\`, the full list of pictures that cell holds. Use it,
   then drop it.
6. **A cell with more than one figure**: the schema allows one \`figure\` per card, part or
   cell. If \`_source.figures\` lists two and both matter, mention the second in the
   \`question_text\` wording and note it in \`uncertain\`; never drop it silently.

## Text format

Identical to \`docs/content-schema.md\`:

- Inline maths in \`$…$\` (KaTeX). **No display maths**, no \`$$…$$\`.
- Bold with \`**…**\`. No other Markdown.
- A newline is a line break; one working step per line.
- A literal dollar is \`\\$\`. Every LaTeX backslash is doubled in JSON: \`\\\\frac\`,
  \`\\\\times\`, \`\\\\circ\`.
- Degrees are \`$47^{\\\\circ}$\`. Units stay outside the maths: \`$7.9$ m\`, not \`$7.9 m$\`.
- The booklet's fill-in-the-blank working (rows of dots) becomes \`scaffold\`, using
  \`{{blank}}\` in prose and \`\\\\rule{1.2cm}{0.4pt}\` inside maths. A Key Ideas cloze uses
  \`{{the missing words}}\` — the braces hold the ANSWER, so the renderer can print either a
  blank or the filled-in version.

## Tagging

- \`skills\`: every skill id the question genuinely exercises, from the candidate list below.
  Mixed and exam-style questions legitimately name several. \`primarySkill\` is the one the
  question is mainly about and must be a member of \`skills\`.
- \`structure\`: a kebab-case slug naming the question's shape, reusing the skill's existing
  vocabulary where one fits. Cards that differ only by numbers share a slug. Omit it rather
  than invent a slug for a one-off exam question.
- \`tags\`: optional kebab-case labels for anything a recipe might select on
  (\`bearings\`, \`show-that\`, \`composite-area\`).
- \`marks\`: only when the booklet states them (HSC-sourced items usually do).`;

function taskFor(section, { bank, parsedDir, skeleton, candidates, num, schemaDoc, figuresDir }) {
  const cardCount = skeleton.cards.length;
  const partCount = skeleton.cards.reduce((n, c) => n + (c.parts ? c.parts.length : 0), 0);
  const blockCount = skeleton.blocks.length;

  const figures = [...new Set(JSON.stringify(skeleton).match(/figures\/[A-Za-z0-9_.-]+\.png/g) || [])];

  const candidateCards = candidates.map((id) => ({
    ...skillCard(id),
    structureVocabulary: structureVocab(id),
  }));

  return [
    `# Transcribe booklet section: ${skeleton.title}`,
    '',
    `Booklet: **${skeleton.title}** — section \`${section}\` of bank \`${bank}\`.`,
    `The deterministic parser found **${cardCount} card(s)** (${partCount} lettered part(s))`,
    `and **${blockCount} block(s)**. Your job is to fill in the nulls in that skeleton.`,
    '',
    RULES,
    '',
    '## Schema',
    '',
    'The output contract. Unknown keys are errors.',
    '',
    '```markdown',
    schemaDoc,
    '```',
    '',
    '## Candidate skills',
    '',
    'Tag questions using these skill ids. If a question genuinely exercises a skill not',
    'listed here, use its id anyway — but only ids that exist in `data/skills.json`.',
    '',
    '```json',
    JSON.stringify(candidateCards, null, 2),
    '```',
    '',
    '## Source (line-numbered)',
    '',
    'The booklet section exactly as exported, with line numbers matching every `origin.lines`',
    'in the skeleton. This is the authority for wording, numbers and printed answers.',
    '',
    '```markdown',
    read(join(parsedDir, `${section}.md`)),
    '```',
    '',
    ...(figures.length
      ? ['## Figures', '',
        'The pictures this section uses. **Read these image files** — you need to see them to',
        'write question wording that refers to the diagram correctly, and to confirm a',
        'figure belongs to the part it is attached to. Each is already cropped in the data',
        'via `figure.crop` (fractions of the whole image, as Word cropped it), so a file that',
        'looks like a strip of several diagrams is correct: the crop selects one of them.',
        '',
        ...figures.map((f) => `- ${join(figuresDir, f.replace('figures/', ''))}`),
        '']
      : []),
    '## Skeleton',
    '',
    'Fill every `null`. Keep every other value byte-identical. Drop every `_source` key.',
    '',
    '```json',
    JSON.stringify(skeleton, null, 2),
    '```',
    '',
    '## Output contract',
    '',
    'Write these files into the `out/` subdirectory of the current directory:',
    '',
    `- \`out/${section}.cards.json\` — \`{"bank": "${bank}", "section": "${section}", "cards": [ … ]}\``,
    `- \`out/${section}.blocks.json\` — \`{"bank": "${bank}", "section": "${section}", "blocks": [ … ]}\``,
    `- \`out/${section}.report.json\` — \`{"id": "${section}", "bookletErrata": [ … ],`,
    '  `"uncertain": [{"id": …, "note": …}], "figureNotes": [ … ]}`',
    '',
    `Finally write \`task-${num}.result.json\` in the current directory:`,
    `\`{"ids": ["${section}"], "done": true}\``,
    '',
    'Write files directly; do not ask for confirmation.',
  ].join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  rejectStrayPositionals(argv, { valueFlags: ['--bank', '--parsed', '--out', '--config', '--only'], boolFlags: [] });
  const bank = arg(argv, '--bank');
  const parsedArg = arg(argv, '--parsed');
  const outArg = arg(argv, '--out');
  if (!bank || !parsedArg || !outArg) {
    console.error('usage: node scripts/booklet/build-transcribe-tasks.mjs --bank <slug> --parsed <dir> --out <dir> [--config <file>] [--only sec,sec]');
    process.exit(2);
  }
  const parsedDir = resolve(ROOT, parsedArg);
  const outDir = resolve(ROOT, outArg);
  const configPath = resolve(ROOT, arg(argv, '--config', join('scripts', 'booklet', 'batches', `${bank}.json`)));
  if (!existsSync(configPath)) {
    console.error(`✗ no batch config at ${configPath}`);
    console.error('  It lists, per section, the candidate skill ids to tag against.');
    process.exit(1);
  }
  const config = readJson(configPath);
  const onlyRaw = arg(argv, '--only');
  const only = onlyRaw ? new Set(onlyRaw.split(',').map((s) => s.trim()).filter(Boolean)) : null;

  const index = readJson(join(parsedDir, 'index.json'));
  const schemaDoc = read(join(ROOT, 'docs', 'booklet-bank-schema.md'));
  const figuresDir = join(ROOT, 'booklets', 'bank', bank, 'figures');

  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(outDir, 'out'), { recursive: true });

  const sectionsConfig = new Map((config.sections || []).map((s) => [s.slug, s]));
  let num = 0;
  const written = [];

  for (const entry of index.sections) {
    if (only && !only.has(entry.slug)) continue;
    const skeleton = readJson(join(parsedDir, `${entry.slug}.json`));
    // A section with no questions and only mechanical blocks (the syllabus page) needs no
    // model: the parser already produced its final shape.
    const settings = sectionsConfig.get(entry.slug);
    if (settings && settings.skip) {
      console.log(`${entry.slug}: skipped (${settings.skip})`);
      continue;
    }
    if (!settings) {
      console.error(`✗ ${entry.slug}: no entry in ${configPath}`);
      process.exit(1);
    }

    num++;
    const padded = String(num).padStart(3, '0');
    const task = taskFor(entry.slug, {
      bank,
      parsedDir,
      skeleton,
      candidates: settings.candidateSkillIds || [],
      num: padded,
      schemaDoc,
      figuresDir,
    });
    writeFileSync(join(outDir, `task-${padded}.md`), task, 'utf8');
    writeFileSync(
      join(outDir, `task-${padded}.ids.json`),
      `${JSON.stringify({ ids: [entry.slug], section: entry.slug, bank })}\n`,
      'utf8',
    );
    written.push({ slug: entry.slug, kb: Math.round(task.length / 1024), cards: entry.cards, blocks: entry.blocks });
    console.log(`task-${padded}.md: ${entry.slug} — ${entry.cards} card(s), ${entry.blocks} block(s), ${Math.round(task.length / 1024)}KB`);
  }

  console.log(`\n${written.length} task(s) in ${outArg.split('\\').join('/')}`);
  console.log(`Next: node scripts/agy/run-gen.mjs --tasks-dir ${outArg.split('\\').join('/')}`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
