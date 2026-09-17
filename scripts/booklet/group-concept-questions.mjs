import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {sourceGroups} from './concept-shared-stem-register.mjs';
import {revisionHash,withBankLock,writeTransaction,projectSyncStatus,registerOwner,bankManifestEntry} from './bank-sync.mjs';
import {contentSource,isDocument} from '../../src/lib/document-content.js';
import {sizeQuestionWorking} from '../../src/lib/booklet-working-space.js';
import {normaliseQuestion,validateQuestion,difficultyBandForScore} from '../../src/lib/practice-question-model.js';
import {captureQuestionPresentation} from '../../src/lib/question-presentation.js';
import {visitFigures,solidHash} from '../audit-solid-visibility.mjs';
import {shadingContextHash} from './check-diagram-shading.mjs';

const policy='shared-stem-solution-space-v1';
const copy=v=>structuredClone(v);
const questions=p=>p.sections.flatMap(s=>s.blocks).filter(b=>b.type==='question');
const withoutIds=v=>Array.isArray(v)?v.map(withoutIds):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>k!=='id').map(([k,x])=>[k,withoutIds(x)])):v;
const leaves=n=>n.children?.length?n.children.flatMap(leaves):n.answer?[n]:[];
const clean=s=>s.replace(/\s+/g,' ').trim();

export function splitSharedPrompt(nodes){
  const values=nodes.map(n=>n.prompt);
  if(values.every(isDocument)){
    let count=0;
    while(values[0].blocks[count]&&values.every(v=>JSON.stringify(withoutIds(v.blocks[count]))===JSON.stringify(withoutIds(values[0].blocks[count]))))count++;
    assert.ok(count,'No shared native paragraphs: '+nodes[0].id);
    return {stem:{...copy(values[0]),blocks:copy(values[0].blocks.slice(0,count))},parts:values.map(v=>({...copy(v),blocks:copy(v.blocks.slice(count))}))};
  }
  if(values.some(isDocument)){
    const native=values.find(isDocument),stem={...copy(native),blocks:[copy(native.blocks[0])]},prefix=contentSource(stem);
    assert.ok(values.every(v=>isDocument(v)?clean(contentSource({...v,blocks:[v.blocks[0]]}))===clean(prefix):v.startsWith(prefix)),'Mixed prompts have no complete shared paragraph');
    return {stem,parts:values.map(v=>isDocument(v)?{...copy(v),blocks:copy(v.blocks.slice(1))}:v.slice(prefix.length).trim())};
  }
  let prefix=values[0];for(const v of values){let i=0;while(i<prefix.length&&prefix[i]===v[i])i++;prefix=prefix.slice(0,i);}
  // Never remove the common opening of a mathematical expression from its part.
  let open=-1;for(const m of prefix.matchAll(/\$\$|\$/g)){open=open<0?m.index:-1;}
  if(open>=0)prefix=prefix.slice(0,open);
  if(!values.every(v=>v===prefix)&&!/[.?:]\s*$/.test(prefix))prefix=prefix.slice(0,Math.max(prefix.lastIndexOf(' '),prefix.lastIndexOf('\n'))+1);
  assert.ok(prefix.trim().length>=5,'No shared instruction: '+nodes[0].id);
  return {stem:prefix.trim(),parts:values.map(v=>v.slice(prefix.length).trim())};
}

export function groupConceptQuestions(original,{register=sourceGroups}={}){
  if(original.source?.groupingRepair?.policy===policy)return {next:copy(original),groups:[],spacing:[],mapping:[],alreadyApplied:true};
  assert.equal(original.id,'concept-maths-adv11-ch01');
  const next=copy(original),groups=[],mapping=[],spacing=[],responseKinds={};
  for(const b of questions(original))for(const r of b.sourceReview?.responses??[])responseKinds[r.targetId]=r.kind;
  const counts={};
  for(const section of next.sections){
    const specs=register[section.topicId]??[], old=section.blocks, consumed=new Set(), blocks=[];
    for(const b of old){
      if(consumed.has(b.id))continue;
      if(b.type!=='question'){blocks.push(b);continue;}
      const number=Number(b.sourceReview?.sourceIdentity?.questionLabel);
      const spec=specs.find(([first])=>first===number);
      let result=b, members=[b];
      if(spec){
        const [first,last,sourceColumns]=spec;
        members=old.filter(x=>x.type==='question'&&Number(x.sourceReview?.sourceIdentity?.questionLabel)>=first&&Number(x.sourceReview?.sourceIdentity?.questionLabel)<=last);
        assert.equal(members.length,last-first+1,`${section.topicId} ${first}–${last}: incomplete range`);
        assert.deepEqual(old.slice(old.indexOf(b),old.indexOf(b)+members.length),members,'Group is not consecutive');
        const {stem,parts}=splitSharedPrompt(members.map(m=>m.content));
        if(/^True or False\?/.test(contentSource(stem)))for(const m of members)for(const leaf of leaves(m.content))responseKinds[leaf.id]='tick-cross';
        const id=b.id+'-group',children=members.map((m,i)=>({...copy(m.content),type:'part',label:String.fromCharCode(97+i),prompt:parts[i]}));
        for(let i=0;i<members.length;i++)assert.equal(clean(contentSource(stem)+' '+contentSource(parts[i])),clean(contentSource(members[i].content.prompt)),'Prompt meaning changed '+members[i].id);
        // A single local source column occupies half the source page. In the
        // full-width worksheet it can become two cells; retain wider source grids.
        // A one-column result must use list: the native model's grid minimum is 2.
        let columns=Math.max(2,sourceColumns);
        const measure=v=>contentSource(v).replace(/\\[a-zA-Z]+/g,'x').replace(/[{}$]/g,'').length;
        while(columns>1&&children.some(c=>measure(c.prompt)>((170-(columns-1)*6)/columns-6)/1.4))columns--;
        const classifications=members.map(m=>m.classification),frequency=new Map();
        for(const c of classifications)frequency.set(c.primarySkillId,(frequency.get(c.primarySkillId)||0)+1);
        const primary=[...frequency].sort((a,b)=>b[1]-a[1])[0][0],score=Math.max(...classifications.map(c=>c.reasoningScore));
        result={...copy(b),id,content:{id:id+'-root',type:'question',prompt:stem,layout:columns>1?'grid':'list',columns:columns>1?columns:null,children},
          classification:{primarySkillId:primary,secondarySkillIds:[...new Set(classifications.flatMap(c=>[c.primarySkillId,...c.secondarySkillIds]))].filter(x=>x!==primary),reasoningScore:score,difficulty:difficultyBandForScore(score),difficultyReason:'Shared source task; retains all constituent skill mappings and the highest constituent reasoning demand.'},
          sourceRefs:members.flatMap(m=>copy(m.sourceRefs??[])),sourceReview:{sourcePages:[...new Set(members.map(m=>m.sourcePageNumber))],sourceIdentity:{...b.sourceReview.sourceIdentity,questionLabel:`${first}–${last}`},grouping:{policy,sourceColumns,columns,layoutReason:columns===1?'Full-width parts required by expression width.':'Source groups reflow across the full worksheet width with per-cell working allowances.',sourceBlockIds:members.map(m=>m.id)},constituents:members.map(m=>({blockId:m.id,bankRef:m.bankRef,classification:m.classification,sourceRefs:m.sourceRefs,sourceReview:m.sourceReview})),responses:members.flatMap(m=>m.sourceReview?.responses??[])}};
        for(const key of ['bankRef','canonicalId','snapshotKind','presentation','sourceLayoutEvidence'])delete result[key];
        result.flow={...b.flow};delete result.flow.bankDifficulty;
        const record={topicId:section.topicId,blockId:id,sourceRange:[first,last],sourcePages:result.sourceReview.sourcePages,sourceColumns,columns,sourceBlockIds:members.map(m=>m.id),sourceBankIds:members.map(m=>m.bankRef?.id)};
        groups.push(record);members.forEach(m=>consumed.add(m.id));
      }
      const label=String(counts[section.topicId]=(counts[section.topicId]||0)+1);
      result.content.label=label;result.sourceOrder=Number(label);
      // The added part-label gutter exposes one pre-existing very wide set
      // expression. Wrap at its outer intersection without changing its tokens.
      for(const leaf of leaves(result.content))if(leaf.id==='p58-q29-root'){
        const oldPrompt=leaf.prompt,body=oldPrompt.slice(2,-2),split=body.indexOf('\\cap');
        assert.ok(split>0&&oldPrompt.startsWith('$$')&&oldPrompt.endsWith('$$'));
        leaf.prompt='$$\\begin{aligned}&'+body.slice(0,split)+'\\\\&'+body.slice(split)+'\\end{aligned}$$';
        result.sourceReview.promptReflow={targetId:leaf.id,before:oldPrompt,after:leaf.prompt,reason:'Break at the outer intersection to retain readable mathematics inside the part-label gutter.'};
      }
      const beforeSpacing=spacing.length;
      sizeQuestionWorking(result.content,{responseKinds,records:spacing,preserveExplicit:false});
      result.sourceReview={...result.sourceReview,workingSpaceEstimate:{policy,method:'Worked mathematical rows, width-dependent wrapping, fraction height and drawing allowance; final-size review required.',nodes:spacing.slice(beforeSpacing)}};
      // Old visual signatures certify historical content only.
      if(result.sourceReview.visualAudit||result.sourceReview.verification){result.sourceReview.preGroupingAcceptance={visualAudit:result.sourceReview.visualAudit,verification:result.sourceReview.verification};delete result.sourceReview.visualAudit;delete result.sourceReview.verification;}
      members.forEach((m,i)=>mapping.push({sourceBlockId:m.id,sourceIdentity:m.sourceReview.sourceIdentity,blockId:result.id,question:label,...(members.length>1?{part:String.fromCharCode(97+i)}:{})}));
      blocks.push(result);
    }
    section.blocks=blocks;
  }
  assert.equal(groups.length,Object.values(register).flat().length,'Every reviewed source range was grouped');
  const beforeLeaves=questions(original).flatMap(b=>leaves(b.content)),afterLeaves=questions(next).flatMap(b=>leaves(b.content));
  assert.deepEqual(afterLeaves.map(n=>n.id),beforeLeaves.map(n=>n.id),'Response identity/order changed');
  for(let i=0;i<beforeLeaves.length;i++)for(const key of ['answer','questionDiagrams','sharedSolutionDiagrams'])assert.deepEqual(afterLeaves[i][key],beforeLeaves[i][key],key+' changed '+beforeLeaves[i].id);
  assert.equal(mapping.length,questions(original).length);
  next.source={...next.source,groupingRepair:{policy,sourceRevision:original.revision,sourceHash:revisionHash(original),originalQuestions:questions(original).length,questions:questions(next).length,responses:afterLeaves.length,groups:groups.length,provenance:'booklets/provenance/concept-maths-adv11-ch01/grouping-repair.json'}};
  return {next,groups,spacing,mapping};
}

export async function migrateConceptQuestions({root=process.cwd(),apply=false,out='.booklet-work/concept-grouping'}={}){
 return withBankLock(async()=>{
  const started=Date.now(),bankRoot=path.join(root,'booklets/question-bank'),file=path.join(root,'booklets/projects/concept-maths-adv11-ch01.json');
  const watched=new Map();const read=async f=>{const raw=await fs.readFile(f,'utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e;});watched.set(f,raw);return raw===null?null:JSON.parse(raw);};
  const original=await read(file),repair=groupConceptQuestions(original);
  if(repair.alreadyApplied)return {alreadyApplied:true};
  const status=await projectSyncStatus(original,bankRoot);
  assert.ok(status.items.every(i=>i.state==='synced'),'Resolve existing bank changes before grouping');
  const linksFile=path.join(bankRoot,'.sync/links.json'),links=await read(linksFile);
  const shadingFile=path.join(root,'booklets/provenance/diagram-shading-2026-09-12.json'),shading=await read(shadingFile);
  await read(path.join(bankRoot,'manifest.json'));
  const originalBanks=new Map();for(const b of questions(original))originalBanks.set(b.bankRef.id,await read(path.join(bankRoot,b.bankRef.id+'.json')));
  const entries=[],updates=[],now=new Date().toISOString();
  for(const g of repair.groups)for(const id of g.sourceBankIds)delete links[id];
  for(const b of questions(repair.next)){
    const group=repair.groups.find(g=>g.blockId===b.id),previous=b.bankRef?originalBanks.get(b.bankRef.id):null;
    const hex=revisionHash([original.id,b.id,policy]).slice(0,32),id=previous?.id??`q-${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    const bank=normaliseQuestion({...previous,id,content:b.content,classification:b.classification,status:previous?.status??'approved',createdAt:previous?.createdAt??now,updatedAt:now,presentation:captureQuestionPresentation(b,repair.next.settings.layoutOverrides)});
    const check=validateQuestion(bank);assert.ok(check.valid,b.id+': '+check.errors.join('; '));
    if(!previous)assert.equal(await read(path.join(bankRoot,id+'.json')),null,'Grouped bank ID already exists');
    else entries.push([path.join(bankRoot,'.revisions',id,revisionHash(previous)+'.json'),previous]);
    b.bankRef={id,revision:revisionHash(bank)};b.canonicalId=id;b.snapshotKind='bank';b.presentation=captureQuestionPresentation(b,repair.next.settings.layoutOverrides);
    b.flow={...b.flow,bankDifficulty:{...b.classification,revision:revisionHash(bank)}};
    registerOwner(links,repair.next,b,bank);entries.push([path.join(bankRoot,id+'.json'),bank]);updates.push(bank);
    if(group)group.bankId=id;
  }
  repair.next.revision=original.revision+1;repair.next.updatedAt=now;
  // No fill or geometric source changed. Rebind each existing purposeful-fill
  // review to the new question/part path and shared mathematical context.
  const originalHashes=new Set();visitFigures(original,d=>originalHashes.add(solidHash(d.code)));
  for(const [relative,data] of [['booklets/projects/'+original.id+'.json',repair.next],...updates.map(q=>['booklets/question-bank/'+q.id+'.json',q])])visitFigures(data,d=>{
    const hash=solidHash(d.code);assert.ok(originalHashes.has(hash),'Diagram source changed during grouping');
    const review=shading.reviews[hash];assert.ok(review,'Missing prior purposeful-shading review');
    const occurrence=relative+'#'+d.location+'@'+(d.index??0);
    review.occurrences=[...new Set([...(review.occurrences??[]),occurrence])];review.contextHashes={...review.contextHashes,[occurrence]:shadingContextHash(data,d.location)};
  });
  const receipt={version:1,policy,createdAt:now,sourceHash:revisionHash(original),resultHash:revisionHash(repair.next),sourceRevision:original.revision,resultRevision:repair.next.revision,...repair.next.source.groupingRepair,groups:repair.groups,mapping:repair.mapping,spacing:repair.spacing,verification:{responseIdentityOrderAndAnswers:true,sourcePromptRecomposition:true,sourceGroupsVisuallyReviewed:true,renderReview:'pending'},elapsedMs:Date.now()-started};
  const historyFile=path.join(root,'booklets/projects/.revisions',original.id,original.revision+'.json'),history=await read(historyFile);
  if(history)assert.deepEqual(history,original,'Existing recovery revision differs');else entries.push([historyFile,original]);
  entries.push([linksFile,links],[shadingFile,shading],await bankManifestEntry(bankRoot,updates),[file,repair.next],[path.join(root,repair.next.source.groupingRepair.provenance),receipt]);
  await fs.mkdir(path.join(root,out),{recursive:true});await fs.writeFile(path.join(root,out,'candidate.json'),JSON.stringify(repair.next,null,2)+'\n');await fs.writeFile(path.join(root,out,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');
  if(apply){for(const[f,before]of watched)assert.equal(await fs.readFile(f,'utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e;}),before,'Stale migration input: '+f);await writeTransaction(entries);const after=await projectSyncStatus(repair.next,bankRoot);assert.ok(after.items.every(i=>i.state==='synced'),'Read-back sync failed');}
  return {applied:apply,questions:questions(repair.next).length,groups:repair.groups.length,responses:repair.spacing.length,elapsedMs:Date.now()-started};
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await migrateConceptQuestions({apply:process.argv.includes('--apply')})));
