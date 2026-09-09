// Follow-up to the source comparison: preserve evidence and save through bank sync.
import fs from 'node:fs';
import {visitDocument} from '../../public/libs/maths-editor/document-model.mjs';
import {saveBookletProject} from './project-studio-server.mjs';
const file='booklets/projects/index-laws-complete-v1.json';
const project=JSON.parse(fs.readFileSync(file));
const changed=[];
for(const b of project.sections.flatMap(s=>s.blocks)){
 let touched=false;
 if(b.id==='index-teaching-12')visitDocument(b.content,n=>{
  for(const inline of n.inlines??[])if(inline.type==='math'&&inline.latex.startsWith('\\begin{aligned}&')&&!inline.latex.includes('\\phantom')){
   inline.latex=inline.latex.replace('\\begin{aligned}&','\\begin{aligned}&\\phantom{{}={}}').replace('{= ','{{}= ');
   touched=true;
  }
 });
 if(b.content?.prompt?.blocks)visitDocument(b.content.prompt,n=>{
  if(n.arrangement==='speech-bubble'&&n.margin===2){n.margin=.5;touched=true;}
 });
 if(!touched)continue;
 for(const req of b.sourceReview?.presentationRequirements??[]){
  req.value=req.path.split('/').filter(Boolean).reduce((value,key)=>value?.[key],b);
 }
 if(b.sourceReview){
  delete b.sourceReview.verification;
  b.sourceReview.visualAudit={...b.sourceReview.visualAudit,checked:false};
  b.sourceReview.feedbackAudit={...b.sourceReview.feedbackAudit,status:'pending-render-comparison',note:'User follow-up: align the expression with the result after the equals sign in the first activity; tighten speech-bubble margins.'};
 }
 changed.push(b.id);
}
if(changed.length){
 const saved=await saveBookletProject(project,{expectedRevision:project.revision});
 console.log({revision:saved.revision,changed});
}else console.log('Already applied');
