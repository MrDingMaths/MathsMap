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
