// Real editor/save/reopen checks, entirely in memory through intercepted API routes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {visitActiveDiagrams} from './normalise-diagram-colours.mjs';
const out='.booklet-work/diagram-typography/trig';
let original;visitActiveDiagrams(JSON.parse(fs.readFileSync('booklets/projects/non-right-angled-trigonometry-v1.json')),n=>{if(n.id==='nr-p11-triangle')original=structuredClone(n);});
original.id='colour-editor-diagram';
let record=createEditableProject({id:'colour-editor-check',title:'Diagram colour check',settings:{paginationMode:'flexible',generatedCover:false},topics:[{id:'topic',title:'Triangles'}],sections:[{id:'section',topicId:'topic',phase:'practice',title:'Triangles',blocks:[{id:'holder',type:'question',content:{id:'question',type:'question',prompt:'Use the triangle.',questionDiagrams:[original],children:[],answer:{short:'',worked:''}}}]}]});record.revision=1;
const browser=await chromium.launch({headless:true,channel:'chrome'}),context=await browser.newContext({viewport:{width:1700,height:1100},storageState:out+'/browser-state.json'}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};}return route.fulfill({json:record});}
 return route.fulfill({json:url.pathname.endsWith('/manifest')?{questions:[]}:{items:[]}});
});
const saved=()=>page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
const colours=async locator=>locator.evaluate(svg=>({strokes:[...new Set([...svg.querySelectorAll('path,line,polyline,polygon,ellipse')].map(s=>getComputedStyle(s).stroke).filter(s=>s!=='none'))].sort(),kind:svg.querySelector('[data-diagram-kind]')?.dataset.diagramKind}));
try{
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project='+record.id,{waitUntil:'networkidle'});
 const figure=page.locator('.flow-paper [data-diagram-id="colour-editor-diagram"]');await figure.locator('svg').first().waitFor({timeout:120000});
 const measure=async locator=>locator.evaluate(async svg=>{const {measureDiagramLabels}=await import('/src/lib/diagram-typography.js');return measureDiagramLabels(svg);});
 const check=async locator=>{await page.waitForTimeout(150);const labels=await measure(locator);assert.ok(labels.length);assert.ok(labels.every(l=>Math.abs(l.pt-10)<.1),JSON.stringify(labels));};
 await check(figure.locator('svg').first());
 for(const zoom of ['1','0.5','0.75','1']){await page.getByLabel('Booklet zoom',{exact:true}).selectOption(zoom);await check(figure.locator('svg').first());}
 const before=await colours(figure.locator('svg').first());assert.deepEqual(before.strokes,['rgb(0, 0, 0)','rgb(238, 34, 39)']);
 await figure.first().click();await page.getByRole('button',{name:'Edit TikZ',exact:true}).click();
 const dialog=page.locator('dialog[open]'),field=dialog.getByLabel('TikZ code',{exact:true});await dialog.getByText('Current draft preview',{exact:true}).waitFor({timeout:120000});
 for(const width of [40,110,55,78]){await dialog.getByLabel('Diagram width (mm)',{exact:true}).fill(String(width));await check(dialog.locator('.diagram-preview svg').first());}
 // A malformed role declaration must be a recoverable draft error, not a page crash.
 await field.fill(original.code.replace('"version":1','"version":9'));await dialog.getByRole('alert').waitFor();
 assert.deepEqual(await colours(dialog.locator('.diagram-preview svg').first()),before);
 // Even an explicitly coloured ordinary alias renders black under the shared rule.
 const edited=original.code.replace('\\definecolor{sourceEdge}{HTML}{000000}','\\definecolor{sourceEdge}{HTML}{478FD6}')+'\n% Editor colour policy check';
 await field.fill(edited);await dialog.getByText('Current draft preview',{exact:true}).waitFor({timeout:120000});
 assert.deepEqual(await colours(dialog.locator('.diagram-preview svg').first()),before);await check(dialog.locator('.diagram-preview svg').first());
 await page.screenshot({path:out+'/editor-preview.png'});
 await dialog.getByRole('button',{name:'Save',exact:true}).click();await saved();
 assert.equal(record.sections[0].blocks[0].content.questionDiagrams[0].code,edited);
 await page.reload({waitUntil:'networkidle'});await figure.locator('svg').first().waitFor({timeout:120000});assert.deepEqual(await colours(figure.locator('svg').first()),before);
 await check(figure.locator('svg').first());await figure.first().click();await page.getByRole('button',{name:'Edit TikZ',exact:true}).click();assert.equal(await dialog.getByLabel('TikZ code',{exact:true}).inputValue(),edited);
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/editor-qa.json',JSON.stringify({passed:true,saveReopen:true,repeatedResize:true,pageZoom:true,completeLabelTargetPt:10,recoverableInvalidPolicy:true,colours:before},null,2));console.log('Diagram editor, invalid-policy recovery, save and reopen passed');
}finally{await browser.close();}
