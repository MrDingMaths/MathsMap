import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runReview,postFindings} from '../first-pass/review.mjs';
import {patchAllowed,contentTokens,sameContent,trialApply,inversePatches,groupFindings,runApply,canonicalLayoutValue,verificationTasks,repairEvidence,rendererCapabilities} from '../first-pass/apply.mjs';
import {applyCorrections} from '../scripts/booklet/lean-review.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('repair capability packets expose native diagrams inside table cells',()=>{
 const packet=rendererCapabilities(ROOT);
 assert.match(packet.catalogue,/Native cells support a text paragraph containing one \[tikz\] block/);
 const source=packet.sources.find(x=>x.file==='src/lib/document-tikz.js');
 assert.ok(source);
 assert.match(source.code,/including inside table cells/);
 assert.match(source.code,/documentTikzEntries/);
});
const temp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'first-pass-apply-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const payloadOf=prompt=>JSON.parse(prompt.slice(prompt.indexOf('Input:\n')+7));
const QUESTIONS=6;
const question=n=>({id:'q'+n,type:'question',content:{id:'q'+n+'-root',type:'question',label:String(n),prompt:'Find the area.',layout:'grid',columns:2,children:['a','b'].map(part=>({id:`q${n}-${part}`,type:'part',label:part,prompt:`$${n}\\times ${part==='a'?2:3}$`,answerSpaceMm:18,answer:{short:String(n*(part==='a'?2:3)),worked:'Multiply.'}}))}});
function booklet(){
 return {id:'first-pass-fixture',title:'Area of Rectangles',revision:3,settings:{flowEdition:'student',cover:{course:'Year 7'},layoutOverrides:{answerSpaces:{'q1-a':20}}},
  sections:[
   {id:'front',phase:'front-matter',title:'Cover',blocks:[{id:'cover-block',type:'rich-text',content:'Name: ...'}]},
   {id:'practice',phase:'practice',topicId:'area',title:'Exercise 1',blocks:Array.from({length:QUESTIONS},(_,i)=>question(i+1))}
  ]};
}
function pagemap(){
 const ids=Array.from({length:QUESTIONS},(_,i)=>'q'+(i+1));
 return {student:[{page:1,blocks:['cover-block'],nodes:[]},...ids.map((id,i)=>({page:i+2,blocks:[id],nodes:[id,id+'-a',id+'-b']}))],
  short:ids.map((id,i)=>({page:i+1,blocks:[id],nodes:[id+'-a']})),worked:ids.map((id,i)=>({page:i+1,blocks:[id],nodes:[id+'-a']}))};
}
const fakeImages=map=>Object.fromEntries(Object.entries(map).map(([edition,pages])=>[edition,Object.fromEntries(pages.map(page=>[page.page,`${edition}-${page.page}.png`]))]));
const finding=(page,targets,extra={})=>({page,edition:'student',targets,area:'spacing',scope:'local',comment:'Reduce the gap on '+targets[0]+'.',gain:'Fits the page.',...extra});
function reviewRunner(review){
 return async options=>{const payload=payloadOf(options.prompt);return {result:review[payload.edition+':'+payload.pages[0].page]??{findings:[],notReliablyReviewed:[]},metrics:{}};};
}
function workspace(t){
 const dir=temp(t),projectFile=path.join(dir,'candidate.json');
 fs.writeFileSync(projectFile,JSON.stringify(booklet(),null,2)+'\n');
 return {dir,projectFile,
  options:{projectFile,root:ROOT,provenanceDir:path.join(dir,'provenance'),workDir:path.join(dir,'work'),runDir:null,lease:async(_dir,_details,action)=>action(),mapPages:async()=>pagemap(),renderImages:async()=>({images:fakeImages(pagemap()),report:'stub',failures:[],reused:false})},
  record:()=>JSON.parse(fs.readFileSync(path.join(dir,'provenance','first-pass-fixture.json'),'utf8')),project:()=>JSON.parse(fs.readFileSync(projectFile,'utf8'))};
}
const q1=()=>booklet().sections[1].blocks[0];
const patch=(targetId,field,original,corrected)=>({targetId,field,original,corrected});

test('only layout fields and layout overrides may be patched',()=>{
 assert.equal(patchAllowed(patch('q1-a','/answerSpaceMm',18,12)),true);
 assert.equal(patchAllowed(patch('q1','/content/columns',2,1)),true);
 assert.equal(patchAllowed(patch('q1-a','/prompt',1,2)),true);
 assert.equal(patchAllowed(patch('q1-a','/answer/short','2','3')),false);
 assert.equal(patchAllowed(patch('q1-a','/code','a','b')),false);
 assert.equal(patchAllowed(patch('q1-a','',1,2)),false);
 assert.equal(patchAllowed(patch('project','/settings/layoutOverrides/answerSpaces/q1-a',20,10)),true);
 assert.equal(patchAllowed(patch('project','/settings/cover/course','a','b')),false);
});

test('content check ignores labels, empties and layout, follows answers across fields, and catches edits',()=>{
 const before=q1(),after=structuredClone(before);
 after.content.children[0].label='e';after.content.children[0].answerSpaceMm=5;after.content.children[1].extra='';
 assert.equal(sameContent(before,after),true);
 const edited=structuredClone(before);edited.content.children[0].prompt='$1\\times 5$';assert.equal(sameContent(before,edited),false);
 const dropped=structuredClone(before);delete dropped.content.children[0].answer.short;assert.equal(sameContent(before,dropped),false);
 const cloze={id:'c',type:'part',prompt:[{type:'text',text:'x ='},{id:'z',type:'cloze',answer:'4',width:20}]},response={id:'c',type:'part',prompt:[{type:'text',text:'x ='}],response:{answer:'4'}};
 assert.equal(sameContent(cloze,response),true);
 assert.equal(sameContent(cloze,{...response,response:{answer:'5'}}),false);
 assert.ok(contentTokens(before).includes('ans:Multiply.'));
});

test('content check treats a labelled table arrow as content but not its geometry',()=>{
 const table=annotations=>({id:'t',type:'table',rows:[[{id:'c1',type:'cell',blocks:[{type:'paragraph',inlines:[{type:'text',text:'2'}]}]},{id:'c2',type:'cell',blocks:[{type:'paragraph',inlines:[{type:'text',text:'6'}]}]}]],annotations});
 const arrow={id:'a1',type:'arrow',cellId:'c1',toCellId:'c2',side:'bottom',label:'×3',heads:'end',curve:4,distance:3};
 const before=table([arrow]);
 assert.equal(sameContent(before,table([{...arrow,side:'top',curve:8,distance:5,startAnchor:'left',endAnchor:'right'}])),true);
 assert.equal(sameContent(before,table([])),false);
 assert.equal(sameContent(before,table([{...arrow,label:'÷5'}])),false);
 assert.equal(sameContent(table([]),table([arrow])),true);
 assert.ok(contentTokens(before).includes('ann:×3'));
});

test('trial apply keeps clean findings and comments on content loss, bad originals and conflicts',()=>{
 const blocks=[q1()],settings=booklet().settings;
 const corrections=[
  {id:'ok',patches:[patch('q1-a','/answerSpaceMm',18,12)]},
  {id:'conflict',patches:[patch('q1-a','/answerSpaceMm',18,9)]},
  {id:'stale-original',patches:[patch('q1-b','/answerSpaceMm',99,9)]},
  {id:'content',patches:[patch('q1-b','/prompt','$1\\times 3$','$1\\times 4$')]},
  {id:'forbidden',patches:[patch('q1-b','/answer/short','3','4')]},
  {id:'override',patches:[patch('project','/settings/layoutOverrides/answerSpaces/q1-a',20,10)]},
  {id:'empty',patches:[]}
 ];
 const result=trialApply({blocks,settings,corrections,applyCorrections});
 assert.deepEqual(result.accepted.map(row=>row.id),['ok','override']);
 const why=Object.fromEntries(result.comments.map(row=>[row.findingId,row.why]));
 assert.deepEqual(Object.keys(why).sort(),['conflict','content','empty','forbidden','stale-original']);
 assert.match(why.conflict,/original differs/);assert.match(why.content,/change content/);assert.match(why.forbidden,/not a layout field/);
 assert.deepEqual(blocks[0],q1(),'the trial never touches the real blocks');
});

test('inverse patches undo a correction exactly',()=>{
 const corrections=[{id:'a',patches:[patch('q1-a','/answerSpaceMm',18,12),patch('q1-a','/answerSpaceMm',12,8)]}];
 const blocks=[q1()];applyCorrections(blocks,corrections);assert.equal(blocks[0].content.children[0].answerSpaceMm,8);
 applyCorrections(blocks,inversePatches(corrections));assert.deepEqual(blocks[0],q1());
});

test('findings on a shared block are repaired together',()=>{
 const row=(id,...blocks)=>({id,targets:blocks.map(blockId=>({id:blockId,blockId}))});
 const groups=groupFindings([row('a','q1','q2'),row('b','q2'),row('c','q5')]);
 assert.deepEqual(groups.map(group=>group.map(finding=>finding.id)),[['a','b'],['c']]);
});

async function seeded(t){
 const space=workspace(t);
 await runReview({...space.options,runner:reviewRunner({'student:2':{findings:[finding(2,['q1']),finding(3,['q2'],{area:'extension',comment:'Add a harder part.'}),finding(4,['q3'],{area:'diagram',comment:'Redraw the figure.'})]}})});
 return space;
}
const idsOf=space=>Object.fromEntries(space.record().findings.map(row=>[row.area,row.id]));
const repairRunner=(corrections,comments=[])=>async()=>({result:{corrections,comments},metrics:{}});
const verified=async({accepted})=>({automated:[],findings:accepted.map(row=>({id:row.id,fixed:true,regressed:false,note:'ok'}))});
const apply=(space,extra)=>runApply({...space.options,runDir:path.join(space.dir,'apply'),verify:verified,...extra});

test('apply repairs a layout finding, resolves its comment, and leaves reviews and unrepairable diagrams',async t=>{
 const space=await seeded(t),ids=idsOf(space);
 const result=await apply(space,{runner:repairRunner([{id:ids.spacing,reason:'Tighten part a.',patches:[patch('q1-a','/answerSpaceMm',18,12)]}],[{findingId:ids.diagram,why:'Needs a redrawn figure.'}])});
 assert.deepEqual(result.errors,[]);
 assert.deepEqual(result.applied,[ids.spacing]);assert.deepEqual(result.left,[ids.extension]);assert.deepEqual(result.commentFindingIds,[ids.diagram]);
 const project=space.project();
 assert.equal(project.sections[1].blocks[0].content.children[0].answerSpaceMm,12);
 const flag=project.studio.flags.find(row=>row.findingId===ids.spacing);assert.equal(flag.resolved,true);assert.match(flag.resolution,/Tighten part a/);
 const by=Object.fromEntries(space.record().findings.map(row=>[row.id,row]));
 assert.equal(by[ids.spacing].state,'repaired');assert.equal(by[ids.spacing].applyOutcome,'repaired');
 assert.equal(by[ids.extension].applyOutcome,'left');assert.equal(by[ids.extension].state,'pending');assert.equal(by[ids.extension].commentId,undefined);
 assert.equal(by[ids.diagram].applyOutcome,'comment');assert.match(by[ids.diagram].applyNote,/redrawn/);
 assert.equal(project.studio.flags.some(row=>row.findingId===ids.diagram||row.findingId===ids.extension),false,'apply posts no open comment');
 assert.ok(fs.readdirSync(path.join(space.dir,'apply')).some(name=>name.startsWith('corrections-')));
});

test('a regressed finding is reverted and becomes a comment',async t=>{
 const space=await seeded(t),ids=idsOf(space),before=space.project();
 const result=await apply(space,{runner:repairRunner([{id:ids.spacing,reason:'Tighten part a.',patches:[patch('q1-a','/answerSpaceMm',18,6)]}]),verify:async({accepted})=>({automated:[],findings:accepted.map(row=>({id:row.id,fixed:true,regressed:true,note:'working space cramped'}))})});
 assert.deepEqual(result.reverted,[ids.spacing]);assert.deepEqual(result.applied,[]);assert.ok(result.commentFindingIds.includes(ids.spacing));
 const project=space.project();
 assert.deepEqual(project.sections[1].blocks[0],before.sections[1].blocks[0]);
 const row=space.record().findings.find(finding=>finding.id===ids.spacing);
 assert.equal(row.applyOutcome,'reverted');assert.match(row.applyNote,/cramped/);assert.equal(row.state,'pending');
 assert.equal((project.studio?.flags??[]).some(flag=>flag.findingId===ids.spacing),false);
});

test('a missing verdict reverts too',async t=>{
 const space=await seeded(t),ids=idsOf(space),before=space.project();
 const result=await apply(space,{runner:repairRunner([{id:ids.spacing,reason:'x',patches:[patch('q1-a','/answerSpaceMm',18,6)]}]),verify:async()=>({automated:[],findings:[]})});
 assert.deepEqual(result.reverted,[ids.spacing]);
 assert.deepEqual(space.project().sections[1].blocks[0],before.sections[1].blocks[0]);
});

test('a worker failure becomes a comment without a save',async t=>{
 const space=await seeded(t),ids=idsOf(space),revision=space.project().revision;
 const failed=await apply(space,{runner:async()=>{throw Error('worker down');}});
 assert.deepEqual(failed.applied,[]);assert.ok(failed.commentFindingIds.includes(ids.spacing));assert.equal(space.project().revision,revision);
 assert.match(space.record().findings.find(row=>row.id===ids.spacing).applyNote,/worker down/);
});

test('missing verification retries the check once without reauthoring',async t=>{
 const space=await seeded(t),ids=idsOf(space);let repairs=0,checks=0;
 const result=await apply(space,{runner:async()=>{repairs++;return {result:{corrections:[{id:ids.spacing,reason:'Tighten.',patches:[patch('q1-a','/answerSpaceMm',18,12)]}]}};},verify:async options=>{checks++;return checks===1?{automated:[],findings:[]}:verified(options);}});
 assert.equal(repairs,2,'one initial call per finding group, no extra repair call');
 assert.equal(checks,2);assert.deepEqual(result.applied,[ids.spacing]);assert.deepEqual(result.reverted,[]);
 assert.equal(result.retries[0].kind,'verification');assert.equal(result.verificationAttempts.length,2);
 assert.equal(space.project().sections[1].blocks[0].content.children[0].answerSpaceMm,12);
});

test('an unfixed defect gets one new guarded repair using verifier feedback',async t=>{
 const space=await seeded(t),ids=idsOf(space);let checks=0,retries=0;
 const result=await apply(space,{runner:async options=>{
  const payload=payloadOf(options.prompt),isRetry=Boolean(payload.verificationFeedback);
  if(isRetry){retries++;assert.match(payload.verificationFeedback[0].note,/still too wide/);assert.equal(payload.blocks[0].json.content.children[0].answerSpaceMm,18,'first attempt was undone');}
  return {result:{corrections:[{id:ids.spacing,reason:isRetry?'A different repair.':'Initial repair.',patches:[patch('q1-a','/answerSpaceMm',18,isRetry?10:12)]}]}};
 },verify:async options=>{checks++;return checks===1?{automated:[],findings:options.accepted.map(row=>({id:row.id,fixed:false,regressed:false,note:'still too wide'}))}:verified(options);}});
 assert.equal(retries,1);assert.equal(checks,2);assert.deepEqual(result.applied,[ids.spacing]);assert.deepEqual(result.reverted,[]);
 assert.equal(result.retries[0].kind,'repair');assert.equal(space.project().sections[1].blocks[0].content.children[0].answerSpaceMm,10);
 assert.match(space.project().studio.flags.find(row=>row.findingId===ids.spacing).resolution,/different repair/);
});

test('a second ineffective repair is undone and never gets a third attempt',async t=>{
 const space=await seeded(t),ids=idsOf(space);let checks=0;
 const result=await apply(space,{runner:repairRunner([{id:ids.spacing,reason:'x',patches:[patch('q1-a','/answerSpaceMm',18,12)]}]),verify:async({accepted})=>{checks++;return {automated:[],findings:accepted.map(row=>({id:row.id,fixed:false,regressed:false,note:'unfixed'}))};}});
 assert.equal(checks,2);assert.deepEqual(result.reverted,[ids.spacing]);assert.deepEqual(result.applied,[]);
 assert.equal(space.project().sections[1].blocks[0].content.children[0].answerSpaceMm,18);
 assert.equal(space.record().apply.retries.length,1);
});

test('verification infrastructure failure may recover once and retains its history',async t=>{
 const space=await seeded(t),ids=idsOf(space);let checks=0;
 const result=await apply(space,{runner:repairRunner([{id:ids.spacing,reason:'x',patches:[patch('q1-a','/answerSpaceMm',18,12)]}]),verify:async options=>{checks++;if(checks===1)throw Error('renderer unavailable');return verified(options);}});
 assert.equal(checks,2);assert.deepEqual(result.errors,[]);assert.deepEqual(result.applied,[ids.spacing]);
 assert.equal(result.verificationAttempts[0].error,'renderer unavailable');
});

test('regressions never enter the automatic retry loop',async t=>{
 const space=await seeded(t),ids=idsOf(space);let checks=0;
 const result=await apply(space,{runner:repairRunner([{id:ids.spacing,reason:'x',patches:[patch('q1-a','/answerSpaceMm',18,6)]}]),verify:async({accepted})=>{checks++;return {automated:[],findings:accepted.map(row=>({id:row.id,fixed:false,regressed:true,note:'lost working space'}))};}});
 assert.equal(checks,1);assert.deepEqual(result.retries,[]);assert.deepEqual(result.reverted,[ids.spacing]);
});

test('historical unfixed repairs retry once and resolve the existing open comment in place',async t=>{
 const space=await seeded(t),ids=idsOf(space),correction={id:ids.spacing,reason:'Initial.',patches:[patch('q1-a','/answerSpaceMm',18,12)]};
 await apply(space,{retry:false,runner:repairRunner([correction]),verify:async({accepted})=>({automated:[],findings:accepted.map(row=>({id:row.id,fixed:false,regressed:false,note:'still too wide'}))})});
 await postFindings({...space.options,findingIds:[ids.spacing]});
 const originalFlag=space.project().studio.flags.find(row=>row.findingId===ids.spacing);
 const retryFindings=[{id:ids.spacing,kind:'repair',note:'still too wide',correction}];
 const result=await apply(space,{retryFindings,runner:repairRunner([{id:ids.spacing,reason:'Retry.',patches:[patch('q1-a','/answerSpaceMm',18,10)]}])});
 assert.deepEqual(result.applied,[ids.spacing]);assert.equal(result.retries[0].historical,true);
 const flags=space.project().studio.flags.filter(row=>row.findingId===ids.spacing);
 assert.equal(flags.length,1);assert.equal(flags[0].id,originalFlag.id);assert.equal(flags[0].resolved,true);
 assert.equal(space.record().findings.find(row=>row.id===ids.spacing).retryUsed,true);
 assert.equal(space.record().applyHistory.length,1);
 assert.deepEqual(space.record().apply.reverted,[]);
 let calls=0;await apply(space,{retryFindings,runner:async()=>{calls++;throw Error('must not run');}});assert.equal(calls,0);
});

test('historical missing verdict reuses guarded original patches without another repair call',async t=>{
 const space=await seeded(t),ids=idsOf(space),correction={id:ids.spacing,reason:'Initial.',patches:[patch('q1-a','/answerSpaceMm',18,12)]};
 await apply(space,{retry:false,runner:repairRunner([correction]),verify:async()=>({automated:[],findings:[]})});
 let calls=0;const result=await apply(space,{retryFindings:[{id:ids.spacing,kind:'verification',correction}],runner:async()=>{calls++;throw Error('must not reauthor');}});
 assert.equal(calls,0);assert.deepEqual(result.applied,[ids.spacing]);
});

test('historical recovery respects teacher-deleted comments',async t=>{
 const space=await seeded(t),ids=idsOf(space),correction={id:ids.spacing,reason:'x',patches:[patch('q1-a','/answerSpaceMm',18,12)]};
 await apply(space,{retry:false,runner:repairRunner([correction]),verify:async()=>({automated:[],findings:[]})});
 await postFindings({...space.options,findingIds:[ids.spacing]});
 const project=space.project();project.studio.flags=[];fs.writeFileSync(space.projectFile,JSON.stringify(project));
 let calls=0;const result=await apply(space,{retryFindings:[{id:ids.spacing,kind:'verification',correction}],runner:async()=>{calls++;}});
 assert.equal(calls,0);assert.deepEqual(result.applied,[]);assert.equal(space.project().studio.flags.length,0);
});

test('arrangement patches use persisted canonical values so inverse patches still match',()=>{
 const value=[{id:'row',type:'group',direction:'row',align:'start',gap:2,children:[{id:'item',type:'item',ref:'part/prompt'}]}];
 const p=patch('project','/settings/layoutOverrides/blockLayouts/q1/arrangement/root/children',[],value);
 const corrected=canonicalLayoutValue(p);
 assert.equal(corrected[0].align,undefined);
 const result=trialApply({blocks:[q1()],settings:{layoutOverrides:{blockLayouts:{q1:{arrangement:{version:1,root:{id:'root',type:'group',children:[]}}}}}},corrections:[{id:'layout',patches:[p]}],applyCorrections});
 assert.deepEqual(result.accepted[0].patches[0].corrected,corrected);
 const holder={id:'project',settings:{layoutOverrides:{blockLayouts:{q1:{arrangement:{version:1,root:{id:'root',type:'group',children:corrected}}}}}}};
 const undone=applyCorrections([holder],inversePatches(result.accepted));assert.equal(undone.rejected.length,0);
 assert.deepEqual(holder.settings.layoutOverrides.blockLayouts.q1.arrangement.root.children,[]);
});

test('response-table ownership is checked before saving any repair',()=>{
 const block=q1();block.flow={tableContinuation:{tableId:'table',headerRows:1,rowPartIds:['q1-a','q1-b']}};
 block.content.prompt={type:'doc',blocks:[{id:'table',type:'table',rows:[[{text:'header'}],[{text:'a'}],[{text:'b'}]]}]};
 const r=trialApply({blocks:[block],settings:{},corrections:[{id:'ownership',patches:[patch('q1','/flow',block.flow,{tableContinuation:{tableId:'table',headerRows:2,rowPartIds:['q1-a','q1-b']}})]}],applyCorrections});
 assert.equal(r.accepted.length,0);assert.match(r.comments[0].why,/continuation ownership/);
});

test('verification follows block identities across shifted page numbers and bounds worker images',()=>{
 const before={pagemap:{student:[{page:9,blocks:['other']},{page:10,blocks:['q1']},{page:11,blocks:['next']}]},images:{student:{9:'b9',10:'b10',11:'b11'}}};
 const after={pagemap:{student:[{page:7,blocks:['other']},{page:8,blocks:['q1']},{page:9,blocks:['next']}]},images:{student:{7:'a7',8:'a8',9:'a9'}}};
 const details={fix:{targets:[{blockId:'q1'}]}};
 const tasks=verificationTasks({accepted:[{id:'fix',patches:[]}],findingDetails:details,index:{owners:new Map()},before,after,editions:['student','short']});
 assert.equal(tasks.length,1);assert.deepEqual(tasks[0].pages.filter(p=>p.blocks.includes('q1')).map(p=>[p.phase,p.page]),[['before',10],['after',8]]);
 assert.equal(tasks[0].images.length,6);assert.equal(tasks[0].error,undefined);
 const evidence=repairEvidence([{targets:[{blockId:'q1'}]}],{before,after});assert.equal(evidence.images.length,6);
 const missing=verificationTasks({accepted:[{id:'fix',patches:[]}],findingDetails:details,index:{owners:new Map()},before,after:{...after,images:{}},editions:['student']});
 assert.match(missing[0].error,/missing target/);
});

test('retry repair workers receive image evidence and actual renderer capabilities',async t=>{
 const space=await seeded(t),ids=idsOf(space);let checks=0,sawImages=false;
 await apply(space,{runner:async options=>{const payload=payloadOf(options.prompt);if(payload.verificationFeedback){sawImages=true;assert.deepEqual(options.images,['before.png','after.png']);assert.ok(payload.rendererCapabilities.sources.length);assert.equal(payload.pages[1].phase,'after');}return {result:{corrections:[{id:ids.spacing,reason:'x',patches:[patch('q1-a','/answerSpaceMm',18,12)]}]}};},verify:async options=>{checks++;return checks===1?{automated:[],findings:options.accepted.map(r=>({id:r.id,fixed:false,regressed:false,note:'unfixed'})),evidence:Object.fromEntries(['before','after'].map(phase=>[phase,{pagemap:{student:[{page:2,blocks:['q1']}]},images:{student:{2:phase+'.png'}}}]))}:verified(options);}});
 assert.equal(sawImages,true);
});

test('the original finding is checked only in its own edition; other editions check regressions',()=>{
 const map={student:[{page:1,blocks:['q1']}],short:[{page:1,blocks:['q1']}],worked:[{page:1,blocks:['q1']}]};
 const source={pagemap:map,images:{student:{1:'s'},short:{1:'a'},worked:{1:'w'}}};
 const tasks=verificationTasks({accepted:[{id:'fix',patches:[]}],findingDetails:{fix:{edition:'student',targets:[{blockId:'q1'}]}},index:{owners:new Map()},before:source,after:source,editions:['student','short','worked']});
 assert.deepEqual(tasks.map(t=>[t.edition,t.requireFix]),[['student',true],['short',false],['worked',false]]);
});


test('source/readability growth needs positive exact-result verification and does not waive pagination defects',async t=>{
 const space=await seeded(t),ids=idsOf(space),record=space.record();
 record.findings.find(f=>f.id===ids.spacing).sourceRepair=true;
 fs.writeFileSync(path.join(space.options.provenanceDir,'first-pass-fixture.json'),JSON.stringify(record));
 const result=await apply(space,{findingIds:[ids.spacing],allowSubstantiveGrowth:true,retry:false,runner:repairRunner([{id:ids.spacing,reason:'Restore source grouping',patches:[patch('q1-a','/answerSpaceMm',18,24)]}]),verify:async({accepted})=>({automated:[],pagination:['student grew from 7 to 8 pages'],findings:accepted.map(row=>({id:row.id,fixed:true,regressed:false,note:'Exact source grouping restored'}))})});
 assert.deepEqual(result.applied,[ids.spacing]);
 assert.equal(space.record().findings.find(f=>f.id===ids.spacing).growthReason.verified,true);
});
