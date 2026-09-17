import test from 'node:test';
import assert from 'node:assert/strict';
import {revisionHash} from '../scripts/booklet/bank-sync.mjs';
import {appendShortAnswerMethod,shortAnswerMethodMigration} from '../scripts/booklet/apply-short-answer-methods.mjs';
import {fromSource,contentSource} from '../src/lib/document-content.js';

function fixture(){
  const teaching={id:'t',type:'rich-text',content:'Add the indices.'};
  const node={id:'a',prompt:'Simplify.',answer:{short:fromSource('$x^5$'),worked:'$x^{2+3}=x^5$',provenance:'source'}};
  const p={id:'p',revision:7,settings:{sourcePagination:true},sections:[{blocks:[teaching,{id:'q',classification:{topic:'indices'},content:{id:'root',children:[node]}}]}]};
  const method='Add the indices of the matching bases.';
  const amendment={project:p.id,node:node.id,method,before:revisionHash(node.answer.short),after:revisionHash(appendShortAnswerMethod(node.answer.short,method,node.id)),workedHash:revisionHash(node.answer.worked),promptHash:revisionHash(node.prompt),context:[{id:'t',blockHash:revisionHash(teaching)}]};
  return {p,node,migrate:shortAnswerMethodMigration({amendments:[amendment]})};
}

test('reviewed methods preserve editable blocks, IDs, worked content and local metadata',()=>{
  const {p,node,migrate}=fixture(),before=structuredClone(p),{next,records}=migrate(p);
  const answer=next.sections[0].blocks[1].content.children[0].answer;
  assert.deepEqual(answer.short.blocks[0],node.answer.short.blocks[0]);
  assert.equal(answer.worked,node.answer.worked);
  assert.equal(contentSource(answer.short),'$x^5$\n\nAdd the indices of the matching bases.');
  assert.deepEqual(answer.provenance,{short:'authored',worked:'source'});
  assert.deepEqual(next.settings,p.settings);
  assert.deepEqual(next.sections[0].blocks[1].classification,p.sections[0].blocks[1].classification);
  assert.equal(records[0].location,'/sections/0/blocks/1/content/children/0');
  assert.deepEqual(p,before);
  assert.deepEqual(migrate(next).records,[],'Idempotent without duplicate hints');
});

test('concurrent answer, question and teaching-context changes stop amendments',()=>{
  for(const change of [f=>f.node.answer.short='Changed',f=>f.node.answer.worked='Changed',f=>f.node.prompt='Changed',f=>f.p.sections[0].blocks[0].content='Changed']){
    const f=fixture();change(f);assert.throws(()=>f.migrate(f.p),/changed/);
  }
});
