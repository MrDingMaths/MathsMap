import {assessedRating} from '../scripts/booklet/reasoning-ratings.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {contentHash,pendingBlocks,batchBlocks,applyCorrections,recordContentResult,recordReuseFallbacks,loadReviewed,runContentReview,visualPlan,visualBatches,recordVisualResult,runVisualReview,reviewStatus,openProject,sourcePagesFor,teachingFor,runLeanExport,applyRepair,outstandingFindings,scopeRepairedVisualPlan} from '../scripts/booklet/lean-review.mjs';
import {contentPrompt,contentImages,supplementalSourceImages,practiceContentEvidence,PRACTICE_CONTENT_EVIDENCE_VERSION} from '../scripts/booklet/lean-review.mjs';
import {createHash} from 'node:crypto';
import {prepareExportVisualPlan} from '../scripts/booklet/lean-review.mjs';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';

test('failed automated exports can be inspected without granting acceptance or using stale project content',async()=>{
 const project=fixture(),{runDir,file}=workspace(project),out=path.join(runDir,'failed-export');fs.mkdirSync(out);
 const report=Object.fromEntries(['student','short','worked','with-short','with-worked'].map(edition=>[edition,{projectHash:projectReviewHash(project),pdf:{path:edition+'.pdf',hash:edition},pageHashes:[{page:1,hash:edition,blocks:[],isCover:true}],issues:edition==='student'?[{page:1,kind:'graph-tick-overlap'}]:[]} ]));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({report:{p:report}}));
 fs.writeFileSync(path.join(out,'frozen-export-receipt-1.json'),JSON.stringify({status:1}));
 const result=await prepareExportVisualPlan({runDir,projectId:'p',projectFile:file,out},{rasterize:async(_pdf,_count,_out,{pages})=>({images:pages.map(page=>({page,path:'page-'+page+'.png'}))})});
 assert.equal(result.automatedIssues.student,1);assert.equal(result.pagesToInspect.student,1);
 assert.equal(reviewStatus({runDir,projectFile:file,exportDir:out,projectHash:projectReviewHash}).deliverable,false);
 const before=fs.readFileSync(path.join(out,'frozen-export-receipt-1.json'),'utf8');
 project.title='Changed title';fs.writeFileSync(file,JSON.stringify(project));
 await assert.rejects(prepareExportVisualPlan({runDir,projectId:'p',projectFile:file,out},{rasterize:async()=>({images:[]})}),/current rendered PDF/);
 assert.equal(fs.readFileSync(path.join(out,'frozen-export-receipt-1.json'),'utf8'),before);
});

test('supplemental Word source images must retain their original pinned bytes',t=>{
 const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'lean-source-images-'));t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));
 const relative='evidence/word/media/media/image1.png',file=path.join(runDir,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'original-source-image');
 fs.writeFileSync(path.join(runDir,'manifest.json'),JSON.stringify({pins:{runFiles:{[relative]:createHash('sha256').update(fs.readFileSync(file)).digest('hex')}}}));
 const batch={rows:[{block:{sourceReview:{sourceEvidenceImages:[relative,relative]}}}]};
 assert.deepEqual(supplementalSourceImages(batch,runDir),[file]);
 fs.writeFileSync(file,'changed-source-image');assert.throws(()=>supplementalSourceImages(batch,runDir),/missing or changed/);
 batch.rows[0].block.sourceReview.sourceEvidenceImages=['../private.png'];assert.throws(()=>supplementalSourceImages(batch,runDir),/original extracted Word image/);
 assert.deepEqual(supplementalSourceImages({rows:[{block:{}}]},runDir),[]);
});

test('required supplemental source images are never silently truncated',()=>{
 const batch={rows:[{block:{sourcePageNumber:1}}]};
 assert.throws(()=>contentImages(batch,()=>'',{limit:1,supplementalImages:['source-a.png','source-b.png']}),/split the review batch/);
});

test('fallback reuse references record actual full review without renewing acceptance or claiming inherited approval',()=>{
 const block={id:'copy',type:'question',content:{prompt:'Given 2 and 4'},sourceReview:{reuse:{projectId:'ratios',blockId:'original'}}};
 const project={sections:[{blocks:[block]}]},prior={hash:contentHash(block),outcome:'passed',attempts:1,at:'original-time',note:'Independently reviewed'},state={questions:{copy:structuredClone(prior)}},context={projectId:'ratios',runDir:'prior-run'};
 assert.equal(recordReuseFallbacks(project,state,context),1);
 const {reuse,...acceptance}=state.questions.copy;assert.deepEqual(acceptance,prior);assert.equal(reuse.outcome,'full-review');assert.equal(reuse.blockId,'original');assert.equal(reuse.runDir,'prior-run');
 assert.equal(recordReuseFallbacks(project,state,context),0);
 for(const outcome of ['failed','pending'])assert.equal(recordReuseFallbacks(project,{questions:{copy:{...prior,outcome}}},context),0);
 assert.equal(recordReuseFallbacks(project,{questions:{copy:{...prior,hash:'stale'}}},context),0);
});

test('scoped visual repairs keep neighbours, moved content and flags without rereading hash-only changes',()=>{
 const editions=['student','short','worked','with-short','with-worked'],project={sections:[{blocks:[{id:'fixed'},{id:'unchanged'}]}]},plan={},previousPlan={},report={},previousReport={},state={pages:{}};
 for(const edition of editions){
  const old=Array.from({length:7},(_,i)=>({page:i+1,hash:'old-'+edition+'-'+i,blocks:[i===2?'fixed':'unchanged']}));
  const current=old.map(row=>({...row,hash:'new-'+row.hash}));
  previousPlan[edition]={pending:old};plan[edition]={pending:current};previousReport[edition]={pageHashes:old};report[edition]={pageHashes:current,issues:[{page:6}]};
  for(const row of old)state.pages[edition+':'+row.hash]={outcome:'accepted'};
 }
 state.pages['student:old-student-2'].outcome='needs-change';
 const scoped=scopeRepairedVisualPlan({project,plan,report,previousPlan,previousReport,state,repairBlocks:['fixed']});
 assert.deepEqual(scoped.student.pending.map(p=>p.page),[2,3,4,5,6,7]);
 assert.deepEqual(scoped['with-short'].pending.map(p=>p.page),[3,6]);
 assert.equal(plan.student.pending.length,7,'the input plan is unchanged');
 assert.throws(()=>scopeRepairedVisualPlan({project,plan,report,previousPlan,previousReport,state,repairBlocks:['unchanged']}),/outstanding finding/);
 delete state.pages['short:old-short-0'];
 const interrupted=structuredClone(state),resumed=scopeRepairedVisualPlan({project,plan,report,previousPlan,previousReport,state,repairBlocks:['fixed']});
 assert.deepEqual(resumed.short.pending.map(p=>p.page),[1,2,3,4,5,6,7],'the unfinished page and its neighbours remain pending alongside repairs');
 assert.deepEqual(state,interrupted,'scoping cannot manufacture acceptance for an interrupted batch');
});

test('accepted source-key and helper processing notes do not duplicate combined bodies, while real visual and automated flags remain',()=>{
 const project=fixture(),block=project.sections[2].blocks[0];
 project.studio={flags:[{id:'answer-match-1',targetId:block.id,note:'Original key typo corrected',resolved:false},{id:'nr-1',targetId:block.id,note:'estimateWorkedWritingSpace could not be accessed',resolved:false}]};
 const state={questions:{[block.id]:{outcome:'passed',hash:contentHash(block)}},pages:{}};
 const hashes=Array.from({length:6},(_,i)=>({page:i+1,hash:'p'+i,mode:i<4?'student':'short',isCover:i===0,answerSectionStart:i===4,blocks:i===2?[block.id]:[]}));
 const entry={pdf:{path:'combined.pdf'},pageHashes:hashes,issues:[]};
 const report=Object.fromEntries(['student','short','worked','with-short','with-worked'].map(edition=>[edition,structuredClone(entry)]));
 assert.deepEqual(visualPlan({project,report,state})['with-short'].pending.map(p=>p.page),[1,4,5,6]);
 assert.ok(visualPlan({project,report,state}).student.pending.some(p=>p.page===3));
 report['with-short'].issues=[{page:3,kind:'clipping'}];assert.ok(visualPlan({project,report,state})['with-short'].pending.some(p=>p.page===3));
 report['with-short'].issues=[];project.studio.flags.push({id:'visual-unknown',targetId:block.id,note:'Unreviewed label overlap',resolved:false});assert.ok(visualPlan({project,report,state})['with-short'].pending.some(p=>p.page===3));
 project.studio.flags.pop();state.questions[block.id].hash='stale';assert.ok(visualPlan({project,report,state})['with-short'].pending.some(p=>p.page===3));
});
test('scoped visual repair consumes moved page sequences and retains new/reflowed bodies and combined boundaries',()=>{
 const editions=['student','short','worked','with-short','with-worked'],project={sections:[{blocks:['fixed','other','tail','new'].map(id=>({id}))}]},plan={},previousPlan={},report={},previousReport={},state={pages:{}};
 for(const edition of editions){
  const old=[['other'],['fixed'],['tail'],['tail'],['other'],['other'],['other'],['other']].map((blocks,i)=>({page:i+1,blocks,hash:edition+'-old-'+i,mode:'student',isCover:i===0}));
  const current=[['other'],['fixed'],['fixed'],['tail'],['tail'],['other'],['other'],['other'],['other'],['tail'],['new']].map((blocks,i)=>({page:i+1,blocks,hash:edition+'-new-'+i,mode:i>=10?'short':'student',isCover:i===0,answerSectionStart:i===10}));
  previousPlan[edition]={pending:old};plan[edition]={pending:current};previousReport[edition]={pageHashes:old};report[edition]={pageHashes:current,issues:[]};for(const row of old)state.pages[edition+':'+row.hash]={outcome:'accepted'};
 }
 const snapshot=structuredClone(state),scoped=scopeRepairedVisualPlan({project,plan,report,previousPlan,previousReport,state,repairBlocks:['fixed']});
 assert.deepEqual(scoped.student.pending.map(p=>p.page),[1,2,3,4,9,10,11]);
 assert.ok(!scoped.student.pending.some(p=>[5,6,7,8].includes(p.page)),'unchanged shifted bodies are not inspected again');
 assert.deepEqual(scoped['with-short'].pending.map(p=>p.page),Array.from({length:11},(_,i)=>i+1),'the existing combined composition selection remains current when page count changes');
 assert.deepEqual(state,snapshot,'scoping neither records nor rebinds acceptance');
});
import {leanPreExportLint} from '../scripts/booklet/import-pre-final.mjs';
import {solidAcceptance} from '../scripts/audit-solid-visibility.mjs';

const question=(id,short='4')=>{const block={id,type:'question',sourcePageNumber:6,sourceRefs:[{pageNumber:6}],classification:{primarySkillId:'skill-a'},sourceReview:{teachingContext:[{pageNumber:4,method:'m'}]},content:{id:id+'-root',type:'question',prompt:'Find x.',layout:'grid',answer:{short,worked:'x='+short}}};block.classification={...block.classification,...assessedRating(block,{reasoningScore:20,difficulty:'Foundation',difficultyReason:'Apply the given one-step method.'},{model:'test-model',assessedAt:'2026-10-21T00:00:00Z',evidence:'test-fixture'})};return block;};
const fixture=()=>({id:'p',title:'P',reviewProfile:'textbook-three-pass-v1',revision:1,sections:[
 {id:'front',phase:'front-matter',blocks:[{id:'cover',type:'cover'}]},
 {id:'teach',phase:'teaching',topicId:'t1',blocks:[{id:'example',type:'question',sourcePageNumber:4,content:{id:'example-root',prompt:'Example'}}]},
 {id:'practice',phase:'practice',topicId:'t1',blocks:[question('q1'),question('q2'),question('q3'),question('q4'),question('q5')]}]});
const workspace=project=>{const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'lean-review-')),file=path.join(runDir,'candidate.json');fs.writeFileSync(file,JSON.stringify(project,null,2)+'\n');return {runDir,file,dir:path.join(runDir,'lean-review')};};

test('initial export refuses an unverified reasoning rating before rendering',async t=>{
 const project=fixture();delete project.sections[2].blocks[0].classification.assessment;
 const {runDir,file}=workspace(project);t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));let rendered=0;
 await assert.rejects(runLeanExport({runDir,projectId:project.id,projectFile:file,out:path.join(runDir,'export')},{exportRuntime:async()=>{rendered++;}}),/Incomplete LLM reasoning ratings.*q1/);
 assert.equal(rendered,0);
});

function practiceEvidenceFixture(t){
 const block=question('practice'),section={id:'practice',phase:'practice',blocks:[block]},project={...fixture(),source:{contentScope:'practice-only'},sections:[section]};
 block.sourceReview={teachingContext:{pdfPages:[4,5],methodNote:'Use the source method'},answerEvidence:{teacherReference:[30,31].map(pdfPage=>({pdfPage,printedPage:405,exercise:'6A',questionLabel:'1'}))}};
 const w=workspace(project);t.after(()=>fs.rmSync(w.runDir,{recursive:true,force:true}));
 const pins={};
 for(const relative of ['source/booklet.pdf','source/teacher.pdf','evidence/pages/page-006.png','evidence/pages/page-004.png','evidence/pages/page-005.png','evidence/teacher/pages/page-030.png','evidence/teacher/pages/page-031.png']){
  const file=path.join(w.runDir,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'original '+relative);pins[relative]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 }
 fs.writeFileSync(path.join(w.runDir,'manifest.json'),JSON.stringify({selectedPages:[6],contextPages:[4,5],teacherPages:[30,31],source:{pdfHash:pins['source/booklet.pdf'],teacherPdf:'original-answer.pdf',teacherPdfHash:pins['source/teacher.pdf']},pins:{runFiles:pins}}));
 return {...w,project,block,batch:{section,rows:[{block}]}};
}

test('practice review delivers numeric teaching references and every matched original key image, with readable pinned paths',t=>{
 const w=practiceEvidenceFixture(t),evidence=practiceContentEvidence(w.project,w.batch,w.runDir),pageImage=p=>path.join(w.runDir,'evidence/pages/page-'+String(p).padStart(3,'0')+'.png');
 assert.deepEqual(sourcePagesFor(w.block),{own:[6],related:[4,5]});
 const images=contentImages(w.batch,pageImage,{limit:4,evidence});
 assert.equal(images.length,4);for(const p of [30,31])assert.ok(images.includes(path.join(w.runDir,'evidence/teacher/pages/page-'+String(p).padStart(3,'0')+'.png')));
 const prompt=contentPrompt({project:w.project,batch:w.batch,evidence});assert.ok(prompt.includes(JSON.stringify(path.join(w.runDir,'evidence/pages/page-005.png')).slice(1,-1)));assert.match(prompt,/independently derive every answer/i);assert.match(prompt,/Inspect all linked answer pages/);
 assert.throws(()=>contentImages(w.batch,pageImage,{limit:2,evidence}),/split the review batch/);
 fs.writeFileSync(path.join(w.runDir,'source/teacher.pdf'),'changed');assert.throws(()=>practiceContentEvidence(w.project,w.batch,w.runDir),/missing or changed/);
});

test('practice reviews with missing original teaching/key evidence never launch or accept, and old incomplete reviews require real reinspection',async t=>{
 const w=practiceEvidenceFixture(t),state={questions:{practice:{hash:contentHash(w.block),outcome:'passed'}}};
 assert.equal(pendingBlocks(w.project,state).length,1);
 let calls=0;fs.unlinkSync(path.join(w.runDir,'evidence/pages/page-005.png'));
 const result=await runContentReview({runDir:w.runDir,projectFile:w.file,skills:[],runner:async()=>{calls++;return {result:passAll(['practice'])};}});
 assert.equal(calls,0);assert.equal(result.remaining,1);assert.match(result.errors[0].error,/missing or changed/);assert.equal(loadReviewed(w.dir).questions.practice,undefined);
 state.questions.practice.practiceEvidenceVersion=PRACTICE_CONTENT_EVIDENCE_VERSION;assert.equal(pendingBlocks(w.project,state).length,0);
});
const passAll=batchIds=>({records:batchIds.map(id=>({id,outcome:'passed',note:'ok'})),corrections:[]});
const idsIn=prompt=>JSON.parse(prompt.slice(prompt.indexOf('\n\n')+2)).blocks.map(block=>block.id);

test('same-pass geometry decisions bind corrected code and never accept rejected or failed blocks',()=>{
 const block=question('q'),diagram={id:'d',format:'tikz',code:'old'};block.content.questionDiagrams=[diagram];
 const {dir}=workspace(fixture()),state={questions:{},pages:{}};
 const batch={rows:[{block}]},result={records:[{id:'q',outcome:'passed'}],corrections:[{patches:[{targetId:'d',field:'/code',original:'old',corrected:'new'}]}],diagramReviews:[{targetId:'d',outcome:'accepted',reason:'Checked visible faces and silhouette'},{targetId:'outside',outcome:'accepted',reason:'Ignore foreign ID'}]};
 recordContentResult({batch,result,state,dir});assert.equal(Object.keys(state.diagrams).length,1);
 const first=Object.keys(state.diagrams)[0];
 recordContentResult({batch,result:{...result,corrections:[{patches:[{targetId:'d',field:'/code',original:'stale',corrected:'bad'}]}]},state,dir});
 assert.deepEqual(Object.keys(state.diagrams),[first]);
 diagram.code='failed';recordContentResult({batch,result:{records:[{id:'q',outcome:'failed'}],diagramReviews:result.diagramReviews},state,dir});
 assert.deepEqual(Object.keys(state.diagrams),[first]);
 fs.rmSync(path.dirname(dir),{recursive:true,force:true});
});
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

test('passed raster content stays reviewed while the export still requires image acceptance',()=>{
 const project=fixture(),block=project.sections[2].blocks[0],state={questions:{},pages:{}};
 block.content.questionDiagrams=[{id:'source-chart',format:'image',src:'/missing-source-chart.png'}];
 assert.ok(pendingBlocks(project,state).some(row=>row.block===block));
 for(const {block:own} of pendingBlocks(project,state))state.questions[own.id]={hash:contentHash(own),outcome:'passed'};
 assert.equal(pendingBlocks(project,state).length,0);
 assert.equal(solidAcceptance(project).filter(issue=>issue.status==='image-review').length,1);
 block.content.answer.short='5';
 assert.deepEqual(pendingBlocks(project,state).map(row=>row.block.id),['q1']);
});

test('a passed block with unresolved native geometry returns to content review',()=>{
 const project=fixture(),block=project.sections[2].blocks[0];
 const code=String.raw`\begin{tikzpicture}\draw (0,0)--(1,1);\end{tikzpicture}`;
 project.title='Surface area of cylinders';
 block.content.questionDiagrams=[{id:'d',format:'tikz',code}];
 const state={questions:{},pages:{}};
 for(const {block:own} of pendingBlocks(project,state))state.questions[own.id]={hash:contentHash(own),outcome:'passed'};
 assert.deepEqual(pendingBlocks(project,state).map(row=>row.block.id),['q1']);
 recordContentResult({batch:{rows:[{block}]},result:{records:[{id:block.id,outcome:'passed'}],diagramReviews:[{targetId:'d',outcome:'accepted',reason:'Checked planar construction rather than a solid'}]},state,dir:workspace(project).dir});
 assert.equal(pendingBlocks(project,state).length,0);
 block.content.questionDiagrams[0].code+='\n% changed';
 assert.deepEqual(pendingBlocks(project,state).map(row=>row.block.id),['q1']);
});

test('batches hold at most four consecutive blocks of one section',()=>{
 const project=fixture(),batches=batchBlocks(pendingBlocks(project,{questions:{},pages:{}}));
 assert.deepEqual(batches.map(batch=>batch.rows.map(row=>row.block.id)),[['example'],['q1','q2','q3','q4'],['q5']]);
 assert.equal(batchBlocks(pendingBlocks(project,{questions:{},pages:{}}),{characters:1}).length,6,'an oversized block still gets its own batch');
 assert.deepEqual(sourcePagesFor(project.sections[2].blocks[0]),{own:[6],related:[4]});
 assert.equal(teachingFor(project,project.sections[2]).length,1);
});

test('scoped teaching review includes same-group companions without reopening their review',()=>{
 const text={id:'definitions',type:'rich-text',sourceAtom:{id:'tests'},content:'Four similarity tests'};
 const figures={id:'figures',type:'worked-example',sourceAtom:{id:'tests'},examples:[{id:'sss',prompt:'SSS',questionDiagrams:[{id:'pair',format:'tikz',code:'paired triangles'}]}]};
 const unrelated={id:'activity',type:'question',sourceAtom:{id:'different-group'}};
 const section={id:'teaching',phase:'teaching',blocks:[text,figures,unrelated]},project={title:'Similarity',sections:[section]};
 const state={questions:{definitions:{hash:'before-repair',outcome:'passed'},figures:{hash:contentHash(figures),outcome:'passed'},activity:{hash:contentHash(unrelated),outcome:'passed'}}};
 const batch=batchBlocks(pendingBlocks(project,state))[0],prompt=contentPrompt({project,batch}),payload=JSON.parse(prompt.slice(prompt.indexOf('\n\n')+2));
 assert.deepEqual(payload.blocks.map(block=>block.id),['definitions']);
 assert.deepEqual(payload.companionBlocks.map(block=>block.id),['figures']);
 assert.equal(payload.companionBlocks[0].examples[0].questionDiagrams[0].code,'paired triangles');
 assert.equal(pendingBlocks(project,state).length,1);
 assert.deepEqual(batch.rows.map(row=>row.block.id),['definitions']);
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
 const unchanged=await runVisualReview({runDir,projectFile:file,exportDir,nativeDetails:()=>[],runner:async()=>assert.fail('Unchanged failed pixels require repair, not another opinion')});
 assert.equal(unchanged.pagesInspected,0);assert.equal(unchanged.outstandingFindings,1);
 const savedRepairPlan=JSON.parse(fs.readFileSync(path.join(exportDir,'visual-plan.json')));savedRepairPlan.student.pending[1].hash='b-repaired';fs.writeFileSync(path.join(exportDir,'visual-plan.json'),JSON.stringify(savedRepairPlan));
 await runVisualReview({runDir,projectFile:file,exportDir,nativeDetails:()=>[],runner:async({images})=>{calls++;assert.deepEqual(images,['two.png']);return {result:{pages:[{page:2,outcome:'accepted'}]}};}});
 assert.equal(calls,2);assert.deepEqual(reviewStatus({runDir,projectFile:file}),{blocks:6,pending:6,shadingPending:0,reasoningRatings:{total:5,verified:5,missing:[]},failed:[],pagesAccepted:2,pagesNeedingChange:1});
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


test('replacement-shaped repair patches are rejected before an existing field can be deleted',()=>{
 const blocks=[{id:'q',content:{prompt:'Original',obsolete:'Old'}}],before=structuredClone(blocks);
 const wrong=applyCorrections(blocks,[{patches:[{targetId:'q',field:'/content/prompt',original:'Original',replacement:'New'}]}]);
 assert.equal(wrong.applied.length,0);assert.equal(wrong.rejected[0].status,'rejected');assert.match(wrong.rejected[0].error,/use corrected/);assert.deepEqual(blocks,before);
 const right=applyCorrections(blocks,[{patches:[{targetId:'q',field:'/content/prompt',original:'Original',corrected:'New'}]}]);assert.equal(right.applied.length,1);assert.equal(blocks[0].content.prompt,'New');
 const deletion=applyCorrections(blocks,[{patches:[{targetId:'q',field:'/content/obsolete',original:'Old'}]}]);assert.equal(deletion.applied.length,1);assert.equal(Object.hasOwn(blocks[0].content,'obsolete'),false);
});

// External teaching evidence must remain original pinned source material in a
// canonical sibling run. These fixtures contain no project/cache symlinks.
import {externalTeachingSources,splitExternalTeachingBatches} from '../scripts/booklet/lean-review.mjs';
function externalEvidenceFixture(t,{pages=[1,2,3,4]}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lean-external-teaching-'));
 const resolvedRoot=path.resolve(root);
 t.after(()=>{assert.ok(path.basename(resolvedRoot).startsWith('lean-external-teaching-'));assert.equal(path.dirname(resolvedRoot),path.resolve(os.tmpdir()));fs.rmSync(resolvedRoot,{recursive:true,force:true});});
 const runDir=path.join(root,'current'),sibling=path.join(root,'prior-chapter'),runId='prior-chapter';
 const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));return file;};
 const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const localPins={},externalPins={};
 for(const relative of ['source/booklet.pdf','evidence/pages/page-006.png'])localPins[relative]=digest(write(path.join(runDir,relative),'current '+relative));
 write(path.join(runDir,'manifest.json'),{id:'current',selectedPages:[6],contextPages:[],source:{pdfHash:localPins['source/booklet.pdf']},pins:{runFiles:localPins}});
 for(const relative of ['source/booklet.pdf',...pages.map(page=>'evidence/pages/page-'+String(page).padStart(3,'0')+'.png')])externalPins[relative]=digest(write(path.join(sibling,relative),'earlier original '+relative));
 const manifest={id:runId,selectedPages:pages.slice(0,1),contextPages:pages.slice(1),source:{pdfHash:externalPins['source/booklet.pdf']},pins:{runFiles:externalPins}},manifestFile=path.join(sibling,'manifest.json');write(manifestFile,manifest);
 const references=pages.map(pdfPage=>({runId,pdfPage,imageHash:externalPins['evidence/pages/page-'+String(pdfPage).padStart(3,'0')+'.png']}));
 const block=question('external-practice');block.sourceReview={teachingContext:{pdfPages:[],externalSources:references,methodNote:'Use earlier original chapter teaching.'}};
 const section={id:'external-practice',phase:'practice',blocks:[block]},project={...fixture(),source:{contentScope:'practice-only'},sections:[section]},batch={section,rows:[{block}]},pageImage=page=>path.join(runDir,'evidence/pages/page-'+String(page).padStart(3,'0')+'.png');
 return {root,runDir,sibling,runId,manifest,manifestFile,write,digest,references,block,section,project,batch,pageImage};
}

test('external teaching pins canonical sibling original PDF and every prepared PNG, including context pages',t=>{
 const w=externalEvidenceFixture(t),refs=externalTeachingSources(w.block,w.runDir),pdf=path.join(w.sibling,'source/booklet.pdf');
 assert.equal(refs.length,5);assert.deepEqual(refs.filter(row=>row.kind==='external-teaching').map(row=>row.pdfPage),[1,2,3,4]);
 for(const ref of refs){assert.equal(ref.runId,w.runId);assert.equal(ref.hash,w.digest(ref.path));if(ref.kind==='external-teaching'){assert.equal(ref.sourcePdf,pdf);assert.equal(ref.sourcePdfHash,w.manifest.source.pdfHash);}}
 assert.deepEqual(refs.find(row=>row.kind==='external-teaching-pdf'),{kind:'external-teaching-pdf',runId:w.runId,path:pdf,hash:w.manifest.source.pdfHash});
 w.block.sourceReview.teachingContext.externalSources.push(w.references[0]);assert.equal(externalTeachingSources(w.block,w.runDir).length,5,'identical original evidence is attached once');
});

test('external-only teaching is valid practice evidence and retains complete references and prompt evidence',t=>{
 const w=externalEvidenceFixture(t),evidence=practiceContentEvidence(w.project,w.batch,w.runDir);
 assert.deepEqual(w.block.sourceReview.teachingContext.pdfPages,[]);assert.deepEqual(evidence.questions[0].teachingContext.externalSources,w.references);
 assert.equal(evidence.files.filter(row=>row.kind==='external-teaching').length,4);assert.equal(evidence.files.filter(row=>row.kind==='external-teaching-pdf').length,1);
 const payload=JSON.parse(contentPrompt({project:w.project,batch:w.batch,evidence}).split('\n\n').at(-1));
 assert.deepEqual(payload.originalPdfEvidence.questions[0].teachingContext.externalSources,w.references);
 assert.equal(payload.originalPdfEvidence.files.filter(row=>row.kind==='external-teaching').length,4);
 const images=contentImages(w.batch,w.pageImage,{limit:5,evidence});assert.equal(images.length,5);for(const row of evidence.files.filter(row=>row.kind==='external-teaching'))assert.ok(images.includes(row.path),'every selected external image is attached');
 assert.ok(!images.some(file=>file.endsWith('.pdf')));assert.throws(()=>contentImages(w.batch,w.pageImage,{limit:4,evidence}),/split the review batch/);
});

test('external teaching rejects traversal, absolute paths, current run, invalid hashes and nonarrays',async t=>{
 for(const [name,patch] of [['traversal',{runId:'../prior-chapter'}],['absolute',{runId:path.resolve('prior-chapter')}],['current',{runId:'current'}],['zero page',{pdfPage:0}],['fraction page',{pdfPage:1.5}],['unhashed',{imageHash:''}]])await t.test(name,sub=>{const w=externalEvidenceFixture(sub);w.block.sourceReview.teachingContext.externalSources=[{...w.references[0],...patch}];assert.throws(()=>externalTeachingSources(w.block,w.runDir),/Invalid external|canonical sibling/);});
 const w=externalEvidenceFixture(t);w.block.sourceReview.teachingContext.externalSources={runId:'prior-chapter'};assert.throws(()=>externalTeachingSources(w.block,w.runDir),/must be an array/);
});

test('external teaching rejects wrong manifest identity, unprepared pages and absent or inconsistent original pins',async t=>{
 const variants=[['manifest identity',w=>w.manifest.id='other'],['unprepared page',w=>{w.manifest.selectedPages=[];w.manifest.contextPages=[];}],['unpinned image',w=>delete w.manifest.pins.runFiles['evidence/pages/page-001.png']],['wrong image reference',w=>w.block.sourceReview.teachingContext.externalSources[0].imageHash='0'.repeat(64)],['unpinned PDF',w=>delete w.manifest.pins.runFiles['source/booklet.pdf']],['wrong PDF identity',w=>w.manifest.source.pdfHash='0'.repeat(64)]];
 for(const [name,change] of variants)await t.test(name,sub=>{const w=externalEvidenceFixture(sub);change(w);w.write(w.manifestFile,w.manifest);assert.throws(()=>externalTeachingSources(w.block,w.runDir),/missing or changed/);});
});

test('external teaching rejects changed or missing original PNG and PDF bytes',async t=>{
 for(const [name,relative,remove] of [['changed image','evidence/pages/page-001.png',false],['missing image','evidence/pages/page-001.png',true],['changed PDF','source/booklet.pdf',false],['missing PDF','source/booklet.pdf',true]])await t.test(name,sub=>{const w=externalEvidenceFixture(sub),file=path.join(w.sibling,relative);if(remove)fs.unlinkSync(file);else fs.appendFileSync(file,'changed after pin');assert.throws(()=>externalTeachingSources(w.block,w.runDir),/missing or changed/);});
});

test('external teaching rejects symlinked sibling, PNG and PDF even when linked bytes match pins',async t=>{
 for(const [name,relative,type] of [['sibling','',process.platform==='win32'?'junction':'dir'],['image','evidence/pages/page-001.png','file'],['PDF','source/booklet.pdf','file']])await t.test(name,sub=>{
  const w=externalEvidenceFixture(sub),file=relative?path.join(w.sibling,relative):path.join(w.root,'alias-chapter'),target=relative?path.join(w.root,'linked-'+path.basename(relative)):w.sibling;
  if(relative){fs.copyFileSync(file,target);fs.unlinkSync(file);}else {w.block.sourceReview.teachingContext.externalSources=w.references.map(ref=>({...ref,runId:'alias-chapter'}));w.manifest.id='alias-chapter';w.write(w.manifestFile,w.manifest);}
  try{fs.symlinkSync(target,file,type);}catch(error){if(['EPERM','EACCES','ENOTSUP'].includes(error.code)){sub.skip('Host does not permit this symlink type');return;}throw error;}
  assert.throws(()=>externalTeachingSources(w.block,w.runDir),/canonical sibling|missing or changed/);
 });
});

test('local-only source behavior stays unchanged and does not need an external run manifest',t=>{
 assert.deepEqual(externalTeachingSources({},path.join(os.tmpdir(),'no-external-manifest')),[]);
 const w=practiceEvidenceFixture(t),before=practiceContentEvidence(w.project,w.batch,w.runDir);
 w.block.sourceReview.teachingContext.externalSources=[];const after=practiceContentEvidence(w.project,w.batch,w.runDir);
 assert.deepEqual(after.files,before.files);assert.deepEqual(contentImages(w.batch,()=>'',{evidence:after}),contentImages(w.batch,()=>'',{evidence:before}));
 const batches=[{rows:[{block:{id:'local-a'}}]},{rows:[{block:{id:'local-b'}}]}],result=splitExternalTeachingBatches(batches,{project:{},runDir:'missing',pageImage:()=>'',limit:0});assert.deepEqual(result,batches);assert.equal(result[0],batches[0]);
});

test('external image budget recursively splits batches while retaining whole questions, row order and batch metadata',t=>{
 const w=externalEvidenceFixture(t),rows=w.references.map((ref,index)=>{const block=structuredClone(w.block);block.id='whole-'+index;block.content.children=[{id:'part-'+index,prompt:'Keep in parent'}];block.sourceReview.teachingContext.externalSources=[ref];return {block,tag:'row-'+index};}),batch={...w.batch,rows,marker:'preserve batch context'};
 const result=splitExternalTeachingBatches([batch],{project:w.project,runDir:w.runDir,pageImage:w.pageImage,limit:2});
 assert.equal(result.length,4);assert.deepEqual(result.flatMap(item=>item.rows),rows);assert.equal(batch.rows.length,4);
 for(const [index,item]of result.entries()){assert.equal(item.rows.length,1);assert.equal(item.rows[0],rows[index]);assert.equal(item.rows[0].block.content.children.length,1);assert.equal(item.section,batch.section);assert.equal(item.marker,batch.marker);const evidence=practiceContentEvidence(w.project,item,w.runDir);assert.equal(contentImages(item,w.pageImage,{limit:2,evidence}).length,2);}
 assert.throws(()=>splitExternalTeachingBatches([w.batch],{project:w.project,runDir:w.runDir,pageImage:w.pageImage,limit:4}),/One question requires more.*external-practice/);
});

test('external original files and manifest pins cannot change during the independent content call',async t=>{
 for(const [name,change]of [['PNG bytes',w=>fs.appendFileSync(path.join(w.sibling,'evidence/pages/page-001.png'),'changed')],['PDF bytes',w=>fs.appendFileSync(path.join(w.sibling,'source/booklet.pdf'),'changed')],['manifest pins',w=>{w.manifest.pins.runFiles['evidence/pages/page-001.png']='0'.repeat(64);w.write(w.manifestFile,w.manifest);}],['manifest prepared pages',w=>{w.manifest.selectedPages=[];w.manifest.contextPages=[];w.write(w.manifestFile,w.manifest);}]])await t.test(name,async sub=>{
  const w=externalEvidenceFixture(sub,{pages:[1]}),projectFile=w.write(path.join(w.runDir,'candidate.json'),w.project);let calls=0;
  const result=await runContentReview({runDir:w.runDir,projectFile,root:w.root,skills:[],runner:async()=>{calls++;change(w);return {result:passAll([w.block.id])};}});
  assert.equal(calls,1);assert.equal(result.passed,0);assert.equal(result.remaining,1);assert.equal(result.errors.length,1);assert.match(result.errors[0].error,/changed during the call|missing or changed/);assert.equal(loadReviewed(path.join(w.runDir,'lean-review')).questions[w.block.id],undefined);
 });
});

import {externalTeachingBinding} from '../scripts/booklet/lean-review.mjs';
function acceptExternalEvidence(w){
 const state={questions:{},pages:{}};w.batch.practiceEvidence=practiceContentEvidence(w.project,w.batch,w.runDir);w.batch.projectId=w.project.id;
 recordContentResult({batch:w.batch,result:passAll([w.block.id]),state,dir:path.join(w.runDir,'lean-review')});
 return state;
}

test('external teaching acceptance binds references without discarding accepted mathematical snapshots',t=>{
 const w=externalEvidenceFixture(t,{pages:[1]}),state=acceptExternalEvidence(w),row=state.questions[w.block.id],accepted=structuredClone(row.acceptedVersion),printable=contentHash(w.block),refs=structuredClone(w.references);
 assert.equal(row.externalTeachingBinding,externalTeachingBinding(w.block));assert.deepEqual(pendingBlocks(w.project,state),[]);
 for(const change of [block=>block.sourceReview.teachingContext.externalSources[0].imageHash='0'.repeat(64),block=>block.sourceReview.teachingContext.externalSources[0].runId='another-chapter',block=>block.sourceReview.teachingContext.externalSources[0].pdfPage=2,block=>delete block.sourceReview.teachingContext.externalSources]){
  w.block.sourceReview.teachingContext.externalSources=structuredClone(refs);change(w.block);
  assert.equal(contentHash(w.block),printable,'source metadata changes must not pretend mathematics changed');assert.deepEqual(pendingBlocks(w.project,state).map(item=>item.block.id),[w.block.id]);assert.deepEqual(state.questions[w.block.id].acceptedVersion,accepted,'prior mathematical acceptance remains available for compatibility review');
 }
 w.block.sourceReview.teachingContext.externalSources=refs;assert.deepEqual(pendingBlocks(w.project,state),[]);
 const legacy=question('legacy'),project={sections:[{phase:'practice',blocks:[legacy]}]},legacyState={questions:{legacy:{hash:contentHash(legacy),outcome:'passed'}},pages:{}};assert.deepEqual(pendingBlocks(project,legacyState),[],'legacy local-only rows keep null external binding');
});

test('external teaching correction records reviewed input references and leaves corrected references pending',t=>{
 const w=externalEvidenceFixture(t,{pages:[1,2]}),state=acceptExternalEvidence(w),beforeHash=contentHash(w.block),original=structuredClone(w.block.sourceReview.teachingContext.externalSources),inputBinding=externalTeachingBinding(w.block),priorMathematics=state.questions[w.block.id].acceptedVersion.mathematicalHash,corrected=[original[1]];
 const result={records:[{id:w.block.id,outcome:'passed',note:'Checked supplied input'}],corrections:[{id:'narrow-reference',reason:'Select the relevant original teaching page',patches:[{targetId:w.block.id,field:'/sourceReview/teachingContext/externalSources',original,corrected}]}]};
 const summary=recordContentResult({batch:w.batch,result,state,dir:path.join(w.runDir,'lean-review')});assert.equal(summary.applied,1);assert.deepEqual(w.block.sourceReview.teachingContext.externalSources,corrected);
 assert.equal(contentHash(w.block),beforeHash);assert.equal(state.questions[w.block.id].externalTeachingBinding,inputBinding);assert.notEqual(state.questions[w.block.id].externalTeachingBinding,externalTeachingBinding(w.block));assert.equal(state.questions[w.block.id].acceptedVersion.mathematicalHash,priorMathematics);assert.equal(pendingBlocks(w.project,state).length,1);
});

test('external teaching correction cannot immediately accept references newly added to a locally reviewed input',t=>{
 const w=externalEvidenceFixture(t,{pages:[1]});w.block.sourceReview.teachingContext.externalSources=[];w.block.sourceReview.teachingContext.pdfPages=[6];const state=acceptExternalEvidence(w),printable=contentHash(w.block);
 const result={records:[{id:w.block.id,outcome:'passed'}],corrections:[{id:'add-earlier-teaching',reason:'Use earlier chapter teaching',patches:[{targetId:w.block.id,field:'/sourceReview/teachingContext/externalSources',original:[],corrected:w.references}]}]};
 recordContentResult({batch:w.batch,result,state,dir:path.join(w.runDir,'lean-review')});assert.equal(state.questions[w.block.id].externalTeachingBinding,null);assert.notEqual(externalTeachingBinding(w.block),null);assert.equal(contentHash(w.block),printable);assert.equal(pendingBlocks(w.project,state).length,1);
});

test('external teaching export and deliverable status reject corrupted original PDF even after acceptance',async t=>{
 const w=externalEvidenceFixture(t,{pages:[1]}),state=acceptExternalEvidence(w),projectFile=w.write(path.join(w.runDir,'candidate.json'),w.project);w.write(path.join(w.runDir,'lean-review/reviewed.json'),state);assert.deepEqual(pendingBlocks(w.project,state),[]);
 fs.appendFileSync(path.join(w.sibling,'source/booklet.pdf'),'corrupted after mathematical acceptance');let renders=0;
 await assert.rejects(runLeanExport({runDir:w.runDir,projectId:w.project.id,projectFile,out:path.join(w.runDir,'new-export')},{exportRuntime:async()=>{renders++;},rasterize:async()=>({images:[]})}),/External original teaching evidence is missing or changed/);assert.equal(renders,0,'invalid source evidence is rejected before starting an export');
 assert.throws(()=>reviewStatus({runDir:w.runDir,projectFile,exportDir:path.join(w.runDir,'prior-export')}),/External original teaching evidence is missing or changed/,'an old reviewed/exported status cannot grant deliverable after its external source changes');
});


test('unkeyed practice requires complete pinned answer-chapter absence evidence and still needs independent review',t=>{
 const w=practiceEvidenceFixture(t),answer=w.block.sourceReview.answerEvidence;
 answer.questionId=w.block.id;answer.teacherReference=[];answer.matchEvidence='Unnumbered activity has no keyed answer.';
 assert.throws(()=>practiceContentEvidence(w.project,w.batch,w.runDir),/lacks answer-book/);
 answer.answerKeyAbsence={searchedTeacherPages:[30,31],reason:'Search all prepared original chapter answer pages; independently verify absence.'};
 const evidence=practiceContentEvidence(w.project,w.batch,w.runDir),pageImage=p=>path.join(w.runDir,'evidence/pages/page-'+String(p).padStart(3,'0')+'.png');
 assert.equal(evidence.files.filter(f=>f.kind==='answer').length,2);
 const images=contentImages(w.batch,pageImage,{limit:4,evidence});for(const p of [30,31])assert.ok(images.includes(path.join(w.runDir,'evidence/teacher/pages/page-'+String(p).padStart(3,'0')+'.png')));
 assert.match(contentPrompt({project:w.project,batch:w.batch,evidence}),/absence assertion itself grants no acceptance/);
 assert.equal(loadReviewed(w.dir).questions[w.block.id],undefined);
 const valid=structuredClone(answer);
 for(const change of [a=>a.answerKeyAbsence.searchedTeacherPages=[30],a=>a.answerKeyAbsence.searchedTeacherPages=[30,32],a=>a.answerKeyAbsence.searchedTeacherPages=[30,30],a=>a.answerKeyAbsence.reason='',a=>a.answerKeyAbsence.reason={},a=>a.questionId='wrong',a=>a.teacherReference=[{pdfPage:30,exercise:'6A',questionLabel:'1'}]]){
  w.block.sourceReview.answerEvidence=structuredClone(valid);change(w.block.sourceReview.answerEvidence);assert.throws(()=>practiceContentEvidence(w.project,w.batch,w.runDir),/Invalid or incomplete/);
 }
 w.block.sourceReview.answerEvidence=structuredClone(valid);w.block.sourceReview.answerEvidence.answerKeyAbsence.reason+=' Changed assertion.';assert.notEqual(practiceContentEvidence(w.project,w.batch,w.runDir).binding,evidence.binding);
 w.block.sourceReview.answerEvidence=structuredClone(valid);
 const image=path.join(w.runDir,'evidence/teacher/pages/page-030.png'),bytes=fs.readFileSync(image);fs.appendFileSync(image,'changed');assert.throws(()=>practiceContentEvidence(w.project,w.batch,w.runDir),/missing or changed/);fs.writeFileSync(image,bytes);
 const manifestFile=path.join(w.runDir,'manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile));const pin=manifest.pins.runFiles['evidence/teacher/pages/page-031.png'];delete manifest.pins.runFiles['evidence/teacher/pages/page-031.png'];fs.writeFileSync(manifestFile,JSON.stringify(manifest));assert.throws(()=>practiceContentEvidence(w.project,w.batch,w.runDir),/missing or changed/);manifest.pins.runFiles['evidence/teacher/pages/page-031.png']=pin;fs.writeFileSync(manifestFile,JSON.stringify(manifest));
 fs.appendFileSync(path.join(w.runDir,'source/teacher.pdf'),'changed');assert.throws(()=>practiceContentEvidence(w.project,w.batch,w.runDir),/missing or changed/);
});
