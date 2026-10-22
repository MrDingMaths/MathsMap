// Source compare tab (22 October 2026, user approved: docs/booklet-verification-speed.md).
// Pure helpers for BookletSourceCompare.svelte: where the files of source-match live under the import
// run (read through the existing /__booklet/full-imports/<run>/files/ endpoint), the highlight of a
// block's region on its source page, and the review queue ordered lowest confidence first.

const base=runId=>`/__booklet/full-imports/${encodeURIComponent(runId)}/files/`;
export const regionsUrl=runId=>base(runId)+'source-match/regions.json';
export const queueUrl=runId=>base(runId)+'source-match/review-queue.json';
export const pageImageUrl=(runId,page)=>`${base(runId)}evidence/pages/page-${String(page).padStart(3,'0')}.png`;
export const runIdOf=project=>project?.source?.runId??project?.runId??null;

// The parts of one block's region as percentages of the page image, ready for absolute positioning.
export function regionParts(entry){
 return (entry?.parts??[]).filter(p=>Array.isArray(p.box)&&p.width>0&&p.height>0).map(p=>({
  page:p.page,
  left:100*p.box[0]/p.width,top:100*p.box[1]/p.height,
  width:100*(p.box[2]-p.box[0])/p.width,height:100*(p.box[3]-p.box[1])/p.height,
  confidence:p.confidence??entry.confidence??null
 }));
}
// How sure the match is, as words and a rank for ordering. A located region (a model answer) is as
// good as a matched one; a missing region is the least certain.
export function confidenceOf(entry,item=null){
 if(entry?.located)return {value:null,label:'located by the model',rank:1};
 const value=entry?.confidence??item?.confidence??null;
 if(value==null)return {value:null,label:'no region',rank:-1};
 return {value,label:Math.round(value*100)+'% of the text matched',rank:value};
}
export const entryFor=(regions,blockId)=>regions?.blocks?.[blockId]??null;
export const itemFor=(queue,blockId)=>(queue?.items??[]).find(item=>item.blockId===blockId)??null;
// Lowest confidence first; items without a number come first (nothing matched), then the most mismatches.
export function sortedQueue(queue){
 return [...(queue?.items??[])].sort((a,b)=>(a.confidence??-1)-(b.confidence??-1)||(b.mismatches?.length??0)-(a.mismatches?.length??0)||String(a.blockId).localeCompare(String(b.blockId)));
}
// One line for a mismatch or a finding of the combined queue.
export const describeMismatch=m=>`${m.type??m.check??'difference'}${m.severity?' ('+m.severity+')':m.status?' ('+m.status+')':''}: ${m.detail??''}`.trim();
// The source pages a block's region lies on, in order, without repeats.
export const regionPages=entry=>[...new Set(regionParts(entry).map(p=>p.page))];
