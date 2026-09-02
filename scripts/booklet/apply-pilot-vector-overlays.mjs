#!/usr/bin/env node
// Re-apply the v3 derivative source/solution mapping to the local pilot record.
import fs from 'node:fs/promises';
import path from 'node:path';

import { makeBankManifest, normaliseQuestion } from '../../src/lib/practice-question-model.js';
import { repairDerivativeQuestion } from './pilot-derivative-assets.mjs';

const bankDir = path.resolve('booklets/question-bank');
const names = (await fs.readdir(bankDir)).filter((name) => name.startsWith('q-') && name.endsWith('.json'));
let targetName = null;
for (const name of names) {
  const raw = JSON.parse(await fs.readFile(path.join(bankDir, name), 'utf8'));
  if (raw.classification?.primarySkillId === 'graph-derivative-function') {
    targetName = name;
    const repaired = normaliseQuestion(await repairDerivativeQuestion(raw));
    await fs.writeFile(path.join(bankDir, name), JSON.stringify(repaired, null, 2) + '\n', 'utf8');
    break;
  }
}
if (!targetName) throw new Error('No graph-derivative-function question found in the v3 bank.');
const records = [];
for (const name of names) records.push(JSON.parse(await fs.readFile(path.join(bankDir, name), 'utf8')));
await fs.writeFile(path.join(bankDir, 'manifest.json'), JSON.stringify(makeBankManifest(records), null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ question: targetName, records: records.length, format: 'mathsmap-practice-question-v3' }, null, 2));
