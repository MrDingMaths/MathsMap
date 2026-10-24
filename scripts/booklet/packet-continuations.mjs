// Keep complete, independently valid page packets; coalesce only explicitly
// owned copies of one cross-page question when assembling the editable book.
import {isDeepStrictEqual} from 'node:util';

const nodeIds=value=>{
 const ids=new Set();
 const visit=v=>{if(!v||typeof v!=='object')return;if(v.id)ids.add(v.id);for(const [key,child]of Object.entries(v))if(!['sourceReview','provenance','sourceAtom','sourceLayoutEvidence'].includes(key))visit(child);};
 visit(value);return ids;
};
export function coalescePacketContinuations(input,{continuations=[]}={}){
 const packets=structuredClone(input),byPage=new Map(packets.map(p=>[p.pageNumber,p])),seen=new Map();
 if(byPage.size!==packets.length)throw Error('Continuation packets require unique source pages');
 for(const packet of [...packets].sort((a,b)=>a.pageNumber-b.pageNumber)){
  const references=packet.sharedContentContinuations??[],used=new Set();
  if(!Array.isArray(references))throw Error('Invalid shared-content continuation declarations');
  // Retain empty source/provenance carriers that were not emptied by coalescing.
  const originallyNonempty=new Set(packet.sections.filter(s=>s.blocks.length));
  for(const section of packet.sections){
   section.blocks=section.blocks.filter(block=>{
    const refs=references.filter(r=>r.blockId===block.id),prior=seen.get(block.id);
    if(!prior){if(refs.length)throw Error('Missing canonical continuation block '+block.id);seen.set(block.id,{packet,block});return true;}
    if(refs.length!==1)throw Error('Duplicate block requires one explicit continuation '+block.id);
    const ref=refs[0];used.add(ref);
    if(!ref.reason?.trim()||ref.canonicalPageNumber!==prior.packet.pageNumber||ref.canonicalPageNumber>=packet.pageNumber)throw Error('Invalid canonical continuation page or reason '+block.id);
    const ids=nodeIds(block),owned=continuations.some(pair=>!Array.isArray(pair)&&Array.isArray(pair.entryIds)&&
     [pair.from,pair.to].includes(packet.pageNumber)&&[pair.from,pair.to].includes(prior.packet.pageNumber)&&
     [packet,prior.packet].every(p=>pair.entryIds.some(id=>p.inventoryMappings.some(m=>m.inventoryId===id&&!m.exclusionReason&&ids.has(m.targetId)))));
    if(!owned)throw Error('Shared content is outside the declared question continuation '+block.id);
    if(!isDeepStrictEqual(block,prior.block))throw Error('Continuation copies disagree; retain both attempts for repair: '+block.id);
    if(![packet.pageNumber,prior.packet.pageNumber].every(page=>block.sourceRefs?.some(r=>r.pageNumber===page)))throw Error('Continuation needs both source-page references '+block.id);
    const evidence=packet.answerEvidence?.filter(e=>e.questionId===block.id)??[],canonicalEvidence=prior.packet.answerEvidence?.filter(e=>e.questionId===block.id)??[];
    if(!isDeepStrictEqual(evidence,canonicalEvidence))throw Error('Continuation answer evidence disagrees '+block.id);
    for(const mapping of packet.inventoryMappings.filter(m=>!m.exclusionReason&&ids.has(m.targetId))){
     const canonical=prior.packet.inventoryMappings.find(m=>!m.exclusionReason&&!m.continuationOf&&m.targetId===mapping.targetId&&m.field===mapping.field);
     if(canonical){mapping.continuationOf=canonical.inventoryId;mapping.continuationReason=ref.reason;}
    }
    packet.answerEvidence=(packet.answerEvidence??[]).filter(e=>e.questionId!==block.id);
    return false;
   });
  }
  if(used.size!==references.length)throw Error('Unused or duplicate shared-content continuation declaration');
  packet.sections=packet.sections.filter(s=>s.blocks.length||!originallyNonempty.has(s));
  delete packet.sharedContentContinuations;
 }
 return packets;
}

// Explicitly selected fragments of one printed question can have separate
// author packets. Merge their existing parts, never invent an inventory root.
// Absent groups preserve every historical packet exactly as before.
export function mergeQuestionFragments(input,groups=[]){
 const packets=structuredClone(input),locations=new Map();
 for(const packet of packets)for(const section of packet.sections)for(const block of section.blocks){
  if(locations.has(block.id))throw Error('Duplicate fragment block '+block.id);
  locations.set(block.id,{packet,section,block});
 }
 const used=new Set();
 for(const {canonicalBlockId,fragmentBlockIds,allowEmptyContinuationStem=false,allowFragmentLayouts=false,singlePartBlockIds=[]}of groups){
  const canonical=locations.get(canonicalBlockId);
  if(!canonical||used.has(canonicalBlockId)||!Array.isArray(fragmentBlockIds)||!fragmentBlockIds.length)throw Error('Invalid canonical question fragment '+canonicalBlockId);
  const {block,packet,section}=canonical,root=block.content;
  if(block.type!=='question'||section.phase!=='practice'||!root?.children?.length)throw Error('Question fragments need a practice question with existing parts');
  used.add(canonicalBlockId);let previousPage=packet.pageNumber;
  const ids=nodeIds(block),labels=new Set(root.children.map(part=>part.label));
  for(const id of fragmentBlockIds){
   const current=locations.get(id);
   if(!current||used.has(id)||current.packet.pageNumber<previousPage||current.packet.pageNumber<=packet.pageNumber||current.section.phase!=='practice'||current.section.topicId!==section.topicId)throw Error('Invalid ordered question fragment '+id);
   const next=current.block,body=next.content;
   const singlePart=singlePartBlockIds.includes(id)&&body?.type==='part'&&!!body.label&&!body.children?.length;
   if(next.type!=='question'||!singlePart&&!body?.children?.length||!(isDeepStrictEqual(body.prompt,root.prompt)||(allowEmptyContinuationStem&&(body.prompt??'')===''))||!singlePart&&(!allowFragmentLayouts&&(body.layout!==root.layout||body.columns!==root.columns)||body.questionDiagrams?.length||body.answer||body.sharedSolutionDiagrams?.length)||next.presentation?.layoutOverrides?.blockLayouts?.[id]?.arrangement)throw Error('Question fragment has distinct content or arrangement '+id);
   if(current.packet.inventoryMappings.some(mapping=>!mapping.exclusionReason&&(mapping.targetId===id||!singlePart&&mapping.targetId===body.id)))throw Error('Question fragment owns a separately inventoried stem '+id);
   for(const part of singlePart?[body]:body.children){
    if(!part.label||labels.has(part.label))throw Error('Duplicate or unlabelled question fragment part '+id);
    for(const nodeId of nodeIds(part)){if(ids.has(nodeId))throw Error('Duplicate question fragment node '+nodeId);ids.add(nodeId);}
    labels.add(part.label);root.children.push(part);
   }
   const refs=[...(block.sourceRefs??[{pageNumber:packet.pageNumber}]),...(next.sourceRefs??[{pageNumber:current.packet.pageNumber}])];
   block.sourceRefs=[...new Map(refs.map(ref=>[ref.pageNumber,ref])).values()];
   block.sourceReview??={};
   for(const field of ['responses','teachingContext','intentionalDepartures'])if(next.sourceReview?.[field]?.length)block.sourceReview[field]=[...(block.sourceReview[field]??[]),...next.sourceReview[field]];
   if(next.sourceReview?.workingSpaceEstimate?.estimates?.length){
    block.sourceReview.workingSpaceEstimate??={method:'solution-steps',estimates:[]};
    block.sourceReview.workingSpaceEstimate.estimates.push(...next.sourceReview.workingSpaceEstimate.estimates);
   }
   current.section.blocks=current.section.blocks.filter(value=>value.id!==id);
   current.packet.sections=current.packet.sections.filter(value=>value.blocks.length);
   previousPage=current.packet.pageNumber;used.add(id);
  }
 }
 return packets;
}
