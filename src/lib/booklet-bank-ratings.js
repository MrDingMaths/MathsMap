// Bank-owned display metadata can refresh independently of pinned content.
export function applyBankRatings(project, items) {
  const ratings=new Map(items.filter(i=>i.bankDifficulty).map(i=>[i.blockId,i]));
  let changed=false;
  const sections=project.sections.map(section=>({...section,blocks:section.blocks.map(block=>{
    const item=ratings.get(block.id);
    if(!block.flow?.bankDifficulty||!block.bankRef||block.bankRef.id!==item?.bankId)return block;
    if(JSON.stringify(block.flow.bankDifficulty)===JSON.stringify(item.bankDifficulty))return block;
    changed=true;
    return {...block,flow:{...block.flow,bankDifficulty:{...item.bankDifficulty}}};
  })}));
  return changed?{...project,sections}:project;
}
