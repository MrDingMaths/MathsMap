import {HOUSE_STYLE_PROMPT} from '../../src/lib/booklet-house-style.js';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {TRANSCRIPTION_DEFAULT,requireCurrentTranscription} from './transcription-settings.mjs';
import {reconcileIds} from '../agy/lib/agy-run.mjs';

export async function runCodexTranscription({cwd,prompt,images=[],out,timeoutMs=900000,onProgress=()=>{}}) {
 fs.mkdirSync(out,{recursive:true});
 const raw=path.join(out,'last-message.txt'),start=Date.now();let usage=null,observedModel=null;
 const args=['exec','--ephemeral','--ignore-user-config','--skip-git-repo-check','--sandbox','read-only','-C',cwd,'--model',TRANSCRIPTION_DEFAULT.model,'-c',`model_reasoning_effort="${TRANSCRIPTION_DEFAULT.effort}"`,'--json','--output-last-message',raw];
 for(const image of images)args.push('--image',image);args.push('-');
 // Exclusive creation makes a failed attempt visible and prevents silent retries.
 const eventFd=fs.openSync(path.join(out,'events.jsonl'),'wx'),errorFd=fs.openSync(path.join(out,'stderr.txt'),'wx');
 const metrics=()=>({provider:'codex',requestedModel:TRANSCRIPTION_DEFAULT.model,effort:'low',observedModel,usage,elapsedMs:Date.now()-start});
 try {
  await new Promise((resolve,reject)=>{
   const child=spawn(process.env.BOOKLET_CODEX_BIN??'codex',args,{cwd,windowsHide:true,shell:false,stdio:['pipe','pipe','pipe']});let buffer='',failure=null;
   const timer=setTimeout(()=>{failure=new Error('Transcription invocation exceeded 15 minutes');child.kill();},timeoutMs);
   child.stdout.on('data',chunk=>{fs.writeSync(eventFd,chunk);buffer+=chunk;let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);try{const e=JSON.parse(line);if(e.usage)usage=e.usage;if(e.model)observedModel=e.model;onProgress(e);}catch{}}});
   child.stderr.on('data',chunk=>fs.writeSync(errorFd,chunk));child.stdin.on('error',e=>{failure=e;});child.on('error',e=>{failure=e;});
   child.on('close',code=>{clearTimeout(timer);if(failure)reject(failure);else if(code!==0)reject(new Error('Codex exited '+code));else resolve();});
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
