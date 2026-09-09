// Explicitly accept current bank ratings without advancing question-content pins.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';
import {revisionHash} from './bank-sync.mjs';

const id=process.argv.find(a=>a.startsWith('--project='))?.slice(10)??'linear-relationships-v1';
const project=await loadBookletProject(id),before=structuredClone(project);
let checked=0,changed=0,bandsChanged=0;
for(const block of project.sections.flatMap(s=>s.blocks)){
  const old=block.flow?.bankDifficulty;
  if(!old||!block.bankRef?.id)continue;
  assert.match(block.bankRef.id,/^[a-zA-Z0-9._-]+$/);
  const bank=JSON.parse(await fs.readFile(`booklets/question-bank/${block.bankRef.id}.json`,'utf8'));
  const {difficulty,reasoningScore}=bank.classification;
  assert.ok(Number.isFinite(reasoningScore),`Missing reasoning score: ${bank.id}`);
  checked++;
  if(old.difficulty===difficulty&&old.reasoningScore===reasoningScore)continue;
  changed++;
  if(old.difficulty!==difficulty)bandsChanged++;
  block.flow.bankDifficulty={difficulty,reasoningScore,revision:revisionHash(bank)};
}
console.log(JSON.stringify({project:id,checked,changed,bandsChanged}));
if(changed&&process.argv.includes('--apply')){
  const saved=await saveBookletProject(project,{expectedRevision:before.revision});
  const restored=structuredClone(saved);
  const originals=new Map(before.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));
  for(const b of restored.sections.flatMap(s=>s.blocks))if(b.flow?.bankDifficulty)b.flow.bankDifficulty=originals.get(b.id).flow.bankDifficulty;
  restored.revision=before.revision;restored.updatedAt=before.updatedAt;
  assert.deepEqual(restored,before,'Only display ratings and save metadata may change');
  console.log(`Saved revision ${saved.revision}; question content, pins, order and layout preserved.`);
}
