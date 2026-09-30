import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutCacheKey,rendererSignature,qaSignature} from '../scripts/booklet/verification-cache.mjs';
import {measurementKeyFor} from '../src/lib/booklet-measurement.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
import {LEAN_REVIEW_PROFILE} from '../src/lib/booklet-review-profile.js';

const question=(id,prompt)=>({id,type:'question',classification:{primarySkillId:'addition'},content:{id:id+'-root',type:'question',prompt,answer:{short:'2',worked:'1+1=2'}}});
const fixture=()=>({id:'lean-book',title:'Addition',source:{runId:'run-1',reviewProfile:LEAN_REVIEW_PROFILE,inventory:{entries:[{id:'source-1',checked:true}]}},settings:{paginationMode:'flexible',exerciseOrganisation:'topic',houseStyleVersion:1,layoutOverrides:{blockLayouts:{},answerSpaces:{},diagramColourModes:{}},compactAnswers:{columns:2,gutterMm:8}},topics:[{id:'a',title:'Adding'},{id:'b',title:'Practice'}],sections:[{id:'s1',topicId:'a',phase:'practice',role:'practice',title:'Practice',blocks:[question('q1','Calculate 1+1.')]},{id:'s2',topicId:'b',phase:'practice',role:'practice',title:'Practice',blocks:[question('q2','Calculate 1+1 again.')]}]});
const page=(project,mode='student')=>({section:{...project.sections[0],blocks:undefined},mode,blocks:project.sections[0].blocks,showTopicHeading:true,showDifficultyHeading:true});
const measure=async page=>({height:12+page.blocks.length*9,capacity:100,answerColumnWidthMm:86,answerWidthsMm:page.shortAnswerProbe?page.blocks.map(()=>20):undefined});

test('lean layout keys ignore QA metadata but change for printed text, edition and rendering',async()=>{
 const project=fixture(),runtime=rendererSignature({lean:true}),baseline=await layoutCacheKey(project,'student',runtime);
 const changed=structuredClone(project);
 changed.source.inventory.entries.push({id:'source-2',checked:false});
 changed.sections[0].blocks[0].classification.primarySkillId='subtraction';
 changed.sections[0].blocks[0].sourceReview={note:'reviewed against source'};
 changed.studio={flags:[{id:'flag',resolved:true}]};
 assert.equal(await layoutCacheKey(changed,'student',runtime),baseline);
 changed.sections[0].blocks[0].content.answer.worked='1+1=2, using counting';
 assert.equal(await layoutCacheKey(changed,'student',runtime),baseline);
 assert.notEqual(await layoutCacheKey(changed,'worked',runtime),await layoutCacheKey(project,'worked',runtime));
 changed.sections[0].blocks[0].content.prompt='Calculate 11+1.';
 assert.notEqual(await layoutCacheKey(changed,'student',runtime),baseline);
 assert.notEqual(await layoutCacheKey(project,'student','new-renderer'),baseline);
 assert.notEqual(await layoutCacheKey(project,'short',runtime),baseline);
 assert.equal(typeof qaSignature(),'string');
});

test('lean measurement keys exclude classifications and unrelated answer editions',()=>{
 const project=fixture(),before=measurementKeyFor(project),student=before(page(project)),worked=before(page(project,'worked'));
 project.sections[0].blocks[0].classification.primarySkillId='subtraction';
 project.source.inventory.entries.push({id:'audit'});
 project.sections[0].blocks[0].content.answer.worked='Counting gives 2.';
 const after=measurementKeyFor(project);
 assert.equal(after(page(project)),student);
 assert.notEqual(after(page(project,'worked')),worked);
 project.sections[0].blocks[0].content.prompt='A much longer calculation of 1+1.';
 assert.notEqual(measurementKeyFor(project)(page(project)),student);
 project.settings.houseStyleVersion=2;
 assert.notEqual(measurementKeyFor(project)(page(project)),after(page(project)));
});

test('lean combined editions reuse standalone maps and match fresh pagination after a text edit',async()=>{
 const project=fixture(),maps=new Map();let calls=0;
 const counted=async page=>{calls++;return measure(page);};
 const student=await paginateFlow(project,'student',counted,{editionMaps:maps,context:'runtime'});
 const short=await paginateFlow(project,'short',counted,{editionMaps:maps,context:'runtime'});
 assert.ok(calls>0);
 calls=0;
 const combined=await paginateFlow(project,'with-short',counted,{editionMaps:maps,context:'runtime'});
 assert.equal(calls,0);
 assert.deepEqual(combined.pages.map(p=>p.pageNumber),combined.pages.map((_,i)=>i+1));
 assert.ok(combined.pages.every(p=>p.totalPages===combined.pages.length));
 assert.deepEqual(combined.pages.filter(p=>p.mode==='student').map(p=>p.blocks.map(b=>b.id)),student.pages.map(p=>p.blocks.map(b=>b.id)));
 assert.deepEqual(combined.pages.filter(p=>p.mode==='short').map(p=>p.blocks.map(b=>b.id)),short.pages.map(p=>p.blocks.map(b=>b.id)));
 const fresh=await paginateFlow(project,'with-short',measure,{context:'runtime'});
 assert.deepEqual(JSON.parse(JSON.stringify(combined.pages)),JSON.parse(JSON.stringify(fresh.pages)));
 const edited=structuredClone(project);edited.sections[0].blocks[0].content.prompt='Calculate twelve plus twelve.';
 const reused=await paginateFlow(edited,'with-short',measure,{editionMaps:maps,context:'runtime'});
 const freshEdited=await paginateFlow(edited,'with-short',measure,{context:'runtime'});
 assert.deepEqual(JSON.parse(JSON.stringify(reused.pages)),JSON.parse(JSON.stringify(freshEdited.pages)));
 assert.equal(reused.pages.some(p=>p.blocks.some(b=>b.content?.prompt==='Calculate twelve plus twelve.')),true);
});
