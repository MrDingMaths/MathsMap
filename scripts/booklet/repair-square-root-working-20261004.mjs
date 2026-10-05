import {transform,block,INK,dryRunMain} from './layout-repair-common-20261004.mjs';
export const PROJECTS=['simple-quadratic-equations-v1'];
export function repairSquareRootWorking(source){return transform(source,'square-root-working',p=>{if(p.id!==PROJECTS[0])return;const b=block(p,'p4-example-block');for(const e of b.examples){const op=e.prompt.blocks[1].inlines[0];op.latex=op.latex.replace(String.raw`\quad`,'=');e.prompt.blocks[0].inlines[0].colour=INK;e.equationAlignment={mode:'relation',align:'center'};}});}
await dryRunMain(import.meta.url,repairSquareRootWorking,PROJECTS);
