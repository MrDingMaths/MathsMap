import test from 'node:test';
import assert from 'node:assert/strict';
import {restartedPartLabels,missingPartLabels,inconsistentPartLabelOverrides} from '../scripts/booklet/check-part-label-sequence.mjs';
import {leanPreExportLint} from '../scripts/booklet/import-pre-final.mjs';

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

test('unlettered response stages block export and propose matching visible parts',()=>{
 const p=project([part('taxable','','Determine taxable income.'),part('tax','','Calculate tax payable.'),part('refund','','Should he receive a refund?')]);
 const [finding]=missingPartLabels(p);
 assert.deepEqual(proposed(finding),['a','b','c']);
 assert.deepEqual(finding.missing,['taxable','tax','refund']);
 assert.ok(leanPreExportLint(p).blocking.some(r=>r.rule==='missing-part-labels'));
 for(const n of p.sections[0].blocks[0].content.children)n.label=finding.labels[n.id][1];
 assert.deepEqual(missingPartLabels(p),[]);
});

test('initial construction, wrappers and nested tasks keep the correct sequence',()=>{
 const p=project([part('drawing','','Make an array.'),group('column','',[part('x','a','Find its intercept.'),part('y','b','Find its gradient.')])]);
 assert.deepEqual(proposed(missingPartLabels(p)[0]),['a','b','c']);
 const nested=project([{id:'a',label:'a',children:[part('one','','Calculate weekly pay.'),part('two','','Calculate holiday pay.')]}]);
 assert.deepEqual(proposed(missingPartLabels(nested)[0]),['i','ii']);
 const table=project([{...part('table','',''),responseSpace:'scaffold',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:'native-table',type:'table',rows:[[{id:'table-cell',type:'cell',blocks:[{id:'table-text',type:'paragraph',inlines:[{type:'text',text:'Value'}]}]}]]}]}},part('follow','a','Find the total.')]);
 table.sections[0].blocks[0].content.prompt='Complete the table, then answer the question.';
 assert.deepEqual(proposed(missingPartLabels(table)[0]),['a','b']);
});

test('givens, table-owned answers, field captions, scaffolds and pinned exceptions are not extra parts',()=>{
 assert.deepEqual(missingPartLabels(project([{id:'given',label:'',responseSpace:'given',questionDiagrams:[{id:'d'}]},part('a','a','Calculate the area.')])),[]);
 assert.deepEqual(missingPartLabels(project([part('row1','',''),part('row2','','')],{flow:{tableOnly:true}})),[]);
 assert.deepEqual(missingPartLabels(project([part('p','','Perimeter:'),part('a','','Area:')])),[]);
 const scaffold=project(['one','two'].map(id=>({...part(id,'','Complete this line.'),responseSpace:'scaffold',answerSpaceMm:0})));
 assert.deepEqual(missingPartLabels(scaffold),[]);
 const grouped=project([part('x','','Explain the mistake.'),part('y','','Provide the correct answer.')]);
 grouped.sections[0].blocks[0].content.answer={short:'Explanation: wrong sign. Correct answer: 13.'};
 assert.deepEqual(missingPartLabels(grouped),[]);
 assert.deepEqual(missingPartLabels(project([part('x','','Calculate x.'),part('y','','Calculate y.')],{presentation:{sourceResponseLabels:true}})),[]);
 assert.deepEqual(missingPartLabels(project([part('x','','Calculate x.'),part('y','','Calculate y.')],{pedagogyRole:'guided-practice'})),[]);
});

test('lettered supplied examples retain their position when later stages need letters',()=>{
 const p=project([part('a','a','Find x.'),part('b','b','Find y.'),part('given','c','Given example.'),part('draw','','Draw a graph.')],{sourceReview:{responses:[{targetId:'given',kind:'none'}]}});
 const [finding]=missingPartLabels(p);
 assert.deepEqual(proposed(finding),['a','b','c','d']);
 assert.deepEqual(finding.labels.given,['c','c']);
});

test('saved answer-label overrides cannot conceal repaired visible part labels',()=>{
 const p=project([part('draw','a','Draw the graph.'),part('explain','b','Explain the result.')],{presentation:{answerPartLabels:{short:{draw:'',explain:'a'},worked:{draw:'a',explain:'b'}}}});
 assert.deepEqual(inconsistentPartLabelOverrides(p).map(f=>[f.mode,f.parentId,f.actual,f.expected]),[['short','draw','','a'],['short','explain','a','b']]);
 assert.ok(leanPreExportLint(p).blocking.some(f=>f.rule==='inconsistent-answer-part-label'));
 p.sections[0].blocks[0].presentation.sourceResponseLabels=true;
 assert.deepEqual(inconsistentPartLabelOverrides(p),[]);
});
