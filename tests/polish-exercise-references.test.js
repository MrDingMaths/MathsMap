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
import {resolveExerciseReferences,renumberExerciseReferences,verifyReferenceNumberAdaptation,reuseReferenceNumberRating,unresolvedPrintedQuestionReferences} from '../polish/exercise-references.mjs';
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

test('terminal own-child introductions allow preceding givens without altering their source text',()=>{
 for(const prompt of ['Refer to the diagram to answer the following questions.','$M$ is 50 km north of $O$.\nAnswer the following questions to the nearest kilometre.']){
  const p=fixture(),q=p.sections[0].blocks[0];q.content.prompt=prompt;
  q.content.children=[{id:'own-a',type:'part',prompt:'Find the length.'},{id:'own-b',type:'part',prompt:'Find the angle.'}];
  const before=JSON.stringify(p);
  assert(!resolveExerciseReferences(p).holds.some(h=>h.id===q.id));
  assert.deepEqual(unresolvedPrintedQuestionReferences(q),[]);
  assert.equal(JSON.stringify(p),before);
 }
});

test('an own-child span never conceals another question reference or nonterminal introduction',()=>{
 for(const prompt of ['Use the next question to calculate this result.','Given the model, answer the following questions. Use the next question.']){
  const p=fixture(),q=p.sections[0].blocks[0];q.content.prompt=prompt;q.content.children=[{id:'own-a',type:'part',prompt:'Calculate.'}];
  assert(resolveExerciseReferences(p).holds.some(h=>h.id===q.id&&h.kind==='unresolved-relative-or-cross-scope-reference'));
 }
 const p=fixture(),q=p.sections[0].blocks[0];q.content.prompt='Given the model, answer the following questions for Question 11.';
 q.content.children=[{id:'own-a',type:'part',prompt:'Use Question 11.'}];
 const result=resolveExerciseReferences(p);
 assert.equal(result.records.filter(r=>r.ownerId===q.id&&r.targetId==='stable-q11').length,2);
 q.content.children[0].prompt='Use the next question.';
 assert(resolveExerciseReferences(p).holds.some(h=>h.id===q.id&&h.field.includes('children')));
 q.content.prompt='Answer the following questions.';q.content.children=[{id:'not-an-ask',type:'paragraph',inlines:[{type:'text',text:'Description.'}]}];
 assert(resolveExerciseReferences(p).holds.some(h=>h.id===q.id));
 q.content.children=[{id:'own-a',type:'part',prompt:'Calculate.'}];
 q.content.prompt={format:'maths-editor-document-v1',blocks:[{type:'paragraph',inlines:[{type:'text',text:'Answer the following questions.'}]},{type:'paragraph',inlines:[{type:'text',text:'A later separate instruction.'}]}]};
 assert(resolveExerciseReferences(p).holds.some(h=>h.id===q.id),'Only the last prompt field can introduce the native parts');
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

test('only exact nonprinting diagram-colour header is excluded from reference detection',()=>{
 const p=fixture();p.sections[0].blocks[11].content.prompt='Calculate.';p.sections[0].blocks[11].content.answer={short:'13',worked:'13'};
 const q=p.sections[0].blocks[0],header='% mathsmap-diagram-colours {"version":1,"reference":"Question 11"}\n';
 q.content.questionDiagrams=[{code:header+'\\draw (0,0)--(1,1);'}];const raw=q.content.questionDiagrams[0].code;
 assert.deepEqual(resolveExerciseReferences(p).holds,[]);assert.equal(q.content.questionDiagrams[0].code,raw);
 q.content.questionDiagrams[0].code+='\n\\node at (0,0) {Question 11};';assert.ok(resolveExerciseReferences(p).holds.some(h=>h.kind==='unsupported-native-code-reference'));
 q.content.questionDiagrams[0].code='% another metadata Question 11\n\\draw (0,0)--(1,1);';assert.ok(resolveExerciseReferences(p).holds.some(h=>h.kind==='unsupported-native-code-reference'));
});

test('algebraic and coordinate Q followed by closing math delimiter is not navigation',()=>{
 for(const text of ['$q\\ge18$ (equivalently $18\\le q$).','Find $Q$ of $BC$.','Since $P$, $Q$ and $R$ are collinear.']){
  const p=fixture();p.sections[0].blocks[11].content.prompt=text;p.sections[0].blocks[11].content.answer={short:text,worked:text};const before=JSON.stringify(p);
  assert.deepEqual(resolveExerciseReferences(p).holds,[]);assert.ok(!planScoreOrder(p).holds.some(h=>h.kind.includes('reference')));assert.equal(JSON.stringify(p),before);
 }
 for(const text of ['Use Question $11$.','Use Q\\(11\\).']){const p=fixture();p.sections[0].blocks[11].content.prompt=text;assert.ok(resolveExerciseReferences(p).holds.some(h=>h.kind==='unsupported-math-token-reference'));}
});

test('only exact generated nonprinting colour metadata whole lines are ignored',()=>{
 const p=fixture();p.sections[0].blocks[11].content.prompt='Calculate.';p.sections[0].blocks[11].content.answer={short:'13',worked:'13'};
 const metadata='\\special{dvisvgm:raw <metadata data-diagram-colours="1" data-diagram-kind="geometry" data-diagram-base="" data-diagram-semantic-palette="" data-diagram-semantic-reference="Question 11" data-diagram-semantic-reasons=""/>}';
 const q=p.sections[0].blocks[0];q.content.questionDiagrams=[{code:metadata+'\n\\draw (0,0)--(1,1);'}];const raw=q.content.questionDiagrams[0].code;
 assert.deepEqual(resolveExerciseReferences(p).holds,[]);assert.equal(q.content.questionDiagrams[0].code,raw);
 for(const code of [metadata+'\n\\node at (0,0) {Question 11};',metadata+'\\node at (0,0) {Question 11};','\\special{dvisvgm:raw <text>Question 11</text>}','\\special{dvisvgm:raw <metadata data-diagram-colours="1" other="Question 11"/>}']){q.content.questionDiagrams[0].code=code;assert.ok(resolveExerciseReferences(p).holds.some(h=>h.kind==='unsupported-native-code-reference'));assert.equal(q.content.questionDiagrams[0].code,code);}
});

test('known SVG source metadata with or without a palette never becomes a printable reference',()=>{
 for(const palette of [' data-graph-source-palette="056FDB,478FD6"','']){
  const p=fixture(),q=p.sections[0].blocks[0];
  const metadata='\\special{dvisvgm:raw <metadata data-graph-strokes="1"'+palette+' data-graph-source-reference="PDF page 4, Q1a"/>}';
  q.content.questionDiagrams=[{format:'tikz',code:metadata+'\n\\draw (0,0)--(1,1);'}];
  const before=JSON.stringify(p);
  assert.deepEqual(resolveExerciseReferences(p).holds,[]);
  assert.deepEqual(unresolvedPrintedQuestionReferences(q),[]);
  assert.equal(JSON.stringify(p),before);
 }
});

test('visible or unknown native-code references remain held beside known SVG source metadata',()=>{
 const p=fixture(),q=p.sections[0].blocks[0],metadata='\\special{dvisvgm:raw <metadata data-graph-strokes="1" data-graph-source-reference="PDF page 4, Q1a"/>}';
 for(const code of [metadata+'\n\\node {Question 11};',metadata+'\\node {Question 11};','\\special{dvisvgm:raw <text>Question 11</text>}','\\special{dvisvgm:raw <metadata data-graph-strokes="1" other="Question 11"/>}','\\special{dvisvgm:raw <metadata data-graph-strokes="1" data-graph-source-reference="Q1" extra="unknown"/>}']){
  q.content.questionDiagrams=[{format:'tikz',code}];
  assert(resolveExerciseReferences(p).holds.some(h=>h.id===q.id&&h.kind==='unsupported-native-code-reference'));
  assert.equal(q.content.questionDiagrams[0].code,code);
 }
});

const inlineColourLine='% mathsmap-diagram-colours '+JSON.stringify({version:1,kind:'graph',base:[],semantic:[],reference:'source page 5 p5-q1-solution'});
const inlineGraph=extra=>'[tikz]% mathsmap-inline-width-mm 44\n'+inlineColourLine+'\n\\special{dvisvgm:raw <metadata data-graph-strokes="1"/>}\n'+extra+'\n[/tikz]';
test('inline TikZ masks only known colour metadata during scan, preserving source bytes',()=>{
 const p=fixture();p.sections[0].blocks[11].content.prompt='Calculate.';p.sections[0].blocks[11].content.answer={short:{format:'maths-editor-document-v1',blocks:[{type:'paragraph',inlines:[{type:'text',text:inlineGraph('\\node{$x$};')}]}]}};
 const raw=JSON.stringify(p),r=resolveExerciseReferences(p);assert.deepEqual(r.holds,[]);assert.deepEqual(r.records,[]);assert.equal(JSON.stringify(p),raw);
});
test('visible inline TikZ reference adjacent to masked metadata remains held',()=>{
 const p=fixture();p.sections[0].blocks[11].content.answer.worked=inlineGraph('\\node{Question 11};');
 assert(resolveExerciseReferences(p).holds.some(h=>h.id==='stable-q12'&&h.kind==='unsupported-native-code-reference'));
});
test('unknown malformed and unclosed inline TikZ metadata remain held',()=>{
 for(const text of [inlineGraph('').replace('mathsmap-diagram-colours','unknown-colour'),inlineGraph('').replace('"version":1','"version":2'),inlineGraph('').replace('"kind":"graph"','"kind":"unknown"'),inlineGraph('').replace('"reference":','BROKEN:'),inlineGraph('').replace('[/tikz]',''),inlineGraph('').replace('[tikz]','[tikz][tikz]')]){const p=fixture();p.sections[0].blocks[11].content.answer.worked=text;assert(resolveExerciseReferences(p).holds.some(h=>h.id==='stable-q12'),text);}
});
test('inline metadata masking retains adjacent actual prose and unknown HTML references',()=>{
 const p=fixture();p.sections[0].blocks[11].content.answer.worked=inlineGraph('')+' Use Question 11.';const r=resolveExerciseReferences(p);assert(r.records.some(x=>x.ownerId==='stable-q12'||x.targetId==='stable-q11'));
 const q=fixture();q.sections[0].blocks[11].content.answer.worked=inlineGraph('')+'<span>Question 11</span>';assert(resolveExerciseReferences(q).holds.some(h=>h.id==='stable-q12'));
});

test('renumber after inline TikZ keeps exact span bytes and correct original offsets',()=>{
 const p=fixture(),span=inlineGraph('\\node{$x$};').replace('\\special{dvisvgm:raw <metadata data-graph-strokes="1"/>}\n','');p.sections[0].blocks[11].content.prompt='Calculate.';p.sections[0].blocks[11].content.answer={short:span+' Use Question 11.'};
 const r=resolveExerciseReferences(p);assert.deepEqual(r.holds,[]);const ordered=structuredClone(p),blocks=ordered.sections[0].blocks;ordered.sections[0].blocks=[blocks[12],...blocks.slice(0,12)];
 const {candidate,proof}=renumberExerciseReferences(p,ordered,r),answer=candidate.sections[0].blocks.find(b=>b.id==='stable-q12').content.answer.short;
 assert.equal(answer,span+' Use Question 12.');assert.equal(p.sections[0].blocks[11].content.answer.short,span+' Use Question 11.');assert.equal(proof.edits.length,1);
});

test('table below resolves only a later visible native table in the same prompt document',()=>{
 const para=(id,text)=>({id,type:'paragraph',inlines:[{type:'text',text}]}),table=id=>({id,type:'table',rows:[[{blocks:[para(id+'-cell','Given data')]}]]}),doc=(...blocks)=>({format:'maths-editor-document-v1',version:1,blocks});
 const make=()=>({id:'own',type:'question',pedagogyRole:'practice',content:{id:'root',type:'question',prompt:doc(para('intro','Use the table below.'),table('given'))}});
 const held=b=>unresolvedPrintedQuestionReferences(b).length>0;
 const root=make();assert.equal(held(root),false);
 const child=make();child.content={id:'root',type:'question',children:[{id:'part',type:'part',prompt:root.content.prompt}]};assert.equal(held(child),false);
 const arranged=make();arranged.presentation={layoutOverrides:{blockLayouts:{own:{arrangement:{root:{type:'group',direction:'stack',children:[{type:'item',ref:'root/prompt#intro'},{type:'item',ref:'root/prompt#given'}]}}}}}};assert.equal(held(arranged),false);
 for(const rootMode of ['none','whole-child'])for(const mode of ['hidden','reversed','row']){
  const b=structuredClone(child),children=[{type:'item',ref:'part/prompt#intro'},{type:'item',ref:'part/prompt#given'}];
  if(mode==='hidden')children.pop();if(mode==='reversed')children.reverse();
  b.presentation={layoutOverrides:{blockLayouts:{part:{arrangement:{root:{type:'group',direction:mode==='row'?'row':'stack',children}}}}}};
  if(rootMode==='whole-child')b.presentation.layoutOverrides.blockLayouts.own={arrangement:{root:{type:'group',direction:'stack',children:[{type:'item',ref:'part/prompt'}]}}};
  assert.equal(held(b),true,rootMode+' root must not hide '+mode+' child arrangement');
 }
 const validChild=structuredClone(child);validChild.presentation={layoutOverrides:{blockLayouts:{part:{arrangement:{root:{type:'group',direction:'stack',children:[{type:'item',ref:'part/prompt#intro'},{type:'item',ref:'part/prompt#given'}]}}}}}};assert.equal(held(validChild),false);
 const answer=make();answer.content.prompt=doc(para('intro','Use the table below.'));answer.content.answer={short:doc(table('answer-only'))};assert.equal(held(answer),true);
 const earlier=make();earlier.content.prompt.blocks.reverse();assert.equal(held(earlier),true);
 const sibling=structuredClone(child);sibling.content.children[0].prompt=doc(para('intro','Use the table below.'));sibling.content.children.push({id:'other',type:'part',prompt:doc(table('different-child'))});assert.equal(held(sibling),true);
 const different=make();different.content.prompt=doc(para('intro','Use the table below.'));different.prompt=doc(table('different-prompt'));assert.equal(held(different),true);
 const owner=make();owner.content.prompt=doc(para('intro','Use the table below.'));const project={id:'fixture',settings:{exerciseOrganisation:'topic'},sections:[{id:'s',topicId:'t',phase:'practice',blocks:[owner,{...make(),id:'other-owner'}]}]};assert(resolveExerciseReferences(project).holds.some(h=>h.id==='own'));
 const reversed=structuredClone(arranged);reversed.presentation.layoutOverrides.blockLayouts.own.arrangement.root.children.reverse();assert.equal(held(reversed),true);
 const omitted=structuredClone(arranged);omitted.presentation.layoutOverrides.blockLayouts.own.arrangement.root.children.pop();assert.equal(held(omitted),true);
 const beside=structuredClone(arranged);beside.presentation.layoutOverrides.blockLayouts.own.arrangement.root.direction='row';assert.equal(held(beside),true);
 const empty=make();empty.content.prompt.blocks[1].rows=[];assert.equal(held(empty),true);
 const cross=make();cross.content.prompt.blocks[0].inlines[0].text='Use the table below and the next question. Question 2 gives the result above.';assert.equal(held(cross),true);
 const numeric={id:'fixture',settings:{exerciseOrganisation:'topic'},sections:[{id:'s',topicId:'t',phase:'practice',blocks:[{...cross,sourceOrder:1},{...make(),id:'two',sourceOrder:2}]}]};const result=resolveExerciseReferences(numeric);assert(result.holds.some(h=>h.quote==='next question'));assert(result.holds.some(h=>h.quote==='result above'));assert(!result.holds.some(h=>h.quote==='table below'));assert.equal(result.records[0].oldNumber,2);const slice=result.records[0].slices[0];const original=slice.path.reduce((v,k)=>v[k],cross);assert.equal(original.slice(slice.start,slice.end),'2','numeric rewrite offsets remain on original text');
 for(const phrase of ['table as below','table above','diagram below','result below']){const b=make();b.content.prompt.blocks[0].inlines[0].text=phrase;assert.equal(held(b),true,phrase);}
});
