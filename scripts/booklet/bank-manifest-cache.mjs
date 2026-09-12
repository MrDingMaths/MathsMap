import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {makeBankManifest,validateQuestion} from '../../src/lib/practice-question-model.js';

// Hash every question so manual maintenance, atomic bank transactions, deletion
// and approval changes invalidate the cache without relying on a watcher.
export function createBankManifestReader(){
  const caches=new Map();
  return async function readManifest(root){
    const names=(await fs.readdir(root).catch(e=>{if(e.code==='ENOENT')return [];throw e;})).filter(n=>n.endsWith('.json')&&n!=='manifest.json').sort();
    const sources=await Promise.all(names.map(name=>fs.readFile(path.join(root,name),'utf8')));
    const signature=createHash('sha256').update(JSON.stringify([names,sources])).digest('hex'),previous=caches.get(root);if(previous?.signature===signature)return previous.manifest;
    const records=[];
    for(const source of sources){try{const checked=validateQuestion(JSON.parse(source));if(checked.valid&&checked.question.status==='approved')records.push(checked.question);}catch{/* Preserve approved-only serving semantics. */}}
    records.sort((a,b)=>a.id.localeCompare(b.id));
    const manifest=makeBankManifest(records);caches.set(root,{signature,manifest});return manifest;
  };
}
export const readBankManifest=createBankManifestReader();
