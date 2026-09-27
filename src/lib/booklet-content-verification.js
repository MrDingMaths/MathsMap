import {hasVisibleContent} from './document-content.js';
import {inspectPresentationFidelity} from './booklet-presentation-verification.js';
import {validSourceRegion} from './diagram-source-region.js';
import {sourceInventories} from './booklet-source-content.js';

export const CONTENT_VERIFIER_VERSION='3';
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export async function signature(value){
  const bytes=new TextEncoder().encode(JSON.stringify(canonical(value)));
  return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
// Ownership changes during bank promotion do not change inspected source content.
const presentation=new Set(['flow','presentation','layout','columns','widthMm','heightMm','fontSize','lineHeight','spaceBefore','spaceAfter','indent','align','verification','sourceLayoutEvidence','sourceReview','answerSpaceMm','sourceOrder','classification','bankRef','canonicalId','snapshotKind','diagramColourModes']);
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
  for(const s of project?.sections??[]){
    // Calculated topic bands and editor-only source section headings are
    // legitimate inventory targets. Follow them to their first visible block
    // when the review panel opens the source comparison.
    if(s.id)nodes.set(s.id,{node:s,block:s.blocks[0]??s,ancestors:[]});
    for(const [index,sourceSection]of (s.sourceSections??[]).entries()){
      if(!sourceSection.sourceId||sourceSection.sourceId===s.id)continue;
      // Compact exercise coalescing keeps source-only difficulty headings and
      // their identities in provenance. Open their next question for comparison.
      const followingIds=(s.sourceSections??[]).slice(index).flatMap(section=>section.blockIds??[]);
      const block=followingIds.map(id=>s.blocks.find(block=>block.id===id)).find(Boolean)??s.blocks.at(-1)??s;
      nodes.set(sourceSection.sourceId,{node:sourceSection,block,ancestors:[s]});
    }
    for(const b of s.blocks)visit(b,b);
  }
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
  const source=entry.runId&&entry.runId!==project.source?.runId?project.source?.imports?.find(item=>item.runId===entry.runId)?.source:project.source;
  return signature({version:CONTENT_VERIFIER_VERSION,source:source?.sourceHashes,entry:{...entry,verification:undefined},content,context,sharedContext,assets});
}
export async function layoutVerificationKey(project,{renderer,fonts,edition}){
  return signature({project:{sections:project.sections,topics:project.topics,settings:project.settings,assets:project.assets},renderer,fonts,edition});
}
export async function inspectContentCoverage(project,{assetSignatures={}}={}){
  const inventories=sourceInventories(project),entries=inventories.flatMap(inventory=>inventory.entries??[]),nodes=contentNodes(project),issues=[],rows=[];
  const targetIds=new Set(entries.filter(e=>!e.exclusionReason).map(e=>e.targetId));
  const wholeQuestions=new Set(entries.filter(e=>!e.exclusionReason&&e.kind==='question').map(e=>e.targetId));
  const blocks=new Set((project.sections??[]).flatMap(section=>section.blocks??[]));
  // A native question root owns the whole question. Rich-text wrappers may
  // instead collect separately inventoried paragraphs and list items, as the
  // opening syllabus does. Only structural lists can inherit child mappings;
  // one mapped descendant never covers an unrecorded paragraph or table.
  const mappedDocumentNode=node=>!!node&&(
    targetIds.has(node.id)||
    node.type==='list'&&node.items?.length>0&&node.items.every(mappedDocumentNode)||
    node.type==='list-item'&&node.blocks?.length>0&&node.blocks.every(mappedDocumentNode)
  );
  const wholeEntry=(id,kind)=>entries.find(e=>!e.exclusionReason&&!e.field&&e.targetId===id&&(!kind||e.kind===kind));
  // These owners describe complete source units, not arbitrary descendants.
  // A shared-stem group retains a distinct whole-question mapping and the
  // original printed identity for every immediate child. Its shared prompt is
  // included in each child's contentVerificationKey through sharedContext.
  const mappedQuestionGroup=block=>{
    const root=block.content,identities=block.sourceReview?.sourceQuestionIdentities;
    return ['group','question'].includes(root?.type)&&root.children?.length>1&&Array.isArray(identities)&&
      identities.length===root.children.length&&new Set(identities.map(i=>i.targetId)).size===identities.length&&
      root.children.every(child=>{
        const entry=wholeEntry(child.id,'question'),identity=identities.find(i=>i.targetId===child.id);
        return !!entry&&!!identity&&identity.pageNumber===entry.pageNumber&&String(identity.sourceLabel)===String(entry.sourceLabel);
      });
  };
  const mappedPermanentDocumentNode=node=>!!node&&(
    !!wholeEntry(node.id)||
    node.type==='paragraph'&&entries.some(e=>!e.exclusionReason&&e.targetId===node.id&&e.field==='/inlines')||
    node.type==='list'&&node.items?.length>0&&node.items.every(mappedPermanentDocumentNode)||
    node.type==='list-item'&&node.blocks?.length>0&&node.blocks.every(mappedPermanentDocumentNode)
  );
  const mappedExample=example=>!!wholeEntry(example.id,'example')||
    !hasVisibleContent(example.label)&&Object.keys(example).every(key=>['id','label','prompt','questionDiagrams','solutionDiagrams','sourceRefs','sourcePageNumber'].includes(key))&&
    example.prompt?.format==='maths-editor-document-v1'&&example.prompt.blocks?.length>0&&example.prompt.blocks.every(mappedPermanentDocumentNode)&&
    [...(example.questionDiagrams??[]),...(example.solutionDiagrams??[])].every(diagram=>!!wholeEntry(diagram.id,'diagram'));
  const mappedWorkedExamples=block=>block.examples?.length>0&&block.examples.every(mappedExample)&&
    !['content','prompt','title','theorySolution','answer','questionDiagrams','solutionDiagrams'].some(key=>hasVisibleContent(block[key]));
  // A native table completion may need an answer-bearing part solely to expose
  // editable short/worked answers. Require the actual inventoried scaffold,
  // source completion requirement, question parent and response declaration.
  const mappedScaffoldResponse=(node,block,ancestors)=>{
    const table=node.prompt?.format==='maths-editor-document-v1'&&node.prompt.blocks?.length===1?node.prompt.blocks[0]:null;
    const entry=table?.type==='table'?wholeEntry(table.id,'diagram'):null;
    return node.type==='part'&&!node.label&&node.responseSpace==='scaffold'&&node.answerSpaceMm===0&&
      !node.children?.length&&!node.questionDiagrams?.length&&!node.sharedSolutionDiagrams?.length&&!!entry?.expectedAnswer&&
      ['cloze','working'].includes(entry.responseKind)&&block.sourceReview?.responses?.some(r=>r.targetId===node.id&&r.kind==='cloze')&&
      ancestors.some(parent=>entries.some(e=>e.id===entry.parentId&&e.kind==='question'&&!e.exclusionReason&&!e.field&&e.targetId===parent.id));
  };
  // Some packets retain a deliberately empty evidence block for a source
  // footer. Only the exact excluded footer identity can own that empty block;
  // adding any printable payload makes it ordinary unmapped content again.
  const excludedFooterEvidence=block=>block.type==='rich-text'&&block.content===''&&!block.sourceAtom?.id&&
    !['prompt','title','examples','answer','questionDiagrams','solutionDiagrams'].some(key=>hasVisibleContent(block[key]))&&
    entries.some(e=>e.id===block.id&&e.kind==='footer'&&e.pageNumber===block.sourcePageNumber&&e.exclusionReason?.trim());
  const mappedWrapper=node=>node.type==='question'&&wholeQuestions.has(node.content?.id)||
    node.type==='question'&&mappedQuestionGroup(node)||
    node.type==='worked-example'&&mappedWorkedExamples(node)||
    excludedFooterEvidence(node)||
    node.type==='rich-text'&&node.content?.format==='maths-editor-document-v1'&&
    node.content.blocks?.length>0&&node.content.blocks.every(mappedDocumentNode);
  // An authored answer leaf can respond to an explicit task already printed in
  // its ancestor prompt. Bind the exact inventoried response/task and payload;
  // an arbitrary parent paragraph, foreign question or stale pointer is not
  // sufficient. Shared prompts remain in contentVerificationKey dependencies.
  const boundParentPrompt=(node,block,ancestors)=>{
    const binding=block.sourceReview?.responses?.find(r=>r.targetId===node.id)?.promptBinding;
    if(!binding?.reason?.trim()||!/^\/prompt(?:\/blocks\/\d+(?:\/inlines\/\d+)?)?$/.test(binding.path??''))return false;
    const owner=ancestors.find(parent=>parent.id===binding.ownerId);
    const entry=entries.find(e=>e.id===binding.sourceInventoryId&&!e.exclusionReason);
    if(!owner||!entry||!['question','part','subpart'].includes(entry.kind))return false;
    const sourceTarget=nodes.get(entry.targetId);
    if(sourceTarget?.block!==block||!(entry.targetId===node.id||entry.targetId===owner.id||sourceTarget.node===block&&block.content===owner))return false;
    const payload=binding.path.split('/').slice(1).reduce((value,key)=>value?.[key],owner);
    const visible=typeof payload==='string'?hasVisibleContent(payload):payload?.type==='math'?!!payload.latex?.trim():payload?.type==='text'?!!payload.text?.trim():false;
    return visible&&JSON.stringify(payload)===JSON.stringify(binding.expected);
  };
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
    rows.push({id:entry.id,targetId:entry.targetId,pageNumber:entry.pageNumber,...(entry.runId?{runId:entry.runId}:{}),kind:entry.kind,state});
  }
  for(const inventory of inventories){
    if(!inventory.entries?.length)issue('missing-inventory',null,`Source ${inventory.runId??project.source?.runId??''} inventory has not been recorded.`);
    for(const page of inventory.selectedPages??[])if(!inventory.pages?.some(p=>p.pageNumber===page&&p.inventoried))issue('unchecked-page',null,`Source ${inventory.runId?inventory.runId+' ':''}p${page} has not been inventoried.`);
  }
  const hasAnswer=value=>value!=null&&hasVisibleContent(value);
  for(const flag of project.studio?.flags??[])if(!flag.resolved)issue(flag.kind??'review-finding',flag.targetId,flag.note??'Unresolved review finding.');
  for(const {node,block,ancestors}of nodes.values()){
    if((blocks.has(node)&&!mappedWrapper(node)||['part','subpart'].includes(node.type)&&!mappedScaffoldResponse(node,block,ancestors)||['tikz','svg','image'].includes(node.format))&&!targetIds.has(node.id))issue('unmapped-content',node.id,'Content has no source inventory mapping.');
    if(node!==block&&['question','part','subpart'].includes(node.type)&&!node.children?.length&&block.type==='question'){
      const scaffoldRef=block.sourceReview?.responses?.find(r=>r.targetId===node.id)?.scaffoldTargetId;
      const scaffold=scaffoldRef?nodes.get(scaffoldRef):null;
      const boundScaffold=node.responseSpace==='scaffold'&&scaffold?.block===block&&
        (scaffold.node.type==='table'||scaffold.node.type==='paragraph'&&scaffold.node.inlines?.some(i=>i.type==='cloze'));
      if(!hasVisibleContent(node.prompt)&&![...ancestors,node].some(n=>n.questionDiagrams?.length)&&!boundScaffold&&!boundParentPrompt(node,block,ancestors))issue('missing-prompt',node.id,'Response has no visible prompt, shared question diagram or explicitly bound native scaffold.');
      for(const mode of ['short','worked'])if(!hasAnswer(node.answer?.[mode]))issue('missing-answer',node.id,`Missing ${mode} answer.`);
      if(node.answer?.provenance?.worked==='source-short-only')issue('missing-worked-solution',node.id,'A supplied short answer still needs a worked solution.');
    }
    for(const id of [...(node.dependsOn??[]),node.pairedBlockId,node.flow?.continuationOf??node.continuationOf].filter(Boolean))if(!nodes.has(id))issue('broken-reference',node.id,`Missing dependency ${id}`);
  }
  const contentComplete=entries.length>0&&!issues.length, presentationReport=await inspectPresentationFidelity(project);
  return {version:2,complete:contentComplete&&presentationReport.complete,contentComplete,presentation:presentationReport,total:entries.length,counts:Object.fromEntries(['verified','excluded','missing','duplicate','ambiguous','unchecked'].map(s=>[s,rows.filter(r=>r.state===s).length])),rows,issues:[...issues,...presentationReport.issues]};
}
