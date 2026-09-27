import test from 'node:test';
import assert from 'node:assert/strict';
import {createAssignmentPlan,assignmentPayload} from '../scripts/booklet/author-assignments.mjs';
import {practiceCategoryHeadingOwnership,assignmentCategoryHeadings,projectPracticeCategoryMappings} from '../scripts/booklet/practice-category-headings.mjs';
import {COMPACT_RECONSTRUCTION_PROMPT,COMPACT_SCHEMA} from '../scripts/booklet/token-efficient-prompts.mjs';
import {contentProject} from '../src/lib/booklet-source-content.js';
import {contentNodes} from '../src/lib/booklet-content-verification.js';

// Reduced source shapes from the reviewed Concept Maths Adv11 Ch02 inventories.
const p15=()=>({pageNumber:15,groups:[{id:'p15-practice-category',kind:'practice-category',header:'essential problems',entryId:'p15-essential',authoringBlocks:['p15-g19-28','p15-q29','p15-q30']}],entries:[
 {id:'p15-essential',targetId:'p15-essential',kind:'group',sourceLabel:'essential problems',description:'essential problems'},
 {id:'p15-g19-28',targetId:'p15-g19-28',kind:'group',parentId:'p15-essential',sharedStemId:'p15-g19-28',sourceLabel:'19–28'},
 ...Array.from({length:10},(_,i)=>({id:`p15-q${19+i}`,targetId:`p15-g19-28-${i}`,kind:'question',parentId:'p15-g19-28',sharedStemId:'p15-g19-28',sourceLabel:String(19+i)})),
 ...[29,30].map(n=>({id:`p15-q${n}`,targetId:`p15-q${n}`,kind:'question',parentId:'p15-essential',sourceLabel:String(n)}))
]});
const p69=()=>({pageNumber:69,groups:[{id:'p69-additional-practice',kind:'practice',header:'additional practice',headingRole:'Category heading, not a teaching activity band.',questionIds:[17,18,19,20,21,22].map(n=>`p69-q${n}`)}],entries:[17,18,19,20,21,22].map(n=>({id:`p69-q${n}`,targetId:`p69-q${n}`,kind:'question',sourceLabel:`${n}.`}))});
const p51=()=>({pageNumber:51,groups:[
 {id:'p51-essential-continuation',kind:'practice-category',header:'essential problems',headingVisibleOnTarget:false,members:['p51-q63']},
 {id:'p51-additional-practice',kind:'practice-category',header:'additional practice',members:['p51-g64-69','p51-q74']}
],entries:[{id:'p51-q63',kind:'question'},
 {id:'p51-additional-practice',targetId:'p51-additional-practice',kind:'group',sourceLabel:'additional practice',description:'additional practice'},
 {id:'p51-g64-69',targetId:'p51-task64-69',kind:'group',parentId:'p51-additional-practice',sharedStemId:'p51-g64-69'},
 ...Array.from({length:6},(_,i)=>({id:`p51-q${64+i}`,targetId:`p51-task64-69-${i}`,kind:'question',parentId:'p51-g64-69',sharedStemId:'p51-g64-69'})),
 {id:'p51-q74',kind:'question',parentId:'p51-additional-practice'}
]});
function headingPacket(inventory,{label=true,nativeMapping=false}={}){
 const record=practiceCategoryHeadingOwnership(inventory).find(r=>r.status==='start'),paragraphId=`p${inventory.pageNumber}-category-heading`;
 const block={id:record.ownerTargetId,type:'question',sourcePageNumber:inventory.pageNumber,sourceRefs:[{pageNumber:inventory.pageNumber}],sourceReview:{sourcePages:[inventory.pageNumber],headerOwnedByTemplate:true,sourceCategoryHeading:{sourceGroupId:record.sourceGroupId,...(record.sourceInventoryId?{sourceInventoryId:record.sourceInventoryId}:{}),targetId:paragraphId,...(label?{label:record.label}:{}),placement:'One native paragraph above the first numbered question'}},content:{id:record.ownerTargetId+'-root',type:'question',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:paragraphId,type:'paragraph',align:'right',inlines:[{type:'text',text:record.label,marks:['bold']}]},{id:'instruction',type:'paragraph',inlines:[{type:'text',text:'Source question instruction.'}]}]},children:[{id:inventory.entries.find(e=>e.id===record.firstQuestionInventoryId).targetId??record.firstQuestionInventoryId,type:'part',prompt:'Question',answer:{short:'Answer',worked:'Method'}}]}};
 return {pageNumber:inventory.pageNumber,sections:[{id:'source-category-section',title:record.label,topicId:'functions',phase:'practice',blocks:[block]}],inventoryMappings:[{inventoryId:record.ownerInventoryId,targetId:block.id},...(record.sourceInventoryId?[{inventoryId:record.sourceInventoryId,targetId:nativeMapping?paragraphId:'source-category-section',field:nativeMapping?'/inlines':'/title'}]:[])]};
}
const task=inventory=>({page:inventory.pageNumber,inventory,promptSections:[],images:[],evidence:[],contextPages:[],teacherPages:[]});

test('p15 binds the real heading to the first complete shared task under tight budgets',()=>{
 const inventory=p15(),before=structuredClone(inventory),plan=createAssignmentPlan([inventory],{maxCharacters:1});
 assert.deepEqual(plan.assignments.map(a=>a.questions),[1,1,1]);
 assert.deepEqual(plan.assignments[0].inventoryIds,inventory.entries.slice(0,12).map(e=>e.id));
 const headings=plan.assignments.flatMap(a=>assignmentCategoryHeadings(inventory,a.inventoryIds));
 assert.equal(headings.filter(h=>h.ownsHeading).length,1);
 assert.equal(headings[0].firstQuestionInventoryId,'p15-q19');
 assert.equal(headings[0].ownerInventoryId,'p15-g19-28');
 assert.equal(headings[0].sourceInventoryId,'p15-essential');
 assert.deepEqual(inventory,before);
});

test('p69 group-only category keeps the true first owner in every assignment context',()=>{
 const inventory=p69(),plan=createAssignmentPlan([inventory],{maxQuestions:2}),payloads=plan.assignments.map(a=>assignmentPayload(a,[task(inventory)]));
 assert.equal(plan.assignments.length,3);
 assert.equal(payloads.filter(p=>p.context.categoryHeadings[0].ownsHeading).length,1);
 for(const payload of payloads){
  const heading=payload.context.categoryHeadings[0];
  assert.equal(heading.firstQuestionInventoryId,'p69-q17');
  assert.equal('sourceInventoryId' in heading,false);
  assert.deepEqual(payload.context.groups[0].questionIds,inventory.groups[0].questionIds);
  assert.match(payload.prompt,/section title is insufficient/);
  assert.match(payload.prompt,/status:needs-review requires an explicit finding/);
 }
 assert.deepEqual(plan.assignments.flatMap(a=>a.inventoryIds),inventory.entries.map(e=>e.id));
 const packet=headingPacket(inventory);
 assert.deepEqual(projectPracticeCategoryMappings(packet,inventory),packet.inventoryMappings);
});

test('p51 continuation metadata cannot produce a repeated heading or take the later start',()=>{
 const inventory=p51(),records=practiceCategoryHeadingOwnership(inventory),plan=createAssignmentPlan([inventory],{maxQuestions:1});
 assert.equal(records[0].status,'continuation');
 assert.equal(records[1].firstQuestionInventoryId,'p51-q64');
 assert.equal(records[1].ownerTargetId,'p51-task64-69');
 assert.equal(plan.assignments.flatMap(a=>assignmentCategoryHeadings(inventory,a.inventoryIds)).filter(h=>h.ownsHeading).length,1);
});

test('source continuation flags and prose are respected and unknown boundaries are findings',()=>{
 const inventory=p69();
 for(const continuation of [{headingPrintedOnTargetPage:false},{headerVisibleOnTargetPage:false},{continuedFrom:{pdfPage:68}},{headingAppearance:'No category heading is repeated on page 69.'},{headingVisibility:'Category heading is not repeated on the target page.'},{headerEvidence:'Continued without a repeated category heading on page 69.'}]){
  inventory.groups[0]={...p69().groups[0],...continuation};
  assert.equal(practiceCategoryHeadingOwnership(inventory)[0].status,'continuation');
  assert.equal(assignmentCategoryHeadings(inventory,inventory.entries.map(e=>e.id))[0].ownsHeading,false);
 }
 inventory.groups[0]={id:'unresolved-category',kind:'practice-category',header:'additional practice'};
 const payload=assignmentPayload(createAssignmentPlan([inventory]).assignments[0],[task(inventory)]);
 assert.equal(payload.context.categoryHeadings[0].status,'needs-review');
 assert.equal(payload.context.categoryHeadings[0].ownsHeading,false);
 assert.match(payload.context.categoryHeadings[0].finding,/explicit first question/);
 inventory.groups[0]={id:'main-band',kind:'practice',header:'chapter 2 review set one',headingType:'main-topic-band'};
 assert.deepEqual(practiceCategoryHeadingOwnership(inventory),[]);
});

test('p15 native paragraph mapping survives compact exercise organisation and retains the obsolete mapping',()=>{
 const inventory=p15(),packet=headingPacket(inventory),before=structuredClone(packet);
 const mappings=projectPracticeCategoryMappings(packet,inventory),mapping=mappings.find(m=>m.inventoryId==='p15-essential');
 assert.equal(mapping.targetId,'p15-category-heading');assert.equal(mapping.field,'/inlines');
 assert.deepEqual(mapping.sourceCategoryHeadingMapping.originalMapping,before.inventoryMappings[1]);
 assert.deepEqual(packet,before);
 const candidate={title:'Functions',topics:[{id:'functions',title:'Functions'}],sections:packet.sections,sourceInventory:{entries:[{...inventory.entries[0],...mapping,pageNumber:15}]}};
 const project=contentProject(candidate,{runId:'source-run',projectId:'functions',selectedPages:[15]});
 assert.notEqual(project.sections[0].title,'essential problems');
 const saved=project.source.inventory.entries[0];
 assert.equal(contentNodes(project).get(saved.targetId).node.inlines[0].text,'essential problems');
 assert.deepEqual(saved.sourceCategoryHeadingMapping.originalMapping,before.inventoryMappings[1]);
});

test('p51 existing declarations without label or sourceGroupId derive and verify the native source text',()=>{
 const inventory=p51(),packet=headingPacket(inventory,{label:false,nativeMapping:true});
 delete packet.sections[0].blocks[0].sourceReview.sourceCategoryHeading.sourceGroupId;
 assert.deepEqual(projectPracticeCategoryMappings(packet,inventory),packet.inventoryMappings);
 const changed=structuredClone(packet);changed.sections[0].blocks[0].content.prompt.blocks[0].inlines[0].text='essential problems';
 assert.throws(()=>projectPracticeCategoryMappings(changed,inventory),/text disagree/);
});

test('projection rejects fake entries, wrong owners/pages and conflicting declarations',()=>{
 const inventory=p15();
 const invalid=(change,pattern)=>{const packet=headingPacket(inventory);change(packet,packet.sections[0].blocks[0]);assert.throws(()=>projectPracticeCategoryMappings(packet,inventory),pattern);};
 invalid((p,b)=>b.sourceReview.sourceCategoryHeading.sourceInventoryId='invented',/real inventory heading/);
 invalid((p,b)=>b.sourceReview.sourceCategoryHeading.sourceInventoryId='p15-q19',/real inventory heading/);
 invalid((p,b)=>b.sourceReview.sourceCategoryHeading.sourceGroupId='another-group',/source group/);
 invalid((p,b)=>b.sourceReview.sourceCategoryHeading.label='enrichment',/text disagree/);
 invalid((p,b)=>b.content.prompt.blocks[0].inlines=[],/text disagree/);
 invalid((p,b)=>b.content.prompt.blocks[0].type='table',/native text paragraph/);
 invalid((p,b)=>{b.content.prompt.blocks[0].inlines[0]={type:'math',latex:'essential problems'};},/native text paragraph/);
 invalid((p,b)=>{b.sourcePageNumber=16;b.sourceRefs=[{pageNumber:16}];b.sourceReview.sourcePages=[16];},/source page/);
 invalid(p=>p.pageNumber=16,/source page mismatch/);
 invalid((p,b)=>{b.id='later-question';b.content.id='later-root';b.content.children=[];p.inventoryMappings[0].targetId='other-owner';},/first owning question/);
 invalid(p=>p.sections[0].blocks.push(structuredClone(p.sections[0].blocks[0])),/duplicate owner/);
 invalid(p=>p.inventoryMappings[1].targetId='unknown-section',/obsolete section title/);
 const continued=structuredClone(inventory);continued.groups[0].headingVisibleOnTarget=false;
 assert.throws(()=>projectPracticeCategoryMappings(headingPacket(inventory),continued),/continuation/);
});

test('compact contract keeps practice categories separate from template-owned headings',()=>{
 assert.match(COMPACT_RECONSTRUCTION_PROMPT,/actual source category start/);
 assert.match(COMPACT_RECONSTRUCTION_PROMPT,/Group-only metadata never creates an inventory ID/);
 assert.match(COMPACT_SCHEMA,/headerOwnedByTemplate covers main\/topic and teaching-group headings only/);
});

test('an explicitly classified source category can retain a book-specific label',()=>{
 const inventory={pageNumber:1,groups:[{id:'category',kind:'practice-category',header:'Further exploration',entryId:'heading',questionIds:['q']}],entries:[{id:'heading',kind:'group',sourceLabel:'Further exploration'},{id:'q',targetId:'question',kind:'question',parentId:'category'}]};
 const ownership=practiceCategoryHeadingOwnership(inventory)[0];
 assert.equal(ownership.label,'Further exploration');assert.equal(ownership.sourceInventoryId,'heading');
 const packet=headingPacket(inventory),mapping=projectPracticeCategoryMappings(packet,inventory).find(m=>m.inventoryId==='heading');
 assert.equal(mapping.targetId,'p1-category-heading');
});
