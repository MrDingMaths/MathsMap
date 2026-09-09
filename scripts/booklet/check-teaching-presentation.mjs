// Read-only browser checks against a routed copy. Never save project settings.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {teachingAnswerCategory} from '../../src/lib/booklet-answer-options.js';
const arg=(n,f)=>{const i=process.argv.indexOf(n);return i<0?f:process.argv[i+1];};
const id=arg('--project'),out=arg('--out',`.booklet-work/teaching-check/${id}`),base=arg('--base','http://127.0.0.1:5173');
if(!id||!/^[\w.-]+$/.test(id))throw Error('Provide --project ID');
const record=JSON.parse(fs.readFileSync(`booklets/projects/${id}.json`));
const topic=record.sections.find(s=>s.blocks.some(b=>b.pedagogyRole==='key-ideas'))?.topicId;
if(!topic)throw Error('This check needs a topic with Key Ideas and guided practice.');
const topics=new Set([topic,...['review','identify','guided'].map(kind=>record.sections.find(s=>s.blocks.some(b=>b.type==='question'&&teachingAnswerCategory(b)===kind))?.topicId)]);
record.sections=record.sections.filter(s=>topics.has(s.topicId)&&s.phase==='teaching');
record.settings={...record.settings,flowEdition:'student',generatedCover:false};
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[],writes=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',r=>{if(r.request().method()==='GET')return r.fallback();writes.push(r.request().url());return r.abort();});
await page.route('**/__booklet/projects/'+id,r=>r.fulfill({json:record}));
const print=async()=>{
 await page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:600000});
 await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
 await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 return page.locator('.project-print').evaluate(root=>({
  answers:root.querySelectorAll('.answer-item').length,
  cloze:[...root.querySelectorAll('[data-cloze]')].map(e=>({text:e.textContent,colour:getComputedStyle(e).color})),
  generatedReferences:root.querySelectorAll('.teaching-activity-reference').length,
  inlineTextStyle:[...root.querySelectorAll('[data-math] annotation')].filter(e=>e.textContent.includes('\\textstyle')).length,
  duplicateHeaders:[...root.querySelectorAll('.atom-body')].filter(e=>/^\s*(Guided Practice|Key Ideas)\s*$/i.test(e.textContent)).length
 }));
};
try{
 await page.goto(base+'/#/booklet?stage=projects&project='+id);
 const hidden=await print();assert.equal(hidden.generatedReferences,0);assert.equal(hidden.inlineTextStyle,0);assert.equal(hidden.duplicateHeaders,0);assert.ok(hidden.cloze.length>0);
 await page.getByRole('button',{name:'PDF',exact:true}).click();
 const controlChecks=[];
 for(const [kind,label]of [['review','Show review answers'],['identify','Show identify answers'],['guided','Show guided practice answers']]){
  if(!record.sections.some(s=>s.blocks.some(b=>b.type==='question'&&teachingAnswerCategory(b)===kind)))continue;
  await page.getByLabel(label,{exact:true}).check();const result=await print();
  assert.ok(result.answers>hidden.answers,label+' reveals its responses');controlChecks.push({kind,answers:result.answers});
  await page.getByLabel(label,{exact:true}).uncheck();assert.deepEqual(await print(),hidden,label+' restores the student view');
 }
 await page.getByLabel('Show Key Ideas answers',{exact:true}).check();
 const shown=await print();
 assert.notDeepEqual(shown.cloze,hidden.cloze,'Key Ideas control fills cloze fields');
 await page.getByLabel('Show Key Ideas answers',{exact:true}).uncheck();
 const restored=await print();assert.deepEqual(restored,hidden,'Teaching controls restore the student view');
 assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/teaching.json',JSON.stringify({project:id,hidden,shown,restored,controlChecks,errors,writes},null,2));
 console.log('Teaching templates, practice-only references, native maths and answer controls passed.');
}finally{await browser.close();}
