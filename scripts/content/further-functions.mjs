// Scoped authoring repair for the MathsMap X1 Further Functions topic.
// Source: the four Further Work with Functions booklets in mathsmap-sources/Stage 6 Extension 1.
// Run without --apply to inspect the generated content; --apply preserves counts/quiz IDs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { houseFormatStem, houseFormatSolution } from '../lib/house-format.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const R = String.raw;
const M = s => `$${s}$`;
const frac = (a, b) => b === 1 ? String(a) : R`\dfrac{${a}}{${b}}`;
const real = R`\mathbb{R}`;
const pair = (a,b) => `(${a},${b})`;
const join = (...ss) => ss.filter(Boolean).join('\n');
const eq = (s, n) => `${s}${n < 0 ? '-' : '+'}${Math.abs(n)}`;

// Sample real functions into native TikZ paths. Domains are split explicitly at poles;
// bounded curves use endpoint markers rather than arrows. All sampled values are clipped
// in data coordinates before conversion to the 6.4 cm by 4.8 cm drawing frame.
export function graph({ x = [-4,4], y = [-4,4], curves = [], points = [], vertical = [], horizontal = [], diagonal = false, equalScale = diagonal, xticks, yticks, direction }) {
  x=[Math.min(0,x[0]),Math.max(0,x[1])]; y=[Math.min(0,y[0]),Math.max(0,y[1])];
  for(const [a,b] of points){
    if(a<x[0])x[0]=a-1;if(a>x[1])x[1]=a+1;
    if(b<y[0])y[0]=b-1;if(b>y[1])y[1]=b+1;
  }
  const unit = Math.min(6.4 / (x[1]-x[0]), 5.8 / (y[1]-y[0]));
  const height = equalScale ? unit * (y[1]-y[0]) : 4.8;
  const X = a => (a - x[0]) * (equalScale?unit:6.4/(x[1]-x[0]));
  const Y = b => (b - y[0]) * (equalScale?unit:4.8/(y[1]-y[0]));
  const num = a => Number(a.toFixed(3));
  const P = (a,b) => `(${num(X(a))},${num(Y(b))})`;
  const ox = Math.min(x[1],Math.max(x[0],0)), oy = Math.min(y[1],Math.max(y[0],0));
  const lines = [R`\begin{tikzpicture}[every node/.style={font=\large}]`, R`\definecolor{curveBlue}{HTML}{268CFF}`, R`\definecolor{curveRed}{HTML}{EF6068}`, R`\definecolor{curveGreen}{HTML}{4F9B63}`];
  lines.push(R`\draw[->] ${P(x[0],oy)} -- ${P(x[1]+0.2,oy)} node[right] {$x$};`, R`\draw[->] ${P(ox,y[0])} -- ${P(ox,y[1]+0.2)} node[above] {$y$};`);
  const tickList = (bounds, explicit) => {
    if(explicit)return explicit;
    const step=[1,2,5,10,20,50].find(s=>s>=(bounds[1]-bounds[0])/6)??100;
    return Array.from({length:Math.floor(bounds[1]/step)-Math.ceil(bounds[0]/step)+1},(_,i)=>(Math.ceil(bounds[0]/step)+i)*step).filter(v=>v!==0).map(v=>[v,String(v)]);
  };
  for(const [v,label] of tickList(x,xticks)) lines.push(R`\draw ${P(v,oy)} ++(0,-0.06) -- ++(0,0.12);`, R`\node[below,font=\small] at ${P(v,oy)} {$${label}$};`);
  for(const [v,label] of tickList(y,yticks)) lines.push(R`\draw ${P(ox,v)} ++(-0.06,0) -- ++(0.12,0);`, R`\node[left,font=\small] at ${P(ox,v)} {$${label}$};`);
  for(const a of vertical) lines.push(R`\draw[dashed] ${P(a,y[0])} -- ${P(a,y[1])};`);
  for(const b of horizontal) lines.push(R`\draw[dashed] ${P(x[0],b)} -- ${P(x[1],b)};`);
  if(diagonal) lines.push(R`\draw[dashed] ${P(Math.max(x[0],y[0]),Math.max(x[0],y[0]))} -- ${P(Math.min(x[1],y[1]),Math.min(x[1],y[1]))};`);
  curves.forEach((c,index)=>{
    const colour = ['curveBlue','curveRed','curveGreen','black'][index%4];
    for(const [lo,hi] of c.domains ?? [x]) {
      let run=[],startsAtDomain=false;
      const flush=(endsAtDomain=false)=>{
        const nearHole=v=>c.holes?.some(h=>Math.abs(v-h)<0.04);
        const startArrow=(!c.bounded||!startsAtDomain)&&!(startsAtDomain&&nearHole(lo));
        const endArrow=(c.continueEnd||!c.bounded||!endsAtDomain)&&!(endsAtDomain&&nearHole(hi));
        const arrows=startArrow&&endArrow?',<->':startArrow?',<-':endArrow?',->':'';
        if(run.length>1)lines.push(R`\draw[thick,${colour}${arrows}] plot coordinates {${run.join(' ')}};`);run=[];
      };
      const samples=c.samples??100;
      for(let i=0;i<=samples;i++){
        const t=lo+(hi-lo)*i/samples;
        const [a,b]=c.param ? c.param(t) : [t,c.fn(t)];
        if(Number.isFinite(a)&&Number.isFinite(b)&&a>=x[0]&&a<=x[1]&&b>=y[0]&&b<=y[1]){if(!run.length)startsAtDomain=i===0;run.push(P(a,b));}else flush();
      }
      flush(true);
    }
    if(c.label) lines.push(R`\node[anchor=west,${colour},font=\normalsize] at (0,${height+0.7+index*0.5}) {$${c.label}$};`);
  });
  for(const p of points){const [a,b,label,anchor='above right',open=false]=p;lines.push(R`\draw[fill=${open?'white':'black'}] ${P(a,b)} circle (1.4pt);`);if(label)lines.push(R`\node[${anchor}${anchor.includes("below")&&Math.abs(b)<(y[1]-y[0])*.12?",yshift=-8pt":""},font=\normalsize] at ${P(a,b)} {$${label}$};`);}
  if(direction) lines.push(R`\draw[->,very thick] ${P(...direction[0])} -- ${P(...direction[1])};`);
  lines.push(R`\end{tikzpicture}`);
  return `[tikz]\n${lines.join('\n')}\n[/tikz]`;
}
const G = (fn,label,extra={}) => graph({curves:[{fn,label}],...extra});
const table = (rows) => M(R`\begin{array}{c|${'c'.repeat(rows[0].length-1)}}${rows.map(r=>r.join('&')).join(R`\\`)}\end{array}`);
const task = (q, working, answer, distractors, extra={}) => ({q,a:join(working,M(answer)),answer:M(answer),distractors:distractors.map(s=>typeof s==='string'?{text:M(s),why:'Check the rule, signs and any excluded endpoints.'}:{text:M(s.value),why:s.why}),...extra});
const withGraph = (item, picture, solutionPicture) => ({...item,q:join(item.q,picture),a:join(item.a,solutionPicture)});

function reciprocal(s,n){
  const h=n%6+1, f=t=>t-h;
  const source=G(f,'f(x)',{x:[-2,h+3],y:[-h-3,4],points:[[h,0,pair(h,0),'below right']]});
  const result=graph({x:[-2,h+3],y:[-3,3],vertical:[h],curves:[{fn:t=>1/(t-h),label:R`1/f(x)`,domains:[[-2,h-0.02],[h+0.02,h+3]]}],points:[[0,-1/h,R`(0,-${frac(1,h)})`,'below left,xshift=-16pt']]});
  if(s==='reciprocal-turning-points'||s==='reciprocal-quadratic-roots'){
    const a=n%6+1, b=s==='reciprocal-turning-points'?a+2:-a*a;
    const qfn=t=>(t-h)**2+b;
    const poles=b<0?[h-a,h+a]:[];
    const ans=R`(${h},${b<0?'-':''}${frac(1,Math.abs(b))})`;
    return withGraph(task(join('The graph of '+M('f(x)')+' is shown.', '(a) Find the turning point of '+M(R`y=1/f(x)`)+'.','(b) Sketch the reciprocal, labelling any asymptotes.'),join(M(R`(x,y)\mapsto(x,1/y)`),'The minimum becomes a maximum.',poles.length?'Vertical asymptotes: '+M(poles.map(v=>'x='+v).join(',\ '))+'.':'There are no vertical asymptotes.'),ans,[pair(h,b),pair(-h,1),pair(h,-b)]),G(qfn,'f(x)',{x:[h-a-2,h+a+2],y:[Math.min(-2,b-2),Math.max(8,b+4)],points:[[h,b,pair(h,b),'below right']]}),graph({x:[h-a-2,h+a+2],y:[-2,2],vertical:poles,curves:[{fn:t=>1/qfn(t),label:R`1/f(x)`,domains:poles.length?[[h-a-2,poles[0]-.03],[poles[0]+.03,poles[1]-.03],[poles[1]+.03,h+a+2]]:[[h-a-2,h+a+2]]}],points:[[h,1/b,ans,'above right']]}));
  }
  if(s==='reciprocal-from-given-graph'){
    return withGraph(task('Use the graph to find the image of '+M(pair(h+2,2))+' on '+M(R`y=1/f(x)`)+'.',M(R`(x,y)\mapsto(x,1/y)`),R`(${h+2},\tfrac12)`,[pair(2,h+2),pair(h+2,-2),pair(h+2,2)]),source,result);
  }
  if(s==='reciprocal-rational-and-inverses'){
    const f2=t=>(t-h-2)/(t-h), inv=t=>(t-h)/(t-h-2);
    const pic=graph({x:[-3,h+5],y:[-4,4],vertical:[h],horizontal:[1],curves:[{fn:f2,label:R`f(x)=\frac{x-${h+2}}{x-${h}}`,domains:[[-3,h-.03],[h+.03,h+5]]}]});
    const sol=graph({x:[-3,h+5],y:[-4,4],vertical:[h+2],horizontal:[1],curves:[{fn:inv,label:R`1/f(x)`,holes:[h],domains:[[-3,h-.03],[h+.03,h+1.97],[h+2.03,h+5]]}],points:[[h,0,'','above',true]]});
    return withGraph(task(join('The graph of '+M('f(x)')+' is shown.', '(a) Sketch '+M(R`y=1/f(x)`)+'.','(b) State its domain. Mark any excluded point.'),join(M(R`\frac1{f(x)}=\frac{x-${h}}{x-${h+2}}`),'The original excluded input remains excluded; the apparent zero is a hole.'),R`x\in\mathbb R\setminus\{${h},${h+2}\}`,[R`x\ne${h+2}`,R`x\ne${h}`,R`x\in\mathbb R`]),pic,sol);
  }
  const query=s==='reciprocal-features-and-asymptotes'?'(a) State the vertical asymptote.\n(b) Sketch '+M(R`y=1/f(x)`)+', marking its invariant points.':'Sketch '+M(R`y=1/f(x)`)+'. Label the asymptote and '+M('y')+'-intercept.';
  return withGraph(task(join('The graph of '+M('f(x)')+' is shown.',query),join('The zero of '+M('f')+' gives the vertical asymptote.', 'Invariant points: '+M(pair(h-1,-1))+' and '+M(pair(h+1,1))+'.'),`x=${h}`,[`y=${h}`,`x=${-h}`,`x=${h+2}`]),source,result);
}

function reciprocalTrig(s,n){
  const mode=n%3,sec=mode===0,cot=mode===2,degrees=Math.floor(n/3)%2===1;
  const name=sec?R`\sec x`:cot?R`\cot x`:R`\operatorname{cosec}x`,end=degrees?360:2*Math.PI,quarter=end/4,eps=end/300;
  const angle=t=>degrees?t*Math.PI/180:t;
  const fn=t=>sec?1/Math.cos(angle(t)):cot?Math.cos(angle(t))/Math.sin(angle(t)):1/Math.sin(angle(t));
  const poles=sec?[quarter,3*quarter]:[0,2*quarter,end];
  const domains=sec?[[0,quarter-eps],[quarter+eps,3*quarter-eps],[3*quarter+eps,end]]:[[eps,2*quarter-eps],[2*quarter+eps,end-eps]];
  const ticks=degrees?[[90,R`90^{\circ}`],[180,R`180^{\circ}`],[270,R`270^{\circ}`],[360,R`360^{\circ}`]]:[[quarter,R`\frac\pi2`],[2*quarter,R`\pi`],[3*quarter,R`\frac{3\pi}2`],[end,R`2\pi`]];
  const interval=degrees?R`0^{\circ}\le x\le360^{\circ}`:R`0\le x\le2\pi`,period=cot?(degrees?R`180^{\circ}`:R`\pi`):(degrees?R`360^{\circ}`:R`2\pi`);
  const pic=graph({x:[0,end],y:[-3,3],xticks:ticks,vertical:poles,curves:[{fn,domains,label:s==='identify-reciprocal-trig-graph'?'y':name}]});
  const primary=graph({x:[0,end],y:[-2,2],xticks:ticks,curves:[{fn:t=>sec?Math.cos(angle(t)):Math.sin(angle(t)),label:sec?R`\cos x`:R`\sin x`},...(cot?[{fn:t=>Math.cos(angle(t)),label:R`\cos x`}]:[])]});
  if(s==='identify-reciprocal-trig-graph')return withGraph(task('Name the reciprocal trigonometric function shown for '+M(interval)+'.',cot?'Each branch decreases from positive infinity to negative infinity.':sec?'The asymptotes are zeros of cosine.':'The asymptotes are zeros of sine.',name,[...(sec?[R`\operatorname{cosec}x`,R`\cot x`]:cot?[R`\sec x`,R`\operatorname{cosec}x`]:[R`\sec x`,R`\cot x`]),R`\tan x`]),pic);
  const asmp=degrees?(sec?R`x=90^{\circ},270^{\circ}`:R`x=0^{\circ},180^{\circ},360^{\circ}`):(sec?R`x=\tfrac\pi2,\tfrac{3\pi}2`:R`x=0,\pi,2\pi`);
  if(s==='reciprocal-trig-asymptotes-and-domain')return withGraph(task('State the vertical asymptotes of '+M(name)+' for '+M(interval)+'.',M(sec?R`\cos x=0`:R`\sin x=0`),asmp,degrees?[sec?R`x=0^{\circ},180^{\circ},360^{\circ}`:R`x=90^{\circ},270^{\circ}`,R`x=45^{\circ},225^{\circ}`,R`x=180^{\circ}`]:[sec?R`x=0,\pi,2\pi`:R`x=\tfrac\pi2,\tfrac{3\pi}2`,R`x=\tfrac\pi4,\tfrac{5\pi}4`,R`x=\pi`]),pic);
  if(s==='reciprocal-trig-range-and-extrema')return withGraph(task('State the range of '+M(name)+' on '+M(interval)+'.',cot?'Each branch covers all real ordinates.':'The branches include '+M(R`y=\pm1`)+ ' but no ordinate between them.',cot?real:R`(-\infty,-1]\cup[1,\infty)`,cot?[R`[-1,1]`,R`(-\infty,-1]\cup[1,\infty)`,R`(0,\infty)`]:[R`[-1,1]`,R`(-\infty,-1)\cup(1,\infty)`,real]),pic);
  if(s==='reciprocal-trig-period-and-parity')return task('State the period and symmetry of '+M(name)+' using '+(degrees?'degrees':'radians')+'.',sec?'Cosine is even, so secant is even.':cot?'Cotangent is odd and repeats after a half-turn.':'Sine and cosecant are odd.',R`${period};\ \text{${sec?'even':'odd'}}`,[R`${period};\ \text{${sec?'odd':'even'}}`,degrees?R`90^{\circ};\ \text{even}`:R`\tfrac\pi2;\ \text{even}`,degrees?R`720^{\circ};\ \text{odd}`:R`4\pi;\ \text{odd}`]);
  if(s==='sketch-reciprocal-trig-from-primary')return withGraph(task('Sketch '+M(name)+' for '+M(interval)+'. Label the asymptotes and state the period.',join(cot?M(R`\cot x=\cos x/\sin x`):'Invert the non-zero primary ordinates.','Draw separate branches at '+(sec?'cosine':'sine')+' zeros.'),period,degrees?[cot?R`360^{\circ}`:R`180^{\circ}`,R`90^{\circ}`,R`720^{\circ}`]:[cot?R`2\pi`:R`\pi`,R`\tfrac\pi2`,R`4\pi`]),primary,pic);
  const target=cot?1:2,solutions=degrees?(sec?R`x=60^{\circ},300^{\circ}`:cot?R`x=45^{\circ},225^{\circ}`:R`x=30^{\circ},150^{\circ}`):(sec?R`x=\tfrac\pi3,\tfrac{5\pi}3`:cot?R`x=\tfrac\pi4,\tfrac{5\pi}4`:R`x=\tfrac\pi6,\tfrac{5\pi}6`);
  const wrong=degrees?[R`x=90^{\circ},270^{\circ}`,R`x=120^{\circ},240^{\circ}`,R`x=210^{\circ},330^{\circ}`]:[R`x=\tfrac\pi2,\tfrac{3\pi}2`,R`x=\tfrac{2\pi}3,\tfrac{4\pi}3`,R`x=\tfrac{7\pi}6,\tfrac{11\pi}6`];
  return withGraph(task('Solve '+M(`${name}=${target}`)+' for '+M(interval)+'.',M(sec?R`\cos x=\tfrac12`:cot?R`\tan x=1`:R`\sin x=\tfrac12`),solutions,wrong),graph({x:[0,end],y:[-3,3],xticks:ticks,vertical:poles,horizontal:[target],curves:[{fn,domains,label:name}]}));
}

function absoluteGraph(s,n){
  const h=n%6+1, f=t=>t-h;
  if(n>=7 && s==='graph-abs-f-x'){
    const fn=t=>(t-h)**2-4;
    return withGraph(task(join('The graph of '+M('f(x)')+' is shown.','Sketch '+M(R`y=|f(x)|`)+'. Label the zeros and reflected turning point.'),join('Reflect only the section below the '+M('x')+'-axis.','The zeros stay fixed; the minimum becomes a local maximum.'),R`(${h-2},0),\ (${h+2},0);\ \text{maximum }(${h},4)`,[R`(${h-2},0),\ (${h+2},0);\ \text{minimum }(${h},-4)`,R`(-${h+2},0),\ (${2-h},0);\ \text{maximum }(-${h},4)`,R`(${h-2},0),\ (${h+2},0);\ \text{minimum }(${h},4)`]),G(fn,'f(x)',{x:[h-4,h+4],y:[-5,8],points:[[h,-4,pair(h,-4),'below right']]}),G(t=>Math.abs(fn(t)),R`|f(x)|`,{x:[h-4,h+4],y:[-1,8],points:[[h,4,pair(h,4),'above right'],[h-2,0,pair(h-2,0),'below left'],[h+2,0,pair(h+2,0),'below right']]}));
  }
  if(n>=7 && s==='graph-f-abs-x'){
    const fn=t=>(t-h)**2-1;
    return withGraph(task('Sketch '+M(R`y=f(|x|)`)+ ' using the graph shown. Label its two minima.', 'Keep the right-hand part, then reflect it in the '+M('y')+'-axis.',R`(-${h},-1),\ (${h},-1)`,[R`(${h},1),\ (-${h},1)`,R`(-${h},-1),\ (0,-1)`,R`(${h},-1),\ (0,-1)`]),G(fn,'f(x)',{x:[-2,h+2],y:[-2,h*h+2],points:[[h,-1,pair(h,-1),'below right']]}),G(t=>fn(Math.abs(t)),R`f(|x|)`,{x:[-h-2,h+2],y:[-2,h*h+2],points:[[-h,-1,pair(-h,-1),'below left'],[h,-1,pair(h,-1),'below right']]}));
  }
  const both=s==='compare-abs-transformations';
  const input=s==='graph-f-abs-x';
  const pic=G(f,R`f(x)=x-${h}`,{x:[-h-3,h+3],y:[-2*h-4,h+4]});
  const result=graph({x:[-h-3,h+3],y:[-h-2,2*h+4],curves:[{fn:t=>input?Math.abs(t)-h:Math.abs(t-h),label:input?R`f(|x|)`:R`|f(x)|`},...(both?[{fn:t=>Math.abs(t)-h,label:R`f(|x|)`}]:[])]});
  if(s==='domain-and-range-abs-functions')return withGraph(task('State the domain and range of '+M(R`y=|f(x)|`)+'.', 'The reflected graph has minimum ordinate '+M('0')+'.',R`D=\mathbb R,\ R=[0,\infty)`,[R`D=\mathbb R,\ R=[-${h},\infty)`,R`D=[0,\infty),\ R=\mathbb R`,R`D=\mathbb R,\ R=(0,\infty)`]),pic,result);
  if(s==='piecewise-and-algebraic-abs-graph')return withGraph(task('Write '+M(R`|f(x)|`)+ ' as a piecewise function, then sketch it.',M(R`x-${h}\ge0\ \text{when}\ x\ge${h}`),R`|f(x)|=\begin{cases}${h}-x&x<${h}\\x-${h}&x\ge${h}\end{cases}`,[R`\begin{cases}x-${h}&x<${h}\\${h}-x&x\ge${h}\end{cases}`,R`|x|-${h}`,R`x+${h}`]),pic,result);
  if(both)return withGraph(task('Sketch (a) '+M(R`y=|f(x)|`)+ ' and (b) '+M(R`y=f(|x|)`)+'. State their vertices.',join('(a) Reflect the part below the '+M('x')+'-axis upward.','(b) Keep the right-hand half and reflect it in the '+M('y')+'-axis.'),R`(${h},0)\ \text{and}\ (0,-${h})`,[R`(0,${h})\ \text{and}\ (${h},0)`,R`(${h},0)\ \text{and}\ (0,${h})`,R`(-${h},0)\ \text{and}\ (0,-${h})`]),pic,result);
  return withGraph(task('Sketch '+M(input?R`y=f(|x|)`:R`y=|f(x)|`)+'. Label its vertex and intercepts.',input?'Keep the right-hand half and reflect it in the '+M('y')+'-axis.':'Reflect the part below the '+M('x')+'-axis upward.',input?pair(0,-h):pair(h,0),[pair(-h,0),pair(0,h),input?pair(h,0):pair(0,-h)]),pic,result);
}

function sums(s,n){
  const h=n%6+1;
  if(s==='parity-sum-difference'){
    const fn=t=>t*t+h;
    return withGraph(task('Let '+M(R`f(x)=x^2`)+ ' and '+M(R`g(x)=${h}`)+'. Sketch their sum and state its symmetry.',M(R`f(x)+g(x)=x^2+${h}`),R`\text{even; symmetric in the }y\text{-axis}`,[R`\text{odd; symmetric about the origin}`,R`\text{neither even nor odd}`,R`\text{symmetric in }y=x`]),graph({x:[-3,3],y:[-1,8],curves:[{fn:t=>t*t,label:'f(x)'},{fn:()=>h,label:'g(x)'}]}),G(fn,'f(x)+g(x)',{x:[-3,3],y:[-1,8]}));
  }
  if(s==='sum-with-asymptote')return withGraph(task('Sketch '+M(R`y=x+\dfrac{${h}}x`)+'. Label the vertical asymptote.',join('Add the two ordinates at the same '+M('x')+'.',M(R`x\ne0`)),R`x=0`,[R`y=0`,R`x=${h}`,R`y=x`]),graph({x:[-5,5],y:[-6,6],vertical:[0],curves:[{fn:t=>t,label:'x'},{fn:t=>h/t,label:R`\frac{${h}}x`,domains:[[-5,-.03],[.03,5]]}]}),graph({x:[-5,5],y:[-6,6],vertical:[0],curves:[{fn:t=>t+h/t,label:R`x+\frac{${h}}x`,domains:[[-5,-.03],[.03,5]]}]}));
  if(s==='sum-difference-absolute-value'){
    const f=t=>Math.abs(t),g=()=>h;
    return withGraph(task('Sketch '+M(R`y=f(x)-g(x)`)+'. Find its vertex.',M(R`f(x)-g(x)=|x|-${h}`),pair(0,-h),[pair(h,0),pair(0,h),pair(-h,0)]),graph({x:[-5,5],y:[-2,6],curves:[{fn:f,label:R`f(x)=|x|`},{fn:g,label:`g(x)=${h}`}]}),G(t=>f(t)-h,'f(x)-g(x)',{x:[-5,5],y:[-h-1,5],points:[[0,-h,pair(0,-h),'below right']]}));
  }
  const diff=s==='difference-from-ordinates', f=t=>t+1,g=t=>h-t, fn=t=>diff?f(t)-g(t):f(t)+g(t);
  if(n>=7){
    const ff=t=>t*t-h,gg=t=>t+1,combined=t=>diff?ff(t)-gg(t):ff(t)+gg(t),ts=[-2,-1,0,1,2];
    const equation=diff?R`y=x^2-x-${h+1}`:R`y=x^2+x${eq('',1-h)}`;
    return withGraph(task(join('The graphs of '+M(R`f(x)=x^2-${h}`)+ ' and '+M('g(x)=x+1')+' are shown.','(a) Complete the table.',table([['x',...ts],['f(x)',...ts.map(()=> '')],['g(x)',...ts.map(()=> '')],[diff?'f(x)-g(x)':'f(x)+g(x)',...ts.map(()=> '')]]),'(b) Sketch the '+(diff?'difference':'sum')+' and give its equation.'),table([['x',...ts],['f(x)',...ts.map(ff)],['g(x)',...ts.map(gg)],[diff?'f(x)-g(x)':'f(x)+g(x)',...ts.map(combined)]]),equation,[diff?R`y=x^2+x${eq('',1-h)}`:R`y=x^2-x-${h+1}`,R`y=x^2+x+${h+1}`,R`y=-x^2+x-${h+1}`]),graph({x:[-4,4],y:[-h-3,8],curves:[{fn:ff,label:'f(x)'},{fn:gg,label:'g(x)'}]}),G(combined,diff?'f(x)-g(x)':'f(x)+g(x)',{x:[-4,4],y:[-h-3,8]}));
  }
  const answer=diff?`2x${eq('',1-h)}`:String(h+1);
  const ts=[-2,-1,0,1,2];
  return withGraph(task(join('The graphs of '+M(R`f(x)=x+1`)+ ' and '+M(R`g(x)=${h}-x`)+ ' are shown.','(a) Complete the table.',table([['x',...ts],['f(x)',...ts.map(()=> '')],['g(x)',...ts.map(()=> '')],[diff?'f(x)-g(x)':'f(x)+g(x)',...ts.map(()=> '')]]),'(b) Sketch their '+(diff?'difference':'sum')+' and give its equation.'),table([['x',...ts],['f(x)',...ts.map(f)],['g(x)',...ts.map(g)],[diff?'f(x)-g(x)':'f(x)+g(x)',...ts.map(fn)]]),`y=${answer}`,[diff?`y=${h+1}`:`y=2x${eq('',1-h)}`,`y=${-h-1}`,`y=2x+${h+1}`]),graph({x:[-3,3],y:[-5,6],curves:[{fn:f,label:'f(x)'},{fn:g,label:'g(x)'}]}),G(fn,diff?'f(x)-g(x)':'f(x)+g(x)',{x:[-3,3],y:[-5,6]}));
}

function domainSum(s,n){
  const h=n%6+1;
  if(s==='domain-intersection-basic')return task('Find the domain of '+M(R`\sqrt{x+${h}}+\sqrt{${h+4}-x}`)+'.',join(M(R`x\ge-${h}`),M(R`x\le${h+4}`),'Use the intersection of the two domains.'),`[-${h},${h+4}]`,[R`(-\infty,${h+4}]`,R`[-${h},\infty)`,real]);
  if(s==='domain-intersection-with-exclusions')return task('Find the domain of '+M(R`\sqrt{x+${h}}+\frac1{x-${h+1}}`)+'.',join(M(R`x\ge-${h}`),M(R`x\ne${h+1}`)),R`[-${h},${h+1})\cup(${h+1},\infty)`,[R`[-${h},\infty)`,R`(-\infty,${h+1})\cup(${h+1},\infty)`,R`[-${h},${h+1}]`]);
  if(s==='fallacy-range-sum-not-sum-ranges')return task('Let '+M(R`f(x)=(x-${h})^2`)+ ' and '+M(R`g(x)=-(x-${h})^2`)+'. Find the range of '+M('f+g')+' and explain why the two ranges cannot be added independently.',join(M(R`f(x)+g(x)=0`),'The ordinates cancel at each input.'),R`\{0\}`,[real,R`[0,\infty)`,R`(-\infty,0]`]);
  const fn=t=>(t-h)**2+h;
  return withGraph(task('Let '+M(R`f(x)=x^2-2(${h})x`)+ ' and '+M(R`g(x)=${h*h+h}`)+'. Find the domain and range of '+M('f+g')+'.',M(R`f(x)+g(x)=(x-${h})^2+${h}`),R`D=\mathbb R,\ R=[${h},\infty)`,[R`D=\mathbb R,\ R=\mathbb R`,R`D=\mathbb R,\ R=[${h*h+h},\infty)`,R`D=[${h},\infty),\ R=\mathbb R`]),s==='range-from-graph-analysis'?G(fn,'f(x)+g(x)',{x:[h-3,h+3],y:[-1,10],points:[[h,h,pair(h,h),'below right']]}):null,G(fn,'f(x)+g(x)',{x:[h-3,h+3],y:[-1,10],points:[[h,h,pair(h,h),'below right']]}));
}

function oneToOne(s,n){
  const h=n%6+1, isPositive=n%2===0;
  const rule=isPositive?R`f(x)=x^3+${h}`:R`f(x)=(x-${h})^2`;
  const pic=G(t=>isPositive?t**3+h:(t-h)**2,'f(x)',{x:isPositive?[-3,3]:[h-3,h+3],y:[-3,8]});
  if(s==='one-to-one-from-function-values')return task(join('These are all values of a function on the listed inputs.',table([['x',-1,0,1],['f(x)',h,h+1,isPositive?h+2:h]]),'Is the function one-to-one on this domain?'),isPositive?'All outputs are different.':'Two different inputs have output '+M(String(h))+'.',isPositive?R`\text{one-to-one}`:R`\text{not one-to-one}`,[isPositive?R`\text{not one-to-one}`:R`\text{one-to-one}`,R`\text{not a function}`,R`\text{a table cannot establish this}`]);
  if(s==='counterexample-not-one-to-one')return withGraph(task('Find two different inputs with the same output for '+M(R`f(x)=(x-${h})^2`)+'.',M(R`f(${h-1})=f(${h+1})=1`),R`x=${h-1},${h+1}`,[R`x=${h},${h+1}`,R`x=${h-2},${h+1}`,R`x=${h-1},${h}`]),G(t=>(t-h)**2,'f(x)',{x:[h-3,h+3],y:[-1,8],horizontal:[1]}));
  if(s==='algebraic-parity-and-injectivity')return task('Show that '+M(R`f(x)=${h+1}x-${h}`)+ ' is one-to-one.',join(M(R`f(a)=f(b)`),M(R`${h+1}a-${h}=${h+1}b-${h}`),M(R`a=b`)),R`\text{one-to-one}`,[R`\text{not one-to-one}`,R`\text{not a function}`,R`\text{one-to-one only for }x\ge0`]);
  const ans=isPositive?R`\text{one-to-one}`:R`\text{not one-to-one}`;
  return withGraph(task('Is '+M(rule)+' one-to-one? Justify using the horizontal line test.',isPositive?'Every horizontal line meets the graph at most once.':'A horizontal line above the vertex meets the graph twice.',ans,[isPositive?R`\text{not one-to-one}`:R`\text{one-to-one}`,R`\text{not a function}`,R`\text{the vertical line test decides this}`]),pic);
}

function reflection(s,n){
  const a=n%6+1,b=a+2;
  if(s==='geometric-properties-reflection-y-equals-x')return task('Reflect '+M(R`P(${a},${b})`)+ ' in '+M('y=x')+' to get '+M(R`P'`)+'. Find the midpoint of '+M(R`PP'`)+'.',join(M(R`P'=(${b},${a})`),M(R`M=\left(\frac{${a}+${b}}2,\frac{${b}+${a}}2\right)`)),pair(a+1,a+1),[pair(a,b),pair(b,a),pair(-a-1,-a-1)]);
  if(s==='reflect-point-in-line-y-equals-x'||s==='geometric-properties-reflection-y-equals-x'){
    const pic=graph({x:[-1,6],y:[-1,6],diagonal:true,points:[[a,b,R`P(${a},${b})`,'above left']]});
    return withGraph(task('Reflect '+M(R`P(${a},${b})`)+ ' in '+M('y=x')+'. Find '+M(R`P'`)+'.','Interchange the two coordinates.',pair(b,a),[pair(-a,-b),pair(a,-b),pair(a,b)]),pic,graph({x:[-1,6],y:[-1,6],diagonal:true,points:[[a,b,'P','above left'],[b,a,R`P'`,'below right']]}));
  }
  if(s==='reflect-features-intercepts-asymptotes')return task('A curve has asymptotes '+M(`x=${a}`)+ ' and '+M(`y=${b}`)+'. State the asymptotes after reflection in '+M('y=x')+'.','Vertical and horizontal lines exchange roles.',R`x=${b},\ y=${a}`,[R`x=${a},\ y=${b}`,R`x=-${b},\ y=-${a}`,R`x=-${a},\ y=-${b}`]);
  if(s==='identify-reflection-symmetry-in-y-equals-x')return task('Does reflection in '+M('y=x')+' leave '+M(R`x^2+y^2=${a*a}`)+' unchanged?','Swapping the variables leaves the equation unchanged.',R`\text{yes}`, [R`\text{no}`,R`\text{only the upper semicircle}`,R`\text{only the lower semicircle}`]);
  const pic=graph({x:[-4,4],y:[-4,4],diagonal:true,curves:[{fn:t=>t+a,label:`y=x+${a}`}]});
  return withGraph(task('Reflect '+M(`y=x+${a}`)+' in '+M('y=x')+'. Give the new equation.',M(`x=y+${a}`),`y=x-${a}`,[`y=-x+${a}`,`y=x+${a}`,`y=-x-${a}`]),pic,graph({x:[-4,4],y:[-4,4],diagonal:true,curves:[{fn:t=>t+a,label:'f(x)'},{fn:t=>t-a,label:R`f^{-1}(x)`}]}));
}

function inverse(s,n){
  const a=n%6+2,b=n%6+1;
  if(s==='evaluate-inverse-at-point')return task('Given '+M(R`f(${a})=${a+b}`)+', find '+M(R`f^{-1}(${a+b})`)+'.', 'The inverse reverses the input and output.',String(a),[String(a+b),String(b),frac(1,a+b)]);
  if(s==='distinguish-inverse-from-reciprocal')return task('For '+M(`f(x)=${a}x+${b}`)+', find '+M(R`f^{-1}(x)`)+'.',join(M(`y=${a}x+${b}`),M(`x=${a}y+${b}`)),R`f^{-1}(x)=\frac{x-${b}}{${a}}`,[R`f^{-1}(x)=\frac1{${a}x+${b}}`,R`f^{-1}(x)=${a}x-${b}`,R`f^{-1}(x)=\frac{x+${b}}{${a}}`]);
  if(s==='find-inverse-cubic-or-odd-power')return task('Find the inverse of '+M(R`f(x)=x^3+${a}`)+'.',join(M(`x=y^3+${a}`),M(`y^3=x-${a}`)),R`f^{-1}(x)=\sqrt[3]{x-${a}}`,[R`f^{-1}(x)=\sqrt[3]{x+${a}}`,R`f^{-1}(x)=(x-${a})^3`,R`f^{-1}(x)=\frac1{x^3+${a}}`]);
  if(s==='find-inverse-rational')return task('Find the inverse of '+M(R`f(x)=\frac{${a}}{x-${b}},\ x\ne${b}`)+'.',join(M(R`x=\frac{${a}}{y-${b}}`),M(R`y-${b}=\frac{${a}}x`)),R`f^{-1}(x)=${b}+\frac{${a}}x,\ x\ne0`,[R`f^{-1}(x)=\frac{x-${b}}{${a}}`,R`f^{-1}(x)=\frac{${a}}{x+${b}}`,R`f^{-1}(x)=${b}+\frac x{${a}}`]);
  if(s==='find-inverse-surd')return task('Find the inverse of '+M(R`f(x)=\sqrt{x-${a}}+${b}`)+'. State its domain.',join(M(R`x=\sqrt{y-${a}}+${b}`),M(R`y-${a}=(x-${b})^2`)),R`f^{-1}(x)=(x-${b})^2+${a},\ x\ge${b}`,[R`f^{-1}(x)=(x-${b})^2+${a},\ x\in\mathbb R`,R`f^{-1}(x)=(x+${b})^2-${a},\ x\ge${b}`,R`f^{-1}(x)=\sqrt{x-${b}}+${a}`]);
  if(s==='find-inverse-restricted-quadratic')return task('Find the inverse of '+M(R`f(x)=(x-${b})^2+${a},\ x\ge${b}`)+'.',join(M(R`x=(y-${b})^2+${a}`),'Choose the positive root because '+M(R`y\ge${b}`)+'.'),R`f^{-1}(x)=${b}+\sqrt{x-${a}},\ x\ge${a}`,[R`f^{-1}(x)=${b}-\sqrt{x-${a}}`,R`f^{-1}(x)=\pm\sqrt{x-${a}}+${b}`,R`f^{-1}(x)=\sqrt{x+${a}}-${b}`]);
  return task('Find the inverse of '+M(`f(x)=${a}x-${b}`)+'.',join(M(`y=${a}x-${b}`),M(`x=${a}y-${b}`),M(`${a}y=x+${b}`)),R`f^{-1}(x)=\frac{x+${b}}{${a}}`,[R`f^{-1}(x)=\frac{x-${b}}{${a}}`,R`f^{-1}(x)=${a}x+${b}`,R`f^{-1}(x)=\frac1{${a}x-${b}}`]);
}

function inverseGraph(s,n){
  const h=n%6+1;
  if(s==='reflect-point-table')return withGraph(task(join('The table gives values of a one-to-one function.',table([['x',0,1,2],['f(x)',h,h+2,h+4]]),'Complete the inverse table. What is '+M(R`f^{-1}(${h+4})`)+'?'),table([['x',h,h+2,h+4],[R`f^{-1}(x)`,0,1,2]]),'2',[String(h+4),'0',frac(1,h+4)]),null,graph({x:[-1,7],y:[-1,7],diagonal:true,curves:[{fn:t=>2*t+h,label:'f(x)'},{fn:t=>(t-h)/2,label:R`f^{-1}(x)`}]}));
  if(s==='transform-asymptotes-domain-range')return reflection('reflect-features-intercepts-asymptotes',n);
  if(s==='reflect-intercepts-features')return withGraph(task('The graph of '+M(`f(x)=x+${h}`)+' is shown. Sketch its inverse and state the inverse '+M('y')+'-intercept.', 'Reflect the graph in '+M('y=x')+'.',pair(0,-h),[pair(0,h),pair(h,0),pair(-h,0)]),G(t=>t+h,'f(x)',{diagonal:true}),graph({diagonal:true,curves:[{fn:t=>t+h,label:'f(x)'},{fn:t=>t-h,label:R`f^{-1}(x)`}]}));
  const f=t=>(t-h)**2, inv=t=>h+Math.sqrt(t);
  const source=graph({x:[-1,h+4],y:[-1,h+4],diagonal:true,curves:[{fn:f,domains:[[h,h+4]],bounded:true,continueEnd:true,label:R`f(x)=(x-${h})^2,\ x\ge${h}`}],points:[[h,0,pair(h,0),'below right']]});
  return withGraph(task((s==='identify-reflected-graph'?'Reflect the restricted graph in '+M('y=x')+'.':'Sketch the inverse of the restricted function shown.')+' Label its endpoint.', 'Reflect in '+M('y=x')+' and interchange the endpoint coordinates.',pair(0,h),[pair(h,0),pair(0,-h),pair(-h,0)]),source,graph({x:[-1,h+4],y:[-1,h+4],diagonal:true,curves:[{fn:f,domains:[[h,h+4]],bounded:true,label:'f(x)'},{fn:inv,domains:[[0,h+4]],bounded:true,continueEnd:true,label:R`f^{-1}(x)`}],points:[[0,h,pair(0,h),'above left']]}));
}

function inverseDomain(s,n){
  const h=n%6+1;
  if(s==='points-of-intersection-with-inverse')return inverseProblems('intersect-quadratic-line-y-equals-x',n);
  if(s==='restrict-domain-for-invertibility')return restrict('quadratic-vertex-restriction',n);
  if(s==='determine-domain-range-inverse-from-original')return task('Let '+M(R`f(x)=\frac1{x-${h}}+${h+2}`)+'. State the domain and range of its inverse.',join(M(R`D_f=\mathbb R\setminus\{${h}\}`),M(R`R_f=\mathbb R\setminus\{${h+2}\}`),'Exchange their roles.'),R`D=\mathbb R\setminus\{${h+2}\},\ R=\mathbb R\setminus\{${h}\}`,[R`D=\mathbb R\setminus\{${h}\},\ R=\mathbb R\setminus\{${h+2}\}`,R`D=\mathbb R,\ R=\mathbb R`,R`D=[${h+2},\infty),\ R=[${h},\infty)`]);
  if(s==='state-domain-range-bounded-interval')return withGraph(task('The function shown has domain '+M(`[0,${h+2}]`)+ ' and range '+M(`[${h},${2*(h+2)+h}]`)+'. State the domain and range of its inverse.', 'Domain and range exchange roles.',R`D=[${h},${3*h+4}],\ R=[0,${h+2}]`,[R`D=[0,${h+2}],\ R=[${h},${3*h+4}]`,R`D=\mathbb R,\ R=\mathbb R`,R`D=(${h},${3*h+4}),\ R=(0,${h+2})`]),graph({x:[-1,9],y:[-1,12],curves:[{fn:t=>2*t+h,domains:[[0,h+2]],bounded:true,label:'f(x)'}],points:[[0,h,'','above'],[h+2,3*h+4,'','above']]}));
  return task('Let '+M(R`f(x)=(x-${h})^2+${h+2},\ x\ge${h}`)+'. State the domain and range of '+M(R`f^{-1}`)+'.',join(M(R`D_f=[${h},\infty),\ R_f=[${h+2},\infty)`),'Swap the domain and range.'),R`D=[${h+2},\infty),\ R=[${h},\infty)`,[R`D=[${h},\infty),\ R=[${h+2},\infty)`,R`D=\mathbb R,\ R=[${h},\infty)`,R`D=[${h+2},\infty),\ R=\mathbb R`]);
}

function restrict(s,n){
  const h=n%6+1,k=h+2;
  if(s==='non-quadratic-monotonic-restriction')return withGraph(task('The graph of '+M(R`f(x)=x^3-3x+${h}`)+ ' is shown. State a maximal interval containing '+M('x=2')+' on which it has an inverse.', 'The right-hand branch is strictly increasing from the minimum at '+M('x=1')+'.',R`[1,\infty)`,[R`[-1,\infty)`,real,R`[-1,1]`]),G(t=>t*t*t-3*t+h,'f(x)',{x:[-3,3],y:[h-5,h+5],points:[[-1,h+2,pair(-1,h+2),'above left'],[1,h-2,pair(1,h-2),'below right']]}));
  if(s==='derive-restricted-inverse-rule')return inverse('find-inverse-restricted-quadratic',n);
  if(s==='restricted-domain-range-state')return inverseDomain('inverse-domain-with-restricted-quadratic',n);
  const containing=s==='specify-domain-containing-point';
  return withGraph(task('For '+M(R`f(x)=(x-${h})^2+${k}`)+', state '+(containing?'the maximal domain containing '+M(`x=${h+2}`):'the two maximal domain restrictions')+' that give an inverse function.', 'Keep either side of the vertex, without crossing it.',containing?R`[${h},\infty)`:R`(-\infty,${h}]\ \text{or}\ [${h},\infty)`,[real,R`(-\infty,${h})\cup(${h},\infty)`,R`[${k},\infty)`]),G(t=>(t-h)**2+k,'f(x)',{x:[h-3,h+3],y:[0,12],points:[[h,k,pair(h,k),'below right']]}));
}

function verify(s,n){
  const a=n%6+2,b=n%6+1;
  if(s==='evaluate-composite-inverse-value')return task('If '+M(R`f(x)=${a}x-${b}`)+', evaluate '+M(R`f^{-1}(f(${a+1}))`)+'.',join(M(R`f(${a+1})=${a*(a+1)-b}`),M(R`f^{-1}(x)=\frac{x+${b}}{${a}}`)),String(a+1),[String(a*(a+1)-b),String(a),frac(1,a+1)]);
  if(s==='identify-verification-error-or-domain')return task('A student claims '+M(R`\sqrt{(x-${b})^2}=x-${b}`)+' for all real '+M('x')+'. State the restriction needed to make this true.',M(R`\sqrt{(x-${b})^2}=|x-${b}|`),R`x\ge${b}`,[real,R`x\le${b}`,R`x\ne${b}`]);
  if(s==='verify-power-root-composition')return task('For '+M(R`f(x)=(x-${b})^2,\ x\ge${b}`)+ ' and '+M(R`g(x)=${b}+\sqrt x`)+', verify both compositions and state their domains.',join(M(R`f(g(x))=(\sqrt x)^2=x\quad(x\ge0)`),M(R`g(f(x))=${b}+\sqrt{(x-${b})^2}=${b}+|x-${b}|=x\quad(x\ge${b})`)),R`f(g(x))=x\ (x\ge0),\ g(f(x))=x\ (x\ge${b})`,[R`f(g(x))=g(f(x))=x,\ x\in\mathbb R`,R`f(g(x))=x^2`,R`g(f(x))=-x,\ x\ge${b}`]);
  if(s==='verify-rational-composition')return task('Verify that '+M(R`f(x)=\frac{${a}}{x-${b}}`)+ ' and '+M(R`g(x)=${b}+\frac{${a}}x`)+' are inverses. State the exclusions.',join(M(R`f(g(x))=\frac{${a}}{${b}+${a}/x-${b}}=x\quad(x\ne0)`),M(R`g(f(x))=${b}+\frac{${a}}{${a}/(x-${b})}=x\quad(x\ne${b})`)),R`f(g(x))=x\ (x\ne0),\ g(f(x))=x\ (x\ne${b})`,[R`f(g(x))=x\ (x\ne${b}),\ g(f(x))=x\ (x\ne0)`,R`f(g(x))=g(f(x))=x\ \text{for all real }x`,R`f(g(x))=g(f(x))=1/x`]);
  return task('Verify that '+M(`f(x)=${a}x-${b}`)+ ' and '+M(R`g(x)=\frac{x+${b}}{${a}}`)+' are inverses.',join(M(R`f(g(x))=${a}\left(\frac{x+${b}}{${a}}\right)-${b}=x`),M(R`g(f(x))=\frac{${a}x-${b}+${b}}{${a}}=x`)),R`f(g(x))=g(f(x))=x`,[R`f(g(x))=g(f(x))=1`,R`f(g(x))=g(f(x))=-x`,R`f(g(x))=g(f(x))=x+${b}`]);
}

function inverseProblems(s,n){
  const h=n%6+1;
  if(s==='solve-self-inverse-parameters')return task('Let '+M(R`f(x)=ax+${h}`)+'. Find '+M('a')+' so that '+M(R`f^{-1}=f`)+'.',join(M(R`f(f(x))=a^2x+${h}(a+1)`),'For this to equal '+M('x')+' for all inputs, '+M(R`a^2=1`)+ ' and '+M(R`a+1=0`)+'.'),R`a=-1`,[R`a=1`,R`a=0`,R`a=2`]);
  if(s==='solve-inverse-equation-context')return task('A conversion uses '+M(R`f(x)=${h+2}x-${h}`)+'. Find the input that gives output '+M(String((h+2)*4-h))+'.',M(R`f^{-1}(y)=\frac{y+${h}}{${h+2}}`),'4',['3',String((h+2)*4-h),'5']);
  if(s==='interpret-intersection-existence')return withGraph(task('Do '+M(`f(x)=x+${h}`)+' and its inverse intersect? Justify.',join(M(`f^{-1}(x)=x-${h}`),'The lines have the same gradient and different intercepts.'),R`\text{no intersections}`,[R`(0,0)`,R`(${h},${h})`,R`\text{infinitely many intersections}`]),graph({diagonal:true,curves:[{fn:t=>t+h,label:'f(x)'},{fn:t=>t-h,label:R`f^{-1}(x)`}]}));
  // An increasing restricted quadratic: every intersection with its inverse lies on y=x.
  const c=h*(h+1), f=t=>t*t-c;
  const ans=pair(h+1,h+1);
  const radical=s==='intersect-radical-fraction-y-equals-x';
  return withGraph(task('Find the intersection of '+M(radical?R`f(x)=\sqrt{x+${c}},\ x\ge-${c}`:R`f(x)=x^2-${c},\ x\ge0`)+ ' and '+M(R`f^{-1}(x)`)+'.',join('The function is increasing, so any intersection lies on '+M('y=x')+'.',M(radical?R`\sqrt{x+${c}}=x\quad(x\ge0)`:`x^2-${c}=x`),M(R`(x-${h+1})(x+${h})=0`),'Reject '+M(`x=-${h}`)+' because '+M(R`x\ge0`)+'.'),ans,[pair(-h,-h),pair(h,h),pair(h+1,-h)]),graph({x:[-2,h+3],y:[-2,h+3],diagonal:true,curves:[{fn:f,domains:[[0,8]],bounded:true,continueEnd:true,label:radical?R`f^{-1}(x)`:'f(x)'},{fn:t=>Math.sqrt(t+c),domains:[[-c,8]],bounded:true,continueEnd:true,label:radical?'f(x)':R`f^{-1}(x)`}]}),graph({x:[-2,h+3],y:[-2,h+3],diagonal:true,curves:[{fn:f,domains:[[0,8]],bounded:true,continueEnd:true,label:radical?R`f^{-1}(x)`:'f(x)'},{fn:t=>Math.sqrt(t+c),domains:[[-c,8]],bounded:true,continueEnd:true,label:radical?'f(x)':R`f^{-1}(x)`}],points:[[h+1,h+1,ans,'above left']]}));
}

function parametricConcept(s,n){
  const h=n%6+1;
  const given=M(R`x=2t+${h},\ y=t-2`);
  if(s==='find-parameter-for-point')return task('For '+given+', find '+M('t')+' at '+M(pair(6+h,1))+'.',M(R`2t+${h}=${6+h}`),'t=3',['t=1','t=-3','t=2']);
  if(s==='identify-parameter-concept')return task('For '+given+', what does one value of '+M('t')+' determine?', 'Substitute the same parameter into both equations.',R`\text{one ordered pair }(x,y)`,[R`\text{only an }x\text{-coordinate}`,R`\text{only a }y\text{-coordinate}`,R`\text{the gradient of every curve}`]);
  if(s==='equivalent-parametrisations')return task('Compare '+M(R`x=t,\ y=2t+${h}`)+ ' and '+M(R`x=2u,\ y=4u+${h}`)+', with real parameters. Do they trace the same curve?',M(R`y=2x+${h}\quad\text{in both cases}`),R`\text{same line, same direction}`,[R`\text{same line, opposite directions}`,R`\text{parallel, distinct lines}`,R`\text{perpendicular lines}`]);
  if(s==='parameter-domain-restriction')return task('For '+given+' with '+M(R`0\le t\le${h+1}`)+', find the range of '+M('x')+'.',join(M(R`x(0)=${h}`),M(R`x(${h+1})=${3*h+2}`)),`[${h},${3*h+2}]`,[`[0,${h+1}]`,`(${h},${3*h+2})`,`[-2,${h-1}]`]);
  return task('For '+given+', find the point when '+M('t=3')+'.',join(M(R`x=2(3)+${h}=${h+6}`),M(R`y=3-2=1`)),pair(h+6,1),[pair(1,h+6),pair(h+3,1),pair(h+6,5)]);
}

function express(s,n){
  const h=n%6+1,r=h+2;
  if(s==='parameterise-linear')return task('Express '+M(`y=3x-${h}`)+' parametrically using '+M('x=2t')+'.',M(`y=3(2t)-${h}`),R`x=2t,\ y=6t-${h}`,[R`x=2t,\ y=3t-${h}`,R`x=2t,\ y=6t+${h}`,R`x=t,\ y=6t-${h}`]);
  if(s==='parameterise-parabola')return task('Express '+M(R`y=(x-${h})^2+2`)+' parametrically using '+M(R`x=t+${h}`)+'.',M(R`y=(t+${h}-${h})^2+2`),R`x=t+${h},\ y=t^2+2`,[R`x=t+${h},\ y=t^2-2`,R`x=t+${h},\ y=t+2`,R`x=t,\ y=t^2+2`]);
  const translated=s!=='parameterise-circle-origin',cx=translated?h:0,cy=translated?-2:0;
  const given=s==='parameterise-circle-general-form'?R`x^2+y^2-${2*h}x+4y=${r*r-h*h-4}`:R`(x-${cx})^2+(y+${-cy})^2=${r*r}`;
  return task('Give a parametrisation of '+M(given)+' that traces the whole circle once.',translated?M(R`(x-${cx})^2+(y+2)^2=${r*r}`):'Use cosine and sine with the radius as coefficient.',R`x=${cx}+${r}\cos t,\ y=${cy}+${r}\sin t,\ 0\le t<2\pi`,[R`x=${cx}+${r*r}\cos t,\ y=${cy}+${r*r}\sin t`,R`x=-${cx}+${r}\cos t,\ y=${-cy+1}+${r}\sin t`,R`x=${cx}+${r}\cos t,\ y=${cy}+${r}\cos t`]);
}

function cartesian(s,n){
  const h=n%6+1;
  if(s==='eliminate-linear')return task('Eliminate '+M('t')+' from '+M(R`x=2t+${h},\ y=3t-1`)+'.',join(M(R`t=\frac{x-${h}}2`),M(R`y=\frac32(x-${h})-1`)),R`3x-2y-${3*h+2}=0`,[R`3x+2y-${3*h+2}=0`,R`2x-3y-${3*h+2}=0`,R`3x-2y+${3*h+2}=0`]);
  if(s==='eliminate-trig-circle')return task('Eliminate '+M('t')+' from '+M(R`x=${h}+3\cos t,\ y=-2+3\sin t`)+'.',M(R`\left(\frac{x-${h}}3\right)^2+\left(\frac{y+2}3\right)^2=1`),R`(x-${h})^2+(y+2)^2=9`,[R`(x+${h})^2+(y-2)^2=9`,R`(x-${h})^2+(y+2)^2=3`,R`(x-${h})^2-(y+2)^2=9`]);
  const bounded=s==='eliminate-with-domain-restriction';
  if(bounded&&n>=7){
    if(n%2===0)return task('Eliminate '+M('t')+' from '+M(R`x=${h}-t^2,\ y=t^2-1`)+', '+M(R`-2\le t\le2`)+'. State the domain and range.',join(M(R`t^2=${h}-x`),M(R`0\le t^2\le4`)),R`y=${h}-x-1,\ D=[${h-4},${h}],\ R=[-1,3]`,[R`y=${h}-x-1,\ D=\mathbb R,\ R=\mathbb R`,R`y=x-${h}-1,\ D=[${h-4},${h}]`,R`y=${h}-x-1,\ D=[${h},${h+4}],\ R=[-1,3]`]);
    return task('Eliminate '+M('t')+' from '+M(R`x=t^2+${h},\ y=2t-1`)+', '+M(R`t\ge0`)+'. State the domain.',join(M(R`t=\sqrt{x-${h}}`),'Use the non-negative square root because '+M(R`t\ge0`)+'.'),R`y=2\sqrt{x-${h}}-1,\ x\ge${h}`,[R`y=-2\sqrt{x-${h}}-1,\ x\ge${h}`,R`y=2\sqrt{x+${h}}-1,\ x\ge-${h}`,R`y=2(x-${h})^2-1,\ x\ge${h}`]);
  }
  const v=Math.floor(n/6)%2+1;
  const suffix=bounded?R`,\ x\ge${h}`:'';
  return task('Eliminate '+M('t')+' from '+M(R`x=t+${h},\ y=2t^2-${v}`)+(bounded?' with '+M(R`t\ge0`):'')+'.'+(bounded?' State the domain.':''),join(M(`t=x-${h}`),bounded?'The restriction gives '+M(R`x\ge${h}`)+'.':''),R`y=2(x-${h})^2-${v}`+suffix,[R`y=2(x+${h})^2-${v}`,R`y=(x-${h})^2-${v}`,R`y=2(x-${h})-${v}`]);
}

function parametricGraph(s,n){
  const h=n%6+1;
  if(s==='sketch-parametric-circle'||s==='identify-graph-from-parametric'){
    const r=h+1,cx=1+Math.floor(n/6)%2,cy=-1;
    const partial=n>=7&&Math.floor(n/6)%2===1,clockwise=n>=7&&!partial,sign=clockwise?-1:1;
    const rule=R`x=${cx}+${r}\cos t,\ y=-1${clockwise?'-':'+'}${r}\sin t`;
    const interval=partial?R`0\le t\le\pi`:R`0\le t\le2\pi`,direction=clockwise?'clockwise':'anticlockwise',shape=partial?'upper semicircle':'circle';
    const pic=graph({x:[cx-r-1,cx+r+1],y:[cy-r-1,cy+r+1],equalScale:true,curves:[{param:t=>[cx+r*Math.cos(t),cy+sign*r*Math.sin(t)],domains:[[0,partial?Math.PI:2*Math.PI]],bounded:true,label:rule}],direction:[[cx,cy+sign*r],[cx-r*Math.sin(.2),cy+sign*r*Math.cos(.2)]],points:[[cx+r,cy,R`t=0`,'below right'],...(partial?[[cx-r,cy,R`t=\pi`,'below left']]:[])]});
    return withGraph(task(join('For '+M(rule)+', '+M(interval)+':','(a) Give the Cartesian equation and describe the curve.','(b) Sketch it, stating the centre and radius. Mark the direction of increasing '+M('t')+'.'),join(M(R`(x-${cx})^2+(y+1)^2=${r*r}`),partial?'The parameter interval gives '+M(R`y\ge-1`)+', with both endpoints included.':'The full parameter interval traces the whole circle.'),R`C=(${cx},-1),\ r=${r};\ \text{${shape}, ${direction}}`,[R`C=(${cx},-1),\ r=${r};\ \text{${shape}, ${clockwise?'anticlockwise':'clockwise'}}`,R`C=(-${cx},1),\ r=${r};\ \text{${shape}, ${direction}}`,partial?R`C=(${cx},-1),\ r=${r};\ \text{circle, anticlockwise}`:R`C=(${cx},-1),\ r=${r*r};\ \text{circle, ${direction}}`]),null,pic);
  }
  const parabola=s==='table-to-sketch-parabola',bounded=s==='parametric-segment-bounded-t';
  const ts=bounded?[0,1,2]:[-2,-1,0,1,2],xf=t=>t+h,yf=t=>parabola?t*t-1:2*t-1;
  const equation=parabola?R`y=(x-${h})^2-1`:`y=2x-${2*h+1}`;
  const pic=graph({x:[h-3,h+4],y:parabola?[-2,6]:[-6,6],curves:[{param:t=>[xf(t),yf(t)],domains:[[bounded?0:-2.5,bounded?2:2.5]],bounded,label:equation}],direction:parabola?[[xf(1),yf(1)],[xf(1.25),yf(1.25)]]:[[xf(.5),yf(.5)],[xf(.8),yf(.8)]],points:bounded?[[h,-1,pair(h,-1),'below right'],[h+2,3,pair(h+2,3),'above left']]:[]});
  return withGraph(task(join('For '+M(R`x=t+${h},\ y=${parabola?'t^2-1':'2t-1'}`)+(bounded?' with '+M(R`0\le t\le2`):'')+':','(a) Complete the table.',table([['t',...ts],['x',...ts.map(()=> '')],['y',...ts.map(()=> '')]]),'(b) Eliminate '+M('t')+' and sketch the curve. Mark the direction of increasing '+M('t')+'.'),join(table([['t',...ts],['x',...ts.map(xf)],['y',...ts.map(yf)]]),M(`t=x-${h}`)),equation+(bounded?R`,\ ${h}\le x\le${h+2}`:''),[parabola?R`y=(x+${h})^2-1`:`y=2x+${2*h+1}`,parabola?R`y=x^2-1`:`y=x-${h+1}`,parabola?R`y=-(x-${h})^2+1`:`y=-2x+${2*h+1}`]),null,pic);
}

function cubic(s,n){
  const h=n%6+1,a=h+1,b=h+3;
  let q,work,answer,bad,fn,zeros;
  if(s==='solve-cubic-factored-repeated'){
    q=R`(x+${h})^2(x-${b})<0`;fn=t=>(t+h)**2*(t-b);zeros=[-h,b];
    work='The squared factor is positive except at '+M(`x=-${h}`)+'. The sign is therefore the sign of '+M(`x-${b}`)+'.';
    answer=R`(-\infty,-${h})\cup(-${h},${b})`;bad=[R`(-\infty,${b})`,R`(-${h},${b})`,R`(${b},\infty)`];
  }else if(s==='solve-cubic-common-factor'){
    q=R`x^3<${a*a}x`;fn=t=>t*(t-a)*(t+a);zeros=[-a,0,a];work=M(R`x(x-${a})(x+${a})<0`);answer=R`(-\infty,-${a})\cup(0,${a})`;bad=[R`(-${a},0)\cup(${a},\infty)`,R`[-${a},${a}]`,R`(-\infty,0)`];
  }else if(s==='solve-cubic-rearrange-factorise'){
    q=R`x^3\le${b}x^2`;fn=t=>t*t*(t-b);zeros=[0,b];work=M(R`x^2(x-${b})\le0`);answer=R`(-\infty,${b}]`;bad=[R`[${b},\infty)`,R`(0,${b})`,R`(-\infty,0)\cup(0,${b})`];
  }else if(s==='solve-polynomial-higher-degree'){
    q=R`(x^2-${h*h})(x^2-${a*a})<0`;fn=t=>(t*t-h*h)*(t*t-a*a);zeros=[-a,-h,h,a];work='Read where the polynomial lies below the '+M('x')+'-axis.';answer=R`(-${a},-${h})\cup(${h},${a})`;bad=[R`(-${h},${h})`,R`(-\infty,-${a})\cup(${a},\infty)`,R`[-${a},${a}]`];
  }else{
    q=R`(x+${a})(x-${h})(x-${b})>0`;fn=t=>(t+a)*(t-h)*(t-b);zeros=[-a,h,b];work='The sign changes at each simple root.';answer=R`(-${a},${h})\cup(${b},\infty)`;bad=[R`(-\infty,-${a})\cup(${h},${b})`,R`[-${a},${h}]\cup[${b},\infty)`,R`(${h},${b})`];
  }
  // Show the sign changes and repeated roots without losing steep branches
  // between samples. A sign sketch needs labelled roots, not oversized y ticks.
  const scale=s==='solve-polynomial-higher-degree'?Math.max(8,Math.abs(fn(h+.5))*1.3):Math.max(8,...Array.from({length:501},(_,i)=>Math.abs(fn(zeros[0]+(zeros.at(-1)-zeros[0])*i/500))))*1.15;
  return withGraph(task('Solve '+M(q)+'.',work,answer,bad),null,graph({x:[zeros[0]-1,zeros.at(-1)+1],y:[-scale,scale],xticks:zeros.map(v=>[v,String(v)]),yticks:[],curves:[{fn,label:'p(x)',samples:500}]}));
}

function rational(s,n){
  const h=n%6+1;
  if(s==='solve-rational-two-fractions')return task('Solve '+M(R`\frac1{x-${h}}>\frac1{x+${h}}`)+'.',join(M(R`x\ne\pm${h}`),'Multiply by '+M(R`(x-${h})^2(x+${h})^2>0`)+'.',M(R`${2*h}(x-${h})(x+${h})>0`)),R`(-\infty,-${h})\cup(${h},\infty)`,[R`(-${h},${h})`,R`(-\infty,-${h}]\cup[${h},\infty)`,R`(${h},\infty)`]);
  if(s==='solve-rational-variable-rhs')return task('Solve '+M(R`\frac1x>\frac{x}{${h*h}}`)+'.',join(M(R`x\ne0`),'Multiply by '+M(R`${h*h}x^2>0`)+'.',M(R`${h*h}x>x^3`),M(R`x(x-${h})(x+${h})<0`)),R`(-\infty,-${h})\cup(0,${h})`,[R`(-${h},0)\cup(${h},\infty)`,R`(-\infty,${h})`,R`(-${h},${h})`]);
  if(s==='solve-rational-quadratic-terms')return task('Solve '+M(R`\frac1{x^2-${h*h}}\ge1`)+'.',join(M(R`x\ne\pm${h}`),'Multiply by '+M(R`(x^2-${h*h})^2>0`)+'.',M(R`(x^2-${h*h})(${h*h+1}-x^2)\ge0`)),R`[-\sqrt{${h*h+1}},-${h})\cup(${h},\sqrt{${h*h+1}}]`,[R`[-${h},${h}]`,R`[-\sqrt{${h*h+1}},\sqrt{${h*h+1}}]`,R`(-\infty,-${h})\cup(${h},\infty)`]);
  if(s==='solve-rational-linear-fraction')return task('Solve '+M(R`\frac{x+${h}}{x-${h}}\le2`)+'.',join(M(R`x\ne${h}`),'Multiply by '+M(R`(x-${h})^2>0`)+'.',M(R`(x+${h})(x-${h})\le2(x-${h})^2`),M(R`(x-${h})(x-${3*h})\ge0`)),R`(-\infty,${h})\cup[${3*h},\infty)`,[R`[${h},${3*h}]`,R`(-\infty,${h}]\cup[${3*h},\infty)`,R`(${h},${3*h})`]);
  return withGraph(task('Solve '+M(R`\frac1{x-${h}}>1`)+'.',join(M(R`x\ne${h}`),'Multiply by '+M(R`(x-${h})^2>0`)+'.',M(R`x-${h}>(x-${h})^2`),M(R`(x-${h})(x-${h+1})<0`)),`(${h},${h+1})`,[`[${h},${h+1}]`,R`(-\infty,${h})\cup(${h+1},\infty)`,R`(${h+1},\infty)`]),null,graph({x:[h-3,h+4],y:[-4,4],vertical:[h],horizontal:[1],curves:[{fn:t=>1/(t-h),label:R`\frac1{x-${h}}`,domains:[[h-3,h-.02],[h+.02,h+4]]}]}));
}

function absInequality(s,n){
  const h=n%6+1,a=h+2;
  if(s==='solve-abs-negative-constant')return task('Solve '+M(R`|x-${h}|<-1`)+'.','An absolute value is non-negative.',R`\varnothing`,[real,R`x<${h-1}`,R`x>${h+1}`]);
  if(s==='solve-abs-zero-boundary')return task('Solve '+M(R`|x-${h}|\le0`)+'.','An absolute value is zero only when its argument is zero.',R`\{${h}\}`,[real,R`\varnothing`,R`\mathbb R\setminus\{${h}\}`]);
  if(s==='solve-abs-reciprocal')return task('Solve '+M(R`\frac1{|x-${h}|}\le\frac1{${a}}`)+'.',join(M(R`x\ne${h}`),M(R`|x-${h}|\ge${a}`)),R`(-\infty,-2]\cup[${2*h+2},\infty)`,[R`[-2,${2*h+2}]`,R`(-\infty,-2)\cup(${2*h+2},\infty)`,R`(-2,${2*h+2})`]);
  const less=s==='solve-abs-less-than';
  return withGraph(task('Solve '+M(R`|x-${h}|${less?R`\le`:'>'}${a}`)+'.',less?M(R`-${a}\le x-${h}\le${a}`):M(R`x-${h}<-${a}\ \text{or}\ x-${h}>${a}`),less?`[-2,${2*h+2}]`:R`(-\infty,-2)\cup(${2*h+2},\infty)`,less?[`(-2,${2*h+2})`,R`(-\infty,-2]\cup[${2*h+2},\infty)`,real]:[`[-2,${2*h+2}]`,R`(-\infty,-2]\cup[${2*h+2},\infty)`,real]),null,graph({x:[-3,2*h+3],y:[-1,a+3],horizontal:[a],curves:[{fn:t=>Math.abs(t-h),label:R`|x-${h}|`}],points:[[-2,a,'','above'],[2*h+2,a,'','above']]}));
}

function absBoth(s,n){
  const h=n%6+1;
  if(s==='solve-abs-quadratic-composite')return task('Solve '+M(R`|x^2-${h*h}|\le${h*h}`)+'.',join(M(R`-${h*h}\le x^2-${h*h}\le${h*h}`),M(R`0\le x^2\le${2*h*h}`)),R`[-${h}\sqrt2,${h}\sqrt2]`,[R`[-${h},${h}]`,R`(-\infty,-${h}\sqrt2]\cup[${h}\sqrt2,\infty)`,R`[-${2*h},${2*h}]`]);
  if(s==='solve-abs-denominator-variable')return task('Solve '+M(R`\frac1{|x-${h}|}\le\frac1{${h}}`)+'.',join(M(R`x\ne${h}`),M(R`|x-${h}|\ge${h}`),M(R`x-${h}\le-${h}\ \text{or}\ x-${h}\ge${h}`)),R`(-\infty,0]\cup[${2*h},\infty)`,[R`[0,${2*h}]`,R`(-\infty,0)\cup(${2*h},\infty)`,real]);
  if(s==='solve-abs-case-analysis-rational')return task('Solve '+M(R`\frac{|x-${h}|}{x+${h}}\le1`)+'.',join(M(R`x\ne-${h}`),'For '+M(`x<-${h}`)+', the quotient is negative, so the inequality holds.','For '+M(`x>-${h}`)+', multiply by the positive denominator.',M(R`|x-${h}|\le x+${h}`),M(R`-(x+${h})\le x-${h}\le x+${h}`),M(R`x\ge0`)),R`(-\infty,-${h})\cup[0,\infty)`,[R`[0,\infty)`,R`(-\infty,-${h}]\cup[0,\infty)`,R`(-${h},0]`]);
  const both=s==='solve-abs-both-sides-linear',f=t=>Math.abs(t-h),g=t=>both?Math.abs(t+h):t+h;
  return withGraph(task('Solve '+M(both?R`|x-${h}|\le|x+${h}|`:R`|x-${h}|<x+${h}`)+'.',both?join('Both sides are non-negative, so squaring is equivalent.',M(R`(x-${h})^2\le(x+${h})^2`),M(R`-4(${h})x\le0`)):join('The right side must be positive.',M(R`-(x+${h})<x-${h}<x+${h}`)),both?R`[0,\infty)`:R`(0,\infty)`,[both?R`(0,\infty)`:R`[0,\infty)`,R`(-\infty,0]`,real]),graph({x:[-h-2,h+2],y:[-h-2,2*h+4],curves:[{fn:f,label:R`|x-${h}|`},{fn:g,label:both?R`|x+${h}|`:`x+${h}`}]}));
}

const authors = {
  'reciprocal-function-graph':reciprocal,
  'graph-reciprocal-trig':reciprocalTrig,
  'graph-absolute-value-of-function':absoluteGraph,
  'graph-sum-difference-functions':sums,
  'domain-range-sum-difference':domainSum,
  'one-to-one-functions':oneToOne,
  'reflection-line-y-equals-x':reflection,
  'find-inverse-function':inverse,
  'graph-inverse-function':inverseGraph,
  'domain-range-inverse':inverseDomain,
  'restrict-domain-for-inverse':restrict,
  'verify-inverse-composition':verify,
  'solve-inverse-function-problems':inverseProblems,
  'parametric-equations-concept':parametricConcept,
  'express-parametric-form':express,
  'parametric-to-cartesian':cartesian,
  'graph-parametric':parametricGraph,
  'solve-cubic-inequalities':cubic,
  'solve-rational-inequalities':rational,
  'solve-absolute-value-inequalities':absInequality,
  'solve-inequality-abs-both-sides':absBoth,
};

// Only these two obsolete archetypes change their slug. Counts and quiz IDs stay fixed.
const inScope = s => ({'classify-relation-mapping-type':'one-to-one-from-function-values','eliminate-hyperbola-reciprocal':'eliminate-parabola'})[s] ?? s;
const configs = {
  'reciprocal-function-graph': ['Invert the ordinates of a graph to sketch its reciprocal.', [R`$(a,b)\mapsto(a,1/b)$ for $b\ne0$.`, R`Zeros approached continuously give vertical asymptotes. Keep the original domain exclusions.`, R`The sign stays the same. Points with $y=\pm1$ stay fixed.`,R`Non-zero maxima become minima, and minima become maxima.`,R`As $f(x)\to\pm\infty$, $1/f(x)\to0$. A non-zero horizontal limit $c$ becomes $1/c$.`],['Mark zeros and excluded inputs','Invert key ordinates','Sketch each branch'], 'reciprocal-linear-and-parabola'],
  'graph-reciprocal-trig': ['Use sine, cosine and tangent to build their reciprocal graphs.', [R`$\operatorname{cosec}x=1/\sin x$, $\sec x=1/\cos x$, $\cot x=\cos x/\sin x$.`,R`Zeros of sine give cosecant and cotangent asymptotes; zeros of cosine give secant asymptotes.`,R`Secant and cosecant have range $(-\infty,-1]\cup[1,\infty)$ and period $2\pi$ ($360^{\circ}$).`,R`Cotangent has range $\mathbb R$ and period $\pi$ ($180^{\circ}$). Its zeros occur at $\pi/2+k\pi$.`,R`Secant is even. Cosecant and cotangent are odd.`],['Mark denominator zeros','Plot key points','Draw separate branches'], 'sketch-reciprocal-trig-from-primary'],
  'graph-absolute-value-of-function': ['Absolute value changes either the output or the input. Check where the bars sit.', [R`$|f(x)|$: keep the part above the $x$-axis; reflect the part below it upward.`,R`$f(|x|)$: keep the right-hand half; reflect it in the $y$-axis.`,R`$|f(x)|$ keeps the original domain. $f(|x|)$ is defined where $|x|$ belongs to the original domain.`],['Identify which quantity is inside the bars','Keep the required part','Reflect and label'], 'compare-abs-transformations'],
  'graph-sum-difference-functions': ['Add or subtract the ordinates at the same input.', [R`$(f+g)(x)=f(x)+g(x)$; $(f-g)(x)=f(x)-g(x)$.`,R`Use only inputs where both functions are defined.`,R`A table of corresponding ordinates helps build the combined graph.`,R`Subtracting $g$ means adding $-g$; watch the signs.`,R`Check intercepts, symmetry and asymptotic behaviour on the combined graph.`],['Read corresponding ordinates','Add or subtract','Plot and join'], 'sum-from-table-or-ordinates'],
  'domain-range-sum-difference': ['Use the shared domain, then find the outputs of the combined function.', [R`$D_{f+g}=D_{f-g}=D_f\cap D_g$.`,R`Keep excluded inputs even if an expression simplifies.`,R`Find the range from the combined rule or graph; do not add the two ranges independently.`,R`An attained extremum uses a closed endpoint. An unattained limit uses an open endpoint.`],['Find both domains','Take their intersection','Find the combined range'], 'range-from-algebraic-sum'],
  'one-to-one-functions': ['A one-to-one function never gives the same output for two different inputs.', [R`A horizontal line meets its graph at most once.`,R`$f(a)=f(b)\implies a=b$ is an algebraic test.`,R`One counterexample with $a\ne b$ and $f(a)=f(b)$ disproves one-to-one behaviour.`,R`A one-to-one function has an inverse function on its range.`],['Apply the horizontal line test','Justify using repeated outputs or strict monotonicity'], 'apply-horizontal-line-test-graph'],
  'reflection-line-y-equals-x': ['Reflection in the line $y=x$ interchanges the coordinates.', [R`$(a,b)\mapsto(b,a)$. Points on $y=x$ stay fixed.`,R`Interchange $x$ and $y$ in a relation to find its reflection.`,R`Vertical and horizontal features exchange roles.`,R`The line $y=x$ bisects the segment joining a point and its image at right angles.`],['Interchange coordinates','Reflect features','Draw the image'], 'reflect-relation-equation-swap-xy'],
  'find-inverse-function': ['An inverse reverses a function’s input and output.', [R`$f^{-1}$ means inverse, not reciprocal.`,R`The function must be one-to-one on the chosen domain.`,R`The inverse domain is the original range; its range is the original domain.`,R`Choose a square-root branch using the original domain restriction.`],['Write the rule using x and y','Interchange x and y','Make y the subject and check the domain'], 'find-inverse-restricted-quadratic'],
  'graph-inverse-function': ['Reflect the graph of a one-to-one function in $y=x$.', [R`$(a,b)$ on $f$ gives $(b,a)$ on $f^{-1}$.`,R`Reflect endpoints and asymptotes as well as ordinary points.`,R`Keep open endpoints open and closed endpoints closed.`,R`Use only the selected one-to-one branch.`],['Mark key features','Interchange coordinates','Sketch the reflected branch'], 'graph-inverse-key-points'],
  'domain-range-inverse': ['The inverse exchanges a function’s domain and range.', [R`$D_{f^{-1}}=R_f$ and $R_{f^{-1}}=D_f$.`,R`Preserve exclusions and open or closed endpoints.`,R`Use the restricted domain when the original rule is not one-to-one everywhere.`],['State the original domain and range','Exchange their roles'], 'inverse-domain-with-restricted-quadratic'],
  'restrict-domain-for-inverse': ['Keep a branch on which the function is one-to-one.', [R`For a parabola with vertex at $x=h$, choose $x\le h$ or $x\ge h$.`,R`A required input determines which branch to choose.`,R`Maximal means the whole branch, including its turning point.`,R`Use the chosen domain to select the inverse’s square-root sign.`],['Locate turning points','Choose a one-to-one branch','Carry the restriction into the inverse'], 'quadratic-vertex-restriction'],
  'verify-inverse-composition': ['Two functions are inverses when each composition returns the original input on its domain.', [R`Check both $f(g(x))=x$ and $g(f(x))=x$.`,R`Check the domain of each composition separately.`,R`$\sqrt{x^2}=|x|$, so $\sqrt{x^2}=x$ requires $x\ge0$.`],['Substitute one rule into the other','Simplify both compositions','State the allowed inputs'], 'verify-power-root-composition'],
  'solve-inverse-function-problems': ['Use the inverse to reverse a calculation or compare the two reflected graphs.', [R`$f^{-1}(a)=b$ means $f(b)=a$.`,R`For an increasing one-to-one function, any intersection with its inverse lies on $y=x$.`,R`A decreasing function can meet its inverse away from $y=x$; check the actual graphs or compositions.`,R`A self-inverse function satisfies $f(f(x))=x$ on its domain.`],['Translate the condition','Solve using the function rule','Check the domains'], 'intersect-quadratic-line-y-equals-x'],
  'parametric-equations-concept': ['A parameter supplies both coordinates of a point.', [R`Use the same value of $t$ in $x(t)$ and $y(t)$.`,R`Changing $t$ traces the curve in a particular direction.`,R`Different parametrisations can trace the same curve.`,R`A restricted parameter interval may trace only a segment or arc.`],['Substitute the parameter','Calculate both coordinates'], 'evaluate-point-from-parameter'],
  'express-parametric-form': ['Introduce a parameter to describe a line, parabola or circle.', [R`Choose one coordinate in terms of $t$, then substitute into the relation.`,R`$(x-h)^2+(y-k)^2=r^2$ gives $x=h+r\cos t$, $y=k+r\sin t$.`,R`$0\le t<2\pi$ traces that circle once anticlockwise, starting at $(h+r,k)$.`],['Choose the parameter rule','Substitute into the relation','State any parameter restriction'], 'parameterise-circle-translated'],
  'parametric-to-cartesian': ['Eliminate the parameter to obtain a relation between $x$ and $y$.', [R`Make $t$ the subject of one equation, then substitute into the other.`,R`Use $\sin^2t+\cos^2t=1$ for circle parametrisations.`,R`Carry parameter restrictions into the Cartesian domain or selected arc.`],['Make the parameter the subject','Substitute or use an identity','Retain restrictions'], 'eliminate-with-domain-restriction'],
  'graph-parametric': ['Build a table, identify the Cartesian curve and mark the direction of increasing parameter.', [R`Each parameter value gives one ordered pair.`,R`Join points in parameter order.`,R`The Cartesian equation alone may describe more of the curve than the parameter interval allows.`,R`Mark included endpoints with filled dots and excluded endpoints with open dots.`],['Complete a coordinate table','Eliminate the parameter','Sketch the selected curve and direction'], 'table-to-sketch-parabola'],
  'solve-cubic-inequalities': ['Factor the polynomial and read where its graph is above or below the axis.', [R`Find the real zeros and test the intervals between them.`,R`The sign changes at an odd-multiplicity root, but not at an even-multiplicity root.`,R`Include zeros for $\le$ or $\ge$; exclude them for $<$ or $>$.`],['Rearrange and factor','Sketch or test the signs','Read the required intervals'], 'solve-cubic-factored-distinct'],
  'solve-rational-inequalities': ['A denominator may change sign. Multiply by its square to keep the inequality direction.', [R`Exclude every input making an original denominator zero.`,R`The square of a non-zero denominator is positive.`,R`For two denominators, use the product of their squares.`,R`Solve the resulting polynomial inequality, then apply the exclusions.`],['Record excluded inputs','Multiply by the squared denominator','Solve and apply exclusions'], 'solve-rational-basic-constant'],
  'solve-absolute-value-inequalities': ['Absolute value measures distance. Compare that distance with the stated bound.', [R`For $a>0$, $|u|<a$ means $-a<u<a$.`,R`For $a>0$, $|u|>a$ means $u<-a$ or $u>a$.`,R`Non-strict inequalities include their boundary points.`,R`Absolute value is non-negative; check zero and negative bounds separately.`],['Check the bound','Write the interval or two cases','Solve and mark endpoints'], 'solve-abs-less-than'],
  'solve-inequality-abs-both-sides': ['Compare the two graphs or split into cases where their signs are known.', [R`Square $|f(x)|$ and $|g(x)|$ safely because both sides are non-negative.`,R`$|f(x)|<g(x)$ requires $g(x)>0$ and is equivalent to $-g(x)<f(x)<g(x)$.`,R`For a negative right side, $|f(x)|>g(x)$ is automatically true.`,R`Retain denominator exclusions and test all case intervals.`],['Find sign boundaries and exclusions','Solve on each case interval','Combine the valid intervals'], 'solve-abs-vs-linear-function'],
};

const targets = {
  'reciprocal-features-and-asymptotes':'Which is the reciprocal graph’s vertical asymptote?',
  'reciprocal-linear-and-parabola':'Which is the reciprocal graph’s vertical asymptote?',
  'reciprocal-turning-points':'Which is the reciprocal graph’s turning point?',
  'reciprocal-quadratic-roots':'Which is the reciprocal graph’s turning point?',
  'reciprocal-from-given-graph':'Which point is the image on the reciprocal graph?',
  'reciprocal-rational-and-inverses':'Which is the reciprocal’s domain, retaining original exclusions?',
  'identify-reciprocal-trig-graph':'Which function is shown?',
  'graph-abs-f-x':'Which gives the zeros and the reflected turning point?',
  'graph-f-abs-x':'Which gives the two minima of the transformed graph?',
  'transform-features-and-intercepts':'Which is the vertex of the transformed graph?',
  'compare-abs-transformations':'Which gives the two vertices in the stated order?',
  'sum-from-table-or-ordinates':'Which is the equation of the sum graph?',
  'difference-from-ordinates':'Which is the equation of the difference graph?',
  'sum-with-asymptote':'Which is the vertical asymptote of the sum?',
  'sum-difference-absolute-value':'Which is the vertex of the difference graph?',
  'parity-sum-difference':'Which describes the symmetry of the sum?',
  'reflect-intercepts-features':'Which is the inverse graph’s y-intercept?',
  'graph-inverse-key-points':'Which is the inverse graph’s endpoint?',
  'identify-reflected-graph':'Which is the inverse graph’s endpoint?',
  'sketch-reciprocal-trig-from-primary':'Which is the period of the reciprocal graph?',
  'table-to-sketch-line':'Which is the Cartesian equation?',
  'table-to-sketch-parabola':'Which is the Cartesian equation?',
  'parametric-segment-bounded-t':'Which Cartesian equation and restriction describe the segment?',
  'sketch-parametric-circle':'Which gives the centre, radius, selected curve and direction?',
  'identify-graph-from-parametric':'Which gives the centre, radius, selected curve and direction?',
};

const clean = (text,kind) => kind==='stem'?houseFormatStem(text):houseFormatSolution(text);
export function authorItem(id,structure,n){
  const item=authors[id](inScope(structure),n);
  const advice=id.includes('reciprocal-trig')?'Use the primary-function zeros, signs and period to distinguish the reciprocal branches.':
    id==='reciprocal-function-graph'?'Invert the ordinate, keeping its sign and the original excluded inputs.':
    id==='graph-absolute-value-of-function'?'Check which quantity is inside the bars: reflect negative outputs upward for $|f(x)|$, or the right-hand half in the y-axis for $f(|x|)$.':
    id.includes('sum-difference')?'Combine the ordinates at the same input, using only the shared domain.':
    id==='one-to-one-functions'?'Test whether two different allowed inputs can give the same output. The horizontal line test checks this graphically.':
    id.includes('parametric')?'Use the same parameter in both coordinate rules; eliminate it while retaining restrictions and direction.':
    id.includes('inequalit')?'Check signs between boundary values, include equality endpoints only for non-strict inequalities, and retain denominator exclusions.':
    id.includes('inverse')||id.includes('reflection')?'Interchange input and output, preserving the chosen branch, domain restrictions and endpoints.':null;
  return {...item,q:clean(item.q,'stem'),a:clean(item.a,'solution'),distractors:item.distractors.map(o=>o.why==='Check the rule, signs and any excluded endpoints.'?{...o,why:advice}:o)};
}

export function revise(content,quiz){
  const id=content.skillId;
  const [intro,facts,steps,exampleStructure]=configs[id];
  const example=authorItem(id,exampleStructure,1);
  const next={...content,theory:{intro,facts,...(steps.length?{steps}:{}),workedExample:{question_text:example.q,solution_text:example.a}},practice:{...content.practice}};
  let index=0;
  const seen=new Set();
  const uniqueItem=(structure,start,seenQuestions)=>{
    for(let offset=0;offset<60;offset++){
      const candidate=authorItem(id,structure,start+offset);
      if(!seenQuestions.has(candidate.q)){seenQuestions.add(candidate.q);return candidate;}
    }
    throw new Error(`${id} ${structure}: exhausted distinct question variants`);
  };
  for(const tier of ['foundation','development','mastery']){
    if(!Array.isArray(content.practice?.[tier]))continue;
    next.practice[tier]=content.practice[tier].map(card=>{
      const item=uniqueItem(card.structure,index++,seen);
      return {question_text:item.q,structure:inScope(card.structure),solution_text:item.a};
    });
  }
  const quizSeen=new Set();
  const nextQuiz={...quiz,questions:quiz.questions.map((q,i)=>{
    // Replace one duplicated zero-bound question to cover the existing reciprocal archetype.
    const structure=id==='solve-absolute-value-inequalities'&&q.id==='q7'?'solve-abs-reciprocal':inScope(q.structure),item=uniqueItem(structure,30+i,quizSeen);
    let prompt=item.q;
    if(structure==='identify-reflected-graph'){
      const h=i%3+1;
      const source=G(t=>t+h,`f(x)=x+${h}`,{diagonal:true});
      const choices=graph({curves:[{fn:t=>t-h,label:'A'},{fn:t=>-t+h,label:'B'},{fn:t=>t+h,label:'C'},{fn:t=>-t-h,label:'D'}]});
      const options=[{text:'$A$',correct:true},{text:'$B$',why:'This changes the gradient instead of interchanging the coordinates.'},{text:'$C$',why:'This is the original function, without reflection.'},{text:'$D$',why:'This reverses the gradient; reflection of this line keeps gradient one.'}];
      return {...q,structure,question_text:join('The first graph shows '+M('f')+'.',source,'Which labelled curve in the second graph is '+M(R`f^{-1}`)+'?',choices),solution_text:join(M(`x=y+${h}`),M(`y=x-${h}`),'Curve A.'),options};
    }
    if(targets[structure]){
      // Keep givens and supplied figures; omit completion tables and freehand instructions.
      const figures=[...item.q.matchAll(/\[tikz\][\s\S]*?\[\/tikz\]/g)].map(m=>m[0]);
      let context=item.q.replace(/\[tikz\][\s\S]*?\[\/tikz\]/g,'').replace(/\$\\begin\{array\}[\s\S]*?\\end\{array\}\$/g,'').trim();
      context=context.replace(/\(a\)[\s\S]*/, '').replace(/\(b\)[\s\S]*/, '').replace(/Sketch /g,'Consider ').replace(/\. Label[^\n]*/g,'.').replace(/\. Find[^\n]*/g,'.').replace(/\. State[^\n]*/g,'.').replace(/\. Mark[^\n]*/g,'.');
      prompt=join(context.trim(),...figures,targets[structure]);
    }
    const optionText=text=>text.replace(/;\s*\\\s*\\text\{([^{}]+)\}\$$/,'$; $1');
    const options=[{text:item.answer,correct:true},...item.distractors].map(o=>({...o,text:optionText(o.text)}));
    if(new Set(options.map(o=>o.text)).size!==4)throw new Error(`${id} ${structure}: duplicate options`);
    const shift=i%4;
    return {...q,structure,question_text:clean(prompt,'stem'),solution_text:item.a,options:[...options.slice(shift),...options.slice(0,shift)]};
  })};
  return {content:next,quiz:nextQuiz};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const apply=process.argv.includes('--apply');
  let cards=0,quizzes=0;
  for(const id of Object.keys(authors)){
    const cp=path.join(root,'public/content',id+'.json'),qp=path.join(root,'public/quizzes',id+'.json');
    const content=JSON.parse(fs.readFileSync(cp,'utf8')),quiz=JSON.parse(fs.readFileSync(qp,'utf8'));
    const next=revise(content,quiz);
    cards+=Object.values(next.content.practice).filter(Array.isArray).reduce((a,qs)=>a+qs.length,0);quizzes+=next.quiz.questions.length;
    if(apply){
      const recovery=path.join(root,'.agywork/further-functions/originals');fs.mkdirSync(recovery,{recursive:true});
      for(const [name,p] of [['content',cp],['quiz',qp]]){const backup=path.join(recovery,`${id}.${name}.json`);if(!fs.existsSync(backup))fs.copyFileSync(p,backup);}
      for(const [file,doc] of [[cp,next.content],[qp,next.quiz]]){
        const temporary=file+'.further-functions.tmp';
        fs.writeFileSync(temporary,JSON.stringify(doc,null,2)+'\n');
        fs.renameSync(temporary,file);
      }
    }
  }
  console.log(`${apply?'Revised':'Previewed'} ${Object.keys(authors).length} skills, ${cards} practice cards and ${quizzes} quiz questions.`);
}
