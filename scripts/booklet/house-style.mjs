// Remove only a standalone origin-label command, never a mathematical point elsewhere.
export function removeCartesianOriginLabel(code) {
 return code.replace(/\\node\s*(?:\[[^\]]*\]\s*)?at\s*\(\s*0(?:\.0+)?\s*,\s*0(?:\.0+)?\s*\)\s*\{\s*(?:\$\s*O\s*\$|O)\s*\}\s*;/g,'');
}
