import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {revisionHash} from '../scripts/booklet/bank-sync.mjs';
import {validateSourceClassificationReview} from '../scripts/booklet/source-classification-review.mjs';

// A real one-page PDF exercises pdfinfo rather than trusting declared page counts.
function onePagePdf() {
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] >>'];
  let text='%PDF-1.4\n';const offsets=[0];
  objects.forEach((object,index)=>{offsets.push(Buffer.byteLength(text));text+=`${index+1} 0 obj\n${object}\nendobj\n`;});
  const xref=Buffer.byteLength(text);
  text+='xref\n0 4\n0000000000 65535 f \n'+offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('');
  return Buffer.from(text+`trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
}
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-classification-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const bytes=onePagePdf();fs.writeFileSync(path.join(root,'teaching.pdf'),bytes);
  const project={sections:[{blocks:[{id:'q1'}]}]};
  const assessments={sourceContext:{projectHash:revisionHash(project),courseIds:['course'],topicIds:['topic'],externalTeachingReferences:[{id:'teaching-one',pdfPath:'teaching.pdf',pdfSha256:createHash('sha256').update(bytes).digest('hex'),teachingSummary:'Synthetic test evidence only.',pages:[{pdfPage:1,printedRef:'Test page 1',inspection:{reviewer:'Unit test fixture',reviewedAt:'2026-09-16T00:00:00Z',note:'Synthetic test inspection.'}}]}]},questions:[{sourceBlockId:'q1',mappingNote:'Synthetic mapping rationale.',methodNote:'Synthetic method rationale.',teachingReferences:[{id:'teaching-one',pdfPages:[1]}],classification:{primarySkillId:'skill',secondarySkillIds:[]}}]};
  const options={sourceRoot:root,skills:[{id:'skill',courses:['course'],dotPointIds:['point']},{id:'outside',courses:['other'],dotPointIds:['other']}],dotpoints:[{id:'point',topicId:'topic'},{id:'other',topicId:'other'}]};
  return {project,assessments,options,check:()=>validateSourceClassificationReview(project,assessments,options)};
}
test('practice-only classification accepts a real external PDF with inspected references',t=>{fixture(t).check();});
test('external classification rejects stale or missing PDF evidence',t=>{
  const f=fixture(t);f.assessments.sourceContext.externalTeachingReferences[0].pdfSha256='0'.repeat(64);
  assert.throws(f.check,/hash is stale/);
  f.assessments.sourceContext.externalTeachingReferences[0].pdfPath='missing.pdf';assert.throws(f.check,/missing or unreadable/);
});
test('external classification rejects invalid page bounds and absent inspection',t=>{
  const f=fixture(t),page=f.assessments.sourceContext.externalTeachingReferences[0].pages[0];
  for(const value of [0,2,1.5,'1']) {page.pdfPage=value;assert.throws(f.check,/invalid PDF page/);}
  page.pdfPage=1;delete page.inspection;assert.throws(f.check,/inspected-page evidence/);
});
test('each question must cite known inspected pages and explain its method',t=>{
  const f=fixture(t),question=f.assessments.questions[0];
  delete question.teachingReferences;assert.throws(f.check,/individual teaching references/);
  question.teachingReferences=[{id:'invented',pdfPages:[1]}];assert.throws(f.check,/unknown external teaching reference/);
  question.teachingReferences=[{id:'teaching-one',pdfPages:[2]}];assert.throws(f.check,/was not inspected/);
  question.teachingReferences[0].pdfPages=[1];delete question.methodNote;assert.throws(f.check,/method rationale/);
});
test('external evidence retains primary and secondary course/topic checks',t=>{
  const f=fixture(t);f.assessments.questions[0].classification.secondarySkillIds=['outside'];
  assert.throws(f.check,/outside the source course\/topic/);
  f.assessments.questions[0].sourceContextException='Synthetic directly assessed exception.';f.check();
});
test('imported teaching block evidence remains compatible',t=>{
  const f=fixture(t);delete f.assessments.sourceContext.externalTeachingReferences;
  f.project.sections[0].blocks.push({id:'teaching'});
  f.assessments.sourceContext.projectHash=revisionHash(f.project);
  f.assessments.sourceContext.evidenceBlockIds=['teaching'];
  delete f.assessments.questions[0].methodNote;delete f.assessments.questions[0].teachingReferences;f.check();
});
