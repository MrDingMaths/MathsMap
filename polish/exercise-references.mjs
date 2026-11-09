import {assertSharedResourceView} from '../src/lib/booklet-shared-resources.js';
// Pure Node authoring only: never loaded by a renderer or on project load.
// This binds/relabels explicit question references, not implicit teaching groups.
// Full source-exercise dependency review and independent rating/SDK publication
// gates remain caller-owned. Ambiguity holds; no assessment is manufactured.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {DIAGRAM_COLOUR_PREFIX} from '../src/lib/diagram-colours.js';
import {normalizeArrangement} from '../public/libs/maths-editor/arrangement-model.mjs';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {flowNumbers,isPractice} from '../src/lib/booklet-flow.js';
import {reasoningTaskHash,verifiedRating} from '../scripts/booklet/reasoning-ratings.mjs';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';
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
 return text.replace(/\[tikz\]([\s\S]*?)\[\/tikz\]/g,(span,code)=>'[tikz]'+code.replace(/^% mathsmap-diagram-colours ([^\r\n]*)/gm,(line,json)=>{
  try{const v=JSON.parse(json);if(v?.version!==1||!['graph','geometry'].includes(v.kind)||!Array.isArray(v.base)||!Array.isArray(v.semantic)||typeof v.reference!=='string')return line;}catch{return line;}
  return ' '.repeat(line.length);
 })+'[/tikz]');
}
// Only a complete native-maths sign deduction identifies Q1..Q4 as a
// quadrant. Match the same angle and both strict signs; never infer from prose.
function quadrantReferenceText(field){
 let text=field.text;
 for(const part of field.parts){
  if(part.path.at(-1)!=='latex')continue;
  const value=text.slice(part.start,part.end);
  const m=value.match(/^\s*\\sin\s*(\\(?:alpha|beta|theta|phi)|[a-zA-Z])\s*([<>])\s*0\s*,\s*\\quad\s*\\cos\s*\1\s*([<>])\s*0\s*,\s*\\quad\s*\\therefore\s*\\mathrm\{Q([1-4])\}\s*$/);
  if(!m)continue;
  const expected={'> >':'1','> <':'2','< <':'3','< >':'4'}[m[2]+' '+m[3]];
  if(m[4]!==expected)continue;
  const start=part.start+value.lastIndexOf('Q'+m[4]);
  text=text.slice(0,start)+'  '+text.slice(start+2);
 }
 return text;
}
function scanField(field){
 field.text=inlineTikzReferenceText(quadrantReferenceText(field));
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
// Match native project assembly: local overrides supplement project layouts.
const effectiveLayouts=(block,project)=>({...project?.settings?.layoutOverrides?.blockLayouts,...block.presentation?.layoutOverrides?.blockLayouts});
function belowInStack(root,intro,target){
 const paths=ref=>{const found=[];const visit=(n,path)=>{if(n.type==='item'&&n.ref===ref)found.push(path);(n.children??[]).forEach((c,i)=>visit(c,[...path,{node:n,index:i}]));};visit(root,[]);return found;};
 const a=paths(intro),b=paths(target);if(a.length!==1||b.length!==1)return false;
 let i=0;while(i<a[0].length&&i<b[0].length&&a[0][i].node===b[0][i].node&&a[0][i].index===b[0][i].index)i++;
 return !!a[0][i]&&!!b[0][i]&&a[0][i].node===b[0][i].node&&a[0][i].node.direction==='stack'&&a[0][i].index<b[0][i].index;
}
// A single inline figure later in the same printable prompt is an explicit local
// target. Never infer a target across fields, owners, malformed fences or figures.
function ownFollowingInlineDiagram(block,field,match){
 const path=JSON.parse(field.key),pi=path.lastIndexOf('prompt');
 if(path[0]!=='content'||pi<0||path.slice(0,pi).includes('answer'))return false;
 const node=get(block,path.slice(0,pi));
 if(!['question','part'].includes(node?.type)||/\beach\s+$/i.test(field.text.slice(0,match.index)))return false;
 const ownerFields=printedReferenceFields(block).filter(f=>{const p=JSON.parse(f.key);return p.slice(0,pi).every((v,i)=>v===path[i])&&!p.slice(pi).includes('answer');});
 if(ownerFields.reduce((n,f)=>n+[...f.text.matchAll(/\[(\/?tikz)\]/g)].length,0)!==2)return false;
 const promptFields=printedReferenceFields(block).filter(f=>{
  const p=JSON.parse(f.key);return p.length>=pi+1&&p.slice(0,pi+1).every((v,i)=>v===path[i]);
 });
 const tokens=promptFields.flatMap(f=>[...f.text.matchAll(/\[(\/?tikz)\]/g)].map(m=>({field:f.key,tag:m[1],index:m.index})));
 if(tokens.length!==2||tokens[0].tag!=='tikz'||tokens[1].tag!=='/tikz'||tokens.some(t=>t.field!==field.key)||tokens[0].index<=match.index+match[0].length)return false;
 // Other native figures in this owner would make the relative target ambiguous.
 const hasNative=v=>v&&typeof v==='object'&&(Array.isArray(v.questionDiagrams)&&v.questionDiagrams.length>0||Object.entries(v).some(([k,x])=>!OMIT.has(k)&&k!=='answer'&&typeof x==='object'&&(Array.isArray(x)?x.some(hasNative):hasNative(x))));
 return !hasNative(node);
}
function ownFollowingDiagram(block,field,project){
 const path=JSON.parse(field.key),pi=path.lastIndexOf('prompt');
 if(path[0]!=='content'||pi<0||path.slice(0,pi).includes('answer'))return false;
 const node=get(block,path.slice(0,pi));
 // Native question roots can be groups; nested groups are not posed owners.
 const posedNode=['question','part'].includes(node?.type)||(node===block.content&&node?.type==='group');
 if(!posedNode||node.questionDiagrams?.length!==1)return false;
 const diagram=node.questionDiagrams[0];if(!diagram?.id||diagram.role!=null&&!['question','content'].includes(diagram.role))return false;
 const layouts=effectiveLayouts(block,project),overrides={...project?.settings?.layoutOverrides,...block.presentation?.layoutOverrides,blockLayouts:layouts};
 try{
  const stored=layouts[block.id]?.arrangement;if(stored&&!normalizeArrangement(stored))return false;
  const resolved=resolveArrangement(block,stored,overrides);
  if(resolved.missing.length)return false;
  const paragraph=path[pi+1]==='blocks'?node.prompt?.blocks?.[path[pi+2]]:null;
  const intro=node.id+'/prompt'+(paragraph?'#'+paragraph.id:'');
  if(!belowInStack(resolved.tree.root,intro,diagram.id))return false;
  // A narrower saved arrangement must not hide or reverse the same pair.
  for(let i=1;i<=pi;i++){const ancestor=get(block,path.slice(0,i)),saved=layouts[ancestor?.id]?.arrangement;if(saved&&ancestor.id!==block.id&&!belowInStack(saved.root,intro,diagram.id))return false;}
  return resolved.entries.get(diagram.id)?.kind==='diagram';
 }catch{return false;}
}
// unique: the block has exactly one question figure, on the prompt's own node or in an unlabelled group under it.
// Otherwise (plural wording): two or more figures, all on the prompt's own node. Each must be visible below the
// prompt in the resolved arrangement and in any narrower saved one. Answer figures do not count.
function ownDescendantDiagramsBelow(block,field,project,{unique=true}={}){
 const path=JSON.parse(field.key),pi=path.lastIndexOf('prompt');
 if(path[0]!=='content'||pi<0||path.slice(0,pi).includes('answer'))return false;
 const node=get(block,path.slice(0,pi));if(!node||!(['question','part'].includes(node.type)||node===block.content))return false;
 const collect=(n,out)=>{for(const d of n?.questionDiagrams??[])out.push(d);for(const c of n?.children??[])collect(c,out);return out;};
 // Unlabelled groups directly under the prompt hold layout, not separate asks.
 const reach=(n,out)=>{for(const d of n?.questionDiagrams??[])out.push(d);for(const c of n?.children??[])if(c.type==='group'&&!c.label&&!c.prompt)reach(c,out);return out;};
 const all=collect(block.content,[]),mine=unique?reach(node,[]):[...(node.questionDiagrams??[])];
 if(unique?(all.length!==1||mine.length!==1):(mine.length<2||all.length!==mine.length))return false;
 if(mine.some(d=>!d?.id||(d.role!=null&&!['question','content'].includes(d.role))))return false;
 const layouts=effectiveLayouts(block,project),overrides={...project?.settings?.layoutOverrides,...block.presentation?.layoutOverrides,blockLayouts:layouts};
 try{
  const stored=layouts[block.id]?.arrangement;if(stored&&!normalizeArrangement(stored))return false;
  const resolved=resolveArrangement(block,stored,overrides);if(resolved.missing.length)return false;
  const paragraph=path[pi+1]==='blocks'?node.prompt?.blocks?.[path[pi+2]]:null,intro=node.id+'/prompt'+(paragraph?'#'+paragraph.id:'');
  if(mine.some(d=>resolved.entries.get(d.id)?.kind!=='diagram'||!belowInStack(resolved.tree.root,intro,d.id)))return false;
  for(let i=1;i<=pi;i++){const ancestor=get(block,path.slice(0,i)),saved=layouts[ancestor?.id]?.arrangement;if(saved&&ancestor.id!==block.id&&(!normalizeArrangement(saved)||mine.some(d=>!belowInStack(saved.root,intro,d.id))))return false;}
  return true;
 }catch{return false;}
}
// Exact collective stem: every direct part supplies its own question diagram.
// Do not infer an external figure, a descendant collection or omitted slots.
function ownChildDiagramsBelow(block,field,project){
 const path=JSON.parse(field.key),node=block.content,parts=node?.children;
 if(path[0]!=='content'||path[1]!=='prompt'||path.lastIndexOf('prompt')!==1||!['question','group'].includes(node?.type)||node.questionDiagrams?.length||!Array.isArray(parts)||parts.length<2)return false;
 if(parts.some(n=>n.type!=='part'||!n.id||n.children?.length||n.questionDiagrams?.length!==1))return false;
 const diagrams=parts.map(n=>n.questionDiagrams[0]),ids=diagrams.map(d=>d?.id);
 if(ids.some(id=>!id)||new Set(ids).size!==ids.length||new Set(parts.map(n=>n.id)).size!==parts.length||diagrams.some(d=>d.role!=null&&d.role!=='question'))return false;
 const layouts=effectiveLayouts(block,project),overrides={...project?.settings?.layoutOverrides,...block.presentation?.layoutOverrides,blockLayouts:layouts};
 try{
  const stored=layouts[block.id]?.arrangement;if(stored&&!normalizeArrangement(stored))return false;
  const resolved=resolveArrangement(block,stored,overrides);if(resolved.missing.length)return false;
  const paragraph=path[2]==='blocks'?node.prompt?.blocks?.[path[3]]:null,intro=node.id+'/prompt'+(paragraph?'#'+paragraph.id:'');
  const entries=[...resolved.entries.values()].filter(e=>e.kind==='diagram');
  if(entries.length!==ids.length||entries.some(e=>!ids.includes(e.ref)))return false;
  if(!ids.every(id=>belowInStack(resolved.tree.root,intro,id)))return false;
  // A root/content/prompt layout must preserve the entire collective relation.
  for(const ownerId of new Set([node.id,node.prompt?.id,paragraph?.id])){
   const saved=layouts[ownerId]?.arrangement;
   if(saved&&ownerId!==block.id&&(!normalizeArrangement(saved)||!ids.every(id=>belowInStack(saved.root,intro,id))))return false;
  }
  for(let i=0;i<parts.length;i++)for(const ownerId of [parts[i].id,ids[i]]){
   const saved=layouts[ownerId]?.arrangement;if(!saved)continue;
   const normalized=normalizeArrangement(saved);if(!normalized)return false;
   const refs=[];const visit=n=>{if(n.type==='item')refs.push(n.ref);for(const child of n.children??[])visit(child);};visit(normalized.root);
   if(refs.filter(ref=>ref===ids[i]).length!==1||refs.some(ref=>resolved.entries.get(ref)?.ownerId!==parts[i].id))return false;
  }
  return true;
 }catch{return false;}
}
// A child may refer back to its own ancestor's unique supplied graph. Ownership
// alone is insufficient: both slots must be visible in that vertical order.
function ownAncestorGraphAbove(block,field,project){
 const path=JSON.parse(field.key),pi=path.lastIndexOf('prompt');
 if(path[0]!=='content'||pi<0||path.slice(0,pi).includes('answer'))return false;
 const node=get(block,path.slice(0,pi));
 if(node===block.content||!['question','part'].includes(node?.type))return false;
 const ancestors=[];for(let i=1;i<pi;i++){const value=get(block,path.slice(0,i));if(['question','part'].includes(value?.type))ancestors.push(value);}
 const supplied=[];const visit=n=>{for(const d of n?.questionDiagrams??[])supplied.push({owner:n,diagram:d});for(const child of n?.children??[])visit(child);};visit(block.content);
 if(supplied.length!==1||!ancestors.includes(supplied[0].owner))return false;
 const diagram=supplied[0].diagram;if(!diagram.id||diagram.role!=null&&!['question','content'].includes(diagram.role))return false;
 const layouts=effectiveLayouts(block,project),overrides={...project?.settings?.layoutOverrides,...block.presentation?.layoutOverrides,blockLayouts:layouts};
 try{
  const stored=layouts[block.id]?.arrangement;if(stored&&!normalizeArrangement(stored))return false;
  const resolved=resolveArrangement(block,stored,overrides);if(resolved.missing.length)return false;
  const paragraph=path[pi+1]==='blocks'?node.prompt?.blocks?.[path[pi+2]]:null;
  const prompt=node.id+'/prompt'+(paragraph?'#'+paragraph.id:'');
  if(resolved.entries.get(diagram.id)?.kind!=='diagram'||!belowInStack(resolved.tree.root,diagram.id,prompt))return false;
  // Narrower saved arrangements cannot be assumed to preserve either slot.
  for(const owner of [...ancestors,node]){const saved=layouts[owner.id]?.arrangement;if(saved&&owner.id!==block.id&&(!normalizeArrangement(saved)||!belowInStack(saved.root,diagram.id,prompt)))return false;}
  return true;
 }catch{return false;}
}
// Resolve only a following native table in this exact student prompt document.
// Answer/provenance tables, sibling prompts and other owners cannot satisfy it.
function ownFollowingTable(block,field,project){
 const path=JSON.parse(field.key),pi=path.lastIndexOf('prompt');
 if(path[0]!=='content'||pi<0||path.slice(0,pi).includes('answer')||path[pi+1]!=='blocks'||!Number.isInteger(path[pi+2]))return false;
 const document=get(block,path.slice(0,pi+1)),index=path[pi+2],paragraph=document?.blocks?.[index];
 if(document?.format!=='maths-editor-document-v1'||paragraph?.type!=='paragraph')return false;
 const table=document.blocks.slice(index+1).find(n=>n.type==='table'&&Array.isArray(n.rows)&&n.rows.length&&n.rows.every(row=>Array.isArray(row)&&row.length&&row.every(cell=>cell&&Array.isArray(cell.blocks))));
 if(!table)return false;
 const node=get(block,path.slice(0,pi)),layouts=effectiveLayouts(block,project);
 // Any applicable saved ancestor/child/prompt layout must independently prove
 // visibility and order. A root default cannot overrule a narrower saved layout.
 const ids=new Set([block.id,node.id,document.id,paragraph.id,table.id]);
 for(let i=1;i<=pi;i++){const ancestor=get(block,path.slice(0,i));if(ancestor?.id)ids.add(ancestor.id);}
 const arrangements=[...ids].filter(id=>id&&layouts?.[id]?.arrangement!=null).map(id=>layouts[id].arrangement?.root);
 return arrangements.every(arrangement=>{
  if(!arrangement)return false;
  const refs=[];let stacked=true;
  const visit=n=>{if(n.type==='item')refs.push(n.ref);else{if(n.direction!=='stack')stacked=false;for(const child of n.children??[])visit(child);}};visit(arrangement);
  if(!stacked)return false;
  const whole=node.id+'/prompt',intro=node.id+'/prompt#'+paragraph.id,target=node.id+'/prompt#'+table.id;
  if(refs.filter(r=>r===whole).length===1&&!refs.includes(intro)&&!refs.includes(target))return true;
  return refs.filter(r=>r===intro).length===1&&refs.filter(r=>r===target).length===1&&refs.indexOf(intro)<refs.indexOf(target);
 }); // With no saved arrangement, native prompt blocks render in stored order.
}
// A terminal introduction to actual native parts refers to this owner's asks.
// Only its own span is ignored for scanning; all other prose/digit offsets stay.
function ownFollowingParts(block,field,project){
 const path=JSON.parse(field.key),pi=path.lastIndexOf('prompt'),node=block.content;
 const layouts=effectiveLayouts(block,project),overrides={...project?.settings?.layoutOverrides,...block.presentation?.layoutOverrides,blockLayouts:layouts};
 try{
  const stored=layouts[block.id]?.arrangement;if(stored&&!normalizeArrangement(stored))return false;
  const resolved=resolveArrangement(block,stored,overrides);if(resolved.missing.length)return false;
  const paragraph=path[pi+1]==='blocks'?node.prompt?.blocks?.[path[pi+2]]:null;
  const intro=node.id+'/prompt'+(paragraph?'#'+paragraph.id:'');
  const parts=[];const visit=n=>{for(const child of n.children??[]){if(['question','part'].includes(child.type))parts.push(child);visit(child);}};visit(node);
  if(!parts.length)return false;
  return parts.every(part=>{
   const refs=[...resolved.entries.values()].filter(e=>e.ownerId===part.id&&e.field==='prompt').map(e=>e.ref);
   const narrower=node.id!==block.id?layouts[node.id]?.arrangement:null;
   return refs.length&&refs.every(ref=>belowInStack(resolved.tree.root,intro,ref)&&(!narrower||belowInStack(narrower.root,intro,ref)));
  });
 }catch{return false;}
}
function checkedFixedTeachingReferences(project,artifacts,{checkImages=true}={}){
 assert(Array.isArray(artifacts));const seen=new Set();
 const pinned=a=>{assert(typeof a?.path==='string'&&/^[a-f0-9]{64}$/.test(a.sha256??''),'Missing pinned fixed-teaching evidence');const bytes=fs.readFileSync(a.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,'Fixed-teaching evidence changed');return JSON.parse(bytes);};
 return artifacts.map(artifact=>{
  const e=pinned(artifact);assert.equal(e.kind,'fixed-adjacent-teaching-table-visual-evidence-v1');assert.equal(e.projectId,project.id);assert(e.accepted===true&&typeof e.inspection==='string'&&e.inspection.trim(),'Missing accepted fixed-teaching inspection');
  const source=pinned(e.sourceArtifact),sections=project.sections.filter(s=>s.id===e.sectionId);assert.equal(source.id,project.id);assert.equal(sections.length,1);const section=sections[0],si=project.sections.indexOf(section),a=section.blocks.findIndex(b=>b.id===e.sourceId),b=section.blocks.findIndex(b=>b.id===e.targetId);
  assert(a>=0&&b===a+1,'Fixed-teaching pair not adjacent');const owner=section.blocks[a],target=section.blocks[b];
  for(const id of [owner.id,target.id])assert.equal(project.sections.flatMap(s=>s.blocks).filter(x=>x.id===id).length,1,'Ambiguous fixed-teaching owner');
  assert(section.phase==='teaching'&&!isPractice(owner)&&!isPractice(target),'Fixed reference must remain teaching');
  assert(owner.type==='rich-text'&&target.type==='diagram'&&target.format==='tikz'&&target.code?.trim(),'Unsupported fixed table types');
  assert(owner.sourceAtom?.id&&owner.sourceAtom.id===target.sourceAtom?.id&&owner.sourceAtom.id===e.sameSourceAtom&&owner.sourceAtom.kind==='investigation'&&target.sourceAtom.kind==='investigation','Foreign teaching atom');
  assert(owner.sourcePageNumber===target.sourcePageNumber&&owner.sourcePageNumber===e.sameSourcePage&&target.spec?.sourcePage===e.sameSourcePage,'Foreign table source page');
  assert(typeof target.spec?.mathematics==='string'&&target.spec.mathematics.trim()&&/spreadsheet/i.test(target.spec.description??'')&&/table|spreadsheet/i.test(target.spec.sourceRegion??''),'Untyped spreadsheet table');
  assert.equal(hash(owner),e.sourceOwnerSha256);assert.equal(hash(target),e.targetSha256);assert.equal(hash(target.code),e.targetCodeSha256);
  const prefix=p=>({sections:p.sections.slice(0,si+1),settings:p.settings});assert.equal(e.protectedPrefix?.throughSectionInclusive,si);assert.equal(hash(prefix(project)),e.protectedPrefix.sha256,'Fixed teaching prefix/settings changed');assert.equal(hash(prefix(source)),e.protectedPrefix.sha256,'Foreign source prefix');
  const fields=printedReferenceFields(owner),field=fields.find(f=>f.key===JSON.stringify(e.sourceField));assert(field&&field.text===e.quote&&fields.filter(f=>f.text===e.quote).length===1,'Unused or ambiguous fixed reference');
  const matches=[...field.text.matchAll(/\btable below\b/gi)];assert.equal(matches.length,1);assert.equal(e.quoteOccurrenceCount,1);const key=owner.id+'|'+field.key;assert(!seen.has(key),'Duplicate fixed reference');seen.add(key);
  const report=pinned(e.report),pages=report.editionsReport?.student?.pages??[],page=pages.find(p=>p.page===e.actualQuestionsPage),image=report.editionsReport?.student?.images?.find(i=>i.page===e.actualQuestionsPage);
  assert(report.projectId===project.id&&report.passed===true&&report.editions?.includes('student')&&report.passes?.some(p=>p.name==='candidate'&&p.projectHash===projectReviewHash(source))&&page&&image,'Missing actual source Questions page');same(page,e.actualPageMap);assert(page.blocks.filter(id=>id===owner.id).length===1&&page.blocks.filter(id=>id===target.id).length===1&&page.blocks.indexOf(target.id)>page.blocks.indexOf(owner.id),'Fixed teaching pair not on same ordered page');
  assert(image.path===e.image?.path&&image.hash===e.image?.sha256&&/^[a-f0-9]{64}$/.test(e.image.sha256),'Foreign fixed-teaching image');if(checkImages)assert.equal(createHash('sha256').update(fs.readFileSync(e.image.path)).digest('hex'),e.image.sha256,'Fixed-teaching image changed');
  return {kind:'resolved-fixed-teaching-table-reference',ownerId:owner.id,targetId:target.id,sectionId:section.id,field:field.key,start:matches[0].index,end:matches[0].index+matches[0][0].length,quote:matches[0][0],actualQuestionsPage:e.actualQuestionsPage,evidence:structuredClone(artifact)};
 });
}
function referenceScanText(block,field,fields,project,fixedTeachingBindings=[]){
 let text=ownFollowingTable(block,field,project)?field.text.replace(/\btable below\b/gi,m=>' '.repeat(m.length)):field.text;
 for(const binding of fixedTeachingBindings.filter(b=>b.ownerId===block.id&&b.field===field.key)){assert.equal(field.text.slice(binding.start,binding.end),binding.quote);text=text.slice(0,binding.start)+' '.repeat(binding.end-binding.start)+text.slice(binding.end);}
 text=text.replace(/\b(?:diagram|graph|figure) below\b/gi,(quote,index)=>ownFollowingInlineDiagram(block,field,{0:quote,index})?' '.repeat(quote.length):quote);
 if(/\bdiagram below\b/i.test(text)&&!/\beach diagram below\b/i.test(text)&&ownFollowingDiagram(block,field,project))text=text.replace(/\bdiagram below\b/gi,m=>' '.repeat(m.length));
 // "The diagram/graph/figure below" names the question's only figure when it sits on this prompt or in an unlabelled
 // group under it, below the prompt; "the diagrams below" names all of them when there are several on this prompt
 // (9 November 2026: Polynomials p31-q11 "graph below" on its own graph; p29-q8's graph sits in a group above parts
 // a and b; Area of Circles p34-q13 has two figures on its prompt). A figure on a lettered part, an inline figure in
 // the prompt, or "the other diagram" stays held, as before.
 if(!/\[\/?tikz\]/.test(field.text)){
  if(/\bthe (?:diagram|graph|figure) below\b/i.test(text)&&ownDescendantDiagramsBelow(block,field,project,{unique:true}))text=text.replace(/\bthe (?:diagram|graph|figure) below\b/gi,m=>' '.repeat(m.length));
  if(/\bthe (?:diagrams|graphs|figures) below\b/i.test(text)&&ownDescendantDiagramsBelow(block,field,project,{unique:false}))text=text.replace(/\bthe (?:diagrams|graphs|figures) below\b/gi,m=>' '.repeat(m.length));
 }
 // "for example 23832" is an example of a number, not a reference to Example 2 (Stage 4 Indices p95-q85).
 text=text.replace(/\bfor example,?\s+(?=\d)/gi,m=>' '.repeat(m.length));
 if([...text.matchAll(/\beach (?:diagram|graph) below\b/gi)].length===1&&ownChildDiagramsBelow(block,field,project))text=text.replace(/\beach (?:diagram|graph) below\b/gi,m=>' '.repeat(m.length));
 if(/\b(?:the same graph as above|the graph above)\b/i.test(text)&&ownAncestorGraphAbove(block,field,project))text=text.replace(/\b(?:the same graph as above|the graph above)\b/gi,m=>' '.repeat(m.length));
 const nativeQuestions=children=>Array.isArray(children)&&children.some(child=>['question','part'].includes(child?.type)||child?.type==='group'&&nativeQuestions(child.children));
 const isPrompt=row=>{const path=JSON.parse(row.key);return path[0]==='content'&&path[1]==='prompt';};
 if(!isPrompt(field)||!nativeQuestions(block.content?.children)||fields.filter(isPrompt).at(-1)?.key!==field.key||!ownFollowingParts(block,field,project))return text;
 const intro=[...text.matchAll(/\banswer\s+the\s+following\s+questions\b/gi)].at(-1);
 if(!intro)return text;
 const tail=text.slice(intro.index+intro[0].length);
 if(!/^\s*[.:]?\s*$/.test(tail)&&!/^\s+(?:for|using|to|correct\s+to)\b/i.test(tail)&&!/^\s*\.\s*Drawing a Venn diagram helps\.\s*$/.test(tail))return text;
 return text.slice(0,intro.index)+' '.repeat(intro[0].length)+text.slice(intro.index+intro[0].length);
}
// Direct callers without a pinned resolution remain held-safe for every known
// printed field, including shorthand Qn, native inline runs and answer prose.
function scannedPrintedQuestionReferences(block,project,{fixedTeachingBindings=[]}={}){
 const fields=printedReferenceFields(block);
 return fields.filter(field=>{
  const text=referenceScanText(block,field,fields,project,fixedTeachingBindings);
  return hasNumericMathReference(text)||/\b(?:questions?|Q|exercises?|examples?)\s*\.?\s*\d|\b(?:previous|preceding|next|following|earlier)\s+(?:question|exercise|example)|\b(?:result|answer|method|graph|table|diagram|figure)\s+(?:as\s+)?(?:above|below)|\bas above\b/i.test(text);
 }).map(field=>field.text);
}
export function unresolvedPrintedQuestionReferences(block,project){return scannedPrintedQuestionReferences(block,project);}
function exerciseIndex(project){
 const numbers=flowNumbers(project),rows=[];
 for(const section of project.sections??[])for(const block of section.blocks??[])if(isPractice(block))rows.push({block,section,number:numbers[block.id]});
 return {numbers,rows};
}
function exerciseReferenceResolution(project,{fixedTeachingReferences=[],checkImages=true}={}){
 const fixedTeachingBindings=checkedFixedTeachingReferences(project,fixedTeachingReferences,{checkImages});
 const {rows}=exerciseIndex(project),records=[],holds=[];
 // Unsupported teacher references can still address sortable practice targets.
 for(const section of project.sections??[])for(const block of section.blocks??[])if(!isPractice(block))for(const text of scannedPrintedQuestionReferences(block,project,{fixedTeachingBindings}))holds.push({id:block.id,kind:'unsupported-nonpractice-printed-reference',text});
 for(const {block,section}of rows){
  const fields=printedReferenceFields(block);
  for(const field of fields){
   const fieldPath=JSON.parse(field.key),unsupported=referenceScanText(block,field,fields,project);
   if(field.unsupportedVisibleAtom&&unresolvedPrintedQuestionReferences(block,project).includes(field.text)){holds.push({id:block.id,kind:'unsupported-visible-atom-reference',field:field.key});continue;}
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
 return {kind:'exercise-reference-bindings-v1',projectId:project.id,revision:project.revision,sourceFingerprint:hash(project),records,groups,holds,...(fixedTeachingReferences.length?{fixedTeachingReferences:structuredClone(fixedTeachingReferences),fixedTeachingBindings}: {})};
}
export function resolveExerciseReferences(project,{fixedTeachingReferences=[],resourceView=null}={}){assertSharedResourceView(project,resourceView);return exerciseReferenceResolution(project,{fixedTeachingReferences});}
export function verifyExerciseReferenceResolution(project,resolution){same(exerciseReferenceResolution(project,{fixedTeachingReferences:resolution.fixedTeachingReferences??[],checkImages:false}),resolution);return true;}
export function renumberExerciseReferences(before,ordered,resolution){
 verifyExerciseReferenceResolution(before,resolution);assert.equal(resolution.holds.length,0,'Reference holds must be settled before applying');
 checkedFixedTeachingReferences(ordered,resolution.fixedTeachingReferences??[],{checkImages:false});
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
// Explicit coordinator confirmation of the existing assessment, never a
// serialized flag or a demand for a second numeric review of unchanged maths.
// Keep the former capability name as a compatibility alias for retained runs.
export function reuseReferenceNumberRating(original,rewritten,proof,{before,ordered,evidenceFile,evidenceSha256,confirmExistingRating,confirmIndependentRating}={}){
 const confirm=confirmExistingRating===undefined?confirmIndependentRating:confirmExistingRating;
 assert.equal(typeof confirm,'function');assert(verifiedRating(original));
 assert.equal(hash(fs.readFileSync(evidenceFile,'utf8')),evidenceSha256);same(JSON.parse(fs.readFileSync(evidenceFile,'utf8')),proof);
 const replay=renumberExerciseReferences(before,ordered,proof.resolution);same(replay.proof,proof);same(replay.candidate.sections.flatMap(s=>s.blocks).find(b=>b.id===rewritten.id),rewritten);
 const source=before.sections.flatMap(s=>s.blocks).find(b=>b.id===original.id);same(source,original);
 assert.equal(confirm({block:structuredClone(original),assessment:structuredClone(original.classification.assessment)}),true,'Valid existing assessment confirmation required');
 const result=structuredClone(original.classification),old=structuredClone(result.assessment);result.assessment.originalTaskHash??=old.taskHash;result.assessment.taskHash=reasoningTaskHash(rewritten);
 result.assessment.referenceNumberAdaptations=[...(old.referenceNumberAdaptations??[]),{kind:proof.kind,previousTaskHash:old.taskHash,currentTaskHash:result.assessment.taskHash,stableTargets:[...new Set(proof.edits.filter(e=>e.ownerId===original.id).map(e=>e.targetId))],originalAssessmentSha256:hash(old),proofFile:evidenceFile,proofSha256:evidenceSha256,assessmentReused:true,newAssessmentPerformed:false}];
 return result;
}
