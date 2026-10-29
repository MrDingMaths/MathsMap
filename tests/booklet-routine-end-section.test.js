import test from 'node:test';
import assert from 'node:assert/strict';
import {sequences,routineQuestions} from '../pedagogy/review.mjs';
const project=(topicTitle,sectionTitle='Exercise',role='mixed-practice')=>({topics:[{id:'topic',title:topicTitle}],sections:[{id:'section',topicId:'topic',phase:'practice',role,title:sectionTitle,blocks:[{id:'q',type:'question',content:{id:'native',type:'question',prompt:'Calculate.'},classification:{reasoningScore:20}}]}]});
test('routine coverage excludes actual Exam topic identity despite legacy mixed-practice role',()=>{
 for(const title of ['Exam Questions','Examination question']){const p=project(title),before=JSON.stringify(p);assert.deepEqual(routineQuestions(sequences(p)[0]).questions,[]);assert.equal(JSON.stringify(p),before);}
 const p=project('Waves','Exam questions');assert.deepEqual(routineQuestions(sequences(p)[0]).questions,[]);
});
test('Challenge identity is excluded consistently and source is never migrated',()=>{
 const p=project('Challenge questions'),before=JSON.stringify(p);assert.deepEqual(routineQuestions(sequences(p)[0]).questions,[]);assert.equal(JSON.stringify(p),before);assert.equal(p.sections[0].role,'mixed-practice');
});
test('ordinary practice and an embedded paper attribution remain ordinary until section identity changes',()=>{
 const p=project('Expanding expressions');p.sections[0].blocks[0].source={provider:'HSC',label:'HSC Advanced 2020'};assert.deepEqual(routineQuestions(sequences(p)[0]).questions.map(q=>q.id),['q']);
 const titled=project('Examining patterns');assert.deepEqual(routineQuestions(sequences(titled)[0]).questions.map(q=>q.id),['q']);
});
