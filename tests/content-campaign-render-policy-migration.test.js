import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {deflateSync} from 'node:zlib';
import {hashValue,scopeDependencies} from '../scripts/content/campaign-sources.mjs';
import {campaignRendererDependencyManifest,CAMPAIGN_SCOPED_RENDER_CODE_FILES,CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE} from '../scripts/content/campaign-render-dependencies.mjs';
import {captureCampaignDiagrams,pngCrc32} from '../scripts/content/campaign-visual-evidence.mjs';
import {probeCampaignRenderBrowser} from '../scripts/content/campaign-render-browser.mjs';
import {activateScopedRendererPolicy,migrateScopedRendererPolicy,recordReview,readSkill,capturePair,assessmentItems} from '../scripts/content/campaign-support.mjs';

function fixture(t) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'campaign-render-policy-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const file of new Set([...campaignRendererDependencyManifest(process.cwd()).files.map(row=>row.path),...CAMPAIGN_SCOPED_RENDER_CODE_FILES])) {
  const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(process.cwd(),file),target);
 }
 const write=(file,value)=>{const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(value));};
 const read=file=>fs.readFileSync(path.join(root,file));
 const ledger='booklets/provenance/content-campaign/test/',profile={model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default',maxWorkers:3,executionOverrideProfile:'user-requested-sol61-medium-v1',reasoningOverride:{effort:'medium',reason:'Explicit test fixture override.'}};
 write('data/skills.json',[{id:'child',prereqs:[]}]);for(const name of ['topics','courses','dotpoints'])write('data/'+name+'.json',[]);
 write(ledger+'campaign.json',{skillIds:['child'],profile});
 const diagram='[tikz]\\begin{tikzpicture}\\draw(0,0)--(1,0);\\end{tikzpicture}[/tikz]';
 const baseline={content:{skillId:'child',theory:{intro:'A baseline.',facts:['A fact.']},practice:{foundation:[{question_text:'Calculate 2+3.',solution_text:'5.'}]}},quiz:null};
 write('public/content/child.json',baseline.content);const pair=capturePair(root,'child');
 const candidate=structuredClone(baseline);candidate.content.theory.intro+=' '+diagram;candidate.content.theory.facts[0]+=' '+diagram;
 write('work/candidate.json',candidate);write('work/baseline.json',baseline);
 const lineage={kind:'native',actorId:'/root/reviewer'},state={skillId:'child',status:'staged',scope:{topicId:'numbers',stage:4},attempts:[],stage:{hash:'stage',candidatePath:'work/candidate.json',baselinePath:'work/baseline.json',candidateHash:hashValue(candidate),author:'author',expected:pair.expected,removals:[],sourceReview:[],dependencyHash:scopeDependencies(root,'child',{topicId:'numbers',stage:4},[]).hash,workerLineage:{kind:'native',actorId:'/root/author'}},owner:{role:'review',workerId:'reviewer',assignmentId:'assignment',profile,workerLineage:lineage,prepared:{sources:[],workerLineage:lineage,expected:pair.expected,dependencyHash:scopeDependencies(root,'child',{topicId:'numbers',stage:4},[]).hash}}};
 write(ledger+'skills/child.json',state);
 const review={format:'content-campaign-scoped-render-code-review-v1',accepted:true,authorIdentity:'/root/synthetic_author',reviewerIdentity:'/root/synthetic_reviewer',profile:{model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default'},files:CAMPAIGN_SCOPED_RENDER_CODE_FILES.map(file=>({path:file,hash:hashValue(read(file))}))};
 const activationPath='.agywork/content-campaign/test/synthetic-code-review.json';write(activationPath,review);
 const activation={path:activationPath,hash:hashValue(read(activationPath))};
 return {root,write,read,ledger,state,candidate,diagram,activation,activationPath,review};
}

test('reviewed renderer migration uses exact policy CAS, blocks publication, preserves history and rejects stale/invalid reviews',t=>{
 const f=fixture(t);activateScopedRendererPolicy(f.root,{campaignId:'test',rendererActivation:f.activation});
 const campaignPath=f.ledger+'campaign.json',campaign=JSON.parse(f.read(campaignPath)),oldActivationBytes=f.read(f.activationPath);
 const expectedPolicy={rendererDependencyProfile:campaign.rendererDependencyProfile,rendererActivation:campaign.rendererActivation,rendererActivatedAt:campaign.rendererActivatedAt},expectedPolicyHash=hashValue(expectedPolicy);
 const code='scripts/content/campaign-support.mjs';fs.appendFileSync(path.join(f.root,code),'\n// synthetic independently reviewed metadata-only guard update\n');
 const nextPath='.agywork/content-campaign/test/new-reviewed-activation.json',nextReview={...f.review,files:CAMPAIGN_SCOPED_RENDER_CODE_FILES.map(file=>({path:file,hash:hashValue(f.read(file))}))};f.write(nextPath,nextReview);
 const rendererActivation={path:nextPath,hash:hashValue(f.read(nextPath))},args={campaignId:'test',expectedPolicy,expectedPolicyHash,rendererActivation,migratedBy:'/root',reason:'Independently reviewed bounded repair metadata guard.'},before=f.read(campaignPath);
 for(const change of [a=>delete a.expectedPolicyHash,a=>a.expectedPolicyHash='0'.repeat(64),a=>a.expectedPolicy.rendererActivatedAt='invalid',a=>a.migratedBy='',a=>a.migratedBy='/root/',a=>a.reason='',a=>a.expectedPolicy.extra=true,a=>{a.expectedPolicy.rendererActivatedAt='2026-01-01T00:00:00.000Z';a.expectedPolicyHash=hashValue(a.expectedPolicy);},a=>a.rendererActivation={...rendererActivation,hash:'0'.repeat(64)}]){const bad=structuredClone(args);change(bad);assert.throws(()=>migrateScopedRendererPolicy(f.root,bad));assert.deepEqual(f.read(campaignPath),before);}
 for(const pending of [{...f.state,status:'publishing'},{...f.state,owner:{role:'publish'}}]){f.write(f.ledger+'skills/child.json',pending);assert.throws(()=>migrateScopedRendererPolicy(f.root,args),/during publication/);assert.deepEqual(f.read(campaignPath),before);}f.write(f.ledger+'skills/child.json',f.state);
 const journal='.agywork/content-publication/active/child.json';f.write(journal,{synthetic:true});assert.throws(()=>migrateScopedRendererPolicy(f.root,args),/during publication/);assert.deepEqual(f.read(campaignPath),before);fs.unlinkSync(path.join(f.root,journal));
 for(const mutate of [r=>r.accepted=false,r=>r.reviewerIdentity=r.authorIdentity,r=>r.files[0].hash='wrong']){const bad=structuredClone(nextReview);mutate(bad);f.write(nextPath,bad);assert.throws(()=>migrateScopedRendererPolicy(f.root,{...args,rendererActivation:{path:nextPath,hash:hashValue(f.read(nextPath))}}),/review|code changed/i);assert.deepEqual(f.read(campaignPath),before);}f.write(nextPath,nextReview);
 assert.throws(()=>activateScopedRendererPolicy(f.root,{campaignId:'test',rendererActivation}),/separate reviewed migration/);assert.deepEqual(f.read(campaignPath),before);
 const result=migrateScopedRendererPolicy(f.root,args),after=JSON.parse(f.read(campaignPath));assert.equal(result.changed,true);assert.deepEqual(after.rendererActivation,rendererActivation);assert.equal(after.rendererPolicyHistory.length,1);assert.deepEqual(after.rendererPolicyHistory[0].previousPolicy,expectedPolicy);assert.equal(after.rendererPolicyHistory[0].previousPolicyHash,expectedPolicyHash);assert.deepEqual(f.read(f.activationPath),oldActivationBytes);assert.deepEqual(f.read(f.ledger+'skills/child.json'),Buffer.from(JSON.stringify(f.state)));
 const migratedBytes=f.read(campaignPath);assert.throws(()=>migrateScopedRendererPolicy(f.root,args),/Stale renderer policy/);assert.deepEqual(f.read(campaignPath),migratedBytes);
});
