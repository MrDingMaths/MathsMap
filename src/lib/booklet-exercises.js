import {isPractice, logicalUnits} from './booklet-flow.js';

export const COMPACT_ANSWERS = Object.freeze({shortFontPt:9,workedFontPt:9.5,gutterMm:8,shortDiagramMm:45,workedDiagramMm:55,diagramWidths:{}});

export function answerDiagramSignature(diagram) {
  let hash=2166136261;
  for(const c of JSON.stringify([diagram.code,diagram.mathematicalModel]))hash=Math.imul(hash^c.charCodeAt(0),16777619);
  return (hash>>>0).toString(16);
}
export function answerDiagramStyle(settings,mode,diagram) {
  const style=settings?.diagramStyles?.[mode]?.[diagram.id];
  return style?.sourceSignature===answerDiagramSignature(diagram)?style:null;
}

// Allow wrapping between complete coordinates/values, never within a fraction
// or coordinate pair. This changes only the display value passed to the renderer.
export function compactAnswerDisplay(value) {
  if(typeof value!=='string')return value;
  return value.replace(/(?<![\\$])\$(?!\$)((?:\\.|[^$])*?)(?<!\\)\$(?!\$)/g,(_,math)=>{
    let depth=0,result='';
    for(const c of math){if('({['.includes(c))depth++;if(')}]'.includes(c))depth--;result+=c;if(depth===0&&',;'.includes(c))result+='\\allowbreak ';}
    return '$'+result+'$';
  });
}

// Ratings are pinned presentation metadata, not edits to a bank classification.
export function organiseExercises(source, ratings) {
  const project=structuredClone(source);
  project.settings={...project.settings,exerciseOrganisation:'topic',compactAnswers:{...COMPACT_ANSWERS},flowEdition:'with-short'};
  const sections=[];
  for(let i=0;i<project.sections.length;i++){
    const section=project.sections[i];
    if(section.phase!=='practice'){sections.push(section);continue;}
    const run=[section];
    while(project.sections[i+1]?.phase==='practice'&&project.sections[i+1].topicId===section.topicId)run.push(project.sections[++i]);
    const blocks=run.flatMap(s=>s.blocks);
    for(const block of blocks){
      if(isPractice(block)){
        const rating=ratings[block.bankRef?.id];
        if(!rating||!Number.isFinite(rating.reasoningScore))throw Error(`Missing pinned difficulty: ${block.id}`);
        block.flow={...block.flow,bankDifficulty:{...rating}};
      }
      block.flow={...block.flow,sourcePageBreakBefore:false,pageBreakBefore:false};
      delete block.flow.numberGapBefore;delete block.flow.numberResetBefore;
    }
    // Group continuation chains, paired questions and source instructions first.
    const units=[];let pending=[];
    for(const unit of logicalUnits({sections:[{...section,blocks}]})){
      if(!unit.blocks.some(isPractice)){pending.push(...unit.blocks);continue;}
      units.push({blocks:[...pending,...unit.blocks]});pending=[];
    }
    if(pending.length){if(units.length)units.at(-1).blocks.push(...pending);else units.push({blocks:pending});}
    // Dependencies and keep-with-next constraints join the whole intervening range.
    const owner=new Map(units.flatMap((u,j)=>u.blocks.map(b=>[b.id,j]))),joined=new Set();
    units.forEach((u,j)=>u.blocks.forEach(b=>{
      const targets=[...(b.dependsOn??[]),...(b.pairedBlockId?[b.pairedBlockId]:[])].map(id=>owner.get(id)).filter(n=>n!=null);
      if(b.flow?.keepWithNext&&j+1<units.length)targets.push(j+1);
      for(const n of targets)for(let k=Math.min(j,n);k<Math.max(j,n);k++)joined.add(k);
    }));
    const groups=[];units.forEach((u,j)=>{if(j&&joined.has(j-1))groups.at(-1).blocks.push(...u.blocks);else groups.push(u);});
    const score=u=>Math.max(0,...u.blocks.filter(isPractice).map(b=>b.flow.bankDifficulty.reasoningScore));
    groups.sort((a,b)=>score(a)-score(b)); // Stable ties retain the source sequence.
    const next={...section,title:'Exercise',difficulty:null,showDifficultyHeading:false,blocks:groups.flatMap(u=>u.blocks)};
    delete next.numberingStart;
    sections.push(next);
  }
  project.sections=sections;
  return project;
}

// A compact answer fragment preserves its ancestor path and original part labels.
// Nodes sharing a solution diagram, or explicit dependencies, stay atomic.
export function answerFragments(block) {
  const root=structuredClone(block.content),units=[];
  const label=(node,index=0)=>{
    if(node!==root&&node.label==null&&!node.children?.length)node.label=String.fromCharCode(97+index);
    node.children?.forEach(label);
  };
  label(root);
  const visit=(node,path=[])=>{
    if(node.children?.length&&!node.sharedSolutionDiagrams?.length&&!node.children.some(c=>c.dependsOn?.length))node.children.forEach(c=>visit(c,[...path,node]));
    else units.push({node,path});
  };
  visit(root);
  return units.map(({node,path},index)=>{
    let content=node;
    for(const ancestor of [...path].reverse())content={...ancestor,children:[content]};
    return {...block,content,flow:{...block.flow,answerFragment:index}};
  });
}

export function exerciseLabelWidth(blocks) {
  let length=1;
  for(const block of blocks){
    const walk=(node,path='',index=0)=>{
      const next=node===block.content?path:node.children?.length&&node.label==null?path:path+String(node.label??String.fromCharCode(97+index));
      if(node.children?.length)node.children.forEach((c,i)=>walk(c,next,i));
      else length=Math.max(length,String(block.sourceOrder??'').length+next.length);
    };
    walk(block.content);
  }
  return Math.max(8,length*2.1);
}
