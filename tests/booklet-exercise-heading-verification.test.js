import test from 'node:test';
import assert from 'node:assert/strict';
import {collectExerciseHeadings,assertExerciseHeadingCoverage} from '../scripts/booklet/check-compact-exercises.mjs';

const project=labels=>({settings:{exerciseOrganisation:'topic',numberPracticeTopicsOnly:true},topics:labels.map((exerciseLabel,i)=>({id:String(i),exerciseLabel})),sections:labels.map((_,i)=>({topicId:String(i),phase:'practice',blocks:[{id:`q${i}`,type:'question'}]}))});

test('production heading collector recognizes complete singular/plural labels and retains numbered headings',()=>{
 assert.deepEqual(collectExerciseHeadings([' Topic ','Exercise','Exercises','Exercise 8A','Exercise Review']),['Exercise','Exercises','Exercise 8A','Exercise Review']);
});

test('production verifier matches exact source labels in every edition',()=>{
 const record=project(['Exercise','Exercises','8A']);
 for(const edition of ['student','with-short','with-worked'])assert.doesNotThrow(()=>assertExerciseHeadingCoverage(['Exercise','Exercises','Exercise 8A'],record,edition));
 for(const edition of ['short','worked']){
  assert.doesNotThrow(()=>assertExerciseHeadingCoverage([],record,edition));
  assert.throws(()=>assertExerciseHeadingCoverage(['Exercise'],record,edition));
 }
});

test('unnumbered recognition cannot bypass exact identity, sequence, uniqueness or numeric coverage',()=>{
 const record=project(['Exercise','8A']);
 for(const headings of [[],['Exercise'],['Exercises','Exercise 8A'],['Exercise Exercise','Exercise 8A'],['Exercise','Exercise 8B'],['Exercise','Exercise','Exercise 8A'],['Exercise 8A','Exercise'],['Exercise','Exercise 8A','Exercises']])assert.throws(()=>assertExerciseHeadingCoverage(headings,record,'student'));
 assert.throws(()=>assertExerciseHeadingCoverage(['Exercise'],project(['1']),'student'));
 assert.doesNotThrow(()=>assertExerciseHeadingCoverage(['Exercise 1'],project(['1']),'student'));
});
