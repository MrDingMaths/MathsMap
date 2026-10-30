import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {coverageClaims,coverageChallengeView,coverageChallengePackets,validateCoverageChallenge,runCoverageChallenge,insertionReviewView,sequences,reviewPrompt,archetypePrompt,runReview} from '../pedagogy/review.mjs';
import {runAstraTask,REVIEW_PROMPT_LIMIT} from '../scripts/booklet/codex-transcription.mjs';
import {ratingBatches} from '../scripts/booklet/rating-input.mjs';
import {reasoningTaskHash} from '../scripts/booklet/reasoning-ratings.mjs';

const question=(id,prompt)=>({id,type:'question',content:{id:id+'-root',type:'question',label:'1',prompt,answer:{short:'answer '+id,worked:'worked '+id}}});
const example=id=>({id,type:'worked-example',pedagogyRole:'example',content:{id:id+'-root',type:'question',prompt:'Example '+id}});
const topicSections=(topic,size=1)=>[{id:topic+'-t',topicId:topic,phase:'teaching',title:topic,blocks:[example(topic+'-e')]},{id:topic+'-p',topicId:topic,phase:'practice',title:'Exercise '+topic,blocks:Array.from({length:size},(_,i)=>question(`${topic}-q${i+1}`,'Question '+'x'.repeat(40)))}];
const booklet=()=>({id:'demo',title:'Demo',revision:7,topics:['a','b','c'].map(id=>({id,title:id})),sections:['a','b','c'].flatMap(topic=>topicSections(topic,3)),studio:{flags:[{id:'f1',targetId:'b-q1',kind:'pedagogy-suggestion',note:'open'},{id:'f2',targetId:'a-q1',kind:'pedagogy-suggestion',note:'unrelated'},{id:'f3',targetId:'b-q1',note:'done',resolved:true}]}});
const claim={topicId:'b',id:'cluster',coverage:'bridge',questionIds:['b-q1'],exampleIds:['b-e'],teachingIds:[],guidedPracticeIds:[],practiceEvidenceIds:[]};
const reply=overrides=>({verdicts:[{topicId:'b',clusterId:'cluster',verdict:'KEEP',coverage:'bridge',reason:'Checked.',exampleIds:['b-e'],practiceEvidenceIds:['b-q2'],...overrides}],uncertainties:[],newStudentContent:0});

test('a coverage challenge sends each block once, whole claimed practice and only relevant comments',()=>{
 const {payload,evidence,locators}=coverageChallengeView({project:booklet(),claims:[claim]}),json=JSON.stringify(payload);
 assert.deepEqual(payload.practice.map(block=>block.id),['b-q1','b-q2','b-q3']);
 assert.equal(json.split('"id":"b-e"').length-1,1);
 assert.deepEqual(payload.comments.map(flag=>flag.id),['f1']);
 assert.ok(evidence.has('a-e'),'earlier teaching stays evidence');
 assert.ok(locators.has('a-q1'),'earlier practice is a locator');
 assert.ok(!json.includes('worked b-q1'),'practice worked solutions stay out');
 assert.ok(!locators.has('c-q1'),'topics after the last claim are not sent');
});
test('a coverage verdict must cite evidence seen in full, once per claim',()=>{
 const [packet]=coverageChallengePackets({project:booklet(),claims:[claim]});
 assert.equal(validateCoverageChallenge(packet,reply()).length,1);
 assert.throws(()=>validateCoverageChallenge(packet,reply({practiceEvidenceIds:['a-q1']})),/locator-only a-q1/);
 assert.throws(()=>validateCoverageChallenge(packet,reply({practiceEvidenceIds:['missing']})),/unseen missing/);
 assert.throws(()=>validateCoverageChallenge(packet,reply({prerequisiteIds:['missing']})),/unseen missing/);
 assert.equal(validateCoverageChallenge({...packet,prerequisites:new Set(['known-skill'])},reply({prerequisiteIds:['known-skill']})).length,1);
 assert.throws(()=>validateCoverageChallenge({...packet,prerequisites:new Set(['known-skill'])},reply({exampleIds:['known-skill']})),/unseen known-skill/);
 assert.throws(()=>validateCoverageChallenge(packet,{verdicts:[],newStudentContent:0}),/exactly one verdict/);
 assert.throws(()=>validateCoverageChallenge(packet,reply({verdict:'UNCHECKED'})),/needsTopics/);
 assert.equal(validateCoverageChallenge(packet,reply({verdict:'UNCHECKED',needsTopics:['a'],practiceEvidenceIds:['a-q1']})).length,1);
});

test('requested earlier topics carry full teaching and practice once with optional omissions declared',()=>{
 const project=booklet();
 project.sections[0].blocks[0].content.prompt='Earlier teaching '.repeat(4000);
 project.sections[1].blocks[0].content.prompt='Study the supplied method, then complete the remaining steps.';
 project.sections.splice(2,0,...topicSections('between'));
 project.sections.find(s=>s.id==='b-p').blocks[2].flow={dependsOn:['a-q1']};
 const before=structuredClone(project),base=coverageChallengeView({project,claims:[claim]}),forced=coverageChallengeView({project,claims:[claim],needsTopics:['a']});
 assert(base.payload.digests.some(row=>row.topic==='a'));
 assert(base.locators.has('a-q1'));
 assert(!('earlierPractice' in base.payload));
 for(const key of ['claims','comments','teaching','practice','skills'])assert.deepEqual(forced.payload[key],base.payload[key]);
 assert(base.payload.earlierTeaching.some(row=>row.topic==='between'));
 assert.deepEqual(forced.payload.earlierTeaching.map(row=>row.topic),['a']);
 assert(forced.payload.digests.some(row=>row.topic==='between'));
 assert(forced.locators.has('between-e'));assert(!forced.evidence.has('between-e'));
 assert.deepEqual(forced.payload.earlierPractice.map(block=>block.id),['a-q1','a-q2','a-q3']);
 assert(!forced.payload.digests.some(row=>row.topic==='a'));
 assert(!forced.payload.outline.some(row=>row.topic==='a'));
 for(const id of ['a-e','a-q1','a-q2','a-q3']){
  assert(forced.evidence.has(id));assert(!forced.locators.has(id));
  assert.equal(JSON.stringify(forced.payload).split('"id":"'+id+'"').length-1,1);
 }
 assert(!JSON.stringify(forced.payload.earlierPractice).includes('worked a-q1'));
 const [packet]=coverageChallengePackets({project,claims:[claim],needsTopics:['a']});
 assert.match(packet.prompt,/Optional earlierPractice/);
 assert.match(packet.prompt,/Unsolved practice is not teaching/);
 assert.equal(validateCoverageChallenge(packet,reply({verdict:'DROP',coverage:'covered',exampleIds:['a-e'],practiceEvidenceIds:['a-q1']})).length,1);
 assert.throws(()=>validateCoverageChallenge(packet,reply({exampleIds:['between-e'],practiceEvidenceIds:['a-q1']})),/locator-only/);
 assert.throws(()=>validateCoverageChallenge({...packet,evidence:base.evidence,locators:base.locators},reply({exampleIds:['a-e'],practiceEvidenceIds:['a-q1']})),/locator-only/);
 const sourceView=packet.taskReferences.decode(JSON.parse(packet.prompt.slice(packet.prompt.indexOf('\n\n{')+2)));
 assert(sourceView.reviewReferences.dependencies.some(row=>row.ownerId==='b-q3'&&row.targetId==='a-q1'));
 assert.deepEqual(project,before);
});

test('needsTopics rejects unknown, duplicate and future topics and never cuts requested context',()=>{
 const project=booklet(),options={project,claims:[claim]};
 assert.deepEqual(coverageChallengeView({...options,needsTopics:[]}),coverageChallengeView(options));
 assert.equal(coverageChallengePackets({...options,needsTopics:[]})[0].prompt,coverageChallengePackets(options)[0].prompt);
 for(const needsTopics of [['missing'],['a','a'],['c'],[''],null,'a'])assert.throws(()=>coverageChallengePackets({...options,needsTopics}),/needsTopics/);
 assert.throws(()=>coverageChallengePackets({...options,claims:[],needsTopics:['a']}),/requires coverage claims/);
 const claimed=coverageChallengeView({...options,needsTopics:['b']});
 assert.deepEqual(claimed.payload.practice.map(block=>block.id),['b-q1','b-q2','b-q3']);
 assert.equal(JSON.stringify(claimed.payload).split('"id":"b-e"').length-1,1);
 project.sections[0].blocks[0].content.prompt='x'.repeat(180000);
 assert.throws(()=>coverageChallengePackets({...options,needsTopics:['a']}),/not truncated/);
 assert.equal(coverageChallengeView({...options,needsTopics:['a']}).payload.earlierTeaching[0].sections[0].blocks[0].content.prompt.length,180000);
});
test('claims split between topics and one oversized topic is refused, never cut',()=>{
 const project=booklet(),claims=['a','b'].map(topicId=>({...claim,topicId,id:topicId+'-cluster',questionIds:[],exampleIds:[]}));
 const whole=coverageChallengePackets({project,claims})[0].prompt.length;
 const packets=coverageChallengePackets({project,claims,limit:whole-1});
 assert.deepEqual(packets.map(packet=>packet.claims.map(row=>row.topicId)),[['a'],['b']]);
 assert.throws(()=>coverageChallengePackets({project,claims,limit:100}),/not truncated/);
});
test('a coverage challenge runs on the matching revision and records validated verdicts',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'coverage-challenge-'));
 try{
  const projectFile=path.join(dir,'project.json'),mapFile=path.join(dir,'map.json'),output=path.join(dir,'result.json'),calls=[];
  fs.writeFileSync(projectFile,JSON.stringify(booklet()));
  const map={projectId:'demo',revision:7,topics:[{topicId:'b',clusters:[{...claim,topicId:undefined},{id:'fine',coverage:'covered'}]}]};
  fs.writeFileSync(mapFile,JSON.stringify(map));
  assert.equal(coverageClaims(map).length,1);
  const common={projectFile,mapFile,root:dir,skills:[],workDir:dir,runDir:null,lease:async(_,__,action)=>action()};
  const dry=await runCoverageChallenge({...common,dryRun:true,runner:async()=>{throw Error('no call');}});
  assert.equal(dry.packets[0].claims,1);
  const report=await runCoverageChallenge({...common,output,runner:async options=>{calls.push(options);return {result:options.taskReferences.encode(reply()),metrics:{usage:{input_tokens:1},elapsedMs:1}};}});
  assert.equal(calls.length,1);assert.equal(calls[0].stage,'pedagogy-coverage-challenge');assert.equal(calls[0].configuration.effort,'high');assert.equal(calls[0].configuration.model,'gpt-6.1-terra');
  assert.equal(report.result.verdicts[0].verdict,'KEEP');assert.ok(fs.existsSync(output));
  const contextOutput=path.join(dir,'context-result.json');
  const context=await runCoverageChallenge({...common,needsTopics:['a'],output:contextOutput,runner:async options=>{
   const view=options.taskReferences.decode(JSON.parse(options.prompt.slice(options.prompt.indexOf('\n\n{')+2)));
   assert.deepEqual(view.earlierPractice.map(block=>block.id),['a-q1','a-q2','a-q3']);
   return {result:options.taskReferences.encode(reply({verdict:'DROP',coverage:'covered',exampleIds:['a-e'],practiceEvidenceIds:['a-q1']})),metrics:{elapsedMs:1}};
  }});
  assert.deepEqual(context.needsTopics,['a']);assert.equal(context.result.verdicts[0].verdict,'DROP');
  assert.deepEqual(JSON.parse(fs.readFileSync(contextOutput,'utf8')).needsTopics,['a']);
  await assert.rejects(runCoverageChallenge({...common,needsTopics:['c'],dryRun:true}),/Future needsTopics/);
  fs.writeFileSync(mapFile,JSON.stringify({...map,revision:6}));
  await assert.rejects(runCoverageChallenge({...common,dryRun:true}),/does not match/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('an insertion review carries the exercise and named teaching, not the booklet',()=>{
 const project=booklet(),{payload}=insertionReviewView({project,newBlocks:[question('new','New question')],sectionId:'b-p',topics:['b']});
 assert.deepEqual(payload.targetExercise.blocks.map(block=>block.id),['b-q1','b-q2','b-q3']);
 assert.deepEqual(payload.teaching.map(row=>row.topic),['b']);
 assert.deepEqual(payload.digests.map(row=>row.topic),['a','c']);
 assert.deepEqual(payload.comments.map(flag=>flag.id),['f1']);
 assert.ok(payload.outline.some(row=>row.id==='a-q1'),'other practice stays locatable');
 assert.equal(payload.newBlocks[0].content.answer.worked,'worked new','new answers are reviewed');
 assert.throws(()=>insertionReviewView({project,newBlocks:[question('new','x')],limit:10}),/name the topics/);
});
test('an oversized review prompt is refused by size unless a reason is named',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'review-guard-'));
 try{
  let spawned=0;const prompt='x'.repeat(REVIEW_PROMPT_LIMIT+1);
  await assert.rejects(runAstraTask({cwd:dir,prompt,out:path.join(dir,'out'),stage:'any-stage-name'},{spawnProcess:()=>{spawned++;throw Error('spawned');}}),/exceeds 200000/);
  assert.equal(spawned,0);assert.ok(!fs.existsSync(path.join(dir,'out')));
  await assert.rejects(runAstraTask({cwd:dir,prompt,out:path.join(dir,'out'),stage:'any-stage-name',oversizeReason:'Named exception'},{spawnProcess:()=>{spawned++;throw Error('spawned');}}),/spawned/);
  assert.equal(spawned,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('a rating input shows the questions a task depends on without changing its binding',()=>{
 const parent={...question('p1','Use this table'),classification:{}},child={...question('p2','Continue from Question 1'),flow:{dependsOn:['p1']},classification:{}},grandchild={...question('p3','Now finish'),flow:{dependsOn:['p2']},classification:{}};
 const section={id:'s',title:'Exercise',phase:'practice',blocks:[parent,child,grandchild]};
 const hash=reasoningTaskHash(child),rows=ratingBatches([child,grandchild,parent].map(block=>({block,section,projectTitle:'Demo',topicTitle:'t'})))[0];
 assert.deepEqual(rows[0].input.linkedQuestions.map(row=>row.id),['p1']);
 assert.deepEqual(rows[1].input.linkedQuestions.map(row=>row.id),['p1','p2']);
 assert.ok(!JSON.stringify(rows[0].input.linkedQuestions).includes('worked p1'),'parent answers are not supplied');
 assert.equal(rows[0].input.taskHash,hash);
 assert.ok(!('linkedQuestions' in rows[2].input),'independent questions are unchanged');
});


test('review views preserve renderer traversal and disambiguate original source labels',async()=>{
 const names=['p4-q1','p4-q2','p7-q6','p9-q11','p5-q3','p6-q4','p7-q5'];
 const blocks=names.map(id=>{const block=question(id,'Calculate.');block.content.answer={short:'1',worked:'Calculated value 1.'};return {...block,classification:{reasoningScore:id==='p9-q11'?72:18}};});
 blocks[2].content.label='6';blocks[6].content.label='5';
 const project={id:'ordered-demo',title:'Ordered demo',revision:3,settings:{exerciseOrganisation:'topic',questionOrder:'source'},topics:[{id:'t',title:'Triangles'}],sections:[{id:'teaching',topicId:'t',phase:'teaching',title:'Teaching',blocks:[example('supplied-example')]},{id:'practice',topicId:'t',phase:'practice',title:'Exercise',blocks}]};
 const original=JSON.stringify(project),all=sequences(project),claims=[{topicId:'t',id:'hourglass',coverage:'bridge',questionIds:['p7-q6']}];
 const check=(rows,projected=false)=>{
  assert.deepEqual(rows.map(row=>row.id),names);
  assert.equal(rows[2].displayNumber,3);assert.equal(rows[6].displayNumber,7);
  assert.equal(rows[2].exerciseNumber,1);assert.equal(rows[6].exerciseNumber,1);
  assert.equal(rows[2].content.label,projected?'3':'6');assert.equal(rows[6].content.label,projected?'7':'5');
 };
 check(coverageChallengeView({project,claims}).payload.practice);
 check(insertionReviewView({project,newBlocks:[question('new','New')],sectionId:'practice',topics:['t']}).payload.targetExercise.blocks);
 const payload=prompt=>JSON.parse(prompt.slice(prompt.lastIndexOf('\n')+1));
 const task=reviewPrompt({project,all,index:0,skills:[],task:true});
 assert(!task.prompt.includes('p7-q6'),'source-style IDs are absent from ordering task');
 check(task.taskReferences.decode(payload(task.prompt)).sequence.sections.find(section=>section.phase==='practice').blocks,true);
 const archetype=archetypePrompt(project,all[0],{all,skills:[],task:true});
 const routine=archetype.taskReferences.decode(payload(archetype.prompt)).routineQuestions;
 assert.equal(routine.find(row=>row.id==='p7-q5').block.displayNumber,7,'omitted Challenge-score items still count in printed numbering');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'review-numbering-'));let challenged=false;
 try{
  const projectFile=path.join(dir,'project.json');fs.writeFileSync(projectFile,JSON.stringify(project));
  await runReview({projectFile,skills:[],library:[],runDir:null,workDir:dir,provenanceDir:dir,runner:async options=>{
   if(options.stage==='pedagogy-review')return {result:options.taskReferences.encode({candidates:[{kind:'difficulty-jump',severity:'high',targets:['p7-q6','p7-q5'],finding:'Check the actual order.',breakdown:'Source labels differ from printed numbers.',repair:{type:'reorder',proposal:'Inspect the displayed order.'}}]})};
   assert.equal(options.stage,'pedagogy-challenge');check(options.taskReferences.decode(payload(options.prompt)).practice,true);challenged=true;
   return {result:{findings:[],dropped:[{id:'c1',reason:'Verified printed order.'}]}};
  }});
  assert.equal(challenged,true);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 assert.equal(JSON.stringify(project),original,'review numbering never mutates booklet content or order');
});
