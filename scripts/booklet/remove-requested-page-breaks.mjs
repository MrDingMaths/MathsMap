import fs from 'node:fs';
import assert from 'node:assert/strict';
import {resolveArrangement} from '../../src/lib/booklet-arrangement.js';
import {findArrangement,arrangementItems} from '../../public/libs/maths-editor/arrangement-model.mjs';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {saveBookletProject} from './project-studio-server.mjs';

const file='booklets/projects/linear-relationships-complete-v1.json';
const before=JSON.parse(fs.readFileSync(file));
const project=structuredClone(before),pages=new Set([32,34,60]);
let breaks=0,merges=0;
for(const section of project.sections.filter(s=>pages.has(s.sourcePageNumber))){
 for(const continuation of section.blocks.filter(b=>b.id.endsWith('-continued'))){
  const block=section.blocks.find(b=>b.id===continuation.id.slice(0,-10));
  assert(block?.type==='question');
  assert.deepEqual(block.content.prompt,continuation.content.prompt);
  assert.equal(continuation.content.questionDiagrams.length,0);
  block.content.children.push(...continuation.content.children);
  block.continuationSources=[block.id,continuation.id];
  const layout=project.settings.layoutOverrides.blockLayouts[block.id];
  if(layout?.arrangement){
   const initial=resolveArrangement(block,null,project.settings.layoutOverrides).tree;
   const groupId=block.content.id+':parts';
   const target=findArrangement(layout.arrangement.root,groupId);
   const source=findArrangement(initial.root,groupId);
   assert(target&&source);
   const used=new Set(arrangementItems(layout.arrangement.root).map(n=>n.ref));
   for(const row of source.children){
    const refs=arrangementItems(row).map(n=>n.ref);
    if(refs.every(ref=>!used.has(ref)))target.children.push(row);
    else assert(refs.every(ref=>used.has(ref)),'Unexpected partially arranged row');
   }
   assert.equal(resolveArrangement(block,layout.arrangement).missing.length,0);
  }
  section.blocks=section.blocks.filter(b=>b!==continuation);
  merges++;
 }
 breaks+=section.blocks.filter(b=>b.type==='page-break').length;
 section.blocks=section.blocks.filter(b=>b.type!=='page-break');
}
// Every question part, including its tables and answers, must survive unchanged.
for(const section of before.sections){
 const next=project.sections.find(s=>s.id===section.id);
 if(!pages.has(section.sourcePageNumber)){assert.deepEqual(next,section);continue;}
 const parts=s=>s.blocks.filter(b=>b.type==='question').flatMap(b=>b.content.children??[]);
 assert.deepEqual(parts(next),parts(section));
 for(const block of section.blocks.filter(b=>b.type==='question'&&!b.content.children?.length))assert.deepEqual(next.blocks.find(b=>b.id===block.id),block);
 assert(!next.blocks.some(b=>b.type==='page-break'));
}
const check=validateEditableProject(project);
assert(check.valid,JSON.stringify(check.errors));
if(breaks||merges){
 const saved=await saveBookletProject(project,{expectedRevision:before.revision});
 console.log(`Saved revision ${saved.revision}: removed ${breaks} breaks and rejoined ${merges} questions on pages 32, 34 and 60. All parts and answers preserved.`);
}else console.log('These pages already have no forced breaks.');
