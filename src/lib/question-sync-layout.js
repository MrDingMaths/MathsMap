import {arrangementCatalog} from './booklet-arrangement.js';

// Structural commands clone blocks, including ones they did not change. Only
// content/type changes need their saved layout pointers reconciled.
export function reconcileProjectLayouts(before, next) {
 const previous=new Map(before.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));
 let layouts=next.settings.layoutOverrides.blockLayouts,changed=false;
 for(const block of next.sections.flatMap(s=>s.blocks)){
  const old=previous.get(block.id),holder=layouts[block.id];
  if(!old||old===block||!holder?.arrangement)continue;
  if(old.type===block.type&&(block.type==='question'
   ?JSON.stringify(old.content)===JSON.stringify(block.content)
   :JSON.stringify(old)===JSON.stringify(block)))continue;
  const updated=structuredClone(holder);
  reconcileSyncLayout(old,block,updated,{editable:true});
  if(JSON.stringify(updated)!==JSON.stringify(holder)){
   if(!changed)layouts={...layouts};
   layouts[block.id]=updated;changed=true;
  }
 }
 return changed?{...next,settings:{...next.settings,layoutOverrides:{...next.settings.layoutOverrides,blockLayouts:layouts}}}:next;
}

// Layout belongs to the destination. Only replace its content pointers; retain
// group structure, item IDs, sizing and spacing when a field changes format.
export function reconcileSyncLayout(before, after, holder, {editable=false}={}) {
 const oldCatalog=arrangementCatalog({...before,type:before.type??'question'},{editable});
 const catalog=arrangementCatalog({...after,type:after.type??'question'},{editable});
 const fieldRefs=entries=>{
  const fields=new Map();
  for(const [ref,e] of entries)if(e.kind==='text'||e.kind==='document'){
   const key=e.ownerId+'/'+e.field;
   if(!fields.has(key))fields.set(key,[]);
   fields.get(key).push(ref);
  }
  return fields;
 };
 const oldFields=fieldRefs(oldCatalog.entries),newFields=fieldRefs(catalog.entries);
 const visit=value=>{
  if(!value||typeof value!=='object')return;
  if(value.arrangement?.root){
   // Turning a single response into a multipart question changes the owner of
   // the old writing space. Recompose that structure so every appended part is
   // present, retaining sizes of surviving diagram and text slots.
   if(before.content?.answer&&!before.content?.children?.length&&after.content?.children?.length&&!after.content?.answer){
    const prior=new Map();const collect=n=>{if(n.ref)prior.set(n.ref,n);n.children?.forEach(collect);};collect(value.arrangement.root);
    const next=structuredClone(catalog.initial.root);
    const preserve=n=>{const old=prior.get(n.ref);if(old)for(const key of ['width','height','weight','align'])if(old[key]!==undefined)n[key]=old[key];n.children?.forEach(preserve);};preserve(next);
    value.arrangement.root=next;
   }
   const tree=value.arrangement.root,items=[];
   const collect=n=>{if(n.type==='item')items.push(n);else n.children?.forEach(collect);};collect(tree);
   const replacements=new Map();
   for(const [field,oldRefs] of oldFields){
    const slots=items.filter(n=>oldRefs.includes(n.ref));
    if(!slots.length)continue;
    const nextRefs=newFields.get(field)??[];
    const retained=new Set(slots.filter(n=>nextRefs.includes(n.ref)).map(n=>n.ref));
    const available=nextRefs.filter(ref=>!retained.has(ref));
    const stale=slots.filter(n=>!retained.has(n.ref));
    stale.forEach((n,i)=>{
     const refs=i===stale.length-1?available.splice(0):available.splice(0,1);
     replacements.set(n,refs.map((ref,j)=>({...n,id:j?`${n.id}:sync:${ref}`:n.id,ref})));
    });
    // New paragraphs can accompany an unchanged first paragraph.
    if(!stale.length&&available.length){
     for(const ref of available){
      const following=nextRefs.slice(nextRefs.indexOf(ref)+1).find(r=>retained.has(r));
      const anchor=following?slots.find(n=>n.ref===following):slots.at(-1);
      const added={...anchor,id:`${anchor.id}:sync:${ref}`,ref};
      const replacement=replacements.get(anchor)??[anchor];
      if(following)replacement.splice(replacement.indexOf(anchor),0,added);else replacement.push(added);
      replacements.set(anchor,replacement);
     }
    }
   }
   const replace=n=>{if(n.children)n.children=n.children.flatMap(c=>{replace(c);return replacements.get(c)??[c];});};replace(tree);
   // A deleted part no longer owns a response space or label. Remove its slots
   // together, while still rejecting unknown references on surviving content.
   const liveOwners=new Set([...catalog.entries.values()].map(entry=>entry.ownerId));
   const deletedOwners=new Set([...oldCatalog.entries.values()].map(entry=>entry.ownerId).filter(id=>!liveOwners.has(id)));
   const prune=n=>{
    if(n.children)n.children=n.children.filter(child=>!deletedOwners.has(child.id?.replace(/:question$/,''))&&!(child.type==='item'&&deletedOwners.has(oldCatalog.entries.get(child.ref)?.ownerId))).map(child=>{prune(child);return child;}).filter(child=>!/:row:\d+$/.test(child.id)||child.children?.some(cell=>cell.children?.length||cell.type==='item'));
   };prune(tree);
   // New givens must appear in the destination's saved layout as well as its
   // content. Insert only newly added diagrams in their existing owner's stack.
   const present=new Set();const index=n=>{if(n.ref)present.add(n.ref);n.children?.forEach(index);};index(tree);
   const initialItems=new Map();const collectInitial=n=>{if(n.ref)initialItems.set(n.ref,n);n.children?.forEach(collectInitial);};collectInitial(catalog.initial.root);
   for(const [ref,entry]of catalog.entries)if(entry.kind==='diagram'&&!oldCatalog.entries.has(ref)&&!present.has(ref)){
    let owner;const find=n=>{if(n.id===entry.ownerId+':question')owner=n;n.children?.forEach(find);};find(tree);
    if(!owner)throw new Error('Bank sync could not place new diagram; review '+ref);
    const node=structuredClone(initialItems.get(ref));
    const at=owner.children.findIndex(child=>catalog.entries.get(child.ref)?.ownerId===entry.ownerId&&catalog.entries.get(child.ref)?.kind!=='label');
    owner.children.splice(at<0?owner.children.length:at,0,node);
   }
   const updated=[];const check=n=>{if(n.type==='item')updated.push(n);else n.children?.forEach(check);};check(tree);
   // Custom arrangements can still point at a whole native field. The renderer
   // expands that alias into its paragraphs while retaining the slot's geometry.
   const missing=updated.filter(n=>!catalog.entries.has(n.ref)&&!catalog.emptyRefs.has(n.ref)&&!newFields.has(n.ref)&&!n.ref.endsWith('/label'));
   if(missing.length)throw new Error('Bank sync could not preserve layout references; review '+missing.map(n=>n.ref).join(', '));
  }
  for(const [key,child] of Object.entries(value))if(key!=='arrangement')visit(child);
 };
 visit(holder);
 return holder;
}
