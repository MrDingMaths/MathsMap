import {contentSource,isDocument} from './document-content.js';
import {answerFragments,exerciseLabelWidth} from './booklet-exercises.js';
import {flowEditionSections} from './booklet-flow.js';
import {paginationReuse} from './booklet-pagination-cache.js';

export const SHORT_ANSWER_GRID_GAP_MM=3;
const fragments=new WeakMap();
const fragmentsFor=block=>{
  if(!fragments.has(block))fragments.set(block,answerFragments(block,'short'));
  return fragments.get(block);
};

// Content structure decides whether sharing is appropriate. Actual browser
// widths, not character counts or TeX source length, decide how many cells fit.
export function canShareShortAnswer(block){
  let node=block.content;
  while(node?.children?.length===1&&!node.answer?.short&&!node.sharedSolutionDiagrams?.length)node=node.children[0];
  if(!node||node.children?.length||node.sharedSolutionDiagrams?.length||node.answer?.solutionDiagrams?.length)return false;
  const value=node.answer?.short;
  if(isDocument(value)&& (value.blocks.length!==1||value.blocks[0].type!=='paragraph'||value.blocks[0].inlines.some(i=>!['text','math'].includes(i.type))))return false;
  const source=contentSource(value).trim();
  if(!source||/\n|\[tikz\]|<\/?(?:table|img)|\\begin\s*\{|\|.*\|/i.test(source))return false;
  // A calculation such as 30a/5 = 6a is a brief method, even without prose.
  // Simple labelled results (x = 2) may still share a row.
  const maths=[...source.matchAll(/(?<!\\)\$\$?([\s\S]*?)(?<!\\)\$\$?/g)].map(m=>m[1]);
  if((maths.length?maths:[source]).some(latex=>{
    // Independent labelled results are not a chain of working. An approximate
    // result with no left side and geometric equalities are also final results.
    return latex.split(/;|,(?!\d)|\\q(?:quad|uad)(?![a-zA-Z])/).some(clause=>{
      const steps=clause.split(/=|\\approx(?![a-zA-Z])|≈/).map(s=>s.trim());
      if(steps.length<2||steps.some(s=>!s))return false;
      const arithmetic=s=>/\\(?:[dt]?frac|times|div|cdot)(?![a-zA-Z])|\S\s*[+\-/]\s*\S|\d\s*\^/.test(s);
      return steps.slice(0,-1).some(arithmetic);
    });
  }))return false;
  const prose=source.replace(/(?<!\\)\$\$?[\s\S]*?(?<!\\)\$\$?/g,'').replace(/\\(?:text|mathrm)\{[^}]*\}/g,'').trim();
  // Sentences/methods get a full column. Short literal responses and units can
  // share a row, including plain numeric answers and legacy bare TeX.
  const literal=prose.replace(/\.$/,'');
  const explanation=/\b(?:use|draw|find|calculate|subtract|add|multiply|divide|substitute|solve|because|since|therefore|hence|are|is|has|have|equals|must|should|cannot)\b/i;
  return !/[!?]|\.(?:\s|$)/.test(literal)&&!explanation.test(literal)&&literal.split(/\s+/).filter(Boolean).length<=5;
}

export function packShortAnswerRows(entries,widths,columnWidthMm){
  const rows=[];
  for(let i=0;i<entries.length;){
    let count=1;
    for(const candidate of [3,2]){
      const slice=entries.slice(i,i+candidate),cell=(columnWidthMm-SHORT_ANSWER_GRID_GAP_MM*(candidate-1))/candidate;
      if(slice.length===candidate&&slice.every((entry,j)=>entry.section.topicId===entries[i].section.topicId&&Number.isFinite(widths[i+j])&&widths[i+j]+.2<=cell)){
        count=candidate;break;
      }
    }
    const row=rows.length;
    rows.push(entries.slice(i,i+count).map(entry=>({...entry,shortRow:row,shortColumns:count})));
    i+=count;
  }
  return rows;
}

// Keep page.columns flat for navigation, editor lookup and existing QA clients.
// Row metadata is derived presentation, never saved in project/question content.
export function shortAnswerRows(entries){
  const rows=[];
  for(const entry of entries){
    const last=rows.at(-1);
    if(entry.shortRow!=null&&last?.[0].shortRow===entry.shortRow)last.push(entry);
    else rows.push([entry]);
  }
  return rows;
}

const sameCarry=(a,b)=>a.length===b.length&&a.every((entry,i)=>entry.block===b[i].block&&entry.shortRow===b[i].shortRow&&entry.shortColumns===b[i].shortColumns);

export async function paginateShortAnswerGrid(project,edition,measure,{cancelled=()=>false,onprogress=()=>{},previous=null,context=''}={}){
  const sections=flowEditionSections(project,'short'),pages=[],issues=[];
  const labelWidths=new Map(sections.map(s=>[s.topicId,exerciseLabelWidth(sections.filter(t=>t.topicId===s.topicId).flatMap(t=>t.blocks))]));
  const metadata=sections.map(s=>({...s,blocks:undefined,labelWidthMm:labelWidths.get(s.topicId)}));
  const reuse=paginationReuse(project,edition,previous,context,{compactAnswers:true});
  const input=reuse.get('short-grid-inputs',{metadata},sections.flatMap(section=>section.blocks.map(block=>({blocks:[block]}))),false);
  if(input.unchanged){
    Object.assign(input.entry,input.prior);
    const rowCache=reuse.get('short-grid-rows',input.prior.rowMetadata,input.prior.rowUnits,false);
    if(rowCache.prior)Object.assign(rowCache.entry,rowCache.prior);
    return reuse.finish({pages:input.prior.pages.map(p=>({...p})),issues:input.prior.issues,edition});
  }
  const check=()=>{if(cancelled())throw Object.assign(Error('Pagination superseded'),{cancelled:true});};
  const entries=sections.flatMap(section=>section.blocks.flatMap(block=>fragmentsFor(block).map(fragment=>({block:fragment,section,labelWidthMm:labelWidths.get(section.topicId)}))));
  const widths=entries.map(()=>null);
  let columnWidthMm=(180-project.settings.compactAnswers.gutterMm)/2;
  const candidates=entries.map((entry,index)=>({entry,index})).filter(({entry})=>canShareShortAnswer(entry.block));
  // Bounded probes share the real renderer/fonts. Cache keys include their
  // exact content, label gutters and physical dimensions; no diagrams are probed.
  for(let i=0;i<candidates.length;i+=32){
    check();const batch=candidates.slice(i,i+32),blocks=batch.map(({entry})=>entry.block);
    const result=await measure({id:'short-answer-width-probe',pageNumber:1,mode:'short',flexible:true,compactAnswers:true,shortAnswerProbe:true,showAnswerHeading:false,columns:[batch.map(({entry})=>entry),[]],blocks,section:batch[0].entry.section});
    check();
    if(result.answerColumnWidthMm>0)columnWidthMm=result.answerColumnWidthMm;
    batch.forEach(({index},j)=>{const width=result.answerWidthsMm?.[j];if(Number.isFinite(width)&&width>0)widths[index]=width;});
  }
  const rows=packShortAnswerRows(entries,widths,columnWidthMm);
  const rowMetadata={metadata,columnWidthMm},rowUnits=rows.map(row=>({blocks:row.map(e=>e.block)}));
  const cached=reuse.get('short-grid-rows',rowMetadata,rowUnits,false);
  let columns=[[],[]],column=0,begin=0;
  const make=()=>({id:`compact-short-${pages.length}`,pageNumber:pages.length+1,mode:'short',flexible:true,compactAnswers:true,showAnswerHeading:pages.length===0,columns:columns.map(c=>[...c]),blocks:columns.flat().map(e=>e.block),section:columns.flat()[0]?.section,breakReason:'overflow'});
  const flush=()=>{if(columns.some(c=>c.length))pages.push(make());columns=[[],[]];column=0;};
  const resume=cached.prior?.checkpoints[cached.first];
  if(resume){begin=cached.first;pages.push(...cached.prior.pages.slice(0,resume.pageCount));issues.push(...cached.prior.issues.slice(0,resume.issueCount));columns=resume.columns.map(c=>[...c]);column=resume.column;cached.entry.checkpoints=cached.prior.checkpoints.slice(0,begin);}
  for(let i=begin;i<rows.length;i++){
    check();const row=rows[i],prior=cached.prior?.checkpoints[i];
    if(i>begin&&prior&&cached.suffix(i)&&column===prior.column&&columns.every((c,j)=>sameCarry(c,prior.columns[j]))){
      pages.push(...cached.prior.pages.slice(prior.pageCount));issues.push(...cached.prior.issues.slice(prior.issueCount));cached.entry.checkpoints.push(...cached.prior.checkpoints.slice(i));columns=[[],[]];break;
    }
    cached.entry.checkpoints.push({pageCount:pages.length,issueCount:issues.length,columns:columns.map(c=>[...c]),column});
    while(true){
      columns[column].push(...row);const size=await measure(make());check();
      if(size.height<=size.capacity+.2)break;
      columns[column].splice(-row.length);
      if(!columns[column].length){
        issues.push({kind:'oversized-content',id:row[0].block.id,sectionId:row[0].section.sourceSectionId,message:'An answer row cannot fit safely. Adjust its answer diagram or working layout.'});
        columns[column].push(...row);break;
      }
      if(column===0)column=1;else flush();
    }
    onprogress({complete:i+1,total:rows.length,pages:pages.length});
  }
  flush();
  const sectionById=new Map(sections.map(s=>[s.id,s]));
  const resultPages=pages.map((p,i)=>({...p,pageNumber:i+1,totalPages:pages.length,section:sectionById.get(p.section?.id)??p.section,columns:p.columns.map(c=>c.map(e=>({...e,section:sectionById.get(e.section.id)??e.section})))}));
  cached.entry.pages=resultPages;cached.entry.issues=issues;
  input.entry.pages=resultPages;input.entry.issues=issues;
  input.entry.rowMetadata=rowMetadata;input.entry.rowUnits=rowUnits;
  return reuse.finish({pages:resultPages,issues,edition});
}
