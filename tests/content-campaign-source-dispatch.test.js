import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSourcePreparer } from '../scripts/content/campaign-source-dispatch.mjs';
import { hashValue } from '../scripts/content/campaign-sources.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mathsmap-source-dispatch-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, value) => { const file=path.join(root,name); fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value)); };
  const sourcePath='booklets/mathsmap-sources/Stage 4/Addition.md',text='# Addition\n## Example\nCalculate $8+3$.\n$8+3=11$';
  write(sourcePath,text);
  const overridePath='.agywork/content-campaign/test/source-overrides/first.json';
  const override={skillId:'first',accepted:true,sources:[{path:sourcePath,hash:hashValue(text),startLine:2,endLine:4,locator:'Addition example',support:'direct'}],notes:{scopeBoundary:'Stage 3 addition only.'}};
  write(overridePath,override);
  return {root,write,override,overridePath,sourcePath,input:{assignment:{skillId:'first',assignmentId:'assignment'},state:{scope:{stage:3}}}};
}
test('semantic candidate overrides retain exact evidence and never grant acceptance', t=>{
  const f=fixture(t),prepare=createSourcePreparer({root:f.root,campaignId:'test'}),result=prepare(f.input);
  assert.equal(result.sources[0].support,'indirect');
  const selection=result.sources[0].selection,file=path.join(f.root,selection.path),bytes=fs.readFileSync(file,'utf8'),record=JSON.parse(bytes);
  assert.equal(selection.hash,hashValue(bytes));assert.equal(record.accepted,false);assert.equal(record.evidenceStatus,'candidate-only');
  assert.equal(selection.hints.scopeBoundary,'Stage 3 addition only.');
  assert.deepEqual(prepare(f.input),result);
});
test('source readiness preview is read-only and actual assignment validates fresh evidence again', t=>{
  const f=fixture(t),prepare=createSourcePreparer({root:f.root,campaignId:'test'});
  const preview=prepare.preview(f.input);
  assert.equal(preview.dispatchReady,true);assert.equal(preview.accepted,false);
  assert.equal(fs.existsSync(path.join(f.root,'.agywork/content-campaign/test/first/assignment')),false,'no fake assignment or receipt');
  f.write(f.sourcePath,'Changed after readiness preview.');
  const stale=prepare.preview(f.input);assert.equal(stale.dispatchReady,false);assert.ok(stale.gaps.some(gap=>gap.kind==='stale-source-hash'));
  assert.equal(fs.existsSync(path.join(f.root,'.agywork/content-campaign/test/first/assignment')),false);
  assert.throws(()=>prepare(f.input),/stale-source-hash/);
});
test('readiness scans complete linked figures despite an empty selected image list',t=>{
  const f=fixture(t),text='# Addition\n## Example\nCalculate $8+3$.\n![Required original figure](media/required.png)';
  f.write(f.sourcePath,text);f.override.sources[0].hash=hashValue(text);f.override.sources[0].images=[];f.write(f.overridePath,f.override);
  const prepare=createSourcePreparer({root:f.root,campaignId:'test'}),preview=prepare.preview(f.input);
  assert.equal(preview.dispatchReady,false);assert.ok(preview.gaps.some(gap=>gap.kind==='source-image-gap'&&/Relevant source image missing/.test(gap.reason)));
  assert.equal(fs.existsSync(path.join(f.root,'.agywork/content-campaign/test/first/assignment')),false);
  assert.throws(()=>prepare(f.input),/source-image-gap/);
  const imagePath='booklets/mathsmap-sources/Stage 4/media/required.png';f.write(imagePath,'actual original figure');
  const ready=prepare.preview(f.input);assert.equal(ready.dispatchReady,true);assert.deepEqual(ready.sources[0].images,[{path:imagePath,hash:hashValue('actual original figure')}]);
  f.write(imagePath,'changed before actual assignment');
  f.input.assignment.assignmentId='fresh-assignment'; // Failed real assignments keep their original immutable selection.
  const actual=prepare(f.input);assert.equal(actual.sources[0].images[0].hash,hashValue('changed before actual assignment'),'final assignment validates fresh image bytes rather than cached preview');
});
test('changed or oversized sources are reconciled before any worker dispatch',t=>{
  const f=fixture(t); f.write(f.sourcePath,'Changed source.');
  assert.throws(()=>createSourcePreparer({root:f.root,campaignId:'test'})(f.input),/stale-source-hash/);
  const g=fixture(t);
  assert.throws(()=>createSourcePreparer({root:g.root,campaignId:'test',budgetChars:4})(g.input),/source-budget-exceeded/);
});
test('an assignment preserves its exact candidate selection and unresolved scope stays pending',t=>{
  const f=fixture(t),prepare=createSourcePreparer({root:f.root,campaignId:'test'});prepare(f.input);
  f.override.notes.scopeBoundary='Different teaching assumption.';f.write(f.overridePath,f.override);
  assert.throws(()=>prepare(f.input),/selection changed/);
  const g=fixture(t);g.input.state.scope.pending='No governing dot point.';
  assert.throws(()=>createSourcePreparer({root:g.root,campaignId:'test'})(g.input),/governing-scope-gap/);
});
