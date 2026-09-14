import {flowEditionSections} from './booklet-flow.js';
import {answerFragments,exerciseLabelWidth} from './booklet-exercises.js';
import {paginationReuse,samePageCarry} from './booklet-pagination-cache.js';

export async function paginateCompactAnswers(project,edition,measure,{cancelled=()=>false,onprogress=()=>{},previous=null,context=''}={}) {
  const mode=edition.includes('short')?'short':'worked',count=mode==='short'?2:1;
  const sections=flowEditionSections(project,mode),pages=[],issues=[];
  const widths=new Map(sections.map(s=>[s.topicId,exerciseLabelWidth(sections.filter(t=>t.topicId===s.topicId).flatMap(t=>t.blocks))]));
  const reuse=paginationReuse(project,edition,previous,context);
  const units=sections.flatMap(section=>section.blocks.map(block=>({blocks:[block],section})));
  const cached=reuse.get('answers',{id:'answers',metadata:sections.map(s=>({...s,blocks:undefined,labelWidthMm:widths.get(s.topicId)}))},units,false);
  if(cached.unchanged)return reuse.finish({pages:cached.prior.pages.map(p=>({...p})),issues:cached.prior.issues,edition});
  let columns=Array.from({length:count},()=>[]),column=0;
  const check=()=>{if(cancelled())throw Object.assign(Error('Pagination superseded'),{cancelled:true});};
  const make=()=>({id:`compact-${mode}-${pages.length}`,pageNumber:pages.length+1,mode,flexible:true,compactAnswers:true,showAnswerHeading:pages.length===0,columns:columns.map(c=>[...c]),blocks:columns.flat().map(e=>e.block),section:columns.flat()[0]?.section,breakReason:'overflow'});
  const flush=()=>{if(columns.some(c=>c.length))pages.push(make());columns=Array.from({length:count},()=>[]);column=0;};
  let completed=0,begin=0;
  const resume=cached.prior?.checkpoints[cached.first];
  if(resume){begin=cached.first;pages.push(...cached.prior.pages.slice(0,resume.pageCount).map(p=>({...p})));issues.push(...cached.prior.issues.slice(0,resume.issueCount));columns=resume.columns.map(c=>[...c]);column=resume.column;cached.entry.checkpoints=cached.prior.checkpoints.slice(0,begin);}
  for(let i=begin;i<units.length;i++){
    const {section,blocks:[block]}=units[i];
    const checkpoint={pageCount:pages.length,issueCount:issues.length,columns:columns.map(c=>[...c]),column};
    const prior=cached.prior?.checkpoints[i];
    if(i>begin&&prior&&cached.suffix(i)&&column===prior.column&&columns.every((c,j)=>samePageCarry(c,prior.columns[j]))){pages.push(...cached.prior.pages.slice(prior.pageCount).map(p=>({...p})));issues.push(...cached.prior.issues.slice(prior.issueCount));cached.entry.checkpoints.push(...cached.prior.checkpoints.slice(i));columns=Array.from({length:count},()=>[]);break;}
    cached.entry.checkpoints.push(checkpoint);
      for(const fragment of answerFragments(block)){
        check();
        const entry={block:fragment,section,labelWidthMm:widths.get(section.topicId)};
        while(true){
          columns[column].push(entry);
          const size=await measure(make());check();
          if(size.height<=size.capacity+.2)break;
          columns[column].pop();
          if(!columns[column].length){
            issues.push({kind:'oversized-content',id:block.id,sectionId:section.sourceSectionId,message:'An answer part cannot fit safely. Adjust its answer diagram or working layout.'});
            columns[column].push(entry);break;
          }
          if(column+1<count)column++;else flush();
        }
      }
    if(units[i+1]?.section!==section)onprogress({complete:++completed,total:sections.length,pages:pages.length});
  }
  flush();
  const sectionById=new Map(sections.map(s=>[s.id,s]));
  pages.forEach((p,i)=>{p.pageNumber=i+1;p.totalPages=pages.length;p.section=sectionById.get(p.section?.id)??p.section;p.columns=p.columns.map(c=>c.map(e=>({...e,section:sectionById.get(e.section.id)??e.section})));});
  cached.entry.pages=pages;cached.entry.issues=issues;
  return reuse.finish({pages,issues,edition});
}
