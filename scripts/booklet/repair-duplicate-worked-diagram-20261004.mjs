import {transform,block,dryRunMain} from './layout-repair-common-20261004.mjs';
export const PROJECTS=['circle-trigonometry-v1'];
export function repairDuplicateWorkedDiagram(source){return transform(source,'duplicate-worked-diagram',p=>{if(p.id!==PROJECTS[0])return;const b=block(p,'p53-determine');for(const e of b.examples){const base=e.questionDiagrams?.[0],solution=e.solutionDiagrams?.[0];if(!base||!solution||base.widthMm!==solution.widthMm)throw Error('ASTC figure pair changed');solution.overlayOf=base.id;}});}
await dryRunMain(import.meta.url,repairDuplicateWorkedDiagram,PROJECTS);
