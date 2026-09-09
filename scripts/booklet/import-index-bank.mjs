// Stage through the ordinary promotion workflow, verify, then publish atomically.
// Default: dry run. --apply publishes; subsequent runs verify without creating duplicates.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {indexAssessments} from './index-bank-assessments.mjs';
import {promoteProjectQuestion,saveBookletProject} from './project-studio-server.mjs';
import {revisionHash,writeTransaction,projectSyncStatus,syncLinks} from './bank-sync.mjs';
import {normaliseQuestion,validateQuestion,filterQuestionBank} from '../../src/lib/practice-question-model.js';
import {sharedQuestion} from '../../src/lib/question-sync.js';
import {captureQuestionPresentation} from '../../src/lib/question-presentation.js';
import {isSelectableBankQuestion} from '../../src/lib/question-bank-eligibility.js';

const projectId='index-laws-complete-v1';
const receiptName='booklets/provenance/index-laws-complete-v1/bank-import.json';
const copy=structuredClone;
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const write=async(file,value)=>{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify(value,null,2)+'\n');};
export const practiceQuestions=p=>p.sections.filter(s=>s.phase==='practice').flatMap(s=>s.blocks.filter(b=>b.type==='question'));
function preservedProject(project){
  const p=copy(project);delete p.revision;delete p.updatedAt;
  for(const b of practiceQuestions(p)){
    for(const key of ['bankRef','canonicalId','snapshotKind','classification','presentation'])delete b[key];
    // The bank owns editor-only rating metadata; order and all page settings remain local.
    if(b.flow)delete b.flow.localDifficulty;
  }
  return p;
}
async function existing(file){try{return await read(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function bankFiles(root){return (await fs.readdir(root)).filter(n=>/^q-.*\.json$/.test(n)).sort();}
async function assetsExist(question,root){
  const refs=new Set();
  const walk=v=>{if(typeof v==='string'){for(const match of v.matchAll(/\/booklet-assets\/[^\s"'<>\)]+/g))refs.add(match[0]);}else if(v&&typeof v==='object')Object.values(v).forEach(walk);};
  walk(question.content);
  for(const ref of refs)await fs.access(path.join(root,'public',decodeURIComponent(ref)));
  return refs.size;
}
export async function verifyIndexBank(project,bankRoot,{root=process.cwd(),baseline=project,receipt=null}={}){
  const questions=practiceQuestions(project),originals=new Map(practiceQuestions(baseline).map(b=>[b.id,b]));
  assert.equal(questions.length,149);assert.equal(project.sections.filter(s=>s.phase==='practice').length,10);
  assert.deepEqual(preservedProject(project),preservedProject(baseline),'Accepted content, provenance or layout changed');
  const ids=new Set(),links=await syncLinks(bankRoot),skillIds=new Set((await read(path.join(root,'data/skills.json'))).map(s=>s.id));
  let assets=0;const records=[];
  for(const b of questions){
    assert.ok(b.bankRef?.id,b.id+' is unlinked');assert.ok(!ids.has(b.bankRef.id),'Duplicate bank link');ids.add(b.bankRef.id);
    const bank=await read(path.join(bankRoot,b.bankRef.id+'.json')),source=originals.get(b.id);
    const checked=validateQuestion(bank,{skillIds});assert.ok(checked.valid,b.id+': '+checked.errors.join('; '));
    assert.ok(isSelectableBankQuestion(bank));
    // Normalization deliberately excludes source evidence, retained in the original and receipt.
    assert.deepEqual(bank.content,normaliseQuestion(source).content,b.id+' content/answers/arrangement');
    assert.deepEqual(bank.presentation,captureQuestionPresentation(source,baseline.settings?.layoutOverrides),b.id+' presentation');
    assert.deepEqual(sharedQuestion(bank),sharedQuestion(normaliseQuestion(b)),b.id+' sync content');
    assert.equal(links[bank.id]?.projectId,project.id);assert.equal(links[bank.id]?.blockId,b.id);
    assert.equal(b.bankRef.revision,revisionHash(bank));
    for(const [key,value]of Object.entries(indexAssessments[b.id]))assert.deepEqual(bank.classification[key],value,b.id+' '+key);
    assets+=await assetsExist(bank,root);records.push(bank);
    if(receipt){const entry=receipt.questions.find(q=>q.sourceBlockId===b.id);assert.equal(entry?.bankId,bank.id);}
  }
  const owned=Object.entries(links).filter(([,l])=>l.projectId===project.id);
  assert.equal(owned.length,149,'Unexpected teaching or duplicate ownership');
  assert.ok(project.sections.filter(s=>s.phase!=='practice').flatMap(s=>s.blocks).every(b=>!b.bankRef?.id));
  const status=await projectSyncStatus(project,bankRoot);
  assert.equal(status.items.length,149);assert.ok(status.items.every(i=>i.state==='synced'),JSON.stringify(status.items.filter(i=>i.state!=='synced')));
  const manifest=await read(path.join(bankRoot,'manifest.json'));
  const manifestText=JSON.stringify(manifest);for(const id of ids)assert.ok(manifestText.includes(id),'Missing manifest entry '+id);
  for(const difficulty of new Set(records.map(q=>q.classification.difficulty))){
    const filtered=filterQuestionBank(records,{difficulty:[difficulty]});
    assert.equal(filtered.length,records.filter(q=>q.classification.difficulty===difficulty).length);
  }
  return {questions:149,practiceSections:10,ownedAndSynced:149,assetReferencesChecked:assets,contentAndLayoutPreserved:true,
    difficultyCounts:Object.fromEntries([...new Set(records.map(q=>q.classification.difficulty))].map(d=>[d,records.filter(q=>q.classification.difficulty===d).length]))};
}

export async function importIndexBank({root=process.cwd(),apply=false}={}){
  const sourceFile=path.join(root,'booklets/projects',projectId+'.json'),bankRoot=path.join(root,'booklets/question-bank');
  const sourceRaw=await fs.readFile(sourceFile),source=JSON.parse(sourceRaw),receiptFile=path.join(root,receiptName),prior=await existing(receiptFile);
  const questions=practiceQuestions(source);assert.equal(questions.length,149);assert.equal(Object.keys(indexAssessments).length,149);
  for(const b of questions){const checked=validateQuestion(normaliseQuestion({...b,classification:indexAssessments[b.id]}));assert.ok(checked.valid,b.id+': '+checked.errors.join('; '));}
  if(questions.every(b=>b.bankRef?.id)){
    assert.ok(prior,'Existing complete import needs its provenance receipt');
    return {...await verifyIndexBank(source,bankRoot,{root,receipt:prior}),created:0,applied:false,alreadyImported:true};
  }
  assert.equal(source.revision,200,'Review changed source before importing');
  assert.ok(questions.every(b=>!b.bankRef?.id),'Partial legacy links require reconciliation');
  const names=await bankFiles(bankRoot),before=new Map(await Promise.all(names.map(async n=>[n,await fs.readFile(path.join(bankRoot,n))])));
  const manifestRaw=await fs.readFile(path.join(bankRoot,'manifest.json')),linksRaw=await fs.readFile(path.join(bankRoot,'.sync/links.json'));
  const workParent=path.join(root,'.booklet-work');await fs.mkdir(workParent,{recursive:true});
  const work=await fs.mkdtemp(path.join(workParent,'index-bank-'));
  const options={projectRoot:path.join(work,'projects'),bankRoot:path.join(work,'bank'),moduleRoot:path.join(work,'modules')};
  await fs.mkdir(options.bankRoot,{recursive:true});
  await write(path.join(options.projectRoot,projectId+'.json'),source);
  for(const[n,raw]of before)await fs.writeFile(path.join(options.bankRoot,n),raw);
  await write(path.join(options.bankRoot,'.sync/links.json'),JSON.parse(linksRaw));
  await fs.writeFile(path.join(options.bankRoot,'manifest.json'),manifestRaw);
  const prepared=copy(source);
  for(const b of practiceQuestions(prepared))b.classification=copy(indexAssessments[b.id]);
  let staged=await saveBookletProject(prepared,{...options,expectedRevision:source.revision});
  for(const b of questions){
    const result=await promoteProjectQuestion(projectId,{blockId:b.id,mode:'create'},options);staged=result.project;
  }
  const summary=await verifyIndexBank(staged,options.bankRoot,{root,baseline:source});
  // All existing bank records must remain byte-identical, including unrelated pending work.
  for(const[n,raw]of before)assert.ok(raw.equals(await fs.readFile(path.join(options.bankRoot,n))),n+' was modified');
  // Collapse staged saves into one live revision; do not publish temporary revision history.
  staged.revision=source.revision+1;
  const receipt={version:1,projectId,acceptedRevision:200,acceptedOn:'2026-09-09',
    acceptance:'User: I am satisfied with the index laws booklet. Please import the practice questions to my question bank.',
    sourceSha256:revisionHash(source),publishedRevision:staged.revision,createdAt:new Date().toISOString(),
    method:'Whole practice questions; existing promotion workflow; individual cognitive-demand assessments; source evidence retained in original booklet.',
    sourceHashes:source.source?.sourceHashes??null,summary,
    questions:questions.map(b=>{const linked=practiceQuestions(staged).find(q=>q.id===b.id);return {
      sourceBlockId:b.id,bankId:linked.bankRef.id,bankRevision:linked.bankRef.revision,
      sourceContentHash:revisionHash(b.content),sourceRefs:b.sourceRefs??[],sourcePages:b.sourceReview?.sourcePages??[],
      classification:linked.classification,previousLocalDifficulty:b.flow?.localDifficulty??null,
    };})};
  await write(path.join(work,'accepted-source.json'),source);await write(path.join(work,'receipt.json'),receipt);
  if(apply){
    assert.ok(sourceRaw.equals(await fs.readFile(sourceFile)),'Source changed during staging');
    assert.deepEqual(await bankFiles(bankRoot),names,'Bank membership changed during staging');
    for(const[n,raw]of before)assert.ok(raw.equals(await fs.readFile(path.join(bankRoot,n))),'Bank changed during staging: '+n);
    assert.ok(manifestRaw.equals(await fs.readFile(path.join(bankRoot,'manifest.json'))),'Manifest changed during staging');
    assert.ok(linksRaw.equals(await fs.readFile(path.join(bankRoot,'.sync/links.json'))),'Ownership changed during staging');
    const entries=[];
    for(const b of practiceQuestions(staged))entries.push([path.join(bankRoot,b.bankRef.id+'.json'),await read(path.join(options.bankRoot,b.bankRef.id+'.json'))]);
    entries.push([path.join(bankRoot,'manifest.json'),await read(path.join(options.bankRoot,'manifest.json'))],
      [path.join(bankRoot,'.sync/links.json'),await read(path.join(options.bankRoot,'.sync/links.json'))],
      [path.join(root,'booklets/projects/.revisions',projectId,'200.json'),source],[sourceFile,staged],[receiptFile,receipt]);
    await writeTransaction(entries);
    await verifyIndexBank(await read(sourceFile),bankRoot,{root,baseline:source,receipt});
  }
  return {...summary,created:149,applied:apply,work};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await importIndexBank({apply:process.argv.includes('--apply')}),null,2));
