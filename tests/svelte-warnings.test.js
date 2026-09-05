import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compile } from 'svelte/compiler';

const activeComponents = [
  'src/components/BookletStudio.svelte',
  'src/components/FullBookletImport.svelte',
  'src/components/PracticeQuestionEditor.svelte',
  'src/components/EditableBookletText.svelte',
  'src/components/MathsEditor.svelte',
  'src/components/BookletReviewInspector.svelte',
  'src/components/BookletAssemblyPanel.svelte',
  'src/components/BookletWorkflowMetrics.svelte',
  'src/components/BookletProjects.svelte',
  'src/components/TranscribedBookletPage.svelte',
];

test('active booklet components compile without Svelte warnings', () => {
  for (const filename of activeComponents) {
    const source = fs.readFileSync(filename, 'utf8');
    const warnings = compile(source, { filename, generate: 'client' }).warnings;
    assert.deepEqual(
      warnings.map((warning) => ({ code: warning.code, message: warning.message })),
      [],
      `${filename} emitted Svelte compiler warnings`,
    );
  }
});
