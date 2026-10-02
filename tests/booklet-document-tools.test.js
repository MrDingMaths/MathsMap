import test from 'node:test';
import assert from 'node:assert/strict';
import {bookletColours,applyQuestionSpacing,questionSpacing,syncDiagramPresentation} from '../src/lib/booklet-document-tools.js';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {createDocumentHistory} from '../src/lib/booklet-document-controller.js';
import {arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
import {resolveArrangement,arrangementQuestionBlock} from '../src/lib/booklet-arrangement.js';
test('spacing retains dynamic numbers and repairs old layouts while suppressing continuation numbers',()=>{
 for(const property of ['height','gap']){
  const p=fixture(),block=p.sections[0].blocks[0],slot=block.content.id+'/label';
  const next=applyQuestionSpacing(p,block.id,property,4);
  const stored=next.settings.layoutOverrides.blockLayouts[block.id].arrangement;
  assert.ok(arrangementItems(stored.root).some(n=>n.ref===slot));
  const numbered=arrangementQuestionBlock(block,23),resolved=resolveArrangement(numbered,stored);
  assert.equal(resolved.entries.get(slot).value,'23');
  const legacy=structuredClone(stored);legacy.root.children=legacy.root.children.filter(n=>n.ref!==slot);
  const repaired=resolveArrangement(numbered,legacy);
  assert.equal(arrangementItems(repaired.tree.root).filter(n=>n.ref===slot).length,1);
  assert.deepEqual(repaired.tree.root.children.slice(1),legacy.root.children);
  assert.equal(resolveArrangement({...numbered,flow:{fragment:1}},stored).entries.get(slot).value,'');
  assert.deepEqual(p.sections,next.sections);
 }
});
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
test('diagram widths survive normalized save and subsequent spacing edits without a stored arrangement',()=>{
 const p=fixture(),block=p.sections[0].blocks[0];
 block.content.questionDiagrams=[{id:'given',format:'tikz',code:'source',widthMm:110}];
 const reopened=normalizeEditableProject(syncDiagramPresentation(p,'q','given',{widthMm:70}));
 const resolved=questionSpacing(reopened,reopened.sections[0].blocks[0]);
 assert.equal(arrangementItems(resolved.tree.root).find(n=>n.ref==='given').width,70);
 const edited=applyQuestionSpacing(reopened,'q','gap',5);
 assert.equal(arrangementItems(edited.settings.layoutOverrides.blockLayouts.q.arrangement.root).find(n=>n.ref==='given').width,70);
});
