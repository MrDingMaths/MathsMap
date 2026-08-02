import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, '.diagnostic-questions', 'visual-jobs-current.json'), 'utf8'));
const transcriptionRaw = fs.readFileSync(path.join(root, '.diagnostic-questions', 'worker10-transcriptions.json'), 'utf8');
const transcriptions = JSON.parse(transcriptionRaw.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, '\\\\'));
const outputDir = path.join(root, '.diagnostic-questions', 'transcriptions-full-20260802');
fs.mkdirSync(outputDir, { recursive: true });
const assigned = manifest.jobs.filter((job) => {
  const match = /^dq-visual-(\d+)$/.exec(job.jobId);
  return match && (((Number(match[1]) - 1) % 10) + 1) === 10;
});
for (const job of assigned) {
  const outputPath = path.join(outputDir, `${job.jobId}.json`);
  const values = transcriptions[job.jobId];
  if (fs.existsSync(outputPath) && (!Array.isArray(values) || values.length !== job.candidates.length)) continue;
  const fallback = job.candidates.map((candidate) => ({
    question_text: `Visual source ${candidate.source.id}; transcription unavailable in this run.`,
    structure: 'visual-question-transcription-pending',
    meaningfulCase: 'source-image-requires-human-visual-transcription',
    mastery: false,
    options: [
      { text: 'A', correct: true },
      { text: 'B', correct: false, why: 'This option is retained only as a placeholder pending transcription.' },
      { text: 'C', correct: false, why: 'This option is retained only as a placeholder pending transcription.' },
      { text: 'D', correct: false, why: 'This option is retained only as a placeholder pending transcription.' },
    ],
    solution_text: 'No verified solution was recorded because the source image was not transcribed in this run.',
    diagramRequired: true,
    uncertainties: ['Complete visual transcription is pending; do not use this candidate as production content.'],
  }));
  const resolvedValues = Array.isArray(values) && values.length === job.candidates.length ? values : fallback;
  const output = { jobId: job.jobId, candidates: job.candidates.map((candidate, index) => ({ source: candidate.source, qualityScore: candidate.qualityScore, workerInstructions: candidate.workerInstructions, transcription: resolvedValues[index] })) };
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`wrote ${job.jobId}`);
}
