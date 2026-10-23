// Pre-review sweep: applies the conventions the teacher has already set for
// every booklet to booklets the teacher has not reviewed yet, so their page
// review starts from the house style. See docs/booklet-pre-review-sweep.md.
//
//   node sweep/run.mjs report [--project ID,ID] [--rules gutter,cloze] [--list] [--all]
//   node sweep/run.mjs prepare --project ID [--rules …]
//   node sweep/run.mjs apply --project ID [--rules …]
//   node sweep/run.mjs apply --all [--rules …] [--notes FILE]
//   node sweep/run.mjs summary
//   node sweep/run.mjs pages --project ID [--threshold 0.4]
//
// `report` is the dry run, one line per booklet with counts per rule (fixes
// and reports). `prepare` writes before.json, candidate.json and changes.json
// to .booklet-work/pre-review-sweep/ID/ without saving, for page checks.
// `apply` checks for running imports and other sessions' work on the booklet,
// then saves the candidate through the revision-checked save path with a
// recovery checkpoint first. Lives outside scripts/, which exports freeze.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';
import {RULES,SWEEP_DATE,sweepProject,contentSignature} from './rules.mjs';

const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')),'..');
const PROJECTS=path.join(ROOT,'booklets','projects');
export const RUN_DIR=path.join(ROOT,'.booklet-work','pre-review-sweep');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,1)+'\n');};
const blocksOf=project=>(project.sections??[]).flatMap(section=>section.blocks??[]);

// A teacher comment is a Studio flag with no kind and a timestamp. A booklet
// with any, open or resolved, has been reviewed by the teacher.
export const teacherComments=project=>(project.studio?.flags??[]).filter(flag=>!flag.kind&&flag.at);
export function projectIds(){return fs.readdirSync(PROJECTS).filter(f=>f.endsWith('.json')&&f!=='manifest.json').map(f=>f.slice(0,-5)).sort();}
// Class copies (source.type project-copy) are the teacher's own working
// copies of booklets, edited directly in Studio; the sweep leaves them alone.
export const classCopy=project=>project.source?.type==='project-copy';
export function unreviewed(){
 const out=[];
 for(const id of projectIds()){
  const project=read(path.join(PROJECTS,id+'.json'));
  if(!teacherComments(project).length&&!classCopy(project))out.push(id);
 }
 return out;
}

// Default: imports/reviews anywhere (used before shared-code maintenance). A
// polish save may request projectOnly: unrelated imports do not own its booklet.
export function workProcessFlags(lines,id,{projectOnly=false}={}){
 const blocked=lines.filter(line=>/lean-(?:import|review|route)\.mjs/.test(line)&&(!projectOnly||!id||line.includes(id))).map(line=>'running: '+line.slice(0,160));
 const held=id?lines.filter(line=>line.includes(id)).map(line=>'process names this booklet: '+line.slice(0,160)):[];
 return {blocked,held};
}
export function liveWork(id,{projectOnly=false}={}){
 let lines=[];
 try{
  const out=process.platform==='win32'
   ?execFileSync('powershell.exe',['-NoProfile','-Command',"Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | ForEach-Object { $_.ProcessId.ToString() + ' ' + $_.CommandLine }"],{encoding:'utf8',windowsHide:true,maxBuffer:1<<24})
   :execFileSync('ps',['-eo','pid,args'],{encoding:'utf8'});
  lines=out.split(/\r?\n/).filter(Boolean).filter(line=>!line.startsWith(String(process.pid)+' ')&&!line.includes('sweep/run.mjs')&&!line.includes('sweep\\run.mjs'));
 }catch(error){return {blocked:['process list unavailable: '+error.message]};}
 const {blocked,held}=workProcessFlags(lines,id,{projectOnly});
 // Another run folder holding newer work on this booklet than the live file.
 if(id){
  const live=fs.statSync(path.join(PROJECTS,id+'.json')).mtimeMs,work=path.join(ROOT,'.booklet-work');
  for(const run of fs.readdirSync(work,{withFileTypes:true}).filter(d=>d.isDirectory()&&d.name!=='pre-review-sweep')){
   for(const name of [id,id+'-candidate.json']){
    const target=path.join(work,run.name,name);
    if(!fs.existsSync(target))continue;
    const stat=fs.statSync(target),files=stat.isDirectory()?fs.readdirSync(target).filter(f=>/candidate.*\.json$/.test(f)).map(f=>path.join(target,f)):[target];
    for(const file of files)if(fs.statSync(file).mtimeMs>live)held.push('newer unsaved candidate: '+path.relative(ROOT,file));
   }
  }
 }
 return {blocked,held};
}

function counts(findings){
 const out={};
 for(const f of findings){out[f.rule]??={fix:0,report:0};out[f.rule][f.action==='fix'?'fix':'report']++;}
 return out;
}
function line(id,findings){
 const c=counts(findings);
 return id+': '+(Object.keys(RULES).filter(r=>c[r]).map(r=>r+' '+(c[r].fix?c[r].fix+' fix':'')+(c[r].fix&&c[r].report?' + ':'')+(c[r].report?c[r].report+' report':'')).join(', ')||'nothing to do');
}

// Checks that the candidate changed presentation only.
export function verifyCandidate(before,candidate,changed){
 const old=new Map(blocksOf(before).map(b=>[b.id,b])),problems=[];
 for(const block of blocksOf(candidate).filter(b=>changed.includes(b.id))){
  const a=contentSignature(old.get(block.id)).map(normaliseLabel),b=contentSignature(block).map(normaliseLabel);
  if(!isDeepStrictEqual(a,b))problems.push(block.id+': content changed ('+a.filter(x=>!b.includes(x)).slice(0,2).join(' | ')+' → '+b.filter(x=>!a.includes(x)).slice(0,2).join(' | ')+')');
  for(const key of ['classification','bankRef','pedagogyRole','type'])if(!isDeepStrictEqual(old.get(block.id)[key],block[key]))problems.push(block.id+': '+key+' changed');
 }
 return problems;
}
const normaliseLabel=s=>s.replace(/^text:\(?([a-z]|i{1,3}|iv|vi{0,3}|ix)\)$/,'text:$1');

function prepare(id,rules){
 const before=read(path.join(PROJECTS,id+'.json'));
 if(teacherComments(before).length||classCopy(before))throw Error(id+(classCopy(before)?' is a class copy':' has teacher comments')+'; the sweep covers unreviewed booklets only');
 const {project:candidate,findings,changed}=sweepProject(before,{fix:true,rules});
 const problems=verifyCandidate(before,candidate,changed);
 if(problems.length)throw Error('Sweep would change content in '+id+': '+problems.join('; '));
 const byBlock=Object.fromEntries(changed.map(b=>[b,[...new Set(findings.filter(f=>f.blockId===b&&f.action==='fix').map(f=>f.rule))]]));
 for(const block of blocksOf(candidate).filter(b=>changed.includes(b.id))){
  block.sourceReview??={};block.sourceReview.feedbackRepairs??=[];
  block.sourceReview.feedbackRepairs.push({date:SWEEP_DATE,note:'Pre-review sweep ('+byBlock[block.id].join(', ')+'): standing house conventions applied before the teacher\'s review; content and answers unchanged.'});
 }
 const dir=path.join(RUN_DIR,id);
 write(path.join(dir,'before.json'),before);write(path.join(dir,'candidate.json'),candidate);
 write(path.join(dir,'changes.json'),{id,revision:before.revision,preparedAt:new Date().toISOString(),rules,changed,findings});
 return {before,candidate,findings,changed,dir};
}

async function apply(id,rules){
 const {blocked,held}=liveWork(id);
 if(blocked.length||held.length){console.log(id+': deferred\n  '+[...blocked,...held].join('\n  '));process.exitCode=2;return null;}
 const {loadBookletProject}=await import('../scripts/booklet/project-studio-server.mjs');
 const {saveRepair}=await import('../scripts/booklet/feedback-closeout.mjs');
 const dir=path.join(RUN_DIR,id);
 let prepared=fs.existsSync(path.join(dir,'changes.json'))?read(path.join(dir,'changes.json')):null;
 const live=await loadBookletProject(id,{refreshRatings:false});
 // Rebuild from the live booklet whenever it has moved on since `prepare`.
 if(!prepared||!fs.existsSync(path.join(dir,'candidate.json'))||prepared.revision!==live.revision||!isDeepStrictEqual(prepared.rules,rules)){prepare(id,rules);prepared=read(path.join(dir,'changes.json'));}
 if(prepared.revision!==live.revision)throw Error(id+' changed while preparing; run apply again');
 if(!prepared.changed.length){console.log(id+': nothing to change');return {id,revision:live.revision,changed:[]};}
 const candidate=read(path.join(dir,'candidate.json'));
 const problems=verifyCandidate(live,candidate,prepared.changed);
 if(problems.length)throw Error('Prepared candidate changes content: '+problems.join('; '));
 const result=await saveRepair({candidate,expectedRevision:live.revision,changedBlockIds:prepared.changed,allowedPaths:prepared.allowedPaths??[],runDir:dir,options:{checkpoint:true}});
 const summary={id,from:live.revision,revision:result.project.revision,changed:prepared.changed.length,counts:counts(prepared.findings),bankSyncItems:result.readback.bankSyncItems,savedAt:new Date().toISOString()};
 write(path.join(dir,'applied.json'),summary);write(path.join(dir,'applied-r'+summary.revision+'.json'),summary);
 console.log(line(id,prepared.findings)+'  → saved r'+summary.revision+' ('+summary.changed+' blocks)');
 return summary;
}

// Every unreviewed booklet that still has a fix for these rules, one at a
// time. A deferred or failed booklet is logged and the run continues. With
// --notes FILE (one booklet ID per line, read by other sessions), each saved
// booklet is taken off that list.
async function applyAll(rules,notes,excluded=[]){
 const results=[];
 for(const id of unreviewed()){
  const {findings}=sweepProject(read(path.join(PROJECTS,id+'.json')),{rules});
  if(!findings.some(f=>f.action==='fix'))continue;
  if(excluded.includes(id)){results.push({id,status:'deferred',reasons:['excluded after failed sample checks; see completion report']});console.log(id+': deferred after failed sample checks');continue;}
  let result;
  try{result=await apply(id,rules);results.push(result?{id,status:'saved',revision:result.revision,changed:result.changed?.length??result.changed}:{id,status:'deferred',reasons:liveWork(id).held.concat(liveWork(null).blocked)});}
  catch(error){
   console.log(id+': failed: '+error.message.slice(0,300));results.push({id,status:'failed',error:error.message});
   // Other sessions treat a candidate newer than the live booklet as a hold;
   // an unsaved one must not keep holding it.
   fs.rmSync(path.join(RUN_DIR,id,'candidate.json'),{force:true});
  }
  if(notes&&result&&fs.existsSync(notes)){const keep=fs.readFileSync(notes,'utf8').split(/\r?\n/).filter(line=>line.trim()&&line.trim()!==id);fs.writeFileSync(notes,keep.join('\n')+(keep.length?'\n':''));}
 }
 write(path.join(RUN_DIR,'apply-all-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json'),{rules,results});
 const by=s=>results.filter(r=>r.status===s).map(r=>r.id);
 console.log('\nsaved '+by('saved').length+', deferred '+by('deferred').length+(by('deferred').length?' ('+by('deferred').join(', ')+')':'')+', failed '+by('failed').length+(by('failed').length?' ('+by('failed').join(', ')+')':''));
 return results;
}

// One line per unreviewed booklet: what the sweep fixed (every apply of it),
// and what is left for the teacher on the live booklet now.
function summaryReport(){
 const lines=[];
 for(const id of unreviewed()){
  const dir=path.join(RUN_DIR,id),applied=fs.existsSync(dir)?fs.readdirSync(dir).filter(f=>/^applied-r\d+\.json$/.test(f)).map(f=>read(path.join(dir,f))):[];
  if(!applied.length&&fs.existsSync(path.join(dir,'applied.json')))applied.push(read(path.join(dir,'applied.json')));
  const fixed={};for(const a of applied)for(const [rule,c] of Object.entries(a.counts??{}))if(c.fix)fixed[rule]=(fixed[rule]??0)+c.fix;
  const {findings}=sweepProject(read(path.join(PROJECTS,id+'.json')),{});
  const left={},pending={};for(const f of findings)(f.action==='fix'?pending:left)[f.rule]=((f.action==='fix'?pending:left)[f.rule]??0)+1;
  const fmt=o=>Object.entries(o).map(([r,n])=>r+' '+n).join(', ')||'none';
  const revision=applied.length?'r'+Math.max(...applied.map(a=>a.revision)):'not saved';
  lines.push(`${id} | ${revision} | fixed: ${fmt(fixed)} | still to fix: ${fmt(pending)} | for the teacher: ${fmt(left)}`);
 }
 const text=lines.join('\n')+'\n';
 fs.mkdirSync(RUN_DIR,{recursive:true});fs.writeFileSync(path.join(RUN_DIR,'summary.txt'),text);
 console.log(text+'\nWritten to '+path.relative(ROOT,path.join(RUN_DIR,'summary.txt')));
}

// Pages of the Questions edition that a forced break or source page boundary
// leaves more than `threshold` empty, outside exercise starts.
async function pages(id,threshold){
 const {renderPageFill}=await import('./pages.mjs');
 const project=read(path.join(PROJECTS,id+'.json'));
 const fill=await renderPageFill(project);
 const {project:_,findings}=sweepProject(project,{rules:['breaks']});
 const breaks=new Set(findings.map(f=>f.blockId)),out=[];
 for(let i=0;i<fill.length-1;i++){
  const next=fill[i+1],first=next.blocks[0];
  if(!breaks.has(first)||fill[i].isCover||fill[i].isAnswer)continue;
  if(1-fill[i].fill>threshold)out.push({page:fill[i].page,empty:Math.round(100*(1-fill[i].fill)),nextBlock:first});
 }
 write(path.join(RUN_DIR,id,'pages.json'),{id,revision:project.revision,threshold,pages:fill,gaps:out});
 for(const row of out)console.log(id+': Questions p'+row.page+' is '+row.empty+'% empty before a forced break at '+row.nextBlock);
 if(!out.length)console.log(id+': no forced break leaves more than '+Math.round(threshold*100)+'% of a page empty');
 return out;
}

async function main(){
 const args=process.argv.slice(2),command=args[0],arg=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
 const rules=(arg('--rules')??Object.keys(RULES).join(',')).split(',').filter(r=>RULES[r]);
 const ids=arg('--project')?.split(',').filter(Boolean);
 if(command==='report'){
  const list=ids??(args.includes('--all')?projectIds():unreviewed());
  const out=[];
  for(const id of list){
   const project=read(path.join(PROJECTS,id+'.json'));
   const {findings}=sweepProject(project,{rules});
   out.push({id,revision:project.revision,reviewed:teacherComments(project).length>0,findings});
   console.log(line(id,findings)+(teacherComments(project).length?'  (reviewed: excluded)':''));
   if(args.includes('--list'))for(const f of findings)console.log('  ['+f.rule+' '+f.action+'] '+f.blockId+(f.target&&f.target!==f.blockId?' > '+f.target:'')+': '+f.detail);
  }
  write(path.join(RUN_DIR,'report.json'),{at:new Date().toISOString(),rules,booklets:out.map(b=>({...b,counts:counts(b.findings)}))});
  const total=counts(out.flatMap(b=>b.findings));
  console.log('\n'+out.length+' booklets. '+Object.entries(total).map(([r,c])=>r+' '+c.fix+' fix / '+c.report+' report').join('; '));
  return;
 }
 if(command==='summary'){summaryReport();return;}
 if(command==='apply'&&args.includes('--all')){await applyAll(rules,arg('--notes'),(arg('--exclude')??'').split(',').filter(Boolean));return;}
 if(!ids?.length)throw Error('Name the booklet with --project ID');
 for(const id of ids){
  if(command==='prepare'){const {findings,changed,dir}=prepare(id,rules);console.log(line(id,findings)+'  → '+changed.length+' blocks; '+path.relative(ROOT,dir));}
  else if(command==='apply')await apply(id,rules);
  else if(command==='pages')await pages(id,Number(arg('--threshold')??0.4));
  else throw Error('Use report, prepare, apply or pages');
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
