// Run metrics and reuse diagnostics (docs/booklet-import-v2-ch01-efficiency.md, decisions 3 and metrics).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {importRunMetrics} from '../scripts/booklet/import-run-metrics.mjs';
import {pageBlockStamp,pageBlockStampParts,explainVisualReuse} from '../scripts/booklet/lean-visual-evidence.mjs';

const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));};
const turn=(input,cached,output)=>JSON.stringify({type:'turn.completed',usage:{input_tokens:input,cached_input_tokens:cached,output_tokens:output}})+'\n';

test('metrics count every model call, finish calls included, and separate fresh inspections from reuse',t=>{
 const run=fs.mkdtempSync(path.join(os.tmpdir(),'run-metrics-'));t.after(()=>fs.rmSync(run,{recursive:true,force:true}));
 write(path.join(run,'manifest.json'),{createdAt:new Date(Date.now()-60000).toISOString()});
 write(path.join(run,'semantic-packets','page-002.inventory.1','events.jsonl'),turn(100,40,10));
 write(path.join(run,'semantic-packets','assignments','assignment-a','1','events.jsonl'),turn(200,0,20));
 write(path.join(run,'lean-review','calls','content-1794436819222-0','events.jsonl'),turn(50,10,5));
 write(path.join(run,'lean-review','calls','visual-1794437642582-0','events.jsonl'),turn(70,0,7));
 write(path.join(run,'lean-review','calls','visual-1794437642582-0','last-message.txt'),{pages:[{page:1,outcome:'accepted'},{page:2,outcome:'needs-change'}]});
 write(path.join(run,'lean-review','finish','calls','1794437968852-repair-5ov4','events.jsonl'),turn(30,0,3));
 write(path.join(run,'streamlined-exports','1','visual-plan.json'),{student:{pending:[{page:1},{page:3,retainedReviewKey:'k'}]}});
 write(path.join(run,'apply-fixes.mjs'),'// one-off');
 const m=importRunMetrics(run);
 assert.deepEqual(Object.fromEntries(Object.entries(m.modelCalls.byKind).map(([k,v])=>[k,v.calls])),{inventory:1,author:1,content:1,visual:1,'finish-repair':1});
 assert.equal(m.modelCalls.totals.inputTokens,450);assert.equal(m.modelCalls.totals.calls,5);
 assert.deepEqual([m.visual.freshInspections,m.visual.freshAccepted,m.visual.freshNeedsChange,m.visual.pixelRetainedRows],[2,1,1,1]);
 assert.deepEqual(m.scriptsInRunRoot,['apply-fixes.mjs']);
});

test('stamp parts name what changed; reuse diagnostics explain every page to inspect',()=>{
 const project={settings:{a:1},sections:[{id:'s',blocks:[{id:'q1',content:'x'},{id:'q2',content:'y'}]}]};
 const pages=[{page:1,blocks:['q1']},{page:2,blocks:['q2']}];
 const parts=pageBlockStampParts(project,pages,0,{renderer:'r1'}),stamp=pageBlockStamp(project,pages,0,{renderer:'r1'});
 const changed={...project,settings:{a:2}};
 const after=pageBlockStampParts(changed,pages,0,{renderer:'r1'});
 assert.deepEqual(Object.keys(after).filter(k=>after[k]!==parts[k]),['settings']);
 const state={pages:{'student:old':{edition:'student',blocks:['q1'],blockStamp:stamp,blockStampParts:parts,outcome:'accepted',at:'1'}}};
 const plan={student:{automatedIssues:[],pending:[
  {page:1,blocks:['q1'],blockStamp:pageBlockStamp(changed,pages,0,{renderer:'r1'}),blockStampParts:after},
  {page:2,blocks:['q2'],blockStamp:'s2'},
  {page:3,blocks:['q3']},
  {page:4,blocks:['q4'],retainedReviewKey:'k'}]}};
 const r=explainVisualReuse(plan,state);
 assert.deepEqual(r.rows.map(row=>row.decision),['stamp-changed','new-blocks','no-stamp','pixel-retained']);
 assert.deepEqual(r.rows[0].changed,['settings']);assert.equal(r.counts['changed:settings'],1);
});
