import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {estimateWorkedWritingSpace,sizeQuestionWorking} from '../src/lib/booklet-working-space.js';
import {contentSource} from '../src/lib/document-content.js';
import {splitSharedPrompt,groupConceptQuestions} from '../scripts/booklet/group-concept-questions.mjs';
import {validatePracticeAuthor} from '../scripts/booklet/practice-only-scope.mjs';

test('writing estimates count TeX rows, fractions and cell-width wrapping',()=>{
 const one={id:'a',answer:{worked:String.raw`$$x=1$$`}};
 const many={id:'b',answer:{worked:String.raw`$$\begin{align*}2x+3&=5\\2x&=2\\x&=1\end{align*}$$`}};
 assert.ok(estimateWorkedWritingSpace(many)>estimateWorkedWritingSpace(one));
 const fraction={answer:{worked:String.raw`$$x=\frac{\frac12}{3}$$`}};
 assert.ok(estimateWorkedWritingSpace(fraction)>estimateWorkedWritingSpace(one));
 const prose={answer:{worked:'Subtract the same quantity from each side and divide both sides by the nonzero coefficient of the unknown.'}};
 assert.ok(estimateWorkedWritingSpace(prose,{widthMm:45})>estimateWorkedWritingSpace(prose,{widthMm:160}));
 assert.equal(estimateWorkedWritingSpace({...many,answerSpaceMm:23}),23);
 const manual={children:[{...many,answerSpaceMm:23}]};sizeQuestionWorking(manual);assert.equal(manual.children[0].answerSpaceMm,23);
 assert.equal(estimateWorkedWritingSpace(many,{responseKind:'tick-cross'}),6);
 assert.equal(estimateWorkedWritingSpace({...many,responseSpace:'scaffold'}),0);
 assert.throws(()=>estimateWorkedWritingSpace({id:'missing'}),/worked solution/);
});
test('common mathematical premises stay in the stem; different expressions remain complete',()=>{
 const nodes=[{prompt:'True or False? Let $x,y>=0$.\n$x+y=1$'},{prompt:'True or False? Let $x,y>=0$. The conjugate is $x$.'}];
 const s=splitSharedPrompt(nodes);assert.equal(s.stem,'True or False? Let $x,y>=0$.');assert.equal(s.parts[0],'$x+y=1$');
 assert.equal(splitSharedPrompt([{prompt:'Solve. $x+1=2$'},{prompt:'Solve. $x+2=3$'}]).stem,'Solve.');
});

test('student writing uses eight-mm lines and excludes reviewed teacher-only material',()=>{
 const studentWork=String.raw`$$\begin{align*}2x+3&=5\\2x&=2\\x&=1\end{align*}$$`;
 const node={id:'student',answer:{worked:studentWork+'\n'+('Optional teacher explanation. '.repeat(30)),solutionDiagrams:[{id:'teacher-graph',heightMm:60}]}};
 assert.equal(estimateWorkedWritingSpace(node,{widthMm:160,studentWork}),28);
 assert.ok(estimateWorkedWritingSpace(node,{widthMm:160})>28);
 assert.equal(estimateWorkedWritingSpace(node,{studentWork:'',studentDiagrams:[{id:'required-graph',heightMm:40}]}),44);
 assert.equal(estimateWorkedWritingSpace(node,{studentWork:'',studentDiagrams:[{id:'voronoi-construction',heightMm:100}]}),104);
 assert.equal(estimateWorkedWritingSpace(node,{studentWork:'',studentDiagrams:[{id:'voronoi-construction',requiredHeightMm:100}]}),104);
 assert.equal(estimateWorkedWritingSpace({...node,answerSpaceMm:120},{studentWork:'',studentDiagrams:[{heightMm:100}]}),120);
 assert.equal(estimateWorkedWritingSpace({...node,answerSpaceMm:31},{studentWork}),31);
 const question={layout:'grid',columns:2,children:[structuredClone(node)]};
 sizeQuestionWorking(question,{studentWorkById:{student:studentWork}});
 assert.equal(question.children[0].answerSpaceMm,28);
 assert.equal(question.children[0].answer.worked,node.answer.worked);
 assert.deepEqual(question.children[0].answer.solutionDiagrams,node.answer.solutionDiagrams);
});
test('source shared-stem inventory permits distinct child mappings and rejects flattening',()=>{
 const inventory={entries:['a','b'].map(id=>({id,kind:'question',sharedStemId:'solve'}))};
 const child=id=>({id,type:'part',prompt:'$x=1$',answer:{short:'1',worked:'$x=1$'}});
 const block={id:'q',type:'question',sourceReview:{workingSpaceEstimate:{method:'Reviewed worked rows'}},content:{id:'root',prompt:'Solve the following.',layout:'grid',columns:2,children:['a','b'].map(child)}};
 const result={sections:[{phase:'practice',blocks:[block]}],inventoryMappings:['a','b'].map(id=>({inventoryId:id,targetId:id}))};
 assert.doesNotThrow(()=>validatePracticeAuthor(result,inventory));
 const invalid=structuredClone(result);invalid.inventoryMappings[1].targetId='a';assert.throws(()=>validatePracticeAuthor(invalid,inventory),/distinct part/);
 const flat=structuredClone(result);flat.sections[0].blocks=['a','b'].map(id=>({...block,id:'q'+id,content:{...block.content,id:'root'+id,children:[child(id)]}}));assert.throws(()=>validatePracticeAuthor(flat,inventory),/flattened/);
 const unrelated=structuredClone(inventory);delete unrelated.entries[1].sharedStemId;assert.throws(()=>validatePracticeAuthor(result,unrelated),/sharedStemId/);
});
test('Chapter 1 repair preserves response answers, source group boundaries and repeat safety',()=>{
 let p=JSON.parse(fs.readFileSync('booklets/projects/concept-maths-adv11-ch01.json'));
 if(p.source?.groupingRepair){
  assert.equal(p.source.groupingRepair.groups,117);assert.equal(p.source.groupingRepair.responses,861);assert.equal(groupConceptQuestions(p).alreadyApplied,true);
  const tickCross=p.sections.flatMap(s=>s.blocks).filter(b=>/^True or False\?/.test(contentSource(b.content?.prompt))).flatMap(b=>b.sourceReview?.responses??[]);
  assert.equal(tickCross.length,80);assert.ok(tickCross.every(r=>r.kind==='tick-cross'));
  return;
 }
 const r=groupConceptQuestions(p);
 assert.equal(r.groups.length,117);assert.equal(r.mapping.length,760);assert.equal(r.spacing.length,861);
 assert.equal(r.next.sections.flatMap(s=>s.blocks).filter(b=>b.type==='question').length,246);
 assert.equal(r.groups.find(g=>g.topicId==='1F'&&g.sourceRange[0]===58).sourcePages.length,2);
 assert.equal(r.groups.filter(g=>g.topicId==='1A'&&g.sourceRange[0]>=17&&g.sourceRange[1]<=34).length,4);
 const nested=p.sections.flatMap(s=>s.blocks).find(b=>b.content?.children?.length&&!r.mapping.find(m=>m.sourceBlockId===b.id)?.part);
 const after=r.next.sections.flatMap(s=>s.blocks).find(b=>b.id===nested.id);assert.deepEqual(after.content.children.map(n=>n.id),nested.content.children.map(n=>n.id));
 assert.equal(groupConceptQuestions(r.next).alreadyApplied,true);
 assert.deepEqual(groupConceptQuestions(r.next).next,r.next);
});
test('grouped true-or-false responses persist the tick-cross requirement',()=>{
 const block=(id,label,expression)=>({id,type:'question',sourcePageNumber:1,sourceReview:{sourceIdentity:{questionLabel:label},responses:[{targetId:id+'-content',kind:'short'}]},classification:{primarySkillId:'algebra',secondarySkillIds:[],reasoningScore:20},content:{id:id+'-content',type:'question',prompt:`True or False? $${expression}$`,answer:{short:'True.',worked:'$x=x$'}}});
 const p={id:'concept-maths-adv11-ch01',revision:1,sections:[{topicId:'t',blocks:[block('q1','1','x=x'),block('q2','2','x=1')]}]};
 const r=groupConceptQuestions(p,{register:{t:[[1,2,2]]}}),group=r.next.sections[0].blocks[0];
 assert.deepEqual(group.sourceReview.responses.map(response=>response.kind),['tick-cross','tick-cross']);
 assert.ok(group.content.children.every(node=>node.answerSpaceMm===6));
});
test('grouping preserves nested responses and cannot merge adjacent distinct source ranges',()=>{
 const node=id=>({id,type:'question',prompt:'Solve. $x=1$',answer:{short:'1',worked:'$x=1$'},answerSpaceMm:12});
 const blocks=Array.from({length:5},(_,i)=>({id:'q'+(i+1),type:'question',sourcePageNumber:i<2?1:2,sourceReview:{sourceIdentity:{questionLabel:String(i+1)}},classification:{primarySkillId:'algebra',secondarySkillIds:[],reasoningScore:20},content:node('n'+i)}));
 blocks[4].content={id:'nested',type:'question',prompt:'Explain.',children:[node('child')]};
 const p={id:'concept-maths-adv11-ch01',revision:1,sections:[{topicId:'t',blocks}]};
 const r=groupConceptQuestions(p,{register:{t:[[1,3,2]]}});
 assert.equal(r.next.sections[0].blocks.length,3);assert.deepEqual(r.groups[0].sourcePages,[1,2]);
 assert.deepEqual(r.next.sections[0].blocks[0].content.children.map(n=>n.id),['n0','n1','n2']);
 assert.equal(r.next.sections[0].blocks[2].content.children[0].id,'child');
 assert.deepEqual(groupConceptQuestions(r.next).next,r.next);
});
