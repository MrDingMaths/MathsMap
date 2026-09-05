import { studioProject, reviewTargets, approvalCurrent } from './booklet-review-model.js';
import { normaliseQuestion } from './practice-question-model.js';
import { contentSource } from './document-content.js';
const copy=v=>JSON.parse(JSON.stringify(v));
const uid=()=>globalThis.crypto?.randomUUID?.() ?? `assembly-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
    const targets=reviewTargets(project).filter(x=>x.block.id===t.id);
    const question=normaliseQuestion(t.block);const attach=n=>{if(project.studio?.atoms?.[n.id])n.teachingMapping=copy(project.studio.atoms[n.id]);(n.children??[]).forEach(attach);};attach(question.content);
    if(project.studio?.atoms?.[t.id])question.teachingMapping=copy(project.studio.atoms[t.id]);
    return {question,origin:t.block.candidateOrigin??'imported',sourceId:t.id,revision:project.revision,skillIds:[...new Set([...(mappings.length?mappings.flatMap(m=>m.skillIds??[]):[t.block.classification?.primarySkillId,...(t.block.classification?.secondarySkillIds??[])])].filter(Boolean))],archetype:mappings.find(m=>m.archetype)?.archetype??t.block.classification?.archetype??'',tier:t.block.classification?.difficulty??'Foundation',prerequisiteIds:[...new Set([...mappings.flatMap(m=>m.prerequisiteIds??[]),...(t.block.generationEvidence?.prerequisiteIds??[])])],reviewed:targets.every(x=>approvalCurrent(project,x.id,'content')&&approvalCurrent(project,x.id,'mapping'))};
  });
}
export const coverageKey=(chunk,archetype,tier)=>`${chunk.id}:${archetype}:${tier}`;
export function coverageMatrix(recipe,candidates) {
  const rows=[];
  for(const chunk of recipe.chunks)for(const archetype of chunk.archetypes)for(const tier of ASSEMBLY_TIERS) {
    const key=coverageKey(chunk,archetype,tier),exception=recipe.exceptions?.[key];
    const count=candidates.filter(c=>c.reviewed && c.archetype===archetype && c.tier===tier && c.skillIds.some(s=>chunk.skillIds.includes(s)) && c.skillIds.every(s=>[...recipe.scopeSkillIds,...recipe.extensions].includes(s))).length;
    const required=Number(recipe.counts[tier]);
    rows.push({key,chunkId:chunk.id,chunk:chunk.title,archetype,tier,available:count,required,status:exception?.approved && exception.reason?.trim()?'not-applicable':count>=required?'covered':'gap',reason:exception?.reason??''});
  }
  return rows;
}
function rekeyTree(value,lineage,origin) {
  const ids=new Map(),walk=(v,fn)=>{if(!v||typeof v!=='object')return;fn(v);Object.values(v).forEach(x=>Array.isArray(x)?x.forEach(n=>walk(n,fn)):walk(x,fn));};
  walk(value,v=>{if(v.id)ids.set(v.id,uid());});
  walk(value,v=>{if(v.id){const old=v.id;v.id=ids.get(old);lineage[v.id]={sourceIds:[old],origin};}if(v.overlayOf&&ids.has(v.overlayOf))v.overlayOf=ids.get(v.overlayOf);if(v.dependsOn)v.dependsOn=v.dependsOn.map(key=>ids.get(key)??key);});return value;
}
function snapshot(candidate,role,lineage) {
  const bank=candidate.origin==='bank'&&candidate.revision;
  const block={...copy(candidate.question),id:uid(),type:'question',title:candidate.question.title??'',classification:{...candidate.question.classification,primarySkillId:candidate.skillIds[0],secondarySkillIds:candidate.skillIds.slice(1),difficulty:candidate.tier,archetype:candidate.archetype},pedagogyRole:role,snapshotKind:bank?'bank':'local',bankRef:bank?{id:candidate.question.id,revision:candidate.revision}:null,sourceQuestionRef:{origin:candidate.origin,id:candidate.question.id,revision:candidate.revision??null}};
  delete block.sourceOrder;
  rekeyTree(block.content,lineage,candidate.origin);
  lineage[block.id]={sourceIds:[candidate.sourceId??candidate.question.id],origin:candidate.origin};return block;
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
  if(recipe.format!=='mathsmap-assembly-recipe-v1'||!recipe.chunks.length)throw new Error('Define at least one teaching chunk');
  if(Object.values(recipe.counts).some(n=>!Number.isInteger(Number(n))||Number(n)<0||Number(n)>100))throw new Error('Question counts must be integers from 0 to 100');
  const scope=new Set([...recipe.scopeSkillIds,...recipe.extensions]), taught=new Set(recipe.assumedPrerequisites??[]), used=new Set(), usedPrompts=new Set(), sections=[],lineage={},gaps=[];
  const allBlocks=new Map(project.sections.flatMap(s=>s.blocks.map(b=>[b.id,b])));
  const valid=candidates.filter(c=>c.reviewed && c.skillIds.length && c.skillIds.every(s=>scope.has(s)));
  const eligible=(c,ids,tiers)=>!used.has(c.question.id)&&c.skillIds.every(s=>ids.has(s))&&tiers.includes(c.tier)&&(c.prerequisiteIds??[]).every(s=>taught.has(s));
  const choose=(pool,count,role)=>{const result=[];for(const candidate of pool){if(result.length>=count)break;const signatures=exerciseSignatures(candidate.question);if(used.has(candidate.question.id)||signatures.some(key=>usedPrompts.has(key)))continue;used.add(candidate.question.id);signatures.forEach(key=>usedPrompts.add(key));result.push(snapshot(candidate,role,lineage));}return result;};
  const add=(title,role,blocks,optional=false)=>sections.push({id:uid(),title:title+(optional?' (optional strand)':''),role,optional,blocks:blocks.length?blocks:[{id:uid(),type:'rich-text',content:'Coverage gap — select or generate reviewed questions for this section.'}]});
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
    const theory=chunk.blockIds.map(blockId=>{const block=allBlocks.get(blockId);if(!block)throw new Error('Theory block removed: '+blockId);if(!['content','mapping','sequence','layout'].every(kind=>approvalCurrent(project,blockId,kind)))gaps.push({section:chunk.title,reason:'Theory block '+blockId+' still needs review'});return rekeyTree(copy(block),lineage,'imported');});
    chunk.skillIds.forEach(s=>taught.add(s));
    (chunk.teachingAtomIds??[]).forEach(s=>taught.add(s));
    const pool=valid.filter(c=>eligible(c,new Set(chunk.skillIds),ASSEMBLY_TIERS)).sort((a,b)=>Number(b.origin==='mathsmap')-Number(a.origin==='mathsmap')||a.question.id.localeCompare(b.question.id));
    const examples=choose(pool.filter(c=>c.tier==='Foundation'),Number(recipe.counts.examples??0),'worked-example');
    if(examples.length<(recipe.counts.examples??0))gaps.push({section:'Theory — '+chunk.title,reason:'Missing reviewed worked-example candidates'});
    add('Theory — '+chunk.title,'teaching',[...theory,...examples]);
    const guided=choose(pool.filter(c=>c.tier==='Foundation'),Number(recipe.counts.guided),'guided-practice');if(guided.length<recipe.counts.guided)gaps.push({section:'Guided — '+chunk.title,required:recipe.counts.guided,selected:guided.length});add('Guided — '+chunk.title,'teaching',guided);
    for(const tier of ASSEMBLY_TIERS){if(!Number(recipe.counts[tier]))continue;const applicable=chunk.archetypes.filter(a=>{const ex=recipe.exceptions?.[coverageKey(chunk,a,tier)];return !(ex?.approved&&ex.reason?.trim());});if(!applicable.length)continue;const blocks=[];for(const archetype of chunk.archetypes){const exception=recipe.exceptions?.[coverageKey(chunk,archetype,tier)];if(exception?.approved&&exception.reason?.trim())continue;const selected=choose(pool.filter(c=>c.tier===tier&&c.archetype===archetype),Number(recipe.counts[tier]),'blocked-practice');blocks.push(...selected);if(selected.length<recipe.counts[tier])gaps.push({section:chunk.title,archetype,tier,required:recipe.counts[tier],selected:selected.length});}add(`Blocked ${tier} — ${chunk.title}`,'teaching',blocks,tier==='Mastery'&&recipe.optionalMastery);}
    if(index>=1&&index<recipe.chunks.length-1)mixed('Mini mixed review — '+recipe.chunks.slice(0,index+1).map(c=>c.title).join(' + '),'mixed-practice',recipe.counts.mini,['Foundation','Development']);
  });
  mixed('Cumulative interleaved practice','mixed-practice',recipe.counts.cumulative,ASSEMBLY_TIERS,true);
  mixed('Challenge exercise','challenge',recipe.counts.challenge,['Challenge'],true);
  const assembled=studioProject({...project,id:'assembled-'+uid(),title:project.title+' — assembled',revision:0,status:'draft',sections,source:{type:'assembly',projectId:project.id,revision:project.revision,runId:project.source?.runId},studio:undefined});
  for(const target of reviewTargets(assembled)){if(target.node.teachingMapping)assembled.studio.atoms[target.id]=copy(target.node.teachingMapping);}
  assembled.studio.lineage=lineage;assembled.studio.recipe=copy(recipe);assembled.studio.assemblyGaps=gaps;
  return {project:assembled,gaps,coverage:coverageMatrix(recipe,candidates),selectedQuestionCount:used.size};
}
