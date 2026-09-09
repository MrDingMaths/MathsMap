import fs from 'node:fs';
import assert from 'node:assert/strict';
import {saveBookletProject} from './project-studio-server.mjs';

// Explicit source-reviewed repairs. Original sources and existing answers stay intact.
export function repairFeedback(project) {
 const p=structuredClone(project),blocks=p.sections.flatMap(s=>s.blocks),get=id=>blocks.find(b=>b.id===id);
 const syllabus=get('index-teaching-4').content;
 if(!JSON.stringify(syllabus).includes('MA5-IND-C-01'))syllabus.blocks.unshift({id:'index-teaching-3',type:'paragraph',align:'left',spaceBefore:0,spaceAfter:2,lineHeight:1.4,inlines:[{type:'text',text:'MA5-IND-C-01',marks:['bold']},{type:'text',text:' simplifies algebraic expressions involving positive-integer and zero indices, and establishes the meaning of negative indices for numerical bases',marks:[]}]});
 for(const [id,target,columns] of [['index-t8-q7','index-t8-q7-b',3],['index-t10-q3','index-t10-q3-root',4]]){
  const b=get(id),n=b.content.id===target?b.content:b.content.children.find(n=>n.id===target);
  n.layout='grid';n.columns=columns;
  const requirementPath=target===b.content.id?'/content/columns':'/content/children/1/columns';
  b.sourceReview.presentationRequirements=b.sourceReview.presentationRequirements.filter(r=>r.path!==requirementPath);
  b.sourceReview.presentationRequirements.push({path:requirementPath,value:columns});
  b.sourceReview.arrangements=b.sourceReview.arrangements.filter(a=>a.targetId!==target);
  b.sourceReview.arrangements.push({targetId:target,layout:'grid',columns,order:n.children.map(n=>n.id),reason:`PDF source page ${b.sourcePageNumber}: ${columns} columns in row reading order; feedback revision 175.`});
 }
 const box=body=>String.raw`\textcolor{#002060}{\boxed{\textcolor{black}{\rule[-1mm]{0pt}{6mm}\hspace{13mm}\mathclap{${body}}\hspace{13mm}}}}`;
 const values=[['(3x^4)^2','3^2\\times(x^4)^2','3x^4\\times3x^4','3\\times3\\times x^4\\times x^4','9x^8'],['(5y^3)^2','','','',''],['','','2a^3\\times2a^3\\times2a^3','',''],['','2^4\\times(x^5)^4','','','']];
 get('index-t8-q15').content.children.forEach((n,i)=>{
  const [a,b,c,d,e]=values[i].map(box),tail=n.prompt.split('\n\n').slice(1).join('\n\n');
  n.prompt=String.raw`$\begin{matrix}${a}&\!\rightarrow\!&${b}\\[-2pt]\downarrow&&\\[-2pt]${c}&&\downarrow\\[-2pt]\downarrow&&\\[-2pt]${d}&\!\rightarrow\!&${e}\end{matrix}$`+'\n\n'+tail;
 });
 get('index-t8-q16').content.children.forEach((n,i)=>{
  n.prompt=i===0?String.raw`$\begin{aligned}&(x^2b)^3\times(x^4b^2)^2\\[2mm]&\textcolor{#0000ff}{=x^6b^3\times x^8b^4\quad\boxed{\text{Expand}}}\\[2mm]&\textcolor{#0000ff}{=x^{14}b^7\quad\boxed{\text{Simplify}}}\end{aligned}$`:String.raw`$\begin{aligned}&${n.mathematicalExpression}\\[6mm]&=\hspace{30mm}\\[6mm]&=\hspace{24mm}\end{aligned}$`;
 });
 get('index-t10-q5').content.children[0].prompt=String.raw`$\begin{aligned}&\frac{(v^3x)^3}{(v^2x^2)^4}\\[2mm]&\textcolor{#0000ff}{=\frac{v^9x^3}{v^8x^8}\quad\boxed{\text{Expand}}}\\[2mm]&\textcolor{#0000ff}{=\frac{v}{x^5}\quad\boxed{\text{Simplify}}}\end{aligned}$`;
 const ids=['index-teaching-4','index-t8-q7','index-t8-q15','index-t8-q16','index-t10-q3','index-t10-q5'];
 for(const id of ids){const b=get(id);delete b.sourceReview.verification;b.sourceReview.feedbackR175={status:'awaiting-render-review',sourcePages:b.sourceRefs.map(r=>r.pageNumber)};}
 // Answers, source evidence, stable identities and bank ownership must survive.
 const protectedValues=q=>JSON.stringify(q.sections.flatMap(s=>s.blocks).map(b=>({id:b.id,bankRef:b.bankRef,sourceLayoutEvidence:b.sourceLayoutEvidence,answers:collect(b.content)})));
 function collect(n){return n?{id:n.id,answer:n.answer,sourceLayoutEvidence:n.sourceLayoutEvidence,children:n.children?.map(collect)}:null;}
 assert.equal(protectedValues(p),protectedValues(project));
 return p;
}
if(process.argv.includes('--apply')){
 const p=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json'));
 assert.equal(p.revision,175,'Reload and review changes before applying to another revision');
 fs.mkdirSync('.booklet-work/feedback-r175',{recursive:true});
 fs.writeFileSync('.booklet-work/feedback-r175/before.json',JSON.stringify(p,null,2));
 const saved=await saveBookletProject(repairFeedback(p),{expectedRevision:175});
 console.log('Saved revision',saved.revision);
}
