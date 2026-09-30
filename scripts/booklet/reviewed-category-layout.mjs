import {arrangementCatalog,resolveArrangement} from '../../src/lib/booklet-arrangement.js';

const normal=value=>String(value??'').toLowerCase().replace(/\s/g,'');
const refs=node=>node.type==='item'?[node.ref]:(node.children??[]).flatMap(refs);

// A reviewed paragraph insertion must also extend a saved explicit arrangement.
// Only source-confirmed category headings are eligible; source/content stay intact.
export function reconcileReviewedCategoryLayouts(project){
 if(project.source?.reviewProfile!=='textbook-three-pass-v1')return [];
 const changed=[];
 for(const block of project.sections.flatMap(section=>section.blocks)){
  const document=block.content?.prompt,heading=document?.format==='maths-editor-document-v1'?document.blocks?.[0]:null;
  const declared=block.sourceReview?.sourceCategoryHeading;
  if(!heading||heading.type!=='paragraph'||heading.inlines?.some(inline=>inline.type!=='text'))continue;
  if(!heading.id?.endsWith('-category-heading')&&![declared?.targetId,declared?.paragraphId].includes(heading.id))continue;
  const text=heading.inlines.map(inline=>inline.text).join('');
  if(!normal(text)||normal(text)!==normal(block.sourceReview?.sourceIdentity?.category))throw Error('Reviewed category heading does not match source identity: '+block.id);
  const ref=block.content.id+'/prompt#'+heading.id;
  const local=block.presentation?.layoutOverrides?.blockLayouts?.[block.id],global=project.settings?.layoutOverrides?.blockLayouts?.[block.id];
  const stored=global?.arrangement??local?.arrangement;
  if(stored&&refs(stored.root).includes(ref))continue;
  let tree;
  if(stored){
   // Native-field aliases expand once, keeping their sizing at the original slot.
   tree=resolveArrangement(block,structuredClone(stored),{},170).tree;
   const remove=node=>{if(node.type==='item')return node.ref!==ref;node.children=node.children.filter(remove);return node.children.length>0;};
   tree.root.children=tree.root.children.filter(remove);
   const headingItem={id:block.id+'-reviewed-category-item',type:'item',ref,align:'left'};
   if(tree.root.direction==='row')tree.root={id:block.id+'-reviewed-category-stack',type:'group',direction:'stack',gap:2,children:[headingItem,tree.root]};
   else tree.root.children.unshift(headingItem);
  }else{
   tree=structuredClone(arrangementCatalog(block,{},170).initial);
   const headingItem=tree.root.children.find(child=>child.ref===ref),label=tree.root.children.find(child=>child.ref===block.content.id+'/label');
   if(!headingItem||!label)throw Error('Reviewed heading or question label missing from native catalog: '+block.id);
   const body=tree.root.children.filter(child=>child!==headingItem&&child!==label);
   label.width=7;
   tree.root.children=[headingItem,{id:block.id+'-reviewed-numbered-row',type:'group',direction:'row',gap:0,verticalAlign:'top',children:[label,{id:block.id+'-reviewed-numbered-body',type:'group',direction:'stack',gap:0,children:body}]}];
  }
  const resolved=resolveArrangement(block,tree,{},170),placed=new Set(refs(resolved.tree.root));
  if(resolved.missing.length)throw Error('Reviewed category arrangement has missing references: '+block.id);
  for(const entry of resolved.entries.values())if(['text','document','diagram'].includes(entry.kind)&&(!entry.role||entry.role==='content')&&!placed.has(entry.ref))throw Error('Reviewed category arrangement omits content: '+entry.ref);
  block.presentation??={};block.presentation.layoutOverrides??={};block.presentation.layoutOverrides.blockLayouts??={};
  block.presentation.layoutOverrides.blockLayouts[block.id]={...local,arrangement:tree};
  project.settings??={};project.settings.layoutOverrides??={};project.settings.layoutOverrides.blockLayouts??={};
  project.settings.layoutOverrides.blockLayouts[block.id]={...global,arrangement:structuredClone(tree)};
  changed.push(block.id);
 }
 return changed;
}
