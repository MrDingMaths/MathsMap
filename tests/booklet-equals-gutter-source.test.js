import test from 'node:test';
import assert from 'node:assert/strict';
import {missingEqualsGutter} from '../scripts/booklet/check-equals-gutter.mjs';

test('gutter diagnostic covers source-string answers as well as native documents',()=>{
 const block={id:'q',content:{id:'a',answer:{worked:'$\\begin{aligned}&2+3\\\\&=5\\end{aligned}$'}}};
 const hits=missingEqualsGutter(block);
 assert.equal(hits.length,1);assert.equal(hits[0].needs,'gutter');assert.equal(hits[0].field,'worked answer');
 assert.match(hits[0].first,/2\+3/);
});
test('source parsing preserves valid gutters and independent equations',()=>{
 for(const worked of ['$\\begin{aligned}&\\mathrel{\\phantom{=}}2+3\\\\&=5\\end{aligned}$','$x=2$\n$y=3$'])assert.deepEqual(missingEqualsGutter({content:{id:'a',answer:{worked}}}),[]);
});
test('preserved source evidence and diagram code do not become current calculations',()=>{
 const source='$2+3$\n$=5$';
 assert.deepEqual(missingEqualsGutter({sourceReview:{prompt:source},questionDiagrams:[{code:source}]}),[]);
});
