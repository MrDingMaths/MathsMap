import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createSemanticTasks,runSemanticPackets,semanticCacheInfo,validateSemanticResult,wordExcerpts} from '../scripts/booklet/semantic-workflow.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
import {compactTikzPrompt,hasTikzVisual} from '../scripts/booklet/token-efficient-prompts.mjs';
import {readAttemptReceipt,recordAttempt,summarizeAttemptEvents} from '../scripts/booklet/semantic-run-metrics.mjs';
import {applyMappingRepair,mappingRepairContext} from '../scripts/booklet/semantic-mapping-repair.mjs';
import {SHARED_DIAGRAM_FORMAT} from '../scripts/booklet/shared-diagram-authoring.mjs';

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
test('semantic layouts reject sibling labels that share one positioning group',()=>{
 const a=author(1);a.sections[0].blocks[0].presentation={arrangement:{id:'bad-layout',type:'group',direction:'stack',children:[{id:'label-a',type:'item',ref:'a/label'},{id:'label-b',type:'item',ref:'b/label'}]}};
 assert.throws(()=>validateSemanticResult(a,{stage:'author',page:1,inventory:inventory(1)}),/Multiple structural labels/);
 a.sections[0].blocks[0].presentation.arrangement.children=a.sections[0].blocks[0].presentation.arrangement.children.map((n,i)=>({id:'cell-'+i,type:'group',direction:'stack',children:[n]}));
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:1,inventory:inventory(1)}));
});
test('shared-content inventory continuations require an existing matching target and a reason',()=>{
 const i=inventory(1),a=author(1);
 i.entries.push({id:'second-region',kind:'question',description:'Another region of the same source figure.'});
 a.inventoryMappings.push({inventoryId:'second-region',targetId:'q-1',continuationOf:'src-1',continuationReason:'Both independently inventoried regions belong to the same source figure.'});
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:1,inventory:i}));
 delete a.inventoryMappings[1].continuationReason;
 assert.throws(()=>validateSemanticResult(a,{stage:'author',page:1,inventory:i}),/continuation/);
 a.inventoryMappings[1].continuationReason='Shared figure';a.inventoryMappings[1].continuationOf='missing';
 assert.throws(()=>validateSemanticResult(a,{stage:'author',page:1,inventory:i}),/continuation/);
});

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
 assert.match(a.prompt,/#4f9b63/);
 assert.match(a.prompt,/Unresolved custom colours fail acceptance/);
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

test('reviewed author prompts explain corrected source and teaching context without exposing unrelated decisions',t=>{
 const options=fixture(t);
 options.config.workflowPolicy='review-first-v1';
 const correction=(page,original,corrected)=>({id:'fix-'+page,status:'approved',reason:'Reviewed numerical error',patches:[{scope:'inventory',page,targetId:'src-'+page,field:'/description',original,corrected}]});
 const workflowState={pages:{4:{patterns:[]}},issues:{a:{id:'a',page:1,status:'retained',message:'Teaching convention',resolution:{reason:'Use the taught method'}},b:{id:'b',page:5,status:'retained',message:'Unrelated secret',resolution:{reason:'Do not send'}}},corrections:[correction(4,'Solve the equation.','Find the corrected probability.'),correction(1,'Solve the equation.','Correct teaching formula'),correction(5,'Solve the equation.','Unrelated correction')],representatives:{}};
 const [task]=createSemanticTasks({...options,pages:[4],workflowState});
 assert.match(task.prompt,/Apply these decisions even when original PDF pixels or Word text differ/);
 assert.match(task.prompt,/Correct teaching formula/);
 assert.match(task.prompt,/Find the corrected probability/);
 assert.match(task.prompt,/Use the taught method/);
 assert.doesNotMatch(task.prompt,/Unrelated secret|Unrelated correction/);
 assert.equal(task.inventory.entries[0].description,'Find the corrected probability.');
 const [inv]=createSemanticTasks({...options,pages:[4],stage:'inventory',workflowState});
 assert.doesNotMatch(inv.prompt,/APPROVED EDITORIAL DECISIONS/);
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

test('source card diagrams may map to individual editable card slots, not arbitrary prose slots',()=>{
 const a=author(4),i=inventory(4);i.entries.push({id:'source-card',kind:'diagram',description:'Letter M card'});
 const layout={id:'cards',type:'layout',arrangement:'cards',slots:[{id:'card-m',blocks:[{id:'letter-m',type:'paragraph',inlines:[{type:'text',text:'M'}]}]}]};
 a.sections[0].blocks.push({id:'native-cards',type:'rich-text',content:{format:'maths-editor-document-v1',version:1,blocks:[layout]}});
 a.inventoryMappings.push({inventoryId:'source-card',targetId:'card-m'});
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 layout.arrangement='parallel';assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
});

test('source tables may map to populated native tables but not empty placeholders',()=>{
 const a=author(4),i=inventory(4);i.entries.push({id:'source-table',kind:'diagram',description:'Outcome table'});
 const table={id:'native-table',type:'table',rows:[[{blocks:[{id:'heading',type:'paragraph',inlines:[{type:'text',text:'Outcome'}]}]}]]};
 a.sections[0].blocks.push({id:'table-block',type:'rich-text',content:{format:'maths-editor-document-v1',version:1,blocks:[table]}});
 a.inventoryMappings.push({inventoryId:'source-table',targetId:'native-table'});
 assert.doesNotThrow(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}));
 table.rows=[];assert.throws(()=>validateSemanticResult(a,{stage:'author',page:4,inventory:i}),/non-diagram/);
});

test('a concurrent canonical edit survives an in-flight transcription',async t=>{
 const options={...fixture(t),pages:[4]},task=createSemanticTasks(options)[0];
 const report=await runSemanticPackets(options,{...quiet,runner:async()=>{
  fs.writeFileSync(task.resultFile,'user edit');return {result:author(4),metrics:{}};
 }});
 assert.equal(report.ok,false);assert.equal(fs.readFileSync(task.resultFile,'utf8'),'user edit');
 assert.ok(fs.existsSync(path.join(task.out,'result.json')));
});

test('validation and publication failures retain model usage, phase outcomes and immutable generation',async t=>{
 const options={...fixture(t),pages:[4]},metrics={usage:{input_tokens:100,cached_input_tokens:60,output_tokens:25},elapsedMs:50};
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:{pageNumber:4},metrics})});
 const root=path.join(options.runDir,'semantic-packets');
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'page-004.author.1/generation.json'))),{pageNumber:4});
 let ledger=fs.readFileSync(path.join(root,'ledger.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 assert.deepEqual(ledger[0].usage,metrics.usage);assert.equal(ledger[0].canonicalWritten,false);
 const task=createSemanticTasks({...options,attempt:2})[0];
 await runSemanticPackets({...options,attempt:2},{...quiet,runner:async()=>{fs.writeFileSync(task.resultFile,'concurrent edit');return {result:author(4),metrics};}});
 const events=fs.readFileSync(path.join(root,'attempt-events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 assert.deepEqual(events.filter(e=>e.event==='finished').map(e=>e.failedPhase),['validation','publication']);
 const receipt=readAttemptReceipt(root);assert.equal(receipt.calls,2);assert.equal(receipt.usage.input_tokens,200);assert.equal(receipt.usage.cached_input_tokens,120);assert.equal(receipt.missingUsage,0);
 assert.equal(fs.readFileSync(task.resultFile,'utf8'),'concurrent edit');
});

test('generation errors record missing usage honestly and unfinished events survive resume',async t=>{
 const options={...fixture(t),pages:[4]},root=path.join(options.runDir,'semantic-packets');
 await runSemanticPackets(options,{...quiet,runner:async()=>{const error=Error('runner failed');error.metrics={elapsedMs:12,usage:null};throw error;}});
 const before=readAttemptReceipt(root);assert.equal(before.missingUsage,1);assert.equal(before.callElapsedMs,12);
 const unfinished=recordAttempt(root,{stage:'author',page:5,attempt:1});unfinished.phase('generation');
 const after=readAttemptReceipt(root);assert.equal(after.unfinished.length,1);assert.equal(after.calls,2);assert.equal(after.missingUsage,2);
 fs.appendFileSync(path.join(root,'attempt-events.jsonl'),'{"attemptId":');
 assert.equal(readAttemptReceipt(root).incompleteTail,true);
 assert.throws(()=>recordAttempt(root,{stage:'author',page:5,attempt:2}),/incomplete tail/);
});

test('concurrent attempt time is a union, not a sum of model call durations',()=>{
 const events=[['a',0,100],['b',50,150]].flatMap(([attemptId,start,end])=>[
  {attemptId,event:'started',time:start},{attemptId,event:'phase-started',phase:'generation',time:start},
  {attemptId,event:'phase-finished',phase:'generation',time:end,elapsedMs:end-start,metrics:{elapsedMs:100,usage:{input_tokens:10,cached_input_tokens:6,output_tokens:3}}},
  {attemptId,event:'finished',time:end},
 ]);
 const receipt=summarizeAttemptEvents(events);assert.equal(receipt.completedAttemptActiveWallMs,150);assert.equal(receipt.callElapsedMs,200);assert.equal(receipt.usage.input_tokens,20);assert.equal(receipt.usage.cached_input_tokens,12);
});

test('mapping-only repair preserves content and valid mappings, records reasons, and revalidates',async t=>{
 const options={...fixture(t),pages:[4]},bad=author(4);
 bad.inventoryMappings.push({inventoryId:'p4-generated-heading',targetId:'s-4'});
 const metrics={usage:{input_tokens:30,output_tokens:10}};
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:bad,metrics})});
 const repair={edits:[{index:1,original:bad.inventoryMappings[1],replacement:null,reason:'Generated section heading is not an independently inventoried item; all actual entries retain mappings.'}]};
 const report=await runSemanticPackets({...options,attempt:2,repairFrom:1},{...quiet,runner:async({prompt,images})=>{
  assert.match(prompt,/Repair unknown inventory references only/);assert.deepEqual(images,[]);return {result:repair,metrics};
 }});
 assert.equal(report.ok,true);
 const task=createSemanticTasks({...options,attempt:2})[0];
 assert.deepEqual(JSON.parse(fs.readFileSync(task.resultFile)),author(4));
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(task.out,'repair.json'))),repair);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(options.runDir,'semantic-packets/page-004.author.1/generation.json'))),bad);
 assert.equal(readAttemptReceipt(task.packetRoot).calls,2);
 assert.throws(()=>applyMappingRepair(bad,inventory(4),{edits:[{...repair.edits[0],index:0,original:bad.inventoryMappings[0]}]}),/invalid/);
 assert.throws(()=>applyMappingRepair(bad,inventory(4),{edits:[{...repair.edits[0],reason:''}]}),/invalid/);
 fs.writeFileSync(path.join(options.runDir,'evidence/pages/page-004.txt'),'changed source');
 await assert.rejects(()=>runSemanticPackets({...options,attempt:3,repairFrom:1},{...quiet,runner:()=>assert.fail('stale repair called runner')}),/inputs changed/);
});

test('a targeted repair cannot hide other content defects or drop known inventory coverage',async t=>{
 const options={...fixture(t),pages:[4]},bad=author(4);delete bad.sections[0].blocks[0].content.answer;
 bad.inventoryMappings.push({inventoryId:'generated',targetId:'s-4'});
 await runSemanticPackets(options,{...quiet,runner:async()=>({result:bad,metrics:{}})});
 const report=await runSemanticPackets({...options,attempt:2,repairFrom:1},{...quiet,runner:async()=>({result:{edits:[{index:1,original:bad.inventoryMappings[1],replacement:null,reason:'Generated layout'}]},metrics:{}})});
 assert.equal(report.ok,false);assert.match(report.pages[0].error,/lacks short\/worked/);
 assert.equal(fs.existsSync(createSemanticTasks(options)[0].resultFile),false);
 assert.equal(mappingRepairContext(bad,inventory(4)).invalid.length,1);
});

const sharedAuthor=()=>{
 const p=author(4);p.authoringFormat=SHARED_DIAGRAM_FORMAT;
 p.diagramLibrary={base:'\\begin{tikzpicture}\\draw (0,0)--(1,0);',end:'\\end{tikzpicture}'};
 p.sections[0].blocks[0].content.questionDiagrams=[{id:'q4-diagram',format:'tikz',role:'question',codeParts:['base','end'],spec:{sourcePage:4}}];
 return p;
};

test('shared authoring is opt-in, fingerprints its format, and publishes only ordinary editable code',async t=>{
 const options={...fixture(t),pages:[4]},enabled={...options,config:{...options.config,authoringFormat:SHARED_DIAGRAM_FORMAT}};
 const normalTask=createSemanticTasks(options)[0],sharedTask=createSemanticTasks(enabled)[0];
 assert.notEqual(normalTask.inputHash,sharedTask.inputHash);assert.doesNotMatch(normalTask.prompt,/Optional internal shared-diagram/);assert.match(sharedTask.prompt,/NO inserted spaces\/newlines/);
 assert.deepEqual(createSemanticTasks({...options,stage:'inventory'})[0].prompt,createSemanticTasks({...enabled,stage:'inventory'})[0].prompt);
 assert.throws(()=>createSemanticTasks({...options,config:{...options.config,authoringFormat:'unknown'}}),/Unsupported/);
 const raw=sharedAuthor(),report=await runSemanticPackets(enabled,{...quiet,runner:async()=>({result:raw,metrics:{usage:{output_tokens:20}}})});
 assert.equal(report.ok,true);
 const canonical=JSON.parse(fs.readFileSync(sharedTask.resultFile));assert.equal(canonical.authoringFormat,undefined);assert.equal(canonical.diagramLibrary,undefined);
 assert.equal(canonical.sections[0].blocks[0].content.questionDiagrams[0].code,raw.diagramLibrary.base+raw.diagramLibrary.end);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(sharedTask.out,'generation.json'))),raw);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(sharedTask.out,'materialized.json'))),canonical);
 const events=fs.readFileSync(path.join(sharedTask.packetRoot,'attempt-events.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(events[0].authoringFormat,SHARED_DIAGRAM_FORMAT);
 assert.equal(events.find(e=>e.event==='phase-finished'&&e.phase==='generation').generatedCharacters,JSON.stringify(raw).length);
 assert.equal(events.find(e=>e.event==='phase-finished'&&e.phase==='validation').materializedCharacters,JSON.stringify(canonical).length);
 assert.equal(semanticCacheInfo(sharedTask).kind,'hit');
 await runSemanticPackets(enabled,{...quiet,runner:()=>assert.fail('materialized cache caused regeneration')});
});

test('shared materialization failures retain metrics and bounded mapping repairs consume expanded content',async t=>{
 const options={...fixture(t),pages:[4]},raw=sharedAuthor();
 const disabled=await runSemanticPackets(options,{...quiet,runner:async()=>({result:raw,metrics:{usage:{output_tokens:20}}})});
 assert.equal(disabled.ok,false);assert.match(disabled.pages[0].error,/explicit config/);
 const enabled={...options,config:{...options.config,authoringFormat:SHARED_DIAGRAM_FORMAT},attempt:2};
 raw.inventoryMappings.push({inventoryId:'generated-heading',targetId:'s-4'});
 const failed=await runSemanticPackets(enabled,{...quiet,runner:async()=>({result:raw,metrics:{usage:{output_tokens:30}}})});
 assert.equal(failed.ok,false);assert.match(failed.pages[0].error,/Unknown inventory mapping/);
 const repair=await runSemanticPackets({...enabled,attempt:3,repairFrom:2},{...quiet,runner:async()=>({result:{edits:[{index:1,original:raw.inventoryMappings[1],replacement:null,reason:'Generated heading is not a source inventory entry.'}]},metrics:{usage:{output_tokens:5}}})});
 assert.equal(repair.ok,true);
 const saved=JSON.parse(fs.readFileSync(createSemanticTasks(enabled)[0].resultFile));assert.equal(saved.authoringFormat,undefined);assert.equal(saved.inventoryMappings.length,1);assert.equal(typeof saved.sections[0].blocks[0].content.questionDiagrams[0].code,'string');
 const receipt=readAttemptReceipt(path.join(options.runDir,'semantic-packets'));assert.equal(receipt.calls,3);assert.equal(receipt.usage.output_tokens,55);
});
