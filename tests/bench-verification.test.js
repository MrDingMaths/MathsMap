import test from 'node:test';
import assert from 'node:assert/strict';
import {lastBefore,firstAtOrAfter,isTeacherFlag} from '../bench/history.mjs';
import {categorise,registerDetector,detectors} from '../bench/corpus.mjs';
import {holdsFix,classifyComment,tallyComments,findingBlocks,findingCategory} from '../bench/benchmark.mjs';
import {tokens,tokenDiff} from '../bench/fields.mjs';

test('the import-final revision is the last save strictly before the first teacher flag',()=>{
 const stamped=[{revision:1,at:'2026-10-18T10:00:00.000Z'},{revision:2,at:'2026-10-18T11:58:00.000Z'},{revision:3,at:'2026-10-18T12:00:00.000Z'},{revision:4,at:null}];
 assert.equal(lastBefore(stamped,'2026-10-18T11:59:57.278Z').revision,2);
 assert.equal(lastBefore(stamped,'2026-10-18T10:00:00.000Z'),null);
 assert.equal(firstAtOrAfter(stamped,'2026-10-18T11:59:00.000Z').revision,3);
 assert.equal(firstAtOrAfter(stamped,'2026-10-19T00:00:00.000Z'),null);
});
test('a teacher flag has a time and no kind, so first-pass and workflow flags are excluded',()=>{
 assert.equal(isTeacherFlag({id:'a',at:'2026-10-18T00:00:00Z'}),true);
 assert.equal(isTeacherFlag({id:'b',at:'2026-10-18T00:00:00Z',kind:'first-pass'}),false);
 assert.equal(isTeacherFlag({id:'c',workflowIssue:true,at:'2026-10-18T00:00:00Z'}),false);
 assert.equal(isTeacherFlag({id:'d'}),false);
});
test('comments are categorised by keyword, with overrides first',()=>{
 assert.equal(categorise('remove the page break after this block so exercise 5 fits on this page').category,'spacing-pagination');
 assert.equal(categorise('this should be a guided practice block').category,'block-role');
 assert.equal(categorise('get rid of boxes, keep cloze.').category,'cloze-scaffold');
 assert.equal(categorise('q9 the equation is left aligned and q10 centre aligned').category,'alignment');
 assert.equal(categorise('these arrows both point to the numerator').category,'diagram-arrow');
 assert.equal(categorise('restart numbering at a').category,'part-labels');
 assert.equal(categorise('have the equation scaffold fit on one line like in the source').category,'wrapping');
 assert.equal(categorise('how do I delete list items?').category,'content');
 assert.deepEqual(categorise('anything',{overrides:{k1:'wrapping'},keys:['k1']}),{category:'wrapping',basis:'override'});
 assert.throws(()=>categorise('x',{overrides:{k1:'nonsense'},keys:['k1']}));
});
test('detectors are pluggable and validated',()=>{
 assert.throws(()=>registerDetector({name:'bad',categories:['not-a-category'],detect(){return [];}}));
 registerDetector({name:'test-detector',categories:['wrapping'],detect:()=>[{blockId:'b1'}]});
 assert.ok(detectors().some(d=>d.name==='test-detector'));
});
test('an arm avoids a comment when it already holds every value the fix set',()=>{
 const arm=new Map([['spacing/b/n.gap',{value:4.2}],['answerSpace/b/n',{value:20}]]);
 const diff=[{key:'spacing/b/n.gap',before:8,after:4},{key:'answerSpace/b/n',before:30,after:20}];
 assert.equal(holdsFix(arm,diff).avoided,true);
 const stale=holdsFix(new Map([['spacing/b/n.gap',{value:8}],['answerSpace/b/n',{value:20}]]),diff);
 assert.equal(stale.avoided,false);assert.equal(stale.held,1);assert.equal(stale.missing[0].key,'spacing/b/n.gap');
 // A field the fix removed is held when the arm lacks it too.
 assert.equal(holdsFix(new Map(),[{key:'x',before:1,after:null}]).avoided,true);
 assert.equal(holdsFix(arm,[]).observable,false);
});
test('classification: avoided, then caught in the comment category, otherwise missed',()=>{
 const diff=[{key:'k',before:1,after:2}],row={id:'c1',at:'t',category:'spacing-pagination',blockId:'b',note:'x',diff};
 const held=new Map([['k',{value:2}]]),notHeld=new Map([['k',{value:1}]]);
 assert.equal(classifyComment(row,held,[],{id:'b'}).status,'avoided');
 assert.equal(classifyComment(row,notHeld,[{blockId:'b',category:'spacing-pagination',via:'findings'}],{id:'b'}).status,'caught');
 assert.equal(classifyComment(row,notHeld,[{blockId:'b',category:'alignment',via:'findings'}],{id:'b'}).status,'missed');
 assert.equal(classifyComment(row,notHeld,[],undefined).reason,'block is not in the arm');
 const content={...row,diff:[],content:{changed:true,afterHash:'abc'}};
 assert.equal(classifyComment(content,new Map(),[],{type:'rich-text'}).status,'missed');
 const tally=tallyComments([{category:'alignment',status:'avoided',observable:true},{category:'alignment',status:'missed',observable:false}]);
 assert.deepEqual(tally.total,{avoided:1,caught:0,missed:1,unobservable:1});
});
test('findings are read by block and by area',()=>{
 assert.deepEqual(findingBlocks({targets:[{blockId:'a'},{blockId:'b'}],blockId:'a'}).sort(),['a','b']);
 assert.equal(findingCategory({area:'pagination'}),'spacing-pagination');
 assert.equal(findingCategory({area:'alignment',category:'wrapping'}),'wrapping');
});
test('token diff counts added and removed tokens',()=>{
 assert.deepEqual(tokenDiff(tokens('divide by 4'),tokens('divide by 4')),{added:0,removed:0});
 assert.deepEqual(tokenDiff(tokens('a b c'),tokens('a c d e')),{added:2,removed:1});
});
