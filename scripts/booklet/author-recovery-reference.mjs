import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
// Advisory source material only. This never restores a cache or acceptance.
// Use complete prior packets only when this exact assignment's independently
// inventoried entries and page ownership remain unchanged.
export function retainedAssignmentReference(directory,assignment,{maxCharacters=200000}={}){
 const names=fs.readdirSync(directory).filter(n=>/^\d+$/.test(n)).sort((a,b)=>Number(b)-Number(a));
 for(const name of names){
  const folder=path.join(directory,name),input=path.join(folder,'task-input.json'),file=path.join(folder,'generation.json');
  if(!fs.existsSync(input)||!fs.existsSync(file))continue;
  if(fs.realpathSync(folder)!==path.resolve(folder)||fs.realpathSync(input)!==path.resolve(input)||fs.realpathSync(file)!==path.resolve(file))throw Error('Retained assignment reference must be canonical');
  const before=[sha(input),sha(file)];let saved,value;
  try{saved=JSON.parse(fs.readFileSync(input));value=JSON.parse(fs.readFileSync(file));}catch{continue;}
  const old=saved.assignment;
  if(old?.id!==assignment.id||!isDeepStrictEqual(old.pages,assignment.pages)||!isDeepStrictEqual(old.entries,assignment.entries)||!isDeepStrictEqual(old.inventoryIds,assignment.inventoryIds))continue;
  if(!Array.isArray(value.packets)||value.packets.length!==assignment.pages.length||new Set(value.packets.map(p=>p.pageNumber)).size!==assignment.pages.length||value.packets.some(p=>!assignment.pages.includes(p.pageNumber)||!Array.isArray(p.sections)||!p.sections.some(s=>s.blocks?.length)))continue;
  const text=JSON.stringify(value);if(text.length>maxCharacters)continue;
  const artifacts=[{path:input,hash:before[0]},{path:file,hash:before[1]}];
  if(artifacts.some(a=>sha(a.path)!==a.hash))throw Error('Retained assignment reference changed while reading');
  return {text,attempt:Number(name),artifacts};
 }
 return null;
}
export function verifyRetainedAssignmentReference(reference){
 if(reference?.artifacts.some(a=>!fs.existsSync(a.path)||sha(a.path)!==a.hash))throw Error('Retained assignment reference changed during generation');
}
