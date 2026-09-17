// Focused native-maths and portrait geometry in the actual print renderer.
import fs from 'node:fs';import assert from 'node:assert/strict';import {chromium} from 'playwright-core';
import {routeCandidateProject} from './diagram-preflight.mjs';
const out=process.env.BOOKLET_CHECK_OUT??'.booklet-work/log-feedback-r207-20260916/teaching';fs.mkdirSync(out,{recursive:true});
const p=JSON.parse(fs.readFileSync('booklets/projects/logarithms-v1.json'));
const ids=['p5-index-to-log-demos','p5-log-to-index-demos','p10-inverse-demonstrations','p13-example-heading','p36-q7-block','p44-q11','p46-base5-block','p46-basehalf-block','p47-example'];
p.settings.generatedCover=false;p.settings.flowEdition='student';p.sections=p.sections.map(s=>({...s,blocks:s.blocks.filter(b=>ids.includes(b.id))})).filter(s=>s.blocks.length);
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage(),started=Date.now();
try{
 await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());await routeCandidateProject(page,p);
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173')+'/#/booklet?stage=projects&project='+p.id);
 await page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready');
 await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.locator('.project-print .print-page').first().waitFor({state:'attached'});await page.emulateMedia({media:'print'});
 await page.evaluate(async()=>{const {settleBooklet}=await import('/src/lib/booklet-qa.js');await settleBooklet(document.querySelector('.project-print'));});
 const geometry=await page.locator('.project-print').evaluate(root=>{
  const visible=e=>getComputedStyle(e).color!=='rgba(0, 0, 0, 0)'&&getComputedStyle(e).color!=='transparent';
  const math=(id,field,selector)=>[...root.querySelectorAll(`[data-content-owner="${id}"]`)].filter(e=>e.dataset.arrangementId.includes('/'+field)).flatMap(e=>[...e.querySelectorAll('.katex-html '+selector)]).filter(visible);
  const pairs=[];for(const direction of ['index-to-log','log-to-index'])for(let i=1;i<=3;i++){const id=`p5-${direction}-demo-${i}`;const positions=['prompt','theorySolution'].map(f=>math(id,f,'.mrel').find(e=>e.textContent==='=')?.getBoundingClientRect().left);pairs.push({id,positions});}
  const continuations=['left','right'].map(side=>{const id='p13-example-'+side;return{id,positions:['prompt','theorySolution'].map(f=>math(id,f,'.mop')[0]?.getBoundingClientRect().left)};});
  const image=root.querySelector('[data-id="p36-q7-character"]'),bubble=image.closest('section'),tracks=getComputedStyle(bubble.querySelector('[style*="grid-template-columns"]'));
  const inline=[1,2,3].map(i=>{const id='p10-inverse-demo-'+i;return{id,row:root.querySelector(`[data-arrangement-id="${id}:example"]`)?.getBoundingClientRect().height};});
  const nonTextLabels=[...root.querySelectorAll('.labelled:not(.baseline-label)')].filter(e=>e.querySelector(':scope > .label-item')?.textContent.trim()).map(e=>{const label=e.querySelector(':scope > .label-item'),content=label.nextElementSibling;return {id:e.dataset.arrangementId,labelTop:label.getBoundingClientRect().top,contentTop:content.getBoundingClientRect().top};});
  return {pairs,continuations,avatar:{widthMm:image.offsetWidth*25.4/96,ratio:image.querySelector('div').getBoundingClientRect().width/image.querySelector('div').getBoundingClientRect().height,tracks:tracks.gridTemplateColumns,gapMm:parseFloat(tracks.gap)*25.4/96},inline,nonTextLabels,errors:root.querySelectorAll('.katex-error').length};
 });
 for(const p of [...geometry.pairs,...geometry.continuations]){assert.ok(p.positions.every(Number.isFinite),p.id);assert.ok(Math.abs(p.positions[0]-p.positions[1])<.6,JSON.stringify(p));}
 assert.ok(Math.abs(geometry.avatar.widthMm-17)<.15);assert.ok(Math.abs(geometry.avatar.gapMm-5)<.15);assert.ok(Math.abs(geometry.avatar.ratio-.73)<.01);assert.equal(geometry.errors,0);
 assert.ok(geometry.inline.every(i=>i.row<35),'Inverse demonstrations stay on one compact line');
 assert.ok(geometry.nonTextLabels.length>=6,'Diagram and structured-comparison label fixtures rendered');
 assert.ok(geometry.nonTextLabels.every(i=>Math.abs(i.labelTop-i.contentTop)<1),'Non-text labels remain at the top of their figure or layout');
 fs.writeFileSync(out+'/report.json',JSON.stringify({...geometry,elapsedMs:Date.now()-started},null,2));console.log(JSON.stringify(geometry));
}catch(error){await page.screenshot({path:out+'/failure.png',fullPage:true});throw error;}finally{await browser.close();}
