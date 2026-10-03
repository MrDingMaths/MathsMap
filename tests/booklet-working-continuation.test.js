import test from 'node:test';import assert from 'node:assert/strict';
import {paginateFlow,questionSplitGroups,fragmentQuestion,fragmentLayouts} from '../src/lib/booklet-pagination.js';
import {workingContinuation} from '../src/lib/booklet-working-continuation.js';
import {arrangementCatalog} from '../src/lib/booklet-arrangement.js';
const question={id:'q',type:'question',flow:{allowWorkingContinuation:true},content:{id:'q-root',prompt:'Find the area.',questionDiagrams:[{id:'diagram',code:'native'}],answerSpaceMm:318,answer:{short:'2',worked:'Area method.'}}};
const project=b=>({id:'p',settings:{paginationMode:'flexible',generatedCover:false,layoutOverrides:{blockLayouts:{},answerSpaces:{}}},topics:[{id:'t',title:'Topic'}],sections:[{id:'s',topicId:'t',phase:'practice',blocks:[b]}]});
test('long working response preserves every millimetre and one semantic answer',async()=>{
 const original=structuredClone(question);
 const result=await paginateFlow(project(question),'student',async page=>({height:page.blocks.reduce((sum,b)=>sum+b.content.answerSpaceMm+(b.content.questionDiagrams?.length?70:0),0),capacity:150}));
 assert.equal(result.issues.length,0);assert.equal(result.pages.length,3);
 assert.equal(result.pages.reduce((sum,p)=>sum+p.blocks[0].flow.workingSpaceSlice.heightMm,0),318);
 assert.equal(result.pages[0].blocks[0].content.questionDiagrams.length,1);
 for(const page of result.pages.slice(1)){assert.equal(page.blocks[0].content.prompt,'');assert.equal(page.blocks[0].content.questionDiagrams.length,0);assert.equal(page.blocks[0].content.id,'q-root');}
 assert.deepEqual(question,original);
});
test('continuation respects a saved space override and remains opt-in',async()=>{
 const p=project(question);p.settings.layoutOverrides.answerSpaces['q-root']=400;
 const measured=page=>({height:page.blocks[0].flow?.workingSpaceSlice?.heightMm??400,capacity:150});
 const r=await paginateFlow(p,'student',measured);
 assert.equal(r.pages.reduce((sum,p)=>sum+p.blocks[0].flow.workingSpaceSlice.heightMm,0),400);
 p.sections[0].blocks[0]={...question,flow:{}};
 assert.equal((await paginateFlow(p,'student',measured)).issues[0].kind,'oversized-content');
});
test('local saved multipart arrangement uses its actual row dependencies and prunes fragments',()=>{
 const b={id:'q',type:'question',flow:{repeatSharedDiagram:true},content:{id:'root',questionDiagrams:[{id:'fig'}],children:['a','b','c'].map(id=>({id,prompt:id,answerSpaceMm:60}))},presentation:{layoutOverrides:{blockLayouts:{q:{arrangement:{version:1,root:{id:'layout',type:'group',direction:'stack',children:[{id:'first',type:'group',direction:'row',children:[{id:'a-item',type:'item',ref:'a/prompt'},{id:'b-item',type:'item',ref:'b/prompt'}]},{id:'last',type:'item',ref:'c/prompt'}]}}}}}}};
 const groups=questionSplitGroups(b);assert.deepEqual(groups.map(g=>g.ids),[['a','b'],['c']]);
 const last=fragmentQuestion(b,groups.slice(1),1),layout=fragmentLayouts([last],{}).q.arrangement;
 assert.equal(layout.root.children.length,1);assert.equal(layout.root.children[0].ref,'c/prompt');
 assert.equal(workingContinuation(question,100,1,318).flow.workingSpaceSlice.totalMm,318);
});

test('explicit shared instruction survives a continuation without repeating its number',()=>{
 const b={id:'aux',type:'question',sourceOrder:13,flow:{repeatSharedStem:true},content:{id:'root',prompt:'Express in the form $R\\sin(x-\\alpha)$.',children:['a','b','c'].map(id=>({id,type:'part',prompt:'$\\sqrt3\\sin x-3\\cos x$',answerSpaceMm:60}))}};
 const groups=questionSplitGroups(b),last=fragmentQuestion(b,groups.slice(2),1),catalog=arrangementCatalog(last);
 assert.equal(catalog.entries.get('root/prompt').value,b.content.prompt);
 assert.equal(catalog.entries.get('root/label').value,'');
 assert.deepEqual(last.content.children.map(n=>n.id),['c']);
 b.flow.repeatSharedStem=false;assert.equal(arrangementCatalog(fragmentQuestion(b,groups.slice(2),1)).entries.has('root/prompt'),false);
});
