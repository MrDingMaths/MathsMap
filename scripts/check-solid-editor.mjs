// Real editor, print and cache check using an isolated in-memory project.
import fs from 'node:fs';import assert from 'node:assert/strict';import {chromium} from 'playwright-core';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';
import {inspectSolid} from './lib/solid-audit.mjs';
import {prepareTikz} from '../src/lib/tikz-prepare.js';
import {inspectPrintedPdf} from './booklet/pdf-layout-qa.mjs';
const out='.booklet-work/solid-visibility/editor';fs.mkdirSync(out,{recursive:true});
const ledger=JSON.parse(fs.readFileSync('booklets/provenance/solid-visibility-2026-09-12.json'));
const ramp=ledger.corrections.find(r=>r.file==='public/content/volume-of-prism.json'&&r.location==='/practice/development/0/question_text');
const original={id:'solid-editor-diagram',format:'tikz',code:ramp.afterCode,widthMm:78,alt:'Triangular prism loading ramp'};
let record=createEditableProject({id:'solid-editor-check',title:'3D visibility check',settings:{paginationMode:'flexible',generatedCover:false},topics:[{id:'topic',title:'Prisms'}],sections:[{id:'section',topicId:'topic',phase:'practice',title:'Prisms',blocks:[{id:'holder',type:'question',content:{id:'question',type:'question',prompt:'Find the volume of the loading ramp.',questionDiagrams:[original],children:[],answer:{short:'6 cubic metres',worked:''}}}]}]});record.revision=1;
const startedAt=new Date().toISOString(),browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext({viewport:{width:1700,height:1100}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};}return route.fulfill({json:record});}
 return route.fulfill({json:url.pathname.endsWith('/manifest')?{questions:[]}:{items:[]}});
});
const checks=[];
const check=async(label,locator)=>{
 await page.waitForTimeout(200);const q=await locator.evaluate(async svg=>{const {measureDiagramLabels,inspectDiagramLabelLayout}=await import('/src/lib/diagram-typography.js');return {labels:measureDiagramLabels(svg),layout:inspectDiagramLabelLayout(svg),strokes:[...new Set([...svg.querySelectorAll('path,line')].map(s=>getComputedStyle(s).stroke).filter(s=>s!=='none'))]};});
 assert.ok(q.labels.length);assert.ok(q.labels.every(l=>Math.abs(l.pt-10)<.1),JSON.stringify(q));assert.deepEqual(q.layout,[],label);assert.deepEqual(q.strokes,['rgb(0, 0, 0)']);checks.push({label,...q});
};
try{
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project='+record.id,{waitUntil:'networkidle'});
 const figure=page.locator('.flow-paper [data-diagram-id="solid-editor-diagram"]');await figure.locator('svg').first().waitFor({timeout:120000});await check('fresh preview',figure.locator('svg').first());
 for(const zoom of ['0.5','0.75','1']){await page.getByLabel('Booklet zoom',{exact:true}).selectOption(zoom);await check('page zoom '+zoom,figure.locator('svg').first());}
 await figure.first().click();await page.getByRole('button',{name:'Edit TikZ',exact:true}).click();
 const dialog=page.locator('dialog[open]'),field=dialog.getByLabel('TikZ code',{exact:true});await dialog.getByText('Current draft preview',{exact:true}).waitFor({timeout:120000});
 for(const width of [40,110,55,78]){await dialog.getByLabel('Diagram width (mm)',{exact:true}).fill(String(width));await check('editor width '+width,dialog.locator('.diagram-preview svg').first());}
 const edited=original.code+'\n% Save/reopen visibility check';await field.fill(edited);await dialog.getByText('Current draft preview',{exact:true}).waitFor({timeout:120000});await check('edited preview',dialog.locator('.diagram-preview svg').first());
 await page.screenshot({path:out+'/editor-preview.png'});await dialog.getByRole('button',{name:'Save',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 assert.equal(record.sections[0].blocks[0].content.questionDiagrams[0].code,edited);assert.equal(inspectSolid(edited).status,'pass');
 await page.reload({waitUntil:'networkidle'});await figure.locator('svg').first().waitFor({timeout:120000});await check('cached reload',figure.locator('svg').first());
 await figure.first().click();await page.getByRole('button',{name:'Edit TikZ',exact:true}).click();assert.equal(await field.inputValue(),edited);await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.screenshot({path:out+'/saved-preview.png'});
 await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
 await page.emulateMedia({media:'print'});await page.evaluate(async()=>{const {settleBooklet}=await import('/src/lib/booklet-qa.js');await settleBooklet(document.querySelector('.project-print'));});
 await check('print media',page.locator('.project-print [data-diagram-id="solid-editor-diagram"] svg').first());await page.pdf({path:out+'/ramp-print.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});
 const pdf=inspectPrintedPdf(out+'/ramp-print.pdf');assert.ok(pdf.every(p=>!p.issues.length),JSON.stringify(pdf));assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/report.json',JSON.stringify({startedAt,finishedAt:new Date().toISOString(),passed:true,checks,pdf,saveReopen:true,freshCached:true,cacheKey:prepareTikz(edited).key,noProjectFilesWritten:true},null,2));console.log('Solid editor / resizing / zoom / save-reopen / cache / PDF passed');
}finally{await browser.close();}
