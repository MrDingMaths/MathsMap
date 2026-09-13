// Assemble explicit semantic packets into a reviewable candidate; never certify it.
import fs from 'node:fs';
import path from 'node:path';
import {loadRun,parsePageSelection} from './transcription.mjs';
import {contentProject} from '../../src/lib/booklet-source-content.js';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {renderMath} from '../../src/lib/render-math.js';
import {contentNodes} from '../../src/lib/booklet-content-verification.js';
import {resolveArrangement} from '../../src/lib/booklet-arrangement.js';
import {trackProcessPhase} from './run-observability.mjs';
import {reviewEnabled,liveWorkflow,effectiveInventory,effectiveAuthor,workflowFlags,materializeCorrections,workflowForPages,synchronizeInventoryAmbiguities,REVIEW_POLICY} from './workflow-review.mjs';
const args=process.argv.slice(2),arg=(n,f)=>args.includes(n)?args[args.indexOf(n)+1]:f;
const runId=arg('--run-id'),projectId=arg('--project-id',runId),selected=parsePageSelection(arg('--pages',''));
if(arg('--out')&&!arg('--out').endsWith('.json'))throw Error('--out must end in .json');
if(!runId||!selected.length||!arg('--out'))throw Error('Use --run-id ID --pages RANGE --config FILE --out FILE [--project-id ID]');
const {runDir,manifest}=loadRun(runId),config=JSON.parse(fs.readFileSync(arg('--config'),'utf8'));
trackProcessPhase(runDir,'assembly',{artifact:arg('--out'),pages:selected,projectId});
const workflow=reviewEnabled(manifest,config)?liveWorkflow(runDir):null;
const sourceBoundaries=!workflow||(config.sourcePaginationPolicy??config.settings?.sourcePaginationPolicy)==='source-boundaries';
const root=path.join(runDir,'semantic-packets'),sections=[],entries=[],inventoryPages=[],flags=[],corrections=[],confirmedCorrections=[];
for(const page of selected){
 const stem=`page-${String(page).padStart(3,'0')}`;
 const inv=workflow?effectiveInventory(runDir,page,workflow):JSON.parse(fs.readFileSync(path.join(root,stem+'.inventory.json'),'utf8'));
 const packet=workflow?effectiveAuthor(runDir,page,workflow):JSON.parse(fs.readFileSync(path.join(root,stem+'.author.json'),'utf8'));
 if(inv.pageNumber!==page||packet.pageNumber!==page)throw Error('Wrong packet page');
 let first=true;
 for(const section of packet.sections){
  section.sourcePageNumber=page;
  // A teaching/practice transition within one source page is semantic, not a
  // physical page break. Existing section flow permits these groups to share.
  section.pageBreakBefore=first&&sourceBoundaries;
  // Pagination shows this calculated topic band only at the topic's start.
  // Packet body headings are omitted, but the generated topic title must print.
  if(section.phase!=='front-matter')section.headingStyle='page-title';
  for(const block of section.blocks){
   block.sourcePageNumber=page;block.sourceRefs=[{pageNumber:page}];
   block.flow={...block.flow,sourcePageBreakBefore:first};
   // Source boundaries are student-edition constraints, not manual answer breaks.
   delete block.flow.pageBreakBefore;
   block.sourceReview??={};block.sourceReview.sourcePagination={page,breakBefore:first};first=false;
  }
  sections.push(section);
 }
 inventoryPages.push({pageNumber:page,inventoried:inv.inventoried===true});
 for(const item of inv.entries){
  const mappings=(packet.inventoryMappings??[]).filter(m=>m.inventoryId===item.id);
  if(item.exclusionReason){entries.push({...item,pageNumber:page});continue;}
  if(!mappings.length){
   entries.push({...item,pageNumber:page,targetId:item.targetId});
   flags.push({id:item.id+'-mapping',targetId:item.targetId,note:'No author mapping for source inventory item '+item.id,resolved:false});
  }
  for(let i=0;i<mappings.length;i++){
   const m=mappings[i];
   entries.push({...item,id:i?item.id+'-mapping-'+i:item.id,pageNumber:page,targetId:m.targetId,...(m.field?{field:m.field}:{}),...(m.exclusionReason?{exclusionReason:m.exclusionReason}:{}),...(m.derived?{derived:true}:{}),...(m.continuationOf?{continuationOf:m.continuationOf,continuationReason:m.continuationReason}:{}),...(item.ambiguity?{ambiguous:item.ambiguity}:{})});
  }
 }
 for(const finding of workflow?[]:packet.findings??[])flags.push({id:finding.id??`nr-p${page}-finding-${flags.length}`,targetId:finding.targetId??packet.sections[0]?.blocks[0]?.id,note:typeof finding==='string'?finding:finding.note??finding.message??finding.description??finding.reason??JSON.stringify(finding),resolved:finding.status==='resolved'&&!!finding.resolution?.trim(),...(finding.resolution?{resolution:finding.resolution}:{})});
 corrections.push(...(packet.corrections??[]));
 confirmedCorrections.push(...(packet.confirmedCorrections??[]));
}
if(workflow){synchronizeInventoryAmbiguities(entries,workflow);flags.push(...workflowFlags(workflow,selected));}
const candidate={title:config.title,topics:config.topics.map(({id,title})=>({id,title})),settings:{...(config.compactAnswers?{compactAnswers:structuredClone(config.compactAnswers)}:{}),sourcePaginationPolicy:'source-boundaries',preserveSourcePages:true,cover:{course:'Mathematics Stage 5 Path',book:'Book 2',version:'260905',feedback:'https://MrDingMaths.com'}},sections,sourceInventory:{version:1,selectedPages:selected,pages:inventoryPages,entries},studio:{version:1,flags}};
if(workflow)candidate.settings={...config.settings,...(config.compactAnswers?{compactAnswers:structuredClone(config.compactAnswers)}:{}),...(sourceBoundaries?{sourcePaginationPolicy:'source-boundaries'}:{}),preserveSourcePages:sourceBoundaries,cover:{...config.settings?.cover,...config.cover}};
// Reviewed packets contain the corrected value. Emit a source-valued candidate
// and let the existing import interface apply its stale-checked correction log.
const nodes=contentNodes(candidate);
for(const correction of confirmedCorrections){
 const keys=correction.field.split('/').filter(Boolean);
 if(keys.some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('Invalid correction field');
 let parent=nodes.get(correction.targetId)?.node;
 for(const key of keys.slice(0,-1))parent=parent?.[key];
 const key=keys.at(-1);
 if(!parent||parent[key]!==correction.corrected)throw Error('Reviewed packet correction is stale: '+correction.id);
 parent[key]=correction.original;
}
candidate.sourceCorrections=confirmedCorrections;
if(workflow)candidate.sourceInventory.workflow={policy:REVIEW_POLICY,runId,correctionIds:workflow.corrections.map(c=>c.id)};
let project=contentProject(candidate,{runId,projectId,selectedPages:manifest.selectedPages});
// Inventory and author patches were already applied in order by the effective
// packet readers. Replaying them here would reject a valid A -> B -> C chain.
if(workflow){project=materializeCorrections(project,workflowForPages(workflow,selected,['project']),'project');project.source.workflow=candidate.sourceInventory.workflow;}
if(config.compactAnswers)project.settings.compactAnswers={...project.settings.compactAnswers,...structuredClone(config.compactAnswers)};
project.source.sourceHashes={pdf:manifest.source.pdfHash,docx:manifest.source.docxHash};
const validation=validateEditableProject(project),output=path.resolve(arg('--out'));
const mathErrors=[];
const semanticErrors=[];
for(const block of project.sections.flatMap(s=>s.blocks)){
 const arrangement=project.settings.layoutOverrides?.blockLayouts?.[block.id]?.arrangement;
 if(arrangement){
  const resolved=resolveArrangement(block,arrangement);
  for(const missing of resolved.missing)semanticErrors.push(`Missing layout reference ${missing.ref} in ${block.id}`);
  const placed=new Set();const collect=n=>{if(n.type==='item')placed.add(n.ref);else n.children.forEach(collect);};collect(resolved.tree.root);
  for(const entry of resolved.entries.values())if(['text','document','diagram'].includes(entry.kind)&&(!entry.role||entry.role==='content')&&!placed.has(entry.ref))semanticErrors.push(`Unplaced content reference ${entry.ref} in ${block.id}`);
  if(block.type==='question'&&!block.pedagogyRole){
   const refs=new Set();const visit=n=>{if(n.type==='item')refs.add(n.ref);else n.children.forEach(visit);};visit(resolved.tree.root);
   for(const entry of resolved.entries.values())if(entry.kind==='label'&&entry.value&&!refs.has(entry.ref))semanticErrors.push(`Missing structural question label ${entry.ref} in ${block.id}`);
  }
 }
}
function inspectMath(value,pointer='',field=''){
 if(typeof value==='string'){
  if(['content','prompt','theorySolution','explanation','steps','short','worked'].includes(field)&&renderMath(value).includes('katex-error'))mathErrors.push(pointer);
  return;
 }
 if(!value||typeof value!=='object')return;
 if(value.format==='tikz'&&/\\pgfmathsetmacro\{[^\\]/.test(value.code??''))semanticErrors.push('Invalid TikZ macro control sequence at '+pointer+'/code');
 if(value.responseSpace==='scaffold'&&value.answerSpaceMm>0)semanticErrors.push('Scaffold mode suppresses the requested working space at '+pointer);
 if(value.arrangement&&typeof value.arrangement==='object'&&(!value.arrangement.root||value.arrangement.root.type!=='group'))semanticErrors.push('Invalid native arrangement root at '+pointer+'/arrangement');
 if(value.type==='math'&&renderMath('$$'+value.latex+'$$').includes('katex-error'))mathErrors.push(pointer+'/latex');
 if(Array.isArray(value))value.forEach((v,i)=>inspectMath(v,pointer+'/'+i,field));
 else for(const [key,v]of Object.entries(value))if(!['sourceReview','sourceLayoutEvidence','sourceAtom','spec','code','latex','text'].includes(key))inspectMath(v,pointer+'/'+key,key);
}
inspectMath(project.sections,'/sections');
inspectMath(project.settings.layoutOverrides,'/settings/layoutOverrides');
if(mathErrors.length){validation.valid=false;validation.errors.push(...mathErrors.map(p=>'Invalid rendered mathematics at '+p));}
if(semanticErrors.length){validation.valid=false;validation.errors.push(...semanticErrors);}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(candidate,null,2)+'\n');
fs.writeFileSync(output.replace(/\.json$/,'.project.json'),JSON.stringify(project,null,2)+'\n');
fs.writeFileSync(output.replace(/\.json$/,'.corrections.json'),JSON.stringify(corrections,null,2)+'\n');
fs.writeFileSync(output.replace(/\.json$/,'.validation.json'),JSON.stringify({valid:validation.valid,errors:validation.errors,pages:selected.length,sections:sections.length,blocks:sections.reduce((n,s)=>n+s.blocks.length,0),inventoryEntries:entries.length,flags},null,2)+'\n');
console.log(JSON.stringify({valid:validation.valid,errors:validation.errors,output,blocks:sections.reduce((n,s)=>n+s.blocks.length,0),inventoryEntries:entries.length}));
if(!validation.valid)process.exitCode=1;
