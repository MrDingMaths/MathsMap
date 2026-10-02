import test from 'node:test';
import assert from 'node:assert/strict';
import {expectedTeachingGroupIds} from '../scripts/booklet/check-compact-exercises.mjs';
test('printed teaching coverage preserves visible shared groups and excludes editor-only source evidence',()=>{
 const project={sections:[{blocks:[{sourceAtom:{id:'example'}},{sourceAtom:{id:'example'}},{sourceAtom:{id:'source-footer'},presentation:{editorOnly:true}},{sourceAtom:{id:'key-ideas'},presentation:{editorOnly:false}},{type:'question'}]}]};
 assert.deepEqual(expectedTeachingGroupIds(project),['example','key-ideas']);
});
