// Run against Vite: node tests/booklet-fraction-line-spacing.browser.mjs --base http://127.0.0.1:5371
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const baseIndex=process.argv.indexOf('--base');
const base=baseIndex>=0?process.argv[baseIndex+1]:'http://127.0.0.1:5173';
assert.ok(base,'--base requires a URL');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  const page=await browser.newPage();await page.goto(base,{waitUntil:'domcontentloaded'});
  const result=await page.evaluate(async()=>{
    const {mount,unmount}=await import('/node_modules/.vite/deps/svelte.js');
    const {default:InlineContent}=await import('/src/components/InlineContent.svelte');
    const texts={adjacent:'$$M<\\frac{M+1}{2}<1.$$\nThus $\\frac{M+1}{2}$ is larger.',plain:'First $x=1$.\nThus $x+1=2$.',mixed:'$\\frac12$\nThus $x=1$.',aligned:'$$\\begin{align*}x&=\\frac12\\\\y&=\\frac34\\end{align*}$$',blank:'$\\frac12$\n\nThus $\\frac34$ is larger.'};
    const hosts=[],instances=[];
    for(const [name,text]of Object.entries(texts)){const host=document.createElement('div');host.dataset.case=name;host.style.cssText='font-size:9.5pt;line-height:1.22;width:170mm;background:white;color:black';document.body.append(host);hosts.push(host);instances.push(mount(InlineContent,{target:host,props:{text}}));}
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await document.fonts.ready;
    const measure=()=>Object.fromEntries(hosts.map(h=>[h.dataset.case,{lines:[...h.querySelectorAll('.text-line')].map(e=>({top:e.getBoundingClientRect().top,height:e.getBoundingClientRect().height,margin:parseFloat(getComputedStyle(e).marginTop)})),height:h.getBoundingClientRect().height,errors:h.querySelectorAll('.katex-error').length}]));
    const actual=measure();const override=document.createElement('style');override.textContent='[data-case] .text-line {margin-top:0!important}';document.head.append(override);const zero=measure();override.remove();
    // Recreate the component from a serialized content payload: no content rewrite.
    const serialized=JSON.stringify(texts.adjacent);await unmount(instances[0]);instances[0]=mount(InlineContent,{target:hosts[0],props:{text:JSON.parse(serialized)}});await new Promise(r=>requestAnimationFrame(r));const reopened=measure();
    return {actual,zero,reopened};
  });
  for(const x of Object.values(result.actual))assert.equal(x.errors,0);
  const delta=result.actual.adjacent.height-result.zero.adjacent.height;assert.ok(Math.abs(delta-8*96/72)<.1,JSON.stringify(result));
  assert.equal(result.actual.adjacent.lines.length,2);assert.ok(Math.abs(result.actual.adjacent.lines[1].margin-8*96/72)<.1);
  for(const name of ['plain','mixed','aligned','blank'])assert.equal(result.actual[name].height,result.zero[name].height,name+' must retain existing spacing');
  assert.equal(result.actual.aligned.lines.length,1,'Aligned equation must not get a second row-spacing mechanism');
  assert.equal(result.reopened.adjacent.height,result.actual.adjacent.height,'Serialized content remount preserves spacing');
  console.log(JSON.stringify({passed:true,addedClearanceCssPx:delta,checks:['adjacent native fractions','nonfraction control','mixed control','aligned no double spacing','explicit blank gap preserved','serialized remount'],measurements:result.actual}));
}finally{await browser.close();}
