import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Read-only inventory. In particular, this does not prune recovery histories,
// source evidence, or bank revisions (some bank revisions are live baselines).
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const outIndex=process.argv.indexOf('--out');
const out=outIndex<0?null:path.resolve(process.argv[outIndex+1]);
const started=Date.now(), totals=new Map(), files=[], skippedLinks=[];
const tracked=new Set(execFileSync('git',['ls-files','-z'],{cwd:root,maxBuffer:32*1024*1024}).toString().split('\0'));
function visit(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    if(entry.isSymbolicLink()){skippedLinks.push(path.relative(root,path.join(directory,entry.name)).replaceAll(path.sep,'/'));continue;}
    const absolute=path.join(directory,entry.name);
    if(entry.isDirectory()){visit(absolute);continue;}
    if(!entry.isFile())continue;
    const relative=path.relative(root,absolute).replaceAll(path.sep,'/'),bytes=fs.statSync(absolute).size;
    files.push({path:relative,bytes,tracked:tracked.has(relative)});
    const parts=relative.split('/');
    for(let n=1;n<=Math.min(parts.length,3);n++){
      const key=parts.slice(0,n).join('/'),total=totals.get(key)??{path:key,bytes:0,files:0};
      total.bytes+=bytes;total.files++;totals.set(key,total);
    }
  }
}
visit(root);
const size=prefix=>files.filter(f=>f.path===prefix||f.path.startsWith(prefix+'/')).reduce((n,f)=>n+f.bytes,0);
const candidates=[
  ['booklets/projects/.revisions','Archive/compress older automatic snapshots, then prune under an agreed retention policy. Current projects are separate; retain recent undo/recovery checkpoints.'],
  ['booklets/archives','Compress and retain useful legacy recovery material. These are not the current project workspace.'],
  ['.booklet-work/studio-load/verification','Completed isolated verification copy of the application. Confirm its report is retained and the copy is not in use before removing it.'],
  ['.booklet-work/trig-bank/stage','Completed bank staging snapshot. Compare with the accepted stage-final receipt; retain receipts and any unique input evidence.'],
  ['.booklet-work/trig-bank/stage-final','Accepted bank staging snapshot. Keep durable bank provenance; archive or delete payload only after confirming publication and recovery coverage.'],
  ['.booklet-work/volume-bank/staged','Bank staging snapshot. Retain its transfer receipt and unique evidence; remove duplicate project/bank payload only after comparison.'],
  ['.booklet-work/volume-bank/sync-roundtrip','Isolated sync test copy. Retain the report; remove copied payload after confirming that it is no longer in use.'],
  ['dist','Rebuildable production output; may be removed when no preview is serving it.'],
].map(([prefix,review])=>({path:prefix,bytes:size(prefix),review})).filter(c=>c.bytes);
const revisionGroups=new Map();
for(const file of files){const match=/^booklets\/projects\/\.revisions\/([^/]+)\/(\d+)\.json$/.exec(file.path);if(match){const list=revisionGroups.get(match[1])??[];list.push({...file,revision:Number(match[2])});revisionGroups.set(match[1],list);}}
const histories=[...revisionGroups].map(([id,list])=>{
  list.sort((a,b)=>b.revision-a.revision);const older=list.slice(20);
  return {id,snapshots:list.length,bytes:list.reduce((n,f)=>n+f.bytes,0),retainLatest:Math.min(20,list.length),olderSnapshots:older.length,olderBytes:older.reduce((n,f)=>n+f.bytes,0)};
});
const report={format:'mathsmap-storage-audit-v1',createdAt:new Date().toISOString(),root,totalBytes:files.reduce((n,f)=>n+f.bytes,0),trackedWorkingBytes:files.filter(f=>f.tracked).reduce((n,f)=>n+f.bytes,0),gitBytes:size('.git'),currentProjectBytes:files.filter(f=>/^booklets\/projects\/[^/]+\.json$/.test(f.path)).reduce((n,f)=>n+f.bytes,0),fileCount:files.length,largestDirectories:[...totals.values()].sort((a,b)=>b.bytes-a.bytes).slice(0,45),candidates,automaticHistories:histories,protected:['Current projects, banks, bank sync baselines and referenced assets','Original Studio and MathsMap sources (including linked extracted media)','Active full-import source evidence and correction records','Useful local recovery records; archive these instead of blanket deletion'],elapsedMs:Date.now()-started,deletions:0};
report.skippedLinks=skippedLinks;
if(out){if(!out.startsWith(root+path.sep))throw Error('Audit output must stay inside the workspace');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
const gib=bytes=>(bytes/1024**3).toFixed(2)+' GiB';
console.log(JSON.stringify({total:gib(report.totalBytes),trackedWorkingFiles:gib(report.trackedWorkingBytes),git:gib(report.gitBytes),currentProjects:gib(report.currentProjectBytes),candidates:candidates.map(c=>({path:c.path,size:gib(c.bytes)})),olderThanLatest20:gib(histories.reduce((n,h)=>n+h.olderBytes,0)),deletions:0,report:out,elapsedMs:report.elapsedMs},null,2));
