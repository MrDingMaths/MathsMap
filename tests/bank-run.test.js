import test from 'node:test';
import assert from 'node:assert/strict';
import {normaliseQuestion,validateQuestion,makeBankManifest,bankContextErrors} from '../src/lib/practice-question-model.js';
import {recordedReview} from '../scripts/booklet/recorded-review.mjs';
import {preservedProject} from '../scripts/booklet/import-project-bank.mjs';
import {contentFingerprint} from '../pedagogy/audit-v2-plan.mjs';
import {mergedContent,resolveFollowUps,validJudgement} from '../pedagogy/bank-merges.mjs';
import {buildAssessments,sourceScope} from '../pedagogy/bank-assessments.mjs';
import {printedMarks,hasBankWork} from '../pedagogy/bank-run.mjs';
import {newRecordExclusions} from '../pedagogy/bank-batch.mjs';
import {questionDependencyFindings} from '../src/lib/booklet-question-dependencies.js';
import {verifiedRating} from '../scripts/booklet/reasoning-ratings.mjs';

const part=(id,label,prompt)=>({id,type:'part',label,prompt,answer:{short:'1',worked:'$$1$$'}});
const question=(id,prompt,parts,extra={})=>({id,type:'question',pedagogyRole:'practice',classification:{primarySkillId:'factorise-quadratic',secondarySkillIds:[]},content:{id:id+'-root',type:'question',prompt,...(parts?{children:parts}:{answer:{short:'1',worked:'$$1$$'}})},...extra});
const bankRecord=extra=>({...normaliseQuestion({id:'q-1',status:'approved',classification:{primarySkillId:'expand-brackets',reasoningScore:20,difficultyReason:'One step.'},content:{id:'r',type:'question',prompt:'Expand $2(x+1)$.',answer:{short:'$2x+2$',worked:'$$2x+2$$'}}}),...extra});

test('bank records carry their origin: master or textbook, with the owning booklet and section role', ()=>{
 const context={origin:'textbook',projectId:'cambridge-x11-ch01',blockId:'p3-q1-block',sectionRole:'exercise'};
 const record=bankRecord({bankContext:context});
 assert.deepEqual(normaliseQuestion(record).bankContext,context);
 assert.ok(validateQuestion(record).valid);
 assert.equal(makeBankManifest([record]).questions[0].origin,'textbook');
 assert.equal(makeBankManifest([record]).questions[0].sectionRole,'exercise');
 assert.ok(!validateQuestion(bankRecord({bankContext:{...context,origin:'class'}})).valid);
 assert.ok(!validateQuestion(bankRecord({bankContext:{...context,projectId:''}})).valid);
 assert.ok(!validateQuestion(bankRecord({bankContext:{...context,sectionRole:'exam'}})).valid);
 assert.deepEqual(bankContextErrors({...context,exam:'HSC'}),[]);
 assert.ok(bankContextErrors({...context,note:'x'}).length,'unknown fields are refused');
 // An older record without the field stays valid.
 assert.ok(validateQuestion(bankRecord()).valid);
 assert.equal(normaliseQuestion(bankRecord()).bankContext,undefined);
});

test('follow-up merge: the follow-up continues the previous question in one label sequence', ()=>{
 const previous=question('p9-q7','Factor each quadratic.',[part('p9-q7-a','a','$3x^2+4x+1$'),part('p9-q7-b','b','$2x^2+5x+2$')]);
 const followUp=question('p10-q8','Hence factor each expression.',[part('p10-q8-a','a','$a^2-25$'),part('p10-q8-b','b','$b^2-25b$')]);
 const {content,labels}=mergedContent(previous,followUp);
 assert.equal(content.layout,'list');
 assert.equal(content.children.length,2);
 assert.deepEqual(content.children[1].children.map(c=>c.label),['c','d']);
 assert.equal(content.children[1].prompt,'Hence factor each expression.');
 assert.deepEqual(labels['p10-q8-a'],['a','c']);
 assert.deepEqual(content.children[0].children.map(c=>c.id),['p9-q7-a','p9-q7-b'],'node ids are kept');
 const naming=question('x','Use part a of the previous question.',[part('x-a','a','$1$')]);
 assert.ok(mergedContent(previous,naming).manual,'wording that names a part is left for hand repair');
 assert.ok(mergedContent(question('s','Single.'),followUp).manual,'an unlettered question is left for hand repair');
});

test('follow-up judge reply must cover every candidate with a decision and a note', ()=>{
 const ids=new Set(['a']);
 assert.ok(validJudgement({items:[{id:'a',decision:'independent',note:'Refers to a method only; all givens are present.'}]},ids));
 assert.ok(!validJudgement({items:[{id:'a',decision:'embed',note:'Needs the expression from the previous question.'}]},ids),'embed needs a prompt');
 assert.ok(!validJudgement({items:[{id:'a',decision:'merge',note:'short'}]},ids));
 assert.ok(!validJudgement({items:[]},ids));
});

test('resolveFollowUps: independent records a dependency review; merge joins, re-rates and binds a review', async ()=>{
 const previous=question('p9-q7','Factor each quadratic.',[part('p9-q7-a','a','$3x^2+4x+1$')]);
 const method=question('p10-q8','Use the techniques of the previous questions to factor $a^2-25$.');
 const hence=question('p10-q9','Hence use your answers to the previous question to solve $3x^2+4x+1=0$.',[part('p10-q9-a','a','Solve.')]);
 const project={id:'book',title:'Book',sections:[{id:'s',phase:'practice',blocks:[previous,method]},{id:'t',phase:'practice',blocks:[structuredClone(previous),hence]}]};
 project.sections[1].blocks[0].id='p9-q7b';project.sections[1].blocks[0].content.id='p9-q7b-root';
 const prevB=project.sections[1].blocks[0];
 const call=async({name})=>name==='judge'
  ?{model:'gpt-6.1-sol',effort:'low',at:'2026-11-12T00:00:00.000Z',result:{items:[{id:'p10-q8',decision:'independent',note:'Refers to a factoring method only; the expression is given.'},{id:'p10-q9',decision:'merge',note:'Solving needs the factorisation from the previous question.'}]}}
  :{model:'gpt-6.1-sol',effort:'low',at:'2026-11-12T00:00:01.000Z',evidence:'x/last-message.txt',result:{items:[{id:'p9-q7b',reasoningScore:30,difficultyReason:'Factorise, then apply the null factor law.'}]}};
 const reviewOf=()=>({current:true,by:'import'});
 const {project:out,results}=await resolveFollowUps(project,[{followUp:method,previous,references:['previous questions']},{followUp:hence,previous:prevB,references:['previous question']}],{dir:'unused',call,reviewOf});
 assert.equal(results.find(r=>r.blockId==='p10-q8').decision,'independent');
 assert.equal(results.find(r=>r.blockId==='p10-q9').decision,'merge');
 const deps=questionDependencyFindings(out);
 assert.ok(deps.every(d=>d.reviewed),'neither block is still an unreviewed dependency');
 assert.ok(!out.sections[1].blocks.some(b=>b.id==='p10-q9'),'the merged follow-up block is gone');
 const merged=out.sections[1].blocks[0];
 assert.equal(merged.classification.reasoningScore,30);
 assert.ok(verifiedRating(merged),'the re-rating is bound to the merged task');
 assert.deepEqual(recordedReview(merged),{current:true,by:'bank-merge'});
 // A merge whose components lack a current review is not applied.
 const blocked=await resolveFollowUps(project,[{followUp:hence,previous:prevB,references:['previous question']}],{dir:'unused',reviewOf:()=>({current:false,reason:'review-stale'}),call:async({name})=>name==='judge'?{model:'m',effort:'low',at:'2026-11-12T00:00:00.000Z',result:{items:[{id:'p10-q9',decision:'merge',note:'Solving needs the factorisation from the previous question.'}]}}:assert.fail('no re-rating')});
 assert.equal(blocked.results[0].decision,'merge-blocked');
 assert.ok(blocked.project.sections[1].blocks.some(b=>b.id==='p10-q9'));
});

test('a merge record stops covering the question once its content changes', ()=>{
 const block=question('a','Find $x$.');
 block.sourceReview={bankMergeReview:{fingerprint:contentFingerprint(block),components:[{blockId:'a',current:true}]}};
 assert.deepEqual(recordedReview(block),{current:true,by:'bank-merge'});
 block.content.prompt='Find $y$.';
 assert.equal(recordedReview(block).current,false);
});

test('assessments: publish rows get origin and mapping notes; others are deferred with reasons; Decision 6 links', ()=>{
 const block=question('p5-q1','Expand $2(x+1)$.',null,{classification:{primarySkillId:'expand-brackets',secondarySkillIds:['nope'],reasoningScore:20,difficulty:'Foundation',difficultyReason:'One step.'}});
 const left=question('p5-q2','Expand $3(x+1)$.');
 const project={id:'m',title:'Master',revision:3,library:{category:'master'},sections:[{id:'t',phase:'teaching',blocks:[{id:'theory-1',type:'text'}]},{id:'s',phase:'practice',title:'Exercise',blocks:[block,left]}]};
 project.sections[1].blocks[0].sourceReview={};
 const fp=contentFingerprint(block);
 const root='D:/nowhere';
 const skills=[{id:'expand-brackets',courses:['s5-core'],dotPointIds:['d1']}],dotpoints=[{id:'d1',topicId:'t-alg'}];
 const rows=[{blockId:'p5-q1',origin:'master',action:'publish',sectionRole:'challenge'},{blockId:'p5-q2',origin:'master',action:'leave-out',reasons:['rating-not-current']}];
 // The audit record is read from disk; with none, the publish row is deferred as having no recorded review.
 const a=buildAssessments(project,rows,{root,skills,dotpoints});
 assert.deepEqual(a.deferred.map(d=>[d.blockId,d.reasons[0]]),[['p5-q1','no-recorded-review'],['p5-q2','rating-not-current']]);
 assert.equal(a.questions.length,0);
 assert.equal(a.existingTransferReview.profile,'recorded-review-v1');
 assert.equal(a.existingTransferReview.origin,'master');
 assert.deepEqual(a.sourceContext.evidenceBlockIds,['theory-1']);
 assert.ok(fp);
 const linked=buildAssessments(project,[{blockId:'p5-q1',origin:'textbook',action:'link-master',bankId:'q-master'}],{root,skills,dotpoints});
 assert.deepEqual(linked.masterLinks,{'p5-q1':'q-master'});
 assert.deepEqual(sourceScope(['expand-brackets'],{skills,dotpoints}),{courseIds:['s5-core'],topicIds:['t-alg']});
});

test('textbook questions still printing a mark such as [3] are found', ()=>{
 assert.deepEqual(printedMarks(question('a','Find the value of $x$.\n[3]')),['[3]']);
 assert.deepEqual(printedMarks(question('b','Find $[3]$ and the list $[1,2]$.')),[]);
});

test('a slash fraction remains excluded and the planner retains the validation reason', ()=>{
 const block=question('a','Find $x$.');
 block.content.answer.worked='Find $x=1/2$.';
 assert.ok(newRecordExclusions(block,'master',false).some(r=>r.startsWith('bank-validation:')&&r.includes('slash-style fraction notation')));
 block.content.answer.worked=String.raw`Find $x=\frac{1}{2}$.`;
 assert.deepEqual(newRecordExclusions(block,'master',false),[]);
});

test('an exact link alone requires staging; a hold alone does not', ()=>{
 const assessments={questions:[]};
 assert.equal(hasBankWork([{action:'link'}],assessments),true);
 assert.equal(hasBankWork([{action:'hold'}],assessments),false);
});

test('Decision 6: a textbook block adopted by a master copy may change content; nothing else may', ()=>{
 const a=question('a','Expand.'),b=question('b','Factor.');
 const before={id:'t',sections:[{id:'s',phase:'practice',blocks:[a,b]}]};
 const after=structuredClone(before);after.sections[0].blocks[0].content.prompt='Expand fully.';
 assert.notDeepEqual(preservedProject(after),preservedProject(before));
 assert.deepEqual(preservedProject(after,new Set(['a'])),preservedProject(before,new Set(['a'])));
 after.sections[0].blocks[1].content.prompt='Factorise.';
 assert.notDeepEqual(preservedProject(after,new Set(['a'])),preservedProject(before,new Set(['a'])));
});

test('fraction check accepts units, slope marks, exponents, limits and factorials; still catches other slashes', async ()=>{
 const {invalidFractionSpans}=await import('../src/lib/practice-question-model.js');
 const ok=[String.raw`$864\text{ cm}^3/\text{min}$`,String.raw`$\$2.80/\text{kg}$`,String.raw`$0.7^\circ\mathrm{C}/\mathrm{min}$`,String.raw`$144\text{ mm}^3\!/\text{s}$`,
  String.raw`$-6\ \mathrm{m/s^2}$`,String.raw`$\mathrm{g/cm^3}$`,'$/$',String.raw`$x^{1/2}$`,String.raw`$e^{-t/5}$`,String.raw`$\displaystyle\int_0^{\pi/2}\cos x\,dx$`,
  String.raw`$x^{-1/2}\times x^{2/3}$`,String.raw`$5!/3!=20$`,String.raw`$\frac{n!}{(n-r)!}=n!/(n-r)!$`,String.raw`$P(t)=\dfrac{700}{1+4e^{-t/5}}$`,
  String.raw`$-\$5028.23\text{/year}$`,String.raw`$24\text{ nautical miles/h}$`];
 for(const v of ok)assert.equal(invalidFractionSpans(v).length,0,v);
 const bad=[String.raw`$x=\pi/2$`,'$y=1/x$','$-5/3$','$AC/BC=BC/DC$','$96/12=8$',String.raw`$x^{1/2}+1/x$`,String.raw`$\text{8/2}$`,String.raw`$\text{mg/L per 2 hours}$`,
  String.raw`$8/2\text{km/h}$`,String.raw`$120/(40+60)$`,String.raw`$\text{ cm}/2$`,String.raw`$3/\text{min}$`,String.raw`$\frac{x/2}{3}$`,'$//$',
  String.raw`$\text{more than 10 km/h over limit}$`,String.raw`$\text{ miles/2}$`,String.raw`$\frac{x^{3/2}}{3/2}$`];
 for(const v of bad)assert.equal(invalidFractionSpans(v).length,1,v);
});
