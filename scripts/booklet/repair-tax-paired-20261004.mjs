import {transform,block,doc,heading,paired,retire,unborder,dryRunMain} from './layout-repair-common-20261004.mjs';
export const PROJECTS=['earning-money-v1'];
export function repairTaxPaired(source){return transform(source,'tax-paired',p=>{if(p.id!==PROJECTS[0])return;const b=block(p,'p61-example-block');if(b.sourceReview?.intentionalDepartures?.some(s=>String(s).includes('(tax-paired)')))return;
 const [left,right]=b.content.children,h=heading('p61-paired-headings');h.rows[0][0].blocks=left.prompt.blocks;h.rows[0][1].blocks=right.prompt.blocks;
 const givens=right.children[0],response=right.children[1],table=response.prompt.blocks[0],answers=response.answer.worked.blocks;
 b.sourceReview.layoutRepairProvenance={...(b.sourceReview.layoutRepairProvenance??{}),previousResponseAnswer:structuredClone(response.answer)};
 const turns=table.rows.map((row,i)=>{const id=i===2?response.id:row[0].id+'-response',t={...table,id:i===2?table.id:table.id+'-row-'+i,rows:[row],rowHeights:[table.rowHeights[i]],border:false};unborder(t);const selected=i===0?answers.slice(0,1):i===1?answers.slice(1,4):answers.slice(4);return {id,type:'part',label:'',prompt:doc([t]),responseSpace:'scaffold',answerSpaceMm:0,answer:{...response.answer,worked:doc(selected),...(i<2?{short:doc(selected.map(x=>({...x,id:x.id+'-stored-short'})))}:{})}};});
 for(const part of [...left.children,givens])for(const t of part.prompt.blocks)if(t.type==='table')unborder(t);
 retire(b,[left.id,right.id]);const parts=[left.children[0],givens,...left.children.slice(1).flatMap((part,i)=>[part,turns[i]])];paired(p,b,parts,h);
 b.sourceReview.responses=(b.sourceReview.responses??[]).filter(r=>r.targetId!==response.id);for(const t of turns)b.sourceReview.responses.push({targetId:t.id,kind:'working',label:'',scaffoldTargetId:t.prompt.blocks[0].id});
});}
await dryRunMain(import.meta.url,repairTaxPaired,PROJECTS);
