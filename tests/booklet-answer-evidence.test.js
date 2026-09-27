import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {answerMatchingIssues,approvedAnswerConflict,derivedAnswerDiagramEntries} from '../scripts/booklet/answer-evidence.mjs';
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
