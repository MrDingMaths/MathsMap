import test from 'node:test';
import assert from 'node:assert/strict';
import {isExamQuestion} from '../polish/end-section-role.mjs';

test('original HSC citations retain Exam identity at every score',()=>{
 for(const title of ['2004 HSC Extension 1 Band 5','2018 HSC Mathematics Extension 1','HSC Extension 1 2004','HSC Advanced 2011','[2004 HSC Extension 1]']){
  for(const reasoningScore of [12,65,88])assert.equal(isExamQuestion({title,classification:{reasoningScore}}),true,title);
 }
});
test('generic exam-style titles and question prose do not establish source identity',()=>{
 for(const title of ['HSC style practice 2004','2018 HSC practice','HSC preparation 2026','Inverse functions','Example: 2004 HSC Extension 1'])assert.equal(isExamQuestion({title}),false,title);
 assert.equal(isExamQuestion({title:'Inverse functions',content:{prompt:'Discuss a 2004 HSC question.'}}),false);
});
test('existing explicit paper metadata still establishes Exam identity',()=>{
 for(const source of [{provider:'HSC'},{paper:'PLC Y10 T2 2025'},{label:'NESA sample paper'}])assert.equal(isExamQuestion({title:'Question',source}),true);
});
