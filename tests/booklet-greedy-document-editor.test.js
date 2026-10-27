import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {normalizeDocument} from '../public/libs/maths-editor/document-model.mjs';
import {waitForStudio,mountStudioBlock} from '../scripts/booklet/check-feedback-studio.mjs';

test('an opted-in partial list edits, saves and reopens with every off-page item and ordered value intact',async()=>{
 const paragraph=(id,text)=>({id,type:'paragraph',inlines:[{type:'text',text}]});
 const content=normalizeDocument({format:'maths-editor-document-v1',version:1,blocks:[paragraph('intro','Preserve the introduction.'),{
  id:'long-list',type:'list',ordered:true,start:7,indent:7,items:Array.from({length:32},(_,i)=>({id:'item-'+(i+1),type:'list-item',...(i===16?{value:60}:{}),blocks:[paragraph('item-text-'+(i+1),`Item ${i+1}. Explain the complete relationship using the supplied values, and retain each statement in its original position. The following observation belongs to this same complete list item.`)]})),
 },paragraph('tail','Preserve the closing paragraph.')]});
 let record=normalizeEditableProject({id:'greedy-list-editor-regression',title:'List editing',revision:1,contentScope:'all',topics:[{id:'t',title:'Topic'}],settings:{paginationMode:'flexible',generatedCover:false},sections:[{id:'s',topicId:'t',phase:'teaching',blocks:[{id:'syllabus',type:'rich-text',flow:{greedyDocumentFragments:true},content}]}]});
 const original=structuredClone(record.sections[0].blocks[0].content),server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,open:false}});let browser;
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
    if(method==='PUT'){const body=request.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};}
    return route.fulfill({json:record});
   }
   if(method!=='GET')return route.abort();return route.fallback();
  });
  const open=async()=>{await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/#/booklet?stage=projects&project=${record.id}`);await waitForStudio(page,{timeout:60000});return mountStudioBlock(page,'syllabus');};
  const pages=await open();assert.ok(pages.length>1,'the actual renderer must produce partial list pages');
  const visible=page.locator('[data-edit-root="syllabus"] ol[data-id="long-list"]:visible').last();
  assert.ok(await visible.locator(':scope > li').count()<32,'edit a real partial list, not the complete source list');
  await page.locator('[data-edit-root="syllabus"] [data-id="item-text-32"]:visible').last().click();
  await page.waitForFunction(()=>document.querySelector('maths-editor')?.documentController?.doc.blocks.find(n=>n.id==='long-list')?.items.length===32,null,{timeout:10000});
  const revision=record.revision;
  await page.locator('maths-editor [data-id="item-text-32"]').click();await page.keyboard.press('End');await page.keyboard.type(' amended');
  await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved',null,{timeout:60000});
  assert.ok(record.revision>revision);
  const saved=record.sections[0].blocks[0].content,list=saved.blocks.find(n=>n.id==='long-list');
  assert.deepEqual(list.items.map(n=>[n.id,n.value]),original.blocks[1].items.map(n=>[n.id,n.value]));
  assert.equal(list.start,7);assert.match(JSON.stringify(list.items[31]),/amended/);
  assert.deepEqual(list.items.slice(0,31),original.blocks[1].items.slice(0,31));
  assert.deepEqual(saved.blocks[0],original.blocks[0]);assert.deepEqual(saved.blocks.at(-1),original.blocks.at(-1));
  const savedCopy=structuredClone(saved);await page.goto('about:blank');await open();
  await page.locator('[data-edit-root="syllabus"] [data-id="item-text-32"]:visible').last().waitFor();
  assert.deepEqual(record.sections[0].blocks[0].content,savedCopy);assert.deepEqual(errors,[]);
 }finally{await browser?.close();await server.close();}
});
