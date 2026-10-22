import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {isPractice} from '../../src/lib/booklet-flow.js';
import {isTheoryReview} from '../../src/lib/question-bank-eligibility.js';
import {normaliseQuestion,difficultyBandForScore} from '../../src/lib/practice-question-model.js';
import {sharedQuestion} from '../../src/lib/question-sync.js';

export const REASONING_RUBRIC='mathsmap-cognitive-demand-v1';
export const REASONING_PROMPT=`Assess every whole practice question individually on the MathsMap 0–100 cognitive-demand scale for a prepared student taught the relevant methods. Foundation 0–24: direct application; Development 25–49: routine linked procedures; Mastery 50–79: non-trivial connections or reframing; Challenge 80–100: decisive unsignposted insight. No quota or distribution. Read the student task first, then use the solution to detect hidden demand. Count decisions, representation changes and interpretation, not repeated parts, arithmetic bulk or solution length. Account for scaffolding actually supplied. Rate a multipart task by its hardest essential demand, not its average. Fractional numbers alone do not raise the band. Return an integer reasoningScore and a concise, task-specific difficultyReason explaining the decisions required. Never infer a score from an old band, title, page number or default. Do not change skills, content, answers or layout. If essential diagram/task evidence is unavailable, return a blocker rather than guessing.`;
export function practiceRatingBlocks(project){
 return (project.sections??[]).flatMap(section=>section.phase==='teaching'||section.phase==='front-matter'?[]:(section.blocks??[]).filter(block=>isPractice(block)&&!isTheoryReview(block,section)).map(block=>({section,block})));
}
// Canonical node identities and local layout do not change mathematical demand.
// Include answers: an amended solution can reveal a previously missed demand.
export function reasoningTaskHash(block){
 return createHash('sha256').update(JSON.stringify(sharedQuestion({...normaliseQuestion(block),title:''}).content)).digest('hex');
}
export function compatibleRatingHash(block){
 const content=sharedQuestion({...normaliseQuestion(block),title:''}).content;
 if(content.label==null||/^\d+[.)]?$/.test(String(content.label)))content.label=null;
 return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}
// Renumbering a whole question changes no assessed mathematics. Preserve the
// actual assessment and record its original binding when copying that rating.
export function reuseReasoningRating(source,target,rating=source.classification){
 if(!verifiedRating(source,rating)||compatibleRatingHash(source)!==compatibleRatingHash(target))return null;
 const assessment=structuredClone(rating.assessment),taskHash=reasoningTaskHash(target);
 if(assessment.taskHash!==taskHash){assessment.originalTaskHash??=assessment.taskHash;assessment.taskHash=taskHash;}
 return {reasoningScore:rating.reasoningScore,difficulty:rating.difficulty,difficultyReason:rating.difficultyReason,assessment};
}
export function validRawRating(rating){
 return Number.isInteger(rating?.reasoningScore)&&rating.reasoningScore>=0&&rating.reasoningScore<=100&&typeof rating.difficultyReason==='string'&&rating.difficultyReason.trim().length>0&&!/^(?:Score-derived from|Author-created booklet question\.?$)/i.test(rating.difficultyReason.trim())&&rating.difficulty===difficultyBandForScore(rating.reasoningScore);
}
export function verifiedRating(block,rating=block.classification){
 const a=rating?.assessment;
 return validRawRating(rating)&&a?.rubricVersion===REASONING_RUBRIC&&a.taskHash===reasoningTaskHash(block)&&typeof a.model==='string'&&a.model.trim().length>0&&Number.isFinite(Date.parse(a.assessedAt))&&typeof a.evidence==='string'&&a.evidence.length>0;
}
export function assessedRating(block,rating,{model,assessedAt,evidence}){
 if(!validRawRating(rating)||!model||!Number.isFinite(Date.parse(assessedAt))||!evidence)throw Error('Incomplete LLM reasoning assessment for '+block.id);
 return {reasoningScore:rating.reasoningScore,difficulty:difficultyBandForScore(rating.reasoningScore),difficultyReason:rating.difficultyReason.trim(),assessment:{model,assessedAt,rubricVersion:REASONING_RUBRIC,taskHash:reasoningTaskHash(block),evidence}};
}
export function validatePacketRatings(packet){
 for(const {block} of practiceRatingBlocks(packet))if(!validRawRating(block.classification))throw Error('Missing or invalid individual reasoning rating: '+block.id);
}
export function stampPacketRatings(packet,metrics,evidence){
 validatePacketRatings(packet);
 for(const {block} of practiceRatingBlocks(packet)){
  if(verifiedRating(block))continue;
  if(!metrics?.model||!metrics?.endedAt||metrics.externalModelCalls===0)throw Error('Missing LLM assessment provenance: '+block.id);
  block.classification={...block.classification,...assessedRating(block,block.classification,{model:metrics.model,assessedAt:metrics.endedAt,evidence})};
 }
 return packet;
}
// A mapping/validator repair can reuse the original model assessment. Recover
// it before applying repairs, so a changed mathematical task stays stale.
export function restorePacketRatings(packet,{runDir,out}){
 if(practiceRatingBlocks(packet).every(({block})=>verifiedRating(block)))return packet;
 const folder=path.basename(out),assignment=path.basename(path.dirname(out)),match=/^page-(\d+)\.author\.(\d+)$/.exec(folder);
 const file=path.join(runDir,'semantic-packets/attempt-events.jsonl');if(!fs.existsSync(file))return packet;
 const events=fs.readFileSync(file,'utf8').split('\n').filter(Boolean).flatMap(line=>{try{return [JSON.parse(line)];}catch{return [];}});
 const event=events.findLast(e=>e.stage==='author'&&e.metrics?.model&&e.metrics?.endedAt&&e.metrics.externalModelCalls!==0&&(match?e.page===Number(match[1])&&e.attempt===Number(match[2]):e.assignmentId===assignment&&e.attempt===Number(folder)));
 // Recover only ratings that already satisfy the rubric. An invalid sibling
 // must remain unverified and available for a real scoped assessment repair;
 // ordinary packet validation still rejects it until that repair is complete.
 if(event)for(const {block} of practiceRatingBlocks(packet))if(validRawRating(block.classification)&&!verifiedRating(block))stampPacketRatings({sections:[{phase:'practice',blocks:[block]}]},event.metrics,path.relative(process.cwd(),path.join(out,'generation.json')).replaceAll('\\','/'));
 restoreLocalRepairRatings(packet,{runDir,out,seen:new Set()});
 return packet;
}
const fileHash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const rawRating=block=>{const {assessment,...rating}=block.classification??{};return rating;};
const sameRatingTask=(a,b)=>reasoningTaskHash(a)===reasoningTaskHash(b)&&isDeepStrictEqual(rawRating(a),rawRating(b));
function checkedRunArtifact(runDir,artifact){
 const file=fs.realpathSync(artifact.path),relative=path.relative(fs.realpathSync(runDir),file);
 if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||fileHash(file)!==artifact.hash)throw Error('Changed or foreign rating provenance');
 return file;
}
function matchingRepair(decision,record){return decision?.action==='attempt-patches'&&decision.repairs?.some(r=>r.request.page===record.context.page&&r.request.fromAttempt===record.context.fromAttempt&&r.request.assignmentId===record.context.assignmentId&&isDeepStrictEqual(r.patches,record.patches));}
// Historical local repairs retained the actual response and call metrics but
// omitted their link from local-repair.json. Recover only an exact matching
// decision; never use a similar question or an earlier rating for changed maths.
function repairAssessment(runDir,record){
 const candidates=record.assessment?[record.assessment]:fs.readdirSync(runDir).filter(n=>n.startsWith('background-repair-')).flatMap(n=>{
  const dir=path.join(runDir,n),file=path.join(dir,'decision.json');
  if(!fs.existsSync(file)||!matchingRepair(JSON.parse(fs.readFileSync(file,'utf8')),record))return [];
  return fs.readdirSync(dir).filter(f=>/^assessment-provenance-\d+\.json$/.test(f)).map(f=>({path:path.join(dir,f),hash:fileHash(path.join(dir,f))}));
 });
 for(const artifact of candidates){
  const file=checkedRunArtifact(runDir,artifact),proof=JSON.parse(fs.readFileSync(file,'utf8')),m=proof.metrics;
  if(m?.provider!=='codex'||m.externalModelCalls===0||!m.callId||!m.usage||!m.model||!Number.isFinite(Date.parse(m.endedAt)))continue;
  const response=fs.realpathSync(proof.response),relative=path.relative(fs.realpathSync(runDir),response);
  if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Foreign rating response');
  const responseHash=fileHash(response),text=fs.readFileSync(response,'utf8').trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
  if(!matchingRepair(JSON.parse(text),record))continue;
  return {model:m.model,assessedAt:m.endedAt,evidence:path.relative(process.cwd(),response).replaceAll('\\','/'),verify(){checkedRunArtifact(runDir,artifact);if(fileHash(response)!==responseHash)throw Error('Rating response changed');}};
 }
}
export function bindRepairAssessment(packet,record,{runDir}){
 if(!record.assessment)return packet;
 const assessment=repairAssessment(runDir,record);
 if(!assessment)throw Error('No exact actual model assessment for local repair');
 for(const patch of record.patches.filter(p=>p.field==='/classification')){
  const block=practiceRatingBlocks(packet).find(({block})=>block.id===patch.targetId)?.block;
  if(!block||!isDeepStrictEqual(rawRating(block),patch.corrected))throw Error('Assessed classification differs from applied repair');
  assessment.verify();block.classification={...block.classification,...assessedRating(block,block.classification,assessment)};
 }
 return packet;
}
function restoreLocalRepairRatings(packet,{runDir,out,seen}){
 if(practiceRatingBlocks(packet).every(({block})=>verifiedRating(block)))return;
 const current=fs.realpathSync(out),relative=path.relative(fs.realpathSync(runDir),current);
 if(relative.startsWith('..')||path.isAbsolute(relative)||seen.has(current)||seen.size>=64)throw Error('Invalid rating repair ancestry');
 seen.add(current);
 const local=path.join(current,'local-repair.json'),replay=path.join(current,'revalidation.json');
 if(!fs.existsSync(local)&&!fs.existsSync(replay))return;
 const record=fs.existsSync(local)?JSON.parse(fs.readFileSync(local,'utf8')):null;
 const artifacts=record?[...record.context.source,...record.context.evidence,...record.review.artifacts]:[JSON.parse(fs.readFileSync(replay,'utf8')).modelOutput];
 const files=artifacts.map(a=>checkedRunArtifact(runDir,a));
 const sourceFile=record?files.find(f=>path.basename(f)==='generation.json'):files[0];
 if(!sourceFile)throw Error('Missing original rating generation');
 const generation=JSON.parse(fs.readFileSync(sourceFile,'utf8')),source=structuredClone((generation.packets??[generation]).find(p=>p.pageNumber===packet.pageNumber));
 if(!source)throw Error('Rating ancestry page changed');
 // An actual original author call is restored before walking local ancestry.
 const sourceOut=path.dirname(sourceFile),eventsFile=path.join(runDir,'semantic-packets/attempt-events.jsonl');
 const events=fs.existsSync(eventsFile)?fs.readFileSync(eventsFile,'utf8').split('\n').filter(Boolean).map(s=>JSON.parse(s)):[];
 const folder=path.basename(sourceOut),assignment=path.basename(path.dirname(sourceOut)),match=/^page-(\d+)\.author\.(\d+)$/.exec(folder);
 const event=events.findLast(e=>e.stage==='author'&&e.metrics?.model&&e.metrics?.endedAt&&e.metrics.externalModelCalls!==0&&(match?e.page===Number(match[1])&&e.attempt===Number(match[2]):e.assignmentId===assignment&&e.attempt===Number(folder)));
 if(event)for(const {block}of practiceRatingBlocks(source))if(validRawRating(block.classification)&&!verifiedRating(block))stampPacketRatings({sections:[{phase:'practice',blocks:[block]}]},event.metrics,path.relative(process.cwd(),sourceFile).replaceAll('\\','/'));
 restoreLocalRepairRatings(source,{runDir,out:sourceOut,seen});
 const originals=new Map(practiceRatingBlocks(source).map(({block})=>[block.id,block]));
 for(const {block}of practiceRatingBlocks(packet)){const before=originals.get(block.id);if(!verifiedRating(block)&&before&&verifiedRating(before)&&sameRatingTask(block,before))block.classification.assessment=structuredClone(before.classification.assessment);}
 if(record){
  const ratingPatches=record.patches.filter(p=>p.field==='/classification');
  const pending=practiceRatingBlocks(packet).filter(({block})=>!verifiedRating(block)&&validRawRating(block.classification)&&ratingPatches.some(p=>p.targetId===block.id&&isDeepStrictEqual(rawRating(block),p.corrected)));
  if(pending.length){
   const saved=JSON.parse(fs.readFileSync(path.join(current,'generation.json'),'utf8')),savedPacket=(saved.packets??[saved]).find(p=>p.pageNumber===packet.pageNumber),savedBlocks=new Map(practiceRatingBlocks(savedPacket).map(({block})=>[block.id,block]));
   const assessment=repairAssessment(runDir,record);
   if(assessment)for(const {block}of pending)if(savedBlocks.has(block.id)&&sameRatingTask(block,savedBlocks.get(block.id))){assessment.verify();block.classification={...block.classification,...assessedRating(block,block.classification,assessment)};}
  }
 }
 for(const artifact of artifacts)checkedRunArtifact(runDir,artifact);
}
export function recoverStoredRatingFile(out,targets,cache,{root,cacheDir}){
 const inputFile=path.join(out,'input.json'),rawFile=path.join(out,'last-message.txt'),metricsFile=path.join(out,'metrics.json');
 if(![inputFile,rawFile,metricsFile].every(file=>fs.existsSync(file)))return 0;
 let input,result,metrics;try{const payload=JSON.parse(fs.readFileSync(inputFile,'utf8'));input=Array.isArray(payload)?payload:payload.questions;result=JSON.parse(fs.readFileSync(rawFile,'utf8').trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));metrics=JSON.parse(fs.readFileSync(metricsFile,'utf8'));}catch{return 0;}
 if(!Array.isArray(input)||!Array.isArray(result.ratings)||typeof metrics.model!=='string'||!metrics.model.trim()||!Number.isFinite(Date.parse(metrics.endedAt))||metrics.externalModelCalls===0)return 0;
 let recovered=0;
 for(const source of input){
  const id=source.sourceId??source.id,block=targets.get(id),answers=result.ratings.filter(r=>r.id===source.id),raw=answers[0];
  if(!block||answers.length!==1||source.taskHash!==reasoningTaskHash(block)||raw.taskHash!==undefined&&raw.taskHash!==source.taskHash||raw.blocker)continue;
  const rating={...raw,difficulty:difficultyBandForScore(raw.reasoningScore)};if(!validRawRating(rating))continue;
  const assessed=assessedRating(block,rating,{model:metrics.model,assessedAt:metrics.endedAt,evidence:path.relative(root,rawFile).replaceAll('\\','/')});
  cache.set(source.taskHash,assessed);fs.mkdirSync(cacheDir,{recursive:true});fs.writeFileSync(path.join(cacheDir,source.taskHash+'.json'),JSON.stringify(assessed,null,2)+'\n');targets.delete(id);recovered++;
 }
 return recovered;
}
export function ratingCoverage(project){
 const rows=practiceRatingBlocks(project),missing=rows.filter(({block})=>!verifiedRating(block));
 return {total:rows.length,verified:rows.length-missing.length,missing:missing.map(({block})=>block.id)};
}
export function requireReasoningCoverage(project){
 const report=ratingCoverage(project);
 if(report.missing.length)throw Error(`Incomplete LLM reasoning ratings: ${report.missing.length}/${report.total}; ${report.missing.slice(0,8).join(', ')}`);
 return report;
}
