import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditableProject,updateProjectContent,validateEditableProject} from '../src/lib/editable-booklet-model.js';
import {createDocumentHistory,createTeachingGroup,TEACHING_TEMPLATES,replaceDocumentFragment} from '../src/lib/booklet-document-controller.js';
import {transformTextRange,applyBookletTextRange} from '../src/lib/booklet-text-selection.js';
import {fromSource,toSource} from '../public/libs/maths-editor/document-model.mjs';
import {paragraphSlice,replaceParagraphSlice} from '../src/lib/booklet-document-fragments.js';
import {paginateFlow} from '../src/lib/booklet-pagination.js';
import {bookletComments,createFeedback,reconcileFeedback,feedbackPrompt,feedbackStatus} from '../src/lib/booklet-feedback.js';
import {flowCommand} from '../src/lib/booklet-flow.js';
const fixture=()=>createEditableProject({id:'document-test',title:'Document test',sections:[{id:'s',title:'Theory',blocks:[{id:'b',type:'rich-text',content:'Keep this equation.'},{id:'other',type:'rich-text',content:'Other paragraph.'}]}]});
test('automatic review records never become comments or exported feedback',()=>{
 const p=fixture(),user=createFeedback(p,{rootId:'b'},'My feedback');
 const legacy={id:'legacy',note:'Older personal note',resolved:false};
 const resolved={id:'resolved-user',note:'Completed personal note',resolved:true};
 const generated=[{id:'workflow',workflowIssue:true,note:'Pending source review',resolved:false},{id:'sequence',automatic:true,note:'Sequence notice',resolved:false},{id:'done',workflowIssue:true,note:'Completed review',resolved:true}];
 p.studio={flags:[...generated,user,legacy,resolved]};
 const before=JSON.stringify(p);
 assert.deepEqual(bookletComments(p),[user,legacy,resolved]);
 const prompt=feedbackPrompt(p);
 assert.match(prompt,/My feedback/);assert.match(prompt,/Older personal note/);
 for(const flag of [...generated,resolved])assert.ok(!prompt.includes(flag.note));
 assert.throws(()=>feedbackPrompt(p,['workflow','sequence']),/no unresolved comments/);
 assert.equal(JSON.stringify(p),before);
 p.studio.flags=generated;
 assert.deepEqual(bookletComments(p),[]);
 assert.throws(()=>feedbackPrompt(p),/no unresolved comments/);
 assert.deepEqual(bookletComments(null),[]);
});
test('typing groups across events; commands and fields break groups; undo preserves current revision',()=>{
 const h=createDocumentHistory(),p=fixture();p.revision=4;
 h.record(p,{rootId:'b'},'b/content',100);
 const a=updateProjectContent(p,'b','/content','First edit');h.record(a,{rootId:'b'},'b/content',200);
 const b=updateProjectContent(a,'b','/content','Second edit');b.revision=9;
 assert.equal(h.past.length,1);const result=h.step(b,null);assert.equal(result.project.sections[0].blocks[0].content,'Keep this equation.');assert.equal(result.project.revision,9);
 const redo=h.step(result.project,null,1);assert.equal(redo.project.sections[0].blocks[0].content,'Second edit');
 h.record(redo.project,null,'other/content',300);assert.equal(h.past.length,2);
});
test('undo leaves live bank pins and ratings alone',()=>{
 const p=fixture();p.sections[0].blocks[0].bankRef={id:'bank',revision:'1'};const h=createDocumentHistory();h.record(p,null);
 const next=updateProjectContent(p,'b','/content','Edit');next.sections[0].blocks[0].bankRef.revision='2';next.sections[0].blocks[0].flow={bankDifficulty:{reasoningScore:42}};
 const old=h.step(next,null).project;assert.equal(old.sections[0].blocks[0].bankRef.revision,'2');assert.equal(old.sections[0].blocks[0].flow.bankDifficulty.reasoningScore,42);
});
test('teaching templates are valid, editable and do not contain printed instructions',()=>{
 for(const [kind] of TEACHING_TEMPLATES){const p=fixture();p.sections[0].blocks=[createTeachingGroup(kind)];const report=validateEditableProject(p);assert.equal(report.valid,true,JSON.stringify(report.errors));assert.doesNotMatch(JSON.stringify(p.sections),/Add theory content|Add the worked solution|Add the example prompt/);assert.ok(p.sections[0].blocks[0].sourceAtom.id);}
});
test('comments retain legacy fields, follow moves, and flag deleted or changed targets',()=>{
 const p=fixture(),flag=createFeedback(p,{rootId:'b',pointer:'/content',quote:'this equation',edition:'student'},'Keep the colour');p.studio={version:1,flags:[flag,{id:'old',targetId:'other',note:'Legacy note',resolved:false}]};
 const moved=flowCommand(p,{type:'move',ids:['b'],sectionId:'s'});assert.equal(feedbackStatus(moved,flag),'');
 const changed=reconcileFeedback(p,updateProjectContent(p,'b','/content','Please keep this equation.'));assert.equal(feedbackStatus(changed,changed.studio.flags[0]),'');assert.equal(changed.studio.flags[0].anchor.start,12);
 const deleted=reconcileFeedback(p,flowCommand(p,{type:'delete',ids:['b']}));assert.equal(feedbackStatus(deleted,deleted.studio.flags[0]),'Target removed');assert.equal(deleted.studio.flags.length,2);
});
test('prompt exports unresolved selection, revision, scope and source references without resolving notes',()=>{
 const p=fixture();p.revision=7;p.sections[0].blocks[0].sourcePageNumber=5;
 const a=createFeedback(p,{rootId:'b',pointer:'/content',edition:'worked'},'Move above','local'),b=createFeedback(p,{rootId:'other'},'General');p.studio={version:1,flags:[a,b]};
 const prompt=feedbackPrompt(p,[a.id]);assert.match(prompt,/Saved revision: 7/);assert.match(prompt,/Source pages: 5/);assert.match(prompt,/This occurrence only/);assert.doesNotMatch(prompt,/Comment .*General/);assert.equal(a.resolved,false);
});
test('editing a paginated fragment preserves every paragraph outside the fragment',()=>{
 const doc=fromSource('First.\n\nSecond.\n\nThird.'),ids=[doc.blocks[1].id],edited=fromSource('Changed second.\n\nInserted paragraph.');
 const next=replaceDocumentFragment(doc,ids,edited);assert.equal(next.blocks.length,4);assert.deepEqual(next.blocks[0],doc.blocks[0]);assert.deepEqual(next.blocks.at(-1),doc.blocks[2]);assert.match(toSource(next),/Changed second/);
});
test('cross-field deletion preserves containers; formatting splits only selected text',()=>{
 const bold=transformTextRange('abcdef',1,4,'bold');assert.deepEqual(bold.blocks[0].inlines.map(i=>[i.text,i.marks]),[['a',[]],['bcd',['bold']],['ef',[]]]);
 const p=fixture(),next=applyBookletTextRange(p,{ranges:[{rootId:'b',pointer:'/content',start:0,end:50},{rootId:'other',pointer:'/content',start:0,end:5}]},'delete');
 assert.equal(next.sections[0].blocks.length,2);assert.equal(toSource(next.sections[0].blocks[0].content),'');assert.equal(toSource(next.sections[0].blocks[1].content),' paragraph.');
});
test('history shares unchanged content after server snapshots instead of retaining whole-book clones',()=>{
 const p=fixture(),h=createDocumentHistory();h.record(p,null);const next=structuredClone(p);next.sections[0].blocks[0].content='Edited';h.record(next,null);
 assert.equal(h.past[0].content.sections[0].blocks[1],h.past[1].content.sections[0].blocks[1]);next.sections[0].blocks[0].content='Mutated externally';assert.equal(h.past[1].content.sections[0].blocks[0].content,'Edited');
});
test('long prose paginates at measured word boundaries without splitting stored paragraphs',async()=>{
 const p=fixture();p.settings.paginationMode='flexible';p.settings.generatedCover=false;p.sections[0].blocks=[{id:'long',type:'rich-text',content:fromSource('A long explanation. '.repeat(80))}];const original=JSON.stringify(p);
 const result=await paginateFlow(p,'student',async page=>({height:page.blocks.reduce((n,b)=>n+(b.content?.blocks?.[0]?.inlines?.reduce((a,i)=>a+(i.text?.length??1),0)??0),0),capacity:180}));
 const fragments=result.pages.flatMap(page=>page.blocks).filter(b=>b.id==='long');assert.ok(fragments.length>2);assert.equal(fragments.map(b=>b.content.blocks[0].inlines.map(i=>i.text).join('')).join(''),'A long explanation. '.repeat(80));assert.equal(JSON.stringify(p),original);
 const doc=fromSource('Start middle finish'),slice=paragraphSlice(doc,6,12);const edited=replaceParagraphSlice(doc,slice._bookletSlice,fromSource('changed'));assert.equal(toSource(edited),'Start changed finish');
});
