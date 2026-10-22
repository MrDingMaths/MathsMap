// Structural signatures of teaching blocks (22 October 2026, user approved).
//
// For theory, definition, worked-example, scaffold and guided-practice blocks the
// source decides STRUCTURE and house style decides every MEASUREMENT. A signature
// holds the structure only: the order of lines, relative indent levels, aligned
// relation columns, relative grouping, arrows (count, endpoints, side, direction,
// label), stacked or side-by-side lanes, which side a figure sits on, and emphasis.
// No absolute millimetre survives into a signature, so a source page and a
// rendered page can be compared relationship by relationship.
//
// Both sources are first reduced to one "ink" model, in millimetres:
//   {words:[{t,x,y,w,h,b,c,m}], rules:[{x,y,w}], figures:[{x,y,w,h}],
//    items:[{x,y}], arrows:[{start,end,heads,curved,label?}]}
// fromSourceGeometry reads PDF words and drawings (points); fromRenderDom reads the
// page-side capture of bench/render-ink.mjs. Everything here is pure.

export const SIGNATURE_VERSION=1;
export const PT_TO_MM=25.4/72;
// Thresholds from the approved rule: alignment within 1.5 mm; a gap more than
// about 1.6 times the median within-group gap starts a new group.
export const SIGNATURE_TOLERANCE=Object.freeze({
 columnMm:1.5,indentMm:1.5,groupRatio:1.6,groupBorderline:[1.3,2.0],rowMm:1.6,gutterMm:4,gutterShare:.12,
 segmentGapMm:8,arrowAnchorMm:12,figureMinMm2:150,mappingMin:.6,similarityMin:.5,firmSimilarity:.75,groupExcessMm:2
});
const RELATIONS='=≠≈<>≤≥:';
const GLYPH_SPLIT='=≠≈<>≤≥';
const round=(value,places=1)=>{const f=10**places;return Math.round(value*f)/f;};
const median=list=>{if(!list.length)return 0;const s=[...list].sort((a,b)=>a-b),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};

// ---- text keys ---------------------------------------------------------------------

// A comparison key: letters and digits only, with the two operator signs kept as words
// so that "÷3" and "\div 3" meet. Relation signs and punctuation carry no key.
export function normKey(text){
 return String(text??'').toLowerCase().replace(/÷/g,'div').replace(/×/g,'times').normalize('NFKD').replace(/[^a-z0-9]/g,'');
}
function bigrams(key){const out=new Map();for(let i=0;i<key.length-1;i++){const g=key.slice(i,i+2);out.set(g,(out.get(g)??0)+1);}return out;}
export function keySimilarity(a,b){
 if(a===b)return 1;
 if(!a.length||!b.length)return 0;
 if(a.length<2||b.length<2)return a===b?1:0;
 const x=bigrams(a),y=bigrams(b);let common=0;
 for(const [g,n] of x)common+=Math.min(n,y.get(g)??0);
 return 2*common/(a.length-1+b.length-1);
}

// LaTeX to the text a reader sees, for matching a block against a page.
export function latexToPlain(latex){
 return String(latex??'')
  .replace(/\\(?:begin|end)\s*\{[^{}]*\}(?:\s*\{[^{}]*\})?/g,' ')
  .replace(/\\\\(?:\[[^\]]*\])?/g,' ')
  .replace(/\\(?:color|textcolor)\s*\{[^{}]*\}/g,' ')
  .replace(/\\(?:rule|hspace\*?|vspace\*?|hphantom|vphantom|phantom|kern|mkern|raisebox)\s*(?:\[[^\]]*\])?(?:\s*\{[^{}]*\}){1,2}/g,' ')
  .replace(/\\boxed\s*\{[^{}]*\}/g,' ')
  .replace(/\\(?:text|textbf|textit|mathrm|mathbf|operatorname|mbox)\s*\{/g,' {')
  .replace(/\\(?:d|t)?frac/g,' ')
  .replace(/\\div/g,'÷').replace(/\\times/g,'×').replace(/\\cdot/g,'·').replace(/\\pm/g,'±')
  .replace(/\\\$/g,'$').replace(/\\%/g,'%').replace(/\\&/g,'&')
  .replace(/\\(?:left|right|displaystyle|quad|qquad|ldots|dots|cdots|hline|phantom)\b/g,' ')
  .replace(/\\[,;:! ]/g,' ')
  .replace(/\\[a-zA-Z]+/g,' ')
  .replace(/[{}^_&]/g,' ');
}
const SKIP_KEYS=new Set(['sourceReview','sourceLayoutEvidence','sourceAtom','provenance','spec','originalDiagram','classification','bankRef','answer','answers','theorySolution','solution','code','codeParts','mathematicalModel','format','version','studio','flow','presentation','questionDiagrams','solutionDiagrams']);
// The words a block prints, in content order: text, formulas, cloze prompts. Answers,
// diagram code and layout are excluded.
export function blockPlainText(block){
 const parts=[];
 const walk=(node,key)=>{
  if(node==null)return;
  if(typeof node==='string'){if(key==='prompt'||key==='text'||key==='label'||key==='title'||key==='caption'||key==='given')parts.push(node);return;}
  if(Array.isArray(node)){node.forEach(child=>walk(child,key));return;}
  if(typeof node!=='object')return;
  if(node.type==='text'&&typeof node.text==='string'){parts.push(node.text.replace(/\$([^$]*\\[^$]*)\$/g,(_,inner)=>latexToPlain(inner)));return;}
  if(node.type==='math'&&typeof node.latex==='string'){parts.push(latexToPlain(node.latex));return;}
  if(node.type==='cloze')return;
  if(node.type==='table'||node.type==='paragraph'||node.type==='list'||node.type==='list-item'||node.rows||node.blocks||node.inlines||node.items||node.children||node.examples||node.content||node.prompt){
   for(const [k,child] of Object.entries(node))if(!SKIP_KEYS.has(k)&&child&&(typeof child==='object'||typeof child==='string'&&['prompt','label','title','caption'].includes(k)))walk(child,k);
   return;
  }
  for(const [k,child] of Object.entries(node))if(!SKIP_KEYS.has(k))walk(child,k);
 };
 walk({content:block?.content,examples:block?.examples,title:block?.title,rows:block?.rows},'');
 return parts.join(' ').replace(/\s+/g,' ').trim();
}

// ---- colour ------------------------------------------------------------------------

export function hueClass(hex){
 const m=/^#?([0-9a-f]{6})$/i.exec(hex??'');if(!m)return 'ink';
 const n=parseInt(m[1],16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;
 const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
 if(d<.12||l>.93||l<.12)return l>.93?'white':'ink';
 const s=d/(1-Math.abs(2*l-1));if(s<.25)return 'ink';
 let h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;
 if(h<20||h>=340)return 'red';
 if(h<50)return 'orange';
 if(h<70)return 'yellow';
 if(h<170)return 'green';
 if(h<265)return 'blue';
 return 'purple';
}

// ---- source geometry: drawings to rules, frames and arrows -------------------------------------

const near=(a,b,t=.06)=>Math.abs(a[0]-b[0])<=t&&Math.abs(a[1]-b[1])<=t;
// Consecutive line items of one drawing that join end to start form a subpath.
function subpaths(items){
 const out=[];let current=null;
 for(const item of items){
  if(item[0]==='re'){out.push({kind:'rect',points:[[item[1],item[2]],[item[3],item[2]],[item[3],item[4]],[item[1],item[4]]]});current=null;continue;}
  if(item[0]==='qu'){out.push({kind:'quad',points:item.slice(1)});current=null;continue;}
  const start=item[1],end=item[item.length-1];
  if(current&&near(current.points.at(-1),start))current.points.push(...(item[0]==='c'?[item[2],item[3],end]:[end]));
  else{current={kind:item[0]==='c'?'curve':'line',points:item[0]==='c'?[start,item[2],item[3],end]:[start,end]};out.push(current);}
  if(item[0]==='c')current.kind='curve';
 }
 for(const path of out)if(path.kind==='line'||path.kind==='curve'){
  const closed=path.points.length>2&&near(path.points[0],path.points.at(-1));
  path.closed=closed;if(closed)path.points=path.points.slice(0,-1);
 }
 return out;
}
const bbox=points=>({x0:Math.min(...points.map(p=>p[0])),y0:Math.min(...points.map(p=>p[1])),x1:Math.max(...points.map(p=>p[0])),y1:Math.max(...points.map(p=>p[1]))});
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
// The apex of a triangular head: the vertex opposite its shortest side.
function apexOf(points){
 const sides=points.map((p,i)=>dist(p,points[(i+1)%3]));
 const shortest=sides.indexOf(Math.min(...sides));
 return points[(shortest+2)%3];
}
const centre=points=>[points.reduce((s,p)=>s+p[0],0)/points.length,points.reduce((s,p)=>s+p[1],0)/points.length];

// Classify one page's drawings (points): fraction-bar rules, frames, and arrows.
// Arrowheads in the source are short filled triangles at a stroke end, a filled block
// arrow (a thin shaft rectangle plus a triangle), or two short strokes forming a V.
export function classifyDrawings(drawings=[]){
 const rules=[],frames=[],heads=[],strokes=[],arrows=[];
 for(const d of drawings){
  const paths=subpaths(d.items??[]);
  const filled=d.type==='f'||d.type==='fs',stroked=d.type==='s'||d.type==='fs';
  const triangles=paths.filter(p=>p.closed&&p.points.length===3);
  const rects=paths.filter(p=>p.kind==='rect'||p.closed&&p.points.length===4);
  if(filled&&paths.length&&paths.every(p=>p.kind==='rect')&&paths.length===1){
   const box=bbox(paths[0].points),w=box.x1-box.x0,h=box.y1-box.y0;
   if(h<=1.5&&w>=1.5){rules.push({x:box.x0,y:(box.y0+box.y1)/2,w,h,colour:d.fill});continue;}
   if(w<=1.5||h<=1.5)continue; // a vertical rule or hairline: table structure
   frames.push({x:box.x0,y:box.y0,w,h,fill:d.fill,stroke:d.stroke});continue;
  }
  // A block arrow: a shaft rectangle and a triangle in one filled drawing.
  if(filled&&triangles.length===1&&rects.length>=1){
   const tri=triangles[0].points,shaft=rects.at(-1).points,apex=apexOf(tri),sb=bbox(shaft);
   const vertical=sb.y1-sb.y0>=sb.x1-sb.x0,sc=centre(shaft);
   const far=vertical?[sc[0],apex[1]<sc[1]?sb.y1:sb.y0]:[apex[0]<sc[0]?sb.x1:sb.x0,sc[1]];
   arrows.push({kind:'block',start:far,end:apex,heads:'end',curved:false,colour:d.fill});continue;
  }
  if(filled&&triangles.length&&!rects.length){for(const t of triangles)heads.push({apex:apexOf(t.points),centre:centre(t.points),size:Math.max(...t.points.map((p,i)=>dist(p,t.points[(i+1)%3])))});continue;}
  if(stroked){
   for(const p of paths){
    if(p.kind==='line'||p.kind==='curve'){
     if(p.closed&&p.points.length===3&&filled){heads.push({apex:apexOf(p.points),centre:centre(p.points),size:Math.max(...p.points.map((q,i)=>dist(q,p.points[(i+1)%3])))});continue;}
     const length=dist(p.points[0],p.points.at(-1));
     if(length<2&&p.points.length<3)continue;
     strokes.push({points:p.points,curved:p.kind==='curve',start:p.points[0],end:p.points.at(-1),width:d.width??0,colour:d.stroke});
    }
   }
  }
 }
 // Open V heads: two short strokes sharing a vertex.
 const used=new Set();
 for(let i=0;i<strokes.length;i++)for(let j=i+1;j<strokes.length;j++){
  const a=strokes[i],b=strokes[j];if(a.points.length>2||b.points.length>2)continue;
  const lengthA=dist(a.start,a.end),lengthB=dist(b.start,b.end);if(lengthA>7||lengthB>7)continue;
  for(const [pa,qa] of [[a.start,a.end],[a.end,a.start]])for(const [pb,qb] of [[b.start,b.end],[b.end,b.start]])if(near(pa,pb,.4)&&!used.has(i)&&!used.has(j)){
   const va=[qa[0]-pa[0],qa[1]-pa[1]],vb=[qb[0]-pb[0],qb[1]-pb[1]],cos=(va[0]*vb[0]+va[1]*vb[1])/(lengthA*lengthB||1);
   if(cos>.2&&cos<.97){heads.push({apex:pa,centre:centre([pa,qa,qb]),size:Math.max(lengthA,lengthB)});used.add(i);used.add(j);}
  }
 }
 // Strokes that are not heads, with a head within 3 points of an end, are arrows.
 for(let i=0;i<strokes.length;i++){
  if(used.has(i))continue;
  const s=strokes[i],length=dist(s.start,s.end);if(length<4&&s.points.length<3)continue;
  const atStart=heads.find(h=>dist(h.apex,s.start)<=3.2),atEnd=heads.find(h=>dist(h.apex,s.end)<=3.2);
  if(!atStart&&!atEnd)continue;
  arrows.push({kind:s.curved?'curved':'straight',start:s.start,end:s.end,heads:atStart&&atEnd?'both':atStart?'start':'end',curved:s.curved,colour:s.colour});
 }
 // A head with no stroke is a free arrowhead: the arrow is unresolved.
 return {rules,frames,arrows,heads};
}

// ---- the ink model --------------------------------------------------------------------

const mmWord=(w,k)=>({t:w.t,x:round(w.x0*k,2),y:round(w.y0*k,2),w:round((w.x1-w.x0)*k,2),h:round((w.y1-w.y0)*k,2),b:!!w.b,c:w.c??null,m:0,p:w.p??0});
// PDF words and drawings (points, top-left origin) as ink in millimetres.
export function sourceInk({words=[],drawings=[],images=[]}={}){
 const k=PT_TO_MM,found=classifyDrawings(drawings);
 const mmPoint=p=>[round(p[0]*k,2),round(p[1]*k,2)];
 return {
  words:words.filter(w=>String(w.t??'').trim()).map(w=>mmWord(w,k)),
  rules:found.rules.filter(r=>r.w*k<=60).map(r=>({x:round(r.x*k,2),y:round(r.y*k,2),w:round(r.w*k,2)})),
  figures:images.filter(i=>(i.bbox[2]-i.bbox[0])*(i.bbox[3]-i.bbox[1])*k*k>=SIGNATURE_TOLERANCE.figureMinMm2).map(i=>({x:round(i.bbox[0]*k,2),y:round(i.bbox[1]*k,2),w:round((i.bbox[2]-i.bbox[0])*k,2),h:round((i.bbox[3]-i.bbox[1])*k,2),kind:'image'})),
  items:[],
  arrows:found.arrows.map(a=>({kind:a.kind,start:mmPoint(a.start),end:mmPoint(a.end),heads:a.heads,curved:a.curved,colour:a.colour??null})),
  freeHeads:found.heads.length-found.arrows.filter(a=>a.kind!=='block').length>0?found.heads.length:0
 };
}

// ---- lines ------------------------------------------------------------------------------

function prepareWords(words){
 const out=[];
 for(const word of words){
  const t=String(word.t).trim();if(!t)continue;
  const lead=t.length>1&&GLYPH_SPLIT.includes(t[0])&&!GLYPH_SPLIT.includes(t[1]),trail=!lead&&t.length>1&&GLYPH_SPLIT.includes(t.at(-1))&&!GLYPH_SPLIT.includes(t.at(-2));
  if(lead){const gw=word.w/t.length;out.push({...word,t:t[0],w:gw,glyph:true},{...word,t:t.slice(1),x:word.x+gw,w:word.w-gw});}
  else if(trail){const gw=word.w/t.length;out.push({...word,t:t.slice(0,-1),w:word.w-gw},{...word,t:t.at(-1),x:word.x+word.w-gw,w:gw,glyph:true});}
  else out.push({...word,t,glyph:t.length===1&&RELATIONS.includes(t)});
 }
 return out;
}
// Render items arrive as whole text nodes and KaTeX leaves: touching items on one
// line are one word, as in the PDF.
function mergeTouching(words){
 const sorted=[...words].sort((a,b)=>a.y-b.y||a.x-b.x),out=[];
 for(const word of sorted){
  const last=out.at(-1);
  if(last&&word.m&&last.m&&!word.glyph&&!last.glyph&&!word.blank&&!last.blank&&Math.abs(last.y-word.y)<.8&&word.x-(last.x+last.w)<.35&&word.x-(last.x+last.w)>-1){
   last.t+=word.t;last.w=word.x+word.w-last.x;last.h=Math.max(last.h,word.h);last.b=last.b&&word.b;continue;
  }
  out.push({...word});
 }
 return out;
}
function assignStacks(words,rules){
 for(const word of words){word.cx=word.x+word.w/2;word.cy=word.y+word.h/2;word.ly=word.cy;}
 for(const rule of rules){
  const members=words.filter(w=>w.cx>=rule.x-.6&&w.cx<=rule.x+rule.w+.6&&Math.abs(w.cy-rule.y)<=8);
  if(!members.some(w=>w.cy<rule.y-.2)||!members.some(w=>w.cy>rule.y+.2))continue;
  for(const w of members)if(w.stackRule==null||Math.abs(w.cy-rule.y)<Math.abs(w.cy-w.stackY)){w.stackRule=rule;w.stackY=rule.y;w.ly=rule.y;}
 }
}
function clusterRows(words){
 const sorted=[...words].sort((a,b)=>a.ly-b.ly||a.x-b.x),rows=[];
 const tol=Math.max(1.2,.3*median(words.map(w=>w.h)));
 for(const word of sorted){
  const row=rows.at(-1);
  // Fractions side by side sit on slightly different bars: stacked words join a row within 2.6 mm.
  const limit=word.stackRule&&row?.words.some(w=>w.stackRule)?2.6:Math.max(tol,SIGNATURE_TOLERANCE.rowMm*.75);
  if(row&&Math.abs(word.ly-row.ly)<=limit){row.words.push(word);row.ly=row.words.reduce((s,w)=>s+w.ly,0)/row.words.length;}
  else rows.push({words:[word],ly:word.ly});
 }
 return rows;
}
// Gutters: x-intervals that few rows cover. They separate side-by-side lanes. A lane that
// holds under 15% of the words or appears in fewer than two rows is a gap inside a formula,
// not a column: its narrower gutter is dropped.
function findGutters(allRows){
 const N=allRows.length;if(N<2)return [];
 // Under four rows, a prose heading can cross the columns; a row of three or more segments
 // (two wide gaps) is itself the evidence of columns, so read the gutters from such rows.
 const segmentsOf=row=>{const xs=[...row.words].sort((a,b)=>a.x-b.x);let n=1,edge=xs[0].x+xs[0].w;for(const w of xs.slice(1)){if(w.x-edge>=8)n++;edge=Math.max(edge,w.x+w.w);}return n;};
 const wide=N<4?allRows.filter(r=>segmentsOf(r)>=3):[];
 const rows=wide.length?wide:allRows;
 // Few rows give little evidence: demand a wide gap.
 const minGap=N<4?Math.max(8,SIGNATURE_TOLERANCE.gutterMm):SIGNATURE_TOLERANCE.gutterMm,minRows=N<3?1:2;
 const all=rows.flatMap(r=>r.words),min=Math.min(...all.map(w=>w.x)),max=Math.max(...all.map(w=>w.x+w.w)),bin=.5,n=Math.ceil((max-min)/bin)+1;
 const coverage=new Array(n).fill(0);
 for(const row of rows){
  const covered=new Set();
  for(const w of row.words)for(let i=Math.floor((w.x-min)/bin);i<=Math.ceil((w.x+w.w-min)/bin);i++)covered.add(i);
  for(const i of covered)if(i>=0&&i<n)coverage[i]++;
 }
 const limit=Math.floor(SIGNATURE_TOLERANCE.gutterShare*N),first=coverage.findIndex(c=>c>limit),last=coverage.length-1-[...coverage].reverse().findIndex(c=>c>limit);
 let gutters=[];let start=null;
 for(let i=first;i<=last;i++){
  if(coverage[i]<=limit){if(start==null)start=i;}
  else if(start!=null){if((i-start)*bin>=minGap)gutters.push({x0:min+start*bin,x1:min+i*bin});start=null;}
 }
 for(;;){
  const edges=[-Infinity,...gutters.map(g=>(g.x0+g.x1)/2),Infinity];
  const lanes=edges.slice(0,-1).map((e,i)=>{const inLane=w=>w.cx>=e&&w.cx<edges[i+1];return {words:all.filter(inLane).length,rows:rows.filter(r=>r.words.some(inLane)).length};});
  const bad=lanes.map((l,i)=>({i,share:l.words/all.length,rows:l.rows})).filter(l=>l.share<.15||l.rows<minRows).sort((a,b)=>a.share-b.share)[0];
  if(!bad||!gutters.length)break;
  // Drop the narrower of the gutters either side of the thin lane.
  const sides=[bad.i-1,bad.i].filter(g=>g>=0&&g<gutters.length);
  const drop=sides.sort((a,b)=>(gutters[a].x1-gutters[a].x0)-(gutters[b].x1-gutters[b].x0))[0];
  gutters=gutters.filter((_,g)=>g!==drop);
 }
 return gutters;
}
const MARKER=/^(?:\d{1,2}|[a-z]|[ivxlc]{1,4})[.)]$/;
const LABEL=/^\(?[a-z]\)?$/;
const BULLET=/^[•●▪◦·-]$/u;
// A list number, part label or bullet at the start of a segment. A segment starts the row
// or follows a gap of at least 6 mm. Markers are structure, not text: they are removed
// from the row and recorded, so lanes and indents are measured on the text itself.
function findMarkers(sorted){
 const markers=[];
 sorted.forEach((w,i)=>{
  const next=sorted[i+1];if(!next||w.glyph)return;
  // A label may follow another (a question number, then a part letter).
  const starts=i===0||w.x-(sorted[i-1].x+sorted[i-1].w)>=6||markers.includes(sorted[i-1]);
  if(!starts||next.x<w.x)return;
  const gap=next.x-(w.x+w.w);
  // A bare part label (a, b, c) stands 4 mm or more from the text; a bare number is just a number.
  if(BULLET.test(w.t)||MARKER.test(w.t)||LABEL.test(w.t)&&gap>=4||w.b&&/^\d{1,2}$/.test(w.t)&&gap>=4)markers.push(w);
 });
 return markers;
}
// Words of a stack read top to bottom as a unit, placed where the stack starts.
const readingOrder=(a,b)=>{
 const ax=a.stackRule?a.stackRule.x:a.x,bx=b.stackRule?b.stackRule.x:b.x;
 if(a.stackRule&&a.stackRule===b.stackRule)return a.y-b.y||a.x-b.x;
 return ax-bx||a.x-b.x;
};

// Lines of one block, lane by lane, with everything a signature compares.
function buildLines(ink){
 const words=mergeTouching(prepareWords(ink.words??[])),rules=ink.rules??[];
 assignStacks(words,rules);
 const rows=clusterRows(words);
 for(const row of rows){
  row.words.sort((a,b)=>a.x-b.x);
  row.markers=findMarkers(row.words);
  row.words=row.words.filter(w=>!row.markers.includes(w));
 }
 const live=rows.filter(r=>r.words.length);
 // Pictures set columns too (a grid of figures has no words between them): each row of
 // figures joins the rows the gutters are read from, without becoming a line.
 const figureRows=[];
 for(const f of [...(ink.figures??[])].filter(f=>f.w*f.h>=SIGNATURE_TOLERANCE.figureMinMm2).sort((a,b)=>a.y-b.y||a.x-b.x)){
  const cy=f.y+f.h/2,row=figureRows.find(r=>Math.abs(r.ly-cy)<=3);
  const pseudo={x:f.x,w:f.w,cx:f.x+f.w/2,cy,ly:cy,t:'',m:0};
  if(row)row.words.push(pseudo);else figureRows.push({ly:cy,words:[pseudo]});
 }
 const gutters=findGutters([...live,...figureRows]);
 const edges=gutters.map(g=>(g.x0+g.x1)/2),laneOf=w=>edges.filter(e=>w.cx>=e).length,laneCount=edges.length+1;
 const lines=[];
 for(let lane=0;lane<laneCount;lane++){
  const laneLines=[];
  for(const row of live){
   const own=row.words.filter(w=>laneOf(w)===lane);
   if(!own.length)continue;
   const first=Math.min(...own.map(w=>w.x));
   // A marker belongs to the lane of the first word to its right.
   const marker=row.markers.find(m=>m.x<first&&!row.words.some(w=>w.x>m.x&&w.x<first));
   laneLines.push({ly:row.ly,words:own.sort(readingOrder),marker:!!marker});
  }
  laneLines.sort((a,b)=>a.ly-b.ly);
  for(const line of laneLines){
   const body=line.words,spatial=[...body].sort((a,b)=>a.x-b.x);
   const x0=spatial[0].x,x1=Math.max(...body.map(w=>w.x+w.w)),y0=Math.min(...body.map(w=>w.y)),y1=Math.max(...body.map(w=>w.y+w.h));
   const relations=spatial.filter(w=>w.glyph).map(w=>({t:w.t,x:w.x}));
   const text=body.map(w=>w.t).join(' ');
   const bolded=body.filter(w=>w.b&&normKey(w.t));
   const hues=body.filter(w=>normKey(w.t)||w.glyph).map(w=>hueClass(w.c)),counts={};for(const h of hues)counts[h]=(counts[h]??0)+1;
   const dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]??'ink';
   const owners={};for(const w of body)if(w.n)owners[w.n]=(owners[w.n]??0)+1;
   const nodeIds=Object.keys(owners).sort((a,b)=>owners[b]-owners[a]);
   lines.push({lane,math:body.some(w=>w.stackRule||w.glyph||w.m),text,key:body.map(w=>normKey(w.t)).join(''),x0,x1,y0,y1,ly:line.ly,relations,marker:line.marker,page:body[0].p??0,nodeIds,
    boldAll:bolded.length>0&&bolded.length===body.filter(w=>normKey(w.t)).length,boldWords:bolded.map(w=>normKey(w.t)).filter(Boolean),hue:(counts[dominant]??0)>=.8*hues.length?dominant:'mixed',words:body.length});
  }
 }
 return {lines,gutters,laneCount,words};
}

// Alignment inside a lane: left, centre or right only when at least two lines share the
// edge (a lone widest line is not "right aligned"); otherwise indented. Indent levels are
// clusters of left edges among lines that hang from the left.
function alignAndIndent(lines,laneCount){
 const tol=SIGNATURE_TOLERANCE.indentMm;
 for(let lane=0;lane<laneCount;lane++){
  const own=lines.filter(l=>l.lane===lane);if(!own.length)continue;
  const left=Math.min(...own.map(l=>l.x0));
  // Only short display lines can be centred or right aligned; prose that fills the lane cannot.
  const right=Math.max(...own.map(l=>l.x1)),short=l=>l.x1-l.x0<=.75*(right-left);
  const share=(l,pick)=>short(l)&&own.filter(o=>o!==l&&short(o)&&Math.abs(pick(o)-pick(l))<=tol&&Math.abs(o.x0-l.x0)>tol).length>0;
  for(const l of own){
   if(l.x0-left<=tol)l.align='left';
   else if(share(l,o=>(o.x0+o.x1)/2))l.align='center';
   else if(share(l,o=>o.x1))l.align='right';
   else l.align='indent';
  }
  const edgesX=[...new Set(own.filter(l=>['left','indent'].includes(l.align)).map(l=>round(l.x0,1)))].sort((a,b)=>a-b),levels=[];
  for(const e of edgesX){if(levels.length&&e-levels.at(-1).max<=tol)levels.at(-1).max=e;else levels.push({min:e,max:e});}
  for(const l of own)l.indent=['left','indent'].includes(l.align)?levels.findIndex(c=>l.x0>=c.min-.05&&l.x0<=c.max+.05):null;
 }
}
function relationColumns(lines){
 const columns=[],tol=SIGNATURE_TOLERANCE.columnMm;
 let run=[];
 const flush=()=>{if(run.length>=2)columns.push({relation:run[0].relations[0].t,lineIds:run.map(l=>l.id),xs:run.map(l=>round(l.relations[0].x,1))});run=[];};
 for(const l of lines){
  const first=l.relations[0];
  if(!first){flush();continue;}
  const head=run[0];
  if(head&&(l.lane!==head.lane||first.t!==head.relations[0].t||Math.abs(first.x-head.relations[0].x)>tol))flush();
  run.push(l);
 }
 flush();
 return columns;
}
// Relative grouping inside a lane. A gap starts a new group when it is more than 1.6
// times the median gap and at least 1.5 mm above it; four gaps are needed to judge.
function lineGroups(lines){
 const groups=[],boundaries=[];
 for(let lane=0;;lane++){
  const own=lines.filter(l=>l.lane===lane);if(!own.length){if(lane>0)break;continue;}
  const gaps=own.slice(1).map((l,i)=>Math.max(0,l.y0-own[i].y1));
  const med=Math.max(median(gaps),.8);
  let current=[own[0].id];
  own.slice(1).forEach((l,i)=>{
   const reliable=gaps.length>=4&&l.page===own[i].page,ratio=gaps[i]/med,[lo,hi]=SIGNATURE_TOLERANCE.groupBorderline;
   const split=reliable&&ratio>SIGNATURE_TOLERANCE.groupRatio&&gaps[i]-med>=SIGNATURE_TOLERANCE.groupExcessMm;
   boundaries.push({after:own[i].id,before:l.id,gapMm:round(gaps[i],2),ratio:round(ratio,2),split,borderline:reliable&&(ratio>=lo&&ratio<=hi||gaps[i]-med>=SIGNATURE_TOLERANCE.groupExcessMm!==ratio>SIGNATURE_TOLERANCE.groupRatio),reliable});
   if(split){groups.push(current);current=[l.id];}else current.push(l.id);
  });
  groups.push(current);
 }
 return {groups,boundaries};
}
const compass=(dx,dy)=>{
 const a=Math.atan2(dy,dx)*180/Math.PI,names=['right','down-right','down','down-left','left','up-left','up','up-right'];
 return names[Math.round(((a+360)%360)/45)%8];
};
function lineDistance(l,p){
 const dx=Math.max(l.x0-p[0],0,p[0]-l.x1),dy=Math.max(l.y0-p[1],0,p[1]-l.y1);
 return Math.hypot(dx,dy);
}
function nearestLine(lines,point){
 let best=null,bestD=Infinity;
 for(const l of lines){const d=lineDistance(l,point);if(d<bestD){bestD=d;best=l;}}
 return best&&bestD<=SIGNATURE_TOLERANCE.arrowAnchorMm?best:null;
}
function describeArrows(arrows,lines,words,laneCount){
 const out=[];
 for(const a of arrows){
  const from=nearestLine(lines,a.heads==='start'?a.end:a.start);
  let to=nearestLine(lines,a.heads==='start'?a.start:a.end);
  // A tip that lands on the line the tail joins points at something with no text (a picture).
  if(to===from)to=null;
  const tail=a.heads==='start'?a.end:a.start,tip=a.heads==='start'?a.start:a.end;
  const mid=a.mid??[(a.start[0]+a.end[0])/2,(a.start[1]+a.end[1])/2];
  const laneLines=lines.filter(l=>l.lane===(from??to)?.lane);
  const lx0=laneLines.length?Math.min(...laneLines.map(l=>l.x0)):-Infinity,lx1=laneLines.length?Math.max(...laneLines.map(l=>l.x1)):Infinity;
  const spans=a.curved?'curved':'straight';
  let side;
  if(mid[0]>lx1+1)side='right';else if(mid[0]<lx0-1)side='left';
  else if(from&&to&&from!==to&&mid[1]>Math.min(from.y1,to.y1)-.5&&mid[1]<Math.max(from.y0,to.y0)+.5)side='between';
  else side=mid[1]<(from??to)?.y0?'above':'below';
  let label=a.label;
  if(label==null){
   // The words nearest the middle of a drawn arrow, outside any line it joins.
   const near=words.filter(w=>Math.hypot(w.cx-mid[0],w.cy-mid[1])<=9).sort((p,q)=>Math.hypot(p.cx-mid[0],p.cy-mid[1])-Math.hypot(q.cx-mid[0],q.cy-mid[1])).slice(0,3);
   label=near.length?near.map(w=>w.t).join(' '):'';
  }
  out.push({from:from?.id??null,to:to?.id??null,kind:a.kind??spans,side:laneCount>1&&side==='right'?'right':side,direction:compass(tip[0]-tail[0],tip[1]-tail[1]),label:normKey(label),labelText:String(label??'').replace(/\s+/g,' ').trim(),heads:a.heads,hue:hueClass(a.colour)});
 }
 return out;
}
function describeFigures(figures,lines){
 const big=figures.filter(f=>f.w*f.h>=SIGNATURE_TOLERANCE.figureMinMm2);
 if(!big.length)return null;
 const f=[...big].sort((a,b)=>b.w*b.h-a.w*a.h)[0];
 if(!lines.length)return {side:'only',count:big.length};
 const x0=Math.min(...lines.map(l=>l.x0)),x1=Math.max(...lines.map(l=>l.x1)),y0=Math.min(...lines.map(l=>l.y0)),y1=Math.max(...lines.map(l=>l.y1));
 let side;
 if(f.x+f.w<=x0+2)side='left';
 else if(f.x>=x1-2)side='right';
 else if(f.y+f.h<=y0+1)side='above';
 else if(f.y>=y1-1)side='below';
 else side='inline';
 return {side,count:big.length};
}

// The structural signature of one block's ink.
export function signatureFromInk(ink){
 const {lines,laneCount,words}=buildLines(ink);
 lines.forEach((l,i)=>{l.id='L'+i;});
 alignAndIndent(lines,laneCount);
 const columns=relationColumns(lines),{groups,boundaries}=lineGroups(lines);
 // List and part markers in the render are not text nodes: an item start above a line marks it.
 for(const item of ink.items??[])for(const l of lines)if(!l.marker&&item.x<=l.x0+.5&&l.y0>=item.y-1&&l.y0<=item.y+Math.max(item.h??8,8)&&!lines.some(o=>o!==l&&o.lane===l.lane&&o.y0<l.y0&&o.y0>=item.y-1)){l.marker=true;break;}
 const arrows=describeArrows(ink.arrows??[],lines,words,laneCount);
 const emphasis=[];
 const bold=lines.filter(l=>l.boldAll).map(l=>l.id);if(bold.length)emphasis.push({lineIds:bold,kind:'bold'});
 const coloured=lines.filter(l=>!['ink','mixed'].includes(l.hue));
 for(const hue of new Set(coloured.map(l=>l.hue)))emphasis.push({lineIds:coloured.filter(l=>l.hue===hue).map(l=>l.id),kind:'colour:'+hue});
 return {
  version:SIGNATURE_VERSION,
  order:lines.map(l=>l.id),
  lines:lines.map(l=>({id:l.id,math:!!l.math,tokens:l.key,text:l.text,lane:l.lane,indent:l.indent,align:l.align,marker:l.marker,relation:l.relations[0]?.t??null,boldWords:l.boldWords,hue:l.hue,...(l.nodeIds.length?{nodeId:l.nodeIds[0],nodeIds:l.nodeIds}:{}),
   geometry:{x0:round(l.x0),x1:round(l.x1),y0:round(l.y0),y1:round(l.y1),relationX:l.relations[0]?round(l.relations[0].x):null}})),
  columns:columns.map(c=>({relation:c.relation,lineIds:c.lineIds})),
  groups,boundaries,
  arrows,
  layout:laneCount>1?'side-by-side':'stacked',lanes:laneCount,
  figure:describeFigures(ink.figures??[],lines),
  emphasis,
  columnGeometry:columns.map(c=>c.xs),
  rasterArrows:ink.rasterArrows??false
 };
}

export function fromSourceGeometry(words,drawings,images=[]){return signatureFromInk(sourceInk({words,drawings,images}));}
// `blockInk` is the page-side capture for one block: {words,rules,figures,items,arrows},
// possibly spread over several pages (an array of captures is concatenated by the caller).
export function fromRenderDom(blockInk){return signatureFromInk(blockInk??{words:[]});}

// A hash of the structure alone: tokens, text, labels and geometry are excluded, so two
// blocks with the same layout of lines, columns, groups and arrows hash alike.
export function structureOf(signature){
 const index=new Map(signature.lines.map((l,i)=>[l.id,i]));
 return {
  lanes:signature.lanes,
  lines:signature.lines.map(l=>[l.lane,l.indent,l.align,l.marker?1:0,l.relation?1:0]),
  columns:signature.columns.map(c=>c.lineIds.map(id=>index.get(id))),
  groups:signature.groups.map(g=>g.map(id=>index.get(id))),
  arrows:signature.arrows.map(a=>[a.kind,a.side,a.direction,index.get(a.from)??null,index.get(a.to)??null]),
  figure:signature.figure?.side??null,
  emphasis:signature.emphasis.map(e=>[e.kind,e.lineIds.map(id=>index.get(id))])
 };
}
export function signatureHash(signature){
 const text=JSON.stringify(structureOf(signature));
 let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
 return h.toString(16).padStart(8,'0')+text.length.toString(16);
}

// ---- comparison ----------------------------------------------------------------------------

// Pair lines by their text keys, in order (Needleman-Wunsch on key similarity).
export function mapLines(source,render){
 const a=source.lines,b=render.lines,n=a.length,m=b.length,GAP=-1;
 const sim=(i,j)=>{const x=a[i].tokens,y=b[j].tokens;if(!x&&!y)return .8;return keySimilarity(x,y);};
 const score=Array.from({length:n+1},()=>new Float32Array(m+1)),back=Array.from({length:n+1},()=>new Uint8Array(m+1));
 for(let i=1;i<=n;i++){score[i][0]=i*GAP;back[i][0]=1;}
 for(let j=1;j<=m;j++){score[0][j]=j*GAP;back[0][j]=2;}
 for(let i=1;i<=n;i++)for(let j=1;j<=m;j++){
  const s=sim(i-1,j-1),diag=score[i-1][j-1]+(s>=SIGNATURE_TOLERANCE.similarityMin?1+s:-2),up=score[i-1][j]+GAP,left=score[i][j-1]+GAP;
  if(diag>=up&&diag>=left){score[i][j]=diag;back[i][j]=0;}else if(up>=left){score[i][j]=up;back[i][j]=1;}else{score[i][j]=left;back[i][j]=2;}
 }
 const pairs=[];let i=n,j=m;
 while(i>0||j>0){
  const step=i>0&&j>0?back[i][j]:i>0?1:2;
  if(step===0){if(sim(i-1,j-1)>=SIGNATURE_TOLERANCE.similarityMin)pairs.push([a[i-1].id,b[j-1].id,sim(i-1,j-1)]);i--;j--;}
  else if(step===1)i--;else j--;
 }
 pairs.reverse();
 return {pairs,sims:new Map(pairs.map(([s,,v])=>[s,v])),map:new Map(pairs.map(([s,r])=>[s,r])),reverse:new Map(pairs.map(([s,r])=>[r,s])),
  mappedShare:Math.min(1,pairs.length/Math.max(1,Math.min(n,m)))};
}
const sign=(value,tol)=>Math.abs(value)<=tol?0:value>0?1:-1;
const SIGN={'-1':'outdent','0':'level','1':'indent'};

// Compare two signatures relationship by relationship. Each mismatch is `decidable`
// (a preset can express the source's relationship) or `ambiguous` (the extraction is
// uncertain: a model must confirm the source). Relationships the house style owns
// (an equals gutter the source lacks, exact spacing) are not mismatches.
// Calibrated against the teacher-corrected rates-v1 (22 October 2026): the teacher fixed column,
// layout, emphasis and a few marker mismatches, and never fixed grouping or an outdent. Those
// carry `advisory:true` (severity ambiguous): they go to the review queue, never to a patch or the model.
// `markerFix` says a marker mismatch can be repaired on this block (worked examples number their steps).
export function compareSignatures(source,render,{confidence=1,alignment=false,markerFix=false}={}){
 // Structure is compared only between lines that meet a rendered line firmly: a wrapped or
 // re-broken line (similarity under .75) says nothing about indent, grouping or markers.
 const firm=id=>(sims?.get(id)??0)>=SIGNATURE_TOLERANCE.firmSimilarity;
 const mismatches=[],add=(type,severity,detail)=>mismatches.push({type,severity,...detail});
 if(source.lines.length===0){
  // A figure-only block has no lines on either side; only the figure can be compared.
  if(render.lines.length===0&&source.figure&&render.figure){
   if(source.figure.side!==render.figure.side&&source.figure.side!=='only'&&render.figure.side!=='only')add('figure','decidable',{detail:`figure is ${source.figure.side} in the source, ${render.figure.side} in the render`,source:source.figure.side,render:render.figure.side});
   return {mismatches,mapped:0,map:new Map(),mappedShare:1};
  }
  add('empty','ambiguous',{detail:'The source region has no text.'});return {mismatches,mapped:0,map:new Map()};
 }
 const {map,reverse,mappedShare,sims}=mapLines(source,render),R=new Map(render.lines.map(l=>[l.id,l])),S=new Map(source.lines.map(l=>[l.id,l]));
 if(confidence<.6)add('region','ambiguous',{detail:'Region confidence '+round(confidence,2)+' is below 0.6.'});
 if(mappedShare<SIGNATURE_TOLERANCE.mappingMin){
  add('mapping','ambiguous',{detail:`Only ${round(mappedShare*100,0)}% of the source lines meet a rendered line.`,source:source.lines.length,render:render.lines.length});
  return {mismatches,mapped:map.size,map,mappedShare};
 }
 // Side-by-side or stacked.
 // A gutter is easier to miss than to invent: a source with fewer lanes than the render, or a figure grid, is advisory.
 const soft=source.lanes<render.lanes||source.figure?.count>=3||render.figure?.count>=3;
 if(source.lanes!==render.lanes)add('layout',soft?'ambiguous':'decidable',{advisory:soft||undefined,detail:`source has ${source.lanes} lane(s), render ${render.lanes}`,source:source.lanes,render:render.lanes});
 // Aligned relation columns: every mapped line of a source column must share a rendered column.
 for(const [ci,column] of source.columns.entries()){
  const rows=column.lineIds.filter(firm).map(id=>R.get(map.get(id))).filter(Boolean);
  const missing=column.lineIds.filter(id=>!map.has(id));
  if(rows.length<2){add('column','ambiguous',{detail:'Source aligns '+column.lineIds.length+' lines at "'+column.relation+'"; fewer than two meet a rendered line.',lineIds:column.lineIds,column:ci});continue;}
  const xs=rows.map(r=>r.geometry.relationX);
  if(xs.some(x=>x==null)||Math.max(...xs)-Math.min(...xs)>SIGNATURE_TOLERANCE.columnMm)add('column','decidable',{detail:'Source aligns "'+column.relation+'" on '+column.lineIds.length+' lines; the render does not.',lineIds:column.lineIds,renderIds:rows.map(r=>r.id),column:ci,missing:missing.length||undefined});
 }
 // Relative indent: the sign of the change between consecutive mapped lines of a lane.
 for(let i=1;i<source.lines.length;i++){
  const a=source.lines[i-1],b=source.lines[i];
  // Lines of working (formulas, scaffolds) are placed by the equals column and the house; only text lines carry indent.
  if(a.lane!==b.lane||!firm(a.id)||!firm(b.id)||a.math||b.math)continue;
  const ra=R.get(map.get(a.id)),rb=R.get(map.get(b.id));
  if(ra.lane!==rb.lane||a.indent==null||b.indent==null||ra.indent==null||rb.indent==null)continue;
  const s=Math.sign(b.indent-a.indent),r=Math.sign(rb.indent-ra.indent);
  if(s!==r)add('indent',s<0?'ambiguous':'decidable',{advisory:s<0||undefined,detail:`source ${SIGN[s]??s} from ${a.id} to ${b.id}; render ${SIGN[r]??r}`,lineIds:[a.id,b.id],renderIds:[ra.id,rb.id],source:s,render:r});
 }
 // Alignment of a line within its lane: centred and right-aligned display lines. The approved
 // structure list does not include it, so it is compared only when asked for (alignment:true).
 // Lines in an aligned column are governed by the column, not by their own alignment.
 const inColumn=new Set(source.columns.flatMap(c=>c.lineIds));
 for(const l of alignment?source.lines:[]){
  if(!map.has(l.id)||inColumn.has(l.id))continue;const r=R.get(map.get(l.id));
  if((l.align==='center'||l.align==='right')&&r.align!==l.align&&source.lines.filter(o=>o.lane===l.lane).length>1)add('align','decidable',{detail:`${l.id} is ${l.align} in the source, ${r.align} in the render`,lineIds:[l.id],renderIds:[r.id],source:l.align,render:r.align});
 }
 // Relative grouping.
 for(const bs of source.boundaries){
  if(!firm(bs.after)||!firm(bs.before))continue;
  const ra=map.get(bs.after),rb=map.get(bs.before),br=render.boundaries.find(x=>x.after===ra&&x.before===rb);
  if(!br)continue;
  if(!bs.reliable||!br.reliable)continue;
  if(bs.split!==br.split)add('groups','ambiguous',{advisory:true,detail:`gap between ${bs.after} and ${bs.before} ${bs.split?'starts a new group in the source':'is within a group in the source'}; the render ${br.split?'splits':'does not split'} it`,lineIds:[bs.after,bs.before],renderIds:[ra,rb],source:bs.split,render:br.split});
 }
 // Markers of numbered and bulleted lists.
 for(const l of source.lines){
  if(!l.marker||!firm(l.id))continue;const r=R.get(map.get(l.id));
  if(!r.marker)add('markers',markerFix?'decidable':'ambiguous',{advisory:markerFix?undefined:true,detail:`${l.id} starts a list item or part in the source`,lineIds:[l.id],renderIds:[r.id]});
 }
 // Arrows: count, endpoints, side, direction and label.
 const used=new Set();
 for(const a of source.arrows){
  const wantFrom=a.from?map.get(a.from):null,wantTo=a.to?map.get(a.to):null;
  const found=render.arrows.findIndex((r,i)=>!used.has(i)&&r.direction===a.direction&&(!wantFrom||!r.from||r.from===wantFrom)&&(!wantTo||!r.to||r.to===wantTo));
  if(found>=0){
   used.add(found);const r=render.arrows[found];
   if(a.label&&r.label&&a.label!==r.label&&!a.label.includes(r.label)&&!r.label.includes(a.label))add('arrows','ambiguous',{detail:`arrow label "${a.label}" in the source, "${r.label}" in the render`,source:a,render:r});
   else if(a.side!==r.side&&a.to&&r.to)add('arrows','decidable',{detail:`arrow is on the ${a.side} in the source, the ${r.side} in the render`,source:a,render:r});
   continue;
  }
  add('arrows',a.from&&a.to?'decidable':'ambiguous',{detail:`source arrow ${a.direction}${a.label?' labelled "'+a.label+'"':''} from ${a.from??'?'} to ${a.to??'?'} has no match in the render`,source:a});
 }
 render.arrows.forEach((r,i)=>{if(!used.has(i))add('arrows','ambiguous',{detail:`render arrow ${r.direction} from ${r.from??'?'} to ${r.to??'?'} has no match in the source`,render:r});});
 if(source.rasterArrows)add('arrows','ambiguous',{detail:'The source figure is a picture; arrows inside it cannot be read from the PDF.'});
 // Figure side.
 if(source.figure&&render.figure&&source.figure.side!==render.figure.side&&source.figure.side!=='inline'&&render.figure.side!=='inline')add('figure','decidable',{detail:`figure is ${source.figure.side} in the source, ${render.figure.side} in the render`,source:source.figure.side,render:render.figure.side});
 else if(source.figure&&!render.figure)add('figure','ambiguous',{detail:'The source has a figure; the render has none in this block.'});
 // Emphasis: bold lines and bold words, and the colour of a line.
 for(const l of source.lines){
  if(!map.has(l.id))continue;const r=R.get(map.get(l.id));
  // A one-letter bold word is a part label, which the render draws as a generated marker.
  const lost=l.boldWords.filter(w=>w.length>1&&!r.boldWords.includes(w));
  if(lost.length)add('emphasis','decidable',{kind:'bold',detail:`${l.id}: bold in the source, not in the render: ${lost.slice(0,4).join(', ')}`,lineIds:[l.id],renderIds:[r.id],words:lost});
  // Only a line printed in one colour on both sides is compared (a numbered step mixes two).
  if(l.hue!==r.hue&&!['ink','mixed'].includes(l.hue)&&!['white','mixed'].includes(r.hue))add('emphasis','decidable',{kind:'colour',detail:`${l.id} is ${l.hue} in the source and ${r.hue} in the render`,lineIds:[l.id],renderIds:[r.id],source:l.hue,render:r.hue});
 }
 return {mismatches,mapped:map.size,map,mappedShare};
}
// Counts by relationship type: {type:{decidable,ambiguous}}.
export function tallyMismatches(mismatches){
 const out={};
 for(const m of mismatches){const row=out[m.type]??={decidable:0,ambiguous:0};row[m.severity]++;}
 return out;
}

// ---- corrections from the model -------------------------------------------------------------------

// The line of a signature whose text best matches `text` (null below the similarity floor).
export function lineByText(signature,text){
 const key=normKey(text);if(!key)return null;
 let best=null,score=0;
 for(const l of signature.lines){const s=keySimilarity(key,l.tokens)+(l.tokens.includes(key)?.5:0);if(s>score){score=s;best=l;}}
 return score>=SIGNATURE_TOLERANCE.similarityMin?best:null;
}
// Apply what a reader of the source crop answered to a source signature. The model returns
// answers to closed questions, never patches or numbers:
//   figure:{decorative:boolean, side?:'left'|'right'|'above'|'below'|'inline'}
//   arrows:[{from,to,direction,side,label}]        (texts at the ends; replaces the arrows)
//   groups:[{after,before,split}]                   (line texts or ids; borderline gaps decided)
//   columns:[{index,aligned}]                       (an alignment column the source does not have)
// Unknown keys are ignored. Returns a new signature.
const SIDES=['left','right','above','below','inline','between'];
const DIRECTIONS=['up','down','left','right','up-left','up-right','down-left','down-right'];
export function applySignatureCorrections(signature,corrections={}){
 const next=structuredClone(signature),applied=[];
 const find=ref=>next.lines.find(l=>l.id===ref)??lineByText(next,ref);
 if(corrections.figure&&typeof corrections.figure==='object'){
  if(corrections.figure.decorative===true){next.figure=null;applied.push('figure');}
  else if(SIDES.includes(corrections.figure.side)){next.figure={...(next.figure??{count:1}),side:corrections.figure.side};applied.push('figure');}
 }
 if(Array.isArray(corrections.arrows)){
  next.arrows=corrections.arrows.filter(a=>a&&DIRECTIONS.includes(a.direction)).map(a=>({from:find(a.from??'')?.id??null,to:find(a.to??'')?.id??null,kind:a.kind==='curved'?'curved':'straight',side:SIDES.includes(a.side)?a.side:'between',direction:a.direction,label:normKey(a.label??''),labelText:String(a.label??'').replace(/\s+/g,' ').trim(),heads:'end',hue:'ink'}));
  next.rasterArrows=false;applied.push('arrows');
 }
 if(Array.isArray(corrections.groups))for(const g of corrections.groups){
  const after=find(g?.after??'')?.id,before=find(g?.before??'')?.id,b=next.boundaries.find(x=>x.after===after&&x.before===before);
  if(!b||typeof g.split!=='boolean')continue;
  b.split=g.split;b.borderline=false;b.reliable=true;
  // Rebuild the groups from the boundaries: a new lane or a split starts a group.
  const groups=[];let current=[],lane=null;
  for(const l of next.lines){
   const bound=next.boundaries.find(x=>x.before===l.id);
   if(current.length&&(l.lane!==lane||bound?.split)){groups.push(current);current=[];}
   current.push(l.id);lane=l.lane;
  }
  if(current.length)groups.push(current);
  next.groups=groups;
  applied.push('groups');
 }
 if(Array.isArray(corrections.columns))for(const c of [...corrections.columns].sort((a,b)=>b.index-a.index))if(c&&c.aligned===false&&next.columns[c.index]){next.columns.splice(c.index,1);next.columnGeometry?.splice(c.index,1);applied.push('columns');}
 return {signature:next,applied};
}
