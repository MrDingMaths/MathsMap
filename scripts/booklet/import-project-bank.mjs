// Stage ordinary whole-question promotions once, then verify and publish that stage.
import fs from 'node:fs/promises';
import {validateSourceClassificationReview,externalTeachingEvidence} from './source-classification-review.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {promoteProjectQuestion,saveBookletProject} from './project-studio-server.mjs';
import {revisionHash,writeTransaction,projectSyncStatus,syncLinks,withBankLock} from './bank-sync.mjs';
import {normaliseQuestion,validateQuestion,filterQuestionBank,makeBankManifest} from '../../src/lib/practice-question-model.js';
import {sharedQuestion,mergeQuestionContent} from '../../src/lib/question-sync.js';
import {captureQuestionPresentation} from '../../src/lib/question-presentation.js';
import {isSelectableBankQuestion,isTheoryReview} from '../../src/lib/question-bank-eligibility.js';
import {projectVerificationRun,verificationStatus,verificationDependencies,recordVerification} from './import-verification.mjs';
import {liveWorkflow,acceptFinalReview,updateWorkflow,bytesHash} from './workflow-review.mjs';

const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const write=async(f,v)=>{await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f,JSON.stringify(v,null,2)+'\n');};
const digest=v=>createHash('sha256').update(v).digest('hex');
const exists=async f=>fs.access(f).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;});
export const practiceQuestions=p=>p.sections.filter(s=>s.phase==='practice').flatMap(s=>s.blocks.filter(b=>b.type==='question'&&!isTheoryReview(b,s)));
export function preservedProject(project){
  const p=structuredClone(project);delete p.revision;delete p.updatedAt;
  for(const b of practiceQuestions(p)){
    for(const k of ['bankRef','canonicalId','snapshotKind','classification','presentation'])delete b[k];
    if(b.flow){delete b.flow.localDifficulty;delete b.flow.bankDifficulty;if(!Object.keys(b.flow).length)delete b.flow;}
  }
  return p;
}
async function treeHash(file){
  const stat=await fs.stat(file);
  if(!stat.isDirectory())return digest(await fs.readFile(file));
  return revisionHash(await Promise.all((await fs.readdir(file)).sort().map(async n=>[n,await treeHash(path.join(file,n))])));
}
async function assetHashes(project,root){
  const refs=new Set();
  const walk=v=>{if(typeof v==='string'){for(const m of v.matchAll(/\/booklet-assets\/[^\s"'<>\)]+/g))refs.add(m[0]);}else if(v&&typeof v==='object')Object.values(v).forEach(walk);};
  walk(project.sections);
  return Object.fromEntries(await Promise.all([...refs].sort().map(async ref=>[ref,digest(await fs.readFile(path.join(root,'public',decodeURIComponent(ref))))])));
}
async function snapshot(root,projectId,assessments){
  const bank=path.join(root,'booklets/question-bank'),names=(await fs.readdir(bank)).filter(n=>/^q-.*\.json$/.test(n)).sort();
  const source=await read(path.join(root,'booklets/projects',projectId+'.json'));
  const files=[...names,'manifest.json','.sync/links.json'];
  const implementation=await Promise.all(['src/lib','scripts/booklet','package-lock.json'].map(f=>treeHash(path.join(path.dirname(fileURLToPath(import.meta.url)),'../..',f))));
  return {taxonomy:revisionHash(await Promise.all(['data/skills.json','data/dotpoints.json'].map(f=>read(path.join(root,f))))),project:revisionHash(source),assessments:revisionHash(assessments),implementation:revisionHash(implementation),assets:await assetHashes(source,root),bank:Object.fromEntries(await Promise.all(files.map(async n=>[n,digest(await fs.readFile(path.join(bank,n)))])))};
}
export async function verifyProjectBank(project,bankRoot,{root=process.cwd(),baseline=project,assessments,receipt}={}){
  const questions=practiceQuestions(project),originals=new Map(practiceQuestions(baseline).map(b=>[b.id,b]));
  assert.equal(questions.length,assessments.questions.length);
  assert.deepEqual(preservedProject(project),preservedProject(baseline),'Content, provenance or local layout changed');
  const skills=new Set((await read(path.join(root,'data/skills.json'))).map(s=>s.id));
  const assessed=new Map(assessments.questions.map(q=>[q.sourceBlockId,q]));
  const links=await syncLinks(bankRoot),ids=new Set(),records=[];
  for(const b of questions){
    assert.ok(b.bankRef?.id,b.id+' is unlinked');assert.ok(!ids.has(b.bankRef.id),'Duplicate bank link');ids.add(b.bankRef.id);
    const bank=await read(path.join(bankRoot,b.bankRef.id+'.json')),source=originals.get(b.id);
    const checked=validateQuestion(bank,{skillIds:skills});assert.ok(checked.valid,b.id+': '+checked.errors.join('; '));
    assert.ok(isSelectableBankQuestion(bank));
    assert.deepEqual(bank.content,normaliseQuestion(source).content,b.id+' content and answers');
    assert.deepEqual(bank.presentation,captureQuestionPresentation(source,baseline.settings?.layoutOverrides),b.id+' presentation');
    assert.deepEqual(sharedQuestion(bank),sharedQuestion(normaliseQuestion(b)),b.id+' sync content');
    assert.equal(links[bank.id]?.projectId,project.id);assert.equal(links[bank.id]?.blockId,b.id);
    assert.equal(b.bankRef.revision,revisionHash(bank));
    for(const[k,v]of Object.entries(assessed.get(b.id).classification))assert.deepEqual(bank.classification[k],v,b.id+' '+k);
    if(receipt)assert.equal(receipt.questions.find(q=>q.sourceBlockId===b.id)?.bankId,bank.id);
    await assetHashes({sections:[bank.content]},root);records.push(bank);
  }
  assert.equal(Object.values(links).filter(l=>l.projectId===project.id).length,questions.length,'Unexpected ownership');
  const selected=new Set(questions.map(q=>q.id));
  for(const s of project.sections)for(const b of s.blocks)if(!selected.has(b.id))assert.deepEqual(b.bankRef,baseline.sections.flatMap(x=>x.blocks).find(x=>x.id===b.id)?.bankRef,'Excluded question changed');
  const status=await projectSyncStatus(project,bankRoot);
  assert.equal(status.items.filter(i=>selected.has(i.blockId)).length,questions.length);
  assert.ok(status.items.filter(i=>selected.has(i.blockId)).every(i=>i.state==='synced'),'Unsynced import');
  const manifest=await read(path.join(bankRoot,'manifest.json'));
  for(const id of ids)assert.ok(manifest.questions.some(q=>q.id===id),'Missing manifest entry '+id);
  for(const skill of new Set(records.flatMap(q=>[q.classification.primarySkillId,...q.classification.secondarySkillIds]))){
    const expected=records.filter(q=>[q.classification.primarySkillId,...q.classification.secondarySkillIds].includes(skill)).map(q=>q.id).sort();
    assert.deepEqual(filterQuestionBank(records,{skill}).map(q=>q.id).sort(),expected,'Skill filter '+skill);
  }
  for(const difficulty of new Set(records.map(q=>q.classification.difficulty)))assert.equal(filterQuestionBank(records,{difficulty:[difficulty]}).length,records.filter(q=>q.classification.difficulty===difficulty).length);
  return {questions:questions.length,ownedAndSynced:questions.length,contentAndLayoutPreserved:true,difficultyCounts:Object.fromEntries([...new Set(records.map(q=>q.classification.difficulty))].map(d=>[d,records.filter(q=>q.classification.difficulty===d).length]))};
}
async function stagedArtifacts(out,projectId){
  const p=await read(path.join(out,'projects',projectId+'.json'));
  const files=['accepted-source.json','receipt.json','projects/'+projectId+'.json','bank/manifest.json','bank/.sync/links.json',...practiceQuestions(p).map(q=>'bank/'+q.bankRef.id+'.json')];
  const artifacts=Object.fromEntries(await Promise.all(files.map(async f=>[f,digest(await fs.readFile(path.join(out,f)))])));
  if(await exists(path.join(out,'resume-evidence')))artifacts['resume-evidence']=await treeHash(path.join(out,'resume-evidence'));
  return artifacts;
}
async function resumeInterruptedStage({resumeFrom,resumeAssessmentsFile,out,source,questions,byId,options,current,classificationInputs,existingQuestions}){
  assert.ok(resumeAssessmentsFile,'The previous reviewed assessments are required to reuse an interrupted stage');
  const prior=path.resolve(resumeFrom);assert.notEqual(prior,out);assert.ok(!await exists(path.join(prior,'stage.json')),'Use completed stages through ordinary stage reuse');
  const oldSource=await read(path.join(prior,'accepted-source.json')),oldProject=await read(path.join(prior,'projects',source.id+'.json')),oldAssessments=await read(resumeAssessmentsFile);
  validateSourceClassificationReview(oldSource,oldAssessments,classificationInputs);
  assert.equal(oldSource.id,source.id);assert.deepEqual(oldSource.source?.sourceHashes,source.source?.sourceHashes,'Original source bytes changed');
  assert.deepEqual(practiceQuestions(oldSource).map(q=>q.id),questions.map(q=>q.id),'Question inventory changed');
  assert.deepEqual(preservedProject(oldProject),preservedProject(oldSource),'Interrupted project was edited outside ordinary promotion');
  const oldLinks=await syncLinks(path.join(prior,'bank')),links=await syncLinks(options.bankRoot),linked=practiceQuestions(oldProject).filter(q=>q.bankRef?.id),seen=new Set(),records=[];
  assert.ok(linked.length,'No completed promotions to reuse');
  assert.equal(Object.values(oldLinks).filter(l=>l.projectId===source.id).length,linked.length,'Interrupted ownership is incomplete');
  const prepared=structuredClone(source),targets=new Map(practiceQuestions(prepared).map(q=>[q.id,q])),oldById=new Map(oldAssessments.questions.map(q=>[q.sourceBlockId,q]));
  const evidence=path.join(out,'resume-evidence');await fs.mkdir(evidence,{recursive:true});
  await write(path.join(evidence,'accepted-source.json'),oldSource);await write(path.join(evidence,'project.json'),oldProject);await write(path.join(evidence,'assessments.json'),oldAssessments);await write(path.join(evidence,'links.json'),oldLinks);
  for(const block of linked){
    const id=block.bankRef.id;assert.match(id,/^q-[a-zA-Z0-9-]+$/);assert.ok(!seen.has(id),'Duplicate interrupted bank link');seen.add(id);
    assert.ok(!current.bank[id+'.json']&&!links[id],'Interrupted bank ID already exists in the live bank');
    const bank=await read(path.join(prior,'bank',id+'.json')),target=targets.get(block.id),link=oldLinks[id];
    assert.equal(bank.id,id);assert.equal(link?.projectId,source.id);assert.equal(link?.blockId,block.id);assert.equal(revisionHash(bank),block.bankRef.revision);assert.equal(link.bankRevision,block.bankRef.revision);
    const checked=validateQuestion(bank);assert.ok(checked.valid,checked.errors.join('; '));
    assert.deepEqual(bank.content,normaliseQuestion(block).content,'Interrupted bank content changed');assert.deepEqual(sharedQuestion(bank),sharedQuestion(normaliseQuestion(block)));
    assert.equal(link.sourceHash,revisionHash(sharedQuestion(normaliseQuestion(block))));assert.equal(link.bankHash,revisionHash(sharedQuestion(bank)));
    assert.deepEqual(bank.classification,oldById.get(block.id)?.classification);assert.deepEqual(bank.classification,byId.get(block.id).classification,'Reviewed classification changed; use a fresh stage');
    assert.deepEqual(bank.presentation,captureQuestionPresentation(target,source.settings?.layoutOverrides),'Question presentation changed; use a fresh stage');
    assert.deepEqual(mergeQuestionContent(normaliseQuestion(target).content,bank.content),normaliseQuestion(target).content,'Question presentation changed; ordinary owner sync must preserve the exact reviewed content');
    await write(path.join(options.bankRoot,id+'.json'),bank);await write(path.join(evidence,'bank',id+'.json'),bank);records.push(bank);links[id]=link;
    for(const key of ['bankRef','canonicalId','snapshotKind'])target[key]=structuredClone(block[key]);
  }
  for(const block of practiceQuestions(prepared))block.classification=structuredClone(byId.get(block.id).classification);
  await write(path.join(options.bankRoot,'.sync/links.json'),links);await write(path.join(options.bankRoot,'manifest.json'),makeBankManifest([...existingQuestions,...records].sort((a,b)=>a.id.localeCompare(b.id))));
  // The ordinary owner save reconciles the newly reviewed shared content into
  // these isolated bank records. Unchanged IDs and the live bank stay intact.
  await write(path.join(options.projectRoot,source.id+'.json'),oldProject);
  const staged=await saveBookletProject(prepared,{...options,expectedRevision:oldProject.revision});
  const resume={from:prior,reusedQuestions:linked.length,previousSourceHash:revisionHash(oldSource),previousAssessmentsHash:revisionHash(oldAssessments),method:'Validated interrupted promotions; ordinary owner save applies newly reviewed content before remaining ordinary promotions.'};
  await write(path.join(evidence,'review.json'),resume);return {staged,resume};
}
export async function importProjectBank({root=process.cwd(),projectId,assessmentsFile,out,apply=false,onProgress=()=>{},resumeFrom,resumeAssessmentsFile}){
  assert.match(projectId??'',/^[a-z0-9][a-z0-9-]*$/);assert.ok(out&&assessmentsFile,'Assessment and output paths required');
  out=path.resolve(out);const started=new Date().toISOString(),assessments=await read(assessmentsFile);
  assert.equal(assessments.projectId,projectId);
  const sourceFile=path.join(root,'booklets/projects',projectId+'.json'),bankRoot=path.join(root,'booklets/question-bank');
  const source=await read(sourceFile),questions=practiceQuestions(source),receiptFile=path.join(root,'booklets/provenance',projectId,'bank-import.json');
  if(source.source?.pipelinePilot&&path.resolve(root)===path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'))throw Error('Regression pilots cannot publish to the live question bank');
  const verificationRun=projectVerificationRun(source,root);
  const verifyImport=()=>{if(!verificationRun)return;const workflow=liveWorkflow(verificationRun),status=verificationStatus(workflow,source,{validateFinal:()=>acceptFinalReview(structuredClone(workflow),workflow.finalReview)});assert.ok(status.ok,'Import verification pending: '+status.issues.join('; '));};
  if(assessments.sourceContext)externalTeachingEvidence(assessments.sourceContext,root);
  if(questions.length&&questions.every(b=>b.bankRef?.id)){
    const receipt=await read(receiptFile);
    const result={...await verifyProjectBank(source,bankRoot,{root,assessments,receipt}),created:0,applied:false,alreadyImported:true};
    if(verificationRun){
     const file=path.join(out,'repeat-import.json');await write(file,result);
     await updateWorkflow(verificationRun,'repeat-import readback',async state=>{
      const accepted=await read(state.settled.project.file),deps=verificationDependencies(state,accepted);
      recordVerification(state,{id:'repeat-import',outcome:'passed',reviewer:'import-project-bank',note:'Existing ownership, IDs, content, filters and sync verified; no questions created.',dependencies:{project:deps.project},artifacts:[{path:path.resolve(file),hash:bytesHash(file)}]},deps);
     });
    }
    return result;
  }
  const classificationInputs={sourceRoot:root,skills:await read(path.join(root,'data/skills.json')),dotpoints:await read(path.join(root,'data/dotpoints.json'))};
  validateSourceClassificationReview(source,assessments,classificationInputs);
  assert.ok(questions.length>0);assert.ok(questions.every(b=>!b.bankRef?.id),'Partial links require explicit reconciliation');
  assert.equal(questions.length,assessments.questions.length);assert.equal(new Set(assessments.questions.map(q=>q.sourceBlockId)).size,questions.length);
  assert.ok(!(source.studio?.flags??[]).some(f=>!f.resolved),'Unresolved source feedback');
  const byId=new Map(assessments.questions.map(q=>[q.sourceBlockId,q]));
  for(const q of questions){
    const a=byId.get(q.id);assert.ok(a,q.id+' assessment missing');assert.equal(a.contentHash,revisionHash(q.content),q.id+' assessment is stale');
    assert.ok(a.classification.difficultyReason?.trim(),q.id+' needs an individual rationale');
    const c=validateQuestion(normaliseQuestion({...q,classification:a.classification}));assert.ok(c.valid,q.id+': '+c.errors.join('; '));
  }
  const current=await snapshot(root,projectId,assessments),stateFile=path.join(out,'stage.json');let state,reused=false;
  verifyImport();
  if(await exists(stateFile)){
    state=await read(stateFile);assert.deepEqual(state.inputs,current,'Staging inputs changed; use a new output directory after review');
    assert.deepEqual(await stagedArtifacts(out,projectId),state.artifacts,'Staged artifacts changed');reused=true;
  }else{
    assert.ok(!await exists(path.join(out,'projects')),'Incomplete staging exists; use a new output directory');
    await fs.mkdir(out,{recursive:true});
    const options={projectRoot:path.join(out,'projects'),bankRoot:path.join(out,'bank'),moduleRoot:path.join(out,'modules')};
    await write(path.join(options.projectRoot,projectId+'.json'),source);await write(path.join(out,'accepted-source.json'),source);
    for(const n of Object.keys(current.bank)){const f=path.join(options.bankRoot,n);await fs.mkdir(path.dirname(f),{recursive:true});await fs.copyFile(path.join(bankRoot,n),f);}
    const existingQuestions=await Promise.all(Object.keys(current.bank).filter(n=>/^q-/.test(n)).map(n=>read(path.join(bankRoot,n))));
    const contentHashes=new Map(existingQuestions.map(q=>[revisionHash(normaliseQuestion(q).content),q.id]));
    for(const q of questions)assert.ok(!contentHashes.has(revisionHash(normaliseQuestion(q).content)),q.id+' duplicates existing bank question '+contentHashes.get(revisionHash(normaliseQuestion(q).content)));
    let staged,resume=null;
    if(resumeFrom)({staged,resume}=await resumeInterruptedStage({resumeFrom,resumeAssessmentsFile,out,source,questions,byId,options,current,classificationInputs,existingQuestions}));
    else{const prepared=structuredClone(source);for(const b of practiceQuestions(prepared))b.classification=structuredClone(byId.get(b.id).classification);staged=await saveBookletProject(prepared,{...options,expectedRevision:source.revision});}
    const already=new Set(practiceQuestions(staged).filter(q=>q.bankRef?.id).map(q=>q.id));let promoted=already.size;
    if(promoted)onProgress({reused:promoted,total:questions.length});
    for(const b of questions){if(already.has(b.id))continue;staged=(await promoteProjectQuestion(projectId,{blockId:b.id,mode:'create'},options)).project;promoted++;if(promoted===1||promoted%10===0)onProgress({promoted,total:questions.length});}
    for(const n of Object.keys(current.bank).filter(n=>/^q-/.test(n)))assert.equal(digest(await fs.readFile(path.join(options.bankRoot,n))),current.bank[n],'Unrelated staged bank changed');
    staged.revision=source.revision+1;await write(path.join(options.projectRoot,projectId+'.json'),staged);
    const summary=await verifyProjectBank(staged,options.bankRoot,{root,baseline:source,assessments});
    const receipt={version:1,projectId,sourceRevision:source.revision,sourceSha256:revisionHash(source),publishedRevision:staged.revision,createdAt:new Date().toISOString(),authorization:`User requested all ${questions.length} whole practice questions from ${source.title||projectId}; teaching content excluded.`,method:'Ordinary promotion in isolated staging, verified once and published through a checked transaction.',sourceHashes:source.source?.sourceHashes??null,sourceContext:assessments.sourceContext,summary,questions:questions.map(b=>{const linked=practiceQuestions(staged).find(q=>q.id===b.id);return {sourceBlockId:b.id,bankId:linked.bankRef.id,bankRevision:linked.bankRef.revision,sourceContentHash:revisionHash(b.content),sourceRefs:b.sourceRefs??[],sourcePages:b.sourceReview?.sourcePages??[],classification:linked.classification,mappingNote:byId.get(b.id).mappingNote,...(byId.get(b.id).methodNote?{methodNote:byId.get(b.id).methodNote,teachingReferences:byId.get(b.id).teachingReferences}:{}),...(byId.get(b.id).sourceContextException?{sourceContextException:byId.get(b.id).sourceContextException}:{}),previousLocalDifficulty:b.flow?.localDifficulty??null};})};
    if(resume)receipt.resume=resume;
    await write(path.join(out,'receipt.json'),receipt);
    assert.deepEqual(await snapshot(root,projectId,assessments),current,'Live inputs changed during staging');
    state={version:1,inputs:current,started,stagedAt:new Date().toISOString(),artifacts:await stagedArtifacts(out,projectId),summary};await write(stateFile,state);
  }
  const staged=await read(path.join(out,'projects',projectId+'.json')),receipt=await read(path.join(out,'receipt.json'));
  await verifyProjectBank(staged,path.join(out,'bank'),{root,baseline:source,assessments,receipt});
  const publish=async workflow=>{
    verifyImport();
    validateSourceClassificationReview(source,assessments,classificationInputs);
    assert.deepEqual(await snapshot(root,projectId,assessments),current,'Live inputs changed before publication');
    assert.deepEqual(await stagedArtifacts(out,projectId),state.artifacts,'Staged artifacts changed before publication');
    const entries=[];
    for(const b of practiceQuestions(staged))entries.push([path.join(bankRoot,b.bankRef.id+'.json'),await read(path.join(out,'bank',b.bankRef.id+'.json'))]);
    entries.push([path.join(bankRoot,'manifest.json'),await read(path.join(out,'bank/manifest.json'))],[path.join(bankRoot,'.sync/links.json'),await read(path.join(out,'bank/.sync/links.json'))],[path.join(root,'booklets/projects/.revisions',projectId,source.revision+'.json'),source],[sourceFile,staged],[receiptFile,receipt]);
    if(workflow){
     // Publication adds bank identity. Keep the reviewed source bytes pinned to
     // their already-verified staging copy instead of invalidating render evidence.
     const snapshot=path.resolve(out,'accepted-source.json');assert.equal(bytesHash(snapshot),bytesHash(sourceFile));
     const oldFile=workflow.settled.project.file;workflow.settled.project.file=snapshot;
     for(const section of [workflow.settled,workflow.finalReview])if(section?.artifacts)section.artifacts=section.artifacts.map(r=>path.resolve(r.path)===path.resolve(oldFile)?{path:snapshot,hash:bytesHash(snapshot)}:r);
     workflow.verification.publishedSource={path:path.resolve(sourceFile),hash:revisionHash(staged)};
     return {outputs:entries};
    }
    await writeTransaction(entries);
  };
  if(apply){if(verificationRun)await updateWorkflow(verificationRun,'publish verified bank import',publish);else await withBankLock(()=>publish(null));}
  if(apply)await verifyProjectBank(await read(sourceFile),bankRoot,{root,baseline:source,assessments,receipt});
  const result={...state.summary,created:questions.length,applied:apply,reused,out,started,finished:new Date().toISOString(),tokens:'Unavailable'};
  const resultFile=path.join(out,apply?'publication.json':'verification.json');await write(resultFile,result);
  if(apply&&verificationRun)await updateWorkflow(verificationRun,'publication readback',async state=>{
   const accepted=await read(state.settled.project.file),deps=verificationDependencies(state,accepted);
   for(const id of ['publication','readback'])recordVerification(state,{id,outcome:'passed',reviewer:'import-project-bank',note:id==='publication'?'Committed exact verified staging through the bank transaction.':'Read back every published question, presentation, classification, ownership and sync state.',dependencies:{project:deps.project},artifacts:[{path:path.resolve(resultFile),hash:bytesHash(resultFile)}]},deps);
  });
  return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const arg=n=>process.argv[process.argv.indexOf(n)+1];
  console.log(JSON.stringify(await importProjectBank({projectId:arg('--project'),assessmentsFile:arg('--assessments'),out:arg('--out'),apply:process.argv.includes('--apply'),onProgress:console.log,resumeFrom:process.argv.includes('--resume-from')?arg('--resume-from'):undefined,resumeAssessmentsFile:process.argv.includes('--resume-assessments')?arg('--resume-assessments'):undefined}),null,2));
}
