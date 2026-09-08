import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { sha, verifyPins } from './benchmark.mjs';
const base=path.resolve(process.argv[2]),manifest=JSON.parse(fs.readFileSync(path.join(base,'benchmark.json'))),selected=process.argv[3]??'all';
let frozen='';try{verifyPins(manifest.rendererPins);}catch{const snapshot=path.join(base,'frozen-renderer');for(const [file,hash]of Object.entries(manifest.rendererPins)){const target=fs.existsSync(path.join(snapshot,file))?path.join(snapshot,file):path.resolve(file);if(sha(fs.readFileSync(target))!==hash)throw new Error('Frozen renderer unavailable: '+file);}frozen='/'+path.relative(process.cwd(),snapshot).replaceAll('\\','/');}
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:850,height:1200},deviceScaleFactor:1});
let errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/scripts/booklet/preview.html'+(frozen?'?frozen='+encodeURIComponent(frozen):''),{waitUntil:'networkidle'});
await page.waitForFunction(()=>typeof window.renderCandidate==='function');
try{
 for(const arm of manifest.arms.filter(a=>selected==='all'||a.id===selected)){
  const candidates=manifest.packets.flatMap(p=>{const file=path.join(base,'runs',arm.id,p.id,'candidate.json');return fs.existsSync(file)?[{packet:p,file,result:JSON.parse(fs.readFileSync(file))}]:[];});
  const pages=candidates.flatMap(c=>c.result.pages??[]).sort((a,b)=>a.pageNumber-b.pageNumber);if(!pages.length)continue;
  // Keep original source page ordering even when some benchmark packets failed.
  const complete=manifest.packets.flatMap(p=>p.pages).sort((a,b)=>a-b).map(n=>pages.find(p=>p.pageNumber===n)??{id:'page-'+n,pageNumber:n,section:{title:'Unavailable candidate',headingStyle:'none'},blocks:[]});
  for(const p of pages)for(const mode of ['student','short','worked']){
   const dir=path.join(base,'renders',arm.id,mode);fs.mkdirSync(dir,{recursive:true});const prefix=path.join(dir,'page-'+String(p.pageNumber).padStart(3,'0'));
   if(fs.existsSync(prefix+'.json'))continue;
   errors=[];await page.evaluate(v=>window.renderCandidate(v),{pages:complete,pageNumber:p.pageNumber,mode});
   await page.waitForTimeout(150);await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(()=>[...document.querySelectorAll('.tikz-wrap')].every(e=>e.querySelector('.tikz-error')||[...e.querySelectorAll('svg')].some(s=>!s.querySelector('animate'))),null,{timeout:300000}).catch(()=>{});
   await page.waitForTimeout(200);
   const metrics=await page.evaluate(()=>{
    const root=document.querySelector('.preview-page'),article=root.querySelector('article'),bounds=article.getBoundingClientRect();
    const visible=[...root.querySelectorAll('*')].filter(e=>e.getClientRects().length&&!e.closest('.katex-mathml')&&!e.closest('svg'));
    const overflow=visible.filter(e=>{const b=e.getBoundingClientRect();return b.right>bounds.right+1||b.left<bounds.left-1||b.bottom>bounds.bottom+1;}).slice(0,25).map(e=>({tag:e.tagName,id:e.dataset.id??e.closest('[data-node-id]')?.dataset.nodeId,text:e.textContent.slice(0,100)}));
    const failedTikz=[...root.querySelectorAll('.tikz-wrap')].filter(e=>e.querySelector('.tikz-error')||!e.querySelector('svg')).map(e=>({id:e.closest('[data-node-id]')?.dataset.nodeId,error:e.textContent.slice(0,200)}));
    const badAssets=[...root.querySelectorAll('img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src);
    const cellOverflow=[...root.querySelectorAll('td,th')].filter(e=>e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2).map(e=>e.dataset.id??e.textContent.slice(0,40));
    return{overflow,failedTikz,badAssets,cellOverflow,text:root.innerText,diagrams:root.querySelectorAll('.tikz-wrap svg').length,annotations:root.querySelectorAll('[data-table-annotations]').length};
   });
   await page.locator('.preview-page').screenshot({path:prefix+'.png'});
   fs.writeFileSync(prefix+'.json',JSON.stringify({page:p.pageNumber,mode,rendererHash:sha(JSON.stringify(manifest.rendererPins)),errors,metrics},null,2));
   console.log(JSON.stringify({arm:arm.id,page:p.pageNumber,mode,errors:errors.length,tikzFailures:metrics.failedTikz.length,overflow:metrics.overflow.length}));
  }
 }
}finally{await browser.close();}
