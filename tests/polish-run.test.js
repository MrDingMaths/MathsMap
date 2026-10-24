// Polish pipeline driver (23 October 2026): state and resume, the residual hold, the export gate, the save guard,
// the full-book review's source pages per batch and its report-only mode, contact sheets and pedagogy suggestions.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {STEPS,runPolish,startState,residualHold,gateProblems,reportLine,pinMilestone,savePolished} from '../polish/run.mjs';
import {sheetPlan,sheetHtml} from '../polish/sheets.mjs';
import {splitFindings,suggestionItems,isPolishSuggestion} from '../polish/pedagogy.mjs';
import {runReview,sourceImages,bookletIndex,selectPages,planBatches,LIMITS} from '../first-pass/review.mjs';
import {ROOT,workspace,temp,booklet,pagemap,finding,payloadOf} from './polish-fixture.mjs';

const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));};

test('the steps run in the order of the plan',()=>{
 assert.deepEqual([...STEPS],['snapshot','normalise','blank-style','wrapped-math','dependencies','paginate','review','content','residual','supersede','breaks','export','sheets','pedagogy','report']);
});

test('state: a rerun on the same input resumes; a changed input starts again',async t=>{
 const dir=temp(t),file=path.join(dir,'in.json'),base=path.join(dir,'work');
 write(file,booklet());
 let mapped=0;
 const deps={mapPages:async()=>{mapped++;return {...pagemap(),issues:{student:[],short:[],worked:[]}};}};
 const first=await runPolish({file,baseDir:base,only:['snapshot'],deps});
 assert.equal(mapped,1);
 assert.deepEqual([first.state.input.revision,first.state.steps.snapshot.status],[3,'done']);
 assert.equal(first.state.baseline.pages.student,7,'the cover and six questions');
 const again=await runPolish({file,baseDir:base,only:['snapshot'],deps});
 assert.equal(mapped,1,'the finished step is not run twice');assert.equal(again.state.startedAt,first.state.startedAt);
 // The input changes: all earlier work is dropped.
 const edited=booklet();edited.revision=4;write(file,edited);
 const restarted=await runPolish({file,baseDir:base,only:['snapshot'],deps});
 assert.equal(mapped,2);assert.equal(restarted.state.input.revision,4);assert.notEqual(restarted.state.startedAt,first.state.startedAt);
 // The working copy is a copy: the input is never written.
 assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).revision,4);
 assert.equal(JSON.parse(fs.readFileSync(path.join(base,'polish','candidate.json'),'utf8')).revision,4);
 // A skipped step is recorded, and runs when the option goes away.
 const skipped=await runPolish({file,baseDir:base,skip:STEPS.filter(s=>s!=='snapshot'),deps});
 assert.equal(skipped.state.steps.normalise.status,'skipped');
});

test('startState keeps finished work only for an unchanged input, and --fresh discards it',()=>{
 const project={id:'x',revision:2},previous={input:{sha:'abc'},steps:{snapshot:{status:'done'}},startedAt:'then'};
 assert.equal(startState({previous,inputSha:'abc',project,file:'f.json'}).resumed,true);
 assert.equal(startState({previous,inputSha:'zzz',project,file:'f.json'}).resumed,false);
 assert.equal(startState({previous,inputSha:'abc',project,file:'f.json',fresh:true}).resumed,false);
});

test('residual hold is finding-based: unresolved content and layout block, suggestions do not',()=>{
 const rows=n=>Array.from({length:n},(_,i)=>({id:'r'+i,area:'spacing'}));
 assert.equal(residualHold(rows(6),60).held,true,'each unresolved substantive finding matters');
 assert.equal(residualHold(rows(7),60).held,true);
 assert.equal(residualHold([...rows(2),{id:'c',area:'content'},{id:'e',area:'extension'}],20).layout,2,'content and suggestions do not count');
 assert.equal(residualHold(rows(1),7).held,true,'any finding holds a booklet under ten pages');
 assert.equal(residualHold([],74).held,false);
 assert.equal(residualHold([{id:'c',area:'content'}],60).held,true);
 assert.equal(residualHold([{id:'e',area:'extension'}],60).held,false);
 assert.equal(residualHold([{id:'r',area:'diagram',state:'repaired'}],60).held,false);
});

test('the export gate refuses a longer edition, an oversized block and a pagination issue the input did not have',()=>{
 const baseline={pages:{student:74,short:40,worked:52},issues:{student:[],short:[{kind:'footer-overflow',id:'q9'}],worked:[]}};
 const same={pages:{student:74,short:40,worked:52},issues:{student:[],short:[{kind:'footer-overflow',id:'q9'}],worked:[]}};
 assert.deepEqual(gateProblems(baseline,same),[]);
 assert.deepEqual(gateProblems(baseline,{...same,pages:{student:70,short:40,worked:52}}),[]);
 assert.match(gateProblems(baseline,{...same,pages:{student:74,short:41,worked:52}})[0],/short grew from 40 to 41/);
 assert.match(gateProblems(baseline,{...same,issues:{...same.issues,student:[{kind:'oversized-content',id:'q1'}]}})[0],/oversized-content on q1/);
 assert.equal(gateProblems(baseline,{...same,issues:{...same.issues,short:[{kind:'oversized-content',id:'q9'}]}}).length,1,'an oversized block always counts');
});

test('the report line carries pages before and after, the fixes, the residual and the suggestions',()=>{
 const line=reportLine({project:'rates-v1',pages:{before:{student:84,short:40,worked:52},after:{student:67,short:38,worked:50}},fixes:{normalise:{blocks:41},paginate:{moves:9},review:{applied:12},content:{applied:2}},residual:{count:3,held:false},pedagogy:{suggestions:2},breakSuggestions:[{},{},{}],elapsedSeconds:2400});
 assert.equal(line,'rates-v1: pages student 84→67, short 40→38, worked 52→50; fixes normalise 41, paginate 9, review 12, content 2; residual 3; pedagogy suggestions 2; break suggestions 3; 40 min');
});

test('the start revision is pinned as a milestone checkpoint, once, in the booklet storage\'s own file',async t=>{
 const root=temp(t);
 assert.deepEqual(await pinMilestone('b',7,{root}),{pinned:true,revision:7});
 await pinMilestone('b',7,{root});await pinMilestone('b',5,{root});await pinMilestone('c',1,{root});
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'booklets','projects','.revisions','milestones.json'),'utf8')),{b:[5,7],c:[1]});
 assert.equal((await pinMilestone('b',null,{root})).pinned,false);
});

test('a save expects the revision the run began from and refuses a failed gate or a busy booklet',async t=>{
 const root=temp(t),before=booklet(),after=booklet();after.sections[1].blocks[0].content.children[0].answerSpaceMm=14;
 // This allowance is demonstrably untouched since import; changed/unknown values are protected.
 delete before.settings.layoutOverrides.answerSpaces['q1-a'];delete after.settings.layoutOverrides.answerSpaces['q1-a'];
 before.sections[1].blocks[0].sourceReview={workingSpaceEstimate:{estimates:[{targetId:'q1-a',answerSpaceMm:18}]}};
 after.sections[1].blocks[0].sourceReview=structuredClone(before.sections[1].blocks[0].sourceReview);
 write(path.join(root,'booklets','projects','first-pass-fixture.json'),before);
 const work=path.join(root,'candidate.json');write(work,after);
 const calls=[],deps={liveWork:()=>({blocked:[],held:[]}),saveRepair:async args=>{calls.push(args);return {project:{revision:4}};}};
 const state={input:{revision:3},gates:{ok:true,problems:[]}};
 const saved=await savePolished({state,work,id:'first-pass-fixture',root,deps});
 assert.deepEqual([saved.saved,saved.revision,saved.changed],[true,4,1]);
 assert.equal(calls[0].expectedRevision,3);assert.deepEqual(calls[0].changedBlockIds,['q1']);assert.equal(calls[0].options.checkpoint,true);
 await assert.rejects(savePolished({state:{...state,input:{revision:2}},work,id:'first-pass-fixture',root,deps}),/changed during the run/);
 await assert.rejects(savePolished({state:{...state,gates:{ok:false,problems:['student grew from 7 to 8 pages']}},work,id:'first-pass-fixture',root,deps}),/export gate refused/);
 await assert.rejects(savePolished({state,work,id:'first-pass-fixture',root,deps:{...deps,liveWork:()=>({blocked:['running: lean-import.mjs'],held:[]})}}),/Deferred/);
 assert.equal(calls.length,1);
});

// ---- the full-book review beside the source -----------------------------------------------------------------
test('each Questions batch carries the source pages of its own blocks, up to eight',t=>{
 const dir=temp(t),runDir=path.join(dir,'run');
 const project=booklet();
 for(const [i,block] of project.sections[1].blocks.entries())block.sourcePageNumber=i+1; // q1 on source page 1 ... q6 on page 6
 project.sections[1].blocks[0].sourceRefs=[{pageNumber:20},{pageNumber:21}];
 for(let page=1;page<=22;page++)write(path.join(runDir,'evidence','pages','page-'+String(page).padStart(3,'0')+'.png'),{});
 // write() made JSON files with .png names, which is enough for existence.
 const index=bookletIndex(project),rows=[{blocks:[{id:'q2'},{id:'q3'}]},{blocks:[{id:'q4'}]}];
 const found=sourceImages(index,rows,runDir);
 assert.deepEqual(found.map(r=>r.page),[2,3,4],'only the pages of the batch\'s own blocks, in print order');
 assert.equal(LIMITS.sourceImages,8);assert.equal(LIMITS.studentPages,6);
 const many=sourceImages(index,[{blocks:[{id:'q1'}]},{blocks:[{id:'q2'},{id:'q3'},{id:'q4'},{id:'q5'},{id:'q6'}]}],runDir);
 assert.deepEqual(many.map(r=>r.page),[1,20,21,2,3,4,5,6],'capped at eight');
 assert.deepEqual(sourceImages(index,rows,null),[],'no run folder, no source pages');
 // The prompt lists them after the page images.
 const map=pagemap(),selection=selectPages(index,map),[batch]=planBatches({project,index,selection,pagemap:map,record:{findings:[]}});
 assert.equal(batch.rows.length,6);
});

test('report-only review: the same contract and calls, the findings returned, the booklet\'s own record untouched',async t=>{
 const space=workspace(t),calls=[];
 const runner=async options=>{const payload=payloadOf(options.prompt);calls.push(payload.edition);return {result:payload.edition==='student'&&payload.pages[0].page===2?{findings:[finding(3,['q1-a']),finding(4,['q2'],{area:'labels'})]}:{findings:[]},metrics:{}};};
 const options={...space.options,provenanceDir:undefined,reportOnly:true,runner};
 const out=await runReview(options);
 assert.equal(out.reportOnly,true);
 assert.deepEqual(out.residual.map(r=>[r.area,r.targets[0],r.page]),[['spacing','q1-a',3],['labels','q2',4]]);
 assert.deepEqual(out.pageCounts,{student:7,short:6,worked:6});
 assert.equal(fs.existsSync(path.join(ROOT,'booklets','provenance','first-pass-review','first-pass-fixture.json')),false,'nothing was saved without an explicit provenance directory');
 assert.ok(calls.length>=3);
 // With a directory named, the record goes there (the polish run\'s own copy) and nowhere else.
 const dir=path.join(space.dir,'residual');
 await runReview({...options,provenanceDir:dir});
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'first-pass-fixture.json'),'utf8')).findings.length,2);
});

// ---- contact sheets and pedagogy suggestions ---------------------------------------------------------------
test('contact sheets hold four pages each, in order',t=>{
 assert.deepEqual(sheetPlan(10),[[1,2,3,4],[5,6,7,8],[9,10]]);
 assert.deepEqual(sheetPlan(4),[[1,2,3,4]]);assert.deepEqual(sheetPlan(0),[]);
 const dir=temp(t),png=path.join(dir,'p.png');fs.writeFileSync(png,Buffer.from([137,80,78,71]));
 const html=sheetHtml([5,6],[png,png],{title:'rates-v1'});
 assert.ok(html.includes('rates-v1 p5')&&html.includes('rates-v1 p6')&&html.includes('data:image/png;base64,'));
});

test('only extensions, variation sequences and bridging questions are offered to the teacher; the rest is reported',()=>{
 const f=(id,severity,repair,kind='extension')=>({id,state:'pending',severity,kind,repair:{type:repair,proposal:'p'},finding:'x',targets:[{id:'q1-root'}],breakdown:'b'});
 const record={findings:[f('a','suggestion','add-question'),f('b','high','add-question','missing-prerequisite'),f('c','severe','fix-step','worked-step-error'),f('d','high','reorder','difficulty-jump'),{...f('e','suggestion','add-question'),state:'rejected'}]};
 const {suggestions,reported}=splitFindings(record);
 assert.deepEqual(suggestions.map(x=>x.id),['a','b']);assert.deepEqual(reported.map(x=>x.id),['c','d']);
 assert.equal(isPolishSuggestion(f('z','high','add-review','opening-review')),true);
 assert.deepEqual(suggestionItems([f('a','suggestion','add-question')]).map(i=>[i.id,i.targets]),[['a',['q1-root']]]);
});


test('textbook mode excludes pedagogy even when explicitly selected and preserves historical pedagogy comments',async t=>{
 const dir=temp(t),file=path.join(dir,'in.json'),project=booklet();
 project.studio.flags=[{id:'old-pedagogy',kind:'pedagogy-review',at:'2026-10-01',resolved:false},{id:'old-layout',kind:'first-pass',at:'2026-10-01',resolved:false}];
 write(file,project);
 const result=await runPolish({file,baseDir:path.join(dir,'work'),opts:{'--textbook':true},only:['snapshot','supersede','pedagogy'],deps:{mapPages:async()=>({...pagemap(),issues:{student:[],short:[],worked:[]}})}});
 assert.equal(result.state.steps.pedagogy.status,'skipped');
 const flags=JSON.parse(fs.readFileSync(result.work,'utf8')).studio.flags;
 assert.equal(flags.find(f=>f.id==='old-pedagogy').resolved,false);
 assert.equal(flags.find(f=>f.id==='old-layout').resolved,true);
 assert.equal(flags.some(f=>f.kind==='pedagogy-suggestion'),false);
});


test('textbook first-pass review excludes opening-review and extension findings while retaining real defects',async t=>{
 const space=workspace(t);
 const out=await runReview({...space.options,reportOnly:true,textbook:true,runner:async options=>{
  assert.match(options.prompt,/Textbook import override/);
  const payload=payloadOf(options.prompt);
  return {result:{findings:payload.edition==='student'?[finding(2,['q1'],{area:'extension'}),finding(2,['q1'],{area:'review'}),finding(2,['q1'],{area:'labels'})]:[]},metrics:{}};
 }});
 assert.deepEqual(out.residual.map(row=>row.area),['labels']);
});

test('resume repairs only failed pre-review zero-space inflation and preserves completed dependency work',async t=>{
 const dir=temp(t),file=path.join(dir,'in.json'),base=path.join(dir,'work'),input=booklet(),node=input.sections[1].blocks[0].content.children[0],block=input.sections[1].blocks[0];node.answerSpaceMm=0;input.settings.layoutOverrides.answerSpaces[node.id]=0;block.sourceReview??={};block.sourceReview.workingSpaceEstimate={estimates:[{targetId:node.id,answerSpaceMm:0}]};write(file,input);
 const initial=await runPolish({file,baseDir:base,only:['snapshot'],deps:{mapPages:async()=>({...pagemap(),issues:{student:[],short:[],worked:[]}})}}),candidate=JSON.parse(fs.readFileSync(initial.work));candidate.sections[1].blocks[0].content.children[0].answerSpaceMm=404;write(initial.work,candidate);
 const stateFile=path.join(base,'polish/state.json'),state=JSON.parse(fs.readFileSync(stateFile));state.steps.normalise={status:'done',result:{}};state.steps.dependencies={status:'done',result:{retained:'existing model evidence'}};state.steps.paginate={status:'failed',error:'oversized-content'};write(stateFile,state);
 const resumed=await runPolish({file,baseDir:base,only:[]});assert.equal(JSON.parse(fs.readFileSync(resumed.work)).sections[1].blocks[0].content.children[0].answerSpaceMm,0);assert.equal(resumed.state.steps.dependencies.result.retained,'existing model evidence');assert.equal(resumed.state.steps.normalise.result.zeroSpaceRepair.length,1);assert.equal(JSON.parse(fs.readFileSync(file)).sections[1].blocks[0].content.children[0].answerSpaceMm,0);
 candidate.sections[1].blocks[0].content.children[0].answerSpaceMm=404;write(initial.work,candidate);state.steps.review={status:'done',result:{}};write(stateFile,state);await runPolish({file,baseDir:base,only:[]});assert.equal(JSON.parse(fs.readFileSync(initial.work)).sections[1].blocks[0].content.children[0].answerSpaceMm,404,'a reviewed candidate is never silently repaired');
});

test('a page-check finding the input already had is not the pipeline\'s',async t=>{
 const {qaCounts,qaWorse}=await import('../polish/run.mjs');
 const dir=temp(t),pdf=path.join(dir,'s.pdf');
 write(pdf+'.qa.json',[{page:1,issues:[]},{page:2,issues:[{kind:'graph-tick-overlap'},{kind:'footer-overflow'}]},{page:3,issues:[{kind:'footer-overflow'}]}]);
 assert.deepEqual(qaCounts(pdf),{'graph-tick-overlap':1,'footer-overflow':2});
 assert.equal(qaCounts(path.join(dir,'none.pdf')),null);
 assert.deepEqual(qaWorse({'graph-tick-overlap':1,'footer-overflow':2},{'graph-tick-overlap':1}),[]);
 assert.deepEqual(qaWorse({'graph-tick-overlap':1},{'graph-tick-overlap':1,'footer-overflow':1}),['footer-overflow 0 to 1']);
 assert.match(qaWorse(null,{}).join(),/could not be read/);
});
