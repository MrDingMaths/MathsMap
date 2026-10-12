import test from 'node:test';
import assert from 'node:assert/strict';
import {questionDependencyFindings,assertBankQuestionDependencies,dependencySignature} from '../src/lib/booklet-question-dependencies.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {supersedeBankQuestion} from '../scripts/booklet/supersede-bank-question.mjs';
import {normaliseQuestion,makeBankManifest} from '../src/lib/practice-question-model.js';
import {revisionHash} from '../scripts/booklet/bank-sync.mjs';
import {createEditableProject,createProjectBlock} from '../src/lib/editable-booklet-model.js';
import {saveBookletProject,promoteProjectQuestion} from '../scripts/booklet/project-studio-server.mjs';
const block=(id,prompt,extra={})=>({id,type:'question',content:{id:id+'-root',type:'question',prompt,children:[]},...extra});
const project=(...blocks)=>({id:'test',sections:[{id:'practice',phase:'practice',blocks}]});
test('preflight detects previous-question givens and numbered references, excluding answers and comments',()=>{
 const p=project(block('a','Draw the graph.'),block('b','Use the graph in the previous question.'),block('c','Check your answers to Q1.'));
 assert.equal(questionDependencyFindings(p).length,2);assert.throws(()=>assertBankQuestionDependencies(p),/dependency review required/);
 p.sections[0].blocks[1].content.prompt='Find the intersection of the supplied lines.';p.sections[0].blocks.pop();
 p.sections[0].blocks[1].content.answer={worked:'Use the previous question.'};p.studio={flags:[{note:'Use Q1.'}]};assert.doesNotThrow(()=>assertBankQuestionDependencies(p));
});
test('an explicit substantive review is invalidated by content changes',()=>{
 const b=block('b','Use a similar method to the previous question to solve $x+3=7$.');
 b.sourceReview={bankDependencyReview:{decision:'self-contained',signature:dependencySignature(b),note:'Only the method is referenced; the equation and complete givens are supplied here.'}};
 assert.doesNotThrow(()=>assertBankQuestionDependencies(project(b)));b.content.prompt+=' Explain your answer.';assert.throws(()=>assertBankQuestionDependencies(project(b)),/dependency review required/);
});
test('internal part dependencies pass, unresolved external node dependencies cannot be waived',()=>{
 const b=block('b','Solve the problem.');b.content.children=[{id:'a',prompt:'Find x.'},{id:'c',prompt:'Use part a.',dependsOn:['a']}];assert.doesNotThrow(()=>assertBankQuestionDependencies(project(b)));
 b.content.children[1].dependsOn=['outside'];b.sourceReview={bankDependencyReview:{decision:'self-contained',signature:dependencySignature(b),note:'This deliberately insufficient review cannot waive a missing external node.'}};
 assert.throws(()=>assertBankQuestionDependencies(project(b)),/external dependency outside/);
});
test('maths and diagram source names do not produce numbered-question references; selection preserves accepted links',()=>{
 const p=project(block('a','Compare $Q_1$ and $Q_2$. [tikz]% source p27-q1 \\node {$Q1$};[/tikz]'),block('b','Use Q1.'));
 assert.equal(questionDependencyFindings(p).length,1);assert.doesNotThrow(()=>assertBankQuestionDependencies(p,{blockIds:['a']}));
});
test('individual promotion refuses a dependent question before creating any bank record',async t=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'dependency-promotion-'));t.after(()=>fs.rm(temp,{recursive:true,force:true}));
 const options={projectRoot:path.join(temp,'projects'),bankRoot:path.join(temp,'bank'),moduleRoot:path.join(temp,'modules')};await fs.mkdir(options.bankRoot,{recursive:true});
 const p=createEditableProject({id:'dependent',title:'Dependent'}),b=createProjectBlock('question');b.id='follow-up';b.content.prompt='Use the graph in the previous question.';p.sections[0].phase='practice';p.sections[0].blocks=[b];
 await saveBookletProject(p,{...options,create:true});
 await assert.rejects(promoteProjectQuestion(p.id,{mode:'create',blockId:b.id},options),/dependency review required/);
 assert.deepEqual(await fs.readdir(options.bankRoot),[]);
});
test('supersession retains old content and revisions, excludes absorbed records and checks stale or still-live links',async t=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'dependency-supersession-'));t.after(()=>fs.rm(temp,{recursive:true,force:true}));
 const options={projectRoot:path.join(temp,'projects'),bankRoot:path.join(temp,'bank')};await fs.mkdir(options.projectRoot,{recursive:true});await fs.mkdir(path.join(options.bankRoot,'.sync'),{recursive:true});
 const old=normaliseQuestion({id:'q-old',status:'approved',content:{id:'old-root',prompt:'Follow-up',answer:{short:'Yes',worked:'Yes'}}}),next=normaliseQuestion({id:'q-next',status:'approved',content:{id:'next-root',prompt:'Complete question'}});
 const write=(file,v)=>fs.writeFile(file,JSON.stringify(v));await write(path.join(options.bankRoot,'q-old.json'),old);await write(path.join(options.bankRoot,'q-next.json'),next);await write(path.join(options.bankRoot,'manifest.json'),makeBankManifest([old,next]));await write(path.join(options.bankRoot,'.sync','links.json'),{'q-old':{projectId:'owner',blockId:'old'},'q-next':{projectId:'owner',blockId:'next'}});
 const projectFile=path.join(options.projectRoot,'owner.json');await write(projectFile,{sections:[{blocks:[{id:'old',bankRef:{id:'q-old'}},{id:'next',bankRef:{id:'q-next'}}]}]});
 const args={id:'q-old',expectedRevision:revisionHash(old),replacementBankId:'q-next',projectId:'owner',blockId:'old',replacementBlockId:'next'};
 await assert.rejects(supersedeBankQuestion(args,options),/still linked/);
 await write(projectFile,{sections:[{blocks:[{id:'next',bankRef:{id:'q-next'}}]}]});
 await assert.rejects(supersedeBankQuestion({...args,expectedRevision:'stale'},options),/changed/);
 await supersedeBankQuestion(args,options);
 const saved=JSON.parse(await fs.readFile(path.join(options.bankRoot,'q-old.json')));assert.equal(saved.status,'draft');assert.deepEqual(saved.content,old.content);assert.equal(saved.review.history.at(-1).replacementBankId,'q-next');
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(options.bankRoot,'.revisions','q-old',revisionHash(old)+'.json'))),old);
 const manifest=JSON.parse(await fs.readFile(path.join(options.bankRoot,'manifest.json')));assert(!manifest.questions.some(q=>q.id==='q-old'));assert(manifest.questions.some(q=>q.id==='q-next'));
 assert.equal((await supersedeBankQuestion(args,options)).reused,true);
});
