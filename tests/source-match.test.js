import test from 'node:test';
import assert from 'node:assert/strict';
import {alignBlockText,lcsRuns,dropOutliers,ownItems,regionFromBox,locatedEntry,blockPages,regionInk,regionCrop} from '../source-match/regions.mjs';
import {clusterCustoms,describeStructure,familyCustoms,familyKey} from '../source-match/customs.mjs';
import {questionsFor} from '../source-match/model.mjs';
import {inkByBlock,sourceSignature,measure,tally,planBlock} from '../source-match/run.mjs';
import {signatureFromInk,structureOf,signatureHash} from '../src/lib/teaching-signature.js';

const w=(t,x0,y0,extra={})=>({t,x0,y0,x1:x0+t.length*5,y1:y0+10,b:false,c:'#000000',s:12,...extra});
const chars=text=>[...text];

test('the longest common subsequence keeps only runs of four or more letters',()=>{
 const pairs=lcsRuns(chars('abcdefxghij'),chars('abcdeyghijq'));
 assert.equal(pairs.length,9,'abcde and ghij survive, x and y are dropped');
 assert.deepEqual(lcsRuns(chars('abc'),chars('abc')),[],'a run of three is chance');
});
test('block text is aligned to page words and confidence is the matched share',()=>{
 const words=[w('Example',0,0),w('Convert',0,20),w('72',50,20),w('L/h',70,20),w('to',90,20),w('mL/s',100,20),w('footer',0,800),w('Convert',0,60),w('35c/min',50,60)];
 const aligned=alignBlockText('Convert 72 L/h to mL/s',words);
 assert.ok(aligned.confidence>.95,String(aligned.confidence));
 assert.deepEqual([...aligned.matchedWords].sort((a,b)=>a-b),[1,2,3,4,5]);
 assert.equal(alignBlockText('nothing here at all',words).confidence<.3,true);
 assert.equal(alignBlockText('',words).confidence,0);
});
test('a block stored in another order than the page is matched part by part',()=>{
 // The page lists the right column first; the block lists the left column first.
 const words=[w('right',300,20),w('column',340,20),w('text',390,20),w('left',20,20),w('column',60,20),w('words',110,20)];
 const aligned=alignBlockText('left column words right column text',words);
 assert.ok(aligned.confidence>.9);
 assert.equal(aligned.matchedWords.size,6);
});
test('chance matches far from the rest of a block are dropped',()=>{
 const words=[w('alpha',0,100),w('beta',50,110),w('gamma',100,120),w('z',0,600)];
 assert.deepEqual([...dropOutliers(words,new Set([0,1,2,3]))].sort(),[0,1,2]);
 assert.deepEqual([...dropOutliers(words,new Set([3]))],[3],'a lone match is kept');
});
test('pictures and shapes belong to the nearest block within reach',()=>{
 const page={width:595,height:842,images:[{bbox:[100,300,200,400]},{bbox:[100,700,200,780]}],drawings:[{rect:[300,95,310,105],items:[['l',[300,95],[310,105]]]},{rect:[0,0,500,1],items:[['re',0,0,500,1]]}]};
 const owned=ownItems(page,new Map([['a',[90,100,300,290]],['b',[90,500,300,690]]]));
 assert.deepEqual([[...owned.get('a').images],[...owned.get('b').images]],[[0],[1]]);
 assert.deepEqual([...owned.get('a').drawings],[0],'a thin rule is not content');
 // A figure and the arrow beside it are taken in two rounds.
 const far={width:595,height:842,images:[{bbox:[100,180,200,280]}],drawings:[{rect:[100,300,110,315],items:[['l',[100,300],[110,315]]]}]};
 const two=ownItems(far,new Map([['a',[90,100,300,150]]]));
 assert.equal(two.get('a').images.size+two.get('a').drawings.size,2);
});
test('a located region takes the words and pictures inside the model box',()=>{
 const page={width:600,height:800,words:[w('in',100,100),w('out',100,500)],drawings:[],images:[{bbox:[90,90,210,190]}]};
 const part=regionFromBox(page,[.1,.1,.5,.3]);
 assert.deepEqual(part.words.map(x=>x.t),['in']);assert.equal(part.images.length,1);
 const entry=locatedEntry({blockId:'b',blockHash:'h',confidence:0,needsLocate:true,reason:'no text'},page,3,[.1,.1,.5,.3]);
 assert.equal(entry.located,true);assert.equal(entry.needsLocate,false);assert.ok(entry.confidence>=.6);
 assert.deepEqual(regionCrop(entry).box.map(Math.round),[50,70,310,250]);
 assert.deepEqual(blockPages({sourcePageNumber:4,sourceRefs:[{pageNumber:4},{pageNumber:5}]}),[4,5]);
});
test('region ink stacks the pages of a block 1000 points apart',()=>{
 const entry={parts:[{pageIndex:0,words:[w('first',50,50)],drawings:[],images:[]},{pageIndex:1,words:[w('second',50,50)],drawings:[],images:[]}]};
 const ink=regionInk(entry);
 assert.equal(ink.words.length,2);
 assert.ok(ink.words[1].y-ink.words[0].y>300,'the second page is below the first');
 assert.deepEqual(ink.words.map(x=>x.p),[0,1]);
});

test('custom structures that recur are clustered by structure hash, three or more',()=>{
 const record=(project,blockId,signatureHash)=>({project,blockId,signatureHash,reason:'r'});
 const clusters=clusterCustoms([record('a','1','h1'),record('b','2','h1'),record('c','3','h1'),record('a','4','h2'),record('b','5','h2'),{project:'x',blockId:'6'}]);
 assert.equal(clusters.length,1);
 assert.deepEqual([clusters[0].signatureHash,clusters[0].count,clusters[0].booklets],['h1',3,['a','b','c']]);
 assert.equal(clusterCustoms([record('a','1','h2'),record('b','2','h2')],{min:2}).length,1);
 const sig=signatureFromInk({words:[{t:'one',x:20,y:20,w:6,h:4.8,b:false,c:null,m:0},{t:'two',x:24,y:28,w:6,h:4.8,b:false,c:null,m:0}],rules:[],figures:[],items:[],arrows:[{start:[22,24],end:[22,27],heads:'end'}]});
 assert.match(describeStructure(structureOf(sig)),/one column; 2 lines; 2 indent levels; 1 arrow/);
 assert.equal(describeStructure(null),null);
});

test('the model is asked closed questions only about what is ambiguous',()=>{
 const sig=signatureFromInk({words:[{t:'one',x:20,y:20,w:6,h:4.8,b:false,c:null,m:0}],rules:[],figures:[],items:[],arrows:[]});
 const mismatches=[{type:'figure',severity:'ambiguous'},{type:'arrows',severity:'ambiguous'},{type:'groups',severity:'ambiguous',lineIds:['L0','L1']},{type:'column',severity:'ambiguous',column:0,lineIds:['L0','L1']},{type:'indent',severity:'decidable'}];
 const keys=questionsFor({},sig,mismatches).map(q=>q.key);
 assert.deepEqual(keys,['figure','arrows','groups','columns']);
 assert.deepEqual(questionsFor({},sig,[{type:'indent',severity:'decidable'}]),[]);
});

test('measuring compares each teaching block with its region, and a matching block needs no repair',()=>{
 const project={sections:[{id:'s',phase:'teaching',blocks:[{id:'t1',type:'rich-text',content:{format:'maths-editor-document-v1',version:1,blocks:[]}}]}]};
 const entry={blockId:'t1',blockHash:'h',confidence:.9,pages:[1],parts:[{pageIndex:0,words:[w('hello',60,60),w('there',100,60),w('second',60,90),w('line',100,90)],drawings:[],images:[]}]};
 const geometry={editions:{student:{pages:[{ink:{t1:{words:[
  {t:'hello',x:21,y:21,w:12,h:4.8,b:false,c:null,m:0},{t:'there',x:36,y:21,w:12,h:4.8,b:false,c:null,m:0},
  {t:'second',x:21,y:31,w:14,h:4.8,b:false,c:null,m:0},{t:'line',x:38,y:31,w:9,h:4.8,b:false,c:null,m:0}],rules:[],figures:[],items:[],arrows:[]}}}]}}};
 const ink=inkByBlock(geometry);
 assert.equal(ink.get('t1').words.length,4);
 const rows=measure({project,regions:{blocks:{t1:entry}},render:ink});
 // isPractice treats rich-text as teaching; one row, nothing to repair.
 assert.deepEqual(Object.keys(rows),['t1']);
 assert.equal(rows.t1.comparison.mismatches.length,0);
 assert.equal(tally(rows).blocks.matched,1);
 assert.deepEqual(planBlock(rows.t1,{settings:{}}).corrections,[]);
 assert.equal(signatureHash(sourceSignature(entry)),signatureHash(rows.t1.render));
});

test('custom structures that differ in size but not in kind fall into one family',()=>{
 const make=n=>structureOf(signatureFromInk({words:Array.from({length:n},(_,i)=>({t:'w'+i,x:20+(i%2)*4,y:20+i*8,w:6,h:4.8,b:false,c:null,m:0})),rules:[],figures:[],items:[],arrows:[]}));
 const records=[3,4,5].map((n,i)=>({project:'p'+i,blockId:'b'+i,signatureHash:'h'+n,structure:make(n)}));
 assert.equal(familyKey(make(3)),familyKey(make(5)));
 const families=familyCustoms(records);
 assert.equal(families.length,1);assert.equal(families[0].count,3);
 assert.deepEqual(familyCustoms(records.slice(0,2)),[]);
 assert.equal(familyKey(null),null);
});
