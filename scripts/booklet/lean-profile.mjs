export {LEAN_REVIEW_PROFILE,isLeanReview,printableProject,questionReviewContent,LEAN_EDITORIAL_PROMPT} from '../../src/lib/booklet-review-profile.js';
import {isLeanReview} from '../../src/lib/booklet-review-profile.js';

export const blockingIssue=(issue,state)=>issue.status==='pending'&&(!isLeanReview(state)||!['optional-polish'].includes(issue.disposition));
// Selection is deterministic and small, not an assertion that unselected pages
// were visually inspected. Every edition still receives automated checks.
export function selectLeanVisualPages(project,pages,edition,{flaggedPages=[],changedPages=[]}={}){
 const selected=new Set(),families=new Map(),exercises=new Set();
 const blocks=new Map((project.sections??[]).flatMap(section=>(section.blocks??[]).map(block=>[block.id,{block,exercise:section.exerciseId??section.topicId??section.id,phase:section.phase}])));
 const numbers=new Set(pages.map((p,i)=>p.page??i+1));
 if(pages.length){selected.add(pages[0].page??1);selected.add(pages.at(-1).page??pages.length);}
 let previousMode;
 for(const [index,page]of pages.entries()){
  const number=page.page??index+1,ids=page.blocks??[],rows=ids.map(id=>blocks.get(typeof id==='string'?id:id.id)).filter(Boolean);
  const mode=page.mode??page.compactAnswers??(edition.startsWith('with-')?(page.isAnswer?'answer':'student'):edition);
  if(previousMode!==undefined&&mode!==previousMode){selected.add(number);if(numbers.has(number-1))selected.add(number-1);}previousMode=mode;
  for(const row of rows){
   if(row.phase==='front-matter')selected.add(number);
   const exercise=mode+':'+row.exercise;if(!exercises.has(exercise)){exercises.add(exercise);selected.add(number);}
   const text=JSON.stringify(row.block),types=[...text.matchAll(/"(?:type|format|arrangement|layout)":"([^"]+)"/g)].map(m=>m[1]);
   const family=[...new Set([row.block.type,...types])].sort().join(':');
   const density=(text.match(/"(?:type|latex|code|prompt)":/g)??[]).length;
   const key=mode+':'+family,old=families.get(key);
   if(!old){selected.add(number);families.set(key,{number,density});}
   else if(density>old.density)families.set(key,{number,density});
  }
  if(page.isCover||page.answerSectionStart)selected.add(number);
 }
 for(const {number}of families.values())selected.add(number);
 for(const page of flaggedPages)selected.add(page);
 for(const page of changedPages)for(const n of [page-1,page,page+1])selected.add(n);
 return [...selected].filter(p=>numbers.has(p)).sort((a,b)=>a-b);
}
