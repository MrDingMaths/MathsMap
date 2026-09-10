// Opposite-side convention: a=BC, b=CA, c=AB; angles A/B/C in degrees.
// Quantum is the stated rounding increment, not an arbitrary error allowance.
const radians=d=>d*Math.PI/180;
const degrees=r=>r*180/Math.PI;
const names=['A','B','C'],sides=['a','b','c'];
const value=m=>typeof m==='number'?m:m?.value;
const interval=m=>{const v=value(m),q=m?.exact===true?0:m?.quantum;return Number.isFinite(v)&&Number.isFinite(q)&&q>=0?[v-q/2,v+q/2]:null;};
const overlaps=(a,b)=>a[0]<=b[1]+1e-8&&b[0]<=a[1]+1e-8;

export function inspectTriangle(model){
 const issues=[],given={...model.sides,...model.angles},ranges={};
 for(const [key,m]of Object.entries(given)){
  if(![...names,...sides].includes(key)){issues.push({kind:'unsupported-measurement',measurement:key});continue;}
  const v=value(m),range=interval(m);
  if(!Number.isFinite(v)||v<=0||names.includes(key)&&v>=180)issues.push({kind:'invalid-measurement',measurement:key});
  else if(!range)issues.push({kind:'unknown-precision',measurement:key,message:'Record exact:true or the stated rounding quantum before proposing a correction.'});
  else ranges[key]=[Math.max(0,range[0]),names.includes(key)?Math.min(180,range[1]):range[1]];
 }
 const units=new Set(Object.values(model.sides??{}).map(m=>m?.unit).filter(Boolean));
 if(units.size>1)issues.push({kind:'mixed-units',message:'Convert sides to one unit in the model; preserve the printed givens.'});
 if(sides.every(s=>ranges[s]))for(let i=0;i<3;i++){
  const [a,b,c]=[sides[i],sides[(i+1)%3],sides[(i+2)%3]].map(k=>ranges[k]);
  if(a[0]>=b[1]+c[1])issues.push({kind:'triangle-inequality',measurement:sides[i]});
 }
 if(names.every(a=>ranges[a])){
  const total=[0,1].map(i=>names.reduce((n,k)=>n+ranges[k][i],0));
  if(!overlaps(total,[180,180]))issues.push({kind:'angle-sum',range:total,expected:180});
 }
 // Conservative interval cosine law: flag only disjoint feasible ranges.
 for(let i=0;i<3;i++){
  const opposite=ranges[sides[i]],left=ranges[sides[(i+1)%3]],right=ranges[sides[(i+2)%3]],angle=ranges[names[i]];
  if(!opposite||!left||!right||!angle)continue;
  const products=[left[0]*right[0],left[1]*right[1]].flatMap(p=>[Math.cos(radians(angle[0])),Math.cos(radians(angle[1]))].map(c=>2*p*c));
  const predicted=[left[0]**2+right[0]**2-Math.max(...products),left[1]**2+right[1]**2-Math.min(...products)];
  if(!overlaps(opposite.map(x=>x*x),predicted))issues.push({kind:'cosine-law',measurement:names[i],oppositeSquared:opposite.map(x=>x*x),expectedRange:predicted});
 }
 return {consistent:issues.length===0,issues};
}

function constructBasis(model){
 const s=Object.fromEntries(Object.entries(model.sides??{}).map(([k,m])=>[k,value(m)]));
 const a=Object.fromEntries(Object.entries(model.angles??{}).map(([k,m])=>[k,value(m)]));
 let b=s.b,c=s.c,A=a.A;
 if(sides.every(k=>s[k]>0)){
  const cosine=(b*b+c*c-s.a*s.a)/(2*b*c);
  if(cosine<=-1||cosine>=1)throw Error('Degenerate or impossible SSS triangle');
  A=degrees(Math.acos(cosine));
 }else{
  // Rotate any SAS input to solve its opposite side, then use SSS.
  for(let i=0;i<3;i++){
   const [op,left,right]=[sides[i],sides[(i+1)%3],sides[(i+2)%3]];
   if(a[names[i]]>0&&a[names[i]]<180&&s[left]>0&&s[right]>0){
    s[op]=Math.sqrt(s[left]**2+s[right]**2-2*s[left]*s[right]*Math.cos(radians(a[names[i]])));
    return constructBasis({...model,sides:s});
   }
  }
  if(Object.keys(a).length>=2){
   for(const k of names)if(a[k]===undefined)a[k]=180-names.filter(n=>n!==k).reduce((n,key)=>n+a[key],0);
   if(names.some(k=>!(a[k]>0&&a[k]<180)))throw Error('Impossible triangle angles');
   const known=sides.find(k=>s[k]>0);if(!known)throw Error('Triangle needs one explicit side to establish scale');
   const ratio=s[known]/Math.sin(radians(a[known.toUpperCase()]));
   b=ratio*Math.sin(radians(a.B));c=ratio*Math.sin(radians(a.C));A=a.A;
  }else throw Error('Triangle is underdetermined or SSA-ambiguous; require explicit construction relationships');
 }
 if(!(b>0&&c>0&&A>0&&A<180))throw Error('Invalid triangle construction');
 return {A:[0,0],B:[c,0],C:[b*Math.cos(radians(A)),b*Math.sin(radians(A))]};
}

export function constructTriangle(model){
 const candidates=[];
 // Try SAS before SSS so a redundant rounded side does not distort an explicit
 // included angle. Test every redundant given against its own precision interval.
 for(let i=0;i<3;i++){
  const left=sides[(i+1)%3],right=sides[(i+2)%3],angle=names[i];
  if(model.sides?.[left]&&model.sides?.[right]&&model.angles?.[angle])candidates.push({sides:{[left]:model.sides[left],[right]:model.sides[right]},angles:{[angle]:model.angles[angle]}});
 }
 candidates.push(model);
 if(Object.keys(model.angles??{}).length>=2)for(const side of sides)if(model.sides?.[side])candidates.push({sides:{[side]:model.sides[side]},angles:model.angles});
 let lastError;
 for(const candidate of candidates){
  try{
   const vertices=constructBasis(candidate),actual=measuredTriangle(vertices);
   const valid=['sides','angles'].every(group=>Object.entries(model[group]??{}).every(([key,m])=>{const range=interval(m);return !range||actual[group][key]>=range[0]-1e-8&&actual[group][key]<=range[1]+1e-8;}));
   if(valid)return vertices;
   lastError=Error('No centre-value construction satisfies all givens at their stated precision; review relationships before authoring');
  }catch(error){lastError=error;}
 }
 throw lastError??Error('No explicit triangle construction');
}

export function measuredTriangle(vertices){
 const length=(u,v)=>Math.hypot(u[0]-v[0],u[1]-v[1]);
 if(names.some(n=>!Array.isArray(vertices[n])||vertices[n].length!==2||vertices[n].some(v=>!Number.isFinite(v))))throw Error('Triangle needs finite A/B/C coordinates');
 const result={sides:{},angles:{}};
 for(let i=0;i<3;i++){
  const [v,l,r]=[vertices[names[i]],vertices[names[(i+1)%3]],vertices[names[(i+2)%3]]];
  const u=[l[0]-v[0],l[1]-v[1]],w=[r[0]-v[0],r[1]-v[1]];
  if(!Math.hypot(...u)||!Math.hypot(...w))throw Error('Degenerate triangle');
  result.sides[sides[i]]=length(l,r);
  result.angles[names[i]]=degrees(Math.atan2(Math.abs(u[0]*w[1]-u[1]*w[0]),u[0]*w[0]+u[1]*w[1]));
 }
 return result;
}

// The author must reuse these named coordinates. Appearance/labels are reviewed
// separately; arbitrary TeX is never treated as numerically verified geometry.
export function triangleConstruction(model){
 const vertices=constructTriangle(model);
 return {vertices,coordinates:names.map(n=>`\\coordinate (${n}) at (${vertices[n].map(v=>Number(v.toFixed(10))).join(',')});`).join('\n')};
}
export function verifyTriangleCode(model,code){
 if(/\b(?:xscale|yscale|xslant|yslant|cm)\s*=/.test(code))throw Error('Non-uniform triangle transforms require separate numerical validation');
 const vertices={};
 for(const n of names){
  const matches=[...code.matchAll(new RegExp('\\\\coordinate\\s*\\('+n+'\\)\\s*at\\s*\\(\\s*([-+0-9.eE]+)\\s*,\\s*([-+0-9.eE]+)\\s*\\)','g'))];
  if(matches.length!==1)throw Error('Triangle code must declare exactly one numeric coordinate '+n);
  vertices[n]=[Number(matches[0][1]),Number(matches[0][2])];
 }
 const expected=measuredTriangle(constructTriangle(model)),actual=measuredTriangle(vertices);
 for(const n of names)if(Math.abs(actual.angles[n]-expected.angles[n])>1e-5)throw Error(`Triangle angle ${n}: authored ${actual.angles[n]}°, required ${expected.angles[n]}°`);
 const scale=actual.sides.a/expected.sides.a;
 for(const s of sides)if(Math.abs(actual.sides[s]/expected.sides[s]-scale)>1e-6*Math.max(1,scale))throw Error('Triangle side ratios disagree with constraints');
 return {checked:true,angles:actual.angles,sideRatios:true};
}
