// Post-score pilot assembly. Initial candidates are read-only; every change is logged.
import fs from 'node:fs';
import path from 'node:path';
import {PILOT_REFERENCE as R,lineValues} from './pilot-reference.mjs';
import {cartesianTikz} from './linear-geometry.mjs';
import {documentValue as doc,sourceParagraph as p,xyTable} from './source-document.mjs';
import {correctLatePage} from './pilot-final-pages.mjs';
import {revisionHash} from './source-fidelity.mjs';
const base=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]??'output/linear-pilot');
const selection=JSON.parse(fs.readFileSync(path.join(base,'pilot-selection.json'))),scores=JSON.parse(fs.readFileSync(path.join(base,'blind-review/scores.json')));
if(!selection.initialScoringComplete)throw new Error('Finish initial scoring before assembling corrections.');
const walk=(v,fn)=>{if(!v||typeof v!=='object')return;fn(v);Object.values(v).forEach(c=>walk(c,fn));};
const text=v=>typeof v==='string'?v:JSON.stringify(v);
const paragraphs=(id,lines,size=10)=>doc(lines.map((s,i)=>p(id+'-p'+i,s,{fontSize:size})));
function working(id,m,c,x){const y=lineValues(m,c,x);return doc([xyTable(id+'-answered-table',x,y,{widthMm:62,rowHeight:6}),p(id+'-working',x.map((v,i)=>`$${m}(${v})${c<0?'':'+'}${c}=${y[i]}$`).join('; '),{fontSize:9,lineHeight:1.2})]);}
const changes=[];const pages=selection.pages.map(({pageNumber,sample,arm})=>{
 const manual=sample===null;
 const numbers=pageNumber===28?[7,8]:pageNumber===29?[1,2]:[5,6,7];
 const original=manual?{id:'page-'+pageNumber,pageNumber,section:{id:'page-'+pageNumber+'-section',title:pageNumber===29?'Systematically Finding the Rule $y=mx+c$ from a table':pageNumber===33?'Development':'',headingStyle:pageNumber===29?'page-title':pageNumber===33?'difficulty':'none',difficultyTitle:pageNumber===33?'Development':'',role:'mixed-practice'},blocks:numbers.map(n=>({id:`page-${pageNumber}-q${n}`,type:'question',sourceOrder:n,content:{id:`page-${pageNumber}-q${n}-node`,type:'question',prompt:'',layout:'list',children:[],questionDiagrams:[]}}))}:JSON.parse(fs.readFileSync(path.join(base,'blind-review',sample+'.json'))).pages.find(p=>p.pageNumber===pageNumber);
 if(!manual&&!scores.pages.some(p=>p.sample===sample&&p.page===pageNumber&&p.checkedModes.length===3))throw new Error('Selected page not scored: '+pageNumber);
 const page=structuredClone(original),notes=manual?['Reconstructed directly from the inspected source after all three packet attempts failed. This is manual recovery, excluded from initial model scores.']:[];
 page.blocks=page.blocks.filter(b=>!b.id.toLowerCase().includes('footer'));
 const nodes=new Map();walk(page,v=>{if(v.id)nodes.set(v.id,v);if(v.type==='table'){v.marginBefore=0;v.marginAfter=1;v.padding=.6;v.borderColour='#bdbdbd';v.borderWidthMm=.2;for(const row of v.rows)for(const cell of row){cell.align='center';cell.verticalAlign='middle';if(!/^\$?[xy]\$?$/.test((cell.blocks??[]).flatMap(b=>b.inlines??[]).map(i=>i.latex??i.text??'').join('')))cell.bold=false;}}
  if(v.type==='layout'){v.border=false;v.padding=0;v.margin=0;v.gap=3;}
  if(v.overlayOf){delete v.overlayOf;v.role='solution';}
  if(v.answer&&typeof v.answer==='object'&&!v.answer.worked)v.answer.worked=v.answer.short??'';
 });
 notes.push('Removed transcribed body footer; retained one automatic footer. Normalised cell alignment and explicit source layout margins. Full-frame answer graphs no longer masquerade as overlays.');
 if(pageNumber===2){for(const b of page.blocks)if(typeof b.content==='string')b.content=b.content.replace(/^- /gm,'• ');notes.push('Replaced literal hyphens with bullet glyphs; preserved all syllabus wording.');}
 if(pageNumber===3){walk(page,v=>{if(v.format==='tikz')v.widthMm=/vertical/i.test(text(v.spec))?10.5:75;});notes.push('Restored source-scale vertical number lines and populated all four worked numerical answers.');}
 if(pageNumber===7){page.blocks.filter(b=>b.type==='question').forEach((b,i)=>b.sourceOrder=4+i);const q4=page.blocks.find(b=>b.type==='question').content;
  q4.questionDiagrams[0].widthMm=92;q4.answer.solutionDiagrams[0].widthMm=105;q4.answer.solutionDiagrams[0].code=cartesianTikz({bounds:{xmin:-8,xmax:8,ymin:-6,ymax:6},points:Object.entries(R[7].q4).map(([label,[x,y]])=>({label,x,y,anchor:x>=7?'above left':'above right'}))});
  const q5=page.blocks.filter(b=>b.type==='question')[1].content;q5.questionDiagrams[0].widthMm=95;q5.answer.solutionDiagrams[0].widthMm=95;
  notes.push('Preserved source Q4/Q5 numbering and all given direction scaffolds. Replotted Q4 points from independently checked coordinates; removed double axes from Q5 solutions.');
 }
 if(pageNumber===9){const questions=page.blocks.filter(b=>b.type==='question');questions.forEach((b,i)=>{b.sourceOrder=8+i;b.content.diagramPlacement='right-of-prompt';b.content.layout='grid';b.content.columns=2;b.content.answerColumns=4;for(const d of b.content.questionDiagrams??[])d.widthMm=i===2?66:60;});
  for(const [index,key]of [[0,'q8'],[2,'q10']]){const root=questions[index].content;const first=root.children.find(n=>n.answer?.solutionDiagrams?.length).answer.solutionDiagrams[0];const shared={...first,id:root.id+'-shared-solution',widthMm:65,role:'solution',code:cartesianTikz({points:Object.entries(R[9][key]).map(([label,[x,y]])=>({label,x,y,anchor:y>=5?'below right':x>=5?'above left':'above right'}))})};delete shared.overlayOf;root.sharedSolutionDiagrams=[shared];for(const child of root.children){child.answer.solutionDiagrams=[];child.sharedSolutionDiagramId=shared.id;}}
  notes.push('Compacted question text beside its diagram. Combined per-point answer graphs into one actual labelled plot per shared source grid, preserving leaf identities and numeric answers. Restored Q8/Q9/Q10 numbers and all worked matching letters.');
 }
 if(pageNumber===13){const guided=page.blocks.find(b=>b.id==='page-13-guided');guided.content.children.forEach((n,i)=>{const r=R[13].guided[i];n.answer.worked=working(n.id,r.m,r.c,r.x);});walk(page,v=>{if(v.answerSpaceMm>0)v.answerSpaceMm=12;});notes.push('Kept example table and blue substitution working side by side, with compact review working space. Added worked substitutions and completed native tables for all guided parts.');}
 if(pageNumber===14){const qs=page.blocks.filter(b=>b.type==='question');qs.forEach((q,i)=>{q.compact=true;q.content.answerColumns=i===0?3:2;q.content.children.forEach((n,j)=>{const r=R[14]['q'+(i+1)][j];n.answer.worked=working(n.id,r.m,r.c,r.x);walk(n,v=>{if(v.type==='table'){v.marginBefore=0;v.marginAfter=0;v.rowHeights=v.rowHeights.map(h=>Math.min(h,7));if(i===0){v.borderColour='#111111';v.borderWidthMm=.45;}if(v.rows.length===1)v.rowHeights=[21];}});});});notes.push('Retained vertical substitution scaffolds, restored strong Q1 table borders, compacted table/part margins, and supplied every worked table with substitutions.');}
 if(pageNumber===16){const exampleBlock=page.blocks.find(b=>b.type==='worked-example');exampleBlock.presentation={layout:'worked-rows',numberSteps:false};const ex=exampleBlock.examples[0];page.blocks.splice(page.blocks.indexOf(exampleBlock),0,{id:'page-16-example-instruction',type:'rich-text',content:ex.prompt,sourceAtom:structuredClone(exampleBlock.sourceAtom)});ex.prompt='';ex.questionDiagrams.forEach(d=>{d.widthMm=60;d.code=cartesianTikz({lines:[{m:2,c:1}],points:[{x:0,y:1},{x:1,y:3}]});});const guided=page.blocks.find(b=>b.id==='page-16-guided');guided.content.children.forEach((n,i)=>{const r=R[16].guided[i];n.answer.worked=working(n.id,r.m,r.c,[0,1,2,3]);n.questionDiagrams.forEach(d=>{d.widthMm=56;d.code=cartesianTikz();});n.answer.solutionDiagrams.forEach(d=>{d.widthMm=56;d.code=cartesianTikz({lines:[r],points:[0,1,2,3].map(x=>({x,y:r.m*x+r.c})).filter(p=>p.y>=-5&&p.y<=5)});});});
  walk(page,v=>{if(v.type==='cloze'&&v.answer==='coordinate')v.answer='coordinate pair';if(typeof v.content==='string')v.content=v.content.replace('[[coordinate|','[[coordinate pair|');});notes.push('Moved worked graph beside its table. Independently replotted all three lines with exact clipped endpoints, and added guided worked tables. Completed coordinate pair key answer.');}
 if(pageNumber===24){const q=page.blocks.find(b=>b.type==='question');q.content.children.forEach((n,i)=>{const colour=R[24].verification[i]?'#16803d':'#d83131',mark=R[24].verification[i]?'\\checkmark':'\\times';const prefix=`$\\color{${colour}}{${mark}}$ `;n.answer.short=prefix+n.answer.short;n.answer.worked=prefix+n.answer.worked;n.answerSpaceMm=20;});notes.push('Retained all six given tables. Added green ticks/red crosses to correct answer decisions while keeping student answers hidden. Restored explicit Verify band label through the common renderer fix.');}
 correctLatePage(page,notes);
 changes.push({pageNumber,sample,arm,origin:manual?'manual-source-reconstruction':'scored-model-candidate',originalHash:revisionHash(original),correctedHash:revisionHash(page),notes});return page;
});
fs.mkdirSync(out,{recursive:true});const candidate={format:'mathsmap-exact-transcription-result-v2',runId:'linear-pilot-corrected-v1',title:'Linear Relationships — 12-page pilot',pages,assets:[],reviewFlags:[]};
fs.writeFileSync(path.join(out,'pilot.json'),JSON.stringify(candidate,null,2));fs.writeFileSync(path.join(out,'corrections.json'),JSON.stringify({assembledAt:new Date().toISOString(),initialComparison:path.join(base,'comparison.json'),changes},null,2));console.log('Corrected selected pages: '+pages.map(p=>p.pageNumber).join(','));
