import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';
import {fitCandidate,searchFit,scaled,FIT_DEFAULTS,fitSuggestions} from '../src/lib/booklet-fit.js';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';

const paragraph=(id,text)=>({id,type:'paragraph',spaceAfter:5,inlines:[{type:'text',text}]});
const figure={id:'fig',format:'tikz',code:'\\draw (0,0)--(1,1);',widthMm:80,alt:'triangle'};
const grid={id:'grid',format:'tikz',code:'\\draw (0,0) grid (4,4);',widthMm:90,alt:'blank grid for drawing'};
const fixture=()=>createEditableProject({id:'fit',title:'Fit',settings:{paginationMode:'flexible',generatedCover:false},topics:[{id:'t',title:'Topic'}],sections:[{id:'s',topicId:'t',phase:'practice',blocks:[
 {id:'q',type:'question',content:{id:'root',type:'question',prompt:'Calculate',questionDiagrams:[figure,grid],children:[
  {id:'a',type:'part',label:'a',prompt:{format:'maths-editor-document-v1',version:1,blocks:[paragraph('pa','1+1')]},answerSpaceMm:60,answer:{short:'2',worked:'1+1=2'}}]}},
 {id:'r',type:'question',content:{id:'root2',type:'question',prompt:'Other',children:[{id:'c',type:'part',label:'a',prompt:'3+3',answerSpaceMm:50,answer:{short:'6',worked:'3+3=6'}}]}},
]}]});
const items=(p,id='q')=>{const b=p.sections[0].blocks.find(b=>b.id===id),o=p.settings.layoutOverrides,r=resolveArrangement(b,o.blockLayouts?.[id]?.arrangement,o);return arrangementItems(r.tree.root).map(n=>({...n,entry:r.entries.get(n.ref)}));};

test('scaling moves from current to floor in half millimetres and never grows a value',()=>{
 assert.equal(scaled(10,2,0),10);assert.equal(scaled(10,2,1),2);assert.equal(scaled(10,2,.5),6);assert.equal(scaled(1,2,1),1);
});

test('t=0 changes nothing; t=1 reaches floors; the input never mutates; other blocks stay unless chosen',()=>{
 const p=fixture(),before=JSON.stringify(p);
 const zero=fitCandidate(p,['q'],0);assert.deepEqual(zero.sections[0].blocks[0].content,p.sections[0].blocks[0].content);
 const full=fitCandidate(p,['q'],1);assert.equal(JSON.stringify(p),before);
 assert.equal(full.sections[0].blocks[0].content.children[0].prompt.blocks[0].spaceAfter,1);
 const diagrams=Object.fromEntries(items(full).filter(n=>n.entry?.kind==='diagram').map(n=>[n.entry.diagramId,n.width]));
 assert.equal(diagrams.fig,25,'a figure reaches its kind minimum');
 assert.ok(diagrams.grid==null||diagrams.grid===90,'drawing grids are never shrunk');
 assert.equal(full.sections[0].blocks[1],p.sections[0].blocks[1],'other blocks keep identity');
 const half=fitCandidate(p,['q'],.5),fig=items(half).find(n=>n.entry?.diagramId==='fig');assert.ok(fig.width<80&&fig.width>25);
});

test('toggles limit reductions, and below-minimum floors are opt-in',()=>{
 const p=fixture();
 const noDiagrams=fitCandidate(p,['q'],1,{...FIT_DEFAULTS,diagrams:false});
 assert.ok(items(noDiagrams).find(n=>n.entry?.diagramId==='fig').width==null||items(noDiagrams).find(n=>n.entry?.diagramId==='fig').width===80);
 const below=fitCandidate(p,['q'],1,{...FIT_DEFAULTS,belowMinimum:true});
 assert.equal(items(below).find(n=>n.entry?.diagramId==='fig').width,20);
 assert.equal(below.sections[0].blocks[0].content.children[0].prompt.blocks[0].spaceAfter,0);
 assert.deepEqual(fitSuggestions(FIT_DEFAULTS),['Go below recommended minimums']);
});

test('search finds the smallest fitting reduction and reports impossible fits after one probe',async()=>{
 const p=fixture(),width=c=>items(c).find(n=>n.entry?.diagramId==='fig')?.width??80;
 const found=await searchFit(p,['q'],FIT_DEFAULTS,async c=>width(c)<=60);
 assert.ok(width(found.project)<=60&&width(found.project)>50,'stops near the threshold, not at the floor');
 const none=await searchFit(p,['q'],FIT_DEFAULTS,async()=>false);
 assert.equal(none.project,null);assert.deepEqual(none.probes,[1]);
});

// Trial layouts reuse the live project's untouched blocks by identity, so Fit must
// never change its input: a frozen project makes any in-place write throw.
const deepFreeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(deepFreeze);}return value;};
test('fit candidates are built copy-on-write from a frozen project and share untouched blocks',async()=>{
 const p=deepFreeze(fixture());
 for(const options of [FIT_DEFAULTS,{...FIT_DEFAULTS,belowMinimum:true}])for(const t of [0,.5,1]){
  const next=fitCandidate(p,['q'],t,options);
  assert.equal(next.sections[0].blocks[1],p.sections[0].blocks[1],'the untouched block keeps its identity');
 }
 const result=await searchFit(p,['q','r'],FIT_DEFAULTS,async()=>true);
 assert.ok(result.project);
});
