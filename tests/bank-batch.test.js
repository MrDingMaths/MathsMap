import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {examLabel,recordedReview,classify,originOf,planBatch} from '../pedagogy/bank-batch.mjs';
import {contentFingerprint} from '../pedagogy/audit-v2-plan.mjs';
import {REASONING_RUBRIC,reasoningTaskHash,retainSlashFractionRating,verifiedRating} from '../scripts/booklet/reasoning-ratings.mjs';
import {repairSlashFractionNotation} from '../scripts/booklet/slash-fraction-notation.mjs';

const q=(id,prompt,extra={})=>({id,type:'question',classification:{primarySkillId:'function-notation'},content:{id:id+'-root',type:'question',prompt,answer:{short:'1',worked:'$$1$$'}},...extra});
const base={skills:new Set(['function-notation']),review:{current:true},outcome:{outcome:'new'},protectedIds:new Set(),ownerOrigin:()=>null,section:{role:'mixed-practice',title:'Exercise 3A'}};
// verifiedRating needs a full assessment bound to the task hash; these tests stub the rating check by
// using blocks that fail it only where the test says so.
const run=(block,over={})=>classify({...base,project:{id:'p'},block,origin:'textbook',...over});

test('origin: masters, and practice-only chapters under import review or accepted', ()=>{
 assert.equal(originOf({library:{category:'master'}}),'master');
 assert.equal(originOf({library:{category:'import-review'},contentScope:'practice-only'}),'textbook');
 assert.equal(originOf({library:{category:'textbook'},contentScope:'practice-only'}),'textbook');
 assert.equal(originOf({library:{category:'import-review'}}),null);
 assert.equal(originOf({library:{category:'class'}}),null);
});

test('exam labels: HSC, trial and school papers, PLC; NAPLAN and the word "trial" alone stay practice', ()=>{
 assert.equal(examLabel(q('a','HSC 2015 Find the value of x.')),'HSC');
 assert.ok(examLabel(q('b','x',{source:{label:'Trial HSC exam 2019'}})));
 assert.equal(examLabel(q('c','In one trial, a coin is tossed.')),null);
 assert.equal(examLabel(q('d','x',{source:{label:'NAPLAN 2012'}})),null);
 assert.equal(examLabel(q('e','x',{title:'PLC 2021'})),'PLC');
});

test('recorded review: audit check on current content, lean row, open finding, stale content', ()=>{
 const block=q('a','Find $x$.');
 assert.deepEqual(recordedReview(block,{auditChecks:{a:{error:contentFingerprint(block)}}}),{current:true,by:'audit-v2'});
 assert.equal(recordedReview(block).reason,'no-recorded-review');
 assert.equal(recordedReview(block,{leanRows:{a:{outcome:'failed'}}}).reason,'open-finding');
 assert.equal(recordedReview(block,{leanRows:{a:{outcome:'passed',hash:'old'}}}).reason,'review-stale');
 const edited=q('a','Find $y$.');
 assert.equal(recordedReview(edited,{leanRows:{a:{outcome:'passed',acceptedVersion:{outcome:'passed',snapshot:block}}}}).reason,'review-stale');
 assert.deepEqual(recordedReview(block,{leanRows:{a:{outcome:'passed',acceptedVersion:{outcome:'passed',snapshot:block}}}}),{current:true,by:'import'});
 assert.equal(recordedReview(block,{workflowRows:{a:{outcome:'failed'}}}).reason,'open-finding');
 assert.deepEqual(recordedReview(block,{workflowRows:{a:{outcome:'passed',snapshot:block}}}),{current:true,by:'import'});
});

test('classify: Exam questions in masters are out of scope; linked questions stay linked', ()=>{
 assert.equal(run(q('a','x'),{origin:'master',section:{role:'exam'}}).action,'out-of-scope');
 assert.equal(run(q('a','HSC 2014 x'),{origin:'master'}).action,'out-of-scope');
 assert.equal(run(q('a','x',{bankRef:{id:'q-1'}})).action,'linked');
});

test('classify: an unrated or unmapped question is left out with every reason', ()=>{
 const row=run(q('a','x',{classification:{primarySkillId:'invented-skill'}}),{review:{current:false,reason:'review-stale'}});
 assert.equal(row.action,'leave-out');
 assert.deepEqual(row.reasons,['rating-not-current','no-known-skill','review-stale']);
});

const rated=block=>{block.classification={primarySkillId:'function-notation',secondarySkillIds:[],reasoningScore:20,difficulty:'Foundation',difficultyReason:'Direct substitution.'};
 block.classification.assessment={model:'gpt-6.1-sol',assessedAt:'2026-10-21T00:00:00Z',rubricVersion:REASONING_RUBRIC,taskHash:reasoningTaskHash(block),evidence:'x'};return block;};

test('slash notation repair retains a recorded review and rating only for the exact replacement', ()=>{
 const original=rated(q('a','Find $1/x$ for $x=2$.'));
 const context={auditChecks:{a:{error:contentFingerprint(original)}}};
 const repaired=repairSlashFractionNotation(original);
 assert.equal(repaired.content.prompt,'Find $\\frac{1}{x}$ for $x=2$.');
 assert.equal(recordedReview(repaired,context).current,true);
 assert.equal(retainSlashFractionRating(repaired),true);
 assert.equal(verifiedRating(repaired),true);
 repaired.content.prompt='Find $\\frac{1}{y}$ for $x=2$.';
 assert.equal(recordedReview(repaired,context).reason,'no-recorded-review');
 assert.equal(verifiedRating(repaired),false);
 assert.equal(repairSlashFractionNotation(q('rate','The speed is $10\\text{ km/h}$.')),null);
});

test('a deferred earlier duplicate cannot consume an eligible question in the same booklet', async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'bank-plan-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const dir of ['booklets/projects','booklets/question-bank','data'])fs.mkdirSync(path.join(root,dir),{recursive:true});
 fs.writeFileSync(path.join(root,'data/skills.json'),JSON.stringify([{id:'function-notation'}]));
 const deferred=q('first','Find $f(1)$.');
 const eligible=rated(q('second','Find $f(1)$.'));
 eligible.sourceReview={bankMergeReview:{fingerprint:contentFingerprint(eligible),components:[{current:true}]}};
 const project={id:'fixture-deferred-duplicate',revision:1,library:{category:'master'},sections:[{id:'s',phase:'practice',blocks:[deferred,eligible]}]};
 const [plan]=await planBatch([project],{root});
 assert.deepEqual(plan.blocks.map(block=>[block.blockId,block.action]),[['first','leave-out'],['second','publish']]);
});

test('classify: follow-ups merge first, or become a comment on a teacher-protected block', ()=>{
 const dependency={reviewed:false,previousBlockId:'p1',references:[{reference:'previous question'}]};
 assert.equal(run(rated(q('a','x')),{dependency}).action,'follow-up-merge');
 assert.equal(run(rated(q('a','x')),{dependency,protectedIds:new Set(['a'])}).action,'follow-up-comment');
 assert.equal(run(rated(q('a','x')),{dependency:{...dependency,reviewed:true}}).action,'publish');
});

test('classify: identical links; a textbook match to a master-owned question links to the master (Decision 6)', ()=>{
 assert.deepEqual(run(rated(q('a','x')),{outcome:{outcome:'exact',bankId:'q-1'}}).bankId,'q-1');
 const held={outcome:'held',sameQuestionAs:[{bankId:'q-t'},{bankId:'q-m'}]},ownerOrigin=id=>id==='q-m'?'master':'textbook';
 const row=run(rated(q('a','x')),{outcome:held,ownerOrigin});
 assert.equal(row.action,'link-master');assert.equal(row.bankId,'q-m');
 assert.equal(run(rated(q('a','x')),{outcome:held,ownerOrigin,origin:'master'}).action,'hold');
 assert.equal(run(rated(q('a','x')),{outcome:{outcome:'held',sameQuestionAs:[{bankId:'q-t'}]},ownerOrigin}).action,'hold');
});

test('classify: a textbook exam label is tagged, not excluded; Challenge sections are recorded', ()=>{
 const row=run(q('a','HSC 2015 x'),{section:{role:'challenge'}});
 assert.equal(row.examTag,'HSC');assert.equal(row.sectionRole,'challenge');
});
