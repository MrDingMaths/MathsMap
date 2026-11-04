import {layoutEquationAnnotations} from '../../public/libs/maths-editor/annotated-equation.mjs';
import {calibrateGraphStrokes} from './graph-strokes.js';
import {teachingLabels} from './booklet-labels.js';
import {isLeanReview,printableProject} from './booklet-review-profile.js';
import {settleBookletFonts} from './booklet-fonts.js';

// Two independent 53-bit lanes (cyrb53): collisions are negligible at booklet
// scale, and page keys stay short however large their blocks are.
function hashText(text){
  let a=0xdeadbeef,b=0x41c6ce57,c=0x9e3779b9,d=0x85ebca6b;
  for(let i=0;i<text.length;i++){const ch=text.charCodeAt(i);a=Math.imul(a^ch,2654435761);b=Math.imul(b^ch,1597334677);c=Math.imul(c^ch,2246822507);d=Math.imul(d^ch,3266489909);}
  a=Math.imul(a^(a>>>16),2246822507)^Math.imul(b^(b>>>13),3266489909);b=Math.imul(b^(b>>>16),2246822507)^Math.imul(a^(a>>>13),3266489909);
  c=Math.imul(c^(c>>>16),2246822507)^Math.imul(d^(d>>>13),3266489909);d=Math.imul(d^(d>>>16),2246822507)^Math.imul(c^(c>>>13),3266489909);
  return (4294967296*(2097151&b)+(a>>>0)).toString(36)+'.'+(4294967296*(2097151&d)+(c>>>0)).toString(36)+'.'+text.length.toString(36);
}

// Only presentation settings used by these blocks invalidate their dimensions.
// Build each block signature once per calculation, including calculated labels;
// a page key holds signature hashes, not the signatures themselves.
export function measurementKeyFor(project,options={}) {
  const lean=isLeanReview(project);
  const signatures=new WeakMap(),overrides=project.settings.layoutOverrides??{};
  const labels=teachingLabels(project.sections.flatMap(s=>s.blocks));
  const {layoutOverrides,cover,...settings}=lean?printableProject({settings:project.settings}).settings:project.settings;
  const context=hashText(JSON.stringify([project.id,project.source?.runId,settings,options]));
  const signature=(block,mode,phase)=>{
    const variant=mode+':'+phase;
    const cached=signatures.get(block);
    if(cached?.has(variant))return cached.get(variant);
    const ids=new Set();
    const visit=value=>{if(!value||typeof value!=='object')return;if(value.id)ids.add(value.id);for(const child of Object.values(value))Array.isArray(child)?child.forEach(visit):visit(child);};
    visit(block);
    const pick=map=>[...ids].filter(id=>Object.hasOwn(map??{},id)).map(id=>[id,map[id]]);
    const printable=lean?printableProject({sections:[{phase,blocks:[block]}]},mode).sections[0].blocks[0]:block;
    const value=hashText(JSON.stringify([printable,pick(overrides.blockLayouts),pick(overrides.answerSpaces),pick(overrides.diagramColourModes),pick(labels)]));
    const modes=cached??new Map();modes.set(variant,value);signatures.set(block,modes);return value;
  };
  return page=>{
    const section=Object.fromEntries(Object.entries(page.section).filter(([key])=>key!=='blocks'));
    const metadata=lean?printableProject({sections:[{...section,blocks:[]}]},page.mode).sections[0]:section;
    return JSON.stringify([context,page.isCover?cover:null,metadata,page.isCover,page.compactAnswers,page.shortAnswerProbe,page.showTopicHeading,page.showDifficultyHeading,page.showAnswerHeading,page.mode,page.columns?.map(c=>c.map(e=>[e.section.exerciseNumber,e.section.topicTitle,e.labelWidthMm,e.block.flow?.answerFragment,e.shortRow,e.shortColumns])),page.answerBands?.map(band=>band.length),page.blocks.map(block=>signature(block,page.mode,page.section.phase))]);
  };
}

// Measurements need settled assets and a synchronous layout, not several paint
// frames per candidate. Export retains its separate, comprehensive settle check.
export async function settleBookletMeasurement(root,{signal,timeoutMs=300000,calibrate=calibrateGraphStrokes}={}) {
  if(!root)throw Error('Booklet surface is missing');
  const aborted=()=>Object.assign(Error('Pagination superseded'),{cancelled:true});
  const check=()=>{if(signal?.aborted)throw aborted();};
  const wait=promise=>new Promise((resolve,reject)=>{
    const abort=()=>{cleanup();reject(aborted());};
    const timer=setTimeout(()=>{cleanup();reject(Error('Booklet assets timed out'));},timeoutMs);
    const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);};
    signal?.addEventListener('abort',abort,{once:true});
    promise.then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});
    if(signal?.aborted)abort();
  });
  check();
  const diagramsReady=()=>[...root.querySelectorAll('.tikz-wrap')].every(e=>e.querySelector('svg:not(:has(animate)),.tikz-error'));
  const waitForDiagrams=async()=>{
    // Preview pages can be outside the viewport while pagination is settling.
    // Start their queued diagrams through the same API used by print settling.
    if(globalThis.TikZ?.flushPending){
      const flushed=await wait(globalThis.TikZ.flushPending(root,timeoutMs));
      check();
      if(!flushed)throw Error('Diagram queue timed out');
    }
    return new Promise((resolve,reject)=>{
      const finish=error=>{observer.disconnect();clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve();};
      const abort=()=>finish(aborted());
      const observer=new MutationObserver(()=>{if(diagramsReady())finish();});
      const timer=setTimeout(()=>finish(Error('Diagram queue timed out')),timeoutMs);
      observer.observe(root,{childList:true,subtree:true});
      signal?.addEventListener('abort',abort,{once:true});
      if(signal?.aborted)abort();else if(diagramsReady())finish();
    });
  };
  if(!diagramsReady())await waitForDiagrams();
  check();
  await wait(Promise.all([...root.querySelectorAll('img')].map(async image=>{
    if(image.complete&&image.naturalWidth>0)return;
    try{await image.decode();}catch{if(root.contains(image))throw Error('Image failed to decode: '+image.currentSrc);}
  })));
  // Force style/layout to request fonts used by newly inserted SVG and maths.
  root.getBoundingClientRect();
  await wait(settleBookletFonts(root));
  check();
  // Image/font waits can allow newly mounted diagrams to join the surface.
  if(!diagramsReady())await waitForDiagrams();
  check();
  if(root.querySelector('[data-type="annotated-equation"]'))layoutEquationAnnotations(root);
  calibrate(root);
  if(root.querySelector('.tikz-error,.katex-error'))throw Error('Mathematics failed to render');
  if(!diagramsReady())throw Error('A diagram has not rendered');
}
