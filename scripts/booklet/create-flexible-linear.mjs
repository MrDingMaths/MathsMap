// Creates a consumer copy through the same validated persistence path as Studio.
// Safe to rerun: an existing flexible project is reported, never overwritten.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {duplicateBookletProject} from './project-studio-server.mjs';
import {convertToFlexible,logicalUnits} from '../../src/lib/booklet-flow.js';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
const sourceFile='booklets/projects/linear-relationships-complete-v1.json',copyId='linear-relationships-flexible-v1';
const bytes=fs.readFileSync(sourceFile),source=JSON.parse(bytes),hash=b=>createHash('sha256').update(b).digest('hex');
const candidate=convertToFlexible(source),checked=validateEditableProject(candidate);
if(!checked.valid)throw Error(checked.errors.join('; '));
const blocks=p=>p.sections.flatMap(s=>s.blocks);
if(blocks(candidate).length!==blocks(source).length)throw Error('Conversion changed the number of source blocks');
for(const b of blocks(candidate)){const old=blocks(source).find(o=>o.id===b.id);for(const key of ['content','bankRef','classification'])if(JSON.stringify(b[key])!==JSON.stringify(old[key]))throw Error(`Conversion changed ${key} for ${b.id}`);}
console.log(JSON.stringify({topics:candidate.topics.length,sections:candidate.sections.length,blocks:blocks(candidate).length,logicalUnits:logicalUnits(candidate).length,sourceHash:hash(bytes)}));
if(process.argv.includes('--apply')){
 const target=`booklets/projects/${copyId}.json`;
 if(fs.existsSync(target))console.log('Existing flexible copy retained: '+target);
 else{const created=await duplicateBookletProject(source.id,{copyId,title:'Linear Relationships — Flexible',flexible:true});console.log('Created '+created.id);}
 if(hash(fs.readFileSync(sourceFile))!==hash(bytes))throw Error('The source changed during creation');
 console.log('Studio: http://127.0.0.1:5173/#/booklet?stage=projects&project='+copyId);
}else console.log('Candidate verified. Pass --apply to create the flexible copy.');
