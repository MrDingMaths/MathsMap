// CLI wrapper; prompt construction and execution can be inspected offline.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {loadRun,parsePageSelection,assertPinnedInputs} from './transcription.mjs';
import {createSemanticTasks,runSemanticPackets} from './semantic-workflow.mjs';
import {readAttemptReceipt} from './semantic-run-metrics.mjs';
import {parseResultFile} from '../agy/lib/agy-run.mjs';

// Revalidate unpublished inventories after a tool-only change. Source evidence,
// the delivered prompt and the original model output must remain unchanged.
export async function replayInventory(options,{assertInputs=assertPinnedInputs,log=console.log}={}){
 const from=Number(options.fromAttempt);
 if(!Number.isSafeInteger(from)||from<1||!Number.isSafeInteger(Number(options.attempt))||Number(options.attempt)<=from)throw Error('Choose a preserved source attempt and a newer replay attempt');
 assertInputs(options.runDir);
 const tasks=createSemanticTasks({...options,stage:'inventory'}),records=new Map();
 const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 for(const task of tasks){
  const dir=path.join(task.packetRoot,`${task.stem}.inventory.${from}`);
  if(fs.existsSync(task.resultFile)||fs.existsSync(path.join(dir,'result.meta.json')))throw Error('Preserve already published inventory: '+task.page);
  if(fs.readFileSync(path.join(dir,'prompt.md'),'utf8')!==task.prompt)throw Error('Source prompt changed: '+task.page);
  const raw=path.join(dir,'last-message.txt'),generation=path.join(dir,'generation.json'),result=path.join(dir,'result.json');
  const value=parseResultFile(raw);
  if(!isDeepStrictEqual(value,parseResultFile(generation))||fs.existsSync(result)&&!isDeepStrictEqual(value,parseResultFile(result)))throw Error('Preserved inventory output changed: '+task.page);
  records.set(task.prompt,{value,files:[raw,generation,...(fs.existsSync(result)?[result]:[]),path.join(dir,'prompt.md')].map(file=>({file,hash:hash(file)}))});
 }
 const verify=()=>{
  assertInputs(options.runDir);
  for(const task of createSemanticTasks({...options,stage:'inventory'})){
   const record=records.get(task.prompt);
   if(!record||record.files.some(ref=>hash(ref.file)!==ref.hash))throw Error('Replay source or output changed');
  }
 };
 return runSemanticPackets({...options,stage:'inventory',localReplay:true,retryReason:'validation-repair'},{log,verifyPublication:verify,runner:async task=>{
  verify();const record=records.get(task.prompt);if(!record)throw Error('Replay prompt changed');
  return {result:structuredClone(record.value),metrics:{provider:'local-replay',externalModelCalls:0,usage:null,elapsedMs:0}};
 }});
}

// Recover unpublished page assemblies after an implementation-only change.
// The delivered prompt and both retained output copies must still match.
export async function replayAuthor(options,{assertInputs=assertPinnedInputs,log=console.log,createTasks=createSemanticTasks,runPackets=runSemanticPackets}={}){
 const from=Number(options.fromAttempt);
 if(!Number.isSafeInteger(from)||from<1||!Number.isSafeInteger(Number(options.attempt))||Number(options.attempt)<=from)throw Error('Choose a preserved source attempt and a newer replay attempt');
 assertInputs(options.runDir);
 const tasks=createTasks({...options,stage:'author'}),records=new Map();
 const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 for(const task of tasks){
  const dir=path.join(task.packetRoot,`${task.stem}.author.${from}`);
  if(fs.existsSync(task.resultFile)||fs.existsSync(path.join(dir,'result.meta.json')))throw Error('Preserve already published author output: '+task.page);
  const prompt=path.join(dir,'prompt.md'),generation=path.join(dir,'generation.json'),result=path.join(dir,'result.json');
  if(fs.readFileSync(prompt,'utf8')!==task.prompt)throw Error('Source prompt changed: '+task.page);
  const value=parseResultFile(generation);
  if(!isDeepStrictEqual(value,parseResultFile(result)))throw Error('Preserved author output changed: '+task.page);
  records.set(task.prompt,{value,files:[prompt,generation,result].map(file=>({file,hash:hash(file)}))});
 }
 const verify=()=>{
  assertInputs(options.runDir);
  for(const task of createTasks({...options,stage:'author'})){
   const record=records.get(task.prompt);
   if(!record||record.files.some(ref=>hash(ref.file)!==ref.hash))throw Error('Replay source or output changed');
  }
 };
 return runPackets({...options,stage:'author',pageReplay:true,localReplay:true,retryReason:'validation-repair'},{log,verifyPublication:verify,runner:async task=>{
  verify();const record=records.get(task.prompt);if(!record)throw Error('Replay prompt changed');
  return {result:structuredClone(record.value),metrics:{provider:'local-replay',externalModelCalls:0,usage:null,elapsedMs:0}};
 }});
}

export async function main(args=process.argv.slice(2)){
 const stage=args[0],options={};
 for(let i=1;i<args.length;i++){
  const key=args[i];
  if(['--dry-run','--representative'].includes(key)){options[key]=true;continue;}
  if(!['--run-id','--pages','--config','--attempt','--from-attempt','--concurrency','--repair-from','--retry-reason','--regenerate-reason'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid or missing option '+key);
  options[key]=args[++i];
 }
 if(stage==='metrics'&&options['--run-id']){const report=readAttemptReceipt(path.join(loadRun(options['--run-id']).runDir,'semantic-packets'));console.log(JSON.stringify(report,null,2));return report;}
 if(!options['--run-id']||!options['--pages']||!options['--config'])throw Error('Use inventory|author --run-id ID --pages RANGE --config FILE [--attempt N] [--repair-from N] [--retry-reason REASON] [--concurrency N] [--dry-run], replay-inventory|replay-author with --from-attempt N --attempt NEW, or metrics --run-id ID');
 const loaded=loadRun(options['--run-id']);
 if(['replay-inventory','replay-author'].includes(stage)){
  const replay=stage==='replay-author'?replayAuthor:replayInventory;
  const report=await replay({...loaded,config:JSON.parse(fs.readFileSync(options['--config'],'utf8').replace(/^\uFEFF/,'')),pages:parsePageSelection(options['--pages']),attempt:Number(options['--attempt']),fromAttempt:Number(options['--from-attempt']),concurrency:Number(options['--concurrency']??loaded.manifest.concurrency),dryRun:options['--dry-run']??false});
  if(report.ok===false)process.exitCode=1;return report;
 }
 const report=await runSemanticPackets({...loaded,config:JSON.parse(fs.readFileSync(options['--config'],'utf8').replace(/^\uFEFF/,'')),stage,pages:parsePageSelection(options['--pages']),attempt:options['--attempt']??1,concurrency:options['--concurrency']??loaded.manifest.concurrency,dryRun:options['--dry-run']??false,representative:options['--representative']??false,repairFrom:options['--repair-from']??null,retryReason:options['--retry-reason']??null,regenerationReason:options['--regenerate-reason']??null});
 if(report.ok===false)process.exitCode=1;
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
