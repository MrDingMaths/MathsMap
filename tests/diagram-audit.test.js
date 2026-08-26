// Wave 3 diagram-audit lane units: placeholder substitution, block-index splice,
// field addressing, seeded sampling stability, and the sibling lint bridge (skipped when
// the MathsDatabase checkout is absent).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  substituteTikz, replaceTikzBlock, fieldAccessor, seededRandom, MATHSDATABASE_ROOT, siblingImport,
} from '../scripts/diagram-audit/lib/audit-lib.mjs';

const TEXT = 'Before [tikz]\\draw (0,0) -- (1,1);[/tikz] middle [tikz]\\node at (0,0) {x};[/tikz] after';

test('substituteTikz numbers placeholders and extracts bodies in order', () => {
  const { substituted, blocks } = substituteTikz(TEXT);
  assert.equal(blocks.length, 2);
  assert.match(blocks[0], /draw \(0,0\)/);
  assert.equal(substituted, 'Before [diagram 1: see attached PNG] middle [diagram 2: see attached PNG] after');
});

test('replaceTikzBlock replaces exactly the addressed block', () => {
  const next = replaceTikzBlock(TEXT, 1, 'NEW');
  assert.match(next, /draw \(0,0\)/);           // block 0 untouched
  assert.match(next, /\[tikz\]NEW\[\/tikz\]/);  // block 1 replaced
  assert.doesNotMatch(next, /node at/);
  assert.throws(() => replaceTikzBlock(TEXT, 5, 'X'), /no \[tikz\] block at index 5/);
});

test('fieldAccessor resolves practice tier[idx].field and quiz qid.field addresses', () => {
  const content = { practice: { development: [{ question_text: 'a' }, { question_text: 'b' }] } };
  const acc = fieldAccessor(content, 'development[1].question_text');
  assert.equal(acc.get(), 'b');
  acc.set('B');
  assert.equal(content.practice.development[1].question_text, 'B');

  const quiz = { questions: [{ id: 'q7', solution_text: 's' }] };
  const qacc = fieldAccessor(quiz, 'q7.solution_text');
  assert.equal(qacc.get(), 's');
  qacc.set('S');
  assert.equal(quiz.questions[0].solution_text, 'S');

  assert.throws(() => fieldAccessor(content, 'mastery[0].question_text'), /no practice item/);
});

test('seededRandom is deterministic per seed', () => {
  const a = seededRandom('W3-2');
  const b = seededRandom('W3-2');
  const c = seededRandom('W3-3');
  const seqA = [a(), a(), a()];
  const seqB = [b(), b(), b()];
  assert.deepEqual(seqA, seqB);
  assert.notDeepEqual(seqA, [c(), c(), c()]);
});

const siblingPresent = fs.existsSync(MATHSDATABASE_ROOT);
test('sibling lint bridge flags caret-exponent on a fixture block', { skip: !siblingPresent && 'MathsDatabase checkout not present' }, async () => {
  const { lintBlock } = await siblingImport('tools/tikz-audit/lib/rules.mjs');
  const bad = '\\begin{axis}[xmin=0,xmax=4,ymin=0,ymax=20]\n\\addplot[domain=0:4] {2^x};\n\\end{axis}';
  const findings = lintBlock(bad);
  assert.ok(findings.some(f => /caret/i.test(f.rule || f.id || JSON.stringify(f))), `expected a caret-exponent finding, got ${JSON.stringify(findings)}`);
});
