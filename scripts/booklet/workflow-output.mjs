// Keep terminal/tool output bounded; full evidence remains available as JSON.
import fs from 'node:fs';
import path from 'node:path';
import {summarizeRunReceipt} from './run-observability.mjs';

export function compactWorkflowOutput(result){
 if(result?.model&&result.phases&&Array.isArray(result.unfinished))return summarizeRunReceipt(result);
 if(!result||typeof result!=='object')return result;
 if(result.sessionKey&&Array.isArray(result.pending))return {mode:result.mode,revision:result.revision,sessionKey:result.sessionKey,total:result.total,reviewed:result.reviewed,reused:result.reused,pending:result.pending.length,pendingSample:result.pending.slice(0,6).map(r=>({edition:r.edition,page:r.page,key:r.key,reason:r.inspectionReason})),awaitingReuse:result.awaitingReuse?.length??0,pendingComposition:result.pendingComposition,active:result.active};
 if(result.project&&result.editions&&result.sourceArtifacts)return {mode:result.mode,project:result.project,reviewPolicy:result.reviewPolicy,comparison:result.comparison,editions:Object.fromEntries(Object.entries(result.editions).map(([e,v])=>[e,{manifest:v.manifest,pages:v.images?.length??0}])),sourceArtifacts:result.sourceArtifacts.length};
 const summarize=(value,depth=0)=>{
  if(Array.isArray(value))return {count:value.length,sample:value.slice(0,6).map(v=>summarize(v,depth+1)),omitted:Math.max(0,value.length-6)};
  if(typeof value==='string')return value.length>240?value.slice(0,237)+'…':value;
  if(!value||typeof value!=='object')return value;
  if(depth>4)return {fields:Object.keys(value)};
  return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,['original','corrected','value','code','prompt','instructions'].includes(key)?{characters:JSON.stringify(v)?.length??0}:summarize(v,depth+1)]));
 };
 return summarize(result);
}
export function printWorkflowOutput(result,{full=false,out=null,exclusive=false}={}){
 if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{...(exclusive?{flag:'wx'}:{})});}
 const display=full?result:compactWorkflowOutput(result);
 console.log(JSON.stringify(out?{output:path.resolve(out),...display}:display,null,2));return result;
}
