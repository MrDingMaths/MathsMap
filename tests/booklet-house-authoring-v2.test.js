import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {HOUSE_AUTHORING,HOUSE_AUTHORING_V2,HOUSE_AUTHORING_VALUES,HOUSE_AUTHORING_PROMPT,HOUSE_AUTHORING_V2_PROMPT,houseAuthoringPrompt,authorMaterializer,materializeHouseAuthoring} from '../scripts/booklet/house-authoring.mjs';

// The recorded v1 prompt: recorded runs hash it into their inputs, so it must never change.
const V1_SHA256='35aaccb053d8d4a8a130d77bb2e3860e4e001079b182b0fa54c2754fe9de99ac';

test('the house-presets-v1 prompt is byte-identical to the recorded one',()=>{
 assert.equal(crypto.createHash('sha256').update(HOUSE_AUTHORING_PROMPT).digest('hex'),V1_SHA256);
 assert.equal(HOUSE_AUTHORING_PROMPT.length,8270);
 assert.equal(HOUSE_AUTHORING,'house-presets-v1');
 assert.equal(houseAuthoringPrompt(HOUSE_AUTHORING),HOUSE_AUTHORING_PROMPT);
 assert.equal(houseAuthoringPrompt(undefined),HOUSE_AUTHORING_PROMPT);
});
test('house-presets-v2 is opt-in and extends the v1 text for teaching blocks only',()=>{
 assert.deepEqual([...HOUSE_AUTHORING_VALUES],['house-presets-v1','house-presets-v2']);
 assert.equal(houseAuthoringPrompt(HOUSE_AUTHORING_V2),HOUSE_AUTHORING_V2_PROMPT);
 assert.match(HOUSE_AUTHORING_V2_PROMPT,/^HOUSE AUTHORING PREFERENCES \(house-presets-v2\)/);
 // Everything after the header is the v1 text, then the teaching rule.
 const body=HOUSE_AUTHORING_PROMPT.slice(HOUSE_AUTHORING_PROMPT.indexOf(')')+1);
 assert.ok(HOUSE_AUTHORING_V2_PROMPT.includes(body));
 const added=HOUSE_AUTHORING_V2_PROMPT.slice(HOUSE_AUTHORING_V2_PROMPT.indexOf('TEACHING BLOCKS (house-presets-v2'));
 for(const phrase of ['source decides STRUCTURE','house style decides every MEASUREMENT','alignment columns','relative indent levels','arrows','figure sits on','relative grouping','1 mm within a group','2 or 4 mm','sourceReview.structure','sourceReview.customArrangement','Independent practice questions are unchanged','two-column worked example','scaffold table with column arrows','ratio table'])assert.ok(added.includes(phrase),phrase);
 assert.notEqual(crypto.createHash('sha256').update(HOUSE_AUTHORING_V2_PROMPT).digest('hex'),V1_SHA256);
});
test('materialisation is enabled by either value and refused without one',()=>{
 const packet=()=>({sections:[{blocks:[{id:'b',type:'question',content:{id:'c',type:'question',questionDiagrams:[{id:'d',diagramTemplate:{family:'number-line',min:0,max:5,step:1}}]}}]}]});
 for(const value of HOUSE_AUTHORING_VALUES){
  const result=authorMaterializer({authoringPreferences:value})(packet());
  assert.match(result.sections[0].blocks[0].content.questionDiagrams[0].code,/tikzpicture/);
 }
 assert.throws(()=>authorMaterializer({})(packet()),/authoringPreferences/);
 assert.throws(()=>authorMaterializer({authoringPreferences:'house-presets-v3'})(packet()),/authoringPreferences/);
 assert.deepEqual(materializeHouseAuthoring({sections:[]},{enabled:false}),{sections:[]});
});
