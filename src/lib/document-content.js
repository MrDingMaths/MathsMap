import { DOCUMENT_FORMAT, normalizeDocument, fromSource, toSource, exportSource, renderDocument } from '../../public/libs/maths-editor/document-model.mjs';
import { renderMath } from './render-math.js';
import katex from 'katex';
export { DOCUMENT_FORMAT, normalizeDocument, fromSource, toSource, exportSource };
export const isDocument = value => value?.format === DOCUMENT_FORMAT;
export const contentSource = value => isDocument(value) ? toSource(value) : String(value ?? '');
export const contentValue = value => isDocument(value) ? normalizeDocument(value) : String(value ?? '');
// Blank editor paragraphs are not layout spacers. Keep structural content (tables,
// images, cloze answers and explicit spacers) even when it has no literal text.
export function hasVisibleContent(value) {
  const nonblank = text => String(text ?? '').replace(/[\s\u200b\ufeff]/g, '').length > 0;
  if (!isDocument(value)) return nonblank(value);
  return value.blocks.some(block => block.type !== 'paragraph' || block.preserveEmpty || block.inlines?.some(inline =>
    inline.type === 'text' ? nonblank(inline.text) : inline.type === 'math' ? nonblank(inline.latex) : !['break', 'tab'].includes(inline.type)
  ));
}
export const documentHtml = (value, options = {}) => renderDocument(value, { ...options, math:(latex,display) => renderMath((display?'$$':'$')+(display||options.mathsStyle==='display-glyphs'?'':'\\textstyle ')+latex+(display?'$$':'$')), annotationMath:(latex,display,ids)=>katex.renderToString((options.mathsStyle==='display-glyphs'?'\\displaystyle ':'')+latex,{throwOnError:false,displayMode:false,strict:code=>code==='htmlExtension'?'ignore':'warn',trust:context=>context.command==='\\htmlId'&&ids.includes(context.id)}) });
export function storageValue(doc) {
  return normalizeDocument(doc);
}
// MathLive 0.109 disposes a focused field when it leaves the DOM without
// blurring it, so its static focus tracker keeps the dead field. Re-rendering
// a paragraph while its equation is focused then made the next focus() blur
// that field and throw "Cannot read properties of undefined (reading 'options')".
// The internal Mathfield class is reachable only from a mounted field.
function guardMathLiveFocus() {
  const patch=field=>{
    const Mathfield=field?.constructor,dispose=Mathfield?.prototype?.dispose;
    if(typeof dispose!=='function'||dispose.focusGuarded)return !!dispose?.focusGuarded;
    const guarded=function(){if(Mathfield._globallyFocusedMathfield===this)Mathfield._globallyFocusedMathfield=undefined;return dispose.call(this);};
    guarded.focusGuarded=true;Mathfield.prototype.dispose=guarded;return true;
  };
  if(patch(document.querySelector('math-field')?._mathfield))return;
  const mounted=e=>{if(patch(e.target?._mathfield))document.removeEventListener('mount',mounted,true);};
  document.addEventListener('mount',mounted,true);
}
let loading;
export function loadDocumentEditor() {
  if(loading)return loading;
  loading=(async()=>{
    const base='/libs/maths-editor/';
    for(const name of ['vendor/mathlive-static.css','document-editor.css','palette/palette.css']) {
      if(document.querySelector(`link[data-maths-editor="${name}"]`))continue;
      const link=document.createElement('link');link.rel='stylesheet';link.href=base+name;link.dataset.mathsEditor=name;document.head.append(link);
    }
    const script=src=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=base+src;el.onload=resolve;el.onerror=()=>reject(new Error('Could not load '+src));document.head.append(el);});
    if(!customElements.get('math-field'))await script('vendor/mathlive.min.js');
    window.MathfieldElement.soundsDirectory=null;window.MathfieldElement.fontsDirectory=base+'vendor/fonts';guardMathLiveFocus();
    await script('serialiser.js');await script('clipboard.js');
    if(!window.MathsEditor?.Palette){await script('palette/catalogue.js');await script('palette/palette.js');}
    if(!customElements.get('maths-editor'))await new Promise((resolve,reject)=>{const el=document.createElement('script');el.type='module';el.src=base+'maths-editor.js';el.onload=resolve;el.onerror=()=>reject(new Error('Could not load the document editor'));document.head.append(el);});
    await customElements.whenDefined('maths-editor');
  })().catch(e=>{loading=null;throw e;});
  return loading;
}
