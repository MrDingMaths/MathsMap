// Reproducible, source-referenced repair. Build a candidate first; --adopt saves a revision.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fromSource, contentSource, isDocument, normalizeDocument } from '../../src/lib/document-content.js';
import { adoptHouseStyle, BOOKLET_HOUSE_STYLE as STYLE, clozeWidthMm } from '../../src/lib/booklet-house-style.js';
import { validateEditableProject } from '../../src/lib/editable-booklet-model.js';

import { cartesianTikz } from './linear-geometry.mjs';
import { saveBookletProject } from './project-studio-server.mjs';

const out=path.resolve('output/linear-feedback');fs.mkdirSync(out,{recursive:true});
const active='booklets/projects/linear-relationships-complete-v1.json',baseline=path.join(out,'before.json');
if(!fs.existsSync(baseline))fs.copyFileSync(active,baseline);
const before=JSON.parse(fs.readFileSync(baseline));
let project=JSON.parse(JSON.stringify(before));
const notes=[];
const walk=(v,fn)=>{if(!v||typeof v!=='object')return;fn(v);for(const x of Object.values(v))if(x&&typeof x==='object')Array.isArray(x)?x.forEach(c=>walk(c,fn)):walk(x,fn);};
const find=id=>{let result;walk(project.sections,n=>{if(n.id===id)result=n;});if(!result)throw new Error('Missing repair target '+id);return result;};
const page=n=>project.sections.find(s=>s.sourcePageNumber===n);
const record=(pages,ids,note)=>notes.push({pages:Array.isArray(pages)?pages:[pages],targetIds:Array.isArray(ids)?ids:[ids],note,status:'repaired-needs-visual-review'});
const documentSeeds=new Map();
function doc(value,seed){if(isDocument(value))return value;const count=(documentSeeds.get(seed)??0)+1;documentSeeds.set(seed,count);seed=seed+'-'+count;const d=fromSource(value??'');let n=0;walk(d,x=>{if(x.id)x.id=seed+'-rich-'+(++n);});return d;}
const para=(id,text)=>({...doc(text,id).blocks[0],id,spaceAfter:1,spaceBefore:0,lineHeight:1.32});
const content=node=>{node.prompt=doc(node.prompt,node.id);return node.prompt;};
const tables=value=>{const found=[];walk(value,n=>{if(n.type==='table')found.push(n);});return found;};
function tableStyle(table){
  table.borderColour=STYLE.colours.border;table.borderWidthMm=.2;table.padding=1;table.marginBefore=1;table.marginAfter=1;
  const count=Math.max(...table.rows.map(row=>row.length));
  const widths=Array.from({length:count},(_,i)=>{
    const cells=table.rows.map(row=>row[i]);const words=cells.map(cell=>contentSource({format:'maths-editor-document-v1',version:1,blocks:cell?.blocks??[]}));
    const label=words.some(text=>/[A-Za-z]{3,}/.test(text.replace(/\\[a-z]+/gi,'')));
    return label?Math.max(22,Math.min(48,Math.max(...words.map(w=>w.length))*1.5)):Math.max(10,Math.min(38,Math.max(...words.map(w=>w.replace(/\\[a-z]+|[${}]/g,'').length))*1.8+4));
  });
  table.widths=widths;table.widthMm=widths.reduce((a,b)=>a+b,0);
  for(const row of table.rows)for(const [i,cell] of row.entries()){
    cell.borderColour=null;cell.borderWidthMm=null;
    const text=contentSource({format:'maths-editor-document-v1',version:1,blocks:cell.blocks});
    if(i===0&&/^[xy]$/.test(text.replace(/\\[A-Za-z]+|[$\s{}]/g,'')))cell.background=STYLE.colours.tableLabel;
    if(/(?:^\s*[xy]\s*$|\$\s*[xy]\s*\$|\bWeek\b|\bHours\b|Number of|Cost|Total|Term|Value|Squares|Matches)/.test(text)&&i===0||cell.background&&!['transparent','#ffffff',STYLE.colours.skipped].includes(cell.background.toLowerCase())&&i===0)cell.background=STYLE.colours.tableLabel;
    for(const p of cell.blocks??[])if(p.type==='paragraph'){
      p.spaceBefore=0;p.spaceAfter=0;p.indent=0;
      p.inlines=(p.inlines??[]).filter(i=>i.type!=='cloze'||i.answer);
      for(const inline of p.inlines)if(inline.type==='math'&&/^\\mathbf\{[xy]\}$/.test(inline.latex))inline.latex=inline.latex.at(-2);
      for(const inline of p.inlines??[])if(inline.type==='text'){
        if(/^\s*[-−+]?\d+(?:\.\d+)?\s*$/.test(inline.text)){inline.type='math';inline.latex=inline.text.trim().replace('−','-');inline.display=false;delete inline.text;delete inline.marks;}
        else if(/^\s*[_…\.]{2,}\s*$/.test(inline.text))inline.text='';
      }
    }
  }
}
// Upgrade actual rich content, not provenance or source evidence.
for(const section of project.sections)for(const block of section.blocks){
  const keyIdeas=block.sourceAtom?.kind==='key-ideas'||block.variant==='key-ideas';
  walk(block,node=>{
    for(const key of ['prompt','content','short','worked','theorySolution'])if(typeof node[key]==='string'&&(node[key].includes('|')||keyIdeas||/\\underline\{\\hspace/.test(node[key])))node[key]=doc(node[key],(node.id??block.id)+'-'+key);
    if(node.type==='paragraph'){
      if(keyIdeas){node.lineHeight=1.5;node.spaceAfter=2;}
      node.inlines=(node.inlines??[]).flatMap(inline=>{
        if(inline.type==='cloze')return [{...inline,width:inline.answer?clozeWidthMm(inline.answer):(inline.width??24)}];
        if(inline.type!=='math'||!inline.latex.includes('\\underline{\\hspace'))return [inline];
        const pieces=[],pattern=/\\underline\{\\hspace\{([\d.]+)(mm|cm)\}\}/g;let last=0,m;
        while((m=pattern.exec(inline.latex))){if(m.index>last)pieces.push({...inline,latex:inline.latex.slice(last,m.index)});pieces.push({type:'cloze',answer:'',width:Number(m[1])*(m[2]==='cm'?10:1)});last=pattern.lastIndex;}
        if(last<inline.latex.length)pieces.push({...inline,latex:inline.latex.slice(last)});return pieces.length?pieces:[inline];
      });
    }
    if(node.type==='table')tableStyle(node);
    if(node.sourceAtom&&node.sourceAtom.kind==='definition'&&!node.sourceAtom.label)node.sourceAtom.label=node.sourceAtom.sourceText||node.sourceAtom.description||node.title||'Theory';
  });
}
project=adoptHouseStyle(project);
record([15,25,33,37,38,42,43,65,76,77,89],project.sections.flatMap(s=>s.blocks).filter(b=>[15,25,33,37,38,42,43,65,76,77,89].includes(b.sourcePageNumber)).map(b=>b.id),'Applied common table widths, native numeric maths, blue label fills, grey borders and handwriting-sized dotted cloze.');

find('page-5-q1').content.prompt='';
record(5,'page-5-q1','Removed the duplicated activity instruction; retained the activity band and part instructions.');
for(const n of [18,19,20]){const q=page(n)?.blocks.find(b=>b.sourceOrder===2);if(q)q.content.prompt='Question 2 continued.';}
record([18,19],['page-18-q2','page-19-q2'],'Retained continuation identity with a compact continuation label.');
for(const n of find('page-10-q12').content.children){n.answerSpaceMm=/^[a-h]$/.test(n.label)?0:12;if(/^[a-h]$/.test(n.label))n.responseSpace='scaffold';}
// Diagram and initial coordinates share a row; the longer final parts follow at full width.
find('page-10-q12').content.layout='list';find('page-10-q12').content.columns=null;
find('page-10-q12').content.diagramPlacement='after-prompt';
record(10,'page-10-q12','Removed redundant a–h answer spaces and put i–j beneath the coordinate exercise at full width.');
for(const child of find('page-17-q1').content.children){
  for(const table of tables(content(child))){
    const idx=table.rows[0].findIndex((cell,i)=>i>0&&table.rows.every(row=>contentSource({format:'maths-editor-document-v1',version:1,blocks:row[i]?.blocks??[]}).trim()));
    if(idx>0){for(const row of table.rows)row.splice(idx,1);tableStyle(table);}
  }
}
record(17,'page-17-q1','Removed one fully supplied coordinate column per part and cleaned response underlines.');
// Tabs belong to prose geometry rather than spaces embedded in source text.
for(const child of find('page-26-q2').content.children){
  const d=content(child),p=d.blocks[0];if(p?.type!=='paragraph')continue;
  const i=p.inlines.findIndex(n=>n.type==='math');if(i>=0)p.inlines.splice(i+1,0,{type:'tab'});
  p.tabStops=[{position:25,align:'left',leader:'none'}];
}
record(26,'page-26-q2','Aligned the explanatory sentences using a 25 mm tab stop.');
for(const id of ['page-27-q5','page-28-q7']){const q=find(id);q.content.layout='grid';q.content.columns=2;}
record([27,28],['page-27-q5','page-28-q7'],'Used the same two-column part layout.');

function arrows(table,{given=false,extensions=false}={}){
  const row=table.rows[1];if(!row)return;
  const values=row.map((cell,i)=>({cell,i,text:contentSource({format:'maths-editor-document-v1',version:1,blocks:cell.blocks})})).filter(x=>!/^\s*\$[^$]*y[^$]*\$\s*$/.test(x.text));
  table.annotations=[];
  for(let i=0;i<values.length-1;i++){
    const a=values[i],b=values[i+1],left=extensions&&(!a.text.trim()||!b.text.trim());
    table.annotations.push({id:table.id+'-change-'+i,type:'arrow',cellId:left?b.cell.id:a.cell.id,toCellId:left?a.cell.id:b.cell.id,side:'bottom',label:given?'+2':'',labelBox:!given,colour:left?STYLE.colours.red:STYLE.colours.blue,curveMm:3,distanceMm:1});
  }
  table.marginAfter=given?8:12;
}
for(const [i,part] of find('page-31-q1').content.children.entries()){
  const d=content(part),t=tables(d)[0];arrows(t,{given:i===0});t.widthMm=48;
  if(i<4){const p=d.blocks.find(n=>n.type==='paragraph'&&contentSource({format:d.format,version:1,blocks:[n]}).includes('m'));
    if(p){p.tabStops=[{position:28,align:'left',leader:'none'}];const split=p.inlines.findIndex(x=>x.type==='math'&&/^\s*c\b/.test(x.latex));if(split>0)p.inlines.splice(split,0,{type:'tab'});}
  }
}
record(31,'page-31-q1','Restored change arrows and boxed scaffold labels, with real tab alignment for m and c.');
for(const [n,id] of [[32,'page-32-q4'],[34,'page-34-q9']])for(const part of find(id).content.children){
  const t=tables(content(part))[0];let column=5;
  if(n===34){for(const row of t.rows)row.splice(column,0,{id:part.id+'-skip-'+t.rows.indexOf(row),type:'cell',blocks:[para(part.id+'-skip-text-'+t.rows.indexOf(row),'')],background:STYLE.colours.skipped});t.widths.splice(column,0,4);}
  for(const row of t.rows)row[column].background=STYLE.colours.skipped;
  t.widths[column]=4;t.widthMm=t.widths.reduce((a,b)=>a+b,0);
}
record([32,34],['page-32-q4','page-34-q9'],'Restored narrow grey skipped-value columns, separate from blank answer cells.');
for(const part of find('page-35-q10').content.children){const t=tables(content(part))[0];arrows(t);t.widthMm=58;}
find('page-35-q10').content.columns=2;
for(const part of find('page-35-q12').content.children){const t=tables(content(part))[0];arrows(t,{extensions:true});t.widthMm=72;}
const linePart=find('page-35-q12-d');linePart.prompt.blocks=linePart.prompt.blocks.filter(b=>b.type!=='paragraph'||!contentSource({format:linePart.prompt.format,version:1,blocks:[b]}).startsWith('Points on'));
linePart.questionDiagrams=[{id:'page-35-q12-d-source-line',format:'tikz',role:'question',widthMm:63,derived:true,reviewStatus:'needs-review',code:String.raw`\begin{tikzpicture}[x=1cm,y=1cm,every node/.style={font=\small}]
\draw[<->] (-.4,.2)--(4.5,-2.25);
\foreach \x/\y/\lab in {0/0/{(-18,110)},1/-.5/{(-15,92)},2/-1/{(-12,74)},3/-1.5/{(-9,56)},4/-2/{(-6,38)}}{\fill (\x,\y) circle (2pt);\node[above right] at (\x,\y) {$\lab$};}
\end{tikzpicture}`,spec:{sourcePage:35,description:'Five given labelled points on a descending line; schematic source has no axes.'}}];linePart.diagramPlacement='before-prompt';
record(35,['page-35-q10','page-35-q11','page-35-q12'],'Restored change and extension arrows and the five-point line. Used two columns for Q10; kept Q11’s attribution and question identity.');

function replaceGraph(diagram,model,pageNumber,width=55){
  const original={src:diagram.src,sourceRegion:diagram.sourceRegion};
  Object.assign(diagram,{format:'tikz',code:cartesianTikz(model),widthMm:width,derived:true,reviewStatus:'needs-review',spec:{...diagram.spec,sourcePage:pageNumber,description:'Reconstructed from visually inspected source coordinates, lines and bounds.',originalAsset:original},mathematicalModel:model});delete diagram.sourceRegion;
}
for(const [i,part] of find('page-40-q3').content.children.entries()){
  const [m,c]=[[1,-3],[1,-2],[2,0],[.5,0],[-1,0],[-1,2],[2,-1],[.5,2]][i];replaceGraph(part.questionDiagrams[0],{bounds:{xmin:-5,xmax:5,ymin:-5,ymax:5},lines:[{m,c}]},40,49);part.diagramPlacement='before-prompt';part.answerSpaceMm=i<3?5:15;
}
replaceGraph(find('page-41-q4').content.questionDiagrams[0],{bounds:{xmin:-3,xmax:4,ymin:-5,ymax:5},lines:[{m:2,c:-2}]},41,40);
for(const [i,part] of find('page-39-q2').content.children.entries()){
  const [m,c,xs,bounds]=[[1,1,[-2,-1,0,1],[-4,4,-4,4]],[2,-2,[0,1,2,3],[-3,4,-4,5]],[-1,0,[-2,-1,1,2],[-4,4,-4,4]],[-3,2,[-1,0,1],[-4,4,-2,6]]][i];
  replaceGraph(part.questionDiagrams[0],{bounds:Object.fromEntries(['xmin','xmax','ymin','ymax'].map((key,j)=>[key,bounds[j]])),lines:[{m,c}],points:xs.map(x=>({x,y:m*x+c,label:`(${x},${m*x+c})`,anchor:i===1?'right':'above left'}))},39,48);part.diagramPlacement='before-prompt';
}
record([39,40,41],['page-39-q2','page-40-q3','page-41-q4'],'Rebuilt graphs as TikZ from source givens and kept part labels above diagrams, with tables below.');

for(const n of [59,60,61,62,63,64])for(const block of page(n).blocks.filter(b=>b.type==='question')){
  const node=block.content,d=content(node),src=contentSource(d),t=tables(d)[0];
  const patternDiagrams=node.questionDiagrams.filter(g=>/pattern|sequence/i.test(g.id+' '+g.alt));
  const intro=src.split(/\*?\*?(?:Pattern|Sequence|Table):/)[0].trim();
  const pattern=patternDiagrams.length?(src.includes('Sequence:')?'**Sequence:**':'**Pattern:**'):'';
  const equation=n===64&&[14,15].includes(block.sourceOrder)?'**Equation:**\n\n'+(block.sourceOrder===14?'$y=5x-3$':'$y=-2x+1$'):'**Equation:**';
  node.prompt=intro;node.representations={pattern,table:{format:d.format,version:1,blocks:[para(node.id+'-table-heading','**Table:**'),t]},equation,graph:'**Graph:**',diagramSlots:Object.fromEntries(node.questionDiagrams.map(g=>[g.id,patternDiagrams.includes(g)?'pattern':'graph']))};
  delete node.diagramPlacement;node.responseSpace='scaffold';node.answerSpaceMm=0;
  t.widthMm=Math.min(78,t.widthMm);for(const g of node.questionDiagrams)g.widthMm=patternDiagrams.includes(g)?77:(n>=62?53:64);
  if(n<=60&&node.answer&&!contentSource(node.answer.short).includes('y ='))node.answer.short=contentSource(node.answer.short);
}
record([59,60,61,62,63,64],project.sections.filter(s=>s.sourcePageNumber>=59&&s.sourcePageNumber<=64).flatMap(s=>s.blocks.map(b=>b.id)),'Restored editable representation slots and source-relative diagrams. Removed equations inadvertently revealed on student pages 59–60; retained supplied equations on page 64.');

for(const n of [46,49,83])for(const b of page(n).blocks)walk(b,node=>{if(node.questionDiagrams)for(const d of node.questionDiagrams)if(/pattern|term|shape|triangle|match/i.test(d.alt??'')){d.widthMm=n===49?135:125;node.diagramPlacement='after-prompt';}});
record([46,49,83],page(46).blocks.concat(page(49).blocks,page(83).blocks).map(b=>b.id),'Restored prominent pattern sizes and moved patterns into the normal content flow.');
for(const n of [52,53])walk(page(n),node=>{if(node.answer&&!node.children?.length&&/[cd]$/.test(node.id)){delete node.responseSpace;node.answerSpaceMm=18;}});
record([52,53],page(52).blocks.concat(page(53).blocks).map(b=>b.id),'Restored working space for the final calculation and interpretation parts.');
for(const n of [78,79,91,92])walk(page(n),node=>{if(node.questionDiagrams?.length&&node.type==='part')node.diagramPlacement='before-prompt';});
record([78,79,91],page(78).blocks.concat(page(79).blocks,page(91).blocks).map(b=>b.id),'Placed interpretation prose below its corresponding graph.');
for(const part of find('page-92-q2').content.children){
  const d=content(part),t=tables(d)[0];if(!t)continue;
  const slotBlocks=t.rows[0].map(cell=>cell.blocks);
  d.blocks=d.blocks.flatMap(b=>b===t?[{id:part.id+'-verify-layout',type:'layout',arrangement:'parallel',border:false,padding:0,margin:1,columns:2,slots:slotBlocks.map((blocks,i)=>({id:part.id+'-verify-'+i,blocks:[...blocks,{id:part.id+'-verify-space-'+i,type:'spacer',height:22}]}))}]:[b]);
  part.answerSpaceMm=0;part.responseSpace='scaffold';part.questionDiagrams[0].widthMm=58;
}
record(92,'page-92-q2','Replaced the verification table with two independent equation working areas beneath each graph.');
for(const part of find('page-93-q5').content.children)part.prompt=doc(contentSource(part.prompt),part.id);
record(93,'page-93-q5','Stored independent equations as separate paragraphs, bypassing automatic solution-chain alignment.');

// Second source pass: colours, labelled graphs and teaching arrangements.
find('page-23-theory').content=String.raw`Every linear relationship is in the form:

$$y = {\color{#268cff}m}x + {\color{#ef6068}c}$$`;
for(const example of find('page-23-identify-example').examples){example.theorySolution=example.theorySolution.replace('✖',String.raw`$\color{#ef6068}{\times}$`).replace('✔',String.raw`$\color{#4f9b63}{\checkmark}$`);}
record(23,['page-23-theory','page-23-identify-example'],'Applied semantic coefficient/constant colours and the shared correct/incorrect palette.');
for(const n of [31,35])for(const part of page(n).blocks[0].content.children){
  const d=content(part);for(const p of d.blocks.filter(b=>b.type==='paragraph')){
    p.inlines=p.inlines.flatMap(inline=>{if(inline.type!=='math')return [inline];const m=inline.latex.match(/^(.*?)\s{2,}(c\s*=.*)$/);return m?[{...inline,latex:m[1]},{type:'tab'},{...inline,latex:m[2]}]:[inline];});
    if(p.inlines.some(x=>x.type==='tab'))p.tabStops=[{position:n===31?25:42,align:'left',leader:'none'}];
  }
  for(const t of tables(d)){if(n===31)t.widthMm=50;t.padding=.6;}
}
// Place the separately attributed Q11 in Q10's unused final card, preserving its identity.
find('page-35-q10').pairedBlockId='page-35-q11';
record(35,['page-35-q10','page-35-q11'],'Placed Q11 in the last two-column card without merging question or exam identities.');
const intro15=find('page-37-example-15-intro');intro15.sourceOrder=15;intro15.content=intro15.content.replace(/^\*\*15\*\*\s*/,'');
record(37,'page-37-example-15-intro','Separated question 15 from editable prose to restore hanging indentation.');
for(const [i,part] of find('page-39-q1').content.children.entries()){
  const xs=i===0?[0,1,2,3,4]:[-3,-2,-1,0,1],m=i===0?1:-1,c=i===0?1:-2;
  replaceGraph(part.questionDiagrams[0],{bounds:i===0?{xmin:0,xmax:5,ymin:0,ymax:5}:{xmin:-3,xmax:3,ymin:-3,ymax:3},lines:[{m,c}],points:xs.map(x=>({x,y:m*x+c}))},39,42);
  const d=content(part);const table=doc('| $x$ | | | | | |\n|---|---|---|---|---|---|\n| $y$ | | | | | |',part.id+'-restored-table').blocks[0];tableStyle(table);table.widthMm=45;arrows(table);d.blocks.push(table);
  part.diagramPlacement='beside-prompt';project.settings.layoutOverrides.blockLayouts[part.id]={textWidthMm:40,gapMm:2,diagramSizing:'fit'};
}
record(39,'page-39-q1','Replaced composite source images with native graphs and editable response tables; constrained the adjacent scaffold to its column.');
for(const n of [67,68,69,70])for(const b of page(n).blocks.filter(b=>b.type==='question')){
  const root=b.content,[rep,apps]=root.children??[];if(!rep||!apps)continue;
  const d=content(rep),t=tables(d)[0];if(!t)continue;
  // A worded variable name and x/y belong to one label cell.
  if(t.rows.every(row=>contentSource({format:d.format,version:1,blocks:row[0].blocks}).trim()===''&&/\$.*[xy].*\$/.test(contentSource({format:d.format,version:1,blocks:row[1].blocks})))){
    for(const [i,row] of t.rows.entries()){row[0].blocks=[{...para(rep.id+'-variable-'+i,''),inlines:[{type:'cloze',answer:'',width:24},{type:'text',text:'  ',marks:[]},...row[1].blocks[0].inlines]}];row[0].background=STYLE.colours.tableLabel;row.splice(1,1);}
  }
  tableStyle(t);t.widths[0]=36;t.widthMm=Math.min(80,t.widths.reduce((a,b)=>a+b,0));
  rep.prompt='';rep.representations={pattern:'Independent variable\n\nDependent variable',table:{format:d.format,version:1,blocks:[t]},equation:'Equation',graph:'Graph',diagramSlots:Object.fromEntries(rep.questionDiagrams.map(g=>[g.id,'graph']))};delete rep.diagramPlacement;
  for(const g of rep.questionDiagrams)g.widthMm=62;
  root.layoutPreset='scenario';apps.layout='list';apps.columns=null;for(const c of apps.children){c.answerSpaceMm=14;c.label="";}
}
record(67,['page-67-q1','page-67-q2'],'Restored scenario quadrants, same-cell variable-name blanks, and application working alongside the graph.');
// A compact native annotation diagram keeps the formula terms contiguous.
const definition=find('page-73-block-1');
definition.content='We have special words to describe parts of a linear equation.';
page(73).blocks.splice(page(73).blocks.indexOf(definition)+1,0,{
 id:'page-73-formula-diagram',type:'diagram',sourcePageNumber:73,sourceAtom:definition.sourceAtom,
 format:'tikz',widthMm:140,derived:true,reviewStatus:'needs-review',
 code:String.raw`\begin{tikzpicture}[x=1cm,y=1cm,every node/.style={font=\small}]
\definecolor{houseblue}{HTML}{268CFF}\definecolor{housered}{HTML}{EF6068}
\node[font=\large] at (0,0) {$y=$};\node[houseblue,font=\large] (m) at (.65,0) {$m$};\node[font=\large] at (1.2,0) {$x+$};\node[housered,font=\large] (c) at (1.8,0) {$c$};
\node[houseblue,align=center] (ml) at (-1.5,-1.2) {coefficient of $x$\\gradient (steepness)};
\node[housered,align=center] (cl) at (3.2,-1.2) {constant term\\$y$-intercept\\(where the line crosses the $y$-axis)};
\draw[houseblue,->] (ml.north)--(m.south);\draw[housered,->] (cl.north)--(c.south);
\end{tikzpicture}`,spec:{sourcePage:73,description:'Coefficient and constant arrows point to the corresponding terms of y=mx+c.'}
});
for(const [index,b] of page(73).blocks.filter(b=>b.type==='worked-example').entries()){
  const example=b.examples[0],g=example.questionDiagrams[0];
  const lines=index===0?[{m:2,c:-3,colour:'red'},{m:-2,c:1,colour:'green!70!black'}]:index===1?[{m:2,c:1,colour:'blue'},{m:2,c:-3,colour:'red'}]:[{m:-2,c:1,colour:'green!70!black'},{m:2,c:1,colour:'blue'}];
  replaceGraph(g,{bounds:{xmin:-5,xmax:5,ymin:-5,ymax:5},lines},73,50);
  const labels=index===0?String.raw`y=2x-3\qquad y=-2x+1`:index===1?String.raw`y={\color{#268cff}2}x+1\qquad y={\color{#268cff}2}x-3`:String.raw`y=-2x+{\color{#ef6068}1}\qquad y=2x+{\color{#ef6068}1}`;
  example.diagramCaption='$'+labels+'$';
  example.prompt=example.prompt.replace('graph.    If','graph.\n\nIf');
}
record(73,page(73).blocks.map(b=>b.id),'Restored the named theory band, anchored m/c arrows, graph colours and highlighted comparison equations.');
walk(page(74),node=>{for(const key of ['prompt','theorySolution','short','worked'])if(typeof node[key]==='string')node[key]=node[key].replaceAll('\\color{red}','\\color{#ef6068}').replaceAll('\\color{green}','\\color{#4f9b63}');});
record(74,page(74).blocks.map(b=>b.id),'Unified red and green maths labels with the booklet palette.');
for(const table of tables(find('page-80-q10').content.prompt))for(const row of table.rows.slice(1)){
  const cell=row[0];for(const p of cell.blocks??[])if(p.type==='paragraph'){const maths=p.inlines.filter(x=>x.type==='math');if(maths.length===2)p.inlines=[maths[0],{type:'break'},maths[1]];}
}
record(80,'page-80-q10','Separated each pair of comparison equations onto two lines.');
for(const b of page(84).blocks)walk(b,n=>{if(n.type==='paragraph')n.indent=0;});
for(const [i,example] of find('page-85-block-3').examples.entries())replaceGraph(example.questionDiagrams[0],{bounds:{xmin:-8,xmax:8,ymin:-8,ymax:8},lines:[{m:2,c:1},{m:0,c:7,colour:'red',dashed:true}],points:i?[{x:3,y:7,label:'(3,7)',anchor:'below right'}]:[]},85,63);
replaceGraph(find('page-86-q1-a').questionDiagrams[0],{bounds:{xmin:-5,xmax:5,ymin:-5,ymax:5},lines:[{m:1,c:1},{m:0,c:4,colour:'red',dashed:true}]},86,49);
record([84,85,86],['page-84-b1','page-85-callout-1','page-85-block-3','page-86-q1-a'],'Recovered theory headings, removed unintended indents, and restored the source horizontal lines and labelled intersection.');
for(const b of page(88).blocks){b.content.questionDiagrams[0].widthMm=93;b.content.diagramPlacement='beside-prompt';project.settings.layoutOverrides.blockLayouts[b.content.id]={textWidthMm:75,gapMm:4,diagramSizing:'fit'};}
record(88,page(88).blocks.map(b=>b.id),'Restored substantial graph widths beside the equation lists.');
for(const [i,part] of find('page-90-identify').content.children.entries()){
  const d=content(part);part.afterDiagramPrompt={format:d.format,version:1,blocks:d.blocks.splice(1)};part.responseSpace='scaffold';part.answerSpaceMm=0;
  const lines=i?[{m:2,c:-2,colour:'blue'},{m:-2,c:8,colour:'red'}]:[{m:-3,c:6,colour:'blue'},{m:2,c:1,colour:'red'}];
  replaceGraph(part.questionDiagrams[0],{bounds:{xmin:-7,xmax:7,ymin:-7,ymax:7},lines,points:i?[]:[{x:1,y:3,label:'(1,3)',anchor:'above right'}]},90,60);
  const labels=i?String.raw`\node[blue,anchor=west] at (-5,-4) {$y=2x-2$};\node[red,anchor=west] at (2,-5.5) {$y=8-2x$};`:String.raw`\node[red,anchor=west] at (-6,-3.5) {$y=2x+1$};\node[blue,anchor=west] at (3,-3.5) {$y=6-3x$};`;
  part.questionDiagrams[0].code=part.questionDiagrams[0].code.replace('\\end{tikzpicture}',labels+'\n\\end{tikzpicture}');
}
record(90,'page-90-identify','Restored graph equation labels and the supplied intersection point; put response text underneath.');

// Keep the extended table scaffold clear of the footer.
for(const part of find('page-35-q12').content.children){part.answerSpaceMm=0;part.responseSpace='scaffold';}
const extensionTable=tables(find('page-35-q12-d').prompt)[0];
extensionTable.annotations.forEach((a,i)=>{a.colour=i<5?STYLE.colours.blue:STYLE.colours.red;if(i<5){const from=a.cellId;a.cellId=a.toCellId;a.toCellId=from;}});

// Final source/fit pass, with intact teaching groups and original references.
const coordinateExercise=find('page-10-q12').content;
coordinateExercise.children=[{id:'page-10-q12-coordinate-group',type:'group',label:'',prompt:'',layout:'list',questionDiagrams:coordinateExercise.questionDiagrams,diagramPlacement:'right-of-prompt',children:coordinateExercise.children.slice(0,8)},...coordinateExercise.children.slice(8)];
coordinateExercise.questionDiagrams=[];delete coordinateExercise.diagramPlacement;
find('page-14-q2').content.layout='grid';find('page-14-q2').content.columns=3;
for(const part of find('page-14-q2').content.children){for(const t of tables(content(part))){t.widths=t.rows[0].map(()=>10);t.widthMm=46;}}
for(const c of find('page-26-q1').content.children)c.answerSpaceMm=10;
for(const c of find('page-26-q2').content.children)walk(c.prompt,n=>{if(n.type==='paragraph')n.spaceAfter=0;});
for(const c of find('page-28-q8').content.children)for(const g of c.questionDiagrams){g.code=g.code.replaceAll('above right,red!65,inner sep=2pt','below right,red!65,inner sep=4pt');}
record([8,10,14,26,28],['page-8-q7','page-10-q12','page-14-q2','page-26-q1','page-28-q8'],'Aligned stems and parts at the top of diagram rows; compacted tables through columns; restored diagram-side coordinates with final parts below and offset graph labels clear of the line.');
for(const b of page(49).blocks){const node=b.content,d=content(node),table=tables(d)[0],pattern=node.questionDiagrams.find(g=>/pattern|sequence|chair/i.test(g.id+' '+g.alt));node.prompt=b.sourceOrder===10?'$x$ is "number of tables"\n$y$ is "number of chairs"':'';node.layoutPreset='pattern-top';node.representations={pattern:'',table:{format:d.format,version:1,blocks:[para(node.id+'-table-title','Table:'),table]},equation:'Equation:\n\n[[|65]]',graph:'Graph:',diagramSlots:Object.fromEntries(node.questionDiagrams.map(g=>[g.id,g===pattern?'pattern':'graph']))};node.responseSpace='scaffold';node.answerSpaceMm=0;delete node.diagramPlacement;for(const g of node.questionDiagrams)g.widthMm=g===pattern?135:62;}
for(const b of page(65).blocks)walk(b,n=>{if(n.type==='paragraph')n.inlines=(n.inlines??[]).flatMap(i=>{if(i.type!=='text')return [i];if(/^\s*\*\s*[ab]\./.test(i.text))i={...i,text:i.text.replace(/^\s*\*\s*/,'')};const pieces=i.text.split(/(\$[xy]\$)/);return pieces.map(v=>/^\$[xy]\$$/.test(v)?{type:'math',latex:v.slice(1,-1),display:false}:{...i,text:v});});});
record([65,72],['page-65-b2','page-72-q11'],'Removed stray list asterisks, restored variable maths inside emphasis, and displayed the once-only 2020 HSC attribution.');
// Standardize legacy table data after local reconstruction, retaining local dimensions.
for(const section of project.sections)for(const b of section.blocks)walk(b,n=>{if(n.type==='paragraph')for(const i of n.inlines??[])if(i.type==='text'&&/^[xy]$/.test(i.text)){i.type='math';i.latex=i.text;i.display=false;delete i.text;delete i.marks;}});
const clozeAnswers={
 'page-76-q1':['parallel','coefficients','y-intercepts'],
 'page-76-q2':['y-intercept','constant','terms','gradients','coefficients'],
 'page-76-q3':['y-intercept','the constant terms are the same','gradients','the coefficients of x are different'],
 'page-77-q4':['coefficient','decreasing','the coefficient of x is negative'],
 'page-77-q5':['parallel','coefficient','negative','y-intercepts','constant','terms'],
 'page-77-q6-a':['y=mx+c'],'page-77-q6-b':['oefficient','radient'],
 'page-77-q6-c':['onstant','erm','intercept','y'],'page-77-q6-d':['coefficient of x'],
 'page-77-q6-e':['constant','term'],'page-77-q6-f':['increasing'],'page-77-q6-g':['negative']
};
for(const [id,answers] of Object.entries(clozeAnswers)){const found=find(id),node=found.type==='question'?found.content:found;let index=0;node.prompt=doc(contentSource(node.prompt).replace(/_{3,}/g,()=>{const answer=answers[index++];if(!answer)throw new Error('Missing cloze answer '+id);return '[['+answer+'|'+clozeWidthMm(answer)+']]';}).replace('...-','y-'),id+'-cloze');if(index!==answers.length)throw new Error('Cloze count mismatch '+id);node.responseSpace='scaffold';node.answerSpaceMm=0;}
record([76,77],Object.keys(clozeAnswers),'Replaced short literal underscores with dotted cloze sized to each mathematical answer or explanation.');
const coordinateCards=find('page-27-q5').content,cardPart=coordinateCards.children[0];
const cardSource=contentSource(cardPart.prompt),pairs=[...cardSource.matchAll(/\\boxed\{([^}]+)\}/g)].map(m=>m[1]);
if(pairs.length!==10)throw new Error('Coordinate card source count changed');
cardPart.prompt=cardSource.split('$$')[0].trim();
coordinateCards.prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:'page-27-q5-cards',type:'layout',arrangement:'cards',columns:5,border:false,margin:1,padding:0,gap:3,slots:pairs.map((pair,i)=>({id:'page-27-q5-card-'+i,blocks:[para('page-27-q5-card-text-'+i,'$'+pair+'$')]}))}]};
record(27,'page-27-q5','Used the same editable five-column coordinate cards as page 28, retaining all four labelled prompts.');
find('page-45-q2-b').prompt=contentSource(find('page-45-q2-b').prompt).replaceAll('[_____]','[[|30]]');
find('page-78-q8-a').prompt=contentSource(find('page-78-q8-a').prompt).replaceAll('_____','[[|20]]');
for(const [id,rule] of [['page-59-q1','3x+1'],['page-59-q2','5x'],['page-60-q3','x+1'],['page-60-q4','2x-2']])find(id).content.answer.short+='; equation: $y='+rule+'$';
// Preserve unresolved source images explicitly; never imply a raster is editable geometry.
for(const section of project.sections)for(const block of section.blocks)walk(block,n=>{
 if(n.format==='tikz'&&n.code){const end=n.code.indexOf('\n');if(end>0)n.code=n.code.slice(0,end)+'\n\\definecolor{blue}{HTML}{268CFF}\\definecolor{red}{HTML}{EF6068}\\definecolor{green}{HTML}{4F9B63}'+n.code.slice(end);n.code=n.code.replaceAll('green!70!black','green');}
 if((n.format==='image'||n.type==='image')&&n.src){n.reviewStatus='needs-review';n.spec={...n.spec,sourcePage:section.sourcePageNumber,retentionReason:n.spec?.retentionReason??'Original source image retained for fidelity. Native reconstruction remains unverified; compare against the linked source page before approving.'};}
});

const checked=validateEditableProject(project);if(!checked.valid)throw new Error(checked.errors.join('\n'));
fs.writeFileSync(path.join(out,'candidate.json'),JSON.stringify(project,null,2)+'\n');
fs.writeFileSync(path.join(out,'repairs.json'),JSON.stringify({sourceRevision:before.revision,sourceHash:crypto.createHash('sha256').update(fs.readFileSync(baseline)).digest('hex'),houseStyleVersion:STYLE.version,notes},null,2)+'\n');
if(process.argv.includes('--adopt')){if(!fs.readFileSync(active).equals(fs.readFileSync(baseline)))throw new Error('Active project changed since the preserved baseline; merge saved edits before adoption.');const saved=await saveBookletProject(project,{expectedRevision:before.revision});if(JSON.stringify(saved.sections)!==JSON.stringify(project.sections))throw new Error('Saved content differs from the verified candidate');console.log('Saved repaired project as revision '+saved.revision+'.');}
console.log(JSON.stringify({candidate:path.join(out,'candidate.json'),repairs:notes.length,valid:true}));
