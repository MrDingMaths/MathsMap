import test from 'node:test';
import assert from 'node:assert/strict';
import {questionTeachingDependencies} from '../scripts/booklet/import-verification.mjs';
import {exerciseTeachingContext} from '../scripts/booklet/bounded-stages.mjs';

function fixture(){
 const question={id:'q-d',type:'question',sourceRefs:[{pageNumber:32}],sourceReview:{teachingContext:{pdfPages:[28]}},content:{id:'q-d-root',prompt:'Find the distance.'}};
 const project={sections:[{id:'d',exerciseId:'2D',phase:'practice',blocks:[question]}]};
 const state={pages:{28:{sourceEvidence:'source-28',inventoryHash:'inventory-28'},32:{sourceEvidence:'source-32',inventoryHash:'inventory-32'}},issues:{}};
 const dependencies=()=>questionTeachingDependencies(state,project,question);
 const issue=(id,extra={})=>({id,status:'corrected',page:28,message:'Supply the exact method explanation.',resolution:{reason:'The exact explanation has been supplied.'},...extra});
 return {question,project,state,dependencies,issue};
}

test('exercise-specific theory handoffs do not invalidate another exercise sharing a source page',()=>{
 const f=fixture(),before=f.dependencies();
 f.state.issues.other=f.issue('other',{reviewJob:{stage:'theory',ownershipIds:['exercise:2E']}});
 assert.deepEqual(f.dependencies(),before);
 f.state.issues.other.resolution.reason='An unrelated handoff was clarified again.';
 assert.deepEqual(f.dependencies(),before);
 f.state.issues.own=f.issue('own',{reviewJob:{stage:'theory',ownershipIds:['exercise:2D']}});
 assert.deepEqual(f.dependencies().resolutions.map(r=>r.id),['own']);
 const own=f.dependencies();f.state.issues.own.resolution.reason='The assigned explanation changed.';
 assert.notDeepEqual(f.dependencies(),own);
});

test('whole-exercise teaching context uses exercise ownership while retaining source and explicit target changes',()=>{
 const f=fixture(),context=()=>exerciseTeachingContext(f.project,f.state,'2D'),before=context();
 f.state.issues.other=f.issue('other',{reviewJob:{stage:'theory',ownershipIds:['exercise:2E']}});
 assert.deepEqual(context(),before);
 f.state.issues.own=f.issue('own',{reviewJob:{stage:'theory',ownershipIds:['exercise:2D']}});
 f.state.issues.source=f.issue('source');
 f.state.issues.target=f.issue('target',{targetId:'q-d-root',reviewJob:{stage:'theory',ownershipIds:['exercise:2E']}});
 assert.deepEqual(context().decisions.map(d=>d.id),['own','source','target']);
 const previous=context();f.state.pages[28].sourceEvidence='changed-source-pixels';
 assert.notEqual(context().dependencyHash,previous.dependencyHash);
});

test('shared source changes, legacy findings and explicit shared targets still invalidate dependencies',()=>{
 const f=fixture(),before=f.dependencies();
 f.state.issues.source=f.issue('source');
 assert.notDeepEqual(f.dependencies(),before);
 f.state.issues.legacy=f.issue('legacy',{reviewJob:{stage:'theory'}});
 f.state.issues.target=f.issue('target',{targetId:'q-d-root',reviewJob:{stage:'theory',ownershipIds:['exercise:2E']}});
 assert.deepEqual(f.dependencies().resolutions.map(r=>r.id),['legacy','source','target']);
 const previous=f.dependencies();f.state.pages[28].inventoryHash='changed-source-inventory';
 assert.notDeepEqual(f.dependencies(),previous);
});
