// Restore the accepted layout through editable flow boundaries, preserving the
// flexible copy's pinned bank snapshots and using conflict-aware persistence.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';
import {matchSourceLayout,flowNumbers,isPractice} from '../../src/lib/booklet-flow.js';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
const sourceFile='booklets/projects/linear-relationships-complete-v1.json';
const bytes=fs.readFileSync(sourceFile),source=JSON.parse(bytes);
const current=await loadBookletProject('linear-relationships-flexible-v1');
const candidate=matchSourceLayout(current,source),checked=validateEditableProject(candidate);
assert.equal(checked.valid,true,checked.errors.join('; '));
const blocks=p=>p.sections.flatMap(s=>s.blocks);
assert.deepEqual(blocks(candidate).map(b=>b.id),blocks(source).map(b=>b.id),'Content order must match the original');
const numbers=flowNumbers(candidate);
for(let i=0;i<blocks(current).length;i++){
 const before=structuredClone(blocks(current)[i]),after=structuredClone(blocks(candidate)[i]);
 delete before.flow;delete after.flow;assert.deepEqual(after,before,'Layout matching must preserve content, evidence and bank pins');
 if(isPractice(after))assert.equal(numbers[after.id],blocks(source)[i].sourceOrder);
}
fs.mkdirSync('.booklet-work/flexible-export',{recursive:true});
fs.writeFileSync('.booklet-work/flexible-export/matched-candidate.json',JSON.stringify(candidate,null,2)+'\n');
console.log('Candidate: .booklet-work/flexible-export/matched-candidate.json');
if(process.argv.includes('--apply')){
 const saved=await saveBookletProject(candidate,{expectedRevision:current.revision});
 console.log(`Saved ${saved.id}, revision ${saved.revision}`);
}
assert.equal(createHash('sha256').update(fs.readFileSync(sourceFile)).digest('hex'),createHash('sha256').update(bytes).digest('hex'),'Accepted source must remain unchanged');
