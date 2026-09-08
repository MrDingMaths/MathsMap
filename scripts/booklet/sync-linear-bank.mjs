// Explicit source-to-bank sync. Prepare all changes and verify before writing.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {normaliseQuestion,validateQuestion,makeBankManifest} from '../../src/lib/practice-question-model.js';
import {captureQuestionPresentation} from '../../src/lib/question-presentation.js';
import {validateTeachingModule} from '../../src/lib/teaching-module-model.js';

const sourceFile='booklets/projects/linear-relationships-complete-v1.json';
const workingFile='booklets/projects/linear-relationships-bank-working-v1.json';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const clone=structuredClone;
const sourceRaw=fs.readFileSync(sourceFile,'utf8'),source=JSON.parse(sourceRaw);
const working=read(workingFile),index=read('docs/linear-relationships-bank-index.json');
const bankRoot='booklets/question-bank',moduleRoot='booklets/module-bank';
const beforeFiles=new Map(),writes=new Map(),records=new Map();
const plan=(file,value)=>{beforeFiles.set(file,fs.existsSync(file)?fs.readFileSync(file,'utf8'):null);writes.set(file,JSON.stringify(value,null,2)+'\n');};
const archive=(file,previous)=>{const target=path.join(path.dirname(file),'.revisions',previous.id,hash(previous)+'.json');if(!fs.existsSync(target))plan(target,previous);};
for(const name of fs.readdirSync(bankRoot).filter(n=>n.endsWith('.json')&&n!=='manifest.json')) {const q=read(`${bankRoot}/${name}`);records.set(q.id,q);}
const oldBlocks=new Map(working.sections.flatMap(s=>s.blocks.map(b=>[b.id,b])));
const currentBlocks=new Map(source.sections.flatMap(s=>s.blocks.map(b=>[b.id,{...clone(b),sourcePageNumber:b.sourcePageNumber??s.sourcePageNumber}])));
const questionBlocks=[...currentBlocks.values()].filter(b=>b.type==='question');
const mapping=new Map();
function visit(v,fn){if(!v||typeof v!=='object')return;fn(v);for(const child of Object.values(v))if(typeof child==='object')visit(child,fn);}
for(const block of oldBlocks.values())visit(block.content,n=>{if(n.id&&n.teachingMapping)mapping.set(n.id,n.teachingMapping);});
const retired=[...oldBlocks.values()].filter(b=>b.type==='question'&&!currentBlocks.has(b.id));
const retiredIds=new Set(retired.map(b=>b.bankRef.id));
const report={source:{projectId:source.id,revision:source.revision,sha256:hash(sourceRaw)},questions:[],retiredContinuations:[],modules:[],sourceUnchanged:true};
const now=new Date().toISOString();
function stripMappings(value){const result=clone(value);visit(result,n=>{delete n.teachingMapping;});return result;}
for(const block of questionBlocks){
  const old=oldBlocks.get(block.id);assert.ok(old?.bankRef?.id,`No existing bank match for ${block.id}`);
  const previous=records.get(old.bankRef.id);assert.ok(previous,`Missing ${old.bankRef.id}`);
  assert.equal(hash(previous),old.bankRef.revision,`Bank edited independently: ${previous.id}`);
  block.classification=clone(previous.classification);
  visit(block.content,n=>{if(n.id&&mapping.has(n.id))n.teachingMapping=clone(mapping.get(n.id));});
  const presentation=captureQuestionPresentation(block,source.settings?.layoutOverrides);
  if(old.presentation?.selectionGroup){
    const ids=old.presentation.selectionGroup.questionIds.filter(id=>!retiredIds.has(id));
    if(ids.length>1)presentation.selectionGroup={...clone(old.presentation.selectionGroup),questionIds:ids};
  }
  block.presentation=presentation;
  const q=normaliseQuestion({...previous,title:block.title??'',content:block.content,presentation,updatedAt:previous.updatedAt});
  const check=validateQuestion(q);assert.ok(check.valid,`${block.id}: ${check.errors.join('; ')}`);
  assert.deepEqual(q.classification,previous.classification);
  assert.deepEqual(stripMappings(q.content),stripMappings(normaliseQuestion(block).content));
  const changed=hash(q)!==hash(previous);
  if(changed){q.updatedAt=now;archive(`${bankRoot}/${q.id}.json`,previous);plan(`${bankRoot}/${q.id}.json`,q);records.set(q.id,q);}
  block.bankRef={id:q.id,revision:hash(q)};block.canonicalId=q.id;block.snapshotKind='bank';
  block.provenance={...old.provenance,...report.source,projectSha256:report.source.sha256,sourceContentSha256:hash(currentBlocks.get(block.id).content)};
  report.questions.push({sourceBlockId:block.id,bankId:q.id,revision:hash(q),changed,contentEqual:true,presentationEqual:true});
}
// These records only held continuations that are now part of their parent question.
// Keep their files/history for pinned snapshots, but remove them from active selection.
for(const block of retired){
  assert.ok(block.id.endsWith('-continued'),'Unexpected removed question: '+block.id);
  const parentId=block.id.replace(/-continued$/,'');assert.ok(currentBlocks.has(parentId));
  const parentNodes=new Set();visit(currentBlocks.get(parentId).content,n=>{if(n.id)parentNodes.add(n.id);});
  for(const child of block.content.children??[])assert.ok(parentNodes.has(child.id),'Continuation not merged: '+child.id);
  const previous=records.get(block.bankRef.id);assert.equal(hash(previous),block.bankRef.revision);
  const q={...clone(previous),status:'draft',updatedAt:now};
  q.review.history.push({at:now,action:'superseded',reason:'Continuation merged into current booklet question',replacementQuestionId:currentBlocks.get(parentId).bankRef.id});
  archive(`${bankRoot}/${q.id}.json`,previous);plan(`${bankRoot}/${q.id}.json`,q);records.set(q.id,q);
  report.retiredContinuations.push({bankId:q.id,replacementQuestionId:currentBlocks.get(parentId).bankRef.id});
}
for(const section of working.sections){
  section.blocks=section.blocks.filter(b=>currentBlocks.has(b.id)).map(b=>{
    const current=clone(currentBlocks.get(b.id));
    if(current.type!=='question')current.presentation=captureQuestionPresentation(current,source.settings?.layoutOverrides);
    return current;
  });
  const moduleId='linear-relationships-'+section.id.replace('linear-module-','').toLowerCase();
  const previous=read(`${moduleRoot}/${moduleId}.json`),module=clone(previous);
  module.sequence=section.blocks.map(b=>b.type==='question'
    ? {type:'question-ref',id:`module-ref-${b.id}`,questionId:b.bankRef.id,questionRevision:b.bankRef.revision,snapshot:clone(records.get(b.bankRef.id)),pedagogyRole:b.pedagogyRole??'guided-practice',order:'fixed'}
    : {type:'content-block',id:`module-item-${b.id}`,pedagogyRole:b.pedagogyRole??(b.type==='worked-example'?'worked-example':'theory'),block:clone(b)});
  const checked=validateTeachingModule(module);assert.ok(checked.valid,`${moduleId}: ${checked.errors.join('; ')}`);
  archive(`${moduleRoot}/${moduleId}.json`,previous);plan(`${moduleRoot}/${moduleId}.json`,module);
  report.modules.push({id:moduleId,blocks:section.blocks.length});
  const entry=index.modules.find(m=>m.id===moduleId);assert.ok(entry);
  entry.blocks=section.blocks.map(b=>{const parts=[];visit(b.content,n=>{if(n.answer)parts.push(n.id);});return{id:b.id,type:b.type,page:b.sourcePageNumber,bankRef:b.bankRef??null,parts,provenance:b.provenance??null};});
}
assert.equal(report.questions.length,168);
assert.equal(report.modules.length,13);
working.source={type:'project-copy',...report.source};working.revision++;working.updatedAt=now;
working.settings=clone(source.settings);
index.baseline={...report.source,capturedAt:now};index.lastSync={at:now,questions:168,retiredContinuations:report.retiredContinuations};
plan(workingFile,working);plan('docs/linear-relationships-bank-index.json',index);
plan(`${bankRoot}/manifest.json`,makeBankManifest([...records.values()].filter(q=>q.status==='approved').sort((a,b)=>a.id.localeCompare(b.id))));
report.changedQuestions=report.questions.filter(q=>q.changed).length;
plan('docs/linear-relationships-bank-sync.json',report);
const out='output/linear-bank-sync';fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(`${out}/plan.json`,JSON.stringify(report,null,2)+'\n');
if(process.argv.includes('--apply')){
  assert.equal(fs.readFileSync(sourceFile,'utf8'),sourceRaw,'Source edited during sync');
  for(const [file,raw]of beforeFiles)assert.equal(fs.existsSync(file)?fs.readFileSync(file,'utf8'):null,raw,`Concurrent edit: ${file}`);
  fs.writeFileSync(`${out}/rollback.json`,JSON.stringify([...beforeFiles],null,2)+'\n');
  try{for(const[file,raw]of writes){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,raw);}}
  catch(error){for(const[file,raw]of beforeFiles){if(raw===null){if(fs.existsSync(file))fs.unlinkSync(file);}else fs.writeFileSync(file,raw);}throw error;}
  for(const q of report.questions){const saved=read(`${bankRoot}/${q.bankId}.json`);assert.equal(hash(saved),q.revision);}
  assert.equal(fs.readFileSync(sourceFile,'utf8'),sourceRaw);
}
console.log(JSON.stringify({sourceRevision:source.revision,questions:report.questions.length,changed:report.changedQuestions,retired:retired.length,modules:report.modules.length,applied:process.argv.includes('--apply')}));
