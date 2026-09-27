// Proposed destination: tests/annotated-equation-box-anchors.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import katex from 'katex';
import {renderAnnotatedEquation} from '../public/libs/maths-editor/annotated-equation.mjs';
import {documentHtml} from '../src/lib/document-content.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const render=n=>renderAnnotatedEquation(n,{e:escape,editable:false,render:blocks=>documentHtml({blocks}),math:(latex,display,ids)=>katex.renderToString(latex,{throwOnError:true,displayMode:false,strict:code=>code==='htmlExtension'?'ignore':'warn',trust:c=>c.command==='\\htmlId'&&ids.includes(c.id)})});
const label=(id,targetId,placement,text)=>({id,targetId,placement,colour:'#000000',decoration:'arrow',blocks:[{id:id+'-text',type:'paragraph',inlines:[{type:'math',latex:`\\boxed{\\text{${text}}}`,display:false}]}]});
const base={type:'annotated-equation',fontSize:null,width:46,gap:4,margin:0,arrowSpace:0,align:'left'};
// Compact native mean scaffold: the two 11mm blanks sit in a real fraction.
// The result blank, source-supported labels and box struts retain their sizes.
const blank=width=>`{\\color{#cccccc}\\boxed{\\rule{0pt}{5mm}\\hspace{${width}mm}}}`;
const numerator=blank(11),denominator=blank(11),result=blank(13);
const fractionLatex=`\\frac{${numerator}}{${denominator}}\\approx${result}`;
const first=fractionLatex.indexOf(numerator),second=fractionLatex.indexOf(denominator,first+numerator.length);
const scaffold={...base,id:'mean-scaffold',latex:fractionLatex,anchors:[{id:'numerator',start:first,end:first+numerator.length,text:numerator},{id:'denominator',start:second,end:second+denominator.length,text:denominator}],annotations:[label('add','numerator','above','Add scores'),label('count','denominator','below','No. of scores')]};
const one=(id,latex)=>({...base,id,latex,anchors:[{id:'term',start:0,end:latex.length,text:latex}],annotations:[label(id+'-label','term','above','Term')]});
const cases=[
 {id:'scaffold',node:scaffold,boxOnly:true},
 {id:'boxed-symbol',node:one('boxed-symbol','\\boxed{x}'),boxOnly:true},
 {id:'plain',node:one('plain','m')},
 {id:'mixed',node:one('mixed','\\boxed{x}+y')},
 {id:'outer-power',node:one('outer-power','\\boxed{x}^{2}')},
 {id:'outer-fraction',node:one('outer-fraction','\\frac{\\boxed{x}}{y}')},
 {id:'multiple-boxes',node:one('multiple-boxes','\\boxed{x}+\\boxed{y}')},
 {id:'hidden-box',node:one('hidden-box','\\boxed{x}'),css:'.hidden-box [data-equation-formula] .fbox{visibility:hidden}'},
 {id:'zero-box',node:one('zero-box','\\boxed{x}'),css:'.zero-box [data-equation-formula] .fbox{display:none}'},
 {id:'connections',node:{...base,id:'connections',latex:'y=mx+c',anchors:[{id:'m',start:2,end:3,text:'m'},{id:'c',start:5,end:6,text:'c'}],annotations:[],connections:[{id:'mc',fromId:'m',toId:'c',colour:'#000000',height:3}]}}
];

test('equation arrows respect complete box borders without changing mixed/plain targets or term connections',async()=>{
 // Serve only the canonical module and installed KaTeX assets. No application
 // server, project files, ignored run artifacts or captured renderer copy.
 const server=http.createServer((req,res)=>{
  let file;
  if(req.url==='/renderer.mjs')file=path.join(ROOT,'public/libs/maths-editor/annotated-equation.mjs');
  else if(req.url==='/katex.css')file=path.join(ROOT,'node_modules/katex/dist/katex.css');
  else if(/^\/fonts\/[a-zA-Z0-9_.-]+\.(woff2?|ttf)$/.test(req.url))file=path.join(ROOT,'node_modules/katex/dist',req.url.slice(1));
  else if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head></head><body></body></html>');return;}
  else{res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
  const page=await browser.newPage({viewport:{width:1600,height:1100}}),url=`http://127.0.0.1:${server.address().port}`;
  await page.goto(url);await page.addStyleTag({url:url+'/katex.css'});
  await page.addStyleTag({content:'body{font-family:"Segoe UI",sans-serif;font-size:11pt;margin:20px}.case{width:190mm;transform-origin:top left;margin-bottom:40px}p{margin:0}'+cases.map(c=>c.css??'').join('\n')});
  for(const zoom of[0.75,1,1.5]){
   await page.evaluate(html=>{document.body.innerHTML=html;},cases.map(c=>`<div class="case ${c.id}" data-case="${c.id}" style="transform:scale(${zoom})">${render(c.node)}</div>`).join(''));
   const rows=await page.evaluate(async()=>{
    await document.fonts.ready;
    const {mountEquationAnnotations}=await import('/renderer.mjs');
    const rect=e=>{const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const containers=[...document.querySelectorAll('.case')];
    const dimensions=container=>[...container.querySelectorAll('[data-equation-formula] .fbox')].map(e=>{const r=rect(e);return{width:r.width,height:r.height};});
    const before=containers.map(dimensions),mounts=containers.map(mountEquationAnnotations);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const rows=containers.map((container,caseIndex)=>{
     const figure=container.querySelector('figure'),svg=figure.querySelector(':scope > svg'),paths=[...svg.querySelectorAll('path')];let pathIndex=0;
     const world=(x,y)=>{const p=svg.createSVGPoint();p.x=x;p.y=y;const r=p.matrixTransform(svg.getScreenCTM());return{x:r.x,y:r.y};};
     const numbers=p=>p.getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
     const anchor=index=>figure.querySelector(`[id="ae-${figure.dataset.equationInstance}-${index}"]`);
     const arrows=[...figure.querySelectorAll('[data-equation-label]')].map(label=>{
      const target=anchor(label.dataset.targetIndex),values=numbers(paths[pathIndex++]);
      return{side:label.dataset.side,target:rect(target),boxes:[...target.querySelectorAll('.fbox')].map(rect),tip:world(values[2],values[3])};
     });
     const connection=container.dataset.case==='connections'?(()=>{const v=numbers(paths[0]);return{from:rect(anchor(0)),to:rect(anchor(1)),start:world(v[0],v[1]),control1:world(v[2],v[3]),control2:world(v[4],v[5]),end:world(v[6],v[7]),scale:svg.getScreenCTM().d};})():null;
     return{id:container.dataset.case,before:before[caseIndex],after:dimensions(container),arrows,connection};
    });
    mounts.forEach(m=>m.destroy());return rows;
   });
   const close=(actual,expected,note)=>assert.ok(Math.abs(actual-expected)<0.25,`${note} at zoom ${zoom}: ${actual} vs ${expected}`);
   for(const row of rows){
    const fixture=cases.find(c=>c.id===row.id);
    assert.deepEqual(row.after,row.before,`${row.id}: drawing does not change writing-box dimensions at zoom ${zoom}`);
    for(const a of row.arrows){
     const bounds=fixture.boxOnly?a.boxes[0]:a.target;
     close(a.tip.x,bounds.left+bounds.width/2,`${row.id}: correct target centre`);
     close(a.tip.y,a.side==='above'?bounds.top-2:bounds.bottom+2,`${row.id}: two-pixel edge clearance`);
     if(fixture.boxOnly)assert.ok(a.tip.y<a.boxes[0].top||a.tip.y>a.boxes[0].bottom,`${row.id}: visible tip stays outside the writing area`);
    }
    if(row.connection){const c=row.connection,top=Math.min(c.from.top,c.to.top-c.scale)-3*96/25.4*c.scale;
     close(c.start.x,c.from.left+c.from.width/2,'connection start x');close(c.start.y,c.from.top,'connection start y');
     close(c.end.x,c.to.left+c.to.width/2,'connection end x');close(c.end.y,c.to.top-c.scale,'connection one-local-pixel end clearance');
     close(c.control1.y,top,'connection 3mm curve');close(c.control2.y,top,'connection 3mm curve');
    }
   }
  }

  // Production print copies are measurable while hidden, then become visible
  // without a resize. The actual media transition must redraw the box target.
  await page.addStyleTag({content:'@media screen{.print-transition{visibility:hidden}}@media print{.print-transition{visibility:visible}}'});
  await page.evaluate(html=>{document.body.innerHTML='<div class="print-transition">'+html+'</div>';},render(scaffold));
  await page.evaluate(async()=>{await document.fonts.ready;const {mountEquationAnnotations}=await import('/renderer.mjs');window.printTransitionMount=mountEquationAnnotations(document.querySelector('.print-transition'));});
  const transitionGeometry=()=>page.evaluate(async()=>{
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   const f=document.querySelector('.print-transition figure'),svg=f.querySelector(':scope > svg'),paths=[...svg.querySelectorAll('path')];
   return [...f.querySelectorAll('[data-equation-label]')].map((label,index)=>{
    const target=f.querySelector('[id="ae-'+f.dataset.equationInstance+'-'+label.dataset.targetIndex+'"]'),box=target.querySelector('.fbox'),bounds=box.getBoundingClientRect(),wrapper=target.getBoundingClientRect(),values=paths[index].getAttribute('d').match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number),point=svg.createSVGPoint();point.x=values[2];point.y=values[3];const tip=point.matrixTransform(svg.getScreenCTM());
    return{side:label.dataset.side,tipY:tip.y,top:bounds.top,bottom:bounds.bottom,wrapperTop:wrapper.top,wrapperBottom:wrapper.bottom,visibility:getComputedStyle(box).visibility};
   });
  });
  for(const a of await transitionGeometry()){assert.equal(a.visibility,'hidden');assert.ok(Math.abs(a.tipY-(a.side==='above'?a.wrapperTop-2:a.wrapperBottom+2))<.25,'Hidden print mount uses the unchanged fallback');}
  await page.emulateMedia({media:'print'});
  for(const a of await transitionGeometry()){assert.equal(a.visibility,'visible');assert.ok(Math.abs(a.tipY-(a.side==='above'?a.top-2:a.bottom+2))<.25,'Real print-media transition redraws both box-edge endpoints');assert.ok(a.tipY<a.top||a.tipY>a.bottom,'Printed tip stays outside the writing area');}
  await page.evaluate(()=>window.printTransitionMount.destroy());
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
