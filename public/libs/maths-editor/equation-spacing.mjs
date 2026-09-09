// Shared display policy for every booklet, answer edition and equation editor.
// Do not rewrite source documents or anchor offsets; apply after annotation markup.
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
