// Pure, bounded feedback candidate. The coordinator publishes through the
// revision-safe project/bank transaction after affected-page verification.
import assert from 'node:assert/strict';
import {setPageBoundary} from '../../src/lib/booklet-workspace.js';

export const DATA_ANALYSIS_FEEDBACK_REPAIR = 'data-analysis-feedback-2026-09-28';
const ids = ['p24-q1-block', 'p26-q10-block', 'p31-position-formula', 'p31-example-header', 'p41-identify'];
const clone = structuredClone, S = String.raw;
const separateFormula = S`% mathsmap-diagram-colours {"version":1,"kind":"geometry","base":[],"semantic":[],"reference":"source page 31, p31-position-formula"}
\begin{tikzpicture}[x=1mm,y=1mm,every node/.style={font=\fontsize{10}{12}\selectfont,text=black,inner sep=0pt,outer sep=0pt}]
\special{dvisvgm:raw <metadata data-graph-strokes="1"/>}
\node (n) at (0,0) {$n$};
\node at (4.2,0) {$+$};
\node at (8.4,0) {$1$};
\draw[black,line width=0.4pt] (-2,-3.4)--(10.6,-3.4);
\node at (4.3,-7) {$2$};
\node[anchor=east] at (-3.5,-3.4) {$\mathrm{Position}={}$};
\node[anchor=south] at (4.2,12) {Number of data values};
\draw[black,->,>=latex,line width=0.4pt] (0,10.4)--([yshift=1.2mm]n.north);
\end{tikzpicture}`;
const excluded = new Set(['sourceReview', 'sourceAtom', 'sourceRefs', 'sourceLayoutEvidence', 'spec', 'provenance', 'studio']);
function visit(value, fn) {
  if (!value || typeof value !== 'object') return;
  fn(value);
  for (const [key, child] of Object.entries(value)) if (!excluded.has(key)) visit(child, fn);
}
function node(root, id) {
  const matches = [];
  visit(root, n => { if (n.id === id) matches.push(n); });
  assert.equal(matches.length, 1, `Expected one current node ${id}`);
  return matches[0];
}
function expected(value, wanted, context) { assert.deepEqual(value, wanted, `Stale expected shape: ${context}`); }

// Baseline source-identical render: 11 pt paragraph/formula, KaTeX multiplier
// 1.05. KaTeX converts mm to em using a 10 TeX-pt quad. A boxed rule also has
// 0.6 em horizontal padding and 0.68 em vertical padding/borders. Compensate
// those as well as the nominal rule/hspace so handwriting boxes keep their
// measured physical outer size when the surrounding label becomes 10 pt.
const mmToEm = 72.27 / 25.4 / 10, fontRatio = 11 / 10;
export function preserveScaffoldBlankSize(latex) {
  const dimension = (mm, extraEm) => Number((Number(mm) * fontRatio + extraEm * (fontRatio - 1) / mmToEm).toFixed(6));
  return latex.replace(/\\boxed\{\\rule\{0pt\}\{([\d.]+)mm\}\\hspace\{([\d.]+)mm\}\}/g,
    (_, height, width) => S`\boxed{\rule{0pt}{${dimension(height, 0.68)}mm}\hspace{${dimension(width, 0.6)}mm}}`);
}

export function medianPositionFormulaCode() {
  return S`% mathsmap-diagram-colours {"version":1,"kind":"geometry","base":[],"semantic":[],"reference":"source page 31; single-formula feedback repair 2026-09-28"}
\begin{tikzpicture}[x=1mm,y=1mm,every node/.style={font=\fontsize{10}{12}\selectfont,text=black,inner sep=0pt,outer sep=0pt}]
\path[use as bounding box] (0,-6) rectangle (65,17);
\node[anchor=east] (formula) at (46,0) {$\displaystyle\mathrm{Position}=\frac{n+1}{2}$};
% The complete fraction is one TeX node. The x coordinate was measured from
% the calibrated SVG n glyph's actual bounding-box centre at final size.
\coordinate (n-target) at (38.3137,4.5);
\node[anchor=south] at (37,12) {Number of data values};
\draw[black,->,>=latex,line width=0.4pt] (38.3137,10.8)--(n-target);
\end{tikzpicture}`;
}

export function repairDataAnalysisFeedback(original) {
  expected(original.id, 'data-analysis-v1', 'project identity');
  const next = clone(original), blocks = next.sections.flatMap(s => s.blocks);
  const block = id => { const matches = blocks.filter(b => b.id === id); expected(matches.length, 1, id); return matches[0]; };
  ids.forEach(block);
  // Check every replacement before editing. Unrelated current changes are kept;
  // a changed target fails rather than silently overwriting a manual repair.
  const scaffold = block('p24-q1-block');
  expected(scaffold.content.id, 'p24-q1', 'scaffold question');
  expected(scaffold.content.columns, 2, 'scaffold columns');
  expected(scaffold.content.children.map(c => c.id), ['p24-q1-a', 'p24-q1-b', 'p24-q1-c', 'p24-q1-d'], 'scaffold parts');
  const scaffoldArrangement = next.settings.layoutOverrides.blockLayouts[scaffold.id].arrangement.root;
  expected(scaffoldArrangement.after, undefined, 'scaffold trailing arrangement space');
  const scaffoldParagraphs = [];
  for (const part of scaffold.content.children.slice(0, 3)) {
    expected(part.prompt.blocks[0].id, part.id + '-data', 'dataset order');
    expected(part.prompt.blocks[0].spaceAfter, 3, part.id + ' dataset trailing space');
    visit(part.prompt.blocks[1], n => {
      if (n.type === 'paragraph') {
        assert.ok(n.fontSize == null, `Stale expected shape: ${n.id} font size`);
        assert.ok(n.lineHeight == null, `Stale expected shape: ${n.id} line spacing`);
        const before = n.id === 'p24-q1-b-median-result' ? 2 : ['p24-q1-c-mode-label', 'p24-q1-c-mode', 'p24-q1-c-median-label', 'p24-q1-c-median', 'p24-q1-a-mean-label', 'p24-q1-a-add-scores-hint', 'p24-q1-a-count-hint', 'p24-q1-a-mean-rounding-hint'].includes(n.id) ? 0 : undefined;
        const after = ['p24-q1-b-mode', 'p24-q1-c-mode', 'p24-q1-c-median'].includes(n.id) ? 7 : n.id === 'p24-q1-b-range-result' ? 3 : ['p24-q1-a-mean-label', 'p24-q1-c-mode-label', 'p24-q1-c-median-label'].includes(n.id) ? 1 : n.id.includes('-add-scores-hint') || n.id.includes('-count-hint') || n.id.includes('-mean-rounding-hint') ? 0 : undefined;
        expected(n.spaceBefore, before, n.id + ' leading space');
        expected(n.spaceAfter, after, n.id + ' trailing space');
        scaffoldParagraphs.push(n);
      }
    });
  }
  expected(scaffoldParagraphs.length, 29, 'scaffold paragraph count');
  const topTable = node(scaffold.content, 'p24-q1-a-top-table');
  expected(topTable.rowHeights, [10, 12], 'top scaffold row heights');
  const annotated = node(scaffold.content, 'p24-q1-a-mean-table');
  expected(annotated.type, 'annotated-equation', 'mean scaffold');
  expected(annotated.fontSize, null, 'mean scaffold font size');
  expected(annotated.annotations.map(a => a.id), ['p24-q1-a-numerator-arrow', 'p24-q1-a-denominator-arrow', 'p24-q1-a-mean-rounding-cue'], 'mean annotations');
  for (const anchor of annotated.anchors) expected(annotated.latex.slice(anchor.start, anchor.end), anchor.text, anchor.id + ' source range');

  const speechBlock = block('p26-q10-block'), speech = node(speechBlock.content, 'p26-q10-speech-layout');
  const portrait = node(speechBlock.content, 'p26-q10-portrait'), intro = node(speechBlock.content, 'p26-q10-intro');
  expected(intro.inlines, [{type: 'text', text: 'Edward says:'}], 'character introduction');
  expected(portrait.src, '/booklet-assets/projects/data-analysis-v1/73c03bda5cc6-image29.png', 'old portrait');
  expected(portrait.alt, 'Edward', 'old portrait name');
  expected(portrait.width, 18, 'old portrait width');
  expected(portrait.aspectRatio, 1, 'old portrait ratio');
  expected(portrait.crop, undefined, 'old portrait crop');
  expected(portrait.align, undefined, 'old portrait alignment');
  expected(speech.arrangement, 'speech-bubble', 'speech template');
  expected(speech.gap, 5, 'speech gap');
  expected(speechBlock.content.children[0].prompt, 'Explain why he is correct.', 'character pronoun');

  const formula = block('p31-position-formula');
  expected(formula.format, 'tikz', 'position formula format');
  expected(formula.widthMm, 65, 'position formula width');
  expected(formula.code, separateFormula, 'separate formula nodes');
  const section31 = next.sections.find(s => s.blocks.includes(formula));
  expected(section31.blocks[section31.blocks.indexOf(formula) - 1]?.id, 'p31-information-header', 'formula ordering');

  const example = block('p31-example-header');
  expected(example.examples.map(e => e.id), ['p31-example-left', 'p31-example-right'], 'median examples');
  const leftDataset = node(example.examples, 'p31-example-left-dataset'), rightDataset = node(example.examples, 'p31-example-right-dataset');
  expected(leftDataset.marginBefore, 2, 'left dataset leading margin');
  expected(leftDataset.marginAfter, 2, 'left dataset trailing margin');
  assert.ok(rightDataset.marginBefore == null && rightDataset.marginAfter == null, 'Stale expected shape: right dataset margins');
  const leftDemo = node(example.examples, 'p31-example-left-demonstration'), rightDemo = node(example.examples, 'p31-example-right-demonstration');
  expected([leftDemo.padding, leftDemo.margin, leftDemo.gap], [3, 3, 3], 'left demonstration spacing');
  expected([rightDemo.padding, rightDemo.margin, rightDemo.gap], [3, 3, 0], 'right demonstration spacing');
  const explanation = node(example.examples, 'p31-example-right-central-scores');
  expected(explanation.inlines.filter(n => n.type === 'break').length, 1, 'right explanation line break');
  expected(explanation.inlines.at(-1).text, 'score', 'right explanation ending');
  const exampleLayout = next.settings.layoutOverrides.blockLayouts[example.id].arrangement;
  const rightGroup = node(exampleLayout, 'p31-example-right:example');
  expected(rightGroup.gap, 2, 'right example arrangement gap');
  const leftWrapper = node(example.examples, 'p31-example-left-divider-table');
  expected(example.examples[0].prompt.blocks.map(n => n.id), [leftWrapper.id], 'left example wrapper');
  expected(example.examples[1].prompt.blocks.map(n => n.id), [rightDataset.id, rightDemo.id], 'right example direct layout');
  expected(rightGroup.children.map(n => n.ref), ['p31-example-right/label', 'p31-example-right/prompt#p31-example-right-dataset', 'p31-example-right/prompt#p31-example-right-demonstration'], 'right example references');
  const identify = block('p41-identify');
  expected(identify.content.children.map(c => c.id), ['p41-q1', 'p41-q2', 'p41-q3', 'p41-q4', 'p41-q5'], 'six-panel activity');

  const provenance = {id: DATA_ANALYSIS_FEEDBACK_REPAIR, projectId: original.id, baseRevision: original.revision, originalFields: [], pageBoundaries: []};
  function set(blockId, target, field, value) {
    if (JSON.stringify(target[field]) === JSON.stringify(value)) return;
    provenance.originalFields.push({blockId, nodeId: target.id, field, existed: Object.hasOwn(target, field), ...(Object.hasOwn(target, field) ? {value: clone(target[field])} : {})});
    target[field] = value;
  }
  // Preserve the mathematical scaffold and arrows. Only response-blank sizes
  // and their exact source-range anchors compensate the surrounding font change.
  for (const paragraph of scaffoldParagraphs) {
    set(scaffold.id, paragraph, 'fontSize', paragraph.id.endsWith('-hint') ? 9 : 10);
    set(scaffold.id, paragraph, 'spaceBefore', 0);
    set(scaffold.id, paragraph, 'spaceAfter', paragraph.id.endsWith('-hint') ? 0 : 0.3);
    set(scaffold.id, paragraph, 'lineHeight', 1.2);
    if (!paragraph.id.endsWith('-hint')) set(scaffold.id, paragraph, 'inlines', paragraph.inlines.map(inline => inline.type === 'math' ? {...inline, latex: preserveScaffoldBlankSize(inline.latex)} : inline));
  }
  set(scaffold.id, topTable, 'rowHeights', [8, 10]);
  // Compact the non-hint paragraph gaps to 0.3 mm, preserving the response
  // boxes. A trailing gap did not move the following table to a continuation
  // and increased footer overflow, so leave the arrangement spacing untouched.
  set(scaffold.id, annotated, 'fontSize', 10);
  const originalLatex = annotated.latex;
  set(scaffold.id, annotated, 'anchors', annotated.anchors.map(anchor => {
    const start = preserveScaffoldBlankSize(originalLatex.slice(0, anchor.start)).length;
    const text = preserveScaffoldBlankSize(anchor.text);
    return {...anchor, start, end: start + text.length, text};
  }));
  set(scaffold.id, annotated, 'latex', preserveScaffoldBlankSize(originalLatex));
  for (const part of scaffold.content.children.slice(0, 3)) {
    set(scaffold.id, part.prompt.blocks[0], 'spaceAfter', 1.5);
  }

  set(speechBlock.id, intro, 'inlines', [{type: 'text', text: 'Laura says:'}]);
  for (const [field, value] of Object.entries({src: '/booklet-assets/projects/index-laws-complete-v1/a2fc6010263c-image3.png', alt: 'Laura', width: 17, aspectRatio: 0.9969230769230769, crop: [0, 13.894000000000016, 0, 13.104], align: 'center', reviewStatus: 'needs-review', retentionReason: 'Existing Index Laws Laura illustration replaces Edward by explicit feedback. Original Data Analysis portrait and source evidence remain unchanged; editable crop, 17 mm width, proportional height and 5 mm speech-bubble gap follow the shared portrait convention.'})) set(speechBlock.id, portrait, field, value);
  set(speechBlock.id, speechBlock.content.children[0], 'prompt', 'Explain why she is correct.');
  // Answers currently contain no masculine references. Also update any related
  // authored answer wording, while preserving answer provenance and source data.
  for (const part of speechBlock.content.children) for (const field of ['short', 'worked']) {
    const answer = part.answer?.[field];
    if (typeof answer === 'string') set(speechBlock.id, part.answer, field, answer.replace(/\bEdward\b/g, 'Laura').replace(/\bhe\b/g, 'she').replace(/\bHe\b/g, 'She').replace(/\bhis\b/g, 'her').replace(/\bHis\b/g, 'Her'));
  }

  set(formula.id, formula, 'code', medianPositionFormulaCode());
  set(formula.id, formula, 'reviewStatus', 'needs-review');
  for (const field of ['marginBefore', 'marginAfter']) set(example.id, rightDataset, field, leftDataset[field]);
  set(example.id, leftDemo, 'gap', rightDemo.gap);
  set(example.id, rightGroup, 'gap', 0);
  set(example.id, explanation, 'inlines', explanation.inlines.filter(n => n.type !== 'break').map((n, i, all) => i === all.length - 1 ? {...n, text: ' score'} : n));
  // Identical table-cell wrappers give both columns the same margin-collapse
  // and paragraph-spacing context. Only the left wrapper draws the divider.
  const rightWrapper = {...clone(leftWrapper), id: 'p31-example-right-wrapper-table'};
  const rightCell = {...clone(leftWrapper.rows[0][0]), id: 'p31-example-right-wrapper-cell', borders: {top: false, right: false, bottom: false, left: false}, blocks: [rightDataset, rightDemo]};
  rightWrapper.rows = [[rightCell]];
  set(example.id, example.examples[1].prompt, 'blocks', [rightWrapper]);
  set(example.id, rightGroup, 'children', [rightGroup.children[0], {...rightGroup.children[1], ref: `p31-example-right/prompt#${rightWrapper.id}`, title: 'table'}]);
  // Both working equations already use the same explicit 8 pt row spacing and
  // both demonstration paragraph sets use 0/2 mm and lineHeight 1.4. Keep them.
  provenance.descriptions = {
    [scaffold.id]: 'Local scaffold labels are 10 pt and boxed hints (including annotated-equation hints) are 9 pt. Excess paragraph/table spacing is compacted, with 0.3 mm after non-hint scaffold paragraphs to restore footer clearance without a trailing arrangement gap. Response-rule and hspace values compensate the measured 11-to-10 pt KaTeX scaling, including box padding, to preserve physical handwriting dimensions; annotation ranges are updated to the same targets. Datasets, two columns, rounding and arrows are retained.',
    [speechBlock.id]: 'Edward is intentionally replaced by Laura, with her existing Index Laws asset and editable crop. Portrait width is fixed at 17 mm, height is proportional and bubble gap remains 5 mm. Related pronouns use she.',
    [formula.id]: 'Position = (n+1)/2 is one native TeX formula node rather than individually drawn symbols and a manual fraction bar. Width remains 65 mm; black 10 pt labels and the complete annotation are retained. The arrow coordinate targets numerator n and requires final-size inspection.',
    [example.id]: 'Left and right columns use matching table-cell wrappers, dataset margins and demonstration spacing so the first working baselines align. The forced break before score in the right explanation is deliberately removed. The left divider, full datasets, results 15 and 14 and the taught position method are preserved.',
    [identify.id]: 'A manual page boundary is requested after the complete logical six-panel Identify activity through setPageBoundary. Content and compact answer pagination settings remain unchanged.'
  };
  provenance.reviewStatus = 'awaiting-affected-page-verification';
  provenance.historicalSourceReview = 'retained unchanged; not current acceptance of repaired layout';
  const beforeIds = new Set(next.sections.flatMap(s => s.blocks.map(b => b.id)));
  const bounded = setPageBoundary(next, identify.id, 'after');
  for (const section of bounded.sections) for (const b of section.blocks) if (!beforeIds.has(b.id)) provenance.pageBoundaries.push({sectionId: section.id, insertedBlock: clone(b), requestedAfterBlockId: identify.id});
  return {next: bounded, provenance};
}
