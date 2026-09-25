import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {regressionScopeSignature} from '../scripts/booklet/verification-cache.mjs';
import {recordVerification,PIPELINE_POLICY} from '../scripts/booklet/import-verification.mjs';

const fixture=t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'regression-scope-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const write=(file,content)=>{const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);return target;};
 write('package-lock.json','{}');write('tests/selected.test.js',"import '../scripts/booklet/relevant.mjs';\n");
 write('scripts/booklet/relevant.mjs','export const value = 1;\n');write('scripts/booklet/unrelated-tool.mjs','export const report = 1;\n');
 return {root,write};
};

test('scoped regression evidence follows selected tests and their imported code',t=>{
 const f=fixture(t),scope={testFiles:['tests/selected.test.js']},first=regressionScopeSignature(scope,f.root);
 f.write('scripts/booklet/unrelated-tool.mjs','export const report = 2;\n');assert.equal(regressionScopeSignature(scope,f.root),first);
 f.write('scripts/booklet/relevant.mjs','export const value = 2;\n');assert.notEqual(regressionScopeSignature(scope,f.root),first);
});

test('unknown dynamic imports widen the regression signature',t=>{
 const f=fixture(t);f.write('tests/selected.test.js',"const file = '../scripts/booklet/relevant.mjs'; await import(file);\n");
 const scope={testFiles:['tests/selected.test.js']},first=regressionScopeSignature(scope,f.root);
 f.write('scripts/booklet/unrelated-tool.mjs','export const report = 2;\n');assert.notEqual(regressionScopeSignature(scope,f.root),first);
});

test('explicit support files are dependencies and scope cannot escape the repository',t=>{
 const f=fixture(t);f.write('tests/fixtures/source.json','{"value":1}');
 const scope={testFiles:['tests/selected.test.js'],supportFiles:['tests/fixtures/source.json']},first=regressionScopeSignature(scope,f.root);
 f.write('tests/fixtures/source.json','{"value":2}');assert.notEqual(regressionScopeSignature(scope,f.root),first);
 assert.throws(()=>regressionScopeSignature({testFiles:['../outside.test.js']},f.root),/test selection/);
});

test('scoped regression acceptance requires reviewed coverage and its current signature',t=>{
 const f=fixture(t),artifact=f.write('review.txt','Observed passing test output'),hash=createHash('sha256').update(fs.readFileSync(artifact)).digest('hex');
 const scope={testFiles:['tests/booklet-regression-scope.test.js']},key=regressionScopeSignature(scope),deps={project:'p',renderer:'r',authoring:'a',assessment:'b',regression:'broad'};
 const record={id:'regressions',reviewer:'Fixture reviewer',note:'Selected tests cover the reviewed code path',outcome:'passed',artifacts:[{path:artifact,hash}],
  regressionScope:scope,checks:{coverageReviewed:true},dependencies:{project:'p',renderer:'r',authoring:'a',assessment:'b',regression:key}};
 const state={pipelinePolicy:PIPELINE_POLICY};recordVerification(state,record,deps);assert.equal(state.verification.entries.regressions.dependencies.regression,key);
 assert.throws(()=>recordVerification({pipelinePolicy:PIPELINE_POLICY},{...record,checks:{}},deps),/coverage review/);
 assert.throws(()=>recordVerification({pipelinePolicy:PIPELINE_POLICY},{...record,dependencies:{...record.dependencies,regression:'stale'}},deps),/stale verification dependency/);
});
