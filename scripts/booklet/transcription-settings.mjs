// User-selected production transcription configuration. Benchmark arms remain independent.
export const TRANSCRIPTION_DEFAULT = Object.freeze({provider:'codex',model:'gpt-6.1-sol',effort:'medium'});
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
