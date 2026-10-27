import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveStudentRow,logicalUnits,flowEditionSections} from '../src/lib/booklet-flow.js';
import {groupBookletBlocks} from '../src/lib/booklet-preview.js';
import {normalizeEditableProject,validateEditableProject} from '../src/lib/editable-booklet-model.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
const question=(id,continuation)=>({id,type:'question',flow:continuation?{continuationOf:continuation}:{},bankRef:{id:'bank-'+id},content:{id:id+'-root',type:'question',prompt:id,answerSpaceMm:30,answer:{short:id,worked:id}}});
const fixture=()=>normalizeEditableProject({format:'mathsmap-booklet-project-v4',version:4,id:'rows',title:'Rows',topics:[{id:'t',title:'Topic'}],settings:{paginationMode:'flexible',exerciseOrganisation:'topic'},sections:[{id:'s',topicId:'t',phase:'practice',role:'practice',blocks:[question('a'),question('b','a'),question('c','a')]}]});
const flag=blocks=>blocks[0].flow.studentRowGroup={columns:2,members:blocks.slice(0,2).map(b=>b.id)};
test('student rows retain separate owners and roundtrip controls without changing answer projections',()=>{
 const p=fixture(),base=structuredClone(p);flag(p.sections[0].blocks);p.sections[0].blocks[2].flow.teachingBodyBorder=false;
 const saved=JSON.parse(JSON.stringify(normalizeEditableProject(p)));assert.equal(validateEditableProject(saved).valid,true);
 assert.deepEqual(saved.sections[0].blocks[0].flow.studentRowGroup,{columns:2,members:['a','b']});assert.equal(saved.sections[0].blocks[2].flow.teachingBodyBorder,false);
 const row=resolveStudentRow(saved.sections[0].blocks,0);assert.deepEqual(row.map(b=>[b.id,b.bankRef.id,b.content.id,b.content.answerSpaceMm]),[['a','bank-a','a-root',30],['b','bank-b','b-root',30]]);
 assert.deepEqual(logicalUnits(saved).map(u=>u.blocks.map(b=>b.id)),[['a','b'],['c']]);
 const projected=flowEditionSections(saved,'student')[0];assert.equal(projected.blocks[0].flow.keepTogether,true);assert.equal(saved.sections[0].blocks[0].flow.keepTogether,undefined);
 for(const mode of ['short','worked']){const actual=flowEditionSections(saved,mode),expected=flowEditionSections(base,mode);for(const s of actual)for(const b of s.blocks){delete b.flow.studentRowGroup;delete b.flow.teachingBodyBorder;}assert.deepEqual(actual,expected);assert.ok(logicalUnits({sections:flowEditionSections(saved,mode)}).every(u=>!u.studentRowGroup));}
 assert.deepEqual(groupBookletBlocks(projected.blocks)[0].blocks.map(b=>b.id),['a','b']);assert.ok(groupBookletBlocks(projected.blocks,{mode:'worked'}).every(x=>x.type!=='practice-row'));
});
test('invalid rows and internal manual/source boundaries retain the default grouping',()=>{
 for(const change of [bs=>bs[0].flow.studentRowGroup.members=['a','c'],bs=>bs[0].flow.studentRowGroup.members=['a','a'],bs=>bs[0].flow.studentRowGroup.members=['a','missing'],bs=>bs[0].flow.studentRowGroup.columns=3,bs=>bs[1].flow.pageBreakBefore=true,bs=>bs[1].flow.sourcePageBreakBefore=true,bs=>bs[1].flow.continuationOf='other',bs=>{bs[0].flow.sectionId='s';bs[1].flow.sectionId='other';}]){const bs=fixture().sections[0].blocks;flag(bs);change(bs);assert.equal(resolveStudentRow(bs,0),null);}
 const p=fixture(),bs=p.sections[0].blocks;flag(bs);p.sections=[{...p.sections[0],blocks:[bs[0]]},{...p.sections[0],id:'other',blocks:bs.slice(1)}];assert.ok(logicalUnits(p).every(u=>!u.studentRowGroup));
 const plain=fixture().sections[0].blocks;assert.deepEqual(groupBookletBlocks(plain),plain.map(block=>({type:'block',id:block.id,block})));
 const duplicate=fixture().sections[0].blocks;flag(duplicate);duplicate.push(structuredClone(duplicate[1]));assert.equal(resolveStudentRow(duplicate,0),null);
});
test('pagination measures the same native two-owner row and never splits its owners',async()=>{
 const p=fixture();p.sections[0].blocks.unshift({...question('intro'),height:70});const bs=p.sections[0].blocks;flag(bs.slice(1));
 const seen=[];const result=await paginateFlow(p,'student',async page=>{const items=groupBookletBlocks(page.blocks);seen.push(items.map(x=>x.type));return{capacity:100,height:items.reduce((h,x)=>h+(x.type==='practice-row'?60:x.block.height??60),0)};});
 const page=result.pages.find(p=>p.blocks.some(b=>b.id==='a'));assert.ok(page.blocks.some(b=>b.id==='b'));assert.ok(!page.blocks.some(b=>b.id==='intro'));assert.ok(seen.some(x=>x.includes('practice-row')));
});
test('oversized opt-in row reports overflow without cutting either working allowance',async()=>{
 const p=fixture();p.sections[0].blocks=p.sections[0].blocks.slice(0,2);flag(p.sections[0].blocks);
 const before=structuredClone(p);const result=await paginateFlow(p,'student',async()=>({capacity:50,height:80}));
 assert.ok(result.issues.length);assert.deepEqual(p,before);assert.deepEqual(result.pages.flatMap(page=>page.blocks).map(b=>b.content.answerSpaceMm),[30,30]);
});
