// Theory text against its source (22 October 2026, user approved: docs/booklet-cross-session-rules.md
// "Theory text: source fidelity and cognitive load"). An import must not substantially rewrite theory
// or turn a short introduction into a reference manual, so every teaching block's words are compared
// with the words printed in its source region. The comparison is a token difference: words the source
// prints that the block lacks, and words the block adds. Tokens named in the block's recorded
// intentional departures and source corrections are exempt, because the teacher already decided them.
// Pure: the caller supplies the source words.
import {normKey,blockPlainText,hueClass} from './teaching-signature.js';

// Keys of sourceReview whose text records a decided departure from the source.
export const EXEMPT_KEYS=Object.freeze(['intentionalDepartures','intentionalDeparture','intentionalSourceDepartures','intentionalSourceDeparture','intentionalPresentationDepartures','presentationDepartures','houseStyleDepartures','precisionDeparture','sourceCorrections','sourceCorrection','confirmedSourceCorrections','confirmedCorrections','userConfirmedCorrections','feedbackCorrections','sourceLabelCorrections','editorialResolutions','editorialDecisions','editorialClarifications','editorialExtensions','additionTo','addition','amendment','removedFeedbackContent','feedbackRepairs','feedbackRepair','feedbackAudit','authorisedFeedback']);

export const wordTokens=text=>String(text??'').split(/\s+/).map(normKey).filter(token=>token&&!(token.length===1&&/[a-z]/.test(token)));
const strings=(value,out=[])=>{
 if(typeof value==='string')out.push(value);
 else if(Array.isArray(value))value.forEach(v=>strings(v,out));
 else if(value&&typeof value==='object')Object.values(value).forEach(v=>strings(v,out));
 return out;
};
// The tokens of every recorded departure and correction of a block.
export function exemptTokens(block){
 const record=block?.sourceReview??{},out=new Set();
 for(const key of EXEMPT_KEYS)if(record[key]!=null)for(const text of strings(record[key]))for(const token of wordTokens(text))out.add(token);
 return out;
}

// Words of a source page that lie inside a region box (points), without the printed answers
// (small blue text in a question's corner) and the footer.
export function regionWords(words,box,{pageHeight=842,margin=3}={}){
 const sizes=words.map(w=>w.s).filter(Boolean).sort((a,b)=>a-b),typical=sizes[sizes.length>>1]??11;
 return words.filter(w=>{
  const cx=(w.x0+w.x1)/2,cy=(w.y0+w.y1)/2;
  if(cx<box[0]-margin||cx>box[2]+margin||cy<box[1]-margin||cy>box[3]+margin||w.y0>=pageHeight-50)return false;
  return !(w.s&&w.s<=.86*typical&&hueClass(w.c)==='blue');
 });
}

const count=list=>list.reduce((map,token)=>map.set(token,(map.get(token)??0)+1),new Map());
// Multiset difference of two token lists after the exempt tokens are removed from both.
export function tokenDifference(source,block,exempt=new Set()){
 const a=count(source.filter(t=>!exempt.has(t))),b=count(block.filter(t=>!exempt.has(t))),missing=[],extra=[];
 for(const token of new Set([...a.keys(),...b.keys()])){
  const d=(b.get(token)??0)-(a.get(token)??0);
  for(let i=0;i<Math.abs(d);i++)(d>0?extra:missing).push(token);
 }
 return {missing,extra};
}
// Compare a block with its source words. `significant` is the standing threshold: at least three
// tokens and at least 8% of the source's, in either direction, so rounding of fractions and
// superscripts does not raise it.
export function theoryDiff({block,sourceWords,text=blockPlainText(block)}){
 const source=sourceWords.flatMap(w=>wordTokens(w.t)),mine=wordTokens(text),exempt=exemptTokens(block),{missing,extra}=tokenDifference(source,mine,exempt);
 const base=Math.max(1,source.length),moved=Math.max(missing.length,extra.length);
 return {sourceTokens:source.length,blockTokens:mine.length,missing,extra,missingPct:Math.round(1000*missing.length/base)/10,extraPct:Math.round(1000*extra.length/base)/10,
  significant:moved>=3&&moved/base>=.08,exempt:exempt.size};
}
export const describeDiff=d=>`${d.missing.length} source words missing (${d.missingPct}%): ${d.missing.slice(0,8).join(' ')}; ${d.extra.length} words added (${d.extraPct}%): ${d.extra.slice(0,8).join(' ')}`;
