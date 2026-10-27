// Inspect the existing early sample. This records the inspection, never another export.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {loadReviewed,saveReviewed,recordVisualResult,VISUAL_CONTRACT,sourcePagesFor,reviewableBlocks} from './lean-review.mjs';
import {FEEDBACK_CHECKS} from '../../polish/repair-routing.mjs';
import {assessCompletion} from './import-completion.mjs';
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
 const failures=[];
 for(const edition of sample.editions){
  const rows=sample.pages.filter(row=>row.edition===edition);
  if(!rows.length)throw Error('Sample has no pages for '+edition);
  for(const row of rows){
   if(!fs.existsSync(row.image))throw Error('Sample raster is missing');
   const page=report[edition].pageHashes.find(p=>p.page===row.page);if(!page)throw Error('Sample has no matching page map');
   const out=path.join(runDir,'lean-review','calls','sample-'+edition+'-'+row.page+'-'+Date.now());
   const source=[...new Set(row.blocks.flatMap(id=>sourcePagesFor(blocks.get(id)??{}).own))].map(page=>path.join(runDir,'evidence','pages','page-'+String(page).padStart(3,'0')+'.png'));
   if(source.length>8||source.some(file=>!fs.existsSync(file)))throw Error('Early sample needs complete focused source images');
   const {result}=await runner({cwd:process.cwd(),runDir,prompt:VISUAL_CONTRACT+' '+FEEDBACK_CHECKS+'\n\n'+JSON.stringify({edition,pages:[{page:row.page,blocks:row.blocks}],sourceImages:source.length}),images:[row.image,...source],out,profile:'review',stage:'lean-sample'});
   failures.push(...recordVisualResult({batch:{edition,rows:[{...page}]},result,state}));
   if(!result.pages?.some(p=>p.page===row.page))failures.push({finding:'Sample page received no verdict'});
  }
 }
 const completion=assessCompletion({findings:failures});
 state.workflow[project.id].sample.accepted=completion.ready;
 saveReviewed(path.join(runDir,'lean-review'),state);
 return {completion,deliverable:false,sampleAccepted:completion.ready};
}
