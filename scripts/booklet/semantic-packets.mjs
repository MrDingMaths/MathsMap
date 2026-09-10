// CLI wrapper; prompt construction and execution can be inspected offline.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRun,parsePageSelection} from './transcription.mjs';
import {runSemanticPackets} from './semantic-workflow.mjs';

export async function main(args=process.argv.slice(2)){
 const stage=args[0],options={};
 for(let i=1;i<args.length;i++){
  const key=args[i];
  if(key==='--dry-run'){options[key]=true;continue;}
  if(!['--run-id','--pages','--config','--attempt','--concurrency'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid or missing option '+key);
  options[key]=args[++i];
 }
 if(!options['--run-id']||!options['--pages']||!options['--config'])throw Error('Use inventory|author --run-id ID --pages RANGE --config FILE [--attempt N] [--concurrency N] [--dry-run]');
 const loaded=loadRun(options['--run-id']);
 const report=await runSemanticPackets({...loaded,config:JSON.parse(fs.readFileSync(options['--config'],'utf8').replace(/^\uFEFF/,'')),stage,pages:parsePageSelection(options['--pages']),attempt:options['--attempt']??1,concurrency:options['--concurrency']??loaded.manifest.concurrency,dryRun:options['--dry-run']??false});
 if(report.ok===false)process.exitCode=1;
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
