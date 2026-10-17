// Bulk and per-item spacing in the Studio panel, against in-memory saves only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createEditableProject,normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
const origin=process.env.STUDIO_ORIGIN??'http://localhost:5173';
const text=(id,value)=>({id,type:'paragraph',inlines:[{type:'text',text:value}]});
const doc=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
const table=id=>({id,type:'table',padding:2,rowHeights:[12,12,12],rows:[0,1,2].map(r=>[{id:`${id}-c${r}`,type:'cell',blocks:[text(`${id}-p${r}`,'Row '+(r+1))]}])});
let record=createEditableProject({id:'bulk-spacing-check',title:'Bulk spacing check',settings:{paginationMode:'flexible',generatedCover:false},sections:[{id:'s',title:'Exercise',blocks:[
 {id:'q1',type:'question',content:{id:'r1',prompt:doc([text('q1-stem','Complete the table.'),{id:'nested-layout',type:'layout',arrangement:'scaffold',columns:2,slots:[{id:'nested-slot',blocks:[table('t1')]},{id:'second-slot',blocks:[text('second-slot-text','Beside the table.')]}]}]),children:[
  {id:'r1a',label:'a',prompt:doc([{...text('q1a','First part '),inlines:[{type:'text',text:'First part '},{type:'cloze',answer:'9',width:14}]}]),answerSpaceMm:20},
  {id:'r1b',label:'b',prompt:doc([text('q1b','Second part')]),answerSpaceMm:20}]}},
 {id:'q2',type:'question',content:{id:'r2',prompt:doc([text('q2-stem','Second question.'),table('t2'),{id:'native-space',type:'spacer',height:15},{id:'native-list',type:'list',items:[{id:'native-li',blocks:[text('native-li-text','List item')]}]},...['speech-bubble','cards'].map((arrangement,i)=>({id:'frame-'+i,type:'layout',arrangement,columns:1,slots:[{id:'frame-slot-'+i,...(arrangement==='cards'?{label:'A'}:{}),blocks:[text('frame-text-'+i,'Frame text')]}]}))]),answerSpaceMm:20}},
]}]});
record.revision=1;
const errors=[];
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1700,height:1100}});page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname.endsWith('/open'))return route.fulfill({json:{project:record,bankSync:{items:[]}}});
 if(url.pathname==='/__booklet/projects/'+record.id){
  if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record=normalizeEditableProject({...body.project,revision:record.revision+1});}
  return route.fulfill({json:record});
 }
 if(req.method()==='GET'&&/files|assets/.test(url.pathname))return route.continue();
 return route.fulfill({json:url.pathname.endsWith('/manifest')?{questions:[]}:{items:[]}});
});
const ready=()=>page.waitForFunction(()=>document.querySelector('.project-print')?.dataset.paginationState==='ready',null,{timeout:120000});
const find=id=>{let found;const visit=n=>{if(!n||typeof n!=='object'||found)return;if(n.id===id){found=n;return;}Object.values(n).forEach(visit);};visit(record.sections);return found;};
// An autosave may already be in flight, so wait for the state to settle rather than for one request.
const save=async action=>{await action();await page.keyboard.press('Control+s');await page.waitForTimeout(400);await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');await ready();};
const panel=page.locator('#booklet-layout-spacing');
const fill=(name,value)=>save(async()=>{const input=panel.getByRole('spinbutton',{name,exact:true});await input.fill(value);await input.press('Tab');});
const layout=id=>record.settings.layoutOverrides.blockLayouts?.[id]?.arrangement;
const spaces=tree=>{const out=[];const walk=n=>{if(/space/.test(n.ref??''))out.push(n);n.children?.forEach(walk);};walk(tree.root);return out;};
try{
 await page.goto(origin+'/#/booklet?stage=projects&project='+record.id);await ready();
 await page.locator('.flow-paper [data-edit-root="r1"] .clickable').first().click();
 await page.getByRole('button',{name:'Spacing',exact:true}).click();
 assert.equal(await panel.getByRole('tab',{name:'Spacing',exact:true}).getAttribute('aria-selected'),'true');
 await page.evaluate(()=>{window.panelFocus=[];document.addEventListener('focusin',e=>window.panelFocus.push({tag:e.target.tagName,id:e.target.id,label:e.target.getAttribute('aria-label')}));});
 await panel.getByRole('tab',{name:'Spacing',exact:true}).focus();
 await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.activeElement?.id==='booklet-inspector-tables');assert.equal(await panel.getByRole('tab',{name:'Tables',exact:true}).getAttribute('aria-selected'),'true');
 await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>document.activeElement?.id==='booklet-inspector-layout');assert.equal(await panel.getByRole('tab',{name:'Spacing',exact:true}).getAttribute('aria-selected'),'true');

 // Answer spaces come first; table settings live in their own keyboard-accessible tab.
 assert.equal(await panel.getByRole('spinbutton').first().getAttribute('aria-label'),'Whole question answer space height (mm)');
 assert.equal(await panel.getByRole('spinbutton',{name:'Whole block tables: row height (mm)',exact:true}).count(),0);
 await panel.getByRole('tab',{name:'Tables',exact:true}).click();
 await fill('Whole block tables: row height (mm)','6');
 assert.deepEqual(find('t1').rowHeights,[6,6,6]);assert.deepEqual(find('t2').rowHeights,[12,12,12]);
 await panel.getByRole('tab',{name:'Spacing',exact:true}).click();
 await fill('Whole question answer space height (mm)','8');
 assert.deepEqual(spaces(layout('q1')).map(n=>n.height),[8,8]);

 // Inside the table: the whole table at once, then one row.
 await page.locator('.flow-paper table[data-id="t1"] td').nth(1).click();
 await page.locator('maths-editor table td').nth(1).click();
 await panel.getByRole('tab',{name:'Tables',exact:true}).click();
 assert.equal(await panel.getByRole('spinbutton',{name:'Column width (mm)',exact:true}).isVisible(),true);
 assert.equal(await panel.getByRole('button',{name:'Merge right',exact:true}).isVisible(),true);
 await fill('All table rows height (mm)','5');
 assert.deepEqual(find('t1').rowHeights,[5,5,5]);
 await fill('Row minimum height (mm)','9');
 assert.deepEqual(find('t1').rowHeights,[5,9,5]);
 // Typed digit by digit: the first digit of 12 is below the 4 mm minimum and must stay as typed.
 await save(async()=>{const input=panel.getByRole('spinbutton',{name:'Row minimum height (mm)',exact:true});await input.fill('');await input.pressSequentially('12');assert.equal(await input.inputValue(),'12');await input.press('Tab');});
 assert.deepEqual(find('t1').rowHeights,[5,12,5]);
 await fill('All table cells padding (mm)','1');
 assert.equal(find('t1').padding,1);
 await fill('Space above table (mm)','0');
 assert.equal(find('t1').marginBefore,0);
 await fill('Border width (mm)','0.4');
 assert.equal(find('t1').rows[1][0].borderWidthMm,0.4);
 await panel.getByRole('tab',{name:'Spacing',exact:true}).click();
 // The table's enclosing layout has independent spacing; editing its nested cell
 // must expose both controls, including zero, without changing table padding.
 await fill('Layout nested-layout outer spacing (mm)','0');
 await fill('Layout nested-layout inner padding (mm)','0');
 assert.equal(find('nested-layout').margin,0);assert.equal(find('nested-layout').padding,0);
 assert.equal(find('t1').padding,1);
 await save(()=>page.getByRole('button',{name:'Undo',exact:true}).click());
 assert.equal(find('nested-layout').padding,3);
 await fill('Layout nested-layout inner padding (mm)','0');
 await fill('Layout nested-layout column gap (mm)','2');assert.equal(find('nested-layout').gap,2);
 await page.keyboard.press('Escape');

 // Selecting the container itself exposes internal spacing without text editing.
 await page.locator('.flow-paper [data-layout-handle="layout:r1/prompt#nested-layout"]').first().dispatchEvent('click',{bubbles:true});
 await fill('Container inner padding (mm)','2');assert.equal(find('nested-layout').padding,2);
 await fill('Container outer spacing (mm)','1');assert.equal(find('nested-layout').margin,1);
 await save(()=>page.getByRole('button',{name:'Undo',exact:true}).click());assert.equal(find('nested-layout').margin,0);
 await fill('Container inner padding (mm)','0');assert.equal(find('nested-layout').padding,0);

 // One answer space by number, leaving its sibling at the bulk value.
 const space=page.locator('.flow-paper [data-arrangement-block="q1"] [data-arrangement-id*="space"]').first();
 await space.click({force:true});
 await fill('Answer space height (mm)','14');
 const heights=spaces(layout('q1')).map(n=>n.height).sort((a,b)=>a-b);
 assert.deepEqual(heights,[8,14]);
 assert.ok(Object.values(record.settings.layoutOverrides.answerSpaces).includes(14));
 await save(()=>page.getByRole('button',{name:'Undo',exact:true}).click());

 // Inline answer blanks, writing spacers and list indents all have main-panel controls.
 await page.locator('.flow-paper [data-edit-root="r1a"] .clickable').first().click();
 await page.locator('maths-editor [data-cloze]').first().click({force:true});
 await fill('Answer blank width (mm)','22');await fill('Answer blank writing lines','2');
 assert.equal(find('q1a').inlines.find(n=>n.type==='cloze').width,22);
 assert.equal(find('q1a').inlines.find(n=>n.type==='cloze').lines,2);
 await page.keyboard.press('Escape');
 for(const [id,name,value,property]of [['native-space','Container height (mm)','22','height'],['native-list','Container list indent (mm)','9','indent']]){
  await page.locator('.flow-paper [data-layout-handle="layout:r2/prompt#'+id+'"]').first().dispatchEvent('click',{bubbles:true});
  await fill(name,value);assert.equal(find(id)[property],Number(value));
 }
 // Preset frames have real optional padding controls; legacy defaults stay unchanged.
 for(const id of ['frame-0','frame-1']){
  await page.locator('.flow-paper [data-layout-handle="layout:r2/prompt#'+id+'"]').first().dispatchEvent('click',{bubbles:true});
  await fill('Container frame horizontal padding (mm)','0');
  await fill('Container frame vertical padding (mm)','1');
  assert.equal(find(id).paddingHorizontalMm,0);assert.equal(find(id).paddingVerticalMm,1);
 }
 // A whole-table selection offers direct settings and opens cell settings in place.
 await page.locator('.flow-paper [data-layout-handle="layout:r2/prompt#t2"]').first().dispatchEvent('click',{bubbles:true});
 await panel.getByRole('tab',{name:'Tables',exact:true}).click();
 assert.equal(await panel.getByRole('spinbutton',{name:'Container table width (mm)',exact:true}).isVisible(),true);
 await panel.getByRole('button',{name:'Edit cells, columns and borders',exact:true}).click();
 assert.equal(await panel.getByRole('spinbutton',{name:'Column width (mm)',exact:true}).isVisible(),true);
 if(process.env.STUDIO_SCREENSHOTS){fs.mkdirSync(process.env.STUDIO_SCREENSHOTS,{recursive:true});await page.screenshot({path:process.env.STUDIO_SCREENSHOTS+'/tables.png'});}
 await panel.getByRole('tab',{name:'Spacing',exact:true}).click();await page.keyboard.press('Escape');
 await page.locator('.flow-paper [data-arrangement-id="r1:question"]').first().dispatchEvent('click',{bubbles:true});
 if(!await panel.isVisible())await page.getByRole('button',{name:'Spacing',exact:true}).click();
 await fill('Selected group answer space height (mm)','8');
 await fill('Group minimum height (mm)','10');
 assert.equal(layout('q1').root.minHeight,10);
 await fill('Group minimum height (mm)','0');
 if(process.env.STUDIO_SCREENSHOTS)await page.screenshot({path:process.env.STUDIO_SCREENSHOTS+'/spacing.png'});

 // Several blocks together.
 await page.locator('.flow-paper [data-arrangement-id="r1:question"]').first().dispatchEvent('click',{bubbles:true});
 await page.locator('.flow-paper [data-arrangement-id="r2:question"]').first().dispatchEvent('click',{bubbles:true,ctrlKey:true});
 if(!await panel.isVisible())await page.getByRole('button',{name:'Spacing',exact:true}).click();
 assert.equal(await panel.locator('#whole-question-spacing-heading').innerText(),'2 selected blocks');
 await panel.getByRole('tab',{name:'Tables',exact:true}).click();
 await fill('Whole block tables: row height (mm)','7');
 assert.deepEqual(find('t1').rowHeights,[7,7,7]);assert.deepEqual(find('t2').rowHeights,[7,7,7]);
 await page.reload();await ready();
 assert.equal(find('nested-layout').margin,0);assert.equal(find('nested-layout').padding,0);
 await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
 await page.waitForFunction(()=>document.querySelector('.project-print [data-id="nested-layout"]'));
 const printed=await page.locator('.project-print [data-id="nested-layout"]').first().evaluate(el=>({margin:el.style.margin,padding:el.style.padding}));
 assert.equal(printed.margin,'0mm 0px');assert.equal(printed.padding,'0mm');
 for(const id of ['frame-0','frame-1']){const padding=await page.locator('.project-print [data-id="'+id+'"]').first().evaluate(el=>{const frame=el.querySelector('[data-card-face]')??el.querySelector('[data-slot]');return [frame.style.paddingTop,frame.style.paddingLeft];});assert.deepEqual(padding,['1mm','0mm']);}
 assert.deepEqual(errors,[]);
 console.log('bulk spacing browser check passed');
}catch(error){console.error('Focus state:',await page.evaluate(()=>({active:document.activeElement?.outerHTML,events:window.panelFocus})));console.error('Browser errors:',errors);console.error('Panel state:',await page.locator('body').innerText({timeout:1000}));console.error('Selected layout:',await page.locator('.flow-paper .selected[data-arrangement-id]').evaluateAll(els=>els.map(el=>el.dataset.arrangementId)));throw error;}finally{await browser.close();}
