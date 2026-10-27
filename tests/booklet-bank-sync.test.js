import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createEditableProject,createProjectBlock,snapshotBankQuestion} from '../src/lib/editable-booklet-model.js';
import {createBookletProject,saveBookletProject,promoteProjectQuestion,loadBookletProject,getProjectBankSync,resolveProjectBankSync,duplicateBookletProject,updateProjectLibrary} from '../scripts/booklet/project-studio-server.mjs';
import {revisionHash,writeTransaction,bankManifestEntry,secondarySkillAmendment,assertNoBankDuplicate,resolveBankOutcomes,sharedHash} from '../scripts/booklet/bank-sync.mjs';
import {sharedQuestion,mergeQuestionContent,questionKey} from '../src/lib/question-sync.js';
import {normaliseQuestion} from '../src/lib/practice-question-model.js';
import {arrangementCatalog,resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {fromSource} from '../src/lib/document-content.js';
import {reconcileSyncLayout,reconcileProjectLayouts} from '../src/lib/question-sync-layout.js';
import {flowCommand} from '../src/lib/booklet-flow.js';
import {createDocumentHistory} from '../src/lib/booklet-document-controller.js';

test('question moves with stale layout refs survive undo, redo and save/reopen',async t=>{
 const f=await fixture(t),project=structuredClone(f.project),block=project.sections[0].blocks[0];
 const other=structuredClone(block);other.id='other-block';other.content.id='other-content';other.bankRef=null;delete other.canonicalId;other.snapshotKind='local';
 project.sections[0].blocks.push(other);
 project.sections.push({...project.sections[0],id:'destination',blocks:[]});
 const holder={arrangement:arrangementCatalog(block,{editable:true}).initial};
 holder.arrangement.root.children.push({id:'stale',type:'item',ref:block.content.id+'/prompt#removed'});
 project.settings.layoutOverrides.blockLayouts[block.id]=holder;
 const original=structuredClone(project),history=createDocumentHistory();
 const within=reconcileProjectLayouts(project,flowCommand(project,{type:'move',ids:[block.id],sectionId:project.sections[0].id}));
 assert.deepEqual(within.sections[0].blocks.map(b=>b.id),[other.id,block.id]);
 history.record(project,null);
 const across=reconcileProjectLayouts(within,flowCommand(within,{type:'move',ids:[block.id],sectionId:'destination'}));
 assert.deepEqual(across.sections.at(-1).blocks.map(b=>b.id),[block.id]);
 assert.deepEqual(across.settings.layoutOverrides,original.settings.layoutOverrides);
 assert.deepEqual(across.sections.at(-1).blocks[0].bankRef,block.bankRef);
 assert.deepEqual(history.step(across,null).project,original);
 const redone=history.step(original,null,1).project;
 assert.deepEqual(redone,across);
 const saved=await saveBookletProject(redone,{...f.options,expectedRevision:project.revision});
 const reopened=await loadBookletProject(saved.id,f.options);
 assert.deepEqual(reopened.sections.map(s=>s.blocks.map(b=>b.id)),saved.sections.map(s=>s.blocks.map(b=>b.id)));
 assert.deepEqual(reopened.settings.layoutOverrides,saved.settings.layoutOverrides);
 assert.deepEqual(reopened.sections.at(-1).blocks[0].bankRef,saved.sections.at(-1).blocks[0].bankRef);
 const edited=structuredClone(across);edited.sections.at(-1).blocks[0].content.prompt='Changed task';
 assert.throws(()=>reconcileProjectLayouts(across,edited),/could not preserve layout references/);
 assert.deepEqual(project,original);
});

test('editor content changes still expand saved paragraph slots',()=>{
 const block={id:'b',type:'question',content:{id:'q',prompt:'Find x'}};
 const before={sections:[{blocks:[block]}],settings:{layoutOverrides:{blockLayouts:{b:{arrangement:arrangementCatalog(block).initial}}}}};
 const after=structuredClone(before);after.sections[0].blocks[0].content.prompt=fromSource('Find x\n\nThen explain');
 const result=reconcileProjectLayouts(before,after),holder=result.settings.layoutOverrides.blockLayouts.b;
 assert.deepEqual(resolveArrangement(result.sections[0].blocks[0],holder.arrangement,{editable:true}).missing,[]);
 assert.equal(holder.arrangement.root.children.filter(n=>n.ref?.includes('/prompt#')).length,2);
});

test('sync inserts multipart variations with diagrams and preserves existing part geometry',()=>{
 const before={id:'b',type:'question',content:{id:'q',type:'question',layout:'grid',columns:2,children:['a','b'].map(id=>({id,type:'part',label:id,prompt:'Expand',answerSpaceMm:20}))}};
 const holder={arrangement:arrangementCatalog(before).initial};
 const visit=(n,fn)=>{fn(n);n.children?.forEach(child=>visit(child,fn));};
 visit(holder.arrangement.root,n=>{if(n.id==='b:question')n.gap=7;});
 const after=structuredClone(before);after.content.children.splice(1,0,{id:'new',type:'part',label:'c',prompt:'New variation',questionDiagrams:[{id:'model',format:'tikz',code:'area model',widthMm:46}],answerSpaceMm:18,answer:{short:'result',solutionDiagrams:[{id:'solution',format:'tikz',code:'completed area model',widthMm:46}]}});
 reconcileSyncLayout(before,after,holder);
 const refs=[];visit(holder.arrangement.root,n=>{if(n.ref)refs.push(n.ref);if(n.id==='b:question')assert.equal(n.gap,7);});
 for(const ref of ['new/prompt','new/space','model','b/space'])assert(refs.includes(ref));
 assert(!refs.includes('solution'));
 assert.deepEqual(resolveArrangement(after,holder.arrangement).missing,[]);
 const once=structuredClone(holder);reconcileSyncLayout(before,after,holder);assert.deepEqual(holder,once);
});

test('a single response extended into parts keeps all new responses and diagram sizing',()=>{
 const before={id:'block',type:'question',content:{id:'q',prompt:'Compare f and g.',questionDiagrams:[{id:'figure',format:'tikz',code:'geometry',widthMm:48}],answerSpaceMm:32,answer:{short:'f'}}};
 const holder={arrangement:arrangementCatalog(before).initial};
 const find=n=>{if(n.ref==='figure')n.width=51;n.children?.forEach(find);};find(holder.arrangement.root);
 const after=structuredClone(before);delete after.content.answer;delete after.content.answerSpaceMm;
 after.content.children=['a','b','c'].map(label=>({id:label,type:'part',label,prompt:'Compare.',answerSpaceMm:24,answer:{short:'value'}}));
 reconcileSyncLayout(before,after,holder);
 const refs=[];const collect=n=>{if(n.ref)refs.push(n.ref);if(n.ref==='figure')assert.equal(n.width,51);n.children?.forEach(collect);};collect(holder.arrangement.root);
 assert(!refs.includes('q/space'));for(const label of ['a','b','c'])assert(refs.includes(label+'/space'));
 assert.deepEqual(resolveArrangement(after,holder.arrangement).missing,[]);
 const once=structuredClone(holder);reconcileSyncLayout(before,after,holder);assert.deepEqual(holder,once);
});

test('sync removes a deleted scaffold while preserving its part and working space',()=>{
 const before={id:'b',type:'question',content:{id:'q',prompt:'Find the median',children:[{id:'a',label:'a',prompt:'3, 1, 2',questionDiagrams:[{id:'scaffold',format:'tikz',code:'diagram',widthMm:40}],answerSpaceMm:22}]}};
 const holder={arrangement:arrangementCatalog(before).initial};holder.arrangement.root.gap=5;
 const after=structuredClone(before);delete after.content.children[0].questionDiagrams;
 reconcileSyncLayout(before,after,holder);
 const resolved=resolveArrangement(after,holder.arrangement),refs=[];
 const visit=n=>{if(n.ref)refs.push(n.ref);n.children?.forEach(visit);};visit(resolved.tree.root);
 assert.deepEqual(resolved.missing,[]);assert(!refs.includes('scaffold'));assert(refs.includes('a/space'));assert(refs.includes('a/label'));assert.equal(holder.arrangement.root.gap,5);
 const once=structuredClone(holder);reconcileSyncLayout(before,after,holder);assert.deepEqual(holder,once);
 holder.arrangement.root.children.push({id:'unknown',type:'item',ref:'unknown-diagram'});
 assert.throws(()=>reconcileSyncLayout(before,after,holder),/could not preserve layout references/);
});

test('sync removes deleted part spaces and inserts new given diagrams without losing layout',()=>{
 const before={id:'b',type:'question',content:{id:'q',prompt:'Calculate',children:[{id:'a',label:'a',prompt:'Radius 2, height 3',answerSpaceMm:20},{id:'g',label:'g',prompt:'Delete this part',answerSpaceMm:20}]}};
 const holder={arrangement:arrangementCatalog(before).initial};
 holder.arrangement.root.gap=5;
 const after=structuredClone(before);after.content.children.pop();
 after.content.children[0].questionDiagrams=[{id:'cylinder',format:'tikz',code:'\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}',widthMm:40}];
 reconcileSyncLayout(before,after,holder);
 const resolved=resolveArrangement(after,holder.arrangement),refs=[];
 const visit=n=>{if(n.ref)refs.push(n.ref);n.children?.forEach(visit);};visit(resolved.tree.root);
 assert.deepEqual(resolved.missing,[]);
 assert(refs.includes('cylinder'));
 assert(!refs.some(ref=>ref.startsWith('g/')));
 assert.equal(resolved.tree.root.gap,5);
 const once=structuredClone(holder);reconcileSyncLayout(before,after,holder);assert.deepEqual(holder,once);
});
import {applyBankRatings} from '../src/lib/booklet-bank-ratings.js';

for(const initialRating of [false,true]) test('linked display ratings refresh on load, polling and save without accepting content',async t=>{
 const f=await fixture(t);
 const copy=await duplicateBookletProject(f.project.id,{...f.options,copyId:'ratings-copy'});
 const b=copy.sections[0].blocks[0];
 if(initialRating)b.flow={...b.flow,bankDifficulty:{difficulty:'Foundation',reasoningScore:1,revision:'old'}};
 else delete b.flow;
 const saved=await saveBookletProject(copy,{...f.options,expectedRevision:copy.revision});
 const bank={...f.bank,classification:{...f.bank.classification,difficulty:'Mastery',reasoningScore:75,difficultyReason:'Connect representations'},content:{...f.bank.content,prompt:'Unaccepted bank content'}};
 await writeTransaction([[path.join(f.bankRoot,bank.id+'.json'),bank]]);
 const loaded=await loadBookletProject(copy.id,f.options);
 const rating=loaded.sections[0].blocks[0].flow.bankDifficulty;
 assert.equal(rating.reasoningScore,75);
 assert.equal(rating.difficultyReason,'Connect representations');
 assert.equal(rating.revision,revisionHash(bank));
 assert.deepEqual(loaded.sections[0].blocks[0].content,b.content);
 assert.deepEqual(loaded.sections[0].blocks[0].bankRef,b.bankRef);
 assert.equal(loaded.revision,saved.revision);
 const status=await getProjectBankSync(copy.id,f.options);
 const local=structuredClone(saved);local.sections[0].blocks[0].content.prompt='Unsaved edit';
 const polled=applyBankRatings(local,status.items);
 assert.equal(polled.sections[0].blocks[0].content.prompt,'Unsaved edit');
 assert.deepEqual(polled.sections[0].blocks[0].flow.bankDifficulty,rating);
 assert.equal(applyBankRatings(polled,status.items),polled);
 const detached=structuredClone(local);detached.sections[0].blocks[0].bankRef=null;
 assert.equal(applyBankRatings(detached,status.items),detached);
 const persisted=await saveBookletProject(saved,{...f.options,expectedRevision:saved.revision});
 assert.deepEqual(persisted.sections[0].blocks[0].flow.bankDifficulty,rating);
 assert.deepEqual(persisted.sections[0].blocks[0].content,b.content);
 assert.deepEqual(await f.readBank(),bank);
});

async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'booklet-bank-sync-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank'),moduleRoot:path.join(root,'modules')};
 const p=createEditableProject({id:'original',title:'Original'}),b=createProjectBlock('question');b.id='question-a';
 b.classification={primarySkillId:'solve-linear-1-step'};
 b.content.prompt='Solve $x+1=3$';b.content.answer={short:'2',worked:'$x=2$',solutionDiagrams:[]};b.content.answerSpaceMm=20;
 p.sections[0].blocks=[b];await createBookletProject(p,options);
 const result=await promoteProjectQuestion(p.id,{blockId:b.id,mode:'create'},options);
 return{...options,options,project:result.project,bank:result.question,readBank:async()=>JSON.parse(await fs.readFile(path.join(options.bankRoot,result.question.id+'.json'),'utf8'))};
}

test('completed parent answers publish through owner sync and survive a pinned consumer update',async t=>{
 const f=await fixture(t),copy=await duplicateBookletProject(f.project.id,f.options);
 const block=f.project.sections[0].blocks[0],root=block.content;
 root.children=[{id:'cell-response',type:'part',label:'a',prompt:'Complete the cell.',answer:{short:'2',worked:'$1+1=2$'}}];
 const table={format:'maths-editor-document-v1',version:1,blocks:[{id:'completed',type:'table',rows:[[{id:'completed-cell',type:'cell',blocks:[{id:'completed-value',type:'paragraph',inlines:[{type:'math',latex:'2',display:false}]}]}]]}]};
 root.answer={short:table,worked:JSON.parse(JSON.stringify(table).replaceAll('completed','worked-table'))};
 const saved=await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 const bank=await f.readBank();assert.equal(bank.content.answer.short.blocks[0].rows[0][0].blocks[0].inlines[0].latex,'2');
 assert.ok(bank.content.children[0].id.endsWith('cell-response'));
 const status=(await getProjectBankSync(copy.id,f.options)).items[0];assert.equal(status.state,'update');
 const updated=await resolveProjectBankSync(copy.id,{...status,action:'use-bank',expectedRevision:copy.revision},f.options);
 assert.equal(updated.sections[0].blocks[0].content.answer.worked.blocks[0].rows[0][0].blocks[0].inlines[0].latex,'2');
 assert.equal((await getProjectBankSync(saved.id,f.options)).items[0].state,'synced');
});

test('class library copies isolate content and archived originals retain bank ownership',async t=>{
 const f=await fixture(t), before=await f.readBank();
 const linksFile=path.join(f.bankRoot,'.sync','links.json'),links=await fs.readFile(linksFile,'utf8');
 const master=await updateProjectLibrary(f.project.id,{category:'master',courseId:'s4'}, {...f.options,expectedRevision:f.project.revision});
 const copy=await duplicateBookletProject(master.id,{...f.options,expectedRevision:master.revision,library:{category:'class',classLabel:'8MAT6'}});
 assert.deepEqual(copy.sections[0].blocks[0].bankRef,master.sections[0].blocks[0].bankRef);
 copy.sections[0].blocks[0].content.prompt='Class-specific wording';
 await saveBookletProject(copy,{...f.options,expectedRevision:copy.revision});
 assert.deepEqual(await f.readBank(),before);
 assert.equal((await loadBookletProject(master.id,f.options)).sections[0].blocks[0].content.prompt,master.sections[0].blocks[0].content.prompt);
 await updateProjectLibrary(master.id,{...master.library,archivedAt:'2026-09-17T00:00:00Z'},{...f.options,expectedRevision:master.revision});
 assert.equal(await fs.readFile(linksFile,'utf8'),links);
 assert.equal((await getProjectBankSync(master.id,f.options)).items[0].owner,true);
 assert.equal((await getProjectBankSync(copy.id,f.options)).items[0].owner,false);
});

test('rich-text publication and conflict acceptance preserve valid destination layouts',async t=>{
 const f=await fixture(t),block=f.project.sections[0].blocks[0];
 const bank=await f.readBank();
 bank.presentation={layoutOverrides:{blockLayouts:{[block.id]:{arrangement:arrangementCatalog({...bank,type:'question',sourceOrder:1}).initial}}}};
 await writeTransaction([[path.join(f.bankRoot,bank.id+'.json'),bank]]);
 const copy=await duplicateBookletProject(f.project.id,f.options),local=copy.sections[0].blocks[0];
 local.content.prompt=fromSource('Independent local edit');
 copy.settings.layoutOverrides={blockLayouts:{[local.id]:{arrangement:arrangementCatalog(local).initial}}};
 const tree=copy.settings.layoutOverrides.blockLayouts[local.id].arrangement;
 const findPrompt=n=>n.ref?.includes('/prompt')?n:n.children?.map(findPrompt).find(Boolean);
 const item=findPrompt(tree.root);item.before=7;item.width=91;
 const savedCopy=await saveBookletProject(copy,{...f.options,expectedRevision:copy.revision});
 block.content.prompt=fromSource('Published edit');
 let saved=await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 const published=await f.readBank();
 assert.deepEqual(resolveArrangement({...published,type:'question',sourceOrder:1},published.presentation.layoutOverrides.blockLayouts[block.id].arrangement).missing,[]);
 const paragraphId=published.content.prompt.blocks[0].id;
 saved.sections[0].blocks[0].content.prompt.blocks[0].inlines[0].text='Published again';
 saved=await saveBookletProject(saved,{...f.options,expectedRevision:saved.revision});
 assert.equal((await f.readBank()).content.prompt.blocks[0].id,paragraphId);
 const status=(await getProjectBankSync(copy.id,f.options)).items[0];assert.equal(status.state,'conflict');
 const updated=await resolveProjectBankSync(copy.id,{...status,action:'use-bank',expectedRevision:savedCopy.revision},f.options);
 const result=updated.sections[0].blocks[0],layout=updated.settings.layoutOverrides.blockLayouts[result.id].arrangement;
 assert.deepEqual(resolveArrangement(result,layout).missing,[]);
 assert.equal(findPrompt(layout.root).id,item.id);assert.equal(findPrompt(layout.root).before,7);assert.equal(findPrompt(layout.root).width,91);
 assert.equal(result.content.prompt.blocks[0].inlines[0].text,'Published again');
});

test('layout reconciliation expands and collapses rich text without hiding unknown references',()=>{
 const before={id:'q',type:'question',sourceOrder:1,content:{id:'root',prompt:'Original',children:[]}};
 const holder={arrangement:arrangementCatalog(before).initial};
 const after=structuredClone(before);after.content.prompt=fromSource('First\n\nSecond');
 reconcileSyncLayout(before,after,holder);
 assert.deepEqual(resolveArrangement(after,holder.arrangement).missing,[]);
 assert.equal([...resolveArrangement(after,holder.arrangement).entries.values()].filter(e=>e.field==='prompt').length,2);
 reconcileSyncLayout(after,before,holder);
 assert.deepEqual(resolveArrangement(before,holder.arrangement).missing,[]);
 holder.arrangement.root.children.push({id:'bad',type:'item',ref:'root/prompt#unknown'});
 assert.throws(()=>reconcileSyncLayout(before,after,holder),/could not preserve layout references/);
});
test('layout edits retain whole native prompt aliases and their single-slot geometry',()=>{
 const before={id:'q',type:'question',sourceOrder:1,content:{id:'root',prompt:'Match the graphs.',layout:'grid',columns:2,children:[{id:'part-a',prompt:fromSource('A native expression\n\nGraph response'),children:[]}]}};
 const holder={arrangement:{version:1,root:{id:'layout',type:'group',direction:'stack',children:[{id:'whole-prompt',type:'item',ref:'part-a/prompt',width:72,before:3,after:4}]}}};
 const saved=structuredClone(holder),after=structuredClone(before);after.content.columns=3;
 reconcileSyncLayout(before,after,holder,{editable:true});
 assert.deepEqual(holder,saved,'An already valid whole-field placement remains unchanged');
 let resolved=resolveArrangement(after,holder.arrangement,{editable:true});assert.deepEqual(resolved.missing,[]);
 const slot=resolved.tree.root.children[0];assert.equal(slot.type,'group');assert.equal(slot.width,72);assert.equal(slot.before,3);assert.equal(slot.after,4);assert.equal(slot.children.length,2);assert.ok(slot.children.every(n=>n.width==null&&n.before==null&&n.after==null));
 const changed=structuredClone(after);changed.content.children[0].prompt=fromSource('Replacement first paragraph\n\nSecond\n\nThird');
 reconcileSyncLayout(after,changed,holder,{editable:true});assert.deepEqual(holder,saved);resolved=resolveArrangement(changed,holder.arrangement,{editable:true});assert.deepEqual(resolved.missing,[]);assert.equal(resolved.tree.root.children[0].children.length,3);
 holder.arrangement.root.children.push({id:'unknown',type:'item',ref:'part-a/prompt#missing'});assert.throws(()=>reconcileSyncLayout(after,changed,holder,{editable:true}),/could not preserve layout references/);
});

test('original saves sync content and solutions, preserve bank layout, and retain old revision',async t=>{
 const f=await fixture(t),p=f.project;p.sections[0].blocks[0].content.answer.worked='$x=3-1=2$';p.sections[0].blocks[0].content.answerSpaceMm=90;
 await saveBookletProject(p,{...f.options,expectedRevision:p.revision});const bank=await f.readBank();
 assert.equal(bank.content.answer.worked,'$x=3-1=2$');assert.equal(bank.content.answerSpaceMm,20);
 assert.deepEqual(bank.classification,f.bank.classification);
 assert.ok(await fs.readFile(path.join(f.bankRoot,'.revisions',bank.id,revisionHash(f.bank)+'.json')));
 assert.equal((await getProjectBankSync(p.id,f.options)).items[0].state,'synced');
});
test('layout-only saves do not create a bank revision',async t=>{
 const f=await fixture(t);f.project.sections[0].blocks[0].content.answerSpaceMm=100;
 await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});assert.deepEqual(await f.readBank(),f.bank);
});
test('both-side changes pause automatic sync while preserving the saved booklet; stale resolutions fail',async t=>{
 const f=await fixture(t),bank={...f.bank,content:{...f.bank.content,prompt:'Bank edit'}};
 await writeTransaction([[path.join(f.bankRoot,f.bank.id+'.json'),bank]]);
 f.project.sections[0].blocks[0].content.prompt='Booklet edit';
 const saved=await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 assert.equal((await f.readBank()).content.prompt,'Bank edit');
 const item=(await getProjectBankSync(saved.id,f.options)).items[0];assert.equal(item.state,'conflict');assert.equal(item.local.content.prompt,'Booklet edit');
 await assert.rejects(()=>resolveProjectBankSync(saved.id,{...item,bankRevision:'stale',action:'use-booklet',expectedRevision:saved.revision},f.options),/changed/);
 await resolveProjectBankSync(saved.id,{...item,action:'use-booklet',expectedRevision:saved.revision},f.options);
 assert.equal((await f.readBank()).content.prompt,'Booklet edit');
});
test('copied booklets stay pinned and explicitly accept bank updates without losing local layout or IDs',async t=>{
 const f=await fixture(t),copy=await duplicateBookletProject(f.project.id,{...f.options,title:'Copy'});
 copy.sections[0].blocks[0].content.answerSpaceMm=70;
 const local=await saveBookletProject(copy,{...f.options,expectedRevision:copy.revision});
 f.project.sections[0].blocks[0].content.answer.worked='New working';
 await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 const unchanged=await loadBookletProject(local.id,f.options);assert.equal(unchanged.sections[0].blocks[0].content.answer.worked,'$x=2$');
 const item=(await getProjectBankSync(local.id,f.options)).items[0];assert.equal(item.owner,false);assert.equal(item.state,'update');
 const updated=await resolveProjectBankSync(local.id,{...item,action:'use-bank',expectedRevision:local.revision},f.options);
 assert.equal(updated.sections[0].blocks[0].content.answer.worked,'New working');assert.equal(updated.sections[0].blocks[0].content.answerSpaceMm,70);
 assert.equal(updated.sections[0].blocks[0].content.id,local.sections[0].blocks[0].content.id);
});
test('rekeyed snapshots compare equally and retain internal diagram links when refreshed',()=>{
 const bank={id:'q-test',content:{id:'root',type:'question',prompt:'Graph',children:[],questionDiagrams:[{id:'diagram',format:'image',src:'/graph.png',widthMm:50}],sharedSolutionDiagramId:'diagram',answer:{worked:'Graph',short:'Graph',solutionDiagrams:[]}}};
 const local=snapshotBankQuestion(bank,{placementId:'placed'});assert.deepEqual(sharedQuestion(normaliseQuestion(bank)),sharedQuestion(local));
 const next=structuredClone(bank.content);next.prompt='Updated graph';
 const merged=mergeQuestionContent(next,local.content,bank.content);
 assert.equal(merged.id,local.content.id);assert.equal(merged.sharedSolutionDiagramId,merged.questionDiagrams[0].id);
});
test('concurrent saves serialize and reject the stale project revision',async t=>{
 const f=await fixture(t);const results=await Promise.allSettled([saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision}),saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.statusCode,409);
});

test('bank-only changes are offered, not overwritten by a layout save',async t=>{
 const f=await fixture(t),bank=structuredClone(f.bank);bank.content.answer.worked='Bank correction';await writeTransaction([[path.join(f.bankRoot,bank.id+'.json'),bank]]);
 f.project.sections[0].blocks[0].content.answerSpaceMm=60;
 await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 assert.equal((await f.readBank()).content.answer.worked,'Bank correction');assert.equal((await getProjectBankSync(f.project.id,f.options)).items[0].state,'update');
});
test('a removed bank question is never recreated by an original save',async t=>{
 const f=await fixture(t);await fs.unlink(path.join(f.bankRoot,f.bank.id+'.json'));
 f.project.sections[0].blocks[0].content.prompt='Local change after deletion';
 await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 await assert.rejects(f.readBank,/ENOENT/);assert.equal((await getProjectBankSync(f.project.id,f.options)).items[0].state,'missing');
});
test('copies created after an automatic update pin that new revision',async t=>{
 const f=await fixture(t);f.project.sections[0].blocks[0].content.prompt='First update';
 let source=await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 const copy=await duplicateBookletProject(source.id,f.options);assert.equal(copy.sections[0].blocks[0].bankRef.revision,revisionHash(await f.readBank()));
 source.sections[0].blocks[0].content.prompt='Second update';await saveBookletProject(source,{...f.options,expectedRevision:source.revision});
 assert.equal((await getProjectBankSync(copy.id,f.options)).items[0].state,'update');
});
test('a write failure restores earlier transaction files',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'bank-sync-rollback-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const first=path.join(root,'first.json'),second=path.join(root,'second.json');await fs.writeFile(first,'{"before":true}');
 const rename=fs.rename;let calls=0;
 try{fs.rename=async(...args)=>{if(++calls===2)throw new Error('Simulated write failure');return rename(...args);};await assert.rejects(()=>writeTransaction([[first,{after:true}],[second,{new:true}]]),/Simulated/);}
 finally{fs.rename=rename;}
 assert.equal(await fs.readFile(first,'utf8'),'{"before":true}');await assert.rejects(()=>fs.readFile(second),/ENOENT/);
});

// Duplicate linking: one bank record per question, however many booklets use it.
async function secondBooklet(f,blocks){
 const p=createEditableProject({id:'second',title:'Second'});
 p.sections[0].blocks=blocks.map(([id,skill,prompt,answer])=>{const b=createProjectBlock('question');b.id=id;b.classification={primarySkillId:skill};b.content.prompt=prompt;b.content.answer={...answer,solutionDiagrams:[]};b.content.answerSpaceMm=35;return b;});
 return createBookletProject(p,f.options);
}
const bankFiles=async f=>(await fs.readdir(f.bankRoot)).filter(n=>n.startsWith('q-'));

test('questionKey ignores identity, layout, answers and whitespace but not the question posed',()=>{
 const base={content:{id:'root-1',type:'question',label:'7',prompt:'Solve each equation.',layout:'list',children:[
  {id:'part-1',type:'part',label:'a',prompt:{blocks:[{id:'p1',type:'paragraph',inlines:[{type:'text',text:'$x+1=3$ so x ='},{type:'cloze',width:30,answer:'2'}]}]},answer:{short:'2',worked:'Subtract 1.'}},
  {id:'part-2',type:'part',label:'b',prompt:'$2x=8$',answer:{short:'4',worked:'Divide by 2.'}}]}};
 const same=structuredClone(base).content;
 same.id='other-root';same.label='12';same.layout='grid';same.columns=2;same.prompt='Solve  each equation. ';
 same.children[0].id='other-1';same.children[0].prompt.blocks[0].id='q9';same.children[0].prompt.blocks[0].inlines[1].width=55;
 same.children[0].answer={short:'$x=2$',worked:[{id:'w1',text:'A different method.'}]};same.children[1].id='other-2';same.children[1].answerSpaceMm=40;
 assert.equal(questionKey({content:same}),questionKey(base));
 for(const change of [c=>{c.children[1].prompt='$2x=6$';},c=>{c.children[1].label='c';},c=>{c.afterDiagramPrompt='Give exact values.';},c=>{c.questionDiagrams=[{id:'d',format:'tikz',code:'\\draw (0,0)--(1,1);'}];},c=>{c.children.pop();}]){
  const changed=structuredClone(base);change(changed.content);assert.notEqual(questionKey(changed),questionKey(base));
 }
});

test('an identical question links to the existing record without changing the booklet',async t=>{
 const f=await fixture(t),created=await secondBooklet(f,[['copy-a','solve-linear-1-step','Solve $x+1=3$',{short:'2',worked:'$x=2$'}]]);
 const before=structuredClone(created.sections[0].blocks[0]);
 assert.notEqual(before.content.id,f.bank.content.id);
 const candidate=(await promoteProjectQuestion('second',{blockId:'copy-a'},f.options)).candidates[0];
 assert.equal(candidate.id,f.bank.id);assert.equal(candidate.exact,true);
 await assert.rejects(promoteProjectQuestion('second',{blockId:'copy-a',mode:'create'},f.options),/identical to bank question/);
 await assert.rejects(promoteProjectQuestion('second',{blockId:'copy-a',mode:'distinct',targetId:f.bank.id},f.options),/cannot be kept separate/);
 await assert.rejects(promoteProjectQuestion('second',{blockId:'copy-a',mode:'publish'},f.options),/Unknown promotion mode/);
 const linked=(await promoteProjectQuestion('second',{blockId:'copy-a',mode:'link-existing',targetId:f.bank.id},f.options)).project.sections[0].blocks[0];
 assert.deepEqual(linked.content,before.content);
 assert.deepEqual(linked.bankRef,{id:f.bank.id,revision:revisionHash(await f.readBank())});
 assert.deepEqual(await f.readBank(),f.bank);
 assert.deepEqual(await bankFiles(f),[f.bank.id+'.json']);
 assert.equal((await getProjectBankSync('second',f.options)).items[0].state,'synced');
 // The owner's next edit reaches the linked copy, which keeps its own ids and layout.
 const owner=await loadBookletProject(f.project.id,f.options);owner.sections[0].blocks[0].content.answer.worked='$x=3-1=2$';
 await saveBookletProject(owner,{...f.options,expectedRevision:owner.revision});
 const status=await getProjectBankSync('second',f.options),item=status.items[0];
 assert.equal(item.state,'update');
 const after=(await resolveProjectBankSync('second',{...item,action:'use-bank',expectedRevision:status.projectRevision},f.options)).sections[0].blocks[0];
 assert.equal(after.content.id,before.content.id);assert.equal(after.content.answerSpaceMm,35);assert.equal(after.content.answer.worked,'$x=3-1=2$');
 assert.equal((await getProjectBankSync('second',f.options)).items[0].state,'synced');
});

test('a same-question match is held until it is linked or kept separate',async t=>{
 const f=await fixture(t),answer={short:'$x=2$',worked:'Subtract 1 from both sides.'};
 const created=await secondBooklet(f,[['variant-a','solve-linear-2-step','Solve  $x+1=3$ ',answer],['variant-b','solve-linear-2-step','Solve $x+1=3$',{short:'$x=2$',worked:'Guess and check.'}]]);
 const outcomes=await resolveBankOutcomes(created.sections[0].blocks,f.bankRoot);
 assert.deepEqual([...outcomes.values()].map(o=>o.outcome),['held','held']);
 assert.deepEqual(outcomes.get('variant-a').sameQuestionAs,[{bankId:f.bank.id}]);
 const candidate=(await promoteProjectQuestion('second',{blockId:'variant-a'},f.options)).candidates[0];
 assert.equal(candidate.id,f.bank.id);assert.equal(candidate.exact,false);assert.equal(candidate.sameQuestion,true);
 await assert.rejects(promoteProjectQuestion('second',{blockId:'variant-a',mode:'create'},f.options),/poses the same question/);
 // Use existing: the bank's answers arrive, the block and its layout stay, and the booklet's skill is added.
 const before=created.sections[0].blocks[0],bank=await f.readBank();
 const linked=(await promoteProjectQuestion('second',{blockId:'variant-a',mode:'link-existing',targetId:f.bank.id},f.options)).project.sections[0].blocks[0];
 assert.equal(linked.content.id,before.content.id);assert.equal(linked.content.answerSpaceMm,35);
 assert.equal(linked.content.answer.worked,'$x=2$');assert.equal(linked.content.prompt,'Solve $x+1=3$');
 const amended=await f.readBank();
 assert.deepEqual(amended.classification.secondarySkillIds,['solve-linear-2-step']);assert.equal(amended.classification.primarySkillId,'solve-linear-1-step');
 assert.deepEqual({...amended,updatedAt:null,classification:null},{...bank,updatedAt:null,classification:null});
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(f.bankRoot,'.revisions',bank.id,revisionHash(bank)+'.json'),'utf8')),bank);
 assert.equal(linked.bankRef.revision,revisionHash(amended));
 assert.equal((await getProjectBankSync('second',f.options)).items[0].state,'synced');
 assert.equal((await getProjectBankSync(f.project.id,f.options)).items[0].state,'synced');
 // Keep separate: the decision names the record, saves without publishing, then allows creation.
 const decided=(await promoteProjectQuestion('second',{blockId:'variant-b',mode:'distinct',targetId:f.bank.id},f.options)).project.sections[0].blocks[1];
 assert.deepEqual(decided.bankDecision,{decision:'distinct',of:[f.bank.id]});assert.equal(decided.bankRef,null);
 assert.equal((await bankFiles(f)).length,1);
 assert.equal((await resolveBankOutcomes([decided],f.bankRoot)).get('variant-b').outcome,'new');
 const separate=await promoteProjectQuestion('second',{blockId:'variant-b',mode:'create'},f.options);
 assert.equal((await bankFiles(f)).length,2);assert.notEqual(separate.question.id,f.bank.id);
});

test('a classification-only bank revision leaves a locally edited consumer local',async t=>{
 const f=await fixture(t),copy=await duplicateBookletProject(f.project.id,{...f.options,copyId:'adapted'});
 copy.sections[0].blocks[0].content.prompt='Solve $x+1=5$';
 await saveBookletProject(copy,{...f.options,expectedRevision:copy.revision});
 assert.equal((await getProjectBankSync('adapted',f.options)).items[0].state,'local');
 await writeTransaction((await secondarySkillAmendment(f.bankRoot,await f.readBank(),'solve-linear-2-step')).entries);
 assert.equal(await secondarySkillAmendment(f.bankRoot,await f.readBank(),'solve-linear-2-step'),null);
 assert.equal((await getProjectBankSync('adapted',f.options)).items[0].state,'local');
 assert.equal((await getProjectBankSync(f.project.id,f.options)).items[0].state,'synced');
});

test('detaching a consumer records the decision and the bank editor cannot create an identical record',async t=>{
 const f=await fixture(t),copy=await duplicateBookletProject(f.project.id,{...f.options,copyId:'detached'});
 copy.sections[0].blocks[0].content.answer.worked='Another method.';
 const saved=await saveBookletProject(copy,{...f.options,expectedRevision:copy.revision});
 const owner=await loadBookletProject(f.project.id,f.options);owner.sections[0].blocks[0].content.answer.short='$x=2$';
 await saveBookletProject(owner,{...f.options,expectedRevision:owner.revision});
 const item=(await getProjectBankSync('detached',f.options)).items[0];
 const kept=(await resolveProjectBankSync('detached',{...item,action:'keep-local',expectedRevision:saved.revision},f.options)).sections[0].blocks[0];
 assert.deepEqual(kept.bankDecision,{decision:'distinct',of:[f.bank.id]});assert.equal(kept.bankRef,null);
 assert.equal((await resolveBankOutcomes([kept],f.bankRoot)).get(kept.id).outcome,'new');
 const bank=await f.readBank();
 await assert.rejects(assertNoBankDuplicate(f.bankRoot,{...bank,id:'q-another'}),/identical to bank question/);
 await assertNoBankDuplicate(f.bankRoot,bank);
 await assertNoBankDuplicate(f.bankRoot,{...bank,id:'q-another',content:{...bank.content,prompt:'Solve $x+1=4$'}});
});


test('a linked consumer can explicitly replace the bank without taking ownership or updating pinned peers',async t=>{
 const f=await fixture(t),copy=await duplicateBookletProject(f.project.id,{...f.options,copyId:'publisher'}),peer=await duplicateBookletProject(f.project.id,{...f.options,copyId:'pinned'});
 const peerBefore=await fs.readFile(path.join(f.projectRoot,peer.id+'.json'),'utf8');
 const bankBefore=await f.readBank(),linksFile=path.join(f.bankRoot,'.sync','links.json'),linksBefore=JSON.parse(await fs.readFile(linksFile,'utf8'));
 const block=copy.sections[0].blocks[0];block.content.id='independent-root';block.content.answer.short='3';block.content.answer.worked='$x=3$';
 const saved=await saveBookletProject(copy,{...f.options,expectedRevision:copy.revision}),item=(await getProjectBankSync(copy.id,f.options)).items[0];
 assert.equal(item.state,'local');assert.ok(item.local&&item.bank);
 await assert.rejects(resolveProjectBankSync(copy.id,{...item,action:'use-booklet',bankRevision:'stale',expectedRevision:saved.revision},f.options),/changed/);
 const published=await resolveProjectBankSync(copy.id,{...item,action:'use-booklet',expectedRevision:saved.revision},f.options),bank=await f.readBank();
 assert.equal(bank.id,bankBefore.id);assert.equal(bank.content.id,bankBefore.content.id);assert.equal(bank.content.answer.short,'3');
 assert.deepEqual(bank.classification,bankBefore.classification);assert.deepEqual(bank.presentation,bankBefore.presentation);
 assert.deepEqual(published.sections[0].blocks[0].content,saved.sections[0].blocks[0].content);
 assert.deepEqual(published.settings.layoutOverrides,saved.settings.layoutOverrides);
 assert.deepEqual(JSON.parse(await fs.readFile(linksFile,'utf8')),linksBefore,'automatic owner remains unchanged');
 assert.equal(await fs.readFile(path.join(f.projectRoot,peer.id+'.json'),'utf8'),peerBefore,'peer stays pinned');
 assert.equal((await getProjectBankSync(copy.id,f.options)).items[0].state,'synced');
 assert.equal((await getProjectBankSync(f.project.id,f.options)).items[0].state,'update');
 await saveBookletProject(await loadBookletProject(f.project.id,f.options),{...f.options,expectedRevision:f.project.revision});
 assert.equal((await f.readBank()).content.answer.short,'3','an unchanged owner save cannot overwrite explicit publication');
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(f.bankRoot,'.revisions',bank.id,revisionHash(bankBefore)+'.json'),'utf8')),bankBefore);
});

test('accidental disconnection can be reconnected without changing content, or published directly',async t=>{
 const f=await fixture(t),copy=await duplicateBookletProject(f.project.id,{...f.options,copyId:'recovery'});
 copy.sections[0].blocks[0].content.answer.worked='Local working';
 let saved=await saveBookletProject(copy,{...f.options,expectedRevision:copy.revision}),item=(await getProjectBankSync(copy.id,f.options)).items[0];
 saved=await resolveProjectBankSync(copy.id,{...item,action:'keep-local',expectedRevision:saved.revision},f.options);
 const bankBefore=await f.readBank();item=(await getProjectBankSync(copy.id,f.options)).items[0];
 assert.equal(item.state,'detached');
 const reconnect=await resolveProjectBankSync(copy.id,{...item,action:'reconnect',expectedRevision:saved.revision},f.options);
 assert.deepEqual(reconnect.sections[0].blocks[0].content,saved.sections[0].blocks[0].content);
 assert.deepEqual(await f.readBank(),bankBefore);assert.equal(reconnect.sections[0].blocks[0].bankDecision,undefined);
 item=(await getProjectBankSync(copy.id,f.options)).items[0];assert.equal(item.state,'local');
 saved=await resolveProjectBankSync(copy.id,{...item,action:'keep-local',expectedRevision:reconnect.revision},f.options);
 item=(await getProjectBankSync(copy.id,f.options)).items[0];
 const published=await resolveProjectBankSync(copy.id,{...item,action:'use-booklet',expectedRevision:saved.revision},f.options);
 assert.equal(published.sections[0].blocks[0].bankRef.id,f.bank.id);
 assert.equal(published.sections[0].blocks[0].bankDecision,undefined);
 assert.equal(sharedHash(published.sections[0].blocks[0]),sharedHash(await f.readBank()));
 assert.deepEqual(published.sections[0].blocks[0].content,saved.sections[0].blocks[0].content);
});
