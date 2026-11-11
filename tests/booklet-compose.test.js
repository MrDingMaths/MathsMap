import test from 'node:test';
import assert from 'node:assert/strict';
import {composeBooklet,lessonsOf,lessonBoundaries,snapUp,composeMetrics,compareMetrics,diagramSideCredits,fillPages,isMixedReview,topicsOf,gridColumnsFor,workedColumnsFor,clearSourceBreaks} from '../src/lib/booklet-compose.js';

const CAPACITY=100;
const deepFreeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);Object.values(v).forEach(deepFreeze);}return v;};
const teach=(id,role,extra={})=>({id,type:role==='example'?'worked-example':'rich-text',pedagogyRole:role,content:'x',...extra});
const tq=(id,role,space=10,extra={})=>({id,type:'question',pedagogyRole:role,content:{id:id+'-root',type:'question',prompt:'P',answer:{worked:'x'},answerSpaceMm:space},...extra});
const pq=(id,space=10,score=20,extra={})=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'Q',answer:{worked:'x'},answerSpaceMm:space,...(extra.content??{})},flow:{localDifficulty:{reasoningScore:score},...(extra.flow??{})}});
const book=(sections,settings={})=>deepFreeze({id:'fake',settings:{layoutOverrides:{},...settings},studio:{flags:[]},topics:sections.filter(s=>s.title).map(s=>({id:s.topicId,title:s.title})),sections});

// A fake paginator: heights by id plus each leaf's allowance; a new page at a topic change, an exercise start, a
// manual break or a page-break block; keepWithNext chains move together; a question taller than a page splits.
function fake(base){
 const leafSpace=(p,b)=>{let t=0;const v=n=>{if(!n||typeof n!=='object')return;if(n.children?.length)n.children.forEach(v);else if(n.answer)t+=p.settings.layoutOverrides.answerSpaces?.[n.id]??n.answerSpaceMm??0;};v(b.content);return t;};
 const paginate=async p=>{
  const pages=[];let current=null,topic;
  const open=()=>{current={blocks:[],space:{capacityMm:CAPACITY,usedMm:0,remainingMm:CAPACITY}};pages.push(current);};
  let pendingBreak=false;
  const units=[];
  for(const s of p.sections){
   s.blocks.forEach((b,i)=>{
    if(b.type==='page-break'){pendingBreak=true;return;}
    const starts=s.topicId!==topic||pendingBreak||b.flow?.pageBreakBefore||i===0&&s.phase==='practice'&&b.flow?.exercisePageBreakBefore!==false;
    topic=s.topicId;pendingBreak=false;
    const h=(base[b.id]??10)+leafSpace(p,b);
    const last=units.at(-1);
    if(last&&last.blocks.at(-1).flow?.keepWithNext&&!starts){last.blocks.push(b);last.h+=h;}
    else units.push({blocks:[b],h,starts});
   });
  }
  for(const u of units){
   if(!current||u.starts)open();
   if(current.space.usedMm+u.h>CAPACITY&&current.blocks.length)open();
   if(u.h>CAPACITY&&u.blocks.length===1&&u.blocks[0].type==='question'){
    const b=u.blocks[0];current.blocks.push({id:b.id,flow:{fragment:0}});current.space.usedMm=CAPACITY;current.space.remainingMm=0;
    open();current.blocks.push({id:b.id,flow:{fragment:1}});current.space.usedMm=u.h-CAPACITY;current.space.remainingMm=CAPACITY-current.space.usedMm;continue;
   }
   for(const b of u.blocks)current.blocks.push({id:b.id,flow:{}});
   current.space.usedMm+=u.h;current.space.remainingMm=CAPACITY-current.space.usedMm;
  }
  return {pages,issues:[]};
 };
 return paginate;
}
const pagesOf=async(p,base)=>(await fake(base)(p,{})).pages.map(pg=>pg.blocks.map(b=>b.id));

test('snapUp rounds to house steps',()=>{
 assert.deepEqual([0,5,7,9,11,13,16,22,41,44].map(snapUp),[0,6,8,10,12,15,20,25,45,45]);
});

test('lessons open at theory after a lesson-closing block; review opens its lesson',()=>{
 const blocks=[teach('r','review'),teach('d1','definition'),teach('e1','example'),tq('g1','guided-practice'),tq('k1','key-ideas'),teach('d2','definition'),teach('e2','example'),teach('d3','definition'),tq('g2','guided-practice')];
 const lessons=lessonsOf(blocks);
 assert.deepEqual(lessons.map(l=>l.ids),[['r','d1','e1','g1','k1'],['d2','e2','d3','g2']]);
 assert.deepEqual(lessonBoundaries(lessons[0]),[3,2]);
});

test('a new lesson that would split starts a page instead',async()=>{
 const base={d1:30,e1:30,k1:10,d2:15,e2:40};
 const p=book([{id:'t1',phase:'teaching',topicId:'a',blocks:[teach('d1','definition'),teach('e1','example'),tq('k1','key-ideas',0),teach('d2','definition'),teach('e2','example')]}]);
 assert.deepEqual(await pagesOf(p,base),[['d1','e1','k1','d2'],['e2']]);
 const out=await composeBooklet(p,{paginate:fake(base),phases:['starts','lessons']});
 assert.deepEqual(await pagesOf(out.project,base),[['d1','e1','k1'],['d2','e2']]);
 assert.ok(out.changes.some(c=>c.kind==='page-break'&&c.blockId==='d2'));
 assert.equal(out.after.splitLessons,0);
});

test('a lesson that cannot fit splits before its guided practice, never leaving key ideas alone',async()=>{
 const base={d:45,e:30,g:20,k:15};
 const p=book([{id:'t1',phase:'teaching',topicId:'a',blocks:[teach('d','definition'),teach('e','example'),tq('g','guided-practice',0),tq('k','key-ideas',0)]}]);
 assert.deepEqual(await pagesOf(p,base),[['d','e','g'],['k']]);
 const out=await composeBooklet(p,{paginate:fake(base),phases:['lessons']});
 assert.deepEqual(await pagesOf(out.project,base),[['d','e'],['g','k']]);
 const m=composeMetrics(out.project,await fake(base)(out.project,{}));
 assert.equal(m.splitLessons,1,'split at the best boundary costs 1');
});

test('working space beside a left-aligned diagram becomes 0 mm',()=>{
 const block={id:'q',type:'question',content:{id:'q-root',type:'question',prompt:'Find x.',answer:{worked:'x=3'},answerSpaceMm:30,questionDiagrams:[{id:'q-d',widthMm:55,heightMm:45}]},sourceReview:{workingSpaceEstimate:{estimates:[{targetId:'q-root',answerSpaceMm:30}]}}};
 const p=book([{id:'s',phase:'practice',topicId:'a',blocks:[block]}]);
 const {project,changes}=diagramSideCredits(p,['q']);
 assert.equal(changes.length,1);
 const node=project.sections[0].blocks[0].content;
 assert.equal(node.answerSpaceMm,0);assert.equal(node.questionDiagrams[0].align,'left');
 // Too wide a diagram, or one beside the prompt, keeps its working space.
 const wide=book([{id:'s',phase:'practice',topicId:'a',blocks:[{...block,content:{...block.content,questionDiagrams:[{id:'q-d',widthMm:140,heightMm:60}]}}]}]);
 assert.equal(diagramSideCredits(wide,['q']).changes.length,0);
 const beside=book([{id:'s',phase:'practice',topicId:'a',blocks:[{...block,content:{...block.content,diagramPlacement:'beside-prompt'}}]}]);
 assert.equal(diagramSideCredits(beside,['q']).changes.length,0);
 // A value changed since import (the teacher's) is never credited away.
 const teacher=book([{id:'s',phase:'practice',topicId:'a',blocks:[{...block,content:{...block.content,answerSpaceMm:25}}]}]);
 assert.equal(diagramSideCredits(teacher,['q']).changes.length,0);
});

test('fill shares trailing space without moving any block',async()=>{
 const base={a:10,b:10,c:60};
 const p=book([{id:'s',phase:'practice',topicId:'x',blocks:[pq('a',20),pq('b',20),pq('c',20)]}]);
 const map=await fake(base)(p,{});
 assert.deepEqual(map.pages.map(pg=>pg.blocks.map(b=>b.id)),[['a','b'],['c']]);
 const out=await fillPages(p,map,{paginate:fake(base)});
 const after=out.project.sections[0].blocks.map(b=>b.content.answerSpaceMm);
 assert.deepEqual(after.slice(0,2),[30,30],'each grows to its 1.5x cap');
 assert.equal(after[2],20,'the last page is not filled');
 assert.deepEqual(await pagesOf(out.project,base),[['a','b'],['c']]);
});

test('fill backs off when growth would push a block over',async()=>{
 const base={a:30,b:30};
 const p=book([{id:'s',phase:'practice',topicId:'x',blocks:[pq('a',10),pq('b',10),pq('z',10)]}]);
 // a+b = 80 on page 1 (20 free); z would not fit (20+10 > 20) so it is on page 2.
 const map=await fake({...base,z:50})(p,{});
 const out=await fillPages(p,map,{paginate:fake({...base,z:50})});
 assert.deepEqual(await pagesOf(out.project,{...base,z:50}),[['a','b'],['z']]);
 for(const b of out.project.sections[0].blocks.slice(0,2))assert.ok(b.content.answerSpaceMm<=15);
});

test('a mixed-review exercise flows on after its repeated theory; others keep their break',async()=>{
 const mixed={topicId:'m',teaching:[teach('d','definition')],practice:[{blocks:[pq('q')]}]};
 const taught={topicId:'n',teaching:[teach('d','definition'),teach('e','example')],practice:[{blocks:[pq('q')]}]};
 assert.equal(isMixedReview(mixed),true);assert.equal(isMixedReview(taught),false);
 const p=book([
  {id:'t1',phase:'teaching',topicId:'m',title:'Mixed review',blocks:[teach('d','definition')]},
  {id:'p1',phase:'practice',topicId:'m',blocks:[pq('q1')]},
  {id:'t2',phase:'teaching',topicId:'n',title:'Volume',blocks:[teach('d2','definition'),teach('e2','example')]},
  {id:'p2',phase:'practice',topicId:'n',blocks:[pq('q2')]},
 ]);
 const out=await composeBooklet(p,{paginate:fake({}),phases:['starts']});
 const flow=id=>out.project.sections.flatMap(s=>s.blocks).find(b=>b.id===id).flow;
 assert.equal(flow('q1').exercisePageBreakBefore,false);
 assert.notEqual(flow('q2').exercisePageBreakBefore,false);
});

test('part grids follow the longest prompt; four parts are 2 x 2',()=>{
 const q=prompts=>({id:'q',type:'question',content:{id:'r',children:prompts.map((prompt,i)=>({id:'p'+i,prompt,answer:{short:'1'}}))}});
 assert.equal(gridColumnsFor(q(['2+3','4+5','6+7','1+1','2+2','3+3'])),4);
 assert.equal(gridColumnsFor(q(['2+3','4+5','6+7','1+1'])),2);
 assert.equal(gridColumnsFor(q(['Simplify the expression 3x + 4x - 2','Simplify 5a - 2a + 7 and state the coefficient','Expand and simplify 2(x+3)'])),2);
 assert.equal(gridColumnsFor(q(['x'.repeat(100),'y','z'])),null);
 const cloze=width=>({format:'maths-editor-document-v1',version:1,blocks:[{type:'paragraph',inlines:[{type:'cloze',answer:'a',width}]}]});
 assert.equal(gridColumnsFor(q([cloze(92),cloze(92),cloze(92),cloze(92)])),null,'a 92 mm cloze needs the full width');
 assert.equal(gridColumnsFor(q([cloze(30),cloze(30),cloze(30)])),3);
});

test('worked examples get one column each when their lines are short',()=>{
 const w=(n,line)=>({type:'worked-example',presentation:{layout:'columns',columns:1},examples:Array.from({length:n},()=>({prompt:'Solve',steps:[{working:line}]}))});
 assert.equal(workedColumnsFor(w(2,'2x = 6')),2);
 assert.equal(workedColumnsFor(w(3,'x'.repeat(60))),null);
 assert.equal(workedColumnsFor(w(1,'x')),null);
});

test('source page boundaries inside a topic are cleared, section starts kept',()=>{
 const p=structuredClone({sections:[{id:'t',phase:'teaching',topicId:'a',blocks:[{id:'a1',flow:{sourcePageBreakBefore:true}},{id:'a2',flow:{sourcePageBreakBefore:true}},{id:'a3',flow:{sourcePageBreakBefore:true,pageBreakBefore:true}}]}]});
 assert.deepEqual(clearSourceBreaks(p),['a2']);
});

test('the objective ranks split questions, then lessons, then half-empty pages, then pages',()=>{
 assert.equal(compareMetrics({splitQuestions:0,splitLessons:5,halfEmpty:3,pages:9},{splitQuestions:1,splitLessons:0,halfEmpty:0,pages:1}),-1);
 assert.equal(compareMetrics({splitQuestions:0,splitLessons:0,halfEmpty:1,pages:4},{splitQuestions:0,splitLessons:0,halfEmpty:0,pages:5}),1);
 assert.equal(compareMetrics({splitQuestions:0,splitLessons:0,halfEmpty:0,pages:4},{splitQuestions:0,splitLessons:0,halfEmpty:0,pages:4}),0);
});

test('the pass never writes to its input and reports before and after',async()=>{
 const p=book([{id:'t1',phase:'teaching',topicId:'a',blocks:[teach('d','definition'),tq('k','key-ideas',0)]},{id:'p1',phase:'practice',topicId:'a',blocks:[pq('q1',20),pq('q2',20)]}]);
 const out=await composeBooklet(p,{paginate:fake({d:30,k:10,q1:10,q2:10})});
 assert.ok(out.before&&out.after);assert.ok(Array.isArray(out.changes));
 assert.ok(topicsOf(out.project).length===1);
});

test('a split question that fits a page moves whole to the next page',async()=>{
 const base={a:60,q:10};
 const p=book([{id:'p1',phase:'practice',topicId:'x',blocks:[pq('a',0),pq('q',50)]}]);
 // The fake splits only taller-than-a-page questions, so emulate a split: q is 60 tall, a+q = 120.
 const paginate=async(project,f)=>{const r=await fake(base)(project,f);const qb=project.sections[0].blocks[1];if(!qb.flow?.keepTogether){r.pages=[{blocks:[{id:'a',flow:{}},{id:'q',flow:{fragment:0}}],space:{capacityMm:100,usedMm:100,remainingMm:0}},{blocks:[{id:'q',flow:{fragment:1}}],space:{capacityMm:100,usedMm:20,remainingMm:80}}];}return r;};
 const out=await composeBooklet(p,{paginate,phases:['questions']});
 assert.ok(out.changes.some(c=>c.kind==='keep-together'&&c.blockId==='q'));
 assert.equal(out.after.splitQuestions,0);
});

test('a grid that pushes columns past the margin or over each other is rejected, not applied',async()=>{
 const parts=['2+3','4+5','6+7','1+1','2+2','3+3'].map((prompt,i)=>({id:'p'+i,prompt,answer:{short:'1'}}));
 const p=book([{id:'p1',phase:'practice',topicId:'n',title:'T',blocks:[{id:'q',type:'question',flow:{localDifficulty:{reasoningScore:20}},content:{id:'q-root',type:'question',children:parts}}]}]);
 const gridded=project=>project.sections[0].blocks[0].content.layout==='grid';
 const run=async fault=>{
  const base=fake({});
  const paginate=async(project,f)=>{const r=await base(project,f);r.layoutFaults=gridded(project)&&fault?[{id:'q',kind:fault,message:'x'}]:[];return r;};
  return composeBooklet(p,{paginate,phases:['layout']});
 };
 for(const fault of ['margin-overflow','column-overlap']){
  const out=await run(fault);
  assert.ok(!out.changes.some(c=>c.kind==='grid'),fault+' kept the grid');
  assert.ok(out.rejected.some(r=>r.reason==='layout-fault'&&r.faults[0].kind===fault),fault+' not reported');
 }
 const clean=await run(null);
 assert.ok(clean.changes.some(c=>c.kind==='grid'),'a clean grid is still applied');
});

test('a fault the booklet already had does not block a grid',async()=>{
 const parts=['2+3','4+5','6+7','1+1','2+2','3+3'].map((prompt,i)=>({id:'p'+i,prompt,answer:{short:'1'}}));
 const p=book([{id:'p1',phase:'practice',topicId:'n',title:'T',blocks:[{id:'q',type:'question',flow:{localDifficulty:{reasoningScore:20}},content:{id:'q-root',type:'question',children:parts}}]}]);
 const base=fake({});
 const paginate=async(project,f)=>{const r=await base(project,f);r.layoutFaults=[{id:'q',kind:'margin-overflow',message:'x'}];return r;};
 const out=await composeBooklet(p,{paginate,phases:['layout']});
 assert.ok(out.changes.some(c=>c.kind==='grid'));
});
