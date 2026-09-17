import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {projectReviewHash,requireFinalCandidateSettlement} from '../scripts/booklet/page-review.mjs';
test('final staged candidates need the exact current settled file, not draft status',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'staged-final-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'project.json'),project={id:'staged',revision:1,sections:[],settings:{flowEdition:'with-short'}};fs.writeFileSync(file,JSON.stringify(project));
 const workflow={settled:{project:{file,hash:projectReviewHash(project)}}};
 assert.throws(()=>requireFinalCandidateSettlement(project,null),/settlement/);
 assert.doesNotThrow(()=>requireFinalCandidateSettlement({...project,revision:2,settings:{flowEdition:'student'}},workflow));
 assert.throws(()=>requireFinalCandidateSettlement({...project,title:'Changed'},workflow),/settlement/);
 fs.writeFileSync(file,JSON.stringify({...project,title:'Changed on disk'}));assert.throws(()=>requireFinalCandidateSettlement(project,workflow),/settlement/);
 fs.unlinkSync(file);assert.throws(()=>requireFinalCandidateSettlement(project,workflow),/settlement/);
});
