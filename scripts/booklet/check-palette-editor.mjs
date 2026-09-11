// Read-only representative editor/preview/reopen acceptance on the running app.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const out=process.env.BOOKLET_PALETTE_REVIEW_OUT??'.booklet-work/standard-palette';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1500,height:1100}});
try{
 await page.goto('http://127.0.0.1:5173/libs/tikzjax/fonts.css');
 const result=await page.evaluate(async()=>{
  const {loadDocumentEditor,fromSource}=await import('/src/lib/document-content.js');
  const {inspectBookletPalette}=await import('/src/lib/booklet-palette-qa.js');
  const {renderDocument}=await import('/libs/maths-editor/document-model.mjs');
  const {BOOKLET_PALETTE}=await import('/libs/maths-editor/booklet-palette.mjs');
  await loadDocumentEditor();document.body.replaceChildren();
  const editor=document.createElement('maths-editor');editor.setAttribute('structured','');editor.dataset.houseStyleVersion='1.1.0';editor.style.setProperty('--document-ink','#24282d');document.body.append(editor);
  const source=fromSource(String.raw`Matched $\textcolor{#AA0505}{x}$ and $\textcolor{#056FDB}{y}$; $\textcolor{#16803d}{\checkmark}$`);editor.document=source;
  const initial=JSON.stringify(editor.document);if(!initial.includes('#ef6068')||!initial.includes('#268cff')||!initial.includes('#4f9b63'))throw Error('Initial editor palette');
  const field=editor.querySelector('math-field');field.value=String.raw`\textcolor{#AA0505}{x^2}`;editor.documentController.capture();
  if(!field.value.includes('#ef6068'))throw Error('Live equation palette');
  const saved=JSON.parse(JSON.stringify(editor.document));editor.document=saved;if(JSON.stringify(editor.document)!==JSON.stringify(saved))throw Error('Reopen changed document');
  const preview=document.createElement('main');preview.style.color='#24282d';preview.innerHTML=renderDocument(saved,{math:(latex,display)=>window.MathLive.convertLatexToMarkup(latex,{displayMode:display})});document.body.append(preview);
  const issues=inspectBookletPalette(preview);if(issues.length)throw Error(JSON.stringify(issues));
  editor.documentController.colourField('Review fill','#d4e8ff',()=>{},'transparent');const swatches=[...editor.querySelectorAll('.me-colour-swatches button')].map(b=>b.style.backgroundColor);
  if(swatches.length<Object.keys(BOOKLET_PALETTE).length)throw Error('Missing palette tokens');
  preview.querySelector('p').style.backgroundColor='#abcdef';const custom=inspectBookletPalette(preview);if(!custom.some(i=>i.role==='background'))throw Error('Custom fill accepted');preview.querySelector('p').style.backgroundColor='transparent';
  return {initialNormalization:true,liveEquationNormalization:true,saveReopen:true,previewIssues:issues,customFillRejected:true,swatches:swatches.length};
 });
 await page.screenshot({path:out+'/editor-representative.png'});fs.writeFileSync(out+'/editor-qa.json',JSON.stringify(result,null,2));assert.ok(result.saveReopen);console.log(result);
}finally{await browser.close();}
