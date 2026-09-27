// A small explicit node reader, not a TeX interpreter. Unknown node syntax is a
// finding; small-font graph labels need reviewed semantic roles.
export function explicitSmallGraphLabels(code){
 if(!/^% mathsmap-diagram-colours .*"kind"\s*:\s*"graph"/m.test(code))return [];
 const nodes=[];
 const escaped=i=>{let n=0;for(let j=i-1;j>=0&&code[j]==='\\';j--)n++;return n%2===1;};
 for(const match of code.matchAll(/\\node\[([^\]]*)\]/g)){
  if(!/\\fontsize\{8(?:\.5)?\}\{[\d.]+\}/.test(match[1]))continue;
  let i=match.index+match[0].length,parens=0,start=-1;
  for(;i<code.length;i++){
   if(escaped(i))continue;
   if(code[i]==='(')parens++;else if(code[i]===')')parens--;
   else if(code[i]==='{'&&parens===0){start=i+1;break;}
   else if(code[i]===';'&&parens===0)break;
  }
  if(start<0){nodes.push({offset:match.index,error:'Cannot locate complete small-font graph node'});continue;}
  let depth=1;for(i=start;i<code.length;i++){if(escaped(i))continue;if(code[i]==='{')depth++;if(code[i]==='}'&&--depth===0)break;}
  if(depth!==0){nodes.push({offset:match.index,error:'Unclosed small-font graph node'});continue;}
  const content=code.slice(start,i);
  nodes.push({offset:match.index,content,tick:/data-graph-text\s*=\s*["']tick["']/.test(content),nodeSource:code.slice(match.index,i+1)});
 }
 return nodes;
}
