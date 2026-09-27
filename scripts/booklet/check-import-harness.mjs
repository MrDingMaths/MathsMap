// Exercise the actual editor/save path in fresh local storage, never live projects.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {saveBookletProject,promoteProjectQuestion,getProjectBankSync} from './project-studio-server.mjs';
import {makeBankManifest,normaliseQuestion} from '../../src/lib/practice-question-model.js';
import {sharedQuestion} from '../../src/lib/question-sync.js';
import {contentNodes} from '../../src/lib/booklet-content-verification.js';
import {artifactHash} from './page-review.mjs';
import {measureRunPhase} from './run-observability.mjs';

export function isolatedHarnessDirectory(out){
 const root=path.resolve('.booklet-work'),resolved=path.resolve(out);
 if(!resolved.startsWith(root+path.sep))throw Error('Harness output must be a fresh directory inside .booklet-work');
 // Reject symlink/junction ancestors as well as lexical traversal.
 for(let current=resolved;current!==path.dirname(root);current=path.dirname(current)){
  if(fs.existsSync(current)&&fs.lstatSync(current).isSymbolicLink())throw Error('Harness output cannot traverse a symlink');
 }
 if(fs.existsSync(resolved))throw Error('Harness output already exists; choose a fresh directory');
 return resolved;
}

export async function checkImportHarness({candidateFile,diagramId,out,base,runDir,scenario='combined'}){
 const action=async()=>{
  const started=Date.now(),sourceHash=artifactHash(candidateFile),directory=isolatedHarnessDirectory(out);
  const candidate=JSON.parse(fs.readFileSync(candidateFile,'utf8').replace(/^\uFEFF/,''));
  const diagram=contentNodes(candidate).get(diagramId)?.node,width=Number(diagram?.widthMm);
  // The editor accepts up to190mm; retain room for the +4mm resize probe.
  if(!diagram||!Number.isFinite(width)||width<10||width>186)throw Error('Select a diagram with an explicit width between 10 and 186 mm');
  fs.mkdirSync(directory,{recursive:true});
  const projectRoot=path.join(directory,'projects'),bankRoot=path.join(directory,'bank');
  fs.mkdirSync(projectRoot);fs.mkdirSync(bankRoot);
  candidate.settings.flowEdition='student';
  const questions=candidate.sections.filter(s=>s.phase==='practice').flatMap(s=>s.blocks.filter(b=>b.type==='question'));
  if(!['editor','combined'].includes(scenario))throw Error('Unknown harness scenario');
  if(scenario==='combined'&&(!questions.length||questions.some(q=>!q.classification?.primarySkillId)))throw Error('Combined harness requires classified practice questions');
  for(const section of candidate.sections)for(const block of section.blocks)delete block.bankRef;
  let project,browser,server,page;
  const saves=[],report={passed:false,source:{path:path.resolve(candidateFile),hash:sourceHash},diagramId,initialWidthMm:width,saves};
  try{
   project=await saveBookletProject(candidate,{projectRoot,bankRoot,create:true});
   if(scenario==='combined')for(const q of questions)project=(await promoteProjectQuestion(project.id,{blockId:q.id,mode:'create'},{projectRoot,bankRoot,moduleRoot:path.join(directory,'modules')})).project;
   const records=()=>fs.readdirSync(bankRoot).filter(n=>/^q-.*\.json$/.test(n)).map(n=>JSON.parse(fs.readFileSync(path.join(bankRoot,n),'utf8')));
   if(!base){server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,open:false}});await server.listen();base='http://127.0.0.1:'+server.httpServer.address().port;}
   try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
   page=await browser.newPage({viewport:{width:1500,height:1100}});
   // One route owns the isolated store; no competing read-only route can swallow PUT.
   await page.route('**/__booklet/**',async route=>{
    const request=route.request(),pathname=new URL(request.url()).pathname,projectPath='/__booklet/projects/'+encodeURIComponent(project.id);
    if(pathname===projectPath){
     if(request.method()==='PUT'){
      try{
       const body=request.postDataJSON();
       if(body.project?.id!==project.id)throw Error('Unexpected project');
       project=await saveBookletProject(body.project,{projectRoot,bankRoot,expectedRevision:body.expectedRevision});
       saves.push({revision:project.revision,widthMm:contentNodes(project).get(diagramId)?.node.widthMm});
       return route.fulfill({json:project});
      }catch(error){return route.fulfill({status:409,json:{error:error.message}});}
     }
     if(request.method()==='GET')return route.fulfill({json:project});
    }
    if(request.method()!=='GET')return route.abort();
    if(pathname===projectPath+'/open')return route.fulfill({json:{project,bankSync:await getProjectBankSync(project.id,{projectRoot,bankRoot}),bankSyncError:''}});
    if(pathname==='/__booklet/projects')return route.fulfill({json:[{id:project.id,title:project.title}]});
    if(pathname==='/__booklet/bank/manifest')return route.fulfill({json:makeBankManifest(records())});
    if(pathname.startsWith('/__booklet/bank/questions/'))return route.fulfill({json:records().find(q=>q.id===decodeURIComponent(pathname.split('/').at(-1)))});
    return route.fallback();
   });
   await page.goto(base+'/#/booklet?stage=projects&project='+encodeURIComponent(project.id),{waitUntil:'domcontentloaded',timeout:30000});
   const ready=async()=>{
    await page.locator('.flow-document[data-pagination-state=ready]').waitFor({timeout:120000});
    await page.locator('.workspace-loading').waitFor({state:'detached',timeout:120000});
   };
   const revealBlock=async ownerId=>{
    // Long booklets mount only nearby pages. Reveal the owning page through
    // normal scrolling before looking for the editable diagram element.
    const groups=page.locator('.flow-document [data-flow-blocks]');
    const groupIndex=await groups.evaluateAll((nodes,id)=>nodes.findIndex(n=>JSON.parse(n.dataset.flowBlocks??'[]').some(row=>row[0]===id)),ownerId);
    if(groupIndex>=0)await groups.nth(groupIndex).scrollIntoViewIfNeeded();
   };
   const select=async()=>{
    await revealBlock(contentNodes(project).get(diagramId)?.block?.id);
    await page.waitForFunction(id=>[...document.querySelectorAll('.flow-document [data-diagram-id]')].some(n=>n.dataset.diagramId===id&&n.getBoundingClientRect().height>0),diagramId,{timeout:30000});
    const target=page.locator('.flow-document [data-diagram-id]');
    // Resolve by exact attribute without interpolating a source ID into CSS.
    const index=await target.evaluateAll((nodes,id)=>nodes.findIndex(n=>n.dataset.diagramId===id&&n.getBoundingClientRect().height>0),diagramId);
    if(index<0)throw Error('Selected diagram is not visible in the student edition');
    await target.nth(index).scrollIntoViewIfNeeded();await target.nth(index).click();
    await page.getByLabel('Diagram width on page',{exact:true}).waitFor();
   };
   await ready();await select();
   for(const next of [width+4,width-2,width]){
    const count=saves.length,control=page.getByLabel('Diagram width on page',{exact:true});
    const saved=page.waitForResponse(r=>r.request().method()==='PUT'&&new URL(r.url()).pathname==='/__booklet/projects/'+encodeURIComponent(project.id),{timeout:30000});
    await control.fill(String(next));await control.press('Tab');
    assert.equal((await saved).status(),200,'Revision-safe save succeeded');
    await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved',null,{timeout:30000});
    assert.ok(saves.length>count,'Actual save acknowledged');assert.equal(saves.at(-1).widthMm,next);
   }
   if(scenario==='combined'){
    const q=project.sections.flatMap(s=>s.blocks).find(b=>b.id===questions[0].id),rootId=q.content.id;
    await ready();await revealBlock(q.id);
    await page.waitForFunction(id=>[...document.querySelectorAll('.flow-document [data-edit-root][data-edit-path="/prompt"]')].some(n=>n.dataset.editRoot===id&&n.getBoundingClientRect().height>0),rootId,{timeout:30000});
    const hosts=page.locator('.flow-document [data-edit-root][data-edit-path="/prompt"]');
    const index=await hosts.evaluateAll((nodes,id)=>nodes.findIndex(n=>n.dataset.editRoot===id&&n.getBoundingClientRect().height>0),rootId);
    assert.ok(index>=0,'Practice prompt is editable');await hosts.nth(index).locator('.clickable').first().click();
    const editor=page.locator('maths-editor:visible').first();await editor.waitFor();
    const saved=page.waitForResponse(r=>r.request().method()==='PUT'&&new URL(r.url()).pathname==='/__booklet/projects/'+encodeURIComponent(project.id));
    await editor.locator('[contenteditable="true"]').first().fill('Harness ownership sync: solve the supplied question.');
    assert.equal((await saved).status(),200);
    await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
   }
   await page.reload({waitUntil:'domcontentloaded'});await ready();await select();
   assert.equal(Number(await page.getByLabel('Diagram width on page',{exact:true}).inputValue()),width);
   assert.equal(artifactHash(candidateFile),sourceHash,'Original candidate unchanged');
   await page.screenshot({path:path.join(directory,'reopened.png')});
   report.checks={saveReopen:true};
   if(scenario==='combined'){
    const status=await getProjectBankSync(project.id,{projectRoot,bankRoot});assert.ok(status.items.length===questions.length&&status.items.every(i=>i.state==='synced'),'Owner questions are synced');
    const bank=records(),owner=project.sections.flatMap(s=>s.blocks).find(b=>b.id===questions[0].id),bankQuestion=bank.find(q=>q.id===owner.bankRef.id);
    assert.deepEqual(sharedQuestion(bankQuestion),sharedQuestion(normaliseQuestion(owner)));report.checks.ownershipSync=true;
    await page.goto(base+'/#/booklet?stage=builder',{waitUntil:'domcontentloaded'});await page.locator('.question-card').first().waitFor();
    await page.getByLabel('Search question text or question ID',{exact:true}).fill(bankQuestion.id);await page.locator('.apply-filters-btn').click();
    await page.waitForFunction(()=>document.querySelectorAll('.question-card').length===1);report.checks.filtering=true;
    await page.locator('.question-card__summary').click();await page.locator('.question-card__body').waitFor();
    assert.equal(await page.locator('.question-card .katex-error').count(),0);report.checks.solutions=true;
    await page.getByLabel('Select '+bankQuestion.id,{exact:true}).check();
    for(const name of ['Answers','Solutions']){const control=page.locator('.worksheet-controls').getByRole('button',{name,exact:true});if(await control.getAttribute('aria-pressed')!=='true')await control.click();}
    await page.locator('.worksheet-controls').getByRole('button',{name:'Preview',exact:true}).click();await page.locator('.a4-preview').waitFor();
    await page.locator('.a4-preview').getByRole('heading',{name:'Worked solutions',exact:true}).waitFor();
    assert.equal(await page.locator('.a4-preview .katex-error').count(),0);report.checks.worksheet=true;
    await page.screenshot({path:path.join(directory,'worksheet.png')});
   }
   report.passed=true;
  }catch(error){report.error=error.message;if(page)await page.screenshot({path:path.join(directory,'failure.png')}).catch(()=>{});throw error;}
  finally{
   report.elapsedMs=Date.now()-started;fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n','utf8');
   await browser?.close();await server?.close();
  }
  return report;
 };
 return runDir?measureRunPhase(runDir,'editor-harness',action):action();
}

export async function main(args=process.argv.slice(2)){
 const flags={};for(let i=0;i<args.length;i+=2){if(!['--project-file','--diagram','--out','--base','--run-dir','--scenario'].includes(args[i])||!args[i+1])throw Error('Use --project-file CANDIDATE --diagram ID --out .booklet-work/FRESH [--base URL --run-dir RUN --scenario combined|editor]');flags[args[i]]=args[i+1];}
 if(!flags['--project-file']||!flags['--diagram']||!flags['--out'])throw Error('Project file, diagram and fresh output directory are required');
 const report=await checkImportHarness({candidateFile:flags['--project-file'],diagramId:flags['--diagram'],out:flags['--out'],base:flags['--base'],runDir:flags['--run-dir'],scenario:flags['--scenario']});console.log(JSON.stringify(report));return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
