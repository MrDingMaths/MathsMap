// Tests for the pending-finding queues and the widened repair worker (17 October 2026).
// Run with: node --test first-pass/queues.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runReview,postFindings,reconcile,bookletIndex,blockHash} from './review.mjs';
import {patchAllowed,trialApply,runApply,repairPrompt,resolveArrangementTargets} from './apply.mjs';
import {classify,classifyRecord,patternGroups,groupComments,decisionsLeft,teacherActive} from './queues.mjs';
import {applyCorrections} from '../scripts/booklet/lean-review.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'first-pass-queues-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const payloadOf=prompt=>JSON.parse(prompt.slice(prompt.indexOf('Input:\n')+7));
const COUNT=6;
const question=n=>({id:'q'+n,type:'question',content:{id:'q'+n+'-root',type:'question',label:String(n),prompt:'Find the area.',layout:'grid',columns:2,children:['a','b'].map(part=>({id:`q${n}-${part}`,type:'part',label:part,prompt:`$${n}\\times ${part==='a'?2:3}$`,answerSpaceMm:18,answer:{short:String(n*(part==='a'?2:3)),worked:'Multiply.'}}))}});
function booklet(){
 return {id:'first-pass-fixture',title:'Area of Rectangles',revision:3,settings:{flowEdition:'student',cover:{course:'Year 7'},compactAnswers:{shortDiagramMm:45,diagramWidths:{}},
  layoutOverrides:{answerSpaces:{'q1-a':20},blockLayouts:{q2:{arrangement:{version:1,root:{id:'q2-root:question',type:'group',direction:'stack',children:[{id:'layout:q2-a',type:'item',ref:'q2-a',height:30},{id:'layout:q2-b',type:'item',ref:'q2-b'}]}}}}}},
  sections:[
   {id:'front',phase:'front-matter',title:'Cover',blocks:[{id:'cover-block',type:'rich-text',content:'Name: ...'}]},
   {id:'practice',phase:'practice',topicId:'area',title:'Exercise 1',blocks:Array.from({length:COUNT},(_,i)=>question(i+1))}
  ]};
}
function pagemap(){
 const ids=Array.from({length:COUNT},(_,i)=>'q'+(i+1));
 return {student:[{page:1,blocks:['cover-block'],nodes:[]},...ids.map((id,i)=>({page:i+2,blocks:[id],nodes:[id,id+'-a',id+'-b']}))],
  short:ids.map((id,i)=>({page:i+1,blocks:[id],nodes:[id+'-a']})),worked:ids.map((id,i)=>({page:i+1,blocks:[id],nodes:[id+'-a']}))};
}
const fakeImages=map=>Object.fromEntries(Object.entries(map).map(([edition,pages])=>[edition,Object.fromEntries(pages.map(page=>[page.page,`${edition}-${page.page}.png`]))]));
const finding=(page,targets,extra={})=>({page,edition:'student',targets,area:'spacing',scope:'local',comment:'Reduce the gap on '+targets[0]+'.',gain:'Fits the page.',...extra});
const reviewRunner=review=>async options=>{const payload=payloadOf(options.prompt);return {result:review[payload.edition+':'+payload.pages[0].page]??{findings:[],notReliablyReviewed:[]},metrics:{}};};
function workspace(t){
 const dir=temp(t),projectFile=path.join(dir,'candidate.json');
 fs.writeFileSync(projectFile,JSON.stringify(booklet(),null,2)+'\n');
 return {dir,projectFile,
  options:{projectFile,root:ROOT,provenanceDir:path.join(dir,'provenance'),workDir:path.join(dir,'work'),runDir:null,lease:async(_dir,_details,action)=>action(),mapPages:async()=>pagemap(),renderImages:async()=>({images:fakeImages(pagemap()),report:'stub',failures:[],reused:false})},
  recordFile:path.join(dir,'provenance','first-pass-fixture.json'),
  record(){return JSON.parse(fs.readFileSync(this.recordFile,'utf8'));},project:()=>JSON.parse(fs.readFileSync(projectFile,'utf8'))};
}
const patch=(targetId,field,original,corrected)=>({targetId,field,original,corrected});
const repairRunner=(corrections,comments=[])=>async()=>({result:{corrections,comments},metrics:{}});
const target=(project,id,blockId=id)=>({id,blockId,hash:blockHash(project,bookletIndex(project),blockId)});

test('every pending finding gets one queue from its area, its earlier outcome and its targets',()=>{
 const project=booklet(),index=bookletIndex(project),row=extra=>({id:'fp-x',state:'pending',edition:'student',area:'spacing',targets:[target(project,'q1')],...extra});
 const q=extra=>classify(row(extra),{project,index});
 assert.deepEqual(q({applyOutcome:'comment',applyNote:'The worker returned no patch.'}),{name:'a',reason:'no-output'});
 assert.deepEqual(q({applyOutcome:'comment',applyNote:'No rendered page or current gap values are supplied.'}),{name:'a',reason:'no-render'});
 assert.deepEqual(q({applyOutcome:'comment',applyNote:'The supplied JSON does not expose the row gap.'}),{name:'a',reason:'not-exposed'});
 assert.deepEqual(q({applyOutcome:'comment',applyNote:'Patch on q1-a/responseSpace is not a layout field.'}),{name:'a',reason:'guard'});
 assert.deepEqual(q({applyOutcome:'comment',applyNote:'Patch on q1-a/answer/worked is not a layout field.'}),{name:'c',reason:'content'});
 assert.deepEqual(q({applyOutcome:'comment',applyNote:'Moving the 5 cm label requires editing TikZ code.'}),{name:'c',reason:'content'});
 assert.deepEqual(q({applyOutcome:'comment',applyNote:'Would change content in q1.'}),{name:'c',reason:'content'});
 assert.deepEqual(q({applyOutcome:'reverted',applyNote:'Reverted after verification: no verdict returned.'}),{name:'a',reason:'unverified'});
 assert.deepEqual(q({applyOutcome:'reverted',applyNote:'Reverted after verification: the gap is unchanged.'}),{name:'b',reason:'reverted-unfixed'});
 assert.deepEqual(q({applyOutcome:'comment',applyNote:'Reducing it to 12 mm would leave inadequate handwriting space.'}),{name:'b',reason:'declined'});
 assert.deepEqual(q({}),{name:'b',reason:'not-attempted'});
 assert.deepEqual(q({area:'response',applyOutcome:'comment',applyNote:'The worker returned no patch.'}),{name:'c',reason:'response-format'});
 assert.deepEqual(q({area:'duplicate',applyOutcome:'left'}),{name:'c',reason:'duplicate'});
 assert.deepEqual(q({targets:[{id:'q1',blockId:'q1',hash:'old'}]}),{name:'d',reason:'target-changed'});
 assert.deepEqual(q({targets:[{id:'gone',blockId:'gone',hash:'x'}]}),{name:'d',reason:'target-removed'});
 assert.equal(classify(row({state:'repaired'}),{project,index}),null);
});

test('queues are recorded on the findings without changing their ids; decided comments get none',()=>{
 const project=booklet(),record={findings:[
  {id:'fp-a',state:'pending',area:'spacing',edition:'student',targets:[target(project,'q1')],applyOutcome:'comment',applyNote:'The worker returned no patch.',commentId:'c1'},
  {id:'fp-b',state:'pending',area:'labels',edition:'student',targets:[target(project,'q2')],applyOutcome:'comment',applyNote:'x',commentId:'c2'}]};
 project.studio={flags:[{id:'c1',kind:'first-pass',findingId:'fp-a'},{id:'c2',kind:'first-pass',findingId:'fp-b',resolved:true}]};
 const {counts}=classifyRecord(record,project);
 assert.deepEqual(counts,{a:1,b:0,c:0,d:0});
 assert.deepEqual(record.findings.map(row=>row.id),['fp-a','fp-b']);
 assert.equal(record.findings[0].queue.name,'a');assert.equal(record.findings[1].queue,undefined);
 assert.equal(decisionsLeft(record,project).decisions,1);
});

test('only recent unresolved teacher comments hold a booklet',()=>{
 const now=Date.parse('2026-10-17T08:00:00Z');
 assert.equal(teacherActive({studio:{flags:[{at:'2026-10-17T06:00:00Z',note:'fix'},{kind:'first-pass',at:'2026-10-17T07:00:00Z'}]}},{now}),'2026-10-17T06:00:00Z');
 assert.equal(teacherActive({studio:{flags:[{at:'2026-10-15T06:00:00Z'},{kind:'pedagogy-review',at:'2026-10-17T07:00:00Z'}]}},{now}),null);
 assert.equal(teacherActive({studio:{flags:[{resolved:true,at:'2026-10-17T06:00:00Z',resolvedAt:'2026-10-17T07:00:00Z',updatedAt:'2026-10-17T07:00:00Z'}]}},{now}),null);
 assert.equal(teacherActive({studio:{flags:[{resolved:true,updatedAt:'2026-10-17T07:00:00Z'},{resolved:false,at:'2026-10-15T06:00:00Z',editedAt:'2026-10-17T06:30:00Z'}]}},{now}),'2026-10-17T06:30:00Z');
});

test('repeated content findings form one pattern per area and edition',()=>{
 const row=(id,page,comment,extra={})=>({id,page,comment,area:'diagram',edition:'student',targets:[{id:'q'+page,blockId:'q'+page}],...extra});
 const groups=patternGroups([
  row('fp-1',3,'Add a labelled rectangle diagram showing 5 cm by 3 cm for q3.'),
  row('fp-2',5,'Add a labelled rectangle diagram showing 8 m by 2 m for q5.'),
  row('fp-3',4,'Move the 40° label clear of the arc.'),
  row('fp-4',6,'Add a labelled rectangle diagram showing 6 cm by 4 cm.',{edition:'worked'})]);
 assert.deepEqual(groups.map(group=>group.map(item=>item.id)),[['fp-1','fp-2'],['fp-3'],['fp-4']]);
});

test('the guard admits renderer layout fields, edition diagram sizes and source labels only',()=>{
 for(const field of ['/responseSpace','/backgroundColor','/borderWidthMm','/diagramPlacement','/tail','/gapMm'])assert.equal(patchAllowed(patch('q1-a',field,null,'x')),true,field);
 assert.equal(patchAllowed(patch('q1','/sourceReview/responses/0/label','','a')),true);
 assert.equal(patchAllowed(patch('q1','/sourceReview/responses/0/text','','a')),false);
 assert.equal(patchAllowed(patch('project','/settings/compactAnswers/diagramWidths/q1-d',null,{short:40})),true);
 assert.equal(patchAllowed(patch('project','/settings/compactAnswers/shortDiagramMm',45,40)),false);
 assert.equal(patchAllowed(patch('q1-a','/answer/worked','a','b')),false);
});

test('a patch that names an arrangement node edits the saved arrangement',()=>{
 const project=booklet(),blocks=[project.sections[1].blocks[1]];
 const [resolved]=resolveArrangementTargets([patch('layout:q2-a','/height',30,20)],{blocks,settings:project.settings});
 assert.equal(resolved.targetId,'project');
 assert.equal(resolved.field,'/settings/layoutOverrides/blockLayouts/q2/arrangement/root/children/0/height');
 const result=trialApply({blocks,settings:project.settings,corrections:[{id:'fp-x',patches:[patch('layout:q2-a','/height',30,20)]}],applyCorrections});
 assert.deepEqual(result.comments,[]);assert.equal(result.accepted[0].patches[0].targetId,'project');
});

test('the repair worker sees node paths, containers, saved layouts with pointers, edition overrides, neighbours and the field catalogue',()=>{
 const project=booklet(),index=bookletIndex(project);
 project.sections[1].blocks[1].presentation={answerPartLabels:{short:{'q2-a':'a'}}};
 project.settings.compactAnswers.diagramWidths={'q2-b':{short:40}};
 const group=[{id:'fp-x',edition:'short',page:2,area:'answers',scope:'local',targets:[{id:'q2-a',blockId:'q2'}],comment:'Label it 2a.',applyNote:'The supplied fields do not expose the label.'}];
 const {prompt,blockIds}=repairPrompt({project,index:bookletIndex(project),group,root:ROOT});
 const payload=payloadOf(prompt),block=payload.blocks[0];
 assert.deepEqual(blockIds,['q2','q1','q3']);
 assert.ok(block.nodes.some(node=>node.id==='q2-a'&&node.path==='q2 > q2-root > q2-a'&&node.pointer==='/content/children/0'));
 assert.deepEqual(block.containers.ancestors['q2-a'].map(node=>node.id),['q2','q2-root']);
 assert.equal(block.containers.section.phase,'practice');
 const saved=block.saved.blockLayouts[0];
 assert.equal(saved.pointer,'/settings/layoutOverrides/blockLayouts/q2');
 assert.ok(saved.nodes.some(node=>node.id==='layout:q2-a'&&node.pointer.endsWith('/arrangement/root/children/0')));
 assert.deepEqual(block.editionOverrides.diagramWidths['q2-b'],{pointer:'/settings/compactAnswers/diagramWidths/q2-b',value:{short:40}});
 assert.deepEqual(block.editionOverrides.presentation.answerPartLabels,{short:{'q2-a':'a'}});
 assert.deepEqual(payload.neighbours.map(row=>row.id),['q1','q3']);
 assert.match(payload.rendererFields.catalogue,/answerPartLabels/);
 assert.equal(payload.findings[0].earlierAttempt,'The supplied fields do not expose the label.');
 assert.equal(index.blocks.size,7);
});

async function seeded(t){
 const space=workspace(t);
 await runReview({...space.options,runner:reviewRunner({'student:2':{findings:[finding(2,['q1']),finding(3,['q2'],{area:'labels',comment:'Move label a to the first line.'})]}})});
 return space;
}
const idsOf=space=>Object.fromEntries(space.record().findings.map(row=>[row.area,row.id]));
const apply=(space,extra)=>runApply({...space.options,runDir:path.join(space.dir,'apply'),...extra});
const unfixed=async({accepted})=>({automated:[],findings:accepted.map(row=>({id:row.id,fixed:false,regressed:false,note:'still there'}))});
const fixed=async({accepted})=>({automated:[],findings:accepted.map(row=>({id:row.id,fixed:true,regressed:false,note:'ok'}))});

test('queue mode reruns a failed finding once and resolves its open comment in place',async t=>{
 const space=await seeded(t),ids=idsOf(space);
 await apply(space,{verify:fixed,runner:repairRunner([],[{findingId:ids.spacing,why:'No rendered page is supplied.'},{findingId:ids.labels,why:'The worker returned no patch.'}])});
 await postFindings({...space.options,findingIds:[ids.spacing]});
 const flag=space.project().studio.flags.find(row=>row.findingId===ids.spacing);
 let calls=0;
 const result=await apply(space,{findingIds:[ids.spacing],verify:fixed,runner:async options=>{calls++;assert.match(options.prompt,/rendererFields/);return {result:{corrections:[{id:ids.spacing,reason:'Tighten.',patches:[patch('q1-a','/answerSpaceMm',18,12)]}]},metrics:{}};}});
 assert.equal(calls,1);assert.deepEqual(result.applied,[ids.spacing]);
 const flags=space.project().studio.flags.filter(row=>row.findingId===ids.spacing);
 assert.equal(flags.length,1);assert.equal(flags[0].id,flag.id);assert.equal(flags[0].resolved,true);
 const row=space.record().findings.find(item=>item.id===ids.spacing);
 assert.equal(row.state,'repaired');assert.equal(row.queueRerun.previous.outcome,'comment');
 const again=await apply(space,{findingIds:[ids.labels,ids.spacing],verify:fixed,runner:repairRunner([],[{findingId:ids.labels,why:'Still no field.'}])});
 assert.deepEqual(again.comment,[ids.labels]);
 calls=0;await apply(space,{findingIds:[ids.labels],verify:fixed,runner:async()=>{calls++;return {result:{},metrics:{}};}});
 assert.equal(calls,0,'one queue rerun per finding');
});

test('a queue rerun keeps the one-retry budget',async t=>{
 const space=await seeded(t),ids=idsOf(space);
 await apply(space,{verify:fixed,runner:repairRunner([],[{findingId:ids.spacing,why:'No rendered page.'}])});
 const file=space.recordFile,record=space.record();record.findings.find(row=>row.id===ids.spacing).retryUsed=true;fs.writeFileSync(file,JSON.stringify(record));
 let calls=0;
 const result=await apply(space,{findingIds:[ids.spacing],verify:unfixed,runner:async()=>{calls++;return {result:{corrections:[{id:ids.spacing,reason:'Tighten.',patches:[patch('q1-a','/answerSpaceMm',18,12)]}]},metrics:{}};}});
 assert.equal(calls,1,'no retry repair call');assert.deepEqual(result.reverted,[ids.spacing]);
 assert.equal(space.project().sections[1].blocks[0].content.children[0].answerSpaceMm,18);
});

test('a repeated pattern becomes one comment and its instances follow that decision',async t=>{
 const space=workspace(t);
 await runReview({...space.options,runner:reviewRunner({'student:2':{findings:[
  finding(2,['q1'],{area:'diagram',comment:'Add a labelled rectangle diagram showing 5 cm by 3 cm.'}),
  finding(3,['q2'],{area:'diagram',comment:'Add a labelled rectangle diagram showing 8 cm by 2 cm.'}),
  finding(4,['q3'],{area:'diagram',comment:'Move the angle label clear of the arc.'})]}})});
 const record=space.record();
 for(const row of record.findings)Object.assign(row,{applyOutcome:'comment',applyNote:'Adding a labelled diagram requires new diagram content.'});
 fs.writeFileSync(space.recordFile,JSON.stringify(record));
 await postFindings(space.options);
 const result=await groupComments({projectFile:space.projectFile,root:ROOT,provenanceDir:space.options.provenanceDir});
 assert.deepEqual(result.errors,[]);assert.equal(result.grouped.length,1);assert.equal(result.folded,1);
 const [representative]=result.grouped,flags=space.project().studio.flags.filter(row=>row.kind==='first-pass');
 assert.equal(flags.length,2);
 const note=flags.find(row=>row.findingId===representative.representative).note;
 assert.match(note,/Same pattern at 1 more place/);assert.match(note,new RegExp(representative.members[0]));
 // The teacher deletes the pattern comment: every instance is rejected.
 const project=space.project();project.studio.flags=project.studio.flags.filter(row=>row.findingId!==representative.representative);fs.writeFileSync(space.projectFile,JSON.stringify(project,null,2)+'\n');
 await reconcile({projectFile:space.projectFile,root:ROOT,provenanceDir:space.options.provenanceDir});
 const by=Object.fromEntries(space.record().findings.map(row=>[row.id,row.state]));
 assert.equal(by[representative.representative],'rejected');assert.equal(by[representative.members[0]],'rejected');
 assert.equal(Object.values(by).filter(state=>state==='pending').length,1);
 // A grouped instance is never posted on its own.
 const posted=await postFindings(space.options);assert.deepEqual(posted.posted,[]);
});

test('a patch under missing objects creates the outermost one, canonicalised for saving',()=>{
 const project=booklet(),blocks=[project.sections[1].blocks[2]];
 const corrections=[
  {id:'fp-new-layout',patches:[patch('project','/settings/layoutOverrides/blockLayouts/q3/arrangement',null,{version:1,root:{id:'q3-root',type:'group',children:[{id:'layout:q3-a',type:'item',ref:'q3-a'}]}})]},
  {id:'fp-labels',patches:[patch('q3','/presentation/answerPartLabels/short/q3-a',null,'a')]}];
 const result=trialApply({blocks,settings:project.settings,corrections,applyCorrections});
 assert.deepEqual(result.comments,[]);
 const [layout,labels]=result.accepted.map(row=>row.patches[0]);
 assert.equal(layout.field,'/settings/layoutOverrides/blockLayouts/q3');
 assert.equal(layout.corrected.arrangement.root.direction,'stack','normalised as the save will store it');
 assert.deepEqual(labels,{targetId:'q3',field:'/presentation',original:null,corrected:{answerPartLabels:{short:{'q3-a':'a'}}}});
});

test('a patch that leaves an empty entry in a list is refused before any save',()=>{
 const project=booklet(),blocks=[project.sections[1].blocks[0]];
 const result=trialApply({blocks,settings:project.settings,corrections:[{id:'fp-hole',patches:[patch('q1-root','/children/1',structuredClone(blocks[0].content.children[1]),null)]}],applyCorrections});
 assert.deepEqual(result.accepted,[]);assert.match(result.comments[0].why,/empty entry in a list/);
});

test('an arrangement whose ref names no content node is refused before any save',async()=>{
 const {structuralPreflight}=await import('../scripts/booklet/feedback-preflight.mjs');
 const project=booklet(),blocks=[project.sections[1].blocks[1]];
 const preflight=(rows,settings)=>structuralPreflight({id:project.id,sections:[{id:'t',phase:'practice',blocks:rows}],settings},{blockIds:rows.map(row=>row.id)}).issues.filter(issue=>/arrangement/.test(issue.kind)).map(issue=>issue.blockId+' '+issue.kind+' '+(issue.ref??''));
 const bad={id:'fp-ref',patches:[patch('project','/settings/layoutOverrides/blockLayouts/q2/arrangement/root/children/1/ref','q2-b','q2-zzz')]};
 const good={id:'fp-ok',patches:[patch('project','/settings/layoutOverrides/blockLayouts/q2/arrangement/root/children/0/height',30,24)]};
 const result=trialApply({blocks,settings:project.settings,corrections:[bad,good],applyCorrections,preflight});
 assert.deepEqual(result.accepted.map(row=>row.id),['fp-ok']);
 assert.match(result.comments[0].why,/Would break a saved arrangement: q2 missing-arrangement-ref q2-zzz/);
});
