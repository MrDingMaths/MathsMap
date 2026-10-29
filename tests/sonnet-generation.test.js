import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {NEW_CONTENT_MODEL,validateNewTeachingCandidate} from '../pedagogy/new-content.mjs';
import {assertExactSonnetVerification,sonnetArguments,parseSonnetDraft,routineBackfillPrompt,routineBackfillBatchPrompt,generateSonnetDraft,validateRoutineBackfillDraft,groupRoutineBackfillDraft,assertIndependentBackfillReview,draftHash} from '../pedagogy/sonnet-generation.mjs';
import {assessedRating} from '../scripts/booklet/reasoning-ratings.mjs';
const verification={passed:true,requestedModel:NEW_CONTENT_MODEL,models:[NEW_CONTENT_MODEL]};
const item={id:'test-1',archetype:'known',content:{id:'test-root',type:'question',prompt:'Calculate $2+3$.',answer:{short:'$5$',worked:'$2+3=5$'}}};
const result={items:[item],instructionalChange:false};
const envelope=(changes={})=>JSON.stringify({is_error:false,modelUsage:{[NEW_CONTENT_MODEL]:{inputTokens:10,outputTokens:20}},result:JSON.stringify(result),permission_denials:[],usage:{input_tokens:10},...changes});

test('exact-model envelope and verification reject fallback, failed calls and tools',()=>{
 assertExactSonnetVerification(verification);
 assert.throws(()=>assertExactSonnetVerification({...verification,models:['claude-sonnet-5']}),/successful exact/);
 assert.throws(()=>parseSonnetDraft(envelope({modelUsage:{'claude-sonnet-5':{}}})),/Exact Sonnet/);
 assert.throws(()=>parseSonnetDraft(envelope({permission_denials:[{tool:'Read'}]})),/tool permission/);
 assert.throws(()=>parseSonnetDraft(envelope({is_error:true})),/Exact Sonnet/);
 assert.deepEqual(parseSonnetDraft(envelope()).result,result);
 const args=sonnetArguments();assert.equal(args[args.indexOf('--tools')+1],'');assert.equal(args[args.indexOf('--model')+1],NEW_CONTENT_MODEL);
 assert.equal(args.includes('--safe-mode'),true);assert.equal(args.includes('--strict-mcp-config'),true);assert.equal(args.some(a=>/bypass|skip-permission/i.test(a)),false);
});
test('routine draft requires existing teaching and cannot introduce instructional content',()=>{
 const request=routineBackfillPrompt({topic:'t',archetype:'known',count:1,styleExamples:[item],taughtEvidence:[{id:'ex',method:'Already taught addition.'}],targetScores:[20],idPrefix:'test'});
 assert.match(request.prompt,/independent reviewer/);assert.match(request.prompt,/Do not add a new archetype/);
 assert.throws(()=>routineBackfillPrompt({archetype:'known',count:1,styleExamples:[item]}),/taught-method/);
 assert.deepEqual(validateRoutineBackfillDraft(request,result),[item]);
 assert.throws(()=>validateRoutineBackfillDraft(request,{...result,instructionalChange:true}),/instructional boundary/);
 assert.throws(()=>validateRoutineBackfillDraft(request,{...result,items:[{...item,archetype:'new'}]}),/Invalid routine/);
 assert.throws(()=>validateRoutineBackfillDraft(request,{...result,items:[{...item,pedagogyRole:'worked-example'}]}),/Instructional additions/);
});
test('generation uses canonical lease and neutral cwd, preserves results and never writes live content',async()=>{
 const workDir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-sonnet-test-'));let leased=false,called=0;
 const request={model:NEW_CONTENT_MODEL,kind:'backfill',prompt:'Draft known routine practice only.'};
 const record=await generateSonnetDraft({request,verification,runDir:'canonical',workDir,lease:async(run,details,action)=>{assert.equal(run,'canonical');assert.equal(details.model,NEW_CONTENT_MODEL);leased=true;try{return await action();}finally{leased=false;}},executor:async options=>{called++;assert.equal(leased,true);assert.notEqual(options.cwd,path.resolve('.'));assert.equal(options.args[options.args.indexOf('--tools')+1],'');return {code:0,stdout:envelope()};}});
 assert.equal(called,1);assert.equal(record.status,'candidate-only-awaiting-independent-review');assert.equal(record.metrics.externalModelCalls,1);assert.equal(fs.existsSync(path.join(workDir,'generation-metrics.json')),true);
 await assert.rejects(generateSonnetDraft({request,verification,runDir:'canonical',workDir}),/already has a result/);
 await assert.rejects(generateSonnetDraft({request,verification,runDir:'canonical',workDir:'booklets/projects'}),/live content/);
});
test('one bounded exercise call supports seven items and checks each archetype count',()=>{
 const evidence=[{id:'source',method:'An existing routine method.'}],group={archetype:'known',count:7,styleExamples:[item],taughtEvidence:evidence};
 const request=routineBackfillBatchPrompt({topic:'exercise',groups:[group,{...group,archetype:'other',count:2}],idPrefix:'test'});
 assert.equal(request.count,9);
 const items=Array.from({length:9},(_,i)=>({...item,id:'test-'+i,archetype:i<7?'known':'other'}));
 assert.equal(validateRoutineBackfillDraft(request,{items,instructionalChange:false}).length,9);
 items[8].archetype='known';assert.throws(()=>validateRoutineBackfillDraft(request,{items,instructionalChange:false}),/item count mismatch/);
 assert.throws(()=>routineBackfillBatchPrompt({groups:[{...group,count:13}]}),/at most 12/);
});
test('acceptance requires independent exact-draft answer checks and existing verified ratings below 65',()=>{
 const draft={kind:'backfill',model:NEW_CONTENT_MODEL,metrics:{modelUsage:{[NEW_CONTENT_MODEL]:{}}},result,draftHash:draftHash(result)};
 const block={id:item.id,type:'question',pedagogyRole:'practice',content:item.content};block.classification=assessedRating(block,{reasoningScore:20,difficulty:'Foundation',difficultyReason:'Direct application.'},{model:'gpt-6.1-sol',assessedAt:new Date().toISOString(),evidence:'separate-call'});
 const review={draftHash:draft.draftHash,model:'gpt-6.1-sol',accepted:true,answersVerified:true,principlesVerified:true,archetypeTaught:true,inScope:true,instructionalChange:false};
 assert.deepEqual(assertIndependentBackfillReview({draft,blocks:[block],review}),[block]);
 const automatic={model:NEW_CONTENT_MODEL,kind:'backfill',destination:'booklet',status:'verified-routine-backfill',archetypeTaught:true,instructionalChange:false,reasoningScore:20,independentReview:review,block,backfillProof:{draft,blocks:[block],review}};
 assert.equal(validateNewTeachingCandidate(automatic),automatic);assert.throws(()=>validateNewTeachingCandidate({...automatic,backfillProof:undefined}),/Independent Sol/);
 const unrated=structuredClone(block);delete unrated.classification.assessment;assert.throws(()=>validateNewTeachingCandidate({...automatic,block:unrated}),/exact independently rated/);
 assert.throws(()=>assertIndependentBackfillReview({draft,blocks:[block],review:{...review,model:NEW_CONTENT_MODEL}}),/Independent Sol/);
 assert.throws(()=>assertIndependentBackfillReview({draft,blocks:[block],review:{...review,draftHash:'stale'}}),/exact taught routine draft/);
 const changed=structuredClone(block);changed.content.prompt='Different task';assert.throws(()=>assertIndependentBackfillReview({draft,blocks:[changed],review}),/verified routine rating/);
 changed.classification=assessedRating(changed,{reasoningScore:20,difficulty:'Foundation',difficultyReason:'Still direct, but a different question.'},{model:'gpt-6.1-sol',assessedAt:new Date().toISOString(),evidence:'different-question-review'});assert.throws(()=>assertIndependentBackfillReview({draft,blocks:[changed],review}),/verified routine rating/);
 const high=structuredClone(block);high.classification=assessedRating(high,{reasoningScore:65,difficulty:'Mastery',difficultyReason:'Nonroutine connection.'},{model:'gpt-6.1-sol',assessedAt:new Date().toISOString(),evidence:'independent-call'});assert.throws(()=>assertIndependentBackfillReview({draft,blocks:[high],review}),/verified routine rating/);
});
test('native multipart grouping preserves every task/answer and invalidates individual ratings',()=>{
 const second={...structuredClone(item),id:'test-2',content:{...structuredClone(item.content),id:'test-second-root',prompt:'Calculate $3+4$.',answer:{short:'$7$',worked:'$3+4=7$'}}};
 const result={items:[item,second],instructionalChange:false},draft={kind:'backfill',model:NEW_CONTENT_MODEL,result,draftHash:draftHash(result),metrics:{modelUsage:{[NEW_CONTENT_MODEL]:{}}}};
 const grouped=groupRoutineBackfillDraft(draft,{idPrefix:'group'});assert.equal(grouped.result.items.length,1);assert.equal(grouped.grouping.itemGroups[0].practiceItems.length,2);assert.equal(grouped.grouping.ratingReusable,false);
 assert.equal(grouped.result.items[0].content.children[0].prompt,item.content.prompt);assert.deepEqual(grouped.result.items[0].content.children[1].answer,second.content.answer);assert.notEqual(grouped.draftHash,draft.draftHash);
 assert.throws(()=>assertIndependentBackfillReview({draft:grouped,blocks:[],review:{draftHash:draft.draftHash}}),/Independent Sol/);
});

const retainedRequest={model:NEW_CONTENT_MODEL,kind:'backfill',prompt:'Synthetic software-contract fixture; no booklet source.'};
const retainedTemp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-sonnet-retention-test-'));
const retainedLease=async(_run,_details,action)=>action();

test('raw stdout exists before parsing and preserves healthy legacy results and current controls',async()=>{
 for(const streamed of ['all','prefix']){
  const workDir=retainedTemp(),stdout=envelope()+'\n',beforeRetry=process.env.MAX_STRUCTURED_OUTPUT_RETRIES;
  const draft=await generateSonnetDraft({request:retainedRequest,verification,runDir:'canonical',workDir,lease:retainedLease,executor:async options=>{
   const args=options.args;assert.equal(args.includes('--json-schema'),false);assert.equal(Object.hasOwn(options,'env'),false);assert.equal(args[args.indexOf('--tools')+1],'');assert.equal(args[args.indexOf('--disallowedTools')+1],'*');
   assert.equal(args[args.indexOf('--permission-mode')+1],'default');assert.equal(args[args.indexOf('--max-turns')+1],'1');assert.equal(args[args.indexOf('--settings')+1],'{"fallbackModel":[]}');assert.ok(args.includes('--safe-mode')&&args.includes('--strict-mcp-config')&&args.includes('--no-session-persistence'));assert.equal(args.some(a=>/bypass|skip-permission/i.test(a)),false);
   assert.equal(path.dirname(options.cwd),os.tmpdir());assert.equal(fs.existsSync(path.join(workDir,'raw-stdout.txt')),true);options.onStdout(Buffer.from(stdout.slice(0,19)));assert.equal(fs.readFileSync(path.join(workDir,'raw-stdout.txt'),'utf8'),stdout.slice(0,19));if(streamed==='all')options.onStdout(Buffer.from(stdout.slice(19)));return{code:0,stdout};
  }});
  assert.deepEqual(draft.result,result);assert.equal(draft.draftHash,draftHash(result));assert.equal(fs.readFileSync(path.join(workDir,'raw-stdout.txt'),'utf8'),stdout);assert.equal(draft.metrics.rawStdoutComplete,true);assert.equal(draft.metrics.rawStdoutSha256,createHash('sha256').update(stdout).digest('hex'));assert.equal(process.env.MAX_STRUCTURED_OUTPUT_RETRIES,beforeRetry);
 }
});

test('malformed envelope, malformed inner JSON and nonzero exit retain exact raw data without a draft',async()=>{
 for(const [stdout,code,expected]of [
  ['not-json\n\u03b8',0,/valid JSON envelope/],
  [envelope({result:'{"items":[{"id":"test-1"},"instructionalChange":false}]}'}),0,/draft is not valid JSON/],
  ['synthetic provider failure after output\n',7,/exit code 7/],
 ]){
  const workDir=retainedTemp();await assert.rejects(generateSonnetDraft({request:retainedRequest,verification,runDir:'canonical',workDir,lease:retainedLease,executor:async()=>({code,stdout})}),expected);
  assert.equal(fs.readFileSync(path.join(workDir,'raw-stdout.txt'),'utf8'),stdout);assert.equal(fs.existsSync(path.join(workDir,'draft.json')),false);const metrics=JSON.parse(fs.readFileSync(path.join(workDir,'generation-metrics.json')));assert.equal(metrics.rawStdoutComplete,true);assert.equal(metrics.rawStdoutBytes,Buffer.byteLength(stdout));assert.equal(metrics.rawStdoutSha256,createHash('sha256').update(stdout).digest('hex'));assert.equal(metrics.externalModelCalls,1);
 }
});

test('partial timeout and abort output is retained before failure, including zero-call lease errors',async()=>{
 for(const failure of ['timed out','aborted']){
  const workDir=retainedTemp(),partial='{"synthetic":"partial output"',controller=new AbortController();
  await assert.rejects(generateSonnetDraft({request:retainedRequest,verification,runDir:'canonical',workDir,lease:retainedLease,signal:controller.signal,executor:async options=>{assert.equal(options.signal,controller.signal);options.onStdout(Buffer.from(partial));if(failure==='aborted')controller.abort();throw Error('Sonnet draft generation '+failure);}}),new RegExp(failure));
  assert.equal(fs.readFileSync(path.join(workDir,'raw-stdout.txt'),'utf8'),partial);assert.equal(fs.existsSync(path.join(workDir,'draft.json')),false);const metrics=JSON.parse(fs.readFileSync(path.join(workDir,'generation-metrics.json')));assert.equal(metrics.rawStdoutComplete,false);assert.equal(metrics.rawStdoutBytes,Buffer.byteLength(partial));assert.equal(metrics.rawStdoutSha256,createHash('sha256').update(partial).digest('hex'));
 }
 const queued=retainedTemp();let invoked=false;await assert.rejects(generateSonnetDraft({request:retainedRequest,verification,runDir:'canonical',workDir:queued,lease:async()=>{throw Error('Queue aborted');},executor:async()=>{invoked=true;}}),/Queue aborted/);assert.equal(invoked,false);const metrics=JSON.parse(fs.readFileSync(path.join(queued,'generation-metrics.json')));assert.equal(metrics.externalModelCalls,0);assert.equal(metrics.rawStdoutBytes,0);
});

test('raw-only crashed attempts are preserved and cannot silently dispatch again',async()=>{
 for(const retained of ['raw-stdout.txt','raw-envelope.json']){
  const workDir=retainedTemp();fs.writeFileSync(path.join(workDir,retained),'preserved prior attempt');let calls=0;
  await assert.rejects(generateSonnetDraft({request:retainedRequest,verification,runDir:'canonical',workDir,lease:retainedLease,executor:async()=>{calls++;}}),/retained attempt/);assert.equal(calls,0);assert.equal(fs.readFileSync(path.join(workDir,retained),'utf8'),'preserved prior attempt');
 }
});

test('the existing stdout size cap retains a marked truncated prefix without accepting a draft',async()=>{
 const workDir=retainedTemp();await assert.rejects(generateSonnetDraft({request:retainedRequest,verification,runDir:'canonical',workDir,lease:retainedLease,executor:async options=>{options.onStdout(Buffer.alloc(8000001,120));return{code:0,stdout:''};}}),/exceeds output limit/);
 assert.equal(fs.statSync(path.join(workDir,'raw-stdout.txt')).size,8000000);assert.equal(fs.existsSync(path.join(workDir,'draft.json')),false);const metrics=JSON.parse(fs.readFileSync(path.join(workDir,'generation-metrics.json')));assert.equal(metrics.rawStdoutTruncated,true);assert.equal(metrics.rawStdoutComplete,false);assert.equal(metrics.rawStdoutBytes,8000000);
});
