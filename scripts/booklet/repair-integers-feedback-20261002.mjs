import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {loadBookletProject,saveBookletProject} from './project-studio-server.mjs';
import {arrangementCatalog} from '../../src/lib/booklet-arrangement.js';
import {hasTablePartLabel} from '../../public/libs/maths-editor/table-part-label.mjs';

export const projectId='computation-with-integers-v1';
export const runDir='.booklet-work/integers-feedback-20261002';
export function walk(value,visit,path='') {
 if(!value||typeof value!=='object')return;
 if(!Array.isArray(value))visit(value,path);
 for(const [key,child]of Object.entries(value))if(typeof child==='object')walk(child,visit,path+'/'+key);
}
export function repairIntegersFeedback(source) {
 const next=structuredClone(source),blocks=next.sections.flatMap(s=>s.blocks),find=id=>{
  const block=blocks.find(b=>b.id===id);if(!block)throw Error('Missing '+id);return block;
 };
 const q12=find('p12-q3-block').content;
 const model=q12.children[0].prompt.blocks[0];
 for(const part of q12.children.slice(1))Object.assign(part.prompt.blocks[0],{
  widthMm:model.widthMm,widths:[...model.widths],rowHeights:[...model.rowHeights],padding:model.padding,border:model.border,annotations:[]
 });
 walk(find('p30-q3').content.prompt,n=>{
  if(n.id==='p30-q3-cards-table')Object.assign(n,{rowHeights:Array(6).fill(8),marginBefore:0,marginAfter:0});
  if(n.type==='layout'&&n.arrangement==='cards')Object.assign(n,{padding:.5,margin:0,gap:0});
  if(n.type==='paragraph')Object.assign(n,{spaceAfter:0,lineHeight:1.2});
 });
 walk(find('p31-information').content,n=>{
  if(n.type==='layout')Object.assign(n,{padding:1,margin:1,gap:3});
  if(n.type==='paragraph')Object.assign(n,{lineHeight:1.2,spaceAfter:.5});
 });
 walk(find('p41-q5').content.prompt,n=>{if(n.type==='cell'&&n.id.match(/^p41-q5-card\d+-cell$/))n.background='transparent';});
 const q15=find('p50-q15');
 q15.content.children.forEach((part,index)=>part.label=String.fromCharCode(97+index));
 walk(q15.content.children[0].prompt,n=>{if(n.type==='table')n.rows.forEach((row,r)=>row.forEach((cell,c)=>{if(r===0||c===0)cell.background='#d3e8fc';}));});
 q15.sourceReview.intentionalDepartures??=[];
 if(!q15.sourceReview.intentionalDepartures.some(x=>x.feedbackId==='09bb4dc8-01d1-431d-95ed-2d2c6e7ac7e2'))q15.sourceReview.intentionalDepartures.push({feedbackId:'09bb4dc8-01d1-431d-95ed-2d2c6e7ac7e2',description:'Display source parts g/h as a/b within this question; retain original IDs and source inventory. First table row/column uses standard light blue to distinguish addends.'});
 for(const part of find('p52-example-group').content.children)walk(part.prompt,n=>{if(['p52-example-1-table','p52-example-2-table'].includes(n.id))n.border=false;});
 const q11=find('p56-q11-block');
 for(const part of q11.content.children){part.prompt.blocks=part.prompt.blocks.filter(n=>!n.id.endsWith('-response'));part.responseSpace='scaffold';part.answerSpaceMm=0;walk(part.prompt,n=>{if(n.type==='paragraph')Object.assign(n,{lineHeight:1.2,spaceAfter:0});});}
 const q14=find('p57-q14');
 const singleLines={c:'(-5)^2\\times6\\div[10\\times5\\div(-10)]',f:'120-20\\times5-40\\div2\\div5',i:'\\{[79-(2-3)]\\div4\\}-1\\times(-7-3)'};
 for(const [part,latex]of Object.entries(singleLines))q14.content.children.find(n=>n.label===part).prompt.blocks[0].inlines[0].latex=latex;
 for(const block of [q11,q14]){
  const overrides=next.settings.layoutOverrides??={};overrides.blockLayouts??={};
  const tree=arrangementCatalog(block,overrides).initial;
  walk(tree,n=>{if(n.type==='group'){
   if(block===q11)n.gap=1;
   if(block===q14&&/^p57-q14-root:row:/.test(n.id)){
    const weights=n.id.endsWith(':0')?[1,1,2]:n.id.endsWith(':3')?[1,1,1]:[1.25,.9,1.85];
    n.children.forEach((child,i)=>child.weight=weights[i]);
   }
  }});
  overrides.blockLayouts[block.id]={...overrides.blockLayouts[block.id],arrangement:tree};
 }
 // The adjacent accepted question has a reproducible 0.93 mm intrinsic-width
 // overrun. Preserve its saved tree and give only that cell a little more room.
 const q19=find('p59-q19');
 for(const tree of [next.settings.layoutOverrides.blockLayouts[q19.id]?.arrangement,q19.presentation?.layoutOverrides?.blockLayouts?.[q19.id]?.arrangement])walk(tree,n=>{if(n.id==='p59-q19-c-cell')n.weight=1.08;});
 return next;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const startedAt=new Date().toISOString(),source=await loadBookletProject(projectId);
 if(source.revision!==201)throw Error(`Expected revision 201, got ${source.revision}; reconcile concurrent edits first`);
 await fs.mkdir(runDir,{recursive:true});
 try{await fs.writeFile(runDir+'/before.json',JSON.stringify(source,null,2)+'\n',{flag:'wx'});}
 catch(error){if(error.code!=='EEXIST')throw error;const before=JSON.parse(await fs.readFile(runDir+'/before.json','utf8'));if(JSON.stringify(before)!==JSON.stringify(source))throw Error('Existing repair snapshot differs; reconcile before applying');}
 const next=repairIntegersFeedback(source),audit=[];
 for(const file of await fs.readdir('booklets/projects'))if(file.endsWith('.json')){
  const project=JSON.parse(await fs.readFile('booklets/projects/'+file,'utf8'));if(project.library?.archivedAt)continue;
  const report={project:project.id,revision:project.revision,clozes:0,tablePartLabels:[]};
  walk(project.sections,(n,path)=>{if(n.type==='cloze')report.clozes++;if(hasTablePartLabel(n)&&path.includes('/rows/'))report.tablePartLabels.push(n.id);});
  if(report.clozes||report.tablePartLabels.length)audit.push(report);
 }
 await fs.writeFile(runDir+'/candidate.json',JSON.stringify(next,null,2)+'\n');
 await fs.writeFile(runDir+'/receipt.json',JSON.stringify({startedAt,inputRevision:source.revision,inputHash:crypto.createHash('sha256').update(JSON.stringify(source)).digest('hex'),audit,comments:source.studio.flags.filter(f=>!f.workflowIssue&&!f.resolved).map(f=>({id:f.id,targetId:f.targetId,scope:f.scope})),status:'candidate'},null,2)+'\n');
 if(process.argv.includes('--apply')){
  const saved=await saveBookletProject(next,{expectedRevision:source.revision});
  console.log(JSON.stringify({from:source.revision,to:saved.revision,sharedAudit:audit.map(a=>({project:a.project,clozes:a.clozes,labels:a.tablePartLabels.length}))}));
 }else console.log(JSON.stringify({revision:source.revision,candidate:runDir+'/candidate.json',sharedAudit:audit}));
}
