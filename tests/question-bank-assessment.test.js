import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {normaliseQuestion,makeBankManifest,filterQuestionBank} from '../src/lib/practice-question-model.js';
import {isTheoryReview} from '../src/lib/question-bank-eligibility.js';
import {assessedClassification} from './fixtures/linear-assessment.mjs';
import {createEditableProject,createProjectBlock} from '../src/lib/editable-booklet-model.js';
import {createBookletProject,promoteProjectQuestion,promoteProjectModule,saveBookletProject} from '../scripts/booklet/project-studio-server.mjs';
import {mathsMapCandidates} from '../scripts/booklet/assembly-bank.mjs';
import {registerOwner,revisionHash} from '../scripts/booklet/bank-sync.mjs';

const question=()=>normaliseQuestion({id:'q-test',status:'approved',classification:{primarySkillId:'pattern-to-equation',secondarySkillIds:['equations-from-formulas'],reasoningScore:37},content:{id:'root',type:'question',prompt:'Find the pattern rule.',answer:{short:'y=3x+1',worked:'Each new term adds 3.'}}});

test('theory review identity survives normalization and is excluded from practice selection',()=>{
 const review=normaliseQuestion({...question(),sourceAtom:{kind:'review'}});
 assert.equal(review.libraryRole,'theory-review');
 assert.equal(normaliseQuestion(review).libraryRole,'theory-review');
 assert.equal(makeBankManifest([review]).questions.length,0);
 assert.equal(filterQuestionBank([review],{}).length,0);
 assert.equal(makeBankManifest([question()]).questions.length,1);
 assert.ok(isTheoryReview({}, {role:'review'}));
 assert.equal(isTheoryReview({pedagogyRole:'guided-practice',reviewFlags:['diagram']}),false);
});

test('pattern classification removes incidental equations tags but keeps explicit algebra comparisons',()=>{
 const q=question();q.classification.primarySkillId='equations-from-formulas';q.classification.secondarySkillIds=['pattern-to-equation','apply-pattern-equation'];
 const pattern=assessedClassification(q,'page-53-b1');
 assert.equal(pattern.primarySkillId,'pattern-to-equation');
 assert.equal(pattern.secondarySkillIds.includes('equations-from-formulas'),false);
 assert.match(pattern.difficultyReason,/forward prediction/);
 assert.equal(assessedClassification(q,'page-82-q1').primarySkillId,'equations-from-formulas');
 assert.equal(assessedClassification(q,'page-51-q1').primarySkillId,'apply-pattern-equation');
 assert.throws(()=>assessedClassification(q,'unassessed-question'),/Missing individual assessment/);
 assert.equal(q.classification.primarySkillId,'equations-from-formulas');
});

test('theory reviews stay in modules and sync without reappearing as assembly candidates',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'bank-assessment-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const options={projectRoot:path.join(root,'booklets/projects'),bankRoot:path.join(root,'booklets/question-bank'),moduleRoot:path.join(root,'booklets/module-bank')};
 let p=createEditableProject({id:'original',title:'Theory'});const b=createProjectBlock('question');
 b.id='review-with-ordinary-id';b.sourceAtom={kind:'review'};b.classification=question().classification;b.content=question().content;
 p.sections[0].blocks=[b];p=await createBookletProject(p,options);
 await assert.rejects(()=>promoteProjectQuestion(p.id,{blockId:b.id,mode:'create'},options),/Review questions belong to theory/);
 const {module}=await promoteProjectModule(p.id,{sectionId:p.sections[0].id,id:'theory-module'},options);
 assert.equal(module.sequence[0].type,'content-block');assert.equal(module.sequence[0].block.libraryRole,'theory-review');
 assert.equal(module.sequence[0].block.content.prompt,b.content.prompt);
 // Existing links are retained and continue to sync their content, but not their visibility.
 const bank=normaliseQuestion({...question(),libraryRole:'theory-review'}),links={};registerOwner(links,p,b,bank);
 p.sections[0].blocks[0].bankRef={id:bank.id,revision:revisionHash(bank)};
 await fs.mkdir(path.join(options.bankRoot,'.sync'),{recursive:true});
 await fs.writeFile(path.join(options.bankRoot,bank.id+'.json'),JSON.stringify(bank));
 await fs.writeFile(path.join(options.bankRoot,'.sync/links.json'),JSON.stringify(links));
 p.sections[0].blocks[0].content.answer.worked='Updated review working.';
 await saveBookletProject(p,{...options,expectedRevision:p.revision});
 const saved=JSON.parse(await fs.readFile(path.join(options.bankRoot,bank.id+'.json'),'utf8'));
 assert.equal(saved.content.answer.worked,'Updated review working.');assert.equal(saved.libraryRole,'theory-review');
 assert.equal(makeBankManifest([saved]).questions.length,0);
 await fs.mkdir(path.join(root,'data'),{recursive:true});await fs.writeFile(path.join(root,'data/skills.json'),'[]');
 assert.deepEqual(await mathsMapCandidates(['pattern-to-equation'],{root}),[]);
});
