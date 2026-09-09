// Historical classification expectations; no bank writes.
import {linearAssessments} from '../../scripts/booklet/linear-bank-assessments.mjs';
import {difficultyBandForScore} from '../../src/lib/practice-question-model.js';
export function assessedClassification(question, sourceId) {
 const rating=linearAssessments[sourceId];
 if(!rating)throw Error('Missing individual assessment: '+sourceId);
 const classification={...question.classification,...rating,difficulty:difficultyBandForScore(rating.reasoningScore)};
 let ids=[classification.primarySkillId,...classification.secondarySkillIds];
 // Equation solving supports these tasks; the assessed task is the linear pattern/model.
 // Detailed node teaching mappings retain the supporting algebra evidence.
 if(ids.includes('equations-from-formulas')&&!['page-50-q1','page-82-q1','page-92-q3'].includes(sourceId)) {
  ids=ids.filter(id=>id!=='equations-from-formulas');
  if(sourceId==='page-27-q4')ids=['find-equation-from-table','apply-pattern-equation'];
 }
 if(['page-51-q1','page-52-b1'].includes(sourceId))ids=['apply-pattern-equation']; // rule is given, not generated
 if(sourceId==='page-56-q11')ids=['pattern-to-equation','apply-pattern-equation'];
 classification.primarySkillId=ids[0];classification.secondarySkillIds=ids.slice(1);
 return classification;
}
