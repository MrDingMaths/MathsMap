// Authorised follow-up to the report-only sweep, 17 October 2026.
// Native fraction components, intentional scaffolds and ratio exceptions stay.
import {isDeepStrictEqual} from 'node:util';
import {documents} from './rules.mjs';
import {clozeHandwritingMm} from '../public/libs/maths-editor/house-style.mjs';

export const blocks=p=>p.sections.flatMap(s=>s.blocks??[]);
export function walk(v,fn,ancestors=[]){
 if(!v||typeof v!=='object')return;
 fn(v,ancestors);
 for(const [k,x]of Object.entries(v))if(x&&typeof x==='object'&&!['sourceReview','spec','originalDiagram','sourceAtom','provenance','classification','bankRef'].includes(k))walk(x,fn,[...ancestors,v]);
}
const BOX=String.raw`\\boxed\{\s*(?:\\vcenter\{\\hbox\{)?\\rule\{0pt\}\{[\d.]+mm\}\s*\\hspace\{([\d.]+)mm\}\s*(?:\}\})?\}`;
const boxRE=()=>new RegExp(BOX,'g');
const cleanColour=s=>s.replace(/\\(?:text)?color\{[^}]*\}/g,'');
const normalMath=s=>cleanColour(s).replace(/\\mathrel\{\\phantom\{=\}\}/g,'').replace(/\\(?:left|right)(?![a-z])/g,'').replace(boxRE(),'@BLANK@').replace(/[{}\s]/g,'');
const referenceWords=s=>s.replace(/\bempty boxes\b/g,'blanks').replace(/\b[Bb]oxes\b/g,m=>m==='Boxes'?'Blanks':'blanks');
const normalText=s=>referenceWords(s).replace(/^\s*\(?([a-z])\)\s*/,'$1 ').replace(/\s+/g,' ').trim();
const referenceValue=v=>typeof v==='string'?referenceWords(v):Array.isArray(v)?v.map(referenceValue):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,referenceValue(x)])):v;
const TERM_BLOCKS=new Set(['circle-trigonometry-v1/p20-coordinates-block','expanding-brackets-v1/p13-q6','simplifying-expressions-v1/p33-q12','simplifying-expressions-v1/p33-q13','simplifying-expressions-v1/p34-q14','solve-2-step-equations-v1/p10-q1','solve-2-step-equations-v1/p86-q9']);
function paraSignature(p){let sig=normalMath((p.inlines??[]).map(i=>i.type==='math'?i.latex:i.type==='cloze'?'@BLANK@':i.type==='break'?'\n':i.type==='text'?normalText(i.text):JSON.stringify(i)).join(''));if(p.id==='p35-q7-similarity-completion')sig=sig.replace('@BLANK@@BLANK@','@BLANK@');if(p.id==='p33-q12-g-equation')sig=sig.replace(/\\beginm?aligned|\\endaligned|&|\\\\/g,'');return sig;}
export function verifyConventions(before,after,changed){
 const errors=[];
 for(const id of changed){
  const a=blocks(before).find(b=>b.id===id),b=blocks(after).find(b=>b.id===id);
  for(const key of ['classification','bankRef','pedagogyRole','type'])if(!isDeepStrictEqual(a[key],b[key]))errors.push(id+': '+key+' changed');
  const answers=x=>{const out=[];walk(x,n=>{if(n.id&&n.answer&&typeof n.answer==='object')out.push([n.id,n.answer]);});return out.sort((a,b)=>a[0].localeCompare(b[0]));};
  const normaliseAnswers=value=>TERM_BLOCKS.has(before.id+'/'+id)?referenceValue(value):value;
  if(!isDeepStrictEqual(normaliseAnswers(answers(a)),normaliseAnswers(answers(b))))errors.push(id+': saved mathematical answer or owning identity changed');
  const paras=x=>{const out=new Map();for(const {doc}of documents(x))walk(doc,n=>{if(n.type==='paragraph'&&n.id)out.set(n.id,paraSignature(n));});return out;};
  const old=paras(a),now=paras(b);
  for(const [pid,sig]of old)if(now.get(pid)!==sig)errors.push(id+': paragraph content changed: '+pid);
  for(const [pid,sig]of now)if(!old.has(pid)&&!pid.endsWith('-embedded-shape'))errors.push(id+': unexpected new paragraph: '+pid);
  if(id==='p35-q7-block'){
   const source=find(a.content,'p35-q7-similarity-completion').inlines.filter(i=>i.type==='cloze').map(i=>i.answer).join(' ');
   const target=find(b.content,'p35-q7-similarity-completion').inlines.filter(i=>i.type==='cloze').map(i=>i.answer).join(' ');
   if(source!==target)errors.push(id+': split reason changed its expected response');
  }
 }
 return errors;
}
const find=(root,id)=>{let found;walk(root,n=>{if(n.id===id)found=n;});return found;};
const notes=b=>JSON.stringify(b.sourceReview?.intentionalDepartures??[])+' '+JSON.stringify(b.sourceReview?.authorisedFeedback??{});
function fractionContext(ancestors){
 return ancestors.some(n=>/numerator|denominator|native-fraction|fraction-slot|-num(?:-|$)|-den(?:-|$)/.test(n.id??'')||n.type==='cell'&&(n.borderBottom||n.borders?.bottom)||Array.isArray(n.blocks)&&n.blocks.some(p=>p.type==='paragraph'&&p.inlines?.some(i=>i.type==='math'&&/^\\rule\{[\d.]+mm\}\{0?\.\d+(?:mm|pt)\}$/.test(i.latex??''))));
}
const explicitBlanks={
 'p20-coordinates-a-scaffold':['45^\\circ','45^\\circ'],
 'p13-q6-e-equation':['y','1'],'p13-q6-f-equation':['2x','3y'],
 'p8-q3-c-equation':['12','30'],'p8-q3-d-equation':['14a','21b'],'p8-q3-g-equation':['2','q'],
 'p12-q15-a-equation':['7','2'],'p12-q15-b-equation':['6','7'],'p12-q15-c-equation':['7','9','5'],'p12-q15-d-equation':['8','6'],
 'p10-q1-h-equation':['19','19'],
 'p72-q1-define-unknown':['age'],'p72-q1-sam-expression':['x+4'],
 'p72-q1-equation-r1-lhs-maths':['x+4'],'p72-q1-equation-r2-lhs-maths':['2x'],
 'p72-q1-equation-r3-blank':['30'],'p72-q1-equation-r4-blank':['15'],
 'p86-q9-a-r2-lhs-maths':['2x'],'p86-q9-a-r3-lhs-maths':['2x'],'p86-q9-a-r3-rhs-maths':['4'],'p86-q9-a-r4-rhs-maths':['2'],
 'p86-q9-b-r2-rhs-maths':['4'],'p86-q9-b-r3-lhs-maths':['2x'],'p86-q9-b-r3-rhs-maths':['4'],'p86-q9-b-r4-rhs-maths':['2'],
};
const inverseOperations={b:'-10',c:'\\div3',d:'\\times5',e:'-8',f:'+4',g:'\\div9',h:'\\div(-2)',i:'\\times7',j:'\\times10',k:'\\div4',l:'\\div2'};
function blankAnswers(paragraph,owner,count){
 if(explicitBlanks[paragraph.id])return explicitBlanks[paragraph.id].map(s=>s==='age'?s:'$'+s+'$');
 const operation=/^p28-q4-([b-l])-(?:left|right)-box$/.exec(paragraph.id??'');
 if(operation)return ['$'+inverseOperations[operation[1]]+'$'];
 const short=owner?.answer?.short;
 if(count===1&&typeof short==='string'&&/^\s*\$[^$]+\$\s*[.]?$/.test(short))return [short.trim().replace(/\.$/,'')];
 return null;
}
function splitBoxes(inline,owner,ancestors,paragraph){
 const original=inline.latex;
 if(!new RegExp(BOX).test(original)||fractionContext(ancestors)||(/\\(?:[dt]?frac|cfrac|begin)|\^\s*\{?\\boxed/.test(original)&&!paragraph.id?.startsWith('p34-q14-')))return null;
 // Strip a colour-only wrapper around a blank before splitting maths islands.
 let latex=original.replace(new RegExp(String.raw`\{\\color\{[^}]*\}(`+BOX+String.raw`)\}`,'g'),'$1').replace(new RegExp(String.raw`\\color\{[^}]*\}\{(`+BOX+String.raw`)\}`,'g'),'$1').replace(/\\(?:left|right)(?![a-z])/g,'');
 for(let last='';last!==latex;){last=latex;latex=latex.replace(new RegExp(String.raw`\{(`+BOX+String.raw`)\}`,'g'),'$1');}
 const matches=[...latex.matchAll(boxRE())];
 if(!matches.length)return null;
 const answers=blankAnswers(paragraph,owner,matches.length);
 // Unmapped intermediates stay boxed for contextual review, never receive a
 // guessed final answer or an uncheckable empty native response.
 if(!answers||answers.length!==matches.length)return null;
 const pieces=[];let at=0,index=0;
 for(const m of matches){
  const prefix=latex.slice(at,m.index);
  // Do not split a math command's argument or an unbalanced group.
  const prior=latex.slice(0,m.index).replace(/\\[{}]/g,'');
  if((prior.match(/\{/g)??[]).length!==(prior.match(/\}/g)??[]).length)return null;
  if(prefix)pieces.push({...inline,latex:prefix,display:false});
  const answer=answers[index++];
  pieces.push({type:'cloze',answer,expectedResponse:answer,width:Math.max(11,Number(m[1]),clozeHandwritingMm(cleanColour(answer)))});
  at=m.index+m[0].length;
 }
 if(at<latex.length)pieces.push({...inline,latex:latex.slice(at),display:false});
 return pieces;
}

function mergeRows(table,fragments){
 // Preserve every cell object and paragraph identity, in original row order.
 for(const t of fragments){
  if(t.rows.some(r=>r.reduce((n,c)=>n+(c.colspan??1),0)!==table.widths.length))throw Error('Mismatched table columns: '+t.id);
  table.rowHeights??=table.rows.map(()=>0);
  table.rows.push(...t.rows);
  table.rowHeights.push(...(t.rowHeights??t.rows.map(()=>0)));
 }
}
function consolidateTables(project,b,record,allowedPaths){
 const root=b.content;
 if(project.id==='concept-maths-adv11-ch02'&&['p6-q31','p6-q32'].includes(b.id)){
  for(const {doc,owner,key}of documents(b)){
   if(key!=='prompt')continue;
   for(let i=0;i<doc.blocks.length-1;i++){
    const header=doc.blocks[i],body=doc.blocks[i+1];
    if(header.type!=='table'||body.type!=='table'||!header.id.endsWith('table-header')||header.widths.length!==body.widths.length)continue;
    mergeRows(header,[body]);doc.blocks.splice(i+1,1);
    for(const overrides of [project.settings?.layoutOverrides,b.presentation?.layoutOverrides]){
     const entry=overrides?.blockLayouts?.[b.id];if(!entry)continue;
     walk(entry.arrangement,n=>{if(n.children)n.children=n.children.filter(c=>c.ref!==owner.id+'/prompt#'+body.id);});
    }
    if(project.settings?.layoutOverrides?.blockLayouts?.[b.id])allowedPaths.push('/settings/layoutOverrides/blockLayouts/'+b.id);
    record(b,'tables',owner.id,'Consolidate the split header and data rows into one native table; preserve all cells and givens.');
   }
  }
 }
 if(project.id==='factorising-expressions-v1'&&b.id==='p13-q5-block'){
  let merged=false;
  for(const side of ['left','right']){
   const owner=find(root,'p13-q5-'+side+'-table'),header=owner.prompt.blocks.find(n=>n.type==='table');
   if(header?.rows.length===7&&owner.children.every(n=>!n.prompt?.blocks?.length))continue;
   const fragments=owner.children.map(n=>n.prompt.blocks.find(n=>n.type==='table'));
   if(fragments.length!==6||fragments.some(n=>!n||n.rows.length!==1))throw Error('Unexpected factorising table');
   mergeRows(header,fragments);
   for(const child of owner.children){child.prompt.blocks=[];child.responseSpace='scaffold';child.answerSpaceMm=0;}
   for(const overrides of [project.settings?.layoutOverrides,b.presentation?.layoutOverrides]){
    const entry=overrides?.blockLayouts?.[b.id];if(!entry)continue;
    const stack=find(entry.arrangement,'p13-q5-'+side+'-stack');
    if(!stack)throw Error('Missing factorising table arrangement');
    stack.children=stack.children.filter(n=>n.ref===owner.id+'/prompt');
   }
   record(b,'tables',owner.id,'Consolidate all six '+side+' table rows with their header, retaining both tables, response cells and stable answer owners.');
   merged=true;
  }
  if(merged)allowedPaths.push('/settings/layoutOverrides/blockLayouts/'+b.id);
 }
 if(project.id==='area-parallelograms-triangles-v1'&&['p12-q23','p45-q4'].includes(b.id)){
  const table=root.prompt.blocks.find(n=>n.type==='table'),parts=root.children;
  if(b.flow?.tableOnly&&b.flow?.tableContinuation?.tableId===table?.id&&parts.every(n=>!n.prompt?.blocks?.length))return;
  const fragments=parts.map(n=>n.prompt.blocks.find(n=>n.type==='table'));
  if(fragments.some(n=>!n||n.rows.length!==1))throw Error('Unexpected area response rows');
  if(b.id==='p12-q23'){
   if(parts.length!==6||root.questionDiagrams.length!==6)throw Error('Missing area figure row');
   b.sourceReview??={};b.sourceReview.embeddedQuestionDiagrams=structuredClone(root.questionDiagrams);
   for(let i=0;i<fragments.length;i++){
    const d=root.questionDiagrams[i];
    // The native cell now supplies the original structural outer frame.
    const code=d.code.replace(/^\\draw\[tableBorder[^\n]*\n/m,'');
    fragments[i].rows[0].unshift({id:d.id+'-native-cell',type:'cell',align:'center',verticalAlign:'middle',blocks:[{id:d.id+'-embedded-shape',type:'paragraph',align:'center',inlines:[{type:'text',text:'[tikz]% mathsmap-inline-width-mm 51\n'+code+'[/tikz]'}]}]});
   }
   root.questionDiagrams=[];
  }
  mergeRows(table,fragments);
  for(const child of parts){child.prompt.blocks=[];child.responseSpace='scaffold';child.answerSpaceMm=0;}
  b.flow={...b.flow,tableOnly:true,tableContinuation:{tableId:table.id,headerRows:b.id==='p12-q23'?1:2,rowPartIds:parts.map(n=>n.id)}};
  for(const overrides of [project.settings?.layoutOverrides,b.presentation?.layoutOverrides])if(overrides?.blockLayouts?.[b.id])delete overrides.blockLayouts[b.id];
  allowedPaths.push('/settings/layoutOverrides/blockLayouts/'+b.id);
  record(b,'tables',root.id,'Combine the header, every figure/data row and all response cells into one native table, with stable row ownership and repeated headers on continuation pages.');
 }
}

export function repairConventions(before){
 const project=structuredClone(before),repairs=[],allowedPaths=[];
 const record=(b,rule,target,detail)=>repairs.push({blockId:b.id,rule,target,action:'fix',detail});
 for(const b of blocks(project)){
  const exception=/for this question only|(?:user|teacher)[^.]*\b(?:keep|retain)[^.]*\bbox/i.test(notes(b));
  for(const {doc,owner,key}of documents(b))walk(doc,(n,ancestors)=>{
   if(n.type!=='paragraph'||!n.inlines)return;
   if(!exception&&!['short','worked'].includes(key)){
    if(n.id==='p33-q12-g-equation'&&n.inlines.length===1){
     const match=/^\\begin\{aligned\}&([\s\S]*?)\\\\&=([\s\S]*?)\\end\{aligned\}$/.exec(n.inlines[0].latex??'');
     if(match){n.inlines=[{type:'math',latex:match[1],display:false},{type:'break'},{type:'math',latex:'='+match[2],display:false}];record(b,'cloze',owner.id,'Keep the two equation lines and equals gutter while exposing the ordinary response blank as a native cloze.');}
    }
    const out=[];let count=0;
    for(const inline of n.inlines){const parts=inline.type==='math'?splitBoxes(inline,owner,[...ancestors,n],n):null;if(parts){out.push(...parts);count+=parts.filter(p=>p.type==='cloze').length;}else out.push(inline);}
    if(count){n.inlines=out;record(b,'cloze',owner?.id??b.id,'Convert '+count+' ordinary box blanks to native dotted clozes in '+n.id+'; preserve fraction scaffolds.');}
   }
   if(['bivariate-data-analysis-v1','concept-maths-x11-ch01','enrichment-maths-1-part3-20261008'].includes(project.id)){
    const first=n.inlines.find(i=>i.type==='text'&&i.text.trim());
    const match=first&&/^\s*\(?([a-z])\)\s*(.*)$/s.exec(first.text);
    if(match){
     const index=n.inlines.indexOf(first),choice=false; // These are matching labels, not multiple-choice letters.
     n.inlines.splice(index,1,{...first,text:choice?match[1].toUpperCase():match[1],marks:[...new Set([...(first.marks??[]),'bold'])]},...(match[2]?[{...first,text:' '+match[2]}]:[{type:'text',text:' '}]));
     record(b,'labels',owner?.id??b.id,'Format '+(choice?'multiple-choice option ':'part label ')+match[1]+' in '+n.id+'.');
    }
   }
  });
  if(project.id==='circle-geometry-v1'&&b.id==='p35-q7-block'){
   const para=find(b.content,'p35-q7-similarity-completion'),blank=para.inlines.find(i=>i.type==='cloze');
   const parts=['Two angles of one triangle equal','two angles of the other triangle.'];
   if(para.inlines.filter(i=>i.type==='cloze').length===1){
    if(parts.join(' ')!==blank.answer)throw Error('Similarity reason changed; reinspect');
    para.inlines.splice(para.inlines.indexOf(blank),1,{...blank,answer:parts[0],expectedResponse:parts[0],width:70,lines:1},{type:'break'},{...blank,answer:parts[1],expectedResponse:parts[1],width:70,lines:1});
    record(b,'cloze',b.content.id,'Give the sentence-length similarity reason two 70 mm writing lines, with its parentheses on those lines; preserve the complete expected response.');
   }
   // Reflow the supplied ratios beside the corresponding paired figures so
   // the required reason space does not push the following proof onto a page.
   let reflowed=false;
   for(const overrides of [project.settings?.layoutOverrides,b.presentation?.layoutOverrides]){
    const entry=overrides?.blockLayouts?.[b.id],root=entry?.arrangement?.root;
    if(!root||find(root,'p35-q7-figures-and-ratios-row'))continue;
    const pair=find(root,'p35-q7-pair-item'),ratios=find(root,'p35-q7-ratios-item'),result=find(root,'p35-q7-result-item');
    if(!pair||!ratios||!result)throw Error('Proof arrangement changed; reinspect');
    pair.width=110;
    const index=root.children.indexOf(pair);
    root.children=root.children.filter(n=>n!==ratios&&n!==result);
    root.children.splice(index,1,{id:'p35-q7-figures-and-ratios-row',type:'group',direction:'row',gap:4,verticalAlign:'middle',children:[pair,{id:'p35-q7-ratios-and-result-stack',type:'group',direction:'stack',gap:3,width:59,children:[ratios,result]}]});
    reflowed=true;
   }
   if(reflowed){find(b.content,'p35-q7-paired-triangles').widthMm=110;allowedPaths.push('/settings/layoutOverrides/blockLayouts/'+b.id);record(b,'layout',b.id,'Place the paired triangles beside their supplied ratios to retain adequate reason-writing capacity without an extra page; preserve geometry, labels and standard final-size typography.');}
  }
  if(project.id==='negative-indices-v1'&&b.id==='p19-q3'){
   const owner=find(b.content,'p19-q3-a'),doc=owner.prompt,given=doc.blocks[0],table=doc.blocks[1];
   if(given.id==='p19-q3-a-given'){
    if(table.id!=='p19-q3-a-scaffold')throw Error('Negative-indices scaffold changed; reinspect');
    table.rows.unshift([{id:given.id+'-gutter-cell',type:'cell',align:'right',verticalAlign:'middle',blocks:[]},{id:given.id+'-expression-cell',type:'cell',align:'left',verticalAlign:'middle',blocks:[given]}]);
    if(table.rowHeights)table.rowHeights.unshift(0);
    doc.blocks.shift();
    record(b,'gutter',owner.id,'Put the opening expression in the scaffold right-hand-side column, above its working; retain the separate relation-sign column.');
   }
  }
  if(project.id==='significant-figures-and-scientific-notation-v1'){
   if(b.id==='p5-example-group')for(const e of b.examples??[]){
    const old=e.theorySolution;
    e.theorySolution=old.replace(/\\begin\{aligned\}([\s\S]*?)&\\\\&=/,String.raw`\begin{aligned}&\mathrel{\phantom{=}}$1\\&=`);
    if(old!==e.theorySolution)record(b,'gutter',e.id,'Place the opening calculation above the right-hand sides with a standard equals gutter.');
   }
   if(b.id==='p18-examples')for(const e of b.examples??[]){
    if(e.equationAlignment?.mode==='continuation'&&e.prompt.includes('\\mathrel{\\phantom{=}}'))continue;
    e.equationAlignment={mode:'continuation'};
    // The instruction and expression share this legacy prompt. The combined
    // alignment display accepts maths-only fields, so encode its gutter too.
    e.prompt=e.prompt.replace(/\$([^$]+)\$$/,(_,math)=>'$\\mathrel{\\phantom{=}}'+math+'$');
    record(b,'gutter',e.id,'Align the separate opening expression with its continuation using the standard gutter and equationAlignment.');
   }
  }
  consolidateTables(project,b,record,allowedPaths);
  if(TERM_BLOCKS.has(project.id+'/'+b.id)){
   let updated=false;
   walk({content:b.content,examples:b.examples},n=>{for(const [key,value]of Object.entries(n))if(['prompt','short','worked','text','theorySolution'].includes(key)&&typeof value==='string'){
    const next=referenceWords(value);if(next!==value){n[key]=next;updated=true;}
   }});
   if(updated)record(b,'wording',b.id,'Update boxes to blanks where ordinary response boxes became dotted clozes; retain the same instructions and mathematical answers.');
  }
 }
 const old=new Map(blocks(before).map(b=>[b.id,b]));
 const changed=blocks(project).filter(b=>!isDeepStrictEqual(old.get(b.id),b)).map(b=>b.id);
 for(const b of blocks(project).filter(b=>changed.includes(b.id))){b.sourceReview??={};b.sourceReview.feedbackRepairs??=[];b.sourceReview.feedbackRepairs.push({date:'2026-10-17',note:'Pre-review convention follow-up: '+repairs.filter(r=>r.blockId===b.id).map(r=>r.detail).join(' ')});}
 return {project,repairs,changed,allowedPaths};
}

