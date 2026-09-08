import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';

const out='output/graph-strokes',browser=await chromium.launch({headless:true,channel:'chrome'}),report=[];
try{
  const page=await browser.newPage();
  for(const [edition,pages] of [['student',[9,41,49,85,91,96]],['worked',[9,41,49,85,91,96]],['short',[1,5,15,25,34]]]){
    const file=`output/pdf/linear-relationships-${edition}-strokes.pdf`;
    for(const number of pages){
      const svgFile=`${out}/${edition}-pdf-page-${number}.svg`;
      const r=spawnSync('pdftocairo',['-svg','-f',String(number),'-l',String(number),file,svgFile],{encoding:'utf8',windowsHide:true});
      if(r.error||r.status)throw Error(r.error?.message??r.stderr);
      await page.setContent(fs.readFileSync(svgFile,'utf8'));
      const measured=await page.evaluate(()=>{
        const strokes=[];
        for(const p of document.querySelectorAll('svg path')){
          if(p.closest('defs,clipPath'))continue;
          const css=getComputedStyle(p);if(css.stroke==='none')continue;
          const m=p.getScreenCTM();
          const width=parseFloat(css.strokeWidth)*Math.sqrt(Math.abs(m.a*m.d-m.b*m.c))*72/96;
          strokes.push({width,colour:css.stroke});
        }
        return strokes;
      });
      const plotColours=[[38,140,255],[239,96,104],[79,155,99]];
      // PDF colour channels can round to fractional RGB values on conversion.
      const coloured=measured.filter(p=>{const rgb=p.colour.match(/[\d.]+/g)?.map(Number);return rgb&&plotColours.some(c=>c.every((v,i)=>Math.abs(v-rgb[i])<.1));});
      // These sample pages contain coloured graph strokes, including annotation
      // pointers (0.4 pt), so accept both declared semantic targets.
      const error=Math.max(0,...coloured.map(p=>Math.min(Math.abs(p.width-.8),Math.abs(p.width-.4))));
      const row={edition,page:number,colouredStrokeCount:coloured.length,maximumErrorPt:error,widths:[...new Set(coloured.map(p=>+p.width.toFixed(5)))]};
      report.push(row);assert.ok(error<=.05,JSON.stringify(row));
      if(edition==='student'&&number===85){
        assert.ok(measured.length>0);
        assert.ok(measured.every(p=>[.8,.5,.4,.25,.15].some(t=>Math.abs(p.width-t)<=.05)),'Graph-only page has an unexpected printed stroke');
      }
    }
  }
  fs.writeFileSync(out+'/pdf-stroke-measurements.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({pages:report.length,strokes:report.reduce((s,r)=>s+r.colouredStrokeCount,0),maximumErrorPt:Math.max(...report.map(r=>r.maximumErrorPt))}));
}finally{await browser.close();}
