import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {hashValue} from '../scripts/content/campaign-sources.mjs';
import {verifyRenderApplicabilityEvidence,verifyPlainFieldFeatures,verifyTerminalPixelReuse,bindCurrentRenderField,RENDER_APPLICABILITY_SCHEMA} from '../scripts/content/campaign-render-applicability.mjs';
import {verifyCampaignRenderReceipt} from '../scripts/content/campaign-visual-evidence.mjs';
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/content-campaign/renderer-applicability-three-delta.json',import.meta.url)));
const codeFiles=['scripts/content/campaign-render-applicability.mjs','scripts/content/campaign-layout-applicability.mjs','scripts/content/campaign-support.mjs',RENDER_APPLICABILITY_SCHEMA,'tests/content-campaign-render-applicability.test.js','tests/fixtures/content-campaign/renderer-applicability-three-delta.json','docs/content-campaign.md'];
function setup(){
 const bytes=new Map(Object.entries(fixture.files).map(([p,b])=>[p,gunzipSync(Buffer.from(b.data,'base64'))]));
 for(const p of codeFiles)bytes.set(p,fs.readFileSync(p));
 const put=(p,v)=>{bytes.set(p,Buffer.isBuffer(v)?v:Buffer.from(JSON.stringify(v)));return {path:p,hash:hashValue(bytes.get(p))};};
 const read=p=>{if(!bytes.has(p))throw Error('Missing fixture '+p);return bytes.get(p);};
 const review=put('.agywork/content-campaign/test/code-review.json',{format:'content-campaign-render-applicability-code-review-v1',accepted:true,authorIdentity:'/root/author',reviewerIdentity:'/root/independent',profile:{model:'gpt-6.1-sol',effort:'high',requestedServiceTier:'default'},files:codeFiles.map(p=>({path:p,hash:hashValue(read(p))})),note:'SYNTHETIC test only; not a real activation or inspection.'});
 const certificate={format:'campaign-three-delta-plain-fields-v1',originalRendererSignature:'4cd2b843783e4cfeac5fd36de4ae6209c4de8ea6d3fdfc0e14baad42a063f103',currentRendererSignature:'34846abd00f95800e95763874920288a6603c9ce3f4e67ba31a462d1136b45d1',activatedBy:{identity:'/root',at:'2026-10-01T06:00:00Z'},scopeReview:fixture.scopeReview,codeReview:review,currentEnvironmentReceipt:fixture.currentEnvironmentReceipt,browserProbe:fixture.browserProbe};
 const addendumReference=put('.agywork/content-campaign/test/addendum.json',certificate),proof=JSON.parse(read(fixture.scopeReview.path)),currentManifest=JSON.parse(read(proof.currentManifest.path));
 const args={read,currentManifest,addendumReference,field:structuredClone(fixture.field),candidateHash:fixture.candidateHash,receiptReference:fixture.receiptReference,liveBrowser:structuredClone(fixture.browserProbe)};
 return {bytes,read,put,args,certificate,proof,review};
}
test('exact reviewed manifests/whole field retain original capture signature and zero new pixel claims',()=>{
 const f=setup(),r=verifyRenderApplicabilityEvidence(f.args);
 assert.equal(r.applicability.originalRendererSignature,f.certificate.originalRendererSignature);assert.equal(r.applicability.currentRendererSignature,f.certificate.currentRendererSignature);assert.equal(r.applicability.features.fieldHash,fixture.field.hash);assert.equal(r.artifacts.length,1);
 assert.equal(JSON.parse(f.read(fixture.receiptReference.path)).rendererSignature,f.certificate.originalRendererSignature);
});

test('live browser upgrade/binary drift and current captured font/viewport evidence cannot reuse a historical environment',()=>{
 for(const mutate of [f=>delete f.args.liveBrowser,f=>f.args.liveBrowser.browserVersion='155.0.0',f=>f.args.liveBrowser.executableHash='upgraded binary',f=>f.args.liveBrowser.probedAt='2026-09-01T00:00:00Z',f=>delete f.certificate.currentEnvironmentReceipt]){
  const f=setup();mutate(f);f.args.addendumReference=f.put('.agywork/content-campaign/test/environment-addendum.json',f.certificate);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/browser|reference/);
 }
 for(const mutate of [e=>e.browserVersion='155',e=>e.viewports[0].devicePixelRatio=1,e=>e.viewports[0].viewport.width=1200,e=>e.viewports[0].fontStatus='loading',e=>e.viewports[0].fonts[0].family='wrong font']){
  const f=setup(),receipt=JSON.parse(f.read(fixture.currentEnvironmentReceipt.path)),environment=JSON.parse(f.read(receipt.renderEnvironment.path));mutate(environment);receipt.renderEnvironment=f.put('.agywork/content-campaign/test/altered-current-env.json',environment);f.certificate.currentEnvironmentReceipt=f.put('.agywork/content-campaign/test/altered-current-receipt.json',receipt);f.args.addendumReference=f.put('.agywork/content-campaign/test/altered-env-addendum.json',f.certificate);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/browser|font|contract/);
 }
 const f=setup(),receipt=JSON.parse(f.read(fixture.currentEnvironmentReceipt.path));receipt.rendererSignature=f.certificate.originalRendererSignature;f.certificate.currentEnvironmentReceipt=f.put('.agywork/content-campaign/test/old-as-current.json',receipt);f.args.addendumReference=f.put('.agywork/content-campaign/test/old-env-addendum.json',f.certificate);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/current-signature/);
});
test('persisted requiredVisuals recover complete actual whole-field bytes only from the current hash-bound candidate',()=>{
 const candidate={content:{theory:{facts:Array.from({length:6},(_,i)=>i===5?fixture.field.value:'Other fact.' )},practice:{foundation:[]}},quiz:null},candidateHash=hashValue(candidate),persisted={where:fixture.field.where,hash:fixture.field.hash,diagramHashes:fixture.field.diagramHashes};
 assert.equal(persisted.value,undefined);const bound=bindCurrentRenderField(candidate,candidateHash,persisted);assert.equal(bound.value,fixture.field.value);
 const f=setup();assert.equal(verifyRenderApplicabilityEvidence({...f.args,field:bound}).fieldHash,fixture.field.hash);
 const changed=structuredClone(candidate);changed.content.theory.facts[5]+='changed prose';assert.throws(()=>bindCurrentRenderField(changed,candidateHash,persisted),/whole candidate/);
 assert.throws(()=>bindCurrentRenderField(changed,hashValue(changed),persisted),/whole field\/block/);
});
test('coordinator activation and different-worker accepted exact code/schema are mandatory',()=>{
 for(const mutate of [c=>c.activatedBy.identity='/root/author',c=>delete c.codeReview,c=>c.currentRendererSignature=c.originalRendererSignature]){
  const f=setup();mutate(f.certificate);f.args.addendumReference=f.put('.agywork/content-campaign/test/bad-addendum.json',f.certificate);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/applicability|reference/);
 }
 const f=setup(),review=JSON.parse(f.read(f.review.path));review.reviewerIdentity=review.authorIdentity;f.certificate.codeReview=f.put('.agywork/content-campaign/test/self-review.json',review);f.args.addendumReference=f.put('.agywork/content-campaign/test/self-addendum.json',f.certificate);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/different-worker/);
 const stale=setup();stale.bytes.set(codeFiles[0],Buffer.from('changed code'));assert.throws(()=>verifyRenderApplicabilityEvidence(stale.args),/code\/schema bytes changed/);
});
test('extra delta, active parser/current source, altered snapshot/proof and manifest membership reject',()=>{
 const mutations=[f=>f.args.currentManifest.files.find(r=>r.path==='src/app.css').hash='extra',f=>f.args.currentManifest.files.pop(),f=>f.bytes.set('public/libs/maths-editor/document-model.mjs',Buffer.from('parser changed')),f=>f.bytes.set(f.proof.oldSources[0].reconstructedOldSource.path,Buffer.from('old changed')),f=>f.bytes.set(fixture.scopeReview.path,Buffer.from('altered proof'))];
 for(const mutate of mutations){const f=setup();mutate(f);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/applicability/);}
});
test('actual parser permits native array/colour prose and complete bold/math lists; structured/table/bubble types reject',()=>{
 const f=setup(),beforeSource=f.read(f.proof.oldSources[0].reconstructedOldSource.path).toString(),currentSource=f.read('public/libs/maths-editor/document-model.mjs').toString();
 const value='Use the word table without making a table.\n1. **Use $n=k$.**\n2. Use $\\begin{array}{c}3\\\\7\\end{array}$.\n3. Keep $\\color{blue}{x}$.';
 const result=verifyPlainFieldFeatures(value,{beforeSource,currentSource});assert.equal(result.listComparisons.length,1);assert.equal(result.exactListHtml,true);
 for(const value of [{format:'maths-editor-document-v1',blocks:[{type:'table',rows:[]}]},{type:'speechBubble'},null,42])assert.throws(()=>verifyPlainFieldFeatures(value,{beforeSource,currentSource}),/structured\/unknown/);
});
test('whole field, native geometry, caption, candidate, original environment, PNG and canonical input are bound',()=>{
 const mutations=[f=>f.args.field.value+=' changed caption',f=>f.args.candidateHash='wrong',f=>f.args.field.diagramHashes[0]='wrong',f=>{const r=JSON.parse(f.read(fixture.receiptReference.path));f.bytes.set(r.renderEnvironment.path,Buffer.from('other browser'));},f=>f.bytes.set(fixture.field.artifacts[0].path,Buffer.from('not image')),f=>{const r=JSON.parse(f.read(fixture.receiptReference.path));f.bytes.set(r.input.path,Buffer.from('other input'));}];
 for(const mutate of mutations){const f=setup();mutate(f);assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/applicability|PNG/);}
});
test('a concurrent accepted support-code change cannot pass an earlier successful check',()=>{
 const f=setup(),read=f.args.read;let changed=false;
 f.args.read=p=>{const bytes=read(p);if(p===fixture.field.artifacts[0].path&&!changed){changed=true;f.bytes.set('scripts/content/campaign-support.mjs',Buffer.from('concurrent code change'));}return bytes;};
 assert.throws(()=>verifyRenderApplicabilityEvidence(f.args),/code\/schema bytes changed/);assert.equal(changed,true);
});
test('ordinary verifier remains strict and rejects the old receipt without an applicability addendum',t=>{
 const f=setup(),root=fs.mkdtempSync(path.join(os.tmpdir(),'applicability-default-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const [p,b] of f.bytes){const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,b);}
 assert.throws(()=>verifyCampaignRenderReceipt(root,fixture.candidateHash,fixture.field,fixture.receiptReference),/renderer mismatch/);
});
test('authentic terminal pixel origin is required and intermediate accepted flags cannot replace it',t=>{
 const f=setup(),root=fs.mkdtempSync(path.join(os.tmpdir(),'applicability-origin-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const write=(p,v)=>{const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,Buffer.isBuffer(v)?v:Buffer.from(JSON.stringify(v)));return {path:p,hash:hashValue(fs.readFileSync(file))};};for(const [p,b] of f.bytes)write(p,b);
 const current=verifyRenderApplicabilityEvidence(f.args),positive=verifyTerminalPixelReuse(root,fixture.field,fixture.originalInspection,current);assert.equal(positive.profile.reviewerIdentity,'/root/review_plan_sol61');
 const original=JSON.parse(f.read(fixture.originalInspection.path)),negative=structuredClone(original);negative.visualReviews[0].accepted=false;
 assert.throws(()=>verifyTerminalPixelReuse(root,fixture.field,write('.agywork/content-campaign/test/negative.json',negative),current),/positive original/);
 const intermediate=structuredClone(original);intermediate.visualReviews[0].inspectionMode='identical-png-reuse';intermediate.visualReviews[0].actualPixelInspection=false;delete intermediate.visualReviews[0].reusedInspection;
 assert.throws(()=>verifyTerminalPixelReuse(root,fixture.field,write('.agywork/content-campaign/test/nonterminal.json',intermediate),current),/terminal original/);
 const badProfile=structuredClone(original);delete badProfile.reviewerProfile.requestedServiceTier;
 assert.throws(()=>verifyTerminalPixelReuse(root,fixture.field,write('.agywork/content-campaign/test/invented-settings.json',badProfile),current),/authentic terminal/);
 const changed=structuredClone(current);changed.artifacts[0].path='.agywork/content-campaign/test/changed.png';write(changed.artifacts[0].path,Buffer.from('different bytes'));
 assert.throws(()=>verifyTerminalPixelReuse(root,fixture.field,fixture.originalInspection,changed),/exact equality/);
});

// The historical source/pixel profile also imports the new helper. Current code
// acceptance must bind it; historical six-file reviews are never migrated.
test('historical profile rejects an omitted or concurrently changed imported layout helper',()=>{
 const helper='scripts/content/campaign-layout-applicability.mjs';
 const valid=setup();assert.doesNotThrow(()=>verifyRenderApplicabilityEvidence(valid.args));
 const omitted=setup(),review=JSON.parse(omitted.read(omitted.review.path));
 review.files=review.files.filter(row=>row.path!==helper);
 omitted.certificate.codeReview=omitted.put('.agywork/content-campaign/test/old-six-only.json',review);
 omitted.args.addendumReference=omitted.put('.agywork/content-campaign/test/old-six-addendum.json',omitted.certificate);
 assert.throws(()=>verifyRenderApplicabilityEvidence(omitted.args),/accepted code\/schema bytes changed/);
 const changed=setup();changed.bytes.set(helper,Buffer.from('throw Error("unreviewed imported initializer");'));
 assert.throws(()=>verifyRenderApplicabilityEvidence(changed.args),/accepted code\/schema bytes changed/);
});
