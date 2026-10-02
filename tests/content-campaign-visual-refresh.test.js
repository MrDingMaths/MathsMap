import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {deflateSync} from 'node:zlib';
import {spawnSync} from 'node:child_process';
import {initCampaign,nextAssignment,prepareAssignment,stageAssignment,recordReview,recordVisualReview,readSkill,capturePair,assessmentItems,hashValue,publishAssignment,receiptCampaign,visualRefreshRevision,recordRefreshedVisualReview} from '../scripts/content/campaign-support.mjs';
import {normalizeWorkerResult} from '../scripts/content/campaign-runner.mjs';
import {captureCampaignDiagrams,pngCrc32} from '../scripts/content/campaign-visual-evidence.mjs';
import {scopeDependencies} from '../scripts/content/campaign-sources.mjs';

const profile=(identity='inspector')=>({reviewerIdentity:identity,sessionId:identity+'-session',model:'gpt-6.1-sol',effort:'high',requestedServiceTier:'default',provider:null,observedModel:null,serviceTier:null,usage:null,nativeInferenceCount:null,externalModelCalls:0});
function png(pixel=0){
  const header=Buffer.alloc(13);header.writeUInt32BE(2);header.writeUInt32BE(2,4);header[8]=8;header[9]=6;
  const chunk=(name,bytes)=>{const data=Buffer.concat([Buffer.from(name),bytes]),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(bytes.length);crc.writeUInt32BE(pngCrc32(data));return Buffer.concat([size,data,crc]);};
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.from([0,pixel,0,0,255,255,255,255,255,0,255,255,255,255,0,0,0,255]))),chunk('IEND',Buffer.alloc(0))]);
}
function temp(t){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'visual-refresh-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.isBuffer(value)||typeof value==='string'?value:JSON.stringify(value));};
  const ref=name=>({path:name,hash:hashValue(fs.readFileSync(path.join(root,name)))});
  return {root,write,ref};
}
function fakeCapture(root,state,fields,out,pixel=0){
  return captureCampaignDiagrams(root,{skillId:state.skillId,candidateHash:state.stage.candidateHash,fields,out,base:'http://fixture.invalid'},{capture:({out,items})=>{
    fs.mkdirSync(out,{recursive:true});items.forEach((item,index)=>fs.writeFileSync(path.join(out,index+'.png'),png(pixel)));
    fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(items.map((item,index)=>({auditId:item.auditId,status:'pass',png:index+'.png'}))));
    fs.writeFileSync(path.join(out,'render-environment.json'),JSON.stringify({format:'tikz-capture-environment-v1',browserVersion:'test-fixture-only',viewports:[{userAgent:'synthetic fixture; no actual pixel credit',devicePixelRatio:1,viewport:{width:2,height:2},fontStatus:'loaded',fonts:[]}]}));
  }});
}
const visual=(field,receipt,mode='fresh')=>({where:field.where,hash:field.hash,renderedSourceHash:field.hash,renderedBlockHashes:field.diagramHashes,accepted:true,observation:'Explicit synthetic inspection fixture.',geometryObservation:'Endpoints and complete shapes checked in fixture.',paletteObservation:'Ordinary ink is black.',visibilityObservation:'Complete ordinary borders and labels are visible in the fixture.',renderReceipt:receipt,inspectionMode:mode,...(mode==='fresh'?{actualPixelInspection:true,inspectedAt:new Date().toISOString()}:{})});
async function fixture(t,{published=false}={}){
  const f=temp(t),{root,write,ref}=f;
  write('data/courses.json',[{id:'s4',stage:4,order:1}]);write('data/topics.json',[{id:'topic',stage:4,courses:['s4']}]);write('data/dotpoints.json',[{id:'dp',topicId:'topic',text:'Add numbers.'}]);write('data/skills.json',[{id:'first',stage:4,title:'Addition',dotPointIds:['dp'],prereqs:[]}]);
  const sourcePath='booklets/mathsmap-sources/Addition.md';write(sourcePath,'# Addition\n## Example\n$8+3=11$');write('scripts/agy/batches/done/test.json',{sections:[{skillIds:['first'],bookletPaths:[sourcePath]}]});
  const card=n=>({question_text:`Calculate $${n}+2$.`,structure:'add',solution_text:`$${n}+2=${n+2}$`});
  write('public/content/first.json',{skillId:'first',atomType:'T',theory:{intro:'Add numbers.',facts:['Addition combines quantities.']},practice:{foundation:[3,4,5].map(card),development:[6,7,8].map(card),masteryOmitted:'One operation.',coverageNote:'Narrow routine.'}});
  write('public/quizzes/first.json',{skillId:'first',coverageNote:'Narrow routine.',questions:[3,4,5].map((n,i)=>({id:'q'+i,...card(n),mastery:false,options:[{text:`$${n+2}$`,correct:true},{text:`$${n+1}$`,why:'Added one instead of two.'},{text:`$${n}$`,why:'Did not add the second number.'}]}))});
  write('public/content-manifest.json',{content:{first:[3,3,0]},quiz:{first:[3,0]}});initCampaign(root,{campaignId:'test',expectedSkills:1,expectedExcluded:0});
  nextAssignment(root,{campaignId:'test',workerId:'author',ids:['first']});prepareAssignment(root,{campaignId:'test',workerId:'author',skillId:'first'});
  const pair=capturePair(root,'first');pair.content.theory.workedExamples=[0,1].map(i=>({question_text:'Calculate $8+3$.\n[tikz]\\begin{tikzpicture}\\draw (0,0)--('+String(i+1)+',0);\\end{tikzpicture}[/tikz]',solution_text:'$8+3=11$'}));
  const payload={candidateContent:pair.content,candidateQuiz:pair.quiz,coverage:{methods:[{id:'add',description:'Add two numbers.',sourceRefs:[0]}],items:assessmentItems(pair.content,pair.quiz).filter(item=>item.kind!=='theory').map(item=>({where:item.where,methods:['add']}))},sourceReview:[{path:sourcePath,locator:'Full example lines 1–3',support:'direct',observation:'Addition directly supported.',adjustments:'Different values preserve addition.'}],removals:[],substantiveCorrections:[]};
  stageAssignment(root,{...normalizeWorkerResult(root,readSkill(root,'test','first'),payload),campaignId:'test',workerId:'author',skillId:'first'});
  nextAssignment(root,{campaignId:'test',workerId:'math-reviewer',ids:['first'],role:'review'});prepareAssignment(root,{campaignId:'test',workerId:'math-reviewer',skillId:'first'});
  let state=readSkill(root,'test','first');
  const review={outcomes:assessmentItems(pair.content,pair.quiz).filter(item=>item.kind!=='theory').map(item=>({where:item.where,verdict:'accepted',independentSolution:item.value.solution_text,observation:'Independent arithmetic.',...(item.kind==='quiz'?{options:item.value.options.map(option=>({mathematicallyCorrect:option.correct===true,observation:'Each option independently checked.'}))}:{})})),sourceObservation:'Complete source supports addition.',theoryObservation:'Theory supports every mapped item.',findings:[]};
  recordReview(root,{...normalizeWorkerResult(root,state,review),campaignId:'test',skillId:'first',workerId:'math-reviewer'});state=readSkill(root,'test','first');
  const fields=state.review.requiredVisuals.map(field=>({...field,value:pair.content.theory.workedExamples[Number(field.where.match(/\[(\d+)\]/)[1])].question_text}));
  const oldReceipt=fakeCapture(root,state,fields,'.agywork/content-campaign/test/old');const oldVisuals=fields.map(field=>visual(field,oldReceipt));
  recordVisualReview(root,{campaignId:'test',skillId:'first',workerId:'original-inspector',stageHash:state.stage.hash,visualReviews:oldVisuals});
  write('.agywork/content-campaign/test/original-inspection.json',{candidateHash:state.stage.candidateHash,reviewerProfile:profile('original-inspector'),visualReviews:oldVisuals});
  if(published)await publishAssignment(root,{campaignId:'test',skillId:'first'});
  state=readSkill(root,'test','first');write('src/app.css','svg{overflow:visible}');
  const current=fakeCapture(root,state,fields,'.agywork/content-campaign/test/current');
  const input=()=>({campaignId:'test',skillId:'first',workerId:'inspector',stageHash:state.stage.hash,candidateHash:state.stage.candidateHash,expectedVisualRevisionHash:visualRefreshRevision(readSkill(root,'test','first')),reviewerProfile:profile(),visualReviews:fields.map(field=>visual(field,current))});
  return {...f,state,fields,current,oldReceipt,oldVisuals,input,sourcePath,oldInspection:ref('.agywork/content-campaign/test/original-inspection.json')};
}

test('published partial refresh retains mathematical/source history and pair bytes until every actual current field is accepted',async t=>{
  const f=await fixture(t,{published:true}),before=readSkill(f.root,'test','first'),pair=capturePair(f.root,'first').expected;
  assert.equal(receiptCampaign(f.root,'test').verifiedCurrentPublished,0);
  const originalEvidence=fs.readFileSync(path.join(f.root,f.oldInspection.path));
  const request=f.input();request.visualReviews=request.visualReviews.slice(0,1);const one=recordRefreshedVisualReview(f.root,request);
  assert.equal(one.status,'published');assert.equal(one.renderingCurrent,false);assert.deepEqual(one.renderingPending,[f.fields[1].where]);
  assert.equal(receiptCampaign(f.root,'test').verifiedCurrentPublished,0);
  const partial=readSkill(f.root,'test','first');assert.deepEqual(partial.stage,before.stage);assert.deepEqual(partial.review.outcomes,before.review.outcomes);assert.deepEqual(partial.published,before.published);assert.deepEqual(capturePair(f.root,'first').expected,pair);
  assert.throws(()=>recordRefreshedVisualReview(f.root,request),/Stale visual refresh revision/,'overlapping stale request cannot erase the first inspection');
  const second=f.input();second.visualReviews=second.visualReviews.slice(1);const done=recordRefreshedVisualReview(f.root,second);
  assert.equal(done.renderingCurrent,true);assert.equal(receiptCampaign(f.root,'test').verifiedCurrentPublished,1);
  const after=readSkill(f.root,'test','first');assert.equal(after.visualRefreshHistory.length,2);assert.deepEqual(after.review.outcomes,before.review.outcomes);assert.deepEqual(capturePair(f.root,'first').expected,pair);assert.ok(fs.readFileSync(path.join(f.root,f.oldInspection.path)).equals(originalEvidence));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.root,one.beforeReview.path))).review,before.review);
});

test('exact PNG reuse keeps immutable original positive attribution and refuses changed, negative or relabelled pixels',async t=>{
  const f=await fixture(t);const input=f.input();input.visualReviews=input.visualReviews.map(row=>({...visual(f.fields.find(field=>field.where===row.where),f.current,'identical-png-reuse'),reusedInspection:{review:f.oldInspection}}));
  const invalid=structuredClone(input);invalid.visualReviews[0].actualPixelInspection=true;assert.throws(()=>recordRefreshedVisualReview(f.root,invalid),/cannot be relabelled/);
  const changed=fakeCapture(f.root,f.state,f.fields,'.agywork/content-campaign/test/changed',30);const wrong=structuredClone(input);wrong.visualReviews[0].renderReceipt=changed;assert.throws(()=>recordRefreshedVisualReview(f.root,wrong),/Changed pixels/);
  const negative=structuredClone(JSON.parse(fs.readFileSync(path.join(f.root,f.oldInspection.path))));negative.visualReviews[0].accepted=false;f.write('.agywork/content-campaign/test/negative.json',negative);const no=structuredClone(input);no.visualReviews[0].reusedInspection.review=f.ref('.agywork/content-campaign/test/negative.json');assert.throws(()=>recordRefreshedVisualReview(f.root,no),/explicit positive\/negative/);
  const result=recordRefreshedVisualReview(f.root,input);assert.equal(result.status,'accepted');
  const after=readSkill(f.root,'test','first');assert.equal(after.review.visualReviews[0].reusedInspection.reviewerProfile.reviewerIdentity,'original-inspector');assert.equal(after.review.visualReviews[0].actualPixelInspection,undefined);assert.deepEqual(after.review.outcomes,f.state.review.outcomes);
});

test('legacy partial dependencies remain unknown while byte-identical positive inspections are explicitly retained',async t=>{
  const f=await fixture(t),legacy=JSON.parse(fs.readFileSync(path.join(f.root,f.oldReceipt.path)));
  delete legacy.rendererDependencyProfile;delete legacy.rendererDependencies;delete legacy.renderEnvironment;
  f.write('.agywork/content-campaign/test/legacy-receipt.json',legacy);
  const historical=JSON.parse(fs.readFileSync(path.join(f.root,f.oldInspection.path)));historical.visualReviews.forEach(row=>row.renderReceipt=f.ref('.agywork/content-campaign/test/legacy-receipt.json'));f.write('.agywork/content-campaign/test/legacy-inspection.json',historical);
  const input=f.input();input.visualReviews=f.fields.map(field=>({...visual(field,f.current,'identical-png-reuse'),reusedInspection:{review:f.ref('.agywork/content-campaign/test/legacy-inspection.json')}}));
  const done=recordRefreshedVisualReview(f.root,input);assert.equal(done.status,'accepted');const after=readSkill(f.root,'test','first');assert.equal(after.review.visualReviews[0].reusedInspection.historicalRendererDependencies,'legacy-partial-unverified');assert.equal(after.review.visualReviews[0].reusedInspection.receipt.rendererDependencies,undefined);assert.deepEqual(after.review.outcomes,f.state.review.outcomes);
});

test('fresh inspection refuses missing or invalid capture time without changing published evidence or journal',async t=>{
  const f=await fixture(t,{published:true}),before=readSkill(f.root,'test','first');
  const ledger='booklets/provenance/content-campaign/test/skills/first.json',ledgerBytes=fs.readFileSync(path.join(f.root,ledger)),pair=capturePair(f.root,'first');
  const journalPath=path.resolve(f.root,before.published.journalPath),journalBytes=fs.readFileSync(journalPath);
  const receipt=JSON.parse(fs.readFileSync(path.join(f.root,f.current.path)));
  for(const captureTime of [undefined,'not-a-date']){
    const request=f.input(),invalid={...receipt,capturedAt:captureTime};
    f.write('.agywork/content-campaign/test/invalid-capture-time.json',invalid);
    request.visualReviews.forEach(row=>row.renderReceipt=f.ref('.agywork/content-campaign/test/invalid-capture-time.json'));
    assert.throws(()=>recordRefreshedVisualReview(f.root,request),/timestamp must follow/);
    assert.ok(fs.readFileSync(path.join(f.root,ledger)).equals(ledgerBytes));
    assert.ok(fs.readFileSync(journalPath).equals(journalBytes));
    const actual=capturePair(f.root,'first');assert.equal(actual.contentRaw,pair.contentRaw);assert.equal(actual.quizRaw,pair.quizRaw);
  }
  assert.equal(recordRefreshedVisualReview(f.root,f.input()).renderingCurrent,true);
  assert.ok(fs.readFileSync(journalPath).equals(journalBytes));
  assert.deepEqual(readSkill(f.root,'test','first').review.outcomes,before.review.outcomes);
  const actual=capturePair(f.root,'first');assert.equal(actual.contentRaw,pair.contentRaw);assert.equal(actual.quizRaw,pair.quizRaw);
});

test('dependencies and pairs changed during validation abort before the atomic ledger write',async t=>{
  const f=await fixture(t),ledger='booklets/provenance/content-campaign/test/skills/first.json',before=fs.readFileSync(path.join(f.root,ledger));
  const originalCss=fs.readFileSync(path.join(f.root,'src/app.css'));
  const moving=f.input();let reads=0;
  Object.defineProperty(moving.visualReviews[0],'paletteObservation',{enumerable:true,get(){if(++reads===2)f.write('src/app.css','svg{opacity:.4}');return 'Ordinary ink remains black.';}});
  assert.throws(()=>recordRefreshedVisualReview(f.root,moving),/Renderer changed during scoped validation/);assert.ok(fs.readFileSync(path.join(f.root,ledger)).equals(before));f.write('src/app.css',originalCss);
  const content=fs.readFileSync(path.join(f.root,'public/content/first.json')),concurrent=f.input();
  Object.defineProperty(concurrent.visualReviews[0],'geometryObservation',{enumerable:true,get(){f.write('public/content/first.json','{}');return 'Endpoints checked.';}});
  assert.throws(()=>recordRefreshedVisualReview(f.root,concurrent),/Live pair changed/);assert.ok(fs.readFileSync(path.join(f.root,ledger)).equals(before));f.write('public/content/first.json',content);
  const overlapping=f.input();let ledgerReads=0;
  Object.defineProperty(overlapping.visualReviews[0],'paletteObservation',{enumerable:true,get(){if(++ledgerReads===2){const intervening=JSON.parse(before);intervening.pending=['An intervening actual inspection must survive.'];f.write(ledger,intervening);}return 'Ordinary ink is black.';}});
  assert.throws(()=>recordRefreshedVisualReview(f.root,overlapping),/Visual ledger changed during validation/);
  const retained=readSkill(f.root,'test','first');assert.deepEqual(retained.pending,['An intervening actual inspection must survive.']);assert.equal(retained.visualRefreshHistory,undefined,'the rejected refresh cannot overwrite intervening ledger evidence');
});

test('refresh rejects live pair, source, candidate, stage, owner, profile and mutated renderer dependencies before recording',async t=>{
  const f=await fixture(t);const original=readSkill(f.root,'test','first'),ledger='booklets/provenance/content-campaign/test/skills/first.json';
  const rejected=(mutate,pattern)=>{const backups=[];const change=(name,value)=>{backups.push([name,fs.readFileSync(path.join(f.root,name))]);f.write(name,value);};mutate(change);const prior=fs.readFileSync(path.join(f.root,ledger));assert.throws(()=>recordRefreshedVisualReview(f.root,f.input()),pattern);assert.ok(fs.readFileSync(path.join(f.root,ledger)).equals(prior));for(const[name,bytes]of backups.reverse())f.write(name,bytes);};
  rejected(change=>change('public/content/first.json',{}),/Live pair changed/);
  rejected(change=>change(f.sourcePath,'Changed teaching.'),/dependencies changed/);
  rejected(change=>change(original.stage.candidatePath,{}),/candidate changed/);
  rejected(change=>change('src/app.css','svg{opacity:.1}'),/renderer mismatch/);
  rejected(change=>change(ledger,{...original,owner:{workerId:'busy'}}),/active worker/);
  rejected(change=>change(ledger,{...original,stage:{...original.stage,coverage:{methods:[],items:[]}}}),/stage\/method binding/);
  for(const patch of [{model:'gpt-6-sol'},{effort:'low'},{requestedServiceTier:'priority'},{reviewerIdentity:'author'}]){
    const request=f.input();Object.assign(request.reviewerProfile,patch);assert.throws(()=>recordRefreshedVisualReview(f.root,request),/independent|differ/);
  }
  for(const patch of [{hash:'wrong'},{renderedBlockHashes:[]},{visibilityObservation:''},{accepted:false}]){
    const request=f.input();Object.assign(request.visualReviews[0],patch);assert.throws(()=>recordRefreshedVisualReview(f.root,request),/Complete positive refreshed/);
  }
  const duplicate=f.input();duplicate.visualReviews.push(duplicate.visualReviews[0]);assert.throws(()=>recordRefreshedVisualReview(f.root,duplicate),/Unique nonempty/);
  const request=f.input();request.visualReviews[0].inspectedAt='2000-01-01T00:00:00Z';assert.throws(()=>recordRefreshedVisualReview(f.root,request),/timestamp must follow/);
  assert.deepEqual(readSkill(f.root,'test','first'),original);
});

test('presentation refresh cannot clear unrelated mathematical findings and CLI records only the visual ledger',async t=>{
  const f=await fixture(t),state=readSkill(f.root,'test','first'),ledger='booklets/provenance/content-campaign/test/skills/first.json';
  state.review.findings=[{where:'quiz.q0',description:'Wrong arithmetic.',repair:'Recalculate.'}];state.status='repair-needed';state.pending=['Wrong arithmetic.'];f.write(ledger,state);
  const request=f.input();request.resolvedPresentationFindings=[{where:'quiz.q0',findingHash:hashValue(state.review.findings[0]),outcome:{verdict:'accepted'}}];assert.throws(()=>recordRefreshedVisualReview(f.root,request),/Only the exact recorded Ratios/);
  delete request.resolvedPresentationFindings;f.write('.agywork/content-campaign/test/request.json',request);
  const cli=spawnSync(process.execPath,['scripts/content/campaign.mjs','refresh-visual','--root',f.root,'--campaign','test','--skill','first','--worker','inspector','--input',path.join(f.root,'.agywork/content-campaign/test/request.json')],{encoding:'utf8'});
  assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(cli.stdout).status,'repair-needed');const after=readSkill(f.root,'test','first');assert.deepEqual(after.review.findings,state.review.findings);assert.deepEqual(after.review.outcomes,state.review.outcomes);assert.equal(after.visualRefreshHistory.length,1);
});

test('the exact real Ratios border finding requires a different fresh whole-item derivation and all thirteen current fields',t=>{
  const f=temp(t),frozen=JSON.parse(fs.readFileSync(new URL('./fixtures/content-campaign/ratios-border-presentation.json',import.meta.url))),id='ratios-compare-quantities';
  const skills=[frozen.context.skill,...frozen.context.siblings.map(skill=>({...skill,dotPointIds:frozen.context.governing.map(row=>row.id),prereqs:frozen.context.dependents.some(row=>row.id===skill.id)?[id]:[]})),...frozen.context.dependents.filter(skill=>!frozen.context.siblings.some(row=>row.id===skill.id)).map(skill=>({...skill,dotPointIds:[],prereqs:[id]}))];
  f.write('data/skills.json',skills);f.write('data/topics.json',[frozen.context.topic]);f.write('data/dotpoints.json',frozen.context.governing);f.write('data/courses.json',[]);
  for(const source of frozen.stage.sourceReview)for(const ref of [source,...source.images]){const bytes=fs.readFileSync(ref.path);assert.equal(hashValue(bytes),ref.hash);f.write(ref.path,bytes);}
  assert.equal(scopeDependencies(f.root,id,frozen.scope,frozen.stage.sourceReview).hash,frozen.stage.dependencyHash,'the frozen real source/context dependency is reconstructed exactly');
  f.write('public/content/'+id+'.json',frozen.livePair.content);f.write('public/quizzes/'+id+'.json',frozen.livePair.quiz);
  const candidatePath='.agywork/content-campaign/test/ratio-candidate.json';f.write(candidatePath,frozen.candidate);
  const state={skillId:id,scope:frozen.scope,status:'repair-needed',pending:frozen.review.findings.map(row=>row.description),stage:{...frozen.stage,candidatePath,metrics:{authorIdentity:'/root/review_plan_sol61'}},review:frozen.review};
  const ledger='booklets/provenance/content-campaign/test/skills/'+id+'.json';f.write(ledger,state);f.write('booklets/provenance/content-campaign/test/campaign.json',{skillIds:[id]});
  const valueAt=where=>{const parts=where.replace(/\[(\d+)\]/g,'.$1').split('.');if(parts[0]==='quiz')return parts.slice(2).reduce((value,key)=>value[key],frozen.candidate.quiz.questions.find(item=>item.id===parts[1]));return parts.reduce((value,key)=>value[key],frozen.candidate.content);};
  const fields=state.review.requiredVisuals.map(field=>({...field,value:valueAt(field.where)}));assert.equal(fields.length,13);
  const old=fakeCapture(f.root,state,fields,'.agywork/content-campaign/test/ratio-old');
  const negative={candidateHash:state.stage.candidateHash,reviewerProfile:state.review.reviewerProfile,visualReviews:fields.map(field=>({...visual(field,old),accepted:field.where!=='practice.foundation[1].question_text'}))};
  f.write('.agywork/content-campaign/test/ratio-negative.json',negative);f.write('src/app.css','svg{overflow:visible}');const current=fakeCapture(f.root,state,fields,'.agywork/content-campaign/test/ratio-current');
  const finding=state.review.findings[0],previous=state.review.outcomes.find(row=>row.where==='practice.foundation[1]');assert.equal(hashValue(finding),'a67a5ee6d9b34fb3f530700f6e708fb205bbb93a1f2996a9c67abace0fec1faa');assert.equal(previous.verdict,'repair');
  const resolution={where:finding.where,findingHash:hashValue(finding),observation:'Confirmed presentation-only defect repaired centrally; complete borders visible.',priorFailureReview:f.ref('.agywork/content-campaign/test/ratio-negative.json'),outcome:{where:previous.where,hash:previous.hash,verdict:'accepted',independentSolution:'Count five circles and two squares. Circles:squares = 5:2; squares:circles = 2:5.',observation:'Independently counted every shape and derived both requested ordered ratios.'}};
  const input=()=>({campaignId:'test',skillId:id,workerId:'third-reviewer',stageHash:state.stage.hash,candidateHash:state.stage.candidateHash,expectedVisualRevisionHash:visualRefreshRevision(readSkill(f.root,'test',id)),reviewerProfile:profile('/root/pilot_evidence'),visualReviews:fields.map(field=>visual(field,current)),resolvedPresentationFindings:[resolution]});
  const same=input();same.reviewerProfile=state.review.reviewerProfile;same.workerId=state.review.reviewerProfile.workerId;assert.throws(()=>recordRefreshedVisualReview(f.root,same),/different original reviewer/);
  const notFresh=input();notFresh.resolvedPresentationFindings=[{...resolution,outcome:{...resolution.outcome,independentSolution:''}}];assert.throws(()=>recordRefreshedVisualReview(f.root,notFresh),/Fresh whole-item derivation/);
  const other=input();other.resolvedPresentationFindings=[{...resolution,findingHash:'unknown'}];assert.throws(()=>recordRefreshedVisualReview(f.root,other),/Only the exact recorded/);
  const first=input();first.visualReviews=first.visualReviews.filter(row=>row.where===finding.where);const partial=recordRefreshedVisualReview(f.root,first);assert.equal(partial.status,'visual-pending');assert.equal(partial.renderingPending.length,12);
  const stage=readSkill(f.root,'test',id);assert.deepEqual(stage.review.outcomes.filter(row=>row.where!==previous.where),state.review.outcomes.filter(row=>row.where!==previous.where),'all twenty-six genuine unchanged outcomes retain their actual original attribution');assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.root,partial.beforeReview.path))).review,state.review,'original repair verdict and finding remain immutable');
  const history=JSON.parse(fs.readFileSync(path.join(f.root,partial.evidence.path)));assert.equal(history.resolutions[0].originalNegativeVisual.inspection.accepted,false);assert.deepEqual(history.resolutions[0].originalOutcome,previous);
  const rest=input();rest.resolvedPresentationFindings=[];rest.visualReviews=rest.visualReviews.filter(row=>row.where!==finding.where);const complete=recordRefreshedVisualReview(f.root,rest);assert.equal(complete.status,'accepted');assert.equal(complete.renderingCurrent,true);assert.deepEqual(readSkill(f.root,'test',id).stage,state.stage);assert.deepEqual(capturePair(f.root,id).expected,frozen.stage.expected);
});



