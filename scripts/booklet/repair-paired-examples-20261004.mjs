// Feedback 4 October 2026: one paired Worked Example | Your Turn block instead of
// separate bordered row blocks (Inverse Functions p7), and source formula wording
// in the Earning Money wage examples (pp4-6). Dry run by default; --apply saves.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';

const runDir='.booklet-work/paired-examples-20261004';
const NOTE='Feedback 4 October 2026: paired Worked Example | Your Turn rows use one shared heading and a two-column part grid; one-cell bordered tables and per-row blocks removed. All prompts, working and answers retained.';

export function repairInversePairedExample(source){
 const project=structuredClone(source),rows=['linear','cubic','quadratic'].map(n=>`p7-example-${n}-row`);
 const section=project.sections.find(s=>s.blocks.some(b=>b.id==='p7-example-group'));
 if(!section)throw Error('Paired example heading block not found');
 const at=section.blocks.findIndex(b=>b.id==='p7-example-group'),heading=section.blocks[at];
 if(JSON.stringify(section.blocks.slice(at+1,at+4).map(b=>b.id))!==JSON.stringify(rows))throw Error('Expected the three paired rows directly after the heading');
 if(heading.type!=='rich-text'||heading.content.blocks.length!==1||heading.content.blocks[0].type!=='table')throw Error('Heading block changed');
 const cell=(doc,id)=>{
  const table=doc.blocks.length===1&&doc.blocks[0].type==='table'?doc.blocks[0]:null;
  if(!table||table.rows.length!==1||table.rows[0].length!==1)throw Error('Expected a one-cell table in '+id);
  // Source: instruction left, given equation and working centred.
  return {format:doc.format,version:doc.version,blocks:table.rows[0][0].blocks.map(b=>b.inlines?.some(i=>i.type==='math'&&i.display)?{...b,align:'center'}:b)};
 };
 const children=[],responses=[],estimates=[],refs=[...(heading.sourceRefs??[])];
 for(const block of section.blocks.slice(at+1,at+4)){
  const root=block.content,turn=root.children?.[0];
  if(block.type!=='question'||root.children?.length!==1||block.bankRef)throw Error('Unexpected paired row '+block.id);
  const estimate=block.sourceReview?.workingSpaceEstimate?.estimates?.find(e=>e.targetId===turn.id);
  if(!Number.isFinite(estimate?.answerSpaceMm))throw Error('Missing working-space estimate for '+turn.id);
  children.push({id:root.id,type:'part',label:'',prompt:cell(root.prompt,root.id),answerSpaceMm:0},{...turn,prompt:cell(turn.prompt,turn.id),answerSpaceMm:estimate.answerSpaceMm});
  // The source prints no part letters in these paired rows.
  responses.push(...(block.sourceReview?.responses??[]).map(r=>({...r,label:''})));estimates.push({...estimate,widthMm:86});
  for(const ref of block.sourceRefs??[])if(!refs.some(r=>JSON.stringify(r)===JSON.stringify(ref)))refs.push(ref);
  delete project.settings?.layoutOverrides?.blockLayouts?.[block.id];
 }
 const {arrangements,...review}=heading.sourceReview??{};
 const merged={...heading,type:'question',sourceRefs:refs,
  content:{id:'p7-example-group-root',type:'group',label:'',prompt:heading.content,layout:'grid',columns:2,children},
  sourceReview:{...review,responses,workingSpaceEstimate:{method:'solution-steps',estimates},intentionalDepartures:[...(review.intentionalDepartures??[]),NOTE]},
  snapshotKind:'local',bankRef:null};
 section.blocks.splice(at,4,merged);
 return {project,record:{blockId:merged.id,removedBlocks:rows,parts:children.map(c=>c.id)}};
}

// Source pp4-6 example working names the taught formula quantities.
const WORDING=[
 ['p4-example-heading',String.raw`\text{Total pay}&=\text{Hourly rate}\times\text{Hours}`,String.raw`\text{Total Pay}&=\text{Pay per period}\times\text{Number of periods}`,2],
 ['p5-example-header',String.raw`\text{Hourly rate}&=\frac{\text{Total pay}}{\text{Hours}}`,String.raw`\text{Pay per period}&=\frac{\text{Total pay}}{\text{Number of periods}}`,2],
 ['p6-example-group',String.raw`\text{Hours}&=\frac{\text{Total pay}}{\text{Hourly rate}}`,String.raw`\text{Number of periods}&=\frac{\text{Total pay}}{\text{Pay per period}}`,2]];
export function restoreEarningExampleWording(source){
 const project=structuredClone(source),records=[];
 for(const [id,from,to,expected] of WORDING){
  const block=project.sections.flatMap(s=>s.blocks).find(b=>b.id===id);
  if(!block?.examples)throw Error('Example block not found: '+id);
  let count=0;
  const visit=(node,key,parent)=>{
   if(typeof node==='string'){if(node.includes(from)){parent[key]=node.split(from).join(to);count++;}return;}
   if(node&&typeof node==='object')for(const [k,v] of Object.entries(node))visit(v,k,node);
  };
  block.examples.forEach(example=>visit(example.theorySolution,'theorySolution',example));
  if(count!==expected)throw Error(`Expected ${expected} source formula lines in ${id}, found ${count}`);
  records.push({blockId:id,from,to,occurrences:count});
 }
 return {project,records};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const apply=process.argv.includes('--apply'),only=process.argv.find(a=>a.startsWith('--project='))?.slice(10);
 await fs.mkdir(runDir,{recursive:true});
 const jobs=[['inverse-functions-v1',repairInversePairedExample],['earning-money-v1',restoreEarningExampleWording]].filter(([id])=>!only||id===only);
 for(const [id,repair] of jobs){
  const source=await loadBookletProject(id,{refreshRatings:false}),result=repair(source);
  await fs.writeFile(`${runDir}/${id}-before-r${source.revision}.json`,JSON.stringify(source,null,2)+'\n');
  await fs.writeFile(`${runDir}/${id}-candidate.json`,JSON.stringify(result.project,null,2)+'\n');
  const receipt={at:new Date().toISOString(),projectId:id,inputRevision:source.revision,records:result.records??[result.record],status:'candidate'};
  if(apply){const saved=await saveBookletProject(result.project,{expectedRevision:source.revision});receipt.status='saved';receipt.savedRevision=saved.revision;}
  await fs.writeFile(`${runDir}/${id}-receipt.json`,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(receipt));
 }
}
