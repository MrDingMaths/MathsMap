import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {makeBankManifest,validateQuestion} from '../../src/lib/practice-question-model.js';

// Re-reading and hashing ~150 MB of questions on every request took seconds.
// Each file is reparsed only when its size or modification time changes, which
// manual maintenance, atomic bank transactions, deletion and approval changes all
// do; the signature still needs no watcher.
export function createBankManifestReader(){
  const caches=new Map();
  async function snapshot(root){
    const names=(await fs.readdir(root).catch(e=>{if(e.code==='ENOENT')return [];throw e;})).filter(n=>n.endsWith('.json')&&n!=='manifest.json').sort();
    const stats=await Promise.all(names.map(name=>fs.stat(path.join(root,name)).catch(()=>null)));
    const previous=caches.get(root),files=new Map(),rows=[];
    for(let i=0;i<names.length;i++){
      const name=names[i],stat=stats[i];if(!stat)continue;
      rows.push([name,stat.size,stat.mtimeMs]);
      const known=previous?.files.get(name);
      if(known&&known.size===stat.size&&known.mtimeMs===stat.mtimeMs){files.set(name,known);continue;}
      let question=null;
      try{const checked=validateQuestion(JSON.parse(await fs.readFile(path.join(root,name),'utf8')));if(checked.valid&&checked.question.status==='approved')question=checked.question;}catch{/* Preserve approved-only serving semantics. */}
      files.set(name,{size:stat.size,mtimeMs:stat.mtimeMs,question});
    }
    const signature=createHash('sha256').update(JSON.stringify(rows)).digest('hex');
    if(previous?.signature===signature)return previous;
    const records=[...files.values()].map(f=>f.question).filter(Boolean).sort((a,b)=>a.id.localeCompare(b.id));
    const next={signature,files,manifest:makeBankManifest(records),body:null};caches.set(root,next);return next;
  }
  async function readManifest(root){return (await snapshot(root)).manifest;}
  // Every manifest question as one compact JSON array in manifest order. These
  // are the validated (normalised) records, so clients need not normalise them
  // again; normalisation is idempotent. Null when the bank has changed since the
  // caller's manifest, so it can fall back to individual requests.
  readManifest.snapshot=snapshot;
  readManifest.records=async(root,signature)=>{
    const current=await snapshot(root);if(signature&&signature!==current.signature)return null;
    if(current.body==null){
      const byId=new Map([...current.files.values()].filter(f=>f.question).map(f=>[f.question.id,f.question]));
      current.body='['+current.manifest.questions.map(q=>JSON.stringify(byId.get(q.id))).join(',')+']';
    }
    return current.body;
  };
  return readManifest;
}
export const readBankManifest=createBankManifestReader();
