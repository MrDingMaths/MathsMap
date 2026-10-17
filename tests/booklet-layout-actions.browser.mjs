import fs from 'node:fs';import assert from 'node:assert/strict';import {chromium} from 'playwright-core';
import {createEditableProject,normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
const RUN='.booklet-work/review-speed-20261017';fs.mkdirSync(RUN,{recursive:true});
const doc=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
const paragraph=(id,text,spaceAfter=2)=>({id,type:'paragraph',spaceAfter,inlines:[{type:'text',text}]});
let record=createEditableProject({id:'layout-actions-browser',title:'Layout actions',topics:[{id:'t',title:'Layout'}],settings:{paginationMode:'flexible',flowEdition:'student',generatedCover:false},sections:[{id:'s',topicId:'t',title:'Practice',phase:'practice',blocks:[
 {id:'q1',type:'question',content:{id:'r1',prompt:doc(Array.from({length:8},(_,i)=>paragraph('p'+i,'Calculate the value of '+(i+1)+' + 2.',23))),answerSpaceMm:20,answer:{short:'3',worked:'1+2=3'}}},
 {id:'q2',type:'question',content:{id:'r2',prompt:'Complete these calculations.',layout:'grid',columns:2,children:['a','b'].map((id,i)=>({id,type:'part',label:id,prompt:doc([paragraph('part-'+id,'Calculate '+(i+1)+' + 2.')]),answerSpaceMm:i?32:24,answer:{short:String(i+3),worked:(i+1)+'+2='+(i+3)}}))}},
 {id:'q3',type:'question',sourceReview:{tableResponses:[{cellId:'cell0',targetId:'r3'},{cellId:'cell1',targetId:'r3'}]},content:{id:'r3',prompt:doc([{id:'table',type:'table',padding:1,rowHeights:[14,24],rows:[0,1].map(i=>[{id:'cell'+i,type:'cell',blocks:[paragraph('cell-p'+i,'')]}])}]),responseSpace:'scaffold',answerSpaceMm:0,answer:{short:'4',worked:'4'}}},
 {id:'forced',type:'page-break'},
 {id:'q4',type:'question',content:{id:'r4',prompt:'Calculate 5+5.',answerSpaceMm:20,answer:{short:'10',worked:'5+5=10'}}},
]}]});record.revision=1;record.settings.flowEdition='student';record.settings.generatedCover=false;
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1700,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{const req=route.request(),u=new URL(req.url());if(u.pathname.endsWith('/open'))return route.fulfill({json:{project:record,bankSync:{items:[]}}});if(u.pathname==='/__booklet/projects')return route.fulfill({json:[record]});if(u.pathname==='/__booklet/projects/'+record.id){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record=normalizeEditableProject({...body.project,revision:record.revision+1});}return route.fulfill({json:record});}return route.fulfill({json:u.pathname.endsWith('/manifest')?{questions:[]}:{items:[]}});});
const ready=()=>page.waitForFunction(()=>document.querySelector('.project-print')?.dataset.paginationState==='ready',null,{timeout:120000});
const saved=async()=>{await page.keyboard.press('Control+s');await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');await ready();};
async function select(id){const toggle=page.getByRole('button',{name:'Toggle page navigation',exact:true}),all=page.getByLabel('Show every block in page order',{exact:true});if(!await all.isVisible())await toggle.click();await all.check();await page.locator('[data-outline-block="'+id+'"]>button').click();await ready();await toggle.click();}
const panel=page.locator('#booklet-layout-spacing'),actions=panel.getByRole('region',{name:'Quick layout actions'});
try{
 await page.goto((process.env.STUDIO_ORIGIN??'http://127.0.0.1:5173')+'/#/booklet?stage=projects&project='+record.id);await ready();
 await select('q1');await page.getByRole('button',{name:'Spacing',exact:true}).first().click();
 const quick=panel.locator('[aria-label="Quick layout actions"]');await quick.waitFor();
 await quick.getByText('Tighten to fit',{exact:true}).click();const untouched=JSON.stringify(record.sections);
 await quick.getByRole('button',{name:'Preview tighter layout'}).click();await quick.getByRole('button',{name:'Apply preview'}).waitFor({timeout:120000});
 assert.equal(JSON.stringify(record.sections),untouched,'preview must not autosave');await quick.getByRole('button',{name:'Apply preview'}).click();await saved();assert.equal(record.sections[0].blocks[0].content.prompt.blocks[0].spaceAfter,1);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.equal(record.sections[0].blocks[0].content.prompt.blocks[0].spaceAfter,23);
 await quick.getByRole('button',{name:'Preview tighter layout'}).click();await quick.getByRole('button',{name:'Apply preview'}).waitFor({timeout:120000});await select('q2');assert.equal(await quick.getByRole('button',{name:'Apply preview'}).count(),0);assert.equal(record.sections[0].blocks[0].content.prompt.blocks[0].spaceAfter,23,'selection change cancels the pending preview');
 await page.getByRole('button',{name:'Redo',exact:true}).click();await saved();
 // Select subsequent blocks via the outline without depending on virtualised pages.
 await select('q2');
 await quick.getByText('Match siblings',{exact:true}).click();await quick.getByLabel('Match sibling source').selectOption('a');await quick.getByLabel('Working space',{exact:true}).uncheck();await quick.getByRole('button',{name:'Match sibling parts'}).click();await saved();assert.equal(record.sections[0].blocks[1].content.children[1].answerSpaceMm,32);await quick.getByLabel('Working space',{exact:true}).check();await quick.getByRole('button',{name:'Match sibling parts'}).click();await saved();assert.equal(record.sections[0].blocks[1].content.children[1].answerSpaceMm,24);assert.equal(record.sections[0].blocks[1].content.children[1].answer.short,'4');
 await quick.getByLabel('Block role',{exact:true}).selectOption('guided-practice');await saved();assert.equal(record.sections[0].blocks[1].sourceAtom.kind,'guided-practice');
 await page.reload();await ready();assert.equal(record.sections[0].blocks[1].sourceAtom.kind,'guided-practice');assert.equal(record.sections[0].blocks[0].content.prompt.blocks[0].spaceAfter,1);
 await select('q3');await page.getByRole('button',{name:'Spacing',exact:true}).first().click();await quick.waitFor();await quick.getByText('Match siblings',{exact:true}).click();await quick.getByLabel('Match table',{exact:true}).selectOption('table');await quick.getByRole('button',{name:'Match table rows'}).click();await saved();assert.equal(record.sections[0].blocks[2].content.prompt.blocks[0].rowHeights[1],14);
 await quick.getByText('What controls this space',{exact:true}).click();assert.ok(await quick.locator('fieldset').count()>0);
 const gap=quick.getByLabel('Question Gap',{exact:true});await gap.fill('1');await gap.press('Tab');await saved();assert.equal(record.settings.layoutOverrides.blockLayouts.q3.arrangement.root.gap,1);
 await quick.getByText('Tighten to fit',{exact:true}).click();await quick.getByLabel('Fit target block').selectOption('q4');const impossibleBefore=JSON.stringify(record);await quick.getByRole('button',{name:'Preview tighter layout'}).click();await quick.getByText('Cannot fit within the writing-space and diagram minima. Nothing changed.',{exact:true}).waitFor({timeout:120000});assert.equal(JSON.stringify(record),impossibleBefore);
 await page.screenshot({path:RUN+'/studio-controls.png'});await page.emulateMedia({media:'print'});await page.pdf({path:RUN+'/studio-controls.pdf',format:'A4',printBackground:true});assert.deepEqual(errors,[]);
 console.log('PASS preview/apply/undo/redo, sibling and row matching, role, container chain, save/reopen and print');
}catch(error){fs.writeFileSync(RUN+'/browser-failure.json',JSON.stringify({error:error.message,errors,edition:await page.getByLabel('Booklet edition',{exact:true}).inputValue().catch(()=>''),status:await page.locator('.layout-actions').textContent().catch(()=>''),body:await page.locator('body').innerText().catch(()=>'')},null,1));await page.screenshot({path:RUN+'/browser-failure.png'});throw error;}finally{await browser.close();}


