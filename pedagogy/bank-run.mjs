// Batch runner for the bank import pipeline (pipeline 4; docs/booklet-bank-import-pipeline.md). Commands:
//   (node pedagogy/bank-run.mjs ...)
//   run    --projects a,b [--until edits|assessments|stage] [--preview]
//   save   --projects a,b --approved-by "QUOTE"
//   report [--projects a,b]
// `run` works one booklet at a time: plan (Stage 0), exam tags (2), follow-up judge, merges and re-rating (3, Sol low),
// one revision-checked booklet save of those edits, the left-out list and the assessments file (4-5), then staging of
// the bank publication in isolation (6, nothing published). `--preview` makes no model call and saves nothing: it
// defers follow-ups and stages what would publish. `save` publishes the staged booklets (Decision 8: one approval per
// batch, quoted), reads every new record back and, for a textbook chapter, records its acceptance (Stage 7).
// State per booklet: .booklet-work/bank-import-20261112/<projectId>/state.json
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {planBatch} from './bank-batch.mjs';
import {buildAssessments} from './bank-assessments.mjs';
import {resolveFollowUps} from './bank-merges.mjs';
import {recordedReview,reviewContext} from '../scripts/booklet/recorded-review.mjs';
import {importProjectBank,practiceQuestions} from '../scripts/booklet/import-project-bank.mjs';
import {revisionHash,syncLinks} from '../scripts/booklet/bank-sync.mjs';
import {publishProject} from '../scripts/booklet/publish-project.mjs';
import {validateQuestion,normaliseQuestion} from '../src/lib/practice-question-model.js';
export {printedMarks} from './bank-batch.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const RUN_DIR='.booklet-work/bank-import-20261112';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^﻿/,''));
const write=(f,v)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,1)+'\n');};
const posix=f=>path.relative(ROOT,f).split(path.sep).join('/');
const projectFile=(id,root)=>path.join(root,'booklets','projects',id+'.json');
const dirOf=(id,root)=>path.join(root,RUN_DIR,id);

// Import v2 open decision 16: exam-marks.mjs strips marks only with MathsBase source evidence, which textbook
// chapters do not have. A textbook question still printing a standalone mark such as [3] is left out with a reason.
export const hasBankWork=(rows,assessments)=>assessments.questions.length>0||Object.keys(assessments.masterLinks??{}).length>0||rows.some(r=>r.action==='link');
const studioLink=(projectId,blockId)=>`http://127.0.0.1:5173/?project=${encodeURIComponent(projectId)}&block=${encodeURIComponent(blockId)}`;

// Stage 2 and 3 edits on a copy of the booklet; returns the candidate and what changed.
export async function bookletEdits(project,rows,{dir,root,preview,resolve=resolveFollowUps}){
 let candidate=structuredClone(project);const edits={examTags:[],followUps:[],comments:[]};
 const blockOf=id=>candidate.sections.flatMap(s=>s.blocks).find(b=>b.id===id);
 for(const row of rows.filter(r=>r.examTag)){const b=blockOf(row.blockId);if(b.sourceReview?.exam===row.examTag)continue;edits.examTags.push({blockId:row.blockId,exam:row.examTag});if(!preview){b.sourceReview??={};b.sourceReview.exam=row.examTag;}}
 const comments=rows.filter(r=>r.action==='follow-up-comment');
 for(const row of comments){
  const note=`[Bank import] ${row.blockId} refers back to ${row.previousBlockId} ("${(row.references??[]).join('", "')}"), so it cannot enter the question bank on its own. It is teacher-protected, so it was not merged automatically. Merge it into ${row.previousBlockId} as further parts, or state the given it needs, then resolve this comment.`;
  const exists=(candidate.studio?.flags??[]).some(f=>f.kind==='bank-import'&&f.targetId===row.blockId&&!f.resolved);
  edits.comments.push({blockId:row.blockId,exists});
  if(!preview&&!exists){candidate.studio??={};candidate.studio.flags=[...(candidate.studio.flags??[]),{id:randomUUID(),targetId:row.blockId,note,resolved:false,at:new Date().toISOString(),scope:'block',kind:'bank-import',findingKind:'follow-up-dependency'}];}
 }
 const merges=rows.filter(r=>r.action==='follow-up-merge');
 if(merges.length&&!preview){
  const pairs=merges.map(r=>({followUp:blockOf(r.blockId),previous:blockOf(r.previousBlockId),references:r.references}));
  const ctx=reviewContext(project,root);
  const result=await resolve(candidate,pairs,{dir:path.join(dir,'follow-ups'),reviewOf:b=>recordedReview(b,ctx)});
  candidate=result.project;edits.followUps=result.results;
 }else edits.followUps=merges.map(r=>({blockId:r.blockId,previousBlockId:r.previousBlockId,decision:'deferred-in-preview'}));
 return {candidate,edits,changed:JSON.stringify(candidate)!==JSON.stringify(project)};
}

export async function runBooklet(id,{root=ROOT,until='stage',preview=false,log=console.error,skills,dotpoints,resolve}={}){
 const dir=dirOf(id,root),state={projectId:id,startedAt:new Date().toISOString(),preview};
 let project=read(projectFile(id,root));
 let [plan]=await planBatch([project],{root});
 if(plan.skipped){state.status='skipped';state.reason=plan.skipped;write(path.join(dir,'state.json'),state);return state;}
 state.origin=plan.origin;state.plan={revision:plan.revision,counts:plan.counts,reasons:plan.reasons};
 // Stages 2-3: one save for exam tags, follow-up comments and merges.
 const edits=await bookletEdits(project,plan.blocks,{dir,root,preview,resolve});
 state.edits=edits.edits;
 if(edits.changed){
  const candidateFile=path.join(dir,`edits.r${project.revision}.json`);write(candidateFile,edits.candidate);
  const saved=await publishProject({candidateFile,expectedRevision:project.revision,apply:true,root,record:path.join(dir,`edits.r${project.revision}.record.json`),ledger:path.join(root,RUN_DIR,'ledger.jsonl'),note:'Bank import Stages 2-3: exam tags, follow-up merges, embeds and dependency reviews, comments'});
  state.edits.saved={from:saved.from,to:saved.to};log(`[${id}] edits saved r${saved.from} -> r${saved.to}`);
  project=read(projectFile(id,root));[plan]=await planBatch([project],{root});state.plan.after={revision:plan.revision,counts:plan.counts,reasons:plan.reasons};
 }
 if(until==='edits'){state.status='edited';write(path.join(dir,'state.json'),state);return state;}
 // Stages 4-5: the left-out list and the assessments file.
 skills??=read(path.join(root,'data','skills.json'));dotpoints??=read(path.join(root,'data','dotpoints.json'));
 const rows=plan.blocks;
 const assessments=buildAssessments(project,rows,{root,skills,dotpoints});
 const revisionTag=`r${project.revision}${preview?'-preview':''}`;
 const tag=preview||fs.existsSync(path.join(dir,`stage.${revisionTag}`))?`${revisionTag}-${randomUUID()}`:revisionTag;
 const assessmentsFile=path.join(dir,`assessments.${tag}.json`);write(assessmentsFile,assessments);
 Object.assign(state,{revision:project.revision,assessments:posix(assessmentsFile),publish:assessments.questions.length,masterLinks:Object.keys(assessments.masterLinks??{}).length,deferred:assessments.deferred});
 state.holds=rows.filter(r=>r.action==='hold').map(r=>({sourceBlockId:r.blockId,sameQuestionAs:r.matches}));
 const actionable=hasBankWork(rows,assessments);
 if(until==='assessments'||!actionable){state.status=actionable?'assessed':'nothing-to-publish';write(path.join(dir,'state.json'),state);return state;}
 // Stage 6: stage the publication in isolation; nothing is published.
 // Preserve previous attempts. Save reuses the exact stage recorded by this run.
 const out=path.join(dir,`stage.${tag}`);
 const staged=await importProjectBank({root,projectId:id,assessmentsFile,out,apply:false,onProgress:p=>log(`[${id}] ${JSON.stringify(p)}`)});
 const receipt=read(path.join(out,'receipt.json')),bankDir=path.join(out,'bank');
 // The receipt keeps the entries of earlier publications, so a question already in the bank before this run counts
 // as `published-before`, not as created now.
 const before=new Set(practiceQuestions(project).filter(b=>b.bankRef?.id).map(b=>b.id)),outcomeOf=q=>before.has(q.sourceBlockId)?'published-before':q.outcome;
 state.stage={out:posix(out),summary:staged,outcomes:receipt.questions.reduce((n,q)=>(n[outcomeOf(q)]=(n[outcomeOf(q)]??0)+1,n),{})};
 // Every new record carries its origin and passes bank validation.
 const created=receipt.questions.filter(q=>outcomeOf(q)==='created').map(q=>read(path.join(bankDir,q.bankId+'.json')));
 state.stage.records=created.map(q=>({bankId:q.id,blockId:q.bankContext?.blockId,bankContext:q.bankContext??null,valid:validateQuestion(q,{skillIds:new Set(skills.map(s=>s.id))}).valid}));
 state.stage.allCarryOrigin=created.every(q=>q.bankContext?.origin===plan.origin&&q.bankContext.projectId===id);
 state.status=preview?'previewed':'staged';write(path.join(dir,'state.json'),state);return state;
}

// Publish what `run` staged, after James's quoted approval of the batch (Decision 8).
export async function saveBooklet(id,{approvedBy,root=ROOT,log=console.error}){
 if(!String(approvedBy??'').trim())throw Error('save needs --approved-by "QUOTE" (James\'s words approving this batch)');
 const dir=dirOf(id,root),state=read(path.join(dir,'state.json'));
 if(state.status!=='staged')throw Error(`[${id}] is ${state.status}, not staged: run it (without --preview) first`);
 const out=path.join(root,state.stage.out),assessmentsFile=path.join(root,state.assessments);
 const result=await importProjectBank({root,projectId:id,assessmentsFile,out,apply:true,onProgress:p=>log(`[${id}] ${JSON.stringify(p)}`)});
 // Read back: every created record names this booklet as its origin.
 const receipt=read(path.join(root,'booklets','provenance',id,'bank-import.json')),links=await syncLinks(path.join(root,'booklets','question-bank'));
 // Only records created by this run: the receipt also keeps `created` entries from earlier imports, before origins.
 const fresh=new Set((state.stage.records??[]).map(r=>r.bankId));
 const readback=receipt.questions.filter(q=>q.outcome==='created'&&fresh.has(q.bankId)).map(q=>{const bank=read(path.join(root,'booklets','question-bank',q.bankId+'.json'));return {bankId:q.bankId,origin:bank.bankContext?.origin??null,owner:links[q.bankId]?.projectId??null,ok:bank.bankContext?.origin===state.origin&&bank.bankContext.projectId===id&&links[q.bankId]?.projectId===id};});
 if(readback.length!==fresh.size)throw Error(`[${id}] readback: ${fresh.size-readback.length} staged records missing from the receipt`);
 if(readback.some(r=>!r.ok))throw Error(`[${id}] readback: ${readback.filter(r=>!r.ok).length} records lack their origin`);
 state.saved={at:new Date().toISOString(),approvedBy,result:{created:result.created,linked:result.linked,applied:result.applied},readback:{records:readback.length,origin:state.origin}};
 // Stage 7 (import v2, Decision 15): a published textbook chapter is accepted.
 if(state.origin==='textbook'){
  const live=read(projectFile(id,root));
  if(live.library?.category!=='textbook'){
   const candidate={...structuredClone(live),library:{...live.library,category:'textbook',acceptedAt:new Date().toISOString(),acceptedRevision:live.revision}};
   const candidateFile=path.join(dir,`accept.r${live.revision}.json`);write(candidateFile,candidate);
   const saved=await publishProject({candidateFile,expectedRevision:live.revision,apply:true,root,record:path.join(dir,`accept.r${live.revision}.record.json`),ledger:path.join(root,RUN_DIR,'ledger.jsonl'),note:'Bank import Stage 7: textbook chapter accepted on publication. Approved: '+approvedBy});
   state.saved.accepted={revision:live.revision,to:saved.to};
  }
 }
 state.status='saved';write(path.join(dir,'state.json'),state);log(`[${id}] published ${result.created} new, ${result.linked} linked; origin ${state.origin} on all ${readback.length}`);
 return state;
}

// Stage 8: one report for the batch.
export function batchReport(ids,{root=ROOT}={}){
 const rows=ids.map(id=>{try{return read(path.join(dirOf(id,root),'state.json'));}catch{return {projectId:id,status:'not run'};}});
 const lines=['# Bank import report','',`${new Date().toISOString()}`,'','| Booklet | Origin | Status | Would publish / published | Linked | Held | Master links | Left out | Follow-ups | Exam tags |','|---|---|---|---|---|---|---|---|---|---|'];
 for(const r of rows){
  const o=r.stage?.outcomes??{};
  lines.push(`| ${r.projectId} | ${r.origin??''} | ${r.status} | ${r.saved?.result?.created??o.created??r.publish??0} | ${o.linked??0} | ${o.held??r.holds?.length??0} | ${o['linked-master']??0} | ${(r.deferred??[]).filter(d=>d.action==='leave-out'||d.reasons?.length&&d.action==='publish').length} | ${(r.edits?.followUps??[]).length} | ${(r.edits?.examTags??[]).length} |`);
 }
 for(const r of rows){
  lines.push('',`## ${r.projectId}`,'');
  if(r.reason)lines.push(`Skipped: ${r.reason}`);
  for(const f of r.edits?.followUps??[])lines.push(`- Follow-up ${f.blockId} (after ${f.previousBlockId}): **${f.decision}**${f.note?' — '+f.note:''}${f.reason?' ('+f.reason+')':''}${/-(?:manual|blocked)$/.test(f.decision)?' — '+studioLink(r.projectId,f.blockId):''}`);
  for(const c of r.edits?.comments??[])lines.push(`- Studio comment on ${c.blockId} (teacher-protected follow-up) — ${studioLink(r.projectId,c.blockId)}`);
  for(const t of r.edits?.examTags??[])lines.push(`- Exam tag ${t.blockId}: ${t.exam}`);
  const held=(r.stage&&fs.existsSync(path.join(root,r.stage.out,'receipt.json')))?read(path.join(root,r.stage.out,'receipt.json')).questions.filter(q=>q.outcome==='held'):r.holds??[];
  for(const h of held)lines.push(`- Held for Use existing / Keep separate in Studio: ${h.sourceBlockId} (matches ${h.sameQuestionAs.join(', ')}) — ${studioLink(r.projectId,h.sourceBlockId)}`);
  const out=(r.deferred??[]).filter(d=>d.action!=='out-of-scope');
  if(out.length)lines.push('','Left out:',...out.map(d=>`- ${d.blockId}: ${(d.reasons??[d.action]).join(', ')}`));
  const scope=(r.deferred??[]).filter(d=>d.action==='out-of-scope').length;if(scope)lines.push('',`Out of scope (Exam questions in a master): ${scope}`);
  if(r.stage?.records)lines.push('',`Origin on every new record: ${r.stage.allCarryOrigin?'yes':'NO'} (${r.stage.records.length} records, bankContext.origin = ${r.origin})`);
 }
 return {rows,markdown:lines.join('\n')+'\n'};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [command,...rest]=process.argv.slice(2),args={};
 for(let i=0;i<rest.length;i++){const k=rest[i].replace(/^--/,'');args[k]=rest[i+1]&&!rest[i+1].startsWith('--')?rest[++i]:true;}
 const ids=String(args.projects??'').split(',').filter(Boolean);
 if(!['run','save','report'].includes(command)||!ids.length){console.error('Usage: node pedagogy/bank-run.mjs run|save|report --projects a,b [--until edits|assessments|stage] [--preview] [--approved-by "QUOTE"]');process.exit(2);}
 if(command==='run')for(const id of ids){const s=await runBooklet(id,{until:args.until??'stage',preview:!!args.preview});console.log(JSON.stringify({projectId:id,status:s.status,publish:s.publish,outcomes:s.stage?.outcomes,allCarryOrigin:s.stage?.allCarryOrigin}));}
 if(command==='save')for(const id of ids){const s=await saveBooklet(id,{approvedBy:args['approved-by']});console.log(JSON.stringify({projectId:id,status:s.status,saved:s.saved}));}
 const report=batchReport(ids),file=path.join(ROOT,RUN_DIR,'report-'+new Date().toISOString().replace(/[:.]/g,'-')+'.md');
 write(file,report.markdown);console.log('Report: '+posix(file));
}
