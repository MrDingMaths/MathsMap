import fs from 'node:fs';import {chromium} from 'playwright-core';
const base=process.argv.find(s=>s.startsWith('--base='))?.slice(7)??'http://localhost:5173';
const out='output/house-style-v2/',file=process.argv.find(s=>s.startsWith('--project='))?.slice(10)??out+'candidate.json',record=JSON.parse(fs.readFileSync(file)),modes=process.argv.includes('--both')?['student','worked']:['student'],only=process.argv.find(s=>s.startsWith('--pages='))?.slice(8).split(',').map(Number),tag=process.argv.find(s=>s.startsWith('--tag='))?.slice(6)??'audit';
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1700,height:1500},...(fs.existsSync(out+'browser-state.json')?{storageState:out+'browser-state.json'}:{})});const result=[];
try{await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());await page.route('**/__booklet/projects',r=>r.fulfill({json:[record]}));await page.route('**/__booklet/projects/'+record.id,r=>r.fulfill({json:record}));page.on('pageerror',e=>console.error('PAGEERROR',e.message));await page.goto(base+'/#/booklet?stage=projects&project='+record.id,{waitUntil:'networkidle'});await page.getByLabel('Booklet zoom',{exact:true}).selectOption('1');
const count=await page.locator('.section-select').count();
for(let i=0;i<count;i++){
 const source=Number(await page.locator('.section-select').nth(i).locator('b').textContent());if(only&&!only.includes(source))continue;
 await page.locator('.section-select').nth(i).evaluate(e=>e.click());
 await page.waitForFunction(n=>document.querySelector('.canvas-heading strong')?.textContent==='Page '+n,source);
 if(source!==1)await page.waitForFunction(n=>document.querySelector('.paper-scroll .booklet-page')?.dataset.pageNumber===String(n),source);
 for(const mode of modes){await page.getByRole('group',{name:'Canvas answer view'}).getByRole('button',{name:mode==='student'?'Questions':'Worked solutions',exact:true}).click();
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const report=await page.evaluate(async()=>{const {settleBooklet,inspectBookletPage}=await import('/src/lib/booklet-qa.js');const root=document.querySelector('.paper-scroll');await settleBooklet(root);const article=root.querySelector('.booklet-page');return article?inspectBookletPage(article,{style:true}):{page:1,issues:[],graphs:[],cover:true};});report.index=i;report.mode=mode;result.push(report);
 if(process.argv.includes('--screenshots')){fs.mkdirSync(out+tag+'-'+mode,{recursive:true});await page.locator('.paper-scroll .preview-page').screenshot({path:out+tag+'-'+mode+'/'+String(i+1).padStart(3,'0')+'-source-'+source+'.png',style:'.canvas-heading{visibility:hidden!important}'});}
 console.log(JSON.stringify({index:i,page:source,mode,issues:report.issues.length,kinds:[...new Set(report.issues.map(x=>x.kind))],minFont:Math.min(...report.graphs.map(x=>x.minimumPt??100)),clearance:report.footerClearanceMm}));
 fs.writeFileSync(out+tag+'.json',JSON.stringify(result,null,2));
 }
}
}finally{await page.context().storageState({path:out+'browser-state.json',indexedDB:true}).catch(()=>{});await browser.close();}
