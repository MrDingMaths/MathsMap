import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateWorkedWritingSpace,sizeQuestionWorking} from '../src/lib/booklet-working-space.js';

const node=worked=>({id:'fraction-work',answer:{worked}});

test('compact numeric fraction arguments reserve the same space as braced arguments',()=>{
 for(const command of ['frac','dfrac','tfrac']){
  const braced=node(`x=\\${command}{1}{2}\ny=\\${command}{5}{2}`);
  const compact=node(`x=\\${command}12\ny=\\${command}52`);
  for(const widthMm of [25,80,160]){
   assert.equal(estimateWorkedWritingSpace(compact,{widthMm}),estimateWorkedWritingSpace(braced,{widthMm}),`${command} at ${widthMm} mm`);
  }
  assert.equal(estimateWorkedWritingSpace(compact,{widthMm:160}),22);
 }
});

test('fraction matching rejects longer control words in row widths and nested work',()=>{
 for(const command of ['frac','dfrac','tfrac']){
  for(const suffix of ['tion','Extra']){
   const unrelated=`\\${command}${suffix}{1}{2}`;
   assert.equal(estimateWorkedWritingSpace(node(`${unrelated}\n${unrelated}`)),20);
   // Keep this near a wrap boundary to catch prefix replacement in visible text.
   assert.equal(estimateWorkedWritingSpace(node(`xxxxxxxx${unrelated}`),{widthMm:25}),12);
   assert.equal(estimateWorkedWritingSpace(node(`\\frac{${unrelated}}{3}`)),12);
  }
  assert.equal(estimateWorkedWritingSpace(node(`\\frac{\\${command}12}{3}`)),14);
  assert.equal(estimateWorkedWritingSpace(node(`\\frac{\\${command}12}{3}`)),estimateWorkedWritingSpace(node(`\\frac{\\${command}{1}{2}}{3}`)));
 }
});

test('fraction sizing preserves manual spaces, special response kinds and explicit constructions',()=>{
 const compact=node(String.raw`x=\frac12`+'\n'+String.raw`y=\frac52`);
 const manual={...compact,answerSpaceMm:23};
 assert.equal(estimateWorkedWritingSpace(manual),23);
 for(const responseKind of ['cloze','inline','none'])assert.equal(estimateWorkedWritingSpace(manual,{responseKind}),0);
 assert.equal(estimateWorkedWritingSpace(compact,{responseKind:'tick-cross'}),6);
 assert.equal(estimateWorkedWritingSpace({...compact,responseSpace:'scaffold'}),0);
 const question={children:[manual]};
 sizeQuestionWorking(question);
 assert.equal(manual.answerSpaceMm,23);
 assert.equal(estimateWorkedWritingSpace(compact,{studentWork:compact.answer.worked,studentDiagrams:[{requiredHeightMm:100}]}),122);
 assert.equal(estimateWorkedWritingSpace(manual,{studentWork:compact.answer.worked,studentDiagrams:[{requiredHeightMm:100}]}),23);
});
