// Targeted, repeatable repair. Produces a candidate only; publication is revision checked.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {inlinesFromSource} from '../../public/libs/maths-editor/document-model.mjs';
import {arrangementCatalog,resolveArrangement} from '../../src/lib/booklet-arrangement.js';
import {group,item} from '../../public/libs/maths-editor/arrangement-model.mjs';
import {reconcileSyncLayout} from '../../src/lib/question-sync-layout.js';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';

const S=String.raw, clone=structuredClone;
const skip=new Set(['source','sourceReview','sourceAtom','sourceLayoutEvidence','spec','studio','provenance','originalDiagram']);
export function walkContent(x,fn){if(!x||typeof x!=='object')return;fn(x);for(const[k,v]of Object.entries(x))if(!skip.has(k))walkContent(v,fn);}
const para=(id,text)=>({id,type:'paragraph',spaceAfter:1.2,lineHeight:1.32,inlines:inlinesFromSource(text)});
const doc=(...blocks)=>({format:'maths-editor-document-v1',version:1,blocks:blocks.flat()});
const answer=(short,worked=short)=>({short,worked,provenance:{short:'authored',worked:'authored'}});
function find(x,id){let result;walkContent(x,n=>{if(n.id===id)result=n;});assert.ok(result,'Missing '+id);return result;}
function table(id,headers,rows){return {id,type:'table',border:true,padding:1.2,marginBefore:1,marginAfter:1,widths:headers.map(()=>1),rowHeights:[8,...rows.map(()=>6.5)],rows:[headers,...rows].map((r,i)=>r.map((v,j)=>({id:`${id}-r${i}c${j}`,type:'cell',align:'center',verticalAlign:'middle',...(i===0?{header:true,bold:true,background:'#d3e8fc'}:{}),blocks:[{...para(`${id}-r${i}c${j}-text`,typeof v==='number'?`$${v}$`:v),align:'center',spaceAfter:0}]})))};}

// Larger interpretation plots deliberately retain the original sign convention.
export function readingPlot(id,{negative=false,guided=false}={}){
 const rows=negative
  ? guided?[{stem:'-2',leaves:[9,4,4]},{stem:'-1',leaves:[8,5,2]},{stem:'-0',leaves:[9,4,1]}]:[{stem:'-2',leaves:[8,3,3]},{stem:'-1',leaves:[9,5,2]},{stem:'-0',leaves:[8,5,2]}]
  : guided?[{stem:1,left:[8,4,1],right:[2,5,5]},{stem:2,left:[9,6,3,3],right:[0,4,8]},{stem:3,left:[7,2],right:[1,6,9]}]:[{stem:1,left:[9,6,2],right:[1,4,4]},{stem:2,left:[8,6,3,3],right:[0,5,7]},{stem:3,left:[4,1],right:[2,6,8]}];
 const circles=negative?[{row:0,index:1},{row:2,index:1}]:[{row:1,index:1,side:'left'},{row:0,index:1,side:'right'}];
 let body=S`\path[use as bounding box] (0,-52) rectangle (108,9);`+'\n';
 if(negative){
  body+=S`\draw[black,line width=.4pt] (20,0)--(88,0) (43,7)--(43,-29);\node at (31,4){\textbf{Stem}};\node at (64,4){\textbf{Leaf}};`+'\n';
  rows.forEach((r,i)=>{body+=S`\node at (31,${-7-i*9}){$${r.stem}$};`+r.leaves.map((v,j)=>S`\node at (${51+j*10},${-7-i*9}){$${v}$};`).join('')+'\n';});
  circles.forEach(c=>{body+=S`\draw[black,line width=.5pt] (${51+c.index*10},${-7-c.row*9}) circle[radius=3.2mm];`+'\n';});
  body+=S`\node[anchor=west] at (8,-38){\textbf{Key:} $-2\mid4$ means $-24$};\node[anchor=west] at (8,-47){$-0\mid4$ means $-4$};`;
 }else{
  body+=S`\draw[black,line width=.4pt] (3,0)--(105,0) (47,7)--(47,-29) (61,7)--(61,-29);\node at (24,4){\textbf{Group A}};\node at (54,4){\textbf{Stem}};\node at (84,4){\textbf{Group B}};`+'\n';
  rows.forEach((r,i)=>{body+=S`\node at (54,${-7-i*9}){$${r.stem}$};`+r.left.map((v,j)=>S`\node at (${40-(r.left.length-1-j)*9},${-7-i*9}){$${v}$};`).join('')+r.right.map((v,j)=>S`\node at (${68+j*9},${-7-i*9}){$${v}$};`).join('')+'\n';});
  circles.forEach(c=>{const r=rows[c.row],x=c.side==='left'?40-(r.left.length-1-c.index)*9:68+c.index*9;body+=S`\draw[black,line width=.5pt] (${x},${-7-c.row*9}) circle[radius=3.2mm];`+'\n';});
  body+=S`\node[anchor=west] at (3,-38){\textbf{Key A:} $6\mid2$ means $26$};\node[anchor=west] at (3,-47){\textbf{Key B:} $2\mid5$ means $25$};`;
 }
 return {id,format:'tikz',role:'question',widthMm:112,reviewStatus:'needs-review',code:'% mathsmap-diagram-colours '+JSON.stringify({version:1,kind:'graph',base:[],semantic:[],reference:'User feedback revision 264: '+id})+'\n'+S`\begin{tikzpicture}[x=1mm,y=1mm,every node/.style={font=\fontsize{10}{12}\selectfont,text=black,inner sep=0pt,outer sep=0pt}]`+'\n'+S`\special{dvisvgm:raw <metadata data-graph-strokes="1"/>}`+'\n'+body+'\n'+S`\end{tikzpicture}`,spec:{kind:'graph',sourcePage:25,description:negative?'Negative stems, including -0, with explicit keys and two circled leaves.':'Back-to-back plot with labelled groups, repeated leaves, both keys and two circled leaves.',mathematics:{rows,circles,negative,guided},authorisedRevision:'data-feedback-264'}};
}

export function repairDataVisualisationFeedback(original){
 assert.equal(original.id,'data-visualisation-1-v1');const p=clone(original);
 if(p.sections.flatMap(s=>s.blocks).some(b=>b.feedbackRepair==='data-feedback-264'))return p;
 const block=id=>find(p.sections,id),node=id=>find(p.sections,id),overrides=p.settings.layoutOverrides;
 const resetLayout=new Set(),movedRefs=new Map();
 const moveParagraphs=(b,e,ids)=>{const moved=e.prompt.blocks.filter(n=>ids.includes(n.id));e.prompt.blocks=e.prompt.blocks.filter(n=>!ids.includes(n.id));const old=e.theorySolution; e.theorySolution=doc(...moved,...(old?.blocks??(old?[para(e.id+'-retained-solution',old)]:[])));for(const n of moved)movedRefs.set(`${e.id}/prompt#${n.id}`,`${e.id}/theorySolution#${n.id}`);};
 const solutionGraphs=e=>{e.solutionDiagrams=[...(e.solutionDiagrams??[]),...(e.questionDiagrams??[]).map(d=>({...d,role:'solution'}))];e.questionDiagrams=[];};

 // Preserve the user's edited colour data and completed table, moving only its role.
 const colour=block('p3-worked-model'),colourLayout=colour.content.blocks[0];
 colour.content=doc(...colourLayout.slots[0].blocks.filter(n=>n.inlines?.length));
 colour.theorySolution=doc(...colourLayout.slots[1].blocks);resetLayout.add(colour.id);
 const numerical=block('p3-numerical-model'),numLayout=numerical.content.blocks[0];
 numerical.content=doc(...numLayout.slots[0].blocks,para('p3-numerical-questions','Use the table to find the number of households, total number of cars, most frequent number of cars and highest observed number of cars.'));
 numerical.theorySolution=doc(...numLayout.slots[1].blocks);resetLayout.add(numerical.id);
 for(const b of [colour,numerical]){b.type='worked-example';b.examples=[{id:b.id+'-example',label:'',prompt:b.content,theorySolution:b.theorySolution}];delete b.content;delete b.theorySolution;b.presentation={...b.presentation,layout:'columns',columns:1,numberSteps:false};}
 const household=block('p3-household-interpretation-guided');
 household.content.prompt=doc(para('p3-computers-instruction','Use this frequency table for computers per household.'),table('p3-computers-table',['Computers per household','Frequency'],[[0,2],[1,3],[2,4],[3,1],[4,0]]));
 for(const child of household.content.children){child.prompt=child.prompt.replaceAll('cars','computers');child.answer.short=child.answer.short.replaceAll('cars','computers');child.answer.worked=child.answer.worked.replaceAll('cars','computers').replaceAll('Two cars','Two computers');}

 for(const[bId,ids]of [['p8-worked',['p8-model-conversion']],['p10-worked-example',['p10-scale-method']],['p16-worked',['p16-plot-method']],['p21-example',['p21-dot-method']],['p25-worked',['p25-construct-method']]]){
  const b=block(bId),e=b.examples[0];
  // The current authoring helper has stable method IDs; retain manual text edits.
  const known=ids.filter(id=>e.prompt.blocks.some(n=>n.id===id));
  if(!known.length&&['p21-example','p25-worked'].includes(bId))known.push(e.prompt.blocks.at(-1).id);
  moveParagraphs(b,e,known);solutionGraphs(e);
 }
 const line=block('p16-worked').examples[0],estimate=line.theorySolution.blocks.find(n=>n.id==='p16-worked-estimate');
 if(estimate){line.theorySolution.blocks=line.theorySolution.blocks.filter(n=>n!==estimate);line.prompt.blocks.push(estimate);movedRefs.set(`${line.id}/theorySolution#${estimate.id}`,`${line.id}/prompt#${estimate.id}`);}
 block('p21-example').examples[0].prompt.blocks.push(para('p21-interpret-question','Describe any cluster, gap or possible outlier.'));
 const stem=block('p25-worked').examples[0];stem.prompt.blocks.push(para('p25-explicit-construction','Construct a stem-and-leaf plot.'));
 for(const paragraph of stem.theorySolution.blocks)if(paragraph.inlines?.[0]?.type==='text')paragraph.inlines[0].text=paragraph.inlines[0].text.replace(/^Construct a stem-and-leaf plot\.\s*/,'');

 for(const[negative,bid,gid]of [[false,'p25-reading-support','p25-reading-guided'],[true,'p25-negative-support','p25-negative-guided']]){
  const b=block(bid),e=b.examples[0],g=block(gid),originalDiagram=e.questionDiagrams[0];
  e.prompt=negative?'The temperatures (°C) are shown in this stem-and-leaf plot. For each circled leaf, what value does this represent?':'Two groups recorded scores. For each circled leaf, what value does this represent?';
  e.questionDiagrams=[readingPlot(originalDiagram.id,{negative})];
  e.theorySolution=negative?S`Stem $-2$, leaf $3$: $-23^\circ\mathrm{C}$. Stem $-0$, leaf $5$: $-5^\circ\mathrm{C}$. The minus sign applies to the whole value.`:S`Group A: stem $2$, leaf $6$ represents $26$. Group B: stem $1$, leaf $4$ represents $14$. Read the left leaves using Key A and the right leaves using Key B.`;
  g.content.prompt=negative?'For each circled leaf in this temperature plot, what value does this represent?':'For each circled leaf in this back-to-back score plot, what value does this represent?';
  g.content.questionDiagrams=[readingPlot(gid+'-plot',{negative,guided:true})];g.content.layout='list';delete g.content.columns;
  const c=g.content.children[0];c.prompt=negative?'Read the circled leaf beside stem −2, then the circled leaf beside stem −0.':'Read the circled leaf for Group A, then the circled leaf for Group B.';
  c.responseSpace='working';c.answerSpaceMm=14;c.answer=negative?answer('$-24^\circ\mathrm{C}$; $-4^\circ\mathrm{C}$.','Apply the minus sign to the full value: stem −2 with leaf 4 is −24; stem −0 with leaf 4 is −4.'):answer('$26$; $15$.','Group A: two tens and six units give 26. Group B: one ten and five units give 15.');
  resetLayout.add(b.id);resetLayout.add(g.id);
 }
 const dot=block('p22-q2').content,base=clone(dot.answer.solutionDiagrams[0]);
 base.id='p22-q2-scaffold';base.role='question';base.widthMm=100;base.code=base.code.replace(/\\foreach \\x\/\\n[^\n]+/,'');
 base.code=base.code.replace(/% mathsmap-diagram-colours [^\n]+/,'% mathsmap-diagram-colours '+JSON.stringify({version:1,kind:'graph',base:[],semantic:[],reference:'Source page 22 blank scaffold; feedback revision 264'}));
 base.spec={kind:'graph',sourcePage:22,description:'Blank consecutive 20–29 number line with vertical alignment guides and room for seven dots.',mathematics:{min:20,max:29,capacity:7,blank:true}};
 dot.questionDiagrams=[base];dot.answerSpaceMm=0;dot.responseSpace='scaffold';resetLayout.add('p22-q2');
 dot.answer.solutionDiagrams[0].spec.answerVisibility='Solution only; question supplies the matching blank scaffold.';

 const histogram=block('p43-worked').examples[0];histogram.prompt.blocks[0]=para(histogram.prompt.blocks[0].id,'Use this frequency table.');
 histogram.theorySolution='Use class boundaries 47.5, 48.5, 49.5, 50.5, 51.5 and 52.5. Draw adjoining bars with heights 2, 5, 0, 4 and 1. Join the top centres; extend the polygon to (47, 0) and (53, 0).';solutionGraphs(histogram);
 const cumulative=block('p46-example').examples[0],cfLayout=cumulative.prompt.blocks[1],completed=cfLayout.slots[0].blocks[0];
 const input=table('p46-frequency-givens',['Children','Frequency'],[[1,3],[2,9],[3,7],[4,4],[5,2]]);
 cumulative.prompt=doc(cumulative.prompt.blocks[0],input,para('p46-questions','Calculate the cumulative frequencies. How many families have fewer than 3 children, 3 or fewer children, and exactly 3 children? How many families were surveyed?'));
 cumulative.theorySolution=doc(completed,...cfLayout.slots[1].blocks);resetLayout.add('p46-example');
 solutionGraphs(block('p47-example').examples[0]);

 const theory=block('p51-theory'),sales=theory.content.blocks.filter(n=>['p51-dataset-introduction','p51-sales-table','p51-graph-introduction'].includes(n.id));
 theory.content.blocks=theory.content.blocks.filter(n=>!sales.includes(n)&&n.id!=='p51-theory-introduction');
 node('p51-heading').content=doc(para('p51-heading-text','Choose a graph to suit the question you want to answer.'));
 theory.content.blocks.unshift(para('p51-source-comparison','A table retains individual values. A column graph makes quantities easy to compare; a sector graph shows each quantity as part of the whole.'));
 const displays=block('p51-theory-graphs'),exampleGroup=clone(block('p51-worked-example').sourceAtom);
 displays.sourceAtom=clone(exampleGroup);displays.pedagogyRole='example';displays.presentation.columns=3;
 for(const[e,kind]of displays.examples.map((e,i)=>[e,['column','line','sector'][i]])){e.prompt=`Represent the weekly skateboard sales as a ${kind} graph.`;solutionGraphs(e);}
 const dataset={id:'p51-worked-data',type:'rich-text',content:doc(...sales.filter(n=>n.id!=='p51-graph-introduction')),sourcePageNumber:51,sourceRefs:[{pageNumber:51}],sourceAtom:clone(exampleGroup),pedagogyRole:'example',flow:{keepWithNext:true}};
 const section=p.sections.find(s=>s.blocks.includes(displays));section.blocks.splice(section.blocks.indexOf(displays),0,dataset);
 resetLayout.add(displays.id);

 const originals=new Map(original.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));
 for(const b of p.sections.flatMap(s=>s.blocks)){
  const old=originals.get(b.id);if(old&&JSON.stringify(old)===JSON.stringify(b))continue;
  if(resetLayout.has(b.id)){
   // Re-role fields explicitly. Other presentation/width overrides remain intact.
   const catalog=arrangementCatalog(b),entries=[...catalog.entries.values()].filter(e=>!e.role?.startsWith('answer-'));
   let root=catalog.initial.root;
   if(['p3-worked-model','p3-numerical-model','p46-example'].includes(b.id)){
    const prompt=entries.filter(e=>e.role==='content'&&e.kind!=='label').map(e=>item(e.ref));
    const solution=entries.filter(e=>e.role==='solution').map(e=>item(e.ref));
    root=group(b.id+':feedback-row',[group(b.id+':feedback-question',prompt),group(b.id+':feedback-solution',solution)],'row');root.gap=5;
   }
   overrides.blockLayouts[b.id]={...overrides.blockLayouts[b.id],arrangement:{version:1,root}};
   if(b.presentation?.arrangement)delete b.presentation.arrangement;
  }else if(old){
   for(const holder of [b.presentation,overrides.blockLayouts[b.id]]){
    walkContent(holder,n=>{if(n.ref&&movedRefs.has(n.ref))n.ref=movedRefs.get(n.ref);});
    reconcileSyncLayout(old,b,holder);
    // A newly added solution must be represented even with an older saved layout.
    if(holder?.arrangement){const refs=new Set();walkContent(holder.arrangement,n=>{if(n.ref)refs.add(n.ref);});for(const e of arrangementCatalog(b).entries.values())if(e.role==='solution'&&!refs.has(e.ref))holder.arrangement.root.children.push(item(e.ref));}
   }
  }
  for(const holder of [b.presentation,overrides.blockLayouts[b.id]])if(holder?.arrangement){const seen=new Set();const unique=n=>{if(n.children)n.children=n.children.filter(c=>{if(c.type==='item'){if(seen.has(c.ref))return false;seen.add(c.ref);}unique(c);return true;});};unique(holder.arrangement.root);}
  if(b.sourceReview){b.sourceReview.verification={...b.sourceReview.verification,checked:false};b.sourceReview.visualAudit={...b.sourceReview.visualAudit,checked:false};}
  b.feedbackRepair='data-feedback-264';
 }
 for(const b of p.sections.flatMap(s=>s.blocks)){const layout=overrides.blockLayouts[b.id]?.arrangement;if(layout)assert.deepEqual(resolveArrangement(b,layout).missing,[],'Unresolved layout '+b.id);}
 const checked=validateEditableProject(p);assert.ok(checked.valid,checked.errors.join('; '));return p;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const get=k=>process.argv[process.argv.indexOf(k)+1];assert.ok(process.argv.includes('--input')&&process.argv.includes('--out'),'Use --input FILE --out FILE');
 const original=JSON.parse(fs.readFileSync(get('--input'),'utf8')),candidate=repairDataVisualisationFeedback(original);
 fs.writeFileSync(get('--out'),JSON.stringify(candidate,null,2)+'\n');console.log(JSON.stringify({revision:original.revision,changedBlocks:candidate.sections.flatMap(s=>s.blocks).filter(b=>b.feedbackRepair==='data-feedback-264').map(b=>b.id)}));
}
