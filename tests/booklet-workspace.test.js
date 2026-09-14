import test from 'node:test';
import assert from 'node:assert/strict';
import {setPageBoundary,startExerciseOnNewPage,pageBoundaryKind,questionSummary,questionSearchText} from '../src/lib/booklet-workspace.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';

const block=id=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'Find $x$.',children:[]}});
const fixture=()=>normalizeEditableProject({id:'workspace-test',title:'Workspace',settings:{paginationMode:'flexible',generatedCover:false},topics:[{id:'topic',title:'Angles'}],sections:[{id:'teaching',topicId:'topic',title:'Teaching',phase:'teaching',blocks:[{...block('a'),sourceAtom:{id:'activity'}},{...block('b'),sourceAtom:{id:'activity'}}]},{id:'practice',topicId:'topic',title:'Practice',phase:'practice',pageBreakBefore:false,blocks:[block('c'),block('d')]}]});
test('breaks surround a whole teaching group and repeated actions are idempotent',()=>{
 const original=fixture(), before=structuredClone(original);let next=setPageBoundary(original,'b','before');
 assert.equal(next.sections[0].blocks[0].flow.pageBreakBefore,true);assert.equal(next.sections[0].blocks[1].flow?.pageBreakBefore,undefined);
 next=setPageBoundary(next,'a','after');assert.equal(next.sections[0].blocks.at(-1).type,'page-break');assert.equal(next.sections[0].blocks.length,3);
 assert.deepEqual(setPageBoundary(next,'a','after'),next);assert.deepEqual(original,before);
 next=setPageBoundary(next,'c','remove');assert.equal(next.sections[0].blocks.length,2);assert.equal(next.sections[1].blocks[0].flow.pageBreakBefore,false);
});
test('exercise break preserves numbering/content and can be removed at the first question',()=>{
 const original=fixture(), next=startExerciseOnNewPage(original,'topic');
 assert.equal(next.sections[1].pageBreakBefore,true);assert.equal(next.sections[1].blocks[0].flow.pageBreakBefore,true);
 assert.deepEqual(next.sections[1].blocks[0].content,original.sections[1].blocks[0].content);
 const removed=setPageBoundary(next,'c','remove');assert.equal(removed.sections[1].pageBreakBefore,false);assert.equal(removed.sections[1].blocks[0].flow.pageBreakBefore,false);
});
test('manual breaks paginate without empty pages and removal rejoins content',async()=>{
 let project=fixture();project.sections=project.sections.slice(1);
 const measure=async p=>({capacity:100,height:p.blocks.length*20});
 assert.equal((await paginateFlow(project,'student',measure)).pages.length,1);
 project=setPageBoundary(project,'c','after');assert.equal((await paginateFlow(project,'student',measure)).pages.length,2);
 project=setPageBoundary(project,'d','remove');assert.equal((await paginateFlow(project,'student',measure)).pages.length,1);
 project=setPageBoundary(project,'d','after');assert.equal((await paginateFlow(project,'student',measure)).pages.length,1);
});
test('boundary labels distinguish imported source boundaries and explicit user breaks',()=>{
 const project=fixture();project.sections[1].blocks[1].flow={sourcePageBreakBefore:true};
 assert.equal(pageBoundaryKind(project,'d'),'source');assert.equal(pageBoundaryKind(setPageBoundary(project,'d','before'),'d'),'manual');assert.equal(pageBoundaryKind(setPageBoundary(project,'d','remove'),'d'),'automatic');
});
test('untitled bank questions show skill and maths, and search includes later parts',()=>{
 const question={id:'opaque-id',title:'',classification:{primarySkillId:'indices'},content:{prompt:'Simplify',children:[{prompt:'$(x^7)^4$'},{prompt:'A distinctive later expression'}]}};
 const summary=questionSummary(question,[{id:'indices',title:'Index laws'}]);assert.equal(summary.title,'Index laws');assert.match(summary.excerpt,/x\^7/);assert.doesNotMatch(summary.title,/opaque-id/);assert.match(questionSearchText(question),/distinctive later/);
});

test('an explicit break overrides keep-with-next and removal restores the original preference',async()=>{
 const project=fixture();project.sections=project.sections.slice(1);project.sections[0].blocks[0].flow={keepWithNext:true};
 const measure=async p=>({capacity:100,height:p.blocks.length*20});
 const split=setPageBoundary(project,'d','before');assert.equal((await paginateFlow(split,'student',measure)).pages.length,2);assert.equal(split.sections[0].blocks[0].flow.keepWithNext,true);
 assert.deepEqual(setPageBoundary(split,'d','before'),split);
 const joined=setPageBoundary(split,'d','remove');assert.equal((await paginateFlow(joined,'student',measure)).pages.length,1);assert.equal(joined.sections[0].blocks[0].flow.keepWithNext,true);
});
