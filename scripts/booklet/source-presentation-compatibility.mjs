import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const CONTRACT = 'scripts/booklet/prompts/source-presentation-v2.md';
const STEM_ADDITION = 'Question-stem placement (24 October 2026, user feedback): keep the shared stem beside its question number, above a diagram/parts row. A graph on the left and response parts on the right does not put the shared stem in the right column. Use a saved arrangement with the root prompt before that row; `liftQuestionStem` supports explicit repairs while retaining part layouts. Preserve a side-column stem only when source evidence specifically places that stem there, and record the exception. Check both semantic placement and saved arrangements; an old saved row can override a corrected default.';

// Only this additive convention is compatible with an existing v2 pin. The
// manifest and historical bytes stay untouched; authoring reads the current v2.
export function compatibleSourcePresentation({runDir, relative, expected, current}) {
 if (relative !== CONTRACT || !/^[a-f0-9]{64}$/.test(expected ?? '')) return false;
 const history = path.join(runDir, 'tooling-input-history', expected + '.source-presentation-v2.md');
 if (!fs.existsSync(history)) return false;
 const before = fs.readFileSync(history);
 if (createHash('sha256').update(before).digest('hex') !== expected) return false;
 const text = before.toString('utf8');
 const anchor = 'During fidelity review, explicitly compare:';
 const index = text.indexOf(anchor);
 if (index < 0 || index !== text.lastIndexOf(anchor) || text.includes(STEM_ADDITION)) return false;
 const newline = text.includes('\r\n') ? '\r\n' : '\n';
 const after = Buffer.from(text.slice(0, index) + STEM_ADDITION + newline + newline + text.slice(index));
 return Buffer.from(current).equals(after);
}
