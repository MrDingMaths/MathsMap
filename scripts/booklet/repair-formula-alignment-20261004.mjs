import {transform,block,dryRunMain} from './layout-repair-common-20261004.mjs';
import {alignIndependentParagraphs} from './layout-repair-alignment-20261004.mjs';
export const PROJECTS=['earning-money-v1'];
export function repairFormulaAlignment(source){return transform(source,'formula-alignment',p=>{if(p.id!==PROJECTS[0])return;const b=block(p,'p13-total-pay-formulas');if(b.sourceReview?.intentionalDepartures?.some(s=>String(s).includes('(formula-alignment)')))return;const paragraphs=b.content.blocks[0]?.type==='table'?b.content.blocks[0].rows[0][0].blocks:b.content.blocks;alignIndependentParagraphs(paragraphs);});}
await dryRunMain(import.meta.url,repairFormulaAlignment,PROJECTS);
