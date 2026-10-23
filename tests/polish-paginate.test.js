// Polish pipeline step 3 (23 October 2026): the orphan pull, the hard rejections and the exercise-break suggestions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {optimisePagination,suggestBreakRemovals,orphanUnit,describeUnits,shortTailSplits} from '../src/lib/booklet-pagination-optimiser.js';
import {setPageBoundary} from '../src/lib/booklet-workspace.js';

const CAPACITY=100;
const question=(id,score,extra={})=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'Q '+id},flow:{localDifficulty:{reasoningScore:score},...(extra.flow??{})},...Object.fromEntries(Object.entries(extra).filter(([k])=>k!=='flow'))});
const project=(blocks,sections=null)=>({id:'fake',settings:{layoutOverrides:{}},studio:{flags:[]},sections:sections??[{id:'s1',phase:'practice',topicId:'t',blocks}]});
// First fit in section order. A practice section starts a page unless its first block has exercisePageBreakBefore:false.
function paginator(heights,{issues=()=>[],extraPage=()=>0}={}){
 return async p=>{
  const pages=[];let current=null;
  const flush=()=>{if(current)pages.push(current);current=null;};
  for(const section of p.sections){
   if(!(section.phase==='practice'&&section.blocks[0]?.flow?.exercisePageBreakBefore===false))flush();
   for(const b of section.blocks){
    const h=heights[b.id]??10;
    if(current&&current.space.usedMm+h>CAPACITY)flush();
    if(!current)current={blocks:[],space:{capacityMm:CAPACITY,usedMm:0,remainingMm:CAPACITY},elements:[]};
    current.blocks.push(b);current.space.usedMm+=h;current.space.remainingMm=CAPACITY-current.space.usedMm;current.elements.push({id:b.id,kind:'question',h});
   }
  }
  flush();
  for(let i=0;i<extraPage(p);i++)pages.push({blocks:[{id:'ghost'+i}],space:{capacityMm:CAPACITY,usedMm:5,remainingMm:95},elements:[]});
  return {pages,issues:issues(p)};
 };
}
const ids=p=>p.sections[0].blocks.map(b=>b.id);
const HEIGHTS={A:55,B:55,C:45,D:40};
// A B C D: page 1 holds A, page 2 B and C, and D is alone on page 3. A gap of 45 mm is below gapMm 50, so the ordinary
// pull leaves it; the orphan pull moves D in front of B and the exercise takes two pages.
const four=()=>project([question('A',20),question('B',20),question('C',22),question('D',21)]);

test('orphanUnit finds the one unit alone on an exercise\'s last page',()=>{
 const units=describeUnits(four().sections[0]);
 const owned=new Set(['A','B','C','D']);
 const page=ids=>({blocks:ids.map(id=>({id}))});
 assert.equal(orphanUnit(units,[page(['A']),page(['B','C']),page(['D'])],owned).ids[0],'D');
 assert.equal(orphanUnit(units,[page(['A']),page(['B','C','D'])],owned),null,'two units share the last page');
 assert.equal(orphanUnit(units,[page(['D'])],owned),null,'a one-page exercise has no orphan');
 assert.equal(orphanUnit(units,[page(['A']),page(['D','elsewhere'])],owned),null,'content of another section is not an orphan');
});

test('a lone last question is pulled back by a band-limited reorder',async()=>{
 const result=await optimisePagination(four(),{paginate:paginator(HEIGHTS),gapMm:50});
 assert.deepEqual(ids(result.project),['A','D','B','C']);
 assert.equal(result.before.pages,3);assert.equal(result.after.pages,2);
 const move=result.moves.find(m=>m.type==='reorder');
 assert.equal(move.reason,'pulls the lone last question back');assert.deepEqual(move.blockIds,['D']);assert.deepEqual(move.jumped,['B','C']);
});

test('the orphan pull respects the difficulty band',async()=>{
 const far=project([question('A',20),question('B',20),question('C',22),question('D',55)]); // D is Mastery: two bands from Foundation
 const result=await optimisePagination(far,{paginate:paginator(HEIGHTS),gapMm:50});
 assert.deepEqual(ids(result.project),['A','B','C','D']);assert.equal(result.after.pages,3);
});

test('the orphan pull never separates a dependency',async()=>{
 const joined=project([question('A',20),question('B',20,{flow:{dependsOn:['D-root']}}),question('C',22),question('D',21)]);
 const result=await optimisePagination(joined,{paginate:paginator(HEIGHTS),gapMm:50});
 const order=ids(result.project);
 // B depends on D, so the two move as one unit and D can no longer jump in front of B on its own.
 const units=describeUnits(joined.sections[0]);
 assert.ok(units.some(u=>u.ids.includes('B')&&u.ids.includes('D')),'the dependency joins B, C and D');
 assert.ok(order.join('').includes('BCD'),'B, C and D stay together and in order');
});

test('a candidate with an oversized-content issue is rejected outright',async()=>{
 const issues=p=>ids(p).indexOf('D')<ids(p).indexOf('C')?[{kind:'oversized-content',id:'D',message:'Content has no safe page break.'}]:[];
 const result=await optimisePagination(four(),{paginate:paginator(HEIGHTS,{issues}),gapMm:50});
 assert.deepEqual(ids(result.project),['A','B','C','D'],'every reorder that fits has the issue');
 assert.equal(result.after.pages,3);
 assert.ok(result.rejected.some(r=>r.reason==='oversized-content'));
});

test('a candidate that adds a page is rejected',async()=>{
 const extraPage=p=>ids(p).indexOf('D')<ids(p).indexOf('C')?2:0;
 const result=await optimisePagination(four(),{paginate:paginator(HEIGHTS,{extraPage}),gapMm:50});
 assert.deepEqual(ids(result.project),['A','B','C','D']);
 assert.ok(result.rejected.some(r=>r.reason==='page-gain'));
});

// ---- exercise-break suggestions ----------------------------------------------------------------------------
const withTeaching=()=>project(null,[
 {id:'t0',phase:'teaching',topicId:'t',blocks:[{id:'T',type:'rich-text',content:'Teaching'}]},
 {id:'s1',phase:'practice',topicId:'t',blocks:[question('A',20),question('B',21)]},
 {id:'s2',phase:'practice',topicId:'u',blocks:[question('C',20)]},
]);
const BREAK_HEIGHTS={T:20,A:40,B:40,C:30};

test('a forced break after a page with 60 mm free is suggested, with the pages removing it would save',async()=>{
 const source=withTeaching(),before=JSON.stringify(source);
 const found=await suggestBreakRemovals(source,{paginate:paginator(BREAK_HEIGHTS)});
 assert.equal(JSON.stringify(source),before,'nothing is changed');
 assert.equal(found.length,1,'the second exercise follows a page with only 20 mm free');
 assert.deepEqual([found[0].sectionId,found[0].firstBlockId,found[0].freeMm,found[0].estPagesSaved,found[0].pageBefore],['s1','A',80,1,1]);
 // The estimate is the action the Studio button runs.
 const after=await paginator(BREAK_HEIGHTS)(setPageBoundary(source,'A','remove'));
 assert.equal(after.pages.length,2);
});

test('a break that saves no page is still reported, with an estimate of zero',async()=>{
 const heights={T:20,A:90,B:5,C:30};
 const found=await suggestBreakRemovals(withTeaching(),{paginate:paginator(heights),minFreeMm:60});
 assert.equal(found[0].estPagesSaved,0);
});

// ---- orphan pull that cannot fit, short tails of teaching blocks, break savings (23 October 2026 fixes) -------
test('an orphan that cannot fit is rejected without trials and says how far short it is',async()=>{
 // A, B and C leave 15 mm free in all; D (60 mm) cannot fit before it however they are ordered or tightened.
 const heights={A:95,B:95,C:95,D:60};
 let calls=0;const pg=paginator(heights);
 const result=await optimisePagination(project([question('A',20),question('B',20),question('C',22),question('D',21)]),{paginate:async(...a)=>{calls++;return pg(...a);},gapMm:50});
 assert.equal(result.after.pages,result.before.pages);
 const row=result.rejected.find(r=>r.reason==='orphan-no-fit');
 assert.ok(row,'the orphan was judged unable to fit');assert.ok(row.needMm>row.freeMm);
 assert.ok(!result.rejected.some(r=>r.label?.startsWith('orphan')&&r.reason==='not-better'),'no render was spent on it');
});

// A paginator with fragments: a teaching block with `parts` splits between its parts unless it is keepTogether,
// and the report carries flow.fragment and the part count of each slice, as the Studio callback does.
const PART=20;
function fragmenting(p){
 const pages=[];let current=null;
 const flush=()=>{if(current)pages.push(current);current=null;};
 const open=()=>{if(!current)current={blocks:[],space:{capacityMm:CAPACITY,usedMm:0,remainingMm:CAPACITY},elements:[]};return current;};
 const put=(page,entry,h)=>{page.blocks.push(entry);page.space.usedMm+=h;page.space.remainingMm=CAPACITY-page.space.usedMm;page.elements.push({id:entry.id,kind:'question',h});};
 for(const section of p.sections){
  if(section.phase==='practice')flush();
  for(const b of section.blocks){
   const parts=b.parts?.length;
   if(!parts){const h=b.h??10;if(current&&current.space.usedMm+h>CAPACITY)flush();put(open(),{id:b.id},h);continue;}
   const all=parts*PART;
   if(b.flow?.keepTogether){if(current&&current.space.usedMm+all>CAPACITY)flush();put(open(),{id:b.id,parts},all);continue;}
   let left=parts,fragment=0;
   while(left>0){
    const room=Math.floor((CAPACITY-(current?.space.usedMm??0))/PART),take=Math.min(left,Math.max(room,0));
    if(take===0){flush();continue;}
    put(open(),{id:b.id,parts:take,...(left<parts||take<left?{flow:{fragment}}:{})},take*PART);left-=take;fragment++;
    if(left>0)flush();
   }
  }
 }
 flush();
 return {pages,issues:[]};
}
const teachingBook=(after=[])=>({id:'fake',settings:{layoutOverrides:{}},studio:{flags:[]},sections:[
 {id:'t0',phase:'teaching',topicId:'t',blocks:[{id:'T',type:'rich-text',h:60},{id:'G',type:'question',pedagogyRole:'guided-practice',parts:[1,2,3,4],content:{id:'G-root',type:'question',prompt:'Guided'}},...after]},
 {id:'s1',phase:'practice',topicId:'t',blocks:[question('A',20)]},
]});
const fragmentingPaginate=async p=>fragmenting(p);

test('shortTailSplits finds a teaching block whose second page holds two parts or fewer',async()=>{
 const book=teachingBook(),map=await fragmentingPaginate(book);
 assert.deepEqual(shortTailSplits(map,book).map(s=>[s.id,s.tailParts]),[['G',2]]);
 assert.deepEqual(shortTailSplits(map,book,1),[],'a limit of one part leaves it');
});

test('a teaching block with a short tail is kept whole when that costs no page',async()=>{
 const result=await optimisePagination(teachingBook(),{paginate:fragmentingPaginate,gapMm:50});
 const block=result.project.sections[0].blocks.find(b=>b.id==='G');
 assert.equal(block.flow?.keepTogether,true);
 assert.equal(result.after.pages,result.before.pages,'no page gained');
 assert.ok(result.moves.some(m=>m.type==='keep-together'&&m.blockId==='G'&&m.tailParts===2));
});

test('a teaching block keeps its split when keeping it whole would add a page',async()=>{
 // Whole, G (80 mm) leaves page 1 with the 60 mm block alone and pushes the 50 mm block to a third page.
 const book=teachingBook([{id:'K',type:'rich-text',h:50}]);
 const result=await optimisePagination(book,{paginate:fragmentingPaginate,gapMm:50});
 assert.ok(!result.project.sections[0].blocks.find(b=>b.id==='G').flow?.keepTogether);
 assert.ok(result.rejected.some(r=>r.reason==='page-gain'&&/keep together G/.test(r.label)));
 assert.equal(result.moves.filter(m=>m.type==='keep-together').length,0);
});

test('a break that saves no whole page still reports the space it gives back',async()=>{
 // Exercise 1 (A 90, B 5) ends on page 2 with 5 mm used; removing its break pulls it onto the teaching page.
 const heights={T:20,A:90,B:5,C:30};
 const found=await suggestBreakRemovals(withTeaching(),{paginate:paginator(heights),minFreeMm:60});
 assert.equal(found.length,1);assert.equal(found[0].estPagesSaved,0);
 assert.ok(Number.isFinite(found[0].savedMm),'the saving is measured in mm');
});

// ---- grid of figure parts, accepted for the room it leaves on the exercise's last page (23 October 2026) -----------
test('a grid that leaves the last page 30 mm emptier is kept even when no page goes',async()=>{
 const graph=(id)=>({id,type:'part',prompt:'',answerSpaceMm:10,questionDiagrams:[{id:id+'-graph',format:'tikz',widthMm:70}],answer:{short:'1',worked:'1'}});
 const tall=question('G',30,{content:{id:'G-root',type:'question',prompt:'Determine each equation.',children:[graph('G-a'),graph('G-b'),graph('G-c'),graph('G-d')]}});
 const p=project([question('A',20),tall]);
 const pg=paginator({A:60});
 // G is 120 mm in one column and 60 mm in a grid; the page holds 100 mm, so G is alone on the last page either way.
 const paginate=async candidate=>{const g=candidate.sections[0].blocks.find(b=>b.id==='G');return paginator({A:60,G:g.content.layout==='grid'?60:120})(candidate);};
 const result=await optimisePagination(p,{paginate,gapMm:50});
 assert.equal(result.after.pages,result.before.pages);
 const move=result.moves.find(m=>m.type==='grid');
 assert.ok(move,'the grid was kept');assert.equal(move.blockId,'G');
 assert.equal(result.project.sections[0].blocks[1].content.layout,'grid');
 // A grid that does not leave the room is dropped.
 const flat=await optimisePagination(p,{paginate:async candidate=>pg(candidate).then(r=>r),gapMm:50});
 assert.ok(!flat.moves.some(m=>m.type==='grid'));
});
