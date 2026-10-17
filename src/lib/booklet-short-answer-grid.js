import {contentSource,isDocument} from './document-content.js';
import {answerFragments,exerciseLabelWidth,orderedAnswerUnits} from './booklet-exercises.js';
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
  while(node?.children?.length===1&&!node.answer?.short&&!node.answer?.solutionDiagrams?.length&&!node.sharedSolutionDiagrams?.length)node=node.children[0];
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
      // A line in general form is a final equation, not a calculation step.
      // Keep the exception narrow so arithmetic and nonlinear working still span.
      if(steps.length===2&&steps[1]==='0'){
        const terms=steps[0].replace(/\s/g,'').match(/[+-]?[^+-]+/g)??[];
        if(terms.length&&terms.every(term=>/^[+-]?(?:\d+(?:\.\d+)?)?[xy]$|^[+-]?\d+(?:\.\d+)?$/.test(term))&&
          terms.filter(term=>term.endsWith('x')).length===1&&terms.filter(term=>term.endsWith('y')).length===1)return false;
      }
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

// A question continued across blocks is still one question.
function questionKeys(entries){
  const parents=new Map(entries.map(({block})=>[block.id,block.flow?.continuationOf??block.continuationOf]));
  return entries.map(({block})=>{
    let id=block.id;
    for(const seen=new Set();parents.get(id)&&!seen.has(id);id=parents.get(id))seen.add(id);
    return id;
  });
}

export function packShortAnswerRows(entries,widths,columnWidthMm){
  const rows=[],keys=questionKeys(entries),parts=new Map();
  const starts=entries.map(({block})=>{
    const ids=new Set(block.presentation?.shortAnswerGroupStarts??[]);
    const contains=node=>!!node&&(ids.has(node.id)||(node.children??[]).some(contains));
    return contains(block.content);
  });
  const crossesBoundary=(i,count)=>starts.slice(i+1,i+count).some(Boolean);
  for(const key of keys)parts.set(key,(parts.get(key)??0)+1);
  // Parts of a multipart question never share a row with another question:
  // 3i 3j ends the row and 4a starts the next. Single answers (3 4 5) may share.
  const together=(i,count)=>{const slice=keys.slice(i,i+count);return slice.every(key=>key===keys[i])||slice.every(key=>parts.get(key)===1);};
  // Rows that belong together: the parts of one question, or a run of single answers in one exercise.
  const group=i=>parts.get(keys[i])===1?`single:${entries[i].section.topicId}`:keys[i];
  let previous=null;
  for(let i=0;i<entries.length;){
    let count=1,columns=1;
    for(const candidate of [3,2]){
      const cell=(columnWidthMm-SHORT_ANSWER_GRID_GAP_MM*(candidate-1))/candidate;
      const fits=size=>size>0&&i+size<=entries.length&&entries.slice(i,i+size).every((entry,j)=>entry.section.topicId===entries[i].section.topicId&&Number.isFinite(widths[i+j])&&widths[i+j]+.2<=cell);
      if(together(i,candidate)&&!crossesBoundary(i,candidate)&&fits(candidate)){count=columns=candidate;break;}
      // A short last row keeps the columns of the row above: 9g 9h sit under 9d 9e.
      let rest=0;
      while(rest<candidate&&i+rest<entries.length&&group(i+rest)===group(i)&&(!rest||!starts[i+rest]))rest++;
      if(rest<candidate&&previous?.columns===candidate&&previous.group===group(i)&&fits(rest)){count=rest;columns=candidate;break;}
    }
    const row=rows.length;
    rows.push(entries.slice(i,i+count).map(entry=>({...entry,shortRow:row,shortColumns:columns})));
    previous={columns,group:group(i)};
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

// An explicitly widened completed table needs its authored width. Ordinary
// answers and the existing column-width table setting retain two columns.
export function needsFullPageShortTable(block,columnWidthMm){
  if(block.presentation?.shortAnswerTableFullWidth!==true)return false;
  const visit=node=>isDocument(node?.answer?.short)&&node.answer.short.blocks.some(b=>b.type==='table'&&Number(b.widthMm)>columnWidthMm+.2)||(node?.children??[]).some(visit);
  return visit(block.content);
}

const sameCarry=(a,b)=>a.length===b.length&&a.every((entry,i)=>entry.block===b[i].block&&entry.shortRow===b[i].shortRow&&entry.shortColumns===b[i].shortColumns);
const sameBands=(a,b)=>a.length===b.length&&a.every((band,i)=>band.length===b[i].length&&band.every((column,j)=>sameCarry(column,b[i][j])));
const copyBands=bands=>bands.map(band=>band.map(column=>[...column]));

export async function paginateShortAnswerGrid(project,edition,measure,{cancelled=()=>false,onprogress=()=>{},previous=null,context=''}={}){
  const sections=flowEditionSections(project,'short'),pages=[],issues=[];
  const labelWidths=new Map(sections.map(s=>[s.topicId,exerciseLabelWidth(sections.filter(t=>t.topicId===s.topicId).flatMap(t=>t.blocks),'short')]));
  const metadata=sections.map(s=>({...s,blocks:undefined,labelWidthMm:labelWidths.get(s.topicId)}));
  const reuse=paginationReuse(project,edition,previous,context,{compactAnswers:true});
  const input=reuse.get('short-grid-inputs',{metadata,fullWidthTableBands:1},sections.flatMap(section=>section.blocks.map(block=>({blocks:[block]}))),false);
  if(input.unchanged){
    Object.assign(input.entry,input.prior);
    const rowCache=reuse.get('short-grid-rows',input.prior.rowMetadata,input.prior.rowUnits,false);
    if(rowCache.prior)Object.assign(rowCache.entry,rowCache.prior);
    return reuse.finish({pages:input.prior.pages.map(p=>({...p})),issues:input.prior.issues,edition});
  }
  const check=()=>{if(cancelled())throw Object.assign(Error('Pagination superseded'),{cancelled:true});};
  const entries=orderedAnswerUnits(sections,'short').flatMap(({section,blocks:[block],fragments:ordered})=>(ordered??fragmentsFor(block)).map(fragment=>({block:fragment,section,labelWidthMm:labelWidths.get(section.topicId)})));
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
  const rowMetadata={metadata,columnWidthMm,fullWidthTableBands:1},rowUnits=rows.map(row=>({blocks:row.map(e=>e.block)}));
  const cached=reuse.get('short-grid-rows',rowMetadata,rowUnits,false);
  let columns=[[],[]],bands=[],column=0,begin=0;
  const make=()=>{
    const answerBands=[...copyBands(bands),...(columns.some(c=>c.length)?[columns.map(c=>[...c])]:[])];
    const projected=bands.length?answerBands.flat():columns.map(c=>[...c]);
    return {id:`compact-short-${pages.length}`,pageNumber:pages.length+1,mode:'short',flexible:true,compactAnswers:true,showAnswerHeading:pages.length===0,columns:projected,...(bands.length?{answerBands}:{}),blocks:projected.flat().map(e=>e.block),section:projected.flat()[0]?.section,breakReason:'overflow'};
  };
  const flush=()=>{if(bands.length||columns.some(c=>c.length))pages.push(make());columns=[[],[]];bands=[];column=0;};
  const resume=cached.prior?.checkpoints[cached.first];
  if(resume){begin=cached.first;pages.push(...cached.prior.pages.slice(0,resume.pageCount));issues.push(...cached.prior.issues.slice(0,resume.issueCount));columns=resume.columns.map(c=>[...c]);bands=copyBands(resume.bands??[]);column=resume.column;cached.entry.checkpoints=cached.prior.checkpoints.slice(0,begin);}
  for(let i=begin;i<rows.length;i++){
    check();const row=rows[i],prior=cached.prior?.checkpoints[i];
    if(i>begin&&prior&&cached.suffix(i)&&column===prior.column&&sameBands(bands,prior.bands??[])&&columns.every((c,j)=>sameCarry(c,prior.columns[j]))){
      pages.push(...cached.prior.pages.slice(prior.pageCount));issues.push(...cached.prior.issues.slice(prior.issueCount));cached.entry.checkpoints.push(...cached.prior.checkpoints.slice(i));columns=[[],[]];bands=[];break;
    }
    cached.entry.checkpoints.push({pageCount:pages.length,issueCount:issues.length,columns:columns.map(c=>[...c]),bands:copyBands(bands),column});
    if(row.length===1&&needsFullPageShortTable(row[0].block,columnWidthMm)){
      if(columns.some(c=>c.length)){bands.push(columns.map(c=>[...c]));columns=[[],[]];column=0;}
      bands.push([[...row]]);
      let size=await measure(make());check();
      if(size.height>size.capacity-(96/25.4*0.5)){
        bands.pop();if(bands.length)flush();bands.push([[...row]]);
        size=await measure(make());check();
        if(size.height>size.capacity-(96/25.4*0.5))issues.push({kind:'oversized-content',id:row[0].block.id,sectionId:row[0].section.sourceSectionId,message:'The completed answer table cannot fit safely on a full-width page.'});
      }
      onprogress({complete:i+1,total:rows.length,pages:pages.length});
      continue;
    }
    while(true){
      columns[column].push(...row);const size=await measure(make());check();
      // Inline fractions can paint below the measured row box. Retain half a
      // millimetre beyond the shared footer reserve instead of fitting past it.
      if(size.height<=size.capacity-(96/25.4*0.5))break;
      columns[column].splice(-row.length);
      if(!columns[column].length&&bands.length){flush();continue;}
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
  const refresh=e=>({...e,section:sectionById.get(e.section.id)??e.section});
  const resultPages=pages.map((p,i)=>({...p,pageNumber:i+1,totalPages:pages.length,section:sectionById.get(p.section?.id)??p.section,columns:p.columns.map(c=>c.map(refresh)),...(p.answerBands?{answerBands:p.answerBands.map(b=>b.map(c=>c.map(refresh)))}:{})}));
  cached.entry.pages=resultPages;cached.entry.issues=issues;
  input.entry.pages=resultPages;input.entry.issues=issues;
  input.entry.rowMetadata=rowMetadata;input.entry.rowUnits=rowUnits;
  return reuse.finish({pages:resultPages,issues,edition});
}
