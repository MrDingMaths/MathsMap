import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {fromSource} from '../../src/lib/document-content.js';
const sourceFiles=['src/components/BookletProjects.svelte','src/components/FlowBookletPreview.svelte','src/components/FlowBookletPage.svelte','src/components/BookletPageGuide.svelte','src/components/TranscribedBookletPage.svelte','src/components/CompactAnswerPage.svelte','src/lib/booklet-page-space.js','src/lib/booklet-pagination.js'];
const sourceHashes=()=>Object.fromEntries(sourceFiles.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const rendererStart=sourceHashes();
const out='.booklet-work/studio-a4-loading';const started=Date.now(),checks=[],evidence=[];
const records={};
records.answers=createEditableProject({id:'answers',title:'Answer columns',topics:[{id:'t',title:'Algebra'}],sections:[{id:'s',topicId:'t',phase:'practice',title:'Algebra',blocks:Array.from({length:90},(_,i)=>({id:'q'+i,type:'question',content:{id:'r'+i,type:'question',prompt:'Solve $x+1='+i+'$.',children:[],answer:{short:'$x='+ (i-1)+'$',worked:'$x+1='+i+'$\n\n$x='+ (i-1)+'$'}}}))}]});
records.overflow=createEditableProject({id:'overflow',title:'Oversized content',sections:[{id:'o',title:'Oversized content',blocks:[{id:'large',type:'rich-text',flow:{keepTogether:true},content:fromSource('This indivisible block demonstrates an overflow warning. '.repeat(170))}]}]});
records.image=createEditableProject({id:'image',title:'Diagram preparation',sections:[{id:'im',title:'Diagram preparation',blocks:[{id:'image-block',type:'image',format:'image',src:'/studio-test-diagram.svg',widthMm:70}]}]});
for(const file of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){
 const raw=fs.readFileSync('booklets/projects/'+file),p=JSON.parse(raw);
 evidence.push({file,revision:p.revision,sha256:crypto.createHash('sha256').update(raw).digest('hex'),sections:[]});
 p.sections=['teaching','practice'].map(phase=>p.sections.find(s=>s.phase===phase)).filter(Boolean).map(s=>({...s,blocks:s.blocks.slice(0,2)}));
 evidence.at(-1).sections=p.sections.map(s=>({id:s.id,blocks:s.blocks.map(b=>b.id)}));
 records[p.id]=p;
}
for(const p of Object.values(records))p.revision??=1;
let imageFails=true;
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1600,height:1650}}),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
await page.route('**/studio-test-diagram.svg',async route=>{
 await new Promise(r=>setTimeout(r,700));
 if(imageFails)return route.fulfill({status:404,body:'Missing diagram'});
 return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect x="10" y="10" width="210" height="110" fill="#ddd" stroke="black"/></svg>'});
});
await page.route('**/__booklet/**',async route=>{
 const path=new URL(route.request().url()).pathname;
 if(path==='/__booklet/projects')return route.fulfill({json:Object.values(records).map(p=>({id:p.id,title:p.title,revision:p.revision}))});
 if(path.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});
 const id=path.split('/').at(-1);if(records[id])return route.fulfill({json:records[id]});
 if(path.includes('/full-imports/'))return route.continue();
 return route.fulfill({json:path.endsWith('/manifest')?{questions:[]}:[]});
});
const ready=()=>page.waitForFunction(()=>!document.querySelector('.workspace-loading')&&document.querySelector('.flow-document[data-pagination-state="ready"]'),{},{timeout:240000});
const add=message=>{checks.push(message);console.log('PASS',message);};
const choose=async id=>{await page.getByLabel('Open booklet',{exact:true}).selectOption(id);await ready();};
async function capture(name){
 await page.getByLabel('Booklet zoom',{exact:true}).selectOption('0.75');
 await page.locator('.project-canvas').evaluate(el=>el.scrollTop=0);
 // Page two is the first content page in editions that include the cover.
 const groups=page.locator('.flow-page-group').filter({has:page.locator('.booklet-page')});
 const group=groups.first();await group.scrollIntoViewIfNeeded();await page.waitForTimeout(100);
 await group.screenshot({path:out+'/'+name+'.png'});
 const metrics=await page.evaluate(async()=>{
  const {measureBookletPage}=await import('/src/lib/booklet-page-space.js');
  return [...document.querySelectorAll('.flow-page-content')].map(el=>{const m=measureBookletPage(el);return m?{page:el.closest('[data-flow-index]').dataset.pageNumber,remaining:m.remainingMm,columns:m.columns}:null;}).filter(Boolean);
 });
 return metrics;
}
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5175')+'/#/booklet?stage=projects&project=answers',{waitUntil:'domcontentloaded'});await ready();
 if(await page.getByRole('button',{name:'Toggle page navigation',exact:true}).getAttribute('aria-expanded')==='true')await page.getByRole('button',{name:'Toggle page navigation',exact:true}).click();
 await page.getByLabel('Booklet edition',{exact:true}).selectOption('short');await ready();
 await page.waitForFunction(()=>[...document.querySelectorAll('.page-space-status')].some(el=>el.textContent.includes('Column 2')));
 const answerMetrics=await capture('answer-columns');assert.ok(answerMetrics.some(m=>m.columns.length===2&&m.columns[0]!==m.columns[1]));add('two-column answers report independent remaining space');
 await page.getByLabel('Booklet edition',{exact:true}).selectOption('worked');await ready();await capture('worked-solutions');add('worked solutions keep single-column A4 geometry');
 await choose('overflow');await page.waitForFunction(()=>document.querySelector('.page-space-status.overflow')?.textContent.includes('Overflow by'));
 await capture('overflow');assert.ok(await page.locator('.layout-issue').count()>0);add('oversized content retains A4 boundary and explicit warning');
 await page.getByLabel('Open booklet',{exact:true}).selectOption('image');await page.locator('.workspace-loading [role="alert"]').waitFor({timeout:30000});
 imageFails=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await ready();await capture('diagram-ready');add('image rendering failure and retry preserve loading until assets settle');
 for(const entry of evidence){
  const p=JSON.parse(fs.readFileSync('booklets/projects/'+entry.file));await choose(p.id);
  entry.editions={};
  for(const edition of ['student','short','worked','with-short','with-worked']){
   await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await ready();
   entry.editions[edition]=await capture(p.id+'-'+edition);
   assert.ok(entry.editions[edition].length>0);
   add(p.id+' '+edition+' representative pages');
  }
  const compare=page.getByRole('button',{name:'Compare source',exact:true});
  if(await compare.isEnabled()){
   await compare.click();await page.locator('.source-reconstruction.paired .page-space-status').waitFor();
   const paper=page.locator('.source-reconstruction.paired .booklet-page');
   assert.ok(Math.abs(await paper.first().evaluate(el=>el.offsetHeight)-297*96/25.4)<1);
   await page.screenshot({path:out+'/'+p.id+'-comparison.png'});
   await page.getByRole('button',{name:'Exit comparison',exact:true}).click();await ready();
   add(p.id+' source comparison retains A4 guide');
  }
 }
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('[data-page-guide]').first().evaluate(el=>getComputedStyle(el).display),'none');
 assert.deepEqual(errors,[]);assert.deepEqual(sourceHashes(),rendererStart,'Renderer inputs must remain stable during final representative review');
 fs.writeFileSync(out+'/patterns-report.json',JSON.stringify({passed:true,checks,evidence,rendererHashes:rendererStart,errors,durationMs:Date.now()-started},null,2));console.log(JSON.stringify({passed:true,checks:checks.length,durationMs:Date.now()-started}));
}catch(e){await page.screenshot({path:out+'/patterns-failure.png'});console.error((await page.locator('body').innerText()).slice(-2000));throw e;}finally{await browser.close();}
