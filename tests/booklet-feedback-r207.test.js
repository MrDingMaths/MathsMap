import test from 'node:test';import assert from 'node:assert/strict';
import {flowPageAnchor,resolveFlowPageAnchor} from '../src/lib/booklet-viewport.js';
import {answerDiagramWidth,withAnswerDiagramWidth,answerDiagramSignature} from '../src/lib/booklet-exercises.js';
import {teachingEquationDisplays} from '../src/lib/booklet-teaching-alignment.js';
import {arrangementCatalog} from '../src/lib/booklet-arrangement.js';
import {renderDocument,normalizeDocument,template} from '../public/libs/maths-editor/document-model.mjs';
const page=(mode,id,fragment=0)=>({mode,section:{id:mode+'-s',sourceSectionId:'s'},blocks:[{id,flow:{answerFragment:fragment}}]});

test('viewport anchors distinguish question, answer and continuation occurrences',()=>{
 const pages=[page('student','q'),page('short','q'),page('short','q',1),page('worked','q')];
 const anchor=flowPageAnchor(pages,2);
 assert.equal(resolveFlowPageAnchor([page('student','new'),...pages],anchor),3);
 assert.equal(resolveFlowPageAnchor(pages,flowPageAnchor(pages,3)),3);
});
test('deleting the anchored block keeps a nearby surviving answer in its mode',()=>{
 const pages=[page('student','a'),page('student','b'),page('short','a'),page('short','b')];
 assert.equal(resolveFlowPageAnchor([pages[0],pages[2]],flowPageAnchor(pages,3)),1);
 assert.equal(resolveFlowPageAnchor([pages[0]],flowPageAnchor(pages,3)),-1);
});
test('answer sizes are independent, override caps and invalidate only the resized calibration',()=>{
 const diagram={id:'d',widthMm:128.4,code:'source'},signature=answerDiagramSignature(diagram);
 const settings={shortDiagramMm:45,workedDiagramMm:55,diagramWidths:{d:42},diagramStyles:{short:{d:{widthMm:43,code:'short variant',sourceSignature:signature}},worked:{d:{widthMm:52,code:'worked variant',sourceSignature:signature}}}};
 const changed=withAnswerDiagramWidth(settings,'short','d',65);
 assert.equal(answerDiagramWidth(changed,'short',diagram),65);
 assert.equal(answerDiagramWidth(changed,'worked',diagram),42);
 assert.equal(changed.diagramStyles.short.d,undefined);assert.equal(changed.diagramStyles.worked.d,settings.diagramStyles.worked.d);
 assert.equal(settings.diagramWidths.d,42);
 assert.equal(answerDiagramWidth({},'short',diagram),45);
});
test('related teaching equations share relation widths without changing editable fields',()=>{
 const example={id:'e',prompt:'$$10^{-2}=\\frac{1}{100}$$',theorySolution:'$$\\color{#268cff}-2=\\log_{10}\\frac{1}{100}$$',equationAlignment:{mode:'relation',align:'center'}};
 const before=JSON.stringify(example),display=teachingEquationDisplays(example);
 assert.equal(display.prompt.blocks[0].align,'center');
 assert.match(display.theorySolution.blocks[0].inlines[0].latex,/mathllap\{-2\}/);
 assert.match(display.prompt.blocks[0].inlines[0].latex,/hphantom/);
 assert.equal(JSON.stringify(example),before);
 const entry=arrangementCatalog({id:'b',type:'worked-example',examples:[example]}).entries.get('e/prompt');
 assert.equal(entry.value,example.prompt);assert.deepEqual(entry.displayValue,display.prompt);
});
test('continuation teaching expressions reserve a relation gutter and preserve colour',()=>{
 const example={id:'e',prompt:'$\\log_2 6-\\log_2 3$',theorySolution:'$$\\begin{aligned}&=\\log_2 2\\\\&=1\\end{aligned}$$',equationAlignment:{mode:'continuation',align:'left'}};
 const display=teachingEquationDisplays(example);
 assert.match(display.prompt.blocks[0].inlines[0].latex,/phantom\{=\}/);
 assert.match(display.theorySolution.blocks[0].inlines[0].latex,/&=1/);
 assert.doesNotMatch(display.theorySolution.blocks[0].inlines[0].latex,/hphantom/);
 assert.equal(teachingEquationDisplays({...example,equationAlignment:undefined}),null);
 assert.equal(teachingEquationDisplays({...example,prompt:'Independent prose.'}),null);
});
test('speech-bubble character tracks preserve the authored physical avatar width',()=>{
 const bubble=template('speech-bubble');bubble.slots[0].blocks[0].src='/avatar.png';
 const html=renderDocument(normalizeDocument({blocks:[bubble]}));
 assert.match(html,/grid-template-columns:17mm minmax\(0,1fr\)/);
 assert.equal(bubble.slots[0].blocks[0].width,17);
});
