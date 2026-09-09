import fs from 'node:fs';
import {saveBookletProject} from './project-studio-server.mjs';
const p=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json')),before=structuredClone(p),changes=[];
const get=id=>p.sections.flatMap(s=>s.blocks).find(b=>b.id===id);
// TeX \makebox is unsupported by KaTeX: a phantom gives a bounded, writable node.
const cell=value=>String.raw`\textcolor{#002060}{\boxed{\textcolor{black}{\rule{0pt}{5mm}${value||'\\hspace{26mm}'}}}}`;
const graph=values=>String.raw`\begin{matrix}${cell(values[0])}&\!\rightarrow\!&${cell(values[1])}\\[-2pt]\downarrow&&\\[-2pt]${cell(values[2])}&&\downarrow\\[-2pt]\downarrow&&\\[-2pt]${cell(values[3])}&\!\rightarrow\!&${cell(values[4])}\end{matrix}`;
const charts=[
 ['(3x^4)^2','3^2\\times(x^4)^2','3x^4\\times3x^4','3\\times3\\times x^4\\times x^4','9x^8'],
 ['(5y^3)^2','','','',''],
 ['','','2a^3\\times2a^3\\times2a^3','',''],
 ['','2^4\\times(x^5)^4','','','']
];
const b=get('index-t8-q15');
for(const [i,n]of b.content.children.entries()){
 if(!n.questionDiagrams?.length)continue;
 const originals=structuredClone(n.questionDiagrams);n.sourceLayoutEvidence??={};n.sourceLayoutEvidence.transcribedVisuals=originals;
 const conclusion=i===0?'(3x^4)^2=9x^8':i===1?String.raw`(5y^3)^2=\underline{\hspace{15mm}}`:String.raw`\underline{\hspace{18mm}}=\underline{\hspace{18mm}}`;
 n.prompt='$'+graph(charts[i])+'$\n\n$'+conclusion+'$';n.questionDiagrams=[];n.answerSpaceMm=0;n.responseSpace='scaffold';
 const response=b.sourceReview.responses.find(r=>r.targetId===n.id);if(response)response.kind=i===0?'none':'cloze';
 for(const e of p.source.inventory.entries)if(originals.some(d=>d.id===e.targetId)){e.targetId=n.id;e.field='native-flowchart:'+e.id;}
 changes.push({block:b.id,node:n.id,originals,after:n.prompt});
}
// Square diagrams retain their equal-side ticks, four right-angle markers and source labels.
const q=get('index-t8-q12');
for(const [i,n]of q.content.children.entries()){
 const old=n.questionDiagrams[0];if(old.format!=='image')continue;
 n.sourceLayoutEvidence??={};n.sourceLayoutEvidence.transcribedVisuals=[structuredClone(old)];
 const label=['3a','2b^2','a^2b^3','3x^2y'][i],rotation=[0,12,0,35][i],above=[1,3].includes(i);
 const code=String.raw`\begin{tikzpicture}[x=7mm,y=7mm,line width=.45pt]
\begin{scope}[rotate=${rotation}]
\draw (0,0) rectangle (2,2);
\draw (.3,0)--(.3,.3)--(0,.3) (1.7,0)--(1.7,.3)--(2,.3) (2,1.7)--(1.7,1.7)--(1.7,2) (0,1.7)--(.3,1.7)--(.3,2);
\draw (1,-.1)--(1,.1) (1,1.9)--(1,2.1) (-.1,1)--(.1,1) (1.9,1)--(2.1,1);
\node[${above?'above':'below'},inner sep=1pt] at (1,${above?'2.12':'-.12'}) {$${label}$};
\end{scope}
\end{tikzpicture}`;
 n.questionDiagrams=[{id:old.id,format:'tikz',code,widthMm:old.widthMm,sourceRefs:old.sourceRefs,alt:'Square with side length $'+label+'$, equal-side ticks and right-angle marks',mathematicalModel:{kind:'square',sideLabel:label,rotationDegrees:rotation}}];changes.push({block:q.id,node:n.id,originals:[old],after:n.questionDiagrams[0]});
}
for(const id of new Set(changes.map(c=>c.block))){const block=get(id),r=block.sourceReview;delete r.verification;r.visualAudit={...r.visualAudit,checked:false};r.feedbackAudit={...r.feedbackAudit,status:'pending-render-comparison'};r.presentationRequirements=r.presentationRequirements.filter(req=>!req.path.includes('/questionDiagrams/'));r.nativeMathsReview={status:'source-transcribed-awaiting-render-review',evidence:'.booklet-work/native-maths-sweep/structures.json'};}
if(changes.length){fs.writeFileSync('.booklet-work/native-maths-sweep/before-structures.json',JSON.stringify(before,null,2));fs.writeFileSync('.booklet-work/native-maths-sweep/structures.json',JSON.stringify(changes,null,2));console.log((await saveBookletProject(p,{expectedRevision:p.revision})).revision);}