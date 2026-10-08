import {difficultyBandForScore} from './practice-question-model.js';

// Read existing assessments without creating a default rating.
export function questionDifficulty(block) {
  if(!block)return null;
  const candidates=block.bankRef?.id
    ? [block.flow?.bankDifficulty,block.classification,block.flow?.localDifficulty]
    : [block.classification,block.flow?.localDifficulty,block.flow?.bankDifficulty];
  const rating=candidates.find(r=>Number.isFinite(r?.reasoningScore)&&r.reasoningScore>=0&&r.reasoningScore<=100);
  return rating?{...rating,difficulty:difficultyBandForScore(rating.reasoningScore),difficultyReason:rating.difficultyReason??rating.reason??''}:null;
}

// Editor-only chilli markers scale with the reasoning score: lowest score earning each count.
export const CHILLI_THRESHOLDS=Object.freeze([65,80,87,94]);
export function chilliCount(score) {
  return Number.isFinite(score)?CHILLI_THRESHOLDS.filter(min=>score>=min).length:0;
}

// Bank-owned display metadata can refresh independently of pinned content.
export function applyBankRatings(project, items) {
  const ratings=new Map(items.filter(i=>i.bankDifficulty).map(i=>[i.blockId,i]));
  let changed=false;
  const sections=project.sections.map(section=>({...section,blocks:section.blocks.map(block=>{
    const item=ratings.get(block.id);
    if(!block.bankRef?.id||block.bankRef.id!==item?.bankId||!Number.isFinite(item?.bankDifficulty?.reasoningScore))return block;
    if(JSON.stringify(block.flow?.bankDifficulty)===JSON.stringify(item.bankDifficulty))return block;
    changed=true;
    return {...block,flow:{...block.flow,bankDifficulty:{...item.bankDifficulty}}};
  })}));
  return changed?{...project,sections}:project;
}
