// Exact decorative-frame opt-in: Gradient–Intercept Form p33-q3-block only.
// Neither table contents nor the global mathematical task hash are normalized.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {normaliseQuestion} from '../../src/lib/practice-question-model.js';
import {sharedQuestion} from '../../src/lib/question-sync.js';
import {documentHtml,isDocument} from '../../src/lib/document-content.js';
import {renderMath} from '../../src/lib/render-math.js';

export const GRADIENT_TABLE_KIND='gradient-p33-q3-decorative-table-border-v1';
const id='p33-q3-block',projectId='gradient-intercept-form-v1';
const sourceHash='262de54ded22e387fca621dd1da770b300b2c2caed2339b6fd11d2d55176a0fc';
const targetHash='b8164acf5cca83b8c85a83d99d710ceaa89075347288914d3a3b930d41ea14f2';
const hash=v=>createHash('sha256').update(v).digest('hex');
const requireThat=(v,message)=>{if(!v)throw Error(message);};
const at=(v,p)=>p.reduce((v,k)=>v?.[k],v);
function pinned(a){requireThat(typeof a?.path==='string'&&/^[a-f0-9]{64}$/.test(a.sha256??''),'Missing pinned table-lineage artifact');const bytes=fs.readFileSync(a.path);requireThat(hash(bytes)===a.sha256,'Table-lineage artifact changed');return JSON.parse(bytes);}
const render=v=>isDocument(v)?documentHtml(v,{fillCloze:false}):renderMath(v??'');
function renderedAnswers(node,out=[]){
 if(!node||typeof node!=='object')return out;
 if(node.answer&&typeof node.answer==='object')out.push({id:node.id,value:node.answer,short:render(node.answer.short),worked:render(node.answer.worked)});
 for(const[k,v]of Object.entries(node))if(k!=='answer'&&v&&typeof v==='object')renderedAnswers(v,out);
 return out;
}
export function gradientTableRenderEvidence(source,target){
 const a=source.content?.prompt?.blocks?.[1],b=target.content?.prompt?.blocks?.[1];
 requireThat(a?.id==='p33-q3-equation-table'&&a.type==='table'&&a.border===true&&b?.border===false,'Unexpected decorative table');
 const equations=['x+y=3','x+2y=4','x-y=-1','y=\\dfrac{3x+1}{2}','y=2x-1','3x+2y=6','y=1-\\dfrac12x','x=2y-3'];
 requireThat(a.rows?.length===4&&a.rows.every(row=>row.length===2),'Equation-list shape changed');
 for(const[cell,i]of a.rows.flat().map((cell,i)=>[cell,i])){
  const letter=String.fromCharCode(97+i),p=cell.blocks?.[0];
  requireThat(cell.id==='p33-q3-cell-'+letter&&cell.type==='cell'&&cell.blocks.length===1&&p.id==='p33-q3-equation-'+letter&&p.type==='paragraph'&&same(p.inlines,[{type:'text',text:letter+'  '},{type:'math',latex:equations[i],display:false}]),'Equation, label, response cell or table relationship changed');
 }
 const projection=structuredClone(source);projection.content.prompt.blocks[1].border=false;
 requireThat(same(projection.content,target.content),'Other mathematical or response content changed');
 const student=render(target.content.prompt),projected=render(projection.content.prompt),answers=renderedAnswers(target.content);
 requireThat(student===projected&&same(renderedAnswers(source.content),answers),'Student or complete Short/Worked output changed');
 return {renderer:'shared documentHtml/renderMath; fillCloze=false',tableRole:'nonresponse labelled independent equation list a–h',shape:[4,2],sourceStudentOutputSha256:hash(render(source.content.prompt)),targetStudentOutputSha256:hash(student),borderOnlyProjectionOutputSha256:hash(projected),shortWorkedOutputSha256:hash(JSON.stringify(answers)),exactContentInverse:true};
}
export function checkedGradientTableProof(target,artifact,hooks){
 const proof=pinned(artifact);
 requireThat(proof.kind===GRADIENT_TABLE_KIND&&proof.projectId===projectId&&proof.blockId===id&&proof.sourceTaskHash===sourceHash&&proof.targetTaskHash===targetHash,'Foreign decorative-table scope');
 const source=at(pinned(proof.sourceArtifact),proof.sourceArtifact.blockPath),project=pinned(proof.targetArtifact),original=at(project,proof.targetArtifact.blockPath);
 requireThat(source?.id===id&&target.id===id&&original?.id===id&&project.id===projectId&&project.revision===381&&hooks.verifiedRating(source)&&hooks.reasoningTaskHash(source)===sourceHash&&hooks.reasoningTaskHash(original)===targetHash&&hooks.reasoningTaskHash(target)===targetHash,'Unverified or changed table task');
 const input=pinned(proof.ratedInputArtifact),rated=input.questions?.find(q=>q.id===id);
 requireThat(rated?.taskHash===sourceHash&&same(rated.task,sharedQuestion({...normaliseQuestion(source),title:''}).content),'Reconstructed source differs from actual rated input');
 const reply=pinned(proof.ratingReplyArtifact),rating=reply.ratings?.find(r=>r.id===id);
 requireThat(proof.ratingReplyArtifact.path===source.classification.assessment.evidence&&rating?.reasoningScore===source.classification.reasoningScore&&rating.difficultyReason===source.classification.difficultyReason,'Original raw assessment differs');
 const withoutClassification=b=>{const x=structuredClone(b);delete x.classification;return x;};
 requireThat(same(withoutClassification(target),withoutClassification(original)),'Current block changed outside rating');
 const mapping=c=>{const x=structuredClone(c);for(const k of ['reasoningScore','difficulty','difficultyReason','assessment'])delete x[k];return x;};
 requireThat(same(mapping(target.classification),mapping(original.classification)),'Current mapping changed');
 const inverse=structuredClone(original);requireThat(inverse.content.prompt.blocks[1].border===false,'Current table border is not false');inverse.content.prompt.blocks[1].border=true;
 requireThat(same(withoutClassification(inverse),withoutClassification(source)),'Non-border content, diagram, step or scaffold changed');
 requireThat(same(proof.change,{path:['content','prompt','blocks',1,'border'],before:true,after:false}),'Widened border change');
 requireThat(same(proof.renderEvidence,gradientTableRenderEvidence(source,original)),'Stale table renderer evidence');
 return {proof,source,originalTarget:original};
}
