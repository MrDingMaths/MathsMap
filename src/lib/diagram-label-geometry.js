// Label ink rectangles become convex quadrilaterals after SVG transforms.
// Project onto each edge normal (the separating-axis test), keeping tolerance
// in screen pixels rather than comparing the empty corners of axis-aligned boxes.
export function convexPolygonsOverlap(a,b,tolerance=0) {
  if(a.length<3||b.length<3)return false;
  for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){
    const p=polygon[i],q=polygon[(i+1)%polygon.length];
    const length=Math.hypot(q.x-p.x,q.y-p.y);
    if(!length)return false;
    const nx=(p.y-q.y)/length,ny=(q.x-p.x)/length;
    const project=points=>{
      const values=points.map(point=>point.x*nx+point.y*ny);
      return {min:Math.min(...values),max:Math.max(...values)};
    };
    const x=project(a),y=project(b);
    if(Math.min(x.max,y.max)-Math.max(x.min,y.min)<=tolerance)return false;
  }
  return true;
}
