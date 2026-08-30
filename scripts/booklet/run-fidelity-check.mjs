// Independent fidelity check of a transcribed booklet section: a different model
// (OpenAI via the codex CLI, as the content lane's blind checker uses) reads the SOURCE
// booklet slice beside the JSON that claims to represent it, and reports where they differ.
//
//   node scripts/booklet/run-fidelity-check.mjs --bank s5-trig-c-2 \
//     --parsed .agywork/booklet/s5-trig-c-2/parsed
//   node scripts/booklet/run-fidelity-check.mjs --bank s5-trig-c-2 --report
//
// Deliberately NOT blind: the collector already proves the structure mechanically
// (scripts/booklet/collect-transcribe.mjs), so what is left is exactly the judgement a
// second reader can make — did the wording, the numbers, the printed answers and the figure
// assignments survive the transcription. That needs both sides in view.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { runCodexOnce, pool, firstDiagnosticChars } from '../run-luna-check.mjs';
import { rejectStrayPositionals } from '../lib/argv.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCHEMA = join(ROOT, 'scripts', 'booklet', 'fidelity-schema.json');
const TIMEOUT_MS = 12 * 60 * 1000;

function arg(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : fallback;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''));
}

export function validateFidelityReply(reply) {
  const problems = [];
  if (!reply || typeof reply !== 'object') problems.push('reply is not an object');
  else {
    if (typeof reply.section !== 'string') problems.push('"section" must be a string');
    if (!Number.isInteger(reply.itemsChecked)) problems.push('"itemsChecked" must be an integer');
    if (!Array.isArray(reply.flags)) problems.push('"flags" must be an array');
    else reply.flags.forEach((flag, i) => {
      if (!flag || typeof flag !== 'object') problems.push(`flags[${i}] is not an object`);
      else {
        if (typeof flag.id !== 'string' || !flag.id) problems.push(`flags[${i}].id is required`);
        if (typeof flag.category !== 'string') problems.push(`flags[${i}].category is required`);
        if (typeof flag.note !== 'string' || !flag.note) problems.push(`flags[${i}].note is required`);
      }
    });
  }
  if (problems.length) throw new Error(`malformed fidelity reply: ${problems.join('; ')}`);
}

export const BRIEF = `You are checking a TRANSCRIPTION for fidelity.

A booklet section was exported from Word to markdown, then converted to JSON by another
model. You are given the markdown source (line-numbered) and the JSON. Report every place
the JSON misrepresents the source. You are the last check before this becomes a printed
booklet, so a missed error reaches students.

Check, for every card, part and cell:

- **omission** — something in the source that is absent from the JSON: a question, a part,
  a printed answer, a sentence of the stem, a rounding instruction, a hint.
- **value-drift** — a number, unit, angle, label or rounding instruction that differs from
  the source. Check every digit.
- **answer-mismatch** — the JSON's \`answer\` is not the answer the booklet printed. The
  BOOKLET is authoritative here even when it looks wrong: report a booklet error as
  "other" with a note, not as an answer-mismatch.
- **figure-mismatch** — a figure attached to the wrong question or part, or a question that
  clearly needs the diagram the source shows but has none. You cannot see the images; judge
  from which markdown line each image reference sits on against the \`origin.lines\` and the
  part ordering.
- **hallucination** — wording, values or context in the JSON with no basis in the source.
  Rewording for clarity is NOT hallucination; inventing a scenario, a value or a constraint
  is.
- **tag-doubt** — a \`skills\`/\`primarySkill\` tag that the question plainly does not
  exercise, or an obviously missing one.
- **formatting** — maths that will not render or reads wrong: an unbalanced \`$\`, a unit
  swallowed into the maths, a degree sign lost, a lost fraction.

Do NOT flag: rewording that preserves meaning; a solution_text that is absent (a later pass
writes those); the absence of \`structure\` or \`tags\`; the \`_source\` scaffolding having
been removed (that is required).

Report only real differences. An empty \`flags\` array is the correct answer for a faithful
transcription, and is more useful than a list of stylistic quibbles.`;

export function buildPrompt({ section, sourceMd, cards, blocks }) {
  return [
    BRIEF,
    '',
    `## Section: ${section}`,
    '',
    '## Source (line-numbered markdown, exported from Word)',
    '',
    '```markdown',
    sourceMd,
    '```',
    '',
    '## Transcription — cards',
    '',
    '```json',
    JSON.stringify(cards, null, 2),
    '```',
    '',
    '## Transcription — blocks',
    '',
    '```json',
    JSON.stringify(blocks, null, 2),
    '```',
    '',
    `Reply with the JSON object the schema describes. Set "section" to "${section}" and`,
    '"itemsChecked" to the number of cards, parts and cells you examined.',
  ].join('\n');
}

const CATEGORY_ORDER = ['omission', 'value-drift', 'answer-mismatch', 'hallucination', 'figure-mismatch', 'formatting', 'tag-doubt', 'other'];
// The first four change what a student reads or marks against; the rest are quality debt.
const BLOCKING = new Set(['omission', 'value-drift', 'answer-mismatch', 'hallucination']);

function report(results) {
  const flags = results.flatMap((r) => (r.reply ? r.reply.flags.map((f) => ({ ...f, section: r.section })) : []));
  const byCategory = new Map();
  for (const flag of flags) {
    if (!byCategory.has(flag.category)) byCategory.set(flag.category, []);
    byCategory.get(flag.category).push(flag);
  }
  const checked = results.reduce((n, r) => n + (r.reply ? r.reply.itemsChecked : 0), 0);
  console.log(`Fidelity: ${results.filter((r) => r.reply).length}/${results.length} section(s) checked, ${checked} item(s) examined, ${flags.length} flag(s).`);

  for (const category of CATEGORY_ORDER) {
    const list = byCategory.get(category);
    if (!list || !list.length) continue;
    console.log(`\n${BLOCKING.has(category) ? '✗' : '⚠'} ${category} (${list.length})`);
    for (const flag of list) {
      console.log(`  • ${flag.section} ${flag.id}${flag.field ? `.${flag.field}` : ''}${flag.sourceLines ? ` [${flag.sourceLines}]` : ''}`);
      console.log(`    ${flag.note}`);
      if (flag.suggestedFix) console.log(`    fix: ${flag.suggestedFix}`);
    }
  }
  const blocking = flags.filter((f) => BLOCKING.has(f.category)).length;
  const failures = results.filter((r) => !r.reply);
  for (const failure of failures) console.error(`\n✗ ${failure.section}: ${failure.error}`);
  if (!flags.length && !failures.length) console.log('\n✓ No fidelity flags.');
  return { blocking, failures: failures.length };
}

async function main() {
  const argv = process.argv.slice(2);
  rejectStrayPositionals(argv, {
    valueFlags: ['--bank', '--parsed', '--only', '--concurrency', '--timeout-ms', '--out'],
    boolFlags: ['--report', '--strict'],
  });
  const bank = arg(argv, '--bank');
  const parsedArg = arg(argv, '--parsed');
  if (!bank) {
    console.error('usage: node scripts/booklet/run-fidelity-check.mjs --bank <slug> --parsed <dir> [--only sec,sec] [--report] [--strict]');
    process.exit(2);
  }
  const bankDir = join(ROOT, 'booklets', 'bank', bank);
  const header = readJson(join(bankDir, 'bank.json'));
  const outDir = resolve(ROOT, arg(argv, '--out', join('.checkwork', 'booklet', bank)));
  const onlyRaw = arg(argv, '--only');
  const only = onlyRaw ? new Set(onlyRaw.split(',').map((s) => s.trim()).filter(Boolean)) : null;
  const reportOnly = argv.includes('--report');
  mkdirSync(outDir, { recursive: true });

  const sections = (header.sections || []).filter((slug) => {
    if (only && !only.has(slug)) return false;
    return existsSync(join(bankDir, 'cards', `${slug}.json`));
  });

  const results = [];
  if (reportOnly) {
    for (const section of sections) {
      const file = join(outDir, `${section}.fidelity.json`);
      if (existsSync(file)) results.push({ section, reply: readJson(file) });
      else results.push({ section, error: 'not checked yet' });
    }
  } else {
    if (!parsedArg) {
      console.error('✗ --parsed <dir> is required (it holds the line-numbered source slices)');
      process.exit(2);
    }
    const parsedDir = resolve(ROOT, parsedArg);
    const concurrency = Number(arg(argv, '--concurrency', '3'));
    const timeoutMs = Number(arg(argv, '--timeout-ms', String(TIMEOUT_MS)));

    await pool(sections, concurrency, async (section) => {
      const outFile = join(outDir, `${section}.fidelity.json`);
      if (existsSync(outFile)) {
        // Resume: a section already checked is not re-billed.
        results.push({ section, reply: readJson(outFile) });
        console.error(`  ${section}: cached`);
        return;
      }
      const prompt = buildPrompt({
        section,
        sourceMd: readFileSync(join(parsedDir, `${section}.md`), 'utf8'),
        cards: readJson(join(bankDir, 'cards', `${section}.json`)).cards,
        blocks: existsSync(join(bankDir, 'blocks', `${section}.json`))
          ? readJson(join(bankDir, 'blocks', `${section}.json`)).blocks
          : [],
      });
      try {
        const reply = await runCodexOnce({ prompt, timeoutMs, schema: SCHEMA, validate: validateFidelityReply });
        writeFileSync(outFile, `${JSON.stringify(reply, null, 2)}\n`, 'utf8');
        results.push({ section, reply });
        console.error(`  ${section}: ${reply.flags.length} flag(s)`);
      } catch (error) {
        results.push({ section, error: firstDiagnosticChars(String(error.message || error), 300) });
        console.error(`  ${section}: FAILED — ${error.message}`);
      }
    });
  }

  results.sort((a, b) => sections.indexOf(a.section) - sections.indexOf(b.section));
  const { blocking, failures } = report(results);
  if (failures) process.exit(1);
  if (blocking && argv.includes('--strict')) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main();
}
