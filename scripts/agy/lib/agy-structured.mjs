// Single-turn structured output transport. Prompts travel over stdin, never a shell.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {AGY_BIN,modelForEffort,effortArguments,executionMetrics} from './agy-run.mjs';

export function assertReadOnlyTools(init,agent,verifiedProfile=false){
  if(init?.agent!==agent)throw new Error('Requested transcription agent was not selected');
  if(!Array.isArray(init.tools))throw new Error('AGY did not advertise its tool configuration');
  const unexpected=init.tools.filter(name=>name!=='view_file');
  // CLI 1.1.27 init.tools is the global registry, even for a filtered custom agent.
  // Accept that registry only when the caller verified our exact installed profile.
  if(unexpected.length&&!verifiedProfile)throw new Error('Unexpected AGY tools: '+unexpected.join(', '));
}

export function structuredResult(envelope){
  if(envelope?.status!=='SUCCESS')throw new Error(envelope?.error||`AGY status ${envelope?.status??'missing'}`);
  const response=String(envelope.response??'').replace(/^\uFEFF/,'').trim();
  const fenced=response.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const result=envelope.structured_output??JSON.parse(fenced?fenced[1]:response);
  if(!result||typeof result!=='object'||Array.isArray(result))throw new Error('AGY did not return a structured object');
  return result;
}

export function runStructured({cwd,prompt,schemaPath,agent,profilePath=null,profileSha256=null,autoApproveTools=false,model='gemini-3.8-flash-low',effort='low',timeoutMs=8*60*1000,maxToolCalls=12,onProgress=()=>{},spawnProcess=spawn}){
  let verifiedProfile=false;
  if(profilePath){
    const actual=crypto.createHash('sha256').update(fs.readFileSync(profilePath)).digest('hex');
    if(!profileSha256||actual!==profileSha256)throw new Error('Installed transcription profile differs from reviewed configuration');
    verifiedProfile=true;
  }
  if(autoApproveTools&&!verifiedProfile)throw new Error('Headless approvals require the verified transcription profile');
  const executionModel=modelForEffort(model,effort);
  const args=['--input-format','stream-json','--output-format','stream-json','--model',executionModel,...effortArguments(effort),'--agent',agent,'--disable-slash-commands',...(autoApproveTools?['--dangerously-skip-permissions']:[]),...(schemaPath?['--json-schema',schemaPath]:[]),'--print-timeout',`${Math.ceil(timeoutMs/1000)}s`];
  const started=Date.now();
  return new Promise((resolve,reject)=>{
    const child=spawnProcess(AGY_BIN,args,{cwd,windowsHide:true,stdio:['pipe','pipe','pipe'],shell:false});
    child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
    let buffer='',stderr='',envelope=null,initialised=false,failure=null,outputBytes=0;
    const toolSteps=new Set();
    const stop=error=>{if(!failure){failure=error;child.stdin.destroy();child.kill();}};
    const timer=setTimeout(()=>stop(new Error('Structured transcription deadline exceeded')),timeoutMs+15000);
    child.on('error',stop);child.stdin.on('error',stop);
    child.stderr.on('data',chunk=>{stderr=(stderr+chunk.toString()).slice(-3000);if(/Agent .*not found|falling back to default/i.test(stderr))stop(new Error('AGY could not load the transcription profile'));});
    function event(value){
      if(failure)return;
      if(value.event==='init'){
        if(initialised)throw new Error('Duplicate AGY init event');
        assertReadOnlyTools(value.init,agent,verifiedProfile);initialised=true;
        onProgress({event:'init',model:executionModel,profileVerified:verifiedProfile,registryTools:value.init.tools.length});
        // No booklet content is sent until the tool configuration passes.
        child.stdin.end(JSON.stringify({event:'user',message:{content:prompt}})+'\n');
      }else if(value.event==='step_update'){
        const step=value.step_update;
        if(step?.step_type==='tool'){
          const name=step.tool_name??step.tool_info?.name;
          if(name!=='view_file'&&!(verifiedProfile&&name==='manage_task'))throw new Error('Unexpected transcription tool: '+name);
          toolSteps.add(step.step_index);
          if(toolSteps.size>maxToolCalls)throw new Error('Transcription image-read budget exceeded');
          onProgress({event:'tool',name,step:step.step_index,state:step.state});
        }
      }else if(value.event==='result'){
        if(envelope)throw new Error('Multiple results for a single transcription');
        envelope=value.result;
      }
    }
    child.stdout.on('data',chunk=>{
      outputBytes+=chunk.length;
      if(outputBytes>32*1024*1024)return stop(new Error('AGY stream exceeded output limit'));
      buffer+=chunk.toString('utf8');
      let end;
      while((end=buffer.indexOf('\n'))>=0){
        const line=buffer.slice(0,end).trim();buffer=buffer.slice(end+1);
        if(line)try{event(JSON.parse(line));}catch(error){stop(error);break;}
      }
    });
    child.on('close',code=>{
      clearTimeout(timer);
      if(buffer.trim()&&!failure)try{event(JSON.parse(buffer));}catch(error){failure=error;}
      const metrics={model:executionModel,effort,...executionMetrics(envelope,Date.now()-started),toolCalls:toolSteps.size};
      try{
        if(failure)throw failure;
        if(!initialised)throw new Error('AGY exited before tool configuration was verified');
        if(code!==0)throw new Error(envelope?.error||`AGY exited ${code}: ${stderr}`);
        resolve({result:structuredResult(envelope),metrics});
      }catch(error){error.metrics=metrics;error.envelope=envelope;reject(error);}
    });
  });
}
