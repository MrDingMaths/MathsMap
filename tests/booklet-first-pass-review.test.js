import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {contract,FRAMING,bookletIndex,blockHash,overridesFor,parsePages,selectPages,planBatches,batchPrompt,checkReport,runReview,postFindings,reconcile,commentNote,findingId,LIMITS,AREAS} from '../first-pass/review.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'first-pass-review-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const payloadOf=prompt=>JSON.parse(prompt.slice(prompt.indexOf('Input:\n')+7));
const QUESTIONS=14;
const question=n=>({id:'q'+n,type:'question',content:{id:'q'+n+'-root',type:'question',label:String(n),prompt:'Find the area.',layout:'grid',columns:2,children:['a','b'].map(part=>({id:`q${n}-${part}`,type:'part',label:part,prompt:`$${n}\\times ${part==='a'?2:3}$`,answerSpaceMm:18,answer:{short:String(n*(part==='a'?2:3)),worked:'Multiply.'}}))}});
// A cover, two teaching blocks on one page, then one practice question per page.
function booklet(){
 return {id:'first-pass-fixture',title:'Area of Rectangles',revision:3,settings:{flowEdition:'student',cover:{course:'Year 7'},layoutOverrides:{answerSpaces:{'q1-a':20,'q9-b':12},blockLayouts:{q2:{arrangement:{version:1}}}}},
  sections:[
   {id:'front',phase:'front-matter',title:'Cover',blocks:[{id:'cover-block',type:'rich-text',content:'Name: ...'}]},
   {id:'teach',phase:'teaching',topicId:'area',title:'Area',blocks:[{id:'theory',type:'rich-text',pedagogyRole:'definition',content:'Area is length times width.'},{id:'example',type:'question',pedagogyRole:'example',content:{id:'example-root',type:'question',prompt:'Find the area of a 3 cm by 4 cm rectangle.',answer:{short:'12 cm²',worked:'3 × 4 = 12'}}}]},
   {id:'practice',phase:'practice',topicId:'area',title:'Exercise 1',blocks:Array.from({length:QUESTIONS},(_,i)=>question(i+1))}
  ]};
}
// Questions: cover, teaching, then q1 to q14 one per page. Short answers: two
// questions a page. Worked solutions: one a page.
function pagemap(){
 const ids=Array.from({length:QUESTIONS},(_,i)=>'q'+(i+1)),answers=(id,count)=>Array(count).fill(id);
 return {student:[{page:1,blocks:['cover-block'],nodes:[]},{page:2,blocks:['theory','example'],nodes:['example-root']},...ids.map((id,i)=>({page:i+3,blocks:[id],nodes:[id,id+'-a',id+'-b']}))],
  short:Array.from({length:QUESTIONS/2},(_,i)=>({page:i+1,blocks:[...answers(ids[2*i],2),...answers(ids[2*i+1],2)],nodes:[ids[2*i]+'-a',ids[2*i+1]+'-a']})),
  worked:ids.map((id,i)=>({page:i+1,blocks:answers(id,3),nodes:[id+'-a',id+'-b']}))};
}
const fakeImages=map=>Object.fromEntries(Object.entries(map).map(([edition,pages])=>[edition,Object.fromEntries(pages.map(page=>[page.page,`${edition}-${page.page}.png`]))]));
const finding=(page,targets,extra={})=>({page,edition:'student',targets,area:'spacing',scope:'local',comment:'Reduce the gap between a and b on '+targets[0]+'.',gain:'Question 2 fits on this page.',...extra});
// `review` maps "edition:first page" to the reviewer's findings for that call.
function stubRunner({review={},calls=[]}={}){
 return async options=>{
  const payload=payloadOf(options.prompt);calls.push({stage:options.stage,effort:options.configuration.effort,runDir:options.runDir,cwd:options.cwd,images:options.images,payload});
  return {result:review[payload.edition+':'+payload.pages[0].page]??{findings:[],notReliablyReviewed:[]},metrics:{usage:{input_tokens:1},elapsedMs:1}};
 };
}
function workspace(t,mutate){
 const dir=temp(t),project=booklet();mutate?.(project);
 const projectFile=path.join(dir,'candidate.json');fs.writeFileSync(projectFile,JSON.stringify(project,null,2)+'\n');
 const leases=[];
 return {dir,projectFile,leases,
  options:{projectFile,root:ROOT,provenanceDir:path.join(dir,'provenance'),workDir:path.join(dir,'work'),runDir:null,lease:async(runDir,details,action)=>{leases.push({runDir,details});return action();},mapPages:async()=>pagemap(),renderImages:async()=>({images:fakeImages(pagemap()),report:'stub',failures:[{kind:'layout',count:2}],reused:false})},
  record:()=>JSON.parse(fs.readFileSync(path.join(dir,'provenance','first-pass-fixture.json'),'utf8')),project:()=>JSON.parse(fs.readFileSync(projectFile,'utf8')),
  edit:change=>{const value=JSON.parse(fs.readFileSync(projectFile,'utf8'));change(value);fs.writeFileSync(projectFile,JSON.stringify(value,null,2)+'\n');}};
}

test('the contract comes from the doc and every prompt starts with it',()=>{
 const text=contract();
 for(const phrase of ['first review of a mathematics booklet','Pagination','Answer editions','Missing opening review','Extension','notReliablyReviewed','"reviewer":"first-pass"'])assert.ok(text.includes(phrase),phrase);
 for(const area of AREAS)assert.ok(text.includes(area),area);
 const project=booklet(),index=bookletIndex(project),map=pagemap(),selection=selectPages(index,map);
 const [first]=planBatches({project,index,selection,pagemap:map,record:{findings:[]}});
 const {prompt,payload}=batchPrompt({project,index,edition:first.edition,rows:first.rows,pagemap:map});
 assert.ok(prompt.startsWith(text+'\n\n'+FRAMING));assert.deepEqual(payloadOf(prompt),payload);
 assert.equal(payload.booklet,'Area of Rectangles');assert.equal(payload.course,'Year 7');assert.equal(payload.edition,'student');
 assert.deepEqual(payload.pages[0],{edition:'student',page:2,blocks:[{id:'theory',type:'rich-text',role:'definition',label:null},{id:'example',type:'question',role:'example',label:null}],nodes:['example-root']});
 const q1=payload.blocks.find(block=>block.id==='q1');
 assert.equal(q1.role,'practice');assert.equal(q1.label,'1');assert.deepEqual(q1.answerSpaces,{'q1-a':20});assert.equal(q1.layout.children[0].columns,2);
 assert.deepEqual(q1.layout.children.map(child=>child.id),['q1-root']);assert.equal(q1.layout.children[0].children[0].answerSpaceMm,18);
 assert.match(payload.blocks.find(block=>block.id==='q2').arrangement,/"version":1/);
 // Comparable blocks come from outside the batch, nearest first.
 assert.ok(payload.similar.length>0&&payload.similar.every(block=>!payload.pages.some(page=>page.blocks.some(row=>row.id===block.id))));
 assert.deepEqual(payload.similar.filter(block=>block.role==='practice').map(block=>[block.id,block.page]),[['q10',12],['q11',13]]);
 const answer=batchPrompt({project,index,edition:'short',rows:[{edition:'short',page:1,blocks:[{id:'q1'},{id:'q2'}],nodes:[]}],pagemap:map}).payload;
 assert.deepEqual(answer.blocks.map(block=>Object.keys(block)),[['id','label','text'],['id','label','text']]);assert.deepEqual(answer.similar,[]);
});

test('pages skip front matter; batches hold at most ten Questions or six answer pages of one edition',async t=>{
 const space=workspace(t),before=fs.readFileSync(space.projectFile);
 const plan=await runReview({...space.options,dry:true,runner:()=>{throw Error('no model call in a dry run');}});
 assert.deepEqual(plan.pageCounts,{student:16,short:7,worked:14});
 assert.deepEqual(plan.reviewed.student,Array.from({length:15},(_,i)=>i+2));
 assert.deepEqual(plan.batches.map(batch=>[batch.edition,batch.pages.length]),[['student',10],['student',5],['short',6],['short',1],['worked',6],['worked',6],['worked',2]]);
 assert.ok(plan.batches.every(batch=>batch.promptCharacters<LIMITS.payloadCharacters));
 assert.equal(fs.existsSync(path.join(space.dir,'provenance')),false);assert.ok(fs.readFileSync(space.projectFile).equals(before));
 // A page range reviews those Questions pages and only the answer pages of their blocks.
 const range=await runReview({...space.options,dry:true,pages:parsePages('5-6,9')});
 assert.deepEqual(range.reviewed,{student:[5,6,9],short:[2,4],worked:[3,4,7]});
 assert.deepEqual(range.batches.map(batch=>batch.edition),['student','short','worked']);
 // --editions reruns only some calls; the Questions pages still choose the blocks.
 const answersOnly=await runReview({...space.options,dry:true,pages:parsePages('5-6'),editions:['short','worked']});
 assert.deepEqual(answersOnly.reviewed,{student:[],short:[2],worked:[3,4]});assert.deepEqual(answersOnly.batches.map(batch=>batch.edition),['short','worked']);
 await assert.rejects(runReview({...space.options,dry:true,editions:['with-short']}),/--editions takes/);
 await assert.rejects(runReview({...space.options,dry:true,pages:parsePages('1')}),/No reviewable Questions page/);
 assert.deepEqual([...parsePages('3, 5-7')],[3,5,6,7]);assert.equal(parsePages(''),null);
 assert.throws(()=>parsePages('7-5'),/backwards/);assert.throws(()=>parsePages('a'),/numbers and ranges/);
 await assert.rejects(runReview({...space.options,concurrency:4}),/one to three workers/);
});

test('review sends rasters in page order at low effort, keeps only findings on its pages and never writes the project',async t=>{
 const space=workspace(t),before=fs.readFileSync(space.projectFile),calls=[],runDir=path.join(space.dir,'canonical-run');
 const review={'student:2':{findings:[finding(3,['q1-a','not-an-id']),finding(4,['q2'],{area:'pagination',scope:'all',proposal:{items:['x']}}),finding(5,['q14']),finding(5,['q3'],{area:'colour'}),finding(5,['q3'],{comment:' '}),finding(99,['q4'],{area:'labels'})],notReliablyReviewed:[{page:7,note:'The diagram is too faint to judge.'}]},
  'short:1':{findings:[finding(1,['q1-b'],{edition:'student',area:'answers',comment:'Start question 2 on a new line.'})]}};
 const result=await runReview({...space.options,runDir,runner:stubRunner({review,calls})});
 assert.ok(fs.readFileSync(space.projectFile).equals(before));
 assert.equal(calls.length,7);assert.ok(calls.every(call=>call.stage==='first-pass'&&call.effort==='low'&&call.runDir===path.join(space.dir,'work')));
 assert.ok(calls.every(call=>!path.resolve(call.cwd).startsWith(ROOT)));
 assert.equal(space.leases.length,7);assert.ok(space.leases.every(lease=>lease.runDir===runDir&&lease.details.tool==='first-pass-review'));
 const first=calls.find(call=>call.payload.edition==='student'&&call.payload.pages[0].page===2);
 assert.deepEqual(first.images,Array.from({length:10},(_,i)=>`student-${i+2}.png`));
 assert.deepEqual(calls.find(call=>call.payload.edition==='short'&&call.payload.pages[0].page===1).images,['short-1.png','short-2.png','short-3.png','short-4.png','short-5.png','short-6.png']);
 const record=space.record();
 assert.deepEqual(record.findings.map(row=>[row.edition,row.page,row.area,row.scope,row.targets.map(target=>target.id)]),[['student',3,'spacing','local',['q1-a']],['student',4,'pagination','all',['q2']],['student',null,'labels','local',['q4']],['short',1,'answers','local',['q1-b']]]);
 assert.ok(record.findings.every(row=>row.state==='pending'&&row.revision===3&&row.id===findingId(row.area,row.edition,row.targets.map(target=>target.id))));
 assert.deepEqual(record.findings[0].targets[0],{id:'q1-a',blockId:'q1',hash:blockHash(booklet(),bookletIndex(booklet()),'q1')});
 assert.equal(record.findings[1].proposal,'{"items":["x"]}');
 assert.deepEqual(record.lastRun.calls[0].discarded.sort(),['no comment','no target is an id on the reviewed pages','unknown area colour']);
 assert.deepEqual(record.notReliablyReviewed,[{edition:'student',page:7,note:'The diagram is too faint to judge.',revision:3}]);
 assert.deepEqual(record.lastRun.render.automatedFailures,['layout ×2']);
 assert.equal(result.states.pending,4);assert.equal(result.discarded,3);assert.deepEqual(result.errors,[]);
});

test('a failed call is reported and does not drop earlier findings on its pages',async t=>{
 const space=workspace(t);
 await runReview({...space.options,runner:stubRunner({review:{'student:2':{findings:[finding(3,['q1'])]}}})});
 const failing=async options=>{const payload=payloadOf(options.prompt);if(payload.edition==='student'&&payload.pages[0].page===2)throw Error('Codex exited 1');return {result:{findings:[]},metrics:{}};};
 const result=await runReview({...space.options,runner:failing});
 assert.equal(result.errors.length,1);assert.match(result.errors[0],/student 2,3,4.*Codex exited 1/);
 assert.deepEqual(space.record().findings.map(row=>row.targets[0].id),['q1']);
 // Reviewed again and not found: an unposted finding is removed.
 await runReview({...space.options,runner:stubRunner()});
 assert.deepEqual(space.record().findings,[]);
});

test('post adds one first-pass comment per pending finding, in its edition, and only once',async t=>{
 const space=workspace(t);
 await runReview({...space.options,runner:stubRunner({review:{'student:2':{findings:[finding(3,['q1-a']),finding(5,['q3','q5'],{area:'labels',scope:'all',proposal:'Move the labels to the first line.'}),finding(6,['q4'],{area:'diagram'})]},'short:1':{findings:[finding(1,['q2'],{area:'answers',comment:'Start question 2 on a new line.'})]}}})});
 space.edit(project=>{project.settings.layoutOverrides.answerSpaces['q4-a']=30;});
 const posted=await postFindings(space.options),record=space.record(),flags=space.project().studio.flags;
 const byArea=area=>record.findings.find(row=>row.area===area);
 assert.equal(posted.posted.length,3);assert.deepEqual(posted.stale,[byArea('diagram').id]);assert.equal(byArea('diagram').state,'stale');
 assert.deepEqual(flags.map(flag=>[flag.kind,flag.findingId,flag.edition,flag.scope,flag.targetId,flag.resolved]),[
  ['first-pass',byArea('spacing').id,'student','local','q1-a',false],['first-pass',byArea('labels').id,'student','all','q3',false],['first-pass',byArea('answers').id,'short','local','q2',false]]);
 const labels=byArea('labels');
 assert.equal(flags[1].note,commentNote(labels));assert.equal(labels.postedNote,flags[1].note);assert.equal(labels.commentId,flags[1].id);
 assert.match(flags[1].note,/^\[First pass · labels · fp-[0-9a-f]{10} · Questions p\. 5\]\nReduce the gap/);assert.match(flags[1].note,/\nGain: Question 2 fits/);assert.match(flags[1].note,/\nProposal: Move the labels/);assert.match(flags[1].note,/\nAlso at: q5$/);
 assert.match(flags[2].note,/· Short answers p\. 1\]/);assert.equal(space.project().revision,3);
 const again=await postFindings(space.options);
 assert.deepEqual(again.posted,[]);assert.equal(again.alreadyPresent.length,3);assert.equal(space.project().studio.flags.length,3);
 await assert.rejects(postFindings({...space.options,findingIds:['fp-unknown']}),/Unknown finding/);
});

test('status: deleted comments are rejected, kept ones wait for triage, and decisions return as decided',async t=>{
 const space=workspace(t),review={'student:2':{findings:[finding(3,['q1-a']),finding(4,['q2'],{area:'pagination'}),finding(5,['q3'],{area:'labels'})]}};
 await runReview({...space.options,runner:stubRunner({review})});await postFindings(space.options);
 const id=area=>space.record().findings.find(row=>row.area===area).id;
 const [spacing,pagination,labels]=[id('spacing'),id('pagination'),id('labels')];
 space.edit(project=>{project.studio.flags=project.studio.flags.filter(flag=>flag.findingId!==spacing).map(flag=>flag.findingId===labels?{...flag,note:'Move the label up to the first line.'}:flag);});
 const open=await reconcile(space.options);
 assert.deepEqual(open.states,{rejected:[spacing],pending:[pagination,labels]});assert.deepEqual(open.awaitingTriage,[pagination,labels]);assert.deepEqual(open.approved,[]);
 assert.match(space.record().findings.find(row=>row.id===spacing).history.at(-1).note,/deleted in Studio/);
 const triaged=await reconcile({...space.options,triaged:true});
 assert.deepEqual(triaged.states,{rejected:[spacing],approved:[pagination,labels]});
 assert.equal(triaged.approved.find(row=>row.id===labels).teacherNote,'Move the label up to the first line.');assert.equal(triaged.approved.find(row=>row.id===pagination).teacherNote,undefined);
 // The same findings again: the rejection is passed back and suppressed, the kept ones stand.
 const calls=[];await runReview({...space.options,runner:stubRunner({review,calls})});
 const decided=calls.find(call=>call.payload.edition==='student'&&call.payload.pages[0].page===2).payload.decided;
 assert.deepEqual(decided.map(row=>[row.state,row.area,row.targets]),[['rejected','spacing',['q1-a']],['kept','pagination',['q2']],['kept','labels',['q3']]]);
 assert.deepEqual(space.record().lastRun.suppressed,[spacing]);
 assert.deepEqual(space.record().findings.map(row=>[row.id,row.state]),[[pagination,'approved'],[labels,'approved'],[spacing,'rejected']]);
 // A rejection holds while its block is unchanged; a changed block can raise the issue again.
 space.edit(project=>{project.settings.layoutOverrides.answerSpaces['q1-a']=26;});
 await runReview({...space.options,runner:stubRunner({review})});
 const spacingRows=space.record().findings.filter(row=>row.area==='spacing');
 assert.deepEqual(spacingRows.map(row=>row.state),['pending']);assert.ok(spacingRows[0].history.some(row=>row.state==='rejected'));
});

test('status names findings to approve, reject or resolve, and withdraws a rejected comment',async t=>{
 const space=workspace(t);
 await runReview({...space.options,runner:stubRunner({review:{'student:2':{findings:[finding(3,['q1']),finding(4,['q2'],{area:'table'}),finding(5,['q3'],{area:'diagram'})]}}})});
 await postFindings(space.options);
 const id=area=>space.record().findings.find(row=>row.area===area).id;
 const result=await reconcile({...space.options,approve:[id('spacing'),'fp-missing'],reject:[id('table')]});
 assert.deepEqual(result.errors,['Unknown finding fp-missing']);
 assert.deepEqual(result.states,{approved:[id('spacing')],rejected:[id('table')],pending:[id('diagram')]});
 assert.equal(space.project().studio.flags.some(flag=>flag.findingId===id('table')),false);
 const closed=await reconcile({...space.options,resolve:[id('spacing'),id('diagram')]});
 assert.deepEqual(closed.errors,[`${id('diagram')} cannot be resolved: it is pending, not approved.`]);
 assert.equal(space.project().studio.flags.find(flag=>flag.findingId===id('spacing')).resolved,true);assert.deepEqual(closed.states.repaired,[id('spacing')]);
});

test('overrides and hashes follow the block, and a raster report must match the page map',()=>{
 const project=booklet(),index=bookletIndex(project);
 assert.equal(index.owners.get('q9-b'),'q9');assert.equal(index.owners.get('example-root'),'example');
 assert.deepEqual(overridesFor(project,index,'q9'),{answerSpaces:{'q9-b':12}});assert.deepEqual(overridesFor(project,index,'q2'),{blockLayouts:{q2:{arrangement:{version:1}}}});
 const before=blockHash(project,index,'q9');project.settings.layoutOverrides.answerSpaces['q9-b']=14;
 assert.notEqual(blockHash(project,index,'q9'),before);assert.equal(blockHash(project,index,'missing'),null);
 const map=pagemap(),report={editionsReport:{student:{pageCount:16,changed:[3,4]},short:{pageCount:7,changed:[1]}}};
 assert.deepEqual(checkReport(report,map,['q1','q2'],['student','short']),[]);
 assert.deepEqual(checkReport({editionsReport:{student:{pageCount:15,changed:[3,4]},short:{pageCount:7,changed:[2]}}},map,['q1','q2'],['student','short','worked']),['student: 15 pages rendered, 16 in the page map','short: the reviewed blocks fall on different pages from the page map','worked: no report']);
});
