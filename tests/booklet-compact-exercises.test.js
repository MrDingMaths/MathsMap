import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {organiseExercises,answerFragments,exerciseLabelWidth,compactAnswerDisplay,answerDiagramStyle,answerDiagramSignature} from '../src/lib/booklet-exercises.js';
import {flowNumbers,exerciseNumbers} from '../src/lib/booklet-flow.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
import {measurementKeyFor} from '../src/lib/booklet-measurement.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
const q=(id,flow={})=>({id,type:'question',bankRef:{id},content:{id:id+'root',type:'question',children:['a','b'].map(label=>({id:id+label,type:'part',label,answer:{short:'$1$',worked:'$x=1$'}}))},flow});
const section=(id,topicId,blocks,phase='practice')=>({id,topicId,blocks,phase,title:phase,role:phase,pageBreakBefore:true});
const fixture=()=>normalizeEditableProject({id:'trial-test',settings:{paginationMode:'flexible'},topics:[{id:'t',title:'Topic'},{id:'u',title:'Next'}],sections:[section('a','t',[q('hard'),q('easy'),q('tie')]),section('teach','t',[{id:'teaching',type:'rich-text',content:'Method'}],'teaching'),section('b','t',[q('last')]),section('c','u',[q('next')])]});
const ratings={hard:{reasoningScore:70,difficulty:'Mastery'},easy:{reasoningScore:10,difficulty:'Foundation'},tie:{reasoningScore:10,difficulty:'Foundation'},last:{reasoningScore:1,difficulty:'Foundation'},next:{reasoningScore:20,difficulty:'Development'}};
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
 const p=JSON.parse(readFileSync('booklets/archives/2026-09-08-linear-relationships/projects/linear-relationships-flexible-v1.json'));
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
