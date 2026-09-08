// Shared content excludes placement, spacing and bank-owned teaching metadata.
const LOCAL = new Set(['layout','columns','answerColumns','layoutPreset','diagramPlacement','answerSpaceMm','answerSpaceStyle','responseSpace','widthMm','heightMm','widthCm','heightCm','printWidthMm','widths','rowHeights','padding','spaceBefore','spaceAfter','indent','lineHeight','marginBefore','marginAfter','teachingMapping','presentation','reviewStatus','spec','sourceAssetOccurrenceId','rasterReason']);
const copy=structuredClone;
function walk(v,fn,path=[]){if(!v||typeof v!=='object')return;fn(v,path);for(const[k,x]of Object.entries(v))if(x&&typeof x==='object')walk(x,fn,[...path,k]);}
export function sharedQuestion(value){
 const ids=new Map();walk(value.content,n=>{if(n.id&&!ids.has(n.id))ids.set(n.id,'node-'+ids.size);});
 function clean(v){
  if(typeof v==='string')return ids.get(v)??v;
  if(Array.isArray(v))return v.map(clean);
  if(!v||typeof v!=='object')return v;
  return Object.fromEntries(Object.keys(v).sort().filter(k=>!LOCAL.has(k)&&!(k==='code'&&v.mathematicalModel)).map(k=>[ids.get(k)??k,clean(v[k])]));
 }
 return {title:value.title??'',content:clean(value.content)};
}
export function mergeQuestionContent(incoming,local,base=null){
 const localById=new Map(),basePaths=new Map(),localPaths=new Map();
 walk(local,n=>{if(n.id)localById.set(n.id,n);});
 walk(local,(n,p)=>{if(n.id)localPaths.set(p.join('/'),n);});
 if(base)walk(base,(n,p)=>{if(n.id)basePaths.set(n.id,p.join('/'));});
 const ids=new Map(),localFor=new Map();
 walk(incoming,n=>{
  if(!n.id)return;
  const match=localById.get(n.id)??localPaths.get(basePaths.get(n.id));
  ids.set(n.id,match?.id??`${local.id}-bank-${n.id}`);
  if(match)localFor.set(n.id,match);
 });
 function merge(v,previous=null){
  if(typeof v==='string')return ids.get(v)??v;
  if(Array.isArray(v))return v.map((x,i)=>merge(x,previous?.[i]));
  if(!v||typeof v!=='object')return v;
  previous=localFor.get(v.id)??previous;
  const result=Object.fromEntries(Object.entries(v).map(([k,x])=>[ids.get(k)??k,merge(x,previous?.[k])]));
  if(previous)for(const k of LOCAL){if(Object.hasOwn(previous,k))result[k]=copy(previous[k]);else delete result[k];}
  return result;
 }
 return merge(incoming);
}
