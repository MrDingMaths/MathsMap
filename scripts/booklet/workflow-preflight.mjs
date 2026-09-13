// No generation or authentication changes. Check the same executable and bundled
// engine used by production, without retaining command output containing identity.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright-core';
import {artifactHash} from './page-review.mjs';
import {requireCurrentTranscription} from './transcription-settings.mjs';
import {loadTikzEngine} from './check-pgfplots-engine.mjs';
import {routeCandidateProject} from './diagram-preflight.mjs';
import {measureRunPhase} from './run-observability.mjs';

export function probeCommand(executable,args){
 return new Promise(resolve=>{
  let output='';const child=spawn(executable,args,{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});
  const timer=setTimeout(()=>child.kill(),15000);
  const collect=chunk=>{if(output.length<4096)output+=chunk.toString().slice(0,4096-output.length);};
  child.stdout.on('data',collect);child.stderr.on('data',collect);
  child.on('error',()=>{});child.on('close',code=>{clearTimeout(timer);resolve({ok:code===0,code,output});});
 });
}
const smoke=String.raw`\usetikzlibrary{angles,quotes,calc,arrows.meta,positioning,intersections}
\begin{tikzpicture}\coordinate(A)at(1,0);\coordinate(B)at(0,0);\coordinate(C)at(0,1);\draw[-{Stealth}] (A)--(B)--(C);\pic[draw,"$90^\circ$"]{angle=A--B--C};\node at ($(A)!.5!(C)$){$\frac{x^2}{3}$};\end{tikzpicture}`;
export async function workflowPreflight({runDir,manifest,base='http://127.0.0.1:5173'},{probe=probeCommand,compileEngine=loadTikzEngine,browserType=chromium}={}){
 return measureRunPhase(runDir,'preflight',async()=>{
  const checks=[];
  const check=async(name,action)=>{const start=Date.now();try{const result=await action();checks.push({name,ok:true,...result,elapsedMs:Date.now()-start});}catch(error){checks.push({name,ok:false,error:error.message,elapsedMs:Date.now()-start});}};
  await check('model-policy',async()=>{requireCurrentTranscription(manifest);return {model:manifest.model,effort:manifest.effort};});
  await check('source-pins',async()=>{
   const entries=Object.entries(manifest.pins?.runFiles??{});if(!entries.length)throw Error('Run has no pinned source evidence');
   for(const [relative,expected]of entries){const file=path.resolve(runDir,relative);if(!file.startsWith(path.resolve(runDir)+path.sep)||!fs.existsSync(file)||artifactHash(file)!==expected)throw Error('Missing or changed pinned evidence: '+relative);}
   return {files:entries.length};
  });
  for(const [name,executable,args]of [
   ['node',process.execPath,['--version']],
   ['codex',process.env.BOOKLET_CODEX_BIN??'codex',['--version']],
   ['codex-auth',process.env.BOOKLET_CODEX_BIN??'codex',['login','status']],
   ['pdfinfo','pdfinfo',['-v']],['pdftohtml','pdftohtml',['-v']],['pdftoppm','pdftoppm',['-v']]
  ])await check(name,async()=>{const result=await probe(executable,args);if(!result.ok)throw Error(/Could not find home directory|failed to resolve.*home/i.test(result.output)?'The process home directory is unavailable; authentication status could not be checked.':'Command unavailable or unsuccessful (exit '+result.code+'); inspect locally.');return name==='codex-auth'?{authenticated:true}:{version:result.output.trim().split(/\r?\n/).find(line=>/^(v\d|codex(?:-cli)? \d|pdf\w+ version)/i.test(line))??'Command succeeded; version unavailable'};});
  await check('bundled-tikz',async()=>{const compile=await compileEngine(),result=await compile(smoke);if(!result.svg?.includes('<svg'))throw Error('TikZ smoke test produced no SVG');return {libraries:['angles','quotes','calc','arrows.meta','positioning','intersections'],svgCharacters:result.svg.length};});
  await check('browser-routes',async()=>{
   let browser;try{browser=await browserType.launch({headless:true});}catch{browser=await browserType.launch({headless:true,channel:'chrome'});}
   try{
    const page=await browser.newPage(),project={id:'workflow-preflight-isolated',title:'Preflight',sections:[],settings:{}};
    await routeCandidateProject(page,project);const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:15000});if(!response?.ok())throw Error('Preview server is unavailable');
    const result=await page.evaluate(async id=>{
     const direct=await (await fetch('/__booklet/projects/'+id)).json(),opened=await (await fetch('/__booklet/projects/'+id+'/open')).json();
     let writeBlocked=false;try{await fetch('/__booklet/projects/'+id,{method:'POST',body:'{}'});}catch{writeBlocked=true;}
     return {direct:direct.id,opened:opened.project?.id,bankItems:opened.bankSync?.items?.length,error:opened.bankSyncError,writeBlocked};
    },project.id);
    if(result.direct!==project.id||result.opened!==project.id||result.bankItems!==0||result.error!==''||!result.writeBlocked)throw Error('Isolated project/open contract failed');
    return {base,readOnlyRoutes:true};
   }finally{await browser.close();}
  });
  return {version:1,generatedAt:new Date().toISOString(),ok:checks.every(c=>c.ok),checks,note:'No model call made. Auth identity/output is not recorded. Library smoke covers the listed representative libraries; source-specific constructions still require validation.'};
 });
}
