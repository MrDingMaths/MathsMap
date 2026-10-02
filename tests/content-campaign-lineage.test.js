import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initCampaign, readCampaign, readSkill, nextAssignment, prepareAssignment, stageAssignment, recordReview, recordReviewProfile, recordVisualReview, recordRefreshedVisualReview, visualRefreshRevision, activateWorkerLineagePolicy, activateExecutionOverride, assessmentItems, capturePair, claimCoordinator, recordPaidCallCheckpoint, requestRepair } from '../scripts/content/campaign-support.mjs';
import { normalizeWorkerResult, runCampaign } from '../scripts/content/campaign-runner.mjs';
import { bindWorkerLineage, validateWorkerProvenance, validateVisualWorkerBinding } from '../scripts/content/campaign-lineage.mjs';
import { measureCampaignUsage } from '../scripts/content/campaign-measurement.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mathsmap-lineage-'));
  t.after(() => fs.rmSync(root, {recursive:true,force:true}));
  const write = (file,value) => {file=path.join(root,file);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file, typeof value==='string'?value:JSON.stringify(value));};
  write('data/courses.json',[{id:'s4',stage:4,order:1}]);write('data/topics.json',[{id:'t',stage:4,courses:['s4'],order:1}]);write('data/dotpoints.json',[{id:'dp',topicId:'t',text:'Add numbers.',order:1}]);
  write('data/skills.json',[{id:'first',stage:4,title:'Addition',dotPointIds:['dp'],prereqs:[]}]);
  const sourcePath='booklets/mathsmap-sources/Stage 4/Addition.md';write(sourcePath,'# Addition\n## Example\nCalculate $8+3$.\n$8+3=11$');
  write('scripts/agy/batches/done/test.json',{sections:[{skillIds:['first'],bookletPaths:[sourcePath]}]});
  const card=n=>({question_text:`Calculate $${n}+2$.`,structure:'add',solution_text:`$${n}+2$\n$=${n+2}$`});
  write('public/content/first.json',{skillId:'first',atomType:'T',theory:{intro:'Add numbers.',facts:['Addition combines quantities.']},practice:{foundation:[3,4,5].map(card),development:[6,7,8].map(card),masteryOmitted:'One operation.',coverageNote:'A narrow routine.'}});
  write('public/quizzes/first.json',{skillId:'first',coverageNote:'A narrow routine.',questions:[3,4,5].map((n,i)=>({id:'q'+(i+1),...card(n),mastery:false,options:[{text:`$${n+2}$`,correct:true},{text:`$${n+1}$`,why:'Added one instead of two.'},{text:`$${n}$`,why:'Did not add two.'}]}))});
  write('public/content-manifest.json',{content:{first:[3,3,0]},quiz:{first:[3,0]}});
  initCampaign(root,{campaignId:'test',expectedSkills:1,expectedExcluded:0});return {root,write,sourcePath};
}
const lineage = actorId => ({kind:'native',actorId});
const profile = (actor,role,workerId) => ({model:'gpt-6.1-sol',requestedModel:'gpt-6.1-sol',effort:'high',requestedServiceTier:'default',nativeInterface:'collaboration',workerId,sessionId:workerId,[role==='author'?'authorIdentity':'reviewerIdentity']:actor,provider:null,observedModel:null,serviceTier:null,speed:null,usage:null,externalModelCalls:0});
function reserve(root,workerId,role,actor) {const assignment=nextAssignment(root,{campaignId:'test',workerId,role,ids:['first'],...(actor?{workerLineage:lineage(actor)}:{})});if(assignment.skillId)prepareAssignment(root,{campaignId:'test',skillId:'first',workerId});return assignment;}
function author(root,sourcePath) {
  const pair=capturePair(root,'first');pair.content.theory.workedExamples=[{question_text:'Calculate $8+3$.',solution_text:'$8+3$\n$=11$'}];
  return normalizeWorkerResult(root,readSkill(root,'test','first'),{candidateContent:pair.content,candidateQuiz:pair.quiz,coverage:{methods:[{id:'add',description:'Add two numbers.',sourceRefs:[0]}],items:assessmentItems(pair.content,pair.quiz).filter(item=>item.kind!=='theory').map(item=>({where:item.where,methods:['add']}))},sourceReview:[{path:sourcePath,locator:'Complete addition example',support:'direct',observation:'The original example adds the two numbers.',adjustments:'Change the numbers while retaining the method.'}],removals:[],substantiveCorrections:[]});
}
function review(root) {
  const state=readSkill(root,'test','first'),pair=JSON.parse(fs.readFileSync(path.join(root,state.stage.candidatePath)));
  return normalizeWorkerResult(root,state,{outcomes:assessmentItems(pair.content,pair.quiz).filter(item=>item.kind!=='theory').map(item=>{const [a,b]=item.value.question_text.match(/\$(\d+)\+(\d+)\$/).slice(1).map(Number),sum=a+b;return {where:item.where,verdict:'accepted',independentSolution:`${a} plus ${b} equals ${sum}.`,observation:'Direct addition gives the displayed answer; the task is within the addition scope.',...(item.kind==='quiz'?{options:item.value.options.map(option=>({mathematicallyCorrect:Number(option.text.replaceAll('$',''))===sum,observation:'Compared this number with the independently calculated sum '+sum+'.'}))}:{})};}),theoryObservation:'Addition is sufficient for every whole item and example.',sourceObservation:'The source uses direct addition and familiar language.',findings:[]});
}
const stateBytes = root => fs.readFileSync(path.join(root,'booklets/provenance/content-campaign/test/skills/first.json'));
function staged(t) {const f=fixture(t);activateWorkerLineagePolicy(f.root,{campaignId:'test'});reserve(f.root,'author-uuid','author','/root/author');stageAssignment(f.root,{...author(f.root,f.sourcePath),campaignId:'test',skillId:'first',workerId:'author-uuid',metrics:profile('/root/author','author','author-uuid')});return f;}

test('strict fresh ownership freezes an actual coordinator actor and rejects missing/conflicting author aliases before staging',t=>{
  const {root,write,sourcePath}=fixture(t);activateWorkerLineagePolicy(root,{campaignId:'test'});
  assert.throws(()=>reserve(root,'uuid','author'),/Coordinator worker lineage/);assert.throws(()=>bindWorkerLineage(lineage('uuid')),/stable actual native/);
  const assignment=reserve(root,'uuid','author','/root/author');assert.deepEqual(readSkill(root,'test','first').owner.workerLineage,readSkill(root,'test','first').owner.prepared.workerLineage);
  const before=stateBytes(root),payload=author(root,sourcePath);
  for(const metrics of [null,{...profile('/root/author','author','uuid'),authorIdentity:undefined},{...profile('/root/other','author','uuid')},{...profile('/root/author','author','uuid'),reviewerIdentity:'/root/other'}]) assert.throws(()=>stageAssignment(root,{...payload,campaignId:'test',skillId:'first',workerId:'uuid',metrics}),/Missing native|Conflicting stable/);
  assert.deepEqual(stateBytes(root),before);assert.throws(()=>nextAssignment(root,{campaignId:'test',workerId:'uuid',workerLineage:lineage('/root/renamed')}),/Cannot replace/);
  const tampered=readSkill(root,'test','first');tampered.owner.workerLineage.actorId='/root/renamed';write('booklets/provenance/content-campaign/test/skills/first.json',tampered);assert.throws(()=>prepareAssignment(root,{campaignId:'test',skillId:'first',workerId:'uuid'}),/Cannot change prepared/);fs.writeFileSync(path.join(root,'booklets/provenance/content-campaign/test/skills/first.json'),before);
  stageAssignment(root,{...payload,campaignId:'test',skillId:'first',workerId:'uuid',metrics:profile('/root/author','author','uuid')});assert.equal(readSkill(root,'test','first').stage.workerLineage.actorId,'/root/author');assert.ok(assignment.assignmentId);
});
test('a new UUID cannot self-review; genuine different actor succeeds and conflicting profile aliases cannot overwrite identity',t=>{
  const {root}=staged(t);assert.match(reserve(root,'new-author-uuid','review','/root/author').blocked,/different stable/);
  reserve(root,'review-uuid','review','/root/reviewer');const payload=review(root),before=stateBytes(root),metrics=profile('/root/reviewer','review','review-uuid');
  for(const reviewerProfile of [{...metrics,reviewerIdentity:'/root/author'},{...metrics,reviewerIdentity:undefined},{...metrics,workerId:'other'}])assert.throws(()=>recordReview(root,{...payload,campaignId:'test',skillId:'first',workerId:'review-uuid',metrics,reviewerProfile}),/Conflicting stable|Missing native|identity mismatch/);
  assert.throws(()=>recordReview(root,{...payload,campaignId:'test',skillId:'first',workerId:'review-uuid',metrics:{...metrics,effort:'low'},reviewerProfile:metrics}),/Conflicting exposed/);assert.deepEqual(stateBytes(root),before);
  recordReview(root,{...payload,campaignId:'test',skillId:'first',workerId:'review-uuid',metrics,reviewerProfile:metrics});let state=readSkill(root,'test','first');assert.equal(state.status,'accepted');assert.equal(state.review.workerLineage.actorId,'/root/reviewer');assert.equal(state.review.outcomes.length,10);
  const accepted=stateBytes(root);for(const actor of ['/root/author','/root/third'])assert.throws(()=>recordReviewProfile(root,{campaignId:'test',skillId:'first',workerId:'review-uuid',stageHash:state.stage.hash,reviewerProfile:profile(actor,'review','review-uuid')}),/Conflicting stable/);assert.deepEqual(stateBytes(root),accepted);
  recordReviewProfile(root,{campaignId:'test',skillId:'first',workerId:'review-uuid',stageHash:state.stage.hash,reviewerProfile:{...metrics,note:'Actual native telemetry remains unavailable.'}});state=readSkill(root,'test','first');assert.equal(state.review.metrics.usage,null);assert.equal(state.review.provenanceHistory.length,1);
});
test('visual recording and refresh reject stable self-review and omitted lineage before artifacts or ledger mutation',t=>{
  const {root}=staged(t);reserve(root,'review-uuid','review','/root/reviewer');recordReview(root,{...review(root),campaignId:'test',skillId:'first',workerId:'review-uuid',reviewerProfile:profile('/root/reviewer','review','review-uuid')});
  const state=readSkill(root,'test','first'),before=stateBytes(root),args={campaignId:'test',skillId:'first',workerId:'visual-uuid',stageHash:state.stage.hash,visualReviews:[]};
  for(const p of [profile('/root/reviewer','review','visual-uuid'),{...profile('/root/author','review','visual-uuid'),workerLineage:bindWorkerLineage(lineage('/root/author'))}]) {
    assert.throws(()=>recordVisualReview(root,{...args,reviewerProfile:p}),/visual worker lineage|different stable/);
    assert.throws(()=>recordRefreshedVisualReview(root,{...args,candidateHash:state.stage.candidateHash,expectedVisualRevisionHash:visualRefreshRevision(state),reviewerProfile:p}),/visual worker lineage|different stable/);
  }
  const p={...profile('/root/reviewer','review','visual-uuid'),workerLineage:bindWorkerLineage(lineage('/root/reviewer'))};assert.equal(validateVisualWorkerBinding(state,'visual-uuid',p).actorId,'/root/reviewer');
  assert.equal(validateVisualWorkerBinding(state,'old-visual',profile('/root/old_reviewer','review','old-visual'),{historical:true}),null,'existing genuine historical profiles do not acquire a fabricated binding');assert.deepEqual(stateBytes(root),before);
});
test('activation preserves an existing prepared owner/cache and historical accepted evidence without inventing lineage',t=>{
  const {root,sourcePath}=fixture(t);reserve(root,'legacy','author');const original=stateBytes(root),prepared=readSkill(root,'test','first').owner.prepared;
  activateWorkerLineagePolicy(root,{campaignId:'test'});assert.deepEqual(stateBytes(root),original);assert.equal(nextAssignment(root,{campaignId:'test',workerId:'legacy'}).resumed,true);
  claimCoordinator(root,{campaignId:'test',skillId:'first',workerId:'legacy',runId:'checkpoint'});recordPaidCallCheckpoint(root,{campaignId:'test',skillId:'first',workerId:'legacy',runId:'checkpoint'});
  prepareAssignment(root,{campaignId:'test',skillId:'first',workerId:'legacy'});assert.equal(readSkill(root,'test','first').owner.prepared.workerLineage,undefined);assert.equal(readSkill(root,'test','first').owner.prepared.sourceEvidenceHash,prepared.sourceEvidenceHash);
  stageAssignment(root,{...author(root,sourcePath),campaignId:'test',skillId:'first',workerId:'legacy'});assert.equal(readSkill(root,'test','first').stage.workerLineage,undefined);
  reserve(root,'new-review','review','/root/reviewer');recordReview(root,{...review(root),campaignId:'test',skillId:'first',workerId:'new-review',reviewerProfile:profile('/root/reviewer','review','new-review')});
  const accepted=stateBytes(root),campaign=JSON.stringify(readCampaign(root,'test'));activateWorkerLineagePolicy(root,{campaignId:'test'});measureCampaignUsage(root,'test');assert.deepEqual(stateBytes(root),accepted);assert.equal(JSON.stringify(readCampaign(root,'test')),campaign);assert.equal(readSkill(root,'test','first').stage.metrics,null);
});
test('external strict provenance uses real provider sessions rather than assignment IDs and preserves their independence',()=>{
  const binding=bindWorkerLineage({kind:'external-ephemeral'}),state={owner:{workerLineage:binding,assignmentId:'assignment'},stage:{workerLineage:{...binding,sessionIds:['provider-author'],origin:'runner-reported-sessions'}}};
  const metrics={provider:'codex',model:'gpt-6.1-sol',effort:'high',sessionId:'provider-review',externalModelCalls:1};
  for(const m of [{...metrics,sessionId:'assignment'},{...metrics,sessionId:'worker'},{...metrics,sessionId:null},{...metrics,sessionId:'provider-author'}])assert.throws(()=>validateWorkerProvenance(state,{role:'review',workerId:'worker',metrics:m}),/provider session|different actual external/);
  assert.throws(()=>validateWorkerProvenance(state,{role:'review',workerId:'worker',metrics,profile:{sessionId:'invented'}}),/session alias/);
  assert.throws(()=>validateWorkerProvenance(state,{role:'review',workerId:'worker',metrics:{...metrics,authorIdentity:'/root/actor'}}),/masquerade/);
  assert.deepEqual(validateWorkerProvenance(state,{role:'review',workerId:'worker',metrics}).sessionIds,['provider-review']);
});
test('real strict runner integration preserves a native lease and records genuinely distinct external author/reviewer sessions',async t=>{
  const {root,sourcePath}=fixture(t);activateWorkerLineagePolicy(root,{campaignId:'test'});reserve(root,'native-owner','author','/root/author');
  const before=stateBytes(root);let calls=0;
  const noTakeover=await runCampaign(root,{campaignId:'test',ids:['first'],concurrency:1,runner:async()=>{calls++;throw Error('must not dispatch');}});
  assert.equal(noTakeover.calls,0);assert.equal(calls,0);assert.deepEqual(stateBytes(root),before);
  // Release only this synthetic owner, then let the real coordinator dispatch its
  // independently sessioned read-only fixture runner through both full APIs.
  const {releaseAssignment}=await import('../scripts/content/campaign-support.mjs');releaseAssignment(root,{campaignId:'test',skillId:'first',workerId:'native-owner',reason:'Fixture external integration test.'});
  const result=await runCampaign(root,{campaignId:'test',ids:['first'],concurrency:1,runner:async()=>{calls++;const state=readSkill(root,'test','first');return {result:state.owner.role==='author'?author(root,sourcePath):review(root),metrics:{provider:'codex',model:'gpt-6.1-sol',effort:'high',requestedServiceTier:'default',sessionId:'actual-provider-session-'+calls,callId:'actual-call-'+calls,usage:null}};}});
  assert.equal(result.calls,2);assert.equal(readSkill(root,'test','first').status,'accepted');assert.deepEqual(readSkill(root,'test','first').stage.workerLineage.sessionIds,['actual-provider-session-1']);assert.deepEqual(readSkill(root,'test','first').review.workerLineage.sessionIds,['actual-provider-session-2']);
  const usage=measureCampaignUsage(root,'test');assert.equal(usage.explicitExternalCalls,2);assert.equal(usage.recordedNativeAssignmentsMinimum,1,'the explicitly released native assignment remains a recorded job, not a model call');assert.equal(usage.externalCallsWithoutUsage,2);
});

test('partial repair by B retains known strict author A ancestry and blocks A renamed UUID across review/profile/visual guards',t=>{
  const {root,sourcePath}=staged(t);reserve(root,'first-review','review','/root/reviewer');recordReview(root,{...review(root),campaignId:'test',skillId:'first',workerId:'first-review',reviewerProfile:profile('/root/reviewer','review','first-review')});
  const original=readSkill(root,'test','first').stage,candidateBytes=fs.readFileSync(path.join(root,original.candidatePath));
  requestRepair(root,{campaignId:'test',skillId:'first',stageHash:original.hash,finding:'Explain the incorrect addition by one explicitly.',targets:['quiz.q1']});
  reserve(root,'repair-b','author','/root/repairer');const payload=author(root,sourcePath);payload.candidateQuiz.questions[0].options[1].why='Added $1$ instead of the required $2$.';delete payload.coverage.items.find(row=>row.where==='quiz.q1').hash;
  const normalized=normalizeWorkerResult(root,readSkill(root,'test','first'),payload);stageAssignment(root,{...normalized,campaignId:'test',skillId:'first',workerId:'repair-b',metrics:profile('/root/repairer','author','repair-b')});
  let state=readSkill(root,'test','first');assert.equal(state.stage.nativeAuthorLineage.length,1);assert.equal(state.stage.nativeAuthorLineage[0].workerLineage.actorId,'/root/author');assert.equal(state.stage.nativeAuthorLineage[0].stageHash,original.hash);assert.equal(state.stage.reusedOutcomes.length,9);assert.deepEqual(fs.readFileSync(path.join(root,original.candidatePath)),candidateBytes);
  assert.match(reserve(root,'renamed-a','review','/root/author').blocked,/different stable/);
  const before=stateBytes(root),visualProfile={...profile('/root/author','review','renamed-a'),workerLineage:bindWorkerLineage(lineage('/root/author'))};
  assert.throws(()=>validateVisualWorkerBinding(state,'renamed-a',visualProfile),/retained strict authorship/);
  assert.throws(()=>validateWorkerProvenance(state,{role:'review',workerId:'renamed-a',lineage:bindWorkerLineage(lineage('/root/author')),profile:profile('/root/author','review','renamed-a')}),/retained strict authorship/);assert.deepEqual(stateBytes(root),before);
  reserve(root,'second-review','review','/root/reviewer');recordReview(root,{...review(root),campaignId:'test',skillId:'first',workerId:'second-review',reviewerProfile:profile('/root/reviewer','review','second-review')});state=readSkill(root,'test','first');assert.equal(state.status,'accepted');assert.equal(state.review.outcomes.length,10);
  const accepted=stateBytes(root);assert.throws(()=>recordReviewProfile(root,{campaignId:'test',skillId:'first',stageHash:state.stage.hash,workerId:'second-review',reviewerProfile:profile('/root/author','review','second-review')}),/Conflicting stable/);assert.deepEqual(stateBytes(root),accepted);
});

test('external runner never resumes an unmigrated held native lease or changes its prepared/cache bytes',async t=>{
  const {root}=fixture(t);const id='sol61-native-historical-owner';reserve(root,id,'author');
  const owner=readSkill(root,'test','first').owner;assert.equal(owner.workerLineage,undefined);
  const cache=path.join(root,path.dirname(owner.prepared.snapshotPath),'original-paid-cache.json');fs.writeFileSync(cache,'{"actualSession":"original","ok":true}');
  const stateBefore=stateBytes(root),cacheBefore=fs.readFileSync(cache),preparedBefore=structuredClone(owner.prepared);let calls=0;
  const result=await runCampaign(root,{campaignId:'test',ids:['first'],concurrency:1,runner:async()=>{calls++;throw Error('Foreign native owner must not dispatch');}});
  assert.equal(calls,0);assert.equal(result.calls,0);assert.deepEqual(stateBytes(root),stateBefore);assert.deepEqual(fs.readFileSync(cache),cacheBefore);assert.deepEqual(readSkill(root,'test','first').owner.prepared,preparedBefore);
});

test('first strict repair retains actual known legacy author identity without migrating the historical stage or inventing missing identity',t=>{
  const {root,sourcePath}=fixture(t);reserve(root,'legacy-a','author');stageAssignment(root,{...author(root,sourcePath),campaignId:'test',skillId:'first',workerId:'legacy-a',metrics:profile('/root/author','author','legacy-a')});
  reserve(root,'legacy-independent','review');recordReview(root,{...review(root),campaignId:'test',skillId:'first',workerId:'legacy-independent',reviewerProfile:profile('/root/reviewer','review','legacy-independent')});
  const original=readSkill(root,'test','first').stage;assert.equal(original.workerLineage,undefined);const originalBytes=fs.readFileSync(path.join(root,original.candidatePath));
  activateWorkerLineagePolicy(root,{campaignId:'test'});requestRepair(root,{campaignId:'test',skillId:'first',stageHash:original.hash,finding:'Clarify why adding one is wrong.',targets:['quiz.q1']});reserve(root,'strict-b','author','/root/repairer');
  const payload=author(root,sourcePath);payload.candidateQuiz.questions[0].options[1].why='Added $1$ instead of $2$.';delete payload.coverage.items.find(row=>row.where==='quiz.q1').hash;stageAssignment(root,{...normalizeWorkerResult(root,readSkill(root,'test','first'),payload),campaignId:'test',skillId:'first',workerId:'strict-b',metrics:profile('/root/repairer','author','strict-b')});
  const state=readSkill(root,'test','first');assert.equal(state.stage.nativeAuthorLineage[0].workerLineage.origin,'historical-author-metrics');assert.equal(state.stage.nativeAuthorLineage[0].stageHash,original.hash);assert.equal(state.stage.nativeAuthorLineage[0].workerLineage.actorId,'/root/author');assert.match(reserve(root,'new-legacy-a','review','/root/author').blocked,/different stable/);assert.deepEqual(fs.readFileSync(path.join(root,original.candidatePath)),originalBytes);
  const history=JSON.parse(fs.readFileSync(path.join(root,state.stageHistory[0].evidencePath)));assert.deepEqual(history.stage,original);assert.equal(history.stage.workerLineage,undefined);
});


test('explicit medium override preserves held High evidence and binds every new native reviewer to Medium', t => {
  const {root,sourcePath}=fixture(t);
  activateWorkerLineagePolicy(root,{campaignId:'test'});
  reserve(root,'high-author','author','/root/author');
  const before=stateBytes(root), historical=structuredClone(readCampaign(root,'test').profile);
  const override=activateExecutionOverride(root,{campaignId:'test',request:'switch model to gpt6.1 sol medium',requestedBy:'human user'});
  assert.equal(override.override.observedModel,null);assert.equal(override.override.actualServiceTier,null);
  assert.deepEqual(stateBytes(root),before);assert.deepEqual(readCampaign(root,'test').profile,historical);
  assert.equal(reserve(root,'high-author','author','/root/author').profile.effort,'high');
  stageAssignment(root,{campaignId:'test',skillId:'first',workerId:'high-author',...author(root,sourcePath),metrics:profile('/root/author','author','high-author')});
  const assignment=reserve(root,'medium-review','review','/root/reviewer');assert.equal(assignment.profile.effort,'medium');
  const state=readSkill(root,'test','first'), payload=review(root), old=profile('/root/reviewer','review','medium-review');
  assert.throws(()=>recordReview(root,{campaignId:'test',skillId:'first',workerId:'medium-review',stageHash:state.stage.hash,...payload,reviewerProfile:old}),/Conflicting exposed worker setting/);
  const medium={...old,effort:'medium'};
  recordReview(root,{campaignId:'test',skillId:'first',workerId:'medium-review',stageHash:state.stage.hash,...payload,reviewerProfile:medium});
  assert.equal(readSkill(root,'test','first').stage.executionProfile.effort,'high');assert.equal(readSkill(root,'test','first').review.executionProfile.effort,'medium');
  recordReviewProfile(root,{campaignId:'test',skillId:'first',workerId:'medium-review',stageHash:state.stage.hash,reviewerProfile:medium});
  assert.throws(()=>recordReviewProfile(root,{campaignId:'test',skillId:'first',workerId:'medium-review',stageHash:state.stage.hash,reviewerProfile:old}),/Conflicting exposed worker setting/);
});


test('completed High review profile remains attachable after prospective Medium activation', t => {
  const {root,sourcePath}=fixture(t);activateWorkerLineagePolicy(root,{campaignId:'test'});
  reserve(root,'a','author','/root/author');stageAssignment(root,{...author(root,sourcePath),campaignId:'test',skillId:'first',workerId:'a',metrics:profile('/root/author','author','a')});
  reserve(root,'r','review','/root/reviewer');recordReview(root,{...review(root),campaignId:'test',skillId:'first',workerId:'r',reviewerProfile:profile('/root/reviewer','review','r')});
  const state=readSkill(root,'test','first');activateExecutionOverride(root,{campaignId:'test',request:'switch model to gpt6.1 sol medium',requestedBy:'human user'});
  recordReviewProfile(root,{campaignId:'test',skillId:'first',workerId:'r',stageHash:state.stage.hash,reviewerProfile:profile('/root/reviewer','review','r')});
  assert.equal(readSkill(root,'test','first').review.executionProfile.effort,'high');
  assert.throws(()=>recordReviewProfile(root,{campaignId:'test',skillId:'first',workerId:'r',stageHash:state.stage.hash,reviewerProfile:{...profile('/root/reviewer','review','r'),effort:'medium'}}),/Conflicting exposed/);
});
