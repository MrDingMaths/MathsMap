import {paragraph,uid} from './document-model.mjs';

// Resolve ownership instead of assuming a selection is a top-level block.
export function locateDocumentNode(doc,id){
 let found;
 const walk=(nodes,parent,ancestors=[])=>{for(let index=0;index<(nodes??[]).length;index++){
  const node=nodes[index];if(node.id===id){found={node,parent,nodes,index,ancestors};return;}
  const next=[...ancestors,node];
  if(node.blocks)walk(node.blocks,node,next);
  if(node.inlines)walk(node.inlines,node,next);
  for(const collection of [node.slots,node.items,node.rows?.flat(),node.annotations])if(collection)walk(collection,node,next);
  if(found)return;
 }};walk(doc.blocks,doc);return found;
}
export function removeDocumentNode(doc,id){
 const target=locateDocumentNode(doc,id);if(!target)throw Error('The selected item is no longer available.');
 if(['cell','list-item'].includes(target.node.type)||target.parent.slots===target.nodes)throw Error('Select the content, or use the row/column controls.');
 target.nodes.splice(target.index,1);
 if(!target.nodes.length&&target.nodes===target.parent.blocks)target.nodes.push(paragraph());
 return target.nodes[Math.min(target.index,target.nodes.length-1)]?.id??target.parent.id??doc.blocks[0]?.id;
}
export function moveDocumentNode(doc,id,targetId,position='before'){
 const source=locateDocumentNode(doc,id),target=locateDocumentNode(doc,targetId);
 if(!source||!target||id===targetId||target.ancestors.some(n=>n.id===id))throw Error('Choose a destination outside the selection.');
 if(source.nodes!==source.parent.blocks||target.nodes!==target.parent.blocks)throw Error('Select a block to reposition.');
 if(position==='inside'){if(target.node.type!=='layout')throw Error('Choose a layout group.');source.nodes.splice(source.index,1);target.node.slots.at(-1).blocks.push(source.node);if(!source.nodes.length)source.nodes.push(paragraph());return id;}
 source.nodes.splice(source.index,1);
 const at=target.nodes.indexOf(target.node);
 if(['left','right'].includes(position)){
  const pair=position==='left'?[source.node,target.node]:[target.node,source.node];
  target.nodes.splice(at,1,{id:uid(),type:'layout',arrangement:'parallel',border:false,padding:0,margin:0,gap:3,columns:2,slots:pair.map(node=>({id:uid(),blocks:[node]}))});
 }else target.nodes.splice(at+(position==='after'?1:0),0,source.node);
 if(!source.nodes.length)source.nodes.push(paragraph());
 return id;
}

export function transformDocumentLayout(doc,id,command,options={}){
 let at=locateDocumentNode(doc,id);
 if(at?.node.type==='inline-image'){
  const paragraphAt=locateDocumentNode(doc,at.parent.id),image=at.node;
  const before={...paragraphAt.node,inlines:at.nodes.slice(0,at.index)},after={...paragraphAt.node,id:uid(),inlines:at.nodes.slice(at.index+1)};
  paragraphAt.nodes.splice(paragraphAt.index,1,before,{...image,type:'image',align:'center',caption:'',crop:[0,0,0,0]},after);at=locateDocumentNode(doc,id);
 }
 if(!at||at.nodes!==at.parent.blocks)throw Error('Select a text, equation, table, image or layout block.');
 if(command==='before'||command==='after'){const to=at.index+(command==='before'?-1:1);if(to>=0&&to<at.nodes.length){at.nodes.splice(at.index,1);at.nodes.splice(to,0,at.node);}}
 else if(command==='move')moveDocumentNode(doc,id,options.targetId,options.position);
 else if(command==='group'){
  const ids=options.ids??[id],nodes=at.nodes.filter(n=>ids.includes(n.id));if(nodes.length!==ids.length)throw Error('Group blocks from the same container.');
  const index=at.nodes.indexOf(nodes[0]);at.nodes.splice(0,at.nodes.length,...at.nodes.filter(n=>!ids.includes(n.id)));const layout={id:uid(),type:'layout',arrangement:'parallel',border:false,padding:0,margin:0,gap:2,columns:1,slots:nodes.map(n=>({id:uid(),blocks:[n]}))};at.nodes.splice(index,0,layout);return layout.id;
 }else if(command==='ungroup'){
  if(at.node.type!=='layout'||at.node.arrangement!=='parallel')throw Error('Select a plain layout group; teaching templates retain their structure.');
  at.nodes.splice(at.index,1,...at.node.slots.flatMap(s=>s.blocks));return at.nodes[at.index]?.id;
 }else if(command==='out'||command==='full-width'){
  const layout=[...at.ancestors].reverse().find(n=>n.type==='layout'&&(command==='out'||n.columns>1));if(!layout)throw Error('This block already spans its container.');
  const destination=locateDocumentNode(doc,layout.id);at.nodes.splice(at.index,1);destination.nodes.splice(destination.index+1,0,at.node);if(!at.nodes.length)at.nodes.push(paragraph());
 }else if(command==='vertical'){
  const slot=[...at.ancestors].reverse().find(n=>n.blocks&&!n.type);if(!slot)throw Error('Place this block beside another item to align its column.');slot.verticalAlign=options.value;
 }else if(command==='direction'){
  if(at.node.type!=='layout')throw Error('Select a layout group.');at.node.columns=options.value==='row'?at.node.slots.length:1;
 }
 return id;
}
