// Deterministic ownership units; inventories remain independent and immutable.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {withRunLock} from './run-observability.mjs';
import {recordAttempt} from './semantic-run-metrics.mjs';
import {runBoundedJobs,withWorkerSlot,workerConcurrency} from './worker-pool.mjs';

export const ASSIGNMENT_FORMAT='mathsmap-author-assignments-v1';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const bytes=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
export function createAssignmentPlan(inventories,{continuations=[],maxQuestions=4,maxCharacters=24000,measure=values=>JSON.stringify(values).length}={}){
 if(![maxQuestions,maxCharacters].every(n=>Number.isInteger(n)&&n>0))throw Error('Assignment limits must be positive integers');
 const entries=inventories.flatMap(i=>i.entries.map(e=>({...e,pageNumber:i.pageNumber}))),byId=new Map(entries.map(e=>[e.id,e]));
 if(byId.size!==entries.length)throw Error('Inventory IDs must be unique across assignment pages');
 const parents=new Map(entries.map(e=>[e.id,e.id]));
 const find=id=>parents.get(id)===id?id:find(parents.get(id));
 const join=(a,b)=>{if(!byId.has(a)||!byId.has(b))throw Error('Missing shared/continuation inventory dependency: '+b);parents.set(find(b),find(a));};
 for(const e of entries){
  for(const id of [e.parentId,e.continuationOf,...(e.sharedContextIds??[]),...(e.sharedWith??[])].filter(Boolean))join(e.id,id);
 }
 for(const inventory of inventories)for(const g of inventory.groups??[]){
  const ids=g.inventoryIds??g.entryIds??g.members??((g.indivisible||g.sharedActivity)?g.questionIds:[])??[];
  if(ids.length&&ids.every(id=>typeof id==='string'))for(const id of ids.slice(1))join(ids[0],id);
 }
 // Page-level continuation evidence cannot safely identify a smaller unit.
 // Keep the entire linked source activity together rather than splitting a stem.
 for(const pair of continuations){const pages=Array.isArray(pair)?pair:[pair.from,pair.to],members=entries.filter(e=>pages.includes(e.pageNumber));
  if(pages.some(p=>!inventories.some(i=>i.pageNumber===p)))throw Error('Continuation needs every source inventory');
  for(const e of members.slice(1))join(members[0].id,e.id);
 }
 const units=new Map();for(const e of entries){const root=find(e.id);if(!units.has(root))units.set(root,[]);units.get(root).push(e);}
 const groups=[];let pending=[];
 const count=values=>values.filter(e=>e.kind==='question'&&!e.parentId).length;
 const flush=()=>{if(pending.length)groups.push(pending);pending=[];};
 for(const unit of units.values()){
  const pages=[...new Set(unit.map(e=>e.pageNumber))];
  if(pending.length&&(pages.length>1||pending[0].pageNumber!==pages[0]||count([...pending,...unit])>maxQuestions||measure([...pending,...unit])>maxCharacters))flush();
  pending.push(...unit);if(pages.length>1||count(pending)>=maxQuestions||measure(pending)>=maxCharacters)flush();
 }flush();
 const assignments=groups.map(values=>{
  const ids=values.map(e=>e.id),characters=measure(values),questions=count(values);
  return {id:'assignment-'+hash(ids).slice(0,20),inventoryIds:ids,pages:[...new Set(values.map(e=>e.pageNumber))],entries:values,questions,evidenceOnly:values.every(e=>e.exclusionReason),variableCharacters:characters,
   oversized:questions>maxQuestions||characters>maxCharacters,exception:questions>maxQuestions||characters>maxCharacters?'Indivisible question, activity or continuation; content retained in full':null};
 });
 return {format:ASSIGNMENT_FORMAT,version:1,limits:{maxQuestions,maxCharacters},inventoryHashes:Object.fromEntries(inventories.map(i=>[i.pageNumber,hash(i)])),assignments};
}

export function mergeAssignmentPackets(inventory,fragments){
 const result={pageNumber:inventory.pageNumber,sections:[],inventoryMappings:[],findings:[],corrections:[],answerEvidence:[]},owned=new Set(),seenMappings=new Set(),sectionIds=new Set();
 const order=new Map(inventory.entries.map((e,i)=>[e.id,i]));
 const first=f=>Math.min(...f.assignment.inventoryIds.filter(id=>order.has(id)).map(id=>order.get(id)));
 for(const {assignment,packet}of [...fragments].sort((a,b)=>first(a)-first(b))){
  const expected=new Set(assignment.entries.filter(e=>e.pageNumber===inventory.pageNumber).map(e=>e.id));
  for(const id of expected){if(owned.has(id))throw Error('Duplicate assignment ownership: '+id);owned.add(id);}
  if(packet.pageNumber!==inventory.pageNumber)throw Error('Assignment returned the wrong source page');
  for(const m of packet.inventoryMappings??[]){
   if(!expected.has(m.inventoryId))throw Error('Out-of-assignment inventory mapping: '+m.inventoryId);
   const key=JSON.stringify([m.inventoryId,m.targetId,m.field??null]);if(seenMappings.has(key))throw Error('Duplicate inventory mapping: '+m.inventoryId);seenMappings.add(key);
  }
  for(const e of assignment.entries.filter(e=>expected.has(e.id)))if(!e.exclusionReason&&!packet.inventoryMappings?.some(m=>m.inventoryId===e.id))throw Error('Missing assignment mapping: '+e.id);
  for(const section of packet.sections??[]){if(sectionIds.has(section.id))throw Error('Assignment section IDs must be distinct');sectionIds.add(section.id);result.sections.push(section);}
  for(const field of ['inventoryMappings','findings','corrections','answerEvidence'])result[field].push(...(packet[field]??[]));
 }
 if(inventory.entries.some(e=>!owned.has(e.id))||owned.size!==inventory.entries.length)throw Error('Incomplete assignment ownership');
 return result;
}

export function assignmentPayload(assignment,tasks){
 const relevant=tasks.filter(t=>assignment.pages.includes(t.page)),evidence=new Map();
 for(const task of relevant)for(const ref of task.evidence??[])evidence.set(ref.id,ref);
 const owned=new Set(assignment.inventoryIds),targets=new Set(assignment.entries.flatMap(e=>[e.id,e.targetId]).filter(Boolean));
 const resources=relevant.flatMap(t=>t.promptSections.filter(s=>['diagrams','decisions','supplement'].includes(s.name)).map(s=>{
  const id='context-'+hash(s.text),file=path.resolve(t.packetRoot,'evidence',id+'.txt');
  return {id,page:t.page,name:s.name,path:file,hash:hash(s.text),text:s.text};
 }));
 const contracts=relevant[0].promptSections.filter(s=>['contract','content-scope','early-review','schema','solutions','practice-answer-evidence','shared-diagrams','palette'].includes(s.name)).map(s=>({...s,text:s.text.replace('Transcribe only the supplied source page','Transcribe only the assigned complete questions or activities from the supplied source pages')}));
 const context={assignment:{id:assignment.id,pages:assignment.pages,inventory:assignment.entries},evidence:[...evidence.values()],
  teaching:relevant.map(t=>({page:t.page,teachingPages:t.contextPages,teacherPages:t.teacherPages})),
  topics:relevant.map(t=>({page:t.page,topic:t.topic})),
  guidance:resources.map(({text,...r})=>r),
  groups:relevant.flatMap(t=>(t.inventory.groups??[]).filter(g=>(g.questionIds??g.inventoryIds??g.entryIds??g.members??[]).some(id=>owned.has(id))).map(g=>({...g,questionIds:g.questionIds?.filter(id=>owned.has(id)),inventoryIds:g.inventoryIds?.filter(id=>owned.has(id))}))),
  decisions:relevant.flatMap(t=>(t.editorial?.corrections??[]).map(c=>({id:c.id,reason:c.reason,patches:c.patches.filter(p=>targets.has(p.targetId)||t.contextPages.includes(p.page)&&!assignment.pages.includes(p.page))})).filter(c=>c.patches.length)),
  resolutions:relevant.flatMap(t=>(t.editorialDecisions??[]).filter(d=>targets.has(d.entryId)||targets.has(d.targetId)||(d.pages??[d.page]).some(page=>!d.entryId&&!d.targetId&&assignment.pages.includes(page)||t.contextPages.includes(page)&&!assignment.pages.includes(page)))),
  currentValues:relevant.flatMap(t=>(t.editorial?.currentValues??[]).filter(v=>targets.has(v.targetId)||t.contextPages.includes(v.page)&&!assignment.pages.includes(v.page)).map(v=>({id:v.key,targetId:v.targetId,field:v.field,value:v.value,path:t.editorialFile,hash:t.editorialHash}))),
  geometry:relevant.flatMap(t=>(t.geometry??[]).filter(g=>owned.has(g.inventoryId)))};
 const rules=`Author only the assigned inventory entries. Inspect their source/answer images and relevant exercise teaching evidence. Other visible questions are context only. Keep all assigned subparts, shared instructions, figures and continuations together. Preserve IDs and source order. Evidence IDs resolve to the immutable paths below; read relevant linked images even when not attached. Missing teaching or answer context is a finding. Do not copy evidence or historical corrections into output.\nReturn {packets:[PAGE_PACKET]} with one packet for each assigned source page, each shaped {pageNumber,sections:[{id,title:nonemptyTopicOrSourceTitle,topicId,phase:"teaching|practice|front-matter",role:"teaching|mixed-practice|front-matter",headingStyle:"none",blocks:[BLOCK]}],inventoryMappings:[{inventoryId,targetId,field?}],findings:[],corrections:[],answerEvidence:[]}. Use section IDs prefixed ${assignment.id}-. Each packet maps exactly its assigned page entries. Keep cross-page activity fragments identified consistently for source reconciliation; never omit continuation text. No author output grants approval.\nTopics: ${JSON.stringify(relevant.map(t=>({page:t.page,topic:t.topic})))}`;
 const decisionRules='Required diagram and supplemental guidance is included in this prompt. Guidance paths identify retained evidence; no additional file read is needed to obtain those rules. Approved editorial resolutions and corrected current values take precedence over conflicting original source appearance; retain the original evidence. Inventory patches marked appliedToInventory are already applied. Resolve currentValueRef and within against the currentValues included below; never restore superseded targets. Map owned inventory IDs to actual content IDs, with diagrams mapped to diagram IDs; generated wrappers are not inventory entries.';
 // Worker policy can reject even a read-only shell command. Essential authoring
 // rules must not depend on such a call. Keep one stable copy before ownership
 // data for provider prefix reuse, and count it in the assignment budget.
 const guidance=[...new Map(resources.map(r=>[r.hash,r])).values()].map(r=>'ASSIGNED '+r.name.toUpperCase()+' GUIDANCE:\n'+r.text).join('\n\n');
 const prompt=contracts.map(s=>s.text).join('\n\n')+'\n\n'+guidance+'\n\n'+rules.replace(/\nTopics:.*$/,'')+'\n'+decisionRules+'\n\n'+JSON.stringify(context);
 const images=[...new Set(relevant.flatMap(t=>t.images))],dependencies={context,contracts,rules,decisionRules,guidance,generation:relevant.map(t=>t.generationDependencies),images:images.map(f=>[f,bytes(f)])};
 return {prompt,images,context,resources,inputHash:hash(dependencies),promptStats:{characters:prompt.length,imageCount:images.length,inlineGuidanceCharacters:guidance.length,sections:{contract:contracts.reduce((n,s)=>n+s.text.length,0),assignment:JSON.stringify(context).length+guidance.length}}};
}

export function planTaskAssignments(tasks,options={}){
 const measure=entries=>assignmentPayload({id:'assignment-'+hash(entries.map(e=>e.id)).slice(0,20),inventoryIds:entries.map(e=>e.id),entries,pages:[...new Set(entries.map(e=>e.pageNumber))]},tasks).promptStats.sections.assignment;
 const plan=createAssignmentPlan(tasks.map(t=>t.inventory),{...options,measure});
 for(const assignment of plan.assignments){
  const payload=assignmentPayload(assignment,tasks);
  assignment.dependencyHash=payload.inputHash;
  assignment.evidenceIds=payload.context.evidence.map(e=>e.id);
  assignment.contextReferences=payload.context.teaching;
 }
 return plan;
}

function prepareAssignmentRun(runDir,tasks,plan){
 const root=path.join(runDir,'semantic-packets','assignments');fs.mkdirSync(root,{recursive:true});
 const planFile=path.join(root,'plan-'+hash(plan)+'.json');if(!fs.existsSync(planFile))fs.writeFileSync(planFile,JSON.stringify(plan,null,2));
 for(const t of tasks)if(t.editorialFile){fs.mkdirSync(path.dirname(t.editorialFile),{recursive:true});const value=JSON.stringify(t.editorial);if(!fs.existsSync(t.editorialFile))fs.writeFileSync(t.editorialFile,value);if(bytes(t.editorialFile)!==t.editorialHash)throw Error('Shared editorial evidence changed');}
 return root;
}

export async function runAuthorAssignment({runDir,assignment,tasks,root=path.join(runDir,'semantic-packets','assignments'),runner,validate,attempt,regenerationReason,materialize=v=>v,log=()=>{}}){
  fs.mkdirSync(root,{recursive:true});
  const payload=assignmentPayload(assignment,tasks),dir=path.join(root,assignment.id),cacheFile=path.join(dir,'accepted.json');
  for(const resource of payload.resources){fs.mkdirSync(path.dirname(resource.path),{recursive:true});if(!fs.existsSync(resource.path))fs.writeFileSync(resource.path,resource.text);if(bytes(resource.path)!==resource.hash)throw Error('Shared context evidence changed');}
  // The same indivisible activity may be requested by two page workers.
  const lock='assignment-'+assignment.id.slice(11).replace(/[0-9]/g,n=>String.fromCharCode(103+Number(n)));
  const packets=await withRunLock(runDir,lock,async()=>{
   fs.mkdirSync(dir,{recursive:true});
   if(fs.existsSync(cacheFile)){const cache=read(cacheFile);if(cache.inputHash===payload.inputHash&&fs.existsSync(cache.result.path)&&bytes(cache.result.path)===cache.result.hash){log(JSON.stringify({assignment:assignment.id,cached:true}));return read(cache.result.path).packets;}}
   const out=path.join(dir,String(attempt));if(fs.existsSync(out))throw Error('Assignment attempt already exists; use a newer attempt or exact-field repair');
   if(fs.readdirSync(dir).some(n=>/^\d+$/.test(n))&&!regenerationReason)throw Error('Assignment retry needs a reason why targeted repair is insufficient');
   fs.mkdirSync(out);fs.writeFileSync(path.join(out,'prompt.md'),payload.prompt);fs.writeFileSync(path.join(out,'task-input.json'),JSON.stringify({inputHash:payload.inputHash,assignment}));
   const catalog=path.join(root,'evidence-'+hash(payload.context.evidence)+'.json');if(!fs.existsSync(catalog))fs.writeFileSync(catalog,JSON.stringify(payload.context.evidence,null,2));
   const events=recordAttempt(path.join(runDir,'semantic-packets'),{stage:'author',page:assignment.pages[0],pages:assignment.pages,assignmentId:assignment.id,attempt,inputHash:payload.inputHash,promptStats:payload.promptStats,regenerationReason,retryReason:attempt>1?'content-repair':'initial'});let metrics,ok=false,error;
   try{
    events.phase('generation');const reply=assignment.evidenceOnly?{result:{packets:assignment.pages.map(pageNumber=>({pageNumber,sections:[],inventoryMappings:[],findings:[],corrections:[],answerEvidence:[]}))},metrics:{provider:'local-inventory-exclusions',externalModelCalls:0,usage:null,elapsedMs:0}}:await withWorkerSlot(runDir,{stage:'author',assignmentId:assignment.id},()=>runner({cwd:runDir,runDir,prompt:payload.prompt,images:payload.images,out}));metrics=reply.metrics;events.end({metrics});
    fs.writeFileSync(path.join(out,'generation.json'),JSON.stringify(reply.result,null,2));events.phase('validation');
    const packets=reply.result?.packets?.map(materialize);
    if(!packets||packets.length!==assignment.pages.length||new Set(packets.map(p=>p.pageNumber)).size!==packets.length)throw Error('Assignment must return every assigned page exactly once');
    for(const p of assignment.pages){const packet=packets.find(v=>v.pageNumber===p),original=tasks.find(t=>t.page===p),inventory={...original.inventory,entries:assignment.entries.filter(e=>e.pageNumber===p)};
     mergeAssignmentPackets(inventory,[{assignment,packet}]);validate(packet,{...original,inventory});}
    const resultFile=path.join(out,'result.json');fs.writeFileSync(resultFile,JSON.stringify({packets},null,2));
    fs.writeFileSync(cacheFile,JSON.stringify({inputHash:payload.inputHash,result:{path:resultFile,hash:bytes(resultFile)}}));ok=true;events.end();return packets;
   }catch(e){error=e.message;metrics??=e.metrics;throw e;}finally{events.finish({ok,error,metrics});}
  },{timeoutMs:1800000});
  return {assignment,packets};
}

export function createAuthorAssignmentQueue(options){
 const {runDir,tasks,plan}=options,concurrency=workerConcurrency(options.concurrency??3),root=prepareAssignmentRun(runDir,tasks,plan),pending=new Map(),resolvers=new Map();
 for(const a of plan.assignments){if(pending.has(a.id))throw Error('Duplicate assignment ownership: '+a.id);pending.set(a.id,new Promise(resolve=>resolvers.set(a.id,resolve)));}
 const completion=runBoundedJobs(plan.assignments,async assignment=>{
  try{const result=await runAuthorAssignment({...options,root,assignment});resolvers.get(assignment.id)({ok:true,result});return result;}
  catch(error){resolvers.get(assignment.id)({ok:false,error});throw error;}
 },{concurrency});
 return {completion,async pageResult(task){
  const assigned=plan.assignments.filter(a=>a.pages.includes(task.page)),rows=await Promise.all(assigned.map(a=>pending.get(a.id)));
  const failed=rows.find(r=>!r.ok);if(failed)throw failed.error;
  const fragments=rows.map(r=>({assignment:r.result.assignment,packet:r.result.packets.find(p=>p.pageNumber===task.page)}));
  return {result:mergeAssignmentPackets(task.inventory,fragments),metrics:{provider:'assignment-assembly',externalModelCalls:0,usage:null,elapsedMs:0}};
 }};
}

// Compatibility entry point for callers assembling one page. The semantic
// runner uses one shared queue for all pages so dense pages can fill every slot.
export async function runAuthorAssignments(options){
 const queue=createAuthorAssignmentQueue({...options,plan:{...options.plan,assignments:options.plan.assignments.filter(a=>a.pages.includes(options.task.page))}});
 try{return await queue.pageResult(options.task);}finally{await queue.completion;}
}
