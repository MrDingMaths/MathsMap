// Deterministic ownership units; inventories remain independent and immutable.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {withRunLock} from './run-observability.mjs';
import {recordAttempt} from './semantic-run-metrics.mjs';
import {runBoundedJobs,withWorkerSlot,workerConcurrency} from './worker-pool.mjs';
import {coalescePacketContinuations} from './packet-continuations.mjs';
import {compactTikzPrompt} from './token-efficient-prompts.mjs';
import {assignmentCategoryHeadings,categoryGroupAnchors} from './practice-category-headings.mjs';

export const ASSIGNMENT_FORMAT='mathsmap-author-assignments-v1';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const bytes=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const groupAnchors=categoryGroupAnchors;
const categoryLabel=value=>/^(foundation|development|mastery|concept checks?|essential problems|additional practice|enrichment|chapter\s+\d+\s+review\s+set\s+(one|two|\d+))$/i.test(value?.trim()??'');
const difficultyHeading=e=>e.kind==='teaching'&&(!e.responseKind||e.responseKind==='none')&&[e.description,e.sourceLabel].some(value=>/^(foundation|development|mastery)$/i.test(value?.trim()??''));
const categoryHeading=e=>e.kind==='group'||difficultyHeading(e);
const practiceCategory=(g,questionAnchors)=>!groupAnchors(g).some(id=>questionAnchors.has(id))&&(g.kind==='practice-category'||!g.indivisible&&!g.sharedActivity&&(
 (g.kind==='practice'||/^(practice|difficulty)[ -]category$/i.test(g.kind??''))&&(!!g.category||categoryLabel(g.header))||/^(foundation|development|mastery)$/i.test(g.kind??'')||g.kind==='challenge'&&/^challenge exercise$/i.test(g.header??'')));
export function createAssignmentPlan(inventories,{continuations=[],maxQuestions=4,maxCharacters=24000,measure=values=>JSON.stringify(values).length}={}){
 if(![maxQuestions,maxCharacters].every(n=>Number.isInteger(n)&&n>0))throw Error('Assignment limits must be positive integers');
 const entries=inventories.flatMap(i=>i.entries.map(e=>({...e,pageNumber:i.pageNumber}))),byId=new Map(entries.map(e=>[e.id,e]));
 if(byId.size!==entries.length)throw Error('Inventory IDs must be unique across assignment pages');
 // A numbered multipart question can carry its difficulty header in group
 // metadata. Its actual question identity takes precedence over that header.
 const questionAnchors=new Set(entries.filter(e=>e.kind==='question').flatMap(e=>[e.id,e.targetId].filter(Boolean)));
 const isCategory=g=>practiceCategory(g,questionAnchors);
 // Inventories may name a declared activity group or an entry's targetId as
 // their parent. Keep those anchors in the ownership graph without inventing
 // extra inventory entries or dropping their children from the assignment.
 const anchors=new Set(entries.flatMap(e=>[e.id,e.targetId,e.sharedStemId]).filter(Boolean));
 const categories=new Set();
 for(const inventory of inventories)for(const group of inventory.groups??[]){
  for(const id of groupAnchors(group)){anchors.add(id);if(isCategory(group))categories.add(id);}
 }
 for(const e of entries)if(categoryHeading(e)&&!e.sharedStemId&&!e.indivisible&&!e.sharedActivity&&(categoryLabel(e.sourceLabel)||categoryLabel(e.description)))categories.add(e.id);
 // Category ancestry supplies ordering/context, not one indivisible activity.
 // Propagate aliases so a heading's authored target has the same semantics.
 for(const e of entries)if(categories.has(e.id)||categories.has(e.targetId))for(const id of [e.id,e.targetId].filter(Boolean))categories.add(id);
 const parents=new Map([...anchors].map(id=>[id,id]));
 const find=id=>parents.get(id)===id?id:find(parents.get(id));
 const join=(a,b)=>{if(!parents.has(a)||!parents.has(b))throw Error('Missing shared/continuation inventory dependency: '+b);parents.set(find(b),find(a));};
 for(const e of entries)if(e.targetId)join(e.id,e.targetId);
 for(const e of entries){
  if(e.sharedStemId&&categories.has(e.sharedStemId))throw Error('A practice category cannot be a shared question stem: '+e.sharedStemId);
  for(const id of [categories.has(e.parentId)?null:e.parentId,e.sharedStemId,e.continuationOf,...(e.sharedContextIds??[]),...(e.sharedWith??[])].filter(Boolean))join(e.id,id);
 }
 for(const inventory of inventories)for(const g of inventory.groups??[]){
  if(isCategory(g))continue;
  const ids=g.inventoryIds??g.entryIds??g.members??g.memberIds??((g.indivisible||g.sharedActivity)?g.questionIds:[])??[];
  if(ids.length&&ids.every(id=>typeof id==='string'))for(const id of ids)join(g.id??ids[0],id);
 }
 // A category heading is provenance for its first question, not a standalone
 // authoring task. Bind only that first complete unit so a tight context budget
 // cannot strand the heading or merge every independent question in a category.
 for(const inventory of inventories){
  const local=entries.filter(e=>e.pageNumber===inventory.pageNumber),groups=inventory.groups??[],ancestry=new Map();
  for(const e of local)for(const id of [e.id,e.targetId].filter(Boolean))ancestry.set(id,e.parentId);
  for(const g of groups)for(const id of groupAnchors(g))if(!ancestry.has(id))ancestry.set(id,g.parentId);
  for(const heading of local.filter(e=>categoryHeading(e)&&!e.exclusionReason&&(categories.has(e.id)||categories.has(e.targetId)))){
   const aliases=new Set([heading.id,heading.targetId].filter(Boolean));let related=groups.filter(g=>groupAnchors(g).some(id=>aliases.has(id)));
   // A source inventory may list the heading after its questions and omit its
   // entry ID from group aliases. A unique explicit matching category supplies
   // the first member; preserve the original inventory and question units.
   if(!related.length){
    const labels=new Set([heading.description,heading.sourceLabel].filter(v=>typeof v==='string').map(v=>v.trim().toLowerCase()));
    const matching=groups.filter(g=>isCategory(g)&&typeof g.header==='string'&&labels.has(g.header.trim().toLowerCase()));
    if(matching.length===1)related=matching;
   }
   for(const g of related)for(const id of groupAnchors(g))aliases.add(id);
   const members=new Set(related.flatMap(g=>g.inventoryIds??g.entryIds??g.members??g.memberIds??g.questionIds??[]));
   const belongs=e=>{if(members.has(e.id)||members.has(e.targetId))return true;let id=e.parentId;const visited=new Set();while(id&&!visited.has(id)){if(aliases.has(id))return true;visited.add(id);id=ancestry.get(id);}return false;};
   let first=local.find(e=>e.kind==='question'&&!e.exclusionReason&&belongs(e));
   if(!first){const start=local.indexOf(heading);for(const e of local.slice(start+1)){if(categoryHeading(e)&&(categories.has(e.id)||categories.has(e.targetId)))break;if(e.kind==='question'&&!e.exclusionReason){first=e;break;}}}
   if(!first)throw Error('Practice category heading needs an explicit first question: '+heading.id);
   join(first.id,heading.id);
  }
 }
 const continuedQuestions=new Set();
 // An explicitly identified question continuation can bind only its roots and
 // their already-linked descendants. Without that evidence, retain the safe
 // whole-page fallback instead of guessing which content continues.
 for(const pair of continuations){const pages=Array.isArray(pair)?pair:[pair.from,pair.to],members=entries.filter(e=>pages.includes(e.pageNumber));
  if(pages.some(p=>!inventories.some(i=>i.pageNumber===p)))throw Error('Continuation needs every source inventory');
  if(!Array.isArray(pair)&&pair.entryIds!==undefined){
   if(!Array.isArray(pair.entryIds)||pair.entryIds.length<2||new Set(pair.entryIds).size!==pair.entryIds.length)throw Error('Question continuation needs distinct entry IDs');
   const roots=pair.entryIds.map(id=>byId.get(id)),questions=roots.filter(e=>e?.kind==='question');
   const earlierQuestionParent=e=>questions.find(q=>[q.id,q.targetId].filter(Boolean).includes(e.parentId)&&q.pageNumber<e.pageNumber);
   // A continued page can begin directly with parts under the earlier printed
   // stem. Require that explicit parent; never promote parts to source roots or
   // absorb a neighbouring question merely because it shares a page.
   if(!questions.length||roots.some(e=>!e||(e.kind!=='question'&&!(['answer','part'].includes(e.kind)&&earlierQuestionParent(e)))||e.exclusionReason||!pages.includes(e.pageNumber))||pages.some(p=>!roots.some(e=>e.pageNumber===p)))throw Error('Question continuation must identify a question on every linked page, or its explicitly parented later part or supplied answer');
   for(const e of questions)continuedQuestions.add(e.id);
   for(const e of roots.slice(1))join(roots[0].id,e.id);
   continue;
  }
  for(const e of members.slice(1))join(members[0].id,e.id);
 }
 const units=new Map();for(const e of entries){const root=find(e.id);if(!units.has(root))units.set(root,[]);units.get(root).push(e);}
 const groups=[];let pending=[];
 const count=values=>new Set(values.filter(e=>e.kind==='question'&&!e.exclusionReason).map(e=>continuedQuestions.has(e.id)?find(e.id):e.sharedStemId??e.id)).size;
 const flush=()=>{if(pending.length)groups.push(pending);pending=[];};
 for(const unit of units.values()){
  const pages=[...new Set(unit.map(e=>e.pageNumber))];
  if(pending.length&&(pages.length>1||pending[0].pageNumber!==pages[0]||count([...pending,...unit])>maxQuestions||measure([...pending,...unit])>maxCharacters))flush();
  pending.push(...unit);if(pages.length>1||count(pending)>=maxQuestions||measure(pending)>=maxCharacters)flush();
 }flush();
 const assignments=groups.map(values=>{
  const ids=values.map(e=>e.id),characters=measure(values),questions=count(values);
  return {id:'assignment-'+hash(ids).slice(0,20),inventoryIds:ids,pages:[...new Set(values.map(e=>e.pageNumber))],entries:values,questions,...(continuations.some(c=>!Array.isArray(c)&&c.entryIds?.every(id=>ids.includes(id)))?{continuations:continuations.filter(c=>!Array.isArray(c)&&c.entryIds?.every(id=>ids.includes(id)))}:{}),evidenceOnly:values.every(e=>e.exclusionReason),variableCharacters:characters,
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
  if(packet.sharedContentContinuations?.length)(result.sharedContentContinuations??=[]).push(...packet.sharedContentContinuations);
 }
 if(inventory.entries.some(e=>!owned.has(e.id))||owned.size!==inventory.entries.length)throw Error('Incomplete assignment ownership');
 return result;
}

function scopedTeachingTask(task,assignment){
 if(!task.authoringContextScoped)return task;
 const questions=assignment.entries.filter(e=>e.pageNumber===task.page&&e.kind==='question'&&!e.exclusionReason),selections=[];
 for(const question of questions){
  const selection=task.authoringContextSelections?.[question.id],original=task.inventory.entries.find(e=>e.id===question.id);
  if(!selection||selection.entryHash!==hash(original))throw Error('Missing or stale reviewed authoring context selection: '+question.id);
  if(!selection.note?.trim()||!Array.isArray(selection.teachingPages)||selection.teachingPages.some(p=>!Number.isInteger(p)||p<1)||(!selection.teachingPages.length&&!selection.embeddedContext))throw Error('Explicit taught context or embedded-context rationale required: '+question.id);
  if(!selection.evidence?.path||!path.isAbsolute(selection.evidence.path)||bytes(selection.evidence.path)!==selection.evidence.hash)throw Error('Authoring context selection evidence changed: '+question.id);
  selections.push({inventoryId:question.id,...selection});
 }
 const selected=new Set(selections.flatMap(s=>s.teachingPages));
 const sources=(task.teachingSources??[]).filter(s=>selected.has(s.page));
 if([...selected].some(p=>!sources.some(s=>s.page===p)))throw Error('Selected teaching evidence is not prepared');
 const allTeaching=new Set((task.teachingSources??[]).map(s=>s.image)),selectedImages=new Set(sources.map(s=>s.image));
 const retained=file=>file===task.sourceImage||!allTeaching.has(file)||selectedImages.has(file);
 const teachingText=sources.length?'SHARED TEACHING CONTEXT: inspect each selected source needed for the assigned questions, including images beyond the attached previews.\n'+sources.map(s=>s.text).join('\n\n'):questions.length?'Required teaching is embedded in the assigned question; preserve it and the explicit context rationale.':'This ownership unit contains no question; its source heading or exclusions require no separate teaching method.';
 return {...task,contextPages:sources.map(s=>s.page),topic:task.topic?{...task.topic,teachingPages:sources.map(s=>s.page)}:task.topic,
  teachingSelections:selections,promptSections:task.promptSections.map(s=>s.name==='teaching'?{...s,text:teachingText}:s),
  evidence:task.evidence.filter(e=>retained(e.path)),images:[...new Set([...task.images.filter(retained),...sources.slice(0,task.teachingImageLimit??2).map(s=>s.image)])]};
}

export function assignmentPayload(assignment,tasks){
 const relevant=tasks.filter(t=>assignment.pages.includes(t.page)).map(t=>scopedTeachingTask(t,assignment)),evidence=new Map();
 for(const task of relevant)for(const ref of task.evidence??[])evidence.set(ref.id,ref);
 const owned=new Set(assignment.inventoryIds),targets=new Set(assignment.entries.flatMap(e=>[e.id,e.targetId]).filter(Boolean));
 const resources=relevant.flatMap(t=>t.promptSections.filter(s=>['teaching','envelope','diagrams','decisions','supplement','source','word'].includes(s.name)||s.name.startsWith('answer-page-')).map(s=>{
  // A page envelope describes one member of packets, with assignment-scoped
  // ownership. Retain its topic/header/source rules without importing siblings.
  const text=s.name==='envelope'?s.text.replace(/^Return /,'Each assigned PAGE_PACKET for this source page follows ').replace('Map EVERY non-excluded inventory item','Map EVERY assigned non-excluded inventory item').replaceAll('inventory.entries','assignment.inventory'):s.name==='diagrams'?compactTikzPrompt({inventory:{entries:assignment.entries.filter(e=>e.pageNumber===t.page)}}):s.text;
  const id='context-'+hash(text),file=path.resolve(t.packetRoot,'evidence',id+'.txt');
  return {id,page:t.page,name:s.name,path:file,hash:hash(text),text};
 }));
 const contracts=relevant[0].promptSections.filter(s=>['contract','three-pass-precedence','content-scope','early-review','execution','schema','solutions','first-pass-patterns','classification','working-space','native-grouping','practice-answer-evidence','shared-diagrams','palette'].includes(s.name)).map(s=>({...s,text:s.text.replace('Transcribe only the supplied source page','Transcribe only the assigned complete questions or activities from the supplied source pages')}));
 const categoryHeadings=relevant.flatMap(t=>assignmentCategoryHeadings(t.inventory,assignment.inventoryIds));
 const categoryGroups=new Set(categoryHeadings.map(h=>h.sourceGroupId));
 const context={assignment:{id:assignment.id,pages:assignment.pages,inventory:assignment.entries,...(assignment.continuations?{continuations:assignment.continuations}:{})},evidence:[...evidence.values()],
  teaching:relevant.map(t=>({page:t.page,teachingPages:t.contextPages,teacherPages:t.teacherPages,...(t.teachingSelections?{selections:t.teachingSelections}:{})})),
  topics:relevant.map(t=>({page:t.page,topic:t.topic})),
  guidance:resources.map(({text,...r})=>r),
  categoryHeadings,
  groups:relevant.flatMap(t=>(t.inventory.groups??[]).filter(g=>categoryGroups.has(g.id)||(g.questionIds??g.inventoryIds??g.entryIds??g.members??[]).some(id=>targets.has(id))||assignment.entries.some(e=>e.parentId===g.id||e.continuationOf===g.id||e.sharedContextIds?.includes(g.id)||e.sharedWith?.includes(g.id))).map(g=>categoryGroups.has(g.id)?g:{...g,questionIds:g.questionIds?.filter(id=>targets.has(id)),inventoryIds:g.inventoryIds?.filter(id=>targets.has(id))})),
  decisions:relevant.flatMap(t=>(t.editorial?.corrections??[]).map(c=>({id:c.id,reason:c.reason,patches:c.patches.filter(p=>targets.has(p.targetId)||t.contextPages.includes(p.page)&&!assignment.pages.includes(p.page))})).filter(c=>c.patches.length)),
  resolutions:relevant.flatMap(t=>(t.editorialDecisions??[]).filter(d=>targets.has(d.entryId)||targets.has(d.targetId)||d.inventoryIds?.some(id=>targets.has(id))||(d.pages??[d.page]).some(page=>!d.entryId&&!d.targetId&&!d.inventoryIds?.length&&assignment.pages.includes(page)||t.contextPages.includes(page)&&!assignment.pages.includes(page)))),
  currentValues:relevant.flatMap(t=>(t.editorial?.currentValues??[]).filter(v=>targets.has(v.targetId)||t.contextPages.includes(v.page)&&!assignment.pages.includes(v.page)).map(v=>({id:v.key,targetId:v.targetId,field:v.field,value:v.value,path:t.editorialFile,hash:t.editorialHash}))),
  geometry:relevant.flatMap(t=>(t.geometry??[]).filter(g=>owned.has(g.inventoryId)))};
 const rules=`Author only the assigned inventory entries. Inspect their source/answer images and relevant exercise teaching evidence. Other visible questions are context only. Keep all assigned subparts, shared instructions, figures and continuations together. Preserve IDs and source order. Evidence IDs resolve to the immutable paths below; read relevant linked images even when not attached. Missing teaching or answer context is a finding. Do not copy evidence or historical corrections into output.\nReturn {packets:[PAGE_PACKET]} with one packet for each assigned source page, each shaped {pageNumber,sections:[{id,title:nonemptyTopicOrSourceTitle,topicId,phase:"teaching|practice|front-matter",role:"teaching|mixed-practice|front-matter",headingStyle:"page-title|none",sourcePageNumber,blocks:[BLOCK]}],inventoryMappings:[{inventoryId,targetId,field?,exclusionReason?}],findings:[],corrections:[],answerEvidence:[]}. Use section IDs prefixed ${assignment.id}-. Each packet maps exactly its assigned page entries. Use page-title only when this assignment owns the source-supported main topic band; use none for continuations and template-only activity headings. Never draw a main topic band as a body table or duplicate a sourceAtom teaching header in body content. Keep cross-page activity fragments identified consistently for source reconciliation; never omit continuation text. No author output grants approval.\nTopics: ${JSON.stringify(relevant.map(t=>({page:t.page,topic:t.topic})))}`;
 const decisionRules='Required teaching, diagram and supplemental guidance is included in this prompt. Guidance paths identify retained evidence; no additional file read is needed to obtain those rules. Approved editorial resolutions and corrected current values take precedence over conflicting original source appearance; retain the original evidence. Inventory patches marked appliedToInventory are already applied. Resolve currentValueRef and within against the currentValues included below; never restore superseded targets. Map only owned inventory IDs to actual editable content IDs; generated wrappers are not inventory entries. Mathematical diagrams map to their diagram IDs. Source visuals reconstructed natively may map to: a populated native table ID; a native math/cloze node or paragraph containing native maths; a populated scaffold layout containing native maths; a populated CARD SLOT ID inside arrangement:"cards" (not the parent cards layout); or a question/group/part response grid with layout:"grid", multiple prompt-bearing children and field:"/layout". Mapping field paths are JSON pointers relative to the target, such as "/prompt", "/content" or "/layout", never prose or dotted paths. Standard information/light-bulb/review-arrow/question-mark header icons are renderer-owned template decorations, never new mathematical diagrams. Preserve their canonical inventory exclusionReason; excluded entries may omit a mapping or retain that specific exclusionReason. Never exclude a mathematical figure or invent an exclusion to hide missing content.';
 // Worker policy can reject even a read-only shell command. Essential authoring
 // rules must not depend on such a call. Keep one stable copy before ownership
 // data for provider prefix reuse, and count it in the assignment budget.
 const guidance=[...new Map(resources.map(r=>[r.hash,r])).values()].map(r=>'ASSIGNED '+r.name.toUpperCase()+' GUIDANCE:\n'+r.text).join('\n\n');
 const continuationRules=assignment.continuations?.length?' For a declared cross-page question, author its complete editable block exactly once conceptually, with all parts and sourceRefs for both pages. Include an identical copy (same IDs, content, sourceReview and answerEvidence) in each owned page packet so each independently inventoried page maps to valid local content. On each later packet add sharedContentContinuations:[{blockId,canonicalPageNumber:theEarliestOwnedPage,reason:sourceSupportedExplanation}]. Keep each page inventory mapping local, without cross-page continuationOf; assembly validates the exact copies and merges them into one question while retaining all source mappings. Never declare unrelated questions as continuations.':'';
 const categoryRules=' categoryHeadings is derived from the FULL source inventory before assignment scoping. Only ownsHeading:true authorises one native editable category-heading paragraph in the first owning question prompt, arranged above its numbered question. Preserve source alignment. Category headings are not template-owned main-topic or teaching-activity headings, and a section title is insufficient because compact organisation replaces it. Keep the original group members and firstQuestionInventoryId as context even when they are outside this assignment; never infer a new first owner from an assignment slice. ownsHeading:false or status:continuation means do not repeat the category heading. status:needs-review requires an explicit finding, never an invented boundary. Record sourceReview.sourceCategoryHeading:{sourceGroupId,targetId:paragraphID,label,placement}; add sourceInventoryId only when categoryHeadings provides a real inventory heading entry, and map that entry to paragraphID with field:"/inlines". Group-only metadata creates no inventory ID. headerOwnedByTemplate applies only to main/topic and teaching-group headings; it never removes this native practice heading.';
 const graphGuidance=assignment.entries.some(entry=>/\b(?:graph|axes|asymptote|cartesian|coordinate grid)\b/i.test(JSON.stringify(entry)))?' Graph sizing: start routine supplied question graphs around 70 mm wide and simple short-answer graphs around 50 mm; increase width for legibility or required student drawing space. Never stretch to fill a column, shrink 10 pt labels or discard mathematical features. Preserve meaningful pairs, manual overrides and independent short/worked widths. These are reference sizes, not caps.':'';
 const difficultyRules=assignment.entries.some(e=>difficultyHeading(e)&&!e.exclusionReason)?' Source FOUNDATION, DEVELOPMENT and MASTERY headings are editor-only difficulty metadata, not teaching activities or printable headings. Map each assigned difficulty heading to its first owning question block and field "/classification/difficulty"; preserve the source category for subsequent questions.':'';
 const prompt=contracts.map(s=>s.text).join('\n\n')+'\n\n'+guidance+'\n\n'+rules.replace(/\nTopics:.*$/,'')+'\n'+decisionRules+continuationRules+categoryRules+graphGuidance+difficultyRules+'\n\n'+JSON.stringify(context);
 const images=[...new Set(relevant.flatMap(t=>t.images))],dependencies={context,contracts,rules,decisionRules,continuationRules,categoryRules,...(graphGuidance?{graphGuidance}:{}),...(difficultyRules?{difficultyRules}:{}),guidance,continuationImplementation:bytes(new URL('./packet-continuations.mjs',import.meta.url)),generation:relevant.map(t=>t.generationDependencies),images:images.map(f=>[f,bytes(f)])};
 return {prompt,images,context,resources,inputHash:hash(dependencies),promptStats:{characters:prompt.length,imageCount:images.length,inlineGuidanceCharacters:guidance.length+graphGuidance.length+difficultyRules.length,sections:{contract:contracts.reduce((n,s)=>n+s.text.length,0),assignment:JSON.stringify(context).length+guidance.length+graphGuidance.length+difficultyRules.length}}};
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

export async function runAuthorAssignment({runDir,assignment,tasks,root=path.join(runDir,'semantic-packets','assignments'),runner,validate,attempt,regenerationReason,materialize=v=>v,log=()=>{},workerSlotOptions}){
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
    events.phase('generation');const reply=assignment.evidenceOnly?{result:{packets:assignment.pages.map(pageNumber=>({pageNumber,sections:[],inventoryMappings:[],findings:[],corrections:[],answerEvidence:[]}))},metrics:{provider:'local-inventory-exclusions',externalModelCalls:0,usage:null,elapsedMs:0}}:await withWorkerSlot(runDir,{stage:'author',assignmentId:assignment.id},()=>runner({cwd:runDir,runDir,configuration:tasks.find(t=>assignment.pages.includes(t.page))?.generationDependencies.configuration,prompt:payload.prompt,images:payload.images,out}),workerSlotOptions);metrics=reply.metrics;events.end({metrics});
    fs.writeFileSync(path.join(out,'generation.json'),JSON.stringify(reply.result,null,2));events.phase('validation');
    const packets=reply.result?.packets?.map(materialize);
    if(!packets||packets.length!==assignment.pages.length||new Set(packets.map(p=>p.pageNumber)).size!==packets.length)throw Error('Assignment must return every assigned page exactly once');
    for(const p of assignment.pages){const packet=packets.find(v=>v.pageNumber===p),original=tasks.find(t=>t.page===p),inventory={...original.inventory,entries:assignment.entries.filter(e=>e.pageNumber===p)};
     mergeAssignmentPackets(inventory,[{assignment,packet}]);validate(packet,{...original,inventory});}
    coalescePacketContinuations(packets,{continuations:assignment.continuations});
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
