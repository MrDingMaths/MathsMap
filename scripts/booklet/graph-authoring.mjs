// Reusable authoring helpers; outputs use existing editable TikZ and teaching types.
import crypto from 'node:crypto';
import {graphTikz,styleGraph} from '../../src/lib/graph-model.js';
import {graphStrokeOption} from '../../src/lib/graph-strokes.js';

const finite=(n,label)=>{if(!Number.isFinite(n))throw Error(label+' must be finite');return n;};
const num=n=>String(Number(finite(n,'Coordinate').toPrecision(12)));
const text=value=>String(value).replace(/[\\{}$&#_%~^]/g,c=>({'\\':'\\textbackslash{}','{':'\\{','}':'\\}','$':'\\$','&':'\\&','#':'\\#','_':'\\_','%':'\\%','~':'\\textasciitilde{}','^':'\\textasciicircum{}'}[c]));

export function dataGraph({id,kind,points,bins,bounds,xstep=1,ystep=1,widthMm=78,widthCm=6.5,heightCm=4.5,xlabel='x',ylabel='Frequency',grid=true}){
 if(!id||!['line','frequency-polygon','ogive','histogram'].includes(kind))throw Error('Use an identified line, frequency-polygon, ogive or histogram');
 if(!(widthMm>0&&widthMm<=180))throw Error('Choose a final width up to 180 mm');
 if(!bounds||!Object.values(bounds).every(Number.isFinite))throw Error('Explicit numerical axis bounds are required');
 const inside=([x,y])=>{if(![x,y].every(Number.isFinite)||x<bounds.xmin||x>bounds.xmax||y<bounds.ymin||y>bounds.ymax)throw Error('Data must fit the explicit numerical scale');};
 let axisTikz;
 if(kind==='histogram'){
  if(!Array.isArray(bins)||!bins.length||bounds.ymin!==0)throw Error('Histogram needs explicit bins and a zero baseline');
  for(const [i,b] of bins.entries()){
   if(!(b.upper>b.lower)||!(b.frequency>=0)||!Number.isInteger(b.frequency))throw Error('Invalid histogram boundary/frequency');
   inside([b.lower,0]);inside([b.upper,b.frequency]);
   if(i&&bins[i-1].upper!==b.lower)throw Error('Retain every bin, including zero frequencies');
   if(Math.abs((b.upper-b.lower)-(bins[0].upper-bins[0].lower))>1e-9)throw Error('Unequal-width bins require a reviewed density model');
  }
  axisTikz=bins.filter(b=>b.frequency>0).map(b=>String.raw`\draw[black,${graphStrokeOption('plot')}] (axis cs:${num(b.lower)},0) rectangle (axis cs:${num(b.upper)},${num(b.frequency)});`).join('\n');
 }else{
  if(!Array.isArray(points)||points.length<2)throw Error('Provide at least two ordered readings, including any reviewed endpoints');
  points.forEach((p,i)=>{if(!Array.isArray(p)||p.length!==2)throw Error('A reading is [x,y]');inside(p);if(i&&p[0]<=points[i-1][0])throw Error('Readings must be in increasing numerical order');if(kind==='ogive'&&(p[1]<0||i&&p[1]<points[i-1][1]))throw Error('Cumulative totals cannot decrease or be negative');});
  axisTikz=String.raw`\addplot[blue,${graphStrokeOption('plot')},mark=*,mark size=1.8pt] coordinates {${points.map(p=>'('+p.map(num).join(',')+')').join(' ')}};`;
 }
 const model=styleGraph({bounds,xstep,ystep,widthCm,heightCm,lines:[],points:[],xlabel:String.raw`\text{${text(xlabel)}}`,ylabel:String.raw`\text{${text(ylabel)}}`,grid,axisTikz},widthMm);
 return {id,format:'tikz',widthMm,code:graphTikz(model),spec:{kind:'graph',description:kind+' using explicit numerical scales; source keys, boundaries, endpoint convention and final-size layout require occurrence review.'}};
}

export function pairTeachingBlocks(worked,guided){
 if(!worked?.id||!guided?.id||worked.id===guided.id||!/^worked example$/i.test(worked.sourceAtom?.label??'')||!/^guided practice$/i.test(guided.sourceAtom?.label??''))throw Error('Pair identified Worked Example and Guided Practice groups only; retain other source activity identities');
 if(worked.pairedBlockId&&worked.pairedBlockId!==guided.id||guided.pairedBlockId)throw Error('Resolve existing teaching pairing before creating a new pair');
 const result=[structuredClone(worked),structuredClone(guided)];result[0].pairedBlockId=guided.id;return result;
}

export function measurementBarSource({id,lengthMm,parts,heightMm=12}){
 if(!id||!(lengthMm>0&&lengthMm<=175)||!(heightMm>=8&&heightMm<=30)||!Array.isArray(parts)||!parts.length)throw Error('Measurement bar requires an ID, physical length, height and labelled proportions');
 if(parts.some(p=>!Number.isFinite(p.proportion)||p.proportion<=0)||Math.abs(parts.reduce((sum,p)=>sum+p.proportion,0)-1)>1e-9)throw Error('Bar proportions must be positive and sum to one');
 let start=0;const marks=[];
 for(const [i,part]of parts.entries()){
  const end=start+lengthMm*part.proportion;
  if(i)marks.push(String.raw`\draw[black,line width=.4pt] (${num(start)},0)--(${num(start)},${num(heightMm)});`);
  if(part.label)marks.push(String.raw`\node[text=black] at (${num((start+end)/2)},${num(heightMm/2)}) {${text(part.label)}};`);
  start=end;
 }
 const code=String.raw`\begin{tikzpicture}[x=1mm,y=1mm,every node/.style={font=\fontsize{10}{12}\selectfont}]
\path[use as bounding box] (-.5,-.5) rectangle (${num(lengthMm+.5)},${num(heightMm+.5)});
\special{dvisvgm:raw <g data-measurement-target="bar">}
\draw[black,line width=.4pt] (0,0) rectangle (${num(lengthMm)},${num(heightMm)});
\special{dvisvgm:raw </g>}
${marks.join('\n')}
\end{tikzpicture}`;
 return {id,format:'tikz',code,spec:{kind:'graph',description:`Divided bar with a ruler target of ${num(lengthMm)} mm. Unfilled regions are distinguished by labels. Calibrate the SVG frame before authoring; its width is not the measured bar length.`}};
}

export async function buildMeasurementBar(spec,{compile,browser,availableWidthMm=180}={}){
 const diagram=measurementBarSource(spec);
 compile??=await (await import('./check-pgfplots-engine.mjs')).loadTikzEngine();
 const result=await compile(diagram.code);if(!result.svg)throw Error('Measurement bar compilation produced no SVG');
 let owned=false;
 if(!browser){const {chromium}=await import('playwright-core');try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}owned=true;}
 let page;
 try{
  page=await browser.newPage();await page.setContent(result.svg);
  const measured=await page.evaluate(()=>{const svg=document.querySelector('svg'),bar=svg.querySelector('[data-measurement-target="bar"]');return {frame:svg.viewBox.baseVal.width,bar:bar?.getBBox().width};});
  if(!(measured.frame>0&&measured.bar>0))throw Error('Could not measure the compiled ruler target');
  diagram.widthMm=spec.lengthMm*measured.frame/measured.bar;
  if(!(availableWidthMm>0)||diagram.widthMm>availableWidthMm)throw Error('Measurement frame does not fit this slot; allocate a wider layout instead of shrinking the ruler target');
  const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
  return {diagram,calibration:{codeHash:digest(diagram.code),svgHash:digest(result.svg),targetMm:spec.lengthMm,frameMm:diagram.widthMm,svgFrame:measured.frame,svgBar:measured.bar,finalPageReviewRequired:true}};
 }finally{await page?.close();if(owned)await browser.close();}
}
