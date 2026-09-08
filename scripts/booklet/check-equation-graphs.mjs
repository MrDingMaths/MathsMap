import fs from 'node:fs';
import {loadTikzEngine} from './check-pgfplots-engine.mjs';
import {prepareTikz} from '../../src/lib/tikz-prepare.js';
const project=JSON.parse(fs.readFileSync('output/graph-repair/candidate.json')),all=[];
function walk(x,page){if(!x||typeof x!=='object')return;if(x.format==='tikz'&&x.mathematicalModel?.kind==='cartesian')all.push({id:x.id,page,code:x.code});for(const[k,v]of Object.entries(x))if(!['spec','originalDiagram','sourceAtom','mathematicalModel'].includes(k))Array.isArray(v)?v.forEach(z=>walk(z,page)):typeof v==='object'&&walk(v,page);}
for(const s of project.sections)walk(s.blocks,s.sourcePageNumber);
const compile=await loadTikzEngine(),cache=new Map(),results=[];
// Resume only SVGs compiled from the exact same prepared TeX key.
const previous=fs.existsSync('output/graph-repair/compile-results.json')?JSON.parse(fs.readFileSync('output/graph-repair/compile-results.json')):[];
for(const result of previous)if(result.ok){const file='output/graph-repair/svg/'+result.id+'.svg';if(fs.existsSync(file))cache.set(result.key,{svg:fs.readFileSync(file,'utf8')});}
fs.mkdirSync('output/graph-repair/svg',{recursive:true});
for(const [i,d]of all.entries()){
 const key=prepareTikz(d.code).key;let result;
 try{if(!cache.has(key))cache.set(key,await compile(d.code));const svg=cache.get(key).svg;if(!svg.includes('<svg'))throw Error('No SVG returned');fs.writeFileSync('output/graph-repair/svg/'+d.id+'.svg',svg);result={id:d.id,page:d.page,key,ok:true};}
 catch(e){result={id:d.id,page:d.page,key,ok:false,error:e.message};fs.writeFileSync('output/graph-repair/'+d.id+'-error.txt',e.message);}
 results.push(result);
 if(!result.ok||i%10===0)console.log(i+1+'/'+all.length,d.id,result.ok?'compiled':'FAILED');
 fs.writeFileSync('output/graph-repair/compile-results.json',JSON.stringify(results,null,2));
}
console.log(JSON.stringify({diagrams:all.length,unique:new Set(results.map(r=>r.key)).size,failed:results.filter(r=>!r.ok).length}));
if(results.some(r=>!r.ok))process.exitCode=1;
