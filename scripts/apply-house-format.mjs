#!/usr/bin/env node
// Rewrites question_text / solution_text to the canonical house format
// (scripts/lib/house-format.mjs) across public/content and public/quizzes.
//
// This is the fixer for the SPACING class reported by
// scripts/audit-house-format.mjs. It only moves whitespace: no character other
// than a space, tab or newline is added or removed, and [tikz] interiors are
// copied byte for byte. The other audit classes (display maths, raw Unicode
// maths, restated answers, off-pool names) need a human and are NOT touched.
//
// Dry run by default — nothing is written without --write.
//
// Usage:
//   node scripts/apply-house-format.mjs                      # dry run, all skills
//   node scripts/apply-house-format.mjs --only id1,id2       # ids or prefix
//   node scripts/apply-house-format.mjs --stems              # stems only
//   node scripts/apply-house-format.mjs --solutions          # solutions only
//   node scripts/apply-house-format.mjs --write              # actually write
//   node scripts/apply-house-format.mjs --dir <root>         # test override
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rejectStrayPositionals } from './lib/argv.mjs';
import { houseFormatStem, houseFormatSolution } from './lib/house-format.mjs';
import { listSkillIds } from './lib/content-fields.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
rejectStrayPositionals(argv, {
  valueFlags: ['--only', '--dir'],
  boolFlags: ['--write', '--stems', '--solutions', '--verbose']
});
const write = argv.includes('--write');
const verbose = argv.includes('--verbose');
// Neither flag means both; the split exists so the corpus-wide rewrite can land
// in two bisectable commits.
const doStems = argv.includes('--stems') || !argv.includes('--solutions');
const doSolutions = argv.includes('--solutions') || !argv.includes('--stems');
const onlyIdx = argv.indexOf('--only');
const dirIdx = argv.indexOf('--dir');
const baseDir = dirIdx !== -1 && argv[dirIdx + 1] ? join(rootDir, argv[dirIdx + 1]) : join(rootDir, 'public');
const filterFn = onlyIdx !== -1 && argv[onlyIdx + 1]
  ? ((ids) => (id) => ids.some((want) => id === want || id.startsWith(want)))(
      argv[onlyIdx + 1].split(',').map((s) => s.trim()).filter(Boolean))
  : null;

// Whitespace-only guarantee: the rewrite must never change a non-whitespace
// character. Checked per field, not assumed from the regexes.
const skeleton = (s) => s.replace(/\s+/g, '');

// The edit is made on the RAW file text, one JSON string literal at a time,
// rather than by re-serialising the parsed object. Half the corpus was written
// with a different indent to `JSON.stringify(x, null, 2)`, so a re-serialise
// would reformat 1144 files wholesale and bury the real change. This way every
// byte outside the two fields is untouched.
const FIELD_RE = /("(?:question_text|solution_text)":\s*)("(?:\\.|[^"\\])*")/g;

let filesChanged = 0;
let fieldsChanged = 0;
const violations = [];

for (const skillId of listSkillIds(baseDir, filterFn)) {
  for (const [, sub] of [['content', 'content'], ['quiz', 'quizzes']]) {
    const path = join(baseDir, sub, `${skillId}.json`);
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, 'utf8');
    let dirty = false;

    const next = raw.replace(FIELD_RE, (match, prefix, literal) => {
      const stem = prefix.includes('question_text');
      if (stem && !doStems) return match;
      if (!stem && !doSolutions) return match;
      const before = JSON.parse(literal);
      const after = stem ? houseFormatStem(before) : houseFormatSolution(before);
      if (after === before) return match;
      if (skeleton(after) !== skeleton(before)) {
        violations.push(`${skillId} ${sub}: rewrite changed non-whitespace characters near ${literal.slice(0, 60)}`);
        return match;
      }
      dirty = true;
      fieldsChanged++;
      if (verbose) console.log(`  ${skillId} ${sub} ${stem ? 'question_text' : 'solution_text'}`);
      return prefix + JSON.stringify(after);
    });

    if (!dirty) continue;
    // Re-parse before writing: a bad edit that produces invalid JSON must never
    // reach disk.
    JSON.parse(next);
    filesChanged++;
    if (write) writeFileSync(path, next, 'utf8');
  }
}

if (violations.length) {
  for (const v of violations) console.error(`✗ ${v}`);
  console.error(`\n✗ ${violations.length} field(s) skipped: the canonicaliser is not whitespace-only there. Fix the bug, do not write.`);
  process.exit(1);
}

console.log(
  `${write ? 'Rewrote' : 'Would rewrite'} ${fieldsChanged} field(s) in ${filesChanged} file(s)` +
    ` (${doStems ? 'stems' : ''}${doStems && doSolutions ? ' + ' : ''}${doSolutions ? 'solutions' : ''}).`
);
if (!write && fieldsChanged) console.log('Dry run — pass --write to apply.');
