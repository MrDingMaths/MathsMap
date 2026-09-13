import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRun,parsePageSelection} from './transcription.mjs';
import {dependencyStatus,drainDependencies} from './dependency-runner.mjs';
import {buildRunReceipt} from './run-observability.mjs';
import {workflowPreflight} from './workflow-preflight.mjs';
export async function main(args=process.argv.slice(2)){
 const command=args[0],flags={};
 for(let i=1;i<args.length;i++){
  const key=args[i];if(['--retry','--representative'].includes(key)){flags[key]=true;continue;}
  if(!['--run-id','--run-dir','--pages','--config','--concurrency','--base','--out'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error('Invalid option '+key);flags[key]=args[++i];
 }
 if(!flags['--run-id']&&!(command==='receipt'&&flags['--run-dir']))throw Error('Use status|drain|preflight --run-id ID [--config JSON --pages RANGE --concurrency N --retry --representative], or receipt --run-dir DIR');
 const loaded=flags['--run-id']?loadRun(flags['--run-id']):{runDir:flags['--run-dir']};let result;
 if(command==='receipt')result=buildRunReceipt(loaded.runDir);
 else if(command==='preflight')result=await workflowPreflight({...loaded,base:flags['--base']});
 else if(['status','drain'].includes(command)){
  if(!flags['--config'])throw Error('Status/drain requires --config');
  const options={...loaded,config:JSON.parse(fs.readFileSync(flags['--config'],'utf8').replace(/^\uFEFF/,'')),pages:flags['--pages']?parsePageSelection(flags['--pages']):loaded.manifest.selectedPages,concurrency:flags['--concurrency']};
  const policy={retry:!!flags['--retry'],representative:!!flags['--representative']};
  result=command==='status'?dependencyStatus(options,policy):await drainDependencies(options,policy);
 }else throw Error('Unknown workflow command');
 if(flags['--out'])fs.writeFileSync(flags['--out'],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));if(result.ok===false)process.exitCode=1;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
