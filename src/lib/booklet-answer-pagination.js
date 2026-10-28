import {flowEditionSections} from './booklet-flow.js';
import {answerFragments,exerciseLabelWidth,workedAnswerDiagramFragments,orderedAnswerUnits} from './booklet-exercises.js';
import {paginationReuse,samePageCarry} from './booklet-pagination-cache.js';
import {paginateShortAnswerGrid} from './booklet-short-answer-grid.js';

export async function paginateCompactAnswers(project,edition,measure,{cancelled=()=>false,onprogress=()=>{},previous=null,context=''}={}) {
  if(edition.includes('short'))return paginateShortAnswerGrid(project,edition,measure,{cancelled,onprogress,previous,context});
  const mode=edition.includes('short')?'short':'worked',count=mode==='short'?2:1;
  const footerReserve=Math.max(0,Number(project.settings?.compactAnswers?.workedFooterReserveMm)||0);
  const sections=flowEditionSections(project,mode),pages=[],issues=[];
  const widths=new Map(sections.map(s=>[s.topicId,exerciseLabelWidth(sections.filter(t=>t.topicId===s.topicId).flatMap(t=>t.blocks),mode)]));
  const reuse=paginationReuse(project,edition,previous,context,{compactAnswers:true});
  const units=orderedAnswerUnits(sections,mode);
  const cached=reuse.get('answers',{id:'answers',metadata:sections.map(s=>({...s,blocks:undefined,labelWidthMm:widths.get(s.topicId)}))},units,false);
  if(cached.unchanged){Object.assign(cached.entry,cached.prior);return reuse.finish({pages:cached.prior.pages.map(p=>({...p})),issues:cached.prior.issues,edition});}
  let columns=Array.from({length:count},()=>[]),column=0;
  const check=()=>{if(cancelled())throw Object.assign(Error('Pagination superseded'),{cancelled:true});};
  const make=()=>({id:`compact-${mode}-${pages.length}`,pageNumber:pages.length+1,mode,flexible:true,compactAnswers:true,showAnswerHeading:pages.length===0,columns:columns.map(c=>[...c]),blocks:columns.flat().map(e=>e.block),section:columns.flat()[0]?.section,breakReason:'overflow'});
  const flush=()=>{if(columns.some(c=>c.length)){pages.push(make());perPage=Math.max(2,columns[0].length);}columns=Array.from({length:count},()=>[]);column=0;known=0;};
  let completed=0,begin=0;
  // Fragments per unit, shared by the loop and the look-ahead below.
  const fragmentLists=new Map(),fragmentsOf=j=>{if(!fragmentLists.has(j))fragmentLists.set(j,units[j].fragments??answerFragments(units[j].blocks[0],mode));return fragmentLists.get(j);};
  const fitsColumn=size=>size.height<=size.capacity-footerReserve+.2;
  // Look-ahead (single-column worked pages): measure a batch of the upcoming fragments
  // instead of the page after each one. The batch grows from about the previous page's
  // count; a binary search then finds the largest prefix that fits, and those fragments
  // are added without measuring again. Fitting is monotonic in the prefix, so this
  // places exactly what adding them one at a time would; the fragment that overflows
  // goes through the normal path, whose measurement the search has already cached.
  // It stops before a forced worked page break.
  let known=0,perPage=8;
  async function lookahead(i,f){
    const upcoming=[];
    for(let j=i;j<units.length&&upcoming.length<64;j++){
      if(j>i&&units[j].blocks[0].flow?.workedPageBreakBefore===true)break;
      const list=fragmentsOf(j);
      for(let g=j===i?f:0;g<list.length&&upcoming.length<64;g++)upcoming.push({block:list[g],section:units[j].section,labelWidthMm:widths.get(units[j].section.topicId)});
    }
    const base=columns[column].length,trial=async n=>{columns[column].push(...upcoming.slice(0,n));const size=await measure(make());check();columns[column].length=base;return fitsColumn(size);};
    let low=0,high=upcoming.length,n=Math.min(high,Math.max(2,perPage-base));
    if(n<2)return 0;
    while(true){if(await trial(n)){low=n;if(n===high)return low;n=Math.min(high,n*2);}else{high=n-1;break;}}
    while(low<high){const mid=Math.ceil((low+high)/2);if(await trial(mid))low=mid;else high=mid-1;}
    return low;
  }
  const resume=cached.prior?.checkpoints[cached.first];
  if(resume){begin=cached.first;pages.push(...cached.prior.pages.slice(0,resume.pageCount).map(p=>({...p})));issues.push(...cached.prior.issues.slice(0,resume.issueCount));columns=resume.columns.map(c=>[...c]);column=resume.column;cached.entry.checkpoints=cached.prior.checkpoints.slice(0,begin);}
  for(let i=begin;i<units.length;i++){
    const {section,blocks:[block]}=units[i];
    const checkpoint={pageCount:pages.length,issueCount:issues.length,columns:columns.map(c=>[...c]),column};
    const prior=cached.prior?.checkpoints[i];
    if(i>begin&&prior&&cached.suffix(i)&&column===prior.column&&columns.every((c,j)=>samePageCarry(c,prior.columns[j]))){pages.push(...cached.prior.pages.slice(prior.pageCount).map(p=>({...p})));issues.push(...cached.prior.issues.slice(prior.issueCount));cached.entry.checkpoints.push(...cached.prior.checkpoints.slice(i));columns=Array.from({length:count},()=>[]);break;}
    cached.entry.checkpoints.push(checkpoint);
    // A local worked-answer break leaves Questions and short answers untouched.
    // Flush once per owning block, before any of its answer fragments.
    if(block.flow?.workedPageBreakBefore===true)flush();
      const fragments=fragmentsOf(i);
      for(let f=0;f<fragments.length;f++){
        const fragment=fragments[f];
        check();
        const entry={block:fragment,section,labelWidthMm:widths.get(section.topicId)};
        if(!known&&count===1)known=await lookahead(i,f);
        if(known){columns[column].push(entry);known--;continue;}
        while(true){
          columns[column].push(entry);
          const size=await measure(make());check();
          if(size.height<=size.capacity-footerReserve+.2)break;
          columns[column].pop();
          // Opt in to filling the remaining page with the complete written
          // field, followed by the intact solution diagram group.
          if(columns[column].length&&block.flow?.workedAllowDiagramContinuation===true){
            const split=workedAnswerDiagramFragments(fragment);
            if(split){
              columns[column].push({...entry,block:split[0]});
              const textSize=await measure(make());check();
              columns[column].pop();
              if(textSize.height<=textSize.capacity-footerReserve+.2){
                const remaining=columns[column];columns[column]=[{...entry,block:split[1]}];
                const diagramSize=await measure(make());check();
                columns[column]=remaining;
                if(diagramSize.height<=diagramSize.capacity-footerReserve+.2){fragments.splice(f,1,...split);f--;break;}
              }
            }
          }
          if(!columns[column].length){
            const split=workedAnswerDiagramFragments(fragment);
            if(split){
              let fits=true;
              for(const part of split){
                columns[column].push({...entry,block:part});
                const partSize=await measure(make());check();
                columns[column].pop();
                if(partSize.height>partSize.capacity-footerReserve+.2){fits=false;break;}
              }
              if(fits){fragments.splice(f,1,...split);f--;break;}
            }
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
