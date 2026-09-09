// Read-only source-page mapping for a source-boundary project.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const arg=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];};
const id=arg('--project'),out=arg('--out','.booklet-work/source-pagination'),base=arg('--base','http://127.0.0.1:5173');
if(!id||!/^[\w.-]+$/.test(id))throw Error('Provide --project ID');
const project=JSON.parse(fs.readFileSync(`booklets/projects/${id}.json`));
assert.equal(project.settings.sourcePaginationPolicy,'source-boundaries');
project.settings.flowEdition='student';
const blocks=new Map(project.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1100}});
 await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());
 await page.route('**/__booklet/projects/'+id,r=>r.fulfill({json:project}));
 await page.goto(base+'/#/booklet?stage=projects&project='+id);
 await page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:600000});
 await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
 const rendered=await page.locator('.project-print .print-page').evaluateAll(pages=>pages.map(p=>({outputPage:Number(p.dataset.flowPage),blocks:(p.dataset.flowBlocks??'').split(',').filter(Boolean)})));
 let previous=0;
 for(const row of rendered){
  row.sourcePages=[...new Set(row.blocks.map(id=>blocks.get(id)?.sourcePageNumber).filter(Boolean))];
  if(row.outputPage===1&&row.sourcePages.length===0)row.sourcePages=[1];
  assert.equal(row.sourcePages.length,1,'Each output page belongs to exactly one source page: '+JSON.stringify(row));
  assert.ok(row.sourcePages[0]>=previous,'Source page order is preserved');previous=row.sourcePages[0];
 }
 const pages=project.source.inventory.selectedPages.map(sourcePage=>({sourcePage,outputPages:rendered.filter(r=>r.sourcePages.includes(sourcePage)).map(r=>r.outputPage)}));
 assert.ok(pages.every(p=>p.outputPages.length),'Every source page has a destination');
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/page-map.json',JSON.stringify({project:id,revision:project.revision,pages,rendered},null,2));
 console.log({pages:rendered.length,sourcePages:pages.length,continuations:pages.filter(p=>p.outputPages.length>1)});
}finally{await browser.close();}
