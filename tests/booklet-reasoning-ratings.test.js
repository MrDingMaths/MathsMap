import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {normaliseQuestion} from '../src/lib/practice-question-model.js';
import {questionDifficulty} from '../src/lib/booklet-bank-ratings.js';
import {practiceRatingBlocks,validRawRating,verifiedRating,assessedRating,reasoningTaskHash,requireReasoningCoverage,stampPacketRatings,restorePacketRatings,reuseReasoningRating,recoverStoredRatingFile} from '../scripts/booklet/reasoning-ratings.mjs';
import {saveReasoningRatings} from '../scripts/booklet/save-reasoning-ratings.mjs';
import {revisionHash,readSyncJson} from '../scripts/booklet/bank-sync.mjs';
import {validateRatingReply,ratingBatches,rateStudio,historicalRatings,recoverRatingCalls} from '../scripts/booklet/rate-studio-questions.mjs';
import {ratingImageEvidence} from '../scripts/booklet/rating-images.mjs';
import {validateSemanticResult} from '../scripts/booklet/semantic-workflow.mjs';
import {rateBankQuestions,bankRatingCoverage,saveBankReasoningRatings} from '../scripts/booklet/rate-bank-questions.mjs';

const question=()=>({id:'q',type:'question',content:{id:'root',type:'question',prompt:'Solve $2x+3=11$.',children:[],answer:{short:'4',worked:'Subtract 3 and divide by 2.'}},classification:{primarySkillId:'linear-equations',secondarySkillIds:[]}});
const project=()=>({id:'p',revision:2,title:'Equations',settings:{questionOrder:'source'},sections:[{id:'s',phase:'practice',blocks:[question()]}]});
const metadata={model:'gpt-6.1-sol',assessedAt:'2026-10-21T01:00:00Z',evidence:'.booklet-work/rating/call/last-message.txt'};
const raw={reasoningScore:28,difficulty:'Development',difficultyReason:'Select inverse operations and apply them in reverse order.'};
const rated=block=>assessedRating(block,raw,metadata);
async function fixture(t){const base=path.resolve('.cache/reasoning-rating-tests');await fs.mkdir(base,{recursive:true});const root=await fs.mkdtemp(path.join(base,'case-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));await fs.mkdir(path.join(root,'booklets/projects'),{recursive:true});await fs.mkdir(path.join(root,'booklets/question-bank'),{recursive:true});const p=project();await fs.writeFile(path.join(root,'booklets/projects/p.json'),JSON.stringify(p));return {root,p,options:{projectRoot:path.join(root,'booklets/projects'),bankRoot:path.join(root,'booklets/question-bank')}};}

test('ratings require raw integer, individual rationale, correct band and actual task provenance',()=>{
 for(const reasoningScore of [undefined,null,'28',-1,101,2.5,NaN])assert.equal(validRawRating({...raw,reasoningScore}),false);
 for(const difficultyReason of ['', 'Score-derived from the calibrated 0–100 reasoning scale.','Author-created booklet question.'])assert.equal(validRawRating({...raw,difficultyReason}),false);
 assert.equal(validRawRating({...raw,difficulty:'Mastery'}),false);
 const q=question();assert.equal(verifiedRating(q,{...raw}),false);q.classification={...q.classification,...rated(q)};assert.equal(verifiedRating(q),true);
 assert.equal(verifiedRating(q,normaliseQuestion(q).classification),true);
 q.content.prompt='Solve $2x+3=13$.';assert.equal(verifiedRating(q),false);
});
test('rating identity ignores layout and IDs but includes every essential part and answer',()=>{
 const q=question(),copy=structuredClone(q);copy.id='other';copy.content.id='other-root';copy.content.answerSpaceMm=50;copy.content.layout='grid';assert.equal(reasoningTaskHash(q),reasoningTaskHash(copy));
 copy.content.children=[{id:'part',type:'part',prompt:'Explain why this method works.'}];assert.notEqual(reasoningTaskHash(q),reasoningTaskHash(copy));
 const answer=structuredClone(q);answer.content.answer.worked='A different method.';assert.notEqual(reasoningTaskHash(q),reasoningTaskHash(answer));
});
test('whole-question renumbering reuses a genuine rating without inventing a new assessment',()=>{
 const source=question();source.content.label='1';source.classification={...source.classification,...rated(source)};
 const target=structuredClone(source);target.id='copy';target.content.label='17';const rating=reuseReasoningRating(source,target);
 assert.equal(verifiedRating(target,rating),true);assert.equal(rating.assessment.assessedAt,metadata.assessedAt);assert.equal(rating.assessment.originalTaskHash,source.classification.assessment.taskHash);
 target.content.children=[{id:'new',type:'part',prompt:'Prove this for all integers.'}];assert.equal(reuseReasoningRating(source,target),null);
});
test('scope excludes teaching, worked and guided questions, and theory-review',()=>{
 const p=project();p.sections[0].blocks.push({...question(),id:'guided',pedagogyRole:'guided-practice'},{...question(),id:'worked',type:'worked-example'},{...question(),id:'review',libraryRole:'theory-review'});p.sections.push({phase:'teaching',blocks:[question()]});assert.deepEqual(practiceRatingBlocks(p).map(r=>r.block.id),['q']);
 assert.throws(()=>requireReasoningCoverage(p),/Incomplete LLM/);
 const q=p.sections[0].blocks[0];q.classification={...q.classification,...rated(q)};assert.equal(requireReasoningCoverage(p).verified,1);
});
test('host stamps real model output and refuses local replay without a verified assessment',()=>{
 const p=project(),q=p.sections[0].blocks[0];assert.throws(()=>stampPacketRatings(p,{model:'gpt-6.1-sol',endedAt:metadata.assessedAt},'call'),/Missing or invalid/);
 q.classification={...q.classification,...raw};assert.throws(()=>stampPacketRatings(p,{externalModelCalls:0},'call'),/provenance/);
 stampPacketRatings(p,{model:'gpt-6.1-sol',endedAt:metadata.assessedAt},'call');assert.equal(verifiedRating(q),true);assert.doesNotThrow(()=>stampPacketRatings(p,{externalModelCalls:0},'assembly'));
});
test('raw import validation blocks fallback ratings before normalisation',()=>{
 const packet={...project(),pageNumber:1,inventoryMappings:[]};
 assert.throws(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory:{entries:[]}}),/individual reasoning rating/);
 const q=packet.sections[0].blocks[0];q.classification=normaliseQuestion(q).classification;
 assert.throws(()=>validateSemanticResult(packet,{stage:'author',page:1,inventory:{entries:[]}}),/individual reasoning rating/);
});
test('historical recovery uses actual model output and leaves changed tasks stale after local repair',async t=>{
 const {root}=await fixture(t),out=path.join(root,'semantic-packets/page-001.author.1');await fs.mkdir(out,{recursive:true});
 const packet=project();packet.sections[0].blocks[0].classification={...raw};
 await fs.writeFile(path.join(out,'generation.json'),JSON.stringify(packet));
 const event={stage:'author',page:1,attempt:1,event:'finished',ok:true,metrics:{model:metadata.model,endedAt:metadata.assessedAt}};
 await fs.writeFile(path.join(root,'semantic-packets/attempt-events.jsonl'),JSON.stringify(event)+'\n');
 assert.equal(historicalRatings(root).size,1);
 restorePacketRatings(packet,{runDir:root,out});assert.equal(verifiedRating(packet.sections[0].blocks[0]),true);
 packet.sections[0].blocks[0].content.prompt='Prove the general result.';assert.equal(verifiedRating(packet.sections[0].blocks[0]),false);
});
test('metadata transaction preserves content and rejects stale project, task and bank revisions',async t=>{
 const {p,options}=await fixture(t),q=p.sections[0].blocks[0],rating={...rated(q),primarySkillId:'must-not-replace',secondarySkillIds:['must-not-add']},update={blockId:q.id,expectedTaskHash:reasoningTaskHash(q),rating};
 await assert.rejects(saveReasoningRatings({projectId:p.id,expectedRevision:1,updates:[update]},options),/Project changed/);
 await assert.rejects(saveReasoningRatings({projectId:p.id,expectedRevision:2,updates:[{...update,expectedTaskHash:'stale'}]},options),/Question changed/);
 const next=await saveReasoningRatings({projectId:p.id,expectedRevision:2,updates:[update]},options);assert.equal(next.revision,3);assert.deepEqual(next.sections[0].blocks[0].content,q.content);assert.deepEqual(next.settings,p.settings);assert.equal(verifiedRating(next.sections[0].blocks[0]),true);assert.equal(next.sections[0].blocks[0].classification.primarySkillId,q.classification.primarySkillId);assert.deepEqual(next.sections[0].blocks[0].classification.secondarySkillIds,[]);
});
test('bank metadata updates transactionally, preserves pins and refreshes display provenance',async t=>{
 const {root,p,options}=await fixture(t),q=p.sections[0].blocks[0];q.bankRef={id:'bank-q',revision:'pinned'};const bank=normaliseQuestion({...q,id:'bank-q'});await fs.writeFile(path.join(options.bankRoot,'bank-q.json'),JSON.stringify(bank));await fs.writeFile(path.join(options.projectRoot,'p.json'),JSON.stringify(p));
 const update={blockId:q.id,expectedTaskHash:reasoningTaskHash(q),expectedBankRevision:'stale',rating:rated(q)};
 await assert.rejects(saveReasoningRatings({projectId:'p',expectedRevision:2,updates:[update]},options),/Bank changed/);
 update.expectedBankRevision=revisionHash(bank);const saved=await saveReasoningRatings({projectId:'p',expectedRevision:2,updates:[update]},options),block=saved.sections[0].blocks[0],stored=JSON.parse(await fs.readFile(path.join(options.bankRoot,'bank-q.json')));
 assert.deepEqual(block.bankRef,q.bankRef);assert.deepEqual(stored.content,bank.content);assert.equal(verifiedRating(stored),true);assert.equal(questionDifficulty(block).assessment.model,metadata.model);assert.equal(block.flow.bankDifficulty.assessment.taskHash,reasoningTaskHash(q));
 const bankFile=path.join(options.bankRoot,'bank-q.json'),bankBytes=await fs.readFile(bankFile,'utf8'),copy=project();copy.id='p2';copy.sections[0].blocks[0].bankRef=structuredClone(q.bankRef);await fs.writeFile(path.join(options.projectRoot,'p2.json'),JSON.stringify(copy));
 const linked=await saveReasoningRatings({projectId:'p2',expectedRevision:2,updates:[{blockId:'q',expectedTaskHash:reasoningTaskHash(q),expectedBankRevision:revisionHash(stored),rating:stored.classification}]},options);
 assert.equal(await fs.readFile(bankFile,'utf8'),bankBytes,'copying a current bank rating does not create another bank revision');assert.equal(linked.sections[0].blocks[0].flow.bankDifficulty.revision,revisionHash(stored));
});
test('pinned local amendments do not overwrite a different canonical bank task',async t=>{
 const {p,options}=await fixture(t),q=p.sections[0].blocks[0];q.bankRef={id:'bank-q',revision:'pinned'};const bank=normaliseQuestion({...q,id:'bank-q'});bank.content.prompt='Solve $x=2$.';await fs.writeFile(path.join(options.bankRoot,'bank-q.json'),JSON.stringify(bank));await fs.writeFile(path.join(options.projectRoot,'p.json'),JSON.stringify(p));
 const saved=await saveReasoningRatings({projectId:'p',expectedRevision:2,updates:[{blockId:'q',expectedTaskHash:reasoningTaskHash(q),rating:rated(q)}]},options);assert.equal(questionDifficulty(saved.sections[0].blocks[0]).reasoningScore,28);assert.deepEqual(JSON.parse(await fs.readFile(path.join(options.bankRoot,'bank-q.json'))),bank);
});
test('reply validation catches omitted, duplicated and mismatched tasks',()=>{
 const rows=ratingBatches([{block:question(),section:{title:'Equations'}}])[0],reply={ratings:[{id:'q',taskHash:rows[0].input.taskHash,...raw}]};assert.equal(validateRatingReply(reply,rows).length,1);
 assert.throws(()=>validateRatingReply({ratings:[]},rows),/exactly one/);assert.throws(()=>validateRatingReply({ratings:[{...reply.ratings[0],taskHash:'old'}]},rows),/identity/);
});
test('backfill saves a real runner result once and reuses it on resume',async t=>{
 const {root}=await fixture(t);let calls=0;const runner=async ({prompt})=>{calls++;const payload=JSON.parse(prompt.slice(prompt.indexOf('{"questions":')));return {result:{ratings:payload.questions.map(q=>({id:q.id,...raw}))},metrics:{model:metadata.model,endedAt:metadata.assessedAt}};};
 const result=await rateStudio({root,apply:true,runner,onEvent:()=>{}});assert.equal(result.assessed,1);assert.equal(result.coverage.missing,0);const resumed=await rateStudio({root,apply:true,runner,onEvent:()=>{}});assert.equal(resumed.coverage.missing,0);assert.equal(calls,1);
});
test('original image pixels are attached and mapped to their owning question',async t=>{
 const {root}=await fixture(t),file=path.join(root,'public/booklet-assets/working.png'),bytes=Buffer.from('original image fixture');await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);
 const q=question();q.content.questionDiagrams=[{id:'working',format:'image',src:'/booklet-assets/working.png',alt:'Student working'}];const rows=ratingBatches([{block:q,section:{title:'Equations'}}])[0],before=JSON.stringify(q);
 const evidence=ratingImageEvidence(rows,{root,out:path.join(root,'call')});assert.deepEqual(evidence.images,[file]);assert.deepEqual(evidence.evidence[0].questionIds,['q']);assert.equal(JSON.stringify(q),before);
 q.content.questionDiagrams[0].src='data:image/png;base64,'+bytes.toString('base64');const inline=ratingImageEvidence(ratingBatches([{block:q,section:{}}])[0],{root,out:path.join(root,'inline-call')});assert.deepEqual(await fs.readFile(inline.images[0]),bytes);
});
test('valid individual assessments survive a failed batch while mismatched hashes remain blocked',async t=>{
 const {root,p}=await fixture(t),other=question();other.id='other';other.content.id='other-root';other.content.prompt='Solve $3x=12$.';p.sections[0].blocks.push(other);
 const rows=ratingBatches(practiceRatingBlocks(p))[0],out=path.join(root,'.booklet-work/reasoning-ratings/calls/p/failed-envelope');await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'input.json'),JSON.stringify(rows.map(r=>r.input)));await fs.writeFile(path.join(out,'metrics.json'),JSON.stringify({model:metadata.model,endedAt:metadata.assessedAt}));await fs.writeFile(path.join(out,'last-message.txt'),JSON.stringify({ratings:rows.map((r,i)=>({id:r.block.id,taskHash:i?'malformed':r.input.taskHash,...raw}))}));
 const cache=new Map();assert.equal(recoverRatingCalls([{project:p}],cache,{root}),1);assert.equal(verifiedRating(p.sections[0].blocks[0],cache.get(rows[0].input.taskHash)),true);assert.equal(cache.has(rows[1].input.taskHash),false);
});
test('bank recovery resolves caller aliases using the original input record',async t=>{
 const {root}=await fixture(t),block=question(),input=ratingBatches([{block,section:{}}])[0][0].input,out=path.join(root,'bank-call');await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'input.json'),JSON.stringify({questions:[{...input,sourceId:'q',id:'Q1'}]}));await fs.writeFile(path.join(out,'metrics.json'),JSON.stringify({model:metadata.model,endedAt:metadata.assessedAt}));await fs.writeFile(path.join(out,'last-message.txt'),JSON.stringify({ratings:[{id:'Q1',...raw}]}));
 const cache=new Map();assert.equal(recoverStoredRatingFile(out,new Map([['q',block]]),cache,{root,cacheDir:path.join(root,'cache')}),1);assert.equal(verifiedRating(block,cache.get(input.taskHash)),true);
});
test('transient Windows file handovers retry reads without retrying permission or JSON failures',async()=>{
 let reads=0;const result=await readSyncJson('unused',null,{readFile:async()=>{if(reads++<2)throw Object.assign(new Error('handover'),{code:'UNKNOWN'});return '{"value":1}';},delay:async()=>{}});assert.deepEqual(result,{value:1});assert.equal(reads,3);
 reads=0;await assert.rejects(readSyncJson('unused',null,{readFile:async()=>{reads++;throw Object.assign(new Error('denied'),{code:'EACCES'});},delay:async()=>{}}),/denied/);assert.equal(reads,1);
 await assert.rejects(readSyncJson('unused',null,{readFile:async()=>'{',delay:async()=>{}}),SyntaxError);
});
test('unplaced bank practice questions are rated while teaching reviews stay excluded',async t=>{
 const {root,options}=await fixture(t),bank=normaliseQuestion({...question(),id:'unplaced',status:'approved'}),theory={...bank,id:'theory',libraryRole:'theory-review'};
 await fs.writeFile(path.join(options.bankRoot,'unplaced.json'),JSON.stringify(bank));await fs.writeFile(path.join(options.bankRoot,'theory.json'),JSON.stringify(theory));
 const runner=async({prompt})=>{const {questions}=JSON.parse(prompt.slice(prompt.indexOf('{"questions":')));return {result:{ratings:questions.map(q=>({id:q.id,taskHash:q.taskHash,...raw}))},metrics:{model:metadata.model,endedAt:metadata.assessedAt}};};
 const report=await rateBankQuestions({root,apply:true,runner,onEvent:()=>{}});assert.equal(report.assessed,1);assert.deepEqual(report.coverage,{total:1,verified:1,missing:[]});assert.equal(bankRatingCoverage(root).missing.length,0);
 const saved=JSON.parse(await fs.readFile(path.join(options.bankRoot,'unplaced.json')));assert.deepEqual(saved.content,bank.content);assert.equal(saved.classification.primarySkillId,bank.classification.primarySkillId);assert.deepEqual(JSON.parse(await fs.readFile(path.join(options.bankRoot,'theory.json'))),theory);
 await assert.rejects(saveBankReasoningRatings([{bankId:bank.id,expectedRevision:revisionHash(bank),rating:rated(bank)}],{root}),/changed during assessment/);
});
test('a concurrent edit to rating fields is held instead of overwritten',async t=>{
 const {root,options}=await fixture(t);const file=path.join(options.projectRoot,'p.json');
 const runner=async({prompt})=>{const {questions}=JSON.parse(prompt.slice(prompt.indexOf('{"questions":'))),current=JSON.parse(await fs.readFile(file));current.revision++;current.sections[0].blocks[0].classification.difficultyReason='Concurrent teacher edit';await fs.writeFile(file,JSON.stringify(current));return {result:{ratings:questions.map(q=>({id:q.id,taskHash:q.taskHash,...raw}))},metrics:{model:metadata.model,endedAt:metadata.assessedAt}};};
 const report=await rateStudio({root,apply:true,runner,onEvent:()=>{}});assert.equal(report.assessed,0);assert.equal(report.coverage.missing,1);assert.match(report.blocked[0].reason,/Rating changed/);assert.equal(JSON.parse(await fs.readFile(file)).sections[0].blocks[0].classification.difficultyReason,'Concurrent teacher edit');
});
test('queued work skips a question independently assessed by another session',async t=>{
 const {root,options}=await fixture(t),other=project();other.id='p2';other.sections[0].blocks[0].content.prompt='Solve $3x=12$.';const file=path.join(options.projectRoot,'p2.json');await fs.writeFile(file,JSON.stringify(other));let calls=0;
 const runner=async({prompt})=>{calls++;const {questions}=JSON.parse(prompt.slice(prompt.indexOf('{"questions":'))),block=other.sections[0].blocks[0];block.classification={...block.classification,...rated(block)};other.revision++;await fs.writeFile(file,JSON.stringify(other));return {result:{ratings:questions.map(q=>({id:q.id,taskHash:q.taskHash,...raw}))},metrics:{model:metadata.model,endedAt:metadata.assessedAt}};};
 const report=await rateStudio({root,apply:true,concurrency:1,runner,onEvent:()=>{}});assert.equal(calls,1);assert.equal(report.coverage.total,2);assert.equal(report.coverage.missing,0);
});
