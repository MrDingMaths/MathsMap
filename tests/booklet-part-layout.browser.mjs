// Part layout is reachable from Spacing, including a saved multi-row grid.
// All saves are isolated in memory.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject,normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
const origin=process.env.STUDIO_ORIGIN??'http://127.0.0.1:5173';
const block={id:'grid-question',type:'question',content:{id:'grid-root',label:'1',layout:'grid',columns:3,children:Array.from({length:12},(_,i)=>({id:'part-'+i,label:String.fromCharCode(97+i),prompt:'Calculate $15\\%$ of $60$.',answerSpaceMm:20,answer:{short:'$9$',worked:'$0.15\\times60=9$'}}))}};
let record=createEditableProject({id:'part-layout-browser-check',title:'Part layout check',settings:{paginationMode:'flexible',generatedCover:false},sections:[{id:'exercise',title:'Exercise',blocks:[block]}]});
record.settings.layoutOverrides.blockLayouts[block.id]={arrangement:resolveArrangement(record.sections[0].blocks[0]).tree};
record.revision=1;
const original=structuredClone(record.sections[0].blocks[0].content.children),errors=[];
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1700,height:1100}});
page.on('pageerror',error=>errors.push(error.message));
await page.route('**/__booklet/**',route=>{
 const request=route.request(),url=new URL(request.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname.endsWith('/open'))return route.fulfill({json:{project:record,bankSync:{items:[]}}});
 if(url.pathname==='/__booklet/projects/'+record.id){
  if(request.method()==='PUT'){const body=request.postDataJSON();assert.equal(body.expectedRevision,record.revision);record=normalizeEditableProject({...body.project,revision:record.revision+1});}
  return route.fulfill({json:record});
 }
 if(request.method()==='GET'&&/files|assets/.test(url.pathname))return route.continue();
 return route.fulfill({json:url.pathname.endsWith('/manifest')?{questions:[]}:{items:[]}});
});
const ready=()=>page.waitForFunction(()=>document.querySelector('.project-print')?.dataset.paginationState==='ready',null,{timeout:120000});
const panel=page.locator('#booklet-layout-spacing'),control=panel.getByRole('combobox',{name:'Part layout',exact:true});
const save=async action=>{await action();await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');await ready();};
const parts=()=>record.settings.layoutOverrides.blockLayouts[block.id].arrangement.root.children.find(n=>n.id==='grid-root:parts');
const rowCounts=()=>parts().direction==='row'?[parts().children.length]:parts().children.map(n=>n.children.length);
try{
 await page.goto(origin+'/#/booklet?stage=projects&project='+record.id);await ready();
 await page.locator('.flow-paper [data-arrangement-id="grid-root:question"]').first().dispatchEvent('click',{bubbles:true});
 await page.getByRole('button',{name:'Spacing',exact:true}).click();
 assert.equal(await control.isEnabled(),true);assert.equal(await control.inputValue(),'grid:3');
 for(const count of [2,4]){
  await save(()=>control.selectOption('grid:'+count));
  assert.equal(record.sections[0].blocks[0].content.columns,count);
  assert.deepEqual(rowCounts(),Array(12/count).fill(count));
  assert.deepEqual(record.sections[0].blocks[0].content.children,original);
 }
 await save(()=>page.getByRole('button',{name:'Undo',exact:true}).click());
 assert.equal(record.sections[0].blocks[0].content.columns,2);
 await save(()=>page.getByRole('button',{name:'Redo',exact:true}).click());
 assert.equal(record.sections[0].blocks[0].content.columns,4);
 await save(()=>control.selectOption('list'));assert.equal(parts().direction,'stack');assert.equal(parts().children.length,12);
 await save(()=>control.selectOption('grid:3'));
 await page.reload();await ready();
 assert.deepEqual(rowCounts(),[3,3,3,3]);assert.deepEqual(record.sections[0].blocks[0].content.children,original);
 await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
 await page.waitForFunction(()=>document.querySelector('.project-print [data-arrangement-id="grid-root:parts"]'));
 assert.equal(await page.locator('.project-print [data-arrangement-id^="grid-root:row:"]').count(),4);
 assert.deepEqual(errors,[]);console.log('PASS Spacing part layout: 2/4 columns, list, undo/redo, 3-column reopen and print; all parts and answers preserved');
}finally{await browser.close();}
