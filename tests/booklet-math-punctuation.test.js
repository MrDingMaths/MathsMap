import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {renderDocument} from '../public/libs/maths-editor/document-model.mjs';
const fixture=(display=false,text='. Mary continues.')=>({format:'maths-editor-document-v1',version:1,blocks:[{id:'p',type:'paragraph',inlines:[{type:'text',text:'1234567890 '},{type:'math',latex:'x+1',display},{type:'text',text,marks:['italic']}]}]});
test('native inline formula punctuation stays attached without changing stored content or editable caret structure',()=>{
 const doc=fixture(),before=structuredClone(doc),html=renderDocument(doc);
 assert.match(html,/data-math-punctuation/);assert.match(html,/<em>\.<\/em><\/span><em> Mary continues\.<\/em>/);assert.deepEqual(doc,before);
 const editable=renderDocument(doc,{editable:true});assert.doesNotMatch(editable,/data-math-punctuation/);assert.match(editable,/data-math-caret/);assert.match(editable,/<em>\. Mary continues\.<\/em>/);
 assert.doesNotMatch(renderDocument(fixture(true)),/data-math-punctuation/);
 assert.doesNotMatch(renderDocument(fixture(false,' and more prose.')),/data-math-punctuation/);
 assert.match(renderDocument(fixture(false,',; next')),/<em>,;<\/em><\/span><em> next<\/em>/);
});
test('printed punctuation cannot wrap onto a line separate from its formula',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{const page=await browser.newPage();const html=renderDocument(fixture(),{math:()=>'<span class="formula" style="display:inline-block;width:100px;height:20px">x+1</span>'});await page.setContent('<style>body{font:16px monospace}p{width:210px}</style>'+html);
 for(const media of ['screen','print']){await page.emulateMedia({media});const boxes=await page.evaluate(()=>{const m=document.querySelector('.formula').getBoundingClientRect(),p=document.querySelector('[data-math-punctuation] em').getBoundingClientRect();return{math:[m.top,m.bottom],punctuation:[p.top,p.bottom],text:document.querySelector('p').textContent};});assert.ok(boxes.punctuation[0]<boxes.math[1]&&boxes.punctuation[1]>boxes.math[0],media+': punctuation shares the formula line');assert.equal(boxes.text,'1234567890 x+1. Mary continues.');}
 }finally{await browser.close();}
});
