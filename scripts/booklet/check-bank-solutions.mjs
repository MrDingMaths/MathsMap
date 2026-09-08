// Read-only browser regression: inline solutions must not change worksheet output.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {normaliseQuestion,makeBankManifest} from '../../src/lib/practice-question-model.js';

const diagram='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="80"><path d="M10 70L160 10" stroke="blue"/><text x="70" y="65">Solution graph</text></svg>').toString('base64');
const questions=[1,2].map(n=>normaliseQuestion({id:'bank-solution-check-'+n,status:'approved',classification:{primarySkillId:'construct-table-of-values',reasoningScore:10+n},content:{id:'solution-root-'+n,type:'question',prompt:`Find the value for example ${n}: $y=2x+1$ when $x=${n}$.`,answer:{short:String(2*n+1),worked:`Worked example ${n}: $y=2(${n})+1=${2*n+1}$.`,solutionDiagrams:n===1?[{id:'solution-graph',format:'image',role:'solution',src:diagram,widthMm:50,alt:'Solution graph'}]:[]}}}));
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
questions[0].content.answer.worked += String.raw` Check: $3=2x+1 \implies 2x=2 \implies x=1$.`;
const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[],writes=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',route=>{
  const request=route.request(),url=new URL(request.url());
  if(request.method()!=='GET'){writes.push(request.url());return route.abort();}
  if(url.pathname.endsWith('/manifest'))return route.fulfill({json:makeBankManifest(questions)});
  const q=questions.find(q=>url.pathname.endsWith('/'+q.id));
  return q?route.fulfill({json:q}):route.continue();
});
try{
  await page.goto('http://127.0.0.1:5173/#/booklet?stage=builder',{waitUntil:'networkidle'});
  const cards=page.locator('.question-card__collapsible');await cards.first().waitFor();
  await cards.nth(0).locator(':scope > summary').click();
  await cards.nth(1).locator(':scope > summary').click();
  assert.equal(await page.locator('.worked-content').count(),0);
  const first=cards.nth(0).locator('.question-card__solution');
  await first.locator('summary').focus();await page.keyboard.press('Enter');
  await first.getByText('Worked example 1:',{exact:false}).waitFor();
  await first.getByAltText('Solution graph').waitFor();
  assert.equal(await first.locator('.katex').count()>0,true);
  assert.equal(await first.locator('.katex-error').count(),0);
  assert.ok(!/[⇒⟹]/.test(await first.innerText()),'Routine calculation arrows remain');
  assert.equal(await first.locator('.katex-display').count(),1);
  assert.equal(await cards.nth(1).locator('.worked-content').count(),0);
  assert.equal(await page.locator('.question-row__checkbox input:checked').count(),0);
  assert.equal(await page.getByRole('button',{name:'Solutions',exact:true}).getAttribute('aria-pressed'),'false');
  await cards.nth(0).locator(':scope > summary').click();
  await cards.nth(0).locator(':scope > summary').click();
  await first.getByText('Worked example 1:',{exact:false}).waitFor();
  await first.locator('summary').click();
  await page.waitForFunction(()=>document.querySelectorAll('.worked-content').length===0);
  await first.locator('summary').click();
  await page.setViewportSize({width:390,height:844});
  await first.scrollIntoViewIfNeeded();
  assert.equal(await cards.nth(0).locator('.question-card__body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile page overflow');
  fs.mkdirSync('output/bank-solutions',{recursive:true});
  await page.screenshot({path:'output/bank-solutions/mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:900});
  await cards.nth(0).screenshot({path:'output/bank-solutions/card.png'});
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  console.log('PASS: keyboard reveal/hide, rendered maths and solution graph, per-card isolation, collapse/reopen, mobile width, zero writes or worksheet changes.');
}finally{await browser.close();}
