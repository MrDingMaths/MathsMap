// Visual contact sheets at physical diagram widths, plus text-role measurements.
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const dir='output/graph-typography',records=JSON.parse(fs.readFileSync(dir+'/measurements.json'));
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1450,height:1100},deviceScaleFactor:1.5});
try{
 await page.goto('http://127.0.0.1:5173/libs/tikzjax/fonts.css');
 const metrics=[];
 for(let start=0;start<records.length;start+=12){
  const batch=records.slice(start,start+12);
  await page.setContent('<link rel="stylesheet" href="/libs/tikzjax/fonts.css"><style>body{font:12px Arial;margin:15px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}figure{margin:0;padding:8px;border:1px solid #ddd;min-height:180px}figcaption{margin-bottom:12px}.graph svg{width:100%;height:auto;display:block}</style><main>'+batch.map(r=>'<figure><figcaption>'+r.id+'</figcaption><div class="graph" data-id="'+r.id+'" style="width:'+r.widthMm+'mm">'+fs.readFileSync(r.svg,'utf8').replace(/id="([^"]+)"/g,(_,id)=>'id="'+r.id+'-'+id+'"').replace(/url\(#/g,'url(#'+r.id+'-').replace(/href="#/g,'href="#'+r.id+'-')+'</div></figure>').join('')+'</main>');
  await page.evaluate(()=>document.fonts.ready);
  metrics.push(...await page.evaluate(()=>[...document.querySelectorAll('.graph')].map(g=>{const texts=[...g.querySelectorAll('text')].map(t=>{const m=t.getScreenCTM();return{tick:!!t.closest('[data-graph-text="tick"]'),pt:parseFloat(getComputedStyle(t).fontSize)*Math.hypot(m.c,m.d)*72/96};});const ctx=document.createElement('canvas').getContext('2d');const ticks=[...g.querySelectorAll('[data-graph-text="tick"]')].map(group=>{const a=[...group.querySelectorAll('text')].map(t=>{const css=getComputedStyle(t);ctx.font=css.fontSize+' '+css.fontFamily;const z=ctx.measureText(t.textContent),m=t.getScreenCTM(),x=t.x.baseVal[0].value,y=t.y.baseVal[0].value;const p=new DOMPoint(x-z.actualBoundingBoxLeft,y-z.actualBoundingBoxAscent).matrixTransform(m),q=new DOMPoint(x+z.actualBoundingBoxRight,y+z.actualBoundingBoxDescent).matrixTransform(m);return{left:Math.min(p.x,q.x),right:Math.max(p.x,q.x),top:Math.min(p.y,q.y),bottom:Math.max(p.y,q.y)};});return{left:Math.min(...a.map(r=>r.left)),right:Math.max(...a.map(r=>r.right)),top:Math.min(...a.map(r=>r.top)),bottom:Math.max(...a.map(r=>r.bottom))};}).filter(r=>r.right>r.left&&r.bottom>r.top);let collisions=0;for(let a=0;a<ticks.length;a++)for(let b=a+1;b<ticks.length;b++){const x=ticks[a],y=ticks[b];if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>.5&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>.5)collisions++;}return{id:g.dataset.id,tickCollisions:collisions,minimumPt:Math.min(...texts.map(t=>t.pt)),labelMinimumPt:Math.min(...texts.filter(t=>!t.tick).map(t=>t.pt))};})));
  await page.screenshot({path:dir+'/sheet-'+String(start/12+1).padStart(2,'0')+'.png',fullPage:true});
 }
 fs.writeFileSync(dir+'/text-review.json',JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics.filter(r=>r.tickCollisions||r.minimumPt<7.9||r.labelMinimumPt<9.9),null,2));
}finally{await browser.close();}
