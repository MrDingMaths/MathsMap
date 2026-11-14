// Explicit source-reviewed groups only. These are display values: prompts,
// solutions, colours and teaching-answer ownership remain separately editable.
const cache=new WeakMap();
function equation(latex) {
  let text=latex.trim(),colour='';
  text=text.replace(/^\\color\{([^}]+)\}\s*/,(_,c)=>(colour=c,''));
  text=text.replace(/^\\begin\{(?:aligned|align\*?)\}/,'').replace(/\\end\{(?:aligned|align\*?)\}$/,'');
  const rows=text.split(/\\\\(?:\[[^\]]*\])?/).map(value=>{
    // A row that opens with colour commands and the alignment point (\color{c}&\color{c}=…) has no left side:
    // the colour applies to the row (14 November 2026: these rows silently lost the equals gutter).
    let rowColour=colour;
    value=value.trim().replace(/^(?:\\color\{[^}]+\}\s*|&\s*)+(?=(?:=|>|<|\\(?:approx|leq?|geq?)\b))/,m=>{const c=[...m.matchAll(/\\color\{([^}]+)\}/g)].at(-1);if(c)rowColour=c[1];return '';});
    let depth=0;
    for(let i=0;i<value.length;i++) {
      if(value[i]==='{'&&value[i-1]!=='\\')depth++;
      if(value[i]==='}'&&value[i-1]!=='\\')depth--;
      if(depth!==0)continue;
      const relation=/^(=|>|<|\\(?:approx|leq?|geq?)\b)/.exec(value.slice(i));
      if(relation)return {lhs:value.slice(0,i).replace(/&/g,'').trim(),relation:relation[0],rhs:value.slice(i+relation[0].length).replace(/^\s*&/,'').trim(),colour:rowColour};
    }
    return {lhs:'',relation:'',rhs:value.replace(/^&/,''),colour:rowColour};
  });
  return rows;
}

function fields(value,id) {
  if(typeof value==='string') {
    const match=/^\s*\$\$?([\s\S]*?)\$\$?\s*$/.exec(value);if(!match)return null;
    value={format:'maths-editor-document-v1',version:1,blocks:[{id,type:'paragraph',inlines:[{type:'math',latex:match[1],display:true}]}]};
  }
  if(value?.format!=='maths-editor-document-v1'||!value.blocks?.length)return null;
  if(value.blocks.some(b=>b.type!=='paragraph'||b.inlines?.length!==1||b.inlines[0].type!=='math'))return null;
  return {value,rows:value.blocks.map(b=>equation(b.inlines[0].latex))};
}

export function teachingEquationDisplays(example) {
  const config=example?.equationAlignment;
  if(!['relation','continuation'].includes(config?.mode))return null;
  if(cache.has(example))return cache.get(example);
  const prompt=fields(example.prompt,example.id+'-aligned-prompt'),solution=fields(example.theorySolution,example.id+'-aligned-solution');
  if(!prompt||!solution)return null;
  // Continuation: the prompt is the opening line, even when it is itself an equation (3n/7 = □/14 continued by
  // = 6n/14); it takes the gutter whole (14 November 2026, James: "equals gutter").
  if(config.mode==='continuation')prompt.rows=prompt.rows.map(rows=>rows.map(r=>r.relation?{lhs:'',relation:'',rhs:r.lhs+r.relation+r.rhs,colour:r.colour}:r));
  const all=[...prompt.rows.flat(),...solution.rows.flat()];
  if(config.mode==='relation'&&all.some(r=>!r.relation)||config.mode==='continuation'&&(prompt.rows.flat().some(r=>r.relation)||solution.rows.flat().some(r=>!r.relation||r.lhs)))return null;
  const phantom=values=>'\\smash{\\hphantom{\\begin{gathered}'+[...new Set(values)].join('\\\\')+'\\end{gathered}}}';
  const left=all.some(r=>r.lhs)?phantom(all.map(r=>r.lhs||'{}')):'';
  const right=config.mode==='relation'?phantom(all.map(r=>r.rhs)):'';
  const display=field=>({...field.value,blocks:field.value.blocks.map((b,i)=>({...b,align:config.align??'left',
    inlines:[{...b.inlines[0],display:false,latex:'\\displaystyle\\begin{aligned}'+field.rows[i].map(r=>
      `${r.colour?'\\color{'+r.colour+'}':''}${left}${r.lhs?'\\mathllap{'+r.lhs+'}':''}&${r.relation||'\\mathrel{\\phantom{=}}'}${right?'\\mathrlap{'+r.rhs+'}'+right:r.rhs}`
    ).join('\\\\')+'\\end{aligned}'}]}))});
  const result={prompt:display(prompt),theorySolution:display(solution)};cache.set(example,result);return result;
}
