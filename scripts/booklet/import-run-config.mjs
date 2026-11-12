// Run-config schema check for import v2 (simplification plan item 4, 13 November 2026).
// Fields the pipeline needs but did not check until a model call or finish depended on them:
// Cambridge X11 Ch 5's topics had no teachingPages, so authors never saw the teaching pages and
// finish stopped on all 165 blocks; Mastering Maths Ch 2's composite-functions topic missed an
// answer page, so five absence claims failed at finish. This reports every problem at once,
// before inventory, authoring or finish make a call.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
// Content review sends each question's own page(s) and, for an absence claim, every page its
// topic searched; lean-review LIMITS.sourceImages is 8.
export const SOURCE_IMAGE_LIMIT=8,QUESTION_PAGE_ALLOWANCE=1;
const ints=value=>Array.isArray(value)&&value.every(Number.isInteger);
let skillIds;
export function knownSkillIds(root=ROOT){
 skillIds??=new Set(JSON.parse(fs.readFileSync(path.join(root,'data','skills.json'),'utf8')).map(skill=>skill.id));
 return skillIds;
}

// Problems with a v2 run config against its manifest. stage: 'prepare' checks only what is
// present; 'inventory', 'author' and 'finish' require topics.
export function runConfigProblems(config,manifest,{stage='author',skills=knownSkillIds()}={}){
 const problems=[];
 if(!config||typeof config!=='object')return ['RUN/config.json is missing (copy the run config there before finish)'];
 if(manifest?.importPolicy!=='import-v2')return problems;
 const topics=config.topics;
 const selected=manifest.selectedPages??[],context=manifest.contextPages??[],teacher=manifest.teacherPages??[];
 const textbook=manifest.track==='textbook';
 if(topics===undefined){if(stage!=='prepare'&&textbook)problems.push('topics: required for a textbook run (id, title, start, end, teachingPages, teacherPages)');}
 else if(!Array.isArray(topics)||!topics.length)problems.push('topics: must be a non-empty list');
 else {
  const ids=new Set();
  topics.forEach((topic,i)=>{
   const name='topics['+i+']'+(topic?.id?' ('+topic.id+')':'');
   if(!topic?.id||typeof topic.id!=='string')problems.push(name+': id is required');
   else if(ids.has(topic.id))problems.push(name+': duplicate id');else ids.add(topic.id);
   if(!Number.isInteger(topic?.start)||!Number.isInteger(topic?.end)||topic.start>topic.end)problems.push(name+': start and end must be page numbers with start <= end');
   if(teacher.length){
    if(!ints(topic?.teacherPages)||!topic.teacherPages.length)problems.push(name+': teacherPages (this topic\'s answer-key pages, confirmed on the page images) is required');
    else {
     const outside=topic.teacherPages.filter(page=>!teacher.includes(page));
     if(outside.length)problems.push(name+': teacherPages '+outside.join(', ')+' were not prepared as answer pages');
     if(topic.teacherPages.length+QUESTION_PAGE_ALLOWANCE>SOURCE_IMAGE_LIMIT)problems.push(name+': '+topic.teacherPages.length+' answer pages; an answer-key absence claim would need '+(topic.teacherPages.length+QUESTION_PAGE_ALLOWANCE)+' images against the content-review limit of '+SOURCE_IMAGE_LIMIT+'; split the topic');
    }
   }
   if(context.length&&!topic?.embeddedContext){
    const pages=Number.isInteger(topic?.start)?selected.filter(page=>page>=topic.start&&page<=topic.end):[];
    const perPage=pages.length&&pages.every(page=>ints(config.pageTeachingPages?.[page])&&config.pageTeachingPages[page].length);
    if(!perPage&&(!ints(topic?.teachingPages)||!topic.teachingPages.length))problems.push(name+': teachingPages is required (the prepared context pages that teach this topic), or embeddedContext: true');
    else if(ints(topic?.teachingPages)){const outside=topic.teachingPages.filter(page=>!context.includes(page));if(outside.length)problems.push(name+': teachingPages '+outside.join(', ')+' were not prepared as context pages');}
   }
   for(const id of topic?.classificationSkillIds??[])if(!skills.has(id))problems.push(name+': unknown classification skill '+id);
  });
  for(const page of selected){
   const owners=topics.filter(topic=>Number.isInteger(topic?.start)&&page>=topic.start&&page<=topic.end);
   if(!owners.length)problems.push('page '+page+': in no topic');
   else if(owners.length>1)problems.push('page '+page+': in more than one topic ('+owners.map(t=>t.id).join(', ')+')');
  }
 }
 for(const id of config.classificationSkillIds??[])if(!skills.has(id))problems.push('classificationSkillIds: unknown skill '+id);
 return problems;
}

export function assertRunConfig(config,manifest,options){
 const problems=runConfigProblems(config,manifest,options);
 if(problems.length)throw Error('Run config needs '+problems.length+' fix'+(problems.length>1?'es':'')+' before any model call:\n- '+problems.join('\n- '));
}
