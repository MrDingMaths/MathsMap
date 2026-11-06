import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';

test('table style edits retain part-label gutters, nested content and undo through reopen',async()=>{
 const built=await build({stdin:{contents:"export {DocumentEditor} from './public/libs/maths-editor/document-editor.js';",resolveDir:process.cwd()},bundle:true,format:'iife',globalName:'Editor',write:false});
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();await page.addScriptTag({content:built.outputFiles[0].text});
  const result=await page.evaluate(()=>{
   const host=document.createElement('div');document.body.append(host);
   const paragraph=(id,label,spaces)=>({id,type:'paragraph',indent:3,inlines:[{type:'text',text:label+spaces,marks:['bold']},{type:'text',text:'Expression'}]});
   const inner={id:'inner',type:'table',border:false,rows:[[{id:'inner-cell',type:'cell',rotation:90,blocks:[paragraph('inner-p','b','  ')]}]]};
   const split=paragraph('split','c','');split.inlines.splice(1,0,{type:'text',text:'  '});
   const outer={id:'outer',type:'table',rows:[[{id:'outer-cell',type:'cell',align:'left',blocks:[paragraph('p','a','  '),split,inner]}]]};
   const editor=new Editor.DocumentEditor(host,{blocks:[outer]});
   const before=structuredClone(editor.doc);
   editor.selectedId='p';editor.properties();
   const input=host.querySelector('input[aria-label="Border width (mm)"]');input.value='.4';input.dispatchEvent(new Event('change'));
   const after=structuredClone(editor.doc),gutter=['p','split'].every(id=>!!host.querySelector(`[data-id="${id}"] [data-table-part-label]`));
   editor.undo();const undone=structuredClone(editor.doc);editor.undo(1);
   editor.set(JSON.parse(JSON.stringify(editor.doc)));const reopened=structuredClone(editor.doc);
   editor.destroy();return {before,after,gutter,undone,reopened};
  });
  assert.equal(result.gutter,true,'part labels retain their 7 mm gutter after changing the border');
  const expected=structuredClone(result.before);expected.blocks[0].rows[0][0].borderWidthMm=.4;
  assert.deepEqual(result.after,expected,'only the selected border width changes');
  assert.deepEqual(result.undone,result.before);
  assert.deepEqual(result.reopened,result.after);
 }finally{await browser.close();}
});
