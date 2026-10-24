import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {waitForStudio,mountStudioBlock} from '../scripts/booklet/check-feedback-studio.mjs';

test('arrow properties keep a multi-block editor visible through pagination, saving and reopening',async()=>{
 const paragraph=(id,text)=>({id,type:'paragraph',inlines:[{type:'text',text}]});
 const equation={id:'equation',type:'annotated-equation',latex:'a(b+c)',anchors:[{id:'a',start:0,end:1,text:'a'},{id:'b',start:2,end:3,text:'b'},{id:'c',start:4,end:5,text:'c'}],annotations:[],connections:[{id:'ab',fromId:'a',toId:'b',height:4,colour:'#ef6068'},{id:'ac',fromId:'a',toId:'c',height:8,side:'below',colour:'#ef6068'}]};
 const content={format:'maths-editor-document-v1',version:1,blocks:[paragraph('instruction','Keep this instruction visible.'),{id:'panels',type:'layout',arrangement:'parallel',columns:2,slots:[{id:'left',blocks:[paragraph('method','Keep the derivation visible.')]},{id:'right',blocks:[equation]}]}]};
 let record=normalizeEditableProject({id:'property-reflow-regression',title:'Property reflow',revision:1,contentScope:'all',topics:[{id:'algebra',title:'Algebra'}],settings:{paginationMode:'flexible',generatedCover:true,exerciseOrganisation:'topic'},sections:[{id:'teaching',topicId:'algebra',title:'Teaching',phase:'teaching',blocks:[{id:'theory',type:'rich-text',content}]}]});
 const server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,open:false}});
 let browser;
 try{
  await server.listen();browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:1600,height:1100}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/__booklet/**',route=>{
   const request=route.request(),url=new URL(request.url()),method=request.method();
   if(url.pathname==='/__booklet/projects'&&method==='GET')return route.fulfill({json:[{id:record.id,title:record.title,revision:record.revision}]});
   if(url.pathname==='/__booklet/bank/manifest')return route.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}});
   if(url.pathname===`/__booklet/projects/${record.id}/open`)return route.fulfill({json:{project:record,bankSync:{items:[]}}});
   if(url.pathname.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});
   if(url.pathname===`/__booklet/projects/${record.id}`){
    if(method==='PUT'){
     const body=request.postDataJSON();assert.equal(body.expectedRevision,record.revision);
     record={...body.project,revision:record.revision+1};
    }
    return route.fulfill({json:record});
   }
   if(method!=='GET')return route.abort();
   return route.fallback();
  });
  const open=async()=>{await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/#/booklet?stage=projects&project=${record.id}`);try{await waitForStudio(page,{timeout:60000});}catch(error){throw Error(error.message+' '+(await page.locator('body').innerText()).slice(0,1500));}await mountStudioBlock(page,'theory');};
  await open();
  await page.locator('[data-edit-root="theory"] [data-id="equation"]').click();
  const height=page.getByLabel('Arrow height (mm)',{exact:true}).first();
  await height.waitFor({state:'attached',timeout:60000});
  await page.getByRole('button',{name:'Spacing',exact:true}).click();
  const initial=record.sections[0].blocks[0].content;
  for(const value of ['6','7','4']){
   const revision=record.revision;
   await height.fill(value);await height.press('Tab');await waitForStudio(page);
   await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved',null,{timeout:60000});
   assert.ok(record.revision>revision,'each edit must be acknowledged');
   await page.waitForFunction(()=>document.querySelector('maths-editor')?.documentController?.surface?.innerText.includes('Keep this instruction visible.'),null,{timeout:5000});
   assert.equal(await height.count(),1,'the selected equation controls must survive reflow');
   assert.deepEqual(record.sections[0].blocks[0].content.blocks.map(n=>n.id),initial.blocks.map(n=>n.id));
   assert.equal(record.sections[0].blocks[0].content.blocks[1].slots[1].blocks[0].connections[0].height,Number(value));
  }
  const saved=structuredClone(record.sections[0].blocks[0].content);
  await page.goto('about:blank');await open();
  await page.locator('[data-edit-root="theory"]').getByText('Keep this instruction visible.',{exact:true}).waitFor();
  assert.deepEqual(record.sections[0].blocks[0].content,saved);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await server.close();}
});
