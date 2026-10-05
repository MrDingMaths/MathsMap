// Bulk and per-item spacing in the Studio panel, against in-memory saves only.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject,normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
const origin=process.env.STUDIO_ORIGIN??'http://localhost:5173';
const text=(id,value)=>({id,type:'paragraph',inlines:[{type:'text',text:value}]});
const doc=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
const table=id=>({id,type:'table',padding:2,rowHeights:[12,12,12],rows:[0,1,2].map(r=>[{id:`${id}-c${r}`,type:'cell',blocks:[text(`${id}-p${r}`,'Row '+(r+1))]}])});
let record=createEditableProject({id:'bulk-spacing-check',title:'Bulk spacing check',settings:{paginationMode:'flexible',generatedCover:false},sections:[{id:'s',title:'Exercise',blocks:[
 {id:'q1',type:'question',content:{id:'r1',prompt:doc([text('q1-stem','Complete the table.'),table('t1')]),children:[
  {id:'r1a',label:'a',prompt:doc([text('q1a','First part')]),answerSpaceMm:20},
  {id:'r1b',label:'b',prompt:doc([text('q1b','Second part')]),answerSpaceMm:20}]}},
 {id:'q2',type:'question',content:{id:'r2',prompt:doc([text('q2-stem','Second question.'),table('t2')]),answerSpaceMm:20}},
]}]});
record.revision=1;
const errors=[];
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1700,height:1100}});page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname.endsWith('/open'))return route.fulfill({json:{project:record,bankSync:{items:[]}}});
 if(url.pathname==='/__booklet/projects/'+record.id){
  if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record=normalizeEditableProject({...body.project,revision:record.revision+1});}
  return route.fulfill({json:record});
 }
 if(req.method()==='GET'&&/files|assets/.test(url.pathname))return route.continue();
 return route.fulfill({json:url.pathname.endsWith('/manifest')?{questions:[]}:{items:[]}});
});
const ready=()=>page.waitForFunction(()=>document.querySelector('.project-print')?.dataset.paginationState==='ready',null,{timeout:120000});
const find=id=>{let found;const visit=n=>{if(!n||typeof n!=='object'||found)return;if(n.id===id){found=n;return;}Object.values(n).forEach(visit);};visit(record.sections);return found;};
// An autosave may already be in flight, so wait for the state to settle rather than for one request.
const save=async action=>{await action();await page.keyboard.press('Control+s');await page.waitForTimeout(400);await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');await ready();};
const panel=page.locator('#booklet-layout-spacing');
const fill=(name,value)=>save(async()=>{const input=panel.getByRole('spinbutton',{name,exact:true});await input.fill(value);await input.press('Tab');});
const layout=id=>record.settings.layoutOverrides.blockLayouts?.[id]?.arrangement;
const spaces=tree=>{const out=[];const walk=n=>{if(/space/.test(n.ref??''))out.push(n);n.children?.forEach(walk);};walk(tree.root);return out;};
try{
 await page.goto(origin+'/#/booklet?stage=projects&project='+record.id);await ready();
 await page.locator('.flow-paper [data-edit-root="r1"] .clickable').first().click();
 await page.getByRole('button',{name:'Spacing',exact:true}).click();
 assert.equal(await panel.getByRole('tab',{name:'Spacing',exact:true}).getAttribute('aria-selected'),'true');

 // One number for every table row and every answer space in the question.
 await fill('Whole block tables: row height (mm)','6');
 assert.deepEqual(find('t1').rowHeights,[6,6,6]);assert.deepEqual(find('t2').rowHeights,[12,12,12]);
 await fill('Whole question answer space height (mm)','8');
 assert.deepEqual(spaces(layout('q1')).map(n=>n.height),[8,8]);

 // Inside the table: the whole table at once, then one row.
 await page.locator('.flow-paper table[data-id="t1"] td').nth(1).click();
 await page.locator('maths-editor table td').nth(1).click();
 await fill('All table rows height (mm)','5');
 assert.deepEqual(find('t1').rowHeights,[5,5,5]);
 await fill('Row minimum height (mm)','9');
 assert.deepEqual(find('t1').rowHeights,[5,9,5]);
 await fill('All table cells padding (mm)','1');
 assert.equal(find('t1').padding,1);
 await page.keyboard.press('Escape');

 // One answer space by number, leaving its sibling at the bulk value.
 const space=page.locator('.flow-paper [data-arrangement-block="q1"] [data-arrangement-id*="space"]').first();
 await space.click({force:true});
 await fill('Answer space height (mm)','14');
 const heights=spaces(layout('q1')).map(n=>n.height).sort((a,b)=>a-b);
 assert.deepEqual(heights,[8,14]);
 assert.ok(Object.values(record.settings.layoutOverrides.answerSpaces).includes(14));
 await save(()=>page.getByRole('button',{name:'Undo',exact:true}).click());

 // Several blocks together.
 await page.locator('.flow-paper [data-arrangement-id="r1:question"]').first().dispatchEvent('click',{bubbles:true});
 await page.locator('.flow-paper [data-arrangement-id="r2:question"]').first().dispatchEvent('click',{bubbles:true,ctrlKey:true});
 if(!await panel.isVisible())await page.getByRole('button',{name:'Spacing',exact:true}).click();
 assert.equal(await panel.locator('#whole-question-spacing-heading').innerText(),'2 selected blocks');
 await fill('Whole block tables: row height (mm)','7');
 assert.deepEqual(find('t1').rowHeights,[7,7,7]);assert.deepEqual(find('t2').rowHeights,[7,7,7]);
 await page.reload();await ready();
 assert.deepEqual(errors,[]);
 console.log('bulk spacing browser check passed');
}finally{await browser.close();}
