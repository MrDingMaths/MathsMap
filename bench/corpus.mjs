// Teacher comments as regression cases, and how many of them deterministic
// checks catch in replay.
//   node bench/corpus.mjs build [--out DIR]
//   node bench/corpus.mjs replay [--out DIR] [--project ID]
// build: every teacher flag in every live project (plus the 17 October
//   teacher-comments.json export) becomes a case: the revision saved before the
//   comment, the revision after its resolution, and the layout fields the fix
//   changed for the named block. Cases are categorised by keyword rules, with
//   bench/corpus-overrides.json taking precedence.
// replay: runs the registered detectors on each pre-comment snapshot and reports
//   the catch rate per category. Detectors are pluggable: registerDetector(), or
//   a checks/*.mjs file exporting `detectors` (later phases add those).
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,PROJECTS,allBlocks,isTeacherFlag,revisionBefore,revisionAfter,loadRevision} from './history.mjs';
import {ownerIndex,diffFields,blockHash} from './fields.mjs';

export const CATEGORIES=Object.freeze(['spacing-pagination','block-role','cloze-scaffold','alignment','source-layout','diagram-arrow','wrapping','part-labels','borders-house-style','content']);
export const OVERRIDES_FILE=path.join(ROOT,'bench','corpus-overrides.json');
export const DEFAULT_OUT=path.join(ROOT,'.booklet-work','bench-20261022','corpus');
const COMMENTS_EXPORT=path.join(ROOT,'.booklet-work','review-speed-20261017','teacher-comments.json');
const BASELINE_SCORE=path.join(ROOT,'.booklet-work','first-pass-recheck-20261015','score.md');

// First-pass finding areas (first-pass/review.mjs AREAS) expressed as categories.
export const AREA_TO_CATEGORY=Object.freeze({
 pagination:'spacing-pagination',spacing:'spacing-pagination',labels:'part-labels',response:'cloze-scaffold',table:'source-layout',
 diagram:'diagram-arrow',alignment:'alignment',answers:'content',review:'block-role',extension:'content',duplicate:'content',
});

// ---------------------------------------------------------------- categories
// Each pattern scores its weight once. The highest score wins; ties go to the
// earlier category in PRIORITY, and a note matching nothing is content.
const RULES={
 'block-role':[[/\b(make|change|should be|turn)\b[^.]{0,40}\b(a|an|the)\b[^.]{0,40}\b(block|worked example|theory|review|question|key ideas|guided practice|investigation|activity)\b/i,3],[/\bshould be (a|an|the)\b.{0,40}\b(block|example|theory|review|question)\b/i,3],[/\bnot an exercise\b|\bnormal question\b|\bin exercise \d+\b|theory box|worked example header|orange worked example/i,3],[/\bblock role\b|\bkey ideas block\b/i,2]],
 'part-labels':[[/part labels?|question part|restart numbering|restart(s)? at|parts? [a-z] (to|and|-) [a-z]\b|labels? (a|b|\(a\))|separate column of labels|numbering/i,3],[/\blabel(s|led|ling)?\b/i,1]],
 wrapping:[[/\bwrap(s|ped|ping)?\b|on (a )?(single|one) line|single line|one line|line break|spill(s|ing)? (on)?to/i,3]],
 alignment:[[/align(ed|ment)?\b|left[- ]?justif|justif(y|ied)|centre[d]?|center(ed)?\b|\bgutter\b|colons?\b|equals? sign|right[- ]aligned/i,3]],
 'diagram-arrow':[[/\barrows?\b|diagram|\bgraphs?\b|number ?line|tikz|\bticks?\b|\bcrosses\b|\bfigures?\b|measurements? on|annotation/i,3]],
 'cloze-scaffold':[[/cloze|\bdots?\b|\bboxes\b|\bbox\b|scaffold|numerator|denominator|fraction (box|cloze)|placeholder|blank(s)?\b/i,3]],
 'borders-house-style':[[/\bborders?\b|shading|house style|sentence case|colou?r|\bbold\b|\bfont\b|header text|palette|convention|\bblue\b|\borange\b|\bicon\b|symbol/i,3]],
 'spacing-pagination':[[/page break|section break|page boundary|(fit|fits|fitting)\b.{0,30}\b(page|one page)|same page|one page|next page|new page|\bspac(e|ing)\b|vertical(ly)? compact|compact|\bgaps?\b|padding|white ?space|empty space|orphan|too (much|big|large|tall)/i,3]],
 'source-layout':[[/\bsource\b|layout|arrangement|\bcolumns?\b|\bgrid\b|2x2|side[- ]by[- ]side|left column|right column|match(es)? (the )?(first|part|source)|same as part|similar tables|messed up|\bformat(ting)?\b/i,2],[/\btables?\b/i,1]],
 content:[[/\b(answer|solution|incorrect|wrong|typo|missing|suggest|duplicate|repeated|nicer numbers|add (a|an|some)|rounding|exact form|why does)\b/i,1]],
};
const PRIORITY=['block-role','part-labels','wrapping','alignment','diagram-arrow','cloze-scaffold','borders-house-style','spacing-pagination','source-layout','content'];

export function categorise(note='',{overrides={},keys=[]}={}){
 for(const key of keys)if(overrides[key]){
  if(!CATEGORIES.includes(overrides[key]))throw Error(`Override ${key}: unknown category ${overrides[key]}`);
  return {category:overrides[key],basis:'override'};
 }
 const text=String(note).replace(/\s+/g,' ');
 let best=null;
 for(const category of PRIORITY){
  const score=RULES[category].reduce((total,[pattern,weight])=>total+(pattern.test(text)?weight:0),0);
  if(score>0&&(!best||score>best.score))best={category,score};
 }
 return {category:best?.category??'content',basis:best?'keyword':'default'};
}

// ---------------------------------------------------------------- build
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^﻿/,''));
export const loadOverrides=()=>fs.existsSync(OVERRIDES_FILE)?read(OVERRIDES_FILE):{};

// Teacher flags of live projects, then comments only the export still holds.
export function collectComments({projectIds=null}={}){
 const rows=new Map();
 for(const file of fs.readdirSync(PROJECTS).filter(f=>f.endsWith('.json')&&f!=='manifest.json')){
  const id=file.slice(0,-5);if(projectIds&&!projectIds.includes(id))continue;
  const project=read(path.join(PROJECTS,file));
  for(const flag of (project.studio?.flags??[]).filter(isTeacherFlag))rows.set(id+'|'+flag.at,{source:'project-flag',project:id,flagId:flag.id,at:flag.at,resolvedAt:flag.resolvedAt??null,resolved:!!flag.resolved,edition:flag.edition??flag.anchor?.edition??null,targetId:flag.targetId,location:flag.location??'',note:flag.note??'',resolution:flag.resolution??''});
 }
 if(fs.existsSync(COMMENTS_EXPORT))for(const c of read(COMMENTS_EXPORT)){
  if(projectIds&&!projectIds.includes(c.project))continue;
  const key=c.project+'|'+c.at;
  if(!rows.has(key))rows.set(key,{source:'teacher-comments.json',project:c.project,flagId:null,at:c.at,resolvedAt:null,resolved:!!c.resolved,edition:c.edition??null,targetId:c.target,location:'',note:c.note??'',resolution:c.resolution??''});
 }
 return [...rows.values()].sort((a,b)=>a.at<b.at?-1:1);
}

export function buildCase(row,{overrides=loadOverrides(),log=()=>{}}={}){
 const keys=[row.flagId,row.project+'|'+row.at].filter(Boolean);
 const {category,basis}=categorise(row.note,{overrides,keys});
 const c={id:row.flagId??`${row.project}@${row.at}`,...row,category,categoryBasis:basis,before:null,after:null,blockId:null,diff:[],diffCount:0};
 let before=null,after=null;
 try{before=revisionBefore(row.project,row.at);after=revisionAfter(row.project,row.resolvedAt??row.at);}catch(error){c.error=error.message;}
 if(before)c.before={revision:before.revision,updatedAt:before.updatedAt,gapMinutes:Math.round((Date.parse(row.at)-Date.parse(before.updatedAt))/60000)};
 if(after)c.after={revision:after.revision,updatedAt:after.updatedAt,basis:row.resolvedAt?'resolvedAt':'next-revision',live:!!after.live};
 if(before&&after&&row.targetId){
  const owners=ownerIndex(before.project),blockId=owners.get(row.targetId)??ownerIndex(after.project).get(row.targetId)??null;
  c.blockId=blockId;
  if(blockId){
   // Page breaks and exercise starts live on the block they precede, so the scope
   // takes the next block and the first block of each of the next two sections.
   const order=allBlocks(before.project).map(b=>b.id),at=order.indexOf(blockId);
   const sections=before.project.sections??[],home=sections.findIndex(s=>s.blocks?.some(b=>b.id===blockId));
   const scope=[...new Set([blockId,order[at+1],sections[home+1]?.blocks?.[0]?.id,sections[home+2]?.blocks?.[0]?.id].filter(Boolean))];
   const diff=diffFields(before.project,after.project,{blockIds:scope});
   c.diffCount=diff.length;c.diff=diff.slice(0,80);c.scope=scope;
   // A fix that edits the block itself (cloze boxes to dots, wording) changes no layout field.
   const find=(project,id)=>allBlocks(project).find(b=>b.id===id);
   const beforeHash=blockHash(find(before.project,blockId)),afterHash=blockHash(find(after.project,blockId));
   c.content={changed:!!afterHash&&beforeHash!==afterHash,afterHash};
  }
 }
 log(c);
 return c;
}

export function summarise(cases){
 const by=Object.fromEntries(CATEGORIES.map(c=>[c,{cases:0,withSnapshot:0,withFieldDiff:0}]));
 for(const c of cases){const s=by[c.category];s.cases++;if(c.before)s.withSnapshot++;if(c.diffCount)s.withFieldDiff++;}
 return {cases:cases.length,projects:new Set(cases.map(c=>c.project)).size,withSnapshot:cases.filter(c=>c.before).length,withFieldDiff:cases.filter(c=>c.diffCount).length,byCategory:by};
}

export function buildCorpus({projectIds=null,out=DEFAULT_OUT,log=()=>{}}={}){
 const rows=collectComments({projectIds}),overrides=loadOverrides(),cases=[];
 for(const row of rows)cases.push(buildCase(row,{overrides}));
 const corpus={builtAt:new Date().toISOString(),summary:summarise(cases),cases};
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'cases.json'),JSON.stringify(corpus,null,1));
 return corpus;
}

// ---------------------------------------------------------------- detectors
// Sweep rule -> comment categories; also used to credit a block the handoff sweep already fixed.
export const SWEEP_RULE_CATEGORIES={gutter:['alignment'],cloze:['cloze-scaffold'],labels:['part-labels'],empty:['spacing-pagination'],ratio:['cloze-scaffold','borders-house-style'],tables:['source-layout'],breaks:['spacing-pagination'],sequence:['part-labels'],alignment:['alignment']};
// A detector is {name, categories:[...], detect(project, ctx) -> [{blockId, detail}]}.
const registry=new Map();
export function registerDetector(detector){
 if(!detector?.name||typeof detector.detect!=='function'||!detector.categories?.every(c=>CATEGORIES.includes(c)))throw Error('A detector needs a name, known categories and detect()');
 registry.set(detector.name,detector);
}
export const detectors=()=>[...registry.values()];

const eachBlock=(project,fn)=>{const out=[];for(const section of project.sections??[])for(const block of section.blocks??[])for(const hit of fn(block,section)??[])out.push(hit);return out;};

async function registerBuiltIns(){
 const {missingEqualsGutter}=await import('../scripts/booklet/check-equals-gutter.mjs');
 const {dormantAlignment}=await import('../scripts/booklet/check-dormant-alignment.mjs');
 const {restartedPartLabels}=await import('../scripts/booklet/check-part-label-sequence.mjs');
 const {sweepProject,RULES:SWEEP_RULES}=await import('../sweep/rules.mjs');
 registerDetector({name:'equals-gutter',categories:['alignment'],detect:project=>eachBlock(project,block=>missingEqualsGutter(block).map(h=>({blockId:block.id,detail:`${h.needs}: ${h.first} | ${h.second}`})))});
 registerDetector({name:'dormant-alignment',categories:['alignment'],detect:project=>eachBlock(project,block=>dormantAlignment(block,[block.id]).map(h=>({blockId:block.id,detail:`stored ${h.stored}, prints ${h.shown}`})))});
 registerDetector({name:'part-label-sequence',categories:['part-labels'],detect:project=>restartedPartLabels(project).map(f=>({blockId:f.blockId,detail:f.current.join(' ')}))});
 // One sweep per project, split by rule. `breaks` and `tables` are report-only rules.
 const RULE_CATEGORIES=SWEEP_RULE_CATEGORIES;
 const cache=new WeakMap();
 const sweep=project=>{if(!cache.has(project))cache.set(project,sweepProject(project).findings);return cache.get(project);};
 for(const rule of Object.keys(SWEEP_RULES))registerDetector({name:'sweep:'+rule,categories:RULE_CATEGORIES[rule]??['content'],detect:project=>sweep(project).filter(f=>f.rule===rule).map(f=>({blockId:f.blockId,detail:f.detail??f.target}))});
}
// checks/*.mjs files added by later phases export `detectors`.
async function registerPlugins(){
 const dir=path.join(ROOT,'checks');
 if(!fs.existsSync(dir))return [];
 const loaded=[];
 for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.mjs'))){
  const mod=await import(pathToFileURL(path.join(dir,file)).href);
  for(const detector of mod.detectors??[]){registerDetector(detector);loaded.push(detector.name);}
 }
 return loaded;
}
let ready=null;
export const ensureDetectors=()=>ready??=(async()=>{await registerBuiltIns();return registerPlugins();})();

// ---------------------------------------------------------------- replay
export function readBaseline(){
 const fallback={eligible:24,hit:19,partial:1,missed:4,source:'plan (15 October first-pass replay)'};
 try{
  const line=fs.readFileSync(BASELINE_SCORE,'utf8').split(/\r?\n/).find(l=>/^\|\s*Total\s*\|/.test(l));
  const cells=line?.split('|').map(c=>c.trim()).filter(Boolean);
  if(cells&&cells.length>=5)return {eligible:Number(cells[1]),hit:Number(cells[2]),partial:Number(cells[3]),missed:Number(cells[4]),source:path.relative(ROOT,BASELINE_SCORE)};
 }catch{}
 return fallback;
}

// Run every detector once per distinct pre-comment snapshot.
export async function replayCorpus({cases,log=()=>{},snapshots=null}={}){
 await ensureDetectors();
 const registered=detectors(),perSnapshot=new Map();
 const commentedBlocks=new Map();
 for(const c of cases)if(c.blockId){if(!commentedBlocks.has(c.project))commentedBlocks.set(c.project,new Set());commentedBlocks.get(c.project).add(c.blockId);}
 const run=(project,revision)=>{
  const key=project+'@'+revision;
  if(perSnapshot.has(key))return perSnapshot.get(key);
  const snap=snapshots?.(project,revision)??loadRevision(project,revision),findings=[];
  for(const d of registered){
   try{for(const hit of d.detect(snap))findings.push({detector:d.name,categories:d.categories,blockId:hit.blockId,detail:hit.detail});}
   catch(error){findings.push({detector:d.name,categories:d.categories,error:error.message});}
  }
  perSnapshot.set(key,findings);log(key+': '+findings.length+' findings');return findings;
 };
 const results=[];
 for(const c of cases){
  if(!c.before||!c.blockId){results.push({id:c.id,category:c.category,project:c.project,eligible:false,reason:!c.before?'no snapshot before the comment':'target block not found'});continue;}
  const findings=run(c.project,c.before.revision).filter(f=>f.blockId===c.blockId&&!f.error);
  const inCategory=findings.filter(f=>f.categories.includes(c.category));
  results.push({id:c.id,category:c.category,project:c.project,blockId:c.blockId,eligible:true,caught:inCategory.length>0,caughtOnBlock:findings.length>0,detectors:[...new Set(inCategory.map(f=>f.detector))],otherDetectors:[...new Set(findings.filter(f=>!inCategory.includes(f)).map(f=>f.detector))]});
 }
 // Findings on blocks the teacher never commented on in that booklet.
 const detectorStats=Object.fromEntries(registered.map(d=>[d.name,{categories:d.categories,findings:0,onCommentedBlocks:0,offCommentBlocks:0,errors:0,catches:0}]));
 for(const [key,findings] of perSnapshot){
  const project=key.split('@')[0],commented=commentedBlocks.get(project)??new Set();
  for(const f of findings){const s=detectorStats[f.detector];if(f.error){s.errors++;continue;}s.findings++;if(commented.has(f.blockId))s.onCommentedBlocks++;else s.offCommentBlocks++;}
 }
 for(const r of results)for(const name of r.detectors??[])detectorStats[name].catches++;
 const byCategory=Object.fromEntries(CATEGORIES.map(category=>{
  const rows=results.filter(r=>r.category===category),eligible=rows.filter(r=>r.eligible),caught=eligible.filter(r=>r.caught);
  return [category,{cases:rows.length,eligible:eligible.length,caught:caught.length,caughtOnBlock:eligible.filter(r=>r.caughtOnBlock).length,catchPct:eligible.length?Math.round(1000*caught.length/eligible.length)/10:null}];
 }));
 const eligible=results.filter(r=>r.eligible),caught=eligible.filter(r=>r.caught);
 return {replayedAt:new Date().toISOString(),baseline:readBaseline(),detectors:registered.map(d=>d.name),snapshots:perSnapshot.size,
  totals:{cases:results.length,eligible:eligible.length,caught:caught.length,caughtOnBlock:eligible.filter(r=>r.caughtOnBlock).length,catchPct:eligible.length?Math.round(1000*caught.length/eligible.length)/10:null},
  byCategory,detectorStats,results};
}

export function replayMarkdown(report){
 const b=report.baseline,lines=[
  '# Corpus replay',
  '',
  `Baseline (${b.source}): ${b.hit} of ${b.eligible} first-pass comments caught (${Math.round(1000*b.hit/b.eligible)/10}%), ${b.partial} partial, ${b.missed} missed. That replay used the model first-pass review; this one runs only the deterministic detectors.`,
  '',
  `Replayed ${report.totals.cases} cases (${report.totals.eligible} with a snapshot and a located block) on ${report.snapshots} snapshots with ${report.detectors.length} detectors. Caught in category: ${report.totals.caught} (${report.totals.catchPct}%); a finding of any category on the commented block: ${report.totals.caughtOnBlock}.`,
  '',
  '| Category | Cases | Eligible | Caught | Catch % | Any finding on block |','|---|---|---|---|---|---|',
  ...Object.entries(report.byCategory).map(([k,v])=>`| ${k} | ${v.cases} | ${v.eligible} | ${v.caught} | ${v.catchPct??'-'} | ${v.caughtOnBlock} |`),
  '',
  '| Detector | Categories | Findings | On commented blocks | On blocks never commented | Catches | Errors |','|---|---|---|---|---|---|---|',
  ...Object.entries(report.detectorStats).map(([k,v])=>`| ${k} | ${v.categories.join(', ')} | ${v.findings} | ${v.onCommentedBlocks} | ${v.offCommentBlocks} | ${v.catches} | ${v.errors} |`),
  '',
  'Findings on blocks never commented are not all false alarms: the teacher may not have inspected those blocks. Use the column to compare a new rule with the existing ones.',
 ];
 return lines.join('\n')+'\n';
}

async function main(){
 const args=process.argv.slice(2),command=args[0],arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 const out=path.resolve(arg('--out',DEFAULT_OUT)),only=arg('--project')?.split(',')??null;
 if(command==='build'){
  const started=Date.now(),corpus=buildCorpus({projectIds:only,out});
  console.log(JSON.stringify({out:path.join(out,'cases.json'),elapsedSeconds:Math.round((Date.now()-started)/1000),...corpus.summary}));return;
 }
 if(command==='replay'){
  const file=path.join(out,'cases.json');
  if(!fs.existsSync(file))throw Error('Run `node bench/corpus.mjs build` first');
  const cases=read(file).cases.filter(c=>!only||only.includes(c.project));
  const report=await replayCorpus({cases,log:message=>process.stderr.write(message+'\n')});
  fs.writeFileSync(path.join(out,'replay.json'),JSON.stringify(report,null,1));fs.writeFileSync(path.join(out,'replay.md'),replayMarkdown(report));
  console.log(JSON.stringify({out:path.join(out,'replay.json'),baseline:report.baseline,totals:report.totals,byCategory:Object.fromEntries(Object.entries(report.byCategory).map(([k,v])=>[k,`${v.caught}/${v.eligible}`]))}));return;
 }
 throw Error('Usage: node bench/corpus.mjs build|replay [--out DIR] [--project ID[,ID]]');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
