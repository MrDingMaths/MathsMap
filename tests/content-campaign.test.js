import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { publishSkill } from '../scripts/content/publication.mjs';
import { captureCampaignDiagrams, finalizeCampaignDiagrams, rebindCampaignRenderReceipt, verifyCampaignRenderReceipt, pngCrc32, pngDimensions } from '../scripts/content/campaign-visual-evidence.mjs';
import { initCampaign, readCampaign, readSkill, nextAssignment, prepareAssignment, stageAssignment, recordReview, recordReviewProfile, recordVisualReview, capturePair, assessmentItems, hashValue, statusCampaign, reconcileBaselineItems, recoverCampaignPublication, publishAssignment, receiptCampaign, claimCoordinator, recordPaidCallCheckpoint, requestRepair, loadPreviousReview } from '../scripts/content/campaign-support.mjs';
import { runCampaign, normalizeWorkerResult, inlineEvidencePrompt } from '../scripts/content/campaign-runner.mjs';
import { createSourcePreparer } from '../scripts/content/campaign-source-dispatch.mjs';
import { validateCandidatePair } from '../scripts/validate.mjs';
import { validateUnavailableImages, validateSourceImages, unavailableImageDecisionHash, scopeDependencies } from '../scripts/content/campaign-sources.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mathsmap-campaign-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, value) => { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
  write('data/courses.json', [{ id: 's4', stage: 4, order: 1 }]);
  write('data/topics.json', [{ id: 't-s4-add', stage: 4, courses: ['s4'], order: 1 }]);
  write('data/dotpoints.json', [{ id: 'dp-add', topicId: 't-s4-add', text: 'Add numbers.', order: 1 }]);
  write('data/skills.json', ['first', 'combinations-nCr', 'excluded'].map(id => ({ id, stage: 4, title: id, dotPointIds: ['dp-add'], prereqs: [] })));
  const sourcePath = 'booklets/mathsmap-sources/Stage 4/Addition.md';
  write(sourcePath, '# Addition\n## Example\nCalculate $8+3$.\n$8+3=11$');
  write('scripts/agy/batches/done/test.json', { sections: [{ name: 'addition', skillIds: ['first', 'combinations-nCr'], bookletPaths: [sourcePath] }] });
  const card = n => ({ question_text: `Calculate $${n}+2$.`, structure: 'add', solution_text: `$${n}+2$\n$=${n + 2}$` });
  for (const skillId of ['first', 'combinations-nCr']) {
    const content = { skillId, atomType: 'T', theory: { intro: 'Add numbers.', facts: ['Addition combines quantities.'] }, practice: { foundation: [3, 4, 5].map(card), development: [6, 7, 8].map(card), masteryOmitted: 'This is one operation.', coverageNote: 'A narrow routine.' } };
    const quiz = { skillId, coverageNote: 'A narrow routine.', questions: [3, 4, 5].map((n, i) => ({ id: 'q' + (i + 1), ...card(n), mastery: false, options: [{ text: `$${n + 2}$`, correct: true }, { text: `$${n + 1}$`, why: 'Added one instead of two.' }, { text: `$${n}$`, why: 'Did not add the second number.' }] })) };
    write('public/content/' + skillId + '.json', content); write('public/quizzes/' + skillId + '.json', quiz);
  }
  write('public/content-manifest.json', { content: { first: [3, 3, 0], 'combinations-nCr': [3, 3, 0] }, quiz: { first: [3, 0], 'combinations-nCr': [3, 0] } });
  initCampaign(root, { campaignId: 'test', expectedSkills: 2, expectedExcluded: 1 });
  return { root, write, sourcePath };
}
test('new preparations capture the source metadata profile while legacy prepared resumes and reprepares retain no profile', t => {
  const {root,write}=fixture(t);nextAssignment(root,{campaignId:'test',workerId:'owner',ids:['first']});
  const fresh=prepareAssignment(root,{campaignId:'test',skillId:'first',workerId:'owner'});
  assert.equal(fresh.boundedContextProfile,'source-metadata-refs-v1');assert.equal(readSkill(root,'test','first').owner.prepared.boundedContextProfile,fresh.boundedContextProfile);
  const legacy=readSkill(root,'test','first');delete legacy.owner.prepared.boundedContextProfile;write('booklets/provenance/content-campaign/test/skills/first.json',legacy);
  claimCoordinator(root,{campaignId:'test',skillId:'first',workerId:'owner',runId:'legacy-resume'});
  recordPaidCallCheckpoint(root,{campaignId:'test',skillId:'first',workerId:'owner',runId:'legacy-resume'});
  const captured=structuredClone(readSkill(root,'test','first').owner.prepared),resumed=prepareAssignment(root,{campaignId:'test',skillId:'first',workerId:'owner'});
  assert.equal(resumed.boundedContextProfile,undefined);assert.deepEqual(readSkill(root,'test','first').owner.prepared,captured);
  const reprepare=prepareAssignment(root,{campaignId:'test',skillId:'first',workerId:'owner',sources:captured.sources});
  assert.equal(reprepare.boundedContextProfile,undefined);assert.equal(readSkill(root,'test','first').owner.prepared.boundedContextProfile,undefined);
});

function renderedPngFixture() {
  const header = Buffer.alloc(13); header.writeUInt32BE(2, 0); header.writeUInt32BE(2, 4); header[8] = 8; header[9] = 6;
  const pixels = Buffer.from([0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 255, 255, 255, 255, 0, 0, 0, 255]);
  const chunk = (name, value) => { const data = Buffer.concat([Buffer.from(name), value]), size = Buffer.alloc(4), crc = Buffer.alloc(4); size.writeUInt32BE(value.length); crc.writeUInt32BE(pngCrc32(data)); return Buffer.concat([size, data, crc]); };
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
function authorPayload(root, sourcePath, skillId = 'first') {
  const pair = capturePair(root, skillId), content = pair.content;
  content.theory.workedExamples = [{ question_text: 'Calculate $8+3$.', solution_text: '$8+3$\n$=11$' }];
  return { candidateContent: content, candidateQuiz: pair.quiz, coverage: { methods: [{ id: 'add', description: 'Add two numbers.', sourceRefs: [0] }], items: assessmentItems(content, pair.quiz).filter(item => item.kind !== 'theory').map(item => ({ where: item.where, methods: ['add'] })) }, sourceReview: [{ path: sourcePath, locator: 'Example, lines 2–4', support: 'direct', observation: 'The source adds quantities directly.', adjustments: 'Different numbers retain the taught addition method.' }], removals: [], substantiveCorrections: [] };
}
function reviewPayload(root, state) {
  const candidate = JSON.parse(fs.readFileSync(path.join(root, state.stage.candidatePath)));
  return { outcomes: assessmentItems(candidate.content, candidate.quiz).filter(item => item.kind !== 'theory').map(item => ({ where: item.where, verdict: 'accepted', independentSolution: item.value.solution_text, observation: 'Addition agrees with the task and scope.', ...(item.kind === 'quiz' ? { options: item.value.options.map(option => ({ mathematicallyCorrect: option.correct === true, observation: 'Checked the displayed number against the independently derived sum.' })) } : {}) })), theoryObservation: 'The stated addition rule supports all items.', sourceObservation: 'The source teaches this method and uses this language.', findings: [] };
}

test('explicit empty source adjustments normalize honestly while invalid or missing records still fail', t => {
  const {root,sourcePath}=fixture(t);
  nextAssignment(root,{campaignId:'test',workerId:'author',ids:['first']});prepareAssignment(root,{campaignId:'test',workerId:'author',skillId:'first'});
  const state=readSkill(root,'test','first'),raw=authorPayload(root,sourcePath);raw.sourceReview[0].adjustments=[];
  const original=structuredClone(raw),normalized=normalizeWorkerResult(root,state,raw);
  assert.equal(normalized.sourceReview[0].adjustments,'No source adjustments were recorded.');
  assert.deepEqual(raw,original,'normalization must leave the actual author receipt untouched');
  assert.deepEqual(normalized.candidateContent,raw.candidateContent);assert.deepEqual(normalized.candidateQuiz,raw.candidateQuiz);
  assert.deepEqual(normalized.coverage.methods,raw.coverage.methods);assert.equal(normalized.sourceReview[0].observation,raw.sourceReview[0].observation);
  raw.sourceReview[0].adjustments=['Retain the source method.','Change only the numbers.'];
  assert.equal(normalizeWorkerResult(root,state,raw).sourceReview[0].adjustments,'Retain the source method.\nChange only the numbers.');
  for(const invalid of [[''],['  '],['Valid',5],[null],5,null,{},undefined,'']) {
    const malformed=structuredClone(raw);if(invalid===undefined)delete malformed.sourceReview[0].adjustments;else malformed.sourceReview[0].adjustments=invalid;
    assert.throws(()=>normalizeWorkerResult(root,state,malformed),/Source adjustments/);
  }
  raw.sourceReview[0].adjustments=[];raw.sourceReview[0].hash='wrong';
  assert.throws(()=>normalizeWorkerResult(root,state,raw),/Supplied wrong hash/,'an explicit empty list cannot bypass source-byte binding');
});

test('actual millions and absolute-error source adjustment records preserve every source decision and pair field', t => {
  const {root,write,sourcePath}=fixture(t),repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  nextAssignment(root,{campaignId:'test',workerId:'author',ids:['first']});prepareAssignment(root,{campaignId:'test',workerId:'author',skillId:'first'});
  const originalState=readSkill(root,'test','first');
  const cases=JSON.parse(fs.readFileSync(path.join(repo,'tests/fixtures/content-campaign/empty-source-adjustments.json')));
  assert.deepEqual(cases.map(entry=>entry.skillId),['name-millions-place-value','absolute-error']);
  for(const actual of cases) {
    for(const ref of actual.sourceReview){const bytes=fs.readFileSync(path.join(repo,ref.path));assert.equal(hashValue(bytes),ref.hash);write(ref.path,bytes.toString('utf8'));}
    const state=structuredClone(originalState);state.owner.prepared.sources=structuredClone(actual.sourceReview);
    const raw=authorPayload(root,sourcePath);raw.sourceReview=structuredClone(actual.sourceReview);const original=structuredClone(raw);
    const normalized=normalizeWorkerResult(root,state,raw);
    assert.deepEqual(raw,original);assert.deepEqual(normalized.candidateContent,raw.candidateContent);assert.deepEqual(normalized.candidateQuiz,raw.candidateQuiz);
    assert.deepEqual(normalized.coverage.methods,raw.coverage.methods);assert.deepEqual(normalized.substantiveCorrections,raw.substantiveCorrections);
    actual.sourceReview.forEach((ref,index)=>{
      const expected=ref.adjustments.length?ref.adjustments.join('\n'):'No source adjustments were recorded.';
      assert.equal(normalized.sourceReview[index].adjustments,expected);
      for(const key of Object.keys(ref).filter(key=>key!=='adjustments'))assert.deepEqual(normalized.sourceReview[index][key],ref[key],actual.skillId+' '+key);
    });
  }
});
function stage(root, sourcePath) {
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] }); prepareAssignment(root, { campaignId: 'test', workerId: 'author', skillId: 'first' });
  let state = readSkill(root, 'test', 'first');
  stageAssignment(root, { ...normalizeWorkerResult(root, state, authorPayload(root, sourcePath)), campaignId: 'test', workerId: 'author', skillId: 'first' });
  nextAssignment(root, { campaignId: 'test', workerId: 'reviewer', ids: ['first'], role: 'review' }); prepareAssignment(root, { campaignId: 'test', workerId: 'reviewer', skillId: 'first' });
  return readSkill(root, 'test', 'first');
}

function syllabusGapFixture(write) {
  const sourcePath = 'syllabus/Stage 3 Content.md', imagePath = 'syllabus/media/addition.png';
  write(sourcePath, '# Addition\n![Quantity illustration](media/addition.png)\nThe illustration shows eight counters with three more counters, making eleven counters.');
  return { path: sourcePath, startLine: 1, endLine: 3, locator: 'Addition illustration and complete long description', support: 'direct', unavailableImages: [{ path: imagePath, nonessential: true, reason: 'This syllabus illustration repeats the complete counter description; original booklet addition working is supplied separately.', textAlternative: 'Eight counters with three more counters make eleven counters.', textAlternativeLocator: { path: sourcePath, startLine: 3, endLine: 3, locator: 'Complete counter description' }, matchingBookletStyle: [], decisionStatus: 'candidate-gap-decision-requiring-independent-review' }] };
}

test('final source sections cannot introduce undeclared missing figures after preparation', t => {
  const { root, write, sourcePath } = fixture(t);
  write(sourcePath, '# Addition\n## Example\nCalculate $8+3$.\n$8+3=11$\n![Required figure](missing.png)');
  const additional = 'booklets/mathsmap-sources/Stage 4/Additional.md';
  write(additional, '# Additional example\n![Required geometry](missing.png)');
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] });
  prepareAssignment(root, { campaignId: 'test', workerId: 'author', skillId: 'first', sources: [{ path: sourcePath, startLine: 1, endLine: 4, locator: 'Complete addition example' }] });
  const state = readSkill(root, 'test', 'first');
  const payload = normalizeWorkerResult(root, state, authorPayload(root, sourcePath));
  for (const ref of [
    { ...payload.sourceReview[0], startLine: 1, endLine: 5 },
    { ...payload.sourceReview[0], path: additional, hash: hashValue(fs.readFileSync(path.join(root, additional))), startLine: 1, endLine: 2 }
  ]) for (const images of [undefined, []]) {
    const altered = structuredClone(payload); altered.sourceReview.push({ ...ref, images });
    assert.throws(() => normalizeWorkerResult(root, state, altered), /Relevant source image missing/);
    assert.throws(() => stageAssignment(root, { ...altered, campaignId: 'test', workerId: 'author', skillId: 'first' }), /Relevant source image missing/);
  }
  assert.equal(readSkill(root, 'test', 'first').stage, undefined);
});

test('empty image lists are restored to exact linked hashes and changes block publication', async t => {
  const { root, write, sourcePath } = fixture(t);
  const imagePath = 'booklets/mathsmap-sources/Stage 4/media/counters.png';
  const raw = '# Addition\n## Example\nCalculate $8+3$.\n$8+3=11$\n![Counters](media/counters.png)';
  write(sourcePath, raw); write(imagePath, 'original counter image');
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] });
  prepareAssignment(root, { campaignId: 'test', workerId: 'author', skillId: 'first', sources: [{ path: sourcePath, locator: 'Addition example and counters' }] });
  let state = readSkill(root, 'test', 'first');
  const rawPayload = authorPayload(root, sourcePath); rawPayload.sourceReview[0].images = [];
  const payload = normalizeWorkerResult(root, state, rawPayload);
  const expected = [{ path: imagePath, hash: hashValue('original counter image') }];
  assert.deepEqual(payload.sourceReview[0].images, expected);
  assert.deepEqual(rawPayload.sourceReview[0].images, [], 'raw worker evidence remains unchanged');
  const stale = structuredClone(payload); stale.sourceReview[0].images[0].hash = 'wrong';
  assert.throws(() => normalizeWorkerResult(root, state, stale), /Stale source image/);
  assert.throws(() => stageAssignment(root, { ...stale, campaignId: 'test', workerId: 'author', skillId: 'first' }), /Stale source image/);
  payload.sourceReview[0].images = []; // Direct staging must bind independently of normalization.
  stageAssignment(root, { ...payload, campaignId: 'test', workerId: 'author', skillId: 'first' });
  state = readSkill(root, 'test', 'first'); assert.deepEqual(state.stage.sourceReview[0].images, expected);
  assert.throws(() => validateSourceImages(root, { path: sourcePath, images: [] }, { requireBound: true }), /staged hash/);
  nextAssignment(root, { campaignId: 'test', workerId: 'reviewer', ids: ['first'], role: 'review' });
  prepareAssignment(root, { campaignId: 'test', workerId: 'reviewer', skillId: 'first' }); state = readSkill(root, 'test', 'first');
  recordReview(root, { ...normalizeWorkerResult(root, state, reviewPayload(root, state)), campaignId: 'test', workerId: 'reviewer', skillId: 'first' });
  write(imagePath, 'changed counter image');
  let published = false;
  await assert.rejects(publishAssignment(root, { campaignId: 'test', skillId: 'first', publisher: async () => { published = true; } }), /Stale source\/scope/);
  assert.equal(published, false);
});

test('one justified syllabus gap never waives a second undeclared figure', t => {
  const { root, write } = fixture(t), ref = syllabusGapFixture(write);
  write(ref.path, '# Addition\n![Quantity illustration](media/addition.png)\nThe illustration shows eight counters with three more counters, making eleven counters.\n![Required second figure](media/required.png)');
  ref.endLine = 4;
  assert.throws(() => validateSourceImages(root, ref), /Relevant source image missing.*required\.png/);
});

test('exact prepared sections retain supplemental images outside their Markdown span', async t => {
  const { root, write, sourcePath } = fixture(t);
  const imagePath = 'booklets/mathsmap-sources/Stage 4/media/supplemental.png';
  write(imagePath, 'prepared supplemental diagram');
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] });
  prepareAssignment(root, { campaignId: 'test', workerId: 'author', skillId: 'first', sources: [{ path: sourcePath, startLine: 2, endLine: 4, locator: 'Example with supplemental diagram', images: [{ path: imagePath }] }] });
  let state = readSkill(root, 'test', 'first');
  const original = authorPayload(root, sourcePath);
  Object.assign(original.sourceReview[0], { startLine: 2, endLine: 4, images: [] });
  const payload = normalizeWorkerResult(root, state, original);
  const expected = [{ path: imagePath, hash: hashValue('prepared supplemental diagram') }];
  assert.deepEqual(payload.sourceReview[0].images, expected);
  assert.deepEqual(original.sourceReview[0].images, []);
  const conflicting = structuredClone(payload); conflicting.sourceReview[0].images[0].hash = 'wrong';
  assert.throws(() => normalizeWorkerResult(root, state, conflicting), /Stale source image/);
  assert.throws(() => stageAssignment(root, { ...conflicting, campaignId: 'test', workerId: 'author', skillId: 'first' }), /Stale source image/);
  const differentSpan = structuredClone(original); differentSpan.sourceReview[0].startLine = 1;
  assert.deepEqual(normalizeWorkerResult(root, state, differentSpan).sourceReview[0].images, [], 'supplemental evidence belongs to its exact prepared section');
  delete differentSpan.sourceReview[0].images;
  assert.deepEqual(normalizeWorkerResult(root, state, differentSpan).sourceReview[0].images, [], 'an omitted list does not inherit another span\'s supplemental images');
  payload.sourceReview[0].images = [];
  stageAssignment(root, { ...payload, campaignId: 'test', workerId: 'author', skillId: 'first' });
  state = readSkill(root, 'test', 'first'); assert.deepEqual(state.stage.sourceReview[0].images, expected);
  nextAssignment(root, { campaignId: 'test', workerId: 'reviewer', ids: ['first'], role: 'review' });
  prepareAssignment(root, { campaignId: 'test', workerId: 'reviewer', skillId: 'first' }); state = readSkill(root, 'test', 'first');
  recordReview(root, { ...normalizeWorkerResult(root, state, reviewPayload(root, state)), campaignId: 'test', workerId: 'reviewer', skillId: 'first' });
  write(imagePath, 'changed supplemental diagram');
  let published = false;
  await assert.rejects(publishAssignment(root, { campaignId: 'test', skillId: 'first', publisher: async () => { published = true; } }), /Stale source\/scope/);
  assert.equal(published, false);
});

test('missing images require exact per-reference nonessential syllabus declarations and remain inline', t => {
  const { root, write, sourcePath } = fixture(t), ref = syllabusGapFixture(write);
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] });
  assert.throws(() => prepareAssignment(root, { campaignId: 'test', workerId: 'author', skillId: 'first', sources: [{ ...ref, unavailableImages: [] }] }), /source image missing/);
  for (const field of ['reason', 'textAlternative', 'nonessential']) {
    const broken = structuredClone(ref); delete broken.unavailableImages[0][field];
    assert.throws(() => validateUnavailableImages(root, broken), /explicit nonessential/);
  }
  const unrelated = structuredClone(ref); unrelated.unavailableImages[0].path = 'syllabus/media/another.png';
  assert.throws(() => validateUnavailableImages(root, unrelated), /not referenced/);
  write(sourcePath, '# Original booklet\n![Required geometry](missing.png)');
  assert.throws(() => validateUnavailableImages(root, { ...ref, path: sourcePath, unavailableImages: [{ ...ref.unavailableImages[0], path: 'booklets/mathsmap-sources/Stage 4/missing.png' }] }), /required source figures/);
  const prepared = prepareAssignment(root, { campaignId: 'test', workerId: 'author', skillId: 'first', sources: [ref] });
  const packet = JSON.parse(fs.readFileSync(path.join(root, prepared.packets[0].path)));
  assert.deepEqual(packet.sourceEvidence[0].unavailableImages, ref.unavailableImages);
  assert.equal(packet.sourceEvidence[0].images.length, 0);
  const dependencies = scopeDependencies(root, 'first', readSkill(root, 'test', 'first').scope, [ref]);
  assert.equal(dependencies.paths.find(row => row.path === ref.unavailableImages[0].path).hash, null);
  write(ref.unavailableImages[0].path, 'new illustration evidence');
  assert.notEqual(scopeDependencies(root, 'first', readSkill(root, 'test', 'first').scope, [ref]).hash, dependencies.hash);
  assert.throws(() => validateUnavailableImages(root, ref), /now exists/);
});

test('missing syllabus illustration requires explicit author and exhaustive independent acceptance', async t => {
  const { root, write, sourcePath } = fixture(t), ref = syllabusGapFixture(write);
  const source = { path: sourcePath, startLine: 1, endLine: 4, locator: 'Addition example' };
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] });
  prepareAssignment(root, { campaignId: 'test', workerId: 'author', skillId: 'first', sources: [source, ref] });
  let state = readSkill(root, 'test', 'first'), payload = authorPayload(root, sourcePath);
  Object.assign(payload.sourceReview[0], source);
  payload.sourceReview.push({ ...ref, observation: 'The complete syllabus description establishes the same quantities.', adjustments: 'The original booklet supplies actual worked notation.' });
  const stagePayload = () => ({ ...normalizeWorkerResult(root, state, payload), campaignId: 'test', workerId: 'author', skillId: 'first' });
  assert.throws(() => stageAssignment(root, stagePayload()), /explicitly accept/);
  payload.sourceReview[1].unavailableImages[0].accepted = true;
  payload.sourceReview[1].unavailableImages[0].observation = 'The stated counter quantities fully determine the addition; the absent illustration supplies no extra value or arrangement needed by these tasks.';
  stageAssignment(root, stagePayload());
  nextAssignment(root, { campaignId: 'test', workerId: 'reviewer', ids: ['first'], role: 'review' });
  prepareAssignment(root, { campaignId: 'test', workerId: 'reviewer', skillId: 'first' }); state = readSkill(root, 'test', 'first');
  const review = reviewPayload(root, state), record = value => recordReview(root, { ...normalizeWorkerResult(root, state, value), campaignId: 'test', workerId: 'reviewer', skillId: 'first' });
  assert.throws(() => record(review), /Every declared unavailable/);
  const gapReview = { sourceIndex: 1, imagePath: ref.unavailableImages[0].path, accepted: true, observation: 'Independently checked the complete counter description and original booklet addition; no figure-only givens are needed.' };
  assert.throws(() => normalizeWorkerResult(root, state, { ...review, sourceImageReviews: [{ ...gapReview, decisionHash: 'wrong' }] }), /hash/);
  record({ ...review, sourceImageReviews: [gapReview] }); state = readSkill(root, 'test', 'first');
  assert.equal(state.status, 'accepted');
  assert.equal(state.review.sourceImageReviews[0].decisionHash, unavailableImageDecisionHash(ref.unavailableImages[0]));
  write(ref.unavailableImages[0].path, 'new illustration evidence');
  await assert.rejects(publishAssignment(root, { campaignId: 'test', skillId: 'first' }), /Stale source\/scope/);
});

test('fresh assignments receive selected exact sources; an isolated failure leaves other skills progressing', async t => {
  const { root, sourcePath } = fixture(t), selections = [];
  let first = true, failedSkill;
  const result = await runCampaign(root, { campaignId: 'test', ids: ['first', 'combinations-nCr'], concurrency: 1, maxCalls: 3,
    prepareSources: ({ assignment }) => { selections.push(assignment.skillId); return { sources: [{ path: sourcePath, startLine: 1, endLine: 4, locator: 'Complete addition teaching' }] }; },
    runner: async () => {
      const owner = statusCampaign(root, 'test').owners[0], state = readSkill(root, 'test', owner.skillId);
      if (first) { first = false; failedSkill = owner.skillId; throw new Error('Isolated missing evidence for this skill.'); }
      const payload = owner.owner.role === 'author' ? authorPayload(root, sourcePath, owner.skillId) : reviewPayload(root, state);
      return { result: payload, metrics: { sessionId: owner.owner.workerId, externalModelCalls: 1 } };
    }
  });
  assert.equal(result.calls, 3); assert.equal(result.sharedFailure, null);
  assert.equal(selections.length, 2); assert.equal(new Set(selections).size, 2);
  assert.equal(readSkill(root, 'test', failedSkill).status, 'pending');
  const passing = selections.find(id => id !== failedSkill);
  assert.equal(readSkill(root, 'test', passing).status, 'accepted');
});

test('repeated shared dispatch failures stop fresh work before a third attempt', async t => {
  const { root } = fixture(t);
  const result = await runCampaign(root, { campaignId: 'test', concurrency: 1, runner: async () => { throw new Error('Shared unavailable model service.'); } });
  assert.equal(result.calls, 2); assert.equal(result.sharedFailure.occurrences, 2);
  assert.equal(result.results.filter(result => result.ok === false).length, 2);
  assert.equal(statusCampaign(root, 'test').owners.length, 0);
});

test('fresh-author and exclusion filters retain the complete selected prerequisite scope', async t => {
  const { root, write, sourcePath } = fixture(t), skills = JSON.parse(fs.readFileSync(path.join(root, 'data/skills.json')));
  skills.find(skill => skill.id === 'combinations-nCr').prereqs = ['first']; write('data/skills.json', skills);
  const ids = ['first', 'combinations-nCr'], authorIds = ['combinations-nCr'], excludeIds = ['first'];
  assert.equal(nextAssignment(root, { campaignId:'test', workerId:'blocked-child', ids, authorIds, excludeIds, role:'author' }).done, true);
  const state = stage(root, sourcePath);
  recordReview(root, { ...normalizeWorkerResult(root, state, reviewPayload(root, state)), campaignId:'test', skillId:'first', workerId:'reviewer' });
  assert.equal(readSkill(root,'test','first').status,'accepted');
  assert.equal(nextAssignment(root, { campaignId:'test', workerId:'accepted-not-published', ids, authorIds, excludeIds, role:'author' }).done,true);
  await publishAssignment(root,{campaignId:'test',skillId:'first'});
  assert.equal(nextAssignment(root, { campaignId:'test', workerId:'ready-child', ids, authorIds, excludeIds, role:'author' }).skillId,'combinations-nCr');
});

test('failed prerequisite stays in dependency scope and never unlocks its child', async t => {
  const { root, write } = fixture(t), skills = JSON.parse(fs.readFileSync(path.join(root,'data/skills.json')));
  skills.find(skill=>skill.id==='combinations-nCr').prereqs=['first']; write('data/skills.json',skills);
  const dispatched=[];
  const result=await runCampaign(root,{campaignId:'test',ids:['first','combinations-nCr'],authorIds:['first','combinations-nCr'],concurrency:1,runner:async()=>{
    dispatched.push(statusCampaign(root,'test').owners[0].skillId);throw new Error('Isolated first-skill failure.');
  }});
  assert.deepEqual(dispatched,['first']);assert.equal(result.calls,1);assert.equal(result.sharedFailure,null);
  assert.equal(readSkill(root,'test','combinations-nCr').status,'pending');assert.equal(readSkill(root,'test','combinations-nCr').owner,undefined);
});

test('source-prep gaps dispatch no calls while unrelated ready roots continue', async t => {
  const { root, sourcePath } = fixture(t), previews=[],selections=[];
  const prepareSources=({assignment})=>{selections.push(assignment.skillId);return{sources:[{path:sourcePath,startLine:1,endLine:4,locator:'Complete addition example'}]};};
  prepareSources.preview=({state})=>{previews.push(state.skillId);return{dispatchReady:state.skillId!=='first',accepted:false,gaps:state.skillId==='first'?[{kind:'essential-method-gap'}]:[]};};
  const result=await runCampaign(root,{campaignId:'test',ids:['first','combinations-nCr'],authorIds:['first','combinations-nCr'],concurrency:1,prepareSources,runner:async()=>{
    const owner=statusCampaign(root,'test').owners[0],state=readSkill(root,'test',owner.skillId);
    assert.equal(owner.skillId,'combinations-nCr');return{result:owner.owner.role==='author'?authorPayload(root,sourcePath,owner.skillId):reviewPayload(root,state),metrics:{sessionId:owner.owner.workerId}};
  }});
  assert.deepEqual(new Set(previews),new Set(['first','combinations-nCr']));assert.deepEqual(selections,['combinations-nCr']);
  assert.equal(result.calls,2);assert.equal(result.sharedFailure,null);assert.equal(result.results[0].kind,'source-prep-gap');
  const gap=readSkill(root,'test','first');assert.equal(gap.status,'pending');assert.equal(gap.sourcePreparationGap.accepted,false);assert.equal(gap.sourcePreparationGap.externalModelCalls,0);assert.equal(gap.attempts.length,0);assert.equal(gap.owner,undefined);
  assert.equal(readSkill(root,'test','combinations-nCr').status,'accepted');
});

test('fresh author readiness filter does not block prepared reviews or repairs', async t => {
  const {root,sourcePath}=fixture(t),state=stage(root,sourcePath);
  const prepareSources=()=>assert.fail('Prepared review must retain its evidence');prepareSources.preview=()=>assert.fail('No fresh author is selected');
  const result=await runCampaign(root,{campaignId:'test',ids:['first'],authorIds:[],concurrency:1,prepareSources,runner:async()=>{
    const current=readSkill(root,'test','first');assert.equal(current.owner.role,'review');return{result:reviewPayload(root,current),metrics:{sessionId:current.owner.workerId}};
  }});
  assert.equal(result.calls,1);assert.equal(readSkill(root,'test','first').status,'accepted');
  requestRepair(root,{campaignId:'test',skillId:'first',stageHash:state.stage.hash,finding:'Source-supported wording repair.',targets:['theory.workedExamples[0]']});
  const repair=nextAssignment(root,{campaignId:'test',workerId:'repair',ids:['first'],authorIds:[]});assert.equal(repair.role,'author');
  prepareAssignment(root,{campaignId:'test',skillId:'first',workerId:'repair'});
  assert.equal(nextAssignment(root,{campaignId:'test',workerId:'repair',ids:['first'],authorIds:[]}).resumed,true);
});

test('source preview runs only for fresh selected author IDs and excludes assignment-filtered skills', async t => {
  const {root,sourcePath}=fixture(t),previews=[];
  const prepareSources=()=>({sources:[{path:sourcePath,startLine:1,endLine:4,locator:'Addition example'}]});
  prepareSources.preview=({state})=>{previews.push(state.skillId);return{dispatchReady:true,accepted:false,gaps:[]};};
  const result=await runCampaign(root,{campaignId:'test',ids:['first','combinations-nCr'],authorIds:['first'],excludeIds:['combinations-nCr'],concurrency:1,maxCalls:1,prepareSources,runner:async()=>({result:authorPayload(root,sourcePath),metrics:{sessionId:'author-only'}})});
  assert.deepEqual(previews,['first']);assert.equal(result.calls,1);assert.equal(readSkill(root,'test','combinations-nCr').owner,undefined);
});

test('resolved readiness gaps retain history without entering fresh worker prompts', async t => {
  const {root,sourcePath}=fixture(t);let ready=false;
  const prepareSources=()=>({sources:[{path:sourcePath,startLine:1,endLine:4,locator:'Complete addition example'}]});
  prepareSources.preview=()=>({dispatchReady:ready,gaps:ready?[]:[{kind:'essential-method-gap'}]});
  const first=await runCampaign(root,{campaignId:'test',ids:['first'],concurrency:1,prepareSources,runner:()=>assert.fail('Gap cannot dispatch')});
  assert.equal(first.calls,0);assert.equal(readSkill(root,'test','first').sourcePreparationGap.accepted,false);
  ready=true;
  await runCampaign(root,{campaignId:'test',ids:['first'],concurrency:1,maxCalls:1,prepareSources,runner:async options=>{
    assert.doesNotMatch(options.prompt,/source-prep-gap/);return{result:authorPayload(root,sourcePath),metrics:{sessionId:'ready-author'}};
  }});
  const current=readSkill(root,'test','first');assert.equal(current.sourcePreparationGap,undefined);assert.equal(current.sourcePreparationHistory.length,1);assert.equal(current.sourcePreparationHistory[0].accepted,false);assert.ok(current.sourcePreparationHistory[0].resolvedAt);
});

test('missing linked source figures stay pending before any calls without stopping another ready root', async t => {
  const {root,write,sourcePath}=fixture(t),goodPath='booklets/mathsmap-sources/Stage 4/Ready Addition.md';
  write(sourcePath,'# Addition\n## Example\nCalculate $8+3$.\n$8+3=11$\n![Required original figure](missing.png)');
  write(goodPath,'# Addition\n## Example\nCalculate $8+3$.\n$8+3=11$');
  for(const[skillId,source]of[['first',sourcePath],['combinations-nCr',goodPath]])write('.agywork/content-campaign/test/source-overrides/'+skillId+'.json',{skillId,sources:[{path:source,hash:hashValue(fs.readFileSync(path.join(root,source))),startLine:1,endLine:source===sourcePath?5:4,locator:'Complete addition source',images:[]}]});
  const result=await runCampaign(root,{campaignId:'test',concurrency:1,prepareSources:createSourcePreparer({root,campaignId:'test'}),runner:async()=>{
    const owner=statusCampaign(root,'test').owners[0],state=readSkill(root,'test',owner.skillId);assert.equal(owner.skillId,'combinations-nCr');return{result:owner.owner.role==='author'?authorPayload(root,goodPath,owner.skillId):reviewPayload(root,state),metrics:{sessionId:owner.owner.workerId}};
  }});
  assert.equal(result.calls,2,JSON.stringify(result.results));assert.equal(result.sharedFailure,null);assert.ok(result.results.some(x=>x.kind==='source-prep-gap'&&x.skillId==='first'&&x.gaps.some(g=>g.kind==='source-image-gap')));
  assert.equal(readSkill(root,'test','first').attempts.length,0);assert.equal(readSkill(root,'test','first').status,'pending');assert.equal(readSkill(root,'test','combinations-nCr').status,'accepted');
});

test('membership is frozen from actual published IDs, preserving mixed-case IDs and original counts', t => {
  const { root, write } = fixture(t), before = readCampaign(root, 'test');
  assert.deepEqual(before.skillIds, ['combinations-nCr', 'first']); assert.equal(before.initialCounts.practice, 12); assert.equal(before.initialCounts.quiz, 6);
  write('public/content/excluded.json', capturePair(root, 'first').content);
  const after = initCampaign(root, { campaignId: 'test' });
  assert.deepEqual(after.skillIds, before.skillIds); assert.equal(after.createdAt, before.createdAt); assert.deepEqual(after.excludedIds, ['excluded']);
  assert.throws(() => readSkill(root, 'test', 'excluded'), /outside frozen/);
});
test('canonical candidate validator is import-safe, isolated and supports plural examples/mixed-case IDs', t => {
  const { root, sourcePath } = fixture(t), payload = authorPayload(root, sourcePath, 'combinations-nCr');
  const before = capturePair(root, 'combinations-nCr').expected;
  assert.deepEqual(validateCandidatePair({ rootDir: root, skillId: 'combinations-nCr', content: payload.candidateContent, quiz: payload.candidateQuiz }).errors, []);
  assert.deepEqual(capturePair(root, 'combinations-nCr').expected, before);
  payload.candidateContent.theory.workedExample = payload.candidateContent.theory.workedExamples[0];
  assert.match(validateCandidatePair({ rootDir: root, skillId: 'combinations-nCr', content: payload.candidateContent, quiz: payload.candidateQuiz }).errors.join(' '), /both workedExample/);
});
test('whole-item packets are bounded and stage rejects missing method coverage and supplied wrong hashes', t => {
  const { root, sourcePath } = fixture(t);
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] });
  const prepared = prepareAssignment(root, { campaignId: 'test', workerId: 'author', skillId: 'first' });
  assert.ok(prepared.packets.every(packet => packet.variableChars <= 24000));
  const state = readSkill(root, 'test', 'first'), payload = authorPayload(root, sourcePath);
  payload.coverage.items[0].hash = 'incorrect'; assert.throws(() => normalizeWorkerResult(root, state, payload), /wrong hash/);
  delete payload.coverage.items[0].hash; payload.coverage.items.pop();
  assert.throws(() => stageAssignment(root, { ...normalizeWorkerResult(root, state, payload), campaignId: 'test', workerId: 'author', skillId: 'first' }), /Missing\/stale method coverage/);
});
test('source and live target changes invalidate staged work without overwriting concurrent edits', t => {
  const { root, sourcePath, write } = fixture(t);
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] }); prepareAssignment(root, { campaignId: 'test', workerId: 'author', skillId: 'first' });
  const state = readSkill(root, 'test', 'first'), payload = normalizeWorkerResult(root, state, authorPayload(root, sourcePath));
  write(sourcePath, '# Changed teaching');
  assert.throws(() => stageAssignment(root, { ...payload, campaignId: 'test', workerId: 'author', skillId: 'first' }), /Stale source/);
});
test('independent review requires every item and every option, and author cannot review own stage', t => {
  const { root, sourcePath } = fixture(t), state = stage(root, sourcePath);
  assert.throws(() => recordReview(root, { campaignId: 'test', skillId: 'first', workerId: 'author', stageHash: state.stage.hash }), /does not own/);
  const payload = normalizeWorkerResult(root, state, reviewPayload(root, state)); payload.outcomes.pop();
  assert.throws(() => recordReview(root, { ...payload, campaignId: 'test', skillId: 'first', workerId: 'reviewer' }), /cover every/);
  const complete = normalizeWorkerResult(root, state, reviewPayload(root, state)); complete.outcomes.find(outcome => outcome.options).options.pop();
  assert.throws(() => recordReview(root, { ...complete, campaignId: 'test', skillId: 'first', workerId: 'reviewer' }), /Every MCQ option/);
});
test('review outcomes are bound to the exact staged snapshot and successful JSON never proves acceptance', t => {
  const { root, sourcePath, write } = fixture(t), state = stage(root, sourcePath), payload = normalizeWorkerResult(root, state, reviewPayload(root, state));
  assert.equal(state.status, 'staged');
  const candidate = JSON.parse(fs.readFileSync(path.join(root, state.stage.candidatePath))); candidate.content.theory.intro = 'Different.'; write(state.stage.candidatePath, candidate);
  assert.throws(() => recordReview(root, { ...payload, campaignId: 'test', skillId: 'first', workerId: 'reviewer' }), /Staged candidate changed/);
});
test('single-slot runner uses fresh independent sessions and fills omitted bookkeeping hashes from real bytes', async t => {
  const { root, sourcePath } = fixture(t), sessions = [];
  const result = await runCampaign(root, { campaignId: 'test', ids: ['first'], concurrency: 1, maxCalls: 2, runner: async options => {
    assert.match(options.prompt, /complete required evidence is inline/);
    assert.match(options.prompt, /Calculate \$8\+3\$/);
    assert.match(options.prompt, /candidateContent/);
    const state = readSkill(root, 'test', 'first'), sessionId = 'session-' + sessions.length; sessions.push(sessionId);
    return { result: state.owner.role === 'author' ? authorPayload(root, sourcePath) : reviewPayload(root, state), metrics: { sessionId, observedModel: 'gpt-6.1-sol', usage: { input_tokens: 20 }, serviceTier: 'default' } };
  } });
  assert.equal(result.calls, 2); assert.equal(readSkill(root, 'test', 'first').status, 'accepted');
  const state = readSkill(root, 'test', 'first'); assert.notEqual(state.stage.author, state.review.reviewer); assert.notEqual(state.stage.authorSessionId, state.review.reviewerSessionId);
  assert.ok(state.stage.sourceReview[0].hash); assert.ok(state.review.outcomes.every(outcome => outcome.hash));
});
test('bounded paid-call checkpoints resume unchanged successful jobs under the same assignment', async t => {
  const { root, write, sourcePath } = fixture(t), pair = capturePair(root, 'first');
  for (const tier of ['foundation', 'development']) for (const card of pair.content.practice[tier]) card.question_text = 'Addition context. '.repeat(270) + card.question_text;
  write('public/content/first.json', pair.content);
  write('.agywork/content-campaign/test/source-overrides/first.json', { skillId: 'first', sources: [{ path: sourcePath, hash: hashValue(fs.readFileSync(path.join(root, sourcePath))), startLine: 2, endLine: 4, locator: 'Addition example' }] });
  const calls = [], method = { id: 'add', description: 'Add the two quantities.', sourceRefs: [0] };
  const prepareSources = createSourcePreparer({ root, campaignId: 'test' });
  const runner = async options => {
    const payload = JSON.parse(options.prompt.split('\n').at(-1)), kind = options.stage.replace('content-bounded-', ''); calls.push(kind);
    let result;
    if (kind === 'plan') result = { methods: [method], sourceReview: payload.sourceRefs.map(ref => ({ ...ref, support: 'direct', locator: 'Addition example, lines 2–4', observation: 'The source teaches addition.', adjustments: 'Retain addition working.' })), substantiveCorrections: [] };
    else if (kind === 'author') result = { patches: [], coverage: payload.items.map(item => ({ where: item.where, hash: item.hash, methods: ['add'] })), methods: [], substantiveCorrections: [] };
    else if (kind === 'examples') result = { examples: [{ question_text: 'Calculate $8+3$.', solution_text: '$8+3$\n$=11$' }], coverage: [{ where: 'theory.workedExamples[0]', methods: ['add'] }], substantiveCorrections: [] };
    else throw new Error('Unexpected job ' + kind);
    return { result, metrics: { sessionId: 'mock-' + calls.length, usage: { input_tokens: 17 } } };
  };
  const first = await runCampaign(root, { campaignId: 'test', ids: ['first'], maxCalls: 1, concurrency: 1, prepareSources, runner });
  assert.equal(first.calls, 1); assert.deepEqual(calls, ['plan']);
  const checkpoint = readSkill(root, 'test', 'first');
  assert.ok(checkpoint.owner?.prepared, 'checkpoint preserves prepared assignment');
  assert.equal(statusCampaign(root, 'test').owners.length, 1, 'checkpoint retains its worker lease');
  assert.equal(checkpoint.owner.coordinator, undefined, 'same-process resume can claim coordinator');
  assert.deepEqual(checkpoint.pending, []); assert.equal(first.sharedFailure, null);
  assert.equal(checkpoint.attempts.at(-1).kind, 'paid-call-checkpoint');
  assert.equal(checkpoint.attempts.at(-1).metrics.workerCalls, 1);
  const second = await runCampaign(root, { campaignId: 'test', ids: ['first'], maxCalls: 1, concurrency: 1, prepareSources, runner });
  assert.equal(second.calls, 1); assert.deepEqual(calls, ['plan', 'author'], 'paid plan is reused rather than dispatched again');
  const resumed = readSkill(root, 'test', 'first');
  assert.equal(resumed.owner.assignmentId, checkpoint.owner.assignmentId);
  assert.deepEqual(resumed.owner.prepared, checkpoint.owner.prepared);
  assert.deepEqual(resumed.pending, []); assert.equal(resumed.attempts.at(-1).metrics.reusedCalls, 1);
  const complete = await runCampaign(root, { campaignId: 'test', ids: ['first'], maxCalls: 2, concurrency: 1, prepareSources, runner });
  assert.equal(complete.calls, 2); assert.equal(readSkill(root, 'test', 'first').status, 'staged');
  assert.equal(calls.filter(kind => kind === 'plan').length, 1);
  const receipt = receiptCampaign(root, 'test');
  assert.equal(receipt.workerCalls, 4, 'only actual paid calls across resumes count');
});

test('resumed paid-call checkpoints still reject changed live content and source dependencies before dispatch', async t => {
  for (const change of ['content', 'source']) {
    const { root, write, sourcePath } = fixture(t);
    nextAssignment(root, { campaignId: 'test', workerId: 'owner', ids: ['first'] });
    prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'owner' });
    claimCoordinator(root, { campaignId: 'test', skillId: 'first', workerId: 'owner', runId: 'checkpoint-run' });
    recordPaidCallCheckpoint(root, { campaignId: 'test', skillId: 'first', workerId: 'owner', runId: 'checkpoint-run', metrics: { externalModelCalls: 0, dispatched: false } });
    if (change === 'source') write(sourcePath, 'Changed actual source teaching.');
    else { const current = capturePair(root, 'first').content; current.theory.intro += ' Concurrent edit.'; write('public/content/first.json', current); }
    const result = await runCampaign(root, { campaignId: 'test', ids: ['first'], maxCalls: 1, concurrency: 1, runner: () => assert.fail('Stale checkpoint cannot dispatch') });
    assert.equal(result.calls, 0); assert.match(result.results[0].error, /Stale/);
    assert.equal(readSkill(root, 'test', 'first').owner, undefined, 'ordinary stale-input failure still releases ownership');
  }
});

test('failed call metrics survive without an automatic drain retry', async t => {
  const { root } = fixture(t); let calls = 0;
  const result = await runCampaign(root, { campaignId: 'test', ids: ['first'], concurrency: 1, runner: async () => { calls++; const error = new Error('Unavailable source context'); error.metrics = { sessionId: 'failed-session', usage: { input_tokens: 123 } }; throw error; } });
  assert.equal(calls, 1); assert.equal(result.calls, 1);
  const state = readSkill(root, 'test', 'first'); assert.equal(state.attempts[0].metrics.usage.input_tokens, 123); assert.ok(state.attempts[0].outputPath); assert.equal(statusCampaign(root, 'test').owners.length, 0);
});
test('baseline dispositions identify a middle deletion and reorder without deleting a retained neighbour', () => {
  const item = (where, value) => ({ where, kind: 'practice', hash: hashValue(value), value });
  const before = ['a', 'b', 'c'].map((value, i) => item(`practice.foundation[${i}]`, value));
  const after = ['c', 'a'].map((value, i) => item(`practice.foundation[${i}]`, value));
  assert.throws(() => reconcileBaselineItems(before, after), /missing explicit disposition/);
  const result = reconcileBaselineItems(before, after, [{ where: before[1].where, hash: before[1].hash, reason: 'Duplicate method with no useful case.' }]);
  assert.equal(result.find(row => row.hash === before[1].hash).outcome, 'removed');
  assert.equal(result.find(row => row.hash === before[2].hash).finalWhere, 'practice.foundation[0]');
  assert.throws(() => reconcileBaselineItems(before, after, [{ where: before[2].where, hash: before[2].hash, reason: 'Wrong removal.' }]), /preserved item/);
});
test('new diagrams require decodable PNGs and canonical current per-block render receipts', async t => {
  const { root, sourcePath, write } = fixture(t);
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] }); prepareAssignment(root, { campaignId: 'test', workerId: 'author', skillId: 'first' });
  let state = readSkill(root, 'test', 'first'), payload = authorPayload(root, sourcePath);
  const block = '[tikz]\n\\begin{tikzpicture}\n\\draw (0,0)--(1,0);\n\\end{tikzpicture}\n[/tikz]';
  payload.candidateContent.theory.workedExamples[0].question_text += '\n' + block;
  stageAssignment(root, { ...normalizeWorkerResult(root, state, payload), campaignId: 'test', workerId: 'author', skillId: 'first' });
  nextAssignment(root, { campaignId: 'test', workerId: 'reviewer', ids: ['first'], role: 'review' }); prepareAssignment(root, { campaignId: 'test', workerId: 'reviewer', skillId: 'first' });
  state = readSkill(root, 'test', 'first');
  recordReview(root, { ...normalizeWorkerResult(root, state, reviewPayload(root, state)), campaignId: 'test', workerId: 'reviewer', skillId: 'first' });
  state = readSkill(root, 'test', 'first'); assert.equal(state.status, 'visual-pending');
  const required = state.review.requiredVisuals[0], visual = { where: required.where, hash: required.hash, renderedSourceHash: required.hash, renderedBlockHashes: required.diagramHashes, accepted: true, observation: 'Inspected full field rendering.', geometryObservation: 'The segment matches its endpoints.', paletteObservation: 'Ordinary line is black.' };
  assert.throws(() => recordVisualReview(root, { campaignId: 'test', skillId: 'first', workerId: 'visual', stageHash: state.stage.hash, visualReviews: [visual] }), /Canonical render receipt/);
  assert.throws(() => pngDimensions(Buffer.from('image test fixture')), /not a decodable PNG/);
  const png = renderedPngFixture(); assert.deepEqual(pngDimensions(png), { width: 2, height: 2 });
  const field = { ...required, value: payload.candidateContent.theory.workedExamples[0].question_text };
  visual.renderReceipt = captureCampaignDiagrams(root, { skillId: 'first', candidateHash: state.stage.candidateHash, fields: [field], out: '.agywork/content-campaign/test/visual-fixture', base: 'http://fixture.invalid' }, { capture: ({ out, items }) => {
    fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'block.png'), png); fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(items.map(item => ({ auditId: item.auditId, status: 'pass', png: 'block.png' }))));
    fs.writeFileSync(path.join(out, 'render-environment.json'), JSON.stringify({ format: 'tikz-capture-environment-v1', browserVersion: 'test-fixture', viewports: [{ userAgent: 'test-fixture', devicePixelRatio: 1, viewport: { width: 2, height: 2 }, fontStatus: 'loaded', fonts: [] }] }));
  } });
  const request = JSON.parse(fs.readFileSync(path.join(root, '.agywork/content-campaign/test/visual-fixture/capture-request.json')));
  assert.deepEqual(finalizeCampaignDiagrams(root, { ...request, directory: '.agywork/content-campaign/test/visual-fixture' }), visual.renderReceipt);
  const rebound = rebindCampaignRenderReceipt(root, { reference: visual.renderReceipt, candidateHash: 'wording-only-repair', fields: [field], out: '.agywork/content-campaign/test/visual-fixture/rebound.json' });
  verifyCampaignRenderReceipt(root, 'wording-only-repair', field, rebound);
  assert.throws(() => rebindCampaignRenderReceipt(root, { reference: visual.renderReceipt, candidateHash: 'diagram-change', fields: [{ ...field, value: field.value + ' changed', hash: hashValue(field.value + ' changed') }], out: '.agywork/content-campaign/test/visual-fixture/invalid.json' }), /every current block/);
  const wrong = structuredClone(visual); wrong.renderedBlockHashes = [];
  assert.throws(() => recordVisualReview(root, { campaignId: 'test', skillId: 'first', workerId: 'visual', stageHash: state.stage.hash, visualReviews: [wrong] }), /every rendered block/);
  recordVisualReview(root, { campaignId: 'test', skillId: 'first', workerId: 'visual', stageHash: state.stage.hash, visualReviews: [visual] });
  assert.equal(readSkill(root, 'test', 'first').status, 'accepted');
  const originalReceipt = fs.readFileSync(path.join(root, visual.renderReceipt.path)), receipt = JSON.parse(originalReceipt);
  const partial = structuredClone(receipt); delete partial.rendererDependencyProfile; delete partial.rendererDependencies;
  write(visual.renderReceipt.path, partial);
  assert.throws(() => verifyCampaignRenderReceipt(root, state.stage.candidateHash, field, { path: visual.renderReceipt.path, hash: hashValue(JSON.stringify(partial)) }), /Complete renderer dependency binding/);
  fs.writeFileSync(path.join(root, visual.renderReceipt.path), originalReceipt);
  const environmentBytes = fs.readFileSync(path.join(root, receipt.renderEnvironment.path)); write(receipt.renderEnvironment.path, '{}');
  assert.throws(() => verifyCampaignRenderReceipt(root, state.stage.candidateHash, field, visual.renderReceipt), /environment evidence missing or changed/);
  fs.writeFileSync(path.join(root, receipt.renderEnvironment.path), environmentBytes);
  const dependencyBytes = fs.readFileSync(path.join(root, receipt.rendererDependencies.path)); write(receipt.rendererDependencies.path, '{}');
  assert.throws(() => verifyCampaignRenderReceipt(root, state.stage.candidateHash, field, visual.renderReceipt), /dependency manifest changed/);
  fs.writeFileSync(path.join(root, receipt.rendererDependencies.path), dependencyBytes);
  write(receipt.fields[0].artifacts[0].path, 'changed non-image bytes');
  assert.throws(() => rebindCampaignRenderReceipt(root, { reference: visual.renderReceipt, candidateHash: 'tampered-artifact', fields: [field], out: '.agywork/content-campaign/test/visual-fixture/tampered.json' }), /artifact missing or changed/);
  await assert.rejects(() => publishAssignment(root, { campaignId: 'test', skillId: 'first' }), /artifact missing or changed/);
  fs.writeFileSync(path.join(root, receipt.fields[0].artifacts[0].path), png);
  await publishAssignment(root, { campaignId: 'test', skillId: 'first' });
  const published = readSkill(root, 'test', 'first');
  assert.equal(receiptCampaign(root, 'test').verifiedCurrentPublished, 1);
  write('src/app.css', 'svg{opacity:.9}');
  const stale = receiptCampaign(root, 'test');
  assert.equal(stale.verifiedCurrentPublished, 0); assert.equal(stale.complete, false);
  assert.equal(stale.staleFinals[0].mathematicsSourceCurrent, true); assert.equal(stale.staleFinals[0].renderingCurrent, false);
  assert.equal(stale.staleFinals[0].renderingReasons[0].where, field.where); assert.deepEqual(stale.staleFinals[0].reasons, []);
  assert.deepEqual(nextAssignment(root, { campaignId: 'test', workerId: 'no-maths-redispatch', ids: ['first'] }), { done: true });
  assert.deepEqual(readSkill(root, 'test', 'first'), published, 'renderer-only changes preserve stage/review/publication and prior maths evidence');
});
test('a real interrupted pair transaction remains recoverable through campaign recovery', async t => {
  const { root, sourcePath } = fixture(t), state = stage(root, sourcePath);
  recordReview(root, { ...normalizeWorkerResult(root, state, reviewPayload(root, state)), campaignId: 'test', workerId: 'reviewer', skillId: 'first' });
  await assert.rejects(() => publishAssignment(root, { campaignId: 'test', skillId: 'first', publisher: (root, id, options) => publishSkill(root, id, { ...options, onProgress: () => { throw new Error('Simulated process interruption after content replacement'); } }) }), /Simulated process/);
  assert.equal(readSkill(root, 'test', 'first').status, 'publishing');
  const recovered = await recoverCampaignPublication(root, { campaignId: 'test', skillId: 'first' }); assert.equal(recovered.status, 'published');
});
test('receipt detects live stale content and next reopens reconciliation while preserving publication history', async t => {
  const { root, sourcePath, write } = fixture(t), state = stage(root, sourcePath);
  recordReview(root, { ...normalizeWorkerResult(root, state, reviewPayload(root, state)), campaignId: 'test', workerId: 'reviewer', skillId: 'first' });
  await publishAssignment(root, { campaignId: 'test', skillId: 'first' });
  const live = capturePair(root, 'first'); live.content.theory.intro = 'Concurrent edit.'; write('public/content/first.json', live.content);
  const receipt = receiptCampaign(root, 'test'); assert.equal(receipt.complete, false); assert.equal(receipt.staleFinals[0].skillId, 'first'); assert.notDeepEqual(receipt.staleFinals[0].actual, receipt.staleFinals[0].expected);
  const next = nextAssignment(root, { campaignId: 'test', workerId: 'reconcile', ids: ['first'] }); assert.equal(next.role, 'author');
  const reopened = readSkill(root, 'test', 'first'); assert.equal(reopened.publishedHistory.length, 1); assert.equal(reopened.status, 'pending');
  const prepared = prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'reconcile' }); assert.deepEqual(prepared.expected, capturePair(root, 'first').expected);
});
test('selected-scope prerequisites publish first and active coordinator cannot be stolen', t => {
  const { root, write } = fixture(t), skills = JSON.parse(fs.readFileSync(path.join(root, 'data/skills.json')));
  skills.find(skill => skill.id === 'combinations-nCr').prereqs = ['first']; write('data/skills.json', skills);
  const next = nextAssignment(root, { campaignId: 'test', workerId: 'owner' }); assert.equal(next.skillId, 'first');
  claimCoordinator(root, { campaignId: 'test', workerId: 'owner', skillId: 'first', runId: 'run-one' });
  assert.throws(() => claimCoordinator(root, { campaignId: 'test', workerId: 'owner', skillId: 'first', runId: 'run-two' }), /still active/);
});
test('a hash-bound local example repair reuses unchanged independent outcomes and reviews only the changed example', t => {
  const { root, sourcePath } = fixture(t), state = stage(root, sourcePath);
  recordReview(root, { ...normalizeWorkerResult(root, state, reviewPayload(root, state)), campaignId: 'test', workerId: 'reviewer', skillId: 'first' });
  const accepted = readSkill(root, 'test', 'first');
  assert.throws(() => requestRepair(root, { campaignId: 'test', skillId: 'first', stageHash: 'stale', finding: 'Change incidental numbers.' }), /current unowned/);
  requestRepair(root, { campaignId: 'test', skillId: 'first', stageHash: accepted.stage.hash, finding: 'Change incidental numbers.', targets: ['theory.workedExamples[0]'] });
  nextAssignment(root, { campaignId: 'test', workerId: 'repairer', ids: ['first'] }); prepareAssignment(root, { campaignId: 'test', workerId: 'repairer', skillId: 'first' });
  let current = readSkill(root, 'test', 'first'), candidate = JSON.parse(fs.readFileSync(path.join(root, current.stage.candidatePath)));
  candidate.content.theory.workedExamples[0] = { question_text: 'Calculate $9+3$.', solution_text: '$9+3$\n$=12$' };
  const coverage = structuredClone(current.stage.coverage); delete coverage.items.find(item => item.where === 'theory.workedExamples[0]').hash;
  stageAssignment(root, { ...normalizeWorkerResult(root, current, { candidateContent: candidate.content, candidateQuiz: candidate.quiz, coverage, sourceReview: current.stage.sourceReview }), campaignId: 'test', skillId: 'first', workerId: 'repairer' });
  current = readSkill(root, 'test', 'first'); assert.equal(current.stage.reusedOutcomes.length, 9);
  nextAssignment(root, { campaignId: 'test', workerId: 'repair-reviewer', ids: ['first'], role: 'review' }); prepareAssignment(root, { campaignId: 'test', workerId: 'repair-reviewer', skillId: 'first' }); current = readSkill(root, 'test', 'first');
  const review = reviewPayload(root, current); review.outcomes = review.outcomes.filter(item => item.where === 'theory.workedExamples[0]');
  recordReview(root, { ...normalizeWorkerResult(root, current, review), campaignId: 'test', skillId: 'first', workerId: 'repair-reviewer' });
  const final = readSkill(root, 'test', 'first'); assert.equal(final.status, 'accepted'); assert.equal(final.review.outcomes.length, 10); assert.equal(final.review.outcomes.filter(item => item.reusedFrom).length, 9);
});

test('two author repairs retain transitive passes, invalidate changed items and reject changed dependencies', t => {
  const {root,sourcePath,write}=fixture(t),initial=stage(root,sourcePath);
  recordReview(root,{...normalizeWorkerResult(root,initial,reviewPayload(root,initial)),campaignId:'test',skillId:'first',workerId:'reviewer'});
  const original=readSkill(root,'test','first'),originalOutcome=original.review.outcomes.find(x=>x.where==='quiz.q1');
  const repair=(worker,exampleText,options={})=>{
    const current=readSkill(root,'test','first');
    requestRepair(root,{campaignId:'test',skillId:'first',stageHash:current.stage.hash,finding:'Repair actual example wording.',targets:['theory.workedExamples[0]']});
    if(options.changeSource)write(sourcePath,'# Addition\n## Example\nCalculate $8+3$.\n$8+3=11$\nUse the same addition method.');
    nextAssignment(root,{campaignId:'test',skillId:'first',workerId:worker,ids:['first'],role:'author'});
    prepareAssignment(root,{campaignId:'test',skillId:'first',workerId:worker,...(options.changeSource?{sources:[{path:sourcePath,locator:'Updated complete addition example'}]}:{})});
    const owned=readSkill(root,'test','first'),candidate=JSON.parse(fs.readFileSync(path.join(root,owned.stage.candidatePath))),coverage=structuredClone(owned.stage.coverage);
    candidate.content.theory.workedExamples[0].question_text=exampleText;
    if(options.changeAssessment)candidate.content.practice.foundation[0].question_text+=' Give the sum.';
    for(const row of coverage.items)row.hash=assessmentItems(candidate.content,candidate.quiz).find(item=>item.where===row.where).hash;
    const sourceReview=structuredClone(owned.stage.sourceReview);sourceReview[0].hash=hashValue(fs.readFileSync(path.join(root,sourcePath)));
    stageAssignment(root,{...normalizeWorkerResult(root,owned,{candidateContent:candidate.content,candidateQuiz:candidate.quiz,coverage,sourceReview}),campaignId:'test',skillId:'first',workerId:worker});
    return readSkill(root,'test','first');
  };
  const first=repair('repair1','Calculate $8+3$. Give the sum.');assert.equal(first.stage.reusedOutcomes.length,9);assert.equal(first.review,undefined);
  const second=repair('repair2','Find the sum $8+3$.',{changeAssessment:true});assert.equal(second.stage.reusedOutcomes.length,8);
  assert.ok(!second.stage.reusedOutcomes.some(x=>x.where==='theory.workedExamples[0]'||x.where==='practice.foundation[0]'));
  const retained=second.stage.reusedOutcomes.find(x=>x.where==='quiz.q1');assert.equal(retained.hash,originalOutcome.hash);assert.equal(retained.reusedFrom.stageHash,original.stage.hash);assert.equal(retained.reusedFrom.reviewer,'reviewer');assert.equal(new Set(second.stage.reusedOutcomes.map(x=>x.where)).size,8);
  const third=repair('repair3','Calculate the sum $8+3$.',{changeSource:true});assert.equal(third.stage.reusedOutcomes.length,0,'actual source bytes invalidate all retained maths evidence');
});

test('fresh review verdicts override retained passes without duplicates during later staging',t=>{
  const {root,sourcePath}=fixture(t),initial=stage(root,sourcePath);
  recordReview(root,{...normalizeWorkerResult(root,initial,reviewPayload(root,initial)),campaignId:'test',skillId:'first',workerId:'reviewer'});
  const author=worker=>{
    const s=readSkill(root,'test','first');if(s.status!=='repair-needed')requestRepair(root,{campaignId:'test',skillId:'first',stageHash:s.stage.hash,finding:'Clarify example wording.',targets:['theory.workedExamples[0]']});
    nextAssignment(root,{campaignId:'test',workerId:worker,ids:['first'],role:'author'});prepareAssignment(root,{campaignId:'test',skillId:'first',workerId:worker});
    const owned=readSkill(root,'test','first'),candidate=JSON.parse(fs.readFileSync(path.join(root,owned.stage.candidatePath))),coverage=structuredClone(owned.stage.coverage);candidate.content.theory.workedExamples[0].question_text+=' Give the sum.';
    for(const row of coverage.items)row.hash=assessmentItems(candidate.content,candidate.quiz).find(i=>i.where===row.where).hash;
    stageAssignment(root,{...normalizeWorkerResult(root,owned,{candidateContent:candidate.content,candidateQuiz:candidate.quiz,coverage,sourceReview:owned.stage.sourceReview}),campaignId:'test',skillId:'first',workerId:worker});
  };
  author('author1');assert.equal(readSkill(root,'test','first').stage.reusedOutcomes.length,9);
  nextAssignment(root,{campaignId:'test',workerId:'fresh-review',ids:['first'],role:'review'});prepareAssignment(root,{campaignId:'test',skillId:'first',workerId:'fresh-review'});
  const current=readSkill(root,'test','first'),review=reviewPayload(root,current);review.outcomes=review.outcomes.filter(x=>['quiz.q1','theory.workedExamples[0]'].includes(x.where));review.outcomes.find(x=>x.where==='quiz.q1').verdict='repair';review.findings=[{description:'Clarify q1 wording.'}];
  recordReview(root,{...normalizeWorkerResult(root,current,review),campaignId:'test',skillId:'first',workerId:'fresh-review'});
  assert.equal(readSkill(root,'test','first').review.outcomes.length,10);
  author('author2');const retained=readSkill(root,'test','first').stage.reusedOutcomes;
  assert.equal(retained.length,8);assert.equal(new Set(retained.map(x=>x.where)).size,8);assert.ok(!retained.some(x=>x.where==='quiz.q1'),'fresh repair verdict must displace old pass');
});
test('review finding observations and repairs become explicit pending descriptions without losing raw fields', t => {
  const { root, sourcePath } = fixture(t), state = stage(root, sourcePath), payload = reviewPayload(root, state);
  const raw = { where: 'theory.intro', observation: 'The current statement is unclear.', repair: 'Use the source-supported place wording.', extra: { original: true } };
  payload.findings = [raw];
  for (const incomplete of [null, {}, '', []]) assert.throws(() => recordReview(root, { ...normalizeWorkerResult(root, state, { ...payload, findings: [incomplete] }), campaignId: 'test', skillId: 'first', workerId: 'reviewer' }), /finding needs/);
  recordReview(root, { ...normalizeWorkerResult(root, state, payload), campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
  const recorded = readSkill(root, 'test', 'first');
  assert.equal(recorded.status, 'repair-needed'); assert.ok(recorded.pending.every(message => typeof message === 'string' && message.trim()));
  assert.deepEqual(recorded.review.findings[0], { ...raw, description: raw.observation + ' ' + raw.repair });
  assert.equal(raw.description, undefined, 'original worker finding is not mutated');
});

test('published findings prepare a fresh concurrency baseline and preserve original evidence through real republication', async t => {
  const { root, sourcePath } = fixture(t), initial = stage(root, sourcePath);
  recordReview(root, { ...normalizeWorkerResult(root, initial, reviewPayload(root, initial)), campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
  await publishAssignment(root, { campaignId: 'test', skillId: 'first' });
  const original = readSkill(root, 'test', 'first'), oldCandidateBytes = fs.readFileSync(path.join(root, original.stage.candidatePath)), oldBaselineBytes = fs.readFileSync(path.join(root, original.stage.baselinePath)), oldJournalBytes = fs.readFileSync(path.resolve(root, original.published.journalPath));
  const oldEvidencePath = path.join(path.dirname(path.join(root, original.stage.baselinePath)), 'source-evidence.json'), oldEvidenceBytes = fs.readFileSync(oldEvidencePath);
  const cachePath = path.join(root, '.agywork/content-campaign/test/first/bounded-evidence/retained-cache.json');
  fs.mkdirSync(path.dirname(cachePath), { recursive: true }); fs.writeFileSync(cachePath, JSON.stringify({ fixture: 'Existing independent cache must remain untouched', outcome: original.review.outcomes[0] }));
  const oldCacheBytes = fs.readFileSync(cachePath);
  assert.notDeepEqual(original.published.expected, original.stage.expected, 'first publication actually changed the live pair');
  requestRepair(root, { campaignId: 'test', skillId: 'first', stageHash: original.stage.hash, finding: 'Make the worked-example instruction visibly complete.', targets: ['theory.workedExamples[0]'] });
  let state = readSkill(root, 'test', 'first');
  assert.deepEqual(state.published, original.published); assert.deepEqual(state.publishedHistory[0].published, original.published);
  assert.deepEqual(state.stage.expected, original.stage.expected, 'do not mutate the original accepted stage');
  assert.deepEqual(state.stage.baselineDispositions, original.stage.baselineDispositions);
  nextAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'published-repair-author', ids: ['first'], role: 'author' });
  const prepared = prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'published-repair-author' });
  assert.deepEqual(prepared.expected, original.published.expected);
  const repairSnapshotPath = readSkill(root, 'test', 'first').owner.prepared.snapshotPath;
  assert.notEqual(repairSnapshotPath, original.stage.candidatePath);
  const repair = JSON.parse(fs.readFileSync(path.join(root, repairSnapshotPath)));
  assert.deepEqual(repair.expected, original.published.expected); assert.deepEqual(repair.content, JSON.parse(oldCandidateBytes).content);
  repair.content.theory.workedExamples[0].question_text += ' Give the sum.';
  state = readSkill(root, 'test', 'first'); const coverage = structuredClone(state.stage.coverage);
  for (const row of coverage.items) row.hash = assessmentItems(repair.content, repair.quiz, false).find(item => item.where === row.where).hash;
  stageAssignment(root, { ...normalizeWorkerResult(root, state, { candidateContent: repair.content, candidateQuiz: repair.quiz, coverage, sourceReview: state.stage.sourceReview }), campaignId: 'test', skillId: 'first', workerId: 'published-repair-author' });
  state = readSkill(root, 'test', 'first');
  assert.deepEqual(state.stage.expected, original.published.expected); assert.equal(state.stage.baselinePath, original.stage.baselinePath);
  assert.deepEqual(state.stage.baselineDispositions, original.stage.baselineDispositions); assert.equal(state.stage.reusedOutcomes.length, 9);
  assert.ok(state.stage.reusedOutcomes.every(outcome => outcome.reusedFrom.reviewer === 'reviewer'));
  nextAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'published-repair-reviewer', ids: ['first'], role: 'review' });
  prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'published-repair-reviewer' });
  state = readSkill(root, 'test', 'first'); const review = reviewPayload(root, state);
  review.outcomes = review.outcomes.filter(outcome => outcome.where === 'theory.workedExamples[0]');
  recordReview(root, { ...normalizeWorkerResult(root, state, review), campaignId: 'test', skillId: 'first', workerId: 'published-repair-reviewer' });
  await publishAssignment(root, { campaignId: 'test', skillId: 'first' });
  const final = readSkill(root, 'test', 'first');
  assert.equal(final.status, 'published'); assert.deepEqual(capturePair(root, 'first').content, repair.content);
  assert.notEqual(final.published.journalPath, original.published.journalPath); assert.deepEqual(final.publishedHistory[0].published, original.published);
  assert.deepEqual(fs.readFileSync(path.join(root, original.stage.candidatePath)), oldCandidateBytes);
  assert.deepEqual(fs.readFileSync(path.join(root, original.stage.baselinePath)), oldBaselineBytes);
  assert.deepEqual(fs.readFileSync(path.resolve(root, original.published.journalPath)), oldJournalBytes);
  assert.deepEqual(fs.readFileSync(oldEvidencePath), oldEvidenceBytes); assert.deepEqual(fs.readFileSync(cachePath), oldCacheBytes);
});

test('published findings reject changed live pairs, sources and candidate evidence without changing the ledger', async t => {
  for (const change of ['live', 'source', 'candidate']) {
    const { root, sourcePath, write } = fixture(t), initial = stage(root, sourcePath);
    recordReview(root, { ...normalizeWorkerResult(root, initial, reviewPayload(root, initial)), campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
    await publishAssignment(root, { campaignId: 'test', skillId: 'first' });
    const before = readSkill(root, 'test', 'first');
    if (change === 'source') write(sourcePath, 'Changed actual source teaching.');
    else if (change === 'live') { const pair = capturePair(root, 'first'); pair.content.theory.intro += ' Concurrent edit.'; write('public/content/first.json', pair.content); }
    else { const candidate = JSON.parse(fs.readFileSync(path.join(root, before.stage.candidatePath))); candidate.content.theory.intro += ' Tampered evidence.'; write(before.stage.candidatePath, candidate); }
    assert.throws(() => requestRepair(root, { campaignId: 'test', skillId: 'first', stageHash: before.stage.hash, finding: 'A real targeted repair.', targets: ['theory.workedExamples[0]'] }), /Stale/);
    assert.deepEqual(readSkill(root, 'test', 'first'), before);
  }
});

test('published repair preparation checks its bound live baseline again after the finding', async t => {
  const { root, sourcePath, write } = fixture(t), initial = stage(root, sourcePath);
  recordReview(root, { ...normalizeWorkerResult(root, initial, reviewPayload(root, initial)), campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
  await publishAssignment(root, { campaignId: 'test', skillId: 'first' });
  const published = readSkill(root, 'test', 'first');
  requestRepair(root, { campaignId: 'test', skillId: 'first', stageHash: published.stage.hash, finding: 'Repair one example instruction.', targets: ['theory.workedExamples[0]'] });
  nextAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'author-repair', ids: ['first'], role: 'author' });
  prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'author-repair' });
  const before = readSkill(root, 'test', 'first'), snapshotBytes = fs.readFileSync(path.join(root, before.owner.prepared.snapshotPath));
  const concurrent = capturePair(root, 'first').content; concurrent.theory.intro += ' Concurrent edit.'; write('public/content/first.json', concurrent);
  assert.throws(() => prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'author-repair' }), /Stale published repair/);
  assert.deepEqual(readSkill(root, 'test', 'first'), before); assert.deepEqual(fs.readFileSync(path.join(root, before.owner.prepared.snapshotPath)), snapshotBytes);
});

test('interrupted campaign publication recovers its journal before releasing ownership', async t => {
  const { root, sourcePath, write } = fixture(t), state = stage(root, sourcePath);
  recordReview(root, { ...normalizeWorkerResult(root, state, reviewPayload(root, state)), campaignId: 'test', workerId: 'reviewer', skillId: 'first' });
  const accepted = readSkill(root, 'test', 'first'); accepted.status = 'publishing'; accepted.owner = { role: 'publish', workerId: 'coordinator-publication', pid: process.pid };
  write('booklets/provenance/content-campaign/test/skills/first.json', accepted);
  await assert.rejects(() => recoverCampaignPublication(root, { campaignId: 'test', skillId: 'first', recoverer: async () => null }), /still active/);
  const result = await recoverCampaignPublication(root, { campaignId: 'test', skillId: 'first', force: true, recoverer: async () => {
    const candidate = JSON.parse(fs.readFileSync(path.join(root, accepted.stage.candidatePath))); write('public/content/first.json', candidate.content); write('public/quizzes/first.json', candidate.quiz); return { journalPath: 'fixture-journal' };
  } });
  assert.equal(result.status, 'published');
  const final = readSkill(root, 'test', 'first'); assert.ok(!final.owner); assert.equal(final.published.baselineDispositions.length, 9); assert.ok(final.published.baselineDispositions.every(item => item.review.independentSolution));
});

test('twenty-item repair packets retain targeted findings without repeating long passing solutions', t => {
  const { root, sourcePath } = fixture(t);
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] }); prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'author' });
  let state = readSkill(root, 'test', 'first'), payload = authorPayload(root, sourcePath);
  for (const tier of ['foundation', 'development']) payload.candidateContent.practice[tier].push(...structuredClone(payload.candidateContent.practice[tier]));
  payload.candidateQuiz.questions.push({ ...structuredClone(payload.candidateQuiz.questions[0]), id: 'q4' });
  payload.candidateContent.theory.workedExamples.push(...Array.from({ length: 3 }, () => structuredClone(payload.candidateContent.theory.workedExamples[0])));
  payload.coverage.items = assessmentItems(payload.candidateContent, payload.candidateQuiz, false).map(item => ({ where: item.where, methods: ['add'] }));
  stageAssignment(root, { ...normalizeWorkerResult(root, state, payload), campaignId: 'test', skillId: 'first', workerId: 'author' });
  nextAssignment(root, { campaignId: 'test', workerId: 'reviewer', ids: ['first'], role: 'review' }); prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
  state = readSkill(root, 'test', 'first'); const review = reviewPayload(root, state);
  review.outcomes.forEach(outcome => { outcome.independentSolution += '\n' + 'Detailed independent arithmetic justification. '.repeat(22); });
  assert.equal(review.outcomes.length, 20);
  recordReview(root, { ...normalizeWorkerResult(root, state, review), campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
  state = readSkill(root, 'test', 'first'); requestRepair(root, { campaignId: 'test', skillId: 'first', stageHash: state.stage.hash, finding: 'Repair only the first example numbers.', targets: ['theory.workedExamples[0]'] });
  nextAssignment(root, { campaignId: 'test', workerId: 'repairer', ids: ['first'] }); const prepared = prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'repairer' });
  const packet = JSON.parse(fs.readFileSync(path.join(root, prepared.packets[0].path)));
  assert.equal(packet.previousReview.outcomes, undefined);
  const previousReview = loadPreviousReview(root, prepared, readSkill(root, 'test', 'first'), prepared.packets.map(packet => JSON.parse(fs.readFileSync(path.join(root, packet.path)))));
  assert.equal(previousReview.outcomes.length, 1); assert.equal(previousReview.outcomes[0].where, 'theory.workedExamples[0]');
  assert.ok(prepared.packets.every(packet => packet.variableChars <= 24000));
  assert.ok(inlineEvidencePrompt(root, prepared, readSkill(root, 'test', 'first')).variableChars <= 24000);
  assert.equal(readSkill(root, 'test', 'first').review.outcomes.length, 20);
});

test('removed original MCQ is fully inline and needs independently derived solution and all original options', t => {
  const { root, sourcePath } = fixture(t);
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] }); prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'author' });
  let state = readSkill(root, 'test', 'first'), payload = authorPayload(root, sourcePath), original = structuredClone(payload.candidateQuiz.questions[0]);
  payload.candidateQuiz.questions.shift(); payload.candidateQuiz.questions.push({ ...structuredClone(original), id: 'q4' }); payload.removals = [{ where: 'quiz.q1', reason: 'Duplicate assessed case.' }];
  payload.coverage.items = assessmentItems(payload.candidateContent, payload.candidateQuiz, false).map(item => ({ where: item.where, methods: ['add'] }));
  stageAssignment(root, { ...normalizeWorkerResult(root, state, payload), campaignId: 'test', skillId: 'first', workerId: 'author' });
  nextAssignment(root, { campaignId: 'test', workerId: 'reviewer', ids: ['first'], role: 'review' }); const prepared = prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
  state = readSkill(root, 'test', 'first'); const prompt = inlineEvidencePrompt(root, prepared, state).prompt, inline = JSON.parse(prompt.slice(prompt.lastIndexOf('\n') + 1));
  assert.deepEqual(inline.removedOriginalItems[0].value, original);
  const review = reviewPayload(root, state); review.removals = [{ where: 'quiz.q1', accepted: true, observation: 'The source and retained cases justify removing this duplicate.' }];
  assert.throws(() => recordReview(root, { ...normalizeWorkerResult(root, state, review), campaignId: 'test', skillId: 'first', workerId: 'reviewer' }), /full independent solution/);
  review.removals[0].independentSolution = original.solution_text;
  assert.throws(() => recordReview(root, { ...normalizeWorkerResult(root, state, review), campaignId: 'test', skillId: 'first', workerId: 'reviewer' }), /every original option/);
  review.removals[0].options = original.options.map(option => ({ mathematicallyCorrect: option.correct === true, observation: 'Checked against independent sum.' }));
  recordReview(root, { ...normalizeWorkerResult(root, state, review), campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
  assert.equal(readSkill(root, 'test', 'first').status, 'accepted');
});

test('published source and prerequisite changes invalidate completion without changing the published pair', async t => {
  const { root, sourcePath, write } = fixture(t), skills = JSON.parse(fs.readFileSync(path.join(root, 'data/skills.json')));
  skills.find(skill => skill.id === 'first').prereqs = ['combinations-nCr']; write('data/skills.json', skills);
  const state = stage(root, sourcePath); recordReview(root, { ...normalizeWorkerResult(root, state, reviewPayload(root, state)), campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
  await publishAssignment(root, { campaignId: 'test', skillId: 'first' });
  const before = capturePair(root, 'first').expected, prereq = capturePair(root, 'combinations-nCr'); prereq.content.theory.intro += ' Changed teaching.'; write('public/content/combinations-nCr.json', prereq.content);
  assert.equal(receiptCampaign(root, 'test').staleFinals[0].skillId, 'first'); assert.deepEqual(capturePair(root, 'first').expected, before);
  write(sourcePath, '# Different source context');
  const assignment = nextAssignment(root, { campaignId: 'test', workerId: 'reconcile', ids: ['first'] }); assert.equal(assignment.role, 'author'); assert.equal(readSkill(root, 'test', 'first').publishedHistory.length, 1);
});

test('prerequisite-only reopening preserves immutable original review without automatic acceptance', async t => {
  const { root, sourcePath, write } = fixture(t), skills = JSON.parse(fs.readFileSync(path.join(root, 'data/skills.json')));
  skills.find(skill => skill.id === 'first').prereqs = ['combinations-nCr']; write('data/skills.json', skills);
  const state = stage(root, sourcePath); recordReview(root, { ...normalizeWorkerResult(root, state, reviewPayload(root, state)), campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
  await publishAssignment(root, { campaignId: 'test', skillId: 'first' });
  const accepted = readSkill(root, 'test', 'first'), originalCandidate = fs.readFileSync(path.join(root, accepted.stage.candidatePath));
  const parent = capturePair(root, 'combinations-nCr'); parent.content.theory.workedExamples = [{ question_text: 'Calculate $2+2$.', solution_text: '$2+2=4$' }];
  write('public/content/combinations-nCr.json', parent.content);
  nextAssignment(root, { campaignId: 'test', workerId: 'reconcile', ids: ['first'] });
  const reopened = readSkill(root, 'test', 'first'), reference = reopened.reconciliation.priorReference;
  const evidence = JSON.parse(fs.readFileSync(path.join(root, reference.path)));
  assert.equal(hashValue(evidence), reference.hash);
  assert.deepEqual(evidence.review, accepted.review);
  assert.deepEqual(evidence.stage, accepted.stage);
  assert.equal(evidence.dependencies.hash, accepted.stage.dependencyHash);
  assert.deepEqual(fs.readFileSync(path.join(root, accepted.stage.candidatePath)), originalCandidate);
  assert.equal(reopened.review, undefined); assert.equal(reopened.stage, undefined);
  assert.equal(reopened.status, 'pending');
});

test('abandoned ledger ticket is reclaimed and a concurrent runner cannot dispatch or release a live owner', async t => {
  const { root } = fixture(t), directory = path.join(root, '.agywork/content-campaign/test/campaign-locks');
  const dead = path.join(directory, `2147483647-${Buffer.from(os.hostname()).toString('hex')}-abandoned`); fs.mkdirSync(dead, { recursive: true });
  nextAssignment(root, { campaignId: 'test', workerId: 'owner', ids: ['first'] }); assert.ok(!fs.existsSync(dead));
  claimCoordinator(root, { campaignId: 'test', workerId: 'owner', skillId: 'first', runId: 'active-run' });
  let calls = 0; const result = await runCampaign(root, { campaignId: 'test', ids: ['first'], concurrency: 1, runner: async () => { calls++; throw new Error('Must not dispatch'); } });
  assert.equal(calls, 0); assert.match(result.results[0].error, /still active/); assert.equal(readSkill(root, 'test', 'first').owner.workerId, 'owner');
});

test('receipt records a dispatched failure with unavailable usage and excludes an undispatched budget checkpoint', async t => {
  const { root, write } = fixture(t);
  await runCampaign(root, { campaignId: 'test', ids: ['first'], concurrency: 1, runner: async () => { throw new Error('Model connection failed without usage data'); } });
  let state = readSkill(root, 'test', 'first'); state.attempts.push({ metrics: { externalModelCalls: 0, dispatched: false }, error: 'Local budget checkpoint' }); write('booklets/provenance/content-campaign/test/skills/first.json', state);
  const receipt = receiptCampaign(root, 'test'); assert.equal(receipt.workerCalls, 1); assert.equal(receipt.usageUnavailableCalls, 1); assert.equal(receipt.availableUsage[0].usage, null);
});

test('manual reviewerProfile preserves exposed native settings without inferring observed model, speed or usage', t => {
  const { root, sourcePath } = fixture(t), state = stage(root, sourcePath);
  const profile = { provider: 'collaboration', model: 'gpt-6.1-sol', requestedModel: 'gpt-6.1-sol', effort: 'high', requestedServiceTier: 'default', observedModel: null, serviceTier: null, usage: null, reviewerIdentity: '/root/independent-native' };
  recordReview(root, { ...normalizeWorkerResult(root, state, reviewPayload(root, state)), reviewerProfile: profile, campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
  const reviewed = readSkill(root, 'test', 'first'); assert.deepEqual(reviewed.review.reviewerProfile, profile); assert.deepEqual(reviewed.review.metrics, profile);
  const receipt = receiptCampaign(root, 'test'); assert.equal(receipt.availableUsage[0].observedModel, null); assert.equal(receipt.availableUsage[0].serviceTier, null); assert.equal(receipt.availableUsage[0].usage, null);
  assert.throws(() => recordReviewProfile(root, { campaignId: 'test', skillId: 'first', workerId: 'reviewer', stageHash: 'wrong', reviewerProfile: profile }), /current unowned review/);
  recordReviewProfile(root, { campaignId: 'test', skillId: 'first', workerId: 'reviewer', stageHash: reviewed.stage.hash, reviewerProfile: { ...profile, usage: { input_tokens: 999 }, serviceTier: 'default' } });
  const final = readSkill(root, 'test', 'first'); assert.equal(final.review.metrics.usage, null); assert.equal(final.review.metrics.serviceTier, null); assert.equal(final.review.provenanceHistory.length, 1);
});

test('a flagged unchanged baseline diagram survives an unrelated accepted item repair', t => {
  const { root, sourcePath, write } = fixture(t), pair = capturePair(root, 'first');
  pair.content.theory.intro += '\n[tikz]\n\\begin{tikzpicture}\n\\draw (0,0)--(1,0);\n\\end{tikzpicture}\n[/tikz]'; write('public/content/first.json', pair.content);
  let state = stage(root, sourcePath), review = reviewPayload(root, state); review.flaggedDiagrams = ['theory.intro'];
  recordReview(root, { ...normalizeWorkerResult(root, state, review), campaignId: 'test', skillId: 'first', workerId: 'reviewer' });
  state = readSkill(root, 'test', 'first'); assert.equal(state.status, 'visual-pending'); requestRepair(root, { campaignId: 'test', skillId: 'first', stageHash: state.stage.hash, finding: 'Change unrelated example numbers.', targets: ['theory.workedExamples[0]'] });
  nextAssignment(root, { campaignId: 'test', workerId: 'repairer', ids: ['first'] }); prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'repairer' });
  state = readSkill(root, 'test', 'first'); const candidate = JSON.parse(fs.readFileSync(path.join(root, state.stage.candidatePath))), coverage = structuredClone(state.stage.coverage);
  candidate.content.theory.workedExamples[0] = { question_text: 'Calculate $9+3$.', solution_text: '$9+3$\n$=12$' }; delete coverage.items.find(item => item.where === 'theory.workedExamples[0]').hash;
  stageAssignment(root, { ...normalizeWorkerResult(root, state, { candidateContent: candidate.content, candidateQuiz: candidate.quiz, sourceReview: state.stage.sourceReview, coverage }), campaignId: 'test', skillId: 'first', workerId: 'repairer' });
  nextAssignment(root, { campaignId: 'test', workerId: 'repair-reviewer', ids: ['first'], role: 'review' }); prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'repair-reviewer' });
  state = readSkill(root, 'test', 'first'); review = reviewPayload(root, state); review.outcomes = review.outcomes.filter(outcome => outcome.where === 'theory.workedExamples[0]');
  recordReview(root, { ...normalizeWorkerResult(root, state, review), campaignId: 'test', skillId: 'first', workerId: 'repair-reviewer' });
  const final = readSkill(root, 'test', 'first'); assert.equal(final.status, 'visual-pending'); assert.equal(final.review.requiredVisuals[0].where, 'theory.intro');
});

test('complete source evidence and whole example snapshots survive assessment packet space limits', t => {
  const { root, sourcePath, write } = fixture(t), source = '# Addition\n' + 'The example uses addition of two quantities, with visible working. '.repeat(85);
  write(sourcePath, source); const pair = capturePair(root, 'first'); pair.content.theory.workedExamples = Array.from({ length: 8 }, () => ({ question_text: 'Calculate $8+3$. ' + 'Whole example text. '.repeat(55), solution_text: '$8+3$\n$=11$' })); write('public/content/first.json', pair.content);
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] }); const prepared = prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'author', sources: [{ path: sourcePath, hash: hashValue(source) }], maxVariableChars: 7000 });
  const sources = JSON.parse(fs.readFileSync(path.join(root, prepared.sourceEvidencePath))); assert.equal(hashValue(sources), prepared.sourceEvidenceHash); assert.equal(sources[0].excerpt, source);
  const packets = prepared.packets.map(packet => JSON.parse(fs.readFileSync(path.join(root, packet.path)))); assert.ok(packets.every(packet => !packet.theory.workedExamples && !packet.sourceEvidence.length));
  const snapshot = JSON.parse(fs.readFileSync(path.join(root, readSkill(root, 'test', 'first').owner.prepared.snapshotPath))); assert.equal(snapshot.content.theory.workedExamples.length, 8);
});

test('serialized packet sizing includes escaped source text and retains full long source review outside repeated context', t => {
  const { root, sourcePath, write } = fixture(t), source = '# Example\n' + '$\\frac{x}{7}+5=19$ "source equation"\n'.repeat(110);
  write(sourcePath, source); nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] });
  const refs = [{ path: sourcePath, observation: 'Exact source observation. '.repeat(250), adjustments: 'Actual adaptation record. '.repeat(250) }];
  const prepared = prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'author', sources: refs, maxVariableChars: 7000 });
  for (const record of prepared.packets) {
    const packet = JSON.parse(fs.readFileSync(path.join(root, record.path))); assert.equal(record.variableChars, JSON.stringify(packet).length); assert.ok(record.variableChars <= 7000);
    assert.equal(packet.sourceReferences[0].observation, undefined); assert.equal(packet.sourceReferences[0].adjustments, undefined);
  }
  assert.equal(prepared.sourceReferences[0].observation, refs[0].observation); assert.equal(prepared.sourceReferences[0].adjustments, refs[0].adjustments);
  const evidence = JSON.parse(fs.readFileSync(path.join(root, prepared.sourceEvidencePath))); assert.equal(evidence[0].excerpt, source); assert.equal(evidence[0].adjustments, refs[0].adjustments);
});

test('failed reprepare preserves immutable former source and packet versions', t => {
  const { root, sourcePath } = fixture(t); nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] });
  const first = prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'author' }), oldState = readSkill(root, 'test', 'first').owner.prepared;
  const sourceBytes = fs.readFileSync(path.join(root, first.sourceEvidencePath)), packetBytes = first.packets.map(packet => fs.readFileSync(path.join(root, packet.path)));
  assert.throws(() => prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'author', sources: [{ path: sourcePath, startLine: 2, endLine: 4, locator: 'Different selection' }], maxVariableChars: 120 }), /context bound/);
  assert.deepEqual(readSkill(root, 'test', 'first').owner.prepared, oldState); assert.deepEqual(fs.readFileSync(path.join(root, first.sourceEvidencePath)), sourceBytes);
  first.packets.forEach((packet,index) => assert.deepEqual(fs.readFileSync(path.join(root, packet.path)), packetBytes[index]));
  const second = prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'author', sources: [{ path: sourcePath, startLine: 2, endLine: 4, locator: 'Different selection' }] });
  assert.notEqual(second.sourceEvidencePath, first.sourceEvidencePath); assert.deepEqual(fs.readFileSync(path.join(root, first.sourceEvidencePath)), sourceBytes);
  const history = readSkill(root, 'test', 'first').owner.preparedHistory; assert.equal(history.length, 1); assert.equal(history[0].sourceEvidenceHash, first.sourceEvidenceHash);
});

test('actual algebra pilot source review with all supplemental images fits fully counted preparation packets', t => {
  const { root } = fixture(t);
  const actualRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const candidatePath = path.join(actualRoot, '.agywork/content-campaign/worked-examples-2026-09/solve-linear-2-step/2e6e8a7f-1cca-4792-8649-15d0a725d6fd/native-author-result.json');
  if (!fs.existsSync(candidatePath)) { t.skip('Local actual pilot artifact is unavailable; synthetic regressions remain active.'); return; }
  const refs = JSON.parse(fs.readFileSync(candidatePath)).sourceReview;
  for (const name of new Set(refs.flatMap(ref => [ref.path, ...(ref.images || []).map(image => image.path)]))) {
    const destination = path.join(root,name); fs.mkdirSync(path.dirname(destination),{recursive:true}); fs.copyFileSync(path.join(actualRoot,name),destination);
  }
  nextAssignment(root, { campaignId: 'test', workerId: 'author', ids: ['first'] });
  const prepared = prepareAssignment(root, { campaignId: 'test', skillId: 'first', workerId: 'author', sources: refs });
  const evidence = JSON.parse(fs.readFileSync(path.join(root, prepared.sourceEvidencePath))); assert.equal(evidence.length,6); assert.equal(evidence[5].images.length,2);
  assert.equal(hashValue(evidence),prepared.sourceEvidenceHash); assert.ok(prepared.packets.every(packet=>packet.variableChars <= 24000));
  assert.equal(prepared.sourceReferences[5].adjustments, refs[5].adjustments);
});
