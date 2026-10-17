import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditableProject,normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {matchSiblingLayout,matchTableRows,changeBlockRole,layoutSpaceChain,tightenStages,fitIsSafe,changeSpaceChain} from '../src/lib/booklet-layout-actions.js';
import {tableRowMinimum,hasTeacherReview,spacingProtected} from '../src/lib/booklet-import-spacing.js';
import {estimateWorkedWritingSpace} from '../src/lib/booklet-working-space.js';
import {teachingQuestionMode} from '../src/lib/booklet-answer-options.js';
const paragraph=(id,text)=>({id,type:'paragraph',spaceAfter:5,inlines:[{type:'text',text}]});
const fixture=()=>createEditableProject({id:'layout-actions',title:'Layout actions',settings:{paginationMode:'flexible',generatedCover:false},topics:[{id:'t',title:'Topic'}],sections:[{id:'s',topicId:'t',phase:'practice',blocks:[{id:'q',type:'question',content:{id:'root',type:'question',prompt:'Calculate',layout:'grid',columns:2,children:[{id:'a',type:'part',label:'a',prompt:{format:'maths-editor-document-v1',version:1,blocks:[paragraph('pa','1+1')]},answerSpaceMm:30,answer:{short:'2',worked:'1+1=2'}},{id:'b',type:'part',label:'b',prompt:{format:'maths-editor-document-v1',version:1,blocks:[paragraph('pb','2+2')]},answerSpaceMm:36,answer:{short:'4',worked:'2+2=4'}}]}}]}]});
test('matching siblings preserves target content and answers and source stays immutable',()=>{
 const p=fixture(),before=JSON.stringify(p),answer=structuredClone(p.sections[0].blocks[0].content.children[1].answer);
 const next=matchSiblingLayout(p,'q','a'),b=next.sections[0].blocks[0].content.children[1];
 assert.equal(JSON.stringify(p),before);assert.equal(b.id,'b');assert.deepEqual(b.answer,answer);assert.equal(b.prompt.blocks[0].inlines[0].text,'2+2');assert.equal(b.answerSpaceMm,30);
 assert.doesNotThrow(()=>normalizeEditableProject(next));
});
test('selected sibling properties leave other layout values unchanged',()=>{
 const p=fixture(),[a,b]=p.sections[0].blocks[0].content.children;
 a.prompt.blocks[0].align='center';b.prompt.blocks[0].align='right';b.prompt.blocks[0].spaceAfter=9;
 const next=matchSiblingLayout(p,'q','a',['alignment']),target=next.sections[0].blocks[0].content.children[1];
 assert.equal(target.prompt.blocks[0].align,'center');assert.equal(target.prompt.blocks[0].spaceAfter,9);assert.equal(target.answerSpaceMm,36);
 assert.throws(()=>matchSiblingLayout(p,'q','a',[]),/Choose layout properties/);
});
test('response-aware pilot is opt-in and preserves explicit overrides',()=>{
 const node={id:'a',answerSpaceMm:44,answer:{short:'5',worked:'x=1\nx+4=5'}};
 assert.equal(estimateWorkedWritingSpace(node,{responseContext:{kind:'short',expectedAnswer:'5'}}),44);
 assert.equal(estimateWorkedWritingSpace(node,{preserveExplicit:false,responseContext:{kind:'short',expectedAnswer:'5'}}),10);
 assert.equal(estimateWorkedWritingSpace(node,{preserveExplicit:false,responseContext:{kind:'table-cell',providesWritingSpace:true}}),0);
 assert.ok(estimateWorkedWritingSpace(node,{preserveExplicit:false})>=16);
});
test('role conversion refuses to invent Your turn; guided mode hides solutions',()=>{
 const p=fixture(),before=JSON.stringify(p);assert.throws(()=>changeBlockRole(p,'q','example'),/separate Your turn/);assert.equal(JSON.stringify(p),before);
 const next=changeBlockRole(p,'q','guided-practice'),b=next.sections[0].blocks[0];
 assert.equal(teachingQuestionMode(b,{showGuidedPracticeAnswers:true},'student'),'student');
 assert.equal(b.sourceAtom.kind,'guided-practice');assert.deepEqual(b.content,p.sections[0].blocks[0].content);
 const question=changeBlockRole(next,'q','question');assert.equal(question.sections[0].blocks[0].sourceAtom,undefined);
});
test('fit safety rejects splitting, overflow and impossible destinations',()=>{
 const before={pages:[{blocks:[{id:'q'}]},{blocks:[{id:'z'}]}],issues:[]};
 assert.equal(fitIsSafe(before,{pages:[{blocks:[{id:'q'},{id:'z'}]}],issues:[]},'q','z'),true);
 assert.equal(fitIsSafe(before,{pages:[{blocks:[{id:'q'},{id:'z'}]},{blocks:[{id:'q',flow:{continuationOf:'q'}}]}],issues:[]},'q','z'),false);
 assert.equal(fitIsSafe(before,{pages:[{blocks:[{id:'q'},{id:'z'}]}],issues:[{message:'overflow'}]},'q','z'),false);
 assert.equal(fitIsSafe(before,before,'q','missing'),false);
});
test('tightening is cumulative, bounded and never mutates its input',()=>{
 const p=fixture(),before=JSON.stringify(p),stages=tightenStages(p,'q');assert.ok(stages.length);assert.equal(JSON.stringify(p),before);
 const first=stages[0].project.sections[0].blocks[0].content.children[0];assert.equal(first.prompt.blocks[0].spaceAfter,1);
 assert.equal(first.answerSpaceMm,30);assert.equal(first.prompt.blocks[0].inlines[0].text,'1+1');
});
test('container inspector reaches ancestors and source page boundary',()=>{
 const p=fixture();p.sections[0].blocks[0].flow={sourcePageBreakBefore:true};
 const selection={blockId:'q',id:'root:question'},chain=layoutSpaceChain(p,selection);
 assert.ok(chain.some(c=>c.kind==='arrangement'));assert.equal(chain.at(-1).label,'Source boundary');
 const next=changeSpaceChain(p,selection,chain.at(-1));assert.equal(next.sections[0].blocks[0].flow.pageBreakBefore,false);
});
test('table rows keep response capacity and ignore incompatible merged rows',()=>{
 const table={id:'table',type:'table',widthMm:80,padding:1,widths:[1,1],rowHeights:[18,30],rows:[[0,1].map(i=>({id:'c'+i,type:'cell',expectedAnswer:'4',blocks:[paragraph('p'+i,'')]})),[2,3].map(i=>({id:'c'+i,type:'cell',expectedAnswer:'4',blocks:[paragraph('p'+i,'')]}))]};
 const p=fixture();p.sections[0].blocks[0].content.prompt={format:'maths-editor-document-v1',version:1,blocks:[table]};
 const next=matchTableRows(p,'q','table',[0],[1]);assert.equal(next.sections[0].blocks[0].content.prompt.blocks[0].rowHeights[1],18);assert.ok(tableRowMinimum(table,1)>=10);
 assert.throws(()=>matchTableRows(p,'q','table',[0],[0]),/separate/);
});
test('review and protection gates include resolved teacher comments',()=>{
 assert.equal(hasTeacherReview({studio:{flags:[{at:'2026-10-17',resolved:true}]}}),true);
 assert.equal(hasTeacherReview({studio:{flags:[{at:'2026-10-17',kind:'first-pass'}]}}),false);
 assert.equal(spacingProtected({sourceReview:{authorisedFeedback:{note:'keep this'}}}),true);
});
test('worked example uses the existing pair and definition is explicitly red',()=>{
 const p=fixture();p.sections[0].blocks[0].pairedBlockId='turn';p.sections[0].blocks.push({id:'turn',type:'question',content:{id:'turn-root',prompt:'Calculate 3+3',answerSpaceMm:20,answer:{short:'6',worked:'3+3=6'}}});
 const next=changeBlockRole(p,'q','example'),[example,turn]=next.sections[0].blocks;
 assert.equal(example.presentation.studentRole,'demonstration');assert.equal(turn.presentation.studentRole,'your-turn');assert.equal(teachingQuestionMode(turn,{showGuidedPracticeAnswers:true},'student'),'student');assert.equal(teachingQuestionMode(example,{},'student'),'worked');assert.deepEqual(turn.content,p.sections[0].blocks[1].content);
 const definition=changeBlockRole(fixture(),'q','definition');assert.equal(definition.sections[0].blocks[0].sourceAtom.headerFill,'red');
});
test('unknown blank response cells do not get a guessed minimum',()=>{
 assert.equal(tableRowMinimum({padding:1,rows:[[{id:'unknown',type:'cell',blocks:[]}]]},0),null);
});
test('tightening reaches inherited native margins and padding without writing dormant cell spacing',()=>{
 const p=fixture(),b=p.sections[0].blocks[0];b.content.prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:'parallel',type:'layout',arrangement:'parallel',slots:[{id:'slot',blocks:[{id:'plain',type:'paragraph',inlines:[{type:'text',text:'Text'}]}]}]},{id:'cells',type:'table',rows:[[{id:'cell',type:'cell',blocks:[{id:'dormant',type:'paragraph',inlines:[{type:'text',text:'Given'}]}]}]]}]};
 const stages=tightenStages(p,'q'),last=stages.at(-1).project.sections[0].blocks[0].content.prompt.blocks;
 assert.equal(last[0].margin,0);assert.equal(last[0].padding,0);assert.equal(last[0].slots[0].blocks[0].spaceAfter,1);assert.equal(last[1].rows[0][0].blocks[0].spaceAfter,undefined);
});
test('legacy worked rows retain their renderer path when tightened',()=>{
 const p=fixture();p.sections[0].blocks=[{id:'example',type:'worked-example',presentation:{layout:'worked-rows'},examples:[{id:'e',prompt:'2+2',theorySolution:'4'}]}];
 const next=tightenStages(p,'example').at(-1).project;assert.equal(next.settings.layoutOverrides.blockLayouts.example?.arrangement,undefined);assert.equal(next.sections[0].blocks[0].examples[0].rowLayout.aboveMm,0);assert.equal(next.sections[0].blocks[0].examples[0].theorySolution,'4');
});
test('matching clears target-only styles and copies effective space and diagram overrides',()=>{
 const p=fixture(),[a,b]=p.sections[0].blocks[0].content.children;b.prompt.blocks[0].align='right';a.questionDiagrams=[{id:'da',format:'tikz',widthMm:50,code:'source'}];b.questionDiagrams=[{id:'db',format:'tikz',widthMm:90,code:'target'}];p.settings.layoutOverrides.answerSpaces={b:70};p.settings.layoutOverrides.blockLayouts.db={diagramWidthMm:90,diagramSizing:'fit'};
 const next=matchSiblingLayout(p,'q','a'),target=next.sections[0].blocks[0].content.children[1];assert.equal(target.prompt.blocks[0].align,undefined);assert.equal(next.settings.layoutOverrides.answerSpaces.b,30);assert.equal(next.settings.layoutOverrides.blockLayouts.db.diagramWidthMm,50);assert.equal(next.settings.layoutOverrides.blockLayouts.db.diagramSizing,undefined);assert.equal(target.questionDiagrams[0].code,'target');
});
test('matching tolerates different inline content and preserves cloze capacity; incompatible references are refused',()=>{
 const p=fixture(),[a,b]=p.sections[0].blocks[0].content.children;a.prompt.blocks[0].inlines=[{type:'text',text:'Answer '},{type:'cloze',answer:'2',width:20}];b.prompt.blocks[0].inlines=[{type:'cloze',answer:'123456789',width:40}];
 const next=matchSiblingLayout(p,'q','a');assert.ok(next.sections[0].blocks[0].content.children[1].prompt.blocks[0].inlines[0].width>=26);
 b.prompt='Different prompt format';assert.throws(()=>matchSiblingLayout(p,'q','a'),/formats differ/);
});
