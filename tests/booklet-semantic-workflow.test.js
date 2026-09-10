import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createSemanticTasks,runSemanticPackets,semanticCacheInfo,validateSemanticResult,wordExcerpts} from '../scripts/booklet/semantic-workflow.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
import {compactTikzPrompt,hasTikzVisual} from '../scripts/booklet/token-efficient-prompts.mjs';

function fixture(t){
 const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'semantic-workflow-'));
 t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(runDir,'evidence/pages'),{recursive:true});
 fs.mkdirSync(path.join(runDir,'evidence/word'),{recursive:true});
 fs.mkdirSync(path.join(runDir,'semantic-packets'));
 for(let p=1;p<=5;p++){
  fs.writeFileSync(path.join(runDir,`evidence/pages/page-00${p}.txt`),`Unique source content ${p}. Solve the equation.`);
  fs.writeFileSync(path.join(runDir,`evidence/pages/page-00${p}.png`),`image-${p}`);
  fs.writeFileSync(path.join(runDir,`semantic-packets/page-00${p}.inventory.json`),JSON.stringify(inventory(p)));
 }
 const config={title:'Algebra',topics:[{id:'algebra',title:'Equations',start:1,end:5,teachingPages:[1,2,3]}]};
 return {runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[1,2,3,4,5],concurrency:2},config,stage:'author',pages:[4,5]};
}
const inventory=page=>({pageNumber:page,inventoried:true,entries:[{id:`src-${page}`,targetId:`q-${page}`,kind:'question',description:'Solve the equation.'}]});
const author=page=>({pageNumber:page,sections:[{id:`s-${page}`,title:'Equations',blocks:[{id:`b-${page}`,type:'question',content:{id:`q-${page}`,type:'question',prompt:'Solve.',answer:{short:'1',worked:'x=1'}}}]}],inventoryMappings:[{inventoryId:`src-${page}`,targetId:`q-${page}`}]});
const pageFrom=prompt=>Number(prompt.match(/Target page (\d+)/)[1]);
const quiet={log:()=>{}};

test('complete prompts share a stable prefix, preserve context, and never duplicate target evidence',t=>{
 const options=fixture(t),[a,b]=createSemanticTasks(options);
 const sharedEnd=a.prompt.indexOf('No TikZ visual');
 assert.equal(a.prompt.slice(0,sharedEnd),b.prompt.slice(0,sharedEnd));
 assert.match(a.prompt,/DOCUMENT: \{format:"maths-editor-document-v1"/);
 assert.match(a.prompt,/NODE: \{id,type:/);
 assert.match(a.prompt,/Missing or conflicting teaching context/);
 assert.match(a.prompt,/align\*/);
 assert.ok(!a.prompt.includes('PILOT-VERIFIED'));
 assert.ok(!a.prompt.includes('pageBreakBefore:true'));
 assert.ok(!a.prompt.includes('#AA0505'));
 assert.equal(a.images.length,3); // Bounded previews plus target; all context is linked.
 assert.match(a.prompt,/page-003.png/);
 assert.equal(createSemanticTasks({...options,config:{...options.config,teachingImageLimit:3}})[0].images.length,4);
 const [teaching]=createSemanticTasks({...options,pages:[2]});
 assert.equal(teaching.images.length,2);
 assert.equal(teaching.prompt.split('Unique source content 2').length-1,1);
 const [inv]=createSemanticTasks({...options,stage:'inventory',pages:[4]});
 assert.match(inv.prompt,/SOURCE CONTEXT PAGE 3/);
 assert.equal(inv.images.length,3);
});

test('visual routing includes requested answer sketches without triggering on topic words',()=>{
 assert.equal(hasTikzVisual({entries:[{kind:'question',description:'Calculate circle area for radius 2.'}]}),false);
 assert.equal(hasTikzVisual({entries:[{kind:'question',description:'Sketch the function.'}]}),true);
 const prompt=compactTikzPrompt({inventory:{entries:[{kind:'diagram',description:'bearing diagram'}]}});
 assert.ok(prompt.includes('\\pic{angle'));
 assert.ok(prompt.includes('\\special{dvisvgm:raw'));
 assert.match(prompt,/90-b/);
 assert.match(prompt,/outer response remains JSON/);
});

test('Word retrieval merges overlap while preserving source offsets and whitespace',()=>{
 const word='alpha   beta\n'+('alpha equation '.repeat(700));
 const excerpts=wordExcerpts(word,'alpha equation');
 assert.equal(excerpts.length,1);
 assert.equal(excerpts[0].text,word.slice(excerpts[0].start,excerpts[0].end));
 assert.ok(excerpts[0].text.startsWith('alpha   beta'));
 assert.equal(wordExcerpts(word,'unrelated zebra').length,0);
});

test('dry run performs no model calls or writes, and fingerprints only relevant evidence',async t=>{
 const options=fixture(t),before=fs.readdirSync(path.join(options.runDir,'semantic-packets'));
 const report=await runSemanticPackets({...options,dryRun:true},{...quiet,runner:()=>assert.fail('dry run called model')});
 assert.equal(report.concurrency,2);
 assert.deepEqual(fs.readdirSync(path.join(options.runDir,'semantic-packets')),before);
 const [a]=createSemanticTasks(options);
 const [b]=createSemanticTasks({...options,config:{...options.config,pageEvidence:{5:{note:'Only page five changes'}}}});
 assert.equal(a.inputHash,b.inputHash);
 fs.writeFileSync(path.join(options.runDir,'evidence/pages/page-003.png'),'changed teaching image');
 assert.notEqual(createSemanticTasks(options)[0].inputHash,a.inputHash);
 assert.throws(()=>createSemanticTasks({...options,manifest:{...options.manifest,effort:'high'}}),/fresh Astra Low/);
});

test('bounded workers resume completed pages, reject edited caches, and preserve failed retries',async t=>{
 const options=fixture(t);let active=0,peak=0,calls=0;
 const runner=async({prompt})=>{calls++;active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,10));active--;return {result:author(pageFrom(prompt)),metrics:{usage:{input_tokens:100,output_tokens:20}}};};
 const first=await runSemanticPackets(options,{...quiet,runner});
 assert.equal(first.ok,true);assert.equal(peak,2);assert.equal(calls,2);
 await runSemanticPackets(options,{...quiet,runner});assert.equal(calls,2);
 const task=createSemanticTasks(options)[0];assert.equal(semanticCacheInfo(task).kind,'hit');
 const original=fs.readFileSync(task.resultFile,'utf8');
 fs.writeFileSync(task.resultFile,original+' ');
 assert.equal(semanticCacheInfo(task).kind,'modified');
 await assert.rejects(()=>runSemanticPackets(options,{...quiet,runner}),/modified/);assert.equal(calls,2);
 fs.writeFileSync(task.resultFile,original);
 const retry=await runSemanticPackets({...options,pages:[4],attempt:2},{...quiet,runner:async()=>({result:{pageNumber:4},metrics:{}})});
 assert.equal(retry.ok,false);assert.equal(fs.readFileSync(task.resultFile,'utf8'),original);
 assert.ok(fs.existsSync(path.join(options.runDir,'semantic-packets/page-004.author.2/prompt.md')));
});

test('explicit attempts resume matching successes and legacy results require review',async t=>{
 const options={...fixture(t),pages:[4]};let calls=0;
 const runner=async()=>{calls++;return {result:author(4),metrics:{}};};
 const task=createSemanticTasks(options)[0];fs.writeFileSync(task.resultFile,JSON.stringify(author(4)));
 assert.equal(semanticCacheInfo(task).kind,'legacy');
 await assert.rejects(()=>runSemanticPackets(options,{...quiet,runner}),/legacy/);
 await runSemanticPackets({...options,attempt:2},{...quiet,runner});
 await runSemanticPackets({...options,attempt:2},{...quiet,runner});
 assert.equal(calls,1);
 await runSemanticPackets({...options,attempt:4},{...quiet,runner});
 await assert.rejects(()=>runSemanticPackets({...options,attempt:3},{...quiet,runner}),/greater than 4/);
});

test('result validation rejects omissions, nonexistent targets, incomplete diagrams and missing answers',()=>{
 const task={stage:'author',page:4,inventory:inventory(4)};
 const missing=author(4);missing.inventoryMappings=[];
 assert.throws(()=>validateSemanticResult(missing,task),/Missing inventory mapping/);
 const wrong=author(4);wrong.inventoryMappings[0].targetId='invented';
 assert.throws(()=>validateSemanticResult(wrong,task),/Missing mapping target/);
 const diagram=author(4);diagram.sections[0].blocks.push({id:'diagram',format:'tikz',code:''});
 assert.throws(()=>validateSemanticResult(diagram,task),/Incomplete TikZ/);
 const answerless=author(4);delete answerless.sections[0].blocks[0].content.answer;
 assert.throws(()=>validateSemanticResult(answerless,task),/lacks short\/worked/);
 const visualInventory=inventory(4);visualInventory.entries[0].kind='diagram';
 assert.throws(()=>validateSemanticResult(author(4),{...task,inventory:visualInventory}),/non-diagram target/);
});

test('a concurrent canonical edit survives an in-flight transcription',async t=>{
 const options={...fixture(t),pages:[4]},task=createSemanticTasks(options)[0];
 const report=await runSemanticPackets(options,{...quiet,runner:async()=>{
  fs.writeFileSync(task.resultFile,'user edit');return {result:author(4),metrics:{}};
 }});
 assert.equal(report.ok,false);assert.equal(fs.readFileSync(task.resultFile,'utf8'),'user edit');
 assert.ok(fs.existsSync(path.join(task.out,'result.json')));
});
