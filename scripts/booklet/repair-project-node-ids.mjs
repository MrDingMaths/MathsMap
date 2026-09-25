import fs from 'node:fs/promises';
import path from 'node:path';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {writeTransaction} from './bank-sync.mjs';
import {projectCheckpointEntries} from './project-checkpoints.mjs';

const projectsRoot=path.resolve('booklets/projects');
const skip=new Set(['bankRef','sourceAtom','sourceReview','source','sourceQuestionRef','sourceLayoutEvidence','generationEvidence','teachingMapping','classification','originalDiagram']);

function slug(value){return String(value).replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase()||'node';}

export function repairDuplicateMarkerIds(project){
 const seen=new Set(),changes=[];
 const scan=(node,path=[],ancestors=[])=>{
  if(!node||typeof node!=='object')return;
  const nodeIds=node.id?[...ancestors,String(node.id)]:ancestors;
  if(typeof node.id==='string'){
   const original=node.id;
   if(seen.has(original)&&original.startsWith('marker-')){
    const owner=nodeIds.at(-2);
    const suffix=slug(owner??`duplicate-${changes.length+1}`);
    let next=`${original}-${suffix}`;
    let index=2;
    while(seen.has(next))next=`${original}-${suffix}-${index++}`;
    node.id=next;
    changes.push({from:original,to:next,path:[...path,String(node.id)].join('/')});
   }
   seen.add(node.id);
  }
  for(const [key,value]of Object.entries(node)){
   if(key==='id'||skip.has(key))continue;
   if(Array.isArray(value))value.forEach((child,index)=>scan(child,[...path,key,String(index)],nodeIds));
   else scan(value,[...path,key],nodeIds);
  }
 };
 scan(project.sections,['sections'],[]);
 return changes;
}

async function main(){
 const apply=process.argv.includes('--apply');
 const recordCurrent=new Set((process.argv.find(arg=>arg.startsWith('--record-current='))?.split('=')[1]??'').split(',').filter(Boolean));
 const report=[];
 for(const name of (await fs.readdir(projectsRoot)).filter(name=>name.endsWith('.json')).sort()){
  const file=path.join(projectsRoot,name);
  const original=JSON.parse(await fs.readFile(file,'utf8'));
  const project=structuredClone(original);
  const changes=repairDuplicateMarkerIds(project);
  if(!changes.length&&!recordCurrent.has(project.id))continue;
  const validation=validateEditableProject(project);
  if(validation.errors.some(error=>error.startsWith('Duplicate project node id: marker-'))){
   throw new Error(`Marker IDs remain duplicated in ${name}: ${validation.errors.join('; ')}`);
  }
  let revision;
  if(apply){
   const previous=structuredClone(project),fromRevision=Number(previous.revision)||0;
   project.revision=fromRevision+1;project.updatedAt=new Date().toISOString();
   const checkpoints=await projectCheckpointEntries(projectsRoot,previous,{force:true});
   await writeTransaction([...checkpoints,[file,project]]);
   revision={from:fromRevision,to:project.revision};
  }
  report.push({project:project.id,file:name,changes,revision,applied:apply});
 }
 console.log(JSON.stringify(report,null,2));
}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1')))await main();
