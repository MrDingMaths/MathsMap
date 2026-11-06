// Apply James's approved pedagogy audit v2 comments (6 November 2026).
// Nothing is applied until James has reviewed the comments and named them:
//   node pedagogy/review.mjs audit-v2 apply-comments --project ID --comments all|ID,ID [--dry-run]
// `all` means every open v2 comment; a comment James deleted is rejected and never applied.
// Each comment's change was drafted, solved and rated during the audit and stored in
// booklets/provenance/pedagogy-review/audit-v2/ID.proposals.json, so applying makes no
// drafting call. Questions whose content changes here are rated by Sonnet comparison.
// One page check, one revision-checked save; applied comments are resolved with what was
// done, and anything that cannot be applied is left open and listed.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inlinesFromSource} from '../public/libs/maths-editor/document-model.mjs';
import {verifiedRating,practiceRatingBlocks} from '../scripts/booklet/reasoning-ratings.mjs';
import {nodesOf} from '../polish/guards.mjs';
import {COMMENT_KIND,callSonnet,studentView,anchorRefs,ladderFor,setComparisonRating,inFlight,recordFile,proposalsFile} from './audit-v2.mjs';
import {MODEL,EFFORT,LIMITS,bookletIndex,scoreOf,contentFingerprint,deriveComparisonScore,boldTerm} from './audit-v2-plan.mjs';
import {ratingContract,validatePlacements} from './audit-v2-prompts.mjs';
import {canonicalRunDir} from './review.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value,null,1)+'\n');};
const now=()=>new Date().toISOString();
const rel=file=>path.relative(ROOT,file).replaceAll('\\','/');
const isDoc=v=>v&&typeof v==='object'&&v.format&&Array.isArray(v.blocks);
const allBlocks=p=>p.sections.flatMap(s=>s.blocks??[]);
const findBlock=(p,id)=>{for(const s of p.sections){const i=(s.blocks??[]).findIndex(b=>b.id===id);if(i>=0)return {section:s,index:i,block:s.blocks[i]};}return null;};

// ---- theory text onto the existing document ------------------------------------------
// The replacement is in the audit's text form: paragraphs separated by blank lines, a
// table as one line per row with tab-separated cells. It is written onto the existing
// paragraphs and cells so ids, alignment, borders and cell colours are kept. Extra
// trailing paragraphs are appended. Anything else is left to James by hand.
export function theoryOnto(block,replacement){
 const copy=structuredClone(block);
 const host=isDoc(copy.content)?copy.content:isDoc(copy.content?.prompt)?copy.content.prompt:null;
 if(!host){if(typeof copy.content?.prompt==='string'){copy.content.prompt=replacement;return {block:copy};}return {error:'the block has no editable text document'};}
 const chunks=String(replacement).replace(/\r/g,'').split(/\n[ \t]*\n/).map(c=>c.trim()).filter(Boolean),top=host.blocks;
 if(chunks.length<top.length)return {error:'the replacement has fewer parts than the block; edit by hand'};
 for(const [i,b]of top.entries()){
  const chunk=chunks[i];
  if(b.type==='paragraph'){b.inlines=inlinesFromSource(chunk);continue;}
  if(b.type==='table'){const lines=chunk.split('\n');
   if(lines.length!==b.rows.length)return {error:`table ${b.id} has ${b.rows.length} rows, the replacement ${lines.length}`};
   for(const [r,line]of lines.entries()){const cells=line.split('\t'),row=b.rows[r];
    if(cells.length!==row.length)return {error:`table ${b.id} row ${r+1} has ${row.length} cells, the replacement ${cells.length}`};
    for(const [c,text]of cells.entries()){const cell=row[c];if((cell.blocks??[]).length!==1||cell.blocks[0].type!=='paragraph')return {error:`cell ${cell.id} is not a single paragraph`};cell.blocks[0].inlines=inlinesFromSource(text.trim());}}
   continue;}
  return {error:`a ${b.type} cannot be rewritten automatically`};
 }
 const last=[...top].reverse().find(b=>b.type==='paragraph');
 chunks.slice(top.length).forEach((chunk,k)=>top.push({id:`${block.id}-v2-added-${k+1}`,type:'paragraph',align:last?.align??'left',inlines:inlinesFromSource(chunk)}));
 return {block:copy};
}

// ---- placing new blocks ------------------------------------------------------------------
function challengeSection(p){
 let ch=p.sections.find(s=>s.phase==='practice'&&s.role==='challenge');
 if(!ch){ch={id:p.id+'-challenge',topicId:'challenge',title:'Challenge exercise',phase:'practice',role:'challenge',workingSpace:'none',blocks:[]};p.sections.push(ch);p.topics??=[];if(!p.topics.some(t=>t.id==='challenge'))p.topics.push({id:'challenge',title:'Challenge exercise'});}
 return ch;
}
// The topic's opening Review box: appended to an existing review group at the start of
// the topic, otherwise a new group at the start of the topic's first section.
function addToReview(p,topicId,block){
 const sections=p.sections.filter(s=>s.topicId===topicId&&s.phase!=='front-matter');
 if(!sections.length)return 'topic '+topicId+' not found';
 const first=sections[0],blocks=first.blocks??=[];
 let end=0;while(end<blocks.length&&blocks[end].sourceAtom?.kind==='review')end++;
 const atom=end?blocks[end-1].sourceAtom:{id:topicId+'-v2-review',kind:'review',label:'Review',order:0};
 blocks.splice(end,0,{...block,pedagogyRole:'review',sourceAtom:atom});
 return null;
}

// ---- one Sonnet comparison call for questions changed here --------------------------
async function rateChanged(ctx,candidate,ids,root){
 if(!ids.length)return [];
 const rows=bookletIndex(candidate),exclude=new Set(ids),anchors=anchorRefs(root),refIds=new Set();
 const items=ids.map(id=>{const r=rows.find(x=>x.block.id===id);const ladder=ladderFor(candidate,{sectionId:r.section.id,topicId:r.section.topicId,exclude});ladder.forEach(x=>refIds.add(x));return {id,ladder:[...ladder,...anchors.map(a=>a.ref)],task:studentView(r.block)};});
 const blocks=new Map(rows.map(r=>[r.block.id,r.block])),refs=new Map([...anchors.map(a=>[a.ref,a.score]),...[...refIds].map(id=>[id,scoreOf(blocks.get(id))])]);
 const system=ratingContract()+'\n\nStanding anchors:\n'+anchors.map(a=>JSON.stringify(a)).join('\n');
 const prompt=JSON.stringify({references:[...refIds].map(id=>({ref:id,score:scoreOf(blocks.get(id)),task:studentView(blocks.get(id))})),targets:items});
 const {value,file}=await callSonnet(ctx,{stage:'rating',system,prompt,validate:r=>validatePlacements(r,items.map(i=>i.id))});
 return items.map(it=>{const p=value.get(it.id),d=deriveComparisonScore(p,refs);if(d.score!=null)setComparisonRating(blocks.get(it.id),d.score,p,refs,file);return {id:it.id,score:d.score,how:d.how,harderThan:p?.harderThan??null,easierThan:p?.easierThan??null};});
}

// ---- the command ----------------------------------------------------------------------------
export async function applyComments({projectId,comments,dryRun=false,projectFile=null,proposals=null,root=ROOT,log=console.error}){
 if(!comments)throw Error('apply-comments needs --comments all or a list of comment ids: comments are applied only after James has reviewed them');
 const liveFile=projectFile??path.join(root,'booklets','projects',projectId+'.json'),live=read(liveFile);
 const testOnly=!!projectFile;
 if(!testOnly){const busy=inFlight(live);if(busy.length)throw Error('Another import, review, export or repair is running: '+busy[0].slice(0,200));}
 const store=read(proposals??proposalsFile(projectId,{root})).comments??{};
 const open=(live.studio?.flags??[]).filter(f=>f.kind===COMMENT_KIND&&!f.resolved);
 const wanted=comments==='all'?open:open.filter(f=>String(comments).split(',').map(s=>s.trim()).includes(f.id));
 if(comments!=='all'){const missing=String(comments).split(',').map(s=>s.trim()).filter(id=>!open.some(f=>f.id===id));if(missing.length)throw Error('Not open v2 comments (resolved, deleted or not v2): '+missing.join(', '));}
 const stamp=now().replace(/[-:]/g,'').replace(/\..*/,'').replace('T','-');
 const runDir=path.join(root,'.booklet-work','pedagogy-audit-v2',projectId,stamp+'-apply-comments');
 const ctx={workDir:runDir,runDir:testOnly?null:canonicalRunDir(live,{root}),calls:[],log,dryRun};
 const candidate=structuredClone(live),report={projectId,revision:live.revision,startedAt:now(),comments:comments,applied:[],manual:[],stale:[],ratings:[]};
 const changedHosts=new Set(),inserted=new Set(),resolutions=new Map();
 const fpOf=id=>{const f=findBlock(candidate,id);return f?contentFingerprint(f.block):null;};
 const liveFp=id=>{const f=findBlock(live,id);return f?contentFingerprint(f.block):null;};
 // Content edits first, so inserts land next to the edited blocks.
 const order={'set-field':0,'replace-node':0,theory:0,bold:0,rating:1,insert:2,review:3};
 const work=[];
 for(const flag of wanted){const entry=store[flag.id];
  if(!entry?.payloads?.length){report.manual.push({comment:flag.id,kind:flag.findingKind,target:flag.targetId,reason:'no stored change: apply by hand'});continue;}
  for(const pay of entry.payloads)work.push({flag,pay});}
 work.sort((a,b)=>(order[a.pay.op]??9)-(order[b.pay.op]??9));
 const failed=new Set();
 for(const {flag,pay}of work){
  const fail=reason=>{report.manual.push({comment:flag.id,kind:flag.findingKind,target:flag.targetId,op:pay.op,reason});failed.add(flag.id);};
  // A change to an existing block needs that block exactly as the audit saw it.
  if(pay.blockId&&pay.op!=='insert'&&pay.op!=='review'&&pay.targetFingerprint&&liveFp(pay.blockId)!==pay.targetFingerprint){report.stale.push({comment:flag.id,op:pay.op,block:pay.blockId,reason:'the block changed after the audit'});failed.add(flag.id);continue;}
  const done=text=>{resolutions.set(flag.id,[...(resolutions.get(flag.id)??[]),text]);report.applied.push({comment:flag.id,kind:flag.findingKind,op:pay.op,what:text});};
  if(pay.op==='set-field'){const f=findBlock(candidate,pay.blockId);const node=f&&(nodesOf(f.block).find(n=>n.id===pay.nodeId)??(f.block.content?.id===pay.nodeId?f.block.content:null));
   if(!node){fail('node '+pay.nodeId+' not found');continue;}
   if(pay.field==='prompt')node.prompt=pay.value;else node.answer={...node.answer,[pay.field]:pay.value};
   changedHosts.add(pay.blockId);done(`${pay.field} of ${pay.nodeId} corrected.`);continue;}
  if(pay.op==='replace-node'){const f=findBlock(candidate,pay.blockId);if(!f){fail('block '+pay.blockId+' not found');continue;}
   const src=pay.content,leaf=(src.children??[]).length===1?src.children[0]:src;
   const whole=!pay.nodeIds.length||pay.nodeIds.includes(pay.blockId)||pay.nodeIds.includes(f.block.content?.id);
   if(whole){f.block.content={...src,id:f.block.content?.id??src.id,label:f.block.content?.label??null};f.block.classification={...f.block.classification,...pay.classification,primarySkillId:f.block.classification?.primarySkillId??pay.classification?.primarySkillId};changedHosts.add(pay.blockId);done(`${pay.blockId} replaced with a new question.`);continue;}
   let ok=true;for(const nodeId of pay.nodeIds){const node=nodesOf(f.block).find(n=>n.id===nodeId);if(!node){ok=false;break;}const before=node.prompt;node.prompt=leaf.prompt;node.answer={short:leaf.answer?.short??'',worked:leaf.answer?.worked??'',provenance:{short:'authored',worked:'authored'}};if(leaf.questionDiagrams?.length)node.questionDiagrams=leaf.questionDiagrams;
    (f.block.sourceReview??={}).corrections=[...(f.block.sourceReview.corrections??[]),{at:now(),targetId:nodeId,kind:'approved-departure',approvedBy:'James',comment:flag.id,before,reason:'Repeated item replaced (pedagogy audit v2).'}];}
   if(!ok){fail('a repeated part was not found');continue;}
   changedHosts.add(pay.blockId);done(`${pay.nodeIds.join(', ')} replaced with ${leaf.prompt}.`);continue;}
  if(pay.op==='theory'){const f=findBlock(candidate,pay.blockId);if(!f){fail('block not found');continue;}const r=theoryOnto(f.block,pay.replacement);if(r.error){fail(r.error);continue;}f.section.blocks[f.index]=r.block;changedHosts.add(pay.blockId);done('Replacement text applied.');continue;}
  if(pay.op==='bold'){const f=findBlock(candidate,pay.blockId);if(!f){fail('block not found');continue;}let next=f.block;const terms=[];for(const t of pay.terms){const r=boldTerm(next,t);if(r){next=r;terms.push(t);}}if(!terms.length){fail('no term found to bold');continue;}f.section.blocks[f.index]=next;done('Bolded '+terms.join(', ')+'.');continue;}
  if(pay.op==='rating'){const f=findBlock(candidate,pay.blockId);if(!f||!verifiedRating(f.block,pay.classification)){fail('the rating no longer matches the question');continue;}f.block.classification={...f.block.classification,...pay.classification,assessment:{...pay.classification.assessment,approvedBy:'James',approvedAt:now()}};done(`Rating ${pay.classification.reasoningScore} accepted.`);continue;}
  if(pay.op==='insert'||pay.op==='review'){
   const block=structuredClone(pay.block);if(findBlock(candidate,block.id)){fail('a block with id '+block.id+' already exists');continue;}
   (block.sourceReview??={}).addition={approvedBy:'James',date:now().slice(0,10),comment:flag.id,reason:'Approved pedagogy audit v2 comment.'};
   if(pay.op==='review'){const e=addToReview(candidate,pay.topicId,block);if(e){fail(e);continue;}inserted.add(block.id);done('Added to the opening Review box.');continue;}
   const routineOver=flag.findingKind==='proposal-extensions'&&scoreOf(block)!=null&&scoreOf(block)>=LIMITS.routineCeiling;
   if(routineOver){challengeSection(candidate).blocks.push(block);inserted.add(block.id);done(`Added to the Challenge exercise (rated ${scoreOf(block)}).`);continue;}
   const at=pay.after?findBlock(candidate,pay.after):null,section=at?.section??candidate.sections.find(s=>s.id===pay.sectionId);
   if(!section){fail('its exercise was not found');continue;}
   section.blocks.splice(at?at.index+1:section.blocks.length,0,block);inserted.add(block.id);done(pay.after?`Added after ${pay.after}.`:'Added at the end of the exercise.');continue;}
  fail('unknown change '+pay.op);
 }
 // A comment is resolved only when every one of its changes applied.
 for(const id of failed)resolutions.delete(id);
 // Ratings: practice questions changed here, or inserted with a rating that no longer matches.
 const practice=new Set(practiceRatingBlocks(candidate).map(r=>r.block.id));
 const toRate=[...new Set([...changedHosts,...inserted])].filter(id=>practice.has(id)&&!verifiedRating(findBlock(candidate,id).block));
 report.toRate=toRate;
 if(!dryRun&&toRate.length){fs.mkdirSync(runDir,{recursive:true});report.ratings=await rateChanged(ctx,candidate,toRate,root);
  for(const r of report.ratings.filter(r=>r.score==null)){report.manual.push({block:r.id,reason:'comparison placement '+r.how+': rate by hand'});}}
 for(const [id,texts]of resolutions){const f=candidate.studio.flags.find(x=>x.id===id);f.resolved=true;f.resolvedAt=now();f.resolution='Approved by James and applied: '+texts.join(' ');}
 report.resolved=[...resolutions.keys()];report.calls=ctx.calls;
 write(path.join(runDir,'candidate.json'),{...candidate,revision:live.revision});
 const changed=[...new Set([...changedHosts,...inserted])];
 report.pageBlocks=changed;
 if(dryRun||testOnly){report.dryRun=true;write(path.join(runDir,'report.json'),report);write(path.join(runDir,'report.md'),applyReport(report));return {run:rel(runDir),...summary(report)};}
 // One page check of the changed blocks, then one revision-checked save.
 if(changed.length){const out=path.join(runDir,'pages'),answers=[...changedHosts,...inserted].length?'student,short,worked':'student';
  const r=spawnSync(process.execPath,['scripts/booklet/check-feedback-pages.mjs','--project-file',path.join(runDir,'candidate.json'),'--blocks',changed.join(','),'--editions',answers,'--full-development-reason','Approved pedagogy audit v2 comments added or changed questions and answers.','--out',out],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024,timeout:1800000});
  report.render={exitCode:r.status,out:rel(out),stdout:String(r.stdout).slice(-3000)};
  if(r.status!==0){write(path.join(runDir,'report.json'),report);throw Error('Page check failed; nothing saved. See '+rel(path.join(runDir,'report.json')));}}
 const {publishProject}=await import('../scripts/booklet/publish-project.mjs');
 const saved=await publishProject({candidateFile:path.join(runDir,'candidate.json'),expectedRevision:live.revision,apply:true,root,record:path.join(runDir,'publication.json'),ledger:path.join(root,'.booklet-work','pedagogy-audit-v2','publications.jsonl'),note:'pedagogy audit v2 approved comments'});
 report.savedRevision=saved.to;
 const file=recordFile(projectId,{root});if(fs.existsSync(file)){const rec=read(file);rec.runs=[...(rec.runs??[]),{kind:'apply-comments',at:report.startedAt,run:rel(runDir),fromRevision:live.revision,toRevision:saved.to,model:MODEL,effort:EFFORT,applied:report.applied.length,resolved:report.resolved.length,manual:report.manual.length,calls:ctx.calls.map(({id,stage,model,effort,elapsedMs,usage,costUsd,ok})=>({id,stage,model,effort,elapsedMs,usage,costUsd,ok}))}];write(file,rec);}
 write(path.join(runDir,'report.json'),report);write(path.join(runDir,'report.md'),applyReport(report));
 return {run:rel(runDir),revision:saved.to,...summary(report)};
}
const summary=r=>({applied:r.applied.length,resolved:r.resolved.length,manual:r.manual,stale:r.stale,ratings:r.ratings,toRate:r.toRate});
function applyReport(r){return ['# Approved pedagogy audit v2 comments: '+r.projectId,'',`Revision ${r.revision}${r.savedRevision?' → '+r.savedRevision:''}${r.dryRun?' (dry run, nothing saved)':''}.`,'','## Applied','',...r.applied.map(a=>`- ${a.kind} (${a.comment.slice(0,8)}): ${a.what}`),'','## Ratings by Sonnet comparison','',...(r.ratings.length?r.ratings.map(x=>`- ${x.id}: ${x.score??'not placed'} (between ${x.harderThan??'—'} and ${x.easierThan??'—'})`):(r.toRate??[]).map(id=>`- ${id}: to rate`)),'','## Left open for James','',...[...r.manual,...r.stale].map(m=>`- ${m.kind??m.op??''} ${m.comment?.slice(0,8)??m.block??''}: ${m.reason}`),''].join('\n');}

export async function applyCommentsMain(args){
 const value=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
 const projectId=value('--project');if(!projectId)throw Error('apply-comments needs --project ID');
 return applyComments({projectId,comments:value('--comments'),dryRun:args.includes('--dry-run'),projectFile:value('--project-file')&&path.resolve(value('--project-file')),proposals:value('--proposals')&&path.resolve(value('--proposals'))});
}
