import test from 'node:test';
import assert from 'node:assert/strict';
import {validSourceRegion,sourceRegionStyles} from '../src/lib/diagram-source-region.js';
import {normaliseQuestion} from '../src/lib/practice-question-model.js';
import {transcriptionHazards} from '../scripts/booklet/transcription.mjs';

test('source image regions retain the original source and reject out-of-bounds crops',()=>{
 const region={x:600,y:20,width:400,height:480,sourceWidth:1000,sourceHeight:500};
 assert.ok(validSourceRegion(region));
 assert.equal(sourceRegionStyles(region).image,'position:absolute;max-width:none;width:250%;height:104.16666666666667%;left:-150%;top:-4.166666666666667%;');
 for(const bad of [{...region,width:401},{...region,x:-1},{...region,height:0},{...region,x:NaN}])assert.equal(sourceRegionStyles(bad),null);
 const relationship={kind:'distinct-from-prompt',evidence:'A graph above a separate source response table.'};
 const q=normaliseQuestion({content:{id:'q',type:'question',prompt:'Graph',diagramPlacement:'before-prompt',questionDiagrams:[{id:'d',src:'original.png',sourceRegion:region,contentRelationship:relationship}],children:[]}});
 assert.equal(q.content.questionDiagrams[0].src,'original.png');
 assert.deepEqual(q.content.questionDiagrams[0].sourceRegion,region);
 const reloaded=normaliseQuestion(JSON.parse(JSON.stringify(q)));
 assert.equal(reloaded.content.diagramPlacement,'before-prompt');
 assert.deepEqual(reloaded.content.questionDiagrams[0].contentRelationship,relationship);
 assert.deepEqual(reloaded.content.questionDiagrams[0].sourceRegion,region);
 const right=normaliseQuestion({...q,content:{...q.content,diagramPlacement:'right-of-prompt',answerSpaceStyle:'box',answerSpaceMm:20}});
 assert.equal(right.content.diagramPlacement,'right-of-prompt');
 assert.equal(right.content.answerSpaceStyle,'box');
});

test('table shape checks catch missing separator cells and retain distinct graph/table arrangements',()=>{
 const draft=(prompt,diagram)=>({pages:[{blocks:[{id:'q',prompt,questionDiagrams:diagram?[diagram]:[]}]}]});
 assert.ok(transcriptionHazards(draft('| x | 0 | 1 |\n| --- | --- |\n| y | 1 | 2 |')).some(e=>e.includes('different cell counts')));
 const prompt='| x | 0 | 1 |\n| --- | --- | --- |\n| y | | |';
 assert.equal(transcriptionHazards(draft(prompt)).length,0);
 assert.ok(transcriptionHazards(draft(prompt,{id:'d',src:'graph.png'})).some(e=>e.includes('duplicates')));
 assert.equal(transcriptionHazards(draft(prompt,{id:'d',src:'graph.png',contentRelationship:{kind:'distinct-from-prompt',evidence:'Page 39: graph above a separate blank response table.'}})).length,0);
});
