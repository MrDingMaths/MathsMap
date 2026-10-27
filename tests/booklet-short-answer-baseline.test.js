import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import {normalizeBlockLayouts} from '../src/lib/booklet-layout.js';
import {normalizeEditableProject,validateEditableProject} from '../src/lib/editable-booklet-model.js';
import {captureQuestionPresentation,remapQuestionPresentation} from '../src/lib/question-presentation.js';
import {normaliseQuestion} from '../src/lib/practice-question-model.js';

const answer=short=>({short,worked:short});
const question=()=>({id:'baseline-question',type:'question',content:{id:'baseline-root',type:'question',prompt:'Calculate.',children:[{id:'plain',type:'part',label:'b',prompt:'Plain.',answer:answer('$x=3$')},{id:'fraction',type:'part',label:'c',prompt:'Fraction.',answer:answer('$\\cos x=-\\frac{\\sqrt7}{14}$')}]}});
const project=layouts=>({id:'baseline-project',title:'Baseline fixture',settings:{layoutOverrides:{blockLayouts:layouts}},sections:[{id:'practice',blocks:[question()]}]});

test('short baseline opt-in survives normalize/save/reload; missing and invalid values stay absent',()=>{
 const defaults={'baseline-question':{textWidthMm:50,gapMm:2}};
 assert.deepEqual(normalizeBlockLayouts(defaults),defaults);
 for(const value of [undefined,false,true,'top','baseline','']){
  const result=normalizeBlockLayouts({'baseline-question':{...defaults['baseline-question'],shortAnswerLabelAlign:value}});
  assert.deepEqual(result,defaults);
 }
 const p=normalizeEditableProject(project({'baseline-question':{shortAnswerLabelAlign:'first-baseline'}}));
 const reload=normalizeEditableProject(JSON.parse(JSON.stringify(p)));
 assert.equal(reload.settings.layoutOverrides.blockLayouts['baseline-question'].shortAnswerLabelAlign,'first-baseline');
 assert.equal(validateEditableProject(reload).valid,true);
 assert.deepEqual(normalizeEditableProject(project(defaults)),normalizeEditableProject(project({...defaults,'baseline-question':{...defaults['baseline-question'],shortAnswerLabelAlign:'invalid'}})));
});

test('captured bank presentation retains and remaps the opt-in without changing semantic identities',()=>{
 const q=question(),layout={blockLayouts:{[q.id]:{shortAnswerLabelAlign:'first-baseline'}}};
 const captured=captureQuestionPresentation(q,layout);
 assert.equal(captured.ownerId,q.id);
 const ids=new Map([[q.id,'bank-question'],['baseline-root','bank-root'],['fraction','bank-fraction']]);
 const remapped=remapQuestionPresentation(captured,ids);
 assert.equal(remapped.ownerId,'bank-question');
 assert.equal(remapped.layoutOverrides.blockLayouts['bank-question'].shortAnswerLabelAlign,'first-baseline');
 const normalized=normaliseQuestion({...q,presentation:remapped});
 assert.deepEqual(normalized.content,normaliseQuestion(q).content);
 assert.deepEqual(normalized.presentation,remapped);
 assert.equal(JSON.parse(JSON.stringify(normalized)).presentation.layoutOverrides.blockLayouts['bank-question'].shortAnswerLabelAlign,'first-baseline');
});

test('actual renderer uses first baseline only for opted-in compact Short and preserves default/Worked controls',async()=>{
 let server;
 server=await createServer({logLevel:'error',plugins:[{name:'short-baseline-fixture',configureServer(s){s.middlewares.use(async(req,res,next)=>{
  if(req.url!=='/__short-baseline.html')return next();
  res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml(req.url,`<style>body{margin:0;background:white}main{width:170mm;--type-body:9pt}</style><main></main><script type="module">
   import {mount,unmount,tick} from 'svelte';import Component from '/src/components/PracticeQuestionRenderer.svelte';import '/node_modules/katex/dist/katex.min.css';
   let instance;window.baselineFixture=async props=>{if(instance)await unmount(instance);const target=document.querySelector('main');target.innerHTML='';instance=mount(Component,{target,props});await tick();await document.fonts.ready;
    const rows=[...target.querySelectorAll('.answer-item')].map(row=>{const label=row.querySelector('.answer-label'),base=row.querySelector('.katex-html>.base');const probe=el=>{if(!el)return null;const p=document.createElement('span');p.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;';el.append(p);const y=p.getBoundingClientRect().top;p.remove();return y;};return{id:row.dataset.nodeId,opt:row.classList.contains('short-answer-label-baseline'),align:getComputedStyle(row).alignItems,labelBaseline:probe(label),mathBaseline:probe(base)};});return{html:target.innerHTML,rows};};
  </script>`));
 });}}],server:{host:'127.0.0.1',port:0,open:false}});
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  await server.listen();const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/__short-baseline.html');await page.waitForFunction(()=>typeof window.baselineFixture==='function');
  const props={question:question(),number:18,showSpaces:false,showShortAnswers:true,compactAnswerSettings:{shortFontPt:9}},render=p=>page.evaluate(p=>window.baselineFixture(p),p);
  const plain=await render(props);
  for(const layouts of [{},{'baseline-question':{shortAnswerLabelAlign:'invalid'}}])assert.deepEqual((await render({...props,blockLayouts:layouts})).rows,plain.rows);
  const opted=await render({...props,blockLayouts:{'baseline-question':{shortAnswerLabelAlign:'first-baseline'}}});
  assert.equal(opted.rows.length,2);assert(opted.rows.every(r=>r.opt&&r.align==='baseline'));
  for(const row of opted.rows)assert(Math.abs(row.labelBaseline-row.mathBaseline)<1,JSON.stringify(row));
  const bank={...question(),id:'bank-record',presentation:captureQuestionPresentation(question(),{blockLayouts:{'baseline-question':{shortAnswerLabelAlign:'first-baseline'}}})};
  assert((await render({...props,question:bank})).rows.every(r=>r.opt));
  assert((await render({...props,question:bank,blockLayouts:{'bank-record':{shortAnswerLabelAlign:'invalid'}}})).rows.every(r=>!r.opt));
  for(const gate of [{showShortAnswers:false,showWorkedSolutions:true},{compactAnswerSettings:null}])assert((await render({...props,...gate,blockLayouts:{'baseline-question':{shortAnswerLabelAlign:'first-baseline'}}})).rows.every(r=>!r.opt));
  assert.equal((await render({...props,showShortAnswers:false,blockLayouts:{'baseline-question':{shortAnswerLabelAlign:'first-baseline'}}})).rows.length,0);
  const table={format:'maths-editor-document-v1',version:1,blocks:[{id:'table',type:'table',rows:[[{id:'cell',type:'cell',blocks:[{id:'p',type:'paragraph',inlines:[{type:'math',latex:'x=1',display:true}]}]}]]}]};
  const stable=html=>html.replace(/ data-host-id="[^"]*"/g,'');
  const diagram={format:'maths-editor-document-v1',version:1,blocks:[{id:'diagram-p',type:'paragraph',inlines:[{id:'diagram-image',type:'inline-image',src:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><path d="M5 45 L50 5 L95 45 Z" fill="none" stroke="black"/></svg>'),alt:'Triangle control',width:30,aspectRatio:2,verticalAlign:'middle'}]}]};
  for(const value of ['First line.\n\nSecond line.',table,diagram]){const q=question();q.content.children[1].answer=answer(value);const original=await render({...props,question:q});assert.equal(stable((await render({...props,question:q,blockLayouts:{'baseline-question':{shortAnswerLabelAlign:'invalid'}}})).html),stable(original.html));}
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await server.close();}
});
