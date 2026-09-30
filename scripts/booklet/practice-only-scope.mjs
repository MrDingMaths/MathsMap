import {isTheoryReview} from '../../src/lib/question-bank-eligibility.js';
import {contentSource} from '../../src/lib/document-content.js';

export function validateContentScope(scope) {
  if(scope!==undefined&&!['all','practice-only'].includes(scope))throw Error('Unsupported contentScope: '+scope);
}

export const PRACTICE_ONLY_PROMPT = `CONTENT SCOPE: practice-only. Include every printed practice/review question, including Concept Check, Essential Problems, Additional Practice, Enrichment and chapter review sets. These are selectable practice questions, never theory-review, sourceAtom.kind=review or pedagogyRole=review. One question block per shared source task: put a shared instruction or definition once on the parent and related items in editable a, b, c parts, even when the source numbers them individually. Preserve meaningful source-group boundaries, exercise/category boundaries and existing nested parts. Inventory every printed item independently and give items under one shared instruction the same sharedStemId; map each to its distinct child node. Use a native grid with source-informed columns reduced as needed for readable expressions and working. Preserve original printed numbers in provenance and renumber displayed questions within each exercise. Generate/review worked solutions first; estimate each part's answerSpaceMm from mathematical rows (including TeX row separators), wrapping at cell width, fractions, diagrams and handwriting allowance using booklet-working-space.js. Save editable estimates with sourceReview.workingSpaceEstimate; preserve explicit manual overrides. Tick-only/inline/cloze responses need no full working area. Check representative grids at final size. Preserve the printed exercise, category, question label, PDF page and printed page in sourceReview.sourceIdentity. Preserve source numerical order, including multi-column pages. Standalone theory, definitions, summaries and worked examples are reference evidence only: inventory each with an explicit exclusionReason, never author them into sections. On mixed pages inspect and select only question regions. Definitions, instructions and supplied working embedded in an actual question remain part of that question. Mark such inventory entries embeddedInQuestion with the actual question inventory ID. Inventory every question/subpart/diagram and excluded teaching region independently from pixels; OCR is supporting evidence. For each question record inspected teaching PDF pages, the taught method and individual mapping rationale in sourceReview.teachingContext. Independently solve first, then compare against the supplied answer evidence by exercise, printed question label, stem and mathematical content, never page number alone. Record answerEvidence with questionId, teacherReference, matchEvidence and conflict; an absent/ambiguous/contradictory match is a finding. Keep original printed errors separate from OCR errors; propose corrections without rewriting original evidence.`;

export function validatePracticeInventory(inventory) {
  const questions=new Set(inventory.entries.filter(e=>e.kind==='question'&&!e.exclusionReason).map(e=>e.id));
  const byId=new Map(inventory.entries.map(e=>[e.id,e]));
  const excludedTeachingAncestor=e=>{const seen=new Set();let p=byId.get(e.parentId);while(p&&!seen.has(p.id)){seen.add(p.id);if(p.exclusionReason&&['teaching','example','syllabus','summary','definition'].includes(p.kind))return true;p=byId.get(p.parentId);}return false;};
  for(const e of inventory.entries) {
    if(e.embeddedInQuestion&&!questions.has(e.embeddedInQuestion))throw Error('Unknown embedded question: '+e.id);
    if(['teaching','example','syllabus','summary','definition'].includes(e.kind)&&!e.embeddedInQuestion&&!e.exclusionReason?.trim())throw Error('Practice-only inventory must exclude standalone teaching: '+e.id);
    if(['question','part'].includes(e.kind)&&e.exclusionReason&&!excludedTeachingAncestor(e))throw Error('Practice-only cannot exclude a practice question or part: '+e.id);
  }
}

export function validatePracticeAuthor(result,inventory) {
  validatePracticeInventory(inventory);
  const blocks=result.sections.flatMap(s=>s.blocks);
  for(const s of result.sections) {
    if(s.phase!=='practice'||isTheoryReview({},s))throw Error('Practice-only author sections must be practice');
    for(const b of s.blocks)if(b.type!=='question'||b.pedagogyRole||isTheoryReview(b,s))throw Error('Practice-only author contains teaching/non-selectable content: '+b.id);
  }
  const excluded=new Set(inventory.entries.filter(e=>e.exclusionReason).map(e=>e.id));
  // Some preserved inventories put reference-only answer/footer notes inside
  // presentation. They may stay as provenance without entering student prompts;
  // this never permits excluding a practice question, part or diagram.
  const referenceExclusions=new Set(inventory.entries.filter(e=>e.presentation?.exclusionReason?.trim()&&
    (['answer','footer'].includes(e.kind)||e.kind==='cover'&&/publisher.*(?:navigation|furniture)|(?:navigation|furniture).*publisher/i.test(e.presentation.exclusionReason))).map(e=>e.id));
  for(const m of result.inventoryMappings) {
    if(excluded.has(m.inventoryId)&&!m.exclusionReason)throw Error('Excluded teaching was mapped to authored content: '+m.inventoryId);
    if(!excluded.has(m.inventoryId)&&m.exclusionReason&&!referenceExclusions.has(m.inventoryId))throw Error('Practice content was excluded during authoring: '+m.inventoryId);
  }
  const questions=inventory.entries.filter(e=>e.kind==='question'&&!e.exclusionReason),owners=new Map(),targets=new Set();
  const ids=n=>[n?.id,...(n?.children??[]).flatMap(ids)].filter(Boolean);
  for(const q of questions){
    const mappings=result.inventoryMappings.filter(m=>m.inventoryId===q.id&&!m.exclusionReason);
    const owned=blocks.filter(b=>mappings.some(m=>m.targetId===b.id||ids(b.content).includes(m.targetId)));
    if(owned.length!==1)throw Error('Each printed question needs its own whole question block or a distinct shared-stem part: '+q.id);
    const block=owned[0], prior=owners.get(block.id)??[];
    if(prior.length&&(!q.sharedStemId||prior.some(p=>p.sharedStemId!==q.sharedStemId)))throw Error('Each printed question needs its own whole question block unless source sharedStemId agrees: '+q.id);
    if(q.sharedStemId){
      const localParts=inventory.entries.filter(e=>e.kind==='part'&&e.parentId===q.id&&!e.exclusionReason);
      const localTargets=localParts.map(e=>result.inventoryMappings.find(m=>m.inventoryId===e.id&&!m.exclusionReason&&m.targetId!==block.id&&m.targetId!==block.content.id&&ids(block.content).includes(m.targetId))?.targetId);
      const distinctLocalParts=localParts.length>0&&localTargets.every(Boolean)&&new Set(localTargets).size===localParts.length;
      const range=String(q.sourceLabel??q.sourceReview?.sourceIdentity?.questionLabel??'').match(/^\s*Q?(\d+)\s*[-–—]\s*Q?(\d+)\s*$/i);
      const partNumbers=new Set(localParts.map(e=>String(e.sourceLabel??'').match(/^\s*Q?(\d+)(?:\b|\()/i)?.[1]).filter(Boolean).map(Number));
      const groupedRangeRoot=distinctLocalParts&&range&&Number(range[2])>=Number(range[1])&&partNumbers.size===Number(range[2])-Number(range[1])+1&&[...partNumbers].every(n=>n>=Number(range[1])&&n<=Number(range[2]));
      const numberedNestedRoot=distinctLocalParts&&!range&&/^\s*Q?\d+\.?\s*$/i.test(String(q.sourceLabel??''))&&
       questions.filter(entry=>entry.sharedStemId===q.sharedStemId).length===1&&
       (q.sourceReview?.sourceIdentity?.pdfPages??[inventory.pageNumber]).length===1;
      const continuedRoot=distinctLocalParts&&
       result.sharedContentContinuations?.some(ref=>ref.blockId===block.id&&ref.reason?.trim()&&ref.canonicalPageNumber<inventory.pageNumber&&
        [ref.canonicalPageNumber,inventory.pageNumber].every(page=>q.sourceReview?.sourceIdentity?.pdfPages?.includes(page)&&block.sourceRefs?.some(r=>r.pageNumber===page)));
      const part=mappings.find(m=>m.targetId!==block.id&&m.targetId!==block.content.id&&ids(block.content).includes(m.targetId));
      // An independently inventoried continuation root represents the whole
      // shared question. Its individual parts still map locally; the assignment
      // coalescer checks explicit ownership and byte-identical complete copies.
      if(!continuedRoot&&!groupedRangeRoot&&!numberedNestedRoot){if(!part||targets.has(part.targetId))throw Error('Shared-stem items require distinct part targets: '+q.id);targets.add(part.targetId);}
      const fullWidthReason=block.sourceReview?.grouping?.layoutReason??
       (Array.isArray(block.sourceReview?.arrangements)?block.sourceReview.arrangements.find(row=>row.targetId===block.content.id&&row.layout==='list'&&(row.columns==null||row.columns===1)&&row.description?.trim())?.description:null);
      if(block.content.layout!=='grid'&&!(block.content.layout==='list'&&fullWidthReason?.trim()))throw Error('Shared-stem question requires an editable part grid or a reviewed full-width layout: '+block.id);
      if(!block.sourceReview?.workingSpaceEstimate)throw Error('Shared-stem question requires reviewed solution-informed spacing: '+block.id);
    }
    owners.set(block.id,[...prior,q]);
  }
  for(const group of new Set(questions.map(q=>q.sharedStemId).filter(Boolean))){
    const containing=[...owners].filter(([,items])=>items.some(q=>q.sharedStemId===group));
    if(containing.length!==1)throw Error('Shared instruction was flattened into separate questions: '+group);
  }
  if(owners.size!==blocks.length)throw Error('Practice author added a question without a printed question identity');
  for(const block of blocks){
    const parent=contentSource(block.content.prompt).trim();
    if(parent.length>10&&(block.content.children??[]).some(n=>contentSource(n.prompt).trim().startsWith(parent)))throw Error('Repeated shared stem inside part: '+block.id);
  }
}
