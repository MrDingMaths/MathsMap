// Read-only browser verification of the staged or published import.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {makeBankManifest} from '../src/lib/practice-question-model.js';
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1];};
const work=arg('--stage'),projectId=arg('--project','volume-v1'),base=arg('--base','http://127.0.0.1:5297');
const bankRoot=work?path.join(work,'bank'):'booklets/question-bank';
const receipt=JSON.parse(await fs.readFile(work?path.join(work,'receipt.json'):'booklets/provenance/'+projectId+'/bank-import.json','utf8'));
const records=await Promise.all(receipt.questions.map(q=>fs.readFile(path.join(bankRoot,q.bankId+'.json'),'utf8').then(JSON.parse)));
const byId=new Map(records.map(q=>[q.id,q]));
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[],report=[];
page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
  const req=route.request(),url=new URL(req.url());assert.equal(req.method(),'GET','Verification must never write');
  if(url.pathname==='/__booklet/bank/manifest')return route.fulfill({json:makeBankManifest(records)});
  if(url.pathname.startsWith('/__booklet/bank/questions/'))return route.fulfill({json:byId.get(decodeURIComponent(url.pathname.split('/').at(-1)))});
  return route.continue();
});
try{
  await page.goto(base+'/#/booklet?stage=builder',{waitUntil:'networkidle'});
  const captureStyle=await page.addStyleTag({content:'header,nav,.navbar,.nav,.worksheet-controls {visibility:hidden!important}'});await page.locator('.question-card').first().waitFor();assert.equal(await page.locator('.question-card').count(),records.length);
  for(const sourceId of arg('--ids','p7-q4,p7-q5,p16-q1,p16-q2,p20-q1').split(',')){
    const entry=receipt.questions.find(q=>q.sourceBlockId===sourceId);
    await page.getByLabel('Search question text or question ID',{exact:true}).fill(entry.bankId);
    await page.locator('.apply-filters-btn').click();assert.equal(await page.locator('.question-card').count(),1);
    await page.locator('.question-card__summary').click();await page.locator('.question-card__body').waitFor();
    await page.waitForFunction(()=>[...document.querySelectorAll('.question-card__body .tikz-wrap')].every(el=>el.querySelector('svg.tikz-svg')),{},{timeout:180000});
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
    assert.equal(await page.locator('.question-card .katex-error').count(),0,sourceId+' maths error');
    assert.equal(await page.locator('.question-card').getByText('Content reference needs review:',{exact:false}).count(),0);
    const broken=await page.locator('.question-card img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[]);
    const record=byId.get(entry.bankId),saved=record.presentation.layoutOverrides.blockLayouts[record.presentation.ownerId]?.arrangement;
    if(saved){const groups=[];const visit=n=>{if(n.type==='group'){groups.push(n);n.children.forEach(visit);}};visit(saved.root);
      for(const group of groups){const el=page.locator('[data-arrangement-id="'+group.id+'"]').first();await el.waitFor();assert.equal(await el.evaluate(e=>e.classList.contains('arr-row')),group.direction==='row',sourceId+' '+group.id);}}
    assert.ok((await page.locator('.question-card__body .tikz-wrap').evaluateAll(els=>els.map(e=>getComputedStyle(e).overflow))).every(x=>x==='visible'),'Final-size labels must not be clipped by diagram containers');
    const clipping=await page.locator('.question-card__body').evaluate(async root=>{const {inspectDiagramLabelLayout}=await import('/src/lib/diagram-typography.js');return [...root.querySelectorAll('svg.tikz-svg')].flatMap(svg=>inspectDiagramLabelLayout(svg).filter(i=>i.kind==='diagram-label-clipping'));});assert.deepEqual(clipping,[],sourceId+' label bounds');
    report.push({sourceId,bankId:entry.bankId,questionAndSolutionRendered:true});
  }
  const worksheetIds=arg('--worksheet-ids','').split(',').filter(Boolean);
  if(worksheetIds.length){
    await captureStyle.evaluate(el=>el.remove());
    // Real bank records exercise native diagrams in all three worksheet sections.
    for(const sourceId of worksheetIds){
      const entry=receipt.questions.find(q=>q.sourceBlockId===sourceId);assert.ok(entry,sourceId);
      await page.getByLabel('Search question text or question ID',{exact:true}).fill(entry.bankId);
      await page.locator('.apply-filters-btn').click();
      await page.locator('.question-card__summary').click();
      await page.getByLabel('Select '+entry.bankId,{exact:true}).check();
    }
    await page.getByRole('button',{name:'Clear filters',exact:true}).click();
    await page.locator('.worksheet-controls').getByRole('button',{name:'Answers',exact:true}).click();
    await page.locator('.worksheet-controls').getByRole('button',{name:'Solutions',exact:true}).click();
    await page.locator('.worksheet-controls').getByRole('button',{name:'Preview',exact:true}).click();
    await page.locator('#worksheet-title-input').fill('Diagram theme regression');
    const measure=async()=>{
      await page.waitForTimeout(150);
      const hosts=page.locator('.a4-preview .tikz-wrap');assert.ok(await hosts.count());
      for(let i=0;i<await hosts.count();i++){await hosts.nth(i).scrollIntoViewIfNeeded();await hosts.nth(i).locator('svg.tikz-svg').waitFor({state:'attached',timeout:180000});}
      return page.locator('.a4-preview svg.tikz-svg').evaluateAll(svgs=>svgs.map(svg=>({section:svg.closest('.answer-page')?.querySelector('h2')?.textContent??'Questions',filter:getComputedStyle(svg).filter,ink:[...svg.querySelectorAll('path,line,circle,ellipse,rect,polygon,polyline')].filter(n=>!n.closest('defs')).map(n=>({fill:getComputedStyle(n).fill,stroke:getComputedStyle(n).stroke}))})));
    };
    let baseline;
    for(const theme of ['light','dark']){
      await page.evaluate(theme=>document.documentElement.setAttribute('data-theme',theme),theme);
      const rendered=await measure();assert.ok(rendered.every(svg=>svg.filter==='none'),theme+' white worksheet must not invert native diagrams');
      assert.deepEqual([...new Set(rendered.map(svg=>svg.section))].sort(),['Questions','Short answers','Worked solutions']);
      assert.ok(rendered.some(svg=>svg.ink.some(n=>n.stroke==='rgb(0, 0, 0)'||n.fill==='rgb(0, 0, 0)')),'Native black ink present');
      if(baseline)assert.deepEqual(rendered,baseline,'Theme changes preserve diagram ink and semantic fills');else baseline=rendered;
    }
    await page.reload({waitUntil:'networkidle'});await page.locator('.question-card').first().waitFor();
    assert.match(await page.locator('.selection-summary').innerText(),new RegExp('^'+worksheetIds.length+' selected'));
    for(const name of ['Answers','Solutions'])assert.equal(await page.locator('.worksheet-controls').getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');
    await page.locator('.worksheet-controls').getByRole('button',{name:'Preview',exact:true}).click();
    assert.equal(await page.locator('#worksheet-title-input').innerText(),'Diagram theme regression');
    await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
    assert.deepEqual(await measure(),baseline,'Saved worksheet retains complete native diagram ink after reopening');
    report.push({worksheetIds,themes:['light','dark'],questionShortWorkedDiagrams:true,saveReopen:true});
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({questionsAvailable:records.length,representativePreviews:report.length,errors}));
}finally{await browser.close();}
