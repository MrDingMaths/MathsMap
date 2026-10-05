// The lean entry point's two layout gates. Neither makes a model call: they
// choose evidence and hand it to the existing visual review queue or a reviewer.
//   sample  - render a candidate early and pick its few densest layouts to look at,
//             so shared layout causes are fixed before authoring scales up.
//   prepare - bind the exporter's selected-page evidence to the visual review
//             queue, so the pool dispatches the final inspection jobs.
import fs from 'node:fs';
import path from 'node:path';
import {liveWorkflow,FINAL_EDITIONS} from './workflow-review.mjs';
import {describeReview} from './visual-review.mjs';
import {prepareReviewQueue} from './visual-review-queue.mjs';
import {ensureSelectedPdfRasters} from './pdf-rasters.mjs';
import {isLeanReview,leanLayoutProfile} from './lean-profile.mjs';
import {leanPreExportLint} from './import-pre-final.mjs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^﻿/,''));
const pageImage=(runDir,page)=>path.join(runDir,'evidence','pages','page-'+String(page).padStart(3,'0')+'.png');

export function editionManifestFiles(exportDir,projectId){
 const files=FINAL_EDITIONS.map(edition=>path.join(path.resolve(exportDir),projectId+'-'+edition+'.full.pages.json')),missing=files.filter(file=>!fs.existsSync(file));
 if(missing.length)throw Error('Final visual review needs all five passed edition manifests; missing '+missing.map(file=>path.basename(file)).join(', '));
 return files;
}
// Prepare the queue from a passed export. The exporter has already chosen and
// rasterised the pages to inspect; this records them as pending inspections.
export async function prepareLeanVisualReview({runDir,manifest,projectFile,projectId,exportDir},{workflow=liveWorkflow(runDir),describe=describeReview,prepare=prepareReviewQueue}={}){
 if(!isLeanReview(manifest))throw Error('Lean visual review requires a recorded three-pass run');
 if(!workflow.settled?.key)throw Error('Settle current content before preparing the final visual review');
 const manifestFiles=editionManifestFiles(exportDir,projectId),input=await describe({projectFile:path.resolve(projectFile),sourceFiles:manifest.selectedPages.map(page=>pageImage(runDir,page)),manifestFiles,key:workflow.settled.key});
 const inputFile=path.join(runDir,'visual-review','final-input.json');fs.mkdirSync(path.dirname(inputFile),{recursive:true});fs.writeFileSync(inputFile,JSON.stringify(input,null,2)+'\n');
 const queue=await prepare(runDir,input),selected=Object.fromEntries(manifestFiles.map(file=>{const m=read(file);return [m.edition,m.visualPages.length];}));
 return {inputFile,total:queue.total,pending:queue.pending?.length??0,reused:queue.reused??0,selectedPagesByEdition:selected,visualAcceptance:false,
  next:'Run `lean-import.mjs review` to dispatch the pending page inspections, then record the final review (visual-review.mjs final-record, then review-workflow.mjs final-review).'};
}

// After an export the queue is prepared without failing a passed export: any
// problem is reported beside the receipt and the visual gate stays visibly open.
export async function queueVisualReviewAfterExport(args,deps){
 try{return await prepareLeanVisualReview(args,deps);}
 catch(error){return {visualAcceptance:false,error:error.message,next:'Resolve the error, then run lean-import.mjs visual --run-id ID --project ID --exports DIR'};}
}

// Blocks to look at early: every block carrying a figure (diagrams and images are
// where placement and page splits fail), then the densest block of each other
// layout family, figures first and densest first. Front matter is generated and
// the answer editions render the same blocks, so only authored content counts.
const FIGURE=/"questionDiagrams":\[\{|"(?:imageSrc|image|src|url)":"[^"]+\.(?:png|jpe?g|webp|svg)"/;
export function selectLayoutSample(project,{limit=8}={}){
 if(!Number.isInteger(limit)||limit<1)throw Error('Layout sample limit must be a positive integer');
 const families=new Map(),figures=[];
 for(const section of project.sections??[]){
  if(section.phase==='front-matter')continue;
  for(const block of section.blocks??[]){
   const {family,density}=leanLayoutProfile(block),row={id:block.id,family,density,figure:FIGURE.test(JSON.stringify(block)),sourcePage:block.sourcePageNumber??null};
   if(row.figure)figures.push(row);
   const old=families.get(family);if(!old||density>old.density)families.set(family,row);
  }
 }
 const order=(a,b)=>b.density-a.density||String(a.id).localeCompare(String(b.id)),taken=new Set(figures.map(row=>row.id));
 return [...figures.sort(order),...[...families.values()].filter(row=>!taken.has(row.id)).sort(order)].slice(0,limit);
}
// Physical pages that carry any sampled block (a block that splits shows on each).
export function samplePages(map,sample){
 const ids=sample.map(row=>row.id);
 return (map??[]).filter(page=>(page.blocks??[]).some(block=>ids.some(id=>block===id||block.startsWith(id+'-')||block.startsWith(id+':')))).map(page=>page.page);
}
// Draft-render the candidate in every standalone edition it has content for,
// then rasterise only the sampled pages. A reviewer looks at them and fixes any
// shared cause before the rest is authored. Nothing here accepts a layout.
// Text lint and the export's automated issues come back with the pages, so a
// defect family is seen here instead of at the final export; a failed render
// is reported with whatever it produced instead of being lost.
const hasPractice=project=>(project.sections??[]).some(section=>section.phase==='practice'&&section.blocks?.length);
export async function runLayoutSample({runDir,projectId,projectFile,out,limit=8,editions,regenerationReason,visibilityReviews},{exportRuntime,rasterize=ensureSelectedPdfRasters}={}){
 if(!out||!projectId||!projectFile)throw Error('A layout sample needs a candidate project, its ID and an output directory');
 const project=read(projectFile);if(!isLeanReview(project))throw Error('A layout sample requires a three-pass project');
 const sample=selectLayoutSample(project,{limit});if(!sample.length)throw Error('The candidate has no authored blocks to sample');
 const coversPracticeAnswers=hasPractice(project);editions??=coversPracticeAnswers?['student','short','worked']:['student'];
 const lint=leanPreExportLint(project),run=exportRuntime??(await import('./import-verification-runtime.mjs')).exportWithFrozenRuntime;
 let receipt=null,exportError=null;
 try{receipt=await run({out,projectId,runDir,projectFile,visibilityReviews,regenerationReason,extraArgs:['--draft','--editions',editions.join(',')]});}
 catch(error){exportError=error.message;}
 const reportFile=path.join(out,'report.json'),report=fs.existsSync(reportFile)?read(reportFile).report?.[projectId]??{}:{},pages=[],automatedIssues={},missingEditions=[];
 if(!exportError&&!report.student?.pdf?.path)throw Error('Draft render has no PDF page map for student');
 for(const edition of editions){
  const entry=report[edition];if(!entry?.pdf?.path||!Array.isArray(entry.map)){missingEditions.push(edition);continue;}
  if(entry.issues?.length)automatedIssues[edition]=entry.issues;
  const wanted=[...new Set([...samplePages(entry.map,sample),...(entry.issues??[]).map(issue=>Number(issue.page)).filter(page=>Number.isInteger(page)&&page>=1&&page<=entry.map.length)])].sort((a,b)=>a-b);if(!wanted.length)continue;
  const images=await rasterize(entry.pdf,entry.map.length,path.join(out,'sample-rasters'),{pages:wanted});
  for(const image of images.images)pages.push({edition,page:image.page,blocks:entry.map.find(p=>p.page===image.page)?.blocks??[],image:image.path});
 }
 const ok=!exportError&&!missingEditions.length&&!lint.blocking.length&&!Object.keys(automatedIssues).length;
 const result={ok,plan:sample,pages,editions,coversPracticeAnswers,lint,automatedIssues,missingEditions,exportError,receipt:receipt?.runtimeManifest??null,visualAcceptance:false,
  next:(ok?'':'This sample did not pass: repair the lint, automated issues or render failure listed here and sample again before authoring more. ')+(coversPracticeAnswers?'':'This candidate has no practice answers yet, so short and worked layouts are untested: sample again once the first exercise is authored. ')+'Look at these pages at final size. Fix shared causes (arrangement, diagram width, page splits) in the candidate and in the instructions for the remaining pages before authoring them; nothing here records an acceptance.'};
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'layout-sample.json'),JSON.stringify(result,null,2)+'\n');
 return {...result,file:path.join(out,'layout-sample.json')};
}
