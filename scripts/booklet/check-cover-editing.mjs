import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';

const base=process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173';
const out='.booklet-work/cover-storage/cover';
fs.mkdirSync(out,{recursive:true});
const start=Date.now(), errors=[], writes=[];
const fixture=()=>createEditableProject({id:'cover-edit-check',title:'Picker name',settings:{paginationMode:'flexible',generatedCover:true,cover:{course:'Mathematics Stage 4',book:'Book 1',version:'260912'},compactExercises:true},topics:[{id:'algebra',title:'Algebra'}],sections:[{id:'practice',title:'Practice',topicId:'algebra',phase:'practice',role:'practice',blocks:[{id:'q1',type:'question',content:{id:'q1-content',type:'question',prompt:'Calculate $2+3$.',children:[],answer:{short:'$5$',worked:'$2+3=5$'}}}]}]});
let record=fixture();record.revision=1;
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1500,height:1200}});
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname.startsWith('/__booklet/render-cache/'))return route.fallback();
  if(url.pathname==='/__booklet/projects')return route.fulfill({json:[{id:record.id,title:record.title,revision:record.revision}]});
  if(url.pathname===`/__booklet/projects/${record.id}/open`)return route.fulfill({json:{project:record,bankSync:{items:[]}}});
  if(url.pathname===`/__booklet/projects/${record.id}`){
    if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes.push(record.revision);}
    return route.fulfill({json:record});
  }
  if(url.pathname.includes('bank-sync'))return route.fulfill({json:{items:[]}});
  return route.fulfill({json:[]});
});
const ready=()=>page.waitForFunction(()=>!document.querySelector('.workspace-loading')&&document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:120000});
const saved=()=>page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
const field=label=>page.locator('.flow-document').getByRole('textbox',{name:label,exact:true});
async function edit(label,value,key='Enter'){await field(label).fill(value);await field(label).press(key);await saved();await ready();}
async function open(){await page.goto('about:blank');await page.goto(base+'/#/booklet?stage=projects&project='+record.id,{waitUntil:'domcontentloaded'});await ready();}
try{
  await open();
  const source=JSON.stringify(record.sections),picker=record.title;
  await edit('Cover title','Linear Relationships');
  assert.equal(record.settings.cover.title,'Linear Relationships');
  await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();await ready();assert.equal(record.settings.cover?.title,undefined);
  await page.getByRole('button',{name:'Redo',exact:true}).click();await saved();await ready();assert.equal(record.settings.cover.title,'Linear Relationships');
  await edit('Book number','Book 12');
  await edit('Cover course','Mathematics Stage 5');
  await edit('Cover version','2026.2','Control+s');
  await edit('Cover feedback','maths@example.edu.au');
  const revision=record.revision;
  await edit('Cover title','Cancelled title','Escape');assert.equal(record.revision,revision);
  await edit('Book number','');assert.equal(record.settings.cover.book,'Book 12');
  assert.equal(JSON.stringify(record.sections),source);assert.equal(record.title,picker);
  await page.reload({waitUntil:'domcontentloaded'});await ready();
  assert.equal(await field('Cover title').innerText(),'Linear Relationships');
  assert.equal(await field('Book number').innerText(),'Book 12');
  await page.getByLabel('Booklet zoom',{exact:true}).selectOption('0.75');await ready();
  await page.locator('.flow-document .booklet-cover').screenshot({path:out+'/edited-cover.png'});
  const editions=[];
  for(const edition of ['student','with-short','with-worked','short','worked']){
    await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await ready();
    await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
    await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
    const printed=page.locator('.project-print'),cover=printed.locator('.booklet-cover');
    const hasCover=['student','with-short','with-worked'].includes(edition);
    assert.equal(await cover.count(),hasCover?1:0);
    assert.equal(await printed.locator('[contenteditable=true]').count(),0);
    if(hasCover){assert.equal(await cover.locator('h1').innerText(),'Linear Relationships');assert.match(await cover.locator('.book-badge').innerText(),/Book 12/);const contents=await cover.locator('.contents').innerText();assert.equal(contents.includes('Short answers'),edition==='with-short');assert.equal(contents.includes('Worked solutions'),edition==='with-worked');}
    await page.pdf({path:out+'/'+edition+'.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});
    editions.push({edition,pages:await printed.locator('.print-page').count(),hasCover});
  }
  // Each existing imported cover uses the same controls without rewriting its source.
  const imports=[];
  for(const file of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){
    const original=JSON.parse(fs.readFileSync('booklets/projects/'+file));
    record=fixture();record.id=original.id;record.title=original.title;record.revision=original.revision;
    const front=original.sections.find(s=>s.phase==='front-matter'&&s.blocks.some(b=>b.id.includes('cover')));
    if(front){record.sections.unshift(structuredClone(front));record.settings.generatedCover=false;}
    else assert.equal(original.settings.generatedCover,true,'Current booklet must have a cover');
    record.settings.cover=structuredClone(original.settings.cover??{});
    const before=JSON.stringify(record.sections);
    await open();await edit('Book number','Book 7');
    assert.equal(JSON.stringify(record.sections),before);
    await page.locator('.flow-document .booklet-cover').screenshot({path:out+'/'+record.id+'.png'});
    imports.push({id:record.id,originalRevision:original.revision,sourceUnchanged:true});
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/report.json',JSON.stringify({elapsedMs:Date.now()-start,writes:writes.length,editions,imports,errors,scope:'In-memory fixtures, real cover blocks from every current project. No saved project files modified.'},null,2));
  console.log('Cover editing, undo/redo, cancel, save/reopen, zoom, five editions and all imported cover patterns passed.');
}finally{await browser.close();}
