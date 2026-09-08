import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {shareUnchanged,resolveArrangement} from '../../src/lib/booklet-arrangement.js';
import {arrangementItems} from '../../public/libs/maths-editor/arrangement-model.mjs';
const dir='output/focused-arrangements/',before=JSON.parse(fs.readFileSync(dir+'before.json')),next=JSON.parse(fs.readFileSync(dir+'candidate.json')),changes=JSON.parse(fs.readFileSync(dir+'changes.json')),ids=new Set(changes.map(c=>c.id));
assert.equal(next.sections.length,93);assert.equal(validateEditableProject(next).valid,true);assert.deepEqual(next.source,before.source);assert.deepEqual(next.assets,before.assets);
let preserved=0;for(const s of before.sections)for(const b of s.blocks){const n=next.sections.flatMap(s=>s.blocks).find(n=>n.id===b.id);if(!ids.has(b.id)){assert.deepEqual(n,b);preserved++;}if(b.type==='question'){const walk=n=>{if(n.answer){const find=x=>x.id===n.id?x:(x.children??[]).map(find).find(Boolean);assert.deepEqual(find(next.sections.flatMap(s=>s.blocks).find(x=>x.id===b.id).content).answer,n.answer);}n.children?.forEach(walk);};walk(b.content);}}
for(const s of next.sections)for(const b of s.blocks){const tree=next.settings.layoutOverrides.blockLayouts[b.id]?.arrangement;if(!tree)continue;const r=resolveArrangement(b,tree);assert.deepEqual(r.missing,[]);const visibleRefs=arrangementItems(r.initial.root).map(n=>n.ref).filter(ref=>!ref.endsWith('/space'));const placed=new Set(arrangementItems(tree.root).map(n=>n.ref));for(const ref of visibleRefs)assert.ok(placed.has(ref),'Preserve visible content '+ref);}
const shared=shareUnchanged(before,next);assert.equal(shared.sections[0],before.sections[0]);
const result={pages:93,unchangedBlocks:preserved,changedBlocks:ids.size,answersPreserved:true,sourcePreserved:true};fs.writeFileSync(dir+'verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
