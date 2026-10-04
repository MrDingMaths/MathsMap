// Feedback 4 October 2026: paired Worked Example | Your Turn heading tables print
// no borders, and a worked example's given equation shares the relation-sign
// alignment of the working that follows from it (Inverse Functions p7).
// Dry run by default; --apply saves through the revision-safe project save.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {BOOKLET_HOUSE_STYLE} from '../../public/libs/maths-editor/house-style.mjs';
import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';

const runDir='.booklet-work/paired-examples-20261004';
const INK=BOOKLET_HOUSE_STYLE.colours.ink;
const cellText=cell=>(cell.blocks??[]).flatMap(b=>b.inlines??[]).map(i=>i.text??'').join('').trim();
export const isPairedHeading=table=>table?.type==='table'&&table.rows?.length===1&&table.rows[0].length===2&&/^worked example$/i.test(cellText(table.rows[0][0]))&&/^your turn$/i.test(cellText(table.rows[0][1]));

export function removePairedHeadingBorders(source){
 const project=structuredClone(source),records=[];
 for(const section of project.sections??[])for(const block of section.blocks??[]){
  const visit=node=>{
   if(Array.isArray(node))return node.forEach(visit);
   if(!node||typeof node!=='object')return;
   if(isPairedHeading(node)&&node.border!==false){
    node.border=false;delete node.borderColour;delete node.borderWidthMm;
    for(const cell of node.rows[0]){cell.border=null;cell.borderColour=null;cell.borderWidthMm=null;}
    records.push({blockId:block.id,tableId:node.id});
   }
   for(const [key,value] of Object.entries(node))if(!['sourceReview','sourceLayoutEvidence','sourceAtom'].includes(key))visit(value);
  };
  visit(block.content);visit(block.examples);
  // Boxes around paired rows can also come from saved arrangement rules.
  let paired=false;
  const find=node=>{if(Array.isArray(node))return node.forEach(find);if(node&&typeof node==='object'){if(isPairedHeading(node))paired=true;Object.values(node).forEach(find);}};
  find(block.content);
  if(!paired)continue;
  const unrule=node=>{if(node?.rules){delete node.rules;records.push({blockId:block.id,arrangementGroup:node.id});}node?.children?.forEach(unrule);};
  for(const layouts of [project.settings?.layoutOverrides?.blockLayouts,block.presentation?.layoutOverrides?.blockLayouts])unrule(layouts?.[block.id]?.arrangement?.root);
 }
 return {project,records};
}

// The given equation becomes the first, ordinary-ink row of the blue working,
// so every relation sign lines up as in the source.
export function alignInverseWorkedExamples(source){
 const project=structuredClone(source),records=[];
 const block=project.sections.flatMap(s=>s.blocks).find(b=>b.id==='p7-example-group');
 if(block?.content?.layout!=='grid')throw Error('Paired example block not found');
 for(const name of ['linear','cubic','quadratic']){
  const part=block.content.children.find(c=>c.id===`p7-example-${name}-row-root`),blocks=part?.prompt?.blocks??[];
  const given=blocks.findIndex(b=>b.id===`p7-example-${name}-given`),working=blocks.find(b=>b.id===`p7-example-${name}-answer`);
  if(given<0||!working||blocks[given+1]!==working)throw Error('Expected the given equation directly before the working in '+name);
  const givenMath=blocks[given].inlines,workingMath=working.inlines;
  const start=String.raw`\begin{aligned}`;
  if(givenMath.length!==1||workingMath.length!==1||!workingMath[0].latex.startsWith(start)||givenMath[0].latex.split('=').length!==2)throw Error('Unexpected equation structure in '+name);
  const [lhs,rhs]=givenMath[0].latex.split('=');
  workingMath[0].latex=start+String.raw`\color{${INK}}${lhs}&\color{${INK}}=${rhs}\\`+workingMath[0].latex.slice(start.length);
  blocks.splice(given,1);
  records.push({blockId:block.id,partId:part.id,given:givenMath[0].latex});
 }
 return {project,records};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const apply=process.argv.includes('--apply');
 await fs.mkdir(runDir,{recursive:true});
 for(const id of ['inverse-functions-v1','earning-money-v1','rates-v1']){
  const source=await loadBookletProject(id,{refreshRatings:false});
  let {project,records}=removePairedHeadingBorders(source);
  if(id==='inverse-functions-v1'){const aligned=alignInverseWorkedExamples(project);project=aligned.project;records=[...records,...aligned.records];}
  await fs.writeFile(`${runDir}/${id}-borders-before-r${source.revision}.json`,JSON.stringify(source,null,2)+'\n');
  await fs.writeFile(`${runDir}/${id}-borders-candidate.json`,JSON.stringify(project,null,2)+'\n');
  const receipt={at:new Date().toISOString(),projectId:id,inputRevision:source.revision,records,status:'candidate'};
  if(apply&&records.length){const saved=await saveBookletProject(project,{expectedRevision:source.revision});receipt.status='saved';receipt.savedRevision=saved.revision;}
  await fs.writeFile(`${runDir}/${id}-borders-receipt.json`,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(receipt).slice(0,700));
 }
}
