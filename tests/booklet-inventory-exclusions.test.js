import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {effectiveInventory} from '../scripts/booklet/workflow-review.mjs';
import {createAssignmentPlan,assignmentPayload} from '../scripts/booklet/author-assignments.mjs';

test('descriptive group membership preserves explicit question and part ownership',()=>{
 const inventory={pageNumber:40,entries:[{id:'q11',kind:'question',description:'Simplify.'},{id:'q11-a',kind:'part',parentId:'q11',description:'First expression.'},{id:'q11-b',kind:'part',parentId:'q11',description:'Second expression.'}],groups:[{id:'practice',kind:'practice',header:'11',members:'q11-a through q11-b'}]};
 const original=structuredClone(inventory);
 const descriptive=createAssignmentPlan([inventory]);
 const withoutDescription=createAssignmentPlan([{...inventory,groups:[{id:'practice',kind:'practice',header:'11'}]}]);
 assert.deepEqual(descriptive.assignments.map(a=>a.inventoryIds),withoutDescription.assignments.map(a=>a.inventoryIds));
 assert.deepEqual(descriptive.assignments[0].inventoryIds,['q11','q11-a','q11-b']);
 const task={page:40,inventory,promptSections:[],images:[],evidence:[],contextPages:[],teacherPages:[]};
 assert.deepEqual(assignmentPayload(descriptive.assignments[0],[task]).context.assignment.inventory.map(e=>e.id),['q11','q11-a','q11-b']);
 assert.deepEqual(inventory,original);
});

test('late-listed bare difficulty furniture cannot strand a lean import',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-late-difficulty-'));
 try{
  fs.mkdirSync(path.join(dir,'semantic-packets'));
  const source={pageNumber:34,entries:[{id:'q6',kind:'question',description:'Multiply.'},{id:'q6-a',kind:'part',parentId:'q6',description:'Expression.'},{id:'mastery',kind:'teaching',description:'MASTERY'}],groups:[]};
  const file=path.join(dir,'semantic-packets/page-034.inventory.json'),bytes=JSON.stringify(source);fs.writeFileSync(file,bytes);
  const inventory=effectiveInventory(dir,34,{reviewProfile:'textbook-three-pass-v1',corrections:[]});
  assert.match(inventory.entries[2].exclusionReason,/editor metadata/);
  assert.doesNotThrow(()=>createAssignmentPlan([inventory]));
  assert.equal(effectiveInventory(dir,34,{corrections:[]}).entries[2].exclusionReason,undefined);
  assert.equal(fs.readFileSync(file,'utf8'),bytes);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('lean difficulty furniture with an explicit nested exclusion cannot strand authoring',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-inventory-exclusion-'));
 try{
  fs.mkdirSync(path.join(dir,'semantic-packets'));
  const source={pageNumber:7,entries:[{id:'q',kind:'question',description:'Find the surface area.'},{id:'band',kind:'teaching',description:'FOUNDATION',presentation:{exclusionReason:'Difficulty is editor-only.'}},{id:'given',kind:'teaching',description:'Keep this mathematical instruction.',presentation:{exclusionReason:'Omit its decorative border, retaining the instruction.'}}],groups:[]};
  const file=path.join(dir,'semantic-packets/page-007.inventory.json');
  const bytes=JSON.stringify(source);fs.writeFileSync(file,bytes);
  const inventory=effectiveInventory(dir,7,{reviewProfile:'textbook-three-pass-v1',corrections:[]});
  assert.equal(inventory.entries[1].exclusionReason,'Difficulty is editor-only.');
  assert.equal(inventory.entries[2].exclusionReason,undefined);
  assert.doesNotThrow(()=>createAssignmentPlan([inventory]));
  assert.equal(fs.readFileSync(file,'utf8'),bytes);
  assert.equal(effectiveInventory(dir,7,{corrections:[]}).entries[1].exclusionReason,undefined);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('explicit publication footers and decorative cell separators preserve their inventory exclusion',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-furniture-exclusion-'));
 try{
  fs.mkdirSync(path.join(dir,'semantic-packets'));
  const entries=[{id:'footer',kind:'footer',description:'Publisher and Page 48',presentation:{exclusionReason:'Source identity only; renderer-owned pagination.'}},
   {id:'rules',kind:'diagram',description:'Light grey vertical divider and horizontal rules separating paired question cells.',presentation:{exclusionReason:'Decorative layout separators, with no mathematical table relationships or diagram content; use the shared arrangement preset.'}},
   {id:'graph',kind:'diagram',description:'Graph of a parabola',presentation:{exclusionReason:'Omit decorative shading but retain the graph.'}}];
  const file=path.join(dir,'semantic-packets/page-007.inventory.json'),original=JSON.stringify({pageNumber:7,entries});fs.writeFileSync(file,original);
  const result=effectiveInventory(dir,7,{reviewProfile:'textbook-three-pass-v1',corrections:[]});
  assert.equal(result.entries[0].exclusionReason,entries[0].presentation.exclusionReason);
  assert.equal(result.entries[1].exclusionReason,entries[1].presentation.exclusionReason);
  assert.equal(result.entries[2].exclusionReason,undefined);assert.equal(fs.readFileSync(file,'utf8'),original);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('explicit whole-page template exclusions preserve source bytes and do not drop real responses',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-template-exclusion-'));
 try{
  fs.mkdirSync(path.join(dir,'semantic-packets'));
  const source={pageNumber:50,findings:[{description:'The whole page is an unused authoring-template continuation.'}],entries:[
   {id:'band',kind:'teaching',sourceLabel:'FOUNDATION',description:'Right-aligned difficulty band.',presentation:{exclusionReason:'Unused template difficulty metadata.'}},
   {id:'sample',kind:'example',description:'Unused vector projection sample.',presentation:{exclusionReason:'Unused authoring sample on the excluded template page.'}},
   {id:'parts',kind:'part',description:'Empty part cells.',presentation:{exclusionReason:'Noninstructional template placeholders.'}}
  ]};
  const file=path.join(dir,'semantic-packets/page-050.inventory.json'),bytes=JSON.stringify(source);fs.writeFileSync(file,bytes);
  const state={reviewProfile:'textbook-three-pass-v1',corrections:[]},effective=effectiveInventory(dir,50,state);
  assert.equal(effective.entries.every(e=>e.exclusionReason),true);assert.doesNotThrow(()=>createAssignmentPlan([effective]));
  assert.equal(fs.readFileSync(file,'utf8'),bytes);
  const withResponse=structuredClone(source);withResponse.entries.push({id:'real',kind:'question',description:'Find the angle.',expectedAnswer:'40 degrees',responseKind:'working'});
  fs.writeFileSync(file,JSON.stringify(withResponse));const real=effectiveInventory(dir,50,state);
  assert.equal(real.entries.find(e=>e.id==='real').exclusionReason,undefined);
  assert.equal(real.entries.find(e=>e.id==='sample').exclusionReason,undefined);
  assert.equal(effectiveInventory(dir,50,{corrections:[]}).entries[1].exclusionReason,undefined);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
