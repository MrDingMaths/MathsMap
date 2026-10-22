// Box-versus-dots decisions for blanks (AGENTS.md "Cloze styles and source tables"; 14, 17 and 21 October
// 2026, user requested), as code. The sweep's cloze rule and the first-pass reviewer share these so the
// reviewer stops suggesting dots for the fraction boxes the teacher keeps:
//   - a missing numerator or denominator is an outlined box in native maths, also when both are missing
//     (the full scaffold keeps its two boxes and its vinculum), also in teaching and in-place answers;
//   - a blank enclosed by parentheses inside a numerator or denominator keeps the parentheses and its
//     handwriting space with no visible box and no dots (\phantom of the box keeps the exact size);
//   - parentheses elsewhere in a fraction do not remove unrelated boxes;
//   - every other blank is one dotted cloze (an ordinary blank in an equation, outside a fraction or a power).
// Dotted and invisible fraction components are rebuilt as boxes. Pure string functions over LaTeX.

const STRUT='(?:\\\\rule\\{0pt\\}\\{[\\d.]+mm\\}|\\s)*';
const BOX_SRC='\\\\boxed\\{\\s*(?:\\\\rule\\{0pt\\}\\{[\\d.]+mm\\})?\\s*\\\\hspace\\{([\\d.]+)mm\\}\\s*\\}';
const COLBOX_SRC=`(?:\\{\\s*\\\\color\\{[^{}]*\\}\\s*${BOX_SRC}\\s*\\}|${BOX_SRC})`;
const DOTS_SRC='(?:\\\\(?:ldots|cdots|dots|dotfill)(?![a-zA-Z])|\\\\underline\\{\\\\hspace\\{([\\d.]+)mm\\}\\})';
const OPEN_SRC='(?:\\\\left\\(|\\\\[Bb]ig{1,2}[lL]?\\(|\\()';
const CLOSE_SRC='(?:\\\\right\\)|\\\\[Bb]ig{1,2}[rR]?\\)|\\))';
export const BOX_HEIGHT_MM=5;
export const boxLatex=widthMm=>`\\boxed{\\rule{0pt}{${BOX_HEIGHT_MM}mm}\\hspace{${widthMm}mm}}`;
const phantomBox=widthMm=>`\\phantom{${boxLatex(widthMm)}}`;

// Split the two arguments of a \frac starting at `at` (balanced braces). null when it is not a fraction.
export function parseFraction(latex,at){
 const head=/^\\(?:dfrac|tfrac|frac)(?![a-zA-Z])/.exec(latex.slice(at));if(!head)return null;
 let i=at+head[0].length;const parts=[];
 for(let k=0;k<2;k++){
  while(latex[i]===' ')i++;if(latex[i]!=='{')return null;
  let depth=0,j=i;
  for(;j<latex.length;j++){if(latex[j]==='\\'){j++;continue;}if(latex[j]==='{')depth++;if(latex[j]==='}'&&!--depth)break;}
  if(j>=latex.length)return null;
  parts.push(latex.slice(i+1,j));i=j+1;
 }
 return {start:at,end:i,command:head[0],num:parts[0],den:parts[1]};
}

const PAREN_BLANK=new RegExp(`(${OPEN_SRC})(${STRUT})(${COLBOX_SRC}|${DOTS_SRC})(${STRUT})(${CLOSE_SRC})`,'g');
const WHOLE=src=>new RegExp(`^\\s*(?:${STRUT})(?:${src})(?:${STRUT})\\s*$`);
const WHOLE_BOX=WHOLE(COLBOX_SRC),WHOLE_DOTS=WHOLE(DOTS_SRC),WHOLE_PHANTOM=WHOLE(`\\\\phantom\\{${COLBOX_SRC}\\}`);
const BOX_IN=new RegExp(BOX_SRC);

// Repair one numerator or denominator. Returns the part and the issues found in it.
function repairPart(part,side,where){
 const issues=[];
 let next=part.replace(PAREN_BLANK,(whole,open,leadStrut,blank,boxWidth,boxWidth2,dotWidth,trail,close)=>{
  const isBox=/\\boxed/.test(blank);
  if(isBox){
   const box=BOX_IN.exec(blank)?.[0];
   issues.push({kind:'parenthesised-blank-visible',side,detail:`${where}: the box inside parentheses in the ${side} should be empty space, no box`,fixable:true});
   return open+leadStrut+`\\phantom{${box}}`+trail+close;
  }
  const width=/\\underline/.test(blank)?dotWidth:null;
  if(width){issues.push({kind:'parenthesised-blank-dotted',side,detail:`${where}: the dots inside parentheses in the ${side} should be empty space, no dots`,fixable:true});return open+leadStrut+phantomBox(width)+trail+close;}
  issues.push({kind:'parenthesised-blank-dotted',side,detail:`${where}: the dots inside parentheses in the ${side} should be empty space; their width is unknown`,fixable:false});
  return whole;
 });
 // A whole component that is dots, or invisible without parentheses, is a missing numerator or denominator: a box.
 if(WHOLE_DOTS.test(next)){
  const m=/\\underline\{\\hspace\{([\d.]+)mm\}\}/.exec(next);
  if(m){issues.push({kind:'dotted-component',side,detail:`${where}: a dotted ${side} should be an outlined box`,fixable:true});next=boxLatex(m[1]);}
  else issues.push({kind:'dotted-component',side,detail:`${where}: a dotted ${side} should be an outlined box (its width is unknown)`,fixable:false});
 }else if(WHOLE_PHANTOM.test(next)){
  const box=BOX_IN.exec(next)?.[0];
  issues.push({kind:'invisible-component',side,detail:`${where}: an invisible ${side} without parentheses should be an outlined box`,fixable:!!box});
  if(box)next=box;
 }
 return {part:next,issues};
}

// The convention applied to every fraction of a formula, outermost first, nested fractions inside the parts.
// Returns the repaired formula (every fixable issue applied) and the issues, fixed or not.
export function fractionConvention(latex,{where='fraction'}={}){
 const issues=[];
 const run=text=>{
  let out='',i=0;
  while(i<text.length){
   if(text[i]==='\\'){
    const f=parseFraction(text,i);
    if(f){
     const inner=run(f.num),inner2=run(f.den);
     const a=repairPart(inner,'numerator',where),b=repairPart(inner2,'denominator',where);
     issues.push(...a.issues,...b.issues);
     out+=f.command+'{'+a.part+'}{'+b.part+'}';i=f.end;continue;
    }
    // Skip an escaped character so \{ is not read as a brace.
    out+=text.slice(i,i+2);i+=2;continue;
   }
   out+=text[i++];
  }
  return out;
 };
 const repaired=run(String(latex??''));
 // issues are recorded as found (not fixed) so a caller that cannot fix them still reports them.
 return {latex:repaired,issues,changed:repaired!==latex};
}

// True when a fraction in this formula keeps the full scaffold: both components boxes, with the vinculum.
export function isFullScaffold(latex){
 for(let i=0;i<latex.length;i++){
  if(latex[i]!=='\\')continue;
  const f=parseFraction(latex,i);
  if(f&&WHOLE_BOX.test(f.num)&&WHOLE_BOX.test(f.den))return true;
 }
 return false;
}

// What the first-pass reviewer must not suggest, as a test on a finding's text (the contract tells
// the worker; this drops the finding when the worker raises it anyway). Only a suggestion that CONTRADICTS
// a decided convention is dropped: one that agrees with it ("a dotted denominator should be an outlined box")
// or is about something else (width, overlap, alignment) is kept for the teacher.
const BOX_WORD = '(?:box|boxes|boxed|outlined|rectangular|rectangle|rectangles)';
const DOT_WORD = '(?:dots?|dotted|cloze|clozes)';
const GAP = '[^.;\\n]*?';
const phrase = (...parts) => new RegExp(parts.join(GAP));
// Across sentence ends (a period inside the gap).
const phraseAcross = (...parts) => new RegExp(parts.join('[^;\\n]*?'));
// "replace/convert/change the box with/to dots", "the box should be (replaced with) dots", "use dots instead of boxes".
const BOX_TO_DOTS = [
  phrase('\\b(?:replace[sd]?|replacing|convert(?:s|ed|ing)?|chang(?:e|es|ed|ing)|swap(?:s|ped|ping)?|switch(?:es|ed|ing)?)\\b', `\\b${BOX_WORD}\\b`, '\\b(?:with|to|into|by|for)\\b', `\\b${DOT_WORD}\\b`),
  phrase('\\b(?:replace[sd]?|replacing|convert(?:s|ed|ing)?|chang(?:e|es|ed|ing)|swap(?:s|ped|ping)?|switch(?:es|ed|ing)?)\\b', '\\b(?:scaffold|numerators?|denominators?|vinculum)\\b', '\\b(?:with|to|into|by)\\b', `\\b${DOT_WORD}\\b`),
  phrase(`\\b${BOX_WORD}\\b`, '\\b(?:should|must|ought to|needs? to|can) (?:be|become)\\b', `\\b${DOT_WORD}\\b`),
  phrase('\\b(?:use|using|prefer|put|show|add)\\b', `\\b${DOT_WORD}\\b`, '\\b(?:instead of|rather than|in place of|not)\\b', `\\b${BOX_WORD}\\b`),
];
// "Use the same dotted blanks ... replace the numerator and denominator boxes": dots named first, then boxes replaced
// (and not replaced by another box).
const REPLACES_BOX = text => phraseAcross(`\\b${DOT_WORD}\\b`, '\\b(?:replace[sd]?|replacing|convert(?:s|ed|ing)?|swap(?:s|ped|ping)?|switch(?:es|ed|ing)?)\\b', `\\b${BOX_WORD}\\b`).test(text) &&
  !phrase('\\b(?:replace[sd]?|replacing|convert(?:s|ed|ing)?|swap(?:s|ped|ping)?|switch(?:es|ed|ing)?)\\b', '\\b(?:with|to|into|by)\\b', `\\b${BOX_WORD}\\b`).test(text);
const ADD_MARKS = phrase('\\b(?:add|put|insert|draw|show|use|keep|replace|convert)\\b', `\\b(?:${BOX_WORD}|${DOT_WORD})\\b`);
export function conflictsWithDecidedConvention(finding) {
  const text = [finding?.comment, finding?.proposal].filter(Boolean).join(' ').toLowerCase();
  if (!text) return null;
  if (!/\b(?:numerators?|denominators?|fractions?|vinculum)\b/.test(text)) return null;
  const parentheses = /\bparenthes/.test(text);
  if (!parentheses && (BOX_TO_DOTS.some(re => re.test(text)) || REPLACES_BOX(text))) {
    return 'Missing numerator and denominator boxes are decided (14 and 17 October 2026): the reviewer must not suggest dots for them.';
  }
  // Adding a box or dots to a blank in parentheses inside a fraction contradicts "empty space, no box, no dots".
  if (parentheses && ADD_MARKS.test(text) && !/\b(?:remove|empty|without|no visible|invisible|no box|no dots|not visible|phantom)\b/.test(text)) {
    return 'Blanks in parentheses inside a fraction keep empty space with no box and no dots (21 October 2026).';
  }
  return null;
}
