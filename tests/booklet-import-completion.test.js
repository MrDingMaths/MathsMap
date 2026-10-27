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
import {contentHash,visualPlan,reviewStatus,loadReviewed,saveReviewed,runVisualReview} from '../scripts/booklet/lean-review.mjs';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';
import {adoptCompletionProfile,finishImport,prepareFinishCandidate,selectFinishExport} from '../scripts/booklet/import-finish.mjs';
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
 assert.equal(contentFindings({findings},w.project).length,4);
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

test('adoption requires an idle boundary and preserves the explicitly selected direct route',async t=>{
 const w=fixture(t);write(path.join(w.runDir,'manifest.json'),{id:'old',reviewProfile:'textbook-three-pass-v1'});
 await assert.rejects(adoptCompletionProfile(w.runDir),/Historical run/);
 await assert.rejects(adoptCompletionProfile(w.runDir,{adopt:true,hasActiveWork:async()=>true}),/idle boundary/);
 const manifest=await adoptCompletionProfile(w.runDir,{adopt:true,direct:true,hasActiveWork:async()=>false});
 assert.equal(manifest.reviewProfile,'textbook-three-pass-v1');assert.equal(manifest.completionRoute,'iceem-direct');
});

test('finish resumes without repeating preparation or exporting unchanged content; no live booklet is touched',async t=>{
 const w=fixture(t);passedExport(w);let prepares=0,exports=0,visuals=0;
 const deps={prepare:async()=>{prepares++;},validate:()=>({ok:true,blockers:[]}),content:async()=>({}),images:async()=>({errors:[]}),shading:async()=>({errors:[]}),export:async({out})=>{write(path.join(out,'report.json'),{report:{[w.project.id]:{}}});exports++;},visual:async()=>{visuals++;},status:async()=>({deliverable:true,completion:assessCompletion()})};
 const first=await finishImport(w,deps);assert.equal(first.deliverable,true);assert.equal(first.saved,true);
 const again=await finishImport(w,deps);assert.equal(again.deliverable,true);assert.equal(prepares,1);assert.equal(exports,1);assert.equal(visuals,2,'the visual command resumes its existing accepted table');
 assert.equal(JSON.parse(fs.readFileSync(w.projectFile)).title,w.project.title);
});

test('finish saves explicit incomplete progress without reporting completion',async t=>{
 const w=fixture(t);passedExport(w);
 const result=await finishImport({...w,saveProgress:true},{prepare:async()=>{},validate:()=>({ok:true,blockers:[]}),content:async()=>({}),images:async()=>({errors:[]}),shading:async()=>({errors:[]}),export:async({out})=>{write(path.join(out,'report.json'),{report:{[w.project.id]:{}}});},visual:async()=>{},repair:async()=>{},status:async()=>({deliverable:false,completion:assessCompletion({findings:[{id:'table',area:'table'}]})})});
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
