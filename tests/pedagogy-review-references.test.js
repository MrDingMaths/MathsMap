import test from 'node:test';
import assert from 'node:assert/strict';
import {projectReviewReferences} from '../pedagogy/review-references.mjs';
import {arrangementCatalog,arrangementQuestionBlock} from '../src/lib/booklet-arrangement.js';
import {flowNumbers} from '../src/lib/booklet-flow.js';

function fixture(){
 const question=(id,label,prompt,children=[])=>({id,type:'question',pedagogyRole:'practice',sourceOrder:Number(label),content:{id:id+'-native',type:'question',label,prompt,children}});
 const a=question('p7-q6','6','Calculate the hourglass side.',[{id:'p7-q6-a',type:'question',label:'a',prompt:'Find x.'}]);
 const b=question('p7-q5','5','Use Question 1 to find y.');b.flow={dependsOn:['p7-q6']};
 return {id:'master-v1',revision:1,settings:{exerciseOrganisation:'topic',questionOrder:'source'},sections:[{id:'practice-source-p7',topicId:'similar-triangles',phase:'practice',blocks:[a,b]}]};
}
function prepare(extra={}){
 const project=fixture();const payload={practice:structuredClone(project.sections[0].blocks),candidates:[{id:'c1',targets:['p7-q6','p7-q5'],finding:'Move p7-q5 before p7-q6; preserve Question 1.'}],groups:[{ids:['p7-q6','p7-q5']}],sourceRefs:[{pageNumber:7}],...extra};
 return {project,payload,...projectReviewReferences({project,payload,purpose:'pedagogy-order',proposedOrder:['p7-q5','p7-q6']})};
}
test('neutral traversal refs expose printed numbers, multipart labels and exact orders without mutating project',()=>{
 const original=fixture(),p=prepare();assert.deepEqual(p.project,original);
 const [a,b]=p.payload.practice;assert.match(a.id,/^ref\d{4}$/);assert.notEqual(a.id,b.id);
 assert(p.payload.candidates[0].finding.includes(b.id+' before '+a.id));assert.match(p.payload.candidates[0].finding,/Question 1/);
 assert(!JSON.stringify(p.payload).includes('p7-q'));assert.deepEqual(p.payload.sourceRefs,[{pageNumber:7}]);
 const context=p.payload.reviewReferences;assert.deepEqual(context.originalOrder,[a.id,b.id]);assert.deepEqual(context.proposedOrder,[b.id,a.id]);
 assert.equal(context.targets.find(t=>t.id===a.id).displayNumber,1);assert.equal(context.targets.find(t=>t.id===b.id).displayNumber,2);
 assert.equal(a.content.label,'1');assert.equal(b.content.label,'2');assert.equal(a.content.children[0].label,'a');
 assert.deepEqual(context.targets.find(t=>t.id===a.content.children[0].id).partLabels,['a']);
 assert(context.dependencies.some(d=>d.ownerId===b.id&&d.targetId===a.id&&d.kind==='flow.dependsOn'));
 assert(context.literalReferences.some(r=>r.ownerId===b.id&&r.targetId===a.id&&r.quote==='Question 1'));
 assert.deepEqual(p.payload.groups,[{ids:[a.id,b.id]}]);
});
test('catalogue stays bounded to encoded identities and owning blocks; mathematical r1/r2 survive',()=>{
 const project=fixture();project.sections[0].blocks[0].content.children.push({id:'unused-native-paragraph',type:'paragraph',prompt:'Unused.'});
 const p=projectReviewReferences({project,payload:{practice:[{id:'p7-q6',content:{label:'6',prompt:'Compare r1 and r2.'}}]},purpose:'practice-order'});
 assert.equal(p.payload.reviewReferences.targets.length,1);assert.equal(p.payload.reviewReferences.targets[0].id,p.payload.practice[0].id);
 assert.deepEqual(p.decode({reason:'Compare r1 and r2.'}),{reason:'Compare r1 and r2.'});
 const full=projectReviewReferences({project,payload:{practice:project.sections[0].blocks},purpose:'practice-order'});
 assert.throws(()=>p.decode({targets:[full.payload.practice[1].id]}),/reference/,'An unexposed master target is outside this task');
});
test('additional native reference arrays, moves and working/practice map keys validate and decode',()=>{
 const p=prepare(),[a,b]=p.payload.practice;
 for(const field of ['questionIds','teachingIds','exampleIds','guidedPracticeIds','nodeIds','moveAfter','moveBefore','keepTogether']){
  assert.throws(()=>p.decode({[field]:['unknown']}),/reference/);
  assert.deepEqual(p.decode({[field]:[a.id]}),{[field]:['p7-q6']});
 }
 assert.throws(()=>p.decode({moves:[{id:'unknown',moveAfter:a.id}]}),/reference/);
 assert.deepEqual(p.decode({moves:[{id:b.id,moveAfter:a.id}]}),{moves:[{id:'p7-q5',moveAfter:'p7-q6'}]});
 for(const field of ['practiceItems','examples','practice','hints']){
  assert.throws(()=>p.decode({working:{[field]:{unknown:[]}}}),/reference/);
  assert.deepEqual(p.decode({working:{[field]:{[a.id]:[]}}}),{working:{[field]:{'p7-q6':[]}}});
 }
 assert.throws(()=>p.decode({working:{examples:[{id:'unknown'}]}}),/reference/);
 assert.deepEqual(p.decode({working:{practice:[{id:a.id,suppliedBy:'none'}]}}),{working:{practice:[{id:'p7-q6',suppliedBy:'none'}]}});
});
test('skill prerequisites, topic/cluster IDs and cluster task identities keep their namespaces',()=>{
 const project=fixture();project.sections[0].blocks[0].id='c1';delete project.sections[0].blocks[1].flow;
 const payload={practice:[project.sections[0].blocks[0]],clusters:[{id:'c1',questionIds:['c1'],prerequisiteIds:['c1','skill-not-native'],topicId:'cluster-topic'}]};
 const p=projectReviewReferences({project,payload,purpose:'pedagogy-order'});
 assert.equal(p.payload.clusters[0].id,'c1');assert.deepEqual(p.payload.clusters[0].prerequisiteIds,['c1','skill-not-native']);assert.equal(p.payload.clusters[0].topicId,'cluster-topic');
 assert.deepEqual(p.decode({clusters:p.payload.clusters}),{clusters:[{id:'c1',questionIds:['c1'],prerequisiteIds:['c1','skill-not-native'],topicId:'cluster-topic'}]});
});
test('worked-example entry IDs outside content participate in the local protocol',()=>{
 const project=fixture();project.sections.unshift({id:'teaching',topicId:'similar-triangles',phase:'teaching',blocks:[{id:'worked-example',type:'worked-example',examples:[{id:'worked-entry',prompt:'Given method.'}]}]});
 const p=projectReviewReferences({project,payload:{teaching:project.sections[0]},purpose:'pedagogy-order'});
 const ref=p.payload.teaching.blocks[0].examples[0].id;
 assert.match(ref,/^ref\d{4}$/);assert.deepEqual(p.decode(p.encode({working:{examples:[{id:'worked-entry'}]}})),{working:{examples:[{id:'worked-entry'}]}});
});
test('short project/topic IDs and native owner codes never rename student mathematics or prose/schema keys',()=>{
 const project=fixture();project.id='p';project.sections[0].id='teaching';project.sections[0].topicId='circle';project.sections[0].blocks[0].id='c1';delete project.sections[0].blocks[1].flow;
 const prompt='For a circle, calculate $p+c1$; retain literal Question 1 and c1 in the student text.';
 project.sections[0].blocks[0].content.prompt=prompt;
 const payload={teaching:{id:'teaching',blocks:[project.sections[0].blocks[0]]},candidates:[{id:'c1',targets:['c1'],finding:'Check c1: $p+c1$ for a circle.'}]};
 const p=projectReviewReferences({project,payload,purpose:'pedagogy-order'});
 assert.equal(p.payload.teaching.blocks[0].content.prompt,prompt);assert(p.payload.teaching.id.startsWith('ref'));
 assert.equal(p.payload.candidates[0].finding,'Check '+p.payload.teaching.blocks[0].id+': $p+c1$ for a circle.');
 assert.equal(p.payload.teaching.blocks[0].content.label,'1');
});
test('printed multipart paths reuse catalogue leaf index fallbacks and unlabelled groups',()=>{
 const project=fixture(),block=project.sections[0].blocks[0];
 block.content.children=[
  {id:'leaf-first',type:'question',prompt:'Find x.'},
  {id:'leaf-second',type:'question',prompt:'Find y.'},
  {id:'unlabelled-group',type:'group',children:[{id:'nested-first',type:'question',prompt:'Find z.'}]},
  {id:'labelled-group',type:'group',label:'c',children:[{id:'nested-unlabelled-group',type:'group',children:[{id:'nested-leaf',type:'question',prompt:'Find w.'}]}]},
 ];
 const catalogue=arrangementCatalog(arrangementQuestionBlock(block,flowNumbers(project)[block.id]));
 const labels=new Map([...catalogue.entries.values()].filter(entry=>entry.kind==='label').map(entry=>[entry.ownerId,entry.value]));
 const projection=projectReviewReferences({project,payload:{practice:[block]},purpose:'practice-order'});
 const targets=projection.decode({targets:projection.payload.reviewReferences.targets}).targets;
 const path=id=>targets.find(row=>row.id===id).partLabels;
 assert.deepEqual(path('leaf-first'),[labels.get('leaf-first')]);assert.deepEqual(path('leaf-first'),['a']);
 assert.deepEqual(path('leaf-second'),[labels.get('leaf-second')]);assert.deepEqual(path('leaf-second'),['b']);
 assert.equal(labels.get('unlabelled-group'),'');assert.deepEqual(path('unlabelled-group'),[]);
 assert.deepEqual(path('nested-first'),[labels.get('nested-first')]);
 assert.equal(labels.get('nested-unlabelled-group'),'');
 assert.deepEqual(path('nested-leaf'),[labels.get('labelled-group'),labels.get('nested-leaf')]);
 assert.deepEqual(path('nested-leaf'),['c','a']);
 const fidelity=projectReviewReferences({project,payload:{practice:[block]},purpose:'source-fidelity'});
 assert.deepEqual(fidelity.payload.practice[0],block);
});
test('decode restores structured refs, dictionary keys and reason text without changing task-owned IDs',()=>{
 const p=prepare(),[a,b]=p.payload.practice;
 assert.deepEqual(p.decode({findings:[{id:'f1',targets:[b.id],reason:b.id+' follows '+a.id}],byTarget:{[a.id]:{nodeIds:[a.content.children[0].id]}},newStudentContent:0}),{findings:[{id:'f1',targets:['p7-q5'],reason:'p7-q5 follows p7-q6'}],byTarget:{'p7-q6':{nodeIds:['p7-q6-a']}},newStudentContent:0});
 const canonical={findings:[{id:'f1',from:['c1'],targets:['p7-q5'],reason:'p7-q5 follows p7-q6'}],newStudentContent:0};
 assert.deepEqual(p.decode(p.encode(canonical)),canonical);
});
test('unknown refs and canonical/unknown structured targets fail closed',()=>{
 const p=prepare();
 for(const result of [{targets:['ref9999']},{targets:['p7-q5']},{targets:[{id:'made-up'}]},{nodeIds:['made-up']},{reason:'Compare ref9999.'},{newStudentContent:[{id:'made-up'}]},{ref9999:'claim'},{from:['unknown']}])assert.throws(()=>p.decode(result),/reference/);
});
test('source-fidelity bypass preserves original source references; invalid purpose/order fail',()=>{
 const project=fixture(),payload={practice:project.sections[0].blocks};
 const fidelity=projectReviewReferences({project,payload,purpose:'source-fidelity'});
 assert.deepEqual(fidelity.payload,payload);assert.notEqual(fidelity.payload,payload);assert.deepEqual(fidelity.decode({targets:['p7-q6']}),{targets:['p7-q6']});
 assert.deepEqual(fidelity.encode({targets:['p7-q6']}),{targets:['p7-q6']});
 assert.throws(()=>projectReviewReferences({project,payload,purpose:'other'}),/purpose/);
 assert.throws(()=>projectReviewReferences({project,payload,purpose:'practice-order',proposedOrder:['p7-q6']}),/permute/);
});
test('task candidate/context IDs and from refs cannot collide with native identities; asset URLs stay exact',()=>{
 const project=fixture();project.sections[0].blocks[0].id='c1';project.sections[0].blocks[1].id='q1';delete project.sections[0].blocks[1].flow;
 const payload={practice:project.sections[0].blocks,candidates:[{id:'c1',targets:['c1'],finding:'Check c1.'}],contextQuestions:[{id:'q1',targets:['q1']}],image:{url:'/assets/c1/q1.png'},sourceURL:'https://example.test/c1/q1.png'};
 const p=projectReviewReferences({project,payload,purpose:'pedagogy-order'}),[a,b]=p.payload.practice;
 assert.equal(p.payload.candidates[0].id,'c1');assert.deepEqual(p.payload.candidates[0].targets,[a.id]);assert.equal(p.payload.contextQuestions[0].id,'q1');assert.deepEqual(p.payload.contextQuestions[0].targets,[b.id]);
 assert.deepEqual(p.payload.image,payload.image);assert.equal(p.payload.sourceURL,payload.sourceURL);
 assert.deepEqual(p.decode({findings:[{id:'c1',from:['c1','q1'],targets:[a.id,b.id]}]}),{findings:[{id:'c1',from:['c1','q1'],targets:['c1','q1']}]});
 assert.throws(()=>projectReviewReferences({project,payload:{candidates:[{id:'c1',targets:['unknown']}]},purpose:'pedagogy-order'}),/Unknown canonical reference/);
});
