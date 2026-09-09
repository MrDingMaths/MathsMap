import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {sourceReferences} from '../../src/lib/booklet-source-content.js';
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const id=arg('--project'),out=arg('--out',`.booklet-work/source-review/${id}`),base=arg('--base','http://127.0.0.1:5173');
if(!id||!/^[a-zA-Z0-9._-]+$/.test(id))throw Error('Provide --project ID [--out DIR]');
const record=JSON.parse(fs.readFileSync(`booklets/projects/${id}.json`));
const block=record.sections.flatMap(s=>s.blocks).find(b=>new Set(sourceReferences(b).map(r=>r.pageNumber)).size>1);
if(!block)throw Error('This source-review check requires content referencing multiple source pages.');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());
await page.route('**/__booklet/projects/'+id,r=>r.fulfill({json:record}));
try{
 await page.goto(base+'/#/booklet?stage=projects&project='+id);
 await page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:600000});
 const selection=page.locator(`.flow-outline [data-block-id="${block.id}"] button`);
 await selection.click();
 await page.getByRole('button',{name:'Compare source',exact:true}).click();
 const refs=[...new Set(sourceReferences(block).map(r=>r.pageNumber))];
 await page.getByLabel('Source page',{exact:true}).locator('option').nth(refs.length-1).waitFor({state:'attached'});
 assert.deepEqual((await page.getByLabel('Source page',{exact:true}).locator('option').evaluateAll(els=>els.map(e=>Number(e.value)))),refs);
 for(const number of refs){
  await page.getByLabel('Source page',{exact:true}).selectOption(String(number));
  const img=page.getByAltText('Original source page '+number,{exact:true});await img.waitFor({state:'visible'});
  await img.evaluate(image=>image.decode());assert.ok(await img.evaluate(image=>image.naturalWidth>0));
 }
 await page.locator('.toolbar-actions').getByRole('button',{name:/^Review\b/}).click();
 await page.getByText('Source coverage and exceptions',{exact:true}).click();
 await page.locator('.coverage').getByText(/verified ·/).waitFor();
 assert.deepEqual(errors,[]);
 await page.screenshot({path:out+'/source-review.png'});
 fs.writeFileSync(out+'/source-review.json',JSON.stringify({project:id,block:block.id,pages:refs,coverage:true,errors},null,2));
 console.log('Source comparison follows all referenced pages and Review displays current coverage.');
}catch(error){
 await page.screenshot({path:out+'/source-review-failure.png'}).catch(()=>{});
 console.error(await page.evaluate(()=>({active:[...document.querySelectorAll('.flow-outline .content-item.active')].map(n=>n.dataset.blockId),source:[...document.querySelectorAll('.source-evidence header')].map(n=>n.textContent)})));
 throw error;
}finally{await browser.close();}
