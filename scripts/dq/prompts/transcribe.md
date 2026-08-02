# Diagnostic Questions visual transcription worker

You receive at most five candidate records. For each record, open `source.pngPath` and preserve
the complete `source` envelope unchanged. Do not edit repository files.

Return the candidate with a `transcription` object containing only:

- `question_text`: exact MathsMap rich text, using JSON-escaped KaTeX and inline TikZ where needed;
- `structure`: a kebab-case description of the tested routine;
- `meaningfulCase`: a concise sign/regime/boundary/representation case;
- `mastery`: true only for a same-skill non-routine twist;
- `options`: 3–5 homogeneous options, exactly one with `correct: true`, every distractor with a specific 15+ character `why`;
- `solution_text`: independently worked MathsMap solution without restating the prompt;
- `diagramRequired`: boolean;
- `uncertainties`: an array, empty only when every glyph, value, option, and diagram relation is legible.

Solve the question independently. Do not infer a source answer from option position or colour.
If the screenshot is cropped, ambiguous, illegible, or has more than one defensible answer,
record the issue in `uncertainties` and do not pretend it is resolved.
