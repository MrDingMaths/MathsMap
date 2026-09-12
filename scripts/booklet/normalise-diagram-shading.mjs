// Exact-source, reviewed maintenance; dry run by default. Never guess from hue.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {normaliseDiagramColours} from './normalise-diagram-colours.mjs';
const hash=source=>createHash('sha256').update(source).digest('hex');
const evidence=new Set(['source','spec','sourceReview','sourceAtom','sourceLayoutEvidence','originalDiagram','originalContent','before','after','mathematicalModel','provenance']);
export function migrateDiagramShading(value,changes,imageReplacements={}){
 const next=structuredClone(value),records=[];
 function walk(node,location=''){
  if(!node||typeof node!=='object')return;
  const replacement=node.format==='image'?imageReplacements[node.src]:null;
  if(replacement){
   if(replacement.status!=='accepted'||!replacement.code?.includes('\\begin{tikzpicture}')||hash(replacement.code)!==replacement.afterHash||!replacement.reason?.trim())throw Error('Invalid reviewed image replacement');
   const original=structuredClone(node);
   node.format='tikz';node.code=replacement.code;
   node.spec={...node.spec,originalDiagram:original,shadingOverride:replacement.reason};
   records.push({id:node.id,location,before:hash(JSON.stringify(original)),after:replacement.afterHash,reason:replacement.reason,replacement:true});
  }
  for(const [key,value]of Object.entries(node)){
   if(evidence.has(key))continue;
   const at=location+'/'+key;
   if(typeof value==='string'){
    const replace=code=>{const before=hash(code),change=changes[before];if(!change)return code;
     if(change.status!=='accepted'||change.before!==code||hash(change.after)!==change.afterHash||!change.reason?.trim())throw Error('Invalid reviewed shading change at '+at);
     records.push({id:node.id,location:at,before,after:change.afterHash,reason:change.reason});return change.after;};
    if(key==='code'&&value.includes('\\begin{tikzpicture}'))node[key]=replace(value);
    else if(value.includes('[tikz]'))node[key]=value.replace(/\[tikz\]([\s\S]*?)\[\/tikz\]/g,(_,code)=>'[tikz]'+replace(code)+'[/tikz]');
   }else walk(value,at);
  }
 }
 walk(next);return {next,records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const arg=k=>{const i=process.argv.indexOf(k);return i<0?null:process.argv[i+1];};
 const register=JSON.parse(fs.readFileSync(arg('--reviews')??'booklets/provenance/diagram-shading-2026-09-12.json','utf8'));
 for(const [src,replacement]of Object.entries(register.imageReplacements??{})){
  const publicRoot=path.resolve('public'),file=path.resolve(publicRoot,'.'+src);
  if(!src.startsWith('/')||!file.startsWith(publicRoot+path.sep)||hash(fs.readFileSync(file))!==replacement.sourceHash)throw Error('Image evidence changed since review: '+src);
 }
 const result=await normaliseDiagramColours({apply:process.argv.includes('--apply'),migrate:value=>migrateDiagramShading(value,register.changes,register.imageReplacements),policy:'Unshaded by default; purposeful mathematical or demonstrated clarity fills only.'});
 if(arg('--report'))fs.writeFileSync(arg('--report'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({applied:result.applied,files:result.files,projects:result.projects.map(p=>({id:p.id,changes:p.records.length})),bank:result.bank.length}));
}
