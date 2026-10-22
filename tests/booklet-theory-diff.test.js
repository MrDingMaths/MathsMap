import test from 'node:test';
import assert from 'node:assert/strict';
import {wordTokens,exemptTokens,tokenDifference,theoryDiff,regionWords,describeDiff} from '../src/lib/booklet-theory-diff.js';

const block=(text,extra={})=>({id:'t',type:'rich-text',content:{id:'c',type:'doc',blocks:[{id:'p',type:'paragraph',inlines:[{type:'text',text}]}]},...extra});
const words=text=>text.split(' ').map((t,i)=>({t,x0:10+i*30,y0:100,x1:38+i*30,y1:110}));

test('tokens are lowercase letters and digits; operators survive; single letters are dropped',()=>{
 assert.deepEqual(wordTokens('Simplify 150 beats ÷3, a rate.'),['simplify','150','beats','div3','rate']);
});

test('the tokens of recorded departures and corrections are exempt from the comparison',()=>{
 const b=block('x',{sourceReview:{intentionalDepartures:['Include square centimetres in the answers'],sourceCorrections:[{original:'$r=11$',corrected:'radius 12 cm'}]}});
 const exempt=exemptTokens(b);
 for(const token of ['include','square','centimetres','answers','radius','12','cm'])assert.ok(exempt.has(token),token);
 assert.ok(!exempt.has('rate'));
 assert.deepEqual(tokenDifference(['a1','rate','square'],['rate'],exempt),{missing:['a1'],extra:[]});
});

test('words missing from the block and words the block adds are both reported',()=>{
 const source=words('A rate compares two quantities with different units');
 const diff=theoryDiff({block:block('A rate compares two quantities. Rates are very useful in everyday life'),sourceWords:source});
 assert.deepEqual(diff.missing.sort(),['different','units','with'].sort());
 assert.ok(diff.extra.includes('useful')&&diff.extra.includes('everyday'));
 assert.equal(diff.significant,true);
 assert.match(describeDiff(diff),/source words missing/);
 const same=theoryDiff({block:block('A rate compares two quantities with different units'),sourceWords:source});
 assert.deepEqual([same.missing,same.extra,same.significant],[[],[],false]);
});

test('a difference of one or two words is not significant',()=>{
 const diff=theoryDiff({block:block('A rate compares two quantities with different units today'),sourceWords:words('A rate compares two quantities with different units')});
 assert.equal(diff.extra.length,1);assert.equal(diff.significant,false);
});

test('region words leave out the printed answers (small blue text) and the footer',()=>{
 const all=[{t:'question',x0:20,y0:100,x1:80,y1:110,s:11,c:'#000000'},{t:'42',x0:30,y0:120,x1:50,y1:128,s:8,c:'#3070e0'},{t:'footer',x0:20,y0:800,x1:80,y1:810,s:11,c:'#000000'},{t:'outside',x0:400,y0:100,x1:450,y1:110,s:11,c:'#000000'}];
 assert.deepEqual(regionWords(all,[10,90,200,140],{pageHeight:842}).map(w=>w.t),['question']);
});
