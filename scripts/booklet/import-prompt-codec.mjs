// Lossless delivery compression. Canonical tickets and acceptance stay unchanged.
export const IMPORT_PROMPT_PROFILE='lean-import-context-v1';
export function requireImportPromptProfile(value){
 if(value!==undefined&&value!==IMPORT_PROMPT_PROFILE)throw Error('Unsupported import prompt profile');
 return value;
}
const marker='$importRef',literal='$importLiteral';
const special=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===1&&(Object.hasOwn(v,marker)||Object.hasOwn(v,literal));
export function encodeImportContext(value){
 const counts=new Map(),table=[],indices=new Map();
 const count=v=>{const key=JSON.stringify(v);if(key?.length>=160)counts.set(key,(counts.get(key)??0)+1);if(v&&typeof v==='object')Object.values(v).forEach(count);};count(value);
 const encode=(v,own)=>{
  const key=JSON.stringify(v);
  if(key!==own&&(counts.get(key)??0)>1){
   if(!indices.has(key)){const index=table.length;indices.set(key,index);table.push(null);table[index]=encode(v,key);}
   return {[marker]:indices.get(key)};
  }
  if(Array.isArray(v))return v.map(x=>encode(x));
  if(v&&typeof v==='object'){
   const entries=Object.entries(v).map(([k,x])=>[k,encode(x)]);
   return special(v)?{[literal]:entries}:Object.fromEntries(entries);
  }
  return v;
 };
 const context=encode(value);
 return {format:IMPORT_PROMPT_PROFILE,sharedValues:table,context};
}
export function decodeImportContext(packet){
 if(packet?.format!==IMPORT_PROMPT_PROFILE||!Array.isArray(packet.sharedValues))throw Error('Invalid import context');
 const stack=new Set();
 const decode=v=>{
  if(Array.isArray(v))return v.map(decode);
  if(!v||typeof v!=='object')return v;
  if(special(v)&&Object.hasOwn(v,marker)){
   const index=v[marker];if(!Number.isSafeInteger(index)||index<0||index>=packet.sharedValues.length||stack.has(index))throw Error('Invalid or cyclic import value reference');
   stack.add(index);const result=decode(packet.sharedValues[index]);stack.delete(index);return result;
  }
  const entries=special(v)&&Object.hasOwn(v,literal)?v[literal]:Object.entries(v);
  if(!Array.isArray(entries)||entries.some(e=>!Array.isArray(e)||e.length!==2||typeof e[0]!=='string'))throw Error('Invalid literal import value');
  return Object.fromEntries(entries.map(([k,x])=>[k,decode(x)]));
 };
 return decode(packet.context);
}
export function compactImportPrompt(prompt){
 // Both canonical assessment and assignment prompts end with their JSON context.
 const positions=[...prompt.matchAll(/(?:^|\n\n)(?=\{)/g)].map(m=>m.index+m[0].length).reverse();
 for(const start of positions){
  let context;try{context=JSON.parse(prompt.slice(start));}catch{continue;}
  if(context?.format===IMPORT_PROMPT_PROFILE)return {prompt,originalCharacters:prompt.length,deliveredCharacters:prompt.length,sharedValues:0};
  const encoded=encodeImportContext(context);
  if(JSON.stringify(decodeImportContext(encoded))!==JSON.stringify(context))throw Error('Import delivery reconstruction differs from its canonical context');
  const instructions='\n\nLossless context index: objects containing only $importRef resolve to that zero-based sharedValues entry; $importLiteral contains original object entries. Expand references when reading or making exact-field repairs. Every original field and value is retained. Return the normal canonical result schema, never encoded references.\n\n';
  const proposed=prompt.slice(0,start).trimEnd()+instructions+JSON.stringify(encoded);
  return {prompt:proposed.length<prompt.length?proposed:prompt,originalCharacters:prompt.length,deliveredCharacters:Math.min(proposed.length,prompt.length),sharedValues:proposed.length<prompt.length?encoded.sharedValues.length:0};
 }
 return {prompt,originalCharacters:prompt.length,deliveredCharacters:prompt.length,sharedValues:0};
}
