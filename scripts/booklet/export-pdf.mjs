#!/usr/bin/env node
// Export the current project surface; --project is a read-only in-memory preview.
import {inspectPrintedPdf} from './pdf-layout-qa.mjs';
import {publishBrowserDiagrams} from './render-cache-server.mjs';
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { materializeLegacyProject } from '../../src/lib/editable-booklet-model.js';
function arg(name, fallback = null) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; }
const base = arg('--base', 'http://localhost:5173').replace(/\/$/, '');
const output = resolve(arg('--out', '.booklet-work/booklet.pdf'));
const mode = arg('--mode', 'student');
const draft=process.argv.includes('--draft');
if (!['student', 'short', 'worked','with-short','with-worked'].includes(mode)) throw new Error('--mode must be student, short, worked, with-short or with-worked');
const projectFile = arg('--project');
let projectId = arg('--project-id');
let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
const context = await browser.newContext({ viewport: { width: 1600, height: 1200 }, ...(arg('--cache-state') ? {storageState:arg('--cache-state')} : {}) });
const page = await context.newPage();
const renderErrors = [];
page.on('pageerror', error => renderErrors.push(error.message));
try {
  // Optional read-only renderer baseline for same-snapshot PDF regression checks.
  const baselineRuntime=arg('--baseline-runtime');
  // A frozen production preview has no source-module route; retain the same QA checks.
  if(arg('--qa-module'))await page.route('**/src/lib/booklet-qa.js',route=>route.fulfill({contentType:'text/javascript',body:readFileSync(resolve(arg('--qa-module')),'utf8')}));
  if(baselineRuntime)await page.route('**/libs/maths-editor/document-model.mjs',route=>route.fulfill({contentType:'text/javascript',body:readFileSync(resolve(baselineRuntime,'document-model.mjs'),'utf8')}));
  await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));
 await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());
  if (projectFile) {
    const project = materializeLegacyProject(JSON.parse(readFileSync(resolve(projectFile), 'utf8').replace(/^\uFEFF/, '')));
    projectId = project.id;
    await page.route('**/__booklet/projects?*', (route)=>route.fulfill({json:[{id:project.id,title:project.title}]}));
    await page.route('**/__booklet/projects/'+encodeURIComponent(projectId)+'/open',route=>route.fulfill({json:{project,bankSync:{items:[]},bankSyncError:''}}));
    await page.route('**/__booklet/projects', (route) => route.request().method() === 'GET' ? route.fulfill({ json: [project] }) : route.abort());
    await page.route('**/__booklet/projects/' + encodeURIComponent(projectId), (route) => route.request().method() === 'GET' ? route.fulfill({ json: project }) : route.abort());
  }
  const query = new URLSearchParams({ stage: 'projects' });
  if (projectId) query.set('project', projectId);
  await page.goto(base + '/#/booklet?' + query, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('.project-print').waitFor({ state: 'attached', timeout: 60000 });
  const flexible=await page.locator('.project-print.flexible-print').count()>0;
  if(flexible){
    // Project hydration may reset the edition selector. Wait for that first map
    // before selecting the requested edition, then match readiness to that mode.
    await page.waitForFunction(()=>['ready','error'].includes(document.querySelector('.project-print')?.dataset.paginationState),null,{timeout:600000});
    await page.getByLabel('Booklet edition',{exact:true}).selectOption(mode);
    if(process.argv.includes('--hide-theory')){await page.getByRole('button',{name:'PDF',exact:true}).click();await page.getByLabel('Show theory solutions',{exact:true}).uncheck();}
    await page.waitForFunction(mode=>{const el=document.querySelector('.project-print');return el?.dataset.paginationState==='error'||el?.dataset.paginationState==='ready'&&el.dataset.flowEdition===mode;},mode,{timeout:600000});
    const state=await page.locator('.project-print').getAttribute('data-pagination-state');
    if(state==='error')throw Error(await page.locator('.flow-document').innerText());
    const issues=JSON.parse(await page.locator('.project-print').getAttribute('data-layout-issues')||'[]');
    if(issues.length){if(!draft)throw Error('Pagination needs attention: '+JSON.stringify(issues));console.warn('Draft pagination findings: '+JSON.stringify(issues));}
  }else{
  if(mode.startsWith('with-'))throw Error('Combined editions require a flexible project.');
  if(!await page.getByLabel('Practice answers',{exact:true}).isVisible())await page.getByRole('button',{name:'PDF',exact:true}).click();
  await page.getByLabel('Practice answers', { exact: true }).selectOption(mode === 'student' ? 'none' : mode);
  }
  await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
  await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
  // Wait for the selected edition's DOM, not merely the select's change event.
  if(!flexible)await page.waitForFunction(mode=>{
    const root=document.querySelector('.project-print');
    if(mode==='worked')return Boolean(root?.querySelector('.worked-content'));
    if(mode==='short')return root?.classList.contains('short-answers');
    return root&&!root.classList.contains('short-answers')&&!root.querySelector('.answers-divider');
  },mode);
  if(!flexible&&process.argv.includes('--hide-theory'))await page.getByLabel('Show theory solutions',{exact:true}).uncheck();
  await page.emulateMedia({ media: 'print' });
  console.log('Preparing print assets for ' + mode + ' export…');
  await page.evaluate(async () => {
    const root = document.querySelector('.project-print');
    if (!root?.innerText.trim() || !root.querySelector('.print-page')) throw new Error('The print view is empty');
    if (window.TikZ && !await window.TikZ.flushPending(root, 300000)) throw new Error('The print diagram queue did not finish');
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('.project-print img')].map(img => img.decode()));
  });
  await page.waitForFunction(() => [...document.querySelectorAll('.project-print .tikz-wrap')].every(el => el.querySelector('.tikz-error') || [...el.querySelectorAll('svg')].some(svg => !svg.querySelector('animate'))), null, { timeout: 300000 });
  if (await page.locator('.project-print .tikz-error').count()) throw new Error('TikZ rendering failed; export stopped');
  if (renderErrors.length) throw new Error('Page rendering failed: ' + renderErrors.join('; '));
  if(arg('--metrics'))writeFileSync(resolve(arg('--metrics')),JSON.stringify(await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    const collisions=[];for(const article of document.querySelectorAll('.project-print .booklet-page')){const footer=article.querySelector('footer')?.getBoundingClientRect(),bounds=article.getBoundingClientRect();if(!footer?.width)continue;for(const el of article.querySelectorAll('main table,main p,main [data-type=annotated-equation],main .text-line,main .tikz-wrap,main [data-table-annotations] text')){const r=el.getBoundingClientRect();if(r.bottom>footer.top-4||r.left<bounds.left-1||r.right>bounds.right+1)collisions.push({page:article.dataset.pageNumber,id:el.dataset.id,text:el.textContent.slice(0,70),bottom:r.bottom,footerTop:footer.top});}}
    return {collisions,tabs:[...document.querySelectorAll('.project-print p:has([data-tab])')].map(p=>({paragraph:rect(p),width:getComputedStyle(p).width,html:p.innerHTML,stops:p.dataset.tabStops,tabs:[...p.querySelectorAll('[data-tab]')].map(t=>({rect:rect(t),style:t.getAttribute('style')}))})),pages:[...document.querySelectorAll('.project-print .print-page')].map(p=>({page:rect(p),footer:p.querySelector('footer')?rect(p.querySelector('footer')):null,content:p.querySelector('main')?rect(p.querySelector('main')):null}))};
  }),null,2));
  const qa=await page.evaluate(async()=>{const {settleBooklet,inspectBooklet}=await import('/src/lib/booklet-qa.js');const root=document.querySelector('.project-print');await settleBooklet(root);return inspectBooklet(root,{style:document.querySelector('[data-house-style="1.1.0"]')!=null});});
  const edition=await page.evaluate(()=>({mode:document.querySelector('[aria-label="Practice answers"]')?.value,worked:document.querySelectorAll('.project-print .worked-content').length}));
  if(flexible){if(await page.locator('.project-print').getAttribute('data-flow-edition')!==mode)throw Error('The requested edition changed');}
  else if(edition.mode!==(mode==='student'?'none':mode)||(mode==='worked'&&!edition.worked))throw Error('The requested answer edition did not remain selected');
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output+'.qa.json',JSON.stringify(qa,null,2));
  if(flexible)writeFileSync(output+'.pages.json',JSON.stringify(await page.locator('.project-print .print-page').evaluateAll(els=>els.map(e=>({page:Number(e.dataset.flowPage),blocks:e.dataset.flowBlocks.split(','),questions:[...e.querySelectorAll('[data-question-id]')].map(q=>q.dataset.questionId)}))),null,2));
  if(qa.some(p=>p.issues.length)){if(!draft)throw Error('Layout/style QA failed; see '+output+'.qa.json');console.warn('Draft layout findings: '+output+'.qa.json');}
  mkdirSync(dirname(output), { recursive: true });
  await page.pdf({ path: output+'.partial.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
  const printed=inspectPrintedPdf(output+'.partial.pdf');
  writeFileSync(output+'.printed-qa.json',JSON.stringify(printed,null,2));
  if(printed.some(p=>p.issues.length)){if(!draft)throw Error('Printed PDF geometry failed; see '+output+'.printed-qa.json');console.warn('Draft print findings: '+output+'.printed-qa.json');}
  renameSync(output+'.partial.pdf',output);
  const sharedCache=await publishBrowserDiagrams(page);
  const cacheOutput=arg('--save-cache-state');
  let cacheMetrics;
  if(cacheOutput){mkdirSync(dirname(resolve(cacheOutput)),{recursive:true});await context.storageState({path:resolve(cacheOutput),indexedDB:true});cacheMetrics=await page.evaluate(()=>{const s=window.TikZ?.stats?.();return s?{compiles:s.compiles,memoryHits:s.memoryHits,idbHits:s.idbHits,driverHits:s.driverHits}:null;});writeFileSync(output+'.render-metrics.json',JSON.stringify({cacheOutput:resolve(cacheOutput),tikz:cacheMetrics},null,2));}
  console.log(JSON.stringify({ output, projectId, mode, draft, sharedCache, ...(cacheOutput?{cacheOutput:resolve(cacheOutput),tikz:cacheMetrics}:{}) }));
} catch (error) {
  console.error('Booklet PDF export failed:', error.message);
  if(renderErrors.length)console.error('Browser errors:',renderErrors.join('; '));
  console.error(await page.evaluate(() => [...document.querySelectorAll('.project-print .tikz-wrap')].filter(el => ![...el.querySelectorAll('svg')].some(svg => !svg.querySelector('animate'))).map(el => ({ question: el.closest('[data-question-id]')?.dataset.questionId, error: el.querySelector('.tikz-error')?.textContent, state: el.innerHTML.slice(0, 1200) }))).catch(() => 'Print page unavailable'));
  process.exitCode = 1;
}
finally { await browser.close(); }

