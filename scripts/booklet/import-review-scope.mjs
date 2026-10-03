import {questionReviewContent} from './lean-profile.mjs';
// Layout can change independently; task, methods, identities and response
// requirements cannot. Classification is bound explicitly for retained credit.
export function reviewSemanticScope(question){
 return {content:questionReviewContent(question),classification:question.classification??null,sourceRefs:question.sourceRefs??null,
  sourcePageNumber:question.sourcePageNumber??null,sourcePages:question.sourceReview?.sourcePages??null,
  responses:question.sourceReview?.responses??null,teachingContext:question.sourceReview?.teachingContext??null,
  answerEvidence:question.sourceReview?.answerEvidence??null,sourceIdentity:question.sourceReview?.sourceIdentity??null};
}
