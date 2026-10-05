import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {repairEarningFeedback} from '../scripts/booklet/repair-earning-feedback-20261005.mjs';
import {teachingAnswerCategory,teachingQuestionMode,independentAnswerPages} from '../src/lib/booklet-answer-options.js';
import {answerNodePath} from '../src/lib/booklet-exercises.js';

const before=JSON.parse(fs.readFileSync(new URL('./fixtures/booklets/earning-feedback-r332.json',import.meta.url),'utf8'));
const candidate=repairEarningFeedback(before);
const get=(p,id)=>p.sections.flatMap(s=>s.blocks).find(b=>b.id===id);
const collect=(n,type)=>{const out=[];function visit(v){if(!v||typeof v!=='object')return;if(v.type===type)out.push(v);for(const x of Object.values(v))if(typeof x==='object')visit(x);}visit(n);return out;};
test('Lily guided practice owns clozes, retains complete answer and switches teaching answers',()=>{
 const b=get(candidate,'p13-pay-example-group'),lily=b.content.children[0];
 assert.equal(teachingAnswerCategory(b),'guided');assert.equal(teachingQuestionMode(b,{}),'student');assert.equal(teachingQuestionMode(b,{showGuidedPracticeAnswers:true}),'worked');
 assert.equal(collect(lily.prompt,'table').length,0);assert.equal(collect(lily.prompt,'cloze').length,10);
 assert.deepEqual(lily.answer,get(before,b.id).content.children[0].answer);
 assert.deepEqual(get(candidate,'p13-pay-followup-block').content.children,get(before,b.id).content.children.slice(1));
 assert.equal(25*35+25*4*1.5,1025);
});
test('salary roles preserve source items, order and practice-only answer exclusion',()=>{
 const old=get(before,'p31-example'),worked=get(candidate,old.id),guided=get(candidate,'p31-guided-practice');
 assert.equal(teachingAnswerCategory(worked),'theory');assert.equal(teachingAnswerCategory(guided),'guided');
 assert.deepEqual(guided.content.children[0],old.content.children[1]);
 assert.deepEqual(worked.content.children[0],old.content.children[0]);assert.equal(worked.presentation.permanentTeachingPrompt,true);
 assert.equal(independentAnswerPages([{blocks:[worked,guided]}]).length,0);
});
test('tax table precedes five parts, scaffolds retain mathematical operators and answers',()=>{
 const q=get(candidate,'p52-q1');assert.equal(q.content.columns,5);assert.deepEqual(q.content.prompt,get(before,q.id).content.prompt);
 assert.equal(q.presentation?.layoutOverrides?.blockLayouts?.[q.id]?.arrangement,undefined);
 assert.equal(get(candidate,'p50-example-reflections'),undefined);
 const a=get(candidate,'p53-q3').content.children[0].children[0].prompt.blocks[1];assert.equal(collect(a,'cloze').length,4);assert.deepEqual(a.inlines.filter(n=>n.type==='math').map(n=>n.latex),['+','\\times(','-',')']);
 assert.equal(Math.round((5092+.325*(95423-45000))*100)/100,21479.48);assert.equal(Math.round((29467+.37*(172846-120000))*100)/100,49020.02);
 const root=get(candidate,'p53-q3').content;
 for(const [i,group]of root.children.entries())for(const [j,part]of group.children.entries())assert.deepEqual(answerNodePath(root,part,answerNodePath(root,group,[],i),j),[part.label]);
});
test('refund alignment preserves every table height and all answers',()=>{
 const old=get(before,'p61-example-block'),b=get(candidate,old.id);
 assert.ok(collect(b.content,'cell').every(c=>c.verticalAlign==='top'));
 assert.deepEqual(collect(b.content,'table').map(t=>t.rowHeights),collect(old.content,'table').map(t=>t.rowHeights));
 assert.deepEqual(b.content.children.map(c=>c.answer),old.content.children.map(c=>c.answer));
});
