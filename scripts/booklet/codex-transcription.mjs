import {HOUSE_STYLE_PROMPT} from '../../src/lib/booklet-house-style.js';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {TRANSCRIPTION_DEFAULT,requireCurrentTranscription} from './transcription-settings.mjs';
import {reconcileIds} from '../agy/lib/agy-run.mjs';
import {withWorkerSlot} from './worker-pool.mjs';

export const ASTRA_PROFILES=Object.freeze({transcription:Object.freeze({model:'gpt-6-astra',effort:'low'}),review:Object.freeze({model:'gpt-6-astra',effort:'high'}),coordinator:Object.freeze({model:'gpt-6-astra',effort:'low'})});
export function astraCommandArgs({cwd,images=[],raw,profile='transcription'}){
 const configuration=ASTRA_PROFILES[profile];if(!configuration)throw Error('Unknown Astra worker profile');
 const args=['exec','--ephemeral','--ignore-user-config','--skip-git-repo-check','--sandbox','read-only','-C',cwd,'--model',configuration.model,'-c',`model_reasoning_effort="${configuration.effort}"`,'-c','service_tier="default"','-c','features.fast_mode=false','--json','--output-last-message',raw];
 for(const image of images)args.push('--image',image);args.push('-');return args;
}

export async function runAstraTask({cwd,runDir=cwd,prompt,images=[],out,profile='review',stage=profile,timeoutMs=900000,onProgress=()=>{},signal},{spawnProcess=spawn}={}){
 if(!ASTRA_PROFILES[profile])throw Error('Unknown Astra worker profile');
 const callId=randomUUID();
 return withWorkerSlot(runDir,{callId,stage,profile},lease=>invokeAstra({cwd,prompt,images,out,profile,stage,timeoutMs,onProgress,signal,callId,queueWaitMs:lease.queueWaitMs},spawnProcess),{signal});
}
export async function runCodexTranscription(options){return runAstraTask({...options,profile:'transcription'},options.execution);}

async function invokeAstra({cwd,prompt,images,out,profile,stage,timeoutMs,onProgress,signal,callId,queueWaitMs},spawnProcess){
 fs.mkdirSync(out,{recursive:true});
 const raw=path.join(out,'last-message.txt'),start=Date.now();let usage=null,observedModel=null,sessionId=null;const toolIds=new Set();
 const args=astraCommandArgs({cwd,images,raw,profile});
 // Exclusive creation makes a failed attempt visible and prevents silent retries.
 const eventFd=fs.openSync(path.join(out,'events.jsonl'),'wx'),errorFd=fs.openSync(path.join(out,'stderr.txt'),'wx');
 const metrics=()=>({provider:'codex',...ASTRA_PROFILES[profile],requestedModel:ASTRA_PROFILES[profile].model,profile,role:profile,stage,serviceTier:'default',observedModel,sessionId,callId,usage,toolCalls:toolIds.size,queueWaitMs,startedAt:new Date(start).toISOString(),endedAt:new Date().toISOString(),elapsedMs:Date.now()-start});
 try {
  await new Promise((resolve,reject)=>{
   const child=spawnProcess(process.env.BOOKLET_CODEX_BIN??'codex',args,{cwd,windowsHide:true,shell:false,stdio:['pipe','pipe','pipe']});let buffer='',failure=null;
   const timer=setTimeout(()=>{failure=new Error(`Astra ${stage} invocation exceeded ${timeoutMs} ms`);child.kill();},timeoutMs);
   const consume=line=>{let e;try{e=JSON.parse(line);}catch{return;}if(e.usage)usage=e.usage;if(e.model)observedModel=e.model;if(e.type==='thread.started')sessionId=e.thread_id??e.session_id??null;
    if(e.type==='item.completed'&&['command_execution','mcp_tool_call','tool_call','web_search'].includes(e.item?.type))toolIds.add(e.item.id??JSON.stringify(e.item));try{onProgress(e);}catch(error){failure=error;child.kill();}};
   const abort=()=>{failure=signal.reason instanceof Error?signal.reason:new Error('Astra worker aborted');child.kill();};
   signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
   child.stdout.on('data',chunk=>{fs.writeSync(eventFd,chunk);buffer+=chunk;let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);consume(line);}});
   child.stderr.on('data',chunk=>fs.writeSync(errorFd,chunk));child.stdin.on('error',e=>{failure=e;});child.on('error',e=>{failure=e;});
   child.on('close',code=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);if(buffer.trim())consume(buffer);if(failure)reject(failure);else if(code!==0)reject(new Error('Codex exited '+code));else resolve();});
   child.stdin.end(prompt);
  });
  const result=JSON.parse(fs.readFileSync(raw,'utf8').trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));return{result,metrics:metrics()};
 }catch(error){error.metrics=metrics();throw error;}finally{fs.closeSync(eventFd);fs.closeSync(errorFd);}
}

export async function runTranscriptionTasks(dir,configuration=TRANSCRIPTION_DEFAULT,{runner=runCodexTranscription}={}) {
 requireCurrentTranscription(configuration);const results=[];
 for(const file of fs.readdirSync(dir).filter(f=>/^task-\d+\.md$/.test(f)).sort()){
  const stem=file.slice(0,-3),target=path.join(dir,stem+'.result.json');if(fs.existsSync(target)){results.push({task:stem,skipped:true});continue;}
  try{
   const prompt=fs.readFileSync(path.join(dir,file),'utf8')+'\n\n'+HOUSE_STYLE_PROMPT+'\n\n'+SOLUTION_CONVENTIONS+'\n\nExecution: use read-only access to the supplied source evidence. Return the required JSON object as your final response; the caller writes the result file. Do not write files. House style: no O label at Cartesian origins; align question numbers with their stem. Recreate mathematical diagrams in TikZ. No model fallback.';
   const reply=await runner({cwd:dir,prompt,out:path.join(dir,stem+'.codex'),images:fs.readdirSync(dir).filter(f=>f.endsWith('.png')).map(f=>path.join(dir,f))});
   const ids=JSON.parse(fs.readFileSync(path.join(dir,stem+'.ids.json'),'utf8')).ids;
   const checked=reconcileIds(ids,reply.result);if(checked.missing.length)throw new Error('Missing expected ids: '+checked.missing.join(', '));
   fs.writeFileSync(target,JSON.stringify(reply.result,null,2),{flag:'wx'});results.push({task:stem,ok:true,metrics:reply.metrics});
  }catch(error){results.push({task:stem,ok:false,error:error.message,metrics:error.metrics});}
  fs.appendFileSync(path.join(dir,'ledger.jsonl'),JSON.stringify({...results.at(-1),at:new Date().toISOString()})+'\n');
 }
 return{ok:results.every(r=>r.ok||r.skipped),results,...TRANSCRIPTION_DEFAULT};
}
import { SOLUTION_CONVENTIONS } from './solution-conventions.mjs';
