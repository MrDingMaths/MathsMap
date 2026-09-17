import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {importPreFinal} from '../scripts/booklet/import-pre-final.mjs';
import {compactWorkflowOutput} from '../scripts/booklet/workflow-output.mjs';

test('pre-final catches the three late Data Visualisation defects while preserving semantic colour and native currency',()=>{
 const original={sections:[{blocks:[{id:'worked',answer:{worked:'There are $40 below this category and $16+12=28$. This is the source answer.'}},{id:'dot-plot-axis',format:'tikz',code:String.raw`\draw[plotBlue,line width=.5pt] (0,0)--(8,0);\draw[plotBlue] (1,1) circle (2pt);`}]}]};
 const failed=importPreFinal(original);
 assert.deepEqual(new Set(failed.issues.map(i=>i.rule)),new Set(['math-delimiter','editorial-aside','graph-axis-colour']));
 const corrected={sections:[{blocks:[{format:'maths-editor-document-v1',blocks:[{type:'paragraph',inlines:[{type:'text',text:'Values below $40.'},{type:'math',latex:'16+12=28'}]}]},{id:'dot-plot-axis',format:'tikz',code:String.raw`\draw[black,line width=.5pt] (0,0)--(8,0);\draw[plotBlue] (1,1) circle (2pt);`}]}]};
 assert.equal(importPreFinal(corrected).ok,true);
 assert.equal(importPreFinal({type:'paragraph',inlines:[{type:'text',text:'Pay $40.'}]}).ok,true);
 assert.equal(importPreFinal({prompt:'Pay $40 and $60 for two items.'}).issues[0].rule,'currency-delimiter');
 assert.equal(importPreFinal({prompt:String.raw`Pay \$40 and calculate $4+2$.`}).ok,true);
});

test('source evidence is excluded; reviewed exceptions are occurrence- and source-hash specific',()=>{
 const project={source:{text:'This is the source answer. $bad'},prompt:'This is the source answer.'},issue=importPreFinal(project).issues[0];
 const review={...issue,reviewer:'Reviewer',reason:'A quoted source comparison is required for this particular activity.'};
 assert.equal(importPreFinal(project,{reviews:[review]}).ok,true);
 assert.equal(importPreFinal({...project,prompt:project.prompt+' Changed.'},{reviews:[review]}).ok,false);
 assert.equal(importPreFinal({prompt:String.raw`$\unknowncommand{3}$`}).issues[0].rule,'math-render');
});

test('CLI output is compact by default while saved JSON and --full retain all detail',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'import-cli-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const input=path.join(dir,'project.json'),out=path.join(dir,'report.json');fs.writeFileSync(input,JSON.stringify({sections:Array.from({length:12},()=>({prompt:'This is the source answer.'}))}));
 const cli=['scripts/booklet/run-workflow.mjs','pre-final','--input',input,'--out',out];
 const compact=spawnSync(process.execPath,cli,{encoding:'utf8'}),saved=JSON.parse(fs.readFileSync(out));
 assert.equal(compact.status,1);const display=JSON.parse(compact.stdout);assert.equal(display.issues.count,12);assert.equal(display.issues.sample.length,6);assert.equal(saved.issues.length,12);
 const full=spawnSync(process.execPath,[...cli,'--full'],{encoding:'utf8'});assert.equal(JSON.parse(full.stdout).issues.length,12);
 const summary=compactWorkflowOutput({targets:[{original:'a'.repeat(10000),corrected:'b'.repeat(10000)}]});
 assert.ok(JSON.stringify(summary).length<300);
});
