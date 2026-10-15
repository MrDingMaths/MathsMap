#!/usr/bin/env node
// Apply the layout findings of a first-pass review (user decision of 15 October 2026).
// A Sol low worker turns each group of findings on the same blocks into exact-field
// patches; guards keep the edit to layout; one revision-safe save applies the
// survivors; the automated checks and a bounded visual retry decide what stays. A finding
// that cannot be applied, or does not verify, becomes a comment for the teacher.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {fragmentQuestion} from '../src/lib/booklet-pagination.js';
import {normalizeArrangement} from '../public/libs/maths-editor/arrangement-model.mjs';
import {
 EDITIONS,contract,bookletIndex,overridesFor,blockEntry,blockHash,targetsUnchanged,provenanceFile,loadProvenance,saveProvenance,setState,commentNote,
 callWorker,pool,defaultRunner,defaultLease,defaultMapPages,defaultRenderImages,canonicalRunDir,contentHash,BASE
} from './review.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const now=()=>new Date().toISOString();
const relative=(root,file)=>path.relative(root,file).replaceAll('\\','/');

// Areas the worker may repair. Reviews, extensions and duplicates belong to the pedagogy review.
export const APPLY_AREAS=Object.freeze(['pagination','spacing','labels','response','table','alignment','answers','diagram']);
export const LEFT_AREAS=Object.freeze(['review','extension','duplicate']);

// ---- guards -------------------------------------------------------------------------

const LAYOUT_FIELDS=new Set(['align','verticalAlign','spaceBefore','spaceAfter','marginBefore','marginAfter','padding','paddingMm','margin','widths','rowHeights','border','borders','borderColour','background','headerBackground','widthMm','width','heightMm','gap','minHeight','minHeightMm','answerSpaceMm','responseSpace','layout','columns','flow','fontSize','lineHeight','indent','display','header','headerRow','colspan','rowspan','pageBreakBefore','breakBefore','keepTogether','responseLabel','unlabelled','label','presentation','clozeStyle','style','preserveParagraphAlignment','arrangement','responseWidthMm']);
// Containers a table or cloze change has to rebuild; the content check guards what they hold.
const STRUCTURE_FIELDS=new Set(['rows','cells','children','prompt','inlines','parts','items']);
const pointerParts=field=>typeof field==='string'&&field.startsWith('/')?field.split('/').slice(1).map(part=>part.replace(/~1/g,'/').replace(/~0/g,'~')):null;
export function patchAllowed(patch){
 const parts=pointerParts(patch?.field);
 if(!parts?.length)return false;
 if(patch.targetId==='project')return parts[0]==='settings'&&parts[1]==='layoutOverrides'&&parts.length>2;
 const head=parts[0]==='content'?parts[1]:parts[0];
 return head!==undefined&&(LAYOUT_FIELDS.has(head)||STRUCTURE_FIELDS.has(head));
}

// What a student reads or an answer key records, as a sorted list. Layout, labels, ids and
// empty strings do not count; any answer string counts as an answer wherever it sits, so a
// cloze answer may move into a response answer field.
const IGNORED_KEYS=new Set(['id','type','label','responseLabel','unlabelled','align','verticalAlign','background','headerBackground','border','borders','borderColour','layout','display','flow','presentation','style','clozeStyle','variant','arrangement','colour','color']);
const ANSWER_KEYS=new Set(['answer','answers','short','worked','expected','solution']);
export function contentTokens(value){
 const tokens=[];
 const walk=(node,key,answer)=>{
  if(Array.isArray(node))return node.forEach(child=>walk(child,key,answer));
  if(typeof node==='string'){const textValue=node.replace(/\s+/g,' ').trim();if(textValue&&!IGNORED_KEYS.has(key))tokens.push((answer?'ans:':'c:')+textValue);return;}
  if(!node||typeof node!=='object')return;
  for(const [name,child] of Object.entries(node)){
   if(IGNORED_KEYS.has(name)||LAYOUT_FIELDS.has(name)&&typeof child!=='object'&&!ANSWER_KEYS.has(name))continue;
   walk(child,name,answer||ANSWER_KEYS.has(name));
  }
 };
 walk(value,'',false);
 return tokens.sort();
}
export const sameContent=(before,after)=>isDeepStrictEqual(contentTokens(before),contentTokens(after));

// ---- trial apply ------------------------------------------------------------------------
export function canonicalLayoutValue(patch,value=patch.corrected){
 if(!patch.field?.includes('/arrangement')||!value||typeof value!=='object')return value;
 if(value.version===1&&value.root)return normalizeArrangement(value);
 if(Array.isArray(value))return normalizeArrangement({version:1,root:{id:'first-pass-validation-root',type:'group',children:value}}).root.children;
 if(['group','item'].includes(value.type))return normalizeArrangement({version:1,root:value}).root;
 return value;
}

// Each correction (one finding) is applied, in order, on a running clone of the affected
// blocks. A correction that does not match, touches a forbidden field, loses content, or
// conflicts with an earlier one (its original no longer matches) becomes a comment.
export function trialApply({blocks,settings,corrections,applyCorrections}){
 const accepted=[],comments=[];
 const run=structuredClone(blocks),holder={id:'project',settings:structuredClone(settings??{})};
 for(const correction of corrections){
  const fail=why=>comments.push({findingId:correction.id,why});
  let patches;
  try{patches=(correction.patches??[]).map(p=>({...p,corrected:canonicalLayoutValue(p)}));}
  catch(error){fail('Invalid arrangement: '+error.message);continue;}
  if(!patches.length){fail('The worker returned no patch.');continue;}
  const bad=patches.find(patch=>!patchAllowed(patch));
  if(bad){fail(`Patch on ${bad.targetId}${bad.field} is not a layout field.`);continue;}
  if(patches.some(patch=>isDeepStrictEqual(patch.original??null,patch.corrected??null))){fail('A patch changes nothing.');continue;}
  const trial=structuredClone(run),trialHolder={id:'project',settings:structuredClone(holder.settings)};
  const outcome=applyCorrections([...trial,trialHolder],[{...correction,patches}]);
  const rejected=(outcome.rejected??[]).filter(row=>row.status==='rejected');
  if(rejected.length){fail('Does not apply: '+rejected.map(row=>`${row.targetId}${row.field} (${row.error})`).join('; '));continue;}
  if(!outcome.applied?.length){fail('Applies nothing.');continue;}
  const lost=trial.filter((block,i)=>!sameContent(run[i],block));
  if(lost.length){fail('Would change content in '+lost.map(block=>block.id).join(', ')+'.');continue;}
  let ownershipError;
  for(const block of trial)if(block.flow?.tableContinuation){
   try{fragmentQuestion(block,[{parentId:block.content.id,ids:(block.content.children??[]).map(part=>part.id)}]);}
   catch(error){ownershipError=block.id+': '+error.message;break;}
  }
  if(ownershipError){fail('Would break pagination: '+ownershipError);continue;}
  run.splice(0,run.length,...trial);holder.settings=trialHolder.settings;
  accepted.push({...correction,patches});
 }
 // applyRepair saves all content patches before project settings patches. Validate
 // that actual order as well, rather than accepting patches that only work interleaved.
 for(;;){
  const replay=structuredClone(blocks),settingsHolder={id:'project',settings:structuredClone(settings??{})};
  const ordered=[false,true].flatMap(projectOnly=>accepted.map(c=>({...c,patches:c.patches.filter(p=>(p.targetId==='project')===projectOnly)})));
  const result=applyCorrections([...replay,settingsHolder],ordered),bad=new Set(result.rejected.filter(row=>row.status==='rejected').map(row=>row.correctionId));
  if(!bad.size)break;
  for(let i=accepted.length-1;i>=0;i--)if(bad.has(accepted[i].id)){comments.push({findingId:accepted[i].id,why:'Patches conflict in the content-before-settings save order.'});accepted.splice(i,1);}
 }
 return {accepted,comments};
}
// The same patches undone, last first.
export const inversePatches=corrections=>corrections.map(correction=>({id:correction.id+'-revert',reason:'Revert '+correction.id,patches:[...correction.patches].reverse().map(patch=>({targetId:patch.targetId,field:patch.field,original:patch.corrected,corrected:patch.original}))})).reverse();

// ---- worker --------------------------------------------------------------------------------

// Findings that touch a common block are repaired together so their patches agree.
export function groupFindings(findings){
 const parent=new Map();
 const find=id=>{while(parent.get(id)!==id){parent.set(id,parent.get(parent.get(id)));id=parent.get(id);}return id;};
 for(const finding of findings)for(const target of finding.targets)if(!parent.has(target.blockId))parent.set(target.blockId,target.blockId);
 for(const finding of findings){const [first,...rest]=finding.targets.map(target=>target.blockId);for(const id of rest)parent.set(find(id),find(first));}
 const groups=new Map();
 for(const finding of findings){const key=find(finding.targets[0].blockId);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(finding);}
 return [...groups.values()];
}
const RULES=`You repair layout findings on a MathsMap booklet by returning exact-field JSON patches. Do not run commands or open files: everything is below.

Rules:
- Change layout only: spacing, margins, padding, row heights, widths, widthMm, gaps, minimum heights, answer space (answerSpaceMm), alignment, flow, page breaks, borders and header background, labels (label, unlabelled), cloze style and width, table structure, and entries under /settings/layoutOverrides. Never change wording, mathematics, answers, TikZ code or image sources. An ordinary cloze may move into a response answer field only when the finding asks for it.
- Each patch is {"targetId": id of the block, or of a node inside it, or "project" for /settings, "field": JSON pointer relative to that node, "original": exact current value (null if absent), "corrected": final value}. Prefer the innermost node that owns the field. "original" must match exactly or the patch is rejected.
- Keep handwriting space adequate; do not shrink space merely to fill pages. Prefer the smallest change that fixes the finding. Follow the house conventions in the review contract below.
- A finding you cannot fix by layout alone (a diagram that must be redrawn, a content problem, an unclear proposal) goes in "comments" with a short reason. Never guess.
- Return one JSON object and nothing else: {"corrections":[{"id":"FINDING_ID","reason":"...","patches":[...]}],"comments":[{"findingId":"FINDING_ID","why":"..."}]}. Every finding id appears in exactly one of the two lists.`;
export function repairPrompt({project,index,group,root=ROOT,feedback,evidence}){
 const ids=[...new Set(group.flatMap(finding=>finding.targets.map(target=>target.blockId)))];
 const payload={booklet:project.title,findings:group.map(finding=>({id:finding.id,edition:finding.edition,page:finding.page,area:finding.area,scope:finding.scope,targets:finding.targets.map(target=>target.id),comment:finding.comment,...(finding.proposal?{proposal:finding.proposal}:{})})),
  blocks:ids.map(id=>({id,json:index.blocks.get(id).block,layoutOverrides:overridesFor(project,index,id)})),...(feedback?{verificationFeedback:feedback,rendererCapabilities:rendererCapabilities(root)}:{}),...(evidence?{pages:evidence.pages}:{} )};
 return {prompt:RULES+'\n\nReview contract (house conventions):\n'+contract({root})+'\n\nInput:\n'+JSON.stringify(payload),blockIds:ids};
}
function rendererCapabilities(root){
 const sources=[['src/lib/booklet-labels.js',65,110],['src/lib/booklet-exercises.js',20,65],['src/components/PracticeQuestionRenderer.svelte',27,39],['src/components/BookletArrangement.svelte',20,72],['public/libs/maths-editor/arrangement-model.mjs',12,31],['public/libs/maths-editor/document-model.mjs',131,146],['public/libs/maths-editor/document-model.mjs',192,206],['public/libs/maths-editor/document-model.mjs',235,241]];
 return {notes:'These are actual renderer excerpts, not a list of suggested fields. Do not invent controls such as unlabelled, responseLabel or clozeStyle: prove the renderer consumes any proposed field. responseSpace=scaffold suppresses ordinary answerSpaceMm. Preserve continuation table ownership, content and response answers. Existing custom arrangement sizes or layoutOverrides can override node sizes. A change of printed page number alone is not a defect if the requested grouping is achieved.',sources:sources.filter(([file])=>fs.existsSync(path.join(root,file))).map(([file,start,end])=>({file,code:fs.readFileSync(path.join(root,file),'utf8').split(/\r?\n/).slice(start,end).join('\n')}))};
}

export function repairEvidence(group,evidence){
 const wanted=new Set(group.flatMap(f=>(f.targets??[]).map(t=>t.blockId))),pages=[],images=[];
 for(const phase of ['before','after']){
  const source=evidence?.[phase];if(!source)continue;
  for(const edition of EDITIONS){
   const map=source.pagemap?.[edition]??[];
   const selected=map.filter(p=>p.blocks?.some(id=>wanted.has(id))).flatMap(p=>map.filter(n=>Math.abs(n.page-p.page)<=1));
   for(const page of selected){const file=source.images?.[edition]?.[page.page];if(!file||images.includes(file)||images.length>=12)continue;images.push(file);pages.push({phase,edition,page:page.page,blocks:page.blocks,image:images.length});}
  }
 }
 return {pages,images};
}

// ---- save and verify -----------------------------------------------------------------------

async function openProject(projectFile,root){return (await import('../scripts/booklet/lean-review.mjs')).openProject(projectFile,{root});}
async function repairModule(){return import('../scripts/booklet/lean-review.mjs');}
const blockList=(project,ids)=>ids.map(id=>bookletIndex(project).blocks.get(id)?.block).filter(Boolean);

// Defaults used outside tests.
export async function defaultVerify({project,projectFile,root,workDir,runDir,runner,lease,accepted,changed,editions,base,before,log,findingDetails={}}){
 const index=bookletIndex(project);
 const mapped=await defaultMapPages({project,dir:path.join(workDir,'after-'+contentHash(project).slice(0,12)),base,fresh:true,root});
 const pageSets=Object.fromEntries(EDITIONS.map(edition=>[edition,(mapped[edition]??[]).filter(page=>(page.blocks??[]).some(id=>changed.includes(id)))]));
 for(const edition of EDITIONS)if(!editions.includes(edition))pageSets[edition]=[];
 const selection={...pageSets,blocks:changed};
 const after=await defaultRenderImages({project,dir:path.join(workDir,'after-'+contentHash(project).slice(0,12)),selection,pagemap:mapped,base,fresh:true,root,log});
 const automated=(after.failures??[]).map(row=>row.kind+(row.count?' ×'+row.count:''));
 const evidence={before,after:{...after,pagemap:mapped}};
 const tasks=verificationTasks({accepted,findingDetails,index,before,after:evidence.after,editions});
 const verdicts=[];
 await pool(tasks,3,async task=>{
  if(task.error){verdicts.push({id:task.row.id,edition:task.edition,fixed:false,regressed:false,unverified:true,note:task.error});return;}
  const prompt=verifyPrompt({accepted:[{...task.row,finding:findingDetails[task.row.id]?.comment}],pages:task.pages,requireFix:task.requireFix});
  const {result}=await callWorker({runner,lease,canonicalRunDir:runDir,workDir,name:'verify-'+task.edition,prompt,images:task.images});
  const row=result?.findings?.find(f=>f.id===task.row.id);
  verdicts.push(row?{...row,edition:task.edition}:{id:task.row.id,edition:task.edition,fixed:false,regressed:false,unverified:true,note:'No verdict returned.'});
 });
 const findings=accepted.map(row=>{const own=verdicts.filter(v=>v.id===row.id);return {id:row.id,fixed:own.length>0&&own.every(v=>v.fixed===true),regressed:own.some(v=>v.regressed===true),unverified:own.some(v=>v.unverified===true),note:own.map(v=>v.edition+': '+v.note).join('; ')};});
 return {automated,findings,after:after.report,evidence};
}
export function verificationTasks({accepted,findingDetails={},index,before,after,editions}){
 return accepted.flatMap(row=>{
  const targets=findingDetails[row.id]?.targets??row.patches.map(p=>({blockId:index.owners.get(p.targetId)??p.targetId}));
  const blocks=new Set(targets.map(t=>t.blockId));
  return editions.flatMap(edition=>{
   if(edition!=='student'&&![...(before?.pagemap?.[edition]??[]),...(after?.pagemap?.[edition]??[])].some(p=>p.blocks?.some(id=>blocks.has(id))))return [];
   const pages=[],images=[];
   for(const [phase,source] of [['before',before],['after',after]]){
    const map=source?.pagemap?.[edition]??[],wanted=map.filter(p=>p.blocks?.some(id=>blocks.has(id)));
    for(const p of map.filter(p=>wanted.some(w=>Math.abs(w.page-p.page)<=1))){const file=source?.images?.[edition]?.[p.page];if(!file)continue;images.push(file);pages.push({phase,edition,page:p.page,blocks:p.blocks,image:images.length});}
   }
   const afterCovered=new Set(pages.filter(p=>p.phase==='after').flatMap(p=>p.blocks??[]));
   const missing=[...blocks].filter(id=>!afterCovered.has(id));
   return {row,edition,requireFix:!findingDetails[row.id]?.edition||findingDetails[row.id].edition===edition,pages,images,...(missing.length?{error:'Cannot verify missing target blocks: '+missing.join(', ')}:images.length>12?{error:'Finding needs more than 12 evidence pages; held for scoped review rather than truncating images.'}:{} )};
  });
 });
}
// Rasters of the changed pages before the repair, from the review's own render when it covers them.
export async function defaultRenderBefore({project,changed,editions,workDir,root=ROOT,base=BASE,log}){
 const dir=path.join(workDir,'render-'+contentHash(project).slice(0,12)),mapped=await defaultMapPages({project,dir,base,fresh:false,root});
 const pages=Object.fromEntries(EDITIONS.map(edition=>[edition,editions.includes(edition)?(mapped[edition]??[]).filter(page=>(page.blocks??[]).some(id=>changed.includes(id))):[]]));
 return {...await defaultRenderImages({project,dir,selection:{...pages,blocks:changed},pagemap:mapped,base,fresh:false,root,log}),pagemap:mapped};
}
export function verifyPrompt({accepted,pages,requireFix=true}){
 return `You check repairs to a printed MathsMap booklet. Do not run commands or open files. Each attached image has its own entry in "pages", including phase (before or after), edition, physical page, block IDs and image number. Page numbers can change after repagination: compare the same blocks across phases, never assume that equal page numbers contain the same content. Neighbour pages provide continuation context. ${requireFix?'Check that the original finding is fixed in its own edition.':'This is a regression-only check of another edition. Do not require a student-only feature such as handwriting space in an answer edition, or an answer-only feature in Questions. Return fixed:true if this edition has no regression; the original defect is checked separately in its own edition.'} Say whether the AFTER evidence regressed anything: clipping, overlap, lost content, a collision, or cramped working space. A different physical page number alone is neither an unfixed defect nor regression. If a target is not shown, say it cannot be verified; never infer content was lost from a page-number shift. Optional wording or cosmetic preferences never count as regression.\nReturn one JSON object and nothing else: {"findings":[{"id":"FINDING_ID","fixed":true|false,"regressed":true|false,"note":"short reason"}]} with exactly one entry per finding.\nInput:\n`+JSON.stringify({pages,requireFix,findings:accepted.map(row=>({id:row.id,finding:row.finding,reason:row.reason,changes:row.patches.map(patch=>patch.targetId+patch.field)}))});
}

// ---- run ---------------------------------------------------------------------------------------

export async function runApply({projectFile,root=ROOT,provenanceDir,runDir,workDir,concurrency=3,runner=defaultRunner,lease=defaultLease,verify=defaultVerify,renderBefore=verify===defaultVerify?defaultRenderBefore:null,retry=true,retryFindings=[],base=BASE,log=()=>{}}={}){
 if(!runDir)throw Error('Name a run folder for the corrections file');
 const {applyCorrections,applyRepair}=await repairModule();
 const handle=await openProject(projectFile,root),project=handle.project,index=bookletIndex(project),file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project);
 workDir??=path.join(root,'.booklet-work','first-pass-review',project.id);
 const canonical=canonicalRunDir(project,{root});
 fs.mkdirSync(runDir,{recursive:true});
 const recovery=new Map(retryFindings.map(row=>[row.id,row]));
 if(recovery.size)retry=false; // A historical retry is already the second and final attempt.
 const previousApply=record.apply;
 const scopeRecovery=finding=>recovery.get(finding.id)?.causeFixed==='verifier-edition-scope'&&recovery.get(finding.id)?.kind==='verification'&&recovery.get(finding.id)?.correction&&!finding.verifierScopeRecoveryUsed;
 const pending=(record.findings??[]).filter(finding=>finding.state==='pending'&&(recovery.size?recovery.has(finding.id)&&finding.applyOutcome==='reverted'&&(!finding.retryUsed||scopeRecovery(finding))&&!recovery.get(finding.id).regressed&&(!finding.commentId||(project.studio?.flags??[]).some(flag=>flag.id===finding.commentId&&!flag.resolved)):!finding.commentId&&!finding.applyOutcome));
 const left=pending.filter(finding=>LEFT_AREAS.includes(finding.area)||!APPLY_AREAS.includes(finding.area)),candidates=pending.filter(finding=>!left.includes(finding));
 for(const finding of left)finding.applyOutcome='left';
 const stale=candidates.filter(finding=>!targetsUnchanged(finding,project,index)),current=candidates.filter(finding=>!stale.includes(finding));
 for(const finding of stale){setState(finding,'stale','A target changed before the repair.');}
 const recoveryBaseline=recovery.size&&renderBefore&&current.length?await renderBefore({project,changed:[...new Set(current.flatMap(f=>f.targets.map(t=>t.blockId)))],editions:EDITIONS,workDir,root,base,log}):null;
 if(recovery.size){for(const finding of current){if(scopeRecovery(finding))finding.verifierScopeRecoveryUsed=true;finding.retryUsed=true;}saveProvenance(file,record);}
 const byId=new Map(current.map(finding=>[finding.id,finding])),comments=new Map(),corrections=[],calls=[];
 await pool(groupFindings(current),concurrency,async group=>{
  const verifyOnly=group.filter(f=>recovery.get(f.id)?.kind==='verification');
  for(const finding of verifyOnly){const correction=recovery.get(finding.id).correction;if(correction)corrections.push(correction);else comments.set(finding.id,'The original correction is unavailable; cannot safely retry verification.');}
  group=group.filter(f=>!verifyOnly.includes(f));
  if(!group.length)return;
  const feedback=recovery.size?group.map(f=>({id:f.id,note:recovery.get(f.id)?.note,previousPatches:recovery.get(f.id)?.correction?.patches})):undefined;
  const visuals=recovery.size?repairEvidence(group,{before:recoveryBaseline}):null;
  const {prompt,blockIds}=repairPrompt({project,index,group,root,feedback,evidence:visuals});
  const call={findings:group.map(finding=>finding.id),blocks:blockIds};calls.push(call);
  try{
   const {result}=await callWorker({runner,lease,canonicalRunDir:canonical,workDir,name:recovery.size?'repair-retry':'repair',prompt:recovery.size?'This is the final retry. The previous repair was reverted as ineffective. Use verificationFeedback, the attached page images and the actual renderer excerpts to choose a different safe layout change, or return a comment.\n'+prompt:prompt,images:visuals?.images??[]});
   const seen=new Set();
   for(const row of Array.isArray(result?.corrections)?result.corrections:[])if(byId.has(row?.id)&&!seen.has(row.id)){seen.add(row.id);corrections.push(row);}
   for(const row of Array.isArray(result?.comments)?result.comments:[])if(byId.has(row?.findingId)&&!seen.has(row.findingId)){seen.add(row.findingId);comments.set(row.findingId,String(row.why??'Not expressible as layout.'));}
   for(const finding of group)if(!seen.has(finding.id))comments.set(finding.id,'The repair worker returned nothing for this finding.');
  }catch(error){call.error=error.message;for(const finding of group)comments.set(finding.id,'Repair worker failed: '+error.message);}
 });
 corrections.sort((a,b)=>current.findIndex(f=>f.id===a.id)-current.findIndex(f=>f.id===b.id));
 const touchedIds=[...new Set(current.flatMap(finding=>finding.targets.map(target=>target.blockId)))];
 const trial=trialApply({blocks:blockList(project,touchedIds),settings:project.settings,corrections,applyCorrections});
 for(const row of trial.comments)comments.set(row.findingId,row.why);
 let accepted=trial.accepted;
 const outcome={project:project.id,applied:[],reverted:[],comment:[],left:left.map(finding=>finding.id),stale:stale.map(finding=>finding.id),errors:[],calls,retries:[],verificationAttempts:[]};
 if(recovery.size)outcome.retries=current.map(f=>({id:f.id,kind:recovery.get(f.id).kind,note:recovery.get(f.id).note,historical:true}));
 let before=null,changed=[];
 if(accepted.length){
  const correctionsFile=path.join(runDir,'corrections-'+now().replace(/[:.]/g,'-')+'.json');
  fs.writeFileSync(correctionsFile,JSON.stringify({project:project.id,corrections:accepted},null,1)+'\n');
  changed=[...new Set(accepted.flatMap(row=>row.patches.map(patch=>patch.targetId==='project'?null:(index.owners.get(patch.targetId)??patch.targetId))).filter(Boolean))];
  // Settings-only repairs change the block that the finding targets.
  for(const row of accepted){const finding=byId.get(row.id);if(row.patches.every(patch=>patch.targetId==='project'))finding.targets.forEach(target=>changed.push(target.blockId));}
  changed=[...new Set(changed)];
  const editions=[...new Set(['student',...accepted.map(row=>byId.get(row.id).edition).filter(Boolean),...accepted.filter(row=>['labels','answers','response'].includes(byId.get(row.id).area)).flatMap(row=>['short','worked'])])];
  before=renderBefore?await renderBefore({project,changed,editions,workDir,root,base,log}):null;
  await applyRepair({runDir,projectFile,correctionsFile,root});
  const saved=read(handle.file);
  const verifyOnce=async(snapshot,rows)=>{
   let result;
   try{result=await verify({project:snapshot,projectFile,root,workDir,runDir:canonical,runner,lease,accepted:rows,changed,editions,base,before,log,findingDetails:Object.fromEntries(current.map(f=>[f.id,f]))});}
   catch(error){result={automated:[],findings:[],error:error.message};}
   outcome.verificationAttempts.push({at:now(),findings:result.findings??[],automated:result.automated??[],...(result.error?{error:result.error}:{})});
   return result;
  };
  const undoRows=async(rows)=>{
   if(!rows.length)return;
   const undoFile=path.join(runDir,'reverts-'+now().replace(/[:.]/g,'-')+'.json');
   fs.writeFileSync(undoFile,JSON.stringify({project:project.id,corrections:inversePatches(rows)},null,1)+'\n');
   await applyRepair({runDir,projectFile,correctionsFile:undoFile,root});
  };
  let verdicts=await verifyOnce(saved,accepted);
  const initialVerdicts=new Map((verdicts.findings??[]).map(row=>[row.id,row]));
  const retryable=retry?accepted.filter(row=>{const v=initialVerdicts.get(row.id);return !v||(v.regressed!==true&&v.fixed!==true);}):[];
  if(retryable.length){
   for(const row of retryable)byId.get(row.id).retryUsed=true;
   saveProvenance(file,record);
   const regressions=accepted.filter(row=>initialVerdicts.get(row.id)?.regressed===true);
   const unfixed=retryable.filter(row=>initialVerdicts.has(row.id)&&initialVerdicts.get(row.id).unverified!==true);
   // Missing verdicts retry verification without inventing a different repair.
   // An explicit unfixed verdict first restores the old layout, then guides one new repair.
   await undoRows(accepted.filter(row=>regressions.includes(row)||unfixed.includes(row)));
   for(const row of regressions){outcome.reverted.push(row.id);comments.set(row.id,'Reverted after verification: '+initialVerdicts.get(row.id).note+'.');}
   for(const row of retryable)outcome.retries.push({id:row.id,kind:unfixed.includes(row)?'repair':'verification',note:initialVerdicts.get(row.id)?.note??verdicts.error??'No verdict returned.'});
   log(`One bounded retry: ${unfixed.length} unfixed repairs, ${retryable.length-unfixed.length} missing verdicts.`);
   accepted=accepted.filter(row=>!regressions.includes(row)&&!unfixed.includes(row));
   if(unfixed.length){
    const snapshot=read(handle.file),snapshotIndex=bookletIndex(snapshot),retryCorrections=[];
    await pool(groupFindings(unfixed.map(row=>byId.get(row.id))),concurrency,async group=>{
     const feedback=group.map(f=>({id:f.id,note:initialVerdicts.get(f.id)?.note,previousPatches:unfixed.find(row=>row.id===f.id)?.patches}));
     const visuals=repairEvidence(group,verdicts.evidence);
     const {prompt,blockIds}=repairPrompt({project:snapshot,index:snapshotIndex,group,root,feedback,evidence:visuals});
     const call={findings:group.map(f=>f.id),blocks:blockIds,retry:true};calls.push(call);
     try{
      const {result}=await callWorker({runner,lease,canonicalRunDir:canonical,workDir,name:'repair-retry',prompt:'The previous repair was reverted because verification found it ineffective. Use verificationFeedback, the attached page images and the actual renderer excerpts to choose a different layout change. Return a comment if no safe repair is available.\n'+prompt,images:visuals.images});
      const groupIds=new Set(group.map(f=>f.id)),seen=new Set();
      for(const row of result?.corrections??[])if(groupIds.has(row.id)&&!seen.has(row.id)){seen.add(row.id);retryCorrections.push(row);}
      for(const row of result?.comments??[])if(groupIds.has(row.findingId)&&!seen.has(row.findingId)){seen.add(row.findingId);comments.set(row.findingId,String(row.why??'No safe retry repair.'));}
     }catch(error){call.error=error.message;for(const f of group)comments.set(f.id,'Retry repair failed: '+error.message);}
    });
    retryCorrections.sort((a,b)=>current.findIndex(f=>f.id===a.id)-current.findIndex(f=>f.id===b.id));
    const retrial=trialApply({blocks:blockList(snapshot,touchedIds),settings:snapshot.settings,corrections:retryCorrections,applyCorrections});
    for(const row of retrial.comments)comments.set(row.findingId,row.why);
    if(retrial.accepted.length){
     const retryFile=path.join(runDir,'retry-corrections-'+now().replace(/[:.]/g,'-')+'.json');
     fs.writeFileSync(retryFile,JSON.stringify({project:project.id,corrections:retrial.accepted},null,1)+'\n');
     await applyRepair({runDir,projectFile,correctionsFile:retryFile,root});
     accepted.push(...retrial.accepted);
    }
    for(const row of unfixed)if(!accepted.some(item=>item.id===row.id)){outcome.reverted.push(row.id);comments.set(row.id,'Reverted after verification: '+initialVerdicts.get(row.id).note+'. Retry: '+(comments.get(row.id)??'No valid replacement patch.'));}
   }
   // Recheck retained repairs too: another repair may share their page or block.
   if(accepted.length)verdicts=await verifyOnce(read(handle.file),accepted);
   else verdicts={automated:verdicts.automated,findings:[]};
  }
  if(verdicts.error)outcome.errors.push('Verification failed: '+verdicts.error);
  const verdict=new Map((verdicts.findings??[]).map(row=>[row.id,row]));
  // No verdict, an unfixed defect or a regression all revert: nothing unverified stays.
  const bad=accepted.filter(row=>{const v=verdict.get(row.id);return !v||v.fixed!==true||v.regressed===true;});
  for(const row of bad)comments.set(row.id,'Reverted after verification: '+(verdict.get(row.id)?.note||'no verdict returned')+'.');
  if(bad.length){
   await undoRows(bad);
   for(const row of bad)outcome.reverted.push(row.id);
  }
  for(const row of accepted)if(!bad.includes(row)){outcome.applied.push(row.id);Object.assign(byId.get(row.id),{applyOutcome:'repaired',applyReason:row.reason});}
  outcome.automated=verdicts.automated;outcome.verifyNotes=[...new Map(outcome.verificationAttempts.flatMap(attempt=>attempt.findings).map(row=>[row.id,row])).values()].map(row=>({id:row.id,fixed:row.fixed,regressed:row.regressed,...(row.unverified?{unverified:true}:{}),note:row.note}));
 }
 if(recovery.size)for(const finding of current)if(!outcome.applied.includes(finding.id)&&!outcome.reverted.includes(finding.id))outcome.reverted.push(finding.id);
 // Resolved comments for what changed; open comments are left to `post` for what did not.
 const handle2=await openProject(projectFile,root),final=handle2.project,finalIndex=bookletIndex(final);
 const {createFeedback}=await import('../src/lib/booklet-feedback.js');
 const flags=[...(final.studio?.flags??[])];
 for(const id of outcome.applied){
  const finding=byId.get(id),note=commentNote(finding),anchor=target=>createFeedback(final,{rootId:target,edition:finding.edition},note,finding.scope);
  let comment;try{comment=anchor(finding.targets[0].id);}catch{comment=anchor(finding.targets[0].blockId);}
  const existing=flags.findIndex(flag=>flag.kind==='first-pass'&&flag.findingId===id);
  const flag={...(existing>=0?flags[existing]:comment),kind:'first-pass',findingId:id,area:finding.area,resolved:true,resolvedAt:now(),resolution:'Applied by the repair worker: '+(finding.applyReason||'layout change')+'. Verified on the rendered pages.'};
  if(existing>=0)flags[existing]=flag;else flags.push(flag);
  Object.assign(finding,{commentId:flag.id,postedAt:flag.at,postedNote:note});setState(finding,'repaired','Applied and verified (first-pass apply).');
 }
 if(outcome.applied.length){final.studio={version:1,...final.studio,flags};await handle2.save();const saved=read(handle2.file);const lost=outcome.applied.filter(id=>!(saved.studio?.flags??[]).some(flag=>flag.findingId===id));if(lost.length)outcome.errors.push('Saved project is missing resolved comments for '+lost.join(', '));record.postedRevision=saved.revision??null;}
 for(const finding of current){
  if(outcome.applied.includes(finding.id))continue;
  finding.applyOutcome=outcome.reverted.includes(finding.id)?'reverted':'comment';finding.applyNote=comments.get(finding.id)??'Not applied.';
  if(finding.applyOutcome==='comment')outcome.comment.push(finding.id);
 }
 // Retarget the hashes of findings that stay pending: the block moved under them only when repaired.
 for(const finding of record.findings??[])if(finding.applyOutcome==='comment'||finding.applyOutcome==='reverted')finding.targets=finding.targets.map(target=>({...target,hash:blockHash(final,finalIndex,target.blockId)??target.hash}));
 record.apply={at:now(),applied:outcome.applied,reverted:outcome.reverted,comment:outcome.comment,left:outcome.left,stale:outcome.stale,retries:outcome.retries,verificationAttempts:outcome.verificationAttempts};
 if(recovery.size&&previousApply){
  record.applyHistory=[...(record.applyHistory??[]),previousApply];
  const attempted=new Set(current.map(f=>f.id));
  for(const key of ['applied','reverted','comment','left','stale'])record.apply[key]=[...new Set([...(previousApply[key]??[]).filter(id=>!attempted.has(id)),...record.apply[key]])];
  record.apply.retries=[...(previousApply.retries??[]),...outcome.retries];
  record.apply.verificationAttempts=[...(previousApply.verificationAttempts??[]),...outcome.verificationAttempts];
 }
 saveProvenance(file,record);
 outcome.commentFindingIds=[...outcome.comment,...outcome.reverted];outcome.revision=final.revision??null;
 return outcome;
}

// ---- command line --------------------------------------------------------------------------------

export async function main(args=process.argv.slice(2)){
 const values={};
 for(let i=0;i<args.length;i++){
  if(!['--project','--run-dir','--provenance-dir','--base','--concurrency'].includes(args[i])||args[i+1]===undefined)throw Error('Invalid option '+args[i]);
  values[args[i]]=args[++i];
 }
 if(!values['--project'])throw Error('Name a booklet with --project ID');
 const projectFile=path.join(ROOT,'booklets','projects',values['--project']+'.json');
 const result=await runApply({projectFile,runDir:path.resolve(values['--run-dir']??path.join(ROOT,'.booklet-work','first-pass-review',values['--project'],'apply')),provenanceDir:values['--provenance-dir']&&path.resolve(values['--provenance-dir']),base:values['--base']??BASE,concurrency:Number(values['--concurrency']??3),log:message=>console.error(message)});
 console.log(JSON.stringify(result,null,1));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
