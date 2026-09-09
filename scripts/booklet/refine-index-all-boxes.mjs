import fs from 'node:fs';
import assert from 'node:assert/strict';
import {saveBookletProject} from './project-studio-server.mjs';
import {normalizeDocument,visitDocument} from '../../public/libs/maths-editor/document-model.mjs';
import {alignSourceLeadingEquals} from '../../src/lib/booklet-source-equation-rows.js';
import {equationTargets} from '../../public/libs/maths-editor/annotated-equation.mjs';
const project=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json'));
const before=structuredClone(project),changes=[];
const blocks=project.sections.flatMap(s=>s.blocks),byId=new Map(blocks.map(b=>[b.id,b]));
const redirect=(oldId,newId)=>{for(const e of project.source.inventory.entries)if(e.targetId===oldId){e.targetId=newId;e.field='native-equation:'+e.id;e.mappingNote='Editable equation and term arrows replace raster evidence.';}};
const arrowSpecs={
 'index-doc-1195':['(ab)^{m} = a^{m}b^{m}','m',['a','b']],
 'index-doc-1204':['(5b)^{2}','2',['5','b']],
 'index-doc-1210':['(3x^{2}y)^{4}','4',['3','x','y']],
 'index-doc-1213':['2(xy^{2})^{3}','3',['x','y']],
 'index-doc-1223':['(2a)^{3}','3',['2','a']],
 'index-doc-1390':['\\left(\\frac{a}{b}\\right)^{m}=\\frac{a^{m}}{b^{m}}','m',['a','b']]
};
function nativeArrows(nodes,block){
 for(let i=0;i<nodes.length;i++){
  const p=nodes[i],spec=arrowSpecs[p.id];
  if(spec&&p.type==='annotated-equation'){
   if(block.type==='question')p.align='left';
   const offset=p.latex.indexOf(spec[0]);
   for(const a of p.anchors){const term=equationTargets(spec[0]).find(t=>t.text===a.text);if(term){a.start=offset+term.start;a.end=a.start+a.text.length;}}
  }
  if(spec&&p.inlines?.some(x=>x.type==='inline-image')){
   const original=structuredClone(p),[expression,power,factors]=spec;
   let latex=expression;
   const following=nodes[i+1];
   if(following?.inlines?.length===1&&following.inlines[0].type==='math'&&following.inlines[0].latex.startsWith('\\textcolor')){
    latex=alignSourceLeadingEquals('\\begin{aligned}&'+expression+'\\\\[2pt]&'+following.inlines[0].latex+'\\end{aligned}');
    redirect(following.id,p.id);nodes.splice(i+1,1);
   }
   const offset=latex.indexOf(expression),anchors=[];
   const anchor=(text,start)=>{const a={id:p.id+'-term-'+anchors.length,text,start,end:start+text.length};anchors.push(a);return a.id;};
   const fromId=anchor(power,offset+expression.indexOf('^{'+power+'}')+2);
   const connections=factors.map((factor,j)=>({id:p.id+'-arrow-'+j,fromId,toId:anchor(factor,offset+equationTargets(expression).find(t=>t.text===factor).start),colour:'#ff616b',height:2.5+j*.6}));
   nodes[i]={id:p.id,type:'annotated-equation',latex,fontSize:null,width:spec[0].includes('=')?70:32,margin:0,gap:4,anchors,annotations:[],connections,...(block.type==='question'?{align:'left'}:{})};
   block.sourceLayoutEvidence??={};(block.sourceLayoutEvidence.replacedArrowRasters??=[]).push(original);
   for(const image of original.inlines)if(image.id)redirect(image.id,p.id);
  }
  const n=nodes[i];
  if(n.rows)for(const cell of n.rows.flat())nativeArrows(cell.blocks,block);
  if(n.slots)for(const slot of n.slots)nativeArrows(slot.blocks,block);
 }
}
for(const b of blocks){
 if(b.type==='rich-text'&&b.sourceAtom){
  nativeArrows(b.content.blocks,b);
  for(const n of b.content.blocks)if(n.type==='table'){
   n.marginBefore=0;
   for(const cell of n.rows[0]??[])if(cell.blocks[0]?.inlines?.some(x=>x.type==='text'&&x.text.trim()))cell.paddingTop=0;
   if(b.id==='index-teaching-369')for(const cell of n.rows[1]??[]){
    const first=cell.blocks[0];if(first.type==='annotated-equation')first.arrowSpace=3.7;else first.spaceBefore=3.7;
   }
  }
  visitDocument(b.content,n=>{
   if(n.type==='paragraph'){
    if(['index-teaching-207','index-teaching-209','index-teaching-369-example','index-teaching-412-example'].includes(b.id))n.align='left';
    for(const x of n.inlines??[])if(x.type==='math'){
     if(b.id==='index-teaching-412-example'&&x.latex.startsWith('\\begin{aligned}&')){
      // Source keeps the first equality on the first row and aligns the next =.
      x.latex=x.latex.replace('\\begin{aligned}&','\\begin{aligned}').replace(' \\textcolor{#0080ff}{=',' &\\textcolor{#0080ff}{=');
     }else x.latex=alignSourceLeadingEquals(x.latex);
    }
   }
  });
  b.content=normalizeDocument(b.content);
 }
 if(b.type==='question'){
  const visit=n=>{if(n.prompt?.blocks){nativeArrows(n.prompt.blocks,b);n.prompt=normalizeDocument(n.prompt);}n.children?.forEach(visit);};visit(b.content);
 }
}
const q5=byId.get('index-t7-q5');q5.content.columns=3;
for(const a of q5.sourceReview.arrangements)if(a.targetId===q5.content.id){a.columns=3;a.reason='Source PDF page 37: 27 parts in nine rows of three, read across each row.';}
const cards=byId.get('index-t7-q13').content.prompt.blocks.find(n=>n.arrangement==='cards');
cards.widthMm=96;cards.align='center';cards.gap=4;
cards.slots.forEach((s,i)=>{s.label=i%2?String.fromCharCode(65+(i-1)/2):String.fromCharCode(97+i/2);s.widthMm=i%2?(i<4?14:24):34;s.blocks[0].inlines=s.blocks[0].inlines.filter(x=>x.type!=='text');s.blocks[0].spaceAfter=0;});
for(const b of blocks){
 const old=before.sections.flatMap(s=>s.blocks).find(x=>x.id===b.id);
 if(JSON.stringify(old.content)===JSON.stringify(b.content))continue;
 // Keep existing original evidence; invalidate stale review signatures.
 const review=b.sourceReview;delete review.verification;review.visualAudit={...review.visualAudit,checked:false};review.feedbackAudit={...review.feedbackAudit,status:'pending-render-comparison'};
 review.presentationRequirements=(review.presentationRequirements??[]).flatMap(r=>{const v=r.path.split('/').slice(1).reduce((n,k)=>n?.[k],b);return v===undefined?[]:[{...r,value:v}];});
 const record=(n,path)=>{if(!n||typeof n!=='object')return;for(const[k,v]of Object.entries(n)){const p=path+'/'+k;
  if(['align','marginBefore','paddingTop','arrowSpace','spaceBefore','columns','widthMm','label','connections','latex'].includes(k)){review.presentationRequirements=review.presentationRequirements.filter(r=>r.path!==p);review.presentationRequirements.push({path:p,value:structuredClone(v)});}
  if(typeof v==='object')record(v,p);
 }};record(b.content,'/content');
 changes.push(b.id);
}
const answers=p=>p.sections.flatMap(s=>s.blocks).filter(b=>b.type==='question').map(b=>{const out=[];const visit=n=>{out.push([n.id,n.answer]);n.children?.forEach(visit);};visit(b.content);return out;});
assert.deepEqual(answers(project),answers(before));
if(changes.length){
 fs.mkdirSync('.booklet-work/all-boxes',{recursive:true});
 fs.writeFileSync('.booklet-work/all-boxes/before.json',JSON.stringify(before,null,2));
 fs.writeFileSync('.booklet-work/all-boxes/changes.json',JSON.stringify(changes,null,2));
 const saved=await saveBookletProject(project,{expectedRevision:before.revision});console.log({revision:saved.revision,changes});
}
