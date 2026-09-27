// Prompt projection only. The complete correction journal remains authoritative.
import {contentNodes} from '../../src/lib/booklet-content-verification.js';

const escape=value=>String(value).replaceAll('~','~0').replaceAll('/','~1');
export function pointerParts(field){
 if(typeof field!=='string'||!field.startsWith('/')||field==='/'||/~(?![01])/u.test(field))throw Error('Invalid correction JSON pointer');
 const parts=field.slice(1).split('/').map(k=>k.replaceAll('~1','/').replaceAll('~0','~'));
 if(parts.some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('Unsafe correction JSON pointer');
 return parts;
}
export function exactField(node,field){
 let value=node;
 for(const key of pointerParts(field)){if(!value||typeof value!=='object'||!Object.hasOwn(value,key))throw Error('Missing field '+field);value=value[key];}
 return value;
}
const contains=(parent,child)=>child===parent||child.startsWith(parent+'/');

export function currentEditorialContext(corrections,page,contextPages,resolvePacket){
 const relevant=new Set([page,...contextPages]),packets=new Map(),candidates=new Map();
 const records=corrections.filter(c=>c.status==='approved').map(c=>({id:c.id,reason:c.reason,patches:c.patches.filter(p=>relevant.has(p.page)).map(p=>{
  const reference={scope:p.scope,page:p.page,targetId:p.targetId,field:p.field};pointerParts(p.field);
  if(p.scope==='inventory'&&p.page===page)return {...reference,appliedToInventory:true};
  const identity=p.scope+':'+p.page;
  if(!packets.has(identity)){
   const packet=resolvePacket(p.scope,p.page),locations=new WeakMap();
   const visit=(v,parts=[])=>{if(!v||typeof v!=='object'||locations.has(v))return;locations.set(v,parts);for(const [key,x]of Object.entries(v))visit(x,[...parts,key]);};visit(packet);
   packets.set(identity,{packet,locations,nodes:p.scope==='inventory'?new Map((packet?.entries??[]).map(n=>[n.id,{node:n}])):contentNodes(packet)});
  }
  const {packet,locations,nodes}=packets.get(identity);
  if(!packet)throw Error('Cannot resolve current correction context '+identity);
  const node=nodes.get(p.targetId)?.node;
  // A later approved replacement can remove an earlier target. Keep its reason
  // and register identity, but never resurrect its obsolete content in a prompt.
  if(!node)return {...reference,superseded:true};
  let value;try{value=exactField(node,p.field);}catch(error){if(error.message.startsWith('Missing field'))return {...reference,superseded:true};throw error;}
  const location='/'+[...locations.get(node),...pointerParts(p.field)].map(escape).join('/'),key=identity+location;
  if(!candidates.has(key))candidates.set(key,{key,identity,location,...reference,value:structuredClone(value),correctionIds:[]});
  candidates.get(key).correctionIds.push(c.id);
  return {...reference,currentValueRef:key};
 })})).filter(c=>c.patches.length);
 const roots=[...candidates.values()].filter(v=>![...candidates.values()].some(a=>a!==v&&a.identity===v.identity&&contains(a.location,v.location)));
 for(const record of records)for(const p of record.patches)if(p.currentValueRef){
  const child=candidates.get(p.currentValueRef),root=roots.find(a=>a.identity===child.identity&&contains(a.location,child.location));
  p.currentValueRef=root.key;if(root!==child)p.within=child.location.slice(root.location.length);
  root.correctionIds.push(record.id);
 }
 return {corrections:records,currentValues:roots.map(({identity,location,correctionIds,...v})=>({...v,correctionIds:[...new Set(correctionIds)]}))};
}
// Scope a decision only when its recorded structured identities resolve in the
// current page inventory. Unknown/prose-only scope stays page-wide; never infer
// ownership from a finding's title or a casual number in its explanation.
export function decisionInventoryIds(issue,inventory){
 let details={};try{details=JSON.parse(issue.message);}catch{}
 const ids=[details?.questionId,details?.entryId,details?.targetId,...(details?.questionIds??[]),...(details?.entryIds??[]),...(details?.targetIds??[]),...(issue.resolution?.projectReviewFlags??[]).flatMap(f=>f.sourceInventoryIds??[])].filter(Boolean);
 const entries=inventory.entries??[],resolve=id=>entries.find(e=>e.id===id||e.targetId===id)?.id;
 if(ids.length){const resolved=ids.map(resolve);return resolved.every(Boolean)?[...new Set(resolved)]:undefined;}
 const mappings=issue.resolution?.questionMappings;
 if(!mappings?.length)return undefined;
 const resolved=[];
 for(const mapping of mappings){
  const label=mapping.questionLabel,match=typeof label==='string'&&label.match(/^(?:[\w -]+ )?Q(\d+)(?:\s*[-–]\s*Q?(\d+))?(?:\([^)]*\))?$/);
  if(!match)return undefined;
  const from=Number(match[1]),to=Number(match[2]??match[1]);if(to<from)return undefined;
  const questions=entries.filter(e=>e.kind==='question'&&!e.exclusionReason),found=questions.filter(e=>{const n=String(e.sourceReview?.sourceIdentity?.questionLabel??e.sourceLabel??'').match(/^(?:Q)?(\d+)(?:\([^)]*\))?$/);return n&&Number(n[1])>=from&&Number(n[1])<=to;});
  if(new Set(found.map(e=>String(e.sourceReview?.sourceIdentity?.questionLabel??e.sourceLabel).match(/\d+/)[0])).size!==to-from+1)return undefined;
  resolved.push(...found.map(e=>e.id));
 }
 return [...new Set(resolved)];
}
