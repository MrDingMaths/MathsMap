import fs from 'node:fs';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {fromSource} from '../../public/libs/maths-editor/document-model.mjs';
import {questionSpacing} from '../../src/lib/booklet-document-tools.js';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const out='.booklet-work/document-tools-check';fs.mkdirSync(out,{recursive:true});
let record=createEditableProject({id:'tools-check',title:'Restored editing tools',settings:{paginationMode:'flexible',generatedCover:false},topics:[{id:'topic',title:'Algebra'}],sections:[{id:'s',topicId:'topic',phase:'teaching',title:'Algebra',blocks:[{id:'q',type:'question',content:{id:'root',prompt:fromSource('Selected prose.\n\nSecond paragraph.'),children:[{id:'a',label:'a',prompt:fromSource('Simplify $x+x$.'),answerSpaceMm:10,answer:{short:'$2x$'}},{id:'b',label:'b',prompt:fromSource('Continue $y+y$.'),answerSpaceMm:20,answer:{short:'$2y$'}}]}},{id:'source',type:'rich-text',content:fromSource('$\\textcolor{#AA0505}{x}$')},{id:'list',type:'rich-text',content:fromSource('- First item\n- Second item')}]}]});record.revision=1;
const errors=[];let writes=0,browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1700,height:1100}});page.on('pageerror',e=>errors.push(e.stack));
await page.route('**/__booklet/**',async route=>{const req=route.request(),url=new URL(req.url());if(url.pathname==='/__booklet/projects')return route.fulfill({json:[{id:record.id,title:record.title,revision:record.revision}]});if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes++;}return route.fulfill({json:record});}return route.fulfill({json:url.pathname.includes('bank-sync')?{items:[]}:[]});});
const saved=()=>page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
const block=()=>record.sections[0].blocks[0];
const openField=async id=>{await page.locator(`.flow-paper [data-edit-root="${id}"][data-edit-path="/prompt"] .clickable`).first().click();await page.locator(`.flow-paper [data-edit-root="${id}"] maths-editor .me-content`).waitFor();};
const selectProse=()=>page.locator('maths-editor .me-content p').first().evaluate(p=>{const range=document.createRange();range.selectNodeContents(p);getSelection().removeAllRanges();getSelection().addRange(range);p.closest('maths-editor').documentController.saveRange();});
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5174')+'/#/booklet?stage=projects&project=tools-check',{waitUntil:'networkidle'});
 await openField('root');await selectProse();await page.getByRole('button',{name:'Source colour #AA0505',exact:true}).click();await saved();assert.ok(block().content.prompt.blocks[0].inlines.some(n=>n.colour==='#aa0505'));
 await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.ok(!JSON.stringify(block().content.prompt).includes('#aa0505'));
 await page.locator('.flow-paper [data-edit-root="a"][data-edit-path="/prompt"] .katex').first().click();await page.waitForFunction(()=>document.activeElement?.matches('math-field'));
 const beforeMath=structuredClone(block().content.children[0].prompt);await page.locator('maths-editor .me-content math-field').evaluate(mf=>{mf.focus();mf.executeCommand('selectAll');});await page.getByRole('button',{name:'Booklet blue',exact:true}).click();await saved();assert.match(JSON.stringify(block().content.children[0].prompt),/268cff|38, ?140, ?255/);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.deepEqual(block().content.children[0].prompt,beforeMath);
 await page.locator('[data-document-group="q"] .group-handle').click();
 const questionBefore=structuredClone(block().content);
 await page.locator('.question-spacing>summary').click();await page.getByLabel('Whole question answer space height (mm)',{exact:true}).fill('23');await page.getByLabel('Whole question answer space height (mm)',{exact:true}).press('Tab');await saved();assert.deepEqual(questionSpacing(record,block()).spaces.map(s=>s.height),[23,23]);assert.deepEqual(block().content,questionBefore);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.equal(questionSpacing(record,block()).height,'');
 await page.getByLabel('Whole question vertical gap (mm)',{exact:true}).fill('5');await page.getByLabel('Whole question vertical gap (mm)',{exact:true}).press('Tab');await saved();assert.equal(questionSpacing(record,block()).gap,5);await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();await page.locator('.question-spacing>summary').click();
 await openField('a');await page.getByRole('button',{name:'More options',exact:true}).click();await page.getByRole('button',{name:'Add tab stop',exact:true}).click();await saved();assert.equal(block().content.children[0].prompt.blocks[0].tabStops[0].position,10);
 await page.getByRole('button',{name:'Copy tab settings',exact:true}).click();await page.getByRole('button',{name:'Close panel',exact:true}).click();await openField('b');await page.getByRole('button',{name:'More options',exact:true}).click();await page.getByRole('button',{name:'Paste tab settings',exact:true}).click();await saved();assert.equal(block().content.children[1].prompt.blocks[0].tabStops[0].position,10);
 await page.getByRole('button',{name:'Apply to this question’s parts',exact:true}).click();await saved();await page.getByRole('button',{name:'Close panel',exact:true}).click();
 // Every formerly hidden insert tool is reachable. Exercise code-free layout templates and undo.
 for(const [label,type] of [['Matching cards','layout'],['Speech bubble','speech-bubble'],['Writing space','spacer'],['Annotated equation','annotated-equation']]){
   if(!await page.locator('maths-editor').count())await openField('b');
   const before=structuredClone(block().content.children[1].prompt);
   await page.locator('.document-insert>summary').filter({hasText:/^Insert$/}).click();const extra=page.locator('.document-insert details').filter({has:page.getByText('More insertions',{exact:true})});if(await extra.getAttribute('open')===null)await extra.locator('summary').click();await page.getByRole('button',{name:label,exact:true}).click();await saved();assert.notDeepEqual(block().content.children[1].prompt,before);
   await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.deepEqual(block().content.children[1].prompt,before);
   await page.locator('.document-insert>summary').filter({hasText:/^Insert$/}).click();
 }
 await page.locator('.flow-paper [data-edit-root="list"] .clickable').click();await page.locator('maths-editor .me-content li').last().evaluate(li=>{const r=document.createRange();r.selectNodeContents(li);r.collapse(true);li.closest('.me-content').focus();getSelection().removeAllRanges();getSelection().addRange(r);li.closest('maths-editor').documentController.saveRange();});
 await page.getByRole('button',{name:'Indent list',exact:true}).click();await saved();assert.ok(await page.locator('maths-editor .me-content li li').count());await page.getByRole('button',{name:'Outdent list',exact:true}).click();await saved();assert.equal(await page.locator('maths-editor .me-content li li').count(),0);
 await page.reload({waitUntil:'networkidle'});await openField('a');await page.getByRole('button',{name:'More options',exact:true}).click();assert.equal(await page.getByLabel('Tab 1 position (mm)',{exact:true}).inputValue(),'10');
 await page.getByRole('button',{name:'Close panel',exact:true}).click();await page.getByRole('button',{name:'Organise booklet',exact:true}).click();
 await page.getByLabel('Topic title',{exact:true}).fill('Renamed algebra');await page.getByLabel('Topic title',{exact:true}).press('Tab');await saved();assert.equal(record.topics[0].title,'Renamed algebra');await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.equal(record.topics[0].title,'Algebra');
 await page.locator('.flow-outline [data-block-id="q"] button').click();await page.getByRole('button',{name:'Copy',exact:true}).click();const count=record.sections[0].blocks.length;await page.getByRole('button',{name:'Paste here',exact:true}).click();await saved();assert.equal(record.sections[0].blocks.length,count+1);await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.equal(record.sections[0].blocks.length,count);
 await page.getByText('Page layout for selection',{exact:true}).click();await page.getByRole('button',{name:'Keep with next',exact:true}).click();await saved();assert.equal(block().flow.keepWithNext,true);await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.ok(!block().flow?.keepWithNext);
 assert.equal(await page.getByRole('button',{name:'Insert bank copy',exact:true}).count(),1);
 await page.screenshot({path:out+'/tools.png'});assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({passed:true,writes,errors},null,2));console.log(JSON.stringify({passed:true,writes,errors}));
}catch(e){await page.screenshot({path:out+'/failure.png'});console.log((await page.locator('body').innerText()).slice(-3000));throw e;}finally{await browser.close();}
