import {parseNamedCoords} from './tikz-blocks.mjs';
import {coneConstruction,repairCone,sweptArcConstruction,repairSweptArc} from './curved-solid-audit.mjs';
import {tdplotView,obliqueView,sub,add,mul,cross,dot,project,lerp,edgeKey,solidEdges,edgeVisibility,validateSolid,solidMetadata,withSolidMetadata,number,curvedSolidTikz} from '../../src/lib/solid-geometry.js';

const near=(a,b)=>a.length===b.length&&Math.hypot(...sub(a,b))<1e-5;
const tuple=s=>{const p=s.split(',').map(Number);return p.length>=2&&p.length<=3&&p.every(Number.isFinite)?p:null;};
export function coordinates(code) {
  const named=parseNamedCoords(code);
  // The common translation-only calc spelling, deliberately not arbitrary TeX.
  for(let repeat=0;repeat<3;repeat++)for(const m of code.matchAll(/\\coordinate\s*\(([^)]+)\)\s*at\s*\(\$\s*\(([^)]+)\)\s*([+-])\s*\(([^)]+)\)\s*\$\)\s*;/g)){
    const a=named.get(m[2]),b=tuple(m[4])??(()=>{const p=m[4].match(/^(-?[\d.]+):([\d.]+)$/);return p?[Math.cos(+p[1]*Math.PI/180)*+p[2],Math.sin(+p[1]*Math.PI/180)*+p[2]]:null;})();
    if(a&&b&&a.length===b.length)named.set(m[1],add(a,mul(b,m[3]==='-'?-1:1)));
  }
  return named;
}
function groupFaces(vertices,a,b) {
  if(a.length<3||a.length!==b.length)return null;
  const offset=sub(vertices[b[0]],vertices[a[0]]);
  if(!a.every((id,i)=>near(sub(vertices[b[i]],vertices[id]),offset)))return null;
  return [a,[...b].reverse(),...a.map((id,i)=>[id,a[(i+1)%a.length],b[(i+1)%a.length],b[i]])];
}
function convexFaces(vertices) {
  const ids=Object.keys(vertices),out=new Map();
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++)for(let k=j+1;k<ids.length;k++){
    const p=vertices[ids[i]],n=cross(sub(vertices[ids[j]],p),sub(vertices[ids[k]],p)),len=Math.hypot(...n);if(len<1e-6)continue;
    const ds=ids.map(id=>dot(sub(vertices[id],p),n)/len);if(ds.some(d=>d>1e-5)&&ds.some(d=>d< -1e-5))continue;
    const face=ids.filter((_,i)=>Math.abs(ds[i])<1e-5);if(face.length===ids.length)continue;
    const c=mul(face.reduce((s,id)=>add(s,vertices[id]),[0,0,0]),1/face.length),u=sub(vertices[face[0]],c),v=cross(n,u);
    face.sort((a,b)=>Math.atan2(dot(sub(vertices[a],c),v)/Math.hypot(...v),dot(sub(vertices[a],c),u)/Math.hypot(...u))-Math.atan2(dot(sub(vertices[b],c),v)/Math.hypot(...v),dot(sub(vertices[b],c),u)/Math.hypot(...u)));
    out.set([...face].sort().join('|'),face);
  }return [...out.values()];
}

export function inferSolid(code) {
  const meta=solidMetadata(code);if(meta?.model){
    const model=validateSolid(meta.model),named=coordinates(code),td=/tdplot_main_coords/.test(code);
    for(const[id,p]of Object.entries(model.vertices)){
      const current=named.get(id)??tuple(id),expected=td?p:project(p,model.view);
      if(!current||!near(current,expected))return {reason:'Solid metadata is stale: vertex '+id+' changed'};
    }
    const view=code.match(/\\tdplotsetmaincoords\{([\d.-]+)\}\{([\d.-]+)\}/);
    if(td&&(!view||!near(tdplotView(+view[1],+view[2]).toward,model.view.toward)))return {reason:'Solid metadata is stale: viewing direction changed'};
    return {model,method:'recorded-model'};
  }
  const named=coordinates(code),viewMatch=code.match(/\\tdplotsetmaincoords\{([\d.-]+)\}\{([\d.-]+)\}/);
  if(viewMatch&&/tdplot_main_coords/.test(code)){
    let vertices=Object.fromEntries([...named].filter(([,p])=>p.length===3)),faces;
    for(const [pa,pb]of [['b','f'],['B','F'],['b','t'],['B','T']]){
      const a=Object.keys(vertices).filter(id=>new RegExp('^'+pa+'\\d+$').test(id)&&vertices[pb+id.slice(1)]).sort((a,b)=>+a.slice(1)-+b.slice(1));
      const b=a.map(id=>pb+id.slice(1));if(!b.every(id=>vertices[id]))continue;
      faces=groupFaces(vertices,a,b);
      // A homothetic pair of parallel quadrilateral caps is a frustum, not a
      // prism. Explicit numbered correspondences retain that topology.
      if(!faces&&a.length===4){const ca=mul(a.reduce((s,id)=>add(s,vertices[id]),[0,0,0]),0.25),cb=mul(b.reduce((s,id)=>add(s,vertices[id]),[0,0,0]),0.25),u=sub(vertices[a[0]],ca),v=sub(vertices[b[0]],cb),ratio=dot(u,v)/dot(u,u);if(ratio>0&&a.every((id,i)=>near(mul(sub(vertices[id],ca),ratio),sub(vertices[b[i]],cb))))faces=[a,[...b].reverse(),...a.map((id,i)=>[id,a[(i+1)%a.length],b[(i+1)%a.length],b[i]])];}
      if(faces){vertices=Object.fromEntries([...a,...b].map(id=>[id,vertices[id]]));break;}
    }
    // Only recognised classroom convex families may use their convex hull.
    if(!faces){
      const keys=Object.keys(vertices),family=['A0','B0','C0','D0','A1','B1','C1','D1','T'].every(k=>keys.includes(k))?['A0','B0','C0','D0','A1','B1','C1','D1','T']:
        keys.includes('P')&&['O','X','Y','Z','XY','XZ','YZ'].every(k=>keys.includes(k))?['O','X','Y','Z','XY','XZ','YZ','P']:
        keys.includes('T')&&['A','B','C','D'].every(k=>keys.includes(k))?['A','B','C','D','T']:
        ['A','B','C','D','E','F','G','H'].every(k=>keys.includes(k))?['A','B','C','D','E','F','G','H']:
        ['A','B','C','D','A2','B2','C2','D2'].every(k=>keys.includes(k))?['A','B','C','D','A2','B2','C2','D2']:
        ['A','B','C','A2','B2','C2'].every(k=>keys.includes(k))?['A','B','C','A2','B2','C2']:
        ['A','B','C','D','E','F'].every(k=>keys.includes(k))?['A','B','C','D','E','F']:
        keys.includes('P')&&['B0','B1','B2','B3'].every(k=>keys.includes(k))?['B0','B1','B2','B3','P']:null;
      if(family){vertices=Object.fromEntries(family.map(id=>[id,vertices[id]]));faces=convexFaces(vertices);}
    }
    if(faces?.length){try{return {model:validateSolid({version:1,kind:'polyhedron',vertices,faces,view:tdplotView(+viewMatch[1],+viewMatch[2])}),method:'explicit-3d'};}catch(e){return {reason:e.message};}}
    return {reason:'Unresolved 3D topology or coordinates'};
  }
  // Known corresponding polygons in plain oblique drawings, with the camera
  // convention front XY / receding Z. Names identify topology only, not visibility.
  for(const [a,b]of [
    [['A','B','C'],['D','E','F']],
    [['A','B','C','D','E'],['F','G','H','I','J']],
    [['P1','P2','P3','P4','P5'],['Q1','Q2','Q3','Q4','Q5']],
  ]){
    if(![...a,...b].every(id=>named.get(id)?.length===2))continue;
    const offset=sub(named.get(b[0]),named.get(a[0]));if(Math.abs(offset[0])<1e-5||Math.abs(offset[1])<1e-5||!a.every((id,i)=>near(sub(named.get(b[i]),named.get(id)),offset)))continue;
    const vertices={};a.forEach(id=>vertices[id]=[...named.get(id),0]);b.forEach(id=>vertices[id]=[...sub(named.get(id),offset),1]);
    const model=validateSolid({version:1,vertices,faces:groupFaces(vertices,a,b),view:obliqueView(...offset)});
    const drawn=new Set(parseDraws(code,model,named).filter(s=>s.kind!=='path').flatMap(s=>s.edges.filter(e=>e.solidEdge).map(e=>edgeKey(e.a,e.b))));
    // Two translated triangles can be a congruence question. A prism needs
    // its connecting edges as well as two polygon outlines.
    if(drawn.size<3*a.length-1)continue;
    return {model,method:'corresponding-oblique-polygons'};
  }
  // Square/rectangular-base pyramids. Lift the base to XZ and the apex
  // vertically above its source-supported foot; base points remain unchanged.
  for(const [base,apex]of [[['FL','FR','BR','BL'],'Ap'],[['A','B','C','D'],'P'],[['A','B','C','D'],'T']]){
    if(![...base,apex].every(id=>named.get(id)?.length===2))continue;
    const [a,b,c,d]=base.map(id=>named.get(id)),tip=named.get(apex),offset=sub(d,a);
    if(Math.abs(a[1]-b[1])>1e-5||Math.abs(offset[1])<1e-5||!near(sub(c,b),offset))continue;
    const center=mul(add(a,c),0.5),vertices={};vertices[base[0]]=[a[0],0,0];vertices[base[1]]=[b[0],0,0];vertices[base[2]]=[b[0],0,1];vertices[base[3]]=[a[0],0,1];vertices[apex]=[tip[0]-offset[0]/2,tip[1]-center[1],0.5];
    // Translation of the screen origin is encoded into all vertex Y values.
    for(const p of Object.values(vertices))p[1]+=a[1];
    const faces=[base,...base.map((id,i)=>[id,base[(i+1)%4],apex])];
    return {model:validateSolid({version:1,vertices,faces,view:obliqueView(...offset)}),method:'oblique-base-pyramid'};
  }
  // Recognise a complete rectangular front face and translated rear face in
  // actual geometry, including unnamed numeric-coordinate legacy drawings.
  const points=new Map([...named].filter(([,p])=>p.length===2));
  for(const m of code.matchAll(/\(([-+\d.]+\s*,\s*[-+\d.]+)\)/g)){const p=tuple(m[1]);if(p&&![...points.values()].some(q=>near(p,q)))points.set(m[1],p);}
  const entries=[...points],find=p=>entries.find(([,q])=>near(p,q));
  const candidates=[];
  for(const [a,p]of entries)for(const [b,q]of entries){
    if(q[0]<=p[0]+1e-5||Math.abs(q[1]-p[1])>1e-5)continue;
    for(const [d,r]of entries){if(Math.abs(r[0]-p[0])>1e-5||r[1]<=p[1]+1e-5)continue;
      const c=find([q[0],r[1]]);if(!c)continue;const front=[a,b,c[0],d];
      for(const [e,s]of entries){const offset=sub(s,p);if(Math.abs(offset[0])<1e-5||offset[1]<=1e-5)continue;
        const rear=front.map(id=>find(add(points.get(id),offset)));if(rear.some(x=>!x)||new Set([...front,...rear.map(x=>x[0])]).size!==8)continue;
        const vertices={};front.forEach(id=>vertices[id]=[...points.get(id),0]);rear.forEach(([id,pt])=>vertices[id]=[...sub(pt,offset),1]);
        const faces=groupFaces(vertices,front,rear.map(x=>x[0]));
        const model={version:1,kind:'polyhedron',vertices,faces,view:obliqueView(...offset)};
        const drawn=parseDraws(code,model,named),keys=new Set(drawn.flatMap(s=>s.edges.filter(e=>e.solidEdge).map(e=>edgeKey(e.a,e.b))));
        if(keys.size>=11)candidates.push({model,area:(q[0]-p[0])*(r[1]-p[1]),method:'verified-oblique-box'});
      }
    }
  }
  if(candidates.length){candidates.sort((a,b)=>b.area-a.area);return candidates[0];}
  return {reason:'No supported solid topology'};
}

function balancedEnd(s,start,open,close) {let depth=0;for(let i=start;i<s.length;i++){if(s[i]===open)depth++;if(s[i]===close&&!--depth&&s[i]===close)return i+1;}return s.length;}
// Balanced node payloads are removed before reading coordinates (math labels can
// contain parentheses). Unknown path syntax is deliberately not rewritten.
export function parseDraws(code,model,named=coordinates(code)) {
  const boundary=solidEdges(model),keys=new Set(boundary.map(e=>edgeKey(e.a,e.b))),result=[];
  const resolve=token=>{
    if(model.vertices[token])return token;
    const p=named.get(token)??tuple(token);if(!p)return null;
    return Object.keys(model.vertices).find(id=>near(p,p.length===3?model.vertices[id]:project(model.vertices[id],model.view)))??null;
  };
  for(const match of code.matchAll(/\\(draw|path|filldraw)\b([^;]*);/g)){
    const raw=match[0],kind=match[1];let i=1+kind.length,options='';
    if(raw[i]==='['){const end=balancedEnd(raw,i,'[',']');options=raw.slice(i+1,end-1);i=end;}
    let first=null,previous=null,link=false,edges=[],unknown=false;
    while(i<raw.length){
      if(/^\s/.test(raw[i])){i++;continue;}
      if(raw.startsWith('node',i)){
        const start=i;i+=4;while(/\s/.test(raw[i]??''))i++;
        if(raw[i]==='[')i=balancedEnd(raw,i,'[',']');while(/\s/.test(raw[i]??''))i++;
        if(raw[i]!=='{'){unknown=true;break;}i=balancedEnd(raw,i,'{','}');
        if(edges.length)edges.at(-1).labels.push(raw.slice(start,i));else unknown=true;continue;
      }
      if(raw.startsWith('--',i)){link=true;i+=2;continue;}
      if(raw.startsWith('cycle',i)){if(previous&&first&&link)edges.push({a:resolve(previous),b:resolve(first),from:previous,to:first,labels:[]});previous=first;link=false;i+=5;continue;}
      if(raw[i]==='('){const end=balancedEnd(raw,i,'(',')'),token=raw.slice(i+1,end-1);if(previous&&link)edges.push({a:resolve(previous),b:resolve(token),from:previous,to:token,labels:[]});previous=token;first??=token;link=false;i=end;continue;}
      if(raw[i]===';')break;
      unknown=true;break;
    }
    for(const e of edges){
      e.solidEdge=!!(e.a&&e.b&&keys.has(edgeKey(e.a,e.b)));e.interval=[0,1];
      if(!e.solidEdge){
        const p=named.get(e.from)??tuple(e.from),q=named.get(e.to)??tuple(e.to);if(!p||!q||p.length!==q.length)continue;
        for(const edge of boundary){
          const a=p.length===3?model.vertices[edge.a]:project(model.vertices[edge.a],model.view),b=p.length===3?model.vertices[edge.b]:project(model.vertices[edge.b],model.view),delta=sub(b,a),length=dot(delta,delta);if(length<1e-10)continue;
          const t=dot(sub(p,a),delta)/length,u=dot(sub(q,a),delta)/length;
          if(Math.min(t,u)< -1e-6||Math.max(t,u)>1+1e-6||!near(lerp(a,b,t),p)||!near(lerp(a,b,u),q))continue;
          e.a=edge.a;e.b=edge.b;e.interval=[Math.min(t,u),Math.max(t,u)];e.solidEdge=true;e.partial=true;break;
        }
      }
    }
    result.push({raw,index:match.index,kind,options,edges,unknown,semantic:/\b(?:red|blue|green|orange|purple|cyan)\b|->|<-|Stealth|fill\s*=/.test(options)});
  }return result;
}

export function inspectSolid(code,{context=''}={}) {
  let metadata;try{metadata=solidMetadata(code);}catch(e){return {status:'review',reason:e.message};}
  if(metadata?.kind==='curved-template'){
    try{const expected=curvedSolidTikz(metadata.template,metadata.parameters),body=s=>s.split('\n').filter(l=>!l.startsWith('% mathsmap-solid ')).join('\n').trim();return body(expected)===body(code)?{status:'pass',method:'checked-curved-template',issues:[]}:{status:'review',reason:'Curved template changed: regenerate or record geometric review'};}catch(e){return {status:'review',reason:e.message};}
  }
  const cone=coneConstruction(code);if(cone)return {status:cone.correct?'pass':'defect',method:'analytic-cone',issues:cone.correct?[]:[{type:'cone-silhouette',reason:'Rim visibility must split at actual tangent endpoints'}]};
  const swept=sweptArcConstruction(code,coordinates(code));if(swept)return {status:swept.correct?'pass':'defect',method:'analytic-swept-arc',issues:swept.correct?[]:[{type:'swept-arc-visibility',reason:'Rear arc visibility and silhouette must follow the depth offset'}]};
  let inferred;try{inferred=inferSolid(code);}catch(e){return {status:'review',reason:e.message};}
  if(!inferred.model)return {status:'review',reason:inferred.reason};
  const model=structuredClone(inferred.model);
  if(/open[- ]topp?ed|open[- ]top\b|without (?:a )?lid|\btrough\b/i.test(context)&&/tdplot_main_coords/.test(code)){
    const top=Math.max(...Object.values(model.vertices).map(p=>p[2]));model.faces=model.faces.filter(f=>!f.every(id=>Math.abs(model.vertices[id][2]-top)<1e-6));model.openTop=true;
  }
  const draws=parseDraws(code,model),issues=[],seen=new Map();
  for(const s of draws){
    if((s.kind==='path'&&!/\bdraw\b/.test(s.options))||s.semantic)continue;
    if(s.unknown){if(s.edges.some(e=>e.solidEdge))issues.push({type:'unsupported-path',source:s.raw});continue;}
    for(const e of s.edges.filter(e=>e.solidEdge)){
      const expected=edgeVisibility(model,e.a,e.b).filter(span=>span.to>e.interval[0]+1e-7&&span.from<e.interval[1]-1e-7),hidden=/\b(?:dashed|dotted|dash pattern)\b/.test(s.options),key=edgeKey(e.a,e.b);
      if(expected.some(span=>span.hidden!==hidden))issues.push({type:'visibility',edge:key,actual:hidden?'hidden':'visible',expected});
      const spans=seen.get(key)??[];if(spans.some(([a,b])=>Math.min(b,e.interval[1])-Math.max(a,e.interval[0])>1e-6))issues.push({type:'duplicate-edge',edge:key});spans.push(e.interval);seen.set(key,spans);
    }
  }
  const coverage=new Map();
  for(const s of draws.filter(s=>s.kind!=='path'||/\bdraw\b/.test(s.options)))for(const e of s.edges.filter(e=>e.solidEdge)){const key=edgeKey(e.a,e.b);if(!coverage.has(key))coverage.set(key,[]);coverage.get(key).push(e.interval);}
  const missing=solidEdges(model).filter(e=>{let end=0;for(const [from,to]of (coverage.get(edgeKey(e.a,e.b))??[]).sort((a,b)=>a[0]-b[0])){if(from>end+1e-6)return true;end=Math.max(end,to);}return end<1-1e-6;}).map(e=>edgeKey(e.a,e.b));
  const defect=issues.some(i=>i.type!=='duplicate-edge');
  if(missing.length)issues.push({type:'incomplete-boundary',edges:missing});
  const additional=draws.filter(s=>s.kind!=='path'&&!s.semantic).reduce((n,s)=>n+s.edges.filter(e=>!e.a&&!e.b).length,0)>=3||draws.some(s=>s.kind!=='path'&&!s.semantic&&/\bellipse\b|\barc\b/.test(s.raw));
  if(additional)issues.push({type:'additional-geometry',reason:'The inferred model does not cover every construction in this drawing'});
  const reason=missing.length?'Model boundary is incomplete; record intentional omissions or repair missing edges':additional?'Additional geometry requires recorded geometric and visual review':null;
  return {status:defect?'defect':reason?'review':'pass',...(reason?{reason}:{}),model,method:inferred.method,issues};
}

export function repairSolid(code,{moveLabels=false,context=''}={}) {
  const audit=inspectSolid(code,{context});if(audit.status!=='defect'||audit.issues.some(i=>i.type==='unsupported-path'))return {code,audit};
  if(audit.method==='analytic-cone')return {...repairCone(code),audit};
  if(audit.method==='analytic-swept-arc')return {...repairSweptArc(code,coordinates(code)),audit};
  const {model}=audit,draws=parseDraws(code,model),seen=new Set(),replacements=[];
  for(const s of draws){
    if(s.kind!=='draw'||s.unknown||s.semantic||!s.edges.some(e=>e.solidEdge))continue;
    const lines=[],base=s.options.split(',').map(x=>x.trim()).filter(x=>x&&!/^(?:(?:densely |loosely )?(?:dashed|dotted|dash dot)|solid|dash pattern\s*=)/.test(x));
    for(const e of s.edges){
      if(!e.solidEdge){lines.push(`\\draw${s.options?'['+s.options+']':''} (${e.from})--(${e.to})${e.labels.length?' '+e.labels.join(' '):''};`);continue;}
      const key=edgeKey(e.a,e.b);
      if(!seen.has(key))for(const span of edgeVisibility(model,e.a,e.b)){
        const opts=[...base,...(span.hidden?['dashed']:[])];
        const endpoint=t=>!e.partial&&t===0?e.from:!e.partial&&t===1?e.to:(model.vertices[e.a].length===3&&/tdplot_main_coords/.test(code)?lerp(model.vertices[e.a],model.vertices[e.b],t):project(lerp(model.vertices[e.a],model.vertices[e.b],t),model.view)).map(number).join(',');
        lines.push(`\\draw${opts.length?'['+opts.join(',')+']':''} (${endpoint(span.from)})--(${endpoint(span.to)});`);
      }
      seen.add(key);
      for(const label of e.labels){
        let a=e.from,b=e.to;
        // Only equivalent translated cross-section edges, never arbitrary equal
        // lengths (vertex-labelled measurements keep their original attachment).
        if(moveLabels&&/^node\[[^\]]*\]\s*\{\$(?:[\d.]+\\text|[a-z]\$)/.test(label)&&edgeVisibility(model,e.a,e.b).every(s=>s.hidden)){
          const delta=sub(model.vertices[e.b],model.vertices[e.a]);
          const caps=model.faces.slice(0,2),sourceCap=caps.find(f=>f.includes(e.a)&&f.includes(e.b)),targetCap=caps.find(f=>f!==sourceCap);
          const equivalent=sourceCap&&targetCap&&solidEdges(model).flatMap(x=>[x,{a:x.b,b:x.a}]).find(x=>targetCap.includes(x.a)&&targetCap.includes(x.b)&&near(sub(model.vertices[x.b],model.vertices[x.a]),delta)&&sourceCap.every(id=>targetCap.some(other=>near(add(model.vertices[id],sub(model.vertices[x.a],model.vertices[e.a])),model.vertices[other])))&&edgeVisibility(model,x.a,x.b).every(s=>!s.hidden));
          if(equivalent){a=equivalent.a;b=equivalent.b;}
        }
        lines.push(`\\path (${a})--(${b}) ${label};`);
      }
    }
    replacements.push({...s,after:lines.join('\n')});
  }
  let next=code;for(const s of replacements.reverse())next=next.slice(0,s.index)+s.after+next.slice(s.index+s.raw.length);
  next=withSolidMetadata(next,{kind:'polyhedron',model});
  return {code:next,audit};
}
