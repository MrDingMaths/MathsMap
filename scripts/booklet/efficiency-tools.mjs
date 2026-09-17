// Read-only planning/context helpers. Existing review commands own all mutations.
import fs from 'node:fs';
import path from 'node:path';
import {contentNodes} from '../../src/lib/booklet-content-verification.js';
import {liveWorkflow,effectiveAuthor,effectiveInventory,representativePage,representativeKey,settlementKey,bytesHash} from './workflow-review.mjs';

export const REPRESENTATIVE_COVERAGE = [
 'fraction-step-spacing','equation-to-prose-spacing','venn-purposeful-shading','number-line-labels','editor-display',
 'native-notation-fractions-superscripts', 'dotted-handwriting-boxes',
 'equation-alignment-annotations', 'value-tables-and-borderless-arrangements',
 'teaching-groups-cards-speech-bubbles', 'dense-graphs-and-paired-figures',
 'student-and-answer-widths', 'pagination-after-edit-and-neighbours',
 'editor-resize-save-reopen', 'fresh-and-cached-print-parity',
 'ruler-based-physical-lengths', 'dense-category-labels',
 ...['frequency-table','pictogram-and-partial-symbol','column-and-stacked-bar','line','dot-plot','stem-and-leaf','sector','divided-bar','histogram-and-frequency-polygon','cumulative-frequency-and-ogive'].map(id=>'graph-family:'+id),
];

export function compactRepresentativePages(requirements){
 const pending=new Map(requirements.map(r=>[r.id,new Set(r.pages)])),selected=[];
 while(pending.size){
  const scores=new Map();for(const pages of pending.values())for(const p of pages)scores.set(p,(scores.get(p)??0)+1);
  const best=[...scores].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0];
  if(!best)throw Error('A representative requirement has no source candidate');
  selected.push(best[0]);for(const [id,pages]of pending)if(pages.has(best[0]))pending.delete(id);
 }
 return selected.sort((a,b)=>a-b);
}

// Coverage pages are alternatives only when explicitly marked candidatePages.
// Explicit pages/exceptionPages retain distinct source arrangements.
export function selectRepresentativeCases(plan){
 const requirements=[...plan.patterns.map(p=>({id:'pattern:'+p.id,pages:p.pages})),
  ...plan.coverage.filter(c=>c.status==='planned'&&c.candidatePages?.length).map(c=>({id:'coverage:'+c.id,pages:c.candidatePages}))];
 const pages=new Set(compactRepresentativePages(requirements));
 for(const c of plan.coverage.filter(c=>c.status==='planned'))for(const p of c.candidatePages?.length?c.exceptionPages??[]:c.pages??[])pages.add(p);
 const selected=[...pages].sort((a,b)=>a-b),copy=structuredClone(plan);
 for(const p of copy.patterns){const page=selected.find(page=>p.pages.includes(page));if(page!==p.representativePage){delete p.key;p.approved=false;}p.representativePage=page;p.inventoryKey=copy.inventoryKeys?.[page]??p.inventoryKey;}
 for(const c of copy.coverage)if(c.status==='planned'&&c.candidatePages?.length)c.pages=[...new Set([selected.find(p=>c.candidatePages.includes(p)),...(c.exceptionPages??[])])].sort((a,b)=>a-b);
 copy.representativePages=selected;return copy;
}

export function representativePlan(state,selectedPages){
 const selected=new Set(selectedPages),patterns=new Map();
 for(const [page,record] of Object.entries(state.pages)){
  if(!selected.has(Number(page)))continue;
  for(const pattern of record.patterns??[]){
   const row=patterns.get(pattern.id)??{id:pattern.id,description:pattern.description,pages:[]};
   row.pages.push(Number(page));patterns.set(pattern.id,row);
  }
 }
 const compact=state.pipelinePolicy?compactRepresentativePages([...patterns.values()]):null;
 const rows=[...patterns.values()].map(row=>{
  const page=state.verification?.representativePlan?.patterns?.find(p=>p.id===row.id)?.representativePage??(compact?compact.find(p=>row.pages.includes(p)):representativePage(state,row.id)),key=representativeKey(state,page),approval=state.representatives[row.id];
  return {...row,pages:row.pages.sort((a,b)=>a-b),representativePage:page,inventoryKey:state.pages[page]?.inventoryHash,key,approved:approval?.page===page&&approval?.key===key};
 });
 return {version:1,missingInventories:selectedPages.filter(p=>!state.pages[p]),patterns:rows,
  inventoryKeys:Object.fromEntries(selectedPages.map(p=>[p,state.pages[p]?.inventoryHash??null])),
  representativePages:[...new Set(rows.map(r=>r.representativePage))].sort((a,b)=>a-b),
  coverage:REPRESENTATIVE_COVERAGE.map(id=>({id,status:'needs-source-review',pages:[],notApplicableReason:null})),
  note:'Complete the source inventory, then assign every applicable coverage item to representative pages before bulk authoring. Record an evidence-based reason for not-applicable items. This plan does not approve patterns or replace source comparison, editor checks or final visual review.'};
}

export function checkRepresentativePlan(state,selectedPages,plan){
 const current=representativePlan(state,selectedPages),issues=[];
 if(current.missingInventories.length)issues.push('Complete all selected source inventories first');
 if(JSON.stringify(plan.inventoryKeys)!==JSON.stringify(current.inventoryKeys))issues.push('Source inventory changed; refresh coverage');
 const rows=new Map((plan.patterns??[]).map(p=>[p.id,p]));
 if(rows.size!==(plan.patterns??[]).length||rows.size!==current.patterns.length)issues.push('Pattern set changed or contains duplicates');
 for(const pattern of current.patterns){
  const saved=rows.get(pattern.id);
  if(!saved||saved.inventoryKey!==state.pages[saved.representativePage]?.inventoryHash||!pattern.pages.includes(saved.representativePage)||(!state.pipelinePolicy&&saved.representativePage!==pattern.representativePage)||JSON.stringify(saved.pages)!==JSON.stringify(pattern.pages))issues.push('Refresh source pattern '+pattern.id);
 }
 const coverage=new Map((plan.coverage??[]).map(c=>[c.id,c])),candidatePages=new Set(current.representativePages);
 if(coverage.size!==(plan.coverage??[]).length||coverage.size!==REPRESENTATIVE_COVERAGE.length)issues.push('Coverage set changed or contains duplicates');
 for(const id of REPRESENTATIVE_COVERAGE){
  const item=coverage.get(id);
  if(item?.status==='not-applicable'&&typeof item.notApplicableReason==='string'&&item.notApplicableReason.trim())continue;
  if(item?.status!=='planned'||!item.pages?.length||!item.pages.every(p=>selectedPages.includes(p))){issues.push('Assign source pages or explain not-applicable: '+id);continue;}
  item.pages.forEach(p=>candidatePages.add(p));
 }
 return {ok:issues.length===0,issues,candidatePages:[...candidatePages].sort((a,b)=>a-b),note:'Planning coverage only. Source comparison, mathematics, representative approval, editor checks and final visual review remain required.'};
}

function fieldValue(target,field){
 if(typeof field!=='string'||!field.startsWith('/')||field==='/'||/~(?![01])/u.test(field))throw Error('Use a nonempty JSON pointer field');
 const keys=field.slice(1).split('/').map(k=>k.replace(/~1/g,'/').replace(/~0/g,'~'));
 let value=target;
 for(const key of keys){
  if(['__proto__','constructor','prototype'].includes(key)||!value||typeof value!=='object'||!Object.hasOwn(value,key))throw Error('Missing or unsafe repair field '+field);
  value=value[key];
 }
 return structuredClone(value);
}

export function targetedRepairContext(runDir,request,{state=liveWorkflow(runDir)}={}){
 if(!Array.isArray(request.targets)||!request.targets.length)throw Error('Repair context requires targets');
 const packets=new Map(),seen=new Set(),pages=new Set(),targets=[];
 for(const target of request.targets){
  const {page,scope,targetId,fields}=target;
  if(!Number.isInteger(page)||page<1||!['author','inventory'].includes(scope)||!targetId||!Array.isArray(fields)||!fields.length)throw Error('Each target needs page, author|inventory scope, targetId and fields');
  const identity=scope+':'+page;
  if(!packets.has(identity))packets.set(identity,scope==='author'?effectiveAuthor(runDir,page,state):effectiveInventory(runDir,page,state));
  const packet=packets.get(identity),node=scope==='author'?contentNodes(packet).get(targetId)?.node:packet.entries.find(e=>e.id===targetId);
  if(!node)throw Error('Missing repair target '+targetId);
  pages.add(page);
  for(const field of fields){
   const key=identity+':'+targetId+field;if(seen.has(key))throw Error('Duplicate repair target field');seen.add(key);
   targets.push({scope,page,targetId,field,original:fieldValue(node,field)});
  }
 }
 const evidencePages=[...new Set([...pages,...(request.teachingPages??[])])].sort((a,b)=>a-b);
 const evidence=evidencePages.map(page=>{
  if(!Number.isInteger(page)||page<1)throw Error('Invalid teaching page');
  return {page,files:['png','txt'].map(ext=>{
   const file=path.resolve(runDir,'evidence/pages',`page-${String(page).padStart(3,'0')}.${ext}`);
   return {path:file,hash:bytesHash(file)};
  })};
 });
 return {version:1,expectedRevision:state.revision,key:settlementKey(state),targets,evidence,
  instructions:'These are exact current fields, not an approved correction. Read the linked source and taught methods. Request additional dependent targets for prompts, short/worked answers, diagrams, inventory and presentation expectations as needed. Return only corrected fields with reasons; preserve IDs and unrelated content. Submit reviewed patches through review-workflow decide/propagate. Never write canonical packets or projects directly. Ambiguous mathematics remains a bundled review issue.'};
}

export function writeNewJson(file,value){
 fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{encoding:'utf8',flag:'wx'});
}
