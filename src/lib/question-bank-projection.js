import {captureQuestionPresentation} from './question-presentation.js';
import {mergeQuestionContent} from './question-sync.js';
import {fromSource,isDocument,contentSource} from './document-content.js';
import {mathSpans} from './practice-question-model.js';

const normal=value=>String(value??'').trim().toLowerCase().replace(/\s+/g,' ');
const nodes=root=>[root,...(root?.children??[]).flatMap(nodes)].filter(Boolean);
const paragraphText=p=>p.type==='paragraph'&&p.inlines?.every(i=>i.type==='text')?p.inlines.map(i=>i.text).join(''):null;
const fieldValue=(node,field)=>field==='prompt'?node.prompt:node.answer?.[field.split('.')[1]];
const setField=(node,field,value)=>{if(field==='prompt')node.prompt=value;else node.answer[field.split('.')[1]]=value;};
function replaceMath(value,replacements){
 if(typeof value==='string'){
  let result=value;
  for(const span of mathSpans(value).sort((a,b)=>b.start-a.start)){
   const replacement=replacements.find(r=>r.from===span.body);if(!replacement)continue;
   const raw=value.slice(span.start,span.end),offset=span.delimiter==='$'?1:2;
   result=result.slice(0,span.start)+raw.slice(0,offset)+replacement.to+raw.slice(offset+span.body.length)+result.slice(span.end);
  }
  return result;
 }
 const copied=structuredClone(value);
 const visit=v=>{if(!v||typeof v!=='object')return;if(v.type==='math'&&typeof v.latex==='string'){const r=replacements.find(r=>r.from===v.latex);if(r)v.latex=r.to;}else if(v.type==='cloze'&&typeof v.answer==='string'){v.answer=replaceMath(v.answer,replacements);}else Object.values(v).forEach(visit);};
 visit(copied);return copied;
}
function contextualPrompt(node){
 const prompt=isDocument(node.prompt)?structuredClone(node.prompt):fromSource(node.prompt??'');
 if(typeof node.prompt==='string')prompt.blocks.forEach((b,i)=>{b.id=`bank-original-${node.id}-${i}`;});
 return prompt;
}

// Convert only literal currency left in text by the same source parser used
// for rendering. Delimited mathematics remains native mathematics.
function currencyDocument(value){
 if(typeof value!=='string'||(value.match(/(?<!\\)\$/g)?.length??0)%2!==1)return null;
 const doc=fromSource(value);let found=false,invalid=false;
 const visit=n=>{if(!n||typeof n!=='object')return;if(n.type==='text')for(const m of String(n.text??'').matchAll(/(?<!\\)\$/g)){found=true;if(!/^\$\d+(?:,\d{3})*(?:\.\d+)?(?=\s|[.,;:!?)]|$)/.test(n.text.slice(m.index)))invalid=true;}Object.values(n).forEach(v=>{if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);});};visit(doc);
 return found&&!invalid?doc:null;
}

// Source metadata identifies a category, never a substring of a mathematical task.
export function bankProjectionPolicy(block){
 if(block.bankRef?.projection?.version===1)return structuredClone(block.bankRef.projection);
 const givenFigureIds=nodes(block.content).filter(n=>n!==block.content&&!n.children?.length&&(!Object.hasOwn(n,'prompt')||!contentSource(n.prompt??'').trim()&&block.sourceReview?.responses?.some(r=>r.targetId===n.id&&r.kind==='none'))&&!n.answer&&n.questionDiagrams?.length).map(n=>n.id);
 const all=nodes(block.content),contains=(parent,id)=>parent.id===id||(parent.children??[]).some(child=>contains(child,id));
 const inheritedTaskNodeIds=(block.sourceReview?.responses??[]).filter(r=>{const binding=r.promptBinding,target=all.find(n=>n.id===r.targetId),owner=all.find(n=>n.id===binding?.ownerId);if(!target||target.children?.length||contentSource(target.prompt??'').trim())return false;const declared=binding?.path==='/prompt'&&owner&&owner!==target&&contains(owner,target.id)&&contentSource(owner.prompt??'').trim();const response=r.kind!=='none'&&target.answer&&all.some(n=>n!==target&&contains(n,target.id)&&contentSource(n.prompt??'').trim());return declared||response;}).map(r=>r.targetId);
 const transparentOverlayIds=all.flatMap(n=>[...(n.answer?.solutionDiagrams??[]),...(n.sharedSolutionDiagrams??[])]).filter(d=>d.format==='tikz'&&d.role==='solution-overlay'&&d.overlayOf&&d.transparent!==true).map(d=>d.id);
 const givenContentIds=(block.sourceReview?.responses??[]).filter(r=>{const n=all.find(n=>n.id===r.targetId);return r.kind==='none'&&n&&n!==block.content&&!n.children?.length&&!contentSource(n.answer?.worked??'').trim()&&!contentSource(n.answer?.short??'').trim()&&!n.answer?.solutionDiagrams?.length&&!n.answer?.tableCells;}).map(r=>r.targetId);
 const groupAnswerIds=all.filter(n=>n.children?.length&&(contentSource(n.answer?.short??'').trim()||contentSource(n.answer?.worked??'').trim()||n.answer?.solutionDiagrams?.length)).map(n=>n.id);
 const solutionContextIds=(block.sourceReview?.responses??[]).filter(r=>{const n=all.find(n=>n.id===r.targetId);return r.kind==='none'&&n&&!n.children?.length&&!contentSource(n.answer?.short??'').trim()&&!contentSource(n.answer?.worked??'').trim()&&n.answer?.solutionDiagrams?.length;}).map(r=>r.targetId);
 const nativeCurrencyFields=all.flatMap(n=>['prompt','answer.short','answer.worked'].filter(field=>currencyDocument(fieldValue(n,field))).map(field=>({nodeId:n.id,field})));
 const given=groupAnswerIds.length||solutionContextIds.length||nativeCurrencyFields.length||givenFigureIds.length||givenContentIds.length||inheritedTaskNodeIds.length||transparentOverlayIds.length?{version:1,...(groupAnswerIds.length?{groupAnswerIds}:{}),...(solutionContextIds.length?{solutionContextIds}:{}),...(nativeCurrencyFields.length?{nativeCurrencyFields}:{}),...(givenContentIds.length?{givenContentIds}:{}),...(givenFigureIds.length?{givenFigureIds}:{}),...(inheritedTaskNodeIds.length?{inheritedTaskNodeIds}:{}),...(transparentOverlayIds.length?{transparentOverlayIds}:{})}:null;
 const heading=block.sourceReview?.sourceCategoryHeading;
 if(!heading)return given;
 const category=normal(heading.text??heading.label??block.sourceReview?.sourceIdentity?.category);
 if(!category)return given;
 const candidates=nodes(block.content).flatMap(node=>(node.prompt?.blocks??[])
  .filter(p=>normal(paragraphText(p))===category)
  .map(p=>({nodeId:node.id,paragraphId:p.id,text:paragraphText(p)})));
 const declared=candidates.filter(p=>[heading.paragraphId,heading.targetId].includes(p.paragraphId));
 if(!declared.length&&candidates.length>1)throw Error('Ambiguous source category heading: '+block.id);
 const omitCategoryHeadings=declared.length?declared:candidates;
 return omitCategoryHeadings.length?{...given,version:1,omitCategoryHeadings}:given;
}

export function projectBankQuestion(block,{overrides,policy=bankProjectionPolicy(block)}={}){
 const projected=structuredClone(block);
 if(overrides)projected.presentation=captureQuestionPresentation(block,overrides);
 if(!policy)return projected;
 if(policy.version!==1)throw Error('Unsupported bank projection policy');
 const refs=new Set(),removedIds=new Set();
 for(const id of policy.groupAnswerIds??[]){const n=nodes(projected.content).find(n=>n.id===id);if(n?.children?.length&&n.answer)n.responseKind='group-answer';}
 for(const id of policy.solutionContextIds??[]){const n=nodes(projected.content).find(n=>n.id===id);if(!n||n.children?.length||!n.answer?.solutionDiagrams?.length)throw Error('Shared solution context changed; review '+id);n.responseSpace='solution-context';}
 for(const entry of policy.nativeCurrencyFields??[]){const n=nodes(projected.content).find(n=>n.id===entry.nodeId);if(n&&typeof fieldValue(n,entry.field)==='string')setField(n,entry.field,fromSource(fieldValue(n,entry.field)));}
 for(const id of policy.transparentOverlayIds??[]){const diagram=nodes(projected.content).flatMap(n=>[...(n.answer?.solutionDiagrams??[]),...(n.sharedSolutionDiagrams??[])]).find(d=>d.id===id);if(diagram?.format==='tikz'&&diagram.overlayOf&&diagram.role==='solution-overlay')diagram.transparent=true;}
 for(const id of policy.inheritedTaskNodeIds??[]){const node=nodes(projected.content).find(n=>n.id===id);if(node)node.responseSpace='scaffold';}
 for(const id of policy.givenContentIds??[]){const node=nodes(projected.content).find(n=>n.id===id);if(!node||node.children?.length||contentSource(node.answer?.worked??'').trim()||contentSource(node.answer?.short??'').trim()||node.answer?.solutionDiagrams?.length)throw Error('Supplied content changed; review '+id);delete node.answer;node.responseSpace='given';}
 for(const id of policy.givenFigureIds??[]){const node=nodes(projected.content).find(n=>n.id===id);if(!node||node.children?.length||node.answer||!node.questionDiagrams?.length)throw Error('Given figure changed; review '+id);node.responseSpace='given';}
 for(const heading of policy.omitCategoryHeadings??[]){
  const node=nodes(projected.content).find(n=>n.id===heading.nodeId);
  if(!node?.prompt?.blocks)continue;
  const paragraph=node.prompt.blocks.find(p=>p.id===heading.paragraphId);
  if(!paragraph)continue;
  if(normal(paragraphText(paragraph))!==normal(heading.text))throw Error('Source category heading changed; review '+heading.paragraphId);
  node.prompt.blocks=node.prompt.blocks.filter(p=>p!==paragraph);
  refs.add(node.id+'/prompt#'+paragraph.id);removedIds.add(paragraph.id);
 }
 for(const replacement of policy.notationReplacements??[]){
  const node=nodes(projected.content).find(n=>n.id===replacement.nodeId);
  if(node)setField(node,replacement.field,replaceMath(fieldValue(node,replacement.field),[replacement]));
 }
 for(const context of policy.prependPromptBlocks??[]){
  const node=nodes(projected.content).find(n=>n.id===context.nodeId);
  if(!node)throw Error('Unknown bank context node: '+context.nodeId);
  const prompt=contextualPrompt(node),ids=new Set(prompt.blocks.map(b=>b.id));
  if(context.blocks.some(b=>!b.id||ids.has(b.id)))throw Error('Bank context needs distinct block IDs');
  node.prompt={...prompt,blocks:[...structuredClone(context.blocks),...prompt.blocks]};
  const visit=value=>{
   if(!value||typeof value!=='object')return;
   if(value.arrangement?.root){
    let inserted=false;
    const walk=group=>{if(!group.children)return;group.children=group.children.flatMap(item=>{
     if(item.type==='item'&&(item.ref===node.id+'/prompt'||item.ref?.startsWith(node.id+'/prompt#'))){
      const original=item.ref===node.id+'/prompt'?prompt.blocks.map(b=>({id:'layout:'+node.id+'/prompt#'+b.id,type:'item',ref:node.id+'/prompt#'+b.id,title:item.title})): [item];
      if(inserted)return original;inserted=true;
      return [...context.blocks.map(b=>({id:'layout:'+node.id+'/prompt#'+b.id,type:'item',ref:node.id+'/prompt#'+b.id,title:'Supplied context'})),...original];
     }
     walk(item);return [item];
    });};walk(value.arrangement.root);
   }
   for(const [key,child]of Object.entries(value))if(key!=='arrangement')visit(child);
  };visit(projected.presentation);
 }
 const prune=node=>{
  if(node.type==='item')return !refs.has(node.ref);
  if(node.children){node.children=node.children.filter(prune);return node.children.length>0;}
  return true;
 };
 const visit=value=>{
  if(!value||typeof value!=='object')return;
  if(value.arrangement?.root)prune(value.arrangement.root);
  for(const key of ['blockLayouts','answerSpaces','diagramColourModes'])if(value[key])for(const id of removedIds)delete value[key][id];
  for(const [key,child] of Object.entries(value))if(key!=='arrangement')visit(child);
 };
 visit(projected.presentation);return projected;
}

// Merge shared content against the projected local tree, then put source-only
// paragraphs back into their original local nodes. This also keeps path matching
// independent of the extra source paragraphs.
export function mergeBankIntoBooklet(incoming,block,base,policy=null){
 const local=projectBankQuestion(block,{policy});
 const merged=mergeQuestionContent(incoming,local.content,base);
 for(const id of policy?.groupAnswerIds??[]){const n=nodes(merged).find(n=>n.id===id),original=nodes(block.content).find(n=>n.id===id);if(n&&original){if(Object.hasOwn(original,'responseKind'))n.responseKind=original.responseKind;else delete n.responseKind;}}
 for(const entry of policy?.nativeCurrencyFields??[]){const n=nodes(merged).find(n=>n.id===entry.nodeId),original=nodes(block.content).find(n=>n.id===entry.nodeId);if(n&&original&&typeof fieldValue(original,entry.field)==='string'&&contentSource(fieldValue(n,entry.field))===contentSource(fromSource(fieldValue(original,entry.field))))setField(n,entry.field,fieldValue(original,entry.field));}
 for(const replacement of policy?.notationReplacements??[]){
  const original=nodes(block.content).find(n=>n.id===replacement.nodeId),target=nodes(merged).find(n=>n.id===replacement.nodeId);
  if(original&&target){
   const before=fieldValue(original,replacement.field);
   // Retain the owner's notation only while that original expression remains.
   if(JSON.stringify(replaceMath(before,[replacement]))!==JSON.stringify(before))setField(target,replacement.field,replaceMath(fieldValue(target,replacement.field),[{from:replacement.to,to:replacement.from}]));
  }
 }
 for(const heading of policy?.omitCategoryHeadings??[]){
  const original=nodes(block.content).find(n=>n.id===heading.nodeId);
  const target=nodes(merged).find(n=>n.id===heading.nodeId);
  const paragraphs=original?.prompt?.blocks;
  const paragraph=paragraphs?.find(p=>p.id===heading.paragraphId);
  if(!paragraph||!target)continue;
  if(!target.prompt?.blocks)target.prompt=fromSource(target.prompt??'');
  const next=target.prompt.blocks;
  const following=paragraphs.slice(paragraphs.indexOf(paragraph)+1).map(p=>p.id);
  const index=next.findIndex(p=>following.includes(p.id));
  next.splice(index<0?Math.min(paragraphs.indexOf(paragraph),next.length):index,0,structuredClone(paragraph));
 }
 for(const context of policy?.prependPromptBlocks??[]){
  const target=nodes(merged).find(n=>n.id===context.nodeId),original=nodes(block.content).find(n=>n.id===context.nodeId);
  if(!target?.prompt?.blocks||!original)continue;
  const ids=new Set(context.blocks.map(b=>b.id));
  target.prompt.blocks=target.prompt.blocks.filter(b=>!ids.has(b.id));
  if(typeof original.prompt==='string'&&JSON.stringify(target.prompt)===JSON.stringify(contextualPrompt(original)))target.prompt=original.prompt;
 }
 return merged;
}
