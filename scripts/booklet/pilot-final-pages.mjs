import {documentValue as doc,sourceParagraph as p,sourceTable,xyTable} from './source-document.mjs';
import {cartesianTikz} from './linear-geometry.mjs';
import {PILOT_REFERENCE as R} from './pilot-reference.mjs';
const blue='#268cff',red='#ef6068';
const diagram=(id,code,widthMm)=>({id,format:'tikz',role:'question',code,widthMm,derived:true,reviewStatus:'needs-review'});
const part=(id,label,prompt,answer={short:'',worked:'',solutionDiagrams:[]})=>({id,type:'part',label,prompt,layout:'list',children:[],questionDiagrams:[],responseSpace:'scaffold',answer});
const layout=(id,columns,slots,arrangement='parallel')=>({id,type:'layout',columns,slots,arrangement,border:false,padding:0,margin:0,gap:4});
const math=v=>'$'+v+'$';
export function correctLatePage(page,notes){
 if(page.pageNumber===28){const qs=page.blocks.filter(b=>b.type==='question'),q7=qs[0],q8=qs[1];q7.sourceOrder=7;q8.sourceOrder=8;
  const pairs=[[4,19],[19,4],[0,-15],[15,0],[-15,0],[23,38],[3.8,2.3],[100,85],[-17,-2],[12,-3]];
  q7.content.prompt=doc([p(q7.content.id+'-intro','Here are some pairs of coordinates.'),layout(q7.content.id+'-cards',5,pairs.map((xy,i)=>({id:q7.content.id+'-card-'+i,blocks:[p(q7.content.id+'-card-text-'+i,math('('+xy.join(',')+')'),{align:'center'})]})))]);q7.content.prompt.blocks[1].arrangement='cards';q7.content.layout='grid';q7.content.columns=2;q7.content.questionDiagrams=[];
  q7.content.children=['plus15','minus15'].map((key,i)=>{const id=q7.content.children?.[i]?.id??q7.content.id+'-'+i;const values=R[28].q7[key].map(xy=>math('('+xy.join(',')+')')).join(', ');const n=part(id,String.fromCharCode(97+i),`Which of the points lie on the line $y=x${i?'-':'+'}15$?`,{short:values,worked:values+`. These points have $y-x=${i?'-':''}15$.`,solutionDiagrams:[]});delete n.responseSpace;n.answerSpaceMm=12;return n;});
  q8.content.prompt='These straight line graphs have equations of the form $y=x+c$ or $y=mx$';q8.content.layout='grid';q8.content.columns=3;q8.content.answerColumns=3;q8.content.questionDiagrams=[];
  q8.content.children=R[28].q8.map((r,i)=>{const old=q8.content.children?.[i],id=old?.id??q8.content.id+'-'+i,relationship=['1 more than','3 more than','2 less than','2 times','3 times','−2 times'][i],eq=['y=x+1','y=x+3','y=x-2','y=2x','y=3x','y=-2x'][i];const given=i===0||i===3;const prompt=`At each point on the line, the $y$-value is ${given?`$\\color{${blue}}{\\text{${relationship}}}$`:'..................'} the $x$-value. The equation of the line is ..................`;
   const n=part(id,String.fromCharCode(97+i),prompt,{short:relationship+'; '+math(eq),worked:`The relationship is ${relationship} the $x$-value, so $${eq}$.`,solutionDiagrams:[]});n.diagramPlacement='before-prompt';n.questionDiagrams=[diagram(old?.questionDiagrams?.[0]?.id??id+'-graph',cartesianTikz({plotColour:'blue',lines:[r],points:(r.givenPoints??[]).map(([x,y])=>({x,y,label:'('+x+','+y+')',colour:'red!65'}))}),49)];return n;});
  notes.push('Rebuilt ten editable cards in the source five-column order. Retained six bounded given graphs above their prompts, restored first-part red coordinates and the two blue wording scaffolds. Answer fields contain the six independently checked rules.');
 }
 if(page.pageNumber===29){
  const mTables=[[[2,3,4],[8,12,16]],[[5,6,7],[30,36,42]],[[9,10,11],[20,18,16]],[[201,202,203],[18,15,12]],[[1,2,3],[905,910,915]],[[7,2,11],[25,15,33]]];
  const cTables=[[[0,1,2],[8,9,10]],[[0,4,18],[11,3,-25]],[[-2,0,15],[15,23,83]],[[0,22,8],[-5,127,43]],[[5,-3,0],[17,-15,-3]],[[-7,14,8],[51,-96,-54]]];
  const qs=page.blocks.filter(b=>b.type==='question');
  const atom={id:'page-29-definition-atom',kind:'definition',label:'Equation of a Linear Relationship',visibleSubtitle:'',description:'',order:1};
  const theory=String.raw`\begin{tikzpicture}[every node/.style={font=\large}]
\definecolor{coefficientblue}{RGB}{0,119,238}\definecolor{constantred}{RGB}{210,25,25}
\node[font=\huge,inner sep=0pt,outer sep=0pt] (m) at (0,2) {$\color{coefficientblue}m$};
\node[anchor=east,font=\huge,inner sep=0pt,outer sep=0pt] at (m.west) {$y=$};
\node[anchor=west,font=\huge,inner sep=0pt,outer sep=0pt] (xc) at (m.east) {$x+$};
\node[anchor=west,font=\huge,inner sep=0pt,outer sep=0pt] (c) at (xc.east) {$\color{constantred}c$};
\draw[->] (m.south)++(0,-.8) -- (m.south);
\draw[->] (c.south)++(0,-.8) -- (c.south);
\node[anchor=north east,align=right,text=coefficientblue] at (.55,1.05) {coefficient of $x$\\number $x$ is multiplied by\\change in $y$ as $x$ increases by 1};
\node[anchor=north west,align=left,text=constantred] at (1.2,1.05) {constant term\\term with no variable\\value of $y$ when $x=0$};
\end{tikzpicture}`;
  const definitionId=page.blocks.find(b=>b.type==='callout')?.id??'page-29-definition';
  page.blocks=[{id:definitionId,type:'callout',variant:'info',title:'',content:'Every linear relationship is in the form $y=mx+c$.',sourceAtom:atom},{...diagram('page-29-rule-diagram',theory,114),type:'diagram',sourceAtom:atom},...qs];
  for(const [index,values]of [[0,mTables],[1,cTables]]){const q=qs[index],symbol=index?'c':'m';q.sourceAtom={id:`page-29-identify-${symbol}`,kind:'identify',label:'Identify',visibleSubtitle:`$${symbol}$ from a table of values`,description:'',order:2+index};q.content.prompt=index?'$c$ is the constant term. It is the value of $y$ when $x=0$.':'$m$ is the coefficient of $x$. It is how much $y$ changes as $x$ increases by 1.';q.content.layout='grid';q.content.columns=3;q.content.answerColumns=3;
   q.content.children=values.map(([x,y],i)=>{const id=q.content.children?.[i]?.id??q.content.id+'-'+i;const t=xyTable(id+'-source-table',x,y,{widthMm:52,rowHeight:8});t.marginBefore=0;t.marginAfter=1;
    if(index===0&&i<2)t.annotations=[1,2].map(c=>({id:id+'-arrow-'+c,type:'arrow',cellId:`${t.id}-r1-c${c}`,toCellId:`${t.id}-r1-c${c+1}`,side:'bottom',label:i===0?'+4':'',colour:blue}));
    if(index===1&&i===0)t.annotations=[{id:id+'-constant',type:'circle',cellId:t.id+'-r1-c1',colour:red}];
    const answer=i<5?R[29][symbol][i]:index?'There is no $x=0$ column, so $c$ cannot be read directly. Other methods give $c=2$.':'The $x$ increments are unequal, so consecutive $y$ differences alone do not give $m$. The difference ratio gives $m=2$.';const prompt=doc([t,p(id+'-response',i<5?math(symbol+'=')+' ............':`Why can’t we find $${symbol}$?`)]);const worked=i<5?(index?`The column with $x=0$ has $y=${answer}$, so $c=${answer}$.`:`When $x$ increases by 1, $y$ changes by $${y[1]}-(${y[0]})=${answer}$, so $m=${answer}$.`):answer;
    return part(id,String.fromCharCode(97+i),prompt,{short:i<5?math(symbol+'='+answer):answer,worked,solutionDiagrams:[]});});
  }
  notes.push('Rebuilt all twelve source tables with exact given values, stable cell arrows and the red constant-term circle. Preserved nonuniform x and absent-x=0 cases; qualified the method limitation rather than claiming the quantities cannot be calculated.');
 }
 if(page.pageNumber===33){const qs=page.blocks.filter(b=>b.type==='question');qs.forEach((q,i)=>q.sourceOrder=5+i);const q5=qs[0],q6=qs[1],q7=qs[2];
  const optionTable=(id,x,y)=>{const t=xyTable(id,x,y,{widthMm:76,rowHeight:7,borderColour:'#f5c99f'});t.rows.forEach(row=>row[0].background='#f9c99b');t.marginBefore=0;t.marginAfter=1;return t;};
  q5.content.prompt=doc([p(q5.content.id+'-intro','Find the equation that describes this table of values. Select A, B, C, or D.'),{...optionTable(q5.content.id+'-source-table',[-1,0,1,2],[3,1,-1,-3]),widthMm:55},layout(q5.content.id+'-options',4,['2x+1','2x-1','x-2','-2x+1'].map((eq,i)=>({id:q5.content.id+'-option-'+i,blocks:[p(q5.content.id+'-option-text-'+i,String.fromCharCode(65+i)+'   '+math('y='+eq))]})))]);q5.content.children=[];q5.content.questionDiagrams=[];q5.content.responseSpace='scaffold';q5.content.answer={short:'D',worked:'D: $y=-2x+1$. As $x$ increases by 1, $y$ decreases by 2; at $x=0$, $y=1$.',solutionDiagrams:[]};
  q6.content.prompt=doc([p(q6.content.id+'-intro','Which table of values matches $y=3x-1$? Select A, B, C, or D.'),layout(q6.content.id+'-options',2,[[2,3,4,5,6],[2,5,8,11,14],[4,7,10,13,16],[0,3,6,9,12]].map((y,i)=>({id:q6.content.id+'-option-'+i,blocks:[p(q6.content.id+'-label-'+i,String.fromCharCode(65+i)),optionTable(q6.content.id+'-table-'+i,[1,2,3,4,5],y)]})))]);q6.content.children=[];q6.content.questionDiagrams=[];q6.content.responseSpace='scaffold';q6.content.answer={short:'B',worked:'B. Substituting $x=1,2,3,4,5$ in $y=3x-1$ gives $2,5,8,11,14$.',solutionDiagrams:[]};
  const data=[{x:[0,1,2,'x',3,4,5,6,7],y:[3,5,7,'y',9,11,13,15,17],ext:[0,1,2],red:[[4,2],[2,1],[1,0]],blue:[[4,5],[5,6],[6,7],[7,8]]},{x:['','','x',2,3,4,5,6],y:['','','y',2,5,8,11,14],ext:[0,1],red:[[3,1],[1,0]],blue:[[3,4],[4,5],[5,6],[6,7]]},{x:['','','','','x',4,5,6,7],y:['','','','','y',11,13,15,17],ext:[0,1,2,3],red:[[5,3],[3,2],[2,1],[1,0]],blue:[[5,6],[6,7],[7,8]]},{x:['x',-6,-5,-4,-3,'','',''],y:['y',-9,-6,-3,0,'','',''],ext:[5,6,7],red:[[4,5],[5,6],[6,7]],blue:[[1,2],[2,3],[3,4]]}];
  q7.content.prompt='Extend the table so that $x=0$ is shown, then find the equation of the line.';q7.content.layout='grid';q7.content.columns=2;q7.content.answerColumns=2;q7.content.questionDiagrams=[];
  q7.content.children=data.map((v,i)=>{const id=q7.content.children?.[i]?.id??q7.content.id+'-'+i,r=R[33].q7[i];const t=sourceTable(id+'-extension-table',[v.x.map(x=>x===''?'':math(x)),v.y.map(y=>y===''?'':math(y))],{widthMm:60,rowHeight:7,shadeLabels:false,borderColour:'#111111',borderWidthMm:.45});t.marginBefore=0;t.marginAfter=1;
   for(const row of t.rows)for(const c of v.ext){row[c].borderColour='#2222ff';row[c].borderWidthMm=.65;if(i===0)row[c].colour='#2222ff';}
   t.annotations=['red','blue'].flatMap(kind=>v[kind].map(([from,to],j)=>({id:id+'-'+kind+'-'+j,type:'arrow',cellId:`${t.id}-r1-c${from}`,toCellId:`${t.id}-r1-c${to}`,side:'bottom',label:i===0?(kind==='red'?'-2':'+2'):'',labelBox:true,colour:kind==='red'?red:'#2222ff'})));
   const prompt=doc([t,...(i<2?[p(id+'-mc','$m=$ ............     $c=$ ............'),p(id+'-equation','$y=$ ..................')]:[{id:id+'-working-space',type:'spacer',height:12}])]);
   const x=v.x.map((x,c)=>x!==''?x:i===1?c:i===2?c:c-7);const y=x.map(x=>x==='x'?'y':r.m*x+r.c);const answered=sourceTable(id+'-completed-table',[x.map(math),y.map(math)],{widthMm:60,rowHeight:7,shadeLabels:false});
   const rule=`$m=${r.m},\\ c=${r.c},\\ y=${r.m}x${r.c<0?'':'+'}${r.c}$`;return part(id,String.fromCharCode(97+i),prompt,{short:rule,worked:doc([answered,p(id+'-solution',`The change in $y$ per unit increase in $x$ is $${r.m}$. At $x=0$, $y=${r.c}$. Therefore ${rule}.`)]),solutionDiagrams:[]});});
  notes.push('Restored source Q5/Q6 option grids and orange tables. Rebuilt four editable extension tables with blue extension borders, anchored red/blue arrows and label boxes; only source-given a coordinates and labels appear in student mode. Completed all equations independently.');
 }
}
