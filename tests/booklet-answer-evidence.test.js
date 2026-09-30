import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {answerMatchText,answerMatchingIssues,approvedAnswerConflict,derivedAnswerDiagramEntries} from '../scripts/booklet/answer-evidence.mjs';
const match=()=>({questionId:'q62',teacherReference:[{pdfPage:5,printedPage:583,exercise:'1G',questionLabel:'62(a,b)'},{pdfPage:6,printedPage:584,exercise:'1G',questionLabel:'62(c,d)'}],matchEvidence:'Compared the four labelled equations and solutions in the source and answer images.',conflict:null});
test('derived answer figures retain printed-question provenance without importing teaching figures',()=>{
 const sections=[{blocks:[{id:'q1',type:'question',content:{id:'q1-content',questionDiagrams:[{id:'printed'}],answer:{solutionDiagrams:[{id:'answer'}]},children:[{id:'q1-a',answer:{solutionDiagrams:[{id:'part-answer'}]}}]}},{id:'example',type:'worked-example',content:{answer:{solutionDiagrams:[{id:'teaching'}]}}}]}];
 const entries=[{id:'source-q1',targetId:'q1',pageNumber:4,kind:'question'},{id:'teacher-answer',targetId:'answer',exclusionReason:'Answer book is reference only'}],original=structuredClone({sections,entries});
 const derived=derivedAnswerDiagramEntries(sections,entries);
 assert.deepEqual(derived.map(e=>e.targetId),['answer','part-answer']);assert.ok(derived.every(e=>e.derived&&e.derivedFrom==='source-q1'&&e.pageNumber===4));
 assert.equal(derived[1].responseId,'q1-a');assert.deepEqual({sections,entries},original);
 assert.deepEqual(derivedAnswerDiagramEntries(sections,[...entries,...derived]),[]);
 assert.throws(()=>derivedAnswerDiagramEntries(sections,[]),/inventoried source question/);
});
test('a whole question can match answer regions across two original PDF pages',()=>assert.deepEqual(answerMatchingIssues(['q62'],[match()],[5,6]),[]));
test('detailed generated answer comparisons survive text materialisation without granting review',()=>{
 const evidence=match(),detail={individualPixelComparison:[{sourceLabel:'62(a,b)',targetId:'q62-a',comparison:'Compared both equations and their labelled results.'},{sourceLabel:'62(c,d)',targetId:'q62-c',comparison:'Compared the continuation and remaining results.'}],sourceNote:'Original pixel observations.'};
 evidence.matchEvidence=detail;
 assert.deepEqual(answerMatchingIssues(['q62'],[evidence],[5,6]),[]);
 assert.deepEqual(JSON.parse(answerMatchText(detail)),detail);
 assert.equal(evidence.matchEvidence,detail);
 for(const invalid of [null,42,{},[],{individualPixelComparison:[]},{individualPixelComparison:[{sourceLabel:'62(a,b)',comparison:''}]}]){
  evidence.matchEvidence=invalid;assert.match(answerMatchingIssues(['q62'],[evidence],[5,6]).join(),/mathematical content/);
 }
 evidence.matchEvidence=detail;evidence.conflict='The key has a conflicting result.';
 assert.match(answerMatchingIssues(['q62'],[evidence],[5,6]).join(),/unresolved/);
});
test('derived figures accept a mapped whole-question content root, never an isolated part',()=>{
 const sections=[{blocks:[{id:'outer-question',type:'question',content:{id:'question-root',children:[{id:'part-a',answer:{solutionDiagrams:[{id:'authored-sharing-diagram'}]}}]}}]}];
 const entry={id:'source-question',kind:'question',targetId:'question-root',pageNumber:12};
 const [derived]=derivedAnswerDiagramEntries(sections,[entry]);
 assert.equal(derived.derivedFrom,'source-question');assert.equal(derived.sourceQuestionId,'outer-question');assert.equal(derived.responseId,'part-a');assert.equal(derived.pageNumber,12);
 for(const invalid of [{...entry,kind:'part'},{...entry,targetId:'part-a'},{...entry,exclusionReason:'Evidence only'}])assert.throws(()=>derivedAnswerDiagramEntries(sections,[invalid]),/inventoried source question/);
});

test('shared solution plots retain their response owner and remain unchecked derived evidence',()=>{
 const sections=[{blocks:[{id:'outer',type:'question',content:{id:'root',children:[{id:'part',sharedSolutionDiagrams:[{id:'completed-plot'}]}]}}]}];
 const entries=[{id:'source-question',kind:'question',targetId:'root',pageNumber:36}];
 const [derived]=derivedAnswerDiagramEntries(sections,entries);
 assert.equal(derived.targetId,'completed-plot');assert.equal(derived.responseId,'part');
 assert.equal(derived.derivedFrom,'source-question');assert.equal(derived.verification,undefined);
 assert.deepEqual(derivedAnswerDiagramEntries(sections,[...entries,derived]),[]);
});

test('grouped printed questions bind each solution graph to its explicit inventory parent',()=>{
 const sections=[{blocks:[{id:'group-block',type:'question',content:{id:'group-root',children:[{id:'part-a',answer:{solutionDiagrams:[{id:'graph-a'}]}},{id:'part-b',children:[{id:'nested',answer:{solutionDiagrams:[{id:'graph-b'}]}}]}]}}]}];
 const group={id:'source-group',kind:'group',targetId:'group-root',pageNumber:107};
 const a={id:'source-52',kind:'question',targetId:'part-a',parentId:group.id,pageNumber:107};
 const b={id:'source-53',kind:'question',targetId:'part-b',sharedStemId:group.id,pageNumber:107};
 const entries=[group,a,b],before=structuredClone({sections,entries}),derived=derivedAnswerDiagramEntries(sections,entries);
 assert.deepEqual(derived.map(e=>[e.targetId,e.derivedFrom,e.responseId]),[['graph-a','source-52','part-a'],['graph-b','source-53','nested']]);
 assert.deepEqual({sections,entries},before);assert.deepEqual(derivedAnswerDiagramEntries(sections,[...entries,...derived]),[]);
 for(const invalid of [[a,b],[group,{...a,parentId:'unrelated'},b],[group,{...a,kind:'part'},b],[group,a,{...b,exclusionReason:'Reference only'}]])assert.throws(()=>derivedAnswerDiagramEntries(sections,invalid),/inventoried source question/);
});
test('a shared instruction paragraph establishes only its explicitly parented question owners',()=>{
 const sections=[{blocks:[{id:'group-block',type:'question',content:{id:'group-root',prompt:{blocks:[{id:'shared-instruction',type:'paragraph',inlines:[{type:'text',text:'Sketch these relations.'}]}]},children:[{id:'part-a',answer:{solutionDiagrams:[{id:'graph-a'}]}},{id:'part-b',answer:{solutionDiagrams:[{id:'graph-b'}]}}]}}]}];
 const group={id:'source-stem',kind:'group',targetId:'shared-instruction',pageNumber:6};
 const a={id:'source-26',kind:'question',targetId:'part-a',parentId:group.id,pageNumber:6};
 const b={id:'source-27',kind:'question',targetId:'part-b',sharedStemId:group.id,pageNumber:6};
 const entries=[group,a,b],before=structuredClone({sections,entries}),derived=derivedAnswerDiagramEntries(sections,entries);
 assert.deepEqual(derived.map(e=>[e.targetId,e.derivedFrom,e.pageNumber]),[['graph-a','source-26',6],['graph-b','source-27',6]]);
 for(const targetId of ['group-block','group-root'])assert.deepEqual(derivedAnswerDiagramEntries(sections,[{...group,targetId},a,b]),derived);
 assert.deepEqual({sections,entries},before);assert.deepEqual(derivedAnswerDiagramEntries(sections,[...entries,...derived]),[]);
 for(const invalid of [[{...group,targetId:'another-question-instruction'},a,b],[{...group,targetId:'graph-a'},a,b],[{...group,exclusionReason:'Context only'},a,b],[group,a,{...b,sharedStemId:'another-group'}]])assert.throws(()=>derivedAnswerDiagramEntries(sections,invalid),/inventoried source question/);
});

test('a mapped group alone cannot become an invented whole-question answer owner',()=>{
 const sections=[{blocks:[{id:'outer',type:'question',content:{id:'root',answer:{solutionDiagrams:[{id:'graph'}]}}}]}];
 assert.throws(()=>derivedAnswerDiagramEntries(sections,[{id:'source-group',kind:'group',targetId:'outer',pageNumber:6}]),/inventoried source question/);
});

test('original range group metadata binds distinct inventoried questions without inventing group entries',()=>{
 const sections=[{blocks:[{id:'range-task',type:'question',content:{id:'range-root',children:[{id:'part-a',answer:{solutionDiagrams:[{id:'graph-a'}]}},{id:'part-b',children:[{id:'nested',answer:{solutionDiagrams:[{id:'graph-b'}]}}]}]}}]}];
 const entries=['a','b'].map((label,index)=>({id:'source-'+(20+index),kind:'question',targetId:'part-'+label,parentId:'range-task',sharedStemId:'original-range',pageNumber:35}));
 const group={id:'original-range',kind:'practice',targetId:'range-task',header:'Graph the following.',sourceIdentity:{pdfPage:35,printedPage:41},items:entries.map(entry=>entry.id)},options={groups:[group]},before=structuredClone({sections,entries,options});
 const derived=derivedAnswerDiagramEntries(sections,entries,options);
 assert.deepEqual(derived.map(entry=>[entry.targetId,entry.derivedFrom,entry.responseId,entry.pageNumber]),[['graph-a','source-20','part-a',35],['graph-b','source-21','nested',35]]);
 assert.deepEqual({sections,entries,options},before);assert.equal(entries.some(entry=>entry.kind==='group'),false);assert.deepEqual(derivedAnswerDiagramEntries(sections,[...entries,...derived],options),[]);
 for(const invalid of [{...group,items:['source-20']},{...group,items:['source-20','foreign']},{...group,items:['source-20','source-20']},{...group,targetId:'foreign-task'},{...group,targetId:'graph-a'},{...group,pageNumber:36},{...group,kind:'teaching'},{...group,exclusionReason:'Reference only'},{...group,header:''}])assert.throws(()=>derivedAnswerDiagramEntries(sections,entries,{groups:[invalid]}),/inventoried source question/);
 for(const invalid of [[entries[0],{...entries[1],parentId:'foreign'}],[entries[0],{...entries[1],sharedStemId:'foreign'}],[entries[0],{...entries[1],kind:'part'}],[entries[0],{...entries[1],targetId:'part-a'}],[entries[0],{...entries[1],exclusionReason:'Reference only'}]])assert.throws(()=>derivedAnswerDiagramEntries(sections,invalid,options),/inventoried source question/);
 assert.throws(()=>derivedAnswerDiagramEntries(sections,entries),/inventoried source question/);
});

test('an original instruction group may name the exact whole block through matching id and shared stem',()=>{
 const sections=[{blocks:[{id:'source-range',type:'question',content:{id:'root',children:[{id:'a',answer:{solutionDiagrams:[{id:'plot-a'}]}},{id:'b',answer:{solutionDiagrams:[{id:'plot-b'}]}}]}}]}];
 const entries=['a','b'].map(targetId=>({id:'source-'+targetId,kind:'question',targetId,pageNumber:67,parentId:'source-range',sharedStemId:'source-range'}));
 const group={id:'source-range',sharedStemId:'source-range',kind:'practice',instruction:'Sketch these parametric curves.',items:['source-a','source-b'],pageNumber:67},options={groups:[group]},before=structuredClone({sections,entries,options});
 assert.deepEqual(derivedAnswerDiagramEntries(sections,entries,options).map(entry=>[entry.targetId,entry.derivedFrom]),[['plot-a','source-a'],['plot-b','source-b']]);assert.deepEqual({sections,entries,options},before);
 for(const invalid of [{...group,id:'foreign-range'},{...group,sharedStemId:'foreign-range'},{...group,targetId:'foreign-block'},{...group,targetId:null},{...group,sourceReview:{sourceIdentity:{pdfPage:68}}},{...group,instruction:''},{...group,items:['source-a','source-a']}])assert.throws(()=>derivedAnswerDiagramEntries(sections,entries,{groups:[invalid]}),/inventoried source question/);
 assert.throws(()=>derivedAnswerDiagramEntries(sections,[entries[0],{...entries[1],sharedStemId:'foreign'}],options),/inventoried source question/);
});

test('native teaching activities bind solution figures to their explicitly inventoried tasks',()=>{
 const activity={id:'activity',type:'question',pedagogyRole:'investigation',content:{id:'tasks',children:[{id:'linear-task',answer:{solutionDiagrams:[{id:'linear-solution'}]}},{id:'quadratic-task',answer:{solutionDiagrams:[{id:'quadratic-solution'}]}}]}};
 const sections=[{phase:'teaching',blocks:[activity]}];
 const heading={id:'source-activity',kind:'teaching',targetId:'activity',pageNumber:4};
 const tasks=['linear','quadratic'].map(name=>({id:'source-'+name,kind:'question',targetId:name+'-task',parentId:heading.id,pageNumber:4}));
 const derived=derivedAnswerDiagramEntries(sections,[heading,...tasks]);
 assert.deepEqual(derived.map(e=>[e.targetId,e.derivedFrom]),[['linear-solution','source-linear'],['quadratic-solution','source-quadratic']]);
 assert.deepEqual(derivedAnswerDiagramEntries(sections,[heading,...tasks,...derived]),[]);
 assert.throws(()=>derivedAnswerDiagramEntries(sections,[heading]),/inventoried source question/);
 assert.throws(()=>derivedAnswerDiagramEntries(sections,[heading,{...tasks[0],parentId:'foreign'},tasks[1]]),/inventoried source question/);
 assert.throws(()=>derivedAnswerDiagramEntries([{blocks:[{...activity,pedagogyRole:undefined}]}],[heading,...tasks]),/inventoried source question/);
});

test('answer matches reject missing, duplicate, foreign and unselected references',()=>{
 assert.match(answerMatchingIssues(['q62'],[],[5,6]).join(),/exactly one/);
 assert.match(answerMatchingIssues(['q62'],[match(),match()],[5,6]).join(),/exactly one/);
 assert.match(answerMatchingIssues(['other'],[match()],[5,6]).join(),/Unknown answer evidence/);
 assert.match(answerMatchingIssues(['q62'],[match()],[5]).join(),/selected PDF page/);
});
test('resolved printed discrepancies require a current question-specific workflow decision',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'answer-review-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'review.txt');fs.writeFileSync(file,'Actual inspected evidence');
 const artifacts=[{path:file,hash:createHash('sha256').update(fs.readFileSync(file)).digest('hex')}],e={...match(),conflict:{status:'resolved-by-approved-correction',correctionId:'fix-root'}};
 const c={id:'fix-root',status:'approved',reviewer:'Reviewer',reason:'Printed key omitted a root.',evidence:artifacts,patches:[{page:38,targetId:'q62-b'}]},workflow={corrections:[c],issues:{}},review={workflow,page:38},original=structuredClone(e);
 assert.match(answerMatchingIssues(['q62'],[e],[5,6]).join(),/unresolved/);
 assert.deepEqual(answerMatchingIssues(['q62'],[e],[5,6],review),[]);assert.deepEqual(e,original);
 assert.equal(approvedAnswerConflict(e,review).decisionId,'fix-root');
 c.patches[0].targetId='q620';assert.match(answerMatchingIssues(['q62'],[e],[5,6],review).join(),/unresolved/);c.patches[0].targetId='q62-b';
 c.status='pending';assert.match(answerMatchingIssues(['q62'],[e],[5,6],review).join(),/unresolved/);c.status='approved';
 e.missing=true;assert.match(answerMatchingIssues(['q62'],[e],[5,6],review).join(),/unresolved/);delete e.missing;
 fs.writeFileSync(file,'Changed evidence');assert.match(answerMatchingIssues(['q62'],[e],[5,6],review).join(),/unresolved/);
});
test('historical text conflicts may cite an explicit retained decision, never a resolution phrase alone',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'answer-decision-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'review.txt');fs.writeFileSync(file,'Review');
 const e={...match(),conflict:'Resolved by approved decision answer62: preserve the prompt.'},issue={id:'answer62',page:38,status:'retained',message:JSON.stringify({questionIds:['q62']}),resolution:{reason:'Use full domain.',reviewer:'Reviewer',evidence:[{path:file,hash:createHash('sha256').update(fs.readFileSync(file)).digest('hex')}]}},review={page:38,workflow:{issues:{answer62:issue}}};
 assert.deepEqual(answerMatchingIssues(['q62'],[e],[5,6],review),[]);
 e.conflict='Resolved by approved decision answer620.';assert.match(answerMatchingIssues(['q62'],[e],[5,6],review).join(),/unresolved/);
 e.conflict='Resolved by approved decision answer62.';issue.message=JSON.stringify({questionIds:['q61']});assert.match(answerMatchingIssues(['q62'],[e],[5,6],review).join(),/unresolved/);
});
test('independently derived answers require current question-specific evidence of the unavailable key',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'unavailable-answer-key-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'source-review.txt');fs.writeFileSync(file,'Inspected damaged key and independently checked the answer.');
 const e={questionId:'q62',teacherReference:[],status:'independently-derived',matchEvidence:'The selected answer page is damaged; derived and checked all four parts from the source question.',conflict:{kind:'source-answer-unavailable',decisionId:'missing-key62'}};
 const issue={id:'missing-key62',page:38,targetId:'q62',status:'retained',resolution:{reason:'The answer image is unavailable; independently derived answers retain separate mathematical review.',reviewer:'Independent reviewer',evidence:[{path:file,hash:createHash('sha256').update(fs.readFileSync(file)).digest('hex')}]}};
 const review={page:38,workflow:{issues:{'missing-key62':issue}}},original=structuredClone(e);
 assert.match(answerMatchingIssues(['q62'],[e],[5,6]).join(),/answer reference/);
 assert.deepEqual(answerMatchingIssues(['q62'],[e],[5,6],review),[]);assert.deepEqual(e,original);
 for(const change of [{status:'pending'},{targetId:'q620'},{page:39}]){
  const changed=structuredClone(review);Object.assign(changed.workflow.issues['missing-key62'],change);
  assert.match(answerMatchingIssues(['q62'],[e],[5,6],changed).join(),/answer reference/);
 }
 for(const change of [{status:'missing'},{status:undefined},{conflict:{decisionId:'missing-key62'}},{teacherReference:[{pdfPage:5}]},{teacherReference:undefined}])
  assert.match(answerMatchingIssues(['q62'],[{...e,...change}],[5,6],review).join(),/answer reference/);
 assert.match(answerMatchingIssues(['q62'],[{...e,missing:true}],[5,6],review).join(),/unresolved/);
 assert.match(answerMatchingIssues(['q62'],[{...e,matchEvidence:''}],[5,6],review).join(),/mathematical content/);
 fs.writeFileSync(file,'Source evidence changed.');assert.match(answerMatchingIssues(['q62'],[e],[5,6],review).join(),/answer reference/);
});
test('grouped answer conflicts require an exact current mapping to the cited source decision',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'grouped-answer-decision-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'review.txt');fs.writeFileSync(file,'Inspected denominator x-4 and printed key excluding -4');
 const e={...match(),questionId:'domain-group',conflict:{resolutionId:'key4',inventoryId:'source-q4',targetId:'domain-d',status:'resolved-by-retained-editorial-decision'}};
 const issue={id:'key4',page:148,status:'retained',message:JSON.stringify({questionId:'source-q4'}),resolution:{reason:'Exclude positive 4, preserving the original key pixels.',reviewer:'Reviewer',evidence:[{path:file,hash:createHash('sha256').update(fs.readFileSync(file)).digest('hex')}]}};
 const packet={sections:[{blocks:[{id:'domain-group',type:'question',content:{id:'root',children:[{id:'domain-d',type:'part',prompt:'x/(x-4)'}]}}]}],inventoryMappings:[{inventoryId:'source-q4',targetId:'domain-d',field:'/prompt'}]};
 const inventory={pageNumber:148,entries:[{id:'source-q4',kind:'question'}]},review={page:148,workflow:{issues:{key4:issue}},packet,inventory};
 const before=structuredClone({e,review});assert.equal(approvedAnswerConflict(e,review)?.decisionId,'key4');assert.deepEqual({e,review},before);
 for(const altered of [{...review,packet:undefined},{...review,inventory:{...inventory,pageNumber:149}},{...review,inventory:{...inventory,entries:[{id:'source-q4',kind:'question',exclusionReason:'Context only'}]}},{...review,packet:{...packet,inventoryMappings:[{inventoryId:'source-q4',targetId:'unrelated-part'}]}},{...review,packet:{...packet,inventoryMappings:[{inventoryId:'source-q4',targetId:'domain-d',derived:true}]}}])assert.equal(approvedAnswerConflict(e,altered),null);
 assert.equal(approvedAnswerConflict({...e,questionId:'another-question'},review),null);
 issue.message=JSON.stringify({questionId:'source-q5'});assert.equal(approvedAnswerConflict(e,review),null);issue.message=JSON.stringify({questionId:'source-q4'});
 issue.status='pending';assert.equal(approvedAnswerConflict(e,review),null);issue.status='retained';
 fs.writeFileSync(file,'Changed evidence');assert.equal(approvedAnswerConflict(e,review),null);
});

test('page-number-only matches and unresolved answer-book contradictions fail',()=>{
 let e=match();e.teacherReference=[{pdfPage:5}];assert.match(answerMatchingIssues(['q62'],[e],[5]).join(),/exercise and question/);
 e=match();e.matchEvidence='';assert.match(answerMatchingIssues(['q62'],[e],[5,6]).join(),/mathematical content/);
 e=match();e.conflict='Printed strict inequality fails when p=q';assert.match(answerMatchingIssues(['q62'],[e],[5,6]).join(),/unresolved answer match/);
});
