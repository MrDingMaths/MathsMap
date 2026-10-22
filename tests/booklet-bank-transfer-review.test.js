import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateMasterTransferReview,transferTaskHash} from '../scripts/booklet/bank-transfer-review.mjs';
import {contentHash} from '../scripts/booklet/lean-review.mjs';
import {createProjectBlock} from '../src/lib/editable-booklet-model.js';
const sha=v=>createHash('sha256').update(v).digest('hex');
test('master transfer reuses acceptance across metadata/layout changes but rejects changed mathematics',t=>{
 const parent=path.resolve('.booklet-work/bank-import-tests');fs.mkdirSync(parent,{recursive:true});const dir=fs.mkdtempSync(path.join(parent,'reuse-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const block=createProjectBlock('question');block.id='q';block.content.prompt='Calculate 2+3.';block.content.answer={short:'5',worked:'2+3=5'};
 const table=path.join(dir,'reviewed.json');fs.writeFileSync(table,JSON.stringify({questions:{q:{outcome:'passed',hash:contentHash(block),note:'Independently derived the sum as 5.'}}}));
 const ref={path:table,hash:sha(fs.readFileSync(table))};
 const current=structuredClone(block);current.classification={reasoningScore:8};current.flow={pageBreakBefore:true};current.content.answerSpaceMm=30;
 const project={library:{category:'master'},source:{type:'full-booklet-import'}};
 const assessments={existingTransferReview:{profile:'accepted-master-content-v1',questions:[{sourceBlockId:'q',taskHash:transferTaskHash(current),note:'Reuse unchanged answer acceptance.',proof:{kind:'lean',table:ref,snapshot:block}}]}};
 assert.doesNotThrow(()=>validateMasterTransferReview(project,assessments,[current]));
 assert.doesNotThrow(()=>validateMasterTransferReview({...project,source:{type:'project-copy'}},assessments,[current]));
 current.content.answer.short='6';assessments.existingTransferReview.questions[0].taskHash=transferTaskHash(current);
 assert.throws(()=>validateMasterTransferReview(project,assessments,[current]),/mathematical content changed/);
 assert.throws(()=>validateMasterTransferReview({...project,library:{category:'import-review'}},assessments,[current]),/existing master/);
 fs.appendFileSync(table,' ');assert.throws(()=>validateMasterTransferReview(project,assessments,[current]),/artifact changed/);
});


test('changed parent-level working requires its own current acceptance',t=>{
 const parent=path.resolve('.booklet-work/bank-import-tests');fs.mkdirSync(parent,{recursive:true});const dir=fs.mkdtempSync(path.join(parent,'parent-proof-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const block=createProjectBlock('question');block.id='group';block.content.prompt='Calculate.';block.content.answer={short:'5',worked:'Grouped derivation: 2+3=5.'};block.content.children=[{id:'part',type:'part',prompt:'2+3',answer:{short:'5',worked:'2+3=5'}}];
 const table=path.join(dir,'reviewed.json');fs.writeFileSync(table,JSON.stringify({questions:{group:{outcome:'passed',hash:contentHash(block),note:'Synthetic independent group acceptance.'}}}));const snapshot=structuredClone(block),project={library:{category:'master'},source:{type:'full-booklet-import'}},a={existingTransferReview:{profile:'accepted-master-content-v1',questions:[{sourceBlockId:'group',taskHash:transferTaskHash(block),note:'Retain reviewed grouped working.',proof:{kind:'lean',table:{path:table,hash:sha(fs.readFileSync(table))},snapshot}}]}};
 validateMasterTransferReview(project,a,[block]);block.content.answer.worked='Grouped derivation incorrectly gives 6.';a.existingTransferReview.questions[0].taskHash=transferTaskHash(block);assert.throws(()=>validateMasterTransferReview(project,a,[block]),/mathematical content changed/);
});
