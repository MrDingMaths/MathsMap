import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadBookletProject,saveBookletProject,promoteProjectQuestion,promoteProjectModule} from './project-studio-server.mjs';
import {normaliseQuestion} from '../../src/lib/practice-question-model.js';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const root='output/linear-bank',id='linear-relationships-bank-working-v1';
let p=await loadBookletProject(id);
const byId=new Map(p.sections.flatMap(s=>s.blocks.map(b=>[b.id,b])));
const groups=[['page-17-q2','page-18-q2','page-19-q2','page-20-q2'],['page-78-q8','page-79-q8'],['page-46-q3','page-46-q4','page-46-q5'],['page-89-q1','page-89-q2','page-89-q3'],['page-32-q4','page-32-q4-continued'],['page-34-q8','page-34-q8-continued'],['page-34-q9','page-34-q9-continued']];
for(const group of groups)for(const sourceId of group){const b=byId.get(sourceId);b.presentation.selectionGroup={questionIds:group.map(id=>byId.get(id).bankRef.id),reason:'Retain the complete source continuation or dependent comparison.'};}
await saveBookletProject(p,{expectedRevision:p.revision});
for(const b of byId.values())if(b.type==='question'){
 const q=JSON.parse(await fs.readFile('booklets/question-bank/'+b.bankRef.id+'.json','utf8'));
 if(q.presentation?.ownerId===b.id&&JSON.stringify(q.presentation.selectionGroup)===JSON.stringify(b.presentation.selectionGroup))continue;
 await promoteProjectQuestion(id,{blockId:b.id,mode:'update'});
}
p=await loadBookletProject(id);
for(const section of p.sections)await promoteProjectModule(id,{sectionId:section.id,id:'linear-relationships-'+section.id.replace('linear-module-','').toLowerCase(),title:section.title,classification:{primarySkillId:p.studio.atoms[section.blocks.find(b=>p.studio.atoms[b.id]?.skillIds?.length)?.id]?.skillIds[0],secondarySkillIds:[...new Set(section.blocks.flatMap(b=>p.studio.atoms[b.id]?.skillIds??[]))],mappingStatus:'cross-skill'}});
const inventory=JSON.parse(await fs.readFile(root+'/inventory.json','utf8'));
for(const module of inventory.modules)for(const item of module.blocks){const b=byId.get(item.id),current=p.sections.flatMap(s=>s.blocks).find(v=>v.id===item.id);item.bankRef=current?.bankRef??null;item.provenance=b?.provenance??null;}
await fs.writeFile(root+'/inventory.json',JSON.stringify(inventory,null,2));
const checks=[];
for(const b of p.sections.flatMap(s=>s.blocks).filter(b=>b.type==='question')){
 const bank=JSON.parse(await fs.readFile('booklets/question-bank/'+b.bankRef.id+'.json','utf8'));
 if(hash(normaliseQuestion(b).content)!==hash(bank.content)||hash(b.presentation)!==hash(bank.presentation))throw Error('Transfer mismatch '+b.id);
 checks.push({sourceBlockId:b.id,bankId:bank.id,contentEqual:true,presentationEqual:true});
}
await fs.writeFile(root+'/transfer-verification.json',JSON.stringify({baseline:inventory.baseline,questions:checks,dependencyGroups:groups,sourceUnchanged:createHash('sha256').update(await fs.readFile('booklets/projects/linear-relationships-complete-v1.json')).digest('hex')===inventory.baseline.sha256},null,2));
console.log('Finalized '+checks.length+' questions, 13 modules and '+groups.length+' dependent groups.');
