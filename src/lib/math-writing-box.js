// MathLive's native dotted enclosure is used for editable mathematical blanks.
// KaTeX has no \enclose implementation; retain physical handwriting dimensions
// through a narrowly trusted style instead of shrinking blanks in subscripts.
export function prepareMathWritingBoxes(latex) {
 return String(latex).replace(/\\enclose\{dottedbox\}\{\\rule\{0pt\}\{(\d+(?:\.\d+)?)mm\}\\hspace\{(\d+(?:\.\d+)?)mm\}\}/g,(original,height,width)=>{
  if(+height<3||+height>30||+width<5||+width>120)return original;
  // A blank's writing baseline is its lower edge. Non-visible overflow makes an
  // inline-block use that edge, instead of the invisible child's text baseline.
  return `\\htmlStyle{display:inline-block;min-width:${width}mm;min-height:${height}mm;border-bottom:0.2mm dotted currentColor;overflow:hidden;}{\\vphantom{X}}`;
 });
}
export function trustMathWritingBox(context) {
 if(context.command!=='\\htmlStyle')return false;
 const match=/^display:inline-block;min-width:(\d+(?:\.\d+)?)mm;min-height:(\d+(?:\.\d+)?)mm;border-bottom:0\.2mm dotted currentColor;overflow:hidden;$/.exec(context.style??'');
 return !!match&&+match[1]>=5&&+match[1]<=120&&+match[2]>=3&&+match[2]<=30;
}
