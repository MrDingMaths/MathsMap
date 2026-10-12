import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {validatePracticeBank} from '../scripts/validate.mjs';
import {normaliseQuestion,makeBankManifest} from '../src/lib/practice-question-model.js';

test('bank validation indexes approved practice only and still detects missing or substituted entries',t=>{
 const bankDir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-bank-validation-'));
 t.after(()=>fs.rmSync(bankDir,{recursive:true,force:true}));
 const records=[['q-approved','approved'],['q-draft','draft'],['q-review','approved']].map(([id,status])=>normaliseQuestion({id,status,...(id==='q-review'?{libraryRole:'theory-review'}:{}),classification:{primarySkillId:'solve-linear-2-step'},content:{id:id+'-node',type:'question',prompt:'Solve $2x+1=5$.',answer:{short:'$2$',worked:'$x=2$.'}}}));
 for(const q of records)fs.writeFileSync(path.join(bankDir,q.id+'.json'),JSON.stringify(q));
 const manifest=makeBankManifest(records),file=path.join(bankDir,'manifest.json');
 fs.writeFileSync(file,JSON.stringify(manifest));
 assert.equal(manifest.questions.length,1);
 assert.deepEqual(validatePracticeBank({bankDir}),{checked:3,errors:[]});
 fs.writeFileSync(file,JSON.stringify({...manifest,questions:[]}));
 assert.match(validatePracticeBank({bankDir}).errors.join('\n'),/missing selectable question q-approved/);
 fs.writeFileSync(file,JSON.stringify({...manifest,questions:[{...manifest.questions[0],id:'q-draft',path:'q-draft.json'}]}));
 assert.match(validatePracticeBank({bankDir}).errors.join('\n'),/invalid or duplicate selectable question entry q-draft/);
});
