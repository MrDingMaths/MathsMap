// Polish blank style (23 October 2026): an outlined blank becomes the parenthesised gap only where the source leaves space.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {boxesToGaps,boxedMaths,parseStyles,blankStylePrompt,runBlankStyle} from '../polish/blank-style.mjs';
import {temp} from './polish-fixture.mjs';

const BOX=w=>`\\boxed{\\rule{0pt}{5mm}\\hspace{${w}mm}}`;
const GAP=w=>`\\rule{0pt}{5mm}\\hspace{${w}mm}`;
const mathBlock=(id,page,latex)=>({id,type:'question',sourcePageNumber:page,content:{id:id+'-root',type:'question',label:'1',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:id+'-p',type:'paragraph',inlines:[{type:'math',latex}]}]},answer:{short:'x'}}});
const book=blocks=>({id:'bs',revision:1,studio:{flags:[]},settings:{},sections:[{id:'s',phase:'teaching',blocks}]});
const runWith=(t,project,styles)=>{
 const dir=temp(t);fs.mkdirSync(path.join(dir,'evidence','pages'),{recursive:true});
 for(const page of [4,5])fs.writeFileSync(path.join(dir,'evidence','pages',`page-00${page}.png`),'x');
 const asked=[];
 return runBlankStyle({project,runDir:dir,cacheDir:dir,protectedIds:new Set(),log:()=>{},askModel:async({prompt,images})=>{asked.push({prompt,images});return {result:{pieces:styles(asked.length)}};}}).then(out=>({...out,asked,dir}));
};

test('boxesToGaps parenthesises the box, drops its strut and keeps the width',()=>{
 assert.equal(boxesToGaps(`\\frac{\\$\\,\\rule{0pt}{4mm}${BOX(11)}}{1\\text{ person}}`),`\\frac{\\$\\,(${GAP(11)})}{1\\text{ person}}`);
 assert.equal(boxesToGaps(`\\div${BOX(9)}`),`\\div(${GAP(9)})`);
});
test('a box already between parentheses does not get a second pair',()=>{
 assert.equal(boxesToGaps(`(${BOX(8)})`),`(${GAP(8)})`);
 assert.equal(boxesToGaps(`\\left(${BOX(8)}\\right)`),`\\left(${GAP(8)}\\right)`);
});
test('only outlined blanks are found: not a boxed answer, and not an answer document',()=>{
 const block=mathBlock('b',4,`x=${BOX(10)}`);
 block.content.answer={short:'\\boxed{5}',worked:`y=${BOX(10)}`};
 assert.equal(boxedMaths(block).length,1);
 assert.equal(boxedMaths(mathBlock('c',4,'\\boxed{\\mathrm{D}}')).length,0);
});
test('the answer is read per piece and anything unrecognised is unclear',()=>{
 assert.deepEqual(parseStyles({pieces:[{id:'m1',style:'space'},{id:'m3',style:'box'},{id:'m9',style:'space'},{id:'m2',style:'wavy'}]},3),['space','unclear','box']);
 assert.match(blankStylePrompt([{latex:`x=${BOX(10)}`}],[4]),/\[BLANK 10mm\]/);
});

test('blanks the source leaves as space become gaps; blanks it draws as boxes stay',async t=>{
 const space=mathBlock('space',4,`\\frac{${BOX(9)}}{2}`),boxed=mathBlock('boxed',5,`\\frac{${BOX(9)}}{2}`);
 const {project,report,asked}=await runWith(t,book([space,boxed]),n=>[{id:'m1',style:n===1?'space':'box'}]);
 const latex=id=>project.sections[0].blocks.find(b=>b.id===id).content.prompt.blocks[0].inlines[0].latex;
 assert.equal(asked.length,2,'one call per block');
 assert.match(asked[0].images[0],/page-004\.png$/);
 assert.equal(latex('space'),`\\frac{(${GAP(9)})}{2}`);
 assert.equal(latex('boxed'),`\\frac{${BOX(9)}}{2}`);
 assert.deepEqual(report.converted.map(c=>c.block),['space']);
 assert.ok(project.sections[0].blocks[0].sourceReview.feedbackRepairs.at(-1).note.includes('Polish blank style'));
});

test('the verdict is cached by content and a second run asks nothing',async t=>{
 const project=book([mathBlock('a',4,`x=${BOX(9)}`)]);
 const first=await runWith(t,project,()=>[{id:'m1',style:'space'}]);
 const again=await runBlankStyle({project,runDir:first.dir,cacheDir:first.dir,protectedIds:new Set(),askModel:async()=>{throw Error('asked again');}});
 assert.equal(again.report.cache.hits,1);assert.equal(again.report.converted.length,1);
});

test('a teacher-decided block, a local box exception and a block without a source image are left alone',async t=>{
 const decided=mathBlock('decided',4,`x=${BOX(9)}`),local=mathBlock('local',4,`x=${BOX(9)}`),noImage=mathBlock('noimage',99,`x=${BOX(9)}`);
 local.sourceReview={intentionalDepartures:['Keep the outlined box for this question only (teacher request).']};
 const dir=temp(t);fs.mkdirSync(path.join(dir,'evidence','pages'),{recursive:true});fs.writeFileSync(path.join(dir,'evidence','pages','page-004.png'),'x');
 const out=await runBlankStyle({project:book([decided,local,noImage]),runDir:dir,cacheDir:dir,protectedIds:new Set(['decided']),askModel:async()=>{throw Error('should not ask');}});
 assert.equal(out.report.converted.length,0);assert.equal(out.report.skipped.length,3);
});
