import { studioProject, reviewTargets } from './booklet-review-model.js';
import { normaliseQuestion, validateQuestion } from './practice-question-model.js';
import { contentSource } from './document-content.js';
import {remapQuestionPresentation} from './question-presentation.js';
const copy=v=>JSON.parse(JSON.stringify(v));
const uid=()=>globalThis.crypto?.randomUUID?.() ?? `assembly-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const candidateValid = c => Boolean(c.skillIds?.length) && validateQuestion(normaliseQuestion({...c.question, classification:{...c.question.classification,primarySkillId:c.skillIds?.[0],secondarySkillIds:c.skillIds?.slice(1)??[]}})).valid;
export const ASSEMBLY_TIERS=['Foundation','Development','Mastery'];
export function defaultRecipe(project) {
  const chunks=[];
  for(const section of project.sections) {
    const theory=section.blocks.filter(b=>b.type!=='question' && !['page-break','spacer','heading'].includes(b.type));
    if(!theory.length || ['front-matter','candidate-pool'].includes(section.role))continue;
    const key=section.sourceSectionId ?? section.title;
    let chunk=chunks.find(c=>c.key===key);
    if(!chunk){chunk={id:uid(),key,title:section.title,blockIds:[],skillIds:[],archetypes:[],prerequisiteIds:[],teachingAtomIds:[]};chunks.push(chunk);}
    chunk.blockIds.push(...theory.map(b=>b.id));
    for(const target of reviewTargets(project).filter(t=>t.section.id===section.id)) {
      const a=project.studio?.atoms?.[target.id];if(!a)continue;
      if(a.role==='teaches')chunk.teachingAtomIds.push(target.id);
      chunk.skillIds.push(...(a.skillIds??[]));chunk.prerequisiteIds.push(...(a.prerequisiteIds??[]));if(a.archetype)chunk.archetypes.push(a.archetype);
    }
    for(const k of ['skillIds','archetypes','prerequisiteIds','teachingAtomIds'])chunk[k]=[...new Set(chunk[k])];
  }
  return {format:'mathsmap-assembly-recipe-v1',chunks,scopeSkillIds:[...new Set(chunks.flatMap(c=>c.skillIds))],assumedPrerequisites:[],extensions:[],counts:{examples:1,guided:2,Foundation:2,Development:2,Mastery:1,mini:4,cumulative:12,challenge:2},optionalMastery:true,exceptions:{}};
}
export function candidatesFromProject(project) {
  return reviewTargets(project).filter(t=>t.kind==='block' && t.block.type==='question').map(t=>{
    const mappings=reviewTargets(project).filter(x=>x.block.id===t.id).map(x=>project.studio?.atoms?.[x.id]).filter(Boolean);
    const question=normaliseQuestion(t.block);const attach=n=>{if(project.studio?.atoms?.[n.id])n.teachingMapping=copy(project.studio.atoms[n.id]);(n.children??[]).forEach(attach);};attach(question.content);
    if(project.studio?.atoms?.[t.id])question.teachingMapping=copy(project.studio.atoms[t.id]);
    const bank=t.block.bankRef?.id&&t.block.bankRef?.revision;if(bank)question.id=t.block.bankRef.id;
    return {question,origin:bank?'bank':t.block.candidateOrigin??'imported',sourceId:t.id,revision:bank?t.block.bankRef.revision:project.revision,skillIds:[...new Set([...(mappings.length?mappings.flatMap(m=>m.skillIds??[]):[t.block.classification?.primarySkillId,...(t.block.classification?.secondarySkillIds??[])])].filter(Boolean))],archetype:mappings.find(m=>m.archetype)?.archetype??t.block.classification?.archetype??'',tier:t.block.classification?.difficulty??'Foundation',prerequisiteIds:[...new Set([...mappings.flatMap(m=>m.prerequisiteIds??[]),...(t.block.generationEvidence?.prerequisiteIds??[])])],};
  });
}
export const coverageKey=(chunk,archetype,tier)=>`${chunk.id}:${archetype}:${tier}`;
export function coverageMatrix(recipe,candidates) {
  const rows=[];
  for(const chunk of recipe.chunks)for(const archetype of chunk.archetypes)for(const tier of ASSEMBLY_TIERS) {
    const key=coverageKey(chunk,archetype,tier),exception=recipe.exceptions?.[key];
    const count=candidates.filter(c=>candidateValid(c) && c.archetype===archetype && c.tier===tier && c.skillIds.some(s=>chunk.skillIds.includes(s)) && c.skillIds.every(s=>[...recipe.scopeSkillIds,...recipe.extensions].includes(s))).length;
    const required=Number(recipe.counts[tier]);
    rows.push({key,chunkId:chunk.id,chunk:chunk.title,archetype,tier,available:count,required,status:(exception?.notApplicable ?? exception?.approved) && exception.reason?.trim()?'not-applicable':count>=required?'covered':'gap',reason:exception?.reason??''});
  }
  return rows;
}
function rekeyTree(value,lineage,origin) {
  const ids=new Map(),walk=(v,fn)=>{if(!v||typeof v!=='object')return;fn(v);Object.values(v).forEach(x=>Array.isArray(x)?x.forEach(n=>walk(n,fn)):walk(x,fn));};
  walk(value,v=>{if(v.id)ids.set(v.id,uid());});
  walk(value,v=>{if(v.id){const old=v.id;v.id=ids.get(old);lineage[v.id]={sourceIds:[old],origin};}if(v.overlayOf&&ids.has(v.overlayOf))v.overlayOf=ids.get(v.overlayOf);if(v.dependsOn)v.dependsOn=v.dependsOn.map(key=>ids.get(key)??key);if(v.diagramSlots)v.diagramSlots=Object.fromEntries(Object.entries(v.diagramSlots).map(([id,slot])=>[ids.get(id)??id,slot]));});return value;
}
function snapshot(candidate,role,lineage) {
  const bank=candidate.origin==='bank'&&candidate.revision;
  const block={...copy(candidate.question),id:uid(),type:'question',title:candidate.question.title??'',classification:{...candidate.question.classification,primarySkillId:candidate.skillIds[0],secondarySkillIds:candidate.skillIds.slice(1),difficulty:candidate.tier,archetype:candidate.archetype},pedagogyRole:role,snapshotKind:bank?'bank':'local',bankRef:bank?{id:candidate.question.id,revision:candidate.revision}:null,sourceQuestionRef:{origin:candidate.origin,id:candidate.question.id,revision:candidate.revision??null}};
  block.presentation=copy(candidate.question.presentation??{});
  delete block.sourceOrder;
  rekeyTree(block.content,lineage,candidate.origin);
  lineage[block.id]={sourceIds:[candidate.sourceId??candidate.question.id],origin:candidate.origin};
  const ids=new Map(Object.entries(lineage).flatMap(([id,v])=>(v.sourceIds??[]).map(old=>[old,id])));
  if(block.presentation.ownerId)ids.set(block.presentation.ownerId,block.id);
  block.presentation=remapQuestionPresentation(block.presentation,ids);
  return block;
}
function promptSignature(question) {
  const node=n=>({prompt:contentSource(n?.prompt).replace(/\s+/g,' ').trim(),diagrams:(n?.questionDiagrams??[]).map(d=>d.code??d.src),children:(n?.children??[]).map(node)});
  return JSON.stringify(node(question.content));
}
// Compare table exercises across the bank's TeX arrays and imported Markdown.
// Keep this deliberately narrow: a graph or recognition task is a different task.
function exerciseSignatures(question) {
  const keys=[promptSignature(question)];
  const visit=(node,context='')=>{
    const text=contentSource(node.prompt),combined=context+'\n'+text;
    if(node.children?.length){node.children.forEach(child=>visit(child,combined));return;}
    if(!/\b(?:complete|construct)\b[^.\n]*\btable/i.test(combined))return;
    const equation=text.match(/\$\s*y\s*=([^$]+)\$/)?.[1];
    const markdown=text.match(/\|\s*\$?x\$?\s*\|([^\n]+)/)?.[1];
    const array=text.match(/\bx\s*&\s*([^]*?)\\\\/)?.[1];
    const values=(markdown??array)?.replace(/\$/g,'').split(markdown?'|':'&').map(v=>v.trim()).filter(Boolean);
    if(equation&&values?.length&&values.every(v=>/^-?\d+(?:\.\d+)?$/.test(v)))keys.push('table:'+equation.replace(/\s+/g,'')+':'+values.join(','));
  };
  visit(question.content);return keys;
}
export function assembleBooklet(project,recipe,candidates) {
  if(recipe.mode==='revision')return assembleRevisionBooklet(project,recipe,candidates);
  if(recipe.format!=='mathsmap-assembly-recipe-v1'||!recipe.chunks.length)throw new Error('Define at least one teaching chunk');
  if(Object.values(recipe.counts).some(n=>!Number.isInteger(Number(n))||Number(n)<0||Number(n)>100))throw new Error('Question counts must be integers from 0 to 100');
  const scope=new Set([...recipe.scopeSkillIds,...recipe.extensions]), taught=new Set(recipe.assumedPrerequisites??[]), used=new Set(), usedPrompts=new Set(), sections=[],lineage={},gaps=[];
  const allBlocks=new Map(project.sections.flatMap(s=>s.blocks.map(b=>[b.id,b])));
  const valid=candidates.filter(c=>candidateValid(c) && c.skillIds.length && c.skillIds.every(s=>scope.has(s)));
  const eligible=(c,ids,tiers)=>!used.has(c.question.id)&&c.skillIds.every(s=>ids.has(s))&&tiers.includes(c.tier)&&(c.prerequisiteIds??[]).every(s=>taught.has(s));
  const choose=(pool,count,role)=>{const result=[];for(const candidate of pool){
    if(result.length>=count)break;
    const groupIds=candidate.question.presentation?.selectionGroup?.questionIds??[candidate.question.id];
    const group=groupIds.map(id=>pool.find(c=>c.question.id===id));
    if(group.some(c=>!c)||result.length+group.length>count)continue;
    if(group.some(c=>used.has(c.question.id)||exerciseSignatures(c.question).some(key=>usedPrompts.has(key))))continue;
    for(const c of group){used.add(c.question.id);exerciseSignatures(c.question).forEach(key=>usedPrompts.add(key));result.push(snapshot(c,role,lineage));}
  }return result;};
  const add=(title,role,blocks,optional=false)=>sections.push({id:uid(),title:title+(optional?' (optional strand)':''),role,optional,blocks:blocks.length?blocks:[{id:uid(),type:'rich-text',content:'Coverage gap — select questions for this section.'}]});
  const mixed=(title,role,count,tiers,preferImported=false)=>{
    if(!Number(count))return;
    const pool=valid.filter(c=>eligible(c,taught,tiers));
    pool.sort((a,b)=>(preferImported?Number(b.origin==='imported')-Number(a.origin==='imported'):Number(b.origin==='mathsmap')-Number(a.origin==='mathsmap')) || a.question.id.localeCompare(b.question.id));
    // Round-robin skill queues tests method selection while preserving whole questions.
    const queues=new Map();for(const c of pool){const key=c.skillIds[0]+':'+c.tier;if(!queues.has(key))queues.set(key,[]);queues.get(key).push(c);}
    const ordered=[];while([...queues.values()].some(q=>q.length))for(const q of queues.values())if(q.length)ordered.push(q.shift());
    const blocks=choose(ordered,count,role);if(blocks.length<count)gaps.push({section:title,required:count,selected:blocks.length});if(role==='mixed-practice')for(const tier of tiers)if(!blocks.some(b=>b.classification.difficulty===tier))gaps.push({section:title,tier,reason:'No selected question at this tier'});add(title,role,blocks);
  };
  recipe.chunks.forEach((chunk,index)=>{
    if(!chunk.skillIds.length || !chunk.archetypes.length)gaps.push({section:chunk.title,reason:'Missing skill or archetype mapping'});
    const untaught=(chunk.prerequisiteIds??[]).filter(p=>!taught.has(p)&&!chunk.skillIds.includes(p));if(untaught.length)throw new Error(`${chunk.title} has untaught prerequisites: ${untaught.join(', ')}`);
    if(chunk.skillIds.some(s=>!scope.has(s)))throw new Error(chunk.title+' includes skills outside the selected grouping or explicit extensions');
    const theory=chunk.blockIds.map(blockId=>{const block=allBlocks.get(blockId);if(!block)throw new Error('Theory block removed: '+blockId);return rekeyTree(copy(block),lineage,'imported');});
    chunk.skillIds.forEach(s=>taught.add(s));
    (chunk.teachingAtomIds??[]).forEach(s=>taught.add(s));
    const pool=valid.filter(c=>eligible(c,new Set(chunk.skillIds),ASSEMBLY_TIERS)).sort((a,b)=>Number(b.origin==='mathsmap')-Number(a.origin==='mathsmap')||a.question.id.localeCompare(b.question.id));
    const examples=choose(pool.filter(c=>c.tier==='Foundation'),Number(recipe.counts.examples??0),'worked-example');
    if(examples.length<(recipe.counts.examples??0))gaps.push({section:'Theory — '+chunk.title,reason:'Missing worked-example candidates'});
    add('Theory — '+chunk.title,'teaching',[...theory,...examples]);
    const guided=choose(pool.filter(c=>c.tier==='Foundation'),Number(recipe.counts.guided),'guided-practice');if(guided.length<recipe.counts.guided)gaps.push({section:'Guided — '+chunk.title,required:recipe.counts.guided,selected:guided.length});add('Guided — '+chunk.title,'teaching',guided);
    for(const tier of ASSEMBLY_TIERS){if(!Number(recipe.counts[tier]))continue;const applicable=chunk.archetypes.filter(a=>{const ex=recipe.exceptions?.[coverageKey(chunk,a,tier)];return !((ex?.notApplicable ?? ex?.approved)&&ex.reason?.trim());});if(!applicable.length)continue;const blocks=[];for(const archetype of chunk.archetypes){const exception=recipe.exceptions?.[coverageKey(chunk,archetype,tier)];if((exception?.notApplicable ?? exception?.approved)&&exception.reason?.trim())continue;const selected=choose(pool.filter(c=>c.tier===tier&&c.archetype===archetype),Number(recipe.counts[tier]),'blocked-practice');blocks.push(...selected);if(selected.length<recipe.counts[tier])gaps.push({section:chunk.title,archetype,tier,required:recipe.counts[tier],selected:selected.length});}add(`Blocked ${tier} — ${chunk.title}`,'teaching',blocks,tier==='Mastery'&&recipe.optionalMastery);}
    if(index>=1&&index<recipe.chunks.length-1)mixed('Mini mixed review — '+recipe.chunks.slice(0,index+1).map(c=>c.title).join(' + '),'mixed-practice',recipe.counts.mini,['Foundation','Development']);
  });
  mixed('Cumulative interleaved practice','mixed-practice',recipe.counts.cumulative,ASSEMBLY_TIERS,true);
  mixed('Challenge exercise','challenge',recipe.counts.challenge,['Challenge'],true);
  const assembled=studioProject({...project,id:'assembled-'+uid(),title:project.title+' — assembled',revision:0,status:'draft',sections,source:{type:'assembly',projectId:project.id,revision:project.revision,runId:project.source?.runId},studio:undefined});
  for(const target of reviewTargets(assembled)){if(target.node.teachingMapping)assembled.studio.atoms[target.id]=copy(target.node.teachingMapping);}
  assembled.studio.lineage=lineage;assembled.studio.recipe=copy(recipe);assembled.studio.assemblyGaps=gaps;
  return {project:assembled,gaps,coverage:coverageMatrix(recipe,candidates),selectedQuestionCount:used.size};
}

// Explicit selections make a revision recipe reproducible without teaching sections.
export function assembleRevisionBooklet(project,recipe,candidates) {
  if(recipe.format!=='mathsmap-assembly-recipe-v1'||!recipe.sessions?.length)throw new Error('Define revision sessions');
  const scope=new Set([...(recipe.scopeSkillIds??[]),...(recipe.extensions??[])]);
  const available=new Map(candidates.map(c=>[c.question.id,c]));
  const used=new Set(),signatures=new Set(),lineage={},sections=[];
  for(const session of recipe.sessions){
    if(!session.questionIds?.length)throw new Error('Revision sessions need selected questions');
    const blocks=[];
    for(const id of session.questionIds){
      const c=available.get(id);
      if(!c||!candidateValid(c))throw new Error('Missing or invalid revision question: '+id);
      if(recipe.questionRevisions?.[id]&&recipe.questionRevisions[id]!==c.revision)throw new Error('Revision question version changed: '+id);
      if((c.question.presentation?.selectionGroup?.questionIds??[]).some(required=>!session.questionIds.includes(required)))throw new Error('Keep the dependent question group together: '+id);
      if(!c.skillIds.every(s=>scope.has(s)))throw new Error('Revision question outside scope: '+id);
      if((c.prerequisiteIds??[]).some(s=>!(recipe.assumedPrerequisites??[]).includes(s)))throw new Error('Revision question has unconfirmed prerequisites: '+id);
      if(used.has(id)||exerciseSignatures(c.question).some(s=>signatures.has(s)))throw new Error('Repeated revision question: '+id);
      used.add(id);exerciseSignatures(c.question).forEach(s=>signatures.add(s));
      blocks.push(snapshot(c,session.optional?'challenge':'practice',lineage));
    }
    sections.push({id:uid(),title:session.title,role:session.optional?'challenge':'mixed-practice',optional:Boolean(session.optional),blocks});
  }
  const assembled=studioProject({...project,id:'assembled-'+uid(),title:recipe.title??project.title+' — revision',revision:0,status:'draft',sections,source:{type:'assembly',projectId:project.id,revision:project.revision},studio:undefined,settings:{...project.settings,preserveSourcePages:false}});
  assembled.studio.lineage=lineage;assembled.studio.recipe=copy(recipe);assembled.studio.assemblyGaps=[];
  // Layout references address both question nodes and rich-document fragments.
  const overrides={blockLayouts:{},answerSpaces:{},diagramColourModes:{}};
  for(const section of sections)for(const block of section.blocks)for(const key of Object.keys(overrides))Object.assign(overrides[key],block.presentation?.layoutOverrides?.[key]??{});
  assembled.settings.layoutOverrides=overrides;
  for(const target of reviewTargets(assembled))if(target.node.teachingMapping)assembled.studio.atoms[target.id]=copy(target.node.teachingMapping);
  return {project:assembled,gaps:[],coverage:[],selectedQuestionCount:used.size};
}
