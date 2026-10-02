// User-selected production transcription configuration. Benchmark arms remain independent.
export const TRANSCRIPTION_DEFAULT = Object.freeze({provider:'codex',model:'gpt-6.1-sol',effort:'medium'});
// A fresh run may record an explicit user-requested trial; defaults never migrate.
export function transcriptionConfiguration(record={}) {
  const override=record.reasoningOverride;
  if(override&&(override.effort!=='medium'||typeof override.reason!=='string'||!override.reason.trim()))throw new Error('Reasoning override requires medium and a recorded user-request reason');
  return {...TRANSCRIPTION_DEFAULT,...(override?{effort:override.effort,reasoningOverride:{...override}}:{})};
}
export function requireCurrentTranscription(configuration) {
  const expected=transcriptionConfiguration(configuration);
  if(configuration.provider!==expected.provider||configuration.model!==expected.model||configuration.effort!==expected.effort)
    throw new Error('New transcription uses Sol 6.1 medium through Codex. Preserve this historical configuration and prepare a fresh Sol medium run instead.');
  return configuration;
}
