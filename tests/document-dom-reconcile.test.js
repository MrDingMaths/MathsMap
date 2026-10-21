import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';

// A stand-in math-field records value writes, so reconciliation can be checked
// without MathLive: the live field must survive and keep its caret.
const stubField=`customElements.define('math-field',class extends HTMLElement{constructor(){super();this.writes=0;}connectedCallback(){if(this.latex==null)this.latex=this.textContent;}getValue(){return this.latex;}setValue(value){this.latex=value;this.writes++;}});`;

test('reconcile gives a just-inserted equation its preview and keeps the live field',async()=>{
  const built=await build({stdin:{contents:"export {reconcileDocumentDOM} from './public/libs/maths-editor/document-dom.mjs';",resolveDir:process.cwd()},bundle:true,format:'iife',globalName:'Reconcile',write:false});
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const page=await browser.newPage();await page.addScriptTag({content:stubField});await page.addScriptTag({content:built.outputFiles[0].text});
    const result=await page.evaluate(()=>{
      const surface=document.createElement('div');document.body.append(surface);
      // insertMath builds a bare island; the rendered model adds a preview host.
      surface.innerHTML='<p data-id="p">Area <span data-math="true" contenteditable="false"><math-field></math-field></span></p>';
      const field=surface.querySelector('math-field');field.latex='\\boldsymbol{x}^2';
      const fresh='<p data-id="p">Area <span data-math="true" data-math-preview-host contenteditable="false"><span data-math-preview aria-hidden="true"><span class="katex">x²</span></span><math-field>\\mathbfit{x}^2</math-field></span></p>';
      Reconcile.reconcileDocumentDOM(surface,fresh);
      const island=surface.querySelector('[data-math]'),preview=island.querySelector('[data-math-preview]');
      const first={sameField:island.querySelector('math-field')===field,host:island.hasAttribute('data-math-preview-host'),preview:preview?.innerHTML,previewBeforeField:preview?.nextElementSibling===field,writes:field.writes};
      // A later render without a preview removes it again.
      Reconcile.reconcileDocumentDOM(surface,'<p data-id="p">Area <span data-math="true" contenteditable="false"><math-field>y</math-field></span></p>');
      return {first,removed:!island.querySelector('[data-math-preview]'),latex:field.latex,writes:field.writes};
    });
    assert.deepEqual(result.first,{sameField:true,host:true,preview:'<span class="katex">x²</span>',previewBeforeField:true,writes:0},'translated bold LaTeX is equivalent, so the live field is not rewritten');
    assert.equal(result.removed,true);assert.equal(result.latex,'y');assert.equal(result.writes,1);
  }finally{await browser.close();}
});
