// Isolated editor verification. Never writes a live booklet or bank record.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject,createProjectBlock} from '../../src/lib/editable-booklet-model.js';
import {questionDifficulty} from '../../src/lib/booklet-bank-ratings.js';
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1];};
const out=arg('--out','.booklet-work/volume-bank/ratings'),base=arg('--base','http://127.0.0.1:5297');fs.mkdirSync(out,{recursive:true});
const make=(id,prompt,classification)=>{const b=createProjectBlock('question');b.id=id;b.content.id=id+'-content';b.content.prompt=prompt;b.content.answer={short:'2',worked:'$1+1=2$',solutionDiagrams:[]};delete b.classification;delete b.flow;if(classification)b.classification=classification;return b;};
const linked=make('linked','Calculate $1+1$.',{reasoningScore:10,difficultyReason:'Old assessment'});linked.bankRef={id:'bank-linked',revision:'pinned'};
const local=make('local','Calculate $2+3$.');local.flow={localDifficulty:{reasoningScore:30,difficulty:'Development',reason:'Two linked procedures'}};
const unrated=make('unrated','Calculate $3+4$.');
const theory=make('theory','Teaching demonstration',{reasoningScore:10});theory.pedagogyRole='guided-practice';
let record=createEditableProject({id:'difficulty-check',title:'Difficulty display check',settings:{paginationMode:'flexible',generatedCover:false,flowEdition:'student'}});
record.sections=[{id:'practice',title:'Exercise',topicId:'topic',phase:'practice',blocks:[linked,local,unrated]},{id:'teaching',title:'Teaching',topicId:'topic',phase:'teaching',blocks:[theory]}];record.topics=[{id:'topic',title:'Arithmetic'}];record.revision=1;
const current={blockId:linked.id,bankId:'bank-linked',state:'synced',bankDifficulty:{reasoningScore:55,difficulty:'Mastery',difficultyReason:'Connect two representations',revision:'current'}};
const trig=JSON.parse(fs.readFileSync('booklets/projects/non-right-angled-trigonometry-v1.json'));
const questions=trig.sections.filter(s=>s.phase==='practice').flatMap(s=>s.blocks.filter(b=>b.type==='question'));
assert.equal(questions.length,91);for(const b of questions){const bank=JSON.parse(fs.readFileSync('booklets/question-bank/'+b.bankRef.id+'.json'));assert.equal(questionDifficulty(b).reasoningScore,bank.classification.reasoningScore);assert.ok(bank.classification.difficultyReason);}
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1550,height:1100}}),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);
await page.route('**/__booklet/**',async route=>{const req=route.request(),p=new URL(req.url()).pathname;if(p==='/__booklet/projects')return route.fulfill({json:[record]});if(p==='/__booklet/projects/'+record.id){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};}return route.fulfill({json:record});}if(p.endsWith('/bank-sync'))return route.fulfill({json:{items:[current]}});if(req.method()!=='GET')return route.abort();return route.fallback();});
const ready=()=>page.waitForFunction(()=>!document.querySelector('.workspace-loading')&&document.querySelector('.flow-document')?.dataset.paginationState==='ready',{},{timeout:120000});
try{
 await page.goto(base+'/#/booklet?stage=projects&project='+record.id,{waitUntil:'domcontentloaded'});await ready();
 await page.locator('.flow-paper [data-editor-difficulty="linked"]').first().waitFor();
 assert.match(await page.locator('.flow-paper [data-editor-difficulty="linked"]').first().innerText(),/Mastery\s+55\/100/);
 assert.match(await page.locator('.flow-paper [data-editor-difficulty="local"]').first().innerText(),/Development\s+30\/100/);
 assert.equal(await page.locator('[data-editor-difficulty="unrated"],[data-editor-difficulty="theory"]').count(),0);checks.push('Linked and legacy local badges without exercise metadata; unrated and teaching excluded');
 await page.getByRole('button',{name:'More options',exact:true}).click();await page.locator('[data-question-difficulty]').waitFor();assert.match(await page.locator('[data-question-difficulty]').innerText(),/Connect two representations/);checks.push('Current bank rationale is accessible in question properties');
 await page.getByRole('button',{name:'Close panel',exact:true}).click();
 for(const zoom of ['0.75','1','width']){await page.getByLabel('Booklet zoom',{exact:true}).selectOption(zoom);await ready();const badge=page.locator('.flow-paper [data-editor-difficulty="linked"]').first();await badge.scrollIntoViewIfNeeded();assert.equal(await badge.isVisible(),true);}
 await page.locator('.flow-paper').filter({has:page.locator('[data-editor-difficulty="linked"]')}).first().screenshot({path:out+'/practice-page.png'});
 await page.locator('[data-block-id="unrated"] > button').click();await page.getByRole('button',{name:'More options',exact:true}).click();assert.match(await page.locator('[data-question-difficulty]').innerText(),/Not rated/);assert.equal(await page.getByLabel('Reasoning score',{exact:true}).inputValue(),'');await page.getByRole('button',{name:'Close panel',exact:true}).click();checks.push('Unrated properties show no default score');
 await page.screenshot({path:out+'/editor.png'});await page.setViewportSize({width:800,height:1000});await page.getByLabel('Booklet zoom',{exact:true}).selectOption('width');await ready();await page.screenshot({path:out+'/narrow.png'});checks.push('Badges visible at three zoom settings and narrow viewport');
 await page.setViewportSize({width:1550,height:1100});
 for(const edition of ['student','short','worked','with-short','with-worked']){await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await ready();await page.emulateMedia({media:'print'});assert.equal(await page.locator('.project-print [data-editor-difficulty]').count(),0);assert.ok(await page.locator('[data-editor-difficulty]').evaluateAll(els=>els.every(el=>getComputedStyle(el).display==='none')));await page.emulateMedia({media:'screen'});}
 checks.push('All five editions exclude difficulty badges from print');
 await page.getByLabel('Booklet edition',{exact:true}).selectOption('student');await ready();await page.reload();await ready();assert.match(await page.locator('.flow-paper [data-editor-difficulty="linked"]').first().innerText(),/55\/100/);checks.push('Reopen initializes current ratings');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({checks,trigQuestions:91,errors}));
}catch(e){await page.screenshot({path:out+'/failure.png',fullPage:true});throw e;}finally{fs.writeFileSync(out+'/report.json',JSON.stringify({checks,trigQuestions:91,errors,finished:new Date().toISOString()},null,2)+'\n');await browser.close();}
