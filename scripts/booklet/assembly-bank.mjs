import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { normaliseQuestion } from '../../src/lib/practice-question-model.js';
import { isSelectableBankQuestion } from '../../src/lib/question-bank-eligibility.js';
import { deriveAnswer } from '../../src/lib/booklet-model.js';
import { splitInlineContent } from '../../src/lib/inline-content.js';
export function solutionFields(solution, id, answer = null) {
  const parsed=splitInlineContent(solution);
  if(parsed.errors.length)throw new Error('Invalid source solution diagrams: '+parsed.errors.join('; '));
  const worked=parsed.parts.filter(p=>p.type==='text').map(p=>p.value).join('\n').trim();
  return {short:answer??deriveAnswer(worked),worked,solutionDiagrams:parsed.parts.filter(p=>p.type==='tikz').map((p,i)=>({id:`${id}-solution-${i+1}`,role:'solution',format:'tikz',code:p.value,widthMm:80}))};
}
export async function mathsMapCandidates(skillIds,{root=process.cwd()}={}) {
  const result=[];
  const skills=JSON.parse(await fs.readFile(path.join(root,'data','skills.json'),'utf8'));
  for(const skillId of [...new Set(skillIds)]) {
    if(!/^[a-z0-9-]+$/.test(skillId))throw new Error('Invalid skill ID');
    let source;try{source=JSON.parse(await fs.readFile(path.join(root,'public','content',skillId+'.json'),'utf8'));}catch(e){if(e.code==='ENOENT')continue;throw e;}
    const revision=createHash('sha256').update(JSON.stringify(source)).digest('hex');
    for(const tier of ['foundation','development','mastery']) for(const [index,q] of (source.practice?.[tier]??[]).entries()) {
      const id=`mathsmap-${skillId}-${tier}-${index+1}`;
      const question=normaliseQuestion({id,classification:{primarySkillId:skillId,difficulty:tier[0].toUpperCase()+tier.slice(1)},content:{id:id+'-root',type:'question',prompt:q.question_text,children:[],answer:solutionFields(q.solution_text,id,q.answer),questionDiagrams:[]}});
      result.push({question,origin:'mathsmap',sourceId:question.id,revision,skillIds:[skillId],archetype:q.structure??'',tier:question.classification.difficulty,prerequisiteIds:skills.find(s=>s.id===skillId)?.prereqs??[]});
    }
  }
  const bankRoot=path.join(root,'booklets','question-bank'),files=await fs.readdir(bankRoot).catch(e=>{if(e.code==='ENOENT')return [];throw e;});
  for(const name of files.filter(n=>n.endsWith('.json')&&n!=='manifest.json')){
    const raw=JSON.parse(await fs.readFile(path.join(bankRoot,name),'utf8'));if(!isSelectableBankQuestion(raw))continue;
    const question=normaliseQuestion(raw),mapped=[question.classification.primarySkillId,...question.classification.secondarySkillIds];if(!mapped.some(s=>skillIds.includes(s)))continue;
    const prerequisiteIds=new Set(),walk=n=>{for(const key of n.teachingMapping?.prerequisiteIds??[])prerequisiteIds.add(key);(n.children??[]).forEach(walk);};walk(question.content);
    result.push({question,origin:'bank',sourceId:question.id,revision:createHash('sha256').update(JSON.stringify(raw)).digest('hex'),skillIds:mapped,archetype:question.classification.archetype??'',tier:question.classification.difficulty,prerequisiteIds:[...prerequisiteIds]});
  }
  return result;
}
