import {transform,block,clearArrangement,dryRunMain} from './layout-repair-common-20261004.mjs';
export const PROJECTS=['operations-fractions-decimals-v1'];
export function repairRegularGrid(source){return transform(source,'regular-grid',p=>{if(p.id!==PROJECTS[0])return;const b=block(p,'p27-q2'),parts=b.content.children,byLabel=new Map(parts.map(x=>[x.label,x]));const order=['a','e','i','b','f','j','c','g','k','d','h','l'];if(parts.length!==12||order.some(x=>!byLabel.has(x)))throw Error('Source-labelled grid changed');b.content.children=order.map(x=>byLabel.get(x));b.content.layout='grid';b.content.columns=3;clearArrangement(p,b);});}
await dryRunMain(import.meta.url,repairRegularGrid,PROJECTS);
