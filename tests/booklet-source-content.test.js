import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditableProject,normalizeEditableProject,validateEditableProject} from '../src/lib/editable-booklet-model.js';
import {contentProject,sourceReferences} from '../src/lib/booklet-source-content.js';
import {organiseExercises} from '../src/lib/booklet-exercises.js';
import {inspectContentCoverage,contentVerificationKey,layoutVerificationKey} from '../src/lib/booklet-content-verification.js';
import {applySourceCorrection} from '../src/lib/booklet-source-corrections.js';
import {flowEditionSections,flowNumbers} from '../src/lib/booklet-flow.js';
import {makeFlowPage,paginateFlow} from '../src/lib/booklet-pagination.js';
const question=(id,score)=>({id,type:'question',sourceRefs:[{pageNumber:2}],flow:{localDifficulty:{reasoningScore:score,difficulty:'Foundation'}},content:{id:id+'-root',type:'question',prompt:'Simplify $x^2x^3$.',children:[],answer:{short:'$x^5$',worked:'$x^{2+3}=x^5$'}}});
const candidate=()=>({title:'New topic',topics:[{id:'t',title:'Powers'}],sections:[{id:'s',title:'Practice',role:'practice',phase:'practice',topicId:'t',blocks:[question('a',30),question('b',10)]}],sourceInventory:{version:1,pages:[{pageNumber:2,inventoried:true}],entries:[{id:'src-a',pageNumber:2,kind:'question',targetId:'a'},{id:'src-b',pageNumber:2,kind:'question',targetId:'b'}]}});
const imported=()=>contentProject(candidate(),{runId:'run',projectId:'new',selectedPages:[2]});

test('historical source layout identities do not collide with active content',()=>{
  const p=imported(),block=p.sections[0].blocks[0];
  block.sourceLayoutEvidence={original:structuredClone(block)};
  assert.equal(validateEditableProject(p).valid,true);
  p.sections[0].blocks.push(structuredClone(block));
  assert.equal(validateEditableProject(p).valid,false);
});

test('new compact editions exclude teaching answers without changing practice numbering; legacy opt-in survives',async()=>{
  const p=imported(),review={...question('review',20),pedagogyRole:'review'};
  p.sections[0].blocks.unshift(review);
  assert.equal(flowNumbers(p).review,undefined);
  const answers=flowEditionSections(p,'short').flatMap(s=>s.blocks);
  assert.equal(answers.find(b=>b.id==='review'),undefined);
  assert.equal(flowEditionSections(p,'worked').flatMap(s=>s.blocks).find(b=>b.id==='review'),undefined);
  p.settings.includeTeachingAnswers=true;
  assert.equal(flowEditionSections(normalizeEditableProject(p),'short').flatMap(s=>s.blocks).find(b=>b.id==='review').sourceOrder,'R1');
  assert.equal(answers.find(b=>b.id==='b').sourceOrder,1);
  delete review.content.answer;
  assert.ok((await inspectContentCoverage(p)).issues.some(i=>i.kind==='missing-answer'&&i.targetId==='review-root'));
  delete p.settings.includeTeachingAnswers;
  assert.ok(!flowEditionSections(p,'short').flatMap(s=>s.blocks).some(b=>b.id==='review'));
});

test('coverage catches invisible response prompts without mistaking a sibling image for shared context',async()=>{
  const p=imported(),root=p.sections[0].blocks[0].content;
  root.children=[{id:'visible',type:'part',prompt:'',questionDiagrams:[{id:'img',format:'image',src:'formula.png'}]}, {id:'empty',type:'part',prompt:'',mathematicalExpression:'x^2'}];
  assert.ok((await inspectContentCoverage(p)).issues.some(i=>i.kind==='missing-prompt'&&i.targetId==='empty'));
  root.questionDiagrams=[{id:'shared',format:'image',src:'shared.png'}];
  assert.ok(!(await inspectContentCoverage(p)).issues.some(i=>i.kind==='missing-prompt'&&i.targetId==='empty'));
});
test('new projects are compact; normalization and exact creation preserve opt-out',()=>{
  const p=createEditableProject();assert.equal(p.settings.flowEdition,'with-short');assert.equal(validateEditableProject(p).valid,true);
  assert.equal(normalizeEditableProject({settings:{}}).settings.compactAnswers,undefined);
  assert.equal(createEditableProject({mode:'exact'}).settings.paginationMode,undefined);
  assert.throws(()=>createEditableProject({mode:'bad'}),/mode/);
});

test('new compact projects calculate a cover without inventing source pages or migrating old projects',()=>{
  const p=imported();p.settings.cover={course:'Mathematics Stage 5',book:'Book 2'};
  const section=flowEditionSections(p,'student')[0];
  assert.equal(section.isCover,true);assert.equal(makeFlowPage(section,section.blocks).isCover,true);
  assert.match(section.blocks[0].content,/Book 2/);assert.equal(section.blocks[0].sourcePageNumber,undefined);
  assert.ok(!flowEditionSections(p,'short').some(s=>s.isCover));
  assert.ok(!flowEditionSections(p,'worked').some(s=>s.isCover));
  assert.equal(p.sections.length,1);
  delete p.settings.generatedCover;assert.ok(!flowEditionSections(p,'student').some(s=>s.isCover));
  p.settings.generatedCover=true;p.sections.unshift({id:'original-cover',phase:'front-matter',blocks:[{id:'source-cover',type:'rich-text',sourcePageNumber:1}]});
  assert.equal(flowEditionSections(p,'student').length,2);
});

test('syllabus front matter cannot consume the first exercise heading or contents destination',async()=>{
  const p=imported();p.sections.unshift({id:'syllabus',topicId:'t',phase:'front-matter',role:'front-matter',title:'Syllabus',blocks:[{id:'syllabus-text',type:'rich-text',content:'Syllabus content'}]});
  const map=await paginateFlow(p,'student',async()=>({height:10,capacity:250}));
  assert.equal(map.pages[0].isCover,true);
  assert.equal(map.pages[1].section.exerciseNumber,undefined);
  assert.equal(map.pages[2].section.exerciseNumber,1);
  assert.equal(map.pages[2].showTopicHeading,true);
});
test('semantic import preserves source references while local ratings sort independent practice',()=>{
  const p=imported();assert.deepEqual(p.sections[0].blocks.map(b=>b.id),['b','a']);assert.equal(validateEditableProject(p).valid,true);
  assert.equal(sourceReferences(p.sections[0].blocks[0])[0].pageNumber,2);
  assert.equal(p.sections[0].blocks[0].bankRef,null);
});
test('uncertain and unrated runs keep their source sequence',()=>{
  const raw=candidate();delete raw.sections[0].blocks[1].flow;
  const p=contentProject(raw,{runId:'run',projectId:'new',selectedPages:[2]});
  assert.deepEqual(p.sections[0].blocks.map(b=>b.id),['a','b']);assert.equal(p.studio.flags.length,1);
});
test('explicit page constraints survive exercise sorting',()=>{
  const p=imported();p.sections[0].blocks[0].flow.pageBreakBefore=true;
  assert.equal(organiseExercises(p).sections[0].blocks[0].flow.pageBreakBefore,true);
});
test('semantic import rejects wrong page references and unknown topics',()=>{
  assert.throws(()=>contentProject(candidate(),{selectedPages:[1]}),/unexpected source page/);
  const p=candidate();p.sections[0].topicId='unknown';assert.throws(()=>contentProject(p,{selectedPages:[2]}),/unknown topic/);
});
test('coverage never treats successful import as source verification',async()=>{
  const p=imported(),r=await inspectContentCoverage(p);assert.equal(r.complete,false);assert.equal(r.counts.unchecked,2);
  for(const e of p.source.inventory.entries)e.verification={checked:true,signature:await contentVerificationKey(p,e)};
  const checked=await inspectContentCoverage(p);assert.equal(checked.contentComplete,true,JSON.stringify(checked));assert.equal(checked.complete,false,'Content verification does not establish teaching/arrangement fidelity');
  p.sections[0].blocks.pop();assert.equal((await inspectContentCoverage(p)).counts.missing,1);
});
test('coverage detects duplicate mappings and supplied-answer gaps',async()=>{
  const p=imported();p.source.inventory.entries.push({...p.source.inventory.entries[0],id:'duplicate'});
  p.sections[0].blocks[0].content.answer.worked='';
  const r=await inspectContentCoverage(p);assert.equal(r.counts.duplicate,1);assert.ok(r.issues.some(i=>i.kind==='missing-answer'));
  p.sections[0].blocks[0].content.answer.worked={format:'maths-editor-document-v1',blocks:[]};
  assert.ok((await inspectContentCoverage(p)).issues.some(i=>i.kind==='missing-answer'));
});
test('verification cache follows content and teaching context, separately from layout',async()=>{
  const p=imported(),entry=p.source.inventory.entries[0];entry.teachingContextIds=['b'];
  const before=await contentVerificationKey(p,entry),layout=await layoutVerificationKey(p,{renderer:'1',fonts:'1',edition:'short'});
  p.sections[0].blocks[1].content.answerSpaceMm=60;p.settings.compactAnswers.shortFontPt=10;
  assert.equal(await contentVerificationKey(p,entry),before);
  assert.notEqual(await layoutVerificationKey(p,{renderer:'1',fonts:'1',edition:'short'}),layout);
  p.sections[0].blocks[0].content.prompt='A different taught method';
  assert.notEqual(await contentVerificationKey(p,entry),before);
});

test('changing shared question instructions invalidates a part check without invalidation from sibling spacing',async()=>{
  const p=imported(),root=p.sections[0].blocks[0].content;
  root.children=[{id:'part-a',type:'part',prompt:'$x^2$'},{id:'part-b',type:'part',prompt:'$x^3$'}];
  const entry={id:'source-part-a',targetId:'part-a',pageNumber:2},before=await contentVerificationKey(p,entry);
  root.children[1].answerSpaceMm=80;assert.equal(await contentVerificationKey(p,entry),before);
  root.prompt='Use a different shared instruction.';assert.notEqual(await contentVerificationKey(p,entry),before);
});

test('native document typography does not erase an unchanged content check',async()=>{
 const p=imported(),entry=p.source.inventory.entries[0],block=p.sections[0].blocks.find(b=>b.id===entry.targetId);
 block.content.prompt={format:'maths-editor-document-v1',blocks:[{type:'paragraph',fontSize:11,lineHeight:1.4,inlines:[{type:'math',latex:'x^2'}]}]};
 const before=await contentVerificationKey(p,entry);block.content.prompt.blocks[0].fontSize=10;block.content.prompt.blocks[0].lineHeight=1.2;
 assert.equal(await contentVerificationKey(p,entry),before);
 block.content.prompt.blocks[0].inlines[0].latex='x^3';assert.notEqual(await contentVerificationKey(p,entry),before);
});

test('confirmed corrections retain the original and reject stale edits',async()=>{
  const p=imported(),entry=p.source.inventory.entries[0],before=await contentVerificationKey(p,entry);
  const correction={id:'correction-a',targetId:'a-root',field:'answer/short',original:'$x^5$',corrected:'$x^{5}$',reason:'Notation correction',sourceRefs:[{pageNumber:2}]};
  const fixed=applySourceCorrection(p,correction);
  assert.equal(p.sections[0].blocks[1].content.answer.short,'$x^5$');
  assert.deepEqual(fixed.source.corrections,[correction]);
  assert.notEqual(await contentVerificationKey(fixed,entry),before);
  assert.deepEqual(applySourceCorrection(fixed,correction),fixed);
  assert.throws(()=>applySourceCorrection(p,{...correction,original:'stale'}),/stale/);
});

test('unresolved findings and placeholder worked answers prevent readiness',async()=>{
  const p=imported();
  for(const e of p.source.inventory.entries)e.verification={checked:true,signature:await contentVerificationKey(p,e)};
  p.studio={flags:[{id:'diagram',targetId:'a',note:'Diagram label unreadable',resolved:false}]};
  assert.equal((await inspectContentCoverage(p)).complete,false);
  p.studio.flags=[];
  p.sections[0].blocks[0].content.answer.provenance={worked:'source-short-only'};
  assert.ok((await inspectContentCoverage(p)).issues.some(i=>i.kind==='missing-worked-solution'));
});

test('part dependencies move their entire intervening question group together',()=>{
  const c=candidate();c.sections[0].blocks=[question('a',40),question('b',10),question('c',20),question('d',5)];
  c.sections[0].blocks[2].content.dependsOn=['a-root'];
  const p=contentProject(c,{selectedPages:[2]});
  assert.deepEqual(p.sections[0].blocks.map(b=>b.id),['d','a','b','c']);
  const raw=candidate();raw.sections.splice(1,0,{id:'teaching',phase:'teaching',role:'teaching',topicId:'t',blocks:[]},{...raw.sections[0],id:'second',blocks:[question('c',1)]});
  assert.deepEqual(contentProject(raw,{selectedPages:[2]}).sections.map(s=>s.blocks.map(b=>b.id)),[['b','a'],[],['c']]);
});
