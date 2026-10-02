// Source inventory owns category boundaries; assignment slices never establish a start.
const normal=value=>String(value??'').trim().replace(/\s+/g,' ').toLowerCase();
const categoryLabel=value=>/^(concept checks?|essential problems|additional practice|enrichment)$/.test(normal(value));
export const categoryGroupAnchors=g=>[g.id,g.entryId,g.inventoryId,g.inventoryGroupId,g.headingEntryId,g.targetId].filter(Boolean);
const labelOf=g=>{
 const values=[g.header,g.exactHeader,g.category,g.title,g.sourceLabel,g.description];
 // Compact booklets retain source difficulty in editor metadata, not printed
 // category headings. A broad practice-category declaration cannot override it.
 const explicit=values.find(categoryLabel);
 if(explicit)return explicit;
 const fallback=g.kind==='practice-category'?values.find(v=>typeof v==='string'&&v.trim()):undefined;
 return /^(foundation|development|mastery)$/.test(normal(fallback))?undefined:fallback;
};
const categoryGroup=g=>!g.exclusionReason&&!g.indivisible&&!g.sharedActivity&&!!labelOf(g)&&['practice-category','practice'].includes(g.kind);
const headingEntry=e=>!e.exclusionReason&&!e.sharedStemId&&e.kind==='group'&&!!labelOf(e);
const memberFields=['questionIds','inventoryIds','entryIds','members','memberIds','memberGroupIds','memberQuestionIds','authoringBlocks','authoringOrder','orderedChildren','questionOrder','authoringTasks','authoringQuestionOrder','taskOrder','children','sourceOrder','sharedInstructionGroups','standaloneQuestions'];
const memberIds=g=>memberFields.flatMap(key=>Array.isArray(g[key])?g[key].map(v=>typeof v==='string'?v:v?.targetId).filter(Boolean):[]);
const visibilityFields=['headingVisibleOnTargetPage','headingVisibleOnTarget','headingPrintedOnTargetPage','headingOnTargetPage','headerVisibleOnTarget','headerVisibleOnTargetPage'];
function continuation(g){
 if(visibilityFields.some(key=>g[key]===false)||g.continuedFrom||g.continuationOf||g.sourceCategoryBeginsHere===false)return true;
 const evidence=Object.entries(g).filter(([key])=>/heading|header/i.test(key)).map(([,value])=>typeof value==='string'?value:'').join(' ');
 return /no (?:repeated )?category (?:heading|band)|no category heading.*(?:printed|repeated)|(?:heading|band) (?:is )?not repeated|without a repeated category heading/i.test(evidence);
}

export function practiceCategoryHeadingOwnership(inventory){
 const entries=inventory.entries??[],groups=inventory.groups??[],byAnchor=new Map(),parents=new Map();
 const categoryGroups=groups.filter(categoryGroup),headingEntries=new Set(entries.filter(e=>headingEntry(e)||
  e.kind==='group'&&!e.exclusionReason&&!e.sharedStemId&&categoryGroups.some(g=>categoryGroupAnchors(g).some(id=>id===e.id||id===e.targetId)&&[e.sourceLabel,e.description].some(text=>normal(text)===normal(labelOf(g))))));
 for(const entry of entries)for(const id of [entry.id,entry.targetId].filter(Boolean)){byAnchor.set(id,entry);parents.set(id,entry.parentId);}
 for(const group of groups)for(const id of categoryGroupAnchors(group))if(!parents.has(id))parents.set(id,group.parentId);
 const records=categoryGroups.map(group=>({group,heading:entries.find(e=>headingEntries.has(e)&&categoryGroupAnchors(group).some(id=>id===e.id||id===e.targetId))}));
 // Some inventories retain the heading separately from the category metadata.
 for(const heading of headingEntries){
  if(records.some(r=>r.heading===heading))continue;
  const matches=records.filter(r=>!r.heading&&!continuation(r.group)&&normal(labelOf(r.group))===normal(labelOf(heading)));
  if(matches.length===1)matches[0].heading=heading;
  else records.push({group:{id:heading.id,kind:'practice-category',header:labelOf(heading)},heading});
 }
 return records.map(({group,heading})=>{
  const aliases=new Set([...categoryGroupAnchors(group),heading?.id,heading?.targetId].filter(Boolean)),members=new Set(memberIds(group));
  const belongs=entry=>{
   let id=entry.id;const visited=new Set();
   while(id&&!visited.has(id)){if(members.has(id)||aliases.has(id))return true;visited.add(id);const e=byAnchor.get(id);if(e?.targetId&&members.has(e.targetId))return true;id=parents.get(id);}
   return false;
  };
  const questions=entries.filter(e=>e.kind==='question'&&!e.exclusionReason&&belongs(e));
  let first=questions[0];
  // An actual ordered heading entry establishes its next question; metadata alone does not.
  if(!first&&heading)for(const e of entries.slice(entries.indexOf(heading)+1)){if(headingEntries.has(e))break;if(e.kind==='question'&&!e.exclusionReason){first=e;break;}}
  let owner=first;
  const seen=new Set();
  while(owner&&!seen.has(owner.id)){
   seen.add(owner.id);const parent=byAnchor.get(owner.sharedStemId)??byAnchor.get(owner.parentId);
   if(!parent||parent===owner||headingEntries.has(parent)||!['group','question'].includes(parent.kind))break;
   owner=parent;
  }
  const status=continuation(group)?'continuation':first?'start':'needs-review';
  return {sourceGroupId:group.id,pageNumber:inventory.pageNumber,label:labelOf(group),...(heading?{sourceInventoryId:heading.id}:{}),status,
   ...(first?{firstQuestionInventoryId:first.id,ownerInventoryId:owner.id,ownerTargetId:owner.targetId??owner.id}:{}),
   memberInventoryIds:questions.map(e=>e.id),
   ...(status==='needs-review'?{finding:'Category boundary needs an explicit first question from the full source inventory; do not invent a start.'}:{})};
 });
}

export function assignmentCategoryHeadings(inventory,inventoryIds){
 const owned=new Set(inventoryIds);
 return practiceCategoryHeadingOwnership(inventory).filter(r=>r.status==='needs-review'||owned.has(r.sourceInventoryId)||owned.has(r.ownerInventoryId)||r.memberInventoryIds.some(id=>owned.has(id)))
  .map(({memberInventoryIds,...record})=>({...record,ownsHeading:record.status==='start'&&owned.has(record.firstQuestionInventoryId)}));
}

// Project only explicit declarations, leaving canonical packets and original mappings intact.
export function projectPracticeCategoryMappings(packet,inventory){
 if(packet.pageNumber!==inventory.pageNumber)throw Error('Category heading source page mismatch');
 const ownership=practiceCategoryHeadingOwnership(inventory),mappings=structuredClone(packet.inventoryMappings??[]),seen=new Set();
 for(const section of packet.sections??[])for(const block of section.blocks??[]){
  const declaration=block.sourceReview?.sourceCategoryHeading;
  if(!declaration?.sourceInventoryId)continue; // Group-only headings never create inventory IDs.
  const fail=reason=>{throw Error(`Invalid category heading ${declaration.sourceInventoryId}: ${reason}`);};
  if(seen.has(declaration.sourceInventoryId))fail('duplicate owner');seen.add(declaration.sourceInventoryId);
  const entry=inventory.entries?.find(e=>e.id===declaration.sourceInventoryId);
  const record=entry&&ownership.find(r=>r.sourceInventoryId===entry.id);
  if(!entry||!record||entry.kind!=='group'||entry.exclusionReason||entry.sharedStemId)fail('not a real inventory heading entry');
  if(!record||record.status!=='start')fail('source category start is unestablished or a continuation');
  if(declaration.sourceGroupId&&declaration.sourceGroupId!==record.sourceGroupId)fail('source group does not match inventory');
  if(block.type!=='question')fail('owner is not a question');
  const pages=[block.sourcePageNumber,...(block.sourceRefs??[]).map(r=>r.pageNumber),...(block.sourceReview?.sourcePages??[])].filter(Number.isInteger);
  if(!pages.includes(packet.pageNumber)||(Number.isInteger(declaration.pageNumber)&&declaration.pageNumber!==packet.pageNumber))fail('owner lacks matching source page');
  const nodeIds=new Set();
  const collect=node=>{if(!node||typeof node!=='object')return;if(node.id)nodeIds.add(node.id);for(const child of node.children??[])collect(child);};collect(block.content);nodeIds.add(block.id);
  const ownerMappings=mappings.filter(m=>[record.ownerInventoryId,record.firstQuestionInventoryId].includes(m.inventoryId));
  if(!nodeIds.has(record.ownerTargetId)&&!ownerMappings.some(m=>nodeIds.has(m.targetId)))fail('declaration is not on the first owning question');
  const prompt=block.content?.prompt,paragraph=prompt?.format==='maths-editor-document-v1'?prompt.blocks?.find(p=>p.id===declaration.targetId):null;
  if(paragraph?.type!=='paragraph'||!Array.isArray(paragraph.inlines)||paragraph.inlines.some(i=>i.type!=='text'))fail('target is not a native text paragraph in the owning question prompt');
  const text=paragraph.inlines.map(i=>i.text??'').join('');
  if(!normal(text)||normal(text)!==normal(record.label)||![entry.sourceLabel,entry.description].some(value=>normal(value)===normal(text))||(declaration.label!==undefined&&normal(declaration.label)!==normal(text)))fail('paragraph, declaration and source heading text disagree');
  const matches=mappings.filter(m=>m.inventoryId===entry.id);
  if(!matches.length)fail('author mapping is missing');
  for(const mapping of matches){
   if(mapping.targetId===paragraph.id&&mapping.field==='/inlines')continue;
   if(mapping.field!=='/title'||!packet.sections.some(s=>s.id===mapping.targetId))fail('mapping is not an obsolete section title');
   mapping.sourceCategoryHeadingMapping={originalMapping:structuredClone(mapping),sourceGroupId:record.sourceGroupId,questionId:block.id};
   mapping.targetId=paragraph.id;mapping.field='/inlines';
  }
 }
 return mappings;
}
