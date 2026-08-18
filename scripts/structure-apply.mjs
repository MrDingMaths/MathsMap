#!/usr/bin/env node
// Applies practice.structure assignments (produced against a job file from
// scripts/structure-jobs.mjs) to public/content/{skillId}.json.
//
// Input is a JSON array of:
//   { skillId, assignments: [{ tier, index, structure }], newStructures?: [{ slug, why }] }
// (newStructures is informational only — logged, not written anywhere.)
//
// Refuses the whole file on any unmapped card, unknown tier/index, or bad
// slug — a partial apply would leave a skill half-tagged with no record of
// which half. Card key order becomes question_text, structure, solution_text.
//
// Usage:
//   node scripts/structure-apply.mjs <result.json>
//   node scripts/structure-apply.mjs <result.json> --dry-run
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isStructureSlug } from '../src/lib/inline-content.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(rootDir, 'public', 'content');

// Takes one required positional (the result file) plus --dry-run, so the
// shared flags-only rejectStrayPositionals guard doesn't fit — validate
// directly instead.
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const positionals = argv.filter((a) => a !== '--dry-run');

if (positionals.length !== 1) {
  console.error('✗ usage: node scripts/structure-apply.mjs <result.json> [--dry-run]');
  process.exit(2);
}

const results = JSON.parse(readFileSync(positionals[0], 'utf8'));
const batch = Array.isArray(results) ? results : [results];

let failed = false;
let skillsWritten = 0;
let cardsTagged = 0;

for (const result of batch) {
  const { skillId, assignments, newStructures } = result;
  const errors = [];
  if (typeof skillId !== 'string' || !skillId) {
    console.error(`✗ result missing skillId: ${JSON.stringify(result).slice(0, 100)}`);
    failed = true;
    continue;
  }
  const contentPath = join(contentDir, `${skillId}.json`);
  let content;
  try {
    content = JSON.parse(readFileSync(contentPath, 'utf8'));
  } catch (e) {
    console.error(`✗ ${skillId}: cannot read content file — ${e.message}`);
    failed = true;
    continue;
  }
  const practice = content.practice;
  if (!practice) {
    console.error(`✗ ${skillId}: content file has no practice tiers`);
    failed = true;
    continue;
  }

  if (!Array.isArray(assignments)) {
    console.error(`✗ ${skillId}: assignments must be an array`);
    failed = true;
    continue;
  }

  // Index assignments by tier[index]; every card must get exactly one.
  const byKey = new Map();
  for (const a of assignments) {
    const key = `${a.tier}[${a.index}]`;
    if (byKey.has(key)) errors.push(`duplicate assignment for ${key}`);
    byKey.set(key, a.structure);
  }

  let totalCards = 0;
  for (const tier of ['foundation', 'development', 'mastery']) {
    const list = practice[tier];
    if (!Array.isArray(list)) continue;
    list.forEach((card, index) => {
      totalCards++;
      const key = `${tier}[${index}]`;
      const structure = byKey.get(key);
      if (structure === undefined) {
        errors.push(`no assignment for ${key} ("${String(card.question_text || '').slice(0, 60)}")`);
        return;
      }
      if (!isStructureSlug(structure)) {
        errors.push(`${key}: "${structure}" is not a kebab-case slug`);
        return;
      }
      byKey.delete(key);
    });
  }
  for (const leftoverKey of byKey.keys()) {
    errors.push(`assignment for ${leftoverKey} does not match any card in this content file`);
  }

  if (errors.length) {
    console.error(`✗ ${skillId}: ${errors.length} problem(s)`);
    for (const e of errors) console.error(`    ${e}`);
    failed = true;
    continue;
  }

  const assignedByKey = new Map(assignments.map((a) => [`${a.tier}[${a.index}]`, a.structure]));
  for (const tier of ['foundation', 'development', 'mastery']) {
    const list = practice[tier];
    if (!Array.isArray(list)) continue;
    practice[tier] = list.map((card, index) => ({
      question_text: card.question_text,
      structure: assignedByKey.get(`${tier}[${index}]`),
      solution_text: card.solution_text
    }));
  }

  if (!dryRun) {
    writeFileSync(contentPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  }
  skillsWritten++;
  cardsTagged += totalCards;
  if (newStructures?.length) {
    console.log(`  ${skillId}: minted ${newStructures.length} new slug(s) — ${newStructures.map((n) => n.slug).join(', ')}`);
  }
}

console.log(`${dryRun ? '[dry-run] ' : ''}${skillsWritten}/${batch.length} skill(s) written, ${cardsTagged} card(s) tagged.`);
if (failed) process.exit(1);
