import {graphTikz} from '../../src/lib/graph-model.js';
// Deterministic reviewer geometry, used only after initial model outputs are scored.
export function clipLinearGraph(m,c,{xmin=-5,xmax=5,ymin=-5,ymax=5}={}){
 if(![m,c,xmin,xmax,ymin,ymax].every(Number.isFinite)||xmin>=xmax||ymin>=ymax)throw new Error('Invalid line or graph bounds');
 const candidates=[[xmin,m*xmin+c],[xmax,m*xmax+c]];
 if(m!==0)candidates.push([(ymin-c)/m,ymin],[(ymax-c)/m,ymax]);
 const points=candidates.filter(([x,y])=>x>=xmin-1e-9&&x<=xmax+1e-9&&y>=ymin-1e-9&&y<=ymax+1e-9).filter((p,i,a)=>a.findIndex(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<1e-9)===i).sort((a,b)=>a[0]-b[0]);
 return points.length>=2?[points[0],points.at(-1)]:[];
}
export function cartesianTikz({bounds={xmin:-5,xmax:5,ymin:-5,ymax:5},points=[],lines=[],pointColour='answerblue',plotColour='answerblue'}={}){
 const {xmin,xmax,ymin,ymax}=bounds;
 for(const p of points)if(p.x<xmin||p.x>xmax||p.y<ymin||p.y>ymax)throw new Error('Point outside source bounds: '+p.label);
 return graphTikz({bounds,points,lines,pointColour,plotColour,heightCm:6.5*(ymax-ymin)/(xmax-xmin)});
}
