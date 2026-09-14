import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {organiseExercises,answerFragments,exerciseLabelWidth,compactAnswerDisplay,answerDiagramStyle,answerDiagramSignature} from '../src/lib/booklet-exercises.js';
import {flowNumbers,exerciseNumbers,flowEditionSections} from '../src/lib/booklet-flow.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
import {measurementKeyFor} from '../src/lib/booklet-measurement.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
const q=(id,flow={})=>({id,type:'question',bankRef:{id},content:{id:id+'root',type:'question',children:['a','b'].map(label=>({id:id+label,type:'part',label,answer:{short:'$1$',worked:'$x=1$'}}))},flow});
const section=(id,topicId,blocks,phase='practice')=>({id,topicId,blocks,phase,title:phase,role:phase,pageBreakBefore:true});
const fixture=()=>normalizeEditableProject({id:'trial-test',settings:{paginationMode:'flexible'},topics:[{id:'t',title:'Topic'},{id:'u',title:'Next'}],sections:[section('a','t',[q('hard'),q('easy'),q('tie')]),section('teach','t',[{id:'teaching',type:'rich-text',content:'Method'}],'teaching'),section('b','t',[q('last')]),section('c','u',[q('next')])]});
const ratings={hard:{reasoningScore:70,difficulty:'Mastery'},easy:{reasoningScore:10,difficulty:'Foundation'},tie:{reasoningScore:10,difficulty:'Foundation'},last:{reasoningScore:1,difficulty:'Foundation'},next:{reasoningScore:20,difficulty:'Development'}};

test('a teaching-only topic retains an exercise destination without practice answers',()=>{
 const p=fixture();p.settings.exerciseOrganisation='topic';p.sections.splice(3,0,section('investigation','law',[{id:'law',type:'rich-text',content:'Investigate relative frequency.'}],'teaching'));
 assert.deepEqual(exerciseNumbers(p),{t:1,law:2,u:3});
 const student=flowEditionSections(p,'student'),law=student.find(s=>s.topicId==='law');assert.equal(law.exerciseNumber,2);assert.equal(law.blocks[0].flow.exerciseHeadingBefore,2);
 assert.ok(!flowEditionSections(p,'short').some(s=>s.topicId==='law'));
});
test('exercise sorting preserves teaching checkpoints, stable ties and source content',()=>{
 const source=fixture(),before=structuredClone(source),p=organiseExercises(source,ratings);
 assert.deepEqual(source,before);assert.deepEqual(p.sections[0].blocks.map(b=>b.id),['easy','tie','hard']);
 assert.equal(p.sections[1].blocks[0].id,'teaching');assert.equal(p.sections[2].blocks[0].id,'last');
 assert.deepEqual(flowNumbers(p),{easy:1,tie:2,hard:3,last:4,next:1});assert.deepEqual(exerciseNumbers(p),{t:1,u:2});
 assert.deepEqual(normalizeEditableProject(p).settings,p.settings);
});
test('sorting retains continuation chains and paired dependency groups',()=>{
 const p=fixture();p.sections[0].blocks=[q('hard'),q('more',{continuationOf:'hard'}),{...q('easy'),pairedBlockId:'tie'},q('tie')];
 const result=organiseExercises(p,{...ratings,more:ratings.hard});
 assert.deepEqual(result.sections[0].blocks.map(b=>b.id),['easy','tie','hard','more']);assert.equal(flowNumbers(result).more,flowNumbers(result).hard);
});
test('answer fragments retain nested labels and shared solution diagrams',()=>{
 const b=q('q');delete b.content.children[1].label;
 assert.equal(answerFragments(b)[1].content.children[0].label,'b');
 b.content.sharedSolutionDiagrams=[{id:'shared'}];assert.equal(answerFragments(b).length,1);
 assert.equal(exerciseLabelWidth([{...b,sourceOrder:12}]),8);
});
test('explicit columns fill left then right and flow between exercises',async()=>{
 const p=organiseExercises(fixture(),ratings);
 const measure=async page=>({height:Math.max(0,...page.columns.map(c=>c.length*20)),capacity:60});
 const r=await paginateFlow(p,'short',measure);
 assert.equal(r.issues.length,0);assert.equal(r.pages.length,2);
 assert.deepEqual(r.pages[0].columns.map(c=>c.map(e=>e.block.id)),[['easy','easy','tie'],['tie','hard','hard']]);
 assert.deepEqual(r.pages[1].columns[0].map(e=>e.section.exerciseNumber),[1,1,2]);
 const found=r.pages.flatMap(p=>p.columns.flat().map(e=>e.block.id+':'+e.block.flow.answerFragment));
 assert.equal(new Set(found).size,10);
});
test('compact measurements invalidate for settings and column assignment',()=>{
 const p=organiseExercises(fixture(),ratings),b=p.sections[0].blocks[0],entry={block:b,section:{topicTitle:'Topic',exerciseNumber:1},labelWidthMm:8};
 const page={section:{title:'Topic'},mode:'short',blocks:[b],columns:[[entry],[]]};
 const old=measurementKeyFor(p)(page);p.settings.compactAnswers.shortFontPt=8.5;assert.notEqual(measurementKeyFor(p)(page),old);
 const key=measurementKeyFor(p);assert.notEqual(key(page),key({...page,columns:[[],[entry]]}));
});
test('the existing flexible project remains opt-out',()=>{
 const p=JSON.parse(readFileSync('tests/fixtures/booklets/linear-flexible-settings.json'));
 assert.equal(normalizeEditableProject(p).settings.compactAnswers,undefined);assert.deepEqual(exerciseNumbers(p),{});
});

test('coordinate wrapping preserves pairs and nested fractions',()=>{
 assert.equal(compactAnswerDisplay('$A(1,12), B(3,4), \\frac{1}{2}$'),'$A(1,12),\\allowbreak  B(3,4),\\allowbreak  \\frac{1}{2}$');
 const currency='Amount per hour: \\$36; Call out fee: \\$58';assert.equal(compactAnswerDisplay(currency),currency);
});
test('a changed diagram cannot reuse stale answer presentation',()=>{
 const d={id:'d',code:'original'},style={widthMm:45,code:'calibrated',sourceSignature:answerDiagramSignature(d)},settings={diagramStyles:{short:{d:style}}};
 assert.equal(answerDiagramStyle(settings,'short',d),style);assert.equal(answerDiagramStyle(settings,'short',{...d,code:'edited maths'}),null);
});

test('trial question flow uses spare space without splitting a part',async()=>{
 const p=organiseExercises(fixture(),ratings);p.sections=[p.sections[0]];
 const measure=async page=>({height:page.blocks.reduce((sum,b)=>sum+b.content.children.length*30,0),capacity:100});
 const r=await paginateFlow(p,'student',measure);
 assert.equal(r.pages.length,2);
 assert.deepEqual(r.pages[0].blocks.map(b=>[b.id,b.content.children.length]),[['easy',2],['tie',1]]);
 assert.deepEqual(r.pages[1].blocks.map(b=>[b.id,b.content.children.length]),[['tie',1],['hard',2]]);
});

test('one exercise heading survives source sections, checkpoints and page fragments',async()=>{
 for(const joined of [false,true]){
  const p=organiseExercises(fixture(),ratings);
  p.sections.unshift(section('empty','t',[]));
  // Exercise starts on a new page even when stored sections are joined.
  p.sections.splice(1,0,section('intro','t',[{id:'intro-text',type:'rich-text',content:'Introduction'}],'teaching'));
  if(joined)p.sections.forEach(s=>s.pageBreakBefore=false);
  p.sections.find(s=>s.id==='b').blocks[0].flow.exerciseHeadingBefore=1; // stale derived metadata
  const before=structuredClone(p);
  for(const edition of ['student','with-short','with-worked','short','worked']){
   const sections=flowEditionSections(p,edition);
   for(const mode of new Set(sections.map(s=>s.mode))){
    const group=sections.filter(s=>s.mode===mode);
    assert.deepEqual(group.filter(s=>s.difficultyTitle).map(s=>s.difficultyTitle),['Exercise 1','Exercise 2']);
    assert.deepEqual(group.flatMap(s=>s.blocks).filter(b=>b.flow.exerciseHeadingBefore).map(b=>b.id),['easy','next']);
   }
  }
  const result=await paginateFlow(p,'student',async page=>({height:page.blocks.reduce((sum,b)=>sum+(b.content?.children?.length??1)*30,0),capacity:100}));
  const printed=result.pages.flatMap(page=>[
   ...(page.showDifficultyHeading&&page.section.difficultyTitle?[page.section.difficultyTitle]:[]),
   ...page.blocks.filter(b=>b.flow.exerciseHeadingBefore&&!(page.showDifficultyHeading&&page.section.difficultyTitle===`Exercise ${b.flow.exerciseHeadingBefore}`)).map(b=>`Exercise ${b.flow.exerciseHeadingBefore}`)
  ]);
  assert.deepEqual(printed,['Exercise 1','Exercise 2']);
  for(const page of result.pages)for(const [index,block] of page.blocks.entries())if(block.flow.exerciseHeadingBefore)assert.equal(index,0,'Exercise starts at the top of a page');
  assert.deepEqual(p,before,'heading derivation must not change stored questions or layouts');
 }
});

test('every active compact booklet derives exactly one question heading per exercise',()=>{
 for(const file of readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){
  const p=JSON.parse(readFileSync(`booklets/projects/${file}`));
  if(p.settings.exerciseOrganisation!=='topic')continue;
  const expected=Object.values(exerciseNumbers(p));
  const practiceTopics=new Set(p.sections.filter(s=>s.phase==='practice').map(s=>s.topicId));
  const practiceExpected=Object.entries(exerciseNumbers(p)).filter(([id])=>practiceTopics.has(id)).map(([,n])=>n);
  for(const edition of ['student','with-short','with-worked']){
   const sections=flowEditionSections(p,edition).filter(s=>s.mode==='student');
   assert.deepEqual(sections.filter(s=>s.difficultyTitle).map(s=>s.difficultyTitle),practiceExpected.map(n=>`Exercise ${n}`),`${file}: ${edition}`);
   assert.deepEqual(sections.flatMap(s=>s.blocks).map(b=>b.flow.exerciseHeadingBefore).filter(Boolean),expected);
  }
 }
});
