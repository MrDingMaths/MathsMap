import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeQuestionFragments} from '../scripts/booklet/packet-continuations.mjs';
import {derivedAnswerDiagramEntries} from '../scripts/booklet/answer-evidence.mjs';

const packets=()=>[1,2].map((page,index)=>({pageNumber:page,sections:[{topicId:'lines',phase:'practice',blocks:[{
 id:'question-'+page,type:'question',sourceRefs:[{pageNumber:page}],
 content:{id:'root-'+page,type:'question',prompt:'Complete the table and graph the result.',layout:'grid',columns:2,children:[{
  id:'part-'+page,type:'part',label:index?'b':'a',prompt:'y=x+'+page,answer:{solutionDiagrams:[{id:'answer-'+page}]}
 }]},sourceReview:{responses:[{targetId:'part-'+page,kind:'working'}]}
}]}],inventoryMappings:index?[{inventoryId:'source-part-2',targetId:'part-2'}]:[{inventoryId:'source-question',targetId:'root-1'}]}));
const groups=[{canonicalBlockId:'question-1',fragmentBlockIds:['question-2']}];

test('explicit continuation parts retain IDs, answers and original question ownership',()=>{
 const input=packets(),original=structuredClone(input),result=mergeQuestionFragments(input,groups);
 const question=result[0].sections[0].blocks[0];
 assert.deepEqual(input,original);
 assert.deepEqual(question.content.children.map(part=>part.id),['part-1','part-2']);
 assert.deepEqual(question.sourceRefs,[{pageNumber:1},{pageNumber:2}]);
 assert.equal(question.sourceReview.responses.length,2);
 assert.deepEqual(result[1].sections,[]);
 assert.deepEqual(result[1].inventoryMappings,original[1].inventoryMappings);
 const derived=derivedAnswerDiagramEntries(result.flatMap(packet=>packet.sections),[{id:'source-question',kind:'question',targetId:'root-1',pageNumber:1}]);
 assert.deepEqual(derived.map(entry=>entry.targetId),['answer-1','answer-2']);
 assert.ok(derived.every(entry=>entry.derivedFrom==='source-question'));
 assert.deepEqual(mergeQuestionFragments(input),input);
});

test('fragment merging rejects distinct questions, unsafe order and content loss',()=>{
 for(const mutate of [
  p=>{p[1].sections[0].blocks[0].content.prompt='A different mathematical task';},
  p=>{p[1].sections[0].topicId='other';},
  p=>{p[1].pageNumber=1;},
  p=>{p[1].sections[0].blocks[0].content.children[0].label='a';},
  p=>{p[1].sections[0].blocks[0].content.children[0].id='part-1';},
  p=>{p[1].inventoryMappings.push({inventoryId:'another-question',targetId:'root-2'});},
  p=>{p[1].sections[0].blocks[0].content.questionDiagrams=[{id:'distinct-given'}];}
 ]){const input=packets();mutate(input);assert.throws(()=>mergeQuestionFragments(input,groups));}
 assert.throws(()=>mergeQuestionFragments(packets(),[{canonicalBlockId:'missing',fragmentBlockIds:['question-2']}]));
});

test('an explicitly selected standalone continuation part keeps its mapped answer and diagram',()=>{
 const input=packets(),body=input[1].sections[0].blocks[0].content.children[0];
 body.prompt='';body.questionDiagrams=[{id:'given-2'}];input[1].sections[0].blocks[0].content=body;
 const selection=[{...groups[0],allowEmptyContinuationStem:true,singlePartBlockIds:['question-2']}];
 const result=mergeQuestionFragments(input,selection),parts=result[0].sections[0].blocks[0].content.children;
 assert.deepEqual(parts.map(p=>p.id),['part-1','part-2']);
 assert.deepEqual(parts[1],body);assert.deepEqual(result[1].inventoryMappings,input[1].inventoryMappings);
 assert.throws(()=>mergeQuestionFragments(input,[{...groups[0],allowEmptyContinuationStem:true}]));
 input[1].sections[0].blocks[0].content.prompt='Another task';
 assert.throws(()=>mergeQuestionFragments(input,selection));
});

test('explicit orphan continuations accept empty repeated stems and several packets on the later page',()=>{
 const input=packets(),third=structuredClone(input[1]);
 input[1].sections[0].blocks[0].content.prompt='';
 third.sections[0].blocks[0].id='question-3';third.sections[0].blocks[0].content.id='root-3';
 third.sections[0].blocks[0].content.children=[{id:'part-3',type:'part',label:'c',prompt:'y=x+3'}];
 third.inventoryMappings=[{inventoryId:'source-part-3',targetId:'part-3'}];input.push(third);
 const selection=[{canonicalBlockId:'question-1',fragmentBlockIds:['question-2','question-3'],allowEmptyContinuationStem:true}];
 const result=mergeQuestionFragments(input,selection);
 assert.deepEqual(result[0].sections[0].blocks[0].content.children.map(p=>p.id),['part-1','part-2','part-3']);
 delete input[1].sections[0].blocks[0].content.prompt;
 assert.deepEqual(mergeQuestionFragments(input,selection)[0].sections[0].blocks[0].content.children.map(p=>p.id),['part-1','part-2','part-3']);
 assert.throws(()=>mergeQuestionFragments(input,groups));
 input[1].sections[0].blocks[0].content.prompt='A different task';
 assert.throws(()=>mergeQuestionFragments(input,selection));
});
