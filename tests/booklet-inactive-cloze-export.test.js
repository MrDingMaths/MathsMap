import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {inactiveSqrtClozeChange} from '../scripts/booklet/import-verification-runtime.mjs';
const after=fs.readFileSync(new URL('../public/libs/maths-editor/document-model.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
const start=after.indexOf("    if(n.enclosure==='sqrt'){"),end=after.indexOf('    const content=fillCloze?',start),branch=after.slice(start,end);
const before=after.replace("...(x.enclosure==='sqrt'?{enclosure:'sqrt'}:{}), ",'').replace(branch,'');
const project={source:{reviewProfile:'textbook-three-pass-v1',reviewRoute:'lean-review-v1'},sections:[]};
test('exact inactive optional square-root cloze addition permits unchanged PDF review',()=>assert.equal(inactiveSqrtClozeChange(before,after,project),true));
test('known inactive square-root phantom sizing revision preserves unrelated content',()=>{
 const previous=after.replace('vphantom{2}','vphantom{\\\\frac{1}{1}}');
 assert.equal(inactiveSqrtClozeChange(previous,after,project),true);
 assert.equal(inactiveSqrtClozeChange(previous,after,{...project,content:{enclosure:'sqrt'}}),false);
});
test('active feature, branch changes, unrelated edits and unsupported profiles remain blocked',()=>{
 assert.equal(inactiveSqrtClozeChange(before,after,{...project,sections:[{blocks:[{content:{enclosure:'sqrt'}}]}]}),false);
 assert.equal(inactiveSqrtClozeChange(before,after.replace('vphantom{2}','vphantom{3}'),project),false);
 assert.equal(inactiveSqrtClozeChange(before,after+'\n// another change',project),false);
 assert.equal(inactiveSqrtClozeChange(before,after,{sections:[]}),false);
});
