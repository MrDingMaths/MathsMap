import test from 'node:test';import assert from 'node:assert/strict';import {renderDocument} from '../public/libs/maths-editor/document-model.mjs';
test('native cards use plain black outlines in labelled and unlabelled templates',()=>{
 for(const label of [undefined,'a']){const html=renderDocument({blocks:[{id:'cards',type:'layout',arrangement:'cards',columns:1,slots:[{id:'card',...(label?{label}:{}),blocks:[{id:'value',type:'paragraph',inlines:[{type:'text',text:'M'}]}]}]}]});assert.match(html,/border:\.2[05]?mm solid #000000/);assert.doesNotMatch(html,/box-shadow/);}
});
