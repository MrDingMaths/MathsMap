import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {coverageClaims,coverageChallengeView,coverageChallengePackets,validateCoverageChallenge,runCoverageChallenge,insertionReviewView} from '../pedagogy/review.mjs';
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
 assert.throws(()=>validateCoverageChallenge(packet,{verdicts:[],newStudentContent:0}),/exactly one verdict/);
 assert.throws(()=>validateCoverageChallenge(packet,reply({verdict:'UNCHECKED'})),/needsTopics/);
 assert.equal(validateCoverageChallenge(packet,reply({verdict:'UNCHECKED',needsTopics:['a'],practiceEvidenceIds:['a-q1']})).length,1);
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
  const report=await runCoverageChallenge({...common,output,runner:async options=>{calls.push(options);return {result:reply(),metrics:{usage:{input_tokens:1},elapsedMs:1}};}});
  assert.equal(calls.length,1);assert.equal(calls[0].stage,'pedagogy-coverage-challenge');assert.equal(calls[0].configuration.effort,'medium');
  assert.equal(report.result.verdicts[0].verdict,'KEEP');assert.ok(fs.existsSync(output));
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
