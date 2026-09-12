// Current-booklet pattern inventory and isolated representative page/neighbour review.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {normalizeDocument} from '../../public/libs/maths-editor/document-model.mjs';
const out='.booklet-work/smooth-editing/projects',base=process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5185';fs.mkdirSync(out,{recursive:true});
const report=process.env.BOOKLET_REVIEW_PROJECT&&fs.existsSync(out+'/report.json')?JSON.parse(fs.readFileSync(out+'/report.json')):{started:new Date().toISOString(),projects:[]};
const files=fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'));
const selectedFiles=process.env.BOOKLET_REVIEW_PROJECT?files.filter(f=>process.env.BOOKLET_REVIEW_PROJECT.split(',').includes(f.replace(/\.json$/,''))):files;
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
try{for(const file of selectedFiles){
 const source=fs.readFileSync('booklets/projects/'+file),original=JSON.parse(source),counts={},patterns=new Map(),chosen=new Set(),issues=[];
 for(const section of original.sections)for(const block of section.blocks){
  const walk=(n,path)=>{if(!n||typeof n!=='object')return;
   if(n.format==='maths-editor-document-v1'){try{normalizeDocument(n);}catch(e){issues.push({block:block.id,path,error:e.message});}}
   if(['paragraph','table','layout','annotated-equation','image','inline-image'].includes(n.type)||n.format==='tikz'){
    const pattern=n.type??'diagram';counts[pattern]=(counts[pattern]??0)+1;if(!patterns.has(pattern)){patterns.set(pattern,block.id);chosen.add(block.id);}
   }
   for(const [k,v]of Object.entries(n))if(!['sourceAtom','sourceReview','sourceLayoutEvidence','originalDiagram','originalGraph','mathematicalModel','spec'].includes(k))walk(v,path+'/'+k);
  };walk(block,'');
 }
 if(!original.sections.some(s=>s.phase==='practice'&&s.blocks.some(b=>chosen.has(b.id)))){const practice=original.sections.find(s=>s.phase==='practice'&&s.blocks.some(b=>b.type==='question'));const block=practice?.blocks.find(b=>b.type==='question');if(block)chosen.add(block.id);}
 if(original.id==='volume-v1')for(const id of ['p15-volume-prism','p35-examples'])chosen.add(id);
 // Include pagination neighbours in the isolated source sequence.
 for(const section of original.sections){const initial=[...chosen];section.blocks.forEach((b,i)=>{if(initial.includes(b.id)){if(i)chosen.add(section.blocks[i-1].id);if(i+1<section.blocks.length)chosen.add(section.blocks[i+1].id);}});}
 let record=structuredClone(original);record.id='smooth-review-'+original.id;record.settings.flowEdition='student';record.sections=record.sections.map(s=>({...s,blocks:s.blocks.filter(b=>chosen.has(b.id))})).filter(s=>s.blocks.length);
 const result={id:original.id,revision:original.revision,sourceHash:createHash('sha256').update(source).digest('hex'),counts,patterns:Object.fromEntries(patterns),selectedBlocks:[...chosen],modelIssues:issues,editions:[],errors:[]};report.projects=report.projects.filter(p=>p.id!==original.id);report.projects.push(result);
 assert.deepEqual(issues,[]);const page=await browser.newPage({viewport:{width:1700,height:1200}});page.setDefaultTimeout(60000);page.on('pageerror',e=>result.errors.push(e.message));
 await page.route('**/__booklet/**',async route=>{const req=route.request(),url=new URL(req.url());if(url.pathname==='/__booklet/projects')return route.fulfill({json:[{id:record.id,title:record.title,revision:record.revision}]});if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};}return route.fulfill({json:record});}if(url.pathname.includes('bank-sync'))return route.fulfill({json:{items:[]}});if(req.method()==='GET'&&(url.pathname.includes('/files/')||url.pathname.includes('/assets/')||url.pathname.includes('project-assets')))return route.continue();return route.fulfill({json:[]});});
 await page.goto(base+'/#/booklet?stage=projects&project='+record.id,{waitUntil:'domcontentloaded'});
 if(original.id==='volume-v1'){
  await page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:300000});
  const originalSections=structuredClone(record.sections),originalLayouts=structuredClone(record.settings.layoutOverrides);
  const saved=()=>page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
  const diagram=page.locator('[data-arrangement-block="p15-volume-prism"] [data-diagram-id]').first();await diagram.click();await page.locator('.direct-layout>summary').click();
  await page.getByLabel('Layout vertical alignment',{exact:true}).selectOption('middle');await saved();
  assert.match(JSON.stringify(record.settings.layoutOverrides.blockLayouts['p15-volume-prism'].arrangement),/"verticalAlign":"middle"/);await page.screenshot({path:out+'/volume-prism-alignment.png'});
  await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();await page.locator('.direct-layout>summary').click();
  const capacity=page.locator('[data-arrangement-block="p35-examples"]'),picture=capacity.locator('[data-diagram-id]').first(),target=await capacity.locator('.editable-booklet-text').first().evaluate(el=>el.closest('[data-arrangement-id]').dataset.arrangementId);
  await picture.click();await page.locator('.direct-layout>summary').click();await page.getByLabel('Layout destination',{exact:true}).selectOption(target);await page.getByRole('button',{name:'Right of destination',exact:true}).click();await saved();await page.screenshot({path:out+'/volume-capacity-placement.png'});
  await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();await page.locator('.direct-layout>summary').click();
  assert.deepEqual(record.sections,originalSections);assert.deepEqual(record.settings.layoutOverrides,originalLayouts);result.directControls='Prism vertical alignment and capacity image placement saved and restored with Undo';
 }
 for(const edition of ['student','short','worked','with-short','with-worked']){
  const started=Date.now();await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await page.waitForFunction(edition=>{const d=document.querySelector('.flow-document');return d?.dataset.paginationState==='ready'&&d.dataset.paginatedEdition===edition;},edition,{timeout:300000});
  await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.locator('.project-print .print-page').first().waitFor({state:'attached'});await page.emulateMedia({media:'print'});
  const qa=await page.evaluate(async()=>{const {settleBooklet,inspectBooklet}=await import('/src/lib/booklet-qa.js');const root=document.querySelector('.project-print');await settleBooklet(root);return inspectBooklet(root,{style:true});});
  const pages=page.locator('.project-print .print-page'),count=await pages.count(),prefix=out+'/'+original.id+'-'+edition;
  await page.pdf({path:prefix+'.pdf',format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});
  for(let i=0;i<count;i++)await pages.nth(i).screenshot({path:prefix+'-'+(i+1)+'.png'});
  const links=await page.locator('.project-print').evaluate(root=>[...root.querySelectorAll('a[href^="#"]')].filter(a=>a.getClientRects().length&&!root.querySelector(`[id="${CSS.escape(a.hash.slice(1))}"]`)).map(a=>a.getAttribute('href')));
  result.editions.push({edition,pages:count,qa,missingLinks:links,elapsedMs:Date.now()-started});console.log(`${original.id} ${edition}: ${count} representative/neighbour pages`);
  fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await page.emulateMedia({media:'screen'});
 }
 await page.close();
}}finally{report.finished=new Date().toISOString();fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
