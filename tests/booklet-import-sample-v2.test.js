// Import v2 early sample (docs/booklet-import-v2-ch01-efficiency.md, change 3).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {selectLayoutSample,sampleBlocksMissingFromEditions,recommendSamplePages,samplePatternClasses} from '../scripts/booklet/lean-visual.mjs';
import {reviewImportSample,pairSamplePages} from '../scripts/booklet/import-sample-review.mjs';
import {COMPLETION_PROFILE,IMPORT_POLICY} from '../scripts/booklet/import-completion.mjs';
import {loadReviewed} from '../scripts/booklet/lean-review.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));};
const tmp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sample-v2-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const q=(id,page)=>({id,type:'question',sourceRefs:[{pageNumber:page}],content:{id:id+'-root',type:'question',prompt:'Find '+id+'.',children:[]}});
const project=n=>({id:'p',title:'T',settings:{},sections:[{id:'s',phase:'practice',blocks:Array.from({length:n},(_,i)=>q('q'+(i+1),1+Math.floor(i/2)))}]});

test('v2 samples every authored block; the default keeps its densest-family limit',()=>{
 assert.equal(selectLayoutSample(project(12),{all:true}).length,12);
 assert.ok(selectLayoutSample(project(12)).length<=8);
});

test('a practice question absent from an answer edition fails the sample',()=>{
 const p=project(3),map=ids=>ids.map((id,i)=>({page:i+1,blocks:[id]}));
 const report={student:{map:map(['q1','q2','q3'])},worked:{map:map(['q1','q2-a'])},short:{map:map(['q1','q2','q3'])}};
 assert.deepEqual(sampleBlocksMissingFromEditions(p,report,['student','short','worked']),[{edition:'worked',blockId:'q3'}]);
});

test('pages pair only when consecutive and within the eight source images',()=>{
 const rows=[1,2,3,5,6].map(page=>({page}));
 assert.deepEqual(pairSamplePages(rows,()=>[]).map(g=>g.map(r=>r.page)),[[1,2],[3],[5,6]]);
 assert.deepEqual(pairSamplePages(rows,group=>group.length>1?Array(9).fill('x'):['x']).map(g=>g.length),[1,1,1,1,1]);
});

test('sample pages come from inventory patterns: first exercise, then the fewest pages covering the rest',()=>{
 const inv=[
  {pageNumber:2,groups:[{kind:'exercise',header:'Exercise 1A'}],entries:[{id:'a',kind:'question'},{id:'b',kind:'part',responseKind:'cloze'}]},
  {pageNumber:3,groups:[],entries:[{id:'c',kind:'question'}]},
  {pageNumber:4,groups:[{kind:'exercise',header:'Exercise 1B'}],entries:[{id:'d',kind:'question'}]},
  {pageNumber:5,groups:[],entries:[{id:'e',kind:'diagram',description:'parabola'},{id:'f',kind:'question',continuesOnNextPage:true}]},
  {pageNumber:6,groups:[],entries:[{id:'g',kind:'part'}]},
  {pageNumber:7,groups:[{kind:'investigation',header:'Investigation Task'}],entries:[{id:'h',kind:'question'}]},
  {pageNumber:8,groups:[],entries:[{id:'i',kind:'part',description:'Hence confirm your answer from Question 1 (c).'}]},
  {pageNumber:9,groups:[],entries:[{id:'j',kind:'part',responseKind:'cloze'},{id:'k',kind:'diagram',exclusionReason:'decoration'}]},
 ];
 const r=recommendSamplePages(inv,{headings:[{page:4,header:'Fundamentals'}]});
 assert.deepEqual(r.pages,[2,3,4,5,6,7,8]);
 assert.deepEqual(r.reasons[6],['continuation of page 5']);
 assert.ok(r.reasons[7].includes('referenced from page 8'));
 assert.equal(samplePatternClasses(inv[7]).has('diagram'),false,'excluded entries add no pattern');
});

function sampleRun(t,{pages,v2=true}){
 const runDir=tmp(t),sampleDir=path.join(runDir,'sample'),manifest={id:'run',completionProfile:COMPLETION_PROFILE,...(v2?{importPolicy:IMPORT_POLICY,track:'textbook'}:{}),source:{pdfHash:'s'}};
 write(path.join(runDir,'manifest.json'),manifest);
 const p=project(pages*2),projectFile=path.join(runDir,'candidate.json');write(projectFile,p);
 for(let page=1;page<=pages;page++)write(path.join(runDir,'evidence','pages','page-'+String(page).padStart(3,'0')+'.png'),'source '+page);
 const pdf=path.join(sampleDir,'student.pdf');write(pdf,'pdf');
 const rows=[],hashes=[];
 for(let page=1;page<=pages;page++){const image=path.join(sampleDir,'r'+page+'.png');write(image,'raster '+page);const blocks=['q'+(2*page-1),'q'+(2*page)];rows.push({edition:'student',page,blocks,image});hashes.push({page,hash:'h'+page,blocks});}
 write(path.join(sampleDir,'layout-sample.json'),{ok:true,editions:['student'],pages:rows});
 write(path.join(sampleDir,'report.json'),{report:{p:{student:{pdf:{path:pdf,hash:digest('pdf')},pageHashes:hashes}}}});
 return {runDir,projectFile,sampleDir};
}

test('v2 sample review sends consecutive pages together, three calls at a time, and records every verdict',async t=>{
 const w=sampleRun(t,{pages:5}),calls=[];let active=0,peak=0;
 const runner=async({prompt,images})=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,5));active--;
  const pages=JSON.parse(prompt.slice(prompt.lastIndexOf('\n\n')+2)).pages.map(row=>row.page);calls.push({pages,images:images.length});
  return {result:{pages:pages.map(page=>({page,outcome:'accepted'}))}};};
 const result=await reviewImportSample({...w,runner});
 assert.equal(result.sampleAccepted,true);
 assert.deepEqual(calls.map(c=>c.pages).sort((a,b)=>a[0]-b[0]),[[1,2],[3,4],[5]]);
 assert.equal(calls.find(c=>c.pages[0]===1).images,4,'two rendered pages and their two source pages');
 assert.ok(peak>1&&peak<=3);
 assert.equal(Object.keys(loadReviewed(path.join(w.runDir,'lean-review')).pages).length,5);
});

test('a page left without a verdict keeps the v2 sample open; v1 runs keep one page per call',async t=>{
 const w=sampleRun(t,{pages:2});
 const partial=await reviewImportSample({...w,runner:async()=>({result:{pages:[{page:1,outcome:'accepted'}]}})});
 assert.equal(partial.sampleAccepted,false);
 const v1=sampleRun(t,{pages:2,v2:false}),seen=[];
 await reviewImportSample({...v1,runner:async({prompt})=>{const pages=JSON.parse(prompt.slice(prompt.lastIndexOf('\n\n')+2)).pages.map(r=>r.page);seen.push(pages);return {result:{pages:pages.map(page=>({page,outcome:'accepted'}))}};}});
 assert.deepEqual(seen,[[1],[2]]);
});
