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
import {adoptCompletionProfile,finishImport,prepareFinishCandidate} from '../scripts/booklet/import-finish.mjs';
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
 const deps={prepare:async()=>{prepares++;},validate:()=>({ok:true,blockers:[]}),content:async()=>({}),images:async()=>({errors:[]}),shading:async()=>({errors:[]}),export:async()=>{exports++;},visual:async()=>{visuals++;},status:async()=>({deliverable:true,completion:assessCompletion()})};
 const first=await finishImport(w,deps);assert.equal(first.deliverable,true);assert.equal(first.saved,true);
 const again=await finishImport(w,deps);assert.equal(again.deliverable,true);assert.equal(prepares,1);assert.equal(exports,1);assert.equal(visuals,2,'the visual command resumes its existing accepted table');
 assert.equal(JSON.parse(fs.readFileSync(w.projectFile)).title,w.project.title);
});

test('finish saves explicit incomplete progress without reporting completion',async t=>{
 const w=fixture(t);passedExport(w);
 const result=await finishImport({...w,saveProgress:true},{prepare:async()=>{},validate:()=>({ok:true,blockers:[]}),content:async()=>({}),images:async()=>({errors:[]}),shading:async()=>({errors:[]}),export:async()=>{},visual:async()=>{},repair:async()=>{},status:async()=>({deliverable:false,completion:assessCompletion({findings:[{id:'table',area:'table'}]})})});
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
