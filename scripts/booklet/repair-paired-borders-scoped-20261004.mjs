import {transform,block,visit,unborder,dryRunMain} from './layout-repair-common-20261004.mjs';
export const TARGETS={'operations-fractions-decimals-v1':['p28-q4','p85-algorithm-pair'],'logarithms-v1':['p27-q22'],'area-parallelograms-triangles-v1':['p43-side-length-activity'],'solve-2-step-equations-v1':['p59-example-group','p60-teaching']};
export const PROJECTS=Object.keys(TARGETS);
export function repairPairedBorders(source){return transform(source,'paired-borders',p=>{for(const id of TARGETS[p.id]??[]){const b=block(p,id);if(!b)continue;visit(b.content,n=>{if(n.type==='table'&&n.rows?.length===1&&n.rows[0].length===2&&n.rows[0].every(c=>c.blocks?.some(x=>x.inlines?.some(i=>i.type==='text'&&/Worked|Example|Your Turn/i.test(i.text)))))unborder(n);});}});}
await dryRunMain(import.meta.url,repairPairedBorders,PROJECTS);
