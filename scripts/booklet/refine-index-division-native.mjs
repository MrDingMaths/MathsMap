import fs from 'node:fs';
import assert from 'node:assert/strict';
import {saveBookletProject} from './project-studio-server.mjs';
import {normalizeDocument} from '../../public/libs/maths-editor/document-model.mjs';
import katex from 'katex';
const project=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json'));
const block=project.sections.flatMap(s=>s.blocks).find(b=>b.id==='index-t2-q9');
if (!block.content.questionDiagrams.length) process.exit(0);
const before=structuredClone(block);
const box=String.raw`\boxed{\rule{0pt}{4mm}\hspace{7mm}}`;
const example=String.raw`\frac{h^{\textcolor{blue}{\cancel{9}\,5}}}{h^{\textcolor{blue}{\cancel{4}}}}=h^5\qquad\frac{h^{\textcolor{blue}{\cancel{3}}}}{h^{\textcolor{blue}{\cancel{7}\,4}}}=\frac{1}{h^4}`;
function replace(node,latex,root=false){
 katex.renderToString(latex,{throwOnError:true});
 const originals=structuredClone(node.questionDiagrams),id=originals[0].id;
 node.sourceLayoutEvidence??={};node.sourceLayoutEvidence.transcribedVisuals=originals;
 node.prompt=root?normalizeDocument({blocks:[...node.prompt.blocks,{id,type:'paragraph',align:'center',spaceBefore:0,spaceAfter:0,inlines:[{type:'math',latex,display:false}]}]}):'$'+latex+'$';
 node.questionDiagrams=[];
 const redirect=n=>{if(!n||typeof n!=='object')return;if(originals.some(d=>d.id===n.ref)){n.ref=node.id+'/prompt'+(root?'#'+id:'');delete n.width;}Object.values(n).forEach(v=>{if(v&&typeof v==='object')redirect(v);});};
 redirect(project.settings.layoutOverrides);
 for(const e of project.source.inventory.entries)if(originals.some(d=>d.id===e.targetId)){e.targetId=root?id:node.id;e.field='native-equation:'+e.id;e.mappingNote='Source page 13 equation transcribed as editable maths; original raster retained in sourceLayoutEvidence.';}
}
replace(block.content,example,true);
block.content.children.forEach((n,i)=>{
 const suffix=i<6?([0,3,4].includes(i)?`\\frac{${box}}{${box}}`:box):'';
 replace(n,n.mathematicalExpression+'='+suffix);
 if(i<6){n.answerSpaceMm=0;n.responseSpace='scaffold';}
});
assert.deepEqual(block.content.children.map(n=>n.answer),before.content.children.map(n=>n.answer));
const review=block.sourceReview;delete review.verification;
review.visualAudit={...review.visualAudit,checked:false};review.feedbackAudit={...review.feedbackAudit,status:'pending-render-comparison'};
review.presentationRequirements=review.presentationRequirements.filter(r=>!r.path.includes('/questionDiagrams/'));
for(const [i,n] of [block.content,...block.content.children].entries()){
 const path=i===0?'/content':'/content/children/'+(i-1);
 review.presentationRequirements.push({path:path+'/questionDiagrams',value:[]},{path:path+'/prompt',value:structuredClone(n.prompt)});
}
fs.mkdirSync('.booklet-work/division-native',{recursive:true});
fs.writeFileSync('.booklet-work/division-native/before-q9.json',JSON.stringify(before,null,2));
const remaining=[];
for(const b of project.sections.flatMap(s=>s.blocks))if(b.type==='question'){
 const walk=n=>{if(n.mathematicalExpression&&n.questionDiagrams?.length)remaining.push(n.id);n.children?.forEach(walk);};walk(b.content);
}
fs.writeFileSync('.booklet-work/division-native/remaining-raster-review.json',JSON.stringify(remaining,null,2));
const saved=await saveBookletProject(project,{expectedRevision:project.revision});
console.log({revision:saved.revision,converted:13,remainingRasterCandidates:remaining.length});
