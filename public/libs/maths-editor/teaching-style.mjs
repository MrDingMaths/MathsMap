import {BOOKLET_HOUSE_STYLE} from './house-style.mjs';

// Explicit authoring roles: never infer correctness from a multiplication glyph.
export function correctnessMarker(correct){
 return {type:'math',latex:correct?'\\checkmark':'\\times',display:false,semanticRole:'correctness-marker',colour:correct?BOOKLET_HOUSE_STYLE.colours.green:BOOKLET_HOUSE_STYLE.colours.red};
}

// Separate left-aligned numbers from the right-aligned equation left-hand sides.
// A null number is a continuation of the preceding teaching step.
export function numberedTeachingWorking(rows){
 const {stepNumberColour,solutionColour}=BOOKLET_HOUSE_STYLE.teaching;
 return `\\color{${solutionColour}}\\begin{alignedat}{2}
${rows.map(({number,lhs,rhs,reason=''})=>`${number==null?'':`\\textcolor{${stepNumberColour}}{\\mathrlap{${number}.}}`}\\quad && ${lhs} & {}${rhs}${reason?`\\quad\\text{${reason}}`:''}`).join('\\\\[4pt]\n')}
\\end{alignedat}`;
}
