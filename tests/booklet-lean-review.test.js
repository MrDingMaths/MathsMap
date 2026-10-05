import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {contentHash,pendingBlocks,batchBlocks,applyCorrections,recordContentResult,loadReviewed,runContentReview,visualPlan,visualBatches,recordVisualResult,runVisualReview,reviewStatus,openProject,sourcePagesFor,teachingFor,runLeanExport,applyRepair,outstandingFindings} from '../scripts/booklet/lean-review.mjs';
import {leanPreExportLint} from '../scripts/booklet/import-pre-final.mjs';

const question=(id,short='4')=>({id,type:'question',sourcePageNumber:6,sourceRefs:[{pageNumber:6}],classification:{primarySkillId:'skill-a'},sourceReview:{teachingContext:[{pageNumber:4,method:'m'}]},content:{id:id+'-root',type:'question',prompt:'Find x.',layout:'grid',answer:{short,worked:'x='+short}}});
const fixture=()=>({id:'p',title:'P',reviewProfile:'textbook-three-pass-v1',revision:1,sections:[
 {id:'front',phase:'front-matter',blocks:[{id:'cover',type:'cover'}]},
 {id:'teach',phase:'teaching',topicId:'t1',blocks:[{id:'example',type:'question',sourcePageNumber:4,content:{id:'example-root',prompt:'Example'}}]},
 {id:'practice',phase:'practice',topicId:'t1',blocks:[question('q1'),question('q2'),question('q3'),question('q4'),question('q5')]}]});
const workspace=project=>{const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'lean-review-')),file=path.join(runDir,'candidate.json');fs.writeFileSync(file,JSON.stringify(project,null,2)+'\n');return {runDir,file,dir:path.join(runDir,'lean-review')};};
const passAll=batchIds=>({records:batchIds.map(id=>({id,outcome:'passed',note:'ok'})),corrections:[]});
const idsIn=prompt=>JSON.parse(prompt.slice(prompt.indexOf('\n\n')+2)).blocks.map(block=>block.id);

test('a block is pending until reviewed and again only when printable content changes',()=>{
 const project=fixture(),state={questions:{},pages:{}};
 assert.equal(pendingBlocks(project,state).length,6,'front matter is not reviewed');
 for(const {block} of pendingBlocks(project,state))state.questions[block.id]={hash:contentHash(block),outcome:'passed'};
 assert.equal(pendingBlocks(project,state).length,0);
 const q1=project.sections[2].blocks[0];
 q1.content.layout='list';q1.classification.primarySkillId='skill-b';q1.sourceReview.note='metadata';
 assert.equal(pendingBlocks(project,state).length,0,'layout, classification and review metadata do not invalidate a content review');
 q1.content.answer.short='5';
 assert.deepEqual(pendingBlocks(project,state).map(row=>row.block.id),['q1']);
 state.questions.q2.outcome='failed';
 assert.deepEqual(pendingBlocks(project,state,{retryFailed:true}).map(row=>row.block.id),['q1','q2']);
});

test('batches hold at most four consecutive blocks of one section',()=>{
 const project=fixture(),batches=batchBlocks(pendingBlocks(project,{questions:{},pages:{}}));
 assert.deepEqual(batches.map(batch=>batch.rows.map(row=>row.block.id)),[['example'],['q1','q2','q3','q4'],['q5']]);
 assert.equal(batchBlocks(pendingBlocks(project,{questions:{},pages:{}}),{characters:1}).length,6,'an oversized block still gets its own batch');
 assert.deepEqual(sourcePagesFor(project.sections[2].blocks[0]),{own:[6],related:[4]});
 assert.equal(teachingFor(project,project.sections[2]).length,1);
});

test('corrections apply exact fields inside the reviewed blocks only',()=>{
 const blocks=[question('q1'),question('q2')];
 const result=applyCorrections(blocks,[{id:'c1',reason:'wrong answer',patches:[
  {targetId:'q1-root',field:'/answer/short',original:'4',corrected:'5'},
  {targetId:'q2-root',field:'/answer/short',original:'9',corrected:'5'},
  {targetId:'q2-root',field:'/prompt',original:'Find x.',corrected:'Find x.'},
  {targetId:'elsewhere',field:'/prompt',original:'a',corrected:'b'},
  {targetId:'q2',field:'/classification/primarySkillId',original:'skill-a',corrected:'skill-b'}]}]);
 assert.equal(blocks[0].content.answer.short,'5');assert.equal(blocks[1].content.answer.short,'4');assert.equal(blocks[1].classification.primarySkillId,'skill-b');
 assert.deepEqual(result.applied.map(row=>row.blockId),['q1','q2']);
 assert.deepEqual(result.rejected.map(row=>row.status),['rejected','no-change','rejected']);
});

test('content review saves corrections, fills the table and resumes without repeating work',async()=>{
 const {runDir,file,dir}=workspace(fixture()),calls=[];
 const runner=async({prompt,images,out})=>{
  const ids=idsIn(prompt);calls.push(ids);assert.ok(Array.isArray(images));assert.ok(!fs.existsSync(out));
  if(ids.includes('q1'))return {result:{records:ids.map(id=>({id:'question:'+id,outcome:id==='q3'?'failed':'passed',note:'checked'})),corrections:[{id:'fix',reason:'key error',patches:[{targetId:'q1-root',field:'/answer/short',original:'4',corrected:'7'}]}]}};
  return {result:passAll(ids)};
 };
 const first=await runContentReview({runDir,projectFile:file,runner,skills:[],concurrency:2});
 assert.equal(first.batches,3);assert.equal(first.applied,1);assert.equal(first.remaining,0);assert.deepEqual(first.failedBlocks.map(row=>row.id),['q3']);
 assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).sections[2].blocks[0].content.answer.short,'7');
 assert.equal(fs.readFileSync(path.join(dir,'corrections.jsonl'),'utf8').trim().split('\n').length,1);
 assert.equal(Object.keys(loadReviewed(dir).questions).length,6);
 const again=await runContentReview({runDir,projectFile:file,runner,skills:[]});
 assert.equal(again.batches,0);assert.equal(calls.length,3,'reviewed content is not sent again');
 const project=JSON.parse(fs.readFileSync(file,'utf8'));project.sections[2].blocks[4].content.prompt='Find y.';fs.writeFileSync(file,JSON.stringify(project,null,2)+'\n');
 await runContentReview({runDir,projectFile:file,runner,skills:[]});
 assert.deepEqual(calls.at(-1),['q5'],'only the edited block is reviewed again');
 assert.deepEqual(reviewStatus({runDir,projectFile:file}).failed,['q3']);
});

test('a correction that does not match the content leaves the block pending, then failed',async()=>{
 const {runDir,file,dir}=workspace({...fixture(),sections:[{id:'practice',phase:'practice',topicId:'t1',blocks:[question('q1')]}]});
 const runner=async()=>({result:{records:[{id:'q1',outcome:'passed'}],corrections:[{id:'bad',patches:[{targetId:'q1-root',field:'/answer/short',original:'not this',corrected:'8'}]}]}});
 const first=await runContentReview({runDir,projectFile:file,runner,skills:[]});
 assert.equal(first.pending,1);assert.equal(first.remaining,1);
 const second=await runContentReview({runDir,projectFile:file,runner,skills:[]});
 assert.equal(second.failed,1);assert.equal(second.remaining,0);assert.equal(fs.readFileSync(path.join(dir,"corrections.jsonl"),"utf8").trim().split('\n').length,2,'rejected patches are logged');assert.equal(loadReviewed(dir).questions.q1.outcome,'failed');
 assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).sections[0].blocks[0].content.answer.short,'4');
});

test('a candidate changed on disk is not overwritten',async()=>{
 const {file}=workspace(fixture()),handle=openProject(file,{root:os.tmpdir()});
 handle.project.title='Edited here';fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('"P"','"Edited elsewhere"'));
 await assert.rejects(()=>handle.save(),/changed on disk/);
});

test('visual plan skips accepted page hashes and combined bodies; findings are recorded per page',async()=>{
 const project=fixture(),pages=(count,answersFrom=Infinity)=>Array.from({length:count},(_,i)=>({page:i+1,hash:'h'+(i+1),blocks:i?['q'+Math.min(i,5)]:[],isCover:i===0,isAnswer:i+1>=answersFrom,mode:i+1>=answersFrom?'short':'student'}));
 const entry=(count,answersFrom)=>({pdf:{path:'x.pdf',hash:'h'},pageHashes:pages(count,answersFrom),issues:[]});
 const report={student:entry(6),short:entry(2),worked:entry(3),'with-short':entry(8,7),'with-worked':entry(9,7)},state={questions:{},pages:{'student:h2':{outcome:'accepted'}}};
 const plan=visualPlan({project,report,state});
 assert.ok(!plan.student.pending.some(row=>row.page===2),'an accepted rendered page is not inspected again');
 assert.deepEqual(plan['with-short'].pending.map(row=>row.page),[1,6,7,8],'combined editions queue composition pages only');
 assert.throws(()=>visualPlan({project,report:{student:entry(2)},state}),/no page map for short/);
 const changedReport=structuredClone(report);changedReport.student.pageHashes[3].hash='repaired';
 const repairedPlan=visualPlan({project,report:changedReport,state,previousReport:report});
 assert.deepEqual(repairedPlan.student.pending.map(row=>row.page),[3,4,5],'inspect repaired pages and neighbours only');
 assert.equal(repairedPlan.worked.pending.length,0,'unchanged editions retain their inspections');
 for(const item of Object.values(plan))for(const row of item.pending)row.image='page.png';
 const batches=visualBatches(plan);assert.ok(batches.every(batch=>batch.rows.length<=8));
 const findings=recordVisualResult({batch:batches[0],state,result:{pages:batches[0].rows.map((row,i)=>({page:row.page,outcome:i?'accepted':'needs-change',finding:i?'':'Label overlaps the axis'}))}});
 assert.equal(findings.length,1);assert.equal(state.pages['student:'+batches[0].rows[0].hash].outcome,'needs-change');

 const {runDir,file}=workspace(project),exportDir=path.join(runDir,'export');fs.mkdirSync(exportDir);
 fs.writeFileSync(path.join(exportDir,'visual-plan.json'),JSON.stringify({student:{pending:[{page:1,hash:'a',blocks:[],image:'one.png'},{page:2,hash:'b',blocks:['q1'],image:'two.png'}]}}));
 let calls=0;const runner=async({images})=>{calls++;assert.deepEqual(images,['one.png','two.png']);return {result:{pages:[{page:1,outcome:'accepted'},{page:2,outcome:'needs-change',finding:'Clipped table'}]}};};
 const first=await runVisualReview({runDir,projectFile:file,exportDir,runner});
 assert.equal(first.pagesInspected,2);assert.equal(first.findings,1);
 await runVisualReview({runDir,projectFile:file,exportDir,runner:async({images})=>{calls++;assert.deepEqual(images,['two.png']);return {result:{pages:[{page:2,outcome:'accepted'}]}};}});
 assert.equal(calls,2);assert.deepEqual(reviewStatus({runDir,projectFile:file}),{blocks:6,pending:6,failed:[],pagesAccepted:2,pagesNeedingChange:0});
 const exportState=loadReviewed(path.join(runDir,'lean-review'));exportState.pages['student:obsolete']={outcome:'needs-change'};
 fs.writeFileSync(path.join(runDir,'lean-review/reviewed.json'),JSON.stringify(exportState));
 const currentReport=Object.fromEntries(['student','short','worked','with-short','with-worked'].map(edition=>[edition,{pdf:{path:'x.pdf'},issues:[],pageHashes:[{page:1,hash:edition==='student'?'a':'current-'+edition,blocks:[],isCover:true}]}]));
 fs.writeFileSync(path.join(exportDir,'report.json'),JSON.stringify({report:{p:currentReport}}));
 const current=reviewStatus({runDir,projectFile:file,exportDir});
 assert.equal(current.pagesNeedingChange,0,'repaired historical page hashes do not fail the current export');
 assert.equal(current.pagesAccepted,1);assert.equal(current.visualPending,4,'unreviewed current pages remain pending');
});

test('an export is refused while text lint has blocking issues, before anything is rendered',async()=>{
 const project=fixture();project.sections[2].blocks[0].content.answer.worked='Interest is $144 and the balance is $1344.';
 const {runDir,file}=workspace(project);let rendered=0;
 await assert.rejects(runLeanExport({runDir,projectId:'p',projectFile:file,out:path.join(runDir,'export')},{exportRuntime:async()=>{rendered++;},rasterize:async()=>({images:[]})}),/text issues before exporting.*q1/);
 assert.equal(rendered,0);
 const lint=leanPreExportLint(project);assert.deepEqual([...new Set(lint.blocking.map(row=>row.blockId))],['q1']);
 project.sections[2].blocks[0].content.answer.worked='Interest is $\\$144$ and the balance is $\\$1344$.';
 project.sections[2].blocks[1].content.prompt={blocks:[{id:'s',type:'paragraph',inlines:[{type:'math',latex:'FV=\\mathord{\\cdots\\cdots}\\hspace{8mm}\\times 2'}]},{id:'l',type:'layout',slots:[{id:'a',label:'A',blocks:[]}]}]};
 const later=leanPreExportLint(project);assert.equal(later.blocking.length,0,'escaped currency is ordinary maths');
 assert.deepEqual(later.review.map(row=>row.rule).sort(),['tex-response-scaffold','unrendered-slot-label'],'authoring patterns are listed and never block');
});

test('a repair is saved only when every patch matches, is read back, and names the findings it left untouched',async()=>{
 const project=fixture();project.settings={compactAnswers:{diagramWidths:{}}};
 const {runDir,file,dir}=workspace(project),exportDir=path.join(runDir,'export');fs.mkdirSync(exportDir);fs.mkdirSync(dir,{recursive:true});
 const report=Object.fromEntries(['student','short','worked','with-short','with-worked'].map(edition=>[edition,{issues:[],pageHashes:[{page:1,hash:edition+'-1',blocks:['q1']},{page:2,hash:edition+'-2',blocks:['q3']}]}]));
 fs.writeFileSync(path.join(exportDir,'report.json'),JSON.stringify({report:{p:report}}));
 fs.writeFileSync(path.join(dir,'reviewed.json'),JSON.stringify({version:1,questions:{},pages:{'student:student-1':{outcome:'needs-change',finding:'Clipped',blocks:['q1']},'student:student-2':{outcome:'needs-change',finding:'Short blanks',blocks:['q3']},'student:old':{outcome:'needs-change',finding:'superseded'}}}));
 const corrections=path.join(runDir,'repair.json'),write=value=>fs.writeFileSync(corrections,JSON.stringify({corrections:value}));
 write([{id:'bad',patches:[{targetId:'q1-root',field:'/prompt',original:'Not the prompt',corrected:'Find y.'}]},{id:'good',patches:[{targetId:'q2-root',field:'/prompt',original:'Find x.',corrected:'Find z.'}]}]);
 const before=fs.readFileSync(file,'utf8');
 await assert.rejects(applyRepair({runDir,projectFile:file,correctionsFile:corrections}),/No repair was saved.*q1-root/);
 assert.equal(fs.readFileSync(file,'utf8'),before,'a partly matching repair changes nothing');
 write([{id:'outside',patches:[{targetId:'project',field:'/compactAnswers',original:null,corrected:{}}]}]);
 await assert.rejects(applyRepair({runDir,projectFile:file,correctionsFile:corrections}),/under \/settings/);
 write([{id:'q1-fix',reason:'clipping',patches:[{targetId:'q1-root',field:'/prompt',original:'Find x.',corrected:'Find y.'}]},{id:'graph-width',reason:'readable short answer',patches:[{targetId:'project',field:'/settings/compactAnswers/diagramWidths/d1',original:null,corrected:{short:70,worked:80}}]}]);
 const result=await applyRepair({runDir,projectFile:file,correctionsFile:corrections,exportDir});
 assert.equal(result.applied,2);assert.deepEqual(result.lost,[]);
 assert.deepEqual(result.findingsNotTouched.map(row=>row.blocks),[['q3']],'the finding on another block is still outstanding');
 const saved=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(saved.sections[2].blocks[0].content.prompt,'Find y.');assert.deepEqual(saved.settings.compactAnswers.diagramWidths.d1,{short:70,worked:80});
 assert.equal(fs.readFileSync(path.join(dir,'corrections.jsonl'),'utf8').trim().split('\n').length,2);
 assert.deepEqual(outstandingFindings(loadReviewed(dir),report).map(row=>row.page),[1,2],'superseded page hashes are not findings on this export');
});

test('status is deliverable only for a passed export of the current project with nothing outstanding',()=>{
 const project=fixture(),{runDir,file,dir}=workspace(project),exportDir=path.join(runDir,'export');fs.mkdirSync(exportDir);fs.mkdirSync(dir,{recursive:true});
 const editions=['student','short','worked','with-short','with-worked'],projectHash=value=>'hash-'+value.revision;
 const report=Object.fromEntries(editions.map(edition=>[edition,{projectHash:'hash-1',issues:[],pdf:{path:'x.pdf'},pageHashes:[{page:1,hash:edition+'-1',blocks:[],isCover:true}]}]));
 const plan=Object.fromEntries(editions.map(edition=>[edition,{pending:[{page:1,hash:edition+'-1',blocks:[]}]}]));
 const writeAll=()=>{fs.writeFileSync(path.join(exportDir,'report.json'),JSON.stringify({report:{p:report}}));fs.writeFileSync(path.join(exportDir,'visual-plan.json'),JSON.stringify(plan));};writeAll();
 const state={version:1,questions:Object.fromEntries(pendingBlocks(project,{questions:{}}).map(({block})=>[block.id,{hash:contentHash(block),outcome:'passed'}])),pages:Object.fromEntries(editions.map(edition=>[edition+':'+edition+'-1',{outcome:'accepted'}]))};
 fs.writeFileSync(path.join(dir,'reviewed.json'),JSON.stringify(state));
 const status=()=>reviewStatus({runDir,projectFile:file,exportDir,projectHash});
 assert.equal(status().deliverable,true);assert.deepEqual(status().exportProblems,[]);
 fs.writeFileSync(path.join(exportDir,'frozen-export-receipt-1.json'),JSON.stringify({status:1}));
 assert.match(status().exportProblems.join(),/checker has not passed/);assert.equal(status().deliverable,false);
 fs.writeFileSync(path.join(exportDir,'frozen-export-receipt-2.json'),JSON.stringify({status:0}));assert.equal(status().deliverable,true);
 report.short.issues=[{page:1,kind:'graph-tick-overlap'}];writeAll();assert.match(status().exportProblems.join(),/1 automated issues in short/);
 report.short.issues=[];writeAll();
 fs.writeFileSync(file,JSON.stringify({...project,revision:2},null,2)+'\n');
 const stale=status();assert.equal(stale.deliverable,false);assert.equal(stale.exportProblems.length,5,'every edition was exported from older content');
});
