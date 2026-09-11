import {BOOKLET_HOUSE_STYLE} from '../../public/libs/maths-editor/house-style.mjs';
export const SHORT_ANSWER_INK=BOOKLET_HOUSE_STYLE.shortAnswers.ink;
const decorative=new Set(['#056fdb','#268cff','blue','answerblue']);
const isDecorative=value=>decorative.has(String(value).trim().toLowerCase());
// Preserve TeX groups and semantic colours. Rich text may record colourMeaning
// when a series identifier uses the same blue as legacy decorative answer ink.
export function normaliseShortAnswer(value) {
  if(typeof value==='string')return value.split(/(\[tikz\][\s\S]*?\[\/tikz\])/g).map((part,i)=>i%2?part:part.replace(/\\(?:textcolor|color)\s*\{([^{}]+)\}/g,(all,colour)=>isDecorative(colour)?'':all)).join('');
  if(!value||typeof value!=='object')return value;
  if(value.colourMeaning||value.colorMeaning||['tikz','image'].includes(value.format)||['image','diagram'].includes(value.type))return structuredClone(value);
  if(Array.isArray(value))return value.map(normaliseShortAnswer);
  const next={};
  for(const[key,child]of Object.entries(value)){
    if(['colour','color'].includes(key)&&isDecorative(child))continue;
    next[key]=['text','latex'].includes(key)?normaliseShortAnswer(child):typeof child==='object'?normaliseShortAnswer(child):child;
  }
  return next;
}

export function inspectShortAnswerColours(root) {
  const issues=[],runs=[];
  for(const answer of root.querySelectorAll('.short-answer-key')){
    const walker=document.createTreeWalker(answer,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode,element=node.parentElement,text=node.textContent.trim();
      if(!text||element.closest('svg,math,annotation,button,.katex-mathml,.edit-badge,.diagram-resize-shell,.draft-status,.muted'))continue;
      if(!element.getClientRects().length)continue;
      const colour=getComputedStyle(element).color,semantic=!!element.closest('[data-colour-meaning]')||/^[✓✔×✗]+$/.test(text);
      runs.push({text,colour,semantic});
      if(!semantic&&colour!=='rgb(36, 40, 45)')issues.push({kind:'short-answer-colour',id:element.closest('[data-node-id]')?.dataset.nodeId,text,colour});
    }
  }
  return {runs,issues};
}
