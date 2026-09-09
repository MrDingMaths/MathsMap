import {arrangementCatalog} from './booklet-arrangement.js';

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
   const updated=[];const check=n=>{if(n.type==='item')updated.push(n);else n.children?.forEach(check);};check(tree);
   const missing=updated.filter(n=>!catalog.entries.has(n.ref)&&!catalog.emptyRefs.has(n.ref)&&!n.ref.endsWith('/label'));
   if(missing.length)throw new Error('Bank sync could not preserve layout references; review '+missing.map(n=>n.ref).join(', '));
  }
  for(const [key,child] of Object.entries(value))if(key!=='arrangement')visit(child);
 };
 visit(holder);
 return holder;
}
