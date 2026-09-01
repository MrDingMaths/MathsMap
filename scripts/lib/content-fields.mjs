// Walks the stem/solution fields of a skill's content and quiz files.
//
// Both scripts/audit-house-format.mjs (read) and scripts/apply-house-format.mjs
// (write) need the same traversal, and a mutating walk must visit exactly what
// the audit visits or the gate and the fixer disagree. The visitor is handed
// the owning object so a caller can write `obj[key]` back in place, which keeps
// JSON key order intact.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const TIERS = ['foundation', 'development', 'mastery'];

export function listSkillIds(baseDir, filterFn) {
  const ids = new Set();
  for (const sub of ['content', 'quizzes']) {
    let files;
    try {
      files = readdirSync(join(baseDir, sub));
    } catch (err) {
      if (err.code === 'ENOENT') continue;
      throw err;
    }
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const id = f.replace(/\.json$/, '');
      if (!filterFn || filterFn(id)) ids.add(id);
    }
  }
  return [...ids].sort();
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// visit({ obj, key, kind, where }) for every question_text / solution_text in a
// parsed file. `kind` is 'stem' or 'solution'; `where` is a human-readable
// locator like `f3` (foundation card 3) or `q7` (quiz question id).
export function visitTextFields(parsed, source, visit) {
  const emit = (obj, where) => {
    for (const [key, kind] of [['question_text', 'stem'], ['solution_text', 'solution']]) {
      if (typeof obj?.[key] === 'string') visit({ obj, key, kind, where });
    }
  };

  if (source === 'quiz') {
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    questions.forEach((q, i) => emit(q, q?.id || `q${i + 1}`));
    return;
  }

  if (source === 'option') {
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    questions.forEach((q, i) => {
      const options = Array.isArray(q?.options) ? q.options : [];
      options.forEach((option, j) => {
        for (const key of ['text', 'why']) {
          // An option is rendered by Math.svelte, not InlineContent: KaTeX only,
          // and a newline in it is NOT a line break. So the notation rules apply
          // to these two fields but the line-break rules cannot.
          if (typeof option?.[key] === 'string') {
            visit({ obj: option, key, kind: 'option', where: `${q?.id || `q${i + 1}`} option ${j + 1}` });
          }
        }
      });
    });
    return;
  }

  const practice = parsed?.practice || {};
  for (const tier of TIERS) {
    const cards = Array.isArray(practice[tier]) ? practice[tier] : [];
    cards.forEach((card, i) => emit(card, `${tier[0]}${i + 1}`));
  }
}
