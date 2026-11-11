// Import pipeline v2 (docs/booklet-import-pipeline-v2.md): review model, one rater, no working-space patches.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {reviewConfiguration,importReviewConfiguration,withReviewConfiguration,requireCurrentReview,REVIEW_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
import {importV2,IMPORT_POLICY,REVIEW_SPACING_FIELDS} from '../scripts/booklet/import-completion.mjs';
import {applyCorrections,recordContentResult,contentPrompt} from '../scripts/booklet/lean-review.mjs';
import {validateSemanticResult} from '../scripts/booklet/semantic-workflow.mjs';
import {practiceRatingBlocks} from '../scripts/booklet/reasoning-ratings.mjs';

test('import reviews use recorded Sol low; other reviews keep Terra high',async()=>{
 const imported=importReviewConfiguration();
 assert.equal(imported.model,'gpt-6.1-sol');assert.equal(imported.effort,'low');
 assert.match(imported.reviewFallback.reason,/Decision 12/);
 assert.doesNotThrow(()=>requireCurrentReview(imported));
 assert.equal(reviewConfiguration().model,REVIEW_DEFAULT.model);
 await withReviewConfiguration(imported,async()=>{
  await new Promise(resolve=>setTimeout(resolve,1));
  assert.equal(reviewConfiguration().model,'gpt-6.1-sol');
  assert.equal(reviewConfiguration({provider:'codex',model:'gpt-6.1-terra',effort:'high'}).model,'gpt-6.1-terra','an explicit record is never overridden');
 });
 assert.equal(reviewConfiguration().model,REVIEW_DEFAULT.model,'the scope ends with its entry point');
 assert.throws(()=>withReviewConfiguration({provider:'codex',model:'gpt-6.1-sol',effort:'low'},()=>{}),/recorded/,'Sol low without its recorded reason is refused');
});

test('only manifests recording import-v2 opt in',()=>{
 assert.equal(importV2({importPolicy:IMPORT_POLICY}),true);
 assert.equal(importV2({completionProfile:'streamlined-import-v2'}),false);
 assert.equal(importV2(undefined),false);
});

const practiceBlock=(classification={primarySkillId:'skill'})=>({id:'q1',type:'question',pedagogyRole:'practice',content:{prompt:'Solve 2x = 4.',answer:{short:'x = 2',worked:'2x = 4, so x = 2.'}},classification});

test('import-v2 content review never patches working space',()=>{
 const block={...practiceBlock(),content:{...practiceBlock().content,answerSpaceMm:20}};
 const corrections=[{id:'space',patches:[{targetId:'q1',field:'/content/answerSpaceMm',original:20,corrected:30}]},{id:'answer',patches:[{targetId:'q1',field:'/content/answer/short',original:'x = 2',corrected:'\\(x = 2\\)'}]}];
 const blocked=applyCorrections([structuredClone(block)],corrections,{blockedFields:REVIEW_SPACING_FIELDS});
 assert.deepEqual(blocked.applied.map(row=>row.correctionId),['answer']);
 assert.equal(blocked.rejected[0].status,'not-required','a blocked spacing patch does not hold the block');
 const legacy=applyCorrections([structuredClone(block)],corrections);
 assert.equal(legacy.applied.length,2,'runs without import-v2 keep their recorded behaviour');
});

test('the reviewer is the one rater: a passed unrated practice question goes back once, then fails',()=>{
 const dir=fs.mkdtempSync(path.join(path.resolve('.booklet-work'),'import-v2-test-'));
 try{
  const section={id:'ex1',phase:'practice',blocks:[]};
  const block=practiceBlock();section.blocks.push(block);
  assert.equal(practiceRatingBlocks({sections:[section]}).length,1,'fixture is a practice question');
  const batch={rows:[{block}],section,reviewerRates:true},state={questions:{}};
  const passed={records:[{id:'q1',outcome:'passed',mathematicsReviewed:true}]};
  recordContentResult({batch,result:passed,state,dir});
  assert.equal(state.questions.q1.outcome,'pending');
  recordContentResult({batch,result:passed,state,dir});
  assert.equal(state.questions.q1.outcome,'failed');
  const rated={...passed,corrections:[{id:'rate',patches:[{targetId:'q1',field:'/classification/reasoningScore',original:null,corrected:12},{targetId:'q1',field:'/classification/difficultyReason',original:null,corrected:'One routine step.'}]}]};
  const fresh={questions:{}},ratedBlock=practiceBlock(),ratedSection={...section,blocks:[ratedBlock]};
  recordContentResult({batch:{rows:[{block:ratedBlock}],section:ratedSection,reviewerRates:true},result:rated,state:fresh,dir});
  assert.equal(fresh.questions.q1.outcome,'passed');
  assert.equal(ratedBlock.classification.reasoningScore,12);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('content prompt asks the reviewer to rate only for import-v2 batches',()=>{
 const batch={rows:[],section:{id:'s',blocks:[]}};
 assert.match(contentPrompt({project:{title:'t',sections:[]},batch:{...batch,reviewerRates:true}}),/You are the one rater/);
 assert.match(contentPrompt({project:{title:'t',sections:[]},batch}),/Check the supplied reasoning rating/);
});

test('import-v2 authoring results need no rating; recorded runs still do',()=>{
 const result={pageNumber:1,sections:[{id:'ex1',phase:'practice',blocks:[practiceBlock()]}],inventoryMappings:[]};
 assert.throws(()=>validateSemanticResult(structuredClone(result),{stage:'author',page:1,inventory:{entries:[]}}),/reasoning rating/);
 try{validateSemanticResult(structuredClone(result),{stage:'author',page:1,inventory:{entries:[]},reviewerRates:true});}
 catch(error){assert.doesNotMatch(error.message,/reasoning rating/);}
});

test('page hash version 2 ignores the footer and answer-diagram widths; version 1 is unchanged',async()=>{
 const {renderedPageHashes}=await import('../scripts/booklet/page-review.mjs');
 const page=(n,total,rev)=>({html:'<div class="print-page"><p>Q1</p><footer class="booklet-footer"><span>x | Revision '+rev+'</span><span>Page '+n+' of '+total+'</span></footer></div>',blocks:['q1']});
 const settings=w=>({compactAnswers:{diagramWidths:{d:w}},fontSize:10});
 const v2=(p,s)=>renderedPageHashes([p],{renderer:'r',settings:s,assets:{},pageHashVersion:2})[0].hash;
 assert.equal(v2(page(1,10,5),settings(40)),v2(page(1,11,6),settings(55)),'footer text and diagram widths leave the hash');
 assert.notEqual(v2(page(1,10,5),settings(40)),v2(page(1,10,5),{...settings(40),fontSize:11}),'other settings still count');
 const v1=(p,s)=>renderedPageHashes([p],{renderer:'r',settings:s,assets:{}})[0].hash;
 assert.notEqual(v1(page(1,10,5),settings(40)),v1(page(1,11,5),settings(40)),'recorded runs keep version 1');
});

test('finish lists label collisions in unaccepted TikZ before review and remembers checked code',async()=>{
 const {diagramLabelCheck,candidateTikz}=await import('../scripts/booklet/import-finish.mjs');
 const dir=fs.mkdtempSync(path.join(path.resolve('.booklet-work'),'import-v2-labels-'));
 try{
  const project={id:'p',sections:[{id:'s',blocks:[{id:'q',type:'question',content:{diagrams:[{id:'d1',format:'tikz',code:'\draw (0,0)--(1,0);'},{id:'d2',format:'tikz',code:'\draw (0,0)--(0,1);'}]}}]}]};
  const file=path.join(dir,'candidate.json');fs.writeFileSync(file,JSON.stringify(project));
  fs.mkdirSync(path.join(dir,'lean-review'));
  assert.deepEqual(candidateTikz(project).map(r=>r.id),['d1','d2']);
  let calls=0;const check=async()=>{calls++;return {d1:{issues:['a curve runs through a label']},d2:{issues:[]}};};
  const first=await diagramLabelCheck({file,runDir:dir,check});
  assert.deepEqual(first.collisions.map(r=>r.id),['d1']);
  const again=await diagramLabelCheck({file,runDir:dir,checked:first.checked,check});
  assert.equal(calls,1,'checked code is not sent again');
  assert.deepEqual(again.collisions.map(r=>r.id),['d1'],'an unfixed collision stays listed');
  const skipped=await diagramLabelCheck({file,runDir:dir,check:async()=>{throw Error('no Studio');}});
  assert.equal(skipped.collisions.length,0);assert.match(skipped.skipped,/no Studio/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('exam hand-off tags record labels and candidate mark tokens without changing printed content',async()=>{
 const {tagExamQuestions}=await import('../scripts/booklet/import-exam-tags.mjs');
 const {contentHash}=await import('../scripts/booklet/lean-review.mjs');
 const exam={id:'e1',type:'question',title:'HSC Advanced 2019 Q12',content:{prompt:'Find the area under the curve. [3]',answer:{short:'4 [not a mark]'}}};
 const naplan={id:'n1',type:'question',content:{prompt:'NAPLAN 2015: Which fraction is largest?'}};
 const plain={id:'p1',type:'question',content:{prompt:'Simplify [x + 1].'}};
 const project={sections:[{id:'ex',title:'Chapter review',phase:'practice',blocks:[exam,naplan,plain]}]};
 const before=contentHash(exam);
 assert.equal(tagExamQuestions(project),2);
 assert.equal(exam.sourceReview.exam.title,'HSC Advanced 2019 Q12');
 assert.deepEqual(exam.sourceReview.exam.markTokens.map(t=>[t.path,t.text]),[['/content/prompt','[3]']],'answers are not scanned');
 assert.equal(exam.sourceReview.exam.sourceSection,'Chapter review');
 assert.equal(naplan.sourceReview.exam.naplan,true);assert.equal(naplan.sourceReview.exam.title,undefined,'NAPLAN is not an exam question');
 assert.equal(plain.sourceReview,undefined,'a bracketed expression is not a mark token');
 assert.equal(contentHash(exam),before,'tags are review metadata');
});

test('hand-off seeds the audit with fingerprints of checked blocks and merges with an existing record',async()=>{
 const {buildImportHandoff,writeImportHandoff}=await import('../scripts/booklet/import-handoff.mjs');
 const {contentHash}=await import('../scripts/booklet/lean-review.mjs');
 const {contentFingerprint}=await import('../pedagogy/audit-v2-plan.mjs');
 const q={id:'q1',type:'question',pedagogyRole:'practice',sourceRefs:[{pageNumber:4}],content:{prompt:'Solve 2x = 4.',answer:{short:'x = 2',worked:'x = 2'}},classification:{primarySkillId:'linear',secondarySkillIds:[],reasoningScore:12,difficulty:'Foundation',difficultyReason:'One step.',assessment:{model:'gpt-6.1-sol',assessedAt:'2026-11-11T00:00:00Z',taskHash:'t',evidence:'calls/x'}}};
 const stale={...q,id:'q2'};
 const project={id:'demo',revision:3,source:{inventory:{entries:[{id:'src-q1',targetId:'q1'}]}},sections:[{id:'ex1',phase:'practice',blocks:[q,stale]}]};
 const reviewed={questions:{q1:{outcome:'passed',hash:contentHash(q),at:'2026-11-11'},q2:{outcome:'passed',hash:'old'}}};
 const corrections=[{blockId:'q1',status:'applied',correctionId:'c1',field:'/classification/reasoningScore'},{blockId:'q1',status:'rejected',correctionId:'c2',field:'/prompt'}];
 const handoff=buildImportHandoff({project,reviewed,corrections,currentHash:contentHash,runId:'run',configuration:{model:'gpt-6.1-sol',effort:'low'}});
 assert.deepEqual(handoff.importRecord.rows.map(r=>r.blockId),['q1'],'a block whose content changed after review is not handed off');
 const row=handoff.importRecord.rows[0];
 assert.equal(row.fingerprint,contentFingerprint(q));
 assert.deepEqual(row.inventoryIds,['src-q1']);
 assert.deepEqual(row.corrections,[{correctionId:'c1',field:'/classification/reasoningScore',kind:'rating'}]);
 assert.equal(row.answersConfirmed.model,'gpt-6.1-sol');
 assert.deepEqual(handoff.auditChecks.checks.q1,{error:row.fingerprint,solve:row.fingerprint});
 const root=fs.mkdtempSync(path.join(path.resolve('.booklet-work'),'import-v2-handoff-'));
 try{
  const auditFile=path.join(root,'booklets','provenance','pedagogy-review','audit-v2','demo.json');
  fs.mkdirSync(path.dirname(auditFile),{recursive:true});
  fs.writeFileSync(auditFile,JSON.stringify({version:1,projectId:'demo',checks:{q1:{error:'audit-own',type:'x'}},types:{},runs:[]}));
  const written=writeImportHandoff(handoff,{root});
  const audit=JSON.parse(fs.readFileSync(written.auditFile,'utf8'));
  assert.equal(audit.checks.q1.error,'audit-own','the audit keeps its own rows');
  assert.equal(audit.checks.q1.solve,row.fingerprint);assert.equal(audit.checks.q1.type,'x');
  assert.ok(fs.existsSync(written.importFile));
  const textbook=buildImportHandoff({project,reviewed,corrections,currentHash:contentHash,runId:'run',configuration:{model:'gpt-6.1-sol',effort:'low'},track:'textbook'});
  assert.equal(textbook.auditChecks,null,'textbooks are never audited');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
