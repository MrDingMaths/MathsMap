import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {sourceInventories} from '../src/lib/booklet-source-content.js';
import {flowEditionSections} from '../src/lib/booklet-flow.js';

const project=JSON.parse(fs.readFileSync('booklets/projects/data-visualisation-1-v1.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('booklets/provenance/data-visualisation-1-v1/feedback-2026-09-25.json','utf8'));
const blocks=project.sections.flatMap(s=>s.blocks);
const block=id=>blocks.find(b=>b.id===id);

test('all syllabus focus statements and bullets are in one editable block at the front',()=>{
  const first=project.sections[0].blocks[0];
  assert.equal(first.id,'data-classification--p2-syllabus');
  assert.equal(project.sections.filter(s=>s.phase==='front-matter'&&s.role!=='candidate-pool').length,1);
  assert.equal(blocks.filter(b=>/syllabus/.test(b.id)).length,1);
  assert.equal(first.content.blocks.length,7);
  const original=evidence.originalSyllabusSections;
  const sha=crypto.createHash('sha256').update(JSON.stringify(original)).digest('hex');
  assert.equal(first.feedbackProvenance.sourceHash,sha);
  assert.equal(evidence.sourceHash,crypto.createHash('sha256').update(JSON.stringify(project.source)).digest('hex'));
  for(const source of original){
    const document=source.blocks[0].content;
    for(const item of document.blocks.filter(x=>x.type==='list')){
      for(const entry of item.items){
        const text=entry.blocks[0].inlines.map(x=>x.text??'').join('');
        assert.ok(JSON.stringify(first.content).includes(text),text);
      }
    }
  }
  assert.deepEqual(first.sourceRefs.map(r=>r.runId),[...new Set(first.sourceRefs.map(r=>r.runId))]);
  const inventory=sourceInventories(project).flatMap(x=>x.entries);
  assert.equal(inventory.find(x=>x.id===first.id).verification.checked,true);
  for(const id of ['p2-overview','p2-syllabus-heading','p2-syllabus-outcome','derived-p2-syllabus-content','data-visualisation-2--p2-heading','data-visualisation-2--p2-syllabus'])assert.match(inventory.find(x=>x.id===id).exclusionReason,/consolidated/);
  const withoutPlaceholders=structuredClone(project);
  withoutPlaceholders.sections=withoutPlaceholders.sections.filter(s=>!s.feedbackConsolidation);
  for(const edition of ['student','with-short'])assert.deepEqual(flowEditionSections(project,edition),flowEditionSections(withoutPlaceholders,edition));
});

test('every active multiple-choice table has bold uppercase labels',()=>{
  let count=0;
  const visit=value=>{
    if(!value||typeof value!=='object')return;
    if(value.type==='table'&&Array.isArray(value.rows)&&value.rows.length>=2){
      const labels=value.rows.map(row=>row?.[0]?.blocks?.[0]?.inlines?.[0]);
      if(labels.every(inline=>/^[A-Fa-f][.)]?$/.test(inline?.text??''))){
        count++;
        for(const inline of labels){assert.match(inline.text,/^[A-F][.)]?$/);assert.ok(inline.marks?.includes('bold'));}
      }
    }
    if(value.type==='layout'&&Array.isArray(value.slots)&&value.slots.length>=2){
      const paragraphs=value.slots.map(slot=>slot?.blocks?.[0]);
      if(paragraphs.every(p=>/^[A-Fa-f][.)]\s/.test(p?.inlines?.[0]?.text??''))){
        count++;
        for(const p of paragraphs){
          assert.match(p.inlines[0].text,/^[A-F][.)]\s$/);
          assert.ok(p.inlines[0].marks?.includes('bold'));
        }
      }
    }
    for(const [key,item]of Object.entries(value))if(!['source','sourceLayoutEvidence','sourceReview','comments','review'].includes(key))visit(item);
  };
  for(const file of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){
    const candidate=JSON.parse(fs.readFileSync(path.join('booklets/projects',file),'utf8'));
    for(const section of candidate.sections??[])for(const item of section.blocks??[])visit(item);
  }
  assert.ok(count>=7);
});

test('local number plate omits the slogan and retains source evidence',()=>{
  const plate=block('data-classification--p8-q9').content.questionDiagrams[0];
  assert.ok(!plate.code.includes('VICTORIA - THE EDUCATION STATE'));
  assert.match(plate.code,/data-diagram-label-target-pt="14"/);
  assert.match(plate.code,/123 EDL/);
  assert.match(evidence.originalPlate.code,/VICTORIA - THE EDUCATION STATE/);
  assert.equal(evidence.originalLikertOptions.slots.length,4);
  for(const id of evidence.comments){
    const comment=project.studio.flags.find(flag=>flag.id===id);
    assert.equal(comment?.resolved,true);
    assert.ok(comment.resolution?.length>80);
  }
});
