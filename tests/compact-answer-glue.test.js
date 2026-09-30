import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {renderMath} from '../src/lib/render-math.js';
import {compactAnswerProseGlue} from '../src/lib/compact-answer-glue.js';

test('compact prose glue preserves editable mathematical source and excludes math/currency',()=>{
  for(const original of ['$x=2$.','$x=-2$, $y=3$.','The $x$-axis and y-axis.','Amount \\$36; x-axis.',String.raw`$x-axis=0$`]){
    const result=compactAnswerProseGlue(original);
    assert.equal(result.replaceAll('\u2060','').replace(/\\text\{([,.!?;:)\]]|-axis)\}\$/g,(_,tail)=>'$'+tail),original);
    assert.equal(compactAnswerProseGlue(result),result);
  }
  assert.equal(compactAnswerProseGlue('$x-axis=0$'),'$x-axis=0$');
  const structured={paragraphs:[]};assert.equal(compactAnswerProseGlue(structured),structured);
});

test('only complete supported plain-pipe algebraic atoms gain display grouping',()=>{
  assert.equal(compactAnswerProseGlue('$|2y-7|\\ge 15$.'),'${|2y-7|}\\ge 15\\text{.}$');
  for(const text of [String.raw`$\left|\dfrac{2y-7}{3}\right|\ge5$`,String.raw`$\|x\|$`,'$|x>0|$','$|x,y|$',String.raw`$|\operatorname{f}(x)|$`,'$||x||$','$|{x|$'])assert.equal(compactAnswerProseGlue(text),text);
  const supported='$\\mathord{|2y-7|}\\ge15$';assert.equal(compactAnswerProseGlue(supported),supported);
});

test('terminal punctuation and complete axis names stay attached at narrow actual KaTeX line widths',async()=>{
  const css=fs.readFileSync('node_modules/katex/dist/katex.min.css','utf8').replace(/url\((fonts\/[^)]+)\)/g,(_,name)=>'url(data:font/woff2;base64,'+fs.readFileSync('node_modules/katex/dist/'+name).toString('base64')+')');
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    const page=await browser.newPage();
    const samples=['Answer $x=12345$.','The $x$-axis','The y-axis'];
    await page.setContent('<style>'+css+'body{font:9pt serif}.sample{margin:0;line-height:1.8}</style>'+samples.map((s,i)=>'<p class="sample" data-i="'+i+'">'+renderMath(compactAnswerProseGlue(s))+'</p>').join(''));
    await page.evaluate(()=>document.fonts.ready);
    const result=await page.evaluate(()=>{
      const at=(node,start,end)=>{const r=document.createRange();r.setStart(node,start);r.setEnd(node,end);return r.getBoundingClientRect();};
      const rows=[];
      for(let width=55;width<=145;width+=3)for(const sample of document.querySelectorAll('.sample')){
        sample.style.width=width+'px';
        const walker=document.createTreeWalker(sample,NodeFilter.SHOW_TEXT);let node;
        while(node=walker.nextNode()){
          if(node.parentElement.closest('math,annotation,.katex-mathml'))continue;
          const text=node.textContent;
          if(text==='.'&&node.parentElement.closest('.katex-html')){
            const punctuation=at(node,text.indexOf('.') ,text.indexOf('.')+1),math=sample.querySelector('.katex-html .base:last-child').getBoundingClientRect();
            if(Math.abs(punctuation.top-math.top)>5)throw Error('Terminal punctuation orphaned '+JSON.stringify({width,punctuation:punctuation.toJSON(),math:math.toJSON(),html:sample.innerHTML}));
          }
          if(text.includes('axis')){
            const index=text.indexOf('-'),hyphen=at(node,index,index+1),word=at(node,text.indexOf('axis'),text.indexOf('axis')+4);
            if(Math.abs(hyphen.top-word.top)>.1)throw Error('Axis name split '+width);
            const letter=sample.querySelector('.katex-html');
            if(letter&&Math.abs(hyphen.top-letter.getBoundingClientRect().top)>5)throw Error('Math axis letter detached '+width);
          }
        }
        rows.push({width,sample:sample.dataset.i});
      }
      return rows;
    });
    assert.equal(result.length,93);
  }finally{await browser.close();}
});
