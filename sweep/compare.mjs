// Side-by-side before/after images of the pages check-pages.ps1 rendered.
// Only pages whose raster changed are composed.
//   node sweep/compare.mjs ID [edition]
import fs from 'node:fs';
import path from 'node:path';
import {RUN_DIR} from './run.mjs';

const [id,edition='student',prefix='pages']=process.argv.slice(2);
const dir=path.join(RUN_DIR,id),read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const images=f=>new Map((read(f).editionsReport[edition]?.images??[]).map(i=>[i.page,i]));
const before=images(path.join(dir,prefix+'-before','feedback-pages.json')),after=images(path.join(dir,prefix+'-after','feedback-pages.json'));
const out=path.join(dir,'compare-'+(prefix==='pages'?'':prefix+'-')+edition);fs.mkdirSync(out,{recursive:true});
const pages=[...after.keys()].filter(p=>before.has(p)&&before.get(p).hash!==after.get(p).hash).sort((a,b)=>a-b);
// A recheck can remove a changed page. Do not leave its old comparison behind.
for(const name of fs.readdirSync(out))if(/^p\d+\.png$/.test(name))fs.unlinkSync(path.join(out,name));
const {chromium}=await import('playwright-core');
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1240,height:900}});
const uri=file=>'data:image/png;base64,'+fs.readFileSync(file).toString('base64');
const written=[];
for(const number of pages){
 await page.setContent(`<body style="margin:0;font:14px system-ui;background:#fff"><div style="display:flex;gap:16px;padding:8px">${[['Before',before],['After',after]].map(([label,set])=>`<figure style="margin:0;width:604px"><figcaption style="padding:4px 0;font-weight:600">${label} · ${id} · ${edition==='student'?'Questions':edition} p${number}</figcaption><img style="width:604px;border:1px solid #999" src="${uri(set.get(number).path)}"></figure>`).join('')}</div></body>`);
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
 const file=path.join(out,`p${String(number).padStart(3,'0')}.png`);
 await page.screenshot({path:file,fullPage:true});written.push(file);
}
await browser.close();
console.log(JSON.stringify({id,edition,changedPages:pages,files:written.map(f=>path.relative(process.cwd(),f))}));
