// First-pass diagnostic exports: failures are observations, never acceptance.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {chromium} from 'playwright-core';
import {routeCandidateProject} from './diagram-preflight.mjs';
import {inspectPrintedPdf} from './pdf-layout-qa.mjs';
import {build} from 'esbuild';
import {gunzipSync} from 'node:zlib';
import {fingerprintPpm} from './edition-comparison.mjs';
import {ensurePdfRasters} from './pdf-rasters.mjs';
import {inspectPdfNavigation} from './pdf-navigation-qa.mjs';
import {solidAcceptance} from '../audit-solid-visibility.mjs';
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1];};
const projectFile=path.resolve(arg('--project')),out=path.resolve(arg('--out'));fs.mkdirSync(out,{recursive:true});
const project=JSON.parse(fs.readFileSync(projectFile,'utf8'));
const teaching=process.argv.includes('--teaching');
if(teaching)Object.assign(project.settings,{showKeyIdeasAnswers:true,showReviewAnswers:true,showIdentifyAnswers:true,showGuidedPracticeAnswers:true,showTheorySolutions:true});
const diagnosticGeometry=solidAcceptance(project,{});
const bundle=await build({stdin:{contents:"export {settleBooklet,inspectBooklet} from './src/lib/booklet-qa.js'; export {inspectDiagramLabelLayout,measureDiagramLabels} from './src/lib/diagram-typography.js';",resolveDir:process.cwd()},bundle:true,format:'esm',write:false});
const projectHash=crypto.createHash('sha256').update(fs.readFileSync(projectFile)).digest('hex');
const editions=arg('--editions','student,short,worked,with-short,with-worked').split(',');
// Open directly in the first requested edition and let Studio finish opening
// before changing it. Superseding initial pagination can unmount its snippets.
project.settings.flowEdition=editions[0];
const pdf=process.argv.includes('--pdf'),started=Date.now();
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const context=await browser.newContext({viewport:{width:1600,height:1200}}),page=await context.newPage();
// Keep the original trial's offline font environment reproducible across runs.
await page.route(/https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)\//,r=>r.abort());
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await routeCandidateProject(page,project);
await page.route('**/benchmark/qa.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
const reports=[];
try{
 await page.goto(arg('--base','http://127.0.0.1:5174')+'/#/booklet?stage=projects&project='+project.id,{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('.project-print').waitFor({state:'attached',timeout:60000});
 await page.waitForFunction(()=>{const root=document.querySelector('.flow-document');return root?.dataset.paginationState==='ready'||root?.dataset.paginationState==='error';},{},{timeout:600000});
 for(const edition of editions){
  const began=Date.now(),r={edition,projectHash,teachingAnswers:teaching,startedAt:new Date(began).toISOString(),status:'pending',screenshots:[]};
  try{
   await page.getByLabel('Booklet edition',{exact:true}).waitFor({state:'visible',timeout:600000});
   await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await page.waitForFunction(edition=>{const root=document.querySelector('.flow-document');return root?.dataset.paginationState==='error'||root?.dataset.paginationState==='ready'&&root?.dataset.paginatedEdition===edition;},edition,{timeout:600000});
   if(await page.locator('.flow-document').getAttribute('data-pagination-state')==='error')throw Error((await page.locator('body').innerText()).slice(0,2500));
   await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.emulateMedia({media:'print'});
   r.qa=await page.evaluate(async()=>{const q=await import('/benchmark/qa.js');const root=document.querySelector('.project-print');await q.settleBooklet(root);return q.inspectBooklet(root,{style:true});});
   r.dom=await page.locator('.project-print').evaluate(root=>({text:root.innerText,layoutIssues:root.dataset.layoutIssues,katexErrors:[...root.querySelectorAll('.katex-error')].map(e=>e.textContent),tikzErrors:[...root.querySelectorAll('.tikz-error')].map(e=>e.textContent),pages:[...root.querySelectorAll('.print-page')].map(e=>({blocks:e.dataset.flowBlocks,text:e.innerText})),links:[...root.querySelectorAll('a[href^="#"]')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>({href:e.getAttribute('href'),exists:!!root.querySelector('[id="'+CSS.escape(e.getAttribute('href').slice(1))+'"]')}))}));
   r.diagrams=await page.evaluate(async()=>{const q=await import('/benchmark/qa.js');return [...document.querySelectorAll('.project-print .tikz-wrap svg')].filter(e=>e.getBoundingClientRect().width).map(svg=>({id:svg.closest('[data-diagram-id]')?.dataset.diagramId,labels:q.measureDiagramLabels(svg),issues:q.inspectDiagramLabelLayout(svg)}));});
   const nodes=page.locator('.project-print .print-page');for(let i=0;i<await nodes.count();i++){const f=path.join(out,`${edition}-${String(i+1).padStart(3,'0')}.png`);await nodes.nth(i).screenshot({path:f,timeout:60000});r.screenshots.push(f);}
   if(pdf&&r.dom.pages.length){r.pdf=path.join(out,edition+'.pdf');await page.pdf({path:r.pdf,format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});try{r.printed=inspectPrintedPdf(r.pdf);}catch(e){r.pdfQaError=e.message;}}
   if(r.pdf){try{const reference={path:r.pdf,hash:crypto.createHash('sha256').update(fs.readFileSync(r.pdf)).digest('hex')};r.rasters=ensurePdfRasters(reference,r.dom.pages.length,path.join(out,edition+'-rasters'));r.navigation=inspectPdfNavigation(r.pdf,r.dom.links);}catch(e){r.rasterOrNavigationError=e.message;}}
   r.status=r.dom.tikzErrors.length||r.dom.katexErrors.length?'render-defects':'rendered';
  }catch(e){r.status='failed';r.error=e.message;try{const f=path.join(out,edition+'-failure.png');await page.screenshot({path:f,fullPage:true,timeout:10000});r.screenshots.push(f);}catch{}}
  r.elapsedMs=Date.now()-began;r.pageErrors=[...errors];reports.push(r);fs.writeFileSync(path.join(out,'render-report.json'),JSON.stringify({diagnosticOnly:true,diagnosticGeometry,projectFile,projectHash,elapsedMs:Date.now()-started,reports},null,2));console.log(JSON.stringify({edition,status:r.status,pages:r.dom?.pages?.length,error:r.error?.slice(0,300),seconds:Math.round(r.elapsedMs/1000)}));
  await page.emulateMedia({media:'screen'});
 }
}catch(e){fs.writeFileSync(path.join(out,'render-report.json'),JSON.stringify({diagnosticOnly:true,diagnosticGeometry,projectFile,projectHash,elapsedMs:Date.now()-started,error:e.message,pageErrors:errors,reports},null,2));throw e;}
finally{await browser.close();}

// Diagnostic equivalence only. Matching bodies do not approve either candidate.
const byEdition=Object.fromEntries(reports.map(r=>[r.edition,r]));
const comparison={diagnosticOnly:true,dpi:144,excludedFooterMm:15,pages:[]};
for(const edition of ['with-short','with-worked']){
 const combined=byEdition[edition],student=byEdition.student,answer=byEdition[edition.slice(5)];
 if(!combined?.rasters||!student?.rasters||!answer?.rasters)continue;
 const questionCount=student.rasters.images.length;
 const expected=questionCount+answer.rasters.images.length;
 for(const im of combined.rasters.images){
  const source=im.page<=questionCount?student:answer,sourcePage=im.page<=questionCount?im.page:im.page-questionCount;
  const other=source.rasters.images[sourcePage-1];
  let reason=combined.rasters.images.length!==expected?'Different pagination':im.page===1?'Cover':im.page===questionCount||im.page===questionCount+1?'Section boundary':null;
  const a=fingerprintPpm(gunzipSync(fs.readFileSync(im.raster.path)));
  const b=other?fingerprintPpm(gunzipSync(fs.readFileSync(other.raster.path))):null;
  if(!reason)reason=!a.a4||!b?.a4?'Unsupported page size':a.bodyHash!==b.bodyHash?'Different pixels':null;
  comparison.pages.push({edition,page:im.page,image:im.path,sourceEdition:source.edition,sourcePage,sourceImage:other?.path,bodyEqual:!!b&&a.bodyHash===b.bodyHash,requiresFullInspection:!!reason,reason,bodyHash:a.bodyHash,sourceBodyHash:b?.bodyHash,raster:im.raster,sourceRaster:other?.raster});
 }
}
fs.writeFileSync(path.join(out,'pixel-comparison.json'),JSON.stringify(comparison,null,2));
