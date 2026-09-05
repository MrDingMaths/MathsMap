// Browser integration with intercepted project writes; never changes user booklets.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { createEditableProject } from '../../src/lib/editable-booklet-model.js';
import { studioProject, proposalForFields } from '../../src/lib/booklet-review-model.js';
let record=studioProject(createEditableProject({id:'studio-test',title:'Studio verification',sections:[{id:'section',title:'Index laws',blocks:[{id:'theory',type:'rich-text',content:'Compare **equal bases**.\n\n$x^3 \\times x^4=x^7$'}]}]}));record.revision=1;
record.studio.recipe={format:'mathsmap-assembly-recipe-v1',chunks:[{id:'chunk-a',title:'Tables of values',blockIds:['theory'],skillIds:['construct-table-of-values'],archetypes:['positive integer gradient'],prerequisiteIds:[]}],scopeSkillIds:['construct-table-of-values'],extensions:[],assumedPrerequisites:['substitute-negative-numbers'],counts:{examples:1,guided:1,Foundation:1,Development:1,Mastery:1,mini:1,cumulative:1,challenge:1},optionalMastery:true,exceptions:{}};
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1800,height:1200}}),errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/projects',(route)=>route.fulfill({json:[{id:record.id,title:record.title,sections:1,revision:record.revision}]}));
await page.route('**/__booklet/projects/studio-test',async route=>{if(route.request().method()==='PUT'){const body=route.request().postDataJSON();writes.push(body.project);record={...body.project,revision:record.revision+1};}await route.fulfill({json:record});});
await page.route('**/__booklet/projects/studio-test/propose',async route=>{const body=route.request().postDataJSON();await route.fulfill({json:{proposal:proposalForFields(body.project,[{targetId:'theory',path:'/content',after:'Reviewed wording.'}],'Tighten wording')}});});
try{
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project=studio-test',{waitUntil:'networkidle'});
 await page.locator('.project-canvas [data-edit-root="theory"][data-edit-path="/content"] .document-edit').click();
 await page.locator('.project-canvas maths-editor .editor-surface').waitFor();
 await page.locator('.project-canvas maths-editor').getByRole('button',{name:'Table',exact:true}).click();
 assert.equal(await page.locator('.project-canvas maths-editor table').count(),1);
 await page.locator('.project-canvas .maths-editor').getByRole('button',{name:'Save',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 assert.equal(record.sections[0].blocks[0].content.format,'maths-editor-document-v1');
 assert.ok(record.sections[0].blocks[0].content.blocks.some(b=>b.type==='table'));
 await page.reload({waitUntil:'networkidle'});
 assert.equal(await page.locator('.project-canvas .document-content table').count(),1);
 await page.getByText('AI revisions',{exact:true}).click();await page.getByLabel('Requested improvement').fill('Tighten wording');
 await page.getByRole('button',{name:'Propose changes',exact:true}).click();await page.getByRole('button',{name:'Accept',exact:true}).waitFor();
 assert.notEqual(record.sections[0].blocks[0].content,'Reviewed wording.');
 await page.getByRole('button',{name:'Accept',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 assert.equal(record.sections[0].blocks[0].content,'Reviewed wording.');
 await page.getByRole('button',{name:'Undo accepted batch',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 assert.equal(record.sections[0].blocks[0].content.format,'maths-editor-document-v1');
 await page.getByText('Assemble teaching sequence',{exact:true}).click();
 await page.getByRole('button',{name:'Load MathsMap questions',exact:true}).click();await page.getByRole('button',{name:'Load MathsMap questions',exact:true}).waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.assembly-panel button')].find(b=>b.textContent==='Load MathsMap questions')?.disabled===false);
 await page.getByRole('button',{name:'Preview sequence and gaps',exact:true}).click();await page.getByRole('heading',{name:'Proposed sequence',exact:true}).waitFor();
 assert.ok(await page.locator('.assembly-panel .matrix tbody tr').count()>=3);assert.match(await page.locator('.assembly-panel ol').textContent(),/Theory.*Guided.*Blocked Foundation.*Cumulative interleaved/s);
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('.assembly-panel').isVisible(),false);assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).colorScheme),'light');await page.emulateMedia({media:'screen'});
 await page.evaluate(()=>{window.__printCheck=[];window.TikZ.flushPending=async root=>{window.__printCheck.push(root.classList.contains('project-print')?'diagrams':'wrong-root');return true;};window.print=()=>window.__printCheck.push('print');});
 await page.getByRole('button',{name:'Print / save PDF',exact:true}).click();await page.waitForFunction(()=>window.__printCheck.includes('print'));assert.deepEqual(await page.evaluate(()=>window.__printCheck),['diagrams','print']);
 fs.mkdirSync('tmp/studio-verification',{recursive:true});await page.screenshot({path:'tmp/studio-verification/workspace.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('Structured editor → project save/reload → proposal → acceptance → batch undo passed. All project writes were intercepted.');
}catch(error){console.error({browserErrors:errors,writes,record,notice:await page.locator('.project-notice').allTextContents()});throw error;}finally{await browser.close();}
