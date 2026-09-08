// Browser regression with in-memory project writes; user projects and banks are untouched.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { createEditableProject } from '../../src/lib/editable-booklet-model.js';
import { studioProject } from '../../src/lib/booklet-review-model.js';
import { normaliseQuestion } from '../../src/lib/practice-question-model.js';

const out = '.booklet-work/human-workflow-check';
fs.mkdirSync(out, { recursive: true });
const question = {...normaliseQuestion({id:'question',classification:{primarySkillId:'construct-table-of-values',difficulty:'Foundation',difficultyReason:'Single substitution'},content:{id:'question-root',type:'question',prompt:'Calculate $4+5$.',answer:{short:'$9$',worked:'Add four and five to obtain $9$.'}}}),type:'question'};
let record = studioProject(createEditableProject({id:'human-workflow',title:'Human workflow',sections:[{id:'section',title:'Addition',blocks:[{id:'theory',type:'rich-text',content:'Add the two numbers.\n\nKeep their values unchanged.'},question]}]}));
record.revision=1;
record.studio.proposals=[{id:'historical',operations:[{status:'pending',after:'DO NOT APPLY'}]}];
record.studio.approvals={theory:{content:{accepted:false}}};
const historical=structuredClone(record.studio);
const sourcePage={id:'page-2',pageNumber:2,section:{title:'Addition'},blocks:structuredClone(record.sections[0].blocks)};
const sourceRun={runId:'source-fixture',selectedPages:[2],revision:0,review:{flags:[],history:[],contentOverrides:{},layoutOverrides:{}},previewTranscription:{pages:[sourcePage]},baseHash:'fixture',editConflicts:[]};
const errors=[],writes=[];
let browser;
try {browser=await chromium.launch({headless:true});} catch {browser=await chromium.launch({headless:true,channel:'chrome'});}
try {
  const page=await browser.newPage({viewport:{width:1600,height:1100}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/__booklet/**',async route=>{
    const request=route.request(),url=new URL(request.url()),method=request.method();
    const respond=json=>route.fulfill({json});
    if(url.pathname==='/__booklet/bank/manifest')return respond({format:'mathsmap-practice-bank-v3',version:3,questions:[]});
    if(url.pathname==='/__booklet/full-imports')return respond([{runId:sourceRun.runId,selectedPages:[2]}]);
    if(url.pathname==='/__booklet/full-imports/source-fixture')return respond(sourceRun);
    if(url.pathname.includes('/files/evidence/pages/'))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123"><rect width="794" height="1123" fill="white"/><text x="50" y="80" font-size="28">Source evidence: addition</text></svg>'});
    if(url.pathname==='/__booklet/projects'&&method==='GET')return respond([{id:record.id,title:record.title,revision:record.revision}]);
    if(url.pathname==='/__booklet/projects/human-workflow'){
      if(method==='PUT'){
        const body=request.postDataJSON();
        assert.equal(body.expectedRevision,record.revision);
        writes.push(body.project);record={...body.project,revision:record.revision+1};
      }
      return respond(record);
    }
    return route.fulfill({status:404,json:{error:'Unexpected test request: '+method+' '+url.pathname}});
  });
  const base=process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173';
  await page.goto(base+'/#/booklet?stage=full-import&run=source-fixture',{waitUntil:'networkidle'});
  await page.locator('.reconstruction .preview-page').waitFor();
  assert.equal(await page.getByRole('button',{name:'Create editable booklet',exact:true}).isEnabled(),true);
  const sourceText=await page.locator('.full-import-shell').innerText();
  assert.doesNotMatch(sourceText,/Accept page|Approve|Fidelity audit|Run repairs|Resumable lanes/);
  for(const mode of ['student','short','worked']){
    await page.getByLabel('Review content').selectOption(mode);
    const previewText=await page.locator('.reconstruction .preview-page').allTextContents();
    assert.match(previewText.join(' '),mode==='student'?/Calculate/:mode==='short'?/9/:/Add four and five/);
    await page.locator('.reconstruction').screenshot({path:out+'/source-'+mode+'.png'});
  }
  await page.goto(base+'/#/booklet?stage=projects&project=human-workflow',{waitUntil:'networkidle'});
  await page.locator('.project-canvas .preview-page').waitFor();
  await page.getByRole('button',{name:/^Review/}).click();
  await page.getByLabel('Teaching atom',{exact:true}).fill('Add two numbers');
  await page.getByLabel('Public skill IDs',{exact:true}).fill('construct-table-of-values');
  await page.getByLabel('Rationale',{exact:true}).fill('Manual mapping');
  await page.getByRole('button',{name:'Save mapping',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
  assert.equal(record.studio.atoms.theory.title,'Add two numbers');
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
  assert.equal(record.studio.atoms.theory,undefined);
  await page.getByRole('button',{name:'Redo',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
  await page.getByRole('button',{name:'Split theory',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
  assert.equal(record.sections[0].blocks.length,3);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
  assert.equal(record.sections[0].blocks.length,2);
  await page.reload({waitUntil:'networkidle'});
  assert.equal(record.studio.atoms.theory.title,'Add two numbers');
  assert.deepEqual(record.studio.proposals,historical.proposals);
  assert.deepEqual(record.studio.approvals,historical.approvals);
  assert.doesNotMatch(await page.locator('.project-canvas').innerText(),/DO NOT APPLY/);
  await page.getByRole('button',{name:'PDF',exact:true}).click();
  const exports=[];
  for(const [mode,value] of [['student','none'],['short','short'],['worked','worked']]){
    await page.getByLabel('Practice answers',{exact:true}).selectOption(value);
    await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
    await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
    await page.emulateMedia({media:'print'});
    await page.evaluate(()=>document.fonts.ready);
    const text=await page.locator('.project-print').innerText();
    if(mode==='student')assert.match(text,/Calculate/);
    if(mode==='short')assert.match(text,/9/);
    if(mode==='student')assert.doesNotMatch(text,/Add four and five|obtain/);
    if(mode==='worked')assert.match(text,/Add four and five/);
    assert.ok(await page.locator('.project-print .print-page').count()>0);
    await page.pdf({path:out+'/'+mode+'.pdf',format:'A4',printBackground:true});
    exports.push({mode,pages:await page.locator('.project-print .print-page').count()});
    await page.emulateMedia({media:'screen'});
  }
  await page.screenshot({path:out+'/workspace.png'});
  assert.deepEqual(errors,[]);
  const report={passed:true,projectWritesIntercepted:writes.length,historicalMetadataPreserved:true,exports,errors};
  fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} finally {await browser.close();}
