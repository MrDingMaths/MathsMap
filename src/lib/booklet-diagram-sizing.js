// Authoring and explicit maintenance only. Loading an existing project never
// adopts these sizes. Measurements are at final print size, including labels.
export const DIAGRAM_SIZING_VERSION='source-calibrated-2026-10-25';
export const DIAGRAM_SIZING_PROMPT=`Diagram sizing (25 October 2026): size figures for their mathematical task, not to fill the column. Routine supplied geometry/solids usually start 30–45 mm wide and 25–40 mm high; 40 mm is a review trigger, not a hard maximum. Simple figures in part grids or tables start near 32 mm wide. Supplied question graphs start around 70 mm wide and 50–65 mm high (review above 75 mm wide or 65 mm high); short-answer graphs around 50 mm (review above 55 × 50 mm), worked graphs around 60 mm (review above 65 × 60 mm). Short-answer figures are usually 25–45 mm wide (review above 50 × 35 mm); worked figures usually 30–55 mm (review above 60 × 40 mm). Routine supplied figures require review above 65 mm wide or 40 mm high. Keep wide/shallow figures shallow. Detailed constructions, dense labels, tree diagrams, paired figures and drawing grids may need more space: record the specific reason in spec.sizing.exceptionReason; detailed constructions, tree/network and meaningful figure groups ordinarily receive individual review above 100 × 70 mm. These are review triggers, never hard caps. Preserve aspect ratio, all givens and features, 10 pt complete native labels and graph ticks at 8.5 pt or their reviewed 8 pt exception, with proportional mathematical scripts. Move colliding labels or enlarge the figure; never compress one axis or shrink fonts, or change the camera, coordinates or mathematical range merely to meet a size target. Do not shorten a solid's illustrative extrusion unless separately reviewed. Student drawing/plotting grids keep sufficient usable drawing area and are not sized as supplied answers; identify them with spec.sizing.purpose="drawing". Keep complete labels, dimensions and captions in the measured bounds. Inspect label-to-edge clearance, arrows, angle marks, hidden edges, equality ticks and narrow gaps, not only SVG bounds. Preserve raster labels until final-size readability is inspected; never blanket-scale screenshots, portraits, text-heavy illustrations or mathematical tables. Keep diagram size independent of working space, table capacity, padding and paragraph/row gaps, and of the other answer edition. Do not enlarge satisfactory small figures just to reach a starting size. Preserve meaningful pairs, common scales, shared dimensions and diagram-to-working relationships. Honour explicit local/manual sizing exceptions. Save explicit widths and verify the actual rendered height and label clearance; never auto-migrate accepted booklets on load.`;

export function recentTeacherActivity(project,cutoff){
 const since=typeof cutoff==='number'?cutoff:Date.parse(cutoff);
 return (project.studio?.flags??[]).some(flag=>!flag.kind&&flag.at&&
  Math.max(Date.parse(flag.at)||0,Date.parse(flag.editedAt)||0)>=since);
}

export function diagramSizingKind(diagram,{role='question',context=''}={}){
 const code=diagram.code??'',description=[diagram.id?.replace(/[-_]/g,' '),diagram.alt,diagram.spec?.description,diagram.spec?.mathematics,context].filter(Boolean).join(' ');
 const sizing=diagram.spec?.sizing??diagram.sizing;
 if(sizing?.preserve||sizing?.exceptionReason)return 'exception';
 if(diagram.format!=='tikz')return 'raster';
 if(/avatar|portrait|mascot/i.test(description)||/mathsmap-avatar/.test(code))return 'illustration';
 const meaningfulGroup=/\bcollection\b|\bpaired (?:figures|graphs|diagrams|squares|circles|triangles|solids|prisms|cylinders|cones|spheres)\b|\bside.by.side\b|\b(?:two|three|four) (?:figures|graphs|diagrams)\b/i.test(description);
 const graph=/\\begin\{axis\}|\\addplot|data-graph-text=|mathsmap-(?:graph|cartesian)|"kind"\s*:\s*"(?:cartesian|function|graph)"/.test(code)||/\b(?:graph|axes|cartesian|scatter plot|histogram|box plot)\b/i.test(description);
 const noPlot=!/\\addplot|\\draw[^;]*(?:plot|sin|cos)|\\(?:addplot|plot)/.test(code);
 if(sizing?.purpose==='drawing'||diagram.spec?.responseKind==='drawing'||
  /\b(?:blank|empty|handwritten|handwriting)\b|\bresponse (?:content|box|regions?|spaces?)\b|\bstudent responses\b|\bcompletion (?:regions|responses)\b|\b(?:branch|event)-response\b|\blabel boxes\b/i.test(description)||
  /\b(?:shade the region|use (?:a |the |your )?(?:ruler|protractor)|measure (?:the |these |each |all |its )?(?:length|angle))\b/i.test(context)||
  /\bresponse (?:axes|diagram|grid)|\bno (?:supplied )?(?:curve|plotted answer)\b/i.test(description)||
  /\b(?:room|space) for (?:event labels|a probability)|\bcomplete event labels\b/i.test(description)||
  /\b(?:blank|empty)\b[\s\S]{0,60}\b(?:grid|axes|graph|compass|derivative|writing|writable|cells)\b|\b(?:drawing.grid|drawing response area|partially completed graph|circle.scaffold)\b|\b(?:writing regions|outcome regions)\b[\s\S]{0,30}\bempty\b/i.test(description)||
  /\b(?:blank|empty) (?:coordinate |cartesian |square )?(?:grid|axes|graph)|drawing scaffold/i.test(description)||
  graph&&noPlot&&/\b(?:draw|plot|sketch|construct)\b/i.test(context))return 'drawing';
 if(meaningfulGroup)return 'meaningful-group';
 if(graph)return role==='short'?'short-graph':role==='worked'?'worked-graph':'graph';
 if(/\b(?:tree|network|flowchart|mapping diagram|relation diagram)\b/i.test(description)||/\\child\b|child\s*\{/.test(code)||
  (code.match(/\\(?:node|path)\b/g)??[]).length>18)return 'detailed';
 return role==='short'?'short-figure':role==='worked'?'worked-figure':'figure';
}

export const DIAGRAM_SIZE_LIMITS=Object.freeze({
 figure:{widthMm:65,heightMm:40,minWidthMm:25},
 'short-figure':{widthMm:50,heightMm:35,minWidthMm:25},
 'worked-figure':{widthMm:60,heightMm:40,minWidthMm:25},
 graph:{widthMm:75,heightMm:65,minWidthMm:45},
 'short-graph':{widthMm:55,heightMm:50,minWidthMm:40},
 'worked-graph':{widthMm:65,heightMm:60,minWidthMm:45},
 detailed:{widthMm:100,heightMm:70,minWidthMm:45},
});

export function proposeDiagramWidth(diagram,measurement,options={}){
 const kind=diagramSizingKind(diagram,options),limit=DIAGRAM_SIZE_LIMITS[kind];
 if(!limit)return {kind,action:'preserve',reason:kind};
 const {widthMm,heightMm}=measurement??{};
 if(!(widthMm>0&&heightMm>0))return {kind,action:'review',reason:'Missing current rendered dimensions'};
 if(widthMm<=limit.widthMm+.5&&heightMm<=limit.heightMm+.5)return {kind,action:'preserve',reason:'Within reference envelope'};
 const width=Math.max(Math.min(widthMm,limit.minWidthMm),Math.floor(widthMm*Math.min(1,limit.widthMm/widthMm,limit.heightMm/heightMm)*10)/10);
 if(width<widthMm*.55)return {kind,action:'review',reason:'Large reduction needs an individual task/arrangement review'};
 if(width>=widthMm-.5)return {kind,action:'review',reason:'Narrow/tall figure needs a local placement or geometry decision'};
 return {kind,action:'reduce',widthMm:width,reason:'Exceeds source-calibrated reference envelope; require calibrated-label and actual-page checks'};
}

// Advisory rendered-size findings select pages for the existing visual review.
// They never resize a diagram or make an otherwise readable exception fail.
export function diagramSizeReview(diagram,measurement,options={}){
 const kind=diagramSizingKind(diagram,options);
 const limit=DIAGRAM_SIZE_LIMITS[kind==='meaningful-group'?'detailed':kind];
 if(!limit)return null;
 const {widthMm,heightMm}=measurement??{};
 if(!(widthMm>0&&heightMm>0)||widthMm<=limit.widthMm+.5&&heightMm<=limit.heightMm+.5)return null;
 return {kind:'diagram-size-review',purpose:kind,widthMm,heightMm,reference:{widthMm:limit.widthMm,heightMm:limit.heightMm},reviewRequired:'Inspect final-size labels/features and source relationships; retain a justified larger size or repair the diagram. This is a review trigger, not a hard cap.'};
}

export function renderedDiagramSizingFindings(project,figures,{edition='student',pages=[]}={}){
 const diagrams=new Map();
 const walk=(value,context='')=>{
  if(!value||typeof value!=='object')return;
  const ownContext=value.prompt!=null?JSON.stringify(value.prompt):context;
  if(value.format==='tikz'&&value.id&&value.code)diagrams.set(value.id,{diagram:value,context:ownContext});
  for(const [key,child]of Object.entries(value))if(!['spec','provenance','sourceReview','sourceLayoutEvidence','sourceAtom'].includes(key)){
   if(Array.isArray(child))child.forEach(item=>walk(item,ownContext));else walk(child,ownContext);
  }
 };walk(project.sections);
 return (figures??[]).flatMap(figure=>{
  const entry=diagrams.get(figure.id);if(!entry)return [];
  const page=pages.find(row=>row.page===figure.page),mode=edition.startsWith('with-')?(page?.isAnswer?(edition.endsWith('worked')?'worked':'short'):'student'):edition;
  const role=['short','worked'].includes(mode)?mode:'question',finding=diagramSizeReview(entry.diagram,figure,{role,context:entry.context});
  return finding?[{page:figure.page,diagramId:figure.id,role,...finding}]:[];
 });
}
