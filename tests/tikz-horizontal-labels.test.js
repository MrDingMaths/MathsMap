import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {loadTikzEngine} from '../scripts/booklet/check-pgfplots-engine.mjs';
import {reserveDiagramLabelSpace} from '../src/lib/diagram-label-space.js';
import {calibrateDiagramTypography,graphPageScale} from '../src/lib/diagram-typography.js';
import {BOOKLET_HOUSE_STYLE} from '../public/libs/maths-editor/house-style.mjs';

test('six actual box-plot fields reserve horizontal labels without fitting feedback',async()=>{
 const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/compare-box-plots-labels.json',import.meta.url))),compile=await loadTikzEngine();
 const outputs=[];for(const f of fixtures)outputs.push((await compile(f.code)).svg);
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({deviceScaleFactor:2});
  const fonts=fs.readFileSync('public/libs/tikzjax/fonts.css','utf8').replace(/url\(['"]?([^)'" ]+)['"]?\)/g,(_,path)=>'url(data:font/woff2;base64,'+fs.readFileSync('public/libs/tikzjax/'+path).toString('base64')+')');
  await page.setContent('<style>'+fonts+'.stage{width:288px;padding:8px;container-type:inline-size;overflow-x:auto;background:white}.stage .tikz-wrap{width:max-content;margin-inline:auto}.stage svg{max-width:100cqw}.ordinary{width:max-content;overflow-x:auto}svg{overflow:visible}</style><main></main>');
  const rows=await page.evaluate(async({outputs,reserve,calibrate,scale,style})=>{
   const fit=new Function('BOOKLET_HOUSE_STYLE',`const graphPageScale=${scale};return ${calibrate}`)(style),space=new Function('return '+reserve)(),rows=[];
   for(const [index,source]of outputs.entries())for(const harness of [false,true]){
    const outer=document.createElement('div');outer.className=harness?'stage':'ordinary tikz-wrap';outer.innerHTML=harness?'<div class="tikz-wrap">'+source+'</div>':source;document.querySelector('main').append(outer);
    const wrap=harness?outer.firstElementChild:outer,svg=wrap.querySelector('svg');if(!harness)svg.style.width='288px';
    await document.fonts.ready;fit(outer);const native={viewBox:svg.getAttribute('viewBox'),width:svg.getBoundingClientRect().width,paths:[...svg.querySelectorAll('path')].map(p=>p.getAttribute('d'))};
    for(const zoom of [1,.7,1.4,1]){
     outer.style.transform=`scale(${zoom})`;outer.style.transformOrigin='top left';fit(outer);space(document.body);
     const first=wrap.style.cssText;fit(outer);space(document.body);if(first!==wrap.style.cssText)throw Error('Padding feedback');
     if(Math.abs(svg.getBoundingClientRect().width/zoom-native.width)>.1)throw Error('Drawing fitted again');
     if(svg.getAttribute('viewBox')!==native.viewBox||JSON.stringify([...svg.querySelectorAll('path')].map(p=>p.getAttribute('d')))!==JSON.stringify(native.paths))throw Error('Geometry changed');
     if(zoom===1&&!(Number(wrap.dataset.strokeSpaceLeft)>0))throw Error('Fixture must reserve left label ink '+JSON.stringify({index,harness}));
     if([...svg.querySelectorAll('[data-diagram-label="1"]')].some(g=>g.dataset.labelTargetPt!=='10'))throw Error('Label target changed');
    }
    const padding=wrap.style.cssText;wrap.innerHTML=wrap.innerHTML;fit(outer);space(document.body);if(padding!==wrap.style.cssText)throw Error('Cached reopen changed reservation');
    rows.push({index,harness,width:native.width,left:Number(wrap.dataset.strokeSpaceLeft)});
   }return rows;
  },{outputs,reserve:reserveDiagramLabelSpace.toString(),calibrate:calibrateDiagramTypography.toString(),scale:graphPageScale.toString(),style:BOOKLET_HOUSE_STYLE});
  assert.equal(rows.length,12);assert.ok(rows.every(r=>r.left>0));
 }finally{await browser.close();}
});
