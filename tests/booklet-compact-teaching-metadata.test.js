import test from 'node:test';import assert from 'node:assert/strict';
import {materializeCorrections} from '../scripts/booklet/workflow-review.mjs';
const setup=()=>{
 const original={id:'source-block',type:'question',sourcePageNumber:3,sourceRefs:[{pageNumber:3}],content:{id:'root',type:'question',prompt:'Complete the table.',children:[{id:'response',type:'part',prompt:'',answer:{short:'5',worked:'2+3=5'}}]},sourceReview:{responses:[{targetId:'response',kind:'cloze'}]},table:{id:'table',type:'table',rows:[]}};
 const corrected=structuredClone(original);corrected.sourceAtom={id:'original-group',kind:'definition',label:'Pay'};corrected.sourceReview.responses[0].scaffoldTargetId='table';
 const actual=structuredClone(original);actual.flow={manual:true};actual.content.prompt='Accepted mathematical wording.';actual.sourceReview.sourcePagination={page:3};
 const project={sections:[{id:'merged-exercise',blocks:[{id:'other',type:'rich-text',content:'Earlier page'},actual]}],source:{inventory:{entries:[]}}};
 const state={corrections:[{id:'source-metadata',status:'approved',patches:[{scope:'author',page:3,targetId:'old-page-section',field:'/blocks/0',original,corrected}]}]};
 return {original,corrected,project,state};
};
test('compact teaching metadata uses the source block identity and preserves accepted content and manual layout',()=>{
 const {project,state,corrected}=setup(),result=materializeCorrections(project,state,'project'),block=result.sections[0].blocks[1];
 assert.equal(result.sections[0].blocks[0].content,'Earlier page');assert.equal(block.content.prompt,'Accepted mathematical wording.');assert.deepEqual(block.flow,{manual:true});assert.deepEqual(block.sourceReview.sourcePagination,{page:3});assert.deepEqual(block.sourceAtom,corrected.sourceAtom);assert.equal(block.sourceReview.responses[0].scaffoldTargetId,'table');
 assert.deepEqual(materializeCorrections(result,state,'project'),result);
});
test('compact teaching metadata rejects conflicting headers, response kinds, source pages and foreign scaffold owners',()=>{
 for(const mutate of [s=>s.project.sections[0].blocks[1].sourceAtom={id:'user-change',kind:'review'},s=>s.project.sections[0].blocks[1].type='rich-text',s=>s.project.sections[0].blocks[1].sourceReview.responses[0].kind='working',s=>{s.project.sections[0].blocks[1].sourcePageNumber=4;s.project.sections[0].blocks[1].sourceRefs=[];},s=>{delete s.project.sections[0].blocks[1].table;s.project.sections[0].blocks[0].table={id:'table',type:'table'};}]){const s=setup();mutate(s);assert.throws(()=>materializeCorrections(s.project,s.state,'project'));}
});
test('content and response changes cannot enter the metadata-only compact path',()=>{
 for(const mutate of [s=>s.corrected.content.prompt='Different task',s=>s.corrected.sourceReview.responses[0].kind='working']){const s=setup();mutate(s);assert.throws(()=>materializeCorrections(s.project,s.state,'project'));}
});
