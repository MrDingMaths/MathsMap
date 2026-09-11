// Native replacements for the four reviewed raster outline diagrams. Coordinates
// retain the source frames; fills distinguish material/regions and are semantic.
import {adoptDiagramColours} from '../../src/lib/diagram-colours.js';
const frame=(w,h,body,width=0.3)=>`\\begin{tikzpicture}[x=0.1pt,y=-0.1pt,line width=${width}pt]\n\\path[use as bounding box] (0,0) rectangle (${w},${h});\n${body}\n\\end{tikzpicture}`;
function fence(){
  const lines=['\\definecolor{timberFill}{HTML}{FFBB90}'];
  for(const[start,count]of [[14,1],[308,2],[765,3]]){
    for(let n=0;n<count;n++)for(const[y1,y2]of [[32,86],[107,160]])lines.push(`\\filldraw[fill=timberFill,draw=black] (${start+54+n*164},${y1}) rectangle (${start+164+n*164},${y2});`);
    for(let n=0;n<=count;n++)lines.push(`\\filldraw[fill=timberFill,draw=black] (${start+n*164},14) rectangle (${start+n*164+54},179);`);
  }
  return frame(1320,191,lines.join('\n'));
}
function trapezoids(){
  const lines=[];
  for(const[x,y,rotation]of [[137,44,0],[100,124,0],[168,124,0],[49,85,-55],[228,86,55],[435,42,0],[570,42,0],[638,42,0],[398,124,0],[465,124,0],[600,124,0],[345,85,-55],[687,91,65],[896,39,0],[1029,39,0],[1096,39,0],[1226,39,0],[862,122,0],[930,122,0],[1061,122,0],[1190,122,0],[1259,122,0],[805,83,-55],[1320,82,55]]){
    lines.push(`\\begin{scope}[shift={(${x},${y})},rotate=${rotation}]\n\\draw (0,0) ellipse[x radius=17,y radius=33];\n\\draw (0,0) ellipse[x radius=10,y radius=23];\n\\end{scope}`);
  }
  for(const points of ['(77,43)--(200,43)--(241,125)--(34,125)','(374,41)--(495,41)--(539,124)--(332,124)','(495,41)--(702,41)--(660,124)--(539,124)','(836,39)--(958,39)--(1001,122)--(793,122)','(958,39)--(1167,39)--(1122,122)--(1001,122)','(1167,39)--(1287,39)--(1329,122)--(1122,122)'])lines.push(`\\filldraw[fill=white,draw=black] ${points}--cycle;`);
  return frame(1378,171,lines.join('\n'));
}
function tiles(){
  const lines=['\\definecolor{tileFill}{HTML}{BBBBD9}'];
  for(const[start,count,step]of [[8,1,55.4],[257,2,55.4],[562,3,55.4],[908,4,55.4]]){
    lines.push(`\\fill[tileFill] (${start+step},67) rectangle (${start+(count+1)*step},123);`);
    for(let x=0;x<=count+2;x++)lines.push(`\\draw (${start+x*step},12)--(${start+x*step},179);`);
    for(const y of [12,67,123,179])lines.push(`\\draw (${start},${y})--(${start+(count+2)*step},${y});`);
  }
  return frame(1253,186,lines.join('\n'));
}
function squareTables(){
  const lines=['\\definecolor{tableFill}{HTML}{999999}'];
  for(const[start,count]of [[54,1],[164,2],[347,3]]){
    for(let i=0;i<count;i++){
      const x=start+i*69;
      lines.push(`\\filldraw[draw=black,fill=tableFill] (${x-14},49) rectangle (${x+14},77);`);
      for(const y of [29,97])lines.push(`\\draw (${x},${y}) circle[radius=14];`);
    }
    for(let i=0;i<=count;i++)lines.push(`\\draw (${start-34+i*69},63) circle[radius=14];`);
  }
  lines.push('\\draw (109,0)--(109,121);','\\draw (292,0)--(292,121);');
  return frame(537,121,lines.join('\n'),0.2);
}
export function rasterColourReplacement(node){
  const name=node.src?.split('/').at(-1);
  const entry={
    '0da6b03f8746-image106.png':[fence,{name:'timberFill',hex:'FFBB90',reason:'Timber panels distinguished from gaps'}],
    'a9c60f28037f-image107.png':[trapezoids,null],
    '13ff3d67d686-image110.png':[tiles,{name:'tileFill',hex:'BBBBD9',reason:'Shaded tiles distinguished from the surrounding unshaded tiles'}],
    '025f998fd1b5-image123.png':[squareTables,{name:'tableFill',hex:'999999',reason:'Square tables distinguished from circular chairs'}],
  }[name];
  if(!entry)return null;
  const [make,semantic]=entry;
  return adoptDiagramColours(make(),{kind:'geometry',base:[],semantic:semantic?[semantic]:[],reference:`Linear Relationships source ${name}, ${node.id}`});
}
