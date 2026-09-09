// Apply a confirmed correction to editable content while retaining immutable evidence.
// A stale original is a conflict, never an invitation to overwrite another edit.
import {contentNodes} from './booklet-content-verification.js';

export function applySourceCorrection(source,correction){
  const {id,targetId,field,original,corrected,reason,sourceRefs}=correction;
  if(!id||!targetId||!field||typeof original!=='string'||typeof corrected!=='string'||!reason?.trim()||!sourceRefs?.length)throw Error('Correction requires identity, original, corrected value, reason and source references.');
  const project=structuredClone(source),existing=project.source?.corrections?.find(c=>c.id===id);
  if(existing){
    if(JSON.stringify(existing)!==JSON.stringify(correction))throw Error(`Correction identity conflict: ${id}`);
    return project;
  }
  const target=contentNodes(project).get(targetId)?.node;
  const path=field.split('/').filter(Boolean);
  if(path.some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('Invalid correction field');
  let parent=target;
  for(const key of path.slice(0,-1))parent=parent?.[key];
  const key=path.at(-1);
  if(!parent||parent[key]!==original)throw Error(`Source correction is stale or missing: ${id}`);
  parent[key]=corrected;
  project.source??={};project.source.corrections??=[];
  project.source.corrections.push(structuredClone(correction));
  return project;
}
