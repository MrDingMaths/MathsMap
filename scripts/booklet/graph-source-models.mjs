// Values checked against the retained source images (output/graph-repair/images-*.png).
import fs from 'node:fs';
import {graphModel} from '../../src/lib/graph-model.js';
const inventory=JSON.parse(fs.readFileSync('scripts/booklet/graph-source-inventory.json'));
const specs={};
const line=(m,c,colour='answerblue',more={})=>({m,c,colour,...more});
const point=(x,y,label='',colour='answerblue',anchor='above right')=>({x,y,label,colour,anchor});
const label=(x,y,text,options='above right')=>({x,y,text,options});
function set(i,bounds,lines=[],extra={}){const [xmin,xmax,ymin,ymax]=bounds;specs[inventory[i].id]=graphModel({bounds:{xmin,xmax,ymin,ymax},lines,...extra});}
set(0,[0,7,0,7]);set(1,[-4,4,-4,4]);
set(2,[-4,4,-4,4],[],{gridColour:'cyan!55',points:[point(-1,2,'(-1,2)','blue','below left')],axisTikz:String.raw`\draw[red,->] (axis cs:-2.5,3.3)--(axis cs:-1.7,2.1);
\draw[red,->] (axis cs:1.8,3.1)--(axis cs:0,2.5);
\draw[red,->] (axis cs:2.8,-1.4)--(axis cs:2.4,0);
\draw[red,->] (axis cs:1.5,-2.8)--(axis cs:0,0);
\draw (axis cs:-4,3.5)--(axis cs:-1.1,3.5);
\draw (axis cs:1.5,3.6)--(axis cs:4,3.6);
\draw (axis cs:1.5,-2)--(axis cs:4,-2);
\draw (axis cs:1.1,-3.3)--(axis cs:4,-3.3);`});
set(3,[0,18,0,12],[],{heightCm:4.34});set(4,[-5,5,-5,5]);set(5,[-4,4,-4,4],[],{points:[{...point(-3,4,'P','black','above left'),mark:'x'}]});
set(6,[-6,6,-5,6],[],{gridColour:'cyan!55',points:[point(2,3,'A','orange','above left'),point(-4,1,'B','orange','above left'),point(3,1,'C','orange','above left'),point(-3,-3,'D','orange','above left'),point(4,4,'E','orange','above left'),point(2,5,'F','orange','above left'),point(4,-4,'G','orange','above left'),point(-1,4,'H','orange','above left')]});
set(7,[-4,4,-4,4],[],{xminor:1,yminor:1,points:[point(2,1.5,'A','black'),point(4,-2.5,'B','black'),point(-2.5,-1.5,'C','black')]});set(8,[-5,5,-5,5],[line(1,-1)]);
for(const i of [11,14])set(i,[0,10,0,10]);set(12,[-4,4,-4,4]);
set(13,[-5,5,-5,5],[],{panels:[
 graphModel({bounds:{xmin:-2,xmax:3,ymin:-2,ymax:4},lines:[line(-1,2)],widthCm:5.5,heightCm:5.5,labels:[label(-2,4.8,'\\mathrm{a}'),label(-2,6,'\\mathrm{A}\\quad y=2x+1')]}),
 graphModel({bounds:{xmin:-2,xmax:3,ymin:-2,ymax:4},lines:[line(-2,3)],widthCm:5.5,heightCm:5.5,points:[point(1,1,'(1,1)','red'),point(2,-1,'(2,-1)','red')],labels:[label(-2,4.8,'\\mathrm{b}'),label(-2,6,'\\mathrm{B}\\quad y=-x-1')]}),
 graphModel({bounds:{xmin:-3,xmax:3,ymin:-2,ymax:4},lines:[line(2,1)],widthCm:5.5,heightCm:5.5,points:[point(-1,-1,'(-1,-1)','red','below left'),point(0,1,'','red')],labels:[label(-3,4.8,'\\mathrm{c}'),label(-3,6,'\\mathrm{C}\\quad y=-2x+3')]}),
 graphModel({bounds:{xmin:-3,xmax:2,ymin:-3,ymax:3},lines:[line(-1,-1)],widthCm:5.5,heightCm:5.5,points:[point(-1,0,'','red'),point(0,-1,'','red')],labels:[label(-3,3.8,'\\mathrm{d}'),label(-3,5,'\\mathrm{D}\\quad y=-x+2')]})]});
for(const i of [15,18,19,20,21,23,24,25,26,27,28])set(i,[0,8,0,32],[],{ystep:4});
set(16,[0,8,0,32],[line(3,1)],{ystep:4});set(17,[0,8,0,32],[line(3,2)],{ystep:4});set(29,[0,8,0,40],[line(4,1)],{ystep:5});
set(30,[0,8,0,24],[],{ystep:4,labels:[label(4,-3,'\\text{Number of squares}','below'),label(-1.1,12,'\\text{Number of matches}','rotate=90,above')]});set(31,[0,8,0,24],[],{ystep:4});
for(let i=32;i<=39;i++)set(i,[0,10,0,10]);
set(40,[0,9,0,18],[],{ystep:2,points:Array.from({length:7},(_,i)=>point(i+1,2*(i+1)+1,`(${i+1},${2*(i+1)+1})`,i>=5?'green':'orange','above left'))});set(41,[0,7,0,16],[],{ystep:2,points:Array.from({length:5},(_,i)=>point(i+1,3*(i+1)-2,'','orange'))});
set(42,[-7,7,-7,7],[line(-2,6)]);set(43,[-7,7,-7,7]);set(44,[-7,7,-7,7]);
set(45,[0,10,0,50],[],{ystep:4,yminor:1});for(const i of [46,47])set(i,[0,30,0,100],[],{xstep:10,ystep:10,xminor:1});set(48,[0,20,0,100],[],{xstep:5,ystep:10});set(49,[0,10,0,20],[],{ystep:2});set(50,[0,10,0,1600],[],{ystep:200});set(51,[0,10,0,35],[],{ystep:5});set(52,[0,10,0,5],[],{ystep:.5});set(53,[0,20,0,100],[],{xstep:5,ystep:10});
set(55,[-2.2,2.2,-2,2.2],[line(2,1,'red')],{xstep:1,ystep:1,xminor:4,yminor:4});set(56,[-2.5,1.1,-1,3.3],[line(2,1,'red'),line(2,3,'blue')],{xstep:1,ystep:1,xminor:4,yminor:4});
const multi=[[[ -1,1],[2,1],[2,-4]],[[3,0],[2,0],[1,0]],[[-1,0],[-2,0],[-3,0]],[[2,3],[2,0],[2,-4]],[[1,5],[1,3],[1,2]],[[1,-2],[1,-3],[1,-5]],[[2,3],[4,3],[-1,3]]];
const texts=[['y=-x+1','y=2x+1','y=2x-4'],['y=3x','y=2x','y=x'],['y=-x','y=-2x','y=-3x'],['y=2x+3','y=2x','y=2x-4'],['y=x+5','y=x+3','y=x+2'],['y=x-2','y=x-3','y=x-5'],['y=2x+3','y=3+4x','y=3-x']];
for(let j=0;j<multi.length;j++)set(57+j,[-5,5,-5,5],multi[j].map(([m,c])=>line(m,c,'black')),{labels:texts[j].map((t,i)=>label(-5+i*3.7,j<5?5.7:-6.2,t,'anchor=west'))});
set(64,[-5,5,-5,5],[line(-1,1,'green'),line(2,3,'blue'),line(4,3,'violet'),line(2,-4,'red')]);set(65,[-5,5,-5,5],[line(2,1)]);set(66,[-5,5,-5,5]);set(67,[0,10,0,20],[line(2,1)],{ystep:2,yminor:1});set(68,[-5,5,-5,5],[line(1,-2)]);
for(const [i,m,c] of [[69,3,1],[70,-2,1],[71,.5,1],[72,2,1],[73,3,-2],[74,4,-1],[75,3,4],[76,5,-2],[77,-2,4],[78,-1,3],[79,-3,0]]){const a=i>=73&&i<=76?8:5;set(i,[-a,a,-a,a],[line(m,c)],a===8?{xstep:2,ystep:2,xminor:1,yminor:1}:{});}
set(80,[-6,6,-7,7],[line(2,-1,'blue')],{gridColour:'cyan!55',labels:[label(2.6,3,'y=2x-1')]});set(81,[-6,6,-4,7],[line(-1,3,'blue')],{gridColour:'cyan!55',labels:[label(-5,4.3,'y=3-x')]});
set(82,[-3,3,-10,12],[line(5,-3,'violet')],{ystep:5,xminor:4,yminor:4,heightCm:4.8});set(83,[-5,5,-6,15],[line(-2,4,'violet')],{xstep:2,ystep:5,xminor:3,yminor:4});set(84,[-5,5,-5,5],[line(1,1,'blue'),line(-1,5,'red')]);
const pairs=[[[1,3,'blue'],[-2,0,'red']],[[-1,2,'red'],[1,-2,'blue']],[[.5,1,'red'],[2,-5,'blue']],[[1,-1,'red'],[2,1,'blue']],[[-1,7,'red'],[2,-5,'teal']],[[2,8,'teal'],[1,3,'red']],[[1,-6,'red'],[-4,4,'teal']],[[.5,1,'blue'],[-1,-2,'red']]];
const bs=[[-4,4,-3,5],[-2,6,-4,4],[-6,6,-6,6],[-6,6,-6,6],[-8,10,-10,10],[-8,10,-10,10],[-8,10,-10,10],[-4,4,-4,4]];
const pairLabels={85:[label(.2,2.7,'y=x+3'),label(1.4,-2.2,'y=-2x')],86:[label(1,1.7,'y=-x+2'),label(1.5,-2.3,'y=x-2')],89:[label(-7,8.3,'y=-x+7','red'),label(1,-5.5,'y=2x-5','teal')],90:[label(-7,4.3,'y=2x+8','teal'),label(4,6.5,'y=x+3','red')],91:[label(4,2.5,'y=x-6','red'),label(3,-7.5,'y=-4x+4','teal')],92:[label(.6,2.8,'y=0.5x+1'),label(.4,-2.2,'y=-x-2')]};
for(let j=0;j<8;j++)set(85+j,bs[j],pairs[j].map(([m,c,col])=>line(m,c,col)),{gridColour:'cyan!55',...(j>=4&&j<=6?{xstep:2,ystep:2}:{}),labels:pairLabels[85+j]??[]});
set(93,[-10,10,-10,10],[line(2,1,'blue'),{x:3,colour:'green'},line(0,3,'red')]);set(94,[-4,5,-4,5],[line(2,2,'teal'),line(2,-2,'orange'),line(-.5,3,'magenta')],{gridColour:'cyan!55',labels:[label(1.4,4.3,'A','teal'),label(3.5,4.3,'B','orange'),label(4.3,1,'C','magenta')]});

// Keep each equation caption beside its corresponding curve, including the clustered slopes.
const captionXs=[[-4,1.5,4.8],[.6,3,5.3],[-5,-3,-.8],[.3,2.5,4.8],[-.8,1.6,4],[-4,-1.5,1.3],[-4,-1.4,5.4]];
for(let j=0;j<multi.length;j++)specs[inventory[57+j].id].labels.forEach((l,i)=>{l.x=captionXs[j][i];l.options='anchor=south';if(j===6&&i===2){l.y=-2.3;l.options='anchor=west';}});
specs['page-6-q1-diagram'].labels.push(label(0,0,'O','below left'));

set(9,[-3,23,-8,5],[],{grid:false,ticks:false,axisLabels:false,axisArrows:'->',heightCm:3.8,rectangle:{left:3,right:18,bottom:-5,top:1,labels:[{text:'(3,1)',options:'above right'},{text:'(?,?)',options:'red,above right'},{text:'(18,-5)',options:'below right'}]}});
set(10,[-2,25,-7,7],[],{grid:false,ticks:false,axisLabels:false,axisArrows:'->',heightCm:3.8,rectangle:{left:6,right:19,bottom:-4,top:3,showHeight:true,schematic:true,labels:[{text:''},{text:'(?,?)',options:'red,above right'},{text:'(19,-4)',options:'below right'}]}});
const composite=specs[inventory[13].id];
composite.panelHeadings=['\\mathrm{A}\\quad y=2x+1','\\mathrm{B}\\quad y=-x-1','\\mathrm{C}\\quad y=-2x+3','\\mathrm{D}\\quad y=-x+2'];
for(const panel of composite.panels)panel.labels=panel.labels.slice(0,1);
specs['page-63-q11-diag-graph'].points[0].anchor='above right';
fs.writeFileSync('scripts/booklet/graph-source-models.json',JSON.stringify(specs,null,2)+'\n');
console.log('Source-checked graph models',Object.keys(specs).length);
