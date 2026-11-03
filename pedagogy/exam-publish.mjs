// Exam saves go through publish-project.mjs with a ledger row (3 November 2026,
// user requested). Dry run by default. --apply needs --approved-by quoting
// James's chat approval, then checks closure on the read-back file, marks the
// proposal saved and prints the git add paths for a commit taken from the live
// file. It never commits. See docs/booklet-exam-completion.md.
//   node pedagogy/exam-publish.mjs --project-id ID [--apply --approved-by "QUOTE"] [--note TEXT]
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {checkClosure, defaultBindings, readJson, rebaseClosureRecord, sha256File} from './exam-closure.mjs';
import {DEFAULT_REGISTRY, markSaved, readEntry, recordApproval, writeEntry} from './exam-proposals.mjs';

export const LEDGER = '.booklet-work/end-goal-20261028/publications.jsonl';

function closureFor({record, projectFile, candidate, bindings, root}) {
  const screenFile = path.resolve(root, record.screenFile), screen = readJson(screenFile);
  return checkClosure({record, project: readJson(projectFile), projectSha256: sha256File(projectFile), candidate, screenRows: (screen.questionReferences ?? []).map(ref => ({id: ref.id, status: ref.status})), screenSha256: sha256File(screenFile), ...bindings});
}

export async function examPublish({projectId, apply = false, approvedBy, note, root = process.cwd(), registry = DEFAULT_REGISTRY, publish}) {
  const {entry, bytes} = readEntry(projectId, path.resolve(root, registry));
  if (entry?.status !== 'open') throw Error(`${projectId} has no open proposal`);
  if (apply && (typeof approvedBy !== 'string' || approvedBy.trim().length < 3)) throw Error('--apply requires --approved-by "<quote of the chat approval>"');
  const candidateFile = path.resolve(root, entry.candidateFile);
  if (sha256File(candidateFile) !== entry.candidateSha256) throw Error('Candidate file differs from the open proposal');
  const projectFile = path.resolve(root, 'booklets/projects', projectId + '.json'), bindings = await defaultBindings();
  const recordFile = entry.closureRecord && path.resolve(root, entry.closureRecord), record = recordFile && readJson(recordFile);
  const before = record ? closureFor({record, projectFile, candidate: readJson(candidateFile), bindings, root}) : null;
  if (apply && !before?.closed) throw Error('Closure is not met for the candidate; --apply refused');
  publish ??= (await import('../scripts/booklet/publish-project.mjs')).publishProject;
  const args = {candidateFile, expectedRevision: entry.fromRevision, ledger: path.resolve(root, LEDGER), note: note ?? `Exam proposal ${projectId}`, root};
  if (!apply) return {dryRun: true, publish: await publish({...args, apply: false}), closure: before, gitAdd: null};

  // Approval is recorded before the save so a failed save still shows it.
  let current = recordApproval(entry, approvedBy);
  writeEntry(current, {dir: path.resolve(root, registry), expectedBytes: bytes});
  const result = await publish({...args, apply: true});
  const rebased = rebaseClosureRecord(record, {revision: result.to, sha256: sha256File(projectFile), savedFrom: {ledger: LEDGER, savedAt: result.savedAt}});
  const rebasedFile = recordFile.replace(/(\.r\d+)?\.json$/, `.r${result.to}.json`);
  fs.writeFileSync(rebasedFile, JSON.stringify(rebased, null, 2) + '\n', {flag: 'wx'});
  const after = closureFor({record: rebased, projectFile, bindings, root});
  const latest = readEntry(projectId, path.resolve(root, registry));
  current = markSaved(latest.entry, {publishResult: result, closureRecord: path.relative(root, rebasedFile).replaceAll('\\', '/')});
  writeEntry(current, {dir: path.resolve(root, registry), expectedBytes: latest.bytes});
  const gitAdd = ['booklets/projects/' + projectId + '.json', ...result.bankWrites];
  return {dryRun: false, publish: result, closure: after, gitAdd: `git add -- ${gitAdd.join(' ')}`};
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2), arg = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
  const result = await examPublish({projectId: arg('--project-id') ?? (() => { throw Error('--project-id is required'); })(), apply: args.includes('--apply'), approvedBy: arg('--approved-by'), note: arg('--note'), registry: arg('--registry') ?? DEFAULT_REGISTRY});
  console.log(JSON.stringify(result, null, 2));
  if (result.gitAdd) console.log(`\nCommit from the live file (check its sha256 is ${result.publish.savedSha256} first):\n  ${result.gitAdd}`);
  if (result.closure && !result.closure.closed) process.exitCode = 1;
}
