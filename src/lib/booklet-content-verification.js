import {hasVisibleContent} from './document-content.js';
import {inspectPresentationFidelity} from './booklet-presentation-verification.js';
import {validSourceRegion} from './diagram-source-region.js';

export const CONTENT_VERIFIER_VERSION='3';
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export async function signature(value){
  const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));
  return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
const presentation=new Set(['flow','presentation','layout','columns','widthMm','heightMm','fontSize','lineHeight','spaceBefore','spaceAfter','indent','align','verification','sourceLayoutEvidence','sourceReview','answerSpaceMm','sourceOrder','classification','bankRef','diagramColourModes']);
function contentOnly(value){
  return Array.isArray(value)?value.map(contentOnly):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([k])=>!presentation.has(k)).map(([k,v])=>[k,contentOnly(v)])):value;
}
export function contentNodes(project){
  const nodes=new Map();
  const visit=(value,block,ancestors=[])=>{
    if(!value||typeof value!=='object')return;
    if(value.id)nodes.set(value.id,{node:value,block,ancestors});
    const parents=[...ancestors,value];
    for(const [key,v]of Object.entries(value))if(!['sourceRefs','sourceAtom','sourceLayoutEvidence','sourceReview','verification','mathematicalModel','originalDiagram','presentation'].includes(key))Array.isArray(v)?v.forEach(n=>visit(n,block,parents)):typeof v==='object'&&visit(v,block,parents);
  };
  for(const s of project?.sections??[])for(const b of s.blocks)visit(b,b);
  return nodes;
}
function assetSources(value,found=new Set()){
  if(!value||typeof value!=='object')return found;
  if(typeof value.src==='string')found.add(value.src);
  for(const [key,v]of Object.entries(value))if(key!=='sourceLayoutEvidence')Array.isArray(v)?v.forEach(n=>assetSources(n,found)):typeof v==='object'&&assetSources(v,found);
  return found;
}
export async function verificationAssetSignatures(project,readAsset){
  const result={};
  await Promise.all([...assetSources(project.sections)].map(async src=>{
    try{
      const bytes=await readAsset(src);
      result[src]=[...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
    }catch{result[src]=null;}
  }));
  return result;
}
export async function contentVerificationKey(project,entry,nodes=contentNodes(project),assetSignatures={}){
  const target=nodes.get(entry.targetId);
  const context=(entry.teachingContextIds??[]).map(id=>[id,contentOnly(nodes.get(id)?.node??null)]);
  const sharedContext=(target?.ancestors??[]).filter(n=>n.prompt||n.questionDiagrams?.length||n.sharedSolutionDiagrams?.length).map(n=>contentOnly({id:n.id,prompt:n.prompt,questionDiagrams:n.questionDiagrams,sharedSolutionDiagrams:n.sharedSolutionDiagrams,answer:n.children?.length?n.answer:undefined}));
  const content=contentOnly(target?.node??null);
  const assets=[...assetSources([content,context,sharedContext])].sort().map(src=>[src,assetSignatures[src]??null]);
  return signature({version:CONTENT_VERIFIER_VERSION,source:project.source?.sourceHashes,entry:{...entry,verification:undefined},content,context,sharedContext,assets});
}
export async function layoutVerificationKey(project,{renderer,fonts,edition}){
  return signature({project:{sections:project.sections,topics:project.topics,settings:project.settings,assets:project.assets},renderer,fonts,edition});
}
export async function inspectContentCoverage(project,{assetSignatures={}}={}){
  const inventory=project.source?.inventory,entries=inventory?.entries??[],nodes=contentNodes(project),issues=[],rows=[];
  const targetIds=new Set(entries.filter(e=>!e.exclusionReason).map(e=>e.targetId));
  const issue=(kind,targetId,note)=>issues.push({kind,targetId,note});
  if(!entries.length)issue('missing-inventory',null,'Source inventory has not been recorded.');
  for(const {node}of nodes.values())if(typeof node.src==='string'&&!assetSignatures[node.src])issue('unreadable-diagram',node.id,'Diagram bytes could not be checked; restore the referenced asset and verify it again.');
  for(const {node}of nodes.values())if(node.sourceRegion&&!validSourceRegion(node.sourceRegion))issue('invalid-source-crop',node.id,'Crop extends outside the original image. Correct its bounds and compare the displayed scaffold with the source; the whole-image fallback is not verified content.');
  const seen=new Set(),mapped=new Set();
  for(const entry of entries){
    let state='unchecked';
    if(seen.has(entry.id)){state='duplicate';issue(state,entry.targetId,`Duplicate source inventory identity: ${entry.id}`);}seen.add(entry.id);
    if(entry.exclusionReason?.trim()){state='excluded';}
    else if(!nodes.has(entry.targetId)){state='missing';issue(state,entry.targetId,`Missing ${entry.kind??'content'} from source p${entry.pageNumber}: ${entry.id}`);}
    else{
      const mapping=`${entry.targetId}|${entry.field??entry.kind??''}`;
      if(mapped.has(mapping)&&!entry.continuationOf){state='duplicate';issue(state,entry.targetId,`Multiple inventory items map to the same target: ${entry.id}`);}mapped.add(mapping);
      if(entry.ambiguous){state='ambiguous';issue(state,entry.targetId,entry.ambiguous);}
      else if(state!=='duplicate'){
        const key=await contentVerificationKey(project,entry,nodes,assetSignatures);
        state=entry.verification?.signature===key&&entry.verification?.checked===true?'verified':'unchecked';
        if(state==='unchecked')issue(state,entry.targetId,`Check source p${entry.pageNumber}: ${entry.id}`);
      }
      for(const id of entry.teachingContextIds??[])if(!nodes.has(id))issue('missing-teaching-context',entry.targetId,`Missing teaching context ${id}`);
    }
    rows.push({id:entry.id,targetId:entry.targetId,pageNumber:entry.pageNumber,kind:entry.kind,state});
  }
  for(const page of inventory?.selectedPages??[])if(!inventory.pages?.some(p=>p.pageNumber===page&&p.inventoried))issue('unchecked-page',null,`Source p${page} has not been inventoried.`);
  const hasAnswer=value=>value!=null&&hasVisibleContent(value);
  for(const flag of project.studio?.flags??[])if(!flag.resolved)issue(flag.kind??'review-finding',flag.targetId,flag.note??'Unresolved review finding.');
  for(const {node,block,ancestors}of nodes.values()){
    if((node===block||['part','subpart'].includes(node.type)||['tikz','svg','image'].includes(node.format))&&!targetIds.has(node.id))issue('unmapped-content',node.id,'Content has no source inventory mapping.');
    if(node!==block&&['question','part','subpart'].includes(node.type)&&!node.children?.length&&block.type==='question'){
      if(!hasVisibleContent(node.prompt)&&![...ancestors,node].some(n=>n.questionDiagrams?.length))issue('missing-prompt',node.id,'Response has no visible prompt or shared question diagram.');
      for(const mode of ['short','worked'])if(!hasAnswer(node.answer?.[mode]))issue('missing-answer',node.id,`Missing ${mode} answer.`);
      if(node.answer?.provenance?.worked==='source-short-only')issue('missing-worked-solution',node.id,'A supplied short answer still needs a worked solution.');
    }
    for(const id of [...(node.dependsOn??[]),node.pairedBlockId,node.flow?.continuationOf??node.continuationOf].filter(Boolean))if(!nodes.has(id))issue('broken-reference',node.id,`Missing dependency ${id}`);
  }
  const contentComplete=entries.length>0&&!issues.length, presentationReport=await inspectPresentationFidelity(project);
  return {version:2,complete:contentComplete&&presentationReport.complete,contentComplete,presentation:presentationReport,total:entries.length,counts:Object.fromEntries(['verified','excluded','missing','duplicate','ambiguous','unchecked'].map(s=>[s,rows.filter(r=>r.state===s).length])),rows,issues:[...issues,...presentationReport.issues]};
}
