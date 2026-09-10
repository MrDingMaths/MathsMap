// Offline prompt-size comparison against the first optimisation commit. No
// model calls, source writes or acceptance claims. Characters are not tokens.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {loadRun,parsePageSelection,DEFAULT_CONCURRENCY} from './transcription.mjs';
import {rankEvidence,textWindows,readableEvidence} from './transcription-packet.mjs';
import {createSemanticTasks} from './semantic-workflow.mjs';

const args=process.argv.slice(2),option=name=>args[args.indexOf(name)+1];
for(const name of ['--run-id','--config','--pages'])if(!args.includes(name))throw Error('Required '+name);
const runId=option('--run-id'),configFile=option('--config'),pages=parsePageSelection(option('--pages'));
const loaded=loadRun(runId),config=JSON.parse(fs.readFileSync(configFile,'utf8'));
const baseline='020d8a64';
const gitFile=file=>execFileSync('git',['show',`${baseline}:${file}`],{encoding:'utf8',maxBuffer:8*1024*1024});
const oldPrompts=await import('data:text/javascript;base64,'+Buffer.from(gitFile('scripts/booklet/token-efficient-prompts.mjs')).toString('base64'));
const script=gitFile('scripts/booklet/semantic-packets.mjs');
// Evaluate only the baseline's local prompt builder. Cache writes become no-ops;
// its model execution and result publication code are never evaluated.
const builder=script.slice(0,script.indexOf('const tasks=pages.map(buildTask);')).replace(/^import .*;\r?$/gm,'')+'\npages.map(buildTask);';
const oldTasks=vm.runInNewContext(builder,{
 fs:{...fs,mkdirSync:()=>{},writeFileSync:()=>{}},path,crypto,
 process:{argv:['node','semantic-packets.mjs','author','--run-id',runId,'--config',configFile,'--pages',option('--pages')]},
 loadRun:()=>loaded,parsePageSelection,DEFAULT_CONCURRENCY,...oldPrompts,rankEvidence,textWindows,readableEvidence,
},{timeout:120000});
const current=createSemanticTasks({...loaded,config,stage:'author',pages});
const rows=current.map((task,i)=>({page:task.page,beforeCharacters:oldTasks[i].prompt.length,afterCharacters:task.prompt.length,beforeImages:oldTasks[i].images.length,afterImages:task.images.length}));
const before=rows.reduce((n,p)=>n+p.beforeCharacters,0),after=rows.reduce((n,p)=>n+p.afterCharacters,0);
console.log(JSON.stringify({baseline,pages:rows,beforeCharacters:before,afterCharacters:after,reductionPercent:Number((100*(1-after/before)).toFixed(1)),note:'Full assembled prompt text including evidence. Not measured tokens, cost, latency or transcription fidelity. Teaching previews are bounded; all configured teaching images remain referenced.'},null,2));
