// The combined review queue (22 October 2026): everything the automatic steps could not settle, by
// block, lowest source-match confidence first. The Studio Source tab (BookletSourceCompare.svelte)
// reads it as source-match/review-queue.json: `items` with `mismatches` (relationships that still
// differ from the source) and `findings` (what each check left), so the teacher reviews a short
// ordered list instead of every page. Pure.

const item=(map,blockId)=>map.get(blockId)??map.set(blockId,{blockId,confidence:null,located:false,sourcePage:null,mismatches:[],findings:[],sources:[]}).get(blockId);
const mark=(row,source)=>{if(!row.sources.includes(source))row.sources.push(source);};

// inputs (all optional):
//   sourceMatch  the review-queue.json of source-match/run.mjs: {items:[{blockId,confidence,located,sourcePage,mismatches,stuck}]}
//   roles        runRoles report: {findings:[{blockId,status,detail,expected}]}
//   wrapped      runWrappedMath report: {after:{left:[{blockId,nodeId,detail}]}}
//   whitespace   runWhitespace report: {gaps:[{blockId,gapMm,detail,explanation}],strays:[...],fixes:[...]}
//   theory       theory-diff rows: [{blockId,detail,missing,extra}]
//   firstPass    first-pass provenance findings still open: [{id,area,comment,state,applyOutcome,applyNote,targets:[{blockId}]}]
export function buildQueue({project,sourceMatch=null,roles=null,wrapped=null,whitespace=null,theory=null,firstPass=null,at=new Date().toISOString()}={}){
 const rows=new Map();
 for(const entry of sourceMatch?.items??[]){
  const row=item(rows,entry.blockId);
  Object.assign(row,{confidence:entry.confidence??null,located:!!entry.located,sourcePage:entry.sourcePage??null});
  row.mismatches.push(...(entry.mismatches??[]));
  for(const why of entry.stuck??[])row.findings.push({check:'source-match',status:'stuck',detail:why.why??String(why)});
  mark(row,'source-match');
 }
 for(const f of roles?.findings??[]){
  if(f.status==='fixed'||f.status==='model-agrees-with-the-block')continue;
  const row=item(rows,f.blockId);row.findings.push({check:'roles',status:f.status,detail:f.detail});mark(row,'roles');
 }
 for(const f of wrapped?.after?.left??[]){const row=item(rows,f.blockId);row.findings.push({check:'wrapped-math',status:'open',detail:f.detail});mark(row,'wrapped-math');}
 for(const g of (whitespace?.gaps??[]).filter(g=>!g.explanation?.attributed)){
  const row=item(rows,g.blockId);row.findings.push({check:'whitespace',status:'unattributable',detail:g.detail+' (a renderer bug: no spacing field accounts for it)'});mark(row,'whitespace');
 }
 const fixed=new Set((whitespace?.fixes??[]).filter(f=>f.kept).map(f=>f.blockId));
 for(const s of whitespace?.strays??[]){if(fixed.has(s.blockId))continue;const row=item(rows,s.blockId);row.findings.push({check:'whitespace',status:'stray-boundary',detail:`a source page boundary leaves ${s.gapMm} mm empty on page ${s.page}`});mark(row,'whitespace');}
 for(const t of theory??[]){const row=item(rows,t.blockId);row.findings.push({check:'theory-diff',status:'differs',detail:t.detail});mark(row,'theory-diff');}
 for(const f of firstPass??[]){
  if(['repaired','closed','rejected'].includes(f.state))continue;
  for(const target of (f.targets??[]).slice(0,1)){const row=item(rows,target.blockId);row.findings.push({check:'first-pass',status:f.applyOutcome??f.state,detail:`[${f.area}] ${f.comment}`+(f.applyNote?` (${f.applyNote})`:'')});mark(row,'first-pass');}
 }
 const items=[...rows.values()].filter(r=>r.mismatches.length||r.findings.length)
  .sort((a,b)=>(a.confidence??-1)-(b.confidence??-1)||(b.mismatches.length+b.findings.length)-(a.mismatches.length+a.findings.length)||a.blockId.localeCompare(b.blockId));
 const bySource={};for(const r of items)for(const s of r.sources)bySource[s]=(bySource[s]??0)+1;
 return {project:project?.id??null,builtAt:at,summary:{blocks:items.length,mismatches:items.reduce((n,r)=>n+r.mismatches.length,0),findings:items.reduce((n,r)=>n+r.findings.length,0),bySource},items};
}
