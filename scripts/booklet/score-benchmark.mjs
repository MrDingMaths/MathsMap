import fs from 'node:fs';
import path from 'node:path';
const base=path.resolve(process.argv[2]), read=p=>JSON.parse(fs.readFileSync(path.join(base,p))), scores=read('blind-review/scores.json'), key=read('review-key.json'), m=read('benchmark.json');
const expected=m.packets.flatMap(p=>p.pages);
function recoveredMetrics(file,execution){
 if(execution.metrics?.usage)return execution.metrics;
 const folder=path.dirname(file),events=path.join(folder,'events.jsonl'),failed=path.join(folder,'failed-envelope.json');
 if(fs.existsSync(failed)){const e=JSON.parse(fs.readFileSync(failed));if(e.usage)return{usage:e.usage,source:'retained failed envelope',providerDurationSeconds:e.duration_seconds};}
 if(fs.existsSync(events)){const values=fs.readFileSync(events,'utf8').trim().split('\n').flatMap(line=>{try{return[JSON.parse(line)]}catch{return[]}});const last=values.findLast(v=>v.usage);if(last)return{usage:last.usage,source:'retained event stream'};}
 return execution.metrics??null;
}
const records=scores.pages.map(p=>({...p,arm:key[p.sample],counts:Object.fromEntries(['critical','major','minor'].map(s=>[s,p.defects.filter(d=>d.severity===s&&d.owner!=='shared-renderer').length])),sharedDefects:p.defects.filter(d=>d.owner==='shared-renderer').length}));
const totals=m.arms.map(arm=>{
 const pages=records.filter(p=>p.arm===arm.id);
 const available=m.packets.flatMap(p=>{const f=path.join(base,'runs',arm.id,p.id,'candidate.json');return fs.existsSync(f)?JSON.parse(fs.readFileSync(f)).pages.map(p=>p.pageNumber):[];});
 const files=m.packets.flatMap(p=>['reconstruction','diagrams'].map(stage=>({packet:p.id,stage,file:path.join(base,'runs',arm.id,p.id,stage,'execution.json')}))).filter(f=>fs.existsSync(f.file)).map(f=>(()=>{const execution=JSON.parse(fs.readFileSync(f.file));return{...execution,metrics:recoveredMetrics(f.file,execution),packet:f.packet,stage:f.stage}})());
 return{...arm,expectedPages:expected.length,availablePages:available.length,missingPages:expected.filter(n=>!available.includes(n)),reviewedPages:pages.length,initialAccepted:pages.filter(p=>p.accepted).length,critical:pages.reduce((s,p)=>s+p.counts.critical,0),major:pages.reduce((s,p)=>s+p.counts.major,0),minor:pages.reduce((s,p)=>s+p.counts.minor,0),sharedDefects:pages.reduce((s,p)=>s+p.sharedDefects,0),failedJobs:files.filter(f=>f.status==='failed').length,invocations:files.length,wallSeconds:Math.round(files.reduce((s,f)=>s+f.wallMs,0)/100)/10,executions:files.map(f=>({packet:f.packet,stage:f.stage,status:f.status,error:f.error,wallMs:f.wallMs,observedModel:f.observedModel??null,metrics:f.metrics})),cost:null};
});
const commonPages=expected.filter(n=>totals.every(a=>records.some(p=>p.arm===a.id&&p.page===n)));
const commonTotals=totals.map(a=>({arm:a.id,...Object.fromEntries(['critical','major','minor'].map(s=>[s,records.filter(p=>p.arm===a.id&&commonPages.includes(p.page)).reduce((n,p)=>n+p.counts[s],0)]))}));
const report={generatedAt:new Date().toISOString(),complete:!fs.existsSync(path.join(base,'execution.lock'))&&totals.every(a=>a.reviewedPages===a.availablePages)&&m.arms.every(a=>m.packets.every(p=>fs.existsSync(path.join(base,'runs',a.id,p.id,'reconstruction','execution.json')))),expectedCandidates:36,availableCandidates:totals.reduce((n,a)=>n+a.availablePages,0),method:'Anonymous page labels for visual inspection; reviewer also had access to arm-identified diagnostics, raw structures and execution metrics during debugging. This was not a fully blinded independent human trial. One initial attempt per configuration, with no model repairs before scoring. Defect counts are distinct failure families per page, not DOM overflow-element counts. Missing candidates are failures, not zero-defect successes. Comparable fidelity ordering uses only pages available in every arm; full-pilot acceptance requires every requested page to pass.',scoring:scores.method,totals,records,commonPages,commonTotals,commonPageRanking:commonTotals.slice().sort((a,b)=>a.critical-b.critical||a.major-b.major||a.minor-b.minor).map(a=>a.arm),satisfactoryWinner:totals.find(a=>a.initialAccepted===expected.length&&a.failedJobs===0)?.id??null};
fs.writeFileSync(path.join(base,'comparison.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report.totals.map(({executions,...v})=>v),null,2));
