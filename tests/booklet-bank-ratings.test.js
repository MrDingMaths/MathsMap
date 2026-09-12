import test from 'node:test';
import assert from 'node:assert/strict';
import {questionDifficulty,applyBankRatings} from '../src/lib/booklet-bank-ratings.js';

test('ratings support classified questions without exercise numbers and legacy local assessments',()=>{
 assert.equal(questionDifficulty({classification:{reasoningScore:10,difficultyReason:'Opposite sides'}}).difficulty,'Foundation');
 assert.equal(questionDifficulty({flow:{localDifficulty:{reasoningScore:35,reason:'Linked steps'}}}).difficultyReason,'Linked steps');
 for(const reasoningScore of [undefined,null,'25',NaN,-1,101])assert.equal(questionDifficulty({classification:{reasoningScore}}),null);
 assert.equal(questionDifficulty({classification:{reasoningScore:0}}).reasoningScore,0);
});
test('bank-owned metadata takes precedence while detached questions retain local assessments',()=>{
 const block={bankRef:{id:'q'},classification:{reasoningScore:10},flow:{bankDifficulty:{reasoningScore:65,difficultyReason:'Current'},localDifficulty:{reasoningScore:20}}};
 assert.equal(questionDifficulty(block).reasoningScore,65);
 assert.equal(questionDifficulty({...block,bankRef:null}).reasoningScore,10);
 assert.equal(questionDifficulty({flow:block.flow}).reasoningScore,20);
});
test('polling initializes missing metadata without accepting content, changing classification or losing unsaved edits',()=>{
 const block={id:'b',type:'question',bankRef:{id:'q',revision:'pinned'},content:{prompt:'Unsaved'},classification:{reasoningScore:12}};
 const project={revision:4,sections:[{blocks:[block]}]};
 const items=[{blockId:'b',bankId:'q',bankDifficulty:{reasoningScore:55,difficulty:'Mastery',difficultyReason:'Connected representations',revision:'latest'}}];
 const next=applyBankRatings(project,items);
 assert.equal(questionDifficulty(next.sections[0].blocks[0]).difficultyReason,'Connected representations');
 assert.equal(next.sections[0].blocks[0].content,block.content);
 assert.equal(next.sections[0].blocks[0].classification,block.classification);
 assert.equal(next.sections[0].blocks[0].bankRef,block.bankRef);
 assert.equal(next.revision,4);assert.equal(block.flow,undefined);
 assert.equal(applyBankRatings(next,items),next);
 assert.equal(applyBankRatings(project,[{...items[0],bankId:'different'}]),project);
 assert.equal(applyBankRatings(project,[]),project);
});
