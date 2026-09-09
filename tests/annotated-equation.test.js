import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDocument,freshDocument,exportSource,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
import {changeEquation,anchorResolved,equationTargets} from '../public/libs/maths-editor/annotated-equation.mjs';
import {documentHtml} from '../src/lib/document-content.js';
import {blockClozeAnswers,independentAnswerPages,teachingQuestionMode} from '../src/lib/booklet-answer-options.js';
const fixture=()=>normalizeDocument({blocks:[{id:'eq',type:'annotated-equation',latex:'y=mx+c',anchors:[{id:'coefficient',start:2,end:3,text:'m'},{id:'constant',start:5,end:6,text:'c'}],annotations:[{id:'label',targetId:'coefficient',colour:'#268cff',blocks:[{id:'label-text',type:'paragraph',inlines:[{type:'text',text:'coefficient of '},{type:'math',latex:'x'}]}]}]}]});

test('term arrows survive rich copy and report removed equation targets',()=>{
 const doc=fixture();doc.blocks[0].fontSize=null;doc.blocks[0].connections=[{id:'arrow',fromId:'coefficient',toId:'constant',colour:'#ff616b',height:3}];
 const copy=freshDocument(doc),n=copy.blocks[0];
 assert.equal(n.fontSize,null);
 assert.equal(n.connections[0].fromId,n.anchors[0].id);
 assert.equal(n.connections[0].toId,n.anchors[1].id);
 assert.notEqual(n.connections[0].id,'arrow');
 assert.doesNotMatch(documentHtml(copy),/data-equation-warning|katex-error/);
 changeEquation(n,'y=mx');
 assert.match(documentHtml(copy),/data-equation-warning/);
});
test('annotated equations retain editable labels, stable anchors and rich-copy references',()=>{const doc=fixture(),copy=freshDocument(doc);assert.deepEqual(normalizeDocument(doc),doc);assert.notEqual(copy.blocks[0].id,'eq');assert.notEqual(copy.blocks[0].anchors[0].id,'coefficient');assert.equal(copy.blocks[0].annotations[0].targetId,copy.blocks[0].anchors[0].id);assert.notEqual(copy.blocks[0].annotations[0].blocks[0].id,'label-text');assert.ok(exportSource(doc).losses.some(l=>l.type==='annotated-equation'));});
test('editing before a target moves its range; removing it flags it without silently rebinding',()=>{const n=fixture().blocks[0];changeEquation(n,'2y=mx+c');assert.equal(n.anchors[0].start,3);assert.ok(anchorResolved(n,n.anchors[0]));changeEquation(n,'2y=nx+c');assert.equal(anchorResolved(n,n.anchors[0]),false);assert.ok(anchorResolved(n,n.anchors[1]));assert.equal(n.annotations[0].targetId,'coefficient');});
test('term choices distinguish repeated variables and generated marks are narrowly trusted',()=>{assert.deepEqual(equationTargets('x+x').map(t=>t.start),[0,2]);const html=documentHtml(fixture());assert.match(html,/id="ae-\d+-0"/);assert.doesNotMatch(html,/katex-error/);const unsafe=fixture();unsafe.blocks[0].latex='\\href{javascript:alert(1)}{x}';assert.doesNotMatch(documentHtml(unsafe),/href="javascript/);});
test('cloze leaders use identical vector dot size and pitch for different widths',()=>{const html=renderDocument({blocks:[{type:'paragraph',inlines:[{type:'cloze',answer:'x',width:12},{type:'cloze',answer:'longer',width:35}]}]});assert.equal((html.match(/data-cloze-leader/g)??[]).length,2);assert.ok([...html.matchAll(/r="([\d.]+)"/g)].every(m=>m[1]==='.13'));});
test('Key Ideas answers are independent of short/worked mode and excluded from the key',()=>{const block={id:'key',type:'question',variant:'key-ideas'};for(const mode of ['student','short','worked']){assert.equal(blockClozeAnswers(block,{},mode),false);assert.equal(blockClozeAnswers(block,{showKeyIdeasAnswers:true},mode),true);}assert.equal(teachingQuestionMode(block,{},'short'),'student');assert.deepEqual(independentAnswerPages([{blocks:[block]}]),[]);});


test('stacked fractions reserve their full inline height and breathing room in preview and editor',()=>{
 const doc={blocks:[{type:'paragraph',inlines:[{type:'math',latex:'y = \\dfrac{x}{2} + 3'},{type:'break'},{type:'math',latex:'\\dfrac{x - 2y}{4} = 0'}]}]};
 for(const html of [documentHtml(doc),renderDocument(doc,{editable:true})]){
  const wrappers=[...html.matchAll(/<span data-math="true"[^>]*style="([^"]*)"/g)];
  assert.equal(wrappers.length,2);
  for(const [,style] of wrappers){assert.match(style,/display:inline-block/);assert.match(style,/vertical-align:baseline/);assert.match(style,/padding-block:\.15em/);}
  assert.match(html,/<br>/);
 }
});
