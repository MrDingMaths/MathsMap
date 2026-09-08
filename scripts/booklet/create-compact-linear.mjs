// A consumer copy only: never refresh bank content or change source ownership.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {duplicateBookletProject,saveBookletProject} from './project-studio-server.mjs';
import {organiseExercises} from '../../src/lib/booklet-exercises.js';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {isPractice,exerciseNumbers} from '../../src/lib/booklet-flow.js';
const sourceId='linear-relationships-flexible-v1',copyId='linear-relationships-compact-exercises-v1';
const file=id=>`booklets/projects/${id}.json`,hash=v=>createHash('sha256').update(v).digest('hex');
const source=JSON.parse(fs.readFileSync(file(sourceId))),ratings={};
const protectedFiles=[file(sourceId),file('linear-relationships-complete-v1'),...fs.readdirSync('booklets/question-bank').filter(n=>n.endsWith('.json')).map(n=>`booklets/question-bank/${n}`),'booklets/question-bank/.sync/links.json'];
const before=new Map(protectedFiles.map(f=>[f,hash(fs.readFileSync(f))]));
for(const block of source.sections.flatMap(s=>s.blocks).filter(isPractice)){
  const {id,revision}=block.bankRef;
  let bank=JSON.parse(fs.readFileSync(`booklets/question-bank/${id}.json`));
  if(hash(JSON.stringify(bank))!==revision)bank=JSON.parse(fs.readFileSync(path.join('booklets/question-bank/.revisions',id,revision+'.json')));
  assert.equal(hash(JSON.stringify(bank)),revision,`Pinned bank revision ${id}`);
  ratings[id]={difficulty:bank.classification.difficulty,reasoningScore:bank.classification.reasoningScore,revision};
}
const candidate=organiseExercises(source,ratings),checked=validateEditableProject(candidate);
assert.equal(checked.valid,true,checked.errors.join('; '));
const blocks=p=>p.sections.flatMap(s=>s.blocks),byId=new Map(blocks(source).map(b=>[b.id,b]));
assert.equal(blocks(candidate).length,byId.size);
for(const b of blocks(candidate))for(const key of ['content','examples','bankRef','classification','sourceAtom','teachingMapping'])assert.deepEqual(b[key],byId.get(b.id)[key],`${b.id} ${key}`);
console.log(JSON.stringify({copyId,exercises:Object.keys(exerciseNumbers(candidate)).length,sections:candidate.sections.length,blocks:blocks(candidate).length}));
if(process.argv.includes('--apply')){
  if(fs.existsSync(file(copyId)))throw Error('Trial already exists; refusing to overwrite it.');
  const copy=await duplicateBookletProject(sourceId,{copyId,title:'Linear Relationships — Compact Exercise Trial'});
  const saved=await saveBookletProject(organiseExercises(copy,ratings),{expectedRevision:copy.revision});
  console.log(`Created ${saved.id} at revision ${saved.revision}`);
}
for(const [f,h] of before)assert.equal(hash(fs.readFileSync(f)),h,`Protected file changed: ${f}`);
console.log('Source booklets, bank content, manifest and sync ownership unchanged.');
