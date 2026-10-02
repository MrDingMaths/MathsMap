import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';

// Use an isolated server and native SVG without compiling TikZ.
test('settleBooklet stabilizes padding-induced scale changes before immediate QA', {timeout:120000}, async()=>{
 const server=await createServer({cacheDir:'.booklet-work/test-cache/qa-settling',logLevel:'error',server:{host:'127.0.0.1',port:0,open:false}});
 await server.listen();
 let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const page=await browser.newPage();
  const url='http://127.0.0.1:'+server.httpServer.address().port+'/__qa-settling-fixture';
  await page.route(url,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head></head><body></body></html>'}));
  await page.goto(url);
  await page.addStyleTag({content:`
   body { margin:0; }
   .booklet-page { position:relative; width:210mm; height:297mm; }
   main { margin:0 10mm; padding-top:40px; }
   footer { position:absolute; bottom:10mm; left:10mm; height:10px; }
   .tikz-wrap { width:272.125px; box-sizing:border-box; overflow:auto; }
   .tikz-wrap svg { display:block; width:100%; height:auto; }
   @media print { .tikz-wrap { width:250px; } }
  `});
  for(const media of ['screen','print']){
   await page.emulateMedia({media});
   for(const zoom of [1,.75])for(const watched of [false,true]){
    const result=await page.evaluate(async({zoom,watched})=>{
     const {settleBooklet,inspectBooklet,assertBookletFits}=await import('/src/lib/booklet-qa.js');
     const {calibrateGraphStrokes,watchGraphStrokes}=await import('/src/lib/graph-strokes.js');
     const {measureDiagramLabels}=await import('/src/lib/diagram-typography.js');
     const fixture=()=>{
      const root=document.createElement('div');
      root.innerHTML=`<article class="booklet-page" data-page-number="1" style="zoom:${zoom}">
       <main><div class="tikz-wrap" data-diagram-id="padding-scale-regression">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
         <metadata data-graph-strokes="1" data-diagram-kind="geometry"/>
         <rect x="0" y="0" width="100" height="60" fill="none" stroke="#000000" stroke-width="2" data-graph-stroke-pt="2"/>
         <g data-diagram-label="1" data-label-font="10" data-label-anchor="base" data-tick-target="8.5">
          <text x="20" y="25" font-family="sans-serif" font-size="10" fill="#000000">A</text>
         </g>
         <g data-diagram-label="1" data-label-font="10" data-label-anchor="base" data-tick-target="8.5">
          <text x="70" y="45" font-family="sans-serif" font-size="10" fill="#000000" data-graph-text="tick">1</text>
         </g>
        </svg>
       </div></main><footer></footer>
      </article>`;
      document.body.replaceChildren(root);
      return root;
     };
     const baseline=fixture(),baselineSvg=baseline.querySelector('svg');
     const originalWidth=baselineSvg.getBoundingClientRect().width;
     calibrateGraphStrokes(baseline);
     const shrunkWidth=baselineSvg.getBoundingClientRect().width;
     const initialIssues=inspectBooklet(baseline,{style:true}).flatMap(p=>p.issues);
     // Start settling from a fresh, uncalibrated fixture. Reusing the baseline
     // would conceal the original bug by supplying its missing first pass.
     const root=fixture(),wrapper=root.querySelector('.tikz-wrap'),svg=root.querySelector('svg');
     const stop=watched?watchGraphStrokes(wrapper):()=>{};
     const metrics=()=>({
      width:svg.getBoundingClientRect().width,
      padding:[wrapper.style.paddingTop,wrapper.style.paddingRight,wrapper.style.paddingBottom,wrapper.style.paddingLeft],
      labels:measureDiagramLabels(svg)
     });
     try{
      await settleBooklet(root);
      const firstReport=assertBookletFits(inspectBooklet(root,{style:true}));
      const first=metrics();
      await settleBooklet(root);
      const repeatedReport=assertBookletFits(inspectBooklet(root,{style:true}));
      const repeated=metrics();
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      const laterReport=assertBookletFits(inspectBooklet(root,{style:true}));
      return {originalWidth,shrunkWidth,initialIssues,firstReport,repeatedReport,laterReport,first,repeated,later:metrics()};
     }finally{stop();}
    },{zoom,watched});
    const scenario=`${media}, zoom ${zoom}, observer ${watched}`;
    assert.ok(result.shrunkWidth<result.originalWidth,scenario+': padding must change SVG scale');
    assert.ok(result.initialIssues.some(i=>i.kind==='small-graph-label'),scenario+': reproduce immediate undersized labels');
    for(const report of [result.firstReport,result.repeatedReport,result.laterReport]){
     assert.equal(report.length,1,scenario);
     assert.equal(report[0].graphs.length,1,scenario);
     assert.deepEqual(report[0].issues,[],scenario);
    }
    assert.equal(result.first.labels.length,2,scenario);
    assert.deepEqual(result.first.labels.map(label=>label.targetPt),[10,8.5],scenario);
    for(const label of result.first.labels)assert.ok(Math.abs(label.pt-label.targetPt)<=.1,scenario);
    assert.ok(parseFloat(result.first.padding[1])>0&&parseFloat(result.first.padding[3])>0,scenario);
    assert.deepEqual(result.repeated,result.first,scenario+': repeated settling must be stable');
    assert.deepEqual(result.later,result.repeated,scenario+': no deferred correction after settling');
   }
  }
 }finally{try{await browser?.close();}finally{await server.close();}}
});
