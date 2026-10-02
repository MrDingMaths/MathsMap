import test from 'node:test';
import assert from 'node:assert/strict';
import {repairFurtherTransformationsLayout} from '../scripts/booklet/repair-further-transformations-layout.mjs';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {answerFragments,answerDiagramWidth,answerDiagramSignature} from '../src/lib/booklet-exercises.js';
import {canShareShortAnswer} from '../src/lib/booklet-short-answer-grid.js';
import {questionSplitGroups,fragmentQuestion} from '../src/lib/booklet-pagination.js';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
const graph={id:'graph',format:'tikz',widthMm:100,code:'graph source'};
test('inspected graph widths persist and cannot transfer to changed diagram sources',()=>{
 const p=fixture(),diagram=p.sections[0].blocks[0].content.children[0].answer.solutionDiagrams[0];
 const options={shortWidthReviews:{[diagram.id]:{widthMm:65,sourceSignature:answerDiagramSignature(diagram)}}};
 const {next}=repairFurtherTransformationsLayout(p,options);
 assert.equal(answerDiagramWidth(next.settings.compactAnswers,'short',diagram),65);
 assert.equal(repairFurtherTransformationsLayout(next,options).records.length,0);
 diagram.code='Changed source';
 assert.throws(()=>repairFurtherTransformationsLayout(p,options),/Reviewed graph source changed/);
});
test('reviewed question widths persist through normalization without altering source grids',()=>{
 const p=fixture(),diagram=p.sections[0].blocks[0].content.questionDiagrams[0];
 p.sections[0].id='ordinary-practice';
 const options={questionWidthReviews:{[diagram.id]:{widthMm:75,sourceSignature:answerDiagramSignature(diagram)}}};
 const reopened=normalizeEditableProject(repairFurtherTransformationsLayout(p,options).next);
 assert.equal(resolveArrangement(reopened.sections[0].blocks[0],null,reopened.settings.layoutOverrides).tree.root.children.find(n=>n.ref===diagram.id).width,75);
 assert.equal(repairFurtherTransformationsLayout(reopened,options).records.length,0);
 assert.deepEqual(reopened.sections[0].blocks[0].content.questionDiagrams,p.sections[0].blocks[0].content.questionDiagrams);
});
const fixture=()=>normalizeEditableProject({id:'further-transformations-v1',title:'Further',settings:{compactAnswers:{shortDiagramMm:60,diagramWidths:{graph:{short:80,worked:90}}}},sections:[{id:'further-transformations-mixed-review',blocks:['Foundation','Development','Mastery',null].map((difficulty,i)=>({id:'q'+i,type:'question',classification:difficulty?{reasoningScore:[10,35,65][i]}:{},content:{id:'root'+i,prompt:'Sketch the graph.',questionDiagrams:[{...graph,id:'given'+i}],children:['a','b'].map(label=>({id:i+label,label,prompt:'Sketch.',answerSpaceMm:12,answer:{short:'A description.',worked:'Retain this method.',solutionDiagrams:[{...graph,id:'graph'+i+label}]}}))}}))}]});
test('graph-only amendments follow recorded ratings and preserve explicit results, worked answers and source diagrams',()=>{
 const p=fixture(),before=structuredClone(p);
 p.sections[0].blocks.push({id:'range',type:'question',classification:{reasoningScore:30},content:{id:'p16-q11-response',prompt:'Sketch and state the range.',answer:{short:'The range.',solutionDiagrams:[graph]}}});
 const {next}=repairFurtherTransformationsLayout(p);
 for(let i=0;i<4;i++)for(const node of next.sections[0].blocks[i].content.children){
  assert.equal(node.answer.short,i<2?null:'A description.');
  assert.equal(node.answer.worked,'Retain this method.');
  assert.equal(answerDiagramWidth(next.settings.compactAnswers,'short',node.answer.solutionDiagrams[0]),50);
 }
 assert.equal(next.sections[0].blocks[4].content.answer.short,'The range.');
 assert.equal(answerDiagramWidth(next.settings.compactAnswers,'worked',graph),90);
 assert.equal(next.settings.layoutOverrides.diagramWidths.given0,70);
 assert.deepEqual(p.sections[0].blocks.slice(0,4),before.sections[0].blocks);
 assert.equal(repairFurtherTransformationsLayout(next).records.length,0);
});
test('parent-owned graph-only answers remain atomic and occupy a full answer column',()=>{
 const block={id:'q',content:{id:'root',answer:{short:null,solutionDiagrams:[graph]},children:[{id:'a',answer:{short:'Other'}}]}};
 assert.equal(answerFragments(block,'short').length,1);
 assert.equal(answerFragments(block,'short')[0].content.id,'root');
 assert.equal(canShareShortAnswer(block),false);
});
test('shared sum graphs replace sketch descriptions while explicit explanation parts remain',()=>{
 const p=fixture();
 p.sections[0].blocks=[{id:'shared',type:'question',classification:{reasoningScore:30},content:{id:'p34-q6',prompt:'Sketch the sum graph.',sharedSolutionDiagrams:[graph],children:[
  {id:'p34-q6-sketch',prompt:'',answer:{short:'Curve description.',worked:'Sketch method.'}},
  {id:'p34-q6a',prompt:'Explain the oblique asymptote.',answer:{short:'Required explanation.',worked:'Explain.'}},
  {id:'p34-q6b',prompt:'Recreate by adding ordinates.',answer:{short:'Add the ordinates.',worked:'Sum method.'}},
 ]}}];
 const children=repairFurtherTransformationsLayout(p).next.sections[0].blocks[0].content.children;
 assert.deepEqual(children.map(n=>n.answer.short),[null,'Required explanation.',null]);
 assert.deepEqual(children.map(n=>n.answer.worked),['Sketch method.','Explain.','Sum method.']);
});
test('bound arrangement groups keep complete parts together at pagination cuts',()=>{
 const block=fixture().sections[0].blocks[0];delete block.content.questionDiagrams;
 block.content.children.push({...structuredClone(block.content.children[0]),id:'c',label:'c'});
 const arrangement=resolveArrangement(block).tree;
 const parts=arrangement.root.children.find(n=>n.id===block.content.id+':parts');
 parts.children=[{id:'bound',type:'group',direction:'stack',keepTogether:true,children:parts.children.slice(0,2)},parts.children[2]];
 const groups=questionSplitGroups(block,{[block.id]:{arrangement}});
 assert.deepEqual(groups.map(g=>g.ids),[['0a','0b'],['c']]);
 assert.deepEqual(fragmentQuestion(block,[groups[0]]).content.children,block.content.children.slice(0,2));
});
