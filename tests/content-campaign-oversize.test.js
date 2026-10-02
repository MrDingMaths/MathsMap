import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {methodMappingBatches, budgetDiagnosticReviewReuse, validateOversizeExceptionBindings, runBoundedAssignment} from '../scripts/content/campaign-bounded.mjs';
import {validateOversizeExceptions, runCampaign} from '../scripts/content/campaign-runner.mjs';
import {hashValue, CAMPAIGN_PROFILE, readSkill} from '../scripts/content/campaign-support.mjs';

const fixture=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/content-campaign/multinumber-indivisible-mapping.json',import.meta.url)));
const where='practice.development[3]',skillId='add-multiple-numbers-place-value';
const sourceRoot=fileURLToPath(new URL('..',import.meta.url));
const exceptionMap=f=>({[where]:f.exception});

test('actual indivisible compound mapping preserves all sources, methods, examples and whole owned working under one measured exception',()=>{
  const f=fixture();
  assert.throws(()=>methodMappingBatches(f.items,f.coverage,f.outcomes,f.context),/25158 characters/);
  assert.throws(()=>methodMappingBatches(f.items,f.coverage,f.outcomes,f.resumedContext),/25314 characters/);
  const {jobs}=methodMappingBatches(f.items,f.coverage,f.outcomes,f.resumedContext,{oversizeExceptions:exceptionMap(f)});
  const job=jobs.find(j=>j.items.some(i=>i.where===where));
  assert.equal(job.items.length,1);assert.equal(job.budgetException.kind,'review-coverage');
  const measured=structuredClone(job);delete measured.budgetException;
  assert.equal(JSON.stringify(measured).length,25314);assert.equal(job.budgetException.failureVariableChars,25158);
  assert.deepEqual(job.sourceEvidence,f.context.sourceEvidence);assert.deepEqual(job.sourceRefs,f.context.sourceRefs);
  assert.deepEqual(job.items[0].value.question,f.items.find(i=>i.where===where).value);
  assert.equal(job.items[0].value.independentSolution,f.outcomes.find(o=>o.where===where).independentSolution);
  assert.equal(job.requiredMethodIds.length,3);assert.equal(job.independentMethodExamples.length,3);
  for(const id of job.requiredMethodIds)assert.ok(job.independentMethodExamples.some(e=>e.value.methods.includes(id)));
  assert.deepEqual(jobs.flatMap(j=>j.items).map(i=>i.where).sort(),f.items.map(i=>i.where).sort());
  for(const j of jobs.filter(j=>!j.budgetException))assert.ok(JSON.stringify(j).length<=24000);
  assert.throws(()=>methodMappingBatches(f.items,f.coverage,f.outcomes,f.resumedContext,{oversizeExceptions:{[where]:{...f.exception,variableChars:25158}}}),/Stale diagnosed/);
});

test('per-skill exception configuration rejects foreign membership, missing diagnosis/bindings and blanket budgets',()=>{
  const f=fixture(),campaign={skillIds:[skillId]},valid={[skillId]:exceptionMap(f)};
  assert.deepEqual(validateOversizeExceptions(campaign,valid),valid);
  for(const change of [()=>({'foreign-skill':exceptionMap(f)}),()=>({[skillId]:{}}),()=>({[skillId]:{theory:f.exception}}),...['reason','indivisible','variableChars','kind','stageHash','candidateHash','itemHash','dependencyHash'].map(key=>()=>({[skillId]:{[where]:{...f.exception,[key]:key==='reason'?'':null}}})),()=>({[skillId]:{[where]:{...f.exception,maxVariableChars:30000}}})])assert.throws(()=>validateOversizeExceptions(campaign,change()),/Oversize|oversize/);
});

test('diagnostic-only review reuse rejects substantive findings, sources, questions/options, working, theory, methods and context changes',()=>{
  const f=fixture(),original=f.originalReviewTicket.payload,current=structuredClone(original);
  current.priorFindings=f.resumedContext.priorFindings;
  assert.ok(budgetDiagnosticReviewReuse(original,current,exceptionMap(f)));
  assert.equal(budgetDiagnosticReviewReuse(original,current,{}),null);
  assert.equal(budgetDiagnosticReviewReuse(original,current,{[where]:{...f.exception,failureVariableChars:25159}}),null);
  const changes=[p=>p.priorFindings.push('Substantive new source finding.'),p=>p.sourceEvidence[0].hash='changed',p=>p.items[0].value.question_text+=' Changed.',p=>p.items.find(i=>i.kind==='quiz').value.options[1].why+=' Changed.',p=>p.items[0].value.solution_text+=' Changed.',p=>p.theory.intro+=' Changed.',p=>p.methods[0].description+=' Changed.',p=>p.context.skill.title+=' Changed.',p=>p.scope.stage=4];
  for(const change of changes){const altered=structuredClone(current);change(altered);assert.equal(budgetDiagnosticReviewReuse(original,altered,exceptionMap(f)),null);}
});

function replay(t){
  const f=fixture(),root=fs.mkdtempSync(path.join(os.tmpdir(),'campaign-oversize-replay-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const write=(p,v)=>{const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(v));};
  const base=`.agywork/content-campaign/test/${skillId}`,cache=base+'/bounded-evidence';
  for(const source of f.sourceEvidence)for(const p of [source.path,...source.images.map(i=>i.path)]){const target=path.join(root,p);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(sourceRoot,p),target);}
  write('snapshot.json',f.snapshot);write('baseline.json',f.baseline);write('sources.json',f.sourceEvidence);write('packet.json',{context:f.packetContext});
  for(const c of f.itemCaches)write(cache+'/'+c.relativePath,c.record);
  write(cache+'/'+f.originalReviewCache.inputHash+'/'+f.originalReviewCache.attemptId+'.json',f.originalReviewCache);
  write(f.originalReviewCache.outputPath+'/ticket.json',f.originalReviewTicket);
  const prepared={snapshotPath:'snapshot.json',sourceEvidencePath:'sources.json',sourceEvidenceHash:hashValue(f.sourceEvidence),dependencyHash:f.stage.dependencyHash,sources:f.sourceEvidence.map(({excerpt,...s})=>s),packets:[{path:'packet.json'}]};
  prepared.sourceReferences=prepared.sources;
  const state={skillId,campaignId:'test',scope:f.context.scope,pending:f.resumedContext.priorFindings,owner:{role:'review',workerId:'different-replay-reviewer',prepared},stage:{...f.stage,baselinePath:'baseline.json',reusedOutcomes:[]}};
  return {f,root,cache,prepared,state,out:path.join(root,base,'replay-assignment/attempt'),oversizeExceptions:exceptionMap(f),concurrency:1};
}

test('actual failed assignment replay reuses 27 mathematical outcomes honestly and dispatches only complete mapping/header/source review',async t=>{
  const r=replay(t),calls=[],originalCache=fs.readFileSync(path.join(r.root,r.cache,r.f.originalReviewCache.inputHash,r.f.originalReviewCache.attemptId+'.json'));
  const runner=async options=>{
    const ticket=JSON.parse(fs.readFileSync(path.join(options.out,'ticket.json'))),p=ticket.payload;calls.push(ticket);
    assert.notEqual(ticket.kind,'review','no repeated mathematical review');
    let result;
    if(['review-headers','review-coverage'].includes(ticket.kind))result={checks:p.items.map(i=>({where:i.where,accepted:true,observation:'Mock aggregate transport check; whole retained evidence remains available.'})),theoryObservation:'All headers delivered.',sourceObservation:'Every method delivered.',findings:[]};
    else if(ticket.kind==='review-theory-source')result={theoryObservation:'Scoped theory mock check; item/header/mapping reviews are separate.',sourceObservation:'Complete source mock check.',sourceImageReviews:(p.unavailableImageDecisions||[]).map(g=>({sourceIndex:g.sourceIndex,imagePath:g.imagePath,accepted:true,observation:'Mock explicit gap decision.'})),findings:[]};
    else throw new Error('Unexpected job '+ticket.kind);
    return {result,metrics:{sessionId:'fresh-mock-'+calls.length,externalModelCalls:0}};
  };
  const reply=await runBoundedAssignment({...r,runner});
  assert.equal(reply.result.outcomes.length,27);assert.equal(reply.result.outcomes.filter(o=>o.verdict==='accepted').length,22);assert.equal(reply.result.outcomes.filter(o=>o.verdict==='repair').length,5);
  for(const outcome of reply.result.outcomes)assert.deepEqual(outcome,r.f.outcomes.find(o=>o.where===outcome.where));
  const actual=calls.find(c=>c.kind==='review-coverage'&&c.payload.items.some(i=>i.where===where));assert.ok(actual);
  assert.equal(actual.budgetException.kind,'review-coverage');assert.equal(actual.budgetException.variableChars,25314);assert.equal(actual.budgetException.indivisible,true);assert.equal(actual.variableChars,JSON.stringify(actual.payload).length);
  assert.ok(actual.variableChars>24000);assert.deepEqual(actual.payload.sourceEvidence,r.f.context.sourceEvidence);
  const reused=reply.attempts.find(a=>a.budgetDiagnosticReuse);assert.ok(reused);assert.equal(reused.inputHash,r.f.originalReviewCache.inputHash);assert.notEqual(reused.requestedInputHash,reused.inputHash);assert.equal(reused.metrics.sessionId,r.f.originalReviewCache.metrics.sessionId);
  assert.deepEqual(fs.readFileSync(path.join(r.root,r.cache,r.f.originalReviewCache.inputHash,r.f.originalReviewCache.attemptId+'.json')),originalCache);
  assert.deepEqual(reply.result.findings,r.f.originalReviewCache.result.findings,'repair observations retained without promotion');
});

test('exception stage/item/source bindings and original profile/contract guards reject stale replay before model dispatch',async t=>{
  const f=fixture(),snapshot=f.snapshot,state={stage:f.stage,owner:{prepared:{dependencyHash:f.stage.dependencyHash}}};
  validateOversizeExceptionBindings(state,snapshot,exceptionMap(f));
  for(const key of ['stageHash','candidateHash','itemHash','dependencyHash'])assert.throws(()=>validateOversizeExceptionBindings(state,snapshot,{[where]:{...f.exception,[key]:'0'.repeat(64)}}),/stale hash/);
  const changed=structuredClone(snapshot);changed.content.theory.workedExamples[1].solution_text+=' Changed.';assert.throws(()=>validateOversizeExceptionBindings(state,changed,exceptionMap(f)),/oversize snapshot/);
  for(const kind of ['contract','unknown-origin']){
    const r=replay(t),ticket=structuredClone(r.f.originalReviewTicket);
    if(kind==='contract')ticket.inputHash='0'.repeat(64);
    else {const cached=structuredClone(r.f.originalReviewCache);delete cached.metrics.sessionId;fs.writeFileSync(path.join(r.root,r.cache,cached.inputHash,cached.attemptId+'.json'),JSON.stringify(cached));}
    fs.writeFileSync(path.join(r.root,r.f.originalReviewCache.outputPath,'ticket.json'),JSON.stringify(ticket));
    await assert.rejects(runBoundedAssignment({...r,runner:()=>{throw new Error('Must reject before dispatch');}}),/original cached review|known independent session/);
  }
});

test('mismatched cached profile dispatches fresh effective settings without relabeling or altering historical receipts',async t=>{
  const medium={model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default',maxWorkers:3,executionOverrideProfile:'user-requested-sol61-medium-v1',reasoningOverride:{effort:'medium',reason:'Explicit fixture user Medium override'}};
  for(const variant of ['altered-cached-profile','captured-medium']){
    const r=replay(t),ticketPath=path.join(r.root,r.f.originalReviewCache.outputPath,'ticket.json'),cachePath=path.join(r.root,r.cache,r.f.originalReviewCache.inputHash,r.f.originalReviewCache.attemptId+'.json');
    if(variant==='altered-cached-profile'){
      const ticket=structuredClone(r.f.originalReviewTicket);ticket.profile.effort='xhigh';fs.writeFileSync(ticketPath,JSON.stringify(ticket));
    }else r.state.owner.profile=medium;
    const beforeCache=fs.readFileSync(cachePath),beforeTicket=fs.readFileSync(ticketPath),calls=[];
    let failure;
    try{await runBoundedAssignment({...r,runner:options=>{
      const ticket=JSON.parse(fs.readFileSync(path.join(options.out,'ticket.json')));calls.push({ticket,configuration:options.configuration,prompt:options.prompt});
      throw new Error('Fresh effective-profile dispatch observed');
    }});}catch(error){failure=error;}
    assert.equal(failure?.message,'Fresh effective-profile dispatch observed');assert.equal(calls.length,1);
    const expected=variant==='captured-medium'?medium:CAMPAIGN_PROFILE,actual=calls[0];
    assert.equal(actual.ticket.kind,'review');assert.deepEqual(actual.ticket.profile,expected);
    assert.deepEqual(actual.configuration,{provider:'codex',model:'gpt-6.1-sol',effort:expected.effort,...(expected.reasoningOverride?{reasoningOverride:expected.reasoningOverride}:{})});
    assert.ok(actual.prompt.startsWith('Use gpt-6.1-sol '+expected.effort+', Standard.'));
    assert.notEqual(actual.ticket.inputHash,r.f.originalReviewCache.inputHash);
    assert.ok(!(failure.boundedAttempts||[]).some(a=>a.budgetDiagnosticReuse||a.reused&&a.inputHash===r.f.originalReviewCache.inputHash),'historical whole review is not reused or relabeled');
    assert.deepEqual(fs.readFileSync(cachePath),beforeCache);assert.deepEqual(fs.readFileSync(ticketPath),beforeTicket);
    assert.equal(JSON.parse(beforeCache).metrics.effort,'high');
    if(variant==='captured-medium')assert.deepEqual(JSON.parse(beforeTicket).profile,CAMPAIGN_PROFILE,'historical High ticket remains High');
  }
});

test('runCampaign forwards a bound per-skill exception and completes the real replay as repair-needed without new maths calls or publication',async t=>{
  const r=replay(t),write=(p,v)=>{const file=path.join(r.root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof v==='string'?v:JSON.stringify(v));};
  for(const name of ['skills','topics','courses','dotpoints'])write('data/'+name+'.json',fs.readFileSync(path.join(sourceRoot,'data',name+'.json'),'utf8'));
  write(`public/content/${skillId}.json`,r.f.livePairRaw.content);write(`public/quizzes/${skillId}.json`,r.f.livePairRaw.quiz);
  const ledger='booklets/provenance/content-campaign/test';
  write(ledger+'/campaign.json',{campaignId:'test',skillIds:[skillId],excludedIds:[],profile:CAMPAIGN_PROFILE});
  const state={skillId,status:'staged',scope:r.f.context.scope,sources:r.f.stage.sourceReview,pending:r.f.resumedContext.priorFindings,attempts:[],stage:{...r.f.stage,expected:r.f.snapshot.expected,candidatePath:'snapshot.json',baselinePath:'baseline.json'}};
  write(ledger+'/skills/'+skillId+'.json',state);
  const before=fs.readFileSync(path.join(r.root,'public/content',skillId+'.json'));
  await assert.rejects(runCampaign(r.root,{campaignId:'test',oversizeExceptions:{foreign:exceptionMap(r.f)},runner:()=>{throw new Error('invalid input cannot dispatch');}}),/frozen published membership/);
  assert.equal(readSkill(r.root,'test',skillId).owner,undefined);
  const calls=[],count=methodMappingBatches(r.f.items,r.f.coverage,r.f.outcomes,r.f.resumedContext,{oversizeExceptions:exceptionMap(r.f)}).jobs.length+2;
  const result=await runCampaign(r.root,{campaignId:'test',ids:[skillId],concurrency:1,maxCalls:count,oversizeExceptions:{[skillId]:exceptionMap(r.f)},runner:async options=>{
    const ticket=JSON.parse(fs.readFileSync(path.join(options.out,'ticket.json'))),p=ticket.payload;calls.push(ticket);assert.notEqual(ticket.kind,'review');
    const output=ticket.kind==='review-theory-source'?{theoryObservation:'Mock scoped theory check.',sourceObservation:'Mock full source check.',sourceImageReviews:p.unavailableImageDecisions.map(g=>({sourceIndex:g.sourceIndex,imagePath:g.imagePath,accepted:true,observation:'Mock transport gap check.'})),stepsRepair:{accepted:true,reason:'Mock independent source-supported steps check; header checks are separate.'},findings:[]}:{checks:p.items.map(i=>({where:i.where,accepted:true,observation:'Mock complete method/header transport check.'})),theoryObservation:'Mock headers.',sourceObservation:'Mock methods.',findings:[]};
    return {result:output,metrics:{sessionId:'different-engine-mock-'+calls.length}};
  }});
  assert.equal(result.results[0].status,'repair-needed',JSON.stringify(result.results));
  assert.equal(result.calls,count);const final=readSkill(r.root,'test',skillId);assert.equal(final.review.outcomes.length,27);assert.equal(final.review.outcomes.filter(o=>o.verdict==='repair').length,5);
  assert.ok(calls.some(ticket=>ticket.kind==='review-coverage'&&ticket.budgetException?.itemHash===r.f.exception.itemHash));
  assert.deepEqual(fs.readFileSync(path.join(r.root,'public/content',skillId+'.json')),before);
});
