// Exact-byte relocation only. Existing evidence always wins and must match its pin.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const digest=b=>createHash('sha256').update(b).digest('hex');
const key=p=>p.replaceAll('\\','/').replace(/^([A-Z]):/,(_,d)=>d.toLowerCase()+':');
const need=(v,m)=>{if(!v)throw Error(m);};
export function createPinnedEvidenceReader(repoRoot){
 const root=path.resolve(repoRoot),provenance=path.join(root,'booklets','provenance'),allowlist=path.join(provenance,'evidence-relocations.json');
 function confined(file){const relative=path.relative(provenance,file);need(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'Evidence relocation outside provenance');let cursor=root;for(const part of path.relative(root,file).split(path.sep)){cursor=path.join(cursor,part);need(!fs.lstatSync(cursor).isSymbolicLink(),'Evidence relocation symlink forbidden');}return file;}
 return artifact=>{
  need(typeof artifact?.path==='string'&&/^[a-f0-9]{64}$/.test(artifact.sha256??''),'Pinned evidence path/hash required');let bytes;
  try{bytes=fs.readFileSync(artifact.path);}catch(error){
   if(error.code!=='ENOENT')throw error;
   confined(allowlist);const manifest=JSON.parse(fs.readFileSync(allowlist));need(manifest.kind==='rating-evidence-relocations-v1'&&Array.isArray(manifest.records),'Invalid evidence relocation allowlist');const seen=new Set();let match;
   for(const row of manifest.records){
    need(typeof row.originalPath==='string'&&/^[a-f0-9]{64}$/.test(row.sha256??'')&&typeof row.projectId==='string'&&/^[A-Za-z0-9_-]+$/.test(row.projectId)&&typeof row.retainedPath==='string','Invalid evidence relocation record');
    const pair=key(row.originalPath)+'\0'+row.sha256;need(!seen.has(pair),'Ambiguous evidence relocation pair');seen.add(pair);
    const logical=row.retainedPath;need(!logical.includes('\\')&&!logical.split('/').some(p=>p==='..'||p==='.'||p==='')&&logical.startsWith('booklets/provenance/'+row.projectId+'/')&&!path.isAbsolute(logical)&&!path.win32.isAbsolute(logical),'Foreign evidence relocation path');
    need(path.posix.basename(logical).startsWith(row.sha256+'.')&&!/\.(png|jpe?g|pdf|webp)$/i.test(logical),'Only content-addressed non-raster evidence may relocate');
    if(pair===key(artifact.path)+'\0'+artifact.sha256)match=row;
   }
   need(match,'No exact evidence relocation pair');const retained=confined(path.resolve(root,match.retainedPath));bytes=fs.readFileSync(retained);
  }
  need(digest(bytes)===artifact.sha256,'Pinned evidence changed (artifact changed)');return bytes;
 };
}
export const readPinnedEvidenceBytes=createPinnedEvidenceReader(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'));
