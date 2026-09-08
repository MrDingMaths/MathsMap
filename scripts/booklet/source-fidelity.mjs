// Deterministic reconstruction diagnostics; human review is not tracked.
import crypto from 'node:crypto';
export const revisionHash=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function reconstructionHazards(pages){
 const flags=[];const add=(page,id,code,note)=>flags.push({page,id,code,severity:'major',note});
 for(const page of pages){
  const occurrences=new Map();
  const walk=(v,ancestorPlots=[],key='')=>{if(!v||typeof v!=='object')return;
   if(v.sourceOccurrenceId&&v.usage!=='evidence-only'){const prev=occurrences.get(v.sourceOccurrenceId);if(prev)add(page.pageNumber,v.id,'duplicate-occurrence','Two rendered representations own source occurrence '+v.sourceOccurrenceId);else occurrences.set(v.sourceOccurrenceId,v.id);}
   const plots=[...ancestorPlots,...(v.sharedSolutionDiagrams??[])];
   if(v.answer&&typeof v.answer==='object'&&!v.children?.length){
    const worked=v.answer.worked;
    const hasWorked=typeof worked==='string'?Boolean(worked.trim()):Boolean(worked?.blocks?.length||worked?.paragraphs?.length||worked?.inlines?.length||worked?.segments?.length);
    if(!hasWorked&&!v.answer.solutionDiagrams?.length&&!plots.length)add(page.pageNumber,v.id,'missing-worked-answer','Worked view has no answer or diagram.');
    if(v.responseKind==='graph'&&!v.answer.solutionDiagrams?.length&&!plots.length)add(page.pageNumber,v.id,'missing-sketch','Graphical answer requires a plotted solution, including a shared group graph.');
   }
   if(v.format==='tikz'&&(v.mathematicalModel?.lines?.length||Number.isFinite(v.mathematicalModel?.m))&&!/\\addplot(?:\[[^\]]*\])?\s*(?:\{|\()/.test(v.code??''))add(page.pageNumber,v.id,'noneditable-function-graph','Function graphs must retain equation-valued PGFPlots expressions, not fixed endpoint paths.');
   if(v.format==='image'&&!v.retentionReason)add(page.pageNumber,v.id,'unreasoned-raster','Retained image lacks complexity or unresolved-evidence reason.');
   if(v.format==='tikz'&&/\b(?:plot)\b/.test(v.spec?.description??'')&&!v.code?.includes('\\clip')&&!/clip\s*=\s*true/.test(v.code??''))add(page.pageNumber,v.id,'unchecked-bounds','A plotted diagram needs explicit clipping bounds and independent mathematical review.');
   for(const [k,x] of Object.entries(v)){
    if(['sourceAtom','spec','code','mathematicalModel','provenance'].includes(k))continue;
    if(typeof x==='string'&&['prompt','content','short','worked','theorySolution','visibleSubtitle','title'].includes(k)){
     const prose=x.replace(/\$\$[\s\S]*?\$\$|(?<!\\)\$[^$]*\$/g,'');if(/\\(?:quad|qquad|frac|times|div|text|color)\b/.test(prose))add(page.pageNumber,v.id,'raw-latex','TeX command appears outside a mathematics span.');
    }else if(Array.isArray(x))x.forEach(c=>walk(c,plots,k));else walk(x,plots,k);
   }
  };walk(page);
 }
 return flags;
}
