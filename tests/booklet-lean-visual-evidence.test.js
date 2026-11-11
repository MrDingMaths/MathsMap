import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';
import {rgbPng,ensureSelectedPdfRasters} from '../scripts/booklet/pdf-rasters.mjs';
import {rasterEvidence,retainPixelReviews,visualOutcomeReader,overlayVisualEvidence,pageBlockStamp,carryUnchangedBlockReviews,blockContentStamps} from '../scripts/booklet/lean-visual-evidence.mjs';
import {recordVisualResult,scopeRepairedVisualPlan} from '../scripts/booklet/lean-review.mjs';
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
test('pixel reuse retains actual accepted and failed reviews only for identical full pages',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pixel-review-'));t.after(()=>{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});});
 const png=rgbPng({width:2,height:2,pixels:Buffer.alloc(12,255)});
 async function proof(name,bytes=png){const file=path.join(dir,name+'.pdf');fs.writeFileSync(file,name);const pdf={path:file,hash:hash(file)},result=await ensureSelectedPdfRasters(pdf,1,path.join(dir,name),{pages:[1],engine:'fixture',renderRange:async()=>[{page:1,bytes}]});return rasterEvidence(pdf,result.images[0]);}
 const original=await proof('old'),current=await proof('new'),state={pages:{}};
 const batch={edition:'student',rows:[{page:1,hash:'old-html',blocks:['q'],raster:original}]};
 recordVisualResult({batch,state,result:{pages:[{page:1,outcome:'accepted'}]}});
 const plan={student:{pending:[{page:1,hash:'new-html',raster:current}]}};
 assert.equal(retainPixelReviews(plan,state),1);assert.equal(visualOutcomeReader(state)('student',plan.student.pending[0]).outcome,'accepted');assert.equal(state.pages['student:new-html'],undefined,'No new acceptance is written');
 const changed=await proof('changed',rgbPng({width:2,height:2,pixels:Buffer.alloc(12,0)})),other={student:{pending:[{page:1,hash:'changed',raster:changed}]}};assert.equal(retainPixelReviews(other,state),0);
 assert.equal(retainPixelReviews({worked:{pending:[{page:1,hash:'other-edition',raster:current}]}},state),0);
 fs.appendFileSync(current.image.path,'altered');assert.equal(visualOutcomeReader(state)('student',plan.student.pending[0]),undefined);
 assert.throws(()=>recordVisualResult({batch:{edition:'student',rows:[{page:1,hash:'tampered',raster:current}]},state,result:{pages:[{page:1,outcome:'accepted'}]}}),/evidence changed/);
 const failure=await proof('failure');recordVisualResult({batch:{edition:'short',rows:[{page:1,hash:'failed',raster:original}]},state,result:{pages:[{page:1,outcome:'needs-change',finding:'Label collision'}]}});
 const failedPlan={short:{pending:[{page:1,hash:'metadata-change',raster:failure}]}};assert.equal(retainPixelReviews(failedPlan,state),1);assert.equal(visualOutcomeReader(state)('short',failedPlan.short.pending[0]).outcome,'needs-change');
 fs.appendFileSync(original.pdf.path,'changed');assert.equal(visualOutcomeReader(state)('short',failedPlan.short.pending[0]),undefined);
});
test('malformed or duplicate visual replies cannot create acceptance',()=>{
 for(const pages of [[{page:1,outcome:'maybe'}],[{page:1,outcome:'accepted'},{page:1,outcome:'accepted'}],[{page:2,outcome:'accepted'}]])assert.throws(()=>recordVisualResult({batch:{edition:'student',rows:[{page:1,hash:'h'}]},state:{pages:{}},result:{pages}}),/Invalid independent/);
});

test('required coverage overlays only exact current page proofs and retains scoped accepted evidence',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pixel-gate-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const png=rgbPng({width:2,height:2,pixels:Buffer.alloc(12,255)});
 const proof=async name=>{const file=path.join(dir,name+'.pdf');fs.writeFileSync(file,name);const pdf={path:file,hash:hash(file)},r=await ensureSelectedPdfRasters(pdf,3,path.join(dir,name),{pages:[1,2,3],engine:'fixture',renderRange:async(_,start,end)=>Array.from({length:end-start+1},(_,i)=>({page:start+i,bytes:png}))});return r.images.map(i=>rasterEvidence(pdf,i));};
 const old=await proof('old'),current=await proof('current'),state={pages:{}},profile='source-layout-v2';
 recordVisualResult({batch:{edition:'student',rows:[{page:3,hash:'old-renderer',raster:old[2],reviewProfile:profile}]},state,result:{pages:[{page:3,outcome:'accepted'}]}});
 const row={page:3,hash:'new-settings',blocks:['untouched'],reviewProfile:profile,raster:current[2]};
 const retained={student:{pdf:current[2].pdf,pending:[row]}};assert.equal(retainPixelReviews(retained,state),1);
 const required={student:{pdf:current[2].pdf,pending:[{page:3,hash:'new-settings',blocks:['untouched'],reviewProfile:profile},{page:2,hash:'unreviewed',reviewProfile:profile}]}};
 const stored={student:{pending:[],reused:[row],selected:0}};
 const gate=overlayVisualEvidence(required,stored);assert.equal(gate.student.pending.length,2);assert.equal(visualOutcomeReader(state)('student',gate.student.pending[0])?.outcome,'accepted');assert.equal(visualOutcomeReader(state)('student',gate.student.pending[1]),undefined);
 for(const change of [r=>r.page=2,r=>r.hash='stale',r=>r.raster={...r.raster,page:2},r=>r.raster={...r.raster,pdf:old[2].pdf}]){const bad=structuredClone(stored);change(bad.student.reused[0]);assert.equal(visualOutcomeReader(state)('student',overlayVisualEvidence(required,bad).student.pending[0]),undefined);}
 const editions=['student','short','worked','with-short','with-worked'],plan={},report={},previousPlan={},previousReport={};
 for(const ed of editions){const pages=[{page:1,hash:'touch',blocks:['changed']},{page:6,hash:'unknown',blocks:['other']},{...row,page:3}];plan[ed]={pdf:current[2].pdf,pending:structuredClone(pages)};report[ed]={pageHashes:pages};previousReport[ed]={pageHashes:pages};previousPlan[ed]={pending:pages.filter(r=>r.hash!=='unknown')};}
 // The retained student row has an actual accepted PNG; unknown pages never disappear.
 const scoped=scopeRepairedVisualPlan({project:{sections:[{blocks:[{id:'changed'},{id:'other'},{id:'untouched'}]}]},plan,report,previousPlan,previousReport,state,repairBlocks:['changed']});
 assert.equal(scoped.student.reused.length,1);assert.ok(scoped.student.pending.some(r=>r.hash==='unknown'));assert.ok(scoped.worked.pending.some(r=>r.hash==='new-settings'),'unreviewed editions cannot inherit student evidence');
 const noProfile=structuredClone(state);delete noProfile.pages['student:old-renderer'].reviewProfile;const read=visualOutcomeReader(noProfile);assert.notEqual(read('student',row)?.reviewProfile,profile);
 fs.appendFileSync(current[2].receipt.path,'tampered');assert.equal(visualOutcomeReader(state)('student',overlayVisualEvidence(required,stored).student.pending[0]),undefined);
});

test('footer-only reuse requires verified A4 pixels, a checked footer and the same accepted body',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'footer-reuse-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const width=1191,height=1684;
 async function proof(name,row){
  const pixels=Buffer.alloc(width*height*3,255);
  pixels[row*width*3]=0;
  const file=path.join(dir,name+'.pdf');fs.writeFileSync(file,name);
  const pdf={path:file,hash:hash(file)},result=await ensureSelectedPdfRasters(pdf,1,path.join(dir,name),{pages:[1],engine:'fixture',renderRange:async()=>[{page:1,bytes:rgbPng({width,height,pixels})}]});
  return rasterEvidence(pdf,result.images[0]);
 }
 const [before,after,changed]=await Promise.all([proof('before',1620),proof('after',1621),proof('changed',1500)]);
 const state={pages:{}},reviewProfile='source-layout-v2';
 recordVisualResult({batch:{edition:'student',rows:[{page:1,hash:'before',blocks:['q'],raster:before,reviewProfile}]},state,result:{pages:[{page:1,outcome:'accepted'}]}});
 const row={page:1,hash:'after',blocks:['q'],raster:after,reviewProfile,footerChecked:true};
 const retain=row=>retainPixelReviews({student:{pending:[row]}},state);
 assert.equal(retain({...row,footerChecked:false}),0);
 assert.equal(retain({...row,blocks:['different']}),0);
 assert.equal(retain({...row,raster:changed}),0);
 assert.equal(retain(row),1);
 assert.equal(visualOutcomeReader(state)('student',row)?.outcome,'accepted');
 assert.equal(visualOutcomeReader(state)('student',{...row,footerChecked:false}),undefined);
 assert.equal(state.pages['student:after'],undefined);
});
test('import v2 carries an accepted review to a re-rendered page whose blocks and settings are unchanged',()=>{
 const block=id=>({id,type:'question',content:{prompt:'Q '+id}});
 const project={settings:{layoutOverrides:{blockLayouts:{a:{x:1},c:{x:2}}}},sections:[{id:'s',title:'S',blocks:['a','b','c','d','e'].map(block)}]};
 const pages=[{page:1,blocks:['cover'],isCover:true},{page:2,blocks:['a','b']},{page:3,blocks:['c']},{page:4,blocks:['d']},{page:5,blocks:['e']}];
 const stamp=(p,i)=>pageBlockStamp(p,pages,i,{renderer:'r'});
 assert.equal(stamp(project,0),null,'the cover is never stamped');
 const before=stamp(project,1);assert.ok(before);
 assert.equal(stamp({...project,settings:{layoutOverrides:{blockLayouts:{a:{x:1},c:{x:9}}}}},1),before,'another block\'s override does not change the stamp');
 assert.notEqual(stamp({...project,settings:{layoutOverrides:{blockLayouts:{a:{x:5},c:{x:2}}}}},1),before,'the block\'s own override does');
 assert.notEqual(stamp({...project,settings:{...project.settings,mathsStyle:'other'}},1),before,'a global setting does');
 assert.notEqual(pageBlockStamp(project,pages,1,{renderer:'other'}),before,'the renderer does');
 assert.equal(pageBlockStamp(project,[{page:1,blocks:['a']},{page:2,blocks:['a','b']}],1),null,'a page starting inside a split block is not stamped');
 const review=(page,blocks,blockStamp,outcome='accepted')=>({edition:'student',outcome,page,blocks,blockStamp,reviewProfile:'source-layout-v2'});
 const state={pages:{'student:old2':review(2,['a','b'],before),'student:old3':review(3,['c'],stamp(project,2)),'student:old5':review(5,['e'],stamp(project,4))}};
 const row=(page,i,extra={})=>({page,hash:'new'+page,blocks:pages[i].blocks,reviewProfile:'source-layout-v2',blockStamp:stamp(project,i),...extra});
 // Page 4 holds a repaired block (no matching review), so pages 3 and 5 are inspected too.
 const plan={student:{automatedIssues:[],pending:[row(2,1),row(3,2),row(4,3),row(5,4)]}};
 assert.equal(carryUnchangedBlockReviews(plan,state),1);
 assert.deepEqual(plan.student.pending.filter(r=>r.carriedReviewKey).map(r=>r.page),[2]);
 assert.equal(visualOutcomeReader(state)('student',plan.student.pending[0]).outcome,'accepted');
 assert.equal(state.pages['student:new2'],undefined,'no new acceptance is written');
 // A changed block makes the stored key worthless: the reader compares current stamps.
 assert.equal(visualOutcomeReader(state)('student',{...plan.student.pending[0],blockStamp:'changed'}),undefined);
 // A page with an earlier needs-change for the same content, a finding or an automated issue is never carried.
 const failed={pages:{...state.pages,'student:bad2':review(2,['a','b'],before,'needs-change')}};
 const again={student:{automatedIssues:[],pending:[row(2,1)]}};assert.equal(carryUnchangedBlockReviews(again,failed),0);
 assert.equal(carryUnchangedBlockReviews({student:{automatedIssues:[{page:2}],pending:[row(2,1)]}},state),0);
 assert.equal(carryUnchangedBlockReviews({student:{automatedIssues:[],pending:[row(2,1,{previousFindings:['x']})]}},state),0);
 assert.equal(carryUnchangedBlockReviews({worked:{automatedIssues:[],pending:[row(2,1)]}},state),0,'another edition is not carried');
 const stamps=blockContentStamps(project),edited=blockContentStamps({...project,settings:{layoutOverrides:{blockLayouts:{a:{x:1},c:{x:3}}}}});
 assert.equal(stamps.a,edited.a);assert.notEqual(stamps.c,edited.c);
});
