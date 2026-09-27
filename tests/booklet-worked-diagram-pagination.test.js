import test from 'node:test';
import assert from 'node:assert/strict';
import {paginateCompactAnswers} from '../src/lib/booklet-answer-pagination.js';
import {answerFragments,answerNodePath,compactAnswerLabel,workedAnswerDiagramFragments,COMPACT_ANSWERS} from '../src/lib/booklet-exercises.js';
import {normalizeEditableProject,updateProjectContent} from '../src/lib/editable-booklet-model.js';
import {flowPageAnchor,resolveFlowPageAnchor} from '../src/lib/booklet-viewport.js';
import {assertAnswerRenderCoverage} from '../scripts/booklet/check-compact-exercises.mjs';

const figures=[{id:'figure-one',format:'tikz',widthMm:55,code:'complete first diagram'},{id:'figure-two',format:'tikz',widthMm:60,code:'complete second diagram'}];
const worked={format:'maths-editor-document-v1',version:1,blocks:[{id:'calculation',type:'paragraph',inlines:[{type:'text',text:'Complete native worked text.'}]}]};
const fixture=()=>normalizeEditableProject({id:'worked-split-test',settings:{paginationMode:'flexible',exerciseOrganisation:'topic',compactAnswers:COMPACT_ANSWERS},topics:[{id:'t',title:'Topic'}],sections:[{id:'s',topicId:'t',phase:'practice',blocks:[{id:'q',type:'question',content:{id:'root',children:[{id:'group',label:'b',children:[{id:'leaf',label:'ii',answer:{short:'1',worked,solutionDiagrams:figures}}]}]}}]}]});
const leaf=block=>{let node=block.content;while(node.children?.length===1)node=node.children[0];return node;};
const entries=result=>result.pages.flatMap(page=>page.columns.flat());
const measured=capacity=>async page=>({height:page.columns.flat().reduce((sum,e)=>{const answer=leaf(e.block).answer;return sum+(answer?.worked?70:0)+(answer?.solutionDiagrams?.length??0)*20+(e.block.flow.answerContinuation?5:0);},0),capacity});
const label=block=>{let node=block.content,path=[];while(true){path=answerNodePath(block.content,node,path);if(!node.children?.length)return compactAnswerLabel(block.sourceOrder,path);node=node.children[0];}};

test('measured oversized worked text and a whole ordered diagram group paginate with full labels',async()=>{
 const project=fixture(),before=structuredClone(project),result=await paginateCompactAnswers(project,'worked',measured(100));
 assert.deepEqual(result.issues,[]);assert.equal(result.pages.length,2);
 const [text,diagrams]=entries(result).map(e=>e.block);
 assert.deepEqual(leaf(text).answer.worked,worked);assert.deepEqual(leaf(text).answer.solutionDiagrams,[]);
 assert.equal(leaf(diagrams).answer.worked,undefined);assert.deepEqual(leaf(diagrams).answer.solutionDiagrams,figures);
 assert.equal(text.id,diagrams.id);assert.equal(leaf(text).id,leaf(diagrams).id);
 assert.deepEqual([label(text),label(diagrams)],['1bii','1bii']);
 assert.equal(text.flow.answerFragment,0);assert.equal(diagrams.flow.answerFragment,'0:diagrams');assert.equal(diagrams.flow.answerContinuation,'solution-diagrams');
 assert.equal(resolveFlowPageAnchor(result.pages,flowPageAnchor(result.pages,1)),1,'viewport continuation has a distinct stable identity');
 assert.deepEqual(project,before,'pagination only derives render projections');
 const again=await paginateCompactAnswers(project,'worked',()=>{throw Error('unchanged pagination must reuse');},{previous:result});
 assert.deepEqual(again.pages,result.pages);
});

test('fitting worked answers and all short answers retain the existing fragments',async()=>{
 const project=fixture(),result=await paginateCompactAnswers(project,'worked',measured(120));
 assert.equal(result.pages.length,1);assert.deepEqual(entries(result)[0].block.content,answerFragments(project.sections[0].blocks[0],'worked')[0].content);
 assert.equal(entries(result)[0].block.flow.answerContinuation,undefined);
 const short=await paginateCompactAnswers(project,'short',measured(100));
 assert.ok(entries(short).every(e=>!e.block.flow.answerContinuation));
 assert.ok(entries(short).every(e=>leaf(e.block).answer.solutionDiagrams.length===2));
});

test('failure of either complete half keeps the original overflow visible',async()=>{
 const project=fixture(),result=await paginateCompactAnswers(project,'worked',measured(60));
 assert.equal(result.issues.length,1);assert.equal(entries(result).length,1);
 assert.deepEqual(leaf(entries(result)[0].block).answer.solutionDiagrams,figures);
 assert.deepEqual(leaf(entries(result)[0].block).answer.worked,worked);
});

test('an answer that fits an empty page moves there whole without invoking the fallback',async()=>{
 const project=fixture();project.sections[0].blocks.unshift({id:'previous',type:'question',content:{id:'previous-root',answer:{worked:'Previous complete answer.'}}});
 const result=await paginateCompactAnswers(project,'worked',measured(120));
 assert.equal(result.pages.length,2);assert.deepEqual(result.issues,[]);
 assert.ok(entries(result).every(e=>!e.block.flow.answerContinuation));
 assert.deepEqual(leaf(entries(result)[1].block).answer.solutionDiagrams,figures);
});

test('an edit after a split invalidates its checkpoint and agrees with fresh pagination',async()=>{
 const project=fixture(),first=await paginateCompactAnswers(project,'worked',measured(100));
 const edited=updateProjectContent(project,'leaf','/answer/worked','Changed complete working.');
 const cached=await paginateCompactAnswers(edited,'worked',measured(100),{previous:first});
 const fresh=await paginateCompactAnswers(edited,'worked',measured(100));
 assert.deepEqual(cached.pages,fresh.pages);
 assert.equal(leaf(entries(cached)[0].block).answer.worked,'Changed complete working.');
 assert.deepEqual(leaf(entries(cached)[1].block).answer.solutionDiagrams,figures);
});

test('shared diagrams, dependencies and parent-owned answers remain atomic',()=>{
 for(const protect of [b=>b.content.sharedSolutionDiagrams=[figures[0]],b=>leaf(b).dependsOn=['elsewhere'],b=>b.dependsOn=['other-question'],b=>b.flow.keepTogether=true,b=>b.flow.keepWithNext=true,b=>leaf(b).answer.solutionDiagrams[0].dependsOn=['leaf'],b=>b.content.answer={worked:'Consolidated group answer.'}]){
  const block=answerFragments(fixture().sections[0].blocks[0],'worked')[0];protect(block);
  assert.equal(workedAnswerDiagramFragments(block),null);
 }
});

test('editing the text projection updates one complete field without losing the figures on reopen',()=>{
 const project=fixture(),fragment=answerFragments(project.sections[0].blocks[0],'worked')[0],[text,diagrams]=workedAnswerDiagramFragments(fragment);
 const replacement={...leaf(text).answer.worked,blocks:[...worked.blocks,{id:'extra',type:'paragraph',inlines:[{type:'text',text:'Verified extra step.'}]}]};
 const reopened=normalizeEditableProject(JSON.parse(JSON.stringify(updateProjectContent(project,leaf(text).id,'/answer/worked',replacement))));
 assert.deepEqual(leaf(reopened.sections[0].blocks[0]).answer.worked,replacement);
 assert.deepEqual(leaf(reopened.sections[0].blocks[0]).answer.solutionDiagrams,figures);
 assert.equal(leaf(diagrams).answer.worked,undefined,'diagram projection has no text editor value');
 assert.deepEqual(leaf(project.sections[0].blocks[0]).answer.worked,worked);
});

test('coverage accepts only explicit figure continuations and catches missing or duplicate diagrams',()=>{
 const project=fixture(),primary={id:'leaf',label:'1bii'},continuation={...primary,continuation:'solution-diagrams',editableFields:0,diagrams:2},ids=figures.map(d=>d.id);
 assertAnswerRenderCoverage([primary,continuation],ids,project,'worked');
 for(const invalid of [[primary,primary],[primary,{...continuation,label:'1b'}],[primary,{...continuation,editableFields:1}],[primary,{...continuation,continuation:'text'}]])assert.throws(()=>assertAnswerRenderCoverage(invalid,ids,project,'worked'));
 for(const badIds of [ids.slice(1),[...ids,ids[0]]])assert.throws(()=>assertAnswerRenderCoverage([primary,continuation],badIds,project,'worked'));
});
