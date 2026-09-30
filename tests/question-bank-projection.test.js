import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {bankProjectionPolicy,projectBankQuestion,mergeBankIntoBooklet} from '../src/lib/question-bank-projection.js';
import {createEditableProject,createProjectBlock} from '../src/lib/editable-booklet-model.js';
import {createBookletProject,promoteProjectQuestion,saveBookletProject,loadBookletProject,getProjectBankSync,resolveProjectBankSync} from '../scripts/booklet/project-studio-server.mjs';
import {writeTransaction,syncLinks} from '../scripts/booklet/bank-sync.mjs';
import {arrangementCatalog,resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {fromSource} from '../src/lib/document-content.js';

function question(){
 const b=createProjectBlock('question');b.id='source-question';
 b.classification={primarySkillId:'solve-linear-1-step'};
 b.sourceReview={sourceCategoryHeading:{text:'Concept check',paragraphId:'category'},sourceIdentity:{category:'concept check'}};
 b.content.prompt=fromSource('Solve $x+1=3$.');b.content.prompt.blocks[0].id='task';
 b.content.prompt.blocks.unshift({id:'category',type:'paragraph',align:'right',inlines:[{type:'text',text:'Concept check',bold:true}]});
 b.content.answer={short:'2',worked:'Subtract 1 from each side: $x=2$.',solutionDiagrams:[]};
 b.presentation={layoutOverrides:{blockLayouts:{[b.id]:{arrangement:arrangementCatalog(b).initial}}}};
 return b;
}

test('projection removes only the declared heading and its layout slot without mutating source',()=>{
 const b=question(),before=structuredClone(b);const projected=projectBankQuestion(b);
 assert.deepEqual(b,before);assert.equal(projected.content.prompt.blocks.length,1);
 assert.deepEqual(projected.content.answer,b.content.answer);
 const tree=projected.presentation.layoutOverrides.blockLayouts[b.id].arrangement;
 assert.deepEqual(resolveArrangement(projected,tree).missing,[]);
 assert.ok(!JSON.stringify(tree).includes('/prompt#category'));
 b.content.prompt.blocks.push({id:'instruction',type:'paragraph',inlines:[{type:'text',text:'Use the concept check results to explain your answer.'}]});
 assert.equal(projectBankQuestion(b).content.prompt.blocks.at(-1).id,'instruction');
 delete b.sourceReview;assert.deepEqual(projectBankQuestion(b),b);
});

test('nested headings and bank edits restore the owner paragraph at its original position',()=>{
 const b=question(),child={...structuredClone(b.content),id:'child'};
 b.content.prompt='Solve these equations.';b.content.children=[child];
 const policy=bankProjectionPolicy(b);assert.equal(policy.omitCategoryHeadings[0].nodeId,'child');
 const incoming=projectBankQuestion(b).content;incoming.children[0].prompt.blocks[0].inlines[0].text='Solve $x+1=4$.';
 const merged=mergeBankIntoBooklet(incoming,b,null,policy);
 assert.equal(merged.children[0].prompt.blocks[0].id,'category');
 assert.equal(merged.children[0].prompt.blocks[1].inlines[0].text,'Solve $x+1=4$.');
});

test('explicit equivalent notation repairs are bank-only and survive a reverse sync',()=>{
 const b=question();b.content.answer.worked=String.raw`Use $y=1/(x^2-1)$ and retain the source instruction.`;
 const policy={...bankProjectionPolicy(b),notationReplacements:[{nodeId:b.content.id,field:'answer.worked',from:'y=1/(x^2-1)',to:String.raw`y=\frac{1}{x^2-1}`} ]};
 const projected=projectBankQuestion(b,{policy});
 assert.equal(projected.content.answer.worked,String.raw`Use $y=\frac{1}{x^2-1}$ and retain the source instruction.`);
 assert.equal(b.content.answer.worked,String.raw`Use $y=1/(x^2-1)$ and retain the source instruction.`);
 assert.equal(mergeBankIntoBooklet(projected.content,b,null,policy).answer.worked,b.content.answer.worked);
 projected.content.answer.worked=String.raw`A changed bank answer: $y=\frac{2}{x^2-1}$.`;
 assert.equal(mergeBankIntoBooklet(projected.content,b,null,policy).answer.worked,projected.content.answer.worked);
});

test('promotion, owner saves, bank acceptance and conflicts keep source headings local',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'bank-projection-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank'),moduleRoot:path.join(root,'modules')};
 const p=createEditableProject({id:'heading-owner',title:'Owner'}),b=question();p.sections[0].blocks=[b];
 p.settings.layoutOverrides={blockLayouts:{[b.id]:structuredClone(b.presentation.layoutOverrides.blockLayouts[b.id])}};
 await createBookletProject(p,options);
 let {project,question:bank}=await promoteProjectQuestion(p.id,{blockId:b.id,mode:'create'},options);
 const file=path.join(options.bankRoot,bank.id+'.json'),read=async()=>JSON.parse(await fs.readFile(file,'utf8'));
 assert.equal(bank.content.prompt.blocks.length,1);assert.ok((await syncLinks(options.bankRoot))[bank.id].projection);
 const unchanged=await loadBookletProject(p.id,options);assert.equal(unchanged.sections[0].blocks[0].content.prompt.blocks[0].id,'category');
 assert.equal((await getProjectBankSync(p.id,options)).items[0].state,'synced');
 project.sections[0].blocks[0].content.answer.worked='Subtract 1: $x=2$.';
 project=await saveBookletProject(project,{...options,expectedRevision:project.revision});
 bank=await read();assert.equal(bank.content.prompt.blocks.length,1);assert.equal(bank.content.answer.worked,'Subtract 1: $x=2$.');
 bank.content.prompt.blocks[0].inlines[0].text='Solve $x+1=4$.';
 await writeTransaction([[file,bank]]);
 let status=(await getProjectBankSync(p.id,options)).items[0];assert.equal(status.state,'update');
 project=await resolveProjectBankSync(p.id,{...status,action:'use-bank',expectedRevision:project.revision},options);
 const local=project.sections[0].blocks[0];assert.equal(local.content.prompt.blocks[0].id,'category');
 assert.equal(local.content.prompt.blocks[1].inlines[0].text,'Solve $x+1=4$.');
 assert.deepEqual(resolveArrangement(local,project.settings.layoutOverrides.blockLayouts[b.id].arrangement).missing,[]);
 local.content.answer.short='Local edit';bank=await read();bank.content.answer.short='Bank edit';await writeTransaction([[file,bank]]);
 project=await saveBookletProject(project,{...options,expectedRevision:project.revision});
 status=(await getProjectBankSync(p.id,options)).items[0];assert.equal(status.state,'conflict');
 project=await resolveProjectBankSync(p.id,{...status,action:'use-booklet',expectedRevision:project.revision},options);
 assert.equal((await read()).content.answer.short,'Local edit');assert.equal((await read()).content.prompt.blocks.length,1);
 assert.equal((await loadBookletProject(p.id,options)).sections[0].blocks[0].content.prompt.blocks[0].id,'category');
});
