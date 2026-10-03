import { hashValue } from './campaign-sources.mjs';

// Independently reviewed mathematical outcomes are unchanged. This register is
// deliberately limited to the six diagnosed capture defects in this exact stage.
export const CAPTURE_PRESENTATION_BINDING = Object.freeze({
  skillId: 'compare-box-plots',
  stageHash: '8606fa97942d0cb348758e764a1a3750840cfaf64aa6358fca99da72c7352b74',
  outcomesHash: 'c7a374309bc267bde1a088565a88cab426c0e67d420cf83f818a3ba05111f254',
  findings: Object.freeze([
    ['practice.foundation[2].question_text', '0f0ee3fde7d848f17b437d1a4ae053e646379e5193c71a6795707b29ec98180d', 'a4501d1772a12af21dc91c664502d7655a23e3f480e0957c52faf60c915ffc4f'],
    ['practice.foundation[2].solution_text', 'e59a05ab7ebe45409243c600c0de3e78fa238729656991751c2bb7581a49e6a3', '47ad9d5efe9c47f75f280a6bb9248cd828ca8d913dd2d174428827e61baf40a5'],
    ['quiz.q2.question_text', '82661a3ea7212a769c49d94145d60ec37ef91c0d101a71045ee7f855a9696d3c', '7546e278f5be7e52fd765370b6b22039616ac7a840390cf1d441260c113546ee'],
    ['quiz.q2.solution_text', 'f9e9c001b77fb512317f75c2427b89f13c0c7252d0c5e9bbe9dc83857efc0a09', 'ef37480c681b65ac759d665e048763c81a0c828bb3a551d5bab9bc5bb0ca7ca0'],
    ['quiz.q4.question_text', 'c31c4526743345cb1a62bff1e34ef4925afbd7f05efdb5daf2b6f560a573c677', '5b637a1131aab6a5d5ed441e3a71bbbddabf12282b28fcac8289fd6cc6082dff'],
    ['quiz.q4.solution_text', 'c70e36110aae3146cec312d7c867a6fb94d974a36ab86b960e5e423af248b1c3', '94cb83642ec2f4485e290a7ba79fb7073c15206f5eec3fed1dc29cdce107e038'],
  ].map(row => Object.freeze(row))),
});

// Pure validation is also exercised with synthetic bindings. Callers handling
// worker input must select the trusted register themselves, never accept one.
export function validateBoundPresentationResolution(binding, state, resolution, checked) {
  const row = binding.findings.find(([where, findingHash]) => where === resolution.where && findingHash === resolution.findingHash);
  const finding = state.review.findings.find(item => hashValue(item) === resolution.findingHash);
  const field = state.review.requiredVisuals.find(item => item.where === resolution.where);
  if (state.skillId !== binding.skillId || state.stage.hash !== binding.stageHash || hashValue(state.review.outcomes) !== binding.outcomesHash || state.review.outcomes.some(item => item.verdict !== 'accepted') || !row || !finding || finding.where !== row[0] || field?.hash !== row[2] || resolution.outcome !== undefined || !resolution.observation?.trim()) {
    throw new Error('Capture presentation resolution requires the exact registered finding, field, stage and unchanged accepted mathematics');
  }
  if (!checked.some(item => item.where === row[0] && item.hash === row[2] && item.accepted === true && item.inspectionMode === 'fresh' && item.actualPixelInspection === true)) {
    throw new Error('Capture presentation resolution requires fresh actual current field inspection');
  }
  return { ...structuredClone(resolution), originalFinding: structuredClone(finding), preservedMathematicalOutcomesHash: binding.outcomesHash };
}
