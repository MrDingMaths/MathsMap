import {AsyncLocalStorage} from 'node:async_hooks';
// User-selected production transcription configuration. Benchmark arms remain independent.
export const TRANSCRIPTION_DEFAULT = Object.freeze({provider:'codex',model:'gpt-6.1-sol',effort:'medium'});
// Review defaults do not migrate historical authoring/transcription manifests.
export const REVIEW_DEFAULT = Object.freeze({provider:'codex',model:'gpt-6.1-terra',effort:'high'});
export const BENCHMARK_ARMS = Object.freeze({'claude-sonnet-5-5-relay':Object.freeze({provider:'claude-subagent',model:'claude-sonnet-5-5',effort:'default'})});
// A fresh run may record an explicit user-requested trial; defaults never migrate.
export function transcriptionConfiguration(record={}) {
  // Explicit user-requested benchmark arms are never a production default,
  // never run through the Codex runner and keep their actual model on record.
  if(record.benchmarkArm){
    const arm=BENCHMARK_ARMS[record.benchmarkArm.id];
    if(!arm||typeof record.benchmarkArm.reason!=='string'||!record.benchmarkArm.reason.trim()||record.reasoningOverride)throw new Error('Benchmark arm requires a known arm, a recorded user-request reason and no reasoning override');
    return {...arm,benchmarkArm:{id:record.benchmarkArm.id,reason:record.benchmarkArm.reason}};
  }
  const override=record.reasoningOverride;
  if(override&&(!['low','medium'].includes(override.effort)||typeof override.reason!=='string'||!override.reason.trim()))throw new Error('Reasoning override requires low or medium and a recorded user-request reason');
  return {...TRANSCRIPTION_DEFAULT,...(override?{effort:override.effort,reasoningOverride:{...override}}:{})};
}
export function requireCurrentTranscription(configuration) {
  const expected=transcriptionConfiguration(configuration);
  if(configuration.provider!==expected.provider||configuration.model!==expected.model||configuration.effort!==expected.effort)
    throw new Error('New transcription uses Sol 6.1 medium through Codex. Preserve this historical configuration and prepare a fresh Sol medium run instead.');
  return configuration;
}

// An entry point (an import's finish or lean-review command) may name the review
// configuration for everything it runs; callers that ask for the default then get
// that one. It is set explicitly by the entry point, never chosen after a failure.
const scopedReview=new AsyncLocalStorage();
export function withReviewConfiguration(configuration,work){return scopedReview.run(requireCurrentReview(configuration),work);}
// A fallback is a deliberate recorded choice, never a response to a failed call.
export function reviewConfiguration(record={}) {
  if(!Object.keys(record).length&&scopedReview.getStore())return {...scopedReview.getStore()};
  if(record.benchmarkArm||record.reasoningOverride)throw new Error('Review uses Terra High; transcription overrides and benchmark arms are not review configuration. Preserve the historical configuration.');
  const fallback=record.reviewFallback;
  if(fallback&&(fallback.model!=='gpt-6.1-sol'||fallback.effort!=='low'||typeof fallback.reason!=='string'||!fallback.reason.trim()))
    throw new Error('Review fallback requires explicit gpt-6.1-sol low and a recorded reason');
  const expected=fallback?{provider:'codex',model:fallback.model,effort:fallback.effort}:REVIEW_DEFAULT;
  for(const key of ['provider','model','effort'])if(record[key]!==undefined&&record[key]!==expected[key])
    throw new Error('Review uses Terra High, or explicitly recorded Sol Low fallback. Preserve the historical configuration; it is not silently migrated.');
  return {...expected,...(fallback?{reviewFallback:{...fallback}}:{})};
}
export function requireCurrentReview(configuration) {
  const expected=reviewConfiguration(configuration);
  if(configuration.provider!==expected.provider||configuration.model!==expected.model||configuration.effort!==expected.effort)
    throw new Error('Review configuration must explicitly record its provider, model and effort');
  return configuration;
}

// Difficulty-only calls have their own user-selected route. Keep the review
// compatibility envelope so historical call metrics remain readable.
export function difficultyRatingConfiguration() {
  return reviewConfiguration({reviewFallback:{model:'gpt-6.1-sol',effort:'low',reason:'5 November 2026 user policy: use Sol 6.1 Low for difficulty ratings; preserve existing valid ratings. Other reviews retain Terra High.'}});
}
// Booklet-import reviews, ratings and checks (import pipeline v2, Decision 12).
// The envelope keeps the recorded reviewFallback shape so call metrics and
// requireCurrentReview read it unchanged; the reason states it is the policy.
export function importReviewConfiguration() {
  return reviewConfiguration({reviewFallback:{model:'gpt-6.1-sol',effort:'low',reason:'5 November 2026 user policy (import pipeline v2, Decision 12): booklet-import reviews and ratings use Sol 6.1 Low. Other reviews retain Terra High.'}});
}
