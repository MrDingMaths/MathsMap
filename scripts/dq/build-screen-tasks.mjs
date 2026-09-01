#!/usr/bin/env node
// Build agy screening tasks for a Diagnostic Questions promotion slice.
//
//   node scripts/dq/build-screen-tasks.mjs --bundle .diagnostic-questions/worker-results.json \
//     --topic t-s4-alg --out .agywork/dq-t-s4-alg [--batch-size 12]
//
// Each task hands one or more skills to agy with (a) the archetype vocabulary that skill
// already uses and (b) every eligible candidate mapped to it. agy returns, per candidate, a
// keep/reject verdict and the structure slug to promote under.
//
// This is the lane that made the t-s4-frc pilot expensive: the structure map and the
// hand-reject screen were done by hand for 87 candidates. Nothing here promotes anything —
// the result feeds `apply-screen.mjs`, which writes a structure map and an exclusion list for
// `process-candidates.mjs` to consume.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  lintProductionQuestion,
  resolveMappedSkill,
  skillIdsForTopic,
  toProductionQuestion,
  validateCandidate,
} from './core.mjs';

function arg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const REJECT_CLASSES = `1. **Corrupted source text.** A LaTeX command whose backslash was lost, so the stem reads
   "$dfrac18$", "$ rac38$" or "$45 imes0.2$". Never guess the missing backslash — reject.
2. **Not English.** The source is a UK site and a few questions are in Welsh.
3. **Cites a figure it does not carry.** Two variants, both fatal:
   (a) No figure at all — "the following shape", "which other diagram", "the table shows",
       "use the diagram" with no [tikz] block in the stem.
   (b) A figure that IS present but does not carry the feature the stem names. If the stem
       asks for "point P", "the shaded region" or "the green line", read the TikZ source and
       confirm that label or marking is actually drawn. A figure that plots the right lines
       but never labels P leaves the question unanswerable.
   (A stem that fully states its numbers in words is fine even if it mentions a picture.)
4. **Off-skill.** The question does not test THIS skill. It passed two independent mappers,
   so only reject when it is plainly about something else.
5. **Exam-paper fragment.** Still carries part labels like "(b) (i)", references "your
   calculator", or depends on an earlier part that is not present.
6. **Duplicates an existing item.** The same question, or the same numbers, as one of the
   existing stems listed for the skill.
7. **Two options that are mathematically equal**, or an option that gives away / collides
   with the key of another question in the same skill (e.g. the key of one question appearing
   as a distractor in another with the same structure).`;

const STRUCTURE_RULES = `- Prefer a slug from "Existing archetypes" — that vocabulary is shared with the skill's
  practice cards, and reusing it is the whole point of this pass.
- Only mint a NEW kebab-case slug when the question genuinely tests an archetype that is
  absent from the list. Keep new slugs short and general (e.g. "add-mixed-numbers"), never
  a description of this one question (NOT "add-two-mixed-numbers-with-unlike-denominators").
- The slug describes the QUESTION TYPE, not its numbers or its story.
- Give a structure even for a candidate you reject; it is ignored, but it keeps the shape
  uniform.`;

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function stemOf(question, limit = 240) {
  return String(question?.question_text ?? '')
    .replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, '[FIGURE]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

async function main() {
  const bundlePath = arg('--bundle');
  const topic = arg('--topic');
  const skillsArg = arg('--skills');
  const outDir = arg('--out');
  const batchSize = Number(arg('--batch-size', '12'));
  if (!bundlePath || !outDir || (!topic && !skillsArg)) {
    console.error('usage: node scripts/dq/build-screen-tasks.mjs --bundle <file> (--topic <id> | --skills <ids>) --out <dir> [--batch-size 12]');
    process.exit(2);
  }
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

  const topicIds = topic ? topic.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const fromTopics = (await Promise.all(topicIds.map((t) => skillIdsForTopic(repoRoot, t)))).flat();
  const scope = new Set([
    ...fromTopics,
    ...(skillsArg ? skillsArg.split(',').map((id) => id.trim()).filter(Boolean) : []),
  ]);
  if (!scope.size) throw new Error('scope resolved to no skills');

  const bundle = await readJson(path.resolve(bundlePath));
  const candidates = Array.isArray(bundle) ? bundle
    : Array.isArray(bundle.candidates) ? bundle.candidates
      : (bundle.jobs ?? []).flatMap((job) => job.candidates ?? []);

  const contentDir = path.join(repoRoot, 'public', 'content');
  const contentIds = new Set((await fs.readdir(contentDir)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
  const skillById = new Map((await readJson(path.join(repoRoot, 'data', 'skills.json'))).map((s) => [s.id, s]));

  // Same funnel `process-candidates.mjs` applies, so the screen only ever sees candidates
  // that would actually be promoted.
  const bySkill = new Map();
  for (const candidate of candidates) {
    const mapped = resolveMappedSkill(candidate);
    if (!mapped.skillId || !scope.has(mapped.skillId) || !contentIds.has(mapped.skillId)) continue;
    if (!validateCandidate(candidate, { phase: 'ready' }).valid) continue;
    const transcription = candidate.transcription;
    if ((transcription?.uncertainties ?? []).length) continue;
    const hasDiagram = /\[tikz\]/.test(`${transcription?.question_text ?? ''}${transcription?.solution_text ?? ''}`)
      || transcription?.diagramRequired;
    if (hasDiagram && candidate.review?.diagram !== 'approved' && candidate.review?.diagramApproved !== true) continue;
    let production;
    try { production = toProductionQuestion(candidate); } catch { continue; }
    if (lintProductionQuestion(production).length) continue;
    if (!bySkill.has(mapped.skillId)) bySkill.set(mapped.skillId, []);
    bySkill.get(mapped.skillId).push({ candidate, production });
  }
  if (!bySkill.size) throw new Error('no eligible candidates in scope');

  // Pack skills into tasks, keeping a whole skill in one task so the model sees its full
  // vocabulary and can spot within-skill collisions.
  const batches = [];
  let current = [];
  let currentCount = 0;
  for (const [skillId, items] of [...bySkill].sort((a, b) => b[1].length - a[1].length)) {
    if (current.length && currentCount + items.length > batchSize) {
      batches.push(current);
      current = [];
      currentCount = 0;
    }
    current.push([skillId, items]);
    currentCount += items.length;
  }
  if (current.length) batches.push(current);

  await fs.mkdir(path.resolve(outDir), { recursive: true });

  let taskNo = 0;
  for (const batch of batches) {
    taskNo += 1;
    const base = `task-${String(taskNo).padStart(3, '0')}`;
    const ids = [];
    const sections = [];

    for (const [skillId, items] of batch) {
      const skill = skillById.get(skillId);
      const content = await readJson(path.join(contentDir, `${skillId}.json`));
      const quiz = await readJson(path.join(repoRoot, 'public', 'quizzes', `${skillId}.json`));
      const practice = content.practice ?? {};
      const practiceCards = [...(practice.foundation ?? []), ...(practice.development ?? []), ...(practice.mastery ?? [])];
      const vocabulary = [...new Set([
        ...practiceCards.map((c) => c.structure),
        ...(quiz.questions ?? []).map((q) => q.structure),
      ].filter(Boolean))];

      const existing = [
        ...(quiz.questions ?? []).map((q) => `  - [quiz ${q.structure}] ${stemOf(q, 160)}`),
        ...practiceCards.map((c) => `  - [practice ${c.structure}] ${stemOf(c, 160)}`),
      ].join('\n');

      const lines = [
        `### Skill \`${skillId}\` — ${skill?.title ?? ''}`,
        skill?.blurb ? `${skill.blurb}\n` : '',
        `**Existing archetypes:** ${vocabulary.join(', ')}`,
        '',
        `**Existing questions and practice cards** (${(quiz.questions ?? []).length} quiz + ${practiceCards.length} practice) — a candidate that repeats one of these is a duplicate:`,
        existing,
        '',
        '**Candidates to screen:**',
        '',
      ];

      for (const { candidate, production } of items) {
        ids.push(String(candidate.source.id));
        const options = production.options
          .map((o, i) => `    ${String.fromCharCode(65 + i)}) ${o.text}${o.correct ? '   <-- CORRECT' : `   [why: ${o.why}]`}`)
          .join('\n');
        lines.push(
          `- **id \`${candidate.source.id}\`**`,
          `  - source structure (hyper-specific, to be replaced): \`${candidate.transcription.structure}\``,
          `  - source case: ${candidate.transcription.meaningfulCase || '-'}`,
          `  - stem: ${String(production.question_text).replace(/\n/g, ' ')}`,
          '  - options:',
          options,
          `  - solution: ${String(production.solution_text).replace(/\n/g, ' ')}`,
          '',
        );
      }
      sections.push(lines.filter((l) => l !== '').join('\n'));
    }

    const task = `# Screen Diagnostic Questions imports for promotion

You are screening questions imported from an external UK maths site before they are published
into an Australian (NSW) skill-atomised maths site. Every candidate below already passed
transcription, an independent checker, and two independent skill mappers. Your job is narrow
and has exactly two parts per candidate.

## Part 1 — keep or reject

Reject a candidate only for one of these reasons. If none applies, keep it.

${REJECT_CLASSES}

Do NOT reject for: British spelling, GBP (£) amounts, unfamiliar names or places, or a
question being easy. Those are all acceptable.

## Part 2 — assign a structure slug

Every skill below lists the archetype slugs it already uses. Assign each candidate the slug
it belongs to.

${STRUCTURE_RULES}

## Skills and candidates

${sections.join('\n\n')}

## Output Contract

Write your result to \`${base}.result.json\` in the current directory. Nothing else. Shape:

\`\`\`json
{
  "candidates": [
    { "id": "145671", "verdict": "reject", "reason": "corrupted-text: stem reads $dfrac18$ with the backslash lost", "structure": "fraction-to-decimal" },
    { "id": "32837",  "verdict": "keep",   "reason": "", "structure": "fraction-to-percentage" }
  ]
}
\`\`\`

Rules for the result:
- Include **every** id listed above, exactly once, using the id string as given.
- \`verdict\` is exactly "keep" or "reject".
- \`reason\` is required when rejecting: start with the class ("corrupted-text", "not-english",
  "missing-figure", "off-skill", "exam-fragment", "duplicate", "option-collision") then a
  short specific explanation. Leave it "" when keeping.
- \`structure\` is a kebab-case slug, always present.
- Write the file directly. Do not ask for confirmation.
`;

    await fs.writeFile(path.join(path.resolve(outDir), `${base}.md`), task, 'utf8');
    await fs.writeFile(path.join(path.resolve(outDir), `${base}.ids.json`), `${JSON.stringify({ ids }, null, 2)}\n`, 'utf8');
  }

  const total = [...bySkill.values()].reduce((sum, items) => sum + items.length, 0);
  console.log(`[dq-screen] ${taskNo} task(s) in ${outDir}: ${total} candidate(s) across ${bySkill.size} skill(s)`);
}

main().catch((error) => {
  console.error(`[dq-screen] ${error.message}`);
  process.exitCode = 1;
});
