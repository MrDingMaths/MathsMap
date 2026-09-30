import {captureQuestionPresentation} from './question-presentation.js';
import {mergeQuestionContent} from './question-sync.js';
import {fromSource} from './document-content.js';
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
 const visit=v=>{if(!v||typeof v!=='object')return;if(v.type==='math'&&typeof v.latex==='string'){const r=replacements.find(r=>r.from===v.latex);if(r)v.latex=r.to;}else Object.values(v).forEach(visit);};
 visit(copied);return copied;
}

// Source metadata identifies a category, never a substring of a mathematical task.
export function bankProjectionPolicy(block){
 const heading=block.sourceReview?.sourceCategoryHeading;
 if(!heading)return null;
 const category=normal(heading.text??heading.label??block.sourceReview?.sourceIdentity?.category);
 if(!category)return null;
 const candidates=nodes(block.content).flatMap(node=>(node.prompt?.blocks??[])
  .filter(p=>normal(paragraphText(p))===category)
  .map(p=>({nodeId:node.id,paragraphId:p.id,text:paragraphText(p)})));
 const declared=candidates.filter(p=>[heading.paragraphId,heading.targetId].includes(p.paragraphId));
 if(!declared.length&&candidates.length>1)throw Error('Ambiguous source category heading: '+block.id);
 const omitCategoryHeadings=declared.length?declared:candidates;
 return omitCategoryHeadings.length?{version:1,omitCategoryHeadings}:null;
}

export function projectBankQuestion(block,{overrides,policy=bankProjectionPolicy(block)}={}){
 const projected=structuredClone(block);
 if(overrides)projected.presentation=captureQuestionPresentation(block,overrides);
 if(!policy)return projected;
 if(policy.version!==1)throw Error('Unsupported bank projection policy');
 const refs=new Set(),removedIds=new Set();
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
 return merged;
}
