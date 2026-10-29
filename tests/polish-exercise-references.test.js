import{challengeSplitCandidate}from'../polish/challenge-split.mjs';
import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {flowNumbers} from '../src/lib/booklet-flow.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {assessedRating,verifiedRating} from '../scripts/booklet/reasoning-ratings.mjs';
import {difficultyBandForScore} from '../src/lib/practice-question-model.js';
import {resolveExerciseReferences,renumberExerciseReferences,verifyReferenceNumberAdaptation,reuseReferenceNumberRating} from '../polish/exercise-references.mjs';
import {planScoreOrder,scoreOrderCandidate} from '../polish/score-order.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'reference-fixture-'));
after(()=>fs.rmSync(dir,{recursive:true,force:true}));
const sha=x=>createHash('sha256').update(x).digest('hex');
function fixture(){
 const blocks=Array.from({length:13},(_,i)=>({id:'stable-q'+(i+1),type:'question',pedagogyRole:'practice',bankRef:null,content:{id:'native-q'+(i+1),type:'question',label:String(i+1),prompt:'Calculate $11+2$.',answer:{short:'$13$.',worked:'$11+2=13$.'}},sourceReview:{originalReference:'Question 11'}}));
 const q=blocks[11];q.content.prompt={format:'maths-editor-document-v1',blocks:[{id:'actual-table',type:'table',rows:[[{blocks:[{type:'paragraph',inlines:[{type:'text',text:'Use Question '},{type:'text',text:'11'},{type:'text',text:' to calculate $11+2$. Keep [11].'}]}]}]]}]};
 q.content.answer.short='Use Q11: $13$.';q.content.answer.worked='Using Question 11, the result is $13$. Numeric $11$ and [11] stay.';
 for(let i=0;i<blocks.length;i++){const score=i===10?20:i===11?40:i===12?10:60;blocks[i].classification=assessedRating(blocks[i],{reasoningScore:score,difficulty:difficultyBandForScore(score),difficultyReason:'SYNTHETIC FIXTURE ONLY: no actual mathematical assessment.'},{model:'fixture-only',assessedAt:'2026-01-01T00:00:00Z',evidence:'fixture-independent-review.json'});}
 return{id:'synthetic-reference-fixture',revision:1,settings:{exerciseOrganisation:'topic',questionOrder:'source'},sections:[{id:'exercise',phase:'practice',role:'mixed-practice',topicId:'topic',blocks}]};
}
test('Q11/Q12 reference group moves together; question, native table and both answer editions renumber',()=>{
 const p=fixture(),resolution=resolveExerciseReferences(p);assert.deepEqual(resolution.holds,[]);assert.deepEqual(resolution.groups.map(g=>g.ids),[['stable-q11','stable-q12']]);
 const plan=planScoreOrder(p,{referenceResolution:resolution});assert.deepEqual(plan.holds,[]);
 const {candidate,referenceProof}=scoreOrderCandidate(p,plan,{includeReferenceProof:true});
 assert.deepEqual(candidate.sections[0].blocks.slice(0,3).map(b=>b.id),['stable-q13','stable-q11','stable-q12']);
 assert.equal(flowNumbers(candidate)['stable-q11'],2);assert.equal(flowNumbers(candidate)['stable-q12'],3);
 assert.equal(candidate.sections[0].blocks[1].flow.keepWithNext,true);assert.deepEqual(candidate.sections[0].blocks[2].flow.dependsOn,['stable-q11']);assert.equal(referenceProof.metadataEdits.length,2);
 const q=candidate.sections[0].blocks[2],text=q.content.prompt.blocks[0].rows[0][0].blocks[0].inlines.map(n=>n.text).join('');
 assert.match(text,/Question 2/);assert.match(text,/\$11\+2\$/);assert.match(text,/\[11\]/);
 assert.match(q.content.answer.short,/Q2:/);assert.match(q.content.answer.worked,/Question 2/);assert.match(q.content.answer.worked,/Numeric \$11\$ and \[11\]/);
 assert.equal(q.sourceReview.originalReference,'Question 11');assert.equal(q.content.label,'12');
 assert.equal(verifiedRating(q),false,'Changed native task must not silently retain a valid old assessment');
 assert(verifyReferenceNumberAdaptation(p,(()=>{const c=structuredClone(p);const by=new Map(c.sections[0].blocks.map(b=>[b.id,b]));c.sections[0].blocks=plan.sections[0].plannedIds.map(id=>by.get(id));return c;})(),candidate,referenceProof));
});
test('dangling and duplicate printed-number targets hold; foreign exercise reference never guessed',()=>{
 const p=fixture();p.sections[0].blocks[11].content.answer.short='Use Question 99.';assert(resolveExerciseReferences(p).holds.some(h=>h.kind==='dangling-numbered-reference'));
 const q=fixture();q.settings.exerciseOrganisation='legacy';q.sections[0].blocks[10].flow={numberResetBefore:11};q.sections[0].blocks[11].flow={numberResetBefore:11};assert(resolveExerciseReferences(q).holds.some(h=>h.kind==='ambiguous-numbered-reference'));
 const r=fixture();r.sections.push({id:'other',phase:'practice',topicId:'topic',blocks:[{...structuredClone(r.sections[0].blocks[12]),id:'foreign-question',content:{id:'foreign-native',type:'question',prompt:'Use Question 11.'}}]});assert(resolveExerciseReferences(r).holds.some(h=>h.kind==='reference-outside-sort-section'));
});
test('binding target tampering and remapped order/proof tampering are rejected',()=>{
 const p=fixture(),r=resolveExerciseReferences(p),bad=structuredClone(r);bad.records[0].targetId='stable-q10';assert.throws(()=>planScoreOrder(p,{referenceResolution:bad}));
 const plan=planScoreOrder(p,{referenceResolution:r}),tamper=structuredClone(plan);tamper.sections[0].plannedIds.reverse();assert.throws(()=>scoreOrderCandidate(p,tamper));
 const {candidate,referenceProof}=scoreOrderCandidate(p,plan,{includeReferenceProof:true}),badCandidate=structuredClone(candidate);badCandidate.sections[0].blocks[2].content.answer.short='Use Q1: $13$.';
 const ordered=structuredClone(p),by=new Map(ordered.sections[0].blocks.map(b=>[b.id,b]));ordered.sections[0].blocks=plan.sections[0].plannedIds.map(id=>by.get(id));assert.throws(()=>verifyReferenceNumberAdaptation(p,ordered,badCandidate,referenceProof));
 const separated=structuredClone(ordered);[separated.sections[0].blocks[2],separated.sections[0].blocks[3]]=[separated.sections[0].blocks[3],separated.sections[0].blocks[2]];assert.throws(()=>renumberExerciseReferences(p,separated,r),/group separated/);
});
test('typed rating reuse requires independent acceptance; preserves old numeric/model/date/history and bank link',()=>{
 const p=fixture();p.sections[0].blocks[11].bankRef={id:'fixture-linked-bank',revision:'fixed'};
 // Bank linkage is unchanged by local authoring; actual SDK publication gate remains caller-owned.
 const r=resolveExerciseReferences(p),plan=planScoreOrder(p,{referenceResolution:r}),{candidate,referenceProof}=scoreOrderCandidate(p,plan,{includeReferenceProof:true}),ordered=structuredClone(p),by=new Map(ordered.sections[0].blocks.map(b=>[b.id,b]));ordered.sections[0].blocks=plan.sections[0].plannedIds.map(id=>by.get(id));
 const original=p.sections[0].blocks[11],changed=candidate.sections[0].blocks.find(b=>b.id===original.id),file=path.join(dir,'typed-proof.json');fs.writeFileSync(file,JSON.stringify(referenceProof));const options={before:p,ordered,evidenceFile:file,evidenceSha256:sha(fs.readFileSync(file)),confirmIndependentRating:()=>false};assert.throws(()=>reuseReferenceNumberRating(original,changed,referenceProof,options));
 const rating=reuseReferenceNumberRating(original,changed,referenceProof,{...options,confirmIndependentRating:()=>true});assert.equal(rating.reasoningScore,40);assert.equal(rating.assessment.model,original.classification.assessment.model);assert.equal(rating.assessment.assessedAt,original.classification.assessment.assessedAt);assert.equal(rating.assessment.originalTaskHash,original.classification.assessment.taskHash);assert.equal(rating.assessment.referenceNumberAdaptations[0].newAssessmentPerformed,false);sameBank();function sameBank(){assert.deepEqual(changed.bankRef,original.bankRef);}
 assert(verifiedRating(changed,rating));
});
test('relative, opaque native-code and plural unsupported references hold instead of guessing',()=>{
 for(const text of['Use the previous question.','Use Questions 11 and 12.','Apply Example 2.']){const p=fixture();p.sections[0].blocks[11].content.answer.worked=text;assert(resolveExerciseReferences(p).holds.length>0);}
 const p=fixture();p.sections[0].blocks[11].content.questionDiagrams=[{id:'given',format:'tikz',code:'\\node{Question 11};'}];assert(resolveExerciseReferences(p).holds.some(h=>h.kind==='unsupported-native-code-reference'));
 const q=fixture();q.sections[0].blocks[11].content.answer.worked='The mathematical symbol $Q11$ is not a prose reference.';assert(resolveExerciseReferences(q).holds.some(h=>h.kind==='unsupported-math-reference'));
});
test('own-child introduction never hides a childless or same-field external reference',()=>{
 const p=fixture();p.sections[0].blocks[0].content.prompt='Answer the following questions.';assert(resolveExerciseReferences(p).holds.some(h=>h.id==='stable-q1'));
 const q=fixture();q.sections[0].blocks[0].content.prompt='Answer the following questions.';q.sections[0].blocks[0].content.children=[{id:'own-a',type:'part',prompt:'Calculate 2+2.'}];assert(!resolveExerciseReferences(q).holds.some(h=>h.id==='stable-q1'));
 q.sections[0].blocks[0].content.prompt+=' Use Example 99.';assert(resolveExerciseReferences(q).holds.some(h=>h.id==='stable-q1'));
});
test('ranges, lists, decimal and page-qualified references hold without partially rewriting',()=>{
 for(const text of['Question 11–13','Question 11 and 12','Question11and12','Question 11, 12','Question 11, and 12','Q11.5','Question 11 on page 12']){
  const p=fixture();p.sections[0].blocks[11].content.answer.short=text;
  const r=resolveExerciseReferences(p);assert(r.holds.some(h=>h.kind==='ambiguous-range-list-decimal-or-page-reference'),text);assert.equal(p.sections[0].blocks[11].content.answer.short,text);
 }
});
test('HTML attributes and IDs are never treated as editable reference prose',()=>{
 const p=fixture();p.sections[0].blocks[11].content.prompt={html:'<p id="Q11"><a href="#Q11">Question 11</a></p>'};
 const r=resolveExerciseReferences(p);assert(r.holds.some(h=>h.kind==='unsupported-html-reference'));assert.equal(r.records.filter(x=>x.field.includes('html')).length,0);
});
test('native reference digits split across text and math hold rather than altering math',()=>{
 const p=fixture();p.sections[0].blocks[11].content.prompt={format:'maths-editor-document-v1',blocks:[{type:'paragraph',inlines:[{type:'text',text:'Use Question 1'},{type:'math',latex:'1'}]}]};
 const r=resolveExerciseReferences(p);assert(r.holds.some(h=>h.kind==='mixed-native-inline-math-reference'));assert.equal(p.sections[0].blocks[11].content.prompt.blocks[0].inlines[1].latex,'1');
});
test('default direct planner holds shorthand Qn in top-level answer fields without a pinned resolution',()=>{
 const p=fixture(),q=p.sections[0].blocks[11];q.content.prompt='Calculate $11+2$.';q.content.answer={short:'$13$',worked:'$11+2=13$'};q.answer={short:'Use Q11.',worked:'Use Question 11.'};
 q.classification=assessedRating(q,{reasoningScore:40,difficulty:difficultyBandForScore(40),difficultyReason:'SYNTHETIC FIXTURE ONLY.'},{model:'fixture-only',assessedAt:'2026-01-01T00:00:00Z',evidence:'fixture-independent-review.json'});
 const held=planScoreOrder(p);assert(held.holds.some(h=>h.id==='stable-q12'&&h.kind==='printed-reference'));assert.deepEqual(scoreOrderCandidate(p,held),p);
 const resolved=planScoreOrder(p,{referenceResolution:resolveExerciseReferences(p)});assert.deepEqual(resolved.holds,[]);const result=scoreOrderCandidate(p,resolved);assert.equal(result.sections[0].blocks[2].answer.short,'Use Q2.');assert.equal(result.sections[0].blocks[2].answer.worked,'Use Question 2.');
});

test('Challenge candidate cannot bypass unresolved question or answer references',()=>{const p=fixture();assert.throws(()=>challengeSplitCandidate(p,{approvedCalibration:true,archetypes:{}}),/Resolve whole-exercise printed reference groups/);});

test('numbered bindings hold when before source counter identity is unverified',()=>{for(const order of[undefined,'difficulty']){const p=fixture();if(order===undefined)delete p.settings.questionOrder;else p.settings.questionOrder=order;const r=resolveExerciseReferences(p);assert(r.holds.some(h=>h.kind==='before-source-counter-identity-unverified'));const plan=planScoreOrder(p,{referenceResolution:r});assert(plan.holds.some(h=>h.kind==='before-source-counter-identity-unverified'));assert.throws(()=>scoreOrderCandidate(p,plan),/Reference holds/);assert.equal(p.settings.questionOrder,order);}});

test('plain math-delimited numbered reference tokens hold in both default and resolved APIs',()=>{
 for(const text of['Use Question $11$.','Use Q\\(11\\).']){
  const p=fixture();p.sections[0].blocks[11].content.answer.short=text;
  const r=resolveExerciseReferences(p);assert(r.holds.some(h=>h.kind==='unsupported-math-token-reference'),text);
  assert(planScoreOrder(p).holds.some(h=>h.id==='stable-q12'&&h.kind==='printed-reference'),text);
  assert.equal(p.sections[0].blocks[11].content.answer.short,text);
 }
});
test('persisted reference group moves to a fresh page whole under actual production pagination',async()=>{
 const p=fixture(),plan=planScoreOrder(p,{referenceResolution:resolveExerciseReferences(p)}),{candidate}=scoreOrderCandidate(p,plan,{includeReferenceProof:true});
 const prepare=x=>normalizeEditableProject({...x,title:'Synthetic pagination reference fixture',topics:[{id:'topic',title:'Exercise'}]});
 const measure=page=>({height:page.blocks.reduce((n,b)=>n+(b.id==='stable-q13'?60:['stable-q11','stable-q12'].includes(b.id)?30:5),0),capacity:100});
 const without=structuredClone(candidate);delete without.sections[0].blocks[1].flow.keepWithNext;
 const split=await paginateFlow(prepare(without),'student',measure),whole=await paginateFlow(prepare(candidate),'student',measure),pageOf=(result,id)=>result.pages.find(p=>p.blocks.some(b=>b.id===id)).pageNumber;
 assert.notEqual(pageOf(split,'stable-q11'),pageOf(split,'stable-q12'),'dependsOn alone does not bind the production page packer');
 assert.equal(pageOf(whole,'stable-q11'),pageOf(whole,'stable-q12'));assert.notEqual(pageOf(whole,'stable-q13'),pageOf(whole,'stable-q11'));
 assert.equal(flowNumbers(candidate)['stable-q11'],2);assert.equal(flowNumbers(candidate)['stable-q12'],3);
});
test('explicit false keep pin or internal page break holds instead of being overridden',()=>{
 for(const field of['keepWithNext','pageBreakBefore']){const p=fixture();const b=p.sections[0].blocks[field==='keepWithNext'?10:11];b.flow={[field]:field==='keepWithNext'?false:true};assert(resolveExerciseReferences(p).holds.some(h=>h.kind==='reference-group-explicit-layout-conflict'));}
 const p=fixture();p.sections[0].blocks[11].flow={dependsOn:['stable-q11']};const plan=planScoreOrder(p,{referenceResolution:resolveExerciseReferences(p)}),{candidate,referenceProof}=scoreOrderCandidate(p,plan,{includeReferenceProof:true});assert.deepEqual(candidate.sections[0].blocks[2].flow.dependsOn,['stable-q11']);assert(!referenceProof.metadataEdits.some(e=>e.path[1]==='dependsOn'));
});

test('unbound cross-section reference holds every target section, not only its owner',()=>{
 const p=fixture();p.sections[0].blocks=p.sections[0].blocks.slice(0,3);p.sections[0].blocks[0].content.prompt='Use Q2.';
 p.sections.push({...p.sections[0],id:'target-section',blocks:p.sections[0].blocks.splice(1)});
 const target=p.sections[1].blocks;target[0].classification=assessedRating(target[0],{reasoningScore:50,difficulty:difficultyBandForScore(50),difficultyReason:'SYNTHETIC FIXTURE ONLY: independent rating test.'},{model:'fixture',assessedAt:'2026-01-01T00:00:00Z',evidence:'fixture-independent.json'});target[1].classification=assessedRating(target[1],{reasoningScore:10,difficulty:difficultyBandForScore(10),difficultyReason:'SYNTHETIC FIXTURE ONLY: independent rating test.'},{model:'fixture',assessedAt:'2026-01-01T00:00:00Z',evidence:'fixture-independent.json'});
 const plan=planScoreOrder(p);assert.deepEqual(plan.changedSections,[]);assert.deepEqual(scoreOrderCandidate(p,plan),p);assert.ok(plan.holds.some(h=>h.kind==='project-unresolved-printed-reference'));
});
test('fixed teacher and visible atom references hold all ordering; provenance and invisible description do not',()=>{
 for(const teacher of [{id:'teacher',type:'rich-text',content:'Use Q2.'},{id:'teacher',type:'rich-text',content:'Teaching.',sourceAtom:{kind:'example',visibleSubtitle:'Use Question 2'}},{id:'teacher',type:'rich-text',content:'Teaching.',sourceAtom:{kind:'example',description:'Use Q2.'}}]){
  const p=fixture();p.sections[0].blocks[11].content.prompt='Calculate.';p.sections[0].blocks[11].content.answer={short:'13',worked:'13'};p.sections[0].blocks.unshift(teacher);
  assert.deepEqual(scoreOrderCandidate(p,planScoreOrder(p)),p);
  const resolution=resolveExerciseReferences(p);assert.ok(resolution.holds.some(h=>h.kind==='unsupported-nonpractice-printed-reference'));assert.deepEqual(planScoreOrder(p,{referenceResolution:resolution}).changedSections,[]);assert.throws(()=>scoreOrderCandidate(p,planScoreOrder(p,{referenceResolution:resolution})),/Reference holds/);
 }
 const p=fixture();p.sections[0].blocks[11].content.prompt='Calculate.';p.sections[0].blocks[11].content.answer={short:'13',worked:'13'};p.sections[0].blocks.unshift({id:'teacher',type:'rich-text',content:'Teaching.',sourceAtom:{kind:'review',description:'Question 11'},sourceReview:{sourceQuestion:'Question 11'}});assert.deepEqual(resolveExerciseReferences(p).holds,[]);assert.ok(!planScoreOrder(p).holds.some(h=>h.kind.includes("reference")));
});
