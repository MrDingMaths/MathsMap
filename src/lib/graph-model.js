import {GRAPH_STROKE_MARKER,graphStrokeOption} from './graph-strokes.js';
// Editable graph data is authoritative; TikZ is regenerated from it.
export const GRAPH_MODEL_VERSION = 1;
export const GRAPH_TYPOGRAPHY = Object.freeze({version: '2026-09', tickPt: 8.5, minimumTickPt: 8, labelPt: 10});
const clone = value => JSON.parse(JSON.stringify(value));
const number = value => String(Number(Number(value).toPrecision(12)));
// Explicit style adoption; old models and manually edited code retain their defaults.
export function styleGraph(model,printWidthMm=65) {
 const next=graphPalette(model);
 next.printWidthMm=printWidthMm;
 if(next.panels)next.panels=next.panels.map(panel=>styleGraph(panel,panel.widthCm*10));
 const factor=(next.widthCm*10+18)/printWidthMm;
 next.tickFontPt=(next.tickTargetPt??GRAPH_TYPOGRAPHY.tickPt)*factor;
 next.labelFontPt=GRAPH_TYPOGRAPHY.labelPt*factor;
 if(next.panels?.length){next.tickFontPt=next.panels[0].tickFontPt;next.labelFontPt=next.panels[0].labelFontPt;}
 next.typographyVersion=GRAPH_TYPOGRAPHY.version;
 return next;
}
export function graphPalette(model) {
 const next=graphModel(model),palette=['blue','red','green'];
 next.houseStyleVersion='1.1.0';next.gridColour='housegrid';
 const original=next.lines.map(l=>l.colour??'black');
 next.lines.forEach((l,i)=>l.colour=palette[i%3]);
 next.points.forEach(p=>p.colour=palette[(p.lineIndex??0)%3]);
 next.labels.forEach(label=>{
  const tokens=(label.options??'').split(',').map(t=>t.trim());
  const index=label.equationLine??original.findIndex(c=>tokens.includes(c));
  if(index>=0)label.options=tokens.filter(t=>! /^(black|blue|red|green|orange|answerblue|sourceblue|sourcered|teal|magenta|cyan)$/.test(t)).concat(palette[index%3]).join(',');
 });
 if(next.panels)next.panels=next.panels.map(graphPalette);
 return next;
}
export function graphModel(raw = {}) {
  const model = clone(raw);
  model.version = GRAPH_MODEL_VERSION;
  model.kind = 'cartesian';
  model.bounds = {...{xmin:raw.xmax != null ? 0 : -5,xmax:raw.xmax ?? 5,ymin:raw.ymax != null ? 0 : -5,ymax:raw.ymax ?? 5},...raw.bounds};
  model.xstep = raw.xstep ?? 1; model.ystep = raw.ystep ?? 1;
  model.lines = model.lines ?? (Number.isFinite(raw.m) ? [{m:raw.m,c:raw.c ?? 0}] : []);
  model.points = model.points ?? [];
  model.labels = model.labels ?? [];
  model.widthCm = raw.widthCm ?? 6.5;
  model.heightCm = raw.heightCm ?? 6.5;
  return model;
}
export function validateGraph(model) {
  const {xmin,xmax,ymin,ymax} = model.bounds;
  if (![xmin,xmax,ymin,ymax].every(Number.isFinite) || xmin>=xmax || ymin>=ymax) throw Error('Axis minimum must be less than its maximum.');
  for (const [key,span] of [['xstep',xmax-xmin],['ystep',ymax-ymin]]) if (!Number.isFinite(model[key]) || model[key]<=0 || span/model[key]>100) throw Error('Tick intervals must be positive, with at most 100 intervals per axis.');
  for (const key of ['widthCm','heightCm']) if (!Number.isFinite(model[key]) || model[key]<1 || model[key]>40) throw Error('Graph size must be between 1 and 40 cm.');
  for (const key of ['tickFontPt','labelFontPt']) if (model[key]!=null && (!Number.isFinite(model[key]) || model[key]<=0 || model[key]>144)) throw Error('Graph font size must be positive and at most 144 pt before fitting.');
  for (const line of model.lines) {
    if (line.x != null ? !Number.isFinite(line.x) : ![line.m,line.c].every(Number.isFinite)) throw Error('Enter a valid slope and intercept (or a vertical x value).');
    if (line.domain && (!line.domain.every(Number.isFinite) || line.domain[0]>=line.domain[1])) throw Error('Domain start must be less than its end.');
  }
  for (const p of model.points) if (![p.x,p.y].every(Number.isFinite)) throw Error('Point coordinates must be numbers.');
  for(const p of model.labels)if(![p.x,p.y].every(Number.isFinite))throw Error('Label positions must be numbers.');
  if(model.rectangle){const r=model.rectangle;if(![r.left,r.right,r.bottom,r.top].every(Number.isFinite)||r.left>=r.right||r.bottom>=r.top)throw Error('Rectangle left/bottom must be less than right/top.');}
  return model;
}
export function equationLatex(line){
 if(line.x!=null)return `x=${number(line.x)}`;
 const slope=line.m===1?'x':line.m===-1?'-x':line.m===0?'':`${number(line.m)}x`;
 return 'y='+(slope? slope+(line.c<0?number(line.c):line.c>0?'+'+number(line.c):''):number(line.c));
}
export function resolvedGraphPoint(point,model){
 const line=model.lines[point.lineIndex];
 if(!line||line.x!=null)return point;
 const y=line.m*point.x+line.c;
 return {...point,y,...(point.coordinateLabel?{label:`(${number(point.x)},${number(y)})`}:{})};
}
export function lineExpression(line) { return `(${number(line.m)})*x+(${number(line.c)})`; }
export function visibleDomain(line, bounds) {
  let start=Math.max(bounds.xmin,line.domain?.[0]??bounds.xmin),end=Math.min(bounds.xmax,line.domain?.[1]??bounds.xmax);
  if(line.m===0)return line.c<bounds.ymin||line.c>bounds.ymax?null:[start,end];
  const a=(bounds.ymin-line.c)/line.m,b=(bounds.ymax-line.c)/line.m;
  start=Math.max(start,Math.min(a,b));end=Math.min(end,Math.max(a,b));
  return start<end?[start,end]:null;
}
export function graphTikz(raw, {legacyStrokes=false} = {}) {
  const weight=(role,legacy)=>legacyStrokes?legacy:graphStrokeOption(role);
  const model = validateGraph(graphModel(raw));
  if (model.panels) return graphPanelsTikz(model,legacyStrokes);
  const {xmin,xmax,ymin,ymax}=model.bounds;
  const ticks = (min,max,step) => Array.from({length:Math.max(0,Math.floor(max/step+1e-8)-Math.ceil(min/step-1e-8)+1)},(_,i)=>(Math.ceil(min/step-1e-8)+i)*step).map(number).join(',');
  const styles = String.raw`\definecolor{blue}{HTML}{268CFF}
\definecolor{answerblue}{HTML}{268CFF}
\definecolor{red}{HTML}{EF6068}
\definecolor{green}{HTML}{4F9B63}
\definecolor{orange}{HTML}{EF8B2C}
\definecolor{sourcegray}{RGB}{105,105,105}`;
  // Use a bundled CM design size, then scale nodes: prepareTikz snaps arbitrary fonts.
  const labelFont = String.raw`\fontsize{10}{12}\selectfont`;
  const tickFont = labelFont;
  const fittingEstimate=(model.widthCm*10+18)/(model.printWidthMm??model.widthCm*10);
  const labelPt=model.labelFontPt??GRAPH_TYPOGRAPHY.labelPt*fittingEstimate;
  const tickPt=model.tickFontPt??GRAPH_TYPOGRAPHY.tickPt*fittingEstimate;
  const labelScale=labelPt/10*(model.nodeScale??1);
  const tickScale=tickPt/labelPt;
  const lines = [String.raw`\begin{tikzpicture}[every node/.style={font=${labelFont},scale=${number(labelScale)}}]`,`% mathsmap-graph-model: ${JSON.stringify(model)}`,styles+(model.houseStyleVersion?'\n'+String.raw`\definecolor{housegrid}{HTML}{CCCCCC}`:''),String.raw`\begin{axis}[width=${number(model.widthCm)}cm,height=${number(model.heightCm)}cm,scale only axis,
xmin=${number(xmin)},xmax=${number(xmax)},ymin=${number(ymin)},ymax=${number(ymax)},
at={(0,0)},anchor=origin,${model.overlay?'hide axis,':''}axis lines=middle,axis line style={black,${weight('axis','thin')},${model.axisArrows??(xmin<0?'<->':'->')}},
xtick={${ticks(xmin,xmax,model.xstep)}},ytick={${ticks(ymin,ymax,model.ystep)}},
xticklabel={${model.tickLabels===false||model.ticks===false?String.raw`\relax`:String.raw`\special{dvisvgm:raw <g data-graph-text="tick">}\ifdim\tick pt=0pt\else\pgfmathprintnumber{\tick}\fi\special{dvisvgm:raw </g>}`}},yticklabel={${model.tickLabels===false||model.ticks===false?String.raw`\relax`:String.raw`\special{dvisvgm:raw <g data-graph-text="tick">}\ifdim\tick pt=0pt\else\pgfmathprintnumber{\tick}\fi\special{dvisvgm:raw </g>}`}},
tick label style={font=${tickFont},scale=${number(tickScale)}},${model.xTickLabelShiftPt?`xticklabel style={yshift=${number(model.xTickLabelShiftPt)}pt},major tick length=1.5pt,minor tick length=1pt,`:''}tick style={black,${weight('tick','thin')}},scaled ticks=false,tick align=outside,
${model.ticks===false?'tick style={draw=none},':''}
grid=${model.grid===false?'none':model.xminor||model.yminor?'both':'major'},grid style={${model.gridColour??'gray!65'},${weight('majorGrid','thin')}},${legacyStrokes?'':`minor grid style={${graphStrokeOption('minorGrid')}},`}
${model.xminor?`minor x tick num=${model.xminor},`:''}${model.yminor?`minor y tick num=${model.yminor},`:''}
enlargelimits=false,clip=true,clip mode=individual]`];
  if(!model.overlay&&model.axisLabels!==false){
    lines.push(String.raw`\node[anchor=west,inner sep=2pt] at (axis cs:${number(xmax)},0) {$${model.xlabel??'x'}$};`);
    lines.push(String.raw`\node[anchor=south,inner sep=2pt] at (axis cs:0,${number(ymax)}) {$${model.ylabel??'y'}$};`);
  }
  if(model.rectangle){
    const r=model.rectangle,vertices=[[r.left,r.top],[r.right,r.top],[r.right,r.bottom],[r.left,r.bottom]];
    lines.push(String.raw`\addplot[black,${weight('plot','thick')},mark=*,mark size=2pt] coordinates {${[...vertices,vertices[0]].map(([x,y])=>`(${number(x)},${number(y)})`).join(' ')}};`);
    for(const [i,label]of (r.labels??[]).entries())if(label?.text){const [x,y]=vertices[i];lines.push(String.raw`\node[${label.options??'above right'}] at (axis cs:${number(x)},${number(y)}) {$${/^\(-?[\d.]+,\s*-?[\d.]+\)$/.test(label.text)?`(${number(x)},${number(y)})`:label.text}$};`);}
    if(r.showHeight){const x=r.left-(xmax-xmin)*.04;lines.push(String.raw`\draw[<->,${weight('guide','thick')}] (axis cs:${number(x)},${number(r.bottom)}) -- (axis cs:${number(x)},${number(r.top)}) node[midway,left,yshift=-4pt] {$${number(r.top-r.bottom)}$};`);}
  }
  for (const line of model.lines) {
    const options=`${line.colour??model.plotColour??'answerblue'},${line.dashed?'dashed,':''}${weight('plot','thick')},${line.arrows??'<->'},samples=2`;
    if (line.x != null) lines.push(String.raw`\addplot[${options},domain=${number(ymin)}:${number(ymax)}] ({${number(line.x)}},{x});`);
    else {const domain=visibleDomain(line,model.bounds);if(domain&&domain[0]<domain[1])lines.push(String.raw`\addplot[${options},domain=${number(domain[0])}:${number(domain[1])}] {${lineExpression(line)}};`);}
  }
  for (const source of model.points) {
    const p=resolvedGraphPoint(source,model);
    const colour=p.colour??model.pointColour??'answerblue';
    lines.push(String.raw`\addplot[only marks,mark=${p.mark??'*'},mark size=2pt,${colour}] coordinates {(${number(p.x)},${number(p.y)})};`);
    if(p.label)lines.push(String.raw`\node[${p.anchor??'above right'},${p.anchor?.includes('fill=')?'text='+colour:colour},inner sep=2pt] at (axis cs:${number(p.x)},${number(p.y)}) {$${p.label}$};`);
  }
  for(const original of model.labels){const line=model.lines[original.equationLine],previous=original.originalEquation;const label={...original,text:line&&previous&&(line.m!==previous.m||line.c!==previous.c||line.x!==previous.x)?equationLatex(line):original.text};lines.push(String.raw`\node[${label.options??'above right'},font=${labelFont}] at (axis cs:${number(label.x)},${number(label.y)}) {$${/^\(-?[\d.]+,\s*-?[\d.]+\)$/.test(label.text)?`(${number(x)},${number(y)})`:label.text}$};`);}
  if(model.axisTikz)lines.push(model.axisTikz);
  lines.push(String.raw`\end{axis}`,...(legacyStrokes?[]:[GRAPH_STROKE_MARKER]),String.raw`\end{tikzpicture}`);
  return lines.join('\n').replace(/\n\s*\n/g,'\n');
}
function graphPanelsTikz(model,legacyStrokes) {
  return String.raw`\begin{tikzpicture}`+'\n'+`% mathsmap-graph-model: ${JSON.stringify(model)}`+'\n'+(model.panelHeadings??[]).map((text,i)=>String.raw`\node[anchor=west,font=\fontsize{10}{12}\selectfont,scale=${number((model.labelFontPt??10)/10)}] at (${i*4},1.8) {$${text}$};`).join('\n')+'\n'+model.panels.map((panel,i)=>{
    const body=graphTikz({...panel,panels:undefined},{legacyStrokes}).replace(/\\begin\{tikzpicture\}\[([^\n]*)\]\n/,'\\tikzset{$1}\n').replace(/\\end\{tikzpicture\}\s*$/,'').replace('at={(0,0)},anchor=origin','at={(0,0)},anchor=north west');
    return String.raw`\begin{scope}[shift={({${(i%2)*8}cm},{${-Math.floor(i/2)*7.5}cm})}]`+'\n'+body+'\n'+String.raw`\end{scope}`;
  }).join('\n')+'\n'+String.raw`\end{tikzpicture}`;
}

// Codes generated by scripts retain their model even when their caller only saves code.
export function readGraphModel(code) {
 const match=String(code??'').match(/^% mathsmap-graph-model: (.+)$/m);
 if(!match)return null;
 try {const model=JSON.parse(match[1]);return graphTikz(model)===code||graphTikz(model,{legacyStrokes:true})===code?model:null;} catch{return null;}
}
