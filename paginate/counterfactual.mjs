#!/usr/bin/env node
// Diagnostic (22 October 2026): which category of the teacher's layout edits saved
// the pages? Each counterfactual starts from arm A (the import) and adopts only one
// category of the teacher version's values, for blocks present in both (matched by id).
//   node paginate/counterfactual.mjs build   --project rates-v1
//   node paginate/counterfactual.mjs measure --project rates-v1 [--only a,b]
//   node paginate/counterfactual.mjs report  --project rates-v1
// Categories: a answer spaces, b diagram sizes, c spacing, d flow and page breaks,
// e question order, f arrangements and columns, g teaching-block content and role.
// Output: .booklet-work/bench-20261022/<project>/counterfactual/
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT} from '../bench/history.mjs';

const WORK=path.join(ROOT,'.booklet-work','bench-20261022');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^﻿/,''));
const write=(f,v)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,1)+'\n');};
const clone=v=>structuredClone(v);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const CATEGORIES=Object.freeze({a:'answer spaces',b:'diagram sizes',c:'spacing',d:'flow and page breaks',e:'question order',f:'arrangements and columns',g:'teaching content and role'});

const SKIP=new Set(['answer','source','sourceRefs','sourceAtom','sourceReview','sourceLayoutEvidence','originalDiagram','originalGraph','mathematicalModel','bankRef','classification']);
const SPACING=['spaceBefore','spaceAfter','gap','padding','paddingTop','paddingRight','paddingBottom','paddingLeft','margin','marginBefore','marginAfter','lineHeight'];
const ARRANGE=['layout','columns','diagramPlacement','align','verticalAlign','indent','border','borderColour','widths','fontSize','display','ordered','tracks'];
const FLOW=['pageBreakBefore','sourcePageBreakBefore','keepTogether','keepWithNext','continueBefore','exercisePageBreakBefore'];
const DIAGRAM_TYPES=new Set(['diagram','tikz','image','figure','graph']);

// Every node with an id, anywhere inside a block (answers and source evidence excluded).
function nodesById(root){
 const found=new Map(),visit=(n,diagramSlot=false)=>{
  if(!n||typeof n!=='object')return;
  if(Array.isArray(n)){n.forEach(x=>visit(x,diagramSlot));return;}
  if(typeof n.id==='string'&&!found.has(n.id))found.set(n.id,{node:n,diagram:diagramSlot||DIAGRAM_TYPES.has(n.type)||!!n.code||!!n.spec});
  for(const [k,v] of Object.entries(n))if(!SKIP.has(k)&&v&&typeof v==='object')visit(v,k==='questionDiagrams'||k==='solutionDiagrams'&&false);
 };
 visit(root);return found;
}
function copyKey(a,t,key){
 if(key in t){if(!same(a[key],t[key]))a[key]=clone(t[key]);}
 else if(key in a)delete a[key];
}
// Per-node adopters: which keys of a matched node follow the teacher.
const nodeKeys={
 a:(node,info)=>['answerSpaceMm','minHeight',...(node.type==='table'?['rowHeights']:[])],
 b:(node,info)=>['widthMm',...(info.diagram?['width']:[])],
 c:()=>SPACING,
 d:()=>['keepTogether','keepWithNext'],
 f:(node,info)=>[...ARRANGE.filter(k=>k!=='widths'),...(node.type==='table'?['widths']:[]),...(!info.diagram&&node.type==='cloze'?['width']:[])],
};
function adoptNodes(arm,teacher,cat){
 const t=nodesById(teacher);
 for(const [id,info] of nodesById(arm)){
  const other=t.get(id);if(!other)continue;
  const a=info.node,b=other.node;
  for(const key of nodeKeys[cat](a,info)){
   if(key==='rowHeights'&&!(Array.isArray(a.rowHeights)&&Array.isArray(b.rowHeights)&&a.rowHeights.length===b.rowHeights.length)&&key in b)continue;
   if((key==='widths')&&Array.isArray(a.widths)&&Array.isArray(b.widths)&&a.widths.length!==b.widths.length)continue;
   copyKey(a,b,key);
  }
 }
}
// Arrangement trees: matched nodes take the teacher's value for the category's keys.
const TREE_KEYS={a:['height','minHeight'],b:['width'],c:['before','after','gap','inset'],d:['keepTogether']};
function walkTrees(a,t,fn){
 if(!a||!t)return;fn(a,t);
 const m=new Map((t.children??[]).map(c=>[c.id,c]));
 for(const c of a.children??[])walkTrees(c,m.get(c.id),fn);
}
function adoptTree(armTree,teacherTree,cat){
 walkTrees(armTree.root,teacherTree.root,(a,t)=>{for(const k of TREE_KEYS[cat])copyKey(a,t,k);});
}
// Structure from the teacher, every value the other categories own from the arm.
function adoptTreeStructure(armTree,teacherTree){
 const next=clone(teacherTree),armNodes=new Map(),collect=n=>{armNodes.set(n.id,n);n.children?.forEach(collect);};collect(armTree.root);
 const owned=Object.values(TREE_KEYS).flat();
 const visit=n=>{const a=armNodes.get(n.id);if(a)for(const k of owned)copyKey(n,a,k);n.children?.forEach(visit);};
 visit(next.root);return next;
}
const BLOCK_LAYOUT_KEYS={a:[],b:['diagramWidthMm','diagramSizing'],c:['insetMm','gapMm'],f:['textWidthMm']};

function adoptSettings(arm,teacher,cat,armIds){
 const lo=arm.settings.layoutOverrides??={},tl=teacher.settings.layoutOverrides??{};
 if(cat==='a')for(const [id,v] of Object.entries(tl.answerSpaces??{}))if(armIds.has(id)||true)lo.answerSpaces={...lo.answerSpaces,[id]:v};
 if(cat==='b')for(const [id,v] of Object.entries(tl.diagramWidths??{}))lo.diagramWidths={...lo.diagramWidths,[id]:v};
 for(const [id,layout] of Object.entries(tl.blockLayouts??{})){
  const mine=lo.blockLayouts?.[id];
  if(!mine&&!armIds.has(id))continue;
  const target=(lo.blockLayouts??={})[id]??={};
  for(const k of BLOCK_LAYOUT_KEYS[cat]??[])copyKey(target,layout,k);
  if(layout.arrangement&&target.arrangement){
   if(cat==='f')target.arrangement=adoptTreeStructure(target.arrangement,layout.arrangement);
   else if(TREE_KEYS[cat])adoptTree(target.arrangement,layout.arrangement,cat);
  }else if(layout.arrangement&&cat==='f'&&armIds.has(id))target.arrangement=clone(layout.arrangement);
 }
}

function adoptFlow(arm,teacher){
 const tb=new Map(teacher.sections.flatMap(s=>s.blocks).map(b=>[b.id,b])),ts=new Map(teacher.sections.map(s=>[s.id,s]));
 for(const s of arm.sections){
  const t=ts.get(s.id);if(t)copyKey(s,t,'pageBreakBefore');
  for(const b of s.blocks){const o=tb.get(b.id);if(!o)continue;b.flow??={};for(const k of FLOW)copyKey(b.flow,o.flow??{},k);}
 }
}
function adoptOrder(arm,teacher){
 const rank=new Map(teacher.sections.flatMap(s=>s.blocks).map((b,i)=>[b.id,i]));
 for(const s of arm.sections){
  const present=s.blocks.map((b,i)=>({b,i})).filter(x=>rank.has(x.b.id)),sorted=[...present].sort((x,y)=>rank.get(x.b.id)-rank.get(y.b.id));
  present.forEach((slot,k)=>{s.blocks[slot.i]=sorted[k].b;});
 }
}
const isTeaching=b=>b.type!=='question'||['theory','definition','key-ideas','worked-example','example','guided-practice'].includes(b.pedagogyRole)||!!b.sourceAtom;
function adoptTeaching(arm,teacher){
 const tb=new Map(teacher.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));
 for(const s of arm.sections)for(let i=0;i<s.blocks.length;i++){
  const b=s.blocks[i],o=tb.get(b.id);
  if(!o||!(isTeaching(b)||isTeaching(o)))continue;
  for(const k of ['type','content','examples','text','theorySolution','pedagogyRole','sourceAtom','code','spec'])copyKey(b,o,k);
 }
}

// Layout categories only (a-f): the teacher's layout without content edits.
export function counterfactual(arm,teacher,cats){
 const next=clone(arm),armIds=new Set(),collect=p=>p.sections.flatMap(s=>s.blocks);
 for(const b of collect(next))for(const id of nodesById(b).keys())armIds.add(id);
 const tb=new Map(collect(teacher).map(b=>[b.id,b]));
 // Order first, so later categories find blocks by id wherever they sit.
 if(cats.includes('e'))adoptOrder(next,teacher);
 // Arrangement structure before the values that sit on its nodes.
 const order=['f','a','b','c','d'].filter(c=>cats.includes(c));
 for(const cat of order){
  for(const block of collect(next)){const o=tb.get(block.id);if(!o)continue;if(nodeKeys[cat])adoptNodes(block,o,cat);}
  if(cat!=='d')adoptSettings(next,teacher,cat,armIds);else adoptSettings(next,teacher,'d',armIds);
  if(cat==='d')adoptFlow(next,teacher);
 }
 if(cats.includes('g'))adoptTeaching(next,teacher);
 return next;
}

export const PLAN=[['a'],['b'],['c'],['d'],['e'],['f'],['g'],['a','b','c','d','e','f']];
const nameOf=cats=>cats.length>1?'all-'+cats[0]+'-'+cats.at(-1):cats[0];

function build(id){
 const dir=path.join(WORK,id),arm=read(path.join(dir,'armA.json')),teacher=read(path.join(dir,'teacher.json')),out=path.join(dir,'counterfactual');
 const summary=[];
 for(const cats of PLAN){
  const next=counterfactual(arm,teacher,cats),file=path.join(out,nameOf(cats)+'.json');
  write(file,next);
  summary.push({name:nameOf(cats),categories:cats.map(c=>CATEGORIES[c]),changedFromArmA:!same(arm,next)});
 }
 write(path.join(out,'plan.json'),summary);console.log(JSON.stringify(summary));
}

async function measure(id,only){
 const {renderGeometry}=await import('../bench/render-geometry.mjs'),{paginationMetrics}=await import('../src/lib/booklet-pagination-metrics.js');
 const dir=path.join(WORK,id),out=path.join(dir,'counterfactual');
 for(const cats of PLAN){
  const name=nameOf(cats);if(only&&!only.includes(name))continue;
  const file=path.join(out,name+'.json'),project=read(file);
  const geometry=await renderGeometry(project,{editions:['student'],log:console.log});
  const metrics=paginationMetrics(project,geometry.editions);
  write(path.join(out,`geometry-${name}.json`),JSON.stringify(geometry));
  write(path.join(out,`metrics-${name}.json`),{name,metrics});
  console.log(name,metrics.student.pages,metrics.student.totals.trailingMm);
 }
}

// Pages per topic (teaching and practice) from a student geometry.
function topicPages(project,geometry){
 const topic=new Map(project.sections.flatMap(s=>s.blocks.map(b=>[b.id,s.topicId])));
 const pages={};
 for(const p of geometry.editions.student.pages){const t=topic.get(p.blocks[0])??(p.isCover?'(cover)':'(other)');pages[t]=(pages[t]??0)+1;}
 return pages;
}
function report(id){
 const dir=path.join(WORK,id),out=path.join(dir,'counterfactual'),arm=read(path.join(dir,'armA.json'));
 const baseGeo=read(path.join(dir,'geometry-A.json')),baseMetrics=read(path.join(dir,'metrics-A.json')).metrics.student;
 const teacherGeo=read(path.join(dir,'geometry-teacher.json')),teacherProject=read(path.join(dir,'teacher.json')),teacherMetrics=read(path.join(dir,'metrics-teacher.json')).metrics.student;
 const baseTopics=topicPages(arm,baseGeo),rows=[];
 const row=(name,project,geo,m)=>{const tp=topicPages(project,geo),gain=Object.fromEntries(Object.keys({...baseTopics,...tp}).map(t=>[t,(baseTopics[t]??0)-(tp[t]??0)]).filter(([,v])=>v!==0));return {name,pages:m.pages,pagesSaved:baseMetrics.pages-m.pages,trailingMm:m.totals.trailingMm,wastedPages:m.totals.wastedPages,exercisePages:m.totals.exercisePages,topicsSaved:Object.entries(gain).sort((a,b)=>b[1]-a[1]).map(([t,v])=>t+':'+v).join(' ')};};
 rows.push(row('armA',arm,baseGeo,baseMetrics));
 for(const cats of PLAN){const name=nameOf(cats),f=path.join(out,`metrics-${name}.json`);if(!fs.existsSync(f))continue;rows.push(row(name,read(path.join(out,name+'.json')),read(path.join(out,`geometry-${name}.json`)),read(f).metrics.student));}
 rows.push(row('teacher',teacherProject,teacherGeo,teacherMetrics));
 write(path.join(out,'report.json'),rows);
 for(const r of rows)console.log(`${r.name.padEnd(10)} pages ${r.pages}  saved ${r.pagesSaved}  trailing ${r.trailingMm}  wasted ${r.wastedPages}  | ${r.topicsSaved}`);
}

async function main(){
 const args=process.argv.slice(2),command=args[0],arg=(n,f)=>{const i=args.indexOf(n);return i<0?f:args[i+1];};
 const id=arg('--project','rates-v1');
 if(command==='build')return build(id);
 if(command==='measure')return measure(id,arg('--only')?.split(','));
 if(command==='report')return report(id);
 throw Error('Usage: node paginate/counterfactual.mjs build|measure|report --project ID');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
