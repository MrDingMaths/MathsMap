const copy=v=>JSON.parse(JSON.stringify(v));
export function captureQuestionPresentation(block,overrides={}){
 const ids=new Set([block.id]);
 const visit=v=>{if(!v||typeof v!=='object')return;if(v.id)ids.add(v.id);Object.values(v).forEach(x=>Array.isArray(x)?x.forEach(visit):visit(x));};visit(block);
 return {...copy(block.presentation??{}),ownerId:block.id,layoutOverrides:Object.fromEntries(['blockLayouts','answerSpaces','diagramColourModes'].map(key=>[key,Object.fromEntries(Object.entries(overrides[key]??{}).filter(([id])=>ids.has(id)).map(([id,v])=>[id,copy(v)]))]))};
}

export function remapQuestionPresentation(presentation,ids){
 const entries=[...ids].sort((a,b)=>b[0].length-a[0].length);
 const pattern=entries.length?new RegExp('(?<![A-Za-z0-9_-])(?:'+entries.map(([id])=>id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?=$|[/#:])','g'):null;
 const replace=v=>{if(typeof v==='string')return pattern?v.replace(pattern,old=>ids.get(old)):v;if(Array.isArray(v))return v.map(replace);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[replace(k),replace(x)]));return v;};
 return replace(presentation??{});
}
