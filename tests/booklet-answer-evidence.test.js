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
test('page-number-only matches and unresolved answer-book contradictions fail',()=>{
 let e=match();e.teacherReference=[{pdfPage:5}];assert.match(answerMatchingIssues(['q62'],[e],[5]).join(),/exercise and question/);
 e=match();e.matchEvidence='';assert.match(answerMatchingIssues(['q62'],[e],[5,6]).join(),/mathematical content/);
 e=match();e.conflict='Printed strict inequality fails when p=q';assert.match(answerMatchingIssues(['q62'],[e],[5,6]).join(),/unresolved answer match/);
});
