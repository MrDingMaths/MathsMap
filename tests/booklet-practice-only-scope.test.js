import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateSemanticResult,createSemanticTasks} from '../scripts/booklet/semantic-workflow.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
import {isSelectableBankQuestion} from '../src/lib/question-bank-eligibility.js';
import {normaliseQuestion} from '../src/lib/practice-question-model.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {organiseExercises} from '../src/lib/booklet-exercises.js';
import {exerciseNumbers,flowEditionSections} from '../src/lib/booklet-flow.js';
const inventory=()=>({pageNumber:4,inventoried:true,entries:[{id:'q',kind:'question',description:'True or false?'},{id:'theory',kind:'teaching',description:'Index rule',exclusionReason:'Standalone reference only'}]});
const author=()=>({pageNumber:4,sections:[{id:'s',title:'Concept Check',phase:'practice',role:'mixed-practice',blocks:[{id:'b',type:'question',content:{id:'q',type:'question',prompt:'True or false?',answer:{short:'True',worked:'Apply the product rule.'}}}]}],inventoryMappings:[{inventoryId:'q',targetId:'q'}]});
const check=(r,i=inventory())=>validateSemanticResult(r,{stage:'author',page:4,inventory:i,contentScope:'practice-only'});
test('mixed-page teaching excluded while embedded question working survives',()=>{
 const i=inventory();i.entries.push({id:'given',kind:'example',description:'Supplied working',embeddedInQuestion:'q'});
 const a=author();a.inventoryMappings.push({inventoryId:'given',targetId:'q',field:'/prompt'});assert.doesNotThrow(()=>check(a,i));
 delete i.entries[2].embeddedInQuestion;assert.throws(()=>check(a,i),/exclude standalone teaching/);
});
test('subparts of an explicitly excluded teaching example remain excluded',()=>{
 const i=inventory();i.entries.push({id:'example-part',kind:'part',parentId:'theory',description:'Example part',exclusionReason:'Part of excluded theory'});
 assert.doesNotThrow(()=>check(author(),i));i.entries.at(-1).parentId='q';assert.throws(()=>check(author(),i),/cannot exclude a practice/);
});
test('practice scope rejects teaching output, review demotion and exclusion bypasses',()=>{
 let a=author();a.sections[0].phase='teaching';assert.throws(()=>check(a),/must be practice/);
 a=author();a.sections[0].blocks[0].sourceAtom={kind:'review'};assert.throws(()=>check(a),/non-selectable/);
 a=author();a.inventoryMappings.push({inventoryId:'theory',targetId:'q'});assert.throws(()=>check(a),/Excluded teaching/);
 a=author();a.inventoryMappings[0].exclusionReason='Skip';assert.throws(()=>check(a),/Practice content was excluded/);
});
test('Concept Check and chapter reviews remain selectable through question normalisation',()=>{
 for(const label of ['Concept Check','Chapter 1 Review Set One','Chapter 1 Review Set Two']){
  const b=author().sections[0].blocks[0];b.status='approved';b.sourceAtom={kind:'practice',label};
  assert.equal(isSelectableBankQuestion(normaliseQuestion(b)),true);
 }
});
test('pixel-only tasks omit OCR and bind the selected answer images',t=>{
 const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'practice-scope-'));t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));
 for(const dir of ['evidence/pages','evidence/teacher/pages'])fs.mkdirSync(path.join(runDir,dir),{recursive:true});
 for(const [dir,p] of [['evidence/pages',3],['evidence/pages',4],['evidence/teacher/pages',1]])for(const ext of ['png','txt'])fs.writeFileSync(path.join(runDir,dir,`page-${String(p).padStart(3,'0')}.${ext}`),ext==='txt'?'UNTRUSTED_OCR':'image');
 const options={runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[4],contextPages:[3],teacherPages:[1]},config:{title:'Chapter',contentScope:'practice-only',sourceEvidenceMode:'pixels',topics:[{id:'1a',title:'1A',start:4,end:6,teachingPages:[3],teacherPages:[1]}]},stage:'inventory',pages:[4]};
 const a=createSemanticTasks(options)[0];assert.doesNotMatch(a.prompt,/UNTRUSTED_OCR/);assert.match(a.prompt,/ANSWER BOOK PDF PAGE 1/);assert.match(a.prompt,/never page number alone/);
 fs.appendFileSync(path.join(runDir,'evidence/teacher/pages/page-001.png'),'changed');assert.notEqual(createSemanticTasks(options)[0].inputHash,a.inputHash);
 assert.throws(()=>createSemanticTasks({...options,pages:[3]}),/Unexpected source page/);
 assert.throws(()=>createSemanticTasks({...options,config:{...options.config,contentScope:'bad'}}),/Unsupported contentScope/);
});
test('source order survives differing ratings and save/reopen normalisation',()=>{
 const p=normalizeEditableProject({id:'p',settings:{questionOrder:'source'},sections:[{id:'s',title:'Practice',phase:'practice',topicId:'t',blocks:[3,1,2].map(n=>({id:'b'+n,type:'question',content:{id:'q'+n,type:'question',prompt:'Q'+n},flow:{localDifficulty:{reasoningScore:n}}}))}]});
 const result=normalizeEditableProject(organiseExercises(p));assert.equal(result.settings.questionOrder,'source');assert.deepEqual(result.sections[0].blocks.map(b=>b.id),['b3','b1','b2']);
});
test('whole-question identity rejects merged printed questions and extra blocks',()=>{
 const i=inventory();i.entries.push({id:'q2',kind:'question',description:'Another printed question'});
 const a=author();a.inventoryMappings.push({inventoryId:'q2',targetId:'q'});assert.throws(()=>check(a,i),/own whole question block/);
 const extra=author();extra.sections[0].blocks.push({...extra.sections[0].blocks[0],id:'extra',content:{...extra.sections[0].blocks[0].content,id:'extra-q'}});assert.throws(()=>check(extra),/without a printed question identity/);
});
test('source exercise labels remain present in answer and question navigation',()=>{
 const p=normalizeEditableProject({id:'p',topics:[{id:'t',title:'Indices',exerciseLabel:'1A'}],settings:{exerciseOrganisation:'topic'},sections:[{...author().sections[0],topicId:'t'}]});
 assert.equal(exerciseNumbers(p).t,'1A');
 const s=flowEditionSections(p,'with-short');assert.ok(s.every(x=>x.exerciseNumber==='1A'));assert.equal(s[0].difficultyTitle,'Exercise 1A');
});
