import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compile } from 'svelte/compiler';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { buildTheoryDraft, createTheoryEditorDraft, getWorkedExamples, workedExampleEntries, workedExampleProblems, theoryTextFields, theoryFieldAccessor, moveWorkedExample } from '../src/lib/theory-content.js';
import { visitTextFields } from '../scripts/lib/content-fields.mjs';
import { collectBlocks } from '../scripts/lib/tikz-blocks.mjs';
import { fieldAccessor, replaceTikzBlock } from '../scripts/diagram-audit/lib/audit-lib.mjs';
import { validateInlineText } from '../scripts/lib/lint-math.mjs';

const example = (n, extra = {}) => ({ question_text: `Question ${n}: find $x$.`, solution_text: `$x=${n}$\nResult ${n}.`, ...extra });
const theory = () => ({ intro: 'Introduction', facts: ['A key fact.'], steps: ['Method stage'], workedExamples: [example(1), example(2)] });
const figure = n => `[tikz]\\begin{tikzpicture}\\draw (0,0)--(${n},1);\\end{tikzpicture}[/tikz]`;

test('normalized reads preserve order and source identity, and reject ambiguous or incomplete schema', () => {
  const singular = { workedExample: example(1) };
  assert.equal(getWorkedExamples(singular)[0], singular.workedExample);
  assert.deepEqual(workedExampleEntries(singular).map(e => e.where), ['workedExample']);
  const plural = theory();
  assert.deepEqual(getWorkedExamples(plural), plural.workedExamples);
  assert.deepEqual(workedExampleProblems(plural), []);
  assert.deepEqual(workedExampleProblems({}), []);
  assert.deepEqual(getWorkedExamples({}), []);
  for (const malformed of [[], null, {}, 'example']) assert.match(workedExampleProblems({ workedExamples: malformed }).join('\n'), /nonempty array/);
  assert.match(workedExampleProblems({ workedExamples: [null] }).join('\n'), /\[0\] must be an object/);
  assert.match(workedExampleProblems({ workedExamples: [{ question_text: ' ', solution_text: 3 }] }).join('\n'), /question_text is missing or empty[\s\S]*solution_text is missing or empty/);
  const both = { ...singular, workedExamples: [example(2)] };
  assert.match(workedExampleProblems(both).join('\n'), /both workedExample and workedExamples/);
  assert.equal(getWorkedExamples(both).length, 2, 'corrupt dual input must not silently hide an example');
  assert.deepEqual(workedExampleProblems({ workedExamples: [example(1, { equationAlignment: { mode: 'continuation' } })] }), []);
  assert.deepEqual(workedExampleProblems({ workedExamples: [example(1, { equationAlignment: { mode: 'relation', align: 'right' } })] }), []);
  for (const alignment of [null, {}, { mode: 'random' }, { mode: 'continuation', align: 'random' }, { mode: 'continuation', unsupported: true }]) {
    assert.match(workedExampleProblems({ workedExamples: [example(1, { equationAlignment: alignment })] }).join(), /equationAlignment/);
  }
});

test('editor drafts normalize legacy examples, retain extensions and survive reorder/save/reopen/removal', () => {
  const original = { intro: 'Original', facts: ['Rule'], extension: { keep: true }, workedExample: example(1, { source: { page: 9 } }) };
  const draft = createTheoryEditorDraft(original);
  draft.workedExamples[0].question_text = 'Edited task';
  draft.workedExamples[0].source.page = 10;
  draft.workedExamples.push(example(2, { context: 'second' }));
  draft.workedExamples = moveWorkedExample(draft.workedExamples, 1, 0);
  const saved = buildTheoryDraft(original, draft);
  assert.ok(!Object.hasOwn(saved, 'workedExample'));
  assert.deepEqual(saved.workedExamples.map(e => e.question_text), [example(2).question_text, 'Edited task']);
  assert.equal(saved.workedExamples[1].source.page, 10);
  assert.deepEqual(saved.extension, original.extension);
  assert.equal(original.workedExample.source.page, 9);
  assert.equal(original.workedExample.question_text, example(1).question_text);
  const reopened = createTheoryEditorDraft(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(reopened.workedExamples, saved.workedExamples);
  reopened.workedExamples = [];
  const cleared = buildTheoryDraft(saved, reopened);
  assert.ok(!Object.hasOwn(cleared, 'workedExample') && !Object.hasOwn(cleared, 'workedExamples'));
  assert.deepEqual(workedExampleProblems(cleared), []);
  assert.deepEqual(moveWorkedExample(draft.workedExamples, 0, -1), draft.workedExamples);
});

async function bundle(contents, generate, stubs = {}) {
  const result = await build({
    stdin: { contents, resolveDir: process.cwd() }, bundle: true, write: false,
    platform: generate === 'server' ? 'node' : 'browser', format: generate === 'server' ? 'esm' : 'iife',
    conditions: generate === 'server' ? [] : ['browser'],
    plugins: [{ name: 'worked-examples', setup(builder) {
      builder.onLoad({ filter: /[/\\]tikz\.js$/ }, () => ({ contents: stubs['tikz.js'] ?? 'export function renderTikzCode(el) { el.innerHTML="<svg></svg>"; } export function cancelTikzJob() {}' }));
      for (const [file, code] of Object.entries(stubs)) {
        builder.onLoad({ filter: new RegExp(`[/\\\\]${file.replaceAll('.', '\\.')}$`) }, () => ({ contents: code }));
      }
      builder.onLoad({ filter: /\.svelte$/ }, args => ({ contents: compile(fs.readFileSync(args.path, 'utf8'), { filename: args.path, generate, css: 'injected' }).js.code, resolveDir: path.dirname(args.path) }));
    } }],
  });
  return result.outputFiles[0].text;
}

test('SSR shows each full solution after the method, numbers a set and preserves singular/no-example views', async () => {
  const code = await bundle("import {render} from 'svelte/server'; import Theory from './src/components/TheoryView.svelte'; export const view=theory=>render(Theory,{props:{theory}}).body;", 'server');
  const { view } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  const html = view(theory());
  assert.ok(html.indexOf('Method stage') < html.indexOf('Worked example 1'));
  assert.ok(html.indexOf('Worked example 1') < html.indexOf('Worked example 2'));
  assert.match(html, /Result 1/);
  assert.match(html, /Result 2/);
  assert.equal((html.match(/class="example-solution/g) || []).length, 2);
  assert.match(html, /katex/);
  const legacy = view({ intro: 'Legacy', workedExample: example(3) });
  assert.match(legacy, /Worked example/);
  assert.doesNotMatch(legacy, /Worked example 1/);
  assert.match(legacy, /Result 3/);
  assert.doesNotMatch(view({ intro: 'No examples' }), /class="worked-example/);
});

test('rendered example colours cover prose and maths, retain diagram ink and support the shared continuation gutter', async () => {
  const code = await bundle("import {mount} from 'svelte'; import Theory from './src/components/TheoryView.svelte'; window.showTheory=theory=>mount(Theory,{target:document.body,props:{theory}});", 'client', {
    'tikz.js': 'export function renderTikzCode(el) { el.innerHTML=\'<svg><path stroke="#ff6600" d="M0 0L1 1"/><text>Given</text></svg>\'; } export function cancelTikzJob() {}',
  });
  let browser;
  try { browser = await chromium.launch({ headless: true }); } catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
  try {
    const page = await browser.newPage();
    await page.setContent('<html><body></body></html>');
    await page.addScriptTag({ content: code });
    await page.evaluate(t => window.showTheory(t), { intro: '', workedExamples: [
      { question_text: '$8+3$', solution_text: '$=11$', equationAlignment: { mode: 'continuation' } },
      { question_text: 'Find the length. $\\color{red}x$', solution_text: `Add the lengths. $\\color{red}x=11$\n${figure(1)}` },
      { question_text: 'Calculate.', solution_text: '$\\mathrel{\\phantom{=}}8+3$\n$=11$' },
      { question_text: 'Calculate.', solution_text: '$$\\begin{aligned}&\\mathrel{\\phantom{=}}8+3\\\\&=11\\end{aligned}$$' },
      { question_text: '| $t$ | $0$ | $1$ |\n|---|---|---|\n| $v$ | $2$ | $3$ |', solution_text: '| Quantity | Value |\n|---|---|\n| Total | $5$ |' },
      { question_text: 'Find the depreciation multiplier.', solution_text: '$1-r=\\dfrac{28900}{34000}$' },
      { question_text: 'Inspect the long calculation.', solution_text: '$\\begin{align*}x&=12345678901234567890123456789012345678901234567890\\\\&=1\\end{align*}$' },
    ] });
    const colour = selector => page.locator(selector).first().evaluate(el => getComputedStyle(el).color);
    assert.equal(await colour('.example-question .text-line'), 'rgb(0, 0, 0)');
    assert.equal(await colour('.example-solution .text-line'), 'rgb(38, 140, 255)');
    assert.equal(await colour('.example-solution .katex .mord'), 'rgb(38, 140, 255)');
    assert.equal(await colour('.example-question .katex .mord'), 'rgb(0, 0, 0)');
    assert.match(await page.locator('.worked-example').first().innerHTML(), /phantom/);
    await page.locator('.inline-tikz svg').waitFor();
    assert.equal(await colour('.inline-tikz svg text'), 'rgb(0, 0, 0)');
    assert.equal(await page.locator('.inline-tikz svg path').getAttribute('stroke'), '#ff6600');
    assert.doesNotMatch(await page.locator('.example-question').nth(1).innerText(), /Add the lengths/);
    assert.equal(await page.locator('.example-question .text-table table').count(),1);
    assert.deepEqual(await page.locator('.example-question .text-table tr').evaluateAll(rows=>rows.map(row=>[...row.cells].map(cell=>(cell.querySelector('.katex-html')||cell).textContent.trim()))),[['t','0','1'],['v','2','3']]);
    assert.equal(await colour('.example-question .text-table p'),'rgb(0, 0, 0)');
    assert.equal(await colour('.example-solution .text-table p'),'rgb(38, 140, 255)');
    assert.equal(await colour('.example-solution .text-table .katex .mord'),'rgb(38, 140, 255)');
    const compactTable = await page.locator('.example-solution .text-table').evaluate(el=>({table:el.querySelector('table').getBoundingClientRect().width,available:el.clientWidth}));
    assert.ok(compactTable.table < compactTable.available * .8, 'small tables must not stretch across the example');
    const labelWidths = await page.locator('.text-table table').evaluateAll(tables=>tables.map(table=>table.rows[0].cells[0].getBoundingClientRect().width));
    assert.ok(labelWidths[0] < labelWidths[1], 'a variable label stays narrower than a worded label');
    const phantoms = page.locator('.worked-example span[style*="transparent"]');
    assert.ok(await phantoms.count() >= 3, 'shared and both authored gutter formats render invisible relation signs');
    for (const phantom of await phantoms.all()) {
      assert.equal(await phantom.evaluate(el => getComputedStyle(el).color), 'rgba(0, 0, 0, 0)');
    }
    for (const dark of [false, true]) {
      await page.evaluate(dark => { document.documentElement.style.setProperty('--surface-soft', dark ? '#161b25' : '#f2f5fa'); document.documentElement.style.color = dark ? '#ffffff' : '#000000'; }, dark);
      assert.equal(await colour('.worked-example'), 'rgb(0, 0, 0)');
      assert.equal(await page.locator('.worked-example').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
      assert.equal(await colour('.example-question .text-line'), 'rgb(0, 0, 0)');
      assert.equal(await colour('.example-solution .text-line'), 'rgb(38, 140, 255)');
    }
    await page.addStyleTag({content:fs.readFileSync('node_modules/katex/dist/katex.min.css','utf8')});
    if(process.env.MATHSMAP_EXAMPLE_SCREENSHOT) await page.locator('.worked-example').nth(4).screenshot({path:process.env.MATHSMAP_EXAMPLE_SCREENSHOT});
    await page.setViewportSize({width:300,height:800});
    const fractionInk=await page.locator('.example-solution .mfrac').first().evaluate(el=>{
      const box=el.closest('.text-line').getBoundingClientRect(),math=el.closest('.katex');
      const leaves=[...el.querySelectorAll('span')].filter(node=>!node.childElementCount&&/\d/.test(node.textContent));
      const ink=leaves.map(node=>({text:node.textContent,top:node.getBoundingClientRect().top,bottom:node.getBoundingClientRect().bottom}));
      return {padding:parseFloat(getComputedStyle(math).paddingTop),inside:ink.every(r=>r.top>=box.top-0.5&&r.bottom<=box.bottom+0.5),box:{top:box.top,bottom:box.bottom},ink};
    });
    assert.ok(fractionInk.padding>0,'fraction ink must have vertical clearance inside its scroll container');
    assert.equal(fractionInk.inside,true,'fraction text ink must remain inside the visible row: '+JSON.stringify(fractionInk));
    assert.equal(await page.locator('.worked-example').first().locator('.katex').first().evaluate(el=>parseFloat(getComputedStyle(el).paddingTop)),0,'non-fraction working keeps its existing spacing');
    await page.waitForFunction(()=>document.querySelector('.worked-example:last-child .example-solution .text-line').classList.contains('horizontal-overflow'));
    const fittingRows = await page.locator('.worked-example').first().locator('.text-line').evaluateAll(rows=>rows.map(el=>({x:getComputedStyle(el).overflowX,y:getComputedStyle(el).overflowY})));
    assert.ok(fittingRows.every(row=>row.x==='visible'&&row.y==='visible'),'fitting working has no scroll viewport');
    const scrolling = await page.locator('.worked-example').last().locator('.example-solution .text-line').evaluate(el=>{
      const size=getComputedStyle(el.querySelector('.katex')).fontSize;
      el.scrollLeft=el.scrollWidth;
      return {contained:el.closest('.worked-example').scrollWidth<=el.closest('.worked-example').clientWidth+2,wide:el.scrollWidth>el.clientWidth,end:Math.abs(el.scrollLeft-(el.scrollWidth-el.clientWidth))<2,fontSize:size};
    });
    assert.equal(scrolling.contained,true);
    assert.equal(scrolling.wide,true);
    assert.equal(scrolling.end,true);
    assert.notEqual(scrolling.fontSize,'0px');
    const diagram=page.locator('.inline-tikz').first();
    await diagram.locator('.tikz-wrap').evaluate(el=>{el.style.width='100%';el.style.boxSizing='content-box';el.style.paddingLeft='100px';el.style.paddingRight='100px';});
    const visibleDiagram=await diagram.evaluate(el=>{const svg=el.querySelector('svg'),r=svg.getBoundingClientRect();el.scrollLeft=el.scrollWidth;return{width:r.width,height:r.height,shrink:getComputedStyle(el.querySelector('.tikz-wrap')).flexShrink,reachedEnd:Math.abs(el.scrollLeft-(el.scrollWidth-el.clientWidth))<2};});
    assert.ok(visibleDiagram.width>0&&visibleDiagram.height>0,'reserved label padding must never collapse the drawing');
    assert.equal(visibleDiagram.shrink,'0');assert.equal(visibleDiagram.reachedEnd,true);
  } finally { await browser.close(); }
});

test('text audits, figure collection and editable field accessors round-trip every example and nested block index', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mathsmap-example-set-'));
  try {
    fs.mkdirSync(path.join(dir, 'content'));
    fs.mkdirSync(path.join(dir, 'quizzes'));
    const doc = { theory: { intro: figure(1), facts: [figure(2)], steps: [figure(3)], workedExamples: [
      { question_text: `First\n${figure(4)}`, solution_text: figure(5) },
      { question_text: `${figure(6)}\n${figure(7)}`, solution_text: figure(8) },
    ] }, practice: { foundation: [{ question_text: figure(9), solution_text: figure(10) }] } };
    const quiz = { questions: [{ id: 'q1', question_text: figure(11), solution_text: figure(12) }] };
    fs.writeFileSync(path.join(dir, 'content', 'set.json'), JSON.stringify(doc));
    fs.writeFileSync(path.join(dir, 'quizzes', 'set.json'), JSON.stringify(quiz));
    const blocks = collectBlocks(dir);
    assert.equal(blocks.length, 12);
    assert.deepEqual(blocks.filter(b => b.where.includes('workedExamples')).map(b => [b.where, b.blockIndex]), [
      ['theory.workedExamples[0].question_text', 0], ['theory.workedExamples[0].solution_text', 0],
      ['theory.workedExamples[1].question_text', 0], ['theory.workedExamples[1].question_text', 1],
      ['theory.workedExamples[1].solution_text', 0],
    ]);
    for (const block of blocks) {
      const target = block.file.startsWith('quizzes') ? quiz : doc;
      const access = fieldAccessor(target, block.where);
      access.set(replaceTikzBlock(access.get(), block.blockIndex, block.body + '\n% repaired'));
    }
    assert.equal((doc.theory.workedExamples[1].question_text.match(/% repaired/g) || []).length, 2);
    const fields = [];
    visitTextFields(doc, 'content', field => { fields.push(field.where + '.' + field.key); field.obj[field.key] += '\nEdited'; });
    assert.deepEqual(fields.slice(0, 4), ['theory.workedExamples[0].question_text', 'theory.workedExamples[0].solution_text', 'theory.workedExamples[1].question_text', 'theory.workedExamples[1].solution_text']);
    assert.equal(theoryTextFields(doc.theory).length, 7);
    assert.match(theoryFieldAccessor(doc.theory, 'workedExamples[1].question_text').get(), /Edited$/);
    assert.throws(() => theoryFieldAccessor(doc.theory, 'workedExamples[1].question_text[1]'), /no theory field/);
    assert.throws(() => fieldAccessor(doc, 'theory.workedExamples[8].solution_text'), /no theory field/);
    const errors = [];
    doc.theory.workedExamples[1].solution_text = '$x=\\frac{1}{2}$\tfrac';
    visitTextFields(doc, 'content', ({ obj, key, where }) => validateInlineText(obj[key], where + '.' + key, errors));
    assert.match(errors.join('\n'), /workedExamples\[1\].solution_text.*raw TAB/);
    const legacy = { theory: { workedExample: example(1, { question_text: figure(2) }) } };
    fieldAccessor(legacy, 'theory.workedExample.question_text').set('Legacy repaired');
    assert.equal(legacy.theory.workedExample.question_text, 'Legacy repaired');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('live editor add/remove/up/down/preview/save/reopen keeps ordered solutions and extensions', async () => {
  const code = await bundle("import {mount,unmount} from 'svelte'; import Editor from './src/admin/TheoryEditor.svelte'; let app; window.openEditor=async theory=>{if(app)await unmount(app); app=mount(Editor,{target:document.body,props:{theory,onSave:async value=>{window.saved=JSON.parse(JSON.stringify(value));}}});};", 'client');
  let browser;
  try { browser = await chromium.launch({ headless: true }); } catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
  try {
    const page = await browser.newPage();
    await page.setContent('<html><body></body></html>');
    await page.addScriptTag({ content: code });
    const initial = { intro: 'Start', facts: [], workedExample: example(1, { source: { page: 2 } }), extension: 'keep' };
    await page.evaluate(t => window.openEditor(t), initial);
    await page.getByRole('textbox', { name: 'Worked example 1 question', exact: true }).fill('Changed first question');
    await page.getByRole('button', { name: '+ add example', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByText('Complete each worked example question and solution, or remove the example.', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.saved), undefined);
    await page.getByRole('textbox', { name: 'Worked example 2 question', exact: true }).fill('Second task');
    await page.getByRole('textbox', { name: 'Worked example 2 solution', exact: true }).fill('Second working\n$x=2$');
    await page.getByRole('button', { name: 'Move worked example 2 up', exact: true }).click();
    assert.equal(await page.getByRole('textbox', { name: 'Worked example 1 question', exact: true }).inputValue(), 'Second task');
    await page.getByRole('button', { name: 'Move worked example 1 down', exact: true }).click();
    assert.equal(await page.locator('.ed-preview .example-solution').count(), 2);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForFunction(() => !!window.saved);
    const saved = await page.evaluate(() => window.saved);
    assert.ok(!Object.hasOwn(saved, 'workedExample'));
    assert.equal(saved.workedExamples[0].source.page, 2);
    assert.equal(saved.extension, 'keep');
    await page.evaluate(t => window.openEditor(t), saved);
    assert.equal(await page.getByRole('textbox', { name: 'Worked example 2 solution', exact: true }).inputValue(), 'Second working\n$x=2$');
    await page.getByRole('button', { name: 'Remove worked example 2', exact: true }).click();
    await page.getByRole('button', { name: 'Remove worked example 1', exact: true }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForFunction(() => !('workedExamples' in window.saved));
    assert.ok(!Object.hasOwn(await page.evaluate(() => window.saved), 'workedExample'));
  } finally { await browser.close(); }
});

test('diagram harness edits the second block of the second example using the captured revision, and retains a rejected draft', async () => {
  const stubs = {
    'data.js': "export const skills=[{id:'example-set',title:'Examples'}]; export const skillById=new Map(skills.map(s=>[s.id,s])); export const skillsForTopic=()=>[];",
    'content.js': 'export const loadSkillContent=async()=>structuredClone(window.fixture.content); export function setContentCache() {}',
    'quiz.js': 'export const loadSkillQuiz=async()=>structuredClone(window.fixture.quiz); export function setQuizCache() {}',
    'admin.svelte.js': `export const loadAdminSnapshot=async()=>{window.snapshotReads++;return structuredClone(window.fixture);};
      export const saveContent=async(id,content,expected)=>{if(window.rejectSave)throw new Error('Revision conflict'); window.writes.push({id,content,expected}); return {expected:{content:'next',quiz:'quiz-old'}};};
      export const saveQuiz=async()=>{throw new Error('Unexpected quiz write');};`,
  };
  const code = await bundle("import {mount} from 'svelte'; import Harness from './src/views/TikzCheck.svelte'; window.openHarness=()=>mount(Harness,{target:document.body,props:{ids:'example-set'}});", 'client', stubs);
  let browser;
  try { browser = await chromium.launch({ headless: true }); } catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
  try {
    const page = await browser.newPage();
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    await page.setContent('<html><body></body></html>');
    const fixture = { content: { theory: { intro: '', facts: [], workedExamples: [example(1, { question_text: figure(1) }), example(2, { question_text: `${figure(2)}\n${figure(3)}`, source: 'keep' })] } }, quiz: null, expected: { content: 'content-old', quiz: 'quiz-old' } };
    await page.evaluate(value => { window.fixture = value; window.snapshotReads = 0; window.writes = []; }, fixture);
    await page.addScriptTag({ content: code });
    await page.evaluate(() => window.openHarness());
    await page.waitForFunction(() => window.__tikzCheckDone === true);
    assert.equal(await page.locator('.card').count(), 3);
    const card = page.locator('.card').nth(2);
    assert.match(await card.locator('.field').innerText(), /workedExamples\[1\].question_text\[1\]/);
    await card.getByRole('button', { name: 'edit', exact: true }).click();
    const replacement = '\\begin{tikzpicture}\\draw (0,0)--(8,1);\\end{tikzpicture}';
    await card.locator('textarea').fill(replacement);
    await page.evaluate(() => { window.rejectSave = true; });
    await card.getByRole('button', { name: 'Save', exact: true }).click();
    await card.getByText('Revision conflict', { exact: true }).waitFor();
    assert.equal(await card.locator('textarea').inputValue(), replacement);
    assert.equal(await page.evaluate(() => window.writes.length), 0);
    await page.evaluate(() => { window.rejectSave = false; });
    await card.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForFunction(() => window.writes.length === 1);
    const [write] = await page.evaluate(() => window.writes);
    assert.deepEqual(write.expected, fixture.expected);
    assert.equal(write.content.theory.workedExamples[0].question_text, figure(1));
    assert.equal(write.content.theory.workedExamples[1].source, 'keep');
    assert.equal(write.content.theory.workedExamples[1].question_text, `${figure(2)}\n[tikz]${replacement}[/tikz]`);
    assert.equal(await page.evaluate(() => window.snapshotReads), 1, 'save must use the gathered baseline rather than refetching it');
    // A subsequent edit in that field must preserve the first repair and advance the baseline.
    const firstBlock = page.locator('.card').nth(1);
    await firstBlock.getByRole('button', { name: 'edit', exact: true }).click();
    await firstBlock.locator('textarea').fill(replacement + '\n% second repair');
    await firstBlock.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForFunction(() => window.writes.length === 2);
    const secondWrite = await page.evaluate(() => window.writes[1]);
    assert.deepEqual(secondWrite.expected, { content: 'next', quiz: 'quiz-old' });
    assert.match(secondWrite.content.theory.workedExamples[1].question_text, /% second repair/);
    assert.match(secondWrite.content.theory.workedExamples[1].question_text, /\(8,1\)/);
    assert.deepEqual(failures, []);
  } finally { await browser.close(); }
});
