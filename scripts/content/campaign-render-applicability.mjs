import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { parse } from 'acorn';
import { hashValue, inside } from './campaign-sources.mjs';
import { pngDimensions, campaignRendererDependencyManifest } from './campaign-visual-evidence.mjs';
import { splitInlineContent, groupTextBlocks } from '../../src/lib/inline-content.js';
import { theoryTextFields } from '../../src/lib/theory-content.js';
import * as annotated from '../../public/libs/maths-editor/annotated-equation.mjs';
import * as leader from '../../public/libs/maths-editor/cloze-leader.mjs';
import * as answer from '../../public/libs/maths-editor/cloze-answer.mjs';
import * as house from '../../public/libs/maths-editor/house-style.mjs';
import * as table from '../../public/libs/maths-editor/table-model.mjs';
import * as borders from '../../public/libs/maths-editor/table-borders.mjs';
import * as spacing from '../../public/libs/maths-editor/equation-spacing.mjs';
import { LAYOUT_APPLICABILITY, LAYOUT_APPLICABILITY_PROFILE, layoutSourceReferences, verifyLayoutSources } from './campaign-layout-applicability.mjs';
export { LAYOUT_APPLICABILITY_PROFILE };

export const RENDER_APPLICABILITY_PROFILE = 'campaign-three-delta-plain-fields-v1';
export const RENDER_APPLICABILITY_SCHEMA = 'docs/content-campaign-render-applicability.json';
const OLD = '4cd2b843783e4cfeac5fd36de4ae6209c4de8ea6d3fdfc0e14baad42a063f103';
const CURRENT = '34846abd00f95800e95763874920288a6603c9ce3f4e67ba31a462d1136b45d1';
const SOURCE_PROOF = 'ed4acd2e725ef253d08559ec336e9e99b45be745fc2faac39618842283ff154f';
const DELTAS = [
 ['public/libs/maths-editor/document-model.mjs','b36d117b2f69bba524cd37a56d0f519007b785835d8f287fe5d511b7145ec0b0','36747a2a48f3e3ea979874c1f81f387807fc4b7db9f3cd6b379ff92b98ada850'],
 ['src/components/BookletArrangement.svelte','9b39b17463e01260d45915d0e4b0f02077fe979d1277cd623c8f61abe63be75b','3fd71758ada0292fb41b70d2e1eba3ba0023dc909dee0ee267814b4856281f38'],
 ['src/lib/booklet-arrangement.js','318ad2038fc51ba1305dfc90ff1ea87c192bf02e45a8c85f45383a8a8487e2a9','4270bb3bffd87cb405442560401cbf8fa7a884fa6431928e04f3fc6aa7ee6fde'],
];
const codeFiles=['scripts/content/campaign-render-applicability.mjs','scripts/content/campaign-layout-applicability.mjs','scripts/content/campaign-support.mjs',RENDER_APPLICABILITY_SCHEMA,'tests/content-campaign-render-applicability.test.js','tests/fixtures/content-campaign/renderer-applicability-three-delta.json','docs/content-campaign.md'];
const fail = message => { throw new Error('Renderer applicability: '+message); };
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const operationBrowsers=new WeakMap();
// Query the producer's actual browser launcher, rather than treating an old
// captured environment as a live browser measurement. This is a headless
// version probe only: no application navigation, rendering or pixel claim.
export function probeApplicabilityBrowser(root){
 const launcher=pathToFileURL(createRequire(import.meta.url).resolve('playwright-core')).href;
 const script=`import fs from 'node:fs';import path from 'node:path';import playwright from ${JSON.stringify(launcher)};const {chromium}=playwright;let browser,executablePath=chromium.executablePath();try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});const candidates=[process.env.PROGRAMFILES,process.env['PROGRAMFILES(X86)'],process.env.LOCALAPPDATA].filter(Boolean).map(p=>path.join(p,'Google/Chrome/Application/chrome.exe')).filter(p=>fs.existsSync(p));if(candidates.length!==1){await browser.close();throw Error('Cannot uniquely bind actual Chrome executable');}executablePath=candidates[0];}try{console.log(JSON.stringify({browserVersion:browser.version(),executablePath,probedAt:new Date().toISOString()}));}finally{await browser.close();}`;
 const value=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:root,encoding:'utf8',windowsHide:true,timeout:30000}));
 return {...value,executableHash:hashValue(fs.readFileSync(value.executablePath))};
}
function browserBinding(value){
 if(!value?.browserVersion||!value.executablePath||!value.executableHash||!Number.isFinite(Date.parse(value.probedAt)))fail('actual live browser/executable measurement required');
 return {browserVersion:value.browserVersion,executablePath:value.executablePath,executableHash:value.executableHash};
}
function reader(root) { return relativePath=>fs.readFileSync(inside(root,relativePath)); }
function artifact(read,reference){
 if(!reference?.path||!reference.hash||!reference.path.startsWith('.agywork/content-campaign/'))fail('immutable campaign reference required');
 const bytes=read(reference.path);if(hashValue(bytes)!==reference.hash)fail('evidence changed: '+reference.path);return JSON.parse(bytes);
}
function codeAcceptance(read,reference,files=codeFiles){
 const review=artifact(read,reference);
 if(review.format!=='content-campaign-render-applicability-code-review-v1'||review.accepted!==true||!review.authorIdentity?.startsWith('/root/')||!review.reviewerIdentity?.startsWith('/root/')||review.authorIdentity===review.reviewerIdentity||review.profile?.model!=='gpt-6.1-sol'||review.profile?.effort!=='high'||review.profile?.requestedServiceTier!=='default')fail('different-worker accepted code review required');
 for(const file of files){const row=review.files?.find(r=>r.path===file);if(!row||hashValue(read(file))!==row.hash)fail('accepted code/schema bytes changed: '+file);}
 return review;
}
function verifiedSources(read,proof,oldManifest,currentManifest){
 if(hashValue(oldManifest)!==OLD||hashValue(currentManifest)!==CURRENT||oldManifest.files.length!==700||currentManifest.files.length!==700)fail('exact complete old/current 700-file manifests required');
 const oldMap=new Map(oldManifest.files.map(r=>[r.path,r.hash])),currentMap=new Map(currentManifest.files.map(r=>[r.path,r.hash]));
 if(oldMap.size!==700||currentMap.size!==700||oldMap.size!==currentMap.size||[...oldMap.keys()].some(p=>!currentMap.has(p)))fail('manifest membership changed');
 const changed=[...oldMap].filter(([p,h])=>currentMap.get(p)!==h).map(([p])=>p).sort();
 if(!same(changed,DELTAS.map(r=>r[0]).sort()))fail('extra/missing renderer delta');
 const sources={};
 for(const [file,before,after] of DELTAS){
  if(oldMap.get(file)!==before||currentMap.get(file)!==after)fail('unreviewed renderer bytes: '+file);
  const old=proof.oldSources?.find(r=>r.path===file);if(old?.recordedOldHash!==before||old.reconstructedOldSource?.hash!==before)fail('old source snapshot missing');
  const oldBytes=read(old.reconstructedOldSource.path),newBytes=read(file);if(hashValue(oldBytes)!==before||hashValue(newBytes)!==after)fail('source snapshot changed');
  sources[file]={before:oldBytes.toString('utf8'),current:newBytes.toString('utf8')};
 }
 // Exact hashes above fix the reviewed bodies. This independent structural check
 // also establishes that no parser/schema/import/top-level initializer is waived.
 const doc=sources[DELTAS[0][0]], declarations=source=>parse(source,{sourceType:'module',ecmaVersion:'latest'}).body.map(node=>({name:(node.declaration||node).id?.name||null,type:node.type,text:source.slice(node.start,node.end)}));
 const before=declarations(doc.before),after=declarations(doc.current);
 if(before.length!==after.length||before.some((row,index)=>row.text!==after[index].text&&(row.name!=='renderDocument'||after[index].name!=='renderDocument')))fail('active parser/import/initializer changed');
 const styles=source=>[...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(r=>r[0]);
 if(!same(styles(sources[DELTAS[1][0]].before),styles(sources[DELTAS[1][0]].current)))fail('global component CSS changed');
 return sources;
}
const helpers={...annotated,...leader,...answer,...house,...table,...borders,...spacing};
function documentRenderer(source){
 const ast=parse(source,{sourceType:'module',ecmaVersion:'latest'}),edits=[];
 for(const node of ast.body){
  if(node.type==='ImportDeclaration'){
   for(const spec of node.specifiers)if(spec.type!=='ImportSpecifier'||!(spec.imported.name in helpers))fail('unknown document helper');
   edits.push([node.start,node.end,'']);
  }else if(node.type==='ExportNamedDeclaration'){
   if(!node.declaration)fail('unknown document export');edits.push([node.start,node.declaration.start,'']);
  }
 }
 let code=source;for(const [start,end,text] of edits.sort((a,b)=>b[0]-a[0]))code=code.slice(0,start)+text+code.slice(end);
 // Consistent deterministic UID sequences are supplied to BOTH modules; output
 // is compared exactly, never stripped of native mathematics or presentation.
 let id=0;const sandbox={...helpers,crypto:{randomUUID:()=>`applicability-node-${++id}`}};
 return vm.runInNewContext(code+'\n({renderDocument,readSourceList});',sandbox,{timeout:1000});
}
export function verifyPlainFieldFeatures(value,{beforeSource,currentSource}){
 if(typeof value!=='string')fail('structured/unknown field type requires current affected pixels');
 const parsed=splitInlineContent(value);if(parsed.errors.length)fail('malformed whole field');
 const old=documentRenderer(beforeSource),current=documentRenderer(currentSource);const lists=[];
 for(const part of parsed.parts.filter(p=>p.type==='text')){
  const blocks=groupTextBlocks(part.value);
  for(const block of blocks){
   if(!['line','blank','list'].includes(block.kind))fail('unknown text block');
   if(block.kind==='list'){
    const check=node=>{if(node&&typeof node==='object'){if(node.type&&!['list','list-item','paragraph','text','math','break'].includes(node.type))fail('unsupported list node: '+node.type);for(const child of Object.values(node))if(Array.isArray(child))child.forEach(check);else if(child&&typeof child==='object')check(child);}};check(block.list);
    const document={format:'maths-editor-document-v1',version:1,blocks:[block.list]},a=old.renderDocument(document),b=current.renderDocument(document);if(a!==b)fail('source-list rendered HTML changed');lists.push({listHash:hashValue(block.list),htmlHash:hashValue(a)});
   }
  }
 }
 return {profile:'whole-plain-string-and-source-lists-v1',fieldHash:hashValue(value),tikzBlocks:parsed.parts.filter(p=>p.type==='tikz').length,listComparisons:lists,exactListHtml:true};
}

function applicabilityConfig(profile){
 if(profile===LAYOUT_APPLICABILITY_PROFILE)return LAYOUT_APPLICABILITY;
 if(profile===RENDER_APPLICABILITY_PROFILE)return {profile,old:OLD,current:CURRENT,sourceProof:SOURCE_PROOF,codeFiles};
 fail('unknown applicability profile');
}
function profileEvidence(read,readArtifact,proof,reference,currentManifest,field,accepted,config){
 if(reference.hash!==config.sourceProof)fail('exact independent source applicability proof required');
 const refs=config.profile===LAYOUT_APPLICABILITY_PROFILE?layoutSourceReferences(proof):proof;
 const oldManifest=readArtifact(read,refs.oldManifest),recordedCurrent=readArtifact(read,refs.currentManifest);
 if(!same(currentManifest,recordedCurrent))fail('current complete renderer manifest changed');
 let source;
 if(config.profile===LAYOUT_APPLICABILITY_PROFILE)source=verifyLayoutSources(read,ref=>readArtifact(read,ref),proof,oldManifest,currentManifest,accepted.authorIdentity);
 else {
  if(proof.format!=='bounded-renderer-three-delta-scope-review-v1'||proof.profile?.reviewerIdentity===accepted.authorIdentity||proof.profile?.model!=='gpt-6.1-sol'||proof.profile?.effort!=='high')fail('exact independent source applicability proof required');
  const sources=verifiedSources(read,proof,oldManifest,currentManifest);source={beforeSource:sources[DELTAS[0][0]].before,currentSource:sources[DELTAS[0][0]].current};
 }
 return {oldManifest,features:verifyPlainFieldFeatures(field.value,source)};
}

// Pure injectable reader/manifest interface permits adversarial temp-fixture
// tests. Production support always supplies actual workspace bytes/manifests.
export function verifyRenderApplicabilityEvidence({read,currentManifest,addendumReference,field,candidateHash,receiptReference,liveBrowser}){
 const addendum=artifact(read,addendumReference);
 const config=applicabilityConfig(addendum.format),{old:OLD,current:CURRENT}=config;
 if(addendum.format!==config.profile||addendum.originalRendererSignature!==OLD||addendum.currentRendererSignature!==CURRENT||addendum.activatedBy?.identity!=='/root'||!Number.isFinite(Date.parse(addendum.activatedBy?.at)))fail('explicit coordinator activation required');
 const accepted=codeAcceptance(read,addendum.codeReview,config.codeFiles),proof=artifact(read,addendum.scopeReview);
 const {oldManifest,features}=profileEvidence(read,artifact,proof,addendum.scopeReview,currentManifest,field,accepted,config);
 if(features.fieldHash!==field.hash||!same([...field.value.matchAll(/\[tikz\][\s\S]*?\[\/tikz\]/g)].map(r=>hashValue(r[0])),field.diagramHashes))fail('whole field/block binding changed');
 const receipt=artifact(read,receiptReference);
 if(receipt.format!=='content-campaign-render-v1'||receipt.producer!=='scripts/shoot-tikz.mjs'||receipt.candidateHash!==candidateHash||receipt.rendererSignature!==OLD||receipt.rendererDependencyProfile!=='content-campaign-render-dependencies-v2')fail('original canonical receipt identity changed');
 if(!same(artifact(read,receipt.rendererDependencies),oldManifest))fail('original complete renderer manifest changed');
 const environment=artifact(read,receipt.renderEnvironment);if(!environment)fail('original browser/environment evidence missing');
 const currentReceipt=artifact(read,addendum.currentEnvironmentReceipt),currentEnvironment=artifact(read,currentReceipt.renderEnvironment);
 if(currentReceipt.format!=='content-campaign-render-v1'||currentReceipt.producer!=='scripts/shoot-tikz.mjs'||currentReceipt.rendererSignature!==CURRENT||currentReceipt.rendererDependencyProfile!=='content-campaign-render-dependencies-v2'||!same(artifact(read,currentReceipt.rendererDependencies),currentManifest)||!Number.isFinite(Date.parse(currentReceipt.capturedAt))||Date.parse(currentReceipt.capturedAt)>Date.parse(addendum.activatedBy.at))fail('genuine current-signature browser capture required');
 const fontInventory=view=>view.fonts.map(({family,style,weight})=>({family,style,weight}));
 const views=env=>{if(env.format!=='tikz-capture-environment-v1'||!env.browserVersion||!Array.isArray(env.viewports)||!env.viewports.length)fail('browser environment invalid');return env.viewports.map(view=>{if(!view.userAgent||!(view.devicePixelRatio>0)||!(view.viewport?.width>0)||!(view.viewport?.height>0)||view.fontStatus!=='loaded'||!Array.isArray(view.fonts)||view.fonts.some(font=>!font.family||!font.style||!font.weight||!['loaded','unloaded'].includes(font.status)))fail('browser/font contract invalid');return {userAgent:view.userAgent,devicePixelRatio:view.devicePixelRatio,viewport:view.viewport,fontStatus:view.fontStatus,fonts:fontInventory(view)};});};
 const originalViews=views(environment),currentViews=views(currentEnvironment);
 if(environment.browserVersion!==currentEnvironment.browserVersion||originalViews.some(view=>!currentViews.some(current=>same(view,current))))fail('current browser/viewport/font contract differs from original');
 if(!same(browserBinding(liveBrowser),browserBinding(addendum.browserProbe))||liveBrowser.browserVersion!==currentEnvironment.browserVersion||Date.parse(liveBrowser.probedAt)<Date.parse(currentReceipt.capturedAt))fail('live browser changed since captured/activated environment');
 // This current producer receipt supplies environment evidence, not new visual
 // acceptance. Require its captured input/manifest/artifact bytes to remain real.
 const environmentManifest=artifact(read,currentReceipt.manifest),environmentInput=artifact(read,currentReceipt.input).items;
 if(!Array.isArray(environmentInput)||!Array.isArray(environmentManifest)||!currentReceipt.fields?.length)fail('current environment producer capture missing');
 for(const image of currentReceipt.fields.flatMap(field=>field.artifacts||[])){const bytes=read(image.path),dimensions=pngDimensions(bytes),record=environmentManifest.find(row=>row.auditId===image.auditId);if(image.status!=='pass'||hashValue(bytes)!==image.hash||dimensions.width!==image.width||dimensions.height!==image.height||record?.status!=='pass'||record.png!==path.basename(image.path)||!environmentInput.some(row=>row.auditId===image.auditId))fail('current environment producer evidence changed');}
 const input=artifact(read,receipt.input).items,manifest=artifact(read,receipt.manifest),capture=receipt.fields?.find(r=>r.where===field.where);
 if(!capture||capture.fieldHash!==field.hash||!same(capture.blockHashes,field.diagramHashes)||capture.artifacts.length!==field.diagramHashes.length)fail('canonical whole field/block capture changed');
 for(const [index,image] of capture.artifacts.entries()){
  const item=input.find(r=>r.auditId===image.auditId),record=manifest.find(r=>r.auditId===image.auditId),bytes=read(image.path),size=pngDimensions(bytes);
  if(image.blockIndex!==index||image.blockHash!==field.diagramHashes[index]||image.status!=='pass'||hashValue(bytes)!==image.hash||size.width!==image.width||size.height!==image.height||item?.field!==`${field.where}[${index}]`||hashValue('[tikz]'+item?.code+'[/tikz]')!==image.blockHash||item.q!==field.value.replace(/\[tikz\][\s\S]*?\[\/tikz\]/g,'').trim()||record?.status!=='pass'||path.basename(image.path)!==record.png)fail('original PNG/input/geometry attribution changed');
 }
 codeAcceptance(read,addendum.codeReview,config.codeFiles);
 return {...capture,applicability:{reference:addendumReference,profile:config.profile,originalRendererSignature:OLD,currentRendererSignature:CURRENT,scopeReview:addendum.scopeReview,codeReview:addendum.codeReview,features,originalRenderEnvironment:receipt.renderEnvironment,currentEnvironmentReceipt:addendum.currentEnvironmentReceipt,currentRenderEnvironment:currentReceipt.renderEnvironment,liveBrowser,originalReceipt:receiptReference}};
}
export function verifyApplicableRenderReceipt(root,candidateHash,field,receiptReference,addendumReference,context){
 const manifest=campaignRendererDependencyManifest(root);if(context?.signature!==hashValue(manifest))fail('operation renderer context changed');
 let liveBrowser=operationBrowsers.get(context);if(!liveBrowser){liveBrowser=probeApplicabilityBrowser(root);operationBrowsers.set(context,liveBrowser);}
 if(hashValue(fs.readFileSync(liveBrowser.executablePath))!==liveBrowser.executableHash)fail('browser executable changed during operation');
 const result=verifyRenderApplicabilityEvidence({read:reader(root),currentManifest:manifest,addendumReference,field,candidateHash,receiptReference,liveBrowser});
 if(hashValue(fs.readFileSync(liveBrowser.executablePath))!==liveBrowser.executableHash)fail('browser executable changed during operation');
 if(hashValue(campaignRendererDependencyManifest(root))!==context.signature)fail('renderer changed during applicability validation');return result;
}
export function bindCurrentRenderField(candidate,candidateHash,field){
 if(hashValue({content:candidate?.content,quiz:candidate?.quiz})!==candidateHash)fail('current whole candidate changed');
 const fields=theoryTextFields(candidate.content.theory).map(({obj,key,where})=>({where:'theory.'+where,value:obj[key]}));
 for(const tier of ['foundation','development','mastery'])for(const [index,item] of (candidate.content.practice?.[tier]||[]).entries())for(const key of ['question_text','solution_text'])fields.push({where:`practice.${tier}[${index}].${key}`,value:item[key]});
 for(const item of candidate.quiz?.questions||[])for(const key of ['question_text','solution_text'])fields.push({where:`quiz.${item.id}.${key}`,value:item[key]});
 const current=fields.filter(row=>row.where===field.where);if(current.length!==1||hashValue(current[0].value)!==field.hash||!same([...current[0].value.matchAll(/\[tikz\][\s\S]*?\[\/tikz\]/g)].map(row=>hashValue(row[0])),field.diagramHashes))fail('persisted whole field/block binding changed');
 return {...field,value:current[0].value};
}
export function verifyTerminalPixelReuse(root,field,reference,currentCapture,profileReference=null){
 const read=reader(root),seen=new Set();let ref=reference;
 for(let depth=0;depth<12;depth++){
  if(seen.has(ref?.path))fail('cyclic original inspection attribution');seen.add(ref?.path);
  const document=artifact(read,ref),rows=document.visualReviews?.filter(r=>r.where===field.where&&r.hash===field.hash),row=rows?.[0];
  if(rows?.length!==1||row.accepted!==true||row.renderedSourceHash!==field.hash||!same(row.renderedBlockHashes,field.diagramHashes)||!row.observation?.trim()||!row.geometryObservation?.trim()||!row.paletteObservation?.trim())fail('genuine positive original inspection missing');
  if(row.inspectionMode==='identical-png-reuse'){
   ref=row.reusedInspection?.review||row.reusedInspection?.artifact;if(!ref)fail('terminal original inspection missing');continue;
  }
  const profile=document.reviewerProfile||(profileReference&&artifact(read,profileReference));
  if(row.inspectionMode!=='fresh'||row.actualPixelInspection!==true||profile?.model!=='gpt-6.1-sol'||profile?.effort!=='high'||profile?.requestedServiceTier!=='default'||!profile?.reviewerIdentity?.trim())fail('authentic terminal actual inspector/profile required');
  const receipt=artifact(read,row.renderReceipt),capture=receipt.fields?.find(f=>f.where===field.where);
  if(receipt.format!=='content-campaign-render-v1'||receipt.producer!=='scripts/shoot-tikz.mjs'||(document.candidateHash&&receipt.candidateHash!==document.candidateHash)||capture?.fieldHash!==field.hash||!same(capture.blockHashes,field.diagramHashes)||capture.artifacts.length!==currentCapture.artifacts.length||!Number.isFinite(Date.parse(row.inspectedAt))||!Number.isFinite(Date.parse(receipt.capturedAt))||Date.parse(row.inspectedAt)<Date.parse(receipt.capturedAt))fail('terminal original receipt/capture timestamp changed');
  const input=artifact(read,receipt.input).items,manifest=artifact(read,receipt.manifest);
  for(const [index,image] of capture.artifacts.entries()){
   const bytes=read(image.path),size=pngDimensions(bytes),item=input.find(r=>r.auditId===image.auditId),record=manifest.find(r=>r.auditId===image.auditId);
   if(image.blockIndex!==index||image.blockHash!==field.diagramHashes[index]||image.status!=='pass'||hashValue(bytes)!==image.hash||size.width!==image.width||size.height!==image.height||item?.field!==`${field.where}[${index}]`||hashValue('[tikz]'+item?.code+'[/tikz]')!==image.blockHash||record?.status!=='pass'||path.basename(image.path)!==record.png||!bytes.equals(read(currentCapture.artifacts[index].path)))fail('terminal original PNG/input exact equality changed');
  }
  return {reference:ref,profile,inspectionHash:hashValue(row),originalReceipt:row.renderReceipt,actualInspectedAt:row.inspectedAt};
 }
 fail('original inspection chain too deep');
}
export function activateRenderApplicability(root,{scopeReview,codeReview,currentEnvironmentReceipt,coordinatorIdentity,out,profile=RENDER_APPLICABILITY_PROFILE}){
 if(coordinatorIdentity!=='/root'||!out?.startsWith('.agywork/content-campaign/'))fail('explicit coordinator activation/output required');
 const config=applicabilityConfig(profile),{old:OLD,current:CURRENT,sourceProof:SOURCE_PROOF}=config;
 const read=reader(root);const accepted=codeAcceptance(read,codeReview,config.codeFiles);const proof=artifact(read,scopeReview);if(scopeReview.hash!==SOURCE_PROOF)fail('unreviewed source proof');
 const current=campaignRendererDependencyManifest(root);profileEvidence(read,artifact,proof,scopeReview,current,{value:'Activation feature preflight only.'},accepted,config);
 const receipt=artifact(read,currentEnvironmentReceipt),environment=artifact(read,receipt.renderEnvironment),browserProbe=probeApplicabilityBrowser(root);if(receipt.rendererSignature!==CURRENT||receipt.producer!=='scripts/shoot-tikz.mjs'||environment.browserVersion!==browserProbe.browserVersion||!same(artifact(read,receipt.rendererDependencies),current))fail('current captured/live browser binding required');
 const value={format:config.profile,originalRendererSignature:OLD,currentRendererSignature:CURRENT,scopeReview,codeReview,currentEnvironmentReceipt,browserProbe,activatedBy:{identity:coordinatorIdentity,at:new Date().toISOString()},limits:'Exact reviewed three deltas and supported whole plain/string-list fields only. Original captures, signatures, inspectors and pixels remain unchanged; no new pixel or unrelated application acceptance.'};
 const file=inside(root,out);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});return {path:out,hash:hashValue(fs.readFileSync(file))};
}
