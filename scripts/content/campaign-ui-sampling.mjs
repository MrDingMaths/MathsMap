import fs from 'node:fs';
import path from 'node:path';
import { readSkill } from './campaign-support.mjs';
import { hashValue, inside } from './campaign-sources.mjs';

// Explicit optional Theory-only policy. Ordinary capture/review guards do not use it.
export const THEORY_UI_SAMPLING_PROFILE = 'figure-free-theory-cohort-ui-sampling-v1';
export const THEORY_UI_DEPENDENCIES = ['src/components/TheoryView.svelte','src/lib/theory-content.js','src/components/InlineContent.svelte','src/components/Math.svelte','src/lib/inline-content.js','src/lib/render-math.js','src/lib/document-content.js','public/libs/maths-editor/document-model.mjs','src/app.css','src/views/SkillDetail.svelte'];
const fail = message => { throw new Error('Theory UI sampling: '+message); };
const same = (a,b) => hashValue(a)===hashValue(b);
const nonempty = value => typeof value==='string' && value.trim().length>0;
export function theoryExampleLayout(example) {
  if (!example || Object.keys(example).some(k=>!['question_text','solution_text'].includes(k))) fail('plain question/solution strings only');
  for (const text of [example.question_text,example.solution_text]) {
    if (!nonempty(text) || /\[tikz\]|\[diagram\]|!\[|<\/?[a-zA-Z][^>]*>|```|\|.*\||\\(?:includegraphics|begin\s*\{(?:axis|tikzpicture|array|matrix|tabular))/i.test(text)) fail('figure or different container requires ordinary inspection');
  }
  // Mathematical command vocabulary is content, not a different container.
  // Display and line modes partition families; actual geometry picks dense samples.
  const text=example.question_text+'\n'+example.solution_text;
  return hashValue({display:text.includes('$$'),multiline:example.solution_text.includes('\n')});
}
function artifact(root,reference) {
  if (!reference?.path || !/^[a-f0-9]{64}$/.test(reference.hash||'')) fail('exact artifact reference required');
  const bytes=fs.readFileSync(inside(root,reference.path));
  if(hashValue(bytes)!==reference.hash)fail('artifact bytes changed');
  return JSON.parse(bytes);
}
function dependencies(root,files) {
  if(!Array.isArray(files)||files.length!==THEORY_UI_DEPENDENCIES.length||!same(files.map(f=>f.path).sort(),[...THEORY_UI_DEPENDENCIES].sort()))fail('exact named Theory dependencies required');
  for(const f of files)if(hashValue(fs.readFileSync(inside(root,f.path)))!==f.hash)fail('current dependency changed');
}
export function verifyTheoryUISampling(root,reference,{campaignId='worked-examples-2026-09',skillId}={}) {
  const proof=artifact(root,reference);
  if(proof.profile!==THEORY_UI_SAMPLING_PROFILE || proof.accepted!==true || proof.actualRepresentativeInspection!==true || !nonempty(proof.applicabilityObservation))fail('explicit independent applicability decision required');
  const actor=proof.reviewerProfile?.workerLineage?.actorId;
  if(actor!==proof.reviewerIdentity || !/^\/\w+(?:\/\w+)*$/.test(actor||'') || proof.reviewerProfile?.model!=='gpt-6.1-sol'||proof.reviewerProfile?.effort!=='medium'||proof.reviewerProfile?.requestedServiceTier!=='default')fail('actual independent reviewer profile required');
  if(!Array.isArray(proof.captures)||proof.captures.length<1||proof.captures.length>8)fail('bounded cohort required');
  const origin=proof.inspectionLineage;
  if(!origin?.skillId||!origin.stageHash)fail('retained actual native lineage proof required');
  const originState=readSkill(root,campaignId,origin.skillId),originProfile=artifact(root,origin.profile);
  if(originState.review?.stageHash!==origin.stageHash||originState.review.workerLineage?.actorId!==actor||originState.review.workerLineage?.kind!=='native'||originState.review.workerLineage?.origin!=='coordinator-bound'||!same(originProfile,originState.review.reviewerProfile)||!same(originProfile,proof.reviewerProfile))fail('actual exposed native profile binding mismatch');
  const ids=new Set(),allRows=[],allArtifacts=[],environment=[];
  for(const reference of proof.captures) {
    const capture=artifact(root,reference),id=capture.skillId;
    if(ids.has(id))fail('duplicate cohort member');ids.add(id);
    const state=readSkill(root,campaignId,id);
    if(state.owner || state.stage?.hash!==capture.stageHash || state.stage?.candidateHash!==capture.candidateHash || !['accepted','published'].includes(state.status))fail('current unowned independently accepted stage required');
    if(state.stage.workerLineage?.actorId===actor || !state.stage.workerLineage?.actorId || state.review?.stageHash!==state.stage.hash || state.review?.pending?.length)fail('independent accepted content binding required');
    const pair=JSON.parse(fs.readFileSync(inside(root,state.stage.candidatePath)));
    if(hashValue({content:pair.content,quiz:pair.quiz})!==state.stage.candidateHash)fail('current candidate bytes changed');
    const examples=pair.content?.theory?.workedExamples;
    if(!Array.isArray(examples)||!examples.length||pair.content.theory.workedExample)fail('canonical examples required');
    if(capture.profile!==THEORY_UI_SAMPLING_PROFILE||!same(capture.appFilesBefore,capture.appFiles)||!same(capture.appFilesAfter,capture.appFiles))fail('stable capture dependency snapshots required');
    dependencies(root,capture.appFiles);
    const mechanism=artifact(root,capture.mechanism);
    if(mechanism.profile!==THEORY_UI_SAMPLING_PROFILE||mechanism.container!=='.theory .worked-example'||!nonempty(mechanism.browserVersion)||!same(mechanism.viewports,[{name:'desktop',width:1280,height:900},{name:'mobile',width:390,height:844}]))fail('exact browser/container/viewports required');
    dependencies(root,mechanism.appFiles);
    const binary=mechanism.browserBinding;
    if(!binary?.executablePath||binary.browserVersion!==mechanism.browserVersion||hashValue(fs.readFileSync(binary.executablePath))!==binary.executableHash)fail('live browser binding required');
    const assets=['src/main.js','src/lib/math-writing-box.js','public/libs/maths-editor/equation-spacing.mjs','node_modules/katex/dist/katex.mjs','node_modules/katex/dist/katex.min.css',...fs.readdirSync(inside(root,'node_modules/katex/dist/fonts')).sort().map(f=>'node_modules/katex/dist/fonts/'+f)];
    if(!same(mechanism.assets?.map(f=>f.path).sort(),assets.sort()))fail('complete math and font assets required');
    for(const f of mechanism.assets)if(hashValue(fs.readFileSync(inside(root,f.path)))!==f.hash)fail('math/font asset changed');
    if(!same(mechanism.systemFonts?.map(f=>path.basename(f.path)).sort(),['segoeui.ttf','segoeuib.ttf','segoeuii.ttf','segoeuiz.ttf']))fail('system font files required');
    for(const f of mechanism.systemFonts)if(hashValue(fs.readFileSync(f.path))!==f.hash)fail('system font changed');
    if(!same(mechanism.appFiles,capture.appFiles)||!same(mechanism.producerFiles?.map(f=>f.path).sort(),['scripts/content/campaign-ui-capture.mjs','scripts/content/campaign-ui-sampling.mjs'].sort()))fail('capture mechanism dependency mismatch');
    for(const f of mechanism.producerFiles)if(hashValue(fs.readFileSync(inside(root,f.path)))!==f.hash)fail('capture producer changed');
    environment.push(hashValue(mechanism));
    if(!Array.isArray(capture.rows)||capture.rows.length!==examples.length*2)fail('every example at both viewports requires actual checks');
    const keys=new Set();
    for(const row of capture.rows) {
      const key=row.name+':'+row.index,e=examples[row.index];
      if(keys.has(key)||!['desktop','mobile'].includes(row.name)||!Number.isInteger(row.index)||!e)fail('duplicate/foreign audit row');keys.add(key);
      if(!same(row.viewport,mechanism.viewports.find(v=>v.name===row.name)))fail('exact row viewport required');
      if(row.itemHash!==hashValue(e)||row.layoutHash!==theoryExampleLayout(e)||row.container!=='.theory .worked-example')fail('exact example/layout binding required');
      if(row.actualRender!==true||row.questionVisible!==true||row.solutionVisible!==true||row.fontsReady!==true||row.katexErrors!==0||row.diagramCount!==0||row.overflow!==false||row.mathOutsideExample!==0||row.workingEmpty!==false)fail('actual successful complete render/working checks required');
      if(![row.width,row.height,row.mathWidth].every(v=>Number.isFinite(v)&&v>0))fail('measured layout required');
      allRows.push({...row,skillId:id});
    }
    if(!Array.isArray(capture.artifacts))fail('representative actual pixels required');
    for(const a of capture.artifacts) {
      const row=capture.rows.find(r=>r.index===a.index&&r.name===a.name);
      if(!row||!a.bounds||Math.abs(a.bounds.width-row.width)>.1||Math.abs(a.bounds.height-row.height)>.1)fail('foreign representative geometry');
      if(hashValue(fs.readFileSync(inside(root,a.path)))!==a.hash)fail('representative PNG changed');
      allArtifacts.push({...a,skillId:id});
    }
  }
  if(skillId&&!ids.has(skillId))fail('requested skill outside cohort');
  if(new Set(environment).size!==1)fail('different browser/container mechanisms');
  if(new Set(allArtifacts.map(a=>a.skillId+':'+a.name+':'+a.index)).size!==allArtifacts.length)fail('duplicate representative identity');
  if(new Set(allArtifacts.map(a=>a.path)).size!==allArtifacts.length||!Array.isArray(proof.artifacts)||proof.artifacts.length!==allArtifacts.length||new Set(proof.artifacts.map(a=>a.path)).size!==proof.artifacts.length)fail('exact unique representative membership required');
  for(const a of allArtifacts) {
    const inspected=proof.artifacts.find(p=>p.path===a.path&&p.hash===a.hash&&p.skillId===a.skillId&&p.index===a.index&&p.name===a.name);
    if(!inspected?.accepted||inspected.actualPixelInspection!==true||!nonempty(inspected.observation))fail('every representative requires actual independent inspection');
  }
  // First, tallest and widest actual members of each exact family are inspected.
  // Sampling never claims that the other PNGs were personally viewed.
  for(const row of allRows) {
    const family=allRows.filter(r=>r.name===row.name&&r.layoutHash===row.layoutHash);
    const required=[family[0],family.reduce((a,b)=>a.height>=b.height?a:b),family.reduce((a,b)=>a.mathWidth>=b.mathWidth?a:b)];
    for(const r of required)if(!allArtifacts.some(a=>a.skillId===r.skillId&&a.index===r.index&&a.name===r.name))fail('first/tallest/widest family representative missing');
  }
  return {profile:proof.profile,skillIds:[...ids],automaticallyCheckedExamples:allRows.length,actuallyInspectedArtifacts:allArtifacts.length,proof:reference};
}
