// The lean entry point's two layout gates. Neither makes a model call: they
// choose evidence and hand it to the existing visual review queue or a reviewer.
//   sample  - render a candidate early and pick its few densest layouts to look at,
//             so shared layout causes are fixed before authoring scales up.
//   prepare - bind the exporter's selected-page evidence to the visual review
//             queue, so the pool dispatches the final inspection jobs.
import fs from 'node:fs';
import path from 'node:path';
import {liveWorkflow,FINAL_EDITIONS,effectiveInventory} from './workflow-review.mjs';
import {applyLayoutPreflightFixes,printedPracticeHeadings} from './import-layout-preflight.mjs';
import {describeReview} from './visual-review.mjs';
import {prepareReviewQueue} from './visual-review-queue.mjs';
import {ensureSelectedPdfRasters} from './pdf-rasters.mjs';
import {isLeanReview,leanLayoutProfile} from './lean-profile.mjs';
import {leanPreExportLint} from './import-pre-final.mjs';
import {importDiagramPreflight} from './import-diagram-preflight.mjs';
import {importV2} from './import-completion.mjs';
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
export function selectLayoutSample(project,{limit=8,all=false}={}){
 if(!all&&(!Number.isInteger(limit)||limit<1))throw Error('Layout sample limit must be a positive integer');
 // Import v2: the sample candidate is already a small, deliberately chosen set of
 // source pages, so every authored block is looked at (Ch 1 case study, change 3).
 if(all)return (project.sections??[]).filter(section=>section.phase!=='front-matter').flatMap(section=>(section.blocks??[]).map(block=>{const {family,density}=leanLayoutProfile(block);return {id:block.id,family,density,figure:FIGURE.test(JSON.stringify(block)),sourcePage:block.sourcePageNumber??null};}));
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
// Import v2 (Ch 1 case study, change 3): source pages for the early sample, chosen
// from the inventory before anything is authored. The first exercise, then the
// fewest further pages that show every pattern class the inventory can see:
// each printed group heading, clozes, tables, diagrams, wide source grids,
// investigations, review sections and page-break continuations (with the next page).
const presentationOf=entry=>typeof entry.presentation==='object'&&entry.presentation?entry.presentation:{};
export function samplePatternClasses(inventory,{headings=[]}={}){
 const classes=new Set(),live=(inventory?.entries??[]).filter(entry=>!entry.exclusionReason);
 // Headings render through one mechanism, so one printed heading tests them all.
 if(headings.some(h=>h.page===inventory.pageNumber))classes.add('printed-heading');
 for(const group of inventory?.groups??[]){
  // From the group kind or a header that starts with the word; a running header
  // such as "Chapter 2: Investigation Task" is not the investigation itself.
  if(/investigation/i.test(group.kind??'')||/^investigation\b/i.test(group.header??''))classes.add('investigation');
  if(/review/i.test(group.kind??'')||/^(?:chapter\s+\d+\s+)?review\b/i.test(group.header??''))classes.add('review');
 }
 for(const entry of live){
  const p=presentationOf(entry);
  if(entry.responseKind==='cloze')classes.add('cloze');
  if(entry.kind==='diagram'&&/table/i.test(JSON.stringify(p.type??entry.description??'')))classes.add('table');
  else if(entry.kind==='diagram')classes.add('diagram');
  if(Math.max(Number(p.columns)||0,Number(p.sourceColumns)||0)>=3)classes.add('wide-grid');
  if(entry.continuesOnNextPage)classes.add('continuation');
  // A part that points at another question needs its target on a neighbouring sample page.
  if(/\b(?:from|in|of)\s+question\s+\d+\s*\(?[a-z]?\)?|\bpreceding\s+(?:question|investigation|exercise|task)\b|\bprevious\s+question\b/i.test(entry.description??''))classes.add('cross-reference');
 }
 return classes;
}
export function recommendSamplePages(inventories,{headings=[]}={}){
 const pages=(inventories??[]).filter(Boolean).sort((a,b)=>a.pageNumber-b.pageNumber);
 const byPage=new Map(pages.map(inv=>[inv.pageNumber,samplePatternClasses(inv,{headings})]));
 const chosen=new Map(),covered=new Set();
 const take=(page,reason)=>{if(!byPage.has(page))return;if(!chosen.has(page))chosen.set(page,[]);chosen.get(page).push(reason);for(const c of byPage.get(page))covered.add(c);};
 // The first exercise: from its opening page to the page before the next exercise opens.
 const opens=pages.filter(inv=>(inv.groups??[]).some(g=>/exercise/i.test(g.kind??'')||/^exercise\b/i.test(g.header??''))).map(inv=>inv.pageNumber);
 if(opens.length)for(const inv of pages)if(inv.pageNumber>=opens[0]&&(opens.length<2||inv.pageNumber<opens[1]))take(inv.pageNumber,'first exercise');
 // A book without exercise groups starts from its first page of questions.
 if(!opens.length){const first=pages.find(inv=>(inv.entries??[]).some(e=>e.kind==='question'&&!e.exclusionReason));if(first)take(first.pageNumber,'first questions');}
 for(;;){
  let best=null;
  for(const [page,classes] of byPage){if(chosen.has(page))continue;const gain=[...classes].filter(c=>!covered.has(c)).length;if(gain&&(!best||gain>best.gain))best={page,gain};}
  if(!best)break;
  const added=[...byPage.get(best.page)].filter(c=>!covered.has(c));take(best.page,'covers '+added.join(', '));
  if(added.includes('continuation'))take(best.page+1,'continuation of page '+best.page);
  if(added.includes('cross-reference'))take(best.page-1,'referenced from page '+best.page);
 }
 // A chosen page brings every page its questions continue to or from (assembly needs the whole chain).
 const flags=new Map(pages.map(inv=>[inv.pageNumber,{next:(inv.entries??[]).some(e=>e.continuesOnNextPage),previous:(inv.entries??[]).some(e=>e.continuesFromPreviousPage)}]));
 for(let grew=true;grew;){grew=false;for(const page of [...chosen.keys()]){const f=flags.get(page)??{};
  if(f.next&&byPage.has(page+1)&&!chosen.has(page+1)){take(page+1,'continuation of page '+page);grew=true;}
  if(f.previous&&byPage.has(page-1)&&!chosen.has(page-1)){take(page-1,'continues onto page '+page);grew=true;}}}
 return {pages:[...chosen.keys()].sort((a,b)=>a-b),reasons:Object.fromEntries([...chosen].sort((a,b)=>a[0]-b[0])),classes:[...covered].sort()};
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
const mapHas=(map,id)=>(map??[]).some(page=>(page.blocks??[]).some(block=>block===id||block.startsWith(id+'-')||block.startsWith(id+':')));
export function sampleBlocksMissingFromEditions(project,report,editions){
 const questions=(project.sections??[]).filter(section=>section.phase==='practice').flatMap(section=>(section.blocks??[]).filter(block=>block.type==='question'&&!block.presentation?.editorOnly));
 const missing=[];
 for(const edition of editions){const map=report?.[edition]?.map;if(!Array.isArray(map))continue;for(const block of questions)if(!mapHas(map,block.id))missing.push({edition,blockId:block.id});}
 return missing;
}
export async function runLayoutSample({runDir,projectId,projectFile,out,limit=8,editions,regenerationReason,visibilityReviews},{exportRuntime,rasterize=ensureSelectedPdfRasters,labels}={}){
 if(!out||!projectId||!projectFile)throw Error('A layout sample needs a candidate project, its ID and an output directory');
 let project=read(projectFile);if(!isLeanReview(project))throw Error('A layout sample requires a three-pass project');
 const manifestFile=runDir&&path.join(runDir,'manifest.json'),v2=!!manifestFile&&fs.existsSync(manifestFile)&&importV2(read(manifestFile));
 // Import v2: the sample shows the same deterministic layout fixes finish will make
 // (headings, worked exercise starts, cue joins), so it reviews what will print.
 let preflightFixes=[];
 if(v2){
  const manifest=read(manifestFile),inventories=(manifest.selectedPages??[]).map(page=>effectiveInventory(runDir,page)).filter(Boolean);
  const fixed=applyLayoutPreflightFixes(project,{headings:printedPracticeHeadings(inventories)});
  preflightFixes=fixed.changes;if(preflightFixes.length){project=fixed.project;fs.writeFileSync(projectFile,JSON.stringify(project,null,2)+'\n');}
 }
 // Import v2: Studio's label-collision check on the sample's diagrams, in seconds and
 // before any reviewer looks (Ch 2 pilot: both sample findings were label collisions).
 let labelCollisions=[];
 if(v2){
  const check=labels??(await import('./import-finish.mjs')).diagramLabelCheck;
  const result=await check({file:projectFile,runDir});labelCollisions=result.collisions??[];
 }
 const sample=selectLayoutSample(project,{limit,all:v2});if(!sample.length)throw Error('The candidate has no authored blocks to sample');
 const coversPracticeAnswers=hasPractice(project);editions??=coversPracticeAnswers?['student','short','worked']:['student'];
 const lint=leanPreExportLint(project),run=exportRuntime??(await import('./import-verification-runtime.mjs')).exportWithFrozenRuntime;
 let receipt=null,exportError=null,diagramIssues=[];
 try{
  diagramIssues=importDiagramPreflight(project,{file:visibilityReviews});
  if(diagramIssues.length)throw Error('Diagram review required before rendering: '+JSON.stringify(diagramIssues));
  receipt=await run({out,projectId,runDir,projectFile,visibilityReviews,regenerationReason,extraArgs:['--draft','--editions',editions.join(',')]});}
 catch(error){exportError=error.message;}
 const reportFile=path.join(out,'report.json'),report=fs.existsSync(reportFile)?read(reportFile).report?.[projectId]??{}:{},pages=[],automatedIssues={},missingEditions=[];
 if(!exportError&&!report.student?.pdf?.path)throw Error('Draft render has no PDF page map for student');
 for(const edition of editions){
  const entry=report[edition];if(!entry?.pdf?.path||!Array.isArray(entry.map)){missingEditions.push(edition);continue;}
  if(entry.issues?.length)automatedIssues[edition]=entry.issues;
  const wanted=[...new Set([...samplePages(entry.map,sample),...(entry.issues??[]).map(issue=>Number(issue.page)).filter(page=>Number.isInteger(page)&&page>=1&&page<=entry.map.length)])].sort((a,b)=>a-b);
  // Dense teaching layouts can occupy the whole sample selection. Still
  // inspect an actual answer page when practice answers are advertised.
  if(!wanted.length&&edition!=='student'&&coversPracticeAnswers){
   const first=entry.map.find(row=>row.blocks?.length);
   if(first)wanted.push(first.page);else missingEditions.push(edition);
  }
  if(!wanted.length)continue;
  const images=await rasterize(entry.pdf,entry.map.length,path.join(out,'sample-rasters'),{pages:wanted});
  for(const image of images.images)pages.push({edition,page:image.page,blocks:entry.map.find(p=>p.page===image.page)?.blocks??[],image:image.path});
 }
 // Import v2: every practice question must render in every edition the sample
 // covers (Ch 1: an investigation classed as teaching got no worked page).
 const missingBlocks=v2&&!exportError?sampleBlocksMissingFromEditions(project,report,editions):[];
 const ok=!exportError&&!missingEditions.length&&!missingBlocks.length&&!labelCollisions.length&&!lint.blocking.length&&!Object.keys(automatedIssues).length;
 const result={ok,plan:sample,pages,editions,coversPracticeAnswers,lint,diagramIssues,automatedIssues,missingEditions,missingBlocks,preflightFixes,labelCollisions,exportError,receipt:receipt?.runtimeManifest??null,visualAcceptance:false,
  next:(ok?'':'This sample did not pass: repair the lint, automated issues or render failure listed here and sample again before authoring more. ')+(coversPracticeAnswers?'':'This candidate has no practice answers yet, so short and worked layouts are untested: sample again once the first exercise is authored. ')+'Look at these pages at final size. Fix shared causes (arrangement, diagram width, page splits) in the candidate and in the instructions for the remaining pages before authoring them; nothing here records an acceptance.'};
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'layout-sample.json'),JSON.stringify(result,null,2)+'\n');
 return {...result,file:path.join(out,'layout-sample.json')};
}
