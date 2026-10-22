import test from 'node:test';
import assert from 'node:assert/strict';
import {regionsUrl,queueUrl,pageImageUrl,runIdOf,regionParts,confidenceOf,entryFor,itemFor,sortedQueue,describeMismatch,regionPages} from '../src/lib/booklet-source-compare.js';
import {buildQueue} from '../handoff/lib/queue.mjs';
import {STEPS} from '../handoff/run.mjs';

test('the Source tab reads source-match files and page images through the import run endpoint',()=>{
 assert.equal(regionsUrl('rates-v1-20261002-medium'),'/__booklet/full-imports/rates-v1-20261002-medium/files/source-match/regions.json');
 assert.equal(queueUrl('r'),'/__booklet/full-imports/r/files/source-match/review-queue.json');
 assert.equal(pageImageUrl('r',4),'/__booklet/full-imports/r/files/evidence/pages/page-004.png');
 assert.equal(pageImageUrl('a b',12),'/__booklet/full-imports/a%20b/files/evidence/pages/page-012.png');
 assert.equal(runIdOf({source:{runId:'x'}}),'x');
 assert.equal(runIdOf({}),null);
});

test('a region box in points becomes percentages of its page for the highlight',()=>{
 const entry={confidence:.9,parts:[{page:4,box:[59.5,119,297.5,421],width:595,height:842,confidence:.9},{page:5,box:[0,0,595,842],width:595,height:842}]};
 const [first,second]=regionParts(entry);
 assert.equal(first.page,4);
 for(const [actual,expected] of [[first.left,10],[first.top,119/842*100],[first.width,40],[first.height,302/842*100]])assert.ok(Math.abs(actual-expected)<1e-9);
 assert.deepEqual([second.left,second.top,second.width,second.height],[0,0,100,100]);
 assert.deepEqual(regionPages(entry),[4,5]);
 assert.deepEqual(regionParts({parts:[{page:1,box:[0,0,1,1],width:0,height:0}]}),[],'an unusable part is dropped');
 assert.deepEqual(regionParts(null),[]);
});

test('confidence is told in words and a located region is as good as a matched one',()=>{
 assert.equal(confidenceOf({confidence:.72}).label,'72% of the text matched');
 assert.equal(confidenceOf({confidence:.3,located:true}).label,'located by the model');
 assert.equal(confidenceOf(null).rank,-1);
});

test('the review queue lists the least certain block first, then the one with most to look at',()=>{
 const queue={items:[{blockId:'c',confidence:.95,mismatches:[1]},{blockId:'a',confidence:.4,mismatches:[1]},{blockId:'b',confidence:.4,mismatches:[1,2]},{blockId:'n',confidence:null,mismatches:[]}]};
 assert.deepEqual(sortedQueue(queue).map(i=>i.blockId),['n','b','a','c']);
 assert.equal(itemFor(queue,'a').confidence,.4);
 assert.equal(entryFor({blocks:{x:{}}},'x').constructor,Object);
 assert.equal(entryFor(null,'x'),null);
 assert.equal(describeMismatch({type:'arrows',severity:'ambiguous',detail:'no arrow from row 2'}),'arrows (ambiguous): no arrow from row 2');
 assert.equal(describeMismatch({check:'roles',status:'refused',detail:'no worked example'}),'roles (refused): no worked example');
});

test('the combined queue merges the checks by block, lowest confidence first, and drops what was fixed',()=>{
 const queue=buildQueue({project:{id:'p'},at:'t',
  sourceMatch:{items:[{blockId:'b2',confidence:.8,sourcePage:5,mismatches:[{type:'column',severity:'decidable',detail:'= not aligned'}],stuck:[{why:'no preset'}]},{blockId:'b1',confidence:.3,located:false,sourcePage:4,mismatches:[]}]},
  roles:{findings:[{blockId:'b1',status:'refused',detail:'role example, source prints Guided Practice'},{blockId:'b9',status:'fixed',detail:'x'}]},
  wrapped:{after:{left:[{blockId:'b3',detail:'maths wraps'}]}},
  whitespace:{gaps:[{blockId:'b2',detail:'20 mm gap',explanation:{attributed:false}},{blockId:'b4',detail:'fine',explanation:{attributed:true}}],strays:[{blockId:'b5',gapMm:30,page:7},{blockId:'b6',gapMm:12,page:8}],fixes:[{blockId:'b6',kept:true}]},
  theory:[{blockId:'b3',detail:'2 words added'}],
  firstPass:[{id:'f1',area:'spacing',comment:'gap too big',state:'pending',applyOutcome:'comment',applyNote:'not expressible',targets:[{blockId:'b4'}]},{id:'f2',area:'labels',comment:'done',state:'repaired',targets:[{blockId:'b5'}]}]});
 assert.deepEqual(queue.items.map(i=>i.blockId),['b3','b4','b5','b1','b2'].sort((x,y)=>queue.items.findIndex(i=>i.blockId===x)-queue.items.findIndex(i=>i.blockId===y)));
 assert.equal(queue.items[0].confidence,null,'blocks no step could place come before the matched ones');
 const by=Object.fromEntries(queue.items.map(i=>[i.blockId,i]));
 assert.deepEqual(Object.keys(by).sort(),['b1','b2','b3','b4','b5'],'b9 was fixed, b6 was cleared, b4 has only a first-pass finding');
 assert.equal(by.b1.findings[0].check,'roles');
 assert.deepEqual(by.b2.sources.sort(),['source-match','whitespace']);
 assert.match(by.b2.findings.map(f=>f.detail).join(' '),/renderer bug/);
 assert.equal(by.b4.findings[0].status,'comment');
 assert.equal(by.b5.findings.length,1,'the repaired first-pass finding is not queued');
 assert.equal(queue.summary.blocks,5);
 assert.equal(queue.summary.bySource['source-match'],2);
});

test('the handoff has the steps of the plan in order and a way to skip each',()=>{
 assert.deepEqual([...STEPS],['working-space','sweep','regions','roles','wrapped-math','whitespace','source-match','theory-diff','optimise','first-pass','apply','queue','export']);
});
