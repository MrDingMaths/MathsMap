import assert from 'node:assert/strict';
import {independentAnswerPages} from '../../src/lib/booklet-answer-options.js';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const project=JSON.parse(fs.readFileSync(process.argv[2]??'output/linear-pilot/project.json')),browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1600,height:1200}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());
 await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));

 await page.route('**/__booklet/projects',r=>r.request().method()==='GET'?r.fulfill({json:[project]}):r.abort());await page.route('**/__booklet/projects/'+project.id,r=>r.request().method()==='GET'?r.fulfill({json:project}):r.abort());
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project='+project.id,{waitUntil:'networkidle'});await page.locator('.project-print').waitFor({state:'attached'});
 const screenGeometry=[];
 for(const [width,height] of [[1920,1080],[1440,900],[1280,800],[1024,768],[883,994],[390,844]]){
  await page.setViewportSize({width,height});if(width<1100&&await page.locator('.project-outline').isVisible())await page.getByRole('button',{name:'Close page navigation',exact:true}).click();
  for(const zoom of ['width','page','1']){
   await page.getByLabel('Booklet zoom',{exact:true}).selectOption(zoom);await page.waitForTimeout(100);
   const geometry=await page.locator('.project-canvas .preview-frame').evaluate(frame=>{const f=frame.getBoundingClientRect(),p=frame.querySelector('.preview-page').getBoundingClientRect();return{frameLeft:f.left,paperLeft:p.left,frameWidth:f.width,paperWidth:p.width,shellWidth:document.documentElement.scrollWidth,viewport:innerWidth};});
   assert.ok(Math.abs(geometry.paperLeft-geometry.frameLeft)<1,`left edge clipped at ${width}px / ${zoom}: ${JSON.stringify(geometry)}`);assert.ok(Math.abs(geometry.paperWidth-geometry.frameWidth)<1,'scaled paper matches frame');assert.ok(geometry.shellWidth<=geometry.viewport+1,'no shell overflow');screenGeometry.push({width,height,zoom,...geometry});
  }
  await page.getByLabel('Booklet zoom',{exact:true}).selectOption('width');await page.waitForTimeout(100);fs.mkdirSync('tmp/ux-verification',{recursive:true});await page.screenshot({path:`tmp/ux-verification/pilot-canvas-${width}.png`});
 }
 fs.writeFileSync('tmp/ux-verification/pilot-screen-geometry.json',JSON.stringify(screenGeometry,null,2));await page.setViewportSize({width:1600,height:1200});await page.emulateMedia({media:'print'});
 const results=[];
 for(const mode of ['none','short','worked']){
  await page.emulateMedia({media:'screen'});
  if(!await page.getByLabel('Practice answers',{exact:true}).isVisible())await page.getByRole('button',{name:'PDF',exact:true}).click();
  await page.getByLabel('Practice answers',{exact:true}).selectOption(mode);
  for(const label of ['Show review answers','Show identify answers','Show guided practice answers'])await page.getByLabel(label,{exact:true}).setChecked(mode!=='none');
  await page.emulateMedia({media:'print'});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.evaluate(async()=>{await window.TikZ?.flushPending(document.querySelector('.project-print'),300000);await document.fonts.ready;});
  await page.waitForFunction(()=>[...document.querySelectorAll('.project-print .tikz-wrap')].every(e=>e.querySelector('.tikz-error')||[...e.querySelectorAll('svg')].some(s=>!s.querySelector('animate'))),null,{timeout:300000});await page.waitForTimeout(150);
  const result=await page.evaluate(()=>{const root=document.querySelector('.project-print'),collisions=[];for(const article of root.querySelectorAll('.booklet-page')){const footer=article.querySelector('footer').getBoundingClientRect(),bounds=article.getBoundingClientRect();if(!footer.width)continue;for(const e of article.querySelectorAll('main table,main p,main .text-line,main .tikz-wrap')){const r=e.getBoundingClientRect();if(r.bottom>footer.top-4||r.left<bounds.left-1||r.right>bounds.right+1)collisions.push({page:article.dataset.pageNumber,id:e.dataset.id,text:e.textContent.slice(0,70)});}}
   const cells=[...root.querySelectorAll('td,th')];const alignment=cells.every(e=>getComputedStyle(e).textAlign==='center'&&getComputedStyle(e).verticalAlign==='middle');const cards=root.querySelector('.me-cards > div');return{pages:root.querySelectorAll('.print-page').length,covers:root.querySelectorAll('.booklet-cover').length,footerCount:root.querySelectorAll('.booklet-footer').length,top:root.getBoundingClientRect().top,collisions,alignment,errors:root.querySelectorAll('.tikz-error,.katex-error').length,cardColumns:cards?getComputedStyle(cards).gridTemplateColumns.split(' ').length:null,annotationBoxes:root.querySelectorAll('[data-table-annotations] rect').length,annotations:root.querySelectorAll('[data-table-annotations]').length,development:root.querySelector('[data-page-number="33"]').querySelectorAll('.difficulty-heading').length,sharedPlots:root.querySelector('[data-question-id="page-9-q8"]')?.querySelectorAll('.diagram-tikz svg').length,greenMarks:(root.querySelector('[data-page-number="24"]')?.innerHTML??'').includes('#16803d'),redMarks:(root.querySelector('[data-page-number="24"]')?.innerHTML??'').includes('#d83131')};});
  if(mode==='none')assert.deepEqual(await page.locator('.project-print .question-line').evaluateAll(lines=>lines.filter(line=>{const label=line.querySelector('.part-label'),prompt=line.querySelector('.prompt');return label&&prompt&&Math.abs(label.getBoundingClientRect().top-prompt.getBoundingClientRect().top)>1;}).map(line=>line.textContent.slice(0,100))),[],'question numbers share the first stem line');
  if(mode==='short'){assert.equal(result.pages,independentAnswerPages(project.sections.map(section=>({blocks:section.blocks}))).length);assert.equal(result.covers,0);assert.equal(await page.locator('.project-print .theory-section').count(),0);}else{assert.equal(result.pages,Number(process.argv[4]??12));assert.equal(result.covers,1);assert.equal(result.footerCount,Number(process.argv[4]??12));}assert.equal(result.top,0,'screen padding must not create a blank PDF page');assert.deepEqual(result.collisions,[],mode+' footer/page collisions');assert.equal(result.alignment,true);assert.equal(result.errors,0);assert.equal(result.development,mode==='short'?0:1);
  if(mode==='none'){assert.equal(result.cardColumns,5);assert.equal(result.annotationBoxes,26);assert.equal(result.greenMarks,false);assert.equal(result.redMarks,false);}else{assert.equal(result.sharedPlots,1);assert.equal(result.greenMarks,mode==='worked');assert.equal(result.redMarks,mode==='worked');}
  results.push({mode,...result});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(process.argv[3]??'output/linear-pilot/browser-verification.json',JSON.stringify({checkedAt:new Date().toISOString(),projectRevision:project.revision,results,errors},null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
