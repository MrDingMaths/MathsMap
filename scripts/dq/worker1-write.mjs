import fs from 'node:fs';

const root = 'C:/Users/james/OneDrive/Admin/WebApps/MathsMap';
const sourcePath = `${root}/.diagnostic-questions/visual-jobs-current.json`;
const outputDir = `${root}/.diagnostic-questions/transcriptions-full-20260802`;
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
fs.mkdirSync(outputDir, { recursive: true });

export function writeJob(jobId, transcriptions) {
  const job = source.jobs.find((item) => item.jobId === jobId);
  if (!job) throw new Error(`Unknown job ${jobId}`);
  if (!Array.isArray(transcriptions) || transcriptions.length !== job.candidates.length) {
    throw new Error(`${jobId}: transcription count mismatch`);
  }
  const candidates = job.candidates.map((candidate, index) => ({
    source: candidate.source,
    qualityScore: candidate.qualityScore,
    workerInstructions: candidate.workerInstructions,
    transcription: transcriptions[index],
  }));
  for (const candidate of candidates) {
    const t = candidate.transcription;
    if (!t || typeof t.question_text !== 'string' || !t.structure || !t.meaningfulCase ||
        typeof t.mastery !== 'boolean' || !Array.isArray(t.options) || t.options.length < 3 ||
        t.options.length > 5 || t.options.filter((option) => option.correct === true).length !== 1 ||
        typeof t.solution_text !== 'string' || typeof t.diagramRequired !== 'boolean' ||
        !Array.isArray(t.uncertainties)) throw new Error(`${jobId}/${candidate.source.id}: invalid transcription`);
    for (const option of t.options) {
      if (typeof option.text !== 'string' || typeof option.correct !== 'boolean') throw new Error(`${jobId}/${candidate.source.id}: invalid option`);
      if (!option.correct && (typeof option.why !== 'string' || option.why.length < 15)) throw new Error(`${jobId}/${candidate.source.id}: missing distractor explanation`);
    }
  }
  const out = { jobId, candidates };
  fs.writeFileSync(`${outputDir}/${jobId}.json`, JSON.stringify(out, null, 2) + '\n', 'utf8');
}
