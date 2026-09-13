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
test('Probability repair preserves answers, source evidence, tables, working areas and solution dividers',()=>{
  const project=JSON.parse(fs.readFileSync('booklets/projects/probability-v1.json','utf8'));
  const {next}=repairProbabilityResponseLayout(project);
  const walk=(x,fn)=>{if(!x||typeof x!=='object')return;fn(x);for(const v of Object.values(x))walk(v,fn);};
  const collect=(p,predicate)=>{const result=[];for(const s of p.sections)for(const b of s.blocks)walk(b.content??b.examples,x=>{if(predicate(x))result.push(x);});return result;};
  assert.deepEqual(collect(next,x=>x.short!==undefined||x.worked!==undefined),collect(project,x=>x.short!==undefined||x.worked!==undefined));
  assert.deepEqual(collect(next,x=>x.type==='table'),collect(project,x=>x.type==='table'));
  assert.deepEqual(next.source,project.source);
  for(const [si,s] of project.sections.entries())for(const [bi,b] of s.blocks.entries()){
    const after=next.sections[si].blocks[bi];
    assert.deepEqual(after.sourceLayoutEvidence,b.sourceLayoutEvidence);
    assert.deepEqual(after.bankRef,b.bankRef);
    if(RESPONSE_BLOCKS.includes(b.id)){
      assert.equal(JSON.stringify(after.content).includes('"type":"cloze"'),false,b.id);
      walk(after.content,n=>{if(n.prompt&&!n.children?.length)assert.equal(n.answerSpaceMm,/p14-q13-followup|p14-q15-root/.test(n.id)?8:0,n.id);});
    }
    const a=next.settings.layoutOverrides?.blockLayouts?.[b.id]?.arrangement;
    if(a){assert.deepEqual(resolveArrangement(after,a).missing,[],b.id);walk(a,n=>{if(n.rules==='internal')assert.ok(SOLUTION_RULE_GROUPS.includes(n.id),n.id);});}
  }
  const retained=collect(next,x=>x.type==='cloze');assert.equal(retained.length,61);
  assert.deepEqual(repairProbabilityResponseLayout(next).records,[]);
  for(const flag of project.studio.flags.filter(f=>['fb7990f9-9e20-4736-a49f-4c595993c0ed','d2768a05-d477-4ebd-a6fa-4d7c22a5d9ee'].includes(f.id)))assert.equal(next.studio.flags.find(f=>f.id===flag.id).resolved,flag.resolved);
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
