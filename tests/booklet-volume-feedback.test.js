import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeArrangement,transformArrangement,group,item} from '../public/libs/maths-editor/arrangement-model.mjs';
import {placeEquationLabels} from '../public/libs/maths-editor/annotated-equation.mjs';
import {dottedQuestionScaffolds} from '../scripts/booklet/normalise-question-scaffolds.mjs';
import fs from 'node:fs';
import {underlinedQuestionScaffolds} from '../public/libs/maths-editor/question-scaffolds.mjs';
import {inspectPresentationFidelity} from '../src/lib/booklet-presentation-verification.js';
import {sourceDifficultyPictograms} from '../src/lib/booklet-difficulty-headings.js';
test('vertical alignment and equal diagram slots survive arrangement normalization',()=>{
 const a={version:1,root:group('row',[{...item('diagram'),verticalAlign:'bottom',minHeight:57}],'row')};
 assert.deepEqual(normalizeArrangement(normalizeArrangement(a)),normalizeArrangement(a));
 assert.equal(normalizeArrangement(a).root.children[0].verticalAlign,'bottom');
 assert.equal(normalizeArrangement(a).root.children[0].minHeight,57);
});
test('a diagram inside an example column aligns within its actual row',()=>{
 const a={version:1,root:group('row',[group('example',[item('diagram')]),item('formula')],'row')};
 const changed=transformArrangement(a,'properties','layout:diagram',{verticalAlign:'bottom'});
 assert.equal(changed.root.children[0].verticalAlign,'bottom');
 assert.equal(changed.root.children[0].children[0].verticalAlign,'bottom');
 assert.equal(a.root.children[0].verticalAlign,undefined);
});
test('formula labels anchor to terms and separate neighbouring labels within the figure',()=>{
 assert.deepEqual(placeEquationLabels([{center:70,width:30}],180),[55]);
 const labels=[{center:70,width:45},{center:95,width:45}],positions=placeEquationLabels(labels,180);
 assert.ok(positions[1]>=positions[0]+45+8);
 assert.ok(positions[0]>=0&&positions[1]+45<=180);
});
test('scaffold migration retains struts, mathematics, source evidence and answers',()=>{
 const blank=String.raw`\underline{\rule{0pt}{4mm}\hspace{8mm}}`;
 const original={content:{prompt:blank+String.raw`+x_1+\underline{x}`},answer:{short:blank},source:{prompt:blank}};
 const {next,records}=dottedQuestionScaffolds(original);
 assert.equal(records.length,1);assert.match(next.content.prompt,/\\rule\{0pt\}\{4mm\}/);
 assert.equal((next.content.prompt.match(/\\ldotp/g)??[]).length,8);
 assert.ok(next.content.prompt.endsWith(String.raw`+x_1+\underline{x}`));
 assert.deepEqual(next.answer,original.answer);assert.deepEqual(next.source,original.source);
 assert.equal(dottedQuestionScaffolds(next).records.length,0);
});

test('presentation readiness rejects reintroduced blanks in plain and structured prompts',async()=>{
 const blank=String.raw`\underline{\hspace{12mm}}`;
 for(const prompt of [blank,{blocks:[{type:'paragraph',inlines:[{type:'math',latex:blank}]}]}]){
  const block={id:'q',type:'question',content:{id:'q-root',prompt}};
  const p={settings:{},sections:[{phase:'practice',blocks:[block]}]};
  const issues=(await inspectPresentationFidelity(p)).issues;
  assert.ok(issues.some(i=>i.kind==='underlined-question-scaffold'&&i.targetId==='q'));
  assert.equal((await inspectPresentationFidelity(dottedQuestionScaffolds(p).next)).complete,true);
 }
});

test('blank detection preserves quoted feedback, evidence and mathematical underlining',()=>{
 const blank=String.raw`\underline{\hspace{12mm}}`;
 const p={content:{prompt:String.raw`\underline{x}+x_1`},answer:{short:blank},source:{text:blank},studio:{flags:[{quote:blank}]},review:{note:blank}};
 assert.deepEqual(underlinedQuestionScaffolds(p),[]);
 assert.deepEqual(dottedQuestionScaffolds(p).next,p);
});

test('current projects and bank questions do not reintroduce underlined writing blanks',()=>{
 const issues=[];
 for(const directory of ['booklets/projects','booklets/question-bank'])for(const file of fs.readdirSync(new URL('../'+directory+'/',import.meta.url)).filter(f=>f.endsWith('.json')&&f!=='manifest.json')){
  const value=JSON.parse(fs.readFileSync(new URL('../'+directory+'/'+file,import.meta.url)));
  for(const field of underlinedQuestionScaffolds(value))issues.push(`${directory}/${file}:${field.location}`);
 }
 assert.deepEqual(issues,[],'Use native dotted scaffolds and the guarded maintenance transaction.');
});

test('presentation readiness rejects source chilli pictograms in rendered content but not in evidence',async()=>{
 const block={id:'q',type:'question',content:{id:'q-root',prompt:'\u{1F336}️ Simplify $2x+3x$.'},sourceReview:{sourcePictograms:[{appearance:'One red chilli \u{1F336}'}]}};
 const p={settings:{},sections:[{phase:'practice',blocks:[block]}]};
 assert.ok((await inspectPresentationFidelity(p)).issues.some(i=>i.kind==='source-difficulty-pictogram'&&i.targetId==='q'));
 block.content.prompt='A chilli sauce recipe uses 3 chillies. Simplify $2x+3x$.';
 assert.equal((await inspectPresentationFidelity(p)).complete,true);
 block.content.questionDiagrams=[{id:'d',src:'evidence/chilli.png',alt:'Red chilli difficulty icon'}];
 assert.deepEqual(sourceDifficultyPictograms(block).map(f=>f.location),['/content/questionDiagrams/0/alt']);
});

test('current projects and bank questions keep source chilli pictograms out of rendered content',()=>{
 const issues=[];
 for(const directory of ['booklets/projects','booklets/question-bank'])for(const file of fs.readdirSync(new URL('../'+directory+'/',import.meta.url)).filter(f=>f.endsWith('.json')&&f!=='manifest.json')){
  const value=JSON.parse(fs.readFileSync(new URL('../'+directory+'/'+file,import.meta.url)));
  for(const field of sourceDifficultyPictograms(value))issues.push(`${directory}/${file}:${field.location}`);
 }
 assert.deepEqual(issues,[],'Record source difficulty pictograms as evidence only; Studio draws chillies from the reasoning score.');
});
