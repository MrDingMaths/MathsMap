// Explicit adoption of independently reviewed inventories. This never changes
// generation metadata, canonical content, review credit or original usage.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createSemanticTasks,validateSemanticResult} from './semantic-workflow.mjs';
import {bytesHash,fingerprint,liveWorkflow,updateWorkflow,reviewEnabled} from './workflow-review.mjs';
import {withRunLock} from './run-observability.mjs';
import {requireCurrentTranscription} from './transcription-settings.mjs';

const FORMAT='mathsmap-reviewed-inventory-reuse-v1';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const digest=value=>createHash('sha256').update(value).digest('hex');
const ref=file=>({path:path.resolve(file),hash:bytesHash(file)});
const same=(a,b)=>fingerprint(a)===fingerprint(b);
function current(reference,label){
 if(!reference?.path||!reference.hash||bytesHash(reference.path)!==reference.hash)throw Error('Stale '+label+' evidence');
 return reference;
}
function evidence(artifacts,label){
 if(!Array.isArray(artifacts)||!artifacts.length)throw Error(label+' needs hashed evidence');
 artifacts.forEach(a=>current(a,label));
}
export function freshGenerationOptions(options,stage,page){
 const manifestFile=path.join(options.runDir,'manifest.json');
 const manifest=fs.existsSync(manifestFile)?read(manifestFile):options.manifest;
 let configFile=stage==='inventory'&&options.inventoryConfigFile?options.inventoryConfigFile:options.configFile;
 let config=configFile?read(configFile):options.config;
 if(stage==='inventory'&&config?.format==='mathsmap-inventory-config-selection-v1'){
  page??=options.pages?.length===1?options.pages[0]:undefined;
  const selected=config.pages?.[page];current(selected,'selected original inventory configuration for page '+page);
  configFile=selected.path;config=read(configFile);
 }
 return {...options,manifest,config,...(configFile?{configFile:path.resolve(configFile)}:{})};
}
function implementationKeys(implementation){
 for(const key of ['runner','workerPool','assignments'])current(implementation?.[key],'historical '+key);
 return {executionHash:fingerprint([['codex-transcription.mjs',implementation.runner.hash],['worker-pool.mjs',implementation.workerPool.hash]]),assignmentImplementation:implementation.assignments.hash};
}
function currentImplementationKeys(){
 const hash=name=>bytesHash(fileURLToPath(new URL('./'+name,import.meta.url)));
 return {executionHash:fingerprint([['codex-transcription.mjs',hash('codex-transcription.mjs')],['worker-pool.mjs',hash('worker-pool.mjs')]]),assignmentImplementation:hash('author-assignments.mjs')};
}
function validateReview(record,{recording=false}={}){
 if(!record.reviewer?.trim()||!record.note?.trim())throw Error('Inventory reuse needs a named reviewer and observations');
 evidence(record.artifacts,'Implementation review');
 const old=implementationKeys(record.historicalImplementations),now=recording?currentImplementationKeys():null;
 if(!Array.isArray(record.reviewedImplementationChanges)||record.reviewedImplementationChanges.length!==2)throw Error('Review both explicit implementation dependencies');
 for(const name of ['executionHash','assignmentImplementation']){
  const changes=record.reviewedImplementationChanges.filter(c=>c.name===name),change=changes[0];
  if(changes.length!==1||change.from!==old[name]||!change.to||!change.reason?.trim()||recording&&change.to!==now[name])throw Error('Unexplained implementation change: '+name);
  evidence(change.artifacts,'Implementation change '+name);
 }
 return old;
}
// Author teaching/answer selection is intentionally separate. It cannot change
// the source import identity, scope or topic membership of an old inventory.
function importScope(config,manifest,page){
 const topic=config.topics?.find(t=>page>=t.start&&page<=t.end);
 return {title:config.title,contentScope:config.contentScope??'all',sourceEvidenceMode:config.sourceEvidenceMode??'text',workflowPolicy:config.workflowPolicy??null,
  topic:topic?{id:topic.id,title:topic.title,start:topic.start,end:topic.end}:null,
  page,selectedPages:manifest.selectedPages,source:manifest.source??null,workflow:manifest.workflowPolicy??null,pipeline:manifest.pipelinePolicy??null};
}
function reconstructedInput(task,manifest,keys){
 const prefix=(page,teacher=false)=>path.join(task.packetRoot,'..','evidence',...(teacher?['teacher']:[]),'pages',`page-${String(page).padStart(3,'0')}`);
 const teacherHashes=task.teacherPages.map(p=>[p,bytesHash(prefix(p,true)+'.png'),bytesHash(prefix(p,true)+'.txt')]);
 // Keep this legacy v2 ordering exact. Verify it against the CURRENT task key
 // too, so a future key/schema change fails closed instead of being whitelisted.
 return fingerprint({version:2,stage:'inventory',page:task.page,configuration:task.generationDependencies.configuration,executionHash:keys.executionHash,
  ...(teacherHashes.length?{teacherHashes}:{}),prompt:task.prompt,images:task.images.map(file=>[file,bytesHash(file)]),
  teachingImages:task.contextPages.map(p=>bytesHash(prefix(p)+'.png')),wordHash:null,
  ...(manifest.pipelinePolicy?{pipelinePolicy:manifest.pipelinePolicy,assignmentImplementation:keys.assignmentImplementation}:{})});
}
function pageSnapshot(options,selection,keys,state){
 const {page,originalAttempt}=selection;
 if(!Number.isSafeInteger(page)||page<1||!Number.isSafeInteger(originalAttempt)||originalAttempt<1)throw Error('Select an exact successful page and original attempt');
 if(!options.inventoryConfigFile)throw Error('Reviewed reuse requires the retained inventoryConfigFile');
 const inventoryOptions=freshGenerationOptions(options,'inventory',page),authorOptions=freshGenerationOptions(options,'author');
 const {runDir,manifest,config}=inventoryOptions;
 if(!reviewEnabled(manifest,config))throw Error('Reviewed reuse requires the review-first workflow');
 const scope=importScope(config,manifest,page);
 if(!same(scope,importScope(authorOptions.config,authorOptions.manifest,page)))throw Error('Requested import source/content scope or topic membership changed');
 const task=createSemanticTasks({...inventoryOptions,stage:'inventory',pages:[page],workflowState:state})[0];
 const dir=path.join(runDir,'semantic-packets',`${task.stem}.inventory.${originalAttempt}`);
 const original=Object.fromEntries(Object.entries({taskInput:'task-input.json',prompt:'prompt.md',config:'config.json',metadata:'result.meta.json',result:'result.json'}).map(([key,name])=>[key,ref(path.join(dir,name))]));
 const input=read(original.taskInput.path),meta=read(original.metadata.path),savedConfig=read(original.config.path);
 requireCurrentTranscription(meta);
 if(meta.version!==2||meta.stage!=='inventory'||meta.page!==page||!meta.inputHash||meta.inputHash!==input.inputHash)throw Error('Original successful inventory metadata does not match its input');
 if(!same(config,savedConfig))throw Error('Retained inventory configuration changed from the original attempt');
 if(fs.readFileSync(original.prompt.path,'utf8')!==task.prompt)throw Error('Original inventory prompt or evidence selection changed');
 if(reconstructedInput(task,manifest,currentImplementationKeys())!==task.inputHash)throw Error('Current inventory dependency schema changed; explicit migration review required');
 if(reconstructedInput(task,manifest,keys)!==input.inputHash)throw Error('Original inventory input hash cannot be reproduced by the reviewed implementation changes for page '+page);
 const canonicalResult=ref(task.resultFile);
 if(canonicalResult.hash!==meta.resultHash||original.result.hash!==meta.resultHash)throw Error('Canonical or original inventory result changed');
 validateSemanticResult(read(canonicalResult.path),task);
 const pageFile=(p,ext,teacher=false)=>path.join(runDir,'evidence',...(teacher?['teacher']:[]),'pages',`page-${String(p).padStart(3,'0')}.${ext}`);
 const pins=manifest.pins?.runFiles??{},pdfs=Object.keys(pins).filter(n=>/^source\/.*\.pdf$/i.test(n));
 if(!pdfs.includes('source/booklet.pdf'))throw Error('Original PDF pin is required');
 const pinnedFiles=[...pdfs.map(f=>path.join(runDir,f)),...[...new Set([page,...task.contextPages])].flatMap(p=>['png','txt'].map(ext=>pageFile(p,ext))),...task.teacherPages.flatMap(p=>['png','txt'].map(ext=>pageFile(p,ext,true)))];
 for(const file of pinnedFiles){const relative=path.relative(runDir,file).split(path.sep).join('/');if(!pins[relative]||bytesHash(file)!==pins[relative])throw Error('Original source pin changed or missing: '+relative);}
 const source=[...new Set([...pinnedFiles,...task.images])].map(ref);
 const entry=state.pages[page],math=entry?.mathReview;
 if(!math||math.key!==entry.inventoryHash||!math.reviewer?.trim()||!math.note?.trim())throw Error('Current mathematical inventory approval is required');
 evidence(math.artifacts,'Mathematical review');
 const corrections=state.corrections.filter(c=>c.status==='approved').map(c=>({...c,patches:c.patches.filter(p=>p.scope==='inventory'&&p.page===page)})).filter(c=>c.patches.length);
 const decisions=Object.values(state.issues).filter(i=>i.origin!=='author'&&(i.pages??[i.page]).includes(page));
 for(const c of corrections)evidence(c.evidence,'Inventory correction');
 for(const i of decisions)if(i.resolution?.evidence)evidence(i.resolution.evidence,'Inventory decision');
 return {page,originalAttempt,...(selection.implementationReview?{implementationReview:selection.implementationReview}:{}),originalInputHash:input.inputHash,original,inventoryConfig:ref(inventoryOptions.configFile),canonicalResult,importScope:scope,
  semanticDependencies:{promptHash:digest(task.prompt),source,contextPages:task.contextPages,teacherPages:task.teacherPages,contentScope:config.contentScope??'all'},
  effectiveInventoryKey:entry.inventoryHash,sourceEvidence:entry.sourceEvidence,correctionProjectionHash:fingerprint({corrections,decisions}),
  retainedMathReview:{key:math.key,recordHash:fingerprint(math),artifacts:math.artifacts}};
}
function snapshot(options,record){
 const keys=validateReview(record,{recording:true});
 if(!Array.isArray(record.pages)||!record.pages.length||new Set(record.pages.map(p=>p.page)).size!==record.pages.length)throw Error('Select distinct pages for reviewed reuse');
 const state=liveWorkflow(options.runDir,record.pages.map(p=>p.page));
 return {inventoryConfig:ref(options.inventoryConfigFile),pages:record.pages.map(p=>pageSnapshot(options,p,p.implementationReview?validateReview({...record,...p.implementationReview},{recording:true}):keys,state))};
}
export async function recordInventoryReuse(options,record){
 // Freeze the review submission and recheck every owned dependency inside the
 // same publication -> review -> bank lock order as semantic publication.
 record=structuredClone(record);
 const before=snapshot(options,record);
 return withRunLock(options.runDir,'publication',()=>updateWorkflow(options.runDir,'record reviewed inventory reuse',()=>{
  const checked=snapshot(options,record);
  if(!same(before,checked))throw Error('Inventory reuse dependencies changed while waiting for publication/review locks');
  const body={format:FORMAT,runDir:path.resolve(options.runDir),...checked,historicalImplementations:record.historicalImplementations,
   reviewedImplementationChanges:record.reviewedImplementationChanges,reviewer:record.reviewer,note:record.note,artifacts:record.artifacts,
   generationPerformed:false,externalModelCalls:0,grantsReviewCredit:false};
  const id=fingerprint(body),dir=path.resolve(options.runDir,'semantic-packets','inventory-reuse'),file=path.join(dir,id+'.json');
  fs.mkdirSync(dir,{recursive:true});
  if(fs.existsSync(file)){
   const {recordedAt,...existing}=read(file);
   if(!same(existing,body))throw Error('Immutable inventory reuse receipt conflict');
   return {ok:true,reused:true,receipt:ref(file),pages:body.pages.length};
  }
  fs.writeFileSync(file,JSON.stringify({...body,recordedAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
  return {ok:true,reused:false,receipt:ref(file),pages:body.pages.length};
 }));
}
export function inventoryReuseInfo(options,page,workflowState){
 if(!options.inventoryReuseFile)return {kind:'missing'};
 try{
  const file=path.resolve(options.inventoryReuseFile),receipt=read(file),{recordedAt,...body}=receipt;
  if(receipt.format!==FORMAT||receipt.runDir!==path.resolve(options.runDir)||receipt.generationPerformed!==false||receipt.grantsReviewCredit!==false||receipt.externalModelCalls!==0||!recordedAt)throw Error('Invalid reviewed inventory reuse receipt');
  if(path.dirname(file)!==path.resolve(options.runDir,'semantic-packets','inventory-reuse')||path.basename(file)!==fingerprint(body)+'.json')throw Error('Inventory reuse receipt is not its immutable content-addressed artifact');
  const keys=validateReview(receipt);
  current(receipt.inventoryConfig,'retained inventory configuration');
  if(!options.inventoryConfigFile||!same(ref(options.inventoryConfigFile),receipt.inventoryConfig))throw Error('Selected inventory configuration differs from the reuse receipt');
  const adopted=receipt.pages.find(p=>p.page===page);if(!adopted)throw Error('No explicitly adopted inventory for page '+page);
  const state=workflowState??liveWorkflow(options.runDir,[page]);
  const pageKeys=adopted.implementationReview?validateReview({...receipt,...adopted.implementationReview}):keys;
  if(!same(pageSnapshot(options,adopted,pageKeys,state),adopted))throw Error('Reviewed inventory dependencies or mathematical approval changed');
  return {kind:'reviewed-inventory-reuse',receipt:ref(file),page,originalAttempt:adopted.originalAttempt,originalInputHash:adopted.originalInputHash,effectiveInventoryKey:adopted.effectiveInventoryKey,grantsReviewCredit:false};
 }catch(error){return {kind:'invalid',reason:error.message};}
}
// Capture selected configurations at dispatch; the semantic publisher calls
// this again under its lock. Current author context is never old review credit.
export function generationPublicationGuard(options,stage,page){
 const selected=freshGenerationOptions(options,stage,page);
 const references=[options.configFile,options.inventoryConfigFile,selected.configFile].filter(Boolean).map(ref);
 return task=>{
  references.forEach(r=>current(r,'generation configuration'));
  if(stage==='author'&&options.inventoryReuseFile){const reuse=inventoryReuseInfo(options,task.page);if(reuse.kind!=='reviewed-inventory-reuse')throw Error('Inventory reuse changed before publication: '+reuse.reason);}
 };
}
