import {importReviewConfiguration} from './transcription-settings.mjs';
// Inspect the existing early sample. This records the inspection, never another export.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {loadReviewed,saveReviewed,recordVisualResult,VISUAL_CONTRACT,sourcePagesFor,reviewableBlocks} from './lean-review.mjs';
import {FEEDBACK_CHECKS} from '../../polish/repair-routing.mjs';
import {assessCompletion,importV2} from './import-completion.mjs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
export const sampleSourceKey=manifest=>createHash('sha256').update(JSON.stringify(manifest.source??{})).digest('hex');
// Direct ICE-EM runs retained bounded native samples before this entry point
// existed. Read their original evidence in place; they still need real verdicts.
export function importSampleEvidence(sampleDir,projectId){
 const layout=path.join(sampleDir,'layout-sample.json');
 if(fs.existsSync(layout))return {sample:read(layout),report:read(path.join(sampleDir,'report.json')).report?.[projectId]};
 const bounded=read(path.join(sampleDir,'feedback-pages.json'));
 if(bounded.tool!=='check-feedback-pages'||bounded.projectId!==projectId||bounded.passed!==true||bounded.failures?.length||!bounded.editions?.length)throw Error('Bounded early sample is failed or belongs to another project');
 const report={},pages=[];
 for(const edition of bounded.editions){
  const entry=bounded.editionsReport?.[edition];
  if(!entry?.pdf?.hash||!entry.images?.length||entry.issues?.length||entry.printed?.some(p=>p.issues?.length))throw Error('Bounded early sample is incomplete or has print issues: '+edition);
  report[edition]={...entry,pageHashes:entry.pages};
  for(const row of entry.images){
   const page=entry.pages?.find(p=>p.page===row.page);
   if(!page?.hash||!Array.isArray(page.blocks)||!row.hash||!fs.existsSync(row.path)||createHash('sha256').update(fs.readFileSync(row.path)).digest('hex')!==row.hash)throw Error('Bounded sample raster is missing, changed or unmapped');
   pages.push({edition,page:row.page,blocks:page.blocks,image:row.path});
  }
 }
 return {sample:{ok:true,editions:bounded.editions,pages},report};
}
// Consecutive pages of one edition in pairs, while their source images stay within eight.
export function pairSamplePages(rows,sourcesFor){
 const groups=[];
 for(let i=0;i<rows.length;i++){
  const pair=[rows[i],rows[i+1]];
  if(rows[i+1]&&rows[i+1].page===rows[i].page+1&&sourcesFor(pair).length<=8){groups.push(pair);i++;}
  else groups.push([rows[i]]);
 }
 return groups;
}
export async function reviewImportSample({runDir,projectFile,sampleDir,runner}){
 const project=read(projectFile),manifest=read(path.join(runDir,'manifest.json')),{sample,report}=importSampleEvidence(sampleDir,project.id);
 if(!sample.ok)throw Error('Repair the failed early sample before accepting it');
 if(!report)throw Error('Sample report does not contain this project');
 for(const edition of sample.editions){
  const pdf=report[edition]?.pdf;
  if(!pdf?.path||!fs.existsSync(pdf.path)||createHash('sha256').update(fs.readFileSync(pdf.path)).digest('hex')!==pdf.hash)throw Error('Sample PDF is missing or changed');
 }
 const state=loadReviewed(path.join(runDir,'lean-review')),blocks=new Map(reviewableBlocks(project).map(r=>[r.block.id,r.block]));
 const sampleHash=createHash('sha256').update(JSON.stringify({sample,report,images:sample.pages.map(row=>fs.existsSync(row.image)?createHash('sha256').update(fs.readFileSync(row.image)).digest('hex'):null)})).digest('hex');
 const previous=state.workflow?.[project.id]?.sample;
 if(previous?.accepted&&previous.sampleHash===sampleHash&&previous.sourceKey===sampleSourceKey(manifest))return {completion:assessCompletion(),deliverable:false,sampleAccepted:true,reused:true};
 state.workflow??={};state.workflow[project.id]={...state.workflow[project.id],sample:{accepted:false,sourceKey:sampleSourceKey(manifest),sampleHash,dir:path.resolve(sampleDir)}};
 saveReviewed(path.join(runDir,'lean-review'),state);
 const failures=[],v2=importV2(manifest);
 const sourcesFor=rows=>[...new Set(rows.flatMap(row=>row.blocks.flatMap(id=>sourcePagesFor(blocks.get(id)??{}).own)))].map(page=>path.join(runDir,'evidence','pages','page-'+String(page).padStart(3,'0')+'.png'));
 const jobs=[];
 for(const edition of sample.editions){
  const rows=sample.pages.filter(row=>row.edition===edition).sort((a,b)=>a.page-b.page);
  if(!rows.length)throw Error('Sample has no pages for '+edition);
  for(const row of rows){
   if(!fs.existsSync(row.image))throw Error('Sample raster is missing');
   if(!report[edition].pageHashes.find(p=>p.page===row.page))throw Error('Sample has no matching page map');
  }
  // Import v2 (Ch 1 case study, change 3): consecutive pages go together so a
  // reviewer sees cross-page references and splits; one page per call otherwise.
  jobs.push(...(v2?pairSamplePages(rows,sourcesFor):rows.map(row=>[row])).map(group=>({edition,group})));
 }
 const inspect=async({edition,group})=>{
  const pages=group.map(row=>report[edition].pageHashes.find(p=>p.page===row.page)),source=sourcesFor(group);
  if(source.length>8||source.some(file=>!fs.existsSync(file)))throw Error('Early sample needs complete focused source images');
  const out=path.join(runDir,'lean-review','calls','sample-'+edition+'-'+group.map(row=>row.page).join('_')+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,6));
  const {result}=await runner({cwd:process.cwd(),runDir,prompt:VISUAL_CONTRACT+' '+FEEDBACK_CHECKS+'\n\n'+JSON.stringify({edition,pages:group.map(row=>({page:row.page,blocks:row.blocks})),sourceImages:source.length}),images:[...group.map(row=>row.image),...source],out,profile:'review',configuration:importReviewConfiguration(),stage:'lean-sample'});
  failures.push(...recordVisualResult({batch:{edition,rows:pages.map(page=>({...page}))},result,state}));
  for(const row of group)if(!result.pages?.some(p=>p.page===row.page))failures.push({finding:'Sample page '+row.page+' received no verdict'});
 };
 // At most three workers per booklet; v1 runs keep their sequential calls.
 const width=v2?3:1;let next=0;
 await Promise.all(Array.from({length:Math.min(width,jobs.length)},async()=>{while(next<jobs.length)await inspect(jobs[next++]);}));
 const completion=assessCompletion({findings:failures});
 state.workflow[project.id].sample.accepted=completion.ready;
 saveReviewed(path.join(runDir,'lean-review'),state);
 return {completion,deliverable:false,sampleAccepted:completion.ready};
}

// Resolve a reviewed sample's findings without another review round (Cambridge X11 Ch 5,
// 12 November 2026, James). A full re-review re-inspects every page (about 57 calls there)
// and can repeat false verdicts, which decide-page cannot record on a sample. Each
// needs-change page is resolved either by a person's decision (bound to the page hash and
// a hashed evidence file, as decide-page does) or by named corrections already applied
// through `lean-review repair`, verified mechanically: Studio's label check on the
// candidate and a targeted render of the repaired blocks. No model call; the finish
// visual review still inspects every Questions page.
export async function resolveImportSample({runDir,projectFile,sampleDir,resolutionsFile,visibilityReviews,labels,render,now=()=>new Date().toISOString()}){
 const project=read(projectFile),manifest=read(path.join(runDir,'manifest.json')),{sample,report}=importSampleEvidence(sampleDir,project.id);
 const dir=path.join(runDir,'lean-review'),state=loadReviewed(dir),record=state.workflow?.[project.id]?.sample;
 if(!record||record.dir!==path.resolve(sampleDir)||record.sourceKey!==sampleSourceKey(manifest))throw Error('Resolve the sample that sample-review last inspected for this run');
 const sampleHash=createHash('sha256').update(JSON.stringify({sample,report,images:sample.pages.map(row=>fs.existsSync(row.image)?createHash('sha256').update(fs.readFileSync(row.image)).digest('hex'):null)})).digest('hex');
 if(record.sampleHash!==sampleHash)throw Error('The sample changed since it was reviewed');
 if(record.accepted)return {sampleAccepted:true,reused:true};
 const pending=[];
 for(const row of sample.pages){
  const hash=report[row.edition]?.pageHashes?.find(p=>p.page===row.page)?.hash,key=row.edition+':'+hash,entry=state.pages?.[key];
  if(hash&&entry?.outcome==='needs-change')pending.push({edition:row.edition,page:row.page,key,entry});
 }
 const resolutions=read(resolutionsFile).resolutions??[];
 const find=(edition,page)=>resolutions.filter(r=>r.edition===edition&&Number(r.page)===page);
 for(const p of pending)if(find(p.edition,p.page).length!==1)throw Error(`Give exactly one resolution for ${p.edition} p${p.page}: ${p.entry.finding}`);
 for(const r of resolutions)if(!pending.some(p=>p.edition===r.edition&&p.page===Number(r.page)))throw Error(`No open finding on ${r.edition} p${r.page}`);
 const applied=new Map(),log=path.join(dir,'corrections.jsonl');
 if(fs.existsSync(log))for(const line of fs.readFileSync(log,'utf8').split('\n').filter(Boolean)){const row=JSON.parse(line);if(row.correctionId)applied.set(row.correctionId,[...(applied.get(row.correctionId)??[]),row.targetId]);}
 const owner=new Map();
 for(const {block} of reviewableBlocks(project)){const walk=n=>{if(Array.isArray(n))return n.forEach(walk);if(!n||typeof n!=='object')return;if(n.id)owner.set(n.id,block.id);Object.values(n).forEach(walk);};owner.set(block.id,block.id);walk(block.content);}
 const repaired=new Set();
 for(const r of resolutions){
  if(r.kind==='decision'){
   if(!String(r.decidedBy??'').trim()||!String(r.reason??'').trim())throw Error('A decision needs decidedBy and reason');
   if(!r.evidence||!fs.existsSync(r.evidence))throw Error('A decision needs an existing evidence file');
  }else if(r.kind==='repaired'){
   if(!String(r.reason??'').trim()||!r.corrections?.length)throw Error('A repaired resolution needs a reason and the correction ids that fixed it');
   for(const id of r.corrections){const targets=applied.get(id);if(!targets)throw Error('Correction '+id+' was not applied through lean-review repair');for(const t of targets)if(owner.has(t))repaired.add(owner.get(t));}
  }else throw Error('Resolution kind must be decision or repaired');
 }
 let verification=null;
 if(resolutions.some(r=>r.kind==='repaired')){
  const label=await(labels??(async()=>(await import('./import-finish.mjs')).diagramLabelCheck({file:projectFile,runDir})))();
  if(label.skipped)throw Error('Studio label check unavailable: '+label.skipped);
  if(label.collisions?.length)throw Error('Label collisions remain: '+label.collisions.map(c=>c.id).join(', '));
  const out=path.join(sampleDir,'resolution-render');
  const rendered=await(render??(async args=>(await import('./import-layout-preflight.mjs')).targetedRenderCheck(args)))({file:projectFile,projectId:project.id,targets:[...repaired],out,editions:sample.editions,visibilityReviews});
  if(rendered.skipped?.length)throw Error('Targeted render skipped: '+JSON.stringify(rendered.skipped));
  if(rendered.issues?.length)throw Error('Targeted render found issues: '+JSON.stringify(rendered.issues.slice(0,5)));
  verification={labelCheck:'clean',targets:[...repaired],render:{issues:0,seconds:rendered.seconds}};
 }
 const at=now();
 for(const p of pending){
  const r=find(p.edition,p.page)[0],overrides={finding:p.entry.finding,details:p.entry.details??[],at:p.entry.at??null};
  const resolution=r.kind==='decision'
   ?{kind:'decision',decidedBy:String(r.decidedBy).trim(),reason:String(r.reason).trim(),at,evidence:{path:path.resolve(r.evidence),hash:createHash('sha256').update(fs.readFileSync(r.evidence)).digest('hex')},overrides}
   :{kind:'repaired',reason:String(r.reason).trim(),at,corrections:r.corrections,verification,overrides};
  state.pages[p.key]={...p.entry,outcome:'accepted',finding:'',details:[],[r.kind==='decision'?'decision':'resolution']:resolution};
  fs.appendFileSync(path.join(dir,r.kind==='decision'?'page-decisions.jsonl':'sample-resolutions.jsonl'),JSON.stringify({sample:path.resolve(sampleDir),edition:p.edition,page:p.page,hash:p.key.slice(p.edition.length+1),...resolution})+'\n');
 }
 state.workflow[project.id].sample.accepted=true;
 saveReviewed(dir,state);
 return {sampleAccepted:true,resolved:pending.length,decisions:resolutions.filter(r=>r.kind==='decision').length,repaired:resolutions.filter(r=>r.kind==='repaired').length,verification};
}
