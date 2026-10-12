import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {answerResponseNavigationEquivalent} from '../scripts/booklet/import-verification-runtime.mjs';
const project={id:'book',source:{reviewProfile:'textbook-three-pass-v1',reviewRoute:'lean-review-v1'},sections:[{blocks:[{content:{id:'q',children:[{id:'a',prompt:'Compute',answer:{short:'2'}}]},sourceReview:{responses:[{targetId:'a',kind:'working'}]}}]}]};
// Pin the historical refactor: later navigation changes must not broaden its acceptance.
const helper='src/lib/booklet-exercises.js',after="export function firstAnswerNode(node,responses=[]){\n  if(!node||isGivenFigureNode(node))return null;\n  if(!node.children?.length&&!node.answer?.short&&!node.answer?.worked&&responses.some(r=>r.targetId===node.id&&r.kind==='none'))return null;\n  if(node.answer?.short||node.answer?.worked||!node.children?.length)return node;\n  return node.children.map(child=>firstAnswerNode(child,responses)).find(Boolean)??null;\n}",before=after.replace('firstAnswerNode(node,responses=[])','firstAnswerNode(node)').replace("  if(!node.children?.length&&!node.answer?.short&&!node.answer?.worked&&responses.some(r=>r.targetId===node.id&&r.kind==='none'))return null;\n",'').replace('node.children.map(child=>firstAnswerNode(child,responses))','node.children.map(firstAnswerNode)');
test('exact inactive response-aware navigation keeps every actual destination',()=>{
 assert.equal(answerResponseNavigationEquivalent(helper,before,after,project),true);
 assert.equal(answerResponseNavigationEquivalent(helper,before,after+'\n// unreviewed',project),false);
 const active=structuredClone(project);active.sections[0].blocks[0].content.children.unshift({id:'context',prompt:'Given context'});active.sections[0].blocks[0].sourceReview.responses.unshift({targetId:'context',kind:'none'});
 assert.equal(answerResponseNavigationEquivalent(helper,before,after,active),false);
});
test('rewrite row anchor removal requires inactive branch and exact surrounding bytes',()=>{
 const file='src/components/PracticeQuestionRenderer.svelte',old="firstAnswerNode(node) + firstAnswerNode(node)\n<tr id={answerAnchorPrefix?answerAnchorPrefix+'part-'+row.id:undefined}>",newText="firstAnswerNode(node,question.sourceReview?.responses??[]) + firstAnswerNode(node,question.sourceReview?.responses??[])\n<tr>";
 assert.equal(answerResponseNavigationEquivalent(file,old,newText,project),true);
 assert.equal(answerResponseNavigationEquivalent(file,old.replace(/<tr[^\n]*/,'<tr>'),newText,project),true);
 const active=structuredClone(project);active.sections[0].blocks[0].content={id:'q',prompt:'Fill in the table below.',layout:'grid',columns:2,children:[1,2,3,4].map(i=>({id:String(i),prompt:'Rewrite',answer:{short:'2'}}))};
 assert.equal(answerResponseNavigationEquivalent(file,old,newText,active),false);
 assert.equal(answerResponseNavigationEquivalent(file,old,newText+'changed',project),false);
});
