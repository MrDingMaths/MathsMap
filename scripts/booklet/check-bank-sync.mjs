// Exercises the real sync/save functions in isolated stores through the browser UI.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject,createProjectBlock} from '../../src/lib/editable-booklet-model.js';
import {createBookletProject,promoteProjectQuestion,duplicateBookletProject,saveBookletProject,loadBookletProject,listBookletProjects,getProjectBankSync,resolveProjectBankSync} from './project-studio-server.mjs';
import {makeBankManifest} from '../../src/lib/practice-question-model.js';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'bank-sync-browser-')),options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank'),moduleRoot:path.join(root,'modules')};
const original=createEditableProject({id:'sync-original',title:'Original booklet'}),block=createProjectBlock('question');block.id='sync-question';block.classification={primarySkillId:'construct-table-of-values'};block.content.prompt='Find $y$ when $x=1$ and $y=2x+1$.';block.content.answer={short:'3',worked:'Original working: $y=3$.',solutionDiagrams:[]};original.sections[0].blocks=[block];
await createBookletProject(original,options);let {project:source,question:bank}=await promoteProjectQuestion(original.id,{blockId:block.id,mode:'create'},options);
const copy=await duplicateBookletProject(source.id,{...options,title:'Class booklet'});
source.sections[0].blocks[0].content.answer.worked='Updated working: $y=2(1)+1=3$.';source=await saveBookletProject(source,{...options,expectedRevision:source.revision});
const bankFile=path.join(options.bankRoot,bank.id+'.json'),readBank=async()=>JSON.parse(await fs.readFile(bankFile,'utf8'));
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1400,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url()),parts=url.pathname.split('/').filter(Boolean),id=parts[2];
 try{
  let result;
  if(parts[1]==='bank'){bank=await readBank();result=parts[2]==='manifest'?makeBankManifest([bank]):bank;}
  else if(parts.length===2)result=await listBookletProjects(options);
  else if(parts[3]==='bank-sync')result=req.method()==='POST'?await resolveProjectBankSync(id,req.postDataJSON(),options):await getProjectBankSync(id,options);
  else if(req.method()==='PUT'){const body=req.postDataJSON();result=await saveBookletProject(body.project,{...options,expectedRevision:body.expectedRevision});}
  else result=await loadBookletProject(id,options);
  await route.fulfill({json:result});
 }catch(e){await route.fulfill({status:e.statusCode??500,json:{error:e.message}});}
});
try{
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project='+copy.id,{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Review updates',exact:true}).click();
 const panel=page.getByRole('region',{name:'Question bank sync'});
 await panel.getByText('Compare question and worked solution',{exact:true}).click();
 await panel.getByText('Original working:',{exact:false}).waitFor();await panel.getByText('Updated working:',{exact:false}).waitFor();
 await panel.getByRole('button',{name:'Use bank version',exact:true}).click();
 await panel.getByText('No bank updates available.',{exact:true}).waitFor();
 assert.equal((await loadBookletProject(copy.id,options)).sections[0].blocks[0].content.answer.worked,source.sections[0].blocks[0].content.answer.worked);
 bank=await readBank();bank.content.answer.worked='Separate bank change';await fs.writeFile(bankFile,JSON.stringify(bank));
 source.sections[0].blocks[0].content.answer.worked='Separate original change';source=await saveBookletProject(source,{...options,expectedRevision:source.revision});
 await page.getByLabel('Open booklet',{exact:true}).selectOption(source.id);
 await page.getByRole('button',{name:'Review updates',exact:true}).click();await panel.getByText('Compare question and worked solution',{exact:true}).click();
 await panel.getByText('Separate bank change',{exact:true}).waitFor();await panel.getByText('Separate original change',{exact:true}).waitFor();
 await page.setViewportSize({width:650,height:900});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await fs.mkdir('output/bank-sync',{recursive:true});await panel.screenshot({path:'output/bank-sync/conflict.png'});
 await panel.getByRole('button',{name:'Use booklet version',exact:true}).click();await panel.getByText('Original questions are synced.',{exact:true}).waitFor();
 assert.equal((await readBank()).content.answer.worked,'Separate original change');assert.deepEqual(errors,[]);
 console.log('PASS: optional copy update, side-by-side comparison, conflict notice, explicit source resolution and mobile panel. User files untouched.');
}finally{await browser.close();await fs.rm(root,{recursive:true,force:true});}
