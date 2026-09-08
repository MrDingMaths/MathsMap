import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {measurementKeyFor,settleBookletMeasurement} from '../src/lib/booklet-measurement.js';

const fixture=()=>({id:'booklet',source:{runId:'source'},settings:{houseStyleVersion:1,layoutOverrides:{blockLayouts:{q:{columns:2}},answerSpaces:{part:20},diagramColourModes:{diagram:'colour'}}},sections:[{blocks:[{id:'q',type:'question',content:{id:'root',children:[{id:'part',prompt:'Calculate.',diagram:{id:'diagram'}}]}}]}]});
const pageFor=project=>({section:{title:'Linear',difficultyTitle:'Foundation'},showTopicHeading:true,showDifficultyHeading:true,mode:'student',blocks:project.sections[0].blocks});
const key=(project,options={})=>measurementKeyFor(project,options)(pageFor(project));

test('measurement cache retains unaffected content after another item is copied or edited',()=>{
 const project=fixture(),before=key(project);
 project.sections.push({blocks:[{id:'copy',type:'question',content:{id:'copy-root',prompt:'New question'}}]});
 project.settings.layoutOverrides.blockLayouts.copy={columns:3};
 project.settings.layoutOverrides.answerSpaces['copy-root']=40;
 project.settings.layoutOverrides.diagramColourModes['copy-diagram']='mono';
 assert.equal(key(project),before);
});

test('measurement cache invalidates content, labels, relevant overrides and rendering context',()=>{
 const changes=[
  p=>p.sections[0].blocks[0].content.children[0].prompt='A longer question.',
  p=>p.sections[0].blocks[0].displayNumber='100',
  p=>p.settings.layoutOverrides.blockLayouts.q.columns=1,
  p=>p.settings.layoutOverrides.answerSpaces.part=40,
  p=>p.settings.layoutOverrides.diagramColourModes.diagram='mono',
  p=>p.settings.houseStyleVersion=2,
  p=>p.source.runId='another-source',
 ];
 for(const change of changes){const p=fixture(),before=key(p);change(p);assert.notEqual(key(p),before);}
 const p=fixture();assert.notEqual(key(p,{showTheorySolutions:false}),key(p,{showTheorySolutions:true}));
 for(const change of [page=>page.mode='worked',page=>page.section.title='Gradient',page=>page.section.difficultyTitle='Development',page=>page.section.headingStyle='compact',page=>page.showTopicHeading=false,page=>page.showDifficultyHeading=false]){
  const page=pageFor(p),keyFor=measurementKeyFor(p),before=keyFor(page);change(page);assert.notEqual(keyFor(page),before);
 }
});

test('measurement cache tracks teaching labels affected by preceding teaching content',()=>{
 const p=fixture();p.sections[0].blocks[0].sourceAtom={id:'shared-example',kind:'example'};
 const page=pageFor(p),before=measurementKeyFor(p)(page);
 p.sections.unshift({blocks:[{id:'earlier',type:'question',sourceAtom:{id:'shared-example',kind:'example'},content:{id:'earlier-part',prompt:'Earlier part'}}]});
 assert.notEqual(measurementKeyFor(p)(page),before);
});

test('measurement waits for late diagrams, images and fonts without fixed animation frames',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();await page.setContent('<main><div class="tikz-wrap"><svg><animate/></svg></div></main>');
  const result=await page.evaluate(async fn=>{
   const settle=(new Function('return ('+fn+')'))(),root=document.querySelector('main'),events=[];
   window.requestAnimationFrame=()=>{throw Error('Measurement must not wait for paint frames');};
   let imageReady,fontReady;
   const image={complete:false,decode:()=>new Promise(resolve=>{imageReady=resolve;events.push('decode');})};
   const fonts=new Promise(resolve=>{fontReady=resolve;});
   const surface={querySelectorAll:s=>s==='img'?[image]:root.querySelectorAll(s),querySelector:s=>root.querySelector(s),contains:()=>true,ownerDocument:{fonts:{ready:fonts}},getBoundingClientRect:()=>{events.push('layout');return root.getBoundingClientRect();}};
   // The observer needs an actual DOM node; delay its SVG first, then exercise
   // image/font promises through a surface with controlled asset completion.
   const diagrams=settle(root,{calibrate:()=>events.push('diagram-ready')});
   await new Promise(resolve=>setTimeout(resolve,10));const pending=events.length===0;
   root.querySelector('animate').remove();await diagrams;
   const assets=settle(surface,{calibrate:()=>events.push('calibrated')});
   await Promise.resolve();imageReady();await new Promise(resolve=>setTimeout(resolve,0));
   const heldForFont=!events.includes('calibrated');fontReady();await assets;
   return{pending,heldForFont,events};
  },settleBookletMeasurement.toString());
  assert.equal(result.pending,true);assert.equal(result.heldForFont,true);
  assert.deepEqual(result.events,['diagram-ready','decode','layout','calibrated']);
 }finally{await browser.close();}
});

test('measurement cancels stale asset waits and reports failed or timed-out assets',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();await page.setContent('<main><div class="tikz-wrap"></div></main>');
  const result=await page.evaluate(async fn=>{
   const settle=(new Function('return ('+fn+')'))(),root=document.querySelector('main'),controller=new AbortController();
   const pending=settle(root,{signal:controller.signal,calibrate:()=>{}}).catch(e=>e.cancelled);controller.abort();
   const cancelled=await pending;
   const timeout=await settle(root,{timeoutMs:10,calibrate:()=>{}}).catch(e=>e.message);
   root.innerHTML='<div class="tikz-wrap"><span class="tikz-error">Failed</span></div>';
   const failed=await settle(root,{calibrate:()=>{}}).catch(e=>e.message);
   root.innerHTML='';let decodeStarted=false;
   const image={complete:false,currentSrc:'broken.png',decode:async()=>{decodeStarted=true;throw Error('Broken');}};
   const surface={querySelectorAll:s=>s==='img'?[image]:[],contains:()=>true};
   const brokenImage=await settle(surface,{calibrate:()=>{}}).catch(e=>e.message);
   const fontController=new AbortController();
   const fontSurface={querySelectorAll:()=>[],ownerDocument:{fonts:{ready:new Promise(()=>{})}},getBoundingClientRect:()=>({})};
   const fontPending=settle(fontSurface,{signal:fontController.signal,calibrate:()=>{}}).catch(e=>e.cancelled);
   await new Promise(resolve=>setTimeout(resolve,0));fontController.abort();
   return{cancelled,timeout,failed,decodeStarted,brokenImage,fontCancelled:await fontPending};
  },settleBookletMeasurement.toString());
  assert.deepEqual(result,{cancelled:true,timeout:'Diagram queue timed out',failed:'Mathematics failed to render',decodeStarted:true,brokenImage:'Image failed to decode: broken.png',fontCancelled:true});
 }finally{await browser.close();}
});
