// Page maps for the shared-content page check: which blocks sit on each printed
// page, before and after an update, rendered headlessly against the running
// Studio. Read-only, the same page-map pass as check-feedback-pages.mjs.
// Run as the background runner: node shared-content-pages.mjs --project ID [--base URL] [--checks DIR]
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {runPageChecks,sharedRootsFor,PROJECT_ROOT} from './shared-content.mjs';
import {routeCandidateProject} from './diagram-preflight.mjs';
import {contentAssetSignatures} from './verification-cache.mjs';
import {renderedPageHashes} from './page-review.mjs';

export async function renderPageMaps({base,before,after,editions=['student']}){
 if(before.id!==after.id)throw Error('Page check compares two revisions of one booklet');
 let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
 const result={before:{},after:{}};
 try{
  for(const [name,project] of [['before',before],['after',after]]){
   const context=await browser.newContext({viewport:{width:1600,height:1100}}),page=await context.newPage();
   page.setDefaultTimeout(300000);
   const record=structuredClone(project),assets=await contentAssetSignatures(record);
   await routeCandidateProject(page,record);
   for(const edition of editions){
    record.settings.flowEdition=edition;
    // A fresh document per edition paginates faster than switching in place.
    await page.goto('about:blank');
    await page.goto(base+'/#/booklet?stage=projects&project='+encodeURIComponent(record.id),{waitUntil:'domcontentloaded',timeout:180000});
    await page.locator('.flow-document').waitFor({state:'attached',timeout:600000});
    const select=page.getByLabel('Booklet edition',{exact:true});await select.waitFor({state:'visible',timeout:600000});
    for(const deadline=Date.now()+600000;;){
     if(Date.now()>deadline)throw Error('Pagination timed out');
     if(await select.inputValue()!==edition)await select.selectOption(edition);
     const state=await page.locator('.flow-document').evaluate(el=>({state:el.dataset.paginationState,edition:el.dataset.paginatedEdition,error:el.querySelector('[role=alert]')?.textContent}));
     if(state.state==='error')throw Error(state.error||'Pagination failed');
     if(state.state==='ready'&&state.edition===edition)break;
     await page.waitForTimeout(200);
    }
    await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
    await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
    await page.emulateMedia({media:'print'});
    await page.evaluate(async()=>{const {settleBooklet}=await import('/src/lib/booklet-qa.js');await settleBooklet(document.querySelector('.project-print'));});
    const pages=await page.locator('.project-print .print-page').evaluateAll(elements=>elements.map(e=>({html:e.outerHTML,blocks:e.dataset.flowBlocks?.split(',').filter(Boolean)??[]})));
    result[name][edition]=renderedPageHashes(pages,{renderer:'shared-content-page-map-v1',settings:{},assets}).map(({page,blocks,hash})=>({page,blocks,hash}));
    await page.emulateMedia({media:'screen'});
   }
   await context.close();
  }
 }finally{await browser.close();}
 return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2),arg=(name,fallback=null)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 const projectId=arg('--project');
 if(!projectId){console.error('Usage: shared-content-pages.mjs --project ID [--base URL] [--checks DIR]');process.exit(1);}
 const checkRoot=path.resolve(arg('--checks',sharedRootsFor(PROJECT_ROOT).checkRoot));
 console.log(JSON.stringify(await runPageChecks(projectId,{checkRoot,base:arg('--base','http://127.0.0.1:5173').replace(/\/$/,''),render:renderPageMaps})));
}
