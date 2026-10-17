// Queues for pending first-pass findings (user request of 17 October 2026). Each pending
// finding is sorted into one queue so the teacher sees only the decisions that are theirs;
// see docs/booklet-first-pass-review.md#queues-for-pending-findings-17-october-2026.
//  a  technical failure: the repair worker could not see or reach what it needed, returned
//     nothing, failed, or the repair could not be verified. Rerun with wider access.
//  b  a mechanical rule in an area the teacher almost always accepts, needing no content
//     change. Applied through the guarded apply path.
//  c  a content or teaching decision. Stays a Studio comment, one per repeated pattern.
//  d  stale: a target changed since the finding. Confirmed against the current revision.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 BASE,EDITIONS,LIMITS,bookletIndex,targetsUnchanged,blockHash,contentHash,provenanceFile,loadProvenance,saveProvenance,setState,commentNote,reconcile,
 callWorker,pool,defaultRunner,defaultLease,defaultMapPages,defaultRenderImages,canonicalRunDir
} from './review.mjs';

export const QUEUES=Object.freeze({a:'technical failure',b:'mechanical rule',c:'content or teaching decision',d:'stale'});
// Areas whose repaired findings the teacher kept almost without exception (17 October 2026).
export const MECHANICAL_AREAS=Object.freeze(['pagination','labels','spacing','table','diagram','answers','alignment']);
const TEACHING_AREAS=new Set(['review','extension','duplicate']);

// Worker notes, in the order they are tested. The first match decides.
const NOTE_RULES=[
 ['a','no-output',/returned no patch|returned nothing|applies nothing|no valid replacement patch/i],
 ['a','worker-failed',/repair worker failed|retry repair failed|codex exited|invalid arrangement/i],
 ['c','content',/^would change content/i],
 // A guard refusal on a layout field the renderer reads is the tool's fault; one on answer or prompt text is not.
 ['c','content',/patch on \S*\/(answer|prompt|inlines|latex|code|tikz|spec|text|theorySolution)\b\S* is not a layout field/i],
 ['a','guard',/is not a layout field/i],
 ['a','stale-original',/original differs from the current value/i],
 ['c','content',/tikz|diagram'?s? code|new (labelled )?diagram|new diagram content|creat(e|ing) (a |new |two )?(labelled )?diagram|adding (a |two )?labelled|labelled \w+ diagrams? requires|requires? (a )?(new|redrawn?)|redraw|\/answer\b|answer (content|fields?|strings?|text)|protected (answer|mathematic|worked)|answers? (is|are) (stored as )?(plain |separate |eighteen |calculation |prose )*(strings|prose|text|explanations|calculations)|worked answers? (is|are)|short answers? (is|are) (stored|prose|strings|text)|restructur|text marks|inline (colou?r|text|mark)|font weight|\bbold\b|colou?r (change|edit|field|command)|block (creation|roles?|types?)|(restructur|recolou?r)\w* (those |the |these )?inlines|single text inline|pedagogy-role|creat(e|ing) a block|moving (the )?prompt content|student-(visible|facing) content|answer-visibility|heading subtitle|body text|diagram content|maths colour|forced break|explicit line breaks|clipped in the source|(changing|editing|removing|deleting|splitting) (the |its |their |that |all |each )?(latex|content|text|wording|prompt|mathematic|answer|instruction|inline|colou?r|solution|statistics|formula|repeated|vertex|calculation|working|component|concluding|final|green|black|step)|wording|content edit|changes? (mathematical |answer |prompt )?content|mathematical content|editing (the )?(latex|answer|mathematics|prompt)|latex (colour|explicitly|forces)|explicit in the latex|embedded in (the )?(latex|\/answer|worked-answer|answer|theorySolution|answer strings)|encoded in the worked|outside layout-only scope|changing (the )?(working|text and|mathematics)/i],
 ['a','unverified',/no verdict|cannot be verified|cannot verify|could not be verified|unverified|held for scoped review|verification failed|is not shown|not shown in|absent from the supplied after/i],
 ['a','no-render',/no (rendered )?(page )?images?|no rendered|rendered pages?|page images?|without (the )?render|measured|rendered (size|height|dimensions)|available(-| )height|remaining space/i],
 ['a','not-exposed',/\b(supplied|provided|given|compact)\b[^.]{0,100}\b(do(es)?|did)( not|n't)\b|\b(supplied|provided)\b[^.]{0,80}\b(expose|contain|provide|include|show|have|has|give|specify)s?\b[^.]{0,20}\bno\b|\bno\b[^.]{0,100}\b(is|are|was|were)? ?(supplied|provided|exposed|shown|given|included|available|documented)\b|\bnot (supplied|provided|exposed|shown|included|given)\b|\b(schema|excerpts?)\b|\bgenerated\b|\balready\b|cannot (see|identify|locate|determine|establish)|requires? (the|a) (supported|renderer|documented)/i],
];

// Which queue a pending finding belongs to now. `flag` is its Studio comment, if any.
export function classify(finding,{project,index=bookletIndex(project),flag=null,targetRemoved=false}={}){
 if(!['pending','stale'].includes(finding.state))return null;
 if(targetRemoved||finding.targets.some(target=>!index.blocks.has(target.blockId)))return {name:'d',reason:'target-removed'};
 if(!targetsUnchanged(finding,project,index))return {name:'d',reason:'target-changed'};
 if(finding.state==='stale')return {name:'d',reason:'marked-stale'};
 if(TEACHING_AREAS.has(finding.area))return {name:'c',reason:finding.area};
 if(finding.area==='response')return {name:'c',reason:'response-format'};
 if(!MECHANICAL_AREAS.includes(finding.area))return {name:'c',reason:'other-area'};
 if(!finding.applyOutcome)return {name:'b',reason:'not-attempted'};
 const note=String(finding.applyNote??'');
 for(const [name,reason,pattern] of NOTE_RULES)if(pattern.test(note))return {name,reason};
 return {name:'b',reason:finding.applyOutcome==='reverted'?'reverted-unfixed':'declined'};
}

const flagOf=(project,finding)=>(project.studio?.flags??[]).find(flag=>flag.kind==='first-pass'&&flag.findingId===finding.id)??null;
// Record the queue of every pending finding (finding IDs never change) and return counts.
export function classifyRecord(record,project,{feedbackStatus=null,at=new Date().toISOString()}={}){
 const index=bookletIndex(project),counts={a:0,b:0,c:0,d:0},reasons={};
 for(const finding of record.findings??[]){
  const flag=flagOf(project,finding);
  // A deleted or resolved comment is a teacher decision that `status` records first.
  if(finding.commentId&&(!flag||flag.resolved)&&!finding.groupedUnder){delete finding.queue;continue;}
  const queue=classify(finding,{project,index,flag,targetRemoved:!!flag&&feedbackStatus?.(project,flag)==='Target removed'});
  if(!queue){if(finding.queue&&!['pending','stale'].includes(finding.state))finding.queue={...finding.queue,closed:finding.state};continue;}
  const same=finding.queue?.name===queue.name&&finding.queue?.reason===queue.reason;
  finding.queue={...(same?finding.queue:{}),name:queue.name,reason:queue.reason,at:same?finding.queue.at:at,revision:project.revision??null};
  counts[queue.name]++;reasons[queue.name+':'+queue.reason]=(reasons[queue.name+':'+queue.reason]??0)+1;
 }
 return {counts,reasons};
}

// ---- skips ------------------------------------------------------------------------------

// Recent activity on an unresolved teacher comment holds the booklet for review.
// Resolved comments do not hold it, including their resolution/update timestamps.
export function teacherActive(project,{now=Date.now(),hours=24}={}){
 const since=now-hours*3600e3,times=[];
 for(const flag of project.studio?.flags??[]){
  if(flag.kind||flag.resolved)continue;
  for(const key of ['at','resolvedAt','updatedAt','editedAt'])if(flag[key]&&Date.parse(flag[key])>since)times.push(flag[key]);
 }
 return times.length?times.sort().at(-1):null;
}

// ---- patterns ---------------------------------------------------------------------------

const STOP=new Set('the a an and or of to in on at for with by from as is are be this that these those it its their them so each every all both one two three four five six seven eight nine ten than then into onto over under below above beside same other more less only also not no has have was were which where when there here use using make keep put give add set let can could would should may must page pages part parts question questions q block blocks'.split(' '));
export function signature(finding){
 const words=String(finding.comment??'').toLowerCase()
  .replace(/\b[\w]+(?:-[\w]+)+\b/g,' ')       // block and node ids
  .replace(/\b\d+[a-z]{0,3}\b|\b[a-z]\b|[a-z]\s*[–-]\s*[a-z]\b/g,' ') // numbers, part labels, ranges
  .split(/[^a-z]+/).filter(word=>word.length>2&&!STOP.has(word));
 return new Set(words.map(word=>word.replace(/(ing|ed|es|s)$/,'')));
}
const jaccard=(a,b)=>{let shared=0;for(const word of a)if(b.has(word))shared++;return shared/(a.size+b.size-shared||1);};
const leadVerb=finding=>String(finding.comment??'').toLowerCase().match(/[a-z]+/)?.[0]??'';
// Repeated instances of one queue (c) pattern in one booklet: the same area and edition, the
// same opening verb ("Move the … label", "Make the headers bold") and overlapping wording.
// Each group's first finding (page order) is its representative. Duplicates, reviews and
// extensions carry their own proposals and are never grouped.
export function patternGroups(findings,{threshold=0.3}={}){
 const rows=[...findings].sort((x,y)=>(x.page??1e9)-(y.page??1e9)||x.id.localeCompare(y.id)).map(finding=>({finding,words:signature(finding),verb:leadVerb(finding)}));
 const groups=[];
 for(const row of rows){
  const group=!TEACHING_AREAS.has(row.finding.area)&&groups.find(group=>group.area===row.finding.area&&group.edition===row.finding.edition&&group.rows.some(other=>other.verb===row.verb&&jaccard(other.words,row.words)>=threshold));
  if(group)group.rows.push(row);else groups.push({area:row.finding.area,edition:row.finding.edition,rows:[row]});
 }
 return groups.map(group=>group.rows.map(row=>row.finding));
}
export function patternNote(representative,members){
 const where=finding=>finding.targets.map(target=>target.id).join(', ')+(finding.page?` (p. ${finding.page})`:'');
 return `Same pattern at ${members.length} more place${members.length===1?'':'s'}; one decision covers all:\n`+members.map(finding=>`- ${where(finding)} · ${finding.id}: ${finding.comment.split('\n')[0]}`).join('\n');
}

// ---- report -----------------------------------------------------------------------------

// Decisions left for the teacher: open first-pass comments, counting a pattern once.
export function decisionsLeft(record,project){
 const flags=new Set((project.studio?.flags??[]).filter(flag=>flag.kind==='first-pass'&&!flag.resolved).map(flag=>flag.findingId));
 const open=(record.findings??[]).filter(finding=>['pending','stale'].includes(finding.state)&&flags.has(finding.id));
 const byQueue={};for(const finding of open){const name=finding.queue?.name??'?';byQueue[name]=(byQueue[name]??0)+1;}
 return {decisions:open.length,byQueue,groupedInstances:(record.findings??[]).filter(finding=>finding.groupedUnder&&['pending','stale'].includes(finding.state)).length};
}

// ---- operations ---------------------------------------------------------------------------

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^﻿/,''));
const nowIso=()=>new Date().toISOString();
const live=(root,id)=>path.join(root,'booklets','projects',id+'.json');
export function provenanceIds({root=ROOT,provenanceDir}={}){
 const dir=provenanceDir??path.join(root,'booklets','provenance','first-pass-review');
 return fs.existsSync(dir)?fs.readdirSync(dir).filter(name=>name.endsWith('.json')).map(name=>name.slice(0,-5)).sort():[];
}

// `status --queues`: record comment decisions, then the queue of every pending finding.
export async function queueStatus({ids,root=ROOT,provenanceDir,now=Date.now()}={}){
 const {feedbackStatus}=await import('../src/lib/booklet-feedback.js');
 const rows=[],totals={a:0,b:0,c:0,d:0},reasons={},errors=[];
 for(const id of ids??provenanceIds({root,provenanceDir})){
  const projectFile=live(root,id);
  if(!fs.existsSync(projectFile)){errors.push(id+': no live project');continue;}
  try{await reconcile({projectFile,root,provenanceDir});}catch(error){errors.push(id+': '+error.message);continue;}
  const project=read(projectFile),file=provenanceFile(id,{root,provenanceDir}),record=loadProvenance(file,project);
  const {counts,reasons:own}=classifyRecord(record,project,{feedbackStatus});
  saveProvenance(file,record);
  for(const name of Object.keys(totals))totals[name]+=counts[name];
  for(const [key,count] of Object.entries(own))reasons[key]=(reasons[key]??0)+count;
  rows.push({project:id,revision:project.revision??null,queues:counts,...decisionsLeft(record,project),teacherActive:teacherActive(project,{now})});
 }
 return {totals,pending:Object.values(totals).reduce((sum,count)=>sum+count,0),reasons,booklets:rows,errors};
}

const flagFor=(project,finding)=>(project.studio?.flags??[]).find(flag=>flag.kind==='first-pass'&&flag.findingId===finding.id)??null;
const anchorFlag=(createFeedback,project,finding,note)=>{
 const anchor=id=>createFeedback(project,{rootId:id,edition:finding.edition},note,finding.scope);
 let comment;try{comment=anchor(finding.targets[0].id);}catch{comment=anchor(finding.targets[0].blockId);}
 return {...comment,kind:'first-pass',findingId:finding.id,area:finding.area};
};
// A first-pass duplicate that a pedagogy duplicate-question comment already raises on the same block.
function pedagogyCover(project,index,finding){
 const own=new Set(finding.targets.flatMap(target=>[...(index.ids.get(target.blockId)??[target.blockId])]));
 return (project.studio?.flags??[]).find(flag=>flag.kind==='pedagogy-review'&&/duplicate/i.test(flag.note??'')&&[flag.targetId,flag.anchor?.rootId].some(id=>id&&own.has(id)))??null;
}

// Queue (c), plus findings whose queue rerun did not repair them: one Studio comment per
// repeated pattern. The representative lists every affected block; the others are folded
// into it and take its decision. Unposted singletons are posted as ordinary comments.
export async function groupComments({projectFile,root=ROOT,provenanceDir,dry=false}={}){
 const {createFeedback,feedbackStatus}=await import('../src/lib/booklet-feedback.js');
 const {openProject}=await import('../scripts/booklet/lean-review.mjs');
 const handle=openProject(projectFile,{root}),project=handle.project,index=bookletIndex(project),file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project);
 classifyRecord(record,project,{feedbackStatus});
 const covered=[],eligible=[];
 for(const finding of record.findings??[]){
  if(finding.state!=='pending'||finding.groupedUnder||!finding.queue)continue;
  const rerunLeft=['a','b'].includes(finding.queue.name)&&finding.queueRerun&&finding.applyOutcome!=='repaired';
  if(finding.queue.name!=='c'&&!rerunLeft)continue;
  const flag=flagFor(project,finding);
  if(flag&&finding.postedNote&&flag.note!==finding.postedNote)continue; // the teacher has edited it: leave it alone
  if(finding.area==='duplicate'&&!flag){const cover=pedagogyCover(project,index,finding);if(cover){finding.queue.coveredBy=cover.id;covered.push(finding.id);continue;}}
  eligible.push(finding);
 }
 const flags=[...(project.studio?.flags??[])],grouped=[],posted=[];
 for(const group of patternGroups(eligible)){
  const representative=group.find(finding=>flagFor(project,finding))??group[0],members=group.filter(finding=>finding!==representative);
  if(!members.length&&flagFor(project,representative))continue;
  const note=commentNote(representative)+(members.length?'\n'+patternNote(representative,members):'');
  const at=flags.findIndex(flag=>flag.kind==='first-pass'&&flag.findingId===representative.id);
  if(at>=0)flags[at]={...flags[at],note};else{const flag=anchorFlag(createFeedback,project,representative,note);flags.push(flag);Object.assign(representative,{commentId:flag.id,postedAt:flag.at});posted.push(representative.id);}
  representative.postedNote=note;
  if(members.length){representative.patternMembers=members.map(finding=>finding.id);grouped.push({representative:representative.id,members:representative.patternMembers});}
  for(const member of members){
   const own=flags.findIndex(flag=>flag.kind==='first-pass'&&flag.findingId===member.id);if(own>=0)flags.splice(own,1);
   member.groupedUnder=representative.id;(member.history??=[]).push({state:member.state,at:nowIso(),note:'Grouped under pattern comment '+representative.id+'.'});
  }
 }
 const result={project:project.id,grouped,posted,coveredByPedagogy:covered,folded:grouped.reduce((sum,row)=>sum+row.members.length,0),errors:[]};
 if(dry)return result;
 if(grouped.length||posted.length){
  project.studio={version:1,...project.studio,flags};
  await handle.save();
  const saved=read(handle.file),present=new Set((saved.studio?.flags??[]).filter(flag=>flag.kind==='first-pass').map(flag=>flag.findingId));
  const lost=[...grouped.map(row=>row.representative),...posted].filter(id=>!present.has(id));
  if(lost.length)result.errors.push('Saved project is missing comments for '+lost.join(', '));
  record.postedRevision=saved.revision??null;result.revision=saved.revision??null;
 }
 saveProvenance(file,record);
 return result;
}

// Queue (d): a target changed since the finding. A removed target closes the finding. For a
// changed one, a worker looks at the current pages: an issue that no longer shows is closed
// (its comment resolved); one that still shows is re-anchored to the current blocks and queued again.
export function confirmPrompt(input){
 return 'You check whether review comments on a printed MathsMap booklet still apply. Do not run commands or open files. Each attached image has an entry in "pages" with its edition, physical page, block IDs and image number; they show the booklet as it is now. The blocks have been edited since each comment was written. For each finding, say whether the problem it describes is still visible on these pages. present:true means it is still there and its fix is still wanted; present:false means it is fixed or no longer applies; present:null means the pages do not show enough to tell.\nReturn one JSON object and nothing else: {"findings":[{"id":"FINDING_ID","present":true|false|null,"note":"short reason"}]} with exactly one entry per finding.\nInput:\n'+JSON.stringify(input);
}
export async function confirmStale({projectFile,root=ROOT,provenanceDir,runner=defaultRunner,lease=defaultLease,base=BASE,dry=false,log=()=>{}}={}){
 const {feedbackStatus}=await import('../src/lib/booklet-feedback.js');
 const {openProject}=await import('../scripts/booklet/lean-review.mjs');
 const handle=openProject(projectFile,{root}),project=handle.project,index=bookletIndex(project),file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project);
 classifyRecord(record,project,{feedbackStatus});
 const stale=(record.findings??[]).filter(finding=>finding.queue?.name==='d'&&['pending','stale'].includes(finding.state)&&!finding.groupedUnder);
 const result={project:project.id,closed:[],requeued:[],unsure:[],errors:[]};
 if(!stale.length)return result;
 const removed=stale.filter(finding=>finding.queue.reason==='target-removed'),changed=stale.filter(finding=>!removed.includes(finding));
 if(dry)return {...result,wouldCheck:changed.map(finding=>finding.id),wouldClose:removed.map(finding=>finding.id)};
 const verdicts=new Map(removed.map(finding=>[finding.id,{present:false,note:'Its target was removed.'}]));
 if(changed.length){
  const workDir=path.join(root,'.booklet-work','first-pass-review',project.id),dir=path.join(workDir,'render-'+contentHash(project).slice(0,12));
  const blocks=[...new Set(changed.flatMap(finding=>finding.targets.map(target=>target.blockId)))];
  const pagemap=await defaultMapPages({project,dir,base,fresh:false,root});
  const editions=new Set(['student',...changed.map(finding=>finding.edition)]);
  const selection={...Object.fromEntries(EDITIONS.map(edition=>[edition,editions.has(edition)?(pagemap[edition]??[]).filter(page=>(page.blocks??[]).some(id=>blocks.includes(id))):[]])),blocks};
  const rendered=await defaultRenderImages({project,dir,selection,pagemap,base,fresh:false,root,log});
  // One call per edition, at most twelve page images each.
  const calls=[];
  for(const edition of EDITIONS){
   let current={rows:[],images:[]};
   for(const finding of changed.filter(row=>row.edition===edition)){
    const own=new Set(finding.targets.map(target=>target.blockId)),pages=(pagemap[edition]??[]).filter(page=>(page.blocks??[]).some(id=>own.has(id))).slice(0,4);
    const files=pages.map(page=>rendered.images[edition]?.[page.page]);
    if(!files.length||files.some(file=>!file)){verdicts.set(finding.id,{present:null,note:'No current page raster shows its target.'});continue;}
    if(current.images.length+files.length>12&&current.rows.length){calls.push(current);current={rows:[],images:[]};}
    const entries=pages.map((page,i)=>{let at=current.images.indexOf(files[i]);if(at<0){current.images.push(files[i]);at=current.images.length-1;}return {edition,page:page.page,blocks:page.blocks,image:at+1};});
    current.rows.push({id:finding.id,area:finding.area,edition,targets:finding.targets.map(target=>target.id),comment:finding.comment,pages:entries});
   }
   if(current.rows.length)calls.push(current);
  }
  await pool(calls,LIMITS.concurrency,async call=>{
   try{
    const pages=[...new Map(call.rows.flatMap(row=>row.pages).map(page=>[page.image,page])).values()].sort((x,y)=>x.image-y.image);
    const {result:answer}=await callWorker({runner,lease,canonicalRunDir:canonicalRunDir(project,{root}),workDir,name:'confirm-stale',prompt:confirmPrompt({pages,findings:call.rows.map(({pages:own,...row})=>({...row,images:own.map(page=>page.image)}))}),images:call.images});
    for(const row of call.rows){const verdict=(answer?.findings??[]).find(item=>item?.id===row.id);verdicts.set(row.id,verdict&&[true,false,null].includes(verdict.present)?verdict:{present:null,note:'No verdict returned.'});}
   }catch(error){for(const row of call.rows)verdicts.set(row.id,{present:null,note:'Check failed: '+error.message});result.errors.push(error.message);}
  });
 }
 // The booklet may have been saved while the workers looked: act on the current file only if nothing moved.
 if(read(handle.file).revision!==project.revision){result.errors.push('The booklet was saved during the check; nothing was closed.');return result;}
 const flags=[...(project.studio?.flags??[])];let flagsChanged=false;
 for(const finding of stale){
  const verdict=verdicts.get(finding.id);if(!verdict)continue;
  finding.confirmation={at:nowIso(),revision:project.revision??null,present:verdict.present,note:String(verdict.note??'')};
  if(verdict.present===false){
   setState(finding,'closed',`Confirmed against revision ${project.revision}: ${verdict.note}`);result.closed.push(finding.id);
   const at=flags.findIndex(flag=>flag.kind==='first-pass'&&flag.findingId===finding.id);
   if(at>=0&&!flags[at].resolved){flags[at]={...flags[at],resolved:true,resolvedAt:nowIso(),resolution:`No longer applies (checked on revision ${project.revision}): ${verdict.note}`};flagsChanged=true;}
  }else if(verdict.present===true){
   finding.targets=finding.targets.map(target=>({...target,hash:blockHash(project,index,target.blockId)}));
   if(finding.state==='stale')setState(finding,'pending','Confirmed still present on revision '+project.revision+'.');
   result.requeued.push(finding.id);
  }else result.unsure.push(finding.id);
 }
 classifyRecord(record,project,{feedbackStatus});
 if(flagsChanged){project.studio={version:1,...project.studio,flags};await handle.save();result.revision=read(handle.file).revision??null;}
 saveProvenance(file,record);
 return result;
}
