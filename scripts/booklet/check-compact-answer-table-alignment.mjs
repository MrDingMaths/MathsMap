// Isolated browser regression: actual component CSS and native answer pipeline;
// no server, project saves or exports are needed.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {compile} from 'svelte/compiler';
import {chromium} from 'playwright-core';
import {normalizeDocument,renderDocument} from '../../public/libs/maths-editor/document-model.mjs';
import {shortAnswerDisplay} from '../../src/lib/booklet-preview.js';
import {compactAnswerDisplay} from '../../src/lib/booklet-exercises.js';
import {normaliseShortAnswer} from '../../src/lib/short-answer-style.js';

const para=(id,align)=>({id,type:'paragraph',align,inlines:[{type:'text',text:'Frequency'}]});
const doc=normalizeDocument({blocks:[para('prose','center'),{id:'table',type:'table',rows:[[
 {id:'header',type:'cell',header:true,align:'center',blocks:[para('header-text','left')]},
 {id:'body',type:'cell',align:'center',blocks:[para('body-text','left')]},
 {id:'exception',type:'cell',align:'right',blocks:[para('exception-text','left')]},
 {id:'paragraph-exception',type:'cell',align:'center',preserveParagraphAlignment:true,blocks:[para('preserved-text','right')]},
]]}]});
const before=JSON.stringify(doc),display=compactAnswerDisplay(shortAnswerDisplay(normaliseShortAnswer(doc)));
assert.equal(display.format,doc.format);
assert.equal(JSON.stringify(doc),before);
const source=fs.readFileSync('src/components/PracticeQuestionRenderer.svelte','utf8');
const css=compile(source,{generate:'server',cssHash:()=> 'compact-table-check'}).css.code;
let browser;
try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
try{
 const page=await browser.newPage();
 await page.setContent(`<style>${css}</style><div class="compact-answer compact-table-check">${renderDocument(display)}</div>`);
 const expected={'prose':'left','header-text':'center','body-text':'center','exception-text':'right','preserved-text':'right'};
 for(const[id,alignment]of Object.entries(expected))assert.equal(await page.locator(`[data-id="${id}"]`).evaluate(el=>getComputedStyle(el).textAlign),alignment,id);
 assert.equal(await page.locator('table').count(),1,'native answer table has one wrapper/rendering');
 console.log('PASS: compact native answer headers/body centre, local right alignment persists, ordinary prose stays left.');
}finally{await browser.close();}
