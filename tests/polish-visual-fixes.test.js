// Fixes from the page-by-page review of the polish pilots (23 October 2026): a stacked scaffold layout is not turned into
// side-by-side tracks, and aligned or several-line working in an example becomes red-gutter steps.
import test from 'node:test';
import assert from 'node:assert/strict';
import {sweepProject,layoutAnchored} from '../sweep/rules.mjs';
import {verifyCandidate} from '../sweep/run.mjs';
import {normalizeDocument} from '../public/libs/maths-editor/document-model.mjs';

const RED='#ef6068',BLUE='#268cff';
const math=(id,latex,extra={})=>({id,type:'paragraph',align:'left',inlines:[{type:'math',latex,display:false,colour:BLUE}],...extra});
const doc=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
const project=blocks=>({id:'p',revision:1,studio:{flags:[]},settings:{layoutOverrides:{blockLayouts:{}}},sections:[{id:'s',phase:'teaching',blocks}]});
const sweep=(p,rules)=>sweepProject(p,{fix:true,rules});
const example=(examples,extra={})=>({id:'ex',type:'worked-example',pedagogyRole:'example',sourceAtom:{kind:'example'},presentation:{layout:'columns',columns:2,numberSteps:false},examples,...extra});
const blockOf=result=>result.project.sections[0].blocks[0];

test('scaffold-anchor: a layout that stacks its slots (a caption above a working row) is not turned into side-by-side tracks',()=>{
 // algebraic-fractions p8 q3: a one-column result layout holding a caption row and a working row became three narrow tracks, so "Simplify" was drawn over the boxes.
 const row=id=>({id,type:'layout',arrangement:'scaffold',columns:2,tracks:[1,1],gap:1,margin:0,padding:0,slots:[{id:id+'-1',blocks:[math(id+'-m1','=')]},{id:id+'-2',blocks:[math(id+'-m2','\\boxed{\\rule{0pt}{5mm}\\hspace{8mm}}')]}]});
 const stacked={id:'q-a-result',type:'layout',arrangement:'scaffold',columns:1,tracks:[1],slots:[{id:'q-a-caption',blocks:[row('cap')]},{id:'q-a-math',blocks:[row('wk')]}]};
 const question=layout=>({id:'q',type:'question',pedagogyRole:'guided-practice',content:{id:'q-root',type:'question',prompt:doc([]),children:[{id:'q-a',type:'part',label:'a',prompt:doc([layout]),responseSpace:'scaffold',answerSpaceMm:0}]}});
 const result=sweep(project([question(stacked)]),['scaffold-anchor']),node=blockOf(result).content.children[0].prompt.blocks[0];
 assert.deepEqual([node.columns,node.slots.length,node.tracks],[1,2,[1]],'the stacked layout is left as it was');
 assert.equal(layoutAnchored(node),false);
 // Two slots in one row (columns 2) with nested layouts are not sized from content that cannot be measured either.
 const kept=sweep(project([question({...stacked,columns:2,tracks:[1,1]})]),['scaffold-anchor']);
 assert.equal(blockOf(kept).content.children[0].prompt.blocks[0].slots.length,2);
});

test('steps: aligned working or several lines of blue working in an example become red-gutter steps; a single answer is not numbered',()=>{
 const ex=(id,prompt,theorySolution)=>({id,label:'',prompt,theorySolution});
 const aligned='$$\\begin{align*}\\frac{4x}{15}\\times\\frac{3x}{2}&=\\frac{4x\\times3x}{15\\times2}\\\\&=\\frac{12x^2}{30}\\\\&=\\frac{2x^2}{5}\\end{align*}$$';
 const line=(id,text,latex)=>({id,type:'paragraph',align:'left',inlines:[{type:'text',text,colour:BLUE},{type:'math',latex,display:false,colour:BLUE}]});
 const before=project([example([
  ex('a','$\\frac{4x}{15}\\times\\frac{3x}{2}$',aligned),
  ex('b','$\\dfrac{3a}{8}\\div\\dfrac{b}{5}$',doc([math('b-w','\\begin{aligned}&=\\frac{3a}{8}\\times\\frac{5}{b}\\\\&=\\frac{15a}{8b}\\end{aligned}',{inlines:[{type:'math',latex:'\\begin{aligned}&=\\frac{3a}{8}\\times\\frac{5}{b}\\\\&=\\frac{15a}{8b}\\end{aligned}',display:true,colour:BLUE}]})])),
  ex('c','Magnitudes 6 and 3.',doc([line('c1','Magnitude 6: ','A=10^6'),line('c2','Magnitude 3: ','A=10^3')])),
  ex('d','$\\frac{5x}{13}+\\frac{3x}{13}$',doc([math('d-w','=\\frac{5x+3x}{13}=\\frac{8x}{13}')])),
  ex('e','Solve.',doc([math('e-w','\\begin{aligned}2^x&=7\\\\x&=\\log_2 7\\end{aligned}')])),
  ex('f','Explain.',doc([{id:'f1',type:'paragraph',inlines:[{type:'text',text:'Because the base is the same.'}]},{id:'f2',type:'paragraph',inlines:[{type:'text',text:'So we add.'}]}])),
 ])]);
 const result=sweep(before,['steps']),out=blockOf(result).examples,get=id=>out.find(e=>e.id===id);
 const rows=e=>e.theorySolution.blocks[0].rows;
 for(const id of ['a','b','c']){assert.equal(get(id).theorySolution.blocks[0].type,'table',id+' is a step table');assert.deepEqual(get(id).theorySolution.blocks[0].widths,[7,93]);}
 assert.equal(rows(get('a')).length,3);
 assert.deepEqual(rows(get('a')).map(r=>r[0].blocks[0].inlines[0].text),['1.','2.','3.']);
 assert.equal(rows(get('a'))[0][0].blocks[0].inlines[0].colour,RED);
 assert.deepEqual(rows(get('a')).map(r=>r[1].blocks[0].inlines[0].latex),['=\\frac{4x\\times3x}{15\\times2}','=\\frac{12x^2}{30}','=\\frac{2x^2}{5}'],'the left side that repeats the given is printed once');
 assert.equal(rows(get('a'))[0][1].blocks[0].inlines[0].colour,BLUE);
 assert.equal(rows(get('b')).length,2);assert.equal(rows(get('c')).length,2);
 for(const id of ['d','e','f'])assert.notEqual(get(id).theorySolution.blocks?.[0]?.type,'table',id+' is left alone (one line, a left side that is not the given, prose)');
 assert.deepEqual(verifyCandidate(before,result.project,result.changed),[],'no printed content changes');
 normalizeDocument(get('a').theorySolution);
 assert.equal(sweep(result.project,['steps']).changed.length,0,'idempotent');
 const held=sweep(project([example([ex('a','$\\frac{4x}{15}\\times\\frac{3x}{2}$',aligned)],{sourceReview:{intentionalDepartures:['Do not number the steps in this example (teacher)']}})]),['steps']);
 assert.equal(held.changed.length,0);
});

test('steps: an example whose solution a saved arrangement names is left as it is (the arrangement would lose its reference)',()=>{
 const blue=BLUE,line=(id,text,latex)=>({id,type:'paragraph',align:'left',inlines:[{type:'text',text,colour:blue},{type:'math',latex,display:false,colour:blue}]});
 const solution=doc([line('c1','Magnitude 6: ','A=10^6'),line('c2','Magnitude 3: ','A=10^3')]);
 const blockWith=extra=>example([{id:'cmp',label:'',prompt:'Compare.',theorySolution:solution}],extra);
 assert.equal(sweep(project([blockWith({})]),['steps']).changed.length,1);
 const arrangement={blockLayouts:{ex:{arrangement:{version:1,root:{id:'r',type:'group',direction:'stack',children:[{id:'i',type:'item',ref:'cmp/theorySolution#c1'}]}}}}};
 assert.equal(sweep(project([blockWith({presentation:{layout:'columns',columns:2,numberSteps:false,layoutOverrides:arrangement}})]),['steps']).changed.length,0,'block-level arrangement');
 const saved=project([blockWith({})]);saved.settings.layoutOverrides=arrangement;
 assert.equal(sweep(saved,['steps']).changed.length,0,'project-level arrangement');
});
