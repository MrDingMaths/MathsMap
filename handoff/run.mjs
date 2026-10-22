#!/usr/bin/env node
// Handoff: the automatic chain a booklet goes through before the teacher sees it (22 October 2026, user
// approved; docs/booklet-verification-speed.md). Default on for new imports and unreviewed booklets.
//
//   node handoff/run.mjs --candidate FILE [--out FILE] [--work-dir DIR] [--skip a,b] [--only a,b]
//                        [--fresh] [--no-model] [--export] [--in-place]
//   node handoff/run.mjs --project-file FILE --out FILE        (the form bench/benchmark.mjs uses)
//   node handoff/run.mjs --project ID --allow-live [--save] [--publish]   (works on a copy; see below)
//   node handoff/run.mjs --list
//
// Steps, in order (each can be skipped with --skip and each is resumable):
//   working-space  calibrated working space, both ways (paginate/working-space.mjs apply)
//   sweep          the pre-review sweep (sweep/rules.mjs), standing house conventions
//   regions        source regions of the teaching blocks (source-match/regions.mjs), so roles can read the header band
//   roles          block roles against the source (checks/roles.mjs)
//   wrapped-math   formulas that wrap (checks/wrapped-math.mjs)
//   whitespace     gaps over 6 mm and stray source page boundaries (checks/whitespace.mjs)
//   source-match   teaching blocks follow the structure of their source (source-match/run.mjs)
//   theory-diff    teaching text against the source (checks/theory-diff.mjs), report only
//   optimise       pagination optimiser (paginate/optimise.mjs)
//   first-pass     first-pass review with the source pages (first-pass/review.mjs --source)
//   apply          the mechanical first-pass queues (a, b) applied (first-pass/apply.mjs)
//   queue          the combined review queue, lowest confidence first
//   export         with --export only: the final lean-review export
//
// The chain edits a working copy, <work-dir>/candidate.json, and never the input: --out names where the
// result is copied (default: the working copy); --in-place copies it over --candidate. A live booklet
// (--project) is processed on a copy too; --save writes the result through the revision-checked repair
// path after the sweep's hold checks, --publish copies regions.json and review-queue.json into the
// import run's source-match folder so Studio's Source tab shows them. A rerun continues after the last
// finished step; --fresh starts again. Each step's seconds and result are in <work-dir>/handoff-state.json.
// Model calls (Sol low, through the existing worker path, at most three per booklet) happen only in
// source-match, roles (ambiguous cases) and first-pass. Launch the model-calling steps with an escalated (permitted
// host) launch, as AGENTS.md requires on this machine; never disable the worker's own read-only sandbox.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {buildQueue} from './lib/queue.mjs';
import {ROOT,read,write,now,isMain,parseArgs,runDirOf,changedBlocks,saveTarget} from '../checks/lib/common.mjs';

export const STEPS=Object.freeze(['working-space','sweep','regions','roles','wrapped-math','whitespace','source-match','theory-diff','optimise','first-pass','apply','queue','export']);
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,16);
const pick=(value,keys)=>Object.fromEntries(keys.filter(k=>value?.[k]!==undefined).map(k=>[k,value[k]]));

// A child node process: the existing CLIs run as they are, so their guards and logs are untouched.
function node(script,args,{log,timeoutMs=4*60*60*1000}={}){
 const started=Date.now(),run=spawnSync(process.execPath,[path.join(ROOT,script),...args],{cwd:ROOT,encoding:'utf8',maxBuffer:256*1024*1024,timeout:timeoutMs,windowsHide:true});
 const seconds=Math.round((Date.now()-started)/1000);
 for(const line of String(run.stderr??'').split(/\r?\n/).filter(Boolean).slice(-40))log?.(line);
 if(run.status!==0)throw Error(`${script} exited ${run.status}: ${String(run.stderr||run.error?.message||'').split(/\r?\n/).filter(Boolean).slice(-3).join(' | ')}`);
 return {stdout:String(run.stdout??''),seconds};
}
const lastJson=text=>{const start=text.indexOf('{');if(start<0)return null;try{return JSON.parse(text.slice(start));}catch{return null;}};

// ---- the steps -----------------------------------------------------------------------------------------
// Each step reads and writes ctx.work (the working copy) and returns a small result object. It may
// return {skipped: why}. ctx: {work, workDir, id, opts, log, model}.
const impl={
 async 'working-space'(ctx){
  const out=ctx.work+'.step.json';
  try{node('paginate/working-space.mjs',['apply','--candidate',ctx.work,'--out',out],ctx);}
  catch(error){if(/teacher comments/.test(error.message))return {skipped:'a reviewed booklet: calibrated working space changes only named booklets'};throw error;}
  fs.copyFileSync(out,ctx.work);fs.rmSync(out,{force:true});
  return {applied:true};
 },
 async sweep(ctx){
  const {sweepProject,SWEEP_DATE}=await import('../sweep/rules.mjs'),{verifyCandidate,teacherComments,classCopy}=await import('../sweep/run.mjs');
  const before=read(ctx.work);
  if(teacherComments(before).length||classCopy(before))return {skipped:'a reviewed booklet: the sweep covers unreviewed booklets only'};
  const {project,findings,changed}=sweepProject(before,{fix:true}),problems=verifyCandidate(before,project,changed);
  if(problems.length)throw Error('The sweep would change content: '+problems.join('; '));
  const byBlock=Object.fromEntries(changed.map(b=>[b,[...new Set(findings.filter(f=>f.blockId===b&&f.action==='fix').map(f=>f.rule))]]));
  for(const section of project.sections)for(const block of section.blocks)if(changed.includes(block.id)){
   block.sourceReview??={};block.sourceReview.feedbackRepairs??=[];
   block.sourceReview.feedbackRepairs.push({date:SWEEP_DATE,source:'handoff',note:'Pre-review sweep ('+byBlock[block.id].join(', ')+'): standing house conventions applied before the teacher\'s review; content and answers unchanged.'});
  }
  if(changed.length)write(ctx.work,project);
  const counts={};for(const f of findings)(counts[f.rule]??={fix:0,report:0})[f.action==='fix'?'fix':'report']++;
  return {changedBlocks:changed.length,counts};
 },
 // Built before roles, which reads the words above a region; source-match later reuses and extends this file.
 async regions(ctx){
  const {buildRegions,sourceFiles,loadRegions,saveRegions,REGIONS_VERSION}=await import('../source-match/regions.mjs');
  const project=read(ctx.work),files=sourceFiles(project);
  if(!files?.pdf)return {skipped:'no source PDF for '+project.id};
  const file=path.join(ctx.workDir,'source-match','regions.json'),prior=loadRegions(file);
  const built=buildRegions(project,{pdf:files.pdf,reuse:prior.blocks});
  saveRegions(file,{version:REGIONS_VERSION,projectId:project.id,pdf:path.relative(ROOT,files.pdf).replaceAll('\\','/'),builtAt:now(),blocks:{...prior.blocks,...built}});
  const rows=Object.values(built);
  return {blocks:rows.length,needsLocate:rows.filter(r=>r.needsLocate).length};
 },
 async roles(ctx){
  const {runRoles}=await import('../checks/roles.mjs'),regionsFile=path.join(ctx.workDir,'source-match','regions.json');
  const {report}=await runRoles({project:read(ctx.work),file:ctx.work,apply:true,model:ctx.model,regionsFile:fs.existsSync(regionsFile)?regionsFile:null,workDir:path.join(ctx.workDir,'roles'),log:ctx.log});
  ctx.reports.roles=report;
  return {findings:report.findings.length,counts:report.counts,modelCalls:report.modelCalls.length,changed:report.changed.length};
 },
 async 'wrapped-math'(ctx){
  const {runWrappedMath}=await import('../checks/wrapped-math.mjs');
  const {report}=await runWrappedMath({project:read(ctx.work),file:ctx.work,apply:true,log:ctx.log});
  ctx.reports.wrapped=report;
  return {before:report.before.wrapped,after:report.after.wrapped,pages:[report.before.pages,report.after.pages],changed:report.changed.length};
 },
 async whitespace(ctx){
  const {runWhitespace}=await import('../checks/whitespace.mjs');
  const {report}=await runWhitespace({project:read(ctx.work),file:ctx.work,apply:true,log:ctx.log});
  ctx.reports.whitespace=report;
  return {...report.counts,fixes:report.fixes.filter(f=>f.kept).length,changed:report.changed.length};
 },
 async 'source-match'(ctx){
  const args=['--candidate',ctx.work,'--out-dir',path.join(ctx.workDir,'source-match')];
  if(!ctx.model)args.push('--no-model');
  const {stdout,seconds}=node('source-match/run.mjs',args,ctx),summary=lastJson(stdout);
  return {seconds,...pick(summary,['regions','before','afterModel','after','modelCalls','customs','queue'])};
 },
 async 'theory-diff'(ctx){
  const {runTheoryDiff}=await import('../checks/theory-diff.mjs'),regionsFile=path.join(ctx.workDir,'source-match','regions.json');
  if(!fs.existsSync(regionsFile))return {skipped:'no source regions (the source-match step has not run)'};
  const report=runTheoryDiff({project:read(ctx.work),regionsFile});
  ctx.reports.theory=report.rows;write(path.join(ctx.workDir,'theory-diff.json'),report);
  return {compared:report.compared,differences:report.differences};
 },
 async optimise(ctx){
  const out=ctx.work+'.step.json';
  const {stdout}=node('paginate/optimise.mjs',['--candidate',ctx.work,'--apply','--out',out],ctx);
  const summary=lastJson(stdout);
  if(fs.existsSync(out)){fs.copyFileSync(out,ctx.work);fs.rmSync(out,{force:true});}
  return pick(summary??{},['pages','before','after','moves','applied','result']);
 },
 async 'first-pass'(ctx){
  const args=['review','--project-file',ctx.work,'--provenance-dir',path.join(ctx.workDir,'provenance'),'--source'];
  const {stdout,seconds}=node('first-pass/review.mjs',args,ctx),summary=lastJson(stdout);
  return {seconds,...pick(summary??{},['states','suppressed','discarded','errors'])};
 },
 async apply(ctx){
  const {loadProvenance,saveProvenance,provenanceFile}=await import('../first-pass/review.mjs'),{classifyRecord}=await import('../first-pass/queues.mjs'),{feedbackStatus}=await import('../src/lib/booklet-feedback.js');
  const project=read(ctx.work),provenanceDir=path.join(ctx.workDir,'provenance'),file=provenanceFile(project.id,{provenanceDir});
  if(!fs.existsSync(file))return {skipped:'no first-pass record (the first-pass step has not run)'};
  const record=loadProvenance(file,project),{counts}=classifyRecord(record,project,{feedbackStatus});saveProvenance(file,record);
  // Queues a (technical failure) and b (mechanical rule) are applied; c stays with the teacher and d is stale.
  const ids=(record.findings??[]).filter(f=>f.state==='pending'&&['a','b'].includes(f.queue?.name)).map(f=>f.id);
  if(!ids.length)return {queues:counts,applied:0,note:'nothing to apply'};
  const {runApply}=await import('../first-pass/apply.mjs');
  const outcome=await runApply({projectFile:ctx.work,provenanceDir,runDir:path.join(ctx.workDir,'apply'),findingIds:ids,queueLabel:'a,b',log:ctx.log});
  return {queues:counts,attempted:ids.length,applied:outcome.applied.length,reverted:outcome.reverted.length,comment:outcome.comment.length,errors:outcome.errors};
 },
 async queue(ctx){
  const project=read(ctx.work),dir=path.join(ctx.workDir,'source-match'),sm=path.join(dir,'review-queue.json');
  const {loadProvenance,provenanceFile}=await import('../first-pass/review.mjs');
  const provenance=provenanceFile(project.id,{provenanceDir:path.join(ctx.workDir,'provenance')});
  const firstPass=fs.existsSync(provenance)?(loadProvenance(provenance,project).findings??[]):null;
  // source-match writes review-queue.json; this step replaces it with the combined queue, so the original
  // is kept beside it (and a combined file, recognised by its summary, is never read as the original).
  const keep=path.join(dir,'review-queue.source-match.json');
  let original=fs.existsSync(sm)?read(sm):null;
  if(original?.summary)original=fs.existsSync(keep)?read(keep):null;else if(original)write(keep,original);
  const queue=buildQueue({project,sourceMatch:original,roles:ctx.reports.roles,wrapped:ctx.reports.wrapped,whitespace:ctx.reports.whitespace,theory:ctx.reports.theory,firstPass});
  write(path.join(ctx.workDir,'review-queue.json'),queue);write(sm,queue);
  return queue.summary;
 },
 async export(ctx){
  if(!ctx.opts['--export'])return {skipped:'pass --export for the final lean-review export (it is the third of the three-export budget)'};
  const project=read(ctx.work),run=runDirOf(project);
  if(!run)throw Error('No import run for '+project.id);
  const out=path.join(ctx.workDir,'export');
  node('scripts/booklet/lean-review.mjs',['export','--run-id',path.basename(run),'--project',project.id,'--project-file',ctx.work,'--out',out],ctx);
  return {out};
 },
};

// ---- the driver ---------------------------------------------------------------------------------------
export async function runHandoff({file,workDir,opts={},skip=[],only=null,fresh=false,model=true,log=()=>{}}){
 const original=read(file),id=original.id;
 fs.mkdirSync(workDir,{recursive:true});
 const work=path.join(workDir,'candidate.json'),statePath=path.join(workDir,'handoff-state.json'),inputHash=sha(file);
 let state=fs.existsSync(statePath)&&!fresh?read(statePath):null;
 if(state&&state.input?.sha!==inputHash){log('The input changed since the last run; starting again.');state=null;}
 if(!state||!fs.existsSync(work)){state={version:1,project:id,input:{file:path.resolve(file),sha:inputHash,revision:original.revision??null},startedAt:now(),steps:{}};fs.copyFileSync(file,work);}
 const ctx={work,workDir,id,opts,model,log:message=>{log(message);fs.appendFileSync(path.join(workDir,'handoff.log'),message+'\n');},reports:{}};
 // Reports of finished steps are reread, so a resumed run builds the same queue.
 for(const [name,key] of [['roles','roles'],['wrapped-math','wrapped'],['whitespace','whitespace']]){const saved=state.steps[name]?.report;if(saved)ctx.reports[key]=saved;}
 const theory=path.join(workDir,'theory-diff.json');if(fs.existsSync(theory))ctx.reports.theory=read(theory).rows;
 for(const name of STEPS){
  const done=state.steps[name];
  const wanted=only?only.includes(name):!skip.includes(name);
  if(!wanted){state.steps[name]={...done,status:done?.status==='done'?'done':'skipped',reason:'skipped by option'};continue;}
  if(done?.status==='done'){log(`${name}: done earlier (${done.seconds} s); continuing`);continue;}
  const started=Date.now();ctx.log(`== ${name}`);
  try{
   const result=await impl[name](ctx);
   const key={roles:'roles','wrapped-math':'wrapped',whitespace:'whitespace'}[name];
   state.steps[name]={status:result?.skipped?'skipped':'done',startedAt:new Date(started).toISOString(),seconds:Math.round((Date.now()-started)/1000),result,...(key&&ctx.reports[key]?{report:ctx.reports[key]}:{}),...(result?.skipped?{reason:result.skipped}:{})};
  }catch(error){
   state.steps[name]={status:'failed',startedAt:new Date(started).toISOString(),seconds:Math.round((Date.now()-started)/1000),error:error.message};
   write(statePath,state);
   throw Object.assign(error,{step:name});
  }
  write(statePath,state);
 }
 state.finishedAt=now();state.changedBlocks=changedBlocks(original,read(work));
 write(statePath,state);
 return {state,work};
}

async function main(){
 const argv=process.argv.slice(2);
 if(argv.includes('--list')){console.log(STEPS.join('\n'));return;}
 const opts=parseArgs(argv,{values:['--candidate','--project-file','--project','--out','--work-dir','--skip','--only'],flags:['--fresh','--no-model','--export','--in-place','--allow-live','--save','--publish']});
 const candidate=opts['--candidate']??opts['--project-file'];
 const source=candidate?path.resolve(candidate):opts['--project']?path.join(ROOT,'booklets','projects',opts['--project']+'.json'):null;
 if(!source)throw Error('Name a booklet with --candidate FILE, --project-file FILE or --project ID');
 const live=path.dirname(source)===path.resolve(ROOT,'booklets','projects');
 if(live&&!opts['--allow-live'])throw Error('A live booklet is processed on a copy but read from booklets/projects: pass --allow-live to confirm. Use --candidate for a copy you made.');
 if(opts['--save']&&!live)throw Error('--save writes to a live booklet; this is a candidate file (use --in-place or --out)');
 for(const name of [...(opts['--skip']?.split(',')??[]),...(opts['--only']?.split(',')??[])])if(!STEPS.includes(name))throw Error('Unknown step '+name+'. Steps: '+STEPS.join(', '));
 const id=read(source).id,workDir=path.resolve(opts['--work-dir']??path.join(ROOT,'.booklet-work','handoff',id));
 const {state,work}=await runHandoff({file:source,workDir,opts,skip:opts['--skip']?.split(',')??[],only:opts['--only']?.split(','),fresh:!!opts['--fresh'],model:!opts['--no-model'],log:m=>console.error(m)});
 if(opts['--out']){fs.mkdirSync(path.dirname(path.resolve(opts['--out'])),{recursive:true});fs.copyFileSync(work,path.resolve(opts['--out']));}
 if(opts['--in-place']&&!live)fs.copyFileSync(work,source);
 const after=read(work);let saved=null;
 if(opts['--save']){
  // The revision the run started from (handoff-state.json): the save fails if the booklet has changed since.
  const before=read(source),expectedRevision=state.input?.revision??before.revision;
  saved=await saveTarget({file:source,live:true,before,after,changed:changedBlocks(before,after),allowLive:true,tag:'handoff',expectedRevision});
 }
 if(opts['--publish']){
  const run=runDirOf(after);if(!run)throw Error('No import run to publish into');
  for(const name of ['regions.json','review-queue.json']){const from=path.join(workDir,'source-match',name);if(fs.existsSync(from)){fs.mkdirSync(path.join(run,'source-match'),{recursive:true});fs.copyFileSync(from,path.join(run,'source-match',name));}}
 }
 const table=STEPS.map(name=>({step:name,status:state.steps[name]?.status??'-',seconds:state.steps[name]?.seconds??null,result:state.steps[name]?.result??state.steps[name]?.reason??state.steps[name]?.error??null}));
 console.log(JSON.stringify({project:id,workDir:path.relative(ROOT,workDir),result:opts['--out']??path.relative(ROOT,work),changedBlocks:state.changedBlocks.length,saved,steps:table},null,1));
}
if(isMain(import.meta))await main().catch(error=>{console.error(error.step?`handoff failed at ${error.step}: ${error.message}`:error.stack??error.message);process.exitCode=1;});
