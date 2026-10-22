// The one model step of the checks: GPT-6.1 Sol at low reasoning through the existing worker path
// (first-pass/review.mjs callWorker, the per-booklet three-worker lease), only for what the
// deterministic comparison could not settle. Read-only workers cannot open files, so everything
// they need is in the prompt and the attached images.
import fs from 'node:fs';
import path from 'node:path';
import {callWorker,defaultRunner,defaultLease,canonicalRunDir} from '../../first-pass/review.mjs';
import {cropPage,regionCrop,sourceFiles} from '../../source-match/regions.mjs';

export const BATCH=4;
const chunks=(list,size)=>Array.from({length:Math.ceil(list.length/size)},(_,i)=>list.slice(i*size,(i+1)*size));
const KINDS=['theory','example','guided-practice','key-ideas','review','activity','exercise','none'];

const ROLE_RULES=`You identify what kind of block a printed maths booklet shows. Do not run commands or open files: the evidence is the attached images, one crop of the source page per block, in the order listed.

For each block, read the coloured heading band at the top of the block (or the first line of text when it has none) and answer with one kind from this closed list:
theory (information, definition or rule: a title such as "Simplifying Rates"), example (a worked example with its working shown), guided-practice (a "Guided Practice" or "Your turn" block with questions to complete), key-ideas ("Key Ideas" statements to complete), review (a "Review" of earlier skills), activity (an investigation or activity), exercise (ordinary numbered practice questions), none (the crop shows none of these).
Report what is printed. Never suggest a layout or a repair.

Return one JSON object and nothing else: {"blocks":[{"blockId":"ID","kind":"one of the kinds above","header":"the heading text as printed, or an empty string"}]}. Every block id appears exactly once.`;

// items: [{blockId, role, entry?, page?}] -> {answers: Map(blockId -> {kind, header}), calls}.
export async function askRoles({items,project,workDir,runner=defaultRunner,lease=defaultLease,log=()=>{}}){
 const files=sourceFiles(project),answers=new Map(),calls=[],crops=path.join(workDir,'crops');
 const ready=[];
 for(const item of items){
  let image=null;
  const crop=item.entry?regionCrop(item.entry):null;
  if(crop&&files?.pdf){
   const out=path.join(crops,item.blockId+'.png');
   try{cropPage(files.pdf,crop.page,crop.box,out,{zoom:2});image=out;}catch(error){log('crop failed for '+item.blockId+': '+error.message);}
  }
  if(!image&&item.page&&files?.pages){const whole=path.join(files.pages,'page-'+String(item.page).padStart(3,'0')+'.png');if(fs.existsSync(whole))image=whole;}
  if(image)ready.push({...item,image});
 }
 for(const group of chunks(ready,BATCH)){
  const prompt=ROLE_RULES+'\n\nBlocks (image k is block k):\n'+JSON.stringify(group.map((item,k)=>({image:k+1,blockId:item.blockId})));
  const started=Date.now();
  const {result,usage}=await callWorker({runner,lease,canonicalRunDir:canonicalRunDir(project),workDir,name:'checks-roles',prompt,images:group.map(item=>item.image)});
  calls.push({kind:'roles',blocks:group.map(i=>i.blockId),elapsedMs:Date.now()-started,usage:usage??null});
  log('roles: '+group.map(i=>i.blockId).join(', '));
  for(const row of Array.isArray(result?.blocks)?result.blocks:[])if(group.some(i=>i.blockId===row?.blockId)&&KINDS.includes(row.kind))answers.set(row.blockId,{kind:row.kind,header:String(row.header??'')});
 }
 return {answers,calls};
}
export const KIND_TO_FAMILY=Object.freeze({theory:'theory',example:'example','guided-practice':'guided','key-ideas':'key-ideas',review:'review',activity:'activity',exercise:'practice'});
