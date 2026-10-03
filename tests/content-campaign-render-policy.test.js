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
import {activateScopedRendererPolicy,recordReview,readSkill,capturePair,assessmentItems} from '../scripts/content/campaign-support.mjs';

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
function png() {
 const header=Buffer.alloc(13);header.writeUInt32BE(1);header.writeUInt32BE(1,4);header[8]=8;header[9]=6;
 const chunk=(name,bytes)=>{const data=Buffer.concat([Buffer.from(name),bytes]),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(bytes.length);crc.writeUInt32BE(pngCrc32(data));return Buffer.concat([size,data,crc]);};
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.from([0,0,0,0,255]))),chunk('IEND',Buffer.alloc(0))]);
}
function inspection(f,where,value,scoped,browser) {
 const field={where,value,hash:hashValue(value),diagramHashes:[hashValue(f.diagram)]};
 const reference=captureCampaignDiagrams(f.root,{skillId:'child',candidateHash:f.state.stage.candidateHash,fields:[field],out:'.agywork/content-campaign/test/capture-'+(scoped?'scoped':'v2'),base:'http://synthetic.invalid',...(scoped?{rendererDependencyProfile:CAMPAIGN_SCOPED_RENDER_DEPENDENCY_PROFILE,rendererActivation:f.activation}:{})},{capture:({out,items})=>{
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'block.png'),png());fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(items.map(item=>({auditId:item.auditId,status:'pass',png:'block.png'}))));fs.writeFileSync(path.join(out,'render-environment.json'),JSON.stringify({format:'tikz-capture-environment-v1',browserVersion:browser.browserVersion,viewports:[{userAgent:'SYNTHETIC GUARD FIXTURE: no pixel acceptance',devicePixelRatio:1,viewport:{width:1,height:1},fontStatus:'loaded',fonts:[]}]}));
 }});
 return {where,hash:field.hash,renderedSourceHash:field.hash,renderedBlockHashes:field.diagramHashes,renderReceipt:reference,accepted:true,solid3d:false,observation:'Synthetic guard fixture only.',geometryObservation:'Synthetic geometry assertion.',paletteObservation:'Synthetic palette assertion.'};
}
test('activation rejects missing/negative/wrong-code reviews before campaign bytes change',t=>{
 const f=fixture(t),before=f.read(f.ledger+'campaign.json');
 for(const change of [review=>review.accepted=false,review=>review.reviewerIdentity=review.authorIdentity,review=>review.files[0].hash='wrong']) {
  const review=structuredClone(f.review);change(review);f.write(f.activationPath,review);const activation={path:f.activationPath,hash:hashValue(f.read(f.activationPath))};
  assert.throws(()=>activateScopedRendererPolicy(f.root,{campaignId:'test',rendererActivation:activation}),/review|code changed/i);assert.deepEqual(f.read(f.ledger+'campaign.json'),before);
 }
});
test('normal review accepts explicit scoped and mixed immutable v2 evidence only with reviewed campaign policy',t=>{
 const f=fixture(t),browser=probeCampaignRenderBrowser(f.root);
 const scoped=inspection(f,'theory.intro',f.candidate.content.theory.intro,true,browser),legacy=inspection(f,'theory.facts[0]',f.candidate.content.theory.facts[0],false,browser);
 const args={campaignId:'test',skillId:'child',workerId:'reviewer',stageHash:'stage',outcomes:assessmentItems(f.candidate.content,null,false).map(item=>({where:item.where,hash:item.hash,verdict:'accepted',independentSolution:'2+3=5.',observation:'Independent addition checked.'})),theoryObservation:'Synthetic source guard fixture.',sourceObservation:'Synthetic source guard fixture.',visualReviews:[scoped,legacy]};
 const before=f.read(f.ledger+'skills/child.json'),originalScoped=f.read(scoped.renderReceipt.path),originalLegacy=f.read(legacy.renderReceipt.path);
 assert.throws(()=>recordReview(f.root,args),/explicit accepted campaign renderer activation/);assert.deepEqual(f.read(f.ledger+'skills/child.json'),before);
 assert.equal(activateScopedRendererPolicy(f.root,{campaignId:'test',rendererActivation:f.activation}).changed,true);
 assert.equal(activateScopedRendererPolicy(f.root,{campaignId:'test',rendererActivation:f.activation}).changed,false);
 assert.equal(recordReview(f.root,args).status,'accepted');assert.equal(readSkill(f.root,'test','child').owner,undefined);
 assert.deepEqual(f.read(scoped.renderReceipt.path),originalScoped);assert.deepEqual(f.read(legacy.renderReceipt.path),originalLegacy);
 assert.equal(JSON.parse(originalLegacy).rendererDependencyProfile,'content-campaign-render-dependencies-v2');
});
