// A supported explicit top-level "or" is an intentional wrapping boundary.
// Keep each complete alternative together; don't guess relation boundaries.
export function compactDisjunctDisplay(latex) {
  const separator=String.raw`\quad\text{or}\quad`;
  if(typeof latex!=='string'||!latex.includes(separator)||latex.includes('\\allowbreak')||/\\begin\{|\\end\{/.test(latex))return latex;
  const positions=[];let depth=0;
  for(let i=0;i<latex.length;i++) {
    if(latex.startsWith(separator,i)) {if(depth!==0)return latex;positions.push(i);i+=separator.length-1;continue;}
    if(latex[i]==='{'&&latex[i-1]!=='\\')depth++;
    if(latex[i]==='}'&&latex[i-1]!=='\\'&&--depth<0)return latex;
  }
  if(depth!==0||!positions.length)return latex;
  const parts=[];let start=0;
  for(const position of positions){parts.push(latex.slice(start,position).trim());start=position+separator.length;}
  parts.push(latex.slice(start).trim());
  if(parts.some(p=>!p))return latex;
  return '{'+parts[0]+'}'+parts.slice(1).map(p=>'\\allowbreak\\quad{\\text{or}\\quad '+p+'}').join('');
}

export function compactDocumentDisjuncts(value) {
  if(value?.format!=='maths-editor-document-v1')return value;
  const result=structuredClone(value);let changed=false;
  const visit=node=>{
    if(!node||typeof node!=='object')return;
    if(node.type==='math'&&typeof node.latex==='string'){const display=compactDisjunctDisplay(node.latex);if(display!==node.latex){node.latex=display;changed=true;}}
    for(const child of Object.values(node))if(Array.isArray(child))child.forEach(visit);else if(child&&typeof child==='object')visit(child);
  };
  visit(result);return changed?result:value;
}
