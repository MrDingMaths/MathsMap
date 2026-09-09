import fs from 'node:fs';
import {saveBookletProject} from './project-studio-server.mjs';
import {alignSourceLeadingEquals} from '../../src/lib/booklet-source-equation-rows.js';
const project=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json'));
const changed=[];
for(const block of project.sections.flatMap(s=>s.blocks)){
 const requirements=[];
 function walk(node,path){
  if(!node||typeof node!=='object')return;
  for(const [key,value] of Object.entries(node)){
   const next=path+'/'+key;
   if(key==='colour'&&/^#(?:c00000|ff0000)$/i.test(value))node[key]='#aa0505';
   if(key==='latex'&&typeof value==='string'){
    node[key]=value.replace(/#(?:c00000|ff0000)/gi,'#aa0505');
    if(['index-teaching-66','index-teaching-67'].includes(block.id))node[key]=alignSourceLeadingEquals(node[key]);
   }
   if(key==='align'&&node.type==='paragraph'&&block.id==='index-teaching-128')node[key]='center';
   if(node[key]!==value)requirements.push({path:next,value:node[key]});
   if(typeof value==='object')walk(value,next);
  }
 }
 walk(block.content,'/content');
 if(!requirements.length)continue;
 const review=block.sourceReview;
 review.presentationRequirements=(review.presentationRequirements??[]).filter(r=>!requirements.some(n=>n.path===r.path)).concat(requirements);
 delete review.verification;
 review.visualAudit={...review.visualAudit,checked:false};
 review.feedbackAudit={...review.feedbackAudit,status:'pending-render-comparison'};
 changed.push({id:block.id,requirements});
}
if(changed.length){
 fs.mkdirSync('.booklet-work/alignment-followup',{recursive:true});
 fs.writeFileSync('.booklet-work/alignment-followup/source-presentation-changes.json',JSON.stringify(changed,null,2));
 const saved=await saveBookletProject(project,{expectedRevision:project.revision});
 console.log({revision:saved.revision,changed:changed.map(b=>b.id)});
}
