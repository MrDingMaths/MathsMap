// Explicit structural recipes. Values, mathematics and review decisions are
// supplied by the worker; expansion never solves a task or grants acceptance.
const readPointer=(body,pointer)=>{
 if(typeof pointer!=='string'||!pointer.startsWith('/')||pointer==='/'||pointer.split('/').some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('Invalid native template slot');
 const keys=pointer.slice(1).split('/').map(k=>k.replaceAll('~1','/').replaceAll('~0','~'));let parent=body;
 for(const key of keys.slice(0,-1)){parent=parent?.[key];if(!parent||typeof parent!=='object')throw Error('Missing native template slot');}
 if(!Object.hasOwn(parent??{},keys.at(-1)))throw Error('Missing native template slot');return {parent,key:keys.at(-1)};
};
export function validateNativeTemplates(catalog){
 if(catalog?.format!=='mathsmap-native-author-templates-v1'||!Array.isArray(catalog.templates))throw Error('Invalid native author templates');
 const ids=new Set();for(const t of catalog.templates){
  if(!t.id||ids.has(t.id)||!t.note?.trim()||!t.body||typeof t.body!=='object'||!Array.isArray(t.slots)||!t.slots.length)throw Error('Templates require a unique ID, native body, slots and source/style note');
  ids.add(t.id);for(const p of t.slots){readPointer(t.body,p);if(t.slots.some(q=>q!==p&&q.startsWith(p+'/'))||t.slots.filter(q=>q===p).length!==1)throw Error('Overlapping native template slots');}
 }return catalog;
}
export function expandNativeTemplates(result,catalog){
 validateNativeTemplates(catalog);const templates=new Map(catalog.templates.map(t=>[t.id,t]));
 const expand=value=>{
  if(Array.isArray(value))return value.map(expand);if(!value||typeof value!=='object')return value;
  if(Object.hasOwn(value,'$nativeTemplate')){
   const t=templates.get(value.$nativeTemplate);if(!t||Object.keys(value).some(k=>!['$nativeTemplate','values'].includes(k))||!value.values||Array.isArray(value.values))throw Error('Invalid native template reference');
   if(JSON.stringify(Object.keys(value.values).sort())!==JSON.stringify([...t.slots].sort()))throw Error('Supply every native template slot exactly once');
   const body=structuredClone(t.body);for(const pointer of t.slots){const {parent,key}=readPointer(body,pointer);parent[key]=expand(value.values[pointer]);}return body;
  }
  return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,expand(v)]));
 };return expand(result);
}
