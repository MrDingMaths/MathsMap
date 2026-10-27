import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const CONTRACT = 'scripts/booklet/prompts/source-presentation-v2.md';
const STEM_ADDITION = 'Question-stem placement (24 October 2026, user feedback): keep the shared stem beside its question number, above a diagram/parts row. A graph on the left and response parts on the right does not put the shared stem in the right column. Use a saved arrangement with the root prompt before that row; `liftQuestionStem` supports explicit repairs while retaining part layouts. Preserve a side-column stem only when source evidence specifically places that stem there, and record the exception. Check both semantic placement and saved arrangements; an old saved row can override a corrected default.';

// Exact, inspected contract revision for resumed October imports. The additions
// cover vertex labels, stem placement, calculator panels, width scope and native
// annotated formulas. Historical content is otherwise unchanged. Both snapshots
// must match: this is not permission for arbitrary future prompt changes.
const OCTOBER_25_REVISION = {
 before: 'd84dcd762277ebeb25c896857b29e0f93a2920159a1d15a26531fe6fc52879be',
 after: '0b244b47433c0f4dd810c9ff16daea6d8bfca856408456a6a8930d5cf7152b95',
};

// The manifest and historical bytes stay untouched; authoring reads current v2.
export function compatibleSourcePresentation({runDir, relative, expected, current}) {
 if (relative !== CONTRACT || !/^[a-f0-9]{64}$/.test(expected ?? '')) return false;
 const history = path.join(runDir, 'tooling-input-history', expected + '.source-presentation-v2.md');
 let before;
 if (fs.existsSync(history)) before = fs.readFileSync(history);
 else if (expected === OCTOBER_25_REVISION.before) {
  // Early runs predate run-local prompt history. Retain the one verified tool
  // snapshot centrally, rather than manufacturing per-run evidence or repinning.
  const archive = JSON.parse(fs.readFileSync(fileURLToPath(new URL('./prompts/history/source-presentation-v2-20261015.json', import.meta.url)), 'utf8'));
  if (archive.sha256 !== expected) return false;
  before = Buffer.from(archive.text, 'utf8');
 } else return false;
 if (createHash('sha256').update(before).digest('hex') !== expected) return false;
 if (expected === OCTOBER_25_REVISION.before && [OCTOBER_25_REVISION.after, '9427e90408516af1b10ad17b7eca821b59921981bbe6095ab2b131a9a45f77f1'].includes(createHash('sha256').update(current).digest('hex'))) return true;
 const text = before.toString('utf8');
 // Later additive conventions can sit between the stem paragraph and the
 // original fidelity-review anchor; retain their exact bytes and position.
 const anchor = text.includes('Calculator instruction panels (25 October 2026):')
  ? 'Calculator instruction panels (25 October 2026):'
  : 'During fidelity review, explicitly compare:';
 const index = text.indexOf(anchor);
 if (index < 0 || index !== text.lastIndexOf(anchor) || text.includes(STEM_ADDITION)) return false;
 const newline = text.includes('\r\n') ? '\r\n' : '\n';
 const after = Buffer.from(text.slice(0, index) + STEM_ADDITION + newline + newline + text.slice(index));
 return Buffer.from(current).equals(after);
}
