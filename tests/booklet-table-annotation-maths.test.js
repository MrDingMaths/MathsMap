import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {tableAnnotationLabelHtml} from '../public/libs/maths-editor/table-annotations.mjs';
import {renderMath} from '../src/lib/render-math.js';

test('annotation labels distinguish native maths from literal text and escaped currency',()=>{
  assert.equal(tableAnnotationLabelHtml('+7',renderMath),null);
  assert.equal(tableAnnotationLabelHtml('Cost \\$7',renderMath),null);
  const html=tableAnnotationLabelHtml('<operation> $\\div\\frac{1}{2}$',latex=>renderMath('$'+latex+'$'));
  assert.ok(html.startsWith('&lt;operation&gt; '));
  assert.ok(html.includes('class="katex"'));
  assert.ok(!html.includes('katex-error'));
});

test('native arrow maths labels remain centred and 10pt through zoom, redraw and print',async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const page=await browser.newPage();
    const source=fs.readFileSync('public/libs/maths-editor/table-annotations.mjs','utf8');
    await page.route('http://annotation.test/module.mjs',r=>r.fulfill({contentType:'text/javascript',body:source}));
    const label='$\\color{#268cff}{\\div}\\fbox{\\rule{0pt}{5mm}\\hspace{8mm}}$';
    const html=tableAnnotationLabelHtml(label,latex=>renderMath('$'+latex+'$'));
    await page.setContent('<style>table{width:200px;border-collapse:collapse}td{height:40px;width:100px} .wrap{position:relative;width:200px;margin:80px}</style><div class="wrap"><table data-id="table"><tr><td data-id="a">8</td><td data-id="b">4</td></tr></table></div>');
    await page.addStyleTag({content:fs.readFileSync('node_modules/katex/dist/katex.min.css','utf8')});
    const result=await page.evaluate(async({label,html})=>{
      const {mountTableAnnotations}=await import('http://annotation.test/module.mjs');
      const root=document.querySelector('.wrap'),table=root.querySelector('table');
      table.dataset.annotations=JSON.stringify([{id:'operation',type:'arrow',cellId:'a',toCellId:'b',side:'top',label,colour:'#268cff'}]);
      const mounted=mountTableAnnotations(root,{math:()=>html});
      const settle=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      await settle();
      const read=()=>{const label=root.querySelector('[data-annotation-maths-label]'),box=label.getBoundingClientRect(),formula=label.querySelector('.katex');return {width:box.width,height:box.height,font:parseFloat(getComputedStyle(formula).fontSize),text:label.querySelector('.katex-html').textContent,centre:box.left+box.width/2,tableCentre:table.getBoundingClientRect().left+table.getBoundingClientRect().width/2};};
      const initial=read();root.style.zoom='1.5';mounted.update();await settle();const zoomed=read();
      window.dispatchEvent(new Event('beforeprint'));const printed=read();window.dispatchEvent(new Event('afterprint'));await settle();const after=read();
      const exact=JSON.parse(table.dataset.annotations)[0].label===label;
      mounted.destroy();return {initial,zoomed,printed,after,exact};
    },{label,html});
    assert.equal(result.exact,true);
    for(const row of [result.initial,result.zoomed,result.printed,result.after]){
      assert.ok(row.width>20&&row.height>10);
      assert.ok(Math.abs(row.font-40/3)<0.15);
      assert.ok(Math.abs(row.centre-row.tableCentre)<1);
      assert.ok(!row.text.includes('\\color')&&!row.text.includes('$'));
    }
    assert.ok(Math.abs(result.zoomed.width/result.initial.width-1.5)<0.02);
    await page.emulateMedia({media:'print'});
    assert.ok((await page.pdf({format:'A4'})).length>1000);
  }finally{await browser.close();}
});
