// Import chat-created reconstruction data without executing a model or altering the source run.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { materializeRunAsProject } from './project-studio-server.mjs';

export async function importReconstruction({ runId, input, projectId, ...options }) {
  if (!runId || !input) throw new Error('Provide --run-id and --input');
  const candidate = JSON.parse(fs.readFileSync(input, 'utf8').replace(/^\uFEFF/, ''));
  return materializeRunAsProject(runId, { ...options, candidate, projectId });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = { '--run-id': 'runId', '--input': 'input', '--project-id': 'projectId' }[args[i]];
    if (!key || !args[i + 1]) throw new Error('Use --run-id ID --input FILE [--project-id ID]');
    options[key] = args[i + 1];
  }
  importReconstruction(options).then(project => console.log(JSON.stringify({
    id: project.id, revision: project.revision, pages: project.sections.length,
    url: `/#/booklet?stage=projects&project=${encodeURIComponent(project.id)}`,
  }, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
