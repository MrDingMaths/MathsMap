import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {loadBookletProject,saveBookletProject,getProjectBankSync} from './project-studio-server.mjs';
export const OUT='.booklet-work/paired-heading-spacing-20261004';
export const hash=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
export function isPairedHeading(table){
 if(table?.type!=='table'||table.border!==false||table.rows?.length!==1||table.rows[0].length!==2||table.annotations?.length||table.rows[0].some(c=>(c.colspan??1)!==1||(c.rowspan??1)!==1))return false;
 const labels=table.rows[0].map(c=>c.blocks?.length===1&&c.blocks[0].type==='paragraph'&&c.blocks[0].inlines?.every(n=>n.type==='text')?c.blocks[0].inlines.map(n=>n.text??'').join('').trim().replace(/\s+/g,' ').toLowerCase():'');
 return ['worked example','worked solution','example'].includes(labels[0])&&labels[1]==='your turn';
}
export function repairPairedHeadingSpacing(source){
 const project=structuredClone(source),records=[];
 for(const section of project.sections??[])for(const block of section.blocks??[]){
  function walk(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return;}if(isPairedHeading(node)){
   const before=JSON.stringify(node);node.marginBefore=.5;node.marginAfter=.5;node.rowHeights=[];
   for(const cell of node.rows[0]){cell.paddingTop=.75;cell.paddingBottom=.75;cell.blocks[0].spaceBefore=0;cell.blocks[0].spaceAfter=0;}
   if(JSON.stringify(node)!==before)records.push({blockId:block.id,tableId:node.id,bankId:block.bankRef?.id??null});
  }for(const [key,value]of Object.entries(node))if(!['sourceReview','sourceAtom','sourceRefs','spec','originalContent','sourceLayoutEvidence','provenance','answer'].includes(key))walk(value);}
  walk(block);
  if(records.some(r=>r.blockId===block.id)){block.sourceReview??={};block.sourceReview.intentionalDepartures??=[];const reason='User-directed paired heading spacing, 4 October 2026: 0.5 mm outer margins and 0.75 mm vertical cell padding; retain horizontal padding, paired relationships and all response writing space.';if(!block.sourceReview.intentionalDepartures.includes(reason))block.sourceReview.intentionalDepartures.push(reason);}
 }
 return {project,records};
}
async function main(){await fs.mkdir(OUT,{recursive:true});const apply=process.argv.includes('--apply'),only=process.argv.find(x=>x.startsWith('--project='))?.slice(10),files=(await fs.readdir('booklets/projects')).filter(x=>x.endsWith('.json'));for(const file of files){const id=file.slice(0,-5);if(only&&id!==only)continue;const before=await loadBookletProject(id,{refreshRatings:false}),{project,records}=repairPairedHeadingSpacing(before);if(!records.length)continue;const receipt={id,inputRevision:before.revision,inputHash:hash(before),candidateHash:hash(project),records,status:'candidate'};
 if(apply){const review=JSON.parse(await fs.readFile(path.join(OUT,id+'-review.json'),'utf8'));if(review.status!=='accepted'||review.inputHash!==receipt.inputHash||review.candidateHash!==receipt.candidateHash||!review.inspectedPages?.length)throw Error('Current candidate needs scoped visual acceptance: '+id);const saved=await saveBookletProject(project,{expectedRevision:before.revision}),readback=await loadBookletProject(id,{refreshRatings:false});if(hash(saved)!==hash(readback))throw Error('Readback mismatch: '+id);receipt.status='saved';receipt.savedRevision=saved.revision;receipt.savedHash=hash(readback);receipt.sync=await getProjectBankSync(id);}
 else{await fs.writeFile(path.join(OUT,id+'-before.json'),JSON.stringify(before,null,2));await fs.writeFile(path.join(OUT,id+'-candidate.json'),JSON.stringify(project,null,2));}
 await fs.writeFile(path.join(OUT,id+'-receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({...receipt,sync:receipt.sync?{items:receipt.sync.items?.length}:undefined}));}}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
