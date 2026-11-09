import test from 'node:test';
import assert from 'node:assert/strict';
import {isExamQuestion} from '../polish/end-section-role.mjs';
import {sourceFromBookletTitle} from '../scripts/booklet/regroup-exam-sections.mjs';

test('explicit undated HSC Sample titles retain Exam identity',()=>{
 for(const title of ['HSC Sample Advanced Question Band 4','HSC Sample Extension 1 Question Band 5','HSC Sample Extension 2 Question','HSC Sample Standard 2 Question Band 3','HSC Sample Question'])assert(isExamQuestion({title}));
});
test('a course before "Sample" is an Exam question too (Ratios 2 p57-q12, 9 November 2026)',()=>{
 for(const title of ['HSC Standard 2 Sample Question Band 4','HSC Advanced Sample Question','HSC Extension 1 Sample Question Band 5'])assert(isExamQuestion({title}),title);
 for(const title of ['HSC Standard 2 Sample Question practice','HSC Standard Sample-style Question'])assert.equal(isExamQuestion({title}),false,title);
});

test('sample recognition does not absorb practice titles or prose references',()=>{
 for(const title of ['HSC sample-style practice','HSC Sample Advanced Question practice','HSC Sample Advanced Question revision','Try this HSC Sample Advanced Question','HSC practice Advanced Question','Sample Advanced Question'])assert.equal(isExamQuestion({title}),false,title);
 assert.equal(isExamQuestion({content:{prompt:'Consider an HSC Sample Advanced Question.'}}),false);
});
test('known sample courses receive readable attribution without invented year or paper question',()=>{
 for(const paper of ['Advanced','Extension 1','Extension 2','Standard 2']){
  const source=sourceFromBookletTitle({title:`HSC Sample ${paper} Question Band 4`});
  assert.deepEqual(source,{provider:'HSC',paper,label:`HSC ${paper} Sample Question`,origin:'booklet'});
 }
 assert.equal(sourceFromBookletTitle({title:'2010 HSC Advanced Question Band 5'}).label,'HSC Advanced 2010');
});
