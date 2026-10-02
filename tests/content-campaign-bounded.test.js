import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { wholeItemBatches, applyAssessmentPatches, aggregateExampleBatches, validateBatchReview, validateAggregateChecks, assertMethodCoverage, reviewDependencyHash, compactContext, compactAuthorSourceContext, expandAuthorSourceContext, methodMappingBatches, runBoundedAssignment, loadSourceEvidence } from '../scripts/content/campaign-bounded.mjs';
import { assessmentItems, hashValue } from '../scripts/content/campaign-support.mjs';

const method = { id: 'add', description: 'Add the two quantities.', sourceRefs: [0] };
const metadataFixture = () => JSON.parse(fs.readFileSync(new URL('./fixtures/content-campaign/source-metadata-refs-v1.json', import.meta.url)));

test('actual mixed-method quiz coverage includes its whole question/options, independent answer and separately grouped examples', () => {
  const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/content-campaign/mixed-method-evidence.json',import.meta.url)));
  const {evidence,jobs}=methodMappingBatches(fixture.items,fixture.coverage,fixture.outcomes,{scope:{stage:3}},{maxVariableChars:6000});
  assert.deepEqual(jobs.flatMap(job=>job.items).map(row=>row.where).sort(),fixture.items.map(row=>row.where).sort());
  const job=jobs.find(job=>job.items.some(row=>row.where==='quiz.m1'));
  assert.equal(job.requiredMethodIds.length,2);
  const owned=job.items.find(row=>row.where==='quiz.m1'),original=fixture.items.find(row=>row.where===owned.where),outcome=fixture.outcomes.find(row=>row.where===owned.where);
  assert.equal(JSON.stringify(owned.value.question),JSON.stringify(original.value),'all question fields/options/reasons remain whole');
  assert.equal(owned.value.independentSolution,outcome.independentSolution);assert.equal(owned.value.independentObservation,outcome.observation);
  assert.equal(job.independentMethodExamples.length,2,'the two separate single-method examples support the mixed-method question');
  for(const id of job.requiredMethodIds)assert.ok(job.independentMethodExamples.some(row=>row.value.methods.includes(id)));
  for(const example of job.independentMethodExamples){const actual=fixture.items.find(row=>row.where===example.where),review=fixture.outcomes.find(row=>row.where===example.where);assert.deepEqual(example.value.question,actual.value);assert.equal(example.value.independentSolution,review.independentSolution);assert.equal(example.value.independentVerdict,review.verdict);}
  assert.equal(evidence.length,fixture.items.length);for(const packet of jobs)assert.ok(JSON.stringify(packet).length<=6000);
});

test('method mapping dispatch rejects absent or stale independent working and missing supporting examples', () => {
  const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/content-campaign/mixed-method-evidence.json',import.meta.url)));
  let outcomes=structuredClone(fixture.outcomes);outcomes[0].hash='stale';assert.throws(()=>methodMappingBatches(fixture.items,fixture.coverage,outcomes,{}),/Missing actual independent method evidence/);
  outcomes=structuredClone(fixture.outcomes);outcomes[0].independentSolution='';assert.throws(()=>methodMappingBatches(fixture.items,fixture.coverage,outcomes,{}),/Missing actual independent method evidence/);
  const items=fixture.items.filter(row=>row.where!=='theory.workedExamples[1]');assert.throws(()=>methodMappingBatches(items,fixture.coverage,fixture.outcomes,{}),/Missing independently derived method example/);
});

test('actual 23-item author context deduplicates metadata losslessly into three whole-item batches', () => {
  const {context,items}=metadataFixture(), compact=compactAuthorSourceContext(context,'source-metadata-refs-v1',context.sourceEvidence);
  assert.equal(items.length,23);
  assert.deepEqual(compact.sourceEvidence,context.sourceEvidence);
  assert.equal(JSON.stringify(expandAuthorSourceContext(compact)),JSON.stringify(context),'complete original metadata order and bytes recover exactly');
  assert.deepEqual(compact.methods,context.methods);assert.deepEqual(compact.scope,context.scope);assert.deepEqual(compact.context,context.context);
  const before=wholeItemBatches(items,context),after=wholeItemBatches(items,compact);
  assert.equal(before.length,15);assert.equal(after.length,3);assert.deepEqual(after.map(b=>b.items.length),[14,7,2]);
  assert.deepEqual(after.flatMap(b=>b.items),items);
  for(const batch of after){assert.ok(JSON.stringify(batch).length<=24000);assert.deepEqual(expandAuthorSourceContext(batch).sourceEvidence,context.sourceEvidence);}
  compact.sourceReview.forEach((row,index)=>{assert.deepEqual(row.observation,context.sourceReview[index].observation);assert.deepEqual(row.adjustments,context.sourceReview[index].adjustments);assert.equal(row.support,context.sourceReview[index].support);});
  const gap=compact.sourceReview[1].unavailableImages[0];assert.equal(gap.accepted,true);assert.equal(gap.observation,context.sourceReview[1].unavailableImages[0].observation);assert.equal(gap.sourceEvidenceIndex,1);assert.equal(gap.unavailableImageIndex,0);
  assert.ok(context.sourceEvidence[1].unavailableImages[0].reason);assert.ok(context.sourceEvidence[1].unavailableImages[0].textAlternative);
  assert.deepEqual(expandAuthorSourceContext({...compact,items}).items,items,'all whole item solutions/options retain original bytes');
});

test('metadata references reject stale identities, altered figures/gaps and ambiguous source spans', () => {
  const {context}=metadataFixture(), compact=value=>compactAuthorSourceContext(value,'source-metadata-refs-v1',value.sourceEvidence);
  let value=structuredClone(context);value.sourceRefs[0].hash='stale';assert.throws(()=>compact(value),/exact source metadata reference/);
  value=structuredClone(context);value.sourceRefs[2].images=[];assert.throws(()=>compact(value),/Changed source images/);
  value=structuredClone(context);value.sourceReview[1].unavailableImages[0].reason+=' Invented';assert.throws(()=>compact(value),/source gap reference/);
  value=structuredClone(context);value.sourceReview[1].unavailableImages[0].textAlternativeLocator.startLine++;assert.throws(()=>compact(value),/source gap reference|Changed source gap metadata/);
  value=structuredClone(context);value.sourceEvidence.push(structuredClone(value.sourceEvidence[0]));assert.throws(()=>compact(value),/Ambiguous duplicate/);
});

test('legacy profiles and incomplete/split source contexts keep their exact payloads', () => {
  const {context}=metadataFixture();assert.equal(compactAuthorSourceContext(context,undefined,context.sourceEvidence),context);
  assert.equal(compactAuthorSourceContext(context,'future-profile',context.sourceEvidence),context);
  const split={...context,sourceContextReviews:[{where:'source[0]',accepted:true}],sourceEvidence:[]};assert.equal(compactAuthorSourceContext(split,'source-metadata-refs-v1',context.sourceEvidence),split);
  const partial={...context,sourceEvidence:context.sourceEvidence.slice(0,2)};assert.equal(compactAuthorSourceContext(partial,'source-metadata-refs-v1',context.sourceEvidence),partial);
  const changed=structuredClone(context);changed.sourceEvidence[0].excerpt+=' Changed';assert.equal(compactAuthorSourceContext(changed,'source-metadata-refs-v1',context.sourceEvidence),changed);
});
const example = { question_text: 'Calculate $8+3$.', solution_text: '$8+3$\n$=11$' };
function pair() {
  const card = n => ({ question_text: 'Source context. '.repeat(160) + `Calculate $${n}+2$.`, solution_text: `$${n}+2$\n$=${n + 2}$`, relevantTheory: ['Addition'], structure: 'add' });
  return { content: { skillId: 'first', retainedMetadata: { stable: true }, theory: { intro: 'Add quantities.', steps: ['Addition'], workedExamples: [example] }, practice: { foundation: [card(3), card(4)], development: [], coverageNote: 'A narrow method.' } }, quiz: { skillId: 'first', questions: [{ id: 'q1', ...card(5), options: [{ text: '$7$', correct: true }, { text: '$6$', why: 'Added only one.' }, { text: '$5$', why: 'Did not add.' }] }] } };
}
const assessment = value => assessmentItems(value.content, value.quiz, false).filter(item => item.kind !== 'example');
const coverage = value => ({ methods: [method], items: assessmentItems(value.content, value.quiz, false).map(item => ({ where: item.where, hash: item.hash, methods: ['add'] })) });
const review = items => ({ outcomes: items.map(item => { const [, first, second] = item.value.question_text.match(/\$(\d+)\+(\d+)\$/); return { where: item.where, hash: item.hash, verdict: 'accepted', independentSolution: `$${first}+${second}=${Number(first) + Number(second)}$`, observation: 'The addition, language and scope agree.', ...(item.kind === 'quiz' ? { options: item.value.options.map(option => ({ hash: hashValue(option), mathematicallyCorrect: option.correct === true, observation: 'Recomputed this option and checked its reason.' })) } : {}) }; }), findings: [], flaggedDiagrams: [] });

function setup(t, role = 'author') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'campaign-bounded-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, value) => { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), JSON.stringify(value)); };
  const value = pair(), sources = [{ path: 'source.md', hash: 'source-v1', excerpt: '# Key Ideas\nAdd quantities.\n# Example\n$8+3=11$\n# Practice\n$5+2$' }];
  write('snapshot.json', value); write('baseline.json', value); write('packet.json', { context: { stage: 4, title: 'Addition' }, sourceEvidence: sources });
  const prepared = { campaignId: 'test', packets: [{ path: 'packet.json' }], sourceReferences: [{ path: 'source.md', hash: 'source-v1' }] };
  const state = { skillId: 'first', scope: { stage: 4 }, pending: [], owner: { role, workerId: role + '-owner', prepared: { snapshotPath: 'snapshot.json' } }, stage: role === 'review' ? { author: 'author-owner', authorSessionId: 'author-session', metrics: { sessions: ['author-session'] }, baselinePath: 'baseline.json', hash: 'stage-v1', coverage: coverage(value), removals: [] } : null };
  const out = path.join(root, '.agywork/content-campaign/test/first/assignment/attempt');
  return { root, prepared, state, out, write, value };
}
function mockWorker(calls) {
  return async options => {
    const payload = JSON.parse(options.prompt.split('\n').at(-1)), kind = options.stage.replace('content-bounded-', ''); calls.push({ kind, payload, options });
    let result;
    if (kind === 'plan') result = { methods: [method], sourceReview: [{ path: 'source.md', hash: 'source-v1', locator: 'Key Ideas, Example and Practice', support: 'direct', observation: 'Directly teaches adding.', adjustments: 'Retained addition, varied numbers.' }], substantiveCorrections: [] };
    else if (kind === 'author') result = { patches: [], coverage: payload.items.map(item => ({ where: item.where, hash: item.hash, methods: ['add'] })), methods: [], substantiveCorrections: [] };
    else if (kind === 'examples') result = { examples: [example], coverage: [{ where: 'theory.workedExamples[0]', methods: ['add'] }], substantiveCorrections: [] };
    else if (kind === 'review') result = review(payload.items);
    else if (kind === 'review-theory' || kind === 'review-theory-source') result = { theoryObservation: 'The supplied theory uses the taught addition sequence.', sourceObservation: 'The supplied source supports the theory.', findings: [], flaggedDiagrams: [] };
    else if (kind === 'review-headers' || kind === 'review-coverage') result = { checks: payload.items.map(item => ({ where: item.where, hash: item.hash, accepted: true, observation: 'Checked this exact header or explicit method mapping.' })), theoryObservation: 'All owned headers agree with the taught steps.', sourceObservation: 'All owned mappings agree with their explicit method and source.', findings: [], flaggedDiagrams: [] };
    else throw new Error('Unexpected test job ' + kind);
    return { result, metrics: { observedModel: 'gpt-6.1-sol', effort: 'high', serviceTier: 'default', sessionId: options.profile + '-independent-' + calls.length, usage: { input_tokens: 25 } } };
  };
}

test('opt-in dispatch compacts only complete author/examples contexts and retains full assembled source review', async t => {
  const f=setup(t),packet=JSON.parse(fs.readFileSync(path.join(f.root,'packet.json'))),source={...packet.sourceEvidence[0],startLine:1,endLine:5,images:[{path:'figure.png',hash:'unchanged-figure'}]};
  f.write('packet.json',{...packet,sourceEvidence:[source]});f.prepared.sourceReferences=[source];f.state.owner.prepared.boundedContextProfile='source-metadata-refs-v1';
  const calls=[],worker=mockWorker(calls),reply=await runBoundedAssignment({...f,runner:worker,concurrency:1,maxVariableChars:10000});
  assert.equal(calls.find(c=>c.kind==='plan').payload.boundedContextProfile,undefined);
  for(const call of calls.filter(c=>['author','examples'].includes(c.kind))){
    assert.equal(call.payload.boundedContextProfile,'source-metadata-refs-v1');assert.equal(call.payload.sourceRefs[0].sourceEvidenceIndex,0);
    assert.deepEqual(call.options.images,[path.join(f.root,'figure.png')]);assert.equal(expandAuthorSourceContext(call.payload).sourceReview[0].path,'source.md');
  }
  assert.equal(reply.result.sourceReview[0].path,'source.md');assert.equal(reply.result.sourceReview[0].observation,'Directly teaches adding.');assert.equal(reply.result.sourceReview[0].sourceEvidenceIndex,undefined);
  const priorTickets=reply.attempts.map(a=>({inputHash:a.inputHash,outputPath:a.outputPath})),again=await runBoundedAssignment({...f,runner:()=>assert.fail('Unchanged profiled resume must reuse successful jobs'),concurrency:1,maxVariableChars:10000});
  assert.ok(again.attempts.every(a=>a.reused));assert.deepEqual(again.attempts.map(a=>({inputHash:a.inputHash,outputPath:a.outputPath})),priorTickets);
});

test('existing no-profile prepared author jobs preserve exact prompts and cache identities on resume', async t => {
  const f=setup(t),calls=[],first=await runBoundedAssignment({...f,runner:mockWorker(calls),concurrency:1,maxVariableChars:7000});
  assert.ok(calls.every(c=>c.payload.boundedContextProfile===undefined));
  const originalPrompts=first.attempts.map(a=>fs.readFileSync(path.join(f.root,a.outputPath,'prompt.txt'),'utf8'));
  const again=await runBoundedAssignment({...f,runner:()=>assert.fail('Legacy successful jobs must not dispatch again'),concurrency:1,maxVariableChars:7000});
  assert.deepEqual(again.attempts.map(a=>a.inputHash),first.attempts.map(a=>a.inputHash));assert.deepEqual(again.attempts.map(a=>fs.readFileSync(path.join(f.root,a.outputPath,'prompt.txt'),'utf8')),originalPrompts);
});

test('profiled preparations reject changed actual sources before dispatch and leave review contexts legacy', async t => {
  const f=setup(t),raw='# Key Ideas\nAdd quantities.\n# Example\n$8+3=11$\n# Practice';fs.writeFileSync(path.join(f.root,'source.md'),raw);
  const source={path:'source.md',hash:hashValue(raw),startLine:1,endLine:5,excerpt:raw,images:[],support:'direct',locator:'Complete addition teaching'};
  f.write('complete-source.json',[source]);f.prepared.sourceEvidencePath='complete-source.json';f.prepared.sourceEvidenceHash=hashValue([source]);f.prepared.sourceReferences=[source];f.state.owner.prepared.boundedContextProfile='source-metadata-refs-v1';
  fs.appendFileSync(path.join(f.root,'source.md'),'\nChanged teaching.');
  await assert.rejects(runBoundedAssignment({...f,runner:()=>assert.fail('Changed source must block before any call'),concurrency:1}),/Missing\/stale hash/);
  const reviewFixture=setup(t,'review'),calls=[];reviewFixture.state.owner.prepared.boundedContextProfile='source-metadata-refs-v1';
  await runBoundedAssignment({...reviewFixture,runner:mockWorker(calls),concurrency:1,maxVariableChars:7000});assert.ok(calls.every(c=>c.payload.boundedContextProfile===undefined),'independent review/global contexts keep original format');
});

test('bounded source loading preserves explicit unavailable illustrations and independently reviews each decision', async t => {
  const { root, prepared, state, out, write } = setup(t, 'review'), calls = [];
  const sourcePath = 'syllabus/Stage 3 Content.md', raw = '# Addition\n![Counters](media/counters.png)\nEight counters and three more make eleven counters.';
  fs.mkdirSync(path.join(root, 'syllabus'), { recursive: true }); fs.writeFileSync(path.join(root, sourcePath), raw);
  const gap = { path: 'syllabus/media/counters.png', nonessential: true, reason: 'The full long description supplies every counter quantity; actual booklet working is supplied.', textAlternative: 'Eight counters and three more make eleven counters.', accepted: true, observation: 'No figure-only givens are used.' };
  const source = { path: sourcePath, hash: hashValue(raw), startLine: 1, endLine: 3, locator: 'Addition description', excerpt: raw, images: [], unavailableImages: [gap] };
  write('complete-source.json', [source]); prepared.sourceEvidencePath = 'complete-source.json'; prepared.sourceEvidenceHash = hashValue([source]); prepared.sourceReferences = [source]; state.stage.sourceReview = [source];
  assert.deepEqual(loadSourceEvidence(root, prepared, state, [JSON.parse(fs.readFileSync(path.join(root, 'packet.json')))]), [source]);
  const mock = mockWorker(calls), runner = async options => {
    const reply = await mock(options), payload = calls.at(-1).payload;
    if (options.stage === 'content-bounded-review-theory') {
      assert.deepEqual(payload.sourceEvidence[0].unavailableImages, [gap]);
      reply.result.sourceImageReviews = [{ sourceIndex: 0, imagePath: gap.path, accepted: true, observation: 'Independently checked that the full long description and actual booklet working provide all required quantities.' }];
    }
    return reply;
  };
  const complete = await runBoundedAssignment({ root, prepared, state, out, runner, concurrency: 1 });
  assert.equal(complete.result.sourceImageReviews.length, 1); assert.equal(complete.result.sourceImageReviews[0].accepted, true); assert.ok(complete.result.sourceImageReviews[0].decisionHash);
  fs.mkdirSync(path.join(root, 'syllabus/media'), { recursive: true }); fs.writeFileSync(path.join(root, gap.path), 'New source image');
  assert.throws(() => loadSourceEvidence(root, prepared, state, []), /now exists/);
});

test('bounded whole-item dispatch keeps complete solutions/options, records explicit indivisible exceptions', () => {
  const items = assessment(pair()), batches = wholeItemBatches(items, { context: 'Addition' }, { maxVariableChars: 7000 });
  assert.equal(batches.length, 2); assert.deepEqual(batches.flatMap(batch => batch.items), items);
  assert.deepEqual(batches.at(-1).items.at(-1).value.options, items.at(-1).value.options);
  assert.throws(() => wholeItemBatches(items, {}, { maxVariableChars: 1000 }), /Indivisible oversized/);
  const exception = { reason: 'The single linked geometry task and options share inseparable givens.', indivisible: true };
  const excepted = wholeItemBatches([items[0]], {}, { maxVariableChars: 1000, oversizeExceptions: { [items[0].where]: exception } });
  assert.equal(excepted[0].budgetException.reason, exception.reason);
});

test('whole assessment patch aggregation preserves metadata and order and rejects stale/duplicate/foreign patches', () => {
  const value = pair(), items = assessment(value), patched = { ...items[0].value, solution_text: '$3+2=5$' };
  const payload = { patches: [{ where: items[0].where, beforeHash: items[0].hash, operation: 'replace', value: patched }], coverage: items.map(item => ({ where: item.where, methods: ['add'] })), methods: [] };
  const result = applyAssessmentPatches(value, [{ items, result: payload }]);
  assert.deepEqual(result.content.retainedMetadata, value.content.retainedMetadata); assert.deepEqual(result.content.practice.foundation[1], value.content.practice.foundation[1]); assert.deepEqual(result.quiz, value.quiz);
  assert.equal(result.content.practice.foundation[0].solution_text, '$3+2=5$'); assert.equal(hashValue(value), hashValue(pair()));
  for (const corrupt of ['stale', 'duplicate', 'foreign']) {
    const broken = structuredClone(payload);
    if (corrupt === 'stale') broken.patches[0].beforeHash = 'stale';
    if (corrupt === 'duplicate') broken.patches.push(broken.patches[0]);
    if (corrupt === 'foreign') broken.patches[0].where = 'quiz.unknown';
    assert.throws(() => applyAssessmentPatches(value, [{ items, result: broken }]), /stale|Duplicate|Foreign/);
  }
  const changedId = structuredClone(payload); changedId.patches = [{ where: 'quiz.q1', beforeHash: items.at(-1).hash, operation: 'replace', value: { ...value.quiz.questions[0], id: 'new-id' } }];
  assert.throws(() => applyAssessmentPatches(value, [{ items, result: changedId }]), /stable ID/);
});

test('coverage and independent MCQ aggregation reject missing methods/options and malformed duplicate or stale outcomes', () => {
  const value = pair(), items = assessmentItems(value.content, value.quiz, false), complete = review(items);
  validateBatchReview(items, complete); assertMethodCoverage(value.content, value.quiz, coverage(value));
  const missingExample = coverage(value); missingExample.items.find(row => row.where.startsWith('theory.')).methods = ['other']; missingExample.methods.push({ ...method, id: 'other' });
  assert.throws(() => assertMethodCoverage(value.content, value.quiz, missingExample), /no example/);
  for (const mutation of ['missing', 'duplicate', 'stale', 'options', 'wrong-marker', 'malformed']) {
    const broken = structuredClone(complete);
    if (mutation === 'missing') broken.outcomes.pop();
    if (mutation === 'duplicate') broken.outcomes.push(broken.outcomes[0]);
    if (mutation === 'stale') broken.outcomes[0].hash = 'stale';
    if (mutation === 'options') broken.outcomes.find(row => row.options).options.pop();
    if (mutation === 'wrong-marker') broken.outcomes.find(row => row.options).options[1].mathematicallyCorrect = true;
    if (mutation === 'malformed') broken.outcomes[0].independentSolution = '';
    assert.throws(() => validateBatchReview(items, broken), /Incomplete|Duplicate|stale|Every MCQ|unique correct/);
  }
});

test('coordinator normalizes omitted bookkeeping hashes and owned aliases without mutating raw worker output', () => {
  const value = pair(), items = assessmentItems(value.content, value.quiz, false).map(item => item.kind === 'quiz' ? { ...item, quizIndex: 0 } : item), raw = review(items);
  raw.outcomes.forEach(row => { delete row.hash; row.options?.forEach(option => delete option.hash); });
  raw.outcomes[0].where = 'candidateContent.practice.foundation[0]'; raw.outcomes.find(row => row.where === 'quiz.q1').where = 'candidateQuiz.questions[0]';
  const normalized = validateBatchReview(items, raw);
  assert.equal(normalized.outcomes[0].where, 'practice.foundation[0]'); assert.equal(normalized.outcomes[0].hash, items[0].hash);
  assert.equal(normalized.outcomes.find(row => row.where === 'quiz.q1').options[0].hash, hashValue(value.quiz.questions[0].options[0]));
  assert.equal(raw.outcomes[0].hash, undefined); assert.equal(raw.outcomes[0].where, 'candidateContent.practice.foundation[0]');
  const wrongIndex = structuredClone(raw); wrongIndex.outcomes.find(row => row.where.startsWith('candidateQuiz')).where = 'candidateQuiz.questions[4]';
  assert.throws(() => validateBatchReview(items, wrongIndex), /Unknown\/ambiguous/);
});

test('math dependency hashes invalidate source, theory and methods, while unrelated items/example wording preserve evidence for fresh coverage review', () => {
  const value = pair(), items = assessmentItems(value.content, value.quiz, false), item = items[0];
  const context = { theory: value.content.theory, sourceEvidence: [{ hash: 'source-v1' }], sourceRefs: [], scope: { stage: 4 }, coverage: coverage(value), examples: items.filter(item => item.kind === 'example') };
  const baseline = reviewDependencyHash(item, context), unrelated = structuredClone(context); unrelated.coverage.items[1].hash = 'changed';
  assert.equal(reviewDependencyHash(item, unrelated), baseline);
  const exampleChanged = structuredClone(context); exampleChanged.examples[0].hash = 'changed'; assert.equal(reviewDependencyHash(item, exampleChanged), baseline);
  const metadataChanged = structuredClone(context); metadataChanged.sourceEvidence[0].observation = 'Rephrased metadata'; assert.equal(reviewDependencyHash(item, metadataChanged), baseline);
  for (const mutation of ['source', 'theory', 'method']) {
    const changed = structuredClone(context);
    if (mutation === 'source') changed.sourceEvidence[0].hash = 'source-v2';
    if (mutation === 'theory') changed.theory.steps = ['Changed method'];
    if (mutation === 'method') changed.coverage.methods[0].description = 'Subtract';
    assert.notEqual(reviewDependencyHash(item, changed), baseline);
  }
});

test('mock workers author two bounded batches and independently review all final items; publication stays with canonical engine', async t => {
  const f = setup(t), calls = [], runner = mockWorker(calls);
  const authored = await runBoundedAssignment({ ...f, runner, maxVariableChars: 7000, concurrency: 2 });
  assert.equal(calls.filter(call => call.kind === 'author').length, 2); assert.deepEqual(authored.result.candidateContent, f.value.content); assert.deepEqual(authored.result.candidateQuiz, f.value.quiz);
  assert.equal(authored.metrics.workerCalls, calls.length); assert.equal(authored.metrics.availableUsage.length, calls.length);
  assert.equal(fs.existsSync(path.join(f.root, 'public')), false);
  const reviewState = { ...f.state, owner: { ...f.state.owner, role: 'review', workerId: 'review-owner' }, stage: { author: 'author-owner', authorSessionId: authored.metrics.sessionId, metrics: authored.metrics, hash: 'final-stage', coverage: authored.result.coverage, baselinePath: 'baseline.json', removals: [] } };
  const reviewed = await runBoundedAssignment({ ...f, state: reviewState, runner: mockWorker([]), maxVariableChars: 7000 });
  assert.equal(reviewed.result.stageHash, 'final-stage'); assert.equal(reviewed.result.outcomes.length, 4); assert.ok(reviewed.result.outcomes.find(row => row.where === 'quiz.q1').options.length === 3);
  assert.equal(fs.existsSync(path.join(f.root, 'public')), false);
});

test('large divisible example collections are authored in whole-example batches and assembled without full-pair responses', async t => {
  const f = setup(t), next = structuredClone(f.value);
  next.content.theory.workedExamples = [0, 1, 2].map(index => ({ question_text: 'Example source setting. '.repeat(110) + `Calculate $${8 + index}+3$.`, solution_text: `$${8 + index}+3$\n$=${11 + index}$` }));
  f.write('snapshot.json', next); f.write('baseline.json', next);
  const calls = [], ordinary = mockWorker(calls);
  const runner = async options => {
    const payload = JSON.parse(options.prompt.split('\n').at(-1));
    if (options.stage !== 'content-bounded-examples' || payload.phase !== 'retain-existing') return ordinary(options);
    calls.push({ kind: 'examples', payload });
    return { result: { examples: payload.items.map(item => item.value), coverage: payload.items.map((item, index) => ({ where: `theory.workedExamples[${index}]`, methods: ['add'] })), substantiveCorrections: [] }, metrics: { sessionId: 'retention-' + calls.length } };
  };
  const authored = await runBoundedAssignment({ ...f, runner, maxVariableChars: 7000 });
  const batches = calls.filter(call => call.kind === 'examples'); assert.equal(batches.length, 2);
  assert.ok(batches.every(call => JSON.stringify(call.payload).length <= 7000));
  assert.deepEqual(authored.result.candidateContent.theory.workedExamples, next.content.theory.workedExamples);
  assert.equal(authored.result.coverage.items.filter(row => row.where.startsWith('theory.')).length, 3);
  assert.ok(calls.every(call => !call.payload.candidateContent && !call.payload.candidateQuiz));
});

test('successful unchanged review evidence is reused; one repaired item invalidates only its review and aggregate theory headers', async t => {
  const f = setup(t, 'review'), calls = [];
  const first = await runBoundedAssignment({ ...f, runner: mockWorker(calls), maxVariableChars: 7000 }); assert.ok(first.metrics.workerCalls > 0);
  const second = await runBoundedAssignment({ ...f, runner: () => { throw new Error('Unchanged accepted evidence should reuse'); }, maxVariableChars: 7000 });
  assert.equal(second.metrics.workerCalls, 0); assert.equal(second.result.outcomes.length, 4);
  const next = structuredClone(f.value); next.content.practice.foundation[0].solution_text += '\nChecked addition.'; f.write('snapshot.json', next);
  f.state.stage.hash = 'stage-v2'; f.state.stage.coverage = coverage(next);
  const repairCalls = [], repaired = await runBoundedAssignment({ ...f, runner: mockWorker(repairCalls), maxVariableChars: 7000 });
  assert.equal(repairCalls.filter(call => call.kind === 'review').length, 1); assert.equal(repairCalls.find(call => call.kind === 'review').payload.items.length, 1);
  assert.equal(repaired.result.stageHash, 'stage-v2'); assert.equal(repaired.result.outcomes.length, 4);
  f.prepared.sourceReferences[0].hash = 'source-v2';
  const invalidated = [], sourceChanged = await runBoundedAssignment({ ...f, runner: mockWorker(invalidated), maxVariableChars: 7000 });
  assert.ok(invalidated.filter(call => call.kind === 'review').length > 0); assert.ok(sourceChanged.metrics.workerCalls > 1);
});

test('an example-only numeric repair preserves assessment outcomes and refreshes the example plus current coverage review', async t => {
  const f = setup(t, 'review'); await runBoundedAssignment({ ...f, runner: mockWorker([]), maxVariableChars: 7000 });
  const next = structuredClone(f.value); next.content.theory.workedExamples[0].question_text = 'Calculate $8+4$.'; next.content.theory.workedExamples[0].solution_text = '$8+4$\n$=12$';
  f.write('snapshot.json', next); f.state.stage.hash = 'example-repair-stage'; f.state.stage.coverage = coverage(next);
  const calls = [], result = await runBoundedAssignment({ ...f, runner: mockWorker(calls), maxVariableChars: 7000 });
  assert.deepEqual(calls.filter(call => call.kind === 'review').flatMap(call => call.payload.items.map(item => item.where)), ['theory.workedExamples[0]']);
  assert.equal(calls.filter(call => call.kind === 'review-theory').length, 1); assert.equal(result.result.outcomes.length, 4);
  assert.equal(result.result.stageHash, 'example-repair-stage');
});

test('removed original quiz receives an independent full solution and every option before aggregation', async t => {
  const f = setup(t, 'review'), next = structuredClone(f.value), originalQuiz = assessment(f.value).find(item => item.where === 'quiz.q1');
  next.quiz.questions = []; f.write('snapshot.json', next); f.state.stage.coverage = coverage(next); f.state.stage.removals = [{ where: originalQuiz.where, hash: originalQuiz.hash, reason: 'Redundant repeated item without added coverage.' }];
  const calls = [], ordinary = mockWorker(calls);
  const runner = async options => {
    if (options.stage !== 'content-bounded-review-removals') return ordinary(options);
    const payload = JSON.parse(options.prompt.split('\n').at(-1)); calls.push({ kind: 'review-removals', payload });
    const outcomes = review(payload.items).outcomes.map(({ verdict, ...row }) => ({ ...row, accepted: true }));
    return { result: { removals: outcomes, findings: [] }, metrics: { sessionId: 'independent-removal-session' } };
  };
  const result = await runBoundedAssignment({ ...f, runner, maxVariableChars: 7000 });
  assert.equal(result.result.removals.length, 1); assert.equal(result.result.removals[0].options.length, 3); assert.ok(result.result.removals[0].independentSolution);
  assert.deepEqual(calls.find(call => call.kind === 'review-removals').payload.items[0].value, originalQuiz.value);
});

test('review refuses author sessions and fail-stops malformed evidence before a third undiagnosed attempt', async t => {
  const f = setup(t, 'review'); let calls = 0;
  const worker = async () => { calls++; return { result: { outcomes: [] }, metrics: { sessionId: 'independent-failure', usage: { input_tokens: 7 } } }; };
  for (let index = 0; index < 2; index++) await assert.rejects(runBoundedAssignment({ ...f, runner: worker, concurrency: 1, maxVariableChars: 7000 }), /Incomplete/);
  await assert.rejects(runBoundedAssignment({ ...f, runner: worker, concurrency: 1, maxVariableChars: 7000 }), /before a third/); assert.equal(calls, 2);
  const other = setup(t, 'review');
  await assert.rejects(runBoundedAssignment({ ...other, concurrency: 1, maxVariableChars: 7000, runner: async options => ({ ...await mockWorker([])(options), metrics: { sessionId: 'author-session' } }) }), /independent author sessions/);
});

test('a budget refusal preserves its preflight attempt without counting an external model call', async t => {
  const f = setup(t, 'review');
  await assert.rejects(runBoundedAssignment({ ...f, concurrency: 1, maxVariableChars: 7000, runner: async () => { const error = new Error('Paid-call budget reached'); error.metrics = { externalModelCalls: 0, dispatched: false }; throw error; } }), error => {
    assert.equal(error.metrics.workerCalls, 0); assert.equal(error.metrics.undispatchedCalls, 1); assert.deepEqual(error.metrics.availableUsage, []); assert.equal(error.boundedAttempts.length, 1);
    assert.equal(error.boundedAttempts[0].metrics.externalModelCalls, 0); assert.ok(fs.existsSync(path.join(f.root, error.boundedAttempts[0].outputPath, 'ticket.json'))); return true;
  });
});

test('repeated undispatched budget checkpoints preserve receipts without requiring failure diagnosis', async t => {
  const f = setup(t), refusal = async () => { const error = new Error('Intentional paid-call checkpoint'); error.metrics = { externalModelCalls: 0, dispatched: false }; throw error; };
  for (let index = 0; index < 3; index++) await assert.rejects(runBoundedAssignment({ ...f, runner: refusal, concurrency: 1, maxVariableChars: 7000 }), /Intentional paid-call checkpoint/);
  const calls = [], complete = await runBoundedAssignment({ ...f, runner: mockWorker(calls), concurrency: 1, maxVariableChars: 7000 });
  assert.ok(complete.metrics.workerCalls > 0); assert.equal(calls[0].kind, 'plan');
  const dir = path.join(f.root, '.agywork/content-campaign/test/first/bounded-evidence');
  const records = fs.readdirSync(dir).flatMap(name => fs.readdirSync(path.join(dir, name)).filter(file => file.endsWith('.json')).map(file => JSON.parse(fs.readFileSync(path.join(dir, name, file)))));
  assert.equal(records.filter(record => !record.ok && record.metrics?.externalModelCalls === 0).length, 3, 'immutable undispatched receipts remain available');
});

test('repair batches count only the prepared targeted review before sizing, without repeating unowned passing traces', async t => {
  const f = setup(t), scopedOutcome = { where: 'practice.foundation[0]', hash: assessment(f.value)[0].hash, verdict: 'repair', independentSolution: 'Required correction. '.repeat(140), observation: 'Targeted working needs repair.' };
  f.state.review = { outcomes: assessment(f.value).map(item => ({ where: item.where, verdict: 'accepted', independentSolution: 'UNOWNED PASSING TRACE '.repeat(2000) })) };
  f.write('packet.json', { context: { stage: 4 }, sourceEvidence: [{ path: 'source.md', hash: 'source-v1', excerpt: 'Add quantities using $8+3=11$.' }], previousReview: { reviewer: 'previous-reviewer', outcomes: [scopedOutcome], findings: [] } });
  const calls = []; await runBoundedAssignment({ ...f, runner: mockWorker(calls), maxVariableChars: 7000 });
  const batches = calls.filter(call => call.kind === 'author'); assert.ok(batches.every(call => JSON.stringify(call.payload).length <= 7000));
  assert.equal(batches[0].payload.items.length, 1); assert.equal(batches[0].payload.items[0].priorReview.independentSolution, scopedOutcome.independentSolution);
  assert.ok(calls.every(call => !JSON.stringify(call.payload).includes('UNOWNED PASSING TRACE')));
});

test('legacy prepared example jobs retain their exact payload and paid cache despite an existing targeted example review', async t => {
  const f=setup(t),outcome={where:'theory.workedExamples[0]',verdict:'repair',independentSolution:'Legacy targeted example working.',observation:'Preserve the old packet format.'};
  f.write('packet.json',{context:{stage:4},sourceEvidence:[{path:'source.md',hash:'source-v1',excerpt:'Add quantities using $8+3=11$.'}],previousReview:{reviewer:'previous-reviewer',outcomes:[outcome],findings:[]}});
  const calls=[],first=await runBoundedAssignment({...f,runner:mockWorker(calls),maxVariableChars:7000});
  const exampleJob=calls.find(call=>call.kind==='examples');assert.deepEqual(exampleJob.payload.existingExamples,assessmentItems(f.value.content,f.value.quiz,false).filter(item=>item.kind==='example'));
  assert.equal(exampleJob.payload.existingExamples[0].priorReview,undefined,'a no-profile historical lease cannot gain new example payload metadata');
  const resumed=await runBoundedAssignment({...f,runner:()=>assert.fail('Unchanged legacy cache must remain reusable'),maxVariableChars:7000});
  assert.deepEqual(resumed.result,first.result);assert.equal(resumed.metrics.workerCalls,0);
});

test('large coverage/header collections receive complete bounded checks and a compact final teaching summary', async t => {
  const f = setup(t, 'review'), next = structuredClone(f.value);
  next.content.practice.foundation = Array.from({ length: 120 }, (_, index) => ({ question_text: `Calculate $${index + 3}+2$.`, solution_text: `**Addition**\n$${index + 3}+2=${index + 5}$`, relevantTheory: ['Addition'] }));
  f.write('snapshot.json', next); f.write('baseline.json', next); f.state.stage.coverage = coverage(next);
  // Keep the full MCQ and its independent example in the synthetic small
  // budget; the 120-item collection still requires separate bounded checks.
  const calls = [], reviewed = await runBoundedAssignment({ ...f, runner: mockWorker(calls), maxVariableChars: 5000 });
  const expected = assessmentItems(next.content, next.quiz, false).map(item => item.where);
  for (const kind of ['review-headers', 'review-coverage']) { const actual = calls.filter(call => call.kind === kind).flatMap(call => call.payload.items.map(item => item.where)); assert.deepEqual([...actual].sort(), [...expected].sort()); assert.equal(new Set(actual).size, expected.length); }
  assert.ok(calls.every(call => JSON.stringify(call.payload).length <= 5000));
  const finalCall = calls.find(call => call.kind === 'review-theory-source'), summary = finalCall.payload.aggregateReview; assert.equal(summary.headerChecks, expected.length); assert.equal(summary.mappingChecks, expected.length);
  assert.equal(finalCall.payload.reviewPhase, 'source-theory-after-independent-item-header-and-mapping-review');
  assert.deepEqual(finalCall.payload.methods, f.state.stage.coverage.methods);
  assert.deepEqual(finalCall.payload.rejectedAggregateChecks, []);
  assert.match(finalCall.options.prompt, /Do not claim to have read or derived those separately reviewed questions/);
  assert.equal(reviewed.result.outcomes.length, expected.length); assert.equal(reviewed.result.stageHash, f.state.stage.hash);
  assert.throws(() => validateAggregateChecks([{ where: 'practice.foundation[0]', hash: 'h' }], { checks: [], theoryObservation: 'Claimed count.' }, 'theoryObservation'), /Incomplete aggregate/);
});

test('a fitting theory review receives each complete example body with its independent working', async t => {
  const f = setup(t, 'review'), calls = [];
  await runBoundedAssignment({ ...f, runner: mockWorker(calls) });
  const final = calls.find(call => call.kind === 'review-theory');
  assert.deepEqual(final.payload.examples.map(item => item.value), f.value.content.theory.workedExamples);
  assert.equal(final.payload.independentExampleReviews.length, 1);
  assert.match(final.payload.independentExampleReviews[0].independentSolution, /8\+3=11/);
});

test('split source-only review carries actual rejected header/mapping checks and cannot grant steps acceptance', async t => {
  for (const rejectedKind of ['review-headers', 'review-coverage']) {
    const f = setup(t, 'review'), next = structuredClone(f.value);
    next.content.practice.foundation = Array.from({ length: 64 }, (_, index) => ({ question_text: `Calculate $${index + 3}+2$.`, solution_text: `**Addition**\n$${index + 3}+2=${index + 5}$`, relevantTheory: ['Addition'] }));
    f.write('snapshot.json', next); f.state.stage.coverage = coverage(next);
    const calls = [], mock = mockWorker(calls);
    const reviewed = await runBoundedAssignment({ ...f, maxVariableChars: 5000, runner: async options => {
      const reply = await mock(options), call = calls.at(-1);
      if (call.kind === rejectedKind) {
        const check = reply.result.checks.find(check => check.where === 'practice.foundation[0]');
        if (check) { check.accepted = false; check.observation = 'Exact independent rejection: required working is missing.'; }
      }
      if (call.kind === 'review-theory-source') {
        assert.equal(call.payload.aggregateReview.rejectedChecks, 1);
        assert.equal(call.payload.rejectedAggregateChecks.length, 1);
        assert.equal(call.payload.rejectedAggregateChecks[0].where, 'practice.foundation[0]');
        assert.equal(call.payload.rejectedAggregateChecks[0].observation, 'Exact independent rejection: required working is missing.');
        assert.ok(call.payload.sourceEvidence[0].excerpt.includes('$8+3=11$'));
        reply.result.stepsRepair = { accepted: true, reason: 'Mock source-supported change, separate from header/mapping acceptance.' };
      }
      return reply;
    } });
    assert.equal(reviewed.result.stepsRepair.accepted, false);
    assert.ok(reviewed.result.findings.some(row => row.description.includes('required working is missing')));
  }
});

test('complete immutable source evidence is verified and grouped without dropping curated sections that fit no item packet', async t => {
  const f = setup(t), sources = [];
  for (let index = 0; index < 4; index++) {
    const name = `source-${index}.md`, excerpt = '# Key Ideas, Example and Practice\n' + 'Combine the two quantities by adding them. '.repeat(60) + '$8+3=11$';
    fs.writeFileSync(path.join(f.root, name), excerpt); sources.push({ path: name, hash: hashValue(excerpt), startLine: 1, endLine: 2, excerpt, excerptHash: hashValue(excerpt), rawExcerptHash: hashValue(excerpt), images: [] });
  }
  f.write('sources.json', sources); f.prepared.sourceEvidencePath = 'sources.json'; f.prepared.sourceEvidenceHash = hashValue(sources); f.prepared.sourceReferences = sources.map(({ excerpt, ...source }) => source);
  f.write('packet.json', { context: { stage: 4 }, sourceEvidence: [] });
  const calls = [], ordinary = mockWorker(calls);
  const runner = async options => {
    const payload = JSON.parse(options.prompt.split('\n').at(-1)), kind = options.stage.replace('content-bounded-', '');
    if (kind === 'source-context') { calls.push({ kind, payload }); return { result: { checks: payload.items.map(item => ({ where: item.where, hash: item.hash, accepted: true, support: 'direct', locator: 'Key Ideas, Example and Practice, lines 1–2', observation: 'Source teaches combining both quantities by addition.', adjustments: 'Keep addition with varied examples.', methods: [{ id: 'add', description: method.description }] })), theoryObservation: 'Every owned source section was read.', findings: [] }, metrics: { sessionId: 'source-context-' + calls.length } }; }
    if (kind === 'plan') { calls.push({ kind, payload }); return { result: { methods: [{ ...method, sourceRefs: [0,1,2,3] }], sourceReview: payload.sourceRefs.map(ref => ({ ...ref, locator: 'Key Ideas, Example and Practice, lines 1–2', support: 'direct', observation: 'The complete section teaches addition.', adjustments: 'Retain the taught addition sequence.' })), substantiveCorrections: [] }, metrics: { sessionId: 'source-plan' } }; }
    return ordinary(options);
  };
  const authored = await runBoundedAssignment({ ...f, runner, maxVariableChars: 7000 });
  const sourceCalls = calls.filter(call => call.kind === 'source-context'); assert.ok(sourceCalls.length > 1);
  assert.deepEqual(sourceCalls.flatMap(call => call.payload.items.map(item => item.value.path)).sort(), sources.map(source => source.path).sort());
  assert.ok(calls.every(call => JSON.stringify(call.payload).length <= 7000)); assert.equal(authored.result.sourceReview.length, 4);
  fs.appendFileSync(path.join(f.root, sources[0].path), '\nChanged source');
  await assert.rejects(runBoundedAssignment({ ...f, runner: () => { throw new Error('Stale evidence must fail before a paid call'); }, maxVariableChars: 7000 }), /stale|Stale/);
});

test('context compaction retains all stage boundaries, blurbs and prerequisite teaching while removing duplicate role metadata', () => {
  const related = { id: 'prereq', title: 'Add', stage: 3, blurb: 'Combine two quantities.' }, theory = { intro: 'Add quantities.', steps: ['Combine'] };
  const compact = compactContext({ skill: { id: 'current', stage: 4 }, prereqs: [related], siblings: [related], dependents: [related], prerequisiteTheory: [{ id: 'prereq', theory }] });
  assert.deepEqual(compact.relatedSkills, [related]); assert.deepEqual(compact.prerequisiteTheory, [{ id: 'prereq', theory }]); assert.equal(compact.relatedSkills[0].stage, 3);
});

test('split borrowed source readings each receive the actual governing syllabus without duplicating owned checks', async t => {
  const f = setup(t), sources = [];
  for (let index = 0; index < 3; index++) {
    const name = `booklet-${index}.md`, excerpt = '# Example and Practice\n' + 'Combine the two quantities by adding them. '.repeat(65) + '$8+3=11$';
    fs.writeFileSync(path.join(f.root, name), excerpt);
    sources.push({ path: name, hash: hashValue(excerpt), startLine: 1, endLine: 2, excerpt, images: [] });
  }
  const syllabus = { path: 'syllabus/Stage 3 Content.md', excerpt: 'Stage 3: add whole numbers using suitable strategies.', startLine: 1, endLine: 1, images: [] };
  fs.mkdirSync(path.join(f.root, 'syllabus')); fs.writeFileSync(path.join(f.root, syllabus.path), syllabus.excerpt); syllabus.hash = hashValue(syllabus.excerpt);
  sources.push(syllabus); f.state.scope.stage = 3;
  f.write('sources.json', sources); f.prepared.sourceEvidencePath = 'sources.json'; f.prepared.sourceEvidenceHash = hashValue(sources); f.prepared.sourceReferences = sources.map(({ excerpt, ...source }) => source);
  f.write('packet.json', { context: { stage: 3 }, sourceEvidence: [] });
  const calls = [], ordinary = mockWorker(calls), runner = async options => {
    const payload = JSON.parse(options.prompt.split('\n').at(-1)), kind = options.stage.replace('content-bounded-', '');
    if (kind === 'source-context') {
      calls.push({ kind, payload });
      assert.deepEqual(payload.sourceEvidence, [syllabus]);
      return { result: { checks: payload.items.map(item => ({ where: item.where, hash: item.hash, accepted: true, support: item.value.path === syllabus.path ? 'direct' : 'indirect', locator: 'Complete owned section', observation: 'Read actual Stage 3 scope and the owned taught addition.', adjustments: 'Borrow wording while retaining Stage 3 addition.', methods: [{ id: 'add', description: method.description }] })), theoryObservation: 'Owned sections checked against supplied scope.', findings: [] }, metrics: { sessionId: 'scope-reading-' + calls.length } };
    }
    if (kind === 'plan') {
      calls.push({ kind, payload });
      return { result: { methods: [{ ...method, sourceRefs: [0, 1, 2, 3] }], sourceReview: payload.sourceRefs.map(ref => ({ ...ref, support: ref.path === syllabus.path ? 'direct' : 'indirect', locator: 'Complete owned section', observation: 'The section supports the addition method.', adjustments: 'Retain Stage 3 addition.' })), substantiveCorrections: [] }, metrics: { sessionId: 'scope-plan' } };
    }
    return ordinary(options);
  };
  const authored = await runBoundedAssignment({ ...f, runner, maxVariableChars: 7000 });
  const readings = calls.filter(call => call.kind === 'source-context'); assert.ok(readings.length > 1);
  assert.deepEqual(readings.flatMap(call => call.payload.items.map(item => item.value.path)).sort(), sources.map(source => source.path).sort());
  assert.ok(calls.every(call => JSON.stringify(call.payload).length <= 7000)); assert.equal(authored.result.sourceReview.length, sources.length);
});

test('equal existing examples remain one-to-one, and legitimate omissions require baseline-bound removal records', async t => {
  const combined = aggregateExampleBatches([{ examples: [example], coverage: [{ where: 'theory.workedExamples[0]', methods: ['add'] }] }, { examples: [example], coverage: [{ where: 'theory.workedExamples[0]', methods: ['add'] }] }], [method]);
  assert.equal(combined.examples.length, 2); assert.deepEqual(combined.coverage.map(row => row.where), ['theory.workedExamples[0]', 'theory.workedExamples[1]']);
  const f = setup(t), next = structuredClone(f.value); next.content.theory.workedExamples.push({ question_text: 'Calculate $9+3$.', solution_text: '$9+3$\n$=12$' }); f.write('snapshot.json', next); f.write('baseline.json', next);
  await assert.rejects(runBoundedAssignment({ ...f, runner: mockWorker([]), maxVariableChars: 7000 }), /omitted without explicit/);
  const calls = [], ordinary = mockWorker(calls);
  const removedExample = assessmentItems(next.content, next.quiz, false).find(item => item.where === 'theory.workedExamples[1]');
  const runner = async options => {
    const response = await ordinary(options); if (options.stage === 'content-bounded-examples') response.result.removals = [{ where: removedExample.where, hash: removedExample.hash, reason: 'Fixture explicit removal of the redundant second example.' }]; return response;
  };
  const authored = await runBoundedAssignment({ ...f, runner, maxVariableChars: 7000 });
  assert.deepEqual(authored.result.removals, [{ where: removedExample.where, hash: removedExample.hash, reason: 'Fixture explicit removal of the redundant second example.' }]);
});

test('inherited visual obligations survive reuse of unchanged mathematical outcomes', async t => {
  const f = setup(t, 'review'); f.state.stage.reusedOutcomes = review(assessmentItems(f.value.content, f.value.quiz, false)).outcomes;
  f.state.stage.inheritedVisualFlags = ['practice.foundation[0].question_text'];
  const calls = [], reviewed = await runBoundedAssignment({ ...f, runner: mockWorker(calls), maxVariableChars: 7000 });
  assert.equal(calls.filter(call => call.kind === 'review').length, 0); assert.deepEqual(reviewed.result.flaggedDiagrams, ['practice.foundation[0].question_text']);
});

test('source bridge scope, method and correction hints survive inline metadata compaction without granting acceptance', async t => {
  const f = setup(t), hints = { scopeBoundary: 'Stage 4 inverse operations only.', correctionProvenance: 'Retain original source error; correct its arithmetic explicitly.', methodDistinctions: ['Divide before adding when the grouped expression was multiplied.'] };
  f.prepared.sourceReferences[0].selection = { path: 'source-selection.json', hash: 'selection-hash', status: 'candidate-only', hints };
  const calls = []; await runBoundedAssignment({ ...f, runner: mockWorker(calls), maxVariableChars: 7000 });
  assert.deepEqual(calls.find(call => call.kind === 'plan').payload.sourceSelection.hints, hints);
  assert.ok(calls.every(call => call.payload.sourceSelection.status === 'candidate-only'));
});


test('Medium bounded calls request explicit settings and keep High cache and receipts intact', async t => {
  const f=setup(t), high=await runBoundedAssignment({...f,runner:mockWorker([]),concurrency:1,maxVariableChars:7000});
  const {EXECUTION_OVERRIDE_PROFILE,CAMPAIGN_PROFILE}=await import('../scripts/content/campaign-execution-profile.mjs');
  f.state.owner.profile={...CAMPAIGN_PROFILE,effort:'medium',executionOverrideProfile:EXECUTION_OVERRIDE_PROFILE,reasoningOverride:{effort:'medium',reason:'switch model to gpt6.1 sol medium'}};
  const mock=mockWorker([]), calls=[];
  const medium=await runBoundedAssignment({...f,concurrency:1,maxVariableChars:7000,runner:async options=>{
    calls.push(options);assert.match(options.prompt,/Use gpt-6.1-sol medium, Standard/);assert.equal(options.configuration.effort,'medium');
    assert.equal(options.configuration.reasoningOverride.reason,'switch model to gpt6.1 sol medium');
    const reply=await mock(options);reply.metrics.effort='medium';return reply;
  }});
  assert.ok(calls.length>0);assert.equal(medium.metrics.effort,'medium');assert.equal(medium.metrics.reusedCalls,0);
  assert.equal(high.metrics.effort,'high');assert.ok(high.attempts.every(a=>!medium.attempts.some(b=>b.inputHash===a.inputHash)));
  const resumed=await runBoundedAssignment({...f,concurrency:1,maxVariableChars:7000,runner:()=>assert.fail('Medium resume must reuse its own cache')});
  assert.equal(resumed.metrics.workerCalls,0);assert.equal(resumed.metrics.effort,'medium');
  f.state.owner.profile.effort='low';await assert.rejects(runBoundedAssignment({...f,runner:mock}),/Invalid campaign execution profile/);
});
