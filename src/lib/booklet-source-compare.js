// Source tab (22 October 2026, simplified 23 October 2026: docs/booklet-verification-speed.md). Pure helpers for
// BookletSourceCompare.svelte: the source page(s) of the selected block, read through the existing
// /__booklet/full-imports/<run>/files/ endpoint, and the polish review queue of that import run
// (polish/report.json): the layout findings the residual review left, the exercise breaks worth removing, and the
// pedagogy findings that were reported rather than posted. No regions: the page is shown, not marked.

import {sourcePageOptions} from './booklet-source-content.js';

const base=runId=>`/__booklet/full-imports/${encodeURIComponent(runId)}/files/`;
export const reportUrl=runId=>base(runId)+'polish/report.json';
export const pageImageUrl=(runId,page)=>`${base(runId)}evidence/pages/page-${String(page).padStart(3,'0')}.png`;
export const runIdOf=project=>project?.source?.runId??project?.runId??null;

// The source pages a block was transcribed from, in order, without repeats.
export const sourcePagesOf=block=>[...new Set([block?.sourcePageNumber,...(block?.sourceRefs??[]).map(ref=>ref?.pageNumber)].filter(Number.isInteger))];

// Keep explicit merged-run references authoritative when a legacy page number repeats them.
export function sourceOptionsOf(project,block){
 const refs=[...(block?.sourceRefs??[])];
 if(Number.isInteger(block?.sourcePageNumber)&&!refs.some(ref=>ref.pageNumber===block.sourcePageNumber))refs.unshift({pageNumber:block.sourcePageNumber});
 return sourcePageOptions({...project,source:{...project?.source,runId:runIdOf(project)}},refs);
}

// One list for the teacher: what the residual review could not fix, then the breaks that could go, then the
// pedagogy findings that were only reported. `target` is the id the row selects in the booklet.
export function reviewQueue(report){
 if(!report)return [];
 const rows=[];
 for(const row of report.residual?.listed??[])rows.push({kind:'residual',id:row.id,target:row.targets?.[0]??null,label:`${row.area}${row.page?' · p'+row.page:''}`,detail:row.comment??'',page:row.page??null});
 rows.sort((a,b)=>(a.page??1e9)-(b.page??1e9));
 for(const item of report.breakSuggestions??[])rows.push({kind:'break',id:item.firstBlockId,target:item.firstBlockId,label:'page break',detail:`Page ${item.pageBefore} has ${item.freeMm} mm free; removing the break saves about ${item.estPagesSaved} page${item.estPagesSaved===1?'':'s'}.`});
 for(const row of report.pedagogy?.reportedOnly??[])rows.push({kind:'pedagogy',id:row.id,target:null,label:row.kind??'pedagogy',detail:row.finding??''});
 return rows;
}
