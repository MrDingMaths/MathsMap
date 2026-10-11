import {compactAnswerProseGlue} from './compact-answer-glue.js';
import {contentSource} from './document-content.js';
import {retainDifficultyAsMetadata} from './booklet-difficulty-headings.js';
import {isPractice, logicalUnits} from './booklet-flow.js';
import {graphSourceWithoutColourMetadata} from './diagram-colours.js';

import {COMPACT_ANSWERS} from './booklet-creation.js';
export {COMPACT_ANSWERS} from './booklet-creation.js';

export function compactAnswerLabel(number,parts=[]){
 const labels=[...(number==null?[]:[String(number)]),...parts.map(String)].filter(Boolean);
 return labels.reduce((text,label,index)=>text+(index&&/^\d+$/.test(label)?`(${label})`:(index&&label.length>1&&!/^[ivxlcdm]+$/i.test(label)?' ':'')+label),'');
}

// A supplied matching figure is a structural container, not another response.
// A real question (including an empty prompt awaiting repair) keeps its answer row.
export const isGivenFigureNode=node=>!!node&&!node.children?.length&&!Object.hasOwn(node,'prompt')&&!node.answer&&!!node.questionDiagrams?.length;
export function firstAnswerNode(node,responses=[]){
  if(!node||isGivenFigureNode(node))return null;
  if(!node.children?.length&&!node.answer?.short&&!node.answer?.worked&&responses.some(r=>r.targetId===node.id&&r.kind==='none'))return null;
  if(node.answer?.short||node.answer?.worked||!node.children?.length)return node;
  return node.children.map(child=>firstAnswerNode(child,responses)).find(Boolean)??null;
}

// Display metadata belongs only to cloned answer fragments. Preserve the original
// segment before pruning siblings, including whether a group was transparent.
// A blank-labelled wrapper that only arranges labelled parts (source columns,
// layout groups, a run of parts under its own instruction) adds no label segment
// and no context: the part labels already identify each answer. A wrapper with an
// unlabelled response, or whose part labels repeat elsewhere in the parent, keeps
// its position number and its instruction as context.
export function arrangesLabelledParts(node,parent){
 if(!parent?.children||node.label==null||String(node.label).trim()||!node.children?.length)return false;
 const text=n=>String(n.label??'').trim();
 const labels=parent.children.flatMap(sibling=>sibling.label!=null&&!text(sibling)&&sibling.children?.length?sibling.children:[sibling]).map(text);
 return node.children.every(child=>text(child)&&labels.filter(label=>label===text(child)).length===1);
}

function answerPartLabel(node,index=0,parent=null){
 if(node._answerDisplay)return node._answerDisplay.label;
 if(node.label!=null&&String(node.label).trim())return String(node.label);
 if(arrangesLabelledParts(node,parent))return null;
 if(node.label!=null||node.children?.some(child=>!String(child.label??'').trim()))return String(index+1);
 return node.children?.length?null:String.fromCharCode(97+index);
}

export function answerNodePath(root,node,path=[],index=0,parent=null){
 if(node===root)return path;
 const label=answerPartLabel(node,index,parent);
 return label==null?path:[...path,label];
}

// Context stays in the content column; it never enlarges the label gutter.
export function answerNodeContext(root,node,index=0,parent=null){
 if(node._answerDisplay)return node._answerDisplay.context;
 // Table headings describe the given data, not the context of each answer.
 const contextPrompt=node.prompt?.format==='maths-editor-document-v1'
  ?{...node.prompt,blocks:node.prompt.blocks.filter(block=>block.type!=='table')}:node.prompt;
 const prompt=contentSource(contextPrompt).trim();
 const rootPrompt=contentSource(root.prompt).trim();
 if(node!==root&&String(node.label??'').trim())return '';
 if(node!==root&&node.children?.length)return answerPartLabel(node,index,parent)==null?'':prompt.split(/\r?\n/,1)[0].replace(/:\s*$/,'');
 if(node!==root&&!prompt&&index<2&&/\busing both methods\b/i.test(contentSource(parent?.prompt))){
  const names=rootPrompt.match(/^([\p{L}\p{M}][\p{L}\p{M}'’ -]*?) and ([\p{L}\p{M}][\p{L}\p{M}'’ -]*?) are solving\b/u);
  if(names)return `${names[index+1]}’s method`;
 }
 if(node===root){
  const work=rootPrompt.match(/^Read ([^\n:]+?[’']s work) carefully\b/u);
  if(work)return work[1];
  const student=rootPrompt.match(/^([\p{L}\p{M}'’-]+) is solving (?:the )?equation\b/u);
  if(student)return `${student[1]}’s work`;
 }
 return '';
}

export function answerDiagramSignature(diagram) {
  let hash=2166136261;
  for(const c of JSON.stringify([graphSourceWithoutColourMetadata(diagram.code),diagram.mathematicalModel]))hash=Math.imul(hash^c.charCodeAt(0),16777619);
  return (hash>>>0).toString(16);
}
export function answerDiagramStyle(settings,mode,diagram) {
  const style=settings?.diagramStyles?.[mode]?.[diagram.id];
  return style?.sourceSignature===answerDiagramSignature(diagram)?style:null;
}

export function answerDiagramWidth(settings,mode,diagram,fallback=Number(diagram.widthMm)||60) {
  const saved=settings?.diagramWidths?.[diagram.id];
  const explicit=typeof saved==='number'?saved:saved?.[mode];
  if(Number.isFinite(explicit)&&explicit>=5)return explicit;
  const calibrated=answerDiagramStyle(settings,mode,diagram)?.widthMm;
  return calibrated??Math.min(fallback,settings?.[mode==='short'?'shortDiagramMm':'workedDiagramMm']??(mode==='short'?45:55));
}

export function withAnswerDiagramWidth(settings,mode,id,width) {
  if(!['short','worked'].includes(mode)||!Number.isFinite(width)||width<5||width>190)throw Error('Invalid answer diagram size');
  const old=settings?.diagramWidths?.[id];
  const widths=typeof old==='number'?{short:old,worked:old}:old??{};
  const styles={...settings?.diagramStyles,[mode]:{...settings?.diagramStyles?.[mode]}};
  // A calibrated code variant was prepared for its old size. Render the native
  // source again so label calibration agrees with the explicit new size.
  delete styles[mode][id];
  return {...settings,diagramWidths:{...settings?.diagramWidths,[id]:{...widths,[mode]:width}},diagramStyles:styles};
}

// Allow wrapping between complete coordinates/values, never within a fraction
// or coordinate pair. This changes only the display value passed to the renderer.
export function compactAnswerDisplay(value) {
  // Display-only wrapping; never modify stored editor documents or TeX.
  const breakInlineMath=math=>{
    let depth=0,result='';
    for(let index=0;index<math.length;index++){
      const c=math[index];
      if(c==='\\'&&index+1<math.length){
        const escaped=math[++index];
        // Escaped braces can delimit a mathematical set. Escaped punctuation
        // and spacing commands are not list separators.
        if('({['.includes(escaped))depth++;
        else if(')}]'.includes(escaped))depth=Math.max(0,depth-1);
        result+='\\'+escaped;
        continue;
      }
      if('({['.includes(c))depth++;
      else if(')}]'.includes(c))depth=Math.max(0,depth-1);
      result+=c;
      if(depth===0&&',;'.includes(c)&&!/^\s*\\allowbreak\b/.test(math.slice(index+1)))result+='\\allowbreak ';
    }
    return result;
  };
  const visit=(node,inlineContext=false)=>{
    if(Array.isArray(node)){
      const items=node.map(item=>visit(item,inlineContext));
      return items.some((item,index)=>item!==node[index])?items:node;
    }
    if(node===null||typeof node!=='object')return node;
    let result=node;
    for(const [key,child] of Object.entries(node)){
      const next=visit(child,key==='inlines'||(inlineContext&&key!=='blocks'));
      if(next!==child){
        if(result===node)result={...node};
        result[key]=next;
      }
    }
    // Math blocks and explicitly displayed atoms retain their original layout.
    if(inlineContext&&node.type==='math'&&node.display!==true&&typeof node.latex==='string'){
      const latex=breakInlineMath(node.latex);
      if(latex!==node.latex){
        if(result===node)result={...node};
        result.latex=latex;
      }
    }
    return result;
  };
  let wrapped=value;
  if(typeof value==='string'){
    wrapped=value.replace(/(?<![\\$])\$(?!\$)((?:\\.|[^$])*?)(?<!\\)\$(?!\$)/g,(_,math)=>'$'+breakInlineMath(math)+'$');
  }else if(value&&value.format==='maths-editor-document-v1'){
    wrapped=visit(value);
  }
  return compactAnswerProseGlue(wrapped);
}

// Ratings are pinned presentation metadata, not edits to a bank classification.
export function organiseExercises(source, ratings={}) {
  const project=structuredClone(source);
  project.settings={...project.settings,exerciseOrganisation:'topic',compactAnswers:{...structuredClone(COMPACT_ANSWERS),...structuredClone(project.settings.compactAnswers??{})},flowEdition:'with-short'};
  const sections=[];
  for(let i=0;i<project.sections.length;i++){
    const section=project.sections[i];
    if(section.phase!=='practice'){sections.push(section);continue;}
    // Explicit source boundaries preserve page groups and their question order.
    // Difficulty remains editable metadata, not a request to reorder the source.
    if(project.settings.sourcePaginationPolicy==='source-boundaries'){
      for(const block of section.blocks){
        if(!isPractice(block))continue;
        const rating=ratings[block.bankRef?.id]??ratings[block.id]??block.flow?.localDifficulty??block.flow?.bankDifficulty;
        if(rating&&Number.isFinite(rating.reasoningScore))block.flow={...block.flow,[block.bankRef?.id?'bankDifficulty':'localDifficulty']:{...rating}};
      }
      sections.push(section);
      continue;
    }
    const run=[section];
    while(project.sections[i+1]?.phase==='practice'&&project.sections[i+1].topicId===section.topicId)run.push(project.sections[++i]);
    const blocks=run.flatMap(s=>s.blocks);
    if(project.studio?.flags)project.studio.flags=project.studio.flags.filter(f=>f.id!==`sequence-${section.id}`);
    let uncertain=run.some(s=>s.sequenceUncertain)||blocks.some(b=>['teaching','worked-example','guided-practice','theory','definition','key-ideas'].includes(b.pedagogyRole));
    for(const block of blocks){
      if(isPractice(block)){
        const rating=ratings[block.bankRef?.id]??ratings[block.id]??block.flow?.localDifficulty??block.flow?.bankDifficulty??block.classification;
        if(!rating||!Number.isFinite(rating.reasoningScore))uncertain=true;
        else block.flow={...block.flow,[block.bankRef?.id?'bankDifficulty':'localDifficulty']:{...rating}};
      }
      block.flow={...block.flow,sourcePageBreakBefore:false};
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
    const ownedNodes=b=>{const found=[b];const visit=n=>{if(!n||typeof n!=='object')return;if(n.id)found.push(n);for(const c of n.children??[])visit(c);};visit(b.content);return found;};
    const owner=new Map(units.flatMap((u,j)=>u.blocks.flatMap(b=>ownedNodes(b).map(n=>[n.id,j])))),joined=new Set();
    const references=b=>[...(b.dependsOn??[]),b.pairedBlockId,b.flow?.continuationOf??b.continuationOf].filter(Boolean);
    for(const b of blocks.flatMap(ownedNodes))if(references(b).some(id=>!owner.has(id)))uncertain=true;
    units.forEach((u,j)=>u.blocks.flatMap(ownedNodes).forEach(b=>{
      const targets=references(b).map(id=>owner.get(id)).filter(n=>n!=null);
      if(b.flow?.keepWithNext&&j+1<units.length)targets.push(j+1);
      for(const n of targets)for(let k=Math.min(j,n);k<Math.max(j,n);k++)joined.add(k);
    }));
    const groups=[];units.forEach((u,j)=>{if(j&&joined.has(j-1))groups.at(-1).blocks.push(...u.blocks);else groups.push(u);});
    const score=u=>Math.max(0,...u.blocks.filter(isPractice).map(b=>(b.flow.bankDifficulty??b.flow.localDifficulty).reasoningScore));
    if(!uncertain&&project.settings.questionOrder!=='source')groups.sort((a,b)=>score(a)-score(b)); // Stable ties retain the source sequence.
    if(uncertain&&project.settings.questionOrder!=='source'){
      project.studio??={version:1,flags:[]};project.studio.flags??=[];
      const id=`sequence-${section.id}`;
      project.studio.flags=project.studio.flags.filter(f=>f.id!==id);
      project.studio.flags.push({id,targetId:blocks.find(isPractice)?.id??blocks[0]?.id,note:'Practice run retained in source order: review missing difficulty ratings, topic boundaries or dependencies.',resolved:false,automatic:true});
    }
    const next={...section,title:'Exercise',difficulty:null,showDifficultyHeading:false,blocks:groups.flatMap(u=>u.blocks).map(retainDifficultyAsMetadata)};
    if(run.length>1)next.sourceSections=run.flatMap(sourceSection=>sourceSection.sourceSections??[{
      sourceId:sourceSection.id,title:sourceSection.title,phase:sourceSection.phase,topicId:sourceSection.topicId,
      sourcePageNumber:sourceSection.sourcePageNumber,difficulty:sourceSection.difficulty,
      blockIds:sourceSection.blocks.map(block=>block.id),
    }]);
    delete next.numberingStart;
    sections.push(next);
  }
  project.sections=sections;
  return project;
}

// A compact answer fragment preserves its ancestor path and original part labels.
// Nodes sharing a solution diagram, or explicit dependencies, stay atomic.
export function answerFragments(block, mode = null) {
  const root=structuredClone(block.content),units=[];
  const sourceLabels=block.presentation?.sourceResponseLabels===true?new Map((block.sourceReview?.responses??[]).filter(r=>typeof r.label==='string').map(r=>[r.targetId,r.label])):null;
  const retainDisplay=(node,index=0,parent=null)=>{
    node._answerDisplay={label:answerPartLabel(node,index,parent),context:answerNodeContext(root,node,index,parent)};
    if(sourceLabels?.has(node.id))node._answerDisplay.label=sourceLabels.get(node.id);
    node.children?.forEach((child,childIndex)=>retainDisplay(child,childIndex,node));
  };
  retainDisplay(root);
  const visit=(node,path=[])=>{
    if(isGivenFigureNode(node))return;
    if(!node.children?.length&&!node.answer?.short&&!node.answer?.worked&&block.sourceReview?.responses?.some(r=>r.targetId===node.id&&r.kind==='none'))return;
    if(node.children?.length&&!(mode&&(node.answer?.[mode]||mode==='short'&&node.answer?.solutionDiagrams?.length))&&!node.sharedSolutionDiagrams?.length&&!node.children.some(c=>c.dependsOn?.length))node.children.forEach(c=>visit(c,[...path,node]));
    else units.push({node,path});
  };
  visit(root);
  return units.map(({node,path},index)=>{
    let content=node;
    for(const ancestor of [...path].reverse())content={...ancestor,children:[content]};
    return {...block,content,flow:{...block.flow,answerFragment:index}};
  });
}

// Explicit student continuations cut physical rows across source columns.
// Answer editions read each source column completely, retaining the owning
// block and original leaf IDs for editing and navigation.
export function orderedAnswerUnits(sections,mode) {
  const units=sections.flatMap(section=>section.blocks.map(block=>({blocks:[block],section})));
  const result=[];
  for(let i=0;i<units.length;i++){
    const first=units[i],base=first.blocks[0],chain=[first];let end=i+1;
    while(end<units.length){const next=units[end],b=next.blocks[0],parent=b.flow?.continuationOf??b.continuationOf;
      if(next.section.topicId!==first.section.topicId||!chain.some(u=>u.blocks[0].id===parent))break;
      chain.push(next);end++;
    }
    const columns=base.content?.children;
    const rectangular=chain.length>1&&base.content?.layout==='grid'&&columns?.length>1&&chain.every(({blocks:[b]})=>b.content?.layout==='grid'&&b.content.children?.length===columns.length&&!b.content.answer?.[mode]&&!b.content.sharedSolutionDiagrams?.length&&b.content.children.every(n=>n.children?.length&&!n.answer?.[mode]&&!n.sharedSolutionDiagrams?.length&&!n.dependsOn?.length));
    if(!rectangular){result.push(first);continue;}
    const grouped=chain.map(unit=>({unit,fragments:answerFragments(unit.blocks[0],mode)}));
    for(let column=0;column<columns.length;column++){
      let offset=0;
      for(const {unit,fragments}of grouped){
        const sourceColumn=unit.blocks[0].content.children[column],id=sourceColumn.id;
        const indices=new Map(sourceColumn.children.map((child,index)=>[child.id,index]));
        for(const fragment of fragments.filter(f=>f.content.children?.[0]?.id===id)){
          for(const child of fragment.content.children[0].children??[]){
            if(child.label!=null&&!String(child.label).trim())child._answerDisplay.label=String(offset+indices.get(child.id)+1);
          }
          result.push({...unit,fragments:[fragment]});
        }
        offset+=sourceColumn.children.length;
      }
    }
    i=end-1;
  }
  return result;
}

// Last-resort presentation split for a measured oversized worked leaf. Keep the
// whole editable field and the whole ordered figure group; never slice either.
// Shared/dependent groups and consolidated parent answers remain atomic.
export function workedAnswerDiagramFragments(fragment) {
  if(fragment.flow?.answerContinuation)return null;
  const atomic=node=>node.dependsOn?.length||node.pairedBlockId||node.sharedSolutionDiagrams?.length||node.flow?.keepTogether||node.flow?.keepWithNext||node.flow?.continuationOf||node.continuationOf;
  if(atomic(fragment))return null;
  let leaf=fragment.content;
  while(leaf){
    if(atomic(leaf))return null;
    if(!leaf.children?.length)break;
    if(leaf.children.length!==1||leaf.answer?.worked||leaf.answer?.solutionDiagrams?.length)return null;
    leaf=leaf.children[0];
  }
  if(!leaf?.answer?.worked||!leaf.answer.solutionDiagrams?.length)return null;
  if(atomic(leaf.answer)||leaf.answer.solutionDiagrams.some(atomic))return null;
  const project=(node,figures)=>node===leaf
    ?{...node,answer:figures?{...node.answer,worked:undefined}:{...node.answer,solutionDiagrams:[]}}
    :{...node,children:node.children.map(child=>project(child,figures))};
  return [
    {...fragment,content:project(fragment.content,false)},
    {...fragment,content:project(fragment.content,true),flow:{...fragment.flow,answerFragment:`${fragment.flow.answerFragment}:diagrams`,answerContinuation:'solution-diagrams'}},
  ];
}

export function exerciseLabelWidth(blocks) {
  let length=1;
  for(const block of blocks){
    const walk=(node,path=[],index=0,parent=null)=>{
      const next=answerNodePath(block.content,node,path,index,parent);
      if(node.children?.length)node.children.forEach((c,i)=>walk(c,next,i,node));
      else length=Math.max(length,compactAnswerLabel(block.sourceOrder,next).length);
    };
    walk(block.content);
  }
  return Math.max(8,length*2.1);
}
