import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditableProject,normalizeEditableProject,validateEditableProject} from '../src/lib/editable-booklet-model.js';
import {contentProject,sourceReferences} from '../src/lib/booklet-source-content.js';
import {organiseExercises} from '../src/lib/booklet-exercises.js';
import {inspectContentCoverage,contentVerificationKey,layoutVerificationKey,contentNodes} from '../src/lib/booklet-content-verification.js';
import {applySourceCorrection} from '../src/lib/booklet-source-corrections.js';
import {flowEditionSections,flowNumbers} from '../src/lib/booklet-flow.js';
import {makeFlowPage,paginateFlow} from '../src/lib/booklet-pagination.js';
const question=(id,score)=>({id,type:'question',sourceRefs:[{pageNumber:2}],flow:{localDifficulty:{reasoningScore:score,difficulty:'Foundation'}},content:{id:id+'-root',type:'question',prompt:'Simplify $x^2x^3$.',children:[],answer:{short:'$x^5$',worked:'$x^{2+3}=x^5$'}}});
const candidate=()=>({title:'New topic',topics:[{id:'t',title:'Powers'}],sections:[{id:'s',title:'Practice',role:'practice',phase:'practice',topicId:'t',blocks:[question('a',30),question('b',10)]}],sourceInventory:{version:1,pages:[{pageNumber:2,inventoried:true}],entries:[{id:'src-a',pageNumber:2,kind:'question',targetId:'a'},{id:'src-b',pageNumber:2,kind:'question',targetId:'b'}]}});
const imported=()=>contentProject(candidate(),{runId:'run',projectId:'new',selectedPages:[2]});

test('compact coalescing preserves source section identities including empty difficulty headings',async()=>{
  const c=candidate();c.settings={questionOrder:'source'};
  c.sections.push({id:'development',title:'DEVELOPMENT',phase:'practice',topicId:'t',sourcePageNumber:2,blocks:[]},
    {id:'later-source-section',title:'Later practice',phase:'practice',topicId:'t',sourcePageNumber:2,blocks:[question('later',40)]});
  c.sourceInventory.entries.push({id:'source-development',pageNumber:2,kind:'teaching',targetId:'development'},
    {id:'source-later-section',pageNumber:2,kind:'teaching',targetId:'later-source-section'});
  const p=contentProject(c,{runId:'run',projectId:'new',selectedPages:[2]}),nodes=contentNodes(p);
  assert.equal(p.sections.length,1);
  assert.equal(nodes.get('development').node.title,'DEVELOPMENT');
  assert.equal(nodes.get('development').block.id,'later');
  assert.equal(nodes.get('later-source-section').node.title,'Later practice');
  assert.equal(validateEditableProject(p).valid,true);
  assert.ok(!(await inspectContentCoverage(p)).rows.some(row=>row.state==='missing'));
  assert.deepEqual(organiseExercises(p).sections[0].sourceSections,p.sections[0].sourceSections);
  assert.equal(c.sections[1].blocks.length,0);
  const exact=contentProject(c,{runId:'run',projectId:'exact',mode:'exact',selectedPages:[2]});
  assert.equal(exact.sections.length,3);assert.equal(exact.sections[0].sourceSections,undefined);
});

test('semantic creation retains reviewed answer diagram widths alongside compact defaults',()=>{
  const c=candidate();c.settings={compactAnswers:{diagramWidths:{spinner:{short:75,worked:110}}}};
  const p=contentProject(c,{runId:'run',projectId:'new',selectedPages:[2]});
  assert.deepEqual(p.settings.compactAnswers.diagramWidths,c.settings.compactAnswers.diagramWidths);
  assert.equal(p.settings.compactAnswers.shortFontPt,9);
  assert.equal(p.settings.flowEdition,'with-short');
  p.settings.compactAnswers.diagramWidths.spinner.short=50;
  assert.equal(c.settings.compactAnswers.diagramWidths.spinner.short,75);
});

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

test('explicit source boundaries survive compact import with source order and compact answers',()=>{
  const raw=candidate();raw.settings={sourcePaginationPolicy:'source-boundaries'};
  raw.sections[0].sourcePageNumber=2;
  raw.sections[0].blocks[0].flow.sourcePageBreakBefore=true;
  const second=question('c',1);second.sourceRefs=[{pageNumber:3}];second.flow.sourcePageBreakBefore=true;
  raw.sections.push({...raw.sections[0],id:'s3',sourcePageNumber:3,blocks:[second]});
  const p=contentProject(raw,{runId:'run',projectId:'new',selectedPages:[2,3]});
  assert.equal(p.settings.paginationMode,'flexible');
  assert.equal(p.settings.preserveSourcePages,true);
  assert.deepEqual(p.sections.map(s=>s.blocks.map(b=>b.id)),[['a','b'],['c']]);
  assert.ok(p.sections.every(s=>s.blocks[0].flow.sourcePageBreakBefore));
  assert.equal(p.settings.compactAnswers.shortFontPt,9);
  assert.ok(!p.settings.includeTeachingAnswers);
  assert.ok(!(p.studio?.flags??[]).some(f=>f.id.startsWith('sequence-')));
  const normal=candidate();normal.sections[0].blocks[0].flow.sourcePageBreakBefore=true;
  const compact=contentProject(normal,{selectedPages:[2]});
  assert.equal(compact.settings.preserveSourcePages,false);
  assert.deepEqual(compact.sections[0].blocks.map(b=>b.id),['b','a']);
  assert.ok(compact.sections[0].blocks.every(b=>!b.flow.sourcePageBreakBefore));
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

test('mapped whole question roots cover their wrappers but isolated parts do not',async()=>{
 const p=imported(),block=p.sections[0].blocks[0];
 const entry=p.source.inventory.entries.find(e=>e.targetId===block.id);
 entry.targetId=block.content.id;
 assert.ok(!(await inspectContentCoverage(p)).issues.some(i=>i.kind==='unmapped-content'&&i.targetId===block.id));
 entry.kind='part';
 assert.ok((await inspectContentCoverage(p)).issues.some(i=>i.kind==='unmapped-content'&&i.targetId===block.id));
});

test('syllabus wrappers require all paragraph and list branches to be inventoried',async()=>{
 const p=imported();
 const syllabus={id:'syllabus',type:'rich-text',content:{format:'maths-editor-document-v1',blocks:[
  {id:'outcome',type:'paragraph',inlines:[{type:'text',text:'Outcome statement'}]},
  {id:'bullets',type:'list',items:[{id:'bullet',type:'list-item',blocks:[{id:'bullet-text',type:'paragraph',inlines:[{type:'text',text:'Content bullet'}]}]}]}
 ]}};
 p.sections.unshift({id:'source-contents-continuation',blocks:[]},{id:'syllabus-section',blocks:[syllabus]});
 p.source.inventory.entries.push(...['outcome','bullet'].map(id=>({id:'source-'+id,targetId:id,kind:'syllabus',pageNumber:2})));
 let report=await inspectContentCoverage(p);
 assert.ok(!report.issues.some(i=>i.kind==='unmapped-content'&&['syllabus','source-contents-continuation'].includes(i.targetId)));
 syllabus.content.blocks.push({id:'unrecorded',type:'paragraph',inlines:[{type:'text',text:'An extra statement'}]});
 assert.ok((await inspectContentCoverage(p)).issues.some(i=>i.kind==='unmapped-content'&&i.targetId==='syllabus'));
});

test('source part decomposition requires a whole source part and explicit response declarations',async()=>{
 const p=imported(),block=p.sections[0].blocks[0],entry=p.source.inventory.entries.find(e=>e.targetId===block.id);
 const leaf={id:'native-response',type:'part',prompt:'Compare the two counts.',answer:{short:'2:3',worked:'Count both quantities.'}};
 const owner={id:'source-part',type:'part',children:[leaf]};block.content.children=[owner];
 p.source.inventory.entries.push({id:'source-a',targetId:owner.id,kind:'part',pageNumber:2,parentId:entry.id});
 block.sourceReview={responses:[{targetId:leaf.id,kind:'short'}]};
 const unmapped=async()=> (await inspectContentCoverage(p)).issues.some(i=>i.kind==='unmapped-content'&&i.targetId===leaf.id);
 assert.equal(await unmapped(),false);
 p.source.inventory.entries.at(-1).field='/prompt';assert.equal(await unmapped(),true);
 delete p.source.inventory.entries.at(-1).field;block.sourceReview.responses=[];assert.equal(await unmapped(),true);
 block.sourceReview.responses=[{targetId:leaf.id,kind:'short'}];p.source.inventory.entries.at(-1).kind='question';assert.equal(await unmapped(),true);
});

test('one-question teaching wrappers require a complete original identity and no extra stem',async()=>{
 const p=imported(),block=p.sections[0].blocks[0],entry=p.source.inventory.entries.find(e=>e.targetId===block.id);
 const child={id:'source-key-idea',type:'part',prompt:'Complete the source sentence.',answer:{short:'factor',worked:'Use the common factor.'}};
 block.content={id:'key-idea-group',type:'group',prompt:'',children:[child]};entry.targetId=child.id;entry.sourceLabel='1';
 block.sourceReview={sourceQuestionIdentities:[{targetId:child.id,pageNumber:entry.pageNumber,sourceLabel:'1'}]};
 const unmapped=async()=> (await inspectContentCoverage(p)).issues.some(i=>i.kind==='unmapped-content'&&i.targetId===block.id);
 assert.equal(await unmapped(),false);block.content.prompt='Additional unrecorded teaching.';assert.equal(await unmapped(),true);
 block.content.prompt='';entry.field='/prompt';assert.equal(await unmapped(),true);
});

test('grouped question ownership requires every original whole-question identity',async()=>{
 const p=imported(),block=p.sections[0].blocks[0],entry=p.source.inventory.entries.find(e=>e.targetId===block.id);
 const a={id:'source-q3-root',type:'part',prompt:'First dataset',answer:{short:'3',worked:'Count three.'}},b={...structuredClone(a),id:'source-q4-root',prompt:'Second dataset'};
 block.content={id:'combined',type:'group',prompt:'Complete each frequency table.',children:[a,b]};
 entry.targetId=a.id;entry.sourceLabel='3';
 p.source.inventory.entries.push({id:'src-q4',targetId:b.id,kind:'question',sourceLabel:'4',pageNumber:2});
 block.sourceReview={sourceQuestionIdentities:[{targetId:a.id,sourceLabel:'3',pageNumber:2},{targetId:b.id,sourceLabel:'4',pageNumber:2}]};
 const unmapped=async()=> (await inspectContentCoverage(p)).issues.some(i=>i.kind==='unmapped-content'&&i.targetId===block.id);
 assert.equal(await unmapped(),false);
 block.sourceReview.sourceQuestionIdentities[1].pageNumber=3;assert.equal(await unmapped(),true);
 block.sourceReview.sourceQuestionIdentities[1].pageNumber=2;
 p.source.inventory.entries.at(-1).kind='part';assert.equal(await unmapped(),true);
 p.source.inventory.entries.at(-1).kind='question';p.source.inventory.entries.at(-1).field='/prompt';assert.equal(await unmapped(),true);
 delete p.source.inventory.entries.at(-1).field;
 block.content.children.push({...structuredClone(a),id:'unrecorded-third'});assert.equal(await unmapped(),true);
});

test('worked-example ownership covers all complete examples or all permanent payloads',async()=>{
 const p=imported(),paragraph={id:'example-prompt',type:'paragraph',inlines:[{type:'text',text:'Compare these distributions.'}]};
 const block={id:'examples',type:'worked-example',examples:[{id:'left-example',label:'',prompt:'Find the mode.'},{id:'right-example',label:'',prompt:'Find both modes.'}]};
 p.sections[0].blocks.push(block);
 p.source.inventory.entries.push(...block.examples.map(e=>({id:'src-'+e.id,targetId:e.id,kind:'example',pageNumber:2})));
 const unmapped=async()=> (await inspectContentCoverage(p)).issues.some(i=>i.kind==='unmapped-content'&&i.targetId===block.id);
 assert.equal(await unmapped(),false);
 p.source.inventory.entries.at(-1).field='/prompt';assert.equal(await unmapped(),true);
 p.source.inventory.entries.splice(-2);
 block.examples=[{id:'permanent-content',label:'',prompt:{format:'maths-editor-document-v1',blocks:[paragraph]},questionDiagrams:[{id:'shape',format:'svg',code:'<svg/>'}]}];
 p.source.inventory.entries.push({id:'source-caption',targetId:paragraph.id,field:'/inlines',kind:'teaching',pageNumber:2},{id:'source-shape',targetId:'shape',kind:'diagram',pageNumber:2});
 assert.equal(await unmapped(),false);
 block.examples[0].prompt.blocks.push({id:'extra-caption',type:'paragraph',inlines:[{type:'text',text:'Extra unrecorded claim.'}]});assert.equal(await unmapped(),true);
 block.examples[0].prompt.blocks.pop();block.examples[0].theorySolution='Unrecorded explanation.';assert.equal(await unmapped(),true);
 delete block.examples[0].theorySolution;p.source.inventory.entries.pop();assert.equal(await unmapped(),true);
 p.source.inventory.entries.push({id:'source-shape',targetId:'shape',kind:'diagram',pageNumber:2});block.title='Unrecorded heading';assert.equal(await unmapped(),true);
});

test('native scaffold response ownership requires the exact source completion and parent',async()=>{
 const p=imported(),block=p.sections[0].blocks[0],entry=p.source.inventory.entries.find(e=>e.targetId===block.id);
 entry.targetId=block.content.id;
 const table={id:'completion-table',type:'table',rows:[[{type:'cell',blocks:[{type:'paragraph',inlines:[{type:'cloze',answer:'4',width:10}]}]}]]};
 const response={id:'table-response',type:'part',label:'',prompt:{format:'maths-editor-document-v1',blocks:[table]},responseSpace:'scaffold',answerSpaceMm:0,answer:{short:'4',worked:'Complete the table with 4.'}};
 block.content.children=[response];block.sourceReview={responses:[{targetId:response.id,kind:'cloze'}]};
 const source={id:'source-table',targetId:table.id,kind:'diagram',pageNumber:2,parentId:entry.id,responseKind:'cloze',expectedAnswer:'4'};
 p.source.inventory.entries.push(source);
 const unmapped=async()=> (await inspectContentCoverage(p)).issues.some(i=>i.kind==='unmapped-content'&&i.targetId===response.id);
 assert.equal(await unmapped(),false);
 source.parentId='another-question';assert.equal(await unmapped(),true);source.parentId=entry.id;
 delete source.expectedAnswer;assert.equal(await unmapped(),true);source.expectedAnswer='4';
 response.prompt.blocks.push({id:'extra',type:'paragraph',inlines:[{type:'text',text:'Additional task.'}]});assert.equal(await unmapped(),true);response.prompt.blocks.pop();
 response.label='a';assert.equal(await unmapped(),true);response.label='';
 response.answer.worked='';assert.ok((await inspectContentCoverage(p)).issues.some(i=>i.kind==='missing-answer'&&i.targetId===response.id));
});

test('only an empty block matching its exact excluded source footer is evidence-only',async()=>{
 const p=imported(),footer={id:'source-footer',type:'rich-text',content:'',sourcePageNumber:2};
 p.sections[0].blocks.push(footer);p.source.inventory.entries.push({id:footer.id,kind:'footer',pageNumber:2,exclusionReason:'Renderer owns page numbering.'});
 const unmapped=async()=> (await inspectContentCoverage(p)).issues.some(i=>i.kind==='unmapped-content'&&i.targetId===footer.id);
 assert.equal(await unmapped(),false);
 footer.content='Additional source text';assert.equal(await unmapped(),true);footer.content='';
 footer.sourcePageNumber=3;assert.equal(await unmapped(),true);footer.sourcePageNumber=2;
 p.source.inventory.entries.at(-1).kind='teaching';assert.equal(await unmapped(),true);
 p.source.inventory.entries.at(-1).kind='footer';footer.sourceAtom={id:'extra-heading',label:'Additional heading'};assert.equal(await unmapped(),true);
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
