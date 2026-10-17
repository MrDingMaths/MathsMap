import {resolveArrangement,applyArrangementContent,findContent,replaceArrangementContent,setGroupAnswerSpaceHeight} from './booklet-arrangement.js';
import {copy,findArrangement,arrangementParent,arrangementItems,transformArrangement,group} from '../../public/libs/maths-editor/arrangement-model.mjs';

// Document containers have spacing inside the page-arrangement item as well.
// Only offer fields consumed by that container's renderer.
export function containerSpacingFields(node){
 if(node?.type==='cell')return ['Top','Right','Bottom','Left'].map(side=>['padding'+side,'Cell '+side.toLowerCase()+' padding (mm)',2,20]);
 if(node?.type==='paragraph')return [['spaceBefore','Space before (mm)',0,300],['spaceAfter','Space after (mm)',2,300],['indent','Indent (mm)',0,300],['lineHeight','Line spacing',1.4,3,1]];
 if(node?.type==='spacer')return [['height','Height (mm)',15,250]];
 if(node?.type==='image')return [['width','Image width (mm)',80,190,5],['spaceBefore','Space above image (mm)',2,80],['spaceAfter','Space below image (mm)',2,80]];
 if(node?.type==='inline-image')return [['width','Image width (mm)',18,190,.5]];
 if(node?.type==='list')return [['indent','List indent (mm)',7,50,1]];
 if(node?.type==='table')return [['widthMm','Table width (mm)',80,190,10],['marginBefore','Space above table (mm)',2,30],['marginAfter','Space below table (mm)',2,30],['padding','Table cell padding (mm)',2,20]];
 if(node?.type!=='layout')return [];
 const speech=node.arrangement==='speech-bubble',cards=node.arrangement==='cards',labelled=cards&&node.slots?.some(s=>s.label!=null);
 return [['margin','Outer spacing (mm)',speech?.5:3],...(speech||labelled?[]:[['padding','Inner padding (mm)',3]]),...(speech||cards?[['paddingHorizontalMm','Frame horizontal padding (mm)',speech?4:2],['paddingVerticalMm','Frame vertical padding (mm)',speech&&node.slots?.length!==1?4:2]]:[]),...((node.slots?.length??0)>1?[['gap','Column gap (mm)',3]]:[])];
}

export function bookletLayoutSelection(project,selection){
 const block=project?.sections.flatMap(s=>s.blocks).find(b=>b.id===selection?.blockId);if(!block)return null;
 const overrides=project.settings.layoutOverrides??{},resolved=resolveArrangement(block,overrides.blockLayouts?.[block.id]?.arrangement,{...overrides,editable:true});
 const node=findArrangement(resolved.tree.root,selection.id);if(!node)return null;
 const options=[];const walk=(n,depth=0)=>{const e=resolved.entries.get(n.ref);if(e?.kind!=='label')options.push({id:n.id,group:n.type==='group',label:'  '.repeat(depth)+(e?.title??n.title??(n.direction==='row'?'Row':'Group'))});n.children?.forEach(c=>walk(c,depth+1));};walk(resolved.tree.root);
 let column=node,row=arrangementParent(resolved.tree.root,node.id);while(row&&row.direction!=='row'){column=row;row=arrangementParent(resolved.tree.root,row.id);}
 const spaces=arrangementItems(node).filter(n=>resolved.entries.get(n.ref)?.kind==='space'),heights=spaces.map(n=>n.height??resolved.entries.get(n.ref).value);
 return {...resolved,block,node,entry:resolved.entries.get(node.ref),options,spaces,spaceHeight:heights.length&&heights.every(h=>h===heights[0])?heights[0]:'',parent:arrangementParent(resolved.tree.root,node.id),verticalScope:row?(column.title??'Containing column'):'No containing row',verticalAlign:row?column.verticalAlign??'top':node.verticalAlign??'top'};
}
export function applyBookletLayout(project,selection,command,options={}){
 const info=bookletLayoutSelection(project,selection);if(!info)throw Error('Select an item on the page.');
 let {block,tree,node}=info;
 if(command==='answer-spaces'){
  if(!info.spaces.length||!Number.isFinite(options.value)||options.value<0||options.value>180)throw Error('Enter an answer-space height between 0 and 180 mm.');
  tree=setGroupAnswerSpaceHeight(tree,info.entries,node.id,options.value);
 }else if(command==='document-spacing'){
  const entry=info.entry,document=entry?.value,content=document?.blocks?.[0];
  const field=containerSpacingFields(content).find(([key])=>key===options.property);
  const autoWidth=content?.type==='table'&&options.property==='widthMm'&&options.value===null;
  if(document?.blocks?.length!==1||!field||!autoWidth&&(!Number.isFinite(options.value)||options.value<(field[4]??0)||options.value>(field[3]??20)))throw Error('Choose a supported container spacing within its displayed limits.');
  const next=copy(document);next.blocks[0][options.property]=options.value;
  block=replaceArrangementContent(block,entry,next);
 }else if(command==='delete'){
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
 const answerSpaces={...project.settings.layoutOverrides.answerSpaces};
 if(command==='answer-spaces')for(const space of info.spaces)answerSpaces[info.entries.get(space.ref).ownerId]=options.value;
 return {...project,sections:project.sections.map(s=>({...s,blocks:s.blocks.map(b=>b.id===block.id?block:b)})),settings:{...project.settings,layoutOverrides:{...project.settings.layoutOverrides,...(command==='answer-spaces'?{answerSpaces}:{}),blockLayouts:{...layouts,[block.id]:{...layouts[block.id],arrangement:tree}}}}};
}
