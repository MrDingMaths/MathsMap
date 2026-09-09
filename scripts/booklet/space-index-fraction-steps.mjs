import fs from 'node:fs';
import {saveBookletProject} from './project-studio-server.mjs';
// Historical migration helper; display policy now lives in the shared renderer.
import {spaceFractionSteps} from '../../public/libs/maths-editor/equation-spacing.mjs';
export {spaceFractionSteps};
if(process.argv[1]?.replaceAll('\\','/').endsWith('/space-index-fraction-steps.mjs')){
 const p=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json')),before=structuredClone(p),changes=[];
 for(const b of p.sections.flatMap(s=>s.blocks)){
  const changed=[];
  const walk=(n,path)=>{if(!n||typeof n!=='object')return;for(const[k,v]of Object.entries(n)){
   if(['sourceLayoutEvidence','sourceReview','sourceAtom','answer'].includes(k))continue;
   const at=path+'/'+k;
   if(k==='latex'&&typeof v==='string'){const next=spaceFractionSteps(v);if(next!==v){n[k]=next;changed.push({path:at,before:v,after:next});}}
   else if(v&&typeof v==='object')walk(v,at);
  }};walk(b.content,'/content');
  if(!changed.length)continue;
  const r=b.sourceReview;delete r.verification;r.visualAudit={...r.visualAudit,checked:false};r.feedbackAudit={...r.feedbackAudit,status:'pending-render-comparison'};
  // This is an explicit user layout preference, recorded separately from original evidence.
  r.authorLayoutAdjustments=[...(r.authorLayoutAdjustments??[]),{reason:'User requested more room between fraction steps, 9 September 2026.',changes:changed}];
  r.presentationRequirements=(r.presentationRequirements??[]).map(req=>{const change=changed.find(c=>c.path===req.path);return change?{...req,value:change.after}:req;});
  changes.push({id:b.id,changes:changed});
 }
 if(changes.length){fs.mkdirSync('.booklet-work/fraction-spacing',{recursive:true});fs.writeFileSync('.booklet-work/fraction-spacing/before.json',JSON.stringify(before,null,2));fs.writeFileSync('.booklet-work/fraction-spacing/changes.json',JSON.stringify(changes,null,2));const saved=await saveBookletProject(p,{expectedRevision:p.revision});console.log({revision:saved.revision,blocks:changes.length,equations:changes.reduce((n,b)=>n+b.changes.length,0)});}
}

