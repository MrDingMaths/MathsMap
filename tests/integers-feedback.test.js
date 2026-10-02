import test from 'node:test';
import assert from 'node:assert/strict';
import {repairIntegersFeedback} from '../scripts/booklet/repair-integers-r73.mjs';
import {clozeLeader} from '../public/libs/maths-editor/cloze-leader.mjs';
test('Integer feedback preserves source, answers, IDs and local cloze exception',()=>{
 const response={id:'p23-q13-c',type:'part',answerSpaceMm:0,responseSpace:'scaffold',answer:{short:'Falls, rises, then falls.',worked:'Accepted method.'},prompt:{format:'maths-editor-document-v1',blocks:[{id:'prompt',type:'paragraph',inlines:[{type:'text',text:'Explain what happens.'}]},{id:'response',type:'paragraph',inlines:[{type:'cloze',answer:'Falls, rises, then falls.',width:120,lines:2}]}]}};
 const p={id:'computation-with-integers-v1',source:{evidence:'original'},settings:{},sections:[{blocks:[{id:'p3-review',content:{blocks:[{type:'paragraph',inlines:[{type:'text',text:'Work with whole numbers'}]}]}},{id:'p13-q7',content:{prompt:'Retain local completion',answer:{short:'accepted'}}},{id:'p23-q13',type:'question',bankRef:{id:'bank-pin'},content:{id:'root',children:[{id:'p23-q13-a',prompt:{blocks:[]},answer:{}},{id:'p23-q13-b',prompt:{blocks:[]},answer:{}},response]}}]}]};
 const {next,records}=repairIntegersFeedback(p);
 assert.deepEqual(next.source,p.source);
 const byId=p=>new Map(p.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));
 const original=byId(p),updated=byId(next);
 assert.deepEqual([...original.keys()],[...updated.keys()]);
 assert.deepEqual(updated.get('p13-q7').content,original.get('p13-q7').content);
 for(const {id} of records){
  const answers=n=>[n?.id,n?.answer,...(n?.children??[]).map(answers)];
  assert.deepEqual(answers(updated.get(id).content),answers(original.get(id).content));
  assert.deepEqual(updated.get(id).bankRef,original.get(id).bankRef);
 }
 assert.equal(updated.get('p3-review').content.blocks.length,0);
 assert.equal(updated.get('p23-q13').content.children[2].answerSpaceMm,16);
 assert.equal(repairIntegersFeedback(next).records.length,0);
});
test('Cloze dot SVG fits its actual containing response width',()=>{
 assert.match(clozeLeader(90),/max-width:100%/);
});
test('Complete imperative prompts get working space while answers remain editable',()=>{
 const answer={short:'Accepted result',worked:'Accepted method'};
 const p={id:'computation-with-integers-v1',settings:{},sections:[{blocks:[{id:'p22-q9',type:'question',content:{id:'p22-q9-b',type:'part',answer,answerSpaceMm:0,responseSpace:'scaffold',prompt:{format:'maths-editor-document-v1',blocks:[{id:'prompt',type:'paragraph',inlines:[{type:'text',text:'Find the new credit card balance. '},{type:'cloze',answer:'Accepted result',width:90}]}]}}}]}]};
 const {next}=repairIntegersFeedback(p),part=next.sections[0].blocks[0].content;
 assert.equal(part.prompt.blocks[0].inlines.length,1);assert.equal(part.answerSpaceMm,8);assert.deepEqual(part.answer,answer);
 assert.equal(repairIntegersFeedback(next).records.length,0);
});
test('Enlarged number lines receive column weights as well as widths',()=>{
 const content={id:'root',type:'question',children:[{id:'part',type:'part',prompt:'Complete the calculation',questionDiagrams:[{id:'part-number-line',format:'tikz',code:'accepted'}]}]};
 const arrangement={version:1,root:{id:'row',type:'group',direction:'row',children:[{id:'response',type:'item',ref:'part/prompt',width:18},{id:'diagram',type:'item',ref:'part-number-line',width:43}]}};
 const p={id:'computation-with-integers-v1',settings:{layoutOverrides:{blockLayouts:{'p18-guided-practice':{arrangement}}}},sections:[{blocks:[{id:'p18-guided-practice',type:'question',content}]}]};
 const {next}=repairIntegersFeedback(p),row=next.settings.layoutOverrides.blockLayouts['p18-guided-practice'].arrangement.root;
 assert.equal(row.gap,1);assert.equal(row.children[0].weight,18);assert.equal(row.children[1].width,120);assert.equal(row.children[1].weight,120);
});
