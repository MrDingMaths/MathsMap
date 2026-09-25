// Evidence summary only; missing review never becomes a quality pass.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {report} from './benchmark-models.mjs';
const index=process.argv.indexOf('--run-dir');
if(index<0)throw Error('Use --run-dir DIR');
const dir=path.resolve(process.argv[index+1]);
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const optional=f=>fs.existsSync(f)?read(f):null;
const protocol=read(path.join(dir,'protocol.json'));
const measured=report(dir);
const union=rows=>{
 const intervals=rows.map(r=>[Date.parse(r.startedAt),Date.parse(r.endedAt)]).filter(v=>v.every(Number.isFinite)).sort((a,b)=>a[0]-b[0]);
 let total=0,start=null,end=null;
 for(const [a,b] of intervals){if(start===null){start=a;end=b;}else if(a<=end)end=Math.max(end,b);else{total+=end-start;start=a;end=b;}}
 return total+(start===null?0:end-start);
};
const samples=[];
for(const arm of protocol.arms)for(const sample of protocol.samples){
 const base=path.join(dir,arm.id,sample.id),validation=optional(path.join(base,'project-validation.json'));
 const render=optional(path.join(base,'editions/render-report.json'));
 samples.push({arm:arm.id,sample:sample.id,title:sample.title,page:sample.page,materialized:fs.existsSync(path.join(base,'project.json')),projectValidation:validation?{valid:validation.valid,errors:validation.errors,warnings:validation.warnings}:null,
  stages:measured.records.filter(r=>r.arm===arm.id&&r.sample===sample.id),
  renders:render?.reports?.map(r=>({edition:r.edition,status:r.status,pages:r.dom?.pages?.length,pdf:!!r.pdf,qaIssues:r.qa?.flatMap(p=>p.issues??[]).length,navigation:r.navigation??null,error:r.error??r.rasterOrNavigationError??r.pdfQaError??null})),
  review:optional(path.join(base,'review.json'))});
}
const timeline=measured.records.flatMap(r=>[{at:Date.parse(r.startedAt),delta:1,arm:r.arm},{at:Date.parse(r.endedAt),delta:-1,arm:r.arm}]).sort((a,b)=>a.at-b.at||a.delta-b.delta);
let active=0,maxActive=0;const counts=new Map(),overlaps=[];
for(const e of timeline){active+=e.delta;maxActive=Math.max(maxActive,active);counts.set(e.arm,(counts.get(e.arm)??0)+e.delta);if(counts.get(e.arm)>1)overlaps.push(e);}
const parity=protocol.samples.map(sample=>{
 const rows=measured.records.filter(r=>r.sample===sample.id&&r.stage==='inventory');
 return {sample:sample.id,calls:rows.length,identicalPrompt:new Set(rows.map(r=>r.promptHash)).size<=1,identicalImages:new Set(rows.map(r=>JSON.stringify(r.imageHashes.map(i=>i.hash)))).size<=1};
});
const summary=measured.summary.map(arm=>{
 const rows=samples.filter(r=>r.arm===arm.arm),calls=measured.records.filter(r=>r.arm===arm.arm);
 return {...arm,activeCallWallMs:union(calls),materialized:rows.filter(r=>r.materialized).length,validProjects:rows.filter(r=>r.projectValidation?.valid).length,
  renderedEditions:rows.reduce((n,r)=>n+(r.renders?.filter(e=>e.pdf).length??0),0),reviewedSamples:rows.filter(r=>r.review?.complete&&!r.review?.cancelled).length,
  attemptedEditions:rows.reduce((n,r)=>n+(r.renders?.length??0),0),emptyEditions:rows.reduce((n,r)=>n+(r.renders?.filter(e=>e.status==='rendered'&&!e.pdf&&e.pages===0).length??0),0),
  measuredReviewMs:rows.reduce((n,r)=>n+(r.review?.elapsedMs??0),0),reviewsWithoutTiming:rows.filter(r=>r.review?.complete&&!r.review?.cancelled&&r.review.elapsedMs==null).length,
  successfulCalls:calls.filter(r=>!r.error).length,
  samplesWithBlockingIssues:rows.filter(r=>r.review?.issues?.some(i=>i.severity==='blocking')).length,
  blockingDefectCategories:rows.reduce((n,r)=>n+(r.review?.issues?.filter(i=>i.severity==='blocking').length??0),0),
  majorDefectCategories:rows.reduce((n,r)=>n+(r.review?.issues?.filter(i=>i.severity==='major').length??0),0),
  samplesWithMajorIssues:rows.filter(r=>r.review?.issues?.some(i=>['major','blocking'].includes(i.severity))).length};
});
const result={at:new Date().toISOString(),protocolHash:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'protocol.json'))).digest('hex'),
 executionComplete:fs.existsSync(path.join(dir,'execution-end.json')),reviewComplete:samples.every(s=>s.review?.complete),summary,samples,
 environment:optional(path.join(dir,'environment.json')),runtimeInterruption:optional(path.join(dir,'runtime-interruption.json')),userStop:optional(path.join(dir,'user-stop.json')),
 audit:{maxActive,perArmOverlaps:overlaps,inventoryParity:parity,activeCallWallMs:union(measured.records)},note:measured.note};
fs.writeFileSync(path.join(dir,'comparison.json'),JSON.stringify(result,null,2));
const minutes=n=>(n/60000).toFixed(1),num=n=>typeof n==='number'?n.toLocaleString('en-AU'):'unknown';
const lines=[`# ${protocol.arms.length===2?'Paired':protocol.arms.length===4?'Four-way':protocol.arms.length+'-arm'} GPT-6 first-pass transcription comparison`,'',`Evidence updated ${result.at}. ${result.userStop?'Luna stopped at user request; Astra Low, Astra High and Sol completed. Interrupted and unstarted calls are not model failures.':result.executionComplete?'Model execution ended.':'Model execution is still in progress.'} No candidates are release accepted.`,'',
 '| Setting | Calls | Valid inventory | Valid author packets | Valid projects | PDF editions | Reviewed samples | Major/blocking samples | Timeouts | Call minutes | Active call minutes | Input / cached / output tokens | Missing usage |',
 '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|'];
for(const s of summary){const u=s.observedTokenTotals;lines.push(`| ${s.arm} | ${s.calls}/20 | ${s.validInventories}/10 | ${s.validAuthors}/10 | ${s.validProjects}/10 | ${s.renderedEditions}/50 | ${s.reviewedSamples}/10 | ${s.samplesWithMajorIssues} observed | ${s.timeouts} | ${minutes(s.elapsedCallMs)} | ${minutes(s.activeCallWallMs)} | ${num(u.input_tokens)} / ${num(u.cached_input_tokens)} / ${num(u.output_tokens)} | ${s.missingUsage} |`);}
lines.push('','## Interpretation','', result.reviewComplete?'All sample outcomes have a recorded substantive review or failure audit. Counts of valid packets and PDFs are not fidelity scores. See the recorded interpretation and page-level defects.':'Quality conclusions remain pending until the recorded source, mathematics and rendered-page reviews are complete. Counts of valid packets and PDFs are not fidelity scores. Observed defects are lower bounds while review is incomplete.', '',
 'Input includes cached input; output includes reasoning tokens. These components must not be added twice. Missing usage is unknown. Timings distinguish summed call duration from the union of active call intervals; neither includes all setup, review or export labour. Requested model settings are recorded; a missing independently observed model ID remains unknown.', '',
 'One trial per page/model, no repairs, retries or model substitution. Current prompts and teaching references differ from the historical trial, so historical figures are context only. No subscription savings or monetary costs are inferred.','',
 '## Protocol audit','',`Measured maximum simultaneous completed-call intervals: ${maxActive}; same-arm overlaps: ${overlaps.length}. Inventory prompt and image parity: ${parity.every(p=>p.identicalPrompt&&p.identicalImages)?'consistent across observed calls':'FAILED'}. In-flight calls are not included until their metrics are saved.`, '',
 'Evidence: [protocol audit](protocol-audit.json), [usage and review integrity audit](evidence-integrity.json), [checks](checks.json), [source review](source-review.md) and [review conventions](review-conventions.md).', '',
 '## Page-level observations','');
lines.splice(lines.indexOf('## Page-level observations'),0,'## Export and review accounting','',
 ...summary.map(s=>`- ${s.arm}: ${s.attemptedEditions} edition attempts, ${s.renderedEditions} PDFs, ${s.emptyEditions} empty editions; ${minutes(s.measuredReviewMs)} summed recorded review-interval minutes (may overlap/include waiting; not active effort), ${s.reviewsWithoutTiming} completed reviews without timing.`),'',
 'Teaching-only samples legitimately have no standalone practice answers. Empty editions are recorded separately from PDF failures. Review time sums recorded reviewer intervals, which can overlap across workers; it is not active human labour or model billing. Untimed reviews and untimed setup remain unknown. Supplemental teaching displays are diagnostic exports outside the five-edition count.','');
lines.splice(lines.indexOf('## Page-level observations'),0,
 `All-arm active generation wall time: ${minutes(result.audit.activeCallWallMs)} minutes. Summed call time: ${minutes(summary.reduce((n,s)=>n+s.elapsedCallMs,0))} minutes. Setup elapsed time: ${result.environment?.setupElapsedMs==null?'unknown':minutes(result.environment.setupElapsedMs)+' minutes'}.`, '',
 ...summary.map(s=>`- ${s.arm}: ${s.successfulCalls} successful calls; ${s.samplesWithBlockingIssues} samples with blocking defects; ${s.blockingDefectCategories} blocking and ${s.majorDefectCategories} major defect categories.`), '',
 ...(result.runtimeInterruption?['## Runtime interruption and parity recovery','',result.runtimeInterruption.reason,'',result.runtimeInterruption.recovery,'',result.runtimeInterruption.rendererLimit,'',result.runtimeInterruption.fontIncident,'','Evidence: `runtime-interruption.json`, `renderer-signature-recovery.json` and `renderer-pixel-revalidation.json`. No generation call was repeated and no candidate was repaired. Recovery active-work time remains unknown.','']:[]));
for(const row of samples){lines.push(`### ${row.arm} — ${row.sample}: ${row.title} p${row.page}`,'');
 const evidenceBase=`${row.arm}/${row.sample}`;
 const evidenceLinks=[['review','review.json'],['raw author output','author/last-message.txt'],['author events','author/events.jsonl'],['project validation','project-validation.json']].filter(([,file])=>fs.existsSync(path.join(dir,evidenceBase,file))).map(([label,file])=>`[${label}](${evidenceBase}/${file})`);
 if(evidenceLinks.length)lines.push(`Evidence: ${evidenceLinks.join(', ')}.`,'');
 const pdfLinks=(row.renders??[]).filter(r=>r.pdf).map(r=>`[${r.edition}](${evidenceBase}/editions/${r.edition}.pdf)`);
 if(pdfLinks.length)lines.push(`PDFs: ${pdfLinks.join(', ')}.`,'');
 if(row.review){lines.push(row.review.observation??'Review record present.','');for(const issue of row.review.issues??[])lines.push(`- **${issue.severity} (${issue.category}):** ${issue.note}`);}
 else lines.push('Substantive review pending.');
 for(const r of row.stages)if(r.error||!r.validation?.valid)lines.push(`- ${r.stage}: ${r.error??r.validation?.error}`);
 if(row.projectValidation&&!row.projectValidation.valid)lines.push(`- Project validation failed: ${JSON.stringify(row.projectValidation.errors)}`);
 for(const r of row.renders??[])if(r.error){const message=r.error.includes('Mathematics failed to render')?'Mathematics failed to render':r.error.includes('Layout failed')?'Layout failed — edits retained':String(r.error).replace(/\s+/g,' ').slice(0,240);lines.push(`- ${r.edition}: ${message}. [Raw render evidence](${evidenceBase}/editions/render-report.json).`);}
 lines.push('');
}
const interpretation=path.join(dir,'interpretation.md');
if(fs.existsSync(interpretation))lines.splice(lines.indexOf('## Interpretation')+2,0,fs.readFileSync(interpretation,'utf8'),'');
if(fs.existsSync(path.join(dir,'astra-comparison.md')))lines.splice(lines.indexOf('## Interpretation')+2,0,'[Direct Astra Low versus High comparison](astra-comparison.md).','');
fs.writeFileSync(path.join(dir,'REPORT.md'),lines.join('\n'));
console.log(JSON.stringify({executionComplete:result.executionComplete,summary,audit:result.audit},null,2));
