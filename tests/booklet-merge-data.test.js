import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeDataBooklets} from '../scripts/booklet/merge-data-classification-visualisation.mjs';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {sourcePageOptions, sourceReferences, sourceInventories} from '../src/lib/booklet-source-content.js';
import {inspectContentCoverage,contentVerificationKey} from '../src/lib/booklet-content-verification.js';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fullBookletImportPlugin} from '../scripts/booklet/full-import-server.mjs';

function fixture(id, runId) {
  return {id, revision: 265, title: id, source: {runId, inventory: {entries: [{id:'source-1',targetId:'q',pageNumber:2}]}},
    topics:[{id:'topic',title:'Topic'}], sections:[{id:'section',topicId:'topic',phase:'practice',sourcePageNumber:2,blocks:[{id:'q',type:'question',sourceRefs:[{pageNumber:2}],content:{id:'content',prompt:'q',children:[{id:'part',type:'part',prompt:'Read data',answer:{short:'2'}}]},dependsOn:['part'],sourceReview:{responses:[{targetId:'part',scaffoldTargetId:'content'}]}}]}],
    settings:{generatedCover:true,cover:{title:'old',book:'Book 1'},preserveSourcePages:false,layoutOverrides:{blockLayouts:{'q#/prompt':{arrangement:{items:[{id:'item',ref:'part'}]}}},answerSpaces:{part:42}},compactAnswers:{diagramStyles:{short:{part:{widthMm:50}}}}},
    studio:{version:1,flags:[{id:'flag',targetId:'q',resolved:true}],atoms:{q:{role:'teaches'}}},assets:[]};
}
test('merge preserves original content, ownership and settings while namespacing imported references and overrides',()=>{
  const existing=fixture('data-visualisation-1-v1','original');
  existing.sections[0].blocks[0].bankRef={id:'owned-bank',revision:6};
  const before=structuredClone(existing),first=fixture('classification','classify'),last=fixture('visualisation-2','visual2');
  const merged=mergeDataBooklets(existing,first,last);
  assert.deepEqual(existing,before);
  assert.deepEqual(merged.sections[1],existing.sections[0]);
  assert.equal(merged.revision,265);
  assert.deepEqual(merged.source.inventory,existing.source.inventory);
  assert.equal(merged.sections[0].topicId,'data-classification--topic');
  const block=merged.sections[0].blocks[0];
  assert.deepEqual(block.dependsOn,['data-classification--part']);
  assert.equal(block.content.prompt,'q','prose matching an ID is not rewritten');
  assert.equal(block.sourceReview.responses[0].scaffoldTargetId,'data-classification--content');
  assert.deepEqual(block.sourceRefs,[{pageNumber:2,runId:'classify'}]);
  assert.equal(merged.settings.layoutOverrides.blockLayouts['data-classification--q#/prompt'].arrangement.items[0].ref,'data-classification--part');
  assert.equal(merged.settings.layoutOverrides.answerSpaces['data-classification--part'],42);
  assert.equal(merged.settings.compactAnswers.diagramStyles.short['data-classification--part'].widthMm,50);
  assert.deepEqual(merged.source.imports[0].source,first.source);
  assert.equal(merged.settings.cover.title,'Data Classification and Visualisation');
  assert.equal(merged.settings.cover.book,existing.settings.cover.book);
  assert.deepEqual(merged.studio.flags[0],existing.studio.flags[0]);
});
test('identical imports are no-ops after manual edits; changed sources and unrecorded imports require reconciliation',()=>{
  const base=fixture('data-visualisation-1-v1','original'),first=fixture('classification','classify'),last=fixture('visualisation-2','visual2');
  const merged=mergeDataBooklets(base,first,last);
  merged.sections[0].blocks[0].content.prompt='Teacher edit';
  assert.deepEqual(mergeDataBooklets(merged,first,last),merged);
  first.sections[0].blocks[0].content.prompt='Updated import';
  assert.throws(()=>mergeDataBooklets(merged,first,last),/candidate changed/);
  delete merged.source.imports;
  assert.throws(()=>mergeDataBooklets(merged,first,last),/unrecorded previous import/);
});
test('global skill IDs survive local topic and content identity collisions',()=>{
  const base=fixture('data-visualisation-1-v1','original'),first=fixture('classification','classify'),last=fixture('visualisation-2','visual2');
  last.sections[0].blocks[0].classification={primarySkillId:'topic',secondarySkillIds:['part'],difficulty:2};
  last.sections[0].blocks[0].skillId='topic';
  last.sections[0].blocks[0].skillIds=['topic','part'];
  const merged=mergeDataBooklets(base,first,last),section=merged.sections.at(-1),block=section.blocks[0];
  assert.equal(section.topicId,'data-visualisation-2--topic');
  assert.equal(block.content.children[0].id,'data-visualisation-2--part');
  assert.deepEqual(block.classification,last.sections[0].blocks[0].classification);
  assert.equal(block.skillId,'topic');
  assert.deepEqual(block.skillIds,['topic','part']);
});
test('source-review arrangement orders reference namespaced nodes without rewriting unrelated order values',()=>{
  const base=fixture('data-visualisation-1-v1','original'),first=fixture('classification','classify'),last=fixture('visualisation-2','visual2');
  first.sections[0].blocks[0].sourceReview.arrangements=[{order:['part','content'],reason:'part'}];
  first.sections[0].blocks[0].content.order=['part'];
  const merged=mergeDataBooklets(base,first,last),block=merged.sections[0].blocks[0];
  assert.deepEqual(block.sourceReview.arrangements[0].order,['data-classification--part','data-classification--content']);
  assert.equal(block.sourceReview.arrangements[0].reason,'part');
  assert.deepEqual(block.content.order,['part']);
  assert.deepEqual(merged.source.imports[0].source,first.source);
});

test('source run identity survives normalization and distinguishes equal page numbers',()=>{
  const base=fixture('data-visualisation-1-v1','original'),first=fixture('classification','classify'),last=fixture('visualisation-2','visual2');
  const merged=normalizeEditableProject(mergeDataBooklets(base,first,last));
  assert.deepEqual(merged.source.imports[0].source,first.source);
  const refs=sourceReferences(merged.sections[0].blocks[0]);
  const options=sourcePageOptions(merged,[...refs,{pageNumber:2},{pageNumber:2,runId:'visual2'},...refs]);
  assert.equal(options.length,3);
  assert.equal(new Set(options.map(option=>option.key)).size,3);
  assert.match(options[0].url,/full-imports\/classify\/files\/evidence\/pages\/page-002\.png$/);
  assert.match(options[1].url,/full-imports\/original\//);
  assert.match(options[2].label,/visualisation-2/);
});
test('imported evidence assets resolve to their own source run and ownership fails closed',()=>{
  const base=fixture('data-visualisation-1-v1','original'),first=fixture('classification','classify'),last=fixture('visualisation-2','visual2');
  first.sections[0].blocks[0].content.image={id:'image',src:'evidence/crop.png'};
  assert.equal(mergeDataBooklets(base,first,last).sections[0].blocks[0].content.image.src,'/__booklet/full-imports/classify/files/evidence/crop.png');
  first.sections[0].blocks[0].bankRef={id:'foreign-bank'};
  assert.throws(()=>mergeDataBooklets(base,first,last),/ownership needs explicit reconciliation/);
});
test('teaching-group identities are namespaced while their labels and original evidence remain intact',()=>{
  const base=fixture('data-visualisation-1-v1','original'),first=fixture('classification','classify'),last=fixture('visualisation-2','visual2');
  for(const project of [base,first,last])project.sections[0].blocks[0].sourceAtom={id:'shared-group',kind:'definition',label:'shared-group',targetId:'q'};
  first.source.inventory.entries[0].sourceAtom=structuredClone(first.sections[0].blocks[0].sourceAtom);
  const merged=mergeDataBooklets(base,first,last);
  assert.deepEqual(merged.sections.map(section=>section.blocks[0].sourceAtom.id),['data-classification--shared-group','shared-group','data-visualisation-2--shared-group']);
  assert.equal(merged.sections[0].blocks[0].sourceAtom.targetId,'data-classification--q');
  assert.equal(merged.sections[0].blocks[0].sourceAtom.label,'shared-group');
  assert.deepEqual(merged.source.imports[0].source.inventory.entries[0].sourceAtom,first.source.inventory.entries[0].sourceAtom);
});
test('merged evidence URL is served from the prepared run evidence directory',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'mathsmap-merge-evidence-'));
  try{
    await mkdir(path.join(root,'classify','evidence'),{recursive:true});
    await writeFile(path.join(root,'classify','evidence','crop.png'),'fixture-image');
    const base=fixture('data-visualisation-1-v1','original'),first=fixture('classification','classify'),last=fixture('visualisation-2','visual2');
    first.sections[0].blocks[0].content.image={id:'image',src:'evidence/crop.png'};
    const url=mergeDataBooklets(base,first,last).sections[0].blocks[0].content.image.src;
    let handler,body;
    fullBookletImportPlugin({workRoot:root}).configureServer({middlewares:{use:fn=>handler=fn}});
    const response={setHeader(){},end(value){body=value;}};
    await handler({url,method:'GET'},response,()=>assert.fail('Expected evidence endpoint'));
    assert.equal(response.statusCode,200);
    assert.equal(body.toString(),'fixture-image');
  }finally{await rm(root,{recursive:true,force:true});}
});
test('merged readiness checks every inventory without invalidating unchanged original signatures',async()=>{
  const base=fixture('data-visualisation-1-v1','original'),first=fixture('classification','classify'),last=fixture('visualisation-2','visual2');
  const entry=base.source.inventory.entries[0];
  entry.verification={checked:true,signature:await contentVerificationKey(base,entry)};
  first.source.inventory.selectedPages=[2,3];
  first.source.inventory.pages=[{pageNumber:2,inventoried:true}];
  first.source.inventory.entries[0].verification={checked:true,signature:await contentVerificationKey(first,first.source.inventory.entries[0])};
  const merged=mergeDataBooklets(base,first,last),inventories=sourceInventories(merged);
  assert.equal(inventories.length,3);
  assert.equal(inventories[1].entries[0].targetId,'data-classification--q');
  assert.equal(await contentVerificationKey(merged,entry),entry.verification.signature);
  const report=await inspectContentCoverage(merged);
  assert.equal(report.rows.find(row=>row.id==='source-1').state,'verified');
  assert.equal(report.rows.find(row=>row.id==='data-classification--source-1').state,'unchecked');
  assert.ok(report.issues.some(issue=>issue.kind==='unchecked-page'&&issue.note.includes('classify p3')));
  assert.ok(!report.issues.some(issue=>issue.kind==='unmapped-content'&&issue.targetId==='data-classification--q'));
});
