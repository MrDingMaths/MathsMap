import {isDocument,fromSource,contentSource} from './document-content.js';

export function tableResponseDocument(document,block){
 const bindings=block.sourceReview?.tableResponses;
 if(!isDocument(document)||!bindings?.length)return document;
 const owners=new Map();
 const collect=node=>{if(!node)return;owners.set(node.id,node);node.children?.forEach(collect);};collect(block.content);
 const result=structuredClone(document);let changed=false;
 const find=(node,id)=>{if(!node||typeof node!=='object')return null;if(node.id===id)return node;for(const child of Object.values(node)){if(Array.isArray(child)){for(const value of child){const found=find(value,id);if(found)return found;}}else if(child&&typeof child==='object'){const found=find(child,id);if(found)return found;}}return null;};
 for(const binding of bindings){
  const cell=find(result,binding.cellId),owner=owners.get(binding.targetId),answer=owner?.answer?.[binding.field??'short'];
  if(cell?.type!=='cell'||answer==null)continue;
  if(binding.choices?.length){
   const text=contentSource(answer).trim().toLowerCase();
   cell.blocks=[{id:cell.id+'-answer-choice',type:'paragraph',align:cell.align??'center',inlines:binding.choices.flatMap((choice,i)=>[...(i?[{type:'text',text:' | '}]:[]),{type:'text',text:choice},...(text.startsWith(choice.toLowerCase())?[{type:'text',text:' '},{type:'math',latex:'\\checkmark',colour:'#268cff',semanticRole:'correctness-marker'}]:[])])}];changed=true;continue;
  }
  if(binding.when){
   const text=contentSource(answer).trim().toLowerCase(),choice=binding.when.toLowerCase();
   if(!text.startsWith(choice)||text.length>choice.length&&!/[\s.!;,]/.test(text[choice.length]))continue;
   const paragraph=cell.blocks.find(p=>p.type==='paragraph');if(!paragraph)continue;
   paragraph.inlines.push({type:'text',text:' '},{type:'math',latex:'\\checkmark',colour:'#268cff',semanticRole:'correctness-marker'});changed=true;continue;
  }
  let source=isDocument(answer)?answer:fromSource(answer);
  if(binding.nodeId){const node=find(source,binding.nodeId);if(!node)continue;source={...source,blocks:[structuredClone(node)]};}
  const blocks=structuredClone(source.blocks);
  let serial=0;
  const prepare=node=>{if(!node||typeof node!=='object')return;if(node.id)node.id=cell.id+'-answer-'+serial++;if(node.type==='paragraph'){node.align=cell.align??'center';if(binding.mathOnly)node.inlines=node.inlines.filter(i=>i.type==='math');for(const inline of node.inlines??[])if(['math','text'].includes(inline.type)&&!inline.colour)inline.colour='#268cff';}for(const child of Object.values(node))if(Array.isArray(child))child.forEach(prepare);else if(child&&typeof child==='object')prepare(child);};blocks.forEach(prepare);
  cell.blocks=blocks;changed=true;
 }
 return changed?result:document;
}
