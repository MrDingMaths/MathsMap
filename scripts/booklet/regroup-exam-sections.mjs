// Explicit candidate builder, never a load-time migration or a live publisher.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {exerciseUnits} from '../../src/lib/booklet-exercises.js';
import {normaliseQuestionSource} from '../../src/lib/question-source.js';

export function sourceFromBookletTitle(block) {
  if(block.source?.label)return ['HSC','HSC-trial','PLC'].includes(block.source.provider)?structuredClone(block.source):null;
  const title=String(block.title??'').trim().replace(/\s+Band\s+\d+\s*$/i,'');
  const paper=title.match(/\b(Advanced|Extension\s+[12]|Standard(?:\s+[12])?)\b/i)?.[1];
  if(!/^((?:19|20)\d{2}\s+)?HSC\b/i.test(title))return null;
  const year=title.match(/\b((?:19|20)\d{2})\b/)?.[1];
  if(!paper)return !year&&/^HSC Sample Question$/i.test(title)?{provider:'HSC',label:title,origin:'booklet'}:null;
  if(!year&&!/\bSample Question\b/i.test(title))return null;
  return {provider:'HSC',paper,...(year?{year}:{}),label:year?`HSC ${paper} ${year}`:title,origin:'booklet'};
}

export function existingExamCandidate(project,{courses=[],excludedIds=[]}={}) {
  const stage=courses.find(c=>c.id===project.library?.courseId)?.stage;
  const excluded=project.library?.category!=='master'||project.library?.archivedAt||![5,6].includes(stage)||excludedIds.includes(project.id)||project.library?.exemplar||project.exemplar||/\bexemplar\b/i.test(`${project.id} ${project.title}`);
  if(excluded)return {project:null,report:{projectId:project.id,status:'excluded'}};
  const candidate=structuredClone(project),topics=new Map((candidate.topics??[]).map(t=>[t.id,t.title]));
  const isExam=s=>s.role==='exam'||/^exam questions$/i.test(topics.get(s.topicId)??s.title??'');
  const isChallenge=s=>s.role==='challenge'||/^challenge(?: exercise| questions)?$/i.test(topics.get(s.topicId)??s.title??'');
  const isMixed=s=>s.role==='mixed-review'||/^mixed review$/i.test(topics.get(s.topicId)??s.title??'');
  const held=[],moved=[],labelled=[],newExamBlocks=[],examSections=candidate.sections.filter(isExam);
  const hasUnsupportedSource=block=>block.source&&!block.source.label&&Object.keys(block.source).length;
  const label=block=>{
    if(block.type!=='question')return true;
    if(hasUnsupportedSource(block)){held.push({id:block.id,reason:'existing source lineage needs explicit label merge'});return false;}
    const source=sourceFromBookletTitle(block);
    if(!source){held.push({id:block.id,reason:'exam attribution is ambiguous or missing'});return false;}
    if(!block.source?.label){block.source=source;labelled.push(block.id);}return true;
  };
  // Entire explicit Exam sections retain their instructions, content and order.
  for(const section of examSections){
    if(section.blocks.some(b=>b.type==='question'&&(!sourceFromBookletTitle(b)||hasUnsupportedSource(b)))){
      held.push({sectionId:section.id,reason:'explicit exam section has ambiguous attribution; whole section held'});continue;
    }
    section.blocks.forEach(label);section.role='exam';section.workingSpace='none';
  }
  for(const section of candidate.sections){
    if(isExam(section)||isChallenge(section)||isMixed(section)||section.phase!=='practice')continue;
    for(const block of section.blocks)if(block.type==='question'&&/^(?:(?:19|20)\d{2}\s+)?HSC\b/i.test(String(block.title??'').trim())&&!sourceFromBookletTitle(block))held.push({id:block.id,reason:'existing HSC attribution lacks a recognized paper/year or explicit undated-sample mapping; unchanged in exercise'});
    const selected=new Set(section.blocks.filter(b=>b.type==='question'&&sourceFromBookletTitle(b)).map(b=>b.id));
    if(!selected.size)continue;
    const units=exerciseUnits(section);
    if(units.unresolved){held.push({sectionId:section.id,reason:'cross-section or unresolved dependency requires review'});continue;}
    const remove=new Set();
    for(const unit of units.groups.filter(u=>u.blocks.some(b=>selected.has(b.id)))){
      if(unit.blocks.some(b=>b.type!=='question'||!selected.has(b.id)||hasUnsupportedSource(b))){held.push({ids:unit.blocks.map(b=>b.id),reason:'linked question or meaningful instruction has ambiguous exam scope; unit held'});continue;}
      for(const block of unit.blocks){label(block);remove.add(block.id);newExamBlocks.push(block);moved.push({id:block.id,from:section.id});}
    }
    section.blocks=section.blocks.filter(b=>!remove.has(b.id));
  }
  if(newExamBlocks.length){
    let section=candidate.sections.find(s=>s.role==='exam');
    if(!section){const id=project.id+'-exam-questions';if(candidate.sections.some(s=>s.id===id)||(candidate.topics??[]).some(t=>t.id===id))throw Error('Exam section identity collision: '+project.id);candidate.topics??=[];candidate.topics.push({id,title:'Exam questions'});section={id,topicId:id,title:'Exam questions',role:'exam',phase:'practice',workingSpace:'none',pageBreakBefore:true,blocks:[]};candidate.sections.push(section);}
    section.blocks.push(...newExamBlocks);
  }
  // Explicit operation only. Existing question payloads and section IDs stay intact.
  const ordinary=[],mixed=[],exams=[],challenge=[];
  for(const section of candidate.sections){
    if(isChallenge(section)){section.role='challenge';section.workingSpace='none';challenge.push(section);}
    else if(isMixed(section)){mixed.push(section);}
    else if(section.role==='exam')exams.push(section);
    else ordinary.push(section);
  }
  // Do not make an unrelated Challenge-only change on a booklet with no exam work.
  const changed=labelled.length||moved.length||examSections.some(s=>JSON.stringify(s)!==JSON.stringify(project.sections.find(old=>old.id===s.id)));
  if(!changed)return {project:null,report:{projectId:project.id,revision:project.revision,status:held.length?'held':'unchanged',held}};
  candidate.sections=[...ordinary,...mixed,...exams,...challenge];
  const beforeIds=project.sections.flatMap(s=>s.blocks).map(b=>b.id).sort(),afterIds=candidate.sections.flatMap(s=>s.blocks).map(b=>b.id).sort();
  if(JSON.stringify(beforeIds)!==JSON.stringify(afterIds))throw Error('Regrouping changed block identities');
  for(const block of candidate.sections.flatMap(s=>s.blocks))if(block.source?.label&&!normaliseQuestionSource(block.source))throw Error('Invalid source label');
  return {project:candidate,report:{projectId:project.id,revision:project.revision,status:held.length?'candidate-with-holds':'candidate',moved,labelled,examSectionIds:exams.map(s=>s.id),challengeSectionIds:challenge.map(s=>s.id),held,publication:false}};
}

async function main(){
 const args=process.argv.slice(2),option=name=>args.includes(name)?args[args.indexOf(name)+1]:undefined;
 const out=option('--out');if(!out)throw Error('Usage: node scripts/booklet/regroup-exam-sections.mjs --out DIRECTORY [--project ID] [--exclude ID,ID]');
 const courses=JSON.parse(await fs.readFile('data/courses.json','utf8')),reports=[];
 for(const file of (await fs.readdir('booklets/projects')).filter(f=>f.endsWith('.json'))){
  if(option('--project')&&file!==option('--project')+'.json')continue;
  const raw=await fs.readFile(path.join('booklets/projects',file),'utf8'),project=JSON.parse(raw),result=existingExamCandidate(project,{courses,excludedIds:(option('--exclude')??'').split(',').filter(Boolean)});
  reports.push(result.report);if(!result.project)continue;
  const folder=path.join(out,project.id);await fs.mkdir(folder,{recursive:true});
  await fs.writeFile(path.join(folder,'before.json'),raw,{flag:'wx'});
  await fs.writeFile(path.join(folder,'candidate.json'),JSON.stringify(result.project,null,2)+'\n',{flag:'wx'});
  await fs.writeFile(path.join(folder,'report.json'),JSON.stringify({...result.report,baselineHash:createHash('sha256').update(raw).digest('hex')},null,2)+'\n',{flag:'wx'});
 }
 await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'inventory.json'),JSON.stringify(reports,null,2)+'\n');
 console.log(JSON.stringify({candidates:reports.filter(r=>r.status.startsWith('candidate')).length,held:reports.reduce((n,r)=>n+(r.held?.length??0),0),moved:reports.reduce((n,r)=>n+(r.moved?.length??0),0),labelled:reports.reduce((n,r)=>n+(r.labelled?.length??0),0)}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
