// A visual area does not determine whether its repair needs a content-capable editor.
export function repairRoute(finding){
 if(['review','extension'].includes(finding.area))return 'suggestion';
 if(['content','duplicate'].includes(finding.area)||['structure','diagram-code','mathematics'].includes(finding.repairKind))return 'content';
 if(finding.repairRoute==='content')return 'content';
 const reason=finding.applyNote??'';
 if(['comment','reverted'].includes(finding.applyOutcome)&&/layout.only|content|prompt|TikZ|new diagram|creating a diagram|delet.*scaffold|unsupported|outside.*(?:allow|permit)|schema.*missing|missing.*schema|renderer.*(?:missing|fix)|field.*(?:refus|missing)|annotation structure|one target per label|multiple.arrow/i.test(reason))return 'content';
 return 'layout';
}
export const FEEDBACK_CHECKS=`Check the requested relationships, not just whether the page is tidy: stems start beside their question number above subordinate columns; a diagram requested inside a labelled table belongs in its corresponding cell, not alongside it. Teaching grouping, equation alignment and arrow endpoints follow the source, with house measurements. Verify scaffold intent and progression, compact fraction spacing and local blank-style exceptions. Check necessary diagonals and hidden lines, stem-and-leaf separators and numerical alignment, grid scales and measurement-label association. Check difficulty progression using existing ratings while preserving dependencies and deliberate pagination exceptions. These are checks in this review, not new stages; do not generalise a local teacher exception or add optional pedagogy.`;
