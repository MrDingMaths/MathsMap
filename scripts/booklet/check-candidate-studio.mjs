// Focused Studio integration using an unpublished candidate and in-memory saves.
// No request that mutates a real project or question bank may leave this context.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const [candidateFile, outputDirectory, mode] = process.argv.slice(2);
if (!candidateFile || !outputDirectory) throw Error('Usage: node scripts/booklet/check-candidate-studio.mjs CANDIDATE.json OUTPUT_DIRECTORY');
const out=path.resolve(outputDirectory);fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(candidateFile),candidate=JSON.parse(source),sourceHash=crypto.createHash('sha256').update(source).digest('hex');
let record=structuredClone(candidate);record.revision=1;
// Retain original Range section content and arrangements; only bound the UI fixture.
// --full-open is the separate whole-candidate loading diagnostic.
if(mode!=='--full-open'){
 record.sections=record.sections.filter(s=>s.blocks.some(b=>['p6-guided-header','p7-q1'].includes(b.id)));
 const topics=new Set(record.sections.map(s=>s.topicId));record.topics=record.topics.filter(t=>topics.has(t.id));
 record.settings={...record.settings,generatedCover:false,flowEdition:'student'};
}
const blocks=()=>record.sections.flatMap(s=>s.blocks),block=id=>blocks().find(b=>b.id===id);
// Approved is a mock-bank fixture state so the worksheet picker will expose it.
// It grants no approval or publication status to the candidate or real bank.
const bank=['p7-q1','p7-q2'].map(id=>{const b=block(id);assert.ok(b,`Candidate is missing ${id}`);return {id:'studio-check-'+id,status:'approved',title:id==='p7-q1'?'Range of four datasets':'Range of nine datasets',classification:{...b.classification,primarySkillId:b.classification?.primarySkillId??'calculate-range',difficulty:'Foundation',reasoningScore:15},content:structuredClone(b.content),source:{file:'Data Analysis candidate',pageNumber:7,questionNumber:id==='p7-q1'?1:2}};});
const writes=[],blockedMutations=[],errors=[],checks=[],requests=[],conflicts=[];
let phase='initialise';const startedAt=new Date().toISOString();
const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1600,height:1000},colorScheme:'light'});
await context.addInitScript(()=>{localStorage.setItem('mathsmap.theme.v1','light');window.__studioPrintCalls=0;window.__studioPrintSnapshots=[];window.print=()=>{window.__studioPrintCalls++;window.__studioPrintSnapshots.push({bookletPages:document.querySelectorAll('.project-print .print-page').length,worksheetQuestions:document.querySelectorAll('.worksheet-preview-outer .preview-question').length,worksheetAnswers:[...document.querySelectorAll('.worksheet-preview-outer .answer-page h2')].map(e=>e.textContent),bookletText:document.querySelector('.project-print')?.textContent?.slice(0,1200)});};});
await context.route('**/*',async route=>{
 const req=route.request(),url=new URL(req.url()),method=req.method();
 if(url.pathname.startsWith('/__booklet/'))requests.push({method,path:url.pathname});
 if(url.pathname==='/__booklet/projects'&&method==='GET')return route.fulfill({json:[{id:record.id,title:record.title,sections:record.sections.length,revision:record.revision}]});
 if(url.pathname==='/__booklet/projects/'+record.id+'/open'&&method==='GET')return route.fulfill({json:{project:record,bankSync:{items:[]}}});
 if(url.pathname==='/__booklet/projects/'+record.id){
  if(method==='PUT'){
   const body=req.postDataJSON();
   if(body.expectedRevision!==record.revision){conflicts.push({expectedRevision:body.expectedRevision,actualRevision:record.revision});return route.fulfill({status:409,json:{error:'Another session saved this project.'}});}
   const prior=record.revision;record={...body.project,revision:prior+1};writes.push({expectedRevision:body.expectedRevision,revision:record.revision,phase});
  }else if(method!=='GET'){blockedMutations.push({method,path:url.pathname});return route.abort();}
  return route.fulfill({json:record});
 }
 if(url.pathname==='/__booklet/bank/manifest'&&method==='GET')return route.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:bank.map(q=>({id:q.id}))}});
 if(url.pathname.startsWith('/__booklet/bank/questions/')&&method==='GET')return route.fulfill({json:bank.find(q=>q.id===decodeURIComponent(url.pathname.split('/').at(-1)))??{}});
 if(url.pathname.includes('/bank-sync')&&method==='GET')return route.fulfill({json:{items:[]}});
 if(!['GET','HEAD','OPTIONS'].includes(method)){blockedMutations.push({method,path:url.pathname});return route.abort();}
 return route.continue();
});
const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
let activePage=page;
const base=process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173';
const ready=async()=>{await page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:180000});};
const settled=async()=>{await ready();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved',null,{timeout:30000});};
const screenshot=async name=>page.screenshot({path:path.join(out,name+'.png')});
let printSnapshots=[];
const selectBlock=async(id,search='range')=>{
 const toggle=page.getByRole('button',{name:'Toggle page navigation',exact:true});
 if(await toggle.getAttribute('aria-expanded')!=='true')await toggle.click();
 await page.getByRole('textbox',{name:'Search outline',exact:true}).fill(search);
 await page.locator(`.flow-outline [data-block-id="${id}"] .content-select`).click();
};
const check=message=>{checks.push(message);console.log('PASS '+message);};
const field=(root,pointer)=>page.locator(`.flow-paper [data-edit-root="${root}"][data-edit-path="${pointer}"]`);
const openField=async(root,pointer,table=false)=>{
 let target=field(root,pointer).locator('.clickable');if(table)target=target.filter({has:page.locator('table')});
 await target.first().click();const editor=field(root,pointer).locator('maths-editor');await editor.first().waitFor();return editor.first();
};
const saveChange=async(action)=>{
 const saved=page.waitForResponse(r=>r.request().method()==='PUT'&&new URL(r.url()).pathname==='/__booklet/projects/'+record.id&&r.status()===200);
 await action();await page.keyboard.press('Control+s');await saved;await settled();
};
const edition=async value=>{await page.getByRole('combobox',{name:'Booklet edition',exact:true}).selectOption(value);await settled();};
try{
 phase='open candidate';console.log(phase);
 await page.goto(base+'/#/booklet?stage=projects&project='+record.id,{waitUntil:'domcontentloaded'});await settled();
 check((mode==='--full-open'?'full candidate':'unchanged candidate Range sections')+' opens with flexible pagination');
 if(mode==='--full-open'){await screenshot('whole-candidate-open');}
 else{
 phase='native prompt edit';console.log(phase);
 await selectBlock('p7-q1');
 let editor=await openField('p7-q1-root','/prompt');
 const prompt='Determine the range of each dataset. Check the maximum and minimum.';
 await saveChange(()=>editor.locator('.editor-surface').fill(prompt));
 assert.equal(block('p7-q1').content.prompt.format,'maths-editor-document-v1');
 assert.ok(JSON.stringify(block('p7-q1').content.prompt).includes(prompt));
 await screenshot('prompt-saved');check('native prompt typing saves as an editable document');

 phase='native table cell edit';console.log(phase);
 await selectBlock('p8-q6-block','loaves');
 editor=await openField('p8-q6','/prompt',true);
 const tableBefore=structuredClone(block('p8-q6-block').content.prompt.blocks.find(b=>b.id==='p8-q6-table'));
 await saveChange(()=>editor.locator('[data-id="p8-q6-table-r1-c1-text"]').fill('Weekday'));
 const tableAfter=block('p8-q6-block').content.prompt.blocks.find(b=>b.id==='p8-q6-table');
 assert.equal(tableAfter.type,'table');assert.equal(tableAfter.rows.length,2);assert.equal(tableAfter.rows[0].length,6);
 const rowData=row=>row.map(c=>({id:c.id,align:c.align,verticalAlign:c.verticalAlign,inlines:c.blocks.map(p=>p.inlines)}));
 assert.deepEqual(rowData(tableAfter.rows[1]),rowData(tableBefore.rows[1]));assert.deepEqual(tableAfter.widths,tableBefore.widths);assert.deepEqual(tableAfter.rowHeights,tableBefore.rowHeights);
 assert.ok(JSON.stringify(tableAfter.rows[0][0]).includes('Weekday'));
 await screenshot('table-saved');check('native table cell saves while other data, grid dimensions and column widths persist');

 phase='native short answer maths edit';console.log(phase);
 await edition('short');await selectBlock('p7-q1');
 editor=await openField('p7-q1a','/answer/short');
 const math=editor.locator('math-field').first();await math.click();await math.press('End');
 await saveChange(()=>math.pressSequentially('+0'));
 const shortAnswer=block('p7-q1').content.children[0].answer.short;
 assert.equal(shortAnswer.format,'maths-editor-document-v1');assert.match(JSON.stringify(shortAnswer),/4\+0/);
 await screenshot('short-maths-saved');check('keyboard edit to short-answer maths saves as native mathematics');

 phase='reopen saved candidate';console.log(phase);
 await page.reload({waitUntil:'domcontentloaded'});await settled();
 await selectBlock('p7-q1');assert.ok((await field('p7-q1-root','/prompt').innerText()).includes(prompt));
 await selectBlock('p8-q6-block','loaves');assert.ok((await field('p8-q6','/prompt').allTextContents()).join(' ').includes('Weekday'));
 await edition('short');await selectBlock('p7-q1');assert.ok((await field('p7-q1a','/answer/short').innerText()).includes('4'));
 editor=await openField('p7-q1a','/answer/short');assert.equal(await editor.locator('math-field').first().evaluate(e=>e.getValue('latex')),'4+0');
 check('save/reopen retains native prompt, table and math short answer');

 phase='teaching answer controls';console.log(phase);
 await edition('student');await page.getByRole('button',{name:'Export',exact:true}).click();
 const guided=page.getByRole('checkbox',{name:'Show guided practice answers',exact:true});
 const practice=page.getByRole('combobox',{name:'Practice answers',exact:true});
 const practiceBefore=await practice.inputValue(),writesBeforeControls=writes.length;
 await selectBlock('p6-guided-header','Calculate the range for these datasets.');
 assert.equal(await field('p6-guided-a','/answer/worked').count(),0);
 await guided.check();await ready();await selectBlock('p6-guided-header','Calculate the range for these datasets.');
 await field('p6-guided-a','/answer/worked').waitFor({state:'attached'});assert.equal(await practice.inputValue(),practiceBefore);
 await field('p6-guided-a','/answer/worked').scrollIntoViewIfNeeded();
 await screenshot('teaching-answers-on');
 await edition('short');assert.equal(await guided.isChecked(),true);
 assert.equal(await page.locator('.flow-paper [data-edit-root="p6-guided-a"]').count(),0);
 assert.ok(await field('p7-q1a','/answer/short').count());
 await guided.uncheck();await ready();assert.equal(await page.getByRole('combobox',{name:'Booklet edition',exact:true}).inputValue(),'short');
 assert.equal(writes.length,writesBeforeControls);
 check('guided teaching answers toggle independently; short edition remains practice-only and view controls do not autosave');
 await page.getByRole('button',{name:'Close panel',exact:true}).click();

 phase='outline filter and bank selection';console.log(phase);
 await edition('student');await selectBlock('p8-q6-block','loaves');
 assert.equal(await page.locator('.flow-outline .content-item').count(),1);
 await page.locator('.document-insert>summary').filter({hasText:/^Insert$/}).click();
 await page.getByRole('button',{name:'From question bank…',exact:true}).first().click();
 const picker=page.getByRole('dialog',{name:'Insert from question bank'});await picker.waitFor();
 await picker.getByRole('textbox',{name:'Search bank questions'}).fill('Range of four datasets');
 await page.waitForFunction(()=>document.querySelector('dialog[open]')?.querySelectorAll('.result').length===1);
 assert.equal(await picker.locator('.result').count(),1);assert.ok((await picker.locator('.preview-paper').innerText()).includes('Determine'));
 await screenshot('bank-filter-preview');
 await saveChange(()=>picker.getByRole('button',{name:'Insert question',exact:true}).click());
 assert.ok(blocks().some(b=>b.bankRef?.id===bank[0].id));
 check('outline filtering, candidate-backed bank search, preview and insertion use in-memory saves');
 await page.reload({waitUntil:'domcontentloaded'});await settled();assert.ok(blocks().some(b=>b.bankRef?.id===bank[0].id));

 phase='revision conflict recovery';console.log(phase);
 await selectBlock('p7-q1');editor=await openField('p7-q1-root','/prompt');
 record={...record,title:record.title+' (remote metadata)',revision:record.revision+1};
 await editor.locator('.editor-surface').fill(prompt+' Verify subtraction.');await page.keyboard.press('Control+s');
 await page.getByRole('button',{name:'Load latest and merge',exact:true}).waitFor();assert.ok(conflicts.length);
 await saveChange(()=>page.getByRole('button',{name:'Load latest and merge',exact:true}).click());
 assert.ok(record.title.endsWith('(remote metadata)'));assert.ok(JSON.stringify(block('p7-q1').content.prompt).includes('Verify subtraction.'));
 await screenshot('revision-merge-saved');check('stale revision rejected and Load latest and merge preserves remote metadata and local prompt');

 phase='representative booklet export';console.log(phase);
 await edition('short');await page.getByRole('button',{name:'Export',exact:true}).click();
 const writesBeforePrint=writes.length;
 await page.getByRole('button',{name:'Print / save PDF',exact:true}).click();
 await page.waitForFunction(()=>window.__studioPrintCalls===1,null,{timeout:60000});
 printSnapshots=await page.evaluate(()=>window.__studioPrintSnapshots);assert.ok(printSnapshots[0].bookletPages>0);assert.equal(writes.length,writesBeforePrint);
 await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
 await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
 await page.emulateMedia({media:'print'});await page.pdf({path:path.join(out,'range-short-interaction.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
 check('booklet Export reaches print with saved native edits and produces scoped short-answer PDF');

 phase='worksheet filter selection and export';console.log(phase);
 const worksheet=await context.newPage();worksheet.on('pageerror',e=>errors.push(e.message));worksheet.setDefaultTimeout(20000);
 activePage=worksheet;
 await worksheet.goto(base+'/#/booklet?stage=builder',{waitUntil:'domcontentloaded'});
 await worksheet.getByRole('textbox',{name:'Search question text or question ID',exact:true}).fill('Determine the range');
 await worksheet.locator('.apply-filters-btn').click();
 await worksheet.waitForFunction(()=>document.querySelectorAll('.questions-grid .question-row').length===1);
 await worksheet.getByRole('checkbox',{name:'Select '+bank[0].id,exact:true}).check();
 await worksheet.getByRole('button',{name:'Answers',exact:true}).click();
 await worksheet.getByRole('button',{name:'Solutions',exact:true}).click();
 await worksheet.getByRole('button',{name:'Preview',exact:true}).first().click();
 assert.equal(await worksheet.locator('.worksheet-preview-outer .preview-question').count(),1);
 assert.deepEqual(await worksheet.locator('.worksheet-preview-outer .answer-page h2').allTextContents(),['Short answers','Worked solutions']);
 await worksheet.screenshot({path:path.join(out,'worksheet-filter-selection.png')});
 await worksheet.getByRole('button',{name:'Print',exact:true}).click();
 await worksheet.waitForFunction(()=>window.__studioPrintCalls===1);
 const worksheetPrint=await worksheet.evaluate(()=>window.__studioPrintSnapshots[0]);assert.equal(worksheetPrint.worksheetQuestions,1);assert.deepEqual(worksheetPrint.worksheetAnswers,['Short answers','Worked solutions']);
 printSnapshots.push(worksheetPrint);
 await worksheet.emulateMedia({media:'print'});await worksheet.pdf({path:path.join(out,'worksheet-interaction.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
 assert.equal(writes.length,writesBeforePrint);await worksheet.close();activePage=page;
 check('bank text filtering selects the candidate question and worksheet preview/print includes short and worked answers');
 }
 assert.equal(blockedMutations.length,0,JSON.stringify(blockedMutations));assert.equal(errors.length,0,errors.join('\n'));
}catch(error){await activePage.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.error(error);process.exitCode=1;checks.push('FAILED: '+phase+': '+error.message);}
finally{
 const finalSource=fs.readFileSync(candidateFile);assert.equal(crypto.createHash('sha256').update(finalSource).digest('hex'),sourceHash,'Candidate source changed');
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({ok:process.exitCode!==1,candidateFile:path.resolve(candidateFile),sourceHash,scope:mode==='--full-open'?'whole candidate':{sections:record.sections.map(s=>s.id),sourcePages:[6,7,8],note:'Original candidate section content; cover disabled and student view selected in memory. Candidate-derived mock bank records carry approved status only inside this test.'},startedAt,endedAt:new Date().toISOString(),phase,checks,writes,conflicts,printSnapshots,blockedMutations,browserErrors:errors,requests},null,2));
 await browser.close();
}
