import test from 'node:test';
import assert from 'node:assert/strict';
import {bookletColours,applyQuestionSpacing,questionSpacing,syncDiagramPresentation} from '../src/lib/booklet-document-tools.js';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';
import {createDocumentHistory} from '../src/lib/booklet-document-controller.js';
import {arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
const fixture=()=>createEditableProject({id:'spacing',title:'Spacing',sections:[{id:'s',title:'Section',blocks:[{id:'q',type:'question',content:{id:'root',prompt:'Simplify',layout:'columns',columns:2,children:[{id:'a',label:'a',prompt:'$x+x$',answerSpaceMm:10,answer:{short:'$2x$'}},{id:'nested',label:'b',prompt:'Continue',children:[{id:'b',label:'i',prompt:'$y+y$',answerSpaceMm:20,answer:{short:'$2y$'}}]}]}},{id:'other',type:'rich-text',content:'Unchanged'}]}]});
test('question-wide spacing preserves content, horizontal arrangements and bank metadata and undoes as one change',()=>{
 const p=fixture(),block=p.sections[0].blocks[0];block.bankRef={id:'bank-question',revision:4};
 const initial=questionSpacing(p,block);assert.equal(initial.height,'');
 p.settings.layoutOverrides.blockLayouts.q={arrangement:initial.tree};
 const original=structuredClone(p),history=createDocumentHistory();history.record(p,{rootId:'a',pointer:'/prompt'});
 const next=applyQuestionSpacing(p,'q','height',23);assert.deepEqual(next.sections,p.sections);
 assert.deepEqual(questionSpacing(next,block).spaces.map(s=>s.height),[23,23]);
 assert.deepEqual(next.settings.layoutOverrides.answerSpaces,{a:23,b:23});
 assert.deepEqual(p,original);assert.deepEqual(history.step(next,null).project,original);
 const gaps=applyQuestionSpacing(next,'q','gap',5),tree=gaps.settings.layoutOverrides.blockLayouts.q.arrangement;
 assert.deepEqual(arrangementItems(tree.root),arrangementItems(next.settings.layoutOverrides.blockLayouts.q.arrangement.root));
 const rows=[];const walk=n=>{if(n.direction==='row')rows.push(n.gap);n.children?.forEach(walk);};walk(tree.root);
 const oldRows=[];const oldWalk=n=>{if(n.direction==='row')oldRows.push(n.gap);n.children?.forEach(oldWalk);};oldWalk(initial.tree.root);
 assert.deepEqual(rows,oldRows);assert.ok(questionSpacing(gaps,block).stacks.every(n=>n.gap===5));
 for(const value of [-1,181,NaN,Infinity])assert.throws(()=>applyQuestionSpacing(p,'q','height',value));
});
test('quick palette offers standard tokens without promoting source evidence or custom shades',()=>{
 const p=fixture();p.sections[0].blocks.push({id:'source',type:'rich-text',content:'$\\textcolor{#AA0505}{x}$',sourceReview:{colour:'#123456'}});
 const palette=bookletColours(p);assert.ok(palette.some(c=>c.name==='Booklet blue'&&c.value==='#268cff'));assert.ok(!palette.some(c=>c.value==='#aa0505'));assert.ok(palette.some(c=>c.value==='#ef6068'));assert.ok(!palette.some(c=>c.value==='#123456'));assert.equal(new Set(palette.map(c=>c.value)).size,palette.length);
});
test('direct diagram properties update saved arrangement geometry without changing other items or original evidence',()=>{
 const p=fixture(),block=p.sections[0].blocks[0];block.content.questionDiagrams=[{id:'diagram',format:'image',src:'test.png',widthMm:50,align:'left',originalDiagram:{src:'original.png'}}];
 const initial=questionSpacing(p,block);p.settings.layoutOverrides.blockLayouts.q={arrangement:initial.tree};const before=structuredClone(p);
 const next=syncDiagramPresentation(p,'q','diagram',{widthMm:73,align:'center'}),resolved=questionSpacing(next,block);
 const diagram=arrangementItems(resolved.tree.root).find(n=>resolved.entries.get(n.ref)?.diagramId==='diagram');assert.equal(diagram.width,73);assert.equal(diagram.align,'center');assert.equal(next.settings.layoutOverrides.diagramWidths.diagram,73);assert.deepEqual(next.sections,p.sections);assert.deepEqual(p,before);
 assert.deepEqual(arrangementItems(resolved.tree.root).filter(n=>n.id!==diagram.id),arrangementItems(initial.tree.root).filter(n=>n.id!==diagram.id));
});
