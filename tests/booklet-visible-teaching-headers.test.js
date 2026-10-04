import test from 'node:test';
import assert from 'node:assert/strict';
import {expectedTeachingGroupIds,expectedTeachingHeaderCounts} from '../scripts/booklet/check-compact-exercises.mjs';
test('printed teaching coverage preserves visible shared groups and excludes editor-only source evidence',()=>{
 const project={sections:[{blocks:[{sourceAtom:{id:'example'}},{sourceAtom:{id:'example'}},{sourceAtom:{id:'source-footer'},presentation:{editorOnly:true}},{sourceAtom:{id:'key-ideas'},presentation:{editorOnly:false}},{type:'question'}]}]};
 assert.deepEqual(expectedTeachingGroupIds(project),['example','key-ideas']);
});
test('plain source instructions retain coverage without an invented teaching header',()=>{
 const project={sections:[{blocks:[{sourceAtom:{id:'plain',kind:'instruction'}},{sourceAtom:{id:'plain',kind:'instruction'}},{sourceAtom:{id:'guided',kind:'guided'}},{sourceAtom:{id:'evidence',kind:'instruction'},presentation:{editorOnly:true}}]}]};
 assert.deepEqual(expectedTeachingGroupIds(project),['guided','plain']);
 assert.deepEqual([...expectedTeachingHeaderCounts(project)],[['plain',0],['guided',1]]);
 project.sections[0].blocks.push({sourceAtom:{id:'plain',kind:'example'}});
 assert.throws(()=>expectedTeachingHeaderCounts(project),/consistent header/);
});
