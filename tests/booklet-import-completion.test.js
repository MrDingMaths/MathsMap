import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {assessCompletion,COMPLETION_PROFILE,SOURCE_VISUAL_PROFILE,completionHash} from '../scripts/booklet/import-completion.mjs';
import {repairRoute,FEEDBACK_CHECKS} from '../polish/repair-routing.mjs';
import {teacherBlocks} from '../polish/guards.mjs';
import {gateProblems} from '../polish/run.mjs';
import {contentFindings} from '../polish/content.mjs';
import {blockHash,bookletIndex} from '../first-pass/review.mjs';
import {contentHash,visualPlan,reviewStatus,loadReviewed,saveReviewed,runVisualReview,currentExportProblems,recordVisualResult} from '../scripts/booklet/lean-review.mjs';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';
import {adoptCompletionProfile,finishImport,prepareFinishCandidate,layoutFinishCandidate,selectFinishExport} from '../scripts/booklet/import-finish.mjs';
import {sampleSourceKey,reviewImportSample} from '../scripts/booklet/import-sample-review.mjs';
import {validateImport} from '../scripts/booklet/import-validation.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));};
function fixture(t){
 const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'import-completion-'));t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));
 const project={id:'p',title:'Source relationships',reviewProfile:'textbook-three-pass-v1',revision:1,settings:{},sections:[{id:'s',phase:'teaching',blocks:[{id:'theory',type:'rich-text',sourcePageNumber:1,content:'Read the labelled table.'}]}]};
 const projectFile=path.join(runDir,'input.json'),manifest={id:'run',completionProfile:COMPLETION_PROFILE,source:{pdfHash:'source'}};
 write(projectFile,project);write(path.join(runDir,'manifest.json'),manifest);
 return {runDir,project,projectFile,manifest};
}
function passedExport(w){
 const out=path.join(w.runDir,'export'),report={};
 for(const edition of ['student','short','worked','with-short','with-worked']){
  const pdf=path.join(out,edition+'.pdf');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(pdf,edition);
  report[edition]={projectHash:projectReviewHash(w.project),pdf:{path:pdf,hash:digest(edition)},issues:[],printed:[{issues:[]}],pageHashes:[{page:1,hash:edition,blocks:['theory']}]};
 }
 write(path.join(out,'report.json'),{report:{p:report}});write(path.join(out,'p-readiness.json'),{complete:true});write(path.join(out,'frozen-export-receipt-1.json'),{status:0});
 const state={questions:{theory:{hash:contentHash(w.project.sections[0].blocks[0]),outcome:'passed'}},pages:Object.fromEntries(Object.keys(report).map(e=>[e+':'+e,{outcome:'accepted',reviewProfile:SOURCE_VISUAL_PROFILE}])),workflow:{p:{preparedHash:completionHash(w.project),sample:{accepted:true,sourceKey:sampleSourceKey(w.manifest)}}}};
 saveReviewed(path.join(w.runDir,'lean-review'),state);return {out,report,state};
}

test('shared completion holds each substantive finding, unreliable page and unverified repair',()=>{
 assert.equal(assessCompletion({findings:[{id:'geometry',area:'diagram',state:'pending'}]}).ready,false);
 assert.equal(assessCompletion({findings:[{id:'math',area:'content',state:'repaired',visualVerified:false}]}).ready,false);
 assert.equal(assessCompletion({unreliable:[{page:4,note:'source unreadable'}]}).ready,false);
 assert.equal(assessCompletion({required:['review'],completed:[]}).ready,false);
 assert.equal(assessCompletion({ratingsMissing:['q1']}).ready,false);
 const optional=assessCompletion({findings:[{area:'extension',comment:'Optional challenge'}]});
 assert.equal(optional.ready,true);assert.equal(optional.warnings.length,1);
});

test('routing follows required structure/diagram/maths edits and retries layout capability refusals through content',t=>{
 const w=fixture(t),index=bookletIndex(w.project),target={id:'theory',blockId:'theory',hash:blockHash(w.project,index,'theory')};
 const findings=['structure','diagram-code','mathematics'].map((repairKind,i)=>({id:'f'+i,state:'pending',area:'response',repairKind,targets:[target]}));
 findings.push({id:'declined',state:'pending',area:'diagram',applyOutcome:'comment',applyNote:'Adding a diagram is outside the permitted layout-only fields',targets:[target]});
 findings.push({id:'shared-label',state:'pending',area:'alignment',applyOutcome:'comment',applyNote:'One target per label; this requires annotation structure not documented for layout fields',targets:[target]});
 assert.equal(contentFindings({findings},w.project).length,5);
 assert.equal(repairRoute({area:'extension',repairKind:'structure'}),'suggestion');
 assert.match(FEEDBACK_CHECKS,/corresponding cell, not alongside/);
});

test('open requests do not accept whole blocks; resolved decisions remain protected',t=>{
 const {project}=fixture(t);project.studio={flags:[{at:'2026-10-24',targetId:'theory',note:'Put diagrams inside table',resolved:false}]};
 assert.equal(teacherBlocks(project).has('theory'),false);
 project.studio.flags[0].resolved=true;assert.equal(teacherBlocks(project).has('theory'),true);
});

test('substantive verified repairs can justify growth; discretionary trials cannot',()=>{
 const before={pages:{student:4,short:1,worked:2},issues:{}},after={pages:{student:5,short:1,worked:2},issues:{}};
 assert.equal(gateProblems(before,after).length,1);
 assert.equal(gateProblems(before,after,{growthReasons:[{cause:'Restore missing instructional diagram',verified:true}]}).length,0);
 assert.equal(gateProblems(before,after,{growthReasons:[{cause:'tidier',verified:false}]}).length,1);
});

test('new visual policy reviews all Questions once, reuses accepted pages, and keeps ICE-EM targeted',t=>{
 const {project,manifest}=fixture(t),pages=Array.from({length:12},(_,i)=>({page:i+1,hash:'h'+i,blocks:['theory']}));
 const report=Object.fromEntries(['student','short','worked','with-short','with-worked'].map(e=>[e,{pdf:{path:e},pageHashes:pages,issues:[]}]));
 const state={pages:{},questions:{}};
 const all=visualPlan({project,report,state,manifest});assert.equal(all.student.pending.length,12);
 assert.ok(all.short.pending.length<12);assert.ok(all['with-short'].pending.length<12);
 state.pages['student:h4']={outcome:'accepted',reviewProfile:SOURCE_VISUAL_PROFILE};
 assert.equal(visualPlan({project,report,state,manifest}).student.pending.length,11);
 assert.ok(visualPlan({project,report,state,manifest:{...manifest,completionRoute:'iceem-direct'}}).student.pending.length<11);
 for(const page of pages)if(page.hash!=='h4')state.pages['student:'+page.hash]={outcome:'accepted',reviewProfile:SOURCE_VISUAL_PROFILE};
 const changed=structuredClone(report);changed.student.pageHashes[6].hash='changed';
 assert.deepEqual(visualPlan({project,report:changed,state,manifest,previousReport:report}).student.pending.map(p=>p.page),[7]);
 delete state.pages['student:h0'];
 assert.deepEqual(visualPlan({project,report:changed,state,manifest,previousReport:report}).student.pending.map(p=>p.page),[1,7],'an unfinished unrelated inspection survives a scoped repair');
});

test('a passing export cannot conceal current polish blockers, stale reviews, ratings or changed PDF bytes',t=>{
 const w=fixture(t),{out}=passedExport(w),status=()=>reviewStatus({runDir:w.runDir,projectFile:w.projectFile,exportDir:out,projectHash:projectReviewHash});
 assert.equal(status().deliverable,true);
 write(path.join(w.runDir,'polish/state.json'),{completionBinding:completionHash(w.project),completion:{ready:false,blockers:['Missing diagonal remains']}});
 assert.equal(status().deliverable,false);assert.match(status().completion.blockers.join(' '),/Missing diagonal/);
 fs.unlinkSync(path.join(w.runDir,'polish/state.json'));
 const reviewed=loadReviewed(path.join(w.runDir,'lean-review'));reviewed.questions.theory.hash='stale';saveReviewed(path.join(w.runDir,'lean-review'),reviewed);
 assert.equal(status().deliverable,false);
 reviewed.questions.theory.hash=contentHash(w.project.sections[0].blocks[0]);saveReviewed(path.join(w.runDir,'lean-review'),reviewed);
 fs.writeFileSync(path.join(out,'student.pdf'),'changed');assert.match(status().completion.blockers.join(' '),/changed PDF/);
});

test('source review refuses missing source evidence and does not invent an accepted inspection',async t=>{
 const w=fixture(t),exportDir=path.join(w.runDir,'visual');
 write(path.join(exportDir,'visual-plan.json'),{student:{pending:[{page:1,hash:'page',blocks:['theory'],image:'page.png',reviewProfile:SOURCE_VISUAL_PROFILE}]}});
 const result=await runVisualReview({runDir:w.runDir,projectFile:w.projectFile,exportDir,runner:async()=>assert.fail('Missing source must fail before a call')});
 assert.equal(result.errors.length,1);assert.equal(Object.keys(loadReviewed(path.join(w.runDir,'lean-review')).pages).length,0);
});

test('lean source coverage uses current independent acceptance and retains gaps, presentation findings and teacher decisions',t=>{
 const w=fixture(t),{out,report,state}=passedExport(w),readiness=path.join(out,'p-readiness.json');
 const covered={complete:false,total:1,counts:{verified:0,mapped:1,excluded:0,missing:0,duplicate:0,ambiguous:0,unchecked:0},rows:[{id:'original',targetId:'theory',state:'mapped'}],issues:[],presentation:{required:true,complete:false,issues:[]}};
 write(readiness,covered);assert.equal(reviewStatus({runDir:w.runDir,projectFile:w.projectFile,exportDir:out}).deliverable,true);
 assert.ok(currentExportProblems(out,w.project,report).some(note=>note.includes('coverage')),'a save/count alone grants no acceptance');
 write(readiness,{...covered,counts:{...covered.counts,missing:1}});assert.ok(currentExportProblems(out,w.project,report,state).some(note=>note.includes('coverage')));
 write(readiness,{...covered,issues:[{kind:'missing-prompt',targetId:'theory',note:'Response has no prompt'}]});assert.ok(currentExportProblems(out,w.project,report,state).some(note=>note.includes('missing-prompt')));
 write(readiness,{...covered,presentation:{issues:[{kind:'missing-teaching-template',targetId:'theory',note:'Keep the source group'}]}});assert.ok(currentExportProblems(out,w.project,report,state).some(note=>note.includes('missing-teaching-template')));
 write(readiness,{...covered,issues:[{kind:'review-finding',targetId:'theory',note:'Teacher decision remains'}]});
 assert.ok(!currentExportProblems(out,w.project,report,state).length,'historical author uncertainty is superseded by actual independent acceptance');
 w.project.studio={flags:[{targetId:'theory',at:'2026-10-24',resolved:false}]};assert.ok(currentExportProblems(out,w.project,report,state).some(note=>note.includes('Teacher decision remains')));
 write(readiness,covered);state.questions.theory.hash='stale';assert.ok(currentExportProblems(out,w.project,report,state).some(note=>note.includes('coverage')));
});

test('adoption requires an idle boundary and preserves the explicitly selected direct route',async t=>{
 const w=fixture(t);write(path.join(w.runDir,'manifest.json'),{id:'old',reviewProfile:'textbook-three-pass-v1'});
 await assert.rejects(adoptCompletionProfile(w.runDir),/Historical run/);
 await assert.rejects(adoptCompletionProfile(w.runDir,{adopt:true,hasActiveWork:async()=>true}),/idle boundary/);
 const manifest=await adoptCompletionProfile(w.runDir,{adopt:true,direct:true,hasActiveWork:async()=>false});
 assert.equal(manifest.reviewProfile,'textbook-three-pass-v1');assert.equal(manifest.completionRoute,'iceem-direct');
});

test('finish resumes without repeating preparation or exporting unchanged content; no live booklet is touched',async t=>{
 const w=fixture(t);passedExport(w);let prepares=0,exports=0,visuals=0;
 const deps={prepare:async()=>{prepares++;},layout:async()=>{},validate:()=>({ok:true,blockers:[]}),content:async()=>({}),images:async()=>({errors:[]}),shading:async()=>({errors:[]}),export:async({out})=>{write(path.join(out,'report.json'),{report:{[w.project.id]:{}}});exports++;},visual:async()=>{visuals++;},status:async()=>({deliverable:true,completion:assessCompletion()})};
 const first=await finishImport(w,deps);assert.equal(first.deliverable,true);assert.equal(first.saved,true);
 const again=await finishImport(w,deps);assert.equal(again.deliverable,true);assert.equal(prepares,1);assert.equal(exports,1);assert.equal(visuals,2,'the visual command resumes its existing accepted table');
 assert.equal(JSON.parse(fs.readFileSync(w.projectFile)).title,w.project.title);
});

test('finish saves explicit incomplete progress without reporting completion',async t=>{
 const w=fixture(t);passedExport(w);
 const result=await finishImport({...w,saveProgress:true},{prepare:async()=>{},layout:async()=>{},validate:()=>({ok:true,blockers:[]}),content:async()=>({}),images:async()=>({errors:[]}),shading:async()=>({errors:[]}),export:async({out})=>{write(path.join(out,'report.json'),{report:{[w.project.id]:{}}});},visual:async()=>{},repair:async()=>{},status:async()=>({deliverable:false,completion:assessCompletion({findings:[{id:'table',area:'table'}]})})});
 assert.equal(result.saved,true);assert.equal(result.deliverable,false);assert.equal(result.completion.ready,false);
});

test('direct preparation skips normalisation and pagination model work',async t=>{
 const w=fixture(t);let model;
 await prepareFinishCandidate({file:w.projectFile,runDir:w.runDir,direct:true},{normalise:()=>assert.fail(),paginate:()=>assert.fail(),dependencies:async options=>{model=options.model;return {project:options.project};},wrapped:async()=>({report:{after:{wrapped:0}}})});
 assert.equal(model,false);
 assert.equal(validateImport(w.project).ok,true);
});

test('early sample inspection reuses its existing export and actual accepted inspection',async t=>{
 const w=fixture(t),sampleDir=path.join(w.runDir,'sample'),pdf=path.join(sampleDir,'student.pdf'),image=path.join(sampleDir,'page.png'),source=path.join(w.runDir,'evidence/pages/page-001.png');
 fs.mkdirSync(sampleDir);fs.writeFileSync(pdf,'pdf');fs.writeFileSync(image,'raster');fs.mkdirSync(path.dirname(source),{recursive:true});fs.writeFileSync(source,'original');
 write(path.join(sampleDir,'layout-sample.json'),{ok:true,editions:['student'],pages:[{edition:'student',page:1,blocks:['theory'],image}]});
 write(path.join(sampleDir,'report.json'),{report:{p:{student:{pdf:{path:pdf,hash:digest('pdf')},pageHashes:[{page:1,hash:'sample',blocks:['theory']}]}}}});
 let calls=0;const options={...w,sampleDir,runner:async()=>{calls++;return {result:{pages:[{page:1,outcome:'accepted'}]}};}};
 assert.equal((await reviewImportSample(options)).sampleAccepted,true);
 assert.equal((await reviewImportSample(options)).reused,true);assert.equal(calls,1);
 fs.writeFileSync(image,'repaired raster');assert.equal((await reviewImportSample(options)).sampleAccepted,true);assert.equal(calls,2);
});

test('native bounded early samples keep their original PDF and raster evidence and require actual verdicts',async t=>{
 const w=fixture(t),sampleDir=path.join(w.runDir,'bounded'),pdf=path.join(sampleDir,'student.pdf'),image=path.join(sampleDir,'page.png'),source=path.join(w.runDir,'evidence/pages/page-001.png');
 fs.mkdirSync(sampleDir);fs.writeFileSync(pdf,'pdf');fs.writeFileSync(image,'raster');fs.mkdirSync(path.dirname(source),{recursive:true});fs.writeFileSync(source,'original');
 const feedback={tool:'check-feedback-pages',projectId:'p',passed:true,failures:[],editions:['student'],editionsReport:{student:{pdf:{path:pdf,hash:digest('pdf')},pages:[{page:2,hash:'bounded-page',blocks:['theory']}],images:[{page:2,path:image,hash:digest('raster')}],issues:[],printed:[{page:2,issues:[]}]}}};
 const file=path.join(sampleDir,'feedback-pages.json');write(file,feedback);let calls=0;
 const options={...w,sampleDir,runner:async({images})=>{calls++;assert.deepEqual(images,[image,source]);return {result:{pages:[{page:2,outcome:'accepted'}]}};}};
 assert.equal((await reviewImportSample(options)).sampleAccepted,true);assert.equal(calls,1);
 assert.equal((await reviewImportSample(options)).reused,true);assert.equal(calls,1);
 fs.writeFileSync(pdf,'changed PDF');await assert.rejects(reviewImportSample(options),/PDF/);fs.writeFileSync(pdf,'pdf');
 fs.writeFileSync(image,'changed');await assert.rejects(reviewImportSample(options),/raster/);fs.writeFileSync(image,'raster');
 feedback.projectId='other';write(file,feedback);await assert.rejects(reviewImportSample(options),/another project/);
 feedback.projectId='p';feedback.passed=false;write(file,feedback);await assert.rejects(reviewImportSample(options),/failed/);
 feedback.passed=true;feedback.editionsReport.student.images[0].page=99;write(file,feedback);await assert.rejects(reviewImportSample(options),/unmapped/);
 assert.equal(calls,1,'invalid evidence never reaches a reviewer');
});


test('measured layout follows substantive repairs, repeats after a repair, and is reused on resume',async t=>{
 const w=fixture(t);passedExport(w);const order=[];let repairs=0,layouts=0,exports=0;
 const deps={prepare:async()=>order.push('prepare'),validate:()=>({ok:true,blockers:[]}),
  content:async({projectFile})=>{order.push('content');const p=JSON.parse(fs.readFileSync(projectFile));
   p.sections[0].blocks[0].content=repairs?'Corrected teaching group.':'Practice without redundant scaffolds.';write(projectFile,p);
   const state=loadReviewed(path.join(w.runDir,'lean-review'));state.questions.theory={hash:contentHash(p.sections[0].blocks[0]),outcome:'passed'};saveReviewed(path.join(w.runDir,'lean-review'),state);return {};},
  layout:async({file})=>{order.push('layout');layouts++;assert.match(JSON.parse(fs.readFileSync(file)).sections[0].blocks[0].content,/without redundant|Corrected/);},
  images:async()=>({errors:[]}),shading:async()=>({errors:[]}),export:async({out})=>{write(path.join(out,'report.json'),{report:{[w.project.id]:{}}});order.push('export');exports++;},visual:async()=>{},
  repair:async({file})=>{order.push('repair');repairs++;const p=JSON.parse(fs.readFileSync(file));p.sections[0].blocks[0].content='Pending substantive correction';write(file,p);},
  status:async()=>({deliverable:exports>1,completion:assessCompletion()})};
 assert.equal((await finishImport(w,deps)).deliverable,true);
 assert.deepEqual(order,['prepare','content','layout','export','repair','content','layout','export']);
 await finishImport(w,deps);assert.equal(layouts,2);assert.equal(exports,2);
});

test('direct final layout measures wrapping without invoking pagination',async t=>{
 const w=fixture(t);let wraps=0;
 await layoutFinishCandidate({file:w.projectFile,direct:true},{wrapped:async()=>{wraps++;return {report:{after:{wrapped:0}}};},paginate:()=>assert.fail('direct route does not paginate')});
 assert.equal(wraps,1);
 await assert.rejects(layoutFinishCandidate({file:w.projectFile,direct:true},{wrapped:async()=>({report:{after:{wrapped:2}}})}),/Wrapped mathematics remains/);
});


test('unaccepted content stops before measured layout or export',async t=>{
 const w=fixture(t);passedExport(w);
 const result=await finishImport(w,{prepare:async()=>{},content:async()=>({errors:['Unresolved answer']}),layout:()=>assert.fail('layout before content acceptance'),export:()=>assert.fail('export before content acceptance')});
 assert.equal(result.deliverable,false);assert.match(result.completion.blockers.join(' '),/Unresolved answer/);
});


test('layout cannot export stale content acceptance; resume rechecks content and reuses settled layout',async t=>{
 const w=fixture(t);passedExport(w);let layouts=0,exports=0,reviews=0;
 const deps={prepare:async()=>{},validate:()=>({ok:true,blockers:[]}),
  content:async({projectFile})=>{reviews++;const p=JSON.parse(fs.readFileSync(projectFile)),state=loadReviewed(path.join(w.runDir,'lean-review'));
   state.questions.theory={hash:contentHash(p.sections[0].blocks[0]),outcome:'passed'};saveReviewed(path.join(w.runDir,'lean-review'),state);return {};},
  layout:async({file})=>{layouts++;const p=JSON.parse(fs.readFileSync(file));p.sections[0].blocks[0].content='A changed mathematical statement';write(file,p);},
  images:async()=>({errors:[]}),shading:async()=>({errors:[]}),export:async({out})=>{write(path.join(out,'report.json'),{report:{[w.project.id]:{}}});exports++;},visual:async()=>{},status:async()=>({deliverable:true,completion:assessCompletion()})};
 const first=await finishImport(w,deps);assert.equal(first.deliverable,false);assert.equal(exports,0);assert.match(first.completion.blockers.join(' '),/stale reviews/);
 assert.equal((await finishImport(w,deps)).deliverable,true);assert.equal(reviews,2);assert.equal(layouts,1);assert.equal(exports,1);
});

test('interrupted finish selection requires a named cause and uses only committed previous context',t=>{
 const w=fixture(t),root=path.join(w.runDir,'attempts'),entries=[1,2,3,4].map(n=>({dir:path.join(root,String(n)),projectHash:'current'}));
 for(const entry of entries.slice(0,3))write(path.join(entry.dir,'report.json'),{report:{p:{student:{}}}});
 write(path.join(entries[3].dir,'retained.json'),{paid:true});const before=JSON.stringify(entries),retained=fs.readFileSync(path.join(entries[3].dir,'retained.json'));
 assert.match(selectFinishExport(entries,'current',{projectId:'p'}).blocker,/Interrupted export.*regenerate-reason/);
 const selected=selectFinishExport(entries,'current',{projectId:'p',regenerationReason:'Interrupted snapshot; retain4, fresh5'});
 assert.equal(selected.entry,undefined);assert.equal(selected.previousExportDir,entries[2].dir);assert.equal(JSON.stringify(entries),before);assert.ok(fs.readFileSync(path.join(entries[3].dir,'retained.json')).equals(retained));
 write(path.join(entries[3].dir,'report.json'),{report:{other:{}}});assert.match(selectFinishExport(entries,'current',{projectId:'p'}).blocker,/Interrupted export/);
 write(path.join(entries[3].dir,'report.json'),{report:{p:{student:{issues:['not accepted']}}}});
 assert.equal(selectFinishExport(entries,'current',{projectId:'p',regenerationReason:'named'}).entry,entries[3],'report selection never grants acceptance');
 fs.writeFileSync(path.join(entries[3].dir,'report.json'),'partial JSON');assert.equal(selectFinishExport(entries,'current',{projectId:'p',regenerationReason:'named'}).previousExportDir,entries[2].dir);
});

test('native finish retains interrupted records and appends fresh5 only with an explicit cause',async t=>{
 const w=fixture(t);passedExport(w);let calls=0,images=0,visuals=0;const outputs=[];
 const deps={prepare:async()=>{},layout:async()=>{},validate:()=>({ok:true,blockers:[]}),content:async()=>({}),images:async()=>{images++;return {errors:[]};},shading:async()=>({errors:[]}),export:async options=>{calls++;outputs.push(options);write(path.join(options.out,'report.json'),{report:{p:{}}});},visual:async()=>{visuals++;},status:async()=>({deliverable:true,completion:assessCompletion()})};
 await finishImport(w,deps);const file=path.join(w.runDir,'lean-review/finish/state.json'),state=JSON.parse(fs.readFileSync(file)),first=state.exports[0];
 state.exports=[first,...[2,3,4].map(n=>({dir:path.join(w.runDir,'fresh',String(n)),projectHash:first.projectHash,regenerationReason:'retained historical attempt '+n}))];
 for(const entry of state.exports.slice(1,3))write(path.join(entry.dir,'report.json'),{report:{p:{}}});
 const interrupted=state.exports[3];write(path.join(interrupted.dir,'retained.json'),{paid:true});write(file,state);const prior=JSON.stringify(state.exports),kept=fs.readFileSync(path.join(interrupted.dir,'retained.json'));calls=images=visuals=0;
 const blocked=await finishImport(w,deps);assert.equal(blocked.deliverable,false);assert.match(blocked.completion.blockers.join(' '),/Interrupted export/);assert.equal(calls+images+visuals,0);
 const result=await finishImport({...w,out:path.join(w.runDir,'fresh'),regenerationReason:'Killed before report; retain4 and render fresh5'},deps);
 assert.equal(result.deliverable,true);assert.equal(calls,1);assert.equal(outputs.at(-1).out,path.join(w.runDir,'fresh','5'));assert.equal(outputs.at(-1).previousExportDir,state.exports[2].dir);
 const after=JSON.parse(fs.readFileSync(file));assert.equal(JSON.stringify(after.exports.slice(0,4)),prior);assert.ok(fs.readFileSync(path.join(interrupted.dir,'retained.json')).equals(kept));
 calls=0;await finishImport(w,deps);assert.equal(calls,0,'a committed unchanged export resumes normally');
});

test('failed fresh export without a committed report stays incomplete and cannot publish',async t=>{
 const w=fixture(t);passedExport(w);const before=fs.readFileSync(w.projectFile);let visual=0,status=0;
 const result=await finishImport(w,{prepare:async()=>{},layout:async()=>{},validate:()=>({ok:true,blockers:[]}),content:async()=>({}),images:async()=>({errors:[]}),export:async()=>{throw Error('frozen runtime failed');},prepareVisual:async()=>{throw Error('no report');},visual:async()=>{visual++;},status:async()=>{status++;return {deliverable:true,completion:assessCompletion()};}});
 assert.equal(result.deliverable,false);assert.equal(result.saved,false);assert.equal(visual+status,0);assert.match(result.completion.blockers.join(' '),/No checked final export|frozen runtime failed/);assert.ok(fs.readFileSync(w.projectFile).equals(before));
 const state=JSON.parse(fs.readFileSync(path.join(w.runDir,'lean-review/finish/state.json')));assert.equal(state.exports.length,1);assert.equal(state.exports[0].exportError,'frozen runtime failed');
});

test('current failed pages remain required after targeted or changed-page selection',t=>{
 const {project,manifest}=fixture(t),pages=Array.from({length:12},(_,i)=>({page:i+1,hash:'current-'+i,blocks:['theory']}));
 const report=Object.fromEntries(['student','short','worked','with-short','with-worked'].map(edition=>[edition,{pdf:{path:edition},pageHashes:pages,issues:[]}]));
 const direct={...manifest,completionRoute:'iceem-direct'},ordinary=visualPlan({project,report,state:{pages:{},questions:{}},manifest:direct});
 const omitted=pages.find(page=>!ordinary.student.pending.some(row=>row.page===page.page));assert.ok(omitted,'fixture includes a genuinely unselected page');
 for(const profile of [direct,manifest,{}]){
  const state={questions:{},pages:Object.fromEntries(Object.keys(report).flatMap(edition=>pages.map(page=>[edition+':'+page.hash,{outcome:'accepted',reviewProfile:SOURCE_VISUAL_PROFILE}])))};
  state.pages['student:'+omitted.hash]={outcome:'needs-change',reviewProfile:SOURCE_VISUAL_PROFILE,finding:'Readable centre marker required.'};const before=structuredClone(state);
  for(const previousReport of [undefined,report]){
   const plan=visualPlan({project,report,state,manifest:profile,previousReport});assert.ok(plan.student.pending.some(page=>page.hash===omitted.hash));
  }
  assert.deepEqual(state,before,'planning does not rewrite verdicts');
 }
});

test('completion blocks current failures omitted by a valid stored plan, not stale historical hashes',t=>{
 const w=fixture(t),{out,report,state}=passedExport(w);write(path.join(w.runDir,'manifest.json'),{...w.manifest,completionProfile:undefined});
 write(path.join(out,'visual-plan.json'),Object.fromEntries(Object.entries(report).map(([edition,row])=>[edition,{pdf:row.pdf,pending:[]}])));
 const status=()=>reviewStatus({runDir:w.runDir,projectFile:w.projectFile,exportDir:out,projectHash:projectReviewHash});assert.equal(status().deliverable,true);
 const historical={outcome:'needs-change',finding:'Old layout failure',at:'historical'};state.pages['student:historical-hash']=historical;saveReviewed(path.join(w.runDir,'lean-review'),state);
 assert.equal(status().deliverable,true);assert.deepEqual(loadReviewed(path.join(w.runDir,'lean-review')).pages['student:historical-hash'],historical);
 state.pages['student:student']={outcome:'needs-change',finding:'Current label collision',reviewProfile:SOURCE_VISUAL_PROFILE};saveReviewed(path.join(w.runDir,'lean-review'),state);
 const blocked=status();assert.equal(blocked.visualPending,0,'stored plan deliberately omits the page');assert.equal(blocked.pagesNeedingChange,1);assert.equal(blocked.deliverable,false);assert.equal(blocked.findings.length,1);assert.match(blocked.completion.blockers.join(' '),/Current label collision/);
 const before=structuredClone(state.pages);status();assert.deepEqual(loadReviewed(path.join(w.runDir,'lean-review')).pages,before,'status is read-only');
});

test('a fresh current-page review resolves the blocker without clearing historical verdicts',t=>{
 const w=fixture(t),{out,report,state}=passedExport(w);write(path.join(w.runDir,'manifest.json'),{...w.manifest,completionProfile:undefined});
 write(path.join(out,'visual-plan.json'),Object.fromEntries(Object.entries(report).map(([edition,row])=>[edition,{pdf:row.pdf,pending:[]}])));
 state.pages['student:student']={outcome:'needs-change',finding:'Current clipped label'};
 state.pages['student:old-failure']={outcome:'needs-change',finding:'Preserved historical failure',at:'old'};const historical=structuredClone(state.pages['student:old-failure']);
 const status=()=>reviewStatus({runDir:w.runDir,projectFile:w.projectFile,exportDir:out,projectHash:projectReviewHash});
 recordVisualResult({batch:{edition:'student',rows:[{page:1,hash:'other-old-page',blocks:['theory']}]},result:{pages:[{page:1,outcome:'accepted'}]},state});saveReviewed(path.join(w.runDir,'lean-review'),state);assert.equal(status().deliverable,false,'another hash cannot resolve the current failure');
 recordVisualResult({batch:{edition:'student',rows:[report.student.pageHashes[0]]},result:{pages:[{page:1,outcome:'accepted'}]},state});saveReviewed(path.join(w.runDir,'lean-review'),state);
 assert.equal(status().deliverable,true);assert.deepEqual(loadReviewed(path.join(w.runDir,'lean-review')).pages['student:old-failure'],historical);
});
