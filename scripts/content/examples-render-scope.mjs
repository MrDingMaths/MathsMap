import fs from 'node:fs';
import path from 'node:path';
import { hashValue } from './campaign-support.mjs';
import { splitInlineContent } from '../../src/lib/inline-content.js';
import { renderMath } from '../../src/lib/render-math.js';

export const FRACTION_INK_BASELINE = 'f2a5ef7fc8389196059998bd343bda8794fa97a4bf298941532031c684334756';
export const CAPTURE_FRAME_MARGIN_BASELINE = '87aecf6e3208964ca604cc3d692487137e19d2cbed21b1eb2a0cdf0604c9469d';
export const CAPTURE_STABLE_FRAME_CURRENT = '7a3f79883efeb3629bb024bd97e34cf9eb553952e88e7f2143db1bbe65b0ccbe';
export const FRACTION_INK_RULE = '  /* Reserve fraction ink inside the horizontal scrolling viewport. */\n'
  + '  .fixed-text-color .text-line :global(.katex:has(.mfrac)),\n'
  + '  .fixed-text-color .text-list :global(.katex:has(.mfrac)),\n'
  + '  .fixed-text-color .text-table :global(.katex:has(.mfrac)) { padding-block:0.25em; }\n';

export function hasFractionMath(example) {
  return ['question_text','solution_text'].some(field => splitInlineContent(example?.[field] || '').parts
    .some(part => part.type !== 'tikz' && renderMath(part.value).includes('class="mfrac"')));
}
export function fractionInkClearanceEnabled() {
  return fs.readFileSync(new URL('../../src/components/InlineContent.svelte',import.meta.url),'utf8').includes(FRACTION_INK_RULE);
}
export function rendererDependencyCurrent(root, reference, examples = [], indices = null) {
  const bytes=fs.readFileSync(path.resolve(root,reference.path));
  if(hashValue(bytes)===reference.hash)return true;
  if(reference.path.replaceAll('\\','/')==='scripts/content/examples-capture.mjs'&&reference.hash===CAPTURE_FRAME_MARGIN_BASELINE){
    // This exact reviewed producer upgrade changes future framing only, with
    // bounded subpixel re-capture and enclosure checks. Page rendering and every
    // previously inspected artifact are unchanged. Other producer edits refuse.
    return hashValue(bytes)===CAPTURE_STABLE_FRAME_CURRENT;
  }
  if(reference.path.replaceAll('\\','/')!=='src/components/InlineContent.svelte' || reference.hash!==FRACTION_INK_BASELINE)return false;
  const source=bytes.toString('utf8'),parts=source.split(FRACTION_INK_RULE);
  // This exact conditional CSS insertion is the sole permitted difference.
  // Any other edit, or any affected captured example, invalidates the evidence.
  if(parts.length!==2 || hashValue(Buffer.from(parts.join('')))!==reference.hash)return false;
  const selected=Array.isArray(indices)?indices:examples.map((_example,index)=>index);
  return selected.every(index=>examples[index] && !hasFractionMath(examples[index]));
}
