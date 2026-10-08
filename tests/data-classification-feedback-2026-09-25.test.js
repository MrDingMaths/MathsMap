import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const project=JSON.parse(fs.readFileSync('booklets/projects/data-visualisation-1-v1.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('booklets/provenance/data-visualisation-1-v1/feedback-2026-09-25.json','utf8'));
const blocks=project.sections.flatMap(s=>s.blocks);
const block=id=>blocks.find(b=>b.id===id);

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
