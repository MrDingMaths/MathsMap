import {BOOKLET_HOUSE_STYLE as style} from './house-style.mjs';
export const BOOKLET_PALETTE=Object.freeze({...style.colours,...Object.fromEntries(Object.entries(style.fills).map(([k,v])=>[k+'Fill',v]))});
export const bookletPaletteVariables=Object.entries(BOOKLET_PALETTE).map(([k,v])=>`--booklet-${k}:${v}`).join(';');
export const bookletColourChoices=Object.entries(BOOKLET_PALETTE).map(([name,value])=>({name,value}));
// Reviewed legacy shades. Unknown colours remain visible to acceptance QA.
const shades={
 ink:['111','111111','172033','222','222222','23395d','25364a','242424','333','333333','2f4058'],
 blue:['0080ff','0000ff','253f8e','002060','007bff','2222ff','0476d0','056fdb','3399ff','2f6fb2','244e74','245f91','1769aa','72cedd','6dccdc','6eccdc','00adee','2878c7'],
 red:['aa0505','ff616b','d83131','ee2227','ed1c24','f04348','ee363c','ff0000','f03d3d','e35964','cd1780','d65e65','d05f84','e66c70','f28f94'],
 green:['196b24','16803d','196419','008000'],orange:['db6f05','df8b38'],
 border:['a9b7c6','d3d7db','d8d8d8','dfe4ea','e0e5ea','dddddd'],
 muted:['696969','999999','575759','5f5f5f','53627a','66758d','68768a','b4b4b4'],
 blueFill:['adbfde','adbfdf','b8c3e1','b8c2e1','bbbbd9','eef5fc','edf4f9','e8f1f7'],
 redFill:['ffc4c9','fde1e2','fdf0f4'],greenFill:['eef8f1'],orangeFill:['ffbb90','fabda6','fff4e8']
};
const aliases={blue:'blue',answerblue:'blue',red:'red',pink:'red',magenta:'red',green:'green',orange:'orange',purple:'orange',violet:'orange',teal:'blue',cyan:'blue',yellow:'orange',brown:'orange',black:'black',white:'white',gray:'muted',grey:'muted',housegrid:'border',sourcegray:'muted','green!70!black':'green','black!70':'muted','black!45':'muted','black!80':'muted','black!5':'border'};
const map=new Map(Object.entries(shades).flatMap(([role,values])=>values.map(v=>['#'+v,role])));
export function standardBookletColour(value,{background=false,diagram=false}={}){
 if(typeof value!=='string')return value;
 const key=value.trim().toLowerCase();if(['inherit','transparent','none','currentcolor'].includes(key))return value;
 if(Object.values(BOOKLET_PALETTE).includes(key))return key;
 let role=aliases[key]??map.get(key);
 if(!role)return value;
 if(!diagram&&role==='black')role='ink';
 if(background&&['blue','red','green','orange'].includes(role))role+='Fill';
 return BOOKLET_PALETTE[role];
}
export function standardMathColours(text){
 return String(text).replace(/(\\(?:textcolor|color)\s*\{)([^{}]+)(\})/g,(_,a,c,b)=>a+standardBookletColour(c)+b);
}
const evidence=new Set(['source','spec','sourceReview','sourceAtom','sourceLayoutEvidence','originalDiagram','originalContent','before','after','originalValue']);
const colourKeys=new Set(['colour','color','background','backgroundColor','backgroundColour','borderColour','borderColor','headerFill','fill','stroke','gridColour']);
export function standardBookletContent(value){
 if(typeof value==='string')return value.split(/(\[tikz\][\s\S]*?\[\/tikz\])/g).map((s,i)=>i%2?s:standardMathColours(s)).join('');
 if(!value||typeof value!=='object')return value;
 if(Array.isArray(value))return value.map(standardBookletContent);
 if(value.format==='image'||value.type==='image')return structuredClone(value);
 const next={};
 for(const[k,v]of Object.entries(value)){
  if(evidence.has(k)||k==='code'||k==='mathematicalModel')next[k]=structuredClone(v);
  else if(colourKeys.has(k))next[k]=standardBookletColour(v,{background:/background|Fill/.test(k),diagram:!!value.mathematicalModel});
  else if(typeof v==='string')next[k]=standardBookletContent(v);
  else next[k]=typeof v==='object'?standardBookletContent(v):v;
 }
 if(Object.values(style.fills).includes(next.background)&&next.colour===BOOKLET_PALETTE.white)next.colour=BOOKLET_PALETTE.ink;
 return next;
}
// Main section-band paint is not a diagram accent; keep existing diagram definitions/cache bytes stable.
export const STANDARD_TIKZ_DEFINITIONS=Object.entries(BOOKLET_PALETTE).filter(([k])=>k!=='black'&&k!=='white'&&k!=='headerBlue').map(([k,v])=>`\\definecolor{${({border:'housegrid',muted:'housemuted'}[k]??k)}}{HTML}{${v.slice(1).toUpperCase()}}`).join('\n');
export function stripStandardTikzPalette(code){return code.replace('% mathsmap-standard-palette '+style.paletteVersion+'\n'+STANDARD_TIKZ_DEFINITIONS+'\n','');}
export function standardTikzColours(source){
 let code=String(source).replace(/\\definecolor\{([^}]+)\}\{(HTML|RGB|rgb)\}\{([^}]+)\}/g,(all,name,model,value)=>{
  const hex=model==='HTML'?'#'+value:'#'+value.split(',').map(v=>Math.round(Number(v)*(model==='rgb'?255:1)).toString(16).padStart(2,'0')).join('');
  const colour=standardBookletColour(hex,{diagram:true});return /^#[\da-f]{6}$/i.test(colour)?`\\definecolor{${name}}{HTML}{${colour.slice(1).toUpperCase()}}`:all;
 });
 // Preserve coordinates and arbitrary node prose; replace colour tokens only in options.
 code=code.split('\n').map(line=>{
  if(line.trimStart().startsWith('%'))return line;
  return line.replace(/\[([^\]\n]*)\]/g,(all,options)=>'['+options.replace(/(^|[,={])\s*((?:black|white|gray|grey|blue|red|green|orange|pink|purple|violet|cyan|magenta|teal|yellow|brown)(?:![\d.]+(?:![a-z]+)?)?)(?=[,}\s]|$)/g,(m,p,c)=>{
   if(!c)return m;const hex=standardBookletColour(c,{diagram:true});const role=Object.entries(BOOKLET_PALETTE).find(([,v])=>v===hex)?.[0];return role?p+({border:'housegrid',muted:'housemuted'}[role]??role):m;
  })+']');
 }).join('\n');
 const definitions=STANDARD_TIKZ_DEFINITIONS;
 // Explicit callers are booklet authoring/migration; older answer overrides may
 // predate diagram-role metadata but still need locally scoped definitions.
 if(!code.includes('% mathsmap-standard-palette')){
  const start=/\\begin\{tikzpicture\}/.exec(code);
  if(start){
   let end=start.index+start[0].length,option=end;
   while(/\s/.test(code[option]??'')&&option<code.length)option++;
   if(code[option]==='['){
    let depth=1,cursor=option+1;
    for(;cursor<code.length&&depth;cursor++){
     if(code[cursor]==='\\'){cursor++;continue;}
     if(code[cursor]==='[')depth++;else if(code[cursor]===']')depth--;
    }
    if(depth===0)end=cursor;
   }
   const suffix=code.slice(end);
   code=code.slice(0,end)+'\n% mathsmap-standard-palette '+style.paletteVersion+'\n'+definitions+(/^\r?\n/.test(suffix)?'':'\n')+suffix;
  }
 }
 return code;
}
