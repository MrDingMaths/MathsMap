import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {boundaryPages,selectFeedbackPages,selectBlockPages,inspectionPlan,deriveCombinedSelection,answerSignature,overrideTouchesDiagramInputs,diagramInputUrls,tikzDelta,parseOverrides,selectDenseFeedbackPages,finalizeFeedbackReport} from '../scripts/booklet/check-feedback-pages.mjs';
import {diagramInputFiles} from '../scripts/booklet/render-cache-server.mjs';
import {requireBoundedDevelopmentExport} from '../scripts/booklet/page-review.mjs';
import {survivingRepairBlocks} from '../scripts/booklet/check-feedback-pages.mjs';
import {feedbackDevelopmentReason} from '../scripts/booklet/check-feedback-pages.mjs';
import {feedbackFailureMessage,withFeedbackFailureDiagnostic} from '../scripts/booklet/check-feedback-pages.mjs';
import {feedbackArguments} from '../scripts/booklet/shared-render-runner.mjs';
import {partitionFeedbackPageIssues} from '../scripts/booklet/check-feedback-pages.mjs';

test('bounded maintenance retains unrelated QA as history without hiding affected or neighbour failures',()=>{
 const qa=Array.from({length:6},()=>({issues:[]}));
 qa[1].issues=[{kind:'overflow'}];qa[2].issues=[{kind:'clipping'}];qa[5].issues=[{kind:'booklet-palette',id:'unchanged-exam'}];
 const result=partitionFeedbackPageIssues(qa,{selected:[2,3,4],bounded:true});
 assert.deepEqual(result.issues,[{page:2,kind:'overflow'},{page:3,kind:'clipping'}]);
 assert.deepEqual(result.offScopeIssues,[{page:6,kind:'booklet-palette',id:'unchanged-exam'}]);
 for(const options of [{selected:[2,3,4]},{bounded:true,checksOnly:true}]){
  const full=partitionFeedbackPageIssues(qa,options);assert.equal(full.issues.length,3);assert.deepEqual(full.offScopeIssues,[]);
 }
 assert.equal(partitionFeedbackPageIssues(qa,{bounded:true}).offScopeIssues.length,3);
});

test('failure diagnostics preserve successes and the original exception if capture fails',async()=>{
 let captures=0;
 assert.equal(await withFeedbackFailureDiagnostic(async()=>42,async()=>{captures++;}),42);
 assert.equal(captures,0);
 const original=new Error('Pagination timed out');
 await assert.rejects(withFeedbackFailureDiagnostic(async()=>{throw original;},async()=>{throw Error('Diagnostic capture failed');}),error=>error===original);
});

test('pagination failure reports the actual workspace error and keeps its cause',async()=>{
 const original=new Error('Pagination failed'),snapshot={workspaceAlerts:[{text:'Diagram source could not be rendered'}],alerts:[{text:'Unrelated notice'}]};
 await assert.rejects(withFeedbackFailureDiagnostic(async()=>{throw original;},async error=>feedbackFailureMessage(error,snapshot)),error=>error.cause===original&&error.message==='Pagination failed: Diagram source could not be rendered'&&error.stack.includes(original.stack.split('\n')[1]));
 assert.equal(feedbackFailureMessage(original,{alerts:snapshot.alerts}),'Pagination failed');
 assert.equal(feedbackFailureMessage(new Error('Specific failure'),snapshot),'Specific failure');
});

test('queued full-edition justification reaches the checker guard through its documented flag',()=>{
 const reason='Both compact Short pages are the minimal affected selection for the reviewed additions';
 const args=feedbackArguments({root:process.cwd()},{projectId:'p',blocks:['new'],allowedPaths:['/sections/0/blocks'],editions:['short'],checksOnly:[],fullDevelopmentReason:reason},{candidate:'candidate.json',baseline:'before.json'},1234,'output');
 assert.equal(feedbackDevelopmentReason(args),reason);
 assert.doesNotThrow(()=>requireBoundedDevelopmentExport({projectId:'p',edition:'short',hasBaseline:true,selectedPages:2,totalPages:2,reason:feedbackDevelopmentReason(args)}));
 assert.equal(feedbackDevelopmentReason(['--full-reason',reason]),reason);
 assert.equal(feedbackDevelopmentReason(['--full-reason','legacy','--full-development-reason',reason]),reason);
 for(const missing of [[],['--full-development-reason']])assert.throws(()=>requireBoundedDevelopmentExport({projectId:'p',edition:'short',hasBaseline:true,selectedPages:2,totalPages:2,reason:feedbackDevelopmentReason(missing)}),/selected all 2 pages/);
});

test('scoped deletion keeps mutation ownership without rendering a removed duplicate',()=>{
 const project=ids=>({sections:[{blocks:ids.map(id=>({id}))}]});
 assert.deepEqual(survivingRepairBlocks(project(['table']),project(['table','detached']),['table','detached']),['table']);
 assert.deepEqual(survivingRepairBlocks(project(['table']),project(['table','detached']),['table','typo']),['table','typo'],'unknown target must still fail structural checks');
 assert.deepEqual(survivingRepairBlocks(project(['table']),null,['table','detached']),['table','detached'],'a deletion needs its before-snapshot');
});

const pages=(count,{answersFrom=Infinity,changed=[],mode='short'}={})=>Array.from({length:count},(_,i)=>({page:i+1,blocks:['b'+(i+1)],hash:changed.includes(i+1)?'new'+(i+1):'h'+(i+1),isAnswer:i+1>=answersFrom,isCover:i===0,answerSectionStart:i+1===answersFrom,mode:i+1>=answersFrom?mode:'student'}));
test('export reports fail closed for empty, missing and interrupted editions',()=>{
 const report=()=>({editions:['student'],checksOnly:['worked'],editionsReport:{},completedEditions:[],failures:[]});
 const empty=finalizeFeedbackReport(report());
 assert.equal(empty.passed,false);assert.deepEqual(empty.failures[0].missing,['student','worked']);
 const none=report();none.editions=[];none.checksOnly=[];
 assert.equal(finalizeFeedbackReport(none).passed,false);
 const partial=report();partial.editionsReport.student={pageCount:2};partial.completedEditions=['student'];
 assert.equal(finalizeFeedbackReport(partial).passed,false);assert.deepEqual(partial.failures[0].missing,['worked']);
 const interrupted=report();interrupted.editionsReport={student:{pageCount:2},worked:{pageCount:1}};
 interrupted.completedEditions=['student'];interrupted.failures.push({kind:'exception',message:'Pagination failed',stack:'retained diagnostic'});
 assert.equal(finalizeFeedbackReport(interrupted).passed,false);assert.equal(interrupted.failures[0].stack,'retained diagnostic');
 const absent=report();absent.completedEditions=['student','worked'];
 assert.equal(finalizeFeedbackReport(absent).passed,false,'completion markers alone cannot replace edition evidence');
});
test('only completed successful edition checks or baseline captures pass',()=>{
 const success={editions:['student'],checksOnly:['worked'],editionsReport:{student:{pageCount:2},worked:{pageCount:1}},completedEditions:['student','worked'],failures:[]};
 assert.equal(finalizeFeedbackReport(structuredClone(success)).passed,true);
 const error=structuredClone(success);error.failures.push({kind:'exception',message:'Export failed after printing'});
 assert.equal(finalizeFeedbackReport(error).passed,false);
 const baseline={editions:['student'],checksOnly:[],editionsReport:{},completedEditions:['student'],failures:[]};
 assert.equal(finalizeFeedbackReport(baseline,{capture:true}).passed,true);
 assert.equal(finalizeFeedbackReport({...baseline,completedEditions:[]},{capture:true}).passed,false);
});
test('explicit dense sampling ranks affected pages and keeps their selected neighbours',()=>{
 assert.deepEqual(selectDenseFeedbackPages([2,3,4,5,8],[0,10,50,20,40,0,0,100],2),{densePages:[8,3],selected:[2,3,4,8]});
 assert.deepEqual(selectDenseFeedbackPages([],[],2),{densePages:[],selected:[]});
});

test('question editions select changed pages and pagination neighbours only',()=>{
 const result=selectFeedbackPages({before:pages(12),after:pages(12,{changed:[5,9]}),edition:'student'});
 assert.deepEqual(result.changed,[5,9]);assert.deepEqual(result.boundaries,[]);assert.deepEqual(result.selected,[4,5,6,8,9,10]);
 assert.deepEqual(selectFeedbackPages({before:pages(12),after:pages(12),edition:'student'}).selected,[]);
 assert.deepEqual(selectFeedbackPages({before:pages(12),after:pages(12),edition:'student',extra:[7,99]}).selected,[7]);
 // A deleted tail is checked at the new final page.
 assert.deepEqual(selectFeedbackPages({before:pages(12),after:pages(10),edition:'student'}).selected,[9,10]);
});

test('block selection stays local when every page hash changed',()=>{
 const after=pages(12,{changed:[1,2,3,4,5,6,7,8,9,10,11,12]});
 const result=selectBlockPages({pages:after,blockIds:['b5','b9'],edition:'student'});
 assert.deepEqual(result.changed,[5,9]);assert.deepEqual(result.selected,[4,5,6,8,9,10]);
 assert.deepEqual(selectBlockPages({pages:after,blockIds:['missing'],edition:'student'}).selected,[]);
 assert.deepEqual(selectBlockPages({pages:after,blockIds:['b12'],edition:'student',extra:[2]}).selected,[2,11,12]);
 // A combined edition named explicitly still adds its composition boundary.
 assert.deepEqual(selectBlockPages({pages:pages(14,{answersFrom:11}),blockIds:['b5'],edition:'with-short'}).selected,[4,5,6,10,11]);
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

test('a clean answer verso is a boundary, not an extra Questions body page',()=>{
 const student=pages(3),combined=[...student,{page:4,blocks:[],mode:'student',isBlank:true},{page:5,blocks:['answer'],mode:'short',isAnswer:true,answerSectionStart:true}];
 const derived=deriveCombinedSelection({pages:combined,studentPages:student,studentSelected:[3]});
 assert.deepEqual(derived.selected,[3,4,5]);assert.deepEqual(derived.boundaries,[4,5]);
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

test('identical rendered pages reuse an earlier image and its inspection; changed pages or diagrams do not',async t=>{
 const {reusableImages}=await import('../scripts/booklet/check-feedback-pages.mjs');
 const fs=await import('node:fs'),os=await import('node:os'),{createHash}=await import('node:crypto');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'feedback-reuse-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const image=path.join(dir,'page-3.png');fs.writeFileSync(image,'png');const hash=createHash('sha256').update('png').digest('hex');
 const previous={diagramVersion:'v',pdf:{path:'old.pdf'},pages:[{page:1,hash:'a'},{page:2,hash:'b'},{page:3,hash:'c'}],images:[{page:2,path:image,hash},{page:3,path:image,hash}]};
 const result={diagramVersion:'v',pages:[{page:1,hash:'a'},{page:2,hash:'changed'},{page:3,hash:'c'}]};
 assert.deepEqual(reusableImages(previous,result,[2,3]).map(row=>row.page),[3]);
 assert.deepEqual(reusableImages(previous,{...result,diagramVersion:'w'},[3]),[],'a new diagram version re-renders');
 fs.writeFileSync(image,'edited');assert.deepEqual(reusableImages(previous,result,[3]),[],'a changed image file is not reused');
 assert.deepEqual(reusableImages(null,result,[3]),[]);
});

 test('early diagnostics retain detached math failures before preview teardown',async t=>{
const {installEarlyMathFailureObserver}=await import('../scripts/booklet/check-feedback-pages.mjs');
let callback,options;const persisted=[];
class Element {
 constructor(attrs={},parent=null,children=[]){this.nodeType=1;this.attrs=attrs;this.parentElement=parent;this.children=children;this.tagName='DIV';this.textContent='precise TeX failure';this.isConnected=false;this.outerHTML='<div class="tikz-error" title="compile failed">failure</div>';this.dataset={};for(const c of children)c.parentElement=this;}
 getAttribute(k){return this.attrs[k]??null;}
 matches(selector){return selector.split(',').some(s=>{if(s.startsWith('.'))return(this.attrs.class??'').split(' ').includes(s.slice(1));const m=s.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);return m&&(m[2]===undefined?Object.hasOwn(this.attrs,m[1]):this.attrs[m[1]]===m[2]);});}
 closest(selector){for(let n=this;n;n=n.parentElement)if(n.matches(selector))return n;return null;}
 querySelectorAll(selector){return this.children.flatMap(c=>[...(c.matches(selector)?[c]:[]),...c.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
}
const originalGlobals=Object.fromEntries(['window','location','document','MutationObserver'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));t.after(()=>{for(const[k,v]of Object.entries(originalGlobals)){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}}); globalThis.window={addEventListener(){},__mathsmapRecordMathFailure:r=>persisted.push(r)};globalThis.location={href:'https://diagnostic.invalid/#/booklet'};globalThis.document={documentElement:new Element(),addEventListener(){}};globalThis.MutationObserver=class{constructor(fn){callback=fn;}observe(_node,o){options=o;}};
installEarlyMathFailureObserver();assert(options.subtree&&options.childList&&options.characterData&&options.attributes);const err=new Element({class:'tikz-error',title:'Exact compile failure'}),wrapper=new Element({class:'tikz-loading','data-cache-key':'fixture-key'},null,[err]);wrapper._tikzJob={code:'\\begin{tikzpicture}fixture exact source\\end{tikzpicture}',key:'fixture-key',error:'Exact TeX compile failure',seq:7};const owner=new Element({'data-question-id':'fixture-whole-owner','data-diagram-id':'fixture-diagram'},null,[wrapper]),root=new Element();callback([{type:'childList',target:root,addedNodes:[],removedNodes:[owner]}]);assert.equal(persisted.length,1);assert.equal(persisted[0].connected,false);assert.equal(persisted[0].reason,'removed');assert.equal(persisted[0].cacheKey,'fixture-key');assert.equal(persisted[0].source,wrapper._tikzJob.code);assert.equal(persisted[0].title,'Exact compile failure');assert(persisted[0].ancestors.some(a=>a['data-question-id']==='fixture-whole-owner'));assert(persisted[0].ancestors.some(a=>a['data-diagram-id']==='fixture-diagram'));
const status=new Element({'data-status':'failed',title:'data-status failure'},owner);callback([{type:'attributes',target:status}]);assert.equal(persisted.length,2);for(let i=0;i<30;i++){const n=new Element({class:'katex-error',title:'Unique '+i},owner);callback([{type:'attributes',target:n}]);}assert.equal(window.__mathsmapMathFailureHistory.length,20);assert.equal(persisted.length,20);assert.equal(persisted[0].title,'Exact compile failure');
});
