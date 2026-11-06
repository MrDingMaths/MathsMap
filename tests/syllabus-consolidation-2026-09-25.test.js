import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fromSource} from '../public/libs/maths-editor/document-model.mjs';
import {sourceInventories} from '../src/lib/booklet-source-content.js';
import {presentationVerificationKey} from '../src/lib/booklet-presentation-verification.js';

// The 6 Nov 2026 split added source.partition; provenance pins the source as it was before.
const sourceWithoutPartition=({partition,...rest})=>rest;
const ids=['angle-relationships-v1','index-laws-complete-v1','volume-v1'];
const stripIds=value=>Array.isArray(value)?value.map(stripIds):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>key!=='id').map(([key,item])=>[key,stripIds(item)])):value;

for(const id of ids)test(`${id}: one editable opening syllabus preserves every source document block`,()=>{
  const project=JSON.parse(fs.readFileSync(`booklets/projects/${id}.json`,'utf8'));
  const evidence=JSON.parse(fs.readFileSync(`booklets/provenance/${id}/syllabus-consolidation-2026-09-25.json`,'utf8'));
  const section=project.sections.find(s=>s.phase==='front-matter'&&/syllabus/i.test(s.title));
  const original=evidence.originalSection;
  assert.equal(section.blocks.length,1);
  const anchor=section.blocks[0],header=original.blocks[0].presentation?.kind==='main-section-header';
  assert.equal(anchor.id,original.blocks[header?1:0].id);
  if(header)assert.equal(section.headingStyle,'main');
  assert.equal(anchor.feedbackProvenance.sourceHash,crypto.createHash('sha256').update(JSON.stringify(original)).digest('hex'));
  const expected=original.blocks.slice(header?1:0).flatMap(b=>typeof b.content==='string'?fromSource(b.content).blocks:b.content.blocks);
  assert.deepEqual(stripIds(anchor.content.blocks),stripIds(expected));
  const inventory=sourceInventories(project).flatMap(x=>x.entries);
  for(const block of original.blocks.filter(b=>b.id!==anchor.id))for(const entry of inventory.filter(e=>e.targetId===block.id))assert.match(entry.exclusionReason,/consolidated/);
});

// A manual page break after the syllabus is layout, not syllabus content.
test('every active current booklet has at most one opening syllabus content block',()=>{
  for(const file of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){
    const p=JSON.parse(fs.readFileSync('booklets/projects/'+file,'utf8'));
    for(const s of p.sections.filter(s=>s.role!=='candidate-pool'&&s.phase==='front-matter'&&/syllabus/i.test(s.title))){const content=s.blocks.filter(b=>b.type!=='page-break');assert.ok(content.length<=1,`${file}: ${content.length} syllabus blocks`);}
  }
});

test('consolidated syllabus source reviews bind to current editable content',async()=>{
  for(const id of ['data-visualisation-1-v1',...ids]){
    const project=JSON.parse(fs.readFileSync(`booklets/projects/${id}.json`,'utf8'));
    const block=project.sections.find(s=>s.phase==='front-matter'&&s.role!=='candidate-pool'&&/syllabus/i.test(s.title)).blocks[0];
    const runId=block.sourceRefs?.find(ref=>ref.runId)?.runId;
    const source=runId&&runId!==project.source?.runId?project.source?.imports?.find(item=>item.runId===runId)?.source:project.source;
    assert.equal(block.sourceReview.verification.checked,true,id);
    assert.equal(block.sourceReview.verification.signature,await presentationVerificationKey(block,source?.sourceHashes,project.settings),id);
  }
});
