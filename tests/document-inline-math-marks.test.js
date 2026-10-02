import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';
import {fromSource,inlinesFromSource,toSource,normalizeDocument,renderDocument,visitDocument} from '../public/libs/maths-editor/document-model.mjs';
import {documentHtml} from '../src/lib/document-content.js';

const source='2. **Assume true for $n = k$**\n3. **Prove true for $n = k + 1$**';
const maths=doc=>{const rows=[];visitDocument(doc,node=>{if(node.type==='paragraph')rows.push(...node.inlines.filter(n=>n.type==='math'));});return rows;};

test('induction source-list headings render native bold maths and preserve source and JSON save/reopen',()=>{
  const doc=fromSource(source),before=JSON.stringify(doc),html=documentHtml(doc);
  assert.deepEqual(maths(doc),[{type:'math',latex:'n = k',display:false,marks:['bold']},{type:'math',latex:'n = k + 1',display:false,marks:['bold']}]);
  assert.equal(toSource(doc),source);
  assert.equal((html.match(/class="katex"/g)||[]).length,2);
  assert.doesNotMatch(html,/katex-error|\$n = k/);
  assert.match(html,/data-math-marks="\[&quot;bold&quot;\]"/);
  assert.match(html,/boldsymbol/);
  assert.equal(JSON.stringify(doc),before);
  assert.deepEqual(normalizeDocument(JSON.parse(before)),doc);
  assert.deepEqual(maths(fromSource(toSource(doc))),maths(doc));
});

test('nested formatting skips LaTeX subscripts, stars and escaped currency without changing LaTeX',()=>{
  const value=String.raw`**_Use $a_b$ and $x*y$; pay \$5_**. _Check $\text{cost \$5}_i$_. $z_j$`;
  const doc=fromSource(value),nodes=maths(doc);
  assert.deepEqual(nodes.map(n=>n.latex),['a_b','x*y',String.raw`\text{cost \$5}_i`,'z_j']);
  assert.deepEqual(nodes.map(n=>n.marks),[['bold','italic'],['bold','italic'],['italic'],undefined]);
  assert.equal(toSource(doc),value);
  assert.equal(inlinesFromSource(String.raw`pay \$5 and \$9`).some(n=>n.type==='math'),false);
  assert.equal(toSource(fromSource('**Unfinished $n + 1')),String.raw`**Unfinished \$n + 1`);
});

test('explicit math marks normalize while inherited table-heading bold remains presentation only',()=>{
  const raw={blocks:[{type:'paragraph',inlines:[{type:'math',latex:'x_i',marks:['italic','unknown','bold','bold','underline']},{type:'math',latex:'y',marks:[]}]}]};
  const before=JSON.stringify(raw),doc=normalizeDocument(raw);
  assert.deepEqual(maths(doc)[0].marks,['bold','italic','underline']);
  assert.equal(Object.hasOwn(maths(doc)[1],'marks'),false);
  assert.equal(JSON.stringify(raw),before);
  assert.deepEqual(normalizeDocument(JSON.parse(JSON.stringify(doc))),doc);
  const table=normalizeDocument({blocks:[{type:'table',rows:[[{header:true,blocks:[{type:'paragraph',inlines:[{type:'math',latex:'x^2'}]}]}]]}]});
  const calls=[];renderDocument(table,{math:latex=>{calls.push(latex);return latex;}});
  assert.deepEqual(calls,[String.raw`\boldsymbol{x^2}`]);
  assert.equal(Object.hasOwn(maths(table)[0],'marks'),false);
  assert.equal(toSource(table),'$x^2$');
});

test('native editor and HTML clipboard preserve exact math marks, original LaTeX and legacy table presentation',async()=>{
  const built=await build({stdin:{contents:"export {DocumentEditor} from './public/libs/maths-editor/document-editor.js'; export {readClipboard} from './public/libs/maths-editor/document-clipboard.mjs';",resolveDir:process.cwd()},bundle:true,format:'iife',globalName:'InlineProbe',write:false});
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const page=await browser.newPage();await page.addScriptTag({content:built.outputFiles[0].text});
    const doc=fromSource(source);
    for(const html of [documentHtml(doc),renderDocument(doc,{editable:true,editableMathPreview:true})]){
      await page.setContent('<div id="editor">'+html+'</div>');
      const read=await page.evaluate(doc=>InlineProbe.DocumentEditor.prototype.read.call({doc},document.querySelector('#editor')),doc);
      assert.deepEqual(maths(normalizeDocument(JSON.parse(JSON.stringify(read)))),maths(doc));
      assert.equal(toSource(read),source);
      const pasted=await page.evaluate(html=>InlineProbe.readClipboard({getData:type=>type==='text/html'?html:''}),html);
      assert.deepEqual(maths(pasted.document),maths(doc));assert.deepEqual(pasted.unsupported,[]);
    }
    const flavors=await page.evaluate(doc=>[
      InlineProbe.readClipboard({getData:type=>type==='application/x-maths-editor+json'?JSON.stringify(doc):''}).document,
      InlineProbe.readClipboard({getData:type=>type==='text/html'?'<div data-maths-document="'+JSON.stringify(doc).replaceAll('"','&quot;')+'"></div>':''}).document,
    ],doc);
    for(const reopened of flavors)assert.deepEqual(maths(reopened),maths(doc));
    const table=normalizeDocument({blocks:[{type:'table',rows:[[{header:true,blocks:[{type:'paragraph',inlines:[{type:'math',latex:'x_i',marks:['italic']}]}]}]]}]});
    await page.setContent('<div id="editor">'+renderDocument(table,{editable:true})+'</div>');
    const tableRead=await page.evaluate(doc=>InlineProbe.DocumentEditor.prototype.read.call({doc},document.querySelector('#editor')),table);
    assert.deepEqual(maths(tableRead),maths(table));
    await page.setContent('<div id="editor"><p><strong><em><span data-math="true" data-latex="x_i" data-display="false"><math-field>x_i</math-field></span></em></strong></p></div>');
    const inherited=await page.evaluate(()=>InlineProbe.DocumentEditor.prototype.read.call({doc:{blocks:[]}},document.querySelector('#editor')));
    assert.deepEqual(maths(inherited),[{type:'math',latex:'x_i',display:false,marks:['bold','italic']}]);
    const editedPaste=await page.evaluate(()=>InlineProbe.readClipboard({getData:type=>type==='text/html'?'<p><strong><span data-math="true" data-latex="x_i" data-display="false"><math-field data-clipboard-latex="y_i + 2">x_i</math-field></span></strong></p>':''}));
    assert.deepEqual(maths(editedPaste.document),[{type:'math',latex:'y_i + 2',display:false,marks:['bold']}]);
    assert.deepEqual(editedPaste.unsupported,[]);
    const external=await page.evaluate(()=>InlineProbe.readClipboard({getData:type=>type==='text/html'?'<p><math><mi>x</mi></math></p>':''}));
    assert.deepEqual(external.unsupported,['Word equations']);
  }finally{await browser.close();}
});
