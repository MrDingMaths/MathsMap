#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSkillIndex, processCandidateBundle, retrieveSkillCandidates, skillIdsForTopic } from './core.mjs';

function usage() {
  return `Usage:
  node scripts/dq/process-candidates.mjs --bundle <file> [--repo <dir>] [--output <file>] [--promote]
    [--topic <topicId>] [--skills <id,id,...>] [--max-questions <n>] [--structure-map <file>] [--exclude <id,id,...>]
  node scripts/dq/process-candidates.mjs --bundle <file> --suggest [--limit 10]

The default is a read-only dry run. Only --promote writes quiz and provenance files.`;
}

function parseArgs(argv) {
  const result = { promote: false, suggest: false, limit: 10 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--promote') result.promote = true;
    else if (arg === '--suggest') result.suggest = true;
    else if (['--bundle', '--repo', '--output', '--provenance', '--limit', '--topic', '--skills', '--max-questions', '--structure-map', '--exclude'].includes(arg)) {
      if (argv[i + 1] === undefined) throw new Error(`${arg} requires a value`);
      result[arg.slice(2)] = argv[++i];
    } else if (arg === '--help' || arg === '-h') result.help = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  result.limit = Number(result.limit);
  if (!Number.isInteger(result.limit) || result.limit < 1) throw new Error('--limit must be a positive integer');
  if (result['max-questions'] !== undefined) {
    result.maxQuestions = Number(result['max-questions']);
    if (!Number.isInteger(result.maxQuestions) || result.maxQuestions < 1) throw new Error('--max-questions must be a positive integer');
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.bundle) throw new Error(`--bundle is required\n\n${usage()}`);
  const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const repoRoot = path.resolve(args.repo ?? defaultRoot);
  const bundle = JSON.parse(await fs.readFile(path.resolve(args.bundle), 'utf8'));
  const candidates = Array.isArray(bundle)
    ? bundle
    : Array.isArray(bundle.candidates)
      ? bundle.candidates
      : Array.isArray(bundle.jobs)
        ? bundle.jobs.flatMap((job) => job.candidates ?? [])
        : undefined;
  if (!Array.isArray(candidates)) throw new Error('bundle must be an array or an object with candidates[] or jobs[].candidates[]');

  let report;
  if (args.suggest) {
    const index = await loadSkillIndex(repoRoot);
    report = {
      mode: 'suggest',
      candidates: candidates.map((candidate) => ({
        sourceId: candidate.source?.id,
        suggestions: retrieveSkillCandidates(candidate, index, { limit: args.limit }).map(({ skill, score, matchedTerms }) => ({
          skillId: skill.id,
          title: skill.title,
          stage: skill.stage,
          courses: skill.courses,
          score,
          matchedTerms,
        })),
      })),
    };
  } else {
    const scoped = [];
    // `--topic` takes a comma-separated list so one pass can cover several topics,
    // matching build-screen-tasks.mjs.
    for (const topicId of (args.topic ?? '').split(',').map((t) => t.trim()).filter(Boolean)) {
      scoped.push(...await skillIdsForTopic(repoRoot, topicId));
    }
    if (args.skills) scoped.push(...args.skills.split(',').map((id) => id.trim()).filter(Boolean));
    if ((args.topic || args.skills) && scoped.length === 0) {
      throw new Error('--topic/--skills matched no skills; refusing to run an empty scope');
    }
    const structureMap = args['structure-map']
      ? JSON.parse(await fs.readFile(path.resolve(args['structure-map']), 'utf8'))
      : undefined;

    report = await processCandidateBundle({
      candidates,
      repoRoot,
      promote: args.promote,
      provenancePath: args.provenance ? path.resolve(args.provenance) : undefined,
      skillFilter: scoped.length ? [...new Set(scoped)] : undefined,
      excludeSourceIds: args.exclude ? args.exclude.split(',').map((id) => id.trim()).filter(Boolean) : undefined,
      maxQuestions: args.maxQuestions,
      structureMap,
    });
  }

  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (args.output) await fs.writeFile(path.resolve(args.output), output, 'utf8');
  else process.stdout.write(output);
}

main().catch((error) => {
  console.error(`[dq-process] ${error.message}`);
  process.exitCode = 1;
});
