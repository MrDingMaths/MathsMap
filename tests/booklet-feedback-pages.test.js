import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {boundaryPages,selectFeedbackPages,inspectionPlan,deriveCombinedSelection,answerSignature,overrideTouchesDiagramInputs,diagramInputUrls,tikzDelta,parseOverrides} from '../scripts/booklet/check-feedback-pages.mjs';
import {diagramInputFiles} from '../scripts/booklet/render-cache-server.mjs';
import {requireBoundedDevelopmentExport} from '../scripts/booklet/page-review.mjs';

const pages=(count,{answersFrom=Infinity,changed=[],mode='short'}={})=>Array.from({length:count},(_,i)=>({page:i+1,blocks:['b'+(i+1)],hash:changed.includes(i+1)?'new'+(i+1):'h'+(i+1),isAnswer:i+1>=answersFrom,isCover:i===0,answerSectionStart:i+1===answersFrom,mode:i+1>=answersFrom?mode:'student'}));

test('question editions select changed pages and pagination neighbours only',()=>{
 const result=selectFeedbackPages({before:pages(12),after:pages(12,{changed:[5,9]}),edition:'student'});
 assert.deepEqual(result.changed,[5,9]);assert.deepEqual(result.boundaries,[]);assert.deepEqual(result.selected,[4,5,6,8,9,10]);
 assert.deepEqual(selectFeedbackPages({before:pages(12),after:pages(12),edition:'student'}).selected,[]);
 assert.deepEqual(selectFeedbackPages({before:pages(12),after:pages(12),edition:'student',extra:[7,99]}).selected,[7]);
 // A deleted tail is checked at the new final page.
 assert.deepEqual(selectFeedbackPages({before:pages(12),after:pages(10),edition:'student'}).selected,[9,10]);
});

test('combined editions add their composition boundary when anything changed',()=>{
 const before=pages(14,{answersFrom:11}),after=pages(14,{answersFrom:11,changed:[5,12]});
 assert.deepEqual(boundaryPages(after),[10,11]);
 const result=selectFeedbackPages({before,after,edition:'with-short'});
 assert.deepEqual(result.selected,[4,5,6,10,11,12,13]);
 assert.deepEqual(selectFeedbackPages({before,after:before,edition:'with-short'}).selected,[],'unchanged combined editions print nothing');
 assert.deepEqual(boundaryPages(pages(8)),[]);
});

test('combined body pages are inspected once in the question layout; boundaries and answers stay local',()=>{
 const student=pages(10,{changed:[5]}),combined=pages(14,{answersFrom:11,changed:[5,12]});
 const plan=inspectionPlan({edition:'with-short',selected:[4,5,6,10,11,12,13],boundaries:[10,11],pages:combined,studentPages:student,studentSelected:[4,5,6]});
 assert.deepEqual(plan.filter(p=>p.inspectIn==='student').map(p=>p.page),[4,5,6]);
 assert.deepEqual(plan.filter(p=>p.inspectIn==='with-short').map(p=>p.page),[10,11,12,13]);
 // A body page that changed only in the combined edition has no question-side inspection to reuse.
 const lone=inspectionPlan({edition:'with-short',selected:[7,8,9],pages:combined,studentPages:student,studentSelected:[4,5,6]});
 assert.ok(lone.every(p=>p.inspectIn==='with-short'));
 assert.ok(inspectionPlan({edition:'student',selected:[4,5,6],pages:student,studentPages:student,studentSelected:[4,5,6]}).every(p=>p.inspectIn==='student'));
});

test('whole-edition selections and missing baselines stop before export',()=>{
 const after=pages(6,{changed:[1,2,3,4,5,6]}),selection=selectFeedbackPages({before:pages(6),after,edition:'student'});
 assert.throws(()=>requireBoundedDevelopmentExport({projectId:'p',edition:'student',hasBaseline:true,selectedPages:selection.selected.length,totalPages:after.length}),/selected all 6 pages/);
 assert.throws(()=>requireBoundedDevelopmentExport({projectId:'p',edition:'student',hasBaseline:false}),/No page baseline/);
 assert.doesNotThrow(()=>requireBoundedDevelopmentExport({projectId:'p',edition:'student',hasBaseline:true,selectedPages:6,totalPages:6,reason:'Global header change'}));
});

test('overriding a diagram input disables diagram cache reuse for that pass',async()=>{
 const urls=diagramInputUrls(await diagramInputFiles());
 assert.ok(urls.includes('/src/lib/tikz.js'));assert.ok(urls.includes('/libs/maths-editor/house-style.mjs'));assert.ok(urls.some(url=>url.startsWith('/libs/tikzjax/')));
 assert.equal(overrideTouchesDiagramInputs(['**/src/lib/diagram-typography.js'],urls),true);
 assert.equal(overrideTouchesDiagramInputs(['**/libs/maths-editor/house-style.mjs'],urls),true);
 assert.equal(overrideTouchesDiagramInputs(['**/libs/maths-editor/document-model.mjs'],urls),false);
 assert.equal(overrideTouchesDiagramInputs([],urls),false);
 assert.throws(()=>parseOverrides(['no-file']),/URL_GLOB=FILE/);
 assert.deepEqual(parseOverrides(['**/a.mjs='+path.resolve('package.json')]),[{glob:'**/a.mjs',file:path.resolve('package.json')}]);
});

test('diagram counters report per-edition deltas including server hits',()=>{
 assert.deepEqual(tikzDelta({compiles:150,memoryHits:10,idbHits:0,serverHits:4,driverHits:0,failures:0},{compiles:154,memoryHits:40,idbHits:0,serverHits:9,driverHits:0,failures:0}),{compiles:4,memoryHits:30,idbHits:0,serverHits:5,driverHits:0,failures:0});
 assert.deepEqual(tikzDelta(null,null),{compiles:0,memoryHits:0,idbHits:0,serverHits:0,driverHits:0,failures:0});
});

test('combined editions without their own baseline follow the question selection and boundaries',()=>{
 const student=pages(10),combined=pages(14,{answersFrom:11});
 const derived=deriveCombinedSelection({pages:combined,studentPages:student,studentSelected:[4,5,6]});
 assert.deepEqual(derived.selected,[4,5,6,10,11]);assert.deepEqual(derived.boundaries,[10,11]);assert.equal(derived.derivedFrom,'student');
 assert.deepEqual(deriveCombinedSelection({pages:combined,studentPages:student,studentSelected:[]}).selected,[]);
 const plan=inspectionPlan({edition:'with-short',...derived,pages:combined,studentPages:student,studentSelected:[4,5,6]});
 assert.deepEqual(plan.filter(p=>p.inspectIn==='with-short').map(p=>p.page),[10,11]);
 // A body that paginates differently from the question edition needs its own baseline.
 assert.throws(()=>deriveCombinedSelection({pages:pages(15,{answersFrom:12}),studentPages:student,studentSelected:[4]}),/--baseline-editions all/);
 const moved=structuredClone(combined);moved[4].blocks=['other'];
 assert.throws(()=>deriveCombinedSelection({pages:moved,studentPages:student,studentSelected:[4]}),/--baseline-editions all/);
});

test('answer changes are detected separately from question-side edits',()=>{
 const project={settings:{compactAnswers:{columns:2}},sections:[{blocks:[{id:'q',content:{id:'q',prompt:'Find x.',answer:{short:'3',worked:'x=3'},children:[{id:'q-a',prompt:'Part',answer:{short:'4'}}]}}]}]};
 const prompt=structuredClone(project);prompt.sections[0].blocks[0].content.prompt='Solve for x.';
 assert.equal(answerSignature(prompt),answerSignature(project));
 const nested=structuredClone(project);nested.sections[0].blocks[0].content.children[0].answer.short='5';
 assert.notEqual(answerSignature(nested),answerSignature(project));
 const layout=structuredClone(project);layout.settings.compactAnswers.columns=1;
 assert.notEqual(answerSignature(layout),answerSignature(project));
});
