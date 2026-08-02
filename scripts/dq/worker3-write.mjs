import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const jobsPath = path.join(root, '.diagnostic-questions', 'visual-jobs-current.json');
const outDir = path.join(root, '.diagnostic-questions', 'transcriptions-full-20260802');
const mapPath = path.join(root, '.diagnostic-questions', 'worker3-transcriptions.json');
const jobsDoc = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
const mapping = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, 'utf8')) : {};
for (const extra of fs.readdirSync(path.dirname(mapPath)).filter(name => /^worker3-transcriptions-extra\d+\.json$/.test(name)).sort()) {
  Object.assign(mapping, JSON.parse(fs.readFileSync(path.join(path.dirname(mapPath), extra), 'utf8')));
}
fs.mkdirSync(outDir, { recursive: true });

const assigned = jobsDoc.jobs.filter(job => {
  const m = /^dq-visual-(\d+)$/.exec(job.jobId);
  return m && (((Number(m[1]) - 1) % 10) + 1) === 3;
});

function complete(c) {
  const t = c?.transcription;
  if (!t || typeof t.question_text !== 'string' || typeof t.structure !== 'string' ||
      typeof t.meaningfulCase !== 'string' || typeof t.mastery !== 'boolean' ||
      !Array.isArray(t.options) || !t.options.length ||
      t.options.filter(o => o.correct === true).length !== 1 ||
      t.options.some(o => o.correct !== true && (typeof o.why !== 'string' || o.why.length < 15)) ||
      typeof t.solution_text !== 'string' || typeof t.diagramRequired !== 'boolean' ||
      !Array.isArray(t.uncertainties)) return false;
  return true;
}

let written = 0;
for (const job of assigned) {
  const outPath = path.join(outDir, `${job.jobId}.json`);
  let existing = null;
  if (fs.existsSync(outPath)) {
    try { existing = JSON.parse(fs.readFileSync(outPath, 'utf8')); } catch {}
  }
  const prior = new Map((existing?.candidates ?? []).map(c => [String(c.source?.id), c.transcription]));
  const candidates = job.candidates.map(c => {
    const copy = JSON.parse(JSON.stringify(c));
    const id = String(c.source.id);
    if (prior.has(id) && prior.get(id)) copy.transcription = prior.get(id);
    else if (mapping[id]) copy.transcription = mapping[id];
    return copy;
  });
  if (!candidates.every(complete)) continue;
  const out = { jobId: job.jobId, candidates };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  written++;
}
console.log(`assigned=${assigned.length} written=${written}`);
