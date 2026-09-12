// Shared display policy for every booklet, answer edition and equation editor.
// Do not rewrite source documents or anchor offsets; apply after annotation markup.
const workingEnvironment=/^(?:aligned|alignedat|align\*?|alignat\*?|gathered|gather\*?|split)$/;
function workingRows(latex){
 const stack=[],roots=[];let depth=0;
 const tokens=/%[^\n]*|\\(?:begin|end)\{([^}]+)\}|\\\\(?:\s*\[([^\]]*)\])?|\\[{}%]|[{}]/g;
 for(const m of latex.matchAll(tokens)){
  if(m[0][0]==='%')continue;
  if(m[0].startsWith('\\begin')){const env={name:m[1],depth,breaks:[]};if(!stack.length&&workingEnvironment.test(env.name))roots.push(env);stack.push(env);}
  else if(m[0].startsWith('\\end')){if(stack.at(-1)?.name!==m[1])return [];stack.pop();}
  else if(m[0]==='{')depth++;
  else if(m[0]==='}')depth--;
  else if(m[0].startsWith('\\\\')&&stack.at(-1)===roots.at(-1)&&depth===stack.at(-1)?.depth)stack.at(-1).breaks.push({start:m.index,end:m.index+m[0].length,gap:m[2]});
 }
 return stack.length||depth?[]:roots;
}
export function equationRowSpacing(latex){
 const roots=workingRows(latex),breaks=roots.length===1?roots[0].breaks:[];
 const values=breaks.map(b=>{if(b.gap==null)return 0;const m=b.gap.trim().match(/^([\d.]+)\s*(mm|cm|pt)$/);return m?Number(m[1])*({mm:1,cm:10,pt:25.4/72}[m[2]]):null;});
 const mixed=values.some(v=>v===null||Math.abs(v-values[0])>.001);
 return {supported:breaks.length>0,mixed,valueMm:breaks.length&&!mixed?values[0]:null};
}
export function setEquationRowSpacing(latex,mm){
 if(!Number.isFinite(mm)||mm<0||mm>30)throw Error('Equation row spacing must be between 0 and 30 mm.');
 const roots=workingRows(latex);if(roots.length!==1||!roots[0].breaks.length)throw Error('Use Edit LaTeX for this equation structure.');
 for(const b of [...roots[0].breaks].reverse())latex=latex.slice(0,b.start)+'\\\\['+Number(mm.toFixed(3))+'mm]'+latex.slice(b.end);
 return latex;
}
export function spaceFractionSteps(latex){
 const stack=[],environments=[],edits=[];
 const tokens=/\\(?:begin|end)\{([^}]+)\}|\\(?:dfrac|tfrac|cfrac|frac)(?![A-Za-z])|\\\\(?:\[([^\]]*)\])?/g;
 for(const match of latex.matchAll(tokens)){
  if(match[0].startsWith('\\begin')){
   const env={name:match[1],fraction:false,breaks:[]};stack.push(env);environments.push(env);
  }else if(match[0].startsWith('\\end')){
   if(stack.at(-1)?.name===match[1])stack.pop();
  }else if(match[0].startsWith('\\\\'))stack.at(-1)?.breaks.push(match);
  else for(const env of stack)env.fraction=true;
 }
 for(const env of environments){
  if(!env.fraction||! /^(?:aligned|alignedat|align\*?|alignat\*?|gathered|gather\*?|split)$/.test(env.name))continue;
  for(const match of env.breaks){
   // Keep deliberate mm/cm/em writing-space dimensions and larger pt gaps.
   const gap=match[2]?.trim(),points=gap?.match(/^([\d.]+)pt$/);
   if(gap!==undefined&&(!points||Number(points[1])>=8))continue;
   edits.push({start:match.index,end:match.index+match[0].length});
  }
 }
 for(const {start,end}of edits.sort((a,b)=>b.start-a.start))latex=latex.slice(0,start)+'\\\\[8pt]'+latex.slice(end);
 return latex;
}
