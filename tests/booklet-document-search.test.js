import test from 'node:test';
import assert from 'node:assert/strict';
import {documentSearchIndex,questionCodeSearchIndex,searchDocumentEntries} from '../src/lib/booklet-document-search.js';
import {contentTarget} from '../src/lib/booklet-document-controller.js';
import {fromSource} from '../src/lib/document-content.js';

const fixture=()=>({id:'search',sections:[{id:'exercise',title:'Angles',blocks:[{
  id:'block-q3',type:'question',source:{id:'evidence-only'},content:{id:'p17-q3',prompt:fromSource('Find the angles.'),children:[
    {id:'p17-q3-e',prompt:fromSource('Calculate the missing angle.'),children:[],answer:{short:'60°'}},
    {id:'p17-q3-f',prompt:'Explain your answer.',children:[]}
  ]}
}]}]});

test('question codes locate whole questions and individual parts without indexing evidence or layout IDs',()=>{
  const project=fixture(),entries=documentSearchIndex(project);
  const result=searchDocumentEntries(entries,'  P17-Q3-E  ');
  assert.equal(result.length,1);
  assert.equal(result[0].rootId,'p17-q3-e');
  assert.equal(result[0].blockId,'block-q3');
  assert.equal(contentTarget(project,result[0].rootId).node.prompt.blocks[0].inlines[0].text,'Calculate the missing angle.');
  assert.equal(searchDocumentEntries(entries,'p17-q3')[0].code,'p17-q3');
  assert.equal(searchDocumentEntries(entries,'p17-q3-').length,2);
  assert.equal(searchDocumentEntries(entries,'block-q3')[0].blockId,'block-q3');
  assert.equal(searchDocumentEntries(entries,'evidence-only').length,0);
  assert.equal(searchDocumentEntries(entries,'   ').length,0);
  assert.equal(searchDocumentEntries(entries,'Calculate')[0].kind,undefined,'prose search keeps its editable text result');
  assert.deepEqual(questionCodeSearchIndex(project).map(e=>e.code),['block-q3','p17-q3','p17-q3-e','p17-q3-f']);
});

test('code locations follow moved questions and omit deleted parts',()=>{
  const project=fixture(),block=project.sections[0].blocks.pop();
  block.content.children.pop();
  project.sections.push({id:'moved',title:'Moved',blocks:[block]});
  const entries=documentSearchIndex(project);
  assert.equal(searchDocumentEntries(entries,'p17-q3-e')[0].sectionId,'moved');
  assert.equal(searchDocumentEntries(entries,'p17-q3-f').length,0);
});
