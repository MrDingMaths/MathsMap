// Geometry used by authoring and acceptance, never a global solid/dashed swap.
export const SOLID_VERSION = 1;
export const SOLID_PREFIX = '% mathsmap-solid ';
const strokeCalibration=String.raw`\special{dvisvgm:raw <metadata data-graph-strokes="1"/>}`;
const EPS = 1e-8;
export const add = (a,b) => a.map((v,i)=>v+b[i]);
export const sub = (a,b) => a.map((v,i)=>v-b[i]);
export const mul = (a,s) => a.map(v=>v*s);
export const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
export const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = a => {const n=Math.hypot(...a);if(n<EPS)throw Error('Degenerate solid direction');return mul(a,1/n);};
export const edgeKey = (a,b) => [a,b].sort().join('|');
export const lerp = (a,b,t) => add(a,mul(sub(b,a),t));
export const number = n => String(+n.toFixed(8));

export function tdplotView(theta=70,phi=110) {
  const t=theta*Math.PI/180,p=phi*Math.PI/180;
  return {right:[Math.cos(p),Math.sin(p),0],up:[-Math.cos(t)*Math.sin(p),Math.cos(t)*Math.cos(p),Math.sin(t)],toward:[Math.sin(t)*Math.sin(p),-Math.sin(t)*Math.cos(p),Math.cos(t)]};
}
// Front cross-section lives in XY, depth Z recedes up/right. Positive depth is AWAY.
export function obliqueView(dx=0.65,dy=0.38) {
  return {right:[1,0,dx],up:[0,1,dy],toward:unit([dx,dy,-1])};
}
export function project(point,view) {return [dot(point,view.right),dot(point,view.up)];}

function normal(points) {
  let n=[0,0,0];for(let i=0;i<points.length;i++)n=add(n,cross(points[i],points[(i+1)%points.length]));
  return unit(n);
}
function inside(p,poly) {
  let yes=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;
  }return yes;
}
function intersection(a,b,c,d) {
  const u=sub(b,a),v=sub(d,c),w=sub(c,a),den=u[0]*v[1]-u[1]*v[0];
  if(Math.abs(den)<EPS)return null;
  const t=(w[0]*v[1]-w[1]*v[0])/den,s=(w[0]*u[1]-w[1]*u[0])/den;
  return t>EPS&&t<1-EPS&&s>=-EPS&&s<=1+EPS?t:null;
}
export function validateSolid(model) {
  if(model.version!==SOLID_VERSION||!model.vertices||!Array.isArray(model.faces)||!model.faces.length)throw Error('Invalid solid model');
  const {right,up,toward}=model.view??{};
  for(const v of [right,up,toward,...Object.values(model.vertices)])if(!Array.isArray(v)||v.length!==3||!v.every(Number.isFinite))throw Error('Solid coordinates and view must be finite 3D vectors');
  if(Math.hypot(...toward)<EPS||Math.abs(dot(right,toward))>EPS||Math.abs(dot(up,toward))>EPS||Math.hypot(...cross(right,up))<EPS)throw Error('Inconsistent solid viewing direction');
  for(const face of model.faces){
    if(face.length<3||new Set(face).size!==face.length||face.some(id=>!model.vertices[id]))throw Error('Invalid solid face');
    const points=face.map(id=>model.vertices[id]),n=normal(points);
    if(points.some(p=>Math.abs(dot(sub(p,points[0]),n))>1e-6))throw Error('Non-planar solid face requires explicit subdivision');
  }
  return model;
}
export function solidEdges(model) {
  validateSolid(model);const edges=new Map();
  for(const [fi,face]of model.faces.entries())for(let i=0;i<face.length;i++){
    const a=face[i],b=face[(i+1)%face.length],key=edgeKey(a,b);
    if(!edges.has(key))edges.set(key,{a,b,faces:[]});edges.get(key).faces.push(fi);
  }return [...edges.values()];
}

// Orient each normal away from the interior centroid. This fast path is only
// valid for closed convex models; recesses and open faces use ray occlusion.
export function convexFaceFacing(model) {
  validateSolid(model);
  const all=Object.values(model.vertices),center=mul(all.reduce(add,[0,0,0]),1/all.length);
  const faces=model.faces.map(ids=>{const points=ids.map(id=>model.vertices[id]);let n=normal(points);if(dot(n,sub(center,points[0]))>0)n=mul(n,-1);return {ids,n,origin:points[0],facing:dot(n,model.view.toward)};});
  if(solidEdges(model).some(e=>e.faces.length!==2)||faces.some(f=>all.some(p=>dot(f.n,sub(p,f.origin))>1e-6)))return null;
  return faces;
}

// Split at projected face boundaries, then cast toward the viewer. This also handles
// concave prism outlines and open containers; no convex-hull guess fills their holes.
export function edgeVisibility(model,a,b) {
  validateSolid(model);
  const va=model.vertices[a],vb=model.vertices[b];if(!va||!vb)throw Error('Unknown edge vertex');
  const convex=convexFaceFacing(model);
  if(convex){const adjacent=convex.filter(f=>f.ids.some((id,i)=>edgeKey(id,f.ids[(i+1)%f.ids.length])===edgeKey(a,b)));if(adjacent.length===2)return [{from:0,to:1,hidden:adjacent.every(f=>f.facing< -EPS)}];}
  const pa=project(va,model.view),pb=project(vb,model.view);
  const faces=model.faces.map(ids=>{const pts=ids.map(id=>model.vertices[id]);return {pts,poly:pts.map(p=>project(p,model.view)),n:normal(pts)};});
  const cuts=[0,1];
  for(const f of faces)for(let i=0;i<f.poly.length;i++){const t=intersection(pa,pb,f.poly[i],f.poly[(i+1)%f.poly.length]);if(t!==null)cuts.push(t);}
  const sorted=[...new Set(cuts.map(t=>+t.toFixed(9)))].sort((a,b)=>a-b),spans=[];
  for(let i=1;i<sorted.length;i++){
    const from=sorted[i-1],to=sorted[i];if(to-from<EPS)continue;
    const p=lerp(va,vb,(from+to)/2),screen=project(p,model.view);
    const hidden=faces.some(f=>{const den=dot(f.n,model.view.toward);if(Math.abs(den)<EPS)return false;const depth=dot(f.n,sub(f.pts[0],p))/den;return depth>1e-7&&inside(screen,f.poly);});
    if(spans.at(-1)?.hidden===hidden)spans.at(-1).to=to;else spans.push({from,to,hidden});
  }return spans;
}

export function prismModel(front,offset=[0,0,2],view=obliqueView()) {
  const vertices={},a=[],b=[];
  front.forEach((p,i)=>{a.push('A'+i);b.push('B'+i);vertices[a[i]]=p.length===2?[...p,0]:p;vertices[b[i]]=add(vertices[a[i]],offset);});
  return validateSolid({version:1,kind:'polyhedron',vertices,view,faces:[a,[...b].reverse(),...a.map((id,i)=>[id,a[(i+1)%a.length],b[(i+1)%a.length],b[i]])]});
}
export function pyramidModel(base,apex,view=tdplotView()) {
  const vertices={P:apex},ids=base.map((p,i)=>(vertices['B'+i]=p,'B'+i));
  return validateSolid({version:1,kind:'polyhedron',vertices,view,faces:[ids,...ids.map((id,i)=>[id,ids[(i+1)%ids.length],'P'])]});
}
export function solidMetadata(code) {
  const line=String(code).split('\n').find(l=>l.startsWith(SOLID_PREFIX));
  if(!line)return null;const value=JSON.parse(line.slice(SOLID_PREFIX.length));
  if(value.version!==SOLID_VERSION)throw Error('Unsupported solid metadata version');return value;
}
export function withSolidMetadata(code,metadata) {
  return SOLID_PREFIX+JSON.stringify({version:SOLID_VERSION,...metadata})+'\n'+code.split('\n').filter(l=>!l.startsWith(SOLID_PREFIX)).join('\n');
}

export function solidTikz(model,{labels=[],annotations=[],scale=1}={}) {
  validateSolid(model);
  const lines=['\\begin{tikzpicture}[line width=0.8pt,every node/.style={font=\\large},scale='+number(scale)+']'];
  lines.push(strokeCalibration);
  for(const[id,p]of Object.entries(model.vertices))lines.push(`\\coordinate (${id}) at (${project(p,model.view).map(number).join(',')});`);
  for(const {a,b}of solidEdges(model))for(const s of edgeVisibility(model,a,b)){
    const p=t=>t===0?`(${a})`:t===1?`(${b})`:`(${project(lerp(model.vertices[a],model.vertices[b],t),model.view).map(number).join(',')})`;
    lines.push(`\\draw${s.hidden?'[dashed]':''} ${p(s.from)}--${p(s.to)};`);
  }
  for(const {a,b,text,anchor='below',pos=0.5}of labels){
    if(!model.vertices[a]||!model.vertices[b])throw Error('Label refers to an unknown edge');
    lines.push(`\\path (${a})--(${b}) node[pos=${number(pos)},${anchor},fill=white,inner sep=1pt] {${text}};`);
  }
  for(const ann of annotations){
    if(ann.kind==='right-angle'){
      const [a,v,b]=ann.vertices.map(id=>project(model.vertices[id],model.view)),r=ann.size??0.18;
      const u=mul(unit2(sub(a,v)),r),w=mul(unit2(sub(b,v)),r);
      lines.push('\\draw '+[add(v,u),add(add(v,u),w),add(v,w)].map(p=>'('+p.map(number).join(',')+')').join('--')+';');
    }else if(ann.kind==='guide')lines.push(`\\draw[dashed,line width=0.4pt] (${ann.a})--(${ann.b});`);
    else throw Error('Unsupported solid annotation');
  }
  lines.push('\\end{tikzpicture}');return withSolidMetadata(lines.join('\n'),{kind:'polyhedron',model});
}
const unit2=a=>{const n=Math.hypot(...a);if(n<EPS)throw Error('Collapsed projected angle');return mul(a,1/n);};

// Analytic classroom templates. These are deliberately bounded, not arbitrary
// curved-surface occlusion guesses. Labels are paths and cannot repaint rims.
export function curvedSolidTikz(kind,{radius=1,height=3,flatten=0.3,depth=2,angle=30}={}) {
  if(!['cylinder','cone','sphere','semicylinder'].includes(kind)||radius<=0||height<=0||flatten<=0||flatten>=1||depth<=0||angle<=0||angle>=90)throw Error('Unsupported curved solid parameters');
  const r=radius,b=r*flatten,n=number;
  const lines=['\\begin{tikzpicture}[line width=0.8pt,every node/.style={font=\\large}]'];
  lines.push(strokeCalibration);
  if(kind==='cylinder')lines.push(`\\draw (0,${n(height)}) ellipse (${n(r)} and ${n(b)});`,`\\draw (${n(-r)},0)--(${n(-r)},${n(height)});`,`\\draw (${n(r)},0)--(${n(r)},${n(height)});`,`\\draw (${n(-r)},0) arc (180:360:${n(r)} and ${n(b)});`,`\\draw[dashed] (${n(r)},0) arc (0:180:${n(r)} and ${n(b)});`);
  if(kind==='sphere')lines.push(`\\draw (0,0) circle (${n(r)});`,`\\draw (${n(-r)},0) arc (180:360:${n(r)} and ${n(b)});`,`\\draw[dashed] (${n(r)},0) arc (0:180:${n(r)} and ${n(b)});`);
  if(kind==='cone'){
    if(height<=b)throw Error('Cone apex must be above projected rim');
    const t=Math.asin(b/height)*180/Math.PI,x=r*Math.sqrt(1-b*b/(height*height)),y=b*b/height;
    lines.push(`\\draw (${n(-x)},${n(y)})--(0,${n(height)})--(${n(x)},${n(y)});`,`\\draw (${n(-x)},${n(y)}) arc (${n(180-t)}:${n(360+t)}:${n(r)} and ${n(b)});`,`\\draw[dashed] (${n(x)},${n(y)}) arc (${n(t)}:${n(180-t)}:${n(r)} and ${n(b)});`);
  }
  if(kind==='semicylinder'){
    const dx=depth*Math.cos(angle*Math.PI/180),dy=depth*Math.sin(angle*Math.PI/180),t=angle+90,sx=r*Math.cos(t*Math.PI/180),sy=r*Math.sin(t*Math.PI/180);
    lines.push(`\\draw (${n(-r)},0)--(${n(r)},0);`,`\\draw (${n(-r)},0) arc (180:0:${n(r)});`,`\\draw[dashed] (${n(dx-r)},${n(dy)})--(${n(dx+r)},${n(dy)});`,`\\draw[dashed] (${n(dx-r)},${n(dy)}) arc (180:${n(t)}:${n(r)});`,`\\draw (${n(dx+r)},${n(dy)}) arc (0:${n(t)}:${n(r)});`,`\\draw[dashed] (${n(-r)},0)--(${n(dx-r)},${n(dy)});`,`\\draw (${n(r)},0)--(${n(dx+r)},${n(dy)});`,`\\draw (${n(sx)},${n(sy)})--(${n(sx+dx)},${n(sy+dy)});`);
  }
  lines.push('\\end{tikzpicture}');return withSolidMetadata(lines.join('\n'),{kind:'curved-template',template:kind,parameters:{radius,height,flatten,depth,angle}});
}
