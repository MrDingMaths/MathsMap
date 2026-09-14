import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditableProject,normalizeEditableProject,updateProjectContent,updateProjectSettings} from '../src/lib/editable-booklet-model.js';
import {createBookletDocumentSession} from '../src/lib/booklet-document-session.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
import {fromSource,toSource} from '../public/libs/maths-editor/document-model.mjs';
import {joinDocumentParagraph,selectedBookletParagraphs,setBookletParagraphSpacing} from '../src/lib/booklet-text-selection.js';
import {documentSearchIndex} from '../src/lib/booklet-document-search.js';
import {createSavePatch,applySavePatch,reconcileSaveAcknowledgement} from '../src/lib/booklet-save-patch.js';
import {shareDocument,sameDocumentStructure} from '../public/libs/maths-editor/document-sharing.mjs';
const fixture=()=>normalizeEditableProject({...createEditableProject({id:'word-session'}),id:'word-session',title:'Word session',settings:{paginationMode:'flexible',exerciseOrganisation:'topic',compactAnswers:{}},topics:[{id:'one',title:'One'},{id:'two',title:'Two'}],sections:Array.from({length:3},(_,s)=>({id:'s'+s,topicId:s<2?'one':'two',phase:'practice',pageBreakBefore:s!==1,blocks:Array.from({length:12},(_,i)=>({id:`b${s}-${i}`,type:'question',content:{id:`q${s}-${i}`,prompt:fromSource('An ordinary question.'),children:[],answer:{short:'12',worked:fromSource('Calculate the answer.')},answerSpaceMm:10}}))}))});
const textSize=b=>Math.ceil(toSource(b.content?.prompt??b.content??'').length/30)*10;
const measured=p=>({height:p.compactAnswers?Math.max(...p.columns.map(c=>c.reduce((n,e)=>n+textSize(e.block)+8,0))):p.blocks.reduce((n,b)=>n+textSize(b)+8,0)+(p.showTopicHeading?10:0),capacity:95});
test('transactions own immutable history and revision-bound layout, without copying evidence',()=>{
 let project=fixture();project.source={evidence:'Retain original source'};
 const session=createBookletDocumentSession({read:()=>project,publish:p=>project=p});const source=project.source,neighbour=project.sections[2];
 const before=project;session.select({rootId:'q0-0',pointer:'/prompt',bookmark:{start:{nodeId:'p',offset:2}}});
 session.dispatch(updateProjectContent(project,'q0-0','/prompt',fromSource('Changed text')),{typingKey:'q0-0/prompt'});
 assert.equal(project.source,source);assert.equal(project.sections[2],neighbour);assert.deepEqual(session.transaction.changedIds,['b0-0']);
 assert.equal(session.history.past[0].content.sections,before.sections);
 assert.equal(session.acceptLayout({generation:0,edition:'student',ready:true}),false);
 assert.equal(session.acceptLayout({generation:session.generation,edition:'student',ready:true}),true);
 const restored=session.history.step(project,session.selection);assert.equal(toSource(restored.project.sections[0].blocks[0].content.prompt),'An ordinary question.');
 assert.equal(session.layoutReady('student'),true);
});
test('native sharing drops duplicate emissions but detects structural edits',()=>{
 const a=fromSource('Paragraph one\n\nParagraph two'),b=structuredClone(a);assert.equal(shareDocument(a,b),a);
 b.blocks[0].inlines[0].text='Changed';const c=shareDocument(a,b);assert.equal(c.blocks[1],a.blocks[1]);assert.equal(sameDocumentStructure(a,c),true);
 c.blocks.push(fromSource('New').blocks[0]);assert.equal(sameDocumentStructure(a,c),false);
});
for(const edition of ['student','short','worked','with-short','with-worked'])test(`incremental ${edition} matches fresh pagination through edits, deletion and layout changes`,async()=>{
 let project=fixture(),count=0;const measure=p=>{count++;return measured(p);};
 let previous=await paginateFlow(project,edition,measure);const baseline=count;count=0;
 let next=await paginateFlow(project,edition,measure,{previous});assert.deepEqual(next,previous);assert.equal(count,0,'unchanged layout requires no measurements');
 for(const action of [p=>updateProjectContent(p,'q0-5','/prompt',fromSource('A much longer question. '.repeat(5))),p=>({...p,sections:p.sections.map((s,i)=>i? s:{...s,blocks:s.blocks.filter(b=>b.id!=='b0-2')})}),p=>updateProjectSettings(p,{layoutOverrides:{...p.settings.layoutOverrides,answerSpaces:{'q1-2':25}}}),p=>({...p,topics:p.topics.map(t=>({...t,title:t.title+' updated'}))})]){
  project=action(project);count=0;previous=next;next=await paginateFlow(project,edition,measure,{previous});const calls=count;
  const full=await paginateFlow(project,edition,measure);assert.deepEqual(next,full);assert.ok(calls<=baseline+30);
 }
});

test('canonical paragraph joins retain the left identity and respect table owners',()=>{const doc=fromSource('One\n\nTwo');const first=doc.blocks[0].id,second=doc.blocks[1].id;const joined=joinDocumentParagraph(doc,second,-1);assert.equal(joined.document.blocks.length,1);assert.equal(joined.document.blocks[0].id,first);assert.equal(toSource(joined.document),'OneTwo');assert.equal(joined.bookmark.start.offset,3);assert.equal(doc.blocks.length,2);doc.blocks.splice(1,0,{id:'table',type:'table',rows:[[{id:'cell',blocks:fromSource('Cell').blocks}]]});assert.equal(joinDocumentParagraph(doc,second,-1),null);});
test('cross-field spacing changes only the selected paragraphs and search excludes evidence',()=>{let p=fixture();const a=p.sections[0].blocks[0].content.prompt.blocks[0];p=updateProjectContent(p,'q0-0','/prompt',{...fromSource('One\n\nTwo'),blocks:[{...a,inlines:[{type:'text',text:'One'}]},fromSource('Two').blocks[0]]});const selection={ranges:[{rootId:'q0-0',pointer:'/prompt',start:3,end:6},{rootId:'q0-1',pointer:'/prompt',start:0,end:5}]};const targets=selectedBookletParagraphs(p,selection);assert.equal(targets.length,2);const next=setBookletParagraphSpacing(p,targets,'lineHeight',1.5);assert.equal(next.sections[0].blocks[0].content.prompt.blocks[0].lineHeight,1.4);assert.equal(next.sections[0].blocks[0].content.prompt.blocks[1].lineHeight,1.5);assert.equal(next.sections[0].blocks[1].content.prompt.blocks[0].lineHeight,1.5);p.source={title:'Evidence only'};p.sections[0].blocks.push({id:'prose',type:'rich-text',content:fromSource('Searchable prose')});const entries=documentSearchIndex(p);assert.ok(entries.some(e=>e.rootId==='prose'&&e.pointer==='/content'&&e.text==='Searchable prose'));assert.ok(!entries.some(e=>e.text==='Evidence only'));});

test('save deltas preserve untouched branch identities and canonical server corrections',()=>{const before=fixture(),edited=updateProjectContent(before,'q0-0','/prompt',fromSource('Edit')),patch=createSavePatch(before,edited);assert.ok(patch.length<10);const worker=applySavePatch(before,patch);assert.deepEqual(worker,edited);assert.equal(worker.sections[2],before.sections[2]);const saved=structuredClone(edited);saved.revision=2;saved.sections[0].blocks[0].bankRef={id:'bank',revision:3};delete saved.subtitle;const ack=createSavePatch(edited,saved),restored=applySavePatch(edited,ack);assert.deepEqual(restored,saved);assert.equal(restored.sections[2],edited.sections[2]);assert.throws(()=>applySavePatch(before,[{path:['__proto__','bad'],value:true}]),/Invalid/);});

test('a concurrent move and edit retain canonical save metadata by question identity',()=>{const before=fixture(),block=before.sections[0].blocks[0],local=updateProjectContent(before,block.content.id,'/prompt',fromSource('Typed while saving'));local.sections=[{...local.sections[0],blocks:local.sections[0].blocks.slice(1)},{...local.sections[1],blocks:[...local.sections[1].blocks,local.sections[0].blocks[0]]},...local.sections.slice(2)];const saved={...before,revision:before.revision+1,sections:before.sections.map((s,i)=>i?s:{...s,blocks:s.blocks.map((b,j)=>j?b:{...b,bankRef:{id:'canonical-bank',revision:4},classification:{primarySkillId:'kept'}})})};const merged=reconcileSaveAcknowledgement(before,local,saved),moved=merged.sections[1].blocks.at(-1);assert.equal(moved.id,block.id);assert.equal(toSource(moved.content.prompt),'Typed while saving');assert.equal(moved.bankRef.revision,4);assert.equal(moved.classification.primarySkillId,'kept');assert.ok(!merged.sections[0].blocks.some(b=>b.id===block.id));assert.equal(merged.revision,saved.revision);assert.equal(merged.sections[2],local.sections[2]);});
