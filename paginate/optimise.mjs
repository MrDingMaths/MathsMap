#!/usr/bin/env node
// Optimise pagination headlessly (22 October 2026, user approved). Drives the same
// Studio action a person uses ("Optimise pagination" in the Page tab of the Spacing
// panel, src/components/BookletPaginationOptimiser.svelte), so there is one
// implementation. Nothing here reimplements the optimiser.
//   node paginate/optimise.mjs --candidate FILE [--apply] [--out FILE] [--named]
//   node paginate/optimise.mjs --project ID [--apply] [--named]
// Without --apply it reports what it would change and writes nothing. With --apply:
//   --candidate  writes the optimised project to --out (default FILE-pg.json);
//   --project    saves the optimised project to the live booklet with an expected
//                revision (saveRepair), after the sweep's hold checks.
// A report is always written next to the output (or in the work directory).
// Run from PowerShell. Reuses the Studio server on 5173 (default vite config or the
// remote config both serve it); it is never restarted.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {withRenderResource,BASE} from '../first-pass/review.mjs';
import {ROOT,liveProject} from '../bench/history.mjs';
import {hasTeacherReview} from '../src/lib/booklet-import-spacing.js';

const WORK=path.join(ROOT,'.booklet-work','bench-20261022');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^﻿/,''));
const write=(f,v)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,1)+'\n');};

// Open the project in Studio, open Spacing > Page and run the action. Returns the
// result object the component publishes on window.__bookletOptimiseResult.
export async function driveStudio(project,{base=BASE,apply=false,named=false,checkUndo=false,timeoutMs=60*60*1000,log=()=>{}}={}){
 return withRenderResource(async()=>{
  const {chromium}=await import('playwright-core'),{routeCandidateProject}=await import('../scripts/booklet/diagram-preflight.mjs');
  let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
  try{
   const page=await(await browser.newContext({viewport:{width:1600,height:1100}})).newPage(),record=structuredClone(project);
   page.setDefaultTimeout(300000);
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await routeCandidateProject(page,record);
   record.settings.flowEdition='student';
   await page.goto(base+'/#/booklet?stage=projects&project='+encodeURIComponent(project.id),{waitUntil:'domcontentloaded',timeout:180000});
   await page.locator('.flow-document').waitFor({state:'attached',timeout:600000});
   for(const deadline=Date.now()+600000;;){
    const state=await page.locator('.flow-document').evaluate(el=>el.dataset.paginationState);
    if(state==='ready')break;
    if(Date.now()>deadline)throw Error('Studio pagination did not become ready');
    await page.waitForTimeout(250);
   }
   await page.getByRole('button',{name:'Spacing',exact:true}).click();
   await page.getByRole('tab',{name:'Page',exact:true}).click();
   const action=page.getByRole('button',{name:'Optimise pagination',exact:true});
   await action.waitFor({state:'visible'});
   if(named||hasTeacherReview(project)){const box=page.getByLabel(/teacher comments; change it on request/);if(await box.count())await box.check();}
   const run=async()=>{
    await page.evaluate(()=>{delete window.__bookletOptimiseResult;});
    await action.click();
    const started=Date.now();let last='';
    for(;;){
     const state=await page.evaluate(()=>window.__bookletOptimiseResult?.state??null);
     if(state==='done'||state==='error')break;
     const text=await page.locator('.optimiser [role=status]').first().textContent({timeout:1000}).catch(()=>'');
     if(text&&text!==last){last=text;log(text);}
     if(Date.now()-started>timeoutMs)throw Error('Optimise pagination timed out');
     await page.waitForTimeout(1000);
    }
    return page.evaluate(()=>window.__bookletOptimiseResult);
   };
   let result=await run();
   if(result.state==='error')throw Error('Optimise pagination failed: '+result.message);
   const out={...result,pageErrors:errors};
   if(apply&&result.moves?.length){
    await page.getByRole('button',{name:'Apply',exact:true}).click();
    await page.waitForFunction(()=>window.__bookletOptimiseResult?.state==='applied');
    out.state='applied';
    if(checkUndo){
     const undo=page.getByRole('button',{name:'Undo',exact:true});
     out.undoEnabledAfterApply=await undo.isEnabled();
     await undo.click();
     // One undo step must restore the original: the action then finds the same moves again.
     await page.waitForTimeout(1500);
     await page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready');
     out.undoDisabledAfterUndo=!(await undo.isEnabled());
     const again=await run();
     out.undoReproduces=JSON.stringify(again.moves.map(m=>[m.type,m.blockIds??m.blockId]))===JSON.stringify(result.moves.map(m=>[m.type,m.blockIds??m.blockId]));
    }
   }
   return out;
  }finally{await browser.close();}
 });
}

async function main(){
 const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 const file=arg('--candidate'),id=arg('--project'),apply=args.includes('--apply'),named=args.includes('--named');
 if(!file&&!id)throw Error('Use --candidate FILE or --project ID');
 const project=file?read(path.resolve(file)):liveProject(id);
 if(hasTeacherReview(project)&&!named)throw Error(`${project.id} has teacher comments: pass --named only when the teacher named this booklet for the change.`);
 const result=await driveStudio(project,{base:arg('--base',BASE).replace(/\/$/,''),apply,named,checkUndo:args.includes('--check-undo'),log:m=>console.log(m)});
 const {project:optimised,...report}=result;
 const out=path.resolve(arg('--out',file?file.replace(/\.json$/,'')+'-pg.json':path.join(WORK,project.id,'candidate-pg.json')));
 write(out.replace(/\.json$/,'')+'.report.json',{project:project.id,revision:project.revision??null,at:new Date().toISOString(),...report});
 console.log(JSON.stringify({before:report.before,after:report.after,trials:report.trials,moves:report.byType,rejections:report.rejections,pageErrors:report.pageErrors?.length??0,undoReproduces:report.undoReproduces},null,1));
 if(!apply){console.log('Dry run: nothing written but the report.');return;}
 if(!report.moves?.length){console.log('No change to write.');return;}
 if(file){write(out,optimised);console.log('Wrote '+path.relative(ROOT,out));return;}
 // Live booklet: revision-checked save, after the sweep's hold checks.
 const {liveWork}=await import('../sweep/run.mjs');
 const {blocked,held}=liveWork(id);if(blocked.length||held.length)throw Error('Deferred: '+[...blocked,...held].join('; '));
 const {saveRepair}=await import('../scripts/booklet/feedback-closeout.mjs');
 const live=read(path.join(ROOT,'booklets/projects',id+'.json'));
 if(live.revision!==project.revision)throw Error('The booklet changed while optimising; run again.');
 const pointer=s=>s.replaceAll('~','~0').replaceAll('/','~1');
 const changedBlockIds=[...new Set(report.moves.flatMap(m=>m.blockIds??[m.blockId]).filter(Boolean))];
 // Every practice block of a reordered exercise now carries flow.autoOrder.
 for(const m of report.moves)if(m.type==='reorder')for(const s of optimised.sections.filter(s=>s.id===m.sectionId))for(const b of s.blocks)if(b.flow?.autoOrder&&!changedBlockIds.includes(b.id))changedBlockIds.push(b.id);
 const allowedPaths=[...new Set(report.moves.filter(m=>m.type==='tighten').map(m=>'/settings/layoutOverrides/answerSpaces/'+pointer(m.nodeId)))];
 const saved=await saveRepair({candidate:optimised,expectedRevision:live.revision,changedBlockIds,allowedPaths,runDir:path.join(WORK,id,'optimise'),options:{checkpoint:true}});
 console.log(`Saved ${id} r${saved.project.revision}`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
