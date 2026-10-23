// Shared closeout for scoped feedback repairs: write-once input snapshot,
// revision-safe save with readback, evidence-bound comment resolution and one
// receipt. Repairs supply their own content transform and source/maths review.
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {loadBookletProject,saveBookletProject,getProjectBankSync} from './project-studio-server.mjs';
import {beginRunPhase,endRunPhase,readRunEvents,buildRunReceipt} from './run-observability.mjs';
import {updateFeedback} from '../../src/lib/booklet-feedback.js';
import {assertRepairScope,changedPaths,structuralPreflight} from './feedback-preflight.mjs';
import {normalizeEditableProject} from '../../src/lib/editable-booklet-model.js';

const sha=value=>createHash('sha256').update(value).digest('hex');
const UNAVAILABLE='unavailable';
export function walk(value,visit,path='') {
 if(!value||typeof value!=='object')return;
 if(!Array.isArray(value))visit(value,path);
 for(const [key,child]of Object.entries(value))if(typeof child==='object')walk(child,visit,path+'/'+key);
}
// Start timing at the first discovery action. Repeating the call keeps the first start.
export function startFeedbackJob(runDir,details={}){
 fsSync.mkdirSync(runDir,{recursive:true});
 const prior=readRunEvents(runDir).events.find(event=>event.event==='phase-started'&&event.phase==='feedback-job');
 return prior?{id:prior.id,startedAt:prior.at,reused:true}:{id:beginRunPhase(runDir,'feedback-job',{...details,excludedFromActive:true}),startedAt:new Date().toISOString(),reused:false};
}
export function finishFeedbackJob(runDir,details={}){
 const events=readRunEvents(runDir).events,start=events.find(event=>event.event==='phase-started'&&event.phase==='feedback-job');
 if(!start)return null;
 if(!events.some(event=>event.event==='phase-finished'&&event.id===start.id))endRunPhase(runDir,start.id,{ok:true,...details});
 return start.id;
}
// The first snapshot is the repair's accepted input. A later run must see the
// same project or stop, so concurrent edits are reconciled rather than overwritten.
export async function snapshotInput(runDir,project){
 await fs.mkdir(runDir,{recursive:true});
 const file=path.join(runDir,'before.json'),text=JSON.stringify(project,null,2)+'\n';
 try{await fs.writeFile(file,text,{flag:'wx'});return {file,hash:sha(text),revision:project.revision,reused:false};}
 catch(error){
  if(error.code!=='EEXIST')throw error;
  if(!isDeepStrictEqual(JSON.parse(await fs.readFile(file,'utf8')),JSON.parse(text)))throw Error('Existing repair snapshot differs from the current project; reconcile concurrent edits before continuing');
  return {file,hash:sha(text),revision:project.revision,reused:true};
 }
}
const blocksById=project=>new Map(project.sections.flatMap(section=>section.blocks).map(block=>[block.id,block]));
// The transaction return is the canonical saved expectation: it already includes
// validation/normalisation, preserved lineage, bank revisions and ratings. Compare
// every field on readback, rather than duplicating or bypassing those transforms.
export function verifyRepairReadback(saved,reloaded,{expectedRevision,changedBlockIds=[]}={}){
 const wanted=blocksById(saved),actual=blocksById(reloaded);
 const mismatched=changedBlockIds.filter(id=>!isDeepStrictEqual(actual.get(id),wanted.get(id)));
 const projectPaths=changedPaths(saved,reloaded);
 const readback={revision:reloaded.revision,expectedRevision:expectedRevision+1,blocksChecked:changedBlockIds.length,mismatched,projectPaths};
 if(reloaded.revision!==expectedRevision+1||mismatched.length||projectPaths.length)throw Object.assign(Error('Saved project does not match the repair candidate: '+JSON.stringify(readback)),{readback});
 return readback;
}
export async function saveRepair({candidate,expectedRevision,changedBlockIds=[],allowedPaths=[],runDir,options={},saveProject=saveBookletProject}){
 if(!Number.isInteger(expectedRevision))throw Error('saveRepair requires the expected input revision');
 const before=await loadBookletProject(candidate.id,{...options,refreshRatings:false});
 if(before.revision!==expectedRevision)throw Error('Project changed in another session; reload before saving');
 const scope=assertRepairScope(before,candidate,{blockIds:changedBlockIds,allowedPaths});
 // A declared removal is checked by scope; structural checks cover the surviving document.
 const present=blocksById(candidate);
 const preflight=structuralPreflight(candidate,{blockIds:changedBlockIds.filter(id=>present.has(id))});
 if(runDir){await fs.mkdir(runDir,{recursive:true});await fs.writeFile(path.join(runDir,'preflight.json'),JSON.stringify({...preflight,scope},null,2)+'\n');}
 if(preflight.issues.length)throw Error('Repair structural preflight failed: '+JSON.stringify(preflight.issues));
 const saved=await saveProject(candidate,{...options,expectedRevision});
 const reloaded=await loadBookletProject(saved.id,{...options,refreshRatings:false});
 // Reload normalises the persisted JSON. Use that same projection for fields
 // omitted by JSON serialization (undefined), retaining all meaningful metadata.
 const canonical=JSON.parse(JSON.stringify(normalizeEditableProject(saved)));
 let readback,failure;
 try{readback=verifyRepairReadback(canonical,JSON.parse(JSON.stringify(reloaded)),{expectedRevision,changedBlockIds});}
 catch(error){readback=error.readback;failure=error;}
 const bankSync=await getProjectBankSync(saved.id,options);
 readback.bankSyncItems=bankSync.items?.length??0;
 if(runDir){await fs.mkdir(runDir,{recursive:true});await fs.writeFile(path.join(runDir,'saved.json'),JSON.stringify(reloaded,null,2)+'\n');await fs.writeFile(path.join(runDir,'readback.json'),JSON.stringify({...readback,bankSync},null,2)+'\n');}
 if(failure)throw failure;
 return {project:reloaded,readback,bankSync};
}
// A comment is resolved only against recorded evidence: a specific statement of
// what changed plus the pages actually inspected or the non-render checks run.
// Original notes, anchors and quotes are retained.
export function resolveComments(project,resolutions,{at=new Date().toISOString()}={}){
 const flags=new Map((project.studio?.flags??[]).map(flag=>[flag.id,flag])),problems=[];
 for(const entry of resolutions){
  const flag=flags.get(entry.id);
  if(!flag)problems.push(entry.id+': comment not found');
  else if(flag.resolved)problems.push(entry.id+': already resolved');
  if(typeof entry.resolution!=='string'||entry.resolution.trim().length<20)problems.push(entry.id+': resolution must state what changed');
  const pages=entry.evidence?.inspectedPages??[],checks=entry.evidence?.checks??[];
  if(!pages.length&&!checks.length)problems.push(entry.id+': no inspected pages or checks recorded');
  if(pages.some(p=>typeof p.edition!=='string'||!Number.isInteger(p.page)))problems.push(entry.id+': inspected pages need an edition and physical page');
 }
 if(new Set(resolutions.map(entry=>entry.id)).size!==resolutions.length)problems.push('duplicate comment resolution');
 if(problems.length)throw Error('Comments cannot be resolved honestly: '+problems.join('; '));
 return resolutions.reduce((next,entry)=>updateFeedback(next,entry.id,{resolved:true,resolvedAt:at,resolution:entry.resolution.trim()}),project);
}
const artifact=file=>({file:file.replaceAll('\\','/'),sha256:sha(fsSync.readFileSync(file))});
const readJson=file=>{try{return JSON.parse(fsSync.readFileSync(file,'utf8'));}catch{return null;}};
// Work counts come only from tool reports and recorded phases in the run directory.
export function feedbackWorkCounts(runDir){
 const receipt=buildRunReceipt(runDir),job=receipt.phases['feedback-job']?.[0]??null,pagesFiles=[],sum=(rows,pick)=>rows.reduce((total,row)=>total+(pick(row)??0),0);
 const visit=dir=>{for(const entry of fsSync.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()&&entry.name!=='pdf-rasters')visit(file);else if(entry.name==='feedback-pages.json'||entry.name==='baseline-report.json')pagesFiles.push(file);}};
 if(fsSync.existsSync(runDir))visit(runDir);
 const reports=pagesFiles.map(readJson).filter(Boolean),phaseRows=Object.entries(receipt.phases).filter(([name])=>name!=='feedback-job').flatMap(([name,rows])=>rows.map(row=>({name,...row})));
 const inspected=readJson(path.join(runDir,'inspection.json'));
 return {
  completeJob:job?{startedAt:job.startedAt,endedAt:job.endedAt,elapsedMs:job.elapsedMs}:{startedAt:UNAVAILABLE,endedAt:UNAVAILABLE,elapsedMs:UNAVAILABLE,note:'startFeedbackJob was not recorded at the first discovery action'},
  phases:Object.fromEntries(Object.entries(receipt.phases).filter(([name])=>name!=='feedback-job').map(([name,rows])=>[name,{runs:rows.length,failed:rows.filter(row=>!row.ok).length,elapsedMs:sum(rows,row=>row.elapsedMs)}])),
  retries:phaseRows.filter(row=>!row.ok).length,
  exports:reports.length?{browserLaunches:sum(reports,r=>r.browserLaunches),fullPdfs:sum(reports,r=>r.counts?.fullPdfs),pagesPrinted:sum(reports,r=>r.counts?.pagesPrinted),pagesRasterised:sum(reports,r=>r.counts?.pagesRasterised),pagesSelectedForInspection:sum(reports,r=>r.counts?.pagesToInspect)}:UNAVAILABLE,
  diagramCache:reports.length?Object.fromEntries(['compiles','memoryHits','idbHits','serverHits','driverHits'].map(name=>[name,sum(reports,r=>r.counts?.tikz?.[name])])):UNAVAILABLE,
  pagesVisuallyInspected:Array.isArray(inspected?.pages)?inspected.pages.length:UNAVAILABLE,
  modelUsage:UNAVAILABLE,
  note:'Counts are read from recorded phases and tool reports. Selected pages are not inspected pages; record actual inspections in inspection.json. Missing values are unavailable, not zero.'
 };
}
export async function writeFeedbackReceipt({runDir,provenanceFile,summary,artifacts=[]}){
 const receipt={...summary,completedAt:new Date().toISOString(),work:feedbackWorkCounts(runDir),artifacts:artifacts.filter(file=>fsSync.existsSync(file)).map(artifact)};
 await fs.writeFile(path.join(runDir,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
 if(provenanceFile){await fs.mkdir(path.dirname(provenanceFile),{recursive:true});await fs.writeFile(provenanceFile,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});}
 return receipt;
}
