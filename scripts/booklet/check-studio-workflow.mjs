// Browser integration with intercepted project writes; never changes user booklets.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { createEditableProject } from '../../src/lib/editable-booklet-model.js';
import { studioProject } from '../../src/lib/booklet-review-model.js';
let record=studioProject(createEditableProject({id:'studio-test',title:'Studio verification',sections:[{id:'section',title:'Index laws',blocks:[{id:'theory',type:'rich-text',content:'Compare **equal bases**.\n\n$x^3 \\times x^4=x^7$'}]}]}));record.revision=1;
record.sections[0].blocks[0].diagrams=['student','answer','teaching'].map(role=>({id:role,format:'tikz',code:role+' initial',alt:role,widthMm:78,...(role==='answer'?{overlayOf:'student'}:{})}));
record.studio.recipe={format:'mathsmap-assembly-recipe-v1',chunks:[{id:'chunk-a',title:'Tables of values',blockIds:['theory'],skillIds:['construct-table-of-values'],archetypes:['positive integer gradient'],prerequisiteIds:[]}],scopeSkillIds:['construct-table-of-values'],extensions:[],assumedPrerequisites:['substitute-negative-numbers'],counts:{examples:1,guided:1,Foundation:1,Development:1,Mastery:1,mini:1,cumulative:1,challenge:1},optionalMastery:true,exceptions:{}};
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1800,height:1200}}),errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));
async function installRoutes(page,mockTikz=true){
 await page.route('**/__booklet/**',route=>route.request().method()==='GET'?route.continue():route.abort());
 await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));
 if(mockTikz)await page.route('**/src/lib/tikz.js',route=>route.fulfill({contentType:'text/javascript',body:`window.__draftCompiles=[];window.TikZ={flushPending:async()=>true};export function cancelTikzJob(){}export function renderTikzCode(el,code,{onSuccess,onError}={}){window.__draftCompiles.push(code);setTimeout(()=>{if(code.includes('INVALID'))onError?.('TeX compile error: invalid command');else{const svg='<svg xmlns="http://www.w3.org/2000/svg" class="tikz-svg" viewBox="0 0 120 30"><text x="0" y="15">'+code+'</text></svg>';if(onSuccess)onSuccess(svg);else el.innerHTML=svg;}},code.includes('slow')?900:30);}`}));
 await page.route('**/__booklet/projects',route=>route.fulfill({json:[{id:record.id,title:record.title,sections:1,revision:record.revision}]}));
 await page.route('**/__booklet/projects/studio-test',async route=>{if(route.request().method()==='PUT'){const body=route.request().postDataJSON();if(body.expectedRevision!==record.revision){await route.fulfill({status:409,json:{error:'Another session saved this project.'}});return;}writes.push(body.project);record={...body.project,revision:record.revision+1};}await route.fulfill({json:record});});
}
await installRoutes(page);
async function focused(p){const open=p.getByRole('button',{name:'Open focused editor',exact:true});if(await open.isVisible())await open.click();}

try{
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project=studio-test',{waitUntil:'networkidle'});
 await page.locator('.project-canvas [data-edit-root="theory"][data-edit-path="/content"] .clickable').click();await focused(page);
 await page.locator('.focused-editor maths-editor .editor-surface').waitFor();
 const upload={name:'draft-image.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0uoAAAAASUVORK5CYII=','base64')};
 await page.locator('.focused-editor maths-editor .me-toolbar input[type=file]').setInputFiles(upload);await page.locator('.focused-editor .me-content [data-type="inline-image"]').waitFor();assert.equal(writes.length,0);await page.locator('.focused-editor').getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(typeof record.sections[0].blocks[0].content,'string');
 await page.locator('.project-canvas [data-edit-root="theory"][data-edit-path="/content"] .clickable').first().click();await focused(page);await page.locator('.focused-editor maths-editor .me-toolbar input[type=file]').setInputFiles(upload);await page.locator('.focused-editor .me-content [data-type="inline-image"]').waitFor();

 await page.locator('.focused-editor maths-editor').getByText('Insert',{exact:true}).click();
 await page.locator('.focused-editor maths-editor').getByRole('button',{name:'Table',exact:true}).click();
 assert.equal(await page.locator('.focused-editor maths-editor table').count(),1);
 await page.locator('.focused-editor .me-content td p').first().click();await page.getByText('Table properties',{exact:true}).click();const column=page.getByLabel('Column width (mm)',{exact:true});await column.fill('30');assert.equal(await column.evaluate(e=>e===document.activeElement),true);await column.press('Enter');await page.getByText('Table properties',{exact:true}).click();const draftHistory=await page.locator('.focused-editor maths-editor').evaluate(e=>e.documentController.history.length);const boundary=page.locator('.focused-editor').getByRole('separator',{name:'Resize boundary after column 1',exact:true});const boundaryBox=await boundary.boundingBox();await page.mouse.move(boundaryBox.x+boundaryBox.width/2,boundaryBox.y+5);await page.mouse.down();await page.mouse.move(boundaryBox.x+15,boundaryBox.y+5,{steps:5});await page.mouse.up();assert.equal(await page.locator('.focused-editor maths-editor').evaluate(e=>e.documentController.history.length),draftHistory+1);
 await page.getByText('Table properties',{exact:true}).click();await page.locator('.focused-editor').getByRole('button',{name:'Merge right',exact:true}).click();await page.locator('.focused-editor').getByRole('button',{name:'Split cell',exact:true}).click();assert.equal(await page.locator('.focused-editor .me-content td').count(),4);

 await page.locator('.focused-editor').getByRole('button',{name:'Save',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 assert.equal(record.sections[0].blocks[0].content.format,'maths-editor-document-v1');
 assert.ok(record.sections[0].blocks[0].content.blocks.some(b=>b.type==='table'));
 await page.reload({waitUntil:'networkidle'});
 assert.equal(await page.locator('.project-canvas .document-content table').count(),1);
 await page.getByRole('button',{name:/^Review/}).click();
 assert.equal(await page.getByRole('button',{name:'Proposals',exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Approvals',exact:true}).count(),0);
 await page.getByLabel('Teaching atom',{exact:true}).fill('Read the example');
 await page.getByLabel('Rationale',{exact:true}).fill('Manual mapping check');
 await page.getByRole('button',{name:'Save mapping',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 assert.equal(record.studio.atoms.theory.title,'Read the example');
 await page.getByRole('button',{name:'Undo',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 assert.notEqual(record.studio.atoms.theory?.title,'Read the example');
 await page.getByRole('button',{name:'Diagrams',exact:true}).click();
 // Independent diagram drafts, deterministic stale completions, errors and width-only updates.
 await page.getByRole('button',{name:'Edit diagram: student',exact:true}).click();
 const drafts=page.locator('.diagram-draft');await drafts.first().locator('.draft-status').filter({hasText:'Current draft preview'}).waitFor();
 const code=drafts.first().getByLabel('TikZ code',{exact:true});
 await code.fill('slow old diagram');await page.waitForFunction(()=>window.__draftCompiles.some(x=>x==='slow old diagram'));
 await code.fill('new valid diagram');await drafts.first().getByText('Current draft preview',{exact:true}).waitFor();
 await page.waitForTimeout(850);assert.match(await drafts.first().locator('.tikz-wrap').innerHTML(),/new valid diagram/);assert.doesNotMatch(await drafts.first().locator('.tikz-wrap').innerHTML(),/slow old/);
 await code.fill('INVALID');await drafts.first().getByRole('alert').waitFor();assert.match(await drafts.first().locator('.tikz-wrap').innerHTML(),/new valid diagram/);assert.match(await drafts.first().locator('.draft-status').textContent(),/Previous successful/);
 await code.fill('recovered diagram');await drafts.first().getByText('Current draft preview',{exact:true}).waitFor();
 const count=await page.evaluate(()=>window.__draftCompiles.length);await drafts.first().getByLabel('Diagram width (mm)').fill('60');await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.__draftCompiles.length),count);
 await page.locator('.focused-editor').getByRole('button',{name:'Save',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');assert.equal(record.sections[0].blocks[0].diagrams[0].code,'recovered diagram');assert.equal(record.studio.approvals,undefined);assert.equal(record.studio.proposals,undefined);
 await page.getByRole('button',{name:'Edit diagram: answer',exact:true}).click();await drafts.first().getByLabel('TikZ code',{exact:true}).fill('answer changed');await page.locator('.focused-editor').getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Edit diagram: answer',exact:true}).click();assert.equal(await drafts.first().getByLabel('TikZ code',{exact:true}).inputValue(),'answer initial');await page.locator('.focused-editor').getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Edit diagram: teaching',exact:true}).click();await drafts.first().getByLabel('TikZ code',{exact:true}).fill('teaching changed');await drafts.first().getByText('Current draft preview',{exact:true}).waitFor();await page.locator('.focused-editor').getByRole('button',{name:'Save',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 // Two actual browser sessions share a revision-enforcing mocked server.
 const other=await browser.newPage({viewport:{width:1800,height:1200}});await installRoutes(other);await other.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project=studio-test',{waitUntil:'networkidle'});
 await other.getByText('Project',{exact:true}).click();await other.getByRole('button',{name:'Project details',exact:true}).click();
 await other.locator('.project-inspector').getByLabel('Title',{exact:true}).fill('Remote title');await other.locator('.project-inspector').getByLabel('Title',{exact:true}).press('Tab');await other.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 await page.getByText('Project',{exact:true}).click();await page.getByRole('button',{name:'Project details',exact:true}).click();
 await page.getByLabel('Subtitle',{exact:true}).fill('Local subtitle');await page.getByLabel('Subtitle',{exact:true}).press('Tab');await page.getByRole('button',{name:'Load latest and merge',exact:true}).waitFor();assert.equal(record.subtitle,'');
 await page.getByRole('button',{name:'Load latest and merge',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');assert.equal(record.title,'Remote title');assert.equal(record.subtitle,'Local subtitle');assert.equal(record.sections[0].blocks[0].diagrams[2].code,'teaching changed');
 await other.reload({waitUntil:'networkidle'});await other.locator('.project-inspector').getByLabel('Title',{exact:true}).fill('Remote overlap');await other.locator('.project-inspector').getByLabel('Title',{exact:true}).press('Tab');await other.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 await page.locator('.project-inspector').getByLabel('Title',{exact:true}).fill('Local overlap');await page.locator('.project-inspector').getByLabel('Title',{exact:true}).press('Tab');await page.getByRole('button',{name:'Load latest and merge',exact:true}).click();await page.getByLabel('Resolve /title',{exact:true}).waitFor();assert.equal(record.title,'Remote overlap');await page.getByLabel('Resolve /title',{exact:true}).selectOption('local');await page.getByRole('button',{name:'Save resolved merge',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');assert.equal(record.title,'Local overlap');assert.equal(record.studio.approvals,undefined);await other.close();

 await page.getByRole('button',{name:'Close panel',exact:true}).click();await page.getByText('Tools',{exact:true}).click();await page.getByRole('button',{name:'Assembly',exact:true}).click();

 await page.getByRole('button',{name:'Load MathsMap questions',exact:true}).click();await page.getByRole('button',{name:'Load MathsMap questions',exact:true}).waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.assembly-panel button')].find(b=>b.textContent==='Load MathsMap questions')?.disabled===false);
 await page.getByRole('button',{name:'Preview sequence and gaps',exact:true}).click();await page.getByRole('heading',{name:'Sequence preview',exact:true}).waitFor();
 assert.ok(await page.locator('.assembly-panel .matrix tbody tr').count()>=3);assert.match(await page.locator('.assembly-panel ol').textContent(),/Theory.*Guided.*Blocked Foundation.*Cumulative interleaved/s);
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('.assembly-panel').isVisible(),false);assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).colorScheme),'light');await page.emulateMedia({media:'screen'});
 await page.evaluate(()=>{window.__printCheck=[];window.TikZ.flushPending=async root=>{window.__printCheck.push(root.classList.contains('project-print')?'diagrams':'wrong-root');return true;};window.print=()=>window.__printCheck.push('print');});
 await page.getByRole('button',{name:'Back to booklet',exact:true}).click();await page.getByRole('button',{name:'PDF',exact:true}).click();
 await page.getByRole('button',{name:'Print / save PDF',exact:true}).click();await page.waitForFunction(()=>window.__printCheck.includes('print'));assert.deepEqual(await page.evaluate(()=>window.__printCheck),['diagrams','print']);
 fs.mkdirSync('tmp/studio-verification',{recursive:true});await page.screenshot({path:'tmp/studio-verification/workspace.png',fullPage:true});assert.deepEqual(errors,[]);

 // Responsive workspace and modal checks use the same intercepted fixture API.
 await page.waitForTimeout(650);await page.close();
 const savedRecord=structuredClone(record);record.source={runId:'layout-fixture'};record.sections[0].sourcePageNumber=1;record.sections[0].blocks.push({id:'break-a',type:'page-break'},{id:'break-b',type:'page-break'},{id:'after-empty',type:'rich-text',content:'After an empty page.'});record.sections.push({id:'second',title:'Second page',sourcePageNumber:2,blocks:[{id:'second-text',type:'rich-text',content:'Second page content.'}]});
 const responsive=await browser.newPage();await installRoutes(responsive);responsive.on('pageerror',e=>errors.push(e.message));await responsive.route('**/files/evidence/pages/**',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123"><rect width="794" height="1123" fill="white"/><text x="60" y="100" font-size="28">Original source fixture</text></svg>'}));
 await responsive.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project=studio-test',{waitUntil:'networkidle'});
 const beforeLayoutWrites=writes.length;
 for(const [width,height] of [[1920,1080],[1440,900],[1280,800],[1024,768],[390,844]]){
   console.log("Responsive",width,height);await responsive.setViewportSize({width,height});await responsive.waitForTimeout(100);
   await responsive.getByRole('button',{name:'Toggle page navigation',exact:true}).click();await responsive.getByRole('button',{name:'Toggle page navigation',exact:true}).click();
   if(width<1100&&await responsive.locator('.project-outline').isVisible())await responsive.getByRole('button',{name:'Close page navigation',exact:true}).click();
   assert.ok(await responsive.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'shell overflow '+width);
   await responsive.getByRole('button',{name:'Next page',exact:true}).click();assert.match(await responsive.locator('.page-controls').textContent(),/Page 2/);await responsive.getByRole('button',{name:'Previous page',exact:true}).click();
   const scrollBefore=await responsive.locator('.project-canvas').evaluate(e=>{e.scrollTop=100;return e.scrollTop;});await responsive.getByRole('button',{name:'Compare source',exact:true}).click();assert.equal(await responsive.locator('.source-evidence').isVisible(),true);assert.equal(await responsive.locator('.project-outline').isVisible(),false);await responsive.getByLabel('Source zoom',{exact:true}).selectOption('2');await responsive.getByRole('button',{name:'Exit comparison',exact:true}).click();await responsive.waitForTimeout(100);assert.ok(Math.abs(await responsive.locator('.project-canvas').evaluate(e=>e.scrollTop)-scrollBefore)<=1,'comparison restores scroll');
   await responsive.getByLabel('Booklet zoom',{exact:true}).selectOption('page');await responsive.getByLabel('Booklet zoom',{exact:true}).selectOption('1');await responsive.getByRole('button',{name:'Zoom in',exact:true}).click();await responsive.getByLabel('Booklet zoom',{exact:true}).selectOption('width');
   await responsive.getByRole('button',{name:/^Review/}).click();const dock=await responsive.locator('.workspace-panel').evaluate(e=>e.classList.contains('docked'));if(dock)assert.ok((await responsive.locator('.project-canvas').boundingBox()).width>=794);await responsive.getByRole('button',{name:'Close panel',exact:true}).click();
   const origin=responsive.locator('.project-canvas [data-edit-root="theory"][data-edit-path="/content"] .clickable').first();await origin.focus();await responsive.keyboard.press('Enter');await focused(responsive);await responsive.locator('.focused-editor maths-editor .me-content').waitFor();assert.equal(await responsive.locator('.focused-editor math-field').first().evaluate(e=>getComputedStyle(e).color),'rgb(36, 54, 75)');
   const modal=responsive.locator('.focused-editor');assert.equal(await modal.evaluate(e=>e.matches(':modal')),true);assert.equal(await modal.evaluate(e=>getComputedStyle(e).transform),'none');
   await modal.locator('maths-editor').evaluate(e=>window.__sameDraft=e);await modal.locator('.me-content p').first().click();await responsive.keyboard.press('End');await responsive.keyboard.type(' local draft');
   if(width>=1000){const divider=modal.getByRole('separator',{name:'Resize editor and preview',exact:true});await divider.focus();await divider.press('ArrowLeft');assert.equal(await divider.getAttribute('aria-valuenow'),'49');await divider.press('Shift+ArrowRight');assert.equal(await divider.getAttribute('aria-valuenow'),'54');}
   else{await modal.getByRole('tab',{name:'Preview',exact:true}).click();await modal.getByRole('tab',{name:'Source',exact:true}).click();await modal.getByRole('tab',{name:'Rendered preview',exact:true}).click();await modal.getByRole('tab',{name:'Edit',exact:true}).click();}
   await responsive.setViewportSize({width:width>=1000?390:1440,height});await responsive.setViewportSize({width,height});assert.equal(await modal.locator('maths-editor').evaluate(e=>e===window.__sameDraft),true);
   const saveBox=await modal.getByRole('button',{name:'Save',exact:true}).boundingBox(),cancelBox=await modal.getByRole('button',{name:'Cancel',exact:true}).boundingBox();assert.ok(saveBox.y+saveBox.height<=height&&cancelBox.y+cancelBox.height<=height);assert.ok(saveBox.height>=(width<600?44:36));
   await modal.getByRole('button',{name:'Close editor',exact:true}).focus();await responsive.keyboard.press('Tab');assert.equal(await responsive.evaluate(()=>!!document.activeElement.closest('.focused-editor')),true);
   await responsive.screenshot({path:'tmp/ux-verification/editor-'+width+'.png'});
   await responsive.keyboard.press('Escape');await modal.getByRole('button',{name:'Keep editing',exact:true}).click();assert.equal(await modal.locator('maths-editor').evaluate(e=>e===window.__sameDraft),true);await responsive.keyboard.press('Escape');await modal.getByRole('button',{name:'Discard',exact:true}).click();assert.equal(await origin.evaluate(e=>e===document.activeElement),true);
   await responsive.screenshot({path:'tmp/ux-verification/workspace-'+width+'.png'});
 }
 // Effective CSS viewport at 200% browser zoom on a 1440 x 900 display.
 await responsive.setViewportSize({width:720,height:450});const zoomSession=await responsive.context().newCDPSession(responsive);await zoomSession.send('Emulation.setDeviceMetricsOverride',{width:720,height:450,deviceScaleFactor:2,mobile:false,screenWidth:1440,screenHeight:900});await responsive.locator('.project-canvas .clickable').first().click();await focused(responsive);await responsive.locator('.focused-editor maths-editor').waitFor();assert.ok((await responsive.locator('.focused-editor').getByRole('button',{name:'Save',exact:true}).boundingBox()).y<450);await responsive.screenshot({path:'tmp/ux-verification/editor-200-percent.png'});await responsive.locator('.focused-editor').getByRole('button',{name:'Cancel',exact:true}).click();
 await zoomSession.send('Emulation.clearDeviceMetricsOverride');await responsive.setViewportSize({width:1440,height:900});await responsive.evaluate(()=>document.documentElement.setAttribute('data-theme','light'));await responsive.screenshot({path:'tmp/ux-verification/workspace-light.png'});assert.equal(writes.length,beforeLayoutWrites,'layout and cancelled drafts never save or approve');await responsive.close();record=savedRecord;
 assert.deepEqual(errors,[]);
 // Real engine, real source diagrams, with all project writes still intercepted.
 const pilot=JSON.parse(fs.readFileSync('booklets/archives/2026-09-06-linear-pilots/projects/linear-relationships-pilot-v1.json'));
 const realDiagrams=[7,9,16,28].map(sourcePage=>{const section=pilot.sections.find(s=>s.sourcePageNumber===sourcePage);let diagram;const find=n=>{if(!n||typeof n!=='object'||diagram)return;if(n.format==='tikz'&&n.code){diagram=structuredClone(n);return;}Object.values(n).forEach(v=>Array.isArray(v)?v.forEach(find):find(v));};find(section);assert.ok(diagram,'source '+sourcePage+' diagram');return {...diagram,id:'source-'+sourcePage};});
 record.sections[0].blocks[0].diagrams=realDiagrams;record.revision++;
 const real=await browser.newPage({viewport:{width:1800,height:1200}});await installRoutes(real,false);await real.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project=studio-test',{waitUntil:'networkidle'});await real.getByRole('button',{name:/^Review/}).click();
 await real.getByRole('button',{name:'Diagrams',exact:true}).click();
 for(let i=0;i<4;i++){
   await real.getByRole('button',{name:/^Edit diagram:/}).nth(i).click();const draft=real.locator('.diagram-draft'),source=realDiagrams[i].code;await draft.getByText('Current draft preview',{exact:true}).waitFor({timeout:180000});const previous=await draft.locator('.tikz-wrap').innerHTML();
   await draft.getByLabel('TikZ code',{exact:true}).fill(source+'\n\\invalideditorcommand');await draft.getByRole('alert').waitFor({timeout:120000});assert.equal(await draft.locator('.tikz-wrap').innerHTML(),previous);
   await draft.getByLabel('TikZ code',{exact:true}).fill(source+'\n% current draft');await draft.getByText('Current draft preview',{exact:true}).waitFor({timeout:120000});assert.equal(await draft.locator('.tikz-wrap svg').count(),1);
   await draft.getByLabel('TikZ code',{exact:true}).fill(source);await draft.getByText('Current draft preview',{exact:true}).waitFor({timeout:120000});assert.equal(await draft.locator('.tikz-wrap').innerHTML(),previous);
   await real.locator('.focused-editor').getByRole('button',{name:'Cancel',exact:true}).click();
 }
 await real.screenshot({path:'tmp/studio-verification/real-tikz-drafts.png',fullPage:true});await real.close();


 // Layout controls use a fresh pilot copy, intercepted persistence and the same focused editor.
 const layoutPilot=JSON.parse(fs.readFileSync('booklets/archives/2026-09-06-linear-pilots/projects/linear-relationships-pilot-v1.json','utf8'));
 fs.mkdirSync('tmp/layout-1.3.0',{recursive:true});fs.writeFileSync('tmp/teaching-controls/pilot-verification.json',JSON.stringify(layoutPilot,null,2));
 record=structuredClone(layoutPilot);record.id='studio-test';record.title='Layout verification fixture';record.sections=record.sections.filter(s=>[1,7,9,13,29,33].includes(s.sourcePageNumber));
 const controls=await browser.newPage({viewport:{width:1920,height:1080}});await installRoutes(controls);controls.on('pageerror',e=>errors.push(e.message));
 await controls.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project=studio-test',{waitUntil:'networkidle'});
 await controls.getByRole('button',{name:'Next page',exact:true}).click();
 const initialWrites=writes.length;
 await controls.getByRole('button',{name:'Short answers',exact:true}).click();assert.equal(await controls.getByRole('button',{name:'Short answers',exact:true}).getAttribute('aria-pressed'),'true');await controls.getByRole('button',{name:'Worked solutions',exact:true}).click();await controls.getByRole('button',{name:'Questions',exact:true}).click();await controls.waitForTimeout(600);assert.equal(writes.length,initialWrites);
 await controls.getByRole('button',{name:'PDF',exact:true}).click();const priorExport=await controls.getByLabel('Practice answers',{exact:true}).inputValue();await controls.getByRole('button',{name:'Short answers',exact:true}).click();assert.equal(await controls.getByLabel('Practice answers',{exact:true}).inputValue(),priorExport);await controls.getByRole('button',{name:'Use current view',exact:true}).click();assert.equal(await controls.getByLabel('Practice answers',{exact:true}).inputValue(),'short');await controls.getByRole('button',{name:'Close panel',exact:true}).click();await controls.getByRole('button',{name:'Questions',exact:true}).click();
 const openLayout=async()=>{await controls.locator('.project-canvas [data-edit-root="page-7-q4-node"][data-edit-path="/prompt"] .clickable').click();await focused(controls);await controls.locator('.focused-editor maths-editor').waitFor();};
 await openLayout();let modal=controls.locator('.focused-editor');
 await modal.getByLabel('Text column width (mm)',{exact:true}).fill('65');await modal.getByLabel('Text column width (mm)',{exact:true}).press('Enter');await modal.getByLabel('Diagram sizing',{exact:true}).selectOption('fit');
 await modal.locator('.preview-pane [data-diagram-id] svg').first().waitFor();
 const promptBounds=await modal.locator('.preview-pane [data-node-id="page-7-q4-node"] > .question-line').boundingBox();assert.ok(Math.abs(promptBounds.width-65*96/25.4)<2,JSON.stringify(promptBounds));
 const layoutDivider=modal.getByRole('separator',{name:'Resize text and diagram columns',exact:true});await layoutDivider.press('ArrowRight');assert.equal(Number(await layoutDivider.getAttribute('aria-valuenow')),66);await modal.getByRole('button',{name:'Undo layout',exact:true}).click();assert.equal(Number(await layoutDivider.getAttribute('aria-valuenow')),65);
 await modal.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(writes.length,initialWrites);
 await openLayout();modal=controls.locator('.focused-editor');await modal.getByLabel('Text column width (mm)',{exact:true}).fill('65');await modal.getByLabel('Text column width (mm)',{exact:true}).press('Enter');await modal.getByLabel('Diagram sizing',{exact:true}).selectOption('fit');await modal.getByRole('button',{name:'Save',exact:true}).click();await controls.waitForTimeout(700);assert.equal(record.settings.layoutOverrides.blockLayouts['page-7-q4-node'].textWidthMm,65);assert.equal(record.settings.layoutOverrides.blockLayouts['page-7-q4-node'].diagramSizing,'fit');
 await controls.reload({waitUntil:'networkidle'});await controls.getByRole('button',{name:'Next page',exact:true}).click();await openLayout();assert.equal(await controls.getByLabel('Text column width (mm)',{exact:true}).inputValue(),'65.0');await controls.screenshot({path:'tmp/teaching-controls/layout-editor.png'});await controls.locator('.focused-editor').getByRole('button',{name:'Cancel',exact:true}).click();
 // Prompt wrapper indentation can now be set independently of paragraph indentation.
 await controls.getByRole('button',{name:'Next page',exact:true}).click();await controls.getByRole('button',{name:'Next page',exact:true}).click();
 await controls.locator('.project-canvas [data-edit-root="page-13-example-1"][data-edit-path="/prompt"] .clickable').click();await focused(controls);await controls.getByLabel('Block inset (mm)',{exact:true}).fill('0');await controls.getByLabel('Block inset (mm)',{exact:true}).press('Enter');await controls.locator('.focused-editor').getByRole('button',{name:'Save',exact:true}).click();await controls.waitForTimeout(700);assert.equal(record.settings.layoutOverrides.blockLayouts['page-13-example-1'].insetMm,0);

 const solution=controls.locator('.project-canvas [data-example-id="page-13-example-1"] .theory-solution');const example=controls.locator('.project-canvas [data-example-id="page-13-example-1"]');const shownBounds=await example.boundingBox(),shownHeight=(await solution.boundingBox()).height;const theoryWrites=writes.length;
 await controls.getByRole('button',{name:'PDF',exact:true}).click();await controls.getByLabel('Show theory solutions',{exact:true}).uncheck();await controls.waitForTimeout(100);assert.equal(await solution.evaluate(e=>getComputedStyle(e).visibility),'hidden');assert.equal(await solution.getAttribute('inert'),'');assert.ok(Math.abs((await example.boundingBox()).height-shownBounds.height)<1);assert.ok(Math.abs((await solution.boundingBox()).height-shownHeight)<1);
 await controls.getByLabel('Show theory solutions',{exact:true}).check();await controls.getByRole('button',{name:'Close panel',exact:true}).click();assert.equal(writes.length,theoryWrites);
 // Teaching answers are independent of the practice canvas mode and do not autosave.
 await controls.getByRole('button',{name:'PDF',exact:true}).click();
 const reviewAnswer=controls.locator('.project-canvas [data-question-id="page-13-review"]');
 const guidedAnswer=controls.locator('.project-canvas [data-question-id="page-13-guided"]');
 assert.equal(await reviewAnswer.evaluate(e=>e.classList.contains('answer-key')),false);
 await controls.getByLabel('Show review answers',{exact:true}).check();assert.equal(await reviewAnswer.evaluate(e=>e.classList.contains('answer-key')),true);assert.equal(await guidedAnswer.evaluate(e=>e.classList.contains('answer-key')),false);
 await controls.getByLabel('Show guided practice answers',{exact:true}).check();assert.equal(await guidedAnswer.evaluate(e=>e.classList.contains('answer-key')),true);
 await controls.getByLabel('Show review answers',{exact:true}).uncheck();assert.equal(await reviewAnswer.evaluate(e=>e.classList.contains('answer-key')),false);
 await controls.getByLabel('Practice answers',{exact:true}).selectOption('short');
 await controls.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
 await controls.locator('.project-print .print-page').first().waitFor({state:'attached'});
 assert.equal(await controls.locator('.project-print .theory-section').count(),0);assert.equal(await controls.locator('.project-print .booklet-cover').count(),0);
 assert.deepEqual(await controls.locator('.project-print .practice-question').evaluateAll(es=>es.map(e=>e.dataset.questionId)),['page-7-q4','page-7-q5','page-9-q8','page-9-q9','page-9-q10','page-33-q5','page-33-q6','page-33-q7']);
 await controls.getByRole('button',{name:'Close panel',exact:true}).click();await controls.getByRole('button',{name:'Next page',exact:true}).click();
 await controls.getByRole('button',{name:'PDF',exact:true}).click();const identifyAnswer=controls.locator('.project-canvas [data-question-id="page-29-q1"]');
 assert.equal(await identifyAnswer.evaluate(e=>e.classList.contains('answer-key')),false);await controls.getByLabel('Show identify answers',{exact:true}).check();assert.equal(await identifyAnswer.evaluate(e=>e.classList.contains('answer-key')),true);await controls.getByLabel('Show identify answers',{exact:true}).uncheck();
 await controls.getByRole('button',{name:'Close panel',exact:true}).click();assert.equal(writes.length,theoryWrites);
 // The bold activity heading opens the same Save/Cancel draft as body content.
 const activityHeading=controls.locator('.project-canvas [data-edit-root="page-29-q1"][data-edit-path="/sourceAtom/label"] .clickable');
 await activityHeading.click();await focused(controls);await controls.locator('.focused-editor maths-editor').evaluate(async e=>{const {fromSource}=await import('/libs/maths-editor/document-model.mjs');e.document=fromSource('Prove');e.dispatchEvent(new CustomEvent('document-change',{detail:{document:e.document},bubbles:true}));});
 await controls.locator('.focused-editor').getByRole('button',{name:'Save',exact:true}).click();await controls.waitForTimeout(700);assert.ok(JSON.stringify(record.sections.find(s=>s.sourcePageNumber===29).blocks.find(b=>b.id==='page-29-q1').sourceAtom.label).includes('Prove'));
 // New callout heading and activity block are discoverable and editable.
 await controls.getByRole('button',{name:'Add page',exact:true}).click();await controls.waitForTimeout(700);
 const authoringSection=record.sections.find(s=>s.title==='New section');
 await controls.locator('.project-outline').getByText('Add content',{exact:true}).click();
 await controls.getByLabel('Block type',{exact:true}).selectOption('callout');await controls.getByRole('button',{name:'Add block',exact:true}).click();await controls.waitForTimeout(700);
 const newCallout=record.sections.find(s=>s.id===authoringSection.id).blocks.at(-1);assert.equal(newCallout.label,'Theory');
 await controls.locator('.project-canvas [data-edit-root="'+newCallout.id+'"][data-edit-path="/label"] .clickable').click();await focused(controls);await controls.locator('.focused-editor maths-editor').evaluate(async e=>{const {fromSource}=await import('/libs/maths-editor/document-model.mjs');e.document=fromSource('Useful result');e.dispatchEvent(new CustomEvent('document-change',{detail:{document:e.document},bubbles:true}));});await controls.locator('.focused-editor').getByRole('button',{name:'Save',exact:true}).click();await controls.waitForTimeout(700);
 assert.ok(JSON.stringify(record.sections.find(s=>s.id===authoringSection.id).blocks.at(-1).label).includes('Useful result'));
 await controls.getByLabel('Block type',{exact:true}).selectOption('activity');await controls.getByRole('button',{name:'Add block',exact:true}).click();await controls.waitForTimeout(700);assert.equal(record.sections.find(s=>s.id===authoringSection.id).blocks.at(-1).sourceAtom.kind,'identify');
 await controls.reload({waitUntil:'networkidle'});assert.ok(JSON.stringify(record).includes('Useful result'));
 fs.writeFileSync('tmp/teaching-controls/edited-fixture.json',JSON.stringify(record,null,2));
 for(const [width,height]of [[1920,1080],[1440,900],[1280,800],[1024,768],[390,844]]){await controls.setViewportSize({width,height});if(width<1100&&await controls.locator('.project-outline').isVisible())await controls.getByRole('button',{name:'Close page navigation',exact:true}).click();assert.ok(await controls.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await controls.getByRole('button',{name:'Questions',exact:true}).isVisible());}
 assert.deepEqual(errors,[]);await controls.close();
 console.log('Structured editor → project save/reload → direct mapping save → undo passed. All project writes were intercepted.');
}catch(error){console.error({browserErrors:errors,writes,record,notice:page.isClosed()?[]:await page.locator('.project-notice').allTextContents()});throw error;}finally{await browser.close();}
