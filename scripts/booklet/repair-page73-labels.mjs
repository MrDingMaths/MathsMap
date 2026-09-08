import fs from 'node:fs';
import {graphTikz} from '../../src/lib/graph-model.js';

const path='booklets/projects/linear-relationships-complete-v1.json';
const project=JSON.parse(fs.readFileSync(path,'utf8'));
const section=project.sections.find(s=>s.sourcePageNumber===73);
// Source p73: equations sit below the grid, as part of each diagram.
const labels=[
  [{x:-2.2,text:'y=2x-3'},{x:3.1,text:'y=-2x+1'}],
  [{x:-4.2,text:String.raw`y={\color{blue}2}x+1`},{x:.5,text:String.raw`y={\color{blue}2}x-3`}],
  [{x:-4,text:String.raw`y=-2x{\color{red}+1}`},{x:3.2,text:String.raw`y=2x{\color{red}+1}`}],
];
section.blocks.filter(b=>b.type==='worked-example').forEach((block,i)=>{
  const example=block.examples[0],diagram=example.questionDiagrams[0];
  diagram.mathematicalModel.labelFontPt=18;
  diagram.mathematicalModel.labels=labels[i].map((label,equationLine)=>({
    ...label,y:-5.55,options:'anchor=north,inner sep=2pt',equationLine,
    originalEquation:{...diagram.mathematicalModel.lines[equationLine]},
  }));
  diagram.code=graphTikz(diagram.mathematicalModel);
  delete example.diagramCaption;
});
fs.writeFileSync(path,JSON.stringify(project,null,2)+'\n');
console.log('Moved all six p73 equations into their editable TikZ graph models.');
