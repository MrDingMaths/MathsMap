// Offline prompt accounting only. Retained reviewer judgments are never changed.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {boundedDeliveredPrompt} from './bounded-stages.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const idsOf=(value,ids=new Set())=>{
 if(!value||typeof value!=='object')return ids;if(value.id)ids.add(value.id);
 for(const [key,child] of Object.entries(value))if(!['sourceAtom','sourceReview'].includes(key)&&child&&typeof child==='object')idsOf(child,ids);
 return ids;
};
export function replayReviewPacket(request,actual){
 if(request.job.stage!=='assessment'||!request.job.context.lean)return {skipped:'not-three-pass-assessment'};
 const marker='\nScoped source context:';
 if(!actual.prompt.includes(marker)){
  const started=performance.now(),prompt=boundedDeliveredPrompt(request.job);
  return {jobId:request.job.id,comparisonAvailable:false,owned:request.job.ownershipIds.length,afterCharacters:prompt.length,assemblyMs:performance.now()-started,afterHash:hash(prompt),note:'Canonical ticket projection only; custom supplemental delivery is unavailable, so no before/after saving is inferred.'};
 }
 const supplement=JSON.parse(actual.prompt.slice(actual.prompt.lastIndexOf('\n')+1)),job=structuredClone(request.job),known=idsOf([...job.context.questions,...(job.context.teaching?.teaching??[])]);
 job.context={...job.context,deliveryProfile:'source-context-v1',sourceTexts:supplement.sourceTexts??[],siblingContext:(supplement.siblingContext??[]).filter(sibling=>!known.has(sibling.id))};
 const metadata=(supplement.sourceMetadata??[]).filter(row=>row.editorOnly).map(({id,editorOnly})=>({id,editorOnly}));if(metadata.length)job.context.sourceMetadata=metadata;
 const artifacts=new Map(job.evidence.map(artifact=>[artifact.path,artifact]));
 for(const source of job.context.sourceTexts)artifacts.set(source.artifact.path,source.artifact);
 job.evidence=[...artifacts.values()];
 const started=performance.now(),prompt=boundedDeliveredPrompt(job),assemblyMs=performance.now()-started;
 return {jobId:job.id,comparisonAvailable:true,owned:job.ownershipIds.length,beforeCharacters:actual.prompt.length,afterCharacters:prompt.length,assemblyMs,removedSiblingCopies:(supplement.siblingContext??[]).length-job.context.siblingContext.length,
  sourceTextCount:job.context.sourceTexts.length,sourceTextHash:hash(JSON.stringify(job.context.sourceTexts)),beforeHash:hash(actual.prompt),afterHash:hash(prompt)};
}
export function benchmarkReviewPackets(runDir){
 const root=path.join(path.resolve(runDir),'workflow/stages'),rows=[],skipped=[];
 for(const job of fs.readdirSync(root,{withFileTypes:true}).filter(entry=>entry.isDirectory()))for(const attempt of fs.readdirSync(path.join(root,job.name),{withFileTypes:true}).filter(entry=>entry.isDirectory())){
  const dir=path.join(root,job.name,attempt.name),requestFile=path.join(dir,'request.json'),actualFile=path.join(dir,'actual-worker-input.json');
  if(!fs.existsSync(requestFile))continue;
  const requestBytes=fs.readFileSync(requestFile),request=JSON.parse(requestBytes),actualBytes=fs.existsSync(actualFile)?fs.readFileSync(actualFile):null,row=replayReviewPacket(request,actualBytes?JSON.parse(actualBytes):{prompt:request.prompt});
  if(row.skipped)skipped.push({requestFile,reason:row.skipped});else rows.push({...row,request:{path:requestFile,hash:hash(requestBytes)},...(actualBytes?{originalDelivery:{path:actualFile,hash:hash(actualBytes)}}:{})});
 }
 const comparable=rows.filter(row=>row.comparisonAvailable),sum=key=>comparable.reduce((total,row)=>total+(row[key]??0),0),canonical=rows.filter(row=>!row.comparisonAvailable);
 return {version:1,externalModelCalls:0,acceptanceCreated:false,measuredPackets:comparable.length,canonicalPackets:canonical.length,canonicalAssemblyMs:canonical.reduce((total,row)=>total+row.assemblyMs,0),summary:{beforeCharacters:sum('beforeCharacters'),afterCharacters:sum('afterCharacters'),assemblyMs:sum('assemblyMs'),removedSiblingCopies:sum('removedSiblingCopies'),largerPackets:comparable.filter(row=>row.afterCharacters>row.beforeCharacters).length},rows,skipped,
  note:'Uses the same retained questions, teaching, source text and original sibling content. Measures local delivery projection, not accepted-import time or token savings. No source files, tickets or review evidence are modified.'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),readArg=name=>args[args.indexOf(name)+1];
 if(!args.includes('--run-dir')||!args.includes('--out'))throw Error('Use --run-dir RUN --out LOCAL_REPORT.json');
 const result=benchmarkReviewPackets(readArg('--run-dir')),out=path.resolve(readArg('--out'));fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({measuredPackets:result.measuredPackets,canonicalPackets:result.canonicalPackets,canonicalAssemblyMs:result.canonicalAssemblyMs,...result.summary,externalModelCalls:0,acceptanceCreated:false,out}));
}
