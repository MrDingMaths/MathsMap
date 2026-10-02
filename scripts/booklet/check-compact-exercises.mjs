// Read-only browser/PDF acceptance check. Generated evidence stays local.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {inspectPrintedPdf} from './pdf-layout-qa.mjs';
import {isPractice,flowEditionSections,exerciseNumbers} from '../../src/lib/booklet-flow.js';
import {rendererSignature,qaSignature,layoutCacheKey,readLayoutCache,writeLayoutCache,contentAssetSignatures} from './verification-cache.mjs';
import {inspectContentCoverage} from '../../src/lib/booklet-content-verification.js';
import {loadRun} from './transcription.mjs';
import {liveWorkflow} from './workflow-review.mjs';
import {artifactHash,projectReviewHash,renderedPageHashes,affectedPages,readPageManifest,requireBoundedDevelopmentExport,requireFinalCandidateSettlement} from './page-review.mjs';
import {solidAcceptance} from '../audit-solid-visibility.mjs';
import {routeCandidateProject,inspectFinalSizeDiagrams,diagramSourcePreflight} from './diagram-preflight.mjs';
import {trackProcessPhase,recordExportReuse} from './run-observability.mjs';
import {publishBrowserDiagrams} from './render-cache-server.mjs';
import {inspectPdfNavigation} from './pdf-navigation-qa.mjs';
import {ensurePdfRasters,ensureSelectedPdfRasters} from './pdf-rasters.mjs';
import {LEAN_REVIEW_PROFILE,isLeanReview,selectLeanVisualPages} from './lean-profile.mjs';
import {seedUnchangedFinalExports,finalExportOutput} from './seed-final-export-cache.mjs';
// The compiler reports per-event durations; its public stats retain only the
// last event, so exports accumulate the observed events without estimating time.
export function accumulateTikzCompilation(state,detail){
 const before=state??{compiles:0,measuredCompiles:0,unmeasuredCompiles:0,measuredMs:0};
 if(detail?.source!=='compiled')return {...before};
 const values=detail.timings??{},valid=value=>Number.isFinite(value)&&value>=0;
 const duration=valid(values.texifyMs)?values.texifyMs:valid(values.texExecutionMs)&&valid(values.dviToSvgMs)?values.texExecutionMs+values.dviToSvgMs:null;
 return {compiles:before.compiles+1,measuredCompiles:before.measuredCompiles+(duration===null?0:1),unmeasuredCompiles:before.unmeasuredCompiles+(duration===null?1:0),measuredMs:before.measuredMs+(duration??0)};
}
export function tikzCompilationDelta(before,after){
 const delta=Object.fromEntries(['compiles','measuredCompiles','unmeasuredCompiles','measuredMs'].map(key=>[key,Math.max(0,(after?.[key]??0)-(before?.[key]??0))]));
 return {...delta,compilationMs:delta.unmeasuredCompiles?null:delta.measuredMs};
}
export function reusableExportManifest(manifest,{edition,renderer,projectHash,workflowKey,reviewProfile,printableKey,pdfHash,allowReviewPdf=false}){
 if(!['full',...(allowReviewPdf&&reviewProfile===LEAN_REVIEW_PROFILE?['review']:[])].includes(manifest?.mode)||manifest.passed!==true||manifest.edition!==edition||manifest.renderer!==renderer||!pdfHash||manifest.pdf?.hash!==pdfHash)return false;
 if(reviewProfile===LEAN_REVIEW_PROFILE)return manifest.reviewProfile===reviewProfile&&!!printableKey&&manifest.printableKey===printableKey;
 return !manifest.reviewProfile&&manifest.projectHash===projectHash&&manifest.workflowKey===workflowKey;
}
export function retainVisualPages(selected,previous,count){
 return [...new Set([...selected,...(previous??[])])].filter(page=>Number.isInteger(page)&&page>=1&&page<=count).sort((a,b)=>a-b);
}
// Run-local decisions use the same exact code-hash visibility gate as the
// historical register. An explicit input must exist and have a valid shape.
export function readSolidVisibilityReviews({file,defaultFile='booklets/provenance/solid-visibility-2026-09-12.json'}={}){
 const selected=file??defaultFile;
 if(file!==undefined&&(!file.trim()||file.startsWith('--')))throw Error('--visibility-reviews requires a review JSON file');
 if(!fs.existsSync(selected)){
  if(file!==undefined)throw Error('Missing explicit visibility review file: '+selected);
  return {reviews:{},artifact:null};
 }
 const value=JSON.parse(fs.readFileSync(selected,'utf8').replace(/^\uFEFF/,''));
 if(!value?.reviews||typeof value.reviews!=='object'||Array.isArray(value.reviews))throw Error('Visibility review JSON requires an object named reviews: '+selected);
 return {reviews:value.reviews,artifact:{path:path.resolve(selected),hash:artifactHash(selected)}};
}
export function requireLeanFinalEditions(project,editions,{development=false,preflight=false,draft=false,reviewOnly=false}={}){
 if(isLeanReview(project)&&!development&&!preflight&&(!draft||reviewOnly))assert.deepEqual([...editions].sort(),['short','student','with-short','with-worked','worked'],'Lean final/review exports require all five automated edition checks');
}
// Enumerate semantic answer ownership independently of pagination/fragments.
// A group owns one rendered answer only in the edition with its override.
export function expectedAnswerNodeIds(project,mode){
 assert.ok(['short','worked'].includes(mode),'Select an answer mode');
 const ids=[];
 const visit=node=>{
  if(node.children?.length&&!node.answer?.[mode])node.children.forEach(visit);
  else ids.push(node.id);
 };
 flowEditionSections(project,mode).flatMap(section=>section.blocks).forEach(block=>visit(block.content));
 assert.equal(new Set(ids).size,ids.length,'Expected answer nodes have unique identities');
 return ids;
}
export function assertAnswerNodeCoverage(actualIds,expectedIds){
 assert.deepEqual([...actualIds].sort(),[...expectedIds].sort(),'Every expected answer node appears exactly once, including edition-specific group answers');
}
export const expectedTeachingGroupIds=project=>[...new Set(project.sections.flatMap(s=>s.blocks).filter(b=>b.sourceAtom&&!b.presentation?.editorOnly).map(b=>b.sourceAtom.id))].sort();
export function assertAnswerRenderCoverage(labels,diagramIds,project,mode){
 const primary=labels.filter(label=>!label.continuation);
 assertAnswerNodeCoverage(primary.map(label=>label.id),expectedAnswerNodeIds(project,mode));
 for(const label of labels.filter(label=>label.continuation)){
  assert.equal(mode,'worked','Only worked answers may have figure continuations');
  assert.equal(label.continuation,'solution-diagrams','Only explicit figure projections repeat an answer identity');
  assert.equal(label.editableFields,0,'A figure continuation cannot edit an omitted answer field');
  assert.ok(label.diagrams>0,'A figure continuation retains its diagrams');
  assert.equal(label.label,primary.find(answer=>answer.id===label.id)?.label,'A continuation retains its complete answer label');
 }
 const expected=[];
 const visit=node=>{
  if(node.children?.length&&!node.answer?.[mode])node.children.forEach(visit);
  else expected.push(...(node.answer?.solutionDiagrams??[]).map(d=>d.id));
  expected.push(...(node.sharedSolutionDiagrams??[]).map(d=>d.id));
 };
 flowEditionSections(project,mode).flatMap(section=>section.blocks).forEach(block=>visit(block.content));
 assert.deepEqual([...diagramIds].sort(),expected.sort(),'Every complete answer diagram appears exactly once per semantic occurrence');
}

async function runCompactExerciseCheck(){
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const out=finalExportOutput({out:arg('--out'),runDir:arg('--run-dir'),development:process.argv.includes('--development'),draft:process.argv.includes('--draft')||process.argv.includes('--review-only'),preflight:process.argv.includes('--diagram-preflight')}),base=arg('--base','http://127.0.0.1:5173');
const preflight=process.argv.includes('--diagram-preflight'),candidateFile=arg('--project-file');
const editions=arg('--editions',preflight?'student,short,worked':'student,short,worked,with-short,with-worked').split(',');
const projects=arg('--projects',arg('--project','linear-relationships-v1')).split(',');
const rendererSignatures=new Map();
const development=process.argv.includes('--development'),reviewOnly=process.argv.includes('--review-only'),draft=process.argv.includes('--draft')||reviewOnly;
if(reviewOnly&&(development||preflight))throw Error('--review-only requires complete edition checks');
const fullDevelopmentReason=arg('--full-development-reason');
if(fullDevelopmentReason!==undefined&&(!development||!fullDevelopmentReason.trim()||fullDevelopmentReason.trim().startsWith('--')))throw Error('Use --full-development-reason with a nonempty reason and --development.');
if(candidateFile&&projects.length!==1)throw Error('Use one project with --project-file');
if(editions.some(e=>!['student','short','worked','with-short','with-worked'].includes(e))||new Set(editions).size!==editions.length)throw Error('Select distinct supported editions');
if(preflight&&!['student','short','worked'].every(e=>editions.includes(e)))throw Error('Diagram preflight requires student, short and worked compositions');
const reportFile=out+(preflight?'/diagram-preflight.json':development?'/development-report.json':'/report.json');
const runDir=arg('--run-dir'),phaseId=trackProcessPhase(runDir,'render-export',{artifact:reportFile,projects,editions,preflight,development,draft});
if(process.argv.includes('--visibility-reviews')&&arg('--visibility-reviews')===undefined)throw Error('--visibility-reviews requires a review JSON file');
const visibilityInput=readSolidVisibilityReviews({file:arg('--visibility-reviews')});
const runStarted=Date.now(),runMeasurements={startedAt:new Date(runStarted).toISOString(),projectLoads:[],exports:[],editions:[],note:'Durations exclude manual visual review. TikZ counters are cumulative snapshots, not inferred cache reuse. Pagination timings include layout settling. Compilation timings sum actual event-reported engine durations, which may overlap wall time; inspection timing is separate. Missing event durations remain null.'};
runMeasurements.visibilityReviews=visibilityInput.artifact;
if(fullDevelopmentReason)runMeasurements.fullDevelopmentReason=fullDevelopmentReason.trim();
const observeExport=async(edition,file,dependencyKey,reused)=>{
 const observation={id:randomUUID(),edition,reused,artifact:{path:path.resolve(file),hash:artifactHash(file)},dependencyKey,phaseId,reason:reused?'passed-current-export':'generated-after-dependency-check'};
 runMeasurements.exports.push(observation);
 if(runDir)await recordExportReuse(runDir,observation);
};
fs.mkdirSync(out,{recursive:true});
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const cache=fs.existsSync(out+'/cache.json')?out+'/cache.json':'.booklet-work/flexible-check/cache.json';
const context=await browser.newContext({viewport:{width:1600,height:1100},...(fs.existsSync(cache)?{storageState:cache}:{})});
const page=await context.newPage(),errors=[],report={};page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript({content:`(() => { const accumulate=${accumulateTikzCompilation.toString()}; window.__mathsmapExportCompilation=accumulate(null,null); document.addEventListener('tikzjax-load-finished',event=>{window.__mathsmapExportCompilation=accumulate(window.__mathsmapExportCompilation,event.detail);},true); })();`});
runMeasurements.browserReadyMs=Date.now()-runStarted;
runMeasurements.cacheInput=fs.existsSync(cache)?{path:path.resolve(cache),hash:artifactHash(cache),hasIndexedDB:JSON.parse(fs.readFileSync(cache,'utf8')).origins?.some(o=>o.indexedDB?.length>0)??false}:null;
const writeReport=()=>fs.writeFileSync(reportFile,JSON.stringify({report,errors,run:{...runMeasurements,elapsedMs:Date.now()-runStarted}},null,2));
await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());
await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));
const ready=async edition=>{
  const deadline=Date.now()+600000;let nextLog=Date.now();
  while(Date.now()<deadline){
    if(await page.getByLabel('Booklet edition',{exact:true}).inputValue()!==edition)await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);
    const state=await page.locator('.flow-document').evaluate(el=>({state:el.dataset.paginationState,edition:el.dataset.paginatedEdition,status:el.querySelector('[role=status]')?.textContent,error:el.querySelector('[role=alert]')?.textContent}));
    if(state.state==='error')throw Error(state.error);
    if(state.state==='ready'&&state.edition===edition)return;
    if(Date.now()>nextLog){console.log(edition+': '+(state.status??state.state));nextLog=Date.now()+15000;}
    await page.waitForTimeout(200);
  }
  throw Error('Pagination timed out');
};
try{
 for(const kind of projects){
  const candidate=candidateFile?JSON.parse(fs.readFileSync(candidateFile,'utf8').replace(/^\uFEFF/,'')):null;
  const id=candidate?.id??kind;
  if(!/^[a-zA-Z0-9._-]+$/.test(id))throw Error('Invalid project ID');
  const projectFile=`booklets/projects/${id}.json`;
  const record=candidate??JSON.parse(fs.readFileSync(projectFile));record.settings.flowEdition=editions[0];
  const lean=isLeanReview(record),reviewProfile=lean?LEAN_REVIEW_PROFILE:undefined;
  if(!rendererSignatures.has(lean))rendererSignatures.set(lean,rendererSignature(lean?{lean:true}:undefined));
  const runtime=rendererSignatures.get(lean),qaRuntime=lean?qaSignature():undefined;
  requireLeanFinalEditions(record,editions,{development,preflight,draft,reviewOnly});
  if(reviewOnly&&(record.library?.category!=='import-review'||record.sections.some(s=>s.blocks.some(b=>b.bankRef||b.canonicalId))))throw Error('--review-only requires local Import review content');
  if(development)for(const edition of editions){
   const baseline=readPageManifest(`${out}/${id}-${edition}.development.pages.json`)??readPageManifest(`${out}/${id}-${edition}.full.pages.json`);
   requireBoundedDevelopmentExport({projectId:id,edition,hasBaseline:!!baseline,baselineRenderer:baseline?.renderer,currentRenderer:runtime,reason:fullDevelopmentReason});
  }
  const sourceDiagrams=diagramSourcePreflight(record);
  const visibilityIssues=solidAcceptance(record,visibilityInput.reviews);
  assert.equal(visibilityIssues.length,0,'3D visibility acceptance: '+JSON.stringify(visibilityIssues.map(i=>({location:i.location,status:i.status,reason:i.reason,issues:i.issues}))));
  const projectHash=projectReviewHash(record),workflowRef=record.source?.workflow??record.source?.inventory?.workflow;
  const workflow=workflowRef?liveWorkflow(loadRun(workflowRef.runId).runDir):null;
  if(candidateFile&&!development&&!draft&&!preflight)requireFinalCandidateSettlement(record,workflow);
  if(workflow&&!development&&!draft&&!preflight)assert.ok(workflow.settled?.project.hash===projectHash,'Settle current content before the complete final five-edition review. Use --development during editing.');
  const workflowKey=reviewOnly?null:workflow?.settled?.key??null,assets=await contentAssetSignatures(record);
  if(record.source?.inventory){
   const coverage=await inspectContentCoverage(record,{assetSignatures:assets});
   fs.writeFileSync(`${out}/${id}-readiness.json`,JSON.stringify(coverage,null,2));
   if(!draft&&!development&&!preflight)assert.equal(coverage.complete,true,'Content and teaching/arrangement fidelity must pass independently of layout. Use --draft for review exports.');
  }
  if(lean&&runDir&&!development&&!preflight&&!draft){
   runMeasurements.exportSeeding??=[];
   if(path.dirname(path.resolve(out))===path.resolve(runDir)&&path.basename(out).startsWith('final-exports-'))await seedUnchangedFinalExports({runDir,projectFile:candidateFile??projectFile,out,onDecision:decision=>runMeasurements.exportSeeding.push({projectId:id,...decision})});
   else runMeasurements.exportSeeding.push({projectId:id,reason:'explicit-output-outside-canonical-seeding-path',out:path.resolve(out)});
  }
  const loadStarted=Date.now();
  await routeCandidateProject(page,record);
  // The project picker keeps its initial inventory for the lifetime of the app.
  // Start a fresh document so the next candidate cannot retain the previous book.
  await page.goto('about:blank');
  await page.goto(base+'/#/booklet?stage=projects&project='+id,{waitUntil:'domcontentloaded'});
  await page.locator('.flow-document').waitFor({state:'attached',timeout:600000});
  // Fresh native diagrams can still be paginating behind the opening overlay.
  await page.getByLabel('Booklet edition',{exact:true}).waitFor({state:'visible',timeout:600000});
  let lastCompilationSnapshot=await page.evaluate(()=>window.__mathsmapExportCompilation??null);
  runMeasurements.projectLoads.push({id,elapsedMs:Date.now()-loadStarted,tikz:await page.evaluate(()=>window.TikZ?.stats?.()??null),diagramCompilation:tikzCompilationDelta(null,lastCompilationSnapshot)});
  const recordCompilationTiming=async timings=>{
   const snapshot=await page.evaluate(()=>window.__mathsmapExportCompilation??null),delta=tikzCompilationDelta(lastCompilationSnapshot,snapshot);
   Object.assign(timings,{diagramCompilationMs:delta.compilationMs,diagramCompilationMeasuredMs:delta.measuredMs,tikzCompiles:delta.compiles,tikzMeasuredCompiles:delta.measuredCompiles,tikzUnmeasuredCompiles:delta.unmeasuredCompiles});
   lastCompilationSnapshot=snapshot;
  };
  const answerNodes={short:expectedAnswerNodeIds(record,'short'),worked:expectedAnswerNodeIds(record,'worked')};
  const studentPrompts=new Set();const practiceLeaf=n=>n.children?.length?n.children.forEach(practiceLeaf):!n.intentionalWorkedExample&&studentPrompts.add(n.id);
  record.sections.flatMap(s=>s.blocks).filter(isPractice).forEach(b=>practiceLeaf(b.content));
  report[kind]??={};
  for(const edition of editions){
   if(preflight&&['short','worked'].includes(edition)&&answerNodes[edition].length===0){
    report[kind][edition]={mode:'diagram-preflight',projectId:id,projectHash,renderer:runtime,notApplicable:'This representative candidate has no practice answers in this edition.',pageHashes:[],screenshots:[],issues:[],printed:[]};
    writeReport();console.log(`${kind} ${edition}: no practice-answer composition in this candidate`);continue;
   }
   const started=Date.now(),beforeStats=await page.evaluate(()=>window.TikZ?.stats?.()??null),timings={paginationMs:0,diagramInspectionMs:0,diagramCompilationMs:0,diagramCompilationMeasuredMs:0,tikzCompiles:0,tikzMeasuredCompiles:0,tikzUnmeasuredCompiles:0,printingMs:0,rasterMs:0};
   runMeasurements.editions.push({projectId:id,edition,timings});
   const file=`${out}/${kind}-${edition}${preflight?'-preflight':development?'-development':''}.pdf`,cacheFile=`${out}/${kind}-${edition}${lean&&reviewOnly?'.review':''}.verification.json`,key=await layoutCacheKey(record,edition,runtime);
   const manifestFile=`${out}/${kind}-${edition}.${reviewOnly?'review':'full'}.pages.json`,hashFile=`${out}/${kind}-${edition}.development.pages.json`;
   const fullManifest=readPageManifest(manifestFile)??(lean&&!reviewOnly?readPageManifest(`${out}/${kind}-${edition}.review.pages.json`):null);
   const pdfReusable=reusableExportManifest(fullManifest,{edition,renderer:runtime,projectHash,workflowKey,reviewProfile,printableKey:key,pdfHash:fs.existsSync(file)?artifactHash(file):null,allowReviewPdf:lean});
   const manifestCurrent=pdfReusable&&fullManifest.mode===(reviewOnly?'review':'full')&&(!lean||fullManifest.qaSignature===qaRuntime);
   const cached=preflight||development||(draft&&!reviewOnly)||process.argv.includes('--force')||!manifestCurrent?null:readLayoutCache(cacheFile,key,file);
   if(cached){
    const rasterStarted=Date.now(),pdf={path:path.resolve(file),hash:artifactHash(file)};
    const visualPages=lean?retainVisualPages(selectLeanVisualPages(record,fullManifest.pages,edition),fullManifest.visualPages,fullManifest.pages.length):null;
    const rasters=lean?await ensureSelectedPdfRasters(pdf,fullManifest.pages.length,path.join(out,'pdf-rasters'),{pages:visualPages}):ensurePdfRasters(pdf,fullManifest.pages.length,path.join(out,'pdf-rasters'));
    timings.rasterMs=Date.now()-rasterStarted;
    await recordCompilationTiming(timings);
    const next={...fullManifest,version:2,projectHash,workflowKey,pdf,...(reviewOnly&&fullManifest.readiness?{readiness:{path:path.resolve(`${out}/${id}-readiness.json`),hash:artifactHash(`${out}/${id}-readiness.json`)}}:{}),...(lean?{reviewProfile,printableKey:key,qaSignature:qaRuntime,visualPages}:{}),images:rasters.images,rasterization:rasters.rasterization};
    if(JSON.stringify(next)!==JSON.stringify(fullManifest))fs.writeFileSync(manifestFile,JSON.stringify(next,null,2));
    await observeExport(edition,file,key,true);
    report[kind][edition]={...cached,...(lean?{reviewProfile,projectHash,workflowKey,visualPages}:{}),timings,rasterMetrics:rasters.metrics};console.log(`Reusing unchanged ${kind} ${edition} layout verification`);continue;
   }
   console.log(`Checking ${kind} ${edition}`);
   const paginationStarted=Date.now();
   await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await ready(edition);
   await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
   await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
   await page.emulateMedia({media:'print'});
   const qa=await page.evaluate(async()=>{const {settleBooklet,inspectBooklet}=await import('/src/lib/booklet-qa.js');const root=document.querySelector('.project-print');await settleBooklet(root);return inspectBooklet(root,{style:true});});
   timings.paginationMs=Date.now()-paginationStarted;
   const diagramStarted=Date.now(),diagrams=await inspectFinalSizeDiagrams(page);timings.diagramInspectionMs=Date.now()-diagramStarted;
   await recordCompilationTiming(timings);
   for(const issue of diagrams.issues){const report=qa[issue.page-1];assert.ok(report,'Diagram belongs to a physical page');report.issues.push(issue);}
   const info=await page.locator('.project-print').evaluate(root=>({
     pages:root.querySelectorAll('.print-page').length,
     exerciseHeadings:[...root.querySelectorAll('.difficulty-heading,.inline-exercise-heading,.exercise-heading')].map(e=>e.textContent.trim()).filter(t=>/^Exercise \S+(?:\s+\S+)*$/.test(t)),
     labels:[...root.querySelectorAll('.answer-item')].map(e=>({id:e.dataset.nodeId,label:e.querySelector('.answer-label')?.textContent,continuation:e.closest('[data-answer-continuation]')?.dataset.answerContinuation,editableFields:e.querySelectorAll('.editable-booklet-text').length,diagrams:e.querySelectorAll('[data-diagram-id]').length})),
     answerDiagramIds:[...root.querySelectorAll('.compact-answer [data-diagram-id]')].filter(e=>!e.parentElement.closest('[data-diagram-id]')).map(e=>e.dataset.diagramId),
     badges:root.querySelectorAll('[data-editor-difficulty]').length,
     teachingGroups:[...root.querySelectorAll('[data-atom-id]')].map(e=>({id:e.dataset.atomId,headers:e.querySelectorAll(':scope > [data-header-kind]').length})),
     teachingReferences:[...root.querySelectorAll('.teaching-activity-reference')].filter(e=>e.getClientRects().length).map(e=>e.textContent),
     clozeSpaces:root.querySelectorAll('.key-ideas-cloze .answer-space,.key-ideas-cloze .arr-space').length,
     columns:[...root.querySelectorAll('.answer-columns')].map(e=>getComputedStyle(e).gridTemplateColumns),
     fonts:[...new Set([...root.querySelectorAll('.compact-answer')].map(e=>getComputedStyle(e).fontSize))],
     columnOverflow:[...root.querySelectorAll('.answer-column .katex-html > .base,.answer-column table')].filter(e=>{const r=e.getBoundingClientRect(),c=e.closest('.answer-column').getBoundingClientRect();return r.left<c.left-.5||r.right>c.right+.5;}).map(e=>({text:e.textContent,id:e.closest('[data-node-id]')?.dataset.nodeId})),
     links:[...root.querySelectorAll('a[href^="#"]')].filter(a=>a.getClientRects().length>0).map(a=>({href:a.getAttribute('href'),exists:!!root.querySelector(`[id="${CSS.escape(a.getAttribute('href').slice(1))}"]`)})),
     map:[...root.querySelectorAll('.print-page')].map(e=>({page:Number(e.dataset.flowPage),blocks:e.dataset.flowBlocks.split(',')}))
   }));
   if(record.settings.exerciseOrganisation==='topic'){
    const numbers=exerciseNumbers(record);
    const practiceTopics=new Set(record.sections.filter(s=>s.phase==='practice'&&s.blocks.some(b=>!b.presentation?.editorOnly)).map(s=>s.topicId));
    const expected=['short','worked'].includes(edition)?[]:Object.entries(numbers).filter(([topic])=>practiceTopics.has(topic)).map(([,n])=>`Exercise ${n}`);
    assert.deepEqual(info.exerciseHeadings,expected,'Exactly one question-side heading per practice exercise, across source sections and teaching checkpoints');
   }
   const domPages=await page.locator('.project-print .print-page').evaluateAll((elements,{lean,edition})=>elements.map(e=>{
    const base={html:e.outerHTML,blocks:e.dataset.flowBlocks?.split(',')??[]};
    if(!lean)return base;
    const isAnswer=!!e.querySelector('.compact-answer,.answer-columns,.answer-item,[id*="answer-section-"]');
    return {...base,isAnswer,mode:edition.startsWith('with-')?(isAnswer?(edition.endsWith('worked')?'worked':'short'):'student'):edition,isCover:!!e.querySelector('.booklet-cover,.project-cover'),answerSectionStart:!!e.querySelector('[id*="answer-section-"]')};
   }),{lean,edition});
   const hashes=renderedPageHashes(domPages,{renderer:runtime,settings:record.settings,assets});
   if(preflight){
    const renderMs=Date.now()-started,exportStarted=Date.now();
    await page.pdf({path:file,format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});
    timings.printingMs=Date.now()-exportStarted;
    await observeExport(edition,file,key??[projectHash,runtime,edition].join(':'),false);
    const issues=qa.flatMap((p,i)=>p.issues.map(issue=>({page:i+1,...issue})));
    issues.push(...sourceDiagrams.issues.filter(i=>i.mode===edition));
    const visualPages=lean?selectLeanVisualPages(record,hashes,edition,{flaggedPages:issues.map(issue=>issue.page).filter(Number.isInteger)}):hashes.map(entry=>entry.page);
    const screenshots=[];
    for(const physicalPage of visualPages){const image=`${out}/${kind}-${edition}-preflight-page-${physicalPage}.png`;await page.locator('.project-print .print-page').nth(physicalPage-1).screenshot({path:image});screenshots.push({page:physicalPage,path:path.resolve(image),hash:artifactHash(image)});}
    const printed=inspectPrintedPdf(file);
    report[kind][edition]={mode:'diagram-preflight',projectId:id,projectHash,renderer:runtime,...(lean?{reviewProfile,visualPages}:{}),assets,pageHashes:hashes,sourceDiagrams,diagrams,issues,printed,pdf:{path:path.resolve(file),hash:artifactHash(file)},screenshots,
     timings,renderMs,exportAndCaptureMs:Date.now()-exportStarted,tikzBefore:beforeStats,tikzAfter:await page.evaluate(()=>window.TikZ?.stats?.()??null),visualReview:'pending',sourceComparison:'pending'};
    writeReport();
    await context.storageState({path:out+'/cache.json',indexedDB:true});
    console.log(`${kind} ${edition}: ${diagrams.figures.length} native figures, ${issues.length} automated findings; visual review remains pending`);
    await page.emulateMedia({media:'screen'});continue;
   }
   if(development){
    const previous=readPageManifest(hashFile)?.pages??fullManifest?.pages;
    const selected=process.argv.includes('--force')?hashes.map(p=>p.page):affectedPages(previous,hashes);
    requireBoundedDevelopmentExport({projectId:id,edition,hasBaseline:!!previous,selectedPages:selected.length,totalPages:hashes.length,reason:fullDevelopmentReason});
    const issues=qa.flatMap((p,i)=>p.issues.map(issue=>({page:i+1,...issue}))).filter(i=>selected.includes(i.page));
    let printed=[];
    if(selected.length){
     const printingStarted=Date.now();
     await page.pdf({path:file,pageRanges:selected.join(','),format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});
     timings.printingMs=Date.now()-printingStarted;
     await observeExport(edition,file,key??[projectHash,runtime,edition].join(':'),false);
     printed=inspectPrintedPdf(file);
     assert.equal(printed.length,selected.length,'Development export includes every selected physical page');
    }
    report[kind][edition]={mode:'development',selectedPages:selected,pageHashes:hashes,issues,printed,diagrams,timings};
    writeReport();
    // A failed subset is never a reusable baseline or a full-edition cache hit.
    assert.deepEqual(issues,[]);assert.deepEqual(printed.flatMap(p=>p.issues),[]);assert.deepEqual(errors,[]);
    fs.writeFileSync(hashFile,JSON.stringify({mode:'development',projectHash,edition,renderer:runtime,pages:hashes},null,2));
    console.log(`${kind} ${edition}: ${selected.length}/${hashes.length} affected/neighbour pages exported; final acceptance unchanged`);
    await page.emulateMedia({media:'screen'});continue;
   }
   const reusePrintedPdf=lean&&pdfReusable&&!process.argv.includes('--force')&&fullManifest.pages.length===hashes.length&&hashes.every((entry,i)=>entry.hash===fullManifest.pages[i].hash);
   if(!reusePrintedPdf){
    const printingStarted=Date.now();
    await page.pdf({path:file,format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});
    timings.printingMs=Date.now()-printingStarted;
   }
   await observeExport(edition,file,key??[projectHash,runtime,edition].join(':'),reusePrintedPdf);
   const printed=inspectPrintedPdf(file),issues=qa.flatMap(p=>p.issues.map(i=>({page:p.page,...i})));
   const pdfNavigation=inspectPdfNavigation(file,info.links),pdfLinks=pdfNavigation.annotations;
   report[kind][edition]={...info,pdfLinks,pdfNavigation,qa,printed,issues,diagrams,timings,...(lean?{reviewProfile}:{}),...(draft?{mode:'draft',projectHash,renderer:runtime,assets,pageHashes:hashes,pdf:{path:path.resolve(file),hash:artifactHash(file)},visualReview:'pending',sourceComparison:'pending'}:{})};
   writeReport();
   await context.storageState({path:out+'/cache.json',indexedDB:true});
   console.log(`${kind} ${edition}: ${info.pages} pages, ${issues.length} DOM issues, ${printed.flatMap(p=>p.issues).length} print issues`);
   await publishBrowserDiagrams(page);
   assert.equal(info.pages,printed.length);assert.equal(info.badges,0);
   if(record.settings.teachingPresentationVersion===1){
    assert.deepEqual(info.teachingReferences,[],'Teaching activity references are not student content');
    assert.equal(info.clozeSpaces,0,'Cloze-only Key Ideas have no additional working area');
    if(!['short','worked'].includes(edition)){
     const expected=expectedTeachingGroupIds(record);
     assert.deepEqual([...new Set(info.teachingGroups.map(g=>g.id))].sort(),expected,'Every teaching group uses its header template');
     assert.ok(info.teachingGroups.every(g=>g.headers===1),'Exactly one header per teaching box');
    }else assert.deepEqual(info.teachingGroups,[],'Answer-only editions contain practice, not teaching');
   }
   assert.deepEqual(info.columnOverflow,[],'Answer content fits its column');
   if(edition!=='student')assertAnswerRenderCoverage(info.labels,info.answerDiagramIds,record,edition.endsWith('worked')?'worked':'short');
   else assert.deepEqual(info.labels.filter(l=>studentPrompts.has(l.id)),[],'Practice answers do not leak into the Questions edition');
   assert.ok(info.links.every(l=>l.exists),'All printed references have destinations');
   assert.deepEqual(issues,[],'DOM layout/style checks');
   assert.deepEqual(printed.flatMap(p=>p.issues),[],'Printed geometry');
   assert.deepEqual(errors,[],'Browser errors');
   if(!draft||reviewOnly){
    const pdf={path:path.resolve(file),hash:artifactHash(file)};
    const changedPages=fullManifest?.pages?hashes.filter((entry,i)=>entry.hash!==fullManifest.pages[i]?.hash).map(entry=>entry.page):[];
    if(fullManifest?.pages.length>hashes.length&&hashes.length)changedPages.push(hashes.length);
    const selectedVisualPages=lean?selectLeanVisualPages(record,hashes,edition,{flaggedPages:issues.map(issue=>issue.page),changedPages}):null;
    const visualPages=lean?retainVisualPages(selectedVisualPages,fullManifest?.pdf?.hash===pdf.hash?fullManifest.visualPages:[],hashes.length):null;
    if(lean)report[kind][edition].visualPages=visualPages;
    if(!reviewOnly||lean)writeLayoutCache(cacheFile,key,file,report[kind][edition]);
    // Commit PDF verification before rasterization so an interrupted raster pass
    // resumes without printing another PDF. No review queue accepts missing images.
    const manifest={version:2,mode:reviewOnly?'review':'full',...(reviewOnly?{reviewOnly:true,readiness:{path:path.resolve(`${out}/${id}-readiness.json`),hash:artifactHash(`${out}/${id}-readiness.json`)}}:{}),passed:true,edition,renderer:runtime,projectHash,workflowKey,assets,pages:hashes,pdf,...(lean?{reviewProfile,printableKey:key,qaSignature:qaRuntime,visualPages}:{})};
    fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2));
    const rasterStarted=Date.now(),rasters=lean?await ensureSelectedPdfRasters(pdf,hashes.length,path.join(out,'pdf-rasters'),{pages:visualPages}):ensurePdfRasters(pdf,hashes.length,path.join(out,'pdf-rasters'));
    timings.rasterMs=Date.now()-rasterStarted;
    report[kind][edition].rasterMetrics=rasters.metrics;
    fs.writeFileSync(manifestFile,JSON.stringify({...manifest,images:rasters.images,rasterization:rasters.rasterization},null,2));
   }
   await page.emulateMedia({media:'screen'});
  }
 }
 assert.deepEqual(errors,[]);
 writeReport();
 assert.deepEqual(Object.values(report).flatMap(p=>Object.values(p).flatMap(e=>e.issues)),[],'DOM layout/style checks');
 assert.deepEqual(Object.values(report).flatMap(p=>Object.values(p).flatMap(e=>e.printed.flatMap(p=>p.issues))),[],'Printed geometry');
 console.log(preflight?'Diagram preflight passed automated checks; source comparison and final-size visual review remain pending.':development?'Development subset checks passed; full final visual inspection is still required.':draft?'Draft layout checks passed; see the separate readiness report.':'Compact exercise verification passed; visual acceptance is recorded separately.');
}finally{writeReport();await context.storageState({path:out+'/cache.json',indexedDB:true}).catch(()=>{});await browser.close();}

}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await runCompactExerciseCheck();
