#!/usr/bin/env node
// Apply the layout findings of a first-pass review (user decision of 15 October 2026).
// A Sol low worker turns each group of findings on the same blocks into exact-field
// patches; guards keep the edit to layout; one revision-safe save applies the
// survivors; the automated checks and a bounded visual retry decide what stays. A finding
// that cannot be applied, or does not verify, becomes a comment for the teacher.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {fragmentQuestion} from '../src/lib/booklet-pagination.js';
import {normalizeArrangement} from '../public/libs/maths-editor/arrangement-model.mjs';
import {normalizeBlockLayouts} from '../src/lib/booklet-layout.js';
import {
 EDITIONS,contract,bookletIndex,overridesFor,blockEntry,compactLayout,blockHash,targetsUnchanged,provenanceFile,loadProvenance,saveProvenance,setState,commentNote,
 callWorker,pool,defaultRunner,defaultLease,defaultMapPages,defaultRenderImages,canonicalRunDir,contentHash,BASE
} from './review.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const now=()=>new Date().toISOString();
const relative=(root,file)=>path.relative(root,file).replaceAll('\\','/');

// Areas the worker may repair. Reviews, extensions and duplicates belong to the pedagogy review.
export const APPLY_AREAS=Object.freeze(['pagination','spacing','labels','response','table','alignment','answers','diagram']);
export const LEFT_AREAS=Object.freeze(['review','extension','duplicate']);

// ---- guards -------------------------------------------------------------------------

// Fields the renderer reads for layout. responseSpace through diagramWidthMm were added on
// 17 October 2026: the renderer consumes them, and refusing them failed 33 repairs.
const LAYOUT_FIELDS=new Set(['align','verticalAlign','spaceBefore','spaceAfter','marginBefore','marginAfter','padding','paddingMm','margin','widths','rowHeights','border','borders','borderColour','background','headerBackground','widthMm','width','heightMm','gap','minHeight','minHeightMm','answerSpaceMm','responseSpace','layout','columns','flow','fontSize','lineHeight','indent','display','header','headerRow','colspan','rowspan','pageBreakBefore','breakBefore','keepTogether','responseLabel','unlabelled','label','presentation','clozeStyle','style','preserveParagraphAlignment','arrangement','responseWidthMm',
 'backgroundColor','borderWidthMm','diagramPlacement','direction','weight','tail','gapMm','diagramWidthMm']);
// Containers a table or cloze change has to rebuild; the content check guards what they hold.
const STRUCTURE_FIELDS=new Set(['rows','cells','children','prompt','inlines','parts','items','blocks']);
// Answer-edition diagram sizes are per-diagram settings; the booklet-wide defaults are not repairs.
const EDITION_SETTINGS=new Set(['diagramWidths','diagramStyles']);
const pointerParts=field=>typeof field==='string'&&field.startsWith('/')?field.split('/').slice(1).map(part=>part.replace(/~1/g,'/').replace(/~0/g,'~')):null;
export function patchAllowed(patch){
 const parts=pointerParts(patch?.field);
 if(!parts?.length)return false;
 if(patch.targetId==='project')return parts[0]==='settings'&&parts.length>2&&(parts[1]==='layoutOverrides'||parts[1]==='compactAnswers'&&EDITION_SETTINGS.has(parts[2])&&parts.length>3);
 const head=parts[0]==='content'?parts[1]:parts[0];
 // A source response label is a label like any other.
 if(head==='sourceReview')return parts.at(-1)==='label';
 return head!==undefined&&(LAYOUT_FIELDS.has(head)||STRUCTURE_FIELDS.has(head));
}

// What a student reads or an answer key records, as a sorted list. Layout, labels, ids and
// empty strings do not count; any answer string counts as an answer wherever it sits, so a
// cloze answer may move into a response answer field.
const IGNORED_KEYS=new Set(['id','type','label','responseLabel','unlabelled','align','verticalAlign','background','headerBackground','border','borders','borderColour','layout','display','flow','presentation','style','clozeStyle','variant','arrangement','colour','color']);
const ANSWER_KEYS=new Set(['answer','answers','short','worked','expected','solution']);
export function contentTokens(value){
 const tokens=[];
 const walk=(node,key,answer)=>{
  if(Array.isArray(node))return node.forEach(child=>walk(child,key,answer));
  if(typeof node==='string'){const textValue=node.replace(/\s+/g,' ').trim();if(textValue&&!IGNORED_KEYS.has(key))tokens.push((answer?'ans:':'c:')+textValue);return;}
  if(!node||typeof node!=='object')return;
  for(const [name,child] of Object.entries(node)){
   if(IGNORED_KEYS.has(name)||LAYOUT_FIELDS.has(name)&&typeof child!=='object'&&!ANSWER_KEYS.has(name))continue;
   walk(child,name,answer||ANSWER_KEYS.has(name));
  }
 };
 walk(value,'',false);
 return tokens.sort();
}
export const sameContent=(before,after)=>isDeepStrictEqual(contentTokens(before),contentTokens(after));

// ---- trial apply ------------------------------------------------------------------------
export function canonicalLayoutValue(patch,value=patch.corrected){
 // A whole blockLayouts entry is saved through the same normaliser as the rest of the settings.
 const entry=/^\/settings\/layoutOverrides\/blockLayouts\/([^/]+)$/.exec(patch.field??'');
 if(entry&&value&&typeof value==='object'&&!Array.isArray(value))return normalizeBlockLayouts({entry:value}).entry;
 if(!patch.field?.includes('/arrangement')||!value||typeof value!=='object')return value;
 if(value.version===1&&value.root)return normalizeArrangement(value);
 if(Array.isArray(value))return normalizeArrangement({version:1,root:{id:'first-pass-validation-root',type:'group',children:value}}).root.children;
 if(['group','item'].includes(value.type))return normalizeArrangement({version:1,root:value}).root;
 return value;
}

const countHoles=value=>Array.isArray(value)?value.reduce((sum,child)=>sum+(child==null?1:countHoles(child)),0):value&&typeof value==='object'?Object.values(value).reduce((sum,child)=>sum+countHoles(child),0):0;
// Each correction (one finding) is applied, in order, on a running clone of the affected
// blocks. A correction that does not match, touches a forbidden field, loses content, or
// conflicts with an earlier one (its original no longer matches) becomes a comment.
export function trialApply({blocks,settings,corrections,applyCorrections,preflight=null}){
 const accepted=[],comments=[];
 const run=structuredClone(blocks),holder={id:'project',settings:structuredClone(settings??{})};
 for(const correction of corrections){
  const fail=why=>comments.push({findingId:correction.id,why});
  let patches;
  try{patches=createMissingParents(resolveArrangementTargets(correction.patches??[],{blocks:run,settings:holder.settings}),{blocks:run,settings:holder.settings}).map(p=>({...p,corrected:canonicalLayoutValue(p)}));}
  catch(error){fail('Invalid arrangement: '+error.message);continue;}
  if(!patches.length){fail('The worker returned no patch.');continue;}
  const bad=patches.find(patch=>!patchAllowed(patch));
  if(bad){fail(`Patch on ${bad.targetId}${bad.field} is not a layout field.`);continue;}
  if(patches.some(patch=>isDeepStrictEqual(patch.original??null,patch.corrected??null))){fail('A patch changes nothing.');continue;}
  const trial=structuredClone(run),trialHolder={id:'project',settings:structuredClone(holder.settings)};
  const outcome=applyCorrections([...trial,trialHolder],[{...correction,patches}]);
  const rejected=(outcome.rejected??[]).filter(row=>row.status==='rejected');
  if(rejected.length){fail('Does not apply: '+rejected.map(row=>`${row.targetId}${row.field} (${row.error})`).join('; '));continue;}
  if(!outcome.applied?.length){fail('Applies nothing.');continue;}
  // A list entry set to null leaves a hole the project validator rejects on save.
  const holes=trial.filter((block,i)=>countHoles(block)>countHoles(run[i]));
  if(holes.length){fail('Would leave an empty entry in a list in '+holes.map(block=>block.id).join(', ')+'; remove the entry by rewriting its list.');continue;}
  const lost=trial.filter((block,i)=>!sameContent(run[i],block));
  if(lost.length){fail('Would change content in '+lost.map(block=>block.id).join(', ')+'.');continue;}
  let ownershipError;
  for(const block of trial)if(block.flow?.tableContinuation){
   try{fragmentQuestion(block,[{parentId:block.content.id,ids:(block.content.children??[]).map(part=>part.id)}]);}
   catch(error){ownershipError=block.id+': '+error.message;break;}
  }
  if(ownershipError){fail('Would break pagination: '+ownershipError);continue;}
  // The render's structural preflight refuses arrangements whose refs name no content node;
  // check before saving rather than after, when only an empty verdict would show it.
  if(preflight){const known=new Set(preflight(run,holder.settings)),added=preflight(trial,trialHolder.settings).filter(issue=>!known.has(issue));if(added.length){fail('Would break a saved arrangement: '+added.slice(0,3).join('; ')+'.');continue;}}
  run.splice(0,run.length,...trial);holder.settings=trialHolder.settings;
  accepted.push({...correction,patches});
 }
 // applyRepair saves all content patches before project settings patches. Validate
 // that actual order as well, rather than accepting patches that only work interleaved.
 for(;;){
  const replay=structuredClone(blocks),settingsHolder={id:'project',settings:structuredClone(settings??{})};
  const ordered=[false,true].flatMap(projectOnly=>accepted.map(c=>({...c,patches:c.patches.filter(p=>(p.targetId==='project')===projectOnly)})));
  const result=applyCorrections([...replay,settingsHolder],ordered),bad=new Set(result.rejected.filter(row=>row.status==='rejected').map(row=>row.correctionId));
  if(!bad.size)break;
  for(let i=accepted.length-1;i>=0;i--)if(bad.has(accepted[i].id)){comments.push({findingId:accepted[i].id,why:'Patches conflict in the content-before-settings save order.'});accepted.splice(i,1);}
 }
 return {accepted,comments};
}
// The same patches undone, last first.
export const inversePatches=corrections=>corrections.map(correction=>({id:correction.id+'-revert',reason:'Revert '+correction.id,patches:[...correction.patches].reverse().map(patch=>({targetId:patch.targetId,field:patch.field,original:patch.corrected,corrected:patch.original}))})).reverse();

// ---- worker --------------------------------------------------------------------------------

// Findings that touch a common block are repaired together so their patches agree.
export function groupFindings(findings){
 const parent=new Map();
 const find=id=>{while(parent.get(id)!==id){parent.set(id,parent.get(parent.get(id)));id=parent.get(id);}return id;};
 for(const finding of findings)for(const target of finding.targets)if(!parent.has(target.blockId))parent.set(target.blockId,target.blockId);
 for(const finding of findings){const [first,...rest]=finding.targets.map(target=>target.blockId);for(const id of rest)parent.set(find(id),find(first));}
 const groups=new Map();
 for(const finding of findings){const key=find(finding.targets[0].blockId);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(finding);}
 return [...groups.values()];
}
const RULES=`You repair layout findings on a MathsMap booklet by returning exact-field JSON patches. Do not run commands or open files: everything is below.

Rules:
- Change layout only: spacing, margins, padding, row heights, widths, widthMm, gaps, minimum heights, answer space (answerSpaceMm), alignment, flow, page breaks, borders and header background, labels (label, unlabelled), cloze style and width, table structure, and entries under /settings/layoutOverrides. Never change wording, mathematics, answers, TikZ code or image sources. An ordinary cloze may move into a response answer field only when the finding asks for it.
- Each patch is {"targetId": id of the block, or of a node inside it, or "project" for /settings, "field": JSON pointer relative to that node, "original": exact current value (null if absent), "corrected": final value}. Prefer the innermost node that owns the field. "original" must match exactly or the patch is rejected. Each block lists its nodes with their id path and pointer, its containers' layout, its saved arrangement and answer spaces with the project pointers that edit them, and its answer-edition overrides. An arrangement node is edited with targetId "project" and its pointer. When page images are attached, "pages" says which image shows which edition, page and blocks; use them to find what actually takes the space or breaks the page. "neighbours" are the blocks before and after; you may patch them too when the fix needs it (moving space or a break between blocks). "rendererFields" says which fields the renderer reads: use those, not invented ones.
- Keep handwriting space adequate; do not shrink space merely to fill pages. Prefer the smallest change that fixes the finding. Follow the house conventions in the review contract below.
- A finding you cannot fix by layout alone (a diagram that must be redrawn, a content problem, an unclear proposal) goes in "comments" with a short reason. Never guess.
- Return one JSON object and nothing else: {"corrections":[{"id":"FINDING_ID","reason":"...","patches":[...]}],"comments":[{"findingId":"FINDING_ID","why":"..."}]}. Every finding id appears in exactly one of the two lists.`;
// ---- what the worker sees (widened 17 October 2026) ----------------------------------------
// Workers failed about one finding in three for want of a field they could not see: node
// paths, the enclosing container, the saved arrangement, answer-edition overrides, the next
// block, or the rendered page. Each block now carries all of them.
const FULL_JSON=40000,NEIGHBOUR_JSON=12000,NODE_ROWS=300;
const escapePointer=key=>String(key).replace(/~/g,'~0').replace(/\//g,'~1');
const isObject=value=>value&&typeof value==='object'&&!Array.isArray(value);
function findWithPointer(value,id,pointer=''){
 if(Array.isArray(value)){for(const [i,child] of value.entries()){const found=findWithPointer(child,id,pointer+'/'+i);if(found)return found;}return null;}
 if(!isObject(value))return null;
 if(value.id===id)return {node:value,pointer};
 for(const [key,child] of Object.entries(value))if(child&&typeof child==='object'){const found=findWithPointer(child,id,pointer+'/'+escapePointer(key));if(found)return found;}
 return null;
}
// Every node with an id: its id path from the block and its pointer from the block.
export function nodePaths(block){
 const rows=[];
 const walk=(node,pointer,chain)=>{
  if(Array.isArray(node))return node.forEach((child,i)=>walk(child,pointer+'/'+i,chain));
  if(!isObject(node))return;
  let next=chain;
  if(typeof node.id==='string'){next=[...chain,node.id];if(rows.length<NODE_ROWS)rows.push({id:node.id,...(node.type?{type:node.type}:{}),...(node.label!=null&&typeof node.label!=='object'?{label:node.label}:{}),path:next.join(' > '),pointer:pointer||''});}
  for(const [key,child] of Object.entries(node))if(child&&typeof child==='object')walk(child,pointer+'/'+escapePointer(key),next);
 };
 walk(block,'',[]);
 return rows;
}
const layoutOf=node=>Object.fromEntries(Object.entries(node??{}).filter(([key,value])=>LAYOUT_FIELDS.has(key)&&value!=null).map(([key,value])=>[key,typeof value==='object'&&JSON.stringify(value).length>400?JSON.stringify(value).slice(0,400)+'…':value]));
// The layout of each node that encloses a target, outermost first, and of the section.
export function containersOf(index,blockId,targetIds){
 const {block,section}=index.blocks.get(blockId),chains={};
 for(const id of targetIds){
  if(id===blockId){chains[id]=[];continue;}
  const chain=[];
  const walk=(node,trail)=>{if(Array.isArray(node))return node.some(child=>walk(child,trail));if(!isObject(node))return false;if(node.id===id){chain.push(...trail);return true;}const next=typeof node.id==='string'?[...trail,node]:trail;return Object.values(node).some(child=>child&&typeof child==='object'&&walk(child,next));};
  walk(block,[]);
  chains[id]=chain.map(node=>({id:node.id,type:node.type??null,...layoutOf(node)}));
 }
 const {blocks,...rest}=section;
 return {section:{id:section.id,title:section.title??null,phase:section.phase??null,...layoutOf(rest)},ancestors:chains};
}
// Saved arrangements and answer spaces for the block, with the project pointer that edits each,
// and the pointer of every arrangement node inside them.
export function savedLayouts(project,index,blockId){
 const overrides=overridesFor(project,index,blockId),rows={};
 for(const [name,map] of Object.entries(overrides))for(const [key,value] of Object.entries(map)){
  const pointer=`/settings/layoutOverrides/${escapePointer(name)}/${escapePointer(key)}`;
  const nodes=[];const walk=(node,at)=>{if(Array.isArray(node))return node.forEach((child,i)=>walk(child,at+'/'+i));if(!isObject(node))return;if(typeof node.id==='string')nodes.push({id:node.id,type:node.type??null,...(node.ref?{ref:node.ref}:{}),pointer:at});for(const [k,child] of Object.entries(node))if(child&&typeof child==='object')walk(child,at+'/'+escapePointer(k));};
  walk(value,pointer);
  (rows[name]??=[]).push({key,pointer,value,...(nodes.length?{nodes}:{})});
 }
 return rows;
}
// Answer-edition overrides that name a node of the block, and the booklet defaults they override.
export function editionOverrides(project,index,blockId){
 const own=index.ids.get(blockId)??new Set([blockId]),compact=project.settings?.compactAnswers??{},block=index.blocks.get(blockId).block;
 const widths=Object.fromEntries(Object.entries(compact.diagramWidths??{}).filter(([id])=>own.has(id)).map(([id,value])=>[id,{pointer:'/settings/compactAnswers/diagramWidths/'+escapePointer(id),value}]));
 const styles={};for(const [edition,map] of Object.entries(compact.diagramStyles??{}))for(const [id,value] of Object.entries(map??{}))if(own.has(id))(styles[edition]??={})[id]={pointer:`/settings/compactAnswers/diagramStyles/${escapePointer(edition)}/${escapePointer(id)}`,value};
 const defaults=Object.fromEntries(Object.entries(compact).filter(([,value])=>typeof value!=='object'));
 return {defaults,...(Object.keys(widths).length?{diagramWidths:widths}:{}),...(Object.keys(styles).length?{diagramStyles:styles}:{}),...(block.presentation?{presentation:block.presentation}:{})};
}
// A block too large to send whole goes as its layout outline plus the full subtree of each target.
export function blockPayload(project,index,blockId,targetIds){
 const block=index.blocks.get(blockId).block,size=JSON.stringify(block).length;
 const json=size<=FULL_JSON?block:{outline:compactLayout(block),targetSubtrees:Object.fromEntries(targetIds.map(id=>[id,(id===blockId?null:findWithPointer(block,id)?.node)??null]).filter(([,node])=>node))};
 return {id:blockId,...(size<=FULL_JSON?{json}:{json,note:`Block is ${size} characters; its outline and the full target subtrees are given. Patch any node by its id and pointer.`}),nodes:nodePaths(block),containers:containersOf(index,blockId,targetIds),saved:savedLayouts(project,index,blockId),editionOverrides:editionOverrides(project,index,blockId)};
}
// The blocks immediately before and after, in booklet order, for fixes that move space or breaks.
export function neighbourIds(index,ids){
 const order=[...index.blocks.values()].sort((a,b)=>a.order-b.order).map(row=>row.block.id),own=new Set(ids),out=[];
 for(const id of ids){const at=order.indexOf(id);for(const near of [order[at-1],order[at+1]])if(near&&!own.has(near)&&!out.includes(near)&&index.blocks.get(near).section.phase!=='front-matter')out.push(near);}
 return out;
}
const neighbourPayload=(project,index,id)=>{const block=index.blocks.get(id).block,small=JSON.stringify(block).length<=NEIGHBOUR_JSON;return {...blockEntry(project,index,id,{characters:1200}),...(small?{json:block}:{}),nodes:nodePaths(block).slice(0,80),saved:savedLayouts(project,index,id)};};
export function repairPrompt({project,index,group,root=ROOT,feedback,evidence}){
 const ids=[...new Set(group.flatMap(finding=>finding.targets.map(target=>target.blockId)))],neighbours=neighbourIds(index,ids);
 const targetsOf=id=>[...new Set(group.flatMap(finding=>finding.targets.filter(target=>target.blockId===id).map(target=>target.id)))];
 const payload={booklet:project.title,findings:group.map(finding=>({id:finding.id,edition:finding.edition,page:finding.page,area:finding.area,scope:finding.scope,targets:finding.targets.map(target=>target.id),comment:finding.comment,...(finding.proposal?{proposal:finding.proposal}:{}),...(finding.applyNote?{earlierAttempt:finding.applyNote}:{})})),
  blocks:ids.map(id=>blockPayload(project,index,id,targetsOf(id))),neighbours:neighbours.map(id=>neighbourPayload(project,index,id)),
  rendererFields:rendererCapabilities(root),...(feedback?{verificationFeedback:feedback}:{}),...(evidence?.pages?.length?{pages:evidence.pages}:{})};
 return {prompt:RULES+'\n\nReview contract (house conventions):\n'+contract({root})+'\n\nInput:\n'+JSON.stringify(payload),blockIds:[...ids,...neighbours]};
}
// What the renderer actually reads, as a short catalogue and the code that reads it.
const RENDERER_FIELDS=`Fields the renderer reads (checked against the code on 17 October 2026):
- Question nodes: answerSpaceMm (working space; settings.layoutOverrides.answerSpaces[nodeId] overrides it), responseSpace:"scaffold" (suppresses ordinary answer space), diagramPlacement ("before-prompt", "beside-prompt", "right-of-prompt"; otherwise diagrams follow the prompt), layout ("list", "grid") with columns, label (a part's own letter), widthMm on diagrams and images.
- Arrangements (settings.layoutOverrides.blockLayouts[blockId].arrangement, version 1): group {id, type:"group", direction:"row"|"stack", children, gap mm ≤30, rules:"internal"|"grid"} and item {id, type:"item", ref:content node id}; either may have before, after (mm ≤80), inset (≤60), width (≤190), weight (row column proportion), height, minHeight (≤180), align (left|center|right|stretch), verticalAlign (top|middle|bottom), keepTogether, keepInline. An item id is usually "layout:"+ref.
- Question with a diagram beside its prompt: settings.layoutOverrides.blockLayouts[nodeId] (keyed by the question or part node id) may hold textWidthMm (15–175), gapMm (0–20), insetMm (0–40), diagramWidthMm (5–190) and diagramSizing ("fixed"|"fit") beside any arrangement. To add an entry that does not exist yet, patch /settings/layoutOverrides/blockLayouts/<id> itself with original null.
- Tables and cells: widths, rowHeights, border, borderWidthMm, backgroundColor, align, verticalAlign, header.
- Answer editions: block.presentation.answerPartLabels.short|worked[nodeId] is the label suffix shown after the question number in that edition only (for example "a" gives 4a instead of 4(1)a); presentation.shortAnswerGroupStarts lists node ids that start a new Short answers row; presentation.shortAnswerTableFullWidth:true lets a completed short-answer table use the full page width; settings.compactAnswers.diagramWidths[diagramId] = {short:mm, worked:mm} and diagramStyles[edition][diagramId].widthMm size a diagram in one answer edition only.
- Worked examples and teaching: presentation.layout ("columns", "worked-rows") with presentation.columns, presentation.numberSteps, presentation.showLabels; presentation.sourceResponseLabels:true with sourceReview.responses[].label shows source response labels; presentation.reviewNumbering:"source".
- Flow (block.flow): pageBreakBefore:true starts a new page; in the Questions edition sourcePageBreakBefore:true also does unless pageBreakBefore is false, so set pageBreakBefore:false to remove a source break. keepTogether and keepWithNext keep a block with its continuation or the next block.`;
function rendererCapabilities(root){
 const sources=[['src/lib/booklet-labels.js',65,110],['src/lib/booklet-exercises.js',10,40],['src/lib/booklet-short-answer-grid.js',60,70],['src/components/PracticeQuestionRenderer.svelte',27,39],['src/components/BookletArrangement.svelte',20,72],['public/libs/maths-editor/arrangement-model.mjs',12,31],['public/libs/maths-editor/document-model.mjs',131,146],['public/libs/maths-editor/document-model.mjs',192,206],['public/libs/maths-editor/document-model.mjs',235,241]];
 return {catalogue:RENDERER_FIELDS,notes:'The excerpts are actual renderer code. Do not invent controls: prove the renderer consumes any proposed field. Preserve continuation table ownership, content and response answers. Existing custom arrangement sizes or layoutOverrides can override node sizes. A change of printed page number alone is not a defect if the requested grouping is achieved.',sources:sources.filter(([file])=>fs.existsSync(path.join(root,file))).map(([file,start,end])=>({file,code:fs.readFileSync(path.join(root,file),'utf8').split(/\r?\n/).slice(start,end).join('\n')}))};
}
// A patch that adds a value under objects that do not exist yet (a new blockLayouts entry, a
// first answerPartLabels edition) becomes one patch that creates the outermost missing object.
export function createMissingParents(patches,{blocks,settings}){
 return patches.map(patch=>{
  const parts=pointerParts(patch.field);
  if(!parts||patch.original!=null||patch.corrected===undefined)return patch;
  let node=patch.targetId==='project'?{settings}:blocks.map(block=>block.id===patch.targetId?block:findWithPointer(block,patch.targetId)?.node).find(Boolean);
  if(!node)return patch;
  let at=0;
  for(;at<parts.length-1;at++){const next=node[parts[at]];if(!next||typeof next!=='object')break;node=next;}
  if(at===parts.length-1||node[parts[at]]!=null)return patch;
  let value=structuredClone(patch.corrected);for(let i=parts.length-1;i>at;i--)value={[parts[i]]:value};
  return {...patch,field:'/'+parts.slice(0,at+1).map(escapePointer).join('/'),original:null,corrected:value};
 });
}
// Workers sometimes target an arrangement node by its own id. Rewrite such a patch to the
// project pointer of that node, so it edits the saved arrangement it names.
export function resolveArrangementTargets(patches,{blocks,settings}){
 const inBlocks=id=>blocks.some(block=>block.id===id||findWithPointer(block,id));
 return patches.map(patch=>{
  if(patch.targetId==='project'||inBlocks(patch.targetId))return patch;
  for(const [key,value] of Object.entries(settings?.layoutOverrides?.blockLayouts??{})){
   const found=findWithPointer(value,patch.targetId);
   if(found)return {...patch,targetId:'project',field:`/settings/layoutOverrides/blockLayouts/${escapePointer(key)}${found.pointer}${patch.field}`};
  }
  return patch;
 });
}

export function repairEvidence(group,evidence){
 const wanted=new Set(group.flatMap(f=>(f.targets??[]).map(t=>t.blockId))),pages=[],images=[];
 for(const phase of ['before','after']){
  const source=evidence?.[phase];if(!source)continue;
  for(const edition of EDITIONS){
   const map=source.pagemap?.[edition]??[];
   const selected=map.filter(p=>p.blocks?.some(id=>wanted.has(id))).flatMap(p=>map.filter(n=>Math.abs(n.page-p.page)<=1));
   for(const page of selected){const file=source.images?.[edition]?.[page.page];if(!file||images.includes(file)||images.length>=12)continue;images.push(file);pages.push({phase,edition,page:page.page,blocks:page.blocks,image:images.length});}
  }
 }
 return {pages,images};
}

// ---- save and verify -----------------------------------------------------------------------

async function openProject(projectFile,root){return (await import('../scripts/booklet/lean-review.mjs')).openProject(projectFile,{root});}
async function repairModule(){return import('../scripts/booklet/lean-review.mjs');}
const blockList=(project,ids)=>ids.map(id=>bookletIndex(project).blocks.get(id)?.block).filter(Boolean);

// Defaults used outside tests.
export async function defaultVerify({project,projectFile,root,workDir,runDir,runner,lease,accepted,changed,editions,base,before,log,findingDetails={}}){
 const index=bookletIndex(project);
 const mapped=await defaultMapPages({project,dir:path.join(workDir,'after-'+contentHash(project).slice(0,12)),base,fresh:true,root});
 const pageSets=Object.fromEntries(EDITIONS.map(edition=>[edition,(mapped[edition]??[]).filter(page=>(page.blocks??[]).some(id=>changed.includes(id)))]));
 for(const edition of EDITIONS)if(!editions.includes(edition))pageSets[edition]=[];
 const selection={...pageSets,blocks:changed};
 const after=await defaultRenderImages({project,dir:path.join(workDir,'after-'+contentHash(project).slice(0,12)),selection,pagemap:mapped,base,fresh:true,root,log});
 const automated=(after.failures??[]).map(row=>row.kind+(row.count?' ×'+row.count:''));
 const evidence={before,after:{...after,pagemap:mapped}};
 const tasks=verificationTasks({accepted,findingDetails,index,before,after:evidence.after,editions});
 const verdicts=[];
 await pool(tasks,3,async task=>{
  if(task.error){verdicts.push({id:task.row.id,edition:task.edition,fixed:false,regressed:false,unverified:true,note:task.error});return;}
  const prompt=verifyPrompt({accepted:[{...task.row,finding:findingDetails[task.row.id]?.comment}],pages:task.pages,requireFix:task.requireFix});
  const {result}=await callWorker({runner,lease,canonicalRunDir:runDir,workDir,name:'verify-'+task.edition,prompt,images:task.images});
  const row=result?.findings?.find(f=>f.id===task.row.id);
  verdicts.push(row?{...row,edition:task.edition}:{id:task.row.id,edition:task.edition,fixed:false,regressed:false,unverified:true,note:'No verdict returned.'});
 });
 const findings=accepted.map(row=>{const own=verdicts.filter(v=>v.id===row.id);return {id:row.id,fixed:own.length>0&&own.every(v=>v.fixed===true),regressed:own.some(v=>v.regressed===true),unverified:own.some(v=>v.unverified===true),note:own.map(v=>v.edition+': '+v.note).join('; ')};});
 return {automated,findings,after:after.report,evidence};
}
export function verificationTasks({accepted,findingDetails={},index,before,after,editions}){
 return accepted.flatMap(row=>{
  const targets=findingDetails[row.id]?.targets??row.patches.map(p=>({blockId:index.owners.get(p.targetId)??p.targetId}));
  const blocks=new Set(targets.map(t=>t.blockId));
  return editions.flatMap(edition=>{
   if(edition!=='student'&&![...(before?.pagemap?.[edition]??[]),...(after?.pagemap?.[edition]??[])].some(p=>p.blocks?.some(id=>blocks.has(id))))return [];
   const pages=[],images=[];
   for(const [phase,source] of [['before',before],['after',after]]){
    const map=source?.pagemap?.[edition]??[],wanted=map.filter(p=>p.blocks?.some(id=>blocks.has(id)));
    for(const p of map.filter(p=>wanted.some(w=>Math.abs(w.page-p.page)<=1))){const file=source?.images?.[edition]?.[p.page];if(!file)continue;images.push(file);pages.push({phase,edition,page:p.page,blocks:p.blocks,image:images.length});}
   }
   const afterCovered=new Set(pages.filter(p=>p.phase==='after').flatMap(p=>p.blocks??[]));
   const missing=[...blocks].filter(id=>!afterCovered.has(id));
   return {row,edition,requireFix:!findingDetails[row.id]?.edition||findingDetails[row.id].edition===edition,pages,images,...(missing.length?{error:'Cannot verify missing target blocks: '+missing.join(', ')}:images.length>12?{error:'Finding needs more than 12 evidence pages; held for scoped review rather than truncating images.'}:{} )};
  });
 });
}
// Rasters of the changed pages before the repair, from the review's own render when it covers them.
export async function defaultRenderBefore({project,changed,editions,workDir,root=ROOT,base=BASE,log}){
 const dir=path.join(workDir,'render-'+contentHash(project).slice(0,12)),mapped=await defaultMapPages({project,dir,base,fresh:false,root});
 const pages=Object.fromEntries(EDITIONS.map(edition=>[edition,editions.includes(edition)?(mapped[edition]??[]).filter(page=>(page.blocks??[]).some(id=>changed.includes(id))):[]]));
 return {...await defaultRenderImages({project,dir,selection:{...pages,blocks:changed},pagemap:mapped,base,fresh:false,root,log}),pagemap:mapped};
}
export function verifyPrompt({accepted,pages,requireFix=true}){
 return `You check repairs to a printed MathsMap booklet. Do not run commands or open files. Each attached image has its own entry in "pages", including phase (before or after), edition, physical page, block IDs and image number. Page numbers can change after repagination: compare the same blocks across phases, never assume that equal page numbers contain the same content. Neighbour pages provide continuation context. ${requireFix?'Check that the original finding is fixed in its own edition.':'This is a regression-only check of another edition. Do not require a student-only feature such as handwriting space in an answer edition, or an answer-only feature in Questions. Return fixed:true if this edition has no regression; the original defect is checked separately in its own edition.'} Say whether the AFTER evidence regressed anything: clipping, overlap, lost content, a collision, or cramped working space. A different physical page number alone is neither an unfixed defect nor regression. If a target is not shown, say it cannot be verified; never infer content was lost from a page-number shift. Optional wording or cosmetic preferences never count as regression.\nReturn one JSON object and nothing else: {"findings":[{"id":"FINDING_ID","fixed":true|false,"regressed":true|false,"note":"short reason"}]} with exactly one entry per finding.\nInput:\n`+JSON.stringify({pages,requireFix,findings:accepted.map(row=>({id:row.id,finding:row.finding,reason:row.reason,changes:row.patches.map(patch=>patch.targetId+patch.field)}))});
}

// A save can meet a Windows file lock (UNKNOWN, EBUSY, EPERM). Before trying again, check
// whether the patches already landed: their inverse then applies cleanly to the saved file.
const LOCKED=new Set(['UNKNOWN','EBUSY','EPERM','EACCES']);
export async function saveRepair(applyRepair,options,{attempts=6,wait=ms=>new Promise(done=>setTimeout(done,ms))}={}){
 for(let attempt=1;;attempt++){
  try{return await applyRepair(options);}
  catch(error){
   if(!LOCKED.has(error.code)||attempt>=attempts)throw error;
   await wait(5000*attempt);
   try{
    const saved=read(options.projectFile),corrections=read(options.correctionsFile).corrections??[];
    const blocks=(saved.sections??[]).flatMap(section=>section.blocks??[]),holder={id:'project',settings:structuredClone(saved.settings??{})};
    const check=(await import('../scripts/booklet/lean-review.mjs')).applyCorrections([...structuredClone(blocks),holder],inversePatches(corrections));
    if(check.applied.length&&!check.rejected.some(row=>row.status==='rejected'))return {applied:check.applied.length,revision:saved.revision??null,recovered:error.code};
   }catch{}
  }
 }
}

// ---- run ---------------------------------------------------------------------------------------

// Queue mode (17 October 2026): `findingIds` names pending findings to attempt again with the
// widened worker access, whatever their earlier outcome. Each gets one queue rerun; its
// in-run retry is used only if the earlier attempts never consumed one.
export async function runApply({projectFile,root=ROOT,provenanceDir,runDir,workDir,concurrency=3,runner=defaultRunner,lease=defaultLease,verify=defaultVerify,renderBefore=verify===defaultVerify?defaultRenderBefore:null,retry=true,retryFindings=[],findingIds=null,queueLabel=null,base=BASE,log=()=>{}}={}){
 if(!runDir)throw Error('Name a run folder for the corrections file');
 const {applyCorrections,applyRepair}=await repairModule();
 const handle=await openProject(projectFile,root),project=handle.project,index=bookletIndex(project),file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project);
 workDir??=path.join(root,'.booklet-work','first-pass-review',project.id);
 const canonical=canonicalRunDir(project,{root});
 fs.mkdirSync(runDir,{recursive:true});
 const recovery=new Map(retryFindings.map(row=>[row.id,row]));
 if(recovery.size)retry=false; // A historical retry is already the second and final attempt.
 const previousApply=record.apply;
 const scopeRecovery=finding=>recovery.get(finding.id)?.causeFixed==='verifier-edition-scope'&&recovery.get(finding.id)?.kind==='verification'&&recovery.get(finding.id)?.correction&&!finding.verifierScopeRecoveryUsed;
 const named=findingIds&&new Set(findingIds),openComment=finding=>!finding.commentId||(project.studio?.flags??[]).some(flag=>flag.id===finding.commentId&&!flag.resolved);
 if(named&&recovery.size)throw Error('Name either queue findings or historical retries, not both');
 const pending=(record.findings??[]).filter(finding=>finding.state==='pending'&&(named?named.has(finding.id)&&!finding.groupedUnder&&!finding.queueRerun&&openComment(finding):recovery.size?recovery.has(finding.id)&&finding.applyOutcome==='reverted'&&(!finding.retryUsed||scopeRecovery(finding))&&!recovery.get(finding.id).regressed&&openComment(finding):!finding.commentId&&!finding.applyOutcome));
 // The earlier attempt's outcome stays readable while this one runs.
 if(named)for(const finding of pending){finding.queueRerun={queue:finding.queue?.name??queueLabel,at:now(),previous:{outcome:finding.applyOutcome??null,note:finding.applyNote??null}};}
 const left=pending.filter(finding=>LEFT_AREAS.includes(finding.area)||!APPLY_AREAS.includes(finding.area)),candidates=pending.filter(finding=>!left.includes(finding));
 for(const finding of left)finding.applyOutcome='left';
 const stale=candidates.filter(finding=>!targetsUnchanged(finding,project,index)),current=candidates.filter(finding=>!stale.includes(finding));
 for(const finding of stale){setState(finding,'stale','A target changed before the repair.');}
 // The worker sees the rendered pages on its first attempt too, not only on a retry: about a
 // third of earlier refusals were for want of the page. A render failure leaves it without them.
 const targetBlocks=[...new Set(current.flatMap(f=>f.targets.map(t=>t.blockId)))],neighbours=neighbourIds(index,targetBlocks);
 let recoveryBaseline=null;
 if(renderBefore&&current.length){
  const editions=recovery.size?EDITIONS:[...new Set(['student',...current.map(f=>f.edition).filter(Boolean)])];
  try{recoveryBaseline=await renderBefore({project,changed:[...targetBlocks,...neighbours],editions,workDir,root,base,log});}
  catch(error){if(recovery.size)throw error;log('No page images for the repair workers: '+error.message);}
 }
 if(recovery.size){for(const finding of current){if(scopeRecovery(finding))finding.verifierScopeRecoveryUsed=true;finding.retryUsed=true;}saveProvenance(file,record);}
 const byId=new Map(current.map(finding=>[finding.id,finding])),comments=new Map(),corrections=[],calls=[];
 await pool(groupFindings(current),concurrency,async group=>{
  const verifyOnly=group.filter(f=>recovery.get(f.id)?.kind==='verification');
  for(const finding of verifyOnly){const correction=recovery.get(finding.id).correction;if(correction)corrections.push(correction);else comments.set(finding.id,'The original correction is unavailable; cannot safely retry verification.');}
  group=group.filter(f=>!verifyOnly.includes(f));
  if(!group.length)return;
  const feedback=recovery.size?group.map(f=>({id:f.id,note:recovery.get(f.id)?.note,previousPatches:recovery.get(f.id)?.correction?.patches})):undefined;
  const visuals=recoveryBaseline?repairEvidence(group,{before:recoveryBaseline}):null;
  const {prompt,blockIds}=repairPrompt({project,index,group,root,feedback,evidence:visuals});
  const call={findings:group.map(finding=>finding.id),blocks:blockIds};calls.push(call);
  try{
   const {result}=await callWorker({runner,lease,canonicalRunDir:canonical,workDir,name:recovery.size?'repair-retry':'repair',prompt:recovery.size?'This is the final retry. The previous repair was reverted as ineffective. Use verificationFeedback, the attached page images and the actual renderer excerpts to choose a different safe layout change, or return a comment.\n'+prompt:prompt,images:visuals?.images??[]});
   const seen=new Set();
   for(const row of Array.isArray(result?.corrections)?result.corrections:[])if(byId.has(row?.id)&&!seen.has(row.id)){seen.add(row.id);corrections.push(row);}
   for(const row of Array.isArray(result?.comments)?result.comments:[])if(byId.has(row?.findingId)&&!seen.has(row.findingId)){seen.add(row.findingId);comments.set(row.findingId,String(row.why??'Not expressible as layout.'));}
   for(const finding of group)if(!seen.has(finding.id))comments.set(finding.id,'The repair worker returned nothing for this finding.');
  }catch(error){call.error=error.message;for(const finding of group)comments.set(finding.id,'Repair worker failed: '+error.message);}
 });
 corrections.sort((a,b)=>current.findIndex(f=>f.id===a.id)-current.findIndex(f=>f.id===b.id));
 // Neighbours were offered to the worker, so their patches are tried and guarded like the rest.
 const touchedIds=[...targetBlocks,...neighbours];
 const {structuralPreflight}=await import('../scripts/booklet/feedback-preflight.mjs');
 const preflight=(blocks,settings)=>structuralPreflight({id:project.id,revision:project.revision,sections:[{id:'first-pass-trial',phase:'practice',blocks}],settings},{blockIds:blocks.map(block=>block.id)}).issues.filter(issue=>/arrangement/.test(issue.kind)).map(issue=>`${issue.blockId} ${issue.kind} ${issue.ref??issue.message??''}`.trim());
 const trial=trialApply({blocks:blockList(project,touchedIds),settings:project.settings,corrections,applyCorrections,preflight});
 for(const row of trial.comments)comments.set(row.findingId,row.why);
 let accepted=trial.accepted;
 const outcome={project:project.id,applied:[],reverted:[],comment:[],left:left.map(finding=>finding.id),stale:stale.map(finding=>finding.id),errors:[],calls,retries:[],verificationAttempts:[]};
 if(recovery.size)outcome.retries=current.map(f=>({id:f.id,kind:recovery.get(f.id).kind,note:recovery.get(f.id).note,historical:true}));
 let before=null,changed=[];
 if(accepted.length)saveAndVerify:{
  const correctionsFile=path.join(runDir,'corrections-'+now().replace(/[:.]/g,'-')+'.json');
  fs.writeFileSync(correctionsFile,JSON.stringify({project:project.id,corrections:accepted},null,1)+'\n');
  changed=[...new Set(accepted.flatMap(row=>row.patches.map(patch=>patch.targetId==='project'?null:(index.owners.get(patch.targetId)??patch.targetId))).filter(Boolean))];
  // Settings-only repairs change the block that the finding targets.
  for(const row of accepted){const finding=byId.get(row.id);if(row.patches.every(patch=>patch.targetId==='project'))finding.targets.forEach(target=>changed.push(target.blockId));}
  changed=[...new Set(changed)];
  const editions=[...new Set(['student',...accepted.map(row=>byId.get(row.id).edition).filter(Boolean),...accepted.filter(row=>['labels','answers','response'].includes(byId.get(row.id).area)).flatMap(row=>['short','worked'])])];
  before=renderBefore?await renderBefore({project,changed,editions,workDir,root,base,log}):null;
  // A save the project validator refuses changes nothing: its findings stay comments.
  try{await saveRepair(applyRepair,{runDir,projectFile,correctionsFile,root});}
  catch(error){
   if(read(handle.file).revision!==project.revision)throw error;
   for(const row of accepted)comments.set(row.id,'The project save refused the repair: '+error.message);
   outcome.errors.push('Save refused, nothing changed: '+error.message);accepted=[];break saveAndVerify;
  }
  const saved=read(handle.file);
  const verifyOnce=async(snapshot,rows)=>{
   let result;
   try{result=await verify({project:snapshot,projectFile,root,workDir,runDir:canonical,runner,lease,accepted:rows,changed,editions,base,before,log,findingDetails:Object.fromEntries(current.map(f=>[f.id,f]))});}
   catch(error){result={automated:[],findings:[],error:error.message};}
   outcome.verificationAttempts.push({at:now(),findings:result.findings??[],automated:result.automated??[],...(result.error?{error:result.error}:{})});
   return result;
  };
  const undoRows=async(rows)=>{
   if(!rows.length)return;
   const undoFile=path.join(runDir,'reverts-'+now().replace(/[:.]/g,'-')+'.json');
   fs.writeFileSync(undoFile,JSON.stringify({project:project.id,corrections:inversePatches(rows)},null,1)+'\n');
   await saveRepair(applyRepair,{runDir,projectFile,correctionsFile:undoFile,root});
  };
  let verdicts=await verifyOnce(saved,accepted);
  const initialVerdicts=new Map((verdicts.findings??[]).map(row=>[row.id,row]));
  // A queue rerun keeps the one-retry budget: a finding that already used its retry gets none.
  const retryable=retry?accepted.filter(row=>{const v=initialVerdicts.get(row.id);return !(named&&byId.get(row.id).retryUsed)&&(!v||(v.regressed!==true&&v.fixed!==true));}):[];
  if(retryable.length){
   for(const row of retryable)byId.get(row.id).retryUsed=true;
   saveProvenance(file,record);
   const regressions=accepted.filter(row=>initialVerdicts.get(row.id)?.regressed===true);
   const unfixed=retryable.filter(row=>initialVerdicts.has(row.id)&&initialVerdicts.get(row.id).unverified!==true);
   // Missing verdicts retry verification without inventing a different repair.
   // An explicit unfixed verdict first restores the old layout, then guides one new repair.
   await undoRows(accepted.filter(row=>regressions.includes(row)||unfixed.includes(row)));
   for(const row of regressions){outcome.reverted.push(row.id);comments.set(row.id,'Reverted after verification: '+initialVerdicts.get(row.id).note+'.');}
   for(const row of retryable)outcome.retries.push({id:row.id,kind:unfixed.includes(row)?'repair':'verification',note:initialVerdicts.get(row.id)?.note??verdicts.error??'No verdict returned.'});
   log(`One bounded retry: ${unfixed.length} unfixed repairs, ${retryable.length-unfixed.length} missing verdicts.`);
   accepted=accepted.filter(row=>!regressions.includes(row)&&!unfixed.includes(row));
   if(unfixed.length){
    const snapshot=read(handle.file),snapshotIndex=bookletIndex(snapshot),retryCorrections=[];
    await pool(groupFindings(unfixed.map(row=>byId.get(row.id))),concurrency,async group=>{
     const feedback=group.map(f=>({id:f.id,note:initialVerdicts.get(f.id)?.note,previousPatches:unfixed.find(row=>row.id===f.id)?.patches}));
     const visuals=repairEvidence(group,verdicts.evidence);
     const {prompt,blockIds}=repairPrompt({project:snapshot,index:snapshotIndex,group,root,feedback,evidence:visuals});
     const call={findings:group.map(f=>f.id),blocks:blockIds,retry:true};calls.push(call);
     try{
      const {result}=await callWorker({runner,lease,canonicalRunDir:canonical,workDir,name:'repair-retry',prompt:'The previous repair was reverted because verification found it ineffective. Use verificationFeedback, the attached page images and the actual renderer excerpts to choose a different layout change. Return a comment if no safe repair is available.\n'+prompt,images:visuals.images});
      const groupIds=new Set(group.map(f=>f.id)),seen=new Set();
      for(const row of result?.corrections??[])if(groupIds.has(row.id)&&!seen.has(row.id)){seen.add(row.id);retryCorrections.push(row);}
      for(const row of result?.comments??[])if(groupIds.has(row.findingId)&&!seen.has(row.findingId)){seen.add(row.findingId);comments.set(row.findingId,String(row.why??'No safe retry repair.'));}
     }catch(error){call.error=error.message;for(const f of group)comments.set(f.id,'Retry repair failed: '+error.message);}
    });
    retryCorrections.sort((a,b)=>current.findIndex(f=>f.id===a.id)-current.findIndex(f=>f.id===b.id));
    const retrial=trialApply({blocks:blockList(snapshot,touchedIds),settings:snapshot.settings,corrections:retryCorrections,applyCorrections,preflight});
    for(const row of retrial.comments)comments.set(row.findingId,row.why);
    if(retrial.accepted.length){
     const retryFile=path.join(runDir,'retry-corrections-'+now().replace(/[:.]/g,'-')+'.json');
     fs.writeFileSync(retryFile,JSON.stringify({project:project.id,corrections:retrial.accepted},null,1)+'\n');
     await saveRepair(applyRepair,{runDir,projectFile,correctionsFile:retryFile,root});
     accepted.push(...retrial.accepted);
    }
    for(const row of unfixed)if(!accepted.some(item=>item.id===row.id)){outcome.reverted.push(row.id);comments.set(row.id,'Reverted after verification: '+initialVerdicts.get(row.id).note+'. Retry: '+(comments.get(row.id)??'No valid replacement patch.'));}
   }
   // Recheck retained repairs too: another repair may share their page or block.
   if(accepted.length)verdicts=await verifyOnce(read(handle.file),accepted);
   else verdicts={automated:verdicts.automated,findings:[]};
  }
  if(verdicts.error)outcome.errors.push('Verification failed: '+verdicts.error);
  const verdict=new Map((verdicts.findings??[]).map(row=>[row.id,row]));
  // No verdict, an unfixed defect or a regression all revert: nothing unverified stays.
  const bad=accepted.filter(row=>{const v=verdict.get(row.id);return !v||v.fixed!==true||v.regressed===true;});
  for(const row of bad)comments.set(row.id,'Reverted after verification: '+(verdict.get(row.id)?.note||'no verdict returned')+'.');
  if(bad.length){
   await undoRows(bad);
   for(const row of bad)outcome.reverted.push(row.id);
  }
  for(const row of accepted)if(!bad.includes(row)){outcome.applied.push(row.id);Object.assign(byId.get(row.id),{applyOutcome:'repaired',applyReason:row.reason});}
  outcome.automated=verdicts.automated;outcome.verifyNotes=[...new Map(outcome.verificationAttempts.flatMap(attempt=>attempt.findings).map(row=>[row.id,row])).values()].map(row=>({id:row.id,fixed:row.fixed,regressed:row.regressed,...(row.unverified?{unverified:true}:{}),note:row.note}));
 }
 if(recovery.size)for(const finding of current)if(!outcome.applied.includes(finding.id)&&!outcome.reverted.includes(finding.id))outcome.reverted.push(finding.id);
 // Resolved comments for what changed; open comments are left to `post` for what did not.
 const handle2=await openProject(projectFile,root),final=handle2.project,finalIndex=bookletIndex(final);
 const {createFeedback}=await import('../src/lib/booklet-feedback.js');
 const flags=[...(final.studio?.flags??[])];
 for(const id of outcome.applied){
  const finding=byId.get(id),note=commentNote(finding),anchor=target=>createFeedback(final,{rootId:target,edition:finding.edition},note,finding.scope);
  let comment;try{comment=anchor(finding.targets[0].id);}catch{comment=anchor(finding.targets[0].blockId);}
  const existing=flags.findIndex(flag=>flag.kind==='first-pass'&&flag.findingId===id);
  const flag={...(existing>=0?flags[existing]:comment),kind:'first-pass',findingId:id,area:finding.area,resolved:true,resolvedAt:now(),resolution:'Applied by the repair worker: '+(finding.applyReason||'layout change')+'. Verified on the rendered pages.'};
  if(existing>=0)flags[existing]=flag;else flags.push(flag);
  Object.assign(finding,{commentId:flag.id,postedAt:flag.at,postedNote:note});setState(finding,'repaired','Applied and verified (first-pass apply).');
 }
 if(outcome.applied.length){final.studio={version:1,...final.studio,flags};await handle2.save();const saved=read(handle2.file);const lost=outcome.applied.filter(id=>!(saved.studio?.flags??[]).some(flag=>flag.findingId===id));if(lost.length)outcome.errors.push('Saved project is missing resolved comments for '+lost.join(', '));record.postedRevision=saved.revision??null;}
 for(const finding of current){
  if(outcome.applied.includes(finding.id))continue;
  finding.applyOutcome=outcome.reverted.includes(finding.id)?'reverted':'comment';finding.applyNote=comments.get(finding.id)??'Not applied.';
  if(finding.applyOutcome==='comment')outcome.comment.push(finding.id);
 }
 // Retarget the hashes of findings that stay pending: the block moved under them only when repaired.
 for(const finding of record.findings??[])if(finding.applyOutcome==='comment'||finding.applyOutcome==='reverted')finding.targets=finding.targets.map(target=>({...target,hash:blockHash(final,finalIndex,target.blockId)??target.hash}));
 record.apply={at:now(),applied:outcome.applied,reverted:outcome.reverted,comment:outcome.comment,left:outcome.left,stale:outcome.stale,retries:outcome.retries,verificationAttempts:outcome.verificationAttempts};
 if(recovery.size&&previousApply){
  record.applyHistory=[...(record.applyHistory??[]),previousApply];
  const attempted=new Set(current.map(f=>f.id));
  for(const key of ['applied','reverted','comment','left','stale'])record.apply[key]=[...new Set([...(previousApply[key]??[]).filter(id=>!attempted.has(id)),...record.apply[key]])];
  record.apply.retries=[...(previousApply.retries??[]),...outcome.retries];
  record.apply.verificationAttempts=[...(previousApply.verificationAttempts??[]),...outcome.verificationAttempts];
 }
 saveProvenance(file,record);
 outcome.commentFindingIds=[...outcome.comment,...outcome.reverted];outcome.revision=final.revision??null;
 return outcome;
}

// ---- command line --------------------------------------------------------------------------------

export async function main(args=process.argv.slice(2)){
 const values={};
 for(let i=0;i<args.length;i++){
  if(!['--project','--run-dir','--provenance-dir','--base','--concurrency','--queue','--findings'].includes(args[i])||args[i+1]===undefined)throw Error('Invalid option '+args[i]);
  values[args[i]]=args[++i];
 }
 if(!values['--project'])throw Error('Name a booklet with --project ID');
 const projectFile=path.join(ROOT,'booklets','projects',values['--project']+'.json'),provenanceDir=values['--provenance-dir']&&path.resolve(values['--provenance-dir']);
 // --queue a,b reruns the findings `review.mjs status --queues` put in those queues; --findings names them.
 let findingIds=values['--findings']?.split(',').map(id=>id.trim()).filter(Boolean)??null;
 const queues=values['--queue']?.split(',').map(name=>name.trim()).filter(Boolean);
 if(queues){
  if(queues.some(name=>!['a','b'].includes(name)))throw Error('Only queues a and b are applied; c stays with the teacher and d is confirmed with review.mjs confirm');
  const record=read(provenanceFile(values['--project'],{root:ROOT,provenanceDir}));
  const queued=(record.findings??[]).filter(finding=>finding.state==='pending'&&queues.includes(finding.queue?.name)).map(finding=>finding.id);
  findingIds=findingIds?findingIds.filter(id=>queued.includes(id)):queued;
  if(!findingIds.length){console.log(JSON.stringify({project:values['--project'],applied:[],note:'No pending finding in queue '+queues.join(',')+'. Run review.mjs status --queues first.'},null,1));return;}
 }
 const result=await runApply({projectFile,runDir:path.resolve(values['--run-dir']??path.join(ROOT,'.booklet-work','first-pass-review',values['--project'],'apply')),provenanceDir,base:values['--base']??BASE,concurrency:Number(values['--concurrency']??3),findingIds,queueLabel:queues?.join(',')??null,log:message=>console.error(message)});
 console.log(JSON.stringify(result,null,1));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
