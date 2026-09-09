// Source-reviewed repair for the Index Laws pilot. Dry run unless --apply.
import fs from 'node:fs';
import {alignSourceLeadingEquals} from '../../src/lib/booklet-source-equation-rows.js';
import {contentSource,fromSource,normalizeDocument} from '../../src/lib/document-content.js';
import {visitDocument} from '../../public/libs/maths-editor/document-model.mjs';
import {saveBookletProject} from './project-studio-server.mjs';
const file='booklets/projects/index-laws-complete-v1.json',project=JSON.parse(fs.readFileSync(file));
const out='.booklet-work/index-feedback';fs.mkdirSync(out,{recursive:true});
if(project.source.feedbackRepair)throw Error('Feedback repair is already applied. Use revision-checked edits for follow-up changes.');
const before=structuredClone(project),blocks=project.sections.flatMap(s=>s.blocks),byId=new Map(blocks.map(b=>[b.id,b]));
const blue='#0080ff',red='#aa0505',green='#196b24';
const doc=(blocks)=>normalizeDocument({blocks}),paragraph=(id,text)=>({...fromSource(text).blocks[0],id,spaceAfter:1});
const colour=(latex,c)=>`\\textcolor{${c}}{${latex}}`;
const changes=[];
function record(block,kind,note){changes.push({targetId:block.id,sourcePages:block.sourceRefs.map(r=>r.pageNumber),kind,note});}
function redirect(id,target,field){for(const e of project.source.inventory.entries)if(e.targetId===id){e.targetId=target;e.field=field+':'+e.id;e.mappingNote='Editable transcription replaces the source visual; original evidence retained.';}}
function keepImageEvidence(b,diagrams){b.sourceLayoutEvidence={...b.sourceLayoutEvidence,transcribedVisuals:[...(b.sourceLayoutEvidence?.transcribedVisuals??[]),...structuredClone(diagrams)]};}
function cards(id,values,columns){return {id,type:'layout',arrangement:'cards',columns,border:false,padding:0,margin:2,gap:4,slots:values.map((value,i)=>({id:id+'-slot-'+i,blocks:[{...paragraph(id+'-text-'+i,value),align:'center'}]}))};}
function installCards(id,values,columns){const b=byId.get(id),n=b.content,old=n.questionDiagrams;keepImageEvidence(b,old);const layout=cards(old[0].id,values,columns);for(const d of old.slice(1))redirect(d.id,layout.id,'cards');n.questionDiagrams=[];n.prompt=doc([...fromSource(n.prompt).blocks,layout]);record(b,'cards','Transcribed each card and retained its source order and grouping.');}

// Page order and page boundaries are independent of answer pagination.
let previousPage=null;
for(const s of project.sections){
 if(s.phase==='practice')s.blocks.sort((a,b)=>a.sourcePageNumber-b.sourcePageNumber||(a.sourceOrder??0)-(b.sourceOrder??0));
 const first=s.blocks[0]?.sourcePageNumber;s.pageBreakBefore=first!==previousPage;
 for(const b of s.blocks){b.flow={...b.flow,sourcePageBreakBefore:previousPage!==null&&b.sourcePageNumber!==previousPage};delete b.flow.pageBreakBefore;previousPage=b.sourcePageNumber;}
}
project.settings.preserveSourcePages=true;
project.settings.sourcePaginationPolicy='source-boundaries';

// Red source activities have demonstrations followed by responses, one header.
for(const number of [12,66,68,127,169,253,369,412]){
 const b=byId.get('index-teaching-'+number),practice=byId.get(b.id+'-practice');
 const title=b.sourceAtom.visibleSubtitle,match=/^(\S+)\s*(.*)$/.exec(title);
 b.sourceAtom={...b.sourceAtom,kind:'identify',label:match[1],visibleSubtitle:match[2]};
 practice.sourceAtom=structuredClone(b.sourceAtom);practice.pedagogyRole='identify';
 record(b,'activity','Restored the red source activity, retaining its demonstrations and response controls under one heading.');
}
byId.get('index-teaching-128').sourceAtom.visibleSubtitle='whether to add or multiply the powers';
byId.get('index-teaching-128-practice').sourceAtom.visibleSubtitle='whether to add or multiply the powers';

// Colour semantic terms without colouring exponent digits independently.
function termColours(latex,variables,numbers=true){
 const held=[];
 let text=latex.replace(/\\[A-Za-z]+/g,command=>{held.push(command);return String.fromCharCode(0xe000+held.length-1);});
 text=text.replace(/([axyb])(?:\^\{[^{}]*\}|\^[\d])?/g,token=>{const c=variables[token[0]];if(!c)return token;held.push(colour(token,c));return String.fromCharCode(0xe000+held.length-1);});
 if(numbers)text=text.replace(/\d+/g,n=>colour(n,red));
 return text.replace(/[\ue000-\uf8ff]/g,c=>held[c.charCodeAt(0)-0xe000]);
}
for(const b of blocks.filter(b=>b.type==='rich-text'&&b.sourceAtom)){
 const number=Number(b.id.replace('index-teaching-',''));
 visitDocument(b.content,n=>{
  if(n.type==='cell'){n.preserveParagraphAlignment=true;n.verticalAlign='top';}
  if(n.type!=='paragraph')return;
  // Source alignment is independent of content type: short prose labels may
  // be centred, while explanatory prose in the same table may be left aligned.
  if(number===128)n.align='center';
  if(number===68&&n.inlines.map(x=>x.text??'').join('').includes('Law doesn'))for(const x of n.inlines)if(x.type==='text')x.colour=red;
  for(const x of n.inlines??[]){
   if(x.type==='text'){
    if(/[✔✓]/.test(x.text)||number===128&&x.text==='Multiply')x.colour=green;
    if(/[✖✗×]/.test(x.text)||number===128&&x.text==='Add'||/Law doesn.t apply/.test(x.text))x.colour=red;
   }
   if(x.type!=='math')continue;
   if([206,207,209,253,254].includes(number)){
    x.latex=termColours(x.latex,number===253?{x:red,y:green}:number===254?{x:green,y:blue}:{x:green,y:green,a:green},number!==253);
    if(number!==206)x.latex=x.latex.replaceAll('=',colour('=',blue));
   }else if(number===67){x.latex=x.latex.replace(/\\div\s*(\\frac\{x\^\{2\}\}\{x\^\{2\}\})/,(_,fraction)=>colour('\\div '+fraction,red));}
   else if(number!==169&&b.sourceAtom.kind!=='definition'&&x.latex.includes('=')){
    const at=x.latex.indexOf('=');x.latex=x.latex.slice(0,at)+colour(x.latex.slice(at),blue);
   }
  }
 });
 // Native equation rows, rather than independently centred paragraphs.
 function alignCells(nodes){for(const n of nodes){
  if(n.type==='table')for(const cell of n.rows.flat()){
   let i=0;
   while(i<cell.blocks.length){
    const start=i;while(i<cell.blocks.length&&cell.blocks[i].type==='paragraph'&&cell.blocks[i].inlines.length===1&&cell.blocks[i].inlines[0].type==='math')i++;
    const run=cell.blocks.slice(start,i);
    if(run.length>1){
     b.sourceLayoutEvidence={...b.sourceLayoutEvidence,equationRows:[...(b.sourceLayoutEvidence?.equationRows??[]),...structuredClone(run)]};
     const equations=run.map(p=>p.inlines[0].latex.trim());
     run[0].inlines=[{type:'math',latex:'\\begin{aligned}'+equations.map(e=>'&'+e).join('\\\\[2pt]')+'\\end{aligned}',display:false}];
     if([12,66,67].includes(number))run[0].inlines[0].latex=alignSourceLeadingEquals(run[0].inlines[0].latex);
     for(const removed of run.slice(1))redirect(removed.id,run[0].id,'aligned-row');
     cell.blocks.splice(start,run.length,run[0]);i=start+1;
    }
    if(i===start)i++;
   }
   alignCells(cell.blocks);
  }
  if(n.slots)n.slots.forEach(s=>alignCells(s.blocks));
 }}alignCells(b.content.blocks);
 b.content=normalizeDocument(b.content);
 record(b,'colour-alignment','Restored source-supported colour and native equation rows; prose remains left aligned.');
}
// The zero-law highlights show which factor the zero applies to; preserve the
// previously confirmed source correction 3 + 1 = 4.
{
 const b=byId.get('index-teaching-169'),cells=[];
 visitDocument(b.content,n=>{if(n.type==='cell'&&n.blocks.some(p=>p.inlines?.some(x=>x.type==='math')))cells.push(n);});
 const examples=[`5${colour('x^0',blue)}&=5\\times${colour('1',blue)}\\\\&=5`,`${colour('(5x)^0',blue)}=${colour('1',blue)}`,`${colour('(3ab)^0',blue)}=${colour('1',blue)}`,`x${colour('(y^2)^0',blue)}&=x\\times${colour('1',blue)}\\\\&=x`,`3+${colour('a^0',blue)}&=3+${colour('1',blue)}\\\\&=4`];
 cells.forEach((c,i)=>{const p=c.blocks.find(p=>p.inlines?.some(x=>x.type==='math'));const rows=examples[i].replace('&=',String.raw`\\&=`).replace(/(?<!&)=(?=\\textcolor)/,String.raw`\\&=`);p.inlines=[{type:'math',latex:'\\begin{aligned}&'+rows+'\\end{aligned}',display:false}];});
}

const speeches=[
 ['index-t1-q7','Laura is simplifying $e^4\\times e^3$.','You multiply the powers, so the answer is $e^{12}$.','Laura'],
 ['index-t1-q8','Julie is simplifying $w^4\\times w$.','The answer is $w^4$ since the second $w$ has no power.','Julie'],
 ['index-t2-q13','Ally says:','$8^{17}\\div8^{15}=1^2$','Ally'],
 ['index-t5-q12','Tammy is trying to simplify $2q^4\\times4q^5$.','The answer is $6q^9$.','Tammy']
];
for(const [id,intro,statement,name]of speeches){
 const b=byId.get(id),n=b.content,d=n.questionDiagrams[0],r=d.sourceRegion;keepImageEvidence(b,n.questionDiagrams);
 const picture={id:d.id,type:'image',src:d.src,alt:name,width:17,aspectRatio:r.sourceWidth/r.sourceHeight,crop:[100*r.y/r.sourceHeight,100*(r.sourceWidth-r.x-r.width)/r.sourceWidth,100*(r.sourceHeight-r.y-r.height)/r.sourceHeight,100*r.x/r.sourceWidth]};
 n.prompt=doc([paragraph(id+'-intro',intro),{id:id+'-speech',type:'layout',arrangement:'speech-bubble',tail:'left',columns:2,border:false,margin:2,padding:0,gap:5,tracks:[1,6],slots:[{id:id+'-character',blocks:[picture]},{id:id+'-statement',blocks:[paragraph(id+'-statement-text',statement)]}]},paragraph(id+'-instruction','Explain why she is incorrect and state the correct answer.')]);
 n.questionDiagrams=[];record(b,'speech-bubble','Restored an editable character statement with its associated illustration.');
}
installCards('index-t2-q6',['A  $\\frac{g^8}{g^4}$','B  $g^8\\div g^4$'],2);
installCards('index-t2-q18',['$2^9=512$','$2^{11}=2048$','$2^{20}=1048576$'],3);
installCards('index-t3-q9',['$(r^{273})^{95}$','$(r^{95})^{273}$'],2);
installCards('index-t7-q13',['a  $g^3(g^2+g^5)$','A  $g^{10}$','b  $g^3(g^2\\times g^5)$','B  $g^{21}$','c  $(g^2)^3+(g^5)^3$','C  $g^5+g^8$','d  $(g^2)^3\\times(g^5)^3$','D  $g^6+g^{15}$'],2);
installCards('index-t7-q27',['$12y^3$','$18y^6$','$10y$','$12$','$10y^4$','$6y^8$','$5y^2$','$2y^4$'],8);
{
 const b=byId.get('index-t6-q5'),parts=b.content.children.slice(8),images=parts[0].questionDiagrams;
 if(images.length!==4)throw Error('Expected four source p34 formulas');
 parts.forEach((n,i)=>n.questionDiagrams=[images[i]]);
 record(b,'formula-binding','Assigned each source formula to its own i–l label.');
 const q=byId.get('index-t3-q3'),d=q.content.questionDiagrams[0];keepImageEvidence(q,[d]);q.content.questionDiagrams=[];redirect(d.id,q.content.children[0].id,'native-row');
 record(q,'duplicate-source-image','Removed the raster duplicate of the native a(i–v) row.');
}

// Retained raster scaffolds already preserve the source working. Give their
// writing rectangles more physical room; mathematical examples are excluded.
const imageScaffolds={
 'index-t2-q9':['a','b','c','d','e'], 'index-t5-q6':['a','b','c'],
 'index-t6-q5':['a','b','c','d','e','f','g','h'], 'index-t7-q2':['a','b','c','d'],
 'index-t7-q16':['a','b'], 'index-t7-q22':['a','b','c','d','e','f'],
 'index-t8-q1':['a','b'], 'index-t8-q2':['b','c','d'],
 'index-t8-q6':['b','c','d','e'], 'index-t8-q7':['a'],
 'index-t8-q15':['a','b','c','d'], 'index-t9-q1':['a','b'], 'index-t10-q5':['b','c']
};
for(const [id,labels]of Object.entries(imageScaffolds)){
 const b=byId.get(id);
 for(const n of b.content.children.filter(n=>labels.includes(n.label)))for(const d of n.questionDiagrams??[]){
  // A node may include a separate plain formula crop: expand only scaffolds.
  if(d.widthMm<30&&['index-t8-q2'].includes(id))continue;
  d.widthMm=Math.min(170,d.widthMm*1.2);
 }
 record(b,'image-writing-box','Enlarged source writing scaffolds by 20%; retained examples and source evidence.');
}

// Physical dimensions in mm keep exponent/fraction boxes writable even when
// mathematical script style shrinks the surrounding glyphs.
const writeBox=String.raw`\boxed{\rule{0pt}{3mm}\hspace{3mm}}`;
for(const b of blocks){
 const transform=value=>{
  const fix=text=>text.replace(/\{base\}/g,'{\\text{base}}').replace(/\\boxed\{\\phantom\{(?:0|00|000)\}\}|\\square\b|\\Box\b/g,writeBox);
  if(typeof value==='string')return fix(value);
  if(value?.format==='maths-editor-document-v1'){visitDocument(value,n=>{for(const x of n.inlines??[])if(x.type==='math')x.latex=fix(x.latex);});}
  return value;
 };
 if(b.type==='question'){
  const visit=n=>{const old=JSON.stringify(n.prompt);n.prompt=transform(n.prompt);if(old!==JSON.stringify(n.prompt))record(b,'response-box-or-prose','Sized blank mathematical boxes for handwriting and kept prose labels upright.');n.children?.forEach(visit);};visit(b.content);
 }
}
{
 const b=byId.get('index-t1-q1'),n=b.content.children.find(n=>n.label==='b');
 n.prompt=n.prompt.replace('6^4\\times6^3&=', '&6^4\\times6^3\\\\&=');
 record(b,'response-box-layout','Placed the long factor scaffold on its own aligned line so handwriting boxes fit the two-column source grouping.');
}
for(const b of blocks){
 const requirements=[];
 const walk=(n,path)=>{if(!n||typeof n!=='object')return;
  for(const [key,value]of Object.entries(n)){
   if(['sourceLayoutEvidence','sourceReview','answer'].includes(key))continue;
   const next=path+'/'+key;
   if(key==='colour'&&/^#/.test(value)||key==='arrangement'&&['cards','speech-bubble'].includes(value)||key==='tail'||key==='preserveParagraphAlignment'||key==='align'||key==='widthMm'||['prompt','latex'].includes(key)&&typeof value==='string'&&/textcolor|rule\{0pt\}|text\{base\}|begin\{aligned\}/.test(value))requirements.push({path:next,value});
   else if(typeof value==='object')walk(value,next);
  }
 };walk(b,'');
 b.sourceReview={...b.sourceReview,presentationRequirements:requirements,teachingGroup:b.sourceAtom?{id:b.sourceAtom.id,kind:b.sourceAtom.kind,label:b.sourceAtom.label,visibleSubtitle:b.sourceAtom.visibleSubtitle}:null,sourcePagination:{page:b.sourcePageNumber,breakBefore:!!b.flow?.sourcePageBreakBefore},feedbackAudit:{categories:['colour','pagination','speech-bubbles','writing-boxes','activity-groups','alignment','cards-and-prose'],status:'pending-render-comparison'}};
 delete b.sourceReview.verification;
}
project.source.feedbackRepair={version:1,baseRevision:before.revision,status:'awaiting-render-review',sourcePagination:'Source page boundaries with continuation pages only when needed.'};
const answerSnapshot=p=>p.sections.flatMap(s=>s.blocks).filter(b=>b.type==='question').flatMap(b=>{const nodes=[];const visit=n=>{if(n.answer)nodes.push([n.id,n.answer]);n.children?.forEach(visit);};visit(b.content);return nodes;}).sort((a,b)=>a[0].localeCompare(b[0]));
if(JSON.stringify(answerSnapshot(before))!==JSON.stringify(answerSnapshot(project)))throw Error('Answer content changed');
fs.writeFileSync(out+'/before.json',JSON.stringify(before,null,2));
fs.writeFileSync(out+'/candidate.json',JSON.stringify(project,null,2));
fs.writeFileSync(out+'/changes.json',JSON.stringify(changes,null,2));
if(process.argv.includes('--apply')){const saved=await saveBookletProject(project,{expectedRevision:before.revision});console.log({revision:saved.revision,changes:changes.length});}else console.log({candidate:out+'/candidate.json',changes:changes.length});
