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

test('a dependency between parts of one question is not required and does not hold the block',()=>{
 const block={id:'q9',type:'question',content:{id:'q9-root',type:'question',children:[{id:'q9-a',type:'part',label:'a',prompt:'x'},{id:'q9-b',type:'part',label:'b',prompt:'Hence y'}]}};
 const within=applyCorrections([structuredClone(block)],[{id:'dep',patches:[{targetId:'q9-b',field:'/flow/dependsOn',original:null,corrected:['q9-a']}]}]);
 assert.equal(within.applied.length,0);assert.equal(within.rejected[0].status,'not-required');
 const across=applyCorrections([structuredClone(block)],[{id:'dep',patches:[{targetId:'q9-b',field:'/flow/dependsOn',original:null,corrected:['q1']}]}]);
 assert.equal(across.rejected[0].status,'rejected','a dependency on another question still needs a valid field');
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

// Pilot fixes (11 November 2026, textbook-track pilot).
import {normalizePracticeInventory,validatePracticeInventory,EMBEDDED_RETENTION_REASON,RUNNING_HEADER_REASON,TOPIC_HEADING_REASON} from '../scripts/booklet/practice-only-scope.mjs';
import {deriveContinuations,mergeContinuations,assignmentLimits,TEXTBOOK_ASSIGNMENT_DEFAULTS} from '../scripts/booklet/import-v2-authoring.mjs';
import {createAssignmentPlan,assignmentPayload} from '../scripts/booklet/author-assignments.mjs';

test('practice-only inventory normalises recognisable exclusion wording and checks embedded conflicts at acceptance',()=>{
 const inventory={pageNumber:28,entries:[
  {id:'q11',kind:'question',description:'Prove that 28 is perfect.'},
  {id:'q11-definition',kind:'teaching',parentId:'q11',embeddedInQuestion:'q11',exclusionReason:'Embedded definition retained once in question 11; not a separate selectable item.'},
  {id:'header',kind:'cover',exclusionReason:'Running publication header and page number; retain as provenance.'},
  {id:'fractions-heading',kind:'teaching',description:'Fractions',presentation:{headingRole:'main topic band'}}]};
 const normal=normalizePracticeInventory(inventory),by=id=>normal.entries.find(e=>e.id===id);
 assert.equal(by('q11-definition').exclusionReason,EMBEDDED_RETENTION_REASON);
 assert.equal(by('header').exclusionReason,RUNNING_HEADER_REASON);
 assert.equal(by('fractions-heading').exclusionReason,TOPIC_HEADING_REASON);
 assert.doesNotThrow(()=>validatePracticeInventory(inventory));
 // A heading that reads as an instruction, or carries no heading marker, is still a finding.
 assert.throws(()=>validatePracticeInventory({entries:[{id:'h',kind:'teaching',description:'Find the value',presentation:{headingRole:'band'}}]}),/exclude standalone/);
 assert.throws(()=>validatePracticeInventory({entries:[{id:'h',kind:'teaching',description:'Fractions'}]}),/exclude standalone/);
 // A cover entry recording the source identity is book furniture too (Mastering Adv 11 Ch 4 p2).
 assert.equal(normalizePracticeInventory({entries:[{id:'c',kind:'cover',exclusionReason:'Source identity and heading metadata; not a selectable question.'}]}).entries[0].exclusionReason,RUNNING_HEADER_REASON);
 // A camelCase marker such as role "categoryHeading" counts (Mastering Adv 11 Ch 7 p25).
 assert.equal(normalizePracticeInventory({entries:[{id:'f',kind:'teaching',description:'Fundamentals',presentation:{role:'categoryHeading'}}]}).entries[0].exclusionReason,TOPIC_HEADING_REASON);
 // A printed category band filed inside the first question is still book furniture (Ch 6 p18).
 const band=normalizePracticeInventory({entries:[{id:'p1',kind:'question',description:'Problem 1'},{id:'h',kind:'teaching',description:'Challenge Problems',parentId:'p1',embeddedInQuestion:'p1',presentation:{embeddedInQuestion:'p1',headingType:'band'}}]}).entries[1];
 assert.equal(band.exclusionReason,TOPIC_HEADING_REASON);assert.equal(band.embeddedInQuestion,undefined);assert.equal(band.parentId,undefined);
 // An embedded instruction is not a category label and stays embedded.
 assert.equal(normalizePracticeInventory({entries:[{id:'p1',kind:'question'},{id:'i',kind:'teaching',description:'Use the diagram.',embeddedInQuestion:'p1'}]}).entries[1].embeddedInQuestion,'p1');
 // Printed exercise headings carry a digit, so they need their own rule (Mastering Adv 11 Ch 5).
 for(const [description,presentation] of [['Exercise 5C\nQuadrants and related angles',{role:'exercise-heading'}],['Exercise 5D — Trigonometric identities',{role:'exerciseHeading'}],['Exercise 5F\nSine rule and the area formula',{headingKind:'main topic band'}]]){
  const entry={id:'h',kind:'teaching',description,presentation};
  assert.match(normalizePracticeInventory({entries:[entry]}).entries[0].exclusionReason,/Printed exercise boundary/);
  assert.doesNotThrow(()=>validatePracticeInventory({entries:[entry]}));
 }
 assert.throws(()=>validatePracticeInventory({entries:[{id:'h',kind:'teaching',description:'Exercise 5C: find x when 2x = 5',presentation:{role:'exercise-heading'}}]}),/exclude standalone/);
 assert.throws(()=>validatePracticeInventory({entries:[{id:'h',kind:'teaching',description:'Exercise 5C Quadrants'}]}),/exclude standalone/);
 // An embedded item excluded for an unrelated reason fails at inventory, not first at authoring.
 assert.throws(()=>validatePracticeInventory({entries:[{id:'q',kind:'question'},{id:'d',kind:'teaching',embeddedInQuestion:'q',exclusionReason:'Omit all supplied working'}]}),/Conflicting embedded/);
});

test('page-break continuations are derived from inventory flags; declared pairs win',()=>{
 const page=(pageNumber,entries)=>({pageNumber,entries});
 const inventories=[
  page(15,[{id:'p15-q18',kind:'question'},{id:'p15-q19',kind:'question',continuesOnNextPage:true}]),
  page(16,[{id:'p16-q19-cont',kind:'question',continuesFromPreviousPage:true},{id:'p16-q20',kind:'question'}]),
  page(17,[{id:'p17-q1',kind:'question'}]),
  page(18,[{id:'p18-cont',kind:'question',continuesFromPreviousPage:true}]),
  page(19,[{id:'p19-q9',kind:'question',continuesOnNextPage:true}])];
 const {continuations,warnings}=deriveContinuations(inventories);
 assert.deepEqual(continuations.map(c=>[c.from,c.to,c.entryIds]),[[15,16,['p15-q19','p16-q19-cont']],[17,18,['p17-q1','p18-cont']]]);
 assert.equal(warnings.length,1);assert.match(warnings[0],/Page 19 continues onto page 20/);
 // Only the first page flags it; the next page's first question is printed "2 (continued)" (Ch 7 p29-30).
 const oneSided=deriveContinuations([page(29,[{id:'p29-q2',kind:'question',sourceLabel:'Question 2',continuesOnNextPage:true}]),page(30,[{id:'p30-q2',kind:'question',sourceLabel:'2 (continued)'},{id:'p30-q3',kind:'question',sourceLabel:'Question 3'}])]);
 assert.deepEqual(oneSided.continuations.map(c=>c.entryIds),[['p29-q2','p30-q2']]);
 // A different number is not paired.
 assert.equal(deriveContinuations([page(29,[{id:'a',kind:'question',sourceLabel:'Question 2',continuesOnNextPage:true}]),page(30,[{id:'b',kind:'question',sourceLabel:'5 (continued)'}])]).continuations.length,0);
 const declared=[{from:15,to:16,entryIds:['p15-q19','p16-x']}];
 assert.deepEqual(mergeContinuations(declared,continuations).map(c=>c.from+'-'+c.to),['15-16','17-18']);
 assert.equal(mergeContinuations(declared,continuations)[0].entryIds[1],'p16-x');
});

test('v2 textbook assignments are larger; reviewer-rated prompts carry no rating request',()=>{
 const v2={importPolicy:IMPORT_POLICY},textbook={contentScope:'practice-only'};
 assert.deepEqual(assignmentLimits(v2,textbook),TEXTBOOK_ASSIGNMENT_DEFAULTS);
 assert.deepEqual(assignmentLimits({},textbook),{});
 assert.equal(assignmentLimits(v2,{...textbook,assignmentLimits:{maxQuestions:3}}).maxQuestions,3);
 const inventory={pageNumber:5,entries:[{id:'q1',kind:'question'},{id:'q2',kind:'question'}]};
 const plan=createAssignmentPlan([inventory]);
 const sections=[{name:'contract',text:'CONTRACT'},{name:'reasoning-rating',text:'Do not rate difficulty.'},{name:'classification',text:'CLASSIFY'},{name:'supplement',text:'NOTE'}];
 const task=reviewerRates=>({page:5,inventory,packetRoot:path.join('run','semantic-packets'),promptSections:sections,images:[],evidence:[],contextPages:[],teacherPages:[],reviewerRates});
 const rated=assignmentPayload(plan.assignments[0],[task(true)]),legacy=assignmentPayload(plan.assignments[0],[task(false)]);
 assert.match(rated.prompt,/Do not rate difficulty/);assert.doesNotMatch(legacy.prompt,/Do not rate difficulty/);
 assert.ok(rated.prompt.indexOf('CONTRACT')<rated.prompt.indexOf('Author only the assigned')&&rated.prompt.indexOf('Author only the assigned')<rated.prompt.indexOf('CLASSIFY'));
 assert.deepEqual(Object.keys(rated.context.guidance[0]).sort(),['id','name','page']);
 assert.ok('path' in legacy.context.guidance[0]);
 assert.match(rated.prompt,/Empty response cells in a source table or grid stay empty/);assert.doesNotMatch(legacy.prompt,/Empty response cells in a source table/);
});

test('v2 content reviewers change source wording only for correctness',()=>{
 const batch={rows:[],section:{id:'s',blocks:[]}};
 assert.match(contentPrompt({project:{title:'t',sections:[]},batch:{...batch,reviewerRates:true}}),/Never reword a correct, answerable task for readability/);
 assert.doesNotMatch(contentPrompt({project:{title:'t',sections:[]},batch}),/Never reword a correct, answerable task/);
});

test('canonical exclusion wording is idempotent when the reason is also nested in presentation',()=>{
 const inventory={entries:[{id:'header',kind:'footer',exclusionReason:'Running header; page number.',presentation:{exclusionReason:'Running header; page number.'}}]};
 const once=normalizePracticeInventory(inventory);
 assert.equal(once.entries[0].presentation.exclusionReason,RUNNING_HEADER_REASON);
 assert.doesNotThrow(()=>normalizePracticeInventory(once));
});

import {braceRowBrackets} from '../scripts/booklet/house-authoring.mjs';
import {renderMath} from '../src/lib/render-math.js';
test('aligned rows starting with a square bracket are braced so they render; spacing arguments are kept',()=>{
 const worked='$$\\begin{aligned}[(14-8)\\div2+4]\\times2&=[6\\div2+4]\\times2\\\\[(14-8)\\div2+4]\\times2&=14\\end{aligned}$$';
 const fixed=braceRowBrackets(worked);
 assert.match(fixed,/\\\\\{\[\}\(14-8\)/);
 assert.equal(braceRowBrackets('a\\\\[4pt]b'),'a\\\\[4pt]b');
 assert.deepEqual(braceRowBrackets({x:[worked]}),{x:[fixed]});
 assert.ok(renderMath(worked).includes('katex-error'));assert.ok(!renderMath(fixed).includes('katex-error'));
});

import {mergeAssignmentPackets} from '../scripts/booklet/author-assignments.mjs';
test('a mapping to another assignment entry with no authored content is dropped and recorded',()=>{
 const inventory={pageNumber:27,entries:[{id:'cont',kind:'question'},{id:'q1',kind:'question'}]};
 const block=id=>({id:id+'-block',type:'question',content:{id:id+'-root'}});
 const fragment=(ids,blocks,mappings)=>({assignment:{inventoryIds:ids,entries:ids.map(id=>({id,pageNumber:27,kind:'question'}))},packet:{pageNumber:27,sections:[{id:'s-'+ids[0],blocks}],inventoryMappings:mappings}});
 const a=fragment(['cont'],[block('cont')],[{inventoryId:'cont',targetId:'cont-root'}]);
 const b=fragment(['q1'],[block('q1')],[{inventoryId:'q1',targetId:'q1-root'},{inventoryId:'cont',targetId:'cont-root'}]);
 const merged=mergeAssignmentPackets(inventory,[a,b]);
 assert.equal(merged.inventoryMappings.filter(m=>m.inventoryId==='cont').length,1);
 assert.equal(merged.findings.filter(f=>f.kind==='dropped-foreign-mapping').length,1);
 const authored=fragment(['q1'],[block('q1'),block('cont')],[{inventoryId:'q1',targetId:'q1-root'},{inventoryId:'cont',targetId:'cont-root'}]);
 assert.throws(()=>mergeAssignmentPackets(inventory,[a,authored]),/Out-of-assignment/);
});

import {localRepairHint,LOCAL_REPAIR_ROUTE} from '../scripts/booklet/author-assignments.mjs';
test('a failed assignment names the local patch repair route with a ready request',()=>{
 const hint=localRepairHint({runDir:path.join('work','run-1'),assignment:{id:'assignment-abc',pages:[17]},attempt:3,error:'Author assignment text repair required'});
 assert.deepEqual(hint.request,{page:17,fromAttempt:3,assignmentId:'assignment-abc',targets:[{targetId:'BLOCK_OR_NODE_ID',fields:['/FIELD']}]});
 assert.match(hint.summary,/local-repair-hint\.json/);
 assert.ok(hint.steps.some(step=>step.includes('attempt-context --run-id run-1'))&&hint.steps.some(step=>step.includes('repair-attempt --run-id run-1')&&step.includes('--attempt 4')));
 assert.match(LOCAL_REPAIR_ROUTE,/attempt-context[\s\S]*repair-attempt/);
});

import os from 'node:os';
import {unrepairedVisualFindings} from '../scripts/booklet/import-finish.mjs';
import {blockContentStamps} from '../scripts/booklet/lean-visual-evidence.mjs';
test('finish prints another v2 export only after every outstanding visual finding was repaired',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'finish-budget-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const dir=path.join(root,'lean-review'),exportDir=path.join(root,'exports','1');fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(exportDir,{recursive:true});
 const project={settings:{},sections:[{id:'s',blocks:[{id:'a',prompt:'A'},{id:'b',prompt:'B'}]}]};
 fs.writeFileSync(path.join(exportDir,'report.json'),JSON.stringify({report:{p:{student:{}}}}));
 fs.writeFileSync(path.join(exportDir,'visual-plan.json'),JSON.stringify({student:{pending:[{page:1,hash:'h1',blocks:['a']},{page:2,hash:'h2',blocks:['b']}]}}));
 fs.writeFileSync(path.join(dir,'reviewed.json'),JSON.stringify({questions:{},pages:{'student:h1':{outcome:'needs-change',finding:'gap',blocks:['a']},'student:h2':{outcome:'accepted',blocks:['b']}}}));
 const state={exports:[{dir:exportDir,blockStamps:blockContentStamps(project)}]};
 assert.deepEqual(unrepairedVisualFindings({state,projectId:'p',stamps:blockContentStamps(project),dir}).map(r=>r.page),[1]);
 const repaired={...project,sections:[{id:'s',blocks:[{id:'a',prompt:'A, repaired'},{id:'b',prompt:'B'}]}]};
 assert.deepEqual(unrepairedVisualFindings({state,projectId:'p',stamps:blockContentStamps(repaired),dir}),[]);
 assert.deepEqual(unrepairedVisualFindings({state:{exports:[{dir:exportDir}]},projectId:'p',stamps:blockContentStamps(project),dir}),[],'exports recorded before v2 stamps are not gated');
});
