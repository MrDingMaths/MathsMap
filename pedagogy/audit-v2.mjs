// Pedagogy audit v2 (docs/booklet-pedagogy-audit-v2.md): one command per booklet master.
//   node pedagogy/review.mjs audit-v2 --project ID [--topics a,b] [--dry-run]
//   node pedagogy/review.mjs audit-v2 --project ID --apply [--run DIR]
// The run writes a candidate and a report under .booklet-work/pedagogy-audit-v2/ID/STAMP/;
// --apply makes the one revision-checked save. Every model call is exactly
// claude-sonnet-5-5 at medium effort through `claude -p`, with no fallback.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {toSource,fromSource,inlinesFromSource,normalizeDocument,visitDocument,DOCUMENT_FORMAT,DOCUMENT_VERSION} from '../public/libs/maths-editor/document-model.mjs';
import {clozeHandwritingMm} from '../public/libs/maths-editor/house-style.mjs';
import {questionReviewContent} from '../src/lib/booklet-review-profile.js';
import {verifiedRating,reasoningTaskHash,REASONING_RUBRIC} from '../scripts/booklet/reasoning-ratings.mjs';
import {withWorkerSlot} from '../scripts/booklet/worker-pool.mjs';
import {planScoreOrder,scoreOrderCandidate,reviewedMethodSupport} from '../polish/score-order.mjs';
import {resolveExerciseReferences} from '../polish/exercise-references.mjs';
import {teacherBlocks,nodesOf} from '../polish/guards.mjs';
import {sequences,canonicalRunDir} from './review.mjs';
import {MODEL,EFFORT,LIMITS,contentFingerprint,wordingFingerprint,bookletIndex,scoreOf,practiceItems,practiceItemCount,duplicatePairs,spellBlock,boldTerm,deriveComparisonScore,bandFor,jumpSlots,slotWindow,diagramBlindHash,diagramEquivalent} from './audit-v2-plan.mjs';
import {auditContract,challengeContract,draftContract,proposalContract,solveContract,ratingContract,equivalenceContract,roleContract,roleGroupContract,variationContract,validateVariations,validateRoles,validateRoleGroups,validateAudit,validateVerdicts,validateDrafts,validateSolve,validatePlacements,validateEquivalence} from './audit-v2-prompts.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value,null,1)+'\n');};
const sha=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const now=()=>new Date().toISOString();
const rel=file=>path.relative(ROOT,file).replaceAll('\\','/');
export const COMMENT_KIND='pedagogy-audit-v2';
const V1_KINDS=new Set(['pedagogy-review','pedagogy-suggestion']);
// Standing comparison anchors (5 November spot check): read live, on Sol's scale.
export const ANCHORS=[['computation-with-integers-2-v1','p30-q2'],['angle-relationships-v1','p72-q3'],['algebraic-fractions-v1','p11-q9'],['area-parallelograms-triangles-v1','p19-q16'],['area-parallelograms-triangles-v1','p18-q14'],['concept-maths-adv11-ch03','p63-q26'],['concept-maths-adv11-ch02','p70-q26'],['concept-maths-x11-ch01','p70-q77'],['enrichment-maths-1-part3-20261008','p12-q7'],['enrichment-maths-1-part14','p12-q23'],['enrichment-maths-1-part11-20261008','p18-q25'],['concept-maths-x11-ch05','p14-q69'],['enrichment-maths-1-part9-20261008','p7-q9'],['enrichment-maths-2-part4-20261009','p33-q18'],['enrichment-maths-1-part3-20261008','p18-q22'],['enrichment-maths-2-part10-20261009','p37-q18']];
// 31 October named progression exceptions: fixed while their task hashes match.
const PROGRESSIONS=[['s6adv-introduction-to-differentiation-2-calculations-with-the-derivative-v1',['p30-q4','p31-q5']],['s6adv-introduction-to-differentiation-2-calculations-with-the-derivative-2-v1',['p46-practice','p47-q1-block','p47-q2-block']],['coordinate-geometry-formulas-v1',['p7-q8','p7-q9-block','p7-q10-block']]];

// ---- model calls -----------------------------------------------------------------
const claudeExe=()=>process.env.MATHSMAP_CLAUDE_BIN??path.join(os.homedir(),'.local','bin','claude.exe');
function spawnClaude({args,prompt,cwd,timeoutMs}){
 return new Promise(resolve=>{
  // No prompt caching (8 November 2026): audit prompts are used once. A cache write costs twice
  // the input price (measured: 4,425 tokens $0.0178 cached, $0.0089 not), and the pilots wrote
  // 6.2 million tokens to the cache while reading back 0.45 million: about a third of their cost.
  const child=spawn(claudeExe(),args,{cwd,windowsHide:true,env:{...process.env,DISABLE_PROMPT_CACHING:'1'}});let out='',err='';
  const timer=setTimeout(()=>{child.kill();err+='\n[timeout]';},timeoutMs);
  child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>err+=d);
  child.on('error',error=>{clearTimeout(timer);resolve({code:-1,out,err:err+error.message});});
  child.on('close',code=>{clearTimeout(timer);resolve({code,out,err});});
  child.stdin.on('error',()=>{});child.stdin.end(prompt);
 });
}
// A reply that closes each array element with an extra brace ('"}},{"id"', Comparing Fractions rating,
// 8 November 2026, twice in a row) is read with the stray braces dropped; nothing else is repaired.
const parseJson=text=>{const s=String(text??'');const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a<0||b<a)throw Error('no JSON object in reply');const body=s.slice(a,b+1);
 try{return JSON.parse(body);}catch(e){try{return JSON.parse(body.replace(/"\}\}(?=\s*,\s*\{\s*")/g,'"}').replace(/"\}\}(?=\s*\]\s*\})/g,'"}'));}catch{
  // A worked example nested in "content" came back one brace short, twice in a row (Probability and Equations 1B,
  // 9 November 2026): the parser stops where the missing brace belongs, so up to two are inserted there.
  let t=body;for(let k=0;k<2;k++){try{return JSON.parse(t);}catch(err){const m=/Expected ',' or '\}' after property value in JSON at position (\d+)/.exec(err.message);if(!m)break;t=t.slice(0,+m[1])+'}'+t.slice(+m[1]);}}
  try{return JSON.parse(t);}catch{
   // A reply that sends a JSON object, then a note ("Wait — that output is malformed … Corrected full JSON
   // follows.") and a second object (Quartiles and Box Plots, Stage 5, 9 November 2026): the last object that
   // parses on its own is the reply.
   const starts=[...body.matchAll(/(^|\n)\{/g)].map(m=>m.index+(m[1]?1:0)).reverse();
   for(const at of starts){const tail=body.slice(at),end=tail.lastIndexOf('}');for(const cut of [tail.length,end+1]){try{return JSON.parse(tail.slice(0,cut));}catch{}}
    const first=tail.split(/\n\s*\n/)[0];try{return JSON.parse(first);}catch{}}
   throw e;}}}};
export const parseReplyJson=parseJson;
// ---- reply reuse (James, 7 November 2026) ---------------------------------------------
// A failed run must never cost its successful calls again: the first Area 1 run spent $12.18 and
// failed at proposal drafting, and nothing could be reused. Every accepted reply is kept, keyed by the
// exact model, effort, system prompt and prompt; a later run of the same booklet that sends the same
// request reuses it at no cost. Identical replies make identical later prompts, so a re-run resumes
// at the point of failure. Only replies that passed validation are reused; --fresh-calls turns it off.
// Calls logged before keys were recorded are matched by stage and prompt text when they are newer than
// the prompt contracts (the system prompt then cannot have changed).
const replyKey=(system,prompt)=>sha(JSON.stringify([MODEL,EFFORT,sha(system),prompt]));
const contractsChangedAt=()=>Math.max(...['audit-v2-prompts.mjs','audit-v2-plan.mjs'].map(f=>fs.statSync(path.join(ROOT,'pedagogy',f)).mtimeMs));
export function reusableReply(ctx,{stage,system,prompt}){
 if(ctx.freshCalls||!ctx.workDir)return null;
 const base=path.dirname(ctx.workDir),key=replyKey(system,prompt),own=path.join(base,'reply-cache',key+'.json');
 if(fs.existsSync(own))return {...read(own),key};
 // Older runs of this booklet: accepted calls with the same stage and prompt, made since the contracts last changed.
 const since=contractsChangedAt();
 for(const run of fs.readdirSync(base).filter(n=>/^\d{8}-\d{6}$/.test(n)&&path.join(base,n)!==ctx.workDir).sort().reverse()){
  const dir=path.join(base,run,'calls');if(!fs.existsSync(dir))continue;
  for(const f of fs.readdirSync(dir).filter(n=>n.endsWith('.json')&&n.includes('-'+stage+'-'))){
   const promptFile=path.join(dir,f.replace(/\.json$/,'.prompt.txt'));if(!fs.existsSync(promptFile))continue;
   const row=read(path.join(dir,f));if(!row.ok||row.model!==MODEL||row.effort!==EFFORT||Date.parse(row.startedAt)<since)continue;
   if(row.systemSha?row.systemSha!==sha(system):false)continue;
   if(fs.readFileSync(promptFile,'utf8')!==prompt)continue;
   let envelope;try{envelope=JSON.parse(row.stdout);}catch{continue;}
   return {key,result:envelope.result,costUsd:row.costUsd??0,source:rel(path.join(dir,f))};
  }
 }
 return null;
}
function keepReply(ctx,{system,prompt,result,costUsd,file}){
 if(!ctx.workDir)return;const key=replyKey(system,prompt);
 write(path.join(path.dirname(ctx.workDir),'reply-cache',key+'.json'),{key,model:MODEL,effort:EFFORT,systemSha:sha(system),promptSha:sha(prompt),savedAt:now(),costUsd,source:rel(file),result});
}
// One call: refuse over the cap, never truncate; exact model or failure; validate,
// retry once if malformed. Every attempt is logged with time, tokens and cost.
export async function callSonnet(ctx,{stage,system,prompt,validate=x=>x,timeoutMs=900000}){
 const size=system.length+prompt.length;
 if(size>LIMITS.promptCharacters)throw Object.assign(Error(`${stage} prompt is ${size} characters, over ${LIMITS.promptCharacters}; it is not sent or truncated`),{blocker:true});
 if(ctx.dryRun)throw Error('dry run makes no model calls');
 const reuse=reusableReply(ctx,{stage,system,prompt});
 if(reuse){
  try{
   const value=validate(parseJson(reuse.result));
   const id=`${String(ctx.seq=(ctx.seq??0)+1).padStart(2,'0')}-${stage}-reused`,file=path.join(ctx.workDir,'calls',id+'.json');
   const row={id,stage,attempt:0,model:MODEL,effort:EFFORT,promptCharacters:size,startedAt:now(),elapsedMs:0,exitCode:0,usage:null,costUsd:0,reused:{from:reuse.source,savedUsd:reuse.costUsd??0},systemSha:sha(system),ok:true};
   write(path.join(ctx.workDir,'calls',id+'.prompt.txt'),prompt);write(file,{...row,stdout:JSON.stringify({result:reuse.result}),stderr:''});
   ctx.calls.push(row);ctx.log(`  ${stage}: reused an accepted reply from ${reuse.source} (saved $${(reuse.costUsd??0).toFixed(3)})`);
   if(!reuse.source?.includes('reply-cache'))keepReply(ctx,{system,prompt,result:reuse.result,costUsd:reuse.costUsd,file:path.join(ROOT,reuse.source)});
   return {value,file:rel(file)};
  }catch(error){ctx.log(`  ${stage}: kept reply no longer validates (${error.message.slice(0,120)}); calling again`);}
 }
 const cwd=path.join(os.tmpdir(),'mathsmap-audit-v2');fs.mkdirSync(cwd,{recursive:true});
 const systemFile=path.join(cwd,'system-'+sha(system).slice(0,16)+'.txt');if(!fs.existsSync(systemFile))fs.writeFileSync(systemFile,system);
 const args=['-p','--model',MODEL,'--effort',EFFORT,'--tools','','--no-session-persistence','--output-format','json','--max-turns','1','--safe-mode','--strict-mcp-config','--settings','{"fallbackModel":[]}','--system-prompt-file',systemFile];
 let lastError;
 for(let attempt=1;attempt<=2;attempt++){
  const id=`${String(ctx.seq=(ctx.seq??0)+1).padStart(2,'0')}-${stage}-${attempt}`,file=path.join(ctx.workDir,'calls',id+'.json');
  const started=Date.now();
  const run=()=>spawnClaude({args,prompt,cwd,timeoutMs});
  const r=ctx.runDir?await withWorkerSlot(ctx.runDir,{stage:'pedagogy-audit-v2-'+stage,model:MODEL,provider:'claude-code'},run):await run();
  const row={id,stage,attempt,model:MODEL,effort:EFFORT,promptCharacters:size,startedAt:new Date(started).toISOString(),elapsedMs:Date.now()-started,exitCode:r.code,systemSha:sha(system)};
  write(path.join(ctx.workDir,'calls',id+'.prompt.txt'),prompt);
  let envelope=null;try{envelope=JSON.parse(r.out);}catch{}
  if(envelope){row.usage=envelope.usage??null;row.costUsd=envelope.total_cost_usd??null;row.models=Object.keys(envelope.modelUsage??{});row.thinkingTokens=envelope.usage?.output_tokens_details?.thinking_tokens??null;}
  write(file,{...row,stdout:r.out,stderr:r.err.slice(0,20000)});
  ctx.calls.push(row);
  try{
   if(r.code!==0||!envelope)throw Error('claude exited '+r.code+': '+r.err.slice(0,300));
   if(envelope.is_error!==false||row.models.length!==1||row.models[0]!==MODEL)throw Error('exact '+MODEL+' result required; got '+row.models.join(','));
   const value=validate(parseJson(envelope.result));
   row.ok=true;write(file,{...row,stdout:r.out,stderr:r.err.slice(0,20000)});keepReply(ctx,{system,prompt,result:envelope.result,costUsd:row.costUsd,file});ctx.log(`  ${stage}: ${Math.round(row.elapsedMs/1000)} s, ${row.usage?.output_tokens??'?'} output tokens, $${(row.costUsd??0).toFixed(3)}`);
   return {value,file:rel(file)};
  }catch(error){row.ok=false;row.error=error.message;lastError=error;write(file,{...row,stdout:r.out,stderr:r.err.slice(0,20000)});ctx.log(`  ${stage}: attempt ${attempt} failed: ${error.message.slice(0,200)}`);}
 }
 throw Object.assign(lastError,{blocker:true});
}

// ---- views ----------------------------------------------------------------------
const META=new Set(['sourceReview','sourceRefs','sourcePageNumber','sourceOrder','sourceAtom','sourceLayoutEvidence','classification','snapshotKind','bankRef','flow','presentation','provenance','answerSpaceMm','layout','columns','align','marks','origin','source','reviewStatus','widthMm','arrangement','preserveParagraphAlignment']);
const isDoc=value=>value&&typeof value==='object'&&value.format&&Array.isArray(value.blocks);
// Embedded image data says nothing to a text-only call: it becomes a placeholder (6 November 2026;
// one Bivariate Data exam question was 444,000 characters, mostly base64).
const DATA_URI=/data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z0-9+/=\s]+/g;
const dropImageData=s=>s.length>1000&&s.includes(';base64,')?s.replace(DATA_URI,m=>`[embedded image, ${Math.round(m.length*3/4/1024)} KB]`):s;
// Diagram summaries (8 November 2026): TikZ source was 21–42% of every audit packet (Volume:
// 386,000 of 922,000 characters). Reading a diagram needs its description, its mathematics and the
// values printed on it, not its coordinates and styling, so summary views keep those and the
// printed labels. Drafting views keep the code: the drafter copies the booklet's diagram style.
const SUMMARY_META=new Set(['sourceRegion','answerVisibility','sourcePage']);
export function tikzLabels(code){
 const out=[];const re=/node\s*(?:\[[^\]]*\])?\s*(?:at\s*\([^)]*\))?\s*\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}/g;
 for(const m of String(code).matchAll(re)){const t=m[1].replace(/\\special\{[^{}]*\}/g,'').replace(/\\\\/g,' ').replace(/\s+/g,' ').trim();if(t)out.push(t);}
 return [...new Set(out)];
}
// In editor source text a table row is one line, cells split by tabs; a cell's own line breaks and paragraphs
// would end the row. Views shown to models print each cell on one line, so a drafter copying a booklet table
// copies a table it can rebuild: Probability j9 copied "Red counter / chosen" headings as broken rows and its
// results table printed in pieces (8 November 2026). The booklet itself is not changed.
export function oneLineCells(doc){
 const copy=structuredClone(doc);
 visitDocument(copy,n=>{if(n.type!=='table')return;for(const row of n.rows??[])for(const cell of row??[]){
  if(!(cell.blocks??[]).length||!cell.blocks.every(b=>b.type==='paragraph'))continue;
  const inl=(cell.blocks??[]).filter(b=>b.type==='paragraph').flatMap((b,i)=>[...(i?[{type:'text',text:' ',marks:[]}]:[]),...(b.inlines??[]).map(x=>x.type==='break'?{type:'text',text:' ',marks:[]}:x)]);
  if((cell.blocks??[]).length>1||inl.some((x,i)=>x!==(cell.blocks?.[0]?.inlines??[])[i]))cell.blocks=[{...(cell.blocks?.[0]??{type:'paragraph'}),type:'paragraph',inlines:inl}];}});
 return copy;
}
function clean(value,{answers,diagrams='full'}){
 const o={answers,diagrams};
 if(typeof value==='string')return dropImageData(value);
 if(Array.isArray(value))return value.map(child=>clean(child,o)).filter(child=>child!==undefined);
 if(!value||typeof value!=='object')return value;
 if(isDoc(value)){try{return dropImageData(toSource(oneLineCells(value)));}catch{}}
 // A diagram with no description or mathematics (a new draft's figure) keeps its code: its labels alone
 // drop the plotted data, and the blind solve could not read a drafted graph (Rates 2 j8, 9 November 2026).
 const described=v=>!!(v.spec?.description||v.spec?.mathematics||v.description||v.mathematics);
 const out={},summary=diagrams==='summary'&&typeof value.code==='string'&&(value.format==='tikz'||/tikzpicture/.test(value.code))&&described(value);
 for(const [key,child]of Object.entries(value)){
  if(META.has(key)||diagrams==='summary'&&SUMMARY_META.has(key))continue;
  if(summary&&key==='code'){const labels=tikzLabels(child);if(labels.length)out.labels=labels;continue;}
  if(!answers&&['answer','theorySolution','solutionDiagrams','solution','worked'].includes(key))continue;
  const v=clean(child,o);if(v===undefined||v===null||v===''||(Array.isArray(v)&&!v.length))continue;out[key]=v;
 }
 return out;
}
export const studentView=(block,{answers=true,diagrams='full'}={})=>clean(block.type==='question'?{...questionReviewContent(block),id:block.id}:block,{answers,diagrams});
// What the audit, challenge, ratings and solve references see: diagrams as summaries.
export const auditView=(block,options={})=>studentView(block,{...options,diagrams:'summary'});
const typeOf=(state,id)=>state.types.get(id)?.type??null;
// A part's line in a comment: a diagram-only part has no prompt (it printed "undefined", 7 November 2026).
export const partText=p=>[typeof p.prompt==='string'?p.prompt.trim():'',(p.questionDiagrams??[]).length?'(with a diagram)':''].filter(Boolean).join(' ')||'(no prompt)';
// The questions a bridge, extension or missing type is for, which the challenge must see (7 November 2026).
// The auditor's neededBy wins; without it a bridge or extension takes the next questions in its exercise,
// and a missing type takes its topic's exercise questions of that type.
export function challengeTargets(project,state,kind,row){
 if((row.neededBy??[]).length)return row.neededBy;
 const rows=bookletIndex(project);
 if(kind==='bridges'||kind==='extensions'||kind==='variations'){const owner=new Map(rows.flatMap(r=>nodesOf(r.block).map(n=>[String(n.id),r.block.id]))),id=owner.get(String(row.after))??row.after,at=rows.findIndex(r=>r.block.id===id);
  if(at<0)return [];return rows.slice(at+1).filter(r=>r.section.id===rows[at].section.id&&r.question).slice(0,LIMITS.challengeFollowing).map(r=>r.block.id);}
 if(kind==='missing'&&row.type)return rows.filter(r=>r.routine&&(!row.topicId||r.section.topicId===row.topicId)&&typeOf(state,r.block.id)===row.type).slice(0,LIMITS.challengeFollowing).map(r=>r.block.id);
 return [];
}

// ---- records ----------------------------------------------------------------------
export const recordFile=(id,{root=ROOT}={})=>path.join(root,'booklets','provenance','pedagogy-review','audit-v2',id+'.json');
export const proposalsFile=(id,{root=ROOT}={})=>path.join(root,'booklets','provenance','pedagogy-review','audit-v2',id+'.proposals.json');
// A split part 2 (source.partition, 6 November 2026) starts from its parent's checks: they are keyed by
// block id and content fingerprint, so only blocks the split changed go stale.
const loadRecord=(id,root,parentId)=>{const file=recordFile(id,{root});if(fs.existsSync(file))return read(file);
 const parent=parentId&&recordFile(parentId,{root}),p=parent&&fs.existsSync(parent)?read(parent):null;
 return {version:1,projectId:id,checks:{...p?.checks},types:{...p?.types},exampleMatches:{...p?.exampleMatches},keep:[],runs:[],...(p?{inheritedFrom:{projectId:parentId,checkedRevision:p.checkedRevision??null}}:{})};};
const parentOf=project=>project.source?.partition?.parentProjectId;
// A stored archetype map is reused for a block whose reviewed snapshot content is unchanged.
function storedTypes(project,rows,root){
 const out=new Map(),snapshots=new Map();
 for(const {block}of rows){
  const review=block.classification?.archetypeReview,type=block.classification?.archetype;if(!review?.mapFile||!type)continue;
  let snap=snapshots.get(review.mapFile);
  if(snap===undefined){snap=null;try{const file=path.resolve(root,review.mapFile),map=read(file),dir=path.dirname(file);const want=String(map.snapshotSha256??review.snapshotSha256??'').toLowerCase();
   const candidates=[map.snapshot,map.metadataRatingProjection?.projectedSnapshot,...fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>path.join(dir,n))].filter(Boolean);
   for(const c of candidates){const f=path.resolve(root,c);if(!fs.existsSync(f))continue;const bytes=fs.readFileSync(f);if(want&&createHash('sha256').update(bytes).digest('hex')!==want)continue;const s=JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));if((s.id===project.id||s.id===parentOf(project))&&Array.isArray(s.sections)){snap=new Map(s.sections.flatMap(x=>(x.blocks??[]).map(b=>[b.id,b])));break;}}}catch{}snapshots.set(review.mapFile,snap);}
  const old=snap?.get(block.id);
  out.set(block.id,{type,current:!!old&&contentFingerprint(old)===contentFingerprint(block),source:review.mapFile,snapshot:!!snap});
 }
 return out;
}
// Blocks whose answers were accepted at import with unchanged content: no error check needed.
function importAccepted(project,root){
 const runId=project.source?.runId??project.runId,file=runId&&path.join(root,'.booklet-work','full-imports',String(runId).replace(/[^\w.-]/g,'_'),'lean-review','reviewed.json');
 const out=new Set();if(!file||!fs.existsSync(file))return out;
 try{const rows=read(file).questions??{};for(const [id,row]of Object.entries(rows))if(row?.outcome==='passed'&&row.acceptedVersion?.snapshot)out.add(id+'|'+contentFingerprint(row.acceptedVersion.snapshot));}catch{}
 return out;
}
function progressionFixed(project,root){
 const doc=fs.readFileSync(path.join(root,'docs','booklet-progression-exceptions-20261031.md'),'utf8'),hashes=new Map([...doc.matchAll(/\|\s*`([^`]+)`\s*\|\s*`([a-f0-9]{64})`\s*\|/g)].map(m=>[m[1],m[2]]));
 const blocks=new Map((project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,b])));
 return PROGRESSIONS.filter(([id,ids])=>id===project.id&&ids.every(x=>blocks.has(x)&&(!hashes.has(x)||reasoningTaskHash(blocks.get(x))===hashes.get(x)))).map(([,ids])=>ids);
}
export function inFlight(project){
 const runId=project.source?.runId??project.runId??'';
 const r=spawnSync('powershell.exe',['-NoProfile','-Command',`Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.ProcessId -ne ${process.pid} -and $_.CommandLine -match '[\\\\/](lean-import|lean-review|check-feedback-pages|publish-project|export[\\w-]*)\\.mjs|polish[\\\\/]run\\.mjs' } | ForEach-Object { $_.CommandLine }`],{encoding:'utf8',windowsHide:true});
 return String(r.stdout??'').split(/\r?\n/).filter(line=>line.includes(project.id)||runId&&line.includes(runId));
}
// Stage 4 masters are eligible (James, 7 November 2026): the ledger lists only Stage 5 and 6.
export const isStage4Master=project=>project?.library?.courseId==='s4'&&project.library.category==='master'&&!project.library.archived;
function isMaster(id,root,project=null){
 if(isStage4Master(project))return true;
 const file=path.join(root,'.booklet-work','end-goal-20261028','coverage-status.json');
 if(!fs.existsSync(file))return null;
 return (read(file).rows??[]).some(row=>row.id===id);
}

// ---- Stage 0: diagram-only changes keep their rating (James, 6 November 2026) ----------
// A rating whose task hash no longer matches is carried over when the question it was given to
// differs from the current one only in drawing code. The rated version is found by its stored
// diagram-blind hash, or else by its task hash in this audit's run folders, the revision snapshots
// and the last commit.
function ratedVersions(projectId,root){
 const files=[],runs=path.join(root,'.booklet-work','pedagogy-audit-v2',projectId),rev=path.join(root,'booklets','projects','.revisions',projectId);
 if(fs.existsSync(runs))for(const d of fs.readdirSync(runs).sort().reverse()){const f=path.join(runs,d,'candidate.json');if(fs.existsSync(f))files.push({source:rel(f),load:()=>read(f)});}
 if(fs.existsSync(rev))for(const n of fs.readdirSync(rev).filter(n=>/^\d+\.json$/.test(n)).sort((a,b)=>parseInt(b)-parseInt(a)).slice(0,40))files.push({source:rel(path.join(rev,n)),load:()=>read(path.join(rev,n))});
 files.push({source:'git HEAD',load:()=>{const r=spawnSync('git',['show','HEAD:booklets/projects/'+projectId+'.json'],{cwd:root,encoding:'utf8',maxBuffer:256*1024*1024,windowsHide:true});if(r.status)throw Error('not in HEAD');return JSON.parse(r.stdout.replace(/^﻿/,''));}});
 return files;
}
export function diagramRebinds(project,{root=ROOT}={}){
 const pending=bookletIndex(project).filter(r=>r.question&&!verifiedRating(r.block)&&r.block.classification?.assessment?.taskHash).map(r=>r.block);
 if(!pending.length)return [];
 const versions=ratedVersions(project.id,root),loaded=[],out=[];
 const versionBlock=(i,id)=>{if(!(i in loaded)){try{loaded[i]=new Map((versions[i].load().sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,b])));}catch{loaded[i]=new Map();}}return loaded[i].get(id);};
 for(const block of pending){
  const a=block.classification.assessment,blind=diagramBlindHash(block);let source=null;
  if(a.diagramBlindHash===blind)source='stored diagram-blind hash';
  else for(let i=0;i<versions.length&&!source;i++){const old=versionBlock(i,block.id);if(old&&reasoningTaskHash(old)===a.taskHash&&diagramBlindHash(old)===blind)source=versions[i].source;}
  if(!source)continue;
  const copy=structuredClone(block),b=copy.classification.assessment;
  b.originalTaskHash??=b.taskHash;b.diagramReuse={kind:'diagram-only-v1',previousTaskHash:b.taskHash,diagramBlindHash:blind,source};b.taskHash=reasoningTaskHash(copy);b.diagramBlindHash=blind;
  if(verifiedRating(copy))out.push({id:block.id,classification:copy.classification,source});
 }
 return out;
}
const withRebinds=(project,rebinds)=>{if(!rebinds.length)return project;const by=new Map(rebinds.map(r=>[r.id,r]));const p=structuredClone(project);for(const s of p.sections??[])for(const b of s.blocks??[])if(by.has(b.id))b.classification=by.get(b.id).classification;return p;};

// ---- Stage 0: preflight ------------------------------------------------------------
export function preflight(project,{root=ROOT,topics=[],allowNonMaster=false}={}){
 const master=isMaster(project.id,root,project);
 if(master===false&&!allowNonMaster)throw Error(project.id+' is not a booklet master (not in the programme ledger). The audit is for booklet masters.');
 const busy=inFlight(project);if(busy.length)throw Error('An import, review, export or repair is running for this booklet: '+busy[0].slice(0,200));
 const rows=bookletIndex(project),record=loadRecord(project.id,root,parentOf(project)),stored=storedTypes(project,rows,root),accepted=importAccepted(project,root),protectedIds=teacherBlocks(project);
 const fp=new Map(rows.map(r=>[r.block.id,contentFingerprint(r.block)]));
 const checked=(id,kind)=>record.checks?.[id]?.[kind]===fp.get(id);
 const stale={rating:[],type:[],error:[],duplicate:[],theory:[]},types=new Map();
 const all=sequences(project),selected=new Set(topics.length?all.filter(s=>topics.includes(s.id)||topics.includes(s.topicId)).flatMap(s=>s.sections.map(x=>x.id)):[]);
 const inScope=r=>!selected.size||selected.has(r.section.id)||r.exam;
 for(const r of rows){
  const id=r.block.id;if(!inScope(r))continue;
  if(r.question){
   if(!verifiedRating(r.block))stale.rating.push(id);
   if(checked(id,'type')&&record.types?.[id])types.set(id,{type:record.types[id],current:true,source:'audit-v2'});
   else if(stored.get(id)?.current)types.set(id,{type:stored.get(id).type,current:true,source:'stored-map'});
   else stale.type.push(id);
   if(!checked(id,'duplicate'))stale.duplicate.push(id);
  }
  if((r.question||r.example)&&!checked(id,'error')&&!accepted.has(id+'|'+fp.get(id)))stale.error.push(id);
  if(r.kind==='teaching'&&!checked(id,'theory'))stale.theory.push(id);
 }
 // Lessons with teaching but no Key ideas box (James, 8 November 2026): re-judged whenever the
 // lesson's teaching changes.
 stale.keyIdeas=[...keyIdeasLessons(project)].filter(([t,l])=>(!selected.size||l.sectionIds.some(id=>selected.has(id)))&&record.checks?.['keyideas|'+t]?.keyIdeas!==l.fp).map(([t])=>t);
 const questions=rows.filter(r=>r.question).map(r=>r.block);
 const pairs=duplicatePairs(questions,{stale:new Set(stale.duplicate)});
 // Spelling is presentation-only: applied in the candidate, except on teacher-protected blocks.
 const spelling=[];
 for(const r of rows){if(r.kind==='front-matter')continue;const {block,changes}=spellBlock(r.block);if(changes.length)spelling.push({id:r.block.id,changes,protected:protectedIds.has(r.block.id),block});}
 const flags=project.studio?.flags??[];
 const v1=flags.filter(f=>V1_KINDS.has(f.kind)&&!f.resolved);
 const open=flags.filter(f=>!f.resolved);
 return {project,rows,record,fp,stale,types,storedTypes:stored,pairs,spelling,protectedIds,openComments:open.length,v1Comments:v1,progressions:progressionFixed(project,root),master};
}

// ---- Stage 2 and 4: moves and order ---------------------------------------------------
const linkIds=node=>[...(Array.isArray(node.dependsOn)?node.dependsOn:node.dependsOn?[node.dependsOn]:[]),...(node.flow?.dependsOn??[]),node.continuationOf,node.flow?.continuationOf,node.pairedBlockId].filter(x=>typeof x==='string');
function unitsOf(blocks){
 const owner=new Map(blocks.flatMap(b=>nodesOf(b).map(n=>[n.id,b.id]))),parent=new Map(blocks.map(b=>[b.id,b.id]));
 const root=id=>{while(parent.get(id)!==id)id=parent.get(id);return id;};
 for(const b of blocks)for(const n of nodesOf(b))for(const ref of linkIds(n)){const o=owner.get(ref);if(o&&o!==b.id)parent.set(root(b.id),root(o));}
 blocks.forEach((b,i)=>{if(b.flow?.keepWithNext&&blocks[i+1])parent.set(root(blocks[i+1].id),root(b.id));});
 const units=new Map();for(const b of blocks){const k=root(b.id);if(!units.has(k))units.set(k,[]);units.get(k).push(b);}
 return [...units.values()];
}
// The lessons after an exercise's own (titles and teaching headings), so a drafted question never needs
// what a later lesson teaches (James, 9 November 2026). Exam and Challenge sections are not lessons.
export function laterLessons(project,sectionId){
 const sections=project.sections??[],at=sections.findIndex(s=>s.id===sectionId);if(at<0)return [];
 const own=sections[at].topicId,seen=new Set([own]),out=[];
 for(const s of sections.slice(at+1)){const t=s.topicId;if(!t||seen.has(t)||s.role==='challenge'||s.role==='exam'||/exam|challenge/i.test(t))continue;seen.add(t);
  const topic=(project.topics??[]).find(x=>x.id===t),heads=sections.filter(x=>x.topicId===t&&x.phase==='teaching').flatMap(x=>(x.blocks??[]).map(b=>b.sourceAtom?.visibleSubtitle??x.title).filter(Boolean));
  out.push({topicId:t,title:topic?.title??s.title??t,teaches:[...new Set(heads)].slice(0,8)});}
 return out;
}
// What must go with a block that moves to Challenge (James, 9 November 2026): the blocks that depend on it
// (dependsOn points back to it) and the blocks tied to it (continuation, pairing, keepWithNext), never the
// blocks it depends on. A prerequisite left behind still comes before Challenge. Polynomials 1A p14-q9
// (monomial division, rated 37) went to Challenge only because p14-q10 (rated 70) was recorded as depending on it.
function goesWith(blocks){
 const owner=new Map(blocks.flatMap(b=>nodesOf(b).map(n=>[n.id,b.id]))),out=new Map(blocks.map(b=>[b.id,new Set()]));
 const tie=(a,b)=>{if(a&&b&&a!==b){out.get(a).add(b);out.get(b).add(a);}};
 for(const b of blocks)for(const n of nodesOf(b)){
  for(const ref of [...(Array.isArray(n.dependsOn)?n.dependsOn:n.dependsOn?[n.dependsOn]:[]),...(n.flow?.dependsOn??[])]){const o=owner.get(ref);if(o&&o!==b.id)out.get(o).add(b.id);}
  for(const ref of [n.continuationOf,n.flow?.continuationOf,n.pairedBlockId].filter(x=>typeof x==='string'))tie(b.id,owner.get(ref));
 }
 blocks.forEach((b,i)=>{if(b.flow?.keepWithNext&&blocks[i+1])tie(b.id,blocks[i+1].id);});
 return out;
}
export function challengeMoves(project){
 const moves=[];
 for(const section of project.sections??[]){
  const rows=bookletIndex({...project,sections:[section]});if(rows[0]?.kind!=='exercise')continue;
  const routine=new Set(rows.filter(r=>r.routine).map(r=>r.block.id)),blocks=section.blocks??[],byId=new Map(blocks.map(b=>[b.id,b])),links=goesWith(blocks);
  const taken=new Set();
  for(const unit of unitsOf(blocks)){
   if(!unit.every(b=>routine.has(b.id)))continue;
   const seeds=unit.filter(b=>verifiedRating(b)&&scoreOf(b)>LIMITS.routineCeiling);if(!seeds.length)continue;
   const move=new Set(),stack=seeds.map(b=>b.id);while(stack.length){const id=stack.pop();if(move.has(id))continue;move.add(id);for(const next of links.get(id)??[])stack.push(next);}
   const ids=unit.map(b=>b.id).filter(id=>move.has(id)&&!taken.has(id));ids.forEach(id=>taken.add(id));if(!ids.length)continue;
   moves.push({sectionId:section.id,topicId:section.topicId,ids,score:Math.max(...ids.map(id=>scoreOf(byId.get(id))??0))});
  }
 }
 return moves;
}
function applyMoves(candidate,moves){
 if(!moves.length)return candidate;
 let challenge=candidate.sections.find(s=>s.phase==='practice'&&s.role==='challenge');
 if(!challenge){challenge={id:candidate.id+'-challenge',topicId:'challenge',title:'Challenge exercise',phase:'practice',role:'challenge',workingSpace:'none',blocks:[]};candidate.sections.push(challenge);candidate.topics??=[];if(!candidate.topics.some(t=>t.id==='challenge'))candidate.topics.push({id:'challenge',title:'Challenge exercise'});}
 const moved=[];
 for(const move of [...moves].sort((a,b)=>a.score-b.score)){const s=candidate.sections.find(x=>x.id===move.sectionId);for(const id of move.ids){const i=s.blocks.findIndex(b=>b.id===id);if(i>=0)moved.push(s.blocks.splice(i,1)[0]);}}
 challenge.blocks.push(...moved);
 return candidate;
}
// Whole-question score order through the shared planner; held segments stay as they are.
// Questions whose recorded audit v2 type check matches their current content.
export function typeCheckedIds(project,{root=ROOT}={}){
 const file=recordFile(project.id,{root});if(!fs.existsSync(file))return new Set();
 let record;try{record=read(file);}catch{return new Set();}
 const out=new Set();for(const s of project.sections??[])for(const b of s.blocks??[]){const fp=record.checks?.[b.id]?.type;if(fp&&b.type==='question'&&fp===contentFingerprint(b))out.add(b.id);}
 return out;
}
export function orderCandidate(candidate,{keep=[],deliberate=[],progressions=[],original=null,typeChecked=null}={}){
 // Support from a teaching block is coverage only: teaching always precedes its exercise and sorting never moves it.
 const teachingIds=new Set((candidate.sections??[]).filter(s=>s.phase==='teaching').flatMap(s=>(s.blocks??[]).map(b=>b.id)));
 // Bolding is presentation-only: reviewed method evidence is checked against the teaching before it.
 const before=new Map((original?.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,b])));
 const evidence=original?{...candidate,sections:candidate.sections.map(s=>s.phase!=='teaching'?s:{...s,blocks:(s.blocks??[]).map(b=>before.has(b.id)&&contentFingerprint(before.get(b.id))===contentFingerprint(b)?before.get(b.id):b)})}:candidate;
 // Support from an earlier practice question is a prerequisite (6 November 2026): the sort keeps
 // it first, and only a real conflict holds, instead of every such pair holding the whole exercise.
 // A question changed only in its diagram still matches its reviewed version (James, 6 November 2026).
 // A teaching anchor reworded since the type review (the audit's own theory rewrites, Polynomials 1A, 9 November
 // 2026) still anchors the same method: teaching never moves and its support is coverage only, so it cannot change
 // an order. Practice questions still need their reviewed content.
 // A practice question changed since the type review but whose audit v2 type check matches its current content has
 // had its method confirmed since the change (Polynomials 1A p25-q1, p21-q2, p26-q3: a reworded hint, axis labels on
 // a blank grid), so its reviewed support still holds.
 const checked=typeChecked??typeCheckedIds(candidate);
 const teachingEquivalent=(current,reviewed)=>diagramEquivalent(current,reviewed)||(current?.id===reviewed?.id&&(teachingIds.has(current?.id)||checked.has(current?.id)));
 const support=reviewedMethodSupport(evidence,{equivalentContent:teachingEquivalent,practiceSupportDecision:c=>teachingIds.has(c.before)?{relation:'coverage-only',reason:'The supporting block is teaching, which precedes the exercise; whole-question sorting cannot move it.'}:{relation:'prerequisite',reason:'Pedagogy audit v2: a reviewed practice item that supports this question stays before it.'}}),referenceResolution=resolveExerciseReferences(candidate);
 const known=new Set((candidate.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>b.id))),sectionOf=new Map((candidate.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,s.id])));
 const sameSection=ids=>ids.every(id=>known.has(id))&&new Set(ids.map(id=>sectionOf.get(id))).size===1;
 const semanticUnits=[...progressions.map(ids=>({ids,reason:'31 October named progression exception',evidence:'docs/booklet-progression-exceptions-20261031.md'})),...keep.filter(k=>sameSection(k.ids)).map(k=>({ids:k.ids,reason:'audit v2 keep: '+k.kind,evidence:k.reason||'audit v2'}))];
 const supportEdges=[...support.edges,...deliberate.filter(sameSection).map(([a,b])=>({before:a,after:b,kind:'deliberate-duplicate-pair'}))];
 const plan=planScoreOrder(candidate,{supportEdges,contextHolds:support.holds,semanticUnits,referenceResolution});
 // An unsettled printed reference holds every exercise in the booklet, and the reference
 // renumbering refuses to run; the order is left as it is and the holds become comments
 // (6 November 2026: 49 of 130 masters stopped here in the rollout dry run).
 if(referenceResolution.holds.length)return {project:candidate,plan};
 return {project:scoreOrderCandidate(candidate,plan),plan};
}
// Challenge exercises are sorted by difficulty with the same rules as exercises (James, 9 November 2026): the
// audit's own plan (planScoreOrder: verified ratings, whole questions, dependants together, support edges, pins,
// keep runs). An unresolved printed reference elsewhere in the booklet holds every section in the plan; for a
// Challenge section only holds naming one of its own questions count, as for exercises held only by a reference
// elsewhere (8 November 2026). A Challenge question that a printed reference resolves to keeps the order, since
// renumbering is the planner's and runs only for a fully settled booklet.
export function sortChallengeSections(project,options={}){
 const {plan}=orderCandidate(project,options),rr=resolveExerciseReferences(project),refText=JSON.stringify([rr.records??[],rr.groups??[]]);
 const out=structuredClone(project),report=[];
 for(const row of plan.sections){if(row.role!=='challenge')continue;
  const s=out.sections.find(x=>x.id===row.sectionId);if(!s)continue;
  for(const seg of row.segments){const ids=new Set(seg.originalIds);
   const local=seg.holds.filter(h=>[h.id,...(h.ids??[]),h.after,h.before].some(x=>ids.has(x)));
   const referenced=seg.originalIds.filter(id=>refText.includes('"'+id+'"'));
   const changed=seg.originalIds.some((id,i)=>id!==seg.proposedIds[i]);
   if(!changed){report.push({sectionId:s.id,ids:seg.originalIds,status:'already-ordered'});continue;}
   if(local.length||referenced.length){report.push({sectionId:s.id,ids:seg.originalIds,status:'held',holds:[...local.map(h=>h.kind+' '+(h.id??h.ids?.join('+')??'')),...referenced.map(id=>'printed-reference '+id)]});continue;}
   const at=s.blocks.findIndex(b=>b.id===seg.originalIds[0]),byId=new Map(s.blocks.map(b=>[b.id,b]));
   if(s.blocks.slice(at,at+seg.originalIds.length).map(b=>b.id).join()!==seg.originalIds.join())throw Error('Challenge segment not contiguous in '+s.id);
   s.blocks.splice(at,seg.originalIds.length,...seg.proposedIds.map(id=>byId.get(id)));
   report.push({sectionId:s.id,ids:seg.proposedIds,status:'sorted',from:seg.originalIds});}}
 return {project:out,report};
}
// Ordering holds become one Studio comment per held segment. The comment names what held it: an unresolved
// printed reference anywhere in the booklet holds every exercise, so "Held by" says where it is and whether it
// is in this exercise (8 November 2026: 95 of 201 Stage 4 holds came from one reference elsewhere).
const HOLD_RELEASE={'rating-unverified':'a current verified rating for each named question','layout-pin-needs-pagination-evidence':'removing the keep-with-next pin or recording page evidence for it','layout-row-needs-pagination-evidence':'page evidence for the side-by-side row','printed-reference':'resolving the printed cross-question reference','unresolved-dependency':'fixing the dependency link','dependency-outside-sort-segment':'moving the dependency into this exercise','method-support-cycle':'breaking the circular method support between the named questions','method-support-context-uncertain':'a decision on whether the earlier method question must stay first','review-context-unverified':'re-mapping the question type of the changed question','noncontiguous-semantic-unit':'placing the kept sequence together',
 'unresolved-relative-or-cross-scope-reference':'rewording or settling the printed reference ("the previous question", "the figure below") so the planner can renumber it',
 'unsupported-nonpractice-printed-reference':'rewording the teaching block\'s printed reference to a question or example',
 'unsupported-native-code-reference':'moving the question reference out of the figure code',
 'unsupported-math-reference':'moving the question number out of the maths','unsupported-math-token-reference':'moving the question number out of the maths',
 'ambiguous-range-list-decimal-or-page-reference':'rewording the ambiguous numbered reference','ambiguous-numbered-reference':'naming the question unambiguously','dangling-numbered-reference':'fixing the reference to a question that does not exist','reference-outside-sort-section':'a decision on the reference to a question in another exercise'};
export function holdComments(plan,project){
 const out=[];
 for(const s of plan.sections)for(const seg of s.segments)if(seg.status==='held'&&seg.holds.length&&seg.originalIds.length>1){
  const kinds=[...new Set(seg.holds.map(h=>h.kind))],inSeg=new Set(seg.originalIds);
  // Support edges carry before/after, not id (10 November 2026: "method-support-order at undefined").
  const causes=[...new Set(seg.holds.map(h=>{const pair=h.before&&h.after,id=h.id??(pair?`${h.before} → ${h.after}`:h.ids?.[0]),q=h.quote??h.text,members=h.ids??(pair?[h.before,h.after]:[h.id]);return (q?`"${String(q).replace(/\s+/g,' ').slice(0,80)}" in `:h.kind+' at ')+id+(members.some(x=>inSeg.has(x))?'':' (outside this exercise)');}))];
  out.push({targetId:seg.originalIds[0],kind:'ordering-hold',key:'hold|'+s.sectionId+'|'+seg.originalIds[0],note:`[Pedagogy audit v2 · Ordering hold] These questions were left in their current order instead of being sorted by difficulty: ${seg.originalIds.join(', ')}. Hold: ${kinds.join(', ')}. Held by: ${causes.slice(0,4).join('; ')}${causes.length>4?` and ${causes.length-4} more`:''}. What would release it: ${kinds.map(k=>HOLD_RELEASE[k]??k).join('; ')}.`});
 }
 return out;
}

// ---- Stage 4: gap plan -------------------------------------------------------------
// One small call labels the types that are short of the minimum as core or enrichment; their roles go onto
// audit.types. A type the call cannot label stays unlabelled, which counts as core (the cautious default).
// The same call groups synonymous types (identical method, James 8 November 2026) onto audit.typeGroups,
// so they count as one type. Grouping only raises counts, so the types short before grouping are the
// only ones that can need a role after it. If the call fails, the roles-only call runs, with no grouping.
export async function labelTypeRoles(ctx,candidate,state,audit){
 audit.typeGroups=[];delete audit.typeGroupsFailed;
 const plan=gapPlan(candidate,state,{audit});
 // Every short type is a grouping candidate; only the unlabelled ones need a role.
 const deficit=[...new Set(plan.deficits.map(d=>d.type))],short=deficit.filter(t=>!(audit.types.find(x=>x.type===t)?.role));
 if(!deficit.length)return [];
 const rows=bookletIndex(candidate),topicTitle=id=>candidate.topics?.find(x=>x.id===id)?.title??id??null;
 const questionsOf=(t,n)=>{const key=typeKey(t);return rows.filter(r=>r.routine&&typeKey(typeOf(state,r.block.id))===key).slice(0,n).map(r=>auditView(r.block,{answers:false}));};
 const item=t=>{const info=audit.types.find(x=>x.type===t)??{};
  return {type:t,description:info.description??null,taught:info.taught!==false,taughtBy:(info.taughtBy??[]).length,topic:topicTitle(info.topicId),questions:questionsOf(t,2)};};
 const apply=roles=>{const out=[];for(const t of short){const r=roles.get(t);if(!r)continue;let info=audit.types.find(x=>x.type===t);if(!info){info={type:t,taught:true,taughtBy:[],description:null};audit.types.push(info);}info.role=r.role;info.roleReason=r.reason??'';out.push({type:t,role:r.role,reason:r.reason??''});}return out;};
 // Grouping candidates: every type in the booklet with routine questions or teaching (a short type's synonym
 // may sit in another topic, such as a lesson and its summary).
 const routineTypes=new Map();for(const r of rows)if(r.routine){const t=typeOf(state,r.block.id);if(t&&!routineTypes.has(t))routineTypes.set(t,r.section.topicId);}
 const topicOf=t=>audit.types.find(x=>x.type===t)?.topicId??routineTypes.get(t)??null;
 const all=[...new Set([...audit.types.filter(t=>t.taught!==false||routineTypes.has(t.type)).map(t=>t.type),...routineTypes.keys(),...deficit])];
 const entries=all.map(t=>short.includes(t)?{...item(t),needsRole:true}:{...item(t),questions:questionsOf(t,1)}).sort((a,b)=>String(topicOf(a.type)).localeCompare(String(topicOf(b.type))));
 const known=all.map(t=>({type:t,topic:topicOf(t)}));
 try{
  const system=roleGroupContract(),prompt=list=>JSON.stringify({booklet:candidate.title,course:candidate.library?.courseId??null,types:list});
  const parts=await splitByCap(entries,list=>system.length+prompt(list).length,async list=>(await callSonnet(ctx,{stage:'roles',system,prompt:prompt(list),validate:r=>validateRoleGroups(r,list.filter(i=>i.needsRole).map(i=>i.type),known.filter(k=>list.some(i=>i.type===k.type)))})).value);
  audit.typeGroups=parts.flatMap(p=>p.value?.groups??[]);
  return apply(mergeMaps(parts.map(p=>p.value?.roles)));
 }catch(error){
  audit.typeGroups=[];audit.typeGroupsFailed=error.message;ctx.log?.('roles and groups call failed, counting without grouping: '+error.message);
  if(!short.length)return [];
  const system=roleContract(),prompt=list=>JSON.stringify({booklet:candidate.title,course:candidate.library?.courseId??null,types:list});
  const parts=await splitByCap(short.map(item),list=>system.length+prompt(list).length,async list=>(await callSonnet(ctx,{stage:'roles',system,prompt:prompt(list),validate:r=>validateRoles(r,list.map(i=>i.type))})).value);
  return apply(mergeMaps(parts.map(p=>p.value)));
 }
}
// Type names that differ only in plurals, stop words or token order are one type when counting
// (7 November 2026: "identify-inverse-operation" and "identify-inverse-operations" were counted apart).
// The merge is for counting only; stored and audited types are never rewritten.
const STOP=new Set(['a','an','the','of','in','on','by','from','to','with','and','for','using','into','at']);
export function typeKey(type){return [...new Set(String(type??'').toLowerCase().split(/[^a-z0-9]+/).filter(t=>t&&!STOP.has(t)).map(t=>t.length>3&&t.endsWith('s')&&!t.endsWith('ss')?t.slice(0,-1):t))].sort().join('-');}
export function gapPlan(candidate,state,{audit=null,original=state.project,countsOnly=false}={}){
 const rows=bookletIndex(candidate),slots=[],counts=[],exempt=[],capped=[];
 const origMax=new Map();for(const s of original.sections??[]){const r=bookletIndex({...original,sections:[s]}).filter(x=>x.routine).map(x=>scoreOf(x.block)).filter(x=>Number.isFinite(x)&&x<=LIMITS.routineCeiling);if(r.length)origMax.set(s.id,Math.max(...r));}
 const fixedPairs=new Set(state.progressions.flatMap(ids=>ids.slice(1).map((id,i)=>ids[i]+'>'+id)));
 const typeInfo=new Map((audit?.types??[]).map(t=>[t.type,t]));
 // Synonymous types the roles call grouped (same method, James 8 November 2026) count as one.
 const groupOf=new Map();for(const g of audit?.typeGroups??[]){const keys=g.types.map(typeKey),head=keys.slice().sort()[0];for(const k of keys)groupOf.set(k,'group:'+head);}
 const groupKey=t=>{const k=typeKey(t);return groupOf.get(k)??k;};
 const infoByKey=new Map();for(const t of typeInfo.values()){const k=groupKey(t.type);infoByKey.set(k,[...(infoByKey.get(k)??[]),t]);}
 // A merged type is core unless every labelled name in it is enrichment, and taught if any name is.
 const roleOfKey=k=>{const r=(infoByKey.get(k)??[]).map(t=>t.role).filter(Boolean);return r.length&&r.every(x=>x==='enrichment')?'enrichment':r.length?'core':null;};
 const taughtKey=k=>{const t=infoByKey.get(k)??[];return !t.length||t.some(x=>x.taught!==false);};
 const applied=b=>verifiedRating(b)&&!state.pendingHigh?.has(b.id);
 const challengeOnly=key=>{const all=rows.filter(r=>r.question&&!r.exam&&typeOf(state,r.block.id)&&groupKey(typeOf(state,r.block.id))===key);return all.length>0&&all.every(r=>r.kind==='challenge'||(Number.isFinite(scoreOf(r.block))&&scoreOf(r.block)>LIMITS.routineCeiling));};
 // Pass 1: each exercise's jumps and items per (merged) type.
 const exercises=[];
 for(const section of candidate.sections??[]){
  const sec=rows.filter(r=>r.section.id===section.id);if(sec[0]?.kind!=='exercise')continue;
  const routine=sec.filter(r=>r.routine).map(r=>r.block);if(!routine.length)continue;
  const ceiling=origMax.get(section.id)??LIMITS.routineCeiling;
  const units=routine.map(b=>({firstId:b.id,lastId:b.id,score:applied(b)?scoreOf(b):null}));
  const scored=units.filter(u=>Number.isFinite(u.score)).map(u=>({id:u.firstId,score:u.score})),windowFor=target=>slotWindow(target,scored,{ceiling});
  // The count top-up plans count slots only (8 November 2026): jumps, worked-example practice and spread were handled by the booklet's audit.
  const own=countsOnly?[]:jumpSlots(units,{ceiling}).filter(s=>!fixedPairs.has(s.after+'>'+s.before)).map(s=>({...s,sectionId:section.id}));
  // Items per type (Exam questions do not count).
  const byKey=new Map();for(const b of routine){const reviewed=practiceItems(b),weight=reviewed.length>1||b.classification?.archetypeReview?.practiceItems?.length?1:practiceItemCount(b);for(const item of reviewed){const t=item.archetype??typeOf(state,b.id);if(!t)continue;const k=groupKey(t),row=byKey.get(k)??{key:k,names:new Map(),items:0,ids:[],scores:[]};row.items+=weight;row.names.set(t,(row.names.get(t)??0)+weight);if(!row.ids.includes(b.id)){row.ids.push(b.id);if(applied(b))row.scores.push(scoreOf(b));}byKey.set(k,row);}}
  exercises.push({section,routine,ceiling,windowFor,own,byKey});
 }
 // Pass 2: type minimums, per topic. Exercises of one topic are tiers of the same skills, so a
 // type's items across them count together, and a short type is topped up in the tier holding
 // the fewest of it (James, 7 November 2026). Only core types have a minimum; enrichment types
 // (deliberate one-offs) are exempt and listed, as are Challenge-only types (6 November 2026).
 const needs=[];
 for(const topicId of [...new Set(exercises.map(e=>e.section.topicId))]){
  const tiers=exercises.filter(e=>e.section.topicId===topicId);
  const keys=new Map();
  for(const e of tiers)for(const row of e.byKey.values()){const k=keys.get(row.key)??{key:row.key,items:0,names:new Map(),rows:[]};k.items+=row.items;for(const [n,c] of row.names)k.names.set(n,(k.names.get(n)??0)+c);k.rows.push({e,row});keys.set(row.key,k);}
  for(const t of typeInfo.values()){const k=groupKey(t.type);if(t.topicId===topicId&&t.taught!==false&&!keys.has(k))keys.set(k,{key:k,items:0,names:new Map([[t.type,0]]),rows:[]});}
  // A synonym group spans topics (a lesson's type and its summary copy): its items count across the booklet.
  for(const k of keys.values())if(k.key.startsWith('group:'))k.items=exercises.reduce((n,e)=>n+(e.byKey.get(k.key)?.items??0),0);
  for(const k of keys.values()){
   const type=[...k.names].sort((a,b)=>b[1]-a[1])[0][0],role=roleOfKey(k.key),taught=taughtKey(k.key);
   if(challengeOnly(k.key))continue;
   const home=k.rows.slice().sort((a,b)=>a.row.items-b.row.items||tiers.indexOf(a.e)-tiers.indexOf(b.e))[0]?.e??tiers[0];
   counts.push({sectionId:home.section.id,topicId,type,items:k.items,role,taught,...(k.names.size>1?{names:[...k.names.keys()]}:{})});
   if(role==='enrichment'){if(k.items<LIMITS.minimumItems)exempt.push({sectionId:home.section.id,type,items:k.items});continue;}
   const need=LIMITS.minimumItems-k.items;if(need>0)needs.push({e:home,type,items:k.items,need,taught,row:k.rows.find(x=>x.e===home)?.row??{ids:[],scores:[]}});
  }
 }
 // A soft cap on new count questions per exercise, reported, never silent. Slots go round by round
 // (8 November 2026): each short type gets its first new question before any type gets a second, taught
 // types first, then the fewest items, so a type with none or one is filled before another is topped up.
 const used=new Map(),order=needs.sort((a,b)=>(b.taught-a.taught)||a.items-b.items),stopped=new Set();
 for(let round=0;round<LIMITS.minimumItems;round++)for(const n of order){
  if(round>=n.need||stopped.has(n))continue;
  const {e,row}=n;
  const lo=row.scores.length?Math.min(...row.scores):null,hi=row.scores.length?Math.max(...row.scores):null;
  const open=e.own.find(s=>s.reason==='difficulty-jump'&&!s.type&&(lo==null||(s.target>=lo-10&&s.target<=hi+10)));
  if(open){open.type=n.type;open.alsoCount=true;continue;}
  if((used.get(e.section.id)??0)>=LIMITS.countSlotsPerExercise){capped.push({sectionId:e.section.id,type:n.type,items:n.items,taught:n.taught,unplaced:n.need-round});stopped.add(n);continue;}
  used.set(e.section.id,(used.get(e.section.id)??0)+1);
  const scores=e.routine.filter(applied).map(scoreOf),median=x=>x.length?x.slice().sort((a,b)=>a-b)[Math.floor(x.length/2)]:20;
  const target=Math.min(e.ceiling,row.scores.length?median(row.scores):median(scores));
  // A core type the booklet does not teach is drafted for the teacher to decide (with its new teaching), not inserted.
  e.own.push({reason:'type-count',sectionId:e.section.id,type:n.type,after:row.ids.at(-1)??e.routine.at(-1).id,target,...e.windowFor(target),...(n.taught?{}:{teachingNeeded:true})});
 }
 // Pass 3: per exercise, as before.
 for(const {section,routine,ceiling,windowFor,own} of exercises){
  // A jump slot takes the type of the question it leads up to.
  for(const s of own)if(!s.type)s.type=typeOf(state,s.before)??typeOf(state,s.after);
  // Worked examples with no following practice of their type.
  for(const m of countsOnly?[]:audit?.exampleMatches??[]){
   if((m.followedBy??[]).length)continue;
   const ex=rows.find(r=>r.block.id===m.exampleId);if(!ex||ex.section.topicId!==section.topicId)continue;
   if(slots.some(s=>s.exampleId===m.exampleId))continue;
   const type=[...typeInfo.values()].find(t=>(t.taughtBy??[]).includes(m.exampleId))?.type;if(!type)continue;
   const first=Math.min(...routine.filter(applied).map(scoreOf),40),target=Math.max(5,first);
   own.push({reason:'worked-example-practice',sectionId:section.id,type,exampleId:m.exampleId,after:null,target,...windowFor(target)});
  }
  for(const sp of countsOnly?[]:audit?.spread??[]){
   const ids=(sp.ids??[]).filter(id=>routine.some(b=>b.id===id));if(!ids.length)continue;
   const sc=ids.map(id=>scoreOf(routine.find(b=>b.id===id))).filter(Number.isFinite),target=Math.min(ceiling,sc.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length):20);
   own.push({reason:'spread',sectionId:section.id,type:sp.type,judgement:sp.judgement??null,after:ids.at(-1),target,...windowFor(target)});
  }
  // Comment-only follows the target (as before the 6 November windows), not the wider window.
  for(const s of own){s.untaught=typeInfo.get(s.type)?.taught===false&&!s.teachingNeeded;s.commentOnly=!!s.teachingNeeded||s.target+LIMITS.slack>=LIMITS.appliedBelow;}
  slots.push(...own);
 }
 slots.forEach((s,i)=>{s.id='slot-'+(i+1);});
 const gaps=[];
 for(const section of candidate.sections??[]){const routine=rows.filter(r=>r.section.id===section.id&&r.routine).map(r=>r.block).filter(applied);for(let i=1;i<routine.length;i++){const step=scoreOf(routine[i])-scoreOf(routine[i-1]);if(step>LIMITS.jump&&!fixedPairs.has(routine[i-1].id+'>'+routine[i].id))gaps.push({sectionId:section.id,after:routine[i-1].id,before:routine[i].id,step});}}
 return {slots,counts,deficits:counts.filter(c=>c.role!=='enrichment'&&c.items<LIMITS.minimumItems),gaps,exempt,capped};
}

// ---- count top-up: variation sequences only (8 November 2026) ----------------------------
// Every topic with exercises, packed by size; no stale checks, no Exam questions.
function variationPackets(state,candidate){
 const all=sequences(candidate).filter(s=>s.sections.some(x=>bookletIndex({...candidate,sections:[x]})[0]?.kind==='exercise'));
 const owner=new Map(state.rows.flatMap(r=>nodesOf(r.block).map(n=>[String(n.id),r.block.id])));
 const system=variationContract(),types=[...new Set([...state.types.values()].map(t=>t.type))];
 const build=list=>({topics:list.map(t=>t.id),system,prompt:'Booklet data (JSON):\n'+JSON.stringify({styleSheet:styleSheet(candidate,bookletIndex(candidate)),types,topics:list.map(t=>topicPayload(t,state,candidate))}),ctx:{owner,ids:new Set(state.rows.map(r=>r.block.id))}});
 const packets=[];let current=[];
 for(const t of all){const next=[...current,t];if(current.length&&build(next).prompt.length>LIMITS.packCharacters){packets.push(build(current));current=[t];}else current=next;}
 if(current.length)packets.push(build(current));
 return packets;
}
// The run whose audit a top-up reuses: the booklet's latest full audit with an audit.json.
export function priorAuditRun(projectId,{root=ROOT}={}){
 const dir=path.join(root,'.booklet-work','pedagogy-audit-v2',projectId);if(!fs.existsSync(dir))return null;
 const runs=fs.readdirSync(dir).filter(d=>/^\d{8}-\d{6}$/.test(d)&&fs.existsSync(path.join(dir,d,'audit.json'))&&!(()=>{try{return read(path.join(dir,d,'report.json')).topUp;}catch{return false;}})()).sort();
 return runs.length?path.join(dir,runs.at(-1)):null;
}

// ---- Stage 3: audit packets ---------------------------------------------------------
// Blocks the audit's own changes produce were checked on the way in (blind solve and duplicate
// check for questions, challenge for teaching), so they are recorded as checked when applied
// (8 November 2026): otherwise every later run resent their whole topics; the applied pilots
// would have resent 880,000 characters for Area 1 alone.
export function appliedChecks(project,ids){
 const want=new Set(ids),checks={},types={};
 for(const r of bookletIndex(project)){if(!want.has(r.block.id))continue;const fp=contentFingerprint(r.block),row={};
  if(r.question||r.example)row.error=fp;
  if(r.question){row.duplicate=fp;const t=r.block.classification?.archetype??(r.block.pedagogyRole&&r.block.pedagogyRole!=='practice'?r.block.pedagogyRole:null);if(t){row.type=fp;types[r.block.id]=t;}}
  if(r.kind==='teaching')row.theory=fp;
  checks[r.block.id]=row;}
 return {checks,types};
}
// ---- Key ideas (James, 8 November 2026) ----------------------------------------------------
// Every lesson that teaches something conceptual ends its teaching with a Key ideas box: numbered
// cloze statements, the house shape of 109 of the 141 existing Stage 4 boxes.
export const isKeyIdeas=b=>b?.pedagogyRole==='key-ideas'||b?.sourceAtom?.kind==='key-ideas';
const isReviewBlock=b=>b?.pedagogyRole==='review'||b?.sourceAtom?.kind==='review';
export function keyIdeasLessons(project){
 const rows=bookletIndex(project),by=new Map();
 for(const r of rows){const t=r.section.topicId;if(!t||r.section.phase==='front-matter')continue;const l=by.get(t)??{has:false,teaching:[],sectionIds:new Set()};by.set(t,l);l.sectionIds.add(r.section.id);
  if(isKeyIdeas(r.block))l.has=true;else if(r.kind==='teaching'&&!isReviewBlock(r.block))l.teaching.push(r);}
 const out=new Map();
 for(const [t,l] of by){if(l.has||!l.teaching.length)continue;const last=l.teaching.at(-1);
  out.set(t,{fp:createHash('sha256').update(l.teaching.map(r=>r.block.id+':'+contentFingerprint(r.block)).join('|')).digest('hex'),after:last.block.id,sectionId:last.section.id,sectionIds:[...l.sectionIds]});}
 return out;
}
// "[[answer]]" blanks become cloze inlines sized by the house style.
// Light xcolor tints in audit-made figures (blue!25, Converting FDP j19, 8 November 2026) fail the booklet
// palette check: each becomes the house fill of its hue. Strong colours are left for the check to report.
const HOUSE_FILLS={blue:'D4E8FF',cyan:'D4E8FF',red:'FCDFE1',pink:'FCDFE1',magenta:'FCDFE1',green:'DCEBE0',orange:'FCE8D5',yellow:'FCE8D5',purple:'E8DEF4',violet:'E8DEF4'};
export function houseTints(project,alsoIds=new Set()){
 let n=0;
 for(const b of (project.sections??[]).flatMap(s=>s.blocks??[])){if(!b.id.startsWith('v2-')&&!alsoIds.has(b.id))continue;
  (function walk(x){if(!x||typeof x!=='object')return;if(x.format==='tikz'&&typeof x.code==='string'){const used=new Set();
    // A tint mixed explicitly with white (orange!20!white, Volume j8 redraft, 9 November 2026) is the same tint.
    const code=x.code.replace(/\b(blue|cyan|red|pink|magenta|green|orange|yellow|purple|violet)!([1-4]\d|[5-9])(?:!white)?(?![\d!])/g,(m,hue)=>{used.add(hue);n++;return 'house'+hue+'Fill';});
    const defs=[...used].map(h=>`\\definecolor{house${h}Fill}{HTML}{${HOUSE_FILLS[h]}}`);
    // The house grid colour is defined only in the graph template; a drafted figure that names it on its own
    // failed to compile and stopped the render (Quartiles and Box Plots slot 12, Stage 5, 10 November 2026).
    if(/\bhousegrid\b/.test(code)&&!/\\definecolor\{housegrid\}/.test(code)){defs.push('\\definecolor{housegrid}{HTML}{CCCCCC}');n++;}
    if(defs.length)x.code=code.replace(/(\\begin\{tikzpicture\}(?:\[[^\]]*\])?)/,`$1\n${defs.join('\n')}`);}
   for(const v of Object.values(x))walk(v);})(b);}
 return n;}
// TikZ's default grid step is 1 cm on the page, not one x unit. A drafted graph that rescales its axes
// (x=0.43cm) and draws "(-7,-7) grid (7,7)" without a step gets grid lines every 2.3 units under ticks every
// unit, and its tick labels pile up (Linear Relationships 2 slot-3, 8 November 2026). Such a grid gets
// step=1, one line per unit, in audit-made figures only.
export function gridSteps(project,alsoIds=new Set()){
 let n=0;
 // scale= transforms the grid step too; only unit vectors set apart from it (x=, y=) part the grid from the ticks.
 const rescaled=code=>/\\begin\{tikzpicture\}\[[^\]]*\b[xy]\s*=\s*[\d.]+\s*(cm|mm|pt)/.test(code);
 for(const b of (project.sections??[]).flatMap(s=>s.blocks??[])){if(!b.id.startsWith('v2-')&&!alsoIds.has(b.id))continue;
  (function walk(x){if(!x||typeof x!=='object')return;
   if(x.format==='tikz'&&typeof x.code==='string'&&rescaled(x.code))
    x.code=x.code.replace(/\\draw\[([^\]]*)\](\s*\([^)]*\)\s*grid\s*\()/g,(m,opts,rest)=>/\b[xy]?step\b/.test(opts)?m:(n++,`\\draw[${opts},step=1]${rest}`))
     .replace(/\\draw(\s*\([^)]*\)\s*grid\s*\()/g,(m,rest)=>(n++,`\\draw[step=1]${rest}`));
   for(const v of Object.values(x))walk(v);})(b);}
 return n;}
export function keyIdeasBlock(project,topicId,items,{stamp}){
 const base=('v2-key-ideas-'+String(topicId).slice(-24)+'-'+stamp).replace(/[^\w-]/g,'-'),taken=new Set((project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>b.id)));
 let id=base;for(let k=2;taken.has(id);k++)id=base+'-'+k;
 const template=(project.sections??[]).flatMap(s=>s.blocks??[]).find(b=>isKeyIdeas(b)&&b.type==='question'&&b.content?.children?.[0]?.type==='part');
 const para=template?.content.children[0].prompt?.blocks?.find(x=>x.type==='paragraph');
 const keep=para?Object.fromEntries(Object.entries(para).filter(([k])=>!['id','type','inlines'].includes(k))):{align:'left',lineHeight:1.5};
 // A blank written inside maths (Computation with Integers 1: "$-a-b=-([[a+b|0]])$", 8 November 2026) printed
 // as "[a+b|0]": the maths is split around it, and a maths answer keeps its delimiters.
 // Only real maths segments are lifted: a blank between two maths spans ("given $x$, [[substitute]] it … $y$")
 // was read as maths and printed as "[[substitute|0]]" (Linear Relationships 2, 8 November 2026).
 const lift=t=>String(t).split(/(\$[^$]*\$)/).map((seg,i)=>i%2&&/\[\[/.test(seg)?liftOne(seg):seg).join('');
 const liftOne=seg=>seg.replace(/^\$([\s\S]*)\$$/,(m,body)=>body.split(/(\[\[[^\]]*\]\])/).map((seg,k)=>k%2?seg.replace(/^\[\[([^\]|]+)/,(x,a)=>'[[$'+a.trim()+'$'):seg.trim()?'$'+seg+'$':'').join(''));
 // The box numbers its statements itself; a drafted "1. " or "(a) " printed twice ("1. 1. A scale is …",
 // Ratios 2, three boxes, 8 November 2026).
 const unnumber=t=>String(t).replace(/^\s*(?:\(?\d{1,2}[.)]|\(?[a-z][.)])\s+/i,'');
 const children=items.map(unnumber).map(lift).map((text,i)=>{const answers=[...String(text).matchAll(/\[\[([^\]|]+)(?:\|\d+)?\]\]/g)].map(m=>m[1].trim());
  const source=String(text).replace(/\[\[([^\]|]+)(?:\|\d+)?\]\]/g,(m,a)=>'[['+a.trim()+'|0]]');
  const inlines=inlinesFromSource(source).map(n=>n.type==='cloze'?{type:'cloze',answer:n.answer}:n);
  const prompt=normalizeDocument({blocks:[{id:id+'-part-'+(i+1)+'-paragraph',type:'paragraph',...keep,inlines}]});
  return {id:id+'-part-'+(i+1),type:'part',label:String(i+1),prompt:{format:DOCUMENT_FORMAT,version:DOCUMENT_VERSION,...prompt},responseSpace:'scaffold',answerSpaceMm:0,answer:{short:answers.join('; '),worked:'',provenance:{short:'authored',worked:'authored'}}};});
 return {id,type:'question',sourceAtom:{id:id+'-atom',kind:'key-ideas',label:'Key ideas',order:template?.sourceAtom?.order??1},pedagogyRole:'key-ideas',content:{id:id+'-root',type:'group',label:'',prompt:'',layout:'list',children},flow:{keepTogether:true,sourcePageBreakBefore:false},snapshotKind:'local',bankRef:null};
}
export function styleSheet(project,rows){
 const teaching=rows.filter(r=>r.kind==='teaching'&&!r.question);
 const pick=[teaching.find(r=>!r.example),teaching.find(r=>r.example),teaching.filter(r=>!r.example)[1]].filter(Boolean);
 return {title:project.title,notation:'Follow the notation, command words and answer style of the passages and questions shown.',passages:pick.map(r=>({id:r.block.id,view:auditView(r.block)}))};
}
function topicPayload(sequence,state,candidate){
 const rows=bookletIndex({...candidate,sections:sequence.sections.map(s=>candidate.sections.find(x=>x.id===s.id)??s)});
 const prePos=new Map(state.rows.filter(r=>r.routine).map(r=>[r.block.id,r.index+1]));
 return {topicId:sequence.topicId,title:sequence.title,
  teaching:rows.filter(r=>r.kind==='teaching').map(r=>({id:r.block.id,role:r.example?'worked-example':r.block.pedagogyRole??'teaching',view:auditView(r.block)})),
  exercises:[...new Set(rows.filter(r=>r.kind==='exercise').map(r=>r.section.id))].map(id=>{const s=candidate.sections.find(x=>x.id===id)??sequence.sections.find(x=>x.id===id);return {exerciseId:id,title:s.title??null,items:rows.filter(r=>r.section.id===id&&r.question).map(r=>({id:r.block.id,prePosition:prePos.get(r.block.id)??null,score:scoreOf(r.block),type:state.types.get(r.block.id)?.type??null,view:auditView(r.block)}))};})};
}
export function auditPackets(state,candidate,{root=ROOT,variationsOnly=false}={}){
 if(variationsOnly)return variationPackets(state,candidate);
 const all=sequences(candidate).filter(s=>s.sections.some(x=>['teaching','exercise'].includes(bookletIndex({...candidate,sections:[x]})[0]?.kind??(x.phase==='teaching'?'teaching':''))));
 const staleAll=new Set([...state.stale.type,...state.stale.error,...state.stale.theory]),pairIds=new Set(state.pairs.flatMap(p=>p.ids));
 const exam=bookletIndex(candidate).filter(r=>r.exam||r.kind==='challenge').map(r=>({id:r.block.id,section:r.kind,score:scoreOf(r.block),type:state.types.get(r.block.id)?.type??null,view:auditView(r.block)}));
 const types=[...new Map([...state.types.entries()].map(([id,t])=>[t.type,{type:t.type,example:id}])).values()];
 const keyStale=new Set(state.stale.keyIdeas??[]);
 const staleIn=seq=>seq.sections.some(s=>(candidate.sections.find(x=>x.id===s.id)?.blocks??s.blocks??[]).some(b=>staleAll.has(b.id)||pairIds.has(b.id)));
 // A topic sent only for its Key ideas check goes as teaching only (8 November 2026): that
 // judgement reads the lesson's teaching, and its exercises would be resent for nothing.
 const topics=all.filter(seq=>keyStale.has(seq.topicId)||staleIn(seq)).map(seq=>{const payload=topicPayload(seq,state,candidate);return {seq,payload:staleIn(seq)?payload:{...payload,exercises:[],note:'Only this lesson\'s Key ideas are being checked; its exercises are not shown.'}};});
 const owner=new Map(state.rows.flatMap(r=>nodesOf(r.block).map(n=>[String(n.id),r.block.id])));
 const keyIdeasExamples=bookletIndex(candidate).filter(r=>isKeyIdeas(r.block)&&r.block.type==='question').slice(0,2).map(r=>auditView(r.block));
 const system=auditContract({root}),base={styleSheet:styleSheet(candidate,bookletIndex(candidate)),types,...(keyIdeasExamples.length?{keyIdeasExamples}:{})};
 const packets=[];let current=[];
 // Units are topics, parts of a split topic, or chunks of the Exam and Challenge questions.
 // `ownTeaching: false` marks a later part of a split topic: its teaching is context only, and the
 // first part answers for the teaching's stale checks.
 const build=list=>{const topicUnits=list.filter(t=>!t.examOnly),examItems=list.flatMap(t=>t.exam??[]);
  const teachingIds=topicUnits.flatMap(t=>t.payload.teaching.map(x=>x.id)),practiceIds=topicUnits.flatMap(t=>t.payload.exercises.flatMap(e=>e.items.map(i=>i.id))),examIds=examItems.map(e=>e.id);
  const own=[...new Set([...teachingIds,...practiceIds,...examIds])];
  const resp=new Set([...topicUnits.filter(t=>t.ownTeaching!==false).flatMap(t=>t.payload.teaching.map(x=>x.id)),...practiceIds,...examIds]);
  const stale={type:state.stale.type.filter(id=>resp.has(id)),error:state.stale.error.filter(id=>resp.has(id)),theory:state.stale.theory.filter(id=>resp.has(id)),keyIdeas:topicUnits.filter(t=>t.ownTeaching!==false&&keyStale.has(t.seq.topicId)).map(t=>t.seq.topicId)};
  const pairs=state.pairs.filter(p=>p.ids.some(id=>resp.has(id)));
  const payload={...base,topics:topicUnits.map(t=>t.payload),...(examItems.length?{examAndChallenge:examItems}:{}),...(list.some(t=>t.examOnly&&t.part)?{examPart:list.find(t=>t.examOnly&&t.part).part}:{}),stale,duplicateCandidates:pairs.map(p=>({ids:p.ids,nodes:p.nodes,scope:p.scope}))};
  const prompt='Booklet data (JSON):\n'+JSON.stringify(payload);
  return {topics:[...topicUnits.map(t=>t.seq.id),...(examItems.length?['exam-and-challenge']:[])],prompt,system,ctx:{owner,ids:new Set([...own,...state.rows.map(r=>r.block.id)]),needTypes:stale.type.filter(id=>state.rows.find(r=>r.block.id===id)?.question),staleError:new Set(stale.error),staleTheory:new Set(stale.theory),staleKeyIdeas:new Set(stale.keyIdeas),pairs}};};
 // A topic over the packing size is split by exercise, and an exercise over it by question
 // (6 November 2026); every part carries the topic's teaching and worked examples. The rollout dry
 // run found topics of 328,000 and single exercises of 663,000 characters.
 const fits=list=>build(list).prompt.length<=LIMITS.packCharacters;
 const units=[];
 for(const t of topics){
  if(fits([t])){units.push(t);continue;}
  const parts=[];let chunk=[];
  const unit=(exs,i)=>({seq:t.seq,ownTeaching:i===0,payload:{...t.payload,exercises:exs}});
  const withItem=(exs,e,item)=>{const lastEx=exs.at(-1);return lastEx&&lastEx.exerciseId===e.exerciseId?[...exs.slice(0,-1),{...lastEx,items:[...lastEx.items,item]}]:[...exs,{...e,items:[item]}];};
  for(const e of t.payload.exercises){
   const next=[...chunk,e];
   if(!chunk.length||fits([unit(next,parts.length)])){chunk=next;if(fits([unit(chunk,parts.length)]))continue;chunk=chunk.slice(0,-1);}
   else{parts.push(chunk);chunk=[];if(fits([unit([e],parts.length)])){chunk=[e];continue;}}
   // This exercise does not fit whole: add it question by question.
   for(const item of e.items){const n=withItem(chunk,e,item);if(chunk.length&&!fits([unit(n,parts.length)])){parts.push(chunk);chunk=withItem([],e,item);}else chunk=n;}
  }
  if(chunk.length)parts.push(chunk);
  parts.forEach((exs,i)=>{const u=unit(exs,i);u.payload.part=`Part ${i+1} of ${parts.length} of this topic: the rest of it is audited in separate calls. Report findings only on the practice items shown here; for exampleMatches, list only the practice items shown here.${i?' The teaching is included as context; its theory and type checks are answered with part 1.':''}`;units.push(u);});
 }
 // The Exam and Challenge questions: with the last topic when they fit, otherwise in their own chunks.
 if(units.length||exam.some(e=>staleAll.has(e.id))){
  const whole={examOnly:true,exam};
  if(fits([whole]))units.push(whole);
  else{const chunks=[];let c=[];for(const e of exam){if(c.length&&!fits([{examOnly:true,exam:[...c,e]}])){chunks.push(c);c=[];}c.push(e);}if(c.length)chunks.push(c);
   chunks.forEach((list,i)=>units.push({examOnly:true,exam:list,part:`Exam and Challenge questions, part ${i+1} of ${chunks.length}; the others are audited in separate calls.`}));}
 }
 for(const t of units){const next=[...current,t];if(current.length&&!fits(next)){packets.push(build(current));current=[t];}else current=next;}
 if(current.length)packets.push(build(current));
 return packets;
}

// ---- comparison ladders -------------------------------------------------------------
export function anchorRefs(root){
 const out=[];
 for(const [i,[pid,bid]]of ANCHORS.entries()){
  const file=path.join(root,'booklets','projects',pid+'.json');if(!fs.existsSync(file))continue;
  const p=read(file),b=(p.sections??[]).flatMap(s=>s.blocks??[]).find(x=>x.id===bid);
  if(b&&verifiedRating(b)&&b.classification.assessment.method!=='comparison-v1')out.push({ref:'A'+(i+1),score:scoreOf(b),task:auditView(b)});
 }
 return out;
}
// Same exercise first, then same topic, then the booklet's Challenge questions; never comparison-derived scores.
// `include` (a slot's two neighbours) goes first and is always kept, so the rater can place a
// new question between exactly the questions it was written to sit between.
export function ladderFor(candidate,{sectionId,topicId,exclude=new Set(),include=[]},size=10){
 const rows=bookletIndex(candidate).filter(r=>r.question&&verifiedRating(r.block)&&r.block.classification.assessment.method!=='comparison-v1'&&!exclude.has(r.block.id));
 const pick=[],add=r=>{if(pick.length<size&&!pick.includes(r))pick.push(r);};
 for(const id of include){const r=rows.find(x=>x.block.id===id);if(r&&!pick.includes(r)){pick.push(r);size++;}}
 const spread=list=>{const s=list.slice().sort((a,b)=>scoreOf(a.block)-scoreOf(b.block));if(s.length<=4)return s;return [0,1,2,3].map(k=>s[Math.round(k*(s.length-1)/3)]);};
 for(const r of spread(rows.filter(r=>r.section.id===sectionId)))add(r);
 for(const r of spread(rows.filter(r=>r.section.topicId===topicId&&r.section.id!==sectionId)))add(r);
 for(const r of rows.filter(r=>r.kind==='challenge'))add(r);
 for(const r of spread(rows.filter(r=>r.kind==='exercise')))add(r);
 return pick.map(r=>r.block.id);
}

// ---- the prompt cap never ends a run (James, 7 November 2026) ---------------------------
// Area 1 failed twice after paying for most of its calls: first a proposal-drafting batch, then the
// blind solve, went over the cap and the refusal ended the run. Every batched call now halves an
// over-cap batch; a single item that still does not fit is returned in `over`, and each stage drops it
// with a reason (no rating, no solve, so no insertion) while the rest of the run continues.
export async function splitByCap(items,size,run){
 if(!items.length)return [];
 if(size(items)<=LIMITS.promptCharacters)return [{items,value:await run(items)}];
 if(items.length===1)return [{items,over:true}];
 const half=Math.ceil(items.length/2),[a,b]=await Promise.all([splitByCap(items.slice(0,half),size,run),splitByCap(items.slice(half),size,run)]);
 return [...a,...b];
}
const mergeMaps=maps=>new Map(maps.flatMap(m=>[...(m??new Map())]));

// ---- answer comparison ---------------------------------------------------------------
const normAnswer=s=>String(s??'').replace(/\\left|\\right|\\displaystyle|\\,|\\;|\\!|\s|\$|\.$/g,'').replace(/\\dfrac|\\tfrac/g,'\\frac').replace(/^(?:y'|f'\(x\)|dy\/dx|\\frac\{dy\}\{dx\})=/,'').replace(/;$/,'');
export function answerNodes(content){return nodesOf(content).filter(n=>n.answer&&(n.answer.short||n.answer.worked)&&!(n.children??[]).some(c=>c.answer));}
export async function compareAnswers(ctx,pairs){
 const out=new Map(),pending=[];
 for(const p of pairs){if(normAnswer(p.a)&&normAnswer(p.a)===normAnswer(p.b))out.set(p.id,{equivalent:true,how:'script'});else pending.push(p);}
 if(pending.length){
  const system=equivalenceContract(),prompt=list=>JSON.stringify({pairs:list.map(p=>({id:p.id,A:p.a,B:p.b}))});
  const parts=await splitByCap(pending,list=>system.length+prompt(list).length,async list=>(await callSonnet(ctx,{stage:'equivalence',system,prompt:prompt(list),validate:r=>validateEquivalence(r,list.map(p=>p.id))})).value);
  const value=mergeMaps(parts.map(p=>p.value));
  for(const p of pending)out.set(p.id,value.has(p.id)?{equivalent:value.get(p.id)?.equivalent===true,how:'model',reason:value.get(p.id)?.reason}:{equivalent:false,how:'over-cap',reason:'the answers were too long to compare within the prompt cap'});
 }
 return out;
}

// ---- apply payloads (6 November 2026) -------------------------------------------------
// What applying an approved proposal comment does, stored with the comment so that
// `audit-v2 apply-comments` needs no drafting call. New teaching (worked example and
// guided practice) stays a by-hand repair.
export function proposalPayload(j,block,{rows,ownerOf,workedExample=null,project=null}){
 const row=j.row,owner=id=>ownerOf.get(String(id))??id,rowOf=id=>rows.find(r=>r.block.id===owner(id));
 // New teaching (James, 8 November 2026: verified findings, new teaching included, are applied):
 // a worked example and its guided practice, after the teaching block the finding names.
 if(j.kind==='missing'){const we=workedExample??null;if(!we?.prompt)return null;const r=rowOf(row.after);
  // A lesson with no teaching (Angle Relationships 2 angle-equations, after "") gets it before the first question that needs it.
  const n=r?null:rowOf((row.neededBy??[])[0]);
  return {op:'teaching',sectionId:(r??n)?.section.id??null,after:r?.block.id??null,...(n?{before:n.block.id}:{}),blocks:teachingBlocks(project??{sections:[]},{workedExample:we,guided:block,stamp:String(j.id)})};}
 if(j.kind==='prerequisites'){const r=rowOf((row.neededBy??[])[0]??j.cites.find(Boolean));return {op:'review',topicId:row.topicId??r?.section.topicId??null,block:{...block,pedagogyRole:'review'}};}
 if(j.kind==='bridges'||j.kind==='extensions'||j.kind==='variations'){const r=rowOf(row.after);return {op:'insert',sectionId:row.exerciseId??r?.section.id??null,after:r?.block.id??null,block};}
 if(j.kind==='duplicate')return {op:'replace-node',blockId:row.replace,nodeIds:row.replaceNodes??[],content:block.content,classification:block.classification};
 return null;
}

// ---- new blocks ----------------------------------------------------------------------
// ---- new teaching (James, 8 November 2026) --------------------------------------------------
// A drafted worked example (prompt, aligned steps, guided practice) as the booklet's own blocks:
// the house worked-example shape (160 of the Stage 4 examples) and a guided-practice question.
const exampleTitle=we=>{if(we.title)return String(we.title).trim();let t=String(we.prompt??'').split(/(?<=[.?!])\s/)[0].replace(/,?\s+then\b.*$/i,'').replace(/[.?!:]+$/,'').replace(/\$[^$]*\$/g,'').replace(/\s+/g,' ').trim();
 if(t.length>60)t=t.slice(0,60).replace(/\s+\S*$/,'');return t||'Worked example';};
export const WORKING_BLUE='#268cff';
// Working written only as \text{} rows of an aligned display (Rounding Decimals j5) prints in the
// maths font; it becomes plain sentences, one per line.
export function textRows(source){
 source=unnestTextMath(String(source));
 // A row break's spacing hint (\\[2mm], \\[6pt]) misaligns the rows in the booklet renderer, so it is
 // dropped from every aligned display, not only those rewritten below (Formulas j4, 8 November 2026).
 source=String(source).replace(/\\begin\{(align\*?|aligned)\}([\s\S]*?)\\end\{\1\}/g,(whole,env,body)=>`\\begin{${env}}${body.replace(/\\\\\s*\[[^\]]*\]/g,'\\\\')}\\end{${env}}`);
 // Numbered steps ("{\color{#ef6068}1.}\quad \text{Fixed charge}&=60") align after the number, not at "=":
 // right-aligning the left column staggered the numbers across the page (Formulas j4, 8 November 2026).
 const STEP=/^\s*(\{?\\color\{#[0-9a-fA-F]{6}\}\{?\s*\d+[.)]\s*\}?\}?\s*(?:\\quad|\\qquad|\\;|\\ )?)\s*/;
 source=source.replace(/\\begin\{(align\*?|aligned)\}([\s\S]*?)\\end\{\1\}/g,(whole,env,body)=>{const rows=body.split(/\\\\/);
  if(rows.length<2||!rows.every(r=>!r.trim()||STEP.test(r)))return whole;
  return `\\begin{${env}}${rows.map(r=>{if(!r.trim())return r;const m=STEP.exec(r);return m[1]+'&'+r.slice(m[0].length).replace(/&/g,'');}).join('\\\\')}\\end{${env}}`;});
 return String(source).replace(/\$\$\s*\\begin\{(align\*?|aligned)\}([\s\S]*?)\\end\{\1\}\s*\$\$/g,(whole,env,body)=>{
  // A row with no "=" or alignment point that is mostly \text{} is a sentence with inline maths.
  const sentence=r=>{const s=r.replace(/^&\s*/,'').replace(/&\s*$/,'');if(!/\\text\{/.test(s)||/&|=/.test(s))return null;
   return s.split(/\\text\{([^{}]*)\}/).map((part,i)=>i%2?part:part.trim()?`$${part.trim()}$`:'').join('').replace(/\s+/g,' ').trim();};
  // A row break may carry extra space (\\[6pt], Angle Relationships 1 j11); it is dropped with the break.
  const rows=body.split(/\\\\(?:\s*\[[^\]]*\])?/).map(r=>r.trim()).filter(Boolean),texts=rows.map(r=>/^&?\s*\\text\{([^{}]*)\}\s*&?$/.exec(r)?.[1]??sentence(r));
  if(texts.every(t=>t!=null))return texts.join('\n\n');
  if(texts.every(t=>t==null))return whole;
  // Sentences mixed with maths rows (Computation with Integers 2 j5, 8 November 2026) print in the maths font
  // and indented: each run of sentences becomes plain paragraphs, each run of maths rows its own display.
  const runs=[];rows.forEach((r,i)=>{const isText=texts[i]!=null,last=runs.at(-1);if(last&&last.text===isText)last.rows.push(isText?texts[i]:r);else runs.push({text:isText,rows:[isText?texts[i]:r]});});
  return runs.map(x=>x.text?x.rows.join('\n\n'):`$$\\begin{${env}}${x.rows.join('\\\\')}\\end{${env}}$$`).join('\n\n');});
}
// Short parts sit side by side, as in the booklet's own questions (8 November 2026: new review
// items had no layout and listed one-line parts down half a page).
// Columns a question's parts can have when a part carries a figure. A figure scales down to its column but its
// labels keep their size, so a figure more than 1.5 times its column's width crowds its labels: the 170 mm text
// width shared out so no figure is squeezed past that. No figure or no width: no limit.
export function figureColumns(content){
 const widths=(content?.children??[]).flatMap(p=>(p.questionDiagrams??[]).map(d=>Number(d.widthMm)||0)).filter(Boolean);
 const figures=widths.length?Math.max(1,Math.floor(170*1.5/Math.max(...widths))):Infinity;
 // A table in a part's prompt does not scale down at all: it needs its full width plus the part label's
 // gutter. An 84 mm table of values in one of three columns printed its numbers across the cell borders
 // (Features of Quadratics 1 slot 5, Stage 5, 10 November 2026).
 // Its set width overstates it (a 111 mm frequency table with short cells printed well in half the page,
 // Grouped Data slot 5), so the need is its content: each column's longest cell at 2 mm a character plus padding.
 const cellText=c=>(c?.blocks??[]).flatMap(q=>q.inlines??[]).map(x=>x.type==='math'?String(x.latex??'').replace(/\\[a-zA-Z]+/g,'x').replace(/[{}^_]/g,''):x.type==='cloze'?'x'.repeat(Math.ceil((Number(x.width)||10)/2)):String(x.text??'')).join('');
 const need=t=>{const cols=Math.max(0,...(t.rows??[]).map(r=>r.length));let mm=0;for(let c=0;c<cols;c++)mm+=Math.max(0,...(t.rows??[]).map(r=>cellText(r[c]).length))*2+6;return mm;};
 // Borderless working (a²+b² = …+… scaffolds, Pythagoras slot 5) wraps its blanks and prints well in half the page.
 const tables=(content?.children??[]).flatMap(p=>(p.prompt?.blocks??[]).filter(b=>b.type==='table'&&b.border).map(t=>need(t))).filter(Boolean);
 const tabled=tables.length?Math.max(1,Math.floor(170/(Math.max(...tables)+6))):Infinity;
 return Math.min(figures,tabled);
}
export function partLayout(content){
 const parts=content?.children??[];if(parts.length<2||content.layout)return content;
 const text=p=>typeof p.prompt==='string'?p.prompt:(()=>{try{return toSource(p.prompt);}catch{return 'x'.repeat(99);}})();
 if(parts.some(p=>(p.questionDiagrams??[]).length||(p.children??[]).length))return content;
 // Length as printed: maths delimiters and commands do not print. Four columns only for very short parts:
 // "2(x+3)-3(x+1)" in four columns ran into the next part's label (Expanding Brackets variation, 8 November 2026).
 const shown=s=>String(s).replace(/\$/g,'').replace(/\\(?:left|right|,|;|quad)/g,'').replace(/\\[a-zA-Z]+/g,'x').replace(/[{}]/g,'');
 const longest=Math.max(...parts.map(p=>shown(text(p)).length));
 return longest<=10?{...content,layout:'grid',columns:Math.min(4,parts.length)}:longest<=24?{...content,layout:'grid',columns:Math.min(3,parts.length)}:longest<=60?{...content,layout:'grid',columns:2}:content;
}
export function blueWorking(blocks){
 const paint=inl=>(inl??[]).map(n=>(n.type==='math'&&!/^\s*\\color\{/.test(n.latex??'')||n.type==='text')&&!n.colour?{...n,colour:WORKING_BLUE}:n);
 const walk=nodes=>nodes.map(n=>{const m={...n};if(m.inlines)m.inlines=paint(m.inlines);if(m.items)m.items=m.items.map(it=>({...it,blocks:walk(it.blocks??[])}));if(m.rows)m.rows=m.rows.map(row=>row.map(c=>({...c,blocks:walk(c.blocks??[])})));if(m.slots)m.slots=m.slots.map(s=>({...s,blocks:walk(s.blocks??[])}));return m;});
 return walk(blocks);
}
// A guided practice that mirrors the example's numbered steps sometimes came back with the later parts empty, and
// printed bare labels "b", "c", "d" (Solve 2-Step Equations 2 j-age and j-coins, 8 November 2026). Each empty part
// takes the instruction of the example's matching step: its words up to the first ":" or "." and never its working
// (no maths, "=" or numbers), and a "Check" step reads "Check your answer."
const isEmptyPrompt=p=>p==null||(typeof p==='string'?!p.trim():!JSON.stringify(p.blocks??[]).match(/"(text|latex)":"[^"]*\S/));
export function fillEmptySteps(guided,steps){
 const parts=guided?.content?.children??[];if(!parts.some(c=>isEmptyPrompt(c.prompt)&&!(c.questionDiagrams??[]).length))return guided;
 const lines=String(steps??'').split('\n').map(l=>/^\s*(\d+)[.)]\s*(.+)$/.exec(l)).filter(Boolean).map(m=>m[2]);
 const instruction=t=>{const head=String(t).split(/[:.]/)[0].trim();if(/^check\b/i.test(head))return 'Check your answer.';
  // A step naming the example's own numbers ("Value of 20c coins plus value of 50c coins …") would mislead in a
  // guided practice about 10c and 20c coins: it gives way to a generic instruction.
  if(head&&!/[$=\d]/.test(head)&&head.split(/\s+/).length>=2)return head.replace(/^./,c=>c.toUpperCase())+'.';
  return /\bsolve\b/i.test(t)?'Solve the equation.':/equation|equal|total|sum/i.test(t)?'Write an equation.':null;};
 parts.forEach((c,k)=>{if(!isEmptyPrompt(c.prompt)||(c.questionDiagrams??[]).length)return;const text=instruction(lines[k]??'');if(text)c.prompt=text;});
 return guided;
}
// A guided practice with no parts prints bare, as the house ones do (James, 9 November 2026): teaching boxes
// letter every response leaf ("a") unless it is labelled "" with an unlabelled source response
// (src/lib/booklet-labels.js teachingLabels). Polynomials 1A j5, j6 and j7 each printed a lone "a".
export function unletterLoneGuided(block){
 const c=block?.content;if(!c||(c.children??[]).length)return block;
 c.label='';block.sourceReview={...(block.sourceReview??{}),responses:[{targetId:c.id,kind:'working',label:''}]};
 return block;
}
export function teachingBlocks(project,{workedExample,guided,stamp}){
 const taken=new Set((project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>b.id)));
 let id=('v2-example-'+stamp).replace(/[^\w-]/g,'-');for(let k=2;taken.has(id);k++)id=('v2-example-'+stamp+'-'+k).replace(/[^\w-]/g,'-');
 // House colours (James, 8 November 2026): the worked solution is blue, text and maths; operations
 // the draft already colours (red, applied to both sides) keep their colour. The question stays black.
 // Steps sent as a bare aligned display, with no $$ (Angle Relationships 1 j13), are maths, not text.
 const rawSteps=String(workedExample.steps??''),steps=/^\s*\\begin\{(align\*?|aligned|array)\}/.test(rawSteps)&&!rawSteps.includes('$')?'$$'+rawSteps.trim()+'$$':rawSteps;
 // A prompt with tab-separated rows becomes a table, as in drafted questions (Data Visualisation 1 j13).
 const asDoc=promptFromSource(String(workedExample.prompt??''),id+'-q');
 const question=typeof asDoc==='string'?fromSource(asDoc).blocks:asDoc.blocks,working=steps?blueWorking(fromSource(textRows(steps)).blocks):[];
 // The working is always theorySolution, never part of the prompt: "Show theory solutions" hides only the
 // solution fields, and working appended to the prompt stayed printed in the students' edition (Polynomials 1A
 // j5, 10 November 2026). It also prints a figure between the question and the working (Data Analysis 2 ogive).
 const doc=normalizeDocument({blocks:question}),solutionDoc=working.length?normalizeDocument({blocks:working}):null;
 // Without a figure the working printed as part of the prompt; solutionOwnStyle keeps that formatting.
 const figured=!!(workedExample.questionDiagrams?.length||workedExample.solutionDiagrams?.length);
 // Figure ids are the example's own; a finished drawing that completes the question figure is an overlay on it
 // (overlayOf), so the figure prints once with the drawing on it.
 const qIds=new Map((workedExample.questionDiagrams??[]).map((d,k)=>[String(d.id),id+'-diagram'+(k?'-'+(k+1):'')]));
 const example={id,type:'worked-example',sourceAtom:{id:id+'-atom',kind:'example',label:'Example',visibleSubtitle:exampleTitle(workedExample),order:2},pedagogyRole:'example',presentation:{layout:'columns',columns:1,numberSteps:false},
  // The draft's figure goes with the example (Area 2 j7–j9 printed "this sector" with no figure, 8 November 2026).
  examples:[{id:id+'-1',label:'',prompt:{format:DOCUMENT_FORMAT,version:DOCUMENT_VERSION,...doc},...(solutionDoc?{theorySolution:{format:DOCUMENT_FORMAT,version:DOCUMENT_VERSION,...solutionDoc},...(figured?{}:{solutionOwnStyle:true})}:{}),...(workedExample.questionDiagrams?.length?{questionDiagrams:workedExample.questionDiagrams.map((d,k)=>({...structuredClone(d),id:id+'-diagram'+(k?'-'+(k+1):''),role:'question'}))}:{}),
  // A drawing answer's finished drawing prints with the working (9 November 2026: Rates 2, Data Analysis 2 and others asked students to draw with no drawn model).
  ...(workedExample.solutionDiagrams?.length?{solutionDiagrams:workedExample.solutionDiagrams.map((d,k)=>{const o={...structuredClone(d),id:id+'-solution-diagram'+(k?'-'+(k+1):''),role:'solution'};if(o.overlayOf!=null){if(qIds.has(String(o.overlayOf)))o.overlayOf=qIds.get(String(o.overlayOf));else delete o.overlayOf;}return o;})}:{})}],flow:{keepTogether:true,sourcePageBreakBefore:false},snapshotKind:'local',bankRef:null};
 const out=[example];
 if(guided){const g=fillEmptySteps(structuredClone(guided),rawSteps);g.pedagogyRole='guided-practice';g.sourceAtom={id:g.id+'-atom',kind:'guided-practice',label:'Guided practice',order:3};g.flow={...(g.flow??{}),keepTogether:true,sourcePageBreakBefore:false};unletterLoneGuided(g);out.push(g);}
 return out;
}
// Maths written inside \text{} with dollars ("\text{$y$-intercept: }") ends the surrounding maths span at
// the inner "$", and the worked edition fails to render (Bivariate Data Analysis 2 slot 1, Stage 5,
// 9 November 2026). The inner maths leaves the \text{}: \text{}y\text{-intercept: }.
// Duplicate judgements never replace a past exam question: the replacement moves to the pair's other,
// non-exam question; otherwise the judgement is returned to be dropped.
// A long lettered exercise can be one question continued across blocks (flow.continuationOf, the stem hidden):
// Circle Geometry 1 Exercise 6 runs p, q, … zzz. New questions placed inside such a run printed as numbered
// questions (6, 9, 10 …) among the letters, or copied a neighbour's letter (two "nn"). Each new single question
// inside the run joins it as a fragment, and the run is lettered in one sequence from its first letter
// (a … z, aa … zz, aaa …), as the part-label rule asks (Stage 5, 10 November 2026). Returns the blocks changed.
const runLabel=k=>String.fromCharCode(97+k%26).repeat(Math.floor(k/26)+1);
const runIndex=l=>/^([a-z])\1*$/.test(l??'')?(l.length-1)*26+(l.charCodeAt(0)-97):-1;
export function joinContinuedRuns(section){
 const blocks=section?.blocks??[],changed=new Set();
 for(const head of new Set(blocks.map(b=>b.flow?.continuationOf).filter(Boolean))){
  const at=blocks.map((b,i)=>b.flow?.continuationOf===head?i:-1).filter(i=>i>=0);if(at.length<3)continue;
  const first=blocks[at[0]],stem=first.content?.prompt??'';
  for(let i=at[0];i<=at.at(-1);i++){const b=blocks[i];if(b.flow?.continuationOf||!b.id.startsWith('v2-')||b.type!=='question'||!b.content)continue;
   const c=b.content,kids=c.children??[];if(kids.length>1)continue;const k=kids[0]??{};
   const part={...Object.fromEntries(Object.entries(c).filter(([key])=>!['id','type','label','prompt','children','layout','columns'].includes(key))),...k,
    id:k.id??c.id+'-part',type:'part',label:'',prompt:String(k.prompt??'').trim()?k.prompt:c.prompt,
    questionDiagrams:[...(c.questionDiagrams??[]),...(k.questionDiagrams??[])]};
   if(!part.questionDiagrams.length)delete part.questionDiagrams;
   b.content={id:c.id,type:first.content.type,label:'',prompt:stem,children:[part]};
   b.flow={...(b.flow??{}),continuationOf:head,hideRepeatedStem:true};changed.add(b.id);}
  const run=blocks.slice(at[0],at.at(-1)+1).filter(b=>b.flow?.continuationOf===head&&(b.content?.children??[]).length===1);
  let k=Math.max(0,runIndex(run[0]?.content.children[0].label));
  for(const b of run){const p=b.content.children[0],want=runLabel(k++);if(p.label!==want){p.label=want;changed.add(b.id);}}
 }
 return [...changed];
}
export function keepExamQuestions(judgements,examIds){
 const dropped=[];
 for(const j of judgements.filter(j=>j.kind==='duplicate')){const target=j.row.replace;if(!examIds.has(target))continue;
  const other=(j.row.ids??[]).find(x=>x!==target&&!examIds.has(x));
  if(other&&!j.repeatedPart){j.row.replace=other;continue;}
  dropped.push(j.id);}
 return dropped;
}
export function unnestTextMath(s){
 if(typeof s!=='string'||!s.includes('\\text{'))return s;
 let prev;do{prev=s;s=s.replace(/\\text\{([^{}$]*)\$([^$]*)\$([^{}]*)\}/g,(m,a,b,c)=>(a?`\\text{${a}}`:'')+b+(c?`\\text{${c}}`:''));}while(s!==prev);
 return s;
}
function unnestAnswers(node){
 for(const n of new Set([node,...nodesOf(node)])){if(typeof n.prompt==='string')n.prompt=unnestTextMath(n.prompt);
  if(n.answer&&typeof n.answer==='object')for(const k of ['short','worked'])if(typeof n.answer[k]==='string')n.answer[k]=unnestTextMath(n.answer[k]);}
}
export function newBlock(draft,slot,{project,score,placement,refs,evidence,skill,type,kind='slot',typeOfId=null}){
 // A later run reuses slot names, so an id already in the booklet gets a suffix (6 November 2026:
 // the second Similar Triangles run drafted a second "slot-1-lower" and the sort refused the clash).
 const base=('v2-'+(slot.sectionId??'proposal').slice(-18)+'-'+slot.id).replace(/[^\w-]/g,'-'),taken=new Set((project?.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>b.id)));
 let id=base;for(let k=2;taken.has(id);k++)id=base+'-'+k;
 const content=structuredClone(draft.content);content.id=id+'-root';content.type='question';content.label=null;
 let n=0;const renamed=new Map();for(const node of nodesOf(content))if(node!==content){const old=node.id;if(!node.id||node.id===content.id)node.id=id+'-n'+(++n);else node.id=id+'-'+String(node.id).replace(/[^\w-]/g,'');if(old)renamed.set(String(old),node.id);}
 // Dependencies follow their renamed parts.
 for(const node of nodesOf(content))if(Array.isArray(node.dependsOn))node.dependsOn=node.dependsOn.map(d=>renamed.get(String(d))??d);
 // An empty "children" array printed a lone part label "a" (Data Visualisation 1 guided practice, 9 November 2026).
 for(const node of new Set([content,...nodesOf(content)]))if(Array.isArray(node.children)&&!node.children.length)delete node.children;
 unnestAnswers(content);
 // A question drafted as one part becomes the question itself, for the same reason.
 {const only=content.children?.length===1?content.children[0]:null;
  if(only&&!(only.children??[]).length&&typeof only.prompt==='string'&&(content.prompt==null||typeof content.prompt==='string')&&!content.answer){
   content.prompt=[content.prompt,only.prompt].filter(s=>s&&String(s).trim()).join('\n\n');content.questionDiagrams=[...(content.questionDiagrams??[]),...(only.questionDiagrams??[])];
   for(const k of ['answer','answerSpaceMm','solutionDiagrams','responseSpace'])if(only[k]!==undefined)content[k]=only[k];delete content.children;}}
 // A drawn answer lives in the answer, as in the booklets (answer.solutionDiagrams); a draft that put it on the part is moved (9 November 2026).
 for(const node of new Set([content,...nodesOf(content)]))if(Array.isArray(node.solutionDiagrams)&&node.type&&['question','part'].includes(node.type)){if(node.solutionDiagrams.length)node.answer={...(node.answer??{}),solutionDiagrams:[...(node.answer?.solutionDiagrams??[]),...node.solutionDiagrams.map(d=>({...d,role:'solution'}))]};delete node.solutionDiagrams;}
 // The question's own prompt too (Data Visualisation 1 slot 5: its tab-separated table printed as spaces).
 // Converted before partLayout, which copies the root when it sets a grid: converting afterwards changed the
 // discarded original, and a gridded question's table printed as bare rows (Linear Relationships 1
 // slot-11-lower, 8 November 2026).
 for(const node of new Set([content,...nodesOf(content)]))if(typeof node.prompt==='string')node.prompt=promptFromSource(node.prompt,node.id);
 const block={id,type:'question',pedagogyRole:'practice',snapshotKind:'local',bankRef:null,title:'',content:partLayout(content),
  classification:{primarySkillId:skill??draft.skill??null,secondarySkillIds:[],archetype:type},
  sourceReview:{origin:{projectId:project.id,blockId:id,generatedBy:'pedagogy-audit-v2'},generation:{model:MODEL,effort:EFFORT,kind,slot:{id:slot.id,reason:slot.reason,target:slot.target,range:slot.range},evidence},workingSpaceEstimate:{method:'solution-steps',estimates:(draft.workingSpace??[]).map(w=>({...w,targetId:content.id===w.targetId?content.id:nodesOf(content).find(x=>x.id.endsWith('-'+String(w.targetId).replace(/[^\w-]/g,'')))?.id??w.targetId}))}}};
 for(const node of nodesOf(content)){const est=block.sourceReview.workingSpaceEstimate.estimates.find(w=>w.targetId===node.id);if(est&&Number.isFinite(est.answerSpaceMm)&&!(node.children??[]).length)node.answerSpaceMm=est.answerSpaceMm;}
 const sibling=layoutSibling(project,slot,type,typeOfId);
 // The sibling's arrangement goes on the block's own content (it went on a discarded copy, so the length-based
 // grid stood while layoutFrom claimed the sibling), with no more columns than the parts' length allows.
 if(sibling&&!content.layout&&(content.children??[]).length>1&&(content.children??[]).every(c=>!(c.children??[]).length)){
  const fit=partLayout(content);let cap=fit.layout==='grid'?fit.columns:fit.layout?1:Infinity;
  // A part's figure needs its own width: a 95 mm outcome table in one of three columns printed its labels
  // across the cell borders (Multistage Probability 2 slot 3, Stage 5, 9 November 2026).
  cap=Math.min(cap,figureColumns(content));
  block.content={...content,layout:sibling.layout,...(sibling.columns!=null?{columns:Math.max(1,Math.min(sibling.columns,content.children.length,cap))}:{})};
  if(block.content.layout==='grid'&&block.content.columns===1){delete block.content.columns;block.content.layout='list';}
  block.sourceReview.layoutFrom=sibling.id;}
 if(score!=null)setComparisonRating(block,score,placement,refs,evidence);
 return block;
}
// Drafts are written in the editor's source text, the form in which they see their siblings (toSource):
// _italic_, **bold**, [[answer|width]] blanks and tables as tab-separated rows. A plain string prompt prints
// that markup literally (7 November 2026, Stage 4 batch 1: "_2.718 …_" and run-together blanks), so a
// marked-up prompt becomes an editor document, with tab-separated rows as a borderless table.
const MARKUP=/\t|\[\[[^|\]\n]*\|\d+\]\]|\*\*[^*\n]+\*\*|(^|[^\w\\])_[^_\n]+_(?!\w)/;
// A row label that is one variable, in maths or not: x, $y$, $t_1$, $h_{n}$.
export const isVariableLabel=c=>/^\s*\$?\s*[A-Za-z](?:_\{?\w+\}?)?\s*\$?\s*$/.test(String(c??''));
// A row label that is the variable's equation, in maths or not: "$y=x^2-8x+10$" or "y=x^{2}-8x+10"
// (Features of Quadratics 1 j2, Stage 5, 10 November 2026: printed borderless, the label ran into the first value).
export const isEquationLabel=c=>/^\s*\$?\s*[A-Za-z](?:_\{?\w+\}?)?\s*=\s*[^=$\t]*[\w})]\s*\$?\s*$/.test(String(c??''))&&!/[A-Za-z]{3}/.test(String(c??'').replace(/\\[a-zA-Z]+/g,''));
const variableName=c=>String(c??'').replace(/[\s$]/g,'').split('=')[0];
export function promptFromSource(text,id){
 const outsideMath=String(text).replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*\$/g,'');
 if(!MARKUP.test(outsideMath))return text;
 const lines=String(text).replace(/\r/g,'').split('\n'),blocks=[];let prose=[];
 const flush=()=>{if(prose.join('').trim())blocks.push(...fromSource(prose.join('\n')).blocks);prose=[];};
 for(let i=0;i<lines.length;){
  if(!lines[i].includes('\t')){prose.push(lines[i++]);continue;}
  flush();const rows=[];while(i<lines.length&&lines[i].includes('\t'))rows.push(lines[i++].split('\t'));
  const cols=Math.max(...rows.map(r=>r.length)),align=c=>cols===3?['right','center','left'][c]:'left';
  // A cell's width counts every blank in it and the text around them. Counting only the first blank made
  // "= [[…]]×([[…]]+[[…]])[[…]]" a 26 mm column, and the scaffold wrapped into a narrow stack
  // (Compound Interest slots 6 and 16, Stage 5 pilot, 9 November 2026).
  const mm=cell=>{const s=String(cell),blanks=[...s.matchAll(/\[\[([^|\]]*)\|(\d+)\]\]/g)],rest=s.replace(/\[\[[^\]]*\]\]/g,'').replace(/\$|\\[a-z]+/gi,'');
   const blankMm=blanks.reduce((a,m)=>a+Math.max(Number(m[2]),clozeHandwritingMm(m[1]))+2,0);
   // Printed maths spaces its relations and operators: "y=2-5x" counted 15 mm and four such equations
   // printed on top of each other (Gradient-Intercept Form slot 1, Stage 5, 9 November 2026).
   const ops=(s.replace(/\[\[[^\]]*\]\]/g,'').match(/\$[^$]*\$/g)??[]).join('').replace(/^\s*-|\{-/g,'').match(/[=+\-<>]|\\times|\\div|\\le|\\ge|\\pm/g)?.length??0;
   const textMm=rest.trim()?2*rest.length+3+2.5*ops:0;
   return blanks.length?blankMm+textMm:Math.max(6,2*rest.length+3+2.5*ops);};
  // A row of four or more items laid side by side needs a gutter between them (the same slot).
  const widths=Array.from({length:cols},(_,c)=>Math.max(...rows.map(r=>mm(r[c]??'')))+(cols>=4?4:0));
  // A first row of plain headings (words, no digits or blanks) is a real table, in the booklets' shaded-header style;
  // otherwise the rows are aligned working and stay borderless (Computation with Integers 2 j2, 8 November 2026).
  // Every heading has a letter and no digit or blank, and one is a word: "Pets / f / c.f." counts (Data
  // Visualisation 1-2). A stem-and-leaf plot is not a gridded table.
  const heads=Array.from({length:cols},(_,c)=>String(rows[0][c]??''));
  // Headings may carry digits beside letters ("9A", Data Visualisation 1 slot 16); a bare number is data.
  // Multiple-choice options ("A<tab>What is …?") are a list, never a table: option A printed as a shaded
  // header row (Data Visualisation 1 count top-up, 8 November 2026).
  const options=rows.every(r=>/^\s*\(?[A-F][.)]?\s*$/.test(String(r[0]??'')));
  const words=c=>/[A-Za-z]{2}/.test(String(c??'').replace(/\$[^$]*\$/g,''));
  // A table of values laid out across ("Week | 1 | 2 | …" over "Savings | 40 | … "): every row starts with a
  // label, so it is a bordered table. Its label column is shaded, not its first row, which may be data
  // ("Kiara | 12 | 15" over "Lena | …", Data Analysis 3).
  // Bold or italic markup is read through: "**Stem**" is still a stem-and-leaf plot (Data Analysis 2 j3).
  const stemLeaf=heads.some(h=>/^\s*(stem|leaf|leaves)\b/i.test(h.replace(/\*\*|(^|\s)_|_(\s|$)/g,'$1$2')));
  const headRow=!options&&rows.length>1&&cols>1&&heads.every(h=>/[A-Za-z]/.test(h.replace(/\$[^$]*\$/g,'')||h)&&!/\[\[/.test(h)&&!/^\s*\$?-?[\d.,]+\$?\s*$/.test(h))&&heads.some(h=>/[A-Za-z]{3}/.test(h.replace(/\$[^$]*\$/g,'')))&&!stemLeaf;
  // A table of values labelled by its variables ("$x$ | 0 | 1 | 2" over "$y$ | 1 | 3 | 5") is the same table:
  // the labels are distinct single letters and no value cell holds "=", so aligned working ("$x$ | = | 5")
  // stays borderless (Linear Relationships 1 j9, j10 and slots 12–14 printed as bare rows, 8 November 2026).
  const variables=rows.every(r=>isVariableLabel(r[0])||isEquationLabel(r[0]))&&new Set(rows.map(r=>variableName(r[0]))).size===rows.length&&rows.every(r=>r.slice(1).every(c=>!/=/.test(String(c??''))));
  // Labels may mix variables and words ("x | 1 | 2" over "y | …" over "Coordinate | (1,2) | …", Graphing Lines
  // slots 1 and 3, Stage 5, 9 November 2026): printed borderless, the rows fell out of line.
  const mixed=rows.every(r=>words(r[0])||isVariableLabel(r[0]))&&rows.some(r=>isVariableLabel(r[0]))&&new Set(rows.map(r=>variableName(r[0]))).size===rows.length&&rows.some(r=>words(r[0]))&&rows.every(r=>r.slice(1).every(c=>!/=/.test(String(c??''))));
  const acrossOnly=!options&&!headRow&&rows.length>1&&cols>=3&&(rows.every(r=>words(r[0]))||variables||mixed)&&!stemLeaf;
  // A two-way table: blank corner, a heading in every other cell of the first row and first column ("" | 2 | 4 | …
  // over "2 | (2,2) | …"). Both headings are shaded, as in the booklets (Multistage Probability slots 1 and 2,
  // Stage 5, 9 November 2026: printed borderless, the outcomes fell out of line).
  const blank=c=>!String(c??'').trim(),twoWay=!options&&!stemLeaf&&rows.length>=3&&cols>=3&&blank(rows[0][0])&&rows[0].slice(1).every(c=>!blank(c))&&rows.slice(1).every(r=>!blank(r[0]))&&rows.every(r=>r.slice(1).every(c=>!/=/.test(String(c??''))));
  const headed=headRow||acrossOnly||twoWay,shaded=(k,c)=>twoWay?(k===0)!==(c===0):headRow?k===0:acrossOnly&&c===0;
  const al=c=>headed?'center':align(c);
  // Bold headings with 2 mm padding need about 2.4 mm a character, or "Numbers" wraps mid-word.
  // The header style's 2 mm padding each side comes out of every column, blanks included (Data Visualisation 1-2).
  if(headed)widths.forEach((w,c)=>{widths[c]=w+4;});
  if(headRow)widths.forEach((w,c)=>{const h=String(rows[0][c]??'').replace(/\$[^$]*\$/g,'-');widths[c]=Math.max(w,Math.max(...h.split(/\s+/).map(x=>x.length))*2.4+6);});
  if(acrossOnly)widths[0]=Math.max(widths[0],...rows.map(r=>Math.max(...String(r[0]??'').replace(/\$[^$]*\$/g,'-').split(/\s+/).map(x=>x.length))*2.4+6));
  // An equation label prints as spaced maths, dollars or not, with the shaded column's padding.
  if(acrossOnly)widths[0]=Math.max(widths[0],...rows.filter(r=>isEquationLabel(r[0])).map(r=>mm('$'+String(r[0]).replace(/\$/g,'').trim()+'$')+6));
  // Borderless working with blanks gets the house scaffolds' writing rows (8–12 mm); with none set the
  // rows closed up under the blanks (Compound Interest slot 6, Stage 5 pilot, 9 November 2026).
  const writing=!headed&&rows.some(r=>r.some(c=>/\[\[[^|\]]*\|\d+\]\]/.test(String(c??''))));
  blocks.push({type:'table',border:headed,padding:headed?2:0,widthMm:Math.round(widths.reduce((a,b)=>a+b,0)),widths,...(writing?{rowHeights:rows.map(()=>10)}:{}),rows:rows.map((r,k)=>Array.from({length:cols},(_,c)=>({type:'cell',align:al(c),verticalAlign:'middle',...(shaded(k,c)?{header:true,background:'#d3e8fc',bold:true}:{}),blocks:[{type:'paragraph',align:al(c),inlines:inlinesFromSource(r[c]??'')}]})))});
 }
 flush();
 // A blank is never narrower than the house handwriting width for its answer (the page check's rule).
 let k=0;const doc=normalizeDocument({format:DOCUMENT_FORMAT,version:DOCUMENT_VERSION,blocks:visitDocument({blocks},n=>{n.id=id+'-d'+(++k);for(const x of n.inlines??[])if(x.type==='cloze')x.width=Math.max(Number(x.width)||0,clozeHandwritingMm(x.answer));}).blocks});
 return doc;
}
// A drafted question copies the arrangement of its siblings (7 November 2026, Stage 4 batch 1: six-part
// drafts printed as one column, 2½ pages, beside 2–4 column siblings). Layout and columns are presentation,
// which the drafter never sees. Prefer a sibling of the same type in the slot's exercise, then the slot's
// neighbours; take the arrangement of whichever node of it holds its parts.
export function layoutSibling(project,slot,type,typeOfId){
 const section=(project?.sections??[]).find(s=>s.id===slot?.sectionId);if(!section)return null;
 const own=(section.blocks??[]).filter(b=>b.type==='question'&&b.content&&b.sourceReview?.origin?.generatedBy!=='pedagogy-audit-v2');
 // The outermost node that arranges parts: directly, or as a grid of column groups (each a list of parts).
 const leaf=c=>c.type==='part'&&!(c.children??[]).length;
 const holder=b=>nodesOf(b.content).find(n=>n.layout&&(n.children??[]).length>1&&(n.children.every(leaf)||(n.layout==='grid'&&n.children.every(c=>c.type==='group'&&(c.children??[]).length&&c.children.every(leaf)))));
 const near=[slot.after,slot.before,slot.neighbours?.harderThan,slot.neighbours?.easierThan].filter(Boolean);
 const ranked=[...(type&&typeOfId?own.filter(b=>typeOfId(b.id)===type):[]),...near.map(id=>own.find(b=>b.id===id)).filter(Boolean)];
 for(const b of ranked){const n=holder(b);if(n)return {id:b.id,layout:n.layout,columns:n.columns??null};}
 return null;
}
export function setComparisonRating(block,score,placement,refs,evidence){
 block.classification={...block.classification,reasoningScore:score,difficulty:bandFor(score),difficultyReason:String(placement.difficultyReason??'').trim()||'Placed by comparison.',
  assessment:{model:MODEL,effort:EFFORT,method:'comparison-v1',assessedAt:now(),rubricVersion:REASONING_RUBRIC,taskHash:reasoningTaskHash(block),diagramBlindHash:diagramBlindHash(block),evidence,comparison:{harderThan:placement.harderThan?{ref:placement.harderThan,score:refs.get(placement.harderThan)??null}:null,easierThan:placement.easierThan?{ref:placement.easierThan,score:refs.get(placement.easierThan)??null}:null,equalTo:placement.equalTo?{ref:placement.equalTo,score:refs.get(placement.equalTo)??null}:null,closerTo:placement.closerTo??null}}};
}
export const stripAnswers=content=>JSON.parse(JSON.stringify(content,(k,v)=>['answer','solutionDiagrams'].includes(k)?undefined:v));
const fieldGet=(node,field)=>field==='prompt'?node.prompt:node.answer?.[field];
function fieldSet(node,field,value){if(field==='prompt')node.prompt=value;else node.answer={...node.answer,[field]:value};}

// ---- the run -------------------------------------------------------------------------
export async function runAuditV2({projectFile,root=ROOT,topics=[],dryRun=false,allowNonMaster=false,freshCalls=false,topUp=false,log=console.error}={}){
 // A PAUSE file stops new audits before any model call; runs already started and --apply are unaffected.
 if(!dryRun&&fs.existsSync(path.join(root,'.booklet-work','pedagogy-audit-v2','PAUSE')))throw Error('Paused: .booklet-work/pedagogy-audit-v2/PAUSE exists; remove it to resume');
 const t0=Date.now(),project=read(projectFile),stamp=now().replace(/[-:]/g,'').replace(/\..*/,'').replace('T','-');
 const workDir=path.join(root,'.booklet-work','pedagogy-audit-v2',project.id,stamp);
 const rebinds=diagramRebinds(project,{root}),base=withRebinds(project,rebinds);
 const state=preflight(base,{root,topics,allowNonMaster});
 const ctx={workDir,runDir:canonicalRunDir(project,{root}),calls:[],log,dryRun,freshCalls};
 const report={projectId:project.id,title:project.title,revision:project.revision,startedAt:new Date(t0).toISOString(),model:MODEL,effort:EFFORT,stages:{},applied:{},comments:[],blockers:[],dropped:[]};
 const stage=(name,fn)=>async(...a)=>{const s=Date.now();try{return await fn(...a);}finally{report.stages[name]={seconds:Math.round((Date.now()-s)/100)/10};}};
 report.preflight={master:state.master,stale:Object.fromEntries(Object.entries(state.stale).map(([k,v])=>[k,v.length])),duplicateCandidates:state.pairs.length,spelling:state.spelling.reduce((n,s)=>n+s.changes.length,0),openComments:state.openComments,v1CommentsToWithdraw:state.v1Comments.length,progressionExceptions:state.progressions,typesReused:[...state.types.values()].filter(t=>t.current).length};
 const comments=[];const addComment=c=>{comments.push(c);};
 let candidate=structuredClone(base);
 report.applied.diagramRebinds=rebinds.map(r=>({id:r.id,score:r.classification.reasoningScore,source:r.source}));
 // Stage 0 spelling.
 for(const s of state.spelling){
  if(s.protected){addComment({targetId:s.id,kind:'spelling',key:'spell|'+s.id,note:`[Pedagogy audit v2 · Spelling] Australian spelling on this teacher-reviewed block: ${s.changes.map(c=>c.from+' → '+c.to).join(', ')}.`});continue;}
  for(const sec of candidate.sections)sec.blocks=(sec.blocks??[]).map(b=>{if(b.id!==s.id)return b;const fixed=s.block;if(verifiedRating(b)){const a=fixed.classification.assessment;a.originalTaskHash??=a.taskHash;fixed.classification.assessment={...a,taskHash:reasoningTaskHash(fixed),spellingReuse:{kind:'australian-spelling-v1',previousTaskHash:a.taskHash,changes:s.changes.map(c=>c.from+'>'+c.to),contentFingerprint:contentFingerprint(fixed)}};}return fixed;});
 }
 report.applied.spelling=state.spelling.filter(s=>!s.protected).map(s=>({id:s.id,changes:s.changes.map(c=>c.from+' → '+c.to)}));
 // Stage 2: moves and provisional order.
 const moves=challengeMoves(candidate);
 candidate=applyMoves(candidate,moves);
 let ordered=orderCandidate(candidate,{progressions:state.progressions});
 candidate=ordered.project;
 report.moves=moves;
 const dryGaps=gapPlan(candidate,state,{audit:null});
 const packets=auditPackets(state,candidate,{root});
 report.dryRun={packets:packets.map(p=>({topics:p.topics,characters:p.system.length+p.prompt.length})),provisionalSlots:dryGaps.slots.length,provisionalSlotsBySection:Object.fromEntries([...new Set(dryGaps.slots.map(s=>s.sectionId))].map(id=>[id,dryGaps.slots.filter(s=>s.sectionId===id).length])),deficits:dryGaps.deficits,jumpsOver15:dryGaps.gaps,ratingsToFill:state.stale.rating.length,orderingHolds:ordered.plan.holds.length};
 if(dryRun){report.elapsedSeconds=Math.round((Date.now()-t0)/1000);return {report,workDir:null};}
 fs.mkdirSync(workDir,{recursive:true});write(path.join(workDir,'before.json'),project);
 const anchors=anchorRefs(root);
 try{
 // Stage 1: missing or stale ratings, by comparison.
 const pendingHigh=new Set();state.pendingHigh=pendingHigh;
 await stage('1-ratings',async()=>{
  const targets=state.stale.rating.map(id=>bookletIndex(candidate).find(r=>r.block.id===id)).filter(Boolean);if(!targets.length)return;
  const refIds=new Set(),items=targets.map(r=>{const ladder=ladderFor(candidate,{sectionId:r.section.id,topicId:r.section.topicId,exclude:new Set([r.block.id])});ladder.forEach(id=>refIds.add(id));return {id:r.block.id,ladder:[...ladder,...anchors.map(a=>a.ref)],task:auditView(r.block)};});
  const blocks=new Map(bookletIndex(candidate).map(r=>[r.block.id,r.block])),refs=new Map([...anchors.map(a=>[a.ref,a.score]),...[...refIds].map(id=>[id,scoreOf(blocks.get(id))])]);
  const system=ratingContract()+'\n\nStanding anchors:\n'+anchors.map(a=>JSON.stringify(a)).join('\n');
  // Whole-batch references while they fit (unchanged prompts keep earlier replies reusable); a split batch takes only its own ladders.
  const ratingPrompt=(list,trim)=>{const used=new Set(list.flatMap(i=>i.ladder));return JSON.stringify({references:[...refIds].filter(id=>!trim||used.has(id)).map(id=>({ref:id,score:scoreOf(blocks.get(id)),task:auditView(blocks.get(id))})),targets:list});};
  const whole=system.length+ratingPrompt(items,false).length<=LIMITS.promptCharacters;
  const parts=await splitByCap(items,list=>system.length+ratingPrompt(list,!whole).length,async list=>callSonnet(ctx,{stage:'rating',system,prompt:ratingPrompt(list,!whole),validate:r=>validatePlacements(r,list.map(i=>i.id))}));
  for(const p of parts.filter(p=>p.over))for(const i of p.items)(report.dropped??=[]).push({rating:i.id,reason:'its rating material is over the prompt cap; the rating stays missing'});
  const value=mergeMaps(parts.map(p=>p.value?.value)),fileOf=new Map(parts.filter(p=>p.value).flatMap(p=>p.items.map(i=>[i.id,p.value.file])));
  for(const item of items){if(!value.has(item.id))continue;const file=fileOf.get(item.id),p=value.get(item.id),d=deriveComparisonScore(p,refs),b=blocks.get(item.id);
   if(d.score==null){report.blockers.push({stage:'rating',id:item.id,reason:'placement '+d.how});continue;}
   if(d.score>=LIMITS.appliedBelow){pendingHigh.add(item.id);const rated=structuredClone(b);setComparisonRating(rated,d.score,p,refs,file);addComment({targetId:item.id,kind:'rating-60-plus',key:'rate|'+item.id,payload:{op:'rating',blockId:item.id,classification:rated.classification},note:`[Pedagogy audit v2 · Rating to decide] Placed by comparison at ${d.score} (between ${p.harderThan??'—'} and ${p.easierThan??'—'}). Scores of 60 or more are not applied automatically; the question keeps its position. Reason: ${p.difficultyReason}`});continue;}
   setComparisonRating(b,d.score,p,refs,file);(report.applied.ratings??=[]).push({id:item.id,score:d.score,how:d.how,flagged:!!d.flagged});}
  ordered=orderCandidate(candidate,{progressions:state.progressions});candidate=ordered.project;
 })();
 // Stage 3: topic audit.
 const audit={archetypes:[],types:[],exampleMatches:[],spread:[],errors:[],duplicates:[],bridges:[],missing:[],prerequisites:[],extensions:[],variations:[],relocate:[],keep:[],theory:[],keyIdeas:[]};
 // Count top-up (James, 8 November 2026): a booklet audited before the part-count and synonym rules gets the
 // count questions the old limit held back, and variation sequences. The earlier audit's types, roles,
 // keep runs and deliberate duplicates are reused; the topic audit and its other findings are not redone.
 if(topUp)await stage('3-topup',async()=>{
  const prior=priorAuditRun(project.id,{root});if(!prior)throw Object.assign(Error('top-up needs an earlier audit run with audit.json'),{blocker:true});
  const was=read(path.join(prior,'audit.json'));report.topUp=true;report.priorRun=rel(prior);
  for(const k of ['archetypes','types','keep'])audit[k]=was[k]??[];
  audit.duplicates=(was.duplicates??[]).filter(d=>d.verdict==='deliberate');
  for(const row of audit.archetypes)state.types.set(row.id,{type:row.type,current:true,source:'audit-v2'});
  for(const [id,t] of state.types)if(!audit.types.some(x=>x.type===t.type))audit.types.push({type:t.type,topicId:bookletIndex(candidate).find(r=>r.block.id===id)?.section.topicId,taught:true,taughtBy:[],description:'stored type'});
  for(const packet of auditPackets(state,candidate,{root,variationsOnly:true})){
   try{const {value,file}=await callSonnet(ctx,{stage:'variations',system:packet.system,prompt:packet.prompt,validate:r=>validateVariations(r,packet.ctx)});audit.variations.push(...value.variations);(report.auditCalls??=[]).push(file);}
   catch(error){if(!error.blocker)throw error;report.blockers.push({stage:'variations',topics:packet.topics,reason:error.message});}
  }
 })();
 if(!topUp)await stage('3-audit',async()=>{
  for(const packet of auditPackets(state,candidate,{root})){
   try{const {value,file}=await callSonnet(ctx,{stage:'audit',system:packet.system,prompt:packet.prompt,validate:r=>validateAudit(r,packet.ctx)});for(const k of Object.keys(audit))audit[k].push(...(value[k]??[]));(report.auditDiscarded??=[]).push(...(value.discarded??[]));(report.auditCalls??=[]).push(file);}
   catch(error){if(!error.blocker)throw error;report.blockers.push({stage:'audit',topics:packet.topics,reason:error.message});}
  }
  // Parts of a split topic each report on their own exercises: merge worked-example matches, and
  // keep one "missing" finding per type.
  const matches=new Map();for(const m of audit.exampleMatches){const row=matches.get(m.exampleId)??{...m,followedBy:[]};row.followedBy=[...new Set([...row.followedBy,...(m.followedBy??[])])];matches.set(m.exampleId,row);}audit.exampleMatches=[...matches.values()];
  const seenMissing=new Set();audit.missing=audit.missing.filter(m=>{const k=m.type??JSON.stringify(m);if(seenMissing.has(k))return false;seenMissing.add(k);return true;});
  for(const row of audit.archetypes)state.types.set(row.id,{type:row.type,current:true,source:'audit-v2'});
  for(const [id,t] of state.types)if(!audit.types.some(x=>x.type===t.type))audit.types.push({type:t.type,topicId:bookletIndex(candidate).find(r=>r.block.id===id)?.section.topicId,taught:true,taughtBy:[],description:'stored type'});
 })();
 // Stage 3b: core or enrichment for each type that would otherwise get count slots (James, 7 November 2026).
 await stage('3b-roles',async()=>{report.roles=await labelTypeRoles(ctx,candidate,state,audit);report.typeGroups=audit.typeGroups??[];if(audit.typeGroupsFailed)report.typeGroupsFailed=audit.typeGroupsFailed;})();
 write(path.join(workDir,'audit.json'),audit);
 // Stage 4: final order and gap plan.
 let gaps;
 const deliberate=audit.duplicates.filter(d=>d.verdict==='deliberate').map(d=>d.ids);
 await stage('4-plan',async()=>{
  ordered=orderCandidate(candidate,{keep:audit.keep,deliberate,progressions:state.progressions,original:project});candidate=ordered.project;
  gaps=gapPlan(candidate,state,{audit,countsOnly:topUp});
  // Top-up questions get their own ids, so they never take the id of a count question removed earlier.
  if(topUp)for(const s of gaps.slots)s.id='topup-'+s.id;
 })();
 // Stage 5a: challenge of teaching judgements.
 const judgements=[];
 const ownerOf=new Map(bookletIndex(candidate).flatMap(r=>nodesOf(r.block).map(n=>[String(n.id),r.block.id])));
 const cite=ids=>[...new Set(ids.filter(Boolean).map(id=>ownerOf.get(String(id))??id))].map(id=>bookletIndex(candidate).find(r=>r.block.id===id)).filter(Boolean).map(r=>({id:r.block.id,topicId:r.section.topicId,view:auditView(r.block)}));
 audit.duplicates.filter(d=>d.verdict==='accidental').forEach(d=>judgements.push({kind:'duplicate',row:d,cites:d.ids}));
 audit.spread.forEach(d=>judgements.push({kind:'spread',row:d,cites:d.ids}));
 // A finding is judged against the questions it is for (7 November 2026): every unverified bridge and
 // new-teaching comment in the first batch cited only the block before the gap, never its target.
 // Without neededBy, a bridge or extension cites the next questions in its exercise, and a missing
 // type cites the exercise questions of that type.
 for(const k of ['bridges','missing','prerequisites','extensions','variations'])audit[k].forEach(d=>judgements.push({kind:k,row:d,cites:[d.after,...challengeTargets(candidate,state,k,d)]}));
 // A relocation cites its questions, then the later lesson's teaching; its topic is the later lesson, so the
 // checker also gets that lesson's teaching (James, 9 November 2026).
 audit.relocate.forEach(d=>judgements.push({kind:'relocate',row:{...d,topicId:d.toTopicId},cites:[...d.ids,...(d.taughtBy??[])]}));
 audit.theory.filter(t=>['definition','wording'].includes(t.verdict)).forEach(d=>judgements.push({kind:'theory-'+d.verdict,row:d,cites:[d.id]}));
 const lessons=keyIdeasLessons(candidate);
 audit.keyIdeas.filter(k=>k.verdict==='needed'&&lessons.has(k.topicId)).forEach(d=>judgements.push({kind:'key-ideas',row:{...d,after:lessons.get(d.topicId).after},cites:[lessons.get(d.topicId).after]}));
 judgements.forEach((j,i)=>{j.id='j'+(i+1);if(j.kind==='spread')j.row.judgement=j.id;});
 for(const s of gaps.slots)if(s.reason==='spread')s.judgement=audit.spread.find(sp=>sp.type===s.type)?.judgement??null;
 const teachingOf=topicId=>bookletIndex(candidate).filter(r=>r.section.topicId===topicId&&r.kind==='teaching').map(r=>({id:r.block.id,view:auditView(r.block)}));
 // The retry of an unchecked judgement carries what the checker asked for: the teaching and the
 // exercise questions of its own topic and of the topic it named, and the whole exercise it sits in.
 // Teaching alone could never settle a claim about a question (the first batch's retries all failed).
 const topicIds=new Set(bookletIndex(candidate).map(r=>r.section.topicId).filter(Boolean));
 const retryMaterial=(j,needsTopic)=>{const cited=cite(j.cites),own=j.row.topicId??cited[0]?.topicId,topics=[...new Set([own,needsTopic].filter(t=>t&&topicIds.has(t)))],shown=new Set(cited.map(c=>c.id));
  const questions=bookletIndex(candidate).filter(r=>r.question&&!shown.has(r.block.id)&&(topics.includes(r.section.topicId)||(j.row.exerciseId&&r.section.id===j.row.exerciseId)));
  return {topicTeaching:topics.flatMap(teachingOf),topicQuestions:questions.map(r=>({id:r.block.id,topicId:r.section.topicId,exerciseId:r.section.id,view:auditView(r.block)}))};};
 const challengeRun=stage('5a-challenge',async()=>{
  if(!judgements.length)return new Map();
  // Judgements are independent, so an over-cap challenge is halved rather than refused (pilot 2's reached 247,000 of 280,000 characters).
  // Each passage is printed once, in "views" and "teaching", and judgements refer to it by id (8 November
  // 2026): Area 1's judgements each repeated their diagram-heavy cited questions and teaching, so the
  // challenge was halved into 16 calls that each wrote 60,000–147,000 tokens to the cache and read none.
  const send=async(list,withTopics,needs=new Map(),retry=false)=>{const system=challengeContract(),views={},teaching={};
   const view=c=>{views[c.id]??=c.view;return c.id;},topic=t=>{if(t&&!teaching[t])teaching[t]=teachingOf(t);return t;};
   const rows=list.map(j=>{const cited=cite(j.cites);let extra={};
    if(needs.has(j.id)){const own=j.row.topicId??cited[0]?.topicId,named=needs.get(j.id),topics=[...new Set([own,named].filter(t=>t&&topicIds.has(t)))];const m=retryMaterial(j,named);extra={topicTeaching:topics.map(topic),topicQuestions:m.topicQuestions.map(view)};}
    else if(withTopics){const t=j.row.topicId??cited[0]?.topicId;if(t)extra={topicTeaching:[topic(t)]};}
    return {id:j.id,kind:j.kind,judgement:j.row,cited:cited.map(view),...extra};});
   const prompt=JSON.stringify({booklet:candidate.title,topics:[...topicIds],views,teaching,judgements:rows});
   if(list.length>1&&system.length+prompt.length>LIMITS.promptCharacters){const half=Math.ceil(list.length/2),[a,b]=await Promise.all([send(list.slice(0,half),withTopics,needs,retry),send(list.slice(half),withTopics,needs,retry)]);return new Map([...a,...b]);}
   // One judgement over the cap on its own is not sent: it stays unchecked (then unverified, a comment), and the run continues.
   if(system.length+prompt.length>LIMITS.promptCharacters)return new Map([[list[0].id,{id:list[0].id,verdict:'unchecked',reason:'its cited material is over the prompt cap',needsTopic:null,comment:''}]]);
   const got=(await callSonnet(ctx,{stage:'challenge',system,prompt,validate:r=>validateVerdicts(r,list.map(j=>j.id),{partial:true})})).value;
   // Only the judgements a reply left out are sent again, once; still missing, they stay unchecked.
   const missing=list.filter(j=>!got.has(j.id));
   if(missing.length&&!retry)for(const [k,v]of await send(missing,withTopics,needs,true))got.set(k,v);
   else for(const j of missing)got.set(j.id,{id:j.id,verdict:'unchecked',reason:'the checker returned no verdict for it',needsTopic:null,comment:''});
   return got;};
  const verdicts=await send(judgements,['missing','prerequisites','theory-definition','key-ideas','relocate'].some(k=>judgements.some(j=>j.kind===k)));
  const again=judgements.filter(j=>verdicts.get(j.id)?.verdict==='unchecked');
  if(again.length){const second=await send(again,true,new Map(again.map(j=>[j.id,verdicts.get(j.id)?.needsTopic??null])));for(const j of again){const v=second.get(j.id);verdicts.set(j.id,v.verdict==='unchecked'?{...v,verdict:'unverified'}:v);}}
  return verdicts;
 })();
 // Stage 5b: slot drafting, in parallel with the challenge.
 const blocksNow=()=>new Map(bookletIndex(candidate).map(r=>[r.block.id,r]));
 const typeRequest=(s,extra={})=>{const rows=blocksNow(),info=audit.types.find(t=>t.type===s.type);const same=[...rows.values()].filter(r=>r.routine&&typeOf(state,r.block.id)===s.type);
  const near=id=>id&&rows.get(id)?{id,score:scoreOf(rows.get(id).block)}:null,between=s.neighbours?{harderThan:near(s.neighbours.harderThan),easierThan:near(s.neighbours.easierThan)}:null;
  return {requestId:s.id,exerciseId:s.sectionId,after:s.after,type:s.type,typeDescription:info?.description??null,targetScore:s.target,acceptRange:s.range,...(between&&(between.harderThan||between.easierThan)?{placeBetween:between}:{}),...(s.variant?{variant:s.variant,sameSlotAs:s.baseSlot+'-'+(s.variant==='lower'?'upper':'lower')}:{}),reason:s.reason,workedExamples:(info?.taughtBy??[]).filter(id=>rows.get(id)),existing:same.slice(0,6).map(r=>({id:r.block.id,score:scoreOf(r.block),skill:r.block.classification?.primarySkillId})),laterLessons:laterLessons(candidate,s.sectionId),...extra};};
 // Each question's text is sent once (6 November 2026): pilot 2's eight proposal requests each carried their whole exercise and reached 520,000 characters.
 const draftPrompt=requests=>{const rows=blocksNow(),views={},exercises={};
  const add=id=>{const r=rows.get(id);if(r&&!views[id])views[id]=studentView(r.block);};
  for(const q of requests){(q.workedExamples??[]).forEach(add);(q.existing??[]).forEach(e=>add(e.id));if(q.replacing)add(q.replacing);for(const n of Object.values(q.placeBetween??{}))if(n)add(n.id);if(q.exerciseId&&q.proposal&&!exercises[q.exerciseId]){const sec=candidate.sections.find(x=>x.id===q.exerciseId);if(sec)exercises[q.exerciseId]=(sec.blocks??[]).map(b=>auditView(b,{answers:false}));}}
  return JSON.stringify({styleSheet:styleSheet(candidate,bookletIndex(candidate)),views,exercises,requests});};
 // At most LIMITS.draftsPerCall requests per drafting call (6 November 2026): pilot 2's
 // nine-request proposal reply ran to 38,000 output tokens and came back as broken JSON.
 // An over-cap chunk is halved, like the challenge (7 November 2026: five Area 1 proposals carrying their
 // diagram-heavy exercises reached 384,000 characters and the refusal ended the run after $12 of calls).
 // A single request that still does not fit is blocked, so it becomes a comment without a draft.
 const draftCalls=async(stageName,system,requests,size=LIMITS.draftsPerCall)=>{
  const fits=list=>system.length+draftPrompt(list).length<=LIMITS.promptCharacters;
  const split=list=>{if(list.length<2||fits(list))return [list];const half=Math.ceil(list.length/2);return [...split(list.slice(0,half)),...split(list.slice(half))];};
  const chunks=[];for(let i=0;i<requests.length;i+=size)chunks.push(...split(requests.slice(i,i+size)));
  const over=chunks.filter(list=>!fits(list)).flat();
  const out=await Promise.all(chunks.filter(fits).map(list=>callSonnet(ctx,{stage:stageName,system,prompt:draftPrompt(list),validate:r=>validateDrafts(r,list.map(q=>q.requestId))})));
  return {drafts:out.flatMap(({value,file})=>value.drafts.map(d=>({...d,file}))),blocked:[...out.flatMap(({value})=>value.blocked),...over.map(q=>({requestId:q.requestId,reason:`its drafting material (views and exercise) is over the ${LIMITS.promptCharacters}-character prompt cap`}))]};
 };
 // Two versions per slot (James, 6 November 2026), one aimed just above the lower neighbour and
 // one just below the upper; every version that passes is inserted. All three first drafts in
 // the 6 November Similar Triangles run came out harder than their window.
 const draftRun=stage('5b-drafting',async()=>{
  // Two versions only where a pair narrows a difficulty jump; every other slot gets one, and a failed one is redrafted once (James, 7 November 2026).
  const fill=gaps.slots.filter(s=>!s.untaught&&s.type).flatMap(s=>s.reason==='difficulty-jump'?['lower','upper'].map(variant=>({...s,id:s.id+'-'+variant,baseSlot:s.id,variant})):[{...s,baseSlot:s.id}]);
  if(!fill.length)return [];
  const requests=fill.map(s=>typeRequest(s));
  const value=await draftCalls('draft-slots',draftContract({root}),requests,2*Math.floor((LIMITS.draftsPerCall+1)/2));
  for(const b of value.blocked)report.dropped.push({slot:b.requestId,reason:'blocked by drafter: '+b.reason});
  return value.drafts.map(d=>({...d,slot:fill.find(s=>s.id===d.requestId)}));
 })();
 const [verdicts,slotDrafts]=await Promise.all([challengeRun,draftRun]);
 const verdictOf=j=>verdicts.get(j.id)?.verdict;
 report.challenge=judgements.map(j=>({id:j.id,kind:j.kind,verdict:verdictOf(j),reason:verdicts.get(j.id)?.reason}));
 // Spread slots stand only while their judgement survives.
 const drafts=slotDrafts.filter(d=>{const j=judgements.find(x=>x.id===d.slot.judgement);if(!j)return true;const ok=verdictOf(j)==='confirmed';if(!ok)report.dropped.push({slot:d.slot.id,reason:'spread finding '+verdictOf(j)});return ok;});
 // Stage 5c: proposal drafting, confirmed only.
 const samePart=j=>j.kind==='duplicate'&&j.row.ids[0]===j.row.ids[1];
 // Every approvable finding is drafted now, so applying an approved comment needs no drafting call (6 November 2026).
 for(const j of judgements.filter(samePart)){j.row.replace=j.row.ids[0];j.row.replaceNodes=(j.row.nodes??[]).slice(1);j.repeatedPart=true;}
 // A past exam question is never replaced: the replacement goes to the other question of the pair, and a
 // pair of exam questions (or a repeated part of one) is left alone. Earning Money 2's 2021 HSC question
 // p56-q13 was replaced with a drafted one and lost its title (Stage 5, 9 November 2026).
 for(const id of keepExamQuestions(judgements,new Set(bookletIndex(candidate).filter(r=>r.exam).map(r=>r.block.id)))){
  report.dropped.push({judgement:id,reason:'duplicate of a past exam question: the exam question is kept'});verdicts.set(id,{...(verdicts.get(id)??{}),verdict:'refuted',reason:'exam question kept'});}
 for(const j of judgements.filter(j=>j.kind==='duplicate'&&!j.repeatedPart))j.row.replaceNodes=(j.row.nodes??[]).filter(n=>(ownerOf.get(String(n))??n)===j.row.replace);
 const confirmed=judgements.filter(j=>['confirmed','unverified'].includes(verdictOf(j))&&['duplicate','bridges','missing','prerequisites','extensions','variations'].includes(j.kind));
 const drafted=new Set(confirmed.map(j=>j.id));
 const proposalKind=j=>j.repeatedPart?'duplicate-parts':j.kind==='variations'?'proposal-variation':'proposal-'+j.kind;
 const proposalTarget=j=>j.row.replace||j.row.after||(j.row.neededBy??[])[0]||j.cites.find(Boolean);
 // An unverified comment states the finding and why the check could not settle it (7 November 2026): the
 // stock line alone left the teacher nothing to judge, and an empty checker comment hid the auditor's reason.
 const findingReason=j=>{const r=j.row;return [r.achieves??r.insight??r.prerequisite??r.description??(r.contrast?'A variation sequence that changes '+r.varied+' (keeping '+r.fixed+' fixed) to show '+r.contrast+'.':null),r.reason??r.why].filter(x=>typeof x==='string'&&x.trim()).join(' ');};
 // Verified findings are applied automatically at --apply and still leave their comment for review
 // (James, 8 November 2026). Unverified ones, new teaching and content changes to teacher-protected
 // blocks stay proposals.
 const autoFlag=(pay,on)=>pay?{...pay,autoApply:!!on}:pay;
 const unverifiedNote=v=>' Not confirmed: the independent check could not settle it'+(v?.reason?.trim()?' ('+v.reason.trim().replace(/\.$/,'')+').':'.');
 const proposalLabel=j=>j.repeatedPart?'Repeated part':{duplicate:'Duplicate replacement',missing:'New teaching',prerequisites:'Opening review item',bridges:'Bridge',extensions:'Extension',variations:'Variation'}[j.kind];
 let proposalDrafts=[];
 await stage('5c-proposals',async()=>{
  if(!confirmed.length)return;
  const rows=blocksNow();
  const want={
   duplicate:r=>'A replacement for '+(r.replaceNodes??[]).join(', ')+' only (the repeated item in '+r.replace+'), written as a question with no parts that is the new item. Same type and difficulty, a different function or numbers, and not a repeat of anything in "exercise".',
   prerequisites:r=>'One short retrieval question for the topic\'s opening review on exactly this prerequisite: '+r.prerequisite+'. Not a worked example and not a question on the topic\'s new method.',
   bridges:r=>'One scaffolded bridging question to go after '+r.after+' that achieves: '+r.achieves+'.',
   extensions:r=>'One extension question to go after '+r.after+' whose parts lead students to this insight: '+r.insight+'.',
   variations:r=>'One variation-sequence question to go after '+r.after+', whose parts (3 to 5, short, laid out like the booklet\'s other short parts) are the steps: start from a question like '+r.after+', then change only '+r.varied+' from one part to the next, keeping '+r.fixed+' the same, so students see this contrast: '+r.contrast+'. Each part must change exactly that one feature from the part before. No parts that explain or reflect.',
   missing:r=>'A worked example for the untaught type '+r.type+' ('+r.description+'), then one guided-practice question of the same type with 2 to 4 parts that vary the example\'s features.'};
  const requests=confirmed.map(j=>{const r=j.row,first=r.replace??r.after??(r.neededBy??[])[0],slot={id:j.id,sectionId:r.exerciseId??rows.get(ownerOf.get(String(first))??first)?.section.id??null,type:r.type??r.replacementType,target:r.targetScore??null,range:null,after:r.after??r.replace??null,reason:j.kind};
   const section=candidate.sections.find(x=>x.id===slot.sectionId);
   return typeRequest(slot,{proposal:j.kind,want:want[j.kind](r),finding:r,...(r.replace&&rows.get(r.replace)?{replacing:r.replace}:{}),...(section?{exerciseId:section.id}:{})});});
  const value=await draftCalls('draft-proposals',proposalContract({root}),requests);
  proposalDrafts=value.drafts.map(d=>({...d,judgement:confirmed.find(j=>j.id===d.requestId)}));
  for(const b of value.blocked){report.dropped.push({proposal:b.requestId,reason:'blocked by drafter: '+b.reason});const j=confirmed.find(x=>x.id===b.requestId);if(j)addComment({targetId:proposalTarget(j),kind:proposalKind(j),key:'prop|'+j.id,note:`[Pedagogy audit v2 · ${proposalLabel(j)}] ${verdicts.get(j.id)?.comment??j.row.reason??''}\nNo drafted question is attached: the drafter could not write one (${String(b.reason).slice(0,200)}).`});}
 })();
 // Stage 6: blind solve, writing rules and placement; redraft once on failure.
 const accepted=[];const corrections=[];
 await stage('6-solve',async()=>{
  const rows=blocksNow();
  const refIds=new Set();
  const solveItems=[];
  const existingNow=()=>bookletIndex(candidate).filter(r=>r.question).map(r=>r.block);
  const ladder=(sectionId,topicId,include=[])=>{const l=ladderFor(candidate,{sectionId,topicId,include});l.forEach(id=>refIds.add(id));return [...l,...anchors.map(a=>a.ref)];};
  for(const d of drafts)solveItems.push({id:d.slot.id,kind:'new',draft:d,task:stripAnswers(d.content),ladder:ladder(d.slot.sectionId,candidate.sections.find(s=>s.id===d.slot.sectionId)?.topicId,Object.values(d.slot.neighbours??{}).filter(Boolean))});
  for(const d of proposalDrafts){const c=d.content??d.workedExample?.guidedPractice;if(!c)continue;solveItems.push({id:d.requestId,kind:'new',proposal:true,intent:d.judgement?.row?.prerequisite??d.judgement?.row?.insight??(d.judgement?.row?.contrast?'a variation sequence changing only '+d.judgement.row.varied+' at each step, to show '+d.judgement.row.contrast:null)??d.judgement?.row?.achieves??d.judgement?.row?.description??d.judgement?.row?.replacementType??null,draft:d,task:stripAnswers(c),...(d.workedExample?{workedExample:{prompt:d.workedExample.prompt,questionDiagrams:d.workedExample.questionDiagrams??[],solutionDiagrams:d.workedExample.solutionDiagrams??[]}}:{})});}
  for(const [i,e] of audit.errors.entries()){const r=rows.get(e.blockId);if(!r)continue;const node=nodesOf(r.block).find(n=>n.id===e.nodeId)??(r.block.content?.id===e.nodeId?r.block.content:null);
   if(!node||typeof fieldGet(node,e.field)!=='string'){addComment({targetId:e.blockId,kind:'error-unapplied',key:'err|'+e.blockId+'|'+e.nodeId,note:`[Pedagogy audit v2 · Possible error, not checked automatically] ${e.wrong} Proposed correction: ${e.correction}`});continue;}
   if(e.field==='prompt'){addComment({targetId:e.blockId,kind:'error-wording',key:'err|'+e.blockId+'|'+e.nodeId,payload:typeof node.prompt==='string'?{op:'set-field',blockId:e.blockId,nodeId:e.nodeId,field:'prompt',value:e.correction}:null,note:`[Pedagogy audit v2 · Question wording error] ${e.wrong} Proposed wording: ${e.correction}`});continue;}
   const id='e'+(i+1),view=r.block.type==='question'?stripAnswers(r.block.content):studentView(r.block,{answers:false});
   const corrected=structuredClone(r.block);fieldSet(nodesOf(corrected).find(n=>n.id===e.nodeId)??corrected.content,e.field,e.correction);
   solveItems.push({id,kind:'claim',claim:e,block:r.block,corrected,task:view,targetNode:e.nodeId,ladder:r.question?ladder(r.section.id,r.section.topicId):null});
  }
  if(!solveItems.length)return;
  const blocks=new Map(bookletIndex(candidate).map(r=>[r.block.id,r.block])),refs=new Map([...anchors.map(a=>[a.ref,a.score]),...[...refIds].map(id=>[id,scoreOf(blocks.get(id))])]);
  const system=solveContract({root})+'\n\nStanding anchors:\n'+anchors.map(a=>JSON.stringify(a)).join('\n');
  // Whole references while the batch fits (unchanged prompts keep earlier replies reusable); a split batch takes only its own ladders.
  const solvePrompt=(items,trim)=>{const used=new Set(items.flatMap(it=>it.ladder??[]));return JSON.stringify({references:[...refIds].filter(id=>!trim||used.has(id)).map(id=>({ref:id,score:scoreOf(blocks.get(id)),task:auditView(blocks.get(id))})),items:items.map(it=>({id:it.id,...(it.kind==='new'?{new:true}:{}),...(it.intent?{intent:it.intent}:{}),question:it.task,...(it.workedExample?{workedExample:auditView({id:it.id+'-example',type:'question',content:{id:it.id+'-example',type:'question',prompt:it.workedExample.prompt,questionDiagrams:it.workedExample.questionDiagrams??[]}},{answers:false}),...((it.workedExample.solutionDiagrams??[]).length?{solutionFigure:auditView({id:it.id+'-example-solution',type:'question',content:{id:it.id+'-example-solution',type:'question',prompt:'Finished drawing shown in the worked solution.',questionDiagrams:it.workedExample.solutionDiagrams}},{answers:false})}:{})}:{}),...(it.targetNode?{answerNode:it.targetNode}:{}),...(it.ladder?{ladder:it.ladder}:{})}))});};
  const solve=async items=>{const whole=system.length+solvePrompt(items,false).length<=LIMITS.promptCharacters;
   const parts=await splitByCap(items,list=>system.length+solvePrompt(list,!whole).length,async list=>(await callSonnet(ctx,{stage:'solve',system,prompt:solvePrompt(list,!whole),validate:r=>validateSolve(r,list)})).value);
   const got=parts.filter(p=>p.value).map(p=>p.value);
   return {solutions:mergeMaps(got.map(v=>v.solutions)),placements:mergeMaps(got.map(v=>v.placements)),rules:mergeMaps(got.map(v=>v.rules)),intent:mergeMaps(got.map(v=>v.intent)),workedExample:mergeMaps(got.map(v=>v.workedExample)),over:new Set(parts.filter(p=>p.over).flatMap(p=>p.items.map(i=>i.id)))};};
  let round=solveItems,attempt=1;
  while(round.length){
   const out=await solve(round),redo=[];
   // An item over the cap on its own is never solved blind, so it is not inserted, corrected or redrafted.
   for(const it of round.filter(i=>out.over.has(i.id))){if(it.kind==='claim')addComment({targetId:it.claim.blockId,kind:'error-unresolved',key:'err|'+it.claim.blockId+'|'+it.claim.nodeId,note:`[Pedagogy audit v2 · Unresolved possible error] ${it.claim.wrong}\nProposed: ${it.claim.correction}\nNot checked: the question is too long to solve blind within the prompt cap.`});else report.dropped.push({slot:it.id,reason:'its question and ladder are over the prompt cap, so it could not be solved blind; not inserted'});}
   round=round.filter(i=>!out.over.has(i.id));
   const pairs=[];
   for(const it of round){const sol=out.solutions.get(it.id),answers=new Map((sol?.answers??[]).map(a=>[String(a.nodeId),a.answer]));
    if(it.kind==='new'){const c=it.draft.content??it.draft.workedExample?.guidedPractice;answerNodes(c).forEach((n,k)=>pairs.push({id:it.id+'#'+k,item:it,a:answers.get(String(n.id))??[...answers.values()][k]??'',b:n.answer.short||n.answer.worked}));}
    else{const node=nodesOf(it.block).find(n=>n.id===it.targetNode)??it.block.content;const solved=answers.get(String(it.targetNode))??[...answers.values()].at(-1)??'';pairs.push({id:it.id+'#new',item:it,a:solved,b:it.claim.field==='short'?it.claim.correction:it.claim.correction.split('\\\\').at(-1)},{id:it.id+'#old',item:it,a:solved,b:it.claim.field==='short'?fieldGet(node,'short'):String(fieldGet(node,it.claim.field)??'').split('\\\\').at(-1)});}}
   const eq=await compareAnswers(ctx,pairs);
   for(const it of round){
    const mine=pairs.filter(p=>p.item===it),ok=mine.length&&mine.every(p=>eq.get(p.id)?.equivalent);
    if(it.kind==='claim'){const yes=eq.get(it.id+'#new')?.equivalent,no=eq.get(it.id+'#old')?.equivalent;
     if(yes&&!no){const p=out.placements.get(it.id);corrections.push({...it,placement:p,solveFile:ctx.calls.at(-1)?.id});}
     else if(no&&!yes)report.dropped.push({claim:it.claim.blockId,reason:'blind solve agrees with the booklet'});
     else addComment({targetId:it.claim.blockId,kind:'error-unresolved',key:'err|'+it.claim.blockId+'|'+it.claim.nodeId,note:`[Pedagogy audit v2 · Unresolved possible error] ${it.claim.wrong}\nBooklet: ${fieldGet(nodesOf(it.block).find(n=>n.id===it.targetNode)??it.block.content,it.claim.field)}\nProposed: ${it.claim.correction}\nIndependent solve: ${mine[0]?.a}`});
     continue;}
    // Completeness is the script's check: every answered node has a short and a worked answer.
    const drafted=it.draft.content??it.draft.workedExample?.guidedPractice,incomplete=!drafted||!answerNodes(drafted).length||answerNodes(drafted).some(n=>!n.answer.short||!n.answer.worked);
    const offIntent=it.intent&&out.intent?.get(it.id)===false;
    // A new worked example is solved from its own question and figure (James, 8 November 2026: worked
    // examples drafted without the figure their question needs recurred in Data Visualisation 1-2 and
    // Introduction to Algebra). One asking students to draw cannot show the drawing in its working.
    const weMissing=it.draft.workedExample?out.workedExample?.get(it.id)??(!(it.draft.workedExample.questionDiagrams??[]).length&&!(it.draft.workedExample.solutionDiagrams??[]).length&&/\b(draw|sketch|construct|plot)\b/i.test(String(it.draft.workedExample.prompt??''))?'its answer is a drawing, which the worked solution cannot show':null):null;
    const breaks=[...(out.rules.get(it.id)??[]).filter(rule=>!/^\W*Complete questions/i.test(rule)),...(incomplete?['Complete questions: a short or worked answer is missing']:[]),...(offIntent?['the question does not do what the proposal asks: '+it.intent]:[]),...(weMissing?['the worked example cannot be solved from its own question and figure ('+weMissing+'): give the figure it refers to, or choose an example whose working can be written out']:[])];
    // Placement and duplicate checks before acceptance, so a miss gets the one redraft (6 November 2026).
    const placement=out.placements.get(it.id),slot=!it.proposal?it.draft.slot:null;
    const d=placement&&slot?.range?deriveComparisonScore(placement,refs):null;
    const missed=d?.score!=null&&(d.score<slot.range[0]||d.score>slot.range[1])?`was placed at ${d.score} (between ${placement.harderThan??'—'} and ${placement.easierThan??'—'}: ${placement.difficultyReason}); it must land within ${slot.range.join('–')}${slot.neighbours?.harderThan||slot.neighbours?.easierThan?`, harder than ${slot.neighbours.harderThan??'—'} and easier than ${slot.neighbours.easierThan??'—'}`:''}, so make it ${d.score<slot.range[0]?'more demanding':'less demanding'}`:null;
    const dup=drafted&&duplicatePairs([...existingNow(),{id:'draft-'+it.id,type:'question',content:drafted}]).find(p=>p.ids.includes('draft-'+it.id));
    const repeats=dup?`repeats ${dup.ids.find(x=>x!=='draft-'+it.id)}: change the question itself (situation, figure and numbers), not only its wording`:null;
    if(ok&&!breaks.length&&!(attempt===1&&(missed||repeats))){accepted.push({...it,placement});continue;}
    if(attempt===1)redo.push({it,why:!ok?'its answer did not survive an independent solve':breaks.length?'breaks writing rules: '+breaks.join('; '):[missed,repeats].filter(Boolean).join('; ')});
    else{const reason=ok?'writing rules: '+breaks.join('; '):'answer mismatch after redraft';report.dropped.push({slot:it.id,reason});
     // A confirmed teaching finding still reaches James, without the draft that failed.
     const j=it.draft.judgement;if(it.proposal&&j){addComment({targetId:proposalTarget(j),kind:proposalKind(j),key:'prop|'+j.id,note:`[Pedagogy audit v2 · ${proposalLabel(j)}] ${verdicts.get(j.id)?.comment??j.row.reason??j.row.why??''}\nNo drafted question is attached: the draft did not pass the independent checks (${reason.slice(0,200)}).`});}}
   }
   // A version whose other version for the same slot passed is not redrafted, unless that one
   // landed in the top third of the window (James, 6 November 2026): then this one is redrafted
   // to land at least 6 points below it, so the slot actually narrows its jump.
   for(const r of redo.slice()){const s=r.it.draft.slot,sib=s?.variant&&accepted.find(a=>a.draft.slot?.baseSlot===s.baseSlot);if(!sib)continue;
    const [lo,hi]=s.range,sc=sib.placement?deriveComparisonScore(sib.placement,refs).score:null,top=sc!=null&&sc>lo+(hi-lo)*2/3&&sc-LIMITS.floor>=lo;
    if(top){r.it.draft.slot={...s,variant:'lower',range:[lo,sc-LIMITS.floor]};r.why+=`; the other version for this slot landed at ${sc}, in the top third of ${lo}–${hi}, so this one must land within ${lo}–${sc-LIMITS.floor}, only a little harder than ${s.neighbours?.harderThan??'the easier neighbour'}`;(report.redraftLower??=[]).push({slot:s.id,sibling:sib.draft.slot.id,siblingScore:sc,range:[lo,sc-LIMITS.floor]});continue;}
    redo.splice(redo.indexOf(r),1);report.dropped.push({slot:s.id,reason:'the other version filled the slot; this one '+r.why});}
   if(!redo.length||attempt===2)break;
   // Redraft once, then solve once more.
   const requests=redo.map(({it,why})=>({...(it.proposal?{proposal:it.draft.judgement?.kind}:{}),...typeRequest(it.draft.slot??{id:it.id,sectionId:it.draft.judgement?.row?.exerciseId,type:it.draft.judgement?.row?.type,target:it.draft.judgement?.row?.targetScore,range:null,after:it.draft.judgement?.row?.after,reason:'proposal'}),redraft:'Write a fresh question for this request; the previous draft '+why+'.'}));
   const value=await draftCalls('redraft',redo.some(r=>r.it.proposal)?proposalContract({root}):draftContract({root}),requests);
   round=value.drafts.map(d=>{const old=redo.find(r=>r.it.id===d.requestId).it;const draft={...old.draft,...d};return {...old,draft,task:stripAnswers(d.content??d.workedExample?.guidedPractice)};});
   attempt++;
  }
 })();
 // Stage 6 script checks, then insertion.
 const refScores=new Map([...anchors.map(a=>[a.ref,a.score]),...bookletIndex(candidate).filter(r=>r.question).map(r=>[r.block.id,scoreOf(r.block)])]);
 const solveFile=ctx.calls.filter(c=>c.stage==='solve'&&c.ok).at(-1);const evidence=solveFile?rel(path.join(workDir,'calls',solveFile.id+'.json')):null;
 const existingQuestions=bookletIndex(candidate).filter(r=>r.question).map(r=>r.block),inserted=[];
 for(const it of accepted){
  const proposal=it.proposal,slot=it.draft.slot;
  const d=it.placement?deriveComparisonScore(it.placement,refScores):{score:null,how:'none'};
  const temp=newBlock(it.draft.workedExample?{...it.draft,content:it.draft.workedExample.guidedPractice}:it.draft,slot??{id:it.id+'-'+stamp.slice(-6),sectionId:it.draft.judgement?.row?.exerciseId},{project:candidate,score:null,placement:it.placement,refs:refScores,evidence,type:slot?.type??it.draft.judgement?.row?.type??it.draft.judgement?.row?.replacementType??null,kind:proposal?it.draft.judgement.kind:'slot',skill:it.draft.skill,typeOfId:id=>typeOf(state,id)});
  if(duplicatePairs([...existingQuestions,...inserted,temp]).some(p=>p.ids.includes(temp.id))){report.dropped.push({slot:it.id,reason:'duplicates an existing or new question'});continue;}
  const describe=()=>{const c=temp.content,parts=(c.children??[]).map(p=>`${p.label??''}) ${partText(p)}`);return `Proposed question: ${c.prompt??''}${parts.length?'\n'+parts.join('\n'):''}${(c.questionDiagrams??[]).length?'\n(with a diagram)':''}\nAnswers: ${answerNodes(c).map(n=>(n.label&&n!==c?n.label+') ':'')+n.answer.short).join('; ')}`;};
  if(proposal){const j=it.draft.judgement,c=verdicts.get(j.id);if(d.score!=null)setComparisonRating(temp,d.score,it.placement,refScores,evidence);addComment({targetId:proposalTarget(j),kind:proposalKind(j),key:'prop|'+j.id,payload:autoFlag(proposalPayload(j,temp,{rows:bookletIndex(candidate),ownerOf,workedExample:it.draft.workedExample,project:candidate}),verdictOf(j)==='confirmed'&&!(j.kind==='duplicate'&&state.protectedIds.has(j.row.replace))),note:`[Pedagogy audit v2 · ${proposalLabel(j)}${verdictOf(j)==='unverified'?' · unverified':''}] ${c?.comment||findingReason(j)}${verdictOf(j)==='unverified'?unverifiedNote(c):''}${j.kind==='duplicate'?` Replace ${(j.row.replaceNodes??[]).join(', ')} with the question below.`:''}\n${it.draft.workedExample?'Worked example: '+it.draft.workedExample.prompt+'\n'+it.draft.workedExample.steps+'\nGuided practice:\n':''}${describe()}${d.score!=null?`\nComparison score: ${d.score}.`:''}`});continue;}
  if(d.score==null){report.blockers.push({stage:'solve',id:it.id,reason:'placement '+d.how});continue;}
  if(d.score<slot.range[0]||d.score>slot.range[1]){report.dropped.push({slot:slot.id,reason:`scored ${d.score}, outside the slot range ${slot.range.join('–')}`,draft:stripAnswers(temp.content)});continue;}
  if(slot.commentOnly||d.score>=LIMITS.appliedBelow){const held=newBlock(it.draft,{...slot,id:slot.id+'-'+stamp.slice(-6)},{project:candidate,score:d.score,placement:it.placement,refs:refScores,evidence,type:slot.type,skill:it.draft.skill,typeOfId:id=>typeOf(state,id)});addComment({targetId:slot.after??slot.before??candidate.sections.find(s=>s.id===slot.sectionId)?.blocks?.[0]?.id,kind:'slot-comment-only',key:'slot|'+slot.id,payload:{op:'insert',sectionId:slot.sectionId,after:slot.after??null,block:held},note:`[Pedagogy audit v2 · New question to decide] For the ${slot.reason.replace(/-/g,' ')} gap (${slot.type}). Comparison score ${d.score}, between ${it.placement.harderThan??'—'} and ${it.placement.easierThan??'—'}: ${it.placement.difficultyReason}\n${describe()}`});continue;}
  const block=newBlock(it.draft,slot,{project:candidate,score:d.score,placement:it.placement,refs:refScores,evidence,type:slot.type,skill:it.draft.skill,typeOfId:id=>typeOf(state,id)});
  state.types.set(block.id,{type:slot.type,current:true,source:'audit-v2'});
  const section=candidate.sections.find(s=>s.id===slot.sectionId),at=section.blocks.findIndex(b=>b.id===slot.after);
  section.blocks.splice(at<0?section.blocks.length:at+1,0,block);inserted.push(block);
  (report.applied.newQuestions??=[]).push({id:block.id,slot:slot.id,reason:slot.reason,type:slot.type,score:d.score,range:slot.range});
 }
 // Solved corrections.
 const blockMap=()=>new Map(candidate.sections.flatMap(s=>(s.blocks??[]).map(b=>[b.id,b])));
 for(const c of corrections){
  const live=blockMap().get(c.claim.blockId);if(!live)continue;
  if(state.protectedIds.has(live.id)){addComment({targetId:live.id,kind:'error-protected',key:'err|'+live.id+'|'+c.claim.nodeId,payload:{op:'set-field',blockId:live.id,nodeId:c.claim.nodeId,field:c.claim.field,value:c.claim.correction},note:`[Pedagogy audit v2 · Error confirmed by an independent solve] ${c.claim.wrong} Correction: ${c.claim.correction}`});continue;}
  const node=nodesOf(live).find(n=>n.id===c.claim.nodeId)??live.content,old=fieldGet(node,c.claim.field);fieldSet(node,c.claim.field,c.claim.correction);
  (report.applied.corrections??=[]).push({id:live.id,nodeId:c.claim.nodeId,field:c.claim.field,old,new:c.claim.correction,reason:c.claim.wrong});
  if(live.type==='question'&&verifiedRating(c.block)){const d=c.placement?deriveComparisonScore(c.placement,refScores):{score:null};
   if(d.score!=null&&d.score<LIMITS.appliedBelow)setComparisonRating(live,d.score,c.placement,refScores,evidence);
   else if(d.score!=null){state.pendingHigh.add(live.id);const rated=structuredClone(live);setComparisonRating(rated,d.score,c.placement,refScores,evidence);addComment({targetId:live.id,kind:'rating-60-plus',key:'rate|'+live.id,payload:{op:'rating',blockId:live.id,classification:rated.classification},note:`[Pedagogy audit v2 · Rating to decide] After the correction this question places at ${d.score}; 60 or more is not applied automatically. ${c.placement.difficultyReason}`});}}
 }
 // Bold, from theory findings.
 for(const t of audit.theory.filter(t=>t.verdict==='bold')){
  const b=blockMap().get(t.id);if(!b)continue;
  if(state.protectedIds.has(b.id)){addComment({targetId:b.id,kind:'bold',key:'bold|'+b.id,payload:{op:'bold',blockId:b.id,terms:t.terms??[]},note:`[Pedagogy audit v2 · Bold key vocabulary] Bold where first defined: ${(t.terms??[]).join(', ')}.`});continue;}
  let next=b;const done=[];for(const term of t.terms??[]){const r=boldTerm(next,term);if(r){next=r;done.push(term);}}
  if(done.length){for(const s of candidate.sections)s.blocks=s.blocks.map(x=>x.id===b.id?next:x);(report.applied.bold??=[]).push({id:b.id,terms:done});}
 }
 // Confirmed theory rewrites and other teaching findings become comments; unverified ones say so.
 for(const j of judgements){const v=verdictOf(j),c=verdicts.get(j.id);
  if(j.kind.startsWith('theory-')&&(v==='confirmed'||v==='unverified'))addComment({targetId:j.row.id,kind:j.kind,key:'theory|'+j.row.id,payload:autoFlag({op:'theory',blockId:j.row.id,...(j.row.nodeId?{nodeId:j.row.nodeId}:{}),replacement:j.row.replacement},v==='confirmed'&&!state.protectedIds.has(j.row.id)),note:`[Pedagogy audit v2 · ${j.kind==='theory-definition'?'Definition':'Wording'}${v==='unverified'?' · unverified':''}] ${c?.comment||j.row.reason||''}${v==='unverified'?unverifiedNote(c):''}\nReplacement text: ${j.row.replacement}`});
  else if(j.kind==='key-ideas'&&(v==='confirmed'||v==='unverified')){const l=keyIdeasLessons(candidate).get(j.row.topicId);if(!l)continue;
   const block=keyIdeasBlock(candidate,j.row.topicId,j.row.items,{stamp:stamp.slice(-6)});
   addComment({targetId:l.after,kind:'key-ideas',key:'keyideas|'+j.row.topicId,payload:autoFlag({op:'insert',sectionId:l.sectionId,after:l.after,block},v==='confirmed'),note:`[Pedagogy audit v2 · Key ideas${v==='unverified'?' · unverified':''}] ${c?.comment||j.row.reason||''}${v==='unverified'?unverifiedNote(c):''}\nKey ideas: ${j.row.items.map((t,i)=>(i+1)+'. '+t).join(' ')}`});}
  else if(v==='unverified'&&!j.kind.startsWith('theory-')&&!drafted.has(j.id))addComment({targetId:j.cites.find(Boolean),kind:'unverified-'+j.kind,key:'unv|'+j.id,note:`[Pedagogy audit v2 · ${{bridges:'Bridge',missing:'New teaching',prerequisites:'Opening review item',extensions:'Extension',variations:'Variation',duplicate:'Duplicate',spread:'Near-copies',relocate:'Move to a later lesson'}[j.kind]??j.kind} · unverified] ${findingReason(j)}${j.row.after?' (after '+j.row.after+')':''}${(j.row.ids??[]).length?' Items: '+j.row.ids.join(', ')+'.':''}${unverifiedNote(verdicts.get(j.id))}`});
 }
 // Confirmed relocations (James, 9 November 2026): a question set before the lesson that teaches what it
 // needs moves to that lesson's exercise, where the final sort places it. Polynomials 1A added a worked
 // example on repeated roots to the graphs lesson, when the next lesson teaches multiplicity.
 for(const j of judgements.filter(j=>j.kind==='relocate'&&verdictOf(j)==='confirmed')){
  const target=candidate.sections.find(s=>s.topicId===j.row.toTopicId&&s.phase==='practice'&&s.role!=='challenge'&&bookletIndex({...candidate,sections:[s]})[0]?.kind==='exercise');
  if(!target){addComment({targetId:j.row.ids[0],kind:'relocate',key:'relocate|'+j.id,note:`[Pedagogy audit v2 · Move to a later lesson] ${verdicts.get(j.id)?.comment||j.row.reason||''}\nNot applied automatically: the lesson ${j.row.toTopicId} has no exercise.`});continue;}
  const moved=[];
  for(const id of j.row.ids){const from=candidate.sections.find(s=>(s.blocks??[]).some(b=>b.id===id));
   if(!from||from===target||from.role==='challenge'||from.role==='exam'||!bookletIndex({...candidate,sections:[from]}).some(r=>r.block.id===id&&r.routine))continue;
   const i=from.blocks.findIndex(b=>b.id===id);target.blocks.push(from.blocks.splice(i,1)[0]);moved.push({id,from:from.id});}
  if(!moved.length)continue;
  (report.applied.relocated??=[]).push({judgement:j.id,to:target.id,ids:moved.map(m=>m.id),reason:j.row.reason});
  addComment({targetId:moved[0].id,kind:'relocate',key:'relocate|'+j.id,applied:true,note:`[Pedagogy audit v2 · Applied automatically · Moved to a later lesson] ${verdicts.get(j.id)?.comment||j.row.reason||''}\nMoved to ${target.title??target.id}: ${moved.map(m=>m.id).join(', ')}.`});
 }
 // The depletion guard was removed on 6 November 2026 (James): Challenge questions are meant to
 // be unfamiliar, so moves always go through. A routine type left below the minimum is a
 // count gap like any other; a type that only exists at Challenge level has no minimum.
 const ch=candidate.sections.find(s=>s.role==='challenge'&&s.id===candidate.id+'-challenge');if(ch&&!ch.blocks.length){candidate.sections=candidate.sections.filter(s=>s!==ch);candidate.topics=(candidate.topics??[]).filter(t=>t.id!=='challenge'||candidate.sections.some(s=>s.topicId==='challenge'));}
 // Final order and gap checks.
 ordered=orderCandidate(candidate,{keep:audit.keep,deliberate,progressions:state.progressions,original:project});candidate=ordered.project;
 // Challenge sorted by the exercise rules even when a reference elsewhere holds the booklet (James, 9 November 2026).
 {const ch=sortChallengeSections(candidate,{keep:audit.keep,deliberate,progressions:state.progressions,original:project});candidate=ch.project;report.challengeOrder=ch.report;
  const sortedIds=new Set(ch.report.filter(r=>r.status==='sorted').flatMap(r=>r.ids));ordered={...ordered,plan:{...ordered.plan,sections:ordered.plan.sections.map(s=>s.role!=='challenge'?s:{...s,segments:s.segments.map(g=>g.originalIds.some(id=>sortedIds.has(id))?{...g,status:'sorted',holds:[]}:g)})}};}
 for(const c of holdComments(ordered.plan,candidate))addComment(c);
 // Changes applied automatically get comments too, so every change can be reviewed in Studio
 // (James, 8 November 2026): one summary per exercise for new questions, Challenge moves, bolding
 // and spelling, and one comment per corrected block. They carry no payload and apply-comments skips them.
 {const where=new Map(candidate.sections.flatMap(s=>(s.blocks??[]).map(b=>[b.id,s]))),bySection=new Map();
  const push=(id,line)=>{const s=where.get(id);if(!s)return;if(!bySection.has(s))bySection.set(s,[]);bySection.get(s).push(line);};
  for(const q of report.applied.newQuestions??[])push(q.id,`- New question ${q.id} (${q.type}, comparison score ${q.score}${q.range?`, window ${q.range.join('–')}`:''}) for a ${String(q.reason??'').replace(/-/g,' ')} gap.`);
  for(const m of report.moves??[])push(m.ids[0],`- Moved here to Challenge: ${m.ids.join(', ')} (rated ${m.score}).`);
  for(const b of report.applied.bold??[])push(b.id,`- Bolded in ${b.id}: ${b.terms.join(', ')}.`);
  for(const s of report.applied.spelling??[])push(s.id,`- Australian spelling in ${s.id}: ${s.changes.join(', ')}.`);
  for(const [s,lines]of bySection){const first=(s.blocks??[]).find(b=>b.type==='question')??s.blocks?.[0];if(first)addComment({targetId:first.id,kind:'applied-summary',key:'applied|'+s.id,applied:true,note:`[Pedagogy audit v2 · Applied automatically] ${s.title??s.id}\n${lines.join('\n')}`});}
  for(const c of report.applied.corrections??[])addComment({targetId:c.id,kind:'applied-correction',key:'applied-err|'+c.id+'|'+c.nodeId,applied:true,note:`[Pedagogy audit v2 · Applied automatically · Error corrected after an independent solve agreed] ${c.reason}\n${c.field} of ${c.nodeId} was: ${c.old}\nNow: ${c.new}`});}
 const finalGaps=gapPlan(candidate,state,{audit});
 report.remaining={deficits:finalGaps.deficits,jumpsOver15:finalGaps.gaps,slotsStillOpen:finalGaps.slots.length};
 report.slots=gaps.slots;report.exempt=finalGaps.exempt;report.capped=gaps.capped;
 // One comment per exercise: core types still short of the minimum, and the one-offs it exempted, so
 // nothing the rule leaves alone is silent (James, 7 November 2026).
 for(const section of candidate.sections??[]){
  const short=finalGaps.deficits.filter(d=>d.sectionId===section.id),ex=finalGaps.exempt.filter(e=>e.sectionId===section.id),cap=new Set(gaps.capped.filter(c=>c.sectionId===section.id).map(c=>c.type));
  const merged=(audit.typeGroups??[]).filter(g=>g.types.some(t=>(section.blocks??[]).some(b=>typeOf(state,b.id)===t)));
  if(!short.length&&!ex.length&&!merged.length)continue;
  const first=(section.blocks??[]).find(b=>b.type==='question')??section.blocks?.[0];if(!first)continue;
  const lines=[...(short.length?[`Core question types with fewer than ${LIMITS.minimumItems} practice items in this topic after this run (each part a student answers on its own counts, up to 3 per question):`,...short.map(d=>`- ${d.type}: ${d.items}${d.taught===false?' (not taught in the booklet)':''}${cap.has(d.type)?` (over this run's limit of ${LIMITS.countSlotsPerExercise} new count questions per exercise)`:''}`)]:[]),...(ex.length?['Left as one-off (enrichment) questions, with no minimum: '+ex.map(e=>`${e.type} (${e.items})`).join(', ')+'. Say if any of these should be practised more.']:[]),...(merged.length?['Counted together as one skill (the same method): '+merged.map(g=>g.types.join(' + ')+(g.method?' ('+g.method+')':'')).join('; ')+'. Say if any of these should be counted apart.']:[])];
  addComment({targetId:first.id,kind:'type-gaps',key:'gaps|'+section.id,note:`[Pedagogy audit v2 · Practice counts]\n${lines.join('\n')}`});
 }
 // Comments, merged with an open comment of the same kind on the same block; v1 comments withdrawn.
 const {createFeedback}=await import('../src/lib/booklet-feedback.js');
 const owners=new Map(candidate.sections.flatMap(s=>(s.blocks??[]).flatMap(b=>nodesOf(b).map(n=>[n.id,b.id]))));
 // Earlier audit comments are superseded where this run looked again (James, 8 November 2026):
 // v1 comments always; an open v2 comment when this run re-checked what it is about (a theory
 // or error comment: that passage or question was stale; a duplicate comment: its question;
 // any other: its block is in a topic this run sent). "Applied automatically" comments are kept
 // for review, and James's own comments (no audit kind) are never touched. Withdrawn comments
 // are archived with the run record.
 const sentSeq=new Set(auditPackets(state,structuredClone(project),{root}).flatMap(p=>p.topics));
 const sentBlocks=new Set(sequences(project).filter(q=>sentSeq.has(q.id)).flatMap(q=>q.sections.flatMap(x=>(project.sections.find(y=>y.id===x.id)?.blocks??x.blocks??[]).map(b=>b.id))));
 if(sentSeq.has('exam-and-challenge'))for(const r of state.rows)if(r.exam||r.section.role==='challenge')sentBlocks.add(r.block.id);
 const rechecked=f=>{const k=String(f.findingKind??'').replace(/^unverified-/,''),t=f.targetId;
  if(k.startsWith('theory-'))return state.stale.theory.includes(t);
  if(k.startsWith('error-'))return state.stale.error.includes(t);
  if(/duplicate/.test(k))return state.stale.duplicate.includes(t);
  if(topUp&&k==='type-gaps')return true;
  return sentBlocks.has(t);};
 const superseded=(candidate.studio?.flags??[]).filter(f=>f.kind===COMMENT_KIND&&!f.resolved&&!f.autoApplied&&rechecked(f));
 const withdrawn=[...state.v1Comments,...superseded].map(f=>f.id);
 report.supersededV2=superseded.map(f=>({id:f.id,kind:f.kind,findingKind:f.findingKind,targetId:f.targetId,note:f.note}));
 candidate.studio={version:1,...candidate.studio,flags:(candidate.studio?.flags??[]).filter(f=>!withdrawn.includes(f.id))};
 for(const c of comments){
  const rootId=owners.has(c.targetId)?owners.get(c.targetId):candidate.sections.flatMap(s=>s.blocks??[]).find(b=>b.id===c.targetId)?.id;if(!rootId){report.blockers.push({stage:'comments',reason:'no target for comment '+c.key});continue;}
  const open=candidate.studio.flags.find(f=>f.kind===COMMENT_KIND&&!f.resolved&&f.targetId===rootId&&f.findingKind===c.kind);
  let flag=open;
  if(open)open.note+='\n\n'+c.note;
  else{flag={...createFeedback(candidate,{rootId,edition:'student'},c.note,'local'),kind:COMMENT_KIND,findingKind:c.kind,findingKey:c.key,...(c.applied?{autoApplied:{at:now(),what:'applied in the audit run'}}:{})};candidate.studio.flags.push(flag);}
  if(c.payload){const target=candidate.sections.flatMap(s=>s.blocks??[]).find(b=>b.id===(c.payload.blockId??rootId));(report.proposals??={})[flag.id]??={kind:c.kind,payloads:[]};report.proposals[flag.id].payloads.push({...c.payload,key:c.key,targetFingerprint:target?contentFingerprint(target):null});}
 }
 report.comments=comments.map(c=>({target:c.targetId,kind:c.kind}));
 report.withdrawnV1=state.v1Comments.map(f=>({id:f.id,kind:f.kind,targetId:f.targetId,note:f.note}));
 // Fingerprints now checked, per check, recorded only against content each check ran on.
 const checks={},finalRows=bookletIndex(candidate),corrected=new Map((report.applied.corrections??[]).map(c=>[c.id,c]));
 const sentAudit=new Set(auditPackets(state,structuredClone(project),{root}).flatMap(p=>[...p.ctx.ids]));
 for(const r of finalRows){const id=r.block.id,fp=contentFingerprint(r.block),row={};
  const wasChanged=corrected.has(id),beforeBlock=state.rows.find(x=>x.block.id===id)?.block,wordingSame=beforeBlock&&wordingFingerprint(beforeBlock)===wordingFingerprint(r.block);
  if(r.question&&state.types.get(id)?.current&&(!wasChanged||wordingSame))row.type=fp;
  if((r.question||r.example)&&(state.stale.error.includes(id)?sentAudit.has(id)&&(!wasChanged||wordingSame):true))row.error=fp;
  if(r.question)row.duplicate=fp;
  if(r.kind==='teaching'&&(!state.stale.theory.includes(id)||audit.theory.some(t=>t.id===id)))row.theory=fp;
  checks[id]=row;}
 // Lessons judged for Key ideas, against their final teaching.
 const judged=new Set(auditPackets(state,structuredClone(project),{root}).flatMap(p=>[...p.ctx.staleKeyIdeas])),blockedTopics=new Set((report.blockers??[]).filter(b=>b.stage==='audit').flatMap(b=>b.topics??[]));
 for(const [t,l] of keyIdeasLessons(candidate))if(judged.has(t)&&!blockedTopics.has(t))checks['keyideas|'+t]={keyIdeas:l.fp};
 report.record={checks,types:Object.fromEntries([...state.types].filter(([,t])=>t.current).map(([id,t])=>[id,t.type])),exampleMatches:Object.fromEntries(audit.exampleMatches.map(m=>[m.exampleId,m.followedBy])),keep:audit.keep};
 }catch(error){report.blockers.push({stage:'run',reason:error.message,stack:String(error.stack).slice(0,1500)});}
 report.finishedAt=now();report.elapsedSeconds=Math.round((Date.now()-t0)/1000);
 report.calls=ctx.calls;
 report.totals=ctx.calls.reduce((t,c)=>({calls:t.calls+1,ok:t.ok+(c.ok?1:0),modelSeconds:t.modelSeconds+c.elapsedMs/1000,costUsd:t.costUsd+(c.costUsd??0),inputTokens:t.inputTokens+(c.usage?.input_tokens??0),cacheWriteTokens:t.cacheWriteTokens+(c.usage?.cache_creation_input_tokens??0),cacheReadTokens:t.cacheReadTokens+(c.usage?.cache_read_input_tokens??0),outputTokens:t.outputTokens+(c.usage?.output_tokens??0)}),{calls:0,ok:0,modelSeconds:0,costUsd:0,inputTokens:0,cacheWriteTokens:0,cacheReadTokens:0,outputTokens:0});
 report.totals.modelSeconds=Math.round(report.totals.modelSeconds);report.totals.reusedCalls=ctx.calls.filter(c=>c.reused).length;report.totals.savedUsd=Math.round(ctx.calls.reduce((s,c)=>s+(c.reused?.savedUsd??0),0)*1000)/1000;report.totals.costUsd=Math.round(report.totals.costUsd*1000)/1000;
 candidate.revision=project.revision;
 write(path.join(workDir,'candidate.json'),candidate);write(path.join(workDir,'report.json'),report);write(path.join(workDir,'report.md'),reportMarkdown(report));
 return {report,workDir};
}

export function reportMarkdown(r){
 const t=r.totals??{},lines=[`# Pedagogy audit v2: ${r.title}`,'',`Project \`${r.projectId}\` revision ${r.revision}. Model \`${r.model}\` at ${r.effort} effort for every call.`,'',`Wall clock ${r.elapsedSeconds} s; ${t.calls??0} calls (${t.ok??0} succeeded${t.reusedCalls?`, ${t.reusedCalls} reused from earlier runs, saving $${t.savedUsd}`:""}), ${t.modelSeconds??0} s in model calls, $${t.costUsd??0} (input ${t.inputTokens??0}, cache write ${t.cacheWriteTokens??0}, cache read ${t.cacheReadTokens??0}, output ${t.outputTokens??0} tokens).`,''];
 lines.push('## Stages','',...Object.entries(r.stages??{}).map(([k,v])=>`- ${k}: ${v.seconds} s`),'');
 lines.push('## Calls','','| Call | Seconds | Input | Cache write | Cache read | Output | Cost | OK |','|---|---|---|---|---|---|---|---|',...(r.calls??[]).map(c=>`| ${c.id} | ${Math.round(c.elapsedMs/1000)} | ${c.usage?.input_tokens??''} | ${c.usage?.cache_creation_input_tokens??''} | ${c.usage?.cache_read_input_tokens??''} | ${c.usage?.output_tokens??''} | ${c.costUsd!=null?'$'+c.costUsd.toFixed(3):''} | ${c.ok?'yes':'no: '+(c.error??'').slice(0,80)} |`),'');
 lines.push('## Applied automatically','',`- Challenge moves: ${(r.moves??[]).map(m=>m.ids.join('+')+' ('+m.score+')').join(', ')||'none'}${r.heldMoves?.length?'; held by the depletion guard: '+r.heldMoves.map(h=>h.id).join(', '):''}`,`- New questions: ${(r.applied?.newQuestions??[]).map(q=>`${q.id} (${q.type}, ${q.score})`).join(', ')||'none'}`,`- Corrections: ${(r.applied?.corrections??[]).map(c=>c.id+' '+c.field).join(', ')||'none'}`,`- Moved to a later lesson: ${(r.applied?.relocated??[]).map(m=>m.ids.join('+')+' → '+m.to).join(', ')||'none'}`,`- Challenge order: ${(r.challengeOrder??[]).map(c=>c.status+(c.holds?' ('+c.holds.slice(0,3).join('; ')+')':'')).join(', ')||'no Challenge exercise'}`,`- Ratings filled: ${(r.applied?.ratings??[]).length}`,`- Spelling: ${(r.applied?.spelling??[]).map(s=>s.id+': '+s.changes.join(', ')).join('; ')||'none'}`,`- Bold: ${(r.applied?.bold??[]).map(b=>b.id+': '+b.terms.join(', ')).join('; ')||'none'}`,'');
 lines.push('## Studio comments','',...(r.comments??[]).map(c=>`- ${c.kind} on ${c.target}`),`- Withdrawn v1 pedagogy comments: ${(r.withdrawnV1??[]).length}`,`- Earlier v2 comments superseded (re-checked in this run): ${(r.supersededV2??[]).length}`,'');
 const vari=(r.challenge??[]).filter(c=>c.kind==='variations');
 lines.push('## Challenge verdicts','',`Variation sequences: proposed ${vari.length}, confirmed ${vari.filter(c=>c.verdict==='confirmed').length}.`,'',...(r.challenge??[]).map(c=>`- ${c.id} ${c.kind}: ${c.verdict}${c.reason?' — '+c.reason:''}`),'');
 lines.push('## Dropped','',...(r.dropped??[]).map(d=>`- ${d.slot??d.proposal??d.claim}: ${d.reason}`),'');
 lines.push('## Types counted together (same method)','',...((r.typeGroups??[]).length?r.typeGroups.map(g=>'- '+g.types.join(' + ')+(g.method?' — '+g.method:'')):[r.typeGroupsFailed?'- none: the grouping call failed ('+r.typeGroupsFailed.slice(0,120)+')':'- none']),'');
 lines.push('## Remaining after this run','',`- Types below 3 items: ${(r.remaining?.deficits??[]).map(d=>d.sectionId.slice(-24)+'/'+d.type+' ('+d.items+')').join(', ')||'none'}`,`- Jumps over 15: ${(r.remaining?.jumpsOver15??[]).map(g=>g.after+'→'+g.before+' (+'+g.step+')').join(', ')||'none'}`,'');
 if(r.blockers?.length)lines.push('## Blockers','',...r.blockers.map(b=>`- ${b.stage}: ${b.reason}`),'');
 return lines.join('\n');
}

// ---- Stage 7: one save --------------------------------------------------------------
// When the page check fails only on pages that hold blocks the auto-apply inserted (Data Analysis 3 j9: a
// maths table wider than the page, 8 November 2026), those changes are taken out, stay comments with the
// reason, and the apply runs once more. Any other failure stops the apply as before.
export async function applyAuditV2(args){
 const base=path.join(args.root??ROOT,'.booklet-work','pedagogy-audit-v2',args.projectId);
 const runDir=args.runDir??path.join(base,fs.readdirSync(base).filter(n=>/^\d{8}-\d{6}$/.test(n)&&fs.existsSync(path.join(base,n,'candidate.json'))).sort().at(-1));
 try{return await applyAuditV2Once({...args,runDir});}
 catch(e){
  // Bank sync could not fit a changed question's new diagram into the bank question's saved layout (Circle
  // Trigonometry 2 p38-q3, a part replaced with a figured part, Stage 5, 10 November 2026). That change stays a
  // comment with the reason, and the apply runs once more.
  const bankRef=/Bank sync could not (?:place new diagram|preserve layout references); review (\S+)/.exec(e.message)?.[1];
  if(bankRef&&!args.bankRetried){
   const reportFile=path.join(runDir,'report.json'),report=read(reportFile),beforeAuto=path.join(runDir,'candidate-before-auto.json');
   const start=read(fs.existsSync(beforeAuto)?beforeAuto:path.join(runDir,'candidate.json'));
   const owner=start.sections.flatMap(s=>s.blocks??[]).filter(b=>b.content?.id&&bankRef.startsWith(b.content.id)).sort((a,b)=>b.content.id.length-a.content.id.length)[0];
   let marked=0;
   if(owner)for(const entry of Object.values(report.proposals??{}))for(const p of entry.payloads??[])
    if(p.blockId===owner.id&&['replace-node','theory','set-field'].includes(p.op)&&!p.notApplied){p.notApplied='the question bank could not place its new diagram in the bank question\'s layout';marked++;}
   if(marked){write(reportFile,report);(args.log??console.error)(`bank sync: the change to ${owner.id} left as a comment; applying again`);
    return applyAuditV2({...args,runDir,bankRetried:true});}
  }
  if(args.retried||!/Render check failed/.test(e.message))throw e;
  const culprits=renderCulprits(runDir);if(!culprits)throw e;
  const reportFile=path.join(runDir,'report.json'),report=read(reportFile);
  const beforeAuto=path.join(runDir,'candidate-before-auto.json'),start=read(fs.existsSync(beforeAuto)?beforeAuto:path.join(runDir,'candidate.json'));
  for(const [blockId,why] of culprits){let payload=false;
   for(const entry of Object.values(report.proposals??{}))for(const p of entry.payloads??[])
    if(p.block?.id===blockId||(p.blocks??[]).some(b=>b.id===blockId)||(p.blockId===blockId&&['replace-node','theory','set-field'].includes(p.op))){p.notApplied='it did not print cleanly in the booklet ('+why+')';payload=true;}
   // One of the audit's own new questions: removed, and noted on the comment that lists it.
   if(!payload){for(const s of start.sections)s.blocks=(s.blocks??[]).filter(b=>b.id!==blockId);
    for(const f of start.studio?.flags??[])if(String(f.note).includes(blockId))f.note+=`\nTaken out before saving: ${blockId} did not print cleanly (${why}).`;
    report.applied.newQuestions=(report.applied?.newQuestions??[]).filter(q=>(q.id??q)!==blockId);(report.dropped??=[]).push({slot:blockId,reason:'did not print cleanly ('+why+')'});}}
  write(beforeAuto,start);write(reportFile,report);(args.log??console.error)('render check: '+[...culprits.keys()].join(', ')+' taken out and left as comments; applying again');
  return applyAuditV2Once({...args,runDir,retried:true});}
}
// Page-check failures the live booklet already has are not the audit's. Layout issues are matched one for one by
// kind and size (printed ones by text, since their page numbers are PDF positions); any other check failure
// (answer coverage and the like) by edition, kind and exact message. Operations with Decimals 3: p79-q1's derived
// solution diagram never prints in the short edition, live and candidate alike (8 November 2026). A run that
// threw or left editions incomplete is never forgiven.
const UNFORGIVABLE_FAILURES=new Set(['exception','incomplete-editions']);
const failureKey=f=>[f.edition??'',f.kind??'',f.message??''].join('|');
// True when the figure's owner block (the block whose JSON names the diagram id, or the id's own block
// prefix) is the same in the live booklet and the candidate.
export function unchangedFigure(diagramId,live,candidate){
 if(!diagramId)return false;const id=String(diagramId).replace(/-(short|worked|student)(-inline)?$/,'');
 const owner=p=>(p.sections??[]).flatMap(s=>s.blocks??[]).find(b=>id.startsWith(b.id+'-')||JSON.stringify(b).includes('"id":'+JSON.stringify(id)));
 const a=owner(live),b=owner(candidate);
 return !!a&&!!b&&a.id===b.id&&JSON.stringify(a.content)===JSON.stringify(b.content);
}
export function baselineVerdict(cand,base){
 const keyOf=i=>i.printed?['printed',i.kind,i.text].join('|'):[i.kind,i.requiredMm,Math.round((i.availableMm??0)*10)/10].join('|');
 const fresh=[];
 for(const [e,list] of Object.entries(cand.issues??{})){const pool=(base.issues?.[e]??[]).map(keyOf);for(const i of list){const k=keyOf(i),at=pool.indexOf(k);if(at>=0)pool.splice(at,1);else fresh.push({edition:e,...i});}}
 const layoutKind=k=>k==='layout'||k==='printed-geometry';
 const old=new Set((base.failures??[]).filter(f=>!layoutKind(f.kind)).map(failureKey));
 const others=(cand.failures??[]).filter(f=>!layoutKind(f.kind));
 const newFailures=others.filter(f=>UNFORGIVABLE_FAILURES.has(f.kind)||!old.has(failureKey(f))).map(f=>({edition:f.edition,kind:f.kind,message:String(f.message??'').slice(0,600)}));
 const preexisting=[...new Set(others.filter(f=>!UNFORGIVABLE_FAILURES.has(f.kind)&&old.has(failureKey(f))).map(failureKey))];
 return {fresh,newFailures,preexisting};
}
export function renderCulprits(runDir){
 const pagesDir=path.join(runDir,'pages'),fp=path.join(pagesDir,'feedback-pages.json');if(!fs.existsSync(fp))return null;
 const j=read(fp),report=read(path.join(runDir,'report.json')),render=fs.existsSync(path.join(runDir,'render.json'))?read(path.join(runDir,'render.json')):{};
 const made=new Map();for(const entry of Object.values(report.proposals??{}))for(const p of entry.payloads??[]){for(const b of [p.block,...(p.blocks??[])].filter(Boolean))made.set(b.id,p);
  // A block the apply changed in place (a part replaced, a theory rewrite) is audit-made too: Length 2 p50-q2's
  // replaced part overflowed its grid column and the retry found no audit block to take out (8 November 2026).
  if(p.blockId&&['replace-node','theory','set-field'].includes(p.op)&&p.applied!==false)made.set(p.blockId,p);}
 const bad=[];// [edition, page, why] or [null, ownerId, why]
 // With a live baseline, only its new issues count; printed ones are PDF positions, the rest booklet pages.
 const fresh=render.baseline?.newIssues;
 if(fresh){for(const i of fresh)if(i.printed)bad.push([i.edition,'pdf:'+i.page,i.kind]);else bad.push([i.edition,i.page,i.kind]);}
 else for(const [e,v] of Object.entries(j.editionsReport??{}))for(const p of v.printed??[])for(const i of p.issues??[])bad.push([e,'pdf:'+p.page,i.kind]);
 const early=path.join(pagesDir,'early-math-failures.json');if(fs.existsSync(early))for(const r of read(early).rows??[])for(const a of r.ancestors??[])if(a['data-content-owner'])bad.push([null,a['data-content-owner'],'maths failed to render']);
 const known=new Set(render.baseline?.preexistingFailures??[]);
 const other=(j.failures??[]).filter(f=>!['printed-geometry','layout','exception','incomplete-editions'].includes(f.kind)&&!known.has(failureKey(f)));
 if(!bad.length||other.length)return null;
 // Printed issues number PDF pages; the page report numbers booklet pages, printed in each PDF footer.
 const footers={};const bookletPage=(e,n)=>{if(!footers[e]){footers[e]=[];const pdf=fs.readdirSync(pagesDir).find(f=>f.endsWith(`-${e}-feedback.pdf`));
   if(pdf){const r=spawnSync('pdftotext',['-layout',path.join(pagesDir,pdf),'-'],{encoding:'utf8',maxBuffer:64*1024*1024});footers[e]=String(r.stdout??'').split('\f').map(t=>Number(/Page (\d+) of \d+/.exec(t)?.[1])||null);}}
  return footers[e][n-1]??null;};
 // Audit-made blocks: apply payloads, and the audit's own new questions (v2- ids already in the candidate).
 const auditMade=id=>made.has(id)||id.startsWith('v2-');
 const out=new Map();
 for(const [e,where,why,printed] of bad.map(b=>[...b,true])){
  const page=e==null?null:String(where).startsWith('pdf:')?bookletPage(e,Number(String(where).slice(4))):where;
  const on=n=>(j.editionsReport[e]?.pages??[]).find(p=>p.page===n)?.blocks.filter(auditMade)??[];
  // An overflow spills onto the next page (Data Visualisation 1: slot 8 on page 33, footer clearance on 34).
  const blocks=e==null?[...made.keys()].filter(id=>where===id||where.startsWith(id+'-')):on(page).length?on(page):String(where).startsWith('pdf:')?on(page-1):[];
  if(!blocks.length){if(process.env.AUDIT_V2_DEBUG)console.error('renderCulprits: no audit block for',e,where,why,'-> page',page);return null;}blocks.forEach(id=>out.set(id,why));}
 return out;
}
async function applyAuditV2Once({projectId,runDir,root=ROOT,log=console.error,autoApply=true}){
 const base=path.join(root,'.booklet-work','pedagogy-audit-v2',projectId);
 runDir??=path.join(base,fs.readdirSync(base).filter(n=>/^\d{8}-\d{6}$/.test(n)&&fs.existsSync(path.join(base,n,'candidate.json'))).sort().at(-1));
 const report=read(path.join(runDir,'report.json')),candidateFile=path.join(runDir,'candidate.json'),beforeAuto=path.join(runDir,'candidate-before-auto.json'),live=read(path.join(root,'booklets','projects',projectId+'.json'));
 // A repeated --apply starts again from the audit's own candidate, so nothing is applied twice.
 let candidate=read(fs.existsSync(beforeAuto)?beforeAuto:candidateFile);
 if(report.blockers?.some(b=>b.stage==='run'))throw Error('The run failed; nothing to apply: '+report.blockers.find(b=>b.stage==='run').reason);
 if(live.revision!==report.revision)throw Error(`Live revision is ${live.revision}, the run was on ${report.revision}: run the audit again`);
 const busy=inFlight(live);if(busy.length)throw Error('Another import, review, export or repair is running: '+busy[0].slice(0,200));
 // Verified findings are applied in this same save, and their comments stay open marked
 // "Applied automatically" for James to review (8 November 2026). --no-auto-apply leaves them as proposals.
 let auto=null;
 // The pre-apply candidate is always kept, and the candidate rendered is always the one saved: a retry
 // that took out a block without auto-applied proposals rendered the old candidate.json again (Data
 // Visualisation 1 count top-up, 8 November 2026).
 if(!fs.existsSync(beforeAuto))write(beforeAuto,candidate);
 if(autoApply&&Object.values(report.proposals??{}).some(e=>e.payloads?.some(p=>p.autoApply))){
  const {applyComments}=await import('./audit-v2-apply.mjs');
  const proposals=structuredClone(report.proposals);
  const r=await applyComments({projectId,auto:true,candidateIn:candidate,proposals:{comments:proposals},workDir:path.join(runDir,'auto-apply'),root,log});
  candidate={...r.candidate,revision:report.revision};auto=r.report;
  const replaced=new Set(auto.applied.filter(a=>a.op==='replace-node').map(a=>a.what.split(' ')[0]));
  houseTints(candidate,replaced);gridSteps(candidate,replaced);for(const s of candidate.sections??[])joinContinuedRuns(s);
  for(const k of auto.appliedKeys){const i=k.indexOf('|'),id=k.slice(0,i),key=k.slice(i+1);const p=proposals[id]?.payloads?.find(x=>x.key===key&&x.autoApply);if(p)p.applied=true;}
  report.proposals=proposals;
  write(candidateFile,candidate);write(path.join(runDir,'auto-apply.json'),auto);
  log(`auto-apply: ${auto.applied.length} changes, ${auto.manual.length+auto.stale.length} left as proposals`);
 }
 // Audit-made figures are normalised on every apply, not only when proposals were auto-applied: a run with
 // only slot questions skipped it (8 November 2026).
 else{houseTints(candidate);gridSteps(candidate);for(const s of candidate.sections??[])joinContinuedRuns(s);write(candidateFile,candidate);}
 const {publishProject,publicationDiff}=await import('../scripts/booklet/publish-project.mjs');
 const diff=publicationDiff(live,candidate),printed=[...diff.added,...diff.changed].filter(id=>{const a=live.sections.flatMap(s=>s.blocks??[]).find(b=>b.id===id),b=candidate.sections.flatMap(s=>s.blocks??[]).find(x=>x.id===id);return !a||contentFingerprint(a)!==contentFingerprint(b)||JSON.stringify(a.content)!==JSON.stringify(b.content);});
 const t0=Date.now(),record={render:null,publish:null};
 // One render of changed pages (comment-only changes need none).
 if(printed.length||diff.reordered){
  const out=path.join(runDir,'pages'),answers=(report.applied?.newQuestions?.length||report.applied?.corrections?.length||auto?.pageBlocks?.length)?'student,short,worked':'student';
  // Re-sorted blocks count too (6 November 2026: a sort-only run rendered "0 blocks" and failed).
  const order=p=>new Map(p.sections.flatMap(s=>(s.blocks??[]).map((b,i)=>[b.id,s.id+'#'+i]))),was=order(live),now=order(candidate);
  const resorted=[...now].filter(([id,at])=>was.has(id)&&was.get(id)!==at).map(([id])=>id);
  // Page breaks render nothing and fail as "unknown-block" (Computation with Integers 2, 8 November 2026).
  const typeOf=new Map(candidate.sections.flatMap(s=>(s.blocks??[]).map(b=>[b.id,b.type])));
  let ids=[...new Set([...printed,...(report.moves??[]).flatMap(m=>m.ids),...resorted])].filter(id=>typeOf.get(id)!=='page-break');
  // A block whose structural issue the live booklet already has (Data Analysis 3 p74-q5-block: an
  // arrangement naming nodes that no longer exist) is not checked: the issue is not the audit's.
  {const {structuralPreflight}=await import('../scripts/booklet/feedback-preflight.mjs');const key=i=>i.blockId+'|'+i.kind+'|'+(i.ref??i.path??'');
   const liveIds=new Set(live.sections.flatMap(s=>(s.blocks??[]).map(b=>b.id)));
   const old=new Set(structuralPreflight(live,{blockIds:ids.filter(id=>liveIds.has(id))}).issues.map(key));
   const cand=structuralPreflight(candidate,{blockIds:ids}).issues;
   const preexisting=new Set(cand.filter(i=>old.has(key(i))).map(i=>i.blockId));
   if(preexisting.size&&cand.every(i=>old.has(key(i)))){log('render check: '+[...preexisting].join(', ')+' left out (structural issues already in the live booklet)');ids=ids.filter(id=>!preexisting.has(id));}}
  log('render check: '+ids.length+' blocks, editions '+answers);
  const r=spawnSync(process.execPath,// No --baseline-project-file: its local-repair scope check rejects re-sorting, a new Challenge
  // section and comments by design; the audit's own diff is checked by publish-project.
  ['scripts/booklet/check-feedback-pages.mjs','--project-file',candidateFile,'--blocks',ids.join(','),'--editions',answers,...(answers!=='student'?['--full-development-reason','Pedagogy audit v2 added or corrected practice answers; a short answer edition can be selected in full.']:[]),'--out',out],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024,timeout:1800000});
  record.render={exitCode:r.status,seconds:Math.round((Date.now()-t0)/1000),out:rel(out),stdout:String(r.stdout).slice(-4000),stderr:String(r.stderr).slice(-4000)};
  write(path.join(runDir,'render.json'),record.render);
  // Layout issues the live booklet already has are not the audit's: an applied change reflows pages, which
  // brings their old issues into the check (Computation with Integers 2: five short clozes on untouched
  // questions, 8 November 2026). The same blocks of the live booklet are checked, and only new issues fail.
  // Printed-geometry issues (overflow past the page) are compared the same way, by kind and text, since their
  // page numbers are PDF positions (Data Visualisation 1: 25 old layout issues and 2 overflows, 8 November 2026).
  if(r.status!==0){
   const issuesOf=file=>{try{const j=read(file);return {failures:j.failures??[],issues:Object.fromEntries(Object.entries(j.editionsReport??{}).map(([e,v])=>[e,[...(v.issues??[]),...(v.printed??[]).flatMap(p=>(p.issues??[]).map(i=>({...i,page:p.page,printed:true})))]]))};}catch{return null;}};
   const cand=issuesOf(path.join(out,'feedback-pages.json'));
   if(cand&&cand.failures.length&&cand.failures.every(f=>!UNFORGIVABLE_FAILURES.has(f.kind))){
    const liveIds=new Set(live.sections.flatMap(s=>(s.blocks??[]).map(b=>b.id)));const baseOut=out+'-live';
    const b=spawnSync(process.execPath,['scripts/booklet/check-feedback-pages.mjs','--project-file',path.join(root,'booklets','projects',projectId+'.json'),'--blocks',ids.filter(id=>liveIds.has(id)).join(','),'--editions',answers,...(answers!=='student'?['--full-development-reason','Pedagogy audit v2 baseline: the issues the live booklet already has.']:[]),'--out',baseOut],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024,timeout:1800000});
    const base=issuesOf(path.join(baseOut,'feedback-pages.json')),v=base?baselineVerdict(cand,base):null;
    // An issue in a figure whose block the audit left unchanged is not the audit's, wherever the reflow put it:
    // two exam graphs' "unclassified-graph-stroke" on short page 5 failed Features of Quadratics 2 (Stage 5,
    // 9 November 2026) though neither question changed.
    if(v)v.fresh=v.fresh.filter(i=>!unchangedFigure(i.diagramId??i.id,live,candidate));
    record.render.baseline={exitCode:b.status,out:rel(baseOut),newIssues:v?v.fresh:null,newFailures:v?v.newFailures:null,preexistingFailures:v?v.preexisting:null};write(path.join(runDir,'render.json'),record.render);
    if(v&&!v.fresh.length&&!v.newFailures.length){log('render check: '+Object.values(cand.issues).flat().length+' layout issues'+(v.preexisting.length?' and '+v.preexisting.length+' check failures ('+v.preexisting.map(f=>f.split('|').slice(0,2).join(' ')).join(', ')+')':'')+', all already in the live booklet');record.render.passedOnBaseline=true;}
    else throw Error('Render check failed with '+(v?v.fresh.length+' new layout issues and '+v.newFailures.length+' new check failures':'no baseline')+'; see '+rel(path.join(runDir,'render.json')));}
   else throw Error('Render check failed; see '+rel(path.join(runDir,'render.json')));}
 }
 // Applied changes to a bank-owned question sync to the bank, as a Studio save does (James, 8 November 2026).
 const dry=await publishProject({candidateFile,expectedRevision:live.revision,root,allowBank:true});
 log('publish dry run: '+JSON.stringify(dry.diff).slice(0,400)+(dry.bankWrites?.length?'; bank writes: '+dry.bankWrites.join(', '):''));
 const saved=await publishProject({candidateFile,expectedRevision:live.revision,apply:true,allowBank:true,root,record:path.join(runDir,'publication.json'),ledger:path.join(root,'.booklet-work','pedagogy-audit-v2','publications.jsonl'),note:'pedagogy audit v2'});
 // Provenance: model, effort, usage and time per call, and the fingerprints now checked.
 const file=recordFile(projectId,{root}),prior=loadRecord(projectId,root,parentOf(live));
 const archive=path.join(path.dirname(file),'archive',projectId+'-withdrawn-'+now().slice(0,10).replaceAll('-','')+'.json');
 if(report.withdrawnV1?.length||report.supersededV2?.length)write(archive,{version:1,projectId,withdrawnAt:now(),reason:'Replaced by pedagogy audit v2',comments:report.withdrawnV1??[],supersededV2:report.supersededV2??[]});
 const own=auto?.pageBlocks?.length?appliedChecks(read(candidateFile),auto.pageBlocks):{checks:{},types:{}};
 const next={...prior,title:report.title,checkedRevision:saved.to,checks:{...prior.checks,...report.record.checks,...own.checks},types:{...prior.types,...report.record.types,...own.types},exampleMatches:{...prior.exampleMatches,...report.record.exampleMatches},keep:report.record.keep??prior.keep,
  runs:[...(prior.runs??[]),{at:report.startedAt,run:rel(runDir),fromRevision:report.revision,toRevision:saved.to,model:MODEL,effort:EFFORT,elapsedSeconds:report.elapsedSeconds,totals:report.totals,calls:report.calls.map(({id,stage,attempt,model,effort,elapsedMs,usage,costUsd,ok})=>({id,stage,attempt,model,effort,elapsedMs,usage,costUsd,ok})),corrections:report.applied?.corrections??[],newQuestions:report.applied?.newQuestions??[],moves:report.moves,comments:report.comments.length,autoApplied:auto?{changes:auto.applied.length,left:auto.manual.length+auto.stale.length,file:rel(path.join(runDir,'auto-apply.json')),calls:auto.calls.map(({id,stage,model,effort,elapsedMs,usage,costUsd,ok})=>({id,stage,model,effort,elapsedMs,usage,costUsd,ok}))}:null,withdrawnV1:report.withdrawnV1?.length?rel(archive):null,applySeconds:Math.round((Date.now()-t0)/1000)}]};
 write(file,next);
 // Apply payloads for the comments just posted, keyed by comment id (read by apply-comments).
 if(report.proposals&&Object.keys(report.proposals).length){const pf=proposalsFile(projectId,{root}),prior=fs.existsSync(pf)?read(pf):{version:1,projectId,comments:{}};
  const liveIds=new Set((candidate.studio?.flags??[]).map(f=>f.id));
  const kept=Object.fromEntries(Object.entries(prior.comments??{}).filter(([id])=>liveIds.has(id)));
  for(const [id,entry]of Object.entries(report.proposals))kept[id]={...entry,run:rel(runDir),revision:saved.to};
  write(pf,{...prior,comments:kept});}
 return {projectId,revision:saved.to,autoApplied:auto?{changes:auto.applied.length,left:[...auto.manual,...auto.stale]}:null,render:record.render&&{exitCode:record.render.exitCode,seconds:record.render.seconds,out:record.render.out},provenance:rel(file),publication:rel(path.join(runDir,'publication.json'))};
}

export async function auditV2Main(args){
 const value=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];},flag=name=>args.includes(name);
 const id=value('--project');if(!id)throw Error('audit-v2 needs --project ID');
 if(args[0]==='apply-comments')return (await import('./audit-v2-apply.mjs')).applyCommentsMain(args.slice(1));
 if(flag('--apply'))return applyAuditV2({projectId:id,runDir:value('--run')&&path.resolve(value('--run')),autoApply:!flag('--no-auto-apply')});
 const {report,workDir}=await runAuditV2({projectFile:path.join(ROOT,'booklets','projects',id+'.json'),topics:(value('--topics')??'').split(',').filter(Boolean),dryRun:flag('--dry-run'),allowNonMaster:flag('--allow-non-master'),freshCalls:flag('--fresh-calls'),topUp:flag('--top-up-counts')});
 if(!workDir)return report;
 return {projectId:report.projectId,run:rel(workDir),elapsedSeconds:report.elapsedSeconds,totals:report.totals,applied:{moves:report.moves?.length??0,newQuestions:report.applied?.newQuestions?.length??0,corrections:report.applied?.corrections?.length??0,ratings:report.applied?.ratings?.length??0},comments:report.comments?.length??0,blockers:report.blockers,report:rel(path.join(workDir,'report.md'))};
}
