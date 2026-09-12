import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {equationRowSpacing,setEquationRowSpacing,spaceFractionSteps} from '../public/libs/maths-editor/equation-spacing.mjs';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
import {removeDocumentNode} from '../public/libs/maths-editor/document-operations.mjs';
import {hasVisibleContent} from '../src/lib/document-content.js';
import {standaloneDifficultyHeading,retainDifficultyAsMetadata} from '../src/lib/booklet-difficulty-headings.js';
import {inspectPresentationFidelity} from '../src/lib/booklet-presentation-verification.js';
import {flowEditionSections} from '../src/lib/booklet-flow.js';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {fragmentQuestion} from '../src/lib/booklet-pagination.js';
test('equation row controls retain nested arrays, grouped rows, colours and alignment',()=>{
 const latex=String.raw`\color{blue}\begin{aligned}V&=\begin{matrix}1\\2\end{matrix}\\[7 mm]&=\substack{3\\4}\\[7mm]&=5\end{aligned}`;
 assert.deepEqual(equationRowSpacing(latex),{supported:true,mixed:false,valueMm:7});
 const changed=setEquationRowSpacing(latex,3);
 assert.equal(changed,latex.replaceAll('[7 mm]','[3mm]').replaceAll('[7mm]','[3mm]'));
 assert.equal(setEquationRowSpacing(changed,3),changed);
 assert.equal(spaceFractionSteps(changed),changed);
});
test('row control represents mixed and unsupported spacing without guessing',()=>{
 assert.equal(equationRowSpacing(String.raw`\begin{align*}x&=1\\[3mm]&=2\\[7mm]&=3\end{align*}`).mixed,true);
 assert.equal(equationRowSpacing(String.raw`\begin{matrix}1\\2\end{matrix}`).supported,false);
 assert.throws(()=>setEquationRowSpacing('x=1',3));assert.throws(()=>setEquationRowSpacing('x',NaN));
 assert.equal(equationRowSpacing(String.raw`\begin{aligned}x&=1\\[0.3cm]&=2\end{aligned}`).valueMm,3);
});
test('difficulty labels are metadata, while prose and evidence remain content',async()=>{
 const b={id:'tier',type:'rich-text',content:normalizeDocument({blocks:[{type:'paragraph',inlines:[{type:'math',latex:String.raw`\mathbf{FOUNDATION}`}]}]})};
 assert.equal(standaloneDifficultyHeading(b),'Foundation');
 assert.equal(standaloneDifficultyHeading({...b,content:'Discuss the foundation of the building.'}),null);
 const p={settings:{exerciseOrganisation:'topic'},sections:[{id:'s',phase:'practice',blocks:[b]}]};
 assert.ok((await inspectPresentationFidelity(p)).issues.some(i=>i.kind==='printed-difficulty-heading'));
 const fixed=retainDifficultyAsMetadata(b);assert.deepEqual(fixed.content,b.content);
 assert.ok(!(await inspectPresentationFidelity({...p,sections:[{...p.sections[0],blocks:[fixed]}]})).issues.some(i=>i.kind==='printed-difficulty-heading'));
});
test('current compact booklets do not print standalone difficulty labels',()=>{
 for(const file of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){const p=JSON.parse(fs.readFileSync('booklets/projects/'+file));for(const section of flowEditionSections(p,'student'))for(const b of section.blocks)assert.equal(standaloneDifficultyHeading(b),null,file+':'+b.id);}
});
const question={id:'q',type:'question',sourceOrder:1,content:{id:'root',type:'question',label:'1',prompt:'Opening stem',children:[{id:'a',label:'a',prompt:'First part'},{id:'b',label:'b',prompt:'Next part'}]}};
test('generated fragments omit the root number/stem and retain part gutters and content',()=>{
 const stored=resolveArrangement(question).tree;
 const b=fragmentQuestion(question,[{parentId:'root',ids:['b']}],1),arr=resolveArrangement(b);
 assert.equal(arr.entries.get('root/label').value,'');assert.equal(arr.entries.has('root/prompt'),false);
 assert.equal(arr.entries.get('b/label').value,'b');assert.equal(arr.tree.root.inset,7);
 // Real pagination prunes missing parts before applying a saved layout.
 const filtered=structuredClone(stored);filtered.root.children=filtered.root.children.filter(n=>n.ref!=='root/prompt');
 assert.equal(question.content.prompt,'Opening stem');
});
test('source continuations suppress only synthetic stems, retaining new instructions',()=>{
 const q={...question,flow:{continuationOf:'original'},content:{...question.content,prompt:'Question 1 continued.'}};
 assert.equal(resolveArrangement(q).entries.has('root/prompt'),false);
 q.content.prompt='Now explain your reasoning.';
 assert.equal(resolveArrangement(q).entries.get('root/prompt').value,q.content.prompt);
 assert.equal(resolveArrangement({...q,sourceAtom:{kind:'review',id:'review'}}).entries.get('root/label').value,'1');
});
test('deleting the sole break-only paragraph leaves an invisible insertion placeholder',()=>{
 const doc=normalizeDocument({blocks:[{id:'blank',type:'paragraph',preserveEmpty:true,inlines:[{type:'break'}]}]});
 removeDocumentNode(doc,'blank');assert.equal(hasVisibleContent(doc),false);assert.notEqual(doc.blocks[0].id,'blank');
 assert.equal(hasVisibleContent(normalizeDocument(doc)),false);
});
test('native image top spacing survives normalization and rendering',()=>{
 const doc=normalizeDocument({blocks:[{id:'im',type:'image',src:'/x.png',spaceBefore:4}]});
 assert.equal(doc.blocks[0].spaceBefore,4);assert.match(renderDocument(doc),/margin:2mm auto;margin-top:4mm;/);
 assert.deepEqual(normalizeDocument(doc),doc);
});
