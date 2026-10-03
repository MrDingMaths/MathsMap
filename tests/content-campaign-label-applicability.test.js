import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {hashValue} from '../scripts/content/campaign-sources.mjs';
import {LABEL_APPLICABILITY as C} from '../scripts/content/campaign-label-applicability.mjs';
import {verifyRenderApplicabilityEvidence,verifyTerminalPixelReuse} from '../scripts/content/campaign-render-applicability.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/content-campaign/renderer-label-applicability.json',import.meta.url)));
function setup(sameBrowser=false){
 const bytes=new Map(Object.entries(fixture.files).map(([p,b])=>[p,gunzipSync(Buffer.from(b.data,'base64'))]));
 C.codeFiles.forEach(p=>bytes.set(p,fs.readFileSync(p)));
 const read=p=>{if(!bytes.has(p))throw Error('Missing '+p);return bytes.get(p);};
 const put=(p,v)=>{bytes.set(p,Buffer.isBuffer(v)?v:Buffer.from(JSON.stringify(v)));return {path:p,hash:hashValue(read(p))};};
 const scope=put('.agywork/content-campaign/test/label-scope.json',{format:'booklet-label-source-review-v1',accepted:true,pixelAcceptance:false,profile:{reviewerIdentity:'/root/source-reviewer',model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default'},sourceEvidence:fixture.facts});
 const review=put('.agywork/content-campaign/test/label-code.json',{format:'content-campaign-render-applicability-code-review-v1',accepted:true,authorIdentity:'/root/author',reviewerIdentity:'/root/code-reviewer',profile:{model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default'},files:C.codeFiles.map(p=>({path:p,hash:hashValue(read(p))}))});
 let currentEnvironmentReceipt=fixture.currentEnvironmentReceipt,browserProbe=fixture.browserProbe;
 if(sameBrowser){
  // SYNTHETIC guarded positive only. Actual old/current browser versions differ;
  // production evidence is never modified or accepted by this test.
  const old=JSON.parse(read(fixture.receiptReference.path)),current=JSON.parse(read(fixture.currentEnvironmentReceipt.path));
  const a=JSON.parse(read(old.renderEnvironment.path)),b=JSON.parse(read(current.renderEnvironment.path));b.browserVersion=a.browserVersion;
  current.renderEnvironment=put('.agywork/content-campaign/test/matching-browser-environment.json',b);
  currentEnvironmentReceipt=put('.agywork/content-campaign/test/matching-browser-receipt.json',current);browserProbe={...fixture.browserProbe,browserVersion:a.browserVersion};
 }
 const certificate={format:C.profile,originalRendererSignature:C.old,currentRendererSignature:C.current,activatedBy:{identity:'/root',at:new Date().toISOString()},scopeReview:scope,codeReview:review,currentEnvironmentReceipt,browserProbe};
 const facts=JSON.parse(read(fixture.facts.path));
 const args={read,currentManifest:JSON.parse(read(facts.currentManifest.path)),field:structuredClone(fixture.field),candidateHash:fixture.candidateHash,receiptReference:fixture.receiptReference,liveBrowser:browserProbe,addendumReference:put('.agywork/content-campaign/test/label-addendum.json',certificate)};
 return {bytes,read,put,args,certificate,facts};
}
test('702-file sole-label source transition passes only with a SYNTHETIC matching-browser environment',()=>{
 const f=setup(true),result=verifyRenderApplicabilityEvidence(f.args);assert.equal(result.applicability.profile,C.profile);assert.equal(result.applicability.originalRendererSignature,C.old);assert.equal(result.artifacts.length,fixture.field.diagramHashes.length);
});
test('native documents/teaching routes and changed whole-field/block values reject',()=>{
 for(const patch of [{value:{format:'maths-editor-document-v1',blocks:[]}},{teachingBlock:true},{route:'native-document'},{where:'teaching.activity'},{value:fixture.field.value+' changed'}]){const f=setup(true);Object.assign(f.args.field,patch);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args));}
});
test('extra deltas, stale source snapshots, missing proof and same-actor source acceptance reject',()=>{
 for(const mutate of [f=>f.args.currentManifest.files[0].hash='extra',f=>f.bytes.set(f.facts.sourcePair.before.path,Buffer.from('stale')),f=>f.bytes.set('src/components/InlineContent.svelte',Buffer.from('changed route')),f=>delete f.certificate.scopeReview,f=>{const p=JSON.parse(f.read(f.certificate.scopeReview.path));p.profile.reviewerIdentity='/root/author';f.certificate.scopeReview=f.put('.agywork/content-campaign/test/same.json',p);}]){const f=setup(true);mutate(f);f.args.addendumReference=f.put('.agywork/content-campaign/test/mutated.json',f.certificate);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args));}
});
test('changed original PNG, current browser, input and source facts cannot be relabelled',()=>{
 for(const mutate of [f=>{const r=JSON.parse(f.read(f.args.receiptReference.path));f.bytes.set(r.fields[0].artifacts[0].path,Buffer.from('bad PNG'));},f=>f.args.liveBrowser={...fixture.browserProbe,browserVersion:'different'},f=>{const r=JSON.parse(f.read(f.args.receiptReference.path));f.bytes.set(r.input.path,Buffer.from('{}'));},f=>f.bytes.set(fixture.facts.path,Buffer.from('{}'))]){const f=setup(true);mutate(f);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args));}
});

test('actual .93 historical/.97 current Chrome drift refuses applicability without weakening source guards',()=>{assert.throws(()=>verifyRenderApplicabilityEvidence(setup().args),/browser|viewport|font/);});
test('Medium terminal inspector eligibility is opt-in; authentic pixel and historical High gates remain',()=>{
 const f=setup(true),capture=verifyRenderApplicabilityEvidence(f.args),root=fs.mkdtempSync(path.join(os.tmpdir(),'label-applicability-'));
 try{
  for(const [p,bytes] of f.bytes){const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
  const row={where:f.args.field.where,hash:f.args.field.hash,accepted:true,renderedSourceHash:f.args.field.hash,renderedBlockHashes:f.args.field.diagramHashes,observation:'SYNTHETIC test observation',geometryObservation:'Synthetic geometry',paletteObservation:'Synthetic palette',inspectionMode:'fresh',actualPixelInspection:true,inspectedAt:new Date().toISOString(),renderReceipt:f.args.receiptReference};
  const document={candidateHash:f.args.candidateHash,reviewerProfile:{model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default',reviewerIdentity:'/root/synthetic'},visualReviews:[row]},p='.agywork/content-campaign/test/terminal.json';
  const put=()=>{const bytes=Buffer.from(JSON.stringify(document));fs.writeFileSync(path.join(root,p),bytes);return {path:p,hash:hashValue(bytes)};};
  assert.doesNotThrow(()=>verifyTerminalPixelReuse(root,f.args.field,put(),capture));
  assert.throws(()=>verifyTerminalPixelReuse(root,f.args.field,put(),{...capture,applicability:undefined}),/authentic terminal/);
  row.actualPixelInspection=false;assert.throws(()=>verifyTerminalPixelReuse(root,f.args.field,put(),capture),/authentic terminal/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
