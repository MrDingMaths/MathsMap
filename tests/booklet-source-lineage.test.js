import test from 'node:test';
import assert from 'node:assert/strict';
import {preserveSourceLineage} from '../scripts/booklet/source-lineage.mjs';

const project=blocks=>({id:'fixture-project',sections:[{id:'exercise',blocks}]});

test('saving a changed booklet preserves legacy string lineage and notes without coercion',()=>{
 const previous=project([{id:'anchor'},{id:'context',sourceReview:{additionTo:'historical-anchor',note:'Retain the original introduction.'}}]);
 const original=structuredClone(previous),candidate=structuredClone(previous);
 candidate.sections[0].blocks[0].title='Corrected presentation';
 preserveSourceLineage(previous,candidate);
 assert.deepEqual(previous,original);
 assert.deepEqual(candidate.sections[0].blocks[1].sourceReview,original.sections[0].blocks[1].sourceReview);
});

test('new explicit object lineage keeps its target and receives the current project identity',()=>{
 const previous=project([{id:'anchor'}]),candidate=structuredClone(previous);
 candidate.sections[0].blocks.push({id:'new-block',sourceReview:{additionTo:{blockId:'explicit-target'}}});
 preserveSourceLineage(previous,candidate);
 assert.deepEqual(candidate.sections[0].blocks[1].sourceReview.additionTo,{projectId:'fixture-project',blockId:'explicit-target'});
});

test('saving preserves existing explicit project and origin history',()=>{
 const previous=project([{id:'anchor'},{id:'context',sourceReview:{additionTo:{projectId:'historical-project',blockId:'historical-block'},origin:{runId:'original-run',blockId:'original-block'}}}]);
 const candidate=structuredClone(previous);
 candidate.sections[0].blocks[1].title='Corrected presentation';
 preserveSourceLineage(previous,candidate);
 assert.deepEqual(candidate.sections[0].blocks[1].sourceReview,previous.sections[0].blocks[1].sourceReview);
});
