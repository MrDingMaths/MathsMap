import test from 'node:test';
import assert from 'node:assert/strict';
import {TRANSCRIPTION_DEFAULT,requireCurrentTranscription} from '../scripts/booklet/transcription-settings.mjs';
import {removeCartesianOriginLabel} from '../scripts/booklet/house-style.mjs';
import {cartesianTikz} from '../scripts/booklet/linear-geometry.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {runTranscriptionTasks} from '../scripts/booklet/codex-transcription.mjs';
test('production transcription requires Codex Astra Low, without provider or effort substitution',()=>{
 assert.deepEqual(TRANSCRIPTION_DEFAULT,{provider:'codex',model:'gpt-6-astra',effort:'low'});
 assert.equal(requireCurrentTranscription({...TRANSCRIPTION_DEFAULT}).model,'gpt-6-astra');
 for(const override of [{provider:'agy'},{effort:'high'},{model:'gpt-5.6-luna'},{model:'gemini-3.8-flash-high'}])assert.throws(()=>requireCurrentTranscription({...TRANSCRIPTION_DEFAULT,...override}),/fresh Astra Low/);
});
test('origin lettering is omitted without deleting axes or a named O elsewhere',()=>{
 const source=String.raw`\node[right] at (5,0) {$x$};\node[below left] at (0,0) {$O$};\node at (2,3) {$O$};`;
 assert.equal(removeCartesianOriginLabel(source),String.raw`\node[right] at (5,0) {$x$};\node at (2,3) {$O$};`);
 const code=cartesianTikz({points:[{label:'A',x:1,y:2}]});assert.ok(!code.includes('{$O$}'));assert.ok(code.includes('{$A$}'));
});
test('transcription routing preserves existing outputs, rejects missing coverage and logs failures',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'astra-transcription-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 for(const n of [1,2,3]){const stem='task-00'+n;fs.writeFileSync(path.join(dir,stem+'.md'),'Transcribe page '+n);fs.writeFileSync(path.join(dir,stem+'.ids.json'),JSON.stringify({ids:['page-'+n]}));}
 const original=JSON.stringify({id:'page-1',userEdit:'Keep me'});fs.writeFileSync(path.join(dir,'task-001.result.json'),original);let calls=0;
 const result=await runTranscriptionTasks(dir,TRANSCRIPTION_DEFAULT,{runner:async({prompt})=>{calls++;assert.match(prompt,/8\.5 pt axis numbers/);assert.match(prompt,/10 pt axis, coordinate and equation labels/);assert.match(prompt,/do not add them automatically/);assert.ok(!prompt.includes('at least 11 pt'));return{result:{id:prompt.includes('page 2')?'page-2':'wrong-page'},metrics:{requestedModel:'gpt-6-astra',effort:'low'}};}});
 assert.equal(calls,2);assert.equal(result.ok,false);assert.equal(fs.readFileSync(path.join(dir,'task-001.result.json'),'utf8'),original);assert.ok(fs.existsSync(path.join(dir,'task-002.result.json')));assert.equal(fs.existsSync(path.join(dir,'task-003.result.json')),false);assert.match(fs.readFileSync(path.join(dir,'ledger.jsonl'),'utf8'),/Missing expected ids/);
 await assert.rejects(()=>runTranscriptionTasks(dir,{provider:'agy',model:'gemini-3.8-flash-high',effort:'high'},{runner:()=>{throw new Error('must never start');}}),/fresh Astra Low/);
});


test('fresh reconstruction and dedicated diagram prompts share final-print typography',async()=>{
 const {reconstructionPrompt}=await import('../scripts/booklet/candidate-validation.mjs');
 for(const stage of ['reconstruction','diagrams']){
  const prompt=reconstructionPrompt(stage,4);
  assert.match(prompt,/8\.5 pt axis numbers/);
  assert.match(prompt,/10 pt axis, coordinate and equation labels/);
  assert.match(prompt,/do not add them automatically/);
  assert.match(prompt,/tickLabels:false and ticks:false/);
  assert.ok(!prompt.includes('at least 11 pt'));
 }
});

test('both production prompt routes include booklet methods and MathsDatabase solution rules',async t=>{
 const {reconstructionPrompt}=await import('../scripts/booklet/candidate-validation.mjs');
 const {SOLUTION_CONVENTIONS}=await import('../scripts/booklet/solution-conventions.mjs');
 assert.ok(reconstructionPrompt('reconstruction',4).includes(SOLUTION_CONVENTIONS));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'solution-conventions-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.writeFileSync(path.join(dir,'task-001.md'),'Generate the solution.');
 fs.writeFileSync(path.join(dir,'task-001.ids.json'),JSON.stringify({ids:['page-1']}));
 let called=false;
 const result=await runTranscriptionTasks(dir,TRANSCRIPTION_DEFAULT,{runner:async({prompt})=>{
  called=true;assert.ok(prompt.includes(SOLUTION_CONVENTIONS));
  assert.match(prompt,/worked examples, Key Ideas and scaffolds/);
  assert.match(prompt,/Do not replace these with algebraic shortcuts/);
  assert.match(prompt,/record a review flag/);
  assert.match(prompt,/align\*/);
  return {result:{id:'page-1'},metrics:{}};
 }});
 assert.ok(called);assert.equal(result.ok,true);
});
