import {HOUSE_STYLE_PROMPT} from '../../src/lib/booklet-house-style.js';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {TRANSCRIPTION_DEFAULT,REVIEW_DEFAULT,requireCurrentTranscription,transcriptionConfiguration,reviewConfiguration,requireCurrentReview} from './transcription-settings.mjs';
import {reconcileIds} from '../agy/lib/agy-run.mjs';
import {withWorkerSlot} from './worker-pool.mjs';
import {StringDecoder} from 'node:string_decoder';
import {withWorkerAuthorizationContext} from './worker-authorization-context.mjs';

function toolDiagnosticCounter(){
 const decoder=new StringDecoder('utf8');let pending='',rejected=0,unclassified=0,complete=false;const reasons={};
 const line=text=>{
  const clean=text.replace(/\u001b\[[0-9;]*m/g,''),match=clean.match(/^\d{4}-\d\d-\d\dT\S+\s+(?:ERROR|WARN)\s+\S*tools\S*:\s+(?:error=)?[\w.:/-]+ failed:\s*(.*)$/);
  if(!match)return;
  if(/\brejected:\s*blocked by policy[\s\\"')\]}]*$/i.test(match[1])){rejected++;reasons['blocked-by-policy']=(reasons['blocked-by-policy']??0)+1;}
  else unclassified++;
 };
 return {write(chunk){pending+=decoder.write(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));let end;while((end=pending.indexOf('\n'))>=0){line(pending.slice(0,end));pending=pending.slice(end+1);}},
  finish(){if(complete)return;pending+=decoder.end();if(pending.trim())line(pending);pending='';complete=true;},
  snapshot(){return {rejectedToolAttempts:complete||rejected?rejected:null,rejectedToolReasons:{...reasons},unclassifiedToolFailures:complete||unclassified?unclassified:null,stderrCaptured:complete,missingRejectedToolCounts:!complete||unclassified>0?1:0};}};
}

// Read existing trial diagnostics without regenerating work or returning command
// bodies. A missing/unsupported diagnostic is unavailable, never a zero total.
export function readToolDiagnostics(file){
 const counter=toolDiagnosticCounter();if(!fs.existsSync(file))return counter.snapshot();
 const fd=fs.openSync(file,'r'),buffer=Buffer.alloc(64*1024);try{let size;while((size=fs.readSync(fd,buffer,0,buffer.length,null)))counter.write(buffer.subarray(0,size));counter.finish();return counter.snapshot();}finally{fs.closeSync(fd);}
}

// Legacy export names remain; review and transcription have independent defaults.
const productionProfile=Object.freeze({model:TRANSCRIPTION_DEFAULT.model,effort:TRANSCRIPTION_DEFAULT.effort});
const reviewProfile=Object.freeze({model:REVIEW_DEFAULT.model,effort:REVIEW_DEFAULT.effort});
export const ASTRA_PROFILES=Object.freeze({transcription:productionProfile,review:reviewProfile,coordinator:productionProfile});
const BOUNDED_WORKER_INSTRUCTIONS='Bounded worker execution: you already occupy one slot in the shared three-worker pool. Complete only the assigned task yourself. Do not spawn sub-agents, delegate work, or launch another Codex CLI, model runner or model/API call through any tool or shell command. Only the parent coordinator schedules workers. If the assigned evidence or task cannot be completed, report the specific blocker in the required result rather than delegating. Use read-only source access and return the required final response; the caller writes the result.';
export function astraCommandArgs({cwd,images=[],raw,profile='transcription',configuration}){
 if(!ASTRA_PROFILES[profile])throw Error('Unknown booklet worker profile');
 configuration??=profile==='review'?reviewConfiguration():transcriptionConfiguration();
 if(profile==='review')requireCurrentReview(configuration);else requireCurrentTranscription(configuration);
 const args=['exec','--ephemeral','--ignore-user-config','--skip-git-repo-check','--sandbox','read-only','-C',cwd,'--model',configuration.model,'-c',`model_reasoning_effort="${configuration.effort}"`,'-c','service_tier="default"','-c','features.fast_mode=false','-c','features.multi_agent=false','-c','features.multi_agent_v2=false','--json','--output-last-message',raw];
 for(const image of images)args.push('--image',image);args.push('-');return args;
}

export const PEDAGOGY_PROMPT_LIMIT=300000;
export const REVIEW_PROMPT_LIMIT=200000;
export async function runAstraTask({cwd,runDir=cwd,prompt,images=[],out,profile='review',configuration,stage=profile,timeoutMs=900000,onProgress=()=>{},signal,oversizeReason,authorizationContext,authorizationScope},{spawnProcess=spawn}={}){
 if(!ASTRA_PROFILES[profile])throw Error('Unknown booklet worker profile');
 prompt=withWorkerAuthorizationContext(prompt,{authorizationContext,authorizationScope});
 if(authorizationScope&&JSON.stringify([...images].sort())!==JSON.stringify([...authorizationScope.attachments].sort()))throw Error('Authorization attachments differ from actual worker images');
 // Pedagogy prompts are one topic plus budgeted earlier teaching (LIMITS in
 // pedagogy/review.mjs, at most ~170k characters). Wrapping them in the whole
 // booklet repeats ~270k tokens per call; refuse before a slot or model call.
 if(/^pedagogy-/.test(stage)&&typeof prompt==='string'&&prompt.length>PEDAGOGY_PROMPT_LIMIT)throw Error(`Pedagogy prompt of ${prompt.length} characters exceeds ${PEDAGOGY_PROMPT_LIMIT}; send the topic prompt as built, not the whole booklet`);
 // Any other review wrapped around a whole booklet is refused by size, whatever its
 // stage is called. A deliberate exception names its reason, which the metrics record.
 if(profile==='review'&&typeof prompt==='string'&&prompt.length>REVIEW_PROMPT_LIMIT&&!oversizeReason?.trim())throw Error(`Review prompt of ${prompt.length} characters exceeds ${REVIEW_PROMPT_LIMIT}; send a task view or split at a topic boundary, or pass a named oversizeReason`);
 if(configuration?.provider&&configuration.provider!==TRANSCRIPTION_DEFAULT.provider)throw Error('A benchmark arm cannot use the Codex runner; supply its explicit relay runner');
 // The separate skill-content campaign keeps its explicitly recorded settings.
 // Its existing stage names are not booklet-review model selections.
 const contentReview=profile==='review'&&(stage==='content-review'||stage.startsWith('content-bounded-'));
 const executionProfile=contentReview?'transcription':profile;
 const manifestFile=path.join(runDir,'manifest.json');
 if(executionProfile==='review'){
  // Borrow the run's pool/evidence, not its historical transcription model.
  // The manifest and its model/input pins remain byte-for-byte untouched.
  configuration??=reviewConfiguration();requireCurrentReview(configuration);
 }else if(fs.existsSync(manifestFile)){
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));requireCurrentTranscription(manifest);
  const recorded=transcriptionConfiguration(manifest);
  if(configuration&&JSON.stringify(transcriptionConfiguration(requireCurrentTranscription(configuration)))!==JSON.stringify(recorded))throw Error('Worker configuration differs from recorded run; prepare a fresh run');
  configuration=recorded;
 }else configuration??=transcriptionConfiguration();
 if(executionProfile!=='review')requireCurrentTranscription(configuration);if(configuration.provider!==TRANSCRIPTION_DEFAULT.provider)throw Error('A benchmark arm cannot use the Codex runner; supply its explicit relay runner');
 if(authorizationScope&&(authorizationScope.destination.provider!=='openai'||authorizationScope.destination.model!==configuration.model||authorizationScope.destination.effort!==configuration.effort))throw Error('Authorization destination differs from actual Codex worker');
 const callId=randomUUID();
 return withWorkerSlot(runDir,{callId,stage,profile},lease=>invokeAstra({cwd,prompt,images,out,profile,executionProfile,configuration,stage,timeoutMs,onProgress,signal,callId,queueWaitMs:lease.queueWaitMs,oversizeReason},spawnProcess),{signal});
}
export async function runCodexTranscription(options){return runAstraTask({...options,profile:'transcription'},options.execution);}

async function invokeAstra({cwd,prompt,images,out,profile,executionProfile=profile,configuration,stage,timeoutMs,onProgress,signal,callId,queueWaitMs,oversizeReason},spawnProcess){
 fs.mkdirSync(out,{recursive:true});
 const raw=path.join(out,'last-message.txt'),start=Date.now();let usage=null,observedModel=null,observedEffort=null,sessionId=null,completedCapture=false;const toolIds=new Set(),toolDiagnostics=toolDiagnosticCounter();
 const args=astraCommandArgs({cwd,images,raw,profile:executionProfile,configuration});
 // Exclusive creation makes a failed attempt visible and prevents silent retries.
 const eventFd=fs.openSync(path.join(out,'events.jsonl'),'wx'),errorFd=fs.openSync(path.join(out,'stderr.txt'),'wx');
 const metrics=()=>({provider:'codex',...configuration,requestedModel:configuration.model,requestedEffort:configuration.effort,profile,executionProfile,role:profile,stage,serviceTier:'default',observedModel,observedEffort,sessionId,callId,usage,promptCharacters:prompt.length,...(oversizeReason?{oversizeReason}:{}),toolCalls:toolIds.size,completedToolCalls:completedCapture||toolIds.size?toolIds.size:null,missingCompletedToolCounts:completedCapture?0:1,...toolDiagnostics.snapshot(),toolCountingNote:'toolCalls retains observed completion events. Completed events and recognized stderr rejection diagnostics are separate observations and may overlap; neither establishes all attempted calls.',queueWaitMs,startedAt:new Date(start).toISOString(),endedAt:new Date().toISOString(),elapsedMs:Date.now()-start});
 try {
  await new Promise((resolve,reject)=>{
   const child=spawnProcess(process.env.BOOKLET_CODEX_BIN??'codex',args,{cwd,windowsHide:true,shell:false,stdio:['pipe','pipe','pipe']});let buffer='',failure=null;
   const timer=setTimeout(()=>{failure=new Error(`Codex ${stage} invocation exceeded ${timeoutMs} ms`);child.kill();},timeoutMs);
   const consume=line=>{let e;try{e=JSON.parse(line);}catch{return;}if(e.usage)usage=e.usage;const model=e.model??e.turn?.model,effort=e.reasoning_effort??e.reasoning?.effort??e.effort??e.turn?.reasoning_effort;if(typeof model==='string')observedModel=model;if(typeof effort==='string')observedEffort=effort;if(e.type==='thread.started')sessionId=e.thread_id??e.session_id??null;
    if(e.type==='item.completed'&&['command_execution','mcp_tool_call','tool_call','web_search'].includes(e.item?.type))toolIds.add(e.item.id??JSON.stringify(e.item));try{onProgress(e);}catch(error){failure=error;child.kill();}};
   const abort=()=>{failure=signal.reason instanceof Error?signal.reason:new Error('Codex worker aborted');child.kill();};
   signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
   child.stdout.on('data',chunk=>{fs.writeSync(eventFd,chunk);buffer+=chunk;let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);consume(line);}});
   child.stderr.on('data',chunk=>{fs.writeSync(errorFd,chunk);toolDiagnostics.write(chunk);});child.stdin.on('error',e=>{failure=e;});child.on('error',e=>{failure=e;});
   child.on('close',code=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);if(buffer.trim())consume(buffer);completedCapture=true;toolDiagnostics.finish();if(failure)reject(failure);else if(code!==0)reject(new Error('Codex exited '+code));else resolve();});
   child.stdin.end(BOUNDED_WORKER_INSTRUCTIONS+'\n\n'+prompt);
  });
  if(observedModel&&observedModel!==configuration.model)throw Error(`Worker reported model ${observedModel}, requested ${configuration.model}; no model substitution is accepted`);
  if(observedEffort&&observedEffort!==configuration.effort)throw Error(`Worker reported effort ${observedEffort}, requested ${configuration.effort}; no reasoning substitution is accepted`);
  const result=JSON.parse(fs.readFileSync(raw,'utf8').trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));return{result,metrics:metrics()};
 }catch(error){error.metrics=metrics();throw error;}finally{fs.closeSync(eventFd);fs.closeSync(errorFd);}
}

export async function runTranscriptionTasks(dir,configuration=TRANSCRIPTION_DEFAULT,{runner=runCodexTranscription}={}) {
 requireCurrentTranscription(configuration);const results=[];
 for(const file of fs.readdirSync(dir).filter(f=>/^task-\d+\.md$/.test(f)).sort()){
  const stem=file.slice(0,-3),target=path.join(dir,stem+'.result.json');if(fs.existsSync(target)){results.push({task:stem,skipped:true});continue;}
  try{
   const prompt=fs.readFileSync(path.join(dir,file),'utf8')+'\n\n'+HOUSE_STYLE_PROMPT+'\n\n'+SOLUTION_CONVENTIONS+'\n\nExecution: use read-only access to the supplied source evidence. Return the required JSON object as your final response; the caller writes the result file. Do not write files. House style: no O label at Cartesian origins; align question numbers with their stem. Recreate mathematical diagrams in TikZ. No model fallback.';
   const reply=await runner({cwd:dir,configuration,prompt,out:path.join(dir,stem+'.codex'),images:fs.readdirSync(dir).filter(f=>f.endsWith('.png')).map(f=>path.join(dir,f))});
   const ids=JSON.parse(fs.readFileSync(path.join(dir,stem+'.ids.json'),'utf8')).ids;
   const checked=reconcileIds(ids,reply.result);if(checked.missing.length)throw new Error('Missing expected ids: '+checked.missing.join(', '));
   fs.writeFileSync(target,JSON.stringify(reply.result,null,2),{flag:'wx'});results.push({task:stem,ok:true,metrics:reply.metrics});
  }catch(error){results.push({task:stem,ok:false,error:error.message,metrics:error.metrics});}
  fs.appendFileSync(path.join(dir,'ledger.jsonl'),JSON.stringify({...results.at(-1),at:new Date().toISOString()})+'\n');
 }
 return{ok:results.every(r=>r.ok||r.skipped),results,...configuration};
}
import { SOLUTION_CONVENTIONS } from './solution-conventions.mjs';
