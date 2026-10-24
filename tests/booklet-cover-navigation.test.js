import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compile} from 'svelte/compiler';
import {build} from 'esbuild';
import {deriveBookletCover, frontMatterDestinations, unnumberedTopicDestinations} from '../src/lib/booklet-cover.js';
import {fromSource} from '../src/lib/document-content.js';
import {exerciseNumbers, flowEditionSections} from '../src/lib/booklet-flow.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';

const text = (id, content) => ({id, type:'rich-text', content});
const page = (id, pageNumber, section, blocks = []) => ({id, pageNumber, flexible:true, mode:'student', section, blocks});
const coverPage = () => ({...page('cover', 1, {sourceSectionId:'cover', phase:'front-matter', title:'Data Analysis'}, [text('cover-text', '# Data Analysis')]), isCover:true});
const syllabus = (id, pageNumber, sourceSectionId = 'syllabus') => page(id, pageNumber, {sourceSectionId, phase:'front-matter', title:'Syllabus Content', headingStyle:'none'}, [text(`${id}-text`, fromSource('Investigate numerical data.'))]);
const topics = count => Array.from({length:count}, (_, i) => page(`topic-${i + 1}`, i + 4, {sourceSectionId:`topic-${i + 1}`, phase:'teaching', exerciseNumber:i + 1, topicTitle:`Topic ${i + 1}`, title:`Topic ${i + 1}`}, [text(`teaching-${i + 1}`, 'Teaching content.')]));
const pages = () => [coverPage(), syllabus('syllabus-first', 2), syllabus('syllabus-continuation', 3), ...topics(24)];

test('front matter destinations use first visible physical pages and stable section identity', () => {
  const first = syllabus('first', 6);
  const second = syllabus('second', 8, 'syllabus-other');
  const inputs = [
    syllabus('continuation', 7), second, coverPage(),
    page('empty-section', 2, {sourceSectionId:'empty', phase:'front-matter', title:'Imported contents'}),
    page('empty-document', 3, first.section, [text('empty', fromSource(' \n '))]),
    page('hidden', 4, first.section, [{...text('hidden-text', 'Editor evidence'), presentation:{editorOnly:true}}]),
    page('space', 5, first.section, [{id:'space-block', type:'spacer'}, {id:'break', type:'page-break'}]),
    {...syllabus('answer', 1), mode:'worked'}, first,
  ];
  assert.deepEqual(frontMatterDestinations(inputs), [
    {id:'front-matter-syllabus', page:first},
    {id:'front-matter-syllabus-other', page:second},
  ]);
});

test('compact contents retain unnumbered syllabus, all topics, and only included answer sections', () => {
  const student = pages();
  const expected = {title:'Syllabus Content', frontMatter:true, pageNumber:2, href:'#front-matter-syllabus'};
  for (const mode of [null, 'short', 'worked']) {
    const edition = mode ? [...student, {...page(`${mode}-first`, 28, {}), mode, compactAnswers:true}, {...page(`${mode}-next`, 29, {}), mode, compactAnswers:true}] : student;
    const contents = deriveBookletCover(edition).contents;
    assert.deepEqual(contents[0], expected);
    assert.deepEqual(contents.filter(row => row.number != null).map(row => row.number), Array.from({length:24}, (_, i) => i + 1));
    assert.equal(contents.length, mode ? 26 : 25);
    assert.deepEqual(contents.filter(row => row.answerSection), mode ? [{title:mode === 'short' ? 'Short answers' : 'Worked solutions', answerSection:true, pageNumber:28, href:`#answer-section-${mode}`}] : []);
    assert.equal(contents.filter(row => row.frontMatter).length, 1);
  }
});

// Render the actual components, including their nested native rich-text path.
// This checks DOM destinations/layout classes; final-size PDF inspection remains
// a separate acceptance gate.
const built = await build({
  stdin:{contents:"import {render} from 'svelte/server'; import Cover from './src/components/BookletCover.svelte'; import Page from './src/components/TranscribedBookletPage.svelte'; import Compact from './src/components/CompactAnswerPage.svelte'; import Practice from './src/components/PracticeQuestionRenderer.svelte'; export const practice = props => render(Practice,{props}).body; export const cover = props => render(Cover,{props}).body; export const page = props => render(Page,{props}).body; export const compact = props => render(Compact,{props}).body;", resolveDir:process.cwd()},
  bundle:true, platform:'node', format:'esm', write:false,
  plugins:[{name:'cover-components', setup(builder) {
    // Browser-only TikZ startup is outside this diagram-free DOM fixture.
    builder.onLoad({filter:/[/\\]tikz\.js$/}, () => ({contents:'export function renderTikzCode() { throw Error("Unexpected diagram"); } export function cancelTikzJob() {}'}));
    builder.onResolve({filter:/^virtual:booklet-render-version$/}, args => ({path:args.path, namespace:'test-version'}));
    builder.onLoad({filter:/.*/, namespace:'test-version'}, () => ({contents:"export default 'cover-test'; export const diagramVersion = 'cover-test';"}));
    builder.onLoad({filter:/\.svelte$/}, args => ({contents:compile(fs.readFileSync(args.path, 'utf8'), {filename:args.path, generate:'server'}).js.code, resolveDir:path.dirname(args.path)}));
  }}],
});
const rendered = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));

test('standalone teaching diagrams pass explicit alignment to both image and TikZ output',()=>{
 for(const align of ['left','center','right',undefined])for(const format of ['image','tikz']){
  const block={id:'alignment-cue',type:'diagram',format,align,widthMm:25,...(format==='tikz'?{code:'\\begin{tikzpicture}\\end{tikzpicture}'}:{src:'/cue.png'})};
  const p={id:'alignment-page',pageNumber:1,mode:'student',flexible:true,section:{id:'teaching',phase:'teaching'},blocks:[block]};
  const html=rendered.page({page:p,bookletPages:[p],runId:'fixture'});
  if(align)assert.match(html,new RegExp(`data-diagram-id="alignment-cue" data-diagram-align="${align}"`));
  else assert.doesNotMatch(html,/data-diagram-align=/);
 }
});

test('actual student, combined and compact answer components print unnumbered exercise nouns once',()=>{
 for(const label of['Exercise','Exercises','8A']){
  const heading=label==='8A'?'Exercise 8A':label;
  const block={id:'construction',type:'question',sourceOrder:1,content:{id:'construction-root',prompt:'Construct a triangle.',answer:{short:'Sample construction.',worked:'Draw the perpendicular sides.'}},flow:{exerciseHeadingBefore:label,exerciseNumber:label,answerFragment:0}};
  const section={id:'s',sourceSectionId:'s',topicId:'intro',phase:'practice',topicTitle:'Construction',difficultyTitle:heading,exerciseNumber:label};
  for(const mode of['student','short','worked']){
   const p={id:'p',pageNumber:1,mode,flexible:true,section,blocks:[block],showDifficultyHeading:true};
   const text=rendered.page({page:p,bookletPages:[p],runId:'fixture'}).replace(/<[^>]*>/g,'');
   assert.equal(text.split(heading).length-1,1);
   assert.doesNotMatch(text,/Exercise Exercises?\b/);
  }
  const project={id:'fixture',settings:{compactAnswers:{gutterMm:8},layoutOverrides:{blockLayouts:{},diagramColourModes:{}}}},p={pageNumber:1,mode:'short',columns:[[{section,block,labelWidthMm:8,shortRow:0,shortColumns:1}]]};
  const text=rendered.compact({project,page:p,pages:[p]}).replace(/<[^>]*>/g,'');
  assert.equal(text.split(heading+' · Construction').length-1,1);
  assert.doesNotMatch(text,/Exercise Exercises?\b/);
 }
});

test('a consolidated answer retains each nested part destination once in both answer editions', () => {
 const content={id:'q',type:'question',label:'12',prompt:'Compare changes.',answer:{short:'Completed table',worked:'Completed table'},children:[
  {id:'a',type:'part',label:'a',children:[{id:'a-mean',type:'part',label:'i',answer:{short:'increase',worked:'The mean increases.'}}]},
  {id:'b',type:'part',label:'b',answer:{short:'decrease',worked:'The mean decreases.'}}
 ]};
 for(const mode of ['short','worked']){
  const prefix=`print-answer-${mode}-`;
  const html=rendered.practice({question:{id:'block',type:'question',content},number:12,showSpaces:false,showShortAnswers:mode==='short',showWorkedSolutions:mode==='worked',answerAnchorPrefix:prefix});
  for(const id of ['q','a','a-mean','b'])assert.equal(html.split(`id="${prefix}part-${id}"`).length-1,1);
  assert.equal(html.split('Completed table').length-1,1);
  assert.doesNotMatch(html,/The mean increases|The mean decreases/);
 }
});

test('named review exercises use the title column and keep their original destinations', () => {
  const bookletPages=[coverPage(),
    page('2A',2,{exerciseNumber:'2A',topicTitle:'Functions'}),
    page('review-one',3,{exerciseNumber:'Review Set One',topicTitle:'Chapter 2 Review Set One'}),
    page('review-continuation',4,{exerciseNumber:'Review Set One',topicTitle:'Chapter 2 Review Set One'}),
    page('review-two',5,{exerciseNumber:'Review Set Two',topicTitle:'Chapter 2 Review Set Two'}),
    {...page('short',6,{}),mode:'short',compactAnswers:true},
  ];
  assert.deepEqual(deriveBookletCover(bookletPages).contents,[
    {number:'2A',title:'Functions',pageNumber:2,href:'#exercise-topic-2A'},
    {namedExercise:true,title:'Chapter 2 Review Set One',pageNumber:3,href:'#exercise-topic-Review Set One'},
    {namedExercise:true,title:'Chapter 2 Review Set Two',pageNumber:5,href:'#exercise-topic-Review Set Two'},
    {answerSection:true,title:'Short answers',pageNumber:6,href:'#answer-section-short'},
  ]);
  for(const anchorPrefix of ['screen-','print-']){
    const html=rendered.cover({pages:bookletPages,anchorPrefix});
    assert.equal((html.match(/class="contents-row\b/g)??[]).length,4);
    assert.equal((html.match(/class="contents-number[^>]*><\/span>/g)??[]).length,3);
    assert.doesNotMatch(html,/class="leader\b|>Review Set (One|Two)</);
    for(const name of ['One','Two']){
      assert.equal((html.match(new RegExp(`Chapter 2 Review Set ${name}`,'g'))??[]).length,1);
      assert.match(html,new RegExp(`href="#${anchorPrefix}exercise-topic-Review Set ${name}"`));
    }
  }
});

test('compact Challenge contents omit Exercise without changing source headings or links', () => {
  for (const section of [
    {exerciseNumber:3,topicTitle:'Challenge Exercise'},
    {exerciseNumber:'Challenge Exercise',topicTitle:'Challenge Exercise'},
    {unnumberedTopic:true,topicId:'challenge',topicTitle:'Challenge Exercise'},
  ]) {
    const challenge=page('challenge',2,{...section,title:'Challenge Exercise'},[text('challenge-text','Challenge questions.')]);
    const before=structuredClone(challenge);
    const bookletPages=[coverPage(),challenge];
    const row=deriveBookletCover(bookletPages).contents[0];
    assert.equal(row.title,'Challenge');
    assert.equal(row.href,section.unnumberedTopic?'#teaching-topic-challenge':`#exercise-topic-${section.exerciseNumber}`);
    for(const anchorPrefix of ['screen-','print-']) {
      const html=rendered.cover({pages:bookletPages,anchorPrefix});
      assert.match(html,/>Challenge</);
      assert.ok(html.includes(`href="#${anchorPrefix}${row.href.slice(1)}"`));
    }
    assert.deepEqual(challenge,before);
  }
});

test('practice-only topic numbering survives normalization and preserves unnumbered teaching navigation', () => {
  const raw={id:'practice-numbering',title:'Mixed topics',settings:{exerciseOrganisation:'topic',numberPracticeTopicsOnly:true,paginationMode:'flexible'},topics:[{id:'intro',title:'Introduction'},{id:'mean',title:'Mean'},{id:'overview',title:'Overview'},{id:'median',title:'Median'}],sections:[
    {id:'intro',topicId:'intro',phase:'teaching',blocks:[text('intro-text','Introduction')]},
    {id:'mean-teaching',topicId:'mean',phase:'teaching',blocks:[text('mean-text','Mean')]},
    {id:'mean-practice',topicId:'mean',phase:'practice',blocks:[{id:'mean-q',type:'question',content:{id:'mean-root',prompt:'Find the mean.'}}]},
    {id:'overview',topicId:'overview',phase:'teaching',blocks:[text('overview-text','Overview')]},
    {id:'median-practice',topicId:'median',phase:'practice',blocks:[{id:'median-q',type:'question',content:{id:'median-root',prompt:'Find the median.'}}]},
  ]};
  const project=normalizeEditableProject(raw);
  assert.equal(project.settings.numberPracticeTopicsOnly,true);
  assert.deepEqual(exerciseNumbers(project),{mean:1,median:2});
  assert.deepEqual(exerciseNumbers({...project,settings:{...project.settings,numberPracticeTopicsOnly:false}}),{intro:1,mean:2,overview:3,median:4});
  const sections=flowEditionSections(project,'student'),bookletPages=[coverPage(),...sections.map((s,i)=>page(s.id,i+2,s,s.blocks))];
  const contents=deriveBookletCover(bookletPages).contents;
  assert.deepEqual(contents.map(c=>[c.number??null,c.title,c.href]),[[null,'Introduction','#teaching-topic-intro'],[1,'Mean','#exercise-topic-1'],[null,'Overview','#teaching-topic-overview'],[2,'Median','#exercise-topic-2']]);
  assert.deepEqual(contents.filter(c=>c.unnumberedTopic).map(c=>c.title),['Introduction','Overview']);
  const coverHtml=rendered.cover({pages:bookletPages,settings:raw.settings});
  assert.doesNotMatch(coverHtml,/class="leader\b/);
  assert.equal((coverHtml.match(/contents-number/g)??[]).length,4);
  const intro=bookletPages[1];
  const repeated={...intro,id:'intro-continuation',pageNumber:7};
  assert.equal(unnumberedTopicDestinations([...bookletPages,repeated]).filter(d=>d.id==='teaching-topic-intro').length,1);
  for(const anchorPrefix of ['screen-','print-'])assert.match(rendered.page({page:intro,bookletPages,anchorPrefix,zoom:1}),new RegExp(`id="${anchorPrefix}teaching-topic-intro"`));
});

test('cover syllabus link has one actual first-page anchor in screen and print DOM', () => {
  const bookletPages = pages();
  for (const anchorPrefix of ['screen-', 'print-']) {
    const cover = rendered.cover({pages:bookletPages, anchorPrefix});
    assert.match(cover, new RegExp(`href="#${anchorPrefix}front-matter-syllabus"`));
    const bodies = bookletPages.slice(1, 3).map(page => rendered.page({page, bookletPages, anchorPrefix, zoom:1})).join('');
    assert.equal((bodies.match(new RegExp(`id="${anchorPrefix}front-matter-syllabus"`, 'g')) ?? []).length, 1);
    assert.match(bodies, new RegExp(`<article[^>]*id="${anchorPrefix}front-matter-syllabus"[^>]*data-page-number="2"`));
    assert.doesNotMatch(cover, /class="leader\b|>Exercise\s/);
    assert.match(cover, /class="contents-number[^>]*><\/span>/);
  }
});

test('long compact covers select the reviewed gap only above twenty rows', () => {
  for (const count of [19, 20, 24, 25]) {
    const bookletPages = [coverPage(), syllabus('syllabus-first', 2), ...topics(count)];
    const html = rendered.cover({pages:bookletPages});
    assert.equal(/class="contents-list[^\"]*\blong-compact\b/.test(html), count + 1 > 20);
    assert.equal((html.match(/class="contents-row\b/g) ?? []).length, count + 1);
  }
  const source = fs.readFileSync('src/components/BookletCover.svelte', 'utf8');
  const css = compile(source, {filename:'BookletCover.svelte', generate:'server'}).css.code;
  assert.match(css, /\.contents-list[^{}]*\{[^}]*gap:3\.1mm/);
  assert.match(css, /\.contents-list\.long-compact[^{}]*\{[^}]*gap:1\.5mm/);
  assert.match(css, /\.contents-row\.numbered[^{}]*\{[^}]*font-size:10pt/);
});

for(const kind of ['front-matter','teaching-topic'])test(`screen ${kind} links reveal an unmounted first destination before scrolling`, async () => {
  const source = fs.readFileSync('src/components/FlowBookletPreview.svelte', 'utf8');
  const handler = source.slice(source.indexOf('  async function followReference('), source.indexOf('  export async function waitUntilReady('));
  const bookletPages = [coverPage(), ...topics(9), syllabus('first', 20), syllabus('continuation', 21)];
  if(kind==='teaching-topic')for(const p of bookletPages.slice(-2))p.section={...p.section,phase:'teaching',topicId:'syllabus',unnumberedTopic:true};
  const result = {pages:bookletPages};
  const anchorId = `screen-${kind}-syllabus`;
  const destination = {id:anchorId};
  let ticked = false, scrolled = null, prevented = false, stopped = false;
  const root = {querySelector(selector) {
    assert.equal(ticked, true, 'The hidden page must mount before lookup');
    assert.equal(selector, '[data-flow-index="10"]');
    return {querySelector(selector) {assert.equal(selector, `[id="${anchorId}"]`); return destination;}};
  }};
  const event = {target:{closest:() => ({getAttribute:() => '#' + anchorId})}, preventDefault:() => {prevented = true;}, stopPropagation:() => {stopped = true;}};
  const run = new Function('result', 'frontMatterDestinations', 'unnumberedTopicDestinations', 'tick', 'root', 'scrollToElement', 'CSS', 'event', `let visible = new Set([0]); ${handler}; return followReference(event).then(() => visible);`);
  const visible = await run(result, frontMatterDestinations, unnumberedTopicDestinations, async () => {ticked = true;}, root, element => {scrolled = element;}, {escape:id => id}, event);
  assert.deepEqual([...visible], [0, 10]);
  assert.equal(scrolled, destination);
  assert.equal(prevented && stopped, true);
});
