import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { hashValue, scopeDependencies } from '../scripts/content/campaign-sources.mjs';
import { LAYOUT_APPLICABILITY as config } from '../scripts/content/campaign-layout-applicability.mjs';
import { verifyRenderApplicabilityEvidence, verifyTerminalPixelReuse, bindCurrentRenderField, probeApplicabilityBrowser, activateRenderApplicability } from '../scripts/content/campaign-render-applicability.mjs';
import { campaignRendererDependencyManifest } from '../scripts/content/campaign-render-dependencies.mjs';
import { recordRefreshedVisualReview, visualRefreshRevision, readSkill, capturePair, receiptCampaign, publishAssignment } from '../scripts/content/campaign-support.mjs';
import { verifyCampaignRenderReceipt } from '../scripts/content/campaign-visual-evidence.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/content-campaign/renderer-layout-applicability.json',import.meta.url)));
const work='.agywork/content-campaign/worked-examples-2026-09/';
function setup(){
 const bytes=new Map(Object.entries(fixture.files).map(([p,row])=>{const b=gunzipSync(Buffer.from(fixture.blobs[row.hash],'base64'));assert.equal(hashValue(b),row.hash);return [p,b];}));
 for(const p of config.codeFiles)bytes.set(p,fs.readFileSync(p));
 const read=p=>{if(!bytes.has(p))throw Error('Missing actual fixture '+p);return bytes.get(p);};
 const put=(p,v)=>{const b=Buffer.isBuffer(v)?v:Buffer.from(JSON.stringify(v));bytes.set(p,b);return {path:p,hash:hashValue(b)};};
 const codeReview=put(work+'test-layout-code-review.json',{format:'content-campaign-render-applicability-code-review-v1',accepted:true,authorIdentity:'/root/review_plan_sol61',reviewerIdentity:'/root/SYNTHETIC-independent-test',profile:{model:'gpt-6.1-sol',effort:'high',requestedServiceTier:'default'},files:config.codeFiles.map(p=>({path:p,hash:hashValue(read(p))})),note:'SYNTHETIC temp tests only; no real acceptance/activation/pixel claim.'});
 const certificate={format:config.profile,originalRendererSignature:config.old,currentRendererSignature:config.current,scopeReview:structuredClone(fixture.scopeReview),codeReview,currentEnvironmentReceipt:structuredClone(fixture.currentEnvironmentReceipt),browserProbe:structuredClone(fixture.browserProbe),activatedBy:{identity:'/root',at:'2026-10-01T10:00:00Z'}};
 const reference=put(work+'test-layout-addendum.json',certificate),proof=JSON.parse(read(fixture.scopeReview.path)),manifest=JSON.parse(read(proof.fixedTarget.manifest.path));
 const args={read,currentManifest:manifest,addendumReference:reference,field:structuredClone(fixture.fields[0]),candidateHash:fixture.candidateHash,receiptReference:fixture.receiptReference,liveBrowser:fixture.browserProbe};
 return {bytes,read,put,args,certificate,proof,manifest,codeReview};
}
test('fixed layout profile preserves authentic f422 whole fields/captions/PNGs with separate 01b5 evidence',()=>{
 const f=setup();
 for(const field of fixture.fields){const result=verifyRenderApplicabilityEvidence({...f.args,field});assert.equal(result.applicability.profile,config.profile);assert.equal(result.applicability.originalRendererSignature,config.old);assert.equal(result.applicability.currentRendererSignature,config.current);assert.equal(result.applicability.originalReceipt.hash,fixture.receiptReference.hash);assert.equal(result.applicability.features.fieldHash,field.hash);assert.equal(result.artifacts.length,1);}
 assert.equal(JSON.parse(f.read(fixture.receiptReference.path)).rendererSignature,config.old);
});
test('exact source proof, all697 unchanged bindings, active LabelSpace/parser/import/CSS and closure remain mandatory',()=>{
 const mutations=[f=>f.certificate.scopeReview.hash='other proof',f=>f.args.currentManifest.files.find(r=>r.path==='src/lib/diagram-label-space.js').hash='active changed',f=>f.args.currentManifest.files.find(r=>r.path==='src/app.css').hash='CSS changed',f=>f.args.currentManifest.files.pop(),f=>f.bytes.set('public/libs/maths-editor/document-model.mjs',Buffer.from('parser changed')),f=>f.bytes.set('src/components/InlineContent.svelte',Buffer.from('import changed')),f=>f.bytes.set(f.proof.sourcePairs[0].retainedBefore.path,Buffer.from('wrong old source')),f=>f.bytes.set(f.proof.activeClosure.files[0].snapshot.path,Buffer.from('wrong source snapshot'))];
 for(const mutate of mutations){const f=setup();mutate(f);f.args.addendumReference=f.put(work+'bad-layout-source.json',f.certificate);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/applicability/);}
 const wrong=setup();wrong.certificate.originalRendererSignature='4cd2b843783e4cfeac5fd36de4ae6209c4de8ea6d3fdfc0e14baad42a063f103';wrong.args.addendumReference=wrong.put(work+'pre534.json',wrong.certificate);assert.throws(()=>verifyRenderApplicabilityEvidence(wrong.args),/activation/);
});
test('current candidate/ordered locator/whole-caption/blocks reject changed, malformed and structured fields',()=>{
 const f=setup(),candidate=JSON.parse(f.read(fixture.state.stage.candidatePath)),field=fixture.fields[1],metadata={where:field.where,hash:field.hash,diagramHashes:field.diagramHashes};
 assert.equal(bindCurrentRenderField(candidate,fixture.candidateHash,metadata).value,field.value);
 const reorder=structuredClone(candidate);reorder.content.practice.development.reverse();assert.throws(()=>bindCurrentRenderField(reorder,fixture.candidateHash,metadata),/whole candidate/);assert.throws(()=>bindCurrentRenderField(reorder,hashValue({content:reorder.content,quiz:reorder.quiz}),metadata),/field\/block/);
 for(const value of [{format:'maths-editor-document-v1',blocks:[{type:'table'}]},{type:'speechBubble'},null,42,'[tikz]not closed'])assert.throws(()=>verifyRenderApplicabilityEvidence({...f.args,field:{...f.args.field,value}}),/structured|malformed|field/);
 for(const mutate of [a=>a.candidateHash='revised',a=>a.field.value+=' changed caption',a=>a.field.diagramHashes[0]='changed block']){const f=setup();mutate(f.args);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/candidate|identity|binding/);}
});
test('missing root/different code acceptance and browser/font/binary races reject before any recording',()=>{
 for(const mutate of [f=>f.certificate.activatedBy.identity='/root/author',f=>f.bytes.set(config.codeFiles[1],Buffer.from('concurrent code')),f=>f.args.liveBrowser={...fixture.browserProbe,browserVersion:'155'},f=>f.args.liveBrowser={...fixture.browserProbe,executableHash:'upgraded'},f=>delete f.args.liveBrowser]){const f=setup();mutate(f);f.args.addendumReference=f.put(work+'bad-layout-activation.json',f.certificate);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/activation|code\/schema|browser/);}
 const f=setup(),review=JSON.parse(f.read(f.codeReview.path));review.reviewerIdentity=review.authorIdentity;f.certificate.codeReview=f.put(work+'self-code-review.json',review);f.args.addendumReference=f.put(work+'self-activation.json',f.certificate);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/different-worker/);
 const raced=setup(),read=raced.read;let changed=false;raced.args.read=p=>{const b=read(p);if(p===fixture.fields[0].artifacts[0].path&&!changed){changed=true;raced.bytes.set('scripts/content/campaign-support.mjs',Buffer.from('racing code'));}return b;};assert.throws(()=>verifyRenderApplicabilityEvidence(raced.args),/code\/schema/);
});
test('ordinary strict guard and genuine terminal positive origin cannot be replaced by applicability',t=>{
 const f=setup(),root=fs.mkdtempSync(path.join(os.tmpdir(),'layout-origin-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const [p,b] of f.bytes){const target=path.join(root,p);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,b);}
 const capture=verifyRenderApplicabilityEvidence(f.args),terminal=verifyTerminalPixelReuse(root,fixture.fields[0],fixture.originalInspection,capture,fixture.originalProfile);assert.equal(terminal.profile.reviewerIdentity,'/root/review_plan_sol61');
 assert.throws(()=>verifyCampaignRenderReceipt(root,fixture.candidateHash,fixture.fields[0],fixture.receiptReference),/renderer mismatch/);
 const original=JSON.parse(f.read(fixture.originalInspection.path));original.visualReviews[0].accepted=false;const ref=f.put(work+'negative-origin.json',original);fs.writeFileSync(path.join(root,ref.path),f.read(ref.path));assert.throws(()=>verifyTerminalPixelReuse(root,fixture.fields[0],ref,capture),/positive original/);
});

test('complete700 isolated production activation→refresh→publication→receipt preserves originals and rejects stale values/revisions/source/browser drift',async t=>{
 // This integration uses the installed complete producer/assets, not a signature
 // override. If unrelated future renderer edits change the fixed target, the
 // deterministic adversarial tests above still run; this historical integration
 // cannot pretend that the live closure is the fixed reviewed target.
 if(hashValue(campaignRendererDependencyManifest(process.cwd()))!==config.current){t.skip('Live installed closure is no longer the fixed historical01b5 target; no signature override.');return;}
 const f=setup(),root=fs.mkdtempSync(path.join(os.tmpdir(),'layout-full700-'));if(!process.env.KEEP_LAYOUT_TEST_TEMP)t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const write=(p,v)=>{const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.isBuffer(v)||typeof v==='string'?v:JSON.stringify(v));return {path:p,hash:hashValue(fs.readFileSync(file))};};
 for(const row of f.manifest.files)if(row.hash!==null){const bytes=fs.readFileSync(row.path);assert.equal(hashValue(bytes),row.hash);write(row.path,bytes);}
 for(const [p,b] of f.bytes)write(p,b);
 const id='percent-meaning',campaignId='worked-examples-2026-09',ledger='booklets/provenance/content-campaign/'+campaignId+'/skills/'+id+'.json';
 write(ledger,fixture.state);write('booklets/provenance/content-campaign/'+campaignId+'/campaign.json',{id:campaignId,createdAt:'2026-09-30T12:05:06.994Z',skillIds:[id],excludedIds:[],profile:{model:'gpt-6.1-sol',effort:'high'}});
 assert.equal(hashValue(campaignRendererDependencyManifest(root)),config.current);assert.ok(fixture.state.review.requiredVisuals.every(r=>r.value===undefined));
 const addendum=activateRenderApplicability(root,{profile:config.profile,scopeReview:fixture.scopeReview,codeReview:f.codeReview,currentEnvironmentReceipt:fixture.currentEnvironmentReceipt,coordinatorIdentity:'/root',out:work+'TEMP-ONLY-activated-layout.json'});
 const originalAddendum=fs.readFileSync(path.join(root,addendum.path));
 const before=readSkill(root,campaignId,id),oldRaw=fs.readFileSync(path.join(root,fixture.originalInspection.path)),originalPair=capturePair(root,id).expected;
 const visualReviews=fixture.fields.map(field=>{const prior=JSON.parse(f.read(fixture.originalInspection.path)).visualReviews.find(r=>r.where===field.where);return {...prior,inspectionMode:'identical-png-reuse',actualPixelInspection:false,reusedInspection:{review:fixture.originalInspection,profile:fixture.originalProfile},rendererApplicability:addendum};});
 const input=()=>({campaignId,skillId:id,workerId:'temp-independent-visual',stageHash:before.stage.hash,candidateHash:before.stage.candidateHash,expectedVisualRevisionHash:visualRefreshRevision(readSkill(root,campaignId,id)),reviewerProfile:{model:'gpt-6.1-sol',effort:'high',requestedServiceTier:'default',reviewerIdentity:'/root/review_plan_sol61',workerLineage:{profile:'stable-worker-lineage-v1',kind:'native',actorId:'/root/review_plan_sol61',origin:'coordinator-bound'},provider:null,usage:null},visualReviews});
 const request=input(),freshLie=structuredClone(request);freshLie.visualReviews[0].inspectionMode='fresh';freshLie.visualReviews[0].actualPixelInspection=true;assert.throws(()=>recordRefreshedVisualReview(root,freshLie),/requires genuine terminal/);
 // Inject only READ results: never modify an actual browser binary. The probe
 // hashes it once, the operation checks before validation, and a changed third
 // read models binary replacement during validation. The ledger must stay exact.
 const ledgerBeforeRace=fs.readFileSync(path.join(root,ledger)),actualRead=fs.readFileSync;let browserReads=0;
 try{fs.readFileSync=function(file,...args){const bytes=actualRead.call(fs,file,...args);if(String(file)===fixture.browserProbe.executablePath&&++browserReads>=3)return Buffer.concat([bytes,Buffer.from('SYNTHETIC read-only race')]);return bytes;};assert.throws(()=>recordRefreshedVisualReview(root,input()),/browser executable changed/);}finally{fs.readFileSync=actualRead;}
 assert.ok(browserReads>=3);assert.ok(fs.readFileSync(path.join(root,ledger)).equals(ledgerBeforeRace));
 const partial=input();partial.visualReviews=partial.visualReviews.slice(0,1);const one=recordRefreshedVisualReview(root,partial);assert.equal(one.renderingCurrent,false);assert.equal(one.renderingPending.length,1);assert.throws(()=>recordRefreshedVisualReview(root,partial),/Stale visual/);
 const remaining=input();remaining.visualReviews=remaining.visualReviews.slice(1);assert.equal(recordRefreshedVisualReview(root,remaining).renderingCurrent,true);
 const accepted=readSkill(root,campaignId,id);assert.deepEqual(accepted.stage,before.stage);assert.deepEqual(accepted.review.outcomes,before.review.outcomes);assert.deepEqual(accepted.review.sourceImageReviews,before.review.sourceImageReviews);assert.deepEqual(capturePair(root,id).expected,originalPair);assert.ok(fs.readFileSync(path.join(root,fixture.originalInspection.path)).equals(oldRaw));
 await publishAssignment(root,{campaignId,skillId:id});assert.equal(receiptCampaign(root,campaignId).verifiedCurrentPublished,1);
 const published=readSkill(root,campaignId,id),pair=capturePair(root,id).expected,journal=fs.readFileSync(path.resolve(root,published.published.journalPath)),savedLedger=fs.readFileSync(path.join(root,ledger));
 const candidate=JSON.parse(fs.readFileSync(path.join(root,published.stage.candidatePath))),originalCandidate=fs.readFileSync(path.join(root,published.stage.candidatePath));
 for(const mutate of [c=>c.content.practice.development.reverse(),c=>c.content.theory.workedExamples[0].question_text+=' Changed caption.',c=>c.content.theory=null]){const changed=structuredClone(candidate);mutate(changed);write(published.stage.candidatePath,changed);assert.equal(receiptCampaign(root,campaignId).verifiedCurrentPublished,0);assert.throws(()=>recordRefreshedVisualReview(root,input()),/candidate changed|stage\/method/);assert.ok(fs.readFileSync(path.join(root,ledger)).equals(savedLedger));write(published.stage.candidatePath,originalCandidate);}
 const source=scopeDependencies(root,id,published.scope,published.stage.sourceReview).paths.find(r=>r.path.endsWith('.md')),sourceBytes=fs.readFileSync(path.join(root,source.path));write(source.path,Buffer.concat([sourceBytes,Buffer.from('\nChanged source.') ]));assert.equal(receiptCampaign(root,campaignId).verifiedCurrentPublished,0);assert.throws(()=>recordRefreshedVisualReview(root,input()),/dependencies changed/);write(source.path,sourceBytes);
 const activation=JSON.parse(fs.readFileSync(path.join(root,addendum.path)));activation.browserProbe.executableHash='upgraded binary';write(addendum.path,activation);assert.equal(receiptCampaign(root,campaignId).verifiedCurrentPublished,0);assert.throws(()=>recordRefreshedVisualReview(root,input()),/evidence changed/);
 assert.deepEqual(capturePair(root,id).expected,pair);assert.ok(fs.readFileSync(path.resolve(root,published.published.journalPath)).equals(journal));assert.ok(fs.readFileSync(path.join(root,fixture.originalInspection.path)).equals(oldRaw));
 // Restore the deliberately corrupted TEMP addendum before saving reproducible
 // evidence. Original accepted file bytes and all historical origins preserved.
 write(addendum.path,originalAddendum);
 // All activations/publication/ledger writes above are in this isolated TEMP.
 // Original production receipts, ledger, published pair and pixel proof untouched.
 assert.equal(probeApplicabilityBrowser(process.cwd()).browserVersion,fixture.browserProbe.browserVersion);
 if(process.env.KEEP_LAYOUT_TEST_TEMP){
  const proof={format:'layout-applicability-isolated-integration-v1',at:new Date().toISOString(),isolatedTemp:root,files:config.codeFiles.map(p=>({path:p,hash:hashValue(fs.readFileSync(p))})),sourceReview:fixture.scopeReview,originalReceipt:fixture.receiptReference,currentEnvironmentReceipt:fixture.currentEnvironmentReceipt,originalInspection:fixture.originalInspection,addendum,completeRendererSignature:hashValue(campaignRendererDependencyManifest(root)),assertions:{realActivateAPI:true,recordRefreshedVisualReview:true,persistedValuesAbsent:true,partialFreshness:true,publicationValidator:true,realTempPublication:true,receiptReadback:true,staleRevisionRejected:true,candidateChangeReorderMalformedRejected:true,sourceDriftRejected:true,browserEvidenceDriftRejected:true,browserBinaryReadRaceRejectedWithoutWrite:true,publishedPairJournalPreserved:true,originalMathStageSourceInspectionsPreserved:true},publishedReadback:pair,publishedJournalHash:hashValue(journal),settings:{model:'gpt-6.1-sol',effort:'high',requestedServiceTier:'default',actualProvider:null,actualSpeed:null,actualUsage:null,externalModelCalls:0},liveLedgerWrites:0,liveActivations:0,realPublications:0,newPixelInspections:0,limits:'Synthetic code acceptance and root activation occur only in isolated TEMP; genuine source, producer, original inspection and complete700 installed assets are preserved. No live acceptance inferred.'};
  const out=work+'layout-applicability-isolated-integration-'+Date.now()+'.json';fs.writeFileSync(out,JSON.stringify(proof,null,2)+'\n',{flag:'wx'});t.diagnostic(JSON.stringify({path:out,hash:hashValue(fs.readFileSync(out)),temp:root}));
 }
});
