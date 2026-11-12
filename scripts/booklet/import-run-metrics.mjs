// Import run metrics for the completion report (import pipeline v2, Stage 13;
// Ch 1 case study decision "completion metrics"). Read-only over a run folder.
// Counts every model call, including the repair and re-check calls finish makes,
// and separates fresh visual inspections from pages accepted on reused evidence.
//   node scripts/booklet/import-run-metrics.mjs --run-id RUN [--out FILE]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const isDir=p=>{try{const s=fs.lstatSync(p);return s.isDirectory()&&!s.isSymbolicLink();}catch{return false;}};
const list=dir=>isDir(dir)?fs.readdirSync(dir):[];
// Call folders hold events.jsonl. Run folders contain junctions to node_modules, which lstat skips.
function callDirs(dir,depth,out=[]){
 for(const name of list(dir)){const child=path.join(dir,name);if(!isDir(child))continue;if(fs.existsSync(path.join(child,'events.jsonl')))out.push(child);else if(depth>0)callDirs(child,depth-1,out);}
 return out;
}
function kindOf(dir,runDir){
 const rel=path.relative(runDir,dir).split(path.sep).join('/');
 if(/inventory/.test(rel))return 'inventory';
 if(/assignments\//.test(rel)||/\.author\./.test(rel))return 'author';
 if(rel.startsWith('lean-review/finish/'))return 'finish-'+path.basename(dir).replace(/^\d+-/,'').replace(/-[a-z0-9]{4}$/,'');
 const name=path.basename(dir);
 if(name.startsWith('sample-'))return 'sample';
 return name.replace(/-\d.*$/,'');
}
function usage(file){
 const total={turns:0,input:0,cached:0,output:0,reasoning:0};
 for(const line of fs.readFileSync(file,'utf8').split('\n')){
  if(!line.includes('turn.completed'))continue;
  try{const event=JSON.parse(line);if(event.type!=='turn.completed')continue;const u=event.usage??{};total.turns++;total.input+=u.input_tokens??0;total.cached+=u.cached_input_tokens??0;total.output+=u.output_tokens??0;total.reasoning+=u.reasoning_output_tokens??0;}catch{}
 }
 return total;
}
const span=dir=>{const stats=list(dir).map(f=>fs.statSync(path.join(dir,f)));return stats.length?[Math.min(...stats.map(s=>s.birthtimeMs)),Math.max(...stats.map(s=>s.mtimeMs))]:null;};
function union(intervals){
 let total=0,end=-Infinity,start=0;
 for(const [a,b] of intervals.slice().sort((x,y)=>x[0]-y[0])){if(a>end){if(end>-Infinity)total+=end-start;start=a;end=b;}else end=Math.max(end,b);}
 return end>-Infinity?total+end-start:0;
}
const readJson=file=>{try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}};

export function importRunMetrics(runDir){
 const calls={},intervals=[],modelIntervals=[];
 for(const dir of [...callDirs(path.join(runDir,'semantic-packets'),2),...callDirs(path.join(runDir,'lean-review'),4)]){
  const kind=kindOf(dir,runDir),u=usage(path.join(dir,'events.jsonl')),s=span(dir);
  const row=calls[kind]??={calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,workerSeconds:0};
  row.calls++;row.inputTokens+=u.input;row.cachedInputTokens+=u.cached;row.outputTokens+=u.output;
  if(s){row.workerSeconds+=Math.round((s[1]-s[0])/1000);intervals.push(s);modelIntervals.push(s);}
 }
 const events=fs.existsSync(path.join(runDir,'workflow','run-events.jsonl'))?fs.readFileSync(path.join(runDir,'workflow','run-events.jsonl'),'utf8').split('\n').filter(Boolean).map(line=>{try{return JSON.parse(line);}catch{return null;}}).filter(Boolean):[];
 const started=new Map(),exports=[];
 for(const event of events){
  if(event.event==='phase-started')started.set(event.id,event);
  else if(event.event==='phase-finished'&&started.has(event.id)){const begin=started.get(event.id);if(begin.phase==='render-export'){intervals.push([begin.time,event.time]);exports.push({at:begin.at,seconds:Math.round((event.time-begin.time)/1000),ok:event.ok,editions:begin.details?.editions?.length??0,development:!!begin.details?.development,draft:!!begin.details?.draft});}}
 }
 // Visual evidence: fresh inspections are pages sent to a reviewer; the rest of a plan was reused.
 let fresh=0,accepted=0,needsChange=0;
 for(const dir of callDirs(path.join(runDir,'lean-review','calls'),0).filter(d=>path.basename(d).startsWith('visual-'))){
  const result=readJson(path.join(dir,'last-message.txt'));for(const page of result?.pages??[]){fresh++;page.outcome==='accepted'&&!page.findings?.length?accepted++:needsChange++;}
 }
 const finishExports=list(path.join(runDir,'streamlined-exports')).filter(n=>/^\d+$/.test(n)).sort((a,b)=>a-b);
 let pixelRetained=0,stampCarried=0;
 for(const n of finishExports){const plan=readJson(path.join(runDir,'streamlined-exports',n,'visual-plan.json'));for(const entry of Object.values(plan??{}))for(const row of entry.pending??[]){if(row.retainedReviewKey)pixelRetained++;if(row.carriedReviewKey)stampCarried++;}}
 // Reviewer verdicts a person overrode (lean-review decide-page), reported, never hidden.
 const decisionsFile=path.join(runDir,'lean-review','page-decisions.jsonl');
 const decisions=fs.existsSync(decisionsFile)?fs.readFileSync(decisionsFile,'utf8').split('\n').filter(Boolean).length:0;
 const manifest=readJson(path.join(runDir,'manifest.json'));
 const first=[manifest?.createdAt?Date.parse(manifest.createdAt):Infinity,...intervals.map(i=>i[0])].reduce((a,b)=>Math.min(a,b),Infinity),last=intervals.reduce((a,i)=>Math.max(a,i[1]),0);
 const scripts=list(runDir).filter(name=>/\.(?:mjs|js|cjs|ps1|py)$/.test(name));
 const totals=Object.values(calls).reduce((t,r)=>({calls:t.calls+r.calls,inputTokens:t.inputTokens+r.inputTokens,cachedInputTokens:t.cachedInputTokens+r.cachedInputTokens,outputTokens:t.outputTokens+r.outputTokens,workerSeconds:t.workerSeconds+r.workerSeconds}),{calls:0,inputTokens:0,cachedInputTokens:0,outputTokens:0,workerSeconds:0});
 return {
  runId:path.basename(runDir),
  time:{elapsedMinutes:+((last-first)/60000).toFixed(1),activeMinutes:+(union(intervals)/60000).toFixed(1),modelActiveMinutes:+(union(modelIntervals)/60000).toFixed(1),summedWorkerMinutes:+(totals.workerSeconds/60).toFixed(1)},
  modelCalls:{byKind:calls,totals},
  exports:{finish:finishExports.length,all:exports.filter(e=>!e.development),targetedRenders:exports.filter(e=>e.development).length},
  visual:{freshInspections:fresh,humanPageDecisions:decisions,freshAccepted:accepted,freshNeedsChange:needsChange,pixelRetainedRows:pixelRetained,stampCarriedRows:stampCarried,note:'A final gate pagesAccepted counts accepted pages on fresh and reused evidence; it is not a count of inspections.'},
  scriptsInRunRoot:scripts,
 };
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const arg=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];};
 const runId=arg('--run-id');if(!runId)throw Error('Use --run-id RUN [--out FILE]');
 const metrics=importRunMetrics(path.resolve('.booklet-work/full-imports',runId));
 if(arg('--out'))fs.writeFileSync(arg('--out'),JSON.stringify(metrics,null,2)+'\n');
 console.log(JSON.stringify(metrics,null,2));
}
