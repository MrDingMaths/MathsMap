import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { COMPACT_REVIEW_PROFILE, expandCompactReviewAssertions, preflightCompactReview } from '../scripts/content/campaign-compact-review.mjs';
import { receiptBinding } from '../scripts/content/campaign-lean.mjs';
import { hashValue, capturePair, readSkill } from '../scripts/content/campaign-support.mjs';
import { scopeDependencies } from '../scripts/content/campaign-sources.mjs';
const pair = { content: { theory: { intro: 'Compare values.', facts: ['Use a number line.'] }, practice: { foundation: [{ question_text: 'Compare 3 and 5.', solution_text: '3 < 5.' }] } }, quiz: { questions: [{ id: 'q1', question_text: 'Which is greater?', options: [{ text: '5', correct: true }, { text: '3', why: '3 is smaller.' }] }] } };
function result() { return { outcomes: [{ where: 'practice.foundation[0]', verdict: 'accepted', independentSolution: '3 lies before 5, so 3 < 5.', observation: 'All givens/method/scope checked.' }, { where: 'quiz.q1', verdict: 'accepted', independentSolution: '5 is larger since 5−3=2>0.', observation: 'Complete item and source method checked.', optionSet: { orderedTruths: [true, false], checkedEveryOption: true, checkedEveryExplanation: true, observation: 'Both ordered options were independently checked: 5 exceeds 3; the smaller-value distractor and its stated reason agree.' } }], theoryObservation: 'Number-line comparison supports the whole item.', sourceObservation: 'Complete source teaching checked.', metrics: { reviewerIdentity: '/root/reviewer', workerId: 'reviewer', sessionId: 'review-session', model: 'gpt-6.1-sol', effort: 'medium', requestedServiceTier: 'default', nativeInterface: 'collaboration' } }; }
function fixture(t) {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compact-review-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
 const write = (p, value) => { const file = path.join(root, p); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value)); };
 const source = 'booklets/mathsmap-sources/Stage 4/Numbers.md'; fs.mkdirSync(path.dirname(path.join(root, source)), { recursive: true }); fs.writeFileSync(path.join(root, source), '# Compare\nUse a number line.\n');
 write('data/skills.json', [{ id: 'child', prereqs: [] }]); for (const name of ['topics', 'courses', 'dotpoints']) write('data/' + name + '.json', []);
 const profile = { model: 'gpt-6.1-sol', effort: 'medium', requestedServiceTier: 'default', maxWorkers: 3, executionOverrideProfile: 'user-requested-sol61-medium-v1', reasoningOverride: { effort: 'medium', reason: 'Explicit user choice.' } };
 const ledger = 'booklets/provenance/content-campaign/test/'; write(ledger + 'campaign.json', { skillIds: ['child'], profile });
 write('public/content/child.json', pair.content); write('public/quizzes/child.json', pair.quiz); write('work/candidate.json', pair); write('work/baseline.json', pair);
 const refs = [{ path: source, startLine: 1, endLine: 3 }], scope = { topicId: 'numbers', stage: 4 }, expected = capturePair(root, 'child').expected;
 const state = { skillId: 'child', status: 'staged', scope, sources: refs, baseline: expected, owner: { role: 'review', workerId: 'reviewer', assignmentId: 'assignment', profile, workerLineage: { profile: 'stable-worker-lineage-v1', kind: 'native', actorId: '/root/reviewer' }, prepared: { snapshotPath: 'work/candidate.json', sources: refs, expected, dependencyHash: scopeDependencies(root, 'child', scope, refs).hash, workerLineage: { profile: 'stable-worker-lineage-v1', kind: 'native', actorId: '/root/reviewer' } } }, stage: { hash: 'stage', candidateHash: hashValue(pair), candidatePath: 'work/candidate.json', baselinePath: 'work/baseline.json', author: 'author', authorSessionId: 'author', workerLineage: { profile: 'stable-worker-lineage-v1', kind: 'native', actorId: '/root/author' }, expected, sourceReview: refs, removals: [] } };
 write(ledger + 'skills/child.json', state);
 return { root, state: readSkill(root, 'test', 'child'), write, source, ledgerFile: path.join(root, ledger + 'skills/child.json') };
}
test('expands only supplied truths, observations and exceptions without mutating compact input', () => {
 const input = result(), before = JSON.stringify(input); input.outcomes[1].optionSet.exceptions = [{ index: 1, observation: 'The printed reason correctly identifies 3 as smaller.' }];
 const expanded = expandCompactReviewAssertions(pair, pair, input);
 assert.deepEqual(expanded.outcomes[1].options.map(row => row.mathematicallyCorrect), [true, false]);
 assert.match(expanded.outcomes[1].options[1].observation, /Option 2: The printed reason/); assert.equal(expanded.outcomes[1].optionSet, undefined);
 assert.ok(input.outcomes[1].optionSet); assert.equal(before, JSON.stringify(result()));
 const opposite = result(); opposite.outcomes[1].optionSet.orderedTruths = [false, true];
 assert.deepEqual(expandCompactReviewAssertions(pair, pair, opposite).outcomes[1].options.map(row => row.mathematicallyCorrect), [false, true], 'candidate correct markers do not establish truth');
});
test('rejects incomplete checks/vectors, ambiguous arrays and duplicate/foreign exceptions', () => {
 const mutations = [r => delete r.outcomes[1].optionSet.checkedEveryExplanation, r => r.outcomes[1].optionSet.checkedEveryOption = false, r => r.outcomes[1].optionSet.observation = ' ', r => r.outcomes[1].optionSet.orderedTruths = [true], r => r.outcomes[1].optionSet.orderedTruths = [true, 0], r => delete r.outcomes[1].optionSet.orderedTruths[0], r => r.outcomes[1].options = [], r => r.outcomes[1].optionSet.exceptions = [{ index: 2, observation: 'Unknown.' }], r => r.outcomes[1].optionSet.exceptions = [{ index: 0, observation: 'A' }, { index: 0, observation: 'B' }], r => r.outcomes[1].optionSet.exceptions = [{ index: 1, observation: ' ', mathematicallyCorrect: true }], r => r.outcomes[0].optionSet = r.outcomes[1].optionSet, r => r.outcomes.push(structuredClone(r.outcomes[0]))];
 for (const mutate of mutations) { const input = result(); mutate(input); assert.throws(() => expandCompactReviewAssertions(pair, pair, input)); }
});
test('removed original quizzes use their own ordered option count and supplied assertions', () => {
 const input = result(); input.removals = [{ where: 'quiz.q1', accepted: true, independentSolution: '5 exceeds 3.', observation: 'Original disposition checked.', optionSet: structuredClone(input.outcomes[1].optionSet) }];
 const expanded = expandCompactReviewAssertions(pair, pair, input); assert.equal(expanded.removals[0].options.length, 2); assert.equal(expanded.removals[0].accepted, true);
 const different = structuredClone(pair); different.quiz.questions[0].options.push({ text: '4' }); assert.throws(() => expandCompactReviewAssertions(pair, different, input), /every ordered option/);
});
test('normal preflight binds option hashes and preserves ledger/candidate bytes on success and failures', t => {
 const f = fixture(t), input = { profile: COMPACT_REVIEW_PROFILE, binding: receiptBinding(f.root, f.state), result: result() }, before = fs.readFileSync(f.ledgerFile), candidate = fs.readFileSync(path.join(f.root, 'work/candidate.json'));
 const checked = preflightCompactReview(f.root, f.state, input); assert.equal(checked.acceptanceGranted, false); assert.equal(checked.receiptStructureOnly, true); assert.equal(checked.result.outcomes[1].options[1].hash, hashValue(pair.quiz.questions[0].options[1]));
 for (const mutate of [r => r.binding.assignmentId = 'foreign', r => r.binding.workerLineage.actorId = '/root/author', r => r.result.outcomes[1].optionSet.orderedTruths = [false, true], r => delete r.result.outcomes[0].independentSolution, r => r.result.outcomes[0].verdict = undefined, r => delete r.result.sourceObservation, r => r.result.metrics.reviewerIdentity = '/root/foreign', r => r.result.metrics.effort = 'high', r => r.result.metrics.sessionId = 'author']) { const bad = structuredClone(input); mutate(bad); assert.throws(() => preflightCompactReview(f.root, f.state, bad)); }
 assert.throws(() => preflightCompactReview(f.root, f.state, { ...input, profile: undefined }), /profile/);
 assert.deepEqual(fs.readFileSync(f.ledgerFile), before); assert.deepEqual(fs.readFileSync(path.join(f.root, 'work/candidate.json')), candidate);
});
test('native independence, current source and candidate hashes remain mandatory', t => {
 const f = fixture(t), input = { profile: COMPACT_REVIEW_PROFILE, binding: receiptBinding(f.root, f.state), result: result() }, before = fs.readFileSync(f.ledgerFile);
 const sameActor = structuredClone(f.state); sameActor.owner.workerLineage.actorId = '/root/author'; assert.throws(() => preflightCompactReview(f.root, sameActor, input), /Independent/);
 fs.appendFileSync(path.join(f.root, f.source), 'Changed teaching.'); assert.throws(() => preflightCompactReview(f.root, f.state, input), /Stale.*dependencies/);
 assert.deepEqual(fs.readFileSync(f.ledgerFile), before);
 fs.writeFileSync(path.join(f.root, f.source), '# Compare\nUse a number line.\n');
 const changed = structuredClone(pair); changed.quiz.questions[0].options.reverse(); f.write('work/candidate.json', changed); assert.throws(() => preflightCompactReview(f.root, f.state, input), /Stale staged snapshot/);
 assert.deepEqual(fs.readFileSync(f.ledgerFile), before);
});

test('CLI compact adapter writes a normal guarded envelope without changing the ledger', t => {
 const f=fixture(t),input={profile:COMPACT_REVIEW_PROFILE,binding:receiptBinding(f.root,f.state),result:result()};
 f.write('work/compact.json',input);
 const output=path.join(f.root,'work/checked.json'),before=fs.readFileSync(f.ledgerFile);
 const args=['scripts/content/campaign-lean-cli.mjs','preflight-compact-review','--profile','lazy-campaign-delta-v1','--root',f.root,'--campaign','test','--skill','child','--input',path.join(f.root,'work/compact.json'),'--out',output];
 const call=spawnSync(process.execPath,args,{encoding:'utf8'});
 assert.equal(call.status,0,call.stderr);const checked=JSON.parse(fs.readFileSync(output));
 assert.equal(checked.profile,'lazy-campaign-delta-v1');assert.equal(checked.acceptanceGranted,false);
 assert.deepEqual(checked.result.outcomes[1].options.map(o=>o.mathematicallyCorrect),[true,false]);
 assert.deepEqual(fs.readFileSync(f.ledgerFile),before);
 const repeat=spawnSync(process.execPath,args,{encoding:'utf8'});assert.notEqual(repeat.status,0);
 assert.deepEqual(fs.readFileSync(f.ledgerFile),before);
});




