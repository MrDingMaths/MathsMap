import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright-core';

test('teaching responses retain readable diagram widths while practice answers stay compact',async()=>{
 const server=await createServer({logLevel:'error',server:{port:0,open:false}});
 await server.listen();
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+server.httpServer.address().port,{waitUntil:'domcontentloaded'});
  const widths=await page.evaluate(async()=>{
   const {mount,unmount}=await import('/node_modules/svelte/src/index-client.js');
   const {default:Renderer}=await import('/src/components/PracticeQuestionRenderer.svelte');
   const results=[];
   for(const kind of ['investigation','review','practice']){
    const target=document.createElement('div');target.style.width='180mm';document.body.append(target);
    const question={id:'width-'+kind,type:'question',pedagogyRole:kind,content:{id:'root-'+kind,type:'question',prompt:'Plot the curve.',answer:{worked:'The curve has positive inputs.',solutionDiagrams:[{id:'diagram-'+kind,format:'image',widthMm:104,src:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"/>')}]}}};
    if(kind==='investigation')question.sourceAtom={id:'source-investigation',kind};
    const component=mount(Renderer,{target,props:{question,showWorkedSolutions:true}});
    await new Promise(requestAnimationFrame);
    results.push({kind,width:target.querySelector('.diagram-resize-shell').getBoundingClientRect().width*25.4/96});
    await unmount(component);target.remove();
   }
   return results;
  });
  for(const {kind,width}of widths)assert.ok(Math.abs(width-(kind==='practice'?60:104))<0.1,`${kind}: ${width}mm`);
 }finally{await browser.close();await server.close();}
});
