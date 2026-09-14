// Reusable read-only project routing and final-size browser measurements.
import {answerDiagramSignature} from '../../src/lib/booklet-exercises.js';
import {createHash} from 'node:crypto';

export function diagramSourcePreflight(project) {
 const diagrams=[];
 const walk=value=>{
  if(!value||typeof value!=='object')return;
  if(value.format==='tikz'&&value.code){
   const signature=answerDiagramSignature(value);
   diagrams.push({id:value.id,sourceHash:createHash('sha256').update(value.code).digest('hex'),signature,overlayOf:value.overlayOf??null,
    answerWidths:['short','worked'].flatMap(mode=>{const style=project.settings?.compactAnswers?.diagramStyles?.[mode]?.[value.id];return style?[{mode,...style,current:style.sourceSignature===signature}]:[]})});
  }
  for(const [key,child] of Object.entries(value))if(!['spec','provenance','sourceReview','sourceLayoutEvidence','sourceAtom'].includes(key))walk(child);
 };walk(project.sections);
 return {diagrams,issues:diagrams.flatMap(d=>d.answerWidths.filter(w=>!w.current).map(w=>({kind:'stale-answer-width',diagramId:d.id,mode:w.mode,sourceSignature:w.sourceSignature,currentSignature:d.signature})))};
}

export async function routeCandidateProject(page,project) {
 if(!project?.id||!Array.isArray(project.sections)||!project.settings)throw Error('Candidate requires id, sections and settings');
 const get=(route,json)=>route.request().method()==='GET'?route.fulfill({json}):route.abort();
 await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());
 await page.route('**/__booklet/bank/manifest',r=>get(r,{format:'mathsmap-practice-bank-v3',version:3,questions:[]}));
 await page.route(/\/__booklet\/projects(?:\?.*)?$/,r=>get(r,[{id:project.id,title:project.title}]));
 await page.route('**/__booklet/projects/'+encodeURIComponent(project.id),r=>get(r,project));
 await page.route('**/__booklet/projects/'+encodeURIComponent(project.id)+'/open',r=>get(r,{project,bankSync:{items:[]},bankSyncError:''}));
}

export async function inspectFinalSizeDiagrams(page) {
 return page.evaluate(async()=>{
  const {inspectDiagramLabelLayout,measureDiagramLabels,graphPageScale}=await import('/src/lib/diagram-typography.js');
  const root=document.querySelector('.project-print');
  if(!root||!root.querySelector('.print-page'))throw Error('Diagram preflight requires a populated print surface');
  const pages=[...root.querySelectorAll('.print-page')];
  const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
  const figures=[...root.querySelectorAll('.tikz-wrap svg')].filter(visible).map((svg,index)=>{
   const labels=measureDiagramLabels(svg),bounds=svg.getBoundingClientRect(),scale=graphPageScale(svg);
   const issues=inspectDiagramLabelLayout(svg);
   if(svg.querySelector('text')&&!labels.length)issues.push({kind:'diagram-label-calibration-missing'});
   for(const [label,m] of labels.entries())if(Math.abs(m.pt-m.targetPt)>.1)issues.push({kind:'diagram-label-size',label,...m});
   return {index,page:pages.indexOf(svg.closest('.print-page'))+1,id:svg.closest('[data-diagram-id]')?.dataset.diagramId??null,
    widthMm:bounds.width/scale*25.4/96,heightMm:bounds.height/scale*25.4/96,viewBox:svg.getAttribute('viewBox'),labels,issues};
  });
  const overlays=[...root.querySelectorAll('.diagram-composite')].filter(visible).map(el=>({
   page:pages.indexOf(el.closest('.print-page'))+1,id:el.closest('[data-diagram-id]')?.dataset.diagramId,
   layers:[...el.querySelectorAll('svg')].map(svg=>{const r=svg.getBoundingClientRect();return {viewBox:svg.getAttribute('viewBox'),x:r.x,y:r.y,width:r.width,height:r.height};}),
   reviewRequired:'Separate SVG layers require visual coordinate-frame and angle-region review.'
  }));
  return {figures,overlays,rasterOccurrences:[...root.querySelectorAll('img')].filter(visible).length,
   issues:figures.flatMap(f=>f.issues.filter(i=>!['diagram-label-overlap','diagram-label-viewport'].includes(i.kind)).map(i=>({page:f.page,diagramId:f.id,...i}))),
   visualFindings:figures.flatMap(f=>f.issues.filter(i=>['diagram-label-overlap','diagram-label-viewport'].includes(i.kind)).map(i=>({page:f.page,diagramId:f.id,...i}))),
   note:'Measurements detect bounds and label-size defects. Viewport spill, overlaps, overlays, raster labels and mathematical angle regions require source comparison and visual review.'};
 });
}
