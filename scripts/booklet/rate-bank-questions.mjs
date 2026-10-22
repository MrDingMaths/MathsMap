import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isSelectableBankQuestion} from '../../src/lib/question-bank-eligibility.js';
import {difficultyBandForScore} from '../../src/lib/practice-question-model.js';
import {REASONING_PROMPT,reasoningTaskHash,verifiedRating,assessedRating,practiceRatingBlocks,compatibleRatingHash,reuseReasoningRating,recoverStoredRatingFile} from './reasoning-ratings.mjs';
import {revisionHash,withBankLock,writeTransaction,bankManifestEntry,syncLinks,readSyncJson} from './bank-sync.mjs';
import {runAstraTask} from './codex-transcription.mjs';
import {transcriptionConfiguration} from './transcription-settings.mjs';
import {runBoundedJobs,withWorkerSlot} from './worker-pool.mjs';
import {ratingBatches,validateRatingReply,studioProjects,canonicalRun,supplementalRatingEvidence} from './rating-input.mjs';
import {ratingImageEvidence} from './rating-images.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const json=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');};
const configuration=transcriptionConfiguration({reasoningOverride:{effort:'low',reason:'User-approved Studio practice-question rating policy, 21 October 2026'}});
export function selectableBank(root=ROOT){
 const bankRoot=path.join(root,'booklets/question-bank');if(!fs.existsSync(bankRoot))return [];
 return fs.readdirSync(bankRoot).filter(f=>f.endsWith('.json')&&f!=='manifest.json').map(f=>read(path.join(bankRoot,f))).filter(isSelectableBankQuestion);
}
export function bankRatingCoverage(root=ROOT){
 const questions=selectableBank(root),missing=questions.filter(q=>!verifiedRating(q)).map(q=>q.id);
 return {total:questions.length,verified:questions.length-missing.length,missing};
}
export async function saveBankReasoningRatings(updates,{root=ROOT}={}){
 return withBankLock(async()=>{
  const bankRoot=path.join(root,'booklets/question-bank'),links=await syncLinks(bankRoot),beforeLinks=revisionHash(links),entries=[],updated=[],before=new Map();
  for(const {bankId,expectedRevision,rating} of updates){
   if(!/^[\w.-]+$/.test(bankId)||['.','..'].includes(bankId))throw Error('Invalid bank reference');
   const file=path.join(bankRoot,bankId+'.json'),current=await readSyncJson(file);
   if(!current||revisionHash(current)!==expectedRevision||!isSelectableBankQuestion(current)||!verifiedRating(current,rating))throw Error('Bank question changed during assessment: '+bankId);
   const metadata={reasoningScore:rating.reasoningScore,difficulty:rating.difficulty,difficultyReason:rating.difficultyReason,assessment:structuredClone(rating.assessment)};
   const next={...current,classification:{...current.classification,...metadata},updatedAt:new Date().toISOString()};
   entries.push([path.join(bankRoot,'.revisions',bankId,expectedRevision+'.json'),current],[file,next]);before.set(file,expectedRevision);updated.push(next);
   if(links[bankId])links[bankId]={...links[bankId],bankRevision:revisionHash(next)};
  }
  if(!updated.length)return;
  entries.push(await bankManifestEntry(bankRoot,updated),[path.join(bankRoot,'.sync/links.json'),links]);
  for(const [file,hash]of before)if(revisionHash(await readSyncJson(file))!==hash)throw Error('Bank changed before rating publication');
  if(revisionHash(await syncLinks(bankRoot))!==beforeLinks)throw Error('Bank ownership changed before rating publication');
  await writeTransaction(entries);
 });
}
export async function rateBankQuestions({root=ROOT,apply=false,limit=Infinity,supplementalEvidence,runner=runAstraTask,onEvent=event=>console.log(JSON.stringify(event))}={}){
 if(!apply)return bankRatingCoverage(root);
 const run=path.join(root,'.booklet-work/reasoning-ratings'),cacheDir=path.join(run,'assessments'),known=new Map(),compatible=new Map(),totals={assessed:0,reused:0,blocked:[],calls:0};
 if(fs.existsSync(cacheDir))for(const name of fs.readdirSync(cacheDir).filter(f=>f.endsWith('.json'))){const rating=read(path.join(cacheDir,name));if(rating.assessment?.taskHash)known.set(rating.assessment.taskHash,rating);}
 const recoveryTargets=new Map(selectableBank(root).filter(q=>!verifiedRating(q)&&!verifiedRating(q,known.get(reasoningTaskHash(q)))).map(q=>[q.id,q])),callRoot=path.join(run,'bank-calls');let recovered=0;
 if(fs.existsSync(callRoot))for(const name of fs.readdirSync(callRoot))recovered+=recoverStoredRatingFile(path.join(callRoot,name),recoveryTargets,known,{root,cacheDir});
 if(recovered)onEvent({event:'recovered-bank-assessments',count:recovered});
 const projects=studioProjects(root),projectById=new Map(projects.map(({project})=>[project.id,project])),owners=await syncLinks(path.join(root,'booklets/question-bank'));
 for(const {project}of projects)for(const {block}of practiceRatingBlocks(project))if(verifiedRating(block)){known.set(reasoningTaskHash(block),block.classification);compatible.set(compatibleRatingHash(block),block);}
 for(const q of selectableBank(root))if(verifiedRating(q)){known.set(reasoningTaskHash(q),q.classification);compatible.set(compatibleRatingHash(q),q);}
 const pending=selectableBank(root).filter(q=>!verifiedRating(q)),reuse=[],needs=[];
 for(const block of pending){const source=compatible.get(compatibleRatingHash(block)),rating=known.get(reasoningTaskHash(block))??(source?reuseReasoningRating(source,block):null),row={block,section:{title:block.title},supplementalEvidence:supplementalRatingEvidence(block,supplementalEvidence),revision:revisionHash(block)};if(rating&&verifiedRating(block,rating))reuse.push({...row,rating});else needs.push(row);}
 const groups=new Map();
 for(const row of needs){const owner=projectById.get(owners[row.block.id]?.projectId),runDir=owner?canonicalRun(owner,root):path.join(run,'bank-worker-context');if(!groups.has(runDir))groups.set(runDir,[]);groups.get(runDir).push(row);}
 const jobs=[...groups].flatMap(([runDir,rows])=>ratingBatches(rows).map(batch=>({runDir,rows:batch}))).map((job,i)=>({...job,id:'bank-'+i}));
 onEvent({event:'bank-inventory',total:selectableBank(root).length,missing:pending.length,reusable:reuse.length,batches:jobs.length});
 const publish=async(rows,kind)=>{
  const updates=[];
  for(const row of rows){const current=read(path.join(root,'booklets/question-bank',row.block.id+'.json'));if(verifiedRating(current))continue;
   if(revisionHash(current)!==row.revision){totals.blocked.push({bankId:row.block.id,reason:'Bank changed during assessment'});continue;}
   updates.push({bankId:row.block.id,expectedRevision:row.revision,rating:row.rating});
  }
  if(updates.length){await saveBankReasoningRatings(updates,{root});totals[kind]+=updates.length;}
 };
 await publish(reuse,'reused');
 let environmentFailed=false;
 const results=await runBoundedJobs(jobs,async({rows,id,runDir})=>{
  if(environmentFailed||totals.calls>=limit){totals.blocked.push({job:id,reason:environmentFailed?'Worker environment unavailable':'Call limit reached'});return;}
  const out=path.join(run,'bank-calls',Date.now()+'-'+id);totals.calls++;
  const evidence=ratingImageEvidence(rows,{root,out}),questions=rows.map((row,i)=>({...row.input,sourceId:row.input.id,id:'Q'+(i+1)})),aliases=new Map(questions.map(q=>[q.id,q.sourceId])),payload={questions,imageEvidence:evidence.evidence};
  const promptPayload={...payload,questions:questions.map(({sourceId,...question})=>question)};
  const prompt=REASONING_PROMPT+'\nAssess these selectable Studio bank questions using their supplied worked methods. Do not delegate. Attached original images follow imageEvidence order. Return the short question IDs Q1, Q2, etc. The caller binds task hashes; do not return hashes. Return only JSON: {"ratings":[{"id":"exact ID","reasoningScore":integer,"difficultyReason":"specific rationale"} OR {"id":"exact ID","blocker":"missing essential evidence"}]}.\n'+JSON.stringify(promptPayload);
  json(path.join(out,'input.json'),payload);let reply;
  try{reply=await withWorkerSlot(runDir,{stage:'bank-reasoning-rating'},()=>runner({cwd:root,runDir:path.join(run,'bank-worker-context'),configuration,prompt,images:evidence.images,out,profile:'review',stage:'bank-reasoning-rating'}));}catch(error){if(!error.metrics?.usage)environmentFailed=true;throw error;}
  json(path.join(out,'metrics.json'),reply.metrics);
  const normalized={...reply.result,ratings:reply.result.ratings?.map(r=>({...r,id:aliases.get(r.id)??r.id}))};
  const ratings=validateRatingReply(normalized,rows),assessed=[];
  for(const raw of ratings){const row=rows.find(row=>row.block.id===raw.id);if(raw.blocker){totals.blocked.push({bankId:raw.id,reason:raw.blocker});continue;}
   const rating=assessedRating(row.block,{...raw,difficulty:difficultyBandForScore(raw.reasoningScore)},{model:reply.metrics.model,assessedAt:reply.metrics.endedAt,evidence:path.relative(root,path.join(out,'last-message.txt')).replaceAll('\\','/')});
   json(path.join(cacheDir,row.input.taskHash+'.json'),rating);assessed.push({...row,rating});
  }
  await publish(assessed,'assessed');onEvent({event:'bank-assessed',count:assessed.length,assessed:totals.assessed,reused:totals.reused,calls:totals.calls});
 },{concurrency:3});
 for(const r of results)if(!r.ok)totals.blocked.push({job:r.id,reason:r.error.message});
 const report={...totals,coverage:bankRatingCoverage(root)};json(path.join(run,'latest-bank-report.json'),report);return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const at=process.argv.indexOf('--evidence'),report=await rateBankQuestions({apply:process.argv.includes('--apply'),supplementalEvidence:at>=0?read(process.argv[at+1]):undefined});console.log(JSON.stringify(report,null,2));if(report.coverage?.missing.length)process.exitCode=2;
}
