import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const fxGood = join('tests', 'fixtures', 'booklet', 'fx-good');
const fxBad = join('tests', 'fixtures', 'booklet', 'fx-bad');
const recipesGood = join('tests', 'fixtures', 'booklet', 'recipes-good');
const recipesBad = join('tests', 'fixtures', 'booklet', 'recipes-bad');

function run(args) {
  const result = spawnSync(process.execPath, [join('scripts', 'booklet', 'validate-bank.mjs'), ...args], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

// --- happy path --------------------------------------------------------------

test('a well-formed bank validates clean with no warnings', () => {
  const { status, stdout } = run(['--bank-dir', fxGood, '--no-recipes']);
  assert.equal(status, 0, stdout);
  assert.match(stdout, /checked 1 bank\(s\), 3 card\(s\), 5 block\(s\)/);
  assert.match(stdout, /✓ All checks passed \(0 warning\(s\)\)\./);
});

test('--only restricts the run to the named sections', () => {
  const { status, stdout } = run(['--bank-dir', fxGood, '--only', 'sine-rule-sides', '--no-recipes']);
  assert.equal(status, 0);
  assert.match(stdout, /\(filtered\)/);
  const none = run(['--bank-dir', fxGood, '--only', 'no-such-section', '--no-recipes']);
  assert.equal(none.status, 0);
  assert.match(none.stdout, /0 card\(s\), 0 block\(s\)/);
});

test('stray positionals after --only exit 2 rather than silently filtering to the first', () => {
  const { status, stderr } = run(['--bank-dir', fxGood, '--only', 'a', 'b']);
  assert.equal(status, 2);
  assert.match(stderr, /Unrecognised argument\(s\): b/);
});

// --- one assertion per defect class -----------------------------------------

const bad = () => run(['--bank-dir', fxBad, '--no-recipes']);

test('a broken bank exits 1 and reports every defect class', () => {
  const { status } = bad();
  assert.equal(status, 1);
});

test('unknown card key is an error', () => {
  assert.match(bad().stderr, /cards\[0\] \(sine-rule-sides-f1\): unknown key "difficulty"/);
});

test('duplicate card id is an error', () => {
  assert.match(bad().stderr, /duplicate id "sine-rule-sides-f1"/);
});

test('tier outside the enum is an error', () => {
  assert.match(bad().stderr, /\.tier: must be one of foundation, development, mastery, got "starter"/);
});

test('a skill id absent from data\\/skills.json is an error', () => {
  assert.match(bad().stderr, /\.skills: "not-a-real-skill" is not a skill in data\/skills\.json/);
});

test('primarySkill outside skills[] is an error', () => {
  assert.match(bad().stderr, /\.primarySkill: "cosine-rule" must be one of the card's skills/);
});

test('a missing figure PNG, an out-of-range crop and a non-positive width are all errors', () => {
  const { stderr } = bad();
  assert.match(stderr, /\.figure\.png: "figures\/missing\.png" does not exist in the bank/);
  assert.match(stderr, /\.figure\.crop: l \+ r must be < 1 \(0\.7 \+ 0\.6\)/);
  assert.match(stderr, /\.figure\.widthCm: must be a positive number/);
});

test('a card with parts must not carry a top-level answer, and part labels must ascend', () => {
  const { stderr } = bad();
  assert.match(stderr, /\.answer: a card with parts carries answers on the parts/);
  // The booklet's own lettering is authoritative — a question whose parts run c, d, e, f
  // because a and b sat in an earlier grid is correct — so what is checked is that the
  // letters ascend and do not repeat.
  assert.match(stderr, /\.parts\[1\]\.label: "a" does not come after "a"/);
});

test('a card with no printed answer is accepted — the booklet is the source of truth', () => {
  // Requiring an answer made the transcription invent them: a drill cell such as
  // "Round to the nearest minute: 34° 40' 12''" prints none, because the student writes it.
  const { stderr } = bad();
  assert.ok(!/needs an "answer"/.test(stderr), stderr);
});

test('origin.lines past the end of the source file is an error', () => {
  assert.match(bad().stderr, /\.origin\.lines: end 9000 is past the end of the source file \(3 lines\)/);
});

test('unbalanced $ delimiters are caught by the shared rich-text lint', () => {
  assert.match(bad().stderr, /\.question_text: unbalanced \$ delimiters/);
});

test('an unknown block type and a bad identify verdict are errors', () => {
  const { stderr } = bad();
  assert.match(stderr, /\.type: must be one of syllabus, teach, .*got "mystery"/);
  assert.match(stderr, /\.exemplars\[0\]\.verdict: must be "yes" or "no", got "maybe"/);
});

test('tikz-plus-figure and markdown blocks are warnings, not errors', () => {
  const { stdout } = bad();
  assert.match(stdout, /⚠ .*sine-rule-sides-f4\): has both a \[tikz\] block and a figure\.png/);
  assert.match(stdout, /⚠ .*markdown block — content the parser could not classify/);
});

test('a section declared in bank.json with no files warns', () => {
  assert.match(bad().stdout, /⚠ .*section "ghost-section" is declared but has no cards or blocks file/);
});

// --- recipes -----------------------------------------------------------------

test('a recipe whose refs all resolve validates clean', () => {
  const { status, stdout } = run(['--bank-dir', fxGood, '--recipes', '--recipes-dir', recipesGood, '--bank-root', join('tests', 'fixtures', 'booklet')]);
  assert.equal(status, 0, stdout);
  assert.match(stdout, /1 recipe\(s\)/);
});

test('a recipe with a dangling card ref, an unknown alias and a bad variant tier fails', () => {
  const { status, stderr } = run(['--bank-dir', fxGood, '--recipes', '--recipes-dir', recipesBad, '--bank-root', join('tests', 'fixtures', 'booklet')]);
  assert.equal(status, 1);
  assert.match(stderr, /card "sine-rule-sides-f99" not found in bank "trig"/);
  assert.match(stderr, /unknown bank alias "nope"/);
  assert.match(stderr, /variants\.top\.tiers: "extension" is not one of/);
  assert.match(stderr, /must be exactly one of \{block\}, \{cards\}, \{atoms\}/);
});
