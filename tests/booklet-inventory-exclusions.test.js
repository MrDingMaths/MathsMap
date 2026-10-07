import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {effectiveInventory} from '../scripts/booklet/workflow-review.mjs';
import {createAssignmentPlan} from '../scripts/booklet/author-assignments.mjs';

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
