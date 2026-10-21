// Exercises shared-content decisions through the Studio UI against isolated
// stores: an edit waits for a decision, Apply to all updates the other booklet,
// its open tab picks the update up in place, and its Shared content panel lists
// the pages to check once the page check has run. User files are untouched.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject,createProjectBlock} from '../../src/lib/editable-booklet-model.js';
import {createBookletProject,saveBookletProject,loadBookletProject,listBookletProjects,openBookletProject,getProjectBankSync,getProjectShared,resolveProjectShared} from './project-studio-server.mjs';
import {seedSharedContent,runPageChecks,sharedRootsFor} from './shared-content.mjs';
import {renderPageMaps} from './shared-content-pages.mjs';

const base=(process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173').replace(/\/$/,'');
const root=await fs.mkdtemp(path.join(os.tmpdir(),'shared-content-browser-'));
const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank'),moduleRoot:path.join(root,'modules'),busy:new Set()};
const roots=sharedRootsFor(options.projectRoot);
const TEXT='A map scale such as 1 : 50 000 means that 1 cm on the map represents 50 000 cm, or 500 m, on the ground. To find a real distance, multiply the map distance by the scale factor, then convert to sensible units. Always state the units in your answer, and check that the size of the answer is sensible for the distance between two real places.';
const make=async(id,title,prefix)=>{
 const p=createEditableProject({id,title}),teach=createProjectBlock('rich-text'),q=createProjectBlock('question');
 teach.id=prefix+'-teach';teach.content=TEXT;
 q.id=prefix+'-q1';q.content.id=prefix+'-q1-root';q.classification={primarySkillId:'ratio-real-life-problems'};q.content.prompt='Two towns are 4 cm apart on a map with scale 1 : 50 000. How far apart are they?';q.content.answer={short:'2 km',worked:'$4\\times 50\\,000=200\\,000$ cm $=2$ km',solutionDiagrams:[]};
 if(prefix==='s')q.sourceReview={reuse:{projectId:'shared-ratios',blockId:'r-q1'}};
 p.sections[0].blocks=[teach,q];return createBookletProject(p,options);
};
await make('shared-ratios','Ratios','r');await make('shared-similarity','Similarity','s');
await seedSharedContent({projectRoot:options.projectRoot,...roots,apply:true});
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const context=await browser.newContext({viewport:{width:1400,height:950}}),errors=[];
await context.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url()),parts=url.pathname.split('/').filter(Boolean),id=decodeURIComponent(parts[2]??'');
 try{
  let result;
  if(parts[1]==='bank')result=parts[2]==='manifest'?{format:'mathsmap-practice-bank-v3',version:3,questions:[]}:{};
  else if(parts[1]!=='projects')result=[];
  else if(parts.length===2)result=await listBookletProjects(options);
  else if(parts[3]==='open')result=await openBookletProject(id,options);
  else if(parts[3]==='bank-sync')result=await getProjectBankSync(id,options);
  else if(parts[3]==='shared')result=req.method()==='POST'?await resolveProjectShared(id,req.postDataJSON(),options):await getProjectShared(id,options);
  else if(req.method()==='PUT'){const body=req.postDataJSON();result=await saveBookletProject(body.project,{...options,expectedRevision:body.expectedRevision});}
  else result=await loadBookletProject(id,options);
  await route.fulfill({json:result});
 }catch(e){await route.fulfill({status:e.statusCode??500,json:{error:e.message}});}
});
const requests=[];
const open=async id=>{const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));if(process.env.SHARED_CHECK_DEBUG)page.on('response',async r=>{if(r.url().includes('/shared'))requests.push(id+' '+r.request().method()+' '+r.status()+' '+(await r.text().catch(()=>'')).slice(0,300));});await page.goto(base+'/#/booklet?stage=projects&project='+id,{waitUntil:'domcontentloaded'});await page.locator('.flow-document').waitFor({state:'attached',timeout:180000});return page;};
const focus=page=>page.evaluate(()=>window.dispatchEvent(new Event('focus')));
try{
 const ratios=await open('shared-ratios');
 await ratios.getByText('The selected block is shared',{exact:false}).or(ratios.locator('.flow-document')).first().waitFor();
 // An edit saved in Similarity waits for a decision there.
 const s=await loadBookletProject('shared-similarity',options);s.sections[0].blocks[0].content=TEXT+' Scale factors in similar figures work the same way.';
 await saveBookletProject(s,{...options,expectedRevision:s.revision});
 const similarity=await open('shared-similarity');
 await similarity.getByText('A shared block was changed here.',{exact:false}).waitFor({timeout:60000});
 await similarity.getByRole('button',{name:'Choose all copies or this one'}).click();
 const panel=similarity.getByRole('region',{name:'Shared content'});
 await panel.getByText('Changed here.',{exact:true}).waitFor();
 await panel.getByRole('button',{name:'Apply to all 2 copies'}).click();
 await similarity.getByText('Applied to 1 other booklet.',{exact:false}).waitFor();
 assert.equal((await loadBookletProject('shared-ratios',options)).sections[0].blocks[0].content,TEXT+' Scale factors in similar figures work the same way.');
 // The open Ratios tab, saved and idle, takes the update in place.
 await focus(ratios);
 await ratios.getByText('Updated with shared content changed in another booklet.',{exact:false}).waitFor({timeout:60000});
 await ratios.getByText('Scale factors in similar figures work the same way.',{exact:false}).first().waitFor();
 await ratios.getByRole('button',{name:'Pages to check'}).click();
 const ratiosPanel=ratios.getByRole('region',{name:'Shared content'});
 await ratiosPanel.getByText('Finding the pages that moved',{exact:false}).waitFor();
 // The real page-map renderer, against this Studio.
 const started=Date.now(),run=await runPageChecks('shared-ratios',{checkRoot:roots.checkRoot,base,render:renderPageMaps});
 assert.equal(run.checked.length,1);
 const [check]=(await getProjectShared('shared-ratios',options)).checks;
 assert.equal(check.status,'ready',check.error);
 if(process.env.SHARED_CHECK_DEBUG)console.error('page check result',JSON.stringify(check.result));
 await ratiosPanel.getByRole('button',{name:'Close'}).click();await focus(ratios);
 await ratios.getByRole('button',{name:'Pages to check'}).click();
 // Page 1 is the cover; the updated teaching block is on page 2 and nothing else moved.
 assert.deepEqual(check.result.student,{pagesBefore:2,pagesAfter:2,pageCountChanged:false,changed:[2],moved:[],otherChanged:0});
 await ratiosPanel.getByText('Questions: page 2 changed; no other pages moved.',{exact:true}).waitFor({timeout:60000});
 await ratios.setViewportSize({width:390,height:844});
 assert.ok(await ratios.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal scroll at phone width');
 await fs.mkdir('output/shared-content',{recursive:true});await ratiosPanel.screenshot({path:'output/shared-content/pages-to-check.png'});
 await ratios.setViewportSize({width:1400,height:950});
 await ratiosPanel.getByRole('button',{name:'Checked'}).click();
 await ratiosPanel.getByText('Nothing is waiting.',{exact:false}).waitFor();
 // A question added to the shared exercise in Similarity is offered to Ratios.
 const sim=await loadBookletProject('shared-similarity',options),newQuestion=createProjectBlock('question');
 newQuestion.id='s-new';newQuestion.content.id='s-new-root';newQuestion.content.prompt='A scale drawing uses 1 : 200. A wall is 3 cm long on the drawing. How long is the wall?';newQuestion.content.answer={short:'6 m',worked:'$3\\times 200=600$ cm $=6$ m',solutionDiagrams:[]};
 sim.sections[0].blocks.push(newQuestion);await saveBookletProject(sim,{...options,expectedRevision:sim.revision});
 await focus(similarity);
 await panel.getByText('New questions in shared exercises',{exact:true}).waitFor({timeout:60000});
 await panel.getByRole('checkbox',{name:/Ratios/}).waitFor();
 await panel.screenshot({path:'output/shared-content/new-question-offer.png'});
 await panel.getByRole('button',{name:'Add to selected booklets'}).click();
 await similarity.getByText('Added to 1 other booklet.',{exact:false}).waitFor();
 const ratiosBlocks=(await loadBookletProject('shared-ratios',options)).sections[0].blocks;
 assert.equal(ratiosBlocks.at(-1).content.prompt,newQuestion.content.prompt,'added after the copy of the question before it');
 assert.deepEqual(ratiosBlocks.at(-1).sourceReview.reuse,{projectId:'shared-similarity',blockId:'s-new'});
 await focus(ratios);
 await ratios.getByText('How long is the wall?',{exact:false}).first().waitFor({timeout:60000});
 assert.deepEqual(errors,[]);
 console.log(`PASS: decision notice, apply to all, in-place update of an open booklet, new-question offer, page check (${Math.round((Date.now()-started)/1000)} s, result ${JSON.stringify(check.result)}) and phone-width panel. User files untouched.`);
}catch(error){
 if(process.env.SHARED_CHECK_DEBUG){for(const page of context.pages())console.error(page.url(),'| notices:',await page.locator('.project-notice,.workspace-toast,.shared-panel').allTextContents().catch(()=>[]));console.error(requests.join('\n'));console.error(errors);}
 throw error;
}finally{await browser.close();await fs.rm(root,{recursive:true,force:true});}
