import test from 'node:test';
import {standardBookletContent} from '../public/libs/maths-editor/booklet-palette.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {loadTikzEngine} from '../scripts/booklet/check-pgfplots-engine.mjs';
import {calibrateDiagramTypography,measureDiagramLabels} from '../src/lib/diagram-typography.js';
import {graphPageScale} from '../src/lib/graph-strokes.js';
import {BOOKLET_HOUSE_STYLE} from '../public/libs/maths-editor/house-style.mjs';
import {normaliseShortAnswer} from '../src/lib/short-answer-style.js';
import {migrateShortAnswerColours} from '../scripts/booklet/normalise-short-answer-colours.mjs';
import {updateProjectContent} from '../src/lib/editable-booklet-model.js';

test('complete TeX labels retain scripts, fraction rules, rotation and size after resizing, zoom and SVG reopen',async()=>{
  const compile=await loadTikzEngine();
  const {svg}=await compile(String.raw`\begin{tikzpicture}[scale=1.7]
  \draw (0,0)--(5,0);
  \node[above,rotate=30] at (1,0) {$x_1^2+\frac{a}{b}$};
  \node[right,font=\small] at (3,0) {$45^\circ$};
  \node[left,font=\Large] at (0,0) {A};
  \end{tikzpicture}`);
  assert.equal((svg.match(/data-diagram-label=/g)||[]).length,3);
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const page=await browser.newPage();
    await page.setContent('<style>.booklet-page{width:210mm;transform-origin:top left} .slot svg{width:100%;height:auto}</style><article class="booklet-page"><div class="slot">'+svg+'</div></article>');
    const results=await page.evaluate(({calibrate,measure,scale,style})=>{
      const f=new Function('BOOKLET_HOUSE_STYLE',`const graphPageScale=${scale};return {calibrate:${calibrate},measure:${measure}}`)(style);
      const article=document.querySelector('article'),slot=document.querySelector('.slot'),rows=[];
      for(const zoom of [1,.65,2,1])for(const width of [40,120,60,40]){
        article.style.transform=`scale(${zoom})`;slot.style.width=width+'mm';
        f.calibrate(article);
        const transforms=()=>[...slot.querySelectorAll('[data-diagram-label]')].map(g=>g.getAttribute('transform')).join('|');
        const first=transforms();f.calibrate(article);
        if(first!==transforms())throw Error('Cumulative scaling');
        const svg=slot.querySelector('svg'),groups=[...svg.querySelectorAll('[data-diagram-label]')];
        rows.push({zoom,width,labels:f.measure(svg),scripts:groups[0].querySelectorAll('text[font-size="7"]').length,fraction:groups[0].querySelectorAll('rect,path').length});
        // Serialized cache/reopen must not double-apply the previous correction.
        slot.innerHTML=slot.innerHTML;f.calibrate(article);
        rows.push({zoom,width,labels:f.measure(slot.querySelector('svg'))});
      }
      return rows;
    },{calibrate:calibrateDiagramTypography.toString(),measure:measureDiagramLabels.toString(),scale:graphPageScale.toString(),style:BOOKLET_HOUSE_STYLE});
    for(const row of results){assert.equal(row.labels.length,3);for(const label of row.labels)assert.ok(Math.abs(label.pt-10)<.001,JSON.stringify(row));}
    assert.ok(results[0].scripts>0);assert.ok(results[0].fraction>0);
  }finally{await browser.close();}
});

test('short-answer maintenance and edits preserve meaning, teaching, worked content and local layout',()=>{
  const blue=String.raw`Length $\color{#056FDB}\frac{a^2}{b}$; $\color{#16803d}{\checkmark}$ Yes.`;
  const rich={format:'maths-editor-document-v1',blocks:[{id:'p',type:'paragraph',inlines:[{type:'text',text:'Length ',colour:'#056FDB'},{type:'math',latex:String.raw`\color{#056FDB}x^2`},{type:'text',text:'Blue series',colour:'#268cff',colourMeaning:'Graph series'}]}]};
  assert.equal(normaliseShortAnswer(blue),String.raw`Length $\frac{a^2}{b}$; $\color{#16803d}{\checkmark}$ Yes.`);
  const inlineDiagram=String.raw`[tikz]\node {$\color{blue}x$};[/tikz]`;
  assert.equal(normaliseShortAnswer(inlineDiagram),inlineDiagram);
  const clean=normaliseShortAnswer(rich);assert.equal(clean.blocks[0].inlines[0].colour,undefined);assert.equal(clean.blocks[0].inlines[2].colour,'#268cff');assert.equal(clean.blocks[0].id,'p');
  const project={sections:[{blocks:[{id:'practice',type:'question',content:{id:'q',answer:{short:blue,worked:blue}},layout:{width:99}},{id:'teaching',type:'question',sourceAtom:{kind:'review'},content:{id:'t',answer:{short:blue,worked:blue}}}]}]};
  const {next,records}=migrateShortAnswerColours(project);assert.equal(records.length,1);assert.deepEqual(next.sections[0].blocks[1],project.sections[0].blocks[1]);assert.equal(next.sections[0].blocks[0].content.answer.worked,blue);assert.deepEqual(next.sections[0].blocks[0].layout,{width:99});assert.equal(migrateShortAnswerColours(next).records.length,0);
  assert.equal(updateProjectContent(project,'q','/answer/short',blue).sections[0].blocks[0].content.answer.short,normaliseShortAnswer(standardBookletContent(blue)));
  assert.equal(updateProjectContent(project,'t','/answer/short',blue).sections[0].blocks[1].content.answer.short,standardBookletContent(blue));
});
