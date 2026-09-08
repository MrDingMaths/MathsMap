import fs from 'node:fs';
import assert from 'node:assert/strict';
import katex from 'katex';
import {setoutImplicationSteps} from '../../src/lib/inline-content.js';

const file='booklets/projects/linear-relationships-complete-v1.json';
const raw=fs.readFileSync(file,'utf8'),project=JSON.parse(raw),changes=[];
function walk(o,path=[]){
 if(!o||typeof o!=='object')return;
 for(const[key,value]of Object.entries(o)){
  if(['worked','theorySolution'].includes(key)&&typeof value==='string'){
   const after=setoutImplicationSteps(value);
   if(after!==value){
    for(const match of after.matchAll(/\$\$([\s\S]*?)\$\$/g))katex.renderToString(match[1],{throwOnError:true,strict:false,displayMode:true});
    changes.push({path:[...path,key],before:value,after});o[key]=after;
   }
  }else walk(value,[...path,key]);
 }
}
walk(project);
const restored=structuredClone(project);
for(const c of changes){let o=restored;for(const k of c.path.slice(0,-1))o=o[k];o[c.path.at(-1)]=c.before;}
assert.deepEqual(restored,JSON.parse(raw));
const out='output/linear-solution-setout';fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(out+'/changes.json',JSON.stringify(changes,null,2)+'\n');
if(process.argv.includes('--apply')&&changes.length){
 assert.equal(fs.readFileSync(file,'utf8'),raw);
 fs.writeFileSync(out+'/before.json',raw,{flag:'wx'});
 project.revision++;project.updatedAt=new Date().toISOString();
 fs.writeFileSync(file,JSON.stringify(project,null,2)+'\n');
}
console.log(JSON.stringify({changedSolutions:changes.length,revision:project.revision,questionsDiagramsAndLayoutUnchanged:true,mathsSyntax:'passed'}));
