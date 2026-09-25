import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createEditableProject,createProjectBlock} from '../../src/lib/editable-booklet-model.js';
import {createBookletProject,listBookletProjects,openBookletProject,loadBookletProject,saveBookletProject,duplicateBookletProject,getProjectBankSync,updateProjectLibrary} from './project-studio-server.mjs';
import {validateCaptureBase} from './local-preview-url.mjs';

const base=validateCaptureBase(process.argv[2]??'http://localhost:5173');
const root=await fs.mkdtemp(path.join(os.tmpdir(),'booklet-library-ui-'));
const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank')};
const out=path.resolve('.booklet-work/library-review');await fs.mkdir(out,{recursive:true});
const original=createEditableProject({id:'library-master',title:'Library Algebra'});
original.library={category:'master',courseId:'s4'};
const question=createProjectBlock('question');question.content.prompt='Calculate $2+3$.';question.content.answer={short:'$5$',worked:'$2+3=5$',solutionDiagrams:[]};
original.sections[0].blocks=[question];
await createBookletProject(original,options);
await createBookletProject({id:'library-review',sections:original.sections,title:'Import review example',library:{category:'import-review'}},options);
let browser;
try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[],libraryPatches=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url()),suffix=url.pathname.replace('/__booklet/projects','');
 try{
   let result;
   if(url.pathname==='/__booklet/projects')result=req.method()==='POST'?await createBookletProject(req.postDataJSON(),options):await listBookletProjects({...options,summary:true});
   else if(url.pathname.startsWith('/__booklet/projects/')){
     const [id,action]=suffix.slice(1).split('/');
     if(action==='open')result=await openBookletProject(id,options);
     else if(action==='bank-sync')result=await getProjectBankSync(id,options);
     else if(action==='duplicate')result=await duplicateBookletProject(id,{...options,...req.postDataJSON()});
     else if(action==='library'&&req.method()==='PATCH'){const body=req.postDataJSON();libraryPatches.push(id);result=await updateProjectLibrary(id,body.library,{...options,expectedRevision:body.expectedRevision});}
     else if(req.method()==='PUT'){const body=req.postDataJSON();result=await saveBookletProject(body.project,{...options,expectedRevision:body.expectedRevision});}
     else if(req.method()==='GET')result=await loadBookletProject(id,options);
     else throw Error('Unexpected mutation');
   }else if(req.method()==='GET')return route.continue();
   else throw Error('Unexpected non-project mutation');
   await route.fulfill({json:result});
 }catch(e){await route.fulfill({status:e.statusCode??500,json:{error:e.message}});}
});
const fileMenu=async()=>{const summary=page.locator('.project-toolbar summary').filter({hasText:/^File$/});if(!await summary.evaluate(el=>el.parentElement.open))await summary.click();};
const ready=async()=>{await page.locator('.flow-document[data-pagination-state="ready"]').waitFor({timeout:60000});await page.getByRole('button',{name:'Open booklet',exact:true}).waitFor();};
const saved=async()=>page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
try{
 await page.goto(base+'/#/booklet?stage=projects&project=library-master');await ready();
 const picker=page.getByRole('button',{name:'Open booklet',exact:true});await picker.click();
 await page.getByLabel('Search projects',{exact:true}).fill('stage 4');
 assert.equal(await page.locator('#project-library-menu .results button').count(),1);
 await page.getByLabel('Search projects',{exact:true}).press('ArrowDown');
 assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Library Algebra');
 await page.keyboard.press('Escape');assert.equal(await picker.getAttribute('aria-expanded'),'false');
 await fileMenu();await page.getByRole('button',{name:'Create class booklet',exact:true}).click();
 await page.getByRole('dialog').getByLabel('Class label',{exact:true}).fill('8MAT6');
 assert.equal(await page.getByLabel('Booklet title',{exact:true}).inputValue(),'Library Algebra for 8MAT6');
 await page.getByRole('dialog').getByRole('button',{name:'Create class booklet',exact:true}).click();await ready();
 await page.waitForFunction(()=>document.querySelector('.picker-trigger')?.textContent.includes('for 8MAT6'));
 const classId=(await listBookletProjects(options)).find(p=>p.library.category==='class').id;
 assert.equal((await loadBookletProject(classId,options)).library.category,'class');
 await fileMenu();await page.getByRole('button',{name:'Project details',exact:true}).click();
 await page.getByLabel('Home course',{exact:true}).selectOption('s5-core');await saved();
 assert.ok(libraryPatches.includes(classId),'Changing home course should use the library-only PATCH endpoint');
 await page.goto(base+'/#/booklet?stage=projects&project='+classId);await page.reload();await ready();assert.equal((await loadBookletProject(classId,options)).library.courseId,'s5-core');
 await fileMenu();await page.getByRole('button',{name:'Archive booklet',exact:true}).click();await saved();
 await page.waitForFunction(()=>document.querySelector('.workspace-toast')?.textContent.includes('archived'));
 await picker.click();await page.getByLabel('Search projects',{exact:true}).fill('8MAT6');
 assert.equal(await page.locator('#project-library-menu .results button').count(),0);
 await page.getByLabel('Archived projects',{exact:true}).check();
 await page.locator('#project-library-menu .results button').click();await ready();
 await fileMenu();await page.getByRole('button',{name:'Restore booklet',exact:true}).click();await saved();
 await page.waitForFunction(()=>document.querySelector('.workspace-toast')?.textContent.includes('restored'));
 assert.equal((await loadBookletProject(classId,options)).library.archivedAt,null);
 await picker.click();await page.getByLabel('Archived projects',{exact:true}).uncheck();await page.getByLabel('Search projects',{exact:true}).fill('');
 await page.screenshot({path:path.join(out,'desktop-picker.png')});
 await page.setViewportSize({width:390,height:844});
 const bounds=await page.locator('#project-library-menu').boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=391,JSON.stringify(bounds));
 await page.screenshot({path:path.join(out,'mobile-picker.png')});
 await page.getByLabel('Search projects',{exact:true}).fill('no matching title');await page.getByText('No projects match your search.').waitFor();
 await page.keyboard.press('Escape');await page.setViewportSize({width:1440,height:1050});
 await page.screenshot({path:path.join(out,'class-preview.png')});
 await page.emulateMedia({media:'print'});assert.equal(await picker.isVisible(),false);await page.emulateMedia({media:'screen'});
 await fileMenu();await page.getByRole('button',{name:'New booklet',exact:true}).click();
 assert.equal(await page.getByRole('dialog').getByLabel('Project category',{exact:true}).inputValue(),'master');
 await page.getByRole('dialog').getByLabel('Project category',{exact:true}).selectOption('import-review');
 await page.getByLabel('Booklet title',{exact:true}).fill('New review');await page.getByRole('dialog').getByRole('button',{name:'Create booklet',exact:true}).click();await ready();
 assert.equal((await listBookletProjects(options)).find(p=>p.title==='New review').library.category,'import-review');
 assert.deepEqual(errors,[]);console.log('Passed: keyboard/search, class copy, details/save/reopen, archive/restore, narrow picker, preview/print visibility and new categories.');
}catch(e){await page.screenshot({path:path.join(out,'failure.png')});console.error((await page.locator('body').innerText()).slice(-5000));throw e;}
finally{await browser.close();await fs.rm(root,{recursive:true,force:true});}
