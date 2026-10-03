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

test('opt-in fraction anchors follow complete rendered stacks, retaining explicit box precedence',async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const page=await browser.newPage();
    await page.route('http://annotation.test/module.mjs',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('public/libs/maths-editor/table-annotations.mjs','utf8')}));
    await page.setContent('<style>td{height:102px;width:120px;text-align:center}.wrap{position:relative;margin:60px}</style><div class="wrap"><table data-id="t"><tr><td data-id="a">'+renderMath('$\\frac{2}{3}$')+'</td><td data-id="b">'+renderMath('$\\frac{4}{6}$')+'</td></tr></table></div>');
    await page.addStyleTag({content:fs.readFileSync('node_modules/katex/dist/katex.min.css','utf8')});
    const result=await page.evaluate(async()=>{
      const {tableMathBoxElement,mountTableAnnotations}=await import('http://annotation.test/module.mjs');
      const root=document.querySelector('.wrap'),table=root.querySelector('table'),a=table.querySelector('[data-id=a]'),b=table.querySelector('[data-id=b]');
      const annotation={id:'fraction',type:'arrow',cellId:'a',toCellId:'b',side:'top',startAnchor:'math-box',endAnchor:'math-box',distanceMm:0,curveMm:4,colour:'#268cff'};
      table.dataset.annotations=JSON.stringify([annotation]);
      const mounted=mountTableAnnotations(root),settle=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      await settle();
      const read=()=>{const fraction=tableMathBoxElement(a),rect=fraction.getBoundingClientRect(),cell=a.getBoundingClientRect();return {height:rect.height,cellHeight:cell.height,path:root.querySelector('[data-annotation-id=fraction] path').getAttribute('d'),diagnostic:root.querySelector('[data-annotation-diagnostics]')?.textContent??'',anchorTop:Math.min(rect.top,...[...fraction.querySelectorAll('*')].filter(e=>!e.children.length&&e.textContent.trim()).map(e=>e.getBoundingClientRect().top)),rootTop:root.getBoundingClientRect().top,scale:parseFloat(root.style.zoom)||1};};
      const initial=read();root.style.zoom='1.5';mounted.update();await settle();const zoom=read();
      window.dispatchEvent(new Event('beforeprint'));const print=read();window.dispatchEvent(new Event('afterprint'));await settle();
      const saved=JSON.stringify(JSON.parse(table.dataset.annotations));mounted.destroy();table.dataset.annotations=saved;const reopened=mountTableAnnotations(root);await settle();const reopen=read();
      const box=document.createElement('span');box.className='fbox';box.textContent='box';a.querySelector('.katex-html').append(box);const boxFirst=tableMathBoxElement(a)===box;
      box.remove();const editor=document.createElement('math-field');editor.attachShadow({mode:'open'}).innerHTML='<style>.ML__mfrac{display:inline-block;width:20px;height:34px}</style><span class="ML__mfrac">fraction</span>';const cell=document.createElement('td');cell.append(editor);table.rows[0].append(cell);const shadow=tableMathBoxElement(cell)===editor.shadowRoot.querySelector('.ML__mfrac');
      reopened.destroy();return {initial,zoom,print,reopen,boxFirst,shadow,persisted:JSON.parse(saved)[0]};
    });
    for(const row of [result.initial,result.zoom,result.print,result.reopen]){assert.ok(row.height>15&&row.height<row.cellHeight/2);assert.ok(Math.abs(Number(row.path.split(' ')[2])-(row.anchorTop-row.rootTop)/row.scale)<0.03);assert.equal(row.diagnostic,'');assert.ok(row.path.startsWith('M'));}
    assert.ok(Math.abs(result.zoom.height/result.initial.height-1.5)<0.02);
    const numbers=s=>s.match(/[-+]?(?:\d*\.)?\d+/g).map(Number); numbers(result.initial.path).forEach((n,i)=>assert.ok(Math.abs(n-numbers(result.zoom.path)[i])<0.75));assert.equal(result.zoom.path,result.reopen.path);
    assert.equal(result.boxFirst,true);assert.equal(result.shadow,true);assert.equal(result.persisted.startAnchor,'math-box');
    await page.emulateMedia({media:'print'});assert.ok((await page.pdf({format:'A4'})).length>1000);
  }finally{await browser.close();}
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




