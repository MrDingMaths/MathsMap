// Polish pipeline step 2 (23 October 2026): order dependencies inside an exercise.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {orderDependencies,applyFlowDependencies,questionNumber} from '../src/lib/booklet-question-dependencies.js';
import {exerciseUnits} from '../src/lib/booklet-exercises.js';
import {optimisePagination} from '../src/lib/booklet-pagination-optimiser.js';
import {runDependencies,exerciseRuns,exerciseDigest,parseModelPairs,dependencyPrompt,exerciseHash} from '../polish/dependencies.mjs';

const doc=text=>({format:'maths-editor-document-v1',version:1,blocks:[{id:'p-'+Math.random().toString(36).slice(2,8),type:'paragraph',inlines:[{type:'text',text}]}]});
const part=(label,text)=>({id:'part-'+label+'-'+Math.random().toString(36).slice(2,6),type:'part',label,prompt:doc(text)});
const q=(id,order,text,{parts=[],stimulus=false}={})=>({id,type:'question',sourceOrder:order,pedagogyRole:'question',content:{id:id+'-root',type:'question',prompt:doc(text),children:parts,...(stimulus?{questionDiagrams:[{id:id+'-d',format:'tikz',code:'x'}]}:{})},flow:{localDifficulty:{reasoningScore:10}}});
const pairsOf=blocks=>orderDependencies(blocks).map(p=>[p.dependent,p.requires,p.kind]);

test('wording pass: previous question, your answer to part (a), next question',()=>{
 const blocks=[q('a',1,'Find the area of the field.'),q('b',2,'Use your answer to the previous question to find the cost.'),q('c',3,'Find the speed.'),q('d',4,'Complete the next question using this result.')];
 const found=pairsOf(blocks);
 assert.ok(found.some(([d,r])=>d==='b'&&r==='a'),'refers back to the previous question');
 assert.ok(!found.some(([d,r])=>d==='c'),'an unrelated question is left free');
 const scaffold=pairsOf([q('x',1,'Set up the equation. The next question solves it.'),q('y',2,'Solve the equation.')]);
 assert.deepEqual(scaffold,[['y','x','scaffolds-next']],'the question that scaffolds the next keeps the next after it');
});

test('wording pass: a rounding instruction is not a reference',()=>{
 const blocks=[q('a',1,'A car travels 120 km in 2 hours. Give your answer to 2 decimal places.'),q('b',2,'Convert to m/s. Give your answer in seconds, to the nearest second.'),q('c',3,'Express your answer to the nearest tenth.')];
 assert.deepEqual(pairsOf(blocks),[]);
});

test('wording pass: Question N, a part of an earlier question, a figure above',()=>{
 const a=q('a',1,'Draw a number line.',{parts:[part('a','Mark 3.'),part('b','Mark -2.')]});
 const b=q('b',2,'Plot the points from part (b) on a grid.');
 const c=q('c',3,'Use the method in Question 1 to find the gap.');
 const found=pairsOf([a,b,c]);
 assert.ok(found.some(([d,r,k])=>d==='b'&&r==='a'&&k==='part-reference'),'part (b) lives in question 1');
 assert.ok(found.some(([d,r,k])=>d==='c'&&r==='a'&&k==='question-reference'));
 const own=q('own',2,'Use the graph above to answer.',{stimulus:true});
 assert.deepEqual(pairsOf([q('g',1,'Here is a graph.',{stimulus:true}),own]),[],'a question that carries its own figure refers to nothing earlier');
 const shared=pairsOf([q('g',1,'Here is a graph.',{stimulus:true}),q('h',2,'Use the graph above to find the speed.')]);
 assert.deepEqual(shared.map(p=>p.slice(0,2)),[['h','g']]);
 const table=pairsOf([q('t',1,'Study the table.',{stimulus:true}),q('u',2,'Using the table, find the mean.')]);
 assert.deepEqual(table,[['u','t','shared-stimulus']]);
});

test('a part of the question itself is not a dependency',()=>{
 const a=q('a',1,'Solve.',{parts:[part('a','Find x.'),part('b','Use part (a) to find y.')]});
 assert.deepEqual(pairsOf([q('z',0,'Warm up.'),a]),[]);
 const own=q('own',2,'How many groups? Express your answer to part (a) in terms of n.',{parts:[part('a','Count them.'),part('b','Now generalise.')]});
 assert.deepEqual(pairsOf([q('z',1,'Warm up.'),own]),[],'"your answer to part (a)" with a part (a) of its own is internal');
 const outside=q('out',2,'Express your answer to part (a) in terms of n.');
 assert.deepEqual(pairsOf([q('z',1,'Count the groups.',{parts:[part('a','Count.')]}),outside]).map(p=>p.slice(0,2)),[['out','z']],'with no part (a) of its own it refers back');
});

test('flow.dependsOn is written, merged and read by exerciseUnits',()=>{
 const blocks=[q('a',1,'One.'),q('b',2,'Two.'),q('c',3,'Three.'),q('d',4,'Four.')];
 const project={sections:[{id:'s',phase:'practice',topicId:'t',blocks}]};
 const changed=applyFlowDependencies(project,[{dependent:'c',requires:'a'}]);
 assert.deepEqual(changed,['c']);
 assert.deepEqual(blocks[2].flow.dependsOn,['a']);
 assert.deepEqual(applyFlowDependencies(project,[{dependent:'c',requires:'a'}]),[],'a repeat changes nothing');
 const names=exerciseUnits(project.sections[0]).groups.map(g=>g.blocks.map(b=>b.id).join(''));
 assert.deepEqual(names,['abc','d'],'the range from a to c becomes one movable unit');
 assert.equal(exerciseUnits({id:'s',blocks:[{...q('x',1,'x'),flow:{dependsOn:['missing']}}]}).unresolved,true);
 assert.equal(questionNumber(blocks[0]),1);
});

test('the optimiser never pulls a question across the one it depends on (flow.dependsOn)',async()=>{
 const make=(id,score,flow={})=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'Q '+id},flow:{localDifficulty:{reasoningScore:score},...flow}});
 const paginator=heights=>async p=>{
  const pages=[];
  for(const section of p.sections){let current=null;
   for(const b of section.blocks){const h=heights[b.id]??10;if(current&&current.space.usedMm+h>100){pages.push(current);current=null;}if(!current)current={blocks:[],space:{capacityMm:100,usedMm:0,remainingMm:100},elements:[]};current.blocks.push(b);current.space.usedMm+=h;current.space.remainingMm=100-current.space.usedMm;current.elements.push({id:b.id,kind:'question',h});}
   if(current)pages.push(current);}
  return {pages,issues:[]};
 };
 const base={A:60,B:50,C:30};
 const free=await optimisePagination({id:'f',settings:{layoutOverrides:{}},studio:{flags:[]},sections:[{id:'s1',phase:'practice',topicId:'t',blocks:[make('A',10),make('B',30),make('C',32)]}]},{paginate:paginator(base),gapMm:15});
 assert.deepEqual(free.project.sections[0].blocks.map(b=>b.id),['A','C','B'],'without the dependency C fills the gap');
 const bound=await optimisePagination({id:'f',settings:{layoutOverrides:{}},studio:{flags:[]},sections:[{id:'s1',phase:'practice',topicId:'t',blocks:[make('A',10),make('B',30),make('C',32,{dependsOn:['B']})]}]},{paginate:paginator(base),gapMm:15});
 assert.deepEqual(bound.project.sections[0].blocks.map(b=>b.id),['A','B','C'],'C stays after B');
});

test('model pairs are checked against the exercise and stored earlier-question-first',()=>{
 const blocks=[q('a',1,'One.'),q('b',2,'Two.'),q('c',3,'Three.')];
 const pairs=parseModelPairs({pairs:[{dependent:'b',requires:'a',kind:'scaffolds-next',why:'sets up'},{dependent:'a',requires:'c',kind:'weird',why:'reversed'},{dependent:'zz',requires:'a'},{dependent:'b',requires:'b'},{dependent:'b',requires:'a'}]},blocks);
 assert.deepEqual(pairs.map(p=>[p.dependent,p.requires,p.kind]),[['b','a','scaffolds-next'],['c','a','refers-back']]);
 assert.deepEqual(parseModelPairs({},blocks),[]);
 assert.match(dependencyPrompt(blocks,[]),/Return one JSON object/);
 assert.equal(exerciseDigest(blocks)[0].id,'a');
});

const bookletOf=(...exercises)=>({id:'dep-test',revision:1,sections:exercises.map((blocks,i)=>({id:'sec'+i,phase:'practice',topicId:'topic'+i,blocks}))});

test('one model call per exercise, cached by content hash, at most three at once, deterministic-only reads no cache',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'polish-dep-'));
 try{
  const project=bookletOf([q('a1',1,'Set up the equation.'),q('a2',2,'Solve it.')],[q('b1',1,'Here is a table.',{stimulus:true}),q('b2',2,'Find the mean from the table.')],[q('c1',1,'One.'),q('c2',2,'Two.')],[q('d1',1,'One.'),q('d2',2,'Two.')]);
  let calls=0,active=0,peak=0;const prompts=[];
  const askModel=async({prompt})=>{calls++;active++;peak=Math.max(peak,active);prompts.push(prompt);await new Promise(r=>setTimeout(r,15));active--;
   return {result:{pairs:/Set up/.test(prompt)?[{dependent:'a2',requires:'a1',kind:'scaffolds-next',why:'sets up the equation'}]:[]},usage:{input_tokens:1},elapsedMs:15};};
  const first=await runDependencies({project,runDir:dir,askModel,concurrency:3});
  assert.equal(calls,4);assert.ok(peak<=3,'at most three workers at once');
  assert.deepEqual(first.report.cache,{hits:0,misses:4});
  assert.ok(first.report.pairs.some(p=>p.dependent==='a2'&&p.requires==='a1'&&p.source==='model'));
  assert.deepEqual(first.project.sections[0].blocks[1].flow.dependsOn,['a1']);
  const cached=JSON.parse(fs.readFileSync(path.join(dir,'polish','dependencies.json'),'utf8'));
  assert.equal(Object.keys(cached.exercises).length,4);
  // A second run costs nothing.
  const second=await runDependencies({project,runDir:dir,askModel});
  assert.equal(calls,4);assert.deepEqual(second.report.cache,{hits:4,misses:0});
  assert.deepEqual(second.project.sections[0].blocks[1].flow.dependsOn,['a1']);
  // Changing one exercise asks again for that exercise only.
  const edited=structuredClone(project);edited.sections[2].blocks[0].content.prompt=doc('Changed words.');
  const third=await runDependencies({project:edited,runDir:dir,askModel});
  assert.equal(calls,5);assert.deepEqual(third.report.cache,{hits:3,misses:1});
  // Deterministic only: no model and no cache.
  const det=await runDependencies({project,runDir:dir,model:false,askModel});
  assert.equal(calls,5);assert.equal(det.report.model,0);
  assert.ok(det.report.pairs.some(p=>p.dependent==='b2'&&p.requires==='b1'&&p.source==='wording'),'the wording pass still finds the shared table');
  // The input is never mutated.
  assert.equal(project.sections[0].blocks[1].flow.dependsOn,undefined);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('a failed model call leaves the wording pairs and records the error',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'polish-dep-'));
 try{
  const project=bookletOf([q('a',1,'Here is a graph.',{stimulus:true}),q('b',2,'Use the graph above to find the rate.')]);
  const result=await runDependencies({project,runDir:dir,askModel:async()=>{throw Error('worker refused');}});
  assert.equal(result.report.errors.length,1);
  assert.deepEqual(result.project.sections[0].blocks[1].flow.dependsOn,['a']);
  assert.equal(fs.existsSync(path.join(dir,'polish','dependencies.json')),false,'a failed call is not cached');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('exercise runs group practice sections of one topic and skip single questions',()=>{
 const one={id:'s',phase:'practice',topicId:'t',blocks:[q('a',1,'One.')]};
 const two={id:'s2',phase:'practice',topicId:'t',blocks:[q('b',2,'Two.')]};
 const other={id:'s3',phase:'practice',topicId:'u',blocks:[q('c',1,'Three.')]};
 const runs=exerciseRuns({sections:[{id:'t0',phase:'teaching',blocks:[]},one,two,other]});
 assert.equal(runs.length,1);assert.deepEqual(runs[0].blocks.map(b=>b.id),['a','b']);
 assert.notEqual(exerciseHash(runs[0].blocks,[]),exerciseHash([...runs[0].blocks].reverse(),[]));
});
