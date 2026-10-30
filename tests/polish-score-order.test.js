import test from 'node:test';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {reuseContentHash} from '../scripts/booklet/reuse-content.mjs';
import assert from 'node:assert/strict';
import {assessedRating,reasoningTaskHash,reuseReasoningRating} from '../scripts/booklet/reasoning-ratings.mjs';
import {assertIndependentBackfillReview,draftHash} from '../pedagogy/routine-backfill-proof.mjs';
import {difficultyBandForScore} from '../src/lib/practice-question-model.js';
import {planScoreOrder,scoreOrderCandidate,reviewedMethodSupport,exerciseRole,acceptedSourceRatingReuses,scoreOrderMain} from '../polish/score-order.mjs';
import {resolveExerciseReferences,renumberExerciseReferences} from '../polish/exercise-references.mjs';
const q=(id,score,extra={})=>{const b={id,type:'question',content:{id:id+'-root',type:'question',prompt:'Calculate $3+5$.',answer:{short:'8',worked:'$3+5=8$'},answerSpaceMm:24},...extra};b.classification={...assessedRating(b,{reasoningScore:score,difficulty:difficultyBandForScore(score),difficultyReason:'Apply the supplied operation.'},{model:'gpt-6.1-sol',assessedAt:'2026-10-29T00:00:00Z',evidence:'independent-review.json'})};return b;};
const project=blocks=>({id:'p',revision:1,settings:{layoutOverrides:{answerSpaces:{}}},studio:{flags:[{id:'teacher',resolved:false}]},sections:[{id:'exercise',phase:'practice',role:'mixed-practice',blocks}]});
const ids=p=>p.sections[0].blocks.map(b=>b.id);
test('stable whole-question sort preserves all source objects, internal parts, ratings and space',()=>{const a=q('a',40),b=q('b',10),c=q('c',10);a.content.children=[{id:'a-part',type:'part',label:'a',prompt:'Keep this entire part.'}];a.classification={...assessedRating(a,{reasoningScore:40,difficulty:'Development',difficultyReason:'One complete multipart demand.'},{model:'gpt-6.1-sol',assessedAt:'2026-10-29T00:00:00Z',evidence:'review.json'})};const p=project([a,b,c]),before=structuredClone(p),plan=planScoreOrder(p),n=scoreOrderCandidate(p,plan);assert.deepEqual(ids(n),['b','c','a']);assert.deepEqual(p,before);assert.deepEqual(n.sections[0].blocks[2],a);assert.deepEqual(n.studio,p.studio);assert.deepEqual(n.settings,p.settings);});
test('semantic continuation uses maximum existing score and preserves member order',()=>{const p=project([q('a',10),q('b',60,{flow:{continuationOf:'a'}}),q('c',30)]),plan=planScoreOrder(p);assert.deepEqual(plan.sections[0].plannedIds,['c','a','b']);assert.equal(plan.sections[0].segments[0].units[0].difficultyKey,60);assert.deepEqual(plan.sections[0].segments[0].units[0].ids,['a','b']);assert.equal(p.sections[0].blocks[0].classification.reasoningScore,10);});
test('noncontiguous semantic groups hold instead of gathering around unrelated practice',()=>{const p=project([q('a',10),q('c',30),q('b',60,{flow:{dependsOn:['a']}})]),plan=planScoreOrder(p);assert.ok(plan.holds.some(h=>h.kind==='noncontiguous-semantic-unit'));assert.deepEqual(ids(scoreOrderCandidate(p,plan)),['a','c','b']);});
test('a changed task invalidates its old score and holds that segment',()=>{const b=q('b',10);b.content.prompt='Calculate $4+9$.';const p=project([q('a',40),b]),plan=planScoreOrder(p);assert.ok(plan.holds.some(h=>h.kind==='rating-unverified'));assert.deepEqual(ids(scoreOrderCandidate(p,plan)),['a','b']);});
test('teaching and source atoms are fixed barriers; independent sides still sort',()=>{const teaching={id:'example',type:'worked-example',content:'Method.'},atom=q('atom',5,{sourceAtom:{kind:'practice'}}),p=project([q('a',40),q('b',10),teaching,q('c',50),q('d',20),atom]);const n=scoreOrderCandidate(p,planScoreOrder(p));assert.deepEqual(ids(n),['b','a','example','d','c','atom']);});
test('layout-only keepWithNext is not a semantic score-max unit',()=>{const p=project([q('a',60,{flow:{keepWithNext:true}}),q('b',10),q('c',30)]),plan=planScoreOrder(p);assert.ok(plan.holds.some(h=>h.kind==='layout-pin-needs-pagination-evidence'));assert.equal(plan.sections[0].segments[0].units.length,3);assert.deepEqual(ids(scoreOrderCandidate(p,plan)),['a','b','c']);});
test('cross-question printed references are held, internal part references are not',()=>{const b=q('b',10);b.content.answer.worked='Use Question 2 to calculate the result.';const p=project([q('a',40),b]);assert.ok(planScoreOrder(p).holds.some(h=>h.kind==='printed-reference'));const c=q('c',10);c.content.prompt='Use part a of this question.';c.classification={...assessedRating(c,{reasoningScore:10,difficulty:'Foundation',difficultyReason:'Use an internal step.'},{model:'gpt-6.1-sol',assessedAt:'2026-10-29T00:00:00Z',evidence:'review.json'})};assert.deepEqual(planScoreOrder(project([q('a',40),c])).sections[0].plannedIds,['c','a']);});
test('own-child introductory following questions is not a cross-question reference',()=>{const b=q('b',10);b.content.prompt='Answer the following questions for the equation $I=0.43+1.1s$.';b.content.children=[{id:'b-a',type:'part',prompt:'Interpret the gradient.'}];b.classification=assessedRating(b,{reasoningScore:10,difficulty:'Foundation',difficultyReason:'Interpret the supplied model.'},{model:'gpt-6.1-sol',assessedAt:'2026-10-29T00:00:00Z',evidence:'review.json'});const p=project([q('a',40),b]);assert.deepEqual(planScoreOrder(p).sections[0].plannedIds,['b','a']);});
test('own-child introduction cannot hide childless or external references anywhere',()=>{for(const suffix of ['', ' Use Question 2.', ' Use the previous question.', ' Refer to the next example.']){const b=q('b',10);b.content.prompt='Answer the following questions for the supplied model.'+suffix;if(suffix)b.content.children=[{id:'b-a',type:'part',prompt:'Interpret the gradient.'}];b.classification=assessedRating(b,{reasoningScore:10,difficulty:'Foundation',difficultyReason:'Use the supplied model.'},{model:'gpt-6.1-sol',assessedAt:'2026-10-29T00:00:00Z',evidence:'review.json'});assert.ok(planScoreOrder(project([q('a',40),b])).holds.some(h=>h.kind==='printed-reference'));}const b=q('b',10);b.content.prompt='Answer the following questions for the model.';b.content.children=[{id:'b-a',type:'part',prompt:'Use the previous question.'}];b.classification=assessedRating(b,{reasoningScore:10,difficulty:'Foundation',difficultyReason:'Use a supplied result.'},{model:'gpt-6.1-sol',assessedAt:'2026-10-29T00:00:00Z',evidence:'review.json'});assert.ok(planScoreOrder(project([b])).holds.some(h=>h.kind==='printed-reference'));});
test('real method-support edge holds a score sort that would reverse supplied support',()=>{const p=project([q('support',40),q('use',20)]),plan=planScoreOrder(p,{supportEdges:[{before:'support',after:'use',kind:'reviewed-method-support'}]});assert.ok(plan.holds.some(h=>h.kind==='method-support-order'));assert.deepEqual(ids(scoreOrderCandidate(p,plan)),['support','use']);});
test('additionTo records lineage, not an instructional dependency',()=>{const p=project([q('a',40),q('b',10,{sourceReview:{additionTo:{projectId:'p',blockId:'a'}}})]);assert.deepEqual(planScoreOrder(p).sections[0].plannedIds,['b','a']);});
test('node-level dependencies resolve to the whole source question; unresolved links hold',()=>{const a=q('a',20),b=q('b',40,{flow:{dependsOn:['a-root']}}),p=project([a,b,q('c',10)]);assert.deepEqual(planScoreOrder(p).sections[0].plannedIds,['c','a','b']);b.flow.dependsOn=['absent'];assert.ok(planScoreOrder(p).holds.some(h=>h.kind==='unresolved-dependency'));});
test('reviewed support is reused only against matching question and method contents',()=>{const intro={id:'intro',type:'callout',content:'Supplied method.'},a=q('a',40),b=q('b',10);a.classification.archetypeReview={mapFile:'map'};const p=project([intro,a,b]),snapshot=structuredClone(p),map={projectId:'p',snapshot:'snapshot',questions:{a:{topicId:'t',archetype:'x',practiceItems:[{archetype:'sub'}]}},topics:[{topicId:'t',clusters:[{id:'x',teachingIds:[]},{id:'sub',practiceEvidenceIds:['intro']}]}]},readJson=f=>f==='map'?map:snapshot,practiceSupportDecision=()=>({relation:'prerequisite',reason:'The earlier supplied relation is required by this recipient.'});assert.deepEqual(reviewedMethodSupport(p,{readJson,practiceSupportDecision}).edges.map(e=>[e.before,e.after]),[['intro','a']]);p.sections[0].blocks[0].content='Changed method.';assert.equal(reviewedMethodSupport(p,{readJson,practiceSupportDecision}).holds[0].kind,'review-context-unverified');});

function referenceMethodFixture(){
 const a=q('a',20),b=q('b',25),c=q('c',30);b.content.prompt='Use Question 1 to calculate the result.';b.content.answer={short:'8, agreeing with Question 1.',worked:'Use Question 1: $3+5=8$.'};
 for(const block of [b,c])block.classification.archetypeReview={mapFile:'map'};
 const snapshot=project([a,b,c]);snapshot.settings.exerciseOrganisation='topic';snapshot.settings.questionOrder='source';snapshot.sections[0].topicId='t';const map={projectId:'p',snapshot:'snapshot',questions:{b:{topicId:'t',archetype:'x'},c:{topicId:'t',archetype:'y'}},topics:[{topicId:'t',clusters:[{id:'x',teachingIds:['a']},{id:'y',practiceEvidenceIds:['b']}]}]},readJson=f=>f==='map'?map:snapshot;
 const before=structuredClone(snapshot);before.sections[0].blocks.push(q('new',10));const ordered=structuredClone(before),by=new Map(ordered.sections[0].blocks.map(b=>[b.id,b]));ordered.sections[0].blocks=['new','a','b','c'].map(id=>by.get(id));
 const {candidate,proof}=renumberExerciseReferences(before,ordered,resolveExerciseReferences(before));
 return{snapshot,readJson,adaptation:{before,ordered,candidate,proof},current:structuredClone(candidate)};
}

function practiceSupportFixture(){
 const a=q('a',40),b=q('b',20);a.content.children=[{id:'a-part',type:'part',label:'a',prompt:'Show the supplied identity.'}];b.content.children=[{id:'b-part',type:'part',label:'a',prompt:'Show a different supplied identity.'}];
 for(const block of[a,b]){block.classification.archetypeReview={mapFile:'map'};block.classification.assessment.taskHash=reasoningTaskHash(block);}
 const p=project([a,b]),snapshot=structuredClone(p),map={projectId:'p',snapshot:'snapshot',questions:{a:{topicId:'t',archetype:'x'},b:{topicId:'t',archetype:'x'}},topics:[{topicId:'t',clusters:[{id:'x',practiceEvidenceIds:['a-part','b-part']}]}]},readJson=file=>file==='map'?map:snapshot;
 return{p,snapshot,map,readJson};
}

test('practice coverage does not automatically force reciprocal self-scaffold prerequisites',()=>{
 const f=practiceSupportFixture(),before=structuredClone({p:f.p,map:f.map,snapshot:f.snapshot}),calls=[];
 const support=reviewedMethodSupport(f.p,{readJson:f.readJson,practiceSupportDecision:request=>{calls.push(structuredClone(request));request.after='unrelated';return{relation:'coverage-only',reason:'Each identity scaffolds its own complete Hence sketch; neither uses the other question.'};}});
 assert.deepEqual(support.edges,[]);assert.deepEqual(support.holds,[]);assert.equal(calls.length,2);assert.deepEqual(support.practiceSupportCandidates.map(c=>[c.before,c.after,c.relation]),[['b','a','coverage-only'],['a','b','coverage-only']]);
 assert.deepEqual(planScoreOrder(f.p,{contextHolds:support.holds,supportEdges:support.edges}).sections[0].plannedIds,['b','a']);assert.deepEqual({p:f.p,map:f.map,snapshot:f.snapshot},before);
});

test('unresolved practice coverage holds and a boolean or unexplained decision cannot bypass it',()=>{
 for(const decision of[undefined,()=>true,()=>false,()=>({relation:'coverage-only'}),()=>({relation:'prerequisite',reason:' '}),()=>({relation:'ignore',reason:'Skip'})]){
  const f=practiceSupportFixture(),support=reviewedMethodSupport(f.p,{readJson:f.readJson,practiceSupportDecision:decision});assert.deepEqual(support.edges,[]);assert.equal(support.holds.length,2);assert(support.holds.every(h=>h.kind==='practice-support-unresolved'));assert(support.practiceSupportCandidates.every(c=>c.relation==='unresolved'));assert.equal(planScoreOrder(f.p,{contextHolds:support.holds}).sections[0].status,'held');
 }
});

test('recipient-specific reviewed practice prerequisite still blocks reversal of real supplied support',()=>{
 const f=practiceSupportFixture(),support=reviewedMethodSupport(f.p,{readJson:f.readJson,practiceSupportDecision:({before,after})=>before==='a'&&after==='b'?{relation:'prerequisite',reason:'Question a supplies negation-and-addition; this later subtraction task requires that method.'}:{relation:'coverage-only',reason:'The later question supplies no method needed by the earlier task.'}});
 assert.equal(support.holds.length,0);assert.deepEqual(support.edges.map(e=>[e.before,e.after]),[['a','b']]);const plan=planScoreOrder(f.p,{supportEdges:support.edges,contextHolds:support.holds});assert(plan.holds.some(h=>h.kind==='method-support-order'));assert.deepEqual(plan.sections[0].plannedIds,['a','b']);
});

test('practice decisions cannot bypass stale or missing own or cross-question anchors',()=>{
 for(const change of[f=>{f.p.sections[0].blocks[1].content.children[0].prompt='Changed supplied relation.';},f=>{f.p.sections[0].blocks[1].content.children=[];},f=>{f.map.topics[0].clusters[0].practiceEvidenceIds.push('missing');}]){
  const f=practiceSupportFixture();change(f);let calls=0;const support=reviewedMethodSupport(f.p,{readJson:f.readJson,practiceSupportDecision:()=>{calls++;return{relation:'coverage-only',reason:'This decision must not hide missing reviewed source.'};}});assert(support.holds.every(h=>h.kind==='review-context-unverified'));assert.equal(support.holds.length,2);assert.equal(calls,0);assert.deepEqual(support.edges,[]);
 }
});
test('reviewed question and method anchor retain context through explicit reference-only replay',()=>{
 const {snapshot,readJson,adaptation,current}=referenceMethodFixture(),unchanged=structuredClone({snapshot,adaptation,current});
 assert.equal(reviewedMethodSupport(current,{readJson}).holds.length,2);
 const result=reviewedMethodSupport(current,{readJson,referenceAdaptations:[adaptation],practiceSupportDecision:()=>({relation:'prerequisite',reason:'The recipient uses the preceding question supplied method.'})});assert.deepEqual(result.holds,[]);assert.deepEqual(result.edges.map(e=>[e.before,e.after]),[['a','b'],['b','c']]);assert.equal(adaptation.proof.edits.length,3);
 assert.deepEqual({snapshot,adaptation,current},unchanged);
});
test('reference context replay rejects missing proof and serialized acceptance assertions',()=>{
 for(const change of [a=>delete a.proof,a=>{a.proof={verified:true};},a=>delete a.before,a=>{a.candidate.id='other';},a=>{a.proof.edits[0].targetId='new';}]){
  const {readJson,adaptation,current}=referenceMethodFixture();change(adaptation);assert.equal(reviewedMethodSupport(current,{readJson,referenceAdaptations:[adaptation]}).holds.length,2);
 }
});
test('reference context replay cannot hide changed mathematics answers or nonreference text',()=>{
 for(const change of [b=>{b.content.prompt+=' Also calculate $4+9$.';},b=>{b.content.answer.short='13, agreeing with Question 2.';},b=>{b.content.answer.worked='Use Question 2: $4+9=13$.';}]){
  const {readJson,adaptation,current}=referenceMethodFixture();change(current.sections[0].blocks.find(b=>b.id==='b'));assert.equal(reviewedMethodSupport(current,{readJson,referenceAdaptations:[adaptation]}).holds.length,2);
 }
});
test('reference context replay requires actual current bindings and original reviewed content',()=>{
 const f=referenceMethodFixture(),by=new Map(f.current.sections[0].blocks.map(b=>[b.id,b]));f.current.sections[0].blocks=['a','new','b','c'].map(id=>by.get(id));assert.equal(reviewedMethodSupport(f.current,{readJson:f.readJson,referenceAdaptations:[f.adaptation]}).holds.length,2);
 const g=referenceMethodFixture();g.snapshot.sections[0].blocks.find(b=>b.id==='b').content.answer.short='A different reviewed answer.';assert.equal(reviewedMethodSupport(g.current,{readJson:g.readJson,referenceAdaptations:[g.adaptation]}).holds.length,2);
});
test('reference context replay holds when a stable target task changes without an own review map',()=>{
 const {readJson,adaptation,current}=referenceMethodFixture(),target=current.sections[0].blocks.find(b=>b.id==='a');assert.equal(target.classification.archetypeReview,undefined);
 target.content.prompt='Calculate $4+9$.';target.content.answer={short:'13',worked:'$4+9=13$'};
 const currentBindings=resolveExerciseReferences(current).records,replayedBindings=resolveExerciseReferences(adaptation.candidate).records;assert.deepEqual(currentBindings,replayedBindings);
 const support=reviewedMethodSupport(current,{readJson,referenceAdaptations:[adaptation]});assert.equal(support.holds.length,2);assert(support.holds.every(h=>h.kind==='review-context-unverified'));
});

function archivedMethodFixture(){
 const header={id:'header',type:'callout',content:'Methods',sourceLayoutEvidence:{originalContent:{blocks:[{id:'method',type:'layout',blocks:[]}]}}};
 const method={id:'method',type:'worked-example',content:{id:'method-root',type:'paragraph',prompt:'Use the supplied relation.'}},a=q('a',40);
 a.classification.archetypeReview={mapFile:'map'};
 const p=project([header,method,a]),snapshot=structuredClone(p),map={projectId:'p',snapshot:'snapshot',questions:{a:{topicId:'t',archetype:'x'}},topics:[{topicId:'t',clusters:[{id:'x',teachingIds:['method']}]}]};
 return {p,snapshot,readJson:file=>file==='map'?map:snapshot};
}

test('archived layout IDs cannot shadow the unchanged live method owner',()=>{
 const {p,snapshot,readJson}=archivedMethodFixture(),before=structuredClone({p,snapshot});
 const support=reviewedMethodSupport(p,{readJson});
 assert.deepEqual(support.holds,[]);
 assert.deepEqual(support.edges.map(e=>[e.before,e.after,e.anchor]),[['method','a','method']]);
 assert.deepEqual({p,snapshot},before);
});

test('genuine duplicate live method IDs remain ambiguous despite an archived copy',()=>{
 const {p,readJson}=archivedMethodFixture();
 p.sections[0].blocks.push({id:'other',type:'callout',content:{id:'method',type:'paragraph',prompt:'Another live node.'}});
 const support=reviewedMethodSupport(p,{readJson});
 assert.deepEqual(support.edges,[]);
 assert.equal(support.holds.length,1);assert.match(support.holds[0].reason,/method anchor changed or absent: method/);
});

test('real method drift or a missing live anchor cannot fall back to archived evidence',()=>{
 for(const mutation of ['change','remove']){
  const {p,readJson}=archivedMethodFixture();
  if(mutation==='change')p.sections[0].blocks[1].content.prompt='A different mathematical relation.';
  else p.sections[0].blocks.splice(1,1);
  const support=reviewedMethodSupport(p,{readJson});
  assert.deepEqual(support.edges,[]);
  assert.equal(support.holds.length,1);assert.match(support.holds[0].reason,/method anchor changed or absent: method/);
 }
});
test('all requested exercise roles are recognised but teaching/candidate pools are excluded',()=>{for(const role of['exam','challenge','mixed-review','practice'])assert.ok(exerciseRole({phase:'practice',role}));assert.equal(exerciseRole({phase:'teaching',role:'practice'}),null);assert.equal(exerciseRole({phase:'practice',role:'candidate-pool'}),null);});
test('revision or content changes make an otherwise valid plan stale',()=>{const p=project([q('a',40),q('b',10)]),plan=planScoreOrder(p);p.revision++;assert.throws(()=>scoreOrderCandidate(p,plan),/Stale/);p.revision--;p.studio.flags.push({id:'edit'});assert.throws(()=>scoreOrderCandidate(p,plan),/Stale/);});
test('source contrast groups never enter ordinary sorting',()=>{const p=project([q('a',40),q('contrast',10,{contrastGroup:'compare'}),q('b',5)]),plan=planScoreOrder(p);assert.deepEqual(plan.sections[0].barriers,['contrast']);assert.deepEqual(ids(scoreOrderCandidate(p,plan)),['a','contrast','b']);});
test('existing task-bound ratings do not require repeat reviews based on evidence path',()=>{for(const evidence of ['run/semantic-packets/page-001.author/generation.json','run/generation.json','run/draft.json']){const b=q('b',10);b.classification.assessment.evidence=evidence;const p=project([q('a',40),b]),plan=planScoreOrder(p);assert.deepEqual(plan.holds,[]);assert.deepEqual(ids(scoreOrderCandidate(p,plan)),['b','a']);}});
test('valid mechanical whole-question renumbering retains its existing author rating without another receipt',()=>{const source=q('b',10);source.classification.assessment.evidence='run/semantic-packets/assignment/1/generation.json';const target=structuredClone(source);target.content.label='17';target.classification=reuseReasoningRating(source,target);assert(target.classification);const p=project([q('a',40),target]),plan=planScoreOrder(p);assert.deepEqual(plan.holds,[]);assert.deepEqual(ids(scoreOrderCandidate(p,plan)),['b','a']);});
test('missing invalid stale and mathematically changed ratings still hold',()=>{for(const mutate of [b=>delete b.classification,b=>delete b.classification.assessment,b=>{b.classification.difficultyReason='';},b=>{b.classification.assessment.taskHash='0'.repeat(64);},b=>{b.content.prompt='Calculate $4+9$.';}]){const b=q('b',10);b.classification.assessment.evidence='run/generation.json';mutate(b);const p=project([q('a',40),b]),plan=planScoreOrder(p);assert(plan.holds.some(h=>h.id==='b'&&h.kind==='rating-unverified'));assert.deepEqual(ids(scoreOrderCandidate(p,plan)),['a','b']);}});
test('existing-rating admission never substitutes for a new backfill initial independent review',()=>{const b=q('b',10);b.classification.assessment.evidence='run/generation.json';const result={items:[{id:b.id,content:b.content}]},draft={model:'claude-sonnet-5-5',kind:'backfill',metrics:{modelUsage:{'claude-sonnet-5-5':{}}},result,draftHash:draftHash(result)};assert.deepEqual(planScoreOrder(project([b])).holds,[]);assert.throws(()=>assertIndependentBackfillReview({draft,blocks:[b]}),/Independent review must verify/);});

const redigest=plan=>{const{planDigest,...body}=plan;plan.planDigest=createHash('sha256').update(JSON.stringify(body)).digest('hex');return plan;};
test('candidate refuses arbitrary plannedIds tampering even with a recomputed caller digest',()=>{const p=project([q('a',40),q('b',10)]),plan=planScoreOrder(p);plan.sections[0].plannedIds=['a','b'];assert.throws(()=>scoreOrderCandidate(p,plan),/modified/);redigest(plan);assert.throws(()=>scoreOrderCandidate(p,plan),/recomputed safety/);});
test('held dependency segment cannot be reordered through caller plan mutation',()=>{const p=project([q('a',40),q('b',10)]),plan=planScoreOrder(p,{supportEdges:[{before:'a',after:'b',kind:'reviewed-method-support'}]});plan.sections[0].plannedIds=['b','a'];plan.sections[0].segments[0].holds=[];redigest(plan);assert.throws(()=>scoreOrderCandidate(p,plan),/recomputed safety/);assert.deepEqual(ids(p),['a','b']);});
test('explicit independently reviewed adjacent instructional unit uses verified max without changing scores',()=>{const p=project([q('prior',60),q('follow',58),q('other',59)]),unit={ids:['prior','follow'],reason:'Follow-up uses the supplied method in prior.',evidence:'reviewed-source-proof.json'},plan=planScoreOrder(p,{supportEdges:[{before:'prior',after:'follow'}],semanticUnits:[unit]});assert.deepEqual(plan.sections[0].plannedIds,['other','prior','follow']);assert.equal(plan.sections[0].segments[0].units[0].difficultyKey,60);assert.deepEqual(plan.sections[0].segments[0].units[0].scores,undefined);assert.deepEqual(scoreOrderCandidate(p,plan).sections[0].blocks.slice(1).map(b=>b.classification.reasoningScore),[60,58]);});

function independentFixture({rating=true,sameJob=false,legacyOmitMath=false,mathematicsReviewed=true}={}){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-score-proof-')),author=path.join(dir,'semantic-packets','author'),review=path.join(dir,'lean-review','calls','content-review');fs.mkdirSync(author,{recursive:true});fs.mkdirSync(review,{recursive:true});const b=q('b',10);b.classification.assessment.evidence=path.join(author,'generation.json');fs.writeFileSync(b.classification.assessment.evidence,'{}');fs.writeFileSync(path.join(author,'events.jsonl'),JSON.stringify({type:'thread.started',thread_id:'author-job'})+'\n');const verdict={id:'b',outcome:'passed',...(legacyOmitMath?{}:{mathematicsReviewed}),note:'Source and answers independently checked.',...(rating?{reasoningScore:10,difficultyReason:'Direct application independently rated.'}:{})};fs.writeFileSync(path.join(review,'last-message.txt'),JSON.stringify({reviewer:'independent-content-reviewer',records:[verdict]}));fs.writeFileSync(path.join(review,'events.jsonl'),[{type:'thread.started',thread_id:sameJob?'author-job':'reviewer-job'},{type:'turn.completed'}].map(JSON.stringify).join('\n'));fs.writeFileSync(path.join(dir,'lean-review','reviewed.json'),JSON.stringify({route:'lean-review-v1',questions:{b:{outcome:'passed',acceptedVersion:{outcome:'passed',snapshot:b,mathematicalHash:reuseContentHash(b),at:'2026-10-29T01:00:00Z',note:verdict.note}}}}));return{dir,b,review,author,verdict};}
test('accepted mathematical/source review alone never proves independent difficulty',()=>{const{b}=independentFixture({rating:false});assert.deepEqual(acceptedSourceRatingReuses(project([b])),[]);});
test('retained different reviewer explicit numeric verdict can reuse an unchanged author rating',()=>{const{b,dir}=independentFixture(),p=project([q('a',40),b]),proofs=acceptedSourceRatingReuses(p);assert.equal(proofs.length,1);const plan=planScoreOrder(p,{ratingReuses:proofs});assert.deepEqual(ids(scoreOrderCandidate(p,plan)),['b','a']);const file=proofs[0].ratingVerdict.file;fs.appendFileSync(file,' ');assert.throws(()=>scoreOrderCandidate(p,plan),/recomputed safety/);assert.ok(dir);});
test('explicit contradictory or tampered numeric receipts remain held when supplied',()=>{for(const mutate of [(b,proof)=>{proof.sha256='0'.repeat(64);},(b,proof)=>{proof.taskHash='0'.repeat(64);},(b)=>{b.classification.reasoningScore=11;}]){const {b}=independentFixture(),p=project([q('a',40),b]),proofs=acceptedSourceRatingReuses(p);assert.equal(proofs.length,1);mutate(b,proofs[0]);const plan=planScoreOrder(p,{ratingReuses:proofs});assert(plan.holds.some(h=>h.id==='b'&&h.kind==='rating-reuse-proof-invalid'));assert.deepEqual(ids(scoreOrderCandidate(p,plan)),['a','b']);}});
test('the author job cannot serve as its own independent rating reviewer',()=>{const{b}=independentFixture({sameJob:true});assert.deepEqual(acceptedSourceRatingReuses(project([b])),[]);});

test('legacy absent mathematics flag reuses only explicit independent numeric verdict through accepted lean snapshot',()=>{
 const {b}=independentFixture({legacyOmitMath:true}),before=structuredClone(b),p=project([q('a',40),b]),proofs=acceptedSourceRatingReuses(p);
 assert.equal(proofs.length,1);assert.deepEqual(ids(scoreOrderCandidate(p,planScoreOrder(p,{ratingReuses:proofs}))),['b','a']);assert.deepEqual(b,before);
});
test('explicit false null and unknown legacy mathematics flags remain refused',()=>{
 for(const mathematicsReviewed of [false,null,'unknown','true',0,1]){const {b}=independentFixture({mathematicsReviewed});assert.deepEqual(acceptedSourceRatingReuses(project([b])),[]);}
});
test('legacy absence cannot infer a numeric score or missing rationale from a maths pass',()=>{
 const {b}=independentFixture({legacyOmitMath:true,rating:false});assert.deepEqual(acceptedSourceRatingReuses(project([b])),[]);
 const f=independentFixture({legacyOmitMath:true});delete f.verdict.difficultyReason;fs.writeFileSync(path.join(f.review,'last-message.txt'),JSON.stringify({reviewer:'independent-content-reviewer',records:[f.verdict]}));assert.deepEqual(acceptedSourceRatingReuses(project([f.b])),[]);
});
test('legacy absence preserves distinct completed reviewer and current task guards',()=>{
 const same=independentFixture({legacyOmitMath:true,sameJob:true});assert.deepEqual(acceptedSourceRatingReuses(project([same.b])),[]);
 const incomplete=independentFixture({legacyOmitMath:true});fs.writeFileSync(path.join(incomplete.review,'events.jsonl'),JSON.stringify({type:'thread.started',thread_id:'reviewer-job'}));assert.deepEqual(acceptedSourceRatingReuses(project([incomplete.b])),[]);
 const changed=independentFixture({legacyOmitMath:true});changed.b.content.prompt='A different mathematical task.';assert.deepEqual(acceptedSourceRatingReuses(project([changed.b])),[]);
});
test('legacy absence still requires exact accepted mathematical hash and classification acceptance',()=>{
 const f=independentFixture({legacyOmitMath:true}),file=path.join(f.dir,'lean-review','reviewed.json'),state=JSON.parse(fs.readFileSync(file));state.questions.b.acceptedVersion.mathematicalHash='0'.repeat(64);fs.writeFileSync(file,JSON.stringify(state));assert.deepEqual(acceptedSourceRatingReuses(project([f.b])),[]);
 const rejected=independentFixture({legacyOmitMath:true});rejected.verdict.classificationVerified=false;fs.writeFileSync(path.join(rejected.review,'last-message.txt'),JSON.stringify({reviewer:'independent-content-reviewer',records:[rejected.verdict]}));assert.deepEqual(acceptedSourceRatingReuses(project([rejected.b])),[]);
});
test('CLI rejects overwrite, unknown flags and live outputs before any output write',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-score-cli-')),input=path.join(dir,'input.json'),out=path.join(dir,'out.json'),report=path.join(dir,'report.json');fs.writeFileSync(input,JSON.stringify(project([q('a',40),q('b',10)])));fs.writeFileSync(out,'retained');assert.throws(()=>scoreOrderMain(['--candidate',input,'--out',out,'--report',report]),/overwrite/);assert.equal(fs.readFileSync(out,'utf8'),'retained');assert.equal(fs.existsSync(report),false);assert.throws(()=>scoreOrderMain(['--candidate',input,'--out',path.resolve('booklets/projects/score-test.json'),'--report',report]),/live project writes/);assert.throws(()=>scoreOrderMain(['--candidate',input,'--out',path.join(dir,'fresh.json'),'--bogus',report]),/Use --candidate/);});
test('CLI writes a separate reproducible shadow and report without changing input',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-score-cli-')),input=path.join(dir,'input.json'),out=path.join(dir,'out.json'),report=path.join(dir,'report.json'),raw=JSON.stringify(project([q('a',40),q('b',10)]));fs.writeFileSync(input,raw);const result=scoreOrderMain(['--candidate',input,'--out',out,'--report',report]);assert.equal(result.liveWrites,0);assert.equal(fs.readFileSync(input,'utf8'),raw);assert.deepEqual(ids(JSON.parse(fs.readFileSync(out))),['b','a']);const proof=JSON.parse(fs.readFileSync(report));assert.equal(proof.candidateSha256,createHash('sha256').update(fs.readFileSync(out)).digest('hex'));});

function missingMethodSnapshotFixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-method-snapshot-')),file=path.join(dir,'map.json'),snapshotFile=path.join(dir,'snapshot.json');
 const intro={id:'intro',type:'callout',content:'Supplied method.'},a=q('a',40),b=q('b',20);
 for(const block of [a,b])block.classification.archetypeReview={mapFile:file};
 const p=project([intro,a,b]),snapshot=structuredClone(p),text=JSON.stringify(snapshot);
 const map={projectId:'p',snapshotSha256:createHash('sha256').update(text).digest('hex'),questions:{a:{topicId:'t',archetype:'x'},b:{topicId:'t',archetype:'x'}},topics:[{topicId:'t',clusters:[{id:'x',teachingIds:['intro']}]}]};
 fs.writeFileSync(snapshotFile,text);const save=()=>fs.writeFileSync(file,JSON.stringify(map));save();
 return{dir,file,snapshotFile,p,snapshot,map,save};
}
test('missing recorded snapshot pointer resolves exact same-directory hash once per map',t=>{
 const f=missingMethodSnapshotFixture();t.after(()=>fs.rmSync(f.dir,{recursive:true,force:true}));
 const original=fs.readdirSync.bind(fs);let scans=0;t.mock.method(fs,'readdirSync',(...args)=>{scans++;return original(...args);});
 const result=reviewedMethodSupport(f.p);assert.deepEqual(result.holds,[]);assert.deepEqual(result.edges.map(e=>[e.before,e.after]),[['intro','a'],['intro','b']]);assert.equal(scans,1);
});
test('recorded projected snapshot is preferred without scanning and still checks current anchors',t=>{
 const f=missingMethodSnapshotFixture();t.after(()=>fs.rmSync(f.dir,{recursive:true,force:true}));f.map.metadataRatingProjection={projectedSnapshot:f.snapshotFile};f.save();
 t.mock.method(fs,'readdirSync',()=>{throw Error('must not scan');});assert.deepEqual(reviewedMethodSupport(f.p).holds,[]);
 f.p.sections[0].blocks[0].content='Changed method.';assert.equal(reviewedMethodSupport(f.p).holds.length,2);
});
test('missing-pointer lookup rejects wrong hash, wrong project and explicit stale pointers',t=>{
 for(const mutation of ['hash','project','explicit','false','preferred','outside']){
  const f=missingMethodSnapshotFixture();try{
   if(mutation==='hash')f.map.snapshotSha256='0'.repeat(64);
   if(mutation==='project'){f.snapshot.id='other';const text=JSON.stringify(f.snapshot);fs.writeFileSync(f.snapshotFile,text);f.map.snapshotSha256=createHash('sha256').update(text).digest('hex');}
   if(mutation==='explicit')f.map.snapshot=path.join(f.dir,'missing.json');
   if(mutation==='false')f.map.snapshot=false;
   if(mutation==='preferred')f.map.metadataRatingProjection={projectedSnapshot:path.join(f.dir,'missing.json')};
   if(mutation==='outside')f.map.metadataRatingProjection={projectedSnapshot:path.join(f.dir,'..','snapshot.json')};
   f.save();assert.equal(reviewedMethodSupport(f.p).holds.length,2,mutation);
  }finally{fs.rmSync(f.dir,{recursive:true,force:true});}
 }
});
test('snapshot lookup rejects symbolic links and caches unsuccessful lookup per map',t=>{
 const f=missingMethodSnapshotFixture();t.after(()=>fs.rmSync(f.dir,{recursive:true,force:true}));
 const original=fs.lstatSync.bind(fs),read=fs.readdirSync.bind(fs);let scans=0;
 t.mock.method(fs,'lstatSync',file=>path.resolve(file)===f.snapshotFile?{isFile:()=>true,isSymbolicLink:()=>true}:original(file));
 t.mock.method(fs,'readdirSync',(...args)=>{scans++;return read(...args);});
 assert.equal(reviewedMethodSupport(f.p).holds.length,2);assert.equal(scans,1);
});
