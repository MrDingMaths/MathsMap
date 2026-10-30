import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {archetypeSourceHash,reuseArchetypeMap} from '../pedagogy/archetype-metadata.mjs';
const setup=()=>{
 const reviewedProject={id:'p',revision:75,sections:[{id:'practice',phase:'practice',blocks:[{id:'q',type:'question',classification:{reasoningScore:20},content:{id:'part',prompt:'Evaluate.'}}]}]};
 const snapshotSha256=createHash('sha256').update(JSON.stringify(reviewedProject)).digest('hex');
 const map={projectId:'p',revision:75,status:'pending-user-review',snapshotSha256,questions:{q:{archetype:'evaluate',topicId:'t',practiceItems:[{nodeIds:['part']}]}},topics:[{topicId:'t',clusters:[{id:'evaluate',coverage:'prior-knowledge'}]}]};
 const currentProject=structuredClone(reviewedProject);currentProject.revision=76;
 return {reviewedProject,currentProject,map,snapshotSha256};
};

test('metadata retains actual per-topic reviewers and historical Sol attribution',()=>{
 const historical=setup();
 const old=reuseArchetypeMap(historical).candidate.sections[0].blocks[0].classification.archetypeReview;
 assert.equal(old.model,'gpt-6.1-sol');assert.equal(old.effort,'low');
 const current=setup();current.map.reviewConfiguration={model:'gpt-6.1-terra',effort:'high'};
 const terra=reuseArchetypeMap(current).candidate.sections[0].blocks[0].classification.archetypeReview;
 assert.equal(terra.model,'gpt-6.1-terra');assert.equal(terra.effort,'high');
 current.map.topics[0].reviewConfiguration={model:'gpt-6.1-sol',effort:'low'};
 assert.equal(reuseArchetypeMap(current).candidate.sections[0].blocks[0].classification.archetypeReview.model,'gpt-6.1-sol');
});
test('scope-external comments and exam moves reuse recorded review without accepting it',()=>{
 const o=setup(),q=o.currentProject.sections[0].blocks.pop();o.currentProject.sections.push({id:'exam',role:'exam',workingSpace:'none',blocks:[q,{id:'new-exam',content:{prompt:'External.'}}]});o.currentProject.studio={flags:[{id:'teacher',note:'Keep.'}]};
 const result=reuseArchetypeMap(o);
 assert.equal(result.map.revision,76);assert.equal(result.map.reviewedRevision,75);assert.equal(result.map.status,'pending-user-review');
 assert.equal(result.map.reviewedSnapshotSha256,o.snapshotSha256);assert.equal(result.candidate.studio.flags[0].note,'Keep.');
 assert.equal(result.candidate.sections[1].blocks[0].classification.archetype,'evaluate');
 assert.equal(result.candidate.sections[1].blocks[1].classification,undefined);assert.equal(o.currentProject.sections[1].blocks[0].classification.archetype,undefined);
 assert.equal(result.patch.expectedRevision,76);assert.match(result.map.reuse.reviewAcceptance,/no acceptance inferred/);
});
test('every original block field except the two archetype metadata fields is guarded',()=>{
 const o=setup(),q=o.currentProject.sections[0].blocks[0],before=archetypeSourceHash(q);
 q.classification.archetype='old';q.classification.archetypeReview={old:true};assert.equal(archetypeSourceHash(q),before);
 for(const mutate of [b=>b.content.prompt='Changed.',b=>b.classification.reasoningScore=21,b=>b.flow={dependsOn:'another'},b=>b.sourceRefs=[{page:2}]]){const changed=setup();mutate(changed.currentProject.sections[0].blocks[0]);assert.throws(()=>reuseArchetypeMap(changed),/Reviewed block changed/);}
});
test('missing blocks, mismatched snapshot identity/hash and unreviewed map entries fail closed',()=>{
 const missing=setup();missing.currentProject.sections[0].blocks=[];assert.throws(()=>reuseArchetypeMap(missing),/Reviewed block missing/);
 const identity=setup();identity.currentProject.id='other';assert.throws(()=>reuseArchetypeMap(identity),/identity mismatch/);
 const hash=setup();hash.snapshotSha256='wrong';assert.throws(()=>reuseArchetypeMap(hash),/snapshot hash mismatch/);
 const items=setup();items.map.questions.q.practiceItems=[];assert.throws(()=>reuseArchetypeMap(items),/Missing reviewed archetype/);
});
test('a later explicit rebind retains the original reviewed revision and source hash',()=>{
 const o=setup(),first=reuseArchetypeMap(o);const currentProject=structuredClone(first.candidate);currentProject.revision=77;
 const next=reuseArchetypeMap({...o,currentProject,map:first.map});assert.equal(next.map.revision,77);assert.equal(next.map.reviewedRevision,75);assert.equal(next.map.reuse.sourceHashes.q,first.map.reuse.sourceHashes.q);
});


test('coverage reuse also protects the supplied teaching context',()=>{
 const o=setup();const teaching={id:'teach',phase:'teaching',blocks:[{id:'example',content:'Original method.'}]};o.reviewedProject.sections.unshift(structuredClone(teaching));o.currentProject.sections.unshift(structuredClone(teaching));
 o.snapshotSha256=createHash('sha256').update(JSON.stringify(o.reviewedProject)).digest('hex');o.map.snapshotSha256=o.snapshotSha256;
 assert.equal(reuseArchetypeMap(o).map.reuse.teachingContextHashes.example,archetypeSourceHash(teaching.blocks[0]));
 o.currentProject.sections[0].blocks[0].content='Different method.';assert.throws(()=>reuseArchetypeMap(o),/teaching context changed/);
});

test('explicit exact James-approved source whitelist permits attribution only',()=>{
 const o=setup(),label={provider:'HSC',paper:'Extension 1',year:'2011',label:'HSC Extension 1 2011',origin:'MathsBase'};
 o.currentProject.sections[0].blocks[0].source=label;
 assert.throws(()=>reuseArchetypeMap(o),/Reviewed block changed/);
 const approvedAttributions={approvedBy:'James',reason:'Approved pilot source labels.',sources:{q:label}};
 const result=reuseArchetypeMap({...o,approvedAttributions});
 assert.equal(result.map.reuse.attributionMatches.q.currentSource.label,label.label);
 assert.equal(result.patch.changes[0].expectedSourceHash,archetypeSourceHash(o.currentProject.sections[0].blocks[0]));
 assert.equal(result.map.reviewedRevision,75);assert.equal(result.map.status,'pending-user-review');
 o.currentProject.sections[0].blocks[0].content.prompt='Changed mathematics';assert.throws(()=>reuseArchetypeMap({...o,approvedAttributions}),/also changes mathematics/);
});
test('attribution exception cannot broaden to another ID, unknown fields or a different label',()=>{
 const o=setup();o.currentProject.sections[0].blocks[0].source={label:'HSC Extension 1 2011'};
 const base={approvedBy:'James',reason:'Approved labels.',sources:{q:{label:'HSC Extension 1 2011'}}};
 assert.throws(()=>reuseArchetypeMap({...o,approvedAttributions:{...base,approvedBy:'inferred'}}),/named James approval/);
 assert.throws(()=>reuseArchetypeMap({...o,approvedAttributions:{...base,sources:{other:{label:'HSC'}}}}),/block missing/);
 assert.throws(()=>reuseArchetypeMap({...o,approvedAttributions:{...base,sources:{q:{label:'Different'}}}}),/differs from approved/);
 assert.throws(()=>reuseArchetypeMap({...o,approvedAttributions:{...base,sources:{q:{label:'HSC',content:'unapproved'}}}}),/unsupported fields/);
});
