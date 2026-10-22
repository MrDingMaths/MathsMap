// Shared plumbing of the checks (22 October 2026): finding the booklet a command names, the source
// inventory of its import run, one render with the extra probes, and saving what a check repaired.
// Lives outside scripts/ and vite.config.js, which export evidence hashes.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {changedPaths} from '../../scripts/booklet/feedback-preflight.mjs';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
export const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^﻿/,''));
export const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,1)+'\n');};
export const now=()=>new Date().toISOString();
export const blocksOf=project=>(project.sections??[]).flatMap(s=>s.blocks??[]);
export const isMain=meta=>!!process.argv[1]&&meta.url===pathToFileURL(path.resolve(process.argv[1])).href;

// --name value pairs and bare flags.
export function parseArgs(argv,{values=[],flags=[]}){
 const out={};
 for(let i=0;i<argv.length;i++){
  if(flags.includes(argv[i])){out[argv[i]]=true;continue;}
  if(!values.includes(argv[i])||argv[i+1]===undefined)throw Error('Invalid option '+argv[i]);
  out[argv[i]]=argv[++i];
 }
 return out;
}

// --project ID reads the live booklet (never changed without --allow-live); --candidate FILE a copy.
export function resolveTarget(opts,{root=ROOT}={}){
 const file=opts['--candidate']?path.resolve(opts['--candidate']):opts['--project']?path.join(root,'booklets','projects',opts['--project']+'.json'):null;
 if(!file)throw Error('Name a booklet with --project ID or a candidate file with --candidate FILE');
 const live=path.dirname(file)===path.resolve(root,'booklets','projects');
 return {file,live,project:read(file)};
}
export function runDirOf(project,{root=ROOT}={}){
 const runId=project.source?.runId??project.runId,dir=runId&&path.join(root,'.booklet-work','full-imports',String(runId).replace(/[^\w.-]/g,'_'));
 return dir&&fs.existsSync(dir)?dir:null;
}

// ---- the source inventory ---------------------------------------------------------------
import {groupFamily} from '../../src/lib/booklet-role-check.js';
const inventoryCache=new Map();
// Source entry id -> {family, kind, header, page} from the inventory of every source page.
export function inventoryGroups(project,{root=ROOT}={}){
 const run=runDirOf(project,{root});if(!run)return new Map();
 if(inventoryCache.has(run))return inventoryCache.get(run);
 const dir=path.join(run,'semantic-packets'),map=new Map();
 if(fs.existsSync(dir))for(const name of fs.readdirSync(dir).filter(f=>/^page-\d+\.inventory\.json$/.test(f)).sort()){
  let inventory;try{inventory=read(path.join(dir,name));}catch{continue;}
  for(const group of inventory.groups??[]){
   const family=groupFamily(group);if(!family)continue;
   const header=typeof group.header==='string'?group.header:'';
   // Blocks are named after an entry, or after the group that holds the entries.
   for(const id of [group.id,...(group.entryIds??[])].filter(Boolean))if(!map.has(id)||id===group.id)map.set(id,{family,kind:group.kind,header,page:inventory.pageNumber});
  }
 }
 inventoryCache.set(run,map);return map;
}

// ---- saving ---------------------------------------------------------------------------------
// A candidate file is rewritten in place. A live booklet is saved only with allowLive, through the
// revision-checked repair path the sweep uses, after checking no import or review is running.
// expectedRevision is the revision the work started from (default: the revision of `before`); the save
// fails if the booklet has moved on since, so nothing the teacher edited meanwhile is reverted.
// Settings the check changed (answer spaces, layout overrides) are named to the repair scope as JSON
// pointers taken from the actual diff, as paginate/optimise.mjs does.
export const settingsAllowedPaths=(before,after)=>changedPaths({settings:before.settings??{}},{settings:after.settings??{}});
export async function saveTarget({file,live,before,after,changed,allowLive=false,tag='checks',expectedRevision=before?.revision,deps={}}){
 if(!changed.length)return {saved:false,reason:'nothing changed'};
 if(!live){write(file,after);return {saved:true,file,changed};}
 if(!allowLive)throw Error('Refusing to change a live booklet without --allow-live: '+file);
 if(before.revision!==expectedRevision)throw Error(`The booklet changed during the run (r${expectedRevision} to r${before.revision}); run again rather than overwrite the newer edits.`);
 const liveWork=deps.liveWork??(await import('../../sweep/run.mjs')).liveWork;
 const {blocked,held}=liveWork(after.id);
 if(blocked.length||held.length)throw Error('Deferred: '+[...blocked,...held].join('; '));
 const saveRepair=deps.saveRepair??(await import('../../scripts/booklet/feedback-closeout.mjs')).saveRepair;
 const runDir=path.join(ROOT,'.booklet-work','checks',after.id,tag+'-'+now().replace(/[:.]/g,'-'));
 const allowedPaths=settingsAllowedPaths(before,after);
 const result=await saveRepair({candidate:after,expectedRevision,changedBlockIds:changed,allowedPaths,runDir,options:{checkpoint:true}});
 return {saved:true,revision:result.project.revision,changed,allowedPaths};
}

// The blocks whose JSON differs between two projects.
export function changedBlocks(before,after){
 const old=new Map(blocksOf(before).map(b=>[b.id,JSON.stringify(b)]));
 const ids=blocksOf(after).filter(b=>old.get(b.id)!==JSON.stringify(b)).map(b=>b.id);
 if(JSON.stringify(before.settings??{})!==JSON.stringify(after.settings??{})&&!ids.length)ids.push(...blocksOf(after).slice(0,1).map(b=>b.id));
 return ids;
}

// ---- rendering --------------------------------------------------------------------------------
// One headless render of the student edition with the probes of the checks that need the page.
export async function renderWithProbes(project,{probes={},editions=['student'],base,log=()=>{}}={}){
 const {renderGeometry}=await import('../../bench/render-geometry.mjs');
 const {BASE}=await import('../../first-pass/review.mjs');
 return renderGeometry(project,{base:base??BASE,editions,probes,log});
}
