import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compile } from 'svelte/compiler';

const activeComponents = [
  'src/components/BookletStudio.svelte',
  'src/components/PracticeQuestionEditor.svelte',
  'src/components/EditableBookletText.svelte',
  'src/components/MathsEditor.svelte',
  'src/components/FocusedBookletEditor.svelte',
  'src/components/EditorSplitView.svelte',
  'src/components/BookletLayoutControls.svelte',
  'src/components/DiagramDraftEditor.svelte',
  'src/components/QuestionArrangementEditor.svelte',
  'src/components/BookletArrangement.svelte',
  'src/components/ImageCropControls.svelte',
  'src/components/BookletReviewInspector.svelte',
  'src/components/BookletAssemblyPanel.svelte',
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
