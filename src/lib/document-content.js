import { DOCUMENT_FORMAT, normalizeDocument, fromSource, toSource, renderDocument } from '../../public/libs/maths-editor/document-model.mjs';
import { renderMath } from './render-math.js';
export { DOCUMENT_FORMAT, normalizeDocument, fromSource, toSource };
export const isDocument = value => value?.format === DOCUMENT_FORMAT;
export const contentSource = value => isDocument(value) ? toSource(value) : String(value ?? '');
export const contentValue = value => isDocument(value) ? normalizeDocument(value) : String(value ?? '');
export const documentHtml = (value, options = {}) => renderDocument(value, { ...options, math:(latex,display) => renderMath((display?'$$':'$')+(display?'':'\\textstyle ')+latex+(display?'$$':'$')) });
export function storageValue(doc) {
  return normalizeDocument(doc);
}
let loading;
export function loadDocumentEditor() {
  if(loading)return loading;
  loading=(async()=>{
    const base='/libs/maths-editor/';
    for(const name of ['vendor/mathlive-static.css','document-editor.css']) {
      if(document.querySelector(`link[data-maths-editor="${name}"]`))continue;
      const link=document.createElement('link');link.rel='stylesheet';link.href=base+name;link.dataset.mathsEditor=name;document.head.append(link);
    }
    const script=src=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=base+src;el.onload=resolve;el.onerror=()=>reject(new Error('Could not load '+src));document.head.append(el);});
    if(!customElements.get('math-field'))await script('vendor/mathlive.min.js');
    window.MathfieldElement.soundsDirectory=null;window.MathfieldElement.fontsDirectory=base+'vendor/fonts';
    await script('serialiser.js');await script('clipboard.js');
    if(!customElements.get('maths-editor'))await new Promise((resolve,reject)=>{const el=document.createElement('script');el.type='module';el.src=base+'maths-editor.js';el.onload=resolve;el.onerror=()=>reject(new Error('Could not load the document editor'));document.head.append(el);});
    await customElements.whenDefined('maths-editor');
  })().catch(e=>{loading=null;throw e;});
  return loading;
}
