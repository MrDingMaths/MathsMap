import test from 'node:test';import assert from 'node:assert/strict';import {linkedTextHtml,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
test('resource URLs link safely while surrounding prose remains escaped',()=>{
 const html=linkedTextHtml('<b>Visit https://example.org/a?x=1&y=2.');
 assert.match(html,/&lt;b&gt;Visit <a href="https:\/\/example.org\/a\?x=1&amp;y=2"/);
 assert.match(html,/<\/a>\.$/);assert.doesNotMatch(linkedTextHtml('javascript:alert(1)'),/<a/);
});
test('native resource text remains plain editable text and links in output',()=>{
 const doc={blocks:[{type:'paragraph',inlines:[{type:'text',text:'https://mrdingmaths.github.io/LawofLargeNumbers/'}]}]};
 assert.match(renderDocument(doc),/<a href=/);assert.doesNotMatch(renderDocument(doc,{editable:true}),/<a href=/);
});
