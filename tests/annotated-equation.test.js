import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDocument,freshDocument,exportSource,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
import {changeEquation,anchorResolved,equationTargets,placeEquationLabels} from '../public/libs/maths-editor/annotated-equation.mjs';
import {documentHtml} from '../src/lib/document-content.js';
import {blockClozeAnswers,independentAnswerPages,teachingQuestionMode} from '../src/lib/booklet-answer-options.js';
const fixture=()=>normalizeDocument({blocks:[{id:'eq',type:'annotated-equation',latex:'y=mx+c',anchors:[{id:'coefficient',start:2,end:3,text:'m'},{id:'constant',start:5,end:6,text:'c'}],annotations:[{id:'label',targetId:'coefficient',colour:'#268cff',blocks:[{id:'label-text',type:'paragraph',inlines:[{type:'text',text:'coefficient of '},{type:'math',latex:'x'}]}]}]}]});

test('caption edges can attach to their own terms without changing ordinary packing',()=>{
 const doc=fixture(),plain=documentHtml(doc);
 assert.doesNotMatch(plain,/data-label-target-edge/);
 doc.blocks[0].annotations[0].labelTargetEdge='right';
 const copy=freshDocument(normalizeDocument(doc));
 assert.equal(copy.blocks[0].annotations[0].labelTargetEdge,'right');
 assert.match(documentHtml(copy),/data-label-target-edge="right"/);
 const labels=[{center:317,width:210,labelTargetEdge:'right'},{center:350,width:236,labelTargetEdge:'left'}];
 assert.deepEqual(placeEquationLabels(labels,586),[107,350]);
 assert.deepEqual(placeEquationLabels([{center:30,width:20},{center:90,width:20}],140),[20,80]);
 assert.equal(copy.blocks[0].latex,'y=mx+c');
});

test('vertical annotation arrows are opt-in and survive normalization and rich copy',()=>{
 const original=fixture();
 assert.equal(original.blocks[0].arrowAlignment,undefined);
 assert.doesNotMatch(documentHtml(original),/data-arrow-alignment/);
 original.blocks[0].arrowAlignment='vertical';
 const copied=freshDocument(normalizeDocument(original));
 assert.equal(copied.blocks[0].arrowAlignment,'vertical');
 assert.match(documentHtml(copied),/data-arrow-alignment="vertical"/);
});

test('below-term connections survive normalisation and copy, reserving space beneath the formula',()=>{
 const doc=fixture();doc.blocks[0].connections=[{id:'above',fromId:'coefficient',toId:'constant',height:4},{id:'below',fromId:'coefficient',toId:'constant',height:8,side:'below'}];
 const copy=freshDocument(normalizeDocument(doc)),connections=copy.blocks[0].connections;
 assert.equal(connections[0].side,undefined);
 assert.equal(connections[1].side,'below');
 assert.equal(connections[1].fromId,copy.blocks[0].anchors[0].id);
 assert.match(documentHtml(copy),/padding-bottom:8mm/);
 assert.doesNotMatch(documentHtml(fixture()),/padding-bottom/);
});

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


test('shared annotation targets survive JSON saves and rich copy without changing single-target defaults',()=>{
 const doc=fixture(),n=doc.blocks[0];
 const before=documentHtml(doc);n.annotations[0].additionalTargetIds=[];
 const stable=html=>html.replace(/ae-\d+-/g,'ae-N-').replace(/data-equation-instance="\d+"/g,'data-equation-instance="N"');
 assert.equal(stable(documentHtml(normalizeDocument(doc))),stable(before));
 n.annotations[0].additionalTargetIds=['constant','coefficient','constant',null,''];
 const saved=normalizeDocument(JSON.parse(JSON.stringify(doc)));
 assert.deepEqual(saved.blocks[0].annotations[0].additionalTargetIds,['constant']);
 assert.deepEqual(normalizeDocument(saved),saved);
 const copy=freshDocument(saved),eq=copy.blocks[0];
 assert.deepEqual(eq.annotations[0].additionalTargetIds,[eq.anchors[1].id]);
 assert.equal(eq.annotations[0].targetId,eq.anchors[0].id);
 assert.doesNotMatch(documentHtml(copy),/data-equation-warning|katex-error/);
 assert.match(documentHtml(copy),/data-target-indices="0,1"/);
 assert.equal((documentHtml(copy).match(/data-equation-label="/g)||[]).length,1);
});

test('shared annotations warn for missing primary, additional, empty or invalidated targets',()=>{
 for(const targets of [{targetId:'missing',additionalTargetIds:['constant']},{targetId:'coefficient',additionalTargetIds:['missing']},{targetId:'',additionalTargetIds:[]}]){
  const doc=fixture();Object.assign(doc.blocks[0].annotations[0],targets);
  assert.match(documentHtml(normalizeDocument(doc)),/data-equation-warning/);
 }
 const doc=fixture();doc.blocks[0].annotations[0].additionalTargetIds=['constant'];changeEquation(doc.blocks[0],'y=mx');
 assert.match(documentHtml(doc),/data-equation-warning/);
});
