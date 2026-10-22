// Pre-review sweep rules. Each rule maps to a convention the teacher has
// already set for every booklet (AGENTS.md, docs/booklet-standing-conventions.md,
// docs/booklet-transcription-feedback-checklist.md, the first-pass reviewer
// contract). A rule either fixes a block in place (presentation only: no text,
// mathematics, answer or skill mapping changes) or reports it for the teacher.
import {isDeepStrictEqual} from 'node:util';
import {missingEqualsGutter,startsWithRelation,bareExpression,manualGutter} from '../scripts/booklet/check-equals-gutter.mjs';
import {restartedPartLabels} from '../scripts/booklet/check-part-label-sequence.mjs';
import {dormantAlignment} from '../scripts/booklet/check-dormant-alignment.mjs';
import {repairExampleGutters} from '../scripts/content/example-gutters.mjs';
import {fromSource} from '../src/lib/document-content.js';
import {clozeHandwritingMm} from '../public/libs/maths-editor/house-style.mjs';
import {fractionConvention} from '../src/lib/booklet-cloze-convention.js';
import {teachingLabels,usesTeachingLetters} from '../src/lib/booklet-labels.js';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';

export const SWEEP_DATE='2026-10-17';
const SKIP=new Set(['sourceReview','sourceLayoutEvidence','sourceAtom','provenance','spec','originalDiagram','questionDiagrams','solutionDiagrams','classification','bankRef']);
const PHANTOM='\\mathrel{\\phantom{=}}';
const blocksOf=project=>(project.sections??[]).flatMap(section=>section.blocks??[]);
const isDoc=v=>v&&typeof v==='object'&&v.format==='maths-editor-document-v1'&&Array.isArray(v.blocks);
const keyIdeas=block=>[block?.sourceAtom?.kind,block?.pedagogyRole,block?.variant].includes('key-ideas');

// Every native document in a block's printable content, with the node that owns it.
export function documents(block){
 const out=[];
 const walk=(node,owner,key)=>{
  if(!node||typeof node!=='object')return;
  if(Array.isArray(node)){node.forEach(child=>walk(child,owner,key));return;}
  if(isDoc(node)){out.push({doc:node,owner,key});}
  const next=typeof node.id==='string'&&!isDoc(node)&&node.type!=='paragraph'&&node.type!=='table'&&node.type!=='cell'?node:owner;
  for(const [k,child] of Object.entries(node))if(!SKIP.has(k)&&child&&typeof child==='object')walk(child,next,k);
 };
 walk({content:block.content,examples:block.examples},block,'');
 return out;
}
// Every node (paragraph, table, cell, inline) inside a document, depth first.
function nodes(value,visit,parent=null){
 if(!value||typeof value!=='object')return;
 if(Array.isArray(value)){value.forEach(child=>nodes(child,visit,parent));return;}
 visit(value,parent);
 for(const [k,child] of Object.entries(value))if(!SKIP.has(k)&&child&&typeof child==='object')nodes(child,visit,value);
}
const notes=block=>[...(block.sourceReview?.intentionalDepartures??[]),block.sourceReview?.authorisedFeedback?.note,...(block.sourceReview?.feedbackRepairs??[]).map(r=>r?.note)].filter(n=>typeof n==='string'&&!n.startsWith('Pre-review sweep'));

// ---------------------------------------------------------------- gutter
// Lines of working: consecutive paragraphs of one document, and paragraphs
// stacked in one column of a borderless scaffold table (one paragraph per cell).
const ENV=/^\s*(?:\\begin\{(?:aligned|align\*?|alignedat|array)\}(?:\{[^}]*\})?\s*)?&?\s*/;
const relationFirst=inline=>inline?.type==='math'&&startsWithRelation(String(inline.latex??'').replace(ENV,''));
const mathOnly=paragraph=>paragraph?.type==='paragraph'&&paragraph.inlines?.length>0&&paragraph.inlines.every(i=>i.type==='math'||i.type==='text'&&!String(i.text).trim());
const opening=paragraph=>paragraph.inlines.filter(i=>i.type==='math').map(i=>i.latex??'').join('');
function gutterPairs(doc){
 const pairs=[];
 const look=(list,shown)=>{
  for(let i=0;i<list.length-1;i++){
   const a=list[i],b=list[i+1];
   if(!mathOnly(a.paragraph)||b.paragraph?.type!=='paragraph'||!relationFirst(b.paragraph.inlines?.find(x=>x.type!=='text'||String(x.text).trim())))continue;
   const first=opening(a.paragraph);
   // An arrow or operation between rows of a scaffold opens nothing.
   if(/\\\\/.test(first)||!bareExpression(first)||!/[0-9a-zA-Z]/.test(first.replace(/\\[a-zA-Z]+/g,'')))continue;
   pairs.push({first:a,second:b,align:[a.align,b.align],manual:manualGutter(first)});
  }
 };
 nodes(doc,node=>{
  if(Array.isArray(node.blocks)&&node.type!=='cell'){
   // Paragraph runs (a borderless scaffold table may continue the run).
   const list=[];
   for(const block of node.blocks){
    if(block.type==='paragraph'){list.push({paragraph:block,align:block.align??'left'});continue;}
    if(block.type==='table'&&block.border===false&&list.length){const cell=block.rows?.[0]?.find(c=>c?.blocks?.length);if(cell?.blocks[0]?.type==='paragraph')list.push({paragraph:cell.blocks[0],align:cell.preserveParagraphAlignment?cell.blocks[0].align??'left':cell.align??'center'});}
    look(list,null);list.length=0;
   }
   look(list,null);
  }
  if(node.type==='table'&&Array.isArray(node.rows)){
   const columns=Math.max(0,...node.rows.map(r=>r.length));
   for(let c=0;c<columns;c++){
    const list=[];
    for(const row of node.rows){
     const cell=row[c];
     if(cell?.blocks?.length===1&&cell.blocks[0].type==='paragraph'&&(cell.colspan??1)===1)list.push({paragraph:cell.blocks[0],align:cell.preserveParagraphAlignment?cell.blocks[0].align??'left':cell.align??'center'});
     else {look(list);list.length=0;}
    }
    look(list);
   }
  }
 });
 // A pair can be found twice (a table run seen as a paragraph run); keep one.
 return pairs.filter((pair,i)=>pairs.findIndex(other=>other.first.paragraph===pair.first.paragraph)===i);
}
const GUTTER_FIELDS=['prompt','short','worked','theorySolution','solution_text','question_text'];
function gutterRule(block,{fix,report}){
 const exception=notes(block).find(n=>/gutter|equals.sign|relation.sign/i.test(n));
 const out=[];
 // Native documents: separate lines.
 for(const {doc,owner} of documents(block))for(const pair of gutterPairs(doc)){
  const left=pair.align.every(a=>a==='left');
  const target=owner?.id??block.id,first=opening(pair.first.paragraph);
  if(!left||pair.manual||exception){out.push(report('gutter',target,(left?pair.manual?'manual spacing before the opening expression':'local exception: '+exception:'working is '+pair.align.join('/'))+': '+first.slice(0,60)));continue;}
  if(fix){const math=pair.first.paragraph.inlines.find(i=>i.type==='math');math.latex=PHANTOM+math.latex;}
  out.push({rule:'gutter',target,action:'fix',detail:first.slice(0,80)});
 }
 // Rows of one aligned equation, and legacy source strings.
 const visit=(node,owner)=>{
  if(!node||typeof node!=='object')return;
  if(Array.isArray(node)){node.forEach(child=>visit(child,owner));return;}
  const next=typeof node.id==='string'&&node.type!=='paragraph'?node:owner;
  for(const [key,value] of Object.entries(node)){
   if(SKIP.has(key))continue;
   const native=node.type==='math'&&key==='latex';
   if(typeof value==='string'&&(native?/\\\\/.test(value):GUTTER_FIELDS.includes(key)&&value.includes('$'))){
    const doc=native?{blocks:[{type:'paragraph',inlines:[{type:'math',latex:value}]}]}:fromSource(value);
    const hits=missingEqualsGutter(doc).filter(h=>native?h.shape==='rows':true);
    if(!hits.length)continue;
    const target=next?.id??block.id;
    if(hits.some(h=>h.needs!=='gutter')||exception){for(const h of hits)out.push(report('gutter',target,(exception?'local exception: '+exception:h.detail)+': '+h.first.slice(0,60)));continue;}
    let result;
    try{result=repairExampleGutters({question_text:'',solution_text:native?'$'+value+'$':value});}
    catch(error){out.push(report('gutter',target,'not repaired automatically ('+error.message.slice(0,60)+'): '+hits[0].first.slice(0,60)));continue;}
    if(!result.operations.length)continue;
    if(fix)node[key]=native?result.example.solution_text.slice(1,-1):result.example.solution_text;
    for(const h of hits)out.push({rule:'gutter',target,action:'fix',detail:h.first.slice(0,80)});
   }else if(value&&typeof value==='object')visit(value,next);
  }
 };
 visit({content:block.content,examples:block.examples},block);
 // Example prompts answered in a separate solution need equationAlignment.
 for(const h of missingEqualsGutter({examples:block.examples??[]}).filter(h=>h.shape==='solution'))out.push(report('gutter',h.owner||block.id,'example prompt and separate solution have no equationAlignment: '+h.first.slice(0,60)));
 return out;
}

// ---------------------------------------------------------------- clozes
const BOX=/\\boxed\{\s*\\rule\{0pt\}\{[\d.]+mm\}\s*\\hspace\{[\d.]+mm\}\s*\}/g;
const DOTS=/\\(?:ldots|cdots|dots|dotfill)|\\mathord\{\\ldotp|\\underline\{\\hspace/;
const PHANTOM_BOX=new RegExp('\\\\phantom\\{\\s*'+BOX.source+'\\s*\\}','g'),SIZED_DOTS=/\\underline\{\\hspace\{[\d.]+mm\}\}/g;
// Split a \frac's numerator and denominator (balanced braces).
function fracs(latex){
 const out=[],pattern=/\\(?:dfrac|tfrac|frac)\b/g;let match;
 while((match=pattern.exec(latex))){
  const at=match.index;
  let i=at+match[0].length;const parts=[];
  for(let k=0;k<2;k++){while(latex[i]===' ')i++;if(latex[i]!=='{')break;let depth=0,j=i;for(;j<latex.length;j++){if(latex[j]==='\\'){j++;continue;}if(latex[j]==='{')depth++;if(latex[j]==='}'&&!--depth)break;}parts.push(latex.slice(i+1,j));i=j+1;}
  if(parts.length===2)out.push({start:at,end:i,num:parts[0],den:parts[1]});
 }
 return out;
}
const blank=s=>{const t=s.replace(/\\rule\{0pt\}\{[\d.]+mm\}/g,'').trim();return /^\\boxed\{\s*\\hspace\{[\d.]+mm\}\s*\}$/.test(t.replace(/\\rule\{0pt\}\{[\d.]+mm\}/g,''))||DOTS.test(t)&&!/[0-9a-zA-Z]/.test(t.replace(/\\[a-zA-Z]+/g,''));};
function clozeRule(block,{fix,report}){
 // Most recorded notes describe conversions to the same conventions. Only a
 // local instruction to keep a box or dots, or a decision limited to this
 // question, holds the block back.
 const out=[],exception=notes(block).find(n=>/for this question only|(?:user|teacher)[^.]*\b(?:keep|retain)[^.]*\b(?:box|dots|cloze)|(?:keep|retain)s? (?:the )?(?:outlined )?box(?:es)? (?:at|by|on) (?:user|teacher)/i.test(n));
 const groups=new Map();
 for(const {doc,owner} of documents(block)){
  const inAnswer=owner&&owner!==block&&false;
  nodes(doc,(node,parent)=>{
   // Bordered tables hide cloze dots unless a table forces them back on.
   if(node.type==='table'&&node.border!==false&&node.showClozeDots){
    let has=false;nodes(node.rows,n=>{if(n.type==='cloze')has=true;});
    if(has){if(exception)out.push(report('cloze',owner?.id??block.id,'table shows cloze dots in its cells; local exception: '+exception));else{if(fix)delete node.showClozeDots;out.push({rule:'cloze',target:owner?.id??block.id,action:'fix',detail:'remove dots from bordered table cells ('+node.id+')'});}}
   }
   if(node.type==='table'&&Array.isArray(node.annotations)){
    const circled=new Set(node.annotations.filter(a=>a.type==='circle').map(a=>a.cellId));
    for(const cell of node.rows.flat())if(circled.has(cell?.id)&&JSON.stringify(cell.blocks??[]).includes('"type":"cloze"')&&(node.border===false||node.showClozeDots))out.push(report('cloze',owner?.id??block.id,'comparison circle '+cell.id+' carries cloze dots'));
   }
   if(node.type==='paragraph'&&node.inlines?.some(i=>i.type==='cloze')&&node.inlines.some(i=>i.type==='math'&&i.display))out.push(report('cloze',owner?.id??block.id,'cloze beside a display equation in '+node.id));
   if(node.type==='math'&&typeof node.latex==='string'){
    const target=owner?.id??block.id;
    // The fraction decisions live in src/lib/booklet-cloze-convention.js (22 October 2026): numerator and
    // denominator boxes stay (a full scaffold keeps both boxes and the vinculum), a blank inside
    // parentheses in a component is empty space with no box and no dots, dotted or invisible
    // components become boxes. Anything fixable is fixed; the rest is reported.
    const convention=fractionConvention(node.latex);
    const fixable=convention.issues.filter(i=>i.fixable),stuck=convention.issues.filter(i=>!i.fixable);
    if(fixable.length){
     if(exception)for(const i of fixable)out.push(report('cloze',target,i.detail+'; local exception: '+exception));
     else{if(fix)node.latex=convention.latex;out.push({rule:'cloze',target,action:'fix',detail:[...new Set(fixable.map(i=>i.kind))].join(', ')+': '+node.latex.slice(0,60)});}
    }
    for(const i of stuck)out.push(report('cloze',target,i.detail+': '+node.latex.slice(0,60)));
    const latex=convention.latex,frac=fracs(latex);
    // Boxes outside fractions and powers are blanks inside an equation. An invisible \phantom box is not one.
    let stripped=latex.split('').map((c,i)=>frac.some(f=>i>=f.start&&i<f.end)?' ':c).join('');
    stripped=stripped.replace(/\^\{?\\boxed\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\}?/g,'').replace(new RegExp('\\\\phantom\\{\\s*'+BOX.source+'\\s*\\}','g'),'');
    const boxes=(stripped.match(BOX)??[]).length;
    if(boxes&&!/\^\s*$/.test(stripped))out.push(report('cloze',target,boxes+' outlined box blank'+(boxes===1?'':'s')+' inside an equation (dots expected): '+latex.slice(0,60)));
   }
   if(node.type==='paragraph'){
    const ix=node.inlines??[],rule=ix.findIndex(i=>i.type==='math'&&/^\\rule\{[\d.]+mm\}\{0?\.\d+(?:mm|pt)\}$/.test(String(i.latex).trim()));
    if(rule>=0&&ix.length===1&&parent)out.push(report('cloze',owner?.id??block.id,'fraction bar drawn as a separate rule ('+node.id+'); check the blanks above and below it'));
   }
   if(node.type==='cloze'){
    const expected=node.expectedResponse||node.answer;
    if(!expected||(node.lines??1)>1)return;
    const key=(owner&&owner!==block?topQuestion(block,owner):block.content?.id)??block.id;
    if(!groups.has(key))groups.set(key,[]);
    const single=parent?.type==='paragraph'&&parent.inlines.filter(i=>i.type==='cloze').length===1;
    const besideText=parent?.type==='paragraph'&&parent.inlines.some(i=>i.type==='text'&&String(i.text).trim());
    groups.get(key).push({node,owner,single,required:clozeHandwritingMm(expected),room:parent?.type==='paragraph'?cellRoom(doc,parent):null,
     besideText,explicitLines:parent?.type==='paragraph'&&parent.inlines.some(i=>i.type==='break'),besideMath:parent?.type==='paragraph'&&parent.inlines.some(i=>i.type==='math')});
   }
  });
 }
 // One size per question for parallel answers: single blanks (one per line)
 // whose answers are of similar length (within 1.6 times of the shortest in
 // their run) share the widest of them, growing by at most 10 mm. A word
 // among numbers ("180", "angle sum of a triangle") keeps its own size. The
 // blanks of one scaffold line (amount, rate, exponent) hold different things
 // and are each sized for their own answer, so the line does not wrap.
 for(const [key,list] of groups){
  const sorted=[...new Set(list.filter(x=>x.single).map(x=>x.required))].sort((a,b)=>a-b),size=new Map();
  for(let i=0;i<sorted.length;){let j=i;while(j+1<sorted.length&&sorted[j+1]<=1.6*sorted[i])j++;for(let k=i;k<=j;k++)size.set(sorted[k],sorted[j]);i=j+1;}
  const perPart=sorted.length>1&&size.get(sorted[0])!==sorted.at(-1);
  for(const item of list){
   const shared=item.single?size.get(item.required):item.required;
   const target=shared-item.required>10?item.required:shared;
   const width=Number(item.node.width)||24;
   if(Math.abs(width-target)<4)continue;
   const id=item.owner?.id??block.id;
   if(exception){out.push(report('cloze',id,'cloze '+width+' mm, rule gives '+target+' mm; local exception: '+exception));continue;}
   // A measured response split over explicit lines may keep equal line widths.
   if(item.explicitLines&&width>=item.required){out.push(report('cloze',id,'cloze '+width+' mm already fits its answer on explicit response lines; preserve measured line widths'));continue;}
   // Growing an inline prose blank can push words that fitted onto a new line.
   // Without measured line capacity, leave the increase for the teacher.
   if(target>width&&item.besideText){out.push(report('cloze',id,'cloze '+width+' mm needs '+target+' mm beside text; check line capacity before widening'));continue;}
   if(target>width&&item.room!=null&&item.besideMath&&width>=item.required){out.push(report('cloze',id,'cloze '+width+' mm already fits its answer; shared '+target+' mm size beside maths in a table needs a line-capacity check'));continue;}
   if(target>width&&item.room!=null&&target+2>item.room){out.push(report('cloze',id,'cloze in a '+Math.round(item.room)+' mm table column is '+width+' mm but the answer needs '+target+' mm'));continue;}
   if(fix)item.node.width=target;
   out.push({rule:'cloze',target:id,action:'fix',detail:'width '+width+' → '+target+' mm'+(perPart?' (mixed lengths)':'')});
  }
 }
 return out;
}
function topQuestion(block,owner){
 // The question a node belongs to: the block's content root, or for a group of
 // separately numbered questions, the child that holds the node.
 const root=block.content;if(!root)return null;
 if(root.label&&/^\d+$/.test(String(root.label)))return root.id;
 for(const child of root.children??[]){if(child===owner)return child.id;let found=false;nodes(child,n=>{if(n===owner)found=true;});if(found&&/^\d+$/.test(String(child.label??'')))return child.id;}
 return root.id;
}
// The printed width of the table column holding a paragraph, or null outside tables.
function cellRoom(doc,paragraph){
 let room=null;
 nodes(doc,table=>{
  if(table.type!=='table'||room!=null)return;
  for(const row of table.rows??[]){
   let column=0;
   for(const cell of row){
    const span=cell.colspan??1;
    if(cell.blocks?.includes(paragraph)){const widths=(table.widths??[]).map(Number),total=widths.reduce((a,b)=>a+b,0)||1;room=widths.slice(column,column+span).reduce((a,b)=>a+b,0)/total*(table.widthMm??170)-2*(table.padding??1);}
    column+=span;
   }
  }
 });
 return room;
}

// ---------------------------------------------------------------- labels
function labelRules(project,{fix,report}){
 const out=[],all=blocksOf(project),labels=teachingLabels(all),byKey=new Map();
 for(const block of all){
  if(!usesTeachingLetters(block)||block.type!=='question'&&block.type!=='worked-example')continue;
  const key=block.sourceAtom?.id??block.id;if(!byKey.has(key))byKey.set(key,[]);byKey.get(key).push(block);
 }
 for(const [key,list] of byKey){
  const lettered=[];
  for(const block of list){
   const visit=node=>{if(!node)return;if(labels[node.id])lettered.push({block,node,label:labels[node.id]});node.children?.forEach(visit);};
   visit(block.content);
   for(const example of block.examples??[])if(labels[example.id])lettered.push({block,node:example,label:labels[example.id]});
  }
  if(lettered.length!==1||lettered[0].label!=='a')continue;
  const {block,node}=lettered[0];
  const kind=block.type==='worked-example'?'worked example':block.sourceAtom?.kind??block.pedagogyRole??block.variant;
  const exception=notes(block).find(n=>/part label|lone|letter|relabel/i.test(n));
  // Only investigations and worked examples lose a lone letter automatically;
  // guided practice, identify and other activities are reported.
  const automatic=block.type==='worked-example'||['investigation','example','worked-example'].includes(block.sourceAtom?.kind??block.pedagogyRole??block.variant);
  if(exception||!automatic||(block.examples??[]).includes(node)){out.push(report('labels',block.id,'lone "a" on '+kind+(exception?'; local exception: '+exception:'')));continue;}
  if(fix){
   block.presentation={...block.presentation,sourceResponseLabels:true};
   block.sourceReview??={};block.sourceReview.responses??=[];
   let row=block.sourceReview.responses.find(r=>r.targetId===node.id);
   if(!row){row={targetId:node.id,kind:'none'};block.sourceReview.responses.push(row);}
   row.label='';
  }
  out.push({rule:'labels',target:node.id,blockId:block.id,action:'fix',detail:'remove lone "a" on '+kind});
 }
 // Key Ideas are numbered from 1, continuing across a continued block.
 let carried=new Map();
 for(const block of all){
  if(!keyIdeas(block)||!block.content)continue;
  const statements=(block.content.children?.length?block.content.children:[]).filter(c=>String(c.label??'').trim());
  if(!statements.length){if(/^[a-z]$/.test(String(block.content.label??'')))out.push(report('labels',block.id,'Key Ideas statement labelled "'+block.content.label+'"'));continue;}
  const from=block.flow?.continuationOf??block.continuationOf,start=(from&&carried.get(from))??0;
  const want=statements.map((_,i)=>String(start+i+1));
  carried.set(block.id,start+statements.length);
  const have=statements.map(c=>String(c.label).replace(/\.$/,''));
  if(isDeepStrictEqual(have,want))continue;
  const exception=notes(block).find(n=>/key idea|number/i.test(n));
  if(exception){out.push(report('labels',block.id,'Key Ideas numbered '+have.join(',')+'; local exception: '+exception));continue;}
  if(fix)statements.forEach((c,i)=>{c.label=want[i];});
  out.push({rule:'labels',target:block.id,action:'fix',detail:'Key Ideas '+have.join(',')+' → '+want.join(',')});
 }
 // Part labels typed into the content ("a)", "(b)") instead of the renderer's
 // bold label without a bracket.
 for(const block of all)for(const {doc,owner} of documents(block))nodes(doc,node=>{
  if(node.type!=='paragraph'||!node.inlines?.length)return;
  const text=node.inlines.filter(i=>i.type==='text').map(i=>i.text).join('').trim(),other=node.inlines.some(i=>i.type!=='text');
  const match=/^\(?([a-z]|i{1,3}|iv|vi{0,3}|ix)\)\s*(.*)$/.exec(text);
  if(!match||other&&!match[2]&&false)return;
  if(!match[2]&&!other){
   const exception=notes(block).find(n=>/part label|lone|letter|relabel/i.test(n));
   if(exception){out.push(report('labels',owner?.id??block.id,'typed label "'+text+'"; local exception: '+exception));return;}
   if(fix){const first=node.inlines.find(i=>i.type==='text'&&i.text.trim());node.inlines=[{...first,text:match[1],marks:[...new Set([...(first.marks??[]),'bold'])]}];}
   out.push({rule:'labels',target:owner?.id??block.id,blockId:block.id,action:'fix',detail:'typed label "'+text+'" → bold "'+match[1]+'"'});
  }else out.push(report('labels',owner?.id??block.id,'text starts with a typed part label: "'+text.slice(0,40)+'"'));
 });
 return out;
}

// ---------------------------------------------------------------- empty space
const emptyParagraph=p=>p?.type==='paragraph'&&!(p.inlines??[]).some(i=>i.type!=='text'&&i.type!=='break'||i.type==='text'&&String(i.text).trim());
function emptyRule(project,block,{fix,report}){
 const out=[];
 // Empty paragraphs leading or trailing a question prompt print as blank
 // space nobody can select. Blank lines inside a prompt or a worked solution
 // separate steps and stay.
 for(const {doc,owner,key} of documents(block)){
  if(key!=='prompt'||doc.blocks.length<2)continue;
  let start=0,end=doc.blocks.length;
  while(start<end&&emptyParagraph(doc.blocks[start]))start++;
  while(end>start&&emptyParagraph(doc.blocks[end-1]))end--;
  const keep=doc.blocks.slice(start,end);
  const removed=doc.blocks.length-keep.length;
  if(!removed||!keep.length)continue;
  if(fix)doc.blocks=keep;
  out.push({rule:'empty',target:owner?.id??block.id,action:'fix',detail:'remove '+removed+' empty paragraph'+(removed===1?'':'s')});
 }
 // Empty answer groups under a completed table (repair-tables.mjs).
 const c=block.content;
 if(c?.children?.length&&!block.flow?.tableOnly&&docTable(c.prompt)){
  const emptyLeaf=n=>!n.children?.length&&!textOf(n.prompt).trim()&&!n.questionDiagrams?.length&&!String(n.label??'').trim()&&n.responseSpace==='scaffold';
  if(!c.answer&&c.children.every(emptyLeaf)){
   if(fix){block.flow={...block.flow,tableOnly:true};c.responseSpace='scaffold';c.answerSpaceMm=0;delete project.settings?.layoutOverrides?.blockLayouts?.[block.id];delete block.presentation?.layoutOverrides?.blockLayouts?.[block.id];}
   out.push({rule:'empty',target:block.id,action:'fix',detail:'suppress '+c.children.length+' empty answer groups under the completed table'});
  }
 }
 // Stale layout groups: a group in a vertical stack with nothing left in it
 // (no children, or only references to nodes that no longer exist) still
 // prints its gap, padding and minimum height. Groups in a row are columns
 // (structural gutters keep weight or width) and stay; so do live groups'
 // stale references, which print nothing.
 for(const [overrides,source] of [[project.settings?.layoutOverrides,'project'],[block.presentation?.layoutOverrides,'block']]){
  const entry=overrides?.blockLayouts?.[block.id];
  if(!entry?.arrangement?.root)continue;
  let missing;
  try{missing=new Set(resolveArrangement(block,structuredClone(entry.arrangement),overrides).missing.map(n=>n.ref));}catch{continue;}
  let empty=0;
  const dead=node=>node.type==='item'?missing.has(node.ref):node.type==='group'&&(node.children??[]).every(dead);
  const stack=group=>!group.direction||group.direction==='stack';
  const spacer=child=>child.weight!=null||child.width!=null||/gutter|spacer/i.test(child.id??'');
  const prune=group=>{group.children=(group.children??[]).filter(child=>{if(child.type==='group'&&stack(group)&&!spacer(child)&&dead(child)){empty++;return false;}if(child.type==='group')prune(child);return true;});};
  const copy=structuredClone(entry.arrangement.root);prune(copy);
  if(!empty)continue;
  if(fix)entry.arrangement.root=copy;
  out.push({rule:'empty',target:block.id,action:'fix',detail:'drop '+empty+' empty layout group'+(empty===1?'':'s')+' ('+source+' layout)'});
 }
 return out;
}
const docTable=doc=>isDoc(doc)&&doc.blocks.some(t=>t.type==='table'&&t.rows?.length>1);
function textOf(value){if(!value)return '';if(typeof value==='string')return value;let s='';nodes(value,n=>{if(n.type==='text')s+=n.text;if(n.type==='math')s+=n.latex;if(n.type==='cloze')s+='_';});return s;}

// ---------------------------------------------------------------- ratio scaffolds
const colonCell=c=>c?.blocks?.length===1&&c.blocks[0].inlines?.length===1&&[':','\\colon'].includes(String(c.blocks[0].inlines[0].latex??c.blocks[0].inlines[0].text??'').trim());
function termWidth(cell){
 let minimum=9;
 for(const paragraph of cell.blocks??[])for(const inline of paragraph.inlines??[]){
  if(inline.type==='cloze')minimum=Math.max(minimum,Number(inline.width)||24);
  else if(inline.type==='text')minimum=Math.max(minimum,inline.text.length*2.2+4);
  else if(inline.type==='math'){
   const visible=String(inline.latex).replace(/\\(?:frac|dfrac)\{([^{}]*)\}\{([^{}]*)\}/g,(_,a,b)=>a.length>b.length?a:b).replace(/\\[a-zA-Z]+/g,'').replace(/[{}\\\s]/g,'');
   const word=/\\(?:text|mathrm|textbf)\{[^}]*[A-Za-z]/.test(inline.latex);
   minimum=Math.max(minimum,visible.length*(word?2.2:1.8)+(word?4:2));
  }
 }
 return Math.ceil(minimum*2)/2;
}
function ratioRule(block,{fix,report}){
 const out=[],exception=notes(block).find(n=>/ratio|colon/i.test(n)&&!/^17 October 2026 user feedback: compact ratio/.test(n));
 for(const {doc,owner} of documents(block))nodes(doc,table=>{
  if(table.type!=='table'||!Array.isArray(table.rows))return;
  const count=table.widths?.length??Math.max(...table.rows.map(r=>r.length));
  const colons=new Set();
  for(const row of table.rows)if(row.length===count)row.forEach((c,i)=>{if(colonCell(c))colons.add(i);});
  // A ratio scaffold has a colon in that column on every full row.
  if(!colons.size||![...colons].every(i=>table.rows.filter(r=>r.length===count).every(r=>colonCell(r[i])||!(r[i]?.blocks??[]).some(p=>(p.inlines??[]).length))))return;
  if(table.rows.some(r=>r.some(c=>c.rowspan>1||c.colspan>1)))return;
  const widths=Array.from({length:count},(_,i)=>colons.has(i)?2.5:9);
  for(const row of table.rows)if(row.length===count)row.forEach((c,i)=>{if(!colons.has(i))widths[i]=Math.max(widths[i],termWidth(c));});
  const align=i=>colons.has(i)?'center':colons.has(i+1)&&!colons.has(i-1)?'right':colons.has(i-1)&&!colons.has(i+1)?'left':'center';
  const changes=[];
  if(table.border!==false)changes.push('borders');
  if(table.rows.flat().some(c=>c.background&&!/^(transparent|#fff(fff)?)$/i.test(c.background)||c.header))changes.push('header fill');
  const current=(table.widths??[]).map(Number),total=current.reduce((a,b)=>a+b,0)||1,mm=current.map(w=>w*(table.widthMm??total)/total);
  if(!mm.length||[...colons].some(i=>mm[i]>4)||mm.some((w,i)=>!colons.has(i)&&w>widths[i]+6))changes.push('spacing around the colon');
  if(table.rows.flat().some((c,i,a)=>false))changes.push('');
  if(!changes.length)return;
  if(exception){out.push(report('ratio',owner?.id??block.id,'ratio scaffold '+table.id+' ('+changes.join(', ')+'); local exception: '+exception));return;}
  if(fix){
   table.border=false;table.padding=0;table.widths=widths;table.widthMm=widths.reduce((a,b)=>a+b,0);
   for(const row of table.rows){
    row.forEach((c,i)=>{delete c.background;if(c.header)c.header=false;if(row.length!==count)return;c.align=align(i);c.preserveParagraphAlignment=false;for(const p of c.blocks??[])if(p.type==='paragraph')p.align=c.align;});
   }
   // A bottom arrow below an internal row shares the following row's space.
   // Keep its label clear of that row after the columns are compacted.
   for(const a of table.annotations??[]){
    if(a.type!=='arrow'||a.side!=='bottom'||!a.label)continue;
    const row=table.rows.findIndex(r=>r.some(c=>c.id===a.cellId));
    if(row<0||row+1>=table.rows.length||!table.rows[row].some(c=>c.id===a.toCellId))continue;
    table.rowHeights??=[];
    table.rowHeights[row+1]=Math.max(table.rowHeights[row+1]??0,22);
   }
  }
  out.push({rule:'ratio',target:owner?.id??block.id,action:'fix',detail:table.id+': '+changes.join(', ')});
 });
 return out;
}

// ---------------------------------------------------------------- reported only
function fragmentedTables(block,{report}){
 const out=[];
 for(const {doc,owner} of documents(block)){
  const tables=doc.blocks.filter(b=>!emptyParagraph(b));
  for(let i=0;i<tables.length-1;i++){
   const a=tables[i],b=tables[i+1];
   if(a.type==='table'&&b.type==='table'&&a.border!==false&&b.border!==false&&(a.widths?.length??0)===(b.widths?.length??-1))out.push(report('tables',owner?.id??block.id,'adjacent tables '+a.id+' and '+b.id+' have the same columns; one native table?'));
  }
 }
 const visit=node=>{
  if(!node?.children?.length)return;
  const rows=node.children.map(child=>isDoc(child.prompt)&&child.prompt.blocks.filter(b=>!emptyParagraph(b)).length===1&&child.prompt.blocks.find(b=>b.type==='table')).filter(Boolean);
  if(rows.length>=2&&rows.length===node.children.length&&rows.every(t=>t.rows?.length===1&&t.border!==false&&isDeepStrictEqual(t.widths,rows[0].widths)))out.push(report('tables',node.id,rows.length+' parts each hold one row of the same table; one native table?'));
  node.children.forEach(visit);
 };
 visit(block.content);
 return out;
}
function forcedBreaks(project,block,index,{report}){
 const flow=block.flow??{};
 const forced=flow.pageBreakBefore===true||flow.sourcePageBreakBefore&&flow.pageBreakBefore!==false;
 if(!forced||flow.exercisePageBreakBefore||index.exerciseStarts.has(block.id))return [];
 return [report('breaks',block.id,(flow.pageBreakBefore===true?'forced page break':'source page boundary')+' before this block; measure with `pages`')];
}

// ---------------------------------------------------------------- driver
export const RULES=Object.freeze({
 gutter:'Equals-sign gutter (checklist, 10 October 2026)',
 cloze:'Fraction boxes (a full scaffold keeps both boxes and the vinculum; blanks inside parentheses in a component are empty space), dotted clozes elsewhere, no dots in table cells or circles, cloze widths 2.2 mm/character + 6 mm, one size per question',
 labels:'No lone "a" on investigations, worked examples and Key Ideas; Key Ideas numbered from 1; bold part labels without ")"',
 empty:'Empty paragraphs, empty answer groups under completed tables, stale layout groups',
 ratio:'Ratio scaffolds: no header fill, no borders, terms beside a narrow colon column',
 tables:'Tables built from several adjacent grids (report only)',
 breaks:'Forced page breaks and source page boundaries (report only; `pages` measures empty space)',
 sequence:'Part labels restart inside a question (report only)',
 alignment:'Dormant table-cell alignment (report only)',
});
export function exerciseStarts(project){
 const starts=new Set();
 for(const section of project.sections??[]){
  const first=section.blocks?.[0];
  if(first&&(section.role==='exercise'||section.phase==='practice'||section.pageBreakBefore))starts.add(first.id);
 }
 return {exerciseStarts:starts};
}
// Run every rule on a copy of the project. With fix, the copy is the candidate.
export function sweepProject(input,{fix=false,rules=Object.keys(RULES)}={}){
 const project=structuredClone(input),findings=[],on=new Set(rules);
 const report=(rule,target,detail)=>({rule,target,action:'report',detail});
 const index=exerciseStarts(project);
 const all=blocksOf(project);
 for(const block of all){
  const add=list=>{for(const row of list)findings.push({blockId:row.blockId??block.id,...row});};
  if(on.has('gutter'))add(gutterRule(block,{fix,report}));
  if(on.has('cloze'))add(clozeRule(block,{fix,report}));
  if(on.has('empty'))add(emptyRule(project,block,{fix,report}));
  if(on.has('ratio'))add(ratioRule(block,{fix,report}));
  if(on.has('tables'))add(fragmentedTables(block,{report}));
  if(on.has('breaks'))add(forcedBreaks(project,block,index,{report}));
  if(on.has('alignment'))add(dormantAlignment(block,[block.id]).map(h=>report('alignment',h.owner||block.id,'paragraph '+h.paragraph+' stored '+h.stored+', prints '+h.shown)));
 }
 if(on.has('labels'))for(const row of labelRules(project,{fix,report}))findings.push({blockId:row.blockId??blockOwning(all,row.target),...row});
 if(on.has('sequence'))for(const f of restartedPartLabels(project))findings.push({rule:'sequence',blockId:f.blockId,target:f.parentId,action:'report',detail:'['+f.current.map(l=>l||'·').join(' ')+'] → ['+Object.values(f.labels).map(([,n])=>n).join(' ')+']'+(f.manual.length?' (by hand: '+f.manual.join('; ')+')':'')});
 const before=new Map(blocksOf(input).map(b=>[b.id,b]));
 const changed=fix?all.filter(b=>!isDeepStrictEqual(before.get(b.id),b)).map(b=>b.id):[];
 return {project,findings,changed};
}
function blockOwning(all,id){for(const block of all){if(block.id===id)return block.id;let found=false;nodes(block.content,n=>{if(n.id===id)found=true;});if(found)return block.id;}return id;}

// What must not change: every word, number, expression and answer. Gutters,
// cloze widths, labels and layout are presentation; this signature strips them.
export function contentSignature(block){
 const parts=[];
 const walk=(node,key)=>{
  if(node==null)return;
  // A blank is a blank whether it is drawn as a box, left as empty space (\phantom of the box) or dotted
  // with a stated width: the convention changes how it is drawn, never what it asks for.
  if(typeof node==='string'){if(['text','latex','answer','expectedResponse','prompt','short','worked','theorySolution','solution_text','question_text'].includes(key))parts.push(key+':'+node.replaceAll(PHANTOM,'').replace(PHANTOM_BOX,'[blank]').replace(BOX,'[blank]').replace(SIZED_DOTS,'[blank]').trim());return;}
  if(typeof node!=='object')return;
  if(Array.isArray(node)){node.forEach(n=>walk(n,key));return;}
  for(const [k,v] of Object.entries(node))if(!SKIP.has(k)&&k!=='label')walk(v,k);
 };
 walk({content:block.content,examples:block.examples},'');
 return parts.filter(p=>p!=='text:');
}
