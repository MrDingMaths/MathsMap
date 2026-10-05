import {transform,block,INK,dryRunMain} from './layout-repair-common-20261004.mjs';
import {alignIndependentParagraphs} from './layout-repair-alignment-20261004.mjs';
export const PROJECTS=['data-analysis-2-v1'];
export function repairMeanAlignment(source){return transform(source,'mean-alignment',p=>{if(p.id!==PROJECTS[0])return;const b=block(p,'p37-example');if(b.sourceReview?.intentionalDepartures?.some(s=>String(s).includes('(mean-alignment)')))return;const e=b.examples.find(e=>e.id==='p37-example-mean'),ps=e.prompt.blocks.filter(x=>x.inlines?.length===1&&x.inlines[0].type==='math');ps[0].inlines[0].colour=INK;alignIndependentParagraphs(ps);});}
await dryRunMain(import.meta.url,repairMeanAlignment,PROJECTS);
