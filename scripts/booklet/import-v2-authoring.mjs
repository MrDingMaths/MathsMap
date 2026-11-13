// Import pipeline v2, textbook track: authoring defaults and page-break continuations.
// Gated on importPolicy "import-v2" with contentScope "practice-only"; earlier runs
// keep their recorded behaviour.
import fs from 'node:fs';
import path from 'node:path';
import {importV2} from './import-completion.mjs';

export const v2Textbook=(manifest,config)=>importV2(manifest)&&config?.contentScope==='practice-only';

// Larger assignments: fewer calls and less repeated page context per question.
export const TEXTBOOK_ASSIGNMENT_DEFAULTS=Object.freeze({maxQuestions:8,maxCharacters:48000});
export function assignmentLimits(manifest,config){
  return {...(v2Textbook(manifest,config)?TEXTBOOK_ASSIGNMENT_DEFAULTS:{}),...(config?.assignmentLimits??{})};
}

export const CONTINUATION_FLAGS_PROMPT='PAGE BREAKS: If this page begins with the rest of a question printed on the previous page (its continued parts, items, table or grid without the stem), inventory one entry {id, kind:"question", sourceLabel:"N (continued)", continuesFromPreviousPage:true} and make the continued parts, diagrams and tables its children (parentId). Never exclude it and never inventory the previous page. If the last question on this page continues onto the next page, set continuesOnNextPage:true on that question\'s root entry. Leave both flags out otherwise.';

const live=e=>e?.kind==='question'&&!e.exclusionReason;
const roots=inventory=>(inventory?.entries??[]).filter(e=>live(e)&&!e.parentId);

// Pairs consecutive pages from the inventory flags. A flagged start with no flagged
// end on the previous page uses that page's last question root; a flagged end with
// no continuation entry on the next page is reported, not guessed.
export function deriveContinuations(inventories){
  const byPage=new Map(inventories.map(inv=>[inv.pageNumber,inv]));
  const continuations=[],warnings=[];
  for(const inv of inventories){
    const next=byPage.get(inv.pageNumber+1);
    const ends=roots(inv).filter(e=>e.continuesOnNextPage===true);
    let starts=next?roots(next).filter(e=>e.continuesFromPreviousPage===true):[];
    // Only the first page flagged it (Mastering Adv 11 Ch 6 p10, Ch 7 p30): pair with the next page's first
    // question when its printed label names the same question as continued ("2 (continued)").
    if(next&&!starts.length&&ends.length===1){
      const first=roots(next).find(e=>e.kind==='question'),number=label=>/(\d+)/.exec(String(label??''))?.[1];
      if(first&&/continued/i.test(first.sourceLabel??'')&&number(first.sourceLabel)&&number(first.sourceLabel)===number(ends[0].sourceLabel))starts=[first];
    }
    if(!next){if(ends.length)warnings.push(`Page ${inv.pageNumber} continues onto page ${inv.pageNumber+1}, which is not selected.`);continue;}
    if(starts.length>1||ends.length>1){warnings.push(`Pages ${inv.pageNumber}-${next.pageNumber}: more than one flagged continuation; declare it in assignmentLimits.continuations.`);continue;}
    if(!starts.length){if(ends.length)warnings.push(`Page ${inv.pageNumber} flags ${ends[0].id} as continuing, but page ${next.pageNumber} has no continuation question entry; rerun its inventory or declare it.`);continue;}
    const from=ends[0]??roots(inv).at(-1);
    if(!from){warnings.push(`Page ${next.pageNumber} starts with a continuation, but page ${inv.pageNumber} has no question to continue.`);continue;}
    continuations.push({from:inv.pageNumber,to:next.pageNumber,entryIds:[from.id,starts[0].id],derivedFrom:'inventory-flags'});
  }
  return {continuations,warnings};
}

// Declared continuations win; derived pairs fill only page pairs nobody declared.
export function mergeContinuations(declared=[],derived=[]){
  const covered=new Set(declared.map(pair=>(Array.isArray(pair)?pair:[pair.from,pair.to]).join('-')));
  return [...declared,...derived.filter(pair=>!covered.has(pair.from+'-'+pair.to))];
}

export function readPageInventories(runDir,pages){
  return pages.map(page=>path.join(runDir,'semantic-packets',`page-${String(page).padStart(3,'0')}.inventory.json`))
    .filter(file=>fs.existsSync(file)).map(file=>JSON.parse(fs.readFileSync(file,'utf8')));
}

// Before authoring a v2 textbook run: add derived continuations to the run config file,
// so the planner, the validators, the assembler and local repairs all read the same map.
export function applyDerivedContinuations({runDir,manifest,config,configFile}){
  if(!v2Textbook(manifest,config))return {config,added:[],warnings:[]};
  const {continuations,warnings}=deriveContinuations(readPageInventories(runDir,manifest.selectedPages??[]));
  const declared=config.assignmentLimits?.continuations??manifest.continuations??[];
  const merged=mergeContinuations(declared,continuations),added=merged.slice(declared.length);
  if(!added.length)return {config,added,warnings};
  const next={...config,assignmentLimits:{...(config.assignmentLimits??{}),continuations:merged}};
  if(configFile)fs.writeFileSync(configFile,JSON.stringify(next,null,2)+'\n');
  return {config:next,added,warnings};
}
