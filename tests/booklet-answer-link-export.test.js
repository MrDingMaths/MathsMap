import test from 'node:test';import assert from 'node:assert/strict';
import {answerLinkRefactorEquivalent} from '../scripts/booklet/import-verification-runtime.mjs';
const project={source:{reviewProfile:'textbook-three-pass-v1',reviewRoute:'lean-review-v1'},sections:[{blocks:[{content:{id:'q',children:[{id:'a',prompt:'Compute',answer:{short:'2'}}]}}]}]};
const rendererBefore="answerNodeContext,isGivenFigureNode}\n  const answeredNode = (node) => !node.children?.length || node.answer?.short || node.answer?.worked ? node : answeredNode(node.children[0]);\n  const partHref = (node, depth) => depth === 0 || !answerPartHref ? answerHref : answerPartHref + answeredNode(node).id;";
const rendererAfter="answerNodeContext,isGivenFigureNode,firstAnswerNode}\n  const partHref = (node, depth) => depth === 0 || !answerPartHref || !firstAnswerNode(node) ? answerHref : answerPartHref + firstAnswerNode(node).id;";
const arrangementBefore=" import {hasStandaloneMathTable} from '../lib/booklet-labels.js';\n  let node=find(block.content);while(node?.children?.length&&!node.answer?.short&&!node.answer?.worked)node=node.children[0];\n  return answerPartHref+(node?.id??ownerId);";
const arrangementAfter=" import {hasStandaloneMathTable} from '../lib/booklet-labels.js';\n import {firstAnswerNode} from '../lib/booklet-exercises.js';\n  const node=firstAnswerNode(find(block.content));\n  return node?answerPartHref+node.id:answerHref;";
for(const [file,before,after]of[['src/components/PracticeQuestionRenderer.svelte',rendererBefore,rendererAfter],['src/components/BookletArrangement.svelte',arrangementBefore,arrangementAfter]])test(file+' exact refactor keeps every active target',()=>{
 assert.equal(answerLinkRefactorEquivalent(file,before,after,project),true);
 assert.equal(answerLinkRefactorEquivalent(file,before,after+'\n<style>changed</style>',project),false);
 const changed=structuredClone(project);changed.sections[0].blocks[0].content.children.unshift({id:'given',questionDiagrams:[{id:'figure'}]});
 assert.equal(answerLinkRefactorEquivalent(file,before,after,changed),false);
});
