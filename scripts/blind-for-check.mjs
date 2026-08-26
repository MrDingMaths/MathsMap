#!/usr/bin/env node
// Emits a blinded bundle of a skill's quiz + mastery practice questions for an
// independent "checker" agent to re-solve without seeing answers. Reads
// public/quizzes/{id}.json and public/content/{id}.json (either may be
// missing). Writes, per skill, into .checkwork/ (gitignored):
//   {skillId}.blind.json — what the checker sees (no correct flags/why/a/solution)
//   {skillId}.key.json   — the answer key, for the orchestrator to compare later
//
// Usage: node scripts/blind-for-check.mjs <skillId> [<skillId>...] [--out <dir>]
//        node scripts/blind-for-check.mjs <skillId> --items q3,q5,m1 [--out <dir>]
//
// --items restricts the emitted bundle to a comma-separated list of item ids (quiz question
// ids as they appear in public/quizzes/{id}.json, or m<n> for the n-th (1-based) mastery
// practice card, same synthesis as the full-bundle m1, m2, ... ids). Exactly one skillId
// positional is required when --items is used. Every unchanged item (quiz question or mastery
// card not named in --items) is still surfaced in blind.json under `siblingContext` — enough
// for a checker to judge duplication/leakage against the rest of the bundle — but with
// solution/correctness data withheld the same as any other blind item.
//
// See docs/content-schema.md for the quiz/content schemas this reads.
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const quizzesDir = path.join(rootDir, 'public', 'quizzes');
const contentDir = path.join(rootDir, 'public', 'content');
const defaultOutDir = path.join(rootDir, '.checkwork');
const gitignorePath = path.join(rootDir, '.gitignore');

// djb2 hash, deterministic across runs (no Math.random).
function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

// Mulberry32 PRNG seeded from a 32-bit int — deterministic, seed-only source
// of "randomness" so the same skillId+questionId always shuffles the same way.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle driven by a deterministic PRNG; returns the shuffled
// array plus a map from new index -> original index (originalOrder).
function deterministicShuffle(arr, seed) {
  const rand = mulberry32(seed);
  const indices = arr.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    shuffled: indices.map((origIdx) => arr[origIdx]),
    originalOrder: indices, // originalOrder[newIdx] = origIdx
  };
}

async function readJsonIfExists(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return undefined;
    throw err;
  }
}

async function ensureGitignoreEntry(dir) {
  const rel = path.relative(rootDir, dir).split(path.sep).join('/');
  const entry = `${rel}/`;
  let contents = '';
  try {
    contents = await fs.readFile(gitignorePath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  const lines = contents.split(/\r?\n/);
  const already = lines.some((l) => l.trim() === entry || l.trim() === rel);
  if (already) return;
  const needsNewline = contents.length > 0 && !contents.endsWith('\n');
  const addition = `${needsNewline ? '\n' : ''}${contents.length ? '' : ''}${entry}\n`;
  await fs.writeFile(gitignorePath, contents + (needsNewline ? '\n' : '') + entry + '\n');
}

// `wantedIds`, when given, is a Set restricting which quiz question ids get a full blind
// entry (question_text/structure/mastery/options) + a key entry. Every other question still
// contributes a sibling-context entry (id/structure/question_text/option texts only, no
// correct flags/why). `wantedIds` undefined/null means "emit everything" (today's behaviour;
// siblingQuiz is then always empty since nothing is left over).
function blindQuiz(quizData, skillId, wantedIds = null) {
  const questions = Array.isArray(quizData?.questions) ? quizData.questions : [];
  const blindQuestions = [];
  const keyQuestions = [];
  const siblingQuiz = [];
  const seenIds = new Set();

  for (const question of questions) {
    seenIds.add(question.id);
    const seed = djb2(`${skillId}:${question.id}`);
    const { shuffled, originalOrder } = deterministicShuffle(question.options || [], seed);
    const wanted = !wantedIds || wantedIds.has(question.id);

    if (!wanted) {
      siblingQuiz.push({
        id: question.id,
        structure: question.structure,
        question_text: question.question_text,
        options: shuffled.map((o) => o.text),
      });
      continue;
    }

    const correctOriginalIdx = (question.options || []).findIndex((o) => o.correct === true);
    const shuffledIndexOfCorrect = originalOrder.indexOf(correctOriginalIdx);
    const correctOption = correctOriginalIdx >= 0 ? question.options[correctOriginalIdx] : undefined;

    const blindOptions = shuffled.map((o) => ({ text: o.text }));

    const blindQ = {
      id: question.id,
      question_text: question.question_text,
      structure: question.structure,
      mastery: question.mastery,
      options: blindOptions,
    };
    blindQuestions.push(blindQ);

    keyQuestions.push({
      id: question.id,
      correctText: correctOption?.text,
      shuffledIndexOfCorrect,
      originalOrder,
    });
  }

  return { blindQuestions, keyQuestions, siblingQuiz, seenIds };
}

// `wantedIds`, when given, is a Set of "m<n>" ids (1-based) restricting which mastery
// practice cards get a full blind entry + key entry. Every other card still contributes a
// sibling-context entry (id/question_text only).
function blindMastery(contentData, wantedIds = null) {
  const mastery = Array.isArray(contentData?.practice?.mastery) ? contentData.practice.mastery : [];
  const blindItems = [];
  const keyItems = [];
  const siblingMastery = [];
  const seenIds = new Set();

  mastery.forEach((card, i) => {
    const idx = `m${i + 1}`;
    seenIds.add(idx);
    const wanted = !wantedIds || wantedIds.has(idx);
    if (!wanted) {
      siblingMastery.push({ id: idx, question_text: card.question_text });
      return;
    }
    const blindItem = { id: idx, question_text: card.question_text };
    blindItems.push(blindItem);
    keyItems.push({ id: idx, solution_text: card.solution_text });
  });

  return { blindItems, keyItems, siblingMastery, seenIds };
}

// `itemIds`, when given, is the raw --items list (e.g. ["q3","q5","m1"]) for this (sole)
// skill. Splits it into quiz-question wanted ids and mastery wanted ids for blindQuiz /
// blindMastery, then validates every requested id was actually found once both files have
// been read (an unmatched id is an error, not a silent no-op).
async function processSkill(skillId, outDir, itemIds = null) {
  const quizFile = path.join(quizzesDir, `${skillId}.json`);
  const contentFile = path.join(contentDir, `${skillId}.json`);

  const [quizData, contentData] = await Promise.all([
    readJsonIfExists(quizFile),
    readJsonIfExists(contentFile),
  ]);

  if (!quizData && !contentData) {
    console.warn(`[blind-for-check] ${skillId}: no quiz or content file found — skipping`);
    return { skillId, ok: false, quizCount: 0, masteryCount: 0 };
  }
  if (!quizData) {
    console.warn(`[blind-for-check] ${skillId}: no quiz file (public/quizzes/${skillId}.json)`);
  }
  if (!contentData) {
    console.warn(`[blind-for-check] ${skillId}: no content file (public/content/${skillId}.json)`);
  }

  const wantedQuizIds = itemIds ? new Set(itemIds.filter((id) => /^m\d+$/.test(id) === false)) : null;
  const wantedMasteryIds = itemIds ? new Set(itemIds.filter((id) => /^m\d+$/.test(id))) : null;

  const { blindQuestions, keyQuestions, siblingQuiz, seenIds: seenQuizIds } = quizData
    ? blindQuiz(quizData, skillId, wantedQuizIds)
    : { blindQuestions: [], keyQuestions: [], siblingQuiz: [], seenIds: new Set() };
  const { blindItems, keyItems, siblingMastery, seenIds: seenMasteryIds } = contentData
    ? blindMastery(contentData, wantedMasteryIds)
    : { blindItems: [], keyItems: [], siblingMastery: [], seenIds: new Set() };

  if (itemIds) {
    const unknown = itemIds.filter((id) => !seenQuizIds.has(id) && !seenMasteryIds.has(id));
    if (unknown.length > 0) {
      throw new Error(`${skillId}: unknown --items id(s): ${unknown.join(', ')}`);
    }
  }

  // What the skill TEACHES (theory.intro/facts/steps) travels with the bundle. It carries no
  // answers — the blind is on the items, not on the syllabus — and withholding it manufactures
  // false mismatches: in W3-1 the checker marked vehicle-stamp-duty q6 and vehicle-purchase-costs
  // q2 wrong because it could not know the taught rule ("market value or purchase price,
  // whichever is higher") or the taught tax-rate table, both of which the student does see.
  // It also lets the checker judge out-of-scope and under-determination against what was
  // actually taught rather than against its own assumptions.
  const blindBundle = {
    skillId,
    ...(contentData?.theory ? { taught: contentData.theory } : {}),
    quiz: blindQuestions,
    masteryPractice: blindItems,
    ...(itemIds
      ? {
          siblingContext: {
            note: 'siblingContext is context only — do not re-solve; use it to judge duplication and cross-item leakage',
            quiz: siblingQuiz,
            masteryPractice: siblingMastery,
          },
        }
      : {}),
  };
  const keyBundle = {
    skillId,
    quiz: keyQuestions,
    masteryPractice: keyItems,
  };

  const blindPath = path.join(outDir, `${skillId}.blind.json`);
  const keyPath = path.join(outDir, `${skillId}.key.json`);
  await fs.writeFile(blindPath, JSON.stringify(blindBundle, null, 2) + '\n');
  await fs.writeFile(keyPath, JSON.stringify(keyBundle, null, 2) + '\n');

  console.log(`[blind-for-check] ${skillId}: ${blindQuestions.length} quiz question(s), ${blindItems.length} mastery item(s)`);
  console.log(`  -> ${path.relative(rootDir, blindPath)}`);
  console.log(`  -> ${path.relative(rootDir, keyPath)}`);

  return { skillId, ok: true, quizCount: blindQuestions.length, masteryCount: blindItems.length };
}

function parseArgs(argv) {
  const skillIds = [];
  let outDir = defaultOutDir;
  let items = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--out') {
      outDir = path.resolve(argv[++i] ?? '');
    } else if (arg === '--items') {
      items = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      skillIds.push(arg);
    }
  }
  return { skillIds, outDir, items };
}

async function main() {
  const { skillIds, outDir, items } = parseArgs(process.argv.slice(2));

  if (skillIds.length === 0) {
    console.error('Usage: node scripts/blind-for-check.mjs <skillId> [<skillId>...] [--out <dir>]');
    console.error('       node scripts/blind-for-check.mjs <skillId> --items q3,q5,m1 [--out <dir>]');
    process.exit(1);
  }

  if (items && skillIds.length !== 1) {
    console.error('[blind-for-check] --items requires exactly one skillId positional argument.');
    process.exit(1);
  }

  await fs.mkdir(outDir, { recursive: true });
  if (outDir === defaultOutDir) {
    await ensureGitignoreEntry(defaultOutDir);
  }

  const results = [];
  for (const skillId of skillIds) {
    results.push(await processSkill(skillId, outDir, items));
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`[blind-for-check] failed (no quiz or content) for: ${failed.map((r) => r.skillId).join(', ')}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[blind-for-check] failed:', err);
  process.exit(1);
});
