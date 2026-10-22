// Comparable layout fields of a booklet project, and the text of its teaching
// blocks. Shared by benchmark.mjs and corpus.mjs. Pure given a project: no
// browser, no files. A field has a stable key, a group, an owning block and a
// value that is either a number (mm or a count) or a scalar.
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {blockRole} from '../src/lib/booklet-layout-actions.js';
import {isPractice} from '../src/lib/booklet-flow.js';
import {createHash} from 'node:crypto';
import {collect,allBlocks} from './history.mjs';

export const FIELD_GROUPS=Object.freeze(['spacing','answerSpace','layout','presentation','rowLayout','flow','role','section']);
// Ratings, derived numbers and pipeline bookkeeping are not layout the teacher sets (autoOrder: the optimiser's
// record of its own reorder, flow.autoOrder).
const NOISE=new Set(['autoOrder','localDifficulty','bankDifficulty','sectionId','displayNumber','exerciseNumber','answerMode','exerciseHeadingBefore','exerciseAnchorBefore','continuationSources','teachingLabel']);
const SKIPPED=new Set(['answer','source','sourceRefs','sourceAtom','sourceReview','sourceLayoutEvidence','originalDiagram','originalGraph','mathematicalModel','bankRef','classification','spec','answerEvidence']);

function flatten(value,prefix,out,depth=0,limit=8){
 if(value==null||depth>limit)return;
 if(Array.isArray(value)){value.forEach((child,i)=>flatten(child,`${prefix}[${child&&typeof child==='object'&&typeof child.id==='string'?child.id:i}]`,out,depth+1,limit));return;}
 if(typeof value==='object'){for(const key of Object.keys(value).sort())if(!NOISE.has(key))flatten(value[key],`${prefix}.${key}`,out,depth+1,limit);return;}
 if(typeof value==='number'&&Number.isFinite(value))out.set(prefix,{kind:'num',value});
 else if(typeof value==='boolean')out.set(prefix,{kind:'val',value});
 else if(typeof value==='string')out.set(prefix,{kind:'val',value:value.length>120?value.slice(0,120):value});
}

// Block id owning every node id in the project; settings keyed by a node id
// (diagram widths, answer spaces) are reported against that block.
export function ownerIndex(project){
 const owners=new Map();
 for(const block of allBlocks(project)){
  owners.set(block.id,block.id);
  const walk=node=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return;}
   if(typeof node.id==='string'&&!owners.has(node.id))owners.set(node.id,block.id);
   for(const [key,child] of Object.entries(node))if(!SKIPPED.has(key)&&child&&typeof child==='object')walk(child);};
  walk(block.content);walk(block.examples);walk(block.code);
 }
 return owners;
}

// Key -> {key, group, blockId, kind, value}.
export function layoutFields(project){
 const p=normalizeEditableProject(project),fields=new Map(),owners=ownerIndex(p),o=p.settings?.layoutOverrides??{};
 const put=(group,key,blockId,entry)=>fields.set(key,{key,group,blockId,...entry});
 for(const [key,x] of collect(project))put('spacing','spacing/'+key,x.blockId,{kind:'num',value:x.value});
 for(const section of p.sections??[]){
  const first=section.blocks?.[0]?.id;if(!first)continue;
  if(typeof section.pageBreakBefore==='boolean')put('section',`section/${first}/pageBreakBefore`,first,{kind:'val',value:section.pageBreakBefore});
 }
 for(const block of allBlocks(p)){
  put('role',`role/${block.id}`,block.id,{kind:'val',value:blockRole(block)+'|'+(block.pedagogyRole??'')});
  const local=new Map();
  // Top-level presentation settings only (layout, columns, numberSteps ...); the
  // nested layout overrides are compared as arrangements below.
  flatten(block.presentation,`presentation/${block.id}`,local,0,1);
  for(const [k,v] of local)put('presentation',k,block.id,v);
  const flow=new Map();flatten(block.flow,`flow/${block.id}`,flow);
  for(const [k,v] of flow)put('flow',k,block.id,v);
  for(const example of block.examples??[]){
   const row=new Map();flatten(example.rowLayout,`rowLayout/${block.id}/${example.id??'example'}`,row);
   for(const [k,v] of row)put('rowLayout',k,block.id,v);
  }
  // Answer space is the override when set, otherwise the authored value.
  const visit=node=>{if(!node||typeof node!=='object')return;
   if(node.id&&(Number.isFinite(o.answerSpaces?.[node.id])||Number.isFinite(node.answerSpaceMm)))put('answerSpace',`answerSpace/${block.id}/${node.id}`,block.id,{kind:'num',value:o.answerSpaces?.[node.id]??node.answerSpaceMm});
   for(const child of node.children??[])visit(child);};
  visit(block.content);
 }
 // Overrides keyed by an id the content walk did not reach.
 for(const [id,value] of Object.entries(o.answerSpaces??{}))if(!fields.has(`answerSpace/${owners.get(id)}/${id}`)&&Number.isFinite(value))put('answerSpace',`answerSpace/${owners.get(id)??'unowned'}/${id}`,owners.get(id)??null,{kind:'num',value});
 for(const [id,value] of Object.entries(o.blockLayouts??{})){
  const out=new Map(),owner=owners.get(id)??id;flatten(value,`layout/${owner}/${id}`,out);
  for(const [k,v] of out)put('layout',k,owners.get(id)??null,v);
 }
 return fields;
}

// Content of a block as authored, apart from layout: used to tell whether a fix
// edited the block's content and whether another copy equals the fixed block.
export const blockHash=block=>block?createHash('sha1').update(JSON.stringify([block.type,block.content,block.examples,block.code])).digest('hex').slice(0,12):null;

export const MM_TOLERANCE=0.5;
const same=(a,b,tol)=>a.kind==='num'&&b.kind==='num'?Math.abs(a.value-b.value)<=tol:a.value===b.value;

// Fields whose value differs between two projects (optionally for named blocks).
export function diffFields(before,after,{blockIds=null,tolerance=0.05}={}){
 const a=layoutFields(before),b=layoutFields(after),wanted=blockIds&&new Set(blockIds),rows=[];
 for(const key of new Set([...a.keys(),...b.keys()])){
  const x=a.get(key),y=b.get(key),blockId=(y??x).blockId;
  if(wanted&&!wanted.has(blockId))continue;
  if(x&&y&&same(x,y,tolerance))continue;
  rows.push({key,group:(y??x).group,blockId,kind:(y??x).kind,before:x?.value??null,after:y?.value??null});
 }
 return rows;
}

// How closely an arm agrees with the teacher's version. Numeric fields agree
// within `tolerance` mm; MAE is over numeric fields present in both.
export function compareFields(arm,teacher,{tolerance=MM_TOLERANCE}={}){
 const a=layoutFields(arm),b=layoutFields(teacher),groups={},blank=()=>({total:0,both:0,agree:0,onlyArm:0,onlyTeacher:0,numeric:0,absError:0});
 const all=blank(),core=blank();
 for(const key of new Set([...a.keys(),...b.keys()])){
  const x=a.get(key),y=b.get(key),group=(y??x).group;
  const g=groups[group]??=blank();
  // The headline excludes block arrangement trees, which are compared on their own.
  for(const t of group==='layout'?[g,all]:[g,all,core]){
   t.total++;
   if(x&&y){t.both++;if(same(x,y,tolerance))t.agree++;if(x.kind==='num'&&y.kind==='num'){t.numeric++;t.absError+=Math.abs(x.value-y.value);}}
   else if(x)t.onlyArm++;else t.onlyTeacher++;
  }
 }
 const finish=t=>({...t,absError:undefined,agreePct:t.total?Math.round(1000*t.agree/t.total)/10:null,mae:t.numeric?Math.round(100*t.absError/t.numeric)/100:null});
 return {tolerance,headline:finish(core),overall:finish(all),groups:Object.fromEntries(Object.entries(groups).map(([k,t])=>[k,finish(t)]))};
}

// ---------------------------------------------------------------- teaching text
const TEXT_KEYS=new Set(['text','latex','prompt','content','markdown','title','caption','short','worked']);
export function blockText(block){
 const parts=[];
 const walk=(node,key)=>{
  if(node==null)return;
  if(typeof node==='string'){if(TEXT_KEYS.has(key)&&node.trim())parts.push(node);return;}
  if(typeof node!=='object')return;
  if(Array.isArray(node)){node.forEach(n=>walk(n,key));return;}
  for(const [k,v] of Object.entries(node))if(!SKIPPED.has(k)&&k!=='id'&&k!=='label')walk(v,k);
 };
 walk({content:block.content,examples:block.examples,code:undefined},'');
 return parts.join(' ');
}
export const tokens=text=>text.toLowerCase().replace(/\\(?:text|mathrm|textbf)\b/g,' ').split(/[\s,;:{}$]+/u).filter(Boolean);
export function tokenDiff(a,b){
 const count=list=>list.reduce((m,t)=>m.set(t,(m.get(t)??0)+1),new Map());
 const x=count(a),y=count(b);let added=0,removed=0;
 for(const t of new Set([...x.keys(),...y.keys()])){const d=(y.get(t)??0)-(x.get(t)??0);if(d>0)added+=d;else removed-=d;}
 return {added,removed};
}
// Token drift of teaching blocks, arm against teacher, matched by block id.
export function theoryDrift(arm,teacher){
 const teach=p=>new Map(allBlocks(p).filter(b=>!isPractice(b)).map(b=>[b.id,tokens(blockText(b))]));
 const a=teach(arm),b=teach(teacher),blocks=[];let added=0,removed=0,base=0;
 for(const [id,tb] of b){
  const ta=a.get(id);base+=tb.length;
  if(!ta){removed+=tb.length;blocks.push({blockId:id,status:'missing-in-arm',tokens:tb.length});continue;}
  const d=tokenDiff(ta,tb);added+=d.added;removed+=d.removed;
  if(d.added||d.removed)blocks.push({blockId:id,status:'changed',added:d.added,removed:d.removed,tokens:tb.length});
 }
 const extra=[...a.keys()].filter(id=>!b.has(id));
 for(const id of extra){added+=a.get(id).length;blocks.push({blockId:id,status:'only-in-arm',tokens:a.get(id).length});}
 return {teacherTokens:base,added,removed,driftPct:base?Math.round(1000*(added+removed)/base)/10:0,blocksChanged:blocks.length,blocks:blocks.sort((p,q)=>((q.added??q.tokens)+(q.removed??0))-((p.added??p.tokens)+(p.removed??0))).slice(0,25)};
}
