import {resolveArrangement,applyArrangementContent,findContent,replaceArrangementContent} from './booklet-arrangement.js';
import {copy,findArrangement,arrangementParent,arrangementItems,transformArrangement,group} from '../../public/libs/maths-editor/arrangement-model.mjs';

export function bookletLayoutSelection(project,selection){
 const block=project?.sections.flatMap(s=>s.blocks).find(b=>b.id===selection?.blockId);if(!block)return null;
 const overrides=project.settings.layoutOverrides??{},resolved=resolveArrangement(block,overrides.blockLayouts?.[block.id]?.arrangement,{...overrides,editable:true});
 const node=findArrangement(resolved.tree.root,selection.id);if(!node)return null;
 const options=[];const walk=(n,depth=0)=>{const e=resolved.entries.get(n.ref);if(e?.kind!=='label')options.push({id:n.id,group:n.type==='group',label:'  '.repeat(depth)+(e?.title??n.title??(n.direction==='row'?'Row':'Group'))});n.children?.forEach(c=>walk(c,depth+1));};walk(resolved.tree.root);
 let column=node,row=arrangementParent(resolved.tree.root,node.id);while(row&&row.direction!=='row'){column=row;row=arrangementParent(resolved.tree.root,row.id);}
 return {...resolved,block,node,entry:resolved.entries.get(node.ref),options,parent:arrangementParent(resolved.tree.root,node.id),verticalScope:row?(column.title??'Containing column'):'No containing row',verticalAlign:row?column.verticalAlign??'top':node.verticalAlign??'top'};
}
export function applyBookletLayout(project,selection,command,options={}){
 const info=bookletLayoutSelection(project,selection);if(!info)throw Error('Select an item on the page.');
 let {block,tree,node}=info;
 if(command==='delete'){
  for(const item of arrangementItems(node)){
   const e=resolveArrangement(block,tree,{editable:true}).entries.get(item.ref);if(!e||e.kind==='label')continue;
   if(['text','document'].includes(e.kind)){const result=applyArrangementContent(block,tree,item.id,e,e.nodeId?{...e.value,blocks:[]}: '');block=result.block;tree=result.tree;}
   else if(e.kind==='space')tree=transformArrangement(tree,'properties',item.id,{height:0});
   else if(e.kind==='diagram'){
    block=copy(block);const owner=findContent(block,e.ownerId),parts=e.field?.split('/')??[];let parent=owner;for(const key of parts.slice(0,-1))parent=parent?.[key];const key=parts.at(-1);
    if(Array.isArray(parent?.[key]))parent[key]=parent[key].filter(d=>d.id!==e.diagramId);else if(parent&&key)parent[key]='';
    tree=transformArrangement(tree,'remove',item.id);
   }
  }
 }else if(command==='beside'){
  tree=copy(tree);const target=findArrangement(tree.root,options.targetId),source=findArrangement(tree.root,node.id),parent=arrangementParent(tree.root,node.id),destination=arrangementParent(tree.root,options.targetId);
  if(!parent||!destination||!target||target.id===source.id||findArrangement(source,target.id)||findArrangement(target,source.id))throw Error('Choose another item outside the selection.');
  parent.children.splice(parent.children.indexOf(source),1);
  destination.children.splice(destination.children.indexOf(target),1,group('row:'+crypto.randomUUID(),options.side==='left'?[source,target]:[target,source],'row'));
 }else{
  tree=transformArrangement(tree,command,node.id,options);
  if(command==='properties'&&info.entry?.kind==='diagram')block=replaceArrangementContent(block,info.entry,{...info.entry.value,...(options.width>0?{widthMm:options.width}:{}),...(['left','center','right'].includes(options.align)?{align:options.align}:{})});
 }
 const layouts=project.settings.layoutOverrides?.blockLayouts??{};
 return {...project,sections:project.sections.map(s=>({...s,blocks:s.blocks.map(b=>b.id===block.id?block:b)})),settings:{...project.settings,layoutOverrides:{...project.settings.layoutOverrides,blockLayouts:{...layouts,[block.id]:{...layouts[block.id],arrangement:tree}}}}};
}
