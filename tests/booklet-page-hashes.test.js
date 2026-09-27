import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {affectedPages,renderedPageHashes} from '../scripts/booklet/page-review.mjs';
import {normaliseSvgPaintScopes} from '../src/lib/svg-paint-scope.js';

const first='2b195a1a-c780-4f7e-8be3-0a67e7c970b5',second='98f85424-0f4a-43d1-ad54-470694ae2842';
const options={renderer:'same',settings:{font:9,flowEdition:'short'},assets:{figure:'hash'}};
const host=(id=first)=>`<span class="editable-booklet-text answer" data-host-id="${id}" data-edit-root="q1" data-edit-path="/answer/short" data-fragment-start="0" data-fragment-end="2"><p>Find x.</p><math><mi>x</mi><mo>=</mo><mn>2</mn></math><a id="answer-1" href="#question-1">Question 1</a><svg viewBox="0 0 100 100"><path d="M 0 0 L 10 20" style="stroke: #000000;"></path></svg></span>`;
const hashes=(html,dependencies=options)=>renderedPageHashes([{html,blocks:['q1']}],dependencies);

test('page hashes ignore fresh editor host UUIDs without mutating captured HTML',()=>{
 const pages=[{html:host()+host(second),blocks:['q1']}],before=structuredClone(pages);
 assert.deepEqual(renderedPageHashes(pages,options),hashes(host(second)+host(first)));
 assert.deepEqual(pages,before);
 for(const quote of ['"',"'",'']){
  const markup=id=>`<span data-host-id = ${quote}${id}${quote} class = "answer editable-booklet-text">same</span>`;
  assert.deepEqual(hashes(markup(first)),hashes(markup(second)));
 }
});

test('page hashes retain prompt, maths, style, links, geometry and editable field identity',()=>{
 const original=host(),baseline=hashes(original);
 const changes=[
  ['prompt','Find x.','Find y.'],['maths','<mn>2</mn>','<mn>3</mn>'],
  ['style','stroke: #000000','stroke: #268cff'],['geometry','L 10 20','L 10 21'],
  ['diagram dimensions','0 0 100 100','0 0 100 101'],
  ['link','#question-1','#question-2'],['anchor','id="answer-1"','id="answer-2"'],
  ['editable root','data-edit-root="q1"','data-edit-root="q2"'],
  ['editable field','/answer/short','/answer/worked'],['fragment','data-fragment-end="2"','data-fragment-end="3"'],
  ['class','answer"','answer changed"'],['host presence',` data-host-id="${first}"`,''],
 ];
 for(const [name,from,to] of changes){
  assert.ok(original.includes(from),name);
  assert.notDeepEqual(hashes(original.replace(from,to)),baseline,name);
 }
 for(const dependencies of [{...options,renderer:'changed'},{...options,settings:{...options.settings,font:10}},{...options,assets:{figure:'changed'}}])assert.notDeepEqual(hashes(original,dependencies),baseline);
});

test('attribute-like prose, other attributes, comments and raw text remain hash inputs',()=>{
 const literals=[
  id=>`<p>Use data-host-id="${id}".</p>`,
  id=>`<p>&lt;span class="editable-booklet-text" data-host-id="${id}"&gt;</p>`,
  id=>`<span class="editable-booklet-text" title='Example data-host-id="${id}"'>same</span>`,
  id=>`<span class="editable-booklet-text" title='<span class="editable-booklet-text" data-host-id="${id}">' data-host-id="${first}">same</span>`,
  id=>`<!-- ${host(id)} -->`,
  id=>`<![CDATA[${host(id)}]]>`,
  ...['script','style','textarea','title','xmp','iframe','noembed','noframes','noscript','plaintext'].map(tag=>id=>`<${tag}>${host(id)}</${tag}>`),
 ];
 for(const literal of literals)assert.notDeepEqual(hashes(literal(first)),hashes(literal(second)),literal(first));
 // A real host after a raw-text element is still normalised.
 assert.deepEqual(hashes(`<script>const example = '<span>';</script>${host(first)}`),hashes(`<script>const example = '<span>';</script>${host(second)}`));
 for(const markup of [
  id=>`<span data-host-id="${id}">same</span>`,
  id=>`<span class="not-editable-booklet-text" data-host-id="${id}">same</span>`,
  id=>`<div class="editable-booklet-text" data-host-id="${id}">same</div>`,
  id=>`<span class="editable-booklet-text" data-host-id="meaningful-${id}">same</span>`,
  id=>`<span class="editable-booklet-text" data-other-id="${id}">same</span>`,
 ])assert.notDeepEqual(hashes(markup(first)),hashes(markup(second)),markup(first));
});

test('fresh host IDs preserve bounded changed-page and neighbour selection',()=>{
 const pages=id=>Array.from({length:7},(_,index)=>({html:`<article data-page="${index+1}">${host(id)}</article>`,blocks:[`q${index+1}`]}));
 const before=renderedPageHashes(pages(first),options),fresh=pages(second);
 assert.deepEqual(affectedPages(before,renderedPageHashes(fresh,options)),[]);
 fresh[3].html=fresh[3].html.replace('Find x.','Find y.');
 assert.deepEqual(affectedPages(before,renderedPageHashes(fresh,options)),[3,4,5]);
});

test('pages without editor host UUIDs keep their existing hashes and SVG scope behaviour',()=>{
 const html='<p>Same</p><svg><linearGradient id="mm-svg-paint-1-shade"/><path fill="url(#mm-svg-paint-1-shade)"/></svg>';
 const global=structuredClone(options.settings);delete global.flowEdition;
 const legacy=createHash('sha256').update(JSON.stringify({html:normaliseSvgPaintScopes(html),renderer:options.renderer,settings:global,assets:options.assets})).digest('hex');
 assert.equal(hashes(html)[0].hash,legacy);
 assert.deepEqual(hashes(html),hashes(html.replaceAll('paint-1-','paint-42-')));
});
