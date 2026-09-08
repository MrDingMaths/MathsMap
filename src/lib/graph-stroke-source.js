import {GRAPH_STROKE_MARKER,graphStrokeOption} from './graph-strokes.js';

// Split only at the top level: arrow options contain commas and nested brackets.
function optionParts(source) {
  const parts=[];let start=0,depth=0;
  for(let i=0;i<source.length;i++){
    if('{['.includes(source[i]))depth++;
    if('}]'.includes(source[i]))depth--;
    if(source[i]===','&&depth===0){parts.push(source.slice(start,i));start=i+1;}
  }
  parts.push(source.slice(start));return parts;
}
function weighted(options,role) {
  return [...optionParts(options).filter(p=>p.trim()&&!/^(?:(?:ultra |very |semi)?thick|(?:ultra |very )?thin|line width\s*=)/.test(p.trim())),graphStrokeOption(role)].join(',');
}
function bracketEnd(source,start,open='[',close=']') {
  let depth=0,braces=0;
  for(let i=start;i<source.length;i++){
    if(open==='['){if(source[i]==='{')braces++;if(source[i]==='}')braces--;if(braces)continue;}
    if(source[i]===open)depth++;
    if(source[i]===close&&!--depth)return i;
  }
  throw Error('Unclosed TikZ options');
}
function drawRole(options,body) {
  if(/\bgrid\b/.test(body))return 'majorGrid';
  // In editable PGFPlots graphs relationships are addplots; axis-cs draw commands
  // are annotation pointers and writing scaffolds supplied through axisTikz.
  if(body.includes('axis cs:'))return 'guide';
  if(/\b(?:dashed|dotted)\b|shorten\s*>=/.test(options))return 'guide';
  const coords=[...body.matchAll(/\(([^(),]+),([^(),]+)\)/g)].slice(0,2).map(m=>[m[1].trim(),m[2].trim()]);
  if(coords.length===2){
    const [[x1,y1],[x2,y2]]=coords;
    // Axis-aligned segments through the origin, versus short ticks crossing it.
    if((Number(x1)===0&&Number(x2)===0)||(Number(y1)===0&&Number(y2)===0))return 'axis';
    const opposite=(a,b)=>Number.isFinite(Number(a))&&Number(a)===-Number(b)&&Math.abs(Number(a))<=0.5;
    if((x1===x2&&opposite(y1,y2))||(y1===y2&&opposite(x1,x2)))return 'tick';
  }
  return 'plot';
}

/** Explicit adoption, never run as a blanket renderer rewrite. Returns an audit
 * of each drawing-role decision so existing hand-authored figures can be reviewed. */
export function styleManualGraphStrokes(source) {
  if(source.includes(GRAPH_STROKE_MARKER))return {code:source,roles:[]};
  let code=source;const roles=[];
  // PGFPlots styles have an explicit semantic role, including minor grids.
  const edits=[];
  for(const m of code.matchAll(/\b(axis line|(?:major |minor )?tick|(?:major |minor )?grid) style\s*=\s*\{/g)){
    if(code.slice(code.lastIndexOf('\n',m.index)+1,m.index).includes('%'))continue;
    const start=m.index+m[0].length-1,end=bracketEnd(code,start,'{','}');
    const role=m[1]==='axis line'?'axis':m[1].includes('tick')?'tick':m[1]==='minor grid'?'minorGrid':'majorGrid';
    edits.push({start:start+1,end,text:weighted(code.slice(start+1,end),role)});roles.push({role,command:m[0]});
  }
  for(const edit of edits.reverse())code=code.slice(0,edit.start)+edit.text+code.slice(edit.end);
  const drawings=[];
  // Ignore full-line comments and model JSON; only actual TeX commands are touched.
  for(const m of code.matchAll(/\\(draw|addplot\+?)\b/g)){
    const lineStart=code.lastIndexOf('\n',m.index)+1;
    if(code.slice(lineStart,m.index).includes('%'))continue;
    let start=m.index+m[0].length;while(/\s/.test(code[start]??'')&&start<code.length)start++;
    const hasOptions=code[start]==='[',end=hasOptions?bracketEnd(code,start):start-1;
    const options=hasOptions?code.slice(start+1,end):'';
    const body=code.slice(end+1,code.indexOf(';',end+1));
    if(/only marks/.test(options))continue;
    const role=m[1].startsWith('addplot')?'plot':drawRole(options,body);
    drawings.push({start,end:hasOptions?end+1:start,text:`[${weighted(options,role)}]`});
    roles.push({role,command:code.slice(m.index,end+1)+body.split('node')[0].slice(0,160)});
  }
  for(const edit of drawings.reverse())code=code.slice(0,edit.start)+edit.text+code.slice(edit.end);
  // A manual axis can use a minor grid without specifying its own style.
  if(/minor [xy] tick num/.test(code)&&!code.includes('minor grid style='))code=code.replace(/grid style=\{([^{}]*)\}/,`$&,minor grid style={${graphStrokeOption('minorGrid')}}`);
  const end=code.lastIndexOf(String.raw`\end{tikzpicture}`);
  if(end<0)throw Error('Manual graph needs a complete tikzpicture before style adoption');
  return {code:code.slice(0,end)+GRAPH_STROKE_MARKER+'\n'+code.slice(end),roles};
}
