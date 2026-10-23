// Studio flags of the polish pipeline (23 October 2026; docs/booklet-verification-speed.md). Pure helpers on a
// project object: what the teacher owns, the two kinds of comment the pipeline leaves for the teacher, and the
// closing of older machine findings. Teacher comments (a flag with no kind and an `at`) are never touched.
import {createFeedback} from '../src/lib/booklet-feedback.js';
import {teacherFlags,teacherBlocks} from './guards.mjs';
export {teacherFlags,teacherBlocks} from './guards.mjs';

export const KIND_BREAK='polish-break-suggestion';
export const KIND_PEDAGOGY='pedagogy-suggestion';
// Machine findings of earlier runs that a new polish review replaces.
export const SUPERSEDED_KINDS=Object.freeze(['first-pass','pedagogy-review']);
const flagsOf=project=>project.studio?.flags??[];
const withFlags=(project,flags)=>({...project,studio:{version:1,...project.studio,flags}});

// Blocks the teacher has decided: the owner of every target of a teacher comment (open or resolved) and a block
// with a repair that was not automated. Polish never changes these by itself.

// One unresolved comment per forced exercise break with room to remove it. The button in the Comments pane runs
// setPageBoundary(project, firstBlockId, 'remove'), the Page tab's own action. Only suggestions that save a page.
export function breakSuggestionNote(item,exerciseLabel){
 const pages=item.estPagesSaved===1?'1 page':item.estPagesSaved+' pages';
 return `[Polish · page break · ${item.firstBlockId}]\nRemove the page break before ${exerciseLabel}: page ${item.pageBefore} has ${item.freeMm} mm free, and removing the break saves about ${pages}.${item.newSplits?` It splits ${item.newSplits} block${item.newSplits===1?'':'s'} across pages.`:''}`;
}
export function addBreakSuggestionFlags(project,suggestions,{labels={}}={}){
 const useful=suggestions.filter(item=>item.estPagesSaved>=1&&!item.issue);
 const stale=new Set(flagsOf(project).filter(flag=>flag.kind===KIND_BREAK&&!flag.resolved).map(flag=>flag.id));
 const kept=flagsOf(project).filter(flag=>!stale.has(flag.id)),added=[];
 let next=withFlags(project,kept);
 for(const item of useful){
  const note=breakSuggestionNote(item,labels[item.sectionId]??'this exercise');
  const flag={...createFeedback(next,{rootId:item.firstBlockId,edition:'student'},note,'local'),kind:KIND_BREAK,firstBlockId:item.firstBlockId,sectionId:item.sectionId,freeMm:item.freeMm,estPagesSaved:item.estPagesSaved};
  next=withFlags(next,[...flagsOf(next),flag]);added.push(flag.id);
 }
 return {project:next,added,replaced:stale.size};
}

// One comment per pedagogy suggestion (an extension or a bridging question). Never applied by the pipeline.
// items: [{id, targets:[node id, ...], note}]; a suggestion already present (same findingId) is left alone.
export function addPedagogySuggestionFlags(project,items){
 let next=project;const added=[];
 for(const item of items){
  if(flagsOf(next).some(flag=>flag.kind===KIND_PEDAGOGY&&flag.findingId===item.id&&!flag.resolved))continue;
  let comment;
  for(const target of item.targets){try{comment=createFeedback(next,{rootId:target,edition:'student'},item.note,'local');break;}catch{/* try the next target */}}
  if(!comment)continue;
  const flag={...comment,kind:KIND_PEDAGOGY,findingId:item.id};
  next=withFlags(next,[...flagsOf(next),flag]);added.push(flag.id);
 }
 return {project:next,added};
}

// Close the open machine findings of earlier runs once the new review has run. A teacher comment, a polish
// suggestion and anything already resolved stay as they are. `ids` limits the closing to flags that existed before
// this run (so a finding the new run posted itself is never closed by it).
export function supersedeMachineFlags(project,{date,ids=null}={}){
 const closed=[],at=new Date().toISOString();
 const flags=flagsOf(project).map(flag=>{
  if(!SUPERSEDED_KINDS.includes(flag.kind)||flag.resolved||ids&&!ids.has(flag.id))return flag;
  closed.push({id:flag.id,kind:flag.kind,findingId:flag.findingId??null});
  return {...flag,resolved:true,resolvedAt:at,resolution:'superseded by polish '+date};
 });
 return {project:closed.length?withFlags(project,flags):project,closed};
}
// The ids of the open machine flags now, taken before the run's own review adds or resolves any.
export const openMachineFlagIds=project=>new Set(flagsOf(project).filter(flag=>SUPERSEDED_KINDS.includes(flag.kind)&&!flag.resolved).map(flag=>flag.id));
