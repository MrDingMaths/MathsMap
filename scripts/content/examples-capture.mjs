import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { hashValue } from './campaign-support.mjs';
import { getWorkedExamples } from '../../src/lib/theory-content.js';
const PRODUCER_HASH=hashValue(fs.readFileSync(new URL(import.meta.url)));
export function captureGeometryStable(before,after){
  return ['left','top','right','bottom'].every(key=>Number.isFinite(before?.[key])&&Number.isFinite(after?.[key])&&Math.abs(before[key]-after[key])<=1/16+1e-7);
}
export function enclosingCaptureClip(before,after){
  const x=Math.min(before.x,after.x),y=Math.min(before.y,after.y);
  return {x,y,width:Math.max(before.x+before.width,after.x+after.width)-x,height:Math.max(before.y+before.height,after.y+after.height)-y,scale:1};
}

const DEPENDENCIES = ['src/components/TheoryView.svelte','src/components/InlineContent.svelte','src/components/Math.svelte','src/components/Tikz.svelte','src/lib/theory-content.js','src/lib/booklet-teaching-alignment.js','src/lib/inline-content.js','src/lib/render-math.js','src/lib/document-content.js','src/lib/tikz.js','src/lib/tikz-prepare.js','src/app.css','src/views/SkillDetail.svelte'];
DEPENDENCIES.push(
  'scripts/content/examples-capture.mjs',
  'src/lib/math-writing-box.js','src/lib/graph-strokes.js','src/lib/diagram-label-space.js',
  'src/lib/diagram-typography.js','src/lib/diagram-label-geometry.js','src/lib/svg-paint-scope.js',
  'src/lib/diagram-colours.js','src/lib/booklet-render-cache.js',
  ...['document-model','annotated-equation','cloze-leader','cloze-answer','house-style','table-model','table-part-label','table-borders','equation-spacing','booklet-palette'].map(name=>`public/libs/maths-editor/${name}.mjs`),
  'node_modules/katex/dist/katex.mjs','node_modules/katex/dist/katex.min.css',
  'public/libs/tikzjax/tikzjax.js','public/libs/tikzjax/fonts.css',
);
const reference = (root, file) => ({path:path.relative(root,file).replaceAll('\\','/'),hash:hashValue(fs.readFileSync(file))});
async function nativeClip(page,cdp,locator,file,{padding=0,mathInk=false,fullOverflow=false}={}){
  padding += 0.125; // Enclose SVG subpixel rounding while retaining the exact stability check.
  for(let attempt=0;attempt<3;attempt++){
    await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
    const measure=()=>locator.evaluate((el,{padding,mathInk,fullOverflow})=>{
      const r=el.getBoundingClientRect(),ink=mathInk?[...el.querySelectorAll('.katex,.katex-html')].map(node=>node.getBoundingClientRect()):[];
      const left=Math.min(r.left,...ink.map(row=>row.left)),right=Math.max(r.right,fullOverflow?r.left+el.scrollWidth:r.right,...ink.map(row=>row.right));
      const x=Math.max(0,Math.floor(left+scrollX-padding)),y=Math.max(0,Math.floor(r.top+scrollY-padding));
      return{clip:{x,y,width:Math.ceil(right+scrollX+padding)-x,height:Math.ceil(r.bottom+scrollY+padding)-y,scale:1},bounds:{left:left+scrollX,top:r.top+scrollY,right:right+scrollX,bottom:r.bottom+scrollY}};
    },{padding,mathInk,fullOverflow});
    // One atomic DOM read supplies document coordinates. The stock element
    // screenshot reads a viewport rectangle and scroll offset separately.
    const first=await measure(),clip=first.clip;
    let shot=await cdp.send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});
    const after=await measure();
    if(JSON.stringify(clip)!==JSON.stringify(after.clip)){
      // SVG layout may quantize by 1/64 px during Chromium rasterization.
      // Re-capture the enclosure, never accept a cropped or meaningfully moved target.
      if(!captureGeometryStable(first.bounds,after.bounds))continue;
      const enclosure=enclosingCaptureClip(clip,after.clip);
      shot=await cdp.send('Page.captureScreenshot',{format:'png',clip:enclosure,captureBeyondViewport:true});
      const settled=await measure();
      if(!captureGeometryStable(first.bounds,settled.bounds)||settled.clip.x<enclosure.x||settled.clip.y<enclosure.y||settled.clip.x+settled.clip.width>enclosure.x+enclosure.width||settled.clip.y+settled.clip.height>enclosure.y+enclosure.height)continue;
      fs.writeFileSync(file,Buffer.from(shot.data,'base64'));
      return{...enclosure,layoutStability:{maximumCssPixelDelta:1/16,recapturedEnclosure:true}};
    }
    fs.writeFileSync(file,Buffer.from(shot.data,'base64'));return clip;
  }
  throw Error('Target layout moved during native screenshot; no capture accepted');
}

// Screenshots are evidence to inspect, never an assertion that inspection occurred.
// Intercept only this browser's request; the live content and server are untouched.
export async function captureExamples({root=process.cwd(),skillId,candidatePair,outDir,exampleIndices=null,theme='light',baseUrl=process.env.MATHSMAP_CAMPAIGN_BASE_URL||'http://127.0.0.1:5173',browser:sharedBrowser=null,viewports=[{name:'desktop',width:1280,height:900},{name:'mobile',width:390,height:844}]}) {
  if(!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(skillId||'')) throw Error('Invalid skillId');
  const content=candidatePair?.content;
  const examples=getWorkedExamples(content?.theory);
  if(!examples.length) throw Error('No worked examples to capture');
  const indices=exampleIndices??examples.map((_,i)=>i);
  if(!indices.length||indices.some(i=>!Number.isInteger(i)||i<0||i>=examples.length)||new Set(indices).size!==indices.length) throw Error('Invalid example selection');
  outDir=path.resolve(root,outDir||`.agywork/content-campaign/worked-examples-2026-09/examples-captures/${skillId}/${Date.now()}`);
  fs.mkdirSync(outDir,{recursive:true});
  if(hashValue(fs.readFileSync(new URL(import.meta.url)))!==PRODUCER_HASH)throw Error('Capture producer changed after loading; restart the dispatcher before capturing');
  const before=DEPENDENCIES.map(file=>reference(root,path.join(root,file)));
  const browser=sharedBrowser??await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({deviceScaleFactor:1});
  if(!['light','dark'].includes(theme))throw Error('Invalid theme');
  await context.addInitScript(theme=>localStorage.setItem('mathsmap.theme.v1',theme),theme);
  const rows=[],artifacts=[],errors=[];
  try {
    for(const viewport of viewports) {
      const page=await context.newPage();
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      await page.route(`**/content/${skillId}.json`,route=>route.fulfill({contentType:'application/json',body:JSON.stringify(content)}));
      await page.goto(`${baseUrl.replace(/\/$/,'')}/#/skill/${skillId}`,{waitUntil:'domcontentloaded'});
      // Compiling lazy diagrams must not move the viewport between the browser's
      // element measurement and screenshot. This changes capture behaviour only.
      await page.addStyleTag({content:'html, body, * { overflow-anchor:none !important; scroll-behavior:auto !important; } nav.top, .mobile-nav, .page-head { visibility:hidden !important; }'});
      const cdp=await context.newCDPSession(page);
      await page.locator('.theory .worked-example').first().waitFor({timeout:30000});
      if(await page.locator('.theory .worked-example').count()!==examples.length) throw Error('Rendered example count differs from candidate');
      // Earlier lazy diagrams can move later cards while they are compiling.
      // Settle the complete prefix before recording any document positions.
      for(let prefix=0;prefix<examples.length;prefix++){
        for(const diagram of await page.locator('.theory .worked-example').nth(prefix).locator('.tikz-wrap').all()){
          await diagram.scrollIntoViewIfNeeded();
          await diagram.locator('svg.tikz-svg').waitFor({state:'attached',timeout:180000});
        }
      }
      await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
      for(const index of indices) {
        const example=page.locator('.theory .worked-example').nth(index);
        await example.scrollIntoViewIfNeeded();
        for(const diagram of await example.locator('.tikz-wrap').all()) {
          await diagram.scrollIntoViewIfNeeded();
          await diagram.locator('svg.tikz-svg').waitFor({state:'attached',timeout:180000});
        }
        await example.evaluate(async el=>{
          await document.fonts.ready;
          await Promise.all([...el.querySelectorAll('img')].map(img=>img.complete?(img.naturalWidth?Promise.resolve():Promise.reject(Error('Image failed'))):new Promise((resolve,reject)=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',()=>reject(Error('Image failed')),{once:true});})));
          await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        });
        const readChecks=()=>example.evaluate(el=>{
          const q=el.querySelector('.example-question'),s=el.querySelector('.example-solution');
          const ink=(host,expected)=>{const bad=[];const walker=document.createTreeWalker(host,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){const parent=node.parentElement;if(!node.textContent.trim()||parent.closest('.tikz-wrap,svg,img,.katex-mathml,annotation'))continue;const colour=getComputedStyle(parent).color;const phantom=parent.closest('.katex') && [...parent.closest('.katex').querySelectorAll('[style],.katex-phantom')].find(el=>el.contains(parent)&&(el.style.color==='transparent'||el.classList.contains('katex-phantom')));if(phantom){if(colour!=='rgba(0, 0, 0, 0)'&&colour!=='transparent')bad.push({text:node.textContent.slice(0,70),colour,phantomVisible:true});continue;}if(colour==='rgba(0, 0, 0, 0)'||colour==='transparent')continue;if(colour!==expected)bad.push({text:node.textContent.slice(0,70),colour});}return bad;};
          const bounds=el.getBoundingClientRect();
          const lines=[...el.querySelectorAll('.text-line,.text-table,.inline-tikz')];
          const scrollableMath=lines.flatMap((line,lineIndex)=>{if((!line.querySelector('.katex')&&!line.matches('.text-table,.inline-tikz'))||line.scrollWidth<=line.clientWidth+2)return[];const before=line.scrollLeft,style=getComputedStyle(line);line.scrollLeft=line.scrollWidth;const reachedEnd=Math.abs(line.scrollLeft-(line.scrollWidth-line.clientWidth))<=2;const maxScrollLeft=line.scrollLeft;line.scrollLeft=before;return[{lineIndex,containerKind:line.matches('.inline-tikz')?'diagram':line.matches('.text-table')?'table':'math',clientWidth:line.clientWidth,scrollWidth:line.scrollWidth,maxScrollLeft,reachedEnd,overflowX:style.overflowX,mode:'horizontal-scroll'}];});
          const math=[...el.querySelectorAll('.katex')].filter(n=>!n.closest('.tikz-wrap'));
          const uncontainedMath=math.filter(n=>{const r=n.getBoundingClientRect();if(r.left>=bounds.left-2&&r.right<=bounds.right+2)return false;const line=n.closest('.text-line,.text-table,.inline-tikz');const scroll=scrollableMath.find(item=>lines[item.lineIndex]===line);return !scroll||!scroll.reachedEnd||!['auto','scroll'].includes(scroll.overflowX);});
          return {questionVisible:!!q?.textContent.trim(),solutionVisible:!!s?.textContent.trim(),fontsReady:document.fonts.status==='loaded',questionInkErrors:ink(q,'rgb(0, 0, 0)'),solutionInkErrors:ink(s,'rgb(38, 140, 255)'),katexErrors:el.querySelectorAll('.katex-error').length,diagramErrors:el.querySelectorAll('.tikz-error').length,diagramsReady:[...el.querySelectorAll('.tikz-wrap')].every(n=>n.querySelector('svg.tikz-svg')&&!n.querySelector('svg animate')&&[...n.querySelectorAll('svg.tikz-svg')].every(svg=>{const r=svg.getBoundingClientRect(),style=getComputedStyle(svg);return r.width>0&&r.height>0&&style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)>0;})),overflow:el.scrollWidth>el.clientWidth+2,mathOutsideExample:uncontainedMath.length,scrollableMath,width:bounds.width,height:bounds.height};
        });
        let checks=await readChecks();
        // A just-exposed lazy neighbour can start another font load after the
        // first ready promise. Recheck that bounded readiness race without
        // repeating authoring, mathematics or visual model calls.
        for(let retry=0;!checks.fontsReady&&retry<2;retry++){
          await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
          checks=await readChecks();
        }
        const row={index,viewport:viewport.name,itemHash:hashValue(examples[index]),...checks};rows.push(row);
        if(!checks.questionVisible||!checks.solutionVisible||!checks.fontsReady||checks.questionInkErrors.length||checks.solutionInkErrors.length||checks.katexErrors||checks.diagramErrors||!checks.diagramsReady||checks.overflow||checks.mathOutsideExample) errors.push(row);
        const file=path.join(outDir,`${viewport.name}-example-${index+1}.png`);
        const clip=await nativeClip(page,cdp,example,file);
        artifacts.push({...reference(root,file),index,viewport:viewport.name,kind:'example',itemHash:hashValue(examples[index]),framing:'actual target element; atomic document coordinates and stable native screenshot',clip});
        // Preserve the real mobile capture above. Additional line captures expose
        // all scrollable mathematical ink at its native glyph size without widening
        // surrounding prose or pretending this expanded view is the actual UI.
        for(const scroll of checks.scrollableMath){
          const line=example.locator('.text-line,.text-table,.inline-tikz').nth(scroll.lineIndex);
          const original=await line.evaluate(el=>({style:el.getAttribute('style'),scrollLeft:el.scrollLeft,children:[...el.querySelectorAll('.tikz-wrap')].map(child=>({style:child.getAttribute('style'),scrollLeft:child.scrollLeft}))}));
          try {
            const diagram=scroll.containerKind==='diagram';
            await line.evaluate((el,diagram)=>{el.scrollLeft=0;if(diagram){el.style.setProperty('overflow','visible','important');for(const child of el.querySelectorAll('.tikz-wrap')){child.scrollLeft=0;child.style.setProperty('overflow','visible','important');}}else{const width=el.scrollWidth;el.style.setProperty('width',width+'px','important');el.style.setProperty('max-width','none','important');el.style.setProperty('overflow','visible','important');}},diagram);
            const fullFile=path.join(outDir,viewport.name+'-example-'+(index+1)+'-'+scroll.containerKind+'-'+(scroll.lineIndex+1)+'-full-ink.png');
            const fullClip=await nativeClip(page,cdp,line,fullFile,{padding:16,mathInk:!diagram,fullOverflow:diagram});
            artifacts.push({...reference(root,fullFile),index,viewport:viewport.name,kind:scroll.containerKind+'-full-ink',lineIndex:scroll.lineIndex,itemHash:hashValue(examples[index]),clip:fullClip,scroll,framing:diagram?'Original diagram geometry and glyph sizes; only overflow clipping temporarily released.':'Overflowing calculation/table temporarily expanded; native glyph size and all other text wrapping retained.'});
          } finally {await line.evaluate((el,original)=>{for(const [index,child] of [...el.querySelectorAll('.tikz-wrap')].entries()){const saved=original.children[index];if(saved.style===null)child.removeAttribute('style');else child.setAttribute('style',saved.style);child.scrollLeft=saved.scrollLeft;}if(original.style===null)el.removeAttribute('style');else el.setAttribute('style',original.style);el.scrollLeft=original.scrollLeft;},original);}
        }
        // A second actual capture with solution hidden makes accidental answer leakage
        // into the question visible to the reviewer. Semantic leakage needs review.
        await example.locator('.example-solution').evaluate(el=>el.style.display='none');
        const hidden=await example.locator('.example-solution').evaluate(el=>getComputedStyle(el).display==='none'&&el.getBoundingClientRect().height===0);
        const qFile=path.join(outDir,`${viewport.name}-example-${index+1}-question.png`);
        const questionClip=await nativeClip(page,cdp,example,qFile);
        artifacts.push({...reference(root,qFile),index,viewport:viewport.name,kind:'question-only',solutionHidden:hidden,itemHash:hashValue(examples[index]),clip:questionClip});
        await example.locator('.example-solution').evaluate(el=>el.style.removeProperty('display'));
      }
      await page.close();
    }
  } finally {await context.close();if(!sharedBrowser)await browser.close();}
  const after=DEPENDENCIES.map(file=>reference(root,path.join(root,file)));
  if(JSON.stringify(before)!==JSON.stringify(after)) errors.push({dependencyChanged:true});
  const manifest={profile:'worked-examples-render-v1',theme,skillId,candidateHash:hashValue(candidatePair),theoryHash:hashValue(content.theory),capturedAt:new Date().toISOString(),baseUrl,browserVersion:browser.version(),dependencies:after,indices,rows,artifacts,passed:errors.length===0,errors,visualInspectionRequired:true,note:'Actual TheoryView renders. DOM checks do not establish visual inspection, mathematical correctness, diagram adequacy or semantic answer separation.'};
  const manifestPath=path.join(outDir,'capture.json');fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2));
  return {...manifest,manifest:reference(root,manifestPath)};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [skillId,candidateFile,outDir,baseUrl]=process.argv.slice(2);
  if(!skillId||!candidateFile)throw Error('Usage: node scripts/content/examples-capture.mjs SKILL CANDIDATE_JSON [OUT_DIR] [BASE_URL]');
  const result=await captureExamples({skillId,candidatePair:JSON.parse(fs.readFileSync(candidateFile)),outDir,baseUrl});
  console.log(JSON.stringify({skillId,passed:result.passed,manifest:result.manifest,errors:result.errors}));if(!result.passed)process.exitCode=1;
}
