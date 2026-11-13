// finish --check: every blocker, in one pass, before any model call (import v2 simplification
// plan item 3, 13 November 2026). Cambridge X11 Ch 5 stopped twelve times before its first
// export, one blocker at a time: answer-page scope, label collisions, missing teaching pages,
// the image limit, an absence claim beside key references, question references (twice), a
// prompt over the review limit. finishCandidate returns at the first failing stage and the
// evidence builder throws on the first block; this runs every stage on a copy of the candidate
// and lists everything. Nothing is written: the candidate, the review table and the run are
// only read. finish runs the same pre-review stages and starts no content review while any of
// them reports a blocker.
import fs from 'node:fs';
import path from 'node:path';
import {runConfigProblems} from './import-run-config.mjs';
import {applyLayoutPreflightFixes,printedPracticeHeadings,structuralPreflightBlockers,resolveQuestionReferences,readRunConfig,renderRiskTargets,targetedRenderCheck} from './import-layout-preflight.mjs';
import {contentReviewPlan,loadReviewed} from './lean-review.mjs';
import {effectiveInventory} from './workflow-review.mjs';
import {leanPreExportLint} from './import-pre-final.mjs';
import {importDiagramPreflight} from './import-diagram-preflight.mjs';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));

// Stages that need no render: config, preflight fixes preview, structure, evidence, prompt size, lint, 3D audit.
// finish uses config, structure, evidence and prompt-size; lint and the 3D audit also run after
// content review (validateImport, export), where a reviewer edit may already have fixed them.
export const PRE_REVIEW_STAGES=Object.freeze(['config','structure','evidence','prompt-size','lint','diagrams']);
export function preReviewBlockers({runDir,project,projectFile,manifest,config=readRunConfig(runDir),visibilityReviews,state=loadReviewed(path.join(runDir,'lean-review')),oversize,stages=PRE_REVIEW_STAGES}){
 const blockers=[],want=new Set(stages),add=(stage,message,blockIds=[])=>{if(want.has(stage))blockers.push({stage,message,...(blockIds.length?{blockIds}:{})});};
 if(want.has('config'))for(const message of runConfigProblems(config,manifest,{stage:'finish'}))add('config',message);
 if(want.has('structure'))for(const row of structuralPreflightBlockers(project,manifest,{config}))add('structure',row.message,[row.blockId]);
 let plan={pending:0,batches:0,largestPrompt:0,problems:[]};
 if(want.has('evidence')||want.has('prompt-size')){plan=contentReviewPlan({runDir,projectFile,project,state,oversize});for(const problem of plan.problems)add(problem.stage,problem.message,problem.blockIds);}
 if(want.has('lint'))for(const row of leanPreExportLint(project).blocking)add('lint',row.rule+' '+(row.blockId??row.path),row.blockId?[row.blockId]:[]);
 if(want.has('diagrams')){
  let diagrams=[];
  try{diagrams=importDiagramPreflight(project,{file:visibilityReviews});}catch(error){add('diagrams',error.message);}
  for(const issue of diagrams)add('diagrams','Diagram review required before rendering: '+(issue.id??issue.diagramId??'')+' ('+(issue.reason??issue.status??JSON.stringify(issue))+')');
 }
 return {blockers,plan:{pending:plan.pending,batches:plan.batches,largestPrompt:plan.largestPrompt}};
}

// The export's readiness report (inspectContentCoverage) as blockers, before any export. It used
// to surface only after an export, and only once coverage was complete: Mastering Ch 3's 26
// blank-prompt and response-space issues were in every export but first reported after the
// third (13 November 2026). Issues that content review itself settles (ambiguous or unmapped
// content, review findings, unchecked rows) are left to it.
const REVIEW_SETTLED=new Set(['ambiguous','unmapped-content','review-finding','unchecked']);
export async function readinessBlockers(project,{reviewedQuestions={},inspect,signatures}={}){
 const {inspectContentCoverage,contentNodes}=await import('../../src/lib/booklet-content-verification.js');
 const assetSignatures=await(signatures??(async p=>(await import('./verification-cache.mjs')).contentAssetSignatures(p)))(project);
 const coverage=await(inspect??inspectContentCoverage)(project,{assetSignatures,reviewedQuestions});
 const nodes=contentNodes(project),seen=new Set(),rows=[];
 for(const issue of [...coverage.issues??[],...coverage.presentation?.issues??[]]){
  const key=issue.kind+'|'+issue.targetId;
  if(REVIEW_SETTLED.has(issue.kind)||seen.has(key))continue;seen.add(key);
  const block=nodes.get(issue.targetId)?.block?.id??(project.sections??[]).flatMap(s=>s.blocks??[]).find(b=>b.id===issue.targetId)?.id;
  rows.push({stage:'readiness',message:'Source '+issue.kind+' '+(issue.targetId??'')+': '+issue.note,...(block?{blockIds:[block]}:{})});
 }
 return rows;
}

export async function finishCheck({runDir,projectFile,projectId,visibilityReviews,render=true,labels=true,oversize,log=()=>{}},deps={}){
 const started=Date.now(),manifest=read(path.join(runDir,'manifest.json')),config=readRunConfig(runDir);
 // A resumed finish works on its own candidate; a new one starts from the given file.
 const finishFile=path.join(runDir,'lean-review','finish','candidate.json');
 const source=fs.existsSync(finishFile)?finishFile:projectFile;
 let project=read(source);projectId??=project.id;
 // Preview the deterministic fixes finish makes before review, so their targets are not reported.
 const inventories=(manifest.selectedPages??[]).map(page=>effectiveInventory(runDir,page)).filter(Boolean);
 const fixes=applyLayoutPreflightFixes(project,{headings:printedPracticeHeadings(inventories)}),references=resolveQuestionReferences(fixes.project);
 project=references.project;
 const {blockers,plan}=preReviewBlockers({runDir,project,projectFile:source,manifest,config,visibilityReviews,oversize});
 const add=(stage,message,blockIds=[])=>blockers.push({stage,message,...(blockIds.length?{blockIds}:{})});
 try{blockers.push(...await(deps.readiness??readinessBlockers)(project,{reviewedQuestions:loadReviewed(path.join(runDir,'lean-review')).questions}));}
 catch(error){add('readiness','Readiness check failed: '+error.message);}
 let labelResult=null;
 if(labels){
  // Label collisions as the finish label check sees them (Studio's own inspection, cached by code).
  try{
   const check=deps.labels??(await import('./import-finish.mjs')).diagramLabelCheck;
   const tmp=path.join(runDir,'lean-review','finish','check-candidate.json');fs.mkdirSync(path.dirname(tmp),{recursive:true});
   fs.writeFileSync(tmp,JSON.stringify(project));
   try{labelResult=await check({file:tmp,runDir,place:false,log});}finally{fs.rmSync(tmp,{force:true});}
   if(labelResult.skipped)add('labels','Label check could not run (Studio on 5173 unavailable): '+labelResult.skipped);
   for(const row of labelResult.collisions??[])add('labels','Diagram label collision in '+row.id+' (finish places it automatically; a person decides only what placement cannot clear): '+row.issues.join('; '),[]);
  }catch(error){add('labels','Label check failed: '+error.message);}
 }
 let renderResult=null;
 if(render){
  // The targeted render fails closed: a skipped edition is a blocker, not a pass.
  const tmp=path.join(runDir,'lean-review','finish','check-render.json');fs.mkdirSync(path.dirname(tmp),{recursive:true});fs.writeFileSync(tmp,JSON.stringify(project));
  try{
   const targets=renderRiskTargets(project);if(!targets.length){const first=(project.sections??[]).find(s=>s.phase==='practice'&&s.blocks?.length)?.blocks[0]?.id;if(first)targets.push(first);}
   renderResult=await(deps.render??targetedRenderCheck)({file:tmp,projectId,targets,out:path.join(runDir,'lean-review','finish','check'),visibilityReviews,log});
   for(const issue of renderResult.issues)add('render','Targeted render, '+issue.edition+' p'+issue.page+': '+issue.kind+(issue.targetId?' '+issue.targetId:'')+(issue.excessMm?' ('+issue.excessMm.toFixed(1)+' mm)':''));
   for(const row of renderResult.skipped)add('render','Targeted render did not run for '+row.edition+': '+row.reason);
  }finally{fs.rmSync(tmp,{force:true});}
 }
 const byStage={};for(const row of blockers)byStage[row.stage]=(byStage[row.stage]??0)+1;
 return {ok:!blockers.length,checked:source,blockers,byStage,
  fixes:{preflight:fixes.changes.length,references:references.changes.map(c=>c.blockId)},
  contentReview:plan,labels:labelResult?{checked:Object.keys(labelResult.checked??{}).length,collisions:(labelResult.collisions??[]).length}:null,
  render:renderResult?{targets:renderResult.targets.length,issues:renderResult.issues.length,skipped:renderResult.skipped.length,seconds:renderResult.seconds}:null,
  seconds:Math.round((Date.now()-started)/1000)};
}
