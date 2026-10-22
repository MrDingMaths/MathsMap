// Revision history of a booklet project: live revision files plus archived
// snapshots. Read-only. Lifted from .booklet-work/review-speed-20261017/
// spacing-maintenance.mjs (historyIndex, snapshot, collect) and extended with the
// import-final and around-a-comment lookups the benchmark needs.
//   node bench/history.mjs final <project-id>
//   node bench/history.mjs around <project-id> <iso-time> [<resolved-iso-time>]
//   node bench/history.mjs list <project-id>
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const PROJECTS=path.join(ROOT,'booklets/projects'),ARC=path.join(ROOT,'booklets/.storage-archives');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
export const allBlocks=p=>(p.sections??[]).flatMap(s=>s.blocks??[]);
const skipped=new Set(['answer','source','sourceRefs','sourceAtom','sourceReview','sourceLayoutEvidence','originalDiagram','originalGraph','mathematicalModel','bankRef','classification','flow','presentation']);

// Project id -> revision number -> {file} for loose revisions or {sha,bytes} for
// archived ones. A revision still on disk wins over its archived copy.
let cachedIndex=null;
export function historyIndex({fresh=false}={}){
 if(cachedIndex&&!fresh)return cachedIndex;
 const index=new Map();const add=(id,rev,item)=>{if(!index.has(id))index.set(id,new Map());index.get(id).set(rev,item);};
 const manifests=path.join(ARC,'manifests');
 if(fs.existsSync(manifests))for(const name of fs.readdirSync(manifests).filter(f=>f.endsWith('.json')))for(const e of read(path.join(manifests,name)).entries??[]){const m=e.path.replaceAll('\\','/').match(/^projects\/\.revisions\/([^/]+)\/(\d+)\.json$/);if(m)add(m[1],Number(m[2]),{sha:e.sha256,bytes:e.bytes,mtime:e.mtime});}
 const revisions=path.join(PROJECTS,'.revisions');
 if(fs.existsSync(revisions))for(const id of fs.readdirSync(revisions)){const dir=path.join(revisions,id);if(!fs.statSync(dir).isDirectory())continue;for(const f of fs.readdirSync(dir).filter(f=>/^\d+\.json$/.test(f)))add(id,parseInt(f),{file:path.join(dir,f),mtime:fs.statSync(path.join(dir,f)).mtime.toISOString()});}
 return cachedIndex=index;
}
export function snapshot(e){
 if(e.file)return read(e.file);
 const bytes=zlib.gunzipSync(fs.readFileSync(path.join(ARC,'objects',e.sha.slice(0,2),e.sha+'.gz')));
 if(bytes.length!==e.bytes||createHash('sha256').update(bytes).digest('hex')!==e.sha)throw Error('Archive verification failed');
 return JSON.parse(bytes);
}
// Every revision of a project in ascending order, as {revision, entry}.
export function revisionsOf(id){return [...(historyIndex().get(id)??[])].map(([revision,entry])=>({revision,entry})).sort((a,b)=>a.revision-b.revision);}
export function loadRevision(id,revision){const entry=historyIndex().get(id)?.get(revision);if(!entry)throw Error(`No revision ${revision} of ${id}`);return snapshot(entry);}
export function liveProject(id){return read(path.join(PROJECTS,id+'.json'));}

// A teacher flag has no `kind` (first-pass and workflow flags do) and a time.
export const isTeacherFlag=flag=>!!flag&&!flag.kind&&!flag.workflowIssue&&!!flag.at;
export const teacherFlags=project=>(project.studio?.flags??[]).filter(isTeacherFlag);
export function firstTeacherTime(project){return teacherFlags(project).map(f=>f.at).sort()[0]??null;}
const timeOf=snap=>snap.updatedAt??snap.savedAt??null;

// The last revision saved before the earliest teacher flag: the import as the
// pipeline delivered it. `live` is the current project (it carries the flags);
// the result is {revision, project, updatedAt, firstFlagAt} or null when the
// history holds nothing before the first flag.
export function importFinalRevision(id,{live=liveProject(id)}={}){
 const firstFlagAt=firstTeacherTime(live);
 if(!firstFlagAt)return null;
 return revisionBefore(id,firstFlagAt,{firstFlagAt});
}
// Pure: pick the last of `stamped` ({revision, at}) saved strictly before `at`.
export function lastBefore(stamped,at){
 let best=null;
 for(const item of stamped)if(item.at&&item.at<at&&(!best||item.revision>best.revision))best=item;
 return best;
}
export function firstAtOrAfter(stamped,at){
 let best=null;
 for(const item of stamped)if(item.at&&item.at>=at&&(!best||item.revision<best.revision))best=item;
 return best;
}
// Snapshots are large, so timestamps come from a revision's file time first
// (written seconds after the save) and a snapshot is read only to confirm the
// saved time. Revision numbers rise with time, so the search walks outwards from
// the time and stops at the first confirmed hit.
const SLACK_MS=300000;
const stampCache=new Map();
function stampOf(id,{revision,entry}){
 const key=id+'@'+revision;
 if(!stampCache.has(key)){let at=null;try{at=timeOf(snapshot(entry));}catch{}stampCache.set(key,at);}
 return stampCache.get(key);
}
// Every revision with its confirmed save time (reads every snapshot; for listing).
export function revisionStamps(id){return revisionsOf(id).map(row=>({revision:row.revision,at:stampOf(id,row)}));}
export function revisionBefore(id,at,extra={}){
 const limit=Date.parse(at)+SLACK_MS,rows=revisionsOf(id).filter(r=>!r.entry.mtime||Date.parse(r.entry.mtime)<=limit);
 for(let i=rows.length-1;i>=0;i--){const stamp=stampOf(id,rows[i]);if(stamp&&stamp<at)return {revision:rows[i].revision,updatedAt:stamp,project:loadRevision(id,rows[i].revision),...extra};}
 return null;
}
// The current project is not in the revision folder until it is superseded, so
// it answers for any time after the last stored revision.
export function revisionAfter(id,at){
 const floor=Date.parse(at)-SLACK_MS,rows=revisionsOf(id).filter(r=>!r.entry.mtime||Date.parse(r.entry.mtime)>=floor);
 for(const row of rows){const stamp=stampOf(id,row);if(stamp&&stamp>=at)return {revision:row.revision,updatedAt:stamp,project:loadRevision(id,row.revision)};}
 const live=liveProject(id);
 return timeOf(live)&&timeOf(live)>=at?{revision:live.revision,updatedAt:timeOf(live),project:live,live:true}:null;
}
// The revisions just before a comment was made and just after it was resolved.
// `resolvedAt` falls back to the comment time when the comment is unresolved.
export function revisionAround(id,at,resolvedAt=null){
 return {before:revisionBefore(id,at),after:revisionAfter(id,resolvedAt??at)};
}

// Layout fields a teacher adjusts, keyed by block/node/field. See
// spacing-maintenance.mjs for the origin of the keys.
export function collect(project){
 const out=new Map(),p=normalizeEditableProject(project),o=p.settings.layoutOverrides;
 for(const b of allBlocks(p)){
   function walk(n,ctx={}){if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.flat().forEach(c=>walk(c,ctx));return;}
     const c={...ctx};if(n.type==='cell')c.cell=n;if(n.type==='layout')c.layout=n.arrangement;if(n.layout==='grid')c.grid=true;
     const add=(field,value,context,index=null)=>{if(Number.isFinite(value))out.set(b.id+'/'+n.id+'.'+field+(index==null?'':'['+index+']'),{blockId:b.id,nodeId:n.id,field,value,context,index});};
     if(n.id){
       if(n.type==='paragraph'&&!c.cell){add('spaceBefore',n.spaceBefore??0,'paragraph before');add('spaceAfter',n.spaceAfter??2,'paragraph after');}
       if(n.type==='layout'&&!['cards','speech-bubble'].includes(n.arrangement)){add('gap',n.gap??3,'native '+n.arrangement+' gap');add('padding',n.padding??3,'native '+n.arrangement+' padding');}
       if(n.type==='table'){add('padding',n.padding??2,n.border===false?'alignment table padding':'table padding');n.rowHeights?.forEach((v,i)=>add('rowHeights',v,n.rows[i]?.some(c=>c.header)?'table header row':'table body row',i));}
     }
     for(const [k,v]of Object.entries(n))if(!skipped.has(k)&&v&&typeof v==='object')walk(v,c);
   }
   walk(b);
   if(b.type!=='question'&&!o.blockLayouts?.[b.id]?.arrangement)continue;
   try{const {tree,entries}=resolveArrangement(b,o.blockLayouts?.[b.id]?.arrangement,o);const walkTree=n=>{
     if(n.type==='group')out.set(b.id+'/arrangement/'+n.id+'.gap',{blockId:b.id,nodeId:n.id,field:'gap',value:n.gap??2,context:n.direction==='row'?'arrangement row gap':'arrangement stack gap',arrangement:true});
     const e=entries.get(n.ref);if(e?.kind==='diagram'&&!['solution','answer-worked','solution-overlay'].includes(e.role)&&e.value.role!=='solution'){
       const d=e.value,description=[d.id,d.spec?.description,d.spec?.mathematics].join(' '),kind=/graph|cartesian|axes|plot/i.test(description)?'graph':/grid|draw|sketch|construct/i.test(description)?'drawing':'figure';
       out.set(b.id+'/diagram/'+e.diagramId,{blockId:b.id,nodeId:e.diagramId,field:'widthMm',value:n.width??d.widthMm??78,context:kind+' '+(b.content?.layout==='grid'?'part grid':'other'),diagram:true});
     }
     n.children?.forEach(walkTree);
   };walkTree(tree.root);}catch{}
 }
 return out;
}

async function main(){
 const [command,id,a,b]=process.argv.slice(2);
 if(!command||!id)throw Error('Usage: node bench/history.mjs final|list <project-id> | around <project-id> <iso> [<resolved-iso>]');
 if(command==='list'){const rows=revisionsOf(id);console.log(JSON.stringify({id,count:rows.length,first:rows[0]&&{revision:rows[0].revision,mtime:rows[0].entry.mtime},last:rows.at(-1)&&{revision:rows.at(-1).revision,mtime:rows.at(-1).entry.mtime},revisions:rows.map(r=>r.revision)}));return;}
 if(command==='final'){
  const hit=importFinalRevision(id);
  if(!hit){console.log(JSON.stringify({id,importFinal:null}));return;}
  console.log(JSON.stringify({id,importFinal:{revision:hit.revision,updatedAt:hit.updatedAt,firstFlagAt:hit.firstFlagAt,blocks:allBlocks(hit.project).length,source:historyIndex().get(id).get(hit.revision).file?'live':'archive'}}));return;
 }
 if(command==='around'){
  if(!a)throw Error('around needs an ISO time');
  const {before,after}=revisionAround(id,a,b);
  console.log(JSON.stringify({id,at:a,resolvedAt:b??null,before:before&&{revision:before.revision,updatedAt:before.updatedAt},after:after&&{revision:after.revision,updatedAt:after.updatedAt}}));return;
 }
 throw Error('Unknown command '+command);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
