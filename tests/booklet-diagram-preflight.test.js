import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {routeCandidateProject,inspectFinalSizeDiagrams,diagramSourcePreflight} from '../scripts/booklet/diagram-preflight.mjs';
import {answerDiagramSignature} from '../src/lib/booklet-exercises.js';

test('answer-width preflight invalidates edited source without modifying the candidate',()=>{
 const diagram={id:'d',format:'tikz',code:'original'},project={sections:[{blocks:[diagram]}],settings:{compactAnswers:{diagramStyles:{short:{d:{widthMm:30,sourceSignature:answerDiagramSignature(diagram)}}}}}};
 const before=structuredClone(project);
 assert.deepEqual(diagramSourcePreflight(project).issues,[]);assert.deepEqual(project,before);
 diagram.code='changed';assert.equal(diagramSourcePreflight(project).issues[0].kind,'stale-answer-width');
 assert.notEqual(diagramSourcePreflight(project).diagrams[0].sourceHash,diagramSourcePreflight(before).diagrams[0].sourceHash);
});

test('candidate routing uses the open envelope, blocks writes, and inspects calibrated bounds',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage(),project={id:'candidate',title:'Isolated candidate',sections:[],settings:{}};
  const html='<style>.booklet-page{width:210mm}.tikz-wrap{width:40mm}svg{width:100%;height:auto}</style><div class="project-print"><article class="print-page booklet-page"><div data-diagram-id="d" class="tikz-wrap"><svg viewBox="0 0 100 40"><g data-diagram-label="1" data-label-font="10" data-label-anchor="west"><text x="98" y="20" font-size="10">ABC</text></g></svg></div></article></div>';
  await page.route('http://preflight.test/**',r=>{
   const name=new URL(r.request().url()).pathname;
   const file={'/src/lib/diagram-typography.js':'src/lib/diagram-typography.js','/public/libs/maths-editor/house-style.mjs':'public/libs/maths-editor/house-style.mjs'}[name];
   return r.fulfill({contentType:file?'text/javascript':'text/html',body:file?fs.readFileSync(file,'utf8'):html});
  });
  await routeCandidateProject(page,project);await page.goto('http://preflight.test/');
  const open=await page.evaluate(async()=>await(await fetch('/__booklet/projects/candidate/open')).json());
  assert.deepEqual(open,{project,bankSync:{items:[]},bankSyncError:''});
  assert.equal(await page.evaluate(async()=>{try{await fetch('/__booklet/projects/candidate',{method:'POST',body:'{}'});return 'written';}catch{return 'blocked';}}),'blocked');
  await page.evaluate(async()=>{const {calibrateDiagramTypography}=await import('/src/lib/diagram-typography.js');calibrateDiagramTypography(document);});
  const clipped=await inspectFinalSizeDiagrams(page);
  assert.equal(clipped.figures.length,1);assert.ok(clipped.issues.some(i=>i.kind==='diagram-label-clipping'&&i.diagramId==='d'&&i.page===1));
  assert.ok(Math.abs(clipped.figures[0].labels[0].pt-10)<.1);
  await page.evaluate(async()=>{document.querySelector('text').setAttribute('x','20');const {calibrateDiagramTypography}=await import('/src/lib/diagram-typography.js');calibrateDiagramTypography(document);});
  assert.deepEqual((await inspectFinalSizeDiagrams(page)).issues,[]);
 }finally{await browser.close();}
});
