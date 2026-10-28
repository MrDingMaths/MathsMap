// New teaching stays a draft until James approves the pilot finding and the
// independent answer/principles check. This module never invokes a provider.
import {bookletPrinciples} from './review.mjs';
export const NEW_CONTENT_MODEL='claude-sonnet-5-5';
export function newTeachingPrompt({kind,topic,styleExamples,archetype,root}={}){
 if(!['worked-example','guided-practice','backfill','bridge'].includes(kind))throw Error('Unknown new-content kind');
 if(!Array.isArray(styleExamples)||!styleExamples.length)throw Error('Supply this exercise\'s own style examples');
 return {model:NEW_CONTENT_MODEL,status:'draft-only',prompt:[
  'Generate only the requested '+kind+' draft with exactly claude-sonnet-5-5. Do not substitute another model. Match the supplied exercise tone, notation, question demands and taught method. Preserve explicit PSF factorisation where applicable. Prefer scaffolded bridging questions; add teaching only for a genuinely new archetype. No optional wording.',
  bookletPrinciples(root?{root}:{}),
  'Return the draft question, concise answer and worked solution, archetype, prerequisites and a principle-by-principle self-check. This self-check does not establish acceptance. Before any posting or use, a separate reviewer must independently derive every answer and option and check the same booklet principles; rate new practice with the existing rating configuration. Keep every draft pending James\'s approval. Never publish to the bank or apply to a live booklet.',
  JSON.stringify({topic,archetype,styleExamples})
 ].join('\n\n')};
}
