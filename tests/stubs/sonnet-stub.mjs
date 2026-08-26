#!/usr/bin/env node
// Scripted stand-in for the `claude` CLI, driven via MM_CLAUDE_CMD so
// scripts/run-sonnet-check.mjs can be exercised without a real model.
//
// Unlike codex, `claude -p --output-format json` returns its reply on STDOUT inside a
// result envelope, so this stub prints an envelope rather than writing a file.
//
// Modes via SONNET_STUB_MODE:
//   (unset) / "success"  a valid reply, JSON-encoded inside the envelope's result string.
//   "fenced"             the same reply wrapped in a ```json fence (the model ignoring the
//                        "no markdown fencing" instruction — must still parse).
//   "malformed"          result text that is not JSON (exercises the retry path).
//   "is_error"           a well-formed envelope carrying is_error:true.

const mode = process.env.SONNET_STUB_MODE || 'success';

async function drainStdin() {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

function reply() {
  return {
    quiz: [{ id: 'q1', chosenIndex: 1, chosenOptionText: 'B', reasoning: 'stub' }],
    masteryPractice: [{ id: 'm1', answer: '42', reasoning: 'stub' }],
    flags: [],
    coverage: { itemsReceived: 2, itemsAnswered: 2 },
  };
}

function envelope(resultText, isError = false) {
  return JSON.stringify({
    type: 'result',
    result: resultText,
    is_error: isError,
    usage: { input_tokens: 1000, cache_read_input_tokens: 500, output_tokens: 200 },
  });
}

async function main() {
  await drainStdin();
  if (mode === 'malformed') { process.stdout.write(envelope('not json at all')); return; }
  if (mode === 'is_error') { process.stdout.write(envelope('usage limit reached', true)); return; }
  if (mode === 'fenced') { process.stdout.write(envelope('```json\n' + JSON.stringify(reply()) + '\n```')); return; }
  process.stdout.write(envelope(JSON.stringify(reply())));
}

main().catch((error) => {
  process.stderr.write(`sonnet-stub: ${error.message}\n`);
  process.exit(1);
});
