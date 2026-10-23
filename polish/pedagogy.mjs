// Pedagogy suggestions for the teacher (polish pipeline, 23 October 2026). The pedagogy review
// (pedagogy/review.mjs, docs/booklet-pedagogy-review.md) uses low effort for both calls here, as the polish
// handoff requires for every model call. Nothing is applied. Only an extension, a variation sequence or a bridging question
// (a finding whose repair adds a question, a review or teaching) becomes a Studio comment of kind
// 'pedagogy-suggestion'; any other finding is listed in the polish report and left alone.
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,read} from '../checks/lib/common.mjs';
import {isSuggestion,commentNote,loadProvenance,provenanceFile} from '../pedagogy/review.mjs';
import {addPedagogySuggestionFlags} from './flags.mjs';

const BRIDGING_REPAIRS=new Set(['add-question','add-review','add-teaching']);
export const isPolishSuggestion=finding=>isSuggestion(finding)||BRIDGING_REPAIRS.has(finding.repair?.type);

// Pending findings split into what the teacher is offered and what is only reported.
export function splitFindings(record){
 const live=(record.findings??[]).filter(finding=>finding.state==='pending');
 return {suggestions:live.filter(isPolishSuggestion),reported:live.filter(finding=>!isPolishSuggestion(finding))};
}
// Studio comment items for flags.addPedagogySuggestionFlags: the finding's own note, first target first.
export const suggestionItems=findings=>findings.map(finding=>({id:finding.id,targets:finding.targets.map(target=>target.id),note:commentNote(finding)}));

// review: injectable for tests (default: pedagogy/review.mjs runReview).
export async function runPedagogySuggestions({projectFile,polishDir,liveProvenanceDir=path.join(ROOT,'booklets','provenance','pedagogy-review'),review=null,log=()=>{}}={}){
 const started=Date.now(),project=read(projectFile),provenanceDir=path.join(polishDir,'provenance-pedagogy');
 // Earlier decisions (a rejected suggestion stays rejected) travel with a copy of the booklet's own record.
 fs.mkdirSync(provenanceDir,{recursive:true});
 const copy=path.join(provenanceDir,project.id+'.json'),live=path.join(liveProvenanceDir,project.id+'.json');
 if(!fs.existsSync(copy)&&fs.existsSync(live))fs.copyFileSync(live,copy);
 const run=review??(async options=>(await import('../pedagogy/review.mjs')).runReview(options));
 try{await run({projectFile,reviewEffort:'low',challengeEffort:'low',provenanceDir,workDir:path.join(polishDir,'pedagogy-work'),concurrency:3});}
 catch(error){
  if(/no teaching content/.test(error.message))return {skipped:error.message,suggestions:[],reported:[]};
  throw error;
 }
 const record=loadProvenance(provenanceFile(project.id,{provenanceDir}),project),{suggestions,reported}=splitFindings(record);
 return {suggestions,reported,items:suggestionItems(suggestions),elapsedSeconds:Math.round((Date.now()-started)/1000)};
}
// The comments on the candidate file (not a live booklet): added once per suggestion.
export function postSuggestions(projectFile,items){
 const project=read(projectFile),{project:next,added}=addPedagogySuggestionFlags(project,items);
 if(added.length)fs.writeFileSync(projectFile,JSON.stringify(next,null,1)+'\n');
 return added;
}
