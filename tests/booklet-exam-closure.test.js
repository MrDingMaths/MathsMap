import test from 'node:test';
import assert from 'node:assert/strict';
import {mathsBaseSource} from '../src/lib/question-source.js';
import {buildClosureSkeleton, checkClosure, importPriorDispositions, markCosmetic, rebaseClosureRecord, setDisposition} from '../pedagogy/exam-closure.mjs';
import {importLegacy, markSaved, openOrAmend} from '../pedagogy/exam-proposals.mjs';

const owner = (id, code = 'HSC.ADV.2011 Q2') => ({id, type: 'question', source: mathsBaseSource(code), content: {prompt: 'Find $x$.'},
  sourceReview: {origin: {provider: 'MathsBase', sourceCode: code}}});
const sample = id => ({id, type: 'question', title: 'HSC Sample Standard 2 Question', source: {provider: 'HSC', paper: 'Standard 2', label: 'HSC Sample Question Standard 2'}, content: {prompt: 'Keep.'}});
const exam = blocks => ({id: 'exam', role: 'exam', phase: 'practice', workingSpace: 'none', blocks});
const project = (blocks, revision = 7) => ({id: 'p', revision, sections: [{id: 'practice', blocks: [{id: 'routine', type: 'question'}]}, exam(blocks)]});
const screenRows = [{id: 'a', status: 'allowed-label-ready'}, {id: 'b', status: 'source-label-hold'}, {id: 'c', status: 'excluded-provider'}];
const SCREEN = 'f'.repeat(64), LIVE = 'e'.repeat(64);
const bound = () => true;

function closedRecord(live = project([owner('q1'), owner('q2')])) {
  const skeleton = buildClosureSkeleton({projectId: 'p', project: live, projectSha256: LIVE, screenRows, screen: {file: 'screen.json', sha256: SCREEN}});
  setDisposition(skeleton, 'a', {class: 'selected', ownerId: 'q1'});
  setDisposition(skeleton, 'b', {class: 'represented', representedBy: ['q2'], basis: 'q2 asks the same method'});
  return skeleton;
}
const run = (record, extra = {}) => checkClosure({record, project: project([owner('q1'), owner('q2')]), projectSha256: LIVE, screenRows, screenSha256: SCREEN, isRatingBound: bound, ...extra});
const kinds = result => result.blocking.map(row => row.kind);

test('a fully dispositioned pool on the current screen closes', () => {
  const record = closedRecord(), result = run(record);
  assert.equal(result.closed, true, JSON.stringify(result.blocking));
  assert.deepEqual(result.counts, {selected: 1, represented: 1, ineligible: 1});
  assert.equal(record.rows.find(row => row.id === 'c').basis, 'screen:excluded-provider');
});

test('pending and unused-eligible rows block', () => {
  const pending = closedRecord(); pending.rows[0] = {...pending.rows[0], class: 'pending'}; delete pending.rows[0].ownerId;
  assert.deepEqual(kinds(run(pending)), ['pending']);
  const unused = closedRecord(); setDisposition(unused, 'a', {class: 'unused-eligible', basis: 'new method not yet covered'});
  assert.ok(kinds(run(unused)).includes('unused-eligible'));
  const cosmeticPending = closedRecord(); setDisposition(cosmeticPending, 'b', {class: 'unused-eligible', basis: 'gap'}); markCosmetic(cosmeticPending, 'b', 'label held');
  assert.ok(kinds(run(cosmeticPending)).includes('unused-eligible'));
});

test('a count or hash mismatch with the screen blocks', () => {
  const record = closedRecord();
  assert.deepEqual(kinds(run(record, {screenSha256: '0'.repeat(64)})), ['screen-hash']);
  assert.ok(kinds(run(record, {screenRows: [...screenRows, {id: 'd', status: 'allowed-label-ready'}]})).includes('screen-count'));
  const short = closedRecord(); short.rows.pop();
  assert.ok(kinds(run(short)).includes('screen-count'));
});

test('an owner id missing from the Exam section blocks', () => {
  const record = closedRecord(); setDisposition(record, 'b', {class: 'represented', representedBy: ['routine'], basis: 'practice only'});
  assert.deepEqual(kinds(run(record)), ['unknown-owner']);
});

test('a label-only mismatch on an existing owner is cosmetic; on a new owner it blocks', () => {
  const live = project([sample('q1'), owner('q2')]);
  const record = closedRecord(live), result = run(record, {project: live});
  assert.equal(result.closed, true, JSON.stringify(result.blocking));
  assert.equal(result.nonBlocking.find(row => row.kind === 'cosmetic-label').ownerId, 'q1');
  const fresh = checkClosure({record: closedRecord(project([owner('q2')])), project: project([owner('q2')]), candidate: project([sample('q1'), owner('q2')]), projectSha256: LIVE, screenRows, screenSha256: SCREEN, isRatingBound: bound});
  assert.deepEqual(kinds(fresh), ['new-owner-guard']);
});

test('missing workingSpace none blocks', () => {
  const live = project([owner('q1'), owner('q2')]); delete live.sections[1].workingSpace;
  assert.deepEqual(kinds(run(closedRecord(live), {project: live})), ['working-space']);
});

test('a stale revision or sha blocks, and so does a candidate on another base', () => {
  assert.deepEqual(kinds(run(closedRecord(), {project: project([owner('q1'), owner('q2')], 8)})), ['stale-revision']);
  assert.deepEqual(kinds(run(closedRecord(), {projectSha256: 'd'.repeat(64)})), ['stale-revision']);
  assert.deepEqual(kinds(run(closedRecord(), {candidate: project([owner('q1'), owner('q2')], 6)})), ['candidate-base']);
});

test('an unbound Exam rating blocks; practice-phase holds never block', () => {
  assert.deepEqual(kinds(run(closedRecord(), {isRatingBound: block => block.id !== 'q2'})), ['rating-unbound']);
  const result = run(closedRecord(), {isRatingBound: block => block.id !== 'routine', practiceBlocks: p => p.sections[0].blocks});
  assert.equal(result.closed, true);
  assert.equal(result.nonBlocking.find(row => row.kind === 'practice-rating').count, 1);
});

test('importPriorDispositions maps known strings and leaves unmapped ones pending', () => {
  const skeleton = buildClosureSkeleton({projectId: 'p', project: project([owner('q1')]), projectSha256: LIVE, screenRows, screen: {sha256: SCREEN}});
  const prior = [
    {sourceId: 'a', disposition: 'represented-by-existing-owner', representedBy: ['q1'], basis: 'same method'},
    {sourceId: 'b', disposition: 'blocked-mystery', representedBy: ['q1'], basis: 'x'},
    {sourceId: 'c', disposition: 'represented-by-existing-owner', representedBy: ['q1'], basis: 'screen excludes it'},
    {sourceId: 'z', disposition: 'represented-by-existing-owner', representedBy: ['q1'], basis: 'old screen only'},
  ];
  const {record, report} = importPriorDispositions(skeleton, prior, {'represented-by-existing-owner': 'represented'});
  assert.equal(record.rows.find(row => row.id === 'a').class, 'represented');
  assert.equal(record.rows.find(row => row.id === 'b').class, 'pending');
  assert.equal(record.rows.find(row => row.id === 'c').class, 'ineligible');
  assert.deepEqual(report.unmapped, [{id: 'b', disposition: 'blocked-mystery'}]);
  assert.deepEqual(report.notInScreen.map(row => row.id), ['z']);
  assert.equal(skeleton.rows.find(row => row.id === 'a').class, 'pending');
  assert.throws(() => setDisposition(record, 'b', {class: 'faulty', fault: 'wrong answer'}), /action/);
});

test('the registry refuses a second open proposal and amends the open one', () => {
  const input = {projectId: 'p', fromRevision: 7, candidateFile: 'c1.json', candidateSha256: 'a'.repeat(64), ownerIds: ['q1'], closureRecord: 'closure.json'};
  const opened = openOrAmend(null, input, {at: 't0'});
  assert.equal(opened.status, 'open');
  assert.throws(() => openOrAmend(opened, {...input, candidateFile: 'c2.json'}), /already has an open proposal/);
  const amended = openOrAmend(opened, {...input, candidateFile: 'c2.json', candidateSha256: 'b'.repeat(64), ownerIds: ['q1', 'q3']}, {amend: true, at: 't1'});
  assert.equal(amended.candidateFile, 'c2.json');
  assert.deepEqual(amended.history.at(-1).addedOwners, ['q3']);
  assert.equal(amended.history.at(-1).previous.candidateFile, 'c1.json');
  assert.throws(() => markSaved(amended, {publishResult: {projectId: 'p', from: 6, to: 7, readback: true}}), /does not match/);
  const saved = markSaved(amended, {publishResult: {projectId: 'p', from: 7, to: 8, readback: true, savedSha256: 'c'.repeat(64), savedAt: 't2'}});
  assert.equal(saved.status, 'saved');
  assert.equal(saved.saved.revision, 8);
  assert.equal(openOrAmend(saved, {...input, fromRevision: 8}, {at: 't3'}).status, 'open');
});

test('legacy proposals are recorded as saved only when the live owners prove it', () => {
  const legacy = {projectId: 'p', legacyFile: 'x-unsent.json', legacySha256: 'a'.repeat(64), ownerIds: ['q1', 'q2'], savedCommit: 'de11ce96', liveRevision: 9, legacyFromRevision: 8};
  assert.equal(importLegacy(null, {...legacy, liveOwnerIds: ['q1']}).proven, false);
  const {entry, proven} = importLegacy(null, {...legacy, liveOwnerIds: ['q1', 'q2']});
  assert.equal(proven, true);
  assert.equal(entry.status, 'saved');
  assert.match(entry.history[0].note, /de11ce96/);
});

// Split pairs (6 November 2026): one record on the parent's screen covers both halves.
test('a split pair closes as one unit, with owners in either half', () => {
  const one = {...project([owner('q1')]), id: 'p'}, PART2 = 'd'.repeat(64);
  const two = {...project([owner('q2')], 1), id: 'p-2', source: {partition: {parentProjectId: 'p'}}};
  const record = buildClosureSkeleton({projectId: 'p', project: one, projectSha256: LIVE, screenRows, screen: {file: 'screen.json', sha256: SCREEN}, members: [{project: one, sha256: LIVE}, {project: two, sha256: PART2}]});
  setDisposition(record, 'a', {class: 'selected', ownerId: 'q1'});
  setDisposition(record, 'b', {class: 'represented', representedBy: ['q2'], basis: 'q2 asks the same method'});
  const check = (checked, sha, sibling, siblingSha, extra = {}) => checkClosure({record, project: checked, projectSha256: sha, siblings: [{project: sibling, sha256: siblingSha}], screenRows, screenSha256: SCREEN, isRatingBound: bound, ...extra});
  assert.equal(check(one, LIVE, two, PART2).closed, true);
  assert.equal(check(two, PART2, one, LIVE).closed, true);
  // Without its sibling, part 1 alone cannot close the pair.
  const alone = checkClosure({record, project: one, projectSha256: LIVE, screenRows, screenSha256: SCREEN, isRatingBound: bound});
  assert.ok(kinds(alone).includes('pair-member-missing') && kinds(alone).includes('unknown-owner'));
  // A changed part 2 makes the record stale until it is rebased for that member.
  assert.ok(kinds(check(one, LIVE, two, 'c'.repeat(64))).includes('stale-revision'));
  const rebased = rebaseClosureRecord(record, {revision: 2, sha256: 'c'.repeat(64), projectId: 'p-2'});
  assert.equal(rebased.liveSha256, LIVE);
  assert.deepEqual(rebased.members.map(m => m.liveRevision), [7, 2]);
  assert.throws(() => buildClosureSkeleton({projectId: 'p', project: one, projectSha256: LIVE, screenRows, members: [{project: one, sha256: LIVE}, {project: {...two, source: {}}, sha256: PART2}]}), /parent and its part 2/);
});
