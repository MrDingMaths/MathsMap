import fs from 'node:fs';

// Embed the contract in execution prompts: workers need not find repository docs.
export const SOLUTION_CONVENTIONS = fs.readFileSync(
  new URL('../../docs/booklet-worked-solution-style.md', import.meta.url), 'utf8',
);
