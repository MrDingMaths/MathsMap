#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function nonEmptyPaths(candidate) {
  const paths = candidate.sourcePaths ?? (candidate.categoryPath ? [candidate.categoryPath] : []);
  return paths.filter((parts) => Array.isArray(parts) && parts.length > 0);
}

/** Convert one capture-state record into the source envelope workers must retain. */
export function captureCandidateToWorkerCandidate(candidate, { archiveRoot = '.diagnostic-questions', sourceUrl, licence } = {}) {
  if (!candidate?.sourceId) throw new Error('capture candidate is missing sourceId');
  if (!candidate?.capture?.pngPath || !candidate?.capture?.pngChecksum) {
    throw new Error(`capture candidate ${candidate.sourceId} has no completed PNG capture`);
  }
  const sourcePaths = nonEmptyPaths(candidate);
  const categoryPath = sourcePaths[0] ?? [];
  const relativePngPath = candidate.capture.pngPath.replaceAll('\\', '/');
  return {
    source: {
      id: String(candidate.sourceId),
      url: candidate.questionUrl || sourceUrl,
      categoryPath,
      sourcePaths,
      pngPath: path.resolve(archiveRoot, relativePngPath),
      pngArchivePath: relativePngPath,
      pngSha256: candidate.capture.pngChecksum,
      capturedAt: candidate.capture.capturedAt,
      metrics: {
        likes: candidate.likes ?? null,
        likedRank: candidate.ranks?.liked ?? null,
        misconceptionRank: candidate.ranks?.misconceptions ?? null,
        responseData: candidate.responseData ?? [],
        fusedScore: candidate.ranking?.fusedScore ?? null,
      },
      ...(candidate.licence || licence ? { licence: candidate.licence ?? licence } : {}),
    },
    qualityScore: candidate.ranking?.fusedScore ?? null,
    workerInstructions: {
      preserveSourceEnvelope: true,
      add: ['transcription', 'checker', 'mapping', 'review'],
    },
  };
}

/** Resolve accepted source revisions from either the legacy pilot ledger or QA v2. */
export function acceptedQaFilter(qaLedger) {
  if (!qaLedger) return { acceptedIds: null, acceptedRevisions: null };
  if (qaLedger.schemaVersion === 1) {
    if (!Array.isArray(qaLedger.acceptedIds)) {
      throw new Error('legacy --qa file must contain acceptedIds[]');
    }
    return { acceptedIds: qaLedger.acceptedIds, acceptedRevisions: null };
  }
  if (qaLedger.schemaVersion !== 2 || !qaLedger.captures || !qaLedger.currentBySourceId) {
    throw new Error('--qa file must be a legacy acceptedIds ledger or QA schemaVersion 2 ledger');
  }
  const acceptedRevisions = new Map();
  for (const [sourceId, captureKey] of Object.entries(qaLedger.currentBySourceId)) {
    const capture = qaLedger.captures[captureKey];
    if (!capture || String(capture.sourceId) !== String(sourceId)) {
      throw new Error(`--qa current capture is missing or mismatched for source ${sourceId}`);
    }
    if (capture.status === 'accepted') {
      acceptedRevisions.set(String(sourceId), String(capture.pngSha256).toLowerCase());
    }
  }
  return { acceptedIds: null, acceptedRevisions };
}

/** Return deterministic, disjoint visual-worker jobs of at most five images. */
export function exportSubagentJobs(captureState, {
  archiveRoot = '.diagnostic-questions',
  batchSize = 5,
  permissionConfirmed = false,
  acceptedIds = null,
  acceptedRevisions = null,
} = {}) {
  if (!captureState || typeof captureState !== 'object') throw new Error('capture state must be an object');
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 5) {
    throw new Error('batchSize must be an integer from 1 to 5');
  }
  const accepted = acceptedIds ? new Set([...acceptedIds].map(String)) : null;
  const revisions = acceptedRevisions ? new Map(acceptedRevisions) : null;
  const candidates = Object.values(captureState.candidates ?? {})
    .filter((candidate) => candidate?.capture?.pngPath && candidate?.capture?.pngChecksum)
    .filter((candidate) => {
      const sourceId = String(candidate.sourceId);
      if (revisions) {
        return revisions.get(sourceId) === String(candidate.capture.pngChecksum).toLowerCase();
      }
      return !accepted || accepted.has(sourceId);
    })
    .sort((left, right) =>
      (right.ranking?.fusedScore ?? 0) - (left.ranking?.fusedScore ?? 0) ||
      String(left.sourceId).localeCompare(String(right.sourceId)))
    .map((candidate) => captureCandidateToWorkerCandidate(candidate, {
      archiveRoot,
      sourceUrl: captureState.sourceUrl,
      licence: captureState.licence ?? {
        permissionConfirmed: permissionConfirmed === true,
        basis: permissionConfirmed === true ? 'operator-confirmed-at-export' : 'unconfirmed',
      },
    }));

  const jobs = [];
  for (let index = 0; index < candidates.length; index += batchSize) {
    jobs.push({
      jobId: `dq-visual-${String(jobs.length + 1).padStart(4, '0')}`,
      candidates: candidates.slice(index, index + batchSize),
    });
  }
  return { schemaVersion: 1, sourceStateVersion: captureState.version ?? null, jobs };
}

/** Preserve completed worker fields only when both source ID and PNG revision still match. */
export function preserveWorkerResults(exported, previous) {
  const retained = new Map();
  for (const candidate of previous?.jobs?.flatMap((job) => job.candidates ?? []) ?? []) {
    const sourceId = String(candidate?.source?.id ?? '');
    const pngSha256 = String(candidate?.source?.pngSha256 ?? '').toLowerCase();
    if (!sourceId || !pngSha256) continue;
    retained.set(`${sourceId}@${pngSha256}`, candidate);
  }
  let preservedCandidates = 0;
  const preservedFields = { transcription: 0, checker: 0, mapping: 0, review: 0 };
  for (const candidate of exported?.jobs?.flatMap((job) => job.candidates ?? []) ?? []) {
    const key = `${String(candidate.source.id)}@${String(candidate.source.pngSha256).toLowerCase()}`;
    const prior = retained.get(key);
    if (!prior) continue;
    let copied = false;
    for (const field of Object.keys(preservedFields)) {
      if (prior[field] === undefined) continue;
      candidate[field] = structuredClone(prior[field]);
      preservedFields[field] += 1;
      copied = true;
    }
    if (copied) preservedCandidates += 1;
  }
  return { preservedCandidates, preservedFields };
}

function parseArgs(argv) {
  const result = { batchSize: 5, permissionConfirmed: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') result.help = true;
    else if (arg === '--permission-confirmed') result.permissionConfirmed = true;
    else if (['--state', '--archive', '--output', '--batch-size', '--qa', '--preserve'].includes(arg)) {
      if (argv[index + 1] === undefined) throw new Error(`${arg} requires a value`);
      result[arg.slice(2).replace('-size', 'Size')] = argv[++index];
    } else throw new Error(`unknown argument: ${arg}`);
  }
  result.batchSize = Number(result.batchSize);
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node scripts/dq/export-jobs.mjs --state <capture-state.json> [--archive <dir>] [--qa <capture-qa.json>] [--preserve <worker-results.json>] [--batch-size 5] [--permission-confirmed] [--output <file>]');
    return;
  }
  const defaultArchive = path.resolve('.diagnostic-questions');
  const statePath = path.resolve(args.state ?? path.join(defaultArchive, 'capture-state.json'));
  const archiveRoot = path.resolve(args.archive ?? path.dirname(statePath));
  const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
  const qa = args.qa ? JSON.parse(await fs.readFile(path.resolve(args.qa), 'utf8')) : null;
  const qaFilter = acceptedQaFilter(qa);
  const jobs = exportSubagentJobs(state, {
    archiveRoot,
    batchSize: args.batchSize,
    permissionConfirmed: args.permissionConfirmed,
    ...qaFilter,
  });
  if (args.preserve) {
    const previous = JSON.parse(await fs.readFile(path.resolve(args.preserve), 'utf8'));
    const preservation = preserveWorkerResults(jobs, previous);
    jobs.preservation = {
      source: path.resolve(args.preserve),
      ...preservation,
    };
  }
  const output = `${JSON.stringify(jobs, null, 2)}\n`;
  if (args.output) await fs.writeFile(path.resolve(args.output), output, 'utf8');
  else process.stdout.write(output);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(`[dq-export-jobs] ${error.message}`);
    process.exitCode = 1;
  });
}
