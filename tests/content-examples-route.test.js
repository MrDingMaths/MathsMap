import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { examplesCandidate, examplesOf, validateCoverage, validateExampleReview, inspectionRequirements, renderInspectionRequirements, acquireExamplesLock, withExamplesWorker, publishExamples, runExamplesSkill, recordExamplesInspection, materializeExampleTemplates, retainedSurveySource, normaliseExampleDelimiters, bindVisualIndices, bindSolidReviewHashes, solidReviewProblems } from '../scripts/content/examples-route.mjs';
import { renderMath } from '../src/lib/render-math.js';
import { hashValue } from '../scripts/content/campaign-support.mjs';
import {individualExampleReviewValid,repairPreservationProblems,questionEquationLines} from '../scripts/content/examples-route.mjs';

test('question equation line repair inserts only newlines and retains independent math spans and prose',()=>{
  const question='Describe the transformation from $y=\\frac{1}{x}$ to $y=\\frac{1}{x+2}$. Point $A$ stays labelled.';
  const repaired=questionEquationLines(question);
  assert.equal(repaired.replaceAll('\n',''),question);
  assert.ok(repaired.includes('\n$y=\\frac{1}{x}$\n'));
  assert.ok(repaired.includes('Point $A$ stays labelled.'));
  assert.equal(questionEquationLines(repaired),repaired);
  assert.throws(()=>questionEquationLines('[tikz]$x=2$[/tikz]'));
  assert.throws(()=>questionEquationLines('$$x=2$$'));
});

test('partial coverage preserves valid individual reviews and repairs cannot discard useful staged examples',()=>{
  const row={index:2,sourceConfirmed:true,methodConfirmed:true,scopeConfirmed:true,calculationsConfirmed:true,answerConfirmed:true,diagramConsistencyConfirmed:true,derivation:'Independently computed 3+4=7.'};
  assert.equal(individualExampleReviewValid(row,2),true);
  assert.equal(individualExampleReviewValid({...row,scopeConfirmed:false},2),false);
  assert.equal(individualExampleReviewValid(row,1),false);
  assert.equal(repairPreservationProblems({examples:[1,2,3]},{examples:[4]}).length,1);
  assert.deepEqual(repairPreservationProblems({examples:[1,2,3]},{examples:[1,2,3,4]}),[]);
});

const old={question_text:'Calculate $2+3$.',solution_text:'$2+3$\n$=5$',extension:{keep:true}};
const baseline={content:{skillId:'x',theory:{text:'keep',workedExample:old},practice:{foundation:[{question_text:'$3+4$'}]}},quiz:{questions:[{id:'q1',question_text:'$4+5$'}]}};
const coverage={examples:[old],methods:[{id:'add',description:'add numbers',sourceRef:'booklet line 1'}],assessmentMappings:[{where:'practice.foundation[0]',methodIds:['add']},{where:'quiz.q1',methodIds:['add']}],exampleMappings:[{index:0,methodIds:['add'],sourceRef:'booklet line 1'}],existingExamples:[{index:0,finalIndex:0,decision:'kept',reason:'useful',guttersChecked:true,diagramAdequacyChecked:true,annotationChecked:true}]};

test('source-bound solid review recovers only a unique omitted hash character without waiving geometry defects',()=>{
  const hash=hashValue('reviewed diagram'),copied=hash.slice(0,19)+hash.slice(20);
  const check={sourceHash:hash,status:'review'}, row={sourceHash:copied,status:'accepted',solid3d:false,reason:'Planar net',geometryObservation:'Congruent bases and matching rectangles',visibilityObservation:'Flat net; no hidden edges'};
  const original={solidReviews:[row]},bound=bindSolidReviewHashes([check],original);
  assert.equal(bound.solidReviews[0].sourceHash,hash);assert.equal(bound.solidReviews[0].copiedSourceHash,copied);assert.equal(original.solidReviews[0].sourceHash,copied);
  assert.deepEqual(solidReviewProblems([check],bound),[]);
  const indexed=bindSolidReviewHashes([check],{solidReviews:[{...row,sourceHash:undefined,checkIndex:0}]});
  assert.equal(indexed.solidReviews[0].sourceHash,hash);
  assert.deepEqual(solidReviewProblems([check],indexed),[]);
  for(const invalid of [{...row,checkIndex:0},{...row,sourceHash:undefined,checkIndex:2},{...row,sourceHash:undefined,checkIndex:0.5}])assert.equal(bindSolidReviewHashes([check],{solidReviews:[invalid]}).solidReviews[0].sourceHash,null);
  const duplicate=bindSolidReviewHashes([check],{solidReviews:[{...row,sourceHash:undefined,checkIndex:0},{...row,sourceHash:undefined,checkIndex:0}]});
  assert.ok(duplicate.solidReviews.every(row=>row.sourceHash===null));
  assert.match(solidReviewProblems([{...check,status:'defect'}],bound).join(),/cannot be waived/);
  const ambiguous='a'.repeat(63),ambiguousReview={solidReviews:[{...row,sourceHash:ambiguous}]};
  assert.equal(bindSolidReviewHashes([{sourceHash:ambiguous+'b'},{sourceHash:'b'+ambiguous}],ambiguousReview).solidReviews[0].sourceHash,ambiguous);
  for(const invalid of [hashValue('different diagram'),copied.slice(1)])assert.equal(bindSolidReviewHashes([check],{solidReviews:[{...row,sourceHash:invalid}]}).solidReviews[0].sourceHash,invalid);
});

test('legacy conversion preserves question/solution, extensions and immutable fields',()=>{
  const next=examplesCandidate(baseline,[old]);assert.equal(next.content.theory.workedExample,undefined);assert.deepEqual(next.content.theory.workedExamples,[old]);assert.deepEqual(next.content.practice,baseline.content.practice);assert.deepEqual(next.quiz,baseline.quiz);assert.equal(next.content.theory.text,'keep');assert.deepEqual(examplesOf(baseline.content),[old]);
  assert.throws(()=>examplesCandidate(baseline,[{solution_text:'5'}]),/separate editable/);
});
test('every actual assessment maps once to assessed distinct methods and every method has example coverage',()=>{
  assert.deepEqual(validateCoverage(coverage,baseline),[]);
  assert.match(validateCoverage({...coverage,assessmentMappings:[coverage.assessmentMappings[0]]},baseline).join(),/quiz.q1/);
  assert.match(validateCoverage({...coverage,assessmentMappings:[...coverage.assessmentMappings,{where:'quiz.fake',methodIds:['add']}]},baseline).join(),/Unknown/);
  assert.match(validateCoverage({...coverage,methods:[...coverage.methods,{id:'extra',description:'unassessed',sourceRef:'booklet'}]},baseline).join(),/not assessed/);
  assert.match(validateCoverage({...coverage,exampleMappings:[...coverage.exampleMappings,...coverage.exampleMappings]},baseline).join(),/unique/);
});
test('review needs independent own derivation and all source/maths/diagram confirmations',()=>{
  const row={index:0,sourceConfirmed:true,methodConfirmed:true,scopeConfirmed:true,calculationsConfirmed:true,answerConfirmed:true,diagramConsistencyConfirmed:true,derivation:'2 plus 3 equals 5'};
  const review={coverageComplete:true,distinctMethodsConfirmed:true,existingExamplesAudited:true,examples:[row],findings:[]};
  assert.deepEqual(validateExampleReview(review,baseline,[0]),[]);
  assert.match(validateExampleReview({...review,examples:[{...row,calculationsConfirmed:false}]},baseline,[0]).join(),/incomplete/);
  assert.match(validateExampleReview({...review,existingExamplesAudited:false},baseline,[0]).join(),/retained/);
});
test('useful supplementary existing examples stay covered; shared templates separate question givens from solution annotations',()=>{
  const supplementary={...coverage,methods:[...coverage.methods,{id:'extra',description:'Useful earlier method',sourceRef:'booklet line 2'}],exampleMappings:[{...coverage.exampleMappings[0],methodIds:['add','extra']}]};
  assert.deepEqual(validateCoverage(supplementary,baseline),[]);
  const expanded=materializeExampleTemplates({examples:[{question_text:'[[template:given]]',solution_text:'[[template:answer]]'}],templateRequests:[{id:'given',parameters:{family:'number-line',min:0,max:5,step:1,points:[{value:2,label:'P'}]}},{id:'answer',parameters:{family:'number-line',min:0,max:5,step:1,jumps:[{from:2,to:4,label:'+2'}]}}]});
  assert.match(expanded.examples[0].question_text,/\[tikz\]/);
  assert.doesNotMatch(expanded.examples[0].question_text,/\+2/);
  assert.match(expanded.examples[0].solution_text,/\+2/);
  assert.equal(expanded.templateRequests,undefined);
  assert.deepEqual(materializeExampleTemplates(expanded),expanded);
  assert.throws(()=>materializeExampleTemplates({examples:[old],templateRequests:[{id:'unused',parameters:{family:'blank-grid',rows:2,cols:2}}]}),/Unused/);
  assert.deepEqual(retainedSurveySource('.', 'missing'),[]);
});

test('reorder preserves unchanged reviews; changed diagram content demands inspection',()=>{
  const two={question_text:'next',solution_text:'answer'};
  const before=examplesCandidate(baseline,[old,two]);assert.deepEqual(inspectionRequirements(before,examplesCandidate(baseline,[two,old])),[]);
  const next=examplesCandidate(baseline,[{...old,solution_text:'[tikz]\\draw (0,0)--(1,0);[/tikz]'}]);const rows=inspectionRequirements(baseline,next);assert.equal(rows.length,1);assert.ok(rows[0].diagramHash);
});
test('native-table rendering receives scoped inspection while unchanged mathematics retains its review',()=>{
  const table={question_text:'| Time | 0 | 1 |\n|---|---|---|\n| Velocity | 2 | 3 |',solution_text:'$A=2.5$'};
  const pair=examplesCandidate(baseline,[table]);assert.deepEqual(inspectionRequirements(pair,pair),[]);
  const required=renderInspectionRequirements(pair,pair);assert.equal(required.length,1);assert.equal(required[0].index,0);assert.equal(required[0].exampleHash,hashValue(table));assert.match(required[0].scope,/unchanged mathematics/);
});
test('delimiter formatting preserves actual mathematical rendering and never rewrites TikZ dollars',()=>{
  const original={examples:[{question_text:'Find $x$.',solution_text:'Working.\n$$\\begin{align*}x&=3+4\\\\&=7\\end{align*}$$\n[tikz]\\node {$$do not edit$$};[/tikz]'}]};
  const normalized=normaliseExampleDelimiters(original);
  assert.equal(renderMath(original.examples[0].solution_text),renderMath(normalized.examples[0].solution_text));
  assert.match(normalized.examples[0].solution_text,/\[tikz\]\\node \{\$\$do not edit\$\$\}/);
  assert.doesNotMatch(normalized.examples[0].solution_text.split('[tikz]')[0],/\$\$/);
  assert.deepEqual(normaliseExampleDelimiters(normalized),normalized);
});
test('cross-process lock permits one dispatcher and exactly five shared model slots',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'examples-pool-'));const releases=[];
  try{const dispatch=acquireExamplesLock(root,'test');assert.throws(()=>acquireExamplesLock(root,'test'),/already active/);dispatch();
    for(let i=0;i<5;i++)releases.push(acquireExamplesLock(root,'test','worker-'+i));
    await assert.rejects(withExamplesWorker(root,'test',async()=>true),/five-worker/);
    releases.pop()();assert.equal(await withExamplesWorker(root,'test',async()=>42),42);
  }finally{for(const release of releases)release();fs.rmSync(root,{recursive:true,force:true});}
});
test('deliberate survey hold refuses publication even without records',async()=>{
  await assert.rejects(publishExamples('.', {skillId:'survey-bias-ethics'}),/publication hold/);
});
test('visual hashes bind mechanically only to unique actually inspected indices',()=>{
  const required=[{index:2,exampleHash:'exact-example',diagramHash:'exact-diagram'}];
  assert.deepEqual(bindVisualIndices({examples:[{index:2,exampleHash:'truncated',renderedConfirmed:true,diagramInspected:true}]},required),[{index:2,exampleHash:'exact-example',diagramHash:'exact-diagram',renderedConfirmed:true,diagramInspected:true}]);
  assert.throws(()=>bindVisualIndices({examples:[{index:2,renderedConfirmed:true}]},required),/actual visual/);
  assert.throws(()=>bindVisualIndices({examples:[{index:3,renderedConfirmed:true,diagramInspected:true}]},required),/unknown/);
  assert.throws(()=>bindVisualIndices({examples:[{index:2},{index:2}]},required),/duplicate/);
});
test('interrupted run reuses completed calls, scopes visual inspection and refuses stale source/baseline',async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'examples-resume-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));};
  write('data/courses.json',[{id:'s4',stage:4,order:1}]);write('data/topics.json',[{id:'t',stage:4,courses:['s4'],order:1}]);write('data/dotpoints.json',[{id:'dp',topicId:'t',text:'Add',order:1}]);write('data/skills.json',[{id:'x',stage:4,title:'x',dotPointIds:['dp'],prereqs:[]}]);
  const card=n=>({question_text:`Calculate $${n}+2$.`,solution_text:`$${n}+2=${n+2}$`,structure:'add'});
  const content={skillId:'x',atomType:'T',theory:{intro:'Add.',facts:['Combine numbers.'],workedExamples:[{question_text:old.question_text,solution_text:old.solution_text}]},practice:{foundation:[3,4,5].map(card),development:[6,7,8].map(card),masteryOmitted:'Routine',coverageNote:'Routine'}};
  const quiz={skillId:'x',coverageNote:'Routine',questions:[3,4,5].map((n,i)=>({...card(n),id:'q'+(i+1),mastery:false,options:[{text:`$${n+2}$`,correct:true},{text:`$${n+1}$`,why:'Added one instead of two.'},{text:`$${n}$`,why:'Did not add the second number.'}]}))};
  write('public/content/x.json',content);write('public/quizzes/x.json',quiz);write('public/content-manifest.json',{content:{x:[3,3,0]},quiz:{x:[3,0]}});
  const source='booklets/mathsmap-sources/Stage 4/Addition.md';write(source,'# Addition\nCalculate $8+3$.\n$8+3=11$');write('booklets/provenance/content-campaign/test/campaign.json',{skillIds:['x']});write('booklets/provenance/content-campaign/test/skills/x.json',{scope:{stage:4},sources:[{path:source}]});
  const example={...content.theory.workedExamples[0],solution_text:'$\\mathrel{\\phantom{=}}2+3$\n$=5$',equationAlignment:{mode:'continuation'}};
  const authored={...coverage,examples:[example],methods:[{id:'add',description:'add numbers',sourceRef:source+' line 2'}],exampleMappings:[{index:0,methodIds:['add'],sourceRef:source+' line 2'}],existingExamples:[{...coverage.existingExamples[0],decision:'formatting'}],assessmentMappings:[...['foundation','development'].flatMap(tier=>content.practice[tier].map((_,i)=>({where:`practice.${tier}[${i}]`,methodIds:['add']}))),...quiz.questions.map(row=>({where:'quiz.'+row.id,methodIds:['add']}))]};
  const review={coverageComplete:true,distinctMethodsConfirmed:true,existingExamplesAudited:true,findings:[],examples:[{index:0,sourceConfirmed:true,methodConfirmed:true,scopeConfirmed:true,calculationsConfirmed:true,answerConfirmed:true,diagramConsistencyConfirmed:true,derivation:'2 plus 3 is 5'}]};
  const seen=[];let fail=true;
  const model=async({name})=>{seen.push(name);if(name==='review'&&fail){fail=false;throw new Error('interrupt');}return {result:['author','repair'].includes(name)?authored:name==='visual-review'?{accepted:true,reviewer:'independent visual',findings:[],examples:[{index:0,exampleHash:hashValue(example),renderedConfirmed:true}]}:review,call:{name,seconds:1}};};
  await assert.rejects(runExamplesSkill(root,{campaignId:'test',skillId:'x',model}),/interrupt/);
  const capture=async()=>{write('render.png','rendered');return {candidateHash:hashValue({content:{...content,theory:{...content.theory,workedExamples:[example]}},quiz}),passed:true,errors:[],dependencies:[],artifacts:[{path:'render.png',hash:hashValue(fs.readFileSync(path.join(root,'render.png')))}]};};
  const interruptedCapture=await runExamplesSkill(root,{campaignId:'test',skillId:'x',model,capture:async()=>{throw Error('capture interrupted');}});
  assert.equal(interruptedCapture.status,'render-needs-attention');assert.match(interruptedCapture.findings[0].error,/capture interrupted/);
  const completedMathCalls=seen.filter(name=>name==='review').length;
  const record=await runExamplesSkill(root,{campaignId:'test',skillId:'x',model,capture});assert.equal(record.status,'accepted',JSON.stringify(record.findings));assert.equal(seen.filter(name=>name==='author').length,1);assert.equal(seen.filter(name=>name==='review').length,completedMathCalls);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'public/quizzes/x.json'))),quiz);
  const stagedPath='booklets/provenance/content-campaign/test/examples/x.json';
  write('renderer.js','old renderer');const oldDependencies=[{path:'renderer.js',hash:hashValue('old renderer')}];
  write(stagedPath,{...record,render:{...record.render,dependencies:oldDependencies},inspection:{...record.inspection,dependencies:oldDependencies}});
  write('renderer.js','new renderer');
  const refreshed=await runExamplesSkill(root,{campaignId:'test',skillId:'x',model,capture:async()=>({...await capture(),dependencies:[{path:'renderer.js',hash:hashValue('new renderer')} ]})});
  assert.equal(refreshed.status,'accepted');assert.equal(seen.filter(name=>name==='review').length,completedMathCalls,'renderer changes must not repeat accepted mathematics');
  assert.equal(refreshed.inspection.dependencies[0].hash,hashValue('new renderer'));
  write('bad-inspection.json',{...record.inspection,accepted:false});assert.throws(()=>recordExamplesInspection(root,{campaignId:'test',skillId:'x',evidenceFile:path.join(root,'bad-inspection.json')}),/accepted inspection/);
  write('unrelated.png','unrelated');write('bad-inspection.json',{...record.inspection,evidence:[{path:'unrelated.png',hash:hashValue(fs.readFileSync(path.join(root,'unrelated.png')))}]});assert.throws(()=>recordExamplesInspection(root,{campaignId:'test',skillId:'x',evidenceFile:path.join(root,'bad-inspection.json')}),/exactly current rendered/);
  write(source,'changed source');await assert.rejects(publishExamples(root,{campaignId:'test',skillId:'x'}),/Source changed/);
  write(source,'# Addition\nCalculate $8+3$.\n$8+3=11$');write('public/content/x.json',{...content,other:'concurrent'});await assert.rejects(publishExamples(root,{campaignId:'test',skillId:'x'}),/Stale live baseline/);
  write('public/content/x.json',content);
  const published = await publishExamples(root,{campaignId:'test',skillId:'x'});
  const savedRecord = 'booklets/provenance/content-campaign/test/examples/x.json';
  write(savedRecord,{...published,status:'publishing',published:undefined});
  const recovered = await runExamplesSkill(root,{campaignId:'test',skillId:'x',model:async()=>{throw new Error('Completed calls must not repeat');}});
  assert.equal(recovered.status,'published');
  assert.equal(recovered.published.recovered,true);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'public/quizzes/x.json'))),quiz);
  const later={...authored,examples:[{...example,solution_text:example.solution_text+'\nCombine the two quantities.'}],existingExamples:[{...authored.existingExamples[0],decision:'repaired'}]};
  const scopedModel=async({name})=>({result:name.includes('diagnosed-repair')?later:name.includes('visual-review')?{accepted:true,reviewer:'independent visual',findings:[],examples:[{index:0,renderedConfirmed:true}]}:review,call:{name,seconds:1}});
  const scopedCapture=async({candidatePair})=>({...await capture(),candidateHash:hashValue(candidatePair)});
  const repaired=await runExamplesSkill(root,{campaignId:'test',skillId:'x',model:scopedModel,capture:scopedCapture,repair:true,finding:'Add the missing explanatory sentence only.',publish:true});
  assert.equal(repaired.status,'published');assert.ok(repaired.originalBaselinePath);assert.equal(repaired.publicationHistory.length,1);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'public/quizzes/x.json'))),quiz);
  const reinspected=await runExamplesSkill(root,{campaignId:'test',skillId:'x',capture:scopedCapture,reinspect:true,model:async({name})=>{assert.match(name,/visual-review/);return scopedModel({name});}});
  assert.equal(reinspected.status,'published');
  const beforeUnapproved=fs.readFileSync(path.join(root,'public/content/x.json'),'utf8');
  const unapproved={...later,sourceException:{syllabusPath:'syllabus/Invented.md'},methods:later.methods.map(row=>({...row,sourceRef:'syllabus/Invented.md line 1'})),exampleMappings:later.exampleMappings.map(row=>({...row,sourceRef:'syllabus/Invented.md line 1'}))};
  const blocked=await runExamplesSkill(root,{campaignId:'test',skillId:'x',repair:true,finding:'Test rejection of an unapproved source substitution.',publish:true,capture:scopedCapture,model:async({name})=>({result:name.includes('repair')?unapproved:review,call:{name,seconds:1}})});
  assert.equal(blocked.status,'needs-attention');assert.match(blocked.findings.join(' '),/supplied source/);assert.equal(blocked.sourceException,null);
  assert.equal(fs.readFileSync(path.join(root,'public/content/x.json'),'utf8'),beforeUnapproved);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'public/quizzes/x.json'))),quiz);
});
