import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {snapshotFiles,unrelatedSourceImportChange,verifyCompletedFrozenExport} from '../scripts/booklet/import-verification-runtime.mjs';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';
import {runLeanExport} from '../scripts/booklet/lean-review.mjs';

const modulePath='src/lib/booklet-source-content.js';
const original='export function sourceReferences(p) {return p.refs;}\nexport function contentProject(candidate) {return candidate;}\n';
function fixture(t,caller="import {sourceReferences} from './lib/booklet-source-content.js';"){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'unused-source-import-')),out=path.join(root,'out'),snapshot=path.join(out,'runtime');
 t.after(()=>{assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));assert(path.basename(root).startsWith('unused-source-import-'));fs.rmSync(root,{recursive:true,force:true});});
 const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
 write(path.join(root,modulePath),original);write(path.join(root,'src/renderer.js'),caller);
 const files=snapshotFiles(root);for(const row of files)write(path.join(snapshot,row.path),fs.readFileSync(path.join(root,row.path)));
 const project={id:'p',reviewProfile:'textbook-three-pass-v1',settings:{},sections:[]},projectFile=path.join(root,'project.json');
 write(projectFile,JSON.stringify(project));write(path.join(out,'runtime-manifest.json'),JSON.stringify({root,snapshot,files}));
 write(path.join(out,'frozen-export-receipt-1.json'),JSON.stringify({status:0,changedDependencies:[modulePath]}));
 const report={};for(const edition of ['student','short','worked','with-short','with-worked']){
  const file=path.join(out,edition+'.pdf');write(file,'checked PDF');report[edition]={projectHash:projectReviewHash(project),issues:[],pageHashes:[{page:1,hash:'page'}],pdf:{path:file,hash:createHash('sha256').update(fs.readFileSync(file)).digest('hex')}};
 }
 write(path.join(out,'report.json'),JSON.stringify({report:{p:report}}));
 return {root,snapshot,project,write,options:{out,projectId:'p',projectFile}};
}
test('unused authoring body edits preserve all checked PDFs, including an in-flight guard rejection',t=>{
 const f=fixture(t);f.write(path.join(f.root,modulePath),original.replace('return candidate;','if(candidate.contentScope)candidate.order="source";return candidate;'));
 assert.equal(unrelatedSourceImportChange(modulePath,f.project,f.root,f.snapshot),true);
 assert.equal(verifyCompletedFrozenExport(f.options).reused,true);
 assert.equal(verifyCompletedFrozenExport({...f.options,artifactReview:true}).reused,true);
});
test('source-review functions, imports, signatures and invalid syntax remain bound',t=>{
 for(const changed of [original.replace('return p.refs;','return [];'),original.replace('contentProject(candidate)','contentProject(candidate,option)'),"import './new-renderer.js';\n"+original,original+'!invalid']){
  const f=fixture(t);f.write(path.join(f.root,modulePath),changed);
  assert.equal(unrelatedSourceImportChange(modulePath,f.project,f.root,f.snapshot),false);
  assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/);
 }
});
test('renderer use, namespace imports and dynamic imports restore the authoring dependency',t=>{
 for(const caller of ["import {contentProject as build} from './lib/booklet-source-content.js';build({});", "import * as source from './lib/booklet-source-content.js';", "const source=await import('./lib/booklet-source-content.js');"]){
  const f=fixture(t,caller);f.write(path.join(f.root,modulePath),original.replace('return candidate;','return {};'));
  assert.equal(unrelatedSourceImportChange(modulePath,f.project,f.root,f.snapshot),false);
  assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/);
 }
});
test('historical profiles and changed frozen bytes stay strict',t=>{
 const f=fixture(t);f.write(path.join(f.root,modulePath),original.replace('return candidate;','return {};'));
 assert.equal(unrelatedSourceImportChange(modulePath,{...f.project,reviewProfile:null},f.root,f.snapshot),false);
 f.write(path.join(f.snapshot,modulePath),original.replace('return p.refs;','return [];'));
 assert.throws(()=>verifyCompletedFrozenExport(f.options),/Frozen renderer changed/);
});
test('checked-export inspection resumes after later renderer edits without rendering again',async t=>{
 const f=fixture(t);f.write(path.join(f.root,modulePath),original.replace('return candidate;','return {...candidate};'));
 f.write(path.join(f.root,'src/renderer.js'),'export const laterEditorFeature=true;');
 assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/);
 let rasterCalls=0;
 await runLeanExport({runDir:f.root,projectFile:f.options.projectFile,projectId:'p',out:f.options.out,resumeCheckedExport:true},{exportRuntime:()=>assert.fail('Do not re-export checked PDF bytes'),rasterize:async()=>{rasterCalls++;return {images:[{page:1,path:'existing-page.png'}]};}});
 assert.equal(rasterCalls,5);
 assert(fs.existsSync(path.join(f.options.out,'visual-plan.json')));
});
