// Pure candidate checks and source-authoring prompts; no model execution.
import fs from 'node:fs';
import path from 'node:path';
import { HOUSE_STYLE_PROMPT } from '../../src/lib/booklet-house-style.js';
import { SOLUTION_CONVENTIONS } from './solution-conventions.mjs';
import { normalizeDocument } from '../../public/libs/maths-editor/document-model.mjs';
const root=path.resolve(import.meta.dirname,'../..');
const read=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
export function reconstructionPrompt(stage,promptVersion=4){
 const names={reconstruction:`scripts/booklet/prompts/reconstruction-v${promptVersion}.md`,diagrams:`scripts/booklet/prompts/diagram-reconstruction-v${promptVersion}.md`,tikz:'docs/tikz-prompt.md'};
 if(!names[stage])throw new Error('Unknown reconstruction stage');
 return read(path.join(root,names[stage]))+(['reconstruction','diagrams'].includes(stage)&&promptVersion>=4?'\n\n'+HOUSE_STYLE_PROMPT:'')+(stage==='reconstruction'&&promptVersion>=4?'\n\n'+SOLUTION_CONVENTIONS:'');
}
export function diagramRecords(value){const found=[];const walk=v=>{if(!v||typeof v!=='object')return;if(v.format==='tikz'&&v.id)found.push(v);Object.values(v).forEach(walk);};walk(value);return found;}
export function mergeDiagrams(candidate,reply){
  const copy=structuredClone(candidate), records=diagramRecords(copy), got=reply?.diagrams;
  if(!Array.isArray(got)||got.length!==records.length||new Set(got.map(d=>d.id)).size!==records.length)throw new Error('Diagram stage coverage mismatch');
  for(const d of records){const result=got.find(x=>x.id===d.id);if(!result||!/^\s*\\begin\{tikzpicture\}/.test(result.code??'')||!result.code.trim().endsWith('\\end{tikzpicture}'))throw new Error('Missing complete TikZ: '+d.id);d.code=result.code;if(result.mathematicalModel)d.mathematicalModel=result.mathematicalModel;d.uncertainties=result.uncertainties??[];d.reviewStatus='needs-review';}
  return copy;
}
export function candidateChecks(candidate,pages){
  const flags=[];const add=(id,code,note)=>flags.push({rootId:id,code,severity:'major',note});
  if(JSON.stringify(candidate?.pages?.map(p=>p.pageNumber).sort((a,b)=>a-b))!==JSON.stringify([...pages].sort((a,b)=>a-b)))add(null,'coverage','Missing, duplicate or unexpected page');
  const seen=new Set();
  const walk=(v,key='')=>{if(!v||typeof v!=='object')return;if(key==='sourceAtom')return;
    if(v.id){if(seen.has(v.id))add(v.id,'duplicate-id','Duplicate content identity');seen.add(v.id);}
    if(v.format==='maths-editor-document-v1'){try{normalizeDocument(v);}catch(e){add(v.id,'document',e.message);}}
    if(v.type==='table'){
      const widths=v.rows?.map(r=>r.reduce((n,c)=>n+(c.colspan??1),0))??[];
      if(new Set(widths).size>1&&!v.rows.flat().some(c=>(c.rowspan??1)>1))add(v.id,'table-shape','Rows have different column counts');
      const cells=new Set(v.rows?.flat().map(c=>c.id));for(const a of v.annotations??[])if(!cells.has(a.cellId)||(a.type==='arrow'&&!cells.has(a.toCellId)))add(v.id,'annotation-anchor','Annotation references a missing cell');
    }
    if(v.format==='image'&&!v.retentionReason)add(v.id,'retained-image','Image requires a reconstruction exception');
    if(v.format==='tikz'&&!v.code?.trim())add(v.id,'missing-tikz','Diagram has no rendered code');
    if(v.answer&&/\b(plot|sketch|draw.*(?:graph|line))\b/i.test(typeof v.prompt==='string'?v.prompt:'' )&&!(v.answer.solutionDiagrams?.length))add(v.id,'missing-plot-answer','Graphical task has no solution diagram');
    for(const [k,x] of Object.entries(v)){if(typeof x==='string'&&['prompt','content','short','worked','theorySolution'].includes(k)){
      const prose=x.replace(/\$\$[\s\S]*?\$\$|(?<!\\)\$[^$]*\$/g,'');if(/\\(?:quad|qquad|frac|times|div)\b/.test(prose))add(v.id,'raw-latex','Bare TeX outside mathematics');
    }else walk(x,k);}
  };walk(candidate);return flags;
}
