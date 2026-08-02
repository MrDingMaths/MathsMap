import fs from 'node:fs';

const root = 'C:/Users/james/OneDrive/Admin/WebApps/MathsMap';
const manifestPath = `${root}/.diagnostic-questions/visual-jobs-current.json`;
const dataPath = `${root}/scripts/dq/worker6-data.json`;
const outputDir = `${root}/.diagnostic-questions/transcriptions-full-20260802`;
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
fs.mkdirSync(outputDir, { recursive: true });
const assigned = manifest.jobs.filter(j => { const n = Number(j.jobId.slice(-4)); return ((n - 1) % 10) + 1 === 6; });
for (const job of assigned) {
  const trs = data[job.jobId];
  if (!trs) continue;
  if (trs.length !== job.candidates.length) throw new Error(`${job.jobId}: transcription count mismatch`);
  const candidates = job.candidates.map((candidate, i) => {
    const tr = trs[i];
    if (!tr) throw new Error(`${job.jobId}/${candidate.source.id}: missing transcription`);
    const out = { ...candidate, transcription: tr };
    if (!tr.question_text || !tr.structure || !tr.meaningfulCase || !tr.solution_text || typeof tr.diagramRequired !== 'boolean' || !Array.isArray(tr.options) || !Array.isArray(tr.uncertainties)) throw new Error(`${job.jobId}/${candidate.source.id}: required field missing`);
    if (tr.options.filter(o => o.correct === true).length !== 1) throw new Error(`${job.jobId}/${candidate.source.id}: answer count invalid`);
    for (const o of tr.options) if (o.correct !== true && (!o.why || o.why.length < 15)) throw new Error(`${job.jobId}/${candidate.source.id}: distractor why invalid`);
    return out;
  });
  const output = { jobId: job.jobId, candidates };
  fs.writeFileSync(`${outputDir}/${job.jobId}.json`, JSON.stringify(output, null, 2) + '\n', 'utf8');
}
