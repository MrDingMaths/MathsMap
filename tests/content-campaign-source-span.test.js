import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeWorkerResult } from '../scripts/content/campaign-runner.mjs';
import { hashValue, initCampaign, nextAssignment, prepareAssignment, stageAssignment, readSkill, assessmentItems } from '../scripts/content/campaign-support.mjs';
import { scopeDependencies, validateSourceImages } from '../scripts/content/campaign-sources.mjs';

function small(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'campaign-source-span-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const write=(p,v)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v));};
  const source='syllabus/Stage 3 Content.md';
  write(source,'# Image-free heading\n## Model\n![Model](media/model.png)\nEight counters plus three counters make eleven.\n## Other lesson\nNo diagram.');
  const gap={path:'syllabus/media/model.png',nonessential:true,reason:'The full quantity description states all required values.',textAlternative:'Eight counters plus three counters make eleven.',accepted:true,observation:'The complete text supplies the required quantities.'};
  const ref={path:source,startLine:2,endLine:4,locator:'Complete model',unavailableImages:[gap]};
  const state={owner:{role:'author',prepared:{sources:[ref],snapshotPath:'snapshot.json'}}};
  const raw={candidateContent:{skillId:'first',theory:{intro:'Addition.'},practice:{foundation:[]}},candidateQuiz:null,coverage:{methods:[],items:[]},sourceReview:[{path:source,startLine:2,endLine:4,locator:ref.locator,support:'direct',observation:'Read the whole model.',adjustments:'Retain the source quantities.',unavailableImages:[gap]}],removals:[]};
  write('snapshot.json',{content:raw.candidateContent,quiz:null});
  return {root,write,source,ref,gap,state,raw};
}

test('explicit different same-path spans never inherit gaps, even with the same descriptive locator',t=>{
  const f=small(t),raw=structuredClone(f.raw);raw.sourceReview.push({...raw.sourceReview[0],startLine:1,endLine:1});delete raw.sourceReview[1].unavailableImages;
  const before=structuredClone(raw),normalized=normalizeWorkerResult(f.root,f.state,raw);
  assert.deepEqual(raw,before);assert.equal(normalized.sourceReview[1].unavailableImages,undefined);
  assert.deepEqual(normalized.sourceReview[0].unavailableImages,[f.gap]);
  assert.deepEqual(normalized.sourceReview.map(r=>[r.startLine,r.endLine]),[[2,4],[1,1]]);
  assert.deepEqual(normalized.candidateContent,raw.candidateContent);
});

test('omitted boundaries infer only a unique compatible section; contradictions and ambiguous candidates reject',t=>{
  const f=small(t),raw=structuredClone(f.raw);delete raw.sourceReview[0].startLine;delete raw.sourceReview[0].endLine;delete raw.sourceReview[0].unavailableImages;
  const n=normalizeWorkerResult(f.root,f.state,raw);assert.deepEqual([n.sourceReview[0].startLine,n.sourceReview[0].endLine],[2,4]);assert.deepEqual(n.sourceReview[0].unavailableImages,[f.gap]);
  for(const mutate of [r=>r.startLine=1,r=>r.endLine=6]){const v=structuredClone(raw);mutate(v.sourceReview[0]);assert.throws(()=>normalizeWorkerResult(f.root,f.state,v),/contradictory prepared source section/);}
  const descriptive=structuredClone(raw);descriptive.sourceReview[0].locator='Read the original model example and full quantities';assert.deepEqual(normalizeWorkerResult(f.root,f.state,descriptive).sourceReview[0].unavailableImages,[f.gap]);
  const ambiguous=structuredClone(f.state);ambiguous.owner.prepared.sources.push({...f.ref,startLine:5,endLine:6,locator:'Other lesson'});
  const missing=structuredClone(raw);delete missing.sourceReview[0].locator;assert.throws(()=>normalizeWorkerResult(f.root,ambiguous,missing),/Ambiguous/);
  const selected=normalizeWorkerResult(f.root,ambiguous,raw);assert.deepEqual([selected.sourceReview[0].startLine,selected.sourceReview[0].endLine],[2,4]);
  const contradiction=structuredClone(raw);contradiction.sourceReview[0].startLine=2;contradiction.sourceReview[0].locator='Other lesson';assert.throws(()=>normalizeWorkerResult(f.root,ambiguous,contradiction),/contradictory/);
});

test('explicit malformed ranges reject before source image slicing or gap inheritance',t=>{
  const f=small(t);
  for(const value of [null,'2',0,-1,1.5,7,NaN,Infinity])for(const key of ['startLine','endLine']){const raw=structuredClone(f.raw);raw.sourceReview[0][key]=value;assert.throws(()=>normalizeWorkerResult(f.root,f.state,raw),/Invalid source section boundary/);}
  const reversed=structuredClone(f.raw);reversed.sourceReview[0].startLine=4;reversed.sourceReview[0].endLine=2;assert.throws(()=>normalizeWorkerResult(f.root,f.state,reversed),/reversed source section/);
});

test('inferred prepared bounds are validated against the actual file before image slicing',t=>{
  const f=small(t);f.write(f.source,'# Image-free section\nComplete teaching.');
  const raw=structuredClone(f.raw);delete raw.sourceReview[0].startLine;delete raw.sourceReview[0].endLine;delete raw.sourceReview[0].unavailableImages;
  const check=(startLine,endLine)=>{const state=structuredClone(f.state);state.owner.prepared.sources=[{path:f.source,locator:raw.sourceReview[0].locator,startLine,endLine}];return normalizeWorkerResult(f.root,state,raw);};
  for(const value of [null,'1',0,-1,1.5,3,NaN,Infinity]){assert.throws(()=>check(value,2),/Invalid source section boundary/);assert.throws(()=>check(1,value),/Invalid source section boundary/);}
  assert.throws(()=>check(2,1),/reversed source section/);assert.deepEqual([check(1,2).sourceReview[0].startLine,check(1,2).sourceReview[0].endLine],[1,2]);
  const defaults=check(undefined,undefined);assert.equal(defaults.sourceReview[0].startLine,undefined);assert.equal(defaults.sourceReview[0].endLine,undefined);
  const binary='original.pdf';f.write(binary,Buffer.from([0,1,2,3]));const binaryRaw=structuredClone(raw);binaryRaw.sourceReview[0].path=binary;const state=structuredClone(f.state);state.owner.prepared.sources=[{path:binary,locator:binaryRaw.sourceReview[0].locator}];const normalized=normalizeWorkerResult(f.root,state,binaryRaw);assert.equal(normalized.sourceReview[0].hash,hashValue(Buffer.from([0,1,2,3])));assert.equal(normalized.sourceReview[0].startLine,undefined);assert.equal(normalized.sourceReview[0].endLine,undefined);
});

test('actual prepareAssignment non-Markdown1/0 defaults preserve omitted PDF ranges without allowing explicit0',t=>{
  const f=small(t),campaignId='real-pdf-default',pdf='original.pdf';f.write(pdf,Buffer.from('%PDF-1.7\nOriginal evidence.'));
  f.write('data/courses.json',[{id:'s4',stage:4,order:1}]);f.write('data/topics.json',[{id:'t',stage:4,courses:['s4'],order:1}]);f.write('data/dotpoints.json',[{id:'dp',topicId:'t',text:'Add numbers.',order:1}]);f.write('data/skills.json',[{id:'first',stage:4,title:'Add',dotPointIds:['dp'],prereqs:[]}]);f.write('public/content/first.json',f.raw.candidateContent);
  initCampaign(f.root,{campaignId,expectedSkills:1,expectedExcluded:0});nextAssignment(f.root,{campaignId,workerId:'pdf-author',role:'author'});const prepared=prepareAssignment(f.root,{campaignId,skillId:'first',workerId:'pdf-author',sources:[{path:pdf,locator:'Original PDF teaching'}]});const state=readSkill(f.root,campaignId,'first');
  assert.deepEqual([prepared.sourceReferences[0].startLine,prepared.sourceReferences[0].endLine],[1,0]);assert.equal(prepared.sourceReferences[0].rawExcerptHash,null);
  const raw=structuredClone(f.raw);raw.sourceReview=[{path:pdf,locator:'Original PDF teaching',support:'indirect',observation:'Original full evidence, no textual range.',adjustments:'No source adjustments.'}];
  const before=structuredClone(raw),n=normalizeWorkerResult(f.root,state,raw);assert.deepEqual(raw,before);assert.equal(n.sourceReview[0].startLine,1);assert.equal(n.sourceReview[0].endLine,undefined);assert.equal(n.sourceReview[0].hash,hashValue(fs.readFileSync(path.join(f.root,pdf))));assert.deepEqual(n.candidateContent,raw.candidateContent);
  for(const key of ['startLine','endLine'])for(const value of [0,null]){const malformed=structuredClone(raw);malformed.sourceReview[0][key]=value;assert.throws(()=>normalizeWorkerResult(f.root,state,malformed),/Invalid source section boundary/);}
  for(const [startLine,endLine]of [[0,0],[2,0],[1,-1],[1,'0']]){const bad=structuredClone(state);Object.assign(bad.owner.prepared.sources[0],{startLine,endLine});assert.throws(()=>normalizeWorkerResult(f.root,bad,raw),/Invalid source section boundary/);}
});

test('explicit source/image hashes and required booklet figures remain binding',t=>{
  const f=small(t),raw=structuredClone(f.raw);raw.sourceReview[0].hash='wrong';assert.throws(()=>normalizeWorkerResult(f.root,f.state,raw),/Supplied wrong hash/);
  const booklet='booklets/mathsmap-sources/Stage 4/Required.md';f.write(booklet,'# Required\n![Essential geometry](missing.png)');
  raw.sourceReview=[{path:booklet,startLine:1,endLine:2,locator:'Required geometry',support:'indirect',observation:'The geometry is required.',adjustments:'No source edits.',unavailableImages:[{...f.gap,path:'booklets/mathsmap-sources/Stage 4/missing.png'}]}];
  assert.throws(()=>normalizeWorkerResult(f.root,f.state,raw),/required source figures/);
  delete raw.sourceReview[0].unavailableImages;assert.throws(()=>normalizeWorkerResult(f.root,f.state,raw),/Relevant source image missing/);
  f.write('booklets/mathsmap-sources/Stage 4/missing.png','actual source asset');raw.sourceReview[0].images=[{path:'booklets/mathsmap-sources/Stage 4/missing.png',hash:'wrong'}];assert.throws(()=>normalizeWorkerResult(f.root,f.state,raw),/Stale source image/);
});

test('actual full area-model candidate normalizes and stages in TEMP with original gaps confined to815–868',t=>{
  const repo=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
  const actual=JSON.parse(fs.readFileSync(new URL('./fixtures/content-campaign/source-span-normalization.json',import.meta.url)));
  const f=small(t),{root,write}=f,skillId=actual.skillId,campaignId='source-span-real-fixture',assignmentId='SYNTHETIC-temp-author',workerId='SYNTHETIC-temp-author';
  for(const name of ['skills','topics','courses','dotpoints'])write('data/'+name+'.json',fs.readFileSync(path.join(repo,'data/'+name+'.json')));
  const tax=JSON.parse(fs.readFileSync(path.join(repo,'data/skills.json'))),skill=tax.find(row=>row.id===skillId);
  for(const id of skill.prereqs||[])if(fs.existsSync(path.join(repo,'public/content/'+id+'.json')))write('public/content/'+id+'.json',fs.readFileSync(path.join(repo,'public/content/'+id+'.json')));
  for(const ref of actual.raw.sourceReview){const bytes=fs.readFileSync(path.join(repo,ref.path));assert.equal(hashValue(bytes),ref.hash);write(ref.path,bytes);for(const image of validateSourceImages(repo,ref,{requireAccepted:true}))write(image.path,fs.readFileSync(path.join(repo,image.path)));}
  write('public/content/'+skillId+'.json',actual.snapshot.contentRaw);write('public/quizzes/'+skillId+'.json',actual.snapshot.quizRaw);
  const dir='.agywork/content-campaign/'+campaignId+'/'+skillId+'/'+assignmentId+'/',snapshotPath=dir+'snapshot.json';write(snapshotPath,actual.snapshot);
  const refs=actual.preparedSources.map(({excerpt,...r})=>r),deps=scopeDependencies(root,skillId,actual.scope,refs);
  const state={skillId,scope:actual.scope,status:'pending',sources:refs,pending:[],attempts:[],owner:{role:'author',workerId,assignmentId,prepared:{snapshotPath,sources:refs,dependencyHash:deps.hash,expected:actual.snapshot.expected}}};
  write('booklets/provenance/content-campaign/'+campaignId+'/campaign.json',{id:campaignId,skillIds:[skillId],excludedIds:[]});
  const ledger='booklets/provenance/content-campaign/'+campaignId+'/skills/'+skillId+'.json';write(ledger,state);
  const rawBefore=structuredClone(actual.raw),normalized=normalizeWorkerResult(root,state,actual.raw);
  assert.deepEqual(actual.raw,rawBefore);assert.deepEqual(normalized.candidateContent,actual.raw.candidateContent);assert.deepEqual(normalized.candidateQuiz,actual.raw.candidateQuiz);assert.deepEqual(normalized.coverage,actual.raw.coverage);
  assert.deepEqual(normalized.sourceReview[0].unavailableImages,actual.raw.sourceReview[0].unavailableImages);assert.equal(normalized.sourceReview[0].unavailableImages.length,2);
  const omitted=structuredClone(actual.raw);delete omitted.sourceReview[0].unavailableImages;const inferred=normalizeWorkerResult(root,state,omitted);assert.deepEqual(inferred.sourceReview[0].unavailableImages,refs[0].unavailableImages,'only the exact original span inherits its prepared gap metadata, without inventing author acceptance');assert.throws(()=>stageAssignment(root,{...inferred,campaignId,skillId,workerId}),/explicitly accept/);assert.deepEqual(readSkill(root,campaignId,skillId),state);
  assert.equal(normalized.sourceReview[3].unavailableImages,undefined);assert.deepEqual([normalized.sourceReview[3].startLine,normalized.sourceReview[3].endLine],[789,814]);
  const baselinePair=[fs.readFileSync(path.join(root,'public/content/'+skillId+'.json')),fs.readFileSync(path.join(root,'public/quizzes/'+skillId+'.json'))];
  for(const mutate of [r=>r.sourceReview[0].unavailableImages=[],r=>r.sourceReview[0].unavailableImages[0].reason+=' Changed',r=>delete r.sourceReview[0].unavailableImages[0].accepted]){const bad=structuredClone(normalized);mutate(bad);assert.throws(()=>stageAssignment(root,{...bad,campaignId,skillId,workerId}),/missing-illustration decision|explicitly accept|Relevant source image missing/);assert.deepEqual(readSkill(root,campaignId,skillId),state);}
  stageAssignment(root,{...normalized,campaignId,skillId,workerId});const staged=readSkill(root,campaignId,skillId),candidate=JSON.parse(fs.readFileSync(path.join(root,staged.stage.candidatePath)));
  assert.deepEqual(candidate.content,actual.raw.candidateContent);assert.deepEqual(candidate.quiz,actual.raw.candidateQuiz);assert.deepEqual(staged.stage.coverage,actual.raw.coverage);assert.deepEqual(staged.stage.sourceReview,normalized.sourceReview);
  assert.equal(staged.stage.candidateHash,hashValue({content:actual.raw.candidateContent,quiz:actual.raw.candidateQuiz}));assert.equal(staged.stage.sourceReview.length,4);assert.equal(assessmentItems(candidate.content,candidate.quiz,false).length,25);assert.equal(candidate.quiz.questions.reduce((n,q)=>n+q.options.length,0),28);
  assert.ok(fs.readFileSync(path.join(root,'public/content/'+skillId+'.json')).equals(baselinePair[0]));assert.ok(fs.readFileSync(path.join(root,'public/quizzes/'+skillId+'.json')).equals(baselinePair[1]));
  const proof={format:'isolated-source-span-stage-regression-v1',candidateHash:staged.stage.candidateHash,counts:{wholeItems:25,options:28,sourceRefs:4,gapDecisions:2},allRawPairCoverageSourcesGapDecisionsPreserved:true,publicPairUnchanged:true,liveLedgerWrites:0,externalModelCalls:0};t.diagnostic(JSON.stringify(proof));
});
