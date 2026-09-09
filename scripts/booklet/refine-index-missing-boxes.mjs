import fs from 'node:fs';
import assert from 'node:assert/strict';
import {saveBookletProject} from './project-studio-server.mjs';
import {normalizeDocument} from '../../public/libs/maths-editor/document-model.mjs';
const project=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json')),before=structuredClone(project);
const blocks=project.sections.flatMap(s=>s.blocks),changes=[];
const small=String.raw`\boxed{\rule{0pt}{3mm}\hspace{3mm}}`,factor=String.raw`\boxed{\rule{0pt}{4mm}\hspace{8mm}}`,answer=String.raw`\boxed{\rule{0pt}{4mm}\hspace{14mm}}`;
function replace(block,node,latex){
 if(!node.questionDiagrams?.length)return;
 const originals=structuredClone(node.questionDiagrams),id=originals[0].id;
 node.sourceLayoutEvidence??={};node.sourceLayoutEvidence.transcribedVisuals=originals;
 const prefix=node.prompt?.blocks??(typeof node.prompt==='string'&&node.prompt.trim()?[{id:node.id+'-instruction',type:'paragraph',spaceAfter:1,inlines:[{type:'text',text:node.prompt}]}]:[]);
 node.prompt=normalizeDocument({blocks:[...prefix,{id,type:'paragraph',align:'left',spaceBefore:0,spaceAfter:0,inlines:[{type:'math',latex,display:false}]}]});
 node.questionDiagrams=[];node.answerSpaceMm=0;node.responseSpace='scaffold';
 for(const entry of project.source.inventory.entries)if(originals.some(d=>d.id===entry.targetId)){entry.targetId=id;entry.field='native-scaffold:'+entry.id;entry.mappingNote='Editable LaTeX missing-value boxes preserve the source expansion and exponent scaffold.';}
 for(const response of block.sourceReview.responses??[])if(response.targetId===node.id)response.kind='cloze';
 changes.push(node.id);
}
for(const b of blocks){
 const q=b.content;
 if(b.id==='index-t8-q2')for(const [i,base,letter,power,count]of [[1,3,'h',5,2],[2,5,'a',7,3],[3,2,'n',6,4]])replace(b,q.children[i],String.raw`\begin{aligned}(${base}${letter}^{${power}})^{${count}}&=${Array(count).fill(factor).join('\\times')}\\[2mm]&=${base}^{${small}}${letter}^{${small}}\\[2mm]&=${answer}\end{aligned}`);
 if(b.id==='index-t8-q6')for(const [i,base,letter,power,count]of [[1,3,'e',2,3],[2,5,'n',4,2],[3,2,'c',5,4],[4,3,'x',3,4]])replace(b,q.children[i],String.raw`\begin{aligned}(${base}${letter}^{${power}})^{${count}}&=${base}^{${small}}${letter}^{${small}}\\[2mm]&=${answer}\end{aligned}`);
 if(b.id==='index-t8-q7')replace(b,q.children[0],String.raw`(x^3y^2)^3=x^3y^2\times${factor}\times${factor}=${answer}`);
 if(b.id==='index-t8-q13')replace(b,q,String.raw`\left(10y^{${small}}\right)^{${small}}=100000y^{30}`);
 if(JSON.stringify(q)===JSON.stringify(before.sections.flatMap(s=>s.blocks).find(x=>x.id===b.id)?.content))continue;
 const review=b.sourceReview;delete review.verification;review.visualAudit={...review.visualAudit,checked:false};
 review.presentationRequirements=(review.presentationRequirements??[]).filter(r=>r.path.split('/').slice(1).reduce((n,k)=>n?.[k],b)!==undefined);
 const record=(n,path)=>{if(!n||typeof n!=='object')return;for(const[k,v]of Object.entries(n)){if(k==='sourceLayoutEvidence')continue;const p=path+'/'+k;if(['latex','columns','answerSpaceMm'].includes(k)){review.presentationRequirements=review.presentationRequirements.filter(r=>r.path!==p);review.presentationRequirements.push({path:p,value:v});}if(typeof v==='object')record(v,p);}};record(q,'/content');
}
function answers(p){let a=[];const visit=n=>{a.push([n.id,n.answer]);n.children?.forEach(visit)};p.sections.flatMap(s=>s.blocks).filter(b=>b.type==='question').forEach(b=>visit(b.content));return a;}
assert.deepEqual(answers(project),answers(before));
if(changes.length){fs.mkdirSync('.booklet-work/ex8-native',{recursive:true});fs.writeFileSync('.booklet-work/ex8-native/before.json',JSON.stringify(before,null,2));const saved=await saveBookletProject(project,{expectedRevision:before.revision});console.log({revision:saved.revision,changes});}
