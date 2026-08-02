import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const archive = path.join(root, '.diagnostic-questions');
const manifest = JSON.parse(fs.readFileSync(path.join(archive, 'visual-jobs-current.json'), 'utf8'));
const inputDir = path.join(archive, 'transcriptions-full-20260802');
const jobs = manifest.jobs.map((job) => {
  const file = path.join(inputDir, `${job.jobId}.json`);
  if (!fs.existsSync(file)) throw new Error(`missing ${job.jobId}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
});
const candidates = jobs.reduce((sum, job) => sum + job.candidates.length, 0);
const output = { schemaVersion: 1, sourceStateVersion: 1, jobs };
const target = path.join(archive, 'worker-results.json');
fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`merged ${jobs.length} jobs / ${candidates} candidates -> ${target}`);
