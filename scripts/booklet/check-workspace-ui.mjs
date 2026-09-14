// UI regression with intercepted, in-memory saves. Never writes a user's project/bank.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {normalizeEditableProject} from '../../src/lib/editable-booklet-model.js';
import {fromSource} from '../../src/lib/document-content.js';
const out='.booklet-work/ui-redesign';fs.mkdirSync(out,{recursive:true});
const question=id=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'Find the missing angle in each diagram.',layout:'grid',columns:2,children:Array.from({length:4},(_,i)=>({id:id+'-'+i,type:'part',label:String.fromCharCode(97+i),prompt:`$x + ${30+i*10} = 180$`,answer:{short:String(150-i*10),worked:`$x = ${150-i*10}$`},answerSpaceMm:12}))}});
let record=normalizeEditableProject({id:'workspace-ui-check',title:'Angle Relationships · UI review',revision:1,settings:{paginationMode:'flexible',generatedCover:false,flowEdition:'student',exerciseOrganisation:'topic'},topics:[{id:'angles',title:'Angle relationships'},{id:'lines',title:'Parallel lines'}],sections:[{id:'teach',topicId:'angles',phase:'teaching',title:'Key Ideas',blocks:[{id:'theory',type:'rich-text',content:fromSource('Angles on a straight line add to $180°$.')}]},{id:'practice',topicId:'angles',phase:'practice',title:'Practice',blocks:[question('q1'),question('q2')]},{id:'parallel',topicId:'lines',phase:'practice',title:'Practice',blocks:[question('q3')]}]});
const bank=[{id:'opaque-bank-question',title:'',classification:{primarySkillId:'angle-sum-triangle',difficulty:'Foundation'},content:{...question('bank').content,prompt:'Calculate the missing angle.'},source:{file:'Angles',pageNumber:12,questionNumber:3}},{id:'another-bank-id',title:'Parallel line angles',classification:{primarySkillId:'parallel-lines',difficulty:'Development'},content:question('bank2').content}];
const original=structuredClone(record),writes=[],errors=[],checks=[];
const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1366,height:768},colorScheme:'light'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
page.setDefaultTimeout(20000);page.on('console',msg=>{if(msg.type()==='error')console.log('browser:',msg.text().slice(0,300));});page.on('response',r=>{if(r.status()>=400)console.log(r.status(),r.url());});
await page.addInitScript(()=>localStorage.setItem('mathsmap.theme.v1','light'));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname==='/__booklet/projects/'+record.id){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes.push(structuredClone(record));}return route.fulfill({json:record});}
 if(url.pathname==='/__booklet/bank/manifest')return route.fulfill({json:{questions:bank.map(q=>({id:q.id}))}});
 if(url.pathname.startsWith('/__booklet/bank/questions/'))return route.fulfill({json:bank.find(q=>q.id===url.pathname.split('/').at(-1))});
 if(req.method()==='GET'&&/files|assets/.test(url.pathname))return route.continue();
 return route.fulfill({json:{items:[]}});
});
const ready=()=>page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:60000});
const settle=async()=>{await ready();await page.waitForTimeout(100);await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved',null,{timeout:20000});};
const fit=async selector=>page.locator(selector).evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,bottom:el.getBoundingClientRect().bottom,viewport:innerHeight}));
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173')+'/#/booklet?stage=projects&project='+record.id,{waitUntil:'domcontentloaded'});console.log('loaded document');await settle();console.log('booklet ready');
 await page.locator('.flow-outline [data-block-id="q1"] .content-select').click();
 await page.getByRole('button',{name:'Layout & spacing',exact:true}).click();
 await page.getByRole('button',{name:'Detailed arrangement…',exact:true}).click();
 await page.getByRole('dialog',{name:'Edit question arrangement'}).waitFor();
 await page.screenshot({path:out+'/arrangement-1366.png'});
 for(const name of ['Layout','Arrange','Page']){await page.locator('.question-workspace').getByRole('tab',{name,exact:true}).click();const bounds=await fit('.arr-properties');assert.ok(bounds.scroll<=bounds.height+1,`${name} arrangement overflow: ${JSON.stringify(bounds)}`);}
 const canvas=await fit('.arr-canvas');assert.ok(canvas.bottom>=740,'Arrangement must use available height');checks.push('arrangement tabs fit and workspace fills dialog');
 await page.locator('.question-workspace').getByRole('tab',{name:'Layout',exact:true}).click();
 await page.locator('.question-workspace').getByRole('spinbutton',{name:'Gap (mm)',exact:true}).fill('4');await page.locator('.question-workspace').getByRole('spinbutton',{name:'Gap (mm)',exact:true}).press('Tab');
 await page.locator('.focused-editor').getByRole('button',{name:'Cancel',exact:true}).click();await settle();assert.deepEqual(record.sections,original.sections);checks.push('Cancel preserves content');
 for(const size of [{width:1366,height:768},{width:1920,height:1080},{width:3386,height:1219}]){
  await page.setViewportSize(size);await settle();
  for(const name of ['Layout','Arrange','Page']){await page.locator('.layout-spacing-panel').getByRole('tab',{name,exact:true}).click();const bounds=await fit('.project-inspector');assert.ok(bounds.scroll<=bounds.height+1,`${name} inspector overflow at ${size.width}: ${JSON.stringify(bounds)}`);}
  const body=await page.evaluate(()=>({scroll:document.documentElement.scrollHeight,height:innerHeight}));assert.ok(body.scroll<=body.height+1,'Outer page should not scroll: '+JSON.stringify(body));
  await page.screenshot({path:out+`/workspace-${size.width}.png`});
 }
 checks.push('all desktop inspector tabs fit');
 await page.setViewportSize({width:1366,height:768});
 await page.locator('.layout-spacing-panel').getByRole('button',{name:'Page break after',exact:true}).click();await settle();assert.equal(record.sections.find(s=>s.id==='practice').blocks[1].type,'page-break');
 await page.getByRole('button',{name:/Remove manual break before page/}).last().click();await settle();assert.equal(record.sections.find(s=>s.id==='practice').blocks.length,2);checks.push('page break add/remove');
 await page.locator('.document-insert>summary').filter({hasText:/^Insert$/}).click();await page.getByRole('button',{name:'From question bank…',exact:true}).first().click();
 const picker=page.getByRole('dialog',{name:'Insert from question bank'});await picker.waitFor();await picker.getByRole('searchbox').count();
 await picker.getByRole('textbox',{name:'Search bank questions'}).fill('Calculate');await page.waitForTimeout(300);await page.screenshot({path:out+'/bank-picker.png'});
 assert.equal(await picker.locator('.result').count(),1);assert.ok(await picker.locator('.preview-paper').innerText());assert.ok(!(await picker.locator('.result').innerText()).includes('opaque-bank-question'));
 await picker.getByRole('button',{name:'Insert question',exact:true}).click();await settle();assert.ok(record.sections.some(s=>s.blocks.some(b=>b.bankRef?.id==='opaque-bank-question')));checks.push('search, preview and bank insertion');
 await page.reload();await settle();assert.ok(record.sections.some(s=>s.blocks.some(b=>b.bankRef?.id==='opaque-bank-question')));checks.push('save/reopen');
 // Native text selection remains active across inspector tabs and commands.
 await page.locator('.flow-outline [data-block-id="q1"] .content-select').click();
 await page.locator('.flow-paper [data-edit-root="q1-root"] .clickable').first().click();
 await page.locator('.layout-spacing-panel').getByRole('tab',{name:'Layout',exact:true}).click();
 await page.locator('.layout-spacing-panel').getByRole('spinbutton',{name:'Paragraph Above',exact:true}).fill('1');
 await page.locator('.layout-spacing-panel').getByRole('spinbutton',{name:'Paragraph Above',exact:true}).press('Tab');await settle();
 for(const name of ['Arrange','Layout','Page']){await page.locator('.layout-spacing-panel').getByRole('tab',{name,exact:true}).click();const bounds=await fit('.project-inspector');assert.ok(bounds.scroll<=bounds.height+1,'Native '+name+' overflow');}
 checks.push('native text selection and paragraph controls');
 // A long native table uses one row selector, keeping the inspector bounded.
 record.sections[0].blocks[0].content=fromSource('| Value | Angle |\n|---|---|\n'+Array.from({length:16},(_,i)=>'| '+(i+1)+' | '+(30+i)+' |').join('\n'));
 await page.reload();await settle();
 await page.locator('.flow-outline [data-block-id="theory"] .content-select').click();
 await page.locator('.flow-paper [data-edit-root="theory"] .clickable').first().click();
 await page.locator('.flow-paper .me-content td').nth(10).click();
 await page.locator('.layout-spacing-panel').getByRole('tab',{name:'Layout',exact:true}).click();
 await page.locator('.native-layout-fields').getByRole('combobox',{name:'Table row',exact:true}).selectOption('10');
 assert.equal(await page.locator('.native-layout-fields').getByRole('spinbutton',{name:/Table row .* minimum height/}).count(),1);
 const tableBounds=await fit('.project-inspector');assert.ok(tableBounds.scroll<=tableBounds.height+1,'Native table overflow: '+JSON.stringify(tableBounds));
 await page.locator('.native-layout-fields').getByRole('spinbutton',{name:'Table row 11 minimum height (mm)',exact:true}).fill('6');await page.keyboard.press('Tab');await settle();
 assert.equal(record.sections[0].blocks[0].content.blocks[0].rowHeights[10],6);checks.push('native table row selection and bounded controls');
 await page.locator('.layout-spacing-panel').getByRole('tab',{name:'Page',exact:true}).click();
 // Text enlargement permits scrolling while retaining reachable controls.
 await page.addStyleTag({content:'.project-screen button,.project-screen label,.project-screen input,.project-screen select{font-size:28px!important}'});
 await page.screenshot({path:out+'/text-enlargement.png'});assert.ok(await page.locator('.layout-spacing-panel').getByRole('button',{name:'Page break before',exact:true}).isVisible());
 await page.reload();await settle();
 await page.setViewportSize({width:800,height:700});await settle();await page.screenshot({path:out+'/workspace-narrow.png'});
 await page.setViewportSize({width:1366,height:768});
 await page.locator('.toolbar-actions .menu>summary').filter({hasText:'Tools'}).click();await page.getByRole('button',{name:'Assembly',exact:true}).click();
 await page.getByRole('combobox',{name:'Booklet type',exact:true}).selectOption('revision');await page.getByRole('button',{name:'Choose question...',exact:true}).first().click();await page.getByRole('dialog',{name:'Choose a revision question',exact:true}).waitFor();await page.getByRole('dialog',{name:'Choose a revision question',exact:true}).getByRole('button',{name:'Cancel',exact:true}).click();checks.push('assembly reuses the question preview picker');
 assert.equal(errors.length,0,errors.join('\n'));
 fs.writeFileSync(out+'/ui-result.json',JSON.stringify({checks,writes:writes.length,errors},null,2));console.log(JSON.stringify({checks,writes:writes.length,errors}));
}catch(e){await page.screenshot({path:out+'/failure.png'});console.error(e);console.error(errors);process.exitCode=1;}
finally{await browser.close();}
