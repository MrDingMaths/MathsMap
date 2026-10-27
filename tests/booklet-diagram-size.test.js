import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';
import {diagramSizeTargets,targetWidths,setDiagramWidths,sizeModeFor} from '../src/lib/booklet-diagram-size.js';
import {answerDiagramWidth} from '../src/lib/booklet-exercises.js';

const figure={id:'fig',format:'tikz',code:'\\draw (0,0)--(1,1);',widthMm:80,alt:'triangle'};
const grid={id:'grid',format:'tikz',code:'\\draw (0,0) grid (4,4);',widthMm:90,alt:'blank grid for drawing'};
const solution={id:'sol',format:'tikz',code:'\\draw (0,0) circle (1);',widthMm:60,alt:'circle'};
const fixture=()=>createEditableProject({id:'sizes',title:'Sizes',settings:{paginationMode:'flexible',generatedCover:false},topics:[{id:'t',title:'Topic'}],sections:[{id:'s',topicId:'t',phase:'practice',blocks:[
 {id:'q',type:'question',content:{id:'root',type:'question',prompt:'Look',questionDiagrams:[figure,grid],children:[{id:'a',type:'part',label:'a',prompt:'Find x',answerSpaceMm:30,answer:{short:'2',worked:'x=2',solutionDiagrams:[solution]}}]}},
]}]});

test('targets list question and answer diagrams separately with their kinds',()=>{
 const p=fixture(),rows=diagramSizeTargets(p,['q']);
 assert.deepEqual(rows.map(r=>[r.id,r.widthMm,r.adjustable]),[['fig',80,true],['grid',90,false]]);
 assert.deepEqual(diagramSizeTargets(p,['q'],'worked').map(r=>r.id),['sol']);
 assert.equal(sizeModeFor('with-short'),'short');assert.equal(sizeModeFor('student'),'question');
});

test('height targets keep the rendered aspect; scale, match and clamping',()=>{
 const rows=diagramSizeTargets(fixture(),['q']),measured={fig:{widthMm:80,heightMm:40},grid:{widthMm:90,heightMm:90}};
 assert.deepEqual(targetWidths(rows,'height',30,measured).map(r=>r.targetMm),[60,30]);
 assert.deepEqual(targetWidths(rows,'scale',50,measured).map(r=>r.targetMm),[40,45]);
 assert.deepEqual(targetWidths(rows,'match-tallest',0,measured).map(r=>r.targetMm),[180,90]);
 assert.equal(targetWidths(rows,'width',400,measured)[0].targetMm,190);
 assert.equal(targetWidths(rows,'height',30,{})[0].targetMm,null,'no aspect, no guess');
});

test('writes keep the diagram, its stored layout width and the arrangement in step; answers write their edition',()=>{
 const p=fixture(),before=JSON.stringify(p);
 const next=setDiagramWidths(p,[{blockId:'q',id:'fig',targetMm:50}]);
 assert.equal(JSON.stringify(p),before);
 assert.equal(next.sections[0].blocks[0].content.questionDiagrams[0].widthMm,50);
 assert.equal(next.settings.layoutOverrides.blockLayouts.fig.diagramWidthMm,50);
 assert.equal(diagramSizeTargets(next,['q'])[0].widthMm,50);
 const answers=setDiagramWidths(p,[{blockId:'q',id:'sol',targetMm:44}],'worked');
 assert.equal(answerDiagramWidth(answers.settings.compactAnswers,'worked',solution),44);
 assert.deepEqual(answers.sections,p.sections);
});
