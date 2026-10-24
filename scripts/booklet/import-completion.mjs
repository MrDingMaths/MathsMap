// One completion decision. Saving a revision is deliberately not acceptance.
import {createHash} from 'node:crypto';
export function completionHash(project){
 const {revision,updatedAt,...value}=project;
 const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>[k,canonical(v[k])])):v;
 return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}
export const COMPLETION_PROFILE='streamlined-import-v2';
export const SOURCE_VISUAL_PROFILE='source-layout-v2';
const optional=new Set(['extension','review','pedagogy-suggestion','polish-break-suggestion']);
const settled=new Set(['repaired','rejected','closed','accepted']);
export function assessCompletion({required=[],completed=[],pending=0,failed=[],ratingsMissing=[],shadingPending=0,visualPending=0,exportProblems=[],findings=[],unreliable=[],errors=[],warnings=[]}={}){
 const blockers=[];
 for(const name of required)if(!completed.includes(name))blockers.push('Missing required check: '+name);
 if(pending)blockers.push(pending+' content blocks have missing or stale reviews');
 if(failed.length)blockers.push('Content review failed: '+failed.join(', '));
 if(ratingsMissing.length)blockers.push(ratingsMissing.length+' practice ratings are missing or unverified');
 if(shadingPending)blockers.push(shadingPending+' shading reviews remain');
 if(visualPending)blockers.push(visualPending+' required page inspections remain');
 for(const row of findings){
  if(row.state==='repaired'&&row.visualVerified===false){blockers.push('Repair still needs affected-page verification: '+row.id);continue;}
  if(settled.has(row.state??row.outcome))continue;
  const message=row.comment??row.finding??row.note??row.id??'Unresolved finding';
  if(optional.has(row.area??row.kind)||row.disposition==='optional-polish')warnings=[...warnings,message];
  else blockers.push('Unresolved finding: '+message);
 }
 for(const row of unreliable)blockers.push('Inspection not reliable: '+(row.note??row.error??row.page??row));
 blockers.push(...exportProblems,...errors.map(row=>typeof row==='string'?row:row.error??JSON.stringify(row)));
 return {ready:!blockers.length,blockers:[...new Set(blockers)],warnings:[...new Set(warnings)]};
}
export function completionPolicy(manifest={}){
 return {enabled:manifest.completionProfile===COMPLETION_PROFILE,direct:manifest.completionRoute==='iceem-direct'};
}
