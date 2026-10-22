import {isDeepStrictEqual} from 'node:util';

// Compact only the transmitted view after cache selection. The canonical task,
// candidates, full acceptance proof and input hash remain unchanged on disk.
export function compactAuthorPrompt(prompt,resources){
 let text=prompt,proofs=0,duplicates=0;
 for(const resource of resources??[]){
  if(resource.name!=='automatic-reuse'||!text.includes(resource.text))continue;
  const split=resource.text.lastIndexOf('\n');let payload;
  try{payload=JSON.parse(resource.text.slice(split+1));}catch{continue;}
  if(!Array.isArray(payload.reuseCandidates))continue;
  const compact=structuredClone(payload);
  for(const candidate of compact.reuseCandidates){
   if(Object.hasOwn(candidate,'acceptance')){delete candidate.acceptance;proofs++;}
   if(candidate.block&&candidate.originalSourceBlock){
    const {presentation:currentLayout,...current}=candidate.block;
    const {presentation:originalLayout,...original}=candidate.originalSourceBlock;
    if(isDeepStrictEqual(current,original)){delete candidate.originalSourceBlock;candidate.originalSourceBlockRef='block';duplicates++;}
   }
  }
  const view=resource.text.slice(0,split)+'\nHost-only acceptance proof is retained and verified separately; no suggestion grants acceptance. originalSourceBlockRef:"block" means the original source block equals block except its presentation; use that complete block for source comparison. Candidates with different original content retain originalSourceBlock in full.\n'+JSON.stringify(compact);
  if(view.length<resource.text.length)text=text.split(resource.text).join(view);
 }
 return {prompt:text,encoding:'mathsmap-author-prompt-view-v1',canonicalCharacters:prompt.length,characters:text.length,savedCharacters:prompt.length-text.length,proofs,duplicates};
}
