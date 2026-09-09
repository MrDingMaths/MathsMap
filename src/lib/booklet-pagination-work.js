import {fieldValue} from './booklet-document-controller.js';

export function canKeepPageEditor(session,previous,next){
  if(!session||session.paragraphSlice||!previous||previous.id!==next?.id)return false;
  const value=fieldValue({sections:[{blocks:next.blocks}]},session);
  if(value===undefined||value?._bookletSlice)return false;
  if(session.value?.blocks){const ids=session.fragmentIds??session.value.blocks.map(b=>b.id);return ids.every(id=>value?.blocks?.some(b=>b.id===id));}
  return true;
}

// Model edits replace changed branches; server metadata is not a layout change.
export function createPaginationKey(){
  const identities=new WeakMap();let next=0;
  const key=value=>{if(!value||typeof value!=='object')return value;if(!identities.has(value))identities.set(value,++next);return identities.get(value);};
  return (project,edition,options)=>JSON.stringify([project.id,project.title,project.subtitle,project.source?.runId,key(project.sections),key(project.topics),key(project.settings),edition,JSON.stringify(options)]);
}

// Yield even when every measurement is cached: a chain of resolved promises
// otherwise prevents the browser from painting or delivering new input.
export function createWorkYield({budgetMs=12,now=()=>performance.now(),pause=()=>new Promise(resolve=>setTimeout(resolve,0))}={}){
  let last=now();
  return async()=>{if(now()-last>=budgetMs){await pause();last=now();}};
}
