import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {loadTikzEngine} from '../scripts/booklet/check-pgfplots-engine.mjs';
import {calibrateDiagramTypography,graphPageScale} from '../src/lib/diagram-typography.js';
import {BOOKLET_HOUSE_STYLE} from '../public/libs/maths-editor/house-style.mjs';

test('native white node rectangles follow whole fractions across fitting, zoom, cached reopening and hidden print copies',async()=>{
  const compile=await loadTikzEngine();
  const {svg}=await compile(String.raw`\begin{tikzpicture}[x=1cm,y=1cm]
  \path[use as bounding box] (-3,-2) rectangle (4,3);
  \draw (-3,0)--(4,0);
  \draw[fill=white] (2,0) circle[radius=2pt];
  \node[left,fill=white,inner sep=1pt] at (0,1) {\special{dvisvgm:raw <g data-graph-text="tick">}$\frac12$\special{dvisvgm:raw </g>}};
  \node[rotate=25,fill=white] at (1,2) {$x_1^2$};
  \node[fill=gray] at (-1,-1) {A};
  \end{tikzpicture}`);
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const page=await browser.newPage();
    await page.setContent('<style>.booklet-page{width:210mm;transform-origin:top left}.slot svg{width:100%;height:auto}</style><article class="booklet-page"><div class="slot">'+svg+'</div></article>');
    const result=await page.evaluate(({calibrate,scale,style})=>{
      const f=new Function('BOOKLET_HOUSE_STYLE',`const graphPageScale=${scale};return ${calibrate}`)(style),article=document.querySelector('article'),slot=document.querySelector('.slot');
      const snapshot=()=>[...slot.querySelectorAll('path,rect,circle')].filter(n=>!n.closest('[data-diagram-label]')).map(n=>({d:n.getAttribute('d'),fill:n.getAttribute('fill'),background:n.dataset.diagramLabelBackground,transform:n.getAttribute('transform')}));
      const original=snapshot(),rows=[];
      for(const zoom of [1,.65,2,1])for(const width of [45,55,120,40]){
        article.style.transform=`scale(${zoom})`;slot.style.width=width+'mm';f(article);
        const masks=[...slot.querySelectorAll('[data-diagram-label-background="1"]')];if(masks.length!==2)throw Error('Only two single-label white rectangles must be paired');
        const first=masks.map(m=>m.getAttribute('transform'));f(article);
        if(first.some((v,i)=>v!==masks[i].getAttribute('transform')))throw Error('Cumulative background calibration');
        for(const mask of masks){let container=mask.parentElement;while(container.querySelectorAll('[data-diagram-label]').length!==1)container=container.parentElement;const label=container.querySelector('[data-diagram-label]'),m=mask.getScreenCTM(),g=label.getScreenCTM();
          // Both the background and complete label share the same final world scale,
          // including source rotations. Fraction scripts remain in that whole label.
          // PGF rounds its source rotation coefficients to five decimals; retain
          // that original geometry while checking agreement far below 0.1 pt.
          if(Math.abs(Math.hypot(m.a,m.b)-Math.hypot(g.a,g.b))>1e-4)throw Error('Background detached from complete-label scale '+JSON.stringify({zoom,width,mask:[m.a,m.b,m.c,m.d],label:[g.a,g.b,g.c,g.d],transform:mask.getAttribute('transform')}));
        }
        const current=snapshot();for(let i=0;i<current.length;i++){if(current[i].d!==original[i].d||current[i].fill!==original[i].fill)throw Error('Native geometry or fill changed');if(!current[i].background&&current[i].transform!==original[i].transform)throw Error('Nonlabel circle/path/fill changed');}
        rows.push({zoom,width,masks:masks.length});slot.innerHTML=slot.innerHTML;f(article);
      }
      const before=slot.innerHTML;article.style.display='none';f(article);if(slot.innerHTML!==before)throw Error('Hidden print correction lost');article.style.display='';f(article);
      return rows;
    },{calibrate:calibrateDiagramTypography.toString(),scale:graphPageScale.toString(),style:BOOKLET_HOUSE_STYLE});
    assert.equal(result.length,16);
  }finally{await browser.close();}
});
