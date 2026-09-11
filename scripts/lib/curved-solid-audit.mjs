// Analytic cone-rim repair. Radius/height guides are not solid boundary edges.
import {number,withSolidMetadata} from '../../src/lib/solid-geometry.js';
import {parseNamedCoords} from './tikz-blocks.mjs';
const near=(a,b)=>a&&b&&Math.hypot(a[0]-b[0],a[1]-b[1])<0.005;
export function coneConstruction(code) {
 if(/tdplot_main_coords/.test(code))return null;
 const named=parseNamedCoords(code),point=s=>named.get(s)??(()=>{const p=s.split(',').map(Number);return p.length===2&&p.every(Number.isFinite)?p:null;})();
 const arcs=[];
 for(const m of code.matchAll(/\\draw(?:\[([^\]]*)\])?\s*\(([^)]+)\)\s*ellipse\s*\(([\d.]+)\s+and\s+([\d.]+)\)\s*;/g)){
   const center=point(m[2]);if(!center||/red|blue|green|orange|dashed|dotted/.test(m[1]??''))continue;
   for(const hidden of [false,true])arcs.push({raw:m[0],index:m.index,options:hidden?'dashed':m[1]??'',start:hidden?0:180,end:hidden?180:360,rx:+m[3],ry:+m[4],center,fullEllipse:true});
 }
 for(const m of code.matchAll(/\\draw(?:\[([^\]]*)\])?\s*\(([^)]+)\)\s*arc\s*(?:\[([^\]]*)\]|\(([^)]+)\))\s*;/g)){
   if(/red|blue|green|orange|->|<-/.test(m[1]??''))continue;
   let start,end,rx,ry;
   if(m[3]){const value=k=>{const x=m[3].match(new RegExp(k+'\\s*=\\s*(-?[\\d.]+)'));return x?+x[1]:null;};start=value('start angle');end=value('end angle');rx=value('x radius')??value('radius');ry=value('y radius')??rx;}
   else{const x=m[4].match(/^(-?[\d.]+):(-?[\d.]+):([\d.]+)\s+and\s+([\d.]+)$/);if(!x)continue;[start,end,rx,ry]=x.slice(1).map(Number);}
   const p=point(m[2]);if(!p||[start,end,rx,ry].some(v=>v===null)||rx<=0||ry<=0||ry>=rx)continue;
   const center=[p[0]-rx*Math.cos(start*Math.PI/180),p[1]-ry*Math.sin(start*Math.PI/180)];arcs.push({raw:m[0],index:m.index,options:m[1]??'',start,end,rx,ry,center});
 }
 for(const arc of arcs){
   const same=arcs.filter(a=>near(a.center,arc.center)&&Math.abs(a.rx-arc.rx)<0.005&&Math.abs(a.ry-arc.ry)<0.005);if(same.length!==2)continue;
   const lines=[];
   for(const m of code.matchAll(/\\draw(?:\[([^\]]*)\])?\s*\(([^)]+)\)\s*--\s*\(([^)]+)\)(\s*node[\s\S]*?)?\s*;/g)){
     if(/dashed|dotted|red|blue|green|orange|->|<-|Stealth/.test(m[1]??''))continue;
     const a=point(m[2]),b=point(m[3]);if(!a||!b)continue;
     for(const[tip,rim,tipToken]of [[a,b,m[2]],[b,a,m[3]]]){
       const h=tip[1]-arc.center[1];if(Math.abs(tip[0]-arc.center[0])>0.005||h<=arc.ry||Math.abs(rim[0]-arc.center[0])<arc.rx*0.5)continue;
       const ell=(rim[0]-arc.center[0])**2/arc.rx**2+(rim[1]-arc.center[1])**2/arc.ry**2;if(Math.abs(ell-1)>0.04)continue;
       lines.push({raw:m[0],index:m.index,options:m[1]??'',label:m[4]??'',tip,tipToken,rim,side:Math.sign(rim[0]-arc.center[0])});
     }
   }
   for(const left of lines.filter(l=>l.side<0)){const right=lines.find(l=>l.side>0&&near(l.tip,left.tip));if(!right)continue;
     const h=left.tip[1]-arc.center[1],theta=Math.asin(arc.ry/h)*180/Math.PI,x=arc.rx*Math.sqrt(1-arc.ry**2/h**2),y=arc.ry**2/h;
     const points={left:[arc.center[0]-x,arc.center[1]+y],right:[arc.center[0]+x,arc.center[1]+y]};
     const endpoints=same.flatMap(a=>[a.start,a.end]).map(v=>((v%360)+360)%360),correctAngles=endpoints.every(a=>Math.min(Math.abs(a-theta),Math.abs(a-(180-theta)))<0.005);
     const correctStyles=same.every(a=>/dashed|dotted/.test(a.options)===(Math.sin((a.start+a.end)*Math.PI/360)>arc.ry/h));
     return {arcs:same,left,right,theta,points,correct:near(left.rim,points.left)&&near(right.rim,points.right)&&correctAngles&&correctStyles};
   }
 }
 return null;
}
export function repairCone(code) {
 const cone=coneConstruction(code);if(!cone||cone.correct)return {code,changed:false};
 const {theta,points,arcs,left,right}=cone,coords=p=>'('+p.map(number).join(',')+')',r=arcs[0].rx,b=arcs[0].ry;
 const solid=arcs.find(a=>!/dashed|dotted/.test(a.options)),hidden=arcs.find(a=>/dashed|dotted/.test(a.options));if(!solid||!hidden)return {code,changed:false};
 const solidArc=`\\draw${solid.options?'['+solid.options+']':''} ${coords(points.left)} arc (${number(180-theta)}:${number(360+theta)}:${number(r)} and ${number(b)});`,hiddenArc=`\\draw[${hidden.options}] ${coords(points.right)} arc (${number(theta)}:${number(180-theta)}:${number(r)} and ${number(b)});`;
 const changes=solid.fullEllipse?[{...solid,after:solidArc+'\n'+hiddenArc}]:[{...solid,after:solidArc},{...hidden,after:hiddenArc}];
 for(const [line,p]of [[left,points.left],[right,points.right]])changes.push({...line,after:`\\draw${line.options?'['+line.options+']':''} (${line.tipToken})--${coords(p)};`+(line.label?`\n\\path (${line.tipToken})--${coords(p)}${line.label};`:'')});
 let next=code;for(const c of changes.sort((a,b)=>b.index-a.index))next=next.slice(0,c.index)+c.after+next.slice(c.index+c.raw.length);
 return {code:withSolidMetadata(next,{kind:'analytic-cone',radius:r,projectedRadius:b,height:left.tip[1]-arcs[0].center[1]}),changed:true};
}

// A circular sector extruded with one oblique offset. Test the outward circular
// normal against that offset; only the exposed portion of the rear arc is solid.
export function sweptArcConstruction(code,named=parseNamedCoords(code)) {
 const point=s=>named.get(s)??(()=>{const p=s.split(',').map(Number);return p.length===2&&p.every(Number.isFinite)?p:null;})();
 const arcs=[];
 for(const m of code.matchAll(/\\draw(?:\[([^\]]*)\])?\s*\(([^)]+)\)\s*arc\s*(?:\((-?[\d.]+):(-?[\d.]+):([\d.]+)\)|\[([^\]]*)\])\s*;/g)){
   if(/red|blue|green|orange/.test(m[1]??''))continue;
   const value=k=>{const v=m[6]?.match(new RegExp('(?:^|,)\\s*'+k+'\\s*=\\s*(-?[\\d.]+)'));return v?+v[1]:null;};
   const p=point(m[2]),start=m[3]===undefined?value('start angle'):+m[3],end=m[4]===undefined?value('end angle'):+m[4],radius=m[5]===undefined?value('radius'):+m[5];if(!p||start===null||end===null||radius===null||radius<0.3)continue;
   const at=t=>[radius*Math.cos(t*Math.PI/180),radius*Math.sin(t*Math.PI/180)],v=at(start),center=[p[0]-v[0],p[1]-v[1]];
   arcs.push({raw:m[0],index:m.index,options:m[1]??'',start,end,radius,center,at:t=>{const p=at(t);return [p[0]+center[0],p[1]+center[1]];}});
 }
 const segments=[];for(const m of code.matchAll(/\\draw(?:\[([^\]]*)\])?\s*\(([^)]+)\)\s*--\s*\(([^)]+)\)(\s*node[^;]*)?\s*;/g)){
   const a=point(m[2]),b=point(m[3]);if(a&&b&&!/red|blue|green|orange|->|<-|Stealth/.test(m[1]??''))segments.push({raw:m[0],index:m.index,options:m[1]??'',a,b,label:m[4]??''});
 }
 for(const front of arcs.filter(a=>Math.abs(a.end-a.start)>=30&&Math.abs(a.end-a.start)<=181&&!/dashed/.test(a.options))){
   for(const back of arcs){
     const dx=back.center[0]-front.center[0],dy=back.center[1]-front.center[1];if(dx<0.01||dy<0.01||Math.abs(back.radius-front.radius)>1e-5)continue;
     const rearArcs=arcs.filter(a=>near(a.center,back.center)&&Math.abs(a.radius-front.radius)<1e-5);
     const fEnds=[front.at(front.start),front.at(front.end)],rearEnds=fEnds.map(p=>[p[0]+dx,p[1]+dy]);
     const connectors=fEnds.map((p,i)=>segments.find(s=>(near(s.a,p)&&near(s.b,rearEnds[i]))||(near(s.b,p)&&near(s.a,rearEnds[i]))));if(connectors.some(s=>!s))continue;
     const lo=Math.min(front.start,front.end),hi=Math.max(front.start,front.end),alpha=Math.atan2(dy,dx)*180/Math.PI,cuts=[lo,hi];
     for(let k=-3;k<4;k++){const t=alpha+90+k*180;if(t>lo+1e-5&&t<hi-1e-5)cuts.push(t);}cuts.sort((a,b)=>a-b);
     const spans=cuts.slice(1).map((to,i)=>{const from=cuts[i],mid=(from+to)*Math.PI/360;return {from,to,hidden:Math.cos(mid)*dx+Math.sin(mid)*dy<0};});
     const directions=cuts.slice(1,-1),rulings=directions.map(t=>{const a=front.at(t),b=[a[0]+dx,a[1]+dy];return {a,b,existing:segments.find(s=>(near(s.a,a)&&near(s.b,b))||(near(s.b,a)&&near(s.a,b)))};});
     const arcCorrect=rearArcs.every(a=>spans.filter(s=>Math.min(s.to,Math.max(a.start,a.end))-Math.max(s.from,Math.min(a.start,a.end))>1e-5).every(s=>s.hidden===/dashed/.test(a.options)))&&Math.abs(rearArcs.reduce((n,a)=>n+Math.abs(a.end-a.start),0)-(hi-lo))<0.01;
     // Whether the other adjacent flat face at an endpoint is exposed. For a
     // half-sector it is the chord; for a quarter-sector it is a radial face.
     const midpointAngle=(lo+hi)*Math.PI/360,half=Math.abs(hi-lo-180)<0.01;
     const connectorHidden=fEnds.map((p,i)=>{const t=[front.start,front.end][i]*Math.PI/180,circle=Math.cos(t)*dx+Math.sin(t)*dy;let flat;
       if(half)flat=-Math.cos(midpointAngle)*dx-Math.sin(midpointAngle)*dy;
       else{const atLow=Math.abs([front.start,front.end][i]-lo)<1e-5;flat=(atLow?Math.sin(t):-Math.sin(t))*dx+(atLow?-Math.cos(t):Math.cos(t))*dy;}
       return circle< -1e-5&&flat< -1e-5;
     });
     const chord=half?segments.find(s=>(near(s.a,rearEnds[0])&&near(s.b,rearEnds[1]))||(near(s.b,rearEnds[0])&&near(s.a,rearEnds[1]))):null;
     const chordHidden=-Math.cos(midpointAngle)*dx-Math.sin(midpointAngle)*dy<0;
     const flatHidden=[lo,hi].map((t,i)=>{t*=Math.PI/180;return (i===0?Math.sin(t)*dx-Math.cos(t)*dy:-Math.sin(t)*dx+Math.cos(t)*dy)<-1e-5;});
     const rearCenter=[front.center[0]+dx,front.center[1]+dy],radials=[];
     if(!half){
       for(const [i,t]of [lo,hi].entries()){const p=front.at(t).map((v,j)=>v+[dx,dy][j]),s=segments.find(s=>(near(s.a,rearCenter)&&near(s.b,p))||(near(s.b,rearCenter)&&near(s.a,p)));if(s)radials.push({...s,hidden:flatHidden[i]});}
       const s=segments.find(s=>(near(s.a,front.center)&&near(s.b,rearCenter))||(near(s.b,front.center)&&near(s.a,rearCenter)));if(s)radials.push({...s,hidden:flatHidden.every(Boolean)});
     }
     const correct=arcCorrect&&rulings.every(r=>r.existing&&!/dashed/.test(r.existing.options))&&connectors.every((s,i)=>/dashed/.test(s.options)===connectorHidden[i])&&(!chord||/dashed/.test(chord.options)===chordHidden)&&radials.every(s=>/dashed/.test(s.options)===s.hidden);
     return {front,rearArcs,spans,rulings,connectors,connectorHidden,chord,chordHidden,radials,dx,dy,correct};
   }
 }return null;
}
export function repairSweptArc(code,named) {
 const c=sweptArcConstruction(code,named);if(!c||c.correct)return {code,changed:false};
 const coords=p=>'('+p.map(number).join(',')+')',changes=[];
 const rear=c.spans.map(s=>{const p=c.front.at(s.from);p[0]+=c.dx;p[1]+=c.dy;return `\\draw${s.hidden?'[dashed]':''} ${coords(p)} arc (${number(s.from)}:${number(s.to)}:${number(c.front.radius)});`;});
 c.rearArcs.forEach((a,i)=>changes.push({...a,after:i===0?rear.join('\n'):''}));
 c.connectors.forEach((s,i)=>changes.push({...s,after:`\\draw${c.connectorHidden[i]?'[dashed]':''} ${coords(s.a)}--${coords(s.b)};`+(s.label?`\n\\path ${coords(s.a)}--${coords(s.b)}${s.label};`:'')}));
 c.radials.forEach(s=>changes.push({...s,after:`\\draw${s.hidden?'[dashed]':''} ${coords(s.a)}--${coords(s.b)};`+(s.label?`\n\\path ${coords(s.a)}--${coords(s.b)}${s.label};`:'')}));
 if(c.chord)changes.push({...c.chord,after:`\\draw${c.chordHidden?'[dashed]':''} ${coords(c.chord.a)}--${coords(c.chord.b)};`+(c.chord.label?`\n\\path ${coords(c.chord.a)}--${coords(c.chord.b)}${c.chord.label};`:'')});
 for(const r of c.rulings)if(r.existing)changes.push({...r.existing,after:`\\draw ${coords(r.a)}--${coords(r.b)};`});
 let next=code;for(const x of changes.sort((a,b)=>b.index-a.index))next=next.slice(0,x.index)+x.after+next.slice(x.index+x.raw.length);
 const extra=c.rulings.filter(r=>!r.existing).map(r=>`\\draw ${coords(r.a)}--${coords(r.b)};`).join('\n');if(extra)next=next.replace('\\end{tikzpicture}',extra+'\n\\end{tikzpicture}');
 return {code:withSolidMetadata(next,{kind:'analytic-swept-arc',radius:c.front.radius,depthOffset:[c.dx,c.dy]}),changed:true};
}
