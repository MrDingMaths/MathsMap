import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {EventEmitter} from 'node:events';
import {fileURLToPath} from 'node:url';
import {sequences,compactBlock,visibleIds,earlierTeaching,skillFacts,sequenceImages,reviewPrompt,contract,findingId,blockHash,runReview,postFindings,reconcile,formatResults,scoreSeeded,commentNote,isStructural,runMap,KINDS,duplicateQuestionCandidates} from '../pedagogy/review.mjs';
import {runAstraTask} from '../scripts/booklet/codex-transcription.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const FIXTURE=path.join(ROOT,'tests','fixtures','pedagogy-seeded.json');
const load=()=>JSON.parse(fs.readFileSync(FIXTURE,'utf8'));
const temp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pedagogy-review-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const payloadOf=prompt=>JSON.parse(prompt.slice(prompt.indexOf('{"booklet"')));
const candidate=(kind,targets,extra={})=>({kind,severity:'high',targets,finding:'Finding about '+targets[0],breakdown:'Students apply a wrong rule.',checked:'Earlier teaching.',assumptions:'',repair:{type:'change-values',proposal:'Use a general example.'},doneWhen:'A general example is shown.',...extra});
// A stub for both passes. `review` maps a sequence id to its raw candidates;
// `challenge` receives the candidate list and returns the second reader's result.
function stubRunner({review={},challenge,calls=[]}={}){
 return async options=>{
  const payload=payloadOf(options.prompt);calls.push({stage:options.stage,effort:options.configuration.effort,runDir:options.runDir,cwd:options.cwd,payload,images:options.images});
  if(options.stage==='pedagogy-review')return {result:review[payload.sequence.id]??{candidates:[]},metrics:{usage:{input_tokens:1},elapsedMs:1}};
  return {result:challenge?challenge(payload.candidates,payload):{findings:payload.candidates.map(row=>({...row,from:[row.id]}))},metrics:{}};
 };
}
// A working copy of the fixture outside booklets/projects, so saves rewrite the file directly.
function workspace(t,mutate){
 const dir=temp(t),project=load();mutate?.(project);
 const projectFile=path.join(dir,'candidate.json');fs.writeFileSync(projectFile,JSON.stringify(project,null,2)+'\n');
 return {dir,projectFile,options:{projectFile,root:ROOT,provenanceDir:path.join(dir,'provenance'),workDir:path.join(dir,'work'),skills:[],library:['Expanding Brackets'],runDir:null,lease:async(_dir,_details,action)=>action()},record:()=>JSON.parse(fs.readFileSync(path.join(dir,'provenance','pedagogy-seeded.json'),'utf8')),project:()=>JSON.parse(fs.readFileSync(projectFile,'utf8'))};
}

test('sequences follow booklet order, keep a recurring topic separate and include practice-only topics',()=>{
 const project=load(),all=sequences(project);
 assert.deepEqual(all.map(sequence=>sequence.id),['negative-index','two-step-equations','percentage-of-quantity','index-with-coefficient','triangular-prism','cylinder-volume']);
 assert.equal(all[0].title,'The negative index');assert.deepEqual(all[0].sections.map(section=>section.phase),['teaching','practice']);
 project.sections.push({id:'mixed',phase:'practice',topicId:'mixed-practice',title:'Exercise',blocks:[{id:'m1',type:'question',content:{id:'m1-root',type:'question',prompt:'Solve $2x=6$'}}]},{id:'again',phase:'teaching',topicId:'negative-index',title:'More',blocks:[{id:'again-note',type:'rich-text',content:'A note.'}]});
 assert.deepEqual(sequences(project).slice(-2).map(sequence=>sequence.id),['mixed-practice','negative-index~2']);
 const again=sequences(project).at(-1);assert.equal(compactBlock(again.sections[0].blocks[0],again.sections[0]).role,'unlabelled');
});

test('duplicate check compares whole tasks across topics, ignoring answers, IDs, numbers and layout',()=>{
 const project=load(),original=project.sections.find(s=>s.phase==='practice').blocks[0];
 const clone=structuredClone(original);clone.id='repeated';
 const remap=v=>{if(Array.isArray(v))v.forEach(remap);else if(v&&typeof v==='object'){if(v.id)v.id='copy-'+v.id;Object.values(v).forEach(remap);}};
 remap(clone.content);clone.content.label='99';original.content.label='1';
 clone.content.answer={short:'Different answer',worked:'Different solution'};clone.content.answerSpaceMm=99;
 project.sections.find(s=>s.phase==='practice'&&s.topicId!==project.sections.find(s=>s.phase==='practice').topicId).blocks.push(clone);
 const matches=duplicateQuestionCandidates(sequences(project));
 assert.equal(matches.length,1);assert.deepEqual(matches[0].targets,[original.id,'repeated']);assert.equal(matches[0].repair.type,'remove-question');assert.equal(isStructural(matches[0]),true);
 assert.equal(duplicateQuestionCandidates(sequences(project),{topics:['cylinder-volume']}).length,0);
 assert.equal(duplicateQuestionCandidates(sequences(project),{topics:['two-step-equations']}).length,1);
 clone.content.children[0].prompt='A different mathematical task';
 assert.deepEqual(duplicateQuestionCandidates(sequences(project)),[]);
});

test('deterministic duplicates enter the existing challenge even when the first reader returns nothing',async t=>{
 const space=workspace(t,p=>{const s=p.sections.find(s=>s.phase==='practice');const q=structuredClone(s.blocks[0]);q.id='duplicate-practice';q.content.id='duplicate-root';s.blocks.push(q);});
 const before=fs.readFileSync(space.projectFile),calls=[];
 const result=await runReview({...space.options,runner:stubRunner({calls})});
 assert.ok(fs.readFileSync(space.projectFile).equals(before));
 assert.equal(calls.filter(c=>c.stage==='pedagogy-challenge').length,1);
 assert.equal(result.findings.length,1);assert.equal(result.findings[0].kind,'duplicate-question');assert.equal(result.holdBeforeFinalExport,true);
 const payload=calls.find(c=>c.stage==='pedagogy-challenge').payload;
 assert.deepEqual(payload.candidates[0].targets,['t1-q1','duplicate-practice']);
 assert.ok(payload.practice.some(q=>q.id==='t1-q1'));assert.ok(payload.practice.some(q=>q.id==='duplicate-practice'));
});

test('challenge can reject purposeful repetition without deleting either question',async t=>{
 const space=workspace(t,p=>{const s=p.sections.find(s=>s.phase==='practice');const q=structuredClone(s.blocks[0]);q.id='retrieval-practice';s.blocks.push(q);});
 const before=fs.readFileSync(space.projectFile);
 const result=await runReview({...space.options,runner:stubRunner({challenge:rows=>({findings:[],dropped:rows.map(row=>({id:row.id,reason:'Explicit delayed retrieval practice.'}))})})});
 assert.deepEqual(result.findings,[]);assert.equal(result.holdBeforeFinalExport,false);assert.ok(fs.readFileSync(space.projectFile).equals(before));
});

test('compaction keeps what a reader needs and drops diagram code and practice worked solutions',()=>{
 const project=load(),all=sequences(project),prism=all[4],example=compactBlock(prism.sections[0].blocks[2],prism.sections[0]);
 const diagram=example.examples[0].questionDiagrams[0];
 assert.equal(diagram.code,undefined);assert.match(diagram.spec.mathematics,/6 cm/);assert.equal(example.role,'example');
 const practice=compactBlock(all[0].sections[1].blocks[0],all[0].sections[1]);
 assert.equal(practice.role,'practice');assert.equal(practice.difficulty,'Foundation');
 assert.deepEqual(Object.keys(practice.content.children[0].answer),['short']);
 const review=compactBlock(all[0].sections[0].blocks[0],all[0].sections[0]);
 assert.ok(review.content.children[0].answer.worked,'teaching responses keep their working');
 const document={id:'d',type:'rich-text',pedagogyRole:'definition',sourceAtom:{id:'atom',label:'Key ideas'},content:{format:'maths-editor-document-v1',version:1,blocks:[{id:'d-p',type:'paragraph',inlines:[{type:'text',text:'Area is length times width.'}]}]}};
 const flat=compactBlock(document,{phase:'teaching'});
 assert.equal(typeof flat.content,'string');assert.match(flat.content,/length times width/);assert.equal(flat.heading,'Key ideas');assert.equal(flat.sourceAtom,undefined);
 const ids=visibleIds(all[1]);assert.equal(ids.get('t2-q1-c'),'t2-q1');assert.equal(ids.get('t2-example-2-entry'),'t2-example-2');assert.equal(ids.has('t1-q1'),false);
});

test('earlier teaching is full for near topics and digested beyond the budget; skills and images are supporting',t=>{
 const project=load(),all=sequences(project);
 const everything=earlierTeaching(all,4);assert.equal(everything.complete,true);assert.deepEqual(everything.full.map(row=>row.topic),['negative-index','two-step-equations','percentage-of-quantity','index-with-coefficient']);
 const tight=earlierTeaching(all,4,{characters:2600});assert.equal(tight.complete,false);assert.deepEqual(tight.full.map(row=>row.topic),['index-with-coefficient']);assert.ok(tight.digests[0].blocks[0].text.length<=220);
 all[1].sections[1].blocks[0].classification={primarySkillId:'two-step',difficulty:'Foundation'};all[0].sections[1].blocks[0].classification.primarySkillId='one-step';
 const facts=skillFacts(all,1,[{id:'two-step',title:'Two-step',stage:4,prereqs:['one-step','integers','unknown']},{id:'one-step',title:'One-step',stage:4,prereqs:[]},{id:'integers',title:'Integers',stage:3,prereqs:[]}]);
 assert.deepEqual(facts[0].prerequisites.map(row=>row.where),['practised earlier in this booklet','lower stage','not seen in this booklet']);
 const dir=temp(t);fs.mkdirSync(path.join(dir,'evidence','pages'),{recursive:true});fs.writeFileSync(path.join(dir,'evidence','pages','page-007.png'),'x');
 all[4].sections[0].sourcePageNumber=7;
 assert.deepEqual(sequenceImages(all[4],dir),{expected:true,files:[path.join(dir,'evidence','pages','page-007.png')]});
 assert.deepEqual(sequenceImages(all[4],null),{expected:true,files:[]});assert.equal(sequenceImages(all[0],dir).expected,false);
});

test('prompts embed the contracts from the doc and the map command sends nothing',()=>{
 const review=contract('review'),challenge=contract('challenge');
 for(const phrase of ['Preserve the author','recognise, recall, choose and calculate','Never cite a difficulty label','notReliablyReviewed','protectedGroups','opening-review','add-review','difficulty-jump','variation-sequence','area of a circle'])assert.ok(review.includes(phrase),phrase);
 assert.match(challenge,/try to disprove each candidate/);assert.match(challenge,/Do not add findings of your own/);
 const project=load(),all=sequences(project),prompt=reviewPrompt({project,all,index:2,skills:[]});
 assert.ok(prompt.startsWith(review));
 const payload=payloadOf(prompt);assert.equal(payload.sequence.id,'percentage-of-quantity');assert.equal(payload.earlierTeachingComplete,true);assert.match(payload.assumptions.delivery,/Teacher-led/);assert.match(payload.assumptions.intendedOutcomes,/percentage of a quantity/);assert.deepEqual(payload.assumptions.otherBooklets,[]);
 assert.ok(reviewPrompt({project,all,index:2,skills:[],library:['Rates']}).includes('"otherBooklets":["Rates"]'));
 const before=fs.readFileSync(FIXTURE);const map=runMap({projectFile:FIXTURE,root:ROOT,skills:[],runDir:null});
 assert.equal(map.sequences.length,6);assert.equal(map.sequences[4].imagesExpected,true);assert.ok(fs.readFileSync(FIXTURE).equals(before));
});

test('review filters candidates, challenges them once and never writes the project',async t=>{
 const space=workspace(t),before=fs.readFileSync(space.projectFile),calls=[];
 const runner=stubRunner({calls,review:{
  'negative-index':{candidates:[candidate('example-choice',['t1-example-a']),candidate('example-choice',['t1-example-b']),candidate('example-choice',['not-an-id']),candidate('example-choice',['t1-guided'],{severity:'medium'}),candidate('made-up-kind',['t1-guided'])],protectedGroups:[{targets:['t1-q1-a','t1-q1-b','missing'],observation:'o',varies:'v',invariant:'i'}]},
  'two-step-equations':{candidates:[candidate('unsupported-transition',['t2-q3'],{repair:{type:'add-teaching',proposal:'Teach brackets first.'}}),candidate('example-choice',['t2-example-2-entry']),candidate('guided-practice',['t2-guided'])],contextQuestions:[{targets:['t2-q4'],question:'Have students formed equations before?'}]},
  'triangular-prism':{candidates:[],notReliablyReviewed:[{targets:['t5-example'],reason:'The diagram was not supplied.'}]}},
  challenge:rows=>({findings:[{...rows[0],from:[rows[0].id,rows[1].id],targets:['t1-example-a','t1-example-b'],severity:'high'},{...rows[2],from:[rows[2].id]}],dropped:[{id:rows[3].id,reason:'Roles are clear in the working.'}]})});
 const result=await runReview({...space.options,runner});
 assert.ok(fs.readFileSync(space.projectFile).equals(before),'the project file is byte-identical');
 assert.deepEqual(calls.filter(call=>call.stage==='pedagogy-review').map(call=>call.effort),Array(6).fill('low'));
 assert.deepEqual(calls.filter(call=>call.stage==='pedagogy-challenge').map(call=>call.effort),['medium']);
 assert.ok(calls.every(call=>!call.cwd.startsWith(ROOT)),'workers start outside the repository');
 const record=space.record(),merged=record.findings.find(finding=>finding.kind==='example-choice');
 assert.equal(record.findings.length,2);assert.deepEqual(merged.targets.map(target=>target.id),['t1-example-a','t1-example-b']);
 assert.equal(merged.id,findingId('example-choice',['t1-example-a','t1-example-b']));assert.equal(merged.targets[0].blockId,'t1-example');assert.equal(merged.targets[0].hash,blockHash(load().sections[1].blocks[2]));assert.equal(merged.state,'pending');
 assert.deepEqual(record.lastRun.sequences[0].discarded,['no target is an id from the reviewed content','severity below the reporting threshold','unknown kind made-up-kind']);
 assert.deepEqual(record.lastRun.dropped.map(row=>row.reason),['Roles are clear in the working.']);
 assert.deepEqual(record.lastRun.unchecked.map(row=>row.candidate.targets),[['t2-guided']],'a candidate the second reader ignored is neither kept nor dropped');
 assert.deepEqual(record.protectedGroups[0].targets,['t1-q1-a','t1-q1-b']);assert.equal(record.contextQuestions.length,1);assert.equal(record.notReliablyReviewed.length,1);
 assert.deepEqual(record.passes,{review:{model:'gpt-6.1-sol',effort:'low',calls:6},challenge:{model:'gpt-6.1-sol',effort:'medium',calls:1}});
 assert.deepEqual(result.counts,{severe:0,high:2,structural:1,suggestions:0,contextQuestions:1,protectedGroups:1,notReliablyReviewed:1,dropped:1,unchecked:1,suppressed:0});
 assert.equal(result.holdBeforeFinalExport,true);assert.equal(isStructural(merged),false);
 const challengePayload=calls.find(call=>call.stage==='pedagogy-challenge').payload;
 assert.deepEqual(challengePayload.teaching.map(row=>row.topic),['negative-index','two-step-equations']);assert.equal(challengePayload.teachingComplete,true);assert.deepEqual(challengePayload.practice.map(row=>row.id),['t2-q1','t2-q2','t2-q3','t2-q4'],'a claim about a transition is checked against the whole exercise');
});

test('no candidates means no challenge call, and a candidates-only run records nothing',async t=>{
 const space=workspace(t),calls=[];
 const quiet=await runReview({...space.options,runner:stubRunner({calls})});
 assert.equal(calls.some(call=>call.stage==='pedagogy-challenge'),false);assert.deepEqual(quiet.findings,[]);assert.equal(quiet.holdBeforeFinalExport,false);
 const other=workspace(t),only=await runReview({...other.options,candidatesOnly:true,reviewEffort:'medium',topics:['two-step-equations'],runner:stubRunner({calls,review:{'two-step-equations':{candidates:[candidate('guided-practice',['t2-guided'])]}}})});
 assert.equal(only.candidates.length,1);assert.equal(only.effort,'medium');assert.equal(fs.existsSync(path.join(other.dir,'provenance')),false);assert.ok(fs.existsSync(only.candidateFile));
 await assert.rejects(runReview({...other.options,topics:['nowhere'],runner:stubRunner()}),/No sequence matches/);
});

test('context questions alone still go to the second reader, who prunes and merges them',async t=>{
 const space=workspace(t),calls=[],ask=(targets,question)=>({targets,question});
 const result=await runReview({...space.options,runner:stubRunner({calls,review:{
  'negative-index':{contextQuestions:[ask(['t1-example-a'],'Do students know reciprocals?')]},
  'two-step-equations':{contextQuestions:[ask(['t2-q3'],'Have students expanded brackets?'),ask(['t2-q4'],'Have students formed equations from words?')]},
  'percentage-of-quantity':{contextQuestions:[ask(['t3-q1-d'],'Have students met percentages above 100?'),ask(['nowhere'],'Ignored: no valid target.')]}},
  challenge:(rows,payload)=>({findings:[],contextQuestions:[{from:['q1'],targets:['t1-example-a','t1-example-b'],question:'Do students already know what a reciprocal is?'}],droppedQuestions:[{id:'q2',reason:'Expanding Brackets is a separate booklet.'},{id:payload.contextQuestions[2].id,reason:'Taught in t2-example-3.'}]})})});
 const challenge=calls.find(call=>call.stage==='pedagogy-challenge');
 assert.deepEqual(challenge.payload.contextQuestions.map(row=>[row.id,row.topic]),[['q1','negative-index'],['q2','two-step-equations'],['q3','two-step-equations'],['q4','percentage-of-quantity']]);
 assert.deepEqual(challenge.payload.candidates,[]);assert.deepEqual(challenge.payload.assumptions.otherBooklets,['Expanding Brackets']);
 const record=space.record();
 assert.deepEqual(record.contextQuestions,[{sequence:'negative-index',targets:['t1-example-a','t1-example-b'],question:'Do students already know what a reciprocal is?'},{sequence:'percentage-of-quantity',targets:['t3-q1-d'],question:'Have students met percentages above 100?'}],'a question the second reader never mentioned is kept as asked');
 assert.deepEqual(record.lastRun.droppedQuestions.map(row=>row.reason),['Expanding Brackets is a separate booklet.','Taught in t2-example-3.']);
 assert.equal(record.passes.challenge.calls,1);assert.equal(result.counts.contextQuestions,2);assert.deepEqual(result.findings,[]);
});

test('a rejected finding stays suppressed only while its targets are unchanged',async t=>{
 const space=workspace(t),review={'negative-index':{candidates:[candidate('example-choice',['t1-example-a'])]}};
 await runReview({...space.options,runner:stubRunner({review})});
 const record=space.record();record.findings[0].state='rejected';fs.writeFileSync(path.join(space.dir,'provenance','pedagogy-seeded.json'),JSON.stringify(record));
 // The same issue named through a different example of the same block is still the rejected one.
 const calls=[],again=await runReview({...space.options,runner:stubRunner({review:{'negative-index':{candidates:[candidate('example-choice',['t1-example-b']),candidate('guided-practice',['t1-example-b'])]}},calls,challenge:rows=>({findings:[],dropped:rows.map(row=>({id:row.id,reason:'Not the same kind, but refuted.'}))})})});
 assert.deepEqual(again.findings,[]);assert.deepEqual(calls.at(-1).payload.candidates.map(row=>row.kind),['guided-practice'],'a different kind of issue in that block is still considered');assert.equal(space.record().findings[0].state,'rejected');
 assert.deepEqual(calls[0].payload.decided.map(row=>row.targets),[['t1-example-a']],'the reviewer is told what was already rejected');
 assert.deepEqual(space.record().lastRun.sequences[0].discarded,['already rejected']);
 const project=space.project();project.sections[1].blocks[2].examples[0].prompt='Write $5^{-2}$ as a fraction.';fs.writeFileSync(space.projectFile,JSON.stringify(project,null,2)+'\n');
 const changed=await runReview({...space.options,runner:stubRunner({review})});
 assert.equal(changed.findings.length,1);assert.equal(changed.findings[0].state,'pending');
});

test('posting adds one local comment per finding, is repeatable and skips a stale finding',async t=>{
 const space=workspace(t),review={'negative-index':{candidates:[candidate('example-choice',['t1-example-a','t1-example-b'],{severity:'severe'})]},'percentage-of-quantity':{candidates:[candidate('guided-practice',['t3-guided'])]}};
 await runReview({...space.options,runner:stubRunner({review})});
 const project=space.project();project.sections[5].blocks[3].content.prompt='Find $23\\%$ of $400$';fs.writeFileSync(space.projectFile,JSON.stringify(project,null,2)+'\n');
 const posted=await postFindings(space.options);
 assert.equal(posted.posted.length,1);assert.equal(posted.stale.length,1);assert.deepEqual(posted.errors,[]);
 const flags=space.project().studio.flags,finding=space.record().findings.find(row=>row.kind==='example-choice');
 assert.equal(flags.length,1);
 assert.deepEqual({kind:flags[0].kind,findingId:flags[0].findingId,severity:flags[0].severity,scope:flags[0].scope,resolved:flags[0].resolved,targetId:flags[0].targetId,edition:flags[0].edition},{kind:'pedagogy-review',findingId:finding.id,severity:'severe',scope:'local',resolved:false,targetId:'t1-example-a',edition:'student'});
 assert.equal(flags[0].note,commentNote(finding));assert.match(flags[0].note,/^\[Pedagogy review · Severe · example-choice · pf-/);assert.match(flags[0].note,/Also affects: t1-example-b/);assert.match(flags[0].note,/Proposed repair \(change-values\)/);assert.match(flags[0].note,/Done when:/);
 assert.equal(finding.commentId,flags[0].id);assert.equal(space.record().findings.find(row=>row.kind==='guided-practice').state,'stale');
 const again=await postFindings(space.options);
 assert.deepEqual(again.posted,[]);assert.deepEqual(again.alreadyPresent,[finding.id]);assert.equal(space.project().studio.flags.length,1);
});

test('posting can be restricted to named findings without posting new review results',async t=>{
 const space=workspace(t),review={'negative-index':{candidates:[candidate('example-choice',['t1-example-a'])]},'percentage-of-quantity':{candidates:[candidate('guided-practice',['t3-guided'])]}};
 await runReview({...space.options,runner:stubRunner({review})});
 const id=space.record().findings[0].id;
 assert.deepEqual((await postFindings({...space.options,findingIds:[id]})).posted,[id]);
 assert.equal(space.project().studio.flags.length,1);
 assert.deepEqual((await postFindings({...space.options,findingIds:[id]})).alreadyPresent,[id]);
 await assert.rejects(postFindings({...space.options,findingIds:['unknown']}),/Unknown finding/);
});

test('states come from explicit decisions: an open comment is pending, never approved',async t=>{
 const space=workspace(t),review={'negative-index':{candidates:[candidate('example-choice',['t1-example-a'])]},'two-step-equations':{candidates:[candidate('unsupported-transition',['t2-q3']),candidate('guided-practice',['t2-guided'])]},'percentage-of-quantity':{candidates:[candidate('worked-step-error',['t3-example-2-entry'],{severity:'severe',repair:{type:'fix-step',proposal:'Correct the product to 84.'}}),candidate('guided-practice',['t3-guided'])]}};
 await runReview({...space.options,runner:stubRunner({review})});await postFindings(space.options);
 const id=kind=>space.record().findings.find(finding=>finding.kind===kind&&(kind!=='guided-practice'||finding.targets[0].id==='t2-guided')).id;
 const open=await reconcile(space.options);
 assert.equal(open.states.pending.length,5);assert.deepEqual(open.approved,[]);
 const approved=await reconcile({...space.options,approve:[id('example-choice')]});
 assert.deepEqual(approved.approved.map(row=>row.id),[id('example-choice')]);assert.deepEqual(approved.errors,[]);
 // Delete one comment, resolve another and change a third finding's target.
 const project=space.project(),transition=id('unsupported-transition'),step=id('worked-step-error'),guided=id('guided-practice');
 project.studio.flags=project.studio.flags.filter(flag=>flag.findingId!==transition).map(flag=>flag.findingId===step?{...flag,resolved:true}:flag);
 project.sections[3].blocks[5].content.prompt='Solve $5x+2=17$';fs.writeFileSync(space.projectFile,JSON.stringify(project,null,2)+'\n');
 const decided=await reconcile({...space.options,approve:[guided,'pf-unknown']});
 assert.deepEqual(decided.states.rejected,[transition]);assert.deepEqual(decided.states.repaired,[step]);assert.deepEqual(decided.states.stale,[guided]);
 assert.equal(decided.errors.length,2);assert.match(decided.errors.join(' '),/Unknown finding pf-unknown/);assert.match(decided.errors.join(' '),/cannot be approved: it is stale/);
 const last=space.record().findings.find(finding=>finding.targets[0].id==='t3-guided');
 const deferred=await reconcile({...space.options,defer:[last.id],assume:'Calculators are allowed from Stage 4.'});
 assert.deepEqual(deferred.states.deferred,[last.id]);assert.equal(space.project().studio.flags.some(flag=>flag.findingId===last.id),false);
 assert.equal(space.record().assumptions.answers[0].text,'Calculators are allowed from Stage 4.');
 assert.deepEqual(space.record().findings.find(finding=>finding.id===transition).history.map(row=>row.state),['pending','rejected']);
 // A deferred finding is not posted again by itself, and a rejected one is not raised again.
 assert.deepEqual((await postFindings(space.options)).posted,[]);
 // An approved finding found again with other targets is the same issue, not a second finding.
 const approvedId=id('example-choice');
 await runReview({...space.options,topics:['negative-index'],runner:stubRunner({review:{'negative-index':{candidates:[candidate('example-choice',['t1-example-b'])]}}})});
 assert.deepEqual(space.record().findings.filter(finding=>finding.kind==='example-choice').map(finding=>[finding.id,finding.state]),[[approvedId,'approved']]);
});

test('review gaps and difficulty jumps are findings; extensions and variation runs are optional suggestions',async t=>{
 const space=workspace(t),calls=[],idea=(kind,targets,extra={})=>({kind,targets,idea:'An idea for '+targets[0],rationale:'Students would notice a pattern.',proposal:'Three questions written out.',placement:'After the exercise.',...extra});
 const result=await runReview({...space.options,runner:stubRunner({calls,review:{
  'cylinder-volume':{candidates:[candidate('opening-review',['t6-review','t6-example-entry'],{repair:{type:'add-review',proposal:'Add: find the area of a circle with radius 3 cm; with diameter 10 cm.'}}),candidate('difficulty-jump',['t6-q2'],{repair:{type:'add-question',proposal:'Add a question with diameter given and one with a part-filled height.'}})],
   suggestions:[idea('variation-sequence',['t6-q1']),idea('variation-sequence',['t6-q2']),idea('extension',['t6-q2']),idea('extension',['nowhere']),idea('made-up',['t6-q1'])]},
  'two-step-equations':{suggestions:[idea('extension',['t2-q4'],{proposal:''})]}},
  challenge:rows=>({findings:rows.filter(row=>row.kind!=='extension').map(row=>({...row,from:[row.id]})),dropped:rows.filter(row=>row.kind==='extension').map(row=>({id:row.id,reason:'Needs a method beyond the topic.'}))})})});
 assert.deepEqual(calls.at(-1).payload.candidates.map(row=>[row.kind,row.severity]),[['opening-review','high'],['difficulty-jump','high'],['variation-sequence','suggestion'],['extension','suggestion']],'one suggestion of each kind for a topic');
 assert.deepEqual(calls.at(-1).payload.practice.map(row=>row.id),['t6-q1','t6-q2']);
 const record=space.record(),row=record.lastRun.sequences.find(item=>item.id==='cylinder-volume');
 assert.equal(row.candidates,2);assert.equal(row.suggestions,2);assert.equal(row.discarded.length,3);
 assert.deepEqual(result.findings.map(finding=>[finding.kind,finding.repair.type]),[['opening-review','add-review'],['difficulty-jump','add-question']]);
 assert.deepEqual(result.suggestions.map(finding=>[finding.kind,finding.severity]),[['variation-sequence','suggestion']]);
 assert.deepEqual(result.counts,{severe:0,high:2,structural:2,suggestions:1,contextQuestions:0,protectedGroups:0,notReliablyReviewed:0,dropped:1,unchecked:0,suppressed:0});
 assert.equal(result.holdBeforeFinalExport,true);
 const suggestion=record.findings.find(finding=>finding.severity==='suggestion');
 assert.equal(isStructural(suggestion),false);assert.match(commentNote(suggestion),/^\[Pedagogy review · Suggestion · variation-sequence · pf-/);assert.match(commentNote(suggestion),/Proposed addition: Three questions written out\. Placement: After the exercise\./);
 // Suggestions are posted only on request.
 assert.equal((await postFindings(space.options)).posted.length,2);assert.equal(space.project().studio.flags.length,2);
 const more=await postFindings({...space.options,suggestions:true});
 assert.deepEqual(more.posted,[suggestion.id]);assert.equal(space.project().studio.flags.at(-1).severity,'suggestion');
 // Resolving closes an approved finding and nothing else.
 const review=record.findings.find(finding=>finding.kind==='opening-review'),jump=record.findings.find(finding=>finding.kind==='difficulty-jump');
 await reconcile({...space.options,approve:[review.id]});
 const closed=await reconcile({...space.options,resolve:[review.id,jump.id]});
 assert.deepEqual(closed.states.repaired,[review.id]);assert.match(closed.errors.join(' '),/cannot be resolved: it is pending, not approved/);
 const flag=space.project().studio.flags.find(item=>item.findingId===review.id);assert.equal(flag.resolved,true);assert.match(flag.resolution,/done-when condition was checked/);
 assert.equal(space.project().studio.flags.find(item=>item.findingId===jump.id).resolved,false);
 // Rejecting in chat removes the comment and keeps the decision.
 const rejected=await reconcile({...space.options,reject:[jump.id]});
 assert.deepEqual(rejected.states.rejected,[jump.id]);assert.equal(space.project().studio.flags.some(item=>item.findingId===jump.id),false);
});

test('format results come from the page map and stay apart from findings',()=>{
 const project=load();project.sections[3].blocks.unshift({id:'t2-review-2',type:'question',pedagogyRole:'review',content:{id:'t2-review-2-root',type:'question',prompt:'Simplify $2x+3x$'}});
 const pages=[{page:3,blocks:['t1-review','t1-definition','t1-example','t1-guided']},{page:4,blocks:['t2-review-2']},{page:5,blocks:[{id:'t2-review'},'t2-definition','t2-example-1','t2-example-2','t2-example-3']},{page:6,blocks:['t2-guided']},{page:9,blocks:['t5-example']},{page:10,blocks:['t5-example','t5-q1']}];
 const results=formatResults(project,pages);
 assert.deepEqual(results.map(row=>[row.kind,row.sequence,row.pages]),[['opening-review-length','two-step-equations',[4,5]],['example-and-guided-practice-apart','two-step-equations',[5,6]],['figure-block-split','triangular-prism',[9,10]]]);
});

test('the seeded score reports misses, false alarms and asserted diagram judgements',()=>{
 const project=load(),finding=(kind,targets)=>({state:'pending',kind,finding:kind,targets:targets.map(id=>({id}))});
 const good=scoreSeeded(project,{findings:[finding('example-choice',['t1-example-a']),finding('unsupported-transition',['t2-q3-root']),finding('guided-practice',['t3-guided']),finding('worked-step-error',['t3-example-2-entry']),finding('opening-review',['t6-review']),finding('difficulty-jump',['t6-q2-root']),{...finding('extension',['t2-q1']),severity:'suggestion'}],notReliablyReviewed:[{targets:['t5-example-entry']}]});
 assert.equal(good.ok,true);assert.deepEqual(good.missed,[]);assert.equal(good.notReliable[0].flagged,true);
 const poor=scoreSeeded(project,{findings:[finding('example-choice',['t2-example-2-entry']),finding('unsupported-transition',['t2-q1-d']),finding('missing-prerequisite',['t5-example-entry'])]});
 assert.equal(poor.ok,false);assert.equal(poor.missed.length,6);assert.deepEqual(poor.falseAlarms,['N1 repeated 6 with clear roles in a worked example','N3 an easier question inside a variation sequence']);assert.equal(poor.notReliable[0].asserted,true);
 assert.ok(project.seeded.expected.failures.every(item=>item.kinds.every(kind=>KINDS.includes(kind))));
});

test('worker slots are shared through the canonical run directory and released on failure',async t=>{
 const dir=temp(t),runDir=path.join(dir,'canonical');fs.mkdirSync(runDir,{recursive:true});
 // An old manifest in the canonical run must not constrain the review's own configuration.
 fs.writeFileSync(path.join(runDir,'manifest.json'),JSON.stringify({provider:'codex',model:'gpt-5',effort:'high'}));
 let active=0,peak=0;const efforts=[];
 const child=(bin,args)=>{
  const process=new EventEmitter();process.stdout=new EventEmitter();process.stderr=new EventEmitter();process.kill=()=>{};
  process.stdin={on(){},end(prompt){active++;peak=Math.max(peak,active);efforts.push(args.find(arg=>arg.startsWith('model_reasoning_effort')));
   const payload=payloadOf(prompt),fail=payload.sequence?.id==='triangular-prism';
   setTimeout(()=>{active--;if(!fail)fs.writeFileSync(args[args.indexOf('--output-last-message')+1],JSON.stringify(payload.sequence?{candidates:payload.sequence.id==='negative-index'?[candidate('example-choice',['t1-example-a'])]:[]}:{findings:payload.candidates.map(row=>({...row,from:[row.id]}))}));process.emit('close',fail?1:0);},15);}};
  return process;
 };
 const runner=options=>runAstraTask(options,{spawnProcess:child});
 const spaces=[workspace(t),workspace(t)],results=await Promise.all(spaces.map(space=>runReview({...space.options,lease:undefined,runDir,runner})));
 assert.ok(peak<=3,'never more than three workers on one booklet: '+peak);assert.ok(peak>1,'calls do run concurrently');
 assert.deepEqual(fs.readdirSync(path.join(runDir,'workflow','worker-slots')),[],'every slot is released, including the failed call');
 for(const result of results){assert.equal(result.findings.length,1);assert.equal(result.errors.length,1);assert.match(result.errors[0],/triangular-prism: Codex exited 1/);}
 assert.equal(efforts.filter(value=>value==='model_reasoning_effort="low"').length,12);assert.equal(efforts.filter(value=>value==='model_reasoning_effort="medium"').length,2);
});
