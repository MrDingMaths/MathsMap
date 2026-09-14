// JSON-only patches for the ephemeral persistence worker; never stored in projects.
export function createSavePatch(before,after,path=[],patch=[]){
 if(before===after)return patch;
 if(!before||!after||typeof before!=='object'||typeof after!=='object'||Array.isArray(before)!==Array.isArray(after)||Array.isArray(after)&&before.length!==after.length){patch.push({path,value:after});return patch;}
 for(const key of Object.keys(before))if(!Object.hasOwn(after,key))patch.push({path:[...path,key],remove:true});
 for(const key of Object.keys(after))createSavePatch(before[key],after[key],[...path,key],patch);return patch;
}
export function applySavePatch(project,patch){
 const replace=(node,path,value,remove)=>{if(!path.length)return value;const [key,...tail]=path;if(['__proto__','prototype','constructor'].includes(key))throw Error('Invalid save patch path');const next=Array.isArray(node)?[...node]:{...node};if(remove&&!tail.length)delete next[key];else next[key]=replace(node?.[key],tail,value,remove);return next;};
 return patch.reduce((value,operation)=>replace(value,operation.path,operation.value,operation.remove),project);
}

// Apply server acknowledgements to the revision that is still being edited.
// Keyed arrays follow live ownership/order so a moved question receives its bank
// metadata at its new location. Concurrent text remains the live text.
export function reconcileSaveAcknowledgement(before,live,saved){
 const oldBlocks=new Map(before.sections?.flatMap(s=>s.blocks.map(b=>[b.id,b]))??[]),savedBlocks=new Map(saved.sections?.flatMap(s=>s.blocks.map(b=>[b.id,b]))??[]);
 const merge=(before,live,saved)=>{
 if(live===before)return saved;if(saved===before||live===saved)return live;
 if(!before||!live||!saved||typeof live!=='object'||typeof saved!=='object')return live;
 if(Array.isArray(live)||Array.isArray(saved)){
  if(![before,live,saved].every(a=>Array.isArray(a)&&a.every(n=>n&&typeof n==='object'&&typeof n.id==='string')))return live;
  const base=new Map(before.map(n=>[n.id,n])),remote=new Map(saved.map(n=>[n.id,n]));
  const result=live.map(n=>merge(base.get(n.id),n,remote.get(n.id)));
  for(const n of saved)if(!base.has(n.id)&&!live.some(l=>l.id===n.id))result.push(n);
  return result.length===live.length&&result.every((n,i)=>n===live[i])?live:result;
 }
 const result={...live};let changed=false;
 for(const key of new Set([...Object.keys(before),...Object.keys(saved)])){
  if(['__proto__','prototype','constructor'].includes(key))throw Error('Invalid save acknowledgement key');
  const value=merge(before[key],live[key],saved[key]);
  if(value!==live[key]){changed=true;if(value===undefined)delete result[key];else result[key]=value;}
 }return changed?result:live;
 };
 const result=merge(before,live,saved);if(!result.sections)return result;let movedMetadata=false;
 const sections=result.sections.map(section=>{let changed=false;const blocks=section.blocks.map(block=>{const original=oldBlocks.get(block.id),remote=savedBlocks.get(block.id);if(!original||!remote||original===remote)return block;const next=merge(original,block,remote);changed||=next!==block;return next;});if(!changed)return section;movedMetadata=true;return {...section,blocks};});
 return movedMetadata?{...result,sections}:result;
}
