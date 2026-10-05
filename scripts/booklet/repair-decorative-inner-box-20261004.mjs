import {transform,block,unwrap,dryRunMain} from './layout-repair-common-20261004.mjs';
export const PROJECTS=['earning-money-v1'];
export function repairDecorativeInnerBox(source){return transform(source,'decorative-inner-box',p=>{if(p.id!==PROJECTS[0])return;const b=block(p,'p13-total-pay-formulas');b.content=unwrap(b.content,b);});}
await dryRunMain(import.meta.url,repairDecorativeInnerBox,PROJECTS);
