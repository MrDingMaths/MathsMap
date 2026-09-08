import {flowEditionSections} from './booklet-flow.js';
import {answerFragments,exerciseLabelWidth} from './booklet-exercises.js';

export async function paginateCompactAnswers(project,edition,measure,{cancelled=()=>false,onprogress=()=>{}}={}) {
  const mode=edition.includes('short')?'short':'worked',count=mode==='short'?2:1;
  const sections=flowEditionSections(project,mode),pages=[],issues=[];
  const widths=new Map(sections.map(s=>[s.topicId,exerciseLabelWidth(sections.filter(t=>t.topicId===s.topicId).flatMap(t=>t.blocks))]));
  let columns=Array.from({length:count},()=>[]),column=0;
  const check=()=>{if(cancelled())throw Object.assign(Error('Pagination superseded'),{cancelled:true});};
  const make=()=>({id:`compact-${mode}-${pages.length}`,pageNumber:pages.length+1,mode,flexible:true,compactAnswers:true,showAnswerHeading:pages.length===0,columns:columns.map(c=>[...c]),blocks:columns.flat().map(e=>e.block),section:columns.flat()[0]?.section,breakReason:'overflow'});
  const flush=()=>{if(columns.some(c=>c.length))pages.push(make());columns=Array.from({length:count},()=>[]);column=0;};
  let completed=0;
  for(const section of sections){
    for(const block of section.blocks){
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
    }
    onprogress({complete:++completed,total:sections.length,pages:pages.length});
  }
  flush();
  pages.forEach((p,i)=>{p.pageNumber=i+1;p.totalPages=pages.length;});
  return {pages,issues,edition};
}
