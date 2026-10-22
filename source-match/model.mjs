// The model steps of source-match: GPT-6.1 Sol at low reasoning, through the existing
// worker path (first-pass/review.mjs callWorker -> runAstraTask, which passes images with
// --image) and the per-booklet three-worker lease. Read-only workers cannot open files or run
// commands, so everything they need is in the prompt and the attached images.
//
// Two calls, both only for what the deterministic steps could not settle:
//   locate   a source region whose text could not be aligned (confidence below 0.6, no text
//            layer, or a figure-only block): one image per block, a normalised box back
//   confirm  an ambiguous relationship (a picture's arrows, a borderline gap, a decorative
//            figure, an alignment column): the source crop, the extracted signature and
//            closed questions; signature corrections back, never patches or numbers.
import fs from 'node:fs';
import path from 'node:path';
import {callWorker,defaultRunner,defaultLease,canonicalRunDir} from '../first-pass/review.mjs';
import {cropPage,regionCrop} from './regions.mjs';

export const BATCH=4;
const json=value=>JSON.stringify(value);
const pageImage=(files,page)=>path.join(files.pages,'page-'+String(page).padStart(3,'0')+'.png');
const chunks=(list,size)=>Array.from({length:Math.ceil(list.length/size)},(_,i)=>list.slice(i*size,(i+1)*size));

const LOCATE_RULES=`You locate parts of a printed maths booklet page. Do not run commands or open files: the pages are the attached images, in the order listed below.

For each item find the region of its page that holds the printed block described, and return its bounding box as fractions of that page image: [left, top, right, bottom], each between 0 and 1, with the origin at the top left and y increasing downwards. Include the block's own text, formulas, tables, arrows and pictures; exclude the coloured heading bar above it and neighbouring blocks. If the block is not on the page, return found:false. Do not guess.

Return one JSON object and nothing else: {"regions":[{"blockId":"ID","found":true,"box":[l,t,r,b]}]}. Every block id appears exactly once.`;

// Ask for the regions of blocks the alignment could not find. `items`: [{blockId, page, description}].
export async function locateRegions({items,files,project,workDir,runner=defaultRunner,lease=defaultLease,log=()=>{}}){
 const found=new Map(),calls=[];
 for(const group of chunks(items,BATCH)){
  const images=group.map(i=>pageImage(files,i.page)).filter(f=>fs.existsSync(f));
  if(images.length!==group.length){for(const i of group)found.set(i.blockId,{found:false,reason:'no page image'});continue;}
  const prompt=LOCATE_RULES+'\n\nItems (image k is the page of item k):\n'+json(group.map((i,k)=>({image:k+1,blockId:i.blockId,page:i.page,description:i.description})));
  const started=Date.now();
  const {result,usage}=await callWorker({runner,lease,canonicalRunDir:canonicalRunDir(project),workDir,name:'source-match-locate',prompt,images});
  calls.push({kind:'locate',blocks:group.map(i=>i.blockId),elapsedMs:Date.now()-started,usage:usage??null});
  log('locate: '+group.map(i=>i.blockId).join(', '));
  for(const row of Array.isArray(result?.regions)?result.regions:[]){
   const box=row?.box;
   if(row?.found===true&&Array.isArray(box)&&box.length===4&&box.every(v=>typeof v==='number'&&v>=0&&v<=1)&&box[2]>box[0]&&box[3]>box[1])found.set(row.blockId,{found:true,box});
   else found.set(row?.blockId,{found:false,reason:'not found or malformed'});
  }
  for(const i of group)if(!found.has(i.blockId))found.set(i.blockId,{found:false,reason:'no answer'});
 }
 return {found,calls};
}

const CONFIRM_RULES=`You check how a maths booklet's source page is laid out. Do not run commands or open files: the evidence is the attached images (one crop of the source per block, in the order listed) and the extracted structure below. Answer only the closed questions. Report what is printed in the crop; never invent, never suggest a layout, never give measurements.

Return one JSON object and nothing else:
{"blocks":[{"blockId":"ID","figure":{"decorative":true|false,"side":"left"|"right"|"above"|"below"|"inline"},"arrows":[{"from":"text at the tail","to":"text at the tip","direction":"up"|"down"|"left"|"right"|"up-left"|"up-right"|"down-left"|"down-right","side":"left"|"right"|"above"|"below"|"between","label":"text on the arrow or empty","kind":"curved"|"straight"}],"groups":[{"after":"line id","before":"line id","split":true|false}],"columns":[{"index":0,"aligned":true|false}]}]}
Include a key only when its question was asked. Every block id appears once.`;

// Closed questions for one block, from the ambiguous mismatches of its comparison.
export function questionsFor(block,signature,mismatches){
 const q=[];
 const types=new Set(mismatches.filter(m=>m.severity==='ambiguous').map(m=>m.type));
 if(types.has('figure'))q.push({key:'figure',ask:'Is the figure in this crop a decorative picture (a mascot or illustration with no mathematical or instructional content)? Give decorative true or false and, if not decorative, which side of the text it is on.'});
 if(types.has('arrows'))q.push({key:'arrows',ask:'List every arrow drawn in this crop, including arrows inside pictures: the text at the tail and at the tip, the direction, which side of the text it lies on, and its label. An empty list if there are none.'});
 const gaps=mismatches.filter(m=>m.type==='groups'&&m.severity==='ambiguous'&&!m.advisory);
 if(gaps.length)q.push({key:'groups',ask:'For each pair of consecutive lines, is there a visibly larger vertical gap between them than between the other lines of the same column? Answer split true or false.',pairs:gaps.map(m=>({after:m.lineIds[0],before:m.lineIds[1]}))});
 const cols=mismatches.filter(m=>m.type==='column'&&m.severity==='ambiguous');
 if(cols.length)q.push({key:'columns',ask:'For each alignment column, are the relation signs (=, :) of the listed lines printed one above the other in a single vertical column? Answer aligned true or false.',columns:cols.map(m=>({index:m.column,lines:m.lineIds}))});
 return q;
}
const brief=signature=>({
 lines:signature.lines.map(l=>({id:l.id,text:l.text.slice(0,70),lane:l.lane})),
 lanes:signature.lanes,
 columns:signature.columns.map((c,i)=>({index:i,relation:c.relation,lines:c.lineIds})),
 arrows:signature.arrows.map(a=>({from:a.from,to:a.to,direction:a.direction,side:a.side,label:a.label})),
 figure:signature.figure
});

// `jobs`: [{blockId, block, signature, mismatches, entry}] with ambiguous mismatches the model can settle.
// Returns {answers: Map(blockId -> corrections), calls}.
export async function confirmSignatures({jobs,files,project,workDir,runner=defaultRunner,lease=defaultLease,log=()=>{}}){
 const answers=new Map(),calls=[],crops=path.join(workDir,'crops');
 const ready=[];
 for(const job of jobs){
  const questions=questionsFor(job.block,job.signature,job.mismatches);if(!questions.length)continue;
  const crop=regionCrop(job.entry);if(!crop||!files.pdf)continue;
  const out=path.join(crops,job.blockId+'.png');
  try{cropPage(files.pdf,crop.page,crop.box,out,{zoom:2});}catch(error){log('crop failed for '+job.blockId+': '+error.message);continue;}
  ready.push({...job,questions,crop:out});
 }
 for(const group of chunks(ready,BATCH)){
  const prompt=CONFIRM_RULES+'\n\nBlocks (image k is the crop of block k):\n'+json(group.map((j,k)=>({image:k+1,blockId:j.blockId,extracted:brief(j.signature),questions:j.questions})));
  const started=Date.now();
  const {result,usage}=await callWorker({runner,lease,canonicalRunDir:canonicalRunDir(project),workDir,name:'source-match-confirm',prompt,images:group.map(j=>j.crop)});
  calls.push({kind:'confirm',blocks:group.map(j=>j.blockId),elapsedMs:Date.now()-started,usage:usage??null});
  log('confirm: '+group.map(j=>j.blockId).join(', '));
  for(const row of Array.isArray(result?.blocks)?result.blocks:[]){
   const job=group.find(j=>j.blockId===row?.blockId);if(!job)continue;
   const asked=new Set(job.questions.map(q=>q.key)),corrections={};
   for(const key of asked)if(row[key]!==undefined)corrections[key]=row[key];
   answers.set(job.blockId,corrections);
  }
 }
 return {answers,calls};
}
