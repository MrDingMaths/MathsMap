import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPresentationFidelity,presentationVerificationKey} from '../src/lib/booklet-presentation-verification.js';
import {contentVerificationKey} from '../src/lib/booklet-content-verification.js';
import {inspectContentCoverage} from '../src/lib/booklet-content-verification.js';
import {documentHtml,normalizeDocument} from '../src/lib/document-content.js';
import {creationSettings} from '../src/lib/booklet-creation.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {teachingQuestionMode,blockClozeAnswers} from '../src/lib/booklet-answer-options.js';
import fs from 'node:fs';

const fixture=()=>({settings:creationSettings(),source:{sourceHashes:{pdf:'source'}},sections:[{phase:'teaching',blocks:[{
 id:'guided',type:'question',pedagogyRole:'guided-practice',sourceRefs:[{pageNumber:3}],content:{id:'root',prompt:'Guided Practice',layout:'grid',columns:2,children:[{id:'a',prompt:'$x^2x^3$',answerSpaceMm:14}]}
}]}]});
test('untemplated teaching, duplicate headings and blanket spaces cannot pass acceptance',async()=>{
 const p=fixture(),b=p.sections[0].blocks[0];
 assert.ok((await inspectPresentationFidelity(p)).issues.some(i=>i.kind==='missing-teaching-template'));
 b.sourceAtom={id:'group',kind:'guided-practice'};b.sourceReview={headerOwnedByTemplate:true,responses:[{targetId:'a',kind:'cloze'}]};
 const kinds=(await inspectPresentationFidelity(p)).issues.map(i=>i.kind);
 for(const kind of ['duplicate-teaching-header','unnecessary-response-space','unreviewed-source-arrangement'])assert.ok(kinds.includes(kind));
});
test('changing source columns, order or response requirements invalidates presentation independently',async()=>{
 const p=fixture(),b=p.sections[0].blocks[0],entry={targetId:'a'},content=await contentVerificationKey(p,entry);
 b.content.prompt='Simplify';b.content.columns=4;
 b.sourceAtom={id:'g',kind:'guided-practice'};
 b.sourceReview={headerOwnedByTemplate:true,responses:[{targetId:'a',kind:'tick-cross'}],arrangements:[{targetId:'root',layout:'grid',columns:4,order:['a'],reason:'Four-column source grid.'}]};
 b.content.children[0].answerSpaceMm=4;
 b.sourceReview.verification={checked:true,signature:await presentationVerificationKey(b,p.source?.sourceHashes)};
 assert.equal((await inspectPresentationFidelity(p)).complete,true);
 const key=await presentationVerificationKey(b,p.source?.sourceHashes),afterContent=await contentVerificationKey(p,entry);assert.notEqual(content,afterContent);
 b.content.columns=2;
 assert.notEqual(await presentationVerificationKey(b,p.source?.sourceHashes),key);
 assert.equal(await contentVerificationKey(p,entry),afterContent);
 assert.ok((await inspectPresentationFidelity(p)).issues.some(i=>i.kind==='unreviewed-source-arrangement'));
 b.sourceReview.responses[0].kind='working';assert.notEqual(await presentationVerificationKey(b,p.source?.sourceHashes),key);
});
test('native fractions use practice glyph sizing only for opted-in projects and remain inline',()=>{
 const doc=normalizeDocument({blocks:[{type:'paragraph',inlines:[{type:'math',latex:'\\frac{x^2}{x^3}',display:false}]}]});
 const legacy=documentHtml(doc),compact=documentHtml(doc,{mathsStyle:'display-glyphs'});
 assert.match(legacy,/\\textstyle/);assert.doesNotMatch(compact,/\\textstyle/);
 assert.match(compact,/\\displaystyle/);assert.doesNotMatch(compact,/class="katex-display"/);
 assert.equal(normalizeEditableProject({settings:{}}).settings.mathsStyle,undefined);
});
test('teaching controls still reveal guided responses and fill Key Ideas without answer editions',()=>{
 const b=fixture().sections[0].blocks[0];
 assert.equal(teachingQuestionMode(b,{},'student'),'student');
 assert.equal(teachingQuestionMode(b,{showGuidedPracticeAnswers:true},'student'),'worked');
 assert.equal(blockClozeAnswers({pedagogyRole:'key-ideas'},{showKeyIdeasAnswers:false}),false);
 assert.equal(blockClozeAnswers({pedagogyRole:'key-ideas'},{showKeyIdeasAnswers:true}),true);
});

test('Index Laws source p5 Q3 retains its actual four-column tick/cross grid',async()=>{
 const pilot=JSON.parse(fs.readFileSync(new URL('../booklets/projects/index-laws-complete-v1.json',import.meta.url)));
 const b=structuredClone(pilot.sections.flatMap(s=>s.blocks).find(b=>b.id==='index-t1-q3'));
 assert.equal(b.content.columns,4);assert.equal(b.content.children.length,16);
 assert.deepEqual(b.content.children.map(n=>n.label),'abcdefghijklmnop'.split(''));
 assert.ok(b.content.children.every(n=>n.answerSpaceMm===4&&n.sourceRefs.some(r=>r.pageNumber===5)));
 const p={settings:creationSettings(),sections:[{phase:'practice',blocks:[b]}]};
 b.sourceReview.verification={checked:true,signature:await presentationVerificationKey(b,p.source?.sourceHashes)};
 assert.equal((await inspectPresentationFidelity(p)).complete,true);
 b.content.columns=2;
 assert.ok((await inspectPresentationFidelity(p)).issues.some(i=>i.kind==='unreviewed-source-arrangement'));
});

test('custom source arrangements are checked against active layout overrides',async()=>{
 const p=fixture(),b=p.sections[0].blocks[0];
 p.settings.layoutOverrides={blockLayouts:{guided:{arrangement:{version:1,root:{id:'a',type:'group',direction:'row',children:[]}}}}};
 assert.ok((await inspectPresentationFidelity(p)).issues.some(i=>i.targetId==='guided'&&i.kind==='unreviewed-source-arrangement'));
});

test('an out-of-bounds Word crop cannot pass as a readable source diagram',async()=>{
 const p=fixture(),b=p.sections[0].blocks[0];
 b.content.children[0].questionDiagrams=[{id:'crop',format:'image',src:'/source.png',sourceRegion:{x:90,y:0,width:11,height:10,sourceWidth:100,sourceHeight:100}}];
 const report=await inspectContentCoverage(p,{assetSignatures:{'/source.png':'bytes'}});
 assert.ok(report.issues.some(i=>i.kind==='invalid-source-crop'&&i.targetId==='crop'));
});

