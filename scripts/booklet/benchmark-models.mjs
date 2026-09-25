import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createSemanticTasks,validateSemanticResult} from './semantic-workflow.mjs';
import {TRANSCRIPTION_DEFAULT} from './transcription-settings.mjs';
import {contentProject} from '../../src/lib/booklet-source-content.js';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=f=>fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'');
const json=f=>JSON.parse(read(f));
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
export const ARMS=[['astra-low','gpt-6-astra','low'],['astra-high','gpt-6-astra','high'],['sol-xhigh','gpt-6-sol','xhigh'],['luna-max','gpt-6-luna','max']].map(([id,model,effort])=>({id,model,effort}));
export const SAMPLES=[
 ['index-laws-compact-v1',4,'Index Laws','multiplication','Index Law of Multiplication',[3,4]],
 ['index-laws-compact-v1',5,'Index Laws','multiplication','Index Law of Multiplication',[3,4]],
 ['index-laws-compact-v1',16,'Index Laws','power-of-power','Index Law of Power of a Power',[16,17]],
 ['index-laws-compact-v1',44,'Index Laws','mixed-index-laws','Mixed Index Laws',[10,16]],
 ['linear-relationships-studio-v1',5,'Linear Relationships','coordinates','Coordinates',[4,5]],
 ['linear-relationships-studio-v1',16,'Linear Relationships','linear-graphs','Graphing Linear Relationships',[15,16]],
 ['linear-relationships-studio-v1',21,'Linear Relationships','linear-graphs','Graphing Linear Relationships',[15,16]],
 ['volume-v1-20260912',11,'Volume','cross-sections','Cross-Sections',[8,10]],
 ['volume-v1-20260912',19,'Volume','prism-volume','Volume of Prisms',[18,19]],
 ['volume-v1-20260912',25,'Volume','cylinder-volume','Volume of Cylinders',[23,24]],
].map(([run,page,title,topic,titleTopic,teachingPages],i)=>({id:`s${String(i+1).padStart(2,'0')}`,run,page,title,topic,titleTopic,teachingPages}));
const GUIDES=['AGENTS.md','docs/booklet-cross-session-rules.md','docs/booklet-transcription-feedback-checklist.md','docs/booklet-worked-solution-style.md','docs/booklet-standard-palette.md','docs/booklet-diagram-colours.md','docs/booklet-diagram-typography.md','docs/solid-visibility.md','docs/booklet-volume-feedback-2026-09-12.md','docs/booklet-practice-only-import.md'];
const note='First-pass benchmark candidate, never accepted or verified. Access only supplied frozen source evidence, not existing projects, other outputs or repository code. Source mistakes are findings, not silently corrected. Preserve native editable content, all rows/columns and mathematical meaning. Return requested JSON only; do not write files. No retries or model substitution. This trial deliberately stops after first-pass generation: acceptance, repairs, publication and production workflow registration are separate coordinator work. The following frozen house guidance governs content; operational publication and review instructions do not authorize this worker to perform those stages.';

// Pin the complete local import graph, including prompt and validation helpers.
export function dependencies(entry,seen=new Set()){
 const f=path.resolve(entry);if(seen.has(f))return seen;seen.add(f);
 for(const m of read(f).matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){
  const next=path.resolve(path.dirname(f),m[1]);if(fs.existsSync(next)&&fs.statSync(next).isFile())dependencies(next,seen);
 }return seen;
}
export function commandArgs(arm,cwd,images,raw){
 const args=['exec','--ephemeral','--ignore-user-config','--skip-git-repo-check','--sandbox','read-only','-C',cwd,'--model',arm.model,'-c',`model_reasoning_effort="${arm.effort}"`,'-c','service_tier="default"','-c','features.fast_mode=false','--json','--output-last-message',raw];
 for(const image of images)args.push('--image',image);return [...args,'-'];
}
export function classifyFailure(message=''){
 if(/unauthorized|authentication|not logged in|invalid.{0,10}api.key|401\b|spawn.*ENOENT|executable.*not found/i.test(message))return 'environment';
 if(/(?:model|reasoning|effort).{0,100}(?:unsupported|not supported|not found|does not exist|not available)|(?:unsupported|not supported).{0,100}(?:model|reasoning|effort)/i.test(message))return 'unsupported-model';
 return message?'call-failure':null;
}
function config(sample,calibration={}){return {title:sample.title,topics:[{id:sample.topic,title:sample.titleTopic,start:sample.page,end:sample.page,teachingPages:sample.teachingPages}],...(calibration[sample.id]?{pageEvidence:{[sample.page]:{note:'ACCEPTED CANONICAL PRESENTATION CONTEXT (style/arrangement only; independently transcribe and calculate content from source):\n'+JSON.stringify(calibration[sample.id])}}}:{})};}
export function selectBenchmarkArms(ids=ARMS.map(a=>a.id)){
 if(!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!ARMS.some(a=>a.id===id)))throw Error('Select distinct supported benchmark arms');
 return ids.map(id=>ARMS.find(a=>a.id===id));
}
function assertIsolated(dir){const rel=path.relative(path.join(repo,'.booklet-work'),dir);if(!rel||rel.startsWith('..')||path.isAbsolute(rel))throw Error('Run directory must be a new child of .booklet-work');}
export function prepare(dir,{arms=ARMS,calibrationFile=null}={}){
 assertIsolated(dir);if(fs.existsSync(dir))throw Error('Prepare requires a new run directory');fs.mkdirSync(dir,{recursive:true});
 const frozenFiles={},copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);frozenFiles[path.relative(dir,to)]=hash(fs.readFileSync(to));};
 const calibration=calibrationFile?json(calibrationFile):{};
 if(calibrationFile)copy(calibrationFile,path.join(dir,'calibration.json'));
 const guides=GUIDES.map(f=>{copy(path.join(repo,f),path.join(dir,'instructions',f));return `\n\n--- ${f} ---\n${read(path.join(repo,f))}`;}).join('');
 const supplement=note+guides;fs.writeFileSync(path.join(dir,'instructions.txt'),supplement,{flag:'wx'});frozenFiles['instructions.txt']=hash(supplement);
 for(const sample of SAMPLES){
  const source=path.join(repo,'.booklet-work/full-imports',sample.run),dest=path.join(dir,'sources',sample.id);
  copy(path.join(source,'manifest.json'),path.join(dest,'original-manifest.json'));
  const manifest={...json(path.join(source,'manifest.json')),...TRANSCRIPTION_DEFAULT};delete manifest.workflowPolicy;
  save(path.join(dest,'manifest.json'),manifest);frozenFiles[path.relative(dir,path.join(dest,'manifest.json'))]=hash(fs.readFileSync(path.join(dest,'manifest.json')));
  for(const p of new Set([sample.page,...sample.teachingPages]))for(const ext of ['txt','png']){const name=`page-${String(p).padStart(3,'0')}.${ext}`;copy(path.join(source,'evidence/pages',name),path.join(dest,'evidence/pages',name));}
  const word=path.join(source,'evidence/word/document.md');if(fs.existsSync(word))copy(word,path.join(dest,'evidence/word/document.md'));
  const task=createSemanticTasks({runDir:dest,manifest,config:config(sample,calibration),stage:'inventory',pages:[sample.page]})[0];task.prompt+='\n\n'+supplement;
  save(path.join(dest,'inventory-task.json'),task);frozenFiles[path.relative(dir,path.join(dest,'inventory-task.json'))]=hash(fs.readFileSync(path.join(dest,'inventory-task.json')));
 }
 const implementation=Object.fromEntries([...dependencies(fileURLToPath(import.meta.url))].map(f=>[path.relative(repo,f),hash(fs.readFileSync(f))]));
 save(path.join(dir,'protocol.json'),{version:1,createdAt:new Date().toISOString(),arms,samples:SAMPLES,maxConcurrency:3,timeoutMs:900000,serviceTier:'default',plannedCalls:arms.length*SAMPLES.length*2,implementation,frozenFiles,scope:'Independent inventory then own-inventory authoring; no retries, repairs, publication or acceptance. Review and exports are separate.',calibrated:!!calibrationFile});
 return dir;
}
export function verifyFrozen(dir,protocol=json(path.join(dir,'protocol.json'))){
 for(const [base,entries] of [[repo,protocol.implementation],[dir,protocol.frozenFiles]])for(const [f,digest] of Object.entries(entries))if(hash(fs.readFileSync(path.join(base,f)))!==digest)throw Error('Frozen dependency changed: '+f);
}
export async function invoke(arm,task,out,{timeoutMs=900000,bin=process.env.BOOKLET_CODEX_BIN??'codex'}={}){
 fs.mkdirSync(out,{recursive:true});const started=Date.now(),raw=path.join(out,'last-message.txt'),args=commandArgs(arm,path.dirname(path.dirname(out)),task.images,raw);
 fs.writeFileSync(path.join(out,'prompt.txt'),task.prompt,{flag:'wx'});save(path.join(out,'invocation.json'),{bin,args,startedAt:new Date(started).toISOString()});
 let usage=null,observedModel=null,sessionId=null,error=null,exitCode=null,timedOut=false;const events=fs.openSync(path.join(out,'events.jsonl'),'wx'),stderr=fs.openSync(path.join(out,'stderr.txt'),'wx');
 try{await new Promise(resolve=>{const child=spawn(bin,args,{windowsHide:true,shell:false,stdio:['pipe','pipe','pipe']});let buffer='';const consume=line=>{try{const e=JSON.parse(line);if(e.usage)usage=e.usage;if(e.model)observedModel=e.model;if(e.type==='thread.started')sessionId=e.thread_id??e.session_id;if(e.type==='error')error=e.message??JSON.stringify(e);}catch{}};
  const timer=setTimeout(()=>{timedOut=true;error='15-minute timeout';if(process.platform==='win32')spawn('taskkill',['/pid',String(child.pid),'/t','/f'],{windowsHide:true,stdio:'ignore'});else child.kill('SIGKILL');},timeoutMs);
  child.stdout.on('data',c=>{fs.writeSync(events,c);buffer+=c;let i;while((i=buffer.indexOf('\n'))>=0){consume(buffer.slice(0,i));buffer=buffer.slice(i+1);}});child.stderr.on('data',c=>fs.writeSync(stderr,c));child.on('error',e=>{error=e.message;});child.stdin.on('error',e=>{error??=e.message;});child.on('close',code=>{clearTimeout(timer);consume(buffer);exitCode=code;resolve();});child.stdin.end(task.prompt);
 });}finally{fs.closeSync(events);fs.closeSync(stderr);}
 let result=null;try{if(exitCode!==0||timedOut)throw Error(error??`CLI exit ${exitCode}`);result=JSON.parse(read(raw).trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}catch(e){error??=e.message;}
 const metrics={requestedModel:arm.model,effort:arm.effort,serviceTier:'default',observedModel,sessionId,startedAt:new Date(started).toISOString(),endedAt:new Date().toISOString(),elapsedMs:Date.now()-started,usage,exitCode,error,timedOut,failureClass:error?classifyFailure([error,read(path.join(out,'stderr.txt'))].filter(Boolean).join('\n')):null,promptHash:hash(task.prompt),imageHashes:task.images.map(f=>({file:f,hash:hash(fs.readFileSync(f))}))};
 if(result)save(path.join(out,'result.json'),result);save(path.join(out,'metrics.json'),metrics);return {result,metrics};
}

// Rotate priority after each dispatch, while allowing only one call per arm.
export async function schedule(arms,work,{limit=3}={}){
 const pending=arms.map(arm=>({arm,busy:false,done:false}));let cursor=0,active=0,fatal=null;
 await new Promise((resolve,reject)=>{const pump=()=>{if(fatal){if(!active)reject(fatal);return;}let searched=0;while(active<limit&&searched<pending.length){const entry=pending[cursor];cursor=(cursor+1)%pending.length;searched++;if(entry.busy||entry.done)continue;entry.busy=true;active++;Promise.resolve().then(()=>work(entry.arm)).then(more=>{entry.done=!more;},e=>{fatal=e;}).finally(()=>{entry.busy=false;active--;pump();});}if(!active)resolve();};pump();});
}
export async function run(dir){
 const protocol=json(path.join(dir,'protocol.json'));verifyFrozen(dir,protocol);const lock=path.join(dir,'execution-start.json');save(lock,{startedAt:new Date().toISOString()});
 const arms=protocol.arms,calibration=fs.existsSync(path.join(dir,'calibration.json'))?json(path.join(dir,'calibration.json')):{};
 const states=new Map(arms.map(a=>[a.id,{index:0,stage:'inventory',inventory:null}]));let globalStop=null;
 await schedule(arms,async arm=>{
  const state=states.get(arm.id);if(globalStop||state.index>=SAMPLES.length)return false;verifyFrozen(dir,protocol);
  const sample=SAMPLES[state.index],base=path.join(dir,arm.id,sample.id),source=path.join(dir,'sources',sample.id),stage=state.stage,manifest=json(path.join(source,'manifest.json'));let task;
  if(stage==='inventory')task=json(path.join(source,'inventory-task.json'));
  else{
   fs.mkdirSync(path.join(base,'semantic-packets'),{recursive:true});fs.cpSync(path.join(source,'evidence'),path.join(base,'evidence'),{recursive:true,errorOnExist:true,force:false});save(path.join(base,'semantic-packets',`page-${String(sample.page).padStart(3,'0')}.inventory.json`),state.inventory);
   task=createSemanticTasks({runDir:base,manifest,config:config(sample,calibration),stage,pages:[sample.page]})[0];task.prompt=task.prompt.split(base).join(source)+'\n\n'+read(path.join(dir,'instructions.txt'));task.images=task.images.map(f=>f.replace(base,source));
  }
  console.log(JSON.stringify({event:'started',arm:arm.id,sample:sample.id,stage,at:new Date().toISOString()}));
  const reply=await invoke(arm,task,path.join(base,stage));let validationError=null;try{validateSemanticResult(reply.result,{stage,page:sample.page,inventory:state.inventory});}catch(e){validationError=e.message;}
  save(path.join(base,stage,'validation.json'),{valid:!validationError,error:validationError});
  console.log(JSON.stringify({event:'finished',arm:arm.id,sample:sample.id,stage,error:reply.metrics.error,validationError}));
  if(reply.metrics.failureClass==='environment'||(state.index===0&&stage==='inventory'&&reply.metrics.error)){globalStop=reply.metrics.error??'Environment failure';if(!fs.existsSync(path.join(dir,'environment-stop.json')))save(path.join(dir,'environment-stop.json'),{arm:arm.id,sample:sample.id,reason:globalStop});return false;}
  if(reply.metrics.failureClass==='unsupported-model'){save(path.join(dir,arm.id,'halt.json'),{sample:sample.id,reason:reply.metrics.error??'Unsupported model; see raw logs'});return false;}
  if(stage==='inventory'&&!validationError){state.inventory=reply.result;state.stage='author';return true;}
  if(stage==='author'&&reply.result?.sections?.length){try{
   const author=reply.result,candidate={title:`Benchmark ${arm.id} ${sample.title} p${sample.page}`,topics:[{id:sample.topic,title:sample.titleTopic}],sections:author.sections,settings:{preserveSourcePages:false},sourceInventory:{version:1,selectedPages:[sample.page],pages:[{pageNumber:sample.page,inventoried:true}],entries:state.inventory.entries.map(e=>({...e,pageNumber:sample.page,targetId:author.inventoryMappings?.find(m=>m.inventoryId===e.id)?.targetId??e.targetId}))}};
   save(path.join(base,'candidate.json'),candidate);const project=contentProject(candidate,{runId:`benchmark-${arm.id}-${sample.id}`,projectId:`benchmark-${arm.id}-${sample.id}`,selectedPages:[sample.page]});project.source.sourceHashes={pdf:manifest.source.pdfHash,docx:manifest.source.docxHash};save(path.join(base,'project.json'),project);save(path.join(base,'project-validation.json'),validateEditableProject(project));
  }catch(e){if(!fs.existsSync(path.join(base,'project-validation.json')))save(path.join(base,'project-validation.json'),{valid:false,errors:[e.message]});}}
  state.index++;state.stage='inventory';state.inventory=null;return state.index<SAMPLES.length;
 });
 save(path.join(dir,'execution-end.json'),{endedAt:new Date().toISOString(),globalStop});return report(dir);
}
export function report(dir){
 const {arms,samples}=json(path.join(dir,'protocol.json'));
 const records=[];for(const arm of arms)for(const sample of samples)for(const stage of ['inventory','author']){const base=path.join(dir,arm.id,sample.id,stage),f=path.join(base,'metrics.json');if(fs.existsSync(f))records.push({arm:arm.id,sample:sample.id,stage,...json(f),validation:fs.existsSync(path.join(base,'validation.json'))?json(path.join(base,'validation.json')):null});}
 const summary=arms.map(arm=>{const rows=records.filter(r=>r.arm===arm.id),totals={};for(const r of rows)for(const [k,v] of Object.entries(r.usage??{}))if(typeof v==='number')totals[k]=(totals[k]??0)+v;return {arm:arm.id,calls:rows.length,validInventories:rows.filter(r=>r.stage==='inventory'&&r.validation?.valid).length,validAuthors:rows.filter(r=>r.stage==='author'&&r.validation?.valid).length,elapsedCallMs:rows.reduce((n,r)=>n+r.elapsedMs,0),timeouts:rows.filter(r=>r.timedOut).length,missingUsage:rows.filter(r=>!r.usage).length,observedTokenTotals:totals,halt:fs.existsSync(path.join(dir,arm.id,'halt.json'))?json(path.join(dir,arm.id,'halt.json')):null};});
 return {summary,records,note:'Quality review, project validity, rendering, export reuse and review time require separate evidence. Token totals include observed calls only; missing usage is unknown.'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),i=args.indexOf('--run-dir');if(i<0||!args[i+1])throw Error('Use --prepare|--run|--report --run-dir DIR');const dir=path.resolve(args[i+1]);assertIsolated(dir);
 if(args.includes('--prepare'))console.log(prepare(dir,{arms:selectBenchmarkArms(args.includes('--arms')?args[args.indexOf('--arms')+1].split(','):undefined),calibrationFile:args.includes('--calibration')?args[args.indexOf('--calibration')+1]:null}));else if(args.includes('--run'))console.log(JSON.stringify(await run(dir),null,2));else if(args.includes('--report'))console.log(JSON.stringify(report(dir),null,2));else throw Error('Choose --prepare, --run or --report');
}
