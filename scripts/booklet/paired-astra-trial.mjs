// Isolated paired authoring experiment. No production publication or acceptance.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createSemanticTasks,validateSemanticResult} from './semantic-workflow.mjs';
import {assignmentPayload,mergeAssignmentPackets} from './author-assignments.mjs';
import {runAstraTask} from './codex-transcription.mjs';
import {runBoundedJobs,workerConcurrency} from './worker-pool.mjs';
import {applyAttemptPatches} from './local-attempt-repair.mjs';
import {TRANSCRIPTION_DEFAULT} from './transcription-settings.mjs';
import {contentProject} from '../../src/lib/booklet-source-content.js';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';

const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const ref=f=>({path:path.resolve(f),hash:hash(fs.readFileSync(f))});
const save=(f,v)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n',{flag:'wx'});};
const safeId=id=>{if(!/^[a-z0-9-]+$/.test(id))throw Error('Unsafe trial identity');return id;};
const checks=['source','mathematics','taughtMethod','editability','presentation','rendered'];
export const PAIRED_TRIAL_SELECTION=Object.freeze([
 {id:'teaching',benchmarkSample:'s01',rootId:'p4-simplify-block',patterns:['teaching','shared-stems','answers']},
 {id:'fractions',benchmarkSample:'s04',rootId:'p44-q23',teachingPages:[10,16],patterns:['fractions','answers']},
 {id:'shared-stem',benchmarkSample:'s04',rootId:'p44-q24',teachingPages:[10,16],patterns:['shared-stems','fractions','answers']},
 {id:'graphs',benchmarkSample:'s07',rootId:'p21-q3',patterns:['graphs','shared-stems','answers']},
 {id:'solids',benchmarkSample:'s08',rootId:'p11-guided',inventoryFile:'.booklet-work/full-imports/volume-v1-20260912/semantic-packets/page-011.inventory.json',patterns:['solids','teaching','answers']},
 {id:'answers',benchmarkSample:'s10',rootId:'p25-q1',patterns:['solids','answers']},
]);
const commonNote='This is an isolated paired trial, not an import acceptance. Author only the selected complete inventory unit; all other visible content is source or teaching context. Do not inspect other candidates or prior model outputs. Preserve all assigned source expressions, givens, scaffolds, figures, source arrangements, intermediate demonstrations and answers. Keep all subparts under the shared stem. Native diagrams are editable, unshaded unless mathematically purposeful, black for ordinary edges/labels; solid visibility derives from faces and view, with solid silhouettes. Every complete native label is 10 pt, graph ticks 8.5 pt. Preserve source disagreements as findings, never invent review approval. Return JSON only.';

function trialRoot(out,{fresh=false}={}){
 const allowed=path.resolve('.booklet-work'),root=path.resolve(out);
 if(!root.startsWith(allowed+path.sep))throw Error('Trial output must be inside .booklet-work');
 for(let p=root;p!==path.dirname(allowed);p=path.dirname(p))if(fs.existsSync(p)&&fs.lstatSync(p).isSymbolicLink())throw Error('Trial paths cannot traverse symlinks');
 if(fresh&&fs.existsSync(root))throw Error('Use a fresh trial directory');
 return root;
}
export function selectCompleteUnit(inventory,rootId){
 const ids=new Set([rootId]),byId=new Map(inventory.entries.map(e=>[e.id,e]));
 if(!byId.has(rootId))throw Error('Unknown inventory root '+rootId);
 if(byId.get(rootId).parentId)throw Error('Select a complete top-level question or activity');
 let changed=true;while(changed){changed=false;for(const e of inventory.entries)if(e.parentId&&ids.has(e.parentId)&&!ids.has(e.id)){ids.add(e.id);changed=true;}}
 for(const e of inventory.entries.filter(e=>ids.has(e.id)))for(const linked of [e.continuationOf,...e.sharedContextIds??[],...e.sharedWith??[]].filter(Boolean))if(!ids.has(linked))throw Error('Selected unit has an external shared dependency: '+linked);
 for(const g of inventory.groups??[]){const members=g.inventoryIds??g.entryIds??g.members??[];if(members.some(id=>ids.has(id))&&members.some(id=>!ids.has(id)))throw Error('Selected unit splits a source group: '+g.id);}
 return {...inventory,entries:inventory.entries.filter(e=>ids.has(e.id)),groups:(inventory.groups??[]).filter(g=>ids.has(g.parentId)||(g.inventoryIds??g.entryIds??g.members??[]).some(id=>ids.has(id)))};
}
export function validateTrialPacket(packet,sample){
 const task={stage:'author',page:sample.page,inventory:sample.inventory};
 mergeAssignmentPackets(sample.inventory,[{assignment:sample.assignment,packet}]);
 validateSemanticResult(packet,task);
 return true;
}

export function preparePairedTrial({out,benchmarkDir='.booklet-work/model-benchmark-20260915',inventoryArm='sol-high',selection=PAIRED_TRIAL_SELECTION}){
 const root=trialRoot(out,{fresh:true}),benchmark=path.resolve(benchmarkDir),historical=read(path.join(benchmark,'protocol.json'));
 if(selection.length!==6||new Set(selection.map(s=>s.id)).size!==6)throw Error('The paired trial requires six distinct complete assignments');
 const patterns=new Set(selection.flatMap(s=>s.patterns));for(const p of ['teaching','fractions','graphs','solids','shared-stems','answers'])if(!patterns.has(p))throw Error('Missing trial pattern '+p);
 const samples=[],dependencies=[ref(path.join(benchmark,'protocol.json'))],prepared=new Set();
 fs.mkdirSync(root,{recursive:true});
 for(const selected of selection){
  safeId(selected.id);const source=historical.samples.find(s=>s.id===selected.benchmarkSample);if(!source)throw Error('Unknown historical source sample');
  const sourceDir=path.resolve('.booklet-work/full-imports',source.run),runDir=path.join(root,'evidence',source.run),inventoryFile=selected.inventoryFile?path.resolve(selected.inventoryFile):path.join(benchmark,inventoryArm,source.id,'inventory','result.json');
  const fullInventory=read(inventoryFile),inventory=selectCompleteUnit(fullInventory,selected.rootId),teachingPages=selected.teachingPages??source.teachingPages;
  dependencies.push(ref(inventoryFile),ref(path.join(sourceDir,'manifest.json')));
  for(const p of new Set([source.page,...teachingPages]))for(const ext of ['png','txt']){
   const name=`page-${String(p).padStart(3,'0')}.${ext}`,original=path.join(sourceDir,'evidence','pages',name),target=path.join(runDir,'evidence','pages',name);
   if(!prepared.has(target)){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(original,target,fs.constants.COPYFILE_EXCL);dependencies.push(ref(original));prepared.add(target);}
  }
  // Keep Word media links usable. Original paths are immutable hashed references;
  // copied markdown uses their absolute paths without changing the original file.
  const wordSource=path.join(sourceDir,'evidence','word','document.md'),wordTarget=path.join(runDir,'evidence','word','document.md');
  if(fs.existsSync(wordSource)&&!prepared.has(wordTarget)){
   const original=fs.readFileSync(wordSource,'utf8'),text=original.replace(/(!\[[^\]]*\]\()([^)]*)(\))/g,(all,before,url,after)=>{
    if(/^(?:[a-z]+:|\/)/i.test(url))return all;
    const media=path.resolve(path.dirname(wordSource),url);if(fs.existsSync(media))dependencies.push(ref(media));return before+media.replaceAll('\\','/')+after;
   });
   fs.mkdirSync(path.dirname(wordTarget),{recursive:true});fs.writeFileSync(wordTarget,text,{flag:'wx'});dependencies.push(ref(wordSource));prepared.add(wordTarget);
  }
  const invTarget=path.join(runDir,'semantic-packets',`page-${String(source.page).padStart(3,'0')}.inventory.json`);
  if(!prepared.has(invTarget)){save(invTarget,fullInventory);prepared.add(invTarget);}
  const manifest={...read(path.join(sourceDir,'manifest.json')),...TRANSCRIPTION_DEFAULT};delete manifest.workflowPolicy;delete manifest.pipelinePolicy;
  const config={title:source.title,topics:[{id:source.topic,title:source.titleTopic,start:source.page,end:source.page,teachingPages}],pageEvidence:{[source.page]:{note:commonNote}}};
  const task=createSemanticTasks({runDir,manifest,config,stage:'author',pages:[source.page]})[0];
  const assignment={id:'assignment-'+hash(inventory.entries.map(e=>e.id)).slice(0,20),pages:[source.page],inventoryIds:inventory.entries.map(e=>e.id),entries:inventory.entries.map(e=>({...e,pageNumber:source.page}))};
  const ownedTask={...task,inventory},bounded=assignmentPayload(assignment,[ownedTask]);
  for(const resource of bounded.resources){if(!fs.existsSync(resource.path)){fs.mkdirSync(path.dirname(resource.path),{recursive:true});fs.writeFileSync(resource.path,resource.text,{flag:'wx'});}}
  // Baseline keeps full page context, but both arms own and return the same unit.
  // Use identical output envelope to avoid confusing serialization with context cost.
  const baseline=task.promptSections.filter(s=>!['envelope','allowed-inventory-ids','inventory'].includes(s.name)).map(s=>s.text).join('\n\n')+'\n\nFull page inventory is context only:\n'+JSON.stringify(fullInventory)+'\n\n'+bounded.prompt.slice(bounded.prompt.indexOf('Author only the assigned inventory entries.'));
  const spec={...selected,run:source.run,page:source.page,title:source.title,topic:source.topic,titleTopic:source.titleTopic,teachingPages,runDir,manifest,config,inventory,assignment,images:task.images,sourceImage:ref(path.join(runDir,'evidence','pages',`page-${String(source.page).padStart(3,'0')}.png`)),inventorySource:ref(inventoryFile)};
  const inputFile=path.join(root,'samples',selected.id+'.json');save(inputFile,spec);
  for(const [arm,payload] of [['baseline',baseline],['bounded',bounded.prompt]]){
   const prompt=payload+'\n\n'+commonNote,file=path.join(root,'prompts',`${arm}-${selected.id}.txt`);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,prompt,{flag:'wx'});
   spec[arm]={prompt:ref(file),characters:prompt.length,images:task.images.map(ref)};
  }
  samples.push({id:spec.id,page:spec.page,run:spec.run,patterns:spec.patterns,ownership:assignment.inventoryIds,inventoryHash:hash(inventory),input:ref(inputFile),baseline:spec.baseline,bounded:spec.bounded});
 }
 const protocol={version:1,createdAt:new Date().toISOString(),model:{...TRANSCRIPTION_DEFAULT,serviceTier:'default'},arms:['baseline','bounded'],concurrency:3,samples,sourceDependencies:[...new Map(dependencies.map(d=>[d.path,d])).values()],acceptanceChecks:checks,
  notes:['Six complete ownership units; source images, inventory, output envelope, model, effort, Standard tier and acceptance identical across arms.','Baseline dispatches groups by source page with assignments serial inside each worker; bounded dispatches each unique assignment directly. Baseline retains full-page context.','Existing independent inventories are frozen inputs, not accepted model outputs. They require current source inspection before the run. Volume p11 uses the original Astra inventory: the historical Sol inventory incorrectly interpreted row b as a square frustum. Original evidence is unchanged.','Index p44 uses actual teaching p10 and p16 in both arms; the historical benchmark used practice p37 and p38. This trial is not a historical-model comparison.','Authoring and repair cost, current review results and missing usage are reported separately. No first-pass result grants acceptance; this is not full-booklet throughput or weekly-allowance measurement.']};
 save(path.join(root,'protocol.json'),protocol);save(path.join(root,'review-register.json'),{version:1,revision:0,records:[]});return protocol;
}

function loadTrial(out){
 const root=trialRoot(out),protocol=read(path.join(root,'protocol.json'));
 for(const s of protocol.samples)for(const artifact of [s.input,s.baseline.prompt,s.bounded.prompt,...s.baseline.images,...s.bounded.images])if(hash(fs.readFileSync(artifact.path))!==artifact.hash)throw Error('Frozen trial input changed: '+artifact.path);
 for(const artifact of protocol.sourceDependencies??[])if(hash(fs.readFileSync(artifact.path))!==artifact.hash)throw Error('Referenced source evidence changed: '+artifact.path);
 return {root,protocol};
}
function currentAttempt(root,arm,id){
 const dir=path.join(root,arm,id);if(!fs.existsSync(dir))return null;
 const attempts=fs.readdirSync(dir).filter(n=>/^\d+$/.test(n)).map(Number).sort((a,b)=>b-a);
 for(const attempt of attempts){const file=path.join(dir,String(attempt),'attempt.json');if(fs.existsSync(file))return {...read(file),directory:path.dirname(file),attempt};}
 return null;
}
function materialize(packet,sample,id){
 const candidate={title:'Astra paired trial '+sample.title,topics:[{id:sample.topic,title:sample.titleTopic}],sections:packet.sections,settings:{preserveSourcePages:false},sourceInventory:{version:1,selectedPages:[sample.page],pages:[{pageNumber:sample.page,inventoried:true}],entries:sample.inventory.entries.map(e=>({...e,pageNumber:sample.page,targetId:packet.inventoryMappings.find(m=>m.inventoryId===e.id)?.targetId??e.targetId}))}};
 const project=contentProject(candidate,{runId:id,projectId:id,selectedPages:[sample.page]});project.source={...project.source,trialOnly:true,unaccepted:true};return {candidate,project,validation:validateEditableProject(project)};
}
export async function runPairedTrial({out,arm,concurrency=3,timeoutMs=900000},{runner=runAstraTask,log=console.log}={}){
 const {root,protocol}=loadTrial(out);if(!protocol.arms.includes(arm))throw Error('Use baseline or bounded');workerConcurrency(concurrency);
 const started=Date.now(),results=[];
 const action=async item=>{
  const previous=currentAttempt(root,arm,item.id);if(previous){results.push(previous);return previous;}
  const sample=read(item.input.path),directory=path.join(root,arm,item.id,'1');fs.mkdirSync(directory,{recursive:true});
  const record={id:item.id,arm,attempt:1,kind:'generation',startedAt:new Date().toISOString(),inputHash:hash({input:item.input,payload:item[arm],model:protocol.model}),status:'pending',metrics:null};
  save(path.join(directory,'started.json'),record);log(JSON.stringify({event:'trial-started',arm,sample:item.id}));
  try{
   const reply=await runner({cwd:sample.runDir,runDir:root,prompt:fs.readFileSync(item[arm].prompt.path,'utf8'),images:item[arm].images.map(i=>i.path),out:directory,profile:'transcription',stage:'paired-trial-author',timeoutMs});record.metrics=reply.metrics;
   save(path.join(directory,'generation.json'),reply.result);
   if(reply.result?.packets?.length!==1)throw Error('Return one assigned source-page packet');
   const packet=reply.result.packets[0];save(path.join(directory,'packet.json'),packet);record.output=ref(path.join(directory,'packet.json'));validateTrialPacket(packet,sample);
   const built=materialize(packet,sample,'trial-'+arm+'-'+item.id);for(const [name,value] of Object.entries(built))save(path.join(directory,name+'.json'),value);
   record.status=built.validation.valid?'generated':'invalid';record.output=ref(path.join(directory,'packet.json'));record.project=ref(path.join(directory,'project.json'));record.validation=built.validation;
  }catch(error){record.status='failed';record.error=error.message;record.metrics??=error.metrics??null;}
  record.endedAt=new Date().toISOString();record.elapsedMs=Date.parse(record.endedAt)-Date.parse(record.startedAt);save(path.join(directory,'attempt.json'),record);results.push(record);log(JSON.stringify({event:'trial-finished',arm,sample:item.id,status:record.status,elapsedMs:record.elapsedMs,error:record.error}));return record;
 };
 const grouped=new Map();for(const sample of protocol.samples){const id=sample.run+'-'+sample.page;if(!grouped.has(id))grouped.set(id,{id,samples:[]});grouped.get(id).samples.push(sample);}
 const queue=arm==='bounded'?protocol.samples:[...grouped.values()];
 const outcomes=await runBoundedJobs(queue,arm==='bounded'?action:async group=>{const rows=[];for(const s of group.samples)rows.push(await action(s));return rows;},{concurrency});
 const report={arm,startedAt:new Date(started).toISOString(),endedAt:new Date().toISOString(),elapsedMs:Date.now()-started,concurrency,scheduled:queue.length,results:results.map(({directory,...r})=>r),queueErrors:outcomes.filter(o=>!o.ok).map(o=>({id:o.id,error:o.error.message}))};
 const file=path.join(root,arm,'execution-'+Date.now()+'.json');save(file,report);return report;
}

export function recordTrialReview({out,record}){
 const {root,protocol}=loadTrial(out);safeId(record.id);if(!protocol.arms.includes(record.arm)||!protocol.samples.some(s=>s.id===record.id))throw Error('Unknown trial assignment');
 const file=path.join(root,'review-register.json'),register=read(file),attempt=currentAttempt(root,record.arm,record.id);
 if(record.expectedRevision!==register.revision)throw Error('Review revision changed');
 if(!attempt?.output||record.outputHash!==attempt.output.hash||hash(fs.readFileSync(attempt.output.path))!==record.outputHash)throw Error('Review output changed');
 if(!record.reviewer?.trim()||!record.note?.trim()||!Array.isArray(record.artifacts)||!record.artifacts.length)throw Error('Review needs a reviewer, note and actual evidence');
 for(const c of checks)if(!['passed','failed','pending'].includes(record.checks?.[c]))throw Error('Explicit review status needed: '+c);
 for(const a of record.artifacts)if(!a.path||hash(fs.readFileSync(a.path))!==a.hash)throw Error('Review evidence changed');
 if(record.checks.rendered==='passed'&&!record.artifacts.some(a=>/\.(png|pdf)$/i.test(a.path)))throw Error('Rendered acceptance needs inspected image/PDF evidence');
 if(!Array.isArray(record.issues)||record.issues.some(i=>!i.trim()))throw Error('List unresolved issues explicitly');
 const accepted=checks.every(c=>record.checks[c]==='passed')&&!record.issues.length&&attempt.status==='generated';
 register.records.push({...record,accepted,attempt:attempt.attempt,at:new Date().toISOString()});register.revision++;
 // Trial metadata only; publication APIs are intentionally never called.
 fs.writeFileSync(file,JSON.stringify(register,null,2)+'\n');return {accepted,revision:register.revision};
}

export function repairTrialPacket({out,arm,id,expectedOutputHash,context,patches,reviewer,note,elapsedMs=null}){
 const {root,protocol}=loadTrial(out),entry=protocol.samples.find(s=>s.id===id);if(!entry||!protocol.arms.includes(arm))throw Error('Unknown trial assignment');
 const current=currentAttempt(root,arm,id);if(!current?.output||current.output.hash!==expectedOutputHash||hash(fs.readFileSync(current.output.path))!==expectedOutputHash)throw Error('Repair output changed');
 if(!reviewer?.trim()||!note?.trim())throw Error('Record repair reviewer and reason');
 const packet=applyAttemptPatches(read(current.output.path),context,patches),sample=read(entry.input.path);validateTrialPacket(packet,sample);
 const attempt=current.attempt+1,directory=path.join(root,arm,id,String(attempt));
 save(path.join(directory,'packet.json'),packet);save(path.join(directory,'repair.json'),{expectedOutputHash,context,patches,reviewer,note});
 const built=materialize(packet,sample,'trial-'+arm+'-'+id);for(const [name,value] of Object.entries(built))save(path.join(directory,name+'.json'),value);
 const record={id,arm,attempt,kind:'reviewed-exact-field-repair',status:built.validation.valid?'generated':'invalid',elapsedMs,metrics:null,output:ref(path.join(directory,'packet.json')),project:ref(path.join(directory,'project.json')),validation:built.validation,at:new Date().toISOString()};save(path.join(directory,'attempt.json'),record);return record;
}

export function pairedTrialReport(out){
 const {root,protocol}=loadTrial(out),register=read(path.join(root,'review-register.json')),arms={};
 for(const arm of protocol.arms){
  const rows=protocol.samples.map(s=>{const current=currentAttempt(root,arm,s.id),reviews=register.records.filter(r=>r.arm===arm&&r.id===s.id&&r.outputHash===current?.output?.hash),review=reviews.at(-1);return {id:s.id,status:current?.status??'not-run',attempts:current?.attempt??0,accepted:review?.accepted??false,checks:review?.checks??Object.fromEntries(checks.map(c=>[c,'pending'])),issues:review?.issues??[],output:current?.output??null};});
  const attempts=protocol.samples.flatMap(s=>{const d=path.join(root,arm,s.id);return fs.existsSync(d)?fs.readdirSync(d).filter(n=>/^\d+$/.test(n)).map(n=>path.join(d,n,'attempt.json')).filter(fs.existsSync).map(read):[];});
  const calls=[...new Map(attempts.filter(a=>a.kind==='generation').map(a=>[a.metrics?.callId??a.metrics?.sessionId??arm+':'+a.id+':'+a.attempt,a.metrics??{}])).values()];
  const tokenFields={inputTokens:'input_tokens',cachedInputTokens:'cached_input_tokens',outputTokens:'output_tokens'},usage={};
  for(const [name,key] of Object.entries(tokenFields)){const known=calls.filter(c=>Number.isFinite(c.usage?.[key]));usage[name]={knownTotal:known.reduce((n,c)=>n+c.usage[key],0),availableCalls:known.length,unavailableCalls:calls.length-known.length};}
  arms[arm]={rows,acceptedAssignments:rows.filter(r=>r.accepted).length,totalAssignments:rows.length,modelInvocations:calls.length,observedSessionCalls:calls.filter(c=>c.sessionId).length,repairs:attempts.filter(a=>a.kind!=='generation').length,usage,concurrentCallDurationMs:calls.reduce((n,c)=>n+(c.elapsedMs??0),0),unavailableCallDurations:calls.filter(c=>!Number.isFinite(c.elapsedMs)).length,knownRepairDurationMs:attempts.filter(a=>a.kind!=='generation'&&Number.isFinite(a.elapsedMs)).reduce((n,a)=>n+a.elapsedMs,0),unavailableRepairDurations:attempts.filter(a=>a.kind!=='generation'&&!Number.isFinite(a.elapsedMs)).length,toolCalls:calls.every(c=>Number.isFinite(c.toolCalls))?calls.reduce((n,c)=>n+c.toolCalls,0):null};
 }
 return {version:1,protocol:ref(path.join(root,'protocol.json')),arms,comparisonEligible:Object.values(arms).every(a=>a.acceptedAssignments===6),weeklyAllowanceMeasurement:null,fullBookletElapsedMeasurement:null,note:'All attempts and repairs count. Concurrent call durations are not wall time. Acceptance requires current source, maths, taught-method, editability, presentation and actual rendered review. Pending or failed work is not a speed saving; one pair does not establish whole-import throughput.'};
}

export async function main(args=process.argv.slice(2)){
 const command=args.shift(),flags={};for(let i=0;i<args.length;i+=2){if(!args[i].startsWith('--')||!args[i+1])throw Error('Expected --option VALUE');flags[args[i]]=args[i+1];}
 if(!flags['--out'])throw Error('--out is required');
 if(command==='prepare')return preparePairedTrial({out:flags['--out'],benchmarkDir:flags['--benchmark-dir']});
 if(command==='run')return runPairedTrial({out:flags['--out'],arm:flags['--arm'],concurrency:Number(flags['--concurrency']??3),timeoutMs:Number(flags['--timeout-ms']??900000)});
 if(command==='review')return recordTrialReview({out:flags['--out'],record:read(flags['--input'])});
 if(command==='repair')return repairTrialPacket({out:flags['--out'],...read(flags['--input'])});
 if(command==='report')return pairedTrialReport(flags['--out']);
 throw Error('Use prepare, run, review, repair or report');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().then(value=>console.log(JSON.stringify(value))).catch(error=>{console.error(error.stack);process.exitCode=1;});
