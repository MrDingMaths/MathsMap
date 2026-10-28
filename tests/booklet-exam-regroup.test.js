import test from 'node:test';
import assert from 'node:assert/strict';
import {existingExamCandidate,sourceFromBookletTitle} from '../scripts/booklet/regroup-exam-sections.mjs';
const courses=[{id:'s6-ext1-11',stage:6}],options={courses};
const question=(id,title,extra={})=>({id,type:'question',title,content:{id:id+'-root',type:'question',prompt:'Find $x$.',answer:{short:'2',worked:'x=2'}},bankRef:{id:'bank-'+id,revision:'pinned'},classification:{reasoningScore:65},...extra});
const project=sections=>({id:'p',title:'Teaching book',revision:7,library:{category:'master',courseId:'s6-ext1-11'},topics:[{id:'t',title:'Teaching'},{id:'mixed',title:'Mixed review'},{id:'challenge',title:'Challenge exercise'},{id:'exam',title:'Exam questions'}],sections,studio:{flags:{q:{at:'2026-10-28',comments:[{text:'Keep'}]}}},source:{runId:'accepted'}});
test('explicit candidate moves existing IDs only and retains bank refs, flags, content and source lineage',()=>{
 const original=project([{id:'challenge',topicId:'challenge',phase:'practice',role:'mixed-practice',blocks:[question('hard','')]},{id:'s',topicId:'t',phase:'practice',role:'mixed-practice',blocks:[question('q','2022 HSC Extension 1 Band 5'),question('plain','')]},{id:'mixed',topicId:'mixed',phase:'practice',role:'mixed-practice',blocks:[]}]);
 const before=structuredClone(original),{project:next,report}=existingExamCandidate(original,options);
 assert.deepEqual(original,before);
 assert.deepEqual(next.sections.map(s=>s.id),['s','mixed','p-exam-questions','challenge']);
 const moved=next.sections.find(s=>s.role==='exam').blocks[0];
 assert.deepEqual(moved.content,before.sections[1].blocks[0].content);assert.deepEqual(moved.bankRef,before.sections[1].blocks[0].bankRef);
 assert.equal(moved.source.label,'HSC Extension 1 2022');assert.equal(moved.classification.reasoningScore,65);
 assert.deepEqual(next.studio,before.studio);assert.deepEqual(next.source,before.source);
 assert.equal(report.moved.length,1);assert.equal(next.sections.at(-1).role,'challenge');
});
test('linked unlabelled follow-ups and meaningful instruction units are held whole',()=>{
 for(const blocks of [[question('q','2022 HSC Advanced'),question('follow','',{flow:{dependsOn:['q']}})],[{id:'instruction',type:'rich-text',content:'Use the following result.'},question('q','2022 HSC Advanced')]]){
  const result=existingExamCandidate(project([{id:'s',topicId:'t',phase:'practice',blocks}]),options);
  assert.equal(result.project,null);assert.equal(result.report.status,'held');assert.equal(result.report.held.length,1);
 }
});
test('explicit Exam topic retains all section instructions and undated sample attribution',()=>{
 const original=project([{id:'s',topicId:'exam',phase:'practice',role:'mixed-practice',blocks:[{id:'instruction',type:'rich-text',content:'Answer every question.'},question('q','HSC Sample Question Advanced Band 3')]}]);
 const result=existingExamCandidate(original,options);
 assert.equal(result.project.sections[0].id,'s');assert.equal(result.project.sections[0].blocks[0].content,'Answer every question.');
 assert.equal(result.project.sections[0].blocks[1].source.label,'HSC Sample Question Advanced');assert.equal('year' in result.project.sections[0].blocks[1].source,false);
 assert.equal(result.project.sections[0].workingSpace,'none');
});
test('class copies, imports, exemplars, archives and unknown source providers are excluded',()=>{
 for(const patch of [{library:{category:'class',courseId:'s6-ext1-11'}},{library:{category:'import-review',courseId:'s6-ext1-11'}},{title:'Exam Exemplar'},{exemplar:true},{library:{category:'master',courseId:'s6-ext1-11',archivedAt:'2026-10-28'}}])assert.equal(existingExamCandidate({...project([]),...patch},options).report.status,'excluded');
 assert.equal(sourceFromBookletTitle({source:{provider:'CAIE',label:'CAIE 2020'}}),null);
 assert.deepEqual(sourceFromBookletTitle({title:'HSC Sample Question Band 3'}),{provider:'HSC',label:'HSC Sample Question',origin:'booklet'});
 const ambiguous=existingExamCandidate(project([{id:'s',topicId:'t',phase:'practice',blocks:[question('q','HSC Question')]}]),options);
 assert.equal(ambiguous.project,null);assert.equal(ambiguous.report.status,'held');assert.equal(ambiguous.report.held[0].id,'q');
});

test('legacy Exam Practice is an existing end section; ambiguous attribution still holds it whole',()=>{
 const original=project([{id:'legacy',title:'Exam Practice',phase:'practice',blocks:[question('sample','HSC Sample Question Band 4')]}]);
 const result=existingExamCandidate(original,options);
 assert.deepEqual(result.report.moved,[]);
 assert.equal(result.project.sections[0].role,'exam');
 assert.equal(result.project.sections[0].workingSpace,'none');
 assert.equal(result.project.sections[0].blocks[0].source.label,'HSC Sample Question');
 const ambiguous=structuredClone(original);ambiguous.sections[0].blocks.push(question('unknown','Unknown paper'));
 assert.equal(existingExamCandidate(ambiguous,options).project,null);
 const teaching=project([{...original.sections[0],title:'Worked examples',blocks:[question('plain','')]}]);
 assert.equal(existingExamCandidate(teaching,options).project,null);
});

test('matching native source heading stays printed once; mismatched lineage remains held',()=>{
 const q=question('q','2011 HSC Advanced',{source:{provider:'HSC',paper:'Advanced',year:'2011',origin:'booklet'},content:{id:'root',type:'question',prompt:'**2011 HSC Advanced**'}});
 const original=project([{id:'s',topicId:'exam',role:'exam',workingSpace:'none',phase:'practice',blocks:[q]}]);
 assert.equal(existingExamCandidate(original,options).report.status,'unchanged');
 const mismatch=structuredClone(original);mismatch.sections[0].blocks[0].source.year='2012';
 assert.equal(existingExamCandidate(mismatch,options).report.status,'held');
});
