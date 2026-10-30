// Pure Node authoring only: never loaded by a renderer or on project load.
// This binds/relabels explicit question references, not implicit teaching groups.
// Full source-exercise dependency review and independent rating/SDK publication
// gates remain caller-owned. Ambiguity holds; no assessment is manufactured.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {DIAGRAM_COLOUR_PREFIX} from '../src/lib/diagram-colours.js';
import {flowNumbers,isPractice} from '../src/lib/booklet-flow.js';
import {reasoningTaskHash,verifiedRating} from '../scripts/booklet/reasoning-ratings.mjs';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const same=(a,b)=>assert.deepEqual(a,b);
const get=(x,p)=>p.reduce((v,k)=>v[k],x);
const set=(x,p,v)=>{const parent=get(x,p.slice(0,-1));parent[p.at(-1)]=v;};
const OMIT=new Set(['id','source','sourceRefs','sourceReview','sourceAtom','sourceLayoutEvidence','classification','flow','bankRef','provenance','spec','originalDiagram','originalGraph','presentation','studio']);
const TEXT=new Set(['content','prompt','text','latex','html','short','worked','title','caption','explanation','solution','theorySolution','instructions']);
const ROOTS=new Set(['content','prompt','answer','examples','theorySolution','explanation','instructions']);
const MATH_TOKEN_REFERENCE=/\b(?:questions?|Q)\s*(?:\$\$?|\\\()\s*\d+/gi;
// Exact nonprinting whole-line marker emitted by applyDiagramColourPolicy.
const GENERATED_COLOUR_METADATA=/^\s*\\special\{dvisvgm:raw <metadata data-diagram-colours="1" data-diagram-kind="(?:geometry|graph)" data-diagram-base="[^"<>\r\n]*" data-diagram-semantic-palette="[^"<>\r\n]*" data-diagram-semantic-reference="[^"<>\r\n]*" data-diagram-semantic-reasons="[^"<>\r\n]*"\/>\}\s*$/;
const GENERATED_SOURCE_METADATA=/^\s*\\special\{dvisvgm:raw <metadata data-graph-strokes="1"(?: data-graph-source-palette="[^"<>\r\n]*")? data-graph-source-reference="[^"<>\r\n]*"\/>\}\s*$/;
const NUMBERED=/\b(?:Question|Q)\s*\.?\s*(\d{1,3})\b/gi;
const AMBIGUOUS_NUMBERED=/\b(?:Questions?|Q)\s*\.?\s*\d{1,3}(?:\s*(?:[–—-]|,\s*(?:(?:and|or)\s*)?|and\s*|or\s*|&\s*)\d|\.\d|\s+(?:on|from|of)\s+page\s*\d)/gi;
const UNSUPPORTED=/\b(?:questions\s*\d|exercises?\s*\d|examples?\s*\d)|\b(?:previous|preceding|next|following|earlier)\s+(?:question|exercise|example)|\b(?:result|answer|method|graph|table|diagram|figure)\s+(?:as\s+)?(?:above|below)|\bas above\b/gi;
const inDollarMath=(text,position)=>{let delimiter=null;for(let i=0;i<position;i++){if(text[i]!=='$'||i&&text[i-1]==='\\')continue;const d=text[i+1]==='$'?'$$':'$';if(delimiter===d)delimiter=null;else if(!delimiter)delimiter=d;i+=d.length-1;}return delimiter!==null;};

const hasNumericMathReference=text=>[...text.matchAll(MATH_TOKEN_REFERENCE)].some(m=>!inDollarMath(text,m.index));

// Known printable roots only; provenance/IDs/diagram code are never rewritten.
// Compose native inline runs so `Question ` + `11` resolves across text nodes.
// Inline TikZ is printed through the native text renderer. Mask only its exact
// known nonprinting colour JSON line; retain length/newlines for rewrite offsets.
function inlineTikzReferenceText(text){
 const tokens=[...text.matchAll(/\[(\/?tikz)\]/g)];
 if(!tokens.length||tokens.length%2||tokens.some((m,i)=>m[1]!==((i%2)?'/tikz':'tikz')))return text;
 return text.replace(/\[tikz\]([\s\S]*?)\[\/tikz\]/g,(span,code)=>span.replace(/^% mathsmap-diagram-colours ([^\r\n]*)/gm,(line,json)=>{
  try{const v=JSON.parse(json);if(v?.version!==1||!['graph','geometry'].includes(v.kind)||!Array.isArray(v.base)||!Array.isArray(v.semantic)||typeof v.reference!=='string')return line;}catch{return line;}
  return ' '.repeat(line.length);
 }));
}
function scanField(field){
 field.text=inlineTikzReferenceText(field.text);
 if([...field.text.matchAll(/\[tikz\][\s\S]*?(?:\[\/tikz\]|$)/g)].some(m=>/\b(?:Question|Q)\s*\.?\s*\d|\bas above\b/i.test(m[0])))field.unsupportedCode=true;
 return field;
}
export function printedReferenceFields(block){
 const fields=[];
 const visit=(v,path,key,parent)=>{
  if(typeof v==='string'){
   if(TEXT.has(key))fields.push(scanField({key:JSON.stringify(path),text:v,parts:[{path,start:0,end:v.length}]}));
   return;
  }
  if(!v||typeof v!=='object')return;
  if(Array.isArray(v)){v.forEach((x,i)=>visit(x,[...path,i],key,v));return;}
  if(Array.isArray(v.inlines)){
   let text='',parts=[];
   for(let i=0;i<v.inlines.length;i++){
    const n=v.inlines[i],k=typeof n.text==='string'?'text':typeof n.latex==='string'?'latex':null;
    if(!k){text+=' ';continue;}
    const start=text.length;text+=n[k];parts.push({path:[...path,'inlines',i,k],start,end:text.length});
   }
   if(parts.length)fields.push(scanField({key:JSON.stringify([...path,'inlines']),text,parts}));
  }
  for(const[k,x]of Object.entries(v)){
   if(OMIT.has(k)||k==='inlines')continue;
   if(k==='code'){
    const printedCode=typeof x==='string'?x.split('\n').filter(line=>!line.startsWith(DIAGRAM_COLOUR_PREFIX)&&!GENERATED_COLOUR_METADATA.test(line)&&!GENERATED_SOURCE_METADATA.test(line)).join('\n'):x;
    if(typeof printedCode==='string'&&/\b(?:Question|Q)\s*\.?\s*\d|\bas above\b/i.test(printedCode))fields.push({key:JSON.stringify([...path,k]),text:x,parts:[],unsupportedCode:true});
    continue;
   }
   visit(x,[...path,k],k,v);
  }
 };
 for(const[k,v]of Object.entries(block))if(ROOTS.has(k))visit(v,[k],k,block);
 // Match booklet-preview's visible subtitle selection; sourceText is included
 // only for the investigation fallback that is actually printed. Never scan IDs.
 const atom=block.sourceAtom;
 if(atom){
  const key=atom.visibleSubtitle!=null?'visibleSubtitle':!['review','guided-practice','definition','key-ideas'].includes(atom.kind)?(atom.kind==='investigation'?(atom.description?'description':'sourceText'):'description'):null;
  if(key&&atom[key]!=null){const value=atom[key];if(typeof value==='string')fields.push({key:JSON.stringify(['sourceAtom',key]),text:value,parts:[],unsupportedVisibleAtom:true});else {const start=fields.length;visit(value,['sourceAtom',key],'content',atom);for(const field of fields.slice(start))field.unsupportedVisibleAtom=true;}}
 }
 return fields;
}
// A terminal introduction to actual native parts refers to this owner's asks.
// Only its own span is ignored for scanning; all other prose/digit offsets stay.
function referenceScanText(block,field,fields){
 const nativeQuestions=children=>Array.isArray(children)&&children.some(child=>['question','part'].includes(child?.type)||child?.type==='group'&&nativeQuestions(child.children));
 const isPrompt=row=>{const path=JSON.parse(row.key);return path[0]==='content'&&path[1]==='prompt';};
 if(!isPrompt(field)||!nativeQuestions(block.content?.children)||fields.filter(isPrompt).at(-1)?.key!==field.key)return field.text;
 const intro=[...field.text.matchAll(/\banswer\s+the\s+following\s+questions\b/gi)].at(-1);
 if(!intro)return field.text;
 const tail=field.text.slice(intro.index+intro[0].length);
 if(!/^\s*[.:]?\s*$/.test(tail)&&!/^\s+(?:for|using|to|correct\s+to)\b/i.test(tail))return field.text;
 return field.text.slice(0,intro.index)+field.text.slice(intro.index+intro[0].length);
}
// Direct callers without a pinned resolution remain held-safe for every known
// printed field, including shorthand Qn, native inline runs and answer prose.
export function unresolvedPrintedQuestionReferences(block){
 const fields=printedReferenceFields(block);
 return fields.filter(field=>{
  const text=referenceScanText(block,field,fields);
  return hasNumericMathReference(text)||/\b(?:questions?|Q|exercises?|examples?)\s*\.?\s*\d|\b(?:previous|preceding|next|following|earlier)\s+(?:question|exercise|example)|\b(?:result|answer|method|graph|table|diagram|figure)\s+(?:as\s+)?(?:above|below)|\bas above\b/i.test(text);
 }).map(field=>field.text);
}
function exerciseIndex(project){
 const numbers=flowNumbers(project),rows=[];
 for(const section of project.sections??[])for(const block of section.blocks??[])if(isPractice(block))rows.push({block,section,number:numbers[block.id]});
 return {numbers,rows};
}
export function resolveExerciseReferences(project){
 const {rows}=exerciseIndex(project),records=[],holds=[];
 // Unsupported teacher references can still address sortable practice targets.
 for(const section of project.sections??[])for(const block of section.blocks??[])if(!isPractice(block))for(const text of unresolvedPrintedQuestionReferences(block))holds.push({id:block.id,kind:'unsupported-nonpractice-printed-reference',text});
 for(const {block,section}of rows){
  const fields=printedReferenceFields(block);
  for(const field of fields){
   const fieldPath=JSON.parse(field.key),unsupported=referenceScanText(block,field,fields);
   if(field.unsupportedVisibleAtom&&unresolvedPrintedQuestionReferences(block).includes(field.text)){holds.push({id:block.id,kind:'unsupported-visible-atom-reference',field:field.key});continue;}
   if(field.unsupportedCode){holds.push({id:block.id,kind:'unsupported-native-code-reference',field:field.key});continue;}
   if(hasNumericMathReference(field.text)){holds.push({id:block.id,kind:'unsupported-math-token-reference',field:field.key});continue;}
   if((fieldPath.at(-1)==='html'||/<\/?[a-z][^>]*>/i.test(field.text))&&/\b(?:Questions?|Q)\s*\.?\s*\d/i.test(field.text)){holds.push({id:block.id,kind:'unsupported-html-reference',field:field.key});continue;}
   const ambiguous=[...field.text.matchAll(AMBIGUOUS_NUMBERED)];
   if(ambiguous.length){for(const m of ambiguous)holds.push({id:block.id,kind:'ambiguous-range-list-decimal-or-page-reference',field:field.key,quote:m[0]});continue;}
   for(const m of unsupported.matchAll(UNSUPPORTED))holds.push({id:block.id,kind:'unresolved-relative-or-cross-scope-reference',field:field.key,quote:m[0]});
   for(const m of field.text.matchAll(NUMBERED)){
    const prefixPart=field.parts.find(p=>m.index>=p.start&&m.index<p.end);
    if(prefixPart?.path.at(-1)==='latex'||inDollarMath(field.text,m.index)){holds.push({id:block.id,kind:'unsupported-math-reference',field:field.key,quote:m[0]});continue;}
    const n=Number(m[1]),targets=rows.filter(r=>r.section.topicId===section.topicId&&r.number===n);
    if(!section.topicId||targets.length!==1){holds.push({id:block.id,kind:targets.length?'ambiguous-numbered-reference':'dangling-numbered-reference',field:field.key,number:n});continue;}
    const target=targets[0];
    if(target.section.id!==section.id){holds.push({id:block.id,kind:'reference-outside-sort-section',targetId:target.block.id,field:field.key});continue;}
    const digitStart=m.index+m[0].lastIndexOf(m[1]),digitEnd=digitStart+m[1].length;
    const tokenParts=field.parts.filter(p=>p.start<digitEnd&&p.end>m.index);
    if(tokenParts.some(p=>p.path.at(-1)==='latex')){holds.push({id:block.id,kind:'mixed-native-inline-math-reference',field:field.key,quote:m[0]});continue;}
    const slices=field.parts.flatMap(p=>{const start=Math.max(digitStart,p.start),end=Math.min(digitEnd,p.end);return start<end?[{path:p.path,start:start-p.start,end:end-p.start}]:[];});
    if(slices.reduce((n,p)=>n+p.end-p.start,0)!==m[1].length){holds.push({id:block.id,kind:'unsupported-composed-reference',field:field.key});continue;}
    records.push({ownerId:block.id,targetId:target.block.id,sectionId:section.id,topicId:section.topicId,field:field.key,oldNumber:n,quote:m[0],slices});
   }
  }
 }
 if(records.length&&project.settings?.questionOrder!=='source')for(const id of new Set(records.map(r=>r.ownerId)))holds.push({id,kind:'before-source-counter-identity-unverified',requiredSetting:'questionOrder:source',reason:'Current counters may already reflect a legacy creation sort. Do not infer original targets or flip the flag merely to bypass this hold.'});
 const groups=[];
 for(const section of project.sections??[]){
  const ids=(section.blocks??[]).map(b=>b.id),parent=new Map(ids.map(id=>[id,id]));
  const root=id=>parent.get(id)===id?id:root(parent.get(id));
  for(const r of records.filter(r=>r.sectionId===section.id&&r.ownerId!==r.targetId))parent.set(root(r.ownerId),root(r.targetId));
  const sets=new Map();for(const id of ids){const key=root(id);sets.set(key,[...(sets.get(key)??[]),id]);}
  for(const members of sets.values())if(members.length>1){
   const by=new Map(section.blocks.map(b=>[b.id,b]));
   for(let i=0;i<members.length;i++){
    const b=by.get(members[i]);
    if(i<members.length-1&&b.flow?.keepWithNext===false)holds.push({id:b.id,kind:'reference-group-explicit-layout-conflict',field:'flow.keepWithNext',value:false});
    if(i>0&&(b.flow?.pageBreakBefore||b.flow?.exercisePageBreakBefore||b.pageBreakBefore||b.flow?.sourcePageBreakBefore&&b.flow?.pageBreakBefore!==false))holds.push({id:b.id,kind:'reference-group-explicit-layout-conflict',field:'page-break-before'});
    if(b.flow?.dependsOn!==undefined&&!Array.isArray(b.flow.dependsOn))holds.push({id:b.id,kind:'reference-group-unsupported-dependency-format'});
   }
   groups.push({ids:members,reason:'Resolved printed question references; original internal order retained',evidence:'exercise-reference-bindings-v1:'+hash(project)});
  }
 }
 return {kind:'exercise-reference-bindings-v1',projectId:project.id,revision:project.revision,sourceFingerprint:hash(project),records,groups,holds};
}
export function verifyExerciseReferenceResolution(project,resolution){same(resolveExerciseReferences(project),resolution);return true;}
export function renumberExerciseReferences(before,ordered,resolution){
 verifyExerciseReferenceResolution(before,resolution);assert.equal(resolution.holds.length,0,'Reference holds must be settled before applying');
 const old=new Map((before.sections??[]).flatMap(s=>s.blocks.map(b=>[b.id,b]))),candidate=structuredClone(ordered),now=new Map(candidate.sections.flatMap(s=>s.blocks.map(b=>[b.id,b])));
 // Input may differ only by whole-owner permutation within the same sections.
 const inverse=structuredClone(ordered);for(const section of inverse.sections){const original=before.sections.find(s=>s.id===section.id);assert(original);const by=new Map(section.blocks.map(b=>[b.id,b]));assert.equal(by.size,original.blocks.length);section.blocks=original.blocks.map(b=>{same(by.get(b.id),b);return by.get(b.id);});}same(inverse,before);
 for(const group of resolution.groups){const section=ordered.sections.find(s=>s.blocks.some(b=>b.id===group.ids[0])),positions=group.ids.map(id=>section.blocks.findIndex(b=>b.id===id));assert(positions.every((n,i)=>n===positions[0]+i),'Reference group separated or internal dependency order changed');}
 const numbers=flowNumbers(ordered),edits=[];
 for(const r of resolution.records){
  const n=numbers[r.targetId];assert(Number.isSafeInteger(n)&&n>0);if(n===r.oldNumber)continue;
  // A split inline token keeps every native node; first slice receives digits.
  r.slices.forEach((slice,i)=>edits.push({ownerId:r.ownerId,targetId:r.targetId,path:slice.path,start:slice.start,end:slice.end,before:get(old.get(r.ownerId),slice.path).slice(slice.start,slice.end),after:i===0?String(n):'',oldNumber:r.oldNumber,newNumber:n}));
 }
 const byField=new Map();for(const e of edits){const key=e.ownerId+'|'+JSON.stringify(e.path);byField.set(key,[...(byField.get(key)??[]),e]);}
 for(const changes of byField.values()){
  const first=changes[0],b=now.get(first.ownerId);let value=get(b,first.path);
  for(const e of changes.sort((a,b)=>b.start-a.start)){assert.equal(value.slice(e.start,e.end),e.before);value=value.slice(0,e.start)+e.after+value.slice(e.end);}
  set(b,first.path,value);
 }
 const metadataEdits=[];
 const flowField=(id,field,value)=>{const b=now.get(id),present=!!b.flow&&Object.hasOwn(b.flow,field),previous=b.flow?.[field];if(JSON.stringify(previous)===JSON.stringify(value))return;metadataEdits.push({ownerId:id,path:['flow',field],beforePresent:present,...(present?{before:structuredClone(previous)}:{}),after:structuredClone(value)});b.flow={...b.flow,[field]:value};};
 for(const group of resolution.groups)for(const id of group.ids.slice(0,-1))flowField(id,'keepWithNext',true);
 for(const r of resolution.records.filter(r=>r.ownerId!==r.targetId)){const b=now.get(r.ownerId);assert(b.flow?.dependsOn===undefined||Array.isArray(b.flow.dependsOn));const next=[...(b.flow?.dependsOn??[])];if(!next.includes(r.targetId)){next.push(r.targetId);flowField(r.ownerId,'dependsOn',next);}}
 const proof={kind:'stable-target-reference-number-only-v1',sourceFingerprint:hash(before),orderedFingerprint:hash(ordered),candidateFingerprint:hash(candidate),resolution,edits,metadataEdits,oldNewTaskHashes:[...new Set(edits.map(e=>e.ownerId))].map(id=>({id,oldTaskHash:reasoningTaskHash(old.get(id)),newTaskHash:reasoningTaskHash(now.get(id))})),noNewAssessment:true};
 return {candidate,proof};
}
export function verifyReferenceNumberAdaptation(before,ordered,candidate,proof){const replay=renumberExerciseReferences(before,ordered,proof.resolution);same(replay.candidate,candidate);same(replay.proof,proof);return true;}
// Explicit coordinator acceptance callback, never a serialized `verified` flag.
export function reuseReferenceNumberRating(original,rewritten,proof,{before,ordered,evidenceFile,evidenceSha256,confirmIndependentRating}={}){
 assert.equal(typeof confirmIndependentRating,'function');assert(verifiedRating(original));
 assert.equal(hash(fs.readFileSync(evidenceFile,'utf8')),evidenceSha256);same(JSON.parse(fs.readFileSync(evidenceFile,'utf8')),proof);
 const replay=renumberExerciseReferences(before,ordered,proof.resolution);same(replay.proof,proof);same(replay.candidate.sections.flatMap(s=>s.blocks).find(b=>b.id===rewritten.id),rewritten);
 const source=before.sections.flatMap(s=>s.blocks).find(b=>b.id===original.id);same(source,original);
 assert.equal(confirmIndependentRating({block:structuredClone(original),assessment:structuredClone(original.classification.assessment)}),true,'Independent original numeric verdict required');
 const result=structuredClone(original.classification),old=structuredClone(result.assessment);result.assessment.originalTaskHash??=old.taskHash;result.assessment.taskHash=reasoningTaskHash(rewritten);
 result.assessment.referenceNumberAdaptations=[...(old.referenceNumberAdaptations??[]),{kind:proof.kind,previousTaskHash:old.taskHash,currentTaskHash:result.assessment.taskHash,stableTargets:[...new Set(proof.edits.filter(e=>e.ownerId===original.id).map(e=>e.targetId))],originalAssessmentSha256:hash(old),proofFile:evidenceFile,proofSha256:evidenceSha256,assessmentReused:true,newAssessmentPerformed:false}];
 return result;
}
