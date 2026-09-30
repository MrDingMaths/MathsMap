import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readSolidVisibilityReviews} from '../scripts/booklet/check-compact-exercises.mjs';
import {solidAcceptance,solidHash} from '../scripts/audit-solid-visibility.mjs';
import {solidTikz,prismModel} from '../src/lib/solid-geometry.js';
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-visibility-input-'));
 t.after(()=>{assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));assert(path.basename(dir).startsWith('mathsmap-visibility-input-'));fs.rmSync(dir,{recursive:true,force:true});});
 return path.join(dir,'reviews.json');
}
test('default visibility input retains historical register and absent-default behaviour',t=>{
 const file=fixture(t),reviews={hash:{status:'accepted',reason:'Existing reviewed source'}};
 assert.deepEqual(readSolidVisibilityReviews({defaultFile:file}),{reviews:{},artifact:null});
 fs.writeFileSync(file,JSON.stringify({reviews}));
 const value=readSolidVisibilityReviews({defaultFile:file});assert.deepEqual(value.reviews,reviews);assert.equal(value.artifact.path,file);assert.equal(value.artifact.hash.length,64);
});
test('explicit visibility files fail closed when missing, malformed or omitted',t=>{
 const file=fixture(t);assert.throws(()=>readSolidVisibilityReviews({file}),/Missing explicit/);
 for(const invalid of [{}, {reviews:[]}, {reviews:null}]){fs.writeFileSync(file,JSON.stringify(invalid));assert.throws(()=>readSolidVisibilityReviews({file}),/object named reviews/);}
 assert.throws(()=>readSolidVisibilityReviews({file:'--out'}),/requires a review JSON file/);
 assert.throws(()=>readSolidVisibilityReviews({file:''}),/requires a review JSON file/);
});
test('run-local visibility decisions remain exact-code bound and cannot forgive solid defects',t=>{
 const file=fixture(t),plane=String.raw`% solid curve
\begin{tikzpicture}\draw (0,0)--(1,1);\end{tikzpicture}`;
 const value=code=>({diagram:{format:'tikz',code}});
 assert.equal(solidAcceptance(value(plane)).length,1);
 const defective=solidTikz(prismModel([[0,0],[3,0],[3,2],[0,2]])).replace(/\\draw\[dashed\]/,'\\draw');
 fs.writeFileSync(file,JSON.stringify({reviews:{[solidHash(plane)]:{status:'accepted',reason:'Actual planar xy graph review'},[solidHash(defective)]:{status:'accepted',reason:'A review must not override a defect'}}}));
 const {reviews}=readSolidVisibilityReviews({file});
 assert.equal(solidAcceptance(value(plane),reviews).length,0);
 assert.equal(solidAcceptance(value(plane+'\n% changed'),reviews).length,1);
 assert.equal(solidAcceptance(value(defective),reviews)[0].status,'defect');
 assert.equal(readSolidVisibilityReviews({file}).artifact.hash,readSolidVisibilityReviews({file}).artifact.hash);
});
