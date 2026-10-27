import {resolveArrangement,liftQuestionStem,gridRows} from './booklet-arrangement.js';
import {findArrangement} from '../../public/libs/maths-editor/arrangement-model.mjs';

// Explicit maintenance/authoring operation, never an automatic load migration.
// Measurements come from the printed layout, including saved handwriting space.
export const graphQuestionsOverhang=({overhangMm,textMm,graphMm})=>overhangMm>=20&&textMm>=graphMm*1.35;
export function graphQuestionsBelow(block,overrides,{nodeId,rowId}){
 const owner=findNode(block.content,nodeId);if(!owner?.children?.length)return null;
 let tree=resolveArrangement(block,overrides?.blockLayouts?.[block.id]?.arrangement??block.presentation?.layoutOverrides?.blockLayouts?.[block.id]?.arrangement,overrides).tree;
 tree=liftQuestionStem(tree,nodeId)??tree;
 let row=findArrangement(tree.root,rowId+':below-stem')??findArrangement(tree.root,rowId);
 const parts=findArrangement(tree.root,nodeId+':parts');
 if(!row||row.direction!=='row'||!parts)return null;
 // A right-hand graph can have its shared stem in the first column. Lift it
 // explicitly too, before ordering the graph and response grid vertically.
 const stems=[],prefix=nodeId+'/prompt';
 const extract=node=>{if(node.type==='item'&&(node.ref===prefix||node.ref?.startsWith(prefix+'#'))){stems.push(node);return false;}if(node.type==='group'){const had=node.children.length;node.children=node.children.filter(extract);return !had||node.children.length>0;}return true;};
 row.children=row.children.filter(extract);
 if(stems.length){const body={...row,id:row.id+':below-stem',children:row.children};row.direction='stack';row.children=[...stems,body];row=body;}
 row.direction='stack';row.gap=3;
 const diagramIds=new Set((owner.questionDiagrams??[]).map(d=>d.id));
 const hasGraph=node=>diagramIds.has(node.ref)||(node.children??[]).some(hasGraph);
 row.children.sort((a,b)=>Number(hasGraph(b))-Number(hasGraph(a)));
 for(const child of row.children){delete child.weight;}
 // Preserve every part's existing prompt, answer space and internal arrangement.
 const cells=parts.children.flatMap(child=>child.id?.startsWith(nodeId+':row:')?child.children:child).filter(child=>!/:fill:\d+$/.test(child.id));
 parts.direction='stack';parts.children=gridRows(nodeId,cells,2);parts.gap=3;
 return tree;
}
function findNode(node,id){if(node?.id===id)return node;for(const child of node?.children??[]){const found=findNode(child,id);if(found)return found;}return null;}
