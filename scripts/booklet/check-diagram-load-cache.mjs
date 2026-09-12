// Isolated native-diagram pixel parity and corrupt-cache fallback. No API writes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {applyCreationPreset} from '../../src/lib/booklet-creation.js';
import {studioProject} from '../../src/lib/booklet-review-model.js';
const base=process.argv[2]??'http://127.0.0.1:5173';
const project=studioProject(applyCreationPreset(createEditableProject({id:'diagram-cache-check',title:'Diagram cache check',sections:[{id:'content',title:'Content',phase:'teaching',blocks:[{id:'figure',type:'diagram',format:'tikz',widthMm:78,code:String.raw`\begin{tikzpicture}\draw (0,0)--(3,0)--(1,2)--cycle;\node[below] at (1.5,0) {$x^2$};\node[left] at (.5,1) {$5$};\end{tikzpicture}`}]}]})));
const digest=value=>createHash('sha256').update(value).digest('hex');
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
let compiled,expectedPixels;const resizedPixels=new Map();
try{
 for(const scenario of ['fresh','cached','corrupt','unavailable','edited']){
  if(scenario==='edited')project.sections[0].blocks[0].code=project.sections[0].blocks[0].code.replace('(1,2)','(2,3)');
  const context=await browser.newContext({viewport:{width:1600,height:1200}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/__booklet/**',route=>{
   const req=route.request(),url=new URL(req.url());if(req.method()!=='GET')return route.abort();
   if(url.pathname==='/__booklet/projects')return route.fulfill({json:[{id:project.id,title:project.title}]});
   if(url.pathname.endsWith('/open'))return route.fulfill({json:{project,bankSync:{items:[]},bankSyncError:''}});
   if(/\/render-cache\/[a-f0-9]{64}\//.test(url.pathname)){
    const key=url.pathname.split('/').at(-1),entry=compiled?.entries.find(e=>e.key===key);
    if(!entry||scenario==='unavailable')return route.fulfill({status:503,json:{}});
    const row={...entry,version:compiled.version,checksum:digest(entry.svg)};
    if(scenario==='corrupt')row.svg='<svg>corrupt</svg>';
    return route.fulfill({json:row});
   }
   return route.continue();
  });
  await page.goto(base+'/#/booklet?stage=projects&project='+project.id,{waitUntil:'domcontentloaded'});
  try{await page.waitForFunction(()=>['ready','error'].includes(document.querySelector('.flow-document')?.dataset.paginationState)&&!document.querySelector('.workspace-loading'),null,{timeout:60000});}catch(error){console.error(await page.locator('body').innerText());console.error(errors);throw error;}
  if(await page.locator('.flow-document').getAttribute('data-pagination-state')==='error')throw Error(await page.locator('.flow-document').innerText());
  const figure=page.locator('.flow-page-content .tikz-wrap').first();await figure.waitFor();
  const pixels=digest(await figure.screenshot()),stats=await page.evaluate(()=>window.TikZ.stats());
  assert.deepEqual(errors,[]);
  if(scenario==='fresh'){compiled=await page.evaluate(()=>window.TikZ.cacheEntries());expectedPixels=pixels;assert.ok(compiled.entries.length>0);}
  else if(scenario==='edited')assert.notEqual(pixels,expectedPixels,'Edited diagram source was not rendered');
  else assert.equal(pixels,expectedPixels,'Fresh and cached native diagrams differ visually');
  if(scenario!=='edited')for(const width of [60,100]){
   await figure.evaluate(async(el,width)=>{const svg=el.querySelector('svg');svg.style.width=width+'mm';svg.style.height='auto';const {calibrateDiagramTypography}=await import('/src/lib/diagram-typography.js');calibrateDiagramTypography(el);},width);
   const resized=digest(await figure.screenshot());if(scenario==='fresh')resizedPixels.set(width,resized);else assert.equal(resized,resizedPixels.get(width),'Resized cached diagram differs visually');
  }
  assert.equal(stats.compiles>0,scenario!=='cached');
  if(scenario==='cached')assert.ok(stats.serverHits>0);
  console.log(JSON.stringify({scenario,pixelHash:pixels,compiles:stats.compiles,serverHits:stats.serverHits}));
  await context.close();
 }
}finally{await browser.close();}
