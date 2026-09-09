import fs from 'node:fs';
import assert from 'node:assert/strict';
import katex from 'katex';
import {saveBookletProject} from './project-studio-server.mjs';
import {spaceFractionSteps} from '../../public/libs/maths-editor/equation-spacing.mjs';
const p=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json')),before=structuredClone(p);
const blocks=p.sections.flatMap(s=>s.blocks),byId=new Map(blocks.map(b=>[b.id,b])),changes=[];
const box=(w=8,h=4)=>String.raw`\boxed{\rule{0pt}{${h}mm}\hspace{${w}mm}}`;
const blue=x=>String.raw`\textcolor{#0000ff}{${x}}`,sourceBox=x=>String.raw`\textcolor{#253f8e}{${x}}`;
const B=box(),F=box(12),E=sourceBox(box(4,3)),S=sourceBox(box(5)),times=String.raw`\times `;
const frac=(a,b)=>String.raw`\frac{${a}}{${b}}`;
const aligned=rows=>String.raw`\begin{aligned}${rows.join('\\\\[2mm]')}\end{aligned}`;
function replace(block,node,latex,{root=false,scaffold=false}={}){
 if(!node.questionDiagrams?.length)return;
 katex.renderToString(spaceFractionSteps(latex),{throwOnError:true});
 const originals=structuredClone(node.questionDiagrams),field=root?'afterDiagramPrompt':'prompt';
 assert.ok(root||!node.prompt,'Do not overwrite existing instructions');
 node.sourceLayoutEvidence??={};node.sourceLayoutEvidence.transcribedVisuals=originals;
 node[field]='$'+latex+'$';node.questionDiagrams=[];
 if(scaffold){node.answerSpaceMm=0;node.responseSpace='scaffold';const r=block.sourceReview.responses?.find(r=>r.targetId===node.id);if(r)r.kind='cloze';}
 const redirect=n=>{if(!n||typeof n!=='object')return;if(originals.some(d=>d.id===n.ref)){n.ref=node.id+'/'+field;delete n.width;}for(const v of Object.values(n))if(v&&typeof v==='object')redirect(v);};redirect(p.settings.layoutOverrides);
 for(const e of p.source.inventory.entries)if(originals.some(d=>d.id===e.targetId)){e.targetId=node.id;e.field='native-maths:'+e.id;e.mappingNote='Complete source equation/scaffold transcribed natively, with original raster retained as evidence.';}
 changes.push({block:block.id,node:node.id,sourcePages:block.sourceRefs,field,latex,originals});
}
const rootExamples={
 'index-t4-q8':aligned(['&5m^0+7','&'+blue('=5'+times+'1+7=12')]),
 'index-t5-q6':aligned(['(3x^0)^3&'+blue('=(3'+times+'1)^3'),'&'+blue('=(3)^3'),'&'+blue('=27')]),
 'index-t6-q5':frac(String.raw`\cancel{b^2}\cancel{e^2}`,String.raw`\color{#0000ff}\cancel{b^3}^{\!1}\cancel{e^4}^{\!2}`)+String.raw`=\frac1{be^2}\qquad`+frac(String.raw`\color{#0000ff}\cancel{b^5}^{\!4}\cancel{e^5}^{\!2}`,String.raw`\cancel b\cancel{e^3}`)+String.raw`=b^4e^2`,
 'index-t7-q16':frac('v^4x^5'+times+'5v^3','4vx^3'+times+'3xv')+blue('='+frac('5v^7x^5','12v^2x^4')+'='+frac('5v^5x','12')),
 'index-t7-q23':frac('3v^4x^5'+times+'v^3','2vx^3'+times+'6xv')+blue('='+frac('3v^7x^5','12v^2x^4')+'='+frac('v^5x','4'))
};
for(const[id,latex]of Object.entries(rootExamples)){const b=byId.get(id);replace(b,b.content,latex,{root:true});}
for(const [i,c,v,power]of [[0,5,'n',4],[1,8,'p',3],[2,2,'h',9]]){const b=byId.get('index-t5-q6');replace(b,b.content.children[i],aligned([`&(${c}${v}^0)^{${power}}`,`&=(${B}${times}${B})^{${power}}`,`&=${B}^{${power}}=${F}`]),{scaffold:true});}
{
 const b=byId.get('index-t6-q5');b.content.children.forEach((n,i)=>replace(b,n,n.mathematicalExpression+'='+(i<8?([1,5,6].includes(i)?frac(B,B):B):''),{scaffold:i<8}));
}
{
 const b=byId.get('index-t7-q2');b.content.children.forEach((n,i)=>{const base=['6','a','5','m'][i],op=i<2?'+':'-';replace(b,n,n.mathematicalExpression+`=${base}^{${E}${op}${E}}=${base}^{${E}}`,{scaffold:true});});
}
{
 const b=byId.get('index-t7-q16');b.content.children.forEach((n,i)=>replace(b,n,i<2?aligned([n.mathematicalExpression+'&='+frac(F,F),'&='+frac(B,B)]):n.mathematicalExpression,{scaffold:i<2}));
}
{
 const b=byId.get('index-t7-q22');b.content.children.forEach((n,i)=>replace(b,n,i<6?aligned([n.mathematicalExpression+'&='+frac(B,B),'&='+([0,4,5].includes(i)?B:frac(B,B))]):n.mathematicalExpression,{scaffold:i<6}));
}
{
 const b=byId.get('index-t8-q1');
 replace(b,b.content.children[0],aligned([`(5a)^3&=5a${times}${S}${times}${S}`,`&=5${times}5${times}5${times}a${times}${S}${times}${S}`,`&=5^3${times}${S}`]),{scaffold:true});
 replace(b,b.content.children[1],aligned([`(ab)^4&=ab${times}${S}${times}${S}${times}${S}`,`&=a${times}${S}${times}${S}${times}${S}`,`&\\phantom{=}${sourceBox(times+'b')}${times}${S}${times}${S}${times}${S}`,`&=a^4${times}${S}`]),{scaffold:true});
}
{
 const b=byId.get('index-t8-q16');b.content.children.forEach((n,i)=>{
 const latex=i===0?aligned(['&'+n.mathematicalExpression, '&'+blue('='+String.raw`\underset{\boxed{\text{Expand}}}{\underline{x^6b^3\times x^8b^4}}`),'&'+blue('='+String.raw`\underset{\boxed{\text{Simplify}}}{\underline{x^{14}b^7}}`)]):aligned(['&'+n.mathematicalExpression,'&='+String.raw`\underline{\hspace{30mm}}`,'&='+String.raw`\underline{\hspace{24mm}}`]);
 replace(b,n,latex,{scaffold:true});
 });
}
{
 const b=byId.get('index-t9-q1');
 replace(b,b.content.children[0],aligned([String.raw`\left(\frac{x}{6}\right)^3&=\frac{x}{6}`+times+S+times+S,'&='+frac('x'+times+S+times+S,'6'+times+S+times+S),'&='+frac('x^3',S)]),{scaffold:true});
 const factors=Array(4).fill(S).join(times);
 replace(b,b.content.children[1],aligned([String.raw`\left(\frac{a}{b}\right)^5&=\frac{a}{b}`+times+factors,'&='+frac('a'+times+factors,'b'+times+factors),'&='+frac('a^5',S)]),{scaffold:true});
}
{
 const b=byId.get('index-t10-q5');b.content.children.forEach((n,i)=>{
 let latex=n.mathematicalExpression;
 if(i===0)latex=aligned(['&'+latex,'&'+blue('='+String.raw`\underset{\boxed{\text{Expand}}}{\frac{v^9x^3}{v^8x^8}}`),'&'+blue('='+String.raw`\underset{\boxed{\text{Simplify}}}{\frac{v}{x^5}}`)]);
 else if(i===1)latex=aligned([latex+'&='+frac(`a^{${box(4,3)}}b^{${box(4,3)}}`,`a^{${box(4,3)}}b^{${box(4,3)}}`),'&='+F]);
 else if(i===2)latex=aligned([latex+'&='+frac(`n^{${box(4,3)}}a^{${box(4,3)}}`,`n^{${box(4,3)}}a^{${box(4,3)}}`),'&='+frac(B,B)]);
 else if(i===3)latex+='=';
 replace(b,n,latex,{scaffold:i<3});
 });
}
for(const id of new Set(changes.map(c=>c.block))){
 const b=byId.get(id),r=b.sourceReview;delete r.verification;r.visualAudit={...r.visualAudit,checked:false};r.feedbackAudit={...r.feedbackAudit,status:'pending-render-comparison'};
 r.presentationRequirements=(r.presentationRequirements??[]).filter(req=>!req.path.includes('/questionDiagrams/'));
 r.nativeMathsReview={sourcePages:b.sourceRefs.map(r=>r.pageNumber),evidence:'.booklet-work/native-maths-sweep/source-review.json',status:'source-transcribed-awaiting-render-review'};
}
const answerSnapshot=p=>p.sections.flatMap(s=>s.blocks).filter(b=>b.type==='question').map(b=>{const rows=[];const walk=n=>{rows.push([n.id,n.answer]);n.children?.forEach(walk);};walk(b.content);return rows;});
assert.deepEqual(answerSnapshot(p),answerSnapshot(before));
if(changes.length){fs.mkdirSync('.booklet-work/native-maths-sweep',{recursive:true});fs.writeFileSync('.booklet-work/native-maths-sweep/before.json',JSON.stringify(before,null,2));fs.writeFileSync('.booklet-work/native-maths-sweep/source-review.json',JSON.stringify(changes,null,2));const saved=await saveBookletProject(p,{expectedRevision:before.revision});console.log({revision:saved.revision,converted:changes.length,blocks:new Set(changes.map(c=>c.block)).size});}
