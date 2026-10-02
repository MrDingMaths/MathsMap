import { parse } from 'acorn';
import { hashValue } from './campaign-sources.mjs';

// One independently reviewed source transition; never a general exclusion of
// arrangement modules, active geometry, or the complete renderer manifest.
export const LAYOUT_APPLICABILITY_PROFILE = 'campaign-three-layout-delta-native-fields-v1';
export const LAYOUT_APPLICABILITY_SCHEMA = 'docs/content-campaign-layout-applicability.json';
export const LAYOUT_APPLICABILITY = Object.freeze({
 profile: LAYOUT_APPLICABILITY_PROFILE,
 old: 'f422760b2f342bfa517193a4df2bcfe1ff6ff45fa178c23217cf22354fa8655b',
 current: '01b5d2a74a51e184819d6d8a9e0f93ffc591a9334083d35250b33043b1d96739',
 sourceProof: 'e80d7da69b7d9b33f96b56c123ae3735f335192ce89deff466b27d14906ec348',
 deltas: [
  ['public/libs/maths-editor/arrangement-model.mjs','d117a7e6b464099e21201132327b448539ebac8feea4962e2647fddabeb67a88','99e4ff47ff2a940682c667520a4c195dd3ee02da68a0171adc94c12a5a798f27'],
  ['src/components/BookletArrangement.svelte','3fd71758ada0292fb41b70d2e1eba3ba0023dc909dee0ee267814b4856281f38','40f452ed1286b9ea1a97d795772a6fd14d45f9a0a070836ed733850ba39d0eab'],
  ['src/lib/booklet-arrangement.js','4270bb3bffd87cb405442560401cbf8fa7a884fa6431928e04f3fc6aa7ee6fde','9f50f7ae64c528e83868cda962bf0ef053876c52d405d8607dc6bf6fa4b7225d'],
 ],
 codeFiles: ['scripts/content/campaign-render-applicability.mjs','scripts/content/campaign-layout-applicability.mjs','scripts/content/campaign-support.mjs',LAYOUT_APPLICABILITY_SCHEMA,'docs/content-campaign-render-applicability.json','tests/content-campaign-render-applicability.test.js','tests/content-campaign-layout-applicability.test.js','tests/fixtures/content-campaign/renderer-layout-applicability.json','docs/content-campaign.md'],
});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=message=>{throw Error('Renderer applicability: '+message);};
export function layoutSourceReferences(proof) {
 return {oldManifest:proof.baseline?.manifest,currentManifest:proof.fixedTarget?.manifest};
}
export function verifyLayoutSources(read,artifact,proof,oldManifest,currentManifest,authorIdentity) {
 const config=LAYOUT_APPLICABILITY;
 if(proof.format!=='fixed-renderer-source-applicability-independent-v1'||proof.decision?.sourceApplicabilityForFixedNativeFieldCaptionAndSvg!==true||proof.decision?.pixelAcceptance!==false||proof.decision?.guardActivation!==false||proof.reviewerProfile?.reviewerIdentity===authorIdentity||!proof.reviewerProfile?.reviewerIdentity?.startsWith('/root/')||proof.reviewerProfile?.model!=='gpt-6.1-sol'||proof.reviewerProfile?.reasoningEffort!=='high'||proof.reviewerProfile?.requestedServiceTier!=='default')fail('exact different-worker layout source review required');
 if(hashValue(oldManifest)!==config.old||hashValue(currentManifest)!==config.current||oldManifest.files?.length!==700||currentManifest.files?.length!==700)fail('exact complete layout 700-file manifests required');
 const before=new Map(oldManifest.files.map(row=>[row.path,row.hash])),after=new Map(currentManifest.files.map(row=>[row.path,row.hash]));
 if(before.size!==700||after.size!==700||[...before.keys()].some(p=>!after.has(p)))fail('layout manifest membership changed');
 const changed=[...before].filter(([p,h])=>after.get(p)!==h).map(([p])=>p).sort();
 if(!same(changed,config.deltas.map(r=>r[0]).sort()))fail('extra/missing layout delta');
 const snapshot=artifact(proof.fixedTarget.snapshot);
 if(snapshot.currentManifest?.signature!==config.current||!same(snapshot.currentManifest.path,proof.fixedTarget.manifest.path)||snapshot.currentManifest.hash!==proof.fixedTarget.manifest.hash)fail('fixed source snapshot manifest binding changed');
 const sources={};
 for(const [file,oldHash,newHash] of config.deltas){
  const row=proof.sourcePairs?.find(r=>r.path===file),snapshotRow=snapshot.files?.find(r=>r.path===file);
  if(before.get(file)!==oldHash||after.get(file)!==newHash||row?.retainedBefore?.hash!==oldHash||row?.retainedAfter?.hash!==newHash||snapshotRow?.hash!==newHash)fail('unreviewed layout source bytes');
  const oldBytes=read(row.retainedBefore.path),newBytes=read(file),retainedNew=read(row.retainedAfter.path);
  if(hashValue(oldBytes)!==oldHash||hashValue(newBytes)!==newHash||hashValue(retainedNew)!==newHash||hashValue(read(snapshotRow.snapshot))!==newHash)fail('layout source snapshot changed');
  sources[file]={before:oldBytes.toString('utf8'),current:newBytes.toString('utf8')};
 }
 // Never execute changed module initializers. The exact source proof fixes the
 // bodies; independently parse their declarations and compare actual imports.
 for(const file of [config.deltas[0][0],config.deltas[2][0]]){
  const ast=source=>parse(source,{sourceType:'module',ecmaVersion:'latest'}).body;
  const a=ast(sources[file].before),b=ast(sources[file].current);
  const imports=(nodes,source)=>nodes.filter(n=>n.type==='ImportDeclaration').map(n=>source.slice(n.start,n.end));
  if(!same(imports(a,sources[file].before),imports(b,sources[file].current)))fail('layout parser/import changed');
  for(const node of [...a,...b]){
   const n=node.type==='ExportNamedDeclaration'?node.declaration:node;
   if(!n||!['ImportDeclaration','FunctionDeclaration','VariableDeclaration'].includes(n.type))fail('unreviewed layout initializer');
   if(n.type==='VariableDeclaration'&&n.declarations.some(d=>d.init&&!['Literal','ArrowFunctionExpression','ObjectExpression'].includes(d.init.type)))fail('unreviewed layout initializer');
  }
 }
 const component=sources[config.deltas[1][0]],scripts=value=>[...value.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(r=>r[0]);
 if(!same(scripts(component.before),scripts(component.current))||scripts(component.current).some(s=>/<script[^>]*(?:context\s*=|\bmodule\b)/.test(s)))fail('active component script changed');
 const closure=proof.activeClosure;
 if(closure?.fileCount!==42||closure.files?.length!==42||new Set(closure.files.map(r=>r.path)).size!==42||closure.dynamicImports?.length||closure.changedModulesReached?.length||closure.edges?.some(e=>changed.includes(e.target)))fail('native display closure not bounded');
 for(const row of closure.files){if(row.unchangedFromOriginalCapture!==true||before.get(row.path)!==row.hash||after.get(row.path)!==row.hash||hashValue(read(row.path))!==row.hash||row.snapshot?.hash!==row.hash||hashValue(read(row.snapshot.path))!==row.hash)fail('active native display source changed');}
 for(const row of [closure.skillDetail,closure.appCss])if(!row||before.get(row.path)!==row.hash||after.get(row.path)!==row.hash||hashValue(read(row.path))!==row.hash)fail('active page/global CSS changed');
 const doc='public/libs/maths-editor/document-model.mjs',source=read(doc).toString('utf8');
 // This profile includes the already captured active LabelSpace revision. Its
 // exact hash is one of the 697 unchanged bindings, never waived separately.
 if(before.get(doc)!==after.get(doc)||hashValue(read(doc))!==before.get(doc))fail('active document parser changed');
 return {beforeSource:source,currentSource:source,sources};
}
