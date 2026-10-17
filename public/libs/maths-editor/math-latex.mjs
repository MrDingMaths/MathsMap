// MathLive 0.109 parses boldsymbol/bm as upright bold and serializes its
// explicit bold-italic variant as mathbfit, which KaTeX does not support.
// Translate only at the editor boundary; stored/printed maths stays portable.
export const editableMathLatex = latex => latex.replace(/\\(?:boldsymbol|bm)\b/g,'\\mathbfit');
export function storedMathLatex(latex) {
 const groupEnd=start=>{let depth=1;for(let i=start+1;i<latex.length;i++){if(latex[i]==='\\'){i++;continue;}if(latex[i]==='{')depth++;if(latex[i]==='}'&&!--depth)return i;}return -1;};
 let result='';
 for(let i=0;i<latex.length;){
  const match=/^\\(mathbfit|mathbf)\s*\{/.exec(latex.slice(i));
  if(!match){result+=latex[i++];continue;}
  const start=i+match[0].length-1,end=groupEnd(start);
  if(end<0){result+=latex.slice(i);break;}
  const inner=storedMathLatex(latex.slice(start+1,end));
  if(match[1]==='mathbfit')result+='\\boldsymbol{'+inner+'}';
  else if(/^\\boldsymbol\{/.test(inner)&&storedMathLatexSingleGroup(inner))result+=inner;
  else result+='\\mathbf{'+inner+'}';
  i=end+1;
 }
 return result;
}
function storedMathLatexSingleGroup(value){let depth=0;for(let i=value.indexOf('{');i<value.length;i++){if(value[i]==='\\'){i++;continue;}if(value[i]==='{')depth++;if(value[i]==='}'&&!--depth)return i===value.length-1;}return false;}
