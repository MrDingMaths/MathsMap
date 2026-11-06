// New teaching stays a draft until James approves the pilot finding and the
// independent answer/principles check. This module never invokes a provider.
import {bookletPrinciples} from './review.mjs';
import {assertIndependentBackfillReview} from './routine-backfill-proof.mjs';
import {reasoningTaskHash,verifiedRating} from '../scripts/booklet/reasoning-ratings.mjs';
export const NEW_CONTENT_MODEL='claude-sonnet-5-5';
export function newTeachingPrompt({kind,topic,styleExamples,archetype,root}={}){
 if(!['worked-example','guided-practice','backfill','bridge'].includes(kind))throw Error('Unknown new-content kind');
 if(!Array.isArray(styleExamples)||!styleExamples.length)throw Error('Supply this exercise\'s own style examples');
 const postingRule=kind==='backfill'?'Routine-practice backfill may be applied only for an already-taught archetype after independent answer/principles checks and a valid reasoning rating below 65; it cannot add a method, teaching or coverage.':'Post this draft only as a Booklet Studio comment for James to review. Calibration is not individual-content approval. This includes prerequisite-review additions, bridges, extra/revised worked examples or guided practice, teaching/cues, method/meaning or topic-coverage changes, and instructional removals.';
 const teachingScope=kind==='backfill'?'Reinforce only an already-taught question type. Do not add a new teaching step, pedagogical bridge, prerequisite Review, worked example or guided practice; return a blocker if the request needs one.':'Prefer scaffolded bridging questions; add teaching only for a genuinely new archetype, and leave every instructional proposal pending James.';
 return {model:NEW_CONTENT_MODEL,status:'draft-only',prompt:[
  'Generate only the requested '+kind+' draft with exactly claude-sonnet-5-5. Do not substitute another model. Match the supplied exercise tone, notation, question demands and taught method. In new quadratic-factorisation working, use and label PSF (Product, Sum, Factors); preserve the source polynomial division and factor-theorem steps. This does not authorise rewriting accepted source content. '+teachingScope+' No optional wording.',
  'Exercise questions and answer keys supplied as style examples do not establish student-visible teaching. Cite actual worked-example, guided-practice, theory or explicitly supplied question-scaffold nodes that provide the method before the new practice. An unsolved question or its hidden worked answer is not a demonstration. Keep style donors separate from genuine method prerequisites; preserve every genuine prerequisite when ordering. Return a blocker if the necessary teaching is not supplied. Never change a rating or bypass a prerequisite to obtain a smoother gradient.',
  'Lesson structure: place worked examples and guided practice before the exercise they prepare. Guided practice is teaching, not an exercise opening, and each independent guided-practice question restarts its part labels at a (or 1 for numbered tasks); continuations of the same question retain their sequence. Stacked practice uses its own Guided practice box, never a blue Your turn subheading. Explicit side-by-side pairs use black bold Worked example and Your turn column headings. Keep distinct lesson methods and their exercises separate when the supplied lesson structure separates them.',
  bookletPrinciples(root?{root}:{}),
  'When a diagram is relevant to reading the givens, mathematical relationships or intended comparison, generate the actual editable native diagram with the question in questionDiagrams (or the supported native diagram field). Supply complete TikZ or a supported parameter model, with correct lengths, angles, unknowns and mathematical markers. A prose description, specification or instruction to add/draw a diagram later is incomplete. Preserve an explicit task assessing students drawing their own diagram. Independent review must check the diagram mathematics, and the actual figure must be rendered and inspected at final size before an approved draft is inserted or its comment resolved.',
  'Return the draft question, concise answer and worked solution, archetype, prerequisites and a principle-by-principle self-check. This self-check does not establish acceptance. Before any posting or use, a separate reviewer must independently derive every answer and option and check the same booklet principles; rate new practice with the existing rating configuration. Post additional worked examples and guided practice only as Booklet Studio comments for James to review; calibration approval is never individual-content approval. Never publish to the bank. Follow the destination rule below before any live-booklet change.',
  postingRule,
  JSON.stringify({topic,archetype,styleExamples})
 ].join('\n\n')};
}

// Instructional drafts enter the review queue. Only independently verified,
// rated routine backfill of an already-taught archetype may enter a booklet.
export function validateNewTeachingCandidate(candidate){
 if(candidate?.model!==NEW_CONTENT_MODEL)throw Error('New teaching requires exactly '+NEW_CONTENT_MODEL);
 if(!['worked-example','guided-practice','backfill','bridge'].includes(candidate.kind))throw Error('Unknown new-content kind');
 const automaticBackfill=candidate.kind==='backfill'&&candidate.destination==='booklet'&&candidate.status==='verified-routine-backfill'&&candidate.archetypeTaught===true&&candidate.instructionalChange===false&&Number.isFinite(candidate.reasoningScore)&&candidate.reasoningScore<65;
 if(!automaticBackfill&&(candidate.destination!=='studio-comment'||candidate.status!=='pending-user-review'||candidate.autoApply===true))throw Error('New content must remain a pending Studio comment');
 if(!candidate.independentReview?.answersVerified||!candidate.independentReview?.principlesVerified)throw Error('Independent answer and principles review required before posting');
 if(automaticBackfill){
  const verified=assertIndependentBackfillReview(candidate.backfillProof),block=verified.find(b=>b.id===candidate.block?.id);
  if(!block||reasoningTaskHash(block)!==reasoningTaskHash(candidate.block)||!verifiedRating(candidate.block)||candidate.block.classification.assessment.model!==candidate.backfillProof.review.model||candidate.reasoningScore!==block.classification.reasoningScore||candidate.block.classification.reasoningScore!==block.classification.reasoningScore||candidate.block.classification.primarySkillId!==block.classification.primarySkillId||candidate.block.classification.archetype!==block.classification.archetype)throw Error('Automatic backfill requires its exact independently rated content');
 }
 return candidate;
}
