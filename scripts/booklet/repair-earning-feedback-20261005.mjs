import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {block,find,visit,doc,clearArrangement,retire} from './layout-repair-common-20261004.mjs';

export const RUN='.booklet-work/earning-feedback-20261005';
export const CHANGED=['p13-pay-example-group','p13-pay-followup-block','p31-example','p31-guided-practice','p50-example-block','p52-q1','p53-q3','p61-example-block'];
const cloze=(answer,width)=>({type:'cloze',answer:String(answer),width});
const text=value=>({type:'text',text:value});
const math=latex=>({type:'math',latex,display:false});
const paragraph=(id,inlines,fields={})=>({id,type:'paragraph',align:'left',inlines,...fields});
const note=(b,message)=>{b.sourceReview??={};b.sourceReview.intentionalDepartures??=[];b.sourceReview.intentionalDepartures.push('User-authorised feedback 5 October 2026: '+message);};
const role=(b,kind,label)=>{b.pedagogyRole=kind;b.sourceAtom={...b.sourceAtom,kind,label};};
function insertAfter(p,b,newBlock){const s=p.sections.find(s=>s.blocks.includes(b));s.blocks.splice(s.blocks.indexOf(b)+1,0,newBlock);}
function retainResponses(b){const ids=new Set();visit(b.content,n=>{if(n.id)ids.add(n.id);});b.sourceReview.responses=(b.sourceReview.responses??[]).filter(r=>ids.has(r.targetId));}

export function repairEarningFeedback(source){
 const p=structuredClone(source);
 const lilyBlock=block(p,'p13-pay-example-group'),original=structuredClone(lilyBlock),lily=lilyBlock.content.children[0];
 const table=lily.prompt.blocks[0];
 if(table.id!=='p13-lily-bordered-demonstration')throw Error('Unexpected Lily wrapper');
 retire(lilyBlock,[table.id,table.rows[0][0].id]);lily.prompt=doc(table.rows[0][0].blocks);
 const working=find(lily.prompt,'p13-example-lily-solution');
 lilyBlock.sourceReview.feedbackRepairOriginalWorking=structuredClone(working);
 const rows=[['normal','Normal pay',String.raw`\text{Normal pay}=\text{Normal pay per hour}\times\text{Number of normal hours}`,[cloze(25,12),math(String.raw`\times`),cloze(35,12),math('='),cloze('$875',20)]],
 ['overtime','Overtime pay',String.raw`\text{Overtime pay}=\text{Normal pay per hour}\times\text{Number of overtime hours}\times\text{Penalty rate}`,[cloze(25,12),math(String.raw`\times`),cloze(4,10),math(String.raw`\times`),cloze(1.5,14),math('='),cloze('$150',20)]],
 ['total','Total pay',String.raw`\text{Total pay}=\text{Normal pay}+\text{Overtime pay}`,[cloze(875,16),math('+'),cloze(150,16),math('='),cloze('$1025',22)]]];
 working.slots=rows.map(([name,label,formula,inlines],i)=>({id:working.slots[i].id,blocks:[paragraph(`p13-lily-${name}-formula`,[math(formula)]),paragraph(`p13-lily-${name}-working`,[text(label+' = '),...inlines],{spaceAfter:3})]}));
 lily.responseSpace='scaffold';lily.answerSpaceMm=0;
 lilyBlock.content.children=[lily];role(lilyBlock,'guided-practice','Guided practice');
 lilyBlock.sourceReview.responses=[{targetId:lilyBlock.content.id,kind:'none',label:''},{targetId:lily.id,kind:'cloze',label:''}];
 clearArrangement(p,lilyBlock);note(lilyBlock,'Lily uses native dotted completion blanks; complete original working and source evidence retained. Removed decorative inner table.');
 const follow={...original,id:'p13-pay-followup-block',sourceAtom:{...original.sourceAtom,id:'p13-pay-followup-atom'},content:{...original.content,id:'p13-pay-followup-root',children:original.content.children.slice(1)}};
 retainResponses(follow);follow.sourceReview.responses.push({targetId:follow.content.id,kind:'none',label:''});insertAfter(p,lilyBlock,follow);clearArrangement(p,follow);note(follow,'Retained Ben and Rina with their existing Example classification after separating Lily.');

 const salary=block(p,'p31-example'),responseGroup=salary.content.children[1];
 const guided={...structuredClone(salary),id:'p31-guided-practice',sourceAtom:{...salary.sourceAtom,id:'p31-guided-practice-atom'},content:{...salary.content,id:'p31-guided-practice-root',children:[responseGroup]}};
 salary.content.children=salary.content.children.slice(0,1);role(salary,'example','Worked example');role(guided,'guided-practice','Guided practice');
 salary.presentation={...salary.presentation,permanentTeachingPrompt:true,sourceResponseLabels:true};
 for(const response of salary.sourceReview.responses)response.label='';
 retainResponses(salary);retainResponses(guided);clearArrangement(p,salary);clearArrangement(p,guided);insertAfter(p,salary,guided);
 note(salary,'First two salary items remain worked examples.');note(guided,'Last two salary items are guided practice; answers and writing allowances preserved.');

 const tax=block(p,'p50-example-block'),reflections=block(p,'p50-example-reflections');
 tax.sourceReview.removedFeedbackContent=structuredClone(reflections);
 const s=p.sections.find(s=>s.blocks.includes(reflections));s.blocks.splice(s.blocks.indexOf(reflections),1);clearArrangement(p,reflections);
 const formulaFontSizes={'p50-b-demo-excess-rule':9.25,'p50-b-demo-tax-rule':10.75,'p50-b-turn-excess-rule':10.25,'p50-b-turn-tax-rule':11,'p50-c-demo-excess-rule':9.25,'p50-c-demo-tax-rule':10.75,'p50-c-turn-excess-rule':10,'p50-c-turn-tax-rule':11};
 visit(tax.content,n=>{if(n.type==='paragraph'&&/-rule$/.test(n.id??'')){n.inlines=n.inlines.filter(x=>x.type!=='break');n.fontSize=formulaFontSizes[n.id];n.lineHeight=1.4;}});
 note(tax,'Removed three definition follow-ups as requested, preserving original evidence; formula lines no longer contain forced breaks. Local font sizes are measured at final size.');

 const brackets=block(p,'p52-q1');clearArrangement(p,brackets);brackets.content.layout='grid';brackets.content.columns=5;
 for(const child of brackets.content.children){const para=child.prompt.blocks[0],blank=para.inlines.find(i=>i.type==='cloze');para.inlines=para.inlines.filter(i=>i.type!=='cloze');child.prompt.blocks.push(paragraph(child.id+'-response',[blank]));}
 note(brackets,'Tax table stands above one five-part row; response blanks retain their handwriting width.');

 const scaffold=block(p,'p53-q3');
 for(const [index,values]of [[0,[5092,0.325,95423,45000]],[1,[29467,0.37,172846,120000]]]){
  const child=scaffold.content.children[index],para=find(child.prompt,child.id+'-scaffold');
  para.inlines=[cloze(values[0],18),math('+'),cloze(values[1],index===0?18:16),math(String.raw`\times(`),cloze(values[2],20),math('-'),cloze(values[3],20),math(')')];
  find(child.prompt,child.id+'-result-scaffold').inlines=[math('='),cloze(index===0?'$21 479.48':'$49 020.02',28)];
 }
 const parts=scaffold.content.children;scaffold.content.layout='list';delete scaffold.content.columns;
 scaffold.content.children=[{id:'p53-q3-scaffolded-parts',type:'group',layout:'list',children:parts.slice(0,2)},{id:'p53-q3-independent-parts',type:'group',layout:'grid',columns:2,children:parts.slice(2)}];
 note(scaffold,'Single-line native dotted formula scaffolds replace manually split boxed expressions; scaffolded a/b use full-width stacked parts to preserve handwriting widths, while c–f retain two columns. Separate result lines and writing allowances retained.');

 const refund=block(p,'p61-example-block');visit(refund.content,n=>{
  if(n.type==='cell')n.verticalAlign='top';
  if(n.type==='table'&&/^p61-charlie-scaffold/.test(n.id??'')){n.padding=0;n.marginBefore=0;n.marginAfter=0;}
  if(n.id==='p61-charlie-excess-tax-cell')n.preserveParagraphSpacing=true;
  if(n.id==='p61-charlie-excess-label')n.spaceAfter=11;
 });
 note(refund,'Top-aligned paired givens and all corresponding working/scaffold stages, preserving writing heights.');
 return p;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const before=JSON.parse(fs.readFileSync(RUN+'/before.json','utf8'));
 fs.writeFileSync(RUN+'/candidate.json',JSON.stringify(repairEarningFeedback(before),null,2)+'\n');
 console.log(JSON.stringify({project:before.id,revision:before.revision,changed:CHANGED,status:'staged'}));
}
