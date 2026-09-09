import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDocument,renderDocument,template,toSource,exportSource} from '../public/libs/maths-editor/document-model.mjs';
import {renderMath} from '../src/lib/render-math.js';
import {presentationVerificationKey,inspectPresentationFidelity} from '../src/lib/booklet-presentation-verification.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import fs from 'node:fs';

test('source pagination policy survives project save normalization',()=>{
 const p=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json'));
 p.settings.sourcePaginationPolicy='source-boundaries';p.settings.preserveSourcePages=true;
 const normalized=normalizeEditableProject(p);assert.equal(normalized.settings.sourcePaginationPolicy,'source-boundaries');assert.equal(normalized.settings.preserveSourcePages,true);
});
test('source p34 formulas have their own i–l labels and p18 has no duplicate raster row',()=>{
 const p=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json')),blocks=p.sections.flatMap(s=>s.blocks);
 const parts=blocks.find(b=>b.id==='index-t6-q5').content.children.slice(8);
 assert.deepEqual(parts.map(n=>[n.label,n.questionDiagrams.map(d=>d.id)]),[['i',['index-doc-1055']],['j',['index-doc-1056']],['k',['index-doc-1057']],['l',['index-doc-1058']]]);
 const q=blocks.find(b=>b.id==='index-t3-q3').content;assert.equal(q.questionDiagrams.length,0);assert.equal(q.children[0].children.length,5);
});

test('source text and mathematics colours survive storage and render safely',()=>{
 const doc=normalizeDocument({blocks:[{type:'paragraph',inlines:[{type:'text',text:'✓',colour:'#196b24'},{type:'text',text:'✗',colour:'#c00000'},{type:'math',latex:'x^7',colour:'#0080ff'}]}]});
 assert.deepEqual(normalizeDocument(JSON.parse(JSON.stringify(doc))),doc);
 const html=renderDocument(doc);for(const c of ['#196b24','#c00000','#0080ff'])assert.ok(html.includes('color:'+c));
 assert.ok(exportSource(doc).losses.some(l=>l.type==='colour'));
 const invalid=normalizeDocument({blocks:[{type:'paragraph',inlines:[{type:'text',text:'safe',colour:'red;display:none'}]}]});assert.equal(invalid.blocks[0].inlines[0].colour,undefined);
});
test('speech template has editable native content, image association and configurable tail',()=>{
 const bubble=template('speech-bubble');bubble.slots[1].blocks[0].inlines=[{type:'text',text:'The answer is '},{type:'math',latex:'w^4'}];
 const doc=normalizeDocument({blocks:[bubble]});assert.equal(doc.blocks[0].tail,'left');
 for(const tail of ['left','right','none']){
  doc.blocks[0].tail=tail;const html=renderDocument(doc,{editable:true});assert.ok(html.includes(`data-tail="${tail}"`));assert.ok(html.includes('data-slot='));assert.ok(html.includes('<math-field>w^4</math-field>'));
 }
 assert.match(toSource(doc),/The answer is/);assert.deepEqual(normalizeDocument(doc),doc);
});
test('eight cards stay on their reviewed row and preserve editable values',()=>{
 const card=template('cards');card.columns=8;card.slots=Array.from({length:8},(_,i)=>({id:'s'+i,blocks:[{id:'p'+i,type:'paragraph',inlines:[{type:'math',latex:String(i)}]}]}));
 const doc=normalizeDocument({blocks:[card]});assert.equal(doc.blocks[0].columns,8);assert.equal((renderDocument(doc).match(/data-slot=/g)||[]).length,8);
});
test('mixed theory cells opt into paragraph alignment without changing legacy tables',()=>{
 const cell={id:'cell',align:'center',blocks:[{id:'prose',type:'paragraph',align:'left',inlines:[{type:'text',text:'When the numerator is larger'}]}]};
 const table={id:'table',type:'table',rows:[[cell]]};assert.match(renderDocument({blocks:[table]}),/data-id="prose"[^>]+text-align:center/);
 cell.preserveParagraphAlignment=true;assert.match(renderDocument({blocks:[table]}),/data-id="prose"[^>]+text-align:left/);
});
test('physical writing boxes and upright labels render in fraction and exponent positions',()=>{
 const blank=String.raw`\boxed{\rule{0pt}{4mm}\hspace{4mm}}`;
 const html=renderMath(`$\\frac{5\\times${blank}}{${blank}}=5^{${blank}}$`);assert.ok(!html.includes('katex-error'));assert.match(html,/fbox/);
 assert.ok(!renderMath(String.raw`$\frac1{\text{base}^n}$`).includes('katex-error'));
});
test('source group, colour and boundary requirements produce actionable findings',async()=>{
 const b={id:'b',type:'rich-text',sourcePageNumber:3,flow:{sourcePageBreakBefore:true},sourceAtom:{id:'g',kind:'identify',label:'Simplify'},content:'Example',sourceReview:{headerOwnedByTemplate:true,teachingGroup:{id:'g',kind:'identify',label:'Simplify'},sourcePagination:{page:3,breakBefore:true},presentationRequirements:[{path:'/content',value:'Example'}]}};
 const p={settings:{teachingPresentationVersion:1,sourcePaginationPolicy:'source-boundaries',preserveSourcePages:true},sections:[{phase:'teaching',blocks:[b]}]};
 const first=await presentationVerificationKey(b,null,p.settings);
 b.sourceAtom.kind='example';b.content='Replacement';b.flow.sourcePageBreakBefore=false;
 assert.notEqual(await presentationVerificationKey(b,null,p.settings),first);
 const kinds=(await inspectPresentationFidelity(p)).issues.map(i=>i.kind);for(const k of ['source-teaching-group-mismatch','source-presentation-mismatch','source-page-boundary-mismatch'])assert.ok(kinds.includes(k));
 assert.notEqual(await presentationVerificationKey(b,null,p.settings),await presentationVerificationKey(b,null,{...p.settings,preserveSourcePages:false}));
});
test('an inventoried source cannot pass visual review on counts or a signature alone',async()=>{
 const p={settings:{teachingPresentationVersion:1},source:{inventory:{entries:[]}},sections:[{phase:'practice',blocks:[{id:'b',type:'rich-text',content:'Text',sourceReview:{}}]}]};
 assert.ok((await inspectPresentationFidelity(p)).issues.some(i=>i.kind==='unchecked-source-visuals'));
});
test('source boundaries across teaching groups stay separate while same-page sections join',async()=>{
 const b=(id,page,breakBefore=false)=>({id,type:'rich-text',content:'Text',sourcePageNumber:page,flow:{sourcePageBreakBefore:breakBefore}});
 const p={settings:{paginationMode:'flexible',layoutOverrides:{blockLayouts:{}}},topics:[{id:'t',title:'Topic'}],sections:[{id:'s1',topicId:'t',phase:'teaching',blocks:[b('a',3),b('b',4,true)]},{id:'s2',topicId:'t',phase:'teaching',pageBreakBefore:false,blocks:[b('c',4)]},{id:'s3',topicId:'t',phase:'teaching',pageBreakBefore:false,blocks:[b('d',5,true)]}]};
 const result=await paginateFlow(p,'student',async page=>({height:page.blocks.length*10,capacity:100}));assert.deepEqual(result.pages.map(p=>p.blocks.map(b=>b.id)),[['a'],['b','c'],['d']]);
});
