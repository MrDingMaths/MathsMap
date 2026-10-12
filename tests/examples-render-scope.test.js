import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {hashValue} from '../scripts/content/campaign-support.mjs';
import {FRACTION_INK_RULE,FRACTION_INK_BASELINE,hasFractionMath,rendererDependencyCurrent} from '../scripts/content/examples-render-scope.mjs';
import {CAPTURE_STABLE_FRAME_CURRENT,CAPTURE_FRAME_MARGIN_BASELINE} from '../scripts/content/examples-render-scope.mjs';
import {captureGeometryStable,enclosingCaptureClip} from '../scripts/content/examples-capture.mjs';

test('subpixel capture recheck rejects meaningful movement and enclosing clips preserve every edge',()=>{
  const before={left:37.5,top:100,right:352.5,bottom:976};
  assert.equal(captureGeometryStable(before,{...before,bottom:976+1/64}),true);
  assert.equal(captureGeometryStable(before,{...before,top:100+1/16}),true);
  assert.equal(captureGeometryStable(before,{...before,bottom:977}),false);
  assert.equal(captureGeometryStable(before,{...before,left:NaN}),false);
  assert.equal(captureGeometryStable(before,{}),false);
  assert.deepEqual(enclosingCaptureClip({x:37,y:100,width:316,height:876},{x:36,y:100,width:317,height:877}),{x:36,y:100,width:317,height:877,scale:1});
});

test('inspected artifacts survive only the exact enclosing-margin producer change; stability and unrelated edits remain guarded',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'capture-margin-')),file=path.join(root,'scripts/content/examples-capture.mjs');
  const live=fs.readFileSync(new URL('../scripts/content/examples-capture.mjs',import.meta.url),'utf8');
  assert.equal(hashValue(Buffer.from(live)),CAPTURE_STABLE_FRAME_CURRENT);
  const reference={path:'scripts/content/examples-capture.mjs',hash:CAPTURE_FRAME_MARGIN_BASELINE};
  fs.mkdirSync(path.dirname(file),{recursive:true});
  try{
    fs.writeFileSync(file,live);assert.equal(rendererDependencyCurrent(root,reference),true);
    assert.ok(live.includes('captureGeometryStable(first.bounds,settled.bounds)'));
    fs.appendFileSync(file,'\n/* unrelated change */');assert.equal(rendererDependencyCurrent(root,reference),false);
    fs.writeFileSync(file,live.replace('1/16+1e-7','1+1e-7'));assert.equal(rendererDependencyCurrent(root,reference),false);
    fs.writeFileSync(file,live.replace('attempt<3','attempt<4'));assert.equal(rendererDependencyCurrent(root,reference),false);
  }finally{
    assert.equal(path.dirname(fs.realpathSync(root)),fs.realpathSync(os.tmpdir()));assert.ok(path.basename(root).startsWith('capture-margin-'));
    fs.rmSync(root,{recursive:true,force:true});
  }
});

test('fraction scope follows rendered native mathematics and excludes diagram labels',()=>{
  assert.equal(hasFractionMath({question_text:'$\\dfrac{1}{2}$'}),true);
  assert.equal(hasFractionMath({solution_text:'$\\begin{aligned}&\\frac{3}{4}\\\\&=0.75\\end{aligned}$'}),true);
  assert.equal(hasFractionMath({question_text:'$a+b=c$'}),false);
  assert.equal(hasFractionMath({question_text:'[tikz]\\node {$\\frac{1}{2}$};[/tikz]'}),false);
});
test('unaffected render evidence survives only the exact fraction CSS insertion',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'fraction-scope-')),file=path.join(root,'src/components/InlineContent.svelte');
  const live=fs.readFileSync(new URL('../src/components/InlineContent.svelte',import.meta.url),'utf8');
  const before=live.replace(FRACTION_INK_RULE,'');
  assert.equal(hashValue(Buffer.from(before)),FRACTION_INK_BASELINE);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const reference={path:'src/components/InlineContent.svelte',hash:FRACTION_INK_BASELINE};
  const examples=[{solution_text:'$a+b=c$'},{solution_text:'$\\dfrac{1}{2}$'}];
  try{
    fs.writeFileSync(file,before);assert.equal(rendererDependencyCurrent(root,reference,examples,[0,1]),true);
    fs.writeFileSync(file,FRACTION_INK_RULE+before);
    assert.equal(rendererDependencyCurrent(root,reference,examples,[0]),true);
    assert.equal(rendererDependencyCurrent(root,reference,examples,[1]),false);
    assert.equal(rendererDependencyCurrent(root,reference,examples),false);
    fs.appendFileSync(file,'\n/* unrelated edit */');assert.equal(rendererDependencyCurrent(root,reference,examples,[0]),false);
    fs.writeFileSync(file,FRACTION_INK_RULE+FRACTION_INK_RULE+before);assert.equal(rendererDependencyCurrent(root,reference,examples,[0]),false);
  }finally{
    assert.equal(path.dirname(fs.realpathSync(root)),fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('fraction-scope-'));
    fs.rmSync(root,{recursive:true,force:true});
  }
});
