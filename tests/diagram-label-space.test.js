import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from 'katex';
import {chromium} from 'playwright-core';
import {loadTikzEngine} from '../scripts/booklet/check-pgfplots-engine.mjs';
import {calibrateDiagramTypography,graphPageScale} from '../src/lib/diagram-typography.js';
import {BOOKLET_HOUSE_STYLE} from '../public/libs/maths-editor/house-style.mjs';
import {reserveDiagramLabelSpace} from '../src/lib/diagram-label-space.js';

test('measured label overhang reserves flow without changing native fitting, across zoom, reopening and print',async()=>{
  const compile=await loadTikzEngine();
  const {svg}=await compile(String.raw`\begin{tikzpicture}[x=1cm,y=1cm]
  \draw (-1,0)--(1,0);
  \node[above,fill=white,inner sep=1pt] at (0,0.24) {$\frac{x_1^2}{2}$};
  \node[below,rotate=25,fill=white,inner sep=1pt] at (0,-0.24) {$y_2^3$};
  \node[right] at (0.9,0) {$(-3-\sqrt{21},0)$};
  \pgfresetboundingbox
  \path[use as bounding box] (-1,-0.25) rectangle (1,0.25);
  \end{tikzpicture}`);
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page=await browser.newPage();
    const mathsCss=fs.readFileSync('node_modules/katex/dist/katex.min.css','utf8').replace(/url\((fonts\/[^)]+)\)/g,(_,name)=>'url(data:font/woff2;base64,'+fs.readFileSync('node_modules/katex/dist/'+name).toString('base64')+')');
    await page.setContent('<style>'+mathsCss+'.booklet-page{width:210mm;transform-origin:top left}p{margin:0;font:9pt serif}.tikz-wrap{box-sizing:border-box;padding:3px 0 5px;overflow:visible}svg{display:block;width:100%;height:auto}</style><article class="booklet-page"><p>'+katex.renderToString(String.raw`(-\frac12,\frac{3}{4})` )+'</p><div class="tikz-wrap">'+svg+'</div><p>'+katex.renderToString(String.raw`x\ge\frac{2b}{a}`)+'</p></article>');
    await page.evaluate(()=>document.fonts.ready);
    const rows=await page.evaluate(({calibrate,scale,reserve,style})=>{
      const fit=new Function('BOOKLET_HOUSE_STYLE',`const graphPageScale=${scale};return ${calibrate}`)(style),reserveSpace=new Function(`return ${reserve}`)();
      const article=document.querySelector('article'),wrapper=document.querySelector('.tikz-wrap');
      const geometry=()=>[...wrapper.querySelectorAll('path')].map(n=>n.getAttribute('d'));
      const original=geometry(),rows=[];
      for(const zoom of [1,.65,2,1])for(const width of [45,55,120,40]) {
        article.style.transform=`scale(${zoom})`;wrapper.style.width=width+'mm';fit(article);
        const svg=wrapper.querySelector('svg'),before=svg.getBoundingClientRect(),viewBox=svg.getAttribute('viewBox');
        reserveSpace(article);
        const reservation=wrapper.style.cssText,top=Number(wrapper.dataset.labelSpaceTop),bottom=Number(wrapper.dataset.labelSpaceBottom);
        if(!(top>0&&bottom>0))throw Error('Fixture must reserve real top and bottom ink');
        if(Math.abs(parseFloat(wrapper.style.paddingTop)-top-3)>.001||Math.abs(parseFloat(wrapper.style.paddingBottom)-bottom-5)>.001)throw Error('Manual padding lost');
        fit(article);reserveSpace(article);
        if(wrapper.style.cssText!==reservation)throw Error('Cumulative reservation');
        const after=svg.getBoundingClientRect();
        if(Math.abs(before.width-after.width)>.01||Math.abs(before.height-after.height)>.01||viewBox!==svg.getAttribute('viewBox'))throw Error('Native fitting changed');
        if(JSON.stringify(original)!==JSON.stringify(geometry()))throw Error('Native mathematical paths changed');
        if([...wrapper.querySelectorAll('[data-diagram-label]')].some(n=>n.dataset.labelTargetPt!=='10'))throw Error('Whole label target changed');
        const outer=wrapper.getBoundingClientRect();
        if(after.top-top*zoom<outer.top-0.1||after.bottom+bottom*zoom>outer.bottom+0.1)throw Error('Reserved extent outside flow');
        if(wrapper.previousElementSibling.getBoundingClientRect().bottom>outer.top+.1||wrapper.nextElementSibling.getBoundingClientRect().top<outer.bottom-.1)throw Error('Adjacent native maths collides with reserved flow');
        wrapper.innerHTML=wrapper.innerHTML;fit(article);reserveSpace(article);
        if(wrapper.style.cssText!==reservation)throw Error('Cached reopening changed reservation');
        // Pagination renders fresh native art inside an offscreen, visibility-
        // hidden surface. Cold measurements must include the same ink padding.
        wrapper.style.paddingTop='3px';wrapper.style.paddingBottom='5px';
        delete wrapper.dataset.labelSpaceOriginalTop;delete wrapper.dataset.labelSpaceOriginalBottom;
        article.classList.add('flow-measure');article.style.visibility='hidden';
        fit(article);reserveSpace(article);
        if(wrapper.style.cssText!==reservation)throw Error('Hidden pagination omitted visible print ink');
        article.classList.remove('flow-measure');article.style.visibility='';
        fit(article);reserveSpace(article);
        if(wrapper.style.cssText!==reservation)throw Error('Measured pagination changed on visible print');
        rows.push({zoom,width,top,bottom});
      }
      // Real answer diagrams use an auto-width wrapper inside a fixed slot.
      // Repeated horizontal reservation must not shrink it to zero.
      const slot=document.createElement('div');slot.style.width='45mm';wrapper.before(slot);slot.append(wrapper);
      article.style.transform='';wrapper.style.width='';wrapper.style.boxSizing='border-box';
      wrapper.style.paddingLeft='0px';wrapper.style.paddingRight='0px';
      delete wrapper.dataset.labelSpaceOriginalLeft;delete wrapper.dataset.labelSpaceOriginalRight;
      fit(article);const nativeWidth=wrapper.querySelector('svg').getBoundingClientRect().width;
      for(let pass=0;pass<30;pass++){
        fit(article);reserveSpace(article);
        if(Math.abs(wrapper.querySelector('svg').getBoundingClientRect().width-nativeWidth)>.01)throw Error('Auto-width geometry consumed by horizontal reservation');
        for(const label of wrapper.querySelectorAll('[data-diagram-label]')){
          const matrix=label.getScreenCTM(),pageScale=article.getBoundingClientRect().width/(210*96/25.4),pt=Number(label.dataset.labelFont)*Math.hypot(matrix.c,matrix.d)*72/96/pageScale;
          if(Math.abs(pt-10)>.01)throw Error('Auto-width label calibration diverged');
        }
      }
      const padding=wrapper.style.cssText;article.style.display='none';fit(article);reserveSpace(article);
      if(wrapper.style.cssText!==padding)throw Error('Hidden print copy lost valid measurement');
      article.style.display='';fit(article);reserveSpace(article);
      if(wrapper.style.cssText!==padding)throw Error('Visible print copy changed reservation');
      // A fully contained calibrated native label needs no additional spacing.
      wrapper.innerHTML='<svg viewBox="0 0 100 100"><g data-diagram-label="1"><text x="40" y="50">x</text></g></svg>';
      reserveSpace(article);
      if(wrapper.style.paddingTop!=='3px'||wrapper.style.paddingBottom!=='5px')throw Error('Contained label added spacing');
      return rows;
    },{calibrate:calibrateDiagramTypography.toString(),scale:graphPageScale.toString(),reserve:reserveDiagramLabelSpace.toString(),style:BOOKLET_HOUSE_STYLE});
    assert.equal(rows.length,16);
    await page.emulateMedia({media:'print'});
    await page.evaluate(new Function(`const reserve=${reserveDiagramLabelSpace.toString()};reserve(document.body);`));
    assert.deepEqual(await page.locator('.tikz-wrap').evaluate(n=>[n.style.paddingTop,n.style.paddingBottom]),['3px','5px']);
  }finally{await browser.close();}
});
