# Diagnostic Questions independent checker

For each candidate, view `source.pngPath`, compare every character and diagram relation with the
draft transcription, and solve the problem independently. Do not rely on the first worker's
answer or reasoning and do not edit repository files.

Return a `checker` object with:

- `transcriptionMatch`: true only when stem and every option exactly match the PNG;
- `answerMatch`: true only when the independently solved answer matches the marked option;
- `issues`: an array of concrete discrepancies or ambiguities;
- `independentAnswer`: the option text and minimal supporting calculation.

Any illegibility, multiple defensible answers, missing option, cropped diagram, or key mismatch
must set the relevant match field false and enter human review.
