import test from 'node:test';
import assert from 'node:assert/strict';
import {betweenBlocks,withinBlocks,chainContributions,explainGap,strayBoundaries,storedGaps,GAP_MM} from '../src/lib/booklet-whitespace-check.js';

test('gaps over 6 mm between blocks are found, smaller ones are not',()=>{
 const boxes=[{block:'a',y:20,h:30},{block:'b',y:55,h:20},{block:'c',y:90,h:10}];
 const found=betweenBlocks(boxes);
 assert.deepEqual(found.map(g=>[g.aboveBlock,g.blockId,g.gapMm]),[['b','c',15]]);
 assert.equal(GAP_MM,6);
 assert.equal(betweenBlocks(boxes,{minMm:3}).length,2);
});

test('lines of a teaching block are compared per column and a figure across the gap excuses it',()=>{
 const line=(node,x,y,h=5,w=60)=>({block:'t',node,x,y,w,h});
 const page={lines:[line('l1',10,20),line('l2',10,40),line('r1',100,20),line('r2',100,26)],elements:[]};
 const gaps=withinBlocks(page);
 assert.deepEqual(gaps.map(g=>[g.aboveNode,g.belowNode,g.gapMm]),[['l1','l2',15]],'the right column has no gap; the left has one of 15 mm');
 const covered=withinBlocks({...page,elements:[{kind:'diagram',x:10,y:26,w:40,h:12}]});
 assert.equal(covered.length,0);
 assert.equal(withinBlocks(page,{skip:id=>id==='t'}).length,0,'practice blocks keep their working space');
});

test('a gap is attributed to the fields that set it, or to working space, or is unattributable',()=>{
 const chain=(before,after)=>[{kind:'arrangement',id:'a',label:'Group',values:{before,after},fields:[['before','Space above',0,80],['after','Space below',0,80]]},{kind:'boundary',id:'b',label:'Automatic pagination'}];
 assert.deepEqual(chainContributions(chain(9,0),'before').map(c=>[c.field,c.value]),[['before',9]]);
 assert.deepEqual(chainContributions(chain(9,4),'after').map(c=>[c.field,c.value]),[['after',4]]);
 const fields=explainGap({gapMm:14},{below:chain(9,0),above:chain(0,4)});
 assert.equal(fields.attributed,true);assert.equal(fields.kind,'fields');assert.equal(fields.summedMm,13);
 const space=explainGap({gapMm:38},{below:chain(0,0),above:chain(0,0),workingSpaces:[40]});
 assert.equal(space.kind,'working-space');
 const bug=explainGap({gapMm:20},{below:chain(0,0),above:chain(0,0)});
 assert.equal(bug.attributed,false);assert.equal(bug.kind,'unattributable');
 assert.equal(explainGap({gapMm:6.4},{below:chain(0,0),above:chain(0,0)}).attributed,true,'the renderer\'s own leading is allowed for');
});

test('a source page boundary that is not an exercise start and leaves its page short is stray',()=>{
 const pages=[{page:1,blocks:['a'],trailingMm:30},{page:2,blocks:['b'],trailingMm:2},{page:3,blocks:['c'],trailingMm:50},{page:4,blocks:['d']}];
 const kind={a:'automatic',b:'source',c:'source',d:'source'};
 const found=strayBoundaries({},pages,{pageBoundaryKind:(_p,id)=>kind[id],startsExercise:id=>id==='d',firstBlocks:page=>page.blocks[0]});
 assert.deepEqual(found.map(f=>[f.blockId,f.page,f.gapMm]),[['b',1,30]],'c follows a short page 2... d starts an exercise');
 const none=strayBoundaries({},pages,{pageBoundaryKind:()=>'manual',startsExercise:()=>false,firstBlocks:page=>page.blocks[0]});
 assert.equal(none.length,0,'a break the teacher set is hers');
});

test('stored gaps: large before/after on teaching blocks and a stray source boundary, not working space',()=>{
 const project={settings:{layoutOverrides:{blockLayouts:{t:{arrangement:{version:1,root:{id:'r',type:'group',children:[{id:'g',type:'group',before:12,minHeight:60,children:[]}]}}}}}},
  sections:[{phase:'teaching',blocks:[{id:'x',type:'rich-text'},{id:'t',type:'rich-text',flow:{sourcePageBreakBefore:true}}]},{phase:'practice',blocks:[{id:'q',type:'question',flow:{sourcePageBreakBefore:true}}]}]};
 const found=storedGaps(project);
 assert.deepEqual(found.map(f=>f.blockId),['t','t']);
 assert.match(found.map(f=>f.detail).join(' | '),/source page boundary/);
 assert.match(found.map(f=>f.detail).join(' | '),/sets before 12 mm/);
 assert.doesNotMatch(found.map(f=>f.detail).join(' | '),/minHeight/);
});
