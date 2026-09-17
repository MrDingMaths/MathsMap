// Verification lives in workflow/issues.json; reports are projections, not approvals.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {projectReviewHash} from './page-review.mjs';
import {rendererSignature,implementationSignatures} from './verification-cache.mjs';

export const PIPELINE_POLICY='pdf-import-efficient-v1';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const bytes=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const current=r=>r?.path&&path.isAbsolute(r.path)&&fs.existsSync(r.path)&&bytes(r.path)===r.hash;
export function questionTeachingDependencies(state,project,question){
 const sections=project?.sections??[],owner=sections.find(s=>(s.blocks??[]).some(b=>b.id===question.id));
 const scope=owner?.exerciseId??owner?.topicId??owner?.id;
 const relevant=scope?sections.filter(s=>(s.exerciseId??s.topicId??s.id)===scope):sections;
 const ids=new Set(),targets=new Set(),contexts=[];
 function collectTargets(value){if(!value||typeof value!=='object')return;if(value.id)targets.add(value.id);for(const child of Object.values(value))if(child&&typeof child==='object')collectTargets(child);}
 function collectContext(value){
  if(!value||typeof value!=='object')return;
  if(Array.isArray(value.teachingContextIds))for(const id of value.teachingContextIds)ids.add(id);
  for(const name of ['teachingContext','externalTeachingReferences'])if(value[name])contexts.push(value[name]);
  for(const child of Object.values(value))if(child&&typeof child==='object')collectContext(child);
 }
 collectTargets(question);collectContext(question);
 const inventory=(project?.source?.inventory?.entries??[]).filter(entry=>targets.has(entry.targetId));
 inventory.forEach(collectContext);
 const teaching=sections.flatMap(s=>(s.blocks??[]).filter(b=>ids.has(b.id)||(relevant.includes(s)&&(s.phase!=='practice'||b.type!=='question'))).map(b=>({sectionId:s.id,block:b})));
 const pages=new Set(),artifacts=new Map();
 function refs(value){
  if(!value||typeof value!=='object')return;
  for(const name of ['page','pageNumber','pdfPage'])if(Number.isInteger(value[name]))pages.add(value[name]);
  for(const name of ['pages','pdfPages','teachingPages'])if(Array.isArray(value[name]))for(const page of value[name])if(Number.isInteger(page))pages.add(page);
  for(const [file,expected]of [[value.pdfPath,value.pdfSha256??value.pdfHash??value.hash??value.sha256],[value.imagePath,value.imageSha256??value.imageHash??value.hash??value.sha256],[value.path,value.hash??value.sha256]])if(typeof file==='string'&&expected){
   const absolute=path.resolve(file);artifacts.set(absolute,{path:absolute,expected,hash:fs.existsSync(absolute)&&fs.statSync(absolute).isFile()?bytes(absolute):null});
  }
  for(const child of Object.values(value))if(child&&typeof child==='object')refs(child);
 }
 const reviewed=state.verification?.teachingContexts?.[scope],binding=reviewed?.dependencyScope;
 const readDependency=file=>{if(!fs.existsSync(file))return {unavailable:true};try{return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));}catch{return {invalid:true,hash:bytes(file)};}};
 let currentConfig=null,currentIndex=null;
 if(binding?.configFile){
  const config=readDependency(binding.configFile);
  currentConfig=config.unavailable||config.invalid?config:{teachingPages:config.topics?.find(t=>t.id===binding.exerciseId)?.teachingPages??[],pageTeachingPages:Object.fromEntries((binding.sourcePages??[]).map(p=>[p,config.pageTeachingPages?.[p]??[]]))};
 }
 if(binding?.externalIndex){
  const index=readDependency(binding.externalIndex),selected=new Set(binding.pages??[]);
  currentIndex=index.unavailable||index.invalid?index:(index.externalTeachingReferences??[]).map(r=>({...r,pages:(r.pages??[]).filter(p=>selected.has(p.pdfPage??p.pageNumber))})).filter(r=>r.pages.length);
  refs(currentIndex);
 }
 refs(question.sourceRefs);contexts.forEach(refs);inventory.forEach(entry=>refs(entry.sourceRefs??entry.source));refs(reviewed?.sourceArtifacts);refs(reviewed?.artifacts);
 for(const {sectionId,block}of teaching){refs(block.sourceRefs);refs(block.sourceReview);refs(sections.find(s=>s.id===sectionId)?.sourceRefs);}
 const dependencies=pages.size?[...pages].sort((a,b)=>a-b).map(p=>[p,state.pages?.[p]?.sourceEvidence??null,state.pages?.[p]?.inventoryHash??null]):Object.entries(state.pages??{}).map(([p,v])=>[p,v.sourceEvidence??null,v.inventoryHash??null]);
 return {scope:scope??null,teaching,contexts,teachingContextIds:[...ids].sort(),source:dependencies,artifacts:[...artifacts.values()].sort((a,b)=>a.path.localeCompare(b.path)),
  reviewedTeaching:reviewed?{dependencyHash:reviewed.dependencyHash,outcome:reviewed.outcome,methods:reviewed.methods,scope:binding,currentConfig,currentIndex}:null};
}
export function verificationDependencies(state,project,{renderer=rendererSignature(),implementation=implementationSignatures()}={}){
 const questions=project?.sections?.filter(s=>s.phase==='practice').flatMap(s=>s.blocks.filter(b=>b.type==='question'))??[];
 return {source:hash(Object.fromEntries(Object.entries(state.pages).map(([p,r])=>[p,r.inventoryHash]))),
  project:project?projectReviewHash(project):null,renderer,...implementation,
  questions:Object.fromEntries(questions.map(q=>[q.id,hash({content:q.content,classification:q.classification,teaching:q.sourceReview?.teachingContext,source:q.sourceRefs,...(state.pipelinePolicy?{teachingDependencies:questionTeachingDependencies(state,project,q)}:{})})]))};
}
export function recordVerification(state,record,deps){
 if(!state.pipelinePolicy)throw Error('Verification register enforcement is for new-policy runs');
 if(state.verification?.version!==undefined&&state.verification.version!==1)throw Error('Unsupported verification register version');
 if(!record?.id||!record.reviewer?.trim()||!record.note?.trim()||!record.artifacts?.length||!record.artifacts.every(current))throw Error('Verification requires a reviewer, observations and current artifacts');
 if(!['passed','failed','not-applicable'].includes(record.outcome))throw Error('Invalid verification outcome');
 const supported=['ui','regressions','build','storage','publication','readback','repeat-import'];
 const unclassified=Object.keys(record.dependencies??{}).filter(k=>!Object.hasOwn(deps,k)&&!['question','unknown'].includes(k));
 if(unclassified.length&&record.dependencies?.unknown!==hash(deps))throw Error('Unknown dependencies require the complete current dependency signature');
 const questionId=record.id.startsWith('question:')?record.id.slice(9):null;
 if(questionId){
  if(!deps.questions[questionId]||record.dependencies?.question!==deps.questions[questionId])throw Error('Question assessment is missing or stale');
  if(record.outcome==='passed'&&!['answer','skillMapping','taughtMethod'].every(k=>record.checks?.[k]===true))throw Error('Each question needs answer, skill mapping and taught-method review');
 }else if(!supported.includes(record.id))throw Error('Unknown verification check');
 const required=questionId?['question']:record.id==='storage'?['storage']:['project',...(record.id==='ui'||record.id==='build'||record.id==='regressions'?['renderer']:[]),...(record.id==='build'?['build']:record.id==='regressions'?['authoring','assessment','regression']:[])];
 for(const key of required)if(record.dependencies?.[key]!== (key==='question'?deps.questions[questionId]:deps[key]))throw Error('Missing or stale verification dependency: '+key);
 if(record.id==='ui'&&record.outcome==='passed'&&!['filtering','solutions','worksheet','saveReopen','ownershipSync'].every(k=>record.checks?.[k]===true))throw Error('Combined UI scenario is incomplete');
 if(record.outcome==='not-applicable'&&!['build'].includes(record.id))throw Error('This verification check cannot be waived');
 if(record.id==='build'&&record.outcome==='not-applicable'&&record.codeChanged!==false)throw Error('Build exemption requires no code changes');
 state.verification??={version:1,entries:{}};state.verification.entries??={};
 state.verification.entries[record.id]=structuredClone(record);
}
export function verificationStatus(state,project,{phase='prepublication',renderer,validateFinal}={}){
 if(!state.pipelinePolicy)return {policy:'legacy',ok:true,required:[],checks:[],issues:[]};
 if(state.pipelinePolicy!==PIPELINE_POLICY)throw Error('Unsupported import pipeline policy');
 const deps=verificationDependencies(state,project,{renderer}),entries=state.verification?.entries??{},checks=[],issues=[];
 const add=(id,passed,reason)=>{checks.push({id,passed,reason:passed?null:reason});if(!passed)issues.push(id+': '+reason);};
 add('inventory',Object.keys(state.pages).length>0&&Object.values(state.pages).every(p=>p.mathReview?.key===p.inventoryHash),'Independent inventory and mathematical review required');
 add('settlement',!!state.settled&&state.settled.project.hash===deps.project,'Current settled content required');
 let finalValid=!!state.finalReview;
 if(finalValid&&validateFinal)try{validateFinal();}catch{finalValid=false;}
 add('final-editions',finalValid,'Five automated checks and actual visual/composition acceptance required');
 for(const id of [...Object.keys(deps.questions).map(q=>'question:'+q),'ui','regressions','build','storage',...(phase==='complete'?['publication','readback','repeat-import']:[])]){
  const entry=entries[id];let passed=false,reason='Current evidence required';
  try{
   if(!entry)throw Error(reason);
   recordVerification({pipelinePolicy:state.pipelinePolicy},entry,deps);
   // Extra file dependencies bind tests/build/storage and unknown mechanisms.
   if(!(entry.dependencyArtifacts??[]).every(current))throw Error('Dependency artifacts changed');
   if(entry.dependencies?.source&&entry.dependencies.source!==deps.source)throw Error('Source dependencies changed');
   if(entry.dependencies?.unknown&&entry.dependencies.unknown!==hash(deps))throw Error('Unclassified dependencies changed');
   passed=entry.outcome==='passed'||entry.outcome==='not-applicable';reason=entry.outcome==='failed'?'Recorded check failed':reason;
  }catch(error){reason=error.message;}
  add(id,passed,reason);
 }
 add('task-findings',!Object.values(state.issues).some(i=>i.status==='pending'),'Resolve remaining import findings');
 add('stage-handoffs',!Object.keys(state.verification?.stageClaims??{}).length,'Complete or explicitly cancel outstanding stage tickets; retain and resolve their findings');
 if(phase==='complete'&&state.verification?.publishedSource){
  const ref=state.verification.publishedSource;let valid=false;
  try{valid=hash(read(ref.path))===ref.hash;}catch{}
  add('published-source',valid,'Published project changed after readback');
 }
 return {version:1,policy:state.pipelinePolicy,phase,ok:issues.length===0,required:checks.map(c=>c.id),checks,issues,dependencies:deps};
}
export function projectVerificationRun(project,root=process.cwd()){
 const ref=project.source?.workflow??project.source?.inventory?.workflow,runId=ref?.runId??project.source?.runId;
 if(!runId)return null;
 if(!/^[\w.-]+$/.test(runId))throw Error('Invalid source run identity');
 const runDir=path.join(root,'.booklet-work/full-imports',runId),file=path.join(runDir,'manifest.json');
 if(!fs.existsSync(file)){if(ref?.pipelinePolicy)throw Error('New import verification run is unavailable');return null;}
 const manifest=read(file);return manifest.pipelinePolicy?runDir:null;
}
