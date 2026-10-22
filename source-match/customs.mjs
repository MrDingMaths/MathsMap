#!/usr/bin/env node
// Custom arrangements that recur across booklets are candidate new teaching presets
// (22 October 2026, user approved). A block ends up custom when no teaching preset
// expresses the structure its source gives it. Custom signatures are clustered by their
// structure hash (labels, text and measurements ignored); a cluster of three or more is
// reported with a description of the structure and its members.
//
//   node source-match/customs.mjs [--min 3] [--dirs DIR,DIR] [--out FILE]
//
// Sources of custom records, all read-only:
//   booklets/projects/*.json   blocks whose sourceReview.structure.preset is "custom"
//   <dir>/structures.json      written by source-match/run.mjs (the default dirs are every
//                              .booklet-work/full-imports/*/source-match plus --dirs)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^﻿/,''));

export const MIN_CLUSTER=3;

// Records: [{project, blockId, signatureHash, structure?, reason?}]. Returns clusters of at
// least `min` records with the same hash, largest first.
export function clusterCustoms(records,{min=MIN_CLUSTER}={}){
 const by=new Map();
 for(const record of records){if(!record.signatureHash)continue;(by.get(record.signatureHash)??by.set(record.signatureHash,[]).get(record.signatureHash)).push(record);}
 return [...by].filter(([,members])=>members.length>=min).map(([signatureHash,members])=>({
  signatureHash,count:members.length,booklets:[...new Set(members.map(m=>m.project))],
  description:describeStructure(members.find(m=>m.structure)?.structure),
  reasons:[...new Set(members.map(m=>m.reason).filter(Boolean))].slice(0,5),
  members:members.map(m=>({project:m.project,blockId:m.blockId}))
 })).sort((a,b)=>b.count-a.count||a.signatureHash.localeCompare(b.signatureHash));
}
// A short account of a structure (structureOf in teaching-signature.js).
export function describeStructure(structure){
 if(!structure)return null;
 const parts=[];
 parts.push(structure.lanes>1?`${structure.lanes} columns side by side`:'one column');
 parts.push(`${structure.lines.length} lines`);
 if(structure.columns.length)parts.push(`${structure.columns.length} aligned relation column(s) of ${structure.columns.map(c=>c.length).join('/')} lines`);
 const indents=[...new Set(structure.lines.map(l=>l[1]).filter(v=>v!=null))];
 if(indents.length>1)parts.push(`${indents.length} indent levels`);
 if(structure.groups.length>1)parts.push(`${structure.groups.length} groups`);
 if(structure.arrows.length)parts.push(`${structure.arrows.length} arrow(s): ${structure.arrows.map(a=>[a[2],a[1]].join(' ')).join(', ')}`);
 if(structure.figure)parts.push(`figure ${structure.figure}`);
 if(structure.emphasis.length)parts.push('emphasis: '+structure.emphasis.map(e=>e[0]).join(', '));
 return parts.join('; ');
}

// A coarser key for families of custom structures: what the source places, not how many lines
// it takes (columns, aligned relation columns, arrows, figure side, indent depth, grouping).
export function familyKey(structure){
 if(!structure)return null;
 const levels=new Set(structure.lines.map(l=>l[1]).filter(v=>v!=null)).size;
 const arrows=structure.arrows.map(a=>`${a[2]}/${a[1]}`).sort().join(',');
 const emphasis=[...new Set(structure.emphasis.map(e=>e[0]))].sort().join(',');
 return JSON.stringify({lanes:structure.lanes,columns:structure.columns.length>0,arrows,figure:structure.figure,indent:Math.min(levels,3),groups:structure.groups.length>1,emphasis,markers:structure.lines.some(l=>l[3])});
}
// Families: records with a structure and the same coarse key, three or more of them.
export function familyCustoms(records,{min=MIN_CLUSTER}={}){
 const by=new Map();
 for(const r of records){const key=familyKey(r.structure);if(!key)continue;(by.get(key)??by.set(key,[]).get(key)).push(r);}
 return [...by].filter(([,m])=>m.length>=min).map(([key,members])=>({family:JSON.parse(key),count:members.length,booklets:[...new Set(members.map(m=>m.project))],description:describeStructure(members[0].structure),members:members.map(m=>({project:m.project,blockId:m.blockId,signatureHash:m.signatureHash}))})).sort((a,b)=>b.count-a.count);
}

export function collectRecords({root=ROOT,dirs=[]}={}){
 const records=[];
 const projectsDir=path.join(root,'booklets','projects');
 if(fs.existsSync(projectsDir))for(const name of fs.readdirSync(projectsDir).filter(n=>n.endsWith('.json'))){
  let project;try{project=read(path.join(projectsDir,name));}catch{continue;}
  for(const section of project.sections??[])for(const block of section.blocks??[]){
   const s=block.sourceReview?.structure;
   if(s?.preset==='custom')records.push({project:project.id??name.replace(/\.json$/,''),blockId:block.id,signatureHash:s.signatureHash,reason:block.sourceReview?.customArrangement?.reason??null});
  }
 }
 const runs=path.join(root,'.booklet-work','full-imports'),found=[...dirs];
 if(fs.existsSync(runs))for(const run of fs.readdirSync(runs)){const dir=path.join(runs,run,'source-match');if(fs.existsSync(path.join(dir,'structures.json')))found.push(dir);}
 for(const dir of found){
  const file=path.join(path.resolve(dir),'structures.json');if(!fs.existsSync(file))continue;
  const data=read(file);
  for(const [blockId,row] of Object.entries(data.blocks??{}))if(row.custom||row.preset==='custom')records.push({project:data.project,blockId,signatureHash:row.signatureHash,structure:row.structure,reason:null});
 }
 // The same block can appear in a project and a structures file: count it once.
 const seen=new Set();
 return records.filter(r=>{const key=r.project+'|'+r.blockId;if(seen.has(key))return false;seen.add(key);return true;});
}

async function main(){
 const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 const records=collectRecords({dirs:arg('--dirs','').split(',').filter(Boolean)}),min=Number(arg('--min',MIN_CLUSTER));
 const clusters=clusterCustoms(records,{min});
 const out=arg('--out');
 const report={builtAt:new Date().toISOString(),customRecords:records.length,min,candidatePresets:clusters,families:familyCustoms(records,{min})};
 if(out){fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(path.resolve(out),JSON.stringify(report,null,1)+'\n');}
 console.log(JSON.stringify(report,null,1));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
