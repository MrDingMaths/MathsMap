// Independently evaluated from visually inspected student-source givens.
// This file is reviewer evidence and is never included in model packets.
export const lineValues=(m,c,x)=>x.map(v=>m*v+c);
const zeroTo3=[0,1,2,3], zeroTo4=[0,1,2,3,4];
export const PILOT_REFERENCE={
  3:{review:[3,-4,2,-1]},
  7:{q4:{A:[-7,5],H:[-3,3],G:[8,-2],E:[2,-5],L:[-2,6],F:[0,4],B:[7,3],D:[-3,-1]},q5:{a:3,b:-1,c:-2,d:0,e:-2,f:0,g:-3,h:0}},
  9:{q8:{A:[5,0],B:[0,5],C:[1.5,-4],D:[-.5,3]},q9:['D','B','A','C','E','H','F','G'],q10:{A:[-3,2],B:[1,4],C:[2,-1],D:[-2,-4],E:[-1,4],F:[-3,-1],G:[1.5,-2.5],H:[3.5,-2.5],I:[-2.5,1.5],J:[-1.5,-1.5],K:[1/3,5]}},
  13:{review:[13,17,-3,-49],example:{x:zeroTo3,y:lineValues(3,1,zeroTo3)},guided:[[3,2,zeroTo3],[4,3,zeroTo3],[3,2,[-3,-2,-1,0]],[-4,3,[-1,0,1,2]]].map(([m,c,x])=>({m,c,x,y:lineValues(m,c,x)}))},
  14:{q1:[[1,2],[4,0],[3,6],[-2,8],[.5,7]].map(([m,c])=>({m,c,x:zeroTo4,y:lineValues(m,c,zeroTo4)})),q2:[[2,0],[2,1],[2,5],[2,-3],[1,2],[3,2],[5,2],[-3,2],[2,1],[.5,1],[2,5],[-3,5]].map(([m,c],i)=>({m,c,x:i<10?zeroTo3:[-2,-1,0,1],y:lineValues(m,c,i<10?zeroTo3:[-2,-1,0,1])}))},
  16:{example:{m:2,c:1,x:zeroTo3,y:[1,3,5,7],axis:[-5,5]},guided:[{m:2,c:-1,y:[-1,1,3,5]},{m:-1,c:4,y:[4,3,2,1]}],keyIdeas:['coordinate pair','linear']},
  24:{verification:[true,false,false,true,true,false]},
  28:{q7:{plus15:[[4,19],[-15,0],[23,38],[-17,-2]],minus15:[[19,4],[0,-15],[15,0],[100,85],[12,-3]]},q8:[{m:1,c:1,givenPoints:[[0,1],[1,2],[2,3],[3,4]]},{m:1,c:3},{m:1,c:-2},{m:2,c:0},{m:3,c:0},{m:-2,c:0}]},
  29:{m:[4,6,-2,-3,5,'Unequal x increments: cannot read m from consecutive y differences alone; the difference-ratio method gives 2.'],c:[8,11,23,-5,-3,'No x=0 column: cannot read c directly; other methods give 2.']},
  33:{q5:'D',q6:'B',q7:[{m:2,c:3},{m:3,c:-4},{m:2,c:3},{m:3,c:9}]}
};
