import {createHash} from 'node:crypto';
import {verifiedRating,reasoningTaskHash} from '../scripts/booklet/reasoning-ratings.mjs';
const MODEL='claude-sonnet-5-5';
export const draftHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
// Shared by the generation lane and the final automatic-content boundary.
export function assertIndependentBackfillReview({draft,blocks,review}={}){
 const models=Object.keys(draft?.metrics?.modelUsage??{});
 if(!draft||draft.model!==MODEL||models.length!==1||models[0]!==MODEL||draft.kind!=='backfill'||draftHash(draft.result)!==draft.draftHash||review?.draftHash!==draft.draftHash||review.model!=='gpt-6.1-sol'||review.accepted!==true||review.findings?.length||review.answersVerified!==true||review.principlesVerified!==true||review.archetypeTaught!==true||review.inScope!==true||review.instructionalChange!==false)throw Error('Independent Sol review must verify the exact taught routine draft');
 if(!Array.isArray(blocks)||blocks.length!==draft.result.items?.length)throw Error('Reviewed block count mismatch');
 const sourceItems=new Map(draft.result.items.map(i=>[i.id,i])),ids=new Set(sourceItems.keys());
 for(const block of blocks)if(!ids.delete(block.id)||block.type!=='question'||block.pedagogyRole&&block.pedagogyRole!=='practice'||reasoningTaskHash(block)!==reasoningTaskHash({type:'question',content:sourceItems.get(block.id).content})||!verifiedRating(block)||block.classification.assessment.model!==review.model||block.classification.reasoningScore>=65)throw Error('Independently verified routine rating required for '+block.id);
 if(ids.size)throw Error('Independent review omitted a generated item');
 return blocks;
}
