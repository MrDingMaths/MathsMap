import {calibrateGraphStrokes} from './graph-strokes.js';
import {teachingLabels} from './booklet-labels.js';

// Only presentation settings used by these blocks invalidate their dimensions.
// Build each block signature once per calculation, including calculated labels.
export function measurementKeyFor(project,options={}) {
  const signatures=new WeakMap(),overrides=project.settings.layoutOverrides??{};
  const labels=teachingLabels(project.sections.flatMap(s=>s.blocks));
  const context=JSON.stringify([project.id,project.source?.runId,project.settings.houseStyleVersion,project.settings.compactAnswers,project.settings.exerciseOrganisation,options]);
  const signature=block=>{
    if(signatures.has(block))return signatures.get(block);
    const ids=new Set();
    const visit=value=>{if(!value||typeof value!=='object')return;if(value.id)ids.add(value.id);for(const child of Object.values(value))Array.isArray(child)?child.forEach(visit):visit(child);};
    visit(block);
    const pick=map=>[...ids].filter(id=>Object.hasOwn(map??{},id)).map(id=>[id,map[id]]);
    const value=JSON.stringify([block,pick(overrides.blockLayouts),pick(overrides.answerSpaces),pick(overrides.diagramColourModes),pick(labels)]);
    signatures.set(block,value);return value;
  };
  return page=>JSON.stringify([context,page.section.title,page.section.difficultyTitle,page.section.headingStyle,page.showTopicHeading,page.showDifficultyHeading,page.showAnswerHeading,page.mode,page.columns?.map(c=>c.map(e=>[e.section.exerciseNumber,e.section.topicTitle,e.labelWidthMm,e.block.flow?.answerFragment])),page.blocks.map(signature)]);
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
  if(!diagramsReady())await new Promise((resolve,reject)=>{
    const finish=error=>{observer.disconnect();clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve();};
    const abort=()=>finish(aborted());
    const observer=new MutationObserver(()=>{if(diagramsReady())finish();});
    const timer=setTimeout(()=>finish(Error('Diagram queue timed out')),timeoutMs);
    observer.observe(root,{childList:true,subtree:true});
    signal?.addEventListener('abort',abort,{once:true});
    if(signal?.aborted)abort();else if(diagramsReady())finish();
  });
  check();
  await wait(Promise.all([...root.querySelectorAll('img')].map(async image=>{
    if(image.complete&&image.naturalWidth>0)return;
    try{await image.decode();}catch{if(root.contains(image))throw Error('Image failed to decode: '+image.currentSrc);}
  })));
  // Force style/layout to request fonts used by newly inserted SVG and maths.
  root.getBoundingClientRect();
  await wait(root.ownerDocument.fonts.ready);
  check();calibrate(root);
  if(root.querySelector('.tikz-error,.katex-error'))throw Error('Mathematics failed to render');
  if(!diagramsReady())throw Error('A diagram has not rendered');
}
