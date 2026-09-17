// Diagnostic rendering for unaccepted paired-trial outputs, with real PDF pixels.
// This deliberately reports failed gates so raw candidates can be reviewed;
// it never registers full-import acceptance or writes production content.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import {normalizeEditableProject,validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {routeCandidateProject,inspectFinalSizeDiagrams} from './diagram-preflight.mjs';
import {inspectPrintedPdf} from './pdf-layout-qa.mjs';
import {ensurePdfRasters} from './pdf-rasters.mjs';
import {solidAcceptance} from '../audit-solid-visibility.mjs';
import {rendererSignature} from './verification-cache.mjs';
import {pairedTrialReport,materializeTrialCandidate} from './paired-astra-trial.mjs';

const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const ref=f=>({path:path.resolve(f),hash:createHash('sha256').update(fs.readFileSync(f)).digest('hex')});
export function composeTrialProjects({out,arm}){
 const root=path.resolve(out),summary=pairedTrialReport(root);if(!summary.arms[arm])throw Error('Unknown paired arm');
 const items=summary.arms[arm].rows.filter(r=>r.output).map(r=>{
  const dir=path.dirname(r.output.path),file=path.join(dir,'project.json');
  if(fs.existsSync(file))return {id:r.id,source:ref(file),project:read(file)};
  try{const sample=read(path.join(root,'samples',r.id+'.json')),built=materializeTrialCandidate(read(r.output.path),sample,'trial-'+arm+'-'+r.id);return {id:r.id,source:r.output,project:built.project,diagnosticMaterialization:true};}catch{return null;}
 }).filter(Boolean);
 if(!items.length)throw Error('No materialized trial candidates to render');
 const combined=structuredClone(items[0].project);combined.id='trial-'+arm;combined.title='Astra paired authoring trial';combined.sections=[];combined.topics=[];combined.source={type:'paired-trial',trialOnly:true,unaccepted:true};combined.settings.layoutOverrides={blockLayouts:{}};
 const bindings=[];
 for(const item of items){
  const ids=new Set(),collect=v=>{if(!v||typeof v!=='object')return;if(v.id)ids.add(v.id);for(const x of Object.values(v))if(x&&typeof x==='object')collect(x);};collect(item.project.sections);collect(item.project.settings.layoutOverrides);
  const topics=new Map(item.project.topics.map(t=>[t.id,item.id+'-'+t.id]));
  const renameString=v=>topics.get(v)??(ids.has(v)?item.id+'-'+v:[...ids].some(id=>v.startsWith(id+'/')||v.startsWith(id+'#'))?item.id+'-'+v:v);
  const rename=v=>typeof v==='string'?renameString(v):Array.isArray(v)?v.map(rename):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[renameString(k),rename(x)])):v;
  const sections=rename(item.project.sections);combined.sections.push(...sections);combined.topics.push(...item.project.topics.map(t=>({...t,id:topics.get(t.id),title:t.title})));
  Object.assign(combined.settings.layoutOverrides.blockLayouts,rename(item.project.settings.layoutOverrides?.blockLayouts??{}));bindings.push({id:item.id,source:item.source,diagnosticMaterialization:item.diagnosticMaterialization??false,sectionIds:sections.map(s=>s.id),blockIds:sections.flatMap(s=>s.blocks.map(b=>b.id))});
 }
 const project=normalizeEditableProject(combined),validation=validateEditableProject(project),file=path.join(root,arm,'combined-'+Date.now()+'.json');fs.writeFileSync(file,JSON.stringify(project,null,2));return {project,file,validation,bindings,omitted:summary.arms[arm].rows.filter(r=>!items.some(i=>i.id===r.id)).map(r=>r.id)};
}
export async function renderTrialArm({out,arm,base,editions=['student','short','worked','teaching']}){
 const root=path.resolve(out),composed=composeTrialProjects({out:root,arm}),directory=path.join(root,arm,'render-'+Date.now());fs.mkdirSync(directory);
 const report={trialOnly:true,acceptance:'pending',project:ref(composed.file),validation:composed.validation,bindings:composed.bindings,omitted:composed.omitted,renderer:rendererSignature(),startedAt:new Date().toISOString(),reports:[]},started=Date.now();
 try{report.solidVisibility=solidAcceptance(composed.project,{});}catch(error){report.solidVisibilityError=error.message;}
 const save=()=>fs.writeFileSync(path.join(directory,'render-report.json'),JSON.stringify({...report,elapsedMs:Date.now()-started},null,2));
 let server,browser;
 try{
  if(!base){server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,open:false}});await server.listen();base='http://127.0.0.1:'+server.httpServer.address().port;}
  try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
  const page=await browser.newPage({viewport:{width:1500,height:1100}});const browserErrors=[];page.on('pageerror',e=>browserErrors.push(e.message));
  await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());
  for(const label of editions){
   const edition=label==='teaching'?'student':label,project=structuredClone(composed.project),began=Date.now(),record={label,edition,status:'pending'};
   project.settings.flowEdition=edition;if(label==='teaching'){
    project.sections=project.sections.filter(s=>s.phase==='teaching');const topicIds=new Set(project.sections.map(s=>s.topicId));project.topics=project.topics.filter(t=>topicIds.has(t.id));
    Object.assign(project.settings,{showKeyIdeasAnswers:true,showReviewAnswers:true,showIdentifyAnswers:true,showGuidedPracticeAnswers:true,showTheorySolutions:true});
   }
   await routeCandidateProject(page,project);
   try{
    await page.goto('about:blank');await page.goto(base+'/#/booklet?stage=projects&project='+project.id,{waitUntil:'domcontentloaded',timeout:60000});
    await page.getByLabel('Booklet edition',{exact:true}).waitFor({state:'visible',timeout:180000});await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);
    await page.waitForFunction(expected=>{const el=document.querySelector('.flow-document');return el?.dataset.paginationState==='error'||el?.dataset.paginationState==='ready'&&el?.dataset.paginatedEdition===expected;},edition,{timeout:180000});
    if(await page.locator('.flow-document').getAttribute('data-pagination-state')==='error')throw Error(await page.locator('.flow-document [role=alert]').innerText());
    await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.emulateMedia({media:'print'});
    record.qa=await page.evaluate(async()=>{const {settleBooklet,inspectBooklet}=await import('/src/lib/booklet-qa.js');const el=document.querySelector('.project-print');await settleBooklet(el);return inspectBooklet(el,{style:true});});
    record.diagrams=await inspectFinalSizeDiagrams(page);record.pageMap=await page.locator('.project-print .print-page').evaluateAll(nodes=>nodes.map(n=>({page:Number(n.dataset.flowPage),blocks:n.dataset.flowBlocks?.split(',')??[],text:n.innerText})));
    const file=path.join(directory,label+'.pdf');await page.pdf({path:file,format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});record.pdf=ref(file);
    try{record.printed=inspectPrintedPdf(file);const rasters=ensurePdfRasters(record.pdf,record.pageMap.length,path.join(directory,'pdf-rasters'));record.images=rasters.images;record.rasterMetrics=rasters.metrics;}catch(error){record.pdfQaError=error.message;}
    record.status='rendered';record.acceptance='pending';
   }catch(error){record.status='failed';record.error=error.message;const file=path.join(directory,label+'-failure.png');try{await page.screenshot({path:file,fullPage:true});record.failureImage=ref(file);}catch{}}
   record.elapsedMs=Date.now()-began;record.browserErrors=[...browserErrors];report.reports.push(record);save();await page.emulateMedia({media:'screen'});console.log(JSON.stringify({arm,label,status:record.status,pages:record.pageMap?.length,error:record.error}));
  }
 }finally{save();await browser?.close();await server?.close();}
 return {directory,...report,elapsedMs:Date.now()-started};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
 renderTrialArm({out:arg('--out'),arm:arg('--arm'),base:args.includes('--base')?arg('--base'):undefined,editions:args.includes('--editions')?arg('--editions').split(','):undefined}).then(r=>console.log(JSON.stringify({directory:r.directory,omitted:r.omitted,reports:r.reports.map(p=>({label:p.label,status:p.status,pages:p.pageMap?.length}))}))).catch(e=>{console.error(e.stack);process.exitCode=1;});
}
