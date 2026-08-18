#!/usr/bin/env node
// Builds classification jobs for the practice.structure backfill (see
// docs/content-schema.md and docs/content-generation.md). For each skill
// with practice cards, emits: the skill's existing quiz `structure` slugs
// (one example question each), every practice card keyed by {tier, index}
// with its stem, and an advisory stem-template pre-cluster.
//
// A job asks an agent to assign each card a `structure` slug — reusing an
// existing quiz slug when the card is that same structural type, minting a
// new slug only when the card is a genuine type the quiz doesn't cover.
// Cards differing only by case (sign/regime/boundary/representation) share
// one slug. The advisory cluster is a hint, not a constraint: two cards can
// cluster together on raw wording and still be different structural types
// (e.g. same template, opposite sign), or cluster apart and be the same type.
//
// Usage:
//   node scripts/structure-jobs.mjs --out <dir>              # one file per skill
//   node scripts/structure-jobs.mjs --out <dir> --batch 15    # group N skills/file
//   node scripts/structure-jobs.mjs --out <dir> --only id1,id2
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rejectStrayPositionals } from './lib/argv.mjs';
import { stripTikzBlocks } from '../src/lib/inline-content.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(rootDir, 'public', 'content');
const quizzesDir = join(rootDir, 'public', 'quizzes');

function parseValueArg(argv, flag) {
  const idx = argv.indexOf(flag);
  if (idx === -1 || idx === argv.length - 1) return null;
  return argv[idx + 1];
}

function parseOnlyArg(argv) {
  const raw = parseValueArg(argv, '--only');
  if (!raw) return null;
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return (id) => ids.some((want) => id === want || id.startsWith(want));
}

const argv = process.argv.slice(2);
rejectStrayPositionals(argv, { valueFlags: ['--only', '--out', '--batch'], boolFlags: [] });
const filterFn = parseOnlyArg(argv);
const outDir = parseValueArg(argv, '--out');
const batchSize = Number(parseValueArg(argv, '--batch') || 1);

if (!outDir) {
  console.error('✗ --out <dir> is required');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

// Digits collapse to '#' so "Round $3.47$" and "Round $8.12$" cluster; keeps
// [tikz] blocks (a template with vs without a figure is a different template).
function stemTemplate(text) {
  return String(text)
    .replace(/\d+(?:\.\d+)?/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function stemOf(text) {
  const stripped = stripTikzBlocks(text);
  return stripped.length > 500 ? stripped.slice(0, 500) + '…' : stripped;
}

function hasFigure(text) {
  return String(text).includes('[tikz]');
}

const contentFiles = readdirSync(contentDir).filter((f) => f.endsWith('.json'));
const jobs = [];

for (const filename of contentFiles) {
  const skillId = filename.slice(0, -'.json'.length);
  if (filterFn && !filterFn(skillId)) continue;
  const content = JSON.parse(readFileSync(join(contentDir, filename), 'utf8'));
  const practice = content.practice;
  if (!practice) continue;

  const cards = [];
  for (const tier of ['foundation', 'development', 'mastery']) {
    (practice[tier] || []).forEach((card, index) => {
      cards.push({
        tier,
        index,
        stem: stemOf(card.question_text),
        hasFigure: hasFigure(card.question_text)
      });
    });
  }
  if (!cards.length) continue;

  let quizStructures = [];
  const quizPath = join(quizzesDir, filename);
  try {
    const quiz = JSON.parse(readFileSync(quizPath, 'utf8'));
    const bySlug = new Map();
    for (const q of quiz.questions || []) {
      if (q.structure && !bySlug.has(q.structure)) bySlug.set(q.structure, stemOf(q.question_text));
    }
    quizStructures = [...bySlug.entries()].map(([slug, example]) => ({ slug, example }));
  } catch {
    // No quiz file (or invalid) — the agent mints structure slugs from scratch.
  }

  // Advisory pre-cluster by template. Purely a hint in the job payload.
  const clusters = new Map();
  for (const card of cards) {
    const key = stemTemplate(card.stem);
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(`${card.tier}[${card.index}]`);
  }
  const advisoryClusters = [...clusters.values()].filter((group) => group.length > 1);

  jobs.push({ skillId, quizStructures, cards, advisoryClusters });
}

jobs.sort((a, b) => a.skillId.localeCompare(b.skillId));

let written = 0;
for (let i = 0; i < jobs.length; i += Math.max(1, batchSize)) {
  const batch = jobs.slice(i, i + Math.max(1, batchSize));
  const first = batch[0].skillId;
  const last = batch[batch.length - 1].skillId;
  const name = batch.length === 1 ? `${first}.json` : `batch-${String(i / batchSize + 1).padStart(3, '0')}-${first}-${last}.json`;
  writeFileSync(join(outDir, name), JSON.stringify(batch, null, 2) + '\n', 'utf8');
  written++;
}

console.log(`Wrote ${written} job file(s) for ${jobs.length} skill(s) to ${outDir}`);
