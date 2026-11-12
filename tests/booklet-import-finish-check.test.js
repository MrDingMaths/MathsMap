// Import v2 simplification (13 November 2026): run-config check (item 4), finish --check
// (item 3) and label placement inside the finish label check (item 1).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {runConfigProblems} from '../scripts/booklet/import-run-config.mjs';
import {finishCheck} from '../scripts/booklet/import-finish-check.mjs';
import {diagramLabelCheck} from '../scripts/booklet/import-finish.mjs';

const tmp=t=>{fs.mkdirSync('.booklet-work',{recursive:true});const dir=fs.mkdtempSync(path.join('.booklet-work','finish-check-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,1));};
const skills=new Set(['graph-absolute-value','composite-functions']);
const manifest={id:'run',importPolicy:'import-v2',track:'textbook',selectedPages:[6,7,20,21],contextPages:[1,2,18],teacherPages:[28,29,30,36,37]};

test('run config: every missing or inconsistent field is reported at once', () => {
 const config={topics:[{id:'5a',start:6,end:7,teacherPages:[28,29],teachingPages:[1,2]},{id:'5c',start:20,end:21,teacherPages:[36,37]}],classificationSkillIds:['composite-functions']};
 assert.deepEqual(runConfigProblems(config,manifest,{skills}),['topics[1] (5c): teachingPages is required (the prepared context pages that teach this topic), or embeddedContext: true']);
 const broken={topics:[{id:'5a',start:6,end:6,teacherPages:[28,99],teachingPages:[1,3],classificationSkillIds:['nope']},{id:'5a',start:20,end:21}],classificationSkillIds:['missing-skill']};
 const problems=runConfigProblems(broken,manifest,{skills});
 for(const pattern of [/teacherPages 99 were not prepared/,/teachingPages 3 were not prepared/,/unknown classification skill nope/,/topics\[1\] \(5a\): duplicate id/,/topics\[1\] \(5a\): teacherPages .* is required/,/page 7: in no topic/,/classificationSkillIds: unknown skill missing-skill/])
  assert.ok(problems.some(p=>pattern.test(p)),pattern.source);
 // Too many answer pages for one absence claim under the 8-image limit.
 assert.ok(runConfigProblems({topics:[{id:'all',start:6,end:21,embeddedContext:true,teacherPages:[28,29,30,36,37,28,29,30]}]},{...manifest,teacherPages:[28,29,30,36,37]},{skills}).some(p=>/content-review limit of 8/.test(p)));
 assert.deepEqual(runConfigProblems({topics:[{id:'a',start:6,end:21,embeddedContext:true,teacherPages:[28]}]},manifest,{skills}),[],'embeddedContext stands in for teaching pages');
 assert.deepEqual(runConfigProblems({},manifest,{skills,stage:'prepare'}),[],'prepare checks only what the config has');
 assert.match(runConfigProblems({},manifest,{skills})[0],/topics: required for a textbook run/);
 assert.deepEqual(runConfigProblems({},{...manifest,importPolicy:undefined},{skills}),[],'earlier runs keep their rules');
});

const question=(id,page,prompt)=>({id,type:'question',sourceRefs:[{pageNumber:page}],sourceReview:{sourceIdentity:{questionLabel:id.replace(/\D/g,'')}},content:{id:id+'-root',type:'question',prompt,answer:{short:'1',worked:'1'}}});
const candidate=()=>({id:'p',title:'P',source:{},settings:{},sections:[{id:'s',phase:'practice',blocks:[question('q1',6,'Find $x$.'),question('q2',6,'Use your answer to Question 1.'),question('q3',7,'Use Question 2 of Exercise 5B.')]}]});

test('finish --check reports config, structure, labels and a skipped render together, writes nothing and previews reference fixes', async t => {
 const runDir=tmp(t),projectFile=path.join(runDir,'candidate.json');
 write(path.join(runDir,'manifest.json'),manifest);
 write(path.join(runDir,'config.json'),{topics:[{id:'5a',start:6,end:7,teacherPages:[28,29]}]});
 write(projectFile,candidate());
 const before=fs.readFileSync(projectFile,'utf8');
 const result=await finishCheck({runDir,projectFile,projectId:'p'},{
  labels:async()=>({checked:{a:{issues:['x']}},collisions:[{id:'q1-graph',issues:['a curve or line runs through the label 10% across']}]}),
  render:async({targets})=>({issues:[],skipped:[{edition:'student',reason:'connect ECONNREFUSED 127.0.0.1:5173'}],seconds:0,targets})});
 assert.equal(result.ok,false);
 const stages=new Set(result.blockers.map(b=>b.stage));
 for(const stage of ['config','structure','labels','render'])assert.ok(stages.has(stage),stage);
 assert.ok(result.blockers.some(b=>b.stage==='structure'&&/q3 refers to other questions/.test(b.message)),'another exercise is left for a person');
 assert.ok(!result.blockers.some(b=>/q2 refers/.test(b.message)),'Question 1 is resolved by the reference check');
 assert.deepEqual(result.fixes.references,['q2']);
 assert.ok(result.blockers.some(b=>b.stage==='render'&&/did not run for student/.test(b.message)),'a skipped render fails closed');
 assert.equal(fs.readFileSync(projectFile,'utf8'),before,'the candidate is not written');
 assert.equal(fs.existsSync(path.join(runDir,'lean-review','reviewed.json')),false,'no review state is written');
});

test('the finish label check places colliding labels, records them and checks again', async t => {
 const runDir=tmp(t),file=path.join(runDir,'candidate.json');
 const tikz=body=>'\\begin{tikzpicture}'+body+'\\end{tikzpicture}';
 const p={id:'p',sections:[{id:'s',phase:'practice',blocks:[{id:'q1',type:'question',content:{id:'r',answer:{solutionDiagrams:[{id:'g1',format:'tikz',code:tikz('\\node at (0,0) {1};')},{id:'g2',format:'tikz',code:tikz('\\node at (1,0) {2};')}]}}}]}]};
 write(file,p);
 const check=async input=>Object.fromEntries(JSON.parse(fs.readFileSync(input,'utf8')).map(row=>[row.field,{issues:/\\node at \(0,0\)/.test(row.code)||/\(1,0\)/.test(row.code)?['collision']:[]}]));
 const placer=async rows=>({seconds:1,results:rows.map(row=>row.id==='g1'?{id:'g1',before:1,after:0,changed:true,code:tikz('\\node[anchor=north] at (0,0) {1};'),moved:['0:0'],skipped:[]}:{id:row.id,before:1,after:1,changed:false,code:row.code})});
 const result=await diagramLabelCheck({file,runDir,check,place:true,placer});
 assert.deepEqual(result.collisions.map(c=>c.id),['g2'],'only what placement could not clear remains');
 assert.deepEqual(result.placement,{tried:2,changed:1,seconds:1});
 const saved=JSON.parse(fs.readFileSync(file,'utf8'));
 assert.match(saved.sections[0].blocks[0].content.answer.solutionDiagrams[0].code,/anchor=north/);
 const record=fs.readFileSync(path.join(runDir,'lean-review','label-placement.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 assert.deepEqual(record.map(r=>r.diagramId),['g1']);
 const plain=await diagramLabelCheck({file,runDir,check,place:false,placer:async()=>{throw Error('not called');}});
 assert.deepEqual(plain.collisions.map(c=>c.id),['g2']);
});

test('the label check publishes what Studio compiled to the given render cache, and a renderer change is logged, not thrown',async t=>{
 const {publishCheckedDiagrams}=await import('../pedagogy/figure-label-check.mjs');
 const {readRenderEntry}=await import('../scripts/booklet/render-cache-server.mjs');
 const cacheRoot=tmp(t),version='a'.repeat(64),key=version.slice(0,8)+'-k1',svg='<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';
 const page=served=>{let call=0;return {evaluate:async()=>call++===0?{version,entries:[{key,svg}]}:served};};
 const logs=[];
 const done=await publishCheckedDiagrams(page(version),cacheRoot,m=>logs.push(m));
 assert.equal(done.published,1);assert.equal((await readRenderEntry(version,key,{cacheRoot}))?.svg,svg);
 const changed=await publishCheckedDiagrams(page('b'.repeat(64)),cacheRoot,m=>logs.push(m));
 assert.equal(changed.published,0);assert.match(logs.at(-1),/skipped: diagram renderer changed/);
});
