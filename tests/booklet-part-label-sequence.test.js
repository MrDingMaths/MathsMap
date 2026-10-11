import test from 'node:test';
import assert from 'node:assert/strict';
import {restartedPartLabels} from '../scripts/booklet/check-part-label-sequence.mjs';

const part=(id,label,prompt='')=>({id,type:'part',label,prompt,answer:{short:'1',worked:'1'}});
const group=(id,prompt,children)=>({id,type:'group',label:'',prompt,children});
const project=(children,extra={})=>({id:'sample',sections:[{blocks:[{id:'q1',type:'question',content:{id:'q1-root',type:'question',label:'1',prompt:'',children},...extra}]}]});
const proposed=finding=>Object.values(finding.labels).map(([,next])=>next);

test('restarted part labels are reported with one continuing sequence',()=>{
 // Integers Exercise 8 Q20: a-d, two unlabelled conclusions, then a-d again.
 const [finding]=restartedPartLabels(project([
  group('calculate','',[part('a1','a'),part('b1','b')]),part('even',''),part('odd',''),
  group('sign','Determine the sign.',[part('a2','a'),part('b2','b')]),
 ]));
 assert.deepEqual(proposed(finding),['a','b','c','d','e','f']);
 assert.deepEqual(finding.labels.a2,['a','e']);
 assert.deepEqual(finding.manual,[]);
 const roman=restartedPartLabels(project([group('one','Solve.',[part('x1','i'),part('x2','ii')]),group('two','Solve.',[part('y1','i'),part('y2','ii')])]));
 assert.deepEqual(proposed(roman[0]),['i','ii','iii','iv']);
});

test('continuing labels, teaching blocks and unsafe repairs are handled',()=>{
 assert.deepEqual(restartedPartLabels(project([group('one','',[part('a','a')]),group('two','Hence:',[part('b','b')])])),[]);
 const teaching=project([group('one','',[part('a1','a')]),group('two','',[part('a2','a')])],{pedagogyRole:'key-ideas'});
 assert.deepEqual(restartedPartLabels(teaching),[]);
 const referring=project([group('one','',[part('a1','a')]),group('two','',[part('a2','a','Use part a to find this.')])]);
 assert.deepEqual(restartedPartLabels(referring)[0].manual,['wording refers to a part by label']);
});
