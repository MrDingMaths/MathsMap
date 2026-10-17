// How full each Questions page is, from the print surface Studio paginates.
// Read-only: the project is served through a request intercept (as in
// first-pass/review.mjs) and nothing is saved.
import {withRenderResource,BASE} from '../first-pass/review.mjs';

export async function renderPageFill(project,{base=BASE,edition='student',debug=false}={}){
 return withRenderResource(async()=>{
  const {chromium}=await import('playwright-core'),{routeCandidateProject}=await import('../scripts/booklet/diagram-preflight.mjs');
  let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
  try{
   const page=await(await browser.newContext({viewport:{width:1600,height:1100}})).newPage(),record=structuredClone(project);
   page.setDefaultTimeout(300000);
   await routeCandidateProject(page,record);
   record.settings.flowEdition=edition;
   await page.goto(base+'/#/booklet?stage=projects&project='+encodeURIComponent(project.id),{waitUntil:'domcontentloaded',timeout:180000});
   await page.locator('.flow-document').waitFor({state:'attached',timeout:600000});
   const select=page.getByLabel('Booklet edition',{exact:true});await select.waitFor({state:'visible',timeout:600000});
   for(const deadline=Date.now()+600000;;){
    if(await select.inputValue()!==edition)await select.selectOption(edition);
    const state=await page.locator('.flow-document').evaluate(el=>({state:el.dataset.paginationState,edition:el.dataset.paginatedEdition}));
    if(state.state==='ready'&&state.edition===edition)break;
    if(state.state==='error')throw Error('Pagination failed for '+edition);
    if(Date.now()>deadline)throw Error('Pagination timed out for '+edition);
    await page.waitForTimeout(200);
   }
   await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
   await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
   await page.emulateMedia({media:'print'});
   await page.evaluate(async()=>{const {settleBooklet}=await import('/src/lib/booklet-qa.js');await settleBooklet(document.querySelector('.project-print'));});
   return await page.locator('.project-print .print-page').evaluateAll((elements,debug)=>elements.map((element,i)=>{
    const box=element.getBoundingClientRect();
    // The body runs from the top of the first printed element to the footer.
    const footer=element.querySelector('footer,.print-footer,.page-footer,[class*="footer"]');
    const bottom=footer?footer.getBoundingClientRect().top:box.bottom;
    const items=[...element.querySelectorAll('[data-question-id],[data-node-id],[data-diagram-id],.section-header,.exercise-heading,h1,h2,h3,table,svg,img')].filter(el=>!footer?.contains(el));
    let top=bottom,used=box.top;
    for(const el of items){const r=el.getBoundingClientRect();if(r.height<1)continue;top=Math.min(top,r.top);used=Math.max(used,r.bottom);}
    const header=element.querySelector('header,.print-header,.page-header');
    const start=header?header.getBoundingClientRect().bottom:Math.min(top,box.top+box.height*0.12);
    return {page:i+1,blocks:element.dataset.flowBlocks?.split(',').filter(Boolean)??[],fill:Math.max(0,Math.min(1,(used-start)/Math.max(1,bottom-start))),isAnswer:!!element.querySelector('.compact-answer,.answer-columns,[id*="answer-section-"]'),isCover:!!element.querySelector('.booklet-cover,.project-cover'),...(debug&&i<2?{classes:[...element.children].map(c=>c.className)}:{})};
   }),debug);
  }finally{await browser.close();}
 });
}
