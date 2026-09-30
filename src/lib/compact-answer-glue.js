import {compactDocumentDisjuncts} from './compact-disjuncts.js';
// Display-only glue. Stored text, editable TeX and mathematical content stay
// unchanged. Render punctuation with the final mathematical atom: a word joiner
// outside KaTeX's nested inline boxes does not reliably keep it on that line.
export function compactAnswerProseGlue(value) {
  if(typeof value!=='string')return compactDocumentDisjuncts(value);
  const grouped=value.replace(/(?<![\\$])\$(?!\$)((?:\\.|[^$])*?)(?<!\\)\$(?!\$)/g,(_,math)=>{
    const protectedMath=math.replace(/(?<!\\)\|([^|]+?)(?<!\\)\|/g,(atom,inner,offset)=>{
      if(math[offset-1]==='|'||math[offset+atom.length]==='|'||math.slice(0,offset).endsWith('\\left')||math.slice(0,offset).endsWith('\\right'))return atom;
      if(!/^(?:[a-zA-Z0-9+\-*/^_{}.()[\] \t]|\\(?:dfrac|tfrac|frac|sqrt)\b)+$/.test(inner))return atom;
      const stack=[],openings={')':'(', '}':'{', ']':'['};
      for(const c of inner){if('({['.includes(c))stack.push(c);else if(openings[c]&&stack.pop()!==openings[c])return atom;}
      if(stack.length)return atom;
      // An existing ordinary-atom wrapper is already nonbreaking.
      if(math[offset-1]==='{')return atom;
      return '{'+atom+'}';
    });
    return '$'+protectedMath+'$';
  });
  const attached=grouped.replace(/(?<![\\$])\$(?!\$)((?:\\.|[^$])*?)(?<!\\)\$(?!\$)([,.!?;:)\]]|-axis\b)/g,(_,math,tail)=>{
    if(tail==='-axis'&&!/^[xy]$/.test(math))return '$'+math+'$'+tail;
    return '$'+math+'\\text{'+tail+'}$';
  });
  const parts=attached.split(/((?<![\\$])\$(?!\$)(?:\\.|[^$])*?(?<!\\)\$(?!\$))/g);
  return parts.map((part,index)=>{
    if(index%2)return part;
    let result=part.replace(/\b([xy])-axis\b/g,'$1\u2060-\u2060axis');
    return result;
  }).join('');
}
