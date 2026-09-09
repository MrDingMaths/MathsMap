import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {convertToFlexible,matchSourceLayout,flowNumbers,flowCommand,captureFlowClipboard,logicalUnits,flowEditionSections,isPractice} from '../src/lib/booklet-flow.js';
import {paginateFlow,questionSplitGroups,fragmentQuestion,fragmentLayouts} from '../src/lib/booklet-pagination.js';
import {normalizeEditableProject,validateEditableProject} from '../src/lib/editable-booklet-model.js';
import {mergeProjectChanges} from '../src/lib/booklet-save-merge.js';
import {deriveBookletCover} from '../src/lib/booklet-cover.js';

const question=(id,parts=[])=>({id,type:'question',bankRef:{id:'bank-'+id,revision:'r1'},snapshotKind:'bank',content:{id:id+'-root',type:'question',prompt:'Find $x$.',children:parts.map((height,i)=>({id:id+'-'+i,type:'part',label:String.fromCharCode(97+i),prompt:'Part',height,answer:{short:'1',worked:'$x=1$'}})),answer:{short:'1',worked:'$x=1$'}},height:20});
export const fixture=()=>normalizeEditableProject({format:'mathsmap-booklet-project-v4',version:4,id:'flow-test',title:'Flexible fixture',settings:{paginationMode:'flexible'},topics:[{id:'topic-a',title:'First topic'},{id:'topic-b',title:'Second topic'}],sections:[{id:'a',topicId:'topic-a',title:'Foundation',phase:'practice',role:'practice',blocks:[question('q1'),question('q2')]},{id:'b',topicId:'topic-b',title:'Development',phase:'practice',role:'practice',blocks:[question('q3')]}]});
const measure=async page=>({capacity:100,height:page.blocks.reduce((h,b)=>h+(b.content?.children?.length?b.content.children.reduce((s,c)=>s+c.height,0):b.height??10),0)});

test('Linear conversion preserves all source content and joins explicit continuations',()=>{
 const original=JSON.parse(readFileSync('tests/fixtures/booklets/linear-legacy-layout.json','utf8')),before=JSON.stringify(original),p=convertToFlexible(original);
 assert.equal(p.settings.paginationMode,'flexible');assert.equal(p.topics.length,14);assert.equal(JSON.stringify(original),before);
 assert.equal(p.sections.flatMap(s=>s.blocks).length,original.sections.flatMap(s=>s.blocks).length);
 for(const b of p.sections.flatMap(s=>s.blocks)){const source=original.sections.flatMap(s=>s.blocks).find(x=>x.id===b.id);assert.deepEqual(b.content,source.content);assert.deepEqual(b.bankRef,source.bankRef);assert.deepEqual(b.classification,source.classification);}
 assert.equal(logicalUnits(p).find(u=>u.id==='page-17-q2').blocks.length,4);
 const n=flowNumbers(p);assert.equal(n['page-17-q2'],n['page-20-q2']);assert.equal(n['page-78-q8'],n['page-79-q8']);
 assert.equal(validateEditableProject(p).valid,true);
});
test('moves preserve IDs and content; copies remap local layout references and keep bank pins',()=>{
 const p=fixture();p.settings.layoutOverrides.answerSpaces={'q1-root':33};
 p.studio={version:1,atoms:{'q1-root':{title:'Solve a linear equation',skillIds:['linear']}},lineage:{},flags:[]};
 const moved=flowCommand(p,{type:'move',ids:['q1'],sectionId:'b',beforeId:'q3'});
 assert.deepEqual(moved.sections[1].blocks.map(b=>b.id),['q1','q3']);assert.equal(flowNumbers(moved).q1,1);assert.equal(flowNumbers(moved).q3,2);
 const clip=captureFlowClipboard(p,['q1']);const pasted=flowCommand(p,{type:'paste',clipboard:clip,sectionId:'b'});const b=pasted.sections[1].blocks.at(-1);
 assert.notEqual(b.id,'q1');assert.deepEqual(b.bankRef,p.sections[0].blocks[0].bankRef);assert.equal(pasted.settings.layoutOverrides.answerSpaces[b.content.id],33);
 assert.deepEqual(pasted.studio.atoms[b.content.id],p.studio.atoms['q1-root']);
 assert.equal(validateEditableProject(pasted).valid,true,validateEditableProject(pasted).errors.join('; '));
});

test('source layout preserves every original page boundary, mixed page and question number',async()=>{
 const source=JSON.parse(readFileSync('tests/fixtures/booklets/linear-legacy-layout.json','utf8')),p=convertToFlexible(source);
 const result=await paginateFlow(p,'student',async()=>({height:1,capacity:10000}));
 assert.deepEqual(result.pages.map(p=>p.blocks.map(b=>b.id)),source.sections.map(s=>s.blocks.map(b=>b.id)));
 assert.equal(result.pages.length,93);assert.equal(result.issues.length,0);
 const n=flowNumbers(p);
 for(const b of p.sections.flatMap(s=>s.blocks).filter(isPractice))assert.equal(n[b.id],b.sourceOrder,b.id);
 assert.equal(n['page-35-q10'],10);assert.equal(n['page-35-q11'],11);
 assert.equal(n['page-37-q16'],16);assert.equal(n['page-39-q1'],1);
 const mixed=p.sections.find(s=>s.blocks.some(b=>b.id==='page-37-q16'));
 assert.equal(mixed.pageBreakBefore,false);assert.equal(mixed.showDifficultyHeading,false);
 assert.equal(result.pages[36].blocks.at(-1).id,'page-37-q16');
 const originalPages=source.sections.map(s=>({id:s.id,pageNumber:s.sourcePageNumber,section:s,blocks:s.blocks}));
 assert.deepEqual(deriveBookletCover(result.pages).contents,deriveBookletCover(originalPages).contents);
 const restarted=p.sections.find(s=>s.blocks.some(b=>b.id==='page-39-q1'));
 assert.equal(restarted.numberingStart,1);
 restarted.blocks.unshift(question('bridge-before-restart'));
 assert.equal(flowNumbers(p)['bridge-before-restart'],1);assert.equal(flowNumbers(p)['page-39-q1'],2);
 const contentsWithNewTopic=deriveBookletCover([...result.pages,{flexible:true,pageNumber:94,mode:'student',section:{topicId:'new-topic',topicTitle:'New topic',phase:'teaching'},blocks:[{id:'new-definition',content:'A new topic'}]}]).contents;
 assert.deepEqual(contentsWithNewTopic.at(-1),{title:'New topic',pageNumber:94});
});

test('whole-question arrangements retain intentional empty columns',()=>{
 const source=JSON.parse(readFileSync('tests/fixtures/booklets/linear-legacy-layout.json','utf8'));
 const block=source.sections.flatMap(s=>s.blocks).find(b=>b.id==='page-49-q11');
 const layouts=source.settings.layoutOverrides.blockLayouts;
 assert.deepEqual(fragmentLayouts([block],layouts)[block.id],layouts[block.id]);
});

test('imported breaks remain editable and answer editions ignore them',async()=>{
 const p=fixture();p.sections=[p.sections[0]];
 const source={sections:[{sourcePageNumber:1,blocks:[{...p.sections[0].blocks[0],sourceOrder:1}]},{sourcePageNumber:2,blocks:[{...p.sections[0].blocks[1],sourceOrder:2}]}]};
 const matched=matchSourceLayout(p,source);
 assert.equal((await paginateFlow(matched,'student',measure)).pages.length,2);
 assert.equal((await paginateFlow(matched,'short',measure)).pages.length,1);
 const released=flowCommand(matched,{type:'layout',ids:['q2'],patch:{pageBreakBefore:false}});
 assert.equal((await paginateFlow(released,'student',measure)).pages.length,1);
 matched.sections[0].blocks.splice(1,0,{...question('bridge'),height:100});
 const changed=await paginateFlow(matched,'student',measure);
 assert.deepEqual(changed.pages.map(p=>p.blocks.map(b=>b.id)),[['q1'],['bridge'],['q2']]);
 assert.deepEqual(flowNumbers(matched),{q1:1,bridge:2,q2:3});
});

test('an existing continuation can begin beside the preceding question',async()=>{
 const p=fixture();p.sections=[p.sections[0]];
 p.sections[0].blocks=[question('q1'),{...question('q2'),height:70},{...question('q2-more'),height:90,flow:{continuationOf:'q2'}}];
 const r=await paginateFlow(p,'student',measure);
 assert.deepEqual(r.pages.map(p=>p.blocks.map(b=>b.id)),[['q1','q2'],['q2-more']]);
 assert.equal(r.pages[1].blocks[0].sourceOrder,2);
});
test('copying an arranged real question preserves its editable diagrams and validates',()=>{
 const source=JSON.parse(readFileSync('tests/fixtures/booklets/linear-legacy-layout.json','utf8')),p=convertToFlexible(source),blockId='page-39-q1',destination=p.sections.at(-1).id;
 const copied=flowCommand(p,{type:'paste',clipboard:captureFlowClipboard(p,[blockId]),sectionId:destination});
 assert.equal(validateEditableProject(copied).valid,true,validateEditableProject(copied).errors.join('; '));
 const b=copied.sections.at(-1).blocks.at(-1);assert.notEqual(b.id,blockId);assert.ok(copied.settings.layoutOverrides.blockLayouts[b.id]);
});
test('cut uses latest content and refuses stale deleted selections',()=>{
 const p=fixture(),clip=captureFlowClipboard(p,['q1'],'cut');p.sections[0].blocks[0].content.prompt='Updated';
 assert.equal(flowCommand(p,{type:'paste',clipboard:clip,sectionId:'b'}).sections[1].blocks.at(-1).content.prompt,'Updated');
 p.sections[0].blocks.shift();assert.throws(()=>flowCommand(p,{type:'paste',clipboard:clip,sectionId:'b'}),/deleted/);
});
test('cross-section move plus concurrent edit merges once; competing moves conflict',()=>{
 const base=fixture(),local=flowCommand(base,{type:'move',ids:['q1'],sectionId:'b'}),latest=structuredClone(base);latest.sections[0].blocks[0].content.prompt='Remote';
 const result=mergeProjectChanges(base,local,latest);assert.equal(result.conflicts.length,0);assert.equal(result.project.sections.flatMap(s=>s.blocks).filter(b=>b.id==='q1').length,1);assert.equal(result.project.sections[1].blocks.at(-1).content.prompt,'Remote');
 const other=structuredClone(base);other.sections.push({id:'c',blocks:[],title:'Third'});const moved=flowCommand(other,{type:'move',ids:['q1'],sectionId:'c'});assert.ok(mergeProjectChanges(base,local,moved).conflicts.length);
});
test('delete versus edited content exposes a conflict',()=>{
 const base=fixture(),local=flowCommand(base,{type:'delete',ids:['q1']}),latest=structuredClone(base);latest.sections[0].blocks[0].content.prompt='Remote';assert.ok(mergeProjectChanges(base,local,latest).conflicts.length);
});
test('deleted-section conflicts can restore edited content or keep the deletion',()=>{
 const base=fixture(),local=structuredClone(base),latest=structuredClone(base);local.sections.shift();latest.sections[0].blocks[0].content.prompt='Remote edit';
 const initial=mergeProjectChanges(base,local,latest),contentPath=initial.conflicts.find(c=>c.path.includes('flowEntities')).path;
 const keep=mergeProjectChanges(base,local,latest,{[contentPath]:'latest'});assert.ok(keep.conflicts.some(c=>c.path==='/sections/id=a'));
 const restored=mergeProjectChanges(base,local,latest,{[contentPath]:'latest','/sections/id=a':'latest'});assert.equal(restored.conflicts.length,0);assert.equal(restored.project.sections[0].id,'a');assert.equal(restored.project.sections[0].blocks[0].content.prompt,'Remote edit');
 const deleted=mergeProjectChanges(base,local,latest,{[contentPath]:'latest','/sections/id=a':'local'});assert.equal(deleted.conflicts.length,0);assert.equal(deleted.project.sections[0].id,'b');
});
test('pagination uses sections, exact fits, manual breaks and collapses empty pages',async()=>{
 const p=fixture();p.sections[0].blocks=[{id:'break',type:'page-break'},question('one'),{...question('two'),height:80},{id:'break2',type:'page-break'},{id:'break3',type:'page-break'},question('three')];
 const r=await paginateFlow(p,'student',measure);assert.deepEqual(r.pages.map(p=>p.blocks.map(b=>b.id)),[['one','two'],['three'],['q3']]);assert.equal(r.issues.length,0);
});
test('safe question continuations preserve numbering, parts and original content',async()=>{
 const p=fixture();p.sections[0].blocks=[question('long',[45,45,45,45,45])];const original=JSON.stringify(p);const r=await paginateFlow(p,'student',measure);
 assert.deepEqual(r.pages.slice(0,3).map(p=>p.blocks[0].content.children.length),[2,2,1]);assert.equal(r.pages[1].blocks[0].flow.fragment,1);assert.equal(r.pages[2].blocks[0].sourceOrder,1);assert.equal(JSON.stringify(p),original);
 const continued={...question('continued',[45,45]),flow:{fragment:1,sourceContinuationLabel:true}};continued.content.prompt='Question 2 continued.';
 const groups=questionSplitGroups(continued);
 assert.equal(fragmentQuestion(continued,[groups[0]],1).content.prompt,'Question 2 continued.');
 assert.equal(fragmentQuestion(continued,[groups[1]],2).content.prompt,'');
});

test('topic and tier headings appear once, including manual breaks and separate answers',async()=>{
 const p=fixture();
 p.sections.unshift(
  {id:'empty',topicId:'topic-a',title:'Empty',phase:'teaching',blocks:[]},
  {id:'breaks',topicId:'topic-a',title:'Teaching',phase:'teaching',blocks:[{id:'break-only',type:'page-break'}]},
  {id:'theory',topicId:'topic-a',title:'Teaching',phase:'teaching',blocks:[{id:'definition',type:'callout',content:'Definition',height:20}]});
 p.sections[3].blocks=[question('q1'),{...question('q2'),flow:{pageBreakBefore:true}}];
 p.sections.splice(4,0,{id:'development',topicId:'topic-a',title:'Development',phase:'practice',blocks:[question('q4')]});
 for(const edition of ['student','short','worked','with-short','with-worked']){
  const r=await paginateFlow(p,edition,measure);
  const streams=[...new Set(r.pages.map(page=>page.mode))];
  for(const mode of streams){
   const pages=r.pages.filter(page=>page.mode===mode);
   assert.deepEqual(pages.filter(page=>page.showTopicHeading).map(page=>page.section.topicId),['topic-a','topic-b']);
   assert.deepEqual(pages.filter(page=>page.showDifficultyHeading&&page.section.difficultyTitle).map(page=>page.section.difficultyTitle),['Foundation','Development','Development']);
   assert.ok(pages.every(page=>page.section.difficultyTitle!=='Teaching'));
   const continuation=pages.find(page=>page.blocks.some(b=>b.id==='q2'));
   assert.equal(continuation.showTopicHeading,false);assert.equal(continuation.showDifficultyHeading,false);
   assert.equal(continuation.section.topicTitle,'First topic');assert.equal(continuation.section.difficultyTitle,'Foundation');
  }
 }
});

test('heading-free continuation space is measured before splitting content',async()=>{
 const p=fixture();p.sections=[{...p.sections[0],blocks:[question('long',[40,40,40])]}];
 const measured=[];
 const r=await paginateFlow(p,'student',async page=>{
  const size=await measure(page);
  size.capacity-=page.showTopicHeading?20:0;size.capacity-=page.showDifficultyHeading?20:0;
  measured.push({continuation:page.continuation,capacity:size.capacity});return size;
 });
 assert.equal(r.issues.length,0);
 assert.deepEqual(r.pages.map(page=>page.blocks[0].content.children.map(part=>part.label)),[['a'],['b','c']]);
 assert.deepEqual(r.pages.map(page=>[page.showTopicHeading,page.showDifficultyHeading]),[[true,true],[false,false]]);
 assert.ok(measured.some(page=>page.continuation===0&&page.capacity===60));
 assert.ok(measured.some(page=>page.continuation===1&&page.capacity===100));
});
test('rows, shared diagrams, keep-together and dependencies prevent unsafe cuts',async()=>{
 const b=question('q',[60,60]);b.content.layout='grid';b.content.columns=2;assert.deepEqual(questionSplitGroups(b),[]);
 b.content.layout='list';b.content.questionDiagrams=[{id:'graph',format:'tikz',code:'graph'}];assert.deepEqual(questionSplitGroups(b),[]);
 delete b.content.questionDiagrams;b.content.children[1].dependsOn=[b.content.children[0].id];assert.deepEqual(questionSplitGroups(b),[]);
 const p=fixture();b.flow={keepTogether:true};p.sections[0].blocks=[b];assert.equal((await paginateFlow(p,'student',measure)).issues[0].kind,'oversized-content');
});
test('answers follow topic order and share question labels in all five editions',async()=>{
 const p=fixture();for(const edition of ['student','short','worked','with-short','with-worked']){const sections=flowEditionSections(p,edition);assert.equal(sections[0].blocks[0].sourceOrder,1);assert.equal((await paginateFlow(p,edition,measure)).issues.length,0);assert.equal(sections.length,edition.startsWith('with-')?4:2);}
});
test('explicit continuation respects the selected safe boundary and cancellation aborts',async()=>{
 const p=fixture();p.sections[0].blocks=[question('q',[20,20,20])];p.sections[0].blocks[0].flow={continueBefore:'q-1'};const r=await paginateFlow(p,'student',measure);assert.equal(r.pages[0].blocks[0].content.children.length,1);assert.equal(r.pages[1].blocks[0].content.children.length,2);
 await assert.rejects(paginateFlow(p,'student',measure,{cancelled:()=>true}),/superseded/);
});
test('empty generic copies remain editable without emitting blank pages',async()=>{
 const p=fixture();p.sections=[{id:'empty',title:'Empty',role:'practice',blocks:[]}];delete p.settings.paginationMode;
 const next=convertToFlexible(p);assert.equal(next.sections.length,1);assert.equal(validateEditableProject(next).valid,true);assert.equal((await paginateFlow(next,'student',measure)).pages.length,0);
});
test('flexible cover uses actual topic pages rather than imported source numbers',()=>{
 const pages=[{flexible:true,pageNumber:1,mode:'student',section:{phase:'front-matter'},blocks:[{id:'cover',content:'# Book'},{id:'contents',title:'Contents',content:'Old title .... 3'}]},
 {flexible:true,pageNumber:4,mode:'student',section:{phase:'teaching',topicId:'a',topicTitle:'Topic A'},blocks:[]},
 {flexible:true,pageNumber:7,mode:'student',section:{phase:'practice',topicId:'a',topicTitle:'Topic A'},blocks:[]},
 {flexible:true,pageNumber:8,mode:'student',section:{phase:'teaching',topicId:'b',topicTitle:'Topic B'},blocks:[]}];
 assert.deepEqual(deriveBookletCover(pages).contents,[{title:'Topic A',pageNumber:4},{title:'Topic B',pageNumber:8}]);
});
test('paragraph continuation keeps equations/tables atomic and never cuts a custom horizontal arrangement',async()=>{
 const p=fixture();const block={id:'text',type:'rich-text',content:{format:'maths-editor-document-v1',version:1,blocks:[{id:'p1',type:'paragraph',inlines:[{type:'text',text:'First'}]},{id:'p2',type:'paragraph',inlines:[{type:'text',text:'Second'}]}]}};p.sections[0].blocks=[block];
 const measured=async page=>({capacity:100,height:page.blocks.reduce((sum,b)=>sum+(b.content?.blocks?.length??0)*70,0)});
 const result=await paginateFlow(p,'student',measured);assert.equal(result.pages.filter(p=>p.section.sourceSectionId==='a').length,2);assert.equal(result.issues.length,0);
 p.settings.layoutOverrides.blockLayouts.text={arrangement:{version:1,root:{id:'row',type:'group',direction:'row',children:[{id:'left',type:'item',ref:'text/content#p1'},{id:'right',type:'item',ref:'text/content#p2'}]}}};
 assert.equal((await paginateFlow(p,'student',measured)).issues[0].kind,'oversized-content');
});
