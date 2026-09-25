import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1]};
const dir=path.resolve(arg('--run-dir','.booklet-work/model-benchmark-20260924-four-way'));
const base=arg('--base','http://127.0.0.1:5174');
const teaching=process.argv.includes('--teaching');
const protocol=JSON.parse(fs.readFileSync(path.join(dir,'protocol.json')));
const began=Date.now(),attempted=new Set();
while(true){
 let found=false;
 for(const arm of protocol.arms)for(const sample of protocol.samples){
  const key=arm.id+'/'+sample.id,root=path.join(dir,key),project=path.join(root,'project.json'),out=path.join(root,teaching?'teaching-review':'editions');
  if(attempted.has(key)||fs.existsSync(path.join(out,'render-attempt.json'))||!fs.existsSync(project)||!fs.existsSync(path.join(root,'project-validation.json')))continue;
  if(teaching&&!JSON.parse(fs.readFileSync(project)).sections.some(s=>s.phase==='teaching'||s.blocks.some(b=>b.sourceAtom))) {attempted.add(key);continue;}
  attempted.add(key);found=true;fs.mkdirSync(out,{recursive:true});
  const start=Date.now();fs.writeFileSync(path.join(out,'render-attempt.json'),JSON.stringify({startedAt:new Date(start).toISOString(),project,diagnosticOnly:true}),{flag:'wx'});
  console.log('Rendering '+key);
  const code=await new Promise(resolve=>{
   const log=fs.openSync(path.join(out,'execution.log'),'wx');
   const child=spawn(process.execPath,['scripts/booklet/benchmark-render.mjs','--project',project,'--out',out,'--pdf','--base',base,...(teaching?['--teaching','--editions','student']:[])],{windowsHide:true,stdio:['ignore',log,log]});
   const timer=setTimeout(()=>child.kill(),3600000);
   child.on('error',e=>{fs.writeSync(log,e.message);});child.on('close',code=>{clearTimeout(timer);fs.closeSync(log);resolve(code);});
  });
  fs.writeFileSync(path.join(out,'render-end.json'),JSON.stringify({endedAt:new Date().toISOString(),elapsedMs:Date.now()-start,code}));console.log(JSON.stringify({rendered:key,code,elapsedMs:Date.now()-start}));
 }
 if(fs.existsSync(path.join(dir,'execution-end.json'))&&!found)break;
 if(Date.now()-began>24*3600000)throw Error('Watch limit reached');
 await new Promise(r=>setTimeout(r,5000));
}
