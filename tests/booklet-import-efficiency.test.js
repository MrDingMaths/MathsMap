import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {preflightAuthorAssignment} from '../scripts/booklet/author-assignments.mjs';
import {unrelatedProjectAssetFile} from '../scripts/booklet/import-verification-runtime.mjs';
import {importDiagramPreflight} from '../scripts/booklet/import-diagram-preflight.mjs';
import {solidHash} from '../scripts/audit-solid-visibility.mjs';
import {runLayoutSample} from '../scripts/booklet/lean-visual.mjs';

test('new assignment maths errors stop before caching, native currency remains text',()=>{
 const packet={sections:[{blocks:[{id:'q',content:{prompt:'Solve $x=1$.',answer:{short:'$1$',worked:'$\\frac{1}{$'}}}]}]};
 assert.throws(()=>preflightAuthorAssignment(packet),/Author assignment text repair required/);
 packet.sections[0].blocks[0].content.answer.worked='$x=1$';
 assert.doesNotThrow(()=>preflightAuthorAssignment(packet));
 packet.sections[0].blocks[0].content.prompt={type:'doc',blocks:[{type:'paragraph',inlines:[{type:'text',text:'The cost is $15.'}]}]};
 assert.doesNotThrow(()=>preflightAuthorAssignment(packet));
});

test('diagram preflight keeps exact-hash review and reports unsupported solids before export',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'diagram-preflight-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const code=String.raw`\begin{tikzpicture}% solid prism
 \draw (0,0)--(1,1);\end{tikzpicture}`;
 const project={id:'test',source:{reviewProfile:'textbook-three-pass-v1'},sections:[{phase:'practice',blocks:[{id:'q',type:'question',content:{id:'question',type:'question',prompt:'Find its volume.',questionDiagrams:[{id:'d',format:'tikz',code}],answer:{short:'1',worked:'1'}}}]}]};
 const projectFile=path.join(root,'project.json'),file=path.join(root,'reviews.json');
 fs.writeFileSync(projectFile,JSON.stringify(project));
 assert.equal(importDiagramPreflight(project,{defaultFile:file}).length,1);
 const result=await runLayoutSample({runDir:root,projectId:'test',projectFile,out:path.join(root,'sample')},{exportRuntime:()=>assert.fail('Do not freeze/render a known unsupported solid')});
 assert.equal(result.ok,false);assert.equal(result.diagramIssues.length,1);assert.equal(result.receipt,null);
 fs.writeFileSync(file,JSON.stringify({reviews:{[solidHash(code)]:{status:'accepted',reason:'Independent geometry and visual review'}}}));
 assert.deepEqual(importDiagramPreflight(project,{file}),[]);
 const changed=structuredClone(project);changed.sections[0].blocks[0].content.questionDiagrams[0].code+='\n% changed';
 assert.equal(importDiagramPreflight(changed,{file}).length,1);
 assert.throws(()=>importDiagramPreflight(project,{file:path.join(root,'missing.json')}),/Missing explicit/);
 fs.writeFileSync(file,JSON.stringify({reviews:[]}));
 assert.throws(()=>importDiagramPreflight(project,{file}),/requires an object/);
});

test('private assets from verified Studio masters are unrelated only without references',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'import-efficiency-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.mkdirSync(path.join(root,'booklets/projects'),{recursive:true});
 const owner=path.join(root,'booklets/projects/other-book.json');
 const file='public/booklet-assets/other-book/diagram.png';
 const project={id:'current-book',source:{reviewProfile:'textbook-three-pass-v1'},sections:[]};
 assert.equal(unrelatedProjectAssetFile(file,project,root),false);
 fs.writeFileSync(owner,JSON.stringify({id:'other-book'}));
 assert.equal(unrelatedProjectAssetFile(file,project,root),true);
 for(const src of ['/booklet-assets/other-book/diagram.png','/booklet-assets/other%2Dbook/diagram.png']){
  assert.equal(unrelatedProjectAssetFile(file,{...project,sections:[{src}]},root),false);
 }
 assert.equal(unrelatedProjectAssetFile(file,{...project,id:'other-book'},root),false);
 assert.equal(unrelatedProjectAssetFile('public/booklet-assets/shared/diagram.png',project,root),false);
 assert.equal(unrelatedProjectAssetFile('public/booklet-assets/unknown/diagram.png',project,root),false);
 fs.writeFileSync(owner,JSON.stringify({id:'different-id'}));
 assert.equal(unrelatedProjectAssetFile(file,project,root),false);
 assert.equal(unrelatedProjectAssetFile(file,{id:'current-book'},root),false);
});
