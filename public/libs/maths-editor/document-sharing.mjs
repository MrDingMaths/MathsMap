// Immutable structural sharing for host transactions. This compares only the
// native field, never serialises a booklet or retains a second undo history.
export function shareDocument(previous,next) {
  if(previous===next||next==null||typeof next!=='object')return next;
  if(!previous||typeof previous!=='object'||Array.isArray(previous)!==Array.isArray(next))return next;
  const keys=Object.keys(next),result=Array.isArray(next)?[]:{};
  let same=keys.length===Object.keys(previous).length;
  for(const key of keys){result[key]=shareDocument(previous[key],next[key]);if(result[key]!==previous[key])same=false;}
  return same?previous:result;
}

export function sameDocumentStructure(a,b){
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object')return true;
  if(a.type!==b.type||a.id!==b.id||Array.isArray(a)!==Array.isArray(b))return false;
  if(Array.isArray(a))return a.length===b.length&&a.every((n,i)=>sameDocumentStructure(n,b[i]));
  return ['blocks','inlines','rows','slots','items','annotations'].every(k=>!a[k]&&!b[k]||a[k]&&b[k]&&sameDocumentStructure(a[k],b[k]));
}
