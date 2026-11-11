#!/usr/bin/env node
// Paginate booklet headlessly (11 November 2026, user approved). Drives the same Studio action a person uses
// ("Paginate booklet" in the Page group of the Layout panel, src/components/BookletComposePass.svelte), so the
// pass has one implementation: src/lib/booklet-compose.js, following docs/booklet-pagination-principles.md.
//   node paginate/compose.mjs --project ID [--apply] [--accept-reviewed]
//   node paginate/compose.mjs --candidate FILE [--out FILE] [--accept-reviewed]
//   --phases normalise,layout,starts,lessons,questions,exercises,fill   runs only those phases (diagnostics, bench)
// Without --apply it writes only the report (and, for --candidate, the composed project to --out). On a booklet
// with teacher review, changes to reviewed blocks are made only with --accept-reviewed, the teacher's explicit
// acceptance of the before/after diff; otherwise reviewed blocks are left exactly as they are.
// Run from PowerShell. Reuses the Studio server on 5173; it is never restarted.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {launchChromium} from '../scripts/booklet/browser-launch.mjs';
import {withRenderResource,BASE} from '../first-pass/review.mjs';
import {ROOT,liveProject} from '../bench/history.mjs';

const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^﻿/,''));
const write=(f,v)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,1)+'\n');};
const today=()=>{const d=new Date();return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');};

export async function driveCompose(project,{base=BASE,acceptReviewed=false,phases=null,timeoutMs=2*60*60*1000,log=()=>{}}={}){
 return withRenderResource(async()=>{
  const {chromium}=await import('playwright-core'),{routeCandidateProject}=await import('../scripts/booklet/diagram-preflight.mjs');
  const browser=await launchChromium(chromium,{headless:true});
  try{
   const page=await(await browser.newContext({viewport:{width:1600,height:1100}})).newPage(),record=structuredClone(project);
   page.setDefaultTimeout(300000);
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await routeCandidateProject(page,record);
   record.settings.flowEdition='student';
   await page.goto(base+'/#/booklet?stage=projects&project='+encodeURIComponent(project.id),{waitUntil:'domcontentloaded',timeout:180000});
   await page.locator('.flow-document').waitFor({state:'attached',timeout:600000});
   await page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:600000});
   await page.getByRole('button',{name:'Layout',exact:true}).click();
   const pageGroup=page.locator('#booklet-layout-spacing details[data-inspector-group="block-page"]').first();
   await pageGroup.waitFor({state:'attached'});
   if(!await pageGroup.evaluate(d=>d.open))await pageGroup.locator('summary').click();
   await page.getByRole('button',{name:'Paginate booklet',exact:true}).waitFor({state:'visible'});
   await page.evaluate(()=>{delete window.__bookletComposeResult;});
   // The component's run(); includeReviewed only on the teacher's explicit acceptance.
   await page.evaluate(([include,phases])=>{window.__bookletCompose({includeReviewed:include,phases});},[acceptReviewed,phases]);
   const started=Date.now();let last='';
   for(;;){
    const state=await page.evaluate(()=>window.__bookletComposeResult?.state??null);
    if(state==='done'||state==='error')break;
    const text=await page.locator('.compose [role=status]').first().textContent({timeout:1000}).catch(()=>'');
    if(text&&text!==last){last=text;log(text);}
    if(Date.now()-started>timeoutMs)throw Error('Paginate booklet timed out');
    await page.waitForTimeout(1000);
   }
   const result=await page.evaluate(()=>window.__bookletComposeResult);
   if(result.state==='error')throw Error('Paginate booklet failed: '+result.message);
   return {...result,pageErrors:errors};
  }finally{await browser.close();}
 });
}

async function main(){
 const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 const file=arg('--candidate'),id=arg('--project'),apply=args.includes('--apply'),acceptReviewed=args.includes('--accept-reviewed');
 if(!file&&!id)throw Error('Use --candidate FILE or --project ID');
 const project=file?read(path.resolve(file)):liveProject(id);
 const result=await driveCompose(project,{base:arg('--base',BASE).replace(/\/$/,''),acceptReviewed,phases:arg('--phases',null)?.split(',')??null,log:m=>console.log(m)});
 const {project:composed,...report}=result;
 const out=file?path.resolve(arg('--out',file.replace(/\.json$/,'')+'-composed.json')):null;
 // A candidate's report sits next to its output; a live booklet's in the dated work folder.
 const dir=out?path.dirname(out):path.join(ROOT,'.booklet-work','compose-'+today(),project.id);
 write(path.join(dir,'report.json'),{project:project.id,revision:project.revision??null,acceptReviewed,...report});
 const byKind={};for(const c of report.changes??[])byKind[c.kind]=(byKind[c.kind]??0)+1;
 console.log(JSON.stringify({before:report.before,after:report.after,trials:report.trials,changes:byKind,reviewedChanges:(report.changes??[]).filter(c=>c.reviewed).length,pageErrors:report.pageErrors?.length??0},null,1));
 if(out){write(out,composed);console.log('Wrote '+path.relative(ROOT,out));return;}
 write(path.join(dir,'candidate.json'),composed);
 if(!apply){console.log('Dry run: report and candidate in '+path.relative(ROOT,dir));return;}
 if(!report.changes?.length){console.log('No change to write.');return;}
 // Live booklet: revision-checked save, after the sweep's hold checks.
 const {liveWork}=await import('../sweep/run.mjs');
 const {blocked,held}=liveWork(id);if(blocked.length||held.length)throw Error('Deferred: '+[...blocked,...held].join('; '));
 const {saveRepair}=await import('../scripts/booklet/feedback-closeout.mjs');
 const live=read(path.join(ROOT,'booklets/projects',id+'.json'));
 if(live.revision!==project.revision)throw Error('The booklet changed during the pass; run again.');
 const pointer=s=>s.replaceAll('~','~0').replaceAll('/','~1');
 const changedBlockIds=[...new Set(report.changes.flatMap(c=>c.blockIds??[c.blockId]).filter(Boolean))];
 for(const c of report.changes)if(c.kind==='reorder')for(const s of composed.sections.filter(s=>s.id===c.sectionId))for(const b of s.blocks)if(b.flow?.autoOrder&&!changedBlockIds.includes(b.id))changedBlockIds.push(b.id);
 const allowedPaths=[...new Set(report.changes.filter(c=>c.nodeId).flatMap(c=>['/settings/layoutOverrides/answerSpaces/'+pointer(c.nodeId),'/settings/layoutOverrides/blockLayouts/'+pointer(c.blockId)]))];
 const saved=await saveRepair({candidate:composed,expectedRevision:live.revision,changedBlockIds,allowedPaths,runDir:dir,options:{checkpoint:true}});
 console.log(`Saved ${id} r${saved.project.revision}`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
