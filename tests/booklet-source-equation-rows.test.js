import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from 'katex';
import {alignSourceLeadingEquals} from '../src/lib/booklet-source-equation-rows.js';
import {inspectPresentationFidelity} from '../src/lib/booklet-presentation-verification.js';

test('source continuation alignment supports coloured and fraction rows without changing ordinary equations',()=>{
 for(const row of ['= x^4','\\textcolor{#aa0505}{= x^4}','= \\frac{1}{x^9}']){
  const input='\\begin{aligned}&x^7\\div x^3\\\\[2pt]&'+row+'\\end{aligned}';
  const result=alignSourceLeadingEquals(input);
  assert.match(result,/\\phantom\{\{\}=\{\}\}/);
  assert.equal(alignSourceLeadingEquals(result),result);
  assert.doesNotThrow(()=>katex.renderToString(result,{throwOnError:true}));
 }
 const ordinary='\\begin{aligned}x&=3\\\\y&=4\\end{aligned}';
 assert.equal(alignSourceLeadingEquals(ordinary),ordinary);
});

test('reviewed Index division alignment, red and centred labels reject regressions',async()=>{
 const project=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json'));
 const blocks=project.sections.flatMap(s=>s.blocks);
 for(const id of ['index-teaching-66','index-teaching-67','index-teaching-128']){
  const block=blocks.find(b=>b.id===id);
  const requirements=block.sourceReview.presentationRequirements;
  const req=requirements.find(r=>id.endsWith('128')?r.path.endsWith('/align')&&r.value==='center':String(r.value).includes('\\phantom'));
  assert.ok(req,id);
  const keys=req.path.split('/').filter(Boolean),key=keys.pop();
  const owner=keys.reduce((v,k)=>v[k],block);
  owner[key]=key==='align'?'left':owner[key].replace('\\phantom{{}={}}','');
 }
 const redBlock=blocks.find(b=>b.id==='index-teaching-67');
 assert.ok(redBlock.sourceReview.presentationRequirements.some(r=>String(r.value).includes('#aa0505')));
 const report=await inspectPresentationFidelity(project);
 for(const id of ['index-teaching-66','index-teaching-67','index-teaching-128'])assert.ok(report.issues.some(i=>i.kind==='source-presentation-mismatch'&&i.targetId===id));
});
