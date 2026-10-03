import {parse} from 'acorn';
import {hashValue} from './campaign-sources.mjs';

export const LABEL_APPLICABILITY_PROFILE='campaign-booklet-label-plain-fields-v1';
export const LABEL_APPLICABILITY=Object.freeze({
 profile:LABEL_APPLICABILITY_PROFILE,effort:'medium',
 old:'dd9b2a10902549edd583636280be10c51aad8904d7ded9ff3e1a69edb590419e',
 current:'d87b01fee718ef0280cd775e140986aaad5eafdbc812e4fae8bfa469c16788ab',
 sourceProof:'77a3c5b37ed2f6ba41f14e238fb1308f72561c044ac73eaa8d5a5451f8597b41',
 codeFiles:['scripts/content/campaign-render-applicability.mjs','scripts/content/campaign-label-applicability.mjs','scripts/content/campaign-support.mjs','tests/content-campaign-label-applicability.test.js','tests/fixtures/content-campaign/renderer-label-applicability.json','docs/content-campaign-label-applicability.md'],
});
const fail=message=>{throw Error('Renderer applicability: '+message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function verifyLabelSources(read,artifact,proof,before,after,authorIdentity,field){
 const config=LABEL_APPLICABILITY,p=proof.profile;
 if(proof.format!=='booklet-label-source-review-v1'||proof.accepted!==true||proof.pixelAcceptance!==false||p?.model!=='gpt-6.1-sol'||p.effort!=='medium'||p.requestedServiceTier!=='default'||!p.reviewerIdentity?.startsWith('/root/')||p.reviewerIdentity===authorIdentity||proof.sourceEvidence?.hash!==config.sourceProof)fail('distinct Medium exact label source review required');
 const facts=artifact(proof.sourceEvidence);
 if(facts.format!=='booklet-label-source-facts-v1'||hashValue(before)!==config.old||hashValue(after)!==config.current||before.files?.length!==702||after.files?.length!==702)fail('complete exact label manifests required');
 const a=new Map(before.files.map(r=>[r.path,r.hash])),b=new Map(after.files.map(r=>[r.path,r.hash]));
 if(a.size!==702||b.size!==702||[...a.keys()].some(k=>!b.has(k))||!same([...a].filter(([k,h])=>b.get(k)!==h).map(([k])=>k),['src/lib/booklet-labels.js']))fail('extra label renderer delta/membership');
 const row=facts.sourcePair;
 if(row?.path!=='src/lib/booklet-labels.js'||row.before?.hash!=='97facd14550c2ebb2dd29e5d952c976e7d592c7c0cc7e6a128b79c000af1547f'||row.after?.hash!=='1b5c58d2717db8829e1a1bb4b2f13340dce2fa59f9e5942248fb5866039ab1ca'||a.get(row.path)!==row.before.hash||b.get(row.path)!==row.after.hash)fail('label source pair changed');
 const old=read(row.before.path),current=read(row.after.path);
 if(hashValue(old)!==row.before.hash||hashValue(current)!==row.after.hash||hashValue(read(row.path))!==row.after.hash)fail('label source snapshot changed');
 const declarations=bytes=>{const s=bytes.toString('utf8');return parse(s,{sourceType:'module',ecmaVersion:'latest'}).body.map(n=>({name:(n.declaration||n).id?.name,text:s.slice(n.start,n.end)}));};
 const x=declarations(old),y=declarations(current);
 if(x.length!==y.length||x.some((r,i)=>r.text!==y[i].text&&(r.name!=='teachingLabels'||y[i].name!=='teachingLabels')))fail('label imports/initializers/other functions changed');
 for(const route of facts.routeFiles){if(a.get(route.path)!==route.hash||b.get(route.path)!==route.hash||hashValue(read(route.path))!==route.hash)fail('plain route source changed');}
 if(typeof field.value!=='string'||field.route&&field.route!=='plain-string'||field.teachingBlock||field.document||field.where&&!/^(theory\.|practice\.|quiz\.)/.test(field.where))fail('native documents/teaching routes excluded');
 const doc=read('public/libs/maths-editor/document-model.mjs').toString('utf8');
 return {beforeSource:doc,currentSource:doc};
}
