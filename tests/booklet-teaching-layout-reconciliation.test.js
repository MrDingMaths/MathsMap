import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditableProject,normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {syncDiagramPresentation} from '../src/lib/booklet-document-tools.js';
import {reconcileProjectLayouts} from '../src/lib/question-sync-layout.js';

test('resizing teaching diagrams reconciles saved layouts without a practice content root',()=>{
 for(const type of ['worked-example','guided-practice','callout']){
  const block={id:'teaching',type,examples:[{id:'example',prompt:'Find the area.',questionDiagrams:[{id:'figure',format:'tikz',code:'source',widthMm:42,originalDiagram:{code:'original'}}]}]};
  const before=createEditableProject({id:'teaching-resize',sections:[{id:'s',blocks:[block]}]});
  before.settings.layoutOverrides.blockLayouts.teaching={arrangement:resolveArrangement(block).tree};
  const candidate=structuredClone(before);
  candidate.sections[0].blocks[0].examples[0].questionDiagrams[0].widthMm=32;
  const next=reconcileProjectLayouts(before,syncDiagramPresentation(candidate,'teaching','figure',{widthMm:32}));
  const reopened=normalizeEditableProject(JSON.parse(JSON.stringify(next)));
  const actual=reopened.sections[0].blocks[0];
  assert.equal(actual.examples[0].questionDiagrams[0].widthMm,32);
  assert.deepEqual(actual.examples[0].questionDiagrams[0].originalDiagram,{code:'original'});
  assert.equal(actual.examples[0].prompt,'Find the area.');
  assert.equal(before.sections[0].blocks[0].examples[0].questionDiagrams[0].widthMm,42);
  assert.deepEqual(reopened.settings.layoutOverrides.blockLayouts.teaching,next.settings.layoutOverrides.blockLayouts.teaching);
 }
});
