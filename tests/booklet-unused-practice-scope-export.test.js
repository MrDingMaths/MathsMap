import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {snapshotFiles,unrelatedPracticeScopeHostChange} from '../scripts/booklet/import-verification-runtime.mjs';
test('practice author guard is excluded only while its importer remains outside print dependencies',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'practice-host-'));fs.mkdirSync(path.join(root,'scripts/booklet'),{recursive:true});fs.mkdirSync(path.join(root,'src'));
 const put=(file,value)=>fs.writeFileSync(path.join(root,file),value),files=()=>snapshotFiles(root,['src','scripts']).map(r=>r.path),guard='scripts/booklet/practice-only-scope.mjs';
 put(guard,'export const validate=()=>true;');put('scripts/booklet/semantic-workflow.mjs',"import {validate} from './practice-only-scope.mjs';");put('src/print.js','export const print=()=>true;');
 assert.equal(files().includes(guard),false);
 const project={source:{reviewProfile:'textbook-three-pass-v1',reviewRoute:'lean-review-v1'}};
 assert.equal(unrelatedPracticeScopeHostChange(guard,project,root,root),true);
 put('src/print.js',"import '../scripts/booklet/semantic-workflow.mjs';");assert.equal(files().includes(guard),true);
 assert.equal(unrelatedPracticeScopeHostChange(guard,project,root,root),false);
 put('src/print.js','export const print=()=>true;');put('scripts/booklet/unknown.mjs',"import './practice-only-scope.mjs';");assert.equal(files().includes(guard),true);
 assert.equal(unrelatedPracticeScopeHostChange(guard,project,root,root),false);
});
