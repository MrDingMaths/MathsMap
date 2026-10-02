const TEXT_KEYS = ['question_text', 'solution_text'];
const owns = (obj, key) => Object.prototype.hasOwnProperty.call(obj ?? {}, key);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
// JSON-shaped content may be a Svelte state proxy, which structuredClone rejects.
const clone = value => Array.isArray(value) ? value.map(clone) : isObject(value)
  ? Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)])) : value;

// Keep source locators and object identity: audits can edit exactly what readers see.
// Invalid dual representations are reported separately, and neither is hidden here.
export function workedExampleEntries(theory) {
  const entries = [];
  if (isObject(theory?.workedExample)) entries.push({ example: theory.workedExample, where: 'workedExample' });
  if (Array.isArray(theory?.workedExamples)) {
    theory.workedExamples.forEach((example, i) => {
      if (isObject(example)) entries.push({ example, where: `workedExamples[${i}]` });
    });
  }
  return entries;
}

export function getWorkedExamples(theory) {
  return workedExampleEntries(theory).map(({ example }) => example);
}

export function workedExampleProblems(theory) {
  const problems = [];
  if (owns(theory, 'workedExample') && owns(theory, 'workedExamples')) {
    problems.push('theory must not contain both workedExample and workedExamples');
  }
  const check = (example, where) => {
    if (!isObject(example)) {
      problems.push(`${where} must be an object`);
      return;
    }
    for (const key of TEXT_KEYS) {
      if (typeof example[key] !== 'string' || !example[key].trim()) problems.push(`${where}.${key} is missing or empty`);
    }
  };
  if (owns(theory, 'workedExample')) check(theory.workedExample, 'theory.workedExample');
  if (owns(theory, 'workedExamples')) {
    if (!Array.isArray(theory.workedExamples) || theory.workedExamples.length === 0) {
      problems.push('theory.workedExamples must be a nonempty array');
    } else {
      theory.workedExamples.forEach((example, i) => check(example, `theory.workedExamples[${i}]`));
    }
  }
  return problems;
}

export function theoryTextFields(theory) {
  const fields = [];
  const emit = (obj, key, where) => {
    if (typeof obj?.[key] === 'string') fields.push({ obj, key, where });
  };
  emit(theory, 'intro', 'intro');
  for (const { example, where } of workedExampleEntries(theory)) {
    for (const key of TEXT_KEYS) emit(example, key, `${where}.${key}`);
  }
  for (const key of ['facts', 'steps']) {
    if (Array.isArray(theory?.[key])) theory[key].forEach((_, i) => emit(theory[key], i, `${key}[${i}]`));
  }
  return fields;
}

// The final bracket is a source-array index, never a diagram-block index.
// Callers keep the separate blockIndex when locating a figure inside this field.
export function theoryFieldAccessor(theory, where) {
  const field = theoryTextFields(theory).find(entry => entry.where === where.replace(/^theory\./, ''));
  if (!field) throw new Error(`no theory field at ${where}`);
  return { get: () => field.obj[field.key], set: value => { field.obj[field.key] = value; } };
}

export function createTheoryEditorDraft(theory) {
  return {
    intro: theory?.intro ?? '', facts: [...(theory?.facts ?? [])], steps: [...(theory?.steps ?? [])],
    workedExamples: clone(getWorkedExamples(theory)),
  };
}

export function moveWorkedExample(examples, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= examples.length || to >= examples.length) return [...examples];
  const next = [...examples];
  const [example] = next.splice(from, 1);
  next.splice(to, 0, example);
  return next;
}

// Preserve theory and example extension fields while saving the editable draft.
// Scalar inputs remain compatible with earlier callers; the editor uses the array.
export function buildTheoryDraft(original, draft) {
  const { intro, facts, steps } = draft;
  const out = { ...(original ?? {}), intro, facts: [...facts], steps: [...steps] };
  delete out.workedExample;
  delete out.workedExamples;
  if (Array.isArray(draft.workedExamples)) {
    if (draft.workedExamples.length) out.workedExamples = clone(draft.workedExamples);
  } else {
    const { exampleQuestion = '', exampleSolution = '' } = draft;
    if (exampleQuestion.trim() || exampleSolution.trim()) {
      out.workedExample = { ...(original?.workedExample ?? {}), question_text: exampleQuestion, solution_text: exampleSolution };
    }
  }
  return out;
}
