// Exact opt-in for the already reviewed Constructing/Using Functions p4-q1.
// This is not a general content normalizer or a new mathematical assessment.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {documentHtml,isDocument} from '../../src/lib/document-content.js';
import {renderMath} from '../../src/lib/render-math.js';
import {teachingAnswerCategory} from '../../src/lib/booklet-answer-options.js';

export const CONSTRUCT_BLANK_KIND='construct-functions-p4-q1-hidden-blank-presentation-v1';
const projectId='s6adv-working-with-functions-7-constructing-and-using-functions-v1';
const originalHash='d7bdc50841dd94d8047ad6f284a18fa02c08bbcd2c5ab06cb42e2c46fc3d8b96';
const currentHash='5387f320f69b22d6278cffe1bf648a733c9ca983e42fa8b84fd6f5b142f6b793';
const hash=value=>createHash('sha256').update(value).digest('hex');
const at=(v,p)=>p.reduce((v,k)=>v?.[k],v);
const blankPath=['content','children',0,'children',1,'prompt','blocks',2,'inlines',0];
const alignmentPaths=[0,1].map(i=>['content','children',i,'children',2,'prompt','blocks',1]);
const widths=[59.5,54,53.2,60.8,68.8,60.8,58.7,60.8];
const oldBlank={type:'cloze',answer:'$\\$2$ at 0 hours (initial cost)',width:57};
const newBlank={type:'math',latex:'\\rule{0pt}{5mm}\\hspace{57mm}',display:false};
const requireThat=(ok,message)=>{if(!ok)throw Error(message);};
function pinned(artifact){
 requireThat(typeof artifact?.path==='string'&&/^[a-f0-9]{64}$/.test(artifact.sha256??''),'Missing pinned blank-lineage artifact');
 const bytes=fs.readFileSync(artifact.path);requireThat(hash(bytes)===artifact.sha256,'Blank-lineage artifact changed');return JSON.parse(bytes);
}
function renderedValues(value,{answers=false}={}){
 const result=[];
 function walk(node,path=[]){
  if(!node||typeof node!=='object')return;
  for(const[key,v]of Object.entries(node)){
   if(key==='answer'){
    if(answers&&v&&typeof v==='object')result.push({path:[...path,key],value:v,short:render(v.short),worked:render(v.worked)});
    continue;
   }
   if(!answers&&key==='prompt')result.push({path:[...path,key],html:render(v)});
   else if(v&&typeof v==='object')walk(v,[...path,key]);
  }
 }
 const render=value=>isDocument(value)?documentHtml(value,{fillCloze:false}):renderMath(value??'');
 walk(value);return result;
}
// The evidence records actual shared document/KaTeX output. Only the exact
// response-placeholder and the two named paragraph alignments are substituted.
export function constructBlankRenderEvidence(source,target){
 requireThat(teachingAnswerCategory(source)===null&&teachingAnswerCategory(target)===null&&!source.sourceAtom&&!target.sourceAtom&&!source.presentation?.permanentTeachingPrompt&&!target.presentation?.permanentTeachingPrompt,'Prompt may be exposed in an answer/teaching mode');
 requireThat(same(at(source,blankPath),oldBlank)&&same(at(target,blankPath),newBlank),'Unexpected blank representation');
 const sourceDocument=source.content.children[0].children[1].prompt;
 const sourceHtml=documentHtml(sourceDocument,{fillCloze:false});
 requireThat(sourceHtml.includes('data-cloze=')&&!sourceHtml.replace(/<[^>]*>/g,'').includes('initial cost'),'Old response answer was visible');
 const projection=structuredClone(source);
 at(projection,blankPath.slice(0,-1))[0]=structuredClone(newBlank);
 for(const path of alignmentPaths)at(projection,path).align='left';
 const before=renderedValues(projection.content),after=renderedValues(target.content);
 const beforeAnswers=renderedValues(source.content,{answers:true}),afterAnswers=renderedValues(target.content,{answers:true});
 requireThat(same(before,after),'Student mathematical render output changed');
 requireThat(same(beforeAnswers,afterAnswers),'Complete Short/Worked content or render output changed');
 return {renderer:'shared documentHtml/renderMath; student fillCloze=false; independent compact answers',hiddenSourceAnswerVisible:false,studentOutputSha256:hash(JSON.stringify(after)),shortWorkedOutputSha256:hash(JSON.stringify(afterAnswers)),responseWidthMm:57,excludedPresentation:['exact response placeholder appearance','p4-a-equation-model alignment','p4-b-equation-model alignment']};
}
export function checkedConstructBlankProof(target,artifact,hooks){
 const proof=pinned(artifact);
 requireThat(proof.kind===CONSTRUCT_BLANK_KIND&&proof.projectId===projectId&&proof.blockId==='p4-q1'&&proof.sourceTaskHash===originalHash&&proof.targetTaskHash===currentHash,'Foreign blank-lineage scope');
 const sourceProject=pinned(proof.sourceArtifact),targetProject=pinned(proof.targetArtifact);
 requireThat(sourceProject.id===projectId&&targetProject.id===projectId&&targetProject.revision===8&&targetProject.studio?.flags?.length===9,'Foreign source/current snapshots');
 const source=at(sourceProject,proof.sourceArtifact.blockPath),originalTarget=at(targetProject,proof.targetArtifact.blockPath);
 requireThat(source?.id==='p4-q1'&&originalTarget?.id==='p4-q1'&&target.id==='p4-q1'&&hooks.verifiedRating(source)&&hooks.reasoningTaskHash(source)===originalHash&&hooks.reasoningTaskHash(originalTarget)===currentHash&&hooks.reasoningTaskHash(target)===currentHash,'Unverified original or changed current task');
 const withoutClassification=b=>{const copy=structuredClone(b);delete copy.classification;return copy;};
 requireThat(same(withoutClassification(target),withoutClassification(originalTarget)),'Current block changed outside assessment');
 const mapping=c=>{const v=structuredClone(c);for(const key of ['reasoningScore','difficulty','difficultyReason','assessment'])delete v[key];return v;};
 requireThat(same(mapping(target.classification),mapping(originalTarget.classification)),'Current skill or archetype mapping changed');
 const sourceLayout=structuredClone(source),layoutChanges=[];
 for(let i=0;i<8;i++){
  const path=['content','children',i,'questionDiagrams',0,'widthMm'];
  requireThat(at(source,path)===70&&at(originalTarget,path)===widths[i],'Unexpected diagram sizing change');
  at(sourceLayout,path.slice(0,-1)).widthMm=widths[i];layoutChanges.push({path,before:70,after:widths[i]});
 }
 requireThat(hooks.reuseReasoningRating(source,sourceLayout)!==null&&hooks.reasoningTaskHash(sourceLayout)===originalHash&&same(proof.layoutChanges,layoutChanges),'Existing layout compatibility failed');
 requireThat(same(at(sourceLayout,blankPath),oldBlank)&&same(at(originalTarget,blankPath),newBlank),'Unexpected hidden cloze or native blank');
 const inverse=structuredClone(originalTarget);
 at(inverse,blankPath.slice(0,-1))[0]=structuredClone(oldBlank);
 for(let i=0;i<2;i++){
  const path=alignmentPaths[i],a=at(sourceLayout,path),b=at(originalTarget,path);
  requireThat(a?.id===['p4-a-equation-model','p4-b-equation-model'][i]&&b?.id===a.id&&a.align==='center'&&b.align==='left','Unexpected alignment change');
  at(inverse,path).align='center';
 }
 requireThat(same(inverse.content,sourceLayout.content),'Other given, answer, diagram, step or scaffold changed');
 requireThat(same(proof.renderEvidence,constructBlankRenderEvidence(sourceLayout,originalTarget)),'Stale or foreign renderer evidence');
 return {proof,source,originalTarget,sourceLayout};
}
