import test from 'node:test';
import {normaliseQuestion} from '../src/lib/practice-question-model.js';
import assert from 'node:assert/strict';
import {tableResponseDocument} from '../src/lib/booklet-table-responses.js';
import {teachingAnswerArrangement,resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {documentHtml} from '../src/lib/document-content.js';
import {normalizeDocument} from '../public/libs/maths-editor/document-model.mjs';
import {templateDiagram} from '../src/lib/diagram-templates.js';
const doc={format:'maths-editor-document-v1',version:1,blocks:[{id:'table',type:'table',rows:[[{id:'given',type:'cell',blocks:[{id:'given-p',type:'paragraph',inlines:[{type:'math',latex:'7+\\sqrt3'}]}]},{id:'result',type:'cell',blocks:[]}]]}]};
const block=()=>({id:'activity',type:'question',sourceAtom:{kind:'identify'},sourceReview:{tableResponses:[{cellId:'result',targetId:'response'}]},content:{id:'root',prompt:doc,children:[{id:'response',label:'',prompt:'',answer:{short:'$7-\\sqrt3$',worked:'Change the sign.'}}]}});
test('individual response cells survive bank normalisation without duplicating short answers',()=>{
 const b=block(),node=b.content.children[0];
 node.answer.tableCells={format:'maths-editor-document-v1',version:1,blocks:[{id:'cell-answer',type:'paragraph',inlines:[{type:'math',latex:'\\frac37'}]}]};
 b.sourceReview.tableResponses=[{cellId:'result',targetId:node.id,field:'tableCells',nodeId:'cell-answer'}];
 const normalised=normaliseQuestion(b);
 assert.deepEqual(normalised.content.children[0].answer.tableCells,normalizeDocument(node.answer.tableCells));
 const display=tableResponseDocument(doc,{...b,content:normalised.content});
 assert.equal(display.blocks[0].rows[0][1].blocks[0].inlines[0].latex,'\\frac37');
 assert.equal(normalised.content.children[0].answer.short,node.answer.short);
});
test('native table answers remain in their cells and never change the student prompt',()=>{
 const b=block(),before=structuredClone(b),stored={version:1,root:{id:'layout',type:'group',direction:'stack',children:[{id:'prompt',type:'item',ref:'root/prompt'}]}};
 const student=resolveArrangement(b,stored);assert.equal([...student.entries.values()].find(e=>e.kind==='document').displayValue,undefined);
 const answer=teachingAnswerArrangement(b,stored,{},'worked'),resolved=resolveArrangement(b,answer),entry=[...resolved.entries.values()].find(e=>e.kind==='document');
 assert.equal(entry.value.blocks[0].rows[0][1].blocks.length,0);
 assert.match(documentHtml(entry.displayValue),/7/);assert.equal(entry.displayValue.blocks[0].rows[0][1].blocks[0].inlines[0].latex,'7-\\sqrt3');
 assert.deepEqual(b,before);assert.deepEqual(tableResponseDocument(doc,b),tableResponseDocument(doc,b));
 b.content.children[0].answer.short='$8-\\sqrt5$';assert.equal(tableResponseDocument(doc,b).blocks[0].rows[0][1].blocks[0].inlines[0].latex,'8-\\sqrt5');
});
test('choice bindings preserve labels and mark only the selected cell',()=>{
 const b=block();b.content.children[0].answer.short='Rational.';b.sourceReview.tableResponses=[{cellId:'given',targetId:'response',when:'Surd'},{cellId:'result',targetId:'response',when:'Rational'}];
 const choice=structuredClone(doc);choice.blocks[0].rows[0][1].blocks=[{id:'choice',type:'paragraph',inlines:[{type:'text',text:'Rational'}]}];
 const result=tableResponseDocument(choice,b);assert.equal(result.blocks[0].rows[0][0].blocks[0].inlines.length,1);assert.equal(result.blocks[0].rows[0][1].blocks[0].inlines.at(-1).latex,'\\checkmark');
});
test('paired Yes | No choices stay in one source table cell',()=>{
 const b=block();b.content.children[0].answer.short='No; subtraction is not one of the displayed laws.';b.sourceReview.tableResponses=[{cellId:'result',targetId:'response',choices:['Yes','No']}];
 const answer=tableResponseDocument(doc,b).blocks[0].rows[0][1].blocks[0];
 assert.deepEqual(answer.inlines.filter(i=>i.type==='text').map(i=>i.text),['Yes',' | ','No',' ']);assert.equal(answer.inlines.at(-1).latex,'\\checkmark');
});
test('a radical cloze keeps the radical visible with a dotted blank and fills its radicand',()=>{
 const value={format:'maths-editor-document-v1',version:1,blocks:[{id:'p',type:'paragraph',inlines:[{type:'cloze',answer:'$3$',width:9,enclosure:'sqrt'}]}]};
 assert.equal(normalizeDocument(value).blocks[0].inlines[0].enclosure,'sqrt');
 const blank=documentHtml(value),filled=documentHtml(value,{fillCloze:true});assert.match(blank,/data-cloze-enclosure="sqrt"/);assert.match(blank,/data-cloze-leader/);assert.doesNotMatch(filled,/data-cloze-leader/);assert.doesNotMatch(blank+filled,/katex-error/);assert.match(filled,/sqrt/);
});

test('staggered number-line labels retain the exact point positions and axis',()=>{
 const parameters={family:'number-line',min:0,max:4,step:1,lengthMm:80,points:[{value:Math.sqrt(3),label:'a'},{value:2,label:'b'}]};
 const before=templateDiagram('line',parameters),shifted=structuredClone(parameters);shifted.points[1].labelOffsetMm={x:0,y:16};
 const after=templateDiagram('line',shifted);
 const structure=code=>code.split('\n').filter(line=>line.startsWith('\\fill[')||line.startsWith('\\draw[')&&!line.includes('0.4pt'));
 assert.deepEqual(structure(after.code),structure(before.code));
 assert.match(after.code,/at \(40,17\.6\).*\$b\$/);
 assert.equal(after.template.points[0].value,Math.sqrt(3));
 assert.equal(parameters.points[1].labelOffsetMm,undefined);
 assert.throws(()=>templateDiagram('line',{...shifted,points:[{value:2,label:'b',labelOffsetMm:{y:-1}}]}),/label offsets/);
});
