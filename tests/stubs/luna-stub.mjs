#!/usr/bin/env node
// Scripted stand-in for the `codex` CLI, driven via MM_LUNA_CODEX_CMD so
// scripts/run-luna-check.mjs can be exercised without a real model.
//
// Reads stdin (the prompt), finds --output-last-message in its own argv, and writes a
// canned reply JSON there before exiting 0 -- mirroring what codex exec does on success.
//
// Modes via LUNA_STUB_MODE:
//   (unset) / "success"  writes a valid reply matching scripts/luna-check-schema.json.
//   "malformed"          writes text that is not valid JSON (exercises the retry path).
//   "hang"                never exits (exercises the driver's timeout + process-kill path).
import { promises as fs } from 'node:fs';

const mode = process.env.LUNA_STUB_MODE || 'success';

function findArg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1];
}

async function drainStdin() {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

async function main() {
  if (mode === 'hang') {
    // Drain stdin so the parent's write can complete, then hang forever. The driver's
    // timeout is expected to kill this whole process tree.
    drainStdin().catch(() => {});
    await new Promise(() => {});
    return;
  }

  const input = await drainStdin();
  const outputFile = findArg('--output-last-message');
  if (!outputFile) {
    process.stderr.write('luna-stub: no --output-last-message argument found\n');
    process.exit(1);
  }

  if (mode === 'malformed') {
    await fs.writeFile(outputFile, 'this is not valid json {{{');
    process.exit(0);
  }

  const skillIdMatch = input.match(/"skillId"\s*:\s*"([^"]+)"/);
  const skillId = skillIdMatch ? skillIdMatch[1] : 'unknown-skill';

  const reply = {
    skillId,
    quiz: [
      { id: 'q1', chosenIndex: 0, chosenOptionText: 'A', method: 'stub reasoning', confidence: 'solid' },
    ],
    masteryPractice: [
      { id: 'm1', answer: 'stub answer', method: 'stub reasoning', confidence: 'solid' },
    ],
    flags: [],
    coverage: { itemsReceived: 2, itemsAnswered: 2 },
  };
  await fs.writeFile(outputFile, JSON.stringify(reply));
  process.exit(0);
}

main();
