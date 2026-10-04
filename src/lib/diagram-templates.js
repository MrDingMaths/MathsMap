import {GRAPH_STROKE_MARKER,graphStrokeOption} from './graph-strokes.js';
import {DIAGRAM_COLOUR_PREFIX} from './diagram-colours.js';
// Parameters are authoritative for supported families; TikZ is regenerated from them.
// Proportions follow the house template. Mathematical content comes only from parameters.
export const DIAGRAM_TEMPLATE_VERSION = 1;
export const DIAGRAM_TEMPLATE_FAMILIES = Object.freeze(['number-line','fraction-grid','fraction-circle','blank-grid']);
const FILL = Object.freeze({name:'templateShade',hex:'D4E8FF'});
const num = value => String(Number(Number(value).toPrecision(12)));
const finite = (value,label) => {if(!Number.isFinite(value))throw Error(label+' must be a finite number');return value;};
const count = (value,label,max) => {if(!Number.isInteger(value)||value<1||value>max)throw Error(`${label} must be a whole number from 1 to ${max}`);return value;};
const tex = value => {const s=String(value);if(!s.trim()||/\\(?:begin|end|special|input|def|write)\b|[%$]/.test(s))throw Error('Template labels are short TeX mathematics without delimiters, comments or environments');return s;};
const tick = label => String.raw`\special{dvisvgm:raw <g data-graph-text="tick">}$${label}$\special{dvisvgm:raw </g>}`;
const tall = label => /\\[dt]?frac/.test(label);

function picture({kind,id,semantic,box,body}) {
 const policy={version:1,kind,base:[],semantic,reference:'template '+id};
 return [DIAGRAM_COLOUR_PREFIX+JSON.stringify(policy),String.raw`\begin{tikzpicture}[x=1mm,y=1mm]`,GRAPH_STROKE_MARKER,
  ...semantic.map(c=>String.raw`\definecolor{${c.name}}{HTML}{${c.hex}}`),
  String.raw`\path[use as bounding box] (${num(box[0])},${num(box[1])}) rectangle (${num(box[2])},${num(box[3])});`,
  ...body,String.raw`\end{tikzpicture}`].join('\n');
}
function shade(shaded,reason) {
 if(!shaded)return [];
 if(typeof reason!=='string'||!reason.trim())throw Error('Shaded template parts need shadeReason: the mathematical meaning of the shading');
 return [{...FILL,reason:reason.trim()}];
}

function numberLine(p) {
 const min=finite(p.min,'min'),max=finite(p.max,'max'),step=finite(p.step,'step');
 if(!(max>min)||!(step>0))throw Error('Number line needs min < max and a positive step');
 const intervals=(max-min)/step;
 if(Math.abs(intervals-Math.round(intervals))>1e-9||intervals>60)throw Error('step must divide the range into at most 60 whole intervals');
 const length=p.lengthMm??Math.min(120,Math.max(50,Math.round(intervals)*8));
 if(!(length>=30&&length<=170))throw Error('lengthMm must be between 30 and 170');
 const x=value=>{finite(value,'value');if(value<min-1e-9||value>max+1e-9)throw Error('Value '+value+' is outside the number line');return (value-min)/(max-min)*length;};
 const values=Array.from({length:Math.round(intervals)+1},(_,i)=>min+i*step);
 const mode=p.labels??'all';
 let labels;
 if(Array.isArray(mode))labels=mode.map(l=>({value:finite(l.value,'label value'),tex:tex(l.tex??num(l.value))}));
 else if(mode==='all')labels=values.map(v=>({value:v,tex:num(v)}));
 else if(mode==='ends')labels=[{value:min,tex:num(min)},{value:max,tex:num(max)}];
 else if(mode==='none')labels=[];
 else throw Error('labels is "all", "ends", "none" or [{value,tex}]');
 const arrows=p.arrows??'both';
 if(!['both','right','none'].includes(arrows))throw Error('arrows is "both", "right" or "none"');
 const tip={both:'<->',right:'->',none:'-'}[arrows],over=4;
 const body=[String.raw`\draw[black,${graphStrokeOption('axis')},${tip}] (${arrows==='both'?-over:0},0)--(${num(length+(arrows==='none'?0:over))},0);`];
 const minor=p.minorStep;
 if(minor!=null){
  const parts=step/finite(minor,'minorStep');
  if(!(minor>0)||Math.abs(parts-Math.round(parts))>1e-9||intervals*parts>200)throw Error('minorStep must divide step, with at most 200 marks');
  for(let i=0;i<=Math.round(intervals*parts);i++)if(i%Math.round(parts))body.push(String.raw`\draw[black,${graphStrokeOption('tick')}] (${num(x(min+i*minor))},-0.8)--(${num(x(min+i*minor))},0.8);`);
 }
 for(const v of values)body.push(String.raw`\draw[black,${graphStrokeOption('tick')}] (${num(x(v))},-1.3)--(${num(x(v))},1.3);`);
 for(const l of labels)body.push(String.raw`\node[below,text=black] at (${num(x(l.value))},-1.3) {${tick(l.tex)}};`);
 let top=3;
 for(const point of p.points??[]){
  const at=num(x(point.value)),open=point.style==='open';
  if(point.style!=null&&!['open','closed'].includes(point.style))throw Error('Point style is "open" or "closed"');
  body.push(open?String.raw`\draw[black,fill=white,${graphStrokeOption('plot')}] (${at},0) circle[radius=1];`:String.raw`\fill[black] (${at},0) circle[radius=1];`);
  if(point.label!=null){body.push(String.raw`\node[above,text=black] at (${at},1.6) {$${tex(point.label)}$};`);top=Math.max(top,tall(String(point.label))?12:8);}
 }
 for(const jump of p.jumps??[]){
  const a=x(jump.from),b=x(jump.to);
  if(a===b)throw Error('A jump needs different endpoints');
  const height=Math.min(10,Math.max(4,Math.abs(b-a)*0.45)),mid=(a+b)/2;
  body.push(String.raw`\draw[black,${graphStrokeOption('guide')},->] (${num(a)},1.8) .. controls (${num(a+(b-a)*0.25)},${num(1.8+height)}) and (${num(a+(b-a)*0.75)},${num(1.8+height)}) .. (${num(b)},1.8);`);
  let reach=1.8+height*0.75;
  if(jump.label!=null){body.push(String.raw`\node[above,text=black] at (${num(mid)},${num(reach)}) {$${tex(jump.label)}$};`);reach+=tall(String(jump.label))?9:5.5;}
  top=Math.max(top,reach+1);
 }
 const bottom=labels.length?(labels.some(l=>tall(l.tex))?-11:-7):-2.5;
 return {kind:'graph',semantic:[],box:[-over-2,bottom,length+over+2,top],body};
}

// One or more equal-part rectangles in a row, optionally separated by operators.
function gridModels(p,{square=false}={}) {
 const models=p.models??[p];
 if(!Array.isArray(models)||!models.length||models.length>6)throw Error('Provide one to six models');
 const separators=p.separators??[];
 if(!Array.isArray(separators)||separators.length>Math.max(0,models.length-1))throw Error('separators has at most one entry between neighbouring models');
 const body=[],semanticUsed=[];let left=0,height=0;
 models.forEach((m,index)=>{
  const rows=count(m.rows??1,'rows',40),cols=count(m.cols,'cols',40);
  const cell=square?(p.cellMm??5):null;
  if(square&&!(cell>=2&&cell<=20))throw Error('cellMm must be between 2 and 20');
  const w=square?cols*cell:(m.widthMm??Math.min(60,Math.max(20,cols*5))),h=square?rows*cell:(m.heightMm??Math.min(40,rows*(rows===1?10:6)));
  if(!(w>=8&&w<=170&&h>=4&&h<=120))throw Error('Model size is outside the printable range');
  const cw=w/cols,ch=h/rows;
  let cells=m.shaded??[];
  if(Number.isInteger(cells)){const n=cells;if(n<0||n>rows*cols)throw Error('shaded count exceeds the number of parts');cells=Array.from({length:n},(_,i)=>(p.fillOrder==='columns'?[i%rows,Math.floor(i/rows)]:[Math.floor(i/cols),i%cols]));}
  if(!Array.isArray(cells))throw Error('shaded is a count or [[row,col],...] from the top-left, zero-based');
  const seen=new Set();
  for(const pair of cells){
   const [r,c]=pair;
   if(!Number.isInteger(r)||!Number.isInteger(c)||r<0||r>=rows||c<0||c>=cols||seen.has(r+','+c))throw Error('Invalid or repeated shaded cell '+JSON.stringify(pair));
   seen.add(r+','+c);
   body.push(String.raw`\fill[${FILL.name}] (${num(left+c*cw)},${num(-(r+1)*ch)}) rectangle (${num(left+(c+1)*cw)},${num(-r*ch)});`);
  }
  if(cells.length)semanticUsed.push(true);
  for(let c=1;c<cols;c++)body.push(String.raw`\draw[black,${graphStrokeOption('tick')}] (${num(left+c*cw)},0)--(${num(left+c*cw)},${num(-h)});`);
  for(let r=1;r<rows;r++)body.push(String.raw`\draw[black,${graphStrokeOption('tick')}] (${num(left)},${num(-r*ch)})--(${num(left+w)},${num(-r*ch)});`);
  body.push(String.raw`\draw[black,${graphStrokeOption('plot')}] (${num(left)},0) rectangle (${num(left+w)},${num(-h)});`);
  height=Math.max(height,h);left+=w;
  if(index<models.length-1){
   const sep=separators[index];
   if(sep!=null)body.push(String.raw`\node[text=black] at (${num(left+5)},${num(-h/2)}) {$${tex(sep)}$};`);
   left+=sep!=null?10:6;
  }
 });
 return {kind:'geometry',semantic:shade(semanticUsed.length,p.shadeReason),box:[-0.6,-height-0.6,left+0.6,0.6],body};
}

function fractionCircle(p) {
 const models=p.models??[p];
 if(!Array.isArray(models)||!models.length||models.length>6)throw Error('Provide one to six circles');
 const separators=p.separators??[],radius=p.radiusMm??9;
 if(!(radius>=5&&radius<=30))throw Error('radiusMm must be between 5 and 30');
 if(!Array.isArray(separators)||separators.length>Math.max(0,models.length-1))throw Error('separators has at most one entry between neighbouring circles');
 const body=[];let left=0,any=false;
 models.forEach((m,index)=>{
  const sectors=count(m.sectors,'sectors',36),cx=left+radius;
  let parts=m.shaded??[];
  if(Number.isInteger(parts)){if(parts<0||parts>sectors)throw Error('shaded count exceeds the number of sectors');parts=Array.from({length:parts},(_,i)=>i);}
  if(!Array.isArray(parts)||new Set(parts).size!==parts.length||parts.some(i=>!Number.isInteger(i)||i<0||i>=sectors))throw Error('shaded is a count or distinct zero-based sector indices, clockwise from the top');
  // Sectors start at the top and run clockwise, matching how fraction circles are read.
  const angle=i=>90-360*i/sectors;
  for(const i of parts){any=true;body.push(sectors===1?String.raw`\fill[${FILL.name}] (${num(cx)},0) circle[radius=${num(radius)}];`:String.raw`\fill[${FILL.name}] (${num(cx)},0)--++(${num(angle(i))}:${num(radius)}) arc[start angle=${num(angle(i))},end angle=${num(angle(i+1))},radius=${num(radius)}]--cycle;`);}
  if(sectors>1)for(let i=0;i<sectors;i++)body.push(String.raw`\draw[black,${graphStrokeOption('tick')}] (${num(cx)},0)--++(${num(angle(i))}:${num(radius)});`);
  body.push(String.raw`\draw[black,${graphStrokeOption('plot')}] (${num(cx)},0) circle[radius=${num(radius)}];`);
  left+=2*radius;
  if(index<models.length-1){
   const sep=separators[index];
   if(sep!=null)body.push(String.raw`\node[text=black] at (${num(left+5)},0) {$${tex(sep)}$};`);
   left+=sep!=null?10:5;
  }
 });
 return {kind:'geometry',semantic:shade(any,p.shadeReason),box:[-0.6,-radius-0.6,left+0.6,radius+0.6],body};
}

const BUILDERS = {'number-line':numberLine,'fraction-grid':p=>gridModels(p),'fraction-circle':fractionCircle,'blank-grid':p=>{if(p.shaded!=null||p.models)throw Error('A blank grid has rows, cols and cellMm only');return gridModels(p,{square:true});}};

// Returns the existing editable TikZ diagram shape; the parameters stay in spec.template.
export function templateDiagram(id,parameters) {
 if(typeof id!=='string'||!id)throw Error('A templated diagram needs its own id');
 if(!parameters||typeof parameters!=='object'||Array.isArray(parameters))throw Error('Template parameters must be an object');
 const build=BUILDERS[parameters.family];
 if(!build)throw Error('Unsupported diagram template family '+parameters.family+'; use free-form TikZ');
 const drawn=build(parameters);
 return {format:'tikz',widthMm:Number((drawn.box[2]-drawn.box[0]).toFixed(2)),code:picture({...drawn,id}),template:{version:DIAGRAM_TEMPLATE_VERSION,...structuredClone(parameters)}};
}
export const diagramTemplateParameters = diagram => diagram?.spec?.template?.version===DIAGRAM_TEMPLATE_VERSION?diagram.spec.template:null;
