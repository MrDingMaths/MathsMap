import {contentNodes} from '../../src/lib/booklet-content-verification.js';
import {shadingCandidates} from '../../src/lib/diagram-shading.js';
import {solidHash,isSolidCandidate,imageSourceHash} from '../audit-solid-visibility.mjs';
export function importReviewSupplement(job){
 if(job.stage!=='assessment')return '';
 const nodes=[...contentNodes({sections:[{blocks:job.context.questions}]}).values()];
 const diagrams=nodes.filter(({node})=>node.format==='tikz'&&typeof node.code==='string').map(({node})=>({id:node.id,sourceHash:solidHash(node.code),fills:shadingCandidates(node.code),solid:isSolidCandidate(node.code)})).filter(d=>d.fills.length||d.solid);
 const images=nodes.filter(({node})=>node.format==='image'||node.type==='image').map(({node})=>({id:node.id,src:node.src??node.attrs?.src,assetHash:imageSourceHash(node.src??node.attrs?.src)}));
 return (diagrams.length?'\n\nIn this same source/content pass inspect every listed native diagram against its supplied source pixels and the exact code already in context.questions. Return diagramReviews:[{id,sourceHash,accepted,reason,fills:[{index,purpose:"mathematical|structural",reason}],visibility:for solid candidates {status:"accepted",reason}}]. Derive hidden edges from faces/view; remove decorative shading through exact-field repairs and preserve structural masks. If code changes, supply reviewedCode equal to final corrected code. This is no final-size visual acceptance.\n'+JSON.stringify(diagrams):'')+
  (images.length?'\n\nIn this same pass inspect retained image source geometry and purposeful photographic/mathematical shading. Return imageReviews:[{id,assetHash,accepted,sourceCompared:true,geometryVerified:true,shadingVerified:true,reason}]. Retained assets are attached after indexed source images, in this list order. Final-size visual checks remain required.\n'+JSON.stringify(images):'');
}
