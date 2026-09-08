// User-selected production transcription configuration. Benchmark arms remain independent.
export const TRANSCRIPTION_DEFAULT = Object.freeze({provider:'codex',model:'gpt-6-astra',effort:'low'});
export function requireCurrentTranscription(configuration) {
  if(configuration.provider!==TRANSCRIPTION_DEFAULT.provider||configuration.model!==TRANSCRIPTION_DEFAULT.model||configuration.effort!==TRANSCRIPTION_DEFAULT.effort)
    throw new Error('New transcription uses Astra Low through Codex. Preserve this historical configuration and prepare a fresh Astra Low run instead.');
  return configuration;
}
