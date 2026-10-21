// The content identity used by import reuse and shared content: what a block
// prints mathematically, independent of local IDs, numbering and layout. Kept
// free of the review toolchain so the Studio server can load it cheaply.
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {questionReviewContent} from '../../src/lib/booklet-review-profile.js';

const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Colours and mathematical diagram code remain significant. Only identity and
// presentation are omitted; never normalise text, values or diagram labels.
const omitted=new Set(['id','number','questionNumber','sourceOrder','sourcePageNumber','sourceLabel','sourceAtom','reuse']);
export const remapReference=(value,ids)=>value.split(/([/#:])/).map(part=>ids.get(part)??part).join('');
export const referenceField=key=>/(?:Id|Ids)$/.test(key)||['ref','refs','overlayOf','target','targets'].includes(key);
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(!value||typeof value!=='object')return value;
 return Object.fromEntries(Object.keys(value).sort().filter(k=>!omitted.has(k)&&!(k==='label'&&value.type==='question'&&/^\d+$/.test(String(value[k])))).map(k=>[k,canonical(value[k])]));
}
function mathematicalContent(value){
 const projected=questionReviewContent(value);
 function restore(original,copy){
  if(!original||typeof original!=='object'||!copy||typeof copy!=='object')return;
  // Semantic colour and teaching responses are printable mathematical content.
  for(const key of ['colour','color'])if(Object.hasOwn(original,key))copy[key]=original[key];
  if(original.sourceReview?.responses)copy.teachingResponses=structuredClone(original.sourceReview.responses);
  for(const [key,child]of Object.entries(original))restore(child,copy[key]);
 }
 restore(value,projected);return projected;
}
// Assign identities by structural position before sorting/omitting fields.
// References retain their topology while local names can change freely.
function contentPositions(content){
 const ids=new Map();
 function collect(value,position='$'){
  if(!value||typeof value!=='object')return;
  if(typeof value.id==='string')ids.set(value.id,position);
  for(const [key,child]of Object.entries(value))if(!omitted.has(key))collect(child,position+'/'+key);
 }
 collect(content);return ids;
}
// Node ID -> structural position. Two blocks with equal reuseContentHash give
// the same positions, so copies with different local IDs correspond node by node.
export const reuseNodePositions=block=>contentPositions(mathematicalContent(block));
export function reuseContentValue(block){
 const content=mathematicalContent(block),ids=contentPositions(content);
 function references(value,field=''){
  if(Array.isArray(value))return value.map(child=>references(child,field));
  if(!value||typeof value!=='object'){
   if(!referenceField(field)||typeof value!=='string')return value;
   const mapped=remapReference(value,ids);return mapped===value?value:{localReference:mapped};
  }
  return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,key==='id'?child:references(child,key)]));
 }
 return canonical(references(content));
}
export const reuseContentHash=block=>sha(reuseContentValue(block));
export function changedReviewFields(before,after){
 const result=[],escape=s=>String(s).replaceAll('~','~0').replaceAll('/','~1');
 const visit=(a,b,field='')=>{
  if(isDeepStrictEqual(a,b))return;
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
   for(const key of new Set([...Object.keys(a),...Object.keys(b)]))visit(a[key],b[key],field+'/'+escape(key));
  }else result.push({field,original:a??null,current:b??null});
 };
 visit(reuseContentValue(before),reuseContentValue(after));return result;
}
