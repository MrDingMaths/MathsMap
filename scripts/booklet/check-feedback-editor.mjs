// Read-only editor regression: edits disposable DOM fixtures, never a project.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const arg=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];};
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage();await page.goto(arg('--base','http://127.0.0.1:5173')+'/libs/maths-editor/document-model.mjs');
 const result=await page.evaluate(async()=>{
  const {DocumentEditor}=await import('/libs/maths-editor/document-editor.js');
  const {template,normalizeDocument,toSource}=await import('/libs/maths-editor/document-model.mjs');
  const bubble=template('speech-bubble');bubble.slots[0].blocks[0].src='/booklet-assets/projects/index-laws-complete-v1/a2fc6010263c-image3.png';
  bubble.slots[1].blocks[0].inlines=[{type:'text',text:'Tick ✓ ',colour:'#196b24'},{type:'text',text:'Cross ✗ ',colour:'#c00000'},{type:'math',latex:'e^7',colour:'#0080ff'}];
  const doc=normalizeDocument({blocks:[bubble]}),host=document.createElement('div');document.body.replaceChildren(host);
  const editor=new DocumentEditor(host,doc);editor.capture();const before=JSON.stringify(doc),after=JSON.stringify(editor.doc);
  const p=editor.surface.querySelectorAll('[data-slot] p')[0];p.firstChild.firstChild.textContent='Edited ✓ ';editor.capture();editor.remember();
  const edited=toSource(editor.doc);editor.undo();const undone=toSource(editor.doc);editor.undo(1);const redone=toSource(editor.doc);
  editor.selectedId=bubble.id;editor.properties();const tail=[...editor.inspector.querySelectorAll('select')].find(s=>s.getAttribute('aria-label')==='Tail');
  tail.value='right';tail.dispatchEvent(new Event('change'));editor.capture();const right=editor.doc.blocks[0].tail;
  const saved=normalizeDocument(JSON.parse(JSON.stringify(editor.doc)));editor.set(saved);editor.capture();
  const roundTrip=JSON.stringify(saved)===JSON.stringify(editor.doc);
  editor.destroy();return {same:before===after,edited,undone,redone,right,roundTrip,after};
 });
 assert.equal(result.same,true,result.after);assert.match(result.edited,/Edited/);assert.match(result.undone,/Tick/);assert.equal(result.redone,result.edited);assert.equal(result.right,'right');assert.equal(result.roundTrip,true);
 console.log('Speech bubble, colour, text/equation capture, undo/redo, tail editing and save/reload passed.');
}finally{await browser.close();}
