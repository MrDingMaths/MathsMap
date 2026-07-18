#!/usr/bin/env node
// Emits a blinded bundle of a skill's quiz + mastery practice questions for an
// independent "checker" agent to re-solve without seeing answers. Reads
// public/quizzes/{id}.json and public/content/{id}.json (either may be
// missing). Writes, per skill, into .checkwork/ (gitignored):
//   {skillId}.blind.json — what the checker sees (no correct flags/why/a/solution)
//   {skillId}.key.json   — the answer key, for the orchestrator to compare later
//
// Usage: node scripts/blind-for-check.mjs <skillId> [<skillId>...] [--out <dir>]
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

function blindQuiz(quizData, skillId) {
  const questions = Array.isArray(quizData?.questions) ? quizData.questions : [];
  const blindQuestions = [];
  const keyQuestions = [];

  for (const question of questions) {
    const seed = djb2(`${skillId}:${question.id}`);
    const { shuffled, originalOrder } = deterministicShuffle(question.options || [], seed);

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

  return { blindQuestions, keyQuestions };
}

function blindMastery(contentData) {
  const mastery = Array.isArray(contentData?.practice?.mastery) ? contentData.practice.mastery : [];
  const blindItems = [];
  const keyItems = [];

  mastery.forEach((card, i) => {
    const idx = `m${i + 1}`;
    const blindItem = { id: idx, question_text: card.question_text };
    blindItems.push(blindItem);
    keyItems.push({ id: idx, solution_text: card.solution_text });
  });

  return { blindItems, keyItems };
}

async function processSkill(skillId, outDir) {
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

  const { blindQuestions, keyQuestions } = quizData
    ? blindQuiz(quizData, skillId)
    : { blindQuestions: [], keyQuestions: [] };
  const { blindItems, keyItems } = contentData
    ? blindMastery(contentData)
    : { blindItems: [], keyItems: [] };

  const blindBundle = {
    skillId,
    quiz: blindQuestions,
    masteryPractice: blindItems,
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
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--out') {
      outDir = path.resolve(argv[++i] ?? '');
    } else {
      skillIds.push(arg);
    }
  }
  return { skillIds, outDir };
}

async function main() {
  const { skillIds, outDir } = parseArgs(process.argv.slice(2));

  if (skillIds.length === 0) {
    console.error('Usage: node scripts/blind-for-check.mjs <skillId> [<skillId>...] [--out <dir>]');
    process.exit(1);
  }

  await fs.mkdir(outDir, { recursive: true });
  if (outDir === defaultOutDir) {
    await ensureGitignoreEntry(defaultOutDir);
  }

  const results = [];
  for (const skillId of skillIds) {
    results.push(await processSkill(skillId, outDir));
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
