import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {rgbPng,ensureSelectedPdfRasters} from '../scripts/booklet/pdf-rasters.mjs';
import {rasterEvidence,retainPixelReviews} from '../scripts/booklet/lean-visual-evidence.mjs';
import {recordVisualResult,saveReviewed,reviewStatus} from '../scripts/booklet/lean-review.mjs';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';
import {repairFinishFindings} from '../scripts/booklet/import-finish.mjs';

const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));};
async function fixture(t,{retained=false,tampered=false}={}){
 const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'finish-visual-route-'));
 t.after(()=>{assert.ok(path.resolve(runDir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(runDir,{recursive:true,force:true});});
 const project={id:'p',reviewProfile:'textbook-three-pass-v1',settings:{},sections:[{id:'s',phase:'teaching',blocks:[{id:'theory',type:'rich-text',content:'Source teaching.'}]}]};
 const file=path.join(runDir,'candidate.json'),exportDir=path.join(runDir,'export'),workDir=path.join(runDir,'finish');
 write(file,project);write(path.join(runDir,'manifest.json'),{completionProfile:'streamlined-import-v2'});
 const report={};
 for(const edition of ['student','short','worked','with-short','with-worked']){
  const pdf=path.join(exportDir,edition+'.pdf');fs.mkdirSync(exportDir,{recursive:true});fs.writeFileSync(pdf,edition);
  report[edition]={projectHash:projectReviewHash(project),pdf:{path:pdf,hash:digest(pdf)},issues:[],printed:[],pageHashes:[{page:1,hash:edition,blocks:['theory']}]};
 }
 write(path.join(exportDir,'report.json'),{report:{p:report}});
 const bytes=rgbPng({width:2,height:2,pixels:Buffer.alloc(12,255)});
 const proof=async(pdf,name)=>{
  const raster=await ensureSelectedPdfRasters(pdf,1,path.join(runDir,name),{pages:[1],engine:'fixture',renderRange:async()=>[{page:1,bytes}]});
  return rasterEvidence(pdf,raster.images[0]);
 };
 const current=await proof(report.student.pdf,'current'),state={questions:{},pages:{}};
 let inspected=current,inspectedHash='student';
 if(retained){const pdf=path.join(runDir,'original.pdf');fs.writeFileSync(pdf,'original');inspected=await proof({path:pdf,hash:digest(pdf)},'original');inspectedHash='original-page';}
 recordVisualResult({batch:{edition:'student',rows:[{page:1,hash:inspectedHash,blocks:['theory'],reviewProfile:'source-layout-v2',raster:inspected}]},state,result:{pages:[{page:1,outcome:'needs-change',finding:'Keep the source label beside its expression.'}]}});
 const plan={student:{pdf:report.student.pdf,pending:[{page:1,hash:'student',blocks:['theory'],reviewProfile:'source-layout-v2',raster:current}]}};
 if(retained)assert.equal(retainPixelReviews(plan,state),1);
 write(path.join(exportDir,'visual-plan.json'),plan);saveReviewed(path.join(runDir,'lean-review'),state);
 if(tampered)fs.appendFileSync(current.image.path,'changed');
 return {runDir,file,workDir,exportDir,state,retained};
}

for(const retained of [false,true])test(`native finish routes ${retained?'retained':'direct'} verified page failures and preserves the worker limit`,async t=>{
 const w=await fixture(t,{retained}),before=fs.readFileSync(path.join(w.runDir,'lean-review/reviewed.json'),'utf8');
 const status=reviewStatus({runDir:w.runDir,projectFile:w.file,exportDir:w.exportDir,projectHash:projectReviewHash});
 assert.equal(status.findings.length,1,'A real failure must not disappear because report rows omit raster metadata');
 const calls=[];
 const result=await repairFinishFindings({...w,concurrency:1},{layoutRepair:async options=>calls.push(['layout',options]),contentRepair:async options=>calls.push(['content',options])});
 assert.equal(result.findings,1);assert.equal(calls.filter(([kind])=>kind==='layout').length,1);
 assert.ok(calls.every(([,options])=>options.concurrency===1),'Both repair pools must use the configured shared limit');
 assert.equal(fs.readFileSync(path.join(w.runDir,'lean-review/reviewed.json'),'utf8'),before,'Routing must not renew or rebind acceptance');
 if(retained)assert.equal(w.state.pages['student:student'],undefined);
});

test('native finish does not route a retained verdict through changed current raster evidence',async t=>{
 const w=await fixture(t,{retained:true,tampered:true});
 const result=await repairFinishFindings({...w,concurrency:1},{layoutRepair:async()=>assert.fail('Changed proof cannot authorize a repair'),contentRepair:async()=>{}});
 assert.equal(result.findings,0);
});
