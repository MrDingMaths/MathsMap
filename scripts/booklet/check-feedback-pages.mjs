// Scoped feedback-maintenance page check. One browser and context render the
// accepted project (page maps only) and the candidate (checks, then only the
// affected pages and their pagination neighbours as PDF). Read-only: no project,
// bank or comment is written. No report here is a visual inspection.
// --blocks selects pages by the blocks a repair changed and needs no baseline;
// --checks-only editions run the automated checks without printing.
// --editions none completes checks without reprinting already inspected pages.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {inspectPrintedPdf} from './pdf-layout-qa.mjs';
import {contentAssetSignatures} from './verification-cache.mjs';
import {artifactHash,projectReviewHash,renderedPageHashes,affectedPages,readPageManifest,requireBoundedDevelopmentExport} from './page-review.mjs';
import {routeCandidateProject,inspectFinalSizeDiagrams} from './diagram-preflight.mjs';
import {trackProcessPhase} from './run-observability.mjs';
import {publishBrowserDiagrams,diagramInputFiles} from './render-cache-server.mjs';
import {ensureSelectedPdfRasters} from './pdf-rasters.mjs';
import {accumulateTikzCompilation,expectedAnswerNodeIds,assertAnswerRenderCoverage} from './check-compact-exercises.mjs';
import {structuralPreflight,assertRepairScope} from './feedback-preflight.mjs';

export const FEEDBACK_EDITIONS=['student','short','worked','with-short','with-worked'];
// A scoped deletion still belongs to mutation scope, but has no surviving
// document to render. Unknown IDs remain so structural preflight rejects them.
export function survivingRepairBlocks(candidate,baseline,ids){
 const present=new Set((candidate.sections??[]).flatMap(s=>s.blocks??[]).map(b=>b.id));
 const previous=new Set((baseline?.sections??[]).flatMap(s=>s.blocks??[]).map(b=>b.id));
 return ids.filter(id=>present.has(id)||!previous.has(id));
}
// Explicit global-spacing maintenance may inspect dense samples while retaining
// complete page maps and full-DOM checks. Ordinary feedback selection is unchanged.
export function selectDenseFeedbackPages(selected,scores,count){
 const densePages=[...selected].sort((a,b)=>(scores[b-1]??0)-(scores[a-1]??0)||a-b).slice(0,count);
 return {densePages,selected:[...new Set(densePages.flatMap(p=>[p-1,p,p+1]))].filter(p=>selected.includes(p)).sort((a,b)=>a-b)};
}
const TIKZ_COUNTERS=['compiles','memoryHits','idbHits','serverHits','driverHits','failures'];
const within=(pages,count)=>[...new Set(pages)].filter(page=>Number.isInteger(page)&&page>=1&&page<=count).sort((a,b)=>a-b);

// Question/answer composition boundaries of a combined edition: the first page
// of each answer run and the page before it.
export function boundaryPages(pages){
 const found=[];
 for(const [i,page]of pages.entries()){
  const previous=pages[i-1];
  if(page.answerSectionStart||(page.isAnswer&&previous&&(!previous.isAnswer||previous.mode!==page.mode)))found.push(page.page-1,page.page);
 }
 return within(found,pages.length);
}
// Changed pages and their neighbours; combined editions also exercise their
// composition boundaries when anything changed. Extra pages are caller-selected.
export function selectFeedbackPages({before,after,edition,extra=[]}){
 const affected=affectedPages(before,after),changed=after.filter((page,i)=>before[i]?.hash!==page.hash).map(page=>page.page);
 if(before.length>after.length&&after.length)changed.push(after.length);
 const boundaries=edition.startsWith('with-')&&(affected.length||extra.length)?boundaryPages(after):[];
 return {changed:within(changed,after.length),boundaries,selected:within([...affected,...boundaries,...extra],after.length)};
}
// Pages carrying the named blocks, with their neighbours. Unlike a page-hash
// comparison this stays local when a renderer change alters every page hash.
export function selectBlockPages({pages,blockIds,edition,extra=[]}){
 const wanted=new Set(blockIds),changed=pages.filter(page=>page.blocks?.some(id=>wanted.has(id))).map(page=>page.page);
 const boundaries=edition.startsWith('with-')&&(changed.length||extra.length)?boundaryPages(pages):[];
 return {changed,boundaries,selected:within([...changed.flatMap(page=>[page-1,page,page+1]),...boundaries,...extra],pages.length)};
}
// A combined-edition body page whose flow blocks equal a selected Questions page
// is the same arrangement: inspect it once there. Boundaries, answers and covers
// are always inspected in their own edition.
export function inspectionPlan({edition,selected,boundaries=[],pages,studentPages=[],studentSelected=[]}){
 const key=page=>JSON.stringify(page.blocks),student=new Map(studentPages.filter(page=>studentSelected.includes(page.page)).map(page=>[key(page),page.page]));
 return selected.map(number=>{
  const page=pages[number-1],match=student.get(key(page));
  if(edition.startsWith('with-')&&match&&!page.isAnswer&&!page.isCover&&!boundaries.includes(number))return {page:number,inspectIn:'student',studentPage:match};
  return {page:number,inspectIn:edition};
 });
}
// A combined edition without its own baseline takes the Questions selection for
// its body and adds its composition boundaries. That is only sound while its
// body paginates exactly like the Questions edition and no answer changed.
export function deriveCombinedSelection({pages,studentPages,studentSelected,extra=[]}){
 const key=page=>JSON.stringify(page.blocks),body=pages.filter(page=>!page.isAnswer);
 if(body.length!==studentPages.length||body.some((page,i)=>key(page)!==key(studentPages[i])))throw Error('Combined body pagination differs from the Questions edition; render this edition\'s baseline with --baseline-editions all');
 const wanted=new Set(studentSelected),mapped=body.filter((page,i)=>wanted.has(studentPages[i].page)).map(page=>page.page);
 const boundaries=mapped.length||extra.length?boundaryPages(pages):[];
 return {changed:null,derivedFrom:'student',boundaries,selected:within([...mapped,...boundaries,...extra],pages.length)};
}
// Answer content and answer-layout settings, independent of question-side edits.
export function answerSignature(project){
 const rows=[],visit=value=>{
  if(!value||typeof value!=='object')return;
  // Practice answers are objects; a cloze's own expected response is question-side content.
  if(!Array.isArray(value)&&((value.answer&&typeof value.answer==='object')||value.sharedSolutionDiagrams!==undefined))rows.push([value.id,value.answer??null,value.sharedSolutionDiagrams??null]);
  for(const [name,child]of Object.entries(value))if(name!=='answer'&&typeof child==='object')visit(child);
 };
 visit(project.sections);
 return JSON.stringify([rows,project.settings?.compactAnswers??null]);
}
const globPattern=glob=>new RegExp('^'+glob.split('*').map(part=>part.replace(/[.+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$');
// A substituted diagram input makes the dev server's diagram version untrue for
// that pass, so its compiled SVGs must neither be read from nor written to a cache.
export function overrideTouchesDiagramInputs(globs,inputUrls){
 return globs.some(glob=>{const pattern=globPattern(glob);return inputUrls.some(url=>pattern.test(url)||pattern.test('http://host'+url));});
}
export const diagramInputUrls=(files,root=process.cwd())=>files.map(file=>'/'+path.relative(root,file).replaceAll('\\','/').replace(/^public\//,''));
export function tikzDelta(before,after){return Object.fromEntries(TIKZ_COUNTERS.map(name=>[name,Math.max(0,(after?.[name]??0)-(before?.[name]??0))]));}
export function parseOverrides(values){
 return values.map(value=>{const at=value.lastIndexOf('=');if(at<1||at===value.length-1)throw Error('--runtime-override requires URL_GLOB=FILE');const file=path.resolve(value.slice(at+1));if(!fs.existsSync(file))throw Error('Missing override file: '+file);return {glob:value.slice(0,at),file};});
}

export function finalizeFeedbackReport(report,{capture=false}={}){
 const required=[...new Set([...(report.editions??[]),...(report.checksOnly??[])])];
 const completed=new Set(report.completedEditions??[]);
 const missing=required.filter(edition=>!completed.has(edition)||(!capture&&!report.editionsReport?.[edition]));
 if(!required.length||missing.length)report.failures.push({kind:'incomplete-editions',required,missing});
 report.passed=report.failures.length===0;
 return report;
}

async function main(){
 const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];},all=name=>args.flatMap((value,i)=>value===name?[args[i+1]]:[]),flag=name=>args.includes(name);
 const out=path.resolve(arg('--out')??(()=>{throw Error('--out DIRECTORY is required');})()),base=arg('--base','http://127.0.0.1:5173').replace(/\/$/,'');
 const editionChoice=arg('--editions','student');
 const editions=editionChoice==='none'?[]:editionChoice.split(',');
 const sampleDense=Number(arg('--sample-dense','0'));
 if(!Number.isInteger(sampleDense)||sampleDense<0||sampleDense>10)throw Error('--sample-dense takes an integer from 1 to 10');
 if(editions.some(edition=>!FEEDBACK_EDITIONS.includes(edition))||new Set(editions).size!==editions.length)throw Error('Select distinct supported editions');
 const blockIds=arg('--blocks','').split(',').filter(Boolean),byBlocks=blockIds.length>0;
 const capture=flag('--capture-baseline'),candidateFile=arg('--project-file'),baselineFile=arg('--baseline-project-file'),projectId=arg('--project');
 const overrides=parseOverrides(all('--runtime-override')),candidateCss=arg('--candidate-css'),extra=(arg('--pages','')).split(',').filter(Boolean).map(Number),fullReason=arg('--full-reason');
 if(capture&&(overrides.length||candidateCss||baselineFile||byBlocks))throw Error('--capture-baseline records the current project and runtime only');
 // One combined edition exercises answer coverage and navigation by default,
 // without printing; a local repair inspects its pages in the Questions layout.
 const checksOnly=capture||arg('--checks-only','with-worked')==='none'?[]:arg('--checks-only','with-worked').split(',').filter(edition=>!editions.includes(edition));
 if(checksOnly.some(edition=>!FEEDBACK_EDITIONS.includes(edition)))throw Error('--checks-only takes supported editions or none');
 const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
 const candidate=candidateFile?read(candidateFile):read(`booklets/projects/${projectId??(()=>{throw Error('Use --project ID or --project-file FILE');})()}.json`);
 const baselineProject=baselineFile?read(baselineFile):null;
 if(!/^[a-zA-Z0-9._-]+$/.test(candidate.id)||(baselineProject&&baselineProject.id!==candidate.id))throw Error('Baseline and candidate must be the same valid project');
 fs.mkdirSync(out,{recursive:true});
 if(byBlocks){
  const preflight=structuralPreflight(candidate,{blockIds:survivingRepairBlocks(candidate,baselineProject,blockIds)});
  // An explicit before-snapshot also enables scope enforcement before launching
  // the browser. Project-level exceptions must be named, never inferred.
  if(baselineProject)preflight.scope=assertRepairScope(baselineProject,candidate,{blockIds,allowedPaths:all('--allow-path')});
  fs.writeFileSync(path.join(out,'preflight.json'),JSON.stringify(preflight,null,2)+'\n');
  if(preflight.issues.length)throw Error('Repair structural preflight failed: '+JSON.stringify(preflight.issues));
 }
 const id=candidate.id,mapFile=edition=>path.join(out,`${id}-${edition}.baseline.pages.json`),reportFile=path.join(out,capture?'baseline-report.json':'feedback-pages.json');
 // Stop before any rendering when a comparison has nothing to compare with.
 // With a baseline project, combined editions default to the Questions
 // selection plus boundaries. Changed answers, standalone answer editions and
 // persisted maps (shared-renderer work) always use their own baseline.
 const baselineChoice=arg('--baseline-editions','auto');
 if(!['auto','all'].includes(baselineChoice))throw Error('--baseline-editions is auto or all');
 const answersDiffer=!!baselineProject&&answerSignature(baselineProject)!==answerSignature(candidate);
 const derived=!byBlocks&&baselineProject&&baselineChoice==='auto'&&!answersDiffer&&editions.includes('student')?editions.filter(edition=>edition.startsWith('with-')):[];
 const baselineEditions=byBlocks?[]:editions.filter(edition=>!derived.includes(edition));
 if(answersDiffer&&!editions.some(edition=>edition!=='student'))console.warn('Practice answers changed; add the affected answer edition with --editions student,short or student,worked');
 if(!capture&&!baselineProject&&!byBlocks)for(const edition of editions)requireBoundedDevelopmentExport({projectId:id,edition,hasBaseline:!!readPageManifest(mapFile(edition)),reason:fullReason});
 const runDir=arg('--run-dir');trackProcessPhase(runDir,capture?'feedback-baseline-map':'feedback-pages',{artifact:reportFile,projectId:id,editions});
 const started=Date.now(),report={tool:'check-feedback-pages',startedAt:new Date(started).toISOString(),projectId:id,base,editions,checksOnly,blocks:blockIds,passes:[],editionsReport:{},completedEditions:[],passed:false,failures:[],browserLaunches:1,
  note:'Automated evidence only. Selected pages still need final-size visual inspection; combined body pages marked inspectIn "student" reuse that inspection of the same flow blocks, with no pixel comparison performed or claimed. Partial PDFs carry no link annotations; navigation is checked in the print DOM.'};
 const write=()=>fs.writeFileSync(reportFile,JSON.stringify({...report,elapsedMs:Date.now()-started},null,2));
 write();
 let browser;
 try{
 const inputUrls=diagramInputUrls(await diagramInputFiles()),cacheOff=overrideTouchesDiagramInputs(overrides.map(o=>o.glob),inputUrls);
 const cacheState=arg('--cache-state'),stateExists=cacheState&&fs.existsSync(cacheState);
 if(stateExists){
  const origins=read(cacheState).origins??[],origin=new URL(base).origin,count=o=>o.indexedDB?.find(d=>d.name==='mathsmap-tikz')?.stores?.[0]?.records?.length??0;
  report.cacheState={path:path.resolve(cacheState),hash:artifactHash(cacheState),origin,entriesForOrigin:count(origins.find(o=>o.origin===origin)??{}),otherOrigins:origins.filter(o=>o.origin!==origin&&count(o)).map(o=>({origin:o.origin,entries:count(o)}))};
  if(!report.cacheState.entriesForOrigin&&report.cacheState.otherOrigins.length)console.warn('Cache state has diagram entries only for other origins; IndexedDB reuse needs --base '+report.cacheState.otherOrigins[0].origin);
 }else report.cacheState=null;
 try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
 const context=await browser.newContext({viewport:{width:1600,height:1100},...(stateExists?{storageState:cacheState}:{})});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 // Pagination can occupy the page's main thread for longer than the default action timeout.
 page.setDefaultTimeout(300000);
 await page.addInitScript({content:`(()=>{const accumulate=${accumulateTikzCompilation.toString()};window.__mathsmapExportCompilation=accumulate(null,null);document.addEventListener('tikzjax-load-finished',event=>{window.__mathsmapExportCompilation=accumulate(window.__mathsmapExportCompilation,event.detail);},true);})();`});
 if(flag('--cold-diagrams'))await page.addInitScript(()=>{window.__bookletCacheMode='server-off';});
 const saveState=async()=>{if(cacheState){fs.mkdirSync(path.dirname(path.resolve(cacheState)),{recursive:true});await context.storageState({path:cacheState,indexedDB:true});}};
 const ready=async edition=>{
  const select=page.getByLabel('Booklet edition',{exact:true}),deadline=Date.now()+600000;
  while(Date.now()<deadline){
   if(await select.inputValue()!==edition)await select.selectOption(edition);
   const state=await page.locator('.flow-document').evaluate(el=>({state:el.dataset.paginationState,edition:el.dataset.paginatedEdition,error:el.querySelector('[role=alert]')?.textContent}));
   if(state.state==='error')throw Error(state.error||'Pagination failed');
   if(state.state==='ready'&&state.edition===edition)return;
   await page.waitForTimeout(200);
  }
  throw Error('Pagination timed out');
 };
 const stats=()=>page.evaluate(()=>window.TikZ?.stats?.()??null);
 const version=()=>page.evaluate(async()=>(await window.TikZ?.cacheEntries?.())?.version??null);
 // Render each edition of one project. Baseline passes hash pages only.
 const renderPass=async(name,project,{inspect,editions,publish})=>{
  const record=structuredClone(project);
  const assets=await contentAssetSignatures(record),pass={name,revision:project.revision??null,projectHash:projectReviewHash(project),editions:{},cachePublished:0};
  await routeCandidateProject(page,record);
  report.passes.push(pass);
  for(const edition of editions){
   // One browser and context throughout, but a fresh document per edition that
   // opens directly in it. Measured on Integers: re-paginating inside a document
   // whose print surface is already populated took 39-78 s per combined edition
   // from cold measurements, against 18-30 s for a fresh document.
   const editionStarted=Date.now(),timings={},previousStats=null;
   record.settings.flowEdition=edition;
   await page.goto('about:blank');
   await page.goto(base+'/#/booklet?stage=projects&project='+id,{waitUntil:'domcontentloaded',timeout:180000});
   await page.locator('.flow-document').waitFor({state:'attached',timeout:600000});
   await page.getByLabel('Booklet edition',{exact:true}).waitFor({state:'visible',timeout:600000});
   timings.loadMs=Date.now()-editionStarted;
   await ready(edition);timings.readyMs=Date.now()-editionStarted;
   const printStarted=Date.now();
   await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
   await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
   await page.emulateMedia({media:'print'});timings.printSurfaceMs=Date.now()-printStarted;
   const qa=await page.evaluate(async inspect=>{const {settleBooklet,inspectBooklet}=await import('/src/lib/booklet-qa.js');const root=document.querySelector('.project-print'),started=performance.now();await settleBooklet(root);const settleMs=Math.round(performance.now()-started);return {settleMs,pages:inspect?inspectBooklet(root,{style:true}):[],inspectMs:Math.round(performance.now()-started)-settleMs};},!!inspect).then(result=>{timings.settleMs=result.settleMs;timings.qaMs=result.inspectMs;return result.pages;});
   timings.paginationMs=Date.now()-editionStarted;
   const pages=await page.locator('.project-print .print-page').evaluateAll((elements,edition)=>elements.map(e=>{
    const origin=e.getBoundingClientRect(),round=value=>Math.round(value*2)/2;
    // Geometry makes the map sensitive to style-only shifts that leave markup unchanged.
    const layout=[...e.querySelectorAll('[data-question-id],[data-node-id],[data-edit-root],[data-diagram-id],table,.tikz-wrap,footer')].map(el=>{const r=el.getBoundingClientRect();return [el.tagName,round(r.left-origin.left),round(r.top-origin.top),round(r.width),round(r.height)];});
    const isAnswer=!!e.querySelector('.compact-answer,.answer-columns,[id*="answer-section-"]');
    return {html:e.outerHTML+'\n'+JSON.stringify(layout),blocks:e.dataset.flowBlocks?.split(',')??[],isAnswer,mode:edition.startsWith('with-')?(isAnswer?(edition.endsWith('worked')?'worked':'short'):'student'):edition,isCover:!!e.querySelector('.booklet-cover,.project-cover'),answerSectionStart:!!e.querySelector('[id*="answer-section-"]')};
   }),edition);
   // Both maps are compared within this tool, so the hash binds rendered markup,
   // geometry and assets. A local layout override in settings then selects only
   // the pages it moves instead of the whole booklet.
   const hashes=renderedPageHashes(pages,{renderer:'feedback-page-map-v1',settings:{},assets});
   const now=await stats(),result={pages:hashes,timings,tikz:tikzDelta(previousStats,now),diagramVersion:await version()};
   if(inspect){
    const diagramStarted=Date.now(),diagrams=await inspectFinalSizeDiagrams(page);timings.diagramInspectionMs=Date.now()-diagramStarted;
    const info=await page.locator('.project-print').evaluate(root=>({
     labels:[...root.querySelectorAll('.compact-answer .answer-item')].map(e=>({id:e.dataset.nodeId,label:e.querySelector('.answer-label')?.textContent,continuation:e.closest('[data-answer-continuation]')?.dataset.answerContinuation,editableFields:e.querySelectorAll('.editable-booklet-text').length,diagrams:e.querySelectorAll('[data-diagram-id]').length})),
     answerDiagramIds:[...root.querySelectorAll('.compact-answer [data-diagram-id]')].filter(e=>!e.parentElement.closest('[data-diagram-id]')).map(e=>e.dataset.diagramId),
     missingLinks:[...root.querySelectorAll('a[href^="#"]')].filter(a=>a.getClientRects().length>0&&!root.querySelector(`[id="${CSS.escape(a.getAttribute('href').slice(1))}"]`)).map(a=>a.getAttribute('href')),
     links:[...root.querySelectorAll('a[href^="#"]')].filter(a=>a.getClientRects().length>0).length
    }));
    Object.assign(result,{qa,diagrams,info});
   }
   pass.editions[edition]=result;
   if(inspect)await inspect(edition,result,record);
   // Each document holds its own in-memory diagrams and pending measurements.
   if(publish){pass.cachePublished+=(await publishBrowserDiagrams(page)).published??0;await page.evaluate(async()=>{const {measurementStore}=await import('/src/lib/booklet-render-cache.js');await measurementStore.flush();}).catch(()=>{});}
   timings.totalMs=Date.now()-editionStarted;
   await page.emulateMedia({media:'screen'});
   if(name==='candidate'||(capture&&name==='baseline'))report.completedEditions.push(edition);
  }
  return pass;
 };
  if(capture||(baselineProject&&!byBlocks)){
   const pass=await renderPass('baseline',baselineProject??candidate,{inspect:null,editions:baselineEditions,publish:true});
   for(const edition of baselineEditions)fs.writeFileSync(mapFile(edition),JSON.stringify({mode:'feedback-baseline',projectId:id,projectHash:pass.projectHash,revision:pass.revision,edition,capturedAt:new Date().toISOString(),diagramVersion:pass.editions[edition].diagramVersion,pages:pass.editions[edition].pages},null,2));
   for(const edition of baselineEditions)pass.editions[edition]={pageCount:pass.editions[edition].pages.length,timings:pass.editions[edition].timings,tikz:pass.editions[edition].tikz,diagramVersion:pass.editions[edition].diagramVersion};
   report.baseline={source:baselineProject?'project-file':'current-project',editions:baselineEditions,derivedFromStudent:derived,answersDiffer,cachePublished:pass.cachePublished};
   await saveState();write();
  }
  if(!capture){
   for(const {glob,file} of overrides)await page.route(glob,route=>route.fulfill({contentType:/\.css$/.test(file)?'text/css':'text/javascript',body:fs.readFileSync(file,'utf8')}));
   if(candidateCss){const css=fs.readFileSync(candidateCss,'utf8');await page.addInitScript(css=>{const add=()=>{const style=document.createElement('style');style.dataset.feedbackCandidate='1';style.textContent=css;document.head.appendChild(style);};if(document.head)add();else document.addEventListener('DOMContentLoaded',add);},css);}
   if(cacheOff)await page.addInitScript(()=>{window.__bookletCacheMode='off';});
   report.candidate={overrides,candidateCss:candidateCss?path.resolve(candidateCss):null,diagramCache:cacheOff?'off: a diagram input is overridden':'normal'};
   const student={pages:[],selected:[]};
   const candidatePass=await renderPass('candidate',candidate,{editions:[...editions,...checksOnly],publish:!cacheOff,inspect:async(edition,result,record)=>{
    const onlyChecks=checksOnly.includes(edition),isDerived=derived.includes(edition);
    const baseline=onlyChecks||byBlocks?{pages:[],revision:null,projectHash:null}:isDerived?{pages:[],revision:baselineProject.revision??null,projectHash:null,derivedFrom:'student'}:readPageManifest(mapFile(edition));
    const selection=onlyChecks?{changed:null,checksOnly:true,boundaries:[],selected:[]}:byBlocks?selectBlockPages({pages:result.pages,blockIds,edition,extra}):isDerived?deriveCombinedSelection({pages:result.pages,studentPages:student.pages,studentSelected:student.selected,extra}):selectFeedbackPages({before:baseline.pages,after:result.pages,edition,extra});
    if(sampleDense&&!onlyChecks){
     const scores=await page.locator('.project-print .print-page').evaluateAll(pages=>pages.map(p=>(p.textContent?.length??0)+p.querySelectorAll('svg').length*120+p.querySelectorAll('tr').length*40));
     Object.assign(selection,selectDenseFeedbackPages(selection.selected,scores,sampleDense),{selectionPolicy:'dense-spacing-sample'});
    }
    requireBoundedDevelopmentExport({projectId:id,edition,hasBaseline:true,selectedPages:selection.selected.length,totalPages:result.pages.length,reason:fullReason});
    if(edition==='student')Object.assign(student,{pages:result.pages,selected:selection.selected});
    if(byBlocks&&edition==='student'){const present=new Set(result.pages.flatMap(p=>p.blocks??[])),unknown=survivingRepairBlocks(candidate,baselineProject,blockIds).filter(id=>!present.has(id));if(unknown.length)report.failures.push({edition,kind:'unknown-block',blocks:unknown});}
    const plan=inspectionPlan({edition,selected:selection.selected,boundaries:selection.boundaries,pages:result.pages,studentPages:student.pages,studentSelected:student.selected});
    const issues=result.qa.flatMap((p,i)=>p.issues.map(issue=>({page:i+1,...issue}))).concat(result.diagrams.issues);
    const entry={baseline:{pages:baseline.pages.length,revision:baseline.revision,projectHash:baseline.projectHash},pageCount:result.pages.length,pages:result.pages,...selection,inspection:plan,inspectHere:plan.filter(p=>p.inspectIn===edition).map(p=>p.page),
     issues,missingLinks:result.info.missingLinks,links:result.info.links,diagramFigures:result.diagrams.figures.length,diagramVisualFindings:result.diagrams.visualFindings,timings:result.timings,tikz:result.tikz,diagramVersion:result.diagramVersion,printed:[],pdf:null,images:[]};
    report.editionsReport[edition]=entry;
    if(issues.length)report.failures.push({edition,kind:'layout',count:issues.length});
    if(result.info.missingLinks.length)report.failures.push({edition,kind:'navigation',links:result.info.missingLinks});
    try{if(edition!=='student')assertAnswerRenderCoverage(result.info.labels,result.info.answerDiagramIds,record,edition.endsWith('worked')?'worked':'short');}catch(error){report.failures.push({edition,kind:'answer-coverage',message:error.message});}
    if(selection.selected.length){
     const file=path.join(out,`${id}-${edition}-feedback.pdf`),printStarted=Date.now();
     await page.pdf({path:file,pageRanges:selection.selected.join(','),format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});
     result.timings.printingMs=Date.now()-printStarted;
     entry.pdf={path:file,hash:artifactHash(file),pages:selection.selected};
     entry.printed=inspectPrintedPdf(file);
     if(entry.printed.length!==selection.selected.length)report.failures.push({edition,kind:'print',message:'Partial PDF page count differs from the selection'});
     if(entry.printed.some(p=>p.issues.length))report.failures.push({edition,kind:'printed-geometry',count:entry.printed.flatMap(p=>p.issues).length});
     if(!flag('--no-rasters')&&entry.inspectHere.length){
      const rasterStarted=Date.now(),positions=entry.inspectHere.map(number=>selection.selected.indexOf(number)+1);
      const rasters=await ensureSelectedPdfRasters(entry.pdf,selection.selected.length,path.join(out,'pdf-rasters'),{pages:positions});
      entry.images=rasters.images.map(image=>({page:selection.selected[image.page-1],path:image.path,hash:image.hash}));
      result.timings.rasterMs=Date.now()-rasterStarted;
     }
    }
    write();
    console.log(`${id} ${edition}: ${result.pages.length} pages, ${onlyChecks?'checks only':selection.changed?selection.changed.length+' changed':'selection derived from student'}, ${selection.selected.length} printed, ${entry.inspectHere.length} to inspect here, ${issues.length} layout issues, ${result.tikz.compiles} compiles`);
   }});
   report.passes.find(pass=>pass.name==='candidate').editions=Object.fromEntries([...editions,...checksOnly].map(edition=>[edition,{pageCount:report.editionsReport[edition].pageCount}]));
   if(!cacheOff){report.candidate.cachePublished=candidatePass.cachePublished;await saveState();}
  }
  if(errors.length)report.failures.push({kind:'browser-errors',errors});
 }catch(error){
  report.failures.push({kind:'exception',message:error.message??String(error),stack:error.stack??null});
 }finally{
  const totals=key=>Object.values(report.editionsReport).reduce((sum,entry)=>sum+(entry[key]?.length??0),0);
  report.counts={pagesHashedBaseline:report.passes.filter(p=>p.name==='baseline').flatMap(p=>Object.values(p.editions)).reduce((sum,e)=>sum+(e.pageCount??0),0),pagesHashedCandidate:Object.values(report.editionsReport).reduce((sum,e)=>sum+e.pageCount,0),pagesPrinted:totals('selected'),pagesRasterised:totals('images'),pagesToInspect:totals('inspectHere'),fullPdfs:0,
   tikz:Object.fromEntries(TIKZ_COUNTERS.map(name=>[name,[...report.passes.flatMap(p=>Object.values(p.editions).map(e=>e.tikz?.[name]??0)),...Object.values(report.editionsReport).map(e=>e.tikz?.[name]??0)].reduce((a,b)=>a+b,0)]))};
  try{await browser?.close();}catch(error){report.failures.push({kind:'browser-close',message:error.message??String(error)});}
  finalizeFeedbackReport(report,{capture});write();
 }
 console.log(JSON.stringify({report:reportFile,passed:report.passed,elapsedMs:Date.now()-started,counts:report.counts,failures:report.failures}));
 if(!report.passed)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
