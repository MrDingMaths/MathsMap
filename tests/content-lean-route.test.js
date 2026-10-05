import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { runModel, runSkill, publishAccepted, checkCandidate, checkReview, changedItems, leanStatus, skillEvidence, normaliseRemovals, currencyProblems, applyFixes, reReviewScope, touchesDiagram } from '../scripts/content/lean-route.mjs';

const card = n => ({ question_text: `Calculate $${n}+2$.`, structure: 'add', solution_text: `$${n}+2$\n$=${n + 2}$` });
const question = (n, i) => ({ id: 'q' + (i + 1), ...card(n), mastery: false, options: [{ text: `$${n + 2}$`, correct: true }, { text: `$${n + 1}$`, why: 'Added one instead of two.' }, { text: `$${n}$`, why: 'Did not add the second number.' }] });
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mathsmap-lean-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, value) => { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value, null, 2)); };
  write('data/courses.json', [{ id: 's4', stage: 4, order: 1 }]);
  write('data/topics.json', [{ id: 't-s4-add', stage: 4, courses: ['s4'], order: 1 }]);
  write('data/dotpoints.json', [{ id: 'dp-add', topicId: 't-s4-add', text: 'Add numbers.', order: 1 }]);
  write('data/skills.json', [{ id: 'first', stage: 4, title: 'first', dotPointIds: ['dp-add'], prereqs: [] }]);
  const booklet = 'booklets/mathsmap-sources/Stage 4/Addition.md';
  write(booklet, '# Addition\n## Example\nCalculate $8+3$.\n$8+3=11$\nFoundation\n1. Calculate $4+2$.');
  write('booklets/provenance/content-campaign/test/skills/first.json', { skillId: 'first', scope: { stage: 4 }, sources: [{ path: booklet }] });
  const content = { skillId: 'first', atomType: 'T', theory: { intro: 'Add numbers.', facts: ['Addition combines quantities.'], workedExamples: [{ question_text: 'Calculate $8+3$.', solution_text: '$8+3$\n$=11$' }] }, practice: { foundation: [3, 4, 5].map(card), development: [6, 7, 8].map(card), masteryOmitted: 'This is one operation.', coverageNote: 'A narrow routine.' } };
  const quiz = { skillId: 'first', coverageNote: 'A narrow routine.', questions: [3, 4, 5].map(question) };
  write('public/content/first.json', content); write('public/quizzes/first.json', quiz);
  write('public/content-manifest.json', { content: { first: [3, 3, 0] }, quiz: { first: [3, 0] } });
  return { root, content, quiz };
}
const author = pair => ({ skillId: 'first', blocker: null, content: pair.content, quiz: pair.quiz, items: [...['foundation', 'development'].flatMap(tier => pair.content.practice[tier].map((_, i) => ({ where: `practice.${tier}[${i}]`, decision: 'kept', bookletQuestion: 'Foundation 1, line 6' }))), ...pair.quiz.questions.map(q => ({ where: 'quiz.' + q.id, decision: 'kept', bookletQuestion: 'Foundation 1, line 6' }))], removed: [], summary: 'Checked.' });
const reviewOf = candidate => ({ outcomes: [...['foundation', 'development'].flatMap(tier => candidate.content.practice[tier].map((_, i) => ({ where: `practice.${tier}[${i}]`, verdict: 'accepted', answer: 'sum', correctOption: null, bookletType: true, finding: '' }))), ...candidate.quiz.questions.map(q => ({ where: 'quiz.' + q.id, verdict: 'accepted', answer: 'sum', correctOption: 0, bookletType: true, finding: '' })), ...candidate.content.theory.workedExamples.map((_, i) => ({ where: `theory.workedExamples[${i}]`, verdict: 'accepted', answer: '11', correctOption: null, bookletType: null, finding: '' }))], theory: { verdict: 'accepted', finding: '' }, removals: [], summary: 'Agreed.' });

test('source budgets count the normalized numbered text actually supplied, including scoped ranges', t => {
  const { root } = fixture(t), booklet = 'booklets/mathsmap-sources/Stage 4/Addition.md';
  const lines = ['# Addition', '| x' + ' '.repeat(500000) + '|', '| ' + '-'.repeat(1000) + ' |', 'Calculate $4+2$.'];
  fs.writeFileSync(path.join(root, booklet), lines.join('\n'));
  assert.equal(skillEvidence(root, 'test', 'first').bytes, Buffer.byteLength('1: # Addition\n2: | x  |\n3: | ----- |\n4: Calculate $4+2$.'));
  assert.equal(skillEvidence(root, 'test', 'first', { path: booklet, start: 2, end: 3 }).bytes, Buffer.byteLength('2: | x  |\n3: | ----- |'));
  fs.writeFileSync(path.join(root, booklet), 'x'.repeat(450001));
  assert.ok(skillEvidence(root, 'test', 'first').bytes > 450000);
});

test('reviewer decisions must cover every item, confirm the booklet type and agree with the marked option', t => {
  const { content, quiz } = fixture(t), candidate = author({ content, quiz }), review = reviewOf(candidate);
  assert.deepEqual(checkReview(candidate, review), []);
  const wrongOption = structuredClone(review); wrongOption.outcomes.find(row => row.where === 'quiz.q2').correctOption = 1;
  assert.match(checkReview(candidate, wrongOption).join('\n'), /quiz\.q2: reviewer's correct option \(1\) disagrees/);
  const missing = structuredClone(review); missing.outcomes.pop();
  assert.match(checkReview(candidate, missing).join('\n'), /Review missing its own answer or verdict for theory\.workedExamples\[0\]/);
  const untyped = structuredClone(review); untyped.outcomes[0].bookletType = false;
  assert.match(checkReview(candidate, untyped).join('\n'), /did not confirm a booklet question type/);
});

test('an accepted change is published through the revision-safe transaction and an unchanged skill is not', async t => {
  const { root, content, quiz } = fixture(t);
  const unchanged = async ({ name }) => ({ result: name === 'author' ? author({ content, quiz }) : reviewOf(author({ content, quiz })), call: { name, seconds: 0, usage: null, error: null } });
  assert.equal((await runSkill(root, { campaignId: 'test', skillId: 'first', publish: true, model: unchanged })).status, 'accepted: no change needed');
  const next = structuredClone(content); next.practice.foundation[0] = card(9);
  assert.deepEqual(changedItems({ content, quiz }, { content: next, quiz }), { where: ['practice.foundation[0]'], theory: false });
  const changed = async ({ name }) => ({ result: name === 'author' ? author({ content: next, quiz }) : reviewOf(author({ content: next, quiz })), call: { name, seconds: 0, usage: null, error: null } });
  const record = await runSkill(root, { campaignId: 'test', skillId: 'first', publish: true, model: changed });
  assert.equal(record.status, 'published'); assert.equal(record.calls.length, 2);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'public/content/first.json'), 'utf8')).practice.foundation[0].question_text, 'Calculate $9+2$.');
  assert.deepEqual(leanStatus(root, 'test').counts, { published: 1 });
});

test('a reviewer finding gets one repair round with a scoped re-review, and an unrepaired skill is not published', async t => {
  const { root, content, quiz } = fixture(t);
  const bad = structuredClone(content); bad.practice.foundation[0] = { ...card(9), solution_text: '$9+2$\n$=12$' };
  const good = structuredClone(content); good.practice.foundation[0] = card(9);
  const seen = [];
  const model = async ({ name, prompt }) => {
    seen.push(name);
    if (name === 'author') return { result: author({ content: bad, quiz }), call: { name, seconds: 0 } };
    if (name === 'review') { const review = reviewOf(author({ content: bad, quiz })); Object.assign(review.outcomes[0], { verdict: 'repair', finding: 'Answer should be 11.' }); return { result: review, call: { name, seconds: 0 } }; }
    if (name === 'repair') { assert.match(prompt, /Answer should be 11/); return { result: author({ content: good, quiz }), call: { name, seconds: 0 } }; }
    assert.match(prompt, /each of these items only: practice\.foundation\[0\]/);
    return { result: { outcomes: [{ where: 'practice.foundation[0]', verdict: 'accepted', answer: '11', correctOption: null, bookletType: true, finding: '' }] }, call: { name, seconds: 0 } };
  };
  const record = await runSkill(root, { campaignId: 'test', skillId: 'first', publish: true, model });
  assert.deepEqual(seen, ['author', 'review', 'repair', 'review-scoped']); assert.equal(record.status, 'published'); assert.equal(record.repaired, true);

  const stuck = async ({ name }) => name === 'author' || name === 'repair' ? { result: author({ content: bad, quiz }), call: { name, seconds: 0 } } : { result: (() => { const review = reviewOf(author({ content: bad, quiz })); Object.assign(review.outcomes[0], { verdict: 'repair', finding: 'Answer should be 11.' }); return review; })(), call: { name, seconds: 0 } };
  const before = fs.readFileSync(path.join(root, 'public/content/first.json'), 'utf8');
  const held = await runSkill(root, { campaignId: 'test', skillId: 'first', publish: true, model: stuck });
  assert.match(held.status, /^needs attention/); assert.equal(fs.readFileSync(path.join(root, 'public/content/first.json'), 'utf8'), before);
});

const flagged = (candidate, finding = 'Answer should be 11.') => { const review = reviewOf(candidate); Object.assign(review.outcomes[0], { verdict: 'repair', finding }); return review; };
const withFirst = (content, value) => { const next = structuredClone(content); next.practice.foundation[0] = value; return next; };
const recordFile = root => path.join(root, 'booklets/provenance/content-campaign/test/lean/first.json');

test('removal rows that are not whole original items become notes, bare currency is caught, and fixes only replace existing text', t => {
  const { content, quiz } = fixture(t), baseline = { content, quiz };
  const tidy = normaliseRemovals(baseline, { ...author(baseline), removed: [{ where: 'theory.facts[0]', reason: 'Not taught.' }, { where: 'practice.foundation[1].question_text part (b)', reason: 'Off type.' }, { where: 'content.practice.foundation[2]', reason: 'Off type.' }] });
  assert.deepEqual(tidy.removed.map(row => row.where), ['practice.foundation[2]']);
  assert.deepEqual(tidy.editNotes.map(row => row.where), ['theory.facts[0]', 'practice.foundation[1].question_text part (b)']);
  const money = { content: withFirst(content, { ...card(9), question_text: 'A pen costs $9 and then you pay $2 more. Calculate $9+2$.' }), quiz };
  assert.match(currencyProblems(baseline, money).join('\n'), /^Format: content\.practice\.foundation\[0\]\.question_text: a bare \$/);
  assert.deepEqual(currencyProblems(baseline, { content: withFirst(content, { ...card(9), question_text: 'A pen costs $\\$9$. Calculate $9+2$ and write $\\text{total in dollars here}$.' }), quiz }), []);
  const patched = applyFixes(money, [{ path: 'content.practice.foundation[0].question_text', value: 'Fixed.' }, { path: 'content.practice.foundation', value: 'x' }, { path: 'quiz.questions[0].options[9].why', value: 'x' }, { path: 'content.practice.foundation[0].extra', value: 'x' }]);
  assert.equal(patched.applied, 1); assert.equal(patched.candidate.content.practice.foundation[0].question_text, 'Fixed.');
  assert.equal(money.content.practice.foundation[0].question_text.startsWith('A pen'), true);
});

test('a second review covers changed items and items the first review left open, and everything when the theory was open', t => {
  const { content, quiz } = fixture(t), reviewed = author({ content, quiz }), review = flagged(reviewed);
  const other = structuredClone(content); other.practice.foundation[1] = card(9);
  assert.deepEqual(reReviewScope(reviewed, author({ content: other, quiz }), review), ['practice.foundation[1]', 'practice.foundation[0]']);
  const theoryOpen = reviewOf(reviewed); theoryOpen.theory = { verdict: 'repair', finding: 'Qualify the definition.' };
  assert.equal(reReviewScope(reviewed, author({ content: other, quiz }), theoryOpen), null);
  assert.equal(reReviewScope(null, reviewed, null), null);
  assert.equal(touchesDiagram({ content, quiz }, { content: withFirst(content, { ...card(9), question_text: '[tikz]\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}[/tikz] Calculate $9+2$.' }), quiz }), true);
  assert.equal(touchesDiagram({ content, quiz }, { content: other, quiz }), false);
});

test('a formatting error gets its own fix call without the booklet and does not use up the repair round', async t => {
  const { root, content, quiz } = fixture(t);
  const text = 'A pen costs $\\$9$ and then you pay $\\$2$ more. Calculate $9+2$.';
  const bare = withFirst(content, { ...card(9), question_text: 'A pen costs $9 and then you pay $2 more. Calculate $9+2$.', solution_text: '$9+2$\n$=12$' });
  const wrong = withFirst(content, { ...bare.practice.foundation[0], question_text: text }), good = withFirst(content, { ...card(9), question_text: text });
  const seen = [];
  const model = async ({ name, prompt, images }) => {
    seen.push(name);
    if (name === 'author') return { result: author({ content: bare, quiz }), call: { name, seconds: 0 } };
    if (name === 'fix') { assert.deepEqual(images, []); assert.doesNotMatch(prompt, /===== BOOKLET/); assert.match(prompt, /Format: content\.practice\.foundation\[0\]\.question_text/); return { result: { fixes: [{ path: 'content.practice.foundation[0].question_text', value: text }] }, call: { name, seconds: 0 } }; }
    if (name === 'review') { assert.ok(prompt.includes(JSON.stringify(text).slice(1, -1))); return { result: flagged(author({ content: wrong, quiz })), call: { name, seconds: 0 } }; }
    if (name === 'repair') return { result: author({ content: good, quiz }), call: { name, seconds: 0 } };
    return { result: { outcomes: [{ where: 'practice.foundation[0]', verdict: 'accepted', answer: '11', correctOption: null, bookletType: true, finding: '' }] }, call: { name, seconds: 0 } };
  };
  const record = await runSkill(root, { campaignId: 'test', skillId: 'first', publish: true, model });
  assert.deepEqual(seen, ['author', 'fix', 'review', 'repair', 'review-scoped']); assert.equal(record.status, 'published'); assert.equal(record.calls.length, 5);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'public/content/first.json'), 'utf8')).practice.foundation[0].question_text, text);
});

test('resume repairs the retained candidate once, needs a full review where none covers it, and refuses a moved baseline', async t => {
  const { root, content, quiz } = fixture(t);
  const attempt = n => withFirst(content, { ...card(9), solution_text: `$9+2$\n$=${n}$` });
  const stuck = async ({ name }) => name === 'author' ? { result: author({ content: attempt(12), quiz }), call: { name, seconds: 1 } } : name === 'repair' ? { result: author({ content: attempt(13), quiz }), call: { name, seconds: 1 } } : { result: flagged(author({ content: attempt(name === 'review' ? 12 : 13), quiz })), call: { name, seconds: 1 } };
  const first = await runSkill(root, { campaignId: 'test', skillId: 'first', publish: true, model: stuck });
  assert.match(first.status, /^needs attention/); assert.deepEqual(first.calls.map(call => call.name), ['author', 'review', 'repair', 'review-scoped']);
  const never = async () => { throw new Error('no call expected'); };

  const live = path.join(root, 'public/content/first.json'), original = fs.readFileSync(live, 'utf8'), before = fs.readFileSync(recordFile(root), 'utf8');
  fs.writeFileSync(live, original + '\n');
  assert.match((await runSkill(root, { campaignId: 'test', skillId: 'first', resume: true, model: never })).status, /^not resumed: live content changed/);
  assert.equal(fs.readFileSync(recordFile(root), 'utf8'), before);
  fs.writeFileSync(live, original);

  const seen = [];
  const again = async ({ name, prompt }) => {
    seen.push(name);
    if (name === 'resume-review') { assert.match(prompt, /EVERY practice item/); return { result: flagged(author({ content: attempt(13), quiz })), call: { name, seconds: 1 } }; }
    if (name === 'resume-repair') { assert.match(prompt, /Answer should be 11/); return { result: author({ content: attempt(14), quiz }), call: { name, seconds: 1 } }; }
    return { result: flagged(author({ content: attempt(14), quiz })), call: { name, seconds: 1 } };
  };
  const second = await runSkill(root, { campaignId: 'test', skillId: 'first', publish: true, resume: true, model: again });
  assert.deepEqual(seen, ['resume-review', 'resume-repair', 'resume-review-scoped']); assert.match(second.status, /^needs attention/); assert.equal(second.resumed, true);
  assert.deepEqual(second.previousAttempts.map(entry => entry.calls.length), [4]);
  assert.match((await runSkill(root, { campaignId: 'test', skillId: 'first', resume: true, model: never })).status, /^not resumed: already resumed once/);
  assert.equal(fs.readFileSync(live, 'utf8'), original);
});

test('resume reuses a full review of the retained candidate and publishes once the reviewer accepts the repair', async t => {
  const { root, content, quiz } = fixture(t);
  const bare = withFirst(content, { ...card(9), question_text: 'Costs $9 and then pay $2 more. Calculate $9+2$.', solution_text: '$9+2$\n$=12$' }), wrong = withFirst(content, { ...card(9), solution_text: '$9+2$\n$=12$' }), good = withFirst(content, card(9));
  // The first run spends its repair round on a formatting error the fix call could not correct, so its first review comes last.
  const reply = name => name === 'author' ? author({ content: bare, quiz }) : name === 'fix' ? { fixes: [] } : name === 'repair' ? author({ content: wrong, quiz }) : flagged(author({ content: wrong, quiz }));
  // Like the real model runner, keep each result beside the working files; resume reads the review from there.
  const firstRun = async ({ name, dir }) => { const result = reply(name); fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify(result)); return { result, call: { name, seconds: 1 } }; };
  const first = await runSkill(root, { campaignId: 'test', skillId: 'first', publish: true, model: firstRun });
  assert.deepEqual(first.calls.map(call => call.name), ['author', 'fix', 'repair', 'review-full']); assert.match(first.status, /^needs attention/); assert.equal(first.fullReview.name, 'review-full');
  const seen = [];
  const resumeRun = async ({ name, prompt }) => {
    seen.push(name);
    if (name === 'resume-repair') { assert.match(prompt, /Answer should be 11/); return { result: author({ content: good, quiz }), call: { name, seconds: 1 } }; }
    assert.match(prompt, /each of these items only: practice\.foundation\[0\]/);
    return { result: { outcomes: [{ where: 'practice.foundation[0]', verdict: 'accepted', answer: '11', correctOption: null, bookletType: true, finding: '' }] }, call: { name, seconds: 1 } };
  };
  const record = await runSkill(root, { campaignId: 'test', skillId: 'first', publish: true, resume: true, model: resumeRun });
  assert.deepEqual(seen, ['resume-repair', 'resume-review-scoped']); assert.equal(record.status, 'published');
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'public/content/first.json'), 'utf8')).practice.foundation[0].solution_text, '$9+2$\n$=11$');
});

test('cited lines supply only their booklet section, with each image once and uncited suggestions named', async t => {
  const { root, content, quiz } = fixture(t);
  const booklet = 'booklets/mathsmap-sources/Stage 4/Sections.md', media = path.join(root, 'booklets/mathsmap-sources/Stage 4/media');
  fs.mkdirSync(media, { recursive: true }); for (const name of ['a.png', 'b.png', 'c.png']) fs.writeFileSync(path.join(media, name), name);
  fs.writeFileSync(path.join(root, booklet), ['# Intro', '![](media/a.png)', '# Target', 'Example of the target', '![](media/b.png)', '![](media/b.png)', 'Foundation', '# Later', '![](media/c.png)'].join('\n'));
  fs.writeFileSync(path.join(root, 'booklets/provenance/content-campaign/test/skills/first.json'), JSON.stringify({ skillId: 'first', scope: { stage: 4 }, stage: { sourceReview: [{ path: booklet, startLine: 4, endLine: 4 }] }, sources: [{ path: 'booklets/mathsmap-sources/Stage 4/Addition.md' }] }));
  const evidence = skillEvidence(root, 'test', 'first');
  assert.deepEqual(evidence.sections, [{ path: booklet, start: 3, end: 7 }]); assert.deepEqual(evidence.images.map(image => path.basename(image.file)), ['b.png']);
  assert.equal(evidence.duplicateImages, 1); assert.equal(evidence.omittedImages, 0); assert.deepEqual(evidence.unsupplied, ['booklets/mathsmap-sources/Stage 4/Addition.md']);
  assert.deepEqual(skillEvidence(root, 'test', 'first', { path: booklet, start: 8, end: 9 }).images.map(image => path.basename(image.file)), ['c.png']);
  let prompt = '';
  const model = async input => { if (input.name === 'author') prompt = input.prompt; return { result: input.name === 'author' ? author({ content, quiz }) : reviewOf(author({ content, quiz })), call: { name: input.name, seconds: 0 } }; };
  const record = await runSkill(root, { campaignId: 'test', skillId: 'first', model });
  assert.equal(record.status, 'accepted: no change needed'); assert.deepEqual(record.sections, evidence.sections);
  assert.match(prompt, /4: Example of the target/); assert.match(prompt, /lines 3-7 of 9/); assert.match(prompt, /Sections\.md: 1 Intro \| 3 Target \| 8 Later/); assert.match(prompt, /NOT supplied: Addition\.md/);
  assert.doesNotMatch(prompt, /9: !\[\]\(media\/c\.png\)/); assert.doesNotMatch(prompt, /===== BOOKLET booklets\/mathsmap-sources\/Stage 4\/Addition\.md/);
});

test('full review receives the original removed item, even when its locator is reused by the candidate', async t => {
  const { root, content, quiz } = fixture(t);
  const next = withFirst(content, card(9)), candidate = author({ content: next, quiz });
  candidate.removed = [{ where: 'practice.foundation[0]', reason: 'Replaced an unsupported type.' }];
  const model = async ({ name, prompt }) => {
    if (name === 'author') return { result: candidate, call: { name, seconds: 0 } };
    const originals = prompt.split('Original items named in removals (compare each original task with the booklet before agreeing):\n')[1].split('\n')[0];
    assert.deepEqual(JSON.parse(originals), [{ where: 'practice.foundation[0]', value: content.practice.foundation[0] }]);
    const review = reviewOf(candidate); review.removals = [{ where: 'practice.foundation[0]', agree: true, finding: '' }];
    return { result: review, call: { name, seconds: 0 } };
  };
  const record = await runSkill(root, { campaignId: 'test', skillId: 'first', publish: false, model });
  assert.equal(record.status, 'accepted: not published (run with --publish)');
  delete record.fullReview.originalRemovalsSupplied;
  fs.writeFileSync(recordFile(root), JSON.stringify(record));
  await assert.rejects(publishAccepted(root, { campaignId: 'test', skillId: 'first' }), /Original removed items were not supplied/);
  record.fullReview.originalRemovalsSupplied = true;
  record.calls[0].code = 1;
  fs.writeFileSync(recordFile(root), JSON.stringify(record));
  await assert.rejects(publishAccepted(root, { campaignId: 'test', skillId: 'first' }), /failed author worker call/);
  delete record.calls[0].code;
  fs.writeFileSync(recordFile(root), JSON.stringify(record));
  const published = await publishAccepted(root, { campaignId: 'test', skillId: 'first' });
  assert.equal(published.status, 'published');
  assert.equal(record.fullReview.originalRemovalsSupplied, true);
});

test('model calls isolate response files, reject failed workers and retain failure events and stdin errors', async t => {
  const { root } = fixture(t), dir = path.join(root, 'calls'); fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'author.raw.txt'), '{"stale":true}');
  const paths = [];
  const fake = (code, response, fail) => (_binary, args) => {
    const raw = args[args.indexOf('--output-last-message') + 1]; paths.push(raw);
    const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.stdin = new PassThrough(); child.kill = () => {};
    child.stdin.once('finish', () => {
      if (response) fs.writeFileSync(raw, JSON.stringify(response));
      if (fail) {
        child.stdin.emit('error', new Error('write EOF'));
        child.stdout.write(JSON.stringify({ type: 'turn.failed', error: { message: 'stream disconnected' } }));
      }
      child.emit('close', code);
    });
    return child;
  };
  const invoke = spawnProcess => runModel({ root, dir, name: 'author', images: [], prompt: 'Test.', spawnProcess });
  const failed = await invoke(fake(1, null, true));
  assert.equal(failed.result, null); assert.match(failed.call.error, /stream disconnected/); assert.match(failed.call.error, /stdin: write EOF/);
  assert.equal((await invoke(fake(0, null, false))).result, null);
  assert.equal((await invoke(fake(1, { fresh: true }, false))).result, null);
  assert.deepEqual((await invoke(fake(0, { fresh: true }, false))).result, { fresh: true });
  assert.equal(new Set(paths).size, 4); assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'author.raw.txt'), 'utf8')).stale, true);
});

test('image paths containing commas are attached as byte-identical isolated copies', async t => {
  const { root } = fixture(t), dir = path.join(root, 'calls'); fs.mkdirSync(dir);
  const original = path.join(root, 'Vector Representation, notation.png'), bytes = Buffer.from([137, 80, 78, 71]); fs.writeFileSync(original, bytes);
  const spawnProcess = (_binary, args) => {
    const attached = args[args.indexOf('--image') + 1];
    assert.ok(!attached.includes(',')); assert.notEqual(attached, original); assert.deepEqual(fs.readFileSync(attached), bytes);
    assert.deepEqual(fs.readFileSync(original), bytes);
    const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.stdin = new PassThrough();
    child.stdin.once('finish', () => { fs.writeFileSync(args[args.indexOf('--output-last-message') + 1], '{"attached":true}'); child.emit('close', 0); });
    return child;
  };
  assert.deepEqual((await runModel({ root, dir, name: 'author', images: [original], prompt: 'Test.', spawnProcess })).result, { attached: true });
});

test('explicit maintenance repairs a retained diagram hold, reviews the full result and preserves baseline guards', async t => {
  const { root, content, quiz } = fixture(t);
  const diagram = '[tikz]\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}[/tikz]';
  const firstCandidate = author({ content: withFirst(content, { ...card(9), question_text: diagram + ' Calculate $9+2$.' }), quiz });
  const initial = async ({ name }) => ({ result: name === 'author' ? firstCandidate : reviewOf(firstCandidate), call: { name, seconds: 1 } });
  const held = await runSkill(root, { campaignId: 'test', skillId: 'first', model: initial });
  assert.equal(held.status, 'accepted: held for diagram check');
  const before = fs.readFileSync(recordFile(root), 'utf8');
  const noFindings = await runSkill(root, { campaignId: 'test', skillId: 'first', repair: true, model: async () => { throw new Error('no call expected'); } });
  assert.match(noFindings.status, /requires findings/); assert.equal(fs.readFileSync(recordFile(root), 'utf8'), before);
  const live = path.join(root, 'public/content/first.json'), original = fs.readFileSync(live, 'utf8');
  fs.writeFileSync(live, original + '\n');
  const never = async () => { throw new Error('no call expected'); };
  assert.match((await runSkill(root, { campaignId: 'test', skillId: 'first', repair: true, finding: 'Fix spacing.', model: never })).status, /live content changed/);
  assert.equal(fs.readFileSync(recordFile(root), 'utf8'), before);
  fs.writeFileSync(live, original);
  const candidate = author({ content: withFirst(content, card(9)), quiz }), names = [];
  const repairModel = async ({ name, prompt }) => {
    names.push(name);
    if (name === 'maintenance-repair') { assert.match(prompt, /Fix spacing/); return { result: candidate, call: { name, seconds: 1 } }; }
    assert.match(prompt, /canonical final locators/); assert.match(prompt, /EVERY practice item/);
    return { result: reviewOf(candidate), call: { name, seconds: 1 } };
  };
  const fixed = await runSkill(root, { campaignId: 'test', skillId: 'first', repair: true, finding: 'Fix spacing.', publish: true, model: repairModel });
  assert.equal(fixed.status, 'published'); assert.deepEqual(names, ['maintenance-repair', 'maintenance-review']);
  assert.equal(fixed.previousAttempts[0].calls.length, 2);
});

test('maintenance permits an explicitly requested further repair but never publishes outstanding review findings', async t => {
  const { root, content, quiz } = fixture(t), candidate = author({ content: withFirst(content, card(9)), quiz });
  const stuck = async ({ name }) => ({ result: /author|repair/.test(name) ? candidate : flagged(candidate), call: { name, seconds: 1 } });
  const first = await runSkill(root, { campaignId: 'test', skillId: 'first', model: stuck });
  first.resumed = true; fs.writeFileSync(recordFile(root), JSON.stringify(first));
  const names = [];
  const repairModel = async input => { names.push(input.name); return stuck(input); };
  const result = await runSkill(root, { campaignId: 'test', skillId: 'first', repair: true, publish: true, model: repairModel });
  assert.match(result.status, /^needs attention/); assert.deepEqual(names, ['maintenance-repair', 'maintenance-review']);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'public/content/first.json'), 'utf8')).practice.foundation[0].question_text, content.practice.foundation[0].question_text);
});

test('source exceptions are limited to the approved skills and require explicit syllabus citations and independent confirmation', async t => {
  const { root, content, quiz } = fixture(t), candidate = author({ content, quiz }), review = reviewOf(candidate);
  await assert.rejects(runSkill(root, { campaignId: 'test', skillId: 'first', sourceException: true }), /No approved source exception/);
  assert.match(checkCandidate(root, 'first', { content, quiz }, candidate, true).join('\n'), /explicit syllabus source exception/);
  for (const row of candidate.items) { row.sourceException = true; row.bookletQuestion = 'User-approved exception: syllabus/Stage 3 Content.md line 580.'; }
  assert.deepEqual(checkCandidate(root, 'first', { content, quiz }, candidate, true), []);
  for (const row of review.outcomes) row.bookletType = false;
  assert.match(checkReview(candidate, review, null, true).join('\n'), /independently confirm/);
  for (const row of review.outcomes) row.sourceExceptionConfirmed = true;
  assert.deepEqual(checkReview(candidate, review, null, true), []);
  assert.match(checkReview(candidate, review).join('\n'), /booklet question type/);
});

test('an approved exception run supplies the syllabus, records its approval and rejects changed syllabus at publication', async t => {
  const { root, content, quiz } = fixture(t), skillId = 'add-subtract-decimals';
  content.skillId = skillId; quiz.skillId = skillId;
  fs.writeFileSync(path.join(root, 'public/content', skillId + '.json'), JSON.stringify(content));
  fs.writeFileSync(path.join(root, 'public/quizzes', skillId + '.json'), JSON.stringify(quiz));
  fs.writeFileSync(path.join(root, 'data/skills.json'), JSON.stringify([{ id: skillId, stage: 3, title: skillId, dotPointIds: ['dp-add'], prereqs: [] }]));
  fs.mkdirSync(path.join(root, 'syllabus')); const syllabus = path.join(root, 'syllabus/Stage 3 Content.md');
  fs.writeFileSync(syllabus, '# Stage 3\nAdd and subtract decimals.');
  const candidate = author({ content: withFirst(content, card(9)), quiz });
  for (const row of candidate.items) { row.sourceException = true; row.bookletQuestion = 'Approved exception: syllabus/Stage 3 Content.md line 2.'; }
  const review = reviewOf(candidate); for (const row of review.outcomes) { row.bookletType = false; row.sourceExceptionConfirmed = true; }
  const model = async ({ name, prompt, images }) => {
    assert.match(prompt, /USER-APPROVED SOURCE EXCEPTION/); assert.match(prompt, /2: Add and subtract decimals/); assert.deepEqual(images, []);
    return { result: name === 'author' ? candidate : review, call: { name, seconds: 1 } };
  };
  const record = await runSkill(root, { campaignId: 'test', skillId, sourceException: true, model });
  assert.equal(record.status, 'accepted: not published (run with --publish)');
  assert.equal(record.fullReview.sourceExceptionConfirmed, true); assert.match(record.sourceException.reason, /User approved/);
  fs.writeFileSync(syllabus, '# Changed syllabus');
  await assert.rejects(publishAccepted(root, { campaignId: 'test', skillId }), /current syllabus/);
});
