// File relay for an explicit benchmark arm. The pipeline keeps its tickets,
// validators and recording; a separately scheduled worker answers each request.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {transcriptionConfiguration,requireCurrentTranscription,TRANSCRIPTION_DEFAULT} from './transcription-settings.mjs';
const WORKER_INSTRUCTIONS='Bounded worker execution: complete only the assigned task yourself. Do not spawn sub-agents or delegate. Use read-only access to the listed evidence. If the task cannot be completed, report the specific blocker in the required result.';
export function createRelayRunner({relayDir,pollMs=1000,timeoutMs=2700000,settleMs=15000}={}){
 if(!relayDir)throw Error('Relay runner requires a relay directory');
 const pending=path.join(relayDir,'pending'),done=path.join(relayDir,'done');fs.mkdirSync(pending,{recursive:true});fs.mkdirSync(done,{recursive:true});
 return async prepared=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(prepared.runDir??prepared.cwd,'manifest.json'),'utf8')),configuration=transcriptionConfiguration(requireCurrentTranscription(manifest));
  if(configuration.provider===TRANSCRIPTION_DEFAULT.provider)throw Error('The relay runner serves recorded benchmark arms only');
  const id=randomUUID(),start=Date.now(),stage=prepared.stage??prepared.job?.stage??prepared.profile??'transcription';
  fs.mkdirSync(prepared.out,{recursive:true});
  const promptFile=path.join(prepared.out,'relay-prompt.md'),responseFile=path.join(prepared.out,'relay-response.json'),requestFile=path.join(pending,id+'.json');
  // Exclusive creation keeps a repeated delivery visible rather than silent.
  fs.writeFileSync(promptFile,WORKER_INSTRUCTIONS+'\n\n'+prepared.prompt,{flag:'wx'});
  const images=[...new Set(prepared.images??[])];
  fs.writeFileSync(requestFile,JSON.stringify({id,stage,jobId:prepared.job?.id??null,promptFile,images,responseFile,createdAt:new Date(start).toISOString()},null,2),{flag:'wx'});
  const metrics=()=>({provider:configuration.provider,model:configuration.model,effort:configuration.effort,requestedModel:configuration.model,benchmarkArm:configuration.benchmarkArm,profile:prepared.profile??'transcription',role:prepared.profile==='review'?'review':'transcription',stage,serviceTier:'default',callId:id,usage:null,externalModelCalls:1,startedAt:new Date(start).toISOString(),endedAt:new Date().toISOString(),elapsedMs:Date.now()-start});
  try{
   let result;
   for(;;){
    if(fs.existsSync(responseFile)){
     // A partially written response is retried on the next poll; one that
     // stays unparseable after it stops changing is a failed delivery.
     try{result=JSON.parse(fs.readFileSync(responseFile,'utf8').replace(/^\uFEFF/,'').trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));break;}catch(error){if(Date.now()-fs.statSync(responseFile).mtimeMs>settleMs)throw Error('Relay response is not valid JSON: '+error.message);}
    }
    if(Date.now()-start>timeoutMs)throw Error(`Relay ${stage} response exceeded ${timeoutMs} ms`);
    await new Promise(resolve=>setTimeout(resolve,pollMs));
   }
   return {result,metrics:metrics()};
  }catch(error){error.metrics=metrics();throw error;}
  finally{if(fs.existsSync(requestFile))fs.renameSync(requestFile,path.join(done,id+'.json'));}
 };
}
