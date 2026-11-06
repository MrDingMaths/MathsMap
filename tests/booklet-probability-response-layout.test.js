import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {removeAppendedClozes,repairProbabilityResponseLayout,RESPONSE_BLOCKS,SOLUTION_RULE_GROUPS} from '../scripts/booklet/repair-probability-response-layout.mjs';
import {RESPONSE_LAYOUT_PROMPT,HOUSE_STYLE_PROMPT} from '../public/libs/maths-editor/house-style.mjs';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';

const paragraph=(id,inlines)=>({id,type:'paragraph',inlines});
const text=text=>({type:'text',text}),cloze={type:'cloze',answer:'Yes',width:20};
const doc=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
test('reviewed appended response removal preserves inline completions, tables and standalone source blanks',()=>{
  const inline=paragraph('inline',[text('An outcome is a '),cloze,text(' of an experiment.')]);
  const table={id:'table',type:'table',border:true,rows:[[{blocks:[paragraph('cell',[cloze])]}]]};
  const p=doc([paragraph('prompt',[text('Is it equally likely?'),{type:'break'},cloze]),inline,table]);
  assert.equal(removeAppendedClozes(p),1);
  assert.deepEqual(p.blocks[0],paragraph('prompt',[text('Is it equally likely?')]));
  assert.deepEqual(p.blocks.slice(1),[inline,table]);
  const lone=doc([paragraph('source-blank',[cloze])]);
  assert.equal(removeAppendedClozes(lone),0);
  assert.equal(removeAppendedClozes(p),0);
});
test('reviewed blank-only trailing paragraphs disappear without replacing them by empty lines',()=>{
  const p=doc([paragraph('prompt',[text('List the sample space.')]),paragraph('response',[cloze])]);
  assert.equal(removeAppendedClozes(p),1);
  assert.deepEqual(p.blocks,[paragraph('prompt',[text('List the sample space.')])]);
});
test('other books and bank questions require their own source-reviewed corrections',()=>{
  const input={id:'another-book',sections:[{blocks:[{id:'p4-q1-block',content:{prompt:doc([paragraph('p',[text('Question'),{type:'break'},cloze])])}}]}]};
  assert.deepEqual(repairProbabilityResponseLayout(input),{next:input,records:[]});
});

test('reintroduced open-response clozes and part dividers are repaired while solution rules survive',()=>{
  const project=JSON.parse(fs.readFileSync('booklets/projects/probability-v1.json','utf8'));
  const block=project.sections.flatMap(s=>s.blocks).find(b=>b.id==='p4-q1-block');
  const leaf=block.content.children.find(n=>n.prompt?.blocks?.some(p=>p.type==='paragraph'));
  const prompt=leaf.prompt.blocks.find(p=>p.type==='paragraph');
  prompt.inlines.push({type:'break'},structuredClone(cloze));
  leaf.responseSpace='scaffold';
  const arrangement=project.settings.layoutOverrides.blockLayouts['p9-guided'].arrangement;
  arrangement.root.rules='internal';
  const {next,records}=repairProbabilityResponseLayout(project);
  assert.equal(records.find(r=>r.id==='p4-q1-block').clozes,1);
  assert.equal(next.settings.layoutOverrides.blockLayouts['p9-guided'].arrangement.root.rules,undefined);
  for(const id of ['p23-example-paired','p33-activity','p36-example'])assert.deepEqual(next.settings.layoutOverrides.blockLayouts[id],project.settings.layoutOverrides.blockLayouts[id]);
});
test('shared authoring guidance distinguishes open responses and borderless part layouts',()=>{
  assert.ok(HOUSE_STYLE_PROMPT.includes(RESPONSE_LAYOUT_PROMPT));
  assert.match(RESPONSE_LAYOUT_PROMPT,/do not add clozes/);
  assert.match(RESPONSE_LAYOUT_PROMPT,/Keep borders in actual tables, dedicated writable boxes and solutions/);
});
