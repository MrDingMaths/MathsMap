import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {revisionHash} from './bank-sync.mjs';

const nonempty=value=>typeof value==='string' && value.trim().length>0;

export function externalTeachingEvidence(context, sourceRoot=process.cwd()) {
  const references=context.externalTeachingReferences??[];
  assert.ok(Array.isArray(references), 'External teaching references must be an array');
  const verified=new Map(), pdfs=new Map();
  for(const reference of references) {
    const {id,pdfPath,pdfSha256,pages,teachingSummary}=reference;
    assert.ok(nonempty(id) && !verified.has(id), 'External teaching reference needs a unique stable id');
    assert.ok(nonempty(pdfPath), id+': PDF path is required');
    assert.match(pdfSha256??'', /^[a-f0-9]{64}$/, id+': PDF SHA-256 is required');
    const file=path.resolve(sourceRoot,pdfPath);
    let pdf=pdfs.get(file);
    if(!pdf) {
      let bytes;
      try { bytes=readFileSync(file); } catch { assert.fail(id+': external teaching PDF is missing or unreadable'); }
      assert.ok(bytes.subarray(0,1024).includes(Buffer.from('%PDF-')), id+': external teaching source must be a PDF');
      const hash=createHash('sha256').update(bytes).digest('hex');
      assert.equal(pdfSha256,hash,id+': external teaching PDF hash is stale');
      const info=spawnSync('pdfinfo',[file],{encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});
      assert.ok(!info.error && info.status===0, id+': external teaching PDF requires successful pdfinfo validation');
      const pageCount=Number(info.stdout.match(/^Pages:\s+(\d+)\s*$/m)?.[1]);
      assert.ok(Number.isInteger(pageCount) && pageCount>0,id+': PDF page count is unavailable');
      pdf={hash,pageCount};pdfs.set(file,pdf);
    }
    assert.equal(pdfSha256,pdf.hash,id+': external teaching PDF hash is stale');
    assert.ok(nonempty(teachingSummary), id+': teaching summary is required');
    assert.ok(Array.isArray(pages) && pages.length>0,id+': inspected teaching pages are required');
    const inspected=new Set();
    for(const page of pages) {
      assert.ok(Number.isInteger(page.pdfPage) && page.pdfPage>=1 && page.pdfPage<=pdf.pageCount,id+': invalid PDF page');
      assert.ok(!inspected.has(page.pdfPage),id+': duplicate inspected PDF page');
      assert.ok(nonempty(page.printedRef),id+': printed page reference is required');
      const inspection=page.inspection;
      assert.ok(nonempty(inspection?.reviewer) && nonempty(inspection?.note) && nonempty(inspection?.reviewedAt) && Number.isFinite(Date.parse(inspection.reviewedAt)),id+': inspected-page evidence is required');
      inspected.add(page.pdfPage);
    }
    verified.set(id,inspected);
  }
  return verified;
}

// Library tags describe the task in its source teaching context; prerequisites
// remain in teaching mappings. This gate checks evidence, not mathematical truth.
export function validateSourceClassificationReview(project, assessments, {skills, dotpoints, sourceRoot=process.cwd()}) {
  const context=assessments.sourceContext;
  assert.ok(context, 'Source classification context is required before a new import');
  assert.equal(context.projectHash, revisionHash(project), 'Source classification context is stale');
  assert.ok(context.courseIds?.length && context.topicIds?.length, 'Source course and topic scope are required');
  const blocks=new Map(project.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));
  const external=externalTeachingEvidence(context,sourceRoot);
  assert.ok(context.evidenceBlockIds?.length || external.size, 'Source teaching/syllabus evidence is required');
  for(const id of context.evidenceBlockIds??[]) assert.ok(blocks.has(id), 'Unknown source evidence block: '+id);
  const skillMap=new Map(skills.map(s=>[s.id,s])), pointMap=new Map(dotpoints.map(d=>[d.id,d]));
  for(const id of context.topicIds) assert.ok(dotpoints.some(d=>d.topicId===id), 'Unknown source topic: '+id);
  for(const id of context.courseIds) assert.ok(skills.some(s=>s.courses?.includes(id)), 'Unknown source course: '+id);
  for(const a of assessments.questions) {
    assert.ok(blocks.has(a.sourceBlockId), 'Unknown assessed source block: '+a.sourceBlockId);
    assert.ok(a.mappingNote?.trim(), a.sourceBlockId+' needs a source-guided mapping rationale');
    if(external.size) {
      assert.ok(nonempty(a.methodNote),a.sourceBlockId+' needs a source-guided method rationale');
      assert.ok(Array.isArray(a.teachingReferences) && a.teachingReferences.length>0,a.sourceBlockId+' needs individual teaching references');
      for(const reference of a.teachingReferences) {
        const pages=external.get(reference.id);
        assert.ok(pages,a.sourceBlockId+': unknown external teaching reference: '+reference.id);
        assert.ok(Array.isArray(reference.pdfPages) && reference.pdfPages.length>0,a.sourceBlockId+': teaching reference pages are required');
        for(const page of reference.pdfPages) assert.ok(pages.has(page),a.sourceBlockId+': teaching reference page was not inspected: '+page);
      }
    }
    for(const id of [a.classification.primarySkillId,...(a.classification.secondarySkillIds??[])]) {
      const skill=skillMap.get(id); assert.ok(skill, 'Unknown assessed skill: '+id);
      const inScope=skill.courses?.some(c=>context.courseIds.includes(c)) && skill.dotPointIds?.some(d=>context.topicIds.includes(pointMap.get(d)?.topicId));
      assert.ok(inScope || a.sourceContextException?.trim(), a.sourceBlockId+': '+id+' is outside the source course/topic; record a directly assessed exception');
    }
  }
}
