import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {fromSource} from '../../public/libs/maths-editor/document-model.mjs';
import {clozeLayout} from '../../public/libs/maths-editor/house-style.mjs';
import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';
import {walk} from './repair-integers-feedback-20261002.mjs';

export const projectId='computation-with-integers-v1';
export const runDir='.booklet-work/integers-cloze-20261004';
// Only empty TeX writing boxes; mathematical boxed results are untouched.
const box=/\{\\color\{#[a-f\d]+\}\\boxed\{\\rule(?:\[[^\]]+\])?\{[^{}]+\}\{[^{}]+\}\\hspace\{[^{}]+\}\}\}|\\boxed\{\\rule(?:\[[^\]]+\])?\{[^{}]+\}\{[^{}]+\}\\hspace\{[^{}]+\}\}/gi;
const textOf=value=>typeof value==='string'?value:(value?.blocks??[]).flatMap(p=>(p.inlines??[]).map(i=>i.latex??i.text??'')).join(' ');
const hasBox=value=>JSON.stringify(value??'').includes('boxed');
export function repairIntegersCloze(source){
 const next=structuredClone(source),records=[];
 for(const block of next.sections.flatMap(s=>s.blocks)){
  // These response boxes represent the cards being selected, not ordinary blanks.
  if(block.id==='p43-q14')continue;
  walk(block.content,node=>{
   if(!hasBox(node.prompt))return;
   let doc=typeof node.prompt==='string'?fromSource(node.prompt):node.prompt;
   let count=0;walk(doc,p=>{for(const i of p.inlines??[])if(i.type==='math')count+=[...i.latex.matchAll(box)].length;});
   if(!count)return;
   const answer=textOf(node.answer?.short);
   let expected;
   if(count===1)expected=[answer.match(/\$([^$]+)\$/)?.[1]??answer.trim()];
   else if(node.id.startsWith('p57-q12-'))expected=[...answer.matchAll(/-?\d+/g)].slice(0,count).map(m=>m[0]);
   else expected=answer.replace(/[$]/g,'').replace(/\\[,;]/g,'').split(',').map(s=>s.trim());
   if(expected.length!==count)expected=[...answer.matchAll(/-?\d+/g)].map(m=>m[0]);
   if(expected.length!==count||expected.some(s=>!s))throw Error(`Unmapped response: ${node.id} (${count}): ${answer}`);
   let index=0;
   walk(doc,p=>{if(!p.inlines)return;p.inlines=p.inlines.flatMap(i=>{
    if(i.type!=='math'||![...i.latex.matchAll(box)].length)return [i];
    const parts=[],matches=[...i.latex.matchAll(box)];let start=0;
    const math=latex=>{latex=latex.replace(/\\(?:left|right)(?=[()])/g,'').trim();if(latex)parts.push({...i,latex});};
    for(const m of matches){math(i.latex.slice(start,m.index));const response=`$${expected[index++]}$`;parts.push({type:'cloze',answer:response,expectedResponse:response,...clozeLayout(response),reviewStatus:'reviewed'});start=m.index+m[0].length;}math(i.latex.slice(start));return parts;
   });});
   if(typeof node.prompt==='string')doc.blocks.forEach((p,i)=>p.id=`${node.id}-dotted-${i+1}`);
   node.prompt=doc;records.push({blockId:block.id,targetId:node.id,clozes:count});
  });
  if(records.some(r=>r.blockId===block.id)){
   walk(block.content,n=>{if(typeof n.prompt==='string')n.prompt=n.prompt.replace(/empty boxes/g,'blanks').replace(/into the boxes below/g,'in the blanks below');for(const i of n.inlines??[])if(i.type==='text')i.text=i.text.replace(/placed in the box/g,'written in the blank');});
   block.sourceReview??={};block.sourceReview.intentionalDepartures??=[];
   const note='Feedback 4 October 2026: ordinary completion boxes use editable dotted clozes, sized for the expected handwritten response; accepted answers and teaching methods are unchanged.';
   if(!block.sourceReview.intentionalDepartures.includes(note))block.sourceReview.intentionalDepartures.push(note);
   for(const a of block.sourceReview.arrangements??[])if(typeof a.description==='string')a.description=a.description.replace(/(?:native )?(?:editable )?(?:writable )?(?:outlined )?(?:writing |response )?boxes/g,'dotted completion blanks').replace(/writable outlined box/g,'dotted completion blank');
  }
 }
 const blocks=next.sections.flatMap(s=>s.blocks),q11=blocks.find(b=>b.id==='p35-q11');
 q11.content.children[0].columns=q11.content.children[1].columns;
 for(const a of q11.sourceReview.arrangements)a.description='Subparts i–iv form two columns and two rows, read i–ii then iii–iv; equations and repeated source items are preserved.';
 const square=blocks.find(b=>b.id==='p37-q13');
 for(const part of square.content.children){
  const table=part.prompt.blocks[0];
  if(table.rows[0].length===3&&table.border)continue;
  table.rows=table.rows.map(row=>row[0].blocks[0].slots.map(slot=>({id:slot.id.replace(/-card$/,'-cell'),type:'cell',align:'center',verticalAlign:'middle',blocks:slot.blocks})));
  Object.assign(table,{border:true,widthMm:66,widths:[1,1,1],rowHeights:[16,16,16],padding:0});
 }
 square.sourceReview.arrangements=[{targetId:square.content.id,description:'Three labelled native 3×3 bordered magic-square tables in the accepted two-column arrangement. Given numbers and blank response cells are centred; table cells provide writing space without dotted leaders.'}];
 square.sourceReview.intentionalDepartures??=[];
 const tableNote='Feedback 4 October 2026: restore contiguous table borders instead of separated cards; preserve all given and missing values.';
 if(!square.sourceReview.intentionalDepartures.includes(tableNote))square.sourceReview.intentionalDepartures.push(tableNote);
 for(const id of ['p60-q2','p62-q10','p62-q11']){const b=blocks.find(b=>b.id===id);walk(b.content,n=>{if(typeof n.prompt==='string')n.prompt=n.prompt.replace(/into the boxes below/g,'in the blanks below');for(const i of n.inlines??[])if(i.type==='text')i.text=i.text.replace(/placed in the box/g,'written in the blank');});}
 return {project:next,records};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const source=await loadBookletProject(projectId,{refreshRatings:false});
 if(source.revision!==231)throw Error(`Expected revision 231, got ${source.revision}`);
 await fs.mkdir(runDir,{recursive:true});
 try{await fs.writeFile(runDir+'/before.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;if(JSON.stringify(JSON.parse(await fs.readFile(runDir+'/before.json')))!==JSON.stringify(source))throw Error('Snapshot changed');}
 const {project,records}=repairIntegersCloze(source);
 await fs.writeFile(runDir+'/candidate.json',JSON.stringify(project,null,2)+'\n');
 await fs.writeFile(runDir+'/receipt.json',JSON.stringify({startedAt:new Date().toISOString(),inputRevision:231,records,status:'candidate'},null,2));
 if(process.argv.includes('--apply')){const saved=await saveBookletProject(project,{expectedRevision:231});await fs.writeFile(runDir+'/saved.json',JSON.stringify(saved,null,2)+'\n');console.log(JSON.stringify({revision:saved.revision,questions:new Set(records.map(r=>r.blockId)).size,clozes:records.reduce((s,r)=>s+r.clozes,0)}));}
 else console.log(JSON.stringify({questions:new Set(records.map(r=>r.blockId)).size,clozes:records.reduce((s,r)=>s+r.clozes,0)}));
}
