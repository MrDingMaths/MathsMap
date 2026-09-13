import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fromSource} from '../../public/libs/maths-editor/document-model.mjs';
import {correctnessMarker,numberedTeachingWorking} from '../../public/libs/maths-editor/teaching-style.mjs';
import {prepareAutomaticSync,projectSyncStatus,writeTransaction} from './bank-sync.mjs';
import {reconcileSyncLayout} from '../../src/lib/question-sync-layout.js';
const out='.booklet-work/angle-feedback-20260913';
const skip=new Set(['source','sourceReview','sourceAtom','sourceLayoutEvidence','spec','studio','provenance','verification']);
function walk(x,fn){if(!x||typeof x!=='object')return;fn(x);for(const [k,v]of Object.entries(x))if(!skip.has(k))walk(v,fn);}
function find(x,id){let result;walk(x,n=>{if(n.id===id)result=n;});assert.ok(result,id);return result;}
function marker(latex){const bare=latex.replace(/\\(?:textcolor|color)\{[^}]*\}/g,'').replace(/\\(?:large|Large|small|normalsize)\b/g,'').replace(/[{}\s]/g,'');return bare==='\\checkmark'?true:bare==='\\times'?false:null;}
function isMarker(n){const m=marker(n.latex??'');return m===true||m===false&&(n.semanticRole==='correctness-marker'||/^#(?:ef6068|ff0000)$/i.test(n.colour??'')||/\\(?:textcolor|color)\{#(?:ef6068|ff0000)\}/i.test(n.latex));}
function markTeaching(block){let count=0;
 const visit=x=>{if(!x||typeof x!=='object')return;
  if(x.type==='text'&&/^[\u2713\u2714\u2716\u2717\u2718]$/.test(x.text?.trim()??'')){const correct=/[\u2713\u2714]/.test(x.text);delete x.text;delete x.marks;Object.assign(x,correctnessMarker(correct));count++;}

  for(const [key,value]of Object.entries(x)){
   if(skip.has(key))continue;
   if(typeof value==='string'&&['prompt','theorySolution','short','worked'].includes(key)&&/\\(?:checkmark|times)/.test(value)){
    const doc=fromSource(value);let found=false;walk(doc,n=>{if(n.type==='math'&&isMarker(n)){Object.assign(n,correctnessMarker(marker(n.latex)));found=true;count++;}});
    if(found){let i=0;walk(doc,n=>{if(n.id)n.id=`marker-${createHash('sha256').update(block.id+'/'+key+'/'+value).digest('hex').slice(0,12)}-${i++}`;});x[key]=doc;}
   }else if(value&&typeof value==='object')visit(value);
  }
  if(x.type==='math'&&isMarker(x)&&x.semanticRole!=='correctness-marker'){Object.assign(x,correctnessMarker(marker(x.latex)));count++;}
 };visit(block);return count;
}
export function repairAngle(project){
 const block=id=>find(project.sections,id);
 for(const n of [project.settings.layoutOverrides.blockLayouts['p17-q1'],block('p17-q1').presentation])walk(n,x=>{if(/^p17-q1-[a-i]-pair$/.test(x.id??'')){x.minHeight=/[abc]-pair$/.test(x.id)?24:/[def]-pair$/.test(x.id)?29:26;}if(/^p17-q1-[a-i]-layout$/.test(x.id??''))x.gap=1;});
 for(const [id,rows]of [
 ['p28-example-left',[{number:1,lhs:'m+70+65',rhs:'=360',reason:'(angles at a point)'},{number:2,lhs:'m+135',rhs:'=360'},{number:3,lhs:'m',rhs:'=225'}]],
 ['p28-example-right',[{number:1,lhs:'a+a+120+90',rhs:'=360',reason:'(angles at a point)'},{number:2,lhs:'2a+210',rhs:'=360'},{number:3,lhs:'2a',rhs:'=150'},{number:null,lhs:'a',rhs:'=75'}]]]){
  const m=block(id).theorySolution.blocks[0].inlines[0];m.latex=numberedTeachingWorking(rows);m.colour='#268cff';
 }
 const scaffold=block('p29-q1-a').prompt;
 if(!scaffold.blocks.some(n=>n.id==='p29-q1-a-equation'))scaffold.blocks.unshift({id:'p29-q1-a-equation',type:'paragraph',align:'center',spaceAfter:1,inlines:[{type:'math',latex:'45+g=360',colour:'#268cff'}]});
 // New paragraph references are reconciled below, preserving all saved arrangements.
 // Correct stale row weights while retaining the authored diagram/scaffold widths.
 for(const layout of [project.settings.layoutOverrides.blockLayouts['p54-q2'],block('p54-q2').presentation])walk(layout,n=>{if(/^p54-q2-[a-d]-row$/.test(n.id??''))for(const child of n.children)if(child.width)child.weight=child.width;});
 // Non-drawing bounds contain final-size calibrated endpoint labels.
 for(const id of ['p38-q8-diagram-left','p42-q4-c-diagram','p65-q5-second-c-diagram','p66-diagram-f']){
  const diagram=block(id);if(!diagram.code.includes('% feedback label clearance'))diagram.code=diagram.code.replace('\\end{tikzpicture}',String.raw`% feedback label clearance
\path[use as bounding box] ([xshift=-3mm,yshift=-3mm]current bounding box.south west) rectangle ([xshift=3mm,yshift=3mm]current bounding box.north east);
\end{tikzpicture}`);
 }
 const d=block('p38-q5-diagram');d.code=d.code.replace(/\\mathbf\{([^{}]*)\}/g,'$1');
 block('p46-teaching').flow.pageBreakBefore=true;
 const circle=block('p58-q7-k-diagram');
 circle.code=circle.code.replace(/\\coordinate \([ABCD]\) at \([^;]+;/g,'').replace(/\n\s*\n/g,'\n');
 circle.code=circle.code.replace('\\draw (0,0)',String.raw`\coordinate (A) at (130:1.7);\coordinate (B) at (46:1.7);\coordinate (C) at (-68:1.7);\coordinate (D) at (244:1.7);
\draw (0,0)`);
 circle.code=circle.code.replace('(-20.5:0.85)','(-30.5:0.72)').replace('(159.5:0.48)','(149.5:0.68)');
 if(!circle.code.includes('arc[start angle=121'))circle.code=circle.code.replace('\\end{tikzpicture}',String.raw`\draw[line width=0.4pt] ($(C)+(121:0.40)$) arc[start angle=121,end angle=178,radius=0.40];
\end{tikzpicture}`);
 const table=block('p67-q8-a-scaffold');table.rowHeights=[8,8];table.padding=1;table.widthMm=94;
 for(const layout of [project.settings.layoutOverrides.blockLayouts['p67-q8'],block('p67-q8').presentation]){
  if(!layout)continue;let row,owner;walk(layout,n=>{if(n.id==='p67-q8-a-row')row=n;if(n.children?.some(c=>c.ref==='p67-q8-a/label'))owner=n;});
  if(row&&owner&&row!==owner){const label=owner.children.find(c=>c.ref==='p67-q8-a/label');owner.children=owner.children.filter(c=>c!==label);row.children.unshift(label);}
 }
}
export async function repairFeedback(apply=false){
 await fs.mkdir(out,{recursive:true});const report=[];
 for(const name of (await fs.readdir('booklets/projects')).filter(n=>n.endsWith('.json'))){
  const file=path.resolve('booklets/projects',name),raw=await fs.readFile(file,'utf8'),original=JSON.parse(raw),p=structuredClone(original),changes=[];let markers=0;
  for(const section of p.sections)for(const b of section.blocks){const before=structuredClone(b);if(b.pedagogyRole||b.type==='worked-example'||b.type==='rich-text')markers+=markTeaching(b);if(JSON.stringify(before)!==JSON.stringify(b))changes.push(b.id);}
  if(p.id==='angle-relationships-v1'){repairAngle(p);changes.push('p17-q1','p28-example-demonstrations','p29-q1','p38-q5','p38-q8','p42-q4','p54-q2','p65-q5-second','p66-question-continuation','p46-teaching','p58-q7','p67-q8');}
  if(JSON.stringify(p)===JSON.stringify(original))continue;
  for(const id of new Set(changes)){const before=find(original.sections,id),after=find(p.sections,id);reconcileSyncLayout(before,after,after.presentation);reconcileSyncLayout(before,after,p.settings.layoutOverrides.blockLayouts[id]);}
  const scoped={...p,sections:[{blocks:p.sections.flatMap(s=>s.blocks).filter(b=>changes.includes(b.id))}]};
  const bankRoot=path.resolve('booklets/question-bank'),status=await projectSyncStatus(scoped,bankRoot);
  assert.ok(status.items.every(i=>!['conflict','update','missing'].includes(i.state)),'Explicit bank review required: '+p.id);
  await fs.writeFile(`${out}/${p.id}.candidate.json`,JSON.stringify(p,null,2));
  if(apply){const entries=await prepareAutomaticSync(scoped,bankRoot);entries.push([path.resolve('booklets/projects/.revisions',p.id,original.revision+'.json'),original]);p.revision++;p.updatedAt=new Date().toISOString();entries.push([file,p]);assert.equal(await fs.readFile(file,'utf8'),raw,'Concurrent edit: '+p.id);await writeTransaction(entries);}
  report.push({project:p.id,revision:original.revision,markers,blocks:[...new Set(changes)],applied:apply});
 }
 await fs.writeFile(`${out}/repairs.json`,JSON.stringify({at:new Date().toISOString(),report},null,2));return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1')))console.log(JSON.stringify(await repairFeedback(process.argv.includes('--apply')),null,2));
