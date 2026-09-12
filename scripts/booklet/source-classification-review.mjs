import assert from 'node:assert/strict';
import {revisionHash} from './bank-sync.mjs';

// Library tags describe the task in its source teaching context; prerequisites
// remain in teaching mappings. This gate checks evidence, not mathematical truth.
export function validateSourceClassificationReview(project, assessments, {skills, dotpoints}) {
  const context=assessments.sourceContext;
  assert.ok(context, 'Source classification context is required before a new import');
  assert.equal(context.projectHash, revisionHash(project), 'Source classification context is stale');
  assert.ok(context.courseIds?.length && context.topicIds?.length, 'Source course and topic scope are required');
  const blocks=new Map(project.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));
  assert.ok(context.evidenceBlockIds?.length, 'Source teaching/syllabus evidence is required');
  for(const id of context.evidenceBlockIds) assert.ok(blocks.has(id), 'Unknown source evidence block: '+id);
  const skillMap=new Map(skills.map(s=>[s.id,s])), pointMap=new Map(dotpoints.map(d=>[d.id,d]));
  for(const id of context.topicIds) assert.ok(dotpoints.some(d=>d.topicId===id), 'Unknown source topic: '+id);
  for(const id of context.courseIds) assert.ok(skills.some(s=>s.courses?.includes(id)), 'Unknown source course: '+id);
  for(const a of assessments.questions) {
    assert.ok(blocks.has(a.sourceBlockId), 'Unknown assessed source block: '+a.sourceBlockId);
    assert.ok(a.mappingNote?.trim(), a.sourceBlockId+' needs a source-guided mapping rationale');
    for(const id of [a.classification.primarySkillId,...(a.classification.secondarySkillIds??[])]) {
      const skill=skillMap.get(id); assert.ok(skill, 'Unknown assessed skill: '+id);
      const inScope=skill.courses?.some(c=>context.courseIds.includes(c)) && skill.dotPointIds?.some(d=>context.topicIds.includes(pointMap.get(d)?.topicId));
      assert.ok(inScope || a.sourceContextException?.trim(), a.sourceBlockId+': '+id+' is outside the source course/topic; record a directly assessed exception');
    }
  }
}
