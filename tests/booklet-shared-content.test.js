import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createEditableProject,createProjectBlock} from '../src/lib/editable-booklet-model.js';
import {createBookletProject,saveBookletProject,loadBookletProject,promoteProjectQuestion,getProjectBankSync,duplicateBookletProject,getProjectShared,resolveProjectShared} from '../scripts/booklet/project-studio-server.mjs';
import {seedSharedContent,refreshSharedRegistry,readRegistry,mergeSharedBlock,comparePageMaps,blockHash,sharedReport,runPageChecks,busyProjects} from '../scripts/booklet/shared-content.mjs';

const TEACHING='A ratio compares two quantities of the same kind. To simplify a ratio, divide every term by their highest common factor, exactly as for a fraction. A map scale such as 1 : 50 000 means that 1 cm on the map represents 50 000 cm, or 500 m, on the ground. Always convert both quantities to the same unit before simplifying.';

function question(id,{prompt='A map has scale 1 : 50 000. Two towns are 4 cm apart on the map.',parts=['How far apart are they in metres?','How far apart are they in kilometres?']}={}){
 const b=createProjectBlock('question');b.id=id;b.content.id=id+'-root';
 b.classification={primarySkillId:'ratio-real-life-problems',secondarySkillIds:[],reasoningScore:30,difficulty:'Development',difficultyReason:'x'};
 b.content.prompt=prompt;b.content.answer=null;
 b.content.children=parts.map((text,i)=>({id:id+'-part-'+'abcdefgh'[i],type:'part',label:'abcdefgh'[i],prompt:text,answer:{short:String(i),worked:'Working '+i},answerSpaceMm:15}));
 return b;
}
function teaching(id,text=TEACHING){const b=createProjectBlock('rich-text');b.id=id;b.content=text;return b;}
async function library(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'booklet-shared-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank'),moduleRoot:path.join(root,'modules'),busy:new Set()};
 const roots={sharedRoot:path.join(root,'shared-content'),checkRoot:path.join(root,'shared-checks')};
 const make=async(id,blocks,edit=()=>{})=>{const p=createEditableProject({id,title:id.toUpperCase()});p.sections[0].blocks=blocks;edit(p);return createBookletProject(p,options);};
 const a=await make('ratios',[teaching('r-teach'),teaching('r-tiny','Simplify.'),question('r-q1')]);
 const bq=question('s-q1');bq.number=7;bq.classification.primarySkillId='similar-figures-scale';bq.sourceReview={reuse:{projectId:'ratios',blockId:'r-q1'}};
 const b=await make('similarity',[teaching('s-teach'),teaching('s-tiny','Simplify.'),bq],p=>{p.settings.layoutOverrides.answerSpaces['s-q1-part-a']=42;});
 const c=await make('standard',[question('m-q1')]);
 return {root,options,roots,a,b,c,load:id=>loadBookletProject(id,options),block:(p,id)=>p.sections.flatMap(s=>s.blocks).find(x=>x.id===id)};
}
const edit=async(f,projectId,blockId,change)=>{const p=await f.load(projectId);change(f.block(p,blockId));return saveBookletProject(p,{...f.options,expectedRevision:p.revision});};
const status=async(f,projectId,blockId)=>(await getProjectShared(projectId,f.options)).members.find(m=>m.blockId===blockId)?.status;

test('seeding links reuse copies and identical substantive blocks, skips tiny ones and changes no booklet',async t=>{
 const f=await library(t);
 const preview=await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots});
 assert.equal(preview.groupsCreated,2);
 assert.equal(Object.keys((await readRegistry(f.roots.sharedRoot)).groups).length,0,'a preview writes nothing');
 const seeded=await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 const groups=Object.values((await readRegistry(f.roots.sharedRoot)).groups);
 assert.deepEqual(groups.map(g=>g.members.map(m=>m.blockId).sort()).sort(),[['m-q1','r-q1','s-q1'],['r-teach','s-teach']]);
 assert.equal(seeded.diverged.length,0);
 assert.equal((await f.load('ratios')).revision,f.a.revision,'booklets are untouched');
 assert.equal((await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true})).membersAdded,0,'seeding is repeatable');
});

test('a reuse copy that already differs is seeded as diverged, not changed',async t=>{
 const f=await library(t);
 await edit(f,'similarity','s-q1',b=>{b.content.children[1].answer.short='2 km';});
 const seeded=await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 assert.deepEqual(seeded.diverged.map(d=>d.blockId),['s-q1']);
 assert.equal(await status(f,'similarity','s-q1'),'diverged');
 assert.equal(await status(f,'ratios','r-q1'),'synced');
});

test('merge keeps target IDs, layout, numbering and classification and maps an inserted part exactly',async t=>{
 const f=await library(t);
 await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 // Insert a new first part in Ratios: a positional match alone would misalign every part.
 await edit(f,'ratios','r-q1',b=>{b.content.children.unshift({id:'r-new',type:'part',label:'a',prompt:'Measure the distance on the map.',answer:{short:'4 cm',worked:'Read the ruler.'},answerSpaceMm:10});b.content.children[1].label='b';b.content.children[2].label='c';});
 assert.equal(await status(f,'ratios','r-q1'),'edited');
 const result=await resolveProjectShared('ratios',{action:'apply-all',blockId:'r-q1'},f.options);
 assert.deepEqual(result.results.map(r=>[r.projectId,r.updated.length]).sort(),[['similarity',1],['standard',1]]);
 const s=await f.load('similarity'),copy=f.block(s,'s-q1');
 assert.deepEqual(copy.content.children.map(c=>c.id),['s-q1-r-new','s-q1-part-a','s-q1-part-b']);
 assert.equal(copy.content.children[1].prompt,'How far apart are they in metres?');
 assert.equal(s.settings.layoutOverrides.answerSpaces['s-q1-part-a'],42,'answer space stays with its part');
 assert.equal(copy.number,7);assert.equal(copy.classification.primarySkillId,'similar-figures-scale');
 assert.deepEqual(copy.sourceReview.reuse,{projectId:'ratios',blockId:'r-q1'});
 assert.equal(blockHash(copy),blockHash(f.block(await f.load('ratios'),'r-q1')));
 for(const id of ['ratios','similarity','standard'])assert.equal((await getProjectShared(id,f.options)).members.find(m=>m.groupId).status,'synced');
 const checks=(await getProjectShared('similarity',f.options)).checks;
 assert.equal(checks.length,1);assert.deepEqual(checks[0].editions,['student','short','worked']);
});

test('teaching edits apply to all copies and keep-separate stops further updates',async t=>{
 const f=await library(t);
 await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 await edit(f,'similarity','s-teach',b=>{b.content=TEACHING+' Scale factors work the same way.';});
 await resolveProjectShared('similarity',{action:'apply-all',blockId:'s-teach'},f.options);
 assert.equal(f.block(await f.load('ratios'),'r-teach').content,TEACHING+' Scale factors work the same way.');
 await edit(f,'ratios','r-teach',b=>{b.content=TEACHING+' Stage 4 only.';});
 await resolveProjectShared('ratios',{action:'keep-separate',blockId:'r-teach',reason:'Stage 4 wording'},f.options);
 assert.equal(await status(f,'ratios','r-teach'),'separate');
 await edit(f,'similarity','s-teach',b=>{b.content=TEACHING+' Second change.';});
 await resolveProjectShared('similarity',{action:'apply-all',blockId:'s-teach'},f.options);
 assert.equal(f.block(await f.load('ratios'),'r-teach').content,TEACHING+' Stage 4 only.','a separate copy is not overwritten');
});

test('a busy booklet is held behind and catches up later; a concurrent edit is a conflict',async t=>{
 const f=await library(t);
 await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 await edit(f,'standard','m-q1',b=>{b.content.prompt='Standard edit.';});
 await edit(f,'ratios','r-q1',b=>{b.content.prompt='Ratios edit.';});
 const busy={...f.options,busy:new Set(['similarity'])};
 const result=await resolveProjectShared('ratios',{action:'apply-all',blockId:'r-q1'},busy);
 assert.equal(result.results.find(r=>r.projectId==='similarity').skipped,'busy');
 assert.equal(await status(f,'similarity','s-q1'),'behind');
 assert.equal(await status(f,'standard','m-q1'),'edited','an undecided edit elsewhere is not overwritten');
 await assert.rejects(resolveProjectShared('standard',{action:'apply-all',blockId:'m-q1'},f.options),/changed this shared content/);
 const s=await f.load('similarity');
 const caught=await resolveProjectShared('similarity',{action:'catch-up',expectedRevision:s.revision},f.options);
 assert.equal(caught.updated.length,1);assert.equal(f.block(caught.project,'s-q1').content.prompt,'Ratios edit.');
 const used=await resolveProjectShared('standard',{action:'use-shared',blockId:'m-q1'},f.options);
 assert.equal(f.block(used.project,'m-q1').content.prompt,'Ratios edit.');
 assert.equal(await status(f,'standard','m-q1'),'synced');
});

test('applying from a diverged copy makes every copy take that version',async t=>{
 const f=await library(t);
 await edit(f,'similarity','s-q1',b=>{b.content.children[1].answer.short='2 km';});
 await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 await resolveProjectShared('similarity',{action:'apply-all',blockId:'s-q1'},f.options);
 assert.equal(f.block(await f.load('ratios'),'r-q1').content.children[1].answer.short,'2 km');
 assert.equal((await sharedReport({projectRoot:f.options.projectRoot,...f.roots})).attention.length,0);
});

test('new imports whose reuse source is shared join on save',async t=>{
 const f=await library(t);
 await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 const q=question('n-q1');q.sourceReview={reuse:{projectId:'ratios',blockId:'r-q1'}};
 const p=createEditableProject({id:'new-import',title:'New'});p.sections[0].blocks=[q];await createBookletProject(p,f.options);
 assert.equal(await status(f,'new-import','n-q1'),'synced');
});

test('a bank-owned shared question updates the bank, and its consumer shows synced',async t=>{
 const f=await library(t);
 await promoteProjectQuestion('ratios',{blockId:'r-q1',mode:'create'},f.options);
 const consumer=await duplicateBookletProject('ratios',{...f.options,title:'Consumer'});
 await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 await edit(f,'similarity','s-q1',b=>{b.content.prompt='Edited in Similarity.';});
 await resolveProjectShared('similarity',{action:'apply-all',blockId:'s-q1'},f.options);
 const owner=(await getProjectBankSync('ratios',f.options)).items[0];
 assert.equal(owner.state,'synced');
 const bank=JSON.parse(await fs.readFile(path.join(f.options.bankRoot,owner.bankId+'.json'),'utf8'));
 assert.equal(bank.content.prompt,'Edited in Similarity.');
 assert.ok(['synced','update'].includes((await getProjectBankSync(consumer.id,f.options)).items[0].state));
});

test('class copies are not linked unless asked',async t=>{
 const f=await library(t);
 const copy=await duplicateBookletProject('ratios',{...f.options,title:'Ratios for 7AP'});
 const p=await f.load(copy.id);p.library={...p.library,category:'class',classLabel:'7AP'};await saveBookletProject(p,{...f.options,expectedRevision:p.revision});
 const members=report=>report.groups.flatMap(g=>g.members.map(m=>m.split('/')[0]));
 assert.ok(!members(await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots})).includes(copy.id));
 assert.ok(members(await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,includeClassCopies:true})).includes(copy.id));
});

test('copies differing only in cloze or column widths are the same content, and keep their own widths',async t=>{
 const f=await library(t);
 await edit(f,'similarity','s-q1',b=>{b.content.children[0].prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:'s-para',type:'paragraph',inlines:[{type:'text',text:'Distance in metres: '},{type:'cloze',width:30}]}]};});
 await edit(f,'ratios','r-q1',b=>{b.content.children[0].prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:'r-para',type:'paragraph',inlines:[{type:'text',text:'Distance in metres: '},{type:'cloze',width:18}]}]};});
 const seeded=await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 assert.equal(seeded.diverged.length,0,'width alone is not a difference');
 assert.deepEqual(seeded.groups.find(g=>g.type==='question').members.sort(),['ratios/r-q1','similarity/s-q1'],'Standard, without the cloze, is different content');
 await edit(f,'ratios','r-q1',b=>{b.content.children[1].prompt='How far apart are they in km?';});
 await resolveProjectShared('ratios',{action:'apply-all',blockId:'r-q1'},f.options);
 const copy=f.block(await f.load('similarity'),'s-q1');
 assert.equal(copy.content.children[1].prompt,'How far apart are they in km?');
 assert.equal(copy.content.children[0].prompt.blocks[0].inlines[1].width,30);
});

test('refresh follows the library: new identical copies join, deleted ones leave, same-booklet duplicates stay out',async t=>{
 const f=await library(t);
 await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 const p=createEditableProject({id:'later',title:'Later'});p.sections[0].blocks=[teaching('l-teach'),question('l-q1')];await createBookletProject(p,f.options);
 await edit(f,'ratios','r-q1',()=>{});
 const r=await f.load('ratios');r.sections[0].blocks.push(JSON.parse(JSON.stringify(f.block(r,'r-q1')).replaceAll('r-q1','r-dup')));
 await saveBookletProject(r,{...f.options,expectedRevision:r.revision});
 const refreshed=await refreshSharedRegistry({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 assert.equal(refreshed.membersAdded,2);
 const members=async()=>Object.values((await readRegistry(f.roots.sharedRoot)).groups).flatMap(g=>g.members.map(m=>m.blockId)).sort();
 assert.deepEqual(await members(),['l-q1','l-teach','m-q1','r-q1','r-teach','s-q1','s-teach']);
 const s=await f.load('similarity');s.sections[0].blocks=s.sections[0].blocks.filter(b=>b.id!=='s-teach');
 await fs.writeFile(path.join(f.options.projectRoot,'similarity.json'),JSON.stringify(s)); // written outside Studio, as an import would
 assert.equal((await refreshSharedRegistry({projectRoot:f.options.projectRoot,...f.roots,apply:true})).membersRemoved,1);
 assert.ok(!(await members()).includes('s-teach'));
 assert.equal((await refreshSharedRegistry({projectRoot:f.options.projectRoot,...f.roots,apply:true})).changedBooklets,0,'unchanged booklets are not read again');
});

test('a new question in a shared exercise is offered, placed after the matching copy, and linked',async t=>{
 const f=await library(t);
 await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 const add=async(id,afterId,prompt)=>{const p=await f.load('similarity'),blocks=p.sections[0].blocks,q=question(id,{prompt,parts:['Find it.']});blocks.splice(blocks.findIndex(b=>b.id===afterId)+1,0,q);return saveBookletProject(p,{...f.options,expectedRevision:p.revision});};
 await add('s-new1','s-q1','A scale drawing uses 1 : 200. A wall is 3 cm long on the drawing.');
 let offer=(await getProjectShared('similarity',f.options)).offers[0];
 assert.equal(offer.blockId,'s-new1');assert.match(offer.excerpt,/scale drawing/);
 assert.deepEqual(offer.targets.map(t=>t.projectId).sort(),['ratios','standard']);
 const ratiosSection=offer.targets.find(t=>t.projectId==='ratios');
 const result=await resolveProjectShared('similarity',{action:'offer-add',blockId:'s-new1',targets:[ratiosSection]},f.options);
 assert.deepEqual(result.results.map(r=>[r.projectId,r.updated.length]),[['ratios',1]]);
 let order=(await f.load('ratios')).sections[0].blocks.map(b=>b.id);
 assert.equal(order.indexOf('r-q1')+1,order.findIndex(id=>id.endsWith('-s-new1')),'placed after the copy of the question before it');
 const copy=f.block(await f.load('ratios'),order[order.indexOf('r-q1')+1]);
 assert.deepEqual(copy.sourceReview.reuse,{projectId:'similarity',blockId:'s-new1'});assert.equal(copy.bankRef,null);
 assert.equal(await status(f,'similarity','s-new1'),'synced');
 assert.deepEqual((await getProjectShared('similarity',f.options)).offers,[],'Standard was not chosen and is not asked again');
 assert.equal((await getProjectShared('ratios',f.options)).checks.find(c=>c.added).editions.length,3);
 // A second new question follows the first copy.
 await add('s-new2','s-new1','A model car is built at 1 : 43. The model is 10 cm long.');
 offer=(await getProjectShared('similarity',f.options)).offers[0];
 await resolveProjectShared('similarity',{action:'offer-add',blockId:'s-new2',targets:offer.targets.filter(t=>t.projectId==='ratios')},f.options);
 order=(await f.load('ratios')).sections[0].blocks.map(b=>b.id);
 assert.deepEqual(order.slice(order.indexOf('r-q1')+1,order.indexOf('r-q1')+3).map(id=>id.replace(/^.*-(s-new\d)$/,'$1')),['s-new1','s-new2']);
 // Declining stops the offer.
 await add('s-new3','s-new2','A plan has scale 1 : 100.');
 await resolveProjectShared('similarity',{action:'offer-decline',blockId:'s-new3'},f.options);
 assert.deepEqual((await getProjectShared('similarity',f.options)).offers,[]);
});

test('imported copies and questions outside shared exercises are not offered',async t=>{
 const f=await library(t);
 await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 const p=await f.load('standard');
 const q=question('m-new',{prompt:'Not shared.'});p.sections.push({...structuredClone(p.sections[0]),id:'other-section',title:'Other',blocks:[q]});
 const imported=question('m-import',{prompt:'Imported copy.'});imported.sourceReview={reuse:{projectId:'ratios',blockId:'r-q1'}};p.sections[0].blocks.push(imported);
 await saveBookletProject(p,{...f.options,expectedRevision:p.revision});
 assert.deepEqual((await getProjectShared('standard',f.options)).offers,[]);
});

test('page maps report changed, moved and page-count changes',()=>{
 const page=(n,blocks,hash=blocks.join())=>({page:n,blocks,hash});
 const before=[page(1,['a','b']),page(2,['c']),page(3,['d'])];
 assert.deepEqual(comparePageMaps(before,[page(1,['a','b'],'x'),page(2,['c']),page(3,['d'])],['b']),{pagesBefore:3,pagesAfter:3,pageCountChanged:false,changed:[1],moved:[],otherChanged:0});
 assert.deepEqual(comparePageMaps(before,[page(1,['a']),page(2,['b','c']),page(3,['d'])],['b']),{pagesBefore:3,pagesAfter:3,pageCountChanged:false,changed:[2],moved:[1],otherChanged:0});
 assert.deepEqual(comparePageMaps(before,[page(1,['a']),page(2,['b']),page(3,['c']),page(4,['d'])],['b']),{pagesBefore:3,pagesAfter:4,pageCountChanged:true,changed:[2],moved:[1,3,4],otherChanged:0});
});

test('the page-check runner records results for the queued batch and removes its snapshots',async t=>{
 const f=await library(t);
 await seedSharedContent({projectRoot:f.options.projectRoot,...f.roots,apply:true});
 await edit(f,'ratios','r-teach',b=>{b.content=TEACHING+' More.';});
 await resolveProjectShared('ratios',{action:'apply-all',blockId:'r-teach'},f.options);
 const render=async({before,after,editions})=>({before:Object.fromEntries(editions.map(e=>[e,[{page:1,blocks:['s-teach','s-tiny','s-q1'],hash:'1'}]])),after:Object.fromEntries(editions.map(e=>[e,[{page:1,blocks:['s-teach','s-tiny'],hash:'2'},{page:2,blocks:['s-q1'],hash:'3'}]]))});
 const run=await runPageChecks('similarity',{checkRoot:f.roots.checkRoot,render});
 assert.equal(run.checked.length,1);
 const [check]=(await getProjectShared('similarity',f.options)).checks;
 assert.equal(check.status,'ready');assert.deepEqual(check.result.student,{pagesBefore:1,pagesAfter:2,pageCountChanged:true,changed:[1],moved:[2],otherChanged:0});
 assert.deepEqual((await fs.readdir(path.join(f.roots.checkRoot,'similarity'))).length,0);
 await resolveProjectShared('similarity',{action:'mark-checked',checkId:check.id},f.options);
 assert.equal((await getProjectShared('similarity',f.options)).checks.length,0);
});

test('busy detection reads live worker leases and named command lines',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'booklet-shared-busy-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(path.join(root,'run-a','workflow','worker-slots'),{recursive:true});
 await fs.writeFile(path.join(root,'run-a','workflow','worker-slots','0.json'),JSON.stringify({pid:process.pid}));
 const busy=busyProjects([{id:'a',runId:'run-a'},{id:'b',runId:'run-b'},{id:'c'}],{runRoot:root,commandLines:()=>['node scripts/booklet/lean-review.mjs content --run-id run-b']});
 assert.deepEqual([...busy].sort(),['a','b']);
});
