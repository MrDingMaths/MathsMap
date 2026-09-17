import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {chromium} from 'playwright-core';
import {createServer} from 'vite';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {renderMath} from '../src/lib/render-math.js';

test('compact answer labels keep their physical gutter in printed nested rows',async t=>{
 const probe=spawnSync('pdftotext',['-v'],{encoding:'utf8',windowsHide:true});
 if(probe.error?.code==='ENOENT'){t.skip('Poppler required for actual PDF word bounds');return;}
 const css=fs.readFileSync(new URL('../src/components/PracticeQuestionRenderer.svelte',import.meta.url),'utf8').split('<style>')[1].split('</style>')[0];
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-answer-gutter-'));
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  const entry=(n,text)=>`<section class="answer-fragment"><div class="practice-question compact-answer short-answer-key" style="--type-body:9pt;--answer-label-width:8mm"><div class="answer-children"><article class="answer-item"><div class="answer-label">${n}a</div><div class="answer-content"><span class="editable-booklet-text"><span><div class="booklet-content"><div class="inline-content"><div class="text-line"><span>${renderMath(text)}</span></div></div></div></span></span></div></article></div></div></section>`;
  const sheet=n=>`<article class="sheet"><div class="answer-columns"><div class="answer-column"><section class="answer-row"><div class="answer-row-grid">${entry(n,`Marker${n} explains the method and preserves a long answer wrapping onto another line.`)}</div></section><section class="answer-row"><div class="answer-row-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[1,2,3].map(k=>entry(n*10+k,`Value${n*10+k}`)).join('')}</div></section></div><div></div></div></article>`;
  await page.setContent(`<style>${css}@page{size:A4;margin:0}body{margin:0}.sheet{box-sizing:border-box;width:210mm;height:297mm;padding:10mm 15mm;break-after:page}.answer-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8mm}.answer-row-grid{display:grid;grid-template-columns:minmax(0,1fr);column-gap:3mm}.answer-column,.answer-fragment,.answer-row{min-width:0}.editable-booklet-text{display:block}.text-line{min-height:1.25em}</style>${[1,2,3].map(sheet).join('')}`);
  await page.emulateMedia({media:'print'});await page.pdf({path:path.join(dir,'answers.pdf'),preferCSSPageSize:true});
  const output=spawnSync('pdftotext',['-bbox',path.join(dir,'answers.pdf'),'-'],{encoding:'utf8',windowsHide:true});
  assert.equal(output.status,0,output.stderr);
  const pages=[...output.stdout.matchAll(/<page\b[^>]*>([\s\S]*?)<\/page>/g)];assert.equal(pages.length,3);
  for(let i=0;i<pages.length;i++){
   const words=[...pages[i][1].matchAll(/<word xMin="([^"]+)" yMin="([^"]+)" xMax="([^"]+)" yMax="([^"]+)">([^<]+)<\/word>/g)];
   for(const n of [i+1,...[1,2,3].map(k=>(i+1)*10+k)]){
    const label=words.find(w=>w[5]===n+'a'),content=words.find(w=>w[5]===(n<10?'Marker':'Value')+n);
    assert.ok(label&&content,`Missing separately readable label/content for ${n}`);
    assert.ok(Math.abs((Number(content[1])-Number(label[1]))*25.4/72-10)<.25,`Printed label gutter collapsed for ${n}`);
   }
  }
 }finally{await browser.close();assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));fs.rmSync(dir,{recursive:true,force:true});}
});

test('actual project short-answer export preserves prose and native-maths label gutters',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-project-gutter-'));
 const server=await createServer({logLevel:'error',server:{host:'127.0.0.1',port:0,open:false}});
 try{
  await server.listen();
  const answer=short=>({short,worked:short});
  const project=normalizeEditableProject({id:'gutter-regression',title:'Answer gutter regression',settings:{paginationMode:'flexible',exerciseOrganisation:'topic',compactAnswers:{},generatedCover:true},topics:[{id:'algebra',title:'Algebra'}],sections:[{id:'practice',topicId:'algebra',phase:'practice',blocks:[
   {id:'q1',type:'question',sourceOrder:1,content:{id:'q1-root',type:'question',prompt:'Explain.',children:[{id:'q1-a',type:'part',label:'a',prompt:'First.',answer:answer('MarkerOne gives a reason involving $x^2+4x+4=(x+2)^2$ and spans several words.')},{id:'q1-b',type:'part',label:'b',prompt:'Second.',answer:answer('$(x+2)^2$. MarkerTwo follows the result.')}] }},
   {id:'q2',type:'question',sourceOrder:2,content:{id:'q2-root',type:'question',prompt:'Explain.',answer:answer('MarkerThree explains the result and its required conditions.')}}
  ]}]});
  const file=path.join(dir,'project.json'),pdf=path.join(dir,'answers.pdf');fs.writeFileSync(file,JSON.stringify(project));
  await promisify(execFile)(process.execPath,['scripts/booklet/export-pdf.mjs','--base','http://127.0.0.1:'+server.httpServer.address().port,'--project',file,'--mode','short','--out',pdf],{windowsHide:true,timeout:90000});
  const output=spawnSync('pdftotext',['-bbox',pdf,'-'],{encoding:'utf8',windowsHide:true});assert.equal(output.status,0,output.stderr);
  const words=[...output.stdout.matchAll(/<word xMin="([^"]+)" yMin="([^"]+)" xMax="([^"]+)" yMax="([^"]+)">([^<]+)<\/word>/g)];
  for(const [labelText,marker]of [['1a','MarkerOne'],['2','MarkerThree']]){
   const content=words.find(w=>w[5]===marker),label=words.find(w=>w[5]===labelText&&content&&Math.abs(Number(w[2])-Number(content[2]))<2&&Number(w[1])<Number(content[1]));
   assert.ok(label&&content,'PDF must keep the label separate from '+marker);
   assert.ok(Math.abs((Number(content[1])-Number(label[1]))*25.4/72-10)<.25,'PDF must retain 8 mm label plus 2 mm gap for '+marker);
  }
 }finally{await server.close();assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));fs.rmSync(dir,{recursive:true,force:true});}
});
